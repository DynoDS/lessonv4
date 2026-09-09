"""Every beat writes the thought it makes a child have, before its activity is chosen.

Daniel (9 September 2026), in his own words: "When the plugin plans a bit of a
lesson, it should ask three things, in this order: What do I want the kids to
get out of this bit? What do they need to be thinking about, to get that? What
activity makes them think about it? Right now it starts at number 3."

He was right about where it started. The designer already said "choose the
thinking first", but "thinking" resolved to a category on a list (a fact gets
recall, an explanation gets a because-sentence), and the actual thought a child
has in this beat was never written anywhere. So a Year 4 RE design picked
"complete the because" for a slide that already stated the because, and the
thought every child actually had was where to copy the words from. Nothing
could see that, because nothing had written it down.

The repair is a `thinking` line on every beat, written before the activity is
chosen, refused as null wherever every child acts, printed in the review view
beside the beat's content so the reviewer can read it against the slide.
`unlocks` was already the first question; `thinking` is the second; the
activity is the third, chosen last.

These tests guard the field's enforcement and the rule's reach.
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
DO_BEATS = ROOT / "references" / "do-beats.md"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
CONTENT_BASED = ROOT / "references" / "teaching-sequence-content-based.md"

sys.path.insert(0, str(SCRIPTS / "tests"))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


packet = load("design_review_packet_thinking", "design-review-packet.py")
scaffold = load("lesson_design_scaffold_thinking", "lesson-design-scaffold.py")
contract = load("lesson_design_contract_fixture_thinking", "tests/test_lesson_design_contract.py")
validator = contract.module


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheThreeQuestionsAreStatedInOrderTests(unittest.TestCase):
    def test_preferences_carry_the_three_questions_in_daniels_order(self) -> None:
        text = flat(PREFERENCES)
        start = text.index("Three questions, in this order")
        body = text[start:start + 1200]
        self.assertLess(body.index("get out of this part"), body.index("thinking about"))
        self.assertLess(body.index("thinking about"), body.index("What activity makes them think"))
        self.assertIn("The order is the whole point", body)
        self.assertIn("`unlocks`", body)
        self.assertIn("`thinking`", body)

    def test_the_selector_says_a_kind_is_not_yet_a_thought(self) -> None:
        text = flat(PREFERENCES)
        self.assertIn("Settling the kind is not yet settling the thought", text)
        self.assertIn("If the line can be answered by reading the board, choose again", text)

    def test_the_designer_writes_the_thought_before_the_activity(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("Write each beat's `thinking` before you choose its activity", text)
        self.assertIn("Where on the slide is the reason?", text)
        self.assertIn("a kind can be right and the thought still be copying", text)

    def test_the_catalogue_and_the_route_ask_for_the_line_first(self) -> None:
        self.assertIn("Then write the beat's `thinking` line", flat(DO_BEATS))
        self.assertIn("write the beat's `thinking` line", flat(CONTENT_BASED))

    def test_the_reviewer_reads_the_line_against_the_slide(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("each beat's `thinking` line is the thought the beat actually produces", text)
        self.assertIn("copying wearing a Do beat's clothes", text)

    def test_the_contract_documents_the_field(self) -> None:
        text = flat(OUTPUT_TEMPLATE)
        self.assertIn("`thinking` is one short line naming the thought every child has to have", text)
        self.assertIn("written before the activity is chosen", text)


class TheValidatorEnforcesTheFieldTests(unittest.TestCase):
    def refused(self, mutate, expected):
        design, photos = contract.valid_contract()
        mutate(design)
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_design(design, photos)
        self.assertIn(expected, str(caught.exception))

    def test_the_baseline_fixture_is_valid(self) -> None:
        design, photos = contract.valid_contract()
        validator.validate_design(design, photos)

    def test_thinking_is_a_required_envelope_field(self) -> None:
        self.assertIn("thinking", validator.UNIT_FIELDS)
        self.assertEqual(validator.THINKING_MAX_CHARS, 200)

    def test_a_missing_field_is_refused_rather_than_defaulted(self) -> None:
        self.refused(lambda d: d["teachingSequence"][0].pop("thinking"), "thinking")

    def test_a_blank_line_is_refused(self) -> None:
        self.refused(
            lambda d: d["teachingSequence"][0].__setitem__("thinking", "   "),
            "thinking must not be empty",
        )

    def test_a_paragraph_is_refused_so_it_stays_a_thought(self) -> None:
        self.refused(
            lambda d: d["teachingSequence"][0].__setitem__("thinking", "x" * 201),
            "at most 200 characters",
        )

    def test_null_is_refused_where_every_child_acts(self) -> None:
        design, _ = contract.valid_contract()
        acting = [
            i for i, u in enumerate(design["teachingSequence"])
            if u["kind"] not in validator.NO_PUPIL_ACTION_KINDS
        ]
        self.assertTrue(acting, "fixture has no beat where every child acts")

        def mutate(d):
            d["teachingSequence"][acting[0]]["thinking"] = None
        self.refused(mutate, "must name the thought every child has to have")

    def test_null_is_refused_on_the_starter_too(self) -> None:
        self.refused(lambda d: d["starter"].__setitem__("thinking", None), "starter")

    def test_null_is_allowed_where_the_teacher_acts(self) -> None:
        design, photos = contract.valid_contract()
        watching = [
            u for u in design["teachingSequence"]
            if u["kind"] in validator.NO_PUPIL_ACTION_KINDS
        ]
        self.assertTrue(watching, "fixture has no teacher-led beat")
        for unit in watching:
            unit["thinking"] = None
        validator.validate_design(design, photos)


class TheScaffoldAndPacketCarryItTests(unittest.TestCase):
    def test_the_scaffold_leaves_a_placeholder_to_fill(self) -> None:
        unit = scaffold.source_unit("lesson-section/teaching-sequence/unit-001", "do", None)
        self.assertEqual(unit["thinking"], scaffold.PLACEHOLDER)

    def test_the_review_view_prints_the_line_including_when_it_is_missing(self) -> None:
        design, _ = contract.valid_contract()
        unit = design["teachingSequence"][0]
        unit["conceptRef"] = None
        filled: list[str] = []
        packet.append_review_unit(filled, unit, concepts={})
        self.assertTrue(any(line.startswith("- Thinking: ") for line in filled))
        unit["thinking"] = None
        empty: list[str] = []
        packet.append_review_unit(empty, unit, concepts={})
        self.assertIn("- Thinking: none recorded", empty)


if __name__ == "__main__":
    unittest.main()
