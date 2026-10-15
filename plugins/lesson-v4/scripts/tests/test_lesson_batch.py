"""Deterministic tests for lesson-batch.py: where a set of lessons is planned to go,
and how a lesson's session is read back.

Run: python test_lesson_batch.py   (or: pytest test_lesson_batch.py)

No session is started: planning and reading back are tested against fixture
folders and a written session log, with LESSON_RESOURCES_HOME and
LESSON_RESOURCES_TODAY standing in for the teacher's settings and today.
"""
import json, os, subprocess, sys, tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "lesson-batch.py"

# Summer term 6 2026 starts Monday 1 June. Week 1 = Mon 1 .. Fri 5 June.
TERM_MD = (
    "| Term | Starts | Ends |\n"
    "| --- | --- | --- |\n"
    "| Summer, term 6 | Monday 1 June 2026 | Monday 20 July 2026 |\n"
)


def setup(tmp, occupied=(), today="2026-06-01", sorting=True):
    base = Path(tmp)
    (base / "Term.md").write_text(TERM_MD, encoding="utf-8")
    for rel in occupied:
        (base / "2025-2026 - Year 4" / rel).mkdir(parents=True, exist_ok=True)
        (base / "2025-2026 - Year 4" / rel / "lesson.pptx").write_text("x", encoding="utf-8")
    home = base / "plugin-home"
    home.mkdir(exist_ok=True)
    delivery = {"folder": str(base), "sorting": sorting, "termDates": str(base / "Term.md")}
    (home / "settings.json").write_text(json.dumps({"delivery": delivery}), encoding="utf-8")
    env = dict(os.environ, LESSON_RESOURCES_HOME=str(home), LESSON_RESOURCES_TODAY=today)
    output = base / "out"
    output.mkdir()
    return base, output, env


def run(env, *args):
    out = subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, env=env)
    return out.stdout + out.stderr


def plan(tmp, lessons, **kw):
    base, output, env = setup(tmp, **kw)
    plan_file = base / "plan.json"
    plan_file.write_text(json.dumps({"lessons": lessons}), encoding="utf-8")
    text = run(env, "plan", str(plan_file), "--output", str(output))
    batch = json.loads((output / "working" / "lesson-batch" / "batch.json").read_text(encoding="utf-8"))
    return text, batch, output, env


def lesson(tag, subject="Maths"):
    return {"tag": tag, "year": "Year 4", "subject": subject, "brief": f"Y4 {subject}: {tag}"}


def test_same_subject_lessons_land_on_consecutive_days_in_the_order_given():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, _, _ = plan(tmp, [lesson("subtraction"), lesson("exchange"), lesson("checking")])
        days = [l["destination"]["day"] for l in batch["lessons"]]
        assert days == ["Monday", "Tuesday", "Wednesday"], text


def test_the_set_starts_after_the_last_filled_day_as_a_single_run_would():
    # A sequence only moves forward: the empty Tuesday before Wednesday's lesson
    # is not a slot, so the set starts on Thursday.
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, _, _ = plan(tmp, [lesson("a"), lesson("b")],
                                 occupied=["Summer 2/Week 1/Maths/Monday", "Summer 2/Week 1/Maths/Wednesday"])
        days = [l["destination"]["day"] for l in batch["lessons"]]
        assert days == ["Thursday", "Friday"], text


def test_a_week_that_runs_past_friday_rolls_into_the_next():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, _, _ = plan(tmp, [lesson("a"), lesson("b")], today="2026-06-04")
        got = [(l["destination"]["week"], l["destination"]["day"]) for l in batch["lessons"]]
        assert got == [(1, "Thursday"), (1, "Friday")], text


def test_three_lessons_from_thursday_reach_monday_of_week_two():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, _, _ = plan(tmp, [lesson("a"), lesson("b"), lesson("c")], today="2026-06-04")
        got = [(l["destination"]["week"], l["destination"]["day"]) for l in batch["lessons"]]
        assert got == [(1, "Thursday"), (1, "Friday"), (2, "Monday")], text


def test_a_weekly_subject_takes_the_next_week_and_mixed_subjects_keep_their_own_sequence():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, _, _ = plan(tmp, [lesson("food chains", "Science"), lesson("subtraction"),
                                       lesson("teeth", "Science"), lesson("exchange")])
        dest = [l["destination"] for l in batch["lessons"]]
        assert (dest[0]["week"], dest[0]["day"]) == (1, ""), text
        assert (dest[2]["week"], dest[2]["day"]) == (2, ""), text
        assert [dest[1]["day"], dest[3]["day"]] == ["Monday", "Tuesday"], text


def test_the_save_line_reaches_the_lesson_message_but_not_without_sorting():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, _, _ = plan(tmp, [lesson("a"), lesson("b")])
        assert "PLANNED b: Summer 2 > Week 1 > Maths > Tuesday" in text, text
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, _, _ = plan(tmp, [lesson("a"), lesson("b")], sorting=False)
        assert all("destination" not in l for l in batch["lessons"]), text


def test_one_lesson_is_refused_as_a_batch():
    with tempfile.TemporaryDirectory() as tmp:
        base, output, env = setup(tmp)
        (base / "plan.json").write_text(json.dumps({"lessons": [lesson("a")]}), encoding="utf-8")
        text = run(env, "plan", str(base / "plan.json"), "--output", str(output))
        assert "BATCH_ERROR" in text and "ordinary run" in text, text


def test_a_session_log_is_read_into_steps_and_a_finish():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, output, env = plan(tmp, [lesson("a"), lesson("b")])
        for l in batch["lessons"]:
            l.update(status="building", pid=0, seen=0)
        (output / "working" / "lesson-batch" / "batch.json").write_text(json.dumps(batch), encoding="utf-8")
        events = [
            {"type": "assistant", "message": {"content": [{"type": "text", "text": "Designing the lesson."}]}},
            {"type": "assistant", "parent_tool_use_id": "x",
             "message": {"content": [{"type": "text", "text": "a worker's own words"}]}},
            {"type": "assistant", "message": {"content": [{"type": "text", "text": "Slides and sheets now."}]}},
            {"type": "result", "subtype": "success", "is_error": False, "result": "All made."},
        ]
        log = output / "working" / "lesson-batch" / "a" / "run.jsonl"
        log.parent.mkdir(parents=True, exist_ok=True)
        log.write_text("\n".join(json.dumps(e) for e in events), encoding="utf-8")
        text = run(env, "watch", "--output", str(output), "--max-minutes", "0")
        assert "STEP a: Designing the lesson." in text, text
        assert "a worker's own words" not in text, text
        assert "FINISHED a" in text, text
        # b has no log and no live session: it stopped before saying anything.
        assert "STOPPED b" in text, text
        assert "BATCH_DONE" in text, text


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
