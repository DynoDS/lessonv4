#!/usr/bin/env python3
"""Build a deterministic timing and queue report from controller state."""
from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path


def load_state(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schemaVersion") != 1 or not isinstance(data.get("jobs"), dict):
        raise ValueError("controller state must have schemaVersion 1 and jobs object")
    if not isinstance(data.get("slotSnapshots", []), list):
        raise ValueError("controller state slotSnapshots must be an array")
    return data


def duration(start, end):
    if not isinstance(start, (int, float)) or not isinstance(end, (int, float)):
        return None
    return max(0.0, end - start)


def terminal_time(job: dict, now: float):
    for field in ("closedAt", "invalidatedAt"):
        value = job.get(field)
        if isinstance(value, (int, float)):
            return value
    return now if job.get("state") not in {"closed", "failed", "invalidated"} else None


def attempt_aggregates(history: list) -> dict:
    def total(start_key: str, end_key: str):
        if not history:
            return None
        value = 0.0
        for record in history:
            start = record.get(start_key)
            end = record.get(end_key)
            if not isinstance(start, (int, float)) or not isinstance(end, (int, float)):
                return None
            value += max(0.0, end - start)
        return value

    retry_count = sum(
        1
        for record in history
        if isinstance(record, dict) and record.get("outcome") != "accepted"
    )
    return {
        "retryCount": retry_count,
        "allAttemptsQueueSeconds": total("readyAt", "claimedAt"),
        "allAttemptsLaunchSeconds": total("claimedAt", "startedAt"),
        "allAttemptsActiveSeconds": total("startedAt", "endedAt"),
    }


def job_row(job: dict, now: float) -> dict:
    end = terminal_time(job, now)
    history = job.get("attemptHistory", [])
    if not isinstance(history, list):
        history = []
    row = {
        "jobId": job["jobId"],
        "kind": job["kind"],
        "executionClass": job["executionClass"],
        "capacityClass": job["capacityClass"],
        "state": job["state"],
        "attemptCount": job.get("attemptCount", 0),
        "waitReason": job.get("waitReason"),
        "waitDetails": job.get("waitDetails", []),
        "registeredAt": job.get("registeredAt"),
        "firstReadyAt": job.get("firstReadyAt"),
        "readyAt": job.get("readyAt"),
        "claimedAt": job.get("claimedAt"),
        "startedAt": job.get("startedAt"),
        "lastProgressAt": job.get("lastProgressAt"),
        "closedAt": job.get("closedAt"),
        "registeredToFirstReadySeconds": duration(
            job.get("registeredAt"), job.get("firstReadyAt")
        ),
        "readyToClaimSeconds": duration(job.get("readyAt"), job.get("claimedAt")),
        "claimToStartSeconds": duration(job.get("claimedAt"), job.get("startedAt")),
        "activeSeconds": duration(job.get("startedAt"), end),
        "totalSeconds": duration(job.get("registeredAt"), end),
        "attemptHistory": history,
    }
    row.update(attempt_aggregates(history))
    return row


def build_report(state: dict, now: float) -> dict:
    rows = [job_row(state["jobs"][job_id], now) for job_id in sorted(state["jobs"])]
    active = [row["jobId"] for row in rows if row["state"] not in {"closed", "failed", "invalidated"}]
    return {
        "schemaVersion": 1,
        "generatedAt": now,
        "jobs": rows,
        "slotSnapshots": state.get("slotSnapshots", []),
        "activeJobIds": active,
    }


def atomic_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=str(path.parent), delete=False, suffix=".part"
    )
    try:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
        handle.close()
        os.replace(handle.name, path)
    except BaseException:
        handle.close()
        if os.path.exists(handle.name):
            os.remove(handle.name)
        raise


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--working-dir", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--now", type=float, required=True)
    args = parser.parse_args(argv)

    working = Path(args.working_dir).resolve()
    output = Path(args.output).resolve()
    state = load_state(working / "orchestration-controller.json")
    atomic_write(output, build_report(state, args.now))
    print(f"ORCHESTRATION_LATENCY_REPORT_OK {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
