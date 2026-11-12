import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import REPOSITORY_ROOT, Settings
from app.dwell import DwellPredictor
from app.dwell_contract import DwellRequest
from app.main import create_app

PACKAGE = REPOSITORY_ROOT / "models/terminal-dwell/v1"
BODY = {
    "observed_at": "2026-11-12T12:00:00+03:00",
    "container_size": 20,
    "container_type": "DRY",
    "gross_tonnes": 15,
    "fallback_duration": {"minimum_hours": 6, "typical_hours": 6, "maximum_hours": 6},
}


def rig(tmp_path, directory):
    return TestClient(
        create_app(
            Settings(
                cache_path=tmp_path / "cache.db",
                transit_path=tmp_path / "transit.db",
                dwell_model_dir=directory,
            )
        )
    )


@pytest.mark.parametrize(
    "directory,reason", [(None, "MODEL_DISABLED"), (Path("/nonexistent/dwell"), "MODEL_MISSING")]
)
def test_missing_or_disabled_model_keeps_api_available(tmp_path, directory, reason):
    with rig(tmp_path, directory) as client:
        status = client.get("/api/v1/models/terminal-dwell").json()
        assert status["loaded"] is False and status["load_error"] == reason
        response = client.post("/api/v1/predictions/terminal-dwell", json=BODY)
        assert response.status_code == 200
        value = response.json()
        assert value["method"] == "monte_carlo_terminal_dwell_v1"
        assert value["fallback_reason"] == reason and not value["trained_on_history"]
        assert value["remaining_hours"] == {"p10": 6, "p50": 6, "p90": 6}
        assert value["release_at"]["p50"] == "2026-11-12T15:00:00Z"


def test_broken_package_falls_back_without_failing_startup(tmp_path):
    directory = tmp_path / "model"
    directory.mkdir()
    metadata = json.loads((PACKAGE / "metadata.json").read_text())
    (directory / "metadata.json").write_text(json.dumps(metadata))
    (directory / "model.cbm").write_bytes(b"broken weights")
    with rig(tmp_path, directory) as client:
        value = client.post("/api/v1/predictions/terminal-dwell", json=BODY).json()
        assert value["fallback_reason"] == "MODEL_LOAD_FAILED"
        assert value["method"] == "monte_carlo_terminal_dwell_v1"


def test_missing_optional_catboost_dependency_falls_back(monkeypatch):
    import builtins

    original = builtins.__import__

    def guarded(name, *args, **kwargs):
        if name == "catboost":
            raise ImportError("optional ML dependency not installed")
        return original(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", guarded)
    predictor = DwellPredictor(PACKAGE)
    assert predictor.status().load_error == "ML_DEPENDENCY_UNAVAILABLE"
    assert predictor.predict(DwellRequest(**BODY)).remaining_hours.p50 == 6


def test_real_saved_weights_and_explicit_algorithm_share_response_contract(tmp_path):
    pytest.importorskip("catboost")
    with rig(tmp_path, PACKAGE) as client:
        assert client.get("/api/v1/models/terminal-dwell").json()["loaded"]
        value = client.post("/api/v1/predictions/terminal-dwell", json=BODY).json()
        assert value["method"] == "catboost_terminal_dwell_v1"
        assert value["trained_on_history"] and value["fallback_reason"] is None
        q = value["remaining_hours"]
        assert 0 <= q["p10"] <= q["p50"] <= q["p90"]
        algorithm = client.post(
            "/api/v1/predictions/terminal-dwell", json=BODY | {"mode": "algorithm"}
        ).json()
        assert set(algorithm) == set(value)
        assert algorithm["model_loaded"] and not algorithm["trained_on_history"]
        assert algorithm["fallback_reason"] == "ALGORITHM_REQUESTED"
        outside = client.post(
            "/api/v1/predictions/terminal-dwell", json=BODY | {"container_type": "UNSEEN"}
        ).json()
        assert outside["fallback_reason"] == "OUTSIDE_MODEL_INPUT_DOMAIN"
        assert outside["remaining_hours"]["p50"] == 6
        assert (
            client.post(
                "/api/v1/predictions/terminal-dwell",
                json=BODY | {"truck_out_at_local": "future outcome"},
            ).status_code
            == 422
        )


def test_inference_exception_uses_algorithm_instead_of_500():
    predictor = DwellPredictor(None)
    predictor.metadata = json.loads((PACKAGE / "metadata.json").read_text())

    class FailedModel:
        def predict(self, *args, **kwargs):
            raise RuntimeError("inference failed")

    predictor.model = FailedModel()
    response = predictor.predict(DwellRequest(**BODY))
    assert response.method == "monte_carlo_terminal_dwell_v1"
    assert response.fallback_reason == "MODEL_PREDICTION_FAILED"
    assert response.remaining_hours.p50 == 6
