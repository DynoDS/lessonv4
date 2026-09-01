from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PREFERENCES = ROOT / "references" / "preferences.md"
TEMPLATES = ROOT / "references" / "templates.md"
SPEECH = ROOT / "references" / "slide-speech-and-characters.md"
WORKSHEET_DESIGNER = ROOT / "agents" / "worksheet-designer.md"
SPEECH_BUBBLES = ROOT / "builder" / "src" / "templates" / "speech-bubbles.js"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ReadingOrderTests(unittest.TestCase):
    """Two surfaces laid a beat out against the order it is used in.

    The teacher flagged this on 1 September 2026 across one lesson's outputs.
    On the deck, three speech-bubble slides put "Is Dev right? Explain." in the
    left column and the claim it asks about in the bubble on the right, so the
    question arrived before its own subject. On the worksheet, a narrow steps
    panel took the left column and pushed the photograph and every question into
    the 70% beside it, leaving a tall empty band under four short lines.

    He asked for a preference, not a rule: "I can imagine contexts where it's
    not possible." So the guidance names the default, the reason, and the cases
    it does not govern.
    """

    def test_the_slide_preference_is_a_rhythm_not_a_side(self) -> None:
        """Written twice before it was right.

        The first draft said "the thing they read first goes left, and the
        question about it goes right". The teacher rejected it on reading it
        back - "I dont want it to say all questions must be on right and all
        teacher stuff on left" - and then gave the actual principle: the rhythm
        he wants is claim or teaching first, question second, and that "doesnt
        neccessarily mean left and right. It could be top then bottom." The
        left-right habit is downstream of how children access a slide at all,
        which is from the top left.
        """
        preferences = flat(PREFERENCES)
        self.assertIn(
            "Children take a slide in from the top left, so lay it out in the "
            "order it is used.",
            preferences,
        )
        self.assertIn("It is the order that matters, not the sides.", preferences)
        self.assertIn("top then bottom carries it just as well", preferences)

    def test_the_slide_preference_refuses_the_side_reading_of_itself(self) -> None:
        """Guard against the drift back. A model reading this must not be able
        to take "questions go right" from it, and the counterexample has to be
        a question that is right where the scan starts."""
        preferences = flat(PREFERENCES)
        self.assertIn(
            "not a rule that questions live on the right or that teacher "
            "material lives on the left",
            preferences,
        )
        self.assertIn("belongs wherever the slide reads best, top left included", preferences)

    def test_the_success_criteria_habit_is_derived_not_a_separate_rule(self) -> None:
        """The teacher's own account: "this is why i normally have success
        criteria right". It follows from the scan path, so it must be written as
        a consequence rather than as a second unexplained convention - and it
        must reach the worksheet page by the same reasoning."""
        preferences = flat(PREFERENCES)
        self.assertIn("The same scan path is why support sits late.", preferences)
        self.assertIn("normally the right-hand side, sometimes below", preferences)
        self.assertIn(
            "The Worksheets section says the same thing about a printed page, "
            "for the same reason.",
            preferences,
        )

    def test_the_slide_preference_is_not_written_as_a_mandate(self) -> None:
        """A hard rule here would misfire: a question in the title, a stacked
        pair, or a visual whose shape decides the side are all fine."""
        preferences = flat(PREFERENCES)
        self.assertIn("And it is a preference.", preferences)
        self.assertIn("none of those are this rule's business", preferences)

    def test_the_speech_templates_can_actually_obey_it(self) -> None:
        """The designer could not have fixed this deck: the template hard-coded
        the statement to the left. Guidance without the field would be an
        instruction to do something impossible."""
        source = SPEECH_BUBBLES.read_text(encoding="utf-8")
        self.assertIn("function statementSide(data)", source)
        self.assertIn("statementSide === 'right'", source)
        self.assertIn("statementSide", flat(TEMPLATES))

    def test_the_speech_reference_says_which_shape_takes_which_side(self) -> None:
        """The discriminating case: a statement that IS the thing being judged
        still reads first, so the default must not simply flip."""
        speech = flat(SPEECH)
        self.assertIn('set `statementSide: "right"` for this shape', speech)
        self.assertIn(
            "The default `left` is for the other shape, where the statement is "
            "the thing being judged",
            speech,
        )

    def test_worksheet_support_material_is_placed_by_the_same_scan_path(self) -> None:
        """The existing column rules said where a stimulus goes and what the
        other column is for, and never covered support material, so the steps
        took the corner the stimulus owns."""
        preferences = flat(PREFERENCES)
        self.assertIn(
            "Support comes after the work in the reading order, not before it.",
            preferences,
        )
        self.assertIn("success criteria", preferences)
        self.assertIn("Support a child glances at while working", flat(WORKSHEET_DESIGNER))

    def test_the_worksheet_rule_is_firm_only_where_the_sheet_actually_broke(self) -> None:
        """First written as "goes in the right-hand column, never the left".
        The teacher asked for it softened, having twice said he does not want
        mandates. The softening is not a retreat: the side is genuinely
        latitude, and the thing that broke the sheet - support taking the corner
        the page starts from - stays firm. Splitting them keeps the rule
        enforceable where it matters and quiet where it does not."""
        for path in (PREFERENCES, WORKSHEET_DESIGNER):
            with self.subTest(path=path.name):
                text = flat(path)
                self.assertNotIn("never the left", text)
                self.assertIn("sometimes a band below", text)
                self.assertIn("latitude", text)
                self.assertIn("top-left corner", text)

    def test_a_worked_through_step_list_is_not_support(self) -> None:
        """Discrimination: steps a child must complete in order before they can
        answer are part of the task and stay above their questions."""
        self.assertIn(
            "A step list a child works *through* before answering is not "
            "support at all - it is part of the task",
            flat(WORKSHEET_DESIGNER),
        )
        self.assertIn(
            "A step list a child must work *through* in order before they can "
            "answer anything is not support at all",
            flat(PREFERENCES),
        )

    def test_the_worksheet_rule_does_not_contradict_the_settled_column_rule(self) -> None:
        """The 29 and 31 August decisions stand: a stimulus and the questions
        that read it share a column. Support goes in the other one; it does not
        reopen where the questions sit."""
        preferences = flat(PREFERENCES)
        self.assertIn("A stimulus and the questions that read it share a column.", preferences)
        self.assertIn(
            "do not put the questions in one column and the material they work "
            "from in another",
            preferences,
        )


if __name__ == "__main__":
    unittest.main()
