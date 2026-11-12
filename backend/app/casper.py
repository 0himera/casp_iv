"""Pinned Casper testnet/ Odra 2.10.1 adapter. Signing never broadcasts."""

import hashlib
import json
import struct
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path

import httpx

from .config import REPOSITORY_ROOT

MANIFEST = REPOSITORY_ROOT / "contracts/deployments/testnet.json"
ROLES = ("logistician", "carrier", "customs")


class ChainError(RuntimeError):
    pass


class RPCError(ChainError):
    def __init__(self, error):
        self.error = error
        super().__init__(str(error))


class Casper:
    def __init__(self, key_paths=None):
        self.manifest = json.loads(MANIFEST.read_text())
        self.keys = key_paths or {}

    def rpc(self, method, params):
        response = httpx.post(
            self.manifest["rpc_url"],
            json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
            timeout=20,
        )
        response.raise_for_status()
        result = response.json()
        if "error" in result:
            raise RPCError(result["error"])
        return result["result"]

    def block(self):
        status = self.rpc("info_get_status", {})
        if status["chainspec_name"] != "casper-test":
            raise ChainError("Expected Casper testnet")
        return status["last_added_block_info"]

    def query(self, root, key):
        return self.rpc(
            "query_global_state",
            {"state_identifier": {"StateRootHash": root}, "key": key, "path": []},
        )["stored_value"]

    def storage(self, root, seed, index, key=b"", optional=False):
        item = hashlib.blake2b(struct.pack(">I", index) + key, digest_size=32).hexdigest()
        address = "dictionary-" + hashlib.blake2b(seed + item.encode(), digest_size=32).hexdigest()
        try:
            value = self.query(root, address)["CLValue"]
        except RPCError as exc:
            if (
                optional
                and exc.error.get("code") == -32003
                and exc.error.get("data") == ("value was not found in the global state")
            ):
                return None
            raise
        raw = bytes.fromhex(value["bytes"])
        if len(raw) < 4 or int.from_bytes(raw[:4], "little") != len(raw) - 4:
            raise ChainError("Invalid Odra byte vector")
        return raw[4:]

    def context(self):
        block = self.block()
        root = block["state_root_hash"]
        contract = self.query(root, self.manifest["contract_hash"])["Contract"]
        package = self.query(root, self.manifest["package_hash"])["ContractPackage"]
        expected = self.manifest["package_hash"].removeprefix("hash-")
        if contract["contract_package_hash"] != "contract-package-" + expected:
            raise ChainError("Unexpected contract package")
        if package["lock_status"] != "Locked" or any(g["group_users"] for g in package["groups"]):
            raise ChainError("Contract package is not locked")
        seed = bytes.fromhex(
            next(k["key"] for k in contract["named_keys"] if k["name"] == "state").split("-")[1]
        )
        for index, role in enumerate(ROLES, 1):
            raw = self.storage(root, seed, index)
            chain_role = "clearance" if role == "customs" else role
            actor = self.manifest["actors"][chain_role]
            if raw != b"\x00" + bytes.fromhex(actor["account_hash"].split("-")[-1]):
                raise ChainError("Unexpected contract actor")
        return block, seed

    def passport(self, shipment_id, version=0):
        block, seed = self.context()
        root = block["state_root_hash"]
        shipment = bytes.fromhex(shipment_id)
        raw = self.storage(root, seed, 4, shipment, optional=True)
        if raw is None:
            return None
        (current,) = struct.unpack("<I", raw)
        version = version or current
        key = shipment + struct.pack("<I", version)
        header = self.storage(root, seed, 5, key)
        if len(header) != 72:
            raise ChainError("Invalid passport header")
        decisions = {}
        for index, role in enumerate(ROLES):
            raw = self.storage(root, seed, 6, key + bytes([index]), optional=True)
            if raw is None:
                continue
            if len(raw) not in (18, 26) or raw[0] not in (0, 1):
                raise ChainError("Invalid decision encoding")
            approved, decided, until = struct.unpack("<?QQ", raw[:17])
            if raw[17:] == b"\x00":
                revoked = None
            elif len(raw) == 26 and raw[17] == 1:
                (revoked,) = struct.unpack("<Q", raw[18:])
            else:
                raise ChainError("Invalid revocation encoding")
            decisions[role] = {
                "approved": approved,
                "decided_at_ms": decided,
                "valid_until_ms": until,
                "revoked_at_ms": revoked,
            }
        now = int(datetime.fromisoformat(block["timestamp"]).timestamp() * 1000)
        ready = len(decisions) == 3 and all(
            d["approved"] and d["revoked_at_ms"] is None and d["valid_until_ms"] > now
            for d in decisions.values()
        )
        return {
            "version": version,
            "current_version": current,
            "documents_hash": header[:32].hex(),
            "route_hash": header[32:64].hex(),
            "decisions": decisions,
            "evaluated_at_ms": now,
            "status": "blocked"
            if any(not d["approved"] for d in decisions.values())
            else ("ready" if ready else "collecting"),
            "block_hash": block["hash"],
            "state_root_hash": root,
        }

    def prepare(self, plan):
        # Validate network, package and immutable actors before signing funded calls.
        self.context()
        role = plan["role"]
        args = plan["args"]
        result = subprocess.run(
            [
                "casper-client",
                "make-deploy",
                "--secret-key",
                self.keys[role],
                "--chain-name",
                "casper-test",
                "--gas-price",
                "3",
                "--payment-amount",
                "50000000000",
                "--ttl",
                "30min",
                "--session-hash",
                self.manifest["contract_hash"],
                "--session-entry-point",
                plan["entry_point"],
                "--session-args-json",
                json.dumps(args),
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode:
            raise ChainError("Signing failed; check CLI and key configuration")
        signed = json.loads(result.stdout[result.stdout.index("{") :])
        actor = self.manifest["actors"]["clearance" if role == "customs" else role]
        if signed["header"]["account"] != actor["public_key"]:
            raise ChainError("Signing key does not match contract role")
        return signed

    def broadcast(self, signed):
        with tempfile.TemporaryDirectory(prefix="caspian-deploy-") as directory:
            path = Path(directory) / "deploy.json"
            path.write_text(json.dumps(signed))
            result = subprocess.run(
                [
                    "casper-client",
                    "send-deploy",
                    "--node-address",
                    self.manifest["rpc_url"],
                    "--input",
                    str(path),
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode:
                # A node/CLI timeout is ambiguous. Worker retains this exact signed deploy.
                raise ChainError("Broadcast unconfirmed")

    def execution(self, deploy_hash):
        try:
            result = self.rpc(
                "info_get_deploy", {"deploy_hash": deploy_hash, "finalized_approvals": False}
            )
        except RPCError as exc:
            if exc.error.get("code") == -32000 and exc.error.get("message") == "No such deploy":
                return None
            raise
        execution = result.get("execution_info")
        if not execution:
            return None
        value = execution["execution_result"]["Version2"]
        return {"error": value["error_message"], "block_hash": execution["block_hash"]}
