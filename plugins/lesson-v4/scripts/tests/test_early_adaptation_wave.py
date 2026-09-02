"""The early adaptation picture wave: sourced beside the sheet, accounted for after.

The Adaptation Designer names every picture its Below and Greater Depth sheets
could want; the Worksheet Designer then takes ten minutes or more to decide
which the sheet keeps. Sourcing used to wait for that answer, which put a four
to nine minute picture search on the end of the worksheet chain in every run
that had adaptation pictures. The wave now starts beside the Worksheet
Designer, against an immutable copy of the provisional contract, and a picture
the sheet then drops is kept as evidence, removed as a file, and reported as
the cost it was.

These tests hold the four pieces to that: the snapshot build-provisional
writes, the promotion receipt saying which promoted pictures still need
sourcing, the compiler taking the early wave's prefix and the run ceiling, and
provenance telling an unused early picture from stray evidence.
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
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
PLAYBOOK = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")


def load(name: str):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


contract_module = load("photo-contract")
compiler = load("compile-picture-assignments")
finalizer = load("finalize-picture-assignment")


def photo(photo_id: str, filename: str) -> dict:
    return {
        "id": photo_id,
        "subject": f"subject of {filename}",
        "pedagogical_constraint": "show the feature",
        "teaching_requirement": "identify the feature",
        "load_bearing_evidence": ["the visible feature"],
        "use": "worksheet",
        "essential": True,
        "filename": filename,
        "acquisition_mode": "controlled-ai",
        "source_profile": "none",
        "fallback_action": "omit",
        "fallback_note": None,
        "generation_prompt": {
            "physical_state": "the subject shown whole and unobstructed",
            "must_avoid": ["a second subject"],
            "text_rule": "no readable text, labels, logos or branding",
            "composition": "the whole subject in one clear frame",
        },
        "coherent_group": None,
        "coherent_mode": "none",
        "coherent_visual_invariants": [],
    }


def contract(photos: list[dict]) -> dict:
    return {"schema_version": 2, "lesson_name": "lesson", "photos": photos}


def write_json(path: Path, payload) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def receipt_for(working: Path, filename: str, snapshot: Path, state: str, canonical: Path | None = None) -> Path:
    provenance = {"kind": "none"}
    if canonical is not None:
        # A published picture proves where it came from; a generated one does
        # so through its immutable AI ledger.
        ledger = write_json(working / "unsplash" / "_ai-ledger" / (filename.replace("/", "-") + ".json"), {"calls": [{"consumed": True}]})
        provenance = {"kind": "generated", "ledgerPath": str(ledger.resolve()), "ledgerSha256": digest(ledger)}
    payload = {
        "schemaVersion": 2,
        "filename": filename,
        "terminalState": state,
        "requirements": {"path": str(snapshot.resolve()), "sha256": digest(snapshot)},
        "publication": {
            "canonicalPath": str(canonical.resolve()) if canonical else None,
            "canonicalSha256": digest(canonical) if canonical else None,
        },
        "provenance": provenance,
        "terminalReason": None if canonical else "optional_omission",
    }
    path = working / "orchestration-receipts" / "picture-terminal" / (hashlib.sha256(filename.encode()).hexdigest() + ".json")
    return write_json(path, payload)


ADAPTATION_MD = """# Adaptation

## Below

Fewer numbers.

## Greater Depth

Harder numbers.

## Photos for the sheets

```json
{json}
```
"""


class ProvisionalSnapshotTests(unittest.TestCase):
    def build(self, root: Path, photos: list[dict], snapshot: Path | None):
        initial = write_json(root / "initial.json", contract([photo("photo-001", "generated/one.png")]))
        adaptation = root / "adaptation.md"
        adaptation.write_text(ADAPTATION_MD.replace("{json}", json.dumps(contract(photos))), encoding="utf-8")
        args = SimpleNamespace(
            initial=str(initial), adaptation=str(adaptation), output=str(root / "provisional.json"),
            lesson_design=None, receipt=str(root / "receipt.json"),
            requirements_snapshot=str(snapshot) if snapshot else None,
        )
        self.assertEqual(contract_module.cmd_build_provisional(args), 0)
        return json.loads((root / "receipt.json").read_text(encoding="utf-8"))

    def test_the_snapshot_is_an_immutable_copy_named_in_the_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot = root / "photo-requirements-a-1.json"
            receipt = self.build(root, [photo("adaptation-photo-001", "generated/below.png")], snapshot)
            self.assertEqual(snapshot.read_bytes(), (root / "provisional.json").read_bytes())
            self.assertEqual(receipt["requirementsSnapshot"], str(snapshot.resolve()))
            self.assertEqual(receipt["requirementsSnapshotSha256"], digest(snapshot))
            self.assertEqual(receipt["adaptationFilenames"], ["generated/below.png"])

    def test_a_snapshot_with_different_bytes_is_refused_not_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot = root / "photo-requirements-a-1.json"
            self.build(root, [photo("adaptation-photo-001", "generated/below.png")], snapshot)
            before = snapshot.read_bytes()
            with self.assertRaises(contract_module.PhotoContractError):
                self.build(root, [photo("adaptation-photo-001", "generated/other.png")], snapshot)
            self.assertEqual(snapshot.read_bytes(), before)

    def test_without_a_snapshot_the_receipt_is_as_it_always_was(self):
        with tempfile.TemporaryDirectory() as tmp:
            receipt = self.build(Path(tmp), [photo("adaptation-photo-001", "generated/below.png")], None)
            self.assertNotIn("requirementsSnapshot", receipt)


class PromotionPendingTests(unittest.TestCase):
    def promote(self, working: Path, worksheet: dict, adaptation_photos: list[dict]) -> tuple[dict, str]:
        base = [photo("photo-001", "generated/one.png")]
        initial = write_json(working / "phase2-initial-photo-requirements.json", contract(base))
        provisional = write_json(working / "adaptation-photo-provisional.json", contract(base + adaptation_photos))
        adaptation = working / "adaptation.md"
        adaptation.write_text(ADAPTATION_MD.replace("{json}", json.dumps(contract(adaptation_photos))), encoding="utf-8")
        sheet = write_json(working / "worksheet.json", worksheet)
        result = subprocess.run(
            [
                sys.executable, str(SCRIPTS / "photo-contract.py"), "promote-used",
                "--initial", str(initial), "--provisional", str(provisional), "--adaptation", str(adaptation),
                "--worksheet", str(sheet), "--canonical", str(working / "photo-requirements.json"),
                "--requirements-snapshot", str(working / "photo-requirements-w-1.json"),
                "--receipt", str(working / "orchestration-receipts" / "photo-requirements-w-1.json"),
            ],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        receipt = json.loads((working / "orchestration-receipts" / "photo-requirements-w-1.json").read_text(encoding="utf-8"))
        return receipt, result.stdout

    def test_a_promoted_picture_the_early_wave_finished_is_not_pending(self):
        with tempfile.TemporaryDirectory() as tmp:
            working = Path(tmp)
            photos = [photo("adaptation-photo-001", "generated/below.png"), photo("adaptation-photo-002", "generated/depth.png")]
            snapshot = write_json(working / "photo-requirements-a-1.json", contract([photo("photo-001", "generated/one.png")] + photos))
            receipt_for(working, "generated/below.png", snapshot, "omitted")
            worksheet = {"sheets": {"below": {"imagePath": "generated/below.png"}, "greaterDepth": {"imagePath": "generated/depth.png"}}}
            receipt, stdout = self.promote(working, worksheet, photos)
            self.assertEqual(receipt["newFilenames"], ["generated/below.png", "generated/depth.png"])
            self.assertEqual(receipt["terminalFilenames"], ["generated/below.png"])
            self.assertEqual(receipt["pendingFilenames"], ["generated/depth.png"])
            self.assertIn("PHOTO_CONTRACT_PROMOTED 2", stdout)
            self.assertIn("PHOTO_CONTRACT_PENDING_PICTURES 1", stdout)

    def test_a_failed_publication_is_still_pending(self):
        with tempfile.TemporaryDirectory() as tmp:
            working = Path(tmp)
            photos = [photo("adaptation-photo-001", "generated/below.png")]
            snapshot = write_json(working / "photo-requirements-a-1.json", contract(photos))
            receipt_for(working, "generated/below.png", snapshot, "picture_publish_failed")
            receipt, stdout = self.promote(working, {"sheets": {"below": {"imagePath": "generated/below.png"}}}, photos)
            self.assertEqual(receipt["pendingFilenames"], ["generated/below.png"])
            self.assertIn("PHOTO_CONTRACT_PENDING_PICTURES 1", stdout)


class CompilerEarlyWaveTests(unittest.TestCase):
    def compile(self, root: Path, photos: list[dict], prefix: str, filenames: list[str]) -> subprocess.CompletedProcess:
        requirements = write_json(root / "snapshot.json", contract(photos))
        command = [
            sys.executable, str(SCRIPTS / "compile-picture-assignments.py"), "compile",
            "--requirements", str(requirements), "--expected-prefix", prefix,
            "--output-dir", str(root / "assignments"), "--working-dir", str(root),
            "--summary-output", str(root / "summary.json"),
        ]
        for name in filenames:
            command.extend(["--expected-filename", name])
        return subprocess.run(command, capture_output=True, text=True)

    def test_the_early_wave_compiles_only_the_adaptation_pictures(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            photos = [
                photo("photo-001", "generated/one.png"),
                photo("adaptation-photo-001", "generated/below.png"),
                photo("adaptation-photo-002", "generated/depth.png"),
            ]
            result = self.compile(root, photos, "a", ["generated/below.png", "generated/depth.png"])
            self.assertEqual(result.returncode, 0, result.stderr)
            manifest = json.loads((root / "assignments" / "manifest.json").read_text(encoding="utf-8"))
            owned = [name for row in manifest["assignments"] for name in row["filenames"]]
            self.assertEqual(sorted(owned), ["generated/below.png", "generated/depth.png"])
            self.assertTrue(all(row["batch_id"].startswith("a") for row in manifest["assignments"]))
            check = subprocess.run(
                [
                    sys.executable, str(SCRIPTS / "validate-image-scout.py"), "manifest",
                    "--requirements", str(root / "snapshot.json"), "--manifest", str(root / "assignments" / "manifest.json"),
                    "--working-dir", str(root), "--expected-prefix", "a",
                    "--expected-filename", "generated/below.png", "--expected-filename", "generated/depth.png",
                ],
                capture_output=True, text=True,
            )
            self.assertEqual(check.returncode, 0, check.stderr)
            self.assertIn("PICTURE_MANIFEST_OK", check.stdout)

    def test_a_merged_snapshot_may_carry_the_run_ceiling_not_the_design_budget(self):
        cap = load("check-photo-cap")
        self.assertEqual(compiler.run_ceiling(), cap.RUN_MAX_PHOTOS)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            photos = [photo(f"photo-{n:03d}", f"generated/p{n}.png") for n in range(1, cap.MAX_PHOTOS + 1)]
            photos.append(photo("adaptation-photo-001", "generated/below.png"))
            self.assertGreater(len(photos), cap.MAX_PHOTOS)
            result = self.compile(root, photos, "a", ["generated/below.png"])
            self.assertEqual(result.returncode, 0, result.stderr)
            too_many = [photo(f"photo-{n:03d}", f"generated/p{n}.png") for n in range(1, cap.RUN_MAX_PHOTOS + 2)]
            result = self.compile(Path(tmp) / "over", too_many, "p", [])
            self.assertNotEqual(result.returncode, 0)
            self.assertIn(str(cap.RUN_MAX_PHOTOS), result.stderr)


class ProvenanceEarlyWaveTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.working = Path(self.tmp.name) / "working"
        self.working.mkdir()
        base = photo("photo-001", "generated/one.png")
        self.used = photo("adaptation-photo-001", "generated/below.png")
        self.dropped = photo("adaptation-photo-002", "generated/depth.png")
        self.initial = write_json(self.working / "phase2-initial-photo-requirements.json", contract([base]))
        self.snapshot = write_json(self.working / "photo-requirements-a-1.json", contract([base, self.used, self.dropped]))
        self.final = write_json(self.working / "photo-requirements.json", contract([base, self.used]))
        receipt_for(self.working, "generated/one.png", self.initial, "omitted")
        self.used_file = self.working / "generated" / "below.png"
        self.used_file.parent.mkdir(parents=True)
        self.used_file.write_bytes(b"used picture")
        receipt_for(self.working, "generated/below.png", self.snapshot, "published", self.used_file)
        self.dropped_file = self.working / "generated" / "depth.png"
        self.dropped_file.write_bytes(b"dropped picture")
        self.dropped_receipt = receipt_for(self.working, "generated/depth.png", self.snapshot, "published", self.dropped_file)

    def args(self, early: str | None):
        return SimpleNamespace(
            requirements=str(self.final),
            terminal_receipts_dir=str(self.working / "orchestration-receipts" / "picture-terminal"),
            working_dir=str(self.working),
            output=str(self.working / "picture-provenance.json"),
            summary_output=str(self.working / "picture-provenance-summary.json"),
            early_wave_snapshot=early,
        )

    def test_an_unused_early_picture_is_accounted_for_and_its_file_removed(self):
        import io
        from contextlib import redirect_stdout

        out = io.StringIO()
        with redirect_stdout(out):
            self.assertEqual(finalizer.provenance_command(self.args(str(self.snapshot))), 0)
        self.assertIn("PICTURE_EARLY_WAVE: 2 sourced early, 1 used, 1 unused", out.getvalue())
        self.assertIn("PICTURE_PROVENANCE_OK", out.getvalue())
        payload = json.loads((self.working / "picture-provenance.json").read_text(encoding="utf-8"))
        self.assertEqual([row["filename"] for row in payload["rows"]], ["generated/one.png", "generated/below.png"])
        self.assertEqual(payload["earlyWave"]["used"], ["generated/below.png"])
        self.assertEqual(payload["earlyWave"]["unused"], ["generated/depth.png"])
        self.assertEqual(payload["unusedRows"][0]["canonicalRemoved"], True)
        self.assertFalse(self.dropped_file.exists(), "the unused picture's file should be removed")
        self.assertTrue(self.dropped_receipt.exists(), "its receipt is the licence evidence and stays")
        self.assertTrue(self.used_file.exists())
        summary = json.loads((self.working / "picture-provenance-summary.json").read_text(encoding="utf-8"))
        self.assertEqual(summary["earlyWave"], {"sourcedEarly": 2, "used": 1, "unused": 1})

    def test_without_the_snapshot_the_same_receipt_is_still_stray_evidence(self):
        with self.assertRaises(finalizer.FinalizeError) as caught:
            finalizer.provenance_command(self.args(None))
        self.assertIn("extra terminal evidence", str(caught.exception))
        self.assertTrue(self.dropped_file.exists())

    def test_a_receipt_bound_to_some_other_file_is_not_an_early_picture(self):
        other = write_json(self.working / "elsewhere.json", contract([self.dropped]))
        receipt_for(self.working, "generated/depth.png", other, "published", self.dropped_file)
        with self.assertRaises(finalizer.FinalizeError) as caught:
            finalizer.provenance_command(self.args(str(self.snapshot)))
        self.assertIn("extra terminal evidence", str(caught.exception))

    def test_a_snapshot_outside_the_working_folder_is_refused(self):
        outside = write_json(Path(self.tmp.name) / "outside.json", contract([self.dropped]))
        with self.assertRaises(finalizer.FinalizeError):
            finalizer.provenance_command(self.args(str(outside)))


class PlaybookEarlyWaveTests(unittest.TestCase):
    def section(self, start: str, end: str) -> str:
        parts = PLAYBOOK.split(start, 1)
        self.assertEqual(len(parts), 2, f"playbook lacks {start!r}")
        return parts[1].split(end, 1)[0]

    def test_the_wave_starts_beside_the_worksheet_designer(self):
        wave = self.section("**The early adaptation picture wave**", "**Worksheet Designer**")
        self.assertIn("Launch the Worksheet Designer first", wave)
        self.assertIn("--expected-prefix a", wave)
        self.assertIn("photo-requirements-a-[N].json", wave)
        self.assertIn("adaptationFilenames", wave)
        self.assertIn("four at once", wave)
        self.assertIn("PICTURE_ASSIGNMENTS_OK", wave)
        self.assertIn("PICTURE_MANIFEST_OK", wave)
        self.assertIn("--replace no", wave)
        self.assertIn(
            "**Launch the Worksheet Designer the moment adaptation's provisional contract is\nbuilt (or adaptation is skipped); never hold it for picture work.**",
            PLAYBOOK,
        )

    def test_build_provisional_writes_the_snapshot_the_wave_compiles_from(self):
        adaptation = self.section("Run `photo-contract.py build-provisional`", "Adaptation may add only")
        self.assertIn('--requirements-snapshot "[WORKING_DIR]/photo-requirements-a-[N].json"', adaptation)

    def test_the_supplemental_wave_sources_only_what_is_still_pending(self):
        wave = self.section("**The supplemental picture wave**", "Build worksheets directly")
        self.assertIn("PHOTO_CONTRACT_PENDING_PICTURES", wave)
        self.assertIn("pendingFilenames", wave)
        self.assertNotIn("per newFilenames entry", wave)

    def test_provenance_takes_the_snapshot_and_the_report_carries_the_line(self):
        finalise = self.section("## Phase 3.6", "## Phase 4")
        self.assertIn("--early-wave-snapshot", finalise)
        self.assertIn("PICTURE_EARLY_WAVE:", finalise)
        report = self.section("## Phase 4", "### Report format")
        self.assertIn("PICTURE_EARLY_WAVE:", report)


if __name__ == "__main__":
    unittest.main()
