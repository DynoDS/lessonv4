"""A temporary fix is made in a copy, refuses what is not a fix, and keeps later work.

21 October 2026: the teacher ruled that a run meeting something the plugin
cannot draw fixes it for that lesson in a copy, tells him, and leaves the
plugin to him. These tests hold the tool to that without running the plugin's
own suites, which `check` runs on a real copy.
"""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

SCRIPTS = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("temporary_fix", SCRIPTS / "temporary-fix.py")
fix = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fix)


class TemporaryFix(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.plugin = root / "plugin"
        (self.plugin / "shared" / "visuals").mkdir(parents=True)
        (self.plugin / "shared" / "visuals" / "map.js").write_text("draw('old');\n", encoding="utf-8")
        (self.plugin / "agents").mkdir()
        (self.plugin / "agents" / "designer.md").write_text("Design well.\n", encoding="utf-8")
        (self.plugin / "builder" / "node_modules" / "big").mkdir(parents=True)
        (self.plugin / "builder" / "node_modules" / "big" / "lib.js").write_text("x", encoding="utf-8")
        self.working = root / "working"
        self.working.mkdir()
        fix.make(SimpleNamespace(plugin_root=str(self.plugin), working_dir=str(self.working), gap="world map"))
        self.copy = self.working / "temporary-fix" / "plugin"

    def tearDown(self):
        self.tmp.cleanup()

    def test_the_copy_leaves_the_installed_libraries_behind(self):
        self.assertTrue((self.copy / "shared" / "visuals" / "map.js").is_file())
        self.assertFalse((self.copy / "builder" / "node_modules").exists())
        self.assertIn(str(self.plugin / "builder" / "node_modules"), fix.node_path(self.plugin))

    def test_nothing_changed_is_not_a_fix(self):
        self.assertEqual(fix.check(SimpleNamespace(working_dir=str(self.working))), 1)

    def test_changing_what_agents_are_told_is_refused(self):
        (self.copy / "agents" / "designer.md").write_text("Design differently.\n", encoding="utf-8")
        self.assertEqual(fix.check(SimpleNamespace(working_dir=str(self.working))), 1)

    def test_a_fix_is_recorded_tidied_and_applied_without_touching_the_plugin(self):
        (self.copy / "shared" / "visuals" / "map.js").write_text("draw('new');\n", encoding="utf-8")
        args = SimpleNamespace(working_dir=str(self.working))
        self.assertEqual(fix.record(args), 1, "no note yet: the teacher is owed one")
        (self.working / "temporary-fix" / "note.md").write_text("The map draws the journey.\n", encoding="utf-8")
        self.assertEqual(fix.record(args), 0)
        self.assertEqual((self.plugin / "shared" / "visuals" / "map.js").read_text(encoding="utf-8"), "draw('old');\n")
        self.assertIn("+draw('new');", (self.working / "temporary-fix" / "fix.diff").read_text(encoding="utf-8"))
        self.assertEqual(fix.tidy(args), 0)
        self.assertFalse(self.copy.exists())
        applied = SimpleNamespace(fix=str(self.working / "temporary-fix"), to=str(self.plugin), dry_run=False)
        self.assertEqual(fix.apply(applied), 0)
        self.assertEqual((self.plugin / "shared" / "visuals" / "map.js").read_text(encoding="utf-8"), "draw('new');\n")

    def test_apply_refuses_to_undo_later_work(self):
        (self.copy / "shared" / "visuals" / "map.js").write_text("draw('new');\n", encoding="utf-8")
        (self.working / "temporary-fix" / "note.md").write_text("The map draws the journey.\n", encoding="utf-8")
        fix.record(SimpleNamespace(working_dir=str(self.working)))
        (self.plugin / "shared" / "visuals" / "map.js").write_text("draw('someone else changed it');\n", encoding="utf-8")
        applied = SimpleNamespace(fix=str(self.working / "temporary-fix"), to=str(self.plugin), dry_run=False)
        self.assertEqual(fix.apply(applied), 1)
        self.assertIn("someone else", (self.plugin / "shared" / "visuals" / "map.js").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
