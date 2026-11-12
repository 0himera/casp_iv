from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Coordinates(Model):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class Port(Model):
    id: str
    name: str
    country_iso3: str
    region: str | None
    coordinates: Coordinates | None
    portwatch_id: str | None
    coordinate_source: str | None
    weather_available: bool
    activity_available: bool
    operator_source: str | None


class PortList(Model):
    items: list[Port]
    catalog_checked_on: date
    source_url: str


class Provenance(Model):
    source_id: Literal["open_meteo", "imf_portwatch"]
    source_url: str
    attribution: str
    fetched_at: datetime
    source_updated_at: datetime | None
    quality: Literal["forecast", "estimated", "missing"]
    cache_status: Literal["live", "cached", "stale"]
    cache_age_seconds: int = Field(ge=0)
    stale: bool
    warnings: list[str]


class WeatherUnits(Model):
    wind_speed_10m: Literal["km/h"] = "km/h"
    wind_gusts_10m: Literal["km/h"] = "km/h"
    precipitation: Literal["mm"] = "mm"
    temperature_2m: Literal["°C"] = "°C"


class WeatherPoint(Model):
    time: datetime
    wind_speed_10m: float | None = Field(ge=0)
    wind_gusts_10m: float | None = Field(ge=0)
    precipitation: float | None = Field(ge=0)
    temperature_2m: float | None


class WeatherData(Model):
    port_id: str
    requested_location: Coordinates
    grid_location: Coordinates
    timezone: Literal["UTC"] = "UTC"
    issued_at: datetime | None
    units: WeatherUnits
    hourly: list[WeatherPoint]


class WeatherResponse(WeatherData):
    meta: Provenance


class ActivityPoint(Model):
    date: date
    portcalls: int | None = Field(ge=0, strict=True)
    cargo_portcalls: int | None = Field(ge=0, strict=True)
    tanker_portcalls: int | None = Field(ge=0, strict=True)


class ActivityData(Model):
    port_id: str
    portwatch_id: str
    window_start: date
    window_end: date
    latest_available_date: date | None
    unit: Literal["port_calls_per_day"] = "port_calls_per_day"
    daily: list[ActivityPoint]
    missing_dates: list[date]


class ActivityResponse(ActivityData):
    meta: Provenance


class Health(Model):
    status: Literal["ok"] = "ok"
    mode: Literal["public_data"] = "public_data"
    api_version: str = "1.0.0"
    catalog_ports: int
    # Health checks local dependencies, not upstream availability.
    upstream_checked: Literal[False] = False


class ErrorDetail(Model):
    code: str
    message: str


class ErrorResponse(Model):
    error: ErrorDetail


class Sailing(Model):
    id: str
    source_id: Literal["kuryk", "asco"]
    vessel_name: str
    port_ids: list[str]
    departure_port_raw: str | None
    destination_port_raw: str | None
    berth: str | None
    category: Literal["berth", "anchorage", "expected", "underway", "in_port"]
    status_raw: str
    weather_related: bool
    event_time_raw: str | None
    event_at_local: str | None
    departure_time_raw: str | None
    departure_at_local: str | None
    arrival_time_raw: str | None
    arrival_at_local: str | None
    timezone: str | None
    year_inferred: bool


class SailingSource(Model):
    source_id: Literal["kuryk", "asco"]
    source_url: str
    fetched_at: datetime
    source_updated_at: datetime | None
    reported_date: date
    reported_at_local: str | None
    timezone: str | None
    cache_status: Literal["live", "cached", "stale"]
    stale: bool
    warnings: list[str]


class SailingSourceError(Model):
    source_id: Literal["kuryk", "asco"]
    code: Literal["SOURCE_UNAVAILABLE"] = "SOURCE_UNAVAILABLE"


class SailingsResponse(Model):
    port_id: str
    items: list[Sailing]
    sources: list[SailingSource]
    errors: list[SailingSourceError]
    partial: bool
