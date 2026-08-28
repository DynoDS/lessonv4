#!/usr/bin/env python3
"""Create and audit every orchestration completion record.

Every worker attempt in a run gets a durable contract written before launch
(``start``), a receipt written when its declared state is accepted (``close``),
and a final comparison of the two sets before delivery (``audit``). This
script writes those records itself — the mechanical output contract and the
orchestrator-owned receipt are never hand-written — so the audit can compare
what was expected with what was accepted.

    python3 orchestration-attempt.py start --working-dir PATH --spec PATH
    python3 orchestration-attempt.py close --working-dir PATH --spec PATH
    python3 orchestration-attempt.py audit --working-dir PATH

Records:

    [WORKING_DIR]/orchestration-contracts/<logicalAttemptId>.json
    [WORKING_DIR]/orchestration-receipts/<logicalAttemptId>.json
    [WORKING_DIR]/orchestration-audit.json

``start`` and ``close`` exit 0 and print their markers on success. ``audit``
writes the audit JSON atomically, exits 0 and prints
``ORCHESTRATION_AUDIT_OK contracts=N receipts=N`` only when every contract has
a receipt and every receipt has a contract and is valid.

Standard library only.
"""
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import os
import re
import sys
from pathlib import Path

CONTRACTS_DIR = "orchestration-contracts"
RECEIPTS_DIR = "orchestration-receipts"
AUDIT_FILE = "orchestration-audit.json"

# Receipt-like files other flows own; the audit must not compare them.
EXCLUDED_PATTERNS = (
    "adaptation-photo-merge.json",
    "adaptation-photo-provisional.json",
    "phase2-initial-photo-requirements.json",
    "photo-requirements-w-*.json",
    "picture-terminal-*.json",
)

ATTEMPT_ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*-(\d+)$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


class AttemptError(Exception):
    """A spec or filesystem problem that must refuse the command."""


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_spec(path_text: str) -> dict:
    path = Path(path_text)
    if not path.is_file():
        raise AttemptError(f"--spec path does not exist: {path_text}")
    try:
        spec = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise AttemptError(f"--spec is not readable JSON: {exc}")
    if not isinstance(spec, dict):
        raise AttemptError("spec: root must be an object.")
    return spec


def atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def excluded(filename: str) -> bool:
    return any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATTERNS)


def require_absolute(path_value, label: str) -> None:
    if not isinstance(path_value, str) or not path_value:
        raise AttemptError(f"{label}: must be a non-empty string.")
    if not Path(path_value).is_absolute():
        raise AttemptError(f"{label}: path must be absolute: {path_value}")


def validate_attempt_id(spec: dict) -> str:
    attempt_id = spec.get("logicalAttemptId")
    if not isinstance(attempt_id, str) or not attempt_id:
        raise AttemptError("logicalAttemptId: must be a non-empty string.")
    match = ATTEMPT_ID_RE.match(attempt_id)
    if not match:
        raise AttemptError(
            f"logicalAttemptId {attempt_id!r} is malformed: expected "
            "[normalised-role]-[normalised-purpose]-[attempt number] in lowercase ASCII."
        )
    attempt_number = spec.get("attemptNumber")
    if not isinstance(attempt_number, int) or isinstance(attempt_number, bool):
        raise AttemptError("attemptNumber: must be an integer.")
    if int(match.group(2)) != attempt_number:
        raise AttemptError(
            f"logicalAttemptId {attempt_id!r} ends in {match.group(2)} but "
            f"attemptNumber is {attempt_number}."
        )
    return attempt_id


def validate_assignment(assignment) -> dict:
    if not isinstance(assignment, dict):
        raise AttemptError("assignment: must be an object.")
    for field in ("role", "identity"):
        if not isinstance(assignment.get(field), str) or not assignment.get(field):
            raise AttemptError(f"assignment.{field}: must be a non-empty string.")
    expected = assignment.get("expectedOutputs")
    if not isinstance(expected, list) or not expected:
        raise AttemptError("assignment.expectedOutputs: must be a non-empty array.")
    for index, output in enumerate(expected):
        require_absolute(output, f"assignment.expectedOutputs[{index}]")
    if len(set(expected)) != len(expected):
        raise AttemptError("assignment.expectedOutputs: contains a duplicate path.")
    states = assignment.get("allowedDeclaredStates")
    if not isinstance(states, list) or not states:
        raise AttemptError("assignment.allowedDeclaredStates: must be a non-empty array.")
    for state in states:
        if not isinstance(state, str) or not state:
            raise AttemptError("assignment.allowedDeclaredStates: every state must be a non-empty string.")
    if len(set(states)) != len(states):
        raise AttemptError("assignment.allowedDeclaredStates: contains a duplicate state.")
    by_state = assignment.get("outputsByDeclaredState")
    if not isinstance(by_state, dict) or not by_state:
        raise AttemptError("assignment.outputsByDeclaredState: must be a non-empty object.")
    if set(by_state.keys()) != set(states):
        raise AttemptError(
            "assignment.outputsByDeclaredState: keys must be exactly the allowed "
            f"declared states; got {sorted(by_state.keys())} vs {sorted(states)}."
        )
    expected_set = set(expected)
    union: set[str] = set()
    for state, outputs in by_state.items():
        if not isinstance(outputs, list) or not outputs:
            raise AttemptError(
                f"assignment.outputsByDeclaredState[{state!r}]: must be a non-empty array."
            )
        for index, output in enumerate(outputs):
            require_absolute(output, f"assignment.outputsByDeclaredState[{state!r}][{index}]")
        if len(set(outputs)) != len(outputs):
            raise AttemptError(
                f"assignment.outputsByDeclaredState[{state!r}]: contains a duplicate path."
            )
        unknown = set(outputs) - expected_set
        if unknown:
            raise AttemptError(
                f"assignment.outputsByDeclaredState[{state!r}]: outputs not in "
                f"expectedOutputs: {sorted(unknown)}."
            )
        union.update(outputs)
    unclaimed = expected_set - union
    if unclaimed:
        raise AttemptError(
            f"assignment.outputsByDeclaredState: expectedOutputs named by no state: "
            f"{sorted(unclaimed)}."
        )
    return assignment


def run_start(args) -> int:
    spec = load_spec(args.spec)
    if spec.get("schemaVersion") != 1:
        raise AttemptError("schemaVersion must be 1.")
    attempt_id = validate_attempt_id(spec)
    assignment = validate_assignment(spec.get("assignment"))
    states = assignment["allowedDeclaredStates"]
    by_state = assignment["outputsByDeclaredState"]

    checks = spec.get("checks")
    if checks is not None:
        if not isinstance(checks, list):
            raise AttemptError("checks: must be an array.")
        for index, check in enumerate(checks):
            if not isinstance(check, dict):
                raise AttemptError(f"checks[{index}]: must be an object.")
            for field in ("name", "command"):
                if not isinstance(check.get(field), str) or not check.get(field):
                    raise AttemptError(f"checks[{index}].{field}: must be a non-empty string.")
            if "requiredMarker" not in check:
                raise AttemptError(f"checks[{index}]: missing requiredMarker (use null for none).")
            marker = check["requiredMarker"]
            if marker is not None and not isinstance(marker, str):
                raise AttemptError(f"checks[{index}].requiredMarker: must be a string or null.")

    working = Path(args.working_dir)
    contract_path = working / CONTRACTS_DIR / f"{attempt_id}.json"
    if contract_path.exists():
        raise AttemptError(
            f"duplicate attempt: contract already exists for {attempt_id!r}."
        )

    inputs = spec.get("inputs") or []
    if not isinstance(inputs, list):
        raise AttemptError("inputs: must be an array.")
    snapshot_dir = working / "orchestration-snapshots" / attempt_id / "inputs"
    recorded_inputs = []
    seen_snapshot_names: set[str] = set()
    for index, entry in enumerate(inputs):
        if not isinstance(entry, dict):
            raise AttemptError(f"inputs[{index}]: must be an object.")
        source = entry.get("sourcePath")
        require_absolute(source, f"inputs[{index}].sourcePath")
        mode = entry.get("mode")
        if mode not in ("read-only", "read-write"):
            raise AttemptError(f"inputs[{index}].mode: must be 'read-only' or 'read-write'.")
        source_path = Path(source)
        if not source_path.is_file():
            raise AttemptError(f"inputs[{index}]: source file does not exist: {source}")
        snapshot_name = source_path.name
        if snapshot_name in seen_snapshot_names:
            snapshot_name = f"{index}-{snapshot_name}"
        seen_snapshot_names.add(snapshot_name)
        snapshot_path = snapshot_dir / snapshot_name
        snapshot_dir.mkdir(parents=True, exist_ok=True)
        snapshot_bytes = source_path.read_bytes()
        snapshot_path.write_bytes(snapshot_bytes)
        snapshot_sha = hashlib.sha256(snapshot_bytes).hexdigest()
        recorded_inputs.append({
            "sourcePath": source,
            "mode": mode,
            "snapshotPath": str(snapshot_path),
            "snapshotSha256": snapshot_sha,
            "sha256AtLaunch": sha256_of(source_path),
        })

    contract = {
        "schemaVersion": 1,
        "logicalAttemptId": attempt_id,
        "attemptNumber": spec["attemptNumber"],
        "assignment": {
            "role": assignment["role"],
            "identity": assignment["identity"],
            "expectedOutputs": list(assignment["expectedOutputs"]),
            "allowedDeclaredStates": list(states),
            "outputsByDeclaredState": {state: list(outputs) for state, outputs in by_state.items()},
        },
        "inputs": recorded_inputs,
        "checks": spec.get("checks") or [],
    }
    atomic_write_json(contract_path, contract)
    print(f"ORCHESTRATION_ATTEMPT_STARTED {attempt_id}")
    return 0


def run_close(args) -> int:
    spec = load_spec(args.spec)
    if spec.get("schemaVersion") != 1:
        raise AttemptError("schemaVersion must be 1.")
    attempt_id = spec.get("logicalAttemptId")
    if not isinstance(attempt_id, str) or not attempt_id:
        raise AttemptError("logicalAttemptId: must be a non-empty string.")
    working = Path(args.working_dir)
    contract_path = working / CONTRACTS_DIR / f"{attempt_id}.json"
    if not contract_path.is_file():
        raise AttemptError(f"no contract for attempt {attempt_id!r}; nothing to close.")
    try:
        contract = json.loads(contract_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise AttemptError(f"contract for {attempt_id!r} is not readable JSON: {exc}")

    assignment = contract.get("assignment") or {}
    allowed = assignment.get("allowedDeclaredStates") or []
    by_state = assignment.get("outputsByDeclaredState") or {}

    declared_state = spec.get("declaredState")
    if declared_state not in allowed:
        raise AttemptError(
            f"declaredState {declared_state!r} is not a state this contract allowed; "
            f"allowed: {sorted(allowed)}."
        )

    receipt_path = working / RECEIPTS_DIR / f"{attempt_id}.json"
    if receipt_path.exists():
        raise AttemptError(f"receipt already exists for {attempt_id!r}; an attempt closes once.")

    expected_outputs = set(by_state.get(declared_state) or [])
    outputs = spec.get("outputs")
    if not isinstance(outputs, list):
        raise AttemptError("outputs: must be an array.")
    seen: list[str] = []
    for index, entry in enumerate(outputs):
        if not isinstance(entry, dict):
            raise AttemptError(f"outputs[{index}]: must be an object.")
        path_value = entry.get("path")
        require_absolute(path_value, f"outputs[{index}].path")
        seen.append(path_value)
    if set(seen) != expected_outputs or len(seen) != len(expected_outputs):
        raise AttemptError(
            f"outputs for state {declared_state!r} must be exactly "
            f"{sorted(expected_outputs)}; got {sorted(set(seen))}."
        )

    recorded_outputs = []
    for entry in outputs:
        out_path = Path(entry["path"])
        if not out_path.is_file():
            raise AttemptError(f"output does not exist: {entry['path']}")
        recorded_outputs.append({"path": entry["path"], "sha256": sha256_of(out_path)})

    contract_checks = contract.get("checks") or []
    close_checks = spec.get("checks")
    if contract_checks:
        if not isinstance(close_checks, list):
            raise AttemptError("checks: must be an array when the contract named checks.")
        by_name = {}
        for index, check in enumerate(close_checks):
            if not isinstance(check, dict):
                raise AttemptError(f"checks[{index}]: must be an object.")
            name = check.get("name")
            if not isinstance(name, str) or not name:
                raise AttemptError(f"checks[{index}].name: must be a non-empty string.")
            by_name[name] = check
        for contract_check in contract_checks:
            name = contract_check.get("name")
            run_check = by_name.get(name)
            if run_check is None:
                raise AttemptError(f"checks: contract check {name!r} has no close result.")
            if run_check.get("command") != contract_check.get("command"):
                raise AttemptError(
                    f"checks[{name!r}]: command does not match the contract command."
                )
            if run_check.get("exitCode") != 0:
                raise AttemptError(
                    f"checks[{name!r}]: exitCode is {run_check.get('exitCode')!r}; expected 0."
                )
            marker = contract_check.get("requiredMarker")
            if marker is not None:
                captured = run_check.get("capturedOutput")
                if not isinstance(captured, str) or marker not in captured:
                    raise AttemptError(
                        f"checks[{name!r}]: requiredMarker {marker!r} is not in the captured output."
                    )

    # Immutable snapshots must remain intact. Read-only live inputs must also
    # retain their launch content. A read-write input is allowed to change, but
    # its canonical path must be one of this declared state's outputs.
    for entry in contract.get("inputs") or []:
        snapshot = Path(entry["snapshotPath"])
        if not snapshot.is_file():
            raise AttemptError(f"input snapshot missing at close: {entry['snapshotPath']}")
        if sha256_of(snapshot) != entry.get("snapshotSha256"):
            raise AttemptError(
                f"input snapshot changed after launch: {entry['snapshotPath']}"
            )

        source = Path(entry["sourcePath"])
        if not source.is_file():
            raise AttemptError(f"input missing at close: {entry['sourcePath']}")
        if entry.get("mode") == "read-only":
            if sha256_of(source) != entry.get("sha256AtLaunch"):
                raise AttemptError(
                    f"read-only input changed between launch and close: "
                    f"{entry['sourcePath']}"
                )
        elif entry.get("mode") == "read-write":
            if entry["sourcePath"] not in expected_outputs:
                raise AttemptError(
                    f"read-write input {entry['sourcePath']} must also be an output of "
                    f"state {declared_state!r}."
                )
        else:
            raise AttemptError(
                f"input {entry['sourcePath']} has unknown mode {entry.get('mode')!r}."
            )

    receipt = {
        "schemaVersion": 1,
        "logicalAttemptId": attempt_id,
        "attemptNumber": contract.get("attemptNumber"),
        "assignment": {
            "role": assignment.get("role"),
            "identity": assignment.get("identity"),
            "expectedOutputs": assignment.get("expectedOutputs"),
            "allowedDeclaredStates": allowed,
        },
        "declaredState": declared_state,
        "inputs": contract.get("inputs") or [],
        "outputs": recorded_outputs,
        "checks": close_checks or [],
    }
    atomic_write_json(receipt_path, receipt)
    print(f"ORCHESTRATION_ATTEMPT_CLOSED {attempt_id} {declared_state}")
    return 0


def read_record(path: Path) -> dict | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def valid_recorded_file(path_text, recorded_sha) -> bool:
    if not isinstance(path_text, str) or not path_text:
        return False
    if not isinstance(recorded_sha, str) or not SHA256_RE.match(recorded_sha):
        return False
    path = Path(path_text)
    return path.is_absolute() and path.is_file() and sha256_of(path) == recorded_sha


def is_valid_attempt_pair(contract_path: Path, receipt_path: Path) -> bool:
    contract = read_record(contract_path)
    receipt = read_record(receipt_path)
    if contract is None or receipt is None:
        return False

    attempt_id = contract_path.stem
    if receipt_path.stem != attempt_id:
        return False
    if contract.get("schemaVersion") != 1 or receipt.get("schemaVersion") != 1:
        return False
    if contract.get("logicalAttemptId") != attempt_id:
        return False
    if receipt.get("logicalAttemptId") != attempt_id:
        return False
    if receipt.get("attemptNumber") != contract.get("attemptNumber"):
        return False

    contract_assignment = contract.get("assignment")
    receipt_assignment = receipt.get("assignment")
    if not isinstance(contract_assignment, dict) or not isinstance(receipt_assignment, dict):
        return False
    for field in ("role", "identity", "expectedOutputs", "allowedDeclaredStates"):
        if receipt_assignment.get(field) != contract_assignment.get(field):
            return False

    declared_state = receipt.get("declaredState")
    allowed_states = contract_assignment.get("allowedDeclaredStates")
    outputs_by_state = contract_assignment.get("outputsByDeclaredState")
    if not isinstance(allowed_states, list) or declared_state not in allowed_states:
        return False
    if not isinstance(outputs_by_state, dict):
        return False
    expected_outputs = outputs_by_state.get(declared_state)
    if not isinstance(expected_outputs, list) or not expected_outputs:
        return False

    outputs = receipt.get("outputs")
    if not isinstance(outputs, list) or not outputs:
        return False
    output_paths = []
    for entry in outputs:
        if not isinstance(entry, dict):
            return False
        path_text = entry.get("path")
        if not valid_recorded_file(path_text, entry.get("sha256")):
            return False
        output_paths.append(path_text)
    if len(output_paths) != len(set(output_paths)):
        return False
    if set(output_paths) != set(expected_outputs):
        return False

    contract_inputs = contract.get("inputs") or []
    if receipt.get("inputs") != contract_inputs:
        return False
    for entry in contract_inputs:
        if not isinstance(entry, dict):
            return False
        if not valid_recorded_file(entry.get("snapshotPath"), entry.get("snapshotSha256")):
            return False
        source_path = entry.get("sourcePath")
        mode = entry.get("mode")
        if mode == "read-only":
            if not valid_recorded_file(source_path, entry.get("sha256AtLaunch")):
                return False
        elif mode == "read-write":
            if source_path not in output_paths:
                return False
        else:
            return False

    contract_checks = contract.get("checks") or []
    receipt_checks = receipt.get("checks") or []
    if not isinstance(contract_checks, list) or not isinstance(receipt_checks, list):
        return False
    contract_by_name = {
        item.get("name"): item
        for item in contract_checks
        if isinstance(item, dict) and isinstance(item.get("name"), str)
    }
    receipt_by_name = {
        item.get("name"): item
        for item in receipt_checks
        if isinstance(item, dict) and isinstance(item.get("name"), str)
    }
    if len(contract_by_name) != len(contract_checks):
        return False
    if len(receipt_by_name) != len(receipt_checks):
        return False
    if set(receipt_by_name) != set(contract_by_name):
        return False
    for name, contract_check in contract_by_name.items():
        receipt_check = receipt_by_name[name]
        if receipt_check.get("command") != contract_check.get("command"):
            return False
        if receipt_check.get("exitCode") != 0:
            return False
        marker = contract_check.get("requiredMarker")
        if marker is not None:
            captured = receipt_check.get("capturedOutput")
            if not isinstance(captured, str) or marker not in captured:
                return False

    return True


def run_audit(args) -> int:
    working = Path(args.working_dir)
    contracts_dir = working / CONTRACTS_DIR
    receipts_dir = working / RECEIPTS_DIR

    contract_files = sorted(
        path for path in contracts_dir.glob("*.json")
        if not excluded(path.name)
    ) if contracts_dir.is_dir() else []
    receipt_files = sorted(
        path for path in receipts_dir.glob("*.json")
        if not excluded(path.name)
    ) if receipts_dir.is_dir() else []

    contract_ids = {path.stem for path in contract_files}
    receipt_ids = {path.stem for path in receipt_files}
    missing = sorted(contract_ids - receipt_ids)
    unexpected = sorted(receipt_ids - contract_ids)
    contracts_by_id = {path.stem: path for path in contract_files}
    receipts_by_id = {path.stem: path for path in receipt_files}
    invalid = sorted(
        attempt_id
        for attempt_id in sorted(contract_ids & receipt_ids)
        if not is_valid_attempt_pair(
            contracts_by_id[attempt_id], receipts_by_id[attempt_id]
        )
    )

    status = "PASS" if not missing and not unexpected and not invalid else "FAIL"
    audit = {
        "schemaVersion": 1,
        "contracts": len(contract_files),
        "receipts": len(receipt_files),
        "missingReceipts": missing,
        "unexpectedReceipts": unexpected,
        "invalidReceipts": invalid,
        "status": status,
    }
    atomic_write_json(working / AUDIT_FILE, audit)

    if status == "FAIL":
        if missing:
            print("missing receipts: " + ", ".join(missing))
        if unexpected:
            print("unexpected receipts: " + ", ".join(unexpected))
        if invalid:
            print("invalid receipts: " + ", ".join(invalid))
        return 1
    print(f"ORCHESTRATION_AUDIT_OK contracts={len(contract_files)} receipts={len(receipt_files)}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Create and audit orchestration completion records."
    )
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("start", "close"):
        p = sub.add_parser(name)
        p.add_argument("--working-dir", required=True)
        p.add_argument("--spec", required=True)
    p = sub.add_parser("audit")
    p.add_argument("--working-dir", required=True)
    args = parser.parse_args(argv)

    try:
        if args.command == "start":
            return run_start(args)
        if args.command == "close":
            return run_close(args)
        return run_audit(args)
    except AttemptError as exc:
        print(f"ORCHESTRATION_ATTEMPT_ERROR: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
