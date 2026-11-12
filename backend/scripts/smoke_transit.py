"""Explicitly spends testnet gas. Run with the same private env-file as the API/worker.

uv run --env-file ../contracts/.local/backend.env python scripts/smoke_transit.py
"""

import argparse
import json
import os
import time
import uuid
from pathlib import Path

import httpx

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base-url", default="http://127.0.0.1:8000/api/v1")
parser.add_argument("--journal", type=Path, default=Path("var/smoke-transit.json"))
args = parser.parse_args()
tokens = json.loads(os.environ["CASPIAN_ROLE_TOKENS"])
args.journal.parent.mkdir(parents=True, exist_ok=True)
journal = (
    json.loads(args.journal.read_text())
    if args.journal.exists()
    else {"run_id": uuid.uuid4().hex, "operations": {}}
)


def save():
    temporary = args.journal.with_suffix(".tmp")
    temporary.write_text(json.dumps(journal, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(args.journal)


with httpx.Client(base_url=args.base_url, timeout=60) as client:

    def command(name, path, body, role):
        operation = journal["operations"].get(name)
        if operation is None:
            intents = journal.setdefault("intents", {})
            intents.setdefault(name, {"path": path, "body": body, "role": role})
            save()
            intent = intents[name]
            response = client.post(
                intent["path"],
                json=intent["body"],
                headers={
                    "Authorization": "Bearer " + tokens[intent["role"]],
                    "Idempotency-Key": journal["run_id"] + ":" + name,
                },
            )
            response.raise_for_status()
            operation = response.json()
            journal["operations"][name] = operation
            save()
        deadline = time.monotonic() + 300
        while operation["status"] not in ("confirmed", "failed"):
            response = client.get("/operations/" + operation["id"])
            response.raise_for_status()
            operation = response.json()
            journal["operations"][name] = operation
            save()
            if time.monotonic() > deadline:
                raise TimeoutError(
                    "Resume with the same journal; never create a new deploy blindly"
                )
            if operation["status"] not in ("confirmed", "failed"):
                time.sleep(5)
        if operation["status"] != "confirmed":
            raise RuntimeError(operation)
        print(name, "confirmed", operation["transaction_hash"], flush=True)
        return operation

    save()
    created = command("create", "/shipments", {"template": "demo"}, "logistician")
    shipment_id = created["shipment_id"]
    path = "/shipments/" + shipment_id
    for role in ("logistician", "carrier", "customs"):
        snapshot = client.get(path).raise_for_status().json()
        command(
            role,
            path + "/attestations",
            {
                "decision": "approved",
                "expected_revision": snapshot["revision"],
            },
            role,
        )
    snapshot = client.get(path).raise_for_status().json()
    chain = client.get(path + "/passport-state").raise_for_status().json()
    assert snapshot["passport"]["status"] == "ready"
    assert chain["passport"]["status"] == "ready"
    for key in ("version", "documents_hash", "route_hash"):
        assert snapshot["passport"][key] == chain["passport"][key]
    journal.update(shipment_id=shipment_id, verification=chain, verified_at=snapshot["updated_at"])
    save()
    print(shipment_id, "ready; API projection matches Casper", flush=True)
