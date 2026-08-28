"""Deterministic tests for resolve-filing.py placement.

Run: python test_resolve_filing.py   (or: pytest test_resolve_filing.py)

The resolver reads two test-only env vars so a test needs neither the real
SharePoint drive nor the real calendar:
  SP_BASE   the SharePoint root that find_year_dir() globs
  SP_TODAY  the value date.today() should return, as YYYY-MM-DD
"""
import os, subprocess, sys, tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "resolve-filing.py"

# Summer term 6 2026 starts Monday 1 June. Week 1 = Mon 1 .. Fri 5 June.
TERM_MD = (
    "| Term | Starts | Ends |\n"
    "| --- | --- | --- |\n"
    "| Summer, term 6 | Monday 1 June 2026 | Monday 20 July 2026 |\n"
)

def run(tmp, occupied, today="2026-06-01"):
    base = Path(tmp)
    term_md = base / "Term.md"
    term_md.write_text(TERM_MD, encoding="utf-8")
    maths = base / "2025-2026 - Year 4" / "Summer 2" / "Week 1" / "Maths"
    for day, fname in occupied.items():
        (maths / day).mkdir(parents=True, exist_ok=True)
        (maths / day / fname).write_text("x", encoding="utf-8")
    env = dict(os.environ, SP_BASE=str(base), SP_TODAY=today)
    out = subprocess.run(
        [sys.executable, str(SCRIPT), str(term_md), "4", "Maths"],
        capture_output=True, text=True, env=env,
    )
    kv = {}
    for line in out.stdout.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            kv[k] = v
    return kv, out

def test_places_friday_after_last_lesson_skipping_empty_monday():
    # Mon empty, Tue/Wed/Thu hold lessons. 186 must land on Friday, not Monday.
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run(tmp, {
            "Tuesday": "183 - a.pptx",
            "Wednesday": "184 - b.pptx",
            "Thursday": "185 - c.pptx",
        })
        assert kv.get("DAY") == "Friday", out.stdout + out.stderr

def test_monday_assessment_pdf_counts_and_pushes_to_tuesday():
    # A .pdf assessment makes Monday "taken", so the lesson goes to Tuesday.
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run(tmp, {"Monday": "assessment.pdf"})
        assert kv.get("DAY") == "Tuesday", out.stdout + out.stderr

def test_empty_week_places_monday():
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run(tmp, {})
        assert kv.get("DAY") == "Monday", out.stdout + out.stderr

if __name__ == "__main__":
    failed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn(); print("PASS", name)
            except AssertionError as e:
                failed += 1; print("FAIL", name, str(e)[:200])
    sys.exit(1 if failed else 0)
