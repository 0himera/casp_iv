import base64
import copy
import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.casper import Casper, ChainError, RPCError
from app.config import Settings
from app.main import create_app
from app.transit import Transit, commitments, iso, now
from app.transit_store import Store
from app.worker import Worker

TOKENS = {
    role: role + "-test-token-01234567890123456789"
    for role in ("logistician", "carrier", "customs")
}


class FakeChain:
    def __init__(self):
        self.prepared = []
        self.broadcasts = []
        self.executed = {}
        self.states = {}
        self.timeout_after_submit = False
        self.reject = False

    def prepare(self, plan):
        self.prepared.append(copy.deepcopy(plan))
        return {"hash": hashlib.sha256(json.dumps(plan).encode()).hexdigest(), "plan": plan}

    def broadcast(self, signed):
        self.broadcasts.append(signed["hash"])
        if signed["hash"] in self.executed:
            return
        plan = signed["plan"]
        args = {a["name"]: a["value"] for a in plan["args"]}
        shipment_id = args["shipment_id"]
        entry = plan["entry_point"]
        if not self.reject:
            if entry in ("create", "revise"):
                version = args.get("expected_version", 0) + 1
                self.states[shipment_id] = {
                    "version": version,
                    "current_version": version,
                    "documents_hash": args["documents_hash"],
                    "route_hash": args["route_hash"],
                    "decisions": {},
                }
            elif entry == "attest":
                self.states[shipment_id]["decisions"][plan["role"]] = {
                    "approved": args["approved"],
                    "valid_until_ms": args["valid_until_ms"],
                    "revoked_at_ms": None,
                    "decided_at_ms": int(now().timestamp() * 1000),
                }
            elif entry == "revoke":
                self.states[shipment_id]["decisions"][plan["role"]]["revoked_at_ms"] = int(
                    now().timestamp() * 1000
                )
        self.executed[signed["hash"]] = {
            "error": "User(7)" if self.reject else None,
            "block_hash": "abc",
        }
        if self.timeout_after_submit:
            raise TimeoutError("response lost after acceptance")

    def execution(self, deploy_hash):
        return self.executed.get(deploy_hash)

    def passport(self, shipment_id, version=0):
        state = copy.deepcopy(self.states.get(shipment_id))
        if state is None:
            return None
        state.update(
            evaluated_at_ms=int(now().timestamp() * 1000), block_hash="abc", state_root_hash="def"
        )
        decisions = state["decisions"].values()
        ready = len(state["decisions"]) == 3 and all(
            d["approved"]
            and d["revoked_at_ms"] is None
            and d["valid_until_ms"] > state["evaluated_at_ms"]
            for d in decisions
        )
        state["status"] = (
            "blocked"
            if any(not d["approved"] for d in decisions)
            else ("ready" if ready else "collecting")
        )
        return state


@pytest.fixture
def rig(tmp_path):
    settings = Settings(
        cache_path=tmp_path / "cache.db",
        transit_path=tmp_path / "transit.db",
        transit_writes=True,
        role_tokens=TOKENS,
    )
    with TestClient(create_app(settings)) as client:
        store = Store(settings.transit_path)
        chain = FakeChain()
        yield client, Transit(store), Worker(store, chain), chain, settings


def headers(role="logistician", key="test"):
    return {"Authorization": "Bearer " + TOKENS[role], "Idempotency-Key": key}


def complete(worker):
    worker.run_once()
    worker.run_once()


def create(rig):
    client, svc, worker, _, _ = rig
    response = client.post("/api/v1/shipments", json={"template": "demo"}, headers=headers())
    assert response.status_code == 202, response.text
    operation = response.json()
    complete(worker)
    assert svc.operation(operation["id"])["status"] == "confirmed"
    return operation["shipment_id"]


def test_timeout_restart_and_idempotency_never_resign(rig):
    client, svc, worker, chain, settings = rig
    chain.timeout_after_submit = True
    response = client.post("/api/v1/shipments", json={"template": "demo"}, headers=headers())
    operation = response.json()
    shipment_id = operation["shipment_id"]
    worker.run_once()  # Broadcast succeeds on chain, network response is lost.
    submitted = svc.operation(operation["id"])
    assert submitted["status"] == "submitted" and submitted["transaction_hash"]
    assert svc.read(shipment_id)["passport"]["version"] == 0
    # All worker/service objects restart from disk; signed bytes were persisted before sending.
    restarted = Worker(Store(settings.transit_path), chain)
    restarted.run_once()
    assert Transit(Store(settings.transit_path)).operation(operation["id"])["status"] == "confirmed"
    assert len(chain.prepared) == len(chain.broadcasts) == 1
    replay = client.post("/api/v1/shipments", json={"template": "demo"}, headers=headers())
    assert replay.json()["id"] == operation["id"]
    conflict = client.post(
        "/api/v1/shipments", json={"template": "demo", "title": "other"}, headers=headers()
    )
    assert conflict.status_code == 409


def test_attest_ready_revise_documents_history_and_revoke(rig):
    client, svc, worker, _, settings = rig
    shipment_id = create(rig)
    path = "/api/v1/shipments/" + shipment_id
    for role in TOKENS:
        current = svc.read(shipment_id)
        response = client.post(
            path + "/attestations",
            headers=headers(role, role),
            json={"expected_revision": current["revision"], "decision": "approved"},
        )
        assert response.status_code == 202
        complete(worker)
    original = svc.read(shipment_id)
    assert original["passport"]["status"] == "ready"
    assert client.get(path).status_code == 200  # Full runtime DTO validation.
    response = client.post(
        path + "/attestations",
        headers=headers(key="duplicate-role"),
        json={"expected_revision": original["revision"], "decision": "approved"},
    )
    assert response.status_code == 409
    content = b"new invoice, bytes really persisted"
    response = client.post(
        path + "/document-revisions",
        headers=headers(key="doc-v2"),
        json={
            "expected_revision": original["revision"],
            "document_id": "doc_invoice",
            "filename": "invoice-v2.txt",
            "content_base64": base64.b64encode(content).decode(),
        },
    )
    assert response.status_code == 202, response.text
    assert svc.read(shipment_id)["documents"][0]["version"] == 1
    complete(worker)
    updated = Transit(Store(settings.transit_path)).read(shipment_id)
    assert updated["passport"]["version"] == 2
    assert updated["passport"]["status"] == "collecting"
    assert all(a["status"] == "invalidated" for a in updated["passport"]["attestations"])
    assert updated["passport"]["documents_hash"] != original["passport"]["documents_hash"]
    assert updated["passport"]["route_hash"] == original["passport"]["route_hash"]
    assert (
        client.get(path + "/documents/doc_invoice/versions/2", headers=headers()).content == content
    )
    assert client.get(path + "/documents/doc_invoice/versions/1", headers=headers()).content == (
        b"demo invoice v1"
    )
    history = client.get(path + "/versions/1", headers=headers()).json()
    assert history["shipment"]["passport"]["status"] == "ready"
    assert history["shipment"]["documents"][0]["version"] == 1
    assert client.get(path + "/versions/1").status_code == 401
    for endpoint, body in (("attestations", {"decision": "approved"}), ("revocations", {})):
        response = client.post(
            path + "/" + endpoint,
            headers=headers(key=endpoint + "-v2"),
            json={"expected_revision": svc.read(shipment_id)["revision"], **body},
        )
        assert response.status_code == 202
        complete(worker)
    current = svc.read(shipment_id)
    assert (
        next(a for a in current["passport"]["attestations"] if a["version"] == 2)["status"]
        == "revoked"
    )


def test_rejection_persists_and_failed_execution_preserves_snapshot(rig):
    client, svc, worker, chain, _ = rig
    shipment_id = create(rig)
    path = "/api/v1/shipments/" + shipment_id
    response = client.post(
        path + "/attestations",
        headers=headers("customs", "reject"),
        json={"expected_revision": 1, "decision": "rejected"},
    )
    assert response.status_code == 202
    complete(worker)
    current = svc.read(shipment_id)
    assert current["passport"]["status"] == "blocked"
    chain.reject = True
    operation = client.post(
        path + "/route-selection",
        headers=headers(key="fail"),
        json={
            "expected_revision": current["revision"],
            "route_id": "route_makh",
            "forecast_id": current["forecast"]["id"],
        },
    ).json()
    complete(worker)
    assert svc.operation(operation["id"])["error_code"] == "CONTRACT_EXECUTION_FAILED"
    assert svc.read(shipment_id)["revision"] == current["revision"]
    assert svc.read(shipment_id)["selected_route_id"] == current["selected_route_id"]
    assert svc.read(shipment_id)["pending_operation_id"] is None


def test_concurrent_revision_control(rig):
    _, svc, worker, _, _ = rig
    shipment_id = create(rig)

    def enqueue(role):
        try:
            return svc.enqueue(
                role, "attest", shipment_id, {"decision": "approved", "expected_revision": 1}, role
            )
        except HTTPException as exc:
            return exc

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(enqueue, ("carrier", "customs")))
    assert sum(isinstance(r, dict) for r in results) == 1
    assert (
        next(r for r in results if isinstance(r, HTTPException)).detail["code"]
        == "OPERATION_PENDING"
    )
    complete(worker)
    assert svc.read(shipment_id)["revision"] == 2


def test_external_state_mismatch_never_confirms_and_stale_blocks_writes(rig):
    _, svc, worker, chain, _ = rig
    shipment_id = create(rig)
    before = svc.read(shipment_id)
    op = svc.enqueue(
        "carrier",
        "attest",
        shipment_id,
        {"decision": "approved", "expected_revision": 1},
        "mismatch",
    )
    worker.run_once()
    chain_id = svc.store.shipment(shipment_id)["chain_id"]
    chain.states[chain_id]["documents_hash"] = "00" * 32
    worker.run_once()
    assert svc.operation(op["id"])["error_code"] == "RECONCILIATION_REQUIRED"
    assert svc.read(shipment_id)["revision"] == before["revision"]
    # Read-side expiry never leaves an old ready passport active.
    before["passport"]["attestations"] = [
        {
            "role": r,
            "version": 1,
            "decision": "approved",
            "status": "active",
            "valid_until": iso(now() - timedelta(seconds=1)),
        }
        for r in TOKENS
    ]
    before["sources"][-1]["observed_at"] = iso(now() - timedelta(minutes=10))
    with svc.store.connect(write=True) as db:
        db.execute(
            "UPDATE shipments SET snapshot=?,pending=NULL WHERE id=?",
            (json.dumps(before), shipment_id),
        )
    read = svc.read(shipment_id)
    assert read["passport"]["status"] == "collecting"
    assert all(a["status"] == "expired" for a in read["passport"]["attestations"])
    assert read["allowed_actions"] == []
    with pytest.raises(HTTPException) as exc:
        svc.enqueue(
            "carrier",
            "attest",
            shipment_id,
            {"expected_revision": 1, "decision": "approved"},
            "stale",
        )
    assert exc.value.detail["code"] == "CHAIN_STATE_STALE"


def test_auth_validation_and_read_only_default(rig, tmp_path):
    client, _, _, _, _ = rig
    assert client.post("/api/v1/shipments", json={"template": "demo"}).status_code == 401
    assert (
        client.post(
            "/api/v1/shipments", json={"template": "demo"}, headers=headers("carrier")
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/v1/shipments",
            json={"template": "demo"},
            headers={"Authorization": "Bearer " + TOKENS["logistician"]},
        ).status_code
        == 422
    )
    settings = Settings(
        cache_path=tmp_path / "read-cache", transit_path=tmp_path / "read-db", role_tokens=TOKENS
    )
    with TestClient(create_app(settings)) as read_only:
        assert (
            read_only.post(
                "/api/v1/shipments", json={"template": "demo"}, headers=headers()
            ).status_code
            == 503
        )


def test_commitments_exclude_predictions_and_bind_identity(rig):
    _, svc, _, _, _ = rig
    shipment_id = create(rig)
    row = svc.store.shipment(shipment_id)
    snapshot = svc.read(shipment_id)
    proof = commitments(snapshot, row["chain_id"])
    before = copy.deepcopy(snapshot["passport"])
    snapshot["forecast"]["miss_probability"] = 0.99
    snapshot["routes"][0]["eta"]["p50"] = None
    commitments(snapshot, row["chain_id"], proof)
    assert snapshot["passport"] == before
    commitments(snapshot, "ff" * 32, proof)
    assert snapshot["passport"]["documents_hash"] != before["documents_hash"]


def test_missing_dictionary_is_optional_but_transport_and_other_rpc_errors_are_not():
    chain = Casper()
    chain.query = lambda *args: (_ for _ in ()).throw(
        RPCError({"code": -32003, "data": "value was not found in the global state"})
    )
    assert chain.storage("root", b"0" * 32, 6, optional=True) is None
    with pytest.raises(RPCError):
        chain.storage("root", b"0" * 32, 6)
    chain.query = lambda *args: (_ for _ in ()).throw(ChainError("timeout"))
    with pytest.raises(ChainError):
        chain.storage("root", b"0" * 32, 6, optional=True)


def test_crash_before_network_reuses_saved_signed_payload(rig):
    client, svc, worker, chain, _ = rig
    operation = client.post(
        "/api/v1/shipments", json={"template": "demo"}, headers=headers()
    ).json()
    broadcast = chain.broadcast

    def interrupted(signed):
        # This assertion executes inside the first attempted broadcast.
        row = svc.store.operation(operation["id"])
        assert json.loads(row["signed"])["hash"] == signed["hash"]
        assert json.loads(row["public"])["status"] == "submitted"
        raise TimeoutError("network never reached")

    chain.broadcast = interrupted
    worker.run_once()
    assert svc.operation(operation["id"])["status"] == "submitted"
    chain.broadcast = broadcast
    complete(Worker(Store(svc.store.path), chain))
    assert len(chain.prepared) == 1
    assert svc.operation(operation["id"])["status"] == "confirmed"


def test_refresh_imports_external_attestations_and_flags_unknown_version(rig):
    _, svc, worker, chain, _ = rig
    shipment_id = create(rig)
    chain_id = svc.store.shipment(shipment_id)["chain_id"]
    chain.states[chain_id]["decisions"]["customs"] = {
        "approved": False,
        "valid_until_ms": 0,
        "revoked_at_ms": None,
        "decided_at_ms": int(now().timestamp() * 1000),
    }
    worker.refresh()
    assert svc.read(shipment_id)["revision"] == 2
    assert svc.read(shipment_id)["passport"]["status"] == "blocked"
    with svc.store.connect() as db:
        historical = json.loads(
            db.execute(
                "SELECT snapshot FROM versions WHERE shipment_id=? AND version=1", (shipment_id,)
            ).fetchone()[0]
        )
    assert historical["passport"]["status"] == "blocked"
    worker.refresh()
    assert svc.read(shipment_id)["revision"] == 2  # Refreshing the same state is not a mutation.
    chain.states[chain_id]["version"] = chain.states[chain_id]["current_version"] = 2
    worker.refresh()
    assert svc.read(shipment_id)["allowed_actions"] == []
    assert svc.read(shipment_id)["sources"][-1]["quality"] == "stale"


def test_route_revision_uses_same_document_commitment(rig):
    client, svc, worker, _, _ = rig
    shipment_id = create(rig)
    snapshot = svc.read(shipment_id)
    response = client.post(
        f"/api/v1/shipments/{shipment_id}/route-selection",
        json={
            "route_id": "route_makh",
            "forecast_id": snapshot["forecast"]["id"],
            "expected_revision": 1,
        },
        headers=headers(key="route"),
    )
    assert response.status_code == 202
    complete(worker)
    updated = svc.read(shipment_id)
    assert updated["selected_route_id"] == "route_makh"
    assert updated["passport"]["version"] == 2
    assert updated["passport"]["documents_hash"] == snapshot["passport"]["documents_hash"]
    assert updated["passport"]["route_hash"] != snapshot["passport"]["route_hash"]
