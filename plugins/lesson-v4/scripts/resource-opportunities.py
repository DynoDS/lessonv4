#!/usr/bin/env python3
"""Read the approved lesson's own word on whether a printed extra is worth a worker.

    python3 resource-opportunities.py stick-in --lesson-design <lesson-design.json>

Prints exactly one line:

    STICK_IN_LAUNCH
    STICK_IN_SKIP: <the design's reason, verbatim>

The stick-in designer is a whole model worker that, on most lessons, walks the
design and finds nothing to print. The lesson designer already holds every fact
that walk uses, so the approved contract now records the decision, and this
command reads it. Only a `none` the validator accepted skips the worker; a
`candidate`, an `uncertain`, a design written before the field existed, or a
`none` that the lesson's own moments contradict all launch it. The orchestrator
never judges the question itself, because the last time it was asked to, runs
silently skipped resources nobody had decided against.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load_validator():
    spec = importlib.util.spec_from_file_location(
        "validate_lesson_design", HERE / "validate-lesson-design.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def lesson_units(design: dict) -> list[dict]:
    units = [design.get("starter")]
    units.extend(design.get("teachingSequence") or [])
    ending = design.get("ending") or {}
    if ending.get("included") and isinstance(ending.get("beat"), dict):
        units.append(ending["beat"])
    return [unit for unit in units if isinstance(unit, dict)]


def stick_in_decision(design: dict) -> tuple[str, str]:
    """`("launch", why)` or `("skip", reason)` for the stick-in designer."""
    block = design.get("resourceOpportunities")
    if not isinstance(block, dict):
        return "launch", "the design records no resource decision"
    entry = block.get("stickIn")
    if not isinstance(entry, dict):
        return "launch", "the design records no stick-in decision"
    decision = entry.get("decision")
    if decision != "none":
        return "launch", f"the design recorded {decision!r}"
    validator = load_validator()
    for unit in lesson_units(design):
        evidence = validator.write_on_evidence(unit)
        if evidence:
            return "launch", (
                f"the design recorded none but {unit.get('sourceUnitId')} contradicts it: {evidence}"
            )
    reason = entry.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        return "launch", "the design recorded none without a reason"
    return "skip", reason.strip()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="resource", required=True)
    stick = sub.add_parser("stick-in", help="decide whether the stick-in designer launches")
    stick.add_argument("--lesson-design", required=True, type=Path)
    args = parser.parse_args(argv)

    try:
        design = json.loads(args.lesson_design.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"RESOURCE_OPPORTUNITIES_ERROR: {exc}", file=sys.stderr)
        return 1
    if not isinstance(design, dict):
        print("RESOURCE_OPPORTUNITIES_ERROR: lesson-design.json is not an object", file=sys.stderr)
        return 1

    state, detail = stick_in_decision(design)
    if state == "skip":
        print(f"STICK_IN_SKIP: {detail}")
    else:
        print("STICK_IN_LAUNCH")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
