from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
PREFERENCES = ROOT / "references" / "preferences.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ResponseLengthIsNotAQuotaTests(unittest.TestCase):
    """A Y4 Science appliances worksheet set `Write two sentences.` on an
    explain question and `Write one sentence.` on another.

    Neither number came from the objective, which is about naming electrical
    appliances and explaining what electricity does. A child who explains it
    correctly in one sentence reads two-sentences as a failure and pads.
    """

    def test_response_sizes_the_space_rather_than_setting_a_quota(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "`response` sizes the space the thinking needs; it is not a quota",
            designer,
        )
        self.assertIn("Write two sentences.", designer)

    def test_the_rule_names_when_a_length_is_legitimate(self) -> None:
        """Without its boundary this over-fires on a writing lesson, where the
        paragraph IS the learning, and on a test form practised at its real
        demand."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "Prescribe a length only when the length is itself the learning",
            designer,
        )
        self.assertIn("a paragraph in a writing lesson", designer)

    def test_the_rule_gives_a_checkable_tell(self) -> None:
        self.assertIn(
            "ask whether a correct short answer would fail it",
            flat(LESSON_DESIGNER),
        )


class DefinitionsDoNotCircleTests(unittest.TestCase):
    """The same lesson defined `electrical appliance` as using electricity to
    do a job, and `electricity` as what makes appliances work. Either card
    sends the child to the other."""

    def test_a_card_set_may_not_define_its_words_by_each_other(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn(
            "A set of cards must not define its words in terms of each other",
            preferences,
        )
        # Both halves of the real loop, so the rule shows the failure.
        self.assertIn(
            "An electrical appliance uses electricity to do a job", preferences
        )
        self.assertIn(
            "Electricity is a form of energy that can make appliances work",
            preferences,
        )

    def test_the_repair_is_named_not_merely_the_fault(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn(
            "at least one of them reaches outside the pair", preferences
        )

    def test_dropping_the_second_card_stays_on_the_table(self) -> None:
        """The existing job test already answers this, so the rule points at
        it rather than adding a second one."""
        preferences = flat(PREFERENCES)
        self.assertIn(
            "the second word does not need a card at all", preferences
        )
        # The job test it defers to must still be there.
        self.assertIn(
            "A word also has to be put to work somewhere in the lesson itself",
            preferences,
        )


if __name__ == "__main__":
    unittest.main()
