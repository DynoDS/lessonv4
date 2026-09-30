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
        heads = [line for line in self.lines if not line.startswith(" ") and not line.startswith("DO_BEATS")]
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

    def test_called_without_a_design_is_its_own_exit_code(self) -> None:
        result = run()
        self.assertEqual(result.returncode, 2)
        self.assertIn("usage: do-beats-in-a-row.py", result.stderr)


if __name__ == "__main__":
    unittest.main()
