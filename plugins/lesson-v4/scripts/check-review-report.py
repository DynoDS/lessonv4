#!/usr/bin/env python3
"""Prove a review report exists and carries an exact usable result.

The orchestrator routes on the review's Result line, so a missing file, a
missing heading or a free-text verdict turns a deterministic branch into a
guess. This replaces the retired review packet's report verification with
the small part a route actually needs.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED_HEADINGS = (
    "## Result",
    "## Corrections made",
    "## Flags for the teacher",
)


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    opts = dict(zip(args[::2], args[1::2]))
    report_path = opts.get("--report")
    allowed_raw = opts.get("--allowed-results")
    if not report_path or not allowed_raw:
        print(
            "Usage: check-review-report.py --report <file> "
            '--allowed-results "APPROVED,REDESIGN REQUIRED"',
            file=sys.stderr,
        )
        return 2
    allowed = [value.strip() for value in allowed_raw.split(",") if value.strip()]

    path = Path(report_path)
    if not path.is_file():
        print(f"REVIEW_REPORT_INVALID: missing report file {path}", file=sys.stderr)
        return 1
    text = path.read_text(encoding="utf-8")

    for heading in REQUIRED_HEADINGS:
        if heading not in text:
            print(
                f"REVIEW_REPORT_INVALID: {path.name} is missing the "
                f"'{heading}' heading",
                file=sys.stderr,
            )
            return 1

    body = text.split("## Result", 1)[1]
    body = body.split("##", 1)[0]
    lines = [line.strip().strip("`") for line in body.splitlines() if line.strip()]
    result = lines[0] if lines else ""
    if result not in allowed:
        print(
            f"REVIEW_REPORT_INVALID: {path.name} Result is "
            f"{result!r}, not one of {', '.join(allowed)}",
            file=sys.stderr,
        )
        return 1

    print(f"REVIEW_REPORT_OK: {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
