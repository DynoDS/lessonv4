"""A sort the request names arrives with its structured answer slot.

A science run (27 September 2026) filled a sort in place and stopped: the
scaffold's answer envelope held only kind, content, acceptanceCondition and
delivery, so there was nowhere to put `answer.structure`, which is where a
sort's key lives. The request can now mark a teaching-sequence unit as a sort,
and only that unit gets the sort's task envelope and answer slot; every other
unit keeps the plain envelope. A filled sort envelope must pass the validator
exactly as generated.
"""

from __future__ import annotations

import copy
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_lesson_design_scaffold import base_request, scaffold, validator  # noqa: E402

PH = scaffold.PLACEHOLDER


def sort_request() -> dict:
    request = base_request()
    request["teachingSequence"][1]["taskStructure"] = "sort"
    return request


def units(design: dict) -> list[dict]:
    return design["teachingSequence"]


def test_only_the_sort_unit_gets_the_structured_answer_slot():
    design, _ = scaffold.build_scaffold(sort_request())
    sequence = units(design)

    sort_unit = sequence[1]
    assert sort_unit["taskStructure"] == {
        "kind": "sort",
        "groups": [PH],
        "items": [PH],
        "handling": PH,
    }
    assert sort_unit["answer"] == {
        "kind": "exact",
        "content": None,
        "structure": {"kind": "sort", "placements": [PH]},
        "acceptanceCondition": PH,
        "delivery": PH,
    }

    for other in (sequence[0], sequence[2], design["starter"]):
        assert other["taskStructure"] == PH
        assert "structure" not in other["answer"]


def test_a_request_without_the_mark_is_unchanged():
    plain, _ = scaffold.build_scaffold(base_request())
    for unit in units(plain):
        assert unit["taskStructure"] == PH
        assert set(unit["answer"]) == {"kind", "content", "acceptanceCondition", "delivery"}


def test_the_filled_sort_envelope_passes_the_validator():
    design, _ = scaffold.build_scaffold(sort_request())
    unit = units(design)[1]

    task = copy.deepcopy(unit["taskStructure"])
    task["groups"] = [
        {"id": "group-001", "label": "Solid"},
        {"id": "group-002", "label": "Liquid"},
    ]
    task["items"] = [
        {"id": "item-001", "label": "ice", "detail": None, "photoRef": None},
        {"id": "item-002", "label": "milk", "detail": None, "photoRef": None},
    ]
    task["handling"] = {"kind": "sheet", "per": "pair", "groupCount": None, "where": "At tables, one sheet between two."}
    checked = validator.validate_task_structure(task, "taskStructure", unit_photo_refs=set())

    answer = copy.deepcopy(unit["answer"])
    answer["structure"]["placements"] = [
        {"itemRef": "item-001", "groupRef": "group-001"},
        {"itemRef": "item-002", "groupRef": "group-002"},
    ]
    answer["acceptanceCondition"] = None
    answer["delivery"] = "teacher-only"
    validator.validate_answer(answer, "answer", task_structure=checked)


def test_an_unknown_task_structure_mark_is_refused():
    request = base_request()
    request["teachingSequence"][1]["taskStructure"] = "option-bank"
    with pytest.raises(scaffold.ScaffoldError, match="taskStructure"):
        scaffold.build_scaffold(request)


def test_an_untouched_sort_may_be_rebuilt_without_it():
    """Dropping the sort from a corrected request before filling loses no work."""
    unfilled, _ = scaffold.build_scaffold(sort_request())
    corrected, _ = scaffold.build_scaffold(base_request())
    assert scaffold.decided_fields_at_risk(corrected, unfilled, "lesson-design.json") == []

    filled = copy.deepcopy(unfilled)
    units(filled)[1]["answer"]["delivery"] = "teacher-only"
    assert scaffold.decided_fields_at_risk(corrected, filled, "lesson-design.json")
