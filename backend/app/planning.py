"""Compose public observations and transparent scenario policies into one calculation."""

import asyncio
import copy
import math
from datetime import timedelta
from statistics import median

from .catalog import load_catalog
from .emissions import EmissionsRequest, calculate
from .planning_models import PlanningInput, PlanningSummary
from .prediction import PredictionRequest
from .service import DataUnavailable

PORTS = {
    "route_astra": "astrakhan",
    "route_makh": "makhachkala",
    "route_aktau": "aktau",
    "route_turkmen": "turkmenbashi",
}
EMPTY_ETA = dict.fromkeys(("p10", "p50", "p90"))
# Hypothetical timetable offsets, not a published operator schedule.
CUTOFF_OFFSETS = {"route_astra": 0, "route_makh": 12, "route_aktau": 36, "route_turkmen": 60}


def distance(a, b):
    lat1, lat2 = math.radians(a[1]), math.radians(b[1])
    dlat, dlon = lat2 - lat1, math.radians(b[0] - a[0])
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))


def duration(hours):
    return {
        "minimum_hours": hours * 0.7,
        "typical_hours": hours,
        "maximum_hours": min(336, hours * 1.5),
    }


async def prepare(shipment, body, data, settings, start):
    catalog = load_catalog(settings.catalog_path).items
    by_id = {p.id: p for p in catalog}
    by_name = {p.name: p for p in catalog}
    destination = shipment["destination"]
    target = [destination["longitude"], destination["latitude"]]
    current = [shipment["current_location"]["longitude"], shipment["current_location"]["latitude"]]
    routes = copy.deepcopy(shipment["routes"])
    # Existing agreement geometry is immutable until a confirmed route revision.
    for route_id in ("route_aktau", "route_turkmen"):
        if any(r["id"] == route_id for r in routes):
            continue
        port = by_id[PORTS[route_id]]
        point = [port.coordinates.longitude, port.coordinates.latitude]
        routes.append(
            {
                "id": route_id,
                "name": f"Через {port.name}",
                "ports": [port.name, destination["name"]],
                "modes": ["rail", "sea"],
                "distance_km": 0,
                "geometry": {"type": "LineString", "coordinates": [current, point, target]},
                "geometry_kind": "schematic",
                "eta": EMPTY_ETA.copy(),
                "miss_probability": None,
                "cost": {"amount_minor": 0, "currency": "RUB"},
                "emissions_kg_co2e": None,
                "emissions_method": "Сценарный расчёт",
                "feasible": False,
                "infeasibility_reason": "Требуется расчёт",
                "capacity_status": "unknown",
                "requires_reapproval": True,
                "source_ids": [],
            }
        )

    async def observation(port, kind):
        try:
            return await getattr(data, kind)(port, 3 if kind == "weather" else 30)
        except (DataUnavailable, TimeoutError):
            return None

    departures = {}
    for route in routes:
        first = route["ports"][0] if route["ports"] else ""
        port = by_id.get(PORTS.get(route["id"])) or by_name.get(first) or by_id.get(first)
        if port is None or port.coordinates is None:
            raise ValueError("Нужны проверенные координаты порта отправления")
        if route["ports"][-1] not in (destination["id"], destination["name"]):
            raise ValueError("Маршрут должен вести в пункт назначения отправки")
        departures[route["id"]] = port
    needed = {port.id for port in departures.values()}
    # Include the destination: a quiet departure port does not imply a quiet sea leg.
    if destination["id"] in by_id:
        needed.add(destination["id"])
    readings = {}

    async def read(port_id):
        port = by_id[port_id]
        weather, activity = await asyncio.gather(
            observation(port, "weather") if port.weather_available else asyncio.sleep(0),
            observation(port, "activity") if port.activity_available else asyncio.sleep(0),
        )
        readings[port_id] = weather, activity

    if body.scenario != "missing_data":
        await asyncio.gather(*(read(port_id) for port_id in needed))
    assumptions = body.assumptions
    inputs, scenarios, emissions_routes, missing = [], [], [], []
    for route in routes:
        port = departures[route["id"]]
        port_id = port.id
        point = [port.coordinates.longitude, port.coordinates.latitude]
        land_km, sea_km = distance(current, point) * 1.4, distance(point, target) * 1.1
        weather, activity = readings.get(port_id, (None, None))
        destination_weather = readings.get(destination["id"], (None, None))[0]
        relevant = [w for w in (weather, destination_weather) if w is not None]
        wind = [
            p.wind_speed_10m
            for w in relevant
            for p in w.hourly
            if start <= p.time <= start + timedelta(hours=48) and p.wind_speed_10m is not None
        ]
        warnings = ["Расписание, места и длительности — допущения; судозаходы не равны очереди."]
        weather_status = "forecast"
        if not wind or weather is None or destination_weather is None:
            weather_status = "missing"
            missing.append(route["id"])
            warnings.append("Недостаточно погоды: риск и ETA не определены.")
        elif any(w.meta.stale for w in relevant):
            weather_status = "stale"
            warnings.append("Использован устаревший снимок погоды.")
        hold = min(48, max(0, (max(wind, default=0) - assumptions.wind_limit_kmh) / 5) * 2)
        # An explicit counterfactual in the currently selected departure corridor.
        if body.scenario == "storm" and route["id"] == shipment["selected_route_id"]:
            hold += 24
            if weather_status != "missing":
                weather_status = "scenario"
            warnings.append("Добавлен сценарный шторм: +24 ч; это не наблюдение Open-Meteo.")
        daily = [p for p in activity.daily if p.portcalls is not None] if activity else []
        latest = max(daily, key=lambda p: p.date) if daily else None
        baseline = median(p.portcalls for p in daily) if daily else None
        stale_activity = (
            activity is None
            or activity.meta.stale
            or latest is None
            or (start.date() - latest.date).days > 3
        )
        factor = 1.0
        if not stale_activity and baseline:
            factor = min(2, max(0.5, latest.portcalls / baseline))
            warnings.append("Судозаходы / медиана масштабируют очередь. Это сценарная эвристика.")
        else:
            warnings.append("Свежая активность недоступна: очередь взята из допущений.")
        mode = "rail" if "rail" in route["modes"] else "road"
        delay = assumptions.rail_delay_hours if mode == "rail" else assumptions.road_delay_hours
        land_hours = land_km / (40 if mode == "rail" else 60) + delay
        terminal = assumptions.terminal_hours * factor
        cutoff_hours = assumptions.cutoff_in_hours + CUTOFF_OFFSETS.get(route["id"], 0)
        inputs.append(
            PlanningInput(
                route_id=route["id"],
                port_id=port_id,
                weather_status=weather_status,
                weather_source_url=weather.meta.source_url if weather else None,
                weather_fetched_at=weather.meta.fetched_at.isoformat() if weather else None,
                wind_max_kmh=max(wind) if wind else None,
                weather_hold_hours=round(hold, 2),
                activity_date=latest.date.isoformat() if latest else None,
                activity_source_url=activity.meta.source_url if activity else None,
                activity_stale=stale_activity,
                port_calls=latest.portcalls if latest else None,
                median_port_calls=baseline,
                queue_factor=factor,
                land_hours=round(land_hours, 2),
                terminal_hours=round(terminal, 2),
                cutoff_at=(start + timedelta(hours=cutoff_hours)).isoformat(),
                warnings=warnings,
            )
        )
        sailings = [
            {
                "id": f"assumed-{route['id']}-{i}",
                "cutoff_at": start
                + timedelta(hours=cutoff_hours + i * assumptions.sailing_interval_hours),
                "departure_at": start
                + timedelta(hours=cutoff_hours + 2 + i * assumptions.sailing_interval_hours),
                "capacity_confirmed": True if assumptions.assume_capacity else None,
            }
            for i in range(7)
        ]
        scenarios.append(
            {
                "id": route["id"],
                "land_travel": duration(land_hours),
                "terminal_processing": duration(terminal),
                "documents_ready": duration(4),
                "weather_hold": duration(hold),
                "loading_buffer_hours": 2,
                "sea_travel": duration(sea_km / 20),
                "destination_processing": duration(6),
                "sailings": sailings,
            }
        )
        emissions_routes.append(
            {
                "route_id": route["id"],
                "legs": [
                    {"mode": mode, "distance_km": max(0.001, land_km)},
                    {"mode": "sea", "distance_km": max(0.001, sea_km)},
                ],
            }
        )
        route.update(
            distance_km=round(land_km + sea_km, 1),
            capacity_status="synthetic" if assumptions.assume_capacity else "unknown",
            feasible=route["id"] not in missing,
            infeasibility_reason="Нет достаточной погоды для расчёта"
            if route["id"] in missing
            else None,
        )
    emissions = calculate(
        shipment,
        EmissionsRequest(
            factors_kg_per_tonne_km={
                "rail": assumptions.rail_kg_per_tonne_km,
                "road": assumptions.road_kg_per_tonne_km,
                "sea": assumptions.sea_kg_per_tonne_km,
            },
            factor_source="Сценарные коэффициенты, кг CO₂e/(т·км); не сертификация GLEC",
            routes=emissions_routes,
        ),
    )
    for route, result in zip(routes, emissions.routes, strict=True):
        route["emissions_kg_co2e"] = round(result.total_kg_co2e, 2)
        route["emissions_method"] = emissions.factor_source
    summary = PlanningSummary(
        scenario=body.scenario,
        assumptions=assumptions,
        inputs=inputs,
        emissions=emissions,
        road_baseline_kg_co2e=round(
            shipment["mass_tonnes"]
            * distance(current, target)
            * 1.4
            * assumptions.road_kg_per_tonne_km,
            2,
        ),
        note="Груз сценарный. Погода — открытый прогноз. Активность — оценка AIS, "
        "не загрузка причалов. Расстояния приближены от текущей точки; скорости, очередь, "
        "расписание, места и ESG-коэффициенты заданы допущениями. "
        "CatBoost выпуска входящего контейнера не применяется к исходящему парому.",
    )
    return PredictionRequest(start_at=start, routes=scenarios), {
        "routes": routes,
        "planning": summary.model_dump(mode="json"),
        "missing": missing,
    }
