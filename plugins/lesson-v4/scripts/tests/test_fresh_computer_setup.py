"""A fresh computer gets its Python libraries from the plugin's own folder.

`check-setup.js --fix` installs missing libraries into a folder outside the
package, and `python_extras.py` puts that folder on the path. A script that
imports a library without importing `python_extras` first still works on a
computer whose own Python happens to have the library, which is every computer
the plugin is developed on, and fails on the fresh one it was installed for.
These tests hold that from the files themselves, and prove the folder really
loads, without a fresh computer to hand.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import sysconfig
import tempfile
import unittest
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parents[2]
THIRD_PARTY = ("PIL", "pptx", "fitz", "pymupdf", "docx", "pdf2image", "fontTools", "win32com", "pythoncom")
IMPORT_RE = re.compile(r"^\s*(?:import|from)\s+(%s)\b" % "|".join(THIRD_PARTY), re.M)
HOOK_RE = re.compile(r"^\s*import python_extras\b", re.M)


def runtime_python_files():
    for path in PLUGIN_ROOT.rglob("*.py"):
        parts = set(path.relative_to(PLUGIN_ROOT).parts)
        if parts & {"node_modules", "tests", "test", "__pycache__", "educational-svg"}:
            continue
        if path.name.startswith("test_") or path.name == "conftest.py":
            continue
        yield path


class ScriptsLoadThePluginLibraries(unittest.TestCase):
    def test_every_script_using_a_library_loads_the_plugin_folder_first(self):
        offenders = []
        for path in runtime_python_files():
            text = path.read_text(encoding="utf-8")
            first_library = IMPORT_RE.search(text)
            if not first_library:
                continue
            hook = HOOK_RE.search(text)
            if not hook or hook.start() > first_library.start():
                offenders.append(str(path.relative_to(PLUGIN_ROOT)))
        self.assertEqual(
            offenders,
            [],
            "these scripts import a library before `import python_extras`, so they fail on a fresh computer",
        )


class ThePluginFolderLoads(unittest.TestCase):
    def run_python(self, home: str, code: str) -> subprocess.CompletedProcess:
        env = dict(os.environ, LESSON_RESOURCES_HOME=home)
        return subprocess.run(
            [sys.executable, "-c", f"import sys; sys.path.insert(0, {str(PLUGIN_ROOT / 'scripts')!r})\n{code}"],
            capture_output=True,
            text=True,
            env=env,
        )

    def test_a_library_in_the_folder_for_this_python_can_be_imported(self):
        with tempfile.TemporaryDirectory() as home:
            tag = f"py{sys.version_info.major}{sys.version_info.minor}-{sysconfig.get_platform()}"
            folder = Path(home, "python", tag)
            folder.mkdir(parents=True)
            (folder / "lesson_extras_probe.py").write_text("VALUE = 'from the plugin folder'\n", encoding="utf-8")
            result = self.run_python(home, "import python_extras, lesson_extras_probe; print(lesson_extras_probe.VALUE)")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("from the plugin folder", result.stdout)

    def test_a_library_the_computer_already_has_wins_over_the_folder(self):
        # A computer that worked before the plugin installed anything must keep
        # working exactly as it did.
        with tempfile.TemporaryDirectory() as home:
            tag = f"py{sys.version_info.major}{sys.version_info.minor}-{sysconfig.get_platform()}"
            folder = Path(home, "python", tag, "json")
            folder.mkdir(parents=True)
            (folder / "__init__.py").write_text("SHADOW = True\n", encoding="utf-8")
            result = self.run_python(home, "import python_extras, json; print(hasattr(json, 'SHADOW'))")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("False", result.stdout)

    def test_a_folder_built_for_another_python_is_ignored(self):
        with tempfile.TemporaryDirectory() as home:
            folder = Path(home, "python", "py27-other-platform")
            folder.mkdir(parents=True)
            (folder / "lesson_extras_probe.py").write_text("VALUE = 1\n", encoding="utf-8")
            result = self.run_python(home, "import python_extras\ntry:\n    import lesson_extras_probe\n    print('loaded')\nexcept ImportError:\n    print('ignored')")
            self.assertIn("ignored", result.stdout, result.stderr)


if __name__ == "__main__":
    unittest.main()
