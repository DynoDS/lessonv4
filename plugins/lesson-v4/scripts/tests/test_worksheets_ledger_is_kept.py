"""Every worksheets rule the teacher's ledger recorded is still where it lives.

What the plugin says about a lesson's worksheets was written 478 times: what a
sheet is for and its relationship to the slide practice, the two kinds of
sheet, designing the activity, the response form, how a sheet's questions are
worded, numbering, what a sheet may lean on, books or sheet, the three levels,
the answer key, the printed page, the worksheet designer's authority, the
reviewer's checks and what the sheet engine checks. The streamline of 23 and
24 September 2026 listed every one (plans/2026-09-23-worksheets-ledger.md), the
teacher answered its five decisions, confirmed the fifteen settled items and
answered the one question they left open, and each rule has one home:
`preferences.md` -> Worksheets (what the sheet is for, and the printed page),
`lesson-designer-components.md` -> Generated worksheet (designing the activity),
`subject-maths.md` (a maths sheet), `books-or-sheet.md`, and the worksheet
designer's own rules (realising faithfully, what goes back and what is a note).

`worksheets_ledger_pins.json` holds each row's words where they now live, the
homes paragraph by paragraph, and the retired wordings as gone. Thirteen of
the ledger's rows live in the sheet engine (`worksheet-html/`), so this topic's
rows are read from that folder too. The fix for a failure here is to update
the ledger and the pins on purpose, with the teacher's say-so.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import LEDGER_FOLDERS, ROOT, flat, make_ledger_tests, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("worksheets_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-23-worksheets-ledger.md"
PREF = ROOT / "references" / "preferences.md"

EveryWorksheetsRowIsStillInItsHome = make_ledger_tests(
    PINS, LEDGER, "WS", 478, folders=LEDGER_FOLDERS + ("worksheet-html",)
)


def text(rel: str) -> str:
    return flat((ROOT / rel).read_text(encoding="utf-8"))


class TheTeachersDecisionsAreWritten(unittest.TestCase):
    FOR = section_by_heading(PREF, "### What the sheet is for", 0)
    PAGE = section_by_heading(PREF, "### The printed page", 0)

    def test_the_board_and_the_sheet_never_share_questions(self) -> None:
        """Decision 2: "I wouldn't want the same exact questions on both."\""""
        self.assertIn("The practice slide keeps its own questions, and the sheet never carries them for a second go", self.FOR)
        # 1 October 2026: his one-question case (first written for PSHE) is now
        # the rule for every objective a child shows in one good answer, in any
        # subject; it is still answered once, never on the board and the sheet.
        self.assertIn("on a one-answer sheet the sheet is the final task's question, answered once, on the sheet, as the proof", self.FOR)
        self.assertIn("**What the sheet is depends on what kind of learning the objective is.**", self.FOR)
        self.assertIn("*name the parts of the digestive system* needs many goes, and *explain how the digestive system works* is one good answer", self.FOR)
        self.assertNotIn("in a lesson like PSHE that works towards one question", self.FOR)
        # "Same performance" is the skill, and a test holds it; it must not
        # become "same questions".
        self.assertIn("When the sheet asks for essentially the same performance as the slide Practise", self.FOR)
        self.assertIn("the sheet never repeats the practice slide's questions", text("agents/design-reviewer.md"))
        # The one-answer case reaches the two pointers the lesson designer
        # reads while designing the sheet (the first check's finding 4).
        for rel in ("agents/lesson-designer.md", "references/lesson-designer-components.md"):
            with self.subTest(file=rel):
                self.assertIn("never its questions (on a one-answer lesson the sheet is the final task's question, "
                              "answered as the proof", text(rel))

    def test_a_sheet_a_child_could_not_use_goes_back(self) -> None:
        """Decision 5: "agree, should probably go back to be redesigned"."""
        wsd = text("agents/worksheet-designer.md")
        self.assertIn("11. **A sheet a child could not use goes back; a doubt the teacher should hear is a note.**", wsd)
        self.assertIn("make the other sheets as normal", wsd)
        self.assertIn("A page merely plainer than hoped", wsd)
        # A sheet that contradicts the objective goes back; no example of a
        # shipping doubt the plan never had (the first check's finding 6).
        self.assertIn("or a sheet that contradicts the objective, stops that sheet", wsd)
        self.assertNotIn("an upstream ambiguity, or a contradiction with the LO", wsd)
        self.assertIn("## Worksheet Designer route", (ROOT / "references" / "brief-gap-protocol.md").read_text(encoding="utf-8"))
        check = (ROOT / "worksheet-html" / "scripts" / "check-worksheet.js").read_text(encoding="utf-8")
        # The gate reads a field, never the note's words (the first check's
        # findings 1 and 2).
        self.assertIn("const entry = returnedEntry(worksheet, directive.sheetKey);", check)
        self.assertNotIn("PICTURE_CLAIM", check)
        self.assertIn("record the return in `worksheet.json`'s top-level `returned`", wsd)

    def test_producing_is_chosen_when_it_moves_the_objective_on(self) -> None:
        """Decision 9."""
        self.assertIn("Choose one when producing moves the objective on; making up their own values is one option, not the default.", self.FOR)
        self.assertNotIn("by default on repeatable practice", self.FOR)

    def test_a_methods_steps_are_not_a_list_to_consult(self) -> None:
        """Decision 10, and it says nothing about where else the steps are shown."""
        # The lead's reading of his "yes", which he called "fine" (the wording
        # "never a list of steps printed just as a reminder" is the lead's, not
        # his): a one-line reminder of a method is support.
        self.assertIn("A list of a method's steps is never printed just as a reminder for the child to consult", self.PAGE)
        self.assertIn("A one-line reminder of a method they have already used", self.PAGE)
        message = (ROOT / "worksheet-html" / "src" / "helpers" / "text.js").read_text(encoding="utf-8")
        self.assertIn("A list of a method\\'s steps printed ", message)
        for barred in ("or the steps of its method, leave them", "Success criteria, and a method's steps, stay on the board"):
            self.assertNotIn(barred, flat(message))

    def test_the_cases_vary_not_the_forms(self) -> None:
        """Decision 13."""
        self.assertIn("Each question takes the form its thinking needs, and what varies is the cases, not the forms for their own sake.", self.PAGE)

    def test_every_sheet_is_done_in_class(self) -> None:
        """Settled item a, his 23 September ruling: "worksheets are not homework,
        worksheets are delivered in class all the time"."""
        self.assertIn("every sheet is done in class", text("references/preferences.md"))
        self.assertIn("wall while they work on the sheet", text("agents/worksheet-designer.md"))

    def test_the_sheets_time_sits_inside_the_lesson(self) -> None:
        """Settled item b: "it won't fit the 45 min"."""
        self.assertIn("It is never set for another time and never added on top of a full lesson", text("agents/lesson-designer.md"))

    def test_the_same_kind_of_figure_with_its_own_questions(self) -> None:
        """His answer to the question the settled items left open, "yes"."""
        self.assertIn("with the sheet's own questions and never the practice's own", self.FOR)
        self.assertIn("(the practice marks 3,250 and 4,750 on a number line in steps of 250; the sheet's line asks for 6,250 and 8,500)", self.FOR)

    def test_one_digit_box_does_not_make_a_write_on_sheet(self) -> None:
        """Settled item o: his 19 September ruling wins over the word list."""
        books = text("references/books-or-sheet.md")
        self.assertIn("is a prompt to look again, not a verdict", books)
        self.assertIn(
            "Daniel's ruling on the Year 4 nearest-1,000 Greater Depth sheet, 19 September 2026: one digit box does not make a write-on sheet.",
            books,
        )
        slips = (ROOT / "worksheet-html" / "src" / "slips.js").read_text(encoding="utf-8")
        self.assertIn("function recordingAdvisories(", slips)
        self.assertNotIn("RECORDING_NEEDS_SHEET", slips)
        # By what the sheet holds, and a field; never the reason's words
        # (the first check's finding 7).
        self.assertIn("is the blank above and is never", flat((ROOT / "references" / "books-or-sheet.md").read_text(encoding="utf-8")))
        self.assertIn("const answered = sheet.recordingLookedAgain === true;", slips)
        self.assertNotIn("reason.includes(", slips)

    def test_his_calibrating_examples_stay_exactly(self) -> None:
        """Settled item h: the partitioning sheets he approved, his column
        rulings, the Classroom Secrets endings and his digit-box ruling stay
        exactly, dates included."""
        self.assertIn("On 29 August 2026 he rejected a stimulus on the left with (1) beside it on the right.", self.PAGE)
        self.assertIn("**do not put the questions in one column and the material they work from in another.**", self.PAGE)
        self.assertIn("*\"Yes that looks incredible and premium.\"*", text("references/worksheet-visual-profile.md"))
        self.assertIn("`Is she correct? Explain your answer.`, `Who is correct? Explain your answer.`", text("references/subject-maths.md"))

    def test_a_taught_drawing_is_printed_only_for_below(self) -> None:
        """3 October 2026, on the Year 4 subtraction sheets: "only below would
        need them on the sheet, they can draw them. I would want below with the
        visual and everyone else just strips." The rule sits with the two
        agents that choose the response form, and the age table stays the one
        owner of what a child can draw."""
        maths = section_by_heading(ROOT / "references" / "subject-maths.md", "## The worksheet's sections in maths", 0)
        self.assertIn("it is printed only for the child who needs it printed", maths)
        self.assertIn("The printed representation is Below's support", maths)
        self.assertIn("`Use Expected unchanged` does not fit Below where Expected leaves the drawing to the child", maths)
        self.assertIn("\"only below would need them on the sheet, they can draw them. "
                      "I would want below with the visual and everyone else just strips.\"", maths)
        self.assertIn("is owned by `books-or-sheet.md` → `What children can make in their books, by age`", maths)
        # The boundary stays beside the rule: what no child could reproduce is
        # printed for every level.
        self.assertIn("Print the representation for every level where the child works on something they could not reproduce", maths)
        self.assertIn("## What children can make in their books, by age", (ROOT / "references" / "books-or-sheet.md").read_text(encoding="utf-8"))


class TheBriefGapRouteSitsWhereItsWordsPoint(unittest.TestCase):
    def test_the_route_is_between_the_principle_and_how_to_apply(self) -> None:
        """Its own words say "The principle above, and How to apply below"; a
        pin names its section by heading, so moving it would pass every pin
        (the first check's attack 69)."""
        lines = (ROOT / "references" / "brief-gap-protocol.md").read_text(encoding="utf-8").splitlines()
        order = [line for line in lines if line.startswith("## ")]
        self.assertLess(order.index("## The principle"), order.index("## Worksheet Designer route"))
        self.assertLess(order.index("## Worksheet Designer route"), order.index("## How to apply"))


if __name__ == "__main__":
    unittest.main()
