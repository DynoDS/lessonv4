"""The sentence a Teach beat lands has to reach the board.

The design writes it once, in the beat's `headline`. On the slide it normally
leads, but ten of the Teach layouts carry a line across the top and seventeen do
not, and a deck whose every Teach slide used one shape is the repetition the
composition rules already refuse. So the sentence may arrive as the banner, the
star line or the big statement. What it may not do is fail to arrive: nothing on
a built deck looks wrong when it happens, and the class is left with the
discussion instead of the thing to keep.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load():
    spec = importlib.util.spec_from_file_location(
        "check_landed_sentence", ROOT / "scripts" / "check-landed-sentence.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check = load()

DESIGN = {
    "teachingSequence": [
        {
            "sourceUnitId": "unit-001",
            "kind": "teach",
            "content": {
                "headline": "Children worked down the coal mines because the tunnels were small.",
                "takeaway": None,
            },
        }
    ],
    "stickyKnowledge": [],
}


def slide(**fields):
    base = {"template": "teach-layout", "designUnitId": "unit-001"}
    base.update(fields)
    return {"slides": [base]}


def test_the_sentence_leading_the_board_passes():
    spec = slide(layout="lead-picture-lines",
                 lead="Children worked down the coal mines because the tunnels were small.")
    assert check.faults(DESIGN, spec) == []


def test_the_same_sentence_as_the_star_line_passes():
    """A layout with no top slot is a fine choice; the sentence still lands."""
    spec = slide(layout="picture-three-cards",
                 sticky="Children worked down the coal mines because the tunnels were small.")
    assert check.faults(DESIGN, spec) == []


def test_a_shorter_board_version_of_the_same_sentence_passes():
    """A banner holds about seventy characters, so the board may carry the
    sentence in fewer words. Every word it uses is the design's."""
    spec = slide(layout="banner-picture-sidebar", lead="Children worked down the coal mines.")
    assert check.faults(DESIGN, spec) == []


def test_a_sentence_that_never_reaches_the_board_is_caught():
    spec = slide(layout="picture-three-cards",
                 lines=["A hurrier pushed wagons of coal along the tunnels."])
    problems = check.faults(DESIGN, spec)
    assert len(problems) == 1
    assert "not on its slide" in problems[0]


def test_the_sentence_in_an_ordinary_card_does_not_count():
    """A sentence buried in the middle of the route is the route, not the
    destination, so an explanation card is not a place it can land."""
    spec = slide(layout="picture-three-cards",
                 lines=["Children worked down the coal mines because the tunnels were small."])
    assert len(check.faults(DESIGN, spec)) == 1


def test_a_board_saying_something_else_is_drift_and_is_caught():
    spec = slide(layout="lead-picture-lines", lead="Sarah sat by a wooden door in the dark.")
    assert len(check.faults(DESIGN, spec)) == 1


def test_a_withheld_fact_is_measured_against_the_sticky_it_names():
    design = {
        "teachingSequence": [
            {
                "sourceUnitId": "unit-001",
                "kind": "teach",
                "content": {
                    "headline": "Two children, one pit, two different days",
                    "takeaway": {"kind": "sticky", "ref": "sk-001"},
                },
            }
        ],
        "stickyKnowledge": [
            {"id": "sk-001", "text": "Two children in the same pit had different working conditions."}
        ],
    }
    ok = slide(layout="banner-picture-sidebar",
               sticky="Two children in the same pit had different working conditions.")
    assert check.faults(design, ok) == []
    missing = slide(layout="banner-picture-sidebar", lead="Two children, one pit, two different days")
    assert len(check.faults(design, missing)) == 1
