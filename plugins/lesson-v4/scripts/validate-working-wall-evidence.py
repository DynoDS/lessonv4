#!/usr/bin/env python3
"""Read-only validator for working-wall visual evidence.

The working-wall builder inspects every rendered page and records what it saw
in ``working-wall-build-evidence.json``. This validator proves that record
against the spec and the built file, so "Built" means the promised visuals and
numbered steps were actually verified on the page, not assumed.

    python validate-working-wall-evidence.py \
        --spec PATH --evidence PATH --built-output PATH

Exit 0 and print ``WORKING_WALL_EVIDENCE_OK`` when the evidence holds.
Otherwise exit 1 and print every failure found, so one run reports everything
that is wrong rather than one problem at a time.

Standard library only. Writes nothing.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

STEP_LABEL_RE = re.compile(r"^\d+\b")

EXPECTED_FIELD_SETS = {
    "sourceSpec": ("path", "sha256"),
    "builtOutput": ("path", "sha256", "physicalPages"),
    "renderedPage": ("page", "path", "sha256"),
    "promisedVisual": ("sourcePointer", "visible", "largeEnoughForWall", "evidencePage"),
    "numberedStep": ("step", "wrapped", "topAligned", "evidencePage"),
    "card": (
        "cardIndex",
        "cardType",
        "cardTitle",
        "promisedVisuals",
        "numberedSteps",
        "verdict",
    ),
}

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def pointer_escape(part: object) -> str:
    return str(part).replace("~", "~0").replace("/", "~1")


def collect_visuals(node: object, pointer: str, out: list[str]) -> None:
    """Recursively collect JSON pointers to every promised visual.

    A promised visual is a ``photo`` string, a ``visual`` object, a resolved
    ``picture.imagePath`` string, or a complete emoji ``picture.value`` string
    anywhere below the card - except anything under a ``decorations`` key,
    which is P3 furniture and never a promise.
    """
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "decorations":
                continue
            child_pointer = f"{pointer}/{pointer_escape(key)}"
            if key == "photo" and isinstance(value, str) and value:
                out.append(child_pointer)
            elif key == "visual" and value:
                out.append(child_pointer)
            elif key == "picture" and isinstance(value, dict):
                if isinstance(value.get("imagePath"), str) and value.get("imagePath"):
                    out.append(f"{child_pointer}/imagePath")
                elif (
                    value.get("kind") == "emoji"
                    and isinstance(value.get("value"), str)
                    and value.get("value")
                ):
                    out.append(f"{child_pointer}/value")
            collect_visuals(value, child_pointer, out)
    elif isinstance(node, list):
        for index, item in enumerate(node):
            collect_visuals(item, f"{pointer}/{index}", out)


def expected_step_numbers(card: dict) -> list[int]:
    """Numbered worked-example steps, numbered exactly as the renderer does."""
    if card.get("type") != "workedExample":
        return []
    steps = []
    for item in card.get("items") or []:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label") or "").lower()
        if label.startswith("step") or STEP_LABEL_RE.match(label):
            steps.append(len(steps) + 1)
    return steps


def check_path_and_hash(record: dict, fields: tuple[str, ...], label: str,
                        failures: list[str]) -> Path | None:
    path_text = record.get("path")
    recorded_hash = record.get("sha256")
    if not isinstance(path_text, str) or not path_text:
        failures.append(f"{label}: missing or non-string `path`.")
        return None
    if not isinstance(recorded_hash, str) or not SHA256_RE.match(recorded_hash):
        failures.append(f"{label}: `sha256` must be a lowercase 64-digit hex digest.")
        return None
    path = Path(path_text)
    if not path.is_absolute():
        failures.append(f"{label}: path must be absolute: {path_text}")
        return None
    if not path.is_file():
        failures.append(f"{label}: path does not exist: {path_text}")
        return None
    actual = sha256_of(path)
    if actual != recorded_hash:
        failures.append(
            f"{label}: SHA-256 mismatch for {path_text} "
            f"(recorded {recorded_hash}, actual {actual})."
        )
    return path


def check_fields(record: object, expected: tuple[str, ...], label: str,
                 failures: list[str]) -> bool:
    if not isinstance(record, dict):
        failures.append(f"{label}: must be an object.")
        return False
    for field in expected:
        if field not in record:
            failures.append(f"{label}: missing required field `{field}`.")
    return True


def validate(spec_arg: str, evidence_arg: str, built_arg: str) -> list[str]:
    failures: list[str] = []

    # ── Parse the two JSON inputs ────────────────────────────────────────
    spec_path = Path(spec_arg)
    if not spec_path.is_file():
        failures.append(f"--spec path does not exist: {spec_arg}")
        return failures
    try:
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        failures.append(f"--spec is not readable JSON: {exc}")
        return failures

    evidence_path = Path(evidence_arg)
    if not evidence_path.is_file():
        failures.append(f"--evidence path does not exist: {evidence_arg}")
        return failures
    try:
        evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        failures.append(f"--evidence is not readable JSON: {exc}")
        return failures

    if not isinstance(evidence, dict):
        failures.append("evidence: root must be an object.")
        return failures

    if evidence.get("schemaVersion") != 1:
        failures.append("evidence: `schemaVersion` must be 1.")

    # ── Every recorded path exists; every recorded hash matches ─────────
    source_spec = evidence.get("sourceSpec")
    if check_fields(source_spec, EXPECTED_FIELD_SETS["sourceSpec"], "sourceSpec", failures):
        recorded = check_path_and_hash(source_spec, EXPECTED_FIELD_SETS["sourceSpec"],
                                       "sourceSpec", failures)
        if recorded is not None and recorded.resolve() != spec_path.resolve():
            failures.append(
                f"sourceSpec: path {recorded} is not the --spec file {spec_path}."
            )

    built_output = evidence.get("builtOutput")
    physical_pages = None
    if check_fields(built_output, EXPECTED_FIELD_SETS["builtOutput"], "builtOutput", failures):
        recorded = check_path_and_hash(built_output, EXPECTED_FIELD_SETS["builtOutput"],
                                       "builtOutput", failures)
        if recorded is not None and recorded.resolve() != Path(built_arg).resolve():
            failures.append(
                f"builtOutput: path {recorded} is not the --built-output file {built_arg}."
            )
        physical_pages = built_output.get("physicalPages")
        if not isinstance(physical_pages, int) or isinstance(physical_pages, bool) or physical_pages < 0:
            failures.append("builtOutput: `physicalPages` must be a non-negative integer.")
            physical_pages = None
    if not Path(built_arg).is_file():
        failures.append(f"--built-output path does not exist: {built_arg}")

    # ── One numbered rendered-page record per physical page ─────────────
    rendered_pages = evidence.get("renderedPages")
    if not isinstance(rendered_pages, list):
        failures.append("evidence: `renderedPages` must be an array.")
        rendered_pages = []
    seen_pages: dict[int, int] = {}
    for index, page_record in enumerate(rendered_pages):
        label = f"renderedPages[{index}]"
        if not check_fields(page_record, EXPECTED_FIELD_SETS["renderedPage"], label, failures):
            continue
        page_number = page_record.get("page")
        if not isinstance(page_number, int) or isinstance(page_number, bool) or page_number < 1:
            failures.append(f"{label}: `page` must be a positive integer.")
        else:
            seen_pages[page_number] = seen_pages.get(page_number, 0) + 1
        check_path_and_hash(page_record, EXPECTED_FIELD_SETS["renderedPage"], label, failures)
    if physical_pages is not None:
        for page_number in range(1, physical_pages + 1):
            if seen_pages.get(page_number, 0) == 0:
                failures.append(f"renderedPages: no record for physical page {page_number}.")
        for page_number, count in sorted(seen_pages.items()):
            if count > 1:
                failures.append(
                    f"renderedPages: physical page {page_number} has {count} records; expected one."
                )
            if page_number > physical_pages:
                failures.append(
                    f"renderedPages: page {page_number} exceeds the recorded "
                    f"physical page count {physical_pages}."
                )

    # ── Cards: promised visuals and numbered steps ───────────────────────
    cards = evidence.get("cards")
    if not isinstance(cards, list):
        failures.append("evidence: `cards` must be an array.")
        cards = []
    cards_by_index: dict[int, dict] = {}
    for index, card_record in enumerate(cards):
        label = f"cards[{index}]"
        if not check_fields(card_record, EXPECTED_FIELD_SETS["card"], label, failures):
            continue
        card_index = card_record.get("cardIndex")
        if not isinstance(card_index, int) or isinstance(card_index, bool) or card_index < 0:
            failures.append(f"{label}: `cardIndex` must be a non-negative integer.")
        elif card_index in cards_by_index:
            failures.append(f"{label}: duplicate record for cardIndex {card_index}.")
        else:
            cards_by_index[card_index] = card_record

    spec_cards = spec.get("cards") if isinstance(spec, dict) else None
    if not isinstance(spec_cards, list):
        failures.append("spec: `cards` must be an array.")
        spec_cards = []

    for card_index, card in enumerate(spec_cards):
        if not isinstance(card, dict):
            continue
        pointer_base = f"/cards/{card_index}"
        expected_visuals: list[str] = []
        collect_visuals(card, pointer_base, expected_visuals)
        expected_steps = expected_step_numbers(card)

        record = cards_by_index.get(card_index)
        promised = []
        steps_recorded = []
        if record is not None:
            if record.get("cardType") != card.get("type"):
                failures.append(
                    f"cards[{card_index}]: cardType {record.get('cardType')!r} does not "
                    f"match spec type {card.get('type')!r}."
                )
            expected_title = card.get("title") or ""
            if record.get("cardTitle") != expected_title:
                failures.append(
                    f"cards[{card_index}]: cardTitle {record.get('cardTitle')!r} does not "
                    f"match spec title {expected_title!r}."
                )
            if record.get("verdict") != "PASS":
                failures.append(
                    f"cards[{card_index}]: verdict is {record.get('verdict')!r}; expected \"PASS\"."
                )
            promised_raw = record.get("promisedVisuals")
            if not isinstance(promised_raw, list):
                failures.append(f"cards[{card_index}]: `promisedVisuals` must be an array.")
            else:
                promised = promised_raw
            steps_raw = record.get("numberedSteps")
            if not isinstance(steps_raw, list):
                failures.append(f"cards[{card_index}]: `numberedSteps` must be an array.")
            else:
                steps_recorded = steps_raw
        elif expected_visuals or expected_steps:
            failures.append(
                f"cards[{card_index}]: no evidence card record for a card with "
                f"{len(expected_visuals)} promised visual(s) and {len(expected_steps)} numbered step(s)."
            )

        # Every collected visual: exactly one matching sourcePointer.
        for pointer in expected_visuals:
            matches = [
                entry for entry in promised
                if isinstance(entry, dict) and entry.get("sourcePointer") == pointer
            ]
            if not matches:
                failures.append(
                    f"cards[{card_index}]: promised visual {pointer} has no matching "
                    f"sourcePointer record."
                )
                continue
            if len(matches) > 1:
                failures.append(
                    f"cards[{card_index}]: promised visual {pointer} has {len(matches)} "
                    f"sourcePointer records; expected one."
                )
            entry = matches[0]
            check_fields(entry, EXPECTED_FIELD_SETS["promisedVisual"],
                         f"cards[{card_index}] promisedVisual {pointer}", failures)
            evidence_page = entry.get("evidencePage")
            if (
                not isinstance(evidence_page, int)
                or isinstance(evidence_page, bool)
                or evidence_page not in seen_pages
            ):
                failures.append(
                    f"cards[{card_index}]: promised visual {pointer} names invalid "
                    f"evidencePage {evidence_page!r}."
                )
            if entry.get("visible") is not True:
                failures.append(
                    f"cards[{card_index}]: promised visual {pointer} is not recorded visible."
                )
            if entry.get("largeEnoughForWall") is not True:
                failures.append(
                    f"cards[{card_index}]: promised visual {pointer} is not recorded "
                    f"largeEnoughForWall."
                )

        # Every numbered worked-example step: exactly one numberedSteps entry.
        for step_number in expected_steps:
            matches = [
                entry for entry in steps_recorded
                if isinstance(entry, dict) and entry.get("step") == step_number
            ]
            if not matches:
                failures.append(
                    f"cards[{card_index}]: numbered step {step_number} has no "
                    f"numberedSteps record."
                )
            elif len(matches) > 1:
                failures.append(
                    f"cards[{card_index}]: numbered step {step_number} has {len(matches)} "
                    f"numberedSteps records; expected one."
                )

        # A wrapped step must be recorded top-aligned.
        for entry_index, entry in enumerate(steps_recorded):
            label = f"cards[{card_index}] numberedSteps[{entry_index}]"
            if not check_fields(entry, EXPECTED_FIELD_SETS["numberedStep"], label, failures):
                continue
            step = entry.get("step")
            if not isinstance(step, int) or isinstance(step, bool) or step < 1:
                failures.append(f"{label}: step must be a positive integer.")
            if not isinstance(entry.get("wrapped"), bool):
                failures.append(f"{label}: wrapped must be boolean.")
            if not isinstance(entry.get("topAligned"), bool):
                failures.append(f"{label}: topAligned must be boolean.")
            evidence_page = entry.get("evidencePage")
            if (
                not isinstance(evidence_page, int)
                or isinstance(evidence_page, bool)
                or evidence_page not in seen_pages
            ):
                failures.append(
                    f"{label}: evidencePage {evidence_page!r} does not name a rendered page."
                )
            if entry.get("wrapped") is True and entry.get("topAligned") is not True:
                failures.append(
                    f"{label}: wrapped step {entry.get('step')} is not top-aligned "
                    f"(badge must sit beside the step's first line)."
                )

    # ── Overall verdicts ─────────────────────────────────────────────────
    if evidence.get("verdict") != "PASS":
        failures.append(f"evidence: verdict is {evidence.get('verdict')!r}; expected \"PASS\".")
    evidence_failures = evidence.get("failures")
    if not isinstance(evidence_failures, list):
        failures.append("evidence: `failures` must be an array.")
    elif len(evidence_failures) != 0:
        failures.append(
            f"evidence: `failures` must be empty; it lists {len(evidence_failures)} entr"
            f"{'y' if len(evidence_failures) == 1 else 'ies'}."
        )

    return failures


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate working-wall build evidence against the spec and built output."
    )
    parser.add_argument("--spec", required=True, help="Path to working-wall.json")
    parser.add_argument("--evidence", required=True, help="Path to working-wall-build-evidence.json")
    parser.add_argument("--built-output", required=True, help="Path to the built wall (.pdf or fallback .html)")
    args = parser.parse_args(argv)

    failures = validate(args.spec, args.evidence, args.built_output)
    if failures:
        print(f"WORKING_WALL_EVIDENCE_FAILED: {len(failures)} failure(s):")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("WORKING_WALL_EVIDENCE_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
