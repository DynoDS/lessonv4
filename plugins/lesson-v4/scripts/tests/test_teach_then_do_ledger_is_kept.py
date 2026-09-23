"""Every Teach then Do rule the teacher's ledger recorded is still where it lives.

The rhythm (one idea per Teach, used by every child before the next) was
written in about 309 places across 29 files: in `preferences.md`, again in the
Lesson Designer's own words, a third time in the content route, and in pieces
across the other routes, the catalogue and the reviewer. The streamline of
23 September 2026 listed every one (plans/2026-09-22-teach-then-do-ledger.md),
the teacher decided each disagreement, and the rules were folded into one home,
`preferences.md` -> The Teach → Do → Teach → Do Rhythm, with the designer
keeping how it records the rhythm.

`teach_then_do_ledger_pins.json` holds each row's words where they now live.
A change that drops, rewords or moves a pinned rule fails here; the fix is to
update the ledger and the pins on purpose, with the teacher's say-so.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, flat, make_ledger_tests, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("teach_then_do_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-22-teach-then-do-ledger.md"

EveryTeachThenDoRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "TD", 309)


class TheRhythmHasOneHome(unittest.TestCase):
    """Decision 1: the designer reads the one home whole and keeps only how it
    records the rhythm."""

    def test_the_designer_keeps_no_second_copy_of_the_rhythm(self) -> None:
        designer = section_by_heading(ROOT / "agents" / "lesson-designer.md", "### The Teach → Do Rhythm", 0)
        for gone in ("Short explanation + model completing same manageable idea",
                     "Skill-based: child-processing = guided + independent practice",
                     "A use of the wrong idea is not the beat either",
                     "Every beat earns place against objective",
                     "Vary form when improves learning/attention/access"):
            with self.subTest(gone=gone):
                self.assertNotIn(gone, designer)
        self.assertIn("`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm: read it whole", designer)
        # What only the designer records stays with it.
        for kept in ("**Write each beat's `unlocks` by looking forward, not back.**",
                     "**Write each beat's `minutes` as the time it really takes with a class, and read the sum.**",
                     "**Write each beat's `thinking` before you choose its activity.**",
                     "A substantial task is launched before it is instructed"):
            with self.subTest(kept=kept):
                self.assertIn(kept, designer)


class TheReviewerReadsTheRulesItChecks(unittest.TestCase):
    """Decision 6: the reviewer reads each route file only down to
    `## Output Format Block`, so the rules it checks sit above that line."""

    def test_the_moved_rules_stay_above_the_line(self) -> None:
        for name, marker in (
            ("teaching-sequence-skill-based.md", "## Cycles, and the beats around them"),
            ("teaching-sequence-task-centred.md", "**A task with several stages stays one `do-task`, and `steps` is where the stages live.**"),
            ("teaching-sequence-discovery.md", "### When the lesson discovers two things"),
        ):
            lines = (ROOT / "references" / name).read_text(encoding="utf-8").splitlines()
            with self.subTest(route=name):
                # Found by its heading line, so a cross-reference to the
                # section higher up is not mistaken for it.
                self.assertIn("## Output Format Block", lines)
                above = " ".join(lines[:lines.index("## Output Format Block")])
                self.assertEqual(above.count(marker), 1)


class TheTeachersDecisionsAreWritten(unittest.TestCase):
    RHYTHM = section_by_heading(ROOT / "references" / "preferences.md", "## The Teach → Do → Teach → Do Rhythm", 0)

    def test_two_teacher_slides_are_counted_as_one_idea(self) -> None:
        """Decision 2, the teacher's words: "We shouldnt outright ban 2 teach
        slides one after the other ... What it cannot do though is teach them
        something, then teach them something different"."""
        self.assertIn("so it counts ideas, not slides", self.RHYTHM)
        self.assertIn("It's cognitive overload, 101.", self.RHYTHM)

    def test_setting_the_scene_carries_the_random_slide_test(self) -> None:
        """Decision 3, with his test: open any slide and see what it is doing
        and why, or go back one or two slides and see why."""
        self.assertIn("His test for any lesson is to open a slide at random and read it", self.RHYTHM)
        self.assertIn("never a beat of its own with a made-up task after it", self.RHYTHM)

    def test_a_practical_lesson_opens_on_the_challenge_only_under_its_conditions(self) -> None:
        """Decisions 1 and 11: the voice guide's practical shape moved with the
        bounded-attempt conditions and the maths exception."""
        self.assertIn("**A practical lesson keeps the teaching short and lets the doing lead.**", self.RHYTHM)
        self.assertIn("only under the Skill-based route's conditions for a bounded first attempt", self.RHYTHM)
        self.assertIn("a maths skill lesson opens with the model", self.RHYTHM)
        # The challenge is an attempt at the target; investigating first keeps its own route.
        self.assertIn("An investigation or observation before the teaching is not this challenge", self.RHYTHM)

    def test_a_question_as_the_do_writes_how_every_child_commits(self) -> None:
        """Decision 8: the commitment is part of the task; gathering is the teacher's."""
        self.assertIn("How every child commits is written into the task itself", self.RHYTHM)


if __name__ == "__main__":
    unittest.main()
