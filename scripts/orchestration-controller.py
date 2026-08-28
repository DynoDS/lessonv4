#!/usr/bin/env python3
"""Deterministic run-local scheduler for lesson-resources.

The model orchestrator is the host adapter: it registers jobs, executes the
typed actions this controller releases, reports terminal results, and launches
the named semantic agents. This script owns dependency readiness, write locks,
source-fingerprint invalidation, picture concurrency caps, retry backoff,
watchdog state, command-result binding, dependency-failure propagation, and
final audit.

State:
    [WORKING_DIR]/orchestration-controller.json

The controller never makes a pedagogical or visual judgement.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SCHEMA_VERSION = 1
STATE_FILE = "orchestration-controller.json"
BACKOFF_SECONDS = (5, 15, 40)
WATCHDOG_SECONDS = 600
CLAIM_START_TIMEOUT_SECONDS = 120
COMMAND_TIMEOUT_SECONDS = 900
TRANSITION_STEP_TIMEOUT_SECONDS = 120
SLOT_SNAPSHOT_LIMIT = 10000
PICTURE_TOTAL_CAP = 3
PICTURE_AI_CAP = 2
VALID_EXECUTION = {"worker", "command"}
VALID_CAPACITY = {"general", "picture-real", "picture-ai", "none"}
TERMINAL_STATES = {"closed", "failed", "invalidated"}
RETRY_FAILURES = {"transient", "stalled"}
_ATTEMPT_TEMPLATE_RE = re.compile(r"\{([^{}]+)\}")
_ALLOWED_ATTEMPT_TOKENS = {"attemptNumber", "logicalAttemptId"}
TRANSITION_RECEIPT_DIR = "orchestration-transition-receipts"


class ControllerError(ValueError):
    pass


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=str(path.parent), delete=False, suffix=".part"
    )
    try:
        json.dump(payload, handle, indent=2, sort_keys=False)
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


def state_path(working_dir: Path) -> Path:
    return working_dir / STATE_FILE


def fresh_state() -> dict:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "nextReadySequence": 1,
        "jobs": {},
        "signals": {},
        "frictionEvents": [],
        "slotSnapshots": [],
    }


def load_state(working_dir: Path) -> dict:
    path = state_path(working_dir)
    if not path.exists():
        return fresh_state()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ControllerError(f"controller state is unreadable: {exc}") from exc
    if data.get("schemaVersion") != SCHEMA_VERSION:
        raise ControllerError("controller state schemaVersion must be 1")
    if not isinstance(data.get("jobs"), dict):
        raise ControllerError("controller state jobs must be an object")
    if not isinstance(data.get("signals", {}), dict):
        raise ControllerError("controller state signals must be an object")
    if not isinstance(data.get("frictionEvents", []), list):
        raise ControllerError("controller state frictionEvents must be an array")
    if not isinstance(data.get("slotSnapshots", []), list):
        raise ControllerError("controller state slotSnapshots must be an array")
    data.setdefault("signals", {})
    data.setdefault("frictionEvents", [])
    data.setdefault("slotSnapshots", [])
    for job in data["jobs"].values():
        job.setdefault("registeredAt", None)
        job.setdefault("firstReadyAt", None)
        job.setdefault("readyAt", None)
        job.setdefault("waitReason", None)
        job.setdefault("waitDetails", [])
        if job.get("executionClass") == "command":
            job.setdefault("timeoutSeconds", COMMAND_TIMEOUT_SECONDS)
        else:
            job.setdefault("timeoutSeconds", None)
        transition = job.get("transition")
        if isinstance(transition, dict):
            for step in transition.get("steps") or []:
                if isinstance(step, dict):
                    step.setdefault("timeoutSeconds", TRANSITION_STEP_TIMEOUT_SECONDS)
    return data


def save_state(working_dir: Path, state: dict) -> None:
    atomic_write_json(state_path(working_dir), state)


def load_json(path_text: str, label: str) -> dict:
    path = Path(path_text)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ControllerError(f"{label} is unreadable JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ControllerError(f"{label} root must be an object")
    return data


def capture_sources(values) -> list[dict]:
    if values is None:
        return []
    if not isinstance(values, list):
        raise ControllerError("sourcePaths must be an array")
    result = []
    for index, value in enumerate(values):
        if not isinstance(value, str) or not Path(value).is_absolute():
            raise ControllerError(f"sourcePaths[{index}] must be an absolute path")
        path = Path(value)
        if not path.is_file():
            raise ControllerError(f"sourcePaths[{index}] does not exist: {value}")
        result.append({"path": value, "sha256": sha256_file(path)})
    if len({item["path"] for item in result}) != len(result):
        raise ControllerError("sourcePaths contains a duplicate")
    return result


def normalise_paths(values, label: str) -> list[str]:
    if values is None:
        return []
    if not isinstance(values, list):
        raise ControllerError(f"{label} must be an array")
    result = []
    for index, value in enumerate(values):
        if not isinstance(value, str) or not Path(value).is_absolute():
            raise ControllerError(f"{label}[{index}] must be an absolute path")
        result.append(value)
    if len(set(result)) != len(result):
        raise ControllerError(f"{label} contains a duplicate")
    return result


def normalise_attempt_paths(values, label: str) -> list[str]:
    paths = normalise_paths(values, label)
    for index, value in enumerate(paths):
        tokens = _ATTEMPT_TEMPLATE_RE.findall(value)
        unsupported = sorted(set(tokens) - _ALLOWED_ATTEMPT_TOKENS)
        if unsupported:
            raise ControllerError(
                f"{label}[{index}] contains unsupported attempt token: "
                + ", ".join(f"{{{token}}}" for token in unsupported)
            )
        remainder = _ATTEMPT_TEMPLATE_RE.sub("", value)
        if "{" in remainder or "}" in remainder:
            raise ControllerError(f"{label}[{index}] contains a malformed attempt token")
    return paths


def resolve_attempt_path(value: str, attempt_number: int, attempt_id: str) -> str:
    replacements = {
        "attemptNumber": str(attempt_number),
        "logicalAttemptId": attempt_id,
    }
    return _ATTEMPT_TEMPLATE_RE.sub(
        lambda match: replacements[match.group(1)],
        value,
    )


def normalise_strings(values, label: str) -> list[str]:
    if values is None:
        return []
    if not isinstance(values, list) or any(
        not isinstance(value, str) or not value for value in values
    ):
        raise ControllerError(f"{label} must be an array of non-empty strings")
    if len(set(values)) != len(values):
        raise ControllerError(f"{label} contains a duplicate")
    return list(values)


def normalise_friction(values) -> list[str]:
    if values is None:
        return []
    if not isinstance(values, list):
        raise ControllerError("completion event friction must be an array")

    result: list[str] = []
    for index, value in enumerate(values):
        if not isinstance(value, str) or not value:
            raise ControllerError(
                f"completion event friction[{index}] must be a non-empty string"
            )
        if "\n" in value or "\r" in value:
            raise ControllerError(
                f"completion event friction[{index}] must be one line"
            )
        if not value.startswith("Friction:") or not value[len("Friction:"):].strip():
            raise ControllerError(
                f"completion event friction[{index}] must start with 'Friction:' and contain text"
            )
        result.append(value)

    if len(set(result)) != len(result):
        raise ControllerError("completion event friction contains a duplicate")

    return result


_SUMMARY_RE = re.compile(
    r'(?:^|\s)--summary-output(?:\s+)"([^"]+)"|(?:^|\s)--summary-output(?:\s+)([^\s]+)'
)


def command_result_path(command) -> str:
    if not isinstance(command, str) or not command.strip():
        raise ControllerError("command job requires a non-empty command string")
    match = _SUMMARY_RE.search(command)
    if not match:
        raise ControllerError("command job must name its result with --summary-output")
    value = match.group(1) or match.group(2)
    if not Path(value).is_absolute():
        raise ControllerError("command --summary-output path must be absolute")
    return value


def normalise_timeout(value, default: int, label: str) -> int:
    if value is None:
        return default
    if not isinstance(value, int) or isinstance(value, bool) or value < 1:
        raise ControllerError(f"{label} must be a positive integer")
    return value


def validate_transition(value) -> dict | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ControllerError("transition must be an object")
    if value.get("schemaVersion") != SCHEMA_VERSION:
        raise ControllerError("transition schemaVersion must be 1")

    operation = value.get("operation")
    if not isinstance(operation, str) or not operation:
        raise ControllerError("transition operation must be a non-empty string")

    steps = value.get("steps")
    if not isinstance(steps, list) or not steps:
        raise ControllerError("transition steps must be a non-empty array")

    normalised_steps = []
    for index, step in enumerate(steps):
        if not isinstance(step, dict):
            raise ControllerError(f"transition.steps[{index}] must be an object")
        name = step.get("name")
        script = step.get("script")
        arguments = step.get("arguments")
        marker = step.get("requiredMarker")
        timeout_seconds = normalise_timeout(
            step.get("timeoutSeconds"),
            TRANSITION_STEP_TIMEOUT_SECONDS,
            f"transition.steps[{index}].timeoutSeconds",
        )

        if not isinstance(name, str) or not name:
            raise ControllerError(
                f"transition.steps[{index}].name must be a non-empty string"
            )
        if not isinstance(script, str) or not Path(script).is_absolute():
            raise ControllerError(
                f"transition.steps[{index}].script must be an absolute path"
            )
        if not Path(script).is_file():
            raise ControllerError(
                f"transition.steps[{index}].script does not exist: {script}"
            )
        if not isinstance(arguments, list) or not all(
            isinstance(item, str) for item in arguments
        ):
            raise ControllerError(
                f"transition.steps[{index}].arguments must be an array of strings"
            )
        if marker is not None and (not isinstance(marker, str) or not marker):
            raise ControllerError(
                f"transition.steps[{index}].requiredMarker must be null or non-empty"
            )

        normalised_steps.append(
            {
                "name": name,
                "script": script,
                "arguments": list(arguments),
                "requiredMarker": marker,
                "timeoutSeconds": timeout_seconds,
            }
        )

    write_paths = normalise_paths(
        value.get("writePaths"),
        "transition.writePaths",
    )
    manifest_path = value.get("successorManifestPath")
    if not isinstance(manifest_path, str) or not Path(manifest_path).is_absolute():
        raise ControllerError(
            "transition.successorManifestPath must be an absolute path"
        )
    if manifest_path not in write_paths:
        raise ControllerError(
            "transition.successorManifestPath must occur in transition.writePaths"
        )

    return {
        "schemaVersion": SCHEMA_VERSION,
        "operation": operation,
        "steps": normalised_steps,
        "writePaths": write_paths,
        "successorManifestPath": manifest_path,
    }


def validate_job_spec(spec: dict) -> dict:
    if spec.get("schemaVersion") != SCHEMA_VERSION:
        raise ControllerError("job spec schemaVersion must be 1")
    job_id = spec.get("jobId")
    if not isinstance(job_id, str) or not job_id:
        raise ControllerError("jobId must be a non-empty string")
    kind = spec.get("kind")
    if not isinstance(kind, str) or not kind:
        raise ControllerError("kind must be a non-empty string")
    execution = spec.get("executionClass")
    if execution not in VALID_EXECUTION:
        raise ControllerError("executionClass must be worker or command")
    capacity = spec.get("capacityClass")
    if capacity not in VALID_CAPACITY:
        raise ControllerError(
            "capacityClass must be general, picture-real, picture-ai or none"
        )
    if execution == "command" and capacity != "none":
        raise ControllerError("command jobs must use capacityClass none")
    dependencies = normalise_strings(spec.get("dependencies"), "dependencies")
    sources = capture_sources(spec.get("sourcePaths"))
    write_paths = normalise_paths(spec.get("writePaths"), "writePaths")
    transition = validate_transition(spec.get("transition"))
    # Deterministic command jobs may own a transition. The transition command
    # still validates its summary before registering any successor.
    if transition is not None and not set(transition["writePaths"]).issubset(
        set(write_paths)
    ):
        raise ControllerError(
            "every transition.writePaths value must occur in the parent writePaths"
        )
    holds = normalise_strings(spec.get("holdsBarriers"), "holdsBarriers")
    clear = normalise_strings(spec.get("requiresClearBarriers"), "requiresClearBarriers")
    max_attempts = spec.get("maxAttempts", 1 if execution == "command" else 4)
    if not isinstance(max_attempts, int) or isinstance(max_attempts, bool) or max_attempts < 1:
        raise ControllerError("maxAttempts must be a positive integer")
    timeout_seconds = None
    if execution == "command":
        timeout_seconds = normalise_timeout(
            spec.get("timeoutSeconds"),
            COMMAND_TIMEOUT_SECONDS,
            "timeoutSeconds",
        )
    elif spec.get("timeoutSeconds") is not None:
        raise ControllerError("worker job must not contain timeoutSeconds")

    attempt = spec.get("attempt")
    command = spec.get("command")
    result_path = None
    if execution == "worker":
        if not isinstance(attempt, dict):
            raise ControllerError("worker job requires attempt object")
        for field in ("role", "identity"):
            if not isinstance(attempt.get(field), str) or not attempt[field]:
                raise ControllerError(f"attempt.{field} must be a non-empty string")
        expected = normalise_attempt_paths(
            attempt.get("expectedOutputs"),
            "attempt.expectedOutputs",
        )
        states = normalise_strings(
            attempt.get("allowedDeclaredStates"), "attempt.allowedDeclaredStates"
        )
        by_state = attempt.get("outputsByDeclaredState")
        if not isinstance(by_state, dict) or set(by_state) != set(states):
            raise ControllerError(
                "attempt.outputsByDeclaredState keys must equal allowedDeclaredStates"
            )
        for state, paths in by_state.items():
            subset = normalise_attempt_paths(
                paths,
                f"attempt.outputsByDeclaredState[{state!r}]",
            )
            if not subset:
                raise ControllerError(
                    f"attempt.outputsByDeclaredState[{state!r}] must not be empty"
                )
            if not set(subset).issubset(set(expected)):
                raise ControllerError(
                    f"attempt.outputsByDeclaredState[{state!r}] names unknown output"
                )
        inputs = attempt.get("inputs") or []
        if not isinstance(inputs, list):
            raise ControllerError("attempt.inputs must be an array")
        for index, entry in enumerate(inputs):
            if not isinstance(entry, dict):
                raise ControllerError(f"attempt.inputs[{index}] must be an object")
            source = entry.get("sourcePath")
            if not isinstance(source, str) or not Path(source).is_absolute():
                raise ControllerError(
                    f"attempt.inputs[{index}].sourcePath must be absolute"
                )
            if entry.get("mode") not in {"read-only", "read-write"}:
                raise ControllerError(
                    f"attempt.inputs[{index}].mode must be read-only or read-write"
                )
        checks = attempt.get("checks") or []
        if not isinstance(checks, list):
            raise ControllerError("attempt.checks must be an array")
        if command is not None:
            raise ControllerError("worker job must not contain command")
    else:
        if attempt is not None:
            raise ControllerError("command job must not contain attempt")
        result_path = command_result_path(command)
        if result_path not in write_paths:
            raise ControllerError(
                "command --summary-output path must also occur in writePaths"
            )

    return {
        "jobId": job_id,
        "kind": kind,
        "executionClass": execution,
        "capacityClass": capacity,
        "dependencies": dependencies,
        "sourcePaths": [item["path"] for item in sources],
        "sourceFingerprints": sources,
        "writePaths": write_paths,
        "holdsBarriers": holds,
        "requiresClearBarriers": clear,
        "maxAttempts": max_attempts,
        "attempt": attempt,
        "transition": transition,
        "command": command,
        "resultPath": result_path,
        "timeoutSeconds": timeout_seconds,
    }


def sources_match(job: dict) -> bool:
    for source in job["sourceFingerprints"]:
        path = Path(source["path"])
        if not path.is_file():
            return False
        if sha256_file(path) != source["sha256"]:
            return False
    return True


def active_jobs(state: dict) -> list[dict]:
    return [
        job
        for job in state["jobs"].values()
        if job["state"] in {"claimed", "running"}
    ]


def retry_reserved(job: dict) -> bool:
    return (
        job["state"] == "blocked"
        and job.get("attemptCount", 0) > 0
        and job.get("failure") in RETRY_FAILURES
    )


def reservation_jobs(state: dict) -> list[dict]:
    return [
        job
        for job in state["jobs"].values()
        if job["state"] in {"claimed", "running"} or retry_reserved(job)
    ]


def held_write_paths(state: dict, *, excluding: str | None = None) -> set[str]:
    result: set[str] = set()
    for job in reservation_jobs(state):
        if job["jobId"] == excluding:
            continue
        result.update(job["writePaths"])
    return result


def held_barriers(state: dict, *, excluding: str | None = None) -> set[str]:
    result: set[str] = set()
    for job in reservation_jobs(state):
        if job["jobId"] == excluding:
            continue
        result.update(job["holdsBarriers"])
    return result


def dependency_satisfied(state: dict, dependency: str) -> bool:
    parent = state["jobs"].get(dependency)
    if parent is not None:
        return parent["state"] == "closed"
    return state["signals"].get(dependency) == "satisfied"


def dependency_terminal_problem(state: dict, dependency: str) -> tuple[str, str] | None:
    parent = state["jobs"].get(dependency)
    if parent is not None:
        if parent["state"] == "failed":
            return ("failed", dependency)
        if parent["state"] == "invalidated":
            return ("invalidated", dependency)
        return None
    if state["signals"].get(dependency) == "failed":
        return ("failed", dependency)
    return None


def dependencies_satisfied(state: dict, job: dict) -> bool:
    return all(dependency_satisfied(state, dependency) for dependency in job["dependencies"])


def propagate_terminal_dependencies(state: dict, now: float) -> bool:
    changed = False
    for job in state["jobs"].values():
        if job["state"] in TERMINAL_STATES or job["state"] in {"claimed", "running"}:
            continue
        problem = next(
            (
                dependency_terminal_problem(state, dependency)
                for dependency in job["dependencies"]
                if dependency_terminal_problem(state, dependency) is not None
            ),
            None,
        )
        if problem is None:
            continue
        outcome, dependency = problem
        if outcome == "invalidated":
            job["state"] = "invalidated"
            job["invalidatedAt"] = now
            job["closedAt"] = now
            job["failure"] = f"dependency_invalidated:{dependency}"
            job["waitReason"] = "dependency-invalidated"
        else:
            job["state"] = "failed"
            job["failure"] = f"dependency_failed:{dependency}"
            job["closedAt"] = now
            job["waitReason"] = "dependency-failed"
        job["waitDetails"] = [dependency]
        job["hostId"] = None
        changed = True
    return changed


def readiness_blocker(state: dict, job: dict, now: float) -> tuple[str | None, list[str]]:
    missing_dependencies = [
        dependency
        for dependency in job["dependencies"]
        if not dependency_satisfied(state, dependency)
    ]
    if missing_dependencies:
        return "dependency", missing_dependencies

    locked = held_write_paths(state, excluding=job["jobId"])
    locked_paths = sorted(set(job["writePaths"]) & locked)
    if locked_paths:
        return "write-lock", locked_paths

    barriers = held_barriers(state, excluding=job["jobId"])
    blocked_barriers = sorted(set(job["requiresClearBarriers"]) & barriers)
    if blocked_barriers:
        return "barrier", blocked_barriers

    if now < job.get("notBefore", 0):
        return "backoff", [str(job["notBefore"])]

    return None, []


def refresh(state: dict, now: float) -> None:
    # Propagate terminal dependency state to a fixed point so a failed branch
    # never leaves grandchildren blocked forever.
    while propagate_terminal_dependencies(state, now):
        pass

    for job in state["jobs"].values():
        if job["state"] in TERMINAL_STATES | {"claimed", "running"}:
            continue
        if not sources_match(job):
            job["state"] = "invalidated"
            job["invalidatedAt"] = now
            job["closedAt"] = now
            job["failure"] = "source_changed_before_launch"
            job["waitReason"] = "source-invalidated"
            job["waitDetails"] = []
            continue

        reason, details = readiness_blocker(state, job, now)
        if reason is None:
            if job["state"] != "ready":
                job["state"] = "ready"
                job["readyAt"] = now
                if job.get("firstReadyAt") is None:
                    job["firstReadyAt"] = now
                if job.get("readySequence") is None:
                    job["readySequence"] = state["nextReadySequence"]
                    state["nextReadySequence"] += 1
            job["waitReason"] = "ready"
            job["waitDetails"] = []
        else:
            job["state"] = "blocked"
            job["waitReason"] = reason
            job["waitDetails"] = details

    # A source invalidation may have created a newly terminal dependency.
    while propagate_terminal_dependencies(state, now):
        pass


def blocking_power(state: dict, candidate: dict) -> int:
    count = 0
    for job in state["jobs"].values():
        if job["state"] not in {"blocked", "ready"}:
            continue
        unsatisfied = [
            dep for dep in job["dependencies"] if not dependency_satisfied(state, dep)
        ]
        if unsatisfied == [candidate["jobId"]]:
            count += 1
    return count


def priority_key(state: dict, job: dict):
    return (
        -blocking_power(state, job),
        job.get("readySequence") or 10**18,
        job["jobId"],
    )


def picture_capacity_allows(state: dict, job: dict) -> bool:
    if job["executionClass"] != "worker":
        return True
    capacity = job["capacityClass"]
    if capacity not in {"picture-real", "picture-ai"}:
        return True
    active = active_jobs(state)
    picture_total = sum(
        item["capacityClass"] in {"picture-real", "picture-ai"} for item in active
    )
    picture_ai = sum(item["capacityClass"] == "picture-ai" for item in active)
    if picture_total >= PICTURE_TOTAL_CAP:
        return False
    if capacity == "picture-ai" and picture_ai >= PICTURE_AI_CAP:
        return False
    return True


def logical_attempt_id(job: dict, attempt_number: int) -> str:
    role = job["attempt"]["role"]
    purpose = job["jobId"]

    def norm(value: str) -> str:
        chars = []
        dash = False
        for ch in value.lower():
            if ("a" <= ch <= "z") or ("0" <= ch <= "9"):
                chars.append(ch)
                dash = False
            elif not dash:
                chars.append("-")
                dash = True
        return "".join(chars).strip("-") or "job"

    return f"{norm(role)}-{norm(purpose)}-{attempt_number}"


def run_attempt_start(working_dir: Path, job: dict, attempt_number: int) -> str:
    attempt = job["attempt"]
    attempt_id = logical_attempt_id(job, attempt_number)
    resolved_expected = [
        resolve_attempt_path(path, attempt_number, attempt_id)
        for path in attempt["expectedOutputs"]
    ]
    resolved_by_state = {
        state: [
            resolve_attempt_path(path, attempt_number, attempt_id)
            for path in paths
        ]
        for state, paths in attempt["outputsByDeclaredState"].items()
    }
    request_dir = working_dir / "orchestration-requests"
    request_dir.mkdir(parents=True, exist_ok=True)
    spec_path = request_dir / f"{attempt_id}.start.json"
    payload = {
        "schemaVersion": 1,
        "logicalAttemptId": attempt_id,
        "attemptNumber": attempt_number,
        "assignment": {
            "role": attempt["role"],
            "identity": attempt["identity"],
            "expectedOutputs": resolved_expected,
            "allowedDeclaredStates": attempt["allowedDeclaredStates"],
            "outputsByDeclaredState": resolved_by_state,
        },
        "inputs": attempt.get("inputs") or [],
        "checks": attempt.get("checks") or [],
    }
    atomic_write_json(spec_path, payload)
    script = Path(__file__).resolve().parent / "orchestration-attempt.py"
    completed = subprocess.run(
        [
            sys.executable,
            str(script),
            "start",
            "--working-dir",
            str(working_dir),
            "--spec",
            str(spec_path),
        ],
        capture_output=True,
        text=True,
    )
    marker = f"ORCHESTRATION_ATTEMPT_STARTED {attempt_id}"
    if completed.returncode != 0 or marker not in completed.stdout:
        raise ControllerError(
            "attempt start failed: "
            + (completed.stderr.strip() or completed.stdout.strip() or "unknown error")
        )
    return attempt_id


def record_worker_attempt(job: dict, outcome: str, now: float) -> None:
    if job["executionClass"] != "worker":
        return
    attempt_id = job.get("logicalAttemptId")
    if not attempt_id:
        return
    job.setdefault("attemptHistory", []).append(
        {
            "logicalAttemptId": attempt_id,
            "attemptNumber": job["attemptCount"],
            "outcome": outcome,
            "readyAt": job.get("readyAt"),
            "claimedAt": job.get("claimedAt"),
            "startedAt": job.get("startedAt"),
            "lastProgressAt": job.get("lastProgressAt"),
            "endedAt": now,
            "at": now,
        }
    )


def archive_unaccepted_attempt(
    working_dir: Path, job: dict, failure_kind: str, now: float
) -> None:
    attempt_id = job.get("logicalAttemptId")
    if job["executionClass"] != "worker" or not attempt_id:
        return

    receipt = working_dir / "orchestration-receipts" / f"{attempt_id}.json"
    if receipt.exists():
        raise ControllerError(
            f"cannot retire accepted worker attempt with receipt: {attempt_id}"
        )

    record_worker_attempt(job, failure_kind, now)

    archive = working_dir / "orchestration-failed-attempts" / attempt_id
    if archive.exists():
        raise ControllerError(f"failed-attempt archive already exists: {attempt_id}")
    archive.mkdir(parents=True, exist_ok=False)
    atomic_write_json(
        archive / "outcome.json",
        {
            "schemaVersion": 1,
            "logicalAttemptId": attempt_id,
            "attemptNumber": job["attemptCount"],
            "outcome": failure_kind,
            "at": now,
        },
    )

    contract = working_dir / "orchestration-contracts" / f"{attempt_id}.json"
    if contract.exists():
        shutil.move(str(contract), str(archive / "contract.json"))

    snapshot = working_dir / "orchestration-snapshots" / attempt_id
    if snapshot.exists():
        shutil.move(str(snapshot), str(archive / "snapshot"))

    request = working_dir / "orchestration-requests" / f"{attempt_id}.start.json"
    if request.exists():
        shutil.move(str(request), str(archive / "start.json"))


def claim_job(state: dict, working_dir: Path, job: dict, now: float) -> dict:
    job["attemptCount"] += 1
    if job["attemptCount"] > job["maxAttempts"]:
        raise ControllerError(f"{job['jobId']} exceeded maxAttempts")
    attempt_id = None
    if job["executionClass"] == "worker":
        attempt_id = run_attempt_start(working_dir, job, job["attemptCount"])
    job["state"] = "claimed"
    job["claimedAt"] = now
    job["startedAt"] = None
    job["lastProgressAt"] = None
    job["inspectedAt"] = None
    job["hostId"] = None
    job["logicalAttemptId"] = attempt_id
    job["commandResult"] = None
    job["failure"] = None
    job["waitReason"] = "claimed"
    job["waitDetails"] = []
    return {
        "action": "spawn-worker" if job["executionClass"] == "worker" else "run-command",
        "jobId": job["jobId"],
        "kind": job["kind"],
        "logicalAttemptId": attempt_id,
        "attemptRequestPath": (
            str(
                working_dir
                / "orchestration-requests"
                / f"{attempt_id}.start.json"
            )
            if attempt_id
            else None
        ),
        "specPath": job.get("specPath"),
        "command": job.get("command") if job["executionClass"] == "command" else None,
        "timeoutSeconds": job.get("timeoutSeconds"),
        "startDeadline": (
            now + CLAIM_START_TIMEOUT_SECONDS
            if job["executionClass"] == "worker"
            else None
        ),
    }


def register_job(state: dict, spec: dict, spec_path: str | Path, now: float) -> None:
    if spec["jobId"] in state["jobs"]:
        raise ControllerError(f"job already registered: {spec['jobId']}")
    state["jobs"][spec["jobId"]] = {
        **spec,
        "specPath": str(Path(spec_path).resolve()),
        "state": "blocked",
        "registeredAt": now,
        "firstReadyAt": None,
        "readyAt": None,
        "waitReason": "registered",
        "waitDetails": [],
        "readySequence": None,
        "attemptCount": 0,
        "attemptHistory": [],
        "notBefore": 0,
        "claimedAt": None,
        "startedAt": None,
        "lastProgressAt": None,
        "inspectedAt": None,
        "hostId": None,
        "logicalAttemptId": None,
        "closedAt": None,
        "failure": None,
        "commandResult": None,
        "transitionResult": None,
    }


def record_slot_snapshot(state: dict, worker_slots: int, now: float) -> None:
    snapshot = {
        "at": now,
        "reportedFreeWorkerSlots": worker_slots,
        "readyWorkerJobIds": sorted(
            job["jobId"]
            for job in state["jobs"].values()
            if job["executionClass"] == "worker" and job["state"] == "ready"
        ),
        "claimedWorkerJobIds": sorted(
            job["jobId"]
            for job in state["jobs"].values()
            if job["executionClass"] == "worker" and job["state"] == "claimed"
        ),
        "runningWorkerJobIds": sorted(
            job["jobId"]
            for job in state["jobs"].values()
            if job["executionClass"] == "worker" and job["state"] == "running"
        ),
    }
    snapshots = state.setdefault("slotSnapshots", [])
    snapshots.append(snapshot)
    if len(snapshots) > SLOT_SNAPSHOT_LIMIT:
        del snapshots[:-SLOT_SNAPSHOT_LIMIT]


def release_actions(
    state: dict,
    working_dir: Path,
    worker_slots: int,
    now: float,
) -> list[dict]:
    refresh(state, now)
    record_slot_snapshot(state, worker_slots, now)
    actions: list[dict] = []

    def ready(execution: str) -> list[dict]:
        return sorted(
            [
                job
                for job in state["jobs"].values()
                if job["state"] == "ready"
                and job["executionClass"] == execution
                and picture_capacity_allows(state, job)
            ],
            key=lambda item: priority_key(state, item),
        )

    # Commands are short deterministic work and consume no model-worker place.
    while True:
        candidates = ready("command")
        if not candidates:
            break
        actions.append(claim_job(state, working_dir, candidates[0], now))
        refresh(state, now)

    slots = worker_slots
    while slots > 0:
        candidates = ready("worker")
        if not candidates:
            break
        actions.append(claim_job(state, working_dir, candidates[0], now))
        slots -= 1
        refresh(state, now)

    return actions


def wait_payload(state: dict, actions: list[dict], now: float) -> dict | None:
    if actions:
        return None

    running_host_ids = sorted(
        job["hostId"]
        for job in state["jobs"].values()
        if job["state"] == "running"
        and job["executionClass"] == "worker"
        and job.get("hostId")
    )
    running_deadlines = [
        (job.get("lastProgressAt") or job.get("startedAt")) + WATCHDOG_SECONDS
        for job in state["jobs"].values()
        if job["state"] == "running"
        and job["executionClass"] == "worker"
        and (job.get("lastProgressAt") is not None or job.get("startedAt") is not None)
    ]
    claimed_deadlines = [
        job["claimedAt"] + CLAIM_START_TIMEOUT_SECONDS
        for job in state["jobs"].values()
        if job["state"] == "claimed"
        and job["executionClass"] == "worker"
        and job.get("claimedAt") is not None
    ]
    deadlines = running_deadlines + claimed_deadlines
    if not deadlines:
        return None

    next_deadline = min(deadlines)
    wake_reason = (
        "worker-start-deadline"
        if claimed_deadlines and min(claimed_deadlines) == next_deadline
        else "worker-progress-deadline"
    )
    return {
        "hostIds": running_host_ids,
        "timeoutSeconds": max(1, int(next_deadline - now)),
        "wakeReason": wake_reason,
    }


def complete_active_job(
    state: dict,
    working_dir: Path,
    event: dict,
    now: float,
    allow_transition: bool = False,
) -> dict:
    job_id = event.get("jobId")
    if not isinstance(job_id, str):
        raise ControllerError("completion event jobId must be a string")
    job = get_job(state, job_id)
    if job["state"] not in {"claimed", "running"}:
        raise ControllerError(f"{job_id} is not active")
    if job.get("transition") is not None and not allow_transition:
        raise ControllerError(
            f"{job_id} has a registered transition; use the transition command"
        )

    if not sources_match(job):
        if job["executionClass"] == "worker":
            archive_unaccepted_attempt(
                working_dir,
                job,
                "source_changed_before_completion",
                now,
            )
        job["state"] = "invalidated"
        job["failure"] = "source_changed_before_completion"
        job["closedAt"] = now
        job["waitReason"] = "source-invalidated"
        job["waitDetails"] = []
        job["hostId"] = None
        job["logicalAttemptId"] = None
        refresh(state, now)
        return job

    if job["executionClass"] == "worker":
        friction = normalise_friction(event.get("friction"))
        run_attempt_close(working_dir, job, event)
        record_worker_attempt(job, "accepted", now)
        for line in friction:
            state["frictionEvents"].append(
                {
                    "jobId": job_id,
                    "agent": job["attempt"]["role"],
                    "line": line,
                }
            )
    else:
        job["commandResult"] = validate_command_result(working_dir, job, event)

    job["state"] = "closed"
    job["closedAt"] = now
    job["hostId"] = None
    job["failure"] = None
    job["waitReason"] = "closed"
    job["waitDetails"] = []
    refresh(state, now)
    return job


def run_transition_steps(working_dir: Path, transition: dict) -> list[dict]:
    receipts = []
    for step in transition["steps"]:
        command = [
            sys.executable,
            step["script"],
            *step["arguments"],
        ]
        try:
            completed = subprocess.run(
                command,
                cwd=str(working_dir),
                capture_output=True,
                text=True,
                timeout=step["timeoutSeconds"],
            )
        except subprocess.TimeoutExpired as exc:
            raise ControllerError(
                f"transition step {step['name']} exceeded "
                f"{step['timeoutSeconds']} seconds"
            ) from exc
        except OSError as exc:
            raise ControllerError(
                f"transition step {step['name']} could not run: {exc}"
            ) from exc

        if completed.returncode != 0:
            detail = completed.stderr.strip() or completed.stdout.strip()
            suffix = f": {detail}" if detail else ""
            raise ControllerError(
                f"transition step {step['name']} exited "
                f"{completed.returncode}{suffix}"
            )
        marker = step["requiredMarker"]
        if marker is not None and marker not in completed.stdout:
            raise ControllerError(
                f"transition step {step['name']} did not print required marker: "
                f"{marker}"
            )

        receipts.append(
            {
                "name": step["name"],
                "script": step["script"],
                "arguments": list(step["arguments"]),
                "requiredMarker": marker,
                "timeoutSeconds": step["timeoutSeconds"],
                "exitCode": completed.returncode,
                "stdoutSha256": hashlib.sha256(
                    completed.stdout.encode("utf-8")
                ).hexdigest(),
                "stderrSha256": hashlib.sha256(
                    completed.stderr.encode("utf-8")
                ).hexdigest(),
            }
        )
    return receipts


def load_successor_manifest(
    state: dict,
    job: dict,
    transition: dict,
) -> tuple[dict, list[tuple[str, dict]]]:
    manifest_path = Path(transition["successorManifestPath"])
    if not manifest_path.is_file():
        raise ControllerError(f"successor manifest does not exist: {manifest_path}")
    manifest_digest = sha256_file(manifest_path)
    manifest = load_json(str(manifest_path), "successor manifest")
    if set(manifest) != {"schemaVersion", "kind", "sourceJobId", "jobs"}:
        raise ControllerError("successor manifest has an invalid shape")
    if manifest.get("schemaVersion") != SCHEMA_VERSION:
        raise ControllerError("successor manifest schemaVersion must be 1")
    if manifest.get("kind") != "orchestration-job-manifest":
        raise ControllerError(
            "successor manifest kind must be orchestration-job-manifest"
        )
    if manifest.get("sourceJobId") != job["jobId"]:
        raise ControllerError("successor manifest sourceJobId does not match parent")
    rows = manifest.get("jobs")
    if not isinstance(rows, list) or not rows:
        raise ControllerError("successor manifest jobs must be a non-empty array")

    successors: list[tuple[str, dict]] = []
    successor_ids: set[str] = set()
    for index, row in enumerate(rows):
        if not isinstance(row, dict) or set(row) != {
            "specPath",
            "specSha256",
            "spec",
        }:
            raise ControllerError(
                f"successor manifest jobs[{index}] has an invalid shape"
            )
        spec_path_text = row.get("specPath")
        if not isinstance(spec_path_text, str) or not Path(spec_path_text).is_absolute():
            raise ControllerError(
                f"successor manifest jobs[{index}].specPath must be absolute"
            )
        spec_path = Path(spec_path_text)
        if not spec_path.is_file():
            raise ControllerError(
                f"successor job spec does not exist: {spec_path_text}"
            )
        claimed_digest = row.get("specSha256")
        actual_digest = sha256_file(spec_path)
        if not isinstance(claimed_digest, str) or claimed_digest != actual_digest:
            raise ControllerError(
                f"successor manifest jobs[{index}] specSha256 does not match"
            )
        embedded = row.get("spec")
        if not isinstance(embedded, dict):
            raise ControllerError(
                f"successor manifest jobs[{index}].spec must be an object"
            )
        disk_spec = load_json(spec_path_text, "successor job spec")
        if disk_spec != embedded:
            raise ControllerError(
                f"successor manifest jobs[{index}] embedded spec does not match file"
            )
        spec = validate_job_spec(embedded)
        successor_id = spec["jobId"]
        if successor_id in successor_ids:
            raise ControllerError(
                f"successor manifest contains duplicate jobId: {successor_id}"
            )
        successor_ids.add(successor_id)
        if successor_id in state["jobs"]:
            raise ControllerError(f"successor job already registered: {successor_id}")
        if job["jobId"] not in spec["dependencies"]:
            raise ControllerError(
                f"successor {successor_id} must depend on {job['jobId']}"
            )
        if sha256_file(spec_path) != actual_digest:
            raise ControllerError(
                f"successor job spec changed while being validated: {spec_path_text}"
            )
        successors.append((spec_path_text, spec))

    if sha256_file(manifest_path) != manifest_digest:
        raise ControllerError("successor manifest changed while being validated")
    return manifest, successors


def transition_receipt_path(working_dir: Path, job_id: str) -> Path:
    safe = "".join(
        ch if ch.isalnum() or ch in "-_" else "-" for ch in job_id
    ).strip("-")
    return working_dir / TRANSITION_RECEIPT_DIR / f"{safe or 'job'}.json"


def transition_receipt_is_current(working_dir: Path, job: dict) -> bool:
    transition = job.get("transition")
    result = job.get("transitionResult")
    if not isinstance(transition, dict) or not isinstance(result, dict):
        return False
    receipt_path = transition_receipt_path(working_dir, job["jobId"])
    if result.get("receiptPath") != str(receipt_path) or not receipt_path.is_file():
        return False
    try:
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    if not isinstance(receipt, dict):
        return False

    manifest_path = Path(transition["successorManifestPath"])
    if not manifest_path.is_file():
        return False
    manifest_digest = sha256_file(manifest_path)
    successor_ids = result.get("successorJobIds")
    if not isinstance(successor_ids, list) or not all(
        isinstance(item, str) for item in successor_ids
    ):
        return False
    event_path_text = receipt.get("eventPath")
    if not isinstance(event_path_text, str) or not Path(event_path_text).is_file():
        return False
    if receipt.get("eventSha256") != sha256_file(Path(event_path_text)):
        return False

    steps = receipt.get("steps")
    if not isinstance(steps, list) or len(steps) != len(transition["steps"]):
        return False
    for registered, recorded in zip(transition["steps"], steps):
        if not isinstance(recorded, dict):
            return False
        if any(
            recorded.get(key) != registered[key]
            for key in (
                "name",
                "script",
                "arguments",
                "requiredMarker",
                "timeoutSeconds",
            )
        ):
            return False
        if recorded.get("exitCode") != 0:
            return False
        for key in ("stdoutSha256", "stderrSha256"):
            digest = recorded.get(key)
            if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
                return False

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        rows = manifest.get("jobs")
        manifest_successors = [row["spec"]["jobId"] for row in rows]
    except (OSError, json.JSONDecodeError, AttributeError, KeyError, TypeError):
        return False
    if manifest.get("sourceJobId") != job["jobId"]:
        return False
    if manifest_successors != successor_ids:
        return False

    successor_manifest = receipt.get("successorManifest")
    return (
        receipt.get("schemaVersion") == SCHEMA_VERSION
        and receipt.get("kind") == "orchestration-transition-receipt"
        and receipt.get("jobId") == job["jobId"]
        and receipt.get("logicalAttemptId") == job.get("logicalAttemptId")
        and receipt.get("operation") == transition["operation"]
        and isinstance(successor_manifest, dict)
        and successor_manifest.get("path") == str(manifest_path)
        and successor_manifest.get("sha256") == manifest_digest
        and result.get("status") == "APPLIED"
        and result.get("operation") == transition["operation"]
        and result.get("manifestPath") == str(manifest_path)
        and result.get("manifestSha256") == manifest_digest
        and receipt.get("successorJobIds") == successor_ids
    )


def cmd_register(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    spec = validate_job_spec(load_json(args.spec, "job spec"))
    if spec["jobId"] in state["jobs"]:
        raise ControllerError(f"job already registered: {spec['jobId']}")
    register_job(state, spec, args.spec, args.now)
    refresh(state, args.now)
    save_state(working, state)
    print(f"ORCHESTRATION_CONTROLLER_REGISTERED {spec['jobId']}")
    return 0


def cmd_next(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    actions = release_actions(
        state,
        working,
        args.worker_slots,
        args.now,
    )
    save_state(working, state)
    payload = {
        "schemaVersion": 1,
        "actions": actions,
        "wait": wait_payload(state, actions, args.now),
    }
    print(json.dumps(payload, separators=(",", ":")))
    return 0


def get_job(state: dict, job_id: str) -> dict:
    try:
        return state["jobs"][job_id]
    except KeyError as exc:
        raise ControllerError(f"unknown job: {job_id}") from exc


def cmd_started(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    job = get_job(state, args.job_id)
    if job["state"] != "claimed":
        raise ControllerError(f"{args.job_id} is not claimed")
    if job["executionClass"] == "worker" and not args.host_id:
        raise ControllerError("worker started requires --host-id")
    job["state"] = "running"
    job["hostId"] = args.host_id
    job["startedAt"] = args.now
    job["lastProgressAt"] = args.now
    job["inspectedAt"] = None
    job["waitReason"] = "running"
    job["waitDetails"] = []
    save_state(working, state)
    print(f"ORCHESTRATION_CONTROLLER_STARTED {args.job_id}")
    return 0


def cmd_progress(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    job = get_job(state, args.job_id)
    if job["state"] != "running":
        raise ControllerError(f"{args.job_id} is not running")
    job["lastProgressAt"] = args.now
    job["inspectedAt"] = None
    save_state(working, state)
    print(f"ORCHESTRATION_CONTROLLER_PROGRESS {args.job_id}")
    return 0


def run_attempt_close(working_dir: Path, job: dict, event: dict) -> None:
    attempt_id = job.get("logicalAttemptId")
    if not attempt_id:
        raise ControllerError("worker job has no logicalAttemptId")
    declared_state = event.get("declaredState")
    if not isinstance(declared_state, str) or not declared_state:
        raise ControllerError("worker success requires declaredState")
    outputs = event.get("outputs")
    if not isinstance(outputs, list):
        raise ControllerError("worker success requires outputs array")
    checks = event.get("checks")
    if checks is None:
        checks = []
    if not isinstance(checks, list):
        raise ControllerError("worker success checks must be an array")

    request_dir = working_dir / "orchestration-requests"
    request_dir.mkdir(parents=True, exist_ok=True)
    close_path = request_dir / f"{attempt_id}.close.json"
    atomic_write_json(
        close_path,
        {
            "schemaVersion": 1,
            "logicalAttemptId": attempt_id,
            "declaredState": declared_state,
            "outputs": outputs,
            "checks": checks,
        },
    )

    script = Path(__file__).resolve().parent / "orchestration-attempt.py"
    completed = subprocess.run(
        [
            sys.executable,
            str(script),
            "close",
            "--working-dir",
            str(working_dir),
            "--spec",
            str(close_path),
        ],
        capture_output=True,
        text=True,
    )
    marker = f"ORCHESTRATION_ATTEMPT_CLOSED {attempt_id} {declared_state}"
    if completed.returncode != 0 or marker not in completed.stdout:
        raise ControllerError(
            "attempt close failed: "
            + (completed.stderr.strip() or completed.stdout.strip() or "unknown error")
        )


def command_receipt_path(working_dir: Path, job_id: str) -> Path:
    safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in job_id).strip("-")
    return working_dir / "orchestration-command-receipts" / f"{safe or 'job'}.json"


def command_effect_key(job: dict) -> tuple[str, tuple[str, ...]]:
    result_path = job.get("resultPath")
    effect_paths = tuple(
        sorted(path for path in job.get("writePaths", []) if path != result_path)
    )
    return (job["kind"], effect_paths)


def command_receipt_is_current(
    working_dir: Path, job: dict, *, require_sources: bool = True
) -> bool:
    if require_sources and not sources_match(job):
        return False
    record = job.get("commandResult") or {}
    path_text = record.get("path")
    digest = record.get("sha256")
    receipt_path = command_receipt_path(working_dir, job["jobId"])
    if (
        not isinstance(path_text, str)
        or path_text != job.get("resultPath")
        or not Path(path_text).is_file()
        or sha256_file(Path(path_text)) != digest
        or not receipt_path.is_file()
    ):
        return False
    try:
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    return (
        receipt.get("jobId") == job["jobId"]
        and receipt.get("resultPath") == path_text
        and receipt.get("resultSha256") == digest
        and receipt.get("sourceFingerprints") == job["sourceFingerprints"]
    )


def has_fresh_superseding_command(
    state: dict, working_dir: Path, stale_job: dict
) -> bool:
    stale_closed = stale_job.get("closedAt")
    if not isinstance(stale_closed, (int, float)):
        return False
    stale_key = command_effect_key(stale_job)
    for candidate in state["jobs"].values():
        if candidate["jobId"] == stale_job["jobId"]:
            continue
        if candidate.get("executionClass") != "command" or candidate.get("state") != "closed":
            continue
        candidate_closed = candidate.get("closedAt")
        if not isinstance(candidate_closed, (int, float)) or candidate_closed <= stale_closed:
            continue
        if command_effect_key(candidate) != stale_key:
            continue
        if command_receipt_is_current(working_dir, candidate):
            return True
    return False

def validate_command_result(working_dir: Path, job: dict, event: dict) -> dict:
    result_path = event.get("resultPath")
    if not isinstance(result_path, str) or not Path(result_path).is_absolute():
        raise ControllerError("command success requires absolute resultPath")
    expected = job["resultPath"]
    if result_path != expected:
        raise ControllerError(
            "command resultPath does not match registered --summary-output path"
        )
    path = Path(result_path)
    result = load_json(result_path, "command result")
    if result.get("schemaVersion") != 1 or result.get("ok") is not True:
        raise ControllerError("command result must have schemaVersion 1 and ok true")
    digest = sha256_file(path)
    receipt = {
        "schemaVersion": 1,
        "jobId": job["jobId"],
        "attemptCount": job["attemptCount"],
        "sourceFingerprints": job["sourceFingerprints"],
        "resultPath": result_path,
        "resultSha256": digest,
    }
    atomic_write_json(command_receipt_path(working_dir, job["jobId"]), receipt)
    return {"path": result_path, "sha256": digest}


def cmd_complete(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    event = load_json(
        args.event,
        "completion event",
    )
    job = complete_active_job(
        state,
        working,
        event,
        args.now,
    )
    marker = (
        "ORCHESTRATION_CONTROLLER_INVALIDATED"
        if job["state"] == "invalidated"
        else "ORCHESTRATION_CONTROLLER_CLOSED"
    )

    if args.worker_slots is None:
        save_state(
            working,
            state,
        )
        print(
            f"{marker} {job['jobId']}"
        )
        return 0

    actions = release_actions(
        state,
        working,
        args.worker_slots,
        args.now,
    )
    payload = {
        "schemaVersion": 1,
        "status": marker,
        "closedJobId": job["jobId"],
        "actions": actions,
        "wait": wait_payload(
            state,
            actions,
            args.now,
        ),
    }
    save_state(
        working,
        state,
    )
    print(
        json.dumps(
            payload,
            separators=(",", ":"),
        )
    )
    return 0


def cmd_fail(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    job = get_job(state, args.job_id)
    if job["state"] not in {"claimed", "running"}:
        raise ControllerError(f"{args.job_id} is not active")

    if job["executionClass"] == "worker":
        archive_unaccepted_attempt(working, job, args.failure_kind, args.now)

    if (
        args.failure_kind in RETRY_FAILURES
        and job["attemptCount"] < job["maxAttempts"]
    ):
        delay_index = min(job["attemptCount"] - 1, len(BACKOFF_SECONDS) - 1)
        job["notBefore"] = args.now + BACKOFF_SECONDS[delay_index]
        job["state"] = "blocked"
        job["hostId"] = None
        job["failure"] = args.failure_kind
        job["waitReason"] = "backoff"
        job["waitDetails"] = [str(job["notBefore"])]
        job["readySequence"] = None
        job["logicalAttemptId"] = None
        refresh(state, args.now)
        save_state(working, state)
        print(
            f"ORCHESTRATION_CONTROLLER_REQUEUED {args.job_id} "
            f"{int(job['notBefore'])}"
        )
        return 0

    job["state"] = "failed"
    job["failure"] = args.failure_kind
    job["hostId"] = None
    job["logicalAttemptId"] = None
    job["closedAt"] = args.now
    job["waitReason"] = "failed"
    job["waitDetails"] = [args.failure_kind]
    refresh(state, args.now)
    save_state(working, state)
    print(f"ORCHESTRATION_CONTROLLER_FAILED {args.job_id} {args.failure_kind}")
    return 0


def cmd_transition(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    event = load_json(args.event, "completion event")

    job_id = event.get("jobId")
    if not isinstance(job_id, str):
        raise ControllerError("completion event jobId must be a string")

    job = get_job(state, job_id)

    if (
        (job.get("transitionResult") or {}).get("status") == "APPLIED"
        and job["state"] == "closed"
    ):
        refresh(state, args.now)
        actions = release_actions(
            state,
            working,
            args.worker_slots,
            args.now,
        )
        payload = {
            "schemaVersion": 1,
            "status": "TRANSITION_ALREADY_APPLIED",
            "closedJobId": job_id,
            "successorJobIds": job["transitionResult"]["successorJobIds"],
            "actions": actions,
            "wait": wait_payload(state, actions, args.now),
        }
        save_state(working, state)
        print(json.dumps(payload, separators=(",", ":")))
        return 0

    if job["state"] not in {"claimed", "running"}:
        raise ControllerError(f"{job_id} is not active")
    if job["executionClass"] not in {"worker", "command"}:
        raise ControllerError("transition requires a worker or command job")
    if job.get("transition") is None:
        raise ControllerError(f"{job_id} has no registered transition")

    if not sources_match(job):
        complete_active_job(
            state,
            working,
            event,
            args.now,
            allow_transition=True,
        )
        save_state(working, state)
        print(f"ORCHESTRATION_CONTROLLER_INVALIDATED {job_id}")
        return 0

    transition = job["transition"]
    locked = held_write_paths(state, excluding=job_id)
    if set(transition["writePaths"]) & locked:
        raise ControllerError("transition write path is held by another active job")

    try:
        step_results = run_transition_steps(working, transition)
        manifest, successors = load_successor_manifest(
            state,
            job,
            transition,
        )
    except ControllerError as exc:
        failure = {
            "schemaVersion": 1,
            "status": "TRANSITION_FAILED",
            "closedJobId": job_id,
            "step": None,
            "detail": str(exc),
        }
        print(json.dumps(failure, separators=(",", ":")))
        return 1

    complete_active_job(
        state,
        working,
        event,
        args.now,
        allow_transition=True,
    )

    successor_ids = []
    for spec_path, spec in successors:
        register_job(state, spec, spec_path, args.now)
        successor_ids.append(spec["jobId"])

    manifest_path = Path(transition["successorManifestPath"])
    receipt_path = transition_receipt_path(working, job_id)
    transition_result = {
        "schemaVersion": 1,
        "status": "APPLIED",
        "operation": transition["operation"],
        "manifestPath": str(manifest_path),
        "manifestSha256": sha256_file(manifest_path),
        "successorJobIds": successor_ids,
        "receiptPath": str(receipt_path),
    }

    atomic_write_json(
        receipt_path,
        {
            "schemaVersion": 1,
            "kind": "orchestration-transition-receipt",
            "jobId": job_id,
            "logicalAttemptId": job.get("logicalAttemptId"),
            "operation": transition["operation"],
            "eventPath": str(Path(args.event).resolve()),
            "eventSha256": sha256_file(Path(args.event)),
            "steps": step_results,
            "successorManifest": {
                "path": str(manifest_path),
                "sha256": transition_result["manifestSha256"],
            },
            "successorJobIds": successor_ids,
        },
    )

    job["transitionResult"] = transition_result
    refresh(state, args.now)
    actions = release_actions(
        state,
        working,
        args.worker_slots,
        args.now,
    )
    payload = {
        "schemaVersion": 1,
        "status": "TRANSITION_OK",
        "closedJobId": job_id,
        "successorJobIds": successor_ids,
        "actions": actions,
        "wait": wait_payload(state, actions, args.now),
    }
    save_state(working, state)
    print(json.dumps(payload, separators=(",", ":")))
    return 0


def cmd_watchdog(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    actions = []
    for job in state["jobs"].values():
        if job["executionClass"] != "worker":
            continue

        if job["state"] == "claimed":
            claimed_at = job.get("claimedAt")
            if (
                claimed_at is not None
                and args.now - claimed_at >= CLAIM_START_TIMEOUT_SECONDS
            ):
                actions.append(
                    {
                        "action": "fail-worker-launch",
                        "jobId": job["jobId"],
                        "logicalAttemptId": job.get("logicalAttemptId"),
                        "failureKind": "stalled",
                    }
                )
            continue

        if job["state"] != "running":
            continue
        anchor = job.get("lastProgressAt") or job.get("startedAt")
        if anchor is None or args.now - anchor < WATCHDOG_SECONDS:
            continue
        if job.get("inspectedAt") is None:
            job["inspectedAt"] = args.now
            actions.append(
                {
                    "action": "inspect-worker",
                    "jobId": job["jobId"],
                    "hostId": job.get("hostId"),
                }
            )
        elif args.now - job["inspectedAt"] >= WATCHDOG_SECONDS:
            actions.append(
                {
                    "action": "stop-worker",
                    "jobId": job["jobId"],
                    "hostId": job.get("hostId"),
                }
            )
    save_state(working, state)
    print(json.dumps({"schemaVersion": 1, "actions": actions}, separators=(",", ":")))
    return 0


def cmd_signal(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    state["signals"][args.signal_id] = args.state
    refresh(state, args.now)
    save_state(working, state)
    print(f"ORCHESTRATION_CONTROLLER_SIGNAL {args.signal_id} {args.state}")
    return 0


def cmd_status(args) -> int:
    state = load_state(Path(args.working_dir))
    print(json.dumps(state, indent=2))
    return 0


def cmd_audit(args) -> int:
    working = Path(args.working_dir)
    state = load_state(working)
    refresh(state, args.now)
    nonterminal = sorted(
        job["jobId"]
        for job in state["jobs"].values()
        if job["state"] not in TERMINAL_STATES
    )
    bad_command_receipts = []
    superseded_command_jobs = []
    for job in state["jobs"].values():
        if job["executionClass"] != "command" or job["state"] != "closed":
            continue

        # Normal picture-finalisation sources (worker result, staging and AI
        # ledger) are intentionally removed after durable provenance is compacted.
        # The finaliser summary and command receipt remain durable, so audit those
        # records without requiring the transient source files to survive cleanup.
        if job["kind"] == "picture-finalize":
            if not command_receipt_is_current(
                working, job, require_sources=False
            ):
                bad_command_receipts.append(job["jobId"])
            continue

        if not sources_match(job):
            if has_fresh_superseding_command(state, working, job):
                superseded_command_jobs.append(job["jobId"])
                continue
            bad_command_receipts.append(job["jobId"])
            continue
        if not command_receipt_is_current(working, job):
            bad_command_receipts.append(job["jobId"])

    bad_transition_receipts = []
    for job in state["jobs"].values():
        if job.get("transition") is None or job["state"] != "closed":
            continue
        successor_ids = (job.get("transitionResult") or {}).get(
            "successorJobIds", []
        )
        successors_registered = isinstance(successor_ids, list) and all(
            successor_id in state["jobs"] for successor_id in successor_ids
        )
        if not successors_registered or not transition_receipt_is_current(
            working, job
        ):
            bad_transition_receipts.append(job["jobId"])

    audit = {
        "schemaVersion": 1,
        "ok": (
            not nonterminal
            and not bad_command_receipts
            and not bad_transition_receipts
        ),
        "nonterminalJobs": nonterminal,
        "invalidCommandReceipts": sorted(bad_command_receipts),
        "invalidTransitionReceipts": sorted(bad_transition_receipts),
        "supersededCommandJobs": sorted(superseded_command_jobs),
        "states": {
            job_id: state["jobs"][job_id]["state"] for job_id in sorted(state["jobs"])
        },
    }
    atomic_write_json(working / "orchestration-controller-audit.json", audit)
    save_state(working, state)
    if nonterminal or bad_command_receipts or bad_transition_receipts:
        details = []
        if nonterminal:
            details.append("nonterminal=" + ",".join(nonterminal))
        if bad_command_receipts:
            details.append("bad-command-receipts=" + ",".join(sorted(bad_command_receipts)))
        if bad_transition_receipts:
            details.append(
                "bad-transition-receipts="
                + ",".join(sorted(bad_transition_receipts))
            )
        print(
            "ORCHESTRATION_CONTROLLER_AUDIT_BLOCKED " + " ".join(details),
            file=sys.stderr,
        )
        return 1

    # Keep the existing durable attempt audit as a second independent check.
    attempt_script = Path(__file__).resolve().parent / "orchestration-attempt.py"
    completed = subprocess.run(
        [
            sys.executable,
            str(attempt_script),
            "audit",
            "--working-dir",
            str(working),
        ],
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        print(completed.stderr or completed.stdout, file=sys.stderr, end="")
        return completed.returncode
    print("ORCHESTRATION_CONTROLLER_AUDIT_OK")
    return 0

def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    sub = root.add_subparsers(dest="command", required=True)

    register = sub.add_parser("register")
    register.add_argument("--working-dir", required=True)
    register.add_argument("--spec", required=True)
    register.add_argument("--now", type=float, required=True)
    register.set_defaults(func=cmd_register)

    nxt = sub.add_parser("next")
    nxt.add_argument("--working-dir", required=True)
    nxt.add_argument("--worker-slots", type=int, required=True)
    nxt.add_argument("--now", type=float, required=True)
    nxt.set_defaults(func=cmd_next)

    started = sub.add_parser("started")
    started.add_argument("--working-dir", required=True)
    started.add_argument("--job-id", required=True)
    started.add_argument("--host-id")
    started.add_argument("--now", type=float, required=True)
    started.set_defaults(func=cmd_started)

    progress = sub.add_parser("progress")
    progress.add_argument("--working-dir", required=True)
    progress.add_argument("--job-id", required=True)
    progress.add_argument("--now", type=float, required=True)
    progress.set_defaults(func=cmd_progress)

    transition = sub.add_parser("transition")
    transition.add_argument("--working-dir", required=True)
    transition.add_argument("--event", required=True)
    transition.add_argument("--worker-slots", type=int, required=True)
    transition.add_argument("--now", type=float, required=True)
    transition.set_defaults(func=cmd_transition)

    complete = sub.add_parser("complete")
    complete.add_argument("--working-dir", required=True)
    complete.add_argument("--event", required=True)
    complete.add_argument(
        "--worker-slots",
        type=int,
    )
    complete.add_argument("--now", type=float, required=True)
    complete.set_defaults(func=cmd_complete)

    fail = sub.add_parser("fail")
    fail.add_argument("--working-dir", required=True)
    fail.add_argument("--job-id", required=True)
    fail.add_argument(
        "--failure-kind",
        choices=("transient", "stalled", "terminal", "wrong-result"),
        required=True,
    )
    fail.add_argument("--now", type=float, required=True)
    fail.set_defaults(func=cmd_fail)

    # SKILL.md uses `terminal` as the named route for a completed malformed or
    # wrong result. Keep it as a deterministic alias for a non-retryable
    # wrong-result failure so the documented host command exists.
    terminal = sub.add_parser("terminal")
    terminal.add_argument("--working-dir", required=True)
    terminal.add_argument("--job-id", required=True)
    terminal.add_argument("--now", type=float, required=True)
    terminal.set_defaults(func=cmd_fail, failure_kind="wrong-result")

    watchdog = sub.add_parser("watchdog")
    watchdog.add_argument("--working-dir", required=True)
    watchdog.add_argument("--now", type=float, required=True)
    watchdog.set_defaults(func=cmd_watchdog)

    signal = sub.add_parser("signal")
    signal.add_argument("--working-dir", required=True)
    signal.add_argument("--signal-id", required=True)
    signal.add_argument("--state", choices=("satisfied", "failed"), required=True)
    signal.add_argument("--now", type=float, required=True)
    signal.set_defaults(func=cmd_signal)

    status = sub.add_parser("status")
    status.add_argument("--working-dir", required=True)
    status.set_defaults(func=cmd_status)

    audit = sub.add_parser("audit")
    audit.add_argument("--working-dir", required=True)
    audit.add_argument("--now", type=float, required=True)
    audit.set_defaults(func=cmd_audit)
    return root


def main(argv=None) -> int:
    args = parser().parse_args(argv)
    worker_slots = getattr(
        args,
        "worker_slots",
        None,
    )
    if (
        worker_slots is not None
        and worker_slots < 0
    ):
        raise ControllerError(
            "--worker-slots must be >= 0"
        )
    return args.func(args)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ControllerError as exc:
        print(f"ORCHESTRATION_CONTROLLER_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
