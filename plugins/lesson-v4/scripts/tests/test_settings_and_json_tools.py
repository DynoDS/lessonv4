"""The two small tools every run leans on: the settings tool and the JSON check.

`lesson-settings.py` keeps what the teacher chose for this computer (where
lessons are saved, how they are sorted into terms), and each command checks what
it is given before saving it, because a wrong setting is only found at the end
of the next run, when the resources have nowhere to go. `check-json.py` stops a
run at the cheap point when a designer's handoff file does not parse, rather
than after the slow fan-out of agents that read it.

Every settings check runs against a temporary settings folder
(`LESSON_RESOURCES_HOME`), never this computer's own.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
SETTINGS = SCRIPTS / "lesson-settings.py"
CHECK_JSON = SCRIPTS / "check-json.py"

TERM_DATES = """| Term | Starts | Ends |
|---|---|---|
| Autumn 1 | Tuesday 1 September 2026 | Friday 23 October 2026 |
| Autumn 2 | Monday 2 November 2026 | Friday 18 December 2026 |
"""


class SettingsToolTests(unittest.TestCase):
    def setUp(self) -> None:
        self._home = tempfile.TemporaryDirectory()
        self.home = Path(self._home.name)
        self._elsewhere = tempfile.TemporaryDirectory()
        self.elsewhere = Path(self._elsewhere.name)

    def tearDown(self) -> None:
        self._home.cleanup()
        self._elsewhere.cleanup()

    def settings(self, *args: str) -> subprocess.CompletedProcess:
        env = dict(os.environ, LESSON_RESOURCES_HOME=str(self.home), PYTHONUTF8="1")
        return subprocess.run([sys.executable, str(SETTINGS), *args], capture_output=True, text=True, env=env)

    def saved(self) -> dict:
        path = self.home / "settings.json"
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}

    def test_show_lists_every_setting_on_a_fresh_computer(self) -> None:
        result = self.settings("show")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        for key in ("DELIVERY=", "SAVE_FOLDER=", "TERM_DATES=", "DELIVERY_OFFERED=no", "DEVELOPER_SOURCE="):
            self.assertIn(key, result.stdout)

    def test_a_full_save_folder_is_made_and_kept(self) -> None:
        folder = self.elsewhere / "Lessons"
        result = self.settings("save-folder", str(folder))
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("SETTINGS_SAVED", result.stdout)
        self.assertIn(f"SAVE_FOLDER={folder}", result.stdout)
        self.assertIn("DELIVERY_OFFERED=yes", result.stdout)
        self.assertTrue(folder.is_dir())

    def test_a_part_path_is_refused_and_nothing_is_saved(self) -> None:
        result = self.settings("save-folder", "Lessons")
        self.assertEqual(result.returncode, 1)
        self.assertIn("SETTINGS_ERROR: the save folder must be a full path", result.stdout)
        self.assertNotIn("SETTINGS_SAVED", result.stdout)
        self.assertEqual(self.saved(), {})

    def test_sorting_needs_a_save_folder_first(self) -> None:
        dates = self.elsewhere / "term-dates.md"
        dates.write_text(TERM_DATES, encoding="utf-8")
        result = self.settings("sorting", "on", str(dates))
        self.assertEqual(result.returncode, 1)
        self.assertIn("choose a save folder first", result.stdout)

    def test_sorting_keeps_its_own_copy_of_the_term_dates(self) -> None:
        self.assertEqual(self.settings("save-folder", str(self.elsewhere / "Lessons")).returncode, 0)
        dates = self.elsewhere / "term-dates.md"
        dates.write_text(TERM_DATES, encoding="utf-8")
        result = self.settings("sorting", "on", str(dates))
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("TERMS_FOUND=", result.stdout)
        self.assertIn("SETTINGS_SAVED", result.stdout)
        copy = self.home / "term-dates.md"
        self.assertEqual(copy.read_text(encoding="utf-8"), TERM_DATES)
        # The copy survives the teacher's own file being moved away mid-year.
        dates.unlink()
        self.assertIn(f"TERM_DATES={copy}", self.settings("show").stdout)

    def test_a_term_dates_file_with_no_terms_is_refused(self) -> None:
        self.assertEqual(self.settings("save-folder", str(self.elsewhere / "Lessons")).returncode, 0)
        before = self.saved()
        dates = self.elsewhere / "term-dates.md"
        dates.write_text("Autumn starts in September.\n", encoding="utf-8")
        result = self.settings("sorting", "on", str(dates))
        self.assertEqual(result.returncode, 1)
        self.assertIn("no teaching terms were found in that file", result.stdout)
        self.assertEqual(self.saved(), before)

    def test_a_folder_that_is_not_the_plugin_cannot_be_the_developer_copy(self) -> None:
        result = self.settings("developer", "on", str(self.elsewhere))
        self.assertEqual(result.returncode, 1)
        self.assertIn("SETTINGS_ERROR: that is not a writable copy of the plugin", result.stdout)

    def test_offered_and_developer_off_save(self) -> None:
        for command in (("offered",), ("developer", "off")):
            with self.subTest(command=command):
                result = self.settings(*command)
                self.assertEqual(result.returncode, 0, result.stdout)
                self.assertIn("SETTINGS_SAVED", result.stdout)
        self.assertIn("DELIVERY_OFFERED=yes", self.settings("show").stdout)

    def test_an_unknown_command_is_refused(self) -> None:
        result = self.settings("save-everything")
        self.assertEqual(result.returncode, 1)
        self.assertIn("SETTINGS_ERROR: unknown command", result.stdout)


class JsonCheckTests(unittest.TestCase):
    def check(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, str(CHECK_JSON), *args], capture_output=True, text=True,
                              env=dict(os.environ, PYTHONUTF8="1"))

    def test_a_valid_handoff_passes_under_its_label(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder, "lesson.json")
            path.write_text('{"slides": []}', encoding="utf-8")
            result = self.check(str(path), "Slide spec")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("Slide spec: valid JSON.", result.stdout)

    def test_a_broken_handoff_names_where_it_broke(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder, "lesson.json")
            path.write_text('{"slides": [1, 2,]}', encoding="utf-8")
            result = self.check(str(path))
            self.assertEqual(result.returncode, 1)
            self.assertIn("lesson.json is not valid JSON", result.stderr)
            self.assertIn("at line 1, column", result.stderr)
            self.assertIn("before spawning any agent that reads it", result.stderr)

    def test_a_handoff_never_written_stops_the_run(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            result = self.check(str(Path(folder, "worksheet.json")))
            self.assertEqual(result.returncode, 1)
            self.assertIn("worksheet.json was not written", result.stderr)

    def test_no_file_given_is_its_own_exit_code(self) -> None:
        result = self.check()
        self.assertEqual(result.returncode, 2)
        self.assertIn("no file given", result.stderr)


if __name__ == "__main__":
    unittest.main()
