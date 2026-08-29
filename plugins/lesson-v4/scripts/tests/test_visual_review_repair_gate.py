"""A blocking finding may not reach a verdict with no repair on record.

An unattended run once delivered a package whose deck carried a layout fault
the slide owner could have repaired in one round. The round was never launched.
Nothing noticed, because a skipped repair and a failed one left the same trace:
an `OPEN` finding and a `BLOCKED` verdict. The teacher woke to a deck that was
not classroom-ready and no record that anybody had tried to fix it.

These tests hold the merge to the distinction. Proof that a repair round ran is
the confirmation pass that re-reviewed the finding. Where no repairer could be
put in front of it, the run says so explicitly and the reason reaches the
merged review, and from there the teacher.
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "merge-visual-reviews.py"

FINDING_BLOCK = """### DECK-001
- Classification: {classification}
- Location: Deck, slide 10, evidence-card zone
- Finding: The evidence cards cover the title and clip the answer text.
- Required change: Lay the cards out so the title and full answer stay visible.
- Already passed: Slides 1 to 9 and 11 to 18, and every answer value.
- Existing BUILD_DIAGNOSTIC: None - visual-only finding
- Changed: None - no repair yet
- Unchanged: Not applicable yet
- Potential cross-resource impact: None
- Outcome: {outcome}
- Verification evidence: None - not yet verified"""

DECK_FINDINGS = """# Deck findings - Test lesson - 2026-08-28

## Checked
- Deck: 18 slides.

## Repairs completed during review
- None.

## Blocking faults still needing repair
{blocking}

## Designer repair required
{designer}

## Minor issues remaining
- None.

## Flags for the teacher
- None.

## Notes
- None.

## Carry-across pages
- Main representation: slide 4 shows the appliance-and-plug pairing.
"""

CONFIRMATION = """# Deck confirmation - Test lesson - 2026-08-28

## Repair outcomes

### DECK-001
- Outcome: {outcome}
- Changed: {changed}
- Unchanged: Slides 1 to 9 and 11 to 18.
- Potential cross-resource impact: None
- Verification evidence: Final manifest, slide 10, sha256 abc123.
- Observed result: {observed}
"""


class VisualReviewRepairGateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.output = self.root / "visual-review.md"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write_findings(
        self,
        *,
        classification: str = "BLOCKING",
        outcome: str = "OPEN",
    ) -> Path:
        block = FINDING_BLOCK.format(
            classification=classification, outcome=outcome
        )
        designer_section = classification == "DESIGNER REPAIR REQUIRED"
        path = self.root / "findings-deck.md"
        path.write_text(
            DECK_FINDINGS.format(
                blocking="- None." if designer_section else block,
                designer=block if designer_section else "- None.",
            ),
            encoding="utf-8",
        )
        return path

    def write_confirmation(
        self, *, outcome: str, changed: str, observed: str
    ) -> Path:
        path = self.root / "findings-deck-confirmation.md"
        path.write_text(
            CONFIRMATION.format(
                outcome=outcome, changed=changed, observed=observed
            ),
            encoding="utf-8",
        )
        return path

    def run_merge(
        self,
        findings: Path,
        confirmations: tuple[Path, ...] = (),
        unrepaired: tuple[str, ...] = (),
    ) -> subprocess.CompletedProcess[str]:
        command = [
            sys.executable,
            str(SCRIPT),
            "--topic",
            "Test lesson",
            "--date",
            "2026-08-28",
            "--output",
            str(self.output),
            "--finding",
            f"Deck={findings}",
        ]
        for confirmation in confirmations:
            command += ["--confirmation", f"Deck={confirmation}"]
        for declaration in unrepaired:
            command += ["--unrepaired", declaration]
        return subprocess.run(command, capture_output=True, text=True, check=False)

    # ── The reported failure ─────────────────────────────────────────────

    def test_blocking_finding_with_no_repair_on_record_is_refused(self) -> None:
        completed = self.run_merge(self.write_findings())

        self.assertEqual(completed.returncode, 1)
        self.assertIn("no repair is on record", completed.stderr)
        self.assertIn("DECK-001 (OPEN)", completed.stderr)
        self.assertIn("--unrepaired", completed.stderr)
        self.assertFalse(
            self.output.exists(),
            "a refused merge must write no verdict at all",
        )

    def test_designer_repair_required_also_needs_a_repair_on_record(self) -> None:
        # The eleven unpublished photographs arrived as this classification.
        # It had no owner in the runtime, so nothing was ever launched for it.
        completed = self.run_merge(
            self.write_findings(
                classification="DESIGNER REPAIR REQUIRED",
                outcome="DESIGNER REPAIR REQUIRED",
            )
        )

        self.assertEqual(completed.returncode, 1)
        self.assertIn("DECK-001 (DESIGNER REPAIR REQUIRED)", completed.stderr)
        self.assertFalse(self.output.exists())

    # ── The two honest ways past the gate ────────────────────────────────

    def test_repair_that_ran_and_failed_reaches_a_blocked_verdict(self) -> None:
        completed = self.run_merge(
            self.write_findings(),
            confirmations=(
                self.write_confirmation(
                    outcome="OPEN",
                    changed="Card zone narrowed; the title still overlaps.",
                    observed="Slide 10 still clips the answer text.",
                ),
            ),
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "BLOCKED")
        merged = self.output.read_text(encoding="utf-8")
        self.assertIn(
            "- Repair attempt: attempted and re-reviewed; see Confirmation",
            merged,
        )

    def test_declared_reason_is_accepted_and_reaches_the_merged_review(
        self,
    ) -> None:
        completed = self.run_merge(
            self.write_findings(
                classification="DESIGNER REPAIR REQUIRED",
                outcome="DESIGNER REPAIR REQUIRED",
            ),
            unrepaired=(
                "DECK-001=no-owner-authority: the beat needs a photograph the "
                "closed picture stage cannot supply",
            ),
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "BLOCKED")
        self.assertIn(
            "- Repair attempt: no-owner-authority - the beat needs a "
            "photograph the closed picture stage cannot supply",
            self.output.read_text(encoding="utf-8"),
        )

    def test_repaired_finding_needs_no_declaration(self) -> None:
        # The unaffected control: a repair that worked closes normally and
        # the gate stays out of its way.
        completed = self.run_merge(
            self.write_findings(),
            confirmations=(
                self.write_confirmation(
                    outcome="FIXED",
                    changed="Cards moved below the title.",
                    observed="Title and full answer are visible.",
                ),
            ),
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "PASS")
        self.assertNotIn(
            "Repair attempt", self.output.read_text(encoding="utf-8")
        )

    def test_reviewer_local_repair_closed_in_first_pass_needs_no_confirmation(self) -> None:
        """A reviewer that repaired, rebuilt and looked closes its own finding.

        The cheap local-repair route (edit the spec, rerun REBUILD_COMMAND,
        re-render, look, mark FIXED) only saves its spawns if the merge accepts
        the closed finding from the first-pass file without a separate
        confirmation pass.
        """
        lines = [
            "### DECK-001",
            "- Classification: BLOCKING",
            "- Location: Deck, slide 6, sticky-statement zone",
            "- Finding: The sticky statement renders too small to project.",
            "- Required change: Enlarge the statement within its settled zone.",
            "- Already passed: Every other slide.",
            "- Existing BUILD_DIAGNOSTIC: None - visual-only finding",
            "- Changed: Statement zone share raised within the settled layout.",
            "- Unchanged: Every other entry.",
            "- Potential cross-resource impact: None",
            "- Outcome: FIXED",
            "- Verification evidence: Rebuilt render, slide 6 page image; "
            "statement reads at projection size.",
        ]
        block = "\n".join(lines)
        path = self.root / "findings-deck.md"
        path.write_text(
            DECK_FINDINGS.format(blocking="- None.", designer="- None.").replace(
                "## Repairs completed during review\n- None.",
                "## Repairs completed during review\n" + block,
            ),
            encoding="utf-8",
        )

        completed = self.run_merge(path)

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "PASS")

    def test_clean_review_still_passes_untouched(self) -> None:
        path = self.root / "findings-deck.md"
        path.write_text(
            DECK_FINDINGS.format(blocking="- None.", designer="- None."),
            encoding="utf-8",
        )

        completed = self.run_merge(path)

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "PASS")

    # ── The declaration cannot be used loosely ───────────────────────────

    def test_declaration_for_a_finding_that_is_not_blocking_is_refused(
        self,
    ) -> None:
        completed = self.run_merge(
            self.write_findings(classification="MINOR", outcome="ACCEPTED MINOR"),
            unrepaired=("DECK-001=owner-unavailable: slide-designer is missing",),
        )

        self.assertEqual(completed.returncode, 1)
        self.assertIn("not still blocking", completed.stderr)
        self.assertIn("DECK-001 (ACCEPTED MINOR)", completed.stderr)

    def test_declaration_for_an_unknown_finding_is_refused(self) -> None:
        completed = self.run_merge(
            self.write_findings(),
            unrepaired=(
                "DECK-001=owner-unavailable: slide-designer is missing",
                "DECK-009=owner-unavailable: slide-designer is missing",
            ),
        )

        self.assertEqual(completed.returncode, 1)
        self.assertIn("DECK-009 (no such finding)", completed.stderr)

    def test_reason_code_outside_the_vocabulary_is_refused(self) -> None:
        completed = self.run_merge(
            self.write_findings(),
            unrepaired=("DECK-001=attempted-not-fixed: the repair did not hold",),
        )

        self.assertEqual(completed.returncode, 1)
        self.assertIn("reason must be one of", completed.stderr)
        self.assertFalse(self.output.exists())

    def test_declaration_without_a_reason_is_refused(self) -> None:
        completed = self.run_merge(
            self.write_findings(),
            unrepaired=("DECK-001=no-owner-authority:   ",),
        )

        self.assertEqual(completed.returncode, 1)
        self.assertIn("must say which owner was missing", completed.stderr)

    def test_malformed_declaration_is_refused(self) -> None:
        for value, expected in (
            ("DECK-001", "must use ID=reason-code: detail"),
            ("deck-1=owner-unavailable: x", "malformed finding ID"),
            ("DECK-001=owner-unavailable", "must give a reason code then a colon"),
        ):
            with self.subTest(value=value):
                completed = self.run_merge(
                    self.write_findings(), unrepaired=(value,)
                )
                self.assertEqual(completed.returncode, 1)
                self.assertIn(expected, completed.stderr)

    def test_the_same_finding_cannot_be_declared_twice(self) -> None:
        completed = self.run_merge(
            self.write_findings(),
            unrepaired=(
                "DECK-001=owner-unavailable: slide-designer is missing",
                "DECK-001=no-owner-authority: nobody may change the task",
            ),
        )

        self.assertEqual(completed.returncode, 1)
        self.assertIn("declares DECK-001 twice", completed.stderr)


if __name__ == "__main__":
    unittest.main()
