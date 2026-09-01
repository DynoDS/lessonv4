"""Behavioural tests for the complete-run-report contract.

Run:
  python3 test_run_report.py
or:
  pytest test_run_report.py

`validate-run-report.py` proves the one complete run report: headings in
order, package status honest, every earned resource accounted for, every
delivered path real, and retained picture/friction evidence reported. These
tests exercise it against fixture reports rather than against any particular
prose.
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
    """A working dir with earned resources and real output paths."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.working = Path(self.tmp.name) / "working" / "lesson"
        self.output = Path(self.tmp.name) / "output"
        for path in (self.working, self.output):
            path.mkdir(parents=True)

        self.write_json(self.working / "lesson.json", {"slides": [{"cards": []}]})
        self.write_json(self.working / "worksheet.json", {"sheets": {"expected": []}})
        # The wall and stick-in designers run on every lesson and answer with
        # their spec file; an empty list is the recorded "no" answer.
        self.write_json(self.working / "working-wall.json", {"cards": []})
        self.write_json(self.working / "stick-in-sheets.json", {"items": []})

        self.slides_out = self.output / "Beatrix Potter.pptx"
        self.slides_out.write_bytes(b"slides fixture")
        self.worksheets_out = self.output / "Beatrix Potter - Worksheets.pdf"
        self.worksheets_out.write_bytes(b"worksheet fixture")
        self.answers_out = self.output / "Beatrix Potter - Answers.txt"
        self.answers_out.write_bytes(b"answers fixture")

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
            "launches": "WORKER_LAUNCH_AUDIT_OK: 6 named workers launched at their declared model and effort",
            # A deck was built, so the record has to say whether there was a
            # drawing library to search. It is its own part because most tests
            # override the picture bullets and every one of them still owes
            # this line.
            "library": "OPTIONAL_PICTURE_LIBRARY: verified against /srv/educational-svg",
            "picture": "- None.",
            "helper": "- None.",
            "friction": "- None.",
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
            f"## Worker launches\n\n{parts['launches']}\n\n"
            f"## Picture results\n\n{parts['library']}\n\n{parts['picture']}\n\n"
            f"## Helper gaps\n\n{parts['helper']}\n\n"
            f"## Friction\n\n{parts['friction']}\n\n"
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

    def test_report_without_the_worker_launch_audit_is_rejected(self):
        """A run whose workers ran on the wrong model must not report clean.

        The audit is only worth having if skipping it is visible, so the report
        has to carry one of its terminal markers rather than any prose.
        """
        report = self.write_report({"launches": "- All workers launched correctly."})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("worker launches", result.stdout)

    def test_the_worker_timeline_is_carried_under_the_audit_marker(self):
        """The audit now prints a WORKER_TIMELINE block after its marker and
        the playbook copies both verbatim; a report carrying the block is the
        normal case, not a deviation."""
        self.write_report(
            {
                "launches": (
                    "WORKER_LAUNCH_AUDIT_OK: 6 named workers launched at their declared model and effort\n"
                    "WORKER_TIMELINE: session=C:/sessions/rollout-a.jsonl\n"
                    "  lesson-designer  lesson_designer  launched 18:57:51  returned 19:12:47  ran 14m 57s  waited 0m 11s\n"
                    "WORKER_TIMELINE_TOTAL: span 55m 8s from first launch to last serviced; "
                    "critical path lesson_designer (15m 8s launch to serviced); 1 workers, 1 returned"
                )
            }
        )
        result = self.validate()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_failed_audit_is_an_acceptable_thing_to_report(self):
        """The record stays honest; it does not withhold a package over this."""
        report = self.write_report(
            {"launches": "WORKER_LAUNCH_AUDIT_FAILED: 8 of 8 named workers did not launch at their declared model and effort"}
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_missing_wall_decision_is_rejected(self):
        """A run that never spawned the wall designer must not report clean.

        The observed failure: several lessons shipped with no working wall and
        no record that anyone had decided against one, because the spawn was
        silently skipped. The decision file is the proof the designer ran; a
        run without it must exclude the wall with a reason.
        """
        (self.working / "working-wall.json").unlink()
        report = self.write_report()
        result = self.validate(report)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("working wall", result.stdout)
        self.assertIn("no decision is on record", result.stdout)

    def test_missing_stick_in_decision_is_rejected(self):
        (self.working / "stick-in-sheets.json").unlink()
        report = self.write_report()
        result = self.validate(report)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("stick-in sheets", result.stdout)
        self.assertIn("no decision is on record", result.stdout)

    def test_missing_decision_excluded_with_reason_passes(self):
        """A degraded run (no wall role installed) stays honest and deliverable."""
        (self.working / "working-wall.json").unlink()
        report = self.write_report(
            overrides={
                "outcome": "Package status: PARTIAL",
                "excluded": (
                    "- Working wall: NOT DELIVERED - working-wall-designer role "
                    "file missing from this installation."
                ),
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def stick_in_skipped_by_design(self):
        """The approved design said none, so no stick-in designer ran."""
        (self.working / "stick-in-sheets.json").unlink()
        self.write_json(
            self.working / "lesson-design.json",
            {
                "resourceOpportunities": {
                    "stickIn": {
                        "decision": "none",
                        "sourceUnitIds": [],
                        "reason": "Every moment leaves children writing answers in their own hand.",
                    },
                    "workingWall": {"decision": "uncertain", "sourceUnitIds": [], "reason": "Maybe."},
                }
            },
        )

    def test_a_stick_in_the_design_skipped_is_reported_as_not_needed(self):
        """A skip the reviewed lesson decided is COMPLETE, once the teacher can see it."""
        self.stick_in_skipped_by_design()
        report = self.write_report(
            overrides={
                "excluded": (
                    "- stick-in sheets: NOT DELIVERED - not needed: every moment "
                    "leaves children writing answers in their own hand."
                ),
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("RUN_REPORT_OK", result.stdout)

    def test_a_stick_in_the_design_skipped_must_still_be_on_the_record(self):
        self.stick_in_skipped_by_design()
        result = self.validate(self.write_report())
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("the approved design recorded none", result.stdout)
        self.assertIn("not needed:", result.stdout)

    def test_empty_decision_files_need_no_report_entry(self):
        """cards: [] and items: [] are answered decisions, not omissions."""
        result = self.validate(self.write_report())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

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

    def test_legacy_failed_attempt_receipt_is_not_a_report_dependency(self):
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

    def test_failed_publication_must_be_named_too(self):
        """A picture that failed to publish is a missing picture.

        The finaliser writes `picture_publish_failed`, which the report gate did
        not count as a failure, so a lesson could ship a slide with no photograph
        and the teacher would read nothing about it.
        """
        self.write_json(
            self.working / "orchestration-receipts" / "picture-terminal" / "def.json",
            {
                "schemaVersion": 1,
                "filename": "unsplash/failed-lamp.jpg",
                "terminalState": "picture_publish_failed",
            },
        )
        report = self.write_report(overrides={"outcome": "Package status: PARTIAL"})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unsplash/failed-lamp.jpg", result.stdout)

        report = self.write_report(overrides={
            "outcome": "Package status: PARTIAL",
            "picture": "- unsplash/failed-lamp.jpg: could not be published",
        })
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_published_picture_creates_no_report_obligation(self):
        self.write_json(
            self.working / "orchestration-receipts" / "picture-terminal" / "ghi.json",
            {
                "schemaVersion": 1,
                "filename": "unsplash/good-lamp.jpg",
                "terminalState": "published",
            },
        )
        result = self.validate(self.write_report())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_promised_picture_that_was_never_attempted_must_be_named(self):
        """A picture stage that never started writes no receipt at all.

        When the compile or manifest gate rejects the contract, no image scout
        runs and no terminal receipt exists, so a report built from receipts
        alone reads a deck with no photographs as nothing wrong. The contract is
        the surviving record of what the lesson owed the teacher.
        """
        self.write_json(
            self.working / "photo-requirements.json",
            {
                "schema_version": 2,
                "lesson_name": "electrical appliances",
                "photos": [{"id": "photo-001", "filename": "unsplash/kettle.jpg"}],
            },
        )
        report = self.write_report(overrides={"outcome": "Package status: PARTIAL"})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unsplash/kettle.jpg", result.stdout)

        report = self.write_report(overrides={
            "outcome": "Package status: PARTIAL",
            "picture": "- unsplash/kettle.jpg: picture stage unavailable, slide runs without it",
        })
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_promised_picture_that_never_arrived_cannot_be_complete(self):
        self.write_json(
            self.working / "photo-requirements.json",
            {
                "schema_version": 2,
                "lesson_name": "electrical appliances",
                "photos": [{"id": "photo-001", "filename": "unsplash/kettle.jpg"}],
            },
        )
        report = self.write_report(overrides={
            "outcome": "Package status: COMPLETE",
            "picture": "- unsplash/kettle.jpg: picture stage unavailable",
        })
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("PARTIAL", result.stdout)

    def test_promised_picture_that_was_published_creates_no_obligation(self):
        """The discrimination case: the contract promised it and the run got it."""
        self.write_json(
            self.working / "photo-requirements.json",
            {
                "schema_version": 2,
                "lesson_name": "electrical appliances",
                "photos": [{"id": "photo-001", "filename": "unsplash/kettle.jpg"}],
            },
        )
        self.write_json(
            self.working / "orchestration-receipts" / "picture-terminal" / "jkl.json",
            {
                "schemaVersion": 1,
                "filename": "unsplash/kettle.jpg",
                "terminalState": "published",
            },
        )
        result = self.validate(self.write_report())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_legacy_helper_receipt_is_not_a_report_dependency(self):
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
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_every_friction_line_must_be_copied(self):
        friction = (
            "AGENT: worksheet-builder | FRICTION: I expected the fixed build to "
            "reach Chrome for the PDF; Chrome was unavailable, so I retained the "
            "HTML - run harmed: no printable worksheet."
        )
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

    def test_legacy_audit_is_not_required(self):
        self.write_json(
            self.working / "orchestration-audit.json",
            {"status": "FAIL", "contracts": 99, "receipts": 0},
        )
        report = self.write_report()
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

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


class TestDrawingLibraryStateReachesTheRecord(RunReportCase):
    """Whether there was a drawing library to search is part of the record.

    A deck with no Educational SVG in it is a good deck when the library was
    searched and had nothing for these slides, and a broken one when there was
    no library on the machine to ask. Both closed as a clean run and read the
    same afterwards, so a teacher asking "why did it not use the drawings?"
    could not find out from anything the run kept - and the answer kept being
    sought in the guidance, where the fault was not.
    """

    def test_a_deck_run_without_the_library_line_is_rejected(self):
        report = self.write_report(overrides={"library": ""})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("OPTIONAL_PICTURE_LIBRARY", result.stdout)

    def test_an_unavailable_library_is_a_perfectly_valid_thing_to_record(self):
        """The record stays honest; it does not withhold a package over this."""
        report = self.write_report(
            overrides={
                "library": (
                    "OPTIONAL_PICTURE_LIBRARY: UNAVAILABLE - this run had no "
                    "drawing library, so no drawing was possible and no search "
                    "evidence was checked"
                )
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_run_that_built_no_deck_owes_no_library_line(self):
        """The discrimination case: no slides, no optional-picture pass."""
        self.write_json(self.working / "lesson.json", {"slides": []})
        report = self.write_report(
            overrides={
                "outcome": "Package status: PARTIAL",
                "library": "",
                "delivered": f"- worksheets: `{self.worksheets_out}`",
                "excluded": "- Slides: NOT DELIVERED - no slide beats were earned.",
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


class TestFrictionRecordIsTraceable(RunReportCase):
    """The run's obstacles, blocks and repairs, collected so they can be worked on.

    Friction used to arrive as loose sentences: "the validator rejected the
    worksheet's mixed shape, so I corrected it", "the sandbox denied Python, so I
    reran with elevated execution". Fifteen of those told a reader that a run had
    been bumpy and nothing about which agent met what, whether anything was
    actually wrong, or what the repairer who came in afterwards had done. Blocks
    and repair rounds lived somewhere else again, so the one question worth
    asking - which of these is worth engineering away - could not be asked of any
    single file.

    So every line names its agent and its kind, a repair carries a verdict, and a
    repair sits under the block it answered.
    """

    def write_friction(self, *lines: str) -> None:
        (self.working / "friction.md").write_text(
            "\n".join(lines) + "\n", encoding="utf-8"
        )

    def report_with(self, *lines: str):
        self.write_friction(*lines)
        return self.write_report(
            overrides={
                "outcome": "Package status: PARTIAL",
                "friction": "\n".join(f"- {line}" for line in lines),
            }
        )

    def test_an_untagged_friction_line_is_rejected(self):
        report = self.report_with(
            "Friction: the sandbox denied Python, so I reran with elevated execution."
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("is not a tagged record", result.stdout)

    def test_a_block_and_its_repair_read_together(self):
        report = self.report_with(
            "AGENT: slide-designer | BLOCK: VISUAL_SELF_CHECK_FAILED slides 13, 15 "
            "- the required evidence photographs get 1.49 inches on their short "
            "side, under the 1.6 inch board-distance floor.",
            "AGENT: slide-designer | FRICTION: I expected a repair pass to widen "
            "the photographs; height was what bound them, so widening changed "
            "nothing - run harmed: three passes spent, fault unmoved.",
            "AGENT: slide-designer-focused-repair | REPAIR: slides 13, 15 "
            "photograph floor - split each slide's four photographs across two "
            "consecutive slides - FIXED: the rebuilt deck reports 2.455 inches "
            "on the short side.",
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_repair_without_a_verdict_is_rejected(self):
        report = self.report_with(
            "AGENT: slide-designer | BLOCK: VISUAL_SELF_CHECK_FAILED slide 13 "
            "- photographs under the readable floor.",
            "AGENT: slide-designer-focused-repair | REPAIR: slide 13 photograph "
            "floor - moved the captions into the instruction line.",
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("no FIXED or NOT FIXED verdict", result.stdout)

    def test_a_repair_that_fixed_nothing_is_a_valid_record(self):
        """The most useful line in the file, so it must not be hard to write."""
        report = self.report_with(
            "AGENT: working-wall-designer | BLOCK: OPEN_LAYOUT_FINDING - the "
            "renderer hard-codes sticky-knowledge photo sizing.",
            "AGENT: working-wall-designer-focused-repair | REPAIR: open layout "
            "finding - nothing; the sizing is not inside the owned specification "
            "- NOT FIXED: the rebuilt wall reports the same finding.",
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_repair_with_no_block_above_it_is_rejected(self):
        report = self.report_with(
            "AGENT: slide-designer-focused-repair | REPAIR: slide 13 - split the "
            "photographs across two slides - FIXED: rebuilt and rechecked.",
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("names no block above it", result.stdout)

    def test_plain_friction_needs_no_block(self):
        """The discrimination case: not every run that met friction was blocked."""
        report = self.report_with(
            "AGENT: image-scout | FRICTION: I expected the first Unsplash query "
            "to return a usable kettle; the first two returned kitchens, so I "
            "narrowed the query - run unharmed."
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_run_with_no_friction_file_still_passes(self):
        result = self.validate(self.write_report())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


class TestHelperGapsReachTheTeacher(RunReportCase):
    """A visual no helper drew is news, not housekeeping.

    When a run answers a missing helper with a generated picture, or builds one
    it could not install, the same lesson type degrades the same way next week
    until someone acts. That used to live only in the run's own head, so it
    reached nobody. The evidence now exists on disk, and the report has to
    carry it.
    """

    def write_verdict(self, *decisions):
        self.write_json(
            self.working / "helper-check.json",
            {"schemaVersion": 1, "decisions": list(decisions)},
        )

    def test_a_substitute_absent_from_the_report_is_rejected(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "substitute",
                "reason": "no helper draws a balanced plate",
            }
        )
        result = self.validate(self.write_report())
        self.assertEqual(result.returncode, 1)
        self.assertIn("helper gaps", result.stdout)
        self.assertIn("rep-001/blank", result.stdout)

    def test_a_substitute_named_in_the_report_passes(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "substitute",
                "reason": "no helper draws a balanced plate",
            }
        )
        report = self.write_report(
            overrides={
                "helper": (
                    "- rep-001/blank (slides): no helper draws a balanced "
                    "plate; the slide carries a generated picture instead."
                )
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_pending_helper_folder_must_be_reported(self):
        (self.working / "pending-helper" / "balanced-plate").mkdir(parents=True)
        result = self.validate(self.write_report())
        self.assertEqual(result.returncode, 1)
        self.assertIn("pending helper balanced-plate", result.stdout)

    def test_a_fully_covered_run_needs_no_helper_gap_line(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "part-whole-model",
            }
        )
        result = self.validate(self.write_report())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
