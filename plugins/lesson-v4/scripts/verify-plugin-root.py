#!/usr/bin/env python3
"""Verify an explicit lesson-resources package root without searching for one."""
from __future__ import annotations

import os
import sys
from pathlib import Path

REQUIRED_PACKAGE_PATHS = (
    "skills/make-lesson/SKILL.md",
    "skills/make-lesson/playbook-lite.md",
    "agents/lesson-designer.md",
    "scripts/validate-lesson-design.py",
    "scripts/make-lesson-runtime.py",
    "scripts/worker-launch.py",
    "scripts/run-fixed-resource.py",
    "scripts/find-python.js",
    "scripts/check-setup.js",
    "scripts/plugin-settings.js",
    "scripts/python_extras.py",
    "scripts/photo-contract.py",
    "scripts/collect-helper-uses.py",
    "scripts/check-helper-coverage.py",
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

        # Walk up rather than looking only at the parent. The plugin used to sit
        # directly inside its repository, so the parent was always the checkout.
        # It now lives one level deeper, under `plugins/`, which left this guard
        # rejecting the real source tree and telling the caller to go and find a
        # repository they were already standing in.
        if not any((folder / ".git").exists() for folder in root.parents):
            raise RootError(
                "source root is not inside a git checkout: no .git above "
                f"{root}"
            )

        if not os.access(root, os.W_OK):
            raise RootError(f"source root is not writable: {root}")

    return root


# Where a writable checkout of this package is looked for, in order, when the
# caller asks for one rather than naming it. The helper route depends on this:
# it used to wait for an environment value that in practice was never set, so
# "build the missing helper" was a branch no run could ever take and every
# lesson needing a new visual silently shipped a substitute instead.
SOURCE_ENV_VARS = ("LESSON_V4_SOURCE_ROOT", "LESSON_RESOURCES_SOURCE_ROOT")

# The conventional checkout location. Absent is a normal answer, not a fault.
SOURCE_CONVENTIONS = ("Projects/lessonv4/plugins/lesson-v4",)


def find_source(package_root: str | None) -> tuple[Path | None, list[str]]:
    """Locate a writable checkout of this package, or say why there isn't one.

    Order: an explicit environment value, the running package root itself
    (which is the checkout whenever the plugin is run from source), then the
    conventional location. Every candidate is verified the same way an
    explicitly named one is, so an unwritable or incomplete tree is rejected
    rather than half-used.
    """
    notes: list[str] = []
    candidates: list[tuple[str, str]] = []

    for name in SOURCE_ENV_VARS:
        value = os.environ.get(name)
        if value:
            candidates.append((f"${name}", value))

    if package_root:
        candidates.append(("the running package root", package_root))

    home = Path.home()
    for relative in SOURCE_CONVENTIONS:
        candidates.append((f"~/{relative}", str(home / relative)))

    seen: set[str] = set()
    for label, value in candidates:
        if value in seen:
            continue
        seen.add(value)
        try:
            return verify(value, source=True), notes
        except RootError as exc:
            notes.append(f"{label}: {exc}")
    return None, notes


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    source = False

    if args and args[0] == "--find-source":
        package_root = args[1] if len(args) > 1 else None
        root, notes = find_source(package_root)
        if root is None:
            print("PLUGIN_SOURCE_ROOT_UNAVAILABLE", file=sys.stderr)
            for note in notes:
                print(f"- {note}", file=sys.stderr)
            return 1
        print(f"PLUGIN_SOURCE_ROOT={root}")
        return 0

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
