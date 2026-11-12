"""Run separately: uv run python -m app.worker. One worker per durable database."""

import base64
import fcntl
import json
import logging
import os
import time
from datetime import UTC, datetime

from .casper import Casper, ChainError
from .config import Settings
from .transit import iso, project
from .transit_store import Store

logger = logging.getLogger(__name__)


class Worker:
    def __init__(self, store, chain):
        self.store, self.chain = store, chain

    def finish(self, row, operation, chain=None, error=None):
        candidate = json.loads(row["candidate"])
        plan = json.loads(row["plan"])
        with self.store.connect(write=True) as db:
            pending = db.execute(
                "SELECT pending FROM shipments WHERE id=?", (row["shipment_id"],)
            ).fetchone()[0]
            if pending != operation["id"]:
                return
            if error:
                operation.update(status="failed", error_code=error)
            else:
                project(candidate, chain)
                candidate["updated_at"] = iso()
                candidate["pending_operation_id"] = None
                candidate["passport"]["transaction_hash"] = operation["transaction_hash"]
                candidate["passport"]["explorer_url"] = operation["explorer_url"]
                candidate["sources"] = [s for s in candidate["sources"] if s["id"] != "casper"]
                candidate["sources"].append(
                    {
                        "id": "casper",
                        "name": "Casper testnet passport",
                        "quality": "observed",
                        "observed_at": iso(
                            datetime.fromtimestamp(chain["evaluated_at_ms"] / 1000, UTC)
                        ),
                        "url": operation["explorer_url"],
                        "note": "Confirmed passport projection at block " + chain["block_hash"],
                    }
                )
                candidate["timeline"].append(
                    {
                        "id": operation["id"],
                        "occurred_at": iso(),
                        "actor": plan["role"],
                        "title": operation["kind"] + ": Casper confirmed",
                        "passport_version": candidate["passport"]["version"],
                    }
                )
                for upload in plan["uploads"]:
                    db.execute(
                        "INSERT INTO documents VALUES (?,?,?,?)",
                        (
                            row["shipment_id"],
                            upload["id"],
                            upload["version"],
                            base64.b64decode(upload["content"]),
                        ),
                    )
                snapshot = json.dumps(candidate)
                db.execute(
                    "UPDATE shipments SET snapshot=? WHERE id=?", (snapshot, row["shipment_id"])
                )
                db.execute(
                    "INSERT INTO versions VALUES (?,?,?,?) "
                    "ON CONFLICT(shipment_id,version) DO UPDATE "
                    "SET snapshot=excluded.snapshot",
                    (
                        row["shipment_id"],
                        candidate["passport"]["version"],
                        snapshot,
                        json.dumps(plan["proof"]),
                    ),
                )
                operation.update(
                    status="confirmed", error_code=None, result_revision=candidate["revision"]
                )
            db.execute(
                "UPDATE operations SET public=? WHERE id=?",
                (json.dumps(operation), operation["id"]),
            )
            db.execute("UPDATE shipments SET pending=NULL WHERE id=?", (row["shipment_id"],))

    def step(self, row):
        operation, plan = json.loads(row["public"]), json.loads(row["plan"])
        if row["signed"] is None:
            try:
                signed = self.chain.prepare(plan)
            except (ChainError, KeyError):
                self.finish(row, operation, error="SIGNING_FAILED")
                return
            operation.update(
                status="submitted",
                transaction_hash=signed["hash"],
                explorer_url="https://testnet.cspr.live/deploy/" + signed["hash"],
            )
            # Durable hash + complete signed payload precede the first network submission.
            self.store.save_operation(operation, signed)
        else:
            signed = json.loads(row["signed"])
        execution = self.chain.execution(signed["hash"])
        if execution is None:
            self.chain.broadcast(signed)
            return
        if execution["error"]:
            self.finish(row, operation, error="CONTRACT_EXECUTION_FAILED")
            return
        candidate = json.loads(row["candidate"])
        passport = candidate["passport"]
        state = self.chain.passport(plan["chain_id"], passport["version"])
        matches = (
            state
            and all(state[k] == passport[k] for k in ("version", "documents_hash", "route_hash"))
            and state["current_version"] == passport["version"]
        )
        if matches and plan["entry_point"] == "attest":
            decision = state["decisions"].get(plan["role"])
            args = {a["name"]: a["value"] for a in plan["args"]}
            matches = (
                decision
                and decision["approved"] == args["approved"]
                and (decision["valid_until_ms"] == args["valid_until_ms"])
            )
        if matches and plan["entry_point"] == "revoke":
            decision = state["decisions"].get(plan["role"])
            matches = decision and decision["revoked_at_ms"] is not None
        if not matches:
            operation["error_code"] = "RECONCILIATION_REQUIRED"
            self.store.save_operation(operation)
            return
        self.finish(row, operation, chain=state)

    def run_once(self):
        for row in self.store.pending():
            try:
                self.step(row)
            except Exception:
                # Preserve pending proposal and signed hash on ambiguous transport failure.
                logger.exception("Operation %s will be reconciled", row["id"])

    def refresh(self):
        """Import external decisions only for versions whose metadata is known locally."""
        with self.store.connect() as db:
            rows = db.execute("SELECT * FROM shipments WHERE pending IS NULL").fetchall()
        for row in rows:
            snapshot = json.loads(row["snapshot"])
            passport = snapshot["passport"]
            if not passport["version"]:
                continue
            refreshed = False
            try:
                state = self.chain.passport(row["chain_id"])
                if not state or any(
                    passport[k] != state[k] for k in ("version", "documents_hash", "route_hash")
                ):
                    raise ChainError("External version requires reconciliation")
                before = json.dumps(passport, sort_keys=True)
                project(snapshot, state)
                changed = before != json.dumps(snapshot["passport"], sort_keys=True)
                if changed:
                    snapshot["revision"] += 1
                    snapshot["updated_at"] = iso()
                refreshed = True
                for source in snapshot["sources"]:
                    if source["id"] == "casper":
                        source.update(
                            quality="observed",
                            observed_at=iso(
                                datetime.fromtimestamp(state["evaluated_at_ms"] / 1000, UTC)
                            ),
                            note="Confirmed passport projection at block " + state["block_hash"],
                        )
            except Exception:
                logger.exception("Shipment %s refresh failed", row["id"])
                for source in snapshot["sources"]:
                    if source["id"] == "casper":
                        source["quality"] = "stale"
            with self.store.connect(write=True) as db:
                # A concurrent API command owns its candidate; do not race that projection.
                updated = db.execute(
                    "UPDATE shipments SET snapshot=? WHERE id=? AND pending IS NULL AND snapshot=?",
                    (json.dumps(snapshot), row["id"], row["snapshot"]),
                )
                if updated.rowcount and refreshed:
                    db.execute(
                        "UPDATE versions SET snapshot=? WHERE shipment_id=? AND version=?",
                        (json.dumps(snapshot), row["id"], passport["version"]),
                    )


def main():
    logging.basicConfig(level=logging.INFO)
    settings = Settings()
    if not settings.transit_writes or set(settings.role_tokens) != {
        "logistician",
        "carrier",
        "customs",
    }:
        raise SystemExit("Configure CASPIAN_TRANSIT_WRITES and all three CASPIAN_ROLE_TOKENS")
    keys = json.loads(os.environ["CASPIAN_SIGNING_KEYS"])
    store = Store(settings.transit_path)
    with open(str(store.path) + ".worker.lock", "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        chain = Casper(keys)
        chain.context()
        worker = Worker(store, chain)
        last_refresh = 0
        while True:
            worker.run_once()
            if time.monotonic() - last_refresh >= 60:
                worker.refresh()
                last_refresh = time.monotonic()
            time.sleep(5)


if __name__ == "__main__":
    main()
