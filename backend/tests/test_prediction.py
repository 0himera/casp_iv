from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from app.main import create_app
from app.prediction import PredictionRequest, predict


def duration(hours):
    return dict(minimum_hours=hours, typical_hours=hours, maximum_hours=hours)


def scenario():
    return dict(
        start_at="2026-11-12T00:00:00Z",
        samples=100,
        seed=42,
        routes=[
            dict(
                id="route_a",
                land_travel=duration(6),
                terminal_processing=duration(2),
                documents_ready=duration(8),
                weather_hold=duration(0),
                loading_buffer_hours=1,
                sea_travel=duration(24),
                destination_processing=duration(2),
                sailings=[
                    dict(
                        id="first",
                        cutoff_at="2026-11-12T09:00:00Z",
                        departure_at="2026-11-12T10:00:00Z",
                        capacity_confirmed=True,
                    ),
                    dict(
                        id="next",
                        cutoff_at="2026-11-13T09:00:00Z",
                        departure_at="2026-11-13T10:00:00Z",
                        capacity_confirmed=True,
                    ),
                ],
            )
        ],
    )


def test_parallel_documents_and_cutoff_boundary():
    response = predict(PredictionRequest(**scenario()))
    result = response.routes[0]
    assert not response.trained_on_history
    assert result.ready_at.p50 == datetime(2026, 11, 12, 9, tzinfo=UTC)
    assert result.probability_target_cutoff_missed == 0
    assert result.delivery_eta.p50 == datetime(2026, 11, 13, 12, tzinfo=UTC)


def test_one_hour_readiness_delay_can_add_a_day_to_delivery():
    normal = predict(PredictionRequest(**scenario())).routes[0]
    data = scenario()
    data["routes"][0]["weather_hold"] = duration(1)
    late = predict(PredictionRequest(**data)).routes[0]
    assert late.probability_target_cutoff_missed == 1
    assert (late.delivery_eta.p50 - normal.delivery_eta.p50).total_seconds() == 86400


def test_unknown_capacity_does_not_create_delivery_promise():
    data = scenario()
    for sailing in data["routes"][0]["sailings"]:
        sailing["capacity_confirmed"] = None
    result = predict(PredictionRequest(**data)).routes[0]
    assert result.delivery_eta is None and result.delivery_samples == 0
    assert result.probability_no_confirmed_sailing_in_horizon == 1
    assert result.probability_target_cutoff_missed == 0


def test_probability_reproducibility_and_monotonic_delay():
    data = scenario()
    data["routes"][0]["terminal_processing"] = dict(
        minimum_hours=0, typical_hours=2, maximum_hours=6
    )
    request = PredictionRequest(**data)
    first = predict(request)
    assert first == predict(request)
    assert 0 < first.routes[0].probability_target_cutoff_missed < 1
    data["routes"][0]["weather_hold"] = duration(2)
    delayed = predict(PredictionRequest(**data))
    assert (
        delayed.routes[0].probability_target_cutoff_missed
        >= first.routes[0].probability_target_cutoff_missed
    )


@pytest.mark.parametrize(
    "problem", ["naive_time", "bad_distribution", "duplicate_routes", "samples", "cutoff"]
)
def test_invalid_scenarios_rejected(problem):
    data = scenario()
    if problem == "naive_time":
        data["start_at"] = "2026-11-12T00:00:00"
    if problem == "bad_distribution":
        data["routes"][0]["land_travel"]["minimum_hours"] = 10
    if problem == "duplicate_routes":
        data["routes"] *= 2
    if problem == "samples":
        data["samples"] = 10001
    if problem == "cutoff":
        data["routes"][0]["sailings"][0]["cutoff_at"] = "2026-11-13T00:00:00Z"
    with pytest.raises(ValidationError):
        PredictionRequest(**data)


def test_api_runs_without_upstream_data(tmp_path):
    with TestClient(create_app(Settings(cache_path=tmp_path / "cache.db"))) as client:
        response = client.post("/api/v1/predictions/readiness", json=scenario())
    assert response.status_code == 200
    assert response.json()["input_quality"] == "user_supplied_scenario"
