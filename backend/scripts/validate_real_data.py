"""Download public evidence or reproduce the report offline. No signing keys or chain writes.

cd backend && uv run python -m scripts.validate_real_data --output ../data/validation/2026-11-12
uv run python -m scripts.validate_real_data --replay ../data/validation/2026-11-12
"""

import argparse
import asyncio
import csv
import hashlib
import json
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

import httpx

from app.config import BACKEND_ROOT, REPOSITORY_ROOT
from app.real_validation import PARSERS, digest, make_report, pair_weather, save_report, write_csv
from app.sailings import URLS


async def collect(output, start, end):
    output.mkdir(parents=True, exist_ok=False)
    raw_root = BACKEND_ROOT / "var/real-validation-raw" / output.name
    raw_root.mkdir(parents=True, exist_ok=True)
    manifest, rows, snapshots, failures = [], [], [], []
    semaphore = asyncio.Semaphore(2)
    ports = [
        p
        for p in json.loads((REPOSITORY_ROOT / "data/ports.json").read_text())["ports"]
        if p["latitude"] is not None and p["portwatch_id"]
    ]

    async with httpx.AsyncClient(timeout=40, follow_redirects=False) as client:

        async def fetch(source_id, url, params=None):
            request_key = hashlib.sha256(
                json.dumps([url, params], sort_keys=True).encode()
            ).hexdigest()
            raw_path = raw_root / (request_key + ".raw")
            meta_path = raw_root / (request_key + ".meta.json")
            if raw_path.exists() and meta_path.exists():
                metadata = json.loads(meta_path.read_text())
                metadata["reused_local_snapshot"] = True
                if metadata["raw_sha256"] != digest(raw_path):
                    raise ValueError("Cached raw checksum mismatch")
                manifest.append(metadata)
                return raw_path.read_bytes()
            error = None
            for _attempt in range(2):
                try:
                    async with semaphore:
                        response = await client.get(url, params=params)
                    response.raise_for_status()
                    raw_path.write_bytes(response.content)
                    metadata = {
                        "source_id": source_id,
                        "url": str(response.url),
                        "fetched_at": datetime.now(UTC).isoformat(),
                        "raw_sha256": digest(raw_path),
                        "http_status": response.status_code,
                    }
                    meta_path.write_text(json.dumps(metadata, indent=2))
                    manifest.append(metadata)
                    return response.content
                except (httpx.HTTPError, ValueError) as exc:
                    error = type(exc).__name__
            failures.append({"source_id": source_id, "url": url, "error": error})
            return None

        async def weather(port):
            params = {
                "latitude": port["latitude"],
                "longitude": port["longitude"],
                "start_date": str(start),
                "end_date": str(end),
                "timezone": "UTC",
                "wind_speed_unit": "ms",
            }
            forecast, reference = await asyncio.gather(
                fetch(
                    port["id"] + ":forecast24h",
                    "https://previous-runs-api.open-meteo.com/v1/forecast",
                    params | {"hourly": "wind_speed_10m_previous_day1", "models": "ecmwf_ifs025"},
                ),
                fetch(
                    port["id"] + ":era5",
                    "https://archive-api.open-meteo.com/v1/archive",
                    params | {"hourly": "wind_speed_10m", "models": "era5"},
                ),
            )
            if forecast is not None and reference is not None:
                f, r = json.loads(forecast), json.loads(reference)
                if f.get("error") or r.get("error"):
                    failures.append({"source_id": port["id"], "error": "Provider JSON error"})
                    return
                try:
                    rows.extend(pair_weather(port["id"], f, r, start, end))
                    for name, payload in ((":forecast24h", f), (":era5", r)):
                        entry = next(m for m in manifest if m["source_id"] == port["id"] + name)
                        entry["requested_location"] = [port["latitude"], port["longitude"]]
                        entry["grid_location"] = [payload["latitude"], payload["longitude"]]
                except (ValueError, KeyError) as exc:
                    failures.append({"source_id": port["id"], "error": str(exc)})

        async def operator(source_id, url):
            raw = await fetch(source_id, url)
            if raw is not None:
                metadata = next(m for m in manifest if m["source_id"] == source_id)
                try:
                    snapshots.append(
                        {
                            "source_id": source_id,
                            "source_url": url,
                            "fetched_at": metadata["fetched_at"],
                            "data": PARSERS[source_id](raw.decode("utf-8")),
                        }
                    )
                except Exception as exc:
                    failures.append({"source_id": source_id, "error": type(exc).__name__})

        await asyncio.gather(
            *(weather(port) for port in ports),
            *(
                operator(source_id, url)
                for source_id, url in (
                    list(URLS.items()) + [("asco_ships", "https://ships.asco.az/")]
                )
            ),
        )
    rows.sort(key=lambda r: (r["port_id"], r["time"]))
    snapshots.sort(key=lambda s: s["source_id"])
    write_csv(output / "wind-pairs.csv", rows, ["port_id", "time", "forecast_24h_ms", "era5_ms"])
    (output / "operator-snapshots.json").write_text(
        json.dumps(snapshots, ensure_ascii=False, indent=2) + "\n"
    )
    metadata = {
        "generated_at": datetime.now(UTC).isoformat(),
        "period": {"start": str(start), "end": str(end)},
        "requested_ports": [p["id"] for p in ports],
        "sources": manifest,
        "failures": failures,
        "files": {
            name: digest(output / name) for name in ("wind-pairs.csv", "operator-snapshots.json")
        },
    }
    (output / "manifest.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    return replay(output)


def replay(directory):
    manifest = json.loads((directory / "manifest.json").read_text())
    for name, checksum in manifest["files"].items():
        if digest(directory / name) != checksum:
            raise ValueError("Normalized input checksum mismatch: " + name)
    with (directory / "wind-pairs.csv").open() as stream:
        rows = list(csv.DictReader(stream))
    for row in rows:
        for name in ("forecast_24h_ms", "era5_ms"):
            row[name] = float(row[name]) if row[name] else None
    report = make_report(
        rows,
        json.loads((directory / "operator-snapshots.json").read_text()),
        date.fromisoformat(manifest["period"]["start"]),
        date.fromisoformat(manifest["period"]["end"]),
        manifest["generated_at"],
    )
    report["download_failures"] = manifest["failures"]
    report["collection_status"] = "partial" if manifest["failures"] else "complete"
    report["weather_input_comparison"]["requested_ports"] = manifest["requested_ports"]
    if any(
        f["source_id"].split(":")[0] in manifest["requested_ports"] for f in manifest["failures"]
    ):
        report["weather_input_comparison"]["status"] = "partial_or_failed_downloads"
    save_report(directory, report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--replay", type=Path)
    parser.add_argument(
        "--end", type=date.fromisoformat, default=(datetime.now(UTC) - timedelta(days=7)).date()
    )
    parser.add_argument("--days", type=int, default=30)
    args = parser.parse_args()
    if bool(args.output) == bool(args.replay):
        parser.error("Choose exactly one of --output or --replay")
    if not 1 <= args.days <= 90 or args.end >= datetime.now(UTC).date():
        parser.error("Use 1–90 historical days")
    report = (
        replay(args.replay)
        if args.replay
        else asyncio.run(collect(args.output, args.end - timedelta(days=args.days - 1), args.end))
    )
    print(
        json.dumps(
            {
                "logistics": report["logistics_model"]["status"],
                "weather": report["weather_input_comparison"]["aggregate"],
                "failures": report["download_failures"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
