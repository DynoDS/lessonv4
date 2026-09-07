from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class BriefAbsorptionAndUnroutedRuleTests(unittest.TestCase):
    """Four faults found in one Y4 Science appliances lesson, 31 Aug 2026.

    The brief was `LO: To name electrical appliances`, plus three angles
    offered as "possible approaches you could take". The lesson came back
    with all three welded into the objective, a worksheet with no
    photographs in a lesson about recognising appliances, mark-scheme
    phrasing printed to the class, and a criteria step nothing had told it
    how to phrase.
    """

    def test_a_supplied_objective_is_never_widened(self) -> None:
        """Folding suggestions into the objective is the one place a
        suggestion can never be declined again: every downstream check then
        treats it as required, and it decides what children are assessed on."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "A supplied objective is used as written - never widened",
            designer,
        )
        # The real expansion, kept so the rule names its own failure.
        self.assertIn("To name electrical appliances` became", designer)
        # The teacher chose depth over a flag when an LO looks thin.
        self.assertIn(
            "the answer is depth, not breadth", designer
        )
        # Depth must not become the same breadth with the label removed.
        self.assertIn(
            "may be the *route* you teach it by", designer
        )
        # The binding statement agrees with the owning section.
        self.assertIn(
            "the objective as written (neither narrowed nor widened", designer
        )

    def test_freshness_does_not_permit_changing_the_medium(self) -> None:
        """The worksheet engine embeds real photographs and the photo cap was
        not reached, so a text-only sheet was a choice. Swapping photographs
        for written clues stopped the sheet testing recognition."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "For fresh additional practice, change instances rather than the teaching medium", designer
        )
        self.assertIn("Object A washes clothes", designer)
        self.assertIn(
            "when the lesson's evidence is photographs, the sheet carries "
            "photographs",
            designer,
        )
        # The old abstract three-word version is gone.
        self.assertNotIn("Keep representation familiar.", designer)

    def test_structured_answer_values_reach_the_child_facing_list(self) -> None:
        """The rule named `answer.content`; the text that actually printed sat
        in `answer.structure.results`, so it was governed by nothing."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn("every `answer.structure` value a child reads", designer)
        self.assertIn(
            "`answer.content` sitting null does not mean nothing prints",
            designer,
        )
        self.assertIn("A rechargeable battery charged from the mains", designer)

    def test_steps_criteria_are_routed_in_every_structure(self) -> None:
        """Step-wording mechanics live in the skill-based sequence file, and a
        content lesson is told to read one sequence file. Preferences allow any
        structure to choose steps, so those lessons had no step guidance."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "Steps-shaped criteria in a non-skill lesson still need those "
            "mechanics",
            designer,
        )
        self.assertIn("Explain the job electricity powers", designer)
        # Read the section, not the whole file: one sequence file still holds.
        self.assertIn(
            "read only the `Writing the Success Criteria` section", designer
        )
        self.assertNotIn(
            "They apply to procedures/skills, so already reading that file",
            designer,
        )


if __name__ == "__main__":
    unittest.main()
