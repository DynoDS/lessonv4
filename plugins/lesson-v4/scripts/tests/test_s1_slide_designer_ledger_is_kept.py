"""Every rule in the slide designer's three always-read files is still where it lives.

The slide designer reads its own role file, the composition playbook and the
teacher slide visual profile in full on every run, and the same rule was often
written in two or three of them: the main task in the body three times, the
answer rules three times inside the role, the word-card placement twice with
different details, the playbook's opening word for word the role's. The S1
streamline of 17 October 2026 listed every paragraph of the three files
(plans/2026-10-17-s1-ledger.md), the teacher answered its fourteen decisions
("Yes to all", plans/2026-10-17-s1-decisions.md), and each rule now has one copy.

`s1_slide_designer_ledger_pins.json` holds each row's words where they now live,
each changed paragraph whole, and the four homes the change made paragraph by
paragraph. A failure here means a rule moved, thinned or came back; the fix is
to update the ledger and the pins on purpose, with the teacher's say-so.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, flat, make_ledger_tests  # noqa: E402

PINS = Path(__file__).resolve().with_name("s1_slide_designer_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-10-17-s1-ledger.md"

ROLE = ROOT / "agents" / "slide-designer.md"
PLAYBOOK = ROOT / "references" / "slide-composition-playbook.md"
PROFILE = ROOT / "references" / "teacher-slide-visual-profile.md"

EverySlideDesignerRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "SD", 667)


def text(path: Path) -> str:
    return flat(path.read_text(encoding="utf-8"))


class TheTeachersDecisionsAreWritten(unittest.TestCase):
    def test_the_header_cue_rule_has_one_copy(self) -> None:
        """D1: the main task goes in the body; the profile holds the one copy."""
        self.assertIn("The small top-right `instruction` in the slide header is a secondary cue", text(PROFILE))
        self.assertNotIn("### Main task versus header cue", ROLE.read_text(encoding="utf-8"))
        self.assertNotIn("A child who misses the small top-right header cue", text(PLAYBOOK))

    def test_the_launch_opening_line_has_its_own_slide(self) -> None:
        """D2, his 18 September ruling: the case comes first, on its own slide."""
        self.assertIn("leads on a short slide of its own before the pair", text(PLAYBOOK))
        self.assertNotIn("the `established` line above it only when the design still carries one", text(PLAYBOOK))

    def test_the_overview_sheet_settles_the_composition_pass(self) -> None:
        """D3: the pre-write checklist went; looking at every slide alone did too."""
        role = text(ROLE)
        self.assertNotIn("every slide at board-distance scale", role)
        self.assertIn("Use the overview contact sheet or sheets as the primary evidence", role)

    def test_the_six_reminders_stay(self) -> None:
        """D4: kept on purpose beside their one owner."""
        role = text(ROLE)
        for cue in ("Show the task once", "Make task phases visible", "Preserve card boundaries",
                    "row-versus-stack judgement"):
            self.assertIn(cue, role)

    def test_a_word_card_never_sits_between_a_question_and_its_answer(self) -> None:
        """D7: his 13 October ruling, which only the check knew, in his words."""
        self.assertIn("A card never sits between a question slide and its answer", text(PLAYBOOK))
        self.assertIn("\"or it could have went before the task\"", text(PLAYBOOK))

    def test_worked_answers_keep_the_headings_the_drawing_prints(self) -> None:
        """D8: Th, H, T, O is the heading he wants; shrinking the digits is the failure."""
        playbook = text(PLAYBOOK)
        self.assertIn("their headings as the drawing prints them (`Th`, `H`, `T`, `O` on a column sum)", playbook)
        self.assertNotIn("their headings written in full", playbook)

    def test_the_exchanged_ten_not_the_small_1(self) -> None:
        """D9."""
        self.assertNotIn("the small 1", text(PLAYBOOK))
        self.assertIn("the answer and the exchanged ten in green", text(PLAYBOOK))

    def test_the_four_small_disagreements_are_settled(self) -> None:
        """D10 a to d."""
        playbook, role = text(PLAYBOOK), text(ROLE)
        self.assertIn("A written story, case or source the task runs on is the exception: it comes first", playbook)
        self.assertIn("and for two examples that would otherwise share one annotated figure (§8), and for nothing else", playbook)
        self.assertIn("The exception is a table the design itself files as a set of criteria", role)
        self.assertIn("(18pt where 20pt would leave the picture too small, never less)", role)

    def test_the_designers_own_line_only_when_needed(self) -> None:
        """D11: the stricter wording, written once in the playbook."""
        self.assertIn("and only when it is necessary to operate a source-defined surface", text(PLAYBOOK))


if __name__ == "__main__":
    unittest.main()
