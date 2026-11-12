"""Read-only verification of the pinned Odra 2.10.1 deployment; no signing keys required."""

import argparse
import hashlib
import json
import struct
import urllib.request
from datetime import datetime
from pathlib import Path


def rpc(url, method, params):
    request = urllib.request.Request(
        url,
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={"Content-Type": "application/json"},
    )
    response = json.load(urllib.request.urlopen(request, timeout=20))
    if "error" in response:
        raise RuntimeError(response["error"])
    return response["result"]


def verify(manifest, shipment_id=None, version=0):
    url = manifest["rpc_url"]
    status = rpc(url, "info_get_status", {})
    if status["chainspec_name"] != "casper-test":
        raise RuntimeError("Expected Casper testnet")
    block = status["last_added_block_info"]
    root = block["state_root_hash"]

    def query(key):
        return rpc(
            url,
            "query_global_state",
            {"state_identifier": {"StateRootHash": root}, "key": key, "path": []},
        )["stored_value"]

    package = query(manifest["package_hash"])["ContractPackage"]
    contract = query(manifest["contract_hash"])["Contract"]
    if package["lock_status"] != "Locked":
        raise RuntimeError("Package is not locked")
    if any(group["group_users"] for group in package["groups"]):
        raise RuntimeError("Constructor/upgrader capabilities remain in package")
    expected_contract = manifest["contract_hash"].removeprefix("hash-")
    if not any(v["contract_hash"] == "contract-" + expected_contract for v in package["versions"]):
        raise RuntimeError("Contract does not belong to expected package")
    if contract["contract_package_hash"].removeprefix("contract-package-") != manifest[
        "package_hash"
    ].removeprefix("hash-"):
        raise RuntimeError("Contract package mismatch")
    state = next(k["key"] for k in contract["named_keys"] if k["name"] == "state")
    seed = bytes.fromhex(state.split("-")[1])

    def storage(index, mapping_key=b""):
        # Pinned schema has six root fields, all using Odra legacy index encoding.
        item_key = (
            hashlib.blake2b(struct.pack(">I", index) + mapping_key, digest_size=32)
            .hexdigest()
            .encode()
        )
        address = "dictionary-" + hashlib.blake2b(seed + item_key, digest_size=32).hexdigest()
        raw = bytes.fromhex(query(address)["CLValue"]["bytes"])
        if len(raw) < 4 or int.from_bytes(raw[:4], "little") != len(raw) - 4:
            raise RuntimeError("Invalid Odra byte-vector encoding")
        return raw[4:]

    roles = ("logistician", "carrier", "clearance")
    actors = {}
    for index, role in enumerate(roles, 1):
        raw = storage(index)
        if len(raw) != 33 or raw[0] != 0:
            raise RuntimeError("Expected account address")
        account = "account-hash-" + raw[1:].hex()
        if account != manifest["actors"][role]["account_hash"]:
            raise RuntimeError("Actor mismatch: " + role)
        actors[role] = account
    result = {
        "network": "casper-test",
        "block_hash": block["hash"],
        "state_root_hash": root,
        "package_lock_status": "Locked",
        "actors": actors,
    }
    if shipment_id:
        shipment = bytes.fromhex(shipment_id)
        if len(shipment) != 32:
            raise ValueError("Shipment ID must be 32 bytes")
        (current,) = struct.unpack("<I", storage(4, shipment))
        version = version or current
        key = shipment + struct.pack("<I", version)
        header = storage(5, key)
        if len(header) != 72:
            raise RuntimeError("Invalid version header")
        decisions = {}
        for index, role in enumerate(roles):
            raw = storage(6, key + bytes([index]))
            if len(raw) not in (18, 26) or raw[0] not in (0, 1):
                raise RuntimeError("Invalid decision encoding")
            approved, decided, until = struct.unpack("<?QQ", raw[:17])
            revoked = (
                None
                if raw[17:] == b"\x00"
                else (struct.unpack("<Q", raw[18:])[0] if raw[17] == 1 and len(raw) == 26 else -1)
            )
            if revoked == -1:
                raise RuntimeError("Invalid optional timestamp")
            decisions[role] = {
                "approved": approved,
                "decided_at_ms": decided,
                "valid_until_ms": until,
                "revoked_at_ms": revoked,
            }
        now_ms = int(
            datetime.fromisoformat(block["timestamp"].replace("Z", "+00:00")).timestamp() * 1000
        )
        ready = all(
            d["approved"] and d["revoked_at_ms"] is None and now_ms < d["valid_until_ms"]
            for d in decisions.values()
        )
        state = (
            "blocked"
            if any(not d["approved"] for d in decisions.values())
            else ("ready" if ready else "collecting")
        )
        result["passport"] = {
            "shipment_id": shipment_id,
            "version": version,
            "current_version": current,
            "is_current": version == current,
            "documents_hash": header[:32].hex(),
            "route_hash": header[32:64].hex(),
            "evaluated_at_ms": now_ms,
            "status": state,
            "decisions": decisions,
        }
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "deployments/testnet.json",
    )
    parser.add_argument("--shipment-id")
    parser.add_argument("--version", type=int, default=0)
    args = parser.parse_args()
    print(
        json.dumps(
            verify(json.loads(args.manifest.read_text()), args.shipment_id, args.version), indent=2
        )
    )
