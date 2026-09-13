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
    "scripts/plugin_settings.py",
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


# Where a writable checkout of this package is looked for, when the caller asks
# for one rather than naming it. Writing to the package during a run (the build
# log in the checkout, installing a helper) is for the computer the plugin is
# developed on, and only there: on any other teacher's computer a run that edits
# its own plugin turns it into a private variant that the next update overwrites
# or clashes with. So a checkout is used only when this computer has been told
# where it is: `lesson-settings.py developer on <folder>`, or the environment
# value for a box configured without settings (a cloud environment). Nothing is
# guessed, neither from the running package nor from a conventional folder name,
# because a guess is how another teacher's plugin would start changing itself.
SOURCE_ENV_VAR = "LESSON_RESOURCES_SOURCE_ROOT"


def find_source(package_root: str | None = None) -> tuple[Path | None, list[str]]:
    """Locate this computer's writable checkout of the package, or say why not.

    `package_root` is accepted for callers that still pass it and is not used as
    a candidate. Every candidate is verified the same way an explicitly named
    one is, so an unwritable or incomplete tree is rejected rather than half-used.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import plugin_settings

    notes: list[str] = []
    candidates: list[tuple[str, str]] = []
    value = os.environ.get(SOURCE_ENV_VAR, "").strip()
    if value:
        candidates.append((f"${SOURCE_ENV_VAR}", value))
    configured = plugin_settings.developer_source()
    if configured:
        candidates.append(("developer mode in this computer's settings", configured))
    if not candidates:
        notes.append(
            "developer mode is off on this computer, so no run writes to the plugin itself "
            "(turn it on with lesson-settings.py developer on <folder>)"
        )

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
