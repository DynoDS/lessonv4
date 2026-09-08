#!/usr/bin/env python3
"""Append one run's engine findings to the shared build review log.

The log is where the engine remembers what went wrong, so the next run does not
rediscover it. Three of the four lesson runs of 7-8 September 2026 appended to
nothing: each resolved the source checkout, found it outside its own writable
workspace, wrote a `pending-build-review-log.md` beside its working files and
said so in its report. The findings were real - a combined-PDF merge corrupting
a repeated font subset, a slide-design validator with no legal state for a whole
class of slide, a repair-scope checker refusing a repair it had asked for - and
all three sat unread in three different output folders.

The fault was not the runs' judgement. It was that the only writable home for
the log depended on where the run happened to be started from.

So the log has a fixed home that does not: the teacher's Desktop. That is
writable on the machine the runs are on, it is the same path whichever project a
run is launched from, and it is somewhere the teacher can actually open and
read - which the copy inside a package checkout never was.

The checkout copy is still written when one is genuinely writable, because that
is the copy agents read at runtime and the one that travels with the package.
Neither is required for the other to happen, and the exit status says what got
written.

Every entry is stamped with the plugin version that produced it. A finding is
about an engine, and "which engine" is the first thing anyone reading it back
needs to know: several entries in the existing log describe behaviour that three
patch releases have since changed, and nothing on them says so.

Usage:
    python3 record-build-review.py \\
        --lesson "Year 4 Maths - Find 1,000 more/less" \\
        --plugin-root "[PLUGIN_ROOT]" \\
        --finding "..." [--finding "..."] \\
        [--source-root "[PLUGIN_SOURCE_ROOT]"]

    python3 record-build-review.py --where     # print the Desktop log's path

Exit codes:
    0  the entry reached at least the Desktop log
    1  bad input, or nothing could be written anywhere
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import sys
from pathlib import Path

LOG_HEADER = "# Build review log\n"
LOG_FILENAME = "Lesson engine build log.md"


def desktop_dir() -> Path:
    """Where the teacher's Desktop is.

    OneDrive redirects it on most school-managed Windows accounts, and the
    redirected folder is the real one - writing to the un-redirected path
    creates a second Desktop the teacher never sees.
    """
    for name in ("ONEDRIVE", "OneDrive", "OneDriveConsumer", "OneDriveCommercial"):
        base = os.environ.get(name)
        if base and (Path(base) / "Desktop").is_dir():
            return Path(base) / "Desktop"
    return Path.home() / "Desktop"


def desktop_log() -> Path:
    return desktop_dir() / LOG_FILENAME


def plugin_version(plugin_root: str | None) -> str:
    """The version of the package that produced these findings.

    Unknown is an honest answer and is recorded as one. A wrong version on an
    entry is worse than no version, because it sends the next reader to the
    wrong release.
    """
    if not plugin_root:
        return "version unknown"
    for manifest in (".claude-plugin/plugin.json", ".codex-plugin/plugin.json"):
        path = Path(plugin_root) / manifest
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        version = data.get("version")
        if isinstance(version, str) and version:
            return f"lesson-v4 {version}"
    return "version unknown"


def entry_text(lesson: str, version: str, findings: list[str]) -> str:
    today = datetime.date.today().isoformat()
    lines = [f"\n## {today} - {lesson}", f"\n*Built by {version}.*\n"]
    for finding in findings:
        text = " ".join(finding.split())
        if text:
            lines.append(f"\n- {text}")
    return "\n".join(lines) + "\n"


def append(path: Path, entry: str) -> str | None:
    """Add the entry to this log, creating the file if it is not there yet.

    A missing log is created rather than treated as an absent destination: the
    first finding on a fresh machine is exactly as worth keeping as the hundredth.
    Returns an error string, or None on success.
    """
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        existing = path.read_text(encoding="utf-8") if path.is_file() else ""
        if not existing.lstrip().startswith("# Build review log"):
            existing = LOG_HEADER + existing
        path.write_text(existing.rstrip("\n") + "\n" + entry, encoding="utf-8")
        return None
    except OSError as exc:
        return f"{path}: {exc}"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--where", action="store_true",
                    help="print the Desktop log's path and exit")
    ap.add_argument("--lesson", help="what this run built, in plain English")
    ap.add_argument("--finding", action="append", default=[],
                    help="one reusable engine finding; repeat for several")
    ap.add_argument("--plugin-root", help="the verified PLUGIN_ROOT of this run")
    ap.add_argument("--source-root",
                    help="a writable PLUGIN_SOURCE_ROOT, when the run resolved one")
    args = ap.parse_args(argv)

    if args.where:
        print(desktop_log())
        return 0

    if not args.lesson:
        ap.error("--lesson is required")
    findings = [f for f in args.finding if f and f.strip()]
    if not findings:
        ap.error("at least one --finding is required")

    entry = entry_text(args.lesson, plugin_version(args.plugin_root), findings)

    written, failed = [], []
    target = desktop_log()
    error = append(target, entry)
    (failed if error else written).append(error or str(target))

    if args.source_root:
        checkout = Path(args.source_root) / "references" / "build-review-log.md"
        error = append(checkout, entry)
        (failed if error else written).append(error or str(checkout))

    if not written:
        print("BUILD_REVIEW_LOG_FAILED", file=sys.stderr)
        for note in failed:
            print(f"- {note}", file=sys.stderr)
        return 1

    print(f"BUILD_REVIEW_LOG_OK {len(findings)} finding(s)")
    for note in written:
        print(f"- written to {note}")
    for note in failed:
        print(f"- could not write {note}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
