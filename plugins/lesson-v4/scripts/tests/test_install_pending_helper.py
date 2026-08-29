"""A helper built mid-lesson waits in the run's folder until a person installs it.

The build happens inside somebody's lesson, from one lesson's need, with nobody
having looked at the drawing. So ``helper-builder`` writes a drop-in rather than
editing the package, and ``install-pending-helper.py`` is the deterministic half
of getting it from there into a checkout later. These tests hold the two halves
of that contract: a drop-in that claims to be complete really is, and an install
that would silently overwrite or silently create somebody's work refuses instead.
"""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "install-pending-helper.py"


def manifest(**overrides) -> dict:
    data = {
        "schemaVersion": 1,
        "name": "rainfall-graph",
        "kind": "drawn",
        "summary": "A rainfall bar chart drawn from a lesson's monthly figures.",
        "surfaces": ["slides", "worksheets"],
        "files": [
            {
                "from": "builder/src/content/rainfall-graph.js",
                "to": "builder/src/content/rainfall-graph.js",
                "action": "add",
            }
        ],
        "wiring": [
            {
                "file": "builder/src/content/index.js",
                "change": "dispatch type 'rainfall-graph' to drawRainfallGraph",
            }
        ],
        "unproven": ["npm run check", "slide render"],
    }
    data.update(overrides)
    return data


def write_drop_in(root: Path, data: dict | None = None, *, files=True, readme=True) -> Path:
    pending = root / "pending-helper" / "rainfall-graph"
    pending.mkdir(parents=True)
    payload = manifest() if data is None else data
    (pending / "install.json").write_text(
        json.dumps(payload, indent=2), encoding="utf-8"
    )
    if readme:
        (pending / "README.md").write_text("# rainfall-graph\n", encoding="utf-8")
    if files:
        for entry in payload.get("files", []):
            target = pending / entry["from"]
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("module.exports = {};\n", encoding="utf-8")
    return pending


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "-S", str(SCRIPT), *args],
        capture_output=True,
        text=True,
    )


class CheckTests(unittest.TestCase):
    def test_a_complete_drop_in_passes_and_says_what_is_still_owed(self):
        with TemporaryDirectory() as tmp:
            pending = write_drop_in(Path(tmp))
            result = run("check", "--pending", str(pending))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PENDING_HELPER_OK rainfall-graph", result.stdout)
        self.assertIn("1 file(s)", result.stdout)
        self.assertIn("1 wiring edit(s)", result.stdout)
        self.assertIn("2 unproven check(s)", result.stdout)

    def test_a_manifest_naming_a_file_the_drop_in_lacks_fails(self):
        # The failure this catches: a drop-in that reads as finished and then
        # cannot be installed, discovered only when somebody tries.
        with TemporaryDirectory() as tmp:
            pending = write_drop_in(Path(tmp), files=False)
            result = run("check", "--pending", str(pending))
        self.assertEqual(result.returncode, 1)
        self.assertIn("PENDING_HELPER_INVALID", result.stderr)
        self.assertIn("does not contain", result.stderr)

    def test_a_destination_outside_the_package_is_refused(self):
        data = manifest(files=[{
            "from": "builder/src/content/rainfall-graph.js",
            "to": "../../../etc/rainfall-graph.js",
            "action": "add",
        }])
        with TemporaryDirectory() as tmp:
            pending = write_drop_in(Path(tmp), data)
            result = run("check", "--pending", str(pending))
        self.assertEqual(result.returncode, 1)
        self.assertIn("must not step outside the package", result.stderr)

    def test_an_absolute_destination_is_refused(self):
        data = manifest(files=[{
            "from": "builder/src/content/rainfall-graph.js",
            "to": "/builder/src/content/rainfall-graph.js",
            "action": "add",
        }])
        with TemporaryDirectory() as tmp:
            pending = write_drop_in(Path(tmp), data)
            result = run("check", "--pending", str(pending))
        self.assertEqual(result.returncode, 1)
        self.assertIn("must be relative", result.stderr)

    def test_a_readme_is_required_because_a_person_reads_it_first(self):
        with TemporaryDirectory() as tmp:
            pending = write_drop_in(Path(tmp), readme=False)
            result = run("check", "--pending", str(pending))
        self.assertEqual(result.returncode, 1)
        self.assertIn("README.md is missing", result.stderr)

    def test_an_unknown_surface_is_refused(self):
        with TemporaryDirectory() as tmp:
            pending = write_drop_in(Path(tmp), manifest(surfaces=["assembly"]))
            result = run("check", "--pending", str(pending))
        self.assertEqual(result.returncode, 1)
        self.assertIn("surfaces", result.stderr)

    def test_two_files_sent_to_one_destination_are_refused(self):
        data = manifest(files=[
            {"from": "a.js", "to": "builder/src/content/x.js", "action": "add"},
            {"from": "b.js", "to": "builder/src/content/x.js", "action": "add"},
        ])
        with TemporaryDirectory() as tmp:
            pending = write_drop_in(Path(tmp), data)
            result = run("check", "--pending", str(pending))
        self.assertEqual(result.returncode, 1)
        self.assertIn("sends two files to", result.stderr)


class InstallTests(unittest.TestCase):
    def test_install_copies_the_files_and_names_the_wiring_it_cannot_do(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            pending = write_drop_in(root)
            checkout = root / "checkout"
            checkout.mkdir()
            result = run(
                "install", "--pending", str(pending), "--source-root", str(checkout)
            )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PENDING_HELPER_FILES_INSTALLED rainfall-graph", result.stdout)
        self.assertIn("WIRING_REQUIRED builder/src/content/index.js", result.stdout)
        self.assertIn("UNPROVEN npm run check", result.stdout)

    def test_install_actually_writes_the_file_into_the_checkout(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            pending = write_drop_in(root)
            checkout = root / "checkout"
            checkout.mkdir()
            run("install", "--pending", str(pending), "--source-root", str(checkout))
            landed = checkout / "builder" / "src" / "content" / "rainfall-graph.js"
            self.assertTrue(landed.is_file())
            self.assertIn("module.exports", landed.read_text(encoding="utf-8"))

    def test_a_dry_run_writes_nothing(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            pending = write_drop_in(root)
            checkout = root / "checkout"
            checkout.mkdir()
            result = run(
                "install", "--pending", str(pending),
                "--source-root", str(checkout), "--dry-run",
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("PENDING_HELPER_INSTALL_PLANNED", result.stdout)
            self.assertFalse((checkout / "builder").exists())

    def test_an_add_that_would_overwrite_existing_work_refuses(self):
        # The drop-in and the checkout disagree about what is already there.
        # Copying anyway loses somebody's work without saying so.
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            pending = write_drop_in(root)
            checkout = root / "checkout"
            existing = checkout / "builder" / "src" / "content" / "rainfall-graph.js"
            existing.parent.mkdir(parents=True)
            existing.write_text("// somebody else's work\n", encoding="utf-8")
            result = run(
                "install", "--pending", str(pending), "--source-root", str(checkout)
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("already exists in the checkout", result.stderr)
            self.assertIn(
                "somebody else's work", existing.read_text(encoding="utf-8")
            )

    def test_a_replace_that_would_create_refuses(self):
        data = manifest(files=[{
            "from": "builder/src/content/rainfall-graph.js",
            "to": "builder/src/content/rainfall-graph.js",
            "action": "replace",
        }])
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            pending = write_drop_in(root, data)
            checkout = root / "checkout"
            checkout.mkdir()
            result = run(
                "install", "--pending", str(pending), "--source-root", str(checkout)
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("does not exist in the checkout", result.stderr)
            self.assertFalse((checkout / "builder").exists())

    def test_one_bad_entry_stops_the_whole_install(self):
        # A part-installed helper in the dispatcher and registries is much harder
        # to unpick than one that never started.
        data = manifest(files=[
            {"from": "builder/src/content/rainfall-graph.js",
             "to": "builder/src/content/rainfall-graph.js", "action": "add"},
            {"from": "shared/visuals/rainfall-graph-svg.js",
             "to": "shared/visuals/rainfall-graph-svg.js", "action": "replace"},
        ])
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            pending = write_drop_in(root, data)
            checkout = root / "checkout"
            checkout.mkdir()
            result = run(
                "install", "--pending", str(pending), "--source-root", str(checkout)
            )
            self.assertEqual(result.returncode, 1)
            self.assertFalse((checkout / "builder").exists())


class NeverPublishesTests(unittest.TestCase):
    def test_the_installer_never_runs_git_or_versions_the_package(self):
        # Publishing puts the drawing in front of every lesson anyone builds, so
        # it is the teacher's call and never a script's.
        text = SCRIPT.read_text(encoding="utf-8")
        for token in ("git ", "subprocess", "plugin.json"):
            self.assertNotIn(token, text.replace("never runs git", ""))


if __name__ == "__main__":
    unittest.main()
