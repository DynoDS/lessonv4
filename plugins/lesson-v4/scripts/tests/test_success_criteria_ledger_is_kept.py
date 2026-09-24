"""Every success-criteria rule the teacher's ledger recorded is still where it lives.

What the plugin says about a lesson's success criteria was written 392 times:
what they are for, when a lesson has them, their form, how a step reads, the
colour marks, where they appear on the board, the wall and the sheet, building
them live, and what the programs check. The streamline of 23 September 2026
listed every one (plans/2026-09-23-success-criteria-ledger.md), the teacher
answered all sixteen decisions and the read-back, and each rule has one home:
`preferences.md` -> Success Criteria (what they are and where), `teacher-voice.md`
-> 10. Success criteria (how a step sounds, with his rewrites), and the skill
route's Writing the Success Criteria (step and table mechanics).

`success_criteria_ledger_pins.json` holds each row's words where they now live,
the homes paragraph by paragraph, and the retired wordings as gone. The fix for
a failure here is to update the ledger and the pins on purpose, with the
teacher's say-so.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, flat, make_ledger_tests, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("success_criteria_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-23-success-criteria-ledger.md"
PREF = ROOT / "references" / "preferences.md"

EverySuccessCriteriaRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "SC", 392)


class TheTeachersDecisionsAreWritten(unittest.TestCase):
    HOME = section_by_heading(PREF, "## Success Criteria", 0)

    def test_every_taught_word_is_green_every_time(self) -> None:
        """Decision 1."""
        self.assertIn("Every taught word is green, every time", self.HOME)
        self.assertNotIn("the picture wins, then the taught word", self.HOME)

    def test_criteria_are_what_a_stuck_child_uses_and_stems_count(self) -> None:
        """Decision 6, in his words: "something the children can use to help them do the thing"."""
        self.assertIn("Criteria are what a child who gets stuck looks at and uses to do the task.", self.HOME)
        self.assertIn("sentence stems are criteria too", self.HOME)

    def test_never_on_a_worksheet(self) -> None:
        """Decision 8: "I don't want any success criteria on worksheets.\""""
        self.assertIn("**They stay on the board, and never go on a worksheet.**", self.HOME)
        render = (ROOT / "worksheet-html" / "src" / "render.js").read_text(encoding="utf-8")
        self.assertIn("CRITERIA_NOT_ON_SHEETS", render)

    def test_the_whole_list_or_none(self) -> None:
        """Decision 3."""
        self.assertIn("never only some of them, on a slide, on the wall or anywhere else", self.HOME)
        for rel in ("builder/src/success-criteria-panel.js", "builder/src/content/steps.js"):
            with self.subTest(file=rel):
                self.assertNotIn("fewer criteria on this slide", flat((ROOT / rel).read_text(encoding="utf-8")))

    def test_a_short_question_is_a_step(self) -> None:
        """Decision 15: "Same? Move right." is "short and snappy and it makes sense"."""
        self.assertIn("(`Same? Move right.`)", self.HOME)
        voice = flat((ROOT / "references" / "teacher-voice.md").read_text(encoding="utf-8"))
        self.assertNotIn("Write a condition as a sentence, not a slogan", voice)

    def test_his_rounding_rewrite_names_no_result(self) -> None:
        """Decision 9: a second sentence that only names what the step produced goes."""
        voice = flat((ROOT / "references" / "teacher-voice.md").read_text(encoding="utf-8"))
        self.assertIn("> Change the ones digit to 0. / Add 10. / Mark halfway and your number. / Round to the nearer ten. If it is halfway, round up.", voice)

    def test_the_wall_never_rewords_a_step(self) -> None:
        """Decision 12: "I don't think it should be reworded."""
        wall = flat((ROOT / "agents" / "working-wall-designer.md").read_text(encoding="utf-8"))
        self.assertIn("SC steps are never shortened, split or reworded to fit.", wall)


if __name__ == "__main__":
    unittest.main()
