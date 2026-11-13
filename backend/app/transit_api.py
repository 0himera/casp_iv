import copy
import json
import secrets
import uuid
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from fastapi.responses import Response
from pydantic import BaseModel

from .casper import Casper
from .emissions import EmissionsComparison, EmissionsRequest, calculate
from .marine import JourneyPreview
from .marine import preview as preview_journey
from .passport_dto import PassportStateResponse, PassportVersionResponse
from .planning import prepare
from .planning_models import RecalculateRequest
from .prediction import PredictionRequest, PredictionResponse, predict
from .shipment_dto import Shipment, ShipmentList
from .transit import Transit, fail, iso
from .transit import now as utc_now
from .transit_models import (
    AddRouteCandidate,
    Attest,
    ChangeJourney,
    CreateDemoShipment,
    Operation,
    ReplaceDocument,
    RevisionInput,
    SelectRoute,
    UpdateForecast,
)

router = APIRouter(prefix="/api/v1", tags=["shipments"])


class ShipmentComparison(BaseModel):
    shipment_id: str
    shipment_revision: int
    forecast: PredictionResponse
    note: str = "User-supplied scenario; not saved, booked or validated against actual sailings"


@router.post("/shipments/{shipment_id}/route-comparison", response_model=ShipmentComparison)
def compare_routes(shipment_id: str, body: PredictionRequest, request: Request):
    shipment = Transit(request.app.state.transit).read(shipment_id)
    known = {route["id"] for route in shipment["routes"]}
    if not {route.id for route in body.routes} <= known:
        fail(422, "ROUTE_NOT_IN_SHIPMENT", "Маршрут отсутствует в карточке отправки")
    return ShipmentComparison(
        shipment_id=shipment_id,
        shipment_revision=shipment["revision"],
        forecast=predict(body),
    )


@router.post("/shipments/{shipment_id}/emissions-comparison", response_model=EmissionsComparison)
def compare_emissions(shipment_id: str, body: EmissionsRequest, request: Request):
    shipment = Transit(request.app.state.transit).read(shipment_id)
    if not {route.route_id for route in body.routes} <= {r["id"] for r in shipment["routes"]}:
        fail(422, "ROUTE_NOT_IN_SHIPMENT", "Маршрут отсутствует в карточке отправки")
    return calculate(shipment, body)


def service(request: Request):
    return Transit(request.app.state.transit)


def actor(request: Request, authorization: Annotated[str | None, Header()] = None):
    settings = request.app.state.settings
    if not authorization or not authorization.startswith("Bearer "):
        fail(401, "UNAUTHORIZED", "Нужен Bearer токен роли")
    token = authorization.removeprefix("Bearer ")
    for role, expected in settings.role_tokens.items():
        if secrets.compare_digest(token, expected):
            return role
    fail(401, "UNAUTHORIZED", "Нужен Bearer токен роли")


def command_actor(request: Request, role: Annotated[str, Depends(actor)]):
    if not request.app.state.settings.transit_writes:
        fail(503, "WRITES_DISABLED", "Запись отключена конфигурацией сервера")
    return role


def idempotency(idempotency_key: Annotated[str, Header(min_length=1, max_length=128)]):
    return idempotency_key


Service = Annotated[Transit, Depends(service)]
Actor = Annotated[str, Depends(command_actor)]
Reader = Annotated[str, Depends(actor)]
Idempotency = Annotated[str, Depends(idempotency)]


@router.get("/shipments", response_model=ShipmentList)
def shipments(svc: Service):
    return svc.listing()


@router.get("/shipments/{shipment_id}", response_model=Shipment)
def shipment(shipment_id: str, svc: Service):
    return svc.read(shipment_id)


@router.get("/operations/{operation_id}", response_model=Operation)
def operation(operation_id: str, svc: Service):
    return svc.operation(operation_id)


@router.post("/shipments", status_code=202, response_model=Operation)
def create(body: CreateDemoShipment, svc: Service, role: Actor, idem: Idempotency):
    return svc.enqueue(role, "create", None, body.model_dump(), idem)


@router.post("/shipments/{shipment_id}/forecast", response_model=Shipment)
def update_forecast(
    shipment_id: str, body: UpdateForecast, svc: Service, role: Actor, idem: Idempotency
):
    return svc.update_forecast(role, shipment_id, body, idem)


@router.post("/shipments/{shipment_id}/recalculate", response_model=Shipment)
async def recalculate(
    shipment_id: str,
    body: RecalculateRequest,
    request: Request,
    svc: Service,
    role: Actor,
    idem: Idempotency,
):
    if role != "logistician":
        fail(403, "FORBIDDEN", "Расчёт запускает логист")
    data = {"operation": "recalculate", **body.model_dump(mode="json")}
    cached = svc.cached_forecast(shipment_id, data, idem)
    if cached is not None:
        return cached
    shipment = svc.read(shipment_id)
    if shipment["revision"] != body.expected_revision:
        fail(409, "REVISION_CONFLICT", "Отправка изменилась; обновите карточку")
    if shipment["pending_operation_id"]:
        fail(409, "OPERATION_PENDING", "Дождитесь текущей операции")
    try:
        scenario, prepared = await prepare(
            shipment,
            body,
            request.app.state.data,
            request.app.state.settings,
            utc_now(),
        )
    except ValueError as exc:
        fail(422, "INVALID_PLANNING_INPUT", str(exc))
    return svc.update_forecast(
        role,
        shipment_id,
        UpdateForecast(expected_revision=body.expected_revision, scenario=scenario),
        idem,
        prepared=prepared,
        request_data=data,
    )


@router.get("/marine-route", response_model=JourneyPreview)
def marine_route(origin_port_id: str, destination_port_id: str):
    try:
        return preview_journey(origin_port_id, destination_port_id)
    except ValueError as exc:
        fail(422, "MARINE_ROUTE_UNAVAILABLE", str(exc))


@router.post("/shipments/{shipment_id}/journey", status_code=202, response_model=Operation)
async def change_journey(
    shipment_id: str,
    body: ChangeJourney,
    request: Request,
    svc: Service,
    role: Actor,
    idem: Idempotency,
):
    if role != "logistician":
        fail(403, "FORBIDDEN", "Направление отправки меняет логист")
    # Replay before weather access or revision validation. enqueue verifies the body digest.
    with svc.store.connect() as db:
        replay = db.execute(
            "SELECT 1 FROM operations WHERE scope=? AND idem=?",
            (f"{role}:{shipment_id}:change_journey", idem),
        ).fetchone()
    if replay:
        return svc.enqueue(role, "change_journey", shipment_id, body.model_dump(), idem)
    shipment = svc.read(shipment_id)
    if shipment["revision"] != body.expected_revision:
        fail(409, "REVISION_CONFLICT", "Отправка изменилась; обновите карточку")
    if shipment["pending_operation_id"]:
        fail(409, "OPERATION_PENDING", "Дождитесь текущей операции")
    try:
        path = preview_journey(body.origin_port_id, body.destination_port_id)
    except ValueError as exc:
        fail(422, "MARINE_ROUTE_UNAVAILABLE", str(exc))
    candidate = copy.deepcopy(shipment)
    journey = {
        "origin": path.origin.model_dump(),
        "destination": path.destination.model_dump(),
        "current_location": path.origin.model_dump(),
        "movement_status": "planned",
        "routes": [path.route.model_dump()],
        "selected_route_id": path.route.id,
    }
    candidate.update(journey)
    start = utc_now()
    options = RecalculateRequest(
        expected_revision=body.expected_revision,
        assumptions=(shipment.get("planning") or {}).get("assumptions", {}),
    )
    scenario, prepared = await prepare(
        candidate, options, request.app.state.data, request.app.state.settings, start
    )
    result = predict(scenario).routes[0].model_dump(mode="json")
    missing = path.route.id in prepared["missing"]
    route = prepared["routes"][0]
    route.update(
        miss_probability=None if missing else result["probability_target_cutoff_missed"],
        eta=dict.fromkeys(("p10", "p50", "p90"))
        if missing
        else result["delivery_eta"] or dict.fromkeys(("p10", "p50", "p90")),
    )
    forecast = {
        "id": "forecast_" + uuid.uuid4().hex,
        "generated_at": iso(start),
        "valid_until": iso(start + timedelta(hours=1)),
        "method": "monte_carlo",
        "quality": "missing" if missing else "synthetic",
        "ready_at": dict.fromkeys(("p10", "p50", "p90")) if missing else result["ready_at"],
        "cargo_cutoff": iso(scenario.routes[0].sailings[0].cutoff_at),
        "miss_probability": route["miss_probability"],
        "reasons": [
            "Monte Carlo: морской маршрут, открытая погода и сценарные условия.",
            *prepared["planning"]["inputs"][0]["warnings"],
        ],
    }
    prepared["planning"]["emissions"]["shipment_revision"] = shipment["revision"] + 1
    sources = [s for s in shipment["sources"] if s["id"] not in ("planning", "marine_geometry")]
    sources.extend(
        [
            {
                "id": "marine_geometry",
                "name": "Морской маршрут по маске воды",
                "url": None,
                "quality": "synthetic",
                "observed_at": iso(start),
                "note": " ".join(path.warnings),
            },
            {
                "id": "planning",
                "name": "Расчёт по погоде и сценарным условиям",
                "url": None,
                "quality": "synthetic",
                "observed_at": iso(start),
                "note": prepared["planning"]["note"],
            },
        ]
    )
    journey.update(
        routes=prepared["routes"],
        planning=prepared["planning"],
        forecast=forecast,
        data_mode="mixed",
        scenario_time=iso(start),
        sources=sources,
    )
    return svc.enqueue(
        role, "change_journey", shipment_id, body.model_dump(), idem, journey=journey
    )


@router.post("/shipments/{shipment_id}/route-candidates", response_model=Shipment)
def add_route_candidate(
    shipment_id: str, body: AddRouteCandidate, svc: Service, role: Actor, idem: Idempotency
):
    return svc.add_route_candidate(role, shipment_id, body, idem)


@router.post("/shipments/{shipment_id}/route-selection", status_code=202, response_model=Operation)
def route(shipment_id: str, body: SelectRoute, svc: Service, role: Actor, idem: Idempotency):
    return svc.enqueue(role, "select_route", shipment_id, body.model_dump(), idem)


@router.post(
    "/shipments/{shipment_id}/document-revisions", status_code=202, response_model=Operation
)
def document(shipment_id: str, body: ReplaceDocument, svc: Service, role: Actor, idem: Idempotency):
    return svc.enqueue(role, "replace_document", shipment_id, body.model_dump(), idem)


@router.post("/shipments/{shipment_id}/attestations", status_code=202, response_model=Operation)
def attest(shipment_id: str, body: Attest, svc: Service, role: Actor, idem: Idempotency):
    return svc.enqueue(role, "attest", shipment_id, body.model_dump(), idem)


@router.post("/shipments/{shipment_id}/revocations", status_code=202, response_model=Operation)
def revoke(shipment_id: str, body: RevisionInput, svc: Service, role: Actor, idem: Idempotency):
    return svc.enqueue(role, "revoke", shipment_id, body.model_dump(), idem)


@router.get("/shipments/{shipment_id}/documents/{document_id}/versions/{version}")
def download(shipment_id: str, document_id: str, version: int, svc: Service, role: Reader):
    with svc.store.connect() as db:
        row = db.execute(
            "SELECT content FROM documents WHERE shipment_id=? AND id=? AND version=?",
            (shipment_id, document_id, version),
        ).fetchone()
    if not row:
        fail(404, "DOCUMENT_NOT_FOUND", "Подтверждённая версия документа не найдена")
    return Response(
        row[0],
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment", "X-Content-Type-Options": "nosniff"},
    )


@router.get("/shipments/{shipment_id}/versions/{version}", response_model=PassportVersionResponse)
def history(shipment_id: str, version: int, svc: Service, role: Reader):
    with svc.store.connect() as db:
        row = db.execute(
            "SELECT snapshot,proof FROM versions WHERE shipment_id=? AND version=?",
            (shipment_id, version),
        ).fetchone()
    if not row:
        fail(404, "VERSION_NOT_FOUND", "Версия не найдена")
    return {"shipment": json.loads(row["snapshot"]), "commitment_proof": json.loads(row["proof"])}


@router.get("/shipments/{shipment_id}/passport-state", response_model=PassportStateResponse)
def passport_state(shipment_id: str, svc: Service):
    row = svc.store.shipment(shipment_id)
    if not row:
        fail(404, "SHIPMENT_NOT_FOUND", "Отправка не найдена")
    try:
        state = Casper().passport(row["chain_id"])
    except Exception:
        fail(503, "CHAIN_UNAVAILABLE", "Не удалось прочитать состояние Casper")
    return {"chain_shipment_id": row["chain_id"], "passport": state}
