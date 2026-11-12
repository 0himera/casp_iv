import json
import math
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.config import REPOSITORY_ROOT, Settings
from app.dwell import DwellPredictor
from app.dwell_contract import DwellRequest, feature_row, ordered_quantiles
from app.dwell_history import history_features
from app.main import create_app

V1 = REPOSITORY_ROOT / "models/terminal-dwell/v1"
V2 = REPOSITORY_ROOT / "models/terminal-dwell/v2"
BODY = {
    "observed_at": "2021-09-10T12:00:00+03:00",
    "container_size": 20,
    "container_type": "DRY",
    "gross_tonnes": 15,
    "history": [
        {"activity": "BAPLIE", "completed_at": "2021-09-08T09:00:00Z"},
        {"activity": "VESSEL_ATB", "completed_at": "2021-09-09T09:00:00Z"},
    ],
}


def test_features_ignore_future_and_target_and_do_not_depend_on_order():
    observed = datetime(2021, 9, 10, 12)
    past = [
        ("BAPLIE", observed - timedelta(hours=48)),
        ("VESSEL_ATB", observed - timedelta(hours=24)),
    ]
    extra = [
        ("DISCHARGE", observed),
        ("TRUCK_OUT", observed),
        ("CUSTOMS_DEL", observed + timedelta(hours=1)),
    ]
    assert history_features(past + extra, observed) == [48, 24, 2, 0, 0, 24]
    assert history_features(list(reversed(past + extra)), observed) == [48, 24, 2, 0, 0, 24]
    missing = history_features([], observed)
    assert math.isnan(missing[0]) and missing[2:5] == [0, 0, 0]


@pytest.mark.parametrize(
    "event",
    [
        {"activity": "CUSTOMS_DEL", "completed_at": "2021-09-11T09:00:00Z"},
        {"activity": "TRUCK_OUT", "completed_at": "2021-09-10T09:00:00Z"},
        {"activity": "DISCHARGE", "completed_at": "2021-09-09T09:00:00Z"},
        {"activity": "BAPLIE", "completed_at": "2021-09-08T09:00:00Z"},
    ],
)
def test_invalid_history_rejected_by_http(tmp_path, event):
    settings = Settings(
        cache_path=tmp_path / "cache",
        transit_path=tmp_path / "transit",
        dwell_model_dir=None,
        dwell_history_model_dir=None,
    )
    with TestClient(create_app(settings)) as client:
        response = client.post(
            "/api/v1/predictions/terminal-dwell", json=BODY | {"history": [*BODY["history"], event]}
        )
        assert response.status_code == 422


def test_history_model_matches_saved_weights_and_temporal_calibration(tmp_path):
    cb = pytest.importorskip("catboost")
    body = DwellRequest(**BODY)
    model = cb.CatBoostRegressor()
    model.load_model(str(V2 / "model.cbm"))
    metadata = json.loads((V2 / "metadata.json").read_text())
    x = feature_row(body.container_size, body.container_type, body.gross_tonnes, body.observed_at)
    x += history_features([(e.activity, e.completed_at) for e in body.history], body.observed_at)
    raw = ordered_quantiles(model.predict([x])[0])
    expected = ordered_quantiles(
        [v + o for v, o in zip(raw, metadata["quantile_offsets_hours"], strict=True)]
    )
    settings = Settings(
        cache_path=tmp_path / "cache",
        transit_path=tmp_path / "transit",
        dwell_model_dir=V1,
        dwell_history_model_dir=V2,
    )
    with TestClient(create_app(settings)) as client:
        status = client.get("/api/v1/models/terminal-dwell").json()
        assert status["history_loaded"] and status["history_model_version"].endswith("v2")
        response = client.post("/api/v1/predictions/terminal-dwell", json=BODY).json()
        assert response["method"] == "catboost_terminal_dwell_v2"
        assert list(response["remaining_hours"].values()) == pytest.approx(expected)
        legacy = client.post(
            "/api/v1/predictions/terminal-dwell", json=BODY | {"history": []}
        ).json()
        assert legacy["method"] == "catboost_terminal_dwell_v1"
        algorithm = client.post(
            "/api/v1/predictions/terminal-dwell", json=BODY | {"mode": "algorithm"}
        ).json()
        assert algorithm["fallback_reason"] == "ALGORITHM_REQUESTED"
        assert algorithm["method"] == "monte_carlo_terminal_dwell_v1"


def test_missing_or_incomplete_history_uses_base_model():
    pytest.importorskip("catboost")
    predictor = DwellPredictor(V1, V2)
    result = predictor.predict(DwellRequest(**(BODY | {"history": BODY["history"][:1]})))
    assert result.method == "catboost_terminal_dwell_v1"
    assert "INCOMPLETE_HISTORY_USING_BASE_MODEL" in result.warnings
    predictor = DwellPredictor(V1, V2 / "missing")
    result = predictor.predict(DwellRequest(**BODY))
    assert result.method == "catboost_terminal_dwell_v1"
    assert "HISTORY_MODEL_UNAVAILABLE_USING_BASE_MODEL" in result.warnings


def test_both_missing_packages_still_return_algorithm():
    predictor = DwellPredictor(None, V2 / "missing")
    response = predictor.predict(DwellRequest(**BODY))
    assert response.method == "monte_carlo_terminal_dwell_v1"
    assert not response.trained_on_history


def test_missing_ml_dependency_disables_both_models(monkeypatch):
    import builtins

    original = builtins.__import__

    def guarded(name, *args, **kwargs):
        if name == "catboost":
            raise ImportError("optional dependency unavailable")
        return original(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", guarded)
    predictor = DwellPredictor(V1, V2)
    status = predictor.status()
    assert status.load_error == status.history_load_error == "ML_DEPENDENCY_UNAVAILABLE"
    assert predictor.predict(DwellRequest(**BODY)).method == "monte_carlo_terminal_dwell_v1"


def test_unapproved_history_package_cannot_replace_base(tmp_path):
    pytest.importorskip("catboost")
    metadata = json.loads((V2 / "metadata.json").read_text())
    metadata["serving_enabled"] = False
    (tmp_path / "metadata.json").write_text(json.dumps(metadata))
    predictor = DwellPredictor(V1, tmp_path)
    assert predictor.status().history_load_error == "MODEL_LOAD_FAILED"
    assert predictor.predict(DwellRequest(**BODY)).method == "catboost_terminal_dwell_v1"


def test_history_inference_failure_uses_working_base_model():
    pytest.importorskip("catboost")
    predictor = DwellPredictor(V1, V2)

    class FailedModel:
        def predict(self, *args, **kwargs):
            raise RuntimeError("failed")

    predictor.history_predictor.model = FailedModel()
    response = predictor.predict(DwellRequest(**BODY))
    assert response.method == "catboost_terminal_dwell_v1"
    assert "HISTORY_MODEL_FAILED_USING_BASE_MODEL" in response.warnings
