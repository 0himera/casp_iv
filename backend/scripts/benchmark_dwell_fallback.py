"""Compare the actual default fallback with saved model predictions on exactly the same cases.

uv run --group ml python -m scripts.benchmark_dwell_fallback
"""

import hashlib
import json

import numpy as np
import pandas as pd

from app.config import REPOSITORY_ROOT
from app.dwell import DwellPredictor
from app.dwell_contract import DwellRequest
from scripts.train_terminal_dwell import interval_metrics


def main():
    root = REPOSITORY_ROOT / "models/terminal-dwell/v1"
    path = root / "test-predictions.csv"
    data = pd.read_csv(path)
    report = json.loads((root / "report.json").read_text())
    if len(data) != report["split"]["test"]["used_rows"] or data.case_key.duplicated().any():
        raise ValueError("Unexpected evaluation cases")
    request = DwellRequest(
        observed_at="2026-11-12T12:00:00+03:00",
        container_size=20,
        container_type="DRY",
        gross_tonnes=15,
        mode="algorithm",
    )
    predictor = DwellPredictor(None)
    response = predictor.predict(request)
    quantiles = list(response.remaining_hours.model_dump().values())
    # The scenario fallback ignores static attributes; confirm that before evaluating it once.
    alternate = request.model_copy(update={"container_type": "RFR", "gross_tonnes": 30})
    if predictor.predict(alternate).remaining_hours != response.remaining_hours:
        raise ValueError("Fallback depends on case features; evaluate each case separately")
    result = {
        "task": response.task,
        "case_count": len(data),
        "test_predictions_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "fallback_parameters": request.model_dump(mode="json"),
        "fallback_quantiles_hours": response.remaining_hours.model_dump(),
        "monte_carlo_default": interval_metrics(
            data.terminal_dwell_hours.to_numpy(), np.tile(quantiles, (len(data), 1))
        ),
        "model_comparisons": report["test"],
        "parameters_tuned_on_test": False,
        "interpretation": [
            "The default fallback is a fixed scenario distribution, not a fitted model",
            "Remaining-hour quantiles are identical for every case with these default assumptions",
            "All methods use exactly the same historical completed-case sample",
            "This is a post-hoc comparison, not additional independent validation",
            "Small mean-error differences do not establish statistically significant superiority",
        ],
    }
    (root / "fallback-comparison.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"cases": len(data), "monte_carlo": result["monte_carlo_default"]}, indent=2))


if __name__ == "__main__":
    main()
