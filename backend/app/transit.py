"""Persistent shipment projection and idempotent commands for TransitPassport."""

import base64
import copy
import hashlib
import json
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import rfc8785
from fastapi import HTTPException

from .casper import MANIFEST
from .config import REPOSITORY_ROOT


def now():
    return datetime.now(UTC)


def iso(value=None):
    return (value or now()).isoformat().replace("+00:00", "Z")


def fail(status, code, message):
    raise HTTPException(status, {"code": code, "message": message})


def arg(name, kind, value):
    return {"name": name, "type": kind, "value": value}


def commitments(snapshot, chain_id, previous=None):
    salts = (previous or {}).get("salts") or [secrets.token_hex(32), secrets.token_hex(32)]
    documents = sorted(
        [{k: d[k] for k in ("id", "kind", "version", "sha256")} for d in snapshot["documents"]],
        key=lambda d: d["id"],
    )
    selected = next(r for r in snapshot["routes"] if r["id"] == snapshot["selected_route_id"])
    route = {k: selected[k] for k in ("id", "ports", "modes", "geometry", "geometry_kind")}
    # Forecast, price and observed weather are deliberately outside the agreement.
    proof = {"salts": salts, "documents": documents, "route": route}
    for index, (name, manifest) in enumerate((("documents", documents), ("route", route))):
        payload = (
            f"CF/{name.upper()}/v1\0".encode()
            + bytes.fromhex(chain_id)
            + bytes.fromhex(salts[index])
            + rfc8785.dumps(manifest)
        )
        snapshot["passport"][name + "_hash"] = hashlib.sha256(payload).hexdigest()
    return proof


def project(snapshot, chain):
    """Project a verified version without discarding earlier decisions."""
    passport = snapshot["passport"]
    for old in passport["attestations"]:
        if old["version"] != chain["version"]:
            old["status"] = "invalidated"
    passport["attestations"] = [
        a for a in passport["attestations"] if a["version"] != chain["version"]
    ]
    for role, decision in chain["decisions"].items():
        state = "active"
        if decision["revoked_at_ms"] is not None:
            state = "revoked"
        elif decision["approved"] and decision["valid_until_ms"] <= chain["evaluated_at_ms"]:
            state = "expired"
        passport["attestations"].append(
            {
                "role": role,
                "version": chain["version"],
                "decision": "approved" if decision["approved"] else "rejected",
                "status": state,
                "valid_until": iso(datetime.fromtimestamp(decision["valid_until_ms"] / 1000, UTC)),
            }
        )
    passport["version"] = chain["version"]
    passport["status"] = chain["status"]


def fresh(snapshot):
    source = next((s for s in snapshot["sources"] if s["id"] == "casper"), None)
    return (
        source
        and source["quality"] == "observed"
        and (now() - datetime.fromisoformat(source["observed_at"])).total_seconds() < 300
    )


class Transit:
    def __init__(self, store):
        self.store = store
        self.manifest = json.loads(MANIFEST.read_text())

    def read(self, shipment_id):
        row = self.store.shipment(shipment_id)
        if not row:
            fail(404, "SHIPMENT_NOT_FOUND", "Отправка не найдена")
        snapshot = json.loads(row["snapshot"])
        snapshot["pending_operation_id"] = row["pending"]
        passport = snapshot["passport"]
        for a in passport["attestations"]:
            if a["status"] == "active" and a["decision"] == "approved":
                if datetime.fromisoformat(a["valid_until"]) <= now():
                    a["status"] = "expired"
        current = [a for a in passport["attestations"] if a["version"] == passport["version"]]
        passport["status"] = (
            "blocked"
            if any(a["decision"] == "rejected" for a in current)
            else "ready"
            if len(current) == 3 and all(a["status"] == "active" for a in current)
            else "collecting"
        )
        if not fresh(snapshot):
            for source in snapshot["sources"]:
                if source["id"] == "casper":
                    source["quality"] = "stale"
        snapshot["allowed_actions"] = (
            []
            if row["pending"] or not fresh(snapshot)
            else ["select_route", "replace_document", "attest"]
        )
        return snapshot

    def operation(self, operation_id):
        row = self.store.operation(operation_id)
        if not row:
            fail(404, "OPERATION_NOT_FOUND", "Операция не найдена")
        return json.loads(row["public"])

    def listing(self):
        with self.store.connect() as db:
            ids = [r[0] for r in db.execute("SELECT id FROM shipments ORDER BY rowid")]
        items = []
        for shipment_id in ids:
            s = self.read(shipment_id)
            route = next(r for r in s["routes"] if r["id"] == s["selected_route_id"])
            items.append(
                {
                    "id": s["id"],
                    "title": s["title"],
                    "origin": s["origin"]["name"],
                    "destination": s["destination"]["name"],
                    "movement_status": s["movement_status"],
                    "eta": route["eta"]["p50"],
                    "miss_probability": route["miss_probability"],
                    "passport_status": s["passport"]["status"],
                }
            )
        return {"items": items}

    def enqueue(self, role, kind, shipment_id, body, idem):
        scope = f"{role}:{shipment_id or 'new'}:{kind}"
        digest = hashlib.sha256(rfc8785.dumps(body)).hexdigest()
        with self.store.connect(write=True) as db:
            previous = db.execute(
                "SELECT public,digest FROM operations WHERE scope=? AND idem=?", (scope, idem)
            ).fetchone()
            if previous:
                if previous["digest"] != digest:
                    fail(409, "IDEMPOTENCY_CONFLICT", "Ключ уже использован с другим телом")
                return json.loads(previous["public"])
            if kind in ("create", "select_route", "replace_document") and role != "logistician":
                fail(403, "FORBIDDEN", "Действие доступно логисту")
            uploads = []
            if kind == "create":
                shipment_id = "shp_" + uuid.uuid4().hex
                chain_id = secrets.token_hex(32)
                candidate = json.loads((REPOSITORY_ROOT / "api/fixtures/shipment.json").read_text())
                candidate.update(
                    id=shipment_id,
                    title=body["title"],
                    revision=1,
                    updated_at=iso(),
                    timeline=[],
                    allowed_actions=[],
                )
                # Explicit scenario fixture, never present it as a measured cargo/model result.
                candidate["forecast"].update(
                    id="forecast_" + uuid.uuid4().hex,
                    generated_at=iso(),
                    valid_until=iso(now() + timedelta(hours=24)),
                )
                candidate["passport"].update(
                    version=1,
                    status="collecting",
                    attestations=[],
                    network="casper-test",
                    contract_address=self.manifest["contract_hash"],
                    transaction_hash=None,
                    explorer_url=self.manifest["explorer_url"],
                )
                for document, content in zip(
                    candidate["documents"], (b"demo invoice v1", b"demo packing v1"), strict=True
                ):
                    document["sha256"] = hashlib.sha256(content).hexdigest()
                    uploads.append(
                        {
                            "id": document["id"],
                            "version": 1,
                            "content": base64.b64encode(content).decode(),
                        }
                    )
                proof = commitments(candidate, chain_id)
                draft = copy.deepcopy(candidate)
                draft["passport"].update(version=0, documents_hash="", route_hash="")
                db.execute(
                    "INSERT INTO shipments VALUES (?,?,?,NULL)",
                    (shipment_id, chain_id, json.dumps(draft)),
                )
                entry_point = "create"
                args = [arg("shipment_id", {"ByteArray": 32}, chain_id)]
            else:
                row = db.execute("SELECT * FROM shipments WHERE id=?", (shipment_id,)).fetchone()
                if not row:
                    fail(404, "SHIPMENT_NOT_FOUND", "Отправка не найдена")
                candidate = json.loads(row["snapshot"])
                if body["expected_revision"] != candidate["revision"]:
                    fail(409, "REVISION_CONFLICT", "Отправка уже изменилась; обновите её")
                if row["pending"]:
                    fail(409, "OPERATION_PENDING", "Дождитесь подтверждения текущей операции")
                if candidate["passport"]["version"] == 0:
                    fail(409, "PASSPORT_NOT_REGISTERED", "Паспорт ещё не создан в Casper")
                if not fresh(candidate):
                    fail(503, "CHAIN_STATE_STALE", "Worker должен обновить состояние Casper")
                chain_id = row["chain_id"]
                version = candidate["passport"]["version"]
                proof = json.loads(
                    db.execute(
                        "SELECT proof FROM versions WHERE shipment_id=? AND version=?",
                        (shipment_id, version),
                    ).fetchone()[0]
                )
                args = [
                    arg("shipment_id", {"ByteArray": 32}, chain_id),
                    arg("expected_version", "U32", version),
                ]
                entry_point = "revise" if kind in ("select_route", "replace_document") else kind
                if kind == "select_route":
                    forecast = candidate["forecast"]
                    if (
                        body["forecast_id"] != forecast["id"]
                        or datetime.fromisoformat(forecast["valid_until"]) <= now()
                    ):
                        fail(409, "FORECAST_STALE", "Обновите прогноз перед выбором маршрута")
                    route = next(
                        (r for r in candidate["routes"] if r["id"] == body["route_id"]), None
                    )
                    if not route or not route["feasible"]:
                        fail(422, "ROUTE_UNAVAILABLE", "Маршрут недоступен")
                    if route["id"] == candidate["selected_route_id"]:
                        fail(409, "NO_CHANGE", "Этот маршрут уже выбран")
                    candidate["selected_route_id"] = route["id"]
                elif kind == "replace_document":
                    document = next(
                        (d for d in candidate["documents"] if d["id"] == body["document_id"]), None
                    )
                    if document is None:
                        fail(404, "DOCUMENT_NOT_FOUND", "Документ не найден")
                    try:
                        content = base64.b64decode(body["content_base64"], validate=True)
                    except ValueError:
                        fail(422, "INVALID_BASE64", "Неверная кодировка документа")
                    if not 0 < len(content) <= 1024 * 1024:
                        fail(422, "DOCUMENT_SIZE", "Размер документа: 1 байт — 1 MiB")
                    document.update(
                        filename=body["filename"],
                        version=document["version"] + 1,
                        sha256=hashlib.sha256(content).hexdigest(),
                    )
                    uploads = [
                        {
                            "id": document["id"],
                            "version": document["version"],
                            "content": base64.b64encode(content).decode(),
                        }
                    ]
                elif kind == "attest":
                    if any(
                        a["role"] == role and a["version"] == version
                        for a in candidate["passport"]["attestations"]
                    ):
                        fail(409, "ALREADY_ATTESTED", "Роль уже приняла решение по этой версии")
                    approved = body["decision"] == "approved"
                    until = int((now() + timedelta(hours=24)).timestamp() * 1000) if approved else 0
                    args.extend(
                        [arg("approved", "Bool", approved), arg("valid_until_ms", "U64", until)]
                    )
                elif kind == "revoke":
                    own = next(
                        (
                            a
                            for a in candidate["passport"]["attestations"]
                            if a["role"] == role and a["version"] == version
                        ),
                        None,
                    )
                    if (
                        not own
                        or own["decision"] != "approved"
                        or own["status"] != "active"
                        or (datetime.fromisoformat(own["valid_until"]) <= now())
                    ):
                        fail(409, "NOT_REVOCABLE", "Активного согласования этой роли нет")
                if entry_point == "revise":
                    candidate["passport"]["version"] += 1
                    proof = commitments(candidate, chain_id, proof)
                candidate["revision"] += 1
            if entry_point in ("create", "revise"):
                args.extend(
                    arg(name, {"ByteArray": 32}, candidate["passport"][name])
                    for name in ("documents_hash", "route_hash")
                )
            operation = {
                "id": "op_" + uuid.uuid4().hex,
                "shipment_id": shipment_id,
                "status": "queued",
                "kind": kind,
                "network": "casper-test",
                "transaction_hash": None,
                "explorer_url": None,
                "created_at": iso(),
                "result_revision": None,
                "error_code": None,
            }
            plan = {
                "role": role,
                "entry_point": entry_point,
                "args": args,
                "proof": proof,
                "uploads": uploads,
                "chain_id": chain_id,
            }
            db.execute(
                "INSERT INTO operations VALUES (?,?,?,?,?,?,?,?,NULL)",
                (
                    operation["id"],
                    shipment_id,
                    scope,
                    idem,
                    digest,
                    json.dumps(operation),
                    json.dumps(plan),
                    json.dumps(candidate),
                ),
            )
            db.execute("UPDATE shipments SET pending=? WHERE id=?", (operation["id"], shipment_id))
        return operation
