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
        "fallback_action": "omit", "fallback_note": None, "generation_prompt": None,
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

    def test_latest_supplemental_snapshot_is_selected_from_valid_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); snapshot = root / "snapshot.json"; snapshot.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": []}), encoding="utf-8")
            receipt = root / "photo-requirements-w-002.json"
            receipt.write_text(json.dumps({"schemaVersion": 1, "requirementsSnapshot": str(snapshot), "requirementsSnapshotSha256": hashlib.sha256(snapshot.read_bytes()).hexdigest()}), encoding="utf-8")
            self.assertEqual(photo_contract.choose_latest_supplemental(root), snapshot)


if __name__ == "__main__":
    unittest.main()
