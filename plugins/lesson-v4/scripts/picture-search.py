#!/usr/bin/env python3
"""Run the next compiled search for one picture.

    picture-search.py --assignment ASSIGNMENT_FILE --filename unsplash/x.jpg --query "two to four words"
                      [--candidates FILE]     the open-web step's candidates file
                      [--orientation landscape|portrait|squarish]   Unsplash only
    picture-search.py --assignment ASSIGNMENT_FILE --filename unsplash/x.jpg --status

The scout brings the one thing that needs judgement, the words to search for.
Everything else about a search is already compiled into the assignment: which
library, which round, how many candidates, and the folder its record must land
in. This command reads those from the assignment instead of leaving the scout
to rebuild them, and it always runs the next step that has not been walked, so
a step cannot be skipped, run out of order or run twice.

Why it exists. Until 13 October 2026 the scout assembled each fetch command by
hand from the schedule. The schedule named each step's summary file and never
its output folder, so in the Codex lessons of 10 and 11 October 2026 one scout
sent every download to the picture's own folder, one level too high, and had to
search again; its hand-written loop over four pictures then dropped one of the
four searches; and the scouts could not tell from the schedule which steps were
theirs to run.

A transport failure is retried once, into the `retry-1` folder the result check
expects, by running this command again. A spent quota is never retried and the
next step is offered. A refused key stops the ladder, because nothing in the run
can mend it and walking past it would hide the preferred library for good.

Prints the fetcher's own output, then one PICTURE_SEARCH line naming the record
it wrote and one NEXT line saying what is left. Exits with the fetcher's code.

Standard library only.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
FETCHERS = {
    "unsplash": "unsplash_fetch.py",
    "wikimedia": "wikimedia_fetch.py",
    "openverse": "openverse_fetch.py",
    "web": "web_fetch.py",
}


class SearchError(Exception):
    pass


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def find_entry(assignment: dict, filename: str) -> dict:
    entries = assignment.get("entries") if isinstance(assignment, dict) else None
    if not isinstance(entries, list):
        raise SearchError("the assignment has no entries")
    wanted = filename.replace("\\", "/")
    for entry in entries:
        name = entry.get("filename") if isinstance(entry, dict) else None
        if name == wanted or (isinstance(name, str) and name.split("/")[-1] == wanted):
            return entry
    names = ", ".join(e.get("filename", "?") for e in entries if isinstance(e, dict))
    raise SearchError(f"{filename} is not in this assignment; its pictures are: {names}")


def step_state(step: dict) -> str:
    """Where one compiled step stands: todo, retry, done, spent or blocked."""
    primary = Path(step["summary_path"])
    retry = primary.parent / "retry-1" / primary.name
    if not primary.is_file():
        return "todo"
    summary = read_json(primary)
    if isinstance(summary, dict) and summary.get("complete") is True:
        return "done"
    kind = summary.get("failure_kind") if isinstance(summary, dict) else None
    if kind == "auth":
        return "blocked"
    if kind == "rate_limit" or retry.is_file():
        return "spent"
    return "retry"


def unreachable(step: dict) -> bool:
    """A step that was walked and never answered, as the result check reads it."""
    if step_state(step) != "spent":
        return False
    primary = Path(step["summary_path"])
    retry = read_json(primary.parent / "retry-1" / primary.name)
    return not (isinstance(retry, dict) and retry.get("complete") is True)


def next_step(schedule: list[dict]):
    """(index, step, state) of the step to run now, or (None, None, why not)."""
    for index, step in enumerate(schedule):
        state = step_state(step)
        if state == "blocked":
            return None, None, (
                f"{step['source']} refused its key, which nothing in this run can mend, so the "
                "ladder stops here. Apply the failure rules: generate where the assignment allows "
                "it, otherwise report real_source_unavailable."
            )
        if state in ("done", "spent"):
            continue
        # An assignment compiled before 13 October 2026 can still carry a
        # reserve step, owed only after an outage above it.
        if step.get("standby_only") and not any(unreachable(prior) for prior in schedule[:index]):
            continue
        return index, step, state
    return None, None, "every compiled search for this picture has been run."


def describe_next(entry: dict) -> str:
    index, step, state = next_step(entry["search_schedule"])
    if step is None:
        after = (
            "generate it" if entry.get("generation_prompt_file")
            else "report what the search found"
        )
        return f"NEXT: no search is left for this picture ({state.rstrip('.')}). With no faithful winner, {after}."
    what = f"{step['source']} round {step['round']}"
    if state == "retry":
        return (
            f"NEXT: {what} failed in transit and has one retry. Run this command again for the "
            "same picture to make it."
        )
    return (
        f"NEXT: with a faithful winner, stop and search no further for this picture. With none, "
        f"run this command again for the same picture: it will search {what}."
    )


def run(args) -> int:
    assignment_path = Path(args.assignment).resolve()
    assignment = read_json(assignment_path)
    if not isinstance(assignment, dict):
        raise SearchError(f"cannot read the assignment at {assignment_path}")
    entry = find_entry(assignment, args.filename)
    schedule = entry.get("search_schedule") or []
    if not schedule:
        raise SearchError(f"{entry['filename']} has no compiled search: it is a made picture, so generate it")

    if args.status:
        for number, step in enumerate(schedule, 1):
            print(f"step {number} of {len(schedule)}: {step['source']} round {step['round']} - {step_state(step)}")
        print(describe_next(entry))
        return 0

    index, step, state = next_step(schedule)
    if step is None:
        print(f"PICTURE_SEARCH_NONE_LEFT: {entry['filename']}: {state}")
        print(describe_next(entry))
        return 0
    if not args.query or not args.query.strip():
        raise SearchError("--query is required: the two to four words that say what the picture is of")

    source = step["source"]
    primary = Path(step["summary_path"])
    output_dir = primary.parent / "retry-1" if state == "retry" else primary.parent
    command = [
        sys.executable, str(SCRIPT_DIR / FETCHERS[source]), args.query,
        "--count", str(step["candidate_count"]), "--round", str(step["round"]),
        "--output", str(output_dir),
    ]
    if source == "web":
        if not args.candidates:
            raise SearchError(
                f"the next step for {entry['filename']} is the open web, which needs --candidates: "
                "the file of pages you found yourself (see the search reference)"
            )
        command += ["--candidates", str(Path(args.candidates).resolve())]
    elif args.candidates:
        raise SearchError(
            f"the next step for {entry['filename']} is {source}, not the open web, so it takes no "
            "--candidates. Run it with --query alone."
        )
    if args.orientation and source == "unsplash":
        command += ["--orientation", args.orientation]

    output_dir.mkdir(parents=True, exist_ok=True)
    sys.stdout.flush()
    code = subprocess.run(command).returncode
    summary = read_json(output_dir / primary.name)
    complete = isinstance(summary, dict) and summary.get("complete") is True
    print(
        f"PICTURE_SEARCH: {entry['filename']} step {index + 1} of {len(schedule)} "
        f"({source} round {step['round']}{', retry' if state == 'retry' else ''}) "
        f"complete={'true' if complete else 'false'} record={output_dir / primary.name}"
    )
    print(describe_next(entry))
    return code


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Run the next compiled search for one picture")
    parser.add_argument("--assignment", required=True)
    parser.add_argument("--filename", required=True)
    parser.add_argument("--query")
    parser.add_argument("--candidates")
    parser.add_argument("--orientation", choices=("landscape", "portrait", "squarish"))
    parser.add_argument("--status", action="store_true", help="show where each step stands and run nothing")
    args = parser.parse_args(argv)
    try:
        return run(args)
    except SearchError as exc:
        print(f"PICTURE_SEARCH_REFUSED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
