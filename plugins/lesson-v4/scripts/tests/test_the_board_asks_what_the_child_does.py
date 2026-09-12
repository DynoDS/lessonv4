"""The question the worksheet side now asks of every question, asked of the
board too: Daniel, 12 September 2026.

4.2.162 made a worksheet question name the child's action from a closed list,
and `written-explanation` justify itself. Reading it back he asked whether the
slides had the same change. They did not. The nearest thing was one rule about
starters, which lists other retrieval forms and says to reach for a list of
questions only when the recall genuinely is a list of questions. Past the
starter there was nothing: a Do beat's `format` is free text, so "answer in
books" passes, and a deck whose every task beat is a numbered list breaks no
rule.

The two sides are deliberately not identical. A worksheet IS the child's
response surface, so its form settles what the child does, and a closed list
belongs there. A slide is the board, and the same beat can be answered on a
whiteboard, in a book, aloud or at the front, which is the teacher's decision
(`subject-maths.md`, live grouping and response surfaces). So the board gets
the question and the shared vocabulary, not the enum.
"""
from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PREFERENCES = ROOT / "references" / "preferences.md"
COMPONENTS = ROOT / "references" / "lesson-designer-components.md"
VALIDATOR = ROOT / "scripts" / "validate-lesson-design.py"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheQuestionReachesEveryProducingBeatTests(unittest.TestCase):
    def setUp(self):
        self.preferences = flat(PREFERENCES)

    def test_the_rule_exists_and_names_the_beats(self):
        self.assertIn(
            "**Ask what the child would do to show you the answer, on every beat "
            "where they produce one.**",
            self.preferences,
        )
        self.assertIn(
            "a Do beat, a Your Turn, a Practise and an Apply each have a form",
            self.preferences,
        )

    def test_the_default_it_exists_to_catch_is_named(self):
        # Naming the failure is what stops the rule reading as a call for variety.
        self.assertIn(
            "the one that arrives by default is a list of questions answered in "
            "writing, because that is the easiest thing to write down",
            self.preferences,
        )

    def test_it_asks_the_worksheet_side_s_own_question(self):
        self.assertIn(
            "if this child were showing you the answer with the work in front of "
            "them, would they point at it, move it, group it, order it, fix it, or "
            "tell you?",
            self.preferences,
        )
        self.assertIn(
            "`The form comes from the thinking, never from a rotation`",
            self.preferences,
        )


class TheTwoSurfacesShareOneVocabularyTests(unittest.TestCase):
    def test_the_board_points_at_the_worksheet_s_words(self):
        preferences = flat(PREFERENCES)
        self.assertIn("`output-template.md` → `responseForm`", preferences)
        self.assertIn(
            "so the two surfaces of one lesson describe the child's action in one "
            "vocabulary rather than two",
            preferences,
        )

    def test_that_vocabulary_still_exists_where_it_is_pointed(self):
        # A cross-reference to a field that has been renamed is worse than none.
        self.assertIn("responseForm", flat(COMPONENTS))
        self.assertIn("WORKSHEET_RESPONSE_FORMS", VALIDATOR.read_text(encoding="utf-8"))

    def test_it_names_only_fields_the_contract_actually_has(self):
        # The first draft of this rule said to put the action in the beat's
        # `format`, and Your Turn, Apply and Use Learning have no such field.
        preferences = flat(PREFERENCES)
        self.assertIn(
            "the `format` field on a starter, a Do or a Practise, the core action "
            "in a Your Turn's `activityArchitecture`, and the `activity` line on an "
            "Apply or a Use Learning",
            preferences,
        )
        source = VALIDATOR.read_text(encoding="utf-8")
        self.assertIn('keys = {"activity", "format", "task"}', source)
        self.assertIn('keys = {"activityArchitecture", "task"}', source)


class TheBoardIsNotTheResponseSurfaceTests(unittest.TestCase):
    def test_the_asymmetry_is_stated_as_the_reason_for_the_weaker_rule(self):
        # Without this the next reader closes the gap by adding the enum here,
        # and the board starts prescribing how children record.
        preferences = flat(PREFERENCES)
        self.assertIn(
            "A worksheet IS the child's response surface, so its form settles what "
            "the child does; a slide is the board",
            preferences,
        )
        self.assertIn(
            "which is the teacher's call and stays the teacher's call", preferences
        )
        self.assertIn(
            "What the board owes is a form that makes the intended action possible "
            "and obvious, not a prescribed recording method",
            preferences,
        )

    def test_a_list_of_questions_is_still_right_where_it_is_right(self):
        # Most maths fluency IS answering written questions of that kind, and a
        # rule that reads as anti-list would wreck it.
        preferences = flat(PREFERENCES)
        self.assertIn(
            "where the skill being practised is answering written questions of that "
            "kind, which is most maths fluency, a list of questions is the right "
            "answer and not a failure",
            preferences,
        )
        self.assertIn("The fault is the list that was never chosen", preferences)

    def test_the_starter_rule_it_generalises_is_still_there(self):
        preferences = flat(PREFERENCES)
        self.assertIn(
            "**Match the form of the starter to the recall, not just the content.**",
            preferences,
        )
        self.assertIn(
            "Reach for the list of questions when the recall genuinely is a list of "
            "questions",
            preferences,
        )


if __name__ == "__main__":
    unittest.main()
