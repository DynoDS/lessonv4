"""The commit guard skips its run only for the very files that just passed.

An agent runs every check, then commits a moment later, and the guard used to
run them all a second time on the identical folder (about three minutes where
one and a half would do, 3 October 2026). `run_all_checks.py` now notes which
files a full pass was on, and the guard is answered from that note.

The note must never stand in for a run it did not see. So these hold the edges:
a changed file, a new file, a file gone, a pass that is too old, or no note at
all, each means every check runs; a file git ignores (build output) and a second
look at the same files do not.
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import run_all_checks as runner  # noqa: E402

ENV = {key: value for key, value in os.environ.items() if key not in runner.GIT_LOCATORS}


class ThePassIsForTheseFilesOnly(unittest.TestCase):
    def setUp(self) -> None:
        tmp = tempfile.TemporaryDirectory(prefix="pass-note-")
        self.addCleanup(tmp.cleanup)
        self.plugin = Path(tmp.name) / "repo" / "plugin"
        self.plugin.mkdir(parents=True)
        self.note = Path(tmp.name) / "note.txt"
        subprocess.run(["git", "init", "-q", str(self.plugin.parent)], check=True, env=ENV, capture_output=True)
        (self.plugin / ".gitignore").write_text("out/\n", encoding="utf-8")
        (self.plugin / "rule.md").write_text("Teach, then do.\n", encoding="utf-8")
        patch = unittest.mock.patch.object(runner, "ROOT", self.plugin)
        patch.start()
        self.addCleanup(patch.stop)

    def passed(self, when: float = 1000.0) -> str:
        files = runner.fingerprint(ENV)
        self.note.write_text(f"{files} {when:.0f}", encoding="utf-8")
        return files

    def stands(self, now: float = 1060.0) -> bool:
        return runner.minutes_since_pass(self.note, runner.fingerprint(ENV), now) is not None

    def test_the_same_files_a_minute_later_are_not_run_again(self) -> None:
        self.passed()
        self.assertEqual(runner.minutes_since_pass(self.note, runner.fingerprint(ENV), 1060.0), 1)

    def test_one_changed_word_runs_every_check(self) -> None:
        self.passed()
        (self.plugin / "rule.md").write_text("Teach, then tell.\n", encoding="utf-8")
        self.assertFalse(self.stands())

    def test_a_new_file_runs_every_check(self) -> None:
        self.passed()
        (self.plugin / "new-rule.md").write_text("A new rule.\n", encoding="utf-8")
        self.assertFalse(self.stands())

    def test_a_file_gone_runs_every_check(self) -> None:
        subprocess.run(["git", "add", "-A"], cwd=self.plugin, check=True, env=ENV, capture_output=True)
        self.passed()
        (self.plugin / "rule.md").unlink()
        self.assertFalse(self.stands())

    def test_a_renamed_file_runs_every_check(self) -> None:
        self.passed()
        (self.plugin / "rule.md").rename(self.plugin / "rules.md")
        self.assertFalse(self.stands())

    def test_build_output_git_ignores_does_not_count_as_a_change(self) -> None:
        self.passed()
        (self.plugin / "out").mkdir()
        (self.plugin / "out" / "deck.html").write_text("built", encoding="utf-8")
        self.assertTrue(self.stands())

    def test_a_pass_more_than_an_hour_old_runs_every_check(self) -> None:
        self.passed(when=1000.0)
        self.assertTrue(self.stands(now=1000.0 + runner.PASS_STANDS_SECONDS - 1))
        self.assertFalse(self.stands(now=1000.0 + runner.PASS_STANDS_SECONDS))

    def test_a_pass_dated_after_now_runs_every_check(self) -> None:
        self.passed(when=5000.0)
        self.assertFalse(self.stands(now=1060.0))

    def test_no_note_or_a_broken_one_runs_every_check(self) -> None:
        self.assertFalse(self.stands())
        self.note.write_text("not a note", encoding="utf-8")
        self.assertFalse(self.stands())

    def test_a_folder_git_cannot_list_never_has_a_pass(self) -> None:
        outside = tempfile.TemporaryDirectory(prefix="pass-note-no-git-")
        self.addCleanup(outside.cleanup)
        (Path(outside.name) / "rule.md").write_text("Teach, then do.\n", encoding="utf-8")
        # A folder in no repository: git lists nothing, so nothing is trusted.
        env = {**ENV, "GIT_CEILING_DIRECTORIES": str(Path(outside.name).parent)}
        with unittest.mock.patch.object(runner, "ROOT", Path(outside.name)):
            self.assertIsNone(runner.fingerprint(env))
            self.note.write_text("None 1000", encoding="utf-8")
            self.assertIsNone(runner.minutes_since_pass(self.note, runner.fingerprint(env), 1060.0))


if __name__ == "__main__":
    unittest.main()
