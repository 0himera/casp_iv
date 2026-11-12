"""Explicit assumptions for the prototype; these are not operator observations."""

from typing import Literal

from pydantic import Field

from .emissions import EmissionsComparison
from .models import Model


class PlanningAssumptions(Model):
    terminal_hours: float = Field(default=8, ge=0, le=72)
    rail_delay_hours: float = Field(default=0, ge=0, le=72)
    wind_limit_kmh: float = Field(default=40, gt=0, le=150)
    cutoff_in_hours: float = Field(default=24, ge=2, le=96)
    sailing_interval_hours: float = Field(default=24, ge=6, le=72)
    assume_capacity: bool = True
    rail_kg_per_tonne_km: float = Field(default=0.022, ge=0, le=10)
    road_kg_per_tonne_km: float = Field(default=0.062, ge=0, le=10)
    sea_kg_per_tonne_km: float = Field(default=0.015, ge=0, le=10)


class RecalculateRequest(Model):
    expected_revision: int = Field(ge=1)
    scenario: Literal["normal", "storm", "missing_data"] = "normal"
    assumptions: PlanningAssumptions = Field(default_factory=PlanningAssumptions)


class PlanningInput(Model):
    route_id: str
    port_id: str
    weather_status: Literal["forecast", "stale", "missing", "scenario"]
    weather_source_url: str | None
    weather_fetched_at: str | None
    wind_max_kmh: float | None
    weather_hold_hours: float
    activity_date: str | None
    activity_source_url: str | None
    activity_stale: bool
    port_calls: int | None
    median_port_calls: float | None
    queue_factor: float
    land_hours: float
    terminal_hours: float
    cutoff_at: str
    warnings: list[str]


class PlanningSummary(Model):
    scenario: Literal["normal", "storm", "missing_data"]
    assumptions: PlanningAssumptions
    inputs: list[PlanningInput]
    emissions: EmissionsComparison
    road_baseline_kg_co2e: float
    note: str
