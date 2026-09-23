"""Every assumed-knowledge rule the teacher's ledger recorded is still where it lives.

What a lesson may take children to know already was written 283 times: working
only from what children can use at that point, the board and the script, what
an earlier lesson counts as having taught, explaining a name where it first
appears, the words about where a source came from, knowledge before judgement,
a question written by someone who already knows the answer, and which of
children's own experiences a lesson may lean on. The streamline of 23 September
2026 listed every one (plans/2026-09-22-assumed-knowledge-ledger.md), the
teacher answered each decision, and each rule now has one home.

`assumed_knowledge_ledger_pins.json` holds each row's words where they now
live, the homes paragraph by paragraph, and the retired wordings as gone. The
fix for a failure here is to update the ledger and the pins on purpose, with
the teacher's say-so.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, flat, make_ledger_tests, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("assumed_knowledge_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-22-assumed-knowledge-ledger.md"
PREF = ROOT / "references" / "preferences.md"

EveryAssumedKnowledgeRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "AK", 283)


class TheTeachersDecisionsAreWritten(unittest.TestCase):
    CORE = section_by_heading(PREF, "### Core rules", 0)
    PURPOSE = section_by_heading(PREF, "## What a Lesson Is For", 0)
    SLIDES = section_by_heading(PREF, "### Lesson Designer content boundaries", 0)
    SOURCES = section_by_heading(PREF, "## Source and Scenario Integrity", 0)

    def test_the_board_holds_the_teaching_and_the_notes_say_it(self) -> None:
        """Decision 1, in the teacher's words: never one thing, nothing taught by the two together."""
        self.assertIn("The board and the notes are never one thing.", self.CORE)
        self.assertIn("nothing is taught by the board and the notes together", self.CORE)
        designer = flat((ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8"))
        self.assertNotIn("spoken preparation", designer)

    def test_the_script_that_gives_an_answer_away_still_counts(self) -> None:
        """Decision 1 keeps the other direction exactly as it was."""
        designer = flat((ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8"))
        self.assertIn("hiding a reminder does not preserve a diagnostic decision if the script supplies it", designer)
        self.assertIn("Read the spoken script too, because it can supply a decision that the printed support carefully withholds.", flat(PREF.read_text(encoding="utf-8")))

    def test_an_earlier_lesson_gets_a_short_reminder_never_a_reteach(self) -> None:
        """Decisions 2 and 3: a plan's earlier lessons are rough context; what today leans on is reminded."""
        designer = flat((ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8"))
        self.assertIn("A plan's lessons before this one are rough context", designer)
        self.assertIn("never a reteach", designer)

    def test_a_name_arrives_with_its_context_in_every_subject(self) -> None:
        """Decision 4, with the teacher's words on decision 8: the wording, not a card."""
        self.assertIn("arrives with its context in the sentence that brings it in", self.SLIDES)
        self.assertIn("For these, the repair is in how the teaching is worded; a vocabulary card alone does not do it.", self.SLIDES)
        # Only names and things met on the way: an ordinary word keeps the
        # vocabulary rule's three repairs, a card among them.
        self.assertIn("a word the teaching leans on takes the three repairs", self.SLIDES)
        self.assertIn("Elizabeth I was the Queen of England at that time.", self.SLIDES)

    def test_the_source_test_and_experience_rule_are_where_every_subject_reads(self) -> None:
        """Decisions 5 and 11."""
        self.assertIn("a teacher who is new to the topic would have to explain", self.SOURCES)
        self.assertIn("**Children's own experience may be invited, never required.**", self.SOURCES)
        self.assertIn("are said in the words the class hears", self.SOURCES)

    def test_knowledge_comes_before_judgement_except_where_asking_first_is_the_point(self) -> None:
        """Decision 6, with the moves that ask first on purpose."""
        self.assertIn("**Knowledge before judgement, beat by beat.**", self.PURPOSE)
        self.assertIn("a hook, a pattern children read, an exploration, a first attempt, an estimate, fresh evidence", self.PURPOSE)

    def test_the_four_shapes_live_with_the_two_repairs(self) -> None:
        """Decision 10: one section in the voice guide; the slide rules keep a pointer naming the shapes."""
        voice = section_by_heading(ROOT / "references" / "teacher-voice.md",
                                   "## Say what you mean, and give a second question that leads to the first", 0)
        self.assertIn("It wears four shapes.", voice)
        self.assertIn("**Add a second question that walks towards the first.**", voice)
        self.assertIn("a heading where a question is needed, and a stem built from the task instead of the learning", self.SLIDES)


if __name__ == "__main__":
    unittest.main()
