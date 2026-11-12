import asyncio
import logging
from collections.abc import Callable
from datetime import UTC, date, datetime, timedelta

import httpx
from pydantic import ValidationError

from . import providers, sailings
from .cache import Snapshot, SnapshotCache
from .config import Settings
from .models import (
    ActivityResponse,
    Port,
    Provenance,
    Sailing,
    SailingSource,
    SailingSourceError,
    SailingsResponse,
    WeatherResponse,
)

log = logging.getLogger(__name__)


class DataUnavailable(Exception):
    pass


class DataService:
    def __init__(
        self,
        client: httpx.AsyncClient,
        cache: SnapshotCache,
        settings: Settings,
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ):
        self.client, self.cache, self.settings, self.clock = client, cache, settings, clock
        self.locks: dict[str, asyncio.Lock] = {}
        self.failed_at: dict[str, datetime] = {}
        self.semaphore = asyncio.Semaphore(4)

    async def snapshot(self, key, ttl, fetch, accept_cached=lambda snapshot: True):
        # Keys have bounded cardinality: catalog port × kind × validated days.
        async with self.locks.setdefault(key, asyncio.Lock()):
            cached = await self.cache.get(key)
            now = self.clock()
            if (
                cached
                and accept_cached(cached)
                and 0 <= (now - cached.fetched_at).total_seconds() < ttl
            ):
                return cached, "cached"
            failed_at = self.failed_at.get(key)
            if (
                failed_at
                and (now - failed_at).total_seconds() < self.settings.retry_cooldown_seconds
            ):
                if cached:
                    return cached, "stale"
                raise DataUnavailable()
            try:
                async with self.semaphore:
                    async with asyncio.timeout(self.settings.request_timeout_seconds):
                        payload, raw, url = await fetch()
                snapshot = Snapshot(self.clock(), url, payload)
                await self.cache.put(key, snapshot, raw)
                self.failed_at.pop(key, None)
                return snapshot, "live"
            except (
                httpx.HTTPError,
                TimeoutError,
                providers.UpstreamError,
                KeyError,
                ValueError,
                TypeError,
                ValidationError,
            ) as exc:
                log.warning("Source unavailable: %s (%s)", key, type(exc).__name__)
                self.failed_at[key] = self.clock()
                if cached:
                    return cached, "stale"
                raise DataUnavailable() from exc

    def meta(self, snapshot, status, source_id, quality, warnings, stale=False):
        if status == "stale":
            warnings.append("UPSTREAM_UNAVAILABLE_USING_LAST_SNAPSHOT")
        return Provenance(
            source_id=source_id,
            source_url=snapshot.source_url,
            attribution="Weather data: Open-Meteo.com (CC BY 4.0)"
            if source_id == "open_meteo"
            else "IMF PortWatch; AIS-derived daily port activity estimates",
            fetched_at=snapshot.fetched_at,
            source_updated_at=None,
            quality=quality,
            cache_status=status,
            cache_age_seconds=max(0, int((self.clock() - snapshot.fetched_at).total_seconds())),
            stale=stale or status == "stale",
            warnings=warnings,
        )

    async def weather(self, port: Port, days: int):
        key = f"v1:weather:{port.id}:{days}"
        snapshot, status = await self.snapshot(
            key,
            self.settings.weather_ttl_seconds,
            lambda: providers.weather(self.client, port, days),
        )
        payload = snapshot.payload
        missing = any(
            p[field] is None for p in payload["hourly"] for field in providers.WEATHER_FIELDS
        )
        all_missing = all(
            p[field] is None for p in payload["hourly"] for field in providers.WEATHER_FIELDS
        )
        expired = (
            datetime.fromisoformat(payload["hourly"][-1]["time"].replace("Z", "+00:00"))
            < self.clock()
        )
        warnings = ["MODEL_ISSUE_TIME_NOT_PROVIDED"]
        if missing:
            warnings.append("MISSING_WEATHER_VALUES")
        if expired:
            warnings.append("FORECAST_HORIZON_EXPIRED")
        return WeatherResponse(
            **payload,
            meta=self.meta(
                snapshot,
                status,
                "open_meteo",
                "missing" if all_missing else "forecast",
                warnings,
                expired,
            ),
        )

    async def activity(self, port: Port, days: int):
        today = self.clock().date()
        # Key is stable across days, but cached window must be checked before reuse.
        key = f"v1:activity:{port.id}:{days}"

        async def fetch():
            return await providers.activity(self.client, port, days, today)

        snapshot, status = await self.snapshot(
            key,
            self.settings.activity_ttl_seconds,
            fetch,
            lambda cached: cached.payload["window_end"] == (today - timedelta(days=1)).isoformat(),
        )
        payload = snapshot.payload
        latest = payload["latest_available_date"]
        lag = (today - date.fromisoformat(latest)).days if latest else None
        warnings = ["ACTIVITY_IS_NOT_PORT_UTILIZATION_OR_CARGO_DELAY"]
        if payload["missing_dates"]:
            warnings.append("MISSING_DATES_NOT_FILLED_WITH_ZERO")
        if lag is None or lag > 3:
            warnings.append("LATEST_OBSERVATION_OLDER_THAN_3_DAYS" if lag else "NO_OBSERVATIONS")
        if payload["window_end"] != (today - timedelta(days=1)).isoformat():
            warnings.append("CACHED_WINDOW_DIFFERS_FROM_CURRENT_REQUEST")
        all_missing = not payload["daily"] or all(p["portcalls"] is None for p in payload["daily"])
        return ActivityResponse(
            **payload,
            meta=self.meta(
                snapshot,
                status,
                "imf_portwatch",
                "missing" if all_missing else "estimated",
                warnings,
                lag is None or lag > 3,
            ),
        )

    async def sailings(self, port_id: str):
        async def load(source):
            try:
                snapshot, status = await self.snapshot(
                    f"v1:sailings:{source}",
                    self.settings.sailings_ttl_seconds,
                    lambda: sailings.fetch(self.client, source),
                )
                return source, snapshot, status
            except DataUnavailable:
                return source, None, None

        results = await asyncio.gather(*(load(s) for s in sailings.PORT_SOURCES[port_id]))
        items, sources, errors = [], [], []
        for source, snapshot, status in results:
            if snapshot is None:
                errors.append(SailingSourceError(source_id=source))
                continue
            payload = snapshot.payload
            reported = date.fromisoformat(payload["reported_date"])
            lag = (self.clock().date() - reported).days
            warnings = ["SOURCE_TIMEZONE_UNVERIFIED", "PUBLISHED_DISPOSITION_NOT_A_BOOKING"]
            if source == "kuryk":
                warnings.extend(["ROW_YEAR_INFERRED_FROM_PUBLICATION", "PUBLICATION_HAS_DATE_ONLY"])
            if not payload["items"]:
                warnings.append("NO_PUBLISHED_ROWS")
            if status == "stale":
                warnings.append("UPSTREAM_UNAVAILABLE_USING_LAST_SNAPSHOT")
            if lag > 1:
                warnings.append("PUBLICATION_OLDER_THAN_ONE_DAY")
            if lag < -1:
                warnings.append("PUBLICATION_DATE_IN_FUTURE")
            if source == "asco" and any(
                item[field] and item[field] not in sailings.PORT_NAMES
                for item in payload["items"]
                for field in ("departure_port_raw", "destination_port_raw")
            ):
                warnings.append("UNRECOGNIZED_PORT_NAMES_PRESERVED")
            sources.append(
                SailingSource(
                    source_id=source,
                    source_url=snapshot.source_url,
                    fetched_at=snapshot.fetched_at,
                    source_updated_at=None,
                    reported_date=reported,
                    reported_at_local=payload["reported_at_local"],
                    timezone=None,
                    cache_status=status,
                    stale=status == "stale" or lag > 1 or lag < -1,
                    warnings=warnings,
                )
            )
            items.extend(
                Sailing.model_validate(item)
                for item in payload["items"]
                if port_id in item["port_ids"]
            )
        if not sources:
            raise DataUnavailable()
        return SailingsResponse(
            port_id=port_id, items=items, sources=sources, errors=errors, partial=bool(errors)
        )
