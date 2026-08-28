from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "merge-visual-reviews.py"
ROOT = Path(__file__).resolve().parents[2]
SKILL = ROOT / "skills" / "make-lesson" / "SKILL.md"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"


class WorkingWallReviewIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.output = self.root / "visual-review.md"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_merge(
        self,
        findings: Path,
        confirmations: tuple[Path, ...] = (),
    ) -> subprocess.CompletedProcess[str]:
        command = [
            sys.executable,
            str(SCRIPT),
            "--topic",
            "Test lesson",
            "--date",
            "2026-08-24",
            "--output",
            str(self.output),
            "--finding",
            f"Working wall={findings}",
        ]
        for confirmation in confirmations:
            command += ["--confirmation", f"Working wall={confirmation}"]
        return subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_standard_wall_findings_merge_as_pass(self) -> None:
        findings = self.root / "findings-working-wall.md"
        findings.write_text(
            """# Working-wall visual review

## Checked
- One A3 card, one rendered page, readable at wall size.

## Repairs completed during review
- None.

## Blocking faults still needing repair
- None.

## Designer repair required
- None.

## Minor issues remaining
- None.

## Flags for the teacher
- None.

## Notes
- None.

## Carry-across pages
- Page 1: fraction-bar model.
""",
            encoding="utf-8",
        )
        completed = self.run_merge(findings)
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "PASS")
        self.assertIn("`PASS`", self.output.read_text(encoding="utf-8"))

    def test_open_wall_finding_blocks_package(self) -> None:
        findings = self.root / "findings-working-wall.md"
        findings.write_text(
            """# Working-wall findings - Test lesson - 2026-08-24

## Checked
- One A3 card and one rendered page.

## Repairs completed during review
- None.

## Blocking faults still needing repair

### WORKING-WALL-001
- Classification: BLOCKING
- Location: Working wall, page 1, card 1, title panel
- Finding: The title is too small to read from wall distance.
- Required change: Enlarge the existing title within the settled card layout.
- Already passed: The card content, worked example and page count.
- Existing BUILD_DIAGNOSTIC: None - visual-only finding
- Changed: None - no repair yet
- Unchanged: Not applicable yet
- Potential cross-resource impact: None
- Outcome: OPEN
- Verification evidence: None - not yet verified

## Designer repair required
- None.

## Minor issues remaining
- None.

## Flags for the teacher
- None.

## Notes
- None.

## Carry-across pages
- Page 1: worked example shared with the deck.
""",
            encoding="utf-8",
        )

        completed = self.run_merge(findings)

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "BLOCKED")
        self.assertIn(
            "`BLOCKED`",
            self.output.read_text(encoding="utf-8"),
        )
        self.assertIn(
            "WORKING-WALL-001",
            self.output.read_text(encoding="utf-8"),
        )

    def test_plain_bullet_wall_fault_is_rejected_instead_of_passing(
        self,
    ) -> None:
        findings = self.root / "findings-working-wall.md"
        findings.write_text(
            """# Working-wall findings - Test lesson - 2026-08-24

## Checked
- One A3 card and one rendered page.

## Repairs completed during review
- None.

## Blocking faults still needing repair
- The title is too small to read from wall distance.

## Designer repair required
- None.

## Minor issues remaining
- None.

## Flags for the teacher
- None.

## Notes
- None.

## Carry-across pages
- None.
""",
            encoding="utf-8",
        )

        completed = self.run_merge(findings)

        self.assertEqual(completed.returncode, 1)
        self.assertIn(
            "does not begin with a stable-ID finding block",
            completed.stderr,
        )
        self.assertFalse(self.output.exists())

    def test_trailing_plain_bullet_after_valid_finding_is_rejected(self) -> None:
        # Regression: a structurally valid finding block followed by a plain
        # bullet used to be silently ignored, letting a resolved finding turn
        # the package into a false PASS while the trailing fault vanished.
        findings = self.root / "findings-working-wall.md"
        findings.write_text(
            """# Working-wall findings - Test lesson - 2026-08-24

## Checked
- One A3 card and one rendered page.

## Repairs completed during review
- None.

## Blocking faults still needing repair

### WORKING-WALL-001
- Classification: BLOCKING
- Location: Working wall, page 1
- Finding: Title was too small.
- Required change: Enlarge the title.
- Already passed: Main content.
- Existing BUILD_DIAGNOSTIC: None - visual-only finding
- Changed: Title enlarged.
- Unchanged: Main content unchanged.
- Potential cross-resource impact: None
- Outcome: FIXED
- Verification evidence: New manifest, page 1.

## Designer repair required
- None.

## Minor issues remaining
- None.

## Flags for the teacher
- None.

## Notes
- None.

## Carry-across pages
- Page 1: worked example shared with the deck.
""",
            encoding="utf-8",
        )

        # Positive control: without the trailing bullet the same review
        # merges, so only the unaccounted content is being rejected.
        completed = self.run_merge(findings)
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "PASS")
        self.output.unlink()

        findings.write_text(
            findings.read_text(encoding="utf-8").replace(
                "- Verification evidence: New manifest, page 1.\n",
                "- Verification evidence: New manifest, page 1.\n\n"
                "- Card 2 is still unreadable from wall distance.\n",
            ),
            encoding="utf-8",
        )

        completed = self.run_merge(findings)

        self.assertEqual(completed.returncode, 1)
        self.assertIn(
            "no stable-ID finding block accounts for",
            completed.stderr,
        )
        self.assertFalse(self.output.exists())

    def test_trailing_plain_bullet_after_valid_repair_outcome_is_rejected(
        self,
    ) -> None:
        findings = self.root / "findings-working-wall.md"
        findings.write_text(
            """# Working-wall findings - Test lesson - 2026-08-24

## Checked
- One A3 card and one rendered page.

## Repairs completed during review
- None.

## Blocking faults still needing repair

### WORKING-WALL-001
- Classification: BLOCKING
- Location: Working wall, page 1, card 1, title panel
- Finding: The title is too small to read from wall distance.
- Required change: Enlarge the existing title within the settled card layout.
- Already passed: The card content, worked example and page count.
- Existing BUILD_DIAGNOSTIC: None - visual-only finding
- Changed: None - no repair yet
- Unchanged: Not applicable yet
- Potential cross-resource impact: None
- Outcome: OPEN
- Verification evidence: None - not yet verified

## Designer repair required
- None.

## Minor issues remaining
- None.

## Flags for the teacher
- None.

## Notes
- None.

## Carry-across pages
- Page 1: worked example shared with the deck.
""",
            encoding="utf-8",
        )

        confirmation = self.root / "findings-working-wall-confirmation.md"
        confirmation.write_text(
            """# Working-wall confirmation - Test lesson - 2026-08-24

## Repair outcomes

### WORKING-WALL-001
- Outcome: FIXED
- Changed: Title enlarged within the settled card layout.
- Unchanged: Main content unchanged.
- Potential cross-resource impact: None
- Verification evidence: New render manifest, page 1 verified.
- Observed result: Title readable at wall distance.
""",
            encoding="utf-8",
        )

        # Positive control: the valid outcome closes the open finding.
        completed = self.run_merge(findings, confirmations=(confirmation,))
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "PASS")
        self.output.unlink()

        confirmation.write_text(
            confirmation.read_text(encoding="utf-8").replace(
                "- Observed result: Title readable at wall distance.\n",
                "- Observed result: Title readable at wall distance.\n\n"
                "- Card 2 is still unreadable from wall distance.\n",
            ),
            encoding="utf-8",
        )

        completed = self.run_merge(findings, confirmations=(confirmation,))

        self.assertEqual(completed.returncode, 1)
        self.assertIn(
            "no stable-ID repair outcome block accounts for",
            completed.stderr,
        )
        self.assertFalse(self.output.exists())

    def test_unverified_wall_beside_verified_deck_needs_no_consistency_and_stays_unverified(
        self,
    ) -> None:
        # One comparable resource (the deck, with a verified final render
        # manifest) plus one HTML-only/unverified working wall: no consistency
        # worker is required, the wall findings still enter the deterministic
        # final merge, and the package remains UNVERIFIED.
        skill = (
            SKILL.read_text(encoding="utf-8")
            + "\n"
            + PLAYBOOK.read_text(encoding="utf-8")
        )
        flat = " ".join(skill.split())
        for token in (
            "When two or more comparable resources exist, build the "
            "deterministic consistency overview and launch Visual "
            "Consistency Reviewer once.",
            "Use `--consistency-required` only when two or more comparable "
            "resources required the specialist comparison.",
            "Use `PASS`, `BLOCKED` or `UNVERIFIED` exactly.",
            "Never relabel unavailable review as pass.",
            "Missing or stale evidence causes rerender of only the named "
            "resource, not a full pipeline replay.",
        ):
            self.assertIn(token, flat)

        deck = self.root / "findings-deck.md"
        deck.write_text(
            """# Deck findings - Test lesson - 2026-08-24

## Checked
- Deck: 12 slides.

## Repairs completed during review
- None.

## Blocking faults still needing repair
- None.

## Designer repair required
- None.

## Minor issues remaining
- None.

## Flags for the teacher
- None.

## Notes
- None.

## Carry-across pages
- Page 2: fraction-bar model.
""",
            encoding="utf-8",
        )

        wall = self.root / "findings-working-wall.md"
        wall.write_text(
            """# Working-wall findings - Test lesson - 2026-08-24

Review state: UNVERIFIED
Reason: PDF_SKIPPED: no Chrome on this machine, so the wall exists only as fallback HTML.

## Notes
- Visual verification unavailable: PDF_SKIPPED: no Chrome on this machine, so the wall exists only as fallback HTML.
""",
            encoding="utf-8",
        )

        completed = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--topic",
                "Test lesson",
                "--date",
                "2026-08-24",
                "--output",
                str(self.output),
                "--finding",
                f"Deck={deck}",
                "--finding",
                f"Working wall={wall}",
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "UNVERIFIED")
        merged = self.output.read_text(encoding="utf-8")
        self.assertIn("`UNVERIFIED`", merged)
        # Both resources' findings entered the deterministic final merge.
        self.assertIn("Deck: 12 slides.", merged)
        self.assertIn("PDF_SKIPPED: no Chrome on this machine", merged)

    def test_unverified_wall_remains_unverified(self) -> None:
        findings = self.root / "findings-working-wall.md"
        findings.write_text(
            """# Working-wall visual review

## Review state
`UNVERIFIED`

## Notes
- PDF rendering was unavailable.
""",
            encoding="utf-8",
        )
        completed = self.run_merge(findings)
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "UNVERIFIED")
        self.assertIn("`UNVERIFIED`", self.output.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
