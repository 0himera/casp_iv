import copy
import json

import pytest
from test_planning import Observations
from test_transit import complete, create, headers
from test_transit import rig as rig

from app.config import REPOSITORY_ROOT
from app.marine import geometry, preview
from app.transit import now


def test_all_supported_pairs_reverse_and_never_fall_back_to_straight_land_lines():
    data = geometry()
    assert len(data["anchors"]) == 11
    assert len(data["routes"]) == 54
    for key, points in data["routes"].items():
        a, b = key.split("|")
        forward, back = preview(a, b), preview(b, a)
        assert forward.route.geometry.coordinates == points
        assert back.route.geometry.coordinates == list(reversed(points))
        assert forward.sea_distance_km > 0
        assert forward.route.distance_km >= forward.sea_distance_km
        assert forward.route.modes == ["sea"]
        assert forward.route.cost.amount_minor == 0
    with pytest.raises(ValueError, match="речного"):
        preview("astrakhan", "olya")
    with pytest.raises(ValueError, match="отличаться"):
        preview("aktau", "aktau")
    with pytest.raises(ValueError, match="каталога"):
        preview("invented", "aktau")
    assert json.loads((REPOSITORY_ROOT / "frontend/src/data/marineRoutes.json").read_text()) == data


def test_change_journey_is_atomic_revises_passport_and_recalculates_sea_only(rig):
    client, svc, worker, chain, _ = rig
    shipment_id = create(rig)
    client.app.state.data = Observations(now())
    path = f"/api/v1/shipments/{shipment_id}"
    before = svc.read(shipment_id)
    # A signed previous version must not remain approved after the endpoints change.
    approved = client.post(
        path + "/attestations",
        json={"decision": "approved", "expected_revision": before["revision"]},
        headers=headers(key="approve"),
    )
    assert approved.status_code == 202
    complete(worker)
    before = svc.read(shipment_id)
    body = {
        "expected_revision": before["revision"],
        "origin_port_id": "kuryk",
        "destination_port_id": "alat",
    }
    response = client.post(path + "/journey", json=body, headers=headers(key="journey"))
    assert response.status_code == 202, response.text
    op = response.json()
    assert op["kind"] == "change_journey"
    pending = svc.read(shipment_id)
    assert pending["origin"] == before["origin"]
    assert pending["passport"] == before["passport"]
    assert (
        client.post(path + "/journey", json=body, headers=headers(key="journey")).json()["id"]
        == op["id"]
    )
    complete(worker)
    after = svc.read(shipment_id)
    assert after["origin"]["id"] == after["current_location"]["id"] == "kuryk"
    assert after["destination"]["id"] == "alat"
    assert after["movement_status"] == "planned"
    assert after["passport"]["version"] == before["passport"]["version"] + 1
    assert after["passport"]["route_hash"] != before["passport"]["route_hash"]
    assert after["passport"]["documents_hash"] == before["passport"]["documents_hash"]
    assert after["passport"]["attestations"][0]["status"] == "invalidated"
    assert after["forecast"]["method"] == "monte_carlo"
    assert after["routes"][0]["eta"]["p50"] is not None
    assert after["planning"]["inputs"][0]["land_hours"] == 0
    assert set(after["planning"]["emissions"]["routes"][0]["by_mode_kg_co2e"]) == {"sea"}
    again = client.post(
        path + "/recalculate",
        json={
            "expected_revision": after["revision"],
            "assumptions": {"road_delay_hours": 60, "rail_delay_hours": 60},
        },
        headers=headers(key="recalc"),
    )
    assert again.status_code == 200, again.text
    assert len(again.json()["routes"]) == 1  # No auto-injected Volgograd alternatives.
    assert again.json()["planning"]["inputs"][0]["land_hours"] == 0
    assert again.json()["passport"]["route_hash"] == after["passport"]["route_hash"]
    assert (
        client.post(path + "/journey", json=body, headers=headers(key="journey")).json()["id"]
        == op["id"]
    )
    conflict = client.post(
        path + "/journey",
        json={**body, "destination_port_id": "baku"},
        headers=headers(key="journey"),
    )
    assert conflict.status_code == 409
    assert len(chain.broadcasts) == 3


def test_journey_permissions_validation_and_failed_chain_preserve_original(rig):
    client, svc, worker, chain, _ = rig
    shipment_id = create(rig)
    client.app.state.data = Observations(now())
    before = svc.read(shipment_id)
    path = f"/api/v1/shipments/{shipment_id}/journey"
    body = {
        "expected_revision": before["revision"],
        "origin_port_id": "baku",
        "destination_port_id": "aktau",
    }
    for role in ("carrier", "customs"):
        assert client.post(path, json=body, headers=headers(role, role)).status_code == 403
    assert (
        client.post(
            path, json={**body, "expected_revision": 999}, headers=headers(key="stale")
        ).status_code
        == 409
    )
    for destination in ("baku", "unknown"):
        assert (
            client.post(
                path,
                json={**body, "destination_port_id": destination},
                headers=headers(key=destination),
            ).status_code
            == 422
        )
    response = client.post(path, json=body, headers=headers(key="fail"))
    assert response.status_code == 202
    chain.reject = True
    complete(worker)
    assert svc.operation(response.json()["id"])["status"] == "failed"
    after = svc.read(shipment_id)
    for field in ("origin", "destination", "current_location", "routes", "passport"):
        assert after[field] == before[field]


def test_missing_weather_does_not_invent_eta_on_changed_journey(rig):
    client, svc, worker, _, _ = rig
    shipment_id = create(rig)
    data = Observations(now())
    data.missing = True
    client.app.state.data = data
    before = copy.deepcopy(svc.read(shipment_id))
    response = client.post(
        f"/api/v1/shipments/{shipment_id}/journey",
        json={
            "expected_revision": before["revision"],
            "origin_port_id": "olya",
            "destination_port_id": "anzali",
        },
        headers=headers(key="missing"),
    )
    assert response.status_code == 202, response.text
    complete(worker)
    result = svc.read(shipment_id)
    assert result["forecast"]["quality"] == "missing"
    assert result["routes"][0]["eta"]["p50"] is None
    assert result["forecast"]["miss_probability"] is None
