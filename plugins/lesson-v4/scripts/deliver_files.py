#!/usr/bin/env python3
"""Copy one lesson run's teaching resources to where the teacher saves them.

Where that is comes from the plugin's settings (scripts/plugin_settings.py): a
plain folder, or a folder sorted by school year, term, week, subject and day.
On a cloud box the environment names a letterbox instead, and the resources are
pushed there for the teacher's computer to collect (letterbox_filer.py).
`--folder`, `--mode` and `--term-file` override the settings, for tests and for
a teacher who names a one-off destination.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import plugin_settings

# The teacher's drive gets the teaching resources and nothing else: the deck,
# the worksheets, the working wall and the stick-in sheets. A run also writes
# records for the teacher to read where the run was made (the run report, the
# walk-through, the plain-text answer key, build HTML), and a run once filed its
# run report and walk-through into the lesson's day folder, where the teacher
# deleted them (Daniel, 13 September 2026: "only the lesson outputs, ppt,
# working wall, worksheet, stick in sheets, no run reports, no walkthroughs").
# So the rule lives here, where every caller passes through it, rather than in
# each caller's list. The answer key is the one text file that belongs with the
# resources: the teacher marks from it (Daniel, 13 September 2026: "yes answer
# key too").
RESOURCE_EXTENSIONS = {".pptx", ".pdf", ".docx", ".xlsx"}
ANSWER_KEY_SUFFIX = " - Answers.txt"


def derive_school_year(term_file: Path) -> str:
    """Derive a school-year label such as 2026-2027 from the term dates."""
    text = term_file.read_text(encoding="utf-8")
    years = sorted({int(value) for value in re.findall(r"\b20\d{2}\b", text)})
    if not years:
        raise ValueError(f"No four-digit school-year dates found in {term_file}")
    start = years[0]
    end = years[-1] if years[-1] > start else start + 1
    return f"{start}-{end}"


def validate_filename(filename: str) -> str:
    """Accept a filename only, never a path that can escape the source folder."""
    candidate = Path(filename)
    if candidate.is_absolute() or candidate.name != filename or filename in {"", ".", ".."}:
        raise ValueError(f"Files to deliver must be plain filenames: {filename!r}")
    return filename


def is_resource(path: Path) -> bool:
    if path.name.startswith("~$"):
        return False
    return path.suffix.lower() in RESOURCE_EXTENSIONS or path.name.endswith(ANSWER_KEY_SUFFIX)


def choose_files(source: Path, requested: list[str]) -> tuple[list[Path], list[Path]]:
    """The files to copy, and the requested files left behind as run records."""
    if requested:
        names = [validate_filename(name) for name in requested]
        paths = [source / name for name in names]
        missing = [path.name for path in paths if not path.is_file()]
        if missing:
            raise FileNotFoundError(
                "Requested output files do not exist: " + ", ".join(missing)
            )
        return [p for p in paths if is_resource(p)], [p for p in paths if not is_resource(p)]

    return sorted(path for path in source.iterdir() if path.is_file() and is_resource(path)), []


def destination_for(
    school_root: Path,
    school_year: str,
    year_group: int,
    term_folder: str,
    week: int,
    subject: str,
    day: str,
) -> Path:
    destination = (
        school_root
        / f"{school_year} - Year {year_group}"
        / term_folder
        / f"Week {week}"
    )
    if subject:
        destination /= subject
    if day:
        destination /= day
    return destination


def copy_into(destination: Path, files: list[Path]) -> None:
    # Three different things can stop a copy here and they used to arrive as
    # one message. "The drive is unavailable" sends the teacher to look at a
    # drive that is mounted and working; what actually happened on 8
    # September 2026 was that the run had no permission to write outside its
    # own workspace, and the repair for that is to run the delivery step with
    # access, not to go and find the drive.
    try:
        destination.mkdir(parents=True, exist_ok=True)
        for path in files:
            target = destination / path.name
            # A run that built straight into its destination hands us a file
            # that is already where it belongs. Windows refuses that copy
            # (WinError 32), and a delivery that fails over a file already in
            # place reports a problem that does not exist.
            if target.exists() and target.resolve() == path.resolve():
                continue
            shutil.copy2(path, target)
    except PermissionError as exc:
        raise PermissionError(
            f"DELIVERY_NOT_PERMITTED: {destination} exists and this run was "
            f"refused permission to write to it ({exc}). Nothing is missing "
            "and nothing is unmounted: run the delivery step again with access "
            "to that folder. The lesson's files are untouched where "
            "they were built."
        ) from exc


def sync_files(
    *,
    term_file: Path,
    school_root: Path,
    year_group: int,
    term_folder: str,
    week: int,
    subject: str,
    day: str,
    source: Path,
    requested: list[str],
    dry_run: bool,
) -> tuple[Path, list[Path], list[Path]]:
    """Sorted delivery: school year, term, week, subject and day folders."""
    if not term_file.is_file():
        raise FileNotFoundError(f"Term dates file not found: {term_file}")
    if not school_root.is_dir():
        raise FileNotFoundError(f"The save folder is not available: {school_root}")
    if not source.is_dir():
        raise FileNotFoundError(f"Output folder not found: {source}")

    school_year = derive_school_year(term_file)
    files, skipped = choose_files(source, requested)
    if not files:
        raise FileNotFoundError(f"No lesson output files found in {source}")

    destination = destination_for(
        school_root,
        school_year,
        year_group,
        term_folder,
        week,
        subject,
        day,
    )
    if not dry_run:
        copy_into(destination, files)
    return destination, files, skipped


def copy_to_folder(
    *, folder: Path, source: Path, requested: list[str], dry_run: bool
) -> tuple[Path, list[Path], list[Path]]:
    """Plain delivery: straight into the chosen folder."""
    if not source.is_dir():
        raise FileNotFoundError(f"Output folder not found: {source}")
    if not folder.parent.is_dir():
        raise FileNotFoundError(f"The save folder is not available: {folder}")
    files, skipped = choose_files(source, requested)
    if not files:
        raise FileNotFoundError(f"No lesson output files found in {source}")
    if not dry_run:
        copy_into(folder, files)
    return folder, files, skipped


def git(clone: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(["git", "-C", str(clone), *args], capture_output=True, text=True)
    if check and result.returncode != 0:
        raise OSError(f"git {' '.join(args)} failed: {(result.stderr or result.stdout).strip()}")
    return result


def letterbox_folder_name(lesson: str, now: datetime) -> str:
    safe = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", lesson).strip().rstrip(".") or "Lesson"
    return f"{now:%Y-%m-%d %H%M%S} {safe}"[:120]


def send_to_letterbox(
    *, clone: Path, branch: str, source: Path, requested: list[str], year: int | None,
    subject: str, lesson: str, dry_run: bool, now: datetime | None = None,
) -> tuple[Path, list[Path], list[Path]]:
    """Cloud delivery: commit the resources to the letterbox branch and push.

    The teacher's computer collects them at login (letterbox_filer.py) and saves
    them the way its own settings say, because only that computer can see which
    days on its drive are already taken. Each lesson travels in a folder of its
    own with a `lesson.json` naming its year and subject, which is all the
    filer needs to place it.
    """
    if not (clone / ".git").exists():
        raise FileNotFoundError(f"The letterbox is not a git clone: {clone}")
    if not source.is_dir():
        raise FileNotFoundError(f"Output folder not found: {source}")
    files, skipped = choose_files(source, requested)
    if not files:
        raise FileNotFoundError(f"No lesson output files found in {source}")
    now = now or datetime.now(timezone.utc)
    relative = Path("lessons") / letterbox_folder_name(lesson or files[0].stem, now)
    destination = clone / relative
    if dry_run:
        return destination, files, skipped

    has_remote_branch = git(clone, "fetch", "origin", branch, check=False).returncode == 0
    if has_remote_branch:
        git(clone, "checkout", "-B", branch, f"origin/{branch}")
    else:
        git(clone, "checkout", "-B", branch)
    copy_into(destination, files)
    manifest = {
        "schemaVersion": 1,
        "lesson": lesson,
        "year": year,
        "subject": subject,
        "builtAt": now.isoformat(),
        "files": [path.name for path in files],
    }
    (destination / "lesson.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    git(clone, "add", "--", str(relative))
    identity = []
    if not git(clone, "config", "user.email", check=False).stdout.strip():
        identity = ["-c", "user.name=Lesson resources", "-c", "user.email=lesson-resources@users.noreply.github.com"]
    subprocess.run(
        ["git", "-C", str(clone), *identity, "commit", "-q", "-m", f"Lesson ready to file: {relative.name}"],
        capture_output=True, text=True, check=True,
    )
    # Another run can push to the same letterbox between our fetch and push;
    # its lessons are in different folders, so a rebase never conflicts.
    for attempt in range(3):
        pushed = git(clone, "push", "origin", f"HEAD:refs/heads/{branch}", check=False)
        if pushed.returncode == 0:
            return destination, files, skipped
        git(clone, "pull", "--rebase", "-q", "origin", branch, check=False)
    raise OSError(f"the letterbox could not be pushed: {(pushed.stderr or pushed.stdout).strip()}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Copy one lesson's teaching resources to where the teacher saves them."
    )
    parser.add_argument("--mode", choices=("folder", "sorted", "letterbox"), help="overrides the saved setting")
    parser.add_argument("--lesson", default="", help="the lesson's name, for the letterbox folder")
    parser.add_argument("--folder", type=Path, help="overrides the saved folder")
    parser.add_argument("--term-file", type=Path, help="overrides the saved term dates")
    parser.add_argument("--year", type=int, choices=range(1, 7))
    parser.add_argument("--term-folder", default="")
    parser.add_argument("--week", type=int)
    parser.add_argument("--subject", default="")
    parser.add_argument("--day", default="")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--file", action="append", default=[], dest="files")
    parser.add_argument("--dry-run", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    saved = plugin_settings.delivery()
    folder = args.folder or (Path(saved["folder"]) if saved["folder"] else None)
    term_file = args.term_file or (Path(saved["termDates"]) if saved["termDates"] else None)
    mode = args.mode or saved["mode"]
    try:
        if mode == "letterbox":
            if not saved.get("folder") and not args.folder:
                raise ValueError(
                    f"the letterbox {saved.get('missing', '')!r} was not found as a clone on this box"
                )
            destination, files, skipped = send_to_letterbox(
                clone=(args.folder or Path(saved["folder"])).resolve(), branch=saved.get("branch") or plugin_settings.DEFAULT_LETTERBOX_BRANCH,
                source=args.source.resolve(), requested=args.files, year=args.year,
                subject=args.subject.strip(), lesson=args.lesson.strip(), dry_run=args.dry_run,
            )
            print(f"LETTERBOX_BRANCH={saved.get('branch') or plugin_settings.DEFAULT_LETTERBOX_BRANCH}")
        elif folder is None or mode == "none":
            raise ValueError(
                "no save folder is set, so the resources stay where the run built them"
            )
        elif mode == "sorted":
            if term_file is None or args.year is None or not args.term_folder or args.week is None:
                raise ValueError("sorted delivery needs term dates, --year, --term-folder and --week")
            destination, files, skipped = sync_files(
                term_file=term_file.resolve(),
                school_root=folder.resolve(),
                year_group=args.year,
                term_folder=args.term_folder.strip(),
                week=args.week,
                subject=args.subject.strip(),
                day=args.day.strip(),
                source=args.source.resolve(),
                requested=args.files,
                dry_run=args.dry_run,
            )
        else:
            destination, files, skipped = copy_to_folder(
                folder=folder.resolve(), source=args.source.resolve(),
                requested=args.files, dry_run=args.dry_run,
            )
    except (OSError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"DESTINATION={destination}")
    for path in files:
        print(f"FILE={path.name}")
    for path in skipped:
        print(f"SKIPPED={path.name} (a run record, not a teaching resource; it stays in the output folder)")
    print(f"STATUS={'DRY_RUN' if args.dry_run else 'COPIED'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
