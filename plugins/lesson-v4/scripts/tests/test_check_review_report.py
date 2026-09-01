"""The orchestrator routes on a review's Result line, so the report must be
deterministically checkable: present, correctly shaped, exact value. The
retired review packet used to verify this; this small check is what a route
actually needs from it.
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-review-report.py"

GOOD = """# Design Review - Topic - 2026-08-31

## Result
`APPROVED`

## Corrections made
- None.

## Redesign required
- None.

## Flags for the teacher
- None.
"""


def run(report_text: str | None, allowed: str = "APPROVED,REDESIGN REQUIRED"):
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "design-review.md"
        if report_text is not None:
            path.write_text(report_text, encoding="utf-8")
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--report", str(path),
             "--allowed-results", allowed],
            capture_output=True, text=True,
        )


def test_a_well_formed_report_passes_and_echoes_the_result():
    result = run(GOOD)
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "REVIEW_REPORT_OK: APPROVED"


def test_a_missing_report_is_refused():
    result = run(None)
    assert result.returncode == 1
    assert "missing report file" in result.stderr


def test_a_free_text_verdict_is_refused():
    result = run(GOOD.replace("`APPROVED`", "Looks fine to me"))
    assert result.returncode == 1
    assert "not one of" in result.stderr


def test_a_result_outside_the_allowed_set_is_refused():
    # The wording reviewer's only Result is APPROVED; a REDESIGN REQUIRED
    # from it must fail the route rather than silently pass.
    result = run(GOOD.replace("`APPROVED`", "`REDESIGN REQUIRED`"),
                 allowed="APPROVED")
    assert result.returncode == 1


def test_a_report_missing_its_headings_is_refused():
    result = run(GOOD.replace("## Flags for the teacher", "## Flags"))
    assert result.returncode == 1
    assert "Flags for the teacher" in result.stderr


if __name__ == "__main__":
    for name, value in sorted(globals().items()):
        if name.startswith("test_") and callable(value):
            value()
    print("ok")
