"""A maths worksheet is worked while the method is still being held.

Traced on 12 September 2026 across four built maths sheets. Three carried the
lesson's own representation onto the page; one did not, and it is the lesson
the teacher abandoned mid-teaching for a separate reason. "Find 10 and 100 more
or less" modelled the move by shifting counters on a place-value chart and
guided the class on the same chart; its worksheet used circle-the-answer, a
data table and an inequality with boxes, and no chart anywhere.

Nothing required otherwise. The only rule nearby, in the generated-worksheet
component, says fresh practice changes instances rather than the medium, which
is general guidance the designer weighs rather than a maths expectation, so the
three good sheets were good by judgement.

The repair is not "always mirror the board", which the teacher rejected when it
was put to him: "that could also be fine, maybe not for below children, but
expected might have example from the board, then move on to different context,
or greater depth might start straight form different context". Translation cost
is a real demand and belongs where the method is secure. So the continuation is
graded by tier, and the slides still carry the whole lesson alone.
"""
from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MATHS = ROOT / "references" / "subject-maths.md"
COMPONENTS = ROOT / "references" / "lesson-designer-components.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheRuleIsGradedByTierTests(unittest.TestCase):
    def setUp(self):
        self.maths = flat(MATHS)

    def test_the_rule_exists_and_is_maths_only(self):
        self.assertIn(
            "**A maths sheet is the lesson continued, and the continuation is "
            "graded.**",
            self.maths,
        )
        # The reason it is maths-only, or it reads as a preference about sheets.
        self.assertIn("What is different in maths is WHEN the sheet is worked", self.maths)

    def test_each_tier_is_told_where_it_opens(self):
        self.assertIn("**Below opens and stays in the board's form.**", self.maths)
        self.assertIn("**Expected opens in the board's form, then moves.**", self.maths)
        self.assertIn(
            "**Greater Depth may open straight into a new context.**", self.maths
        )

    def test_translation_cost_is_named_as_a_demand_not_a_fault(self):
        # Without this the three tiers read as three strengths of the same
        # prohibition, and Greater Depth loses the thing that makes it deeper.
        self.assertIn("Translation cost is the thing being graded here", self.maths)
        self.assertIn(
            "it belongs where the method is already secure and not where it is "
            "still being built",
            self.maths,
        )

    def test_the_failure_it_prevents_is_named(self):
        self.assertIn("its sheet had no chart anywhere", self.maths)
        self.assertIn(
            "A child who could do the maths and could not read the layout looked "
            "exactly like a child who could not do the maths",
            self.maths,
        )

    def test_the_repair_can_also_be_to_the_lesson(self):
        # The teacher's own reading of that deck: the table was a good idea in
        # the wrong place. Reading the fault only as a worksheet fault loses the
        # better repair now that the route has a beat for it.
        self.assertIn(
            "a form worth meeting on the sheet is usually worth meeting once on "
            "the board",
            self.maths,
        )
        self.assertIn("as a practise or apply beat after the cycles", self.maths)


class TheSlidesStillStandAloneTests(unittest.TestCase):
    def test_the_sheet_is_still_an_optional_extra(self):
        # The whole engine rests on this and a maths-specific rule about form is
        # the obvious place to erode it by accident.
        maths = flat(MATHS)
        self.assertIn(
            "A worksheet is an optional extra in every subject, and that does not "
            "change here",
            maths,
        )
        self.assertIn("printing nothing loses none of it", maths)
        self.assertIn(
            "a class that does its independent work in books has still done the "
            "lesson",
            maths,
        )

    def test_no_classroom_routine_is_prescribed(self):
        # The plugin serves any teacher, and the rule that prompted this one came
        # from one teacher's routine. It is written from WHEN a sheet is worked,
        # which is true of any classroom, so the new section names no surface and
        # no seating.
        section = flat(MATHS)
        start = section.index("**A maths sheet is the lesson continued")
        end = section.index("## Making practice generative", start)
        rule = section[start:end].lower()
        # Named as phrases: "table" alone is a maths object, and the evidence
        # here is a sheet that opened with a data table.
        for phrase in ("whiteboard", "carpet", "on the floor", "back to their", "sitting"):
            self.assertNotIn(phrase, rule)

    def test_the_response_surface_stays_the_teacher_s(self):
        # The file's existing position, which this rule must not quietly undo.
        maths = flat(MATHS)
        self.assertIn(
            "The teacher decides live grouping, carpet work, response surfaces, "
            "pace and when different children move on",
            maths,
        )


class TheGuidanceReachesBothAgentsTests(unittest.TestCase):
    def test_the_designer_is_routed_to_it_where_it_shapes_the_sheet(self):
        # The worksheet's content is decided in the design, not by the worksheet
        # designer, which copies pupil prompts verbatim.
        components = flat(COMPONENTS)
        self.assertIn(
            "In maths, which form each tier's sheet opens in is decided in "
            "`subject-maths.md`",
            components,
        )
        self.assertIn("Read it before choosing the sheet's shape", components)

    def test_the_reviewer_reads_the_forms_rather_than_the_objective(self):
        reviewer = flat(REVIEWER)
        self.assertIn(
            "**in maths, the sheet continues the lesson in the right form for its "
            "tier**",
            reviewer,
        )
        # The old one-line consistency check passed the chartless sheet, so the
        # new one says what to actually look at.
        self.assertIn("Read each sheet's opening questions against the board", reviewer)
        self.assertIn(
            "read the forms rather than confirming the objective matches", reviewer
        )
        self.assertIn(
            "say whether the lesson should have met it once first", reviewer
        )


if __name__ == "__main__":
    unittest.main()
