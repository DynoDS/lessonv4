"""A method only some questions need is a list of its own, with a heading.

Year 4 column subtraction (16 October 2026): the exchange was packed under
step 3 of the one list. The teacher's rule: the numbered steps are what every
question goes through; a method only some questions need, with steps of its
own, is a second list ("How to exchange"), and each list then says what it is
for. The lesson check accepts a list's heading and refuses an empty one; the
guides say when to write one, and the slide engine prints it as the box's
heading (builder/test/criteria-lists-own-boxes.test.js).
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import test_lesson_design_contract as contract  # noqa: E402

module = contract.module


def first_steps_list(design):
    return next(sc for sc in design["successCriteria"] if sc["type"] == "steps")


def test_a_list_may_say_what_it_is_for():
    design, photos = contract.valid_contract()
    first_steps_list(design)["content"]["heading"] = "How to exchange"
    module.validate_design(design, photos)


def test_a_heading_with_nothing_in_it_is_refused():
    def mutate(design, photos):
        first_steps_list(design)["content"]["heading"] = "  "
    contract.assert_invalid(mutate, "content.heading must not be empty")


def test_any_other_field_beside_the_steps_is_still_refused():
    def mutate(design, photos):
        first_steps_list(design)["content"]["title"] = "How to exchange"
    contract.assert_invalid(mutate, "unknown fields: title")


def test_the_guides_say_when_a_list_of_its_own_is_written():
    voice = (ROOT / "references" / "teacher-voice.md").read_text(encoding="utf-8")
    template = (ROOT / "references" / "output-template.md").read_text(encoding="utf-8")
    writing = (ROOT / "references" / "teaching-sequence-skill-based.md").read_text(encoding="utf-8")
    assert "**A method only some questions need is a list of its own.**" in voice
    assert "`A method only some questions need`" in template
    assert "`A method only some questions need`" in writing


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
    print("ok")
