from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "run-fixed-resource.py"


class RunFixedResourceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.plugin = self.root / "plugin"
        self.working = self.root / "working"
        self.output = self.root / "output"
        self.plugin.mkdir()
        self.working.mkdir()
        self.output.mkdir()
        self.write(
            "shared/text/filename.js",
            '''"use strict";
function safeFilenameComponent(value, fallback = "Lesson") {
  const safe = String(value == null ? "" : value)
    .replace(/[—–]/g, "-")
    .replace(/[\\/]+/g, "-")
    .replace(/[:*?"<>|]/g, "")
    .replace(/[. ]+$/g, "")
    .trim();
  return safe || fallback;
}
module.exports = { safeFilenameComponent };
''',
        )
        (self.working / "lesson.json").write_text(
            json.dumps({"lessonName": "Lesson"}) + "\n", encoding="utf-8"
        )
        (self.working / "worksheet.json").write_text("{}\n", encoding="utf-8")
        (self.working / "stick-in-sheets.json").write_text(
            json.dumps({"meta": {"lesson": "Lesson"}, "items": [{}]}) + "\n",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write(self, relative: str, text: str) -> Path:
        path = self.plugin / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def run_script(
        self, *args: str, expected: int = 0
    ) -> subprocess.CompletedProcess[str]:
        summary = self.root / "summary.json"
        completed = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                *args,
                "--plugin-root",
                str(self.plugin),
                "--working-dir",
                str(self.working),
                "--output-dir",
                str(self.output),
                "--summary-output",
                str(summary),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(
            completed.returncode,
            expected,
            completed.stderr or completed.stdout,
        )
        return completed

    def js_writer(self, relative: str, body: str) -> None:
        self.write(relative, body)

    def test_slides_build_and_hashes_output(self) -> None:
        self.js_writer(
            "builder/build.js",
            """const fs=require('fs'); const p=require('path');
const out=p.join(process.argv[3], 'Lesson.pptx');
fs.writeFileSync(out, 'pptx');
console.log('Wrote: ' + out);
""",
        )
        self.run_script("slides", "--lesson-name", "Lesson")
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertTrue(summary["ok"])
        self.assertEqual(summary["kind"], "slides")
        self.assertEqual(len(summary["outputs"][0]["sha256"]), 64)

    def test_existing_output_is_archived_before_build(self) -> None:
        (self.output / "Lesson.pptx").write_text("old", encoding="utf-8")
        self.js_writer(
            "builder/build.js",
            """const fs=require('fs'); const p=require('path');
const out=p.join(process.argv[3], 'Lesson.pptx');
fs.writeFileSync(out, 'new');
console.log('Wrote: ' + out);
""",
        )
        self.run_script("slides", "--lesson-name", "Lesson")
        self.assertEqual(
            (self.output / "Lesson (1).pptx").read_text(), "old"
        )
        self.assertEqual((self.output / "Lesson.pptx").read_text(), "new")

    def test_slide_filename_comes_from_builder_marker_and_sanitized_spec(self) -> None:
        (self.working / "lesson.json").write_text(
            json.dumps({"lessonName": "More/Less: patterns"}) + "\n",
            encoding="utf-8",
        )
        old = self.output / "More-Less patterns.pptx"
        old.write_text("old", encoding="utf-8")
        self.js_writer(
            "builder/build.js",
            """const fs=require('fs'); const p=require('path');
const out=p.join(process.argv[3], 'More-Less patterns.pptx');
fs.writeFileSync(out, 'new');
console.log('Wrote: ' + out);
""",
        )
        self.run_script("slides", "--lesson-name", "Different CLI title")
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertTrue(summary["ok"])
        self.assertTrue(
            summary["outputs"][0]["path"].endswith("More-Less patterns.pptx")
        )
        self.assertEqual(
            (self.output / "More-Less patterns (1).pptx").read_text(), "old"
        )

    def test_worksheet_pdf_skipped_accepts_html_and_answer_key_as_degraded(
        self,
    ) -> None:
        self.js_writer(
            "worksheet-html/scripts/build-worksheet.js",
            """const fs=require('fs'); const p=require('path');
const out=process.argv[3]; const base=process.argv[4];
const html=p.join(out, base + '-Below.html');
const answer=p.join(out, 'Lesson - Answers.txt');
fs.writeFileSync(html, '<p>x</p>');
fs.writeFileSync(answer, 'answers');
console.log('Built answers: ' + answer);
console.log('PDF_SKIPPED');
console.log('Built HTML: ' + html);
""",
        )
        self.run_script(
            "worksheets",
            "--lesson-name",
            "Lesson",
            "--chrome-state",
            "unavailable",
        )
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertTrue(summary["ok"])
        self.assertTrue(summary["degraded"])

    def test_worksheet_pdf_skipped_after_ready_preflight_is_failure(
        self,
    ) -> None:
        self.js_writer(
            "worksheet-html/scripts/build-worksheet.js",
            """const fs=require('fs'); const p=require('path');
const out=process.argv[3]; const base=process.argv[4];
const html=p.join(out, base + '-Below.html');
const answer=p.join(out, 'Lesson - Answers.txt');
fs.writeFileSync(html, '<p>x</p>');
fs.writeFileSync(answer, 'answers');
console.log('Built answers: ' + answer);
console.log('PDF_SKIPPED');
console.log('Built HTML: ' + html);
""",
        )
        self.run_script(
            "worksheets",
            "--lesson-name",
            "Lesson",
            "--chrome-state",
            "ready",
            expected=1,
        )
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertFalse(summary["ok"])
        self.assertIn(
            "shared Chrome preflight reported ready", summary["stderr"]
        )

    def test_worksheet_sanitized_filename_is_discovered_from_markers(
        self,
    ) -> None:
        self.js_writer(
            "worksheet-html/scripts/build-worksheet.js",
            """const fs=require('fs'); const p=require('path');
const out=process.argv[3];
const pdf=p.join(out, 'More-Less patterns - Worksheets.pdf');
const answer=p.join(out, 'More-Less patterns - Answers.txt');
fs.writeFileSync(pdf, 'pdf');
fs.writeFileSync(answer, 'answers');
console.log('Built answers: ' + answer);
console.log('Built: ' + pdf);
""",
        )
        self.run_script(
            "worksheets",
            "--lesson-name",
            "More/Less: patterns",
        )
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertTrue(summary["ok"])
        self.assertEqual(len(summary["outputs"]), 2)

    def test_stick_in_requires_expected_output(self) -> None:
        self.js_writer(
            "stick-in-sheets-html/build.js", "console.log('done');\n"
        )
        self.run_script(
            "stick-in", "--lesson-name", "Lesson", expected=1
        )
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertFalse(summary["ok"])

    def test_stick_in_uses_sanitized_meta_lesson_filename(self) -> None:
        (self.working / "stick-in-sheets.json").write_text(
            json.dumps(
                {
                    "meta": {"lesson": "More/Less: patterns"},
                    "items": [{}],
                }
            )
            + "\n",
            encoding="utf-8",
        )
        self.js_writer(
            "stick-in-sheets-html/build.js",
            """const fs=require('fs'); const p=require('path');
const out=p.join(process.argv[3], 'More-Less patterns - Stick-in Sheets.pdf');
fs.writeFileSync(out, 'pdf');
console.log('Built: ' + out);
console.log('Moments: 1');
console.log('Class set: 1');
""",
        )
        self.run_script("stick-in", "--lesson-name", "Different CLI title")
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertTrue(summary["ok"])
        self.assertTrue(
            summary["outputs"][0]["path"].endswith(
                "More-Less patterns - Stick-in Sheets.pdf"
            )
        )

    def test_nonzero_build_is_failure_with_captured_stderr(self) -> None:
        self.js_writer(
            "builder/build.js",
            "console.error('boom'); process.exit(7);\n",
        )
        self.run_script(
            "slides", "--lesson-name", "Lesson", expected=1
        )
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertEqual(summary["exitCode"], 7)
        self.assertIn("boom", summary["stderr"])

    def test_sharepoint_runs_script_directly_and_requires_status_marker(
        self,
    ) -> None:
        self.write(
            "scripts/sharepoint_sync.py",
            """import sys
print('DESTINATION=E:/Test')
print('FILE=Lesson.pptx')
print('STATUS=COPIED')
""",
        )
        term = self.root / "Term.md"
        term.write_text("dummy\n", encoding="utf-8")
        (self.output / "Lesson.pptx").write_text("x", encoding="utf-8")
        self.run_script(
            "sharepoint",
            "--term-file",
            str(term),
            "--year",
            "4",
            "--term-folder",
            "Autumn 1",
            "--week",
            "2",
            "--subject",
            "Maths",
            "--day",
            "Monday",
            "--file",
            "Lesson.pptx",
        )
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertTrue(summary["ok"])
        self.assertIn("STATUS=COPIED", summary["stdout"])


if __name__ == "__main__":
    unittest.main()
