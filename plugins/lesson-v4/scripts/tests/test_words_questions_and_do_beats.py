"""A carded word is used, a question says what it means, and a why lesson does
more than explain.

Three things Daniel found in the Tudor deck (14 September 2026), after it had
been rebuilt by hand:

1. `working conditions` had its own vocabulary slide and was never said again.
   The designer's rule that every card has a landing existed and was unchecked;
   run against all 18 saved designs, the check below catches exactly that one.
2. The questions were written for a reader who already knew what they meant
   (`Which part helps the apprentice now?`), and nothing gave SEND, EAL or
   lower-attaining children a smaller question leading to the big one.
3. Every Do beat was a spoken explanation, because the content route sent the
   designer to one section of the Do-beat catalogue.
"""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


validator = load("validate_lesson_design_vocab_use", "validate-lesson-design.py")


def unit(uid: str, board: str, script: str = "Say to children: look.") -> dict:
    return {"sourceUnitId": uid, "kind": "teach", "content": {"headline": board},
            "pupilInstruction": None, "speakerNotes": {"script": script}}


VOCAB = [{"id": "vocab-001", "term": "working conditions"},
         {"id": "vocab-002", "term": "greater than / less than"},
         {"id": "vocab-003", "term": "equal to"}]


class ACardedWordIsUsed(unittest.TestCase):
    def test_a_word_no_later_beat_uses_is_refused_by_name(self) -> None:
        sequence = [unit("u1", "Tudor apprentices worked long days."), unit("u2", "Why keep working when it was hard?")]
        intro = [{"vocabularyRefs": ["vocab-001"], "after": "u1"}]
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_vocabulary_is_used(intro, VOCAB, sequence)
        self.assertIn("`working conditions` is introduced and then never used", str(refused.exception))

    def test_a_word_used_on_the_next_board_passes(self) -> None:
        sequence = [unit("u1", "Tudor apprentices."), unit("u2", "Their working conditions were hard.")]
        validator.validate_vocabulary_is_used([{"vocabularyRefs": ["vocab-001"], "after": "u1"}], VOCAB, sequence)

    def test_a_word_used_only_before_its_card_still_fails(self) -> None:
        # Discrimination: the word has to be used after it is taught.
        sequence = [unit("u1", "Their working conditions were hard."), unit("u2", "Why keep working?")]
        with self.assertRaises(validator.ContractError):
            validator.validate_vocabulary_is_used([{"vocabularyRefs": ["vocab-001"], "after": "u1"}], VOCAB, sequence)

    def test_a_paired_card_and_a_joining_word_are_read_the_way_sentences_use_them(self) -> None:
        sequence = [unit("u0", "start"), unit("u1", "Which number is greater? Are they equal?")]
        validator.validate_vocabulary_is_used([{"vocabularyRefs": ["vocab-002", "vocab-003"], "after": "u0"}], VOCAB, sequence)

    def test_a_word_used_in_the_script_counts(self) -> None:
        sequence = [unit("u0", "start"), unit("u1", "Why keep working?", "Say to children: their working conditions were hard.")]
        validator.validate_vocabulary_is_used([{"vocabularyRefs": ["vocab-001"], "after": "u0"}], VOCAB, sequence)


class AQuestionSaysWhatItMeans(unittest.TestCase):
    def test_the_voice_guide_carries_both_repairs_and_the_limit(self) -> None:
        text = flat(ROOT / "references" / "teacher-voice.md")
        self.assertIn("## Say what you mean, and give a second question that leads to the first", text)
        self.assertIn("How could making clothes help Sam when he grew up?", text)
        self.assertIn("The second question does not hand over the answer.", text)
        self.assertIn("adding one to every question is a habit children stop reading", text)

    def test_the_designer_and_reviewer_are_pointed_at_it(self) -> None:
        self.assertIn("Say what you mean, and give a second question that leads to the first", flat(ROOT / "agents" / "lesson-designer.md"))
        self.assertIn("`teacher-voice.md` §6, `Say what you mean`", flat(ROOT / "agents" / "design-reviewer.md"))


class AWhyLessonDoesMoreThanExplain(unittest.TestCase):
    def test_the_content_route_no_longer_routes_every_beat_to_one_section(self) -> None:
        text = flat(ROOT / "references" / "teaching-sequence-content-based.md")
        self.assertIn("It is one section of the catalogue, not the route for the lesson.", text)
        self.assertIn("open §5 and §6 for at least one of them", text)

    def test_the_history_file_shows_what_the_rebuilt_lesson_did(self) -> None:
        text = flat(ROOT / "references" / "subject-history.md")
        self.assertIn("**A why lesson is not only explaining, over and over.**", text)
        self.assertIn("`helped him straight away`", text)

    def test_stand_if_is_not_used_and_true_or_false_is_bounded(self) -> None:
        text = flat(ROOT / "references" / "do-beats.md")
        self.assertIn("**Not used.** The user does not use stand-up or show-me routines", text)
        self.assertIn("the user finds true or false \"fine, but can be cheap\"", text)

    def test_the_reviewer_reads_the_run_of_channels(self) -> None:
        self.assertIn("a lesson whose Do beats all share one response channel", flat(ROOT / "agents" / "design-reviewer.md"))


class TheBoardLooksAsCarefulAsItReads(unittest.TestCase):
    """Four visual lessons from the same deck (14 September 2026)."""

    def test_two_questions_take_a_break_and_a_paragraph_break_is_preferred(self) -> None:
        text = flat(ROOT / "references" / "preferences.md")
        self.assertIn("**Two questions are two moves, always.**", text)
        self.assertIn("**Prefer a paragraph break (a blank line between them,", text)
        self.assertIn("use a line break", text)

    def test_category_cards_are_centred(self) -> None:
        text = flat(ROOT / "references" / "slide-composition-playbook.md")
        self.assertIn("and that alignment is **centred**", text)

    def test_one_long_card_holds_its_group_down(self) -> None:
        text = flat(ROOT / "references" / "slide-composition-playbook.md")
        self.assertIn("**Cards that share one text size are only as big as the longest of them.**", text)

    def test_a_caption_earns_its_line_once(self) -> None:
        self.assertIn("**A caption costs the picture its height, so it earns its line once.**", flat(ROOT / "references" / "slide-composition-playbook.md"))
        self.assertIn("Say it once: a set of reconstruction pictures", flat(ROOT / "references" / "subject-history.md"))


if __name__ == "__main__":
    unittest.main()
