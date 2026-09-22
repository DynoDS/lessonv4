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
import re
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

    def test_a_word_said_only_in_the_next_script_is_refused(self) -> None:
        # The teacher, 22 September 2026: "it should be on the board, not just
        # the script." A word the class only hears has not reached the board.
        sequence = [unit("u0", "start"), unit("u1", "Why keep working?", "Say to children: their working conditions were hard.")]
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_vocabulary_is_used([{"vocabularyRefs": ["vocab-001"], "after": "u0"}], VOCAB, sequence)
        self.assertIn("is in the teacher's script for", str(refused.exception))
        self.assertIn("but not on its board", str(refused.exception))

    def test_a_word_on_the_criteria_the_next_beat_shows_is_on_its_board(self) -> None:
        # Criteria and sticky facts are on the slide by reference, as surely as
        # the beat's own content; a word there has reached the board.
        next_beat = unit("u1", "Why keep working?", "Say to children: their working conditions were hard.")
        next_beat["successCriteriaRefs"] = ["sc-001"]
        criteria = {"sc-001": {"id": "sc-001", "content": {"steps": ["Name one of their {{working conditions}}."]}}}
        validator.validate_vocabulary_is_used(
            [{"vocabularyRefs": ["vocab-001"], "after": "u0"}], VOCAB, [unit("u0", "start"), next_beat], sc_by_id=criteria
        )
        next_beat["successCriteriaRefs"] = []
        next_beat["stickyKnowledgeRefs"] = ["sk-001"]
        sticky = {"sk-001": {"id": "sk-001", "text": "Tudor working conditions were hard."}}
        validator.validate_vocabulary_is_used(
            [{"vocabularyRefs": ["vocab-001"], "after": "u0"}], VOCAB, [unit("u0", "start"), next_beat], sticky_by_id=sticky
        )

    def test_a_caption_the_next_beats_picture_prints_is_on_its_board(self) -> None:
        # A number-line lesson's My Turn printed `Each interval is worth 10.` on
        # its picture; the word was on the board, and refusing it would send a
        # sound lesson back. A feature that only describes the picture prints no
        # word: `every integer labelled, with correct negative signs` is not
        # the word `negative` on the board.
        vocab = [{"id": "vocab-001", "term": "interval"}, {"id": "vocab-002", "term": "negative"}]
        next_beat = unit("u1", "Label the blanks.", "Say to children: each interval is ten, and minus three is negative.")
        next_beat["representationRefs"] = [{"ref": "rep-001", "configuration": "model"}]
        reps = {"rep-001": {"id": "rep-001", "configurations": [{"id": "model", "requiredFeatures": [
            "Visible caption: Each interval is worth 10.",
            "every integer labelled, with correct negative signs",
        ]}]}}
        validator.validate_vocabulary_is_used(
            [{"vocabularyRefs": ["vocab-001"], "after": "u0"}], vocab, [unit("u0", "start"), next_beat], rep_by_id=reps
        )
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_vocabulary_is_used(
                [{"vocabularyRefs": ["vocab-002"], "after": "u0"}], vocab, [unit("u0", "start"), next_beat], rep_by_id=reps
            )
        self.assertIn("`negative` is in the teacher's script", str(refused.exception))

    def test_the_board_may_say_the_word_in_its_natural_form(self) -> None:
        # The card says `continuity`; a board asking about continuities, or
        # what changed, has the word on it.
        vocab = [{"id": "vocab-001", "term": "continuity"}, {"id": "vocab-002", "term": "change"},
                 {"id": "vocab-003", "term": "round"}]
        for ref, board in (("vocab-001", "What are the continuities?"), ("vocab-002", "What changed?"),
                           ("vocab-003", "Rounding to the nearest ten.")):
            with self.subTest(board=board):
                validator.validate_vocabulary_is_used(
                    [{"vocabularyRefs": [ref], "after": "u0"}], vocab, [unit("u0", "start"), unit("u1", board)]
                )
        # And a different word that merely begins the same way is not it.
        with self.assertRaises(validator.ContractError):
            validator.validate_vocabulary_is_used(
                [{"vocabularyRefs": ["vocab-003"], "after": "u0"}], vocab,
                [unit("u0", "start"), unit("u1", "Walk to the roundabout.")],
            )

    def test_word_forms_are_heard_and_different_words_are_not(self) -> None:
        heard = (("valley", "Rivers carve valleys."), ("array", "Make two arrays."), ("key", "Use the keys."),
                 ("decay", "It decays."), ("monastery", "The monasteries."), ("exchange", "We exchanged ten ones."))
        for term, text in heard:
            with self.subTest(term=term):
                self.assertTrue(any(re.search(p, text.lower()) for p in validator._word_patterns(term)))
        for term, text in (("rule", "Use a ruler."), ("count", "Move the counters."), ("time", "Start the timer.")):
            with self.subTest(term=term):
                self.assertFalse(any(re.search(p, text.lower()) for p in validator._word_patterns(term)))

    def test_a_picture_prints_the_words_its_features_give(self) -> None:
        # The phrasings real designs use, and the two that only describe.
        printed = (("labels reading 'ear canal' and 'eardrum' and nothing else", "eardrum"),
                   ("the eardrum labelled", "eardrum"),
                   ("four aligned columns labelled Thousands, Hundreds, Tens and Ones", "hundreds"),
                   ("the Equator drawn and labelled across the middle of the map", "equator"),
                   ("with a shared label reading: Same load", "same load"),
                   ("one part is a blank circle captioned thousands", "thousands"),
                   ("halfway written under the middle tick of every line", "halfway"))
        for feature, word in printed:
            with self.subTest(feature=feature):
                self.assertIn(word, validator._printed_words(feature))
        for feature, word in (("every integer labelled, with correct negative signs", "negative"),
                              ("No caption: children work out what each interval is worth themselves", "interval"),
                              ("Six ticks at equal physical intervals; all labels printed exactly as supplied", "interval")):
            with self.subTest(feature=feature):
                self.assertNotIn(word, validator._printed_words(feature))

    def test_every_check_reads_the_same_slide(self) -> None:
        # A word on the next beat's criteria panel is on that beat, so the
        # designer is not told it is first needed a beat later.
        next_beat = unit("u1", "Why keep working?", "Say to children: think about it.")
        next_beat["successCriteriaRefs"] = ["sc-001"]
        criteria = {"sc-001": {"id": "sc-001", "content": {"steps": ["Name one of their {{working conditions}}."]}}}
        validator.validate_vocabulary_is_used(
            [{"vocabularyRefs": ["vocab-001"], "after": "u0"}], VOCAB,
            [unit("u0", "start"), next_beat, unit("u2", "Their working conditions were hard.")], sc_by_id=criteria,
        )

    def test_a_word_first_used_later_still_names_that_beat(self) -> None:
        # Unchanged by the board rule: a word the next beat does not use at all
        # is still reported against the beat where it is first needed.
        sequence = [unit("u0", "start"), unit("u1", "Why keep working?"), unit("u2", "Their working conditions were hard.")]
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_vocabulary_is_used([{"vocabularyRefs": ["vocab-001"], "after": "u0"}], VOCAB, sequence)
        self.assertIn("first needed 1 beat later", str(refused.exception))


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
        # The rebuilt lesson is kept as the calibration for both halves: the
        # match that worked and the sorts that did not (15 September 2026).
        text = flat(ROOT / "references" / "subject-history.md")
        self.assertIn("**A why lesson is not only explaining, over and over.**", text)
        self.assertIn("`helped him straight away`", text)
        self.assertIn("from everyday sense, with no Tudor knowledge at all", text)

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
