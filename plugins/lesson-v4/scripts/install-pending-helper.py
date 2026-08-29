#!/usr/bin/env python3
"""Check and install a helper drop-in written by ``helper-builder``.

A helper is built in the middle of somebody's lesson, from one lesson's need,
with nobody having read it. So the builder writes it into the run's own working
folder rather than into the package, and this script is the deterministic half
of getting it from there into a checkout later, when a person is present to look
at the pictures.

It does two jobs and no others:

``check``   proves a drop-in is complete and internally consistent - the
            manifest parses, every file it lists is really there, and every
            destination lands inside the package. This is the one check the
            builder can run against a tree it is not writing to.

``install`` copies those files into a verified source checkout, refusing any
            copy that would silently overwrite or silently create. It never
            edits a registry, never bumps a version, and never runs git: the
            surgical wiring, the proofs and the decision to publish belong to
            the caller, with the teacher.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

SCHEMA_VERSION = 1
MANIFEST_NAME = "install.json"
README_NAME = "README.md"
KINDS = ("drawn", "stock")
SURFACES = ("slides", "worksheets", "wall", "stick-in")
ACTIONS = ("add", "replace")


class DropInError(ValueError):
    pass


def _relative_inside(value: object, label: str) -> Path:
    """A drop-in path must stay inside its own folder and inside the package."""
    if not isinstance(value, str) or not value.strip():
        raise DropInError(f"{label} must be a non-empty string")
    if value.startswith("/") or value.startswith("\\"):
        raise DropInError(f"{label} must be relative, not {value!r}")
    path = Path(value)
    if path.is_absolute() or path.drive or path.anchor:
        raise DropInError(f"{label} must be relative, not {value!r}")
    if ".." in path.parts:
        raise DropInError(f"{label} must not step outside the package: {value!r}")
    return path


def _string(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise DropInError(f"{label} must be a non-empty string")
    return value


def load_manifest(pending: Path) -> dict:
    manifest_path = pending / MANIFEST_NAME
    if not manifest_path.is_file():
        raise DropInError(f"{MANIFEST_NAME} is missing from {pending}")
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise DropInError(f"{MANIFEST_NAME} is unreadable JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise DropInError(f"{MANIFEST_NAME} root must be an object")
    if data.get("schemaVersion") != SCHEMA_VERSION:
        raise DropInError(f"{MANIFEST_NAME} must use schemaVersion {SCHEMA_VERSION}")

    _string(data.get("name"), f"{MANIFEST_NAME}.name")
    _string(data.get("summary"), f"{MANIFEST_NAME}.summary")

    kind = data.get("kind")
    if kind not in KINDS:
        raise DropInError(f"{MANIFEST_NAME}.kind must be one of {', '.join(KINDS)}")

    surfaces = data.get("surfaces")
    if not isinstance(surfaces, list) or not surfaces:
        raise DropInError(f"{MANIFEST_NAME}.surfaces must name at least one surface")
    for surface in surfaces:
        if surface not in SURFACES:
            raise DropInError(
                f"{MANIFEST_NAME}.surfaces contains {surface!r}; "
                f"allowed: {', '.join(SURFACES)}"
            )

    files = data.get("files")
    if not isinstance(files, list) or not files:
        raise DropInError(f"{MANIFEST_NAME}.files must list at least one file")
    seen_destinations: set[str] = set()
    for index, entry in enumerate(files):
        label = f"{MANIFEST_NAME}.files[{index}]"
        if not isinstance(entry, dict):
            raise DropInError(f"{label} must be an object")
        source = _relative_inside(entry.get("from"), f"{label}.from")
        destination = _relative_inside(entry.get("to"), f"{label}.to")
        if entry.get("action") not in ACTIONS:
            raise DropInError(f"{label}.action must be one of {', '.join(ACTIONS)}")
        if not (pending / source).is_file():
            raise DropInError(
                f"{label}.from names a file the drop-in does not contain: {source}"
            )
        key = destination.as_posix()
        if key in seen_destinations:
            raise DropInError(f"{MANIFEST_NAME}.files sends two files to {key}")
        seen_destinations.add(key)

    wiring = data.get("wiring")
    if not isinstance(wiring, list):
        raise DropInError(f"{MANIFEST_NAME}.wiring must be an array (empty is allowed)")
    for index, entry in enumerate(wiring):
        label = f"{MANIFEST_NAME}.wiring[{index}]"
        if not isinstance(entry, dict):
            raise DropInError(f"{label} must be an object")
        _relative_inside(entry.get("file"), f"{label}.file")
        _string(entry.get("change"), f"{label}.change")

    unproven = data.get("unproven")
    if not isinstance(unproven, list):
        raise DropInError(f"{MANIFEST_NAME}.unproven must be an array (empty is allowed)")
    for index, item in enumerate(unproven):
        _string(item, f"{MANIFEST_NAME}.unproven[{index}]")

    if not (pending / README_NAME).is_file():
        raise DropInError(f"{README_NAME} is missing from {pending}")

    return data


def cmd_check(args) -> int:
    pending = Path(args.pending)
    if not pending.is_dir():
        raise DropInError(f"pending helper folder does not exist: {pending}")
    data = load_manifest(pending)
    print(
        f"PENDING_HELPER_OK {data['name']}: {len(data['files'])} file(s), "
        f"{len(data['wiring'])} wiring edit(s), "
        f"{len(data['unproven'])} unproven check(s)"
    )
    return 0


def cmd_install(args) -> int:
    pending = Path(args.pending)
    if not pending.is_dir():
        raise DropInError(f"pending helper folder does not exist: {pending}")
    root = Path(args.source_root)
    if not root.is_dir():
        raise DropInError(f"source root does not exist: {root}")

    data = load_manifest(pending)

    planned: list[tuple[Path, Path, str]] = []
    for entry in data["files"]:
        source = pending / Path(entry["from"])
        destination = root / Path(entry["to"])
        action = entry["action"]
        exists = destination.exists()
        # An `add` that would overwrite, or a `replace` that would create, means
        # the drop-in and the checkout disagree about what is already there.
        # Copying either way loses work silently, so refuse the whole install.
        if action == "add" and exists:
            raise DropInError(
                f"{entry['to']} already exists in the checkout "
                "but the manifest calls it an add"
            )
        if action == "replace" and not exists:
            raise DropInError(
                f"{entry['to']} does not exist in the checkout "
                "but the manifest calls it a replace"
            )
        planned.append((source, destination, action))

    if args.dry_run:
        for _, destination, action in planned:
            print(f"WOULD {action.upper()} {destination}")
    else:
        for source, destination, action in planned:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
            print(f"{action.upper()} {destination}")

    for entry in data["wiring"]:
        print(f"WIRING_REQUIRED {entry['file']}: {entry['change']}")
    for item in data["unproven"]:
        print(f"UNPROVEN {item}")

    if args.dry_run:
        print(f"PENDING_HELPER_INSTALL_PLANNED {data['name']}")
    else:
        print(
            f"PENDING_HELPER_FILES_INSTALLED {data['name']}: {len(planned)} file(s)"
        )
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Check or install a helper drop-in.")
    sub = parser.add_subparsers(dest="command", required=True)

    check = sub.add_parser("check", help="validate a drop-in without touching a checkout")
    check.add_argument("--pending", required=True)
    check.set_defaults(func=cmd_check)

    install = sub.add_parser("install", help="copy a drop-in's files into a source checkout")
    install.add_argument("--pending", required=True)
    install.add_argument("--source-root", required=True)
    install.add_argument("--dry-run", action="store_true")
    install.set_defaults(func=cmd_install)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except DropInError as exc:
        print(f"PENDING_HELPER_INVALID: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
