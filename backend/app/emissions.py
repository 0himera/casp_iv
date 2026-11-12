"""Transparent scenario estimate: caller supplies distances and emission factors."""

from typing import Literal

from pydantic import Field, model_validator

from .models import Model

Mode = Literal["road", "rail", "sea"]


class EmissionsLeg(Model):
    mode: Mode
    distance_km: float = Field(gt=0, le=100000)


class EmissionsRoute(Model):
    route_id: str = Field(min_length=1, max_length=128)
    legs: list[EmissionsLeg] = Field(min_length=1, max_length=20)


class EmissionsRequest(Model):
    factors_kg_per_tonne_km: dict[Mode, float]
    factor_source: str = Field(min_length=1, max_length=500)
    routes: list[EmissionsRoute] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def validate_factors(self):
        if len({route.route_id for route in self.routes}) != len(self.routes):
            raise ValueError("Duplicate route")
        if any(value < 0 or value > 10 for value in self.factors_kg_per_tonne_km.values()):
            raise ValueError("Emission factors must be between 0 and 10")
        if any(
            leg.mode not in self.factors_kg_per_tonne_km
            for route in self.routes
            for leg in route.legs
        ):
            raise ValueError("Each mode needs a factor")
        return self


class EmissionsResult(Model):
    route_id: str
    total_kg_co2e: float
    by_mode_kg_co2e: dict[Mode, float]


class EmissionsComparison(Model):
    shipment_id: str
    shipment_revision: int
    mass_tonnes: float
    factor_source: str
    input_quality: Literal["user_supplied_scenario"] = "user_supplied_scenario"
    routes: list[EmissionsResult]
    note: str = "Scenario estimate, not independently verified or a certified GLEC calculation."


def calculate(shipment, body):
    results = []
    for route in body.routes:
        parts = {}
        for leg in route.legs:
            value = (
                shipment["mass_tonnes"] * leg.distance_km * body.factors_kg_per_tonne_km[leg.mode]
            )
            parts[leg.mode] = parts.get(leg.mode, 0) + value
        results.append(
            EmissionsResult(
                route_id=route.route_id, total_kg_co2e=sum(parts.values()), by_mode_kg_co2e=parts
            )
        )
    return EmissionsComparison(
        shipment_id=shipment["id"],
        shipment_revision=shipment["revision"],
        mass_tonnes=shipment["mass_tonnes"],
        factor_source=body.factor_source,
        routes=results,
    )
