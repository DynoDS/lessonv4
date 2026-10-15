#!/usr/bin/env python3
"""Build several lessons at once, each in its own background Claude Code session.

A lesson run is conducted by the chat that runs it, and one run fills most of
that chat's memory. Conducting several from one chat (the retired
make-lesson-batch, August 2026) meant juggling several runs' instructions at
once. This tool instead starts each lesson as its own session with a fresh
memory, exactly as if the teacher had opened a chat for it, and leaves the
asking chat only to plan, start and report.

    python lesson-batch.py route
    python lesson-batch.py agree
    python lesson-batch.py plan <plan.json> --output <OUTPUT_DIR>
    python lesson-batch.py launch --output <OUTPUT_DIR> [--tag <tag>]
    python lesson-batch.py watch --output <OUTPUT_DIR> [--max-minutes 50]
    python lesson-batch.py status --output <OUTPUT_DIR> [--final]
    python lesson-batch.py resume --output <OUTPUT_DIR>

`plan.json` is {"lessons": [{"tag", "year", "subject", "brief"}, ...]} in the
order the teacher listed them. The batch is kept in
<OUTPUT_DIR>/working/lesson-batch/batch.json; each lesson's session log is in
the folder beside it named after its tag.

Exit 0 with KEY=value or tagged lines on success; `BATCH_ERROR: <reason>` and
exit 1 on a fault the asking chat must report.
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import plugin_settings

SCRIPTS = Path(__file__).resolve().parent
PLUGIN_ROOT = SCRIPTS.parent


def skill_command() -> str:
    """The slash command that starts a lesson run, under this package's own name."""
    try:
        name = json.loads((PLUGIN_ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))["name"]
    except (OSError, ValueError, KeyError):
        name = "lesson-v4"
    return f"/{name}:make-lesson"

_spec = importlib.util.spec_from_file_location("resolve_filing", SCRIPTS / "resolve-filing.py")
resolve_filing = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(resolve_filing)

# Told to every lesson session. It is not the teacher's words, so it travels as
# a system prompt and never lands in the lesson's teacher-brief.txt.
UNATTENDED_NOTE = (
    "This lesson is one of several the teacher asked for together. It runs as"
    " its own session in the background while the teacher's chat reports on"
    " the whole set, so nobody can answer a question or click a permission"
    " prompt here. Where a single run would stop to ask, make the choice a"
    " thoughtful teacher would most likely make, carry on, and name the choice"
    " under Teacher flags in the final report, because a run that ends its turn"
    " to ask a question simply stops, and the teacher gets no lesson. A save"
    " destination in the message was planned for the whole set so that lessons"
    " in one subject land on consecutive days instead of all on the first free"
    " one: treat it as a day the teacher named."
)

RESUME_NOTE = (
    " This session carries on a lesson whose earlier session was interrupted."
    " Its working folder already exists: resume from the latest checkpoint whose"
    " check still passes, keep the existing teacher-brief.txt as the teacher's"
    " words, and do not archive the folder, because archiving it would throw"
    " away the work this session exists to finish."
)


def batch_dir(output: Path) -> Path:
    return output / "working" / "lesson-batch"


def batch_file(output: Path) -> Path:
    return batch_dir(output) / "batch.json"


def read_batch(output: Path) -> dict:
    try:
        return json.loads(batch_file(output).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def write_batch(output: Path, batch: dict) -> None:
    target = batch_file(output)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(f"batch.{os.getpid()}.tmp")
    temporary.write_text(json.dumps(batch, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, target)


def fail(message: str) -> int:
    print(f"BATCH_ERROR: {message}")
    return 1


def option(args: list[str], name: str, default: str = "") -> str:
    if name in args:
        i = args.index(name)
        if i + 1 < len(args):
            value = args[i + 1]
            del args[i:i + 2]
            return value
    return default


def safe_tag(tag: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", tag.lower()).strip("-") or "lesson"


# ---------------------------------------------------------------------------
# Can this computer start separate sessions?


def claude_command() -> str:
    return shutil.which("claude") or ""


def route() -> int:
    """Separate sessions on Claude Code with auto mode agreed; otherwise in this chat."""
    batch = plugin_settings.read_settings().get("batch") or {}
    if os.environ.get("CLAUDECODE") != "1":
        print("BATCH_ROUTE=in-chat")
        print("BATCH_REASON=this host is not Claude Code, so the lessons are built one after another here")
        return 0
    if not claude_command():
        print("BATCH_ROUTE=in-chat")
        print("BATCH_REASON=no claude command on this computer to start a session with")
        return 0
    if batch.get("autoMode") == "unavailable":
        print("BATCH_ROUTE=in-chat")
        print("BATCH_REASON=auto mode is not available on this account")
        return 0
    print("BATCH_ROUTE=sessions")
    print(f"BATCH_AGREED={'yes' if batch.get('autoMode') == 'agreed' else 'no'}")
    return 0


def agree() -> int:
    """Record the teacher's yes, after proving auto mode starts here at all."""
    claude = claude_command()
    if not claude:
        return fail("no claude command on this computer")
    try:
        probe = subprocess.run(
            [claude, "-p", "Reply with the single word READY.", "--permission-mode", "auto",
             "--output-format", "text"],
            capture_output=True, text=True, timeout=180, stdin=subprocess.DEVNULL,
        )
        answer = (probe.stdout or "") + (probe.stderr or "")
    except (OSError, subprocess.TimeoutExpired) as exc:
        answer = str(exc)
        probe = None
    if probe is None or probe.returncode != 0 or "READY" not in answer:
        plugin_settings.write_settings({"batch": {"autoMode": "unavailable"}})
        print("BATCH_ROUTE=in-chat")
        print(f"BATCH_REASON=auto mode would not start here ({answer.strip()[:200]})")
        return 0
    plugin_settings.write_settings({"batch": {"autoMode": "agreed"}})
    print("BATCH_AGREED=yes")
    return 0


# ---------------------------------------------------------------------------
# Where each lesson goes


def today() -> date:
    configured = os.environ.get("LESSON_RESOURCES_TODAY", "").strip()
    return datetime.strptime(configured, "%Y-%m-%d").date() if configured else date.today()


def next_free(filing, start: date):
    """The first teaching day from `start` whose slot holds nothing yet."""
    d = filing.first_teaching_day(start, limit=70)
    for _ in range(70):
        if d is None or not filing.occupied(d):
            return d
        d = filing.first_teaching_day(d + timedelta(days=1), limit=70)
    return d


def place_sorted(lessons: list[dict], chosen: dict) -> None:
    """Lay each subject's lessons on consecutive slots, in the teacher's order.

    Every session reads the drive the moment it starts, and while the batch is
    being built nothing new is on it yet, so each would see the same first free
    day and the whole set would stack onto it. A daily subject's next lesson
    goes on the next free teaching day; a weekly subject's on the next week.
    """
    last: dict[tuple[str, str], date] = {}
    for lesson in lessons:
        year = re.sub(r"\D", "", str(lesson["year"]))
        subject = str(lesson["subject"])
        filing = resolve_filing.SortedFiling(chosen["folder"], chosen["termDates"], year, subject, "")
        key = (year, subject.lower())
        if key not in last:
            slot = filing.place(today())
            if "error" in slot:
                lesson["destination"] = {"error": slot["error"], "openingWeek": slot.get("code") == 2,
                                         "term": slot.get("term", "")}
                continue
            d = slot["date"]
        else:
            step = timedelta(days=1) if filing.is_core else timedelta(days=7 - last[key].weekday())
            d = next_free(filing, last[key] + step) if filing.is_core else filing.first_teaching_day(last[key] + step)
            res = filing.resolve(d) if d else None
            if not res or res[1] is None:
                lesson["destination"] = {"error": "no teaching slot after the lesson before it"}
                continue
        last[key] = d
        term, week = filing.resolve(d)
        day = resolve_filing.DAYS[d.weekday()] if filing.is_core else ""
        lesson["destination"] = {"term": term, "week": week, "day": day, "subject": subject}


def destination_line(lesson: dict) -> str:
    dest = lesson.get("destination") or {}
    if not dest:
        return ""
    if "error" in dest:
        return ""
    parts = [dest["term"], f"Week {dest['week']}", dest["subject"]] + ([dest["day"]] if dest["day"] else [])
    return " > ".join(parts)


def plan(args: list[str]) -> int:
    output = Path(option(args, "--output") or ".").resolve()
    if not args:
        return fail("name the plan file")
    try:
        lessons = json.loads(Path(args[0]).read_text(encoding="utf-8"))["lessons"]
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return fail(f"the plan file could not be read ({exc})")
    if not isinstance(lessons, list) or len(lessons) < 2:
        return fail("a batch needs two or more lessons; one lesson is an ordinary run")
    existing = read_batch(output)
    building = [l["tag"] for l in existing.get("lessons", []) if l.get("status") == "building"]
    if building:
        return fail("a batch is still building (" + ", ".join(building) + "); carry it on or let it finish first")
    tags = set()
    for lesson in lessons:
        for field in ("tag", "year", "subject", "brief"):
            if not str(lesson.get(field) or "").strip():
                return fail(f"a lesson has no {field}")
        lesson["key"] = safe_tag(lesson["tag"])
        while lesson["key"] in tags:
            lesson["key"] += "-2"
        tags.add(lesson["key"])
        lesson["status"] = "not started"
    chosen = plugin_settings.delivery()
    if chosen["mode"] == "sorted":
        try:
            place_sorted(lessons, chosen)
        except OSError as exc:
            return fail(f"the saved term dates could not be read ({exc})")
    batch = {"made": datetime.now().isoformat(timespec="seconds"), "delivery": chosen["mode"],
             "output": str(output), "lessons": lessons}
    write_batch(output, batch)
    print(f"DELIVERY={chosen['mode']}")
    for lesson in lessons:
        dest = lesson.get("destination") or {}
        if dest.get("openingWeek"):
            print(f"OPENING_WEEK {lesson['tag']}: {dest['term']} has a short opening week; ask which week")
        elif "error" in dest:
            print(f"NO_SLOT {lesson['tag']}: {dest['error']}")
        else:
            print(f"PLANNED {lesson['tag']}: {destination_line(lesson) or 'saved as a single run would save it'}")
    print("BATCH_PLANNED")
    return 0


def set_destination(args: list[str]) -> int:
    """The teacher redirected one lesson: `set-destination --output O --tag T "Autumn 1" 7 [Tuesday]`."""
    output = Path(option(args, "--output") or ".").resolve()
    tag = option(args, "--tag")
    batch = read_batch(output)
    lesson = next((l for l in batch.get("lessons", []) if tag in (l["tag"], l["key"])), None)
    if not lesson or len(args) < 2:
        return fail("name a lesson in the batch and its term and week")
    lesson["destination"] = {"term": args[0], "week": int(re.sub(r"\D", "", args[1]) or 0),
                             "day": args[2] if len(args) > 2 else "", "subject": lesson["subject"]}
    write_batch(output, batch)
    print(f"PLANNED {lesson['tag']}: {destination_line(lesson)}")
    return 0


# ---------------------------------------------------------------------------
# Starting and watching the sessions


def message_for(lesson: dict) -> str:
    text = lesson["brief"].strip()
    line = destination_line(lesson)
    if line:
        text += f"\n\nSave it to {line}."
    return f"{skill_command()} {text}"


def start_session(output: Path, lesson: dict, message: str, note: str) -> None:
    folder = batch_dir(output) / lesson["key"]
    folder.mkdir(parents=True, exist_ok=True)
    log = open(folder / "run.jsonl", "ab")
    err = open(folder / "stderr.txt", "ab")
    command = [claude_command(), "-p", message, "--permission-mode", "auto",
               "--output-format", "stream-json", "--verbose", "--append-system-prompt", note]
    # Detached from the asking chat, so closing that chat does not stop a
    # lesson halfway through.
    extra = {}
    if os.name == "nt":
        # Detached, a new process group and no window; also out of the chat's
        # job, which would otherwise end the session with the chat.
        extra["creationflags"] = 0x00000008 | 0x00000200 | 0x08000000 | 0x01000000
    else:
        extra["start_new_session"] = True
    try:
        process = subprocess.Popen(command, cwd=str(output), stdin=subprocess.DEVNULL,
                                   stdout=log, stderr=err, **extra)
    except PermissionError:
        # A job that forbids leaving it: the session still runs, but ends
        # with the chat.
        extra["creationflags"] &= ~0x01000000
        process = subprocess.Popen(command, cwd=str(output), stdin=subprocess.DEVNULL,
                                   stdout=log, stderr=err, **extra)
    lesson.update(status="building", pid=process.pid, started=datetime.now().isoformat(timespec="seconds"),
                  seen=lesson.get("seen", 0))


def launch(args: list[str]) -> int:
    output = Path(option(args, "--output") or ".").resolve()
    only = option(args, "--tag")
    batch = read_batch(output)
    if not batch:
        return fail("no batch is planned in this folder")
    if not claude_command():
        return fail("no claude command on this computer")
    started = 0
    for lesson in batch["lessons"]:
        if only and only not in (lesson["tag"], lesson["key"]):
            continue
        if lesson.get("status") != "not started":
            continue
        if "error" in (lesson.get("destination") or {}):
            print(f"NOT_STARTED {lesson['tag']}: its save slot is unresolved")
            continue
        start_session(output, lesson, message_for(lesson), UNATTENDED_NOTE)
        print(f"STARTED {lesson['tag']}")
        started += 1
    write_batch(output, batch)
    print(f"BATCH_STARTED={started}")
    return 0


def alive(pid: int) -> bool:
    if not pid:
        return False
    if os.name == "nt":
        import ctypes
        handle = ctypes.windll.kernel32.OpenProcess(0x1000, False, pid)  # query limited information
        if not handle:
            return False
        code = ctypes.c_ulong()
        ctypes.windll.kernel32.GetExitCodeProcess(handle, ctypes.byref(code))
        ctypes.windll.kernel32.CloseHandle(handle)
        return code.value == 259  # still active
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def read_events(output: Path, lesson: dict) -> tuple[list[str], dict | None]:
    """The session's messages to the teacher so far, and its final result if it has one."""
    texts, result = [], None
    path = batch_dir(output) / lesson["key"] / "run.jsonl"
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return texts, result
    for line in lines:
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if event.get("type") == "assistant" and not event.get("parent_tool_use_id"):
            for part in (event.get("message") or {}).get("content") or []:
                if isinstance(part, dict) and part.get("type") == "text" and part.get("text", "").strip():
                    texts.append(part["text"].strip())
        elif event.get("type") == "result":
            result = event
    return texts, result


def refresh(output: Path, batch: dict) -> list[str]:
    """Bring every lesson's status up to date; return what changed, as lines."""
    changes = []
    for lesson in batch["lessons"]:
        if lesson.get("status") != "building":
            continue
        texts, result = read_events(output, lesson)
        for text in texts[lesson.get("seen", 0):]:
            changes.append(f"STEP {lesson['tag']}: {' '.join(text.split())[:400]}")
        lesson["seen"] = len(texts)
        if result is not None:
            ok = result.get("subtype") == "success" and not result.get("is_error")
            lesson["status"] = "finished" if ok else "failed"
            lesson["ended"] = datetime.now().isoformat(timespec="seconds")
            changes.append(f"{'FINISHED' if ok else 'FAILED'} {lesson['tag']}")
        elif not alive(lesson.get("pid", 0)):
            lesson["status"] = "stopped"
            lesson["ended"] = datetime.now().isoformat(timespec="seconds")
            changes.append(f"STOPPED {lesson['tag']}: the session ended before the lesson finished")
    return changes


def summary_line(batch: dict) -> str:
    counts = {}
    for lesson in batch["lessons"]:
        counts[lesson.get("status", "")] = counts.get(lesson.get("status", ""), 0) + 1
    done = counts.get("finished", 0)
    return f"BATCH_PROGRESS={done} of {len(batch['lessons'])} finished; " + ", ".join(
        f"{n} {s}" for s, n in sorted(counts.items()))


def watch(args: list[str]) -> int:
    """Wait until any lesson says something new or ends, then print it and exit.

    The asking chat runs this in the background so the host wakes it when a
    lesson moves on, instead of on a timer.
    """
    output = Path(option(args, "--output") or ".").resolve()
    deadline = time.time() + 60 * float(option(args, "--max-minutes", "50"))
    while True:
        batch = read_batch(output)
        if not batch:
            return fail("no batch is planned in this folder")
        changes = refresh(output, batch)
        if changes:
            write_batch(output, batch)
            print("\n".join(changes))
            print(summary_line(batch))
            if not any(l.get("status") == "building" for l in batch["lessons"]):
                print("BATCH_DONE")
            return 0
        if not any(l.get("status") == "building" for l in batch["lessons"]):
            print(summary_line(batch))
            print("BATCH_DONE")
            return 0
        if time.time() > deadline:
            print("WATCH_QUIET: no lesson has moved on since the last update")
            print(summary_line(batch))
            return 0
        time.sleep(10)


def status(args: list[str]) -> int:
    output = Path(option(args, "--output") or ".").resolve()
    final = "--final" in args
    batch = read_batch(output)
    if not batch:
        return fail("no batch is planned in this folder")
    for line in refresh(output, batch):
        print(line)
    write_batch(output, batch)
    for lesson in batch["lessons"]:
        print(f"LESSON {lesson['tag']}: {lesson.get('status')}; {destination_line(lesson) or 'no planned slot'}")
        if final and lesson.get("status") in ("finished", "failed"):
            _, result = read_events(output, lesson)
            print(f"REPORT {lesson['tag']}:\n{(result or {}).get('result', '').strip()}\nEND_REPORT")
    print(summary_line(batch))
    return 0


def working_folder_for(output: Path, lesson: dict) -> Path | None:
    """The lesson's working folder: the one whose saved brief holds this lesson's words."""
    probe = " ".join(lesson["brief"].split())[:120]
    best = None
    for brief in (output / "working").glob("*/teacher-brief.txt"):
        try:
            text = " ".join(brief.read_text(encoding="utf-8").split())
        except OSError:
            continue
        if probe and probe in text:
            if best is None or brief.stat().st_mtime > best.stat().st_mtime:
                best = brief
    return best.parent if best else None


def resume(args: list[str]) -> int:
    """Start again every lesson that did not finish, from where its work stopped."""
    output = Path(option(args, "--output") or ".").resolve()
    batch = read_batch(output)
    if not batch:
        return fail("no batch is planned in this folder")
    refresh(output, batch)
    started = 0
    for lesson in batch["lessons"]:
        state = lesson.get("status")
        if state in ("finished", "building"):
            print(f"LEFT {lesson['tag']}: {state}")
            continue
        if state == "not started":
            start_session(output, lesson, message_for(lesson), UNATTENDED_NOTE)
            print(f"STARTED {lesson['tag']}")
            started += 1
            continue
        folder = working_folder_for(output, lesson)
        if folder is None:
            lesson["status"] = "not started"
            start_session(output, lesson, message_for(lesson), UNATTENDED_NOTE)
            print(f"STARTED {lesson['tag']}: nothing was saved before it stopped, so it begins again")
        else:
            message = (f"{skill_command()} Carry on the interrupted lesson in {folder}."
                       f"\n\n{message_for(lesson)[len(skill_command()) + 1:]}")
            lesson["seen"] = 0
            # The stopped session's log is kept beside the new one, numbered.
            log = batch_dir(output) / lesson["key"] / "run.jsonl"
            if log.exists():
                n = 1
                while log.with_name(f"run-{n}.jsonl").exists():
                    n += 1
                log.rename(log.with_name(f"run-{n}.jsonl"))
            start_session(output, lesson, message, UNATTENDED_NOTE + RESUME_NOTE)
            print(f"RESUMED {lesson['tag']}: from {folder.name}")
        started += 1
    write_batch(output, batch)
    print(f"BATCH_STARTED={started}")
    return 0


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if not args:
        print(__doc__)
        return 1
    command = args.pop(0)
    handlers = {"route": lambda a: route(), "agree": lambda a: agree(), "plan": plan,
                "set-destination": set_destination, "launch": launch, "watch": watch,
                "status": status, "resume": resume}
    if command not in handlers:
        return fail(f"unknown command {command!r}")
    return handlers[command](args)


if __name__ == "__main__":
    raise SystemExit(main())
