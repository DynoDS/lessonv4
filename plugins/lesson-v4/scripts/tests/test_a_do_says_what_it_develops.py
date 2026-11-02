"""A Do says what the child is better at when it ends.

On 2 November 2026 the teacher found Do beats basic: children recalling the
teaching, or a chance to assess what was just taught, when a Do is meant to
develop understanding and the subject's own skills. The designer's required
fields had all been about whether a task could tell who had listened, so
nothing asked what the child gained. `use.develops` asks it on every Do, and
the review's `checks only` verdict answers it.

The check can only see that the sentence is there. Whether it is true is the
review's judgement, and a design saved before the field existed still reads.
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
import beside_teaching  # noqa: E402

PLUGIN = SCRIPTS.parent


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def row(use: dict | None) -> beside_teaching.Beside:
    teach = {
        "kind": "teach", "label": "How does food help the body?",
        "content": {"headline": "Food has to reach the rest of your body.",
                    "explanation": "Nutrients pass into the blood through the small intestine."},
        "speakerNotes": {"script": "Nutrients pass into the blood through the small intestine."},
    }
    task = {
        "kind": "do", "label": "The task", "pupilInstruction": "Write your answer.",
        "content": {"task": "Which of these is a mammal?"},
        "answer": {"content": "A whale, because it feeds its young milk."},
    }
    if use is not None:
        task["use"] = use
    return beside_teaching.read_beside({"teachingSequence": [teach, task]})[0]


FULL = "Sorting a surprising animal by its features, so the group means more than its name"


class EveryDoSaysWhatItDevelops(unittest.TestCase):
    def test_a_design_from_before_the_field_still_reads(self) -> None:
        self.assertIsNone(row(None).fault())
        self.assertIsNone(row({"new": "a mammal", "rehearsal": None}).fault())

    def test_an_empty_or_thin_line_is_refused(self) -> None:
        for thin in (None, "sorting", "checks who has it"):
            fault = row({"develops": thin, "new": "a mammal", "rehearsal": None}).fault()
            self.assertIn("use.develops", fault or "", thin)

    def test_a_sentence_passes_and_the_rest_is_the_reviews_judgement(self) -> None:
        self.assertIsNone(row({"develops": FULL, "new": "a mammal", "rehearsal": None}).fault())

    def test_it_sits_beside_practice_which_otherwise_stands_alone(self) -> None:
        use = {"develops": FULL, "new": None, "rehearsal": None, "wrong": None,
               "practice": "Each child sorts the animals by the taught features"}
        self.assertIsNone(row(use).fault())

    def test_the_reviewer_and_the_designer_are_shown_it(self) -> None:
        line = row({"develops": FULL, "new": "a mammal", "rehearsal": None}).declaration_line()
        self.assertIn(FULL, line)

    def test_the_scaffold_writes_it_first_and_the_validator_accepts_it(self) -> None:
        scaffold = (SCRIPTS / "lesson-design-scaffold.py").read_text(encoding="utf-8")
        self.assertIn('unit["use"] = {"develops": PLACEHOLDER', scaffold)
        validator = (SCRIPTS / "validate-lesson-design.py").read_text(encoding="utf-8")
        self.assertIn('{"wrong", "practice", "develops"}', validator)


class TheReviewCanSayAnItemOnlyChecks(unittest.TestCase):
    def test_checks_only_is_a_verdict(self) -> None:
        packet = load("packet_for_develops", "design-review-packet.py")
        self.assertIn("checks only", packet.EACH_DO_VERDICTS)


class TheOwnerReachesItsReaders(unittest.TestCase):
    OWNER = "A Do makes the child better at the subject"

    def test_each_reader_is_pointed_at_the_one_owner(self) -> None:
        text = (PLUGIN / "references" / "preferences.md").read_text(encoding="utf-8")
        self.assertEqual(text.count(f"**{self.OWNER};"), 1)
        for path in ("references/do-beats.md", "references/output-template.md",
                     "references/task-contrasts.md", "agents/lesson-designer.md",
                     "agents/design-reviewer.md", "references/teaching-sequence-content-based.md"):
            self.assertIn(self.OWNER, (PLUGIN / path).read_text(encoding="utf-8"), path)

    def test_the_subject_table_covers_every_primary_subject(self) -> None:
        text = (PLUGIN / "references" / "do-beats.md").read_text(encoding="utf-8")
        section = text.split("## What the subject itself does", 1)[1].split("## How to pick", 1)[0]
        for subject in ("Science", "History", "Geography", "Maths", "Writing", "Reading",
                        "Art and design", "D&T", "Music", "Computing", "PE", "Languages",
                        "RE", "PSHE and citizenship"):
            self.assertIn(f"| {subject} |", section)

    def test_finding_out_who_has_it_is_no_longer_offered_as_a_gain(self) -> None:
        text = (PLUGIN / "references" / "preferences.md").read_text(encoding="utf-8")
        self.assertNotIn("reliable evidence that the teacher can move on", text)
        self.assertNotIn("tells the teacher who has it", text)


if __name__ == "__main__":
    unittest.main()
