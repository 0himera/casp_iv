"""Reproducible, time-separated terminal dwell experiment; no model/Casper side effects on import.

uv run --group ml python -m scripts.train_terminal_dwell
"""

import argparse
import hashlib
import importlib.metadata
import json
import time
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder

from app.config import BACKEND_ROOT, REPOSITORY_ROOT
from app.dwell_contract import FEATURES, QUANTILES, TASK, feature_row, ordered_quantiles

SEED = 42
TRAIN_START, TRAIN_END = "2021-07-01", "2021-08-01"
VALID_START, VALID_END, VALID_KNOWN = "2021-08-01", "2021-08-16", "2021-09-01"
TEST_START, TEST_END = "2021-09-01", "2021-09-16"


def checksum(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def split_data(data):
    """One row per case; historical fitting/selection never sees an outcome from its future."""
    if data.case_key.duplicated().any():
        raise ValueError("Duplicate case would leak between subsets")
    if (data.truck_out_at_local < data.prediction_at_local).any():
        raise ValueError("Outcome precedes prediction")
    cohorts = {
        "train": data[
            (data.prediction_at_local >= TRAIN_START) & (data.prediction_at_local < TRAIN_END)
        ],
        "validation": data[
            (data.prediction_at_local >= VALID_START) & (data.prediction_at_local < VALID_END)
        ],
        "test": data[
            (data.prediction_at_local >= TEST_START) & (data.prediction_at_local < TEST_END)
        ],
    }
    split = {
        "train": cohorts["train"][cohorts["train"].truck_out_at_local < TRAIN_END].copy(),
        "validation": cohorts["validation"][
            cohorts["validation"].truck_out_at_local < VALID_KNOWN
        ].copy(),
        "test": cohorts["test"].copy(),
    }
    for name, frame in split.items():
        if len(frame) < 100:
            raise ValueError("Insufficient examples in " + name)
    audit = {
        name: {
            "cohort_rows": len(cohorts[name]),
            "used_rows": len(frame),
            "purged_unknown_outcomes": len(cohorts[name]) - len(frame),
            "first_prediction": frame.prediction_at_local.min().isoformat(),
            "last_prediction": frame.prediction_at_local.max().isoformat(),
            "latest_outcome": frame.truck_out_at_local.max().isoformat(),
        }
        for name, frame in split.items()
    }
    audit["excluded_outside_prediction_windows"] = len(data) - sum(map(len, cohorts.values()))
    return split, audit


def features(frame):
    rows = [
        feature_row(r.container_size, r.container_type, r.gross_tonnes, r.prediction_at_local)
        for r in frame.itertuples()
    ]
    return pd.DataFrame(rows, columns=FEATURES, index=frame.index)


def point_metrics(y, prediction):
    errors = np.asarray(prediction) - np.asarray(y)
    return {
        "mae_hours": float(np.abs(errors).mean()),
        "rmse_hours": float(np.sqrt(np.square(errors).mean())),
        "median_absolute_error_hours": float(np.median(np.abs(errors))),
        "p90_absolute_error_hours": float(np.quantile(np.abs(errors), 0.9)),
        "bias_hours": float(errors.mean()),
    }


def interval_metrics(y, prediction):
    q = np.asarray(prediction, dtype=float)
    target = np.asarray(y, dtype=float)
    losses = {}
    for index, alpha in enumerate(QUANTILES):
        error = target - q[:, index]
        losses[str(alpha)] = float(np.maximum(alpha * error, (alpha - 1) * error).mean())
    return {
        **point_metrics(target, q[:, 1]),
        "pinball_hours": losses,
        "mean_pinball_hours": float(np.mean(list(losses.values()))),
        "p10_p90_coverage": float(((target >= q[:, 0]) & (target <= q[:, 2])).mean()),
        "mean_interval_width_hours": float((q[:, 2] - q[:, 0]).mean()),
        "below_p10_fraction": float((target < q[:, 0]).mean()),
        "above_p90_fraction": float((target > q[:, 2]).mean()),
    }


def rearrange(prediction):
    return np.asarray([ordered_quantiles(row) for row in prediction])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", type=Path, default=BACKEND_ROOT / "var/training/container-dwell.csv"
    )
    parser.add_argument("--output", type=Path, default=REPOSITORY_ROOT / "models/terminal-dwell/v1")
    args = parser.parse_args()
    started = time.monotonic()
    profile_path = REPOSITORY_ROOT / "data/training/mendeley-profile.json"
    profile = json.loads(profile_path.read_text())
    if checksum(args.input) != profile["training_csv_sha256"]:
        raise SystemExit("Training data differs from audited profile")
    data = pd.read_csv(args.input, parse_dates=["prediction_at_local", "truck_out_at_local"])
    implied = (data.truck_out_at_local - data.prediction_at_local).dt.total_seconds() / 3600
    if not np.allclose(implied, data.terminal_dwell_hours, rtol=0, atol=1e-8):
        raise SystemExit("Label mismatch")
    source_rows = len(data)
    # Published GROSS contains two scales (~2–34 and ~2000–34000). Units were not
    # documented per record. Keep the physically plausible tonne subset; do not guess conversions.
    data = data[data.gross_tonnes.between(1, 60)].copy()
    mass_policy = {
        "source_rows": source_rows,
        "retained_rows": len(data),
        "excluded_ambiguous_mass_rows": source_rows - len(data),
        "accepted_gross_tonnes": [1, 60],
        "conversion_guessed": False,
    }
    splits, audit = split_data(data)
    print(json.dumps(audit, indent=2), flush=True)
    x = {name: features(frame) for name, frame in splits.items()}
    y = {name: frame.terminal_dwell_hours.to_numpy() for name, frame in splits.items()}
    baseline_q = np.quantile(y["train"], QUANTILES)
    group_q = (
        splits["train"]
        .groupby(["container_size", "container_type"])["terminal_dwell_hours"]
        .quantile(list(QUANTILES))
        .unstack()
    )

    def grouped(frame):
        return np.asarray(
            [
                group_q.loc[(r.container_size, r.container_type)].to_numpy()
                if (r.container_size, r.container_type) in group_q.index
                else baseline_q
                for r in frame.itertuples()
            ]
        )

    validation = {
        "global_median": interval_metrics(
            y["validation"], np.tile(baseline_q, (len(y["validation"]), 1))
        ),
        "type_size_median": interval_metrics(y["validation"], grouped(splits["validation"])),
    }
    candidates, cat_models, forests = [], {}, {}
    # Fixed small search. The held-out test window is not evaluated until selection is frozen.
    for depth in (4, 6):
        name = f"catboost_quantile_depth{depth}"
        params = {
            "iterations": 1600,
            "depth": depth,
            "learning_rate": 0.04,
            "loss_function": "MultiQuantile:alpha=0.1,0.5,0.9",
            "random_seed": SEED,
            "thread_count": 4,
            "allow_writing_files": False,
            "l2_leaf_reg": 5,
        }
        model = CatBoostRegressor(**params)
        model.fit(
            x["train"],
            y["train"],
            cat_features=["container_size", "container_type"],
            eval_set=(x["validation"], y["validation"]),
            early_stopping_rounds=120,
            verbose=400,
        )
        prediction = rearrange(model.predict(x["validation"]))
        validation[name] = interval_metrics(y["validation"], prediction)
        candidates.append({"name": name, "parameters": params, "trees": model.tree_count_})
        cat_models[name] = model
        print(name, validation[name], flush=True)

    transform = ColumnTransformer(
        [
            (
                "category",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                ["container_size", "container_type"],
            ),
        ],
        remainder="passthrough",
    )
    train_numeric = transform.fit_transform(x["train"])
    validation_numeric = transform.transform(x["validation"])
    for log_target in (False, True):
        name = "random_forest_log" if log_target else "random_forest"
        forest = RandomForestRegressor(
            n_estimators=240,
            max_depth=12,
            min_samples_leaf=30,
            max_features=1.0,
            random_state=SEED,
            n_jobs=4,
        )
        forest.fit(train_numeric, np.log1p(y["train"]) if log_target else y["train"])
        predicted = forest.predict(validation_numeric)
        if log_target:
            predicted = np.expm1(predicted)
        validation[name] = point_metrics(y["validation"], predicted)
        forests[name] = (forest, log_target)
        print(name, validation[name], flush=True)

    chosen = min(cat_models, key=lambda name: validation[name]["mean_pinball_hours"])
    # Freeze the quantile package on validation pinball loss. RF is a point-estimate benchmark.
    selected = cat_models[chosen]
    test_predictions = {
        "global_median": np.tile(baseline_q, (len(y["test"]), 1)),
        "type_size_median": grouped(splits["test"]),
        "catboost": rearrange(selected.predict(x["test"])),
    }
    test = {
        name: interval_metrics(y["test"], prediction)
        for name, prediction in test_predictions.items()
    }
    test_numeric = transform.transform(x["test"])
    for name, (forest, log_target) in forests.items():
        prediction = forest.predict(test_numeric)
        if log_target:
            prediction = np.expm1(prediction)
        test_predictions[name] = prediction
        test[name] = point_metrics(y["test"], prediction)
    args.output.mkdir(parents=True, exist_ok=True)
    selected.save_model(str(args.output / "model.cbm"))
    # Roundtrip verifies that saved weights reproduce the actual scored, serving-order output.
    reloaded = CatBoostRegressor()
    reloaded.load_model(str(args.output / "model.cbm"))
    if not np.allclose(rearrange(reloaded.predict(x["test"])), test_predictions["catboost"]):
        raise RuntimeError("Model save/load changed predictions")
    domain = {
        "container_sizes": sorted(x["train"].container_size.unique().tolist()),
        "container_types": sorted(x["train"].container_type.unique().tolist()),
        "gross_min": float(x["train"].gross_tonnes.min()),
        "gross_max": float(x["train"].gross_tonnes.max()),
    }
    metadata = {
        "version": "terminal-dwell-catboost-v1",
        "task": TASK,
        "features": list(FEATURES),
        "quantiles": list(QUANTILES),
        "model_sha256": checksum(args.output / "model.cbm"),
        "input_domain": domain,
        "trained_on_history": True,
        "caspian_validated": False,
        "source_doi": profile["doi"],
        "source_license": profile["license"],
        "feature_availability": "event end timestamps; recorded_at not supplied",
        "task_definition": "Hours from DISCHARGE end to TRUCK_OUT end",
        "selected_candidate": chosen,
    }
    report = {
        "generated_at": datetime.now(UTC).isoformat(),
        "seed": SEED,
        "input_sha256": checksum(args.input),
        "feature_quality_policy": mass_policy,
        "training_script_sha256": checksum(__file__),
        "source_profile_sha256": checksum(profile_path),
        "versions": {
            name: importlib.metadata.version(name)
            for name in ("catboost", "scikit-learn", "pandas", "numpy")
        },
        "features": list(FEATURES),
        "split": audit,
        "candidates": candidates,
        "selection": {
            "candidate": chosen,
            "metric": "validation_mean_pinball_hours",
            "refit_on_test": False,
        },
        "validation": validation,
        "test": test,
        "caspian_validated": False,
        "limitations": [
            "Anonymized terminal; import release differs from outbound ferry readiness",
            "Source timezone and publication/recording timestamps unavailable",
            "Case-based feature availability inferred from event end times",
            "Completed-case selection and right truncation can bias results",
            "Test predictions restricted to first half of September, leaving a follow-up buffer",
            "Historical fitting excludes outcomes unavailable at training/selection cutoffs",
            "Only static container/calendar features; weather, capacity and live queue not trained",
            "No calibration to Caspian terminals, no learned ferry cutoff classifier",
            "Mass-unit filtering changes the evaluated population; conversion was not inferred",
            "Unfiltered pilot saw this test period; external confirmation is still needed",
        ],
        "elapsed_seconds": round(time.monotonic() - started, 2),
    }
    for name, payload in (("metadata.json", metadata), ("report.json", report)):
        (args.output / name).write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n")
    predictions = splits["test"][
        ["case_key", "prediction_at_local", "truck_out_at_local", "terminal_dwell_hours"]
    ].copy()
    for name, values in test_predictions.items():
        if values.ndim == 1:
            predictions[name] = values
        else:
            for index, label in enumerate(("p10", "p50", "p90")):
                predictions[name + "_" + label] = values[:, index]
    predictions.to_csv(args.output / "test-predictions.csv", index=False, lineterminator="\n")
    print(
        json.dumps(
            {"selected": chosen, "test": test, "model_sha256": metadata["model_sha256"]}, indent=2
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()
