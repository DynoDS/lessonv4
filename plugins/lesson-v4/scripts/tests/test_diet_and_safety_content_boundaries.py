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
    balance. Eatwell frames balance as variety in proportion over a day or
    week, with no per-meal portion rules.
    """

    def test_balance_is_judged_over_time_not_per_meal(self) -> None:
        pshe = flat(PSHE)
        self.assertIn(
            "Balance is a property of eating over time, never of one meal.",
            pshe,
        )
        self.assertIn("Eatwell Guide", pshe)
        self.assertIn("explain why the whole lunch is balanced", pshe)
        # The task shapes a meal genuinely supports.
        self.assertIn("plan or improve a meal", pshe)

    def test_per_meal_quotas_are_named_as_the_misconception(self) -> None:
        pshe = flat(PSHE)
        self.assertIn("No invented per-meal quotas.", pshe)
        self.assertIn("Add two fruit or vegetable portions", pshe)
        self.assertIn("the apple misconception wearing better clothes", pshe)

    def test_body_jobs_stay_a_scaffold_not_the_definition(self) -> None:
        pshe = flat(PSHE)
        self.assertIn(
            "teaching scaffold, not the definition of balance", pshe
        )
        self.assertIn("replaced the concept with its scaffold", pshe)

    def test_food_stays_neutral_and_processing_stays_in_proportion(self) -> None:
        pshe = flat(PSHE)
        self.assertIn("no good or bad food labels", pshe)
        self.assertIn("not automatically unhealthy", pshe)
        self.assertIn("said once and in proportion, not run as a theme", pshe)


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
