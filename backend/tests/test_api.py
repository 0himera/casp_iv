import asyncio
import copy
import json
import sqlite3
from datetime import UTC, datetime, timedelta

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

NOW = datetime(2026, 11, 12, 8, tzinfo=UTC)


def weather_payload():
    return {
        "latitude": 43.0,
        "longitude": 47.5,
        "utc_offset_seconds": 0,
        "hourly_units": {
            "wind_speed_10m": "km/h",
            "wind_gusts_10m": "km/h",
            "precipitation": "mm",
            "temperature_2m": "°C",
        },
        "hourly": {
            "time": ["2026-11-12T08:00", "2026-11-12T09:00"],
            "wind_speed_10m": [12.0, None],
            "wind_gusts_10m": [23.0, 24.0],
            "precipitation": [0.0, None],
            "temperature_2m": [-1.5, 2.0],
        },
    }


def activity_payload():
    return {
        "features": [
            {
                "attributes": {
                    "portid": "port684",
                    "date": "2026-11-06",
                    "portcalls": 0,
                    "portcalls_cargo": 0,
                    "portcalls_tanker": 0,
                }
            },
            {
                "attributes": {
                    "portid": "port684",
                    "date": "2026-11-05",
                    "portcalls": 3,
                    "portcalls_cargo": 2,
                    "portcalls_tanker": 1,
                }
            },
        ]
    }


@pytest.fixture
def rig(tmp_path):
    clock = [NOW]
    calls = []
    state = {"failure": False, "weather": weather_payload(), "activity": activity_payload()}

    def upstream(request):
        calls.append(request)
        if state["failure"]:
            raise httpx.ReadTimeout("provider timeout", request=request)
        if request.url.host == "api.open-meteo.com":
            return httpx.Response(200, json=state["weather"])
        return httpx.Response(200, json=state["activity"])

    settings = Settings(
        cache_path=tmp_path / "cache.sqlite3",
        weather_ttl_seconds=60,
        activity_ttl_seconds=600,
        retry_cooldown_seconds=30,
    )
    transport = httpx.MockTransport(upstream)
    app = create_app(settings, transport, lambda: clock[0])
    with TestClient(app) as client:
        yield client, state, calls, clock, settings, transport


def test_catalog_covers_five_countries_and_never_invents_coordinates(rig):
    client, _, calls, *_ = rig
    result = client.get("/api/v1/ports").json()
    assert len(result["items"]) == 11
    assert {p["country_iso3"] for p in result["items"]} == {"RUS", "IRN", "KAZ", "AZE", "TKM"}
    makh = client.get("/api/v1/ports/makhachkala").json()
    assert makh["region"] == "Дагестан"
    kuryk = client.get("/api/v1/ports/kuryk").json()
    assert kuryk["coordinates"] == {"latitude": 43.26666667, "longitude": 51.75}
    assert kuryk["weather_available"]
    assert client.get("/api/v1/health").json()["mode"] == "public_data"
    assert calls == []


def test_weather_units_utc_nulls_and_cache(rig):
    client, _, calls, *_ = rig
    response = client.get("/api/v1/ports/makhachkala/weather?forecast_days=1")
    assert response.status_code == 200
    first = response.json()
    assert first["hourly"][1]["wind_speed_10m"] is None
    assert first["hourly"][0]["precipitation"] == 0
    assert first["hourly"][0]["temperature_2m"] == -1.5
    assert first["hourly"][0]["time"].endswith("Z")
    assert first["issued_at"] is None and first["meta"]["source_updated_at"] is None
    assert first["requested_location"] != first["grid_location"]
    assert first["meta"]["cache_status"] == "live"
    assert not first["meta"]["stale"]
    assert calls[0].url.params["wind_speed_unit"] == "kmh"
    second = client.get("/api/v1/ports/makhachkala/weather?forecast_days=1").json()
    assert second["meta"]["cache_status"] == "cached" and len(calls) == 1


def test_timeout_uses_stale_snapshot_preserving_fetch_time_then_recovers(rig):
    client, state, calls, clock, *_ = rig
    url = "/api/v1/ports/makhachkala/weather"
    first = client.get(url).json()
    clock[0] += timedelta(seconds=61)
    state["failure"] = True
    stale = client.get(url)
    assert stale.status_code == 200
    assert stale.json()["meta"]["cache_status"] == "stale"
    assert stale.json()["meta"]["fetched_at"] == first["meta"]["fetched_at"]
    assert stale.json()["meta"]["cache_age_seconds"] == 61
    assert stale.json()["hourly"] == first["hourly"]
    assert client.get(url).json()["meta"]["stale"]
    assert len(calls) == 2  # cooldown avoids repeatedly hammering the failed provider
    state["failure"] = False
    clock[0] += timedelta(seconds=31)
    assert client.get(url).json()["meta"]["cache_status"] == "live"
    assert len(calls) == 3


def test_no_snapshot_is_503_and_cooldown_is_advertised(rig):
    client, state, calls, *_ = rig
    state["failure"] = True
    for _ in range(2):
        response = client.get("/api/v1/ports/makhachkala/weather")
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "SOURCE_UNAVAILABLE"
        assert response.headers["Retry-After"] == "30"
    assert len(calls) == 1


@pytest.mark.parametrize(
    "path,code",
    [
        ("/ports/unknown", "PORT_NOT_FOUND"),
        ("/ports/olya/weather", "COORDINATES_UNVERIFIED"),
        ("/ports/kuryk/activity", "SOURCE_NOT_COVERED"),
        ("/ports/makhachkala/activity?days=1000", "VALIDATION_ERROR"),
        ("/ports/makhachkala/activity?days=0", "VALIDATION_ERROR"),
        ("/ports/makhachkala/weather?forecast_days=8", "VALIDATION_ERROR"),
        ("/ports/makhachkala/weather?forecast_days=abc", "VALIDATION_ERROR"),
    ],
)
def test_invalid_requests_do_not_call_upstream(rig, path, code):
    client, _, calls, *_ = rig
    response = client.get("/api/v1" + path)
    assert response.status_code in (404, 422)
    assert response.json()["error"]["code"] == code
    assert calls == []


def test_activity_zeros_gaps_and_observation_age(rig):
    client, _, calls, *_ = rig
    response = client.get("/api/v1/ports/makhachkala/activity?days=7")
    assert response.status_code == 200
    data = response.json()
    assert data["window_start"] == "2026-11-05" and data["window_end"] == "2026-11-11"
    assert [p["date"] for p in data["daily"]] == ["2026-11-05", "2026-11-06"]
    assert data["daily"][1]["portcalls"] == 0
    assert data["missing_dates"] == [f"2026-11-{d:02}" for d in range(7, 12)]
    assert data["meta"]["cache_status"] == "live" and data["meta"]["stale"]
    assert data["meta"]["quality"] == "estimated"
    assert data["latest_available_date"] == "2026-11-06"
    assert data["meta"]["source_updated_at"] is None
    assert "DATE '2026-11-05'" in calls[0].url.params["where"]


def test_empty_activity_is_missing_not_zero(rig):
    client, state, *_ = rig
    state["activity"] = {"features": []}
    data = client.get("/api/v1/ports/makhachkala/activity?days=7").json()
    assert data["daily"] == [] and len(data["missing_dates"]) == 7
    assert data["meta"]["quality"] == "missing" and data["latest_available_date"] is None


@pytest.mark.parametrize("mutation", ["units", "length", "provider_error", "duplicate_time"])
def test_malformed_weather_cannot_replace_last_good_snapshot(rig, mutation):
    client, state, _, clock, *_ = rig
    url = "/api/v1/ports/makhachkala/weather"
    original = client.get(url).json()
    clock[0] += timedelta(seconds=61)
    if mutation == "units":
        state["weather"]["hourly_units"]["wind_speed_10m"] = "m/s"
    elif mutation == "length":
        state["weather"]["hourly"]["wind_speed_10m"] = []
    elif mutation == "provider_error":
        state["weather"] = {"error": True, "reason": "provider unavailable"}
    else:
        state["weather"]["hourly"]["time"][1] = state["weather"]["hourly"]["time"][0]
    response = client.get(url).json()
    assert response["meta"]["cache_status"] == "stale"
    assert response["hourly"] == original["hourly"]


@pytest.mark.parametrize(
    "mutation", ["truncated", "wrong_port", "duplicate_date", "fractional_count"]
)
def test_malformed_activity_is_not_published(rig, mutation):
    client, state, *_ = rig
    raw = state["activity"]
    if mutation == "truncated":
        raw["exceededTransferLimit"] = True
    elif mutation == "wrong_port":
        raw["features"][0]["attributes"]["portid"] = "port16"
    elif mutation == "duplicate_date":
        raw["features"].append(copy.deepcopy(raw["features"][0]))
    else:
        raw["features"][0]["attributes"]["portcalls"] = 2.5
    assert client.get("/api/v1/ports/makhachkala/activity").status_code == 503


def test_cache_persists_across_restart_and_keeps_raw_snapshot(rig):
    client, state, _, clock, settings, transport = rig
    first = client.get("/api/v1/ports/makhachkala/weather").json()
    with sqlite3.connect(settings.cache_path) as db:
        raw = json.loads(db.execute("SELECT raw_payload FROM snapshots").fetchone()[0])
    assert raw == state["weather"]
    clock[0] += timedelta(seconds=61)
    state["failure"] = True
    with TestClient(create_app(settings, transport, lambda: clock[0])) as restarted:
        result = restarted.get("/api/v1/ports/makhachkala/weather").json()
    assert result["hourly"] == first["hourly"]
    assert result["meta"]["cache_status"] == "stale"


def test_activity_window_refreshes_at_utc_midnight(rig):
    client, _, calls, clock, *_ = rig
    clock[0] = NOW.replace(hour=23, minute=59)
    client.get("/api/v1/ports/makhachkala/activity?days=30")
    clock[0] += timedelta(minutes=2)
    data = client.get("/api/v1/ports/makhachkala/activity?days=30").json()
    assert len(calls) == 2
    assert data["window_end"] == "2026-11-12"


def test_cors_is_limited_to_configured_frontend(rig):
    client, *_ = rig
    allowed = client.get("/api/v1/ports", headers={"Origin": "http://localhost:3000"})
    assert allowed.headers["Access-Control-Allow-Origin"] == "http://localhost:3000"
    denied = client.get("/api/v1/ports", headers={"Origin": "https://not-configured.example"})
    assert "Access-Control-Allow-Origin" not in denied.headers


def test_concurrent_same_key_fetches_once(tmp_path):
    count = 0

    async def upstream(request):
        nonlocal count
        count += 1
        await asyncio.sleep(0.02)
        return httpx.Response(200, json=weather_payload())

    async def check():
        app = create_app(
            Settings(cache_path=tmp_path / "cache.db"), httpx.MockTransport(upstream), lambda: NOW
        )
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://test"
            ) as client:
                responses = await asyncio.gather(
                    *[client.get("/api/v1/ports/makhachkala/weather") for _ in range(5)]
                )
        assert all(r.status_code == 200 for r in responses)
        assert count == 1

    asyncio.run(check())
