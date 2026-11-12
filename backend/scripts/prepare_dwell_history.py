"""Add past-only history to the audited v1 population, without changing labels or splits."""

import argparse
import csv
import hashlib
import json
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook

from app.config import BACKEND_ROOT
from app.dwell_history import HISTORY_FEATURES, history_features
from scripts.inspect_training_data import COLUMNS, EXPECTED_SHA256, checksum


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--xlsx", type=Path, default=BACKEND_ROOT / "var/dataset-search/container-dwell.xlsx"
    )
    parser.add_argument(
        "--base", type=Path, default=BACKEND_ROOT / "var/training/container-dwell.csv"
    )
    parser.add_argument(
        "--output", type=Path, default=BACKEND_ROOT / "var/training/container-dwell-history.csv"
    )
    args = parser.parse_args()
    if checksum(args.xlsx) != EXPECTED_SHA256:
        raise SystemExit("Unexpected source checksum")
    with args.base.open() as stream:
        base = list(csv.DictReader(stream))
    observed = {r["case_key"]: datetime.fromisoformat(r["prediction_at_local"]) for r in base}
    histories = {key: [] for key in observed}
    keys = {}
    workbook = load_workbook(args.xlsx, read_only=True, data_only=True)
    try:
        rows = workbook.worksheets[0].iter_rows(values_only=True)
        if tuple(next(rows)) != COLUMNS:
            raise SystemExit("Unexpected columns")
        for index, row in enumerate(rows, 1):
            case_id = str(row[0])
            if case_id not in keys:
                keys[case_id] = hashlib.sha256(case_id.encode()).hexdigest()[:24]
            key = keys[case_id]
            if key in observed:
                name, end = str(row[7]).strip(), row[9]
                if isinstance(end, datetime) and end <= observed[key] and name != "DISCHARGE":
                    histories[key].append((name, end))
            if index % 200000 == 0:
                print(f"Read {index:,} events", flush=True)
    finally:
        workbook.close()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="") as stream:
        writer = csv.DictWriter(
            stream, fieldnames=[*base[0], *HISTORY_FEATURES], lineterminator="\n"
        )
        writer.writeheader()
        for row in base:
            key = row["case_key"]
            values = history_features(histories[key], observed[key])
            writer.writerow(row | dict(zip(HISTORY_FEATURES, values, strict=True)))
    audit = {
        "source_sha256": EXPECTED_SHA256,
        "base_csv_sha256": checksum(args.base),
        "history_csv_sha256": checksum(args.output),
        "rows": len(base),
        "features_added": list(HISTORY_FEATURES),
        "availability": "Only event ends <= DISCHARGE end; recorded_at not supplied",
        "max_history_events": max(map(len, histories.values())),
        "preparation_script_sha256": checksum(Path(__file__)),
        "feature_script_sha256": checksum(BACKEND_ROOT / "app/dwell_history.py"),
    }
    args.output.with_suffix(".audit.json").write_text(json.dumps(audit, indent=2) + "\n")
    # Small local replay fixture from the real source; no future event is sent to the API.
    eligible = [
        r
        for r in base
        if "2021-09-01" <= r["prediction_at_local"] < "2021-09-16"
        and 1 <= float(r["gross_tonnes"]) <= 60
    ]
    replay = []
    for index in range(25):
        row = eligible[index * (len(eligible) - 1) // 24]
        replay.append(
            {
                "case_key": row["case_key"],
                "body": {
                    "observed_at": row["prediction_at_local"] + "+00:00",
                    "container_size": int(row["container_size"]),
                    "container_type": row["container_type"],
                    "gross_tonnes": float(row["gross_tonnes"]),
                    "history": [
                        {"activity": name, "completed_at": end.isoformat() + "+00:00"}
                        for name, end in histories[row["case_key"]]
                    ],
                },
            }
        )
    (args.output.parent / "history-http-cases.json").write_text(json.dumps(replay, indent=2) + "\n")
    print(json.dumps(audit, indent=2), flush=True)


if __name__ == "__main__":
    main()
