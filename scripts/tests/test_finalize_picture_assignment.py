from __future__ import annotations

import hashlib
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "finalize-picture-assignment.py"
spec = importlib.util.spec_from_file_location("picture_finalizer", SCRIPT)
assert spec and spec.loader
finalizer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(finalizer)


def contract(filename: str) -> dict:
    return {
        "id": "photo-001",
        "subject": "a clear subject",
        "pedagogical_constraint": "show the feature",
        "teaching_requirement": "identify the feature",
        "load_bearing_evidence": ["the visible feature"],
        "use": "slide",
        "essential": True,
        "filename": filename,
        "acquisition_mode": "ordinary-real",
        "source_profile": "unsplash-only",
        "fallback_action": "omit",
        "fallback_note": None,
        "generation_prompt": None,
        "coherent_group": None,
        "coherent_mode": "none",
        "coherent_visual_invariants": [],
    }


class FinalizePictureAssignmentTests(unittest.TestCase):
    def test_provenance_compiles_one_independent_terminal_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); working = root / "working"; working.mkdir()
            requirements = working / "photo-requirements.json"
            requirements.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": [contract("unsplash/one.jpg")]}) + "\n", encoding="utf-8")
            receipt_dir = working / "orchestration-receipts" / "picture-terminal"; receipt_dir.mkdir(parents=True)
            filename = "unsplash/one.jpg"; receipt_path = receipt_dir / (hashlib.sha256(filename.encode()).hexdigest() + ".json")
            receipt_path.write_text(json.dumps({
                "schemaVersion": 2, "filename": filename, "terminalState": "omitted",
                "requirements": {"path": str(requirements.resolve()), "sha256": hashlib.sha256(requirements.read_bytes()).hexdigest()},
                "publication": {"canonicalPath": None, "canonicalSha256": None},
                "provenance": {"kind": "none"}, "terminalReason": "optional_omission",
            }) + "\n", encoding="utf-8")
            args = type("Args", (), {"requirements": str(requirements), "terminal_receipts_dir": str(receipt_dir), "working_dir": str(working), "output": str(root / "provenance.json"), "summary_output": str(root / "summary.json")})()
            self.assertEqual(finalizer.provenance_command(args), 0)
            payload = json.loads((root / "provenance.json").read_text())
            self.assertEqual(payload["schema_version"], 2)
            self.assertEqual(payload["rows"][0]["terminalState"], "omitted")

    def test_provenance_rejects_receipt_bound_to_changed_requirements(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); requirements = root / "requirements.json"
            requirements.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": [contract("one.jpg")]}) + "\n", encoding="utf-8")
            receipt_dir = root / "receipts"; receipt_dir.mkdir()
            filename = "one.jpg"; path = receipt_dir / (hashlib.sha256(filename.encode()).hexdigest() + ".json")
            path.write_text(json.dumps({"schemaVersion": 2, "filename": filename, "requirements": {"path": str(requirements), "sha256": "stale"}, "terminalState": "omitted", "publication": {}, "provenance": {"kind": "none"}}), encoding="utf-8")
            args = type("Args", (), {"requirements": str(requirements), "terminal_receipts_dir": str(receipt_dir), "working_dir": str(root), "output": str(root / "out.json"), "summary_output": str(root / "summary.json")})()
            with self.assertRaises(finalizer.FinalizeError):
                finalizer.provenance_command(args)

    def test_receipt_path_is_independent_per_filename(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            a = finalizer.receipt_path(root, "unsplash/a.jpg")
            b = finalizer.receipt_path(root, "unsplash/b.jpg")
            self.assertNotEqual(a, b)
            self.assertTrue(a.name.endswith(".json"))


class FinalizerLifecycleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"
        self.working.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def make_photo(self, filename, photo_id):
        item = contract(filename)
        item["id"] = photo_id
        return item

    def make_assignment(self, names=("unsplash/a.jpg",), repair=None):
        photos = [self.make_photo(name, f"photo-{index:03d}") for index, name in enumerate(names, 1)]
        req = self.working / "photo-requirements.json"
        req.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": photos}) + "\n", encoding="utf-8")
        batch = self.root / "batch"; batch.mkdir(exist_ok=True)
        entries = [{"filename": name, "ai_ledger_path": None} for name in names]
        assignment = {"schema_version": 2, "kind": "image", "batch_id": "p1", "requirements": {"path": str(req.resolve()), "sha256": hashlib.sha256(req.read_bytes()).hexdigest()}, "work_root": str(batch.resolve()), "entries": entries}
        if repair is not None: assignment["repair"] = repair
        path = self.root / ("repair-assignment.json" if repair else "assignment.json")
        path.write_text(json.dumps(assignment) + "\n", encoding="utf-8")
        return req, assignment, path, photos

    def source_row(self, filename, source="unsplash"):
        path = self.working / "unsplash" / "_picture-work" / f"{filename.replace('/', '_')}.png"; path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(b"real-image-bytes")
        summary = self.root / "batch" / f"{filename.replace('/', '_')}-summary.json"
        candidate = {"candidate_id": f"candidate-{filename}", "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "byte_count": path.stat().st_size, "width": 1, "height": 1, "decoded_format": "PNG", "source": source, "source_page_url": "https://unsplash.com/photos/example", "creator": "Creator", "licence_name": "Unsplash License", "licence_url": "https://unsplash.com/license", "description": "subject", "path": str(path)}
        summary.write_text(json.dumps({"query": "subject", "source": source, "round": 1, "complete": True, "requested_count": 3, "results": [candidate]}) + "\n", encoding="utf-8")
        return {"summary_path": str(summary), "candidate_id": candidate["candidate_id"]}

    def args(self, assignment, assignment_path, result_path, summary_path):
        return SimpleNamespace(assignment=str(assignment_path), result=str(result_path), working_dir=str(self.working), work_root=assignment["work_root"], expected_batch_id="p1", expected_filename=[row["filename"] for row in assignment["entries"]], replace="no", summary_output=str(summary_path))

    def publish_copy(self, calls, fail=()):
        def publish(script_dir, working, source, filename, replace):
            calls.append(filename)
            if filename in fail:
                return False, "publish", 1
            destination = working / filename; destination.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(source, destination)
            return True, "publish", 0
        return publish

    def run_assignment(self, assignment, assignment_path, rows, replace="no", publisher=None, summary_name="summary.json"):
        result_path = self.root / f"{summary_name}.result.json"
        result_path.write_text(json.dumps({"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": rows}) + "\n", encoding="utf-8")
        summary_path = self.root / summary_name
        args = self.args(assignment, assignment_path, result_path, summary_path); args.replace = replace
        with mock.patch.object(finalizer, "run_validator", return_value=([], "PICTURE_RESULT_OK")):
            if publisher is None:
                return finalizer.assignment_command(args), args, summary_path
            with mock.patch.object(finalizer, "publish_one", side_effect=publisher):
                return finalizer.assignment_command(args), args, summary_path

    def test_finalizer_summary_matches_controller_command_contract(self):
        req, assignment, path, photos = self.make_assignment()
        rows = [{"filename": photos[0]["filename"], "status": "omitted", "selection": None, "staging_path": None, "reason": "authorised_alternative"}]
        code, _, summary = self.run_assignment(assignment, path, rows)
        self.assertEqual(code, 0)
        data = json.loads(summary.read_text()); self.assertEqual(data["schemaVersion"], 1); self.assertIs(data["ok"], True); self.assertEqual(data["schema_version"], 2)

    def test_whole_result_validation_precedes_any_publication(self):
        req, assignment, path, photos = self.make_assignment()
        rows = [{"filename": photos[0]["filename"], "status": "sourced", "selection": {"summary_path": "bad", "candidate_id": "bad"}, "staging_path": None, "reason": None}]
        calls = []
        result_path = self.root / "bad-result.json"; result_path.write_text(json.dumps({"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": rows}) + "\n")
        args = self.args(assignment, path, result_path, self.root / "summary.json")
        with mock.patch.object(finalizer, "run_validator", side_effect=finalizer.FinalizeError("invalid")), mock.patch.object(finalizer, "publish_one", side_effect=self.publish_copy(calls)):
            with self.assertRaises(finalizer.FinalizeError): finalizer.assignment_command(args)
        self.assertEqual(calls, [])

    def test_mixed_real_and_generated_rows_publish_independently(self):
        req, assignment, path, photos = self.make_assignment(("unsplash/a.jpg", "unsplash/b.jpg"))
        selected = self.source_row(photos[0]["filename"])
        generated = self.root / "batch" / "generated.png"; Image.new("RGB", (10, 10), "white").save(generated)
        ledger = self.root / "ledger.json"; ledger.write_text("{\"schema_version\": 1, \"filename\": \"unsplash/b.jpg\", \"events\": []}\n")
        assignment["entries"][1]["ai_ledger_path"] = str(ledger); path.write_text(json.dumps(assignment) + "\n")
        rows = [{"filename": photos[0]["filename"], "status": "sourced", "selection": selected, "staging_path": None, "reason": None}, {"filename": photos[1]["filename"], "status": "generated", "selection": None, "staging_path": str(generated), "reason": None}]
        calls = []; code, _, _ = self.run_assignment(assignment, path, rows, publisher=self.publish_copy(calls))
        self.assertEqual(code, 0); self.assertEqual(calls, [photos[0]["filename"], photos[1]["filename"]])

    def test_first_publish_failure_returns_failure_receipt(self):
        req, assignment, path, photos = self.make_assignment(("unsplash/a.jpg", "unsplash/b.jpg"))
        rows = []
        for p in photos:
            source = self.root / "batch" / (p["filename"].replace("/", "_") + ".png"); source.write_bytes(b"asset")
            rows.append({"filename": p["filename"], "status": "generated", "selection": None, "staging_path": str(source), "reason": None})
            ledger = self.root / (p["filename"].replace("/", "_") + ".ledger"); ledger.write_text("{}")
            assignment["entries"][photos.index(p)]["ai_ledger_path"] = str(ledger)
        path.write_text(json.dumps(assignment) + "\n"); calls = []
        code, _, summary = self.run_assignment(assignment, path, rows, publisher=self.publish_copy(calls, fail=(photos[1]["filename"],)))
        self.assertEqual(code, 1); data = json.loads(summary.read_text()); self.assertEqual(data["releasedFilenames"], [photos[0]["filename"]]); self.assertEqual(json.loads(finalizer.receipt_path(self.working, photos[1]["filename"]).read_text())["terminalState"], "picture_publish_failed")

    def test_controller_retry_retries_only_failed_publication(self):
        req, assignment, path, photos = self.make_assignment(("unsplash/a.jpg", "unsplash/b.jpg")); rows = []
        for p in photos:
            source = self.root / "batch" / (p["filename"].replace("/", "_") + ".png"); source.write_bytes(b"asset"); ledger = self.root / (p["filename"].replace("/", "_") + ".ledger"); ledger.write_text("{}" ); assignment["entries"][photos.index(p)]["ai_ledger_path"] = str(ledger); rows.append({"filename": p["filename"], "status": "generated", "selection": None, "staging_path": str(source), "reason": None})
        path.write_text(json.dumps(assignment) + "\n"); first_calls = []; self.run_assignment(assignment, path, rows, publisher=self.publish_copy(first_calls, fail=(photos[1]["filename"],)), summary_name="first")
        second_calls = []; code, _, _ = self.run_assignment(assignment, path, rows, publisher=self.publish_copy(second_calls), summary_name="second")
        self.assertEqual(code, 0); self.assertEqual(second_calls, [photos[1]["filename"]])

    def test_failed_publication_receipt_never_releases_filename(self):
        req, assignment, path, photos = self.make_assignment(); source = self.root / "batch" / "one.png"; source.write_bytes(b"asset"); ledger = self.root / "one.ledger"; ledger.write_text("{}"); assignment["entries"][0]["ai_ledger_path"] = str(ledger); path.write_text(json.dumps(assignment) + "\n")
        rows = [{"filename": photos[0]["filename"], "status": "generated", "selection": None, "staging_path": str(source), "reason": None}]; calls = []; code, _, summary = self.run_assignment(assignment, path, rows, publisher=self.publish_copy(calls, fail=(photos[0]["filename"],)))
        self.assertEqual(code, 1); self.assertEqual(json.loads(summary.read_text())["releasedFilenames"], [])

    def test_matching_published_receipt_is_idempotent_only_with_matching_canonical_hash(self):
        req, assignment, path, photos = self.make_assignment(); source = self.root / "batch" / "one.png"; source.write_bytes(b"asset"); ledger = self.root / "one.ledger"; ledger.write_text("{}"); assignment["entries"][0]["ai_ledger_path"] = str(ledger); path.write_text(json.dumps(assignment) + "\n"); rows = [{"filename": photos[0]["filename"], "status": "generated", "selection": None, "staging_path": str(source), "reason": None}]
        calls = []; self.run_assignment(assignment, path, rows, publisher=self.publish_copy(calls), summary_name="first"); second = []; self.run_assignment(assignment, path, rows, publisher=self.publish_copy(second), summary_name="second"); self.assertEqual(second, [])
        (self.working / photos[0]["filename"]).write_bytes(b"stale")
        with self.assertRaises(finalizer.FinalizeError): self.run_assignment(assignment, path, rows, publisher=self.publish_copy([]), summary_name="stale")

    def test_stale_published_receipt_is_rejected(self):
        req, assignment, path, photos = self.make_assignment()
        source = self.root / "batch" / "one.png"
        source.write_bytes(b"asset")
        ledger = self.root / "one.ledger"
        ledger.write_text("{}")
        assignment["entries"][0]["ai_ledger_path"] = str(ledger)
        path.write_text(json.dumps(assignment) + "\n")
        rows = [{"filename": photos[0]["filename"], "status": "generated", "selection": None, "staging_path": str(source), "reason": None}]
        calls = []
        self.run_assignment(assignment, path, rows, publisher=self.publish_copy(calls), summary_name="stale")
        receipt = finalizer.receipt_path(self.working, photos[0]["filename"])
        before = receipt.read_bytes()
        (self.working / photos[0]["filename"]).write_bytes(b"changed-canonical")
        retry_calls = []
        with self.assertRaisesRegex(finalizer.FinalizeError, "published terminal receipt is stale"):
            self.run_assignment(assignment, path, rows, publisher=self.publish_copy(retry_calls), summary_name="stale")
        self.assertEqual(retry_calls, [])
        self.assertEqual(receipt.read_bytes(), before)

    def test_successful_sibling_survives_other_publication_failure_and_retry(self):
        req, assignment, path, photos = self.make_assignment(("unsplash/a.jpg", "unsplash/b.jpg"))
        rows = []
        for index, photo in enumerate(photos):
            source = self.root / "batch" / f"{index}.png"
            source.write_bytes(f"asset-{index}".encode())
            ledger = self.root / f"{index}.ledger"
            ledger.write_text("{}")
            assignment["entries"][index]["ai_ledger_path"] = str(ledger)
            rows.append({"filename": photo["filename"], "status": "generated", "selection": None, "staging_path": str(source), "reason": None})
        path.write_text(json.dumps(assignment) + "\n")
        first_calls = []
        self.run_assignment(assignment, path, rows, publisher=self.publish_copy(first_calls, fail=(photos[1]["filename"],)), summary_name="same")
        sibling = self.working / photos[0]["filename"]
        sibling_bytes = sibling.read_bytes()
        sibling_hash = hashlib.sha256(sibling_bytes).hexdigest()
        sibling_receipt = finalizer.receipt_path(self.working, photos[0]["filename"])
        sibling_receipt_bytes = sibling_receipt.read_bytes()
        second_calls = []
        code, _, summary = self.run_assignment(assignment, path, rows, publisher=self.publish_copy(second_calls), summary_name="same")
        self.assertEqual(code, 0)
        self.assertEqual(second_calls, [photos[1]["filename"]])
        self.assertEqual(sibling.read_bytes(), sibling_bytes)
        self.assertEqual(hashlib.sha256(sibling.read_bytes()).hexdigest(), sibling_hash)
        self.assertEqual(sibling_receipt.read_bytes(), sibling_receipt_bytes)
        target = self.working / photos[1]["filename"]
        target_receipt = finalizer.receipt_path(self.working, photos[1]["filename"])
        target_data = json.loads(target_receipt.read_text())
        self.assertEqual(target_data["terminalState"], "published")
        self.assertEqual(target_data["publication"]["canonicalSha256"], hashlib.sha256(target.read_bytes()).hexdigest())
        self.assertEqual(json.loads(summary.read_text())["releasedFilenames"], [photos[0]["filename"], photos[1]["filename"]])

    def repair_fixture(self):
        req, assignment, path, photos = self.make_assignment(); source = self.root / "batch" / "one.png"; source.write_bytes(b"asset"); ledger = self.root / "one.ledger"; ledger.write_text("{}"); assignment["entries"][0]["ai_ledger_path"] = str(ledger); path.write_text(json.dumps(assignment) + "\n"); rows = [{"filename": photos[0]["filename"], "status": "generated", "selection": None, "staging_path": str(source), "reason": None}]; calls = []; self.run_assignment(assignment, path, rows, publisher=self.publish_copy(calls), summary_name="initial")
        receipt = finalizer.receipt_path(self.working, photos[0]["filename"]); old_hash = hashlib.sha256(receipt.read_bytes()).hexdigest(); (self.working / photos[0]["filename"]).unlink(); repair = {"previous_receipt": str(receipt), "previous_receipt_sha256": old_hash}; repair_assignment = dict(assignment); repair_assignment["repair"] = repair; repair_path = self.root / "repair.json"; repair_path.write_text(json.dumps(repair_assignment) + "\n"); return req, repair_assignment, repair_path, photos, source, rows, receipt, old_hash

    def test_focused_repair_supersedes_exact_previous_receipt(self):
        req, assignment, path, photos, source, rows, receipt, old_hash = self.repair_fixture()
        old_receipt_bytes = receipt.read_bytes()
        repair = assignment["repair"]
        self.assertEqual(Path(repair["previous_receipt"]).resolve(), receipt.resolve())
        self.assertEqual(repair["previous_receipt_sha256"], old_hash)
        calls = []
        def publisher(script_dir, working, staged, filename, replace):
            calls.append((filename, replace))
            destination = working / filename
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(staged, destination)
            return True, "publish", 0
        code, repair_args, _ = self.run_assignment(assignment, path, rows, replace="yes", publisher=publisher, summary_name="repair")
        self.assertEqual(code, 0)
        self.assertEqual(calls, [(photos[0]["filename"], "yes")])
        new_receipt_bytes = receipt.read_bytes()
        self.assertNotEqual(new_receipt_bytes, old_receipt_bytes)
        self.assertNotEqual(hashlib.sha256(new_receipt_bytes).hexdigest(), old_hash)
        new = json.loads(new_receipt_bytes)
        self.assertEqual(new["assignment"]["path"], str(Path(repair_args.assignment).resolve()))
        self.assertEqual(new["assignment"]["sha256"], hashlib.sha256(Path(repair_args.assignment).read_bytes()).hexdigest())
        self.assertEqual(new["result"]["path"], str(Path(repair_args.result).resolve()))
        self.assertEqual(new["result"]["sha256"], hashlib.sha256(Path(repair_args.result).read_bytes()).hexdigest())
        canonical = self.working / photos[0]["filename"]
        self.assertEqual(new["publication"]["canonicalSha256"], hashlib.sha256(canonical.read_bytes()).hexdigest())
        self.assertEqual(new["terminalState"], "published")

    def test_focused_repair_rejects_changed_previous_receipt(self):
        req, assignment, path, photos, source, rows, receipt, old_hash = self.repair_fixture()
        receipt.write_text("changed")
        with self.assertRaises(finalizer.FinalizeError):
            self.run_assignment(assignment, path, rows, replace="yes", publisher=self.publish_copy([]), summary_name="repair-stale")

    def test_failed_focused_repair_leaves_target_absent(self):
        req, assignment, path, photos, source, rows, receipt, old_hash = self.repair_fixture(); code, _, _ = self.run_assignment(assignment, path, rows, replace="yes", publisher=self.publish_copy([], fail=(photos[0]["filename"],)), summary_name="repair-fail"); self.assertEqual(code, 1); self.assertFalse((self.working / photos[0]["filename"]).exists())

    def test_focused_repair_never_touches_sibling(self):
        req, assignment, path, photos = self.make_assignment(("unsplash/a.jpg", "unsplash/b.jpg"))
        rows = []
        for index, photo in enumerate(photos):
            source = self.root / "batch" / f"sibling-{index}.png"
            source.write_bytes(f"asset-{index}".encode())
            ledger = self.root / f"sibling-{index}.ledger"
            ledger.write_text("{}")
            assignment["entries"][index]["ai_ledger_path"] = str(ledger)
            rows.append({"filename": photo["filename"], "status": "generated", "selection": None, "staging_path": str(source), "reason": None})
        path.write_text(json.dumps(assignment) + "\n")
        initial_calls = []
        self.run_assignment(assignment, path, rows, publisher=self.publish_copy(initial_calls), summary_name="initial-siblings")
        sibling = self.working / photos[1]["filename"]
        sibling_bytes = sibling.read_bytes()
        sibling_hash = hashlib.sha256(sibling_bytes).hexdigest()
        sibling_receipt = finalizer.receipt_path(self.working, photos[1]["filename"])
        sibling_receipt_bytes = sibling_receipt.read_bytes()
        target_receipt = finalizer.receipt_path(self.working, photos[0]["filename"])
        old_target_hash = hashlib.sha256(target_receipt.read_bytes()).hexdigest()
        sibling_assignment = dict(assignment)
        sibling_assignment["entries"] = [assignment["entries"][0]]
        sibling_assignment["repair"] = {"previous_receipt": str(target_receipt), "previous_receipt_sha256": old_target_hash}
        repair_path = self.root / "repair-sibling-safe.json"
        repair_path.write_text(json.dumps(sibling_assignment) + "\n")
        (self.working / photos[0]["filename"]).unlink()
        repair_calls = []
        code, _, _ = self.run_assignment(sibling_assignment, repair_path, [rows[0]], replace="yes", publisher=self.publish_copy(repair_calls), summary_name="repair-sibling-safe")
        self.assertEqual(code, 0)
        self.assertEqual(repair_calls, [photos[0]["filename"]])
        self.assertEqual((self.working / photos[0]["filename"]).read_bytes(), (self.root / "batch" / "sibling-0.png").read_bytes())
        self.assertEqual(sibling.read_bytes(), sibling_bytes)
        self.assertEqual(hashlib.sha256(sibling.read_bytes()).hexdigest(), sibling_hash)
        self.assertEqual(sibling_receipt.read_bytes(), sibling_receipt_bytes)

    def supplemental_receipts(self, changed=False):
        a = self.make_photo("unsplash/a.jpg", "photo-001"); b = self.make_photo("unsplash/b.jpg", "adaptation-photo-001"); initial = self.working / "initial.json"; supplemental = self.working / "supplemental.json"; historical_supplemental = self.working / "supplemental-history.json"; initial.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": [a]}) + "\n"); final_b = dict(b); final_b["subject"] = "changed" if changed else b["subject"]; historical_supplemental.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": [a, b]}) + "\n"); supplemental.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": [a, final_b]}) + "\n"); receipt_dir = self.working / "receipts"; receipt_dir.mkdir();
        for filename, snapshot in ((a["filename"], initial), (b["filename"], historical_supplemental)):
            receipt = {"schemaVersion": 2, "filename": filename, "terminalState": "omitted", "requirements": {"path": str(snapshot.resolve()), "sha256": hashlib.sha256(snapshot.read_bytes()).hexdigest()}, "publication": {"canonicalPath": None, "canonicalSha256": None}, "provenance": {"kind": "none"}}
            (receipt_dir / (hashlib.sha256(filename.encode()).hexdigest() + ".json")).write_text(json.dumps(receipt) + "\n")
        return supplemental, receipt_dir

    def test_initial_and_supplemental_receipts_compile_final_provenance(self):
        supplemental, receipt_dir = self.supplemental_receipts(); args = SimpleNamespace(requirements=str(supplemental), terminal_receipts_dir=str(receipt_dir), working_dir=str(self.working), output=str(self.root / "provenance.json"), summary_output=str(self.root / "provenance-summary.json")); self.assertEqual(finalizer.provenance_command(args), 0)

    def test_supplemental_receipt_with_changed_photo_object_is_rejected(self):
        supplemental, receipt_dir = self.supplemental_receipts(changed=True)
        args = SimpleNamespace(requirements=str(supplemental), terminal_receipts_dir=str(receipt_dir), working_dir=str(self.working), output=str(self.root / "provenance.json"), summary_output=str(self.root / "provenance-summary.json"))
        with self.assertRaises(finalizer.FinalizeError):
            finalizer.provenance_command(args)

    def test_provenance_rechecks_every_published_canonical_hash(self):
        req, assignment, path, photos = self.make_assignment()
        canonical = self.working / photos[0]["filename"]
        canonical.parent.mkdir(parents=True)
        canonical.write_bytes(b"canonical")
        ledger = self.working / "generated.ledger"
        ledger.write_text(json.dumps({"schema_version": 1, "filename": photos[0]["filename"], "events": []}) + "\n")
        receipt_dir = self.working / "receipts"
        receipt_dir.mkdir()
        receipt = {"schemaVersion": 2, "filename": photos[0]["filename"], "terminalState": "published", "requirements": {"path": str(req.resolve()), "sha256": hashlib.sha256(req.read_bytes()).hexdigest()}, "publication": {"canonicalPath": str(canonical.resolve()), "canonicalSha256": "wrong"}, "provenance": {"kind": "generated", "ledgerPath": str(ledger.resolve()), "ledgerSha256": hashlib.sha256(ledger.read_bytes()).hexdigest()}}
        (receipt_dir / (hashlib.sha256(photos[0]["filename"].encode()).hexdigest() + ".json")).write_text(json.dumps(receipt))
        args = SimpleNamespace(requirements=str(req), terminal_receipts_dir=str(receipt_dir), working_dir=str(self.working), output=str(self.root / "provenance.json"), summary_output=str(self.root / "summary.json"))
        with self.assertRaisesRegex(finalizer.FinalizeError, "canonical hash evidence is stale"):
            finalizer.provenance_command(args)
