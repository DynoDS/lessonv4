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
    python lesson-batch.py thread-brief --output <OUTPUT_DIR> --thread <key>
    python lesson-batch.py thread-check --output <OUTPUT_DIR> --thread <key>
    python lesson-batch.py launch --output <OUTPUT_DIR> [--tag <tag>] [--without-thread]
    python lesson-batch.py watch --output <OUTPUT_DIR> [--max-minutes 50]
    python lesson-batch.py status --output <OUTPUT_DIR> [--final]
    python lesson-batch.py resume --output <OUTPUT_DIR>
    python lesson-batch.py keep --output <OUTPUT_DIR> [--once]

`plan.json` is {"lessons": [{"tag", "year", "subject", "brief"}, ...]} in the
order the teacher listed them. The batch is kept in
<OUTPUT_DIR>/working/lesson-batch/batch.json; each lesson's session log is in
the folder beside it named after its tag.

Lessons in one year and subject form a thread: before they start, one lesson
designer writes what the days share (the method steps as they grow, the word
cards, the picture of the method) to thread-<key>.json beside batch.json, and
each session is started with it, because lessons built side by side cannot read
each other.

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
from contextlib import contextmanager
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
    # On Windows the replace is refused for a moment while another program
    # (the keeper, a watch) is reading the file.
    for _ in range(50):
        try:
            os.replace(temporary, target)
            return
        except PermissionError:
            time.sleep(0.1)
    os.replace(temporary, target)


@contextmanager
def batch_lock(output: Path):
    """One change to batch.json at a time: the keeper, launch and resume all write it."""
    lock = batch_dir(output) / "batch.lock"
    lock.parent.mkdir(parents=True, exist_ok=True)
    held = False
    deadline = time.time() + 60
    while not held and time.time() < deadline:
        try:
            os.close(os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY))
            held = True
        except FileExistsError:
            try:
                if time.time() - lock.stat().st_mtime > 120:  # left by a program that died holding it
                    lock.unlink(missing_ok=True)
                    continue
            except OSError:
                pass
            time.sleep(0.2)
    try:
        yield
    finally:
        if held:
            lock.unlink(missing_ok=True)


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


# ---------------------------------------------------------------------------
# The set's thread
#
# A lesson reads the lesson before it to keep its steps, word cards and picture
# of the method, but lessons built at the same moment have no lesson before to
# read. Lessons 28 to 32 (Year 4 column subtraction, 15 October 2026) each
# guessed, and the exchange step came out worded four ways in four days. So a
# set in one year and subject agrees those things once, before the lessons
# split, and every lesson starts from the agreement.


def thread_groups(lessons: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for lesson in lessons:
        year = re.sub(r"\D", "", str(lesson["year"])) or str(lesson["year"])
        groups.setdefault(safe_tag(f"year-{year}-{lesson['subject']}"), []).append(lesson)
    return {key: members for key, members in groups.items() if len(members) > 1}


def thread_file(output: Path, key: str) -> Path:
    return batch_dir(output) / f"thread-{key}.json"


def thread_faults(output: Path, batch: dict, key: str) -> list[str]:
    """What is wrong with a thread file, or [] when it can be used."""
    members = [l["key"] for l in batch.get("lessons", []) if l.get("thread") == key]
    try:
        thread = json.loads(thread_file(output, key).read_text(encoding="utf-8"))
    except OSError:
        return [f"{thread_file(output, key)} has not been written"]
    except ValueError as exc:
        return [f"{thread_file(output, key)} is not JSON ({exc})"]
    entries = thread.get("lessons") if isinstance(thread, dict) else None
    if not isinstance(entries, list):
        return ["the thread has no lessons list"]
    faults = []
    if [e.get("key") if isinstance(e, dict) else None for e in entries] != members:
        faults.append("the thread's lessons must be " + ", ".join(members) + ", in that order, each as its key")
    for entry in (e for e in entries if isinstance(e, dict)):
        name = entry.get("key")
        steps = entry.get("methodSteps")
        if not isinstance(steps, list) or not all(isinstance(t, str) and t.strip() for t in steps):
            faults.append(f"{name}: methodSteps must be a list of steps ([] when the day shows no method list)")
        # A method only some questions need is its own list (set-thread.md).
        extras = entry.get("sometimesLists", [])
        if not isinstance(extras, list) or not all(
                isinstance(x, dict) and str(x.get("heading") or "").strip() and isinstance(x.get("steps"), list)
                and x["steps"] and all(isinstance(t, str) and t.strip() for t in x["steps"]) for x in extras):
            faults.append(f"{name}: sometimesLists must be a list of {{heading, steps}} ([] or left out when none)")
        elif extras and not str(entry.get("methodHeading") or "").strip():
            faults.append(f"{name}: a day with sometimesLists gives its methodSteps a methodHeading too "
                          "(\"How to subtract\" beside \"How to exchange\")")
        cards = entry.get("wordCards")
        if not isinstance(cards, list) or not all(
                isinstance(c, dict) and str(c.get("term") or "").strip() and str(c.get("definition") or "").strip()
                for c in cards):
            faults.append(f"{name}: wordCards must be a list of {{term, definition}} ([] when none is shared)")
        for field in ("newToday", "representation"):
            if not isinstance(entry.get(field), str):
                faults.append(f'{name}: {field} must be text ("" when there is nothing to say)')
    return faults


def before_the_set(output: Path, members: list[dict]) -> tuple[str, list[str]]:
    """The lesson the class had before the set, and up to three before that."""
    first = members[0]
    year = re.sub(r"\D", "", str(first["year"]))
    working = str(output / "working")
    number = re.search(r"\blesson\s*(\d+)", f"{first['tag']} {first['brief']}", re.IGNORECASE)
    # A folder name carrying the first lesson's plan number, so the lesson
    # before the set is found by plan number, as a single run finds its own.
    start = str(Path(working) / f"set-start-lesson-{number.group(1)}") if number else ""
    previous = resolve_filing.numbered_previous(working, year, first["subject"], start) if start else ""
    if not previous:
        previous = resolve_filing.not_this_lesson_or_later(
            resolve_filing.latest_lesson(working, year, first["subject"]), start)
    earlier = resolve_filing.earlier_lessons(working, year, first["subject"], start, previous) if previous else []
    return previous, earlier


def thread_brief(args: list[str]) -> int:
    """What the thread's designer needs: the lessons, in order, and the lesson before the set."""
    output = Path(option(args, "--output") or ".").resolve()
    key = option(args, "--thread")
    batch = read_batch(output)
    members = [l for l in batch.get("lessons", []) if l.get("thread") == key]
    if not members:
        return fail(f"no thread {key!r} in this batch")
    first = members[0]
    year = re.sub(r"\D", "", str(first["year"]))
    previous, earlier = before_the_set(output, members)
    print(f"THREAD_FILE={thread_file(output, key)}")
    print(f"YEAR={year}\nSUBJECT={first['subject']}")
    print(f"PREVIOUS_LESSON={previous}")
    print(f"EARLIER_LESSONS={' | '.join(earlier)}")
    for lesson in members:
        line = destination_line(lesson)
        print(f"LESSON {lesson['key']}: {' '.join(lesson['brief'].split())}" + (f" [{line}]" if line else ""))
    return 0


def thread_check(args: list[str]) -> int:
    output = Path(option(args, "--output") or ".").resolve()
    key = option(args, "--thread")
    batch = read_batch(output)
    if not any(l.get("thread") == key for l in batch.get("lessons", [])):
        return fail(f"no thread {key!r} in this batch")
    faults = thread_faults(output, batch, key)
    for fault in faults:
        print(f"THREAD_FAULT: {fault}")
    if faults:
        return 1
    print("THREAD_OK")
    return 0


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
    building = [l["tag"] for l in existing.get("lessons", []) if l.get("status") in ("building", "paused")]
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
    threads = thread_groups(lessons)
    for key, members in threads.items():
        for lesson in members:
            lesson["thread"] = key
        # A thread left by an earlier set in the same subject is not this set's.
        thread_file(output, key).unlink(missing_ok=True)
    batch = {"made": datetime.now().isoformat(timespec="seconds"), "delivery": chosen["mode"],
             "output": str(output), "lessons": lessons}
    write_batch(output, batch)
    print(f"DELIVERY={chosen['mode']}")
    for key, members in threads.items():
        print(f"THREAD {key}: " + ", ".join(l["tag"] for l in members))
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
    with batch_lock(output):
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


def next_log(folder: Path) -> str:
    """A fresh log name for a new session: run-1.jsonl, run-2.jsonl, ... in order.

    Each session writes its own log and no log is ever renamed, because on
    Windows a session still running holds its log open and the rename is
    refused (lesson 30, 15 October 2026).
    """
    n = 1
    while (folder / f"run-{n}.jsonl").exists():
        n += 1
    return f"run-{n}.jsonl"


def start_session(output: Path, lesson: dict, message: str, note: str, resume_session: str = "") -> None:
    folder = batch_dir(output) / lesson["key"]
    folder.mkdir(parents=True, exist_ok=True)
    log_name = next_log(folder)
    log = open(folder / log_name, "ab")
    err = open(folder / "stderr.txt", "ab")
    command = [claude_command(), "-p", message, "--permission-mode", "auto",
               "--output-format", "stream-json", "--verbose", "--append-system-prompt", note]
    if resume_session:
        # The same conversation, so the lesson's conductor remembers where it
        # was and which helpers it had running.
        command += ["--resume", resume_session]
    # Detached from the asking chat, so closing that chat does not stop a
    # lesson halfway through.
    extra = {}
    if os.name == "nt":
        # Detached, a new process group and no window; also out of the chat's
        # job, which would otherwise end the session with the chat.
        extra["creationflags"] = 0x00000008 | 0x00000200 | 0x08000000 | 0x01000000
    else:
        extra["start_new_session"] = True
    # A print-mode session that ends its turn with a worker still running
    # stops that worker after ten minutes unless told to wait. A lesson
    # designer runs longer than that, so without this a lesson "finishes"
    # mid-design with nothing made (15 October 2026).
    # In auto mode Claude Code snapshots the checkout before a session's first
    # commands so it can show what each one changed, and in this checkout that
    # means reading every untracked file. Nobody watches a background session's
    # changes, and the snapshot held each lesson's setup check for 20 seconds
    # to 4 minutes (17 October 2026), so it is switched off here.
    extra["env"] = dict(os.environ, CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS="0", CLAUDE_CODE_BASH_EDIT_DIFF="0")
    # The set's thread reaches the lesson through resolve-filing.py, which
    # writes it into filing.txt beside PREVIOUS_LESSON.
    if lesson.get("threadFile"):
        extra["env"].update(LESSON_SET_THREAD=lesson["threadFile"], LESSON_SET_LESSON=lesson["key"])
    # Every lesson in a set takes the lesson before the set as its previous
    # lesson, never a sibling: a sibling that has started writing its design
    # by the time this one looks is half-written, and copying one is how a
    # week came to word one step several ways (15 October 2026).
    if "setPrevious" in lesson:
        extra["env"].update(LESSON_SET_PREVIOUS=lesson["setPrevious"] or resolve_filing.NO_LESSON,
                            LESSON_SET_EARLIER=" | ".join(lesson.get("setEarlier") or []))
    try:
        process = subprocess.Popen(command, cwd=str(output), stdin=subprocess.DEVNULL,
                                   stdout=log, stderr=err, **extra)
    except PermissionError:
        # A job that forbids leaving it: the session still runs, but ends
        # with the chat.
        extra["creationflags"] &= ~0x01000000
        process = subprocess.Popen(command, cwd=str(output), stdin=subprocess.DEVNULL,
                                   stdout=log, stderr=err, **extra)
    now = datetime.now().isoformat(timespec="seconds")
    lesson.update(status="building", pid=process.pid, started=now, log=log_name, seen=0,
                  resumeKind="session" if resume_session else "new")
    lesson.setdefault("firstStarted", now)
    lesson.pop("resumeAt", None)


def launch(args: list[str]) -> int:
    output = Path(option(args, "--output") or ".").resolve()
    only = option(args, "--tag")
    without_thread = "--without-thread" in args
    with batch_lock(output):
        batch = read_batch(output)
        if not batch:
            return fail("no batch is planned in this folder")
        if not claude_command():
            return fail("no claude command on this computer")
        usable = {key: not thread_faults(output, batch, key)
                  for key in {l["thread"] for l in batch["lessons"] if l.get("thread")}}
        started = 0
        before = {}
        for lesson in batch["lessons"]:
            if only and only not in (lesson["tag"], lesson["key"]):
                continue
            if lesson.get("status") != "not started":
                continue
            if "error" in (lesson.get("destination") or {}):
                print(f"NOT_STARTED {lesson['tag']}: its save slot is unresolved")
                continue
            key = lesson.get("thread")
            if key:
                if key not in before:
                    before[key] = before_the_set(output, [l for l in batch["lessons"] if l.get("thread") == key])
                lesson["setPrevious"], lesson["setEarlier"] = before[key]
            if key and usable[key]:
                lesson["threadFile"] = str(thread_file(output, key))
            elif key and not without_thread:
                print(f"THREAD_MISSING {lesson['tag']}: write and check thread {key} first, or launch --without-thread")
                continue
            start_session(output, lesson, message_for(lesson), UNATTENDED_NOTE)
            # Written after every start, so a fault on a later lesson cannot
            # lose the record of a session already running.
            write_batch(output, batch)
            print(f"STARTED {lesson['tag']}")
            started += 1
        write_batch(output, batch)
    ensure_keeper(output)
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


def end_session(pid: int) -> None:
    """Close a session and the helpers running inside it, so a lesson never has two."""
    if not alive(pid):
        return
    if os.name == "nt":
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
    else:
        import signal
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except OSError:
            pass
    for _ in range(50):
        if not alive(pid):
            return
        time.sleep(0.2)


# ---------------------------------------------------------------------------
# Reading a session back
#
# A session's log is not a record of one turn. A session that waits for its
# helpers writes a result every time it pauses for one, so a result is not the
# end; and when the usage limit is reached it writes the limit message as a
# result and then an empty "success" result as it closes (lessons 28 to 32,
# 15 October 2026: four "finished" with nothing saved). So a lesson is judged
# only once its session has ended, and "finished" means its files are in the
# folder they were saved to.


def reset_from_text(text: str) -> float | None:
    """The reset time in a limit message ("... resets 5:10pm ..."), as a timestamp."""
    match = re.search(r"resets\s+(\d{1,2})(?::(\d{2}))?\s*([ap]m)", text or "", re.IGNORECASE)
    if not match:
        return None
    hour = int(match.group(1)) % 12 + (12 if match.group(3).lower() == "pm" else 0)
    when = datetime.now().replace(hour=hour, minute=int(match.group(2) or 0), second=0, microsecond=0)
    if when < datetime.now() - timedelta(hours=1):
        when += timedelta(days=1)
    return when.timestamp()


def read_session(output: Path, lesson: dict) -> dict:
    """What the lesson's current session has said and where it stands.

    texts: its messages to the teacher, in order; report: its last non-empty
    result; session: its conversation id; limited: the usage limit stopped it
    and it has not been served since; resets: when the limit lifts, if known;
    worked: it has done any work at all.
    """
    info = {"texts": [], "report": "", "session": "", "limited": False, "resets": None, "worked": False}
    path = batch_dir(output) / lesson["key"] / lesson.get("log", "run.jsonl")
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return info
    for line in lines:
        try:
            event = json.loads(line)
        except ValueError:
            continue
        kind = event.get("type")
        if event.get("session_id") and not info["session"]:
            info["session"] = event["session_id"]
        if kind == "assistant":
            message = event.get("message") or {}
            if message.get("model") != "<synthetic>":
                info["worked"] = True
            if not event.get("parent_tool_use_id"):
                for part in message.get("content") or []:
                    if isinstance(part, dict) and part.get("type") == "text" and part.get("text", "").strip():
                        info["texts"].append(part["text"].strip())
        elif kind == "rate_limit_event":
            limit = event.get("rate_limit_info") or {}
            if limit.get("status") == "rejected":
                info["limited"] = True
                info["resets"] = limit.get("resetsAt") or info["resets"]
            elif limit.get("status") in ("allowed", "allowed_warning"):
                info["limited"] = False
        elif kind == "result":
            text = str(event.get("result") or "")
            if event.get("api_error") == "usage_limit_reached":
                info["limited"] = True
                info["resets"] = info["resets"] or reset_from_text(text)
            elif text.strip():
                info["report"] = text.strip()
    return info


def saved_files(output: Path, lesson: dict) -> tuple[str, str]:
    """("saved", where), ("not saved", why), or ("", "") when the lesson never tried to save.

    The lesson's own save record names the folder and every file; each file
    must really be there. A record older than the lesson's first session
    belongs to an earlier lesson in the same folder.
    """
    folder = working_folder_for(output, lesson)
    record = folder / "build-results" / "delivery.json" if folder else None
    if record is None or not record.is_file():
        return "", ""
    first = lesson.get("firstStarted") or lesson.get("started") or ""
    try:
        if first and record.stat().st_mtime < datetime.fromisoformat(first).timestamp():
            return "", ""
        data = json.loads(record.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return "", ""
    out = str(data.get("stdout") or "")
    if not data.get("ok"):
        why = " ".join(str(data.get("stderr") or out).split())[:300]
        return "not saved", why or "the save did not complete"
    values = dict(line.split("=", 1) for line in out.splitlines() if "=" in line)
    destination = values.get("DESTINATION", "")
    if values.get("STATUS") == "STAGED":
        return "saved", destination
    files = [line[5:] for line in out.splitlines() if line.startswith("FILE=")]
    missing = [name for name in files if not (Path(destination) / name).is_file()]
    if not destination or not files:
        return "not saved", "the save record names no folder or no files"
    if missing:
        return "not saved", f"{', '.join(missing)} not found in {destination}"
    return "saved", destination


# ---------------------------------------------------------------------------
# Keeping the set going
#
# One plain program per set (the keeper) watches every lesson, waits out a
# usage limit and carries a stopped lesson on, so a set survives interruptions
# without the teacher, and without the asking chat, which meets the same limit
# and may be closed. The keeper alone changes a lesson's state; the chat reads
# what it reports from events.log.

LIMIT_MARGIN = 60  # seconds after the reset before carrying on
UNEXPLAINED_RETRIES = 1

CARRY_ON_MESSAGE = (
    "This lesson run was interrupted ({why}) and has been started again in this same"
    " conversation. Carry on from where it stopped. A helper that was stopped part-way"
    " keeps its work: send it a message (SendMessage, to its agent id) asking it to carry"
    " on its own job from where it stopped, instead of starting that step again. Start a"
    " step again only when its helper cannot be woken, from the latest checkpoint whose"
    " check still passes. Everything else about the run is as before."
)


def keeper_file(output: Path) -> Path:
    return batch_dir(output) / "keeper.pid"


def events_file(output: Path) -> Path:
    return batch_dir(output) / "events.log"


def keeper_alive(output: Path) -> bool:
    try:
        return alive(int(keeper_file(output).read_text(encoding="utf-8").strip() or 0))
    except (OSError, ValueError):
        return False


def active(batch: dict) -> bool:
    return any(l.get("status") in ("building", "paused") for l in batch.get("lessons", []))


def ensure_keeper(output: Path) -> None:
    """Start the set's keeper unless one is running or nothing is left to keep."""
    if os.environ.get("LESSON_BATCH_KEEPER") == "off" or keeper_alive(output) or not active(read_batch(output)):
        return
    extra = {}
    if os.name == "nt":
        extra["creationflags"] = 0x00000008 | 0x00000200 | 0x08000000 | 0x01000000
    else:
        extra["start_new_session"] = True
    batch_dir(output).mkdir(parents=True, exist_ok=True)
    log = open(batch_dir(output) / "keeper.log", "ab")
    command = [sys.executable, str(Path(__file__).resolve()), "keep", "--output", str(output)]
    try:
        process = subprocess.Popen(command, cwd=str(output), stdin=subprocess.DEVNULL, stdout=log, stderr=log, **extra)
    except PermissionError:
        extra["creationflags"] &= ~0x01000000
        process = subprocess.Popen(command, cwd=str(output), stdin=subprocess.DEVNULL, stdout=log, stderr=log, **extra)
    keeper_file(output).write_text(str(process.pid), encoding="utf-8")


def carry_on(output: Path, lesson: dict, why: str) -> str:
    """Start the lesson's next session and say how it carries on."""
    session = lesson.get("sessionId", "")
    if session and not lesson.pop("freshNext", False):
        start_session(output, lesson, CARRY_ON_MESSAGE.format(why=why), UNATTENDED_NOTE, resume_session=session)
        return "from where each helper stopped"
    folder = working_folder_for(output, lesson)
    if folder is None:
        start_session(output, lesson, message_for(lesson), UNATTENDED_NOTE)
        return "from the start, as nothing was saved before it stopped"
    message = (f"{skill_command()} Carry on the interrupted lesson in {folder}."
               f"\n\n{message_for(lesson)[len(skill_command()) + 1:]}")
    start_session(output, lesson, message, UNATTENDED_NOTE + RESUME_NOTE)
    return "from its last finished step"


def clock(stamp: float) -> str:
    return datetime.fromtimestamp(stamp).strftime("%H:%M")


def keep_lesson(output: Path, batch: dict, lesson: dict, now: float) -> list[str]:
    """One look at one lesson; returns what changed, as event lines."""
    tag = lesson["tag"]
    events = []
    info = read_session(output, lesson)
    if info["session"]:
        lesson["sessionId"] = info["session"]
    for text in info["texts"][lesson.get("seen", 0):]:
        events.append(f"STEP {tag}: {' '.join(text.split())[:400]}")
    lesson["seen"] = len(info["texts"])
    running = alive(lesson.get("pid", 0))
    status = lesson.get("status")
    ended = datetime.now().isoformat(timespec="seconds")
    state, detail = ("", "") if running else saved_files(output, lesson)
    if state == "saved":
        lesson.update(status="finished", ended=ended, savedTo=detail)
        events.append(f"FINISHED {tag}: saved to {detail}")
        return events

    if info["limited"]:
        resume_at = (info["resets"] or now + 15 * 60 - LIMIT_MARGIN) + LIMIT_MARGIN
        if status != "paused":
            lesson.update(status="paused", resumeAt=resume_at)
            events.append(f"PAUSED {tag}: the usage limit was reached; carrying on by itself at {clock(resume_at)}")
        if now < lesson.get("resumeAt", resume_at):
            return events
        # The limit has lifted and this session has not picked itself up:
        # close it, so the lesson never has two, and carry it on.
        end_session(lesson.get("pid", 0))
        how = carry_on(output, lesson, "the usage limit was reached, and it has now reset")
        events.append(f"CARRYING_ON {tag}: the usage limit has reset; carrying on {how}")
        return events
    if status == "paused" and running:
        # It picked itself up after the limit (a wake-up it had set).
        lesson["status"] = "building"
        lesson.pop("resumeAt", None)
        events.append(f"CARRYING_ON {tag}: picked itself up after the usage limit")
        return events
    if running:
        return events

    if state == "" and batch.get("delivery") == "none" and info["worked"] and info["report"]:
        # Nothing is saved anywhere else: the files stay where they were built.
        lesson.update(status="finished", ended=ended, savedTo=str(output))
        events.append(f"FINISHED {tag}: its files are in {output}")
    elif state == "not saved":
        lesson.update(status="not saved", ended=ended, why=detail)
        events.append(f"NOT_SAVED {tag}: made, but not saved ({detail}); its files are in {output}")
    elif lesson.get("resumeKind") == "session" and not info["worked"]:
        # Its conversation could not be reopened: begin again from the last
        # finished step instead. Not a retry, since nothing was attempted.
        lesson["freshNext"] = True
        how = carry_on(output, lesson, "its session could not be reopened")
        events.append(f"CARRYING_ON {tag}: its session could not be reopened; carrying on {how}")
    elif lesson.get("retries", 0) < UNEXPLAINED_RETRIES:
        lesson["retries"] = lesson.get("retries", 0) + 1
        how = carry_on(output, lesson, "its session ended before the lesson was saved, for no reason it gave")
        events.append(f"CARRYING_ON {tag}: it stopped before saving; one more go, {how}")
    else:
        lesson.update(status="stopped", ended=ended)
        last = " ".join((info["report"] or "it said nothing").split())[:300]
        events.append(f"STOPPED {tag}: stopped twice before saving. Its last words: {last}")
    return events


def keep_once(output: Path) -> bool:
    """One look at every lesson. True while any lesson still needs keeping."""
    with batch_lock(output):
        batch = read_batch(output)
        if not batch:
            return False
        events = []
        changed = []
        now = time.time()
        for lesson in batch["lessons"]:
            if lesson.get("status") in ("building", "paused"):
                news = keep_lesson(output, batch, lesson, now)
                events += news
                if any(not line.startswith("STEP ") for line in news):
                    changed.append(lesson)
        still = active(batch)
        if events:
            events.append(summary_line(batch))
        if not still:
            events.append("BATCH_DONE")
        write_batch(output, batch)
        if events:
            with open(events_file(output), "a", encoding="utf-8") as fh:
                fh.write("\n".join(events) + "\n")
    for lesson in changed:
        write_run_record(output, lesson)
    return still


def write_run_record(output: Path, lesson: dict) -> None:
    """Refresh the lesson's run record whenever its session finishes, pauses or stops.

    The orchestrator writes it at delivery, but a session that dies part-way
    never gets there, and that is the run an investigator most needs to see.
    Outside the batch lock, and never allowed to stop the keeper.
    """
    folder = working_folder_for(output, lesson)
    if folder is None:
        return
    try:
        subprocess.run([sys.executable, str(Path(__file__).with_name("run-record.py")),
                        "--working-dir", str(folder), "--host", "claude"],
                       capture_output=True, timeout=120, check=False)
    except Exception:  # a missing record is a gap to report, never a stopped set
        pass


def keep(args: list[str]) -> int:
    output = Path(option(args, "--output") or ".").resolve()
    if "--once" in args:
        keep_once(output)
        return 0
    keeper_file(output).write_text(str(os.getpid()), encoding="utf-8")
    try:
        while keep_once(output):
            time.sleep(15)
    finally:
        try:
            if keeper_file(output).read_text(encoding="utf-8").strip() == str(os.getpid()):
                keeper_file(output).unlink()
        except OSError:
            pass
    return 0


def summary_line(batch: dict) -> str:
    counts = {}
    for lesson in batch["lessons"]:
        counts[lesson.get("status", "")] = counts.get(lesson.get("status", ""), 0) + 1
    done = counts.get("finished", 0)
    return f"BATCH_PROGRESS={done} of {len(batch['lessons'])} finished; " + ", ".join(
        f"{n} {s}" for s, n in sorted(counts.items()))


def watch(args: list[str]) -> int:
    """Wait until the keeper reports something new, then print it and exit.

    The asking chat runs this in the background so the host wakes it when a
    lesson moves on, instead of on a timer. It only reads: the keeper decides.
    """
    output = Path(option(args, "--output") or ".").resolve()
    deadline = time.time() + 60 * float(option(args, "--max-minutes", "50"))
    offset_file = batch_dir(output) / "watch.offset"
    while True:
        batch = read_batch(output)
        if not batch:
            return fail("no batch is planned in this folder")
        ensure_keeper(output)
        try:
            offset = int(offset_file.read_text(encoding="utf-8").strip() or 0)
        except (OSError, ValueError):
            offset = 0
        try:
            with open(events_file(output), "rb") as fh:
                fh.seek(offset)
                new = fh.read()
        except OSError:
            new = b""
        if new.endswith(b"\n"):
            offset_file.write_text(str(offset + len(new)), encoding="utf-8")
            print(new.decode("utf-8", errors="replace").rstrip("\n"))
            return 0
        if not active(batch):
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
    # A keeper lost to a restarted computer starts again here.
    ensure_keeper(output)
    for lesson in batch["lessons"]:
        state = lesson.get("status")
        if state == "paused" and lesson.get("resumeAt"):
            state += f" for the usage limit, carrying on at {clock(lesson['resumeAt'])}"
        print(f"LESSON {lesson['tag']}: {state}; {destination_line(lesson) or 'no planned slot'}")
        if final and lesson.get("status") in ("finished", "not saved", "stopped"):
            report = read_session(output, lesson)["report"]
            print(f"REPORT {lesson['tag']}:\n{report}\nEND_REPORT")
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
    """The teacher asked to carry on: start every lesson that is not finished and not running.

    A lesson with a live session is left to it, and a lesson waiting for the
    usage limit is left to the keeper, so a lesson never has two sessions.
    """
    output = Path(option(args, "--output") or ".").resolve()
    started = 0
    with batch_lock(output):
        batch = read_batch(output)
        if not batch:
            return fail("no batch is planned in this folder")
        for lesson in batch["lessons"]:
            state = lesson.get("status")
            if state == "finished" or alive(lesson.get("pid", 0)):
                print(f"LEFT {lesson['tag']}: {'finished' if state == 'finished' else 'still running'}")
                continue
            if state == "paused" and time.time() < lesson.get("resumeAt", 0):
                print(f"WAITING {lesson['tag']}: carries on by itself at {clock(lesson['resumeAt'])}")
                continue
            if state == "not started":
                start_session(output, lesson, message_for(lesson), UNATTENDED_NOTE)
                print(f"STARTED {lesson['tag']}")
            else:
                # The teacher's word is a fresh allowance of tries.
                lesson["retries"] = 0
                how = carry_on(output, lesson, "the teacher asked to carry on")
                print(f"RESUMED {lesson['tag']}: {how}")
            write_batch(output, batch)
            started += 1
        write_batch(output, batch)
    ensure_keeper(output)
    print(f"BATCH_STARTED={started}")
    return 0


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if not args:
        print(__doc__)
        return 1
    command = args.pop(0)
    handlers = {"route": lambda a: route(), "agree": lambda a: agree(), "plan": plan,
                "set-destination": set_destination, "thread-brief": thread_brief,
                "thread-check": thread_check, "launch": launch, "watch": watch,
                "status": status, "resume": resume, "keep": keep}
    if command not in handlers:
        return fail(f"unknown command {command!r}")
    return handlers[command](args)


if __name__ == "__main__":
    raise SystemExit(main())
