#!/usr/bin/env python3
"""Freeze the approved design and prove each writer stayed inside its lane.

The design chain edits one canonical lesson-design.json in place, so the
approved wording specs are destroyed at exactly the moment they become the
reference everything downstream should be checked against. This tool is the
repair: `snapshot` copies the approved state to an immutable file, and
`check` diffs a writer's output against its baseline, refusing any change
outside that writer's ownership:

- author:    only values that were wording specs may change, none of them
             under `worksheet`, and nothing may be added or removed;
- worksheet: changes only under `worksheet`, with the approved brief fields
             (status, shape, demand, refs and the rest) untouched;
- review:    string values may be reworded in place, nothing added, removed
             or restructured, and planning metadata left alone.

The photograph contract is nobody's in this phase: it must be byte-identical
to its approved snapshot at every check.

A violation is recoverable by construction: the baseline file is the valid
prior state, so the orchestrator restores it and relaunches the role once.
"""
from __future__ import annotations

import importlib.util
import json
import shutil
import sys
from pathlib import Path

_validator_spec = importlib.util.spec_from_file_location(
    "validate_lesson_design", Path(__file__).with_name("validate-lesson-design.py")
)
assert _validator_spec and _validator_spec.loader
_validator = importlib.util.module_from_spec(_validator_spec)
_validator_spec.loader.exec_module(_validator)

WORDING_MARKER = _validator.WORDING_MARKER
PLANNING_KEYS = _validator.PLANNING_KEYS

REPORT_LIMIT = 10

# Worksheet fields that carry the approved brief; the worksheet content
# designer writes the sheet the brief describes, never a different brief.
PROTECTED_WORKSHEET_FIELDS = (
    "status",
    "resourceMode",
    "use",
    "activityArchitecture",
    "sheetShape",
    "demand",
    "answerKeyMode",
    "successCriteriaRefs",
    "stickyKnowledgeRefs",
    "providedWorksheet",
)


def is_spec(value: object) -> bool:
    return isinstance(value, str) and value.lstrip().startswith(WORDING_MARKER)


def flatten(node: object, path: tuple, out: dict) -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            flatten(value, path + (key,), out)
        return
    if isinstance(node, list):
        for index, value in enumerate(node):
            flatten(value, path + (index,), out)
        return
    out[path] = node


def show(path: tuple) -> str:
    text = "lesson-design.json"
    for part in path:
        text += f"[{part}]" if isinstance(part, int) else f".{part}"
    return text


def leaf_key(path: tuple) -> str | None:
    for part in reversed(path):
        if isinstance(part, str):
            return part
    return None


def load(path: str) -> object:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def check(stage: str, baseline: object, current: object) -> list[str]:
    base: dict = {}
    curr: dict = {}
    flatten(baseline, (), base)
    flatten(current, (), curr)
    faults: list[str] = []

    added = set(curr) - set(base)
    removed = set(base) - set(curr)
    changed = [p for p in set(base) & set(curr) if base[p] != curr[p]]

    def in_worksheet(path: tuple) -> bool:
        return bool(path) and path[0] == "worksheet"

    if stage == "author":
        for p in sorted(added):
            faults.append(f"{show(p)} was added - the author only replaces wording specs")
        for p in sorted(removed):
            faults.append(f"{show(p)} was removed - the author only replaces wording specs")
        for p in sorted(changed):
            if in_worksheet(p):
                faults.append(
                    f"{show(p)} changed inside `worksheet` - the worksheet is "
                    "not the author's"
                )
            elif not is_spec(base[p]):
                faults.append(
                    f"{show(p)} changed but was not a wording spec - a settled "
                    "decision was rewritten"
                )
    elif stage == "worksheet":
        for p in sorted(added | removed | set(changed)):
            if not in_worksheet(p):
                faults.append(
                    f"{show(p)} changed outside `worksheet` - not this "
                    "designer's to touch"
                )
        base_ws = baseline.get("worksheet", {}) if isinstance(baseline, dict) else {}
        curr_ws = current.get("worksheet", {}) if isinstance(current, dict) else {}
        for field in PROTECTED_WORKSHEET_FIELDS:
            if base_ws.get(field) != curr_ws.get(field):
                faults.append(
                    f"lesson-design.json.worksheet.{field} changed - the "
                    "approved brief is the architect's, and the sheet must be "
                    "the sheet it describes"
                )
    elif stage == "review":
        for p in sorted(added):
            faults.append(f"{show(p)} was added - a review rewords, it does not restructure")
        for p in sorted(removed):
            faults.append(f"{show(p)} was removed - a review rewords, it does not restructure")
        for p in sorted(changed):
            if not (isinstance(base[p], str) and isinstance(curr[p], str)):
                faults.append(
                    f"{show(p)} changed a non-string value - a review rewords "
                    "strings in place"
                )
            elif leaf_key(p) in PLANNING_KEYS:
                faults.append(
                    f"{show(p)} is planning metadata - never a voice surface, "
                    "never reworded"
                )
    else:
        raise SystemExit(f"unknown stage: {stage}")

    return faults


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if not args:
        print(
            "Usage: check-design-ownership.py snapshot --design D --photos P "
            "--out-design A --out-photos B | check --stage "
            "author|worksheet|review --baseline B --current C "
            "--photos-baseline PB --photos-current PC",
            file=sys.stderr,
        )
        return 2

    command, rest = args[0], args[1:]
    opts = dict(zip(rest[::2], rest[1::2]))

    if command == "snapshot":
        try:
            shutil.copyfile(opts["--design"], opts["--out-design"])
            shutil.copyfile(opts["--photos"], opts["--out-photos"])
        except (KeyError, OSError) as exc:
            print(f"DESIGN_SNAPSHOT_FAILED: {exc}", file=sys.stderr)
            return 1
        print("DESIGN_SNAPSHOT_OK")
        return 0

    if command == "check":
        try:
            faults = check(
                opts["--stage"], load(opts["--baseline"]), load(opts["--current"])
            )
            photos_baseline = Path(opts["--photos-baseline"]).read_bytes()
            photos_current = Path(opts["--photos-current"]).read_bytes()
        except (KeyError, OSError, json.JSONDecodeError) as exc:
            print(f"DESIGN_OWNERSHIP_ERROR: {exc}", file=sys.stderr)
            return 2
        if photos_baseline != photos_current:
            faults.append(
                "photo-requirements.json changed - the photograph contract is "
                "the architect's, finished before the words phase"
            )
        if faults:
            shown = faults[:REPORT_LIMIT]
            remainder = len(faults) - len(shown)
            tail = f"; and {remainder} more" if remainder else ""
            print(
                "DESIGN_OWNERSHIP_VIOLATION: " + "; ".join(shown) + tail,
                file=sys.stderr,
            )
            return 1
        print("DESIGN_OWNERSHIP_OK")
        return 0

    print(f"unknown command: {command}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
