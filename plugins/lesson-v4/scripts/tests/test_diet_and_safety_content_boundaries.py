from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCIENCE = ROOT / "references" / "subject-science.md"
PSHE = ROOT / "references" / "subject-pshe.md"
PREFERENCES = ROOT / "references" / "preferences.md"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ScienceContentBoundaryTests(unittest.TestCase):
    """Two content faults from the Y4 appliances lesson (4.2.34, 31 Aug
    2026), both misses of a boundary no rule stated.

    The vocabulary card defined electricity as `a form of energy`, the
    documented conflation children later have to be taught out of, in a
    lesson whose objective never needed electricity defined. And a
    photographs-only lesson carried `Electricity can cause serious injury or
    death. Never touch electrical appliances with wet hands.` as sticky
    knowledge, because safety wording was treated as exempt from the
    extra-wording-must-earn-its-place test that governs everything else.

    The teacher rejected a first repair that banned safety outside safety
    objectives (31 Aug 2026): a shadows lesson that sends children outside
    earns `never look directly at the sun` as sticky knowledge, so the rule
    is the earning test, not a ban.
    """

    def test_electricity_is_described_by_what_it_does(self) -> None:
        science = flat(SCIENCE)
        self.assertIn(
            "electricity provides the energy appliances need to work", science
        )
        self.assertIn("never define it as `a form of energy`", science)
        # The conflation is the reason, or the rule is a bare prohibition.
        self.assertIn("interchangeable words", science)

    def test_a_definition_the_objective_does_not_need_is_not_written(self) -> None:
        science = flat(SCIENCE)
        self.assertIn(
            "where the objective does not need a term defined at all, do not "
            "define it",
            science,
        )
        self.assertIn("not an account of what electricity is", science)

    def test_safety_wording_earns_its_place_like_any_other(self) -> None:
        science = flat(SCIENCE)
        self.assertIn(
            "Safety wording is not exempt from earning its place.", science
        )
        # The earning test, not a ban keyed on the objective.
        self.assertIn(
            "what these children will actually do because of this lesson",
            science,
        )
        self.assertIn(
            "what a child would do differently for having met it", science
        )
        # The real over-application, kept as the counter-example.
        self.assertIn(
            "`Electricity can cause serious injury or death` as sticky "
            "knowledge",
            science,
        )
        # Why over-warning harms: it trains children to skim warnings.
        self.assertIn("safety lines as background noise", science)
        # The discrimination case that killed the first, banning, repair.
        self.assertIn("never look directly at the sun", science)
        self.assertIn(
            "though nobody handles anything and safety is not the objective",
            science,
        )


class DietContentBoundaryTests(unittest.TestCase):
    """The Y4 balanced-diet lesson (4.2.34, 31 Aug 2026) avoided food
    moralising and then rebuilt the concept wrongly: the task asked children
    to prove one lunch balanced, a success criterion invented `Add two fruit
    or vegetable portions.`, and the three body jobs became the definition of
    balance. Four food rules went into the PSHE file for it.

    On 24 September 2026 the teacher took them out ("those balanced diet
    things sound like things I wouldnt want in the pshe subject files") and
    asked for a pointer instead ("maybe the subject file could say to look for
    guidance from eatwell guide thing"), then said "yes" to the same line in
    science, which teaches diet too and never reads the PSHE file. What reaches
    a diet lesson another way stays where it is: the reviewer's single-lunch
    example, the food plate's caption and its ban on good and bad foods, and
    the rule against an invented count in a criterion (below).
    """

    EATWELL = (
        "A lesson about food, diet or healthy eating follows the NHS Eatwell "
        "Guide for what a balanced diet is and how it is shown."
    )

    def test_pshe_and_science_point_to_the_eatwell_guide_and_nothing_more(self) -> None:
        for path in (PSHE, SCIENCE):
            with self.subTest(file=path.name):
                self.assertIn("## Food and diet " + self.EATWELL, flat(path))
        # The rules' own sentences are gone from every subject file, where
        # they were design rules. The reviewer keeps its single-lunch example,
        # so the bar is on the subject files, not the whole plugin.
        for path in sorted((ROOT / "references").glob("subject-*.md")):
            text = flat(path)
            for phrase in (
                "Diet lessons recur in every primary year",
                "Balance is a property of eating over time, never of one meal.",
                "explain why the whole lunch is balanced",
                "No invented per-meal quotas.",
                "the apple misconception wearing better clothes",
                "teaching scaffold, not the definition of balance",
                "replaced the concept with its scaffold",
                "no good or bad food labels",
                "not automatically unhealthy",
                "said once and in proportion, not run as a theme",
            ):
                with self.subTest(file=path.name, phrase=phrase):
                    self.assertNotIn(phrase, text)


class CountsAndFootprintTests(unittest.TestCase):
    """The two general classes behind the diet faults, placed with their
    general owners rather than in the subject file.

    A count invented to make judging easier becomes the concept in the
    child's head, the same way `Write two sentences.` became the marking on a
    worksheet (fixed at 4.2.34 for response length; the balanced-diet SC
    showed the same fault in criteria). And the processed-food idea, one
    genuine but secondary correction, consumed a sticky slot, a misconception,
    a teaching question, a lunch comparison and a worksheet claim in a lesson
    about why balance matters.
    """

    def test_criteria_counts_need_a_source(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn(
            "A count inside a criterion comes from the curriculum, the "
            "guidance or the task's real demand - never invented to make "
            "judging easier.",
            preferences,
        )
        self.assertIn("Children learn the count as the concept.", preferences)
        # Shares the worksheet rule's tell, folding rather than stacking.
        self.assertIn("the number is doing the marking", preferences)
        # The boundary: a count that is genuinely the demand stays.
        self.assertIn(
            "A count that genuinely is the demand stays", preferences
        )

    def test_misconception_footprint_scales_with_blocking_power(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "Weight each misconception's footprint to how much it blocks "
            "today's objective.",
            designer,
        )
        self.assertIn(
            "A genuine but secondary correction gets one clean touch",
            designer,
        )
        self.assertIn(
            "more lesson real estate on the side correction than on the "
            "objective's own sticking point",
            designer,
        )


if __name__ == "__main__":
    unittest.main()
