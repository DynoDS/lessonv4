"""Every design-reviewer rule the teacher's ledger recorded is still where it lives.

The independent review of a finished lesson design was listed on 23 and 24
September 2026: 428 places in 26 files, the reviewer's own instructions, its
focused repair and route checks, what the review packet prints for it and checks
afterwards, and what other files say about it
(plans/2026-09-23-design-reviewer-ledger.md). The teacher answered every
decision on 24 September. Small wording fixes are the reviewer's (a "look at the
diagram" example among them, by his answer of 26 September), and a picture swap
or a rewritten Do beat goes to the lesson designer with the reviewer naming the
fix; the routing card opens the three sections the reviewer's checks send it
to; the board is judged first, on its own, and the speaker notes separately; the
out-of-date lines say what is true; each rule is written once; the dated stories
left for the build log with their reasons kept; and the child the sweep imagines
is the child in this class (the lead's reading of his words, and said to be).
His calibration of about four pieces on a Teach
board stays exactly as it is ("not if it hassnt been broken anyway").

`design_reviewer_ledger_pins.json` holds each row's words where they now live,
each changed row's whole paragraph, the reviewer's instructions paragraph by
paragraph, and the retired wordings as gone. The fix for a failure here is to
update the ledger and the pins on purpose, with the teacher's say-so.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, flat, make_ledger_tests  # noqa: E402

PINS = Path(__file__).resolve().with_name("design_reviewer_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-23-design-reviewer-ledger.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"
LOG = ROOT / "references" / "build-review-log.md"

EveryDesignReviewerRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "RV", 428)


def paragraphs(path: Path) -> list[str]:
    return [flat(x) for x in path.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n\n") if flat(x)]


class HisDecisionsAreBuilt(unittest.TestCase):
    def setUp(self) -> None:
        self.reviewer = flat(REVIEWER.read_text(encoding="utf-8"))

    def test_the_designer_makes_the_two_bigger_fixes_and_the_reviewer_names_them(self) -> None:
        # Decision 2: "Swapping a photo of a number line for a drawn one or
        # rewriting a doobie. Sounds like it should be for the lesson designer".
        for words in (
            "The repair keeps the chunk and is the Lesson Designer's, because it changes what children have to "
            "think: return it naming the fix,",
            "Return it to the Lesson Designer, naming the helper that should draw it.",
        ):
            self.assertIn(words, self.reviewer)
        for gone in ("The repair is local", "Raise it as a correction naming the helper"):
            self.assertNotIn(gone, self.reviewer)

    def test_a_look_at_the_diagram_line_is_the_reviewers_own_wording_fix(self) -> None:
        # His answer of 26 September: asked, with "Look at the diagram.", whether
        # the reviewer rewrites it itself as what children will notice ("Notice
        # the enamel is the hardest layer."), he said "yes". The line is kept
        # word for word, and the words that first sent it away are gone.
        self.assertIn("Repair it to what they will notice, or, when the picture's own label already names the "
                      "thing, take the line off the board and let the key question do the pointing", self.reviewer)
        self.assertNotIn("Return it to the Lesson Designer, naming the fix: the line rewritten", self.reviewer)
        ledger = flat(LEDGER.read_text(encoding="utf-8")) if LEDGER.exists() else ""
        if ledger:
            self.assertIn("he answered \"yes\". C10 stays the reviewer's.", ledger)
        # "If it's a small thing, say it's words aren't right ... then the
        # reviewer changes them": the wording repairs stay the reviewer's.
        self.assertIn("you may repair it yourself as wording", self.reviewer)
        self.assertIn("a bounded wording or answer-key correction that keeps the settled pedagogy is yours",
                      self.reviewer)
        # 27 September 2026: carrying the spoken question onto the board is a voice repair,
        # now the lesson voice editor's, word for word.
        self.assertIn("Repair it by carrying the spoken wording onto the board, trimmed rather than reworded.",
                      flat((ROOT / "agents" / "lesson-voice-editor.md").read_text(encoding="utf-8")))

    def test_the_board_is_judged_first_and_the_notes_separately(self) -> None:
        # Settled item 4: "Judge the board first ... board first, speaker notes separate."
        self.assertIn("Judge the visible explanation first, on its own, and the spoken one separately, so nothing "
                      "counts as taught on the board because the script says it;", self.reviewer)
        self.assertNotIn("Judge the spoken and visible explanation together", self.reviewer)
        # The comparison that finds a sentence only the script teaches stays.
        self.assertIn("Then uncover the script and read the two together: the script says the same route as "
                      "spoken words", self.reviewer)

    def test_the_out_of_date_lines_say_what_is_true(self) -> None:
        self.assertIn("A failed check sends your corrections to a focused repair and, only if that fails, the whole "
                      "design to a fresh attempt,", self.reviewer)
        self.assertIn("The design states this in each unit's `unlocks`", self.reviewer)
        self.assertNotIn("The design now states", self.reviewer)

    def test_each_rule_is_written_once(self) -> None:
        for gone in ("Do not recheck identifier or reference legality.",
                     "the part you left until now",
                     "(the User-fit judgement above owns that test; do not run it twice)",
                     "do not repeat a separate whole-lesson sweep"):
            self.assertNotIn(gone, self.reviewer)
        self.assertEqual(self.reviewer.count(
            "Use `REDESIGN REQUIRED` when one or more purposeful lesson decisions must change."), 1)
        self.assertIn("Use `APPROVED` when no purposeful lesson decision remains defective. Local corrections and "
                      "teacher flags may exist. Use `REDESIGN REQUIRED` when one or more purposeful lesson decisions "
                      "must change.", paragraphs(REVIEWER))
        # Each near-repeat keeps its own words.
        for kept in ("Make a local correction only when one clear bounded change restores the settled lesson.",
                     "Here judge wording for what it teaches; how it sounds is the lesson voice editor's.",
                     "- full and displayed objectives;",
                     "Do not perform separate whole-lesson rereads for each one.",
                     "11. Read the closing decisions of `design-decisions.md` only for the final decision-drift check."):
            self.assertIn(kept, self.reviewer)

    def test_the_stories_left_for_the_log_and_the_reasons_stayed(self) -> None:
        log = flat(LOG.read_text(encoding="utf-8"))
        for story in ("10 September 2026", "14 September 2026", "22 September 2026", "12 September 2026",
                      "An RE beat printed", "carol-singing photograph", "too thin to catch",
                      "Read 66 child-facing strings", "today the teacher edits"):
            self.assertNotIn(story, self.reviewer)
        for kept in ("one plate came back on nine of eighteen slides",
                     "`A Tudor farm household` under it, the teaching in the notes",
                     "approved with `each Teach board can be taught with notes closed`",
                     "that is how a class met `What does one visible detail suggest about this class?`",
                     "was the whole sweep on a Year 4 PSHE lesson",
                     "An RE beat printed `What do their reasons share?`",
                     "passed this review with two children's reasons on the board as text cards",
                     "too thin to catch a place-value-chart lesson whose sheet had no chart on it",
                     "every sheet counted on 12 September 2026"):
            self.assertIn(kept, log)
        # The reasons, and the lines kept as plain examples.
        # 27 September 2026: the sweep's reasons moved with the sweep to the lesson voice editor;
        # its count receipt was retired for the editor's lane check.
        editor = flat((ROOT / "agents" / "lesson-voice-editor.md").read_text(encoding="utf-8"))
        self.assertIn("`What do their reasons share?` printed over a script saying", editor)
        for reason in ("A string read inside JSON braces beside its field name is read as a specification.",
                       "`He wasn't a king who could order everybody to obey him`",
                       "Read the forms rather than confirming the objective matches.",
                       "as in a *name the layers of teeth* sheet that asked for three names"):
            self.assertIn(reason, self.reviewer)

    def test_the_sweep_imagines_the_child_in_this_class(self) -> None:
        editor = flat((ROOT / "agents" / "lesson-voice-editor.md").read_text(encoding="utf-8"))
        self.assertIn("Read each one first as the child: the actual child in this class, who has not read the plan",
                      editor)
        self.assertNotIn("nine-year-old", self.reviewer)
        self.assertNotIn("nine-year-old", editor)
        # The wording is the lead's reading of his words, and the log says so
        # rather than passing it off as his (the first check's item 4).
        log = flat(LOG.read_text(encoding="utf-8"))
        self.assertIn("\"the actual child in this class\". This is the lead's reading of his words, not his wording:",
                      log)

    def test_his_slide_ceiling_is_his_words(self) -> None:
        # Settled item 1 kept his calibration untouched ("not if it hassnt been broken anyway");
        # on 27 September 2026 he restated it himself: "its just 5 is a max", judged, and never a
        # reason to cut every board to two cards and a picture.
        preferences = flat((ROOT / "references" / "preferences.md").read_text(encoding="utf-8"))
        self.assertIn("So the ceiling for a Teach slide is five things on the board, counting everything "
                      "the class looks at", preferences)
        self.assertIn("Five is the most, not the target", preferences)
        self.assertIn("Neither is a count. There is no cap on beats, slides, sources or words", self.reviewer)

    def test_what_must_not_move_has_not(self) -> None:
        # The voice harness's sweep runner reads these two sections of the lesson voice editor
        # (27 September 2026: the production voice instructions moved there from the reviewer).
        editor = (ROOT / "agents" / "lesson-voice-editor.md").read_text(encoding="utf-8")
        self.assertIn("## What you change, and how each kind of string should sound\n", editor)
        self.assertIn("## What you never change\n", editor)
        runner = (ROOT / "evals" / "teacher-voice" / "sweep-runner.md").read_text(encoding="utf-8")
        self.assertIn("agents/lesson-voice-editor.md", runner)
        # Every heading the after-review check reads, once each, in order.
        raw = REVIEWER.read_text(encoding="utf-8")
        at = [raw.index(heading) for heading in ("## Result\n", "## Corrections made\n", "## Redesign required\n",
                                                  "## Flags for the teacher\n", "## Judgements\n")]
        self.assertEqual(at, sorted(at))
        # And the launch settings.
        for line in ("model: opus", "effort: xhigh", "codex_model: astra", "codex_effort: low"):
            self.assertIn(line + "\n", raw.replace("\r\n", "\n"))


if __name__ == "__main__":
    unittest.main()
