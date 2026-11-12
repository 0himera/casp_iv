import logging
from collections.abc import Callable
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated

import httpx
from fastapi import FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from .cache import SnapshotCache
from .catalog import load_catalog
from .config import Settings
from .models import (
    ActivityResponse,
    ErrorResponse,
    Health,
    Port,
    PortList,
    SailingsResponse,
    WeatherResponse,
)
from .prediction import PredictionRequest, PredictionResponse, predict
from .sailings import PORT_SOURCES
from .service import DataService, DataUnavailable
from .transit_api import router as transit_router
from .transit_store import Store


def create_app(
    settings: Settings | None = None,
    transport: httpx.AsyncBaseTransport | None = None,
    clock: Callable[[], datetime] = lambda: datetime.now(UTC),
) -> FastAPI:
    settings = settings or Settings()
    catalog = load_catalog(settings.catalog_path)
    ports = {p.id: p for p in catalog.items}

    @asynccontextmanager
    async def lifespan(app):
        cache = SnapshotCache(settings.cache_path)
        app.state.settings = settings
        app.state.transit = Store(settings.transit_path)
        async with httpx.AsyncClient(
            transport=transport,
            timeout=httpx.Timeout(settings.request_timeout_seconds, connect=5),
            follow_redirects=False,
            headers={"User-Agent": "CaspianFlow/0.1 (hackathon prototype)"},
            limits=httpx.Limits(max_connections=8, max_keepalive_connections=4),
        ) as client:
            app.state.data = DataService(client, cache, settings, clock)
            yield

    app = FastAPI(
        title="Caspian Flow API",
        version="1.0.0",
        lifespan=lifespan,
        description="Public sources and persistent shipments with Casper testnet operations.",
        responses={status: {"model": ErrorResponse} for status in (404, 422, 500, 503)},
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
    )
    app.include_router(transit_router)

    def error(status, code, message):
        return JSONResponse(
            status_code=status, content={"error": {"code": code, "message": message}}
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        return error(
            422, "VALIDATION_ERROR", "Проверьте параметры и тело запроса"
        )

    @app.exception_handler(HTTPException)
    async def http_error(request, exc):
        detail = (
            exc.detail
            if isinstance(exc.detail, dict)
            else {
                "code": "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR",
                "message": str(exc.detail),
            }
        )
        return error(exc.status_code, detail["code"], detail["message"])

    @app.exception_handler(DataUnavailable)
    async def unavailable(request, exc):
        response = error(503, "SOURCE_UNAVAILABLE", "Источник недоступен; сохранённого снимка нет")
        response.headers["Retry-After"] = str(settings.retry_cooldown_seconds)
        return response

    @app.exception_handler(Exception)
    async def internal_error(request, exc):
        logging.getLogger(__name__).exception("Internal public data API error", exc_info=exc)
        return error(500, "INTERNAL_ERROR", "Внутренняя ошибка сервиса данных")

    def get_port(port_id):
        if port_id not in ports:
            raise HTTPException(404, {"code": "PORT_NOT_FOUND", "message": "Порт не найден"})
        return ports[port_id]

    @app.get("/api/v1/health", response_model=Health)
    async def health():
        return Health(catalog_ports=len(ports))

    @app.get("/api/v1/ports", response_model=PortList)
    async def list_ports():
        return catalog

    @app.get("/api/v1/ports/{port_id}", response_model=Port)
    async def read_port(port_id: str):
        return get_port(port_id)

    @app.get("/api/v1/ports/{port_id}/weather", response_model=WeatherResponse)
    async def weather(
        port_id: str, request: Request, forecast_days: Annotated[int, Query(ge=1, le=7)] = 3
    ):
        port = get_port(port_id)
        if not port.weather_available:
            raise HTTPException(
                422,
                {
                    "code": "COORDINATES_UNVERIFIED",
                    "message": "Координаты порта ещё не подтверждены",
                },
            )
        return await request.app.state.data.weather(port, forecast_days)

    @app.get("/api/v1/ports/{port_id}/activity", response_model=ActivityResponse)
    async def activity(
        port_id: str, request: Request, days: Annotated[int, Query(ge=1, le=90)] = 30
    ):
        port = get_port(port_id)
        if not port.activity_available:
            raise HTTPException(
                422,
                {
                    "code": "SOURCE_NOT_COVERED",
                    "message": "Отдельный PortWatch ID порта не подтверждён",
                },
            )
        return await request.app.state.data.activity(port, days)

    @app.get("/api/v1/sailings", response_model=SailingsResponse)
    async def sailings(request: Request, port_id: str):
        get_port(port_id)
        if port_id not in PORT_SOURCES:
            raise HTTPException(
                422,
                {
                    "code": "SOURCE_NOT_COVERED",
                    "message": "Диспозиции доступны для kuryk, alat, turkmenbashi",
                },
            )
        return await request.app.state.data.sailings(port_id)

    @app.post("/api/v1/predictions/readiness", response_model=PredictionResponse)
    def readiness(body: PredictionRequest):
        # FastAPI runs sync route functions in a thread pool; no mutation or chain call.
        return predict(body)

    return app


app = create_app()
