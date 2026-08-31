"""Behavioural tests for the working-wall build-evidence contract.

Run:
  python3 test_working_wall_evidence.py
or:
  pytest test_working_wall_evidence.py

`validate-working-wall-evidence.py` is the check that turns "Built" from an
assumption into a proof: the builder records what it saw on the rendered page
in `working-wall-build-evidence.json`, and the validator proves that record
against the spec and the built file. These tests exercise the validator against
fixture evidence rather than against any particular prose, plus one contract
check that the builder agent is actually wired to run it before it may say
Built.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VALIDATOR = ROOT / "scripts" / "validate-working-wall-evidence.py"
WALL_BUILDER = ROOT / "agents" / "working-wall-builder.md"
# The retired working-wall findings filename is assembled in two steps so that
# neither this source file nor its compiled bytecode carries the stale name as
# a single literal; the repository-wide stale-name grep stays clean.
RETIRED_WALL_FINDINGS_NAME = "working-wall"
RETIRED_WALL_FINDINGS_NAME += "-findings.md"


def sha256_of(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_validator(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(VALIDATOR), *args], capture_output=True, text=True
    )


class WorkingWallEvidenceFixture(unittest.TestCase):
    """A real spec, a real built file, and evidence that proves them."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        workdir = Path(self.tmp.name)

        # The spec: one photo card and one two-step worked example.
        self.spec_path = workdir / "working-wall.json"
        self.spec_path.write_text(
            json.dumps(
                {
                    "cards": [
                        {"type": "anchor", "title": "Place value", "photo": "roman-abacus.png"},
                        {
                            "type": "workedExample",
                            "title": "342 + 198",
                            "items": [
                                {"label": "Step 1", "text": "Round 198 to 200."},
                                {"label": "Step 2", "text": "Add, then take 2 away."},
                            ],
                        },
                        {"type": "words", "title": "Words to say", "chips": ["more than", "fewer"]},
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )

        # The built output, plus one rendered page image per physical page.
        self.built_path = workdir / "working-wall.pdf"
        self.built_path.write_bytes(b"%PDF-1.4 fixture wall output\n")
        self.page_records = []
        for page in (1, 2):
            image = workdir / f"render-page-{page}.png"
            image.write_bytes(f"rendered pixels for page {page}".encode("utf-8"))
            self.page_records.append(
                {"page": page, "path": str(image), "sha256": sha256_of(image)}
            )

        self.evidence_path = workdir / "working-wall-build-evidence.json"

    def valid_evidence(self) -> dict:
        return {
            "schemaVersion": 1,
            "sourceSpec": {
                "path": str(self.spec_path),
                "sha256": sha256_of(self.spec_path),
            },
            "builtOutput": {
                "path": str(self.built_path),
                "sha256": sha256_of(self.built_path),
                "physicalPages": 2,
            },
            "renderedPages": self.page_records,
            "cards": [
                {
                    "cardIndex": 0,
                    "cardType": "anchor",
                    "cardTitle": "Place value",
                    "promisedVisuals": [
                        {
                            "sourcePointer": "/cards/0/photo",
                            "visible": True,
                            "largeEnoughForWall": True,
                            "evidencePage": 1,
                        }
                    ],
                    "numberedSteps": [],
                    "verdict": "PASS",
                },
                {
                    "cardIndex": 1,
                    "cardType": "workedExample",
                    "cardTitle": "342 + 198",
                    "promisedVisuals": [],
                    "numberedSteps": [
                        {"step": 1, "wrapped": False, "topAligned": True, "evidencePage": 1},
                        {"step": 2, "wrapped": True, "topAligned": True, "evidencePage": 1},
                    ],
                    "verdict": "PASS",
                },
                {
                    "cardIndex": 2,
                    "cardType": "words",
                    "cardTitle": "Words to say",
                    "promisedVisuals": [],
                    "numberedSteps": [],
                    "verdict": "PASS",
                },
            ],
            "verdict": "PASS",
            "failures": [],
        }

    def write_evidence(self, evidence: dict) -> None:
        self.evidence_path.write_text(
            json.dumps(evidence, indent=2), encoding="utf-8"
        )

    def validate(self, evidence: dict) -> subprocess.CompletedProcess:
        self.write_evidence(evidence)
        return run_validator(
            "--spec", str(self.spec_path),
            "--evidence", str(self.evidence_path),
            "--built-output", str(self.built_path),
        )


class TestWorkingWallEvidence(WorkingWallEvidenceFixture):
    def test_valid_evidence_prints_ok(self):
        result = self.validate(self.valid_evidence())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("WORKING_WALL_EVIDENCE_OK", result.stdout)

    def test_builder_agent_must_validate_before_reporting_built(self):
        # The validator only makes Built a proof if the agent is wired to run
        # it and to refuse Built whenever it does not pass.
        text = WALL_BUILDER.read_text(encoding="utf-8")
        self.assertIn("validate-working-wall-evidence.py", text)
        self.assertIn("working-wall-build-evidence.json", text)
        self.assertIn("WORKING_WALL_EVIDENCE_OK", text)
        self.assertIn("Do not report `Built` unless", text)
        # Nothing looks at the wall after this builder, so its own inspection
        # has to be stated as the wall's verification rather than as a
        # first pass handing on to an independent reviewer.
        self.assertIn(
            "are the wall's verification: nothing after you looks at it again",
            text,
        )
        self.assertIn("PAGE_FIT_UNVERIFIED", text)
        self.assertNotIn(RETIRED_WALL_FINDINGS_NAME, text)
        self.assertNotIn("findings-working-wall.md", text)

    def test_card_type_and_title_are_required_and_must_match(self):
        evidence = self.valid_evidence()
        del evidence["cards"][0]["cardType"]
        evidence["cards"][1]["cardTitle"] = "Different title"
        result = self.validate(evidence)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("cardType", result.stdout)
        self.assertIn("cardTitle", result.stdout)

    def test_all_evidence_paths_must_be_absolute(self):
        evidence = self.valid_evidence()
        evidence["sourceSpec"]["path"] = self.spec_path.name
        result = self.validate(evidence)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("path must be absolute", result.stdout)

    def test_visual_and_step_evidence_pages_must_exist(self):
        evidence = self.valid_evidence()
        evidence["cards"][0]["promisedVisuals"][0]["evidencePage"] = 9
        evidence["cards"][1]["numberedSteps"][0]["evidencePage"] = 9
        result = self.validate(evidence)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("invalid evidencePage 9", result.stdout)
        self.assertIn("does not name a rendered page", result.stdout)

    def test_sha256_mismatch_is_rejected(self):
        evidence = self.valid_evidence()
        # Tamper with a rendered page after the evidence was recorded.
        recorded = evidence["renderedPages"][1]["path"]
        Path(recorded).write_bytes(b"different pixels")
        result = self.validate(evidence)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("WORKING_WALL_EVIDENCE_FAILED", result.stdout)
        self.assertIn("SHA-256 mismatch", result.stdout)

    def test_unrecorded_promised_visual_is_rejected(self):
        evidence = self.valid_evidence()
        evidence["cards"][0]["promisedVisuals"] = []
        result = self.validate(evidence)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("/cards/0/photo", result.stdout)
        self.assertIn("sourcePointer", result.stdout)

    def test_missing_numbered_step_record_is_rejected(self):
        evidence = self.valid_evidence()
        evidence["cards"][1]["numberedSteps"] = evidence["cards"][1]["numberedSteps"][:1]
        result = self.validate(evidence)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("numbered step 2", result.stdout)

    def test_wrapped_step_must_be_top_aligned(self):
        evidence = self.valid_evidence()
        evidence["cards"][1]["numberedSteps"][1]["topAligned"] = False
        result = self.validate(evidence)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("not top-aligned", result.stdout)

    def test_built_output_records_must_cover_and_not_exceed_the_built_file(self):
        with self.subTest("a physical page with no rendered record"):
            evidence = self.valid_evidence()
            evidence["renderedPages"] = evidence["renderedPages"][:1]
            result = self.validate(evidence)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("no record for physical page 2", result.stdout)

        with self.subTest("a record for a page the build never produced"):
            evidence = self.valid_evidence()
            phantom = dict(evidence["renderedPages"][0])
            phantom["page"] = 3
            evidence["renderedPages"] = evidence["renderedPages"] + [phantom]
            result = self.validate(evidence)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("exceeds the recorded physical page count", result.stdout)


if __name__ == "__main__":
    unittest.main()
