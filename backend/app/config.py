import json
import os
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = BACKEND_ROOT.parent


@dataclass(frozen=True)
class Settings:
    dwell_model_dir: Path | None = field(
        default_factory=lambda: (
            Path(value)
            if (
                value := os.getenv(
                    "CASPIAN_DWELL_MODEL_DIR", str(REPOSITORY_ROOT / "models/terminal-dwell/v1")
                )
            )
            else None
        )
    )
    transit_path: Path = field(
        default_factory=lambda: Path(
            os.getenv("CASPIAN_TRANSIT_PATH", str(BACKEND_ROOT / "var/transit.sqlite3"))
        )
    )
    transit_writes: bool = field(
        default_factory=lambda: os.getenv("CASPIAN_TRANSIT_WRITES", "false").lower() == "true"
    )
    role_tokens: dict[str, str] = field(
        default_factory=lambda: json.loads(os.getenv("CASPIAN_ROLE_TOKENS", "{}"))
    )
    catalog_path: Path = REPOSITORY_ROOT / "data/ports.json"
    cache_path: Path = field(
        default_factory=lambda: Path(
            os.getenv("CASPIAN_CACHE_PATH", str(BACKEND_ROOT / "var/public-data.sqlite3"))
        )
    )
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            origin.strip()
            for origin in os.getenv(
                "CASPIAN_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
            ).split(",")
            if origin.strip()
        )
    )
    request_timeout_seconds: float = field(
        default_factory=lambda: float(os.getenv("CASPIAN_REQUEST_TIMEOUT_SECONDS", "15"))
    )
    weather_ttl_seconds: int = field(
        default_factory=lambda: int(os.getenv("CASPIAN_WEATHER_TTL_SECONDS", "1800"))
    )
    activity_ttl_seconds: int = field(
        default_factory=lambda: int(os.getenv("CASPIAN_ACTIVITY_TTL_SECONDS", "21600"))
    )
    retry_cooldown_seconds: int = field(
        default_factory=lambda: int(os.getenv("CASPIAN_RETRY_COOLDOWN_SECONDS", "60"))
    )
    sailings_ttl_seconds: int = field(
        default_factory=lambda: int(os.getenv("CASPIAN_SAILINGS_TTL_SECONDS", "900"))
    )

    def __post_init__(self):
        if self.role_tokens and (
            set(self.role_tokens) != {"logistician", "carrier", "customs"}
            or any(not isinstance(t, str) or len(t) < 24 for t in self.role_tokens.values())
            or len(set(self.role_tokens.values())) != 3
        ):
            raise ValueError("Provide three distinct role tokens, at least 24 characters each")
        if (
            self.request_timeout_seconds <= 0
            or min(
                self.weather_ttl_seconds,
                self.activity_ttl_seconds,
                self.retry_cooldown_seconds,
                self.sailings_ttl_seconds,
            )
            <= 0
        ):
            raise ValueError("Timeout, cache TTLs and retry cooldown must be positive")
