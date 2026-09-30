#!/usr/bin/env python3
"""Add one lesson run to the shared run log.

Every run writes one detailed entry here, and nowhere else: what the lesson was,
where its working files are, which plugin version and host made it, and the
whole checked run report (outcome, files, faults, pictures, helper gaps, worker
timings, friction). It is the record a troubleshooter reads.

The teacher's decision of 29 September 2026: a separate report per lesson beside
a shared log of findings was the same information written twice, so a run now
writes its report once, it goes into the shared log, and the lesson folder keeps
no second copy.

The log lives in the plugin's home folder (`~/.lesson-resources`, or
`LESSON_RESOURCES_HOME`), beside its settings. That folder survives plugin
updates, which replace the installed plugin folder, and it is never part of the
package, so the log never reaches GitHub or a Codex plugin cache. It replaced a
Desktop log and a copy inside the package (`references/build-review-log.md`,
kept as history and no longer written).

Usage:
    python3 record-build-review.py --report "[WORKING_DIR]/run-report.md" \\
        --lesson "Year 4 Science - Name parts of the digestive system" \\
        --plugin-root "[PLUGIN_ROOT]" --working-dir "[WORKING_DIR]" \\
        --output-dir "[OUTPUT_DIR]" --host claude

    python3 record-build-review.py --lesson "..." --plugin-root "..." \\
        --finding "..." [--finding "..."]     # a finding outside a run

    python3 record-build-review.py --where     # print the log's path

Exit codes:
    0  the entry was written (BUILD_REVIEW_LOG_OK)
    1  bad input, or the log could not be written (BUILD_REVIEW_LOG_FAILED)
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import sys
from pathlib import Path

LOG_HEADER = "# Lesson run log\n"
LOG_FILENAME = "Lesson run log.md"


def log_path() -> Path:
    """The shared run log, in the plugin's home folder beside its settings."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from plugin_settings import plugin_home
    return plugin_home() / LOG_FILENAME


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


def report_entry(lesson: str, version: str, report: str, working_dir: str | None,
                 output_dir: str | None, host: str | None) -> str:
    """One run: a heading, where everything is, then the whole checked report.

    The report's own headings drop one level, so each run stays one section of
    the log and its parts read as that run's parts.
    """
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [f"\n## {now} - {lesson}", ""]
    lines.append(f"- Plugin: {version}" + (f", on {host}" if host else ""))
    if working_dir:
        lines.append(f"- Working files: `{working_dir}`")
    if output_dir:
        lines.append(f"- Resources made in: `{output_dir}`")
    body = []
    for line in report.replace("\r\n", "\n").splitlines():
        if line.startswith("#"):
            line = "#" + line
            if line.lstrip("#").strip().lower() in ("lesson run report", "run report"):
                continue
        body.append(line)
    return "\n".join(lines) + "\n\n" + "\n".join(body).strip("\n") + "\n"


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
        if not existing.lstrip().startswith(LOG_HEADER.strip()):
            existing = LOG_HEADER + existing
        path.write_text(existing.rstrip("\n") + "\n" + entry, encoding="utf-8")
        return None
    except OSError as exc:
        return f"{path}: {exc}"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--where", action="store_true", help="print the log's path and exit")
    ap.add_argument("--lesson", help="what this run built, in plain English")
    ap.add_argument("--report", help="the checked run report to add, whole")
    ap.add_argument("--working-dir", help="the run's working folder")
    ap.add_argument("--output-dir", help="where the run made its resources")
    ap.add_argument("--host", help="claude or codex")
    ap.add_argument("--finding", action="append", default=[],
                    help="one reusable engine finding; repeat for several")
    ap.add_argument("--plugin-root", help="the verified PLUGIN_ROOT of this run")
    # Retired: the log no longer goes into the package. Accepted so an older
    # instruction still runs.
    ap.add_argument("--source-root", help=argparse.SUPPRESS)
    args = ap.parse_args(argv)

    target = log_path()
    if args.where:
        print(target)
        return 0

    if not args.lesson:
        ap.error("--lesson is required")
    version = plugin_version(args.plugin_root)

    report_path = Path(args.report) if args.report else None
    if report_path:
        try:
            report = report_path.read_text(encoding="utf-8")
        except OSError as exc:
            print(f"BUILD_REVIEW_LOG_FAILED: cannot read the report: {exc}", file=sys.stderr)
            return 1
        entry = report_entry(args.lesson, version, report, args.working_dir, args.output_dir, args.host)
        what = "run report"
    else:
        findings = [f for f in args.finding if f and f.strip()]
        if not findings:
            ap.error("give --report, or at least one --finding")
        entry = entry_text(args.lesson, version, findings)
        what = f"{len(findings)} finding(s)"

    error = append(target, entry)
    if error:
        print(f"BUILD_REVIEW_LOG_FAILED: {error}", file=sys.stderr)
        return 1
    if report_path:
        # The log holds the report now; the lesson folder keeps no second copy.
        try:
            report_path.unlink()
        except OSError:
            pass
    print(f"BUILD_REVIEW_LOG_OK {what}")
    print(f"- written to {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
