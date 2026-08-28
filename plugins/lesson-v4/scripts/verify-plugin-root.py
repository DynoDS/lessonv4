#!/usr/bin/env python3
"""Verify an explicit lesson-resources package root without searching for one."""
from __future__ import annotations

import os
import sys
from pathlib import Path

REQUIRED_PACKAGE_PATHS = (
    "skills/make-lesson/SKILL.md",
    "skills/make-lesson/playbook.md",
    "agents/lesson-designer.md",
    "scripts/validate-lesson-design.py",
    "scripts/orchestration-controller.py",
    "scripts/make-lesson-runtime.py",
    "scripts/run-fixed-resource.py",
    "scripts/photo-contract.py",
    "scripts/collect-helper-uses.py",
    "scripts/finalize-picture-assignment.py",
    "scripts/compile-picture-assignments.py",
    "scripts/slugify.js",
    "references/preferences.md",
    "builder/build.js",
)

REQUIRED_SOURCE_PATHS = (
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
)


class RootError(ValueError):
    """Raised when an explicit plugin-root candidate is unusable."""


def verify(candidate_text: str, *, source: bool = False) -> Path:
    candidate = Path(candidate_text).expanduser()
    if not candidate.is_absolute():
        raise RootError(f"candidate is not an absolute path: {candidate_text}")

    try:
        root = candidate.resolve(strict=True)
    except OSError as exc:
        raise RootError(
            f"candidate cannot be resolved: {candidate}: {exc}"
        ) from None

    if not root.is_dir():
        raise RootError(f"candidate is not a directory: {root}")

    for relative in REQUIRED_PACKAGE_PATHS:
        required = root / relative
        if not required.is_file():
            raise RootError(f"required package path is missing: {required}")

    if source:
        for relative in REQUIRED_SOURCE_PATHS:
            required = root / relative
            if not required.is_file():
                raise RootError(f"required source path is missing: {required}")

        git_marker = root.parent / ".git"
        if not git_marker.exists():
            raise RootError(
                "source root is not inside the teaching-plugins git checkout: "
                f"missing {git_marker}"
            )

        if not os.access(root, os.W_OK):
            raise RootError(f"source root is not writable: {root}")

    return root


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    source = False

    if args and args[0] == "--source":
        source = True
        args = args[1:]

    if len(args) != 1:
        print(
            "Usage: python3 verify-plugin-root.py [--source] "
            "<absolute-lesson-resources-root>",
            file=sys.stderr,
        )
        return 2

    prefix = "PLUGIN_SOURCE_ROOT" if source else "PLUGIN_ROOT"

    try:
        root = verify(args[0], source=source)
    except RootError as exc:
        print(f"{prefix}_ERROR: {exc}", file=sys.stderr)
        return 2

    print(f"{prefix}={root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
