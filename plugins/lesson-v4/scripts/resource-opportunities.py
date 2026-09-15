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


def card_kit_units(design: dict) -> list[dict]:
    """Units whose sort the design says children do with printed cards."""
    validator = load_validator()
    return [unit for unit in lesson_units(design) if validator.sort_handled_as_cards(unit)]


def kit_faults(design: dict, stick_in: dict) -> list[str]:
    """Every way the stick-in spec fails to print the kits the design chose.

    The kit's identity is the source unit: its cards are the unit's sort items,
    its headings the unit's groups, its key the unit's structured answer, and
    its acceptance note the unit's acceptanceCondition. A kit that drifts from
    any of these prints a different activity from the one on the board, and a
    unit the design marked `cards` with no kit at all is the silent case this
    check exists for: the pack would look complete with the main activity's
    materials missing.
    """
    faults: list[str] = []
    items = stick_in.get("items") if isinstance(stick_in, dict) else None
    items = items if isinstance(items, list) else []
    kits = {}
    for item in items:
        if not isinstance(item, dict) or item.get("visual") != "card-set":
            continue
        spec = item.get("spec") if isinstance(item.get("spec"), dict) else {}
        unit_id = spec.get("sourceUnitId")
        if not isinstance(unit_id, str):
            faults.append("a card-set item names no sourceUnitId")
            continue
        if unit_id in kits:
            faults.append(f"{unit_id}: two card-set items claim this unit")
            continue
        kits[unit_id] = spec

    units_by_id = {unit.get("sourceUnitId"): unit for unit in lesson_units(design)}
    required = {unit["sourceUnitId"]: unit for unit in card_kit_units(design)}

    for unit_id in kits:
        if unit_id not in units_by_id:
            faults.append(f"{unit_id}: card-set names a unit the design does not have")
        elif unit_id not in required:
            faults.append(
                f"{unit_id}: card-set printed for a unit whose sort is not handled as cards"
            )

    for unit_id, unit in required.items():
        spec = kits.get(unit_id)
        if spec is None:
            faults.append(
                f"{unit_id}: the design handles this sort with printed cards and the "
                "stick-in spec has no card-set for it"
            )
            continue
        task = unit["taskStructure"]
        handling = task.get("handling") or {}
        want_cards = {row["id"]: row["label"] for row in task.get("items") or []}
        want_headings = {row["id"]: row["label"] for row in task.get("groups") or []}
        got_cards = {
            row.get("id"): row.get("label")
            for row in (spec.get("cards") or [])
            if isinstance(row, dict)
        }
        got_headings = {
            row.get("id"): row.get("label")
            for row in (spec.get("headings") or [])
            if isinstance(row, dict)
        }
        if got_cards != want_cards:
            faults.append(f"{unit_id}: card-set cards differ from the unit's sort items")
        if got_headings != want_headings:
            faults.append(f"{unit_id}: card-set headings differ from the unit's groups")

        answer = unit.get("answer") or {}
        structure = answer.get("structure") if isinstance(answer, dict) else None
        want_key = {}
        if isinstance(structure, dict):
            for placement in structure.get("placements") or []:
                if isinstance(placement, dict):
                    want_key[placement.get("itemRef")] = placement.get("groupRef")
        teacher = spec.get("teacher") if isinstance(spec.get("teacher"), dict) else {}
        got_key = {}
        for row in teacher.get("answer") or []:
            if isinstance(row, dict):
                got_key[row.get("cardId")] = row.get("headingId")
        if got_key != want_key:
            faults.append(f"{unit_id}: card-set key differs from the unit's structured answer")
        want_accept = answer.get("acceptanceCondition") if isinstance(answer, dict) else None
        got_accept = teacher.get("alsoAccept")
        if (want_accept or None) != (got_accept or None):
            faults.append(
                f"{unit_id}: card-set alsoAccept differs from the unit's acceptanceCondition"
            )

        sets = spec.get("sets") if isinstance(spec.get("sets"), dict) else {}
        if sets.get("per") != handling.get("per") or (
            handling.get("per") == "group" and sets.get("groupCount") != handling.get("groupCount")
        ):
            faults.append(f"{unit_id}: card-set sets differ from the unit's handling")
        if (teacher.get("where") or "").strip() != (handling.get("where") or "").strip():
            faults.append(f"{unit_id}: card-set teacher.where differs from the unit's handling.where")
    return faults


def read_object(path: Path, label: str):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"RESOURCE_OPPORTUNITIES_ERROR: {exc}", file=sys.stderr)
        return None
    if not isinstance(data, dict):
        print(f"RESOURCE_OPPORTUNITIES_ERROR: {label} is not an object", file=sys.stderr)
        return None
    return data


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="resource", required=True)
    stick = sub.add_parser("stick-in", help="decide whether the stick-in designer launches")
    stick.add_argument("--lesson-design", required=True, type=Path)
    kits = sub.add_parser(
        "stick-in-kits",
        help="check that every sort the design handles with cards has a faithful card-set in the stick-in spec",
    )
    kits.add_argument("--lesson-design", required=True, type=Path)
    kits.add_argument("--stick-in", required=True, type=Path)
    args = parser.parse_args(argv)

    design = read_object(args.lesson_design, "lesson-design.json")
    if design is None:
        return 1

    if args.resource == "stick-in-kits":
        stick_in = read_object(args.stick_in, "stick-in-sheets.json")
        if stick_in is None:
            return 1
        faults = kit_faults(design, stick_in)
        if faults:
            for fault in faults:
                print(f"STICK_IN_KIT_FAULT: {fault}")
            return 1
        count = len(card_kit_units(design))
        print(f"STICK_IN_KITS_OK: {count} card kit{'s' if count != 1 else ''} required, all present and faithful")
        return 0

    state, detail = stick_in_decision(design)
    if state == "skip":
        print(f"STICK_IN_SKIP: {detail}")
    else:
        print("STICK_IN_LAUNCH")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
