"""One beat's fault does not hide the next beat's.

In the 20-lesson test of 7 October 2026 a Year 5 science lesson had four small
faults in four beats. A fault inside a beat ended the design check, so each run
reported one, and the lesson's three repair passes were spent before the fourth
was seen. Every other independent check already reported together (4.2.250);
the beats did not.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import test_lesson_design_contract as contract  # noqa: E402

validator = contract.module


def refused(design, photos) -> str:
    try:
        validator.validate_design(design, photos)
    except validator.ContractError as exc:
        return str(exc)
    raise AssertionError("the design passed")


def test_two_beats_with_a_fault_each_are_both_reported():
    design, photos = contract.valid_content_contract()
    design["teachingSequence"][0]["minutes"] = 0
    design["teachingSequence"][1]["minutes"] = 0
    message = refused(design, photos)
    assert "2 faults, every one of them below" in message
    assert "teachingSequence[0].minutes" in message
    assert "teachingSequence[1].minutes" in message
    # Reported once each, not once alone and again inside a combined report.
    assert message.count("teachingSequence[0].minutes") == 1


def test_one_beat_with_a_fault_reads_as_it_always_did():
    design, photos = contract.valid_content_contract()
    design["teachingSequence"][1]["minutes"] = 0
    message = refused(design, photos)
    assert message.startswith("teachingSequence[1].minutes")


def test_a_landed_star_fact_is_told_where_it_also_goes():
    design, photos = contract.valid_content_contract()
    teach = next(unit for unit in design["teachingSequence"] if unit["kind"] == "teach")
    fact = design["stickyKnowledge"][0]["id"]
    teach["content"]["takeaway"] = {"kind": "sticky", "ref": fact}
    teach["stickyKnowledgeRefs"] = [ref for ref in teach["stickyKnowledgeRefs"] if ref != fact]
    message = refused(design, photos)
    assert "sticky ref must also appear in stickyKnowledgeRefs" in message
    assert f"add `{fact}` to this beat's own list" in message
