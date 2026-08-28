#!/usr/bin/env python3
"""Build the mechanical Phase-1 lesson-design and photo-requirement scaffolds."""

from __future__ import annotations

import argparse
import importlib.util
import json
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
        "content": PLACEHOLDER,
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

            require(
                index < len(sequence)
                and sequence[index]["kind"] == "our-turn"
                and sequence[index]["conceptIndex"] == concept_index,
                (
                    "Skill-based conceptIndex "
                    f"{concept_index} requires one our-turn "
                    "after its my-turn move(s)"
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
                    "after its our-turn"
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

        if (
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

    subject = text(
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

    if subject.casefold() == "maths":
        require(
            request["photoCount"] == 0,
            (
                "Maths scaffold request must use "
                "photoCount 0"
            ),
        )

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

        atomic_write_json(
            Path(args.lesson_design),
            design,
        )
        atomic_write_json(
            Path(args.photo_requirements),
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

    print("LESSON_DESIGN_SCAFFOLD_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
