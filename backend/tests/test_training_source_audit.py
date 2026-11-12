from datetime import datetime, timedelta

from scripts.inspect_training_data import cases_from_events, examples


def test_learning_inputs_cannot_use_later_customs_attributes():
    start = datetime(2021, 7, 1)

    def row(activity, end, size=None, kind=None, gross=None):
        return (
            "container",
            size,
            kind,
            gross,
            None,
            None,
            None,
            activity,
            end - timedelta(minutes=10),
            end,
            None,
            "staff role",
        )

    cases, profile = cases_from_events(
        [
            row("BAPLIE", start, size=20, kind="DRY"),
            row("DISCHARGE", start + timedelta(hours=2), gross=15),
            row("CUSTOMS_DEL", start + timedelta(hours=8), size=99, gross=999),
            row("TRUCK_OUT", start + timedelta(hours=26)),
        ]
    )
    data, rejected = examples(cases)
    assert profile["event_rows"] == 4 and not rejected
    assert data[0]["container_size"] == 20 and data[0]["gross_tonnes"] == 15
    assert data[0]["terminal_dwell_hours"] == 24


def test_censored_and_ambiguous_cases_do_not_invent_durations():
    start = datetime(2021, 7, 1)
    data, rejected = examples(
        {
            "censored": {"discharge": [start], "truck_out": [], "attributes": []},
            "backwards": {
                "discharge": [start],
                "truck_out": [start - timedelta(hours=1)],
                "attributes": [],
            },
        }
    )
    assert not data
    assert rejected == {
        "missing_or_ambiguous_discharge_or_truck_out": 1,
        "truck_out_before_discharge": 1,
    }


def test_corrupt_dates_exclude_whole_case_without_rewriting_history():
    start = datetime(2021, 7, 1)
    cases, profile = cases_from_events(
        [
            (
                "bad-date",
                None,
                None,
                None,
                None,
                None,
                None,
                "CUSTOMS_DEL",
                datetime(1954, 4, 2),
                datetime(1954, 7, 14),
                None,
                None,
            ),
            (
                "bad-date",
                20,
                "DRY",
                12,
                None,
                None,
                None,
                "DISCHARGE",
                start,
                start + timedelta(hours=1),
                None,
                None,
            ),
            (
                "bad-date",
                None,
                None,
                None,
                None,
                None,
                None,
                "TRUCK_OUT",
                start + timedelta(hours=23),
                start + timedelta(hours=24),
                None,
                None,
            ),
        ]
    )
    data, rejected = examples(cases)
    assert not data
    assert rejected["case_contains_timestamp_quality_issue"] == 1
    assert profile["end_timestamp_year_counts"]["1954"] == 1
