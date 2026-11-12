import pytest

pd = pytest.importorskip("pandas")
pytest.importorskip("catboost")
pytest.importorskip("sklearn")

from scripts.train_terminal_dwell import interval_metrics, split_data  # noqa: E402


def test_historical_fit_purges_future_outcomes_and_keeps_cases_disjoint():
    records = []
    for split, instant in (
        ("train", "2021-07-10"),
        ("validation", "2021-08-10"),
        ("test", "2021-09-10"),
    ):
        for index in range(100):
            records.append(
                {
                    "case_key": f"{split}_{index}",
                    "prediction_at_local": pd.Timestamp(instant),
                    "truck_out_at_local": pd.Timestamp(instant) + pd.Timedelta(hours=24),
                }
            )
    records.extend(
        [
            {
                "case_key": "future_train",
                "prediction_at_local": pd.Timestamp("2021-07-31"),
                "truck_out_at_local": pd.Timestamp("2021-08-02"),
            },
            {
                "case_key": "future_selection",
                "prediction_at_local": pd.Timestamp("2021-08-10"),
                "truck_out_at_local": pd.Timestamp("2021-09-02"),
            },
        ]
    )
    data = pd.DataFrame(records)
    splits, audit = split_data(data)
    assert all(len(splits[name]) == 100 for name in ("train", "validation", "test"))
    assert audit["train"]["purged_unknown_outcomes"] == 1
    assert audit["validation"]["purged_unknown_outcomes"] == 1
    assert not set(splits["train"].case_key) & set(splits["test"].case_key)
    with pytest.raises(ValueError, match="Duplicate"):
        split_data(pd.concat([data, data.iloc[:1]]))


def test_report_scores_actual_interval_coverage_and_median_error():
    scores = interval_metrics([1, 3], [[0, 1, 2], [1, 2, 5]])
    assert scores["mae_hours"] == 0.5
    assert scores["p10_p90_coverage"] == 1
    assert scores["mean_interval_width_hours"] == 3
    assert scores["pinball_hours"]["0.5"] == 0.25
