"""Optional ML dependency; a missing/broken model never prevents algorithmic predictions."""

import hashlib
import json
import logging
import random
from datetime import UTC, timedelta
from pathlib import Path
from threading import Lock

from .dwell_contract import (
    FEATURES,
    QUANTILES,
    TASK,
    DwellModelStatus,
    DwellRequest,
    DwellResponse,
    feature_row,
    ordered_quantiles,
)
from .prediction import draw

logger = logging.getLogger(__name__)


class DwellPredictor:
    def __init__(self, directory: Path | None):
        self.model = None
        self.metadata = None
        self.load_error = None
        self.lock = Lock()
        if directory is None:
            self.load_error = "MODEL_DISABLED"
            return
        if not (directory / "metadata.json").exists():
            self.load_error = "MODEL_MISSING"
            return
        try:
            self._load(directory)
        except ImportError:
            self.load_error = "ML_DEPENDENCY_UNAVAILABLE"
        except Exception:
            self.load_error = "MODEL_LOAD_FAILED"
            logger.exception(
                "Terminal dwell model could not be loaded; algorithm remains available"
            )

    def _load(self, directory):
        metadata = json.loads((directory / "metadata.json").read_text())
        if (
            metadata["task"] != TASK
            or metadata["features"] != list(FEATURES)
            or (metadata["quantiles"] != list(QUANTILES))
        ):
            raise ValueError("Model package contract mismatch")
        path = directory / "model.cbm"
        if hashlib.sha256(path.read_bytes()).hexdigest() != metadata["model_sha256"]:
            raise ValueError("Model checksum mismatch")
        from catboost import CatBoostRegressor

        model = CatBoostRegressor()
        model.load_model(str(path))
        if model.feature_names_ != list(FEATURES):
            raise ValueError("Model feature order mismatch")
        self.metadata, self.model = metadata, model

    def status(self):
        return DwellModelStatus(
            loaded=self.model is not None,
            model_version=self.metadata["version"] if self.metadata else None,
            load_error=self.load_error,
        )

    def predict(self, body: DwellRequest):
        warnings = [
            "EXPERIMENTAL_ANONYMIZED_TERMINAL_NOT_VALIDATED_ON_CASPIAN",
            "TARGET_IS_IMPORT_CONTAINER_RELEASE_NOT_OUTBOUND_FERRY_READINESS",
            "SOURCE_TIMEZONE_AND_FEATURE_PUBLICATION_TIMES_UNCONFIRMED",
            "EXPERIMENTAL_MODEL_ERROR_AND_INTERVAL_COVERAGE_REQUIRE_REVIEW",
        ]
        values, version = None, None
        reason = "ALGORITHM_REQUESTED" if body.mode == "algorithm" else self.load_error
        if body.mode == "auto" and self.model is not None:
            with self.lock:
                try:
                    ranges = self.metadata["input_domain"]
                    if str(body.container_size) not in ranges["container_sizes"] or (
                        body.container_type not in ranges["container_types"]
                        or not ranges["gross_min"] <= body.gross_tonnes <= ranges["gross_max"]
                    ):
                        reason = "OUTSIDE_MODEL_INPUT_DOMAIN"
                    else:
                        features = feature_row(
                            body.container_size,
                            body.container_type,
                            body.gross_tonnes,
                            body.observed_at,
                        )
                        values = ordered_quantiles(
                            self.model.predict([features], thread_count=1)[0]
                        )
                        version = self.metadata["version"]
                except Exception:
                    reason = "MODEL_PREDICTION_FAILED"
                    logger.exception("Terminal dwell inference failed; using algorithm")
        learned = values is not None
        if not learned:
            reason = reason or "MODEL_NOT_AVAILABLE"
            rng = random.Random(body.seed)
            samples = sorted(draw(rng, body.fallback_duration) for _ in range(body.samples))
            values = []
            for alpha in QUANTILES:
                index = (len(samples) - 1) * alpha
                lower = int(index)
                upper = min(lower + 1, len(samples) - 1)
                values.append(samples[lower] + (samples[upper] - samples[lower]) * (index - lower))
            warnings.append("FALLBACK_DURATION_IS_A_USER_SCENARIO_NOT_A_CALIBRATED_FORECAST")
        else:
            reason = None
        hours = dict(zip(("p10", "p50", "p90"), values, strict=True))
        observed = body.observed_at.astimezone(UTC)
        return DwellResponse(
            method="catboost_terminal_dwell_v1" if learned else "monte_carlo_terminal_dwell_v1",
            model_loaded=self.model is not None,
            model_version=version,
            fallback_reason=reason,
            trained_on_history=learned,
            remaining_hours=hours,
            release_at={name: observed + timedelta(hours=value) for name, value in hours.items()},
            samples=None if learned else body.samples,
            warnings=warnings,
        )
