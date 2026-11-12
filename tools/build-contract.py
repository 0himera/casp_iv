"""Regenerate the OpenAPI schema and seed fixture using Python stdlib only."""
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
S = {}


def ref(name):
    return {"$ref": f"#/components/schemas/{name}"}


def string(**kw):
    return {"type": "string", **kw}


def enum(*values):
    return string(enum=list(values))


def number(nullable=False, **kw):
    return {"type": ["number", "null"] if nullable else "number", **kw}


def integer(**kw):
    return {"type": "integer", "minimum": 0, **kw}


def array(item):
    return {"type": "array", "items": item}


def obj(**props):
    return {"type": "object", "additionalProperties": False,
            "properties": props, "required": list(props)}


date = string(format="date-time")
maybe_date = {"type": ["string", "null"], "format": "date-time"}
maybe_string = {"type": ["string", "null"]}
boolean = {"type": "boolean"}
probability = number(True, minimum=0, maximum=1)
S["Role"] = enum("logistician", "carrier", "customs")
S["Quality"] = enum("observed", "forecast", "synthetic", "stale", "missing")
S["Action"] = enum("select_route", "replace_document", "attest", "run_scenario")
S["Location"] = obj(id=string(), name=string(), latitude=number(), longitude=number())
S["Source"] = obj(id=string(), name=string(), url=maybe_string, quality=ref("Quality"),
                  observed_at=maybe_date, note=string())
S["Eta"] = obj(p10=maybe_date, p50=maybe_date, p90=maybe_date)
S["Money"] = obj(amount_minor=integer(), currency=enum("RUB"))
S["Geometry"] = obj(type=enum("LineString"), coordinates=array({"type": "array", "items": number(),
                                                                               "minItems": 2, "maxItems": 2}))
S["Route"] = obj(id=string(), name=string(), ports=array(string()), modes=array(enum("rail", "road", "sea")),
                 distance_km=number(minimum=0), geometry=ref("Geometry"), geometry_kind=enum("schematic", "measured"),
                 eta=ref("Eta"), miss_probability=probability, cost=ref("Money"),
                 emissions_kg_co2e=number(True, minimum=0), emissions_method=string(),
                 feasible=boolean, infeasibility_reason=maybe_string,
                 capacity_status=enum("confirmed", "unknown", "synthetic"),
                 requires_reapproval=boolean, source_ids=array(string()))
S["Forecast"] = obj(id=string(), generated_at=date, valid_until=date,
                    method=enum("scenario_fixture", "monte_carlo", "ml"),
                    quality=ref("Quality"), ready_at=ref("Eta"), cargo_cutoff=date,
                    miss_probability=probability, reasons=array(string()))
S["Document"] = obj(id=string(), kind=enum("invoice", "packing_list"), filename=string(),
                    version=integer(minimum=1), sha256=string(pattern="^[a-f0-9]{64}$"))
S["Attestation"] = obj(role=ref("Role"), version=integer(minimum=1),
                       decision=enum("approved", "rejected"),
                       status=enum("active", "invalidated", "expired", "revoked"),
                       valid_until=date)
S["Passport"] = obj(version=integer(minimum=1), status=enum("collecting", "ready", "blocked"),
                    documents_hash=string(), route_hash=string(), required_roles=array(ref("Role")),
                    attestations=array(ref("Attestation")), network=enum("mock", "casper-test"),
                    contract_address=maybe_string, transaction_hash=maybe_string, explorer_url=maybe_string)
S["TimelineEvent"] = obj(id=string(), occurred_at=date, actor=string(), title=string(),
                         passport_version=integer(minimum=1))
S["Shipment"] = obj(id=string(), revision=integer(minimum=1), title=string(), mass_tonnes=number(minimum=0),
                    origin=ref("Location"), destination=ref("Location"), current_location=ref("Location"),
                    movement_status=enum("planned", "in_transit", "at_port", "delivered"),
                    scenario_time=date, updated_at=date, data_mode=enum("synthetic", "mixed", "live"),
                    selected_route_id=string(), forecast=ref("Forecast"), routes=array(ref("Route")),
                    documents=array(ref("Document")), passport=ref("Passport"), timeline=array(ref("TimelineEvent")),
                    sources=array(ref("Source")), allowed_actions=array(ref("Action")), pending_operation_id=maybe_string)
S["ShipmentSummary"] = obj(id=string(), title=string(), origin=string(), destination=string(),
                           movement_status=S["Shipment"]["properties"]["movement_status"], eta=maybe_date,
                           miss_probability=probability, passport_status=S["Passport"]["properties"]["status"])
S["ShipmentList"] = obj(items=array(ref("ShipmentSummary")))
S["Operation"] = obj(id=string(), shipment_id=string(),
                     status=enum("queued", "submitted", "confirmed", "simulated", "failed"),
                     kind=enum("select_route", "replace_document", "attest"),
                     network=enum("mock", "casper-test"), transaction_hash=maybe_string, explorer_url=maybe_string,
                     created_at=date, result_revision={"type": ["integer", "null"], "minimum": 1},
                     error_code=maybe_string)
S["Health"] = obj(status=enum("ok"), mode=enum("mock"), api_version=string())
S["ErrorResponse"] = obj(error=obj(code=string(), message=string()))
S["RouteSelectionRequest"] = obj(route_id=string(), forecast_id=string(), expected_revision=integer(minimum=1))
S["DocumentRevisionRequest"] = obj(document_id=string(), filename=string(minLength=1, maxLength=255),
                                    content_base64=string(minLength=4, maxLength=1398104), expected_revision=integer(minimum=1))
S["AttestationRequest"] = obj(decision=enum("approved", "rejected"), expected_revision=integer(minimum=1))
S["ScenarioRequest"] = obj(shipment_id=string(), scenario=enum("normal", "storm", "missing_data"),
                           expected_revision=integer(minimum=1))

paths = {}


def endpoint(path, method, response, request=None):
    parameters = []
    if "{id}" in path:
        parameters.append({"name": "id", "in": "path", "required": True, "schema": string()})
    responses = {"200" if not request or response == "Shipment" else "202": {
        "description": "Success", "content": {"application/json": {"schema": ref(response)}}}}
    for code in ["400", "401", "403", "404", "409", "413", "422"]:
        responses[code] = {"description": "Error", "content": {"application/json": {"schema": ref("ErrorResponse")}}}
    entry = {"operationId": method + "_" + path.replace("/", "_").replace("{", "").replace("}", ""),
             "parameters": parameters, "responses": responses}
    if request:
        parameters.append({"name": "Idempotency-Key", "in": "header", "required": True,
                           "schema": string(minLength=1, maxLength=128)})
        entry["security"] = [{"DemoBearer": []}]
        entry["requestBody"] = {"required": True, "content": {"application/json": {"schema": ref(request)}}}
    else:
        entry["security"] = [{}, {"DemoBearer": []}]
    paths.setdefault(path, {})[method] = entry


endpoint("/health", "get", "Health")
endpoint("/shipments", "get", "ShipmentList")
endpoint("/shipments/{id}", "get", "Shipment")
endpoint("/operations/{id}", "get", "Operation")
endpoint("/shipments/{id}/route-selection", "post", "Operation", "RouteSelectionRequest")
endpoint("/shipments/{id}/document-revisions", "post", "Operation", "DocumentRevisionRequest")
endpoint("/shipments/{id}/attestations", "post", "Operation", "AttestationRequest")
endpoint("/demo/scenarios", "post", "Shipment", "ScenarioRequest")
api = {"openapi": "3.1.0", "info": {"title": "Caspian Flow API", "version": "1.0.0",
       "description": "MVP contract. Local mock uses synthetic logistics and simulated chain operations."},
       "servers": [{"url": "http://localhost:4010/api/v1"}], "paths": paths,
       "components": {"schemas": S, "securitySchemes": {"DemoBearer": {"type": "http", "scheme": "bearer",
       "description": "Local mock only: demo-logistician, demo-carrier, demo-customs. Not production authentication."}}}}


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def eta(day, hour):
    base = datetime(2026, 11, day, hour, tzinfo=timezone.utc)
    return {f"p{p}": (base + timedelta(hours=offset)).isoformat().replace('+00:00', 'Z')
            for p, offset in [(10, -2), (50, 0), (90, 4)]}


routes = []
for rid, name, ports, coords, distance, day, hour, risk, price, co2 in [
    ("route_astra", "Через Астрахань", ["Астрахань", "Энзели"], [[44.5,48.7],[48.04,46.35],[50,43],[49.46,37.47]], 1500,15,8,.16,24000000,540),
    ("route_makh", "Через Махачкалу", ["Махачкала", "Энзели"], [[44.5,48.7],[47.5,42.98],[49.46,37.47]], 1700,15,20,.22,31000000,760)
]:
    routes.append(dict(id=rid, name=name, ports=ports, modes=["rail", "sea"] if rid=="route_astra" else ["road", "sea"],
                       distance_km=distance, geometry={"type":"LineString", "coordinates":coords}, geometry_kind="schematic",
                       eta=eta(day,hour), miss_probability=risk, cost={"amount_minor":price,"currency":"RUB"},
                       emissions_kg_co2e=co2, emissions_method="Условные коэффициенты; перевозка без терминальных операций",
                       feasible=True, infeasibility_reason=None, capacity_status="synthetic",
                       requires_reapproval=rid!="route_astra", source_ids=["demo"]))
docs = [dict(id="doc_invoice",kind="invoice",filename="invoice-demo.txt",version=1,sha256=digest("demo invoice v1")),
        dict(id="doc_packing",kind="packing_list",filename="packing-demo.txt",version=1,sha256=digest("demo packing v1"))]
fixture = dict(id="shp_demo_001",revision=1,title="Контейнер с оборудованием",mass_tonnes=20,
    origin=dict(id="volgograd",name="Волгоград",latitude=48.7,longitude=44.5),
    destination=dict(id="anzali",name="Энзели",latitude=37.47,longitude=49.46),
    current_location=dict(id="volgograd",name="Терминал Волгоград",latitude=48.7,longitude=44.5),
    movement_status="in_transit",scenario_time="2026-11-12T08:00:00Z",updated_at="2026-11-12T08:00:00Z",data_mode="synthetic",
    selected_route_id="route_astra",forecast=dict(id="forecast_seed",generated_at="2026-11-12T08:00:00Z",
      valid_until="2026-11-12T08:15:00Z",method="scenario_fixture",quality="synthetic",ready_at=eta(13,8),
      cargo_cutoff="2026-11-13T11:00:00Z",miss_probability=.16,reasons=["Запас до закрытия приёма груза — 3 часа по медианному сценарию"]),
    routes=routes,documents=docs,passport=dict(version=1,status="collecting",documents_hash=digest("demo manifest v1"),
      route_hash=digest("route_astra"),required_roles=["logistician","carrier","customs"],
      attestations=[dict(role=role,version=1,decision="approved",status="active",valid_until="2026-11-14T08:00:00Z")
                    for role in ["logistician","carrier"]],network="mock",contract_address=None,transaction_hash=None,explorer_url=None),
    timeline=[dict(id="evt_seed",occurred_at="2026-11-12T08:00:00Z",actor="system",title="Создан демонстрационный паспорт",
                   passport_version=1)],
    sources=[dict(id="demo",name="Воспроизводимый сценарий",url=None,quality="synthetic",observed_at=None,
                  note="Расписание, очередь, прогноз, стоимость, вместимость и выбросы условные; это не live данные")],
    allowed_actions=["select_route","replace_document","attest","run_scenario"],pending_operation_id=None)

fixture['passport']['documents_hash'] = digest(json.dumps(
    sorted([[d['id'],d['version'],d['sha256']] for d in docs]), ensure_ascii=False, separators=(',',':')))
r = routes[0]
fixture['passport']['route_hash'] = digest(json.dumps(
    [r['id'],r['ports'],r['modes'],r['geometry']], ensure_ascii=False, separators=(',',':')))

for path, value in [("api/openapi.json", api), ("api/fixtures/shipment.json", fixture)]:
    (ROOT/path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n")
