"""Shipment HTTP requests. Response DTOs remain compatible with api/types.ts."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .prediction import PredictionRequest
from .shipment_dto import Route

Role = Literal["logistician", "carrier", "customs"]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class CreateDemoShipment(Input):
    template: Literal["demo"]
    title: str = Field(default="Контейнер с оборудованием", min_length=1, max_length=200)


class RevisionInput(Input):
    expected_revision: int = Field(ge=1)


class ChangeJourney(RevisionInput):
    origin_port_id: str = Field(min_length=1, max_length=100)
    destination_port_id: str = Field(min_length=1, max_length=100)


class SelectRoute(RevisionInput):
    route_id: str = Field(min_length=1, max_length=100)
    forecast_id: str = Field(min_length=1, max_length=100)


class ReplaceDocument(RevisionInput):
    document_id: str = Field(min_length=1, max_length=100)
    filename: str = Field(min_length=1, max_length=255, pattern=r"^[^/\\\x00-\x1f]+$")
    content_base64: str = Field(min_length=4, max_length=1398104)


class Attest(RevisionInput):
    decision: Literal["approved", "rejected"]


class UpdateForecast(RevisionInput):
    scenario: PredictionRequest


class AddRouteCandidate(RevisionInput):
    route: Route


class Operation(Input):
    id: str
    shipment_id: str
    status: Literal["queued", "submitted", "confirmed", "failed"]
    kind: Literal[
        "create", "select_route", "replace_document", "attest", "revoke", "change_journey"
    ]
    network: Literal["casper-test"] = "casper-test"
    transaction_hash: str | None = None
    explorer_url: str | None = None
    created_at: str
    result_revision: int | None = None
    error_code: str | None = None
