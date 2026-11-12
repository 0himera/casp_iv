"""Small, shared offline/online feature extractor for completed pre-discharge events."""

HISTORY_FEATURES = (
    "hours_since_baplie",
    "hours_since_vessel_atb",
    "known_event_count",
    "customs_del_seen",
    "job_del_seen",
    "hours_since_previous_event",
)


def history_features(events, observed):
    # DISCHARGE is the prediction anchor, not an extra observation. Callers may omit it.
    known = [
        (name, end)
        for name, end in events
        if end <= observed and name not in {"DISCHARGE", "TRUCK_OUT"}
    ]

    def age(name):
        ends = [end for activity, end in known if activity == name]
        return (observed - max(ends)).total_seconds() / 3600 if ends else float("nan")

    return [
        age("BAPLIE"),
        age("VESSEL_ATB"),
        len(known),
        int(any(name == "CUSTOMS_DEL" for name, _ in known)),
        int(any(name == "JOB_DEL" for name, _ in known)),
        (observed - max(end for _, end in known)).total_seconds() / 3600 if known else float("nan"),
    ]
