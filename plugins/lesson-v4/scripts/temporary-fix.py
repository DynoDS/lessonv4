#!/usr/bin/env python3
"""A temporary fix: this lesson built from a corrected copy of the plugin.

A run can meet something the plugin cannot draw in the middle of a build: on 20
October 2026 the stick-in pack could not print a world map with named places
and nothing shaded, and nothing in the run could fix it. With the teacher there,
the plugin was changed; on a cloud run nobody would have been, and the whole
pack would have gone. The teacher's ruling (21 October 2026): the run makes a
temporary fix this lesson alone uses, tells him, and leaves the plugin as it is,
because he may not want the change.

So the fix is made in a copy of the plugin inside the lesson's own folder,
checked, used for this lesson's build, and kept as a small record of what
changed that `/install-helper` can apply later. The installed plugin is never
written to.

    make    copy the plugin into [WORKING_DIR]/temporary-fix/plugin
    check   what changed, and the plugin's own tests run on the copy
    record  keep the changed files and a readable diff beside the note
    tidy    remove the copy once the record is kept
    apply   put a recorded fix into a plugin checkout (used by /install-helper)

Standard library only.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

FIX_DIR = "temporary-fix"
COPY = "plugin"
MARKER = "TEMPORARY_FIX.json"
RECORD = "record.json"
NOTE = "note.md"

# Never copied: installed libraries are found from the plugin through NODE_PATH
# (they are most of the plugin's size), and history, caches and evaluations are
# not code a build runs.
SKIP = {"node_modules", ".git", "__pycache__", ".pytest_cache", "evals"}

# A temporary fix changes how something is drawn or built. What agents are told
# is a teacher's decision about every future lesson, never one run's repair.
NOT_A_FIX = ("agents/", "skills/", "commands/", "references/", ".claude-plugin/")

NODE_SUITES = {
    "builder": ["node", "--test", "test/*.test.js"],
    "shared": ["node", "--test", "test/*.test.js"],
    "stick-in-sheets-html": ["node", "--test"],
    "worksheet-html": ["node", "--test"],
    "working-wall-html": ["node", "--test"],
}
NODE_LIBRARIES = ["builder", "stick-in-sheets-html", "worksheet-html", "working-wall-html"]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def node_path(original: Path) -> str:
    """Where a build run from the copy finds the plugin's installed libraries."""
    found = [str(original / name / "node_modules") for name in NODE_LIBRARIES if (original / name / "node_modules").is_dir()]
    if os.environ.get("NODE_PATH"):
        found.append(os.environ["NODE_PATH"])
    return os.pathsep.join(found)


def files_of(root: Path) -> dict[str, Path]:
    out: dict[str, Path] = {}
    for path in root.rglob("*"):
        if path.is_file() and not any(part in SKIP for part in path.relative_to(root).parts) and path.name != MARKER:
            out[path.relative_to(root).as_posix()] = path
    return out


def changes(copy: Path, original: Path) -> list[str]:
    mine, theirs = files_of(copy), files_of(original)
    changed = [rel for rel, path in mine.items() if rel not in theirs or theirs[rel].read_bytes() != path.read_bytes()]
    return sorted(changed)


def paths(working: Path) -> tuple[Path, Path]:
    fix = working / FIX_DIR
    return fix, fix / COPY


def make(args) -> int:
    original = Path(args.plugin_root).resolve()
    fix, copy = paths(Path(args.working_dir).resolve())
    if (copy / MARKER).is_file():
        print(f"TEMPORARY_FIX_COPY={copy}")
        print("TEMPORARY_FIX_REUSED: this run already has a copy; the fix goes into the same one.")
        return 0
    fix.mkdir(parents=True, exist_ok=True)
    shutil.copytree(original, copy, ignore=shutil.ignore_patterns(*SKIP), dirs_exist_ok=True)
    (copy / MARKER).write_text(json.dumps({
        "original": str(original),
        "made": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "gap": args.gap or "",
    }, indent=2), encoding="utf-8")
    print(f"TEMPORARY_FIX_COPY={copy}")
    print(f"NODE_PATH={node_path(original)}")
    return 0


def original_of(copy: Path) -> Path:
    return Path(json.loads((copy / MARKER).read_text(encoding="utf-8"))["original"])


def check(args) -> int:
    fix, copy = paths(Path(args.working_dir).resolve())
    if not (copy / MARKER).is_file():
        print("TEMPORARY_FIX_CHECK_FAILED: no copy to check; run make first.")
        return 1
    original = original_of(copy)
    changed = changes(copy, original)
    if not changed:
        print("TEMPORARY_FIX_CHECK_FAILED: the copy is the same as the plugin; nothing was fixed.")
        return 1
    refused = [rel for rel in changed if rel.startswith(NOT_A_FIX)]
    if refused:
        print("TEMPORARY_FIX_CHECK_FAILED: a temporary fix changes drawing and build code only, never what "
              "agents are told: " + ", ".join(refused))
        return 1
    env = dict(os.environ, NODE_PATH=node_path(original))
    failed = []
    for folder, command in NODE_SUITES.items():
        if (copy / folder).is_dir():
            done = subprocess.run(command, cwd=copy / folder, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
            if done.returncode != 0:
                lines = [line for line in (done.stdout + done.stderr).splitlines() if line.lstrip().startswith(("✖", "not ok"))]
                failed.append(f"{folder}: " + ("; ".join(lines[:5]) or f"exit {done.returncode}"))
    if any(rel.startswith("scripts/") for rel in changed):
        done = subprocess.run([sys.executable, "-m", "pytest", "scripts/tests", "-q", "-p", "no:cacheprovider", "-x"],
                              cwd=copy, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if done.returncode != 0:
            failed.append("scripts: " + (done.stdout.strip().splitlines() or [f"exit {done.returncode}"])[-1])
    print("TEMPORARY_FIX_CHANGED: " + ", ".join(changed))
    if failed:
        print("TEMPORARY_FIX_CHECK_FAILED: the plugin's own tests fail on the copy: " + " | ".join(failed))
        return 1
    print(f"TEMPORARY_FIX_CHECK_OK: {len(changed)} file(s) changed, the plugin's tests pass on the copy")
    return 0


def record(args) -> int:
    fix, copy = paths(Path(args.working_dir).resolve())
    note = fix / NOTE
    if not note.is_file() or not note.read_text(encoding="utf-8").strip():
        print(f"TEMPORARY_FIX_RECORD_FAILED: write {note} first: what the fix does, which resource and page use it, and why.")
        return 1
    original = original_of(copy)
    changed = changes(copy, original)
    if not changed:
        print("TEMPORARY_FIX_RECORD_FAILED: nothing changed in the copy.")
        return 1
    kept = fix / "files"
    entries, diff = [], []
    for rel in changed:
        after = copy / rel
        before = original / rel
        (kept / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(after, kept / rel)
        entries.append({"path": rel, "before": sha(before) if before.is_file() else None, "after": sha(after)})
        try:
            old = before.read_text(encoding="utf-8").splitlines(keepends=True) if before.is_file() else []
            new = after.read_text(encoding="utf-8").splitlines(keepends=True)
            diff.extend(difflib.unified_diff(old, new, f"a/{rel}", f"b/{rel}"))
        except UnicodeDecodeError:
            diff.append(f"Binary file b/{rel} changed\n")
    (fix / RECORD).write_text(json.dumps({"schemaVersion": 1, "original": str(original), "files": entries}, indent=2), encoding="utf-8")
    (fix / "fix.diff").write_text("".join(diff), encoding="utf-8")
    print(f"TEMPORARY_FIX_RECORDED: {len(entries)} file(s) kept in {kept}")
    return 0


def tidy(args) -> int:
    fix, copy = paths(Path(args.working_dir).resolve())
    if copy.exists() and not (fix / RECORD).is_file():
        print("TEMPORARY_FIX_TIDY_REFUSED: record the fix before removing the copy it lives in.")
        return 1
    if copy.exists():
        shutil.rmtree(copy)
    print("TEMPORARY_FIX_TIDIED")
    return 0


def apply(args) -> int:
    fix = Path(args.fix).resolve()
    target = Path(args.to).resolve()
    data = json.loads((fix / RECORD).read_text(encoding="utf-8"))
    moved = []
    for entry in data["files"]:
        dest = target / entry["path"]
        now = sha(dest) if dest.is_file() else None
        if now != entry["before"] and now != entry["after"]:
            moved.append(entry["path"])
    if moved:
        print("TEMPORARY_FIX_APPLY_REFUSED: these files have changed in the plugin since the fix was made, so "
              "copying the fix over them would undo that work; merge by hand: " + ", ".join(moved))
        return 1
    if args.dry_run:
        print("TEMPORARY_FIX_APPLY_PREVIEW: " + ", ".join(e["path"] for e in data["files"]))
        return 0
    for entry in data["files"]:
        dest = target / entry["path"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(fix / "files" / entry["path"], dest)
    print(f"TEMPORARY_FIX_APPLIED: {len(data['files'])} file(s) into {target}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("make"); p.add_argument("--plugin-root", required=True); p.add_argument("--working-dir", required=True); p.add_argument("--gap", default="")
    for name in ("check", "record", "tidy"):
        p = sub.add_parser(name); p.add_argument("--working-dir", required=True)
    p = sub.add_parser("apply"); p.add_argument("--fix", required=True, help="the run's temporary-fix folder"); p.add_argument("--to", required=True, help="the plugin checkout's plugin folder"); p.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    return {"make": make, "check": check, "record": record, "tidy": tidy, "apply": apply}[args.command](args)


if __name__ == "__main__":
    import utf8_output
    utf8_output.enable()
    raise SystemExit(main())
