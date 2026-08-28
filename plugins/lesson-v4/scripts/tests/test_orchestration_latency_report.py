from __future__ import annotations

import importlib.util
import json
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "build-orchestration-latency-report.py"
SPEC = importlib.util.spec_from_file_location("orchestration_latency_report", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def job(**overrides):
    value = {
        "jobId": "job-a",
        "kind": "worker",
        "executionClass": "worker",
        "capacityClass": "general",
        "state": "closed",
        "attemptCount": 1,
        "waitReason": "closed",
        "waitDetails": [],
        "registeredAt": 10,
        "firstReadyAt": 20,
        "readyAt": 20,
        "claimedAt": 25,
        "startedAt": 27,
        "lastProgressAt": 35,
        "closedAt": 40,
        "attemptHistory": [],
    }
    value.update(overrides)
    return value


def test_completed_job_durations_are_exact():
    state = {"schemaVersion": 1, "jobs": {"job-a": job()}, "slotSnapshots": []}
    report = MODULE.build_report(state, 100)
    row = report["jobs"][0]
    assert row["registeredToFirstReadySeconds"] == 10
    assert row["readyToClaimSeconds"] == 5
    assert row["claimToStartSeconds"] == 2
    assert row["activeSeconds"] == 13
    assert row["totalSeconds"] == 30


def test_active_job_uses_supplied_now_without_closing_it():
    active = job(state="running", closedAt=None, startedAt=27)
    state = {"schemaVersion": 1, "jobs": {"job-a": active}, "slotSnapshots": []}
    report = MODULE.build_report(state, 50)
    row = report["jobs"][0]
    assert row["activeSeconds"] == 23
    assert row["totalSeconds"] == 40
    assert report["activeJobIds"] == ["job-a"]


def test_missing_legacy_timestamps_remain_null(tmp_path):
    state_path = tmp_path / "orchestration-controller.json"
    state_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "jobs": {
                    "job-a": job(
                        registeredAt=None,
                        firstReadyAt=None,
                        readyAt=None,
                        claimedAt=None,
                        startedAt=None,
                        closedAt=None,
                    )
                },
            }
        ),
        encoding="utf-8",
    )
    state = MODULE.load_state(state_path)
    row = MODULE.build_report(state, 50)["jobs"][0]
    assert row["registeredToFirstReadySeconds"] is None
    assert row["readyToClaimSeconds"] is None
    assert row["claimToStartSeconds"] is None
    assert row["activeSeconds"] is None
    assert row["totalSeconds"] is None


def test_two_attempt_aggregates_include_every_attempt():
    history = [
        {
            "logicalAttemptId": "test-worker-job-a-1",
            "attemptNumber": 1,
            "outcome": "stalled",
            "readyAt": 20,
            "claimedAt": 25,
            "startedAt": 27,
            "lastProgressAt": 30,
            "endedAt": 32,
            "at": 32,
        },
        {
            "logicalAttemptId": "test-worker-job-a-2",
            "attemptNumber": 2,
            "outcome": "accepted",
            "readyAt": 37,
            "claimedAt": 40,
            "startedAt": 42,
            "lastProgressAt": 55,
            "endedAt": 60,
            "at": 60,
        },
    ]
    state = {
        "schemaVersion": 1,
        "jobs": {"job-a": job(attemptCount=2, attemptHistory=history)},
        "slotSnapshots": [],
    }
    row = MODULE.build_report(state, 100)["jobs"][0]
    assert row["retryCount"] == 1
    assert row["allAttemptsQueueSeconds"] == (25 - 20) + (40 - 37)
    assert row["allAttemptsLaunchSeconds"] == (27 - 25) + (42 - 40)
    assert row["allAttemptsActiveSeconds"] == (32 - 27) + (60 - 42)

    # Incomplete timestamps return null instead of inventing timings.
    first = dict(history[0])
    first["claimedAt"] = None
    state = {
        "schemaVersion": 1,
        "jobs": {"job-a": job(attemptCount=2, attemptHistory=[first, history[1]])},
        "slotSnapshots": [],
    }
    row = MODULE.build_report(state, 100)["jobs"][0]
    assert row["allAttemptsQueueSeconds"] is None
    assert row["allAttemptsLaunchSeconds"] is None
    assert row["allAttemptsActiveSeconds"] == (32 - 27) + (60 - 42)
