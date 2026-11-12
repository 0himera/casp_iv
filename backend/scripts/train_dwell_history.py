"""Train one simple history-aware CatBoost; preserve v1 and its test population."""

import json
import time
from datetime import UTC, datetime

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor

from app.config import BACKEND_ROOT, REPOSITORY_ROOT
from app.dwell import DwellPredictor
from app.dwell_contract import FEATURES, QUANTILES, TASK, DwellRequest
from app.dwell_history import HISTORY_FEATURES
from scripts.train_terminal_dwell import (
    checksum,
    features,
    interval_metrics,
    rearrange,
    split_data,
)


def main():
    started = time.monotonic()
    source = BACKEND_ROOT / "var/training/container-dwell-history.csv"
    audit = json.loads(source.with_suffix(".audit.json").read_text())
    if checksum(source) != audit["history_csv_sha256"]:
        raise SystemExit("History table checksum mismatch")
    data = pd.read_csv(source, parse_dates=["prediction_at_local", "truck_out_at_local"])
    profile = json.loads((REPOSITORY_ROOT / "data/training/mendeley-profile.json").read_text())
    if audit["base_csv_sha256"] != profile["training_csv_sha256"]:
        raise SystemExit("History does not match audited v1 population")
    if data[list(HISTORY_FEATURES)].lt(0).any().any():
        raise SystemExit("Negative event age/count")
    implied = (data.truck_out_at_local - data.prediction_at_local).dt.total_seconds() / 3600
    if not np.allclose(implied, data.terminal_dwell_hours, rtol=0, atol=1e-8):
        raise SystemExit("Label mismatch")
    data = data[data.gross_tonnes.between(1, 60)].copy()
    split, split_audit = split_data(data)
    validation = split.pop("validation")
    split["validation"] = validation[validation.prediction_at_local < "2021-08-09"]
    split["calibration"] = validation[validation.prediction_at_local >= "2021-08-09"]
    names = [*FEATURES, *HISTORY_FEATURES]
    x = {k: pd.concat([features(f), f[list(HISTORY_FEATURES)]], axis=1) for k, f in split.items()}
    y = {k: f.terminal_dwell_hours.to_numpy() for k, f in split.items()}
    models, scores = {}, {}
    for depth in (4, 6):
        model = CatBoostRegressor(
            iterations=1200,
            depth=depth,
            learning_rate=0.04,
            loss_function="MultiQuantile:alpha=0.1,0.5,0.9",
            random_seed=42,
            thread_count=4,
            allow_writing_files=False,
            l2_leaf_reg=5,
        )
        model.fit(
            x["train"],
            y["train"],
            cat_features=["container_size", "container_type"],
            eval_set=(x["validation"], y["validation"]),
            early_stopping_rounds=100,
            verbose=400,
        )
        key = f"depth{depth}"
        models[key] = model
        scores[key] = interval_metrics(y["validation"], rearrange(model.predict(x["validation"])))
        print(key, scores[key], flush=True)
    selected = min(scores, key=lambda k: scores[k]["mean_pinball_hours"])
    model = models[selected]
    # Each offset is estimated only on later August cases, disjoint from model selection.
    # This is empirical temporal calibration, without an exchangeability coverage guarantee.
    raw_calibration = rearrange(model.predict(x["calibration"]))
    offsets = [
        float(np.quantile(y["calibration"] - raw_calibration[:, i], alpha))
        for i, alpha in enumerate(QUANTILES)
    ]
    base = CatBoostRegressor()
    base.load_model(str(REPOSITORY_ROOT / "models/terminal-dwell/v1/model.cbm"))
    base_calibration = rearrange(base.predict(x["calibration"][list(FEATURES)]))
    base_offsets = [
        float(np.quantile(y["calibration"] - base_calibration[:, i], alpha))
        for i, alpha in enumerate(QUANTILES)
    ]
    fallback = (
        DwellPredictor(None)
        .predict(
            DwellRequest(
                observed_at=datetime(2026, 11, 12, tzinfo=UTC),
                container_size=20,
                container_type="DRY",
                gross_tonnes=15,
            )
        )
        .remaining_hours
    )
    mc = np.array([fallback.p10, fallback.p50, fallback.p90])
    baseline_q = np.quantile(y["train"], QUANTILES)
    predictions = {
        "global_median": np.tile(baseline_q, (len(y["test"]), 1)),
        "monte_carlo": np.tile(mc, (len(y["test"]), 1)),
        "catboost_v1": rearrange(base.predict(x["test"][list(FEATURES)])),
        "history_raw": rearrange(model.predict(x["test"])),
    }
    predictions["catboost_v1_calibrated"] = rearrange(predictions["catboost_v1"] + base_offsets)
    predictions["history_calibrated"] = rearrange(predictions["history_raw"] + offsets)
    test = {k: interval_metrics(y["test"], q) for k, q in predictions.items()}
    # Promotion uses pre-calibration validation only, not September test scores.
    base_validation = interval_metrics(
        y["validation"], rearrange(base.predict(x["validation"][list(FEATURES)]))
    )
    mc_validation = interval_metrics(y["validation"], np.tile(mc, (len(y["validation"]), 1)))
    selected_score = scores[selected]
    promote = (
        selected_score["mean_pinball_hours"]
        < min(base_validation["mean_pinball_hours"], mc_validation["mean_pinball_hours"])
        and selected_score["mae_hours"]
        <= min(base_validation["mae_hours"], mc_validation["mae_hours"]) * 1.02
    )
    output = REPOSITORY_ROOT / "models/terminal-dwell/v2"
    output.mkdir(parents=True, exist_ok=True)
    model.save_model(str(output / "model.cbm"))
    roundtrip = CatBoostRegressor()
    roundtrip.load_model(str(output / "model.cbm"))
    if not np.allclose(roundtrip.predict(x["test"]), model.predict(x["test"])):
        raise RuntimeError("Saved weights differ")
    metadata = {
        "version": "terminal-dwell-catboost-v2",
        "task": TASK,
        "features": names,
        "quantiles": list(QUANTILES),
        "model_sha256": checksum(output / "model.cbm"),
        "quantile_offsets_hours": offsets,
        "serving_enabled": bool(promote),
        "input_domain": json.loads(
            (REPOSITORY_ROOT / "models/terminal-dwell/v1/metadata.json").read_text()
        )["input_domain"],
        "trained_on_history": True,
        "caspian_validated": False,
        "source_doi": profile["doi"],
        "source_license": profile["license"],
        "task_definition": "Hours from DISCHARGE end to TRUCK_OUT end",
        "requires_history": True,
    }
    report = {
        "generated_at": datetime.now(UTC).isoformat(),
        "seed": 42,
        "input_audit": audit,
        "training_script_sha256": checksum(__file__),
        "feature_script_sha256": checksum(BACKEND_ROOT / "app/dwell_history.py"),
        "features": names,
        "split": split_audit,
        "selection_period": "2021-08-01 inclusive to 2021-08-09 exclusive",
        "calibration_period": "2021-08-09 inclusive to 2021-08-16 exclusive",
        "calibration_outcomes_known_before": "2021-09-01",
        "rows": {k: len(f) for k, f in split.items()},
        "selection_metric": "validation mean pinball before calibration",
        "selected": selected,
        "trees": model.tree_count_,
        "validation": scores | {"v1": base_validation, "monte_carlo": mc_validation},
        "quantile_offsets_hours": offsets,
        "v1_offsets_hours": base_offsets,
        "serving_enabled": bool(promote),
        "promotion_rule": "Validation pinball improves over v1 and MC; MAE <= best * 1.02",
        "test": test,
        "feature_importance": dict(zip(names, map(float, model.feature_importances_), strict=True)),
        "limitations": [
            "September period already explored; results are not independent confirmation",
            "Completed-case selection and right truncation remain unresolved",
            "Anonymized terminal; no Caspian validation or outbound ferry target",
            "Event ends proxy availability; source timezone/recorded_at unknown",
            "Temporal residual calibration has no guaranteed coverage under drift",
            "v1 had used the whole August validation period; comparison is exploratory",
        ],
        "elapsed_seconds": round(time.monotonic() - started, 2),
    }
    for name, payload in (("metadata.json", metadata), ("report.json", report)):
        (output / name).write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n")
    table = split["test"][["case_key", "prediction_at_local", "terminal_dwell_hours"]].copy()
    for name, q in predictions.items():
        for i, label in enumerate(("p10", "p50", "p90")):
            table[f"{name}_{label}"] = q[:, i]
    # Full audit predictions stay local; aggregate metrics and weights are versioned.
    table.to_csv(BACKEND_ROOT / "var/training/history-test-predictions.csv", index=False)
    print(json.dumps({"serving_enabled": bool(promote), "test": test}, indent=2), flush=True)


if __name__ == "__main__":
    main()
