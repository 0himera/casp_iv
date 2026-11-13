"""Offline, water-mask-validated sea geometry; never a navigational clearance."""

import json
import math
from functools import lru_cache

from .config import REPOSITORY_ROOT
from .shipment_dto import Location, Route
from .transit_models import Input


class JourneyPreview(Input):
    origin: Location
    destination: Location
    route: Route
    sea_distance_km: float
    approach_gap_km: float
    warnings: list[str]


@lru_cache(maxsize=1)
def geometry():
    return json.loads((REPOSITORY_ROOT / "data/geography/marine-routes.json").read_text())


def km(a, b):
    lat1, lat2 = math.radians(a[1]), math.radians(b[1])
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(math.radians(b[0] - a[0]) / 2) ** 2
    )
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))


def preview(origin_id, destination_id):
    ports = {
        p["id"]: p for p in json.loads((REPOSITORY_ROOT / "data/ports.json").read_text())["ports"]
    }
    if origin_id not in ports or destination_id not in ports:
        raise ValueError("Выберите оба порта из каталога Каспия")
    if origin_id == destination_id:
        raise ValueError("Порты отправления и назначения должны отличаться")
    data = geometry()
    key = "|".join(sorted((origin_id, destination_id)))
    points = data["routes"].get(key)
    if not points:
        raise ValueError(
            "Астрахань — Оля требует отдельного речного маршрута"
        )
    if origin_id > destination_id:
        points = list(reversed(points))

    def location(port_id):
        p = ports[port_id]
        return Location(
            id=port_id, name=p["name_ru"], latitude=p["latitude"], longitude=p["longitude"]
        )

    origin, destination = location(origin_id), location(destination_id)
    sea = sum(km(a, b) for a, b in zip(points, points[1:]))
    gap = sum(data["anchors"][p]["offshore_gap_km"] for p in (origin_id, destination_id))
    warnings = [
        "Морская линия обходит сушу; глубины и ограничения судна не проверены.",
        "Рейс, места и тариф не подтверждены оператором.",
        "Портовые подходы не показаны. Время и ESG подходов оцениваются "
        "по расстоянию, не по фарватеру.",
    ]
    if {origin_id, destination_id} & {"astrakhan", "olya"}:
        warnings.append(
            "Речной подход по ВКМСК не построен: морская линия начинается у входа в канал."
        )
    route = Route(
        id=f"sea_{origin_id}_{destination_id}",
        name=f"{origin.name} → {destination.name}",
        ports=[origin_id, destination_id],
        modes=["sea"],
        distance_km=round(sea + gap, 1),
        geometry={"type": "LineString", "coordinates": points},
        geometry_kind="schematic",
        eta={"p10": None, "p50": None, "p90": None},
        miss_probability=None,
        cost={"amount_minor": 0, "currency": "RUB"},
        emissions_kg_co2e=None,
        emissions_method="Требуется расчёт по погоде и сценарным условиям",
        feasible=True,
        infeasibility_reason=None,
        capacity_status="unknown",
        requires_reapproval=True,
        source_ids=["marine_geometry"],
    )
    return JourneyPreview(
        origin=origin,
        destination=destination,
        route=route,
        sea_distance_km=round(sea, 1),
        approach_gap_km=round(gap, 1),
        warnings=warnings,
    )
