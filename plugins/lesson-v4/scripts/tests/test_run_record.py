"""Deterministic tests for run-record.py: the lesson's run record, written from saved transcripts.

Run: python test_run_record.py   (or: pytest test_run_record.py)

A fake Claude Code home holds the transcript shapes seen in the 15 October 2026
five-lesson run (lesson 30): a lesson designer cut off at ten minutes in a
session that said nothing about it, a slide designer stopped by the usage limit
and resumed, a resumed worker stopped by a second session, checks that failed
and then passed, and a worker reading a checker's source (which prints failure
markers but is not a check).
"""
import json, subprocess, sys, tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "run-record.py"


def ts(minute, second=0):
    return f"2026-10-15T15:{minute:02d}:{second:02d}.000Z"


def assistant(minute, model="claude-opus-5-5", effort="xhigh", tools=(), text=None, msg_id=None, usage=None):
    content = [{"type": "tool_use", "id": tid, "name": name, "input": {"command": cmd}} for tid, name, cmd in tools]
    if text is not None:
        content.append({"type": "text", "text": text})
    record = {"type": "assistant", "timestamp": ts(minute), "isSidechain": True, "effort": effort,
              "message": {"id": msg_id or f"m{minute}-{len(tools)}", "model": model, "content": content,
                          "usage": usage or {"input_tokens": 10, "output_tokens": 100,
                                             "cache_read_input_tokens": 1000, "cache_creation_input_tokens": 100}}}
    if model == "<synthetic>":
        record.pop("effort")
    return record


def result(minute, tool_id, output):
    return {"type": "user", "timestamp": ts(minute),
            "message": {"content": [{"type": "tool_result", "tool_use_id": tool_id, "content": output}]}}


def prompt(minute, text):
    return {"type": "user", "timestamp": ts(minute), "message": {"content": [{"type": "text", "text": text}]}}


def write_jsonl(path, records):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(json.dumps(r) for r in records) + "\n", encoding="utf-8")


def worker(project, session, agent, role, records, description="job"):
    folder = project / session / "subagents"
    write_jsonl(folder / f"agent-{agent}.jsonl", records)
    (folder / f"agent-{agent}.meta.json").write_text(json.dumps(
        {"agentType": f"lesson-v4:{role}", "description": description, "requestShape": "background"}), encoding="utf-8")


def notice(minute, agent, status, summary):
    return {"type": "queue-operation", "operation": "enqueue", "timestamp": ts(minute),
            "content": f"<task-notification>\n<task-id>{agent}</task-id>\n<status>{status}</status>\n"
                       f"<summary>{summary}</summary>\n</task-notification>"}


def cost(total, model_costs):
    return {"type": "cost-state", "totalCostUSD": total,
            "modelUsage": {m: {"costUSD": c} for m, c in model_costs.items()}}


def build(tmp):
    base = Path(tmp)
    working = base / "working" / "year-4-maths-lesson-30-test"
    working.mkdir(parents=True)
    brief = f"You are the worker. Working directory: {working}"
    project = base / "claude" / "projects" / "C--proj"

    # Session one: the designer is cut off; the session never hears of it.
    write_jsonl(project / "s1.jsonl", [
        {"type": "queue-operation", "operation": "enqueue", "timestamp": ts(0), "content": "/make-lesson lesson 30"},
        {"type": "assistant", "timestamp": ts(1), "message": {"id": "o1", "model": "claude-opus-5-5", "content": [],
                                                             "usage": {"output_tokens": 50}}},
        cost(2.0, {"claude-opus-5-5": 2.0}),
    ])
    worker(project, "s1", "d1", "lesson-designer", [
        prompt(1, brief), assistant(2, effort="medium"), assistant(11, effort="medium"), prompt(11, "[Request interrupted by user]")])

    # Session two: slide designer limited, paused, resumed; one check fails then
    # passes; reading a checker's source prints a failure marker that is not a run.
    write_jsonl(project / "s2.jsonl", [
        {"type": "queue-operation", "operation": "enqueue", "timestamp": ts(12), "content": "Carry on the interrupted lesson"},
        notice(20, "sd", "failed", "Agent failed: You've hit your monthly spend limit"),
        notice(40, "sd", "completed", "finished"),
        cost(10.0, {"claude-opus-5-5": 10.0}),
    ])
    worker(project, "s2", "sd", "slide-designer", [
        prompt(13, brief),
        assistant(14, tools=[("t1", "Bash", 'cd x && "C:/py/python.exe" check-slide-design.py lesson.json')]),
        result(14, "t1", "SLIDE_DESIGN_CHECK_FAILED\nBUILD_DIAGNOSTIC: slide 5 needs 6.17in"),
        assistant(15, tools=[("t2", "Bash", "sed -n 1,40p scripts/check-helper-coverage.py")]),
        result(15, "t2", '    print("HELPER_DELIVERY_FAILED", file=sys.stderr)\nHELPER_DELIVERY_FAILED'),
        assistant(20, model="<synthetic>", text="You've hit your monthly spend limit, resets 5:10pm"),
        assistant(35, tools=[("t3", "Bash", "node build.js && python check-slide-design.py lesson.json")]),
        result(36, "t3", "SLIDE_DESIGN_CHECK_OK: 39 slides"),
        assistant(40, effort="high", msg_id="last"),
    ], description="Design lesson 30 slides")

    # Session three: a second session's resumed worker is stopped by it.
    write_jsonl(project / "s3.jsonl", [
        {"type": "queue-operation", "operation": "enqueue", "timestamp": ts(25), "content": "Carry on again"},
        notice(30, "ws", "killed", 'Agent "Worksheet designer (resume)" was stopped by Claude'),
    ])
    worker(project, "s3", "ws", "worksheet-designer", [prompt(26, brief), assistant(27, model="claude-sonnet-5-5", effort="high")])

    # A worker for another lesson must not appear.
    worker(project, "s2", "other", "lesson-designer", [prompt(13, "Working directory: C:/elsewhere/lesson-31"), assistant(14)])

    (working / "build-results").mkdir()
    (working / "build-results" / "slides.json").write_text(json.dumps({
        "ok": True, "kind": "slides",
        "stdout": "SLIDE_TEXT_BELOW_TARGET: 93 box(es) fitted under 20pt.\n"
                  'BUILD_DIAGNOSTIC: {"signal":"SUCCESS_CRITERIA_CAPACITY","faultClass":"note","message":"330 characters"}\n'
                  'BUILD_DIAGNOSTIC: {"signal":"SUCCESS_CRITERIA_CAPACITY","faultClass":"note","message":"330 characters"}\n',
        "stderr": ""}), encoding="utf-8")
    (working / "worksheet.json").write_text(json.dumps(
        {"notes": ["Greater Depth: I applied the adaptation's pre-authorised removals. Off: Q1 (c)."]}), encoding="utf-8")
    (working / "friction.md").write_text(
        "AGENT: slide-designer | FRICTION: I expected one slide, the counters needed three - run changed: the model spans three slides\n"
        "AGENT: worksheet-designer | FRICTION: the engine set rows of three - run unharmed\n"
        "AGENT: slide-designer | BLOCK: API usage limit\n", encoding="utf-8")
    return base, working


def run(base, working):
    done = subprocess.run([sys.executable, str(SCRIPT), "--working-dir", str(working),
                           "--claude-home", str(base / "claude")], capture_output=True, text=True)
    assert done.returncode == 0, done.stderr
    return done.stdout, (working / "run-record.md").read_text(encoding="utf-8")


def section(text, number):
    start = text.index(f"## {number}.")
    end = text.find(f"## {number + 1}.", start)
    return text[start:end if end > 0 else None]


def test_every_session_and_how_each_worker_ended():
    with tempfile.TemporaryDirectory() as tmp:
        out, text = run(*build(tmp))
        assert "RUN_RECORD_OK" in out and "(3 sessions, 3 workers)" in out
        timeline = section(text, 1)
        assert timeline.count("### Session") == 3
        assert "cut off while working" in timeline
        assert "finished after being resumed" in timeline
        assert "paused (15m)" in timeline
        assert "stopped by the host: You've hit your monthly spend limit" in timeline
        assert "stopped by its orchestrator" in timeline
        assert "lesson-31" not in text


def test_failed_checks_count_runs_and_ignore_reading_source():
    with tempfile.TemporaryDirectory() as tmp:
        _, text = run(*build(tmp))
        checks = section(text, 2)
        assert "SLIDE_DESIGN_CHECK: passed on run 2 of 2" in checks
        assert "slide 5 needs 6.17in" in checks
        assert "HELPER_DELIVERY" not in checks


def test_builds_and_notes_surface_quiet_trade_offs():
    with tempfile.TemporaryDirectory() as tmp:
        _, text = run(*build(tmp))
        builds = section(text, 3)
        assert "SLIDE_TEXT_BELOW_TARGET: 93 box(es)" in builds
        assert "SUCCESS_CRITERIA_CAPACITY (note), 2 times" in builds
        assert "pre-authorised removals" in builds


def test_verdicts_are_listed_as_unchecked():
    with tempfile.TemporaryDirectory() as tmp:
        _, text = run(*build(tmp))
        verdicts = section(text, 4)
        assert "Nobody has checked these" in verdicts
        assert "**changed: the model spans three slides**" in verdicts
        assert "**unharmed**" in verdicts
        assert "BLOCK" not in verdicts


def test_cost_shares_add_up_and_settings_are_compared():
    with tempfile.TemporaryDirectory() as tmp:
        _, text = run(*build(tmp))
        costs = section(text, 5)
        assert "All sessions together: $12.00 (some sessions recorded no cost)" in costs
        rows = [line for line in costs.splitlines() if line.startswith("| ") and "$" in line]
        session_two = [line for line in rows if line.split("|")[2].strip() == "2"]
        assert abs(sum(float(line.rsplit("$", 1)[1].split()[0]) for line in session_two) - 10.0) < 0.02
        slide_row = next(line for line in rows if line.startswith("| slide-designer"))
        assert "xhigh, high" in slide_row and "(DIFFERENT)" not in slide_row
        designer_row = next(line for line in rows if line.startswith("| lesson-designer"))
        assert "medium" in designer_row and "(DIFFERENT)" in designer_row


def test_a_missing_folder_never_fails():
    done = subprocess.run([sys.executable, str(SCRIPT), "--working-dir", "Z:/no/such/folder"],
                          capture_output=True, text=True)
    assert done.returncode == 0 and "RUN_RECORD_UNAVAILABLE" in done.stdout


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
