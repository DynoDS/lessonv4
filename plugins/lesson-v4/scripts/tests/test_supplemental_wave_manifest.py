from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COMPILE = ROOT / "compile-picture-assignments.py"
VALIDATE = ROOT / "validate-image-scout.py"
PLAYBOOK = ROOT.parent / "skills" / "make-lesson" / "playbook-lite.md"


def photo(index: int, filename: str) -> dict:
    return {
        "id": f"photo-{index:03d}",
        "subject": f"subject for {filename}",
        "pedagogical_constraint": "show the feature clearly",
        "teaching_requirement": "pupils identify the visible feature",
        "load_bearing_evidence": ["the visible feature"],
        "use": "worksheet",
        "essential": False,
        "filename": filename,
        "acquisition_mode": "ordinary-real",
        "source_profile": "unsplash-then-wikimedia",
        "fallback_action": "omit",
        "fallback_note": None,
        "generation_prompt": None,
        "coherent_group": None,
        "coherent_mode": "none",
        "coherent_visual_invariants": [],
    }


class SupplementalWaveManifestTests(unittest.TestCase):
    """An adaptation's pictures were compiled but could never be validated.

    On 1 September 2026 a Year 4 PSHE run promoted two Below-worksheet
    photographs, compiled them correctly against the merged snapshot with
    `--expected-filename`, and then lost both to
    `PICTURE_RESULT_INVALID: manifest batch count does not match deterministic
    partition`. The compile side could narrow a snapshot to the filenames one
    wave owns; the validator could not, and always re-derived the partition of
    the whole contract. Every supplemental wave was therefore unvalidatable,
    and every adaptation picture in every lesson was promised to a worksheet
    and never sourced. The Below sheet was omitted.

    The two sides now share one selector, so they cannot disagree.
    """

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.snapshot = self.root / "photo-requirements-w-1.json"
        # Four already-finished Phase 2 pictures plus the two an adaptation
        # promoted later: the shape `promote-used` actually writes.
        self.finished = [f"generated/phase2-{n}.jpg" for n in range(1, 5)]
        self.promoted = ["generated/adaptation-a.jpg", "generated/adaptation-b.jpg"]
        photos = [
            photo(index, filename)
            for index, filename in enumerate(self.finished + self.promoted, 1)
        ]
        self.snapshot.write_text(
            json.dumps(
                {"schema_version": 2, "lesson_name": "test lesson", "photos": photos},
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        self.output = self.root / "picture-assignments" / "w-1"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def compile_wave(self, filenames: list[str]) -> subprocess.CompletedProcess:
        command = [
            sys.executable, str(COMPILE), "compile",
            "--requirements", str(self.snapshot),
            "--expected-prefix", "w",
            "--output-dir", str(self.output),
            "--working-dir", str(self.root),
            "--summary-output", str(self.root / "w-1-summary.json"),
        ]
        for filename in filenames:
            command += ["--expected-filename", filename]
        return subprocess.run(command, capture_output=True, text=True)

    def validate_manifest(self, filenames: list[str]) -> subprocess.CompletedProcess:
        command = [
            sys.executable, str(VALIDATE), "manifest",
            "--requirements", str(self.snapshot),
            "--manifest", str(self.output / "manifest.json"),
            "--working-dir", str(self.root),
            "--expected-prefix", "w",
        ]
        for filename in filenames:
            command += ["--expected-filename", filename]
        return subprocess.run(command, capture_output=True, text=True)

    def test_a_wave_that_owns_part_of_the_snapshot_validates(self) -> None:
        compiled = self.compile_wave(self.promoted)
        self.assertEqual(compiled.returncode, 0, compiled.stderr)
        self.assertIn("PICTURE_ASSIGNMENTS_OK", compiled.stdout)

        validated = self.validate_manifest(self.promoted)
        self.assertEqual(validated.returncode, 0, validated.stderr)
        self.assertIn("PICTURE_MANIFEST_OK", validated.stdout)

    def test_the_filter_still_holds_the_manifest_to_what_it_claimed(self) -> None:
        """Discrimination: naming a different set must not pass.

        A filter that accepted any subset would replace one silent failure with
        a silent hole - a wave could quietly drop a promoted picture and still
        report `PICTURE_MANIFEST_OK`.
        """
        self.assertEqual(self.compile_wave(self.promoted).returncode, 0)

        wrong_set = self.validate_manifest([self.promoted[0], self.finished[0]])
        self.assertEqual(wrong_set.returncode, 1)
        self.assertIn("PICTURE_RESULT_INVALID", wrong_set.stderr)

        too_few = self.validate_manifest([self.promoted[0]])
        self.assertEqual(too_few.returncode, 1)
        self.assertIn("PICTURE_RESULT_INVALID", too_few.stderr)

        whole_contract = self.validate_manifest([])
        self.assertEqual(whole_contract.returncode, 1)
        self.assertIn("PICTURE_RESULT_INVALID", whole_contract.stderr)

    def test_a_named_filename_must_exist_in_the_snapshot(self) -> None:
        self.assertEqual(self.compile_wave(self.promoted).returncode, 0)
        unknown = self.validate_manifest(self.promoted + ["generated/not-here.jpg"])
        self.assertEqual(unknown.returncode, 1)
        self.assertIn("do not contain expected filename", unknown.stderr)

    def test_a_whole_contract_wave_still_needs_no_filter(self) -> None:
        """Phase 2 names nothing and is measured against everything."""
        whole = self.root / "picture-assignments" / "p"
        summary = self.root / "p-summary.json"
        compiled = subprocess.run(
            [
                sys.executable, str(COMPILE), "compile",
                "--requirements", str(self.snapshot),
                "--expected-prefix", "p",
                "--output-dir", str(whole),
                "--working-dir", str(self.root),
                "--summary-output", str(summary),
            ],
            capture_output=True, text=True,
        )
        self.assertEqual(compiled.returncode, 0, compiled.stderr)
        validated = subprocess.run(
            [
                sys.executable, str(VALIDATE), "manifest",
                "--requirements", str(self.snapshot),
                "--manifest", str(whole / "manifest.json"),
                "--working-dir", str(self.root),
                "--expected-prefix", "p",
            ],
            capture_output=True, text=True,
        )
        self.assertEqual(validated.returncode, 0, validated.stderr)
        self.assertIn("PICTURE_MANIFEST_OK", validated.stdout)

    def test_the_playbook_hands_the_wave_the_filename_list_twice(self) -> None:
        """The compile command always carried the list; the validation command
        was left as prose, so the orchestrator had to invent its arguments and
        the one argument that mattered was the one it could not guess."""
        playbook = " ".join(PLAYBOOK.read_text(encoding="utf-8").split())
        wave = playbook[playbook.index("The supplemental picture wave"):]
        wave = wave[: wave.index("Track B trigger")]
        self.assertIn("validate-image-scout.py\" manifest", wave)
        self.assertIn("the same --expected-filename lines the compile used", wave)


if __name__ == "__main__":
    unittest.main()
