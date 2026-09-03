#!/usr/bin/env python3
"""Validate the authoritative lesson-design.json hand-off and its photo references."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

TOP_LEVEL_FIELDS = {
    "schemaVersion",
    "lesson",
    "teacherOrientation",
    "starter",
    "vocabulary",
    "trimmedVocabulary",
    "representations",
    "successCriteria",
    "stickyKnowledge",
    "misconceptions",
    "concepts",
    "teachingSequence",
    "ending",
    "worksheet",
    "slideDesignNotes",
    "flagsForTeacher",
}

# Fields a design may carry without every saved design and fixture having to
# grow them at once. Present, they are validated as strictly as the rest.
OPTIONAL_TOP_LEVEL_FIELDS = {"resourceOpportunities"}

STRUCTURES = {
    "Skill-based",
    "Content-based",
    "Discovery",
    "Dialogic",
    "Task-Centred",
}
MODELLING_STATES = {
    "Prepared example",
    "Live-complete helper",
    "Question and reference",
    "Physical-demonstration support",
}
INTERACTIONS = {"view", "teacher-completes", "pupil-uses", "pupil-writes-on"}
# The decision a lesson records about each printed extra it might earn. A
# resource designer is launched on `candidate` and `uncertain` (and when the
# block is absent altogether); only a validated `none` lets the run skip it.
RESOURCE_DECISIONS = {"candidate", "none", "uncertain"}
# Task shapes that leave a figure in the child's book to sort or classify into,
# which is the stick-in pedagogy's own test for a printed piece.
WRITE_ON_TASK_KINDS = {"sort", "evidence-classification"}
ANSWER_KINDS = {"exact", "model", "standard", "none"}
ANSWER_DELIVERIES = {"teacher-only", "answer-slide", "visible-in-unit", "none"}
MAIN_ANSWER_SLIDE_KINDS = {
    "starter",
    "your-turn",
    "practise",
    "use-learning",
    "do-task",
    "apply",
    "reflect",
}
TASK_STRUCTURE_KINDS = {"option-bank", "sort", "evidence-classification"}
TASK_GROUP_ID_RE = re.compile(r"^group-\d{3}$")
TASK_FIELD_ID_RE = re.compile(r"^field-\d{3}$")
TASK_ITEM_ID_RE = re.compile(r"^item-\d{3}$")
SC_TYPES = {"steps", "reference-table", "labelled-reference"}
WORKSHEET_STATUSES = {"generated", "provided-by-teacher"}
WORKSHEET_RESOURCE_MODES = {"per-child", "shared-frame"}
WORKSHEET_USES = {"separate-fresh-worksheet", "required-task-resource"}
WORKSHEET_SHAPES = {"question-set", "frame", "stimulus-set", "child-generated", "mixed"}
WORKSHEET_BLOCK_KINDS = {"question", "question-group", "frame", "stimulus-set", "child-generated"}

ID_PATTERNS = {
    "vocabulary": re.compile(r"^vocab-\d{3}$"),
    "representation": re.compile(r"^rep-\d{3}$"),
    "successCriteria": re.compile(r"^sc-\d{3}$"),
    "stickyKnowledge": re.compile(r"^sk-\d{3}$"),
    "misconception": re.compile(r"^mc-\d{3}$"),
    "concept": re.compile(r"^concept-\d{3}$"),
    "photo": re.compile(r"^(?:photo|adaptation-photo)-\d{3}$"),
}

SOURCE_UNIT_RE = re.compile(
    r"^lesson-section/"
    r"(starter|vocabulary|teaching-sequence|apply|reflect)/"
    r"unit-(\d{3})$"
)

ROUTE_KINDS = {
    "Skill-based": {"prepare", "my-turn", "our-turn", "your-turn"},
    "Content-based": {"observe", "teach", "do", "practise"},
    "Discovery": {"question", "explore", "make-sense", "teach-why", "use-learning", "finish"},
    "Dialogic": {"grounding-input", "stimulus", "talk", "stimulus-talk", "synthesise"},
    "Task-Centred": {"set-task", "teach-needed", "plan-checkpoint", "do-task", "share-conclude"},
}

SCRIPT_REQUIRED_KINDS = {
    "my-turn",
    "our-turn",
    "teach",
    "stimulus",
    "stimulus-talk",
    "synthesise",
    "set-task",
    "teach-needed",
    "share-conclude",
    "apply",
    "reflect",
}

UNIT_FIELDS = {
    "sourceUnitId",
    "label",
    "kind",
    "conceptRef",
    "content",
    "pupilInstruction",
    "modellingState",
    "representationRefs",
    "successCriteriaRefs",
    "stickyKnowledgeRefs",
    "misconceptionRefs",
    "photoRefs",
    "speakerNotes",
    "answer",
}
UNIT_OPTIONAL_FIELDS = {"taskStructure"}

SCAFFOLD_PLACEHOLDER = "__LESSON_DESIGN_FILL__"
PLACEHOLDER_REPORT_LIMIT = 10


class ContractError(ValueError):
    pass


def collect_unresolved_scaffold_placeholders(
    node: Any,
    path: str,
    found: list[str],
) -> None:
    if isinstance(node, str):
        if node == SCAFFOLD_PLACEHOLDER:
            found.append(path)
        return

    if isinstance(node, dict):
        for key, value in node.items():
            collect_unresolved_scaffold_placeholders(value, f"{path}.{key}", found)
        return

    if isinstance(node, list):
        for index, value in enumerate(node):
            collect_unresolved_scaffold_placeholders(value, f"{path}[{index}]", found)


def reject_unresolved_scaffold_placeholders(node: Any, path: str) -> None:
    """Report every unresolved placeholder, not only the first one found.

    One reported path reads like a single missed field. When the file is still
    the generated scaffold, that understates the fault badly enough to send a
    repair down the wrong route, so the count and the leading paths are part of
    the diagnosis.
    """
    found: list[str] = []
    collect_unresolved_scaffold_placeholders(node, path, found)

    if not found:
        return

    if len(found) == 1:
        raise ContractError(f"unresolved scaffold placeholder at {found[0]}")

    shown = found[:PLACEHOLDER_REPORT_LIMIT]
    remainder = len(found) - len(shown)
    tail = f", and {remainder} more" if remainder else ""

    raise ContractError(
        f"unresolved scaffold placeholder at {found[0]}: {len(found)} "
        f"placeholders are still unresolved, so this file is the generated "
        f"scaffold rather than a filled design and needs filling throughout, "
        f"not a single-field repair. Unresolved: {', '.join(shown)}{tail}"
    )


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise ContractError(message)


# Where a board objective may stop short of the full one: the tail after any of
# these is enumerated detail, a route or a condition, never the learning itself.
DISPLAYED_LO_CUT_POINTS = (
    ":", ",", "(", " - ", " – ", " — ",
    " using ", " by ", " with ", " including ", " through ",
)


def _normalise_objective(text: str) -> str:
    flat = " ".join(text.split()).strip().rstrip(".").strip().lower()
    return flat[3:] if flat.startswith("to ") else flat


def displayed_lo_is_the_objective_or_its_opening(lo: str, displayed: str) -> bool:
    """True when the board objective is the full objective word for word, or
    its opening words with a tacked-on tail cut off at a natural join."""
    full = _normalise_objective(lo)
    shown = _normalise_objective(displayed)
    if not shown:
        return False
    if shown == full:
        return True
    if not full.startswith(shown):
        return False
    tail = full[len(shown):]
    return any(tail.startswith(cut.rstrip()) for cut in DISPLAYED_LO_CUT_POINTS)


def expect_dict(value: Any, path: str) -> dict[str, Any]:
    expect(isinstance(value, dict), f"{path} must be an object")
    return value


def expect_list(value: Any, path: str) -> list[Any]:
    expect(isinstance(value, list), f"{path} must be an array")
    return value


def expect_string(value: Any, path: str, *, allow_empty: bool = False) -> str:
    expect(isinstance(value, str), f"{path} must be a string")
    if not allow_empty:
        expect(bool(value.strip()), f"{path} must not be empty")
    return value


def expect_nullable_string(value: Any, path: str) -> None:
    expect(value is None or isinstance(value, str), f"{path} must be a string or null")
    if isinstance(value, str):
        expect(bool(value.strip()), f"{path} must be null or a non-empty string")


def expect_bool(value: Any, path: str) -> bool:
    expect(type(value) is bool, f"{path} must be boolean")
    return value


def expect_positive_int(value: Any, path: str) -> int:
    expect(type(value) is int and value > 0, f"{path} must be a positive integer")
    return value


def expect_exact_keys(
    obj: dict[str, Any],
    allowed: set[str],
    required: set[str],
    path: str,
) -> None:
    missing = required - set(obj)
    extra = set(obj) - allowed
    expect(not missing, f"{path} missing fields: {', '.join(sorted(missing))}")
    expect(not extra, f"{path} has unknown fields: {', '.join(sorted(extra))}")


def collect_registry(
    items: Any,
    path: str,
    id_field: str,
    pattern: re.Pattern[str],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    arr = expect_list(items, path)
    by_id: dict[str, dict[str, Any]] = {}
    for index, raw in enumerate(arr):
        item_path = f"{path}[{index}]"
        item = expect_dict(raw, item_path)
        item_id = expect_string(item.get(id_field), f"{item_path}.{id_field}")
        expect(pattern.fullmatch(item_id) is not None, f"{item_path}.{id_field} has invalid format: {item_id}")
        expect(item_id not in by_id, f"duplicate {id_field}: {item_id}")
        by_id[item_id] = item
    return arr, by_id


def validate_ref_list(raw: Any, path: str, valid_ids: set[str]) -> list[str]:
    values = expect_list(raw, path)
    seen: set[str] = set()
    result: list[str] = []
    for index, value in enumerate(values):
        item = expect_string(value, f"{path}[{index}]")
        expect(item in valid_ids, f"{path}[{index}] points to unknown id: {item}")
        expect(item not in seen, f"{path} contains duplicate id: {item}")
        seen.add(item)
        result.append(item)
    return result


def validate_source_unit_id(value: Any, path: str, section: str, ordinal: int) -> str:
    source_id = expect_string(value, path)
    expect(SOURCE_UNIT_RE.fullmatch(source_id) is not None, f"{path} has invalid sourceUnitId: {source_id}")
    expected = f"lesson-section/{section}/unit-{ordinal:03d}"
    expect(source_id == expected, f"{path} must be exactly {expected}")
    return source_id


def validate_task_structure(
    raw: Any,
    path: str,
    *,
    unit_photo_refs: set[str],
) -> dict[str, Any] | None:
    if raw is None:
        return None

    structure = expect_dict(raw, path)
    kind = expect_string(structure.get("kind"), f"{path}.kind")
    expect(kind in TASK_STRUCTURE_KINDS, f"{path}.kind invalid: {kind}")

    if kind == "option-bank":
        expect_exact_keys(
            structure,
            {"kind", "items"},
            {"kind", "items"},
            path,
        )
        items = expect_list(structure["items"], f"{path}.items")
        expect(2 <= len(items) <= 12, f"{path}.items must contain 2 to 12 items")
        item_ids: set[str] = set()
        for index, raw_item in enumerate(items):
            item_path = f"{path}.items[{index}]"
            item = expect_dict(raw_item, item_path)
            expect_exact_keys(
                item,
                {"id", "label"},
                {"id", "label"},
                item_path,
            )
            item_id = expect_string(item["id"], f"{item_path}.id")
            expect(
                TASK_ITEM_ID_RE.fullmatch(item_id) is not None,
                f"{item_path}.id must match item-###",
            )
            expect(
                item_id not in item_ids,
                f"{path}.items contains duplicate id: {item_id}",
            )
            item_ids.add(item_id)
            expect_string(item["label"], f"{item_path}.label")
        return structure

    if kind == "sort":
        expect_exact_keys(
            structure,
            {"kind", "groups", "items"},
            {"kind", "groups", "items"},
            path,
        )
        groups = expect_list(structure["groups"], f"{path}.groups")
        expect(2 <= len(groups) <= 6, f"{path}.groups must contain 2 to 6 groups")
        group_ids: set[str] = set()
        for index, raw_group in enumerate(groups):
            group_path = f"{path}.groups[{index}]"
            group = expect_dict(raw_group, group_path)
            expect_exact_keys(group, {"id", "label"}, {"id", "label"}, group_path)
            group_id = expect_string(group["id"], f"{group_path}.id")
            expect(TASK_GROUP_ID_RE.fullmatch(group_id) is not None, f"{group_path}.id must match group-###")
            expect(group_id not in group_ids, f"{path}.groups contains duplicate id: {group_id}")
            group_ids.add(group_id)
            expect_string(group["label"], f"{group_path}.label")

        items = expect_list(structure["items"], f"{path}.items")
        expect(2 <= len(items) <= 12, f"{path}.items must contain 2 to 12 items")
        item_ids: set[str] = set()
        for index, raw_item in enumerate(items):
            item_path = f"{path}.items[{index}]"
            item = expect_dict(raw_item, item_path)
            expect_exact_keys(
                item,
                {"id", "label", "detail", "photoRef"},
                {"id", "label", "detail", "photoRef"},
                item_path,
            )
            item_id = expect_string(item["id"], f"{item_path}.id")
            expect(TASK_ITEM_ID_RE.fullmatch(item_id) is not None, f"{item_path}.id must match item-###")
            expect(item_id not in item_ids, f"{path}.items contains duplicate id: {item_id}")
            item_ids.add(item_id)
            expect_string(item["label"], f"{item_path}.label")
            expect_nullable_string(item["detail"], f"{item_path}.detail")
            expect_nullable_string(item["photoRef"], f"{item_path}.photoRef")
            if item["photoRef"] is not None:
                expect(
                    item["photoRef"] in unit_photo_refs,
                    f"{item_path}.photoRef must also appear in the source unit photoRefs",
                )
        return structure

    expect_exact_keys(
        structure,
        {"kind", "fields", "items"},
        {"kind", "fields", "items"},
        path,
    )
    fields = expect_list(structure["fields"], f"{path}.fields")
    expect(2 <= len(fields) <= 6, f"{path}.fields must contain 2 to 6 fields")
    field_ids: set[str] = set()
    for index, raw_field in enumerate(fields):
        field_path = f"{path}.fields[{index}]"
        field = expect_dict(raw_field, field_path)
        expect_exact_keys(field, {"id", "label"}, {"id", "label"}, field_path)
        field_id = expect_string(field["id"], f"{field_path}.id")
        expect(TASK_FIELD_ID_RE.fullmatch(field_id) is not None, f"{field_path}.id must match field-###")
        expect(field_id not in field_ids, f"{path}.fields contains duplicate id: {field_id}")
        field_ids.add(field_id)
        expect_string(field["label"], f"{field_path}.label")

    items = expect_list(structure["items"], f"{path}.items")
    expect(2 <= len(items) <= 12, f"{path}.items must contain 2 to 12 items")
    item_ids: set[str] = set()
    for index, raw_item in enumerate(items):
        item_path = f"{path}.items[{index}]"
        item = expect_dict(raw_item, item_path)
        expect_exact_keys(item, {"id", "photoRef"}, {"id", "photoRef"}, item_path)
        item_id = expect_string(item["id"], f"{item_path}.id")
        expect(TASK_ITEM_ID_RE.fullmatch(item_id) is not None, f"{item_path}.id must match item-###")
        expect(item_id not in item_ids, f"{path}.items contains duplicate id: {item_id}")
        item_ids.add(item_id)
        photo_ref = expect_string(item["photoRef"], f"{item_path}.photoRef")
        expect(
            photo_ref in unit_photo_refs,
            f"{item_path}.photoRef must also appear in the source unit photoRefs",
        )

    return structure


def validate_answer_structure(
    raw: Any,
    path: str,
    *,
    task_structure: dict[str, Any] | None,
) -> None:
    expect(task_structure is not None, f"{path} requires a source-unit taskStructure")
    structure = expect_dict(raw, path)
    kind = expect_string(structure.get("kind"), f"{path}.kind")
    expect(kind == task_structure["kind"], f"{path}.kind must match taskStructure.kind")

    item_ids = {item["id"] for item in task_structure["items"]}
    if kind == "option-bank":
        raise ContractError(
            f"{path} is not allowed for taskStructure.kind option-bank; "
            "option-bank answers use answer.content"
        )
    if kind == "sort":
        expect_exact_keys(
            structure,
            {"kind", "placements"},
            {"kind", "placements"},
            path,
        )
        group_ids = {group["id"] for group in task_structure["groups"]}
        placements = expect_list(structure["placements"], f"{path}.placements")
        placed_items: set[str] = set()
        for index, raw_placement in enumerate(placements):
            placement_path = f"{path}.placements[{index}]"
            placement = expect_dict(raw_placement, placement_path)
            expect_exact_keys(
                placement,
                {"itemRef", "groupRef"},
                {"itemRef", "groupRef"},
                placement_path,
            )
            item_ref = expect_string(placement["itemRef"], f"{placement_path}.itemRef")
            group_ref = expect_string(placement["groupRef"], f"{placement_path}.groupRef")
            expect(item_ref in item_ids, f"{placement_path}.itemRef points to unknown item: {item_ref}")
            expect(group_ref in group_ids, f"{placement_path}.groupRef points to unknown group: {group_ref}")
            expect(item_ref not in placed_items, f"{path}.placements contains duplicate itemRef: {item_ref}")
            placed_items.add(item_ref)
        missing = item_ids - placed_items
        expect(not missing, f"{path}.placements missing items: {', '.join(sorted(missing))}")
        return

    expect_exact_keys(
        structure,
        {"kind", "results"},
        {"kind", "results"},
        path,
    )
    field_ids = {field["id"] for field in task_structure["fields"]}
    results = expect_list(structure["results"], f"{path}.results")
    answered_items: set[str] = set()
    for index, raw_result in enumerate(results):
        result_path = f"{path}.results[{index}]"
        result = expect_dict(raw_result, result_path)
        expect_exact_keys(result, {"itemRef", "values"}, {"itemRef", "values"}, result_path)
        item_ref = expect_string(result["itemRef"], f"{result_path}.itemRef")
        expect(item_ref in item_ids, f"{result_path}.itemRef points to unknown item: {item_ref}")
        expect(item_ref not in answered_items, f"{path}.results contains duplicate itemRef: {item_ref}")
        answered_items.add(item_ref)

        values = expect_list(result["values"], f"{result_path}.values")
        answered_fields: set[str] = set()
        for value_index, raw_value in enumerate(values):
            value_path = f"{result_path}.values[{value_index}]"
            value = expect_dict(raw_value, value_path)
            expect_exact_keys(value, {"fieldRef", "value"}, {"fieldRef", "value"}, value_path)
            field_ref = expect_string(value["fieldRef"], f"{value_path}.fieldRef")
            expect(field_ref in field_ids, f"{value_path}.fieldRef points to unknown field: {field_ref}")
            expect(field_ref not in answered_fields, f"{result_path}.values contains duplicate fieldRef: {field_ref}")
            answered_fields.add(field_ref)
            expect_string(value["value"], f"{value_path}.value")
        missing_fields = field_ids - answered_fields
        expect(not missing_fields, f"{result_path}.values missing fields: {', '.join(sorted(missing_fields))}")

    missing_items = item_ids - answered_items
    expect(not missing_items, f"{path}.results missing items: {', '.join(sorted(missing_items))}")


def validate_answer(
    raw: Any,
    path: str,
    *,
    allowed_deliveries: set[str] | None = None,
    task_structure: dict[str, Any] | None = None,
) -> None:
    answer = expect_dict(raw, path)
    expect_exact_keys(
        answer,
        {"kind", "content", "acceptanceCondition", "delivery", "structure"},
        {"kind", "content", "acceptanceCondition", "delivery"},
        path,
    )
    kind = expect_string(answer["kind"], f"{path}.kind")
    delivery = expect_string(answer["delivery"], f"{path}.delivery")
    expect(kind in ANSWER_KINDS, f"{path}.kind invalid: {kind}")
    expect(delivery in ANSWER_DELIVERIES, f"{path}.delivery invalid: {delivery}")
    if allowed_deliveries is not None:
        expect(
            delivery in allowed_deliveries,
            f"{path}.delivery {delivery} is not allowed here",
        )
    expect_nullable_string(answer["content"], f"{path}.content")
    expect_nullable_string(answer["acceptanceCondition"], f"{path}.acceptanceCondition")
    structure = answer.get("structure")

    if kind == "none":
        expect(answer["content"] is None, f"{path}.content must be null when kind is none")
        expect(answer["acceptanceCondition"] is None, f"{path}.acceptanceCondition must be null when kind is none")
        expect(delivery == "none", f"{path}.delivery must be none when kind is none")
        expect(structure is None, f"{path}.structure must be null or absent when kind is none")
    else:
        expect(delivery != "none", f"{path}.delivery must not be none when kind is {kind}")
        if structure is None:
            expect(
                isinstance(answer["content"], str) and answer["content"].strip(),
                f"{path}.content must be a non-empty string when kind is {kind}",
            )
        else:
            expect(answer["content"] is None, f"{path}.content must be null when structure is present")
            expect(task_structure is not None, f"{path}.structure requires a source-unit taskStructure")
            if task_structure["kind"] == "option-bank":
                raise ContractError(
                    f"{path}.structure is not allowed when taskStructure.kind is option-bank; "
                    "use answer.content"
                )
            if task_structure["kind"] == "sort":
                expect(kind == "exact", f"{path}.structure for sort is allowed only when kind is exact")
                expect(answer["acceptanceCondition"] is None, f"{path}.acceptanceCondition must be null for a structured sort")
            else:
                expect(kind == "model", f"{path}.structure for evidence-classification is allowed only when kind is model")
            validate_answer_structure(structure, f"{path}.structure", task_structure=task_structure)


def validate_speaker_notes(raw: Any, path: str) -> None:
    notes = expect_dict(raw, path)
    expect_exact_keys(
        notes,
        {"script", "teacherInfo", "lookFor"},
        {"script", "teacherInfo", "lookFor"},
        path,
    )
    forbidden_answer_markers = (
        "Answer to question(s) on this slide:",
        "Answer/model for this slide:",
    )
    for key in ("script", "teacherInfo", "lookFor"):
        expect_nullable_string(notes[key], f"{path}.{key}")
        if isinstance(notes[key], str):
            expect(
                not any(marker in notes[key] for marker in forbidden_answer_markers),
                f"{path}.{key} must not duplicate the structured answer marker",
            )
    if notes["script"] is not None:
        prefix = "Say to children:"
        expect(notes["script"].startswith(prefix), f"{path}.script must begin with 'Say to children:'")
        expect(notes["script"][len(prefix):].strip(), f"{path}.script must contain words after 'Say to children:'")
    if notes["lookFor"] is not None:
        prefix = "Look for:"
        expect(notes["lookFor"].startswith(prefix), f"{path}.lookFor must begin with 'Look for:'")
        after = notes["lookFor"][len(prefix):].strip()
        expect(after, f"{path}.lookFor must contain guidance after 'Look for:'")
        words = after.split()
        expect(len(words) <= 25, f"{path}.lookFor must be at most 25 words after 'Look for:' (found {len(words)})")


def validate_representation_ref(
    raw: Any,
    path: str,
    rep_by_id: dict[str, dict[str, Any]],
) -> None:
    ref = expect_dict(raw, path)
    expect_exact_keys(
        ref,
        {"ref", "configuration", "interaction"},
        {"ref", "configuration", "interaction"},
        path,
    )
    rep_id = expect_string(ref["ref"], f"{path}.ref")
    expect(rep_id in rep_by_id, f"{path}.ref points to unknown representation: {rep_id}")
    config = expect_string(ref["configuration"], f"{path}.configuration")
    configs = {item["id"] for item in rep_by_id[rep_id]["configurations"]}
    expect(config in configs, f"{path}.configuration unknown for {rep_id}: {config}")
    interaction = expect_string(ref["interaction"], f"{path}.interaction")
    expect(interaction in INTERACTIONS, f"{path}.interaction invalid: {interaction}")


def resolve_representation_configuration(
    ref: dict[str, Any],
    path: str,
    rep_by_id: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    rep = rep_by_id[ref["ref"]]
    for config in rep["configurations"]:
        if config["id"] == ref["configuration"]:
            return config
    raise ContractError(
        f"{path}.configuration points to unknown configuration "
        f"{ref['configuration']} on {ref['ref']}"
    )


def validate_representation_refs(
    raw: Any,
    path: str,
    rep_by_id: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    refs = expect_list(raw, path)
    seen: set[tuple[str, str, str]] = set()
    for index, ref in enumerate(refs):
        ref_path = f"{path}[{index}]"
        validate_representation_ref(ref, ref_path, rep_by_id)
        key = (ref["ref"], ref["configuration"], ref["interaction"])
        expect(key not in seen, f"{path} contains duplicate representation use: {key}")
        seen.add(key)
    return refs


def validate_takeaway(raw: Any, path: str, sticky_ids: set[str]) -> None:
    takeaway = expect_dict(raw, path)
    kind = expect_string(takeaway.get("kind"), f"{path}.kind")
    expect(kind in {"text", "sticky"}, f"{path}.kind must be text or sticky")
    if kind == "text":
        expect_exact_keys(takeaway, {"kind", "text"}, {"kind", "text"}, path)
        expect_string(takeaway["text"], f"{path}.text")
    else:
        expect_exact_keys(takeaway, {"kind", "ref"}, {"kind", "ref"}, path)
        ref = expect_string(takeaway["ref"], f"{path}.ref")
        expect(ref in sticky_ids, f"{path}.ref points to unknown sticky knowledge: {ref}")


def validate_launch(raw: Any, path: str) -> None:
    """The launch of a substantial task: what the lesson has established, a
    good instance beside a weak one, and the steps. Null when children can
    begin from the question alone."""
    if raw is None:
        return
    launch = expect_dict(raw, path)
    keys = {"established", "goodLooksLike", "steps"}
    expect_exact_keys(launch, keys, keys, path)
    expect_string(launch["established"], f"{path}.established")
    expect_nullable_string(launch["goodLooksLike"], f"{path}.goodLooksLike")
    steps = expect_list(launch["steps"], f"{path}.steps")
    for index, step in enumerate(steps):
        expect_string(step, f"{path}.steps[{index}]")


def validate_content(kind: str, raw: Any, path: str, sticky_ids: set[str]) -> None:
    content = expect_dict(raw, path)

    def strings(keys: tuple[str, ...], *, nullable: set[str] | None = None) -> None:
        nullable = nullable or set()
        for key in keys:
            if key in nullable:
                expect_nullable_string(content[key], f"{path}.{key}")
            else:
                expect_string(content[key], f"{path}.{key}")

    if kind == "starter":
        keys = {"activity", "connection", "format", "testQuestionPath"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "connection", "format"))
        expect_nullable_string(content["testQuestionPath"], f"{path}.testQuestionPath")
    elif kind == "prepare":
        keys = {"mode", "activity"}
        expect_exact_keys(content, keys, keys, path)
        mode = expect_string(content["mode"], f"{path}.mode")
        expect(
            mode in {
                "explanation",
                "pattern-investigation",
                "method-comparison",
                "establish-reference",
                "criteria-teaching",
                "bounded-attempt",
            },
            f"{path}.mode invalid: {mode}",
        )
        strings(("activity",))
    elif kind == "my-turn":
        keys = {"example", "modelledExemplar"}
        expect_exact_keys(content, keys, keys, path)
        strings(("example",))
        expect_nullable_string(content["modelledExemplar"], f"{path}.modelledExemplar")
    elif kind == "our-turn":
        keys = {"example", "guidedQuestions"}
        expect_exact_keys(content, keys, keys, path)
        strings(("example",))
        qs = expect_list(content["guidedQuestions"], f"{path}.guidedQuestions")
        expect(bool(qs), f"{path}.guidedQuestions must not be empty")
        for i, q in enumerate(qs):
            expect_string(q, f"{path}.guidedQuestions[{i}]")
    elif kind == "your-turn":
        keys = {"activityArchitecture", "task"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activityArchitecture", "task"))
    elif kind == "observe":
        keys = {"activity", "focus", "evidenceProduced"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "focus", "evidenceProduced"))
    elif kind == "teach":
        keys = {"headline", "explanation", "takeaway", "teachingText", "keyQuestions"}
        expect_exact_keys(content, keys, keys, path)
        strings(("headline",))
        # The teaching of the idea as the child reads it. Null only when the
        # headline, takeaway and visible example already carry it.
        expect_nullable_string(content["explanation"], f"{path}.explanation")
        validate_takeaway(content["takeaway"], f"{path}.takeaway", sticky_ids)
        expect_nullable_string(content["teachingText"], f"{path}.teachingText")
        qs = expect_list(content["keyQuestions"], f"{path}.keyQuestions")
        for i, q in enumerate(qs):
            expect_string(q, f"{path}.keyQuestions[{i}]")
    elif kind == "do":
        keys = {"activity", "format", "task"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "task"))
        expect_nullable_string(content["format"], f"{path}.format")
    elif kind == "practise":
        keys = {"activity", "format", "task", "launch"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "format", "task"))
        validate_launch(content["launch"], f"{path}.launch")
    elif kind == "question":
        keys = {"focus", "prerequisites", "discoveryFocus"}
        expect_exact_keys(content, keys, keys, path)
        strings(("focus", "prerequisites", "discoveryFocus"))
    elif kind == "explore":
        keys = {"activity", "conditionsAndSafety", "evidenceProduced"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "conditionsAndSafety", "evidenceProduced"))
    elif kind == "make-sense":
        keys = {"resultOrPattern", "prompt"}
        expect_exact_keys(content, keys, keys, path)
        strings(("resultOrPattern", "prompt"))
    elif kind == "teach-why":
        keys = {"takeaway", "accurateExplanation", "unsupportedExplanationToCorrect"}
        expect_exact_keys(content, keys, keys, path)
        # The one line children keep; the explanation is the board's short
        # lines that make it mean something.
        validate_takeaway(content["takeaway"], f"{path}.takeaway", sticky_ids)
        strings(("accurateExplanation",))
        expect_nullable_string(content["unsupportedExplanationToCorrect"], f"{path}.unsupportedExplanationToCorrect")
    elif kind == "use-learning":
        keys = {"activity"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity",))
    elif kind == "finish":
        keys = {"purposefulEnding"}
        expect_exact_keys(content, keys, keys, path)
        strings(("purposefulEnding",))
    elif kind == "grounding-input":
        keys = {"input"}
        expect_exact_keys(content, keys, keys, path)
        strings(("input",))
    elif kind == "stimulus":
        keys = {"prompt", "question", "materialOnSlide"}
        expect_exact_keys(content, keys, keys, path)
        strings(("prompt", "question"))
        expect_nullable_string(content["materialOnSlide"], f"{path}.materialOnSlide")
    elif kind == "talk":
        keys = {"format", "discussionQuestion", "sentenceStems", "durationMinutes", "teacherListensFor"}
        expect_exact_keys(content, keys, keys, path)
        strings(("format", "discussionQuestion"))
        stems = expect_list(content["sentenceStems"], f"{path}.sentenceStems")
        for i, stem in enumerate(stems):
            expect_string(stem, f"{path}.sentenceStems[{i}]")
        expect_positive_int(content["durationMinutes"], f"{path}.durationMinutes")
        listens = expect_list(content["teacherListensFor"], f"{path}.teacherListensFor")
        expect(bool(listens), f"{path}.teacherListensFor must not be empty")
        for i, item in enumerate(listens):
            expect_string(item, f"{path}.teacherListensFor[{i}]")
    elif kind == "stimulus-talk":
        keys = {
            "prompt", "question", "materialOnSlide", "format",
            "sentenceStems", "durationMinutes", "teacherListensFor",
        }
        expect_exact_keys(content, keys, keys, path)
        strings(("prompt", "question", "format"))
        expect_nullable_string(content["materialOnSlide"], f"{path}.materialOnSlide")
        stems = expect_list(content["sentenceStems"], f"{path}.sentenceStems")
        for i, stem in enumerate(stems):
            expect_string(stem, f"{path}.sentenceStems[{i}]")
        expect_positive_int(content["durationMinutes"], f"{path}.durationMinutes")
        listens = expect_list(content["teacherListensFor"], f"{path}.teacherListensFor")
        expect(bool(listens), f"{path}.teacherListensFor must not be empty")
        for i, item in enumerate(listens):
            expect_string(item, f"{path}.teacherListensFor[{i}]")
    elif kind == "synthesise":
        keys = {"framesToName"}
        expect_exact_keys(content, keys, keys, path)
        frames = expect_list(content["framesToName"], f"{path}.framesToName")
        expect(bool(frames), f"{path}.framesToName must not be empty")
        for i, item in enumerate(frames):
            expect_string(item, f"{path}.framesToName[{i}]")
    elif kind == "set-task":
        keys = {"question", "investigationBrief"}
        expect_exact_keys(content, keys, keys, path)
        strings(("question",))
        expect_nullable_string(content["investigationBrief"], f"{path}.investigationBrief")
    elif kind == "teach-needed":
        keys = {"enablingInput", "explanation", "modelledOn"}
        expect_exact_keys(content, keys, keys, path)
        strings(("enablingInput", "modelledOn"))
        # The teaching of the idea as the child reads it; null only when the
        # idea and its instance already carry the meaning.
        expect_nullable_string(content["explanation"], f"{path}.explanation")
    elif kind == "plan-checkpoint":
        keys = {"whatChildrenPlan", "checkpointQuestion"}
        expect_exact_keys(content, keys, keys, path)
        strings(("whatChildrenPlan", "checkpointQuestion"))
    elif kind == "do-task":
        keys = {"activity", "launch", "planWithinTask", "checkpointQuestion", "runsBeyondToday", "todayEndsAt"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity",))
        validate_launch(content["launch"], f"{path}.launch")
        expect_nullable_string(content["planWithinTask"], f"{path}.planWithinTask")
        expect_nullable_string(content["checkpointQuestion"], f"{path}.checkpointQuestion")
        expect(
            (content["planWithinTask"] is None) == (content["checkpointQuestion"] is None),
            f"{path}.planWithinTask and checkpointQuestion must both be null or both be non-null",
        )
        if content["planWithinTask"] is not None:
            expect_string(content["planWithinTask"], f"{path}.planWithinTask")
            expect_string(content["checkpointQuestion"], f"{path}.checkpointQuestion")
        expect_bool(content["runsBeyondToday"], f"{path}.runsBeyondToday")
        expect_nullable_string(content["todayEndsAt"], f"{path}.todayEndsAt")
        if content["runsBeyondToday"]:
            expect_string(content["todayEndsAt"], f"{path}.todayEndsAt")
        else:
            expect(content["todayEndsAt"] is None, f"{path}.todayEndsAt must be null when runsBeyondToday is false")
    elif kind == "share-conclude":
        keys = {"activity"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity",))
    elif kind in {"apply", "reflect"}:
        keys = {"activity"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity",))
    else:
        raise ContractError(f"{path} has unsupported source-unit kind: {kind}")


def validate_visual(
    raw: Any,
    path: str,
    rep_by_id: dict[str, dict[str, Any]],
    photo_ids: set[str],
) -> None:
    visual = expect_dict(raw, path)
    kind = expect_string(visual.get("kind"), f"{path}.kind")
    allowed = {"none", "emoji", "photo", "representation", "built-in", "description"}
    expect(kind in allowed, f"{path}.kind invalid: {kind}")
    expect_exact_keys(
        visual,
        {"kind", "value", "photoRef", "representationRef", "configuration"},
        {"kind"},
        path,
    )
    value = visual.get("value")
    photo_ref = visual.get("photoRef")
    rep_ref = visual.get("representationRef")
    configuration = visual.get("configuration")
    if kind == "none":
        expect(value is None and photo_ref is None and rep_ref is None and configuration is None,
               f"{path} kind none must not carry other values")
    elif kind in {"emoji", "built-in", "description"}:
        expect_string(value, f"{path}.value")
        expect(photo_ref is None and rep_ref is None and configuration is None,
               f"{path} kind {kind} may use only value")
    elif kind == "photo":
        ref = expect_string(photo_ref, f"{path}.photoRef")
        expect(ref in photo_ids, f"{path}.photoRef points to unknown initial photo: {ref}")
        expect(value is None and rep_ref is None and configuration is None,
               f"{path} kind photo may use only photoRef")
    else:
        ref = expect_string(rep_ref, f"{path}.representationRef")
        expect(ref in rep_by_id, f"{path}.representationRef points to unknown representation: {ref}")
        config = expect_string(configuration, f"{path}.configuration")
        valid_configs = {item["id"] for item in rep_by_id[ref]["configurations"]}
        expect(config in valid_configs, f"{path}.configuration unknown for {ref}: {config}")
        expect(value is None and photo_ref is None, f"{path} kind representation may use only representationRef/configuration")


def validate_source_unit(
    raw: Any,
    path: str,
    *,
    section: str,
    ordinal: int,
    allowed_kinds: set[str],
    rep_by_id: dict[str, dict[str, Any]],
    sc_ids: set[str],
    sticky_ids: set[str],
    misconception_ids: set[str],
    concept_ids: set[str],
    photo_ids: set[str],
) -> dict[str, Any]:
    unit = expect_dict(raw, path)
    expect_exact_keys(unit, UNIT_FIELDS | UNIT_OPTIONAL_FIELDS, UNIT_FIELDS, path)
    validate_source_unit_id(unit["sourceUnitId"], f"{path}.sourceUnitId", section, ordinal)
    expect_string(unit["label"], f"{path}.label")
    kind = expect_string(unit["kind"], f"{path}.kind")
    expect(kind in allowed_kinds, f"{path}.kind invalid for this section/route: {kind}")

    skill_turn = kind in {"my-turn", "our-turn", "your-turn"}
    if skill_turn:
        concept_ref = expect_string(unit["conceptRef"], f"{path}.conceptRef")
        expect(concept_ref in concept_ids, f"{path}.conceptRef points to unknown concept: {concept_ref}")
    else:
        expect(unit["conceptRef"] is None, f"{path}.conceptRef must be null for {kind}")

    validate_content(kind, unit["content"], f"{path}.content", sticky_ids)
    expect_nullable_string(unit["pupilInstruction"], f"{path}.pupilInstruction")
    modelling = unit["modellingState"]
    if modelling is not None:
        modelling = expect_string(modelling, f"{path}.modellingState")
        expect(
            modelling in MODELLING_STATES,
            f"{path}.modellingState must be null or a canonical modelling state",
        )
    if kind == "my-turn":
        expect(modelling is not None, f"{path}.modellingState is required for My Turn")

    representation_refs = validate_representation_refs(
        unit["representationRefs"],
        f"{path}.representationRefs",
        rep_by_id,
    )

    if kind == "my-turn" and unit["content"]["modelledExemplar"] is not None:
        expect(
            modelling == "Question and reference",
            f"{path}.content.modelledExemplar is valid only for Question and reference My Turn writing",
        )

    if modelling == "Live-complete helper":
        live_refs = [
            ref for ref in representation_refs
            if ref["interaction"] == "teacher-completes"
        ]
        expect(
            bool(live_refs),
            f"{path}.modellingState Live-complete helper requires a teacher-completes representation use",
        )
        expect(
            any(
                resolve_representation_configuration(
                    ref,
                    f"{path}.representationRefs",
                    rep_by_id,
                )["loadBearing"]
                for ref in live_refs
            ),
            f"{path}.modellingState Live-complete helper requires a load-bearing teacher-completes representation configuration",
        )

    validate_ref_list(unit["successCriteriaRefs"], f"{path}.successCriteriaRefs", sc_ids)
    sticky_refs = validate_ref_list(unit["stickyKnowledgeRefs"], f"{path}.stickyKnowledgeRefs", sticky_ids)
    validate_ref_list(unit["misconceptionRefs"], f"{path}.misconceptionRefs", misconception_ids)
    photo_refs = validate_ref_list(unit["photoRefs"], f"{path}.photoRefs", photo_ids)
    task_structure = validate_task_structure(
        unit.get("taskStructure"),
        f"{path}.taskStructure",
        unit_photo_refs=set(photo_refs),
    )
    if task_structure is not None:
        expect(
            unit["pupilInstruction"] is not None,
            f"{path}.pupilInstruction must be non-null when taskStructure is present",
        )
    validate_speaker_notes(unit["speakerNotes"], f"{path}.speakerNotes")
    if kind in SCRIPT_REQUIRED_KINDS:
        expect(
            unit["speakerNotes"]["script"] is not None,
            f"{path}.speakerNotes.script is required for {kind}",
        )

    allowed_answer_deliveries = set(ANSWER_DELIVERIES)
    if kind == "my-turn":
        allowed_answer_deliveries.discard("answer-slide")
    validate_answer(
        unit["answer"],
        f"{path}.answer",
        allowed_deliveries=allowed_answer_deliveries,
        task_structure=task_structure,
    )
    answer_kind = unit["answer"]["kind"]
    answer_delivery = unit["answer"]["delivery"]

    if answer_delivery == "answer-slide":
        expect(
            kind in MAIN_ANSWER_SLIDE_KINDS
            or answer_kind in {"model", "standard"},
            f"{path}.answer.delivery answer-slide is allowed only for a starter, "
            "main independent work, or a model/standard reveal",
        )

    if kind == "starter" and unit["content"]["testQuestionPath"] is not None:
        expect(
            answer_kind == "exact" and answer_delivery == "answer-slide",
            f"{path}.answer must be an exact answer-slide answer when starter.testQuestionPath is present",
        )

    if kind == "my-turn":
        expect(
            answer_kind != "none",
            f"{path}.answer must contain the My Turn answer/model/standard",
        )
        if modelling == "Prepared example":
            expect(
                answer_delivery == "visible-in-unit",
                f"{path}.answer.delivery must be visible-in-unit for Prepared example My Turn",
            )
        else:
            expect(
                answer_delivery == "teacher-only",
                f"{path}.answer.delivery must be teacher-only for non-Prepared My Turn",
            )

    if answer_delivery == "visible-in-unit":
        expect(
            kind in {"my-turn", "teach", "teach-needed"},
            f"{path}.answer.delivery visible-in-unit is allowed only on teacher-presented model units",
        )
        expect(
            modelling == "Prepared example",
            f"{path}.answer.delivery visible-in-unit requires modellingState Prepared example",
        )

    if kind == "teach":
        takeaway = unit["content"]["takeaway"]
        if takeaway["kind"] == "sticky":
            expect(
                takeaway["ref"] in sticky_refs,
                f"{path}.content.takeaway sticky ref must also appear in stickyKnowledgeRefs",
            )

    return unit


def validate_worksheet_content_block(
    raw: Any,
    path: str,
    *,
    rep_by_id: dict[str, dict[str, Any]],
    sticky_ids: set[str],
    photo_ids: set[str],
) -> str:
    block = expect_dict(raw, path)
    kind = expect_string(block.get("kind"), f"{path}.kind")
    expect(kind in WORKSHEET_BLOCK_KINDS, f"{path}.kind invalid: {kind}")
    common = {"id", "kind", "representationRefs", "stickyKnowledgeRefs", "photoRefs"}

    if kind == "question":
        allowed = common | {"pupilPrompt", "response", "support", "visualRequirements", "answer"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-q-\d{3}$", block_id) is not None, f"{path}.id must match ws-q-###")
        expect_string(block["pupilPrompt"], f"{path}.pupilPrompt")
        expect_string(block["response"], f"{path}.response")
        expect_string(block["support"], f"{path}.support", allow_empty=True)
        expect_string(block["visualRequirements"], f"{path}.visualRequirements", allow_empty=True)
        validate_answer(block["answer"], f"{path}.answer", allowed_deliveries={"teacher-only", "none"})

    elif kind == "question-group":
        allowed = common | {"groupPrompt", "parts"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-qg-\d{3}$", block_id) is not None, f"{path}.id must match ws-qg-###")
        expect_nullable_string(block["groupPrompt"], f"{path}.groupPrompt")
        parts = expect_list(block["parts"], f"{path}.parts")
        expect(len(parts) >= 2, f"{path}.parts must contain at least two parts")
        for index, raw_part in enumerate(parts, 1):
            part_path = f"{path}.parts[{index - 1}]"
            part = expect_dict(raw_part, part_path)
            fields = {
                "id", "pupilPrompt", "response", "support", "visualRequirements",
                "representationRefs", "stickyKnowledgeRefs", "photoRefs", "answer",
            }
            expect_exact_keys(part, fields, fields, part_path)
            expected_id = f"{block_id}-part-{index:02d}"
            expect(part["id"] == expected_id, f"{part_path}.id must be exactly {expected_id}")
            expect_string(part["pupilPrompt"], f"{part_path}.pupilPrompt")
            expect_string(part["response"], f"{part_path}.response")
            expect_string(part["support"], f"{part_path}.support", allow_empty=True)
            expect_string(part["visualRequirements"], f"{part_path}.visualRequirements", allow_empty=True)
            validate_representation_refs(part["representationRefs"], f"{part_path}.representationRefs", rep_by_id)
            validate_ref_list(part["stickyKnowledgeRefs"], f"{part_path}.stickyKnowledgeRefs", sticky_ids)
            validate_ref_list(part["photoRefs"], f"{part_path}.photoRefs", photo_ids)
            validate_answer(part["answer"], f"{part_path}.answer", allowed_deliveries={"teacher-only", "none"})

    elif kind == "frame":
        allowed = common | {"sections", "answer"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-frame-\d{3}$", block_id) is not None, f"{path}.id must match ws-frame-###")
        sections = expect_list(block["sections"], f"{path}.sections")
        expect(bool(sections), f"{path}.sections must not be empty")
        for index, raw_section in enumerate(sections):
            section_path = f"{path}.sections[{index}]"
            section = expect_dict(raw_section, section_path)
            expect_exact_keys(
                section,
                {"heading", "whatGoesHere", "noteSpace"},
                {"heading", "whatGoesHere", "noteSpace"},
                section_path,
            )
            expect_string(section["heading"], f"{section_path}.heading")
            expect_string(section["whatGoesHere"], f"{section_path}.whatGoesHere")
            expect_string(section["noteSpace"], f"{section_path}.noteSpace")
        validate_answer(block["answer"], f"{path}.answer", allowed_deliveries={"teacher-only", "none"})

    elif kind == "stimulus-set":
        allowed = common | {"stimulus", "relationship", "pupilAction", "prompts"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-stimulus-\d{3}$", block_id) is not None, f"{path}.id must match ws-stimulus-###")
        for key in ("stimulus", "relationship", "pupilAction"):
            expect_string(block[key], f"{path}.{key}")
        prompts = expect_list(block["prompts"], f"{path}.prompts")
        expect(bool(prompts), f"{path}.prompts must not be empty")
        for index, raw_prompt in enumerate(prompts, 1):
            prompt_path = f"{path}.prompts[{index - 1}]"
            prompt = expect_dict(raw_prompt, prompt_path)
            fields = {
                "id", "pupilPrompt", "response", "support", "visualRequirements",
                "representationRefs", "stickyKnowledgeRefs", "photoRefs", "answer",
            }
            expect_exact_keys(prompt, fields, fields, prompt_path)
            expected_id = f"{block_id}-prompt-{index:02d}"
            expect(prompt["id"] == expected_id, f"{prompt_path}.id must be exactly {expected_id}")
            expect_string(prompt["pupilPrompt"], f"{prompt_path}.pupilPrompt")
            expect_string(prompt["response"], f"{prompt_path}.response")
            expect_string(prompt["support"], f"{prompt_path}.support", allow_empty=True)
            expect_string(prompt["visualRequirements"], f"{prompt_path}.visualRequirements", allow_empty=True)
            validate_representation_refs(prompt["representationRefs"], f"{prompt_path}.representationRefs", rep_by_id)
            validate_ref_list(prompt["stickyKnowledgeRefs"], f"{prompt_path}.stickyKnowledgeRefs", sticky_ids)
            validate_ref_list(prompt["photoRefs"], f"{prompt_path}.photoRefs", photo_ids)
            validate_answer(prompt["answer"], f"{prompt_path}.answer", allowed_deliveries={"teacher-only", "none"})

    else:
        allowed = common | {"generator", "recordingSurface", "firstRowWorked", "answer"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-generated-\d{3}$", block_id) is not None, f"{path}.id must match ws-generated-###")
        expect_string(block["generator"], f"{path}.generator")
        expect_string(block["recordingSurface"], f"{path}.recordingSurface")
        expect_nullable_string(block["firstRowWorked"], f"{path}.firstRowWorked")
        validate_answer(block["answer"], f"{path}.answer", allowed_deliveries={"teacher-only", "none"})

    validate_representation_refs(block["representationRefs"], f"{path}.representationRefs", rep_by_id)
    validate_ref_list(block["stickyKnowledgeRefs"], f"{path}.stickyKnowledgeRefs", sticky_ids)
    validate_ref_list(block["photoRefs"], f"{path}.photoRefs", photo_ids)
    return block_id


def validate_route_sequence(
    structure: str,
    sequence: list[dict[str, Any]],
    concept_items: list[dict[str, Any]],
) -> None:
    kinds = [unit["kind"] for unit in sequence]

    if structure == "Skill-based":
        index = 0
        for concept in concept_items:
            concept_id = concept["id"]
            while index < len(sequence) and sequence[index]["kind"] == "prepare":
                index += 1

            # A concept runs one or more My Turn -> Our Turn cycles, then one Your
            # Turn. Two My Turn units in a row are refused: children must use a
            # modelled move before the next one is taught.
            cycles = 0
            while index < len(sequence) and sequence[index]["kind"] == "my-turn":
                expect(
                    sequence[index]["conceptRef"] == concept_id,
                    f"Skill-based sequence expected My Turn for {concept_id}",
                )
                index += 1
                cycles += 1
                expect(
                    not (index < len(sequence) and sequence[index]["kind"] == "my-turn"),
                    (
                        f"Skill-based concept {concept_id} has two My Turn units in a row. "
                        "Put every example of one modelled move inside that move's own My Turn "
                        "unit, and give a genuinely different move its own cycle with an Our Turn "
                        "between, so each move is used before the next is taught "
                        "(teaching-sequence-skill-based.md, 'Several examples of one move belong "
                        "inside one My Turn unit')"
                    ),
                )
                if index < len(sequence) and sequence[index]["kind"] == "our-turn":
                    expect(
                        sequence[index]["conceptRef"] == concept_id,
                        f"Skill-based Our Turn must use {concept_id}",
                    )
                    index += 1
            expect(cycles >= 1, f"Skill-based concept {concept_id} requires at least one My Turn")

            expect(
                index < len(sequence) and sequence[index]["kind"] == "your-turn",
                (
                    f"Skill-based concept {concept_id} requires Your Turn "
                    "after its My Turn and Our Turn cycles"
                ),
            )
            expect(
                sequence[index]["conceptRef"] == concept_id,
                f"Skill-based Your Turn must use {concept_id}",
            )
            index += 1

        expect(index == len(sequence), "Skill-based sequence has extra or out-of-order units after the final concept")
        return

    if structure == "Content-based":
        index = 0
        pairs = 0
        while index < len(sequence) and sequence[index]["kind"] != "practise":
            if sequence[index]["kind"] == "observe":
                index += 1
                expect(
                    index < len(sequence) and sequence[index]["kind"] == "teach",
                    "Content-based observe must be followed immediately by Teach",
                )
            expect(
                index < len(sequence) and sequence[index]["kind"] == "teach",
                "Content-based sequence must use Teach -> Do pairs before Practise",
            )
            index += 1
            expect(
                index < len(sequence) and sequence[index]["kind"] == "do",
                "Every Content-based Teach must be followed immediately by Do",
            )
            index += 1
            pairs += 1
        expect(pairs >= 1, "Content-based sequence requires at least one Teach -> Do pair")
        expect(
            index == len(sequence) - 1 and sequence[index]["kind"] == "practise",
            "Content-based Practise must occur exactly once and last",
        )
        return

    if structure == "Discovery":
        expected = ["question", "explore", "make-sense", "teach-why", "use-learning", "finish"]
        expect(kinds == expected, f"Discovery sequence must be exactly: {', '.join(expected)}")
        return

    if structure == "Dialogic":
        index = 0
        if sequence and sequence[0]["kind"] == "grounding-input":
            index = 1
        cycles = 0
        while index < len(sequence) and sequence[index]["kind"] != "synthesise":
            if sequence[index]["kind"] == "stimulus-talk":
                index += 1
                cycles += 1
                continue
            expect(
                sequence[index]["kind"] == "stimulus",
                "Dialogic sequence requires Stimulus -> Talk pairs or a combined Stimulus + Talk beat",
            )
            stimulus_question = sequence[index]["content"]["question"]
            index += 1
            expect(
                index < len(sequence) and sequence[index]["kind"] == "talk",
                "Dialogic Stimulus must be followed immediately by Talk",
            )
            expect(
                sequence[index]["content"]["discussionQuestion"] == stimulus_question,
                "Dialogic Talk discussionQuestion must exactly match the preceding Stimulus question",
            )
            index += 1
            cycles += 1
        expect(cycles >= 1, "Dialogic sequence requires at least one discussion cycle")
        expect(
            index == len(sequence) - 1 and sequence[index]["kind"] == "synthesise",
            "Dialogic Synthesise must occur exactly once and last",
        )
        return

    if structure == "Task-Centred":
        index = 0
        expect(sequence[index]["kind"] == "set-task", "Task-Centred sequence must begin with Set the Task")
        index += 1
        while index < len(sequence) and sequence[index]["kind"] == "teach-needed":
            unit = sequence[index]
            index += 1
            if index < len(sequence) and sequence[index]["kind"] == "teach-needed":
                # Children use one enabling idea before the next distinct
                # idea arrives. The last teach-needed may be used by the
                # planning or the task itself; an earlier one carries its
                # own pupil use, or the two ideas are one block of telling.
                expect(
                    unit["pupilInstruction"] is not None,
                    f"teachingSequence[{index - 1}].pupilInstruction must be non-null: "
                    "children use this enabling idea before the next teach-needed unit arrives",
                )
        separate_plan = False
        if index < len(sequence) and sequence[index]["kind"] == "plan-checkpoint":
            separate_plan = True
            index += 1
        expect(
            index < len(sequence) and sequence[index]["kind"] == "do-task",
            "Task-Centred sequence requires Do the Task after any enabling input or separate plan checkpoint",
        )
        do_task = sequence[index]
        if separate_plan:
            expect(
                do_task["content"]["planWithinTask"] is None
                and do_task["content"]["checkpointQuestion"] is None,
                "Task-Centred separate plan-checkpoint cannot coexist with folded planWithinTask/checkpointQuestion",
            )
        index += 1
        if index < len(sequence) and sequence[index]["kind"] == "share-conclude":
            index += 1
        expect(index == len(sequence), "Task-Centred sequence has an extra or out-of-order unit")
        return

    raise ContractError(f"unsupported lesson structure: {structure}")


PHOTO_V2_FIELDS = {
    "id", "subject", "pedagogical_constraint", "teaching_requirement",
    "load_bearing_evidence", "use", "essential", "filename",
    "acquisition_mode", "source_profile", "fallback_action", "fallback_note",
    "generation_prompt", "coherent_group", "coherent_mode",
    "coherent_visual_invariants",
}
PHOTO_USES = {"slide", "worksheet", "both"}
PHOTO_ACQUISITION_MODES = {"authentic-real", "ordinary-real", "controlled-ai"}
PHOTO_SOURCE_PROFILES = {
    "unsplash-only", "wikimedia-only", "unsplash-then-wikimedia",
    "wikimedia-then-unsplash", "none",
}
PHOTO_FALLBACK_ACTIONS = {"ai", "omit", "unsatisfied"}
PHOTO_COHERENT_MODES = {"none", "all-real", "all-generated"}
PHOTO_PROMPT_FIELDS = {
    "physical_state", "must_avoid", "text_rule", "composition"
}


def _photo_nonempty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _photo_filename_safe(value: Any) -> bool:
    if not _photo_nonempty(value) or "\\" in value or value.startswith("/"):
        return False
    parts = value.split("/")
    return all(part not in ("", ".", "..") for part in parts) and value == "/".join(parts)


def _photo_prompt_valid(prompt: Any) -> bool:
    if not isinstance(prompt, dict) or set(prompt) != PHOTO_PROMPT_FIELDS:
        return False
    return (
        _photo_nonempty(prompt.get("physical_state"))
        and isinstance(prompt.get("must_avoid"), list)
        and all(_photo_nonempty(value) for value in prompt["must_avoid"])
        and _photo_nonempty(prompt.get("text_rule"))
        and _photo_nonempty(prompt.get("composition"))
    )


def _photo_route(photo: dict[str, Any]) -> str:
    return "ai" if photo["acquisition_mode"] == "controlled-ai" else "real"


# The picture contract says what a picture must show. It has no field meaning
# "fetch this exact file", because fetching is the Image Scout's job and the
# scout searches by subject: Unsplash and Wikimedia, then Openverse, then - for
# a picture the lesson cannot do without - the holding institution's own page on
# the open web. A URL written into a picture object is therefore not an
# acquisition instruction. It is the reliable sign that the designer went
# hunting for image files instead of describing the evidence, which is both the
# slow way round and a promise nothing downstream can keep.
#
# A Year 4 history lesson (3 September 2026) did exactly that: it found five
# ideal archive photographs, could not express "fetch this file", wrote the
# source pages into `pedagogical_constraint` beside the sentence "the schema
# only permits Wikimedia/Unsplash routes", and shipped anyway. The teacher got a
# working wall and nothing else. Named as subjects rather than as links - "the
# Ford End School classroom around 1900, held by Essex Record Office" - the same
# five are now inside the scout's reach.
_PHOTO_URL_RE = re.compile(r"(?:\bhttps?://|\bwww\.\S)", re.IGNORECASE)


def _photo_text_values(photo: dict[str, Any]):
    for field in ("subject", "pedagogical_constraint", "teaching_requirement", "fallback_note"):
        value = photo.get(field)
        if isinstance(value, str):
            yield field, value
    evidence = photo.get("load_bearing_evidence")
    if isinstance(evidence, list):
        for index, value in enumerate(evidence):
            if isinstance(value, str):
                yield f"load_bearing_evidence[{index}]", value
    prompt = photo.get("generation_prompt")
    if isinstance(prompt, dict):
        for key, value in prompt.items():
            if isinstance(value, str):
                yield f"generation_prompt.{key}", value
            elif isinstance(value, list):
                for index, item in enumerate(value):
                    if isinstance(item, str):
                        yield f"generation_prompt.{key}[{index}]", item


def validate_photo_contract_v2(photos: Any, *, initial_photo_namespace: bool = False):
    """Validate the complete semantic picture contract, independently of routing."""
    root = expect_dict(photos, "photo-requirements.json")
    expect_exact_keys(root, {"schema_version", "lesson_name", "photos"},
                      {"schema_version", "lesson_name", "photos"},
                      "photo-requirements.json")
    expect(type(root["schema_version"]) is int and root["schema_version"] == 2,
           "photo-requirements.json schema_version must be 2")
    expect_string(root["lesson_name"], "photo-requirements.json.lesson_name")
    items = root["photos"]
    expect(isinstance(items, list), "photo-requirements.json.photos must be a list")
    # 16 is the lesson designer's budget; the run may reach 24 once a helper,
    # a repair or an adaptation adds a picture the design could not foresee.
    # This validator also runs after those merges, so it enforces the run
    # ceiling and check-photo-cap.py holds the design budget at its own gate.
    if len(items) > 24:
        raise ContractError("photo-requirements.json may contain at most 24 photos")

    by_id: dict[str, dict] = {}
    by_filename: dict[str, dict] = {}
    groups: dict[str, list[dict]] = {}
    semantic_seen: dict[str, tuple[str, str]] = {}
    for index, photo in enumerate(items):
        path = f"photo-requirements.json.photos[{index}]"
        expect(isinstance(photo, dict), f"{path} must be an object")
        expect_exact_keys(photo, PHOTO_V2_FIELDS, PHOTO_V2_FIELDS, path)
        photo_id = photo["id"]
        expect(isinstance(photo_id, str) and re.fullmatch(r"(?:photo|adaptation-photo)-\d{3}", photo_id),
               f"{path}.id has invalid format")
        expect(photo_id not in by_id, f"duplicate photo id: {photo_id}")
        by_id[photo_id] = photo
        expect(_photo_nonempty(photo["subject"]), f"{path}.subject must be non-empty")
        expect(isinstance(photo["pedagogical_constraint"], str), f"{path}.pedagogical_constraint must be a string")
        for field, value in _photo_text_values(photo):
            if _PHOTO_URL_RE.search(value):
                raise ContractError(
                    f"photo contract route error: {path}.{field} contains a web address. "
                    "Finding the file is the Image Scout's job and it searches by subject, so a "
                    "link here is a promise nothing downstream can keep. Say what the picture must "
                    "show instead, naming the institution that holds it where you know it - "
                    "\"the Ford End School classroom around 1900, held by Essex Record Office\" - "
                    "and the scout's ladder (Unsplash, Wikimedia, Openverse, then that institution's "
                    "own page) will reach it."
                )
        expect(_photo_nonempty(photo["teaching_requirement"]), f"{path}.teaching_requirement must be non-empty")
        evidence = photo["load_bearing_evidence"]
        expect(isinstance(evidence, list) and evidence and all(_photo_nonempty(v) for v in evidence),
               f"{path}.load_bearing_evidence must be a non-empty list of non-empty strings")
        expect(photo["use"] in PHOTO_USES, f"{path}.use must be one of {sorted(PHOTO_USES)}")
        expect(type(photo["essential"]) is bool, f"{path}.essential must be boolean")
        filename = photo["filename"]
        expect(_photo_filename_safe(filename), f"{path}.filename is unsafe")
        expect(filename not in by_filename, f"duplicate photo filename: {filename}")
        by_filename[filename] = photo
        acquisition = photo["acquisition_mode"]
        source = photo["source_profile"]
        fallback = photo["fallback_action"]
        coherent_mode = photo["coherent_mode"]
        expect(acquisition in PHOTO_ACQUISITION_MODES,
               f"photo contract route error: {path}.acquisition_mode is invalid")
        expect(source in PHOTO_SOURCE_PROFILES,
               f"photo contract route error: {path}.source_profile is invalid")
        expect(fallback in PHOTO_FALLBACK_ACTIONS,
               f"photo contract route error: {path}.fallback_action is invalid")
        expect(coherent_mode in PHOTO_COHERENT_MODES,
               f"photo contract coherence error: {path}.coherent_mode is invalid")
        note = photo["fallback_note"]
        expect(note is None or isinstance(note, str), f"{path}.fallback_note must be null or a string")
        prompt = photo["generation_prompt"]
        prompt_required = (acquisition == "controlled-ai" or fallback == "ai")
        if prompt_required:
            expect(_photo_prompt_valid(prompt),
                   f"photo contract route error: {path}.generation_prompt is incomplete")
        else:
            expect(prompt is None,
                   f"photo contract route error: {path}.generation_prompt must be null when AI is not authorised")
        group = photo["coherent_group"]
        invariants = photo["coherent_visual_invariants"]
        if group is None:
            expect(coherent_mode == "none" and invariants == [],
                   f"photo contract coherence error: {path} null group requires mode none and [] invariants")
        else:
            expect(_photo_nonempty(group), f"photo contract coherence error: {path}.coherent_group is invalid")
            expect(isinstance(invariants, list) and invariants and all(_photo_nonempty(v) for v in invariants),
                   f"photo contract coherence error: {path}.coherent_visual_invariants is invalid")
            groups.setdefault(group, []).append(photo)

        if acquisition == "authentic-real":
            expect(source != "none", f"photo contract route error: {path} authentic-real requires a real source profile")
            expect(fallback != "ai", f"photo contract route error: {path} authentic-real cannot fall back to AI")
            expect(prompt is None, f"photo contract route error: {path} authentic-real requires a null generation prompt")
            # authentic-real is the only route that can end a lesson with no
            # picture and no authorised substitute, so the reason has to be
            # written down rather than reached by default.
            expect(_photo_nonempty(note),
                   f"photo contract route error: {path} authentic-real requires a fallback_note saying why a "
                   f"faithful generated photograph would misteach; use ordinary-real when it would not")
        elif acquisition == "ordinary-real":
            expect(source != "none", f"photo contract route error: {path} ordinary-real requires a real source profile")
            if fallback == "ai":
                expect(_photo_prompt_valid(prompt), f"photo contract route error: {path} ordinary-real AI fallback requires a complete generation prompt")
            else:
                expect(prompt is None, f"photo contract route error: {path} ordinary-real without AI fallback requires a null generation prompt")
            # ordinary-real means authenticity is not load-bearing, so a
            # faithful generated photograph does the same teaching job.
            # Refusing that substitute is what leaves a picture undelivered.
            expect(fallback != "unsatisfied",
                   f"photo contract route error: {path} ordinary-real cannot use fallback_action unsatisfied; "
                   f"use ai, or omit when the picture is not essential")
            if photo["essential"] and fallback != "ai":
                # An all-real set forbids the AI fallback this member needs, so
                # the whole comparison can arrive empty. A matched generated set
                # also gives the shared framing a comparison depends on.
                expect(coherent_mode != "all-real",
                       f"photo contract coherence error: {path} an essential ordinary-real member of an all-real set "
                       f"has no way to be delivered; use all-generated with controlled-ai members, or authentic-real "
                       f"members when real origin is the evidence")
                raise ContractError(
                    f"photo contract route error: {path} an essential ordinary-real picture requires fallback_action ai "
                    f"with a complete generation_prompt; use authentic-real only when a generated photograph would misteach")
        elif acquisition == "controlled-ai":
            expect(source == "none", f"photo contract route error: {path} controlled-ai requires source_profile none")
            expect(_photo_prompt_valid(prompt), f"photo contract route error: {path} controlled-ai requires a complete generation prompt")
            expect(fallback != "ai", f"photo contract route error: {path} controlled-ai cannot use fallback_action ai")

        semantic = {key: photo[key] for key in PHOTO_V2_FIELDS if key not in {"id", "filename"}}
        semantic_key = json.dumps(semantic, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        if semantic_key in semantic_seen:
            old_id, old_filename = semantic_seen[semantic_key]
            raise ContractError(f"duplicate exact photo contract: {old_id}/{old_filename} and {photo_id}/{filename}")
        semantic_seen[semantic_key] = (photo_id, filename)

    for group, members in groups.items():
        modes = {member["coherent_mode"] for member in members}
        invariant_values = {json.dumps(member["coherent_visual_invariants"], ensure_ascii=False) for member in members}
        expect(len(modes) == 1 and len(invariant_values) == 1,
               f"photo contract coherence error: group {group!r} members must have identical mode and invariants")
        mode = next(iter(modes))
        if mode == "all-real":
            expect(all(member["acquisition_mode"] != "controlled-ai" and member["fallback_action"] != "ai" for member in members),
                   f"photo contract coherence error: all-real group {group!r} cannot use controlled AI or AI fallback")
        if mode == "all-generated":
            expect(all(member["acquisition_mode"] == "controlled-ai" for member in members),
                   f"photo contract coherence error: all-generated group {group!r} requires controlled-ai members")
        expect(len(members) <= 4, f"photo contract coherence error: group {group!r} is larger than four")

    if initial_photo_namespace:
        # Adaptation ids under this flag are ambiguous from the file alone: either
        # a Phase 1 contract has been polluted, or a post-merge contract is being
        # validated with a flag that does not apply to it. Reporting the second as
        # "id must be exactly photo-001" reads as corrupt data and sends the caller
        # hunting a file that is perfectly correct, so name both readings and the
        # fact that separates them.
        merged = [photo["id"] for photo in items
                  if isinstance(photo.get("id"), str)
                  and photo["id"].startswith("adaptation-photo-")]
        if merged:
            raise ContractError(
                "photo-requirements.json carries adaptation photo ids "
                f"({', '.join(merged)}) while --initial-photo-namespace is set. "
                "One of two things is wrong. If this is the Phase 1 initial "
                "contract, those entries do not belong in it: adaptation photos "
                "are added later by photo-contract.py, from adaptation.md. If "
                "this is a provisional or promoted contract, the ids are right "
                "and the flag is not, because it applies only to the Phase 1 "
                "contract, where every id is photo-###."
            )
        for index, photo in enumerate(items, 1):
            expect(photo["id"] == f"photo-{index:03d}",
                   f"photo-requirements.json.photos[{index - 1}].id must be exactly photo-{index:03d}")

    return items, by_id


def write_on_evidence(unit: dict[str, Any]) -> str | None:
    """Why this source unit looks like a moment a child marks a figure on.

    None when nothing in the unit says so. The stick-in pedagogy's own test is
    whether the child writes onto a figure they could not redraw by hand; the
    two facts the contract records that point at it are a representation the
    pupil writes on and a task that sorts or classifies into a structure.
    """
    for ref in unit.get("representationRefs") or []:
        if isinstance(ref, dict) and ref.get("interaction") == "pupil-writes-on":
            return f"children write on {ref.get('ref')} (interaction pupil-writes-on)"
    task = unit.get("taskStructure")
    if isinstance(task, dict) and task.get("kind") in WRITE_ON_TASK_KINDS:
        return f"its task is a {task.get('kind')} children record into"
    return None


def validate_resource_opportunities(
    raw: Any,
    units: list[dict[str, Any]],
) -> None:
    """The lesson's own record of which printed extras it might earn.

    The decision gates a whole model worker, so a `none` has to be one the
    lesson's own moments do not contradict: the validator refuses a stick-in
    `none` while any unit carries write-on evidence, and names the unit, so
    the skip can never be quieter than the lesson.
    """
    block = expect_dict(raw, "resourceOpportunities")
    expect_exact_keys(block, {"stickIn", "workingWall"}, {"stickIn", "workingWall"}, "resourceOpportunities")
    unit_ids = {unit["sourceUnitId"] for unit in units}
    for key in ("stickIn", "workingWall"):
        path = f"resourceOpportunities.{key}"
        entry = expect_dict(block[key], path)
        fields = {"decision", "sourceUnitIds", "reason"}
        expect_exact_keys(entry, fields, fields, path)
        decision = expect_string(entry["decision"], f"{path}.decision")
        expect(decision in RESOURCE_DECISIONS, f"{path}.decision invalid: {decision}")
        source_ids = validate_ref_list(entry["sourceUnitIds"], f"{path}.sourceUnitIds", unit_ids)
        reason = expect_string(entry["reason"], f"{path}.reason")
        if decision == "candidate":
            expect(bool(source_ids), f"{path}.decision candidate must name at least one sourceUnitId")
        elif decision == "none":
            expect(not source_ids, f"{path}.decision none must carry an empty sourceUnitIds list")
            expect(
                len(reason.split()) >= 4,
                f"{path}.reason must say in a sentence why the book alone carries this lesson",
            )
    stick_in = block["stickIn"]
    if stick_in["decision"] == "none":
        for unit in units:
            evidence = write_on_evidence(unit)
            expect(
                evidence is None,
                f"resourceOpportunities.stickIn.decision none is contradicted by "
                f"{unit['sourceUnitId']} ({unit['label']}): {evidence}; record candidate or uncertain",
            )


def validate_design(
    design: Any,
    photos: Any,
    *,
    initial_photo_namespace: bool = False,
) -> None:
    reject_unresolved_scaffold_placeholders(design, "lesson-design.json")
    reject_unresolved_scaffold_placeholders(photos, "photo-requirements.json")

    root = expect_dict(design, "lesson-design.json")
    expect_exact_keys(
        root,
        TOP_LEVEL_FIELDS | OPTIONAL_TOP_LEVEL_FIELDS,
        TOP_LEVEL_FIELDS,
        "lesson-design.json",
    )
    expect(type(root["schemaVersion"]) is int and root["schemaVersion"] == 1, "schemaVersion must be integer 1")

    photo_items, photo_by_id = validate_photo_contract_v2(
        photos,
        initial_photo_namespace=initial_photo_namespace,
    )

    for prefix in ("photo-", "adaptation-photo-"):
        ordinals = sorted(
            int(photo_id[len(prefix):])
            for photo_id in photo_by_id
            if photo_id.startswith(prefix)
        )
        if ordinals:
            expect(
                ordinals == list(range(1, len(ordinals) + 1)),
                f"{prefix} IDs must be contiguous from 001 with no skipped or reused ordinal",
            )

    initial_photo_ids = {photo_id for photo_id in photo_by_id if photo_id.startswith("photo-")}

    lesson = expect_dict(root["lesson"], "lesson")
    lesson_fields = {
        "structure", "yearGroup", "subject", "lo", "displayedLo",
        "durationMinutes", "scope", "deferredLearning", "lesson2Direction", "stickingPoint",
    }
    expect_exact_keys(lesson, lesson_fields, lesson_fields, "lesson")
    structure = expect_string(lesson["structure"], "lesson.structure")
    expect(structure in STRUCTURES, f"lesson.structure invalid: {structure}")
    expect(type(lesson["yearGroup"]) is int and 1 <= lesson["yearGroup"] <= 6,
           "lesson.yearGroup must be an integer from 1 to 6")
    for key in ("subject", "lo", "displayedLo", "stickingPoint"):
        expect_string(lesson[key], f"lesson.{key}")
    # The board objective is the teacher's objective in the teacher's words.
    # It may be cut short where enumerated detail, a method or a condition is
    # tacked on ("...: hours/minutes, minutes/seconds", "... using
    # partitioning"), and nothing else: a Year 4 geography deck once showed
    # `To describe and give examples of biomes, and locate and describe the
    # Amazon rainforest` for a plan that said `To describe and give examples
    # of a biome and find the location and some features of the Amazon
    # rainforest`. Every word had been re-chosen, and the class copied an
    # objective the school does not assess against.
    expect(
        displayed_lo_is_the_objective_or_its_opening(lesson["lo"], lesson["displayedLo"]),
        "lesson.displayedLo must be lesson.lo word for word, or its opening cut "
        "short at a colon, comma, bracket, dash or a trailing 'using / by / "
        "with / including / through' clause; it is never a rewording",
    )
    # Canonical subject naming, so every downstream label (filing folders,
    # subject-file routing) gets the teacher's own "Maths".
    #
    # This used to also refuse every photo-### requirement on a maths lesson.
    # The intent was right - a number line, bar model or place-value chart is
    # drawn by the engine, never photographed - but the rule was a subject-wide
    # ban on a whole mechanism, and it closed the one exit the run has when the
    # engine cannot draw something: the helper check's picture route ends in a
    # photo requirement, so a maths lesson that hit a drawing gap could neither
    # add the picture nor pass the gate. The teacher settled it on 1 September
    # 2026: maths can have photographs. What must not happen is photographing a
    # tool the engine draws, and that is not a subject rule and not something a
    # validator can see - it is the helper check's job, enforced for every
    # subject by the delivery check, and a judgement the designer and reviewer
    # hold.
    if lesson["subject"].casefold() in {"maths", "mathematics", "math"}:
        expect(
            lesson["subject"] == "Maths",
            f"lesson.subject must be exactly 'Maths', not '{lesson['subject']}' - "
            "synonyms route and validate differently and are not accepted",
        )
    expect_positive_int(lesson["durationMinutes"], "lesson.durationMinutes")
    scope = expect_string(lesson["scope"], "lesson.scope")
    expect(scope in {"Complete lesson", "Lesson 1 of 2"}, "lesson.scope invalid")
    expect_nullable_string(lesson["deferredLearning"], "lesson.deferredLearning")
    expect_nullable_string(lesson["lesson2Direction"], "lesson.lesson2Direction")
    if scope == "Complete lesson":
        expect(lesson["deferredLearning"] is None, "complete lesson must have deferredLearning null")
        expect(lesson["lesson2Direction"] is None, "complete lesson must have lesson2Direction null")
    else:
        expect_string(lesson["deferredLearning"], "lesson.deferredLearning")
        expect_string(lesson["lesson2Direction"], "lesson.lesson2Direction")

    orientation = expect_string(root["teacherOrientation"], "teacherOrientation")
    orientation_prefix = "Teacher orientation:"
    expect(orientation.startswith(orientation_prefix), "teacherOrientation must begin 'Teacher orientation:'")
    expect(
        orientation[len(orientation_prefix):].strip(),
        "teacherOrientation must contain orientation text after 'Teacher orientation:'",
    )

    rep_items, rep_by_id = collect_registry(
        root["representations"], "representations", "id", ID_PATTERNS["representation"]
    )
    for index, rep in enumerate(rep_items):
        path = f"representations[{index}]"
        fields = {"id", "name", "purpose", "configurations"}
        expect_exact_keys(rep, fields, fields, path)
        expect_string(rep["name"], f"{path}.name")
        expect_string(rep["purpose"], f"{path}.purpose")
        configs = expect_list(rep["configurations"], f"{path}.configurations")
        expect(bool(configs), f"{path}.configurations must not be empty")
        config_ids: set[str] = set()
        for i, raw_config in enumerate(configs):
            config_path = f"{path}.configurations[{i}]"
            config = expect_dict(raw_config, config_path)
            config_fields = {"id", "description", "loadBearing", "requiredFeatures"}
            expect_exact_keys(config, config_fields, config_fields, config_path)
            config_id = expect_string(config["id"], f"{config_path}.id")
            expect(re.fullmatch(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", config_id) is not None,
                   f"{config_path}.id must be lowercase kebab-case")
            expect(config_id not in config_ids, f"{path} duplicate configuration id: {config_id}")
            config_ids.add(config_id)
            expect_string(config["description"], f"{config_path}.description")
            load_bearing = expect_bool(config["loadBearing"], f"{config_path}.loadBearing")
            features = expect_list(config["requiredFeatures"], f"{config_path}.requiredFeatures")
            if load_bearing:
                expect(bool(features),
                       f"{config_path}.requiredFeatures must not be empty when loadBearing is true")
            else:
                expect(not features,
                       f"{config_path}.requiredFeatures must be empty when loadBearing is false")
            for feature_index, feature in enumerate(features):
                expect_string(feature, f"{config_path}.requiredFeatures[{feature_index}]")

    sc_items, sc_by_id = collect_registry(
        root["successCriteria"], "successCriteria", "id", ID_PATTERNS["successCriteria"]
    )
    for index, sc in enumerate(sc_items):
        path = f"successCriteria[{index}]"
        fields = {"id", "type", "drawLive", "content"}
        expect_exact_keys(sc, fields, fields, path)
        sc_type = expect_string(sc["type"], f"{path}.type")
        expect(sc_type in SC_TYPES, f"{path}.type invalid: {sc_type}")
        expect_bool(sc["drawLive"], f"{path}.drawLive")
        content = expect_dict(sc["content"], f"{path}.content")
        if sc_type == "steps":
            expect_exact_keys(content, {"steps"}, {"steps"}, f"{path}.content")
            steps = expect_list(content["steps"], f"{path}.content.steps")
            expect(bool(steps), f"{path}.content.steps must not be empty")
            for i, step in enumerate(steps):
                expect_string(step, f"{path}.content.steps[{i}]")
                # Steps are board reference a child glances at mid-task; the
                # guidance aims for 2-5 words and a 13-word step is a
                # mini-instruction, not a step (Y4 circuits, 1 Sep 2026:
                # "Connect the lamp or buzzer back to the cell to close the
                # loop"). Generous cap so a genuinely needed longer step
                # survives; wordiness is caught here, not carried in heads.
                words = len(step.split())
                expect(
                    words <= 12,
                    f"{path}.content.steps[{i}] is {words} words; a how-to "
                    "step is a short verb-first action (aim 2-5 words, cap "
                    "12) - say the action, not the instructions around it",
                )
        elif sc_type == "reference-table":
            expect_exact_keys(content, {"columns", "rows"}, {"columns", "rows"}, f"{path}.content")
            columns = expect_list(content["columns"], f"{path}.content.columns")
            expect(bool(columns), f"{path}.content.columns must not be empty")
            for i, column in enumerate(columns):
                expect_string(column, f"{path}.content.columns[{i}]")
            rows = expect_list(content["rows"], f"{path}.content.rows")
            expect(bool(rows), f"{path}.content.rows must not be empty")
            for r_index, row in enumerate(rows):
                values = expect_list(row, f"{path}.content.rows[{r_index}]")
                expect(len(values) == len(columns), f"{path}.content.rows[{r_index}] must match column count")
                for c_index, value in enumerate(values):
                    expect_string(value, f"{path}.content.rows[{r_index}][{c_index}]")
        else:
            expect_exact_keys(content, {"items"}, {"items"}, f"{path}.content")
            items = expect_list(content["items"], f"{path}.content.items")
            expect(bool(items), f"{path}.content.items must not be empty")
            for i, raw_item in enumerate(items):
                item_path = f"{path}.content.items[{i}]"
                item = expect_dict(raw_item, item_path)
                fields = {"label", "text", "representationRef", "configuration"}
                expect_exact_keys(item, fields, fields, item_path)
                expect_string(item["label"], f"{item_path}.label")
                expect_string(item["text"], f"{item_path}.text")
                if item["representationRef"] is None:
                    expect(item["configuration"] is None, f"{item_path}.configuration must be null without representationRef")
                else:
                    rep_id = expect_string(item["representationRef"], f"{item_path}.representationRef")
                    expect(rep_id in rep_by_id, f"{item_path}.representationRef unknown: {rep_id}")
                    config = expect_string(item["configuration"], f"{item_path}.configuration")
                    expect(config in {c["id"] for c in rep_by_id[rep_id]["configurations"]},
                           f"{item_path}.configuration unknown for {rep_id}: {config}")

    sticky_items, sticky_by_id = collect_registry(
        root["stickyKnowledge"], "stickyKnowledge", "id", ID_PATTERNS["stickyKnowledge"]
    )
    expect(len(sticky_items) <= 3, f"stickyKnowledge must contain at most 3 items (found {len(sticky_items)})")
    for index, item in enumerate(sticky_items):
        path = f"stickyKnowledge[{index}]"
        expect_exact_keys(item, {"id", "text"}, {"id", "text"}, path)
        expect_string(item["text"], f"{path}.text")

    misconception_items, misconception_by_id = collect_registry(
        root["misconceptions"], "misconceptions", "id", ID_PATTERNS["misconception"]
    )
    for index, item in enumerate(misconception_items):
        path = f"misconceptions[{index}]"
        fields = {"id", "belief", "correctiveFact", "strategy", "reason"}
        expect_exact_keys(item, fields, fields, path)
        expect_string(item["belief"], f"{path}.belief")
        expect_nullable_string(item["correctiveFact"], f"{path}.correctiveFact")
        expect_string(item["strategy"], f"{path}.strategy")
        expect_string(item["reason"], f"{path}.reason")

    concept_items, concept_by_id = collect_registry(
        root["concepts"], "concepts", "id", ID_PATTERNS["concept"]
    )
    for index, item in enumerate(concept_items):
        path = f"concepts[{index}]"
        fields = {"id", "name", "successCriteriaRefs"}
        expect_exact_keys(item, fields, fields, path)
        expect_string(item["name"], f"{path}.name")
        refs = validate_ref_list(
            item["successCriteriaRefs"], f"{path}.successCriteriaRefs", set(sc_by_id)
        )
        if structure == "Skill-based":
            expect(
                bool(refs),
                f"{path}.successCriteriaRefs must not be empty for a Skill-based concept",
            )
    if structure == "Skill-based":
        expect(bool(concept_items), "Skill-based lesson must define at least one concept")
    else:
        expect(not concept_items, f"{structure} lesson must use concepts: []")

    vocab_items, _ = collect_registry(
        root["vocabulary"], "vocabulary", "id", ID_PATTERNS["vocabulary"]
    )
    expect(len(vocab_items) <= 5, f"vocabulary must contain at most 5 items (found {len(vocab_items)})")
    for index, item in enumerate(vocab_items, 1):
        path = f"vocabulary[{index - 1}]"
        fields = {"id", "sourceUnitId", "term", "definition", "visual"}
        expect_exact_keys(item, fields, fields, path)
        validate_source_unit_id(item["sourceUnitId"], f"{path}.sourceUnitId", "vocabulary", index)
        expect_string(item["term"], f"{path}.term")
        expect_string(item["definition"], f"{path}.definition")
        validate_visual(item["visual"], f"{path}.visual", rep_by_id, initial_photo_ids)

    trimmed = expect_list(root["trimmedVocabulary"], "trimmedVocabulary")
    for index, raw_item in enumerate(trimmed):
        path = f"trimmedVocabulary[{index}]"
        item = expect_dict(raw_item, path)
        expect_exact_keys(item, {"term", "reason"}, {"term", "reason"}, path)
        expect_string(item["term"], f"{path}.term")
        expect_string(item["reason"], f"{path}.reason")

    starter = validate_source_unit(
        root["starter"],
        "starter",
        section="starter",
        ordinal=1,
        allowed_kinds={"starter"},
        rep_by_id=rep_by_id,
        sc_ids=set(sc_by_id),
        sticky_ids=set(sticky_by_id),
        misconception_ids=set(misconception_by_id),
        concept_ids=set(concept_by_id),
        photo_ids=initial_photo_ids,
    )
    expect(starter["conceptRef"] is None, "starter.conceptRef must be null")

    sequence = expect_list(root["teachingSequence"], "teachingSequence")
    expect(bool(sequence), "teachingSequence must not be empty")
    for index, raw_unit in enumerate(sequence, 1):
        path = f"teachingSequence[{index - 1}]"
        unit = validate_source_unit(
            raw_unit,
            path,
            section="teaching-sequence",
            ordinal=index,
            allowed_kinds=ROUTE_KINDS[structure],
            rep_by_id=rep_by_id,
            sc_ids=set(sc_by_id),
            sticky_ids=set(sticky_by_id),
            misconception_ids=set(misconception_by_id),
            concept_ids=set(concept_by_id),
            photo_ids=initial_photo_ids,
        )
        if structure == "Skill-based" and unit["kind"] in {"my-turn", "our-turn", "your-turn"}:
            concept_ref = unit["conceptRef"]
            expect(concept_ref is not None, f"{path}.conceptRef is required for {unit['kind']}")
            expected_sc = concept_by_id[concept_ref]["successCriteriaRefs"]
            expect(unit["successCriteriaRefs"] == expected_sc,
                   f"{path}.successCriteriaRefs must exactly match {concept_ref}.successCriteriaRefs")
        elif structure != "Skill-based":
            expect(unit["conceptRef"] is None, f"{path}.conceptRef must be null for {structure}")

    validate_route_sequence(structure, sequence, concept_items)

    ending = expect_dict(root["ending"], "ending")
    expect_exact_keys(ending, {"included", "kind", "reason", "beat"}, {"included", "kind", "reason", "beat"}, "ending")
    included = expect_bool(ending["included"], "ending.included")
    expected_kind = "Reflect" if structure == "Dialogic" else "Apply"
    expect(ending["kind"] == expected_kind, f"ending.kind must be {expected_kind} for {structure}")
    expect_string(ending["reason"], "ending.reason")
    if included:
        validate_source_unit(
            ending["beat"],
            "ending.beat",
            section="reflect" if structure == "Dialogic" else "apply",
            ordinal=1,
            allowed_kinds={"reflect"} if structure == "Dialogic" else {"apply"},
            rep_by_id=rep_by_id,
            sc_ids=set(sc_by_id),
            sticky_ids=set(sticky_by_id),
            misconception_ids=set(misconception_by_id),
            concept_ids=set(concept_by_id),
            photo_ids=initial_photo_ids,
        )
    else:
        expect(ending["beat"] is None, "ending.beat must be null when ending.included is false")


    worksheet = expect_dict(root["worksheet"], "worksheet")
    worksheet_fields = {
        "status", "resourceMode", "use", "activityArchitecture", "sheetShape",
        "demand", "successCriteriaRefs", "stickyKnowledgeRefs", "fitPriority",
        "centralWriteOnVisualException", "contentBlocks", "answerKeyMode", "providedWorksheet",
    }
    expect_exact_keys(worksheet, worksheet_fields, worksheet_fields, "worksheet")
    status = expect_string(worksheet["status"], "worksheet.status")
    mode = expect_string(worksheet["resourceMode"], "worksheet.resourceMode")
    use = expect_string(worksheet["use"], "worksheet.use")
    answer_key_mode = expect_string(worksheet["answerKeyMode"], "worksheet.answerKeyMode")
    expect(status in WORKSHEET_STATUSES, f"worksheet.status invalid: {status}")
    expect(mode in WORKSHEET_RESOURCE_MODES, f"worksheet.resourceMode invalid: {mode}")
    expect(use in WORKSHEET_USES, f"worksheet.use invalid: {use}")
    expect(answer_key_mode in {"required", "not-applicable"}, f"worksheet.answerKeyMode invalid: {answer_key_mode}")
    validate_ref_list(worksheet["successCriteriaRefs"], "worksheet.successCriteriaRefs", set(sc_by_id))
    validate_ref_list(worksheet["stickyKnowledgeRefs"], "worksheet.stickyKnowledgeRefs", set(sticky_by_id))

    if status == "provided-by-teacher":
        expect(mode == "per-child", "provided-by-teacher worksheet must use resourceMode per-child")
        expect(worksheet["activityArchitecture"] is None, "provided-by-teacher worksheet must have activityArchitecture null")
        expect(worksheet["sheetShape"] is None, "provided-by-teacher worksheet must have sheetShape null")
        expect(worksheet["demand"] is None, "provided-by-teacher worksheet must have demand null")
        expect(worksheet["fitPriority"] is None, "provided-by-teacher worksheet must have fitPriority null")
        expect(worksheet["centralWriteOnVisualException"] is None,
               "provided-by-teacher worksheet must have centralWriteOnVisualException null")
        expect(worksheet["contentBlocks"] == [], "provided-by-teacher worksheet must have contentBlocks []")
        expect(answer_key_mode == "not-applicable",
               "provided-by-teacher worksheet must have answerKeyMode not-applicable")
        provided = expect_dict(worksheet["providedWorksheet"], "worksheet.providedWorksheet")
        fields = {"source", "skillMatch", "duplicateCheck", "notes"}
        expect_exact_keys(provided, fields, fields, "worksheet.providedWorksheet")
        expect_string(provided["source"], "worksheet.providedWorksheet.source")
        expect_string(provided["skillMatch"], "worksheet.providedWorksheet.skillMatch")
        expect_string(provided["duplicateCheck"], "worksheet.providedWorksheet.duplicateCheck")
        expect_string(provided["notes"], "worksheet.providedWorksheet.notes", allow_empty=True)
    else:
        if mode == "shared-frame":
            expect(use == "required-task-resource",
                   "worksheet.resourceMode shared-frame requires use required-task-resource")
            expect(worksheet["successCriteriaRefs"] == [],
                   "shared-frame worksheet.successCriteriaRefs must be []")
            expect(worksheet["stickyKnowledgeRefs"] == [],
                   "shared-frame worksheet.stickyKnowledgeRefs must be []")
        architecture = expect_dict(worksheet["activityArchitecture"], "worksheet.activityArchitecture")
        fields = {"coreActionAndEvidence", "amount", "variationAndBoundaryPlan", "organisation"}
        expect_exact_keys(architecture, fields, fields, "worksheet.activityArchitecture")
        for key in fields:
            expect_string(architecture[key], f"worksheet.activityArchitecture.{key}")
        shape = expect_dict(worksheet["sheetShape"], "worksheet.sheetShape")
        expect_exact_keys(shape, {"kind", "reason"}, {"kind", "reason"}, "worksheet.sheetShape")
        shape_kind = expect_string(shape["kind"], "worksheet.sheetShape.kind")
        expect(shape_kind in WORKSHEET_SHAPES, f"worksheet.sheetShape.kind invalid: {shape_kind}")
        expect_string(shape["reason"], "worksheet.sheetShape.reason")
        expect_string(worksheet["demand"], "worksheet.demand")
        fit = expect_dict(worksheet["fitPriority"], "worksheet.fitPriority")
        expect_exact_keys(fit, {"protected", "preAuthorisedRemoval"}, {"protected", "preAuthorisedRemoval"}, "worksheet.fitPriority")
        for key in ("protected", "preAuthorisedRemoval"):
            values = expect_list(fit[key], f"worksheet.fitPriority.{key}")
            for i, value in enumerate(values):
                expect_string(value, f"worksheet.fitPriority.{key}[{i}]")
        exception = worksheet["centralWriteOnVisualException"]
        if exception is not None:
            exception = expect_dict(exception, "worksheet.centralWriteOnVisualException")
            expect_exact_keys(exception, {"visual", "reason"}, {"visual", "reason"}, "worksheet.centralWriteOnVisualException")
            expect_string(exception["visual"], "worksheet.centralWriteOnVisualException.visual")
            expect_string(exception["reason"], "worksheet.centralWriteOnVisualException.reason")
        expect(worksheet["providedWorksheet"] is None, "generated worksheet must have providedWorksheet null")
        blocks = expect_list(worksheet["contentBlocks"], "worksheet.contentBlocks")
        expect(bool(blocks), "generated worksheet must have at least one content block")
        block_ids: set[str] = set()
        has_answer = False
        for index, raw_block in enumerate(blocks):
            block_path = f"worksheet.contentBlocks[{index}]"
            block_id = validate_worksheet_content_block(
                raw_block,
                block_path,
                rep_by_id=rep_by_id,
                sticky_ids=set(sticky_by_id),
                photo_ids=initial_photo_ids,
            )
            expect(block_id not in block_ids, f"duplicate worksheet content block id: {block_id}")
            block_ids.add(block_id)

            def scan_answers(node: Any) -> None:
                nonlocal has_answer
                if isinstance(node, dict):
                    if set(node) == {"kind", "content", "acceptanceCondition", "delivery"}:
                        if node["kind"] != "none":
                            has_answer = True
                    for value in node.values():
                        scan_answers(value)
                elif isinstance(node, list):
                    for value in node:
                        scan_answers(value)
            scan_answers(raw_block)

        block_families = {
            "question-set" if raw_block["kind"] in {"question", "question-group"} else raw_block["kind"]
            for raw_block in blocks
        }
        if mode == "shared-frame":
            expect(shape_kind == "frame", "shared-frame worksheet.sheetShape.kind must be frame")
            expect(len(blocks) == 1, "shared-frame worksheet must contain exactly one top-level content block")
            expect(blocks[0]["kind"] == "frame", "shared-frame worksheet content block must be kind frame")
        elif shape_kind == "mixed":
            expect(len(block_families) >= 2,
                   "worksheet.sheetShape.kind mixed requires at least two content-block families")
        else:
            expect(
                block_families == {shape_kind},
                f"worksheet.sheetShape.kind {shape_kind} does not match contentBlocks families {sorted(block_families)}",
            )

        if has_answer:
            expect(answer_key_mode == "required",
                   "worksheet.answerKeyMode must be required when any worksheet answer/model exists")
        elif answer_key_mode == "required":
            raise ContractError(
                "worksheet.answerKeyMode is required but every worksheet answer kind is none"
            )

    if "resourceOpportunities" in root:
        validate_resource_opportunities(
            root["resourceOpportunities"],
            [starter, *sequence, *([ending["beat"]] if included else [])],
        )

    slide_notes = expect_list(root["slideDesignNotes"], "slideDesignNotes")
    for index, note in enumerate(slide_notes):
        expect_string(note, f"slideDesignNotes[{index}]")
    flags = expect_list(root["flagsForTeacher"], "flagsForTeacher")
    for index, flag in enumerate(flags):
        expect_string(flag, f"flagsForTeacher[{index}]")

    used_photo_ids: set[str] = set()

    def collect_photo_refs(node: Any) -> None:
        if isinstance(node, dict):
            if node.get("kind") == "photo" and isinstance(node.get("photoRef"), str):
                used_photo_ids.add(node["photoRef"])
            if isinstance(node.get("photoRefs"), list):
                for value in node["photoRefs"]:
                    if isinstance(value, str):
                        used_photo_ids.add(value)
            if node.get("kind") == "sticky" and isinstance(node.get("ref"), str):
                pass
            for value in node.values():
                collect_photo_refs(value)
        elif isinstance(node, list):
            for value in node:
                collect_photo_refs(value)

    collect_photo_refs(root)
    if initial_photo_namespace:
        for photo_id in photo_by_id:
            if photo_id.startswith("photo-"):
                expect(
                    photo_id in used_photo_ids,
                    f"initial photo requirement is not referenced by lesson-design.json: {photo_id}",
                )


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    initial_photo_namespace = False
    if args and args[0] == "--initial-photo-namespace":
        initial_photo_namespace = True
        args = args[1:]

    if len(args) != 2:
        print(
            "Usage: python3 validate-lesson-design.py [--initial-photo-namespace] "
            "<lesson-design.json> <photo-requirements.json>",
            file=sys.stderr,
        )
        return 2

    try:
        design = json.loads(Path(args[0]).read_text(encoding="utf-8"))
        photos = json.loads(Path(args[1]).read_text(encoding="utf-8"))
        validate_design(
            design,
            photos,
            initial_photo_namespace=initial_photo_namespace,
        )
    except (OSError, json.JSONDecodeError, ContractError) as exc:
        print(f"LESSON_DESIGN_INVALID: {exc}", file=sys.stderr)
        return 1

    print("LESSON_DESIGN_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
