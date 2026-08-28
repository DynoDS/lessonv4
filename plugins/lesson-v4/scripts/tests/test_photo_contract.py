from __future__ import annotations

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "photo-contract.py"
spec = importlib.util.spec_from_file_location("photo_contract", SCRIPT)
assert spec and spec.loader
photo_contract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(photo_contract)


def photo(photo_id="photo-001", filename="unsplash/one.jpg"):
    return {"id": photo_id, "filename": filename, "subject": "subject"}


def full_photo(photo_id="adaptation-photo-001", filename="adaptation/one.jpg"):
    return {
        "id": photo_id, "subject": "subject", "pedagogical_constraint": "show it",
        "teaching_requirement": "identify it", "load_bearing_evidence": ["the feature"],
        "use": "slide", "essential": True, "filename": filename,
        "acquisition_mode": "ordinary-real", "source_profile": "unsplash-only",
        "fallback_action": "ai", "fallback_note": None,
        "generation_prompt": {
            "physical_state": "the subject shown whole and unobstructed",
            "must_avoid": ["a second subject"],
            "text_rule": "no readable text, labels, logos or branding",
            "composition": "the whole subject in one clear frame",
        },
        "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": [],
    }


class PhotoContractTests(unittest.TestCase):
    def test_schema_two_is_required_for_initial_freeze(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); canonical = root / "photo-requirements.json"; snapshot = root / "snapshot.json"; receipt = root / "receipt.json"
            data = {"schema_version": 2, "lesson_name": "lesson", "photos": [photo()]}
            canonical.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            args = type("Args", (), {"canonical": str(canonical), "snapshot": str(snapshot), "receipt": str(receipt)})()
            self.assertEqual(photo_contract.cmd_freeze_initial(args), 0)
            self.assertEqual(snapshot.read_bytes(), canonical.read_bytes())
            self.assertEqual(json.loads(receipt.read_text())["sha256"], hashlib.sha256(canonical.read_bytes()).hexdigest())

    def test_initial_freeze_refuses_different_existing_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); canonical = root / "canonical.json"; snapshot = root / "snapshot.json"
            canonical.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": []}), encoding="utf-8")
            snapshot.write_text("different", encoding="utf-8")
            with self.assertRaises(photo_contract.PhotoContractError):
                photo_contract.cmd_freeze_initial(type("Args", (), {"canonical": str(canonical), "snapshot": str(snapshot), "receipt": str(root / "receipt")})())

    def test_merge_reuses_identical_id_and_rejects_conflicts(self):
        base = {"schema_version": 2, "lesson_name": "lesson", "photos": [photo()]}
        merged, ids, names = photo_contract.merge_photos(base, [photo()])
        self.assertEqual(ids, [])
        self.assertEqual(names, [])
        self.assertEqual(len(merged["photos"]), 1)
        with self.assertRaises(photo_contract.PhotoContractError):
            photo_contract.merge_photos(base, [photo("photo-001", "unsplash/other.jpg")])
        with self.assertRaises(photo_contract.PhotoContractError):
            photo_contract.merge_photos(base, [photo("adaptation-photo-001", "unsplash/one.jpg")])

    def test_adaptation_ids_are_sequential_and_schema_two(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "adaptation.md"
            block = {"schema_version": 2, "lesson_name": "lesson", "photos": [full_photo()]}
            path.write_text("Photos for the sheets\n```json\n" + json.dumps(block) + "\n```\n", encoding="utf-8")
            self.assertEqual(photo_contract.adaptation_photos(path)[0]["id"], "adaptation-photo-001")

    def freeze(self, root, photos=()):
        """Freeze an initial contract exactly the way the playbook freezes it."""
        canonical = root / "photo-requirements.json"
        canonical.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": list(photos)}, indent=2) + "\n", encoding="utf-8")
        args = type("Args", (), {
            "canonical": str(canonical),
            "snapshot": str(root / "phase2-initial-photo-requirements.json"),
            "receipt": str(root / "phase2-initial-photo-requirements.receipt.json"),
        })()
        photo_contract.cmd_freeze_initial(args)
        return canonical

    def select(self, root, adaptation_accepted=False):
        args = type("Args", (), {
            "working_dir": str(root),
            "adaptation_accepted": adaptation_accepted,
            "summary_output": None,
        })()
        return photo_contract.cmd_select_worksheet(args)

    def test_worksheet_gate_finds_the_contract_the_playbook_actually_froze(self):
        """The worksheet gate must read the snapshot the freeze step wrote.

        The gate used to look inside a retired orchestration directory the live
        route never writes to, so every ordinary lesson - no adaptation, no
        supplemental wave - was blocked at the worksheet stage by a contract
        that was sitting in the working directory all along.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.freeze(root)
            self.assertEqual(self.select(root), 0)

    def test_worksheet_gate_rejects_a_snapshot_edited_after_the_freeze(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.freeze(root)
            snapshot = root / "phase2-initial-photo-requirements.json"
            snapshot.write_text(json.dumps({"schema_version": 2, "lesson_name": "edited", "photos": []}), encoding="utf-8")
            with self.assertRaises(photo_contract.PhotoContractError):
                self.select(root)

    def test_provisional_contract_is_read_from_the_path_its_receipt_records(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.freeze(root)
            adaptation = root / "adaptation.md"
            block = {"schema_version": 2, "lesson_name": "lesson", "photos": [full_photo()]}
            adaptation.write_text("Photos for the sheets\n```json\n" + json.dumps(block) + "\n```\n", encoding="utf-8")
            provisional = root / "adaptation-photo-provisional.json"
            receipts = root / "orchestration-receipts"
            receipts.mkdir(parents=True, exist_ok=True)
            args = type("Args", (), {
                "initial": str(root / "phase2-initial-photo-requirements.json"),
                "adaptation": str(adaptation),
                "output": str(provisional),
                "lesson_design": None,
                "receipt": str(receipts / "adaptation-photo-provisional.json"),
            })()
            self.assertEqual(photo_contract.cmd_build_provisional(args), 0)
            self.assertEqual(self.select(root, adaptation_accepted=True), 0)

    def test_promote_used_cannot_write_a_receipt_its_own_consumer_refuses(self):
        """The supplemental snapshot is not optional paperwork.

        `choose_latest_supplemental` refuses a receipt that names no immutable
        snapshot and never falls back to an earlier wave, so a promote without
        one leaves the next worksheet gate permanently stale.
        """
        parser = photo_contract.parser()
        with self.assertRaises(SystemExit):
            parser.parse_args([
                "promote-used", "--initial", "i.json", "--provisional", "p.json",
                "--adaptation", "a.md", "--worksheet", "w.json",
                "--canonical", "c.json", "--receipt", "r.json",
            ])

    def test_playbook_and_gate_name_the_same_freeze_receipt(self):
        """The gate reads one receipt path; the playbook writes one receipt path.

        The reported failure was a gate looking where the run had not written.
        Resolving the snapshot through the receipt fixed that, but only while
        both sides still agree on where the receipt itself lives, and that
        agreement is spelled out in two files.
        """
        playbook = (ROOT.parent / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        gate = (ROOT / "photo-contract.py").read_text(encoding="utf-8")
        receipt_name = "phase2-initial-photo-requirements.receipt.json"
        self.assertIn(f'working / "{receipt_name}"', gate)
        self.assertIn(f'--receipt "[WORKING_DIR]/{receipt_name}"', playbook)

    def test_latest_supplemental_snapshot_is_selected_from_valid_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); snapshot = root / "snapshot.json"; snapshot.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": []}), encoding="utf-8")
            receipt = root / "photo-requirements-w-002.json"
            receipt.write_text(json.dumps({"schemaVersion": 1, "requirementsSnapshot": str(snapshot), "requirementsSnapshotSha256": hashlib.sha256(snapshot.read_bytes()).hexdigest()}), encoding="utf-8")
            self.assertEqual(photo_contract.choose_latest_supplemental(root), snapshot)


if __name__ == "__main__":
    unittest.main()
