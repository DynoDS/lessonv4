"""Every fault the design check can see arrives in one report.

The check used to stop at the first thing it found, so a run showed one fault,
the designer fixed it, ran again and met the second. The Lesson Designer gets
three repair passes, so three runs bought three fixes, and a check that sits
late in the order could only be reached once everything before it was already
clean - which is exactly when the passes were spent. A Year 4 rounding lesson
(19 September 2026) met the vocabulary placement rule that way: it was reported
and abandoned in the same breath, never once repaired.

This is the same fault the slide check had, and the same repair (`One slide
check reports every fault, not the first layer`, 4.2.214): the independent
checks all run, and every fault comes back together.

The shape checks keep stopping early on purpose. A file whose sequence is not a
list has nothing for the later checks to read, and a cascade of errors thrown by
checks reading a broken shape would bury the one fault that matters.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

CONTRACT_TESTS = Path(__file__).with_name("test_lesson_design_contract.py")
SPEC = importlib.util.spec_from_file_location("contract_tests_one_report", CONTRACT_TESTS)
assert SPEC is not None and SPEC.loader is not None
contract = importlib.util.module_from_spec(SPEC)
sys.modules["contract_tests_one_report"] = contract
SPEC.loader.exec_module(contract)

module = contract.module
valid_content_contract = contract.valid_content_contract


def scheduled_after_starter(design):
    """Introduce every word after the starter.

    In this fixture the words are not needed until the Teach, so this is the
    placement fault the rounding lesson hit.
    """
    design.pop("vocabularyPlacement", None)
    design["vocabularyIntroductions"] = [
        {
            "vocabularyRefs": [row["id"] for row in design["vocabulary"]],
            "after": design["starter"]["sourceUnitId"],
            "script": "Say to children: Two words before we start.",
        }
    ]
    return design


def test_two_independent_faults_are_both_named_in_one_run():
    design, photos = valid_content_contract()

    # One fault in the vocabulary schedule, one in the ending. Neither depends
    # on the other, and the ending is checked after the vocabulary, so before
    # the repair the ending fault could not be seen at all.
    scheduled_after_starter(design)
    design["ending"]["kind"] = "Reflect"  # Content-based ends on Apply

    try:
        module.validate_design(design, photos)
    except module.ContractError as exc:
        report = str(exc)
    else:
        raise AssertionError("a design with two faults unexpectedly validated")

    assert "first needed" in report, report
    assert "ending.kind" in report, report


def test_a_sound_design_still_passes():
    design, photos = valid_content_contract()
    design["vocabularyIntroductions"] = [
        {
            "vocabularyRefs": [row["id"] for row in design["vocabulary"]],
            "after": design["teachingSequence"][0]["sourceUnitId"],
            "script": "Say to children: Two words before we start.",
        }
    ]
    design.pop("vocabularyPlacement", None)
    module.validate_design(design, photos)


def test_a_broken_shape_still_stops_at_the_shape():
    """The later checks read the sequence, so a sequence that is not a list
    stops the run there rather than throwing from every check that reads it."""
    design, photos = valid_content_contract()
    design["teachingSequence"] = "not a list"

    try:
        module.validate_design(design, photos)
    except module.ContractError as exc:
        report = str(exc)
    else:
        raise AssertionError("a broken sequence unexpectedly validated")

    assert "teachingSequence" in report, report
