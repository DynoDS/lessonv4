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


def adaptation_document(photos=None):
    """An adaptation.md shaped the way adaptation-designer actually writes one.

    The extractor identifies the document by its Greater Depth and Below
    sections before it believes a zero, so a fixture without them is no longer
    a realistic adaptation file.
    """
    text = "# Adaptation\n\n## Greater Depth\n\nDepth prompts.\n\n## Below\n\nA backward-mapped task.\n"
    if photos is not None:
        block = {"schema_version": 2, "lesson_name": "lesson", "photos": list(photos)}
        text += "\n## Photos for the sheets\n\n```json\n" + json.dumps(block) + "\n```\n"
    return text


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
            path.write_text(adaptation_document(block["photos"]), encoding="utf-8")
            self.assertEqual(photo_contract.adaptation_photos(path)[0]["id"], "adaptation-photo-001")

    def test_a_file_that_is_not_the_adaptation_document_is_refused_not_read_as_zero(self):
        """A wiring mistake must not look like a lesson that needed no pictures.

        The orchestrator handed this step `adaptation.json` while the adaptation
        designer had written `adaptation.md`. The extractor searched for a
        markdown section, found none in a JSON file, and reported zero
        adaptation photos. Three pictures the adaptation had asked for were
        dropped without a word, and the worksheet designer then omitted the
        whole Below sheet because the ids it had been told to use were absent
        from the approved contract.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wrong = root / "adaptation.json"
            wrong.write_text(json.dumps({"greaterDepth": {}, "below": {}}), encoding="utf-8")
            with self.assertRaises(photo_contract.PhotoContractError) as caught:
                photo_contract.adaptation_photos(wrong)
            message = str(caught.exception)
            self.assertIn("not the adaptation document", message)
            self.assertIn("adaptation.md", message)

    def test_an_adaptation_that_genuinely_needs_no_pictures_still_reports_zero(self):
        """The discrimination case: a real document with no photos block.

        This is the reading the guard must keep, or every adaptation without
        pictures would fail the run.
        """
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "adaptation.md"
            path.write_text(adaptation_document(), encoding="utf-8")
            self.assertEqual(photo_contract.adaptation_photos(path), [])

    def test_a_truncated_adaptation_document_is_refused(self):
        """A file that lost its sections mid-write is a fault, not a zero."""
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "adaptation.md"
            path.write_text("# Adaptation\n\nWorking notes only.\n", encoding="utf-8")
            with self.assertRaises(photo_contract.PhotoContractError):
                photo_contract.adaptation_photos(path)

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
            adaptation.write_text(adaptation_document(block["photos"]), encoding="utf-8")
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

    def promote(self, root, worksheet_spec, adaptation_photos):
        """Run promote-used the way the playbook runs it, and return the count."""
        adaptation = root / "adaptation.md"
        adaptation.write_text(adaptation_document(adaptation_photos), encoding="utf-8")
        provisional = root / "adaptation-photo-provisional.json"
        receipts = root / "orchestration-receipts"
        receipts.mkdir(parents=True, exist_ok=True)
        build_args = type("Args", (), {
            "initial": str(root / "phase2-initial-photo-requirements.json"),
            "adaptation": str(adaptation),
            "output": str(provisional),
            "lesson_design": None,
            "receipt": str(receipts / "adaptation-photo-provisional.json"),
        })()
        photo_contract.cmd_build_provisional(build_args)

        worksheet = root / "worksheet.json"
        worksheet.write_text(json.dumps(worksheet_spec), encoding="utf-8")
        receipt = receipts / "photo-requirements-w-1.json"
        promote_args = type("Args", (), {
            "initial": str(root / "phase2-initial-photo-requirements.json"),
            "provisional": str(provisional),
            "adaptation": str(adaptation),
            "worksheet": str(worksheet),
            "canonical": str(root / "photo-requirements.json"),
            "lesson_design": None,
            "receipt": str(receipt),
            "requirements_snapshot": str(root / "photo-requirements-w-1.json"),
        })()
        photo_contract.cmd_promote_used(promote_args)
        return json.loads(receipt.read_text(encoding="utf-8"))["newFilenames"]

    def test_a_worksheet_promotes_the_pictures_it_names_by_filename(self):
        """The Year 4 appliances run: three adaptation photographs approved,
        three referenced by the Below sheet, none promoted, and no worksheet.

        A rendering specification names a picture the only way its engine can
        read one, through the approved filename in `imagePath`. Matching on the
        contract id alone therefore selected nothing, the supplemental picture
        wave had nothing to source, and the build blocked on pictures that had
        been in the contract all along.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.freeze(root)
            approved = [
                full_photo("adaptation-photo-001", "generated/desk-fan.png"),
                full_photo("adaptation-photo-002", "generated/torch.png"),
                full_photo("adaptation-photo-003", "generated/vacuum.png"),
            ]
            worksheet = {"sheets": {"below": {"zones": {"a": {"cards": [
                {"imagePath": "generated/desk-fan.png"},
                {"imagePath": "generated/torch.png"},
                {"imagePath": "generated/vacuum.png"},
            ]}}}}}
            self.assertEqual(
                sorted(self.promote(root, worksheet, approved)),
                ["generated/desk-fan.png", "generated/torch.png", "generated/vacuum.png"],
            )

    def test_an_approved_picture_the_sheet_never_uses_is_still_not_promoted(self):
        """Discrimination: promotion sources what the sheet asks for, not the
        whole provisional contract. An adaptation photo the accepted worksheet
        dropped must not cost a picture out of the lesson's cap."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.freeze(root)
            approved = [
                full_photo("adaptation-photo-001", "generated/desk-fan.png"),
                full_photo("adaptation-photo-002", "generated/torch.png"),
            ]
            worksheet = {"sheets": {"below": {"zones": {"a": {
                "cards": [{"imagePath": "generated/torch.png"}]
            }}}}}
            self.assertEqual(
                self.promote(root, worksheet, approved), ["generated/torch.png"]
            )

    def test_a_worksheet_that_still_names_ids_promotes_the_same_pictures(self):
        """Generalisation: the id remains a valid reference, so a specification
        that carries both spellings, or only the id, is unaffected."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.freeze(root)
            approved = [full_photo("adaptation-photo-001", "generated/desk-fan.png")]
            worksheet = {"sheets": {"below": {"zones": {"a": {
                "photoRefs": ["adaptation-photo-001"]
            }}}}}
            self.assertEqual(
                self.promote(root, worksheet, approved), ["generated/desk-fan.png"]
            )

    def test_a_windows_written_path_names_the_same_approved_picture(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.freeze(root)
            approved = [full_photo("adaptation-photo-001", "generated/desk-fan.png")]
            worksheet = {"sheets": {"below": {"zones": {"a": {
                "cards": [{"imagePath": "generated\\desk-fan.png"}]
            }}}}}
            self.assertEqual(
                self.promote(root, worksheet, approved), ["generated/desk-fan.png"]
            )

    def test_a_bare_basename_is_not_treated_as_a_reference(self):
        """Two folders may hold the same name, so only spellings that mean the
        same file count. A loose match here would promote the wrong picture."""
        self.assertNotIn(
            "desk-fan.png", photo_contract.reference_forms("generated/desk-fan.png")
        )

    def test_latest_supplemental_snapshot_is_selected_from_valid_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); snapshot = root / "snapshot.json"; snapshot.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": []}), encoding="utf-8")
            receipt = root / "photo-requirements-w-002.json"
            receipt.write_text(json.dumps({"schemaVersion": 1, "requirementsSnapshot": str(snapshot), "requirementsSnapshotSha256": hashlib.sha256(snapshot.read_bytes()).hexdigest()}), encoding="utf-8")
            self.assertEqual(photo_contract.choose_latest_supplemental(root), snapshot)


if __name__ == "__main__":
    unittest.main()
