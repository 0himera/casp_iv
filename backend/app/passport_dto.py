"""Typed read contracts for the confirmed archive and direct Casper inspection."""

from typing import Any, Literal

from .shipment_dto import DTO, Role, Shipment


class ChainDecision(DTO):
    approved: bool
    decided_at_ms: int
    valid_until_ms: int
    revoked_at_ms: int | None


class ChainPassportState(DTO):
    version: int
    current_version: int
    documents_hash: str
    route_hash: str
    decisions: dict[Role, ChainDecision]
    evaluated_at_ms: int
    status: Literal["collecting", "ready", "blocked"]
    block_hash: str
    state_root_hash: str


class PassportStateResponse(DTO):
    chain_shipment_id: str
    passport: ChainPassportState | None


class PassportVersionResponse(DTO):
    shipment: Shipment
    commitment_proof: dict[str, Any]
