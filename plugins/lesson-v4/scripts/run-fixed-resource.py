#!/usr/bin/env python3
"""Run one fixed lesson-resources command and emit a structured result envelope.

Supported kinds: slides, worksheets, wall, stick-in, deliver.
The wrapper owns output-family collision archiving, subprocess capture, exact
builder-marker output discovery, PDF_SKIPPED handling, hashing and the summary
JSON. It never changes resource content or makes a semantic judgement.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SCHEMA_VERSION = 1


class FixedResourceError(ValueError):
    pass


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=str(path.parent), delete=False, suffix=".part"
    )
    try:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
        handle.close()
        os.replace(handle.name, path)
    except BaseException:
        handle.close()
        if os.path.exists(handle.name):
            os.remove(handle.name)
        raise


def read_json(path: Path, label: str) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise FixedResourceError(f"{label} is unreadable JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise FixedResourceError(f"{label} root must be an object")
    return value


def safe_filename_component(
    plugin_root: Path, value, fallback: str = "Lesson"
) -> str:
    # Filesystem naming has one authority: shared/text/filename.js.
    script = (
        "const { safeFilenameComponent } = "
        "require(process.argv[1] + '/shared/text/filename.js');"
        "process.stdout.write(safeFilenameComponent(process.argv[2], process.argv[3]));"
    )
    completed = subprocess.run(
        [
            "node",
            "-e",
            script,
            str(plugin_root),
            "" if value is None else str(value),
            fallback,
        ],
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise FixedResourceError(
            "shared filename helper failed: "
            + (completed.stderr.strip() or completed.stdout.strip() or "unknown error")
        )
    return completed.stdout


def archive_name(path: Path) -> Path:
    number = 1
    while True:
        candidate = path.with_name(f"{path.stem} ({number}){path.suffix}")
        if not candidate.exists():
            return candidate
        number += 1


def archive_paths(paths: list[Path]) -> list[dict]:
    archived = []
    for path in paths:
        if not path.exists():
            continue
        target = archive_name(path)
        path.rename(target)
        archived.append({"from": str(path), "to": str(target)})
    return archived


def actual_family(
    kind: str, plugin_root: Path, working: Path, output: Path, lesson_name: str
) -> list[Path]:
    if kind == "slides":
        lesson = read_json(working / "lesson.json", "lesson.json")
        base = safe_filename_component(
            plugin_root,
            lesson.get("lessonName") or "Untitled Lesson",
            "Untitled Lesson",
        )
        return [output / f"{base}.pptx"]

    if kind == "worksheets":
        base = safe_filename_component(
            plugin_root, f"{lesson_name} - Worksheets", "worksheet"
        )
        answer_base = re.sub(r"\s*-\s*Worksheets$", "", base, flags=re.IGNORECASE) or base
        paths = [
            output / f"{base}.pdf",
            output / f"{answer_base} - Answers.txt",
        ]
        # Do not feed `base` to a glob pattern: `safeFilenameComponent` quite
        # correctly preserves square brackets, which are special in glob syntax.
        paths.extend(
            sorted(
                path
                for path in output.glob("*.html")
                if path.name.startswith(f"{base}-")
            )
        )
        return paths

    if kind == "wall":
        # The wall names its own file from the spec's topic, exactly as the build
        # script does, so an earlier run's file is archived before this one writes.
        spec = read_json(working / "working-wall.json", "working-wall.json")
        base = safe_filename_component(plugin_root, spec.get("topic"), "Lesson")
        return [
            output / f"Working Wall - {base}.pdf",
            output / f"Working Wall - {base}.html",
        ]

    if kind == "stick-in":
        spec = read_json(working / "stick-in-sheets.json", "stick-in-sheets.json")
        meta = spec.get("meta")
        lesson = meta.get("lesson") if isinstance(meta, dict) else None
        base = safe_filename_component(plugin_root, lesson, "Lesson")
        return [
            output / f"{base} - Stick-in Sheets.pdf",
            output / f"{base} - Stick-in Sheets.html",
        ]

    return []


def command_for(args) -> list[str]:
    plugin_root = Path(args.plugin_root)
    working = Path(args.working_dir)
    output = Path(args.output_dir)
    if args.kind == "slides":
        return [
            "node",
            str(plugin_root / "builder" / "build.js"),
            str(working / "lesson.json"),
            str(output),
        ]
    if args.kind == "worksheets":
        return [
            "node",
            str(plugin_root / "worksheet-html" / "scripts" / "build-worksheet.js"),
            str(working / "worksheet.json"),
            str(output),
            f"{args.lesson_name} - Worksheets",
        ]
    if args.kind == "wall":
        return [
            "node",
            str(plugin_root / "working-wall-html" / "build.js"),
            str(working / "working-wall.json"),
            str(output),
        ]
    if args.kind == "stick-in":
        return [
            "node",
            str(plugin_root / "stick-in-sheets-html" / "build.js"),
            str(working / "stick-in-sheets.json"),
            str(output),
        ]
    if args.kind == "deliver":
        if not args.file:
            raise FixedResourceError("deliver requires at least one --file")
        # Where the files go is the teacher's saved setting, read by the
        # delivery script itself; the slot arguments only matter when that
        # setting sorts by term and week, and are recorded either way so the
        # next run can find the lesson that came before it.
        command = [sys.executable, str(plugin_root / "scripts" / "deliver_files.py")]
        for flag, value in (
            ("--year", args.year),
            ("--term-folder", args.term_folder),
            ("--week", args.week),
            ("--subject", args.subject),
            ("--day", args.day),
        ):
            if value not in (None, ""):
                command.extend([flag, str(value)])
        if args.lesson_name:
            command.extend(["--lesson", args.lesson_name])
        if args.letterbox:
            command.extend(["--letterbox", args.letterbox])
        command.extend(["--source", str(output)])
        for filename in args.file:
            command.extend(["--file", filename])
        return command
    raise FixedResourceError(f"unsupported kind: {args.kind}")


def marker_paths(stdout: str, marker: str) -> list[Path]:
    prefix = marker + ": "
    return [
        Path(line[len(prefix):].strip()).resolve()
        for line in stdout.splitlines()
        if line.startswith(prefix) and line[len(prefix):].strip()
    ]


def require_inside_output(paths: list[Path], output: Path) -> None:
    output = output.resolve()
    for path in paths:
        try:
            path.relative_to(output)
        except ValueError as exc:
            raise FixedResourceError(
                f"builder reported an output outside OUTPUT_DIR: {path}"
            ) from exc


def expected_outputs(args, stdout: str) -> tuple[list[Path], bool]:
    output = Path(args.output_dir).resolve()

    if args.kind == "slides":
        paths = marker_paths(stdout, "Wrote")
        if len(paths) != 1:
            raise FixedResourceError(
                "slide build exited zero without exactly one Wrote: output"
            )
        require_inside_output(paths, output)
        return paths, False

    if args.kind == "worksheets":
        answers = marker_paths(stdout, "Built answers")
        if len(answers) != 1:
            raise FixedResourceError(
                "worksheet build exited zero without exactly one Built answers: output"
            )
        degraded = "PDF_SKIPPED" in stdout
        if degraded:
            pupil = marker_paths(stdout, "Built HTML")
            if not pupil:
                raise FixedResourceError(
                    "worksheet build reported PDF_SKIPPED but wrote no Built HTML: outputs"
                )
        else:
            pupil = marker_paths(stdout, "Built")
            if len(pupil) != 1:
                raise FixedResourceError(
                    "worksheet build exited zero without exactly one Built: PDF output"
                )
        paths = [*answers, *pupil]
        require_inside_output(paths, output)
        return paths, degraded

    if args.kind == "wall":
        paths = marker_paths(stdout, "Built")
        if len(paths) != 1:
            raise FixedResourceError(
                "wall build exited zero without exactly one Built: output"
            )
        require_inside_output(paths, output)
        # No Chrome writes the wall as .html instead of .pdf. The cards are all
        # there; the print step is still owed, which is what degraded records.
        return paths, "PDF_SKIPPED" in stdout

    if args.kind == "stick-in":
        paths = marker_paths(stdout, "Built")
        if len(paths) != 1:
            raise FixedResourceError(
                "stick-in build exited zero without exactly one Built: output"
            )
        require_inside_output(paths, output)
        return paths, "PDF_SKIPPED" in stdout

    return [], False


def run(args) -> int:
    plugin_root = Path(args.plugin_root).resolve()
    working = Path(args.working_dir).resolve()
    output = Path(args.output_dir).resolve()
    if not plugin_root.is_dir():
        raise FixedResourceError(f"plugin root does not exist: {plugin_root}")
    if not working.is_dir():
        raise FixedResourceError(f"working dir does not exist: {working}")
    output.mkdir(parents=True, exist_ok=True)

    archived = []
    if args.kind != "deliver":
        if not args.lesson_name:
            raise FixedResourceError(f"{args.kind} requires --lesson-name")
        archived = archive_paths(
            actual_family(args.kind, plugin_root, working, output, args.lesson_name)
        )

    command = command_for(args)
    # The Python running this wrapper is one this machine and sandbox can start,
    # so the builders' own Python step (slide text fitting) uses it too rather
    # than guessing a name that may be refused.
    child_env = dict(os.environ, LESSON_RESOURCES_PYTHON=sys.executable)
    completed = subprocess.run(command, capture_output=True, text=True, env=child_env)
    summary = {
        "schemaVersion": SCHEMA_VERSION,
        "ok": False,
        "kind": args.kind,
        "command": command,
        "exitCode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "archived": archived,
        "degraded": False,
        "outputs": [],
    }

    if completed.returncode != 0:
        atomic_write_json(Path(args.summary_output), summary)
        print(f"FIXED_RESOURCE_FAILED {args.kind}", file=sys.stderr)
        return 1

    if args.kind == "deliver":
        # STAGED: laid out for the host's own GitHub tools to post (no git sign-in).
        delivered = "STATUS=COPIED" in completed.stdout or "STATUS=STAGED" in completed.stdout
        if not delivered or "DESTINATION=" not in completed.stdout:
            summary["stderr"] += (
                "\ndeliver_files.py exited zero without STATUS=COPIED or STATUS=STAGED and DESTINATION="
            )
            atomic_write_json(Path(args.summary_output), summary)
            print("FIXED_RESOURCE_FAILED deliver", file=sys.stderr)
            return 1
        summary["ok"] = True
        atomic_write_json(Path(args.summary_output), summary)
        print("FIXED_RESOURCE_OK deliver")
        return 0

    try:
        paths, degraded = expected_outputs(args, completed.stdout)
    except FixedResourceError as exc:
        summary["stderr"] += f"\n{exc}"
        atomic_write_json(Path(args.summary_output), summary)
        print(f"FIXED_RESOURCE_FAILED {args.kind}", file=sys.stderr)
        return 1

    missing = [str(path) for path in paths if not path.is_file()]
    if missing:
        summary["stderr"] += "\nmissing expected outputs: " + ", ".join(missing)
        atomic_write_json(Path(args.summary_output), summary)
        print(f"FIXED_RESOURCE_FAILED {args.kind}", file=sys.stderr)
        return 1

    if degraded and args.chrome_state == "ready":
        summary["stderr"] += "\nPDF_SKIPPED after shared Chrome preflight reported ready"
        atomic_write_json(Path(args.summary_output), summary)
        print(f"FIXED_RESOURCE_FAILED {args.kind}", file=sys.stderr)
        return 1

    summary["degraded"] = degraded
    summary["outputs"] = [
        {"path": str(path), "sha256": sha256_file(path)} for path in paths
    ]
    summary["ok"] = True
    atomic_write_json(Path(args.summary_output), summary)
    marker = "FIXED_RESOURCE_DEGRADED" if degraded else "FIXED_RESOURCE_OK"
    print(f"{marker} {args.kind}")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("kind", choices=("slides", "worksheets", "wall", "stick-in", "deliver"))
    root.add_argument("--plugin-root", required=True)
    root.add_argument("--working-dir", required=True)
    root.add_argument("--output-dir", required=True)
    root.add_argument("--lesson-name")
    root.add_argument("--summary-output", required=True)
    root.add_argument("--year", type=int)
    root.add_argument("--term-folder")
    root.add_argument("--week", type=int)
    root.add_argument("--subject")
    root.add_argument("--day")
    root.add_argument("--file", action="append", default=[])
    root.add_argument("--letterbox", default="")
    root.add_argument(
        "--chrome-state",
        choices=("not-needed", "ready", "unavailable"),
        default="not-needed",
    )
    return root


def main(argv=None) -> int:
    return run(parser().parse_args(argv))


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except FixedResourceError as exc:
        print(f"FIXED_RESOURCE_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
