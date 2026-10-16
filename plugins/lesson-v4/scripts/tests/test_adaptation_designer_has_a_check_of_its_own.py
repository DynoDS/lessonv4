"""The adaptation designer finishes on a check that exists and that it can run.

Round four of the stress test: five Year 4 maths lessons (column subtraction,
lessons 28 to 32) built side by side on Claude Code 4.2.323, 15 October 2026.
Every other worker the playbook launches has a written launch with its
`SUCCESS_CHECK`; the adaptation step said only "launch directly", and its role
file named no check. All five orchestrators therefore wrote one themselves,
five different ways ("run the adaptation check named by your role
instructions", "your role's own completion check"...). Monday, Tuesday and
Friday's designers went looking, found `photo-contract.py build-provisional`,
which rightly refuses until the voice editor's second pass, and read the
script's own parser from the inside to have something to run. No page was
harmed, but a picture block the merge would refuse could only be found by the
orchestrator, whose answer after one retry is no Below or Greater Depth sheet.

The repair: `photo-contract.py check-adaptation`, which the designer runs on
its own file before handing back; its role file names it; the playbook's
adaptation step names it as the launch's `SUCCESS_CHECK`. The guard at the bottom holds every
written launch to markers that exist, so a launch cannot again point at a
check no one wrote.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SCRIPT = ROOT / "scripts" / "photo-contract.py"
AGENTS = ROOT / "agents"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fixtures = load_module(HERE / "test_lesson_design_contract.py", "adaptation_check_fixtures")


def adaptation_text(photos=None) -> str:
    text = (
        "# Adaptation - Adding two-digit numbers\n\n"
        "## Greater Depth\n\nResource decision: Use Expected unchanged\n\n"
        "## Below\n\nA backward-mapped task.\n"
    )
    if photos is not None:
        block = {"schema_version": 2, "lesson_name": "Adaptation", "photos": list(photos)}
        text += "\n## Photos for the sheets\n\n```json\n" + json.dumps(block, indent=2) + "\n```\n"
    return text


def adaptation_photo(number: int, filename: str | None = None) -> dict:
    photo = fixtures.photo_requirement(
        f"adaptation-photo-{number:03d}",
        f"A clear real leaf, number {number}",
        filename or f"unsplash/adaptation-leaf-{number}.jpg",
        pedagogical_constraint="Owned by adaptation.md.",
    )
    photo["use"] = "worksheet"
    return photo


def lesson_folder(root: Path, adaptation: str | None, lesson_photos=()) -> Path:
    design, photos = fixtures.valid_contract()
    design["lesson"]["subject"] = "Science"
    photos["photos"].extend(lesson_photos)
    (root / "lesson-design.json").write_text(json.dumps(design, indent=2), encoding="utf-8")
    contract = json.dumps(photos, indent=2) + "\n"
    (root / "photo-requirements.json").write_text(contract, encoding="utf-8")
    (root / "phase2-initial-photo-requirements.json").write_text(contract, encoding="utf-8")
    if adaptation is not None:
        (root / "adaptation.md").write_text(adaptation, encoding="utf-8")
    return root


def folder_state(root: Path) -> dict:
    return {
        str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


def run_check(root: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT), "check-adaptation", "--working-dir", str(root)],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )


class TheCheckReadsWhatTheMergeWillRead(unittest.TestCase):
    def test_an_adaptation_with_no_pictures_passes_with_zero(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = lesson_folder(Path(tmp), adaptation_text())
            result = run_check(root)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(result.stdout.strip().splitlines()[-1], "ADAPTATION_CHECK_OK 0")

    def test_a_good_picture_block_passes_without_the_voice_editor(self):
        """The orchestrator's merge waits for the voice editor; the check does not."""
        with tempfile.TemporaryDirectory() as tmp:
            root = lesson_folder(Path(tmp), adaptation_text([adaptation_photo(1)]))
            self.assertFalse((root / "orchestration-receipts").exists())
            result = run_check(root)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(result.stdout.strip().splitlines()[-1], "ADAPTATION_CHECK_OK 1")

    def test_it_writes_nothing_in_the_lesson_folder(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = lesson_folder(Path(tmp), adaptation_text([adaptation_photo(1)]))
            before = folder_state(root)
            self.assertEqual(run_check(root).returncode, 0)
            self.assertEqual(folder_state(root), before)

    def test_a_picture_that_takes_a_lesson_filename_is_refused(self):
        """The Year 4 history adaptation that was dropped whole for this."""
        lesson_photo = fixtures.photo_requirement("photo-001", "A leaf", "unsplash/leaf.jpg")
        with tempfile.TemporaryDirectory() as tmp:
            root = lesson_folder(
                Path(tmp),
                adaptation_text([adaptation_photo(1, "unsplash/leaf.jpg")]),
                [lesson_photo],
            )
            result = run_check(root)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("unsplash/leaf.jpg", result.stderr)
            self.assertNotIn("ADAPTATION_CHECK_OK", result.stdout)

    def test_pictures_numbered_out_of_order_are_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = lesson_folder(Path(tmp), adaptation_text([adaptation_photo(2)]))
            result = run_check(root)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("sequential", result.stderr)

    def test_more_pictures_than_the_run_allows_are_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            photos = [adaptation_photo(n) for n in range(1, 26)]
            root = lesson_folder(Path(tmp), adaptation_text(photos))
            result = run_check(root)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("one automated lesson run may promote at most", result.stderr)
            self.assertNotIn("ADAPTATION_CHECK_OK", result.stdout)

    def test_the_most_pictures_the_run_allows_still_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            photos = [adaptation_photo(n) for n in range(1, 25)]
            root = lesson_folder(Path(tmp), adaptation_text(photos))
            result = run_check(root)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(result.stdout.strip().splitlines()[-1], "ADAPTATION_CHECK_OK 24")

    def test_a_file_that_is_not_the_adaptation_document_is_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = lesson_folder(Path(tmp), "# Notes\n\nWorking notes only.\n")
            result = run_check(root)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("not the adaptation document", result.stderr)

    def test_a_missing_adaptation_is_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = lesson_folder(Path(tmp), None)
            result = run_check(root)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("no adaptation.md", result.stderr)


class TheDesignerIsToldWhichCheckIsItsOwn(unittest.TestCase):
    ROLE = (AGENTS / "adaptation-designer.md").read_text(encoding="utf-8")

    def test_the_role_file_names_the_command_and_its_marker(self):
        self.assertIn("photo-contract.py\" check-adaptation", self.ROLE)
        self.assertIn("ADAPTATION_CHECK_OK", self.ROLE)

    def test_the_picture_limits_it_is_told_are_the_ones_the_check_holds(self):
        """16 is the lesson's aim and 24 the run's most (the teacher, 16 October 2026).

        The role file once called 16 the run's ceiling, and promised a count of
        places left that no launch has carried since August, so an adaptation
        that truly needed a 17th picture could cut it. The numbers it reads now
        come from the cap the check runs.
        """
        cap = load_module(ROOT / "scripts" / "check-photo-cap.py", "adaptation_check_cap")
        flat = " ".join(self.ROLE.split())
        self.assertIn(f"A lesson aims for {cap.MAX_PHOTOS} required Image Team picture requests at most", flat)
        self.assertIn(f"up to {cap.RUN_MAX_PHOTOS} in all and never further", flat)
        self.assertIn(f"`check-adaptation` refuses a run over {cap.RUN_MAX_PHOTOS}", flat)

    def test_the_role_file_says_the_merge_is_not_its_to_run(self):
        flat = " ".join(self.ROLE.split())
        self.assertIn("`photo-contract.py build-provisional` is not yours to run", flat)


def written_launches(text: str) -> dict[str, str]:
    """Every launch the playbook writes out, keyed by the role file it names."""
    launches = {}
    for block in re.findall(r"```text\n(You are the .*?)```", text, re.S):
        role = re.search(r"agents/([a-z-]+)\.md", block)
        assert role, block[:80]
        launches[role.group(1)] = block
    return launches


class EveryWrittenLaunchFinishesOnACheckThatExists(unittest.TestCase):
    TEXT = PLAYBOOK.read_text(encoding="utf-8")
    LAUNCHES = written_launches(TEXT)

    def adaptation_step(self) -> str:
        start = self.TEXT.index("**Adaptation Designer**")
        return self.TEXT[start:self.TEXT.index("**The voice editor's second pass**", start)]

    def test_the_adaptation_step_names_the_designer_s_check(self):
        step = self.adaptation_step()
        self.assertIn("SUCCESS_CHECK:", step)
        check = step.split("SUCCESS_CHECK:", 1)[1]
        self.assertIn('photo-contract.py" check-adaptation --working-dir "[WORKING_DIR]"', check)
        self.assertIn("ADAPTATION_CHECK_OK", check)

    def test_a_revision_of_the_adaptation_finishes_on_the_same_check(self):
        flat = " ".join(self.adaptation_step().split())
        self.assertIn("Its launch, and any bounded revision of `adaptation.md`, carries:", flat)

    def test_the_merge_stays_the_orchestrator_s(self):
        flat = " ".join(self.adaptation_step().split())
        self.assertIn("That check writes nothing; `build-provisional` below stays yours.", flat)

    def test_every_launch_with_a_check_requires_markers_something_prints(self):
        """A `SUCCESS_CHECK` may name its command or leave it to the role file.

        Either way each marker it requires must be printed by a command in the
        plugin, and where the check is left to the role ("named by your role"),
        the role file must name every one of those markers itself.
        """
        printers = "\n".join(
            path.read_text(encoding="utf-8", errors="replace")
            for folder in ("scripts", "builder/scripts", "worksheet-html/scripts")
            for path in (ROOT / folder).glob("*")
            if path.suffix in {".py", ".js"}
        )
        checked = 0
        for role, launch in self.LAUNCHES.items():
            if "SUCCESS_CHECK" not in launch:
                continue
            check = re.split(r"SUCCESS_CHECK[^\n]*\n", launch, maxsplit=1)[1]
            check = check.split("TERMINAL_STATE", 1)[0].split("ALLOWED_TERMINAL_STATES", 1)[0]
            markers = set(re.findall(r"\b[A-Z][A-Z_]+_OK\b", check))
            with self.subTest(role=role):
                self.assertTrue(markers, f"{role}: its SUCCESS_CHECK requires no marker")
                for marker in markers:
                    self.assertIn(marker, printers, f"{role}: nothing prints {marker}")
                if "named by your role" in " ".join(check.split()):
                    role_text = (AGENTS / f"{role}.md").read_text(encoding="utf-8")
                    for marker in markers:
                        self.assertIn(marker, role_text, f"{role}.md never names {marker}")
            checked += 1
        self.assertGreaterEqual(checked, 5)


if __name__ == "__main__":
    unittest.main()
