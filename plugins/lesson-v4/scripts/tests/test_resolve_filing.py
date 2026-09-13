"""Deterministic tests for resolve-filing.py placement.

Run: python test_resolve_filing.py   (or: pytest test_resolve_filing.py)

Each test writes its own settings into its own plugin folder
(LESSON_RESOURCES_HOME), so it needs neither a real save folder nor the real
calendar; LESSON_RESOURCES_TODAY stands in for today, as YYYY-MM-DD.
"""
import json, os, subprocess, sys, tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "resolve-filing.py"


def settings_env(base, term_md=None, sorting=True, folder=True, today=None):
    """An environment whose plugin folder saves to `base`, sorted by `term_md`."""
    home = Path(base) / "plugin-home"
    home.mkdir(exist_ok=True)
    delivery = {}
    if folder:
        delivery = {"folder": str(base), "sorting": sorting}
        if term_md:
            delivery["termDates"] = str(term_md)
    (home / "settings.json").write_text(json.dumps({"delivery": delivery}), encoding="utf-8")
    env = dict(os.environ, LESSON_RESOURCES_HOME=str(home))
    if today:
        env["LESSON_RESOURCES_TODAY"] = today
    return env

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
    env = settings_env(base, term_md, today=today)
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "4", "Maths"],
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
    env = settings_env(base, term_md, today=today)
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "4", subject],
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
            env = settings_env(base, base / "Term.md", today="2026-09-13")
            out = subprocess.run(
                [sys.executable, str(SCRIPT), year, "Maths"],
                capture_output=True, text=True, env=env,
            )
            kv = dict(l.split("=", 1) for l in out.stdout.splitlines() if "=" in l)
            assert (kv.get("DAY"), kv.get("DRIVE_CHECKED")) == ("Tuesday", "yes"), out.stdout

def test_missing_year_folder_says_the_drive_was_not_checked():
    with tempfile.TemporaryDirectory() as tmp:
        kv, out = run_autumn(tmp, "Maths", "2026-09-13")
        assert kv.get("DRIVE_CHECKED") == "no", out.stdout

def _sync_record(working, slug, subject, week, day=None, with_design=True, record_name="delivery.json"):
    import json
    folder = working / slug
    (folder / "build-results").mkdir(parents=True)
    if with_design:
        (folder / "lesson-design.json").write_text("{}", encoding="utf-8")
    cmd = ["python", "deliver_files.py", "--year", "4", "--term-folder", "Autumn 1",
           "--week", str(week), "--subject", subject]
    if day:
        cmd += ["--day", day]
    (folder / "build-results" / record_name).write_text(
        json.dumps({"ok": True, "command": cmd}), encoding="utf-8")
    return folder

def _resolve_with_working(base, subject, today):
    (base / "Term.md").write_text(AUTUMN_TERM_MD, encoding="utf-8")
    env = settings_env(base, base / "Term.md", today=today)
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "Year 4", subject,
         "--working", str(base / "working")],
        capture_output=True, text=True, env=env,
    )
    return dict(l.split("=", 1) for l in out.stdout.splitlines() if "=" in l), out

def test_previous_lesson_is_the_latest_earlier_slot_in_the_same_subject():
    # Target Wednesday 16 Sept, Week 2. Tuesday's maths is the one to reuse;
    # Monday is older, Thursday is later, science is another subject, and a
    # run with no design file has nothing to read.
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        w = base / "working"
        _sync_record(w, "monday-maths", "Maths", 2, "Monday")
        tuesday = _sync_record(w, "tuesday-maths", "Maths", 2, "Tuesday")
        _sync_record(w, "thursday-maths", "Maths", 2, "Thursday")
        _sync_record(w, "science", "Science", 2)
        _sync_record(w, "broken-maths", "Maths", 2, "Tuesday", with_design=False)
        kv, out = _resolve_with_working(base, "Maths", "2026-09-16")
        assert kv.get("DAY") == "Wednesday", out.stdout
        assert Path(kv.get("PREVIOUS_LESSON", "")).name == tuesday.name, out.stdout

def test_previous_weekly_lesson_comes_from_an_earlier_week():
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        w = base / "working"
        last_week = _sync_record(w, "science-week-1", "Science", 1)
        _sync_record(w, "science-week-2", "Science", 2)
        kv, out = _resolve_with_working(base, "Science", "2026-09-14")
        assert kv.get("WEEK_NUM") == "2", out.stdout
        assert Path(kv.get("PREVIOUS_LESSON", "")).name == last_week.name, out.stdout

def test_no_earlier_lesson_prints_an_empty_previous_lesson():
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        (base / "working").mkdir()
        kv, out = _resolve_with_working(base, "Maths", "2026-09-14")
        assert kv.get("PREVIOUS_LESSON") == "", out.stdout

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


def test_a_run_record_from_before_the_rename_still_counts_as_the_previous_lesson():
    # Lessons built before 4.2.186 recorded their filing as sharepoint.json.
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        w = base / "working"
        tuesday = _sync_record(w, "tuesday-maths", "Maths", 2, "Tuesday", record_name="sharepoint.json")
        kv, out = _resolve_with_working(base, "Maths", "2026-09-16")
        assert Path(kv.get("PREVIOUS_LESSON", "")).name == tuesday.name, out.stdout


def _design(working, slug, year, subject):
    folder = working / slug
    folder.mkdir(parents=True)
    (folder / "lesson-design.json").write_text(
        json.dumps({"lesson": {"yearGroup": year, "subject": subject}}), encoding="utf-8")
    return folder


def _plain_run(base, subject, settings):
    env = settings_env(base, **settings)
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "Year 4", subject, "--working", str(base / "working")],
        capture_output=True, text=True, env=env,
    )
    return dict(l.split("=", 1) for l in out.stdout.splitlines() if "=" in l), out


def test_no_save_folder_means_the_resources_stay_where_they_were_built():
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        (base / "working").mkdir()
        kv, out = _plain_run(base, "Maths", {"folder": False})
        assert out.returncode == 0, out.stdout + out.stderr
        assert kv.get("DELIVERY") == "none" and "SAVE_FOLDER" not in kv and "TERM_FOLDER" not in kv, out.stdout


def test_a_plain_save_folder_has_no_calendar_and_no_slot():
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        (base / "working").mkdir()
        kv, out = _plain_run(base, "Maths", {"sorting": False})
        assert out.returncode == 0, out.stdout + out.stderr
        assert (kv.get("DELIVERY"), kv.get("SAVE_FOLDER")) == ("folder", str(base)), out.stdout
        assert "TERM_FOLDER" not in kv and "DAY" not in kv, out.stdout


def test_sorting_without_term_dates_is_a_plain_folder():
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        (base / "working").mkdir()
        kv, out = _plain_run(base, "Maths", {"sorting": True})
        assert kv.get("DELIVERY") == "folder", out.stdout


def test_without_sorting_the_previous_lesson_is_the_latest_in_the_same_year_and_subject():
    import time
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        w = base / "working"
        _design(w, "older-maths", 4, "Maths")
        time.sleep(0.05)
        _design(w, "science", 4, "Science")
        _design(w, "year-5-maths", 5, "Maths")
        time.sleep(0.05)
        latest = _design(w, "latest-maths", 4, "Maths")
        kv, out = _plain_run(base, "Maths", {"folder": False})
        assert Path(kv.get("PREVIOUS_LESSON", "")).name == latest.name, out.stdout


def test_term_dates_are_read_whichever_way_the_school_names_its_terms():
    sys.path.insert(0, str(SCRIPT.parent))
    import plugin_settings
    with tempfile.TemporaryDirectory() as tmp:
        dates = Path(tmp) / "dates.md"
        dates.write_text(
            "| Term | Starts | Ends |\n| --- | --- | --- |\n"
            "| Autumn, term 1 | Tuesday 1 September 2026 | Friday 23 October 2026 |\n"
            "| Autumn half term | Monday 26 October 2026 | Friday 30 October 2026 |\n"
            "| Autumn 2 | 2 November 2026 | 18 December 2026 |\n"
            "| Spring term 3 | 4 January 2027 | 12 February 2027 |\n"
            "| Summer 2 | 7 June 2027 | 21 July 2027 |\n",
            encoding="utf-8")
        names = [name for name, _, _ in plugin_settings.read_term_dates(dates)]
        assert names == ["Autumn 1", "Autumn 2", "Spring 1", "Summer 2"], names

if __name__ == "__main__":
    failed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn(); print("PASS", name)
            except AssertionError as e:
                failed += 1; print("FAIL", name, str(e)[:200])
    sys.exit(1 if failed else 0)
