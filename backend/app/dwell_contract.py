"""Shared contract for learned terminal release and scenario fallback."""

from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, Field, model_validator

from .models import Model
from .prediction import Duration

FEATURES = ("container_size", "container_type", "gross_tonnes", "hour", "weekday")
QUANTILES = (0.1, 0.5, 0.9)
TASK = "terminal_release_after_discharge"


class DwellEvent(Model):
    activity: str = Field(min_length=1, max_length=64, pattern=r"^[A-Z][A-Z0-9_]*$")
    completed_at: AwareDatetime


class DwellRequest(Model):
    observed_at: AwareDatetime
    container_size: int = Field(ge=1, le=60, strict=True)
    container_type: str = Field(min_length=1, max_length=32)
    gross_tonnes: float = Field(ge=0, le=1000)
    mode: Literal["auto", "algorithm"] = "auto"
    fallback_duration: Duration = Field(
        default_factory=lambda: Duration(minimum_hours=0, typical_hours=48, maximum_hours=168)
    )
    samples: int = Field(default=2000, ge=100, le=10000)
    seed: int = Field(default=42, ge=0, le=2**32 - 1)
    history: list[DwellEvent] = Field(default_factory=list, max_length=50)

    @model_validator(mode="after")
    def past_discharge_history(self):
        seen = set()
        for event in self.history:
            key = (event.activity, event.completed_at)
            if key in seen:
                raise ValueError("Duplicate history event")
            seen.add(key)
            if event.completed_at > self.observed_at:
                raise ValueError("History cannot contain future events")
            if event.activity == "TRUCK_OUT":
                raise ValueError("Container has already left the terminal")
            if event.activity == "DISCHARGE" and event.completed_at != self.observed_at:
                raise ValueError("observed_at must be the end of DISCHARGE")
        return self


class DwellHours(Model):
    p10: float = Field(ge=0)
    p50: float = Field(ge=0)
    p90: float = Field(ge=0)


class DwellInstants(Model):
    p10: datetime
    p50: datetime
    p90: datetime


class DwellResponse(Model):
    task: Literal["terminal_release_after_discharge"] = TASK
    method: Literal[
        "catboost_terminal_dwell_v1", "catboost_terminal_dwell_v2", "monte_carlo_terminal_dwell_v1"
    ]
    model_loaded: bool
    model_version: str | None
    fallback_reason: str | None
    trained_on_history: bool
    caspian_validated: Literal[False] = False
    remaining_hours: DwellHours
    release_at: DwellInstants
    samples: int | None
    warnings: list[str]


class DwellModelStatus(Model):
    loaded: bool
    model_version: str | None
    task: Literal["terminal_release_after_discharge"] = TASK
    fallback_available: Literal[True] = True
    load_error: str | None
    caspian_validated: Literal[False] = False
    history_loaded: bool = False
    history_model_version: str | None = None
    history_load_error: str | None = None


def feature_row(size, kind, gross, observed):
    # Calendar is the caller's local wall time; source training timezone was not disclosed.
    return [str(int(size)), str(kind), float(gross), observed.hour, observed.weekday()]


def ordered_quantiles(values):
    # Quantile regressions can cross. The exact same rearrangement is scored offline and served.
    import math

    if len(values) != 3 or not all(math.isfinite(float(v)) for v in values):
        raise ValueError("Expected three finite quantiles")
    return sorted(max(0.0, float(v)) for v in values)
