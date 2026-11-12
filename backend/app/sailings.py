"""Parse published operator dispositions; no inferred bookings, capacity or vessel identity."""

import hashlib
import re
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from .models import Sailing
from .providers import UpstreamError

URLS = {
    "kuryk": "https://portkuryk.kz/ru/dispoziciya-sudov",
    "asco": "https://cabinet.asco.az/passenger-ticket",
}
PORT_SOURCES = {"kuryk": ("kuryk", "asco"), "alat": ("asco",), "turkmenbashi": ("asco",)}
PORT_NAMES = {"Ələt": "alat", "Kurık": "kuryk", "Türkmənbaşı": "turkmenbashi"}


def text(node):
    return " ".join(node.get_text(" ", strip=True).split())


def local_full(value):
    return datetime.strptime(value, "%d/%m/%Y %H:%M").isoformat() if value else None


def local_short(value, reported, expected=False):
    if not value:
        return None
    match = re.fullmatch(r"(\d{2})\.(\d{2})\.?/\s*(\d{2}):(\d{2})", value)
    if not match:
        raise UpstreamError("Unrecognized Kuryk timestamp")
    day, month, hour, minute = map(int, match.groups())
    candidates = []
    for year in (reported.year - 1, reported.year, reported.year + 1):
        try:
            candidate = datetime(year, month, day, hour, minute)
        except ValueError:
            continue
        if expected or candidate.date() <= reported + timedelta(days=1):
            candidates.append(candidate)
    if not candidates:
        raise UpstreamError("Invalid Kuryk timestamp")
    # The source omits the year. Preserve the original and explicitly mark the inference.
    return min(candidates, key=lambda d: abs((d.date() - reported).days)).isoformat()


def record(source, name, category, status, **fields):
    if not name:
        raise UpstreamError("Missing vessel name")
    raw = f"{source}|{name}|{category}|{status}|{fields}"
    base = Sailing(
        id=hashlib.sha256(raw.encode()).hexdigest()[:24],
        source_id=source,
        vessel_name=name,
        category=category,
        status_raw=status,
        weather_related="метео" in status.lower() or "hava şəraiti" in status.lower(),
        port_ids=[],
        departure_port_raw=None,
        destination_port_raw=None,
        berth=None,
        event_time_raw=None,
        event_at_local=None,
        departure_time_raw=None,
        departure_at_local=None,
        arrival_time_raw=None,
        arrival_at_local=None,
        timezone=None,
        year_inferred=False,
    ).model_dump()
    return Sailing(**(base | fields))


def parse_kuryk(html):
    soup = BeautifulSoup(html, "html.parser")
    title = soup.select_one(".disp-wrap .disp-title")
    match = (
        re.fullmatch(r"Трафик судов на (\d{2}\.\d{2}\.\d{4})\.?", text(title)) if title else None
    )
    if not match or not soup.select_one(".disp-grid .disp-head"):
        raise UpstreamError("Kuryk page structure changed")
    reported = datetime.strptime(match[1], "%d.%m.%Y").date()
    items = []

    def append(row, category):
        values = [text(v) for v in row.select(".disp-cell-value")]
        if len(values) != 4:
            raise UpstreamError("Kuryk row structure changed")
        berth_or_index, name, timestamp, status = values
        items.append(
            record(
                "kuryk",
                name,
                category,
                status,
                port_ids=["kuryk"],
                berth=berth_or_index if category == "berth" else None,
                event_time_raw=timestamp or None,
                event_at_local=local_short(timestamp, reported, category == "expected"),
                year_inferred=bool(timestamp),
            )
        )

    for row in soup.select(".disp-grid .disp-body .disp-row"):
        append(row, "berth")
    for section in soup.select(".disp-section"):
        heading = section.select_one(".disp-section__title")
        category = {"Суда стоящие на рейде": "anchorage", "Подходы судов": "expected"}.get(
            text(heading) if heading else ""
        )
        if not category:
            raise UpstreamError("Unknown Kuryk section")
        for row in section.select(".disp-section__row"):
            append(row, category)
    if not items:
        raise UpstreamError("No recognized Kuryk rows; empty state unverified")
    return {
        "reported_date": reported.isoformat(),
        "reported_at_local": None,
        "items": [item.model_dump(mode="json") for item in items],
    }


def parse_asco(html):
    soup = BeautifulSoup(html, "html.parser")
    title = next(
        (text(h) for h in soup.select("h4") if text(h).startswith("Cari hərəkət qrafiki")), ""
    )
    match = re.fullmatch(r"Cari hərəkət qrafiki (\d{2}\.\d{2}\.\d{4} \d{2}:\d{2})", title)
    if not match:
        raise UpstreamError("ASCO publication timestamp missing")
    published = datetime.strptime(match[1], "%d.%m.%Y %H:%M")
    items, categories = [], set()
    for table in soup.select("#collapseExample table"):
        heading = table.find_previous("h5")
        category = {
            "Dənizdə olan RO-RO və bərələr": "underway",
            "Limanda olan RO-RO və bərələr": "in_port",
        }.get(text(heading) if heading else "")
        if not category or category in categories:
            raise UpstreamError("ASCO tables changed")
        categories.add(category)
        headers = [text(h) for h in table.select("thead th")]
        expected_headers = [
            "Gəminin adı",
            "Məkan",
            "Çıxdığı liman",
            "Çıxma vaxtı",
            "Yan alacağı liman",
        ]
        if category == "underway":
            expected_headers.append("Gözlənilən Çatma vaxtı")
        expected_headers.append("Status")
        if headers != expected_headers:
            raise UpstreamError("ASCO column headers changed")
        for row in table.select("tbody tr"):
            values = [text(td) for td in row.select("td")]
            if len(values) != len(headers):
                raise UpstreamError("ASCO row structure changed")
            name, _, departure, timestamp, destination = values[:5]
            arrival = values[5] if category == "underway" else ""
            items.append(
                record(
                    "asco",
                    name,
                    category,
                    values[-1],
                    port_ids=list(
                        dict.fromkeys(
                            PORT_NAMES[p] for p in (departure, destination) if p in PORT_NAMES
                        )
                    ),
                    departure_port_raw=departure or None,
                    destination_port_raw=destination or None,
                    departure_time_raw=timestamp or None,
                    departure_at_local=local_full(timestamp),
                    arrival_time_raw=arrival or None,
                    arrival_at_local=local_full(arrival),
                )
            )
    if categories != {"underway", "in_port"}:
        raise UpstreamError("ASCO tables missing")
    return {
        "reported_date": published.date().isoformat(),
        "reported_at_local": published.isoformat(),
        "items": [item.model_dump(mode="json") for item in items],
    }


async def fetch(client: httpx.AsyncClient, source: str):
    async with client.stream("GET", URLS[source]) as response:
        response.raise_for_status()
        if "text/html" not in response.headers.get("content-type", ""):
            raise UpstreamError("Expected HTML")
        chunks, size = [], 0
        async for chunk in response.aiter_bytes():
            size += len(chunk)
            if size > 2_000_000:
                raise UpstreamError("Operator response exceeds limit")
            chunks.append(chunk)
        html = b"".join(chunks).decode("utf-8")
        payload = (parse_kuryk if source == "kuryk" else parse_asco)(html)
        return payload, {"html": html}, str(response.url)
