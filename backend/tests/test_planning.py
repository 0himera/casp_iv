from datetime import timedelta
from types import SimpleNamespace as NS

import pytest
from test_transit import complete, create, headers
from test_transit import rig as rig

from app import transit_api
from app.service import DataUnavailable
from app.transit import now


class Observations:
    wind = 10
    latest_calls = 4
    missing = False
    stale = False

    def __init__(self, start):
        self.start = start

    async def weather(self, port, days):
        if self.missing:
            raise DataUnavailable()
        return NS(
            meta=NS(stale=self.stale, source_url="https://open-meteo.com/", fetched_at=self.start),
            hourly=[
                NS(time=self.start + timedelta(hours=i), wind_speed_10m=self.wind)
                for i in range(72)
            ],
        )

    async def activity(self, port, days):
        return NS(
            meta=NS(stale=False, source_url="https://portwatch.imf.org/"),
            daily=[
                NS(
                    date=self.start.date() - timedelta(days=i),
                    portcalls=self.latest_calls if i == 0 else 4,
                )
                for i in range(15)
            ],
        )


@pytest.fixture
def planning(rig, monkeypatch):
    client, *_ = rig
    shipment_id = create(rig)
    start = now()
    monkeypatch.setattr(transit_api, "utc_now", lambda: start)
    observations = Observations(start)
    client.app.state.data = observations
    return shipment_id, observations


def recalculate(rig, planning, key, **options):
    client = rig[0]
    shipment_id = planning[0]
    shipment = client.get(f"/api/v1/shipments/{shipment_id}").json()
    return client.post(
        f"/api/v1/shipments/{shipment_id}/recalculate",
        json={"expected_revision": shipment["revision"], **options},
        headers=headers(key=key),
    )


def test_public_inputs_produce_persisted_routes_and_consistent_emissions(rig, planning):
    client, _, _, chain, _ = rig
    original = client.get(f"/api/v1/shipments/{planning[0]}").json()
    response = recalculate(rig, planning, "initial")
    assert response.status_code == 200, response.text
    value = response.json()
    assert value["forecast"]["method"] == "monte_carlo"
    assert value["passport"] == original["passport"]
    assert len(value["routes"]) == 4
    assert all(r["ports"][-1] == value["destination"]["name"] for r in value["routes"])
    assert all(r["capacity_status"] == "synthetic" for r in value["routes"])
    for route, emission in zip(
        value["routes"], value["planning"]["emissions"]["routes"], strict=True
    ):
        assert route["emissions_kg_co2e"] == round(emission["total_kg_co2e"], 2)
    assert all(x["weather_status"] == "forecast" for x in value["planning"]["inputs"])
    assert len(chain.broadcasts) == 1  # Only the original passport creation.
    retry = client.post(
        f"/api/v1/shipments/{planning[0]}/recalculate",
        json={"expected_revision": original["revision"]},
        headers=headers(key="initial"),
    )
    assert retry.json() == value
    assert client.get(f"/api/v1/shipments/{planning[0]}").json()["planning"] == value["planning"]


def test_weather_queue_and_storm_change_calculation(rig, planning):
    normal = recalculate(rig, planning, "normal").json()
    planning[1].wind = 70
    windy = recalculate(rig, planning, "windy").json()
    assert windy["forecast"]["miss_probability"] > normal["forecast"]["miss_probability"]
    planning[1].wind = 10
    planning[1].latest_calls = 12
    queued = recalculate(rig, planning, "queue").json()
    assert queued["planning"]["inputs"][0]["terminal_hours"] == 16
    assert queued["forecast"]["miss_probability"] >= normal["forecast"]["miss_probability"]
    storm = recalculate(rig, planning, "storm", scenario="storm").json()
    assert storm["forecast"]["miss_probability"] > queued["forecast"]["miss_probability"]


def test_missing_weather_never_claims_zero_risk_or_delivery(rig, planning):
    planning[1].missing = True
    value = recalculate(rig, planning, "missing").json()
    assert value["forecast"]["quality"] == "missing"
    assert value["forecast"]["miss_probability"] is None
    assert value["forecast"]["ready_at"]["p50"] is None
    assert all(
        r["miss_probability"] is None and r["eta"]["p50"] is None and not r["feasible"]
        for r in value["routes"]
    )


def test_unknown_capacity_does_not_invent_delivery_or_block_route_planning(rig, planning):
    value = recalculate(rig, planning, "capacity", assumptions={"assume_capacity": False}).json()
    assert all(
        r["eta"]["p50"] is None and r["capacity_status"] == "unknown" for r in value["routes"]
    )


def test_new_backend_route_is_confirmed_and_uses_its_own_forecast(rig, planning):
    client, _, worker, _, _ = rig
    value = recalculate(rig, planning, "new-route").json()
    response = client.post(
        f"/api/v1/shipments/{planning[0]}/route-selection",
        json={
            "route_id": "route_aktau",
            "expected_revision": value["revision"],
            "forecast_id": value["forecast"]["id"],
        },
        headers=headers(key="select-aktau"),
    )
    assert response.status_code == 202, response.text
    pending = client.get(f"/api/v1/shipments/{planning[0]}").json()
    assert pending["selected_route_id"] == value["selected_route_id"]
    complete(worker)
    confirmed = client.get(f"/api/v1/shipments/{planning[0]}").json()
    assert confirmed["selected_route_id"] == "route_aktau"
    assert confirmed["passport"]["version"] == value["passport"]["version"] + 1
    selected = next(r for r in confirmed["routes"] if r["id"] == "route_aktau")
    assert confirmed["forecast"]["miss_probability"] == selected["miss_probability"]


def test_recalculation_enforces_role_and_revision(rig, planning):
    client = rig[0]
    target = f"/api/v1/shipments/{planning[0]}/recalculate"
    assert (
        client.post(
            target, json={"expected_revision": 1}, headers=headers(role="carrier", key="wrong-role")
        ).status_code
        == 403
    )
    assert recalculate(rig, planning, "revision").status_code == 200
    assert (
        client.post(
            target, json={"expected_revision": 1}, headers=headers(key="old-revision")
        ).status_code
        == 409
    )


def test_alternative_must_keep_destination(rig, planning):
    client = rig[0]
    shipment = client.get(f"/api/v1/shipments/{planning[0]}").json()
    route = shipment["routes"][0] | {"id": "wrong-destination", "ports": ["kuryk", "amirabad"]}
    response = client.post(
        f"/api/v1/shipments/{planning[0]}/route-candidates",
        json={"expected_revision": shipment["revision"], "route": route},
        headers=headers(key="wrong-destination"),
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "DESTINATION_MISMATCH"
    assert client.get(f"/api/v1/shipments/{planning[0]}").json()["revision"] == shipment["revision"]


def test_rail_and_road_delays_only_affect_their_own_legs(rig, planning):
    normal = recalculate(rig, planning, "modes-normal").json()
    rail = recalculate(rig, planning, "modes-rail", assumptions={"rail_delay_hours": 24}).json()
    road = recalculate(rig, planning, "modes-road", assumptions={"road_delay_hours": 24}).json()

    def by_route(value):
        return {r["route_id"]: r for r in value["planning"]["inputs"]}

    base, delayed_rail, delayed_road = map(by_route, (normal, rail, road))
    assert delayed_rail["route_astra"]["land_hours"] == base["route_astra"]["land_hours"] + 24
    assert delayed_rail["route_makh"]["land_hours"] == base["route_makh"]["land_hours"]
    assert delayed_road["route_astra"]["land_hours"] == base["route_astra"]["land_hours"]
    assert delayed_road["route_makh"]["land_hours"] == base["route_makh"]["land_hours"] + 24
    assert road["routes"][1]["miss_probability"] > normal["routes"][1]["miss_probability"]
