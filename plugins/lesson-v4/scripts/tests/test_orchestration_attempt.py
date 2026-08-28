"""Behavioural tests for the orchestration attempt records.

Run:
  python3 test_orchestration_attempt.py
or:
  pytest test_orchestration_attempt.py

`orchestration-attempt.py` writes the durable contract before a worker launches,
the orchestrator-owned receipt when its accepted state arrives, and the final
audit comparing the two. These tests exercise the commands against fixture
attempts: what start accepts and refuses, what close demands, and what the
audit flags.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ATTEMPT = ROOT / "scripts" / "orchestration-attempt.py"


def run_attempt(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(ATTEMPT), *args], capture_output=True, text=True
    )


class AttemptCase(unittest.TestCase):
    """A working dir with one real input and room for outputs."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="attempt-test-"))
        self.addCleanup(shutil.rmtree, self.tmp, True)
        self.working = self.tmp / "working" / "lesson"
        self.working.mkdir(parents=True)
        self.source = self.working / "lesson.partial.json"
        self.source.write_text('{"slides": []}', encoding="utf-8")
        self.final = self.working / "lesson.json"
        self.partial = self.working / "lesson.partial.out.json"

    # -- helpers ------------------------------------------------------------

    def write_json(self, path: Path, payload) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return path

    def start_spec(self, attempt_id="slide-designer-initial-1", attempt_number=1,
                   outputs=None, overrides=None):
        assignment = {
            "role": "slide-designer",
            "identity": "initial complete slide specification",
            "expectedOutputs": outputs or [str(self.final), str(self.partial)],
            "allowedDeclaredStates": ["COMPLETE", "SLIDE_HELPER_GAP"],
            "outputsByDeclaredState": {
                "COMPLETE": [str(self.final)],
                "SLIDE_HELPER_GAP": [str(self.partial)],
            },
        }
        spec = {
            "schemaVersion": 1,
            "logicalAttemptId": attempt_id,
            "attemptNumber": attempt_number,
            "assignment": assignment,
            "inputs": [{"sourcePath": str(self.source), "mode": "read-only"}],
            "checks": [{"name": "validate", "command": "python3 check.py", "requiredMarker": None}],
        }
        spec.update(overrides or {})
        return self.write_json(self.working / "requests" / f"{attempt_id}.start.json", spec)

    def start(self, spec_path) -> subprocess.CompletedProcess:
        return run_attempt(
            "start", "--working-dir", str(self.working), "--spec", str(spec_path)
        )

    def close_spec(self, attempt_id="slide-designer-initial-1", state="COMPLETE",
                   outputs=None, checks=None, overrides=None):
        spec = {
            "schemaVersion": 1,
            "logicalAttemptId": attempt_id,
            "declaredState": state,
            "outputs": outputs if outputs is not None else [{"path": str(self.final)}],
            "checks": checks if checks is not None else [{
                "name": "validate", "command": "python3 check.py",
                "exitCode": 0, "requiredMarker": None, "capturedOutput": "",
            }],
        }
        spec.update(overrides or {})
        return self.write_json(self.working / "requests" / f"{attempt_id}.close.json", spec)

    def close(self, spec_path) -> subprocess.CompletedProcess:
        return run_attempt(
            "close", "--working-dir", str(self.working), "--spec", str(spec_path)
        )

    def audit(self) -> subprocess.CompletedProcess:
        return run_attempt("audit", "--working-dir", str(self.working))

    def write_output(self):
        self.final.write_text('{"slides": ["ok"]}', encoding="utf-8")

    def start_once(self) -> subprocess.CompletedProcess:
        return self.start(self.start_spec())


class TestStart(AttemptCase):
    def test_start_writes_the_contract_and_snapshots_inputs(self):
        result = self.start_once()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("ORCHESTRATION_ATTEMPT_STARTED slide-designer-initial-1", result.stdout)
        contract = self.working / "orchestration-contracts" / "slide-designer-initial-1.json"
        self.assertTrue(contract.is_file())
        payload = json.loads(contract.read_text(encoding="utf-8"))
        self.assertEqual(payload["logicalAttemptId"], "slide-designer-initial-1")
        self.assertEqual(payload["assignment"]["allowedDeclaredStates"],
                         ["COMPLETE", "SLIDE_HELPER_GAP"])
        inputs = payload["inputs"]
        self.assertEqual(len(inputs), 1)
        self.assertTrue(Path(inputs[0]["snapshotPath"]).is_file(),
                        "the immutable input copy must exist")

    def test_start_rejects_a_duplicate_attempt_id(self):
        first = self.start_once()
        self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
        second = self.start_once()
        self.assertEqual(second.returncode, 1)
        self.assertIn("duplicate attempt", second.stdout)

    def test_start_rejects_an_attempt_number_mismatch(self):
        result = self.start(self.start_spec(
            attempt_id="slide-designer-initial-2", attempt_number=3
        ))
        self.assertEqual(result.returncode, 1)
        self.assertIn("attemptNumber", result.stdout)

    def test_start_validates_the_state_map(self):
        spec = self.start_spec(overrides={})
        payload = json.loads(spec.read_text(encoding="utf-8"))
        payload["assignment"]["outputsByDeclaredState"]["COMPLETE"] = [
            str(self.tmp / "somewhere-else" / "lesson.json")
        ]
        spec.write_text(json.dumps(payload), encoding="utf-8")
        result = self.start(spec)
        self.assertEqual(result.returncode, 1)
        self.assertIn("not in expectedOutputs", result.stdout)

    def test_slide_designer_three_state_contract_accepts_check_failed_temp_output(self):
        scratch = self.working / "lesson.json.tmp.slide-designer-initial-1"
        assignment = {
            "role": "slide-designer",
            "identity": "initial complete slide specification",
            "expectedOutputs": [str(self.final), str(self.partial), str(scratch)],
            "allowedDeclaredStates": [
                "COMPLETE",
                "SLIDE_HELPER_GAP",
                "SLIDE_DESIGN_CHECK_FAILED",
            ],
            "outputsByDeclaredState": {
                "COMPLETE": [str(self.final)],
                "SLIDE_HELPER_GAP": [str(self.partial)],
                "SLIDE_DESIGN_CHECK_FAILED": [str(scratch)],
            },
        }
        spec = self.start_spec(overrides={
            "assignment": assignment,
            "checks": [],
        })
        started = self.start(spec)
        self.assertEqual(started.returncode, 0, started.stdout + started.stderr)

        scratch.write_text('{"slides": []}', encoding="utf-8")
        closed = self.close(self.close_spec(
            state="SLIDE_DESIGN_CHECK_FAILED",
            outputs=[{"path": str(scratch)}],
            checks=[],
        ))
        self.assertEqual(closed.returncode, 0, closed.stdout + closed.stderr)
        self.assertIn(
            "ORCHESTRATION_ATTEMPT_CLOSED slide-designer-initial-1 SLIDE_DESIGN_CHECK_FAILED",
            closed.stdout,
        )


class TestClose(AttemptCase):
    def test_close_writes_the_receipt(self):
        self.assertEqual(self.start_once().returncode, 0)
        self.write_output()
        result = self.close(self.close_spec())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("ORCHESTRATION_ATTEMPT_CLOSED slide-designer-initial-1 COMPLETE",
                      result.stdout)
        receipt = self.working / "orchestration-receipts" / "slide-designer-initial-1.json"
        self.assertTrue(receipt.is_file())
        payload = json.loads(receipt.read_text(encoding="utf-8"))
        self.assertEqual(payload["declaredState"], "COMPLETE")
        self.assertEqual(payload["outputs"][0]["path"], str(self.final))

    def test_close_accepts_an_authorised_read_write_output(self):
        assignment = {
            "role": "design-reviewer",
            "identity": "review canonical lesson design",
            "expectedOutputs": [str(self.source)],
            "allowedDeclaredStates": ["COMPLETE"],
            "outputsByDeclaredState": {"COMPLETE": [str(self.source)]},
        }
        start = self.start_spec(overrides={
            "assignment": assignment,
            "inputs": [{"sourcePath": str(self.source), "mode": "read-write"}],
        })
        self.assertEqual(self.start(start).returncode, 0)
        self.source.write_text('{"slides": ["reviewed"]}', encoding="utf-8")
        close = self.close_spec(outputs=[{"path": str(self.source)}])
        result = self.close(close)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_close_rejects_a_changed_read_only_input(self):
        self.assertEqual(self.start_once().returncode, 0)
        self.write_output()
        self.source.write_text('{"slides": ["changed"]}', encoding="utf-8")
        result = self.close(self.close_spec())
        self.assertEqual(result.returncode, 1)
        self.assertIn("read-only input changed", result.stdout)

    def test_close_rejects_an_uncontracted_state(self):
        self.assertEqual(self.start_once().returncode, 0)
        self.write_output()
        result = self.close(self.close_spec(state="DESIGN_FAULT"))
        self.assertEqual(result.returncode, 1)
        self.assertIn("not a state this contract allowed", result.stdout)

    def test_close_requires_the_exact_outputs_for_the_state(self):
        self.assertEqual(self.start_once().returncode, 0)
        self.write_output()
        result = self.close(self.close_spec(outputs=[{"path": str(self.partial)}]))
        self.assertEqual(result.returncode, 1)
        self.assertIn("must be exactly", result.stdout)

    def test_close_requires_a_missing_marker(self):
        self.start(self.start_spec(overrides={
            "checks": [{"name": "validate", "command": "python3 check.py",
                        "requiredMarker": "LESSON_DESIGN_OK"}],
        }))
        self.write_output()
        result = self.close(self.close_spec(checks=[{
            "name": "validate", "command": "python3 check.py",
            "exitCode": 0, "requiredMarker": "LESSON_DESIGN_OK",
            "capturedOutput": "everything was checked",
        }]))
        self.assertEqual(result.returncode, 1)
        self.assertIn("requiredMarker", result.stdout)

        ok = self.close(self.close_spec(checks=[{
            "name": "validate", "command": "python3 check.py",
            "exitCode": 0, "requiredMarker": "LESSON_DESIGN_OK",
            "capturedOutput": "LESSON_DESIGN_OK",
        }]))
        self.assertEqual(ok.returncode, 0, ok.stdout + ok.stderr)


class TestAudit(AttemptCase):
    def test_missing_receipt_fails_the_audit(self):
        self.assertEqual(self.start_once().returncode, 0)
        result = self.audit()
        self.assertEqual(result.returncode, 1)
        audit = json.loads(
            (self.working / "orchestration-audit.json").read_text(encoding="utf-8")
        )
        self.assertEqual(audit["missingReceipts"], ["slide-designer-initial-1"])
        self.assertEqual(audit["status"], "FAIL")

    def test_unexpected_receipt_fails_the_audit(self):
        self.write_json(
            self.working / "orchestration-receipts" / "ghost-worker-1.json",
            {"schemaVersion": 1, "logicalAttemptId": "ghost-worker-1"},
        )
        result = self.audit()
        self.assertEqual(result.returncode, 1)
        audit = json.loads(
            (self.working / "orchestration-audit.json").read_text(encoding="utf-8")
        )
        self.assertEqual(audit["unexpectedReceipts"], ["ghost-worker-1"])
        self.assertEqual(audit["status"], "FAIL")

    def test_invalid_receipt_fails_the_audit(self):
        self.assertEqual(self.start_once().returncode, 0)
        receipt = self.working / "orchestration-receipts" / "slide-designer-initial-1.json"
        receipt.parent.mkdir(parents=True, exist_ok=True)
        receipt.write_text("{not json", encoding="utf-8")
        result = self.audit()
        self.assertEqual(result.returncode, 1)
        audit = json.loads(
            (self.working / "orchestration-audit.json").read_text(encoding="utf-8")
        )
        self.assertEqual(audit["invalidReceipts"], ["slide-designer-initial-1"])
        self.assertEqual(audit["status"], "FAIL")

    def test_audit_rejects_a_receipt_that_no_longer_matches_its_contract(self):
        self.assertEqual(self.start_once().returncode, 0)
        self.write_output()
        self.assertEqual(self.close(self.close_spec()).returncode, 0)
        receipt = self.working / "orchestration-receipts" / "slide-designer-initial-1.json"
        payload = json.loads(receipt.read_text(encoding="utf-8"))
        payload["assignment"]["identity"] = "different assignment"
        self.write_json(receipt, payload)
        result = self.audit()
        self.assertEqual(result.returncode, 1)
        audit = json.loads(
            (self.working / "orchestration-audit.json").read_text(encoding="utf-8")
        )
        self.assertEqual(audit["invalidReceipts"], ["slide-designer-initial-1"])

    def test_audit_rejects_an_output_changed_after_close(self):
        self.assertEqual(self.start_once().returncode, 0)
        self.write_output()
        self.assertEqual(self.close(self.close_spec()).returncode, 0)
        self.final.write_text('{"slides": ["changed later"]}', encoding="utf-8")
        result = self.audit()
        self.assertEqual(result.returncode, 1)
        audit = json.loads(
            (self.working / "orchestration-audit.json").read_text(encoding="utf-8")
        )
        self.assertEqual(audit["invalidReceipts"], ["slide-designer-initial-1"])

    def test_audit_rejects_a_malformed_matching_contract(self):
        self.assertEqual(self.start_once().returncode, 0)
        self.write_output()
        self.assertEqual(self.close(self.close_spec()).returncode, 0)
        contract = self.working / "orchestration-contracts" / "slide-designer-initial-1.json"
        contract.write_text("{not json", encoding="utf-8")
        result = self.audit()
        self.assertEqual(result.returncode, 1)
        audit = json.loads(
            (self.working / "orchestration-audit.json").read_text(encoding="utf-8")
        )
        self.assertEqual(audit["invalidReceipts"], ["slide-designer-initial-1"])

    def test_flow_owned_receipts_are_excluded(self):
        self.assertEqual(self.start_once().returncode, 0)
        self.write_output()
        self.assertEqual(self.close(self.close_spec()).returncode, 0)
        receipts = self.working / "orchestration-receipts"
        self.write_json(receipts / "adaptation-photo-merge.json", {"merge": True})
        self.write_json(receipts / "photo-requirements-w-001.json", {"frozen": True})
        self.write_json(self.working / "orchestration-contracts" / "photo-requirements-w-002.json",
                        {"frozen": True})
        self.write_json(receipts / "picture-terminal-abc123.json", {"terminal": True})
        result = self.audit()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("ORCHESTRATION_AUDIT_OK contracts=1 receipts=1", result.stdout)
        audit = json.loads(
            (self.working / "orchestration-audit.json").read_text(encoding="utf-8")
        )
        self.assertEqual(audit["contracts"], 1)
        self.assertEqual(audit["receipts"], 1)
        self.assertEqual(audit["status"], "PASS")

    def test_a_complete_run_audits_pass(self):
        for suffix, attempt_number in (("1", 1), ("2", 2)):
            attempt_id = f"worksheet-builder-initial-{suffix}"
            self.assertEqual(
                self.start(self.start_spec(
                    attempt_id=attempt_id, attempt_number=attempt_number,
                    outputs=[str(self.final)],
                    overrides={
                        "assignment": {
                            "role": "worksheet-builder",
                            "identity": f"worksheet build attempt {suffix}",
                            "expectedOutputs": [str(self.final)],
                            "allowedDeclaredStates": ["COMPLETE"],
                            "outputsByDeclaredState": {"COMPLETE": [str(self.final)]},
                        },
                    },
                )).returncode,
                0,
            )
            self.write_output()
            self.assertEqual(
                self.close(self.close_spec(
                    attempt_id=attempt_id,
                    outputs=[{"path": str(self.final)}],
                    checks=[{"name": "validate", "command": "python3 check.py",
                             "exitCode": 0, "requiredMarker": None, "capturedOutput": ""}],
                )).returncode,
                0,
            )
        result = self.audit()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("ORCHESTRATION_AUDIT_OK contracts=2 receipts=2", result.stdout)
        audit = json.loads(
            (self.working / "orchestration-audit.json").read_text(encoding="utf-8")
        )
        self.assertEqual(audit["status"], "PASS")


if __name__ == "__main__":
    unittest.main()
