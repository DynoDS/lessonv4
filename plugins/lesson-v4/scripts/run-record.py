#!/usr/bin/env python3
"""Write a lesson's run record: what happened to its workers, from the host's own files.

A run's friction file is written by the workers and the orchestrator, so it
holds only what they noticed and chose to say. An investigator kept having to
dig the rest out of saved session transcripts by hand: the lesson designer that
was cut off at ten minutes and never mentioned again, the second session that
picked a lesson up, the checks a worker failed before it passed, what each
worker cost and which model and thinking level it really ran on. The host
already saves all of that. This script reads it and writes it into the
lesson's working folder, so it sits beside friction.md and needs nobody's word.

    python3 run-record.py --working-dir PATH [--host claude|codex] [--claude-home PATH]

Writes ``[WORKING_DIR]/run-record.md`` and prints ``RUN_RECORD_OK: <path>``.
It never stops a run: anything it cannot read is named in the record, and the
script still exits 0. Safe to run as often as wanted; each run rewrites the
file from the saved records, so the last one is the fullest.

Sections:
  1. Timeline: every session that worked on this lesson and every worker in it,
     with how each ended (finished, failed and why, stopped, cut off while
     working, or still going) and any pause or resume.
  2. Checks that failed: each worker's failed checks in order, with the line
     that said why, and how many runs it took to pass; plus the slide designer's
     saved attempts.
  3. What the builds reported: every kind of message the fixed builds printed,
     once each with a count, and the designers' notes saved with the resources.
     Shrunk words, planned cuts used and flagged slides show up here without
     anyone having to call them friction.
  4. Verdicts the workers gave themselves: each friction line's own verdict,
     marked as unchecked.
  5. Time, cost, model and thinking level per worker.

Claude Code keeps every worker's transcript at
``<claude home>/projects/<project>/<session>/subagents/agent-<id>.jsonl`` with a
``.meta.json`` beside it, and the session's own transcript at
``<project>/<session>.jsonl``. Codex is read through worker-launch.py's
timeline, which is what that host's record supports.

Standard library only.
"""
from __future__ import annotations

import argparse
import contextlib
import importlib.util
import io
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent

# A gap this long between two of a worker's own records is a pause (a usage
# limit, or the worker waiting to be resumed), not thinking time.
PAUSE = timedelta(minutes=5)

# How the token kinds compare in price. Used only to share a session's own
# recorded cost out between its workers, never to price anything on its own,
# so the shares always add up to what the host says the session cost.
TOKEN_WEIGHTS = {"input_tokens": 1.0, "output_tokens": 5.0,
                 "cache_creation_input_tokens": 1.25, "cache_read_input_tokens": 0.1}

CHECK_LINE = re.compile(
    r"^\s*([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)_(OK|FAILED|ERROR|REFUSED|BLOCKED)\b(.*)$", re.M)
SIGNAL_LINE = re.compile(r"^([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+):\s*(.*)$")
# A tool result counts as a check run only when its command ran a program.
# Workers also read checker source and search it for marker names, and those
# results print every marker the checker can give, failures included.
RUNS_A_PROGRAM = re.compile(r"(?:^|[\s\"'/\\&;|(])(?:python[0-9.]*|py|node|bash|sh|pwsh|powershell)(?:\.exe)?[\"']?(?:\s|$)", re.I)
READING_TOOLS = {"Read", "Grep", "Glob"}
VERDICT = re.compile(r"-\s*run\s+(unharmed|changed|harmed)\b[:\s]*(.*)$", re.I)
# A check that refuses a draft lists each problem on a line of its own
# ("  x slide 2 text: TASK_BLUE_NOT_A_SHORT_TASK: ..."). That line is the reason.
# The lines right after the failure marker are often only the wrapper's own
# ending: on 17 October 2026 a refused blue line was recorded as "the preview
# check exited 1; the steps after it did not run", which read as a breakdown.
PROBLEM_LINE = re.compile(r"^\s*x\s+(slide\b.*)$", re.M)
WRAPPER_LINE = re.compile(r"^(?:DECK_PREVIEW_[A-Z_]+:|The scratch build ran as well|Repair what every line names)")
# How a refusal reads in the record: a check turning a draft down is the check
# doing its job, not something breaking.
OUTCOME_WORDS = {"FAILED": "turned down", "REFUSED": "turned down"}


def failure_reason(output: str, after: int, marker_rest: str) -> str:
    named = PROBLEM_LINE.search(output)
    if named:
        return one_line(named.group(1), 300)
    tail = [line for line in output[after:].strip().splitlines()
            if line.strip() and not WRAPPER_LINE.match(line.strip())][:2]
    return one_line(" ".join([marker_rest.strip(": ")] + tail), 300)


def load_worker_launch():
    spec = importlib.util.spec_from_file_location("worker_launch", HERE / "worker-launch.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def stamp(value) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def clock(when: datetime | None) -> str:
    return when.astimezone().strftime("%H:%M") if when else "-"


def minutes(delta: timedelta | None) -> str:
    if delta is None:
        return "-"
    total = max(0, int(round(delta.total_seconds() / 60)))
    return f"{total // 60}h {total % 60:02d}m" if total >= 60 else f"{total}m"


def one_line(text: str, limit: int = 240) -> str:
    text = " ".join(str(text).split())
    return text if len(text) <= limit else text[: limit - 3] + "..."


def read_jsonl(path: Path):
    try:
        with path.open(encoding="utf-8", errors="replace") as handle:
            for line in handle:
                try:
                    record = json.loads(line)
                except ValueError:
                    continue
                if isinstance(record, dict):
                    yield record
    except OSError:
        return


def folder_pattern(working_dir: Path) -> re.Pattern[str]:
    """The working folder as any record writes it: last two parts, any slashes."""
    parts = [part for part in working_dir.parts if part not in ("\\", "/")][-2:]
    return re.compile(r"[\\/]+".join(re.escape(part) for part in parts), re.I)


def folder_born(working_dir: Path) -> float:
    info = working_dir.stat()
    return getattr(info, "st_birthtime", None) or min(info.st_ctime, info.st_mtime)


def text_of(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(text_of(part.get("text") if isinstance(part, dict) and "text" in part
                                 else part.get("content") if isinstance(part, dict) else part)
                         for part in content)
    return "" if content is None else str(content)


# ── Claude Code: which sessions and workers belong to this lesson ─────────


def first_prompt(agent_file: Path) -> str:
    for record in read_jsonl(agent_file):
        if record.get("type") == "user":
            return text_of((record.get("message") or {}).get("content"))
    return ""


def find_workers(claude_home: Path, working_dir: Path) -> dict[Path, list[dict]]:
    """Every lesson worker whose assignment names this working folder, by session."""
    pattern = folder_pattern(working_dir)
    since = folder_born(working_dir) - 3600
    found: dict[Path, list[dict]] = defaultdict(list)
    for meta_path in (claude_home / "projects").glob("*/*/subagents/*.meta.json"):
        agent_file = meta_path.with_name(meta_path.name[: -len(".meta.json")] + ".jsonl")
        try:
            if agent_file.stat().st_mtime < since:
                continue
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        agent_type = str(meta.get("agentType") or "")
        if not agent_type.startswith("lesson-v4:"):
            continue
        if not pattern.search(first_prompt(agent_file)):
            continue
        session_file = meta_path.parents[2] / (meta_path.parents[1].name + ".jsonl")
        found[session_file].append({
            "id": agent_file.stem[len("agent-"):],
            "file": agent_file,
            "role": agent_type.split(":", 1)[1],
            "description": meta.get("description") or "",
            "background": meta.get("requestShape") == "background",
        })
    return found


def read_session(session_file: Path) -> dict:
    """The session's own start, end, opening request, cost and worker notices."""
    info = {"file": session_file, "id": session_file.stem, "start": None, "end": None,
            "prompt": "", "cost": None, "notices": defaultdict(list), "usage": Counter()}
    for record in read_jsonl(session_file):
        when = stamp(record.get("timestamp"))
        if when:
            info["start"] = info["start"] or when
            info["end"] = when
        kind = record.get("type")
        if kind == "cost-state":
            info["cost"] = record
        if kind == "queue-operation" and record.get("operation") == "enqueue":
            content = str(record.get("content") or "")
            if "<task-notification>" in content:
                task = re.search(r"<task-id>(.*?)</task-id>", content)
                status = re.search(r"<status>(.*?)</status>", content)
                summary = re.search(r"<summary>(.*?)</summary>", content, re.S)
                if task and status:
                    info["notices"][task.group(1)].append(
                        (when, status.group(1), summary.group(1).strip() if summary else ""))
            elif not content.startswith("<agent-message") and not info["prompt"]:
                info["prompt"] = content
        result = record.get("toolUseResult")
        if isinstance(result, dict) and result.get("agentId") and result.get("status") in (
                "completed", "failed", "killed"):
            info["notices"][result["agentId"]].append((when, result["status"], ""))
        if kind == "assistant" and not record.get("isSidechain"):
            add_usage(info["usage"], record)
    return info


def add_usage(counter: Counter, record: dict, seen: set | None = None) -> None:
    message = record.get("message") or {}
    model = message.get("model")
    if not model or model == "<synthetic>":
        return
    if seen is not None:
        key = message.get("id")
        if key in seen:
            return
        seen.add(key)
    usage = message.get("usage") or {}
    counter[model] += sum((usage.get(kind) or 0) * weight for kind, weight in TOKEN_WEIGHTS.items())


def read_worker(worker: dict) -> dict:
    """A worker's own transcript: when it worked, on what, and the checks it ran."""
    times: list[datetime] = []
    models: Counter = Counter()
    efforts: Counter = Counter()
    units: Counter = Counter()
    seen: set = set()
    checks: list[tuple[datetime | None, str, str, str]] = []
    synthetic: list[tuple[datetime | None, str]] = []
    interrupted = False
    last_kind = None
    looked: set = set()
    for record in read_jsonl(worker["file"]):
        when = stamp(record.get("timestamp"))
        if when:
            times.append(when)
        kind = record.get("type")
        message = record.get("message") or {}
        if kind == "assistant":
            for part in message.get("content") or []:
                if isinstance(part, dict) and part.get("type") == "tool_use":
                    command = str((part.get("input") or {}).get("command") or "")
                    if part.get("name") in READING_TOOLS or not RUNS_A_PROGRAM.search(command):
                        looked.add(part.get("id"))
            model = message.get("model")
            if model == "<synthetic>":
                synthetic.append((when, one_line(text_of(message.get("content")), 200)))
            elif model:
                models[model] += 1
                if record.get("effort"):
                    efforts[str(record["effort"])] += 1
                add_usage(units, record, seen)
        if kind == "user":
            content = message.get("content")
            text = text_of(content)
            if "[Request interrupted by user" in text:
                interrupted = True
            if isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "tool_result":
                        if part.get("tool_use_id") in looked:
                            continue
                        output = text_of(part.get("content"))
                        for match in CHECK_LINE.finditer(output):
                            family, outcome, rest = match.groups()
                            if family.startswith("REFERENCE_"):
                                continue
                            reason = ""
                            if outcome != "OK":
                                reason = failure_reason(output, match.end(), rest)
                            checks.append((when, family, outcome, reason))
        if kind in ("assistant", "user"):
            last_kind = kind
    times.sort()
    pauses = []
    for before, after in zip(times, times[1:]):
        if after - before >= PAUSE:
            pauses.append((before, after))
    active = None
    if times:
        active = (times[-1] - times[0]) - sum((after - before for before, after in pauses), timedelta())
    return {**worker, "first": times[0] if times else None, "last": times[-1] if times else None,
            "pauses": pauses, "active": active, "models": models, "efforts": efforts,
            "units": units, "checks": dedupe_checks(checks), "synthetic": synthetic,
            "interrupted": interrupted, "last_kind": last_kind}


def dedupe_checks(checks):
    """One entry per check per tool result: a result that names a marker twice is one run."""
    out, seen = [], set()
    for entry in checks:
        key = (entry[0], entry[1], entry[2])
        if key not in seen:
            seen.add(key)
            out.append(entry)
    return out


def ending(worker: dict, session: dict) -> tuple[str, list[str]]:
    """How the worker ended, and the events along the way, in plain words."""
    notices = sorted(session["notices"].get(worker["id"], []), key=lambda n: n[0] or datetime.min.replace(tzinfo=timezone.utc))
    events = []
    for when, text in worker["synthetic"]:
        events.append(f"{clock(when)} stopped by the host: {text}")
    for before, after in worker["pauses"]:
        events.append(f"{clock(before)} to {clock(after)} paused ({minutes(after - before)}), then worked again")
    for when, status, summary in notices:
        if status == "failed":
            events.append(f"{clock(when)} reported failed: {one_line(summary, 220)}")
        elif status == "killed":
            events.append(f"{clock(when)} stopped by its orchestrator: {one_line(summary, 160)}")
    final = notices[-1][1] if notices else None
    if final == "completed":
        state = "finished"
        if any(n[1] in ("failed", "killed") for n in notices[:-1]):
            state = "finished after being resumed"
    elif final == "failed":
        state = "failed"
    elif final == "killed":
        state = "stopped by its orchestrator"
    elif worker["interrupted"]:
        state = "cut off while working (its session stopped it; nothing said so to the orchestrator)"
    elif session["end"] and worker["last"] and worker["last"] <= session["end"]:
        state = "no ending recorded: its session ended while it was still working"
    else:
        state = "still working, or ended without a word"
    return state, events


# ── Files the run already keeps ───────────────────────────────────────────


def build_messages(working_dir: Path) -> list[str]:
    lines = []
    for path in sorted((working_dir / "build-results").glob("*.json")):
        try:
            result = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            lines.append(f"- {path.name}: could not be read")
            continue
        kinds: Counter = Counter()
        first: dict[str, str] = {}
        for line in (str(result.get("stdout") or "") + "\n" + str(result.get("stderr") or "")).splitlines():
            match = SIGNAL_LINE.match(line.strip())
            if not match:
                continue
            kind, rest = match.groups()
            if kind == "BUILD_DIAGNOSTIC":
                try:
                    diagnostic = json.loads(rest)
                    kind = f"{diagnostic.get('signal', 'BUILD_DIAGNOSTIC')} ({diagnostic.get('faultClass', '?')})"
                    rest = diagnostic.get("message", rest)
                except ValueError:
                    pass
            kinds[kind] += 1
            first.setdefault(kind, rest)
        label = result.get("kind") or path.stem
        state = "built" if result.get("ok") else "did not build"
        lines.append(f"- **{label}** ({state})")
        for kind, count in kinds.most_common():
            times = f", {count} times" if count > 1 else ""
            lines.append(f"  - {kind}{times}: {one_line(first[kind], 400)}")
        for key in ("archived", "flaggedSlides", "flaggedFaults", "omittedSheets", "standInSheets"):
            if result.get(key):
                lines.append(f"  - {key}: {one_line(json.dumps(result[key]), 400)}")
        if result.get("degraded"):
            lines.append("  - the build said its result was degraded")
    for name in ("lesson.json", "worksheet.json", "working-wall.json", "stick-in-sheets.json"):
        try:
            notes = json.loads((working_dir / name).read_text(encoding="utf-8")).get("notes")
        except (OSError, ValueError, AttributeError):
            continue
        for note in notes if isinstance(notes, list) else [notes] if notes else []:
            lines.append(f"- designer's note in {name}: {one_line(note, 600)}")
    return lines


def slide_attempts(working_dir: Path) -> list[str]:
    lines = []
    for check in sorted((working_dir / "slide-attempts").glob("attempt-*.check.txt")):
        try:
            text = check.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        markers = [m.group(1) + "_" + m.group(2) for m in CHECK_LINE.finditer(text)]
        failed = [m for m in markers if not m.endswith("_OK")]
        named = PROBLEM_LINE.search(text) if failed else None
        first_reason = named.group(1) if named else next(
            (line for line in text.splitlines()
             if line.strip() and not line.startswith(("SLIDE_DESIGN_CHECK_OK",))), "")
        verdict = ", ".join(sorted(set(failed))) if failed else ", ".join(sorted(set(markers))) or "no marker"
        lines.append(f"- {check.name[:-len('.check.txt')]}: {verdict}. First line after it: {one_line(first_reason, 300)}")
    return lines


def verdicts(working_dir: Path) -> list[str]:
    try:
        text = (working_dir / "friction.md").read_text(encoding="utf-8")
    except OSError:
        return ["- no friction.md in this folder"]
    lines = []
    for raw in text.splitlines():
        if "| FRICTION:" not in raw:
            continue
        role = raw.split("|", 1)[0].replace("AGENT:", "").strip()
        match = VERDICT.search(raw)
        if match:
            said = match.group(1).lower() + (f": {one_line(match.group(2), 200)}" if match.group(2).strip() else "")
        else:
            said = "no verdict given"
        lines.append(f"- {role}: **{said}**. About: {one_line(raw.split('FRICTION:', 1)[1], 160)}")
    return lines or ["- friction.md holds no friction lines"]


# ── Writing the record ────────────────────────────────────────────────────


def declared_for(launch, role: str) -> tuple[str, str] | None:
    try:
        return launch.declared(role, "claude")
    except Exception:
        return None


def cost_rates(session: dict, workers: list[dict]) -> dict[str, float]:
    """Dollars per weighted token, per model, from the session's own recorded cost."""
    cost = session.get("cost") or {}
    usage = (cost.get("modelUsage") or {})
    totals: Counter = Counter(session["usage"])
    for worker in workers:
        totals.update(worker["units"])
    rates = {}
    for model, figures in usage.items():
        if totals.get(model) and isinstance(figures, dict) and figures.get("costUSD") is not None:
            rates[model] = float(figures["costUSD"]) / totals[model]
    return rates


def money(value: float | None) -> str:
    return "-" if value is None else f"${value:.2f}"


def claude_record(working_dir: Path, claude_home: Path) -> tuple[list[str], list[str], list[str], int, int]:
    launch = load_worker_launch()
    by_session = find_workers(claude_home, working_dir)
    sessions = []
    for session_file, workers in by_session.items():
        session = read_session(session_file)
        session["workers"] = sorted((read_worker(w) for w in workers),
                                    key=lambda w: w["first"] or datetime.max.replace(tzinfo=timezone.utc))
        sessions.append(session)
    sessions.sort(key=lambda s: s["start"] or datetime.max.replace(tzinfo=timezone.utc))

    timeline, checks, costs = [], [], []
    if not sessions:
        note = (f"- no Claude Code worker transcript under {claude_home / 'projects'} names this folder, "
                "so the timeline, checks and costs could not be read")
        return [note], [note], [note], 0, 0

    costs.append("| Worker | Session | Model | Thinking | Role file asks | Active | Estimated cost |")
    costs.append("| --- | --- | --- | --- | --- | --- | --- |")
    total_workers = 0
    for number, session in enumerate(sessions, 1):
        short = session["id"][:8]
        cost = session.get("cost") or {}
        total = cost.get("totalCostUSD")
        timeline.append(f"### Session {number} ({short}): {clock(session['start'])} to {clock(session['end'])}, "
                        f"cost {money(total)}")
        timeline.append(f"Asked: {one_line(session['prompt'] or '(not recorded)', 200)}")
        timeline.append("")
        rates = cost_rates(session, session["workers"])
        shared = 0.0
        for worker in session["workers"]:
            total_workers += 1
            state, events = ending(worker, session)
            timeline.append(f"- **{worker['role']}** ({worker['description']}): launched {clock(worker['first'])}, "
                            f"last worked {clock(worker['last'])}, {minutes(worker['active'])} working. "
                            f"Ended: {state}.")
            for event in events:
                timeline.append(f"  - {event}")

            failed = [c for c in worker["checks"] if c[2] != "OK"]
            if failed:
                checks.append(f"- **{worker['role']}** (session {number}):")
                runs: Counter = Counter(c[1] for c in worker["checks"])
                for family in dict.fromkeys(c[1] for c in failed):
                    order = [c for c in worker["checks"] if c[1] == family]
                    passed = next((i for i, c in enumerate(order, 1) if c[2] == "OK"
                                   and i > min(j for j, d in enumerate(order, 1) if d[2] != "OK")), None)
                    tail = f"passed on run {passed} of {runs[family]}" if passed else f"never passed in {runs[family]} runs"
                    checks.append(f"  - {family}: {tail}")
                    for when, _family, outcome, reason in order:
                        if outcome != "OK":
                            checks.append(f"    - {clock(when)} {OUTCOME_WORDS.get(outcome, outcome)}: "
                                          f"{reason or '(no reason printed)'}")
            elif worker["checks"]:
                checks.append(f"- {worker['role']} (session {number}): {len(worker['checks'])} check runs, none failed")

            model = ", ".join(m for m, _ in worker["models"].most_common()) or "-"
            effort = ", ".join(e for e, _ in worker["efforts"].most_common()) or "-"
            wanted = declared_for(launch, worker["role"])
            asks = "-"
            if wanted:
                asks = f"{wanted[0]} {wanted[1]}"
                if not any(wanted[0] in m for m in worker["models"]) or (
                        worker["efforts"] and wanted[1] not in worker["efforts"]):
                    asks += " (DIFFERENT)"
            estimate = None
            if rates:
                estimate = sum(rates.get(m, 0.0) * units for m, units in worker["units"].items())
                shared += estimate
            costs.append(f"| {worker['role']} | {number} | {model} | {effort} | {asks} | "
                         f"{minutes(worker['active'])} | {money(estimate)} |")
        if total is not None:
            costs.append(f"| orchestrator (the rest of session {number}) | {number} | - | - | - | "
                         f"{minutes((session['end'] - session['start']) if session['start'] and session['end'] else None)} span | "
                         f"{money(float(total) - shared) if rates else '-'} |")
        timeline.append("")
    all_cost = [s.get("cost", {}).get("totalCostUSD") for s in sessions if s.get("cost")]
    costs.append("")
    costs.append(f"All sessions together: {money(sum(float(c) for c in all_cost) if all_cost else None)}"
                 f"{'' if len(all_cost) == len(sessions) else ' (some sessions recorded no cost)'}. "
                 "Each worker's cost is the session's own recorded cost shared out by the tokens its "
                 "transcript shows, so it is an estimate; the session totals are the host's own figures.")
    return timeline, checks, costs, len(sessions), total_workers


def codex_record(working_dir: Path) -> tuple[list[str], list[str], list[str], int, int]:
    launch = load_worker_launch()
    args = argparse.Namespace(host="codex", session=None, working_dir=str(working_dir))
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        launch.timeline_command(args)
    block = ["```text", buffer.getvalue().rstrip(), "```"]
    not_read = ["- on Codex the workers' own checks are not read yet; see the slide attempts below"]
    return block, not_read, ["- on Codex, cost and thinking level per worker are in the launch audit "
                             "in the run report, not here"], 1, 0


def write_record(working_dir: Path, host: str, claude_home: Path) -> tuple[Path, int, int]:
    if host == "codex":
        timeline, checks, costs, sessions, workers = codex_record(working_dir)
    else:
        timeline, checks, costs, sessions, workers = claude_record(working_dir, claude_home)
    attempts = slide_attempts(working_dir)
    lines = [
        f"# Run record: {working_dir.name}",
        "",
        f"Written {datetime.now().strftime('%d %b %Y %H:%M')} by run-record.py from the host's own saved "
        "records and this folder's build results. Nothing here is a worker's own account except "
        "section 4. Times are this computer's clock.",
        "",
        "## 1. Timeline",
        "",
        *timeline,
        "## 2. Checks that failed, and how many runs it took",
        "",
        *(checks or ["- no worker's check failed"]),
    ]
    if attempts:
        lines += ["", "Slide designer's saved attempts:", *attempts]
    lines += [
        "",
        "## 3. What the builds reported",
        "",
        "Every kind of message each fixed build printed, once, with how often. Words shrunk "
        "below their target, planned cuts that were used and slides that were flagged appear "
        "here whether or not anyone called them friction.",
        "",
        *(build_messages(working_dir) or ["- no build results in this folder yet"]),
        "",
        "## 4. Verdicts the workers gave themselves",
        "",
        "Each friction line ends with the worker's own verdict. Nobody has checked these: "
        "a checker looking at the delivered files should confirm or overturn each one.",
        "",
        *verdicts(working_dir),
        "",
        "## 5. Time, cost, model and thinking level",
        "",
        *costs,
        "",
    ]
    out = working_dir / "run-record.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    return out, sessions, workers


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Write a lesson's run record from the host's own files.")
    parser.add_argument("--working-dir", required=True)
    parser.add_argument("--host", default="claude", choices=("claude", "codex"))
    parser.add_argument("--claude-home", default=os.environ.get("CLAUDE_CONFIG_DIR") or str(Path.home() / ".claude"))
    args = parser.parse_args(argv)
    working_dir = Path(args.working_dir).resolve()
    if not working_dir.is_dir():
        print(f"RUN_RECORD_UNAVAILABLE: no working folder at {working_dir}")
        return 0
    try:
        out, sessions, workers = write_record(working_dir, args.host, Path(args.claude_home))
    except Exception as error:  # the record must never stop a lesson
        print(f"RUN_RECORD_UNAVAILABLE: {type(error).__name__}: {error}")
        return 0
    print(f"RUN_RECORD_OK: {out} ({sessions} sessions, {workers} workers)")
    return 0


if __name__ == "__main__":
    import utf8_output
    utf8_output.enable()
    raise SystemExit(main())
