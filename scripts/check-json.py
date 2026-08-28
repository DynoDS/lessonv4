"""Confirm a designer's JSON handoff file parses, before the slow fan-out.

This is the single JSON-validity check used by the make-lesson skill.
Each designer hands the rest of the pipeline a JSON
file (photo-requirements.json, lesson-design.json, lesson.json, worksheet.json, working-wall.json,
stick-in-sheets.json), and the parallel builders read it. A malformed handoff (a
trailing comma, an unclosed bracket, a smart quote that slipped in) would otherwise
sail past the orchestrator and only fail deep inside a builder, after the expensive
parallel agents have already spawned. This check fails fast, in plain English, the
moment the file is written, so the run stops at the cheap point instead of the costly
one.

It checks one thing only: is the file well-formed JSON? It is deliberately not a
schema. A valid file with missing or unexpected fields still passes here and flows on
to the designers and builders that own those decisions.

Usage:
    python3 check-json.py <file.json> [friendly-label]

Exit 0 = valid JSON (prints a one-line confirmation).
Exit 1 = missing file or parse error (plain-English reason on stderr).
Exit 2 = called wrong (no file path given).
"""

import json
import os
import sys


def main():
    if len(sys.argv) < 2:
        print(
            "check-json: no file given. Usage: check-json.py <file.json> [label]",
            file=sys.stderr,
        )
        return 2

    path = sys.argv[1]
    label = sys.argv[2] if len(sys.argv) > 2 else os.path.basename(path)

    if not os.path.exists(path):
        print(
            f"{label} was not written: there is no file at {path}. The designer did "
            f"not produce its handoff, so stop and report that rather than spawning "
            f"the agents that read it.",
            file=sys.stderr,
        )
        return 1

    try:
        with open(path, "r", encoding="utf-8") as f:
            json.load(f)
    except json.JSONDecodeError as e:
        print(
            f"{label} is not valid JSON: {e.msg} at line {e.lineno}, column {e.colno}.\n"
            f"  File: {path}\n"
            f"  Re-run the designer (or fix the file) before spawning any agent that "
            f"reads it: a malformed handoff only fails later, after the slow fan-out.",
            file=sys.stderr,
        )
        return 1
    except OSError as e:
        print(f"{label} could not be read: {e}. File: {path}", file=sys.stderr)
        return 1

    print(f"{label}: valid JSON.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
