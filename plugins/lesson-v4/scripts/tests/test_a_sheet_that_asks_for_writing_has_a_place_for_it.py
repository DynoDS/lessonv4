"""A printed activity whose task asks children to write names where each answer goes.

Three lessons of the 20-lesson stress test (7 October 2026) printed an activity
with nowhere to write: three sums with no box, eight coordinates with no line.
The pack could already draw a box or a line; the stick-in designer had not
asked for one, and nothing noticed. The teacher's ruling (10 October 2026):
every answer for the task goes on the sheet, the sheet goes back to its
designer once, and it is still delivered with a note if it comes back the same.

- `stick-in-kits` prints `STICK_IN_WRITING_PLACE:` for such a sheet;
- the line is a note beside `STICK_IN_KITS_OK`, never a fault that excludes the pack;
- the stick-in designer runs the check on its own pack before returning.

The printed page itself is tested in stick-in-sheets-html/test/somewhere-to-write.test.js.
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMMAND = ROOT / "scripts" / "resource-opportunities.py"

spec = importlib.util.spec_from_file_location("resource_opportunities", COMMAND)
opportunities = importlib.util.module_from_spec(spec)
spec.loader.exec_module(opportunities)

GRID = {
    "visual": "source-copy", "sourceUnitId": "unit-007", "label": "Your Turn 2 grid", "per": "child",
    "task": "(1) Plot triangle JKL: J (−5, 2). Translate it. Write the coordinates of its new vertices.",
    "spec": {"imagePath": "grid.png", "caption": "Coordinate grid"},
}


def notes(*items: dict) -> list[str]:
    return opportunities.writing_place_notes({"items": list(items)})


class WritingPlace(unittest.TestCase):
    def test_a_task_that_says_write_with_no_place_is_named(self):
        found = notes(GRID)
        self.assertEqual(len(found), 1)
        self.assertIn('"Your Turn 2 grid"', found[0])
        found[0].encode("cp1252")  # a Windows console prints it

    def test_a_listed_answer_or_a_stated_place_on_the_figure_settles_it(self):
        self.assertEqual(notes({**GRID, "write": ["(1) J' ( __ , __ )"]}), [])
        self.assertEqual(notes({**GRID, "write": "on the figure"}), [])
        self.assertEqual(len(notes({**GRID, "write": []})), 1)

    def test_one_place_anywhere_on_the_sheet_covers_the_task_given_on_its_first_figure(self):
        bars = {"visual": "shaded-fraction", "sourceUnitId": "unit-004", "spec": {"bars": []}}
        first = {**bars, "task": "Write each equivalent fraction."}
        self.assertEqual(notes(first, {**bars, "write": ["(2) 1/3 = ?/9"]}), [])
        self.assertEqual(len(notes(first, bars)), 1)

    def test_a_figure_with_its_own_cells_or_lines_is_left_alone(self):
        tally = {"visual": "tally-chart", "task": "Write the frequency for each minibeast.", "spec": {}}
        row = {"visual": "clock-row", "task": "Write the time under each clock.", "spec": {"writeOnLabels": True}}
        self.assertEqual(notes(tally, row), [])

    def test_a_task_that_asks_for_no_writing_and_a_slip_glued_into_a_book_are_left_alone(self):
        plot = {**GRID, "task": "Plot these points and join them in order."}
        slip = {**GRID, "layout": "slips"}
        sheet = {"visual": "task-sheet", "task": "Explain who is right.", "spec": {}}
        self.assertEqual(notes(plot, slip, sheet), [])

    def test_the_command_prints_a_note_and_still_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            design = Path(tmp) / "lesson-design.json"
            pack = Path(tmp) / "stick-in-sheets.json"
            design.write_text(json.dumps({"teachingSequence": []}), encoding="utf-8")
            pack.write_text(json.dumps({"items": [GRID]}), encoding="utf-8")
            done = subprocess.run(
                [sys.executable, str(COMMAND), "stick-in-kits", "--lesson-design", str(design), "--stick-in", str(pack)],
                capture_output=True, text=True,
            )
        self.assertEqual(done.returncode, 0, done.stdout + done.stderr)
        self.assertIn("STICK_IN_WRITING_PLACE:", done.stdout)
        self.assertIn("STICK_IN_KITS_OK", done.stdout)

    def test_the_designer_runs_the_check_on_its_own_pack_before_returning(self):
        agent = " ".join((ROOT / "agents" / "stick-in-sheets-designer.md").read_text(encoding="utf-8").split())
        reference = " ".join((ROOT / "references" / "stick-in-sheets-pedagogy.md").read_text(encoding="utf-8").split())
        self.assertIn("resource-opportunities.py\" stick-in-kits", agent)
        self.assertIn("`STICK_IN_WRITING_PLACE:`", agent)
        self.assertIn("**Every answer has its place on the sheet.**", reference)
        self.assertNotIn("answer goes in the child's book", reference)


if __name__ == "__main__":
    unittest.main()
