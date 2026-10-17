"""Deterministic tests for lesson-batch.py: where a set of lessons is planned to go,
and how a lesson's session is read back.

Run: python test_lesson_batch.py   (or: pytest test_lesson_batch.py)

No session is started: planning and reading back are tested against fixture
folders and a written session log, with LESSON_RESOURCES_HOME and
LESSON_RESOURCES_TODAY standing in for the teacher's settings and today.
"""
import json, os, subprocess, sys, tempfile, types
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "lesson-batch.py"

# No test starts the set's keeper: it would carry lessons on with real
# sessions. The keeper's decisions are tested one look at a time instead.
os.environ["LESSON_BATCH_KEEPER"] = "off"

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


def test_watch_passes_on_what_the_keeper_reported_once_each():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, output, env = plan(tmp, [lesson("a"), lesson("b")])
        for l in batch["lessons"]:
            l.update(status="building", pid=0)
        (output / "working" / "lesson-batch" / "batch.json").write_text(json.dumps(batch), encoding="utf-8")
        (output / "working" / "lesson-batch" / "events.log").write_text(
            "STEP a: Designing the lesson.\nPAUSED b: the usage limit was reached\n", encoding="utf-8")
        text = run(env, "watch", "--output", str(output), "--max-minutes", "0")
        assert "STEP a: Designing the lesson." in text and "PAUSED b" in text, text
        text = run(env, "watch", "--output", str(output), "--max-minutes", "0")
        assert "STEP a" not in text and "WATCH_QUIET" in text, text


def test_a_session_waits_for_its_own_workers_however_long_they_take():
    # A print-mode session that ends its turn with a worker still running
    # stops that worker after ten minutes unless told to wait; a lesson
    # designer takes longer, so three of five lessons on 15 October 2026
    # "finished" mid-design with nothing made.
    import importlib.util
    sys.path.insert(0, str(SCRIPT.parent))
    spec = importlib.util.spec_from_file_location("lesson_batch", SCRIPT)
    batch_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(batch_mod)
    seen = {}

    class FakeProcess:
        pid = 1

    def fake_popen(command, **kw):
        seen.update(kw)
        return FakeProcess()

    import types
    batch_mod.subprocess = types.SimpleNamespace(Popen=fake_popen, DEVNULL=subprocess.DEVNULL)
    batch_mod.claude_command = lambda: "claude"
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        batch_mod.start_session(Path(tmp), {"key": "a"}, "message", "note")
    assert (seen.get("env") or {}).get("CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS") == "0", seen.get("env")
    # Without this, Claude Code copies every untracked file in the checkout
    # (8 GB on 17 October 2026) before a session's first two commands, and the
    # setup check that opens each lesson waited 20 seconds to 4 minutes for it.
    assert (seen.get("env") or {}).get("CLAUDE_CODE_BASH_EDIT_DIFF") == "0", seen.get("env")


# Keeping a set going. Lessons 28 to 32 (15 October 2026): the usage limit
# stopped every lesson at 17:05, each log ended with the limit message and an
# empty "success", and the watcher called four of five finished with nothing
# saved. A restart then started a second session for Wednesday while its first
# was still alive, and crashed renaming the log that session held open. The
# event shapes below are copied from those logs.

SESSION = "ce8e0f57-e525-40e7-ae71-4310d6dc70ae"


def say(text):
    return {"type": "assistant", "session_id": SESSION,
            "message": {"model": "claude-opus-5-5", "content": [{"type": "text", "text": text}]}}


def limit_events(resets_at):
    return [
        {"type": "system", "subtype": "init", "session_id": SESSION},
        say("The worksheets are being designed now, alongside the slides."),
        {"type": "result", "subtype": "success", "is_error": False, "session_id": SESSION,
         "result": "The worksheets are being designed now, alongside the slides."},
        {"type": "rate_limit_event", "session_id": SESSION,
         "rate_limit_info": {"status": "rejected", "resetsAt": resets_at, "rateLimitType": "five_hour"}},
        {"type": "assistant", "session_id": SESSION, "message": {"model": "<synthetic>", "content": [
            {"type": "text", "text": "You've hit your monthly spend limit"}]}, "parent_tool_use_id": "x"},
        {"type": "result", "subtype": "success", "is_error": True, "api_error_status": 429,
         "api_error": "usage_limit_reached", "session_id": SESSION,
         "result": "You've hit your monthly spend limit · your session limit resets 5:10pm (Europe/London)"},
        {"type": "result", "subtype": "success", "is_error": False, "session_id": SESSION, "result": ""},
    ]


class Keeper:
    """The batch module with sessions faked: which are alive, which were started or closed."""

    def __init__(self, tmp, lessons=("a",)):
        import time as _time
        self.now = _time.time()
        self.text, batch, self.output, self.env = plan(tmp, [lesson(t) for t in lessons] + [lesson("spare")])
        self.module = load_batch_module()
        self.live, self.started, self.closed = set(), [], []
        keeper = self

        class FakeProcess:
            def __init__(self):
                self.pid = 500 + len(keeper.started)

        def fake_popen(command, **kw):
            keeper.started.append(command)
            return FakeProcess()

        self.module.subprocess = types.SimpleNamespace(Popen=fake_popen, DEVNULL=subprocess.DEVNULL)
        self.module.claude_command = lambda: "claude"
        self.module.alive = lambda pid: pid in keeper.live
        self.module.end_session = lambda pid: (keeper.closed.append(pid), keeper.live.discard(pid))
        for l in batch["lessons"]:
            l.update(status="finished" if l["tag"] == "spare" else "building", pid=100,
                     firstStarted="2026-01-01T00:00:00", log="run-1.jsonl")
        self.save(batch)

    @property
    def folder(self):
        return self.output / "working" / "lesson-batch" / "a"

    def batch(self):
        return json.loads((self.output / "working" / "lesson-batch" / "batch.json").read_text(encoding="utf-8"))

    def save(self, batch):
        (self.output / "working" / "lesson-batch" / "batch.json").write_text(json.dumps(batch), encoding="utf-8")

    def lesson(self, **changes):
        batch = self.batch()
        batch["lessons"][0].update(changes)
        self.save(batch)
        return batch["lessons"][0]

    def log(self, events, name="run-1.jsonl"):
        self.folder.mkdir(parents=True, exist_ok=True)
        (self.folder / name).write_text("\n".join(json.dumps(e) for e in events), encoding="utf-8")

    def look(self):
        events = self.output / "working" / "lesson-batch" / "events.log"
        before = events.read_text(encoding="utf-8") if events.exists() else ""
        self.module.keep_once(self.output)
        return events.read_text(encoding="utf-8")[len(before):]

    def saved(self, files, present):
        """The lesson's working folder and its save record, with `present` of `files` in the day folder."""
        work = self.output / "working" / "year-4-maths-a"
        (work / "build-results").mkdir(parents=True, exist_ok=True)
        (work / "teacher-brief.txt").write_text("Y4 Maths: a", encoding="utf-8")
        day = self.output.parent / "drive" / "Monday"
        day.mkdir(parents=True, exist_ok=True)
        for name in present:
            (day / name).write_text("x", encoding="utf-8")
        stdout = f"DESTINATION={day}\n" + "".join(f"FILE={n}\n" for n in files) + "STATUS=COPIED\n"
        (work / "build-results" / "delivery.json").write_text(
            json.dumps({"schemaVersion": 1, "ok": True, "stdout": stdout}), encoding="utf-8")
        return day


def test_a_session_still_running_is_not_finished_by_a_result_line():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp)
        k.live.add(100)
        k.log([say("Designing the lesson."),
               {"type": "assistant", "parent_tool_use_id": "x", "message": {"content": [
                   {"type": "text", "text": "a worker's own words"}]}},
               {"type": "result", "subtype": "success", "is_error": False, "result": "Waiting for the slides."}])
        out = k.look()
        assert "STEP a: Designing the lesson." in out and "a worker's own words" not in out, out
        assert "FINISHED" not in out and k.batch()["lessons"][0]["status"] == "building", out
        assert not k.started and not k.closed, "a running session is left to run"


def test_the_usage_limit_pauses_a_lesson_until_it_resets_then_reopens_its_own_session():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp)
        k.log(limit_events(k.now + 600))
        out = k.look()
        assert "PAUSED a" in out and "FINISHED" not in out, out
        assert k.batch()["lessons"][0]["status"] == "paused" and not k.started, out
        # The limit lifts: the lesson's own conversation is reopened, in a
        # new log, and the old log is left where it was.
        k.log(limit_events(k.now - 120))
        k.lesson(resumeAt=k.now - 60)
        out = k.look()
        assert "CARRYING_ON a" in out and "where each helper stopped" in out, out
        command = k.started[-1]
        assert command[command.index("--resume") + 1] == SESSION, command
        assert "SendMessage" in command[2], command
        assert (k.folder / "run-1.jsonl").exists() and k.batch()["lessons"][0]["log"] == "run-2.jsonl"


def test_a_paused_session_still_alive_at_the_reset_is_closed_before_the_lesson_carries_on():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp)
        k.live.add(100)
        k.log(limit_events(k.now - 120))
        k.lesson(status="paused", resumeAt=k.now - 60)
        k.look()
        assert k.closed == [100] and len(k.started) == 1, (k.closed, k.started)


def test_a_session_that_picked_itself_up_after_the_limit_is_left_alone():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp)
        k.live.add(100)
        k.log(limit_events(k.now - 120) + [
            {"type": "rate_limit_event", "rate_limit_info": {"status": "allowed"}},
            say("The usage limit has reset and both helpers have picked up where they left off.")])
        k.lesson(status="paused", resumeAt=k.now - 60)
        out = k.look()
        assert "picked itself up" in out and not k.started and not k.closed, out
        assert k.batch()["lessons"][0]["status"] == "building"


def test_a_lesson_is_finished_only_when_every_saved_file_is_in_its_day_folder():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp)
        k.log([say("Saved.")])
        files = ["Column subtraction.pptx", "Worksheets.pdf"]
        k.saved(files, present=files[:1])
        out = k.look()
        assert "NOT_SAVED a" in out and "Worksheets.pdf not found" in out, out
        assert not k.started, "a lesson that was made is not built again"
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp)
        k.log([say("Saved.")])
        day = k.saved(files, present=files)
        out = k.look()
        assert f"FINISHED a: saved to {day}" in out and "BATCH_DONE" in out, out


def test_an_unexplained_stop_gets_one_more_go_then_is_handed_back():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp)
        k.log([say("Designing the lesson."),
               {"type": "result", "subtype": "success", "is_error": False, "result": "Designing the lesson."}])
        out = k.look()
        assert "CARRYING_ON a" in out and "one more go" in out and len(k.started) == 1, out
        k.log([say("Building the slides.")], name="run-2.jsonl")
        out = k.look()
        assert "STOPPED a" in out and len(k.started) == 1, out


def test_a_conversation_that_cannot_be_reopened_carries_on_from_the_last_finished_step():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp)
        k.saved([], present=[])
        (k.output / "working" / "year-4-maths-a" / "build-results" / "delivery.json").unlink()
        k.lesson(resumeKind="session", sessionId=SESSION)
        k.log([{"type": "result", "subtype": "error_during_execution", "is_error": True, "result": ""}])
        out = k.look()
        command = k.started[-1]
        assert "--resume" not in command and "Carry on the interrupted lesson in" in command[2], command
        assert k.batch()["lessons"][0].get("retries", 0) == 0, out


def test_resume_never_starts_a_second_session_for_a_lesson():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        k = Keeper(tmp, lessons=("a", "b"))
        batch = k.batch()
        batch["lessons"][0].update(status="paused", resumeAt=k.now + 600)
        batch["lessons"][1].update(status="stopped", pid=101)
        k.save(batch)
        k.live.add(101)
        k.module.resume(["--output", str(k.output)])
        assert not k.started, k.started


# The set's thread. Lessons 28 to 32 (15 October 2026) were built side by side,
# none could read the day before, and the exchange step came out worded four
# ways in four days.

def load_batch_module():
    import importlib.util
    sys.path.insert(0, str(SCRIPT.parent))
    spec = importlib.util.spec_from_file_location("lesson_batch_threads", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def thread_entry(key, steps=("Line up the digits.",)):
    return {"key": key, "methodSteps": list(steps), "newToday": "", "representation": "",
            "wordCards": [{"term": "exchange", "definition": "Swap 1 ten for 10 ones."}]}


def test_lessons_in_one_year_and_subject_share_a_thread_and_a_lone_lesson_does_not():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, output, env = plan(tmp, [lesson("subtraction 1"), lesson("food chains", "Science"),
                                              lesson("subtraction 2")])
        assert "THREAD year-4-maths: subtraction 1, subtraction 2" in text, text
        threads = {l["tag"]: l.get("thread") for l in batch["lessons"]}
        assert threads == {"subtraction 1": "year-4-maths", "food chains": None,
                           "subtraction 2": "year-4-maths"}, threads


def test_a_thread_left_by_an_earlier_set_is_cleared_when_a_new_set_is_planned():
    with tempfile.TemporaryDirectory() as tmp:
        base, output, env = setup(tmp)
        stale = output / "working" / "lesson-batch" / "thread-year-4-maths.json"
        stale.parent.mkdir(parents=True)
        stale.write_text("{}", encoding="utf-8")
        plan_file = base / "plan.json"
        plan_file.write_text(json.dumps({"lessons": [lesson("a"), lesson("b")]}), encoding="utf-8")
        run(env, "plan", str(plan_file), "--output", str(output))
        assert not stale.exists()


def test_thread_check_wants_every_lesson_in_order_with_its_steps_and_cards():
    with tempfile.TemporaryDirectory() as tmp:
        text, batch, output, env = plan(tmp, [lesson("a"), lesson("b")])
        file = output / "working" / "lesson-batch" / "thread-year-4-maths.json"
        assert "has not been written" in run(env, "thread-check", "--output", str(output), "--thread", "year-4-maths")
        file.write_text(json.dumps({"lessons": [thread_entry("b"), thread_entry("a")]}), encoding="utf-8")
        assert "must be a, b, in that order" in run(env, "thread-check", "--output", str(output), "--thread", "year-4-maths")
        broken = thread_entry("b")
        broken["methodSteps"] = "Line up the digits."
        file.write_text(json.dumps({"lessons": [thread_entry("a"), broken]}), encoding="utf-8")
        assert "b: methodSteps must be a list" in run(env, "thread-check", "--output", str(output), "--thread", "year-4-maths")
        file.write_text(json.dumps({"lessons": [thread_entry("a"), thread_entry("b", [])]}), encoding="utf-8")
        assert "THREAD_OK" in run(env, "thread-check", "--output", str(output), "--thread", "year-4-maths")


def test_a_set_waits_for_its_thread_and_each_session_is_started_with_it():
    module = load_batch_module()
    started = []

    class FakeProcess:
        pid = 1

    def fake_popen(command, **kw):
        started.append(kw.get("env") or {})
        return FakeProcess()

    module.subprocess = types.SimpleNamespace(Popen=fake_popen, DEVNULL=subprocess.DEVNULL)
    module.claude_command = lambda: "claude"
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        text, batch, output, env = plan(tmp, [lesson("a"), lesson("b"), lesson("roots", "Science")])
        module.launch(["--output", str(output)])
        # Only the lesson outside the set starts while the thread is missing.
        assert len(started) == 1 and "LESSON_SET_THREAD" not in started[0], started
        file = output / "working" / "lesson-batch" / "thread-year-4-maths.json"
        file.write_text(json.dumps({"lessons": [thread_entry("a"), thread_entry("b")]}), encoding="utf-8")
        module.launch(["--output", str(output)])
        assert [e.get("LESSON_SET_LESSON") for e in started[1:]] == ["a", "b"], started
        assert all(Path(e["LESSON_SET_THREAD"]) == file for e in started[1:]), started


def test_without_thread_starts_the_set_when_the_thread_could_not_be_written():
    module = load_batch_module()
    started = []

    class FakeProcess:
        pid = 1

    module.subprocess = types.SimpleNamespace(
        Popen=lambda command, **kw: started.append(kw.get("env") or {}) or FakeProcess(), DEVNULL=subprocess.DEVNULL)
    module.claude_command = lambda: "claude"
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        text, batch, output, env = plan(tmp, [lesson("a"), lesson("b")])
        module.launch(["--output", str(output), "--without-thread"])
        assert len(started) == 2 and not any("LESSON_SET_THREAD" in e for e in started), started


def test_the_thread_brief_finds_the_lesson_before_the_set_by_plan_number():
    # Lesson 27 was built on Codex in its own folder; an older Codex build of
    # lesson 28 itself sits there too, and is not the lesson before the set.
    import time
    with tempfile.TemporaryDirectory() as tmp:
        base, output, env = setup(tmp)
        codex = base / "codex" / "working"
        for name in ("year-4-maths-lesson-26-column-addition", "year-4-maths-lesson-27-column-addition"):
            (codex / name).mkdir(parents=True)
            (codex / name / "lesson-design.json").write_text(
                json.dumps({"lesson": {"yearGroup": 4, "subject": "Maths"}}), encoding="utf-8")
            time.sleep(0.05)
        (codex / "year-4-maths-lesson-28").mkdir()
        (codex / "year-4-maths-lesson-28" / "lesson-design.json").write_text(
            json.dumps({"lesson": {"yearGroup": 4, "subject": "Maths"}}), encoding="utf-8")
        settings = base / "plugin-home" / "settings.json"
        data = json.loads(settings.read_text(encoding="utf-8"))
        data["workingRoots"] = [str(codex)]
        settings.write_text(json.dumps(data), encoding="utf-8")
        lessons = [{"tag": f"lesson {n}", "year": "4", "subject": "Maths",
                    "brief": f"please make lesson {n} of the plan"} for n in (28, 29)]
        plan_file = base / "plan.json"
        plan_file.write_text(json.dumps({"lessons": lessons}), encoding="utf-8")
        run(env, "plan", str(plan_file), "--output", str(output))
        text = run(env, "thread-brief", "--output", str(output), "--thread", "year-4-maths")
        values = dict(l.split("=", 1) for l in text.splitlines() if "=" in l)
        assert Path(values["PREVIOUS_LESSON"]).name == "year-4-maths-lesson-27-column-addition", text
        assert Path(values["EARLIER_LESSONS"]).name == "year-4-maths-lesson-26-column-addition", text
        assert "LESSON lesson-28: please make lesson 28 of the plan" in text, text


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)


def test_every_lesson_in_a_set_is_handed_the_lesson_before_the_set_never_a_sibling():
    # Lessons in a set start at the same moment. If Monday's design is already
    # half-written when Tuesday looks for its previous lesson, a plain search
    # hands Tuesday that half-written Monday, which the designer is told never
    # to copy. The set decides the lesson before it once, at launch.
    module = load_batch_module()
    started = []

    class FakeProcess:
        pid = 1

    module.subprocess = types.SimpleNamespace(
        Popen=lambda command, **kw: started.append(kw.get("env") or {}) or FakeProcess(), DEVNULL=subprocess.DEVNULL)
    module.claude_command = lambda: "claude"
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        base, output, env = setup(tmp)
        working = output / "working"
        for name in ("year-4-maths-lesson-27-column-addition", "year-4-maths-lesson-28-column-subtraction"):
            (working / name).mkdir(parents=True)
            (working / name / "lesson-design.json").write_text(
                json.dumps({"lesson": {"yearGroup": 4, "subject": "Maths"}}), encoding="utf-8")
        (working / "year-4-maths-lesson-29-column-subtraction").mkdir()
        lessons = [{"tag": f"lesson {n}", "year": "4", "subject": "Maths",
                    "brief": f"please make lesson {n} of the plan"} for n in (28, 29)]
        plan_file = base / "plan.json"
        plan_file.write_text(json.dumps({"lessons": lessons}), encoding="utf-8")
        run(env, "plan", str(plan_file), "--output", str(output))
        saved = os.environ.get("LESSON_RESOURCES_HOME")
        os.environ["LESSON_RESOURCES_HOME"] = env["LESSON_RESOURCES_HOME"]
        try:
            module.launch(["--output", str(output), "--without-thread"])
        finally:
            if saved is None:
                os.environ.pop("LESSON_RESOURCES_HOME")
            else:
                os.environ["LESSON_RESOURCES_HOME"] = saved
        assert len(started) == 2, started
        assert all(Path(e["LESSON_SET_PREVIOUS"]).name == "year-4-maths-lesson-27-column-addition"
                   for e in started), started
        # Tuesday's own filing step, with Monday's design already on disk.
        resolver = SCRIPT.parent / "resolve-filing.py"
        tuesday = working / "year-4-maths-lesson-29-column-subtraction"
        for set_env, expected in ((started[1], "year-4-maths-lesson-27-column-addition"),
                                  ({}, "year-4-maths-lesson-28-column-subtraction")):
            run_env = dict(env, **{k: v for k, v in set_env.items() if k.startswith("LESSON_SET_")})
            out = subprocess.run([sys.executable, str(resolver), "Year 4", "Maths", "--working", str(working),
                                  "--current", str(tuesday)], capture_output=True, text=True, env=run_env)
            values = dict(l.split("=", 1) for l in out.stdout.splitlines() if "=" in l)
            assert Path(values["PREVIOUS_LESSON"]).name == expected, out.stdout + out.stderr


def test_a_set_with_no_lesson_before_it_hands_every_lesson_none():
    import importlib.util
    spec = importlib.util.spec_from_file_location("resolve_filing_set", SCRIPT.parent / "resolve-filing.py")
    resolver = importlib.util.module_from_spec(spec)
    sys.path.insert(0, str(SCRIPT.parent))
    spec.loader.exec_module(resolver)
    saved = {k: os.environ.get(k) for k in ("LESSON_SET_PREVIOUS", "LESSON_SET_EARLIER")}
    try:
        os.environ["LESSON_SET_PREVIOUS"] = resolver.NO_LESSON
        os.environ["LESSON_SET_EARLIER"] = ""
        assert resolver.set_neighbours() == ("", [])
        os.environ.pop("LESSON_SET_PREVIOUS")
        assert resolver.set_neighbours() is None
    finally:
        for k, v in saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
