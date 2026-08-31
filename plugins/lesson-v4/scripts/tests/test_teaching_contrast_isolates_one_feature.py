from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TeachingContrastIsolatesOneFeatureTests(unittest.TestCase):
    """A Y4 Science appliances lesson taught the electrical category by
    contrasting an electric kettle with a hand whisk, and asked `What job does
    electricity do in the kettle that your hand does in the whisk?`

    Two faults in one. The pair changes the job and the power source together,
    so it isolates nothing and a child has two differences to choose from; and
    the question folds the second case into a trailing relative clause, so it
    has to be reread before it can be answered.

    The principle already existed - "Hold irrelevant features stable, vary the
    taught feature" - but scoped to the diagnostic check, so a contrast used
    to TEACH was governed by nothing. Same shape as the other unrouted rules
    found on 31 Aug 2026.
    """

    def test_the_rule_exists_and_names_the_principle(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "A contrast that teaches a category changes one thing only",
            designer,
        )
        self.assertIn(
            "hold every irrelevant feature stable and vary only that one",
            designer,
        )

    def test_the_diagnostic_version_of_the_principle_still_stands(self) -> None:
        """The teaching rule borrows it rather than replacing it."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "Hold irrelevant features stable, vary the taught feature",
            designer,
        )

    def test_the_failed_pair_and_its_repair_are_both_named(self) -> None:
        """A rule that names only the principle leaves the designer to guess
        what a bad pair looks like."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn("electric kettle beside a hand whisk", designer)
        self.assertIn("electric whisk beside a hand whisk", designer)
        self.assertIn(
            "They do a similar job, so what makes one electrical?", designer
        )

    def test_wording_is_not_offered_as_the_repair_for_a_bad_pair(self) -> None:
        """The tempting wrong fix: rewrite the question and keep the pair."""
        self.assertIn(
            "never repaired by better wording, because the confusion is in "
            "the choice of examples",
            flat(LESSON_DESIGNER),
        )

    def test_each_case_gets_its_own_clause(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn("state each case in its own clause", designer)
        self.assertIn(
            "Your hand makes a hand whisk move. What makes an electric whisk "
            "move?",
            designer,
        )

    def test_the_rule_reaches_beyond_misconception_strategies(self) -> None:
        """It was written into a misconception strategy AND a key question, so
        scoping it to one field would miss the other."""
        self.assertIn(
            "a misconception strategy, a Teach beat's examples, a sorting "
            "set, a key question",
            flat(LESSON_DESIGNER),
        )


if __name__ == "__main__":
    unittest.main()
