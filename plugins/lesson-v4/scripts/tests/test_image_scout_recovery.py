from __future__ import annotations

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


validator = load("picture_validator", "validate-image-scout.py")
compiler = load("picture_compiler", "compile-picture-assignments.py")
attempts = load("picture_attempts", "image-scout-attempts.py")
PROMPT = {
    "physical_state": "one intact object on a plain surface",
    "must_avoid": ["logos", "decorative text"],
    "text_rule": "no generated text",
    "composition": "single clear subject, generous margin",
}


class UnifiedPictureArchitectureTests(unittest.TestCase):
    def test_deleted_architecture_files_and_cli_surfaces_are_gone(self):
        self.assertFalse((ROOT / "agents" / "image-scout-ai.md").exists())
        self.assertFalse((ROOT / "agents" / "image-scout-designer.md").exists())
        self.assertFalse((ROOT / "scripts" / "check-picture-source-health.py").exists())
        self.assertEqual(compiler.parser()._subparsers._group_actions[0].choices.keys(), {"compile", "slice"})

    def test_worker_instructions_keep_visual_review_and_unified_session(self):
        text = (ROOT / "agents" / "image-scout.md").read_text(encoding="utf-8")
        # Both hosts, named in full: `model:` alone also matches `codex_model:`,
        # which is how a setting could be renamed out from under this check. The
        # whole matrix lives in test_worker_launch.py; this holds the one role.
        self.assertIn("codex_model: luna", text)
        self.assertIn("codex_effort: medium", text)
        self.assertIn("\nmodel: sonnet", text)
        self.assertIn("\neffort: high", text)
        self.assertIn("never write a canonical", text)
        self.assertIn("Open every selected original", text)
        self.assertIn("one compact result", text)
        self.assertNotIn("image-scout-ai", text)
        self.assertNotIn("image-scout-designer", text)

    def test_generation_reference_keeps_two_call_lifetime_and_no_authentic_fallback(self):
        text = (ROOT / "references" / "image-scout-generation.md").read_text(encoding="utf-8")
        self.assertIn("at most two", text)
        self.assertIn("Do not generate authentic evidence", text)
        self.assertIn("Reserve the call", text)
        self.assertIn("There is never a third call", text)

    def test_licence_parser_allows_required_and_rejects_restrictive_forms(self):
        allowed = ["Public domain", "PD-US", "CC0 1.0", "CC BY 4.0", "CC BY-SA 4.0", "Attribution 4.0"]
        refused = ["CC BY-NC 4.0", "CC BY-ND 4.0", "NoDerivatives", "unknown licence"]
        for name in allowed:
            self.assertTrue(validator.wikimedia_licence_allowed(name), name)
        for name in refused:
            self.assertFalse(validator.wikimedia_licence_allowed(name), name)

    def test_compiler_has_no_real_successor_or_derived_plan_fields(self):
        text = (SCRIPTS / "compile-picture-assignments.py").read_text(encoding="utf-8")
        self.assertNotIn("real_handoff", text)
        self.assertNotIn("picture-plan", text)
        self.assertIn('"initial_route"', text)
        self.assertIn('"search_schedule"', text)
        self.assertIn('"generation_prompt_file"', text)


class LedgerSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"
        self.working.mkdir()
        self.filename = "unsplash/one.jpg"

    def tearDown(self):
        self.temp.cleanup()

    def args(self, **values):
        defaults = {
            "working_dir": str(self.working), "filename": self.filename,
            "purpose": "initial", "prompt": "", "prompt_file": None,
            "fault": "", "fault_file": None, "attempt": 1,
            "staging_path": None, "outcome": "accepted", "correctable": "yes",
            "reason": None,
        }
        defaults.update(values)
        return SimpleNamespace(**defaults)

    def ledger_path(self):
        return Path(attempts.ledger_path(str(self.working), self.filename))

    def reserve(self, prompt="initial prompt", purpose="initial", prompt_file=None):
        prompt_value = None if prompt_file is not None else prompt
        return attempts.cmd_reserve(self.args(prompt=prompt_value, purpose=purpose, prompt_file=prompt_file))

    def complete(self, outcome="accepted", attempt=1, staging_path=None, fault="", fault_file=None):
        fault_value = None if fault_file is not None else fault
        return attempts.cmd_complete(self.args(outcome=outcome, attempt=attempt, staging_path=staging_path, fault=fault_value, fault_file=fault_file))

    def make_image(self):
        path = self.root / "image.png"
        Image.new("RGB", (12, 8), "white").save(path, format="PNG")
        return path

    def test_first_reservation_then_completion(self):
        self.reserve()
        self.complete()
        state = attempts.cmd_status(self.args())
        self.assertEqual(state["attempts_used"], 1)
        self.assertEqual(state["effective_accepted_attempt"], 1)

    def test_generated_unreviewed_survives_interrupt_and_uses_no_new_call(self):
        self.reserve()
        image = self.make_image()
        attempts.cmd_record_generated(self.args(staging_path=str(image)))
        before = self.ledger_path().read_bytes()
        self.assertEqual(attempts.cmd_interrupt_open(self.args())["interrupted_attempt"], None)
        self.assertEqual(self.ledger_path().read_bytes(), before)
        state = attempts.cmd_status(self.args())
        self.assertEqual(state["attempts_used"], 1)
        self.assertEqual(state["attempts"][0]["state"], "generated_unreviewed")

    def test_completion_without_reservation_fails(self):
        with self.assertRaises(attempts.LedgerError):
            self.complete()
        self.assertFalse(self.ledger_path().exists())

    def test_history_is_immutable(self):
        self.reserve(); self.complete()
        before = self.ledger_path().read_bytes()
        with self.assertRaises(attempts.LedgerError):
            self.complete()
        self.assertEqual(self.ledger_path().read_bytes(), before)

    def test_open_reservation_becomes_interrupted_and_stays_consumed(self):
        self.reserve()
        attempts.cmd_interrupt_open(self.args(reason="host stopped"))
        state = attempts.cmd_status(self.args())
        self.assertEqual(state["attempts_used"], 1)
        self.assertEqual(state["attempts"][0]["state"], "interrupted")
        with self.assertRaises(attempts.LedgerError):
            self.reserve(purpose="initial")

    def test_accepted_surviving_attempt_needs_no_new_call(self):
        self.reserve(); self.complete()
        before = self.ledger_path().read_bytes()
        with self.assertRaises(attempts.LedgerError):
            self.reserve(purpose="correction")
        self.assertEqual(self.ledger_path().read_bytes(), before)

    def test_near_miss_may_take_one_correction(self):
        self.reserve(); self.complete("near_miss", fault="one precise fix")
        self.reserve("correction prompt", "correction")
        self.complete("accepted", attempt=2)
        self.assertEqual(attempts.cmd_status(self.args())["attempts_used"], 2)

    def test_provider_misdirection_allows_exactly_one_retry(self):
        self.reserve(); self.complete("provider_misdirection", fault="wrong subject")
        self.reserve("retry prompt", "retry")
        self.complete("accepted", attempt=2)
        with self.assertRaises(attempts.LedgerError):
            self.reserve("third", "retry")

    def test_fundamental_miss_does_not_spend_attempt_two(self):
        self.reserve(); self.complete("rejected", fault="fundamental miss")
        before = self.ledger_path().read_bytes()
        with self.assertRaises(attempts.LedgerError):
            self.reserve("not legal", "correction")
        self.assertEqual(self.ledger_path().read_bytes(), before)
        self.assertEqual(attempts.cmd_status(self.args())["attempts_used"], 1)

    def test_reviewer_rejection_authorises_only_a_correctable_second_call(self):
        self.reserve(); self.complete()
        attempts.cmd_review_reject(self.args(fault="final visual fault", correctable="yes"))
        self.reserve("repair prompt", "correction")
        self.assertEqual(attempts.cmd_status(self.args())["allowed_purposes"], [])

    def test_attempt_three_is_always_impossible(self):
        self.reserve(); self.complete("near_miss", fault="fix")
        self.reserve("fix prompt", "correction"); self.complete("accepted", attempt=2)
        before = self.ledger_path().read_bytes()
        with self.assertRaises(attempts.LedgerError):
            self.reserve("third prompt", "correction")
        self.assertEqual(self.ledger_path().read_bytes(), before)

    def test_prompt_file_records_arbitrary_text_byte_for_byte(self):
        prompt_file = self.root / "prompt.txt"
        prompt = "quotes ' \" $ ` \\ unicode café\nsecond line"
        prompt_file.write_text(prompt, encoding="utf-8")
        self.reserve(prompt_file= str(prompt_file))
        event = json.loads(self.ledger_path().read_text(encoding="utf-8"))["events"][0]
        self.assertEqual(event["prompt"], prompt)

    def test_fault_file_records_arbitrary_text_byte_for_byte(self):
        self.reserve()
        fault_file = self.root / "fault.txt"
        fault = "fault: $ ` \\ ' \" café\nsecond line"
        fault_file.write_text(fault, encoding="utf-8")
        self.complete("near_miss", fault_file=str(fault_file))
        event = json.loads(self.ledger_path().read_text(encoding="utf-8"))["events"][-1]
        self.assertEqual(event["fault"], fault)

    def test_missing_prompt_file_reserves_nothing(self):
        with self.assertRaises(attempts.LedgerError):
            self.reserve(prompt_file=str(self.root / "missing.txt"))
        self.assertFalse(self.ledger_path().exists())

    def test_ledger_paths_never_collide_between_distinct_filenames(self):
        other = attempts.ledger_path(str(self.working), "unsplash/two.jpg")
        self.assertNotEqual(str(self.ledger_path()), other)

    def test_unsafe_filenames_are_refused(self):
        with self.assertRaises(attempts.LedgerError):
            attempts.cmd_status(self.args(filename="../escape.jpg"))
        with self.assertRaises(attempts.LedgerError):
            attempts.cmd_status(self.args(filename="unsplash\\\\escape.jpg"))


class Schema2ResultValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"
        self.working.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def make_photo(self, mode="controlled-ai", fallback="omit", essential=False):
        return {
            "id": "photo-001", "subject": "one clear object",
            "pedagogical_constraint": "show the object", "teaching_requirement": "identify the object",
            "load_bearing_evidence": ["the object"], "use": "slide", "essential": essential,
            "filename": "unsplash/object.jpg", "acquisition_mode": mode,
            "source_profile": "none" if mode == "controlled-ai" else "unsplash-only",
            "fallback_action": fallback,
            "fallback_note": "a generated image would misrepresent the real record" if mode == "authentic-real" else None,
            "generation_prompt": PROMPT if mode == "controlled-ai" or fallback == "ai" else None,
            "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": [],
        }

    def fixture(self, mode="controlled-ai", fallback="omit", essential=False):
        req = self.root / "requirements.json"
        p = self.make_photo(mode, fallback, essential)
        req.write_text(json.dumps({"schema_version": 2, "lesson_name": "lesson", "photos": [p]}) + "\n", encoding="utf-8")
        assignment = compiler.build_assignment(req, [p], "p1", "p", self.root / "assignments", self.working)
        assignment_path = self.root / "assignment.json"
        assignment_path.parent.mkdir(exist_ok=True)
        assignment_path.write_text(json.dumps(assignment, indent=2) + "\n", encoding="utf-8")
        entry = assignment["entries"][0]
        args = SimpleNamespace(assignment=str(assignment_path), result=str(self.root / "result.json"), working_dir=str(self.working), work_root=assignment["work_root"], expected_batch_id="p1", expected_filename=[p["filename"]])
        return p, assignment, entry, args

    def write_result(self, args, entry, status, selection=None, staging=None, reason=None):
        payload = {"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": [{"filename": entry["filename"], "status": status, "selection": selection, "staging_path": staging, "reason": reason}]}
        Path(args.result).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    def ledger_args(self, entry, **values):
        data = {"working_dir": str(self.working), "filename": entry["filename"], "purpose": "initial", "prompt": "", "prompt_file": None, "fault": "", "fault_file": None, "attempt": 1, "staging_path": None, "outcome": "accepted", "correctable": "yes", "reason": None}
        data.update(values)
        return SimpleNamespace(**data)

    def reserve_and_accept(self, entry, attempt=1, prompt=None, purpose="initial", staging=None):
        attempts.cmd_reserve(self.ledger_args(entry, purpose=purpose, prompt=prompt or "initial prompt"))
        if staging is not None:
            attempts.cmd_record_generated(self.ledger_args(entry, attempt=attempt, staging_path=str(staging)))
            attempts.cmd_complete(self.ledger_args(entry, attempt=attempt, outcome="accepted", staging_path=str(staging)))
        else:
            attempts.cmd_complete(self.ledger_args(entry, attempt=attempt, outcome="accepted"))

    def generated_fixture(self):
        _, assignment, entry, args = self.fixture()
        prompt = Path(entry["generation_prompt_file"]).read_text(encoding="utf-8")
        stage = Path(assignment["work_root"]) / entry["entry_key"] / "ai" / "output.png"
        stage.parent.mkdir(parents=True)
        Image.new("RGB", (20, 20), "white").save(stage, format="PNG")
        self.reserve_and_accept(entry, prompt=prompt, staging=stage)
        return assignment, entry, args, stage, prompt

    def search_summary(self, entry, complete=True, failure_kind=None, retry=False):
        for step in entry["search_schedule"]:
            path = Path(step["summary_path"])
            if retry:
                path = validator.retry_summary_path(step)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps({"query": "object", "source": step["source"], "round": step["round"], "complete": complete, "requested_count": step["candidate_count"], "results": [], "failure_kind": failure_kind}) + "\n", encoding="utf-8")

    def test_initial_ai_prompt_must_match_compiled_prompt(self):
        assignment, entry, args, stage, prompt = self.generated_fixture()
        ledger = Path(entry["ai_ledger_path"])
        data = json.loads(ledger.read_text()); data["events"][0]["prompt"] = "changed prompt"; ledger.write_text(json.dumps(data) + "\n")
        self.write_result(args, entry, "generated", staging=str(stage))
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def test_legal_second_correction_prompt_validates(self):
        assignment, entry, args, stage, prompt = self.generated_fixture()
        attempts.cmd_review_reject(self.ledger_args(entry, fault="precise correction", correctable="yes"))
        second = Path(assignment["work_root"]) / entry["entry_key"] / "ai" / "corrected.png"
        Image.new("RGB", (20, 20), "white").save(second, format="PNG")
        correction = "legal corrected prompt"
        self.reserve_and_accept(entry, attempt=2, prompt=correction, purpose="correction", staging=second)
        self.write_result(args, entry, "generated", staging=str(second))
        validator.validate_result(args)

    def test_generated_unreviewed_cannot_be_terminal(self):
        _, assignment, entry, args = self.fixture()
        stage = Path(assignment["work_root"]) / entry["entry_key"] / "ai" / "pending.png"; stage.parent.mkdir(parents=True); Image.new("RGB", (8, 8)).save(stage)
        self.reserve_and_accept(entry, prompt=Path(entry["generation_prompt_file"]).read_text())
        # Replace the accepted history with a reserved output awaiting review.
        ledger = Path(entry["ai_ledger_path"]); data = json.loads(ledger.read_text()); data["events"] = [data["events"][0], {"event": "generated_unreviewed", "attempt": 1, "staging_path": str(stage)}]; ledger.write_text(json.dumps(data) + "\n")
        self.write_result(args, entry, "unsatisfied", reason="fundamental_generation_miss")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def test_no_file_result_conflicts_with_live_accepted_attempt(self):
        _, entry, args, stage, _ = self.generated_fixture()
        self.write_result(args, entry, "unsatisfied", reason="fundamental_generation_miss")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def test_output_unavailable_requires_matching_ledger_fault(self):
        _, _, entry, args = self.fixture()
        self.reserve_and_accept(entry, prompt=Path(entry["generation_prompt_file"]).read_text(), staging=None)
        ledger = Path(entry["ai_ledger_path"]); data = json.loads(ledger.read_text()); data["events"][-1]["outcome"] = "rejected"; data["events"][-1]["fault"] = "imagegen_output_unavailable"; ledger.write_text(json.dumps(data) + "\n")
        self.write_result(args, entry, "unsatisfied", reason="imagegen_output_unavailable")
        validator.validate_result(args)

    def test_attempt_budget_exhausted_requires_two_consumed_calls(self):
        _, _, entry, args = self.fixture()
        self.reserve_and_accept(entry, prompt=Path(entry["generation_prompt_file"]).read_text())
        attempts.cmd_review_reject(self.ledger_args(entry, fault="review fault", correctable="yes"))
        self.reserve_and_accept(entry, attempt=2, prompt="correction", purpose="correction")
        ledger = Path(entry["ai_ledger_path"]); data = json.loads(ledger.read_text()); data["events"][-1]["outcome"] = "rejected"; data["events"][-1]["fault"] = "fundamental miss"; ledger.write_text(json.dumps(data) + "\n")
        self.write_result(args, entry, "unsatisfied", reason="attempt_budget_exhausted")
        validator.validate_result(args)

    def test_capability_unavailable_consumes_no_call(self):
        _, _, entry, args = self.fixture(fallback="omit")
        self.write_result(args, entry, "omitted", reason="imagegen_capability_unavailable")
        validator.validate_result(args)

    def test_essential_optional_omission_is_rejected(self):
        _, _, entry, args = self.fixture(mode="authentic-real", fallback="omit", essential=True)
        self.write_result(args, entry, "omitted", reason="optional_omission")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def test_omission_requires_fallback_action_omit(self):
        _, _, entry, args = self.fixture(fallback="unsatisfied")
        self.write_result(args, entry, "omitted", reason="optional_omission")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def test_direct_ai_cannot_skip_generation_with_optional_omission(self):
        _, _, entry, args = self.fixture(essential=False)
        self.write_result(args, entry, "omitted", reason="optional_omission")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def test_real_omission_requires_completed_search_schedule(self):
        _, _, entry, args = self.fixture(mode="ordinary-real", fallback="omit")
        self.write_result(args, entry, "omitted", reason="optional_omission")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)
        self.search_summary(entry)
        validator.validate_result(args)

    def test_ai_fallback_cannot_stop_at_real_exhaustion(self):
        _, _, entry, args = self.fixture(mode="ordinary-real", fallback="ai")
        self.search_summary(entry)
        self.write_result(args, entry, "unsatisfied", reason="no_faithful_real_match")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def outage_generated_fixture(self, fallback, *, retried):
        _, assignment, entry, args = self.fixture(mode="ordinary-real", fallback=fallback)
        self.search_summary(entry, complete=False, failure_kind="transport")
        if retried:
            self.search_summary(entry, complete=False, failure_kind="transport", retry=True)
        stage = Path(assignment["work_root"]) / entry["entry_key"] / "ai" / "output.png"; stage.parent.mkdir(parents=True); Image.new("RGB", (8, 8)).save(stage)
        self.reserve_and_accept(entry, prompt=Path(entry["generation_prompt_file"]).read_text(), staging=stage)
        self.write_result(args, entry, "generated", staging=str(stage))
        return args

    def test_transient_source_failure_still_owes_its_retry(self):
        # One blip is not an outage, so the fallback does not open yet.
        args = self.outage_generated_fixture("ai", retried=False)
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)

    def test_source_outage_falls_through_to_authorised_ai(self):
        # The reported failure: a source the run could not reach left the
        # lesson with no picture even though AI was authorised.
        args = self.outage_generated_fixture("ai", retried=True)
        validator.validate_result(args)

    def test_source_outage_without_ai_fallback_still_blocks_generation(self):
        _, _, entry, args = self.fixture(mode="ordinary-real", fallback="omit")
        self.search_summary(entry, complete=False, failure_kind="transport")
        self.search_summary(entry, complete=False, failure_kind="transport", retry=True)
        self.write_result(args, entry, "unsatisfied", reason="real_source_unavailable")
        validator.validate_result(args)

    def test_ai_fallback_cannot_report_a_source_outage_as_terminal(self):
        _, _, entry, args = self.fixture(mode="ordinary-real", fallback="ai")
        self.search_summary(entry, complete=False, failure_kind="transport")
        self.search_summary(entry, complete=False, failure_kind="transport", retry=True)
        self.write_result(args, entry, "unsatisfied", reason="real_source_unavailable")
        with self.assertRaises(validator.ValidationError): validator.validate_result(args)
