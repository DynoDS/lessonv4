"""Every quick-check rule the teacher's ledger recorded is still where it lives.

What makes a quick check genuine was written about 307 times: the rule that a
check is a fresh case and not the last slide again, its copies in every subject
and route, the excuse that let a beat pass by being "named as a check", the
permissions for a short recall, and the catalogue formats that give back what
was just taught. The streamline of 23 September 2026 listed every one
(plans/2026-09-22-quick-checks-ledger.md), the teacher agreed each decision,
and the rule now has one home, `preferences.md` -> `A quick check is a fresh
case, not the last slide again`, with what makes a case fresh, when recall is
honest, and when saying what a beat is for is honest written beside it.

`quick_checks_ledger_pins.json` holds each row's words where they now live, and
the excuse's wordings as gone. The fix for a failure here is to update the
ledger and the pins on purpose, with the teacher's say-so.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, make_ledger_tests, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("quick_checks_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-22-quick-checks-ledger.md"

EveryQuickCheckRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "QC", 307)


class TheTeachersDecisionsAreWritten(unittest.TestCase):
    RHYTHM = section_by_heading(ROOT / "references" / "preferences.md", "## The Teach → Do → Teach → Do Rhythm", 0)

    def test_recall_from_memory_is_honest_and_finding_the_board_is_not(self) -> None:
        """Decision 4: what separates recall from finding is whether the answer
        is still in front of the child."""
        self.assertIn("The difference is whether the answer is still in front of the child", self.RHYTHM)
        self.assertIn("it claims recall, never understanding", self.RHYTHM)

    def test_saying_what_a_beat_is_for_never_stands_in_for_the_fresh_case(self) -> None:
        """Decision 1: the honest "say so" rules stay; the label never replaces the case."""
        self.assertIn("It never lets a label stand in for the fresh case", self.RHYTHM)

    def test_a_label_check_straight_after_teaching_uses_a_new_picture(self) -> None:
        """Decision 3, with its two limits."""
        self.assertIn("the label check straight after the Teach is on a new picture of the same thing", self.RHYTHM)
        self.assertIn("a blank copy of the same one is the check", self.RHYTHM)

    def test_the_summary_formats_carry_their_limit(self) -> None:
        """Decision 5: eight formats keep their place with the one-line limit."""
        beats = (ROOT / "references" / "do-beats.md").read_text(encoding="utf-8")
        self.assertEqual(beats.count("**The limit:** not straight after the Teach it gives back"), 8)


if __name__ == "__main__":
    unittest.main()
