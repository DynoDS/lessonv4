from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCAFFOLD = ROOT / "scripts" / "lesson-design-scaffold.py"
VALIDATOR = ROOT / "scripts" / "validate-lesson-design.py"


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


scaffold = load(
    SCAFFOLD,
    "lesson_design_scaffold",
)
validator = load(
    VALIDATOR,
    "lesson_design_validator",
)


def base_request() -> dict:
    return {
        "schemaVersion": 1,
        "structure": "Content-based",
        "yearGroup": 4,
        "subject": "Science",
        "scope": "Complete lesson",
        "vocabularyCount": 2,
        "trimmedVocabularyCount": 1,
        "representations": [
            {
                "configurations": [
                    {
                        "id": "teaching",
                        "loadBearing": True,
                    },
                    {
                        "id": "vocabulary",
                        "loadBearing": False,
                    },
                ]
            }
        ],
        "successCriteriaCount": 1,
        "stickyKnowledgeCount": 2,
        "misconceptionCount": 1,
        "concepts": [],
        "teachingSequence": [
            {
                "kind": "teach",
                "conceptIndex": None,
            },
            {
                "kind": "do",
                "conceptIndex": None,
            },
            {
                "kind": "practise",
                "conceptIndex": None,
            },
        ],
        "endingIncluded": True,
        "worksheet": {
            "status": "generated",
            "resourceMode": "per-child",
            "use": "separate-fresh-worksheet",
            "sheetShape": "question-set",
        },
        "photoCount": 2,
    }


def skill_request() -> dict:
    request = base_request()

    request.update(
        {
            "structure": "Skill-based",
            "subject": "Maths",
            "representations": [
                {
                    "configurations": [
                        {
                            "id": "model",
                            "loadBearing": True,
                        },
                        {
                            "id": "practice",
                            "loadBearing": True,
                        },
                    ]
                }
            ],
            "successCriteriaCount": 2,
            "concepts": [
                {
                    "successCriteriaIndexes": [1],
                },
                {
                    "successCriteriaIndexes": [2],
                },
            ],
            "teachingSequence": [
                {
                    "kind": "my-turn",
                    "conceptIndex": 1,
                },
                {
                    "kind": "our-turn",
                    "conceptIndex": 1,
                },
                {
                    "kind": "your-turn",
                    "conceptIndex": 1,
                },
                {
                    "kind": "prepare",
                    "conceptIndex": None,
                },
                {
                    "kind": "my-turn",
                    "conceptIndex": 2,
                },
                {
                    "kind": "our-turn",
                    "conceptIndex": 2,
                },
                {
                    "kind": "your-turn",
                    "conceptIndex": 2,
                },
            ],
            "photoCount": 0,
        }
    )

    return request


def test_content_scaffold_assigns_mechanical_ids_and_envelopes():
    design, photos = scaffold.build_scaffold(
        base_request()
    )

    assert (
        design["lesson"]["structure"]
        == "Content-based"
    )

    assert [
        item["id"]
        for item in design["vocabulary"]
    ] == [
        "vocab-001",
        "vocab-002",
    ]

    assert [
        item["sourceUnitId"]
        for item in design["vocabulary"]
    ] == [
        "lesson-section/vocabulary/unit-001",
        "lesson-section/vocabulary/unit-002",
    ]

    assert (
        design["representations"][0]["id"]
        == "rep-001"
    )

    assert (
        design["representations"][0]["purpose"]
        == scaffold.PLACEHOLDER
    )

    assert (
        "instructionalPurpose"
        not in design["representations"][0]
    )

    assert [
        item["id"]
        for item in design["stickyKnowledge"]
    ] == [
        "sk-001",
        "sk-002",
    ]

    assert [
        item["id"]
        for item in photos["photos"]
    ] == [
        "photo-001",
        "photo-002",
    ]

    assert [
        item["sourceUnitId"]
        for item in design["teachingSequence"]
    ] == [
        "lesson-section/teaching-sequence/unit-001",
        "lesson-section/teaching-sequence/unit-002",
        "lesson-section/teaching-sequence/unit-003",
    ]

    units = [
        design["starter"],
        *design["teachingSequence"],
        design["ending"]["beat"],
    ]

    for unit in units:
        assert set(unit) == (
            validator.UNIT_FIELDS
            | validator.UNIT_OPTIONAL_FIELDS
        )
        assert (
            unit["taskStructure"]
            == scaffold.PLACEHOLDER
        )


def test_skill_scaffold_binds_concepts_and_success_criteria_without_model_numbering():
    design, _ = scaffold.build_scaffold(
        skill_request()
    )

    assert [
        item["id"]
        for item in design["concepts"]
    ] == [
        "concept-001",
        "concept-002",
    ]

    assert (
        design["concepts"][0]["successCriteriaRefs"]
        == ["sc-001"]
    )

    assert (
        design["concepts"][1]["successCriteriaRefs"]
        == ["sc-002"]
    )

    first_three = design["teachingSequence"][:3]
    last_three = design["teachingSequence"][-3:]

    assert [
        unit["conceptRef"]
        for unit in first_three
    ] == [
        "concept-001",
        "concept-001",
        "concept-001",
    ]

    assert [
        unit["successCriteriaRefs"]
        for unit in first_three
    ] == [
        ["sc-001"],
        ["sc-001"],
        ["sc-001"],
    ]

    assert [
        unit["conceptRef"]
        for unit in last_three
    ] == [
        "concept-002",
        "concept-002",
        "concept-002",
    ]

    assert [
        unit["successCriteriaRefs"]
        for unit in last_three
    ] == [
        ["sc-002"],
        ["sc-002"],
        ["sc-002"],
    ]

    assert (
        design["teachingSequence"][3]["kind"]
        == "prepare"
    )

    assert (
        design["teachingSequence"][3]["conceptRef"]
        is None
    )


def test_each_non_skill_route_shape_is_accepted_by_scaffold_request_validator():
    request = base_request()
    scaffold.validate_request(request)

    discovery = base_request()
    discovery["structure"] = "Discovery"
    discovery["teachingSequence"] = [
        {
            "kind": "question",
            "conceptIndex": None,
        },
        {
            "kind": "explore",
            "conceptIndex": None,
        },
        {
            "kind": "make-sense",
            "conceptIndex": None,
        },
        {
            "kind": "teach-why",
            "conceptIndex": None,
        },
        {
            "kind": "use-learning",
            "conceptIndex": None,
        },
        {
            "kind": "finish",
            "conceptIndex": None,
        },
    ]
    scaffold.validate_request(discovery)

    dialogic = base_request()
    dialogic["structure"] = "Dialogic"
    dialogic["teachingSequence"] = [
        {
            "kind": "grounding-input",
            "conceptIndex": None,
        },
        {
            "kind": "stimulus-talk",
            "conceptIndex": None,
        },
        {
            "kind": "synthesise",
            "conceptIndex": None,
        },
    ]
    scaffold.validate_request(dialogic)

    task = base_request()
    task["structure"] = "Task-Centred"
    task["teachingSequence"] = [
        {
            "kind": "set-task",
            "conceptIndex": None,
        },
        {
            "kind": "teach-needed",
            "conceptIndex": None,
        },
        {
            "kind": "plan-checkpoint",
            "conceptIndex": None,
        },
        {
            "kind": "do-task",
            "conceptIndex": None,
        },
        {
            "kind": "share-conclude",
            "conceptIndex": None,
        },
    ]
    scaffold.validate_request(task)


def test_generated_scaffold_is_rejected_until_every_placeholder_is_resolved():
    design, photos = scaffold.build_scaffold(
        base_request()
    )

    try:
        validator.validate_design(
            design,
            photos,
            initial_photo_namespace=True,
        )
    except validator.ContractError as exc:
        assert (
            "unresolved scaffold placeholder"
            in str(exc)
        )
    else:
        raise AssertionError(
            "unfinished scaffold unexpectedly validated"
        )


def test_math_scaffold_request_rejects_initial_photos():
    request = skill_request()
    request["photoCount"] = 1

    try:
        scaffold.validate_request(request)
    except scaffold.ScaffoldError as exc:
        assert (
            "Maths scaffold request must use photoCount 0"
            in str(exc)
        )
    else:
        raise AssertionError(
            "Maths request with a photo unexpectedly validated"
        )


def test_route_mismatch_is_rejected_before_files_are_written():
    request = base_request()
    request["teachingSequence"] = [
        {
            "kind": "teach",
            "conceptIndex": None,
        },
        {
            "kind": "practise",
            "conceptIndex": None,
        },
    ]

    try:
        scaffold.validate_request(request)
    except scaffold.ScaffoldError as exc:
        assert (
            "teach must be followed immediately by do"
            in str(exc)
        )
    else:
        raise AssertionError(
            "invalid Content-based route unexpectedly validated"
        )


def test_cli_writes_parseable_scaffolds_and_exact_success_marker():
    request = base_request()

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)

        request_path = root / "request.json"
        design_path = root / "lesson-design.json"
        photos_path = root / "photo-requirements.json"

        request_path.write_text(
            json.dumps(
                request,
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

        result = subprocess.run(
            [
                sys.executable,
                "-S",
                str(SCAFFOLD),
                "--request",
                str(request_path),
                "--lesson-design",
                str(design_path),
                "--photo-requirements",
                str(photos_path),
            ],
            capture_output=True,
            text=True,
        )

        assert result.returncode == 0, (
            result.stdout + result.stderr
        )

        assert (
            result.stdout.strip()
            == "LESSON_DESIGN_SCAFFOLD_OK"
        )

        json.loads(
            design_path.read_text(
                encoding="utf-8"
            )
        )

        json.loads(
            photos_path.read_text(
                encoding="utf-8"
            )
        )


if __name__ == "__main__":
    failed = 0

    for name, fn in sorted(globals().items()):
        if (
            name.startswith("test_")
            and callable(fn)
        ):
            try:
                fn()
                print("PASS", name)
            except AssertionError as exc:
                failed += 1
                print(
                    "FAIL",
                    name,
                    str(exc)[:500],
                )

    raise SystemExit(
        1 if failed else 0
    )
