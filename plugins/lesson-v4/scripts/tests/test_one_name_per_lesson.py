"""One name per lesson, set by the run, and a save that sends only this lesson's files.

Year 4 lessons 29 to 32 (15 October 2026) were built side by side into the one
shared output folder. Lessons 29 and 30 share an objective, as do 31 and 32, and
each helper named its files from its own title, so Thursday's build renamed
Friday's deck, wall and activity to "(1)"; only timing kept Friday from saving
Thursday's files. Wednesday's deck meanwhile carried a title its slide designer
made up. Teacher's rulings (16 October 2026): the plan's lesson number goes on
the deck on the drive; a day or week is for the working files only.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "run-fixed-resource.py"
SPEC = importlib.util.spec_from_file_location("run_fixed_resource_names", SCRIPT)
fixed = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(fixed)

FILENAME_JS = '''"use strict";
function safeFilenameComponent(value, fallback = "Lesson") {
  const safe = String(value == null ? "" : value).replace(/[\\\\/]+/g, "-").replace(/[:*?"<>|]/g, "").trim();
  return safe || fallback;
}
module.exports = { safeFilenameComponent };
'''

# A stand-in deck builder that names its file the way the real one does: from
# --name when given, else from the spec's lessonName.
SLIDES_JS = """const fs=require('fs'); const p=require('path');
const a=process.argv; const at=a.indexOf('--name');
const name = at >= 0 ? a[at+1] : JSON.parse(fs.readFileSync(a[2],'utf8')).lessonName;
const out=p.join(a[3], name + '.pptx');
fs.writeFileSync(out, 'deck of ' + p.basename(p.dirname(a[2])));
console.log('Wrote: ' + out);
"""

# A stand-in delivery that lists what it was handed.
DELIVER_PY = """import sys
from pathlib import Path
args = sys.argv[1:]
source = Path(args[args.index('--source') + 1])
print('DESTINATION=D:/Lessons')
for i, a in enumerate(args):
    if a == '--file':
        name = args[i + 1]
        print('FILE=' + name + '|' + (source / name).read_text(encoding='utf-8'))
print('STATUS=COPIED')
"""


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class OneNamePerLesson(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.plugin = self.root / "plugin"
        self.output = self.root / "output"
        self.output.mkdir()
        for relative, text in (
            ("shared/text/filename.js", FILENAME_JS),
            ("builder/build.js", SLIDES_JS),
            ("scripts/deliver_files.py", DELIVER_PY),
        ):
            path = self.plugin / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def lesson(self, folder: str, filing: str = "", lesson_name: str = "Column subtraction") -> Path:
        working = self.output / "working" / folder
        working.mkdir(parents=True)
        (working / "lesson.json").write_text(json.dumps({"lessonName": lesson_name}), encoding="utf-8")
        if filing:
            (working / "filing.txt").write_text(filing, encoding="utf-8")
        return working

    def run_kind(self, working: Path, kind: str, *extra: str, expected: int = 0) -> dict:
        summary = working / "build-results" / f"{kind}.json"
        completed = subprocess.run(
            [sys.executable, str(SCRIPT), kind, "--plugin-root", str(self.plugin),
             "--working-dir", str(working), "--output-dir", str(self.output),
             "--summary-output", str(summary), *extra],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(completed.returncode, expected, completed.stderr or completed.stdout)
        return json.loads(summary.read_text(encoding="utf-8")) if summary.is_file() else {}

    # ─── the name ────────────────────────────────────────────────────────

    def test_the_plan_number_names_the_lesson(self) -> None:
        working = self.lesson("year-4-maths-lesson-31-column-subtraction-multiple-exchanges")
        self.assertEqual(fixed.lesson_build_name(working, "Column subtraction"), "Lesson 31 - Column subtraction")
        self.assertEqual(fixed.name_prefix(working), ("Lesson 31 - ", True))

    def test_a_title_that_already_carries_the_number_is_not_doubled(self) -> None:
        working = self.lesson("year-4-maths-lesson-30-column-subtraction-one-exchange")
        self.assertEqual(
            fixed.lesson_build_name(working, "Year 4 Maths - Lesson 30 - Column subtraction (one exchange)"),
            "Lesson 30 - Column subtraction (one exchange)",
        )
        self.assertEqual(
            fixed.lesson_build_name(working, "Year 6 SATs revision - fractions"),
            "Lesson 30 - Year 6 SATs revision - fractions",
        )

    def test_without_a_number_the_day_then_the_week_then_nothing(self) -> None:
        daily = self.lesson("equivalent-fractions", "DELIVERY=sorted\nWEEK_NUM=5\nDAY=Tuesday\n")
        weekly = self.lesson("great-fire", "DELIVERY=sorted\nWEEK_NUM=5\n")
        plain = self.lesson("roman-numerals", "DELIVERY=none\n")
        self.assertEqual(fixed.lesson_build_name(daily, "Equivalent fractions"), "Tuesday - Equivalent fractions")
        self.assertEqual(fixed.lesson_build_name(weekly, "Great Fire"), "Week 5 - Great Fire")
        self.assertEqual(fixed.lesson_build_name(plain, "Roman numerals"), "Roman numerals")
        self.assertEqual(fixed.name_prefix(daily), ("Tuesday - ", False))

    # ─── side by side ────────────────────────────────────────────────────

    def test_two_lessons_on_one_objective_never_build_over_each_other(self) -> None:
        thursday = self.lesson("year-4-maths-lesson-31-x", lesson_name="Column subtraction (multiple exchanges)")
        friday = self.lesson("year-4-maths-lesson-32-x", lesson_name="Column subtraction (multiple exchanges)")
        first = self.run_kind(friday, "slides", "--lesson-name", "Column subtraction (multiple exchanges)")
        second = self.run_kind(thursday, "slides", "--lesson-name", "Column subtraction (multiple exchanges)")
        self.assertEqual(second["archived"], [])
        self.assertTrue(first["outputs"][0]["path"].endswith("Lesson 32 - Column subtraction (multiple exchanges).pptx"))
        self.assertTrue(second["outputs"][0]["path"].endswith("Lesson 31 - Column subtraction (multiple exchanges).pptx"))
        self.assertEqual(second["buildName"], "Lesson 31 - Column subtraction (multiple exchanges)")
        self.assertEqual(len(list(self.output.glob("*.pptx"))), 2)

    # ─── saving ──────────────────────────────────────────────────────────

    def deliver(self, working: Path, *names: str, expected: int = 0) -> list[str]:
        args = ["--year", "4", "--subject", "Maths"]
        for name in names:
            args += ["--file", name]
        summary = self.run_kind(working, "deliver", *args, expected=expected)
        return [line[5:] for line in summary.get("stdout", "").splitlines() if line.startswith("FILE=")]

    def test_the_drive_keeps_the_number_and_drops_the_day(self) -> None:
        numbered = self.lesson("year-4-maths-lesson-31-x")
        self.run_kind(numbered, "slides", "--lesson-name", "Column subtraction")
        self.assertEqual(
            self.deliver(numbered, "Lesson 31 - Column subtraction.pptx"),
            ["Lesson 31 - Column subtraction.pptx|deck of year-4-maths-lesson-31-x"],
        )
        daily = self.lesson("equivalent-fractions", "DELIVERY=sorted\nWEEK_NUM=5\nDAY=Tuesday\n")
        self.run_kind(daily, "slides", "--lesson-name", "Equivalent fractions")
        self.assertEqual(
            self.deliver(daily, "Tuesday - Equivalent fractions.pptx"),
            ["Equivalent fractions.pptx|deck of equivalent-fractions"],
        )

    def test_a_file_built_over_by_another_lesson_is_saved_from_this_lessons_copy(self) -> None:
        mine = self.lesson("friday")
        self.run_kind(mine, "slides", "--lesson-name", "Column subtraction")
        deck = self.output / "Column subtraction.pptx"
        # Another lesson builds over the shared name, archiving this one's deck.
        deck.rename(self.output / "Column subtraction (1).pptx")
        deck.write_text("deck of thursday", encoding="utf-8")
        self.assertEqual(
            self.deliver(mine, "Column subtraction.pptx"),
            ["Column subtraction.pptx|deck of friday"],
        )

    def test_a_file_whose_own_copy_is_gone_is_refused_not_swapped(self) -> None:
        mine = self.lesson("friday")
        self.run_kind(mine, "slides", "--lesson-name", "Column subtraction")
        (self.output / "Column subtraction.pptx").write_text("deck of thursday", encoding="utf-8")
        completed = subprocess.run(
            [sys.executable, str(SCRIPT), "deliver", "--plugin-root", str(self.plugin),
             "--working-dir", str(mine), "--output-dir", str(self.output),
             "--summary-output", str(mine / "build-results" / "delivery.json"),
             "--year", "4", "--subject", "Maths", "--file", "Column subtraction.pptx"],
            capture_output=True, text=True, check=False,
        )
        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("NOT_THIS_LESSONS_FILE", completed.stderr)
        self.assertFalse((mine / "build-results" / "delivery.json").exists())

    def test_a_file_no_build_recorded_is_saved_as_it_stands(self) -> None:
        mine = self.lesson("friday")
        (self.output / "Extra.pdf").write_text("by hand", encoding="utf-8")
        self.assertEqual(self.deliver(mine, "Extra.pdf"), ["Extra.pdf|by hand"])


if __name__ == "__main__":
    unittest.main()
