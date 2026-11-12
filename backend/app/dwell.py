"""Optional ML dependency; a missing/broken model never prevents algorithmic predictions."""

import hashlib
import json
import logging
import math
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
from .dwell_history import HISTORY_FEATURES, history_features
from .prediction import draw

logger = logging.getLogger(__name__)


class DwellPredictor:
    def __init__(self, directory: Path | None, history_directory: Path | None = None):
        self.model = None
        self.metadata = None
        self.load_error = None
        self.lock = Lock()
        self.history_predictor = (
            DwellPredictor(history_directory) if history_directory is not None else None
        )
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
            or metadata["features"] not in (list(FEATURES), [*FEATURES, *HISTORY_FEATURES])
            or (metadata["quantiles"] != list(QUANTILES))
        ):
            raise ValueError("Model package contract mismatch")
        if metadata["features"] != list(FEATURES):
            if not metadata.get("serving_enabled"):
                raise ValueError("History model did not pass validation promotion rule")
            offsets = metadata["quantile_offsets_hours"]
            if len(offsets) != 3 or not all(math.isfinite(v) for v in offsets):
                raise ValueError("Invalid calibration offsets")
        path = directory / "model.cbm"
        if hashlib.sha256(path.read_bytes()).hexdigest() != metadata["model_sha256"]:
            raise ValueError("Model checksum mismatch")
        from catboost import CatBoostRegressor

        model = CatBoostRegressor()
        model.load_model(str(path))
        if model.feature_names_ != metadata["features"]:
            raise ValueError("Model feature order mismatch")
        self.metadata, self.model = metadata, model

    def status(self):
        history = self.history_predictor
        return DwellModelStatus(
            loaded=self.model is not None,
            model_version=self.metadata["version"] if self.metadata else None,
            load_error=self.load_error,
            history_loaded=history is not None and history.model is not None,
            history_model_version=history.metadata["version"]
            if history and history.metadata
            else None,
            history_load_error=history.load_error if history else "MODEL_DISABLED",
        )

    def predict(self, body: DwellRequest):
        history = self.history_predictor
        history_note = None
        complete_history = {"BAPLIE", "VESSEL_ATB"} <= {e.activity for e in body.history}
        if body.history and body.mode == "auto" and not complete_history:
            history_note = "INCOMPLETE_HISTORY_USING_BASE_MODEL"
        elif (
            body.history
            and body.mode == "auto"
            and history is not None
            and history.model is not None
        ):
            response = history.predict(body)
            if response.trained_on_history:
                return response
            history_note = "HISTORY_MODEL_FAILED_USING_BASE_MODEL"
        elif body.history and body.mode == "auto" and self.history_predictor is not None:
            history_note = "HISTORY_MODEL_UNAVAILABLE_USING_BASE_MODEL"
        warnings = [
            "EXPERIMENTAL_ANONYMIZED_TERMINAL_NOT_VALIDATED_ON_CASPIAN",
            "TARGET_IS_IMPORT_CONTAINER_RELEASE_NOT_OUTBOUND_FERRY_READINESS",
            "SOURCE_TIMEZONE_AND_FEATURE_PUBLICATION_TIMES_UNCONFIRMED",
            "EXPERIMENTAL_MODEL_ERROR_AND_INTERVAL_COVERAGE_REQUIRE_REVIEW",
        ]
        if history_note:
            warnings.append(history_note)
        values, version = None, None
        reason = "ALGORITHM_REQUESTED" if body.mode == "algorithm" else self.load_error
        needs_history = self.metadata and self.metadata["features"] != list(FEATURES)
        if needs_history and not complete_history and body.mode == "auto":
            reason = "HISTORY_REQUIRED"
        if body.mode == "auto" and self.model is not None and reason != "HISTORY_REQUIRED":
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
                        if needs_history:
                            features += history_features(
                                [(e.activity, e.completed_at) for e in body.history],
                                body.observed_at,
                            )
                        raw = self.model.predict([features], thread_count=1)[0]
                        # Same rearrangement/calibration order as the offline report.
                        values = ordered_quantiles(raw)
                        if needs_history:
                            values = ordered_quantiles(
                                [
                                    value + offset
                                    for value, offset in zip(
                                        values, self.metadata["quantile_offsets_hours"], strict=True
                                    )
                                ]
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
            method=("catboost_terminal_dwell_v2" if needs_history else "catboost_terminal_dwell_v1")
            if learned
            else "monte_carlo_terminal_dwell_v1",
            model_loaded=self.model is not None,
            model_version=version,
            fallback_reason=reason,
            trained_on_history=learned,
            remaining_hours=hours,
            release_at={name: observed + timedelta(hours=value) for name, value in hours.items()},
            samples=None if learned else body.samples,
            warnings=warnings,
        )
