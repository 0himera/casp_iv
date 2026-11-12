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
        Corridor(
            id="aktau-amirabad",
            port_ids=["aktau", "amirabad"],
            source_url="https://unece.org/sites/default/files/2023-10/ECE-TRANS-WP.24-153e%20.pdf",
            evidence="UNECE international combined transport network lists Aktau–Amirabad",
        ),
        Corridor(
            id="aktau-makhachkala",
            port_ids=["aktau", "makhachkala"],
            source_url="https://unece.org/sites/default/files/2023-10/ECE-TRANS-WP.24-153e%20.pdf",
            evidence="UNECE international combined transport network lists Aktau–Makhachkala",
        ),
        Corridor(
            id="kuryk-amirabad",
            port_ids=["kuryk", "amirabad"],
            source_url="https://portkuryk.kz/en/media/123/novayaparomnayaliniyanovievozmoznosti121",
            evidence="Port operator announced the line in 2021; present service unverified",
        ),
        Corridor(
            id="kuryk-anzali",
            port_ids=["kuryk", "anzali"],
            source_url="https://portkuryk.kz/en/media/123/novayaparomnayaliniyanovievozmoznosti121",
            evidence="Port operator announced the line in 2021; present service unverified",
        ),
        Corridor(
            id="kuryk-makhachkala",
            port_ids=["kuryk", "makhachkala"],
            source_url="https://portkuryk.kz/en/media/930/quryq-porty-phef-2026-forumynda",
            evidence="2026 agreement to organize ferry service; opening not verified",
        ),
    ]
)
