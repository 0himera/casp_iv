"""Reproducible scenario baseline. Distributions are supplied assumptions, not trained weights."""

import hashlib
import math
import random
from datetime import UTC, datetime, timedelta

from pydantic import AwareDatetime, Field, model_validator

from .models import Model


class Duration(Model):
    minimum_hours: float = Field(ge=0, le=336)
    typical_hours: float = Field(ge=0, le=336)
    maximum_hours: float = Field(ge=0, le=336)

    @model_validator(mode="after")
    def ordered(self):
        if not self.minimum_hours <= self.typical_hours <= self.maximum_hours:
            raise ValueError("Expected minimum <= typical <= maximum")
        return self


class SailingWindow(Model):
    id: str = Field(min_length=1, max_length=128)
    cutoff_at: AwareDatetime
    departure_at: AwareDatetime
    capacity_confirmed: bool | None

    @model_validator(mode="after")
    def ordered(self):
        if self.cutoff_at > self.departure_at:
            raise ValueError("Cutoff must be at or before departure")
        return self


class RouteScenario(Model):
    id: str = Field(min_length=1, max_length=128)
    land_travel: Duration
    terminal_processing: Duration
    documents_ready: Duration
    weather_hold: Duration
    loading_buffer_hours: float = Field(ge=0, le=72)
    sea_travel: Duration
    destination_processing: Duration
    sailings: list[SailingWindow] = Field(min_length=1, max_length=30)

    @model_validator(mode="after")
    def ordered(self):
        if len({s.id for s in self.sailings}) != len(self.sailings):
            raise ValueError("Duplicate sailing IDs")
        if any(
            a.departure_at >= b.departure_at or a.cutoff_at > b.cutoff_at
            for a, b in zip(self.sailings, self.sailings[1:])
        ):
            raise ValueError("Sailings must be ordered by departure and cutoff")
        return self


class PredictionRequest(Model):
    start_at: AwareDatetime
    routes: list[RouteScenario] = Field(min_length=1, max_length=20)
    samples: int = Field(default=2000, ge=100, le=10000)
    seed: int = Field(default=42, ge=0, le=2**32 - 1)

    @model_validator(mode="after")
    def valid_routes(self):
        if len({r.id for r in self.routes}) != len(self.routes):
            raise ValueError("Duplicate route IDs")
        if any(s.departure_at < self.start_at for r in self.routes for s in r.sailings):
            raise ValueError("Departures cannot precede scenario start")
        return self


class TimeQuantiles(Model):
    p10: datetime
    p50: datetime
    p90: datetime


class RoutePrediction(Model):
    route_id: str
    ready_at: TimeQuantiles
    target_sailing_id: str
    probability_target_cutoff_missed: float
    cutoff_risk_sampling_standard_error: float
    probability_no_confirmed_sailing_in_horizon: float
    delivery_eta: TimeQuantiles | None
    delivery_eta_is_conditional: bool
    delivery_samples: int
    warnings: list[str]


class PredictionResponse(Model):
    method: str = "monte_carlo_readiness_v1"
    input_quality: str = "user_supplied_scenario"
    trained_on_history: bool = False
    samples: int
    seed: int
    routes: list[RoutePrediction]
    assumptions: list[str]


def draw(rng: random.Random, duration: Duration):
    return rng.triangular(duration.minimum_hours, duration.maximum_hours, duration.typical_hours)


def quantiles(instants):
    values = sorted(d.timestamp() for d in instants)

    def at(p):
        index = (len(values) - 1) * p
        low, high = math.floor(index), math.ceil(index)
        return datetime.fromtimestamp(
            values[low] + (values[high] - values[low]) * (index - low), UTC
        )

    return TimeQuantiles(p10=at(0.1), p50=at(0.5), p90=at(0.9))


def predict(request: PredictionRequest) -> PredictionResponse:
    results = []
    for route in request.routes:
        # Per-route seed keeps results stable if route ordering changes.
        seed = int.from_bytes(hashlib.sha256(f"{request.seed}:{route.id}".encode()).digest()[:8])
        rng = random.Random(seed)
        ready_samples, delivery_samples = [], []
        missed = 0
        for _ in range(request.samples):
            land = draw(rng, route.land_travel)
            terminal = draw(rng, route.terminal_processing)
            docs = draw(rng, route.documents_ready)
            hold = draw(rng, route.weather_hold)
            sea = draw(rng, route.sea_travel)
            destination = draw(rng, route.destination_processing)
            ready = request.start_at + timedelta(
                hours=(max(land + terminal, docs) + hold + route.loading_buffer_hours)
            )
            ready_samples.append(ready)
            missed += ready > route.sailings[0].cutoff_at
            sailing = next(
                (
                    s
                    for s in route.sailings
                    if s.capacity_confirmed is True and ready <= s.cutoff_at
                ),
                None,
            )
            if sailing:
                delivery_samples.append(sailing.departure_at + timedelta(hours=(sea + destination)))
        p = missed / request.samples
        warnings = []
        if any(s.capacity_confirmed is None for s in route.sailings):
            warnings.append("UNKNOWN_CAPACITY_EXCLUDED_FROM_DELIVERY_ESTIMATE")
        if len(delivery_samples) < request.samples:
            warnings.append("DELIVERY_ETA_CONDITIONAL_ON_CONFIRMED_SAILING_AVAILABLE")
        results.append(
            RoutePrediction(
                route_id=route.id,
                ready_at=quantiles(ready_samples),
                target_sailing_id=route.sailings[0].id,
                probability_target_cutoff_missed=p,
                cutoff_risk_sampling_standard_error=math.sqrt(p * (1 - p) / request.samples),
                probability_no_confirmed_sailing_in_horizon=1
                - len(delivery_samples) / request.samples,
                delivery_eta=quantiles(delivery_samples) if delivery_samples else None,
                delivery_eta_is_conditional=len(delivery_samples) < request.samples,
                delivery_samples=len(delivery_samples),
                warnings=warnings,
            )
        )
    return PredictionResponse(
        samples=request.samples,
        seed=request.seed,
        routes=results,
        assumptions=[
            "Duration distributions and weather holds are scenario inputs, not fitted estimates",
            "Durations sampled independently; correlated congestion/weather not calibrated",
            "Documents process in parallel with land travel and terminal handling",
            "Weather hold delays readiness; published sailing departure times remain fixed",
            "Only explicitly confirmed scenario capacity qualifies for delivery ETA",
            "Sampling error is not real-world predictive accuracy or input uncertainty",
        ],
    )
