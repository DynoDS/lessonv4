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
    """A child reads left to right, and two surfaces ignored it.

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

    def test_the_slide_preference_is_stated_with_its_reason(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("Left to right is the order the slide is used in.", preferences)
        self.assertIn("the thing they read first goes left", preferences)

    def test_the_slide_preference_is_not_written_as_a_mandate(self) -> None:
        """A hard rule here would misfire: a question in the title, a stacked
        pair, or a visual whose shape decides the side are all fine."""
        preferences = flat(PREFERENCES)
        self.assertIn("This is a preference, not a rule to force.", preferences)
        self.assertIn(
            "a layout that genuinely reads better the other way round is the "
            "right layout",
            preferences,
        )

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

    def test_worksheet_support_material_has_a_side_at_last(self) -> None:
        """The existing column rules said where a stimulus goes and what the
        other column is for, and never covered support material, so the steps
        took the corner the stimulus owns."""
        preferences = flat(PREFERENCES)
        self.assertIn(
            "Support material goes in the right-hand column, never the left.",
            preferences,
        )
        self.assertIn("success criteria", preferences)
        self.assertIn("Support a child glances at while working", flat(WORKSHEET_DESIGNER))

    def test_a_worked_through_step_list_is_not_support(self) -> None:
        """Discrimination: steps a child must complete in order before they can
        answer are part of the task and stay above their questions."""
        for path in (PREFERENCES, WORKSHEET_DESIGNER):
            with self.subTest(path=path.name):
                self.assertIn("work", flat(path))
        self.assertIn(
            "A step list a child works *through* before answering is part of "
            "the task, not support",
            flat(WORKSHEET_DESIGNER),
        )
        self.assertIn(
            "a step list a child must work *through* in order before they can "
            "answer anything",
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
