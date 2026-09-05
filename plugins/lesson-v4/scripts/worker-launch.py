#!/usr/bin/env python3
"""Resolve and audit the launch settings of every named lesson worker.

Each role file declares the model and thinking level its job needs. Turning that
declaration into a launch used to be three remembered steps at the moment of
spawning: open the role file, translate its shorthand into the model name the
host wants, and fill in host fields the orchestrator uses nowhere else. Nothing
checked the result, so a run could launch every worker on the controller's own
model and finish looking exactly like a correct one. That happened: nine workers
in one run went out with no model and no effort at all, and repair launches in
other runs went out on the wrong model entirely.

``spec`` removes the remembering. It prints the literal fields to copy.

``audit`` removes the trust. It reads the host's own record of what it launched
and compares each worker against its role file, so "did they really run on the
right model?" has an answer that is not the orchestrator's own word.

    python3 worker-launch.py spec --role slide-designer [--host codex]
    python3 worker-launch.py audit [--host codex] [--session PATH]
    python3 worker-launch.py timeline [--host codex] [--session PATH]

``timeline`` removes the guessing about where a run's time went. The host's
record timestamps every launch, every worker's final answer and every command
the orchestrator ran, so the same file that proves the launch settings also
says how long each worker ran and how long its finished result then sat before
the orchestrator acted on it. ``audit`` prints the timeline after its markers;
``timeline`` prints it alone, so any saved session can be measured for a
before-and-after comparison. Before this, run timings were reconstructed from
file modification times after the fact.

Standard library only. Writes nothing.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

AGENTS_DIR = Path(__file__).resolve().parents[1] / "agents"

# A role file's `model:` shorthand is host-neutral; each host spells it its own
# way. `haiku` is the odd one: it names a Claude model, and Codex has no
# equivalent, so the remaining mechanical roles had no correct translation and
# the orchestrator invented one every run. Luna at low effort is what those
# roles actually need - run a fixed script, report what happened, decide nothing.
HOST_MODELS = {
    "codex": {
        "astra": "gpt-6-astra",
        "sol": "gpt-5.6-sol",
        "terra": "gpt-5.6-terra",
        "luna": "gpt-5.6-luna",
        "haiku": "gpt-5.6-luna",
    },
}

# What each host model actually accepts, so an impossible pairing fails here
# rather than degrading silently at launch.
HOST_EFFORTS = {
    "codex": {
        "gpt-6-astra": ("low", "medium", "high", "xhigh", "max", "ultra"),
        "gpt-5.6-sol": ("low", "medium", "high", "xhigh", "max", "ultra"),
        "gpt-5.6-terra": ("low", "medium", "high", "xhigh", "max", "ultra"),
        "gpt-5.6-luna": ("low", "medium", "high", "xhigh", "max"),
    },
}

# A role that declares no effort is a mechanical runner: it executes a fixed
# command and reports the result, and extra deliberation buys nothing.
DEFAULT_EFFORT = "low"

# Every named lesson worker is launched from saved state, never from the
# controller's conversation.
FORK_TURNS = "none"

FRONTMATTER_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---", re.S)


class LaunchError(ValueError):
    """Raised when a role's launch settings cannot be resolved."""


def _field(frontmatter: str, key: str) -> str | None:
    match = re.search(rf"^{key}:\s*(\S+)\s*$", frontmatter, re.M)
    return match.group(1) if match else None


def role_names() -> list[str]:
    return sorted(path.stem for path in AGENTS_DIR.glob("*.md"))


def declared(role: str) -> tuple[str, str]:
    """Return the model shorthand and effort a role file declares."""
    path = AGENTS_DIR / f"{role}.md"
    if not path.is_file():
        raise LaunchError(f"unknown role: {role}")

    match = FRONTMATTER_RE.match(path.read_text(encoding="utf-8"))
    if not match:
        raise LaunchError(f"role file has no frontmatter block: {path.name}")
    frontmatter = match.group(1)

    name = _field(frontmatter, "name")
    if name != role:
        raise LaunchError(
            f"role file {path.name} declares name: {name}, which does not match its filename"
        )

    model = _field(frontmatter, "model")
    if not model:
        raise LaunchError(f"role file {path.name} declares no model")

    return model, _field(frontmatter, "effort") or DEFAULT_EFFORT


def task_name_for(role: str) -> str:
    return role.replace("-", "_")


def resolve(role: str, host: str) -> dict[str, str]:
    """Return the literal launch fields for one role on one host."""
    shorthand, effort = declared(role)

    models = HOST_MODELS.get(host)
    if models is None:
        raise LaunchError(f"unsupported host: {host}")

    model = models.get(shorthand)
    if model is None:
        raise LaunchError(
            f"role {role} declares model {shorthand}, which has no {host} equivalent"
        )

    supported = HOST_EFFORTS[host].get(model, ())
    if effort not in supported:
        raise LaunchError(
            f"role {role} declares effort {effort}, which {model} does not support "
            f"(supported: {', '.join(supported)})"
        )

    return {
        "role": role,
        "instructions": f"agents/{role}.md",
        "task_name": task_name_for(role),
        "model": model,
        "reasoning_effort": effort,
        "fork_turns": FORK_TURNS,
    }


def spec_command(args: argparse.Namespace) -> int:
    if args.host == "claude":
        # Claude Code reads the bundled agent's own frontmatter, so there is
        # nothing for the caller to pass and nothing it could get wrong.
        for role in args.role:
            declared(role)
            print(f"WORKER_LAUNCH_HOST_NATIVE: {role}")
        print("Launch the bundled named agent; the host applies its declared model.")
        return 0

    fields = [resolve(role, args.host) for role in args.role]
    print("WORKER_LAUNCH_OK")
    for entry in fields:
        print()
        for key, value in entry.items():
            print(f"{key}: {value}")
    print()
    print(
        "Copy these fields verbatim into the launch. Append a run-specific suffix "
        "to task_name when one launch is not enough (image_scout_p1, "
        "lesson_designer_redesign_1); keep the role prefix so the launch stays "
        "auditable."
    )
    return 0


def codex_home() -> Path:
    return Path(os.environ.get("CODEX_HOME") or (Path.home() / ".codex"))


# How many recent session files to look through for the one that launched this
# run's workers. A lesson launches around a dozen workers and each writes its own
# file, so the orchestrator's record is never far back; the bound keeps a machine
# with thousands of saved sessions from reading all of them.
AUDIT_SCAN_LIMIT = 60


def records_launches(path: Path) -> bool:
    """Whether this session file holds any worker launch at all.

    Every worker is handed instructions that talk about spawning, so the word
    alone appears in files that launched nothing. Only a recorded call counts,
    which is what `spawn_calls` reads; the quoted-name scan is a cheap way to
    skip the files that cannot hold one before paying to parse them.
    """
    try:
        with path.open(encoding="utf-8", errors="replace") as handle:
            if not any('"spawn_agent"' in line for line in handle):
                return False
    except OSError:
        return False
    try:
        return bool(spawn_calls(path))
    except OSError:
        return False


def newest_session() -> Path | None:
    """The session that launched this run's workers - not simply the newest file.

    Every worker writes its own rollout, so the moment the first one starts, the
    newest file on disk belongs to a worker rather than to the orchestrator that
    launched it. A worker launches nobody, so its record holds no launches, and
    taking the newest file made the audit report every Codex run's launch
    settings as uncertifiable while the real record sat one file back.

    Recent files are read newest-first and the first one holding a launch is the
    orchestrator's. When none does, the newest is returned so the caller reports
    what it always did: a run that truly launched nothing.
    """
    sessions = codex_home() / "sessions"
    if not sessions.is_dir():
        return None
    rollouts = sorted(
        sessions.rglob("rollout-*.jsonl"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not rollouts:
        return None
    for path in rollouts[:AUDIT_SCAN_LIMIT]:
        if records_launches(path):
            return path
    return rollouts[0]


def spawn_calls(session: Path) -> list[dict]:
    """Every spawn_agent call the host recorded, first occurrence per name."""
    found: dict[str, dict] = {}

    def walk(node) -> None:
        if isinstance(node, dict):
            if node.get("name") == "spawn_agent" and "arguments" in node:
                try:
                    arguments = json.loads(node["arguments"])
                except (TypeError, ValueError):
                    arguments = {}
                name = arguments.get("task_name")
                if isinstance(name, str) and name and name not in found:
                    found[name] = arguments
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    with session.open(encoding="utf-8", errors="replace") as handle:
        for line in handle:
            try:
                walk(json.loads(line))
            except ValueError:
                continue

    return [{"task_name": name, **arguments} for name, arguments in found.items()]


def role_for(task_name: str) -> str | None:
    """Match a launch back to its role by the longest role prefix it carries."""
    for role in sorted(role_names(), key=len, reverse=True):
        prefix = task_name_for(role)
        if task_name == prefix or task_name.startswith(prefix + "_"):
            return role
    return None


# ── Timeline ────────────────────────────────────────────────────────────────
#
# Three kinds of line in the orchestrator's record carry the timing:
#
#   - a `spawn_agent` function_call, whose arguments name the worker: launched;
#   - an `agent_message` from `/root/<worker>` to `/root`: the worker's final
#     answer arriving, so returned;
#   - any other tool call the orchestrator makes afterwards: the first one
#     after a return is when that result was serviced. A `wait_agent` is not
#     servicing anything, it is going back to sleep, so it does not count;
#     that is exactly the wait this block exists to make visible.

# Orchestrator calls that are waiting or looking rather than acting.
NON_SERVICING_CALLS = {"wait_agent", "list_agents"}


def parse_timestamp(value) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def timeline_events(session: Path) -> dict:
    """Launches, returns and orchestrator actions, each with a timestamp."""
    launches: dict[str, datetime] = {}
    returns: dict[str, datetime] = {}
    actions: list[datetime] = []

    with session.open(encoding="utf-8", errors="replace") as handle:
        for line in handle:
            try:
                record = json.loads(line)
            except ValueError:
                continue
            if not isinstance(record, dict):
                continue
            when = parse_timestamp(record.get("timestamp"))
            payload = record.get("payload")
            if when is None or not isinstance(payload, dict):
                continue
            kind = payload.get("type")
            name = payload.get("name")

            if kind == "function_call" and name == "spawn_agent":
                try:
                    arguments = json.loads(payload.get("arguments") or "{}")
                except (TypeError, ValueError):
                    arguments = {}
                task = arguments.get("task_name")
                if isinstance(task, str) and task and task not in launches:
                    launches[task] = when
                actions.append(when)
            elif kind in ("function_call", "custom_tool_call"):
                if name not in NON_SERVICING_CALLS:
                    actions.append(when)
            elif kind == "agent_message":
                author = payload.get("author")
                if (
                    isinstance(author, str)
                    and author.startswith("/root/")
                    and payload.get("recipient") == "/root"
                ):
                    task = author[len("/root/"):]
                    if task and task not in returns:
                        returns[task] = when

    actions.sort()
    return {"launches": launches, "returns": returns, "actions": actions}


def clock(when: datetime | None) -> str:
    return when.astimezone().strftime("%H:%M:%S") if when else "-"


def span(delta: timedelta | None) -> str:
    if delta is None:
        return "-"
    seconds = max(0, int(round(delta.total_seconds())))
    return f"{seconds // 60}m {seconds % 60}s"


def timeline_rows(events: dict) -> list[dict]:
    rows = []
    for task, launched in sorted(events["launches"].items(), key=lambda item: item[1]):
        returned = events["returns"].get(task)
        serviced = None
        if returned is not None:
            serviced = next((when for when in events["actions"] if when > returned), None)
        rows.append(
            {
                "task": task,
                "role": role_for(task) or "-",
                "launched": launched,
                "returned": returned,
                "serviced": serviced,
                "ran": (returned - launched) if returned else None,
                "waited": (serviced - returned) if (returned and serviced) else None,
            }
        )
    return rows


def print_timeline(session: Path) -> None:
    """Print the WORKER_TIMELINE block for one session. Never raises."""
    try:
        events = timeline_events(session)
    except OSError as error:
        print(f"WORKER_TIMELINE_UNAVAILABLE: {session}: {error}")
        return
    rows = timeline_rows(events)
    if not rows:
        print(f"WORKER_TIMELINE_UNAVAILABLE: no launches recorded in {session.name}")
        return

    print(f"WORKER_TIMELINE: session={session}")
    role_width = max(len(row["role"]) for row in rows)
    task_width = max(len(row["task"]) for row in rows)
    for row in rows:
        print(
            f"  {row['role']:{role_width}}  {row['task']:{task_width}}  "
            f"launched {clock(row['launched'])}  returned {clock(row['returned'])}  "
            f"ran {span(row['ran'])}  waited {span(row['waited'])}"
        )

    serviced = [row for row in rows if row["serviced"] is not None]
    returned = [row for row in rows if row["returned"] is not None]
    first_launch = min(row["launched"] for row in rows)
    if serviced:
        last_serviced = max(row["serviced"] for row in serviced)
        total = span(last_serviced - first_launch)
        critical = max(serviced, key=lambda row: row["serviced"] - row["launched"])
        critical_text = (
            f"{critical['task']} ({span(critical['serviced'] - critical['launched'])} "
            "launch to serviced)"
        )
    else:
        total = "-"
        critical_text = "-"
    print(
        f"WORKER_TIMELINE_TOTAL: span {total} from first launch to last serviced; "
        f"critical path {critical_text}; {len(rows)} workers, {len(returned)} returned"
    )


def timeline_command(args: argparse.Namespace) -> int:
    if args.host != "codex":
        print(f"WORKER_TIMELINE_UNAVAILABLE: {args.host} keeps no readable launch record")
        return 0
    session = Path(args.session) if args.session else newest_session()
    if session is None or not session.is_file():
        print(
            "WORKER_TIMELINE_UNAVAILABLE: no host launch record found under "
            f"{codex_home() / 'sessions'}"
        )
        return 0
    print_timeline(session)
    return 0


def audit_command(args: argparse.Namespace) -> int:
    if args.host != "codex":
        print(
            f"WORKER_LAUNCH_AUDIT_UNAVAILABLE: {args.host} keeps no readable launch "
            "record; the host applies each agent's declared model itself."
        )
        return 0

    session = Path(args.session) if args.session else newest_session()
    if session is None or not session.is_file():
        print(
            "WORKER_LAUNCH_AUDIT_UNAVAILABLE: no host launch record found under "
            f"{codex_home() / 'sessions'}"
        )
        return 0

    calls = spawn_calls(session)
    if not calls:
        print(f"WORKER_LAUNCH_AUDIT_UNAVAILABLE: no launches recorded in {session.name}")
        return 0

    print(f"WORKER_LAUNCH_AUDIT: session={session}")
    checked = 0
    skipped: list[str] = []
    faults: list[str] = []

    for call in sorted(calls, key=lambda entry: entry["task_name"]):
        name = call["task_name"]
        role = role_for(name)
        if role is None:
            skipped.append(name)
            print(f"SKIP  {name:38} name carries no lesson role, so it was not checked")
            continue

        checked += 1
        try:
            wanted = resolve(role, args.host)
        except LaunchError as error:
            faults.append(f"{name}: {error}")
            print(f"FAIL  {name:38} {error}")
            continue

        model = call.get("model")
        effort = call.get("reasoning_effort")
        want = f"{wanted['model']}/{wanted['reasoning_effort']}"

        if model is None and effort is None:
            faults.append(
                f"{name}: launched with no model or effort, so it inherited the controller's"
            )
            print(f"FAIL  {name:38} wanted {want:26} launched inherited/inherited")
        elif model != wanted["model"] or effort != wanted["reasoning_effort"]:
            got = f"{model or 'inherited'}/{effort or 'inherited'}"
            faults.append(f"{name}: wanted {want}, launched {got}")
            print(f"FAIL  {name:38} wanted {want:26} launched {got}")
        else:
            print(f"OK    {name:38} {want}")

    if skipped:
        # A lesson worker whose task name dropped its role prefix lands here and
        # would otherwise pass unexamined, which is the same silence this check
        # exists to break. Say what went unchecked.
        print(f"WORKER_LAUNCH_AUDIT_UNCHECKED: {', '.join(sorted(skipped))}")

    if faults:
        print(
            f"WORKER_LAUNCH_AUDIT_FAILED: {len(faults)} of {checked} named workers "
            "did not launch at their declared model and effort"
        )
        print_timeline(session)
        return 1

    print(
        f"WORKER_LAUNCH_AUDIT_OK: {checked} named workers launched at their "
        "declared model and effort"
    )
    # The same record says where the run's time went. Printed after the
    # markers so nothing that reads them has to change.
    print_timeline(session)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Resolve and audit worker launch settings.")
    sub = parser.add_subparsers(dest="command", required=True)

    spec = sub.add_parser("spec", help="print the literal launch fields for a role")
    spec.add_argument("--role", action="append", required=True)
    spec.add_argument("--host", default="codex")
    spec.set_defaults(func=spec_command)

    audit = sub.add_parser("audit", help="check the host's own launch record")
    audit.add_argument("--host", default="codex")
    audit.add_argument("--session", default=None)
    audit.set_defaults(func=audit_command)

    timeline = sub.add_parser("timeline", help="print where a run's time went")
    timeline.add_argument("--host", default="codex")
    timeline.add_argument("--session", default=None)
    timeline.set_defaults(func=timeline_command)

    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except LaunchError as error:
        print(f"WORKER_LAUNCH_ERROR: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
