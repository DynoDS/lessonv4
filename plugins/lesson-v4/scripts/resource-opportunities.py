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
import re
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


# The words a task uses when the child has to take the source's own words into
# their answer, or mark the source itself. A beat that asks this needs the
# source in the child's hands: a child quoting from the board copies it wrongly
# or slowly, and nobody can underline a line that is on the wall.
QUOTING_PHRASES = (
    "own words",
    "words from",
    "words that show",
    "quote",
    "copy the words",
    "underline",
    "circle the",
    "highlight",
)


def pupil_words(unit: dict) -> str:
    """Everything this beat puts in front of the class, lower-cased."""
    parts: list[str] = []

    def walk(value):
        if isinstance(value, str):
            parts.append(value)
        elif isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            for item in value.values():
                walk(item)

    walk(unit.get("content"))
    walk(unit.get("pupilInstruction"))
    walk(unit.get("taskStructure"))
    return " ".join(parts).lower()


def works_from_a_source(unit: dict) -> bool:
    words = pupil_words(unit)
    return any(phrase in words for phrase in QUOTING_PHRASES)


def is_main_activity(unit: dict) -> bool:
    """A Do beat the size of a main activity: children are handed something to
    work into, so it is not a question answered on whiteboards where they sit.

    The distinction is the teacher's own (18 September 2026): a quick
    underline-the-line is whiteboard work, and the beat that needs *both* an
    extract to read and a table to fill is a main activity in miniature, which
    is the one that has to arrive fully resourced.
    """
    if unit.get("kind") != "do":
        return False
    refs = unit.get("representationRefs")
    if isinstance(refs, list) and any(
        isinstance(ref, dict) and ref.get("interaction") in {"pupil-uses", "pupil-writes-on"}
        for ref in refs
    ):
        return True
    return isinstance(unit.get("taskStructure"), dict) and bool(unit["taskStructure"])


def source_faults(design: dict, stick_in: dict) -> list[str]:
    """A main-activity Do beat that works from a source needs that source printed.

    A Year 4 history record beat asked children to describe Patience Kershaw's
    working conditions using her own words, with her account only on the board,
    while the same lesson's worksheet printed a second account for exactly that
    reason. The beat read as fully specified and the material it depended on was
    on the wall, so nothing failed and the class copied a quotation across the
    room. Only main-activity beats are checked: the quick marking beat the
    teacher would run on whiteboards is left alone.
    """
    faults: list[str] = []
    items = stick_in.get("items") if isinstance(stick_in, dict) else None
    items = items if isinstance(items, list) else []
    printed = any(
        isinstance(item, dict) and item.get("visual") in {"source-text", "source-copy"}
        for item in items
    )
    for unit in lesson_units(design):
        if not is_main_activity(unit) or not works_from_a_source(unit):
            continue
        if printed:
            continue
        faults.append(
            f"{unit.get('sourceUnitId')}: this beat hands children something to work into and asks "
            "them to use the source's own words, and the stick-in spec prints no source for them to "
            "work from. Give it a `source-text` (an account, a letter, an extract) or a `source-copy` "
            "(a picture), normally one between two, or change the beat so the words are not needed"
        )
    return faults


def kit_faults(design: dict, stick_in: dict, photo_files: dict | None = None) -> list[str]:
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
    kit_items_by_unit = {}
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
        kit_items_by_unit[unit_id] = item

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
        # A card is everything children read on it: the label and, when the
        # unit gives one, the detail. Comparing labels alone let a kit drop
        # the account a card existed to carry and still pass.
        want_cards = {
            row["id"]: (row["label"], row.get("detail") or None, row.get("photoRef") or None)
            for row in task.get("items") or []
        }
        want_headings = {row["id"]: row["label"] for row in task.get("groups") or []}
        got_cards = {
            row.get("id"): (row.get("label"), row.get("detail") or None, row.get("photoRef") or None)
            for row in (spec.get("cards") or [])
            if isinstance(row, dict)
        }
        # A picture card prints the picture the board shows for that item, so
        # the kit's card names the same photoRef and the published filename it
        # resolves to. A picture dropped, added or swapped is a different task.
        for row in spec.get("cards") or []:
            if not isinstance(row, dict):
                continue
            ref, image = row.get("photoRef") or None, row.get("imagePath") or None
            if ref and not image:
                faults.append(f"{unit_id}: card {row.get('id')} has a picture but no imagePath, so it would print without it")
            elif image and not ref:
                faults.append(f"{unit_id}: card {row.get('id')} prints a picture its sort item does not have")
            elif ref and image and photo_files and photo_files.get(ref) and photo_files[ref] != image:
                faults.append(
                    f"{unit_id}: card {row.get('id')} prints {image}, but {ref} is {photo_files[ref]}"
                )
        if (spec.get("instruction") or "").strip() != (unit.get("pupilInstruction") or "").strip():
            faults.append(f"{unit_id}: card-set instruction differs from the unit's pupilInstruction")
        if not isinstance(kit_items_by_unit.get(unit_id, {}).get("tag"), str) or not kit_items_by_unit[unit_id]["tag"].strip():
            faults.append(
                f"{unit_id}: card-set has no tag, so a card found after cutting could not be "
                "matched back to its activity"
            )
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

        if (spec.get("form") or "cards") != handling.get("kind"):
            faults.append(
                f"{unit_id}: card-set form is {spec.get('form') or 'cards'} but the unit's handling is "
                f"{handling.get('kind')}, so the pack would print a different activity"
            )
        sets = spec.get("sets") if isinstance(spec.get("sets"), dict) else {}
        if sets.get("per") != handling.get("per") or (
            handling.get("per") == "group" and sets.get("groupCount") != handling.get("groupCount")
        ):
            faults.append(f"{unit_id}: card-set sets differ from the unit's handling")
        if (teacher.get("where") or "").strip() != (handling.get("where") or "").strip():
            faults.append(f"{unit_id}: card-set teacher.where differs from the unit's handling.where")
    faults.extend(level_faults(design, items))
    return faults


# Which stick-in visuals print each `levels.printed.form` (validate-lesson-design.py
# PRINTED_FORMS). A sort is checked above, card by card; the rest are checked
# here for being there at all, because a printed level the lesson promised and
# the pack forgot is the Shaftesbury fault (1 October 2026): the plan said
# "To print: Sarah's words" and nothing made sure it arrived.
SOURCE_VISUALS = {"source-text", "source-copy"}
TASK_VISUALS = {"task-sheet"}
NOT_FIGURES = {"card-set", *SOURCE_VISUALS, *TASK_VISUALS}


def item_unit(item: dict) -> str | None:
    spec = item.get("spec") if isinstance(item.get("spec"), dict) else {}
    unit_id = item.get("sourceUnitId") or spec.get("sourceUnitId")
    return unit_id if isinstance(unit_id, str) else None


# A sheet whose task asks for writing names where each answer goes. Three
# lessons of the 7 October 2026 stress test printed an activity with nowhere to
# write (three sums with no box, eight coordinates with no line) and nothing
# noticed, because a figure page builds happily without one. Read from the
# task's own words, so a task that asks for writing in other words is not seen.
ASKS_FOR_WRITING = re.compile(r"\b(write|writes|written|record|explain|complete the)\b", re.IGNORECASE)
HOLDS_ITS_OWN_WRITING = {
    "table", "tally-chart", "draw-box-row", "geographical-description-frame", "label-diagram",
    "number-line", "place-value-chart", "part-whole-model", "pyramid", "mult-grid", "number-network",
}
NOT_CHECKED_FOR_WRITING = {"card-set", "source-text", "task-sheet"}


def has_writing_place(item: dict) -> bool:
    spec = item.get("spec") if isinstance(item.get("spec"), dict) else {}
    write = item.get("write")
    if isinstance(write, list) and any(isinstance(entry, str) and entry.strip() for entry in write):
        return True
    if isinstance(write, str) and write.strip():
        return True
    return item.get("visual") in HOLDS_ITS_OWN_WRITING or bool(spec.get("writeOnLabels"))


def writing_place_notes(stick_in: dict) -> list[str]:
    """Each whole-page sheet whose task asks children to write and names no
    place for it. A note, never a fault: the teacher still gets the sheet."""
    items = stick_in.get("items") if isinstance(stick_in, dict) else None
    sheets: dict[str, list[dict]] = {}
    for index, item in enumerate(items if isinstance(items, list) else []):
        if not isinstance(item, dict) or item.get("visual") in NOT_CHECKED_FOR_WRITING:
            continue
        if item.get("layout") == "slips":
            continue
        sheet = item.get("sheet") if isinstance(item.get("sheet"), str) and item.get("sheet").strip() else None
        key = f"sheet:{sheet.strip()}" if sheet else (item_unit(item) or f"item:{index}")
        sheets.setdefault(key, []).append(item)
    notes: list[str] = []
    for group in sheets.values():
        tasks = []
        for item in group:
            spec = item.get("spec") if isinstance(item.get("spec"), dict) else {}
            task = item.get("task") or spec.get("task")
            if isinstance(task, str):
                tasks.append(task)
        asking = any(ASKS_FOR_WRITING.search(task) for task in tasks)
        if not asking or any(has_writing_place(item) for item in group):
            continue
        first = group[0]
        name = first.get("sheet") or first.get("label") or first.get("visual")
        notes.append(
            f'"{name}": the task asks children to write and the sheet names no '
            "place for it. List each answer in `write`, or set `\"write\": \"on the figure\"` when "
            "the figure itself holds every answer"
        )
    return notes


def level_faults(design: dict, items: list) -> list[str]:
    """Every beat whose `levels.printed` the design set has its printed piece,
    in the form it chose, named back to it by `sourceUnitId`."""
    faults: list[str] = []
    by_unit: dict[str, list[dict]] = {}
    for item in items:
        if isinstance(item, dict) and item_unit(item):
            by_unit.setdefault(item_unit(item), []).append(item)
    for unit in lesson_units(design):
        levels = unit.get("levels")
        printed = levels.get("printed") if isinstance(levels, dict) else None
        if not isinstance(printed, dict) or printed.get("form") == "sort":
            continue
        unit_id = unit.get("sourceUnitId")
        form = printed.get("form")
        visuals = {item.get("visual") for item in by_unit.get(unit_id, [])}
        if form == "source":
            ok = bool(visuals & SOURCE_VISUALS)
        elif form == "task":
            ok = bool(visuals & TASK_VISUALS)
        else:
            ok = bool(visuals - NOT_FIGURES)
        if not ok:
            faults.append(
                f"{unit_id}: the design prints this beat as a {form} sheet ({printed.get('what')}) and the "
                f"stick-in spec has no {form} piece naming this unit in sourceUnitId"
            )
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
        # The published filename each photoRef resolves to, read from the photo
        # contract beside the design when there is one, so a picture card is
        # checked against the picture the board shows.
        photo_files: dict = {}
        contract_path = args.lesson_design.parent / "photo-requirements.json"
        if contract_path.exists():
            contract = read_object(contract_path, "photo-requirements.json") or {}
            for row in contract.get("photos") or []:
                if isinstance(row, dict) and isinstance(row.get("id"), str) and isinstance(row.get("filename"), str):
                    photo_files[row["id"]] = row["filename"]
        faults = kit_faults(design, stick_in, photo_files)
        for fault in faults:
            print(f"STICK_IN_KIT_FAULT: {fault}")
        sources = source_faults(design, stick_in)
        for fault in sources:
            print(f"STICK_IN_SOURCE_FAULT: {fault}")
        for note in writing_place_notes(stick_in):
            print(f"STICK_IN_WRITING_PLACE: {note}")
        if faults or sources:
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
