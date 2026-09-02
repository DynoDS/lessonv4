#!/usr/bin/env python3
"""Build the mechanical Phase-1 lesson-design and photo-requirement scaffolds."""

from __future__ import annotations

import argparse
import importlib.util
import json
import random
import re
import sys
from pathlib import Path
from typing import Any

REQUEST_FIELDS = {
    "schemaVersion",
    "structure",
    "yearGroup",
    "subject",
    "scope",
    "vocabularyCount",
    "trimmedVocabularyCount",
    "representations",
    "successCriteriaCount",
    "stickyKnowledgeCount",
    "misconceptionCount",
    "concepts",
    "teachingSequence",
    "endingIncluded",
    "worksheet",
    "photoCount",
}

VALIDATOR_PATH = Path(__file__).with_name("validate-lesson-design.py")
_spec = importlib.util.spec_from_file_location(
    "lesson_design_validator",
    VALIDATOR_PATH,
)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"cannot load validator from {VALIDATOR_PATH}")

_validator = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_validator)

STRUCTURES = _validator.STRUCTURES
ROUTE_KINDS = _validator.ROUTE_KINDS
WORKSHEET_STATUSES = _validator.WORKSHEET_STATUSES
WORKSHEET_RESOURCE_MODES = _validator.WORKSHEET_RESOURCE_MODES
WORKSHEET_USES = _validator.WORKSHEET_USES
WORKSHEET_SHAPES = _validator.WORKSHEET_SHAPES
PLACEHOLDER = _validator.SCAFFOLD_PLACEHOLDER


class ScaffoldError(ValueError):
    pass


# Plain first names for the children who voice a claim, a prediction or a
# mistake. A model asked to "choose a name" reaches for whichever name its
# references used as an example, so one class met Dev every week; drawing the
# names here, at random, is what makes them vary. The three class characters
# (Mr Sear, Miss Brooker, Bailey) are the slide designer's and are not in the
# pool.
CHARACTER_NAME_POOL = (
    "Amira", "Arjun", "Ava", "Ben", "Chloe", "Daniel", "Eli", "Ella",
    "Ethan", "Farah", "Freya", "George", "Grace", "Hana", "Harry", "Isla",
    "Jack", "Jamal", "Kai", "Layla", "Leo", "Lily", "Maya", "Mia",
    "Nadia", "Noah", "Oliver", "Omar", "Priya", "Rosie", "Sam", "Sofia",
    "Theo", "Yusuf", "Zara", "Zoe",
)
CHARACTER_NAMES_DRAWN = 4


def draw_character_names(
    count: int = CHARACTER_NAMES_DRAWN,
    *,
    rng: random.Random | None = None,
) -> list[str]:
    """Return `count` distinct names from the pool in a random order."""
    chooser = rng or random.SystemRandom()
    return chooser.sample(CHARACTER_NAME_POOL, count)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ScaffoldError(message)


def exact_keys(
    obj: dict[str, Any],
    fields: set[str],
    path: str,
) -> None:
    missing = fields - set(obj)
    extra = set(obj) - fields
    require(
        not missing,
        f"{path} missing fields: {', '.join(sorted(missing))}",
    )
    require(
        not extra,
        f"{path} has unknown fields: {', '.join(sorted(extra))}",
    )


def text(value: Any, path: str) -> str:
    require(
        isinstance(value, str) and bool(value.strip()),
        f"{path} must be a non-empty string",
    )
    return value


def count(value: Any, path: str) -> int:
    require(
        type(value) is int and value >= 0,
        f"{path} must be a non-negative integer",
    )
    return value


def positive(value: Any, path: str) -> int:
    require(
        type(value) is int and value > 0,
        f"{path} must be a positive integer",
    )
    return value


def read_json(path: Path) -> Any:
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except OSError as exc:
        raise ScaffoldError(f"cannot read {path}: {exc}") from exc
    except ValueError as exc:
        raise ScaffoldError(f"{path} is not valid JSON: {exc}") from exc


def atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary.replace(path)


def collect_placeholder_paths(
    node: Any,
    path: list[Any],
    out: list[list[Any]],
) -> None:
    if isinstance(node, str):
        if node == PLACEHOLDER:
            out.append(list(path))
        return

    if isinstance(node, dict):
        for key, value in node.items():
            path.append(key)
            collect_placeholder_paths(value, path, out)
            path.pop()
        return

    if isinstance(node, list):
        for index, value in enumerate(node):
            path.append(index)
            collect_placeholder_paths(value, path, out)
            path.pop()


def resolve_path(
    node: Any,
    path: list[Any],
) -> tuple[bool, Any]:
    current = node

    for step in path:
        if isinstance(step, str):
            if (
                not isinstance(current, dict)
                or step not in current
            ):
                return False, None
            current = current[step]
        else:
            if (
                not isinstance(current, list)
                or step >= len(current)
            ):
                return False, None
            current = current[step]

    return True, current


def format_path(name: str, path: list[Any]) -> str:
    rendered = name

    for step in path:
        if isinstance(step, str):
            rendered += f".{step}"
        else:
            rendered += f"[{step}]"

    return rendered


def decided_fields_at_risk(
    generated: Any,
    existing: Any,
    name: str,
) -> list[str]:
    """Paths the fresh scaffold would blank but the existing file has filled.

    The scaffold is a one-shot builder: it runs once, before the design is
    filled, and every field it owns leaves as `__LESSON_DESIGN_FILL__`. A path
    that the fresh scaffold marks as a placeholder but the file on disk already
    answers is decided work, and rewriting the scaffold over it would destroy
    that work.

    Re-running the builder after correcting the request but before filling is
    still allowed: every shared path is a placeholder on both sides, so nothing
    is at risk.
    """
    placeholders: list[list[Any]] = []
    collect_placeholder_paths(generated, [], placeholders)

    at_risk: list[str] = []

    for path in placeholders:
        found, value = resolve_path(existing, path)
        if found and value != PLACEHOLDER:
            at_risk.append(format_path(name, path))

    return at_risk


def refuse_to_discard_decided_work(
    path: Path,
    generated: Any,
    name: str,
) -> None:
    if not path.exists():
        return

    try:
        existing = json.loads(
            path.read_text(encoding="utf-8")
        )
    except (OSError, ValueError):
        return

    at_risk = decided_fields_at_risk(
        generated,
        existing,
        name,
    )

    if not at_risk:
        return

    raise ScaffoldError(
        f"refusing to discard decided design work in {path}: "
        f"{len(at_risk)} field(s) already carry a decided value, "
        f"first {at_risk[0]}. The scaffold builds the empty design once, "
        "before it is filled. It is not a success check and must never run "
        "again after any field has been answered. To rebuild from a corrected "
        "request, delete the file first."
    )


def answer_scaffold() -> dict[str, Any]:
    return {
        "kind": PLACEHOLDER,
        "content": PLACEHOLDER,
        "acceptanceCondition": PLACEHOLDER,
        "delivery": PLACEHOLDER,
    }


def notes_scaffold() -> dict[str, Any]:
    return {
        "script": PLACEHOLDER,
        "teacherInfo": PLACEHOLDER,
        "lookFor": PLACEHOLDER,
    }


# Route-specific content envelopes. Each source-unit kind's content object is
# a fixed key set enforced by validate-lesson-design.py, and mechanical shape
# belongs to this builder, so the scaffold emits the envelope and the Lesson
# Designer fills only decided values. A field whose shape itself turns on a
# decision (a teach takeaway, a task structure) stays a whole-value
# placeholder.
CONTENT_ENVELOPE_FIELDS: dict[str, tuple[str, ...]] = {
    "starter": ("activity", "connection", "format", "testQuestionPath"),
    "prepare": ("mode", "activity"),
    "my-turn": ("example", "modelledExemplar"),
    "our-turn": ("example", "guidedQuestions"),
    "your-turn": ("activityArchitecture", "task"),
    "observe": ("activity", "focus", "evidenceProduced"),
    "teach": ("headline", "explanation", "takeaway", "teachingText", "keyQuestions"),
    "do": ("activity", "format", "task"),
    "practise": ("activity", "format", "task"),
    "question": ("focus", "prerequisites", "discoveryFocus"),
    "explore": ("activity", "conditionsAndSafety", "evidenceProduced"),
    "make-sense": ("resultOrPattern", "prompt"),
    "teach-why": (
        "accurateExplanation",
        "unsupportedExplanationToCorrect",
    ),
    "use-learning": ("activity",),
    "finish": ("purposefulEnding",),
    "grounding-input": ("input",),
    "stimulus": ("prompt", "question", "materialOnSlide"),
    "talk": (
        "format",
        "discussionQuestion",
        "sentenceStems",
        "durationMinutes",
        "teacherListensFor",
    ),
    "stimulus-talk": (
        "prompt",
        "question",
        "materialOnSlide",
        "format",
        "sentenceStems",
        "durationMinutes",
        "teacherListensFor",
    ),
    "synthesise": ("framesToName",),
    "set-task": ("question", "investigationBrief"),
    "teach-needed": ("enablingInput", "modelledOn"),
    "plan-checkpoint": ("whatChildrenPlan", "checkpointQuestion"),
    "do-task": (
        "activity",
        "planWithinTask",
        "checkpointQuestion",
        "runsBeyondToday",
        "todayEndsAt",
    ),
    "share-conclude": ("activity",),
    "apply": ("activity",),
    "reflect": ("activity",),
}

CONTENT_LIST_FIELDS = {
    "guidedQuestions",
    "keyQuestions",
    "sentenceStems",
    "teacherListensFor",
    "framesToName",
}


def content_scaffold(kind: str) -> dict[str, Any]:
    fields = CONTENT_ENVELOPE_FIELDS.get(kind)

    if fields is None:
        raise ScaffoldError(
            f"no content envelope for source-unit kind: {kind}"
        )

    return {
        field: (
            [PLACEHOLDER]
            if field in CONTENT_LIST_FIELDS
            else PLACEHOLDER
        )
        for field in fields
    }


def source_unit(
    source_unit_id: str,
    kind: str,
    concept_ref: str | None,
    success_criteria_refs: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "sourceUnitId": source_unit_id,
        "label": PLACEHOLDER,
        "kind": kind,
        "conceptRef": concept_ref,
        "content": content_scaffold(kind),
        "pupilInstruction": PLACEHOLDER,
        "taskStructure": PLACEHOLDER,
        "modellingState": PLACEHOLDER,
        "representationRefs": [PLACEHOLDER],
        "successCriteriaRefs": (
            list(success_criteria_refs)
            if success_criteria_refs is not None
            else [PLACEHOLDER]
        ),
        "stickyKnowledgeRefs": [PLACEHOLDER],
        "misconceptionRefs": [PLACEHOLDER],
        "photoRefs": [PLACEHOLDER],
        "speakerNotes": notes_scaffold(),
        "answer": answer_scaffold(),
    }


def validate_route_shape(
    structure: str,
    concepts: list[dict[str, Any]],
    sequence: list[dict[str, Any]],
) -> None:
    kinds = [item["kind"] for item in sequence]

    if structure == "Skill-based":
        require(
            bool(concepts),
            "Skill-based request must define at least one concept",
        )

        index = 0

        for concept_index in range(1, len(concepts) + 1):
            while (
                index < len(sequence)
                and sequence[index]["kind"] == "prepare"
            ):
                require(
                    sequence[index]["conceptIndex"] is None,
                    "Skill-based prepare conceptIndex must be null",
                )
                index += 1

            my_turns = 0

            while (
                index < len(sequence)
                and sequence[index]["kind"] == "my-turn"
            ):
                require(
                    sequence[index]["conceptIndex"] == concept_index,
                    (
                        "Skill-based My Turn must use "
                        f"conceptIndex {concept_index}"
                    ),
                )
                my_turns += 1
                index += 1

            require(
                my_turns >= 1,
                (
                    "Skill-based conceptIndex "
                    f"{concept_index} requires at least one my-turn"
                ),
            )

            if (
                index < len(sequence)
                and sequence[index]["kind"] == "our-turn"
            ):
                require(
                    sequence[index]["conceptIndex"] == concept_index,
                    (
                        "Skill-based our-turn must use "
                        f"conceptIndex {concept_index}"
                    ),
                )
                index += 1

            require(
                index < len(sequence)
                and sequence[index]["kind"] == "your-turn"
                and sequence[index]["conceptIndex"] == concept_index,
                (
                    "Skill-based conceptIndex "
                    f"{concept_index} requires one your-turn "
                    "after its my-turn move(s) and optional our-turn"
                ),
            )
            index += 1

        require(
            index == len(sequence),
            (
                "Skill-based request has extra or out-of-order "
                "teachingSequence entries"
            ),
        )
        return

    require(
        not concepts,
        f"{structure} request must use concepts: []",
    )

    for index, item in enumerate(sequence):
        require(
            item["conceptIndex"] is None,
            (
                f"teachingSequence[{index}].conceptIndex must be null "
                f"for {structure}"
            ),
        )

    if structure == "Content-based":
        index = 0
        pairs = 0

        while (
            index < len(sequence)
            and sequence[index]["kind"] != "practise"
        ):
            if sequence[index]["kind"] == "observe":
                index += 1
                require(
                    index < len(sequence)
                    and sequence[index]["kind"] == "teach",
                    (
                        "Content-based observe must be followed "
                        "immediately by teach"
                    ),
                )

            require(
                index < len(sequence)
                and sequence[index]["kind"] == "teach",
                (
                    "Content-based request must use teach -> do pairs "
                    "before practise"
                ),
            )
            index += 1

            require(
                index < len(sequence)
                and sequence[index]["kind"] == "do",
                (
                    "Every Content-based teach must be followed "
                    "immediately by do"
                ),
            )
            index += 1
            pairs += 1

        require(
            pairs >= 1,
            (
                "Content-based request requires at least one "
                "teach -> do pair"
            ),
        )
        require(
            index == len(sequence) - 1
            and sequence[index]["kind"] == "practise",
            (
                "Content-based practise must occur exactly once "
                "and last"
            ),
        )
        return

    if structure == "Discovery":
        expected = [
            "question",
            "explore",
            "make-sense",
            "teach-why",
            "use-learning",
            "finish",
        ]
        require(
            kinds == expected,
            (
                "Discovery request must be exactly: "
                f"{', '.join(expected)}"
            ),
        )
        return

    if structure == "Dialogic":
        index = 0

        if sequence and sequence[0]["kind"] == "grounding-input":
            index = 1

        cycles = 0

        while (
            index < len(sequence)
            and sequence[index]["kind"] != "synthesise"
        ):
            if sequence[index]["kind"] == "stimulus-talk":
                index += 1
                cycles += 1
                continue

            require(
                sequence[index]["kind"] == "stimulus",
                (
                    "Dialogic request requires stimulus -> talk pairs "
                    "or stimulus-talk"
                ),
            )
            index += 1

            require(
                index < len(sequence)
                and sequence[index]["kind"] == "talk",
                (
                    "Dialogic stimulus must be followed immediately "
                    "by talk"
                ),
            )
            index += 1
            cycles += 1

        require(
            cycles >= 1,
            (
                "Dialogic request requires at least one "
                "discussion cycle"
            ),
        )
        require(
            index == len(sequence) - 1
            and sequence[index]["kind"] == "synthesise",
            (
                "Dialogic synthesise must occur exactly once "
                "and last"
            ),
        )
        return

    if structure == "Task-Centred":
        index = 0

        require(
            bool(sequence)
            and sequence[index]["kind"] == "set-task",
            "Task-Centred request must begin with set-task",
        )
        index += 1

        # One enabling idea per teach-needed unit, so a task that needs two
        # distinct inputs can give each its own unit and its own pupil use
        # instead of stacking both into one block. The design validator
        # checks that every unit but the last carries that use.
        while (
            index < len(sequence)
            and sequence[index]["kind"] == "teach-needed"
        ):
            index += 1

        if (
            index < len(sequence)
            and sequence[index]["kind"] == "plan-checkpoint"
        ):
            index += 1

        require(
            index < len(sequence)
            and sequence[index]["kind"] == "do-task",
            (
                "Task-Centred request requires do-task after any "
                "enabling input or plan-checkpoint"
            ),
        )
        index += 1

        if (
            index < len(sequence)
            and sequence[index]["kind"] == "share-conclude"
        ):
            index += 1

        require(
            index == len(sequence),
            (
                "Task-Centred request has an extra or out-of-order "
                "teachingSequence entry"
            ),
        )
        return

    raise ScaffoldError(
        f"unsupported lesson structure: {structure}"
    )


def validate_request(raw: Any) -> dict[str, Any]:
    require(
        isinstance(raw, dict),
        "scaffold request root must be an object",
    )

    request = raw
    exact_keys(
        request,
        REQUEST_FIELDS,
        "scaffold request",
    )

    require(
        type(request["schemaVersion"]) is int
        and request["schemaVersion"] == 1,
        "schemaVersion must be integer 1",
    )

    structure = text(
        request["structure"],
        "structure",
    )
    require(
        structure in STRUCTURES,
        f"structure invalid: {structure}",
    )

    require(
        type(request["yearGroup"]) is int
        and 1 <= request["yearGroup"] <= 6,
        "yearGroup must be an integer from 1 to 6",
    )

    text(
        request["subject"],
        "subject",
    )

    scope = text(
        request["scope"],
        "scope",
    )
    require(
        scope in {
            "Complete lesson",
            "Lesson 1 of 2",
        },
        f"scope invalid: {scope}",
    )

    for field in (
        "vocabularyCount",
        "trimmedVocabularyCount",
        "successCriteriaCount",
        "stickyKnowledgeCount",
        "misconceptionCount",
        "photoCount",
    ):
        count(
            request[field],
            field,
        )

    representations = request["representations"]

    require(
        isinstance(representations, list),
        "representations must be an array",
    )

    for rep_index, rep in enumerate(representations):
        path = f"representations[{rep_index}]"

        require(
            isinstance(rep, dict),
            f"{path} must be an object",
        )
        exact_keys(
            rep,
            {"configurations"},
            path,
        )

        configs = rep["configurations"]

        require(
            isinstance(configs, list)
            and bool(configs),
            (
                f"{path}.configurations must be "
                "a non-empty array"
            ),
        )

        seen: set[str] = set()

        for config_index, config in enumerate(configs):
            config_path = (
                f"{path}.configurations[{config_index}]"
            )

            require(
                isinstance(config, dict),
                f"{config_path} must be an object",
            )
            exact_keys(
                config,
                {
                    "id",
                    "loadBearing",
                },
                config_path,
            )

            config_id = text(
                config["id"],
                f"{config_path}.id",
            )

            require(
                re.fullmatch(
                    r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
                    config_id,
                )
                is not None,
                (
                    f"{config_path}.id must be "
                    "lowercase kebab-case"
                ),
            )

            require(
                config_id not in seen,
                (
                    f"{path} has duplicate configuration id: "
                    f"{config_id}"
                ),
            )
            seen.add(config_id)

            require(
                type(config["loadBearing"]) is bool,
                (
                    f"{config_path}.loadBearing "
                    "must be boolean"
                ),
            )

    concepts = request["concepts"]

    require(
        isinstance(concepts, list),
        "concepts must be an array",
    )

    for concept_index, concept in enumerate(concepts):
        path = f"concepts[{concept_index}]"

        require(
            isinstance(concept, dict),
            f"{path} must be an object",
        )
        exact_keys(
            concept,
            {"successCriteriaIndexes"},
            path,
        )

        indexes = concept["successCriteriaIndexes"]

        require(
            isinstance(indexes, list)
            and bool(indexes),
            (
                f"{path}.successCriteriaIndexes "
                "must be a non-empty array"
            ),
        )

        seen_indexes: set[int] = set()

        for ref_index, value in enumerate(indexes):
            positive(
                value,
                (
                    f"{path}.successCriteriaIndexes"
                    f"[{ref_index}]"
                ),
            )

            require(
                value <= request["successCriteriaCount"],
                (
                    f"{path}.successCriteriaIndexes"
                    f"[{ref_index}] points past "
                    "successCriteriaCount"
                ),
            )

            require(
                value not in seen_indexes,
                (
                    f"{path}.successCriteriaIndexes "
                    f"contains duplicate index: {value}"
                ),
            )
            seen_indexes.add(value)

    sequence = request["teachingSequence"]

    require(
        isinstance(sequence, list)
        and bool(sequence),
        "teachingSequence must be a non-empty array",
    )

    for index, item in enumerate(sequence):
        path = f"teachingSequence[{index}]"

        require(
            isinstance(item, dict),
            f"{path} must be an object",
        )
        exact_keys(
            item,
            {
                "kind",
                "conceptIndex",
            },
            path,
        )

        kind = text(
            item["kind"],
            f"{path}.kind",
        )

        require(
            kind in ROUTE_KINDS[structure],
            (
                f"{path}.kind invalid for "
                f"{structure}: {kind}"
            ),
        )

        concept_index = item["conceptIndex"]

        require(
            concept_index is None
            or (
                type(concept_index) is int
                and concept_index > 0
            ),
            (
                f"{path}.conceptIndex must be null "
                "or a positive integer"
            ),
        )

        if concept_index is not None:
            require(
                concept_index <= len(concepts),
                (
                    f"{path}.conceptIndex "
                    "points past concepts"
                ),
            )

    validate_route_shape(
        structure,
        concepts,
        sequence,
    )

    require(
        type(request["endingIncluded"]) is bool,
        "endingIncluded must be boolean",
    )

    worksheet = request["worksheet"]

    require(
        isinstance(worksheet, dict),
        "worksheet must be an object",
    )

    exact_keys(
        worksheet,
        {
            "status",
            "resourceMode",
            "use",
            "sheetShape",
        },
        "worksheet",
    )

    status = text(
        worksheet["status"],
        "worksheet.status",
    )
    mode = text(
        worksheet["resourceMode"],
        "worksheet.resourceMode",
    )
    use = text(
        worksheet["use"],
        "worksheet.use",
    )

    require(
        status in WORKSHEET_STATUSES,
        f"worksheet.status invalid: {status}",
    )
    require(
        mode in WORKSHEET_RESOURCE_MODES,
        f"worksheet.resourceMode invalid: {mode}",
    )
    require(
        use in WORKSHEET_USES,
        f"worksheet.use invalid: {use}",
    )

    if status == "provided-by-teacher":
        require(
            mode == "per-child",
            (
                "provided-by-teacher worksheet must use "
                "resourceMode per-child"
            ),
        )
        require(
            worksheet["sheetShape"] is None,
            (
                "provided-by-teacher "
                "worksheet.sheetShape must be null"
            ),
        )
    else:
        shape = text(
            worksheet["sheetShape"],
            "worksheet.sheetShape",
        )

        require(
            shape in WORKSHEET_SHAPES,
            (
                "worksheet.sheetShape invalid: "
                f"{shape}"
            ),
        )

        if mode == "shared-frame":
            require(
                use == "required-task-resource",
                (
                    "shared-frame requires use "
                    "required-task-resource"
                ),
            )
            require(
                shape == "frame",
                (
                    "shared-frame requires "
                    "sheetShape frame"
                ),
            )

    # A maths scaffold used to be required to declare photoCount 0. Removed on
    # 1 September 2026 with the matching ban in the design validator: it made a
    # maths lesson unable to take the picture the helper check's own rescue
    # route produces. Photographing an engine-drawn maths tool is still wrong;
    # it is caught where it can actually be seen, not by a count here.
    return request


def build_scaffold(
    request: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any]]:
    request = validate_request(request)

    concepts = []

    for index, concept in enumerate(
        request["concepts"],
        1,
    ):
        concepts.append(
            {
                "id": f"concept-{index:03d}",
                "name": PLACEHOLDER,
                "successCriteriaRefs": [
                    f"sc-{sc_index:03d}"
                    for sc_index
                    in concept["successCriteriaIndexes"]
                ],
            }
        )

    sequence = []

    for index, item in enumerate(
        request["teachingSequence"],
        1,
    ):
        concept_ref = None
        success_criteria_refs = None

        if item["conceptIndex"] is not None:
            concept = concepts[
                item["conceptIndex"] - 1
            ]
            concept_ref = concept["id"]

            if item["kind"] in {
                "my-turn",
                "our-turn",
                "your-turn",
            }:
                success_criteria_refs = (
                    concept["successCriteriaRefs"]
                )

        sequence.append(
            source_unit(
                (
                    "lesson-section/"
                    "teaching-sequence/"
                    f"unit-{index:03d}"
                ),
                item["kind"],
                concept_ref,
                success_criteria_refs,
            )
        )

    ending_kind = (
        "Reflect"
        if request["structure"] == "Dialogic"
        else "Apply"
    )

    ending = {
        "included": request["endingIncluded"],
        "kind": ending_kind,
        "reason": PLACEHOLDER,
        "beat": None,
    }

    if request["endingIncluded"]:
        beat_kind = (
            "reflect"
            if request["structure"] == "Dialogic"
            else "apply"
        )
        section = (
            "reflect"
            if request["structure"] == "Dialogic"
            else "apply"
        )

        ending["beat"] = source_unit(
            (
                f"lesson-section/{section}/"
                "unit-001"
            ),
            beat_kind,
            None,
        )

    if (
        request["worksheet"]["status"]
        == "provided-by-teacher"
    ):
        worksheet = {
            "status": "provided-by-teacher",
            "resourceMode": "per-child",
            "use": request["worksheet"]["use"],
            "activityArchitecture": None,
            "sheetShape": None,
            "demand": None,
            "successCriteriaRefs": [],
            "stickyKnowledgeRefs": [],
            "fitPriority": None,
            "centralWriteOnVisualException": None,
            "contentBlocks": [],
            "answerKeyMode": "not-applicable",
            "providedWorksheet": PLACEHOLDER,
        }
    else:
        worksheet = {
            "status": "generated",
            "resourceMode": (
                request["worksheet"]["resourceMode"]
            ),
            "use": request["worksheet"]["use"],
            "activityArchitecture": PLACEHOLDER,
            "sheetShape": {
                "kind": (
                    request["worksheet"]["sheetShape"]
                ),
                "reason": PLACEHOLDER,
            },
            "demand": PLACEHOLDER,
            "successCriteriaRefs": [PLACEHOLDER],
            "stickyKnowledgeRefs": [PLACEHOLDER],
            "fitPriority": PLACEHOLDER,
            "centralWriteOnVisualException": (
                PLACEHOLDER
            ),
            "contentBlocks": [PLACEHOLDER],
            "answerKeyMode": PLACEHOLDER,
            "providedWorksheet": None,
        }

    design = {
        "schemaVersion": 1,
        "lesson": {
            "structure": request["structure"],
            "yearGroup": request["yearGroup"],
            "subject": request["subject"],
            "lo": PLACEHOLDER,
            "displayedLo": PLACEHOLDER,
            "durationMinutes": PLACEHOLDER,
            "scope": request["scope"],
            "deferredLearning": (
                None
                if request["scope"] == "Complete lesson"
                else PLACEHOLDER
            ),
            "lesson2Direction": (
                None
                if request["scope"] == "Complete lesson"
                else PLACEHOLDER
            ),
            "stickingPoint": PLACEHOLDER,
        },
        "teacherOrientation": PLACEHOLDER,
        "starter": source_unit(
            "lesson-section/starter/unit-001",
            "starter",
            None,
        ),
        "vocabulary": [
            {
                "id": f"vocab-{index:03d}",
                "sourceUnitId": (
                    "lesson-section/vocabulary/"
                    f"unit-{index:03d}"
                ),
                "term": PLACEHOLDER,
                "definition": PLACEHOLDER,
                "visual": PLACEHOLDER,
            }
            for index
            in range(
                1,
                request["vocabularyCount"] + 1,
            )
        ],
        "trimmedVocabulary": [
            {
                "term": PLACEHOLDER,
                "reason": PLACEHOLDER,
            }
            for _
            in range(
                request["trimmedVocabularyCount"]
            )
        ],
        "representations": [
            {
                "id": f"rep-{rep_index:03d}",
                "name": PLACEHOLDER,
                "purpose": PLACEHOLDER,
                "configurations": [
                    {
                        "id": config["id"],
                        "description": PLACEHOLDER,
                        "loadBearing": (
                            config["loadBearing"]
                        ),
                        "requiredFeatures": (
                            [PLACEHOLDER]
                            if config["loadBearing"]
                            else []
                        ),
                    }
                    for config
                    in rep["configurations"]
                ],
            }
            for rep_index, rep
            in enumerate(
                request["representations"],
                1,
            )
        ],
        "successCriteria": [
            {
                "id": f"sc-{index:03d}",
                "type": PLACEHOLDER,
                "drawLive": PLACEHOLDER,
                "content": PLACEHOLDER,
            }
            for index
            in range(
                1,
                request["successCriteriaCount"] + 1,
            )
        ],
        "stickyKnowledge": [
            {
                "id": f"sk-{index:03d}",
                "text": PLACEHOLDER,
            }
            for index
            in range(
                1,
                request["stickyKnowledgeCount"] + 1,
            )
        ],
        "misconceptions": [
            {
                "id": f"mc-{index:03d}",
                "belief": PLACEHOLDER,
                "correctiveFact": PLACEHOLDER,
                "strategy": PLACEHOLDER,
                "reason": PLACEHOLDER,
            }
            for index
            in range(
                1,
                request["misconceptionCount"] + 1,
            )
        ],
        "concepts": concepts,
        "teachingSequence": sequence,
        "ending": ending,
        "worksheet": worksheet,
        # The lesson's own word on the printed extras it might earn. Both are
        # filled like every other field; the stick-in one gates a worker, so
        # the validator refuses a `none` the lesson's moments contradict.
        "resourceOpportunities": {
            key: {
                "decision": PLACEHOLDER,
                "sourceUnitIds": PLACEHOLDER,
                "reason": PLACEHOLDER,
            }
            for key in ("stickIn", "workingWall")
        },
        "slideDesignNotes": [PLACEHOLDER],
        "flagsForTeacher": [PLACEHOLDER],
    }

    photos = {
        "schema_version": 2,
        "lesson_name": PLACEHOLDER,
        "photos": [
            {
                "id": f"photo-{index:03d}",
                "subject": PLACEHOLDER,
                "pedagogical_constraint": PLACEHOLDER,
                "teaching_requirement": PLACEHOLDER,
                "load_bearing_evidence": [PLACEHOLDER],
                "use": PLACEHOLDER,
                "essential": PLACEHOLDER,
                "filename": PLACEHOLDER,
                "acquisition_mode": PLACEHOLDER,
                "source_profile": PLACEHOLDER,
                "fallback_action": PLACEHOLDER,
                "fallback_note": None,
                "generation_prompt": PLACEHOLDER,
                "coherent_group": None,
                "coherent_mode": "none",
                "coherent_visual_invariants": [],
            }
            for index
            in range(
                1,
                request["photoCount"] + 1,
            )
        ],
    }

    return design, photos


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=__doc__,
    )
    parser.add_argument(
        "--request",
        required=True,
    )
    parser.add_argument(
        "--lesson-design",
        required=True,
    )
    parser.add_argument(
        "--photo-requirements",
        required=True,
    )
    return parser


def main(
    argv: list[str] | None = None,
) -> int:
    args = build_parser().parse_args(argv)

    try:
        request = read_json(
            Path(args.request)
        )
        design, photos = build_scaffold(
            request
        )

        design_path = Path(args.lesson_design)
        photos_path = Path(args.photo_requirements)

        refuse_to_discard_decided_work(
            design_path,
            design,
            "lesson-design.json",
        )
        refuse_to_discard_decided_work(
            photos_path,
            photos,
            "photo-requirements.json",
        )

        atomic_write_json(
            design_path,
            design,
        )
        atomic_write_json(
            photos_path,
            photos,
        )

    except ScaffoldError as exc:
        print(
            (
                "LESSON_DESIGN_SCAFFOLD_INVALID: "
                f"{exc}"
            ),
            file=sys.stderr,
        )
        return 1

    print("CHARACTER_NAMES: " + ", ".join(draw_character_names()))
    print("LESSON_DESIGN_SCAFFOLD_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
