import json
from datetime import UTC, date, datetime, timedelta

import httpx

from .models import (
    ActivityData,
    ActivityPoint,
    Coordinates,
    Port,
    WeatherData,
    WeatherPoint,
    WeatherUnits,
)

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
ACTIVITY_URL = (
    "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/"
    "Daily_Ports_Data/FeatureServer/0/query"
)
WEATHER_FIELDS = ("wind_speed_10m", "wind_gusts_10m", "precipitation", "temperature_2m")


class UpstreamError(Exception):
    pass


async def get_json(client: httpx.AsyncClient, url: str, params: dict) -> tuple[dict, str]:
    # Only fixed provider hosts are used; user-controlled URLs never reach this function.
    async with client.stream("GET", url, params=params) as response:
        response.raise_for_status()
        parts = []
        size = 0
        async for part in response.aiter_bytes():
            size += len(part)
            if size > 2_000_000:
                raise UpstreamError("Response exceeds limit")
            parts.append(part)
        raw = json.loads(b"".join(parts))
        if not isinstance(raw, dict) or raw.get("error"):
            raise UpstreamError("Provider returned an error")
        return raw, str(response.url)


async def weather(client: httpx.AsyncClient, port: Port, days: int):
    coords = port.coordinates
    if coords is None:
        raise ValueError("Coordinates required")
    raw, url = await get_json(
        client,
        WEATHER_URL,
        {
            "latitude": coords.latitude,
            "longitude": coords.longitude,
            "hourly": ",".join(WEATHER_FIELDS),
            "forecast_days": days,
            "timezone": "UTC",
            "wind_speed_unit": "kmh",
            "temperature_unit": "celsius",
            "precipitation_unit": "mm",
        },
    )
    if raw.get("utc_offset_seconds") != 0:
        raise UpstreamError("Unexpected timezone")
    units = WeatherUnits()
    for field, expected in units.model_dump().items():
        if raw["hourly_units"].get(field) != expected:
            raise UpstreamError("Unexpected units")
    hourly = raw["hourly"]
    times = hourly["time"]
    if not times or len(times) > days * 24 + 1:
        raise UpstreamError("Unexpected weather horizon")
    if any(len(hourly[field]) != len(times) for field in WEATHER_FIELDS):
        raise UpstreamError("Mismatched time series")
    points = []
    for index, timestamp in enumerate(times):
        instant = datetime.fromisoformat(timestamp)
        if instant.tzinfo is None:
            instant = instant.replace(tzinfo=UTC)
        if instant.utcoffset() != timedelta(0):
            raise UpstreamError("Unexpected timestamp offset")
        points.append(
            WeatherPoint(time=instant, **{field: hourly[field][index] for field in WEATHER_FIELDS})
        )
    if any(a.time >= b.time for a, b in zip(points, points[1:])):
        raise UpstreamError("Weather timestamps are not strictly increasing")
    result = WeatherData(
        port_id=port.id,
        requested_location=coords,
        grid_location=Coordinates(latitude=raw["latitude"], longitude=raw["longitude"]),
        issued_at=None,
        units=units,
        hourly=points,
    )
    return result.model_dump(mode="json"), raw, url


async def activity(client: httpx.AsyncClient, port: Port, days: int, today: date):
    start, end = today - timedelta(days=days), today - timedelta(days=1)
    # portwatch_id comes from the checked-in catalog, never from the query string.
    raw, url = await get_json(
        client,
        ACTIVITY_URL,
        {
            "where": (
                f"portid='{port.portwatch_id}' AND date >= DATE '{start.isoformat()}' "
                f"AND date <= DATE '{end.isoformat()}'"
            ),
            "outFields": "portid,date,portcalls,portcalls_cargo,portcalls_tanker",
            "orderByFields": "date ASC",
            "resultRecordCount": 1000,
            "returnGeometry": "false",
            "f": "json",
        },
    )
    if raw.get("exceededTransferLimit"):
        raise UpstreamError("Truncated activity response")
    seen = set()
    daily = []
    for feature in raw["features"]:
        row = feature["attributes"]
        if row["portid"] != port.portwatch_id:
            raise UpstreamError("Unexpected port in response")
        day = date.fromisoformat(row["date"])
        if not start <= day <= end or day in seen:
            raise UpstreamError("Unexpected or duplicate activity date")
        seen.add(day)
        daily.append(
            ActivityPoint(
                date=day,
                portcalls=row["portcalls"],
                cargo_portcalls=row["portcalls_cargo"],
                tanker_portcalls=row["portcalls_tanker"],
            )
        )
    daily.sort(key=lambda p: p.date)
    result = ActivityData(
        port_id=port.id,
        portwatch_id=port.portwatch_id,
        window_start=start,
        window_end=end,
        latest_available_date=daily[-1].date if daily else None,
        daily=daily,
        missing_dates=[
            start + timedelta(days=i) for i in range(days) if start + timedelta(days=i) not in seen
        ],
    )
    return result.model_dump(mode="json"), raw, url
