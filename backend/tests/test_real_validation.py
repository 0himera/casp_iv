import json
from datetime import date

import pytest

from app.real_validation import make_report, pair_weather, parse_ships, weather_series, wind_metrics
from scripts.validate_real_data import replay


def series(variable, values, times=None):
    return {
        "utc_offset_seconds": 0,
        "hourly_units": {variable: "m/s"},
        "hourly": {
            "time": times or [f"2026-10-07T{hour:02}:00" for hour in range(len(values))],
            variable: values,
        },
    }


def test_weather_alignment_missing_hours_and_units():
    # Reverse order in one source. Alignment must use timestamps, never array positions.
    forecast = series("wind_speed_10m_previous_day1", [2, 6])
    reference = series("wind_speed_10m", [4, 1], ["2026-10-07T01:00", "2026-10-07T00:00"])
    day = date(2026, 10, 7)
    rows = pair_weather("aktau", forecast, reference, day, day)
    result = wind_metrics(rows)
    assert result["pairs"] == 2 and result["missing_pairs"] == 22
    assert result["mae_ms"] == 1.5 and result["bias_ms"] == 1.5
    assert result["rmse_ms"] == pytest.approx((2.5) ** 0.5)
    assert rows[-1]["era5_ms"] is None  # Missing hour is never zero wind.
    forecast["hourly_units"]["wind_speed_10m_previous_day1"] = "km/h"
    with pytest.raises(ValueError, match="m/s"):
        pair_weather("aktau", forecast, reference, day, day)


def test_duplicate_and_invalid_weather_cannot_inflate_metrics():
    invalid = series("wind_speed_10m", [1, 2], ["2026-10-07T00:00"] * 2)
    with pytest.raises(ValueError, match="Duplicate"):
        weather_series(invalid, "wind_speed_10m")
    row = {"port_id": "a", "time": "t", "forecast_24h_ms": 1, "era5_ms": 2}
    with pytest.raises(ValueError, match="Duplicate"):
        wind_metrics([row, row])
    assert wind_metrics([{**row, "era5_ms": None}])["mae_ms"] is None
    with pytest.raises(ValueError, match="Invalid wind"):
        weather_series(series("wind_speed_10m", [float("nan")]), "wind_speed_10m")


def test_vessel_expected_arrival_cannot_become_cargo_ground_truth():
    # Synthetic parser fixture, deliberately not used as real evidence.
    header = "<th>Gəminin adı</th><th>Çıxdığı liman</th><th>Çıxma vaxtı</th>" + (
        "<th>Yan alacağı liman</th>"
    )
    html = f"""<table><thead>{header}<th>Gözlənilən çatma vaxtı</th><th>Status</th></thead>
        <tbody><tr><td><a class="link-muted">Example ship</a></td><td>Ələt</td>
        <td>07/10/2026 00:00</td><td>Kurık</td><td>08/10/2026 12:00</td>
        <td>Lövbərdə - Hava şəraiti</td></tr></tbody></table>
        <table><thead>{header}<th>Status</th></thead><tbody></tbody></table>"""
    parsed = parse_ships(html)
    row = parsed["items"][0]
    assert row["arrival_at_local"] == "2026-10-08T12:00:00"
    assert row["weather_related"] and row["timezone"] is None
    report = make_report(
        [],
        [
            {
                "source_id": "asco_ships",
                "source_url": "https://ships.asco.az/",
                "fetched_at": "2026-10-07T00:00:00Z",
                "data": parsed,
            }
        ],
        date(2026, 10, 7),
        date(2026, 10, 7),
        "now",
    )
    assert report["logistics_model"]["eligible_backtest_cases"] == 0
    assert report["logistics_model"]["eta_mae_hours"] is None
    assert report["operators"]["sources"][0]["published_expected_arrivals"] == 1
    assert report["operators"]["sources"][0]["actual_cargo_arrival_labels"] == 0
    assert not report["weather_input_comparison"]["is_logistics_model_accuracy"]


def test_replay_rejects_modified_evidence(tmp_path):
    (tmp_path / "wind-pairs.csv").write_text("changed data")
    (tmp_path / "manifest.json").write_text(
        json.dumps({"files": {"wind-pairs.csv": "wrong checksum"}})
    )
    with pytest.raises(ValueError, match="checksum"):
        replay(tmp_path)
