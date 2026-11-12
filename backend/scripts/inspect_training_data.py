"""Audit the public Mendeley container log and extract a narrow, explicit learning target.

uv run --with openpyxl python -m scripts.inspect_training_data \
  --xlsx var/dataset-search/container-dwell.xlsx \
  --output var/training/container-dwell.csv --profile ../data/training/mendeley-profile.json
"""

import argparse
import csv
import hashlib
import json
from collections import Counter
from datetime import datetime
from pathlib import Path

EXPECTED_SHA256 = "fd4ddc8e50f57cceb84881461f85a142137785ca81f59b37165ae484412f7d8c"
COLUMNS = (
    "case_id",
    "CTR_SIZE",
    "CTR_TYPE",
    "GROSS",
    "YARD_BLOCK",
    "YARD_SLOT",
    "JOB_DEL_DOCTYPE",
    "activity",
    "Start Timestamp",
    "End Timestamp",
    "Duration",
    "Role",
)


def checksum(path):
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def cases_from_events(rows):
    cases, activities, quality, years = {}, Counter(), Counter(), Counter()
    anomalies = []
    first = last = None
    count = 0
    for row in rows:
        count += 1
        case_id, size, kind, gross = row[:4]
        activity, start, end = row[7:10]
        activities[str(activity)] += 1
        if not case_id:
            quality["missing_case_id"] += 1
            continue
        case = cases.setdefault(
            str(case_id),
            {"attributes": [], "discharge": [], "truck_out": [], "quality_issues": set()},
        )
        if not isinstance(start, datetime):
            quality["invalid_or_missing_start"] += 1
            case["quality_issues"].add("invalid_or_missing_event_time")
        if not isinstance(end, datetime):
            quality["invalid_or_missing_end"] += 1
            case["quality_issues"].add("invalid_or_missing_event_time")
            continue
        first = min(first, end) if first else end
        last = max(last, end) if last else end
        years[str(end.year)] += 1
        if end.year != 2021 or (isinstance(start, datetime) and start.year != 2021):
            quality["timestamp_outside_stated_2021_collection_year"] += 1
            case["quality_issues"].add("timestamp_outside_stated_2021_collection_year")
            if len(anomalies) < 20:
                anomalies.append(
                    {
                        "case_key": hashlib.sha256(str(case_id).encode()).hexdigest()[:24],
                        "activity": activity,
                        "start": str(start),
                        "end": str(end),
                    }
                )
        if isinstance(start, datetime) and start > end:
            quality["event_end_before_start"] += 1
            case["quality_issues"].add("event_end_before_start")
        if any(v is not None for v in (size, kind, gross)):
            case["attributes"].append((end, size, kind, gross))
        if activity == "DISCHARGE":
            case["discharge"].append(end)
        elif activity == "TRUCK_OUT":
            case["truck_out"].append(end)
        if count % 100000 == 0:
            print(f"Read {count:,} events", flush=True)
    return cases, {
        "event_rows": count,
        "unique_cases": len(cases),
        "activities": dict(activities),
        "event_quality": dict(quality),
        "end_timestamp_year_counts": dict(years),
        "timestamp_anomaly_examples": anomalies,
        "first_event_end_local": first.isoformat() if first else None,
        "last_event_end_local": last.isoformat() if last else None,
    }


def examples(cases):
    output, rejected = [], Counter()
    for case_id, case in cases.items():
        if case.get("quality_issues"):
            rejected["case_contains_timestamp_quality_issue"] += 1
            continue
        if len(case["discharge"]) != 1 or len(case["truck_out"]) != 1:
            rejected["missing_or_ambiguous_discharge_or_truck_out"] += 1
            continue
        observed, outcome = case["discharge"][0], case["truck_out"][0]
        duration = (outcome - observed).total_seconds() / 3600
        if duration < 0:
            rejected["truck_out_before_discharge"] += 1
            continue
        attributes = [None, None, None]
        # Do not fill blank input fields from events ending after the prediction moment.
        for end, *values in sorted(case["attributes"], key=lambda item: item[0]):
            if end <= observed:
                for index, value in enumerate(values):
                    if value is not None:
                        attributes[index] = value
        output.append(
            {
                "case_key": hashlib.sha256(case_id.encode()).hexdigest()[:24],
                "prediction_at_local": observed.isoformat(),
                "truck_out_at_local": outcome.isoformat(),
                "container_size": attributes[0],
                "container_type": attributes[1],
                "gross_tonnes": attributes[2],
                "hour": observed.hour,
                "weekday": observed.weekday(),
                "month": observed.month,
                "terminal_dwell_hours": duration,
            }
        )
    output.sort(key=lambda row: (row["prediction_at_local"], row["case_key"]))
    return output, dict(rejected)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--xlsx", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--profile", type=Path, required=True)
    args = parser.parse_args()
    actual_checksum = checksum(args.xlsx)
    if actual_checksum != EXPECTED_SHA256:
        raise SystemExit("Input does not match publisher checksum for dataset version 2")
    from openpyxl import load_workbook

    workbook = load_workbook(args.xlsx, read_only=True, data_only=True)
    try:
        sheet = workbook.worksheets[0]
        rows = sheet.iter_rows(values_only=True)
        if tuple(next(rows)) != COLUMNS:
            raise SystemExit("Unexpected dataset columns")
        cases, profile = cases_from_events(rows)
    finally:
        workbook.close()
    data, rejected = examples(cases)
    if not data:
        raise SystemExit("No eligible examples")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(data[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(data)
    durations = sorted(r["terminal_dwell_hours"] for r in data)
    profile.update(
        {
            "source": "https://data.mendeley.com/datasets/yvp2b4rtp3/2",
            "doi": "10.17632/yvp2b4rtp3.2",
            "license": "CC-BY-4.0",
            "source_sha256": actual_checksum,
            "training_csv_sha256": checksum(args.output),
            "eligible_cases": len(data),
            "rejected_cases": rejected,
            "candidate_status": "basic_cleaning_complete_for_terminal_dwell_experiment",
            "learning_target": "Hours from DISCHARGE end to TRUCK_OUT end",
            "feature_missing_counts": {
                key: sum(r[key] is None for r in data)
                for key in ("container_size", "container_type", "gross_tonnes")
            },
            "duration_hours": {
                name: durations[int((len(durations) - 1) * q)]
                for name, q in (("min", 0), ("p10", 0.1), ("median", 0.5), ("p90", 0.9), ("max", 1))
            },
            "limitations": [
                "Terminal identity anonymized; not Caspian training/validation",
                "Inbound container release, not outbound readiness or missed ferry cutoff",
                "Source timezone and information recording/publication times not provided",
                "Whole cases with missing event times, backwards events or non-2021 dates excluded",
                "Excluding incomplete or anomalous cases can introduce selection bias",
                "Event end time is only an assumed feature availability boundary",
                "Do not use case_key, truck_out_at_local or terminal_dwell_hours as model features",
                "Case IDs contain dates; future customs/quarantine events are excluded from inputs",
                "Do not attach Caspian weather to anonymized foreign terminal events",
            ],
        }
    )
    args.profile.parent.mkdir(parents=True, exist_ok=True)
    args.profile.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(profile, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
