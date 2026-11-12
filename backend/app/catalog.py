import json
from pathlib import Path

from .models import Coordinates, Port, PortList


def load_catalog(path: Path) -> PortList:
    raw = json.loads(path.read_text())
    ports = []
    for row in raw["ports"]:
        coordinates = None
        if row["latitude"] is not None and row["longitude"] is not None:
            coordinates = Coordinates(latitude=row["latitude"], longitude=row["longitude"])
        ports.append(
            Port(
                id=row["id"],
                name=row["name_ru"],
                country_iso3=row["country_iso3"],
                region=row["region"],
                coordinates=coordinates,
                portwatch_id=row["portwatch_id"],
                coordinate_source=row["coordinate_source"],
                weather_available=coordinates is not None,
                activity_available=row["portwatch_id"] is not None,
                operator_source=row.get("operator_source"),
            )
        )
    if len({p.id for p in ports}) != len(ports):
        raise ValueError("Duplicate port IDs")
    return PortList(
        items=ports, catalog_checked_on=raw["checked_on"], source_url=raw["catalog_source"]
    )
