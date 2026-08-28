from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]

def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


unsplash = load("test_unsplash_source", "unsplash_fetch.py")
wikimedia = load("test_wikimedia_source", "wikimedia_fetch.py")
validator = load("test_picture_source_validator", "validate-image-scout.py")
compiler = load("test_picture_source_compiler", "compile-picture-assignments.py")
design_validator = load("test_picture_source_design_validator", "validate-lesson-design.py")


class PictureSourceTests(unittest.TestCase):
    def image(self, path: Path, image_format: str):
        Image.new("RGB", (24, 16), (20, 80, 140)).save(path, format=image_format)
        return path

    def test_unsplash_complete_png_records_full_decode_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self.image(Path(tmp) / "candidate.png", "PNG")
            self.assertEqual(unsplash.decode_info(path), (24, 16, "PNG"))
            item = unsplash.candidate_metadata(path, {"id": "u1", "links": {"html": "https://unsplash.com/photos/u1"}, "user": {"name": "Creator"}}, 1)
            self.assertEqual((item["width"], item["height"], item["decoded_format"]), (24, 16, "PNG"))
            self.assertEqual(item["byte_count"], path.stat().st_size)

    def test_unsplash_truncated_png_is_a_download_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = self.image(root / "candidate.png", "PNG")
            path.write_bytes(path.read_bytes()[:-8])
            with self.assertRaises(ValueError):
                unsplash.candidate_metadata(path, {"id": "u1"}, 1)
            valid_bytes = self.image(root / "valid.png", "PNG").read_bytes()[:-8]
            candidate = {"id": "u1", "urls": {"regular": "https://example.test/candidate.jpg"}, "links": {"html": "https://unsplash.com/photos/u1"}, "user": {"name": "Creator"}}
            output = root / "unsplash-output"
            def write_truncated(_url, destination):
                Path(destination).write_bytes(valid_bytes)
            with mock.patch.object(unsplash, "load_api_key", return_value="key"), mock.patch.object(unsplash, "search_unsplash", return_value=[candidate]), mock.patch.object(unsplash, "download_image", side_effect=write_truncated), mock.patch.object(unsplash, "trigger_download"):
                with mock.patch.object(sys, "argv", [str(ROOT / "unsplash_fetch.py"), "object", "--count", "1", "--output", str(output)]):
                    with self.assertRaises(SystemExit) as exit_info:
                        unsplash.main()
            self.assertNotEqual(exit_info.exception.code, 0)
            summary = json.loads((output / "_search-summary-unsplash-r1.json").read_text())
            self.assertIs(summary["complete"], False)
            self.assertEqual(summary["results"], [])
            self.assertEqual(summary["download_failure_count"], 1)
            self.assertEqual(summary["failure_kind"], "transport")

    def test_wikimedia_complete_jpeg_records_full_decode_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self.image(Path(tmp) / "candidate.jpg", "JPEG")
            self.assertEqual(wikimedia.decode_info(path), (24, 16, "JPEG"))
            item = wikimedia.candidate_metadata(path, {"title": "File:one.jpg", "page_url": "https://commons.wikimedia.org/wiki/File:one.jpg", "artist": "Creator", "licence": "CC BY 4.0", "licence_url": "https://creativecommons.org/licenses/by/4.0/", "description": "one"}, 1)
            self.assertEqual((item["width"], item["height"], item["decoded_format"]), (24, 16, "JPEG"))

    def test_wikimedia_truncated_jpeg_is_a_download_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = self.image(root / "candidate.jpg", "JPEG")
            path.write_bytes(path.read_bytes()[:-20])
            with self.assertRaises(ValueError):
                wikimedia.candidate_metadata(path, {"title": "File:one.jpg"}, 1)
            valid_bytes = self.image(root / "valid.jpg", "JPEG").read_bytes()[:-20]
            candidate = {"title": "File:one.jpg", "thumb_url": "https://example.test/one.jpg", "page_url": "https://commons.wikimedia.org/wiki/File:one.jpg", "artist": "Creator", "licence": "CC BY 4.0", "licence_url": "https://creativecommons.org/licenses/by/4.0/", "description": "one"}
            output = root / "wikimedia-output"
            def write_truncated(_url, destination):
                Path(destination).write_bytes(valid_bytes)
            with mock.patch.object(wikimedia, "search_commons", return_value=[candidate]), mock.patch.object(wikimedia, "download_image", side_effect=write_truncated):
                with mock.patch.object(sys, "argv", [str(ROOT / "wikimedia_fetch.py"), "object", "--count", "1", "--output", str(output)]):
                    with self.assertRaises(SystemExit) as exit_info:
                        wikimedia.main()
            self.assertNotEqual(exit_info.exception.code, 0)
            summary = json.loads((output / "_search-summary-wikimedia-r1.json").read_text())
            self.assertIs(summary["complete"], False)
            self.assertEqual(summary["results"], [])
            self.assertEqual(summary["download_failure_count"], 1)
            self.assertEqual(summary["failure_kind"], "transport")

    def test_wikimedia_accepts_public_domain_cc0_cc_by_and_cc_by_sa(self):
        for licence in ("Public domain", "CC0 1.0", "CC BY 4.0", "CC BY-SA 4.0"):
            self.assertTrue(wikimedia.is_allowed_licence(licence), licence)

    def test_wikimedia_rejects_cc_by_nc(self):
        self.assertFalse(wikimedia.is_allowed_licence("CC BY-NC 4.0"))

    def test_wikimedia_rejects_cc_by_nd(self):
        self.assertFalse(wikimedia.is_allowed_licence("CC BY-ND 4.0"))

    def test_wikimedia_rejects_cc_by_nc_sa(self):
        self.assertFalse(wikimedia.is_allowed_licence("CC BY-NC-SA 4.0"))

    def test_wikimedia_rejects_cc_by_nc_nd(self):
        self.assertFalse(wikimedia.is_allowed_licence("CC BY-NC-ND 4.0"))

    def step(self, root, source="unsplash", round_number=1, count=3):
        return {"source": source, "round": round_number, "candidate_count": count, "summary_path": str((root / f"_search-summary-{source}-r{round_number}.json").resolve())}

    def write_summary(self, step, complete, failure_kind=None, results=None, retry=False):
        path = validator.retry_summary_path(step) if retry else Path(step["summary_path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"query": "checked query", "source": step["source"], "round": step["round"], "requested_count": step["candidate_count"], "complete": complete, "failure_kind": failure_kind, "results": results or []}
        path.write_text(json.dumps(payload) + "\n", encoding="utf-8")
        return path

    def test_transient_retry_uses_retry_1_without_overwriting_primary_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); step = self.step(root)
            primary = self.write_summary(step, False, "transport")
            original = primary.read_bytes()
            retry = self.write_summary(step, True, None, retry=True)
            selected, summary = validator.completed_step_summary(step, "test")
            self.assertEqual(selected, retry)
            self.assertTrue(summary["complete"])
            self.assertEqual(primary.read_bytes(), original)
            self.assertEqual(retry.parent.name, "retry-1")

    def test_retry_2_path_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); step = self.step(root)
            self.write_summary(step, False, "transport")
            extra = root / "retry-2"; extra.mkdir(); (extra / Path(step["summary_path"]).name).write_text("{}")
            with self.assertRaises(validator.ValidationError): validator.completed_step_summary(step, "test")

    def test_auth_failure_forbids_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); step = self.step(root); self.write_summary(step, False, "auth")
            with self.assertRaises(validator.ValidationError): validator.completed_step_summary(step, "test")
            self.write_summary(step, True, retry=True)
            with self.assertRaises(validator.ValidationError): validator.completed_step_summary(step, "test")

    def test_rate_limit_forbids_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); step = self.step(root); self.write_summary(step, False, "rate_limit")
            with self.assertRaises(validator.ValidationError): validator.completed_step_summary(step, "test")

    def result_fixture(self, selected_index, earlier_failure=None, later_exists=False):
        root = Path(tempfile.mkdtemp()); working = root / "working"; working.mkdir()
        photo = {"id": "photo-001", "subject": "subject", "pedagogical_constraint": "show it", "teaching_requirement": "identify it", "load_bearing_evidence": ["the subject"], "use": "slide", "essential": True, "filename": "unsplash/item.jpg", "acquisition_mode": "authentic-real", "source_profile": "unsplash-then-wikimedia", "fallback_action": "unsatisfied", "fallback_note": "a generated image would misrepresent the real record", "generation_prompt": None, "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": []}
        req = root / "requirements.json"; req.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": [photo]}) + "\n")
        assignment = compiler.build_assignment(req, [photo], "p1", "p", root / "assignments", working)
        assignment_path = root / "assignment.json"; assignment_path.write_text(json.dumps(assignment) + "\n")
        entry = assignment["entries"][0]; schedule = entry["search_schedule"]
        selected_step = schedule[selected_index]; candidate_path = Path(selected_step["summary_path"]).parent / "candidate.png"; candidate_path.parent.mkdir(parents=True, exist_ok=True); self.image(candidate_path, "PNG")
        is_unsplash = selected_step["source"] == "unsplash"
        candidate = {"candidate_id": "candidate-1", "sha256": hashlib.sha256(candidate_path.read_bytes()).hexdigest(), "byte_count": candidate_path.stat().st_size, "width": 24, "height": 16, "decoded_format": "PNG", "source": selected_step["source"], "source_page_url": "https://unsplash.com/photos/one" if is_unsplash else "https://commons.wikimedia.org/wiki/File:one.png", "creator": "Creator", "licence_name": "Unsplash License" if is_unsplash else "CC BY 4.0", "licence_url": "https://unsplash.com/license" if is_unsplash else "https://creativecommons.org/licenses/by/4.0/", "description": "subject", "path": str(candidate_path)}
        for index, step in enumerate(schedule):
            if index == selected_index:
                self.write_summary(step, True, results=[candidate])
            elif index < selected_index and earlier_failure and index == 0:
                self.write_summary(step, False, earlier_failure)
            elif later_exists and index > selected_index:
                self.write_summary(step, True)
        result_path = root / "result.json"; result_path.write_text(json.dumps({"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": [{"filename": entry["filename"], "status": "sourced", "selection": {"summary_path": selected_step["summary_path"], "candidate_id": "candidate-1"}, "staging_path": None, "reason": None}]}) + "\n")
        args = SimpleNamespace(assignment=str(assignment_path), result=str(result_path), working_dir=str(working), work_root=assignment["work_root"], expected_batch_id="p1", expected_filename=[entry["filename"]])
        return args

    def test_later_source_winner_requires_completed_earlier_step(self):
        args = self.result_fixture(1, earlier_failure="auth")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def test_search_after_winner_is_rejected(self):
        args = self.result_fixture(0, later_exists=True)
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)


class PictureRouteEnforcementAgreementTests(unittest.TestCase):
    """The design validator and the compiler must reject the same contracts.

    They hold separate copies of the route rules and both stand between a
    lesson design and the image pipeline. If one drifts, a contract that leaves
    a required picture with no way to become an image reaches a real lesson
    through whichever gate is looser.
    """

    PROMPT = {
        "physical_state": "the subject shown whole and unobstructed",
        "must_avoid": ["a second subject"],
        "text_rule": "no readable text, labels, logos or branding",
        "composition": "the whole subject in one clear frame",
    }

    def photo(self, **overrides):
        base = {
            "id": "photo-001",
            "subject": "an electric kettle with its disconnected plug in frame",
            "pedagogical_constraint": "the kettle is unplugged and the whole plug stays visible",
            "teaching_requirement": "recognise that an appliance can be made safe before inspection",
            "load_bearing_evidence": ["one complete kettle", "a visible three-pin plug"],
            "use": "both",
            "essential": True,
            "filename": "unsplash/kettle.jpg",
            "acquisition_mode": "ordinary-real",
            "source_profile": "unsplash-then-wikimedia",
            "fallback_action": "ai",
            "fallback_note": None,
            "generation_prompt": dict(self.PROMPT),
            "coherent_group": None,
            "coherent_mode": "none",
            "coherent_visual_invariants": [],
        }
        base.update(overrides)
        return base

    def verdicts(self, photo):
        document = {"schema_version": 2, "lesson_name": "Electrical safety", "photos": [photo]}
        try:
            compiler.validate_requirements(document)
            compiled_ok = True
        except compiler.AssignmentError:
            compiled_ok = False
        try:
            design_validator.validate_photo_contract_v2(document)
            design_ok = True
        except design_validator.ContractError:
            design_ok = False
        return compiled_ok, design_ok

    def assert_both(self, photo, expected, message):
        compiled_ok, design_ok = self.verdicts(photo)
        self.assertEqual(compiled_ok, expected, f"compiler disagreed: {message}")
        self.assertEqual(design_ok, expected, f"design validator disagreed: {message}")

    def test_required_picture_with_no_route_to_an_image_is_rejected_by_both(self):
        # The reported failure: eleven required photographs authored real-only
        # with no authorised substitute, and eleven empty slots in the lesson.
        for fallback in ("omit", "unsatisfied"):
            with self.subTest(fallback=fallback):
                self.assert_both(
                    self.photo(fallback_action=fallback, generation_prompt=None),
                    False,
                    f"essential ordinary-real with fallback {fallback}",
                )

    def test_required_picture_with_an_ai_fallback_is_accepted_by_both(self):
        self.assert_both(self.photo(), True, "essential ordinary-real with an AI fallback")

    def test_optional_picture_may_still_be_omitted_by_both(self):
        self.assert_both(
            self.photo(essential=False, fallback_action="omit", generation_prompt=None),
            True,
            "non-essential ordinary-real may be omitted",
        )

    def test_authentic_real_without_a_written_reason_is_rejected_by_both(self):
        self.assert_both(
            self.photo(
                acquisition_mode="authentic-real",
                fallback_action="unsatisfied",
                generation_prompt=None,
                fallback_note=None,
            ),
            False,
            "authentic-real with no fallback_note",
        )

    def test_authentic_real_with_a_written_reason_is_accepted_by_both(self):
        self.assert_both(
            self.photo(
                acquisition_mode="authentic-real",
                fallback_action="unsatisfied",
                generation_prompt=None,
                fallback_note="a generated image would invent a record that never existed",
            ),
            True,
            "authentic-real with a fallback_note",
        )

    def test_direct_ai_route_is_accepted_by_both(self):
        # The staged-evidence case this lesson actually needed: whole kettle
        # and disconnected plug in one frame is not a stock product photograph.
        self.assert_both(
            self.photo(
                acquisition_mode="controlled-ai",
                source_profile="none",
                fallback_action="unsatisfied",
            ),
            True,
            "controlled-ai for staged evidence",
        )


if __name__ == "__main__":
    unittest.main()
