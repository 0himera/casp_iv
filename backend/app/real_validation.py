"""Offline evidence audit. Weather agreement is never presented as cargo model accuracy."""

import csv
import hashlib
import json
import math
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

from bs4 import BeautifulSoup

from .sailings import local_full, parse_asco, parse_kuryk, record, text

MISSING_LOGISTICS_FIELDS = [
    "shipment_id",
    "prediction_issued_at",
    "input_available_at",
    "cargo_cutoff_at_with_timezone",
    "actual_cargo_ready_at_with_timezone",
    "actual_cargo_arrival_at_with_timezone",
    "confirmed_cargo_capacity",
]


def parse_ships(html):
    """Public ASCO fleet page. Its arrival column is explicitly an expectation."""
    soup = BeautifulSoup(html, "html.parser")
    items = []
    categories = []
    for table in soup.select("table"):
        headers = [text(h) for h in table.select("thead th")]
        base = ["Gəminin adı", "Çıxdığı liman", "Çıxma vaxtı", "Yan alacağı liman"]
        if headers == base + ["Gözlənilən çatma vaxtı", "Status"]:
            category = "underway"
        elif headers == base + ["Status"]:
            category = "in_port"
        else:
            raise ValueError("ASCO fleet columns changed")
        categories.append(category)
        for row in table.select("tbody tr"):
            cells = row.select("td")
            values = [text(c) for c in cells]
            if len(values) != len(headers):
                raise ValueError("ASCO fleet row changed")
            name = text(cells[0].select_one("a.link-muted") or cells[0])
            departure, departed, destination = values[1:4]
            arrival = values[4] if category == "underway" else ""
            item = record(
                "asco",
                name,
                category,
                values[-1],
                departure_port_raw=departure,
                destination_port_raw=destination,
                departure_at_local=local_full(departed) if departed != "-" else None,
                arrival_at_local=local_full(arrival) if arrival not in ("-", "") else None,
            )
            items.append(item.model_dump(mode="json") | {"source_id": "asco_ships"})
    if sorted(categories) != ["in_port", "underway"]:
        raise ValueError("ASCO fleet tables missing")
    return {"reported_date": None, "reported_at_local": None, "items": items}


def weather_series(payload, variable):
    if payload.get("utc_offset_seconds") != 0:
        raise ValueError("Expected weather UTC timestamps")
    if payload["hourly_units"].get(variable) != "m/s":
        raise ValueError("Expected wind speed in m/s")
    times, values = payload["hourly"]["time"], payload["hourly"][variable]
    if len(times) != len(values) or len(set(times)) != len(times):
        raise ValueError("Duplicate or misaligned weather times")
    result = {}
    for instant, value in zip(times, values, strict=True):
        timestamp = datetime.fromisoformat(instant)
        if timestamp.minute or timestamp.second or timestamp.tzinfo is not None:
            raise ValueError("Expected whole-hour naive UTC source time")
        if value is not None and (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or value < 0
        ):
            raise ValueError("Invalid wind measurement")
        result[instant + "Z"] = value
    return result


def pair_weather(port_id, forecast, reference, start, end):
    predicted = weather_series(forecast, "wind_speed_10m_previous_day1")
    actual = weather_series(reference, "wind_speed_10m")
    for timestamp in set(predicted) | set(actual):
        day = datetime.fromisoformat(timestamp).date()
        if not start <= day <= end:
            raise ValueError("Weather outside requested date range")
    rows = []
    for hour in range(((end - start).days + 1) * 24):
        timestamp = (
            datetime.combine(start, datetime.min.time()) + timedelta(hours=hour)
        ).isoformat(timespec="minutes") + "Z"
        rows.append(
            {
                "port_id": port_id,
                "time": timestamp,
                "forecast_24h_ms": predicted.get(timestamp),
                "era5_ms": actual.get(timestamp),
            }
        )
    return rows


def wind_metrics(rows):
    seen = set()
    errors = []
    for row in rows:
        key = row["port_id"], row["time"]
        if key in seen:
            raise ValueError("Duplicate port-hour would inflate evaluation sample")
        seen.add(key)
        predicted, reference = row["forecast_24h_ms"], row["era5_ms"]
        if predicted is None or reference is None:
            continue
        if not all(math.isfinite(v) and v >= 0 for v in (predicted, reference)):
            raise ValueError("Invalid paired value")
        errors.append(predicted - reference)
    if not errors:
        return {
            "pairs": 0,
            "missing_pairs": len(rows),
            "mae_ms": None,
            "rmse_ms": None,
            "bias_ms": None,
        }
    count = len(errors)
    return {
        "pairs": count,
        "missing_pairs": len(rows) - count,
        "mae_ms": sum(abs(v) for v in errors) / count,
        "rmse_ms": math.sqrt(sum(v * v for v in errors) / count),
        "bias_ms": sum(errors) / count,
    }


def operator_audit(snapshots):
    summaries = []
    by_source = {}
    for snapshot in snapshots:
        rows = snapshot["data"]["items"]
        by_source[snapshot["source_id"]] = {r["vessel_name"]: r for r in rows}
        summaries.append(
            {
                "source_id": snapshot["source_id"],
                "source_url": snapshot["source_url"],
                "fetched_at": snapshot["fetched_at"],
                "reported_at_local": snapshot["data"]["reported_at_local"],
                "reported_date": snapshot["data"]["reported_date"],
                "records": len(rows),
                "categories": dict(Counter(r["category"] for r in rows)),
                "weather_status_records": sum(r["weather_related"] for r in rows),
                "published_expected_arrivals": sum(r["arrival_at_local"] is not None for r in rows),
                "expected_approach_records": sum(r["category"] == "expected" for r in rows),
                "timezone_confirmed": False,
                "actual_cargo_ready_labels": 0,
                "actual_cargo_arrival_labels": 0,
            }
        )
    left, right = by_source.get("asco", {}), by_source.get("asco_ships", {})
    differences = [
        {
            "vessel_name": name,
            "cabinet_category": left[name]["category"],
            "ships_category": right[name]["category"],
        }
        for name in sorted(left.keys() & right.keys())
        if left[name]["category"] != right[name]["category"]
    ]
    return {
        "sources": summaries,
        "cross_page_category_differences": differences,
        "category_difference_is_not_ground_truth": True,
        "snapshots_may_have_different_scope_and_update_times": True,
    }


def make_report(rows, snapshots, start, end, generated_at):
    ids = sorted({row["port_id"] for row in rows})
    expected = ((end - start).days + 1) * 24
    coverage = {
        port_id: {
            **wind_metrics([r for r in rows if r["port_id"] == port_id]),
            "expected_hours": expected,
        }
        for port_id in ids
    }
    return {
        "generated_at": generated_at,
        "period": {"start": str(start), "end": str(end)},
        "logistics_model": {
            "method": "monte_carlo_readiness_v1",
            "status": "not_validated_on_real_shipments",
            "eligible_backtest_cases": 0,
            "eta_mae_hours": None,
            "cutoff_brier_score": None,
            "missing_fields": MISSING_LOGISTICS_FIELDS,
            "reason": "Public operator snapshots contain vessel states and expected times, "
            "not paired cargo forecasts and observed outcomes",
        },
        "weather_input_comparison": {
            "status": "evaluated" if wind_metrics(rows)["pairs"] else "no_data",
            "units": "m/s",
            "forecast": "Open-Meteo ECMWF IFS 0.25 degrees, previous_day1 (24h lead)",
            "reference": "Open-Meteo ERA5 reanalysis, not instrument observations",
            "is_logistics_model_accuracy": False,
            "is_independent_station_validation": False,
            "aggregate": wind_metrics(rows),
            "ports": coverage,
            "limitations": [
                "The selected fixed weather model does not evaluate every live best_match model",
                "ERA5 and IFS are related weather model products, not independent ground truth",
                "Coastal port measurements and sea-state/operating limits are not validated",
                "Port-hour samples are correlated; no independent-sample confidence claim",
                "No threshold or conversion from wind to cargo delay has been calibrated",
            ],
        },
        "operators": operator_audit(snapshots),
    }


def write_csv(path: Path, rows, fields):
    with path.open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def save_report(directory, report):
    (directory / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    )
    weather = report["weather_input_comparison"]
    metrics = weather["aggregate"]
    lines = [
        "# Проверка реальных данных Caspian Flow",
        "",
        "Основная модель задержек пока **не валидирована на реальных перевозках**.",
        "Доступных сопоставленных прогнозов/фактов груза: **0**. MAE ETA и Brier score: null.",
        "Ожидаемое прибытие судна не использовалось как фактическое прибытие груза.",
        "",
        f"Период погодной проверки: {report['period']['start']} — {report['period']['end']} UTC.",
        f"Сопоставлено {metrics['pairs']} пар порт-часов; "
        f"пропусков пар: {metrics['missing_pairs']}.",
        "Сравниваются архивный прогноз ECMWF IFS на 24 часа и реанализ ERA5.",
        f"Общие MAE: {metrics['mae_ms']}, RMSE: {metrics['rmse_ms']}, "
        f"bias: {metrics['bias_ms']} м/с.",
        "Это расхождение погодного входа с реанализом, не точность модели грузовых задержек.",
        "",
        "| Порт | Пар | MAE, м/с | RMSE, м/с | Bias, м/с |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]

    def number(value):
        return "null" if value is None else f"{value:.3f}"

    for port_id, values in weather["ports"].items():
        lines.append(
            f"| {port_id} | {values['pairs']} | {number(values['mae_ms'])} | "
            f"{number(values['rmse_ms'])} | {number(values['bias_ms'])} |"
        )
    lines.extend(
        [
            "",
            "ERA5 — модельный реанализ. Проверки по независимым станциям не было.",
            "Проверен один выбранный погодный продукт, не все модели live best_match.",
            "Часовые ряды коррелированы; число пар не равно числу независимых испытаний.",
            "",
            "## Судовые публикации",
            "",
            "| Источник | Строк | Статус связан с погодой | Строк с явным ETA |",
            "| --- | ---: | ---: | ---: |",
        ]
    )
    for source in report["operators"]["sources"]:
        lines.append(
            f"| [{source['source_id']}]({source['source_url']}) | {source['records']} | "
            f"{source['weather_status_records']} | {source['published_expected_arrivals']} |"
        )
    lines.extend(
        [
            "",
            "Различия охвата/категорий ASCO cabinet и ships перечислены в report.json.",
            "Это разные снимки/представления, их нельзя превращать в метки перехода судна.",
            "Часовые пояса публикаций не подтверждены; локальные даты не преобразованы в UTC.",
            "Время подходов Курыка хранится отдельно и также не считается фактом прибытия.",
            "",
            "## Что нужно для оценки основной модели",
            "",
            "История груза: выпуск прогноза и доступность входов, cutoff, фактическая готовность,",
            "фактическое прибытие и подтверждённое место на рейсе. Затем временная выборка",
            "проверки, ошибка медианного ETA, покрытие P10–P90 и Brier score пропуска cutoff.",
            "",
            "Численные результаты воспроизводятся из wind-pairs.csv без сетевых запросов.",
            "Происхождение, запросы и SHA-256 — manifest.json; полный raw локально в backend/var.",
            "",
            "Данные погоды: Open-Meteo, ECMWF IFS и ERA5/Copernicus (атрибуция источников).",
            "Метод архива: https://open-meteo.com/en/docs/previous-runs-api .",
            "Реанализ: https://open-meteo.com/en/docs/historical-weather-api .",
            "",
        ]
    )
    (directory / "report.md").write_text("\n".join(lines))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


PARSERS = {"asco": parse_asco, "kuryk": parse_kuryk, "asco_ships": parse_ships}
