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

def test_out_of_term_date_prints_error_and_exits_nonzero():
    # A date outside every teaching term used to print ERROR but exit 0, so an
    # unattended run had no way to notice the destination never resolved.
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run(tmp, {}, today="2026-08-10")
        assert out.returncode != 0, out.stdout + out.stderr
        assert "ERROR: target date not in any term period" in out.stdout
        assert "TERM_FOLDER" not in kv

# Autumn term 1 2026 opened on Tuesday 1 September. The teacher's drive calls
# Mon 7 - Fri 11 September "Week 1" and keeps Thu 3 / Fri 4 in a folder they
# named by hand, so weeks count from the first Monday, not the first day.
AUTUMN_TERM_MD = (
    "| Term | Starts | Ends |\n"
    "| --- | --- | --- |\n"
    "| Autumn, term 1 | Tuesday 1 September 2026 | Friday 23 October 2026 |\n"
)

def run_autumn(tmp, subject, today, occupied=None):
    base = Path(tmp)
    term_md = base / "Term.md"
    term_md.write_text(AUTUMN_TERM_MD, encoding="utf-8")
    for rel in occupied or []:
        p = base / "2026-2027 - Year 4" / "Autumn 1" / rel
        p.mkdir(parents=True, exist_ok=True)
        (p / "lesson.pptx").write_text("x", encoding="utf-8")
    env = dict(os.environ, SP_BASE=str(base), SP_TODAY=today)
    out = subprocess.run(
        [sys.executable, str(SCRIPT), str(term_md), "4", subject],
        capture_output=True, text=True, env=env,
    )
    kv = dict(l.split("=", 1) for l in out.stdout.splitlines() if "=" in l)
    return kv, out

def test_mid_week_term_start_keeps_tuesday_in_the_same_week():
    # The reported fault: with Monday 14 September filled, the next maths
    # lesson belongs in Week 2 Tuesday, not a Week 3 that does not exist yet.
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run_autumn(tmp, "Maths", "2026-09-13", ["Week 2/Maths/Monday"])
        assert (kv.get("WEEK_NUM"), kv.get("DAY")) == ("2", "Tuesday"), out.stdout

def test_year_written_as_words_still_reads_the_drive():
    # A Codex run passed "Year 4", missed the folder and offered a full Monday.
    for year in ("Year 4", "Y4"):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            (base / "Term.md").write_text(AUTUMN_TERM_MD, encoding="utf-8")
            day = base / "2026-2027 - Year 4" / "Autumn 1" / "Week 2" / "Maths" / "Monday"
            day.mkdir(parents=True)
            (day / "lesson.pptx").write_text("x", encoding="utf-8")
            env = dict(os.environ, SP_BASE=str(base), SP_TODAY="2026-09-13")
            out = subprocess.run(
                [sys.executable, str(SCRIPT), str(base / "Term.md"), year, "Maths"],
                capture_output=True, text=True, env=env,
            )
            kv = dict(l.split("=", 1) for l in out.stdout.splitlines() if "=" in l)
            assert (kv.get("DAY"), kv.get("DRIVE_CHECKED")) == ("Tuesday", "yes"), out.stdout

def test_missing_year_folder_says_the_drive_was_not_checked():
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run_autumn(tmp, "Maths", "2026-09-13")
        assert kv.get("DRIVE_CHECKED") == "no", out.stdout

def test_mid_week_term_start_thursday_is_week_1():
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run_autumn(tmp, "Science", "2026-09-10")
        assert kv.get("WEEK_NUM") == "1", out.stdout

def test_opening_days_before_first_monday_ask_rather_than_guess():
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run_autumn(tmp, "Maths", "2026-09-03")
        assert out.returncode == 2, out.stdout + out.stderr
        assert kv.get("OPENING_WEEK") == "yes" and "WEEK_NUM" not in kv, out.stdout

def test_full_opening_week_spills_into_week_1_monday():
    # A lesson planned on Friday 4 September rolls forward to Monday 7, Week 1.
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run_autumn(tmp, "Maths", "2026-09-04")
        assert (kv.get("WEEK_NUM"), kv.get("DAY")) == ("1", "Monday"), out.stdout

if __name__ == "__main__":
    failed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn(); print("PASS", name)
            except AssertionError as e:
                failed += 1; print("FAIL", name, str(e)[:200])
    sys.exit(1 if failed else 0)
