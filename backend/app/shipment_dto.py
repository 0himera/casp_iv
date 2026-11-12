"""Response DTOs mirror api/openapi.json; the pending passport starts at version zero."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DTO(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


Role = Literal["logistician", "carrier", "customs"]


Quality = Literal["observed", "forecast", "synthetic", "stale", "missing"]


Action = Literal["select_route", "replace_document", "attest", "run_scenario"]


class Location(DTO):
    id: str
    name: str
    latitude: float
    longitude: float


class Source(DTO):
    id: str
    name: str
    url: str | None
    quality: Quality
    observed_at: str | None
    note: str


class Eta(DTO):
    p10: str | None
    p50: str | None
    p90: str | None


class Money(DTO):
    amount_minor: int = Field(ge=0)
    currency: Literal["RUB"]


class Geometry(DTO):
    type: Literal["LineString"]
    coordinates: list[list[float]]


class Route(DTO):
    id: str
    name: str
    ports: list[str]
    modes: list[Literal["rail", "road", "sea"]]
    distance_km: float = Field(ge=0)
    geometry: Geometry
    geometry_kind: Literal["schematic", "measured"]
    eta: Eta
    miss_probability: float | None = Field(ge=0, le=1)
    cost: Money
    emissions_kg_co2e: float | None = Field(ge=0)
    emissions_method: str
    feasible: bool
    infeasibility_reason: str | None
    capacity_status: Literal["confirmed", "unknown", "synthetic"]
    requires_reapproval: bool
    source_ids: list[str]


class Forecast(DTO):
    id: str
    generated_at: str
    valid_until: str
    method: Literal["scenario_fixture", "monte_carlo", "ml"]
    quality: Quality
    ready_at: Eta
    cargo_cutoff: str
    miss_probability: float | None = Field(ge=0, le=1)
    reasons: list[str]


class Document(DTO):
    id: str
    kind: Literal["invoice", "packing_list"]
    filename: str
    version: int = Field(ge=1)
    sha256: str


class Attestation(DTO):
    role: Role
    version: int = Field(ge=1)
    decision: Literal["approved", "rejected"]
    status: Literal["active", "invalidated", "expired", "revoked"]
    valid_until: str


class Passport(DTO):
    version: int = Field(ge=0)
    status: Literal["collecting", "ready", "blocked"]
    documents_hash: str
    route_hash: str
    required_roles: list[Role]
    attestations: list[Attestation]
    network: Literal["mock", "casper-test"]
    contract_address: str | None
    transaction_hash: str | None
    explorer_url: str | None


class TimelineEvent(DTO):
    id: str
    occurred_at: str
    actor: str
    title: str
    passport_version: int = Field(ge=1)


class Shipment(DTO):
    id: str
    revision: int = Field(ge=1)
    title: str
    mass_tonnes: float = Field(ge=0)
    origin: Location
    destination: Location
    current_location: Location
    movement_status: Literal["planned", "in_transit", "at_port", "delivered"]
    scenario_time: str
    updated_at: str
    data_mode: Literal["synthetic", "mixed", "live"]
    selected_route_id: str
    forecast: Forecast
    routes: list[Route]
    documents: list[Document]
    passport: Passport
    timeline: list[TimelineEvent]
    sources: list[Source]
    allowed_actions: list[Action]
    pending_operation_id: str | None


class ShipmentSummary(DTO):
    id: str
    title: str
    origin: str
    destination: str
    movement_status: Literal["planned", "in_transit", "at_port", "delivered"]
    eta: str | None
    miss_probability: float | None = Field(ge=0, le=1)
    passport_status: Literal["collecting", "ready", "blocked"]


class ShipmentList(DTO):
    items: list[ShipmentSummary]


for _model in (
    Location,
    Source,
    Eta,
    Money,
    Geometry,
    Route,
    Forecast,
    Document,
    Attestation,
    Passport,
    TimelineEvent,
    Shipment,
    ShipmentSummary,
    ShipmentList,
):
    _model.model_rebuild()
