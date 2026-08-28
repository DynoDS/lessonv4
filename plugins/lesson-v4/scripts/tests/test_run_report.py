"""Behavioural tests for the complete-run-report contract.

Run:
  python3 test_run_report.py
or:
  pytest test_run_report.py

`validate-run-report.py` proves the one complete run report: headings in
order, package status honest, every earned resource accounted for, every
delivered path real, and the completion records matching the orchestration
audit. These tests exercise it against fixture reports rather than against
any particular prose.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VALIDATOR = ROOT / "scripts" / "validate-run-report.py"


def run_validator(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(VALIDATOR), *args], capture_output=True, text=True
    )


class RunReportCase(unittest.TestCase):
    """A working dir with earned resources, real output paths and an audit."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.working = Path(self.tmp.name) / "working" / "lesson"
        self.output = Path(self.tmp.name) / "output"
        for path in (self.working, self.output):
            path.mkdir(parents=True)

        self.write_json(self.working / "lesson.json", {"slides": [{"cards": []}]})
        self.write_json(self.working / "worksheet.json", {"sheets": {"expected": []}})

        self.slides_out = self.output / "Beatrix Potter.pptx"
        self.slides_out.write_bytes(b"slides fixture")
        self.worksheets_out = self.output / "Beatrix Potter - Worksheets.pdf"
        self.worksheets_out.write_bytes(b"worksheet fixture")
        self.answers_out = self.output / "Beatrix Potter - Answers.txt"
        self.answers_out.write_bytes(b"answers fixture")

        self.write_json(
            self.working / "orchestration-audit.json",
            {
                "schemaVersion": 1,
                "contracts": 2,
                "receipts": 2,
                "missingReceipts": [],
                "unexpectedReceipts": [],
                "invalidReceipts": [],
                "status": "PASS",
            },
        )

        self.report = self.working / "run-report.md"

    def write_json(self, path: Path, payload) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return path

    def write_report(self, overrides=None) -> Path:
        parts = {
            "outcome": "Package status: COMPLETE",
            "delivered": (
                f"- slides: `{self.slides_out}`\n"
                f"- worksheets: `{self.worksheets_out}`\n"
                f"- worksheets: `{self.answers_out}`"
            ),
            "excluded": "- None.",
            "blocking": "- None.",
            "accepted": "- None.",
            "build": "- None.",
            "picture": "- None.",
            "helper": "- None.",
            "friction": "- None.",
            "completion": "contracts=2 receipts=2",
            "shared": "Status: NOT REQUIRED",
        }
        parts.update(overrides or {})
        body = (
            "# Lesson run report\n\n"
            f"## Outcome\n\n{parts['outcome']}\n\n"
            f"## Delivered resources\n\n{parts['delivered']}\n\n"
            f"## Excluded resources\n\n{parts['excluded']}\n\n"
            f"## Blocking faults\n\n{parts['blocking']}\n\n"
            f"## Accepted minor issues\n\n{parts['accepted']}\n\n"
            f"## Build attempts\n\n{parts['build']}\n\n"
            f"## Picture results\n\n{parts['picture']}\n\n"
            f"## Helper gaps\n\n{parts['helper']}\n\n"
            f"## Friction\n\n{parts['friction']}\n\n"
            f"## Completion records\n\n{parts['completion']}\n\n"
            f"## Shared investigation log\n\n{parts['shared']}\n"
        )
        self.report.write_text(body, encoding="utf-8")
        return self.report

    def validate(self, report=None) -> subprocess.CompletedProcess:
        return run_validator(
            "--working-dir", str(self.working),
            "--output-dir", str(self.output),
            "--report", str(report or self.report),
        )


class TestRunReport(RunReportCase):
    def test_valid_report_prints_ok(self):
        report = self.write_report()
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("RUN_REPORT_OK", result.stdout)

    def test_hidden_wall_is_rejected(self):
        # The wall was earned (its spec has cards) but the report names it
        # nowhere: not delivered, not excluded. An earned resource cannot just
        # vanish from the record.
        self.write_json(self.working / "working-wall.json", {"cards": [{"type": "words"}]})
        report = self.write_report()
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("working wall", result.stdout)
        self.assertIn("not accounted for", result.stdout)

    def test_excluded_wall_reported_exactly_is_partial_and_passes(self):
        self.write_json(self.working / "working-wall.json", {"cards": [{"type": "words"}]})
        report = self.write_report(
            overrides={
                "outcome": "Package status: PARTIAL",
                "excluded": (
                    "- Working wall: NOT DELIVERED - three visual blockers; "
                    "repair blocked by renderer limitations."
                ),
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_excluded_earned_resource_cannot_be_complete(self):
        self.write_json(self.working / "working-wall.json", {"cards": [{"type": "words"}]})
        report = self.write_report(
            overrides={
                "outcome": "Package status: COMPLETE",
                "excluded": (
                    "- Working wall: NOT DELIVERED - three visual blockers; "
                    "repair blocked by renderer limitations."
                ),
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("PARTIAL, not COMPLETE", result.stdout)

    def test_delivered_path_must_exist(self):
        ghost = self.output / "ghost.pdf"
        report = self.write_report(
            overrides={"delivered": f"- slides: `{ghost}`"}
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("path does not exist", result.stdout)

    def test_missing_failed_attempt_is_rejected(self):
        self.write_json(
            self.working / "orchestration-receipts" / "worksheet-builder-repair-1.json",
            {
                "schemaVersion": 1,
                "logicalAttemptId": "worksheet-builder-repair-1",
                "assignment": {
                    "role": "orchestrator-fixed-build",
                    "identity": "worksheet repair build",
                },
                "declaredState": "FAILED",
            },
        )
        report = self.write_report(overrides={"outcome": "Package status: PARTIAL"})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("worksheet-builder-repair-1", result.stdout)

        report = self.write_report(overrides={
            "outcome": "Package status: PARTIAL",
            "build": "- worksheet-builder-repair-1: FAILED",
        })
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_picture_failure_must_be_named(self):
        self.write_json(
            self.working / "orchestration-receipts" / "picture-terminal" / "abc.json",
            {
                "schemaVersion": 1,
                "filename": "unsplash/missing-fan.jpg",
                "terminalState": "unsatisfied",
            },
        )
        report = self.write_report(overrides={"outcome": "Package status: PARTIAL"})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unsplash/missing-fan.jpg", result.stdout)

        report = self.write_report(overrides={
            "outcome": "Package status: PARTIAL",
            "picture": "- unsplash/missing-fan.jpg: unsatisfied",
        })
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_helper_gap_must_be_named(self):
        self.write_json(
            self.working / "orchestration-receipts" / "slide-designer-helper-1.json",
            {
                "schemaVersion": 1,
                "logicalAttemptId": "slide-designer-helper-1",
                "assignment": {"role": "slide-designer", "identity": "slides"},
                "declaredState": "SLIDE_HELPER_GAP",
            },
        )
        report = self.write_report(overrides={"outcome": "Package status: PARTIAL"})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("slide-designer-helper-1", result.stdout)

        report = self.write_report(overrides={
            "outcome": "Package status: PARTIAL",
            "helper": "- slide-designer-helper-1: SLIDE_HELPER_GAP",
        })
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_every_friction_line_must_be_copied(self):
        friction = "Fixed-build friction: worksheet - Chrome unavailable; HTML retained."
        (self.working / "friction.md").write_text(friction + "\n", encoding="utf-8")
        report = self.write_report(overrides={"outcome": "Package status: PARTIAL"})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn(friction, result.stdout)

        report = self.write_report(overrides={
            "outcome": "Package status: PARTIAL",
            "friction": f"- {friction}",
        })
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_audit_count_mismatch_is_rejected(self):
        report = self.write_report(
            overrides={"completion": "contracts=9 receipts=9"}
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("contracts=9", result.stdout)
        self.assertIn("2", result.stdout)

    def test_queued_shared_log_without_path_is_rejected(self):
        report = self.write_report(
            overrides={"shared": "Status: QUEUED"}
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("`Path:` line", result.stdout)

    def test_queued_shared_log_with_pending_file_passes(self):
        pending = self.working / "pending-build-review-log.md"
        pending.write_text("- [ ] one queued line\n", encoding="utf-8")
        report = self.write_report(
            overrides={"shared": f"Status: QUEUED\nPath: `{pending}`"}
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
