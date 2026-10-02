"""The lesson designer's look at its Do beats, read one after another.

`do-beats-in-a-row.py` prints every Do beat and the practice in the order the
class meets them: how children answer, the first words they are told, and any
run of three or more words a beat shares with the Teach just before it or with
the star fact printed on it. It never passes or fails a lesson; the designer
reads the list for its completion check "The Do beats read in a row". These
checks hold what that list must show, and that a real saved design reads
without error.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "do-beats-in-a-row.py"

DESIGN = {
    "stickyKnowledge": [
        {"id": "sk1", "text": "Rainforests are hot, wet and green all year."},
    ],
    "teachingSequence": [
        {"kind": "teach", "sourceUnitId": "t1",
         "content": {"explanation": "Deserts are hot with very little rain, so few plants grow there."}},
        {"kind": "do", "label": "Name the biome", "stickyKnowledgeRefs": ["sk1"],
         "pupilInstruction": "Decide which biome each photograph shows and say why.",
         "content": {"format": "card sort", "task": "Which place is hot with very little rain?"},
         "answer": {"content": "The desert, because it is hot, wet and green all year is the rainforest."}},
        {"kind": "do", "label": "A new place",
         "content": {"format": "written sentence", "task": "Describe the weather in Manaus."},
         "answer": {"content": "Warm and rainy every month."}},
        {"kind": "practise", "label": "Practise",
         "content": {"format": "worksheet", "task": "Sort the six places by biome."}},
    ],
}


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True,
                          encoding="utf-8")


def run_design(design: dict) -> subprocess.CompletedProcess:
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder, "lesson-design.json")
        path.write_text(json.dumps(design), encoding="utf-8")
        return run(str(path))


# The 30 September 2026 shape: word card, long story Teach, a board sort done
# alone, a Teach, a sentence done alone, then the written main task.
SEAT = {
    "starter": {"kind": "starter", "sourceUnitId": "s", "label": "Recall",
                "pupilInstruction": "Answer each question on your own.",
                "speakerNotes": {"script": "one two three"}},
    "vocabulary": [{"id": "v1", "term": "Nativity"}],
    "vocabularyIntroductions": [{"vocabularyRefs": ["v1"], "after": "s", "script": " ".join(["w"] * 60)}],
    "teachingSequence": [
        {"kind": "teach", "sourceUnitId": "t1", "label": "The story",
         "speakerNotes": {"script": " ".join(["w"] * 300)}},
        {"kind": "do", "sourceUnitId": "d1", "label": "True or false",
         "pupilInstruction": "Sort each sentence into true or false.",
         "taskStructure": {"kind": "sort", "groups": [], "items": []}},
        {"kind": "teach", "sourceUnitId": "t2", "label": "Who the baby is",
         "speakerNotes": {"script": " ".join(["w"] * 100)}},
        {"kind": "do", "sourceUnitId": "d2", "label": "Wise men",
         "pupilInstruction": "Match each card to what it shows, with your partner.",
         "taskStructure": {"kind": "sort", "groups": [], "items": [],
                           "handling": {"kind": "cards", "per": "pair"}}},
        {"kind": "practise", "sourceUnitId": "p", "label": "Explain",
         "pupilInstruction": "Write your explanation."},
    ],
}


class FromAChildsSeatTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.result = run_design(SEAT)
        out = cls.result.stdout
        cls.seat = out[out.index("From a child's seat"):].splitlines()

    def test_every_beat_and_word_card_is_in_class_order(self) -> None:
        self.assertEqual(self.result.returncode, 0, self.result.stderr)
        expected = [("do", "Recall"), ("listen", "word card: Nativity"), ("listen", "The story"),
                    ("do", "True or false"), ("listen", "Who the baby is"), ("do", "Wise men")]
        # No minutes are planned in this design, so every Do counts as a task.
        for line, (what, name) in zip(self.seat[1:7], expected):
            self.assertEqual(line.split()[0], what, line)
            self.assertIn(name, line)
        self.assertTrue(self.seat[7].startswith("  MAIN    Explain:"))

    def test_listening_is_counted_in_words_and_time_to_say(self) -> None:
        self.assertIn("  listen  The story (300 words, about 2.5 minutes to say)", self.seat)
        self.assertIn("  Children only listen to 460 words in all, about 4 minutes to say.", self.seat)
        self.assertIn("  The longest listening stretch is 360 words, about 3 minutes to say: "
                      "word card: Nativity; The story.", self.seat)

    def test_it_says_how_and_with_whom_children_work(self) -> None:
        self.assertTrue(any("True or false" in line and "from the board or in books, on their own" in line
                            for line in self.seat))
        self.assertTrue(any("Wise men" in line and "with printed cards, one set per pair, with a partner or group"
                            in line for line in self.seat))
        self.assertIn("  Between the starter and the main work children do 2 tasks and 0 quick checks (a Do "
                      "planned at 2 minutes or less): 1 with cards in their hands, 1 with a partner or group, "
                      "the rest on their own from the board or in books.", self.seat)
        self.assertIn("  Tasks counted against the two or three a lesson holds (the main work and anything "
                      "after it included, quick checks not): 3.", self.seat)

    def test_a_do_planned_at_two_minutes_or_less_is_a_quick_check_and_longer_is_a_task(self) -> None:
        design = json.loads(json.dumps(SEAT))
        design["teachingSequence"][1]["minutes"] = 2
        design["teachingSequence"][3]["minutes"] = 4
        design["ending"] = {"included": True, "beat": {"kind": "apply", "sourceUnitId": "a", "label": "Moon",
                                                        "minutes": 4, "pupilInstruction": "Write yes or no."}}
        lines = run_design(design).stdout.splitlines()
        self.assertTrue(any(line.startswith("  quick ") and "True or false" in line for line in lines))
        self.assertTrue(any(line.startswith("  do ") and "Wise men" in line for line in lines))
        self.assertIn("  Tasks counted against the two or three a lesson holds (the main work and anything "
                      "after it included, quick checks not): 3.", lines)

    def test_a_short_beat_with_a_printed_sheet_counts_as_a_task(self) -> None:
        # 1 October 2026: the Shaftesbury lesson printed its one-minute check
        # and the teacher felt four tasks where the count showed three.
        design = json.loads(json.dumps(SEAT))
        design["teachingSequence"][1]["minutes"] = 2
        design["teachingSequence"][1]["levels"] = {
            "printed": {"form": "task", "per": "pair", "what": "x"}, "boardOnlyBecause": None, "realThings": None}
        lines = run_design(design).stdout.splitlines()
        self.assertTrue(any(line.startswith("  do ") and "True or false" in line for line in lines), lines)
        self.assertTrue(any("True or false" in line and "printed task sheet" in line for line in lines), lines)

    def test_a_task_after_the_main_work_is_counted_and_the_starter_is_not(self) -> None:
        design = json.loads(json.dumps(SEAT))
        design["ending"] = {"included": True, "beat": {"kind": "apply", "sourceUnitId": "a", "label": "Is Freya right?",
                                                        "pupilInstruction": "Explain how you know."}}
        seat = run_design(design).stdout
        self.assertIn("  After the main work they do something 1 more time.", seat.splitlines())
        self.assertIn("Between the starter and the main work children do 2 tasks", seat)


class DoBeatsInARowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder, "lesson-design.json")
            path.write_text(json.dumps(DESIGN), encoding="utf-8")
            cls.result = run(str(path))
        cls.lines = cls.result.stdout.splitlines()

    def test_it_is_a_look_not_a_verdict(self) -> None:
        self.assertEqual(self.result.returncode, 0, self.result.stderr)
        self.assertIn("DO_BEATS_IN_A_ROW: 3 beats. A look, not a verdict", self.result.stdout)

    def test_every_beat_is_listed_in_order_with_how_children_answer(self) -> None:
        marker = next(i for i, line in enumerate(self.lines) if line.startswith("DO_BEATS"))
        heads = [line for line in self.lines[:marker] if not line.startswith(" ")]
        self.assertEqual(heads, ["Do 1: Name the biome", "Do 2: A new place", "practice: Practise"])
        self.assertIn('  answered as: card sort; told: "Decide which biome each photograph shows and say ..."', self.lines)
        self.assertIn('  answered as: written sentence; told: "Describe the weather in Manaus."', self.lines)

    def test_a_beat_that_repeats_its_teach_is_shown(self) -> None:
        self.assertIn("  also in the Teach just before: hot with very little rain", self.lines)

    def test_a_beat_that_repeats_its_star_fact_is_shown(self) -> None:
        self.assertIn("  also in its star fact (sk1): hot wet and green all year", self.lines)

    def test_a_beat_on_a_new_case_shows_no_repeat(self) -> None:
        start = self.lines.index("Do 2: A new place")
        self.assertFalse(any(line.startswith("  also in") for line in self.lines[start + 1:start + 3]))

    def test_grammar_alone_is_not_a_repeat(self) -> None:
        design = {"teachingSequence": [
            {"kind": "teach", "content": {"explanation": "It is in the middle of the map."}},
            {"kind": "do", "label": "Find it", "content": {"format": "point", "task": "Is it in the middle of it?"}},
        ]}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder, "lesson-design.json")
            path.write_text(json.dumps(design), encoding="utf-8")
            result = run(str(path))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("also in the Teach", result.stdout)

    def test_a_real_saved_design_reads_without_error(self) -> None:
        saved = ROOT / "scripts" / "tests" / "fixtures" / "working-wall-packet" / "geography" / "lesson-design.json"
        result = run(str(saved))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertRegex(result.stdout, r"DO_BEATS_IN_A_ROW: [1-9]\d* beats")

    def test_a_task_structure_says_how_children_answer_when_no_format_is_named(self) -> None:
        design = {"teachingSequence": [
            {"kind": "teach", "content": {"explanation": "Owls hunt at night."}},
            {"kind": "do", "label": "Board sort", "pupilInstruction": "Sort the animals.",
             "taskStructure": {"kind": "sort", "groups": [], "items": []}},
            {"kind": "do", "label": "Table sort", "pupilInstruction": "Sort the animals.",
             "taskStructure": {"kind": "sort", "groups": [], "items": [],
                               "handling": {"kind": "cards", "per": "pair"}}},
        ]}
        lines = run_design(design).stdout.splitlines()
        self.assertIn('  answered as: sort from the board; told: "Sort the animals."', lines)
        self.assertIn('  answered as: sort with printed cards, one set per pair; told: "Sort the animals."', lines)

    def test_called_without_a_design_is_its_own_exit_code(self) -> None:
        result = run()
        self.assertEqual(result.returncode, 2)
        self.assertIn("usage: do-beats-in-a-row.py", result.stderr)


if __name__ == "__main__":
    unittest.main()
