"""Three maths rules from the rounding comparison (11 September 2026).

The plugin's `Round to 10, 100 or 1,000` and an outside assistant's lesson on
the same objective were read side by side. The plugin's was the better taught
lesson: one invariant method across all three places, purpose before method,
halfway told as an agreement, a wrong answer to overturn, scripts and success
criteria. Three things the other one had, and Daniel's decision on the one
that was a real teaching call.

1. It secures the idea on two-digit numbers (43, 47, 45) before anything
   four-digit appears. The plugin's first model is 3,462, so a child meets the
   new idea and four-digit place value at once. Its own vocabulary cards use a
   20 to 30 line, which is the right instinct in the wrong place.
2. It derives the digit shortcut from the line rather than refusing it. The
   plugin deferred the shortcut to a later lesson on the ground that a child
   holding it can be right without understanding, which is true and leaves the
   class drawing a line for every question. Daniel: "It would do both I think,
   if easy." Both, with the shortcut derived at the end from the work the line
   has already done.
3. Its independent practice blocks the cases (nearest 10, then 100, then
   1,000) before mixing them. The plugin's five questions mix from the first
   item.
"""
from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MATHS = ROOT / "references" / "subject-maths.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class SecureItSmallThenScale(unittest.TestCase):
    def test_the_rule_and_its_reason(self) -> None:
        maths = flat(MATHS)
        self.assertIn(
            "Secure the new idea on numbers small enough to see, then scale to the ones the objective names",
            maths,
        )
        self.assertIn("holding the new idea and four-digit place value at the same time", maths)
        # It generalises past rounding.
        self.assertIn("a fraction of 8 before a fraction of 96", maths)

    def test_both_limits_are_stated(self) -> None:
        maths = flat(MATHS)
        # The small case must not become the lesson.
        self.assertIn("The small case is the way in, not the lesson", maths)
        self.assertIn("the objective's own numbers arrive quickly", maths)
        # And it is not always available.
        self.assertIn("where the difficulty genuinely is the size of the number", maths)


class TheShortcutIsDerivedNotRefusedOrHandedOver(unittest.TestCase):
    def test_both_failures_are_named(self) -> None:
        maths = flat(MATHS)
        self.assertIn("Offered early, it replaces the representation rather than summarising it", maths)
        self.assertIn("the class leaves drawing a number line for every question", maths)

    def test_it_is_asked_as_a_question_about_the_representation(self) -> None:
        maths = flat(MATHS)
        self.assertIn("Why is it always the digit to the right?", maths)
        self.assertIn("rather than announced as a second method", maths)
        # And a child can rebuild it.
        self.assertIn("can rebuild it from the line", maths)

    def test_the_gate_is_checkable(self) -> None:
        """`Once the representation has done its work` needs a test, or it is
        a feeling. Two things have to have happened."""
        maths = flat(MATHS)
        self.assertIn("used it to overturn a wrong answer", maths)
        self.assertIn("met the case the shortcut alone gets wrong", maths)

    def test_the_convention_is_not_derived(self) -> None:
        maths = flat(MATHS)
        self.assertIn("is stated as an agreement when the class hits it, not derived", maths)


class PractiseTheCasesBeforeMixingThem(unittest.TestCase):
    def test_the_rule_and_its_reason(self) -> None:
        maths = flat(MATHS)
        self.assertIn(
            "Where one method runs across several cases, practise each case in a short block before mixing them",
            maths,
        )
        self.assertIn("the choosing crowds out the running", maths)

    def test_the_mixing_is_not_dropped(self) -> None:
        """Blocking alone would remove the demand the objective actually makes."""
        maths = flat(MATHS)
        self.assertIn("choosing the case is where the learning actually shows", maths)
        self.assertIn("it comes second, in the same session", maths)

    def test_the_limit(self) -> None:
        self.assertIn("an objective whose difficulty is the choosing", flat(MATHS))


if __name__ == "__main__":
    unittest.main()
