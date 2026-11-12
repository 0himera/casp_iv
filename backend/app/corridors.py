"""Documented port connections; these are not schedules, bookings or route geometry."""

from typing import Literal

from pydantic import Field

from .models import Model


class Corridor(Model):
    id: str
    port_ids: list[str] = Field(min_length=2, max_length=2)
    source_url: str
    evidence: str
    service_status: Literal["unverified"] = "unverified"
    scheduled_sailing_confirmed: Literal[False] = False
    capacity_confirmed: Literal[False] = False


class CorridorList(Model):
    items: list[Corridor]
    note: str = "Published corridors are not evidence of current sailings or capacity."


SOURCE = "https://transit.gov.az/en/corridors/east-west-corridor"
CORRIDORS = CorridorList(
    items=[
        Corridor(
            id="alat-aktau",
            port_ids=["alat", "aktau"],
            source_url=SOURCE,
            evidence="East-West corridor connects Baku/Alat and Aktau",
        ),
        Corridor(
            id="alat-kuryk",
            port_ids=["alat", "kuryk"],
            source_url=SOURCE,
            evidence="East-West corridor connects Baku/Alat and Kuryk",
        ),
        Corridor(
            id="alat-turkmenbashi",
            port_ids=["alat", "turkmenbashi"],
            source_url=SOURCE,
            evidence="East-West corridor connects Baku/Alat and Turkmenbashi",
        ),
    ]
)
