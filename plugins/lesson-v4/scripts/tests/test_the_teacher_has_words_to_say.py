"""Speaker notes a teacher can actually teach from.

Daniel taught the Year 4 RE Christmas deck on 11 September 2026 and said the
speaker notes were rubbish: "Wasn't enough there, not my natural voice, felt
like I was reading, confused reading!" He compared them with the predecessor
plugin (teaching-plugins/lesson-resources), which he remembered as much
better, and he was right on all three counts.

Measured: 300 words of script across twelve slides, with five carrying no
script at all. The predecessor's single worked example, for one My Turn
slide, runs about 150 words, so one slide there carried half of what the
whole RE lesson carried.

Three causes, each pinned here.

1. The calibration was lost. The predecessor held a paragraph describing the
   voice, the instruction "the words, not a summary", and four complete
   worked scripts. lessonv4 kept a dense list of prohibitions, a four-word
   voice summary and a pointer to another file, and every calibrated example
   in `teacher-voice.md` is one sentence long. A writer calibrated on
   fragments writes fragments.
2. Some slides had nowhere for words to live. The vocabulary slide has no
   `speakerNotes` in the schema at all; `practise` and `do-task` were not in
   SCRIPT_REQUIRED_KINDS, so a launch slide shipped empty; and a unit split
   across two slides left its whole script on the first.
3. Caveats were written into the read-aloud. `These are imagined children,
   not the people in the photo` sat between two sentences of teaching, and a
   staging instruction sat in the same note as the words to say. That is what
   makes a note confusing to read rather than merely thin.
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DESIGNER = ROOT / "agents" / "lesson-designer.md"
SLIDE_DESIGNER = ROOT / "agents" / "slide-designer.md"
VOICE = ROOT / "references" / "teacher-voice.md"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"

CONTRACT_TESTS = Path(__file__).with_name("test_lesson_design_contract.py")
SPEC = importlib.util.spec_from_file_location("contract_tests_notes", CONTRACT_TESTS)
assert SPEC is not None and SPEC.loader is not None
contract = importlib.util.module_from_spec(SPEC)
sys.modules["contract_tests_notes"] = contract
SPEC.loader.exec_module(contract)

module = contract.module
valid_content_contract = contract.valid_content_contract
assert_invalid_contract = contract.assert_invalid_contract


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheCalibrationIsBack(unittest.TestCase):
    def test_the_script_is_defined_by_what_it_is(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("Script: write the words, not a summary of them", designer)
        self.assertIn("Not a summary of the explanation", designer)
        # The positive voice description, not only the four-word summary.
        self.assertIn("warm direct tone that speaks to the child in front of you", designer)
        self.assertIn("this catches a lot of people out", designer)

    def test_a_full_worked_script_exists_and_is_routed_before_the_first_one(self) -> None:
        voice = flat(VOICE)
        self.assertIn("## H. A speaker note, in full", VOICE.read_text(encoding="utf-8"))
        # Both examples, at the real length.
        self.assertIn("I'm adding £3.40 and £4.80", voice)
        self.assertIn("It's a model of the Christmas story", voice)
        self.assertIn("length is part of what they are showing", voice)
        # Routed as required reading, not as an optional last resort.
        self.assertIn("A speaker-note script opens §16H before the first one you write", voice)
        self.assertIn("§16H", flat(DESIGNER))

    def test_the_worked_examples_are_actually_long(self) -> None:
        """A short example would teach the fault it exists to repair."""
        text = VOICE.read_text(encoding="utf-8")
        section = text.split("## H. A speaker note, in full", 1)[1].split("# 17.", 1)[0]
        quotes = [
            line.strip("> ").strip()
            for line in section.splitlines()
            if line.strip().startswith("> Say to children:")
        ]
        self.assertEqual(len(quotes), 2, "both worked scripts must be present")
        for quote in quotes:
            self.assertGreater(len(quote.split()), 100, quote[:60])


class EverySlideTheTeacherTeachesFromHasWords(unittest.TestCase):
    def test_the_vocabulary_slide_carries_its_script(self) -> None:
        self.assertIn("`script` is the words the teacher says while this slide is up", flat(OUTPUT_TEMPLATE))
        self.assertIn("The entry's `script` is that slide's speaker notes", flat(SLIDE_DESIGNER))
        self.assertIn("The slide gets a script like any other teaching moment", flat(DESIGNER))

    def test_a_split_unit_divides_its_script(self) -> None:
        slide = flat(SLIDE_DESIGNER)
        self.assertIn("When one unit becomes several slides, its script is divided between them", slide)
        # The limit, so an answer reveal is not given invented teaching.
        self.assertIn("leave its notes empty and say so in your report", slide)

    def test_a_launched_task_requires_its_script(self) -> None:
        design, photos = valid_content_contract()
        for unit in design["teachingSequence"]:
            if unit["kind"] == "practise":
                unit["speakerNotes"]["script"] = None
                assert_invalid_contract(design, photos, "script is required for practise")
                return
        self.fail("the content fixture has no practise unit")


class CaveatsLeaveTheReadAloud(unittest.TestCase):
    def test_the_rule_is_at_the_designer_with_its_test(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("A caveat, a staging instruction or a safeguarding note is never inside the script", designer)
        self.assertIn("The test is who the sentence is addressed to", designer)
        # A caveat genuinely for children is taught, not moved to the teacher line.
        self.assertIn("it is taught, in its own beat", designer)

    def test_the_worked_examples_name_what_is_absent_from_them(self) -> None:
        voice = flat(VOICE)
        self.assertIn("no staging instruction", voice)
        self.assertIn("these are imagined children, not the people in the photo", voice.lower())
        self.assertIn("reading a note to themselves", voice)


if __name__ == "__main__":
    unittest.main()
