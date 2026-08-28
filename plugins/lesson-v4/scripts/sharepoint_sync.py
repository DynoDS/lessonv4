#!/usr/bin/env python3
"""Copy one lesson run into the correct OneDrive-backed SharePoint folder."""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path


DEFAULT_SCHOOL_ROOT = Path(r"E:\Felmore Primary School")
# Only used when a caller passes no --file arguments at all. Keep every lesson
# output format the sync routine can legitimately receive.
FALLBACK_EXTENSIONS = {".docx", ".pptx", ".xlsx", ".html", ".pdf"}


def derive_school_year(term_file: Path) -> str:
    """Derive a school-year label such as 2026-2027 from Term.md."""
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
        raise ValueError(f"Files to sync must be plain filenames: {filename!r}")
    return filename


def choose_files(source: Path, requested: list[str]) -> list[Path]:
    if requested:
        names = [validate_filename(name) for name in requested]
        paths = [source / name for name in names]
        missing = [path.name for path in paths if not path.is_file()]
        if missing:
            raise FileNotFoundError(
                "Requested output files do not exist: " + ", ".join(missing)
            )
        return paths

    return sorted(
        path
        for path in source.iterdir()
        if path.is_file()
        and not path.name.startswith("~$")
        and path.suffix.lower() in FALLBACK_EXTENSIONS
    )


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
) -> tuple[Path, list[Path]]:
    if not term_file.is_file():
        raise FileNotFoundError(f"Term file not found: {term_file}")
    if not school_root.is_dir():
        raise FileNotFoundError(f"SharePoint/OneDrive root is not mounted: {school_root}")
    if not source.is_dir():
        raise FileNotFoundError(f"Output folder not found: {source}")

    school_year = derive_school_year(term_file)
    files = choose_files(source, requested)
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
        destination.mkdir(parents=True, exist_ok=True)
        for path in files:
            shutil.copy2(path, destination / path.name)

    return destination, files


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Copy selected lesson files to the correct SharePoint folder."
    )
    parser.add_argument("--term-file", required=True, type=Path)
    parser.add_argument("--school-root", type=Path, default=DEFAULT_SCHOOL_ROOT)
    parser.add_argument("--year", required=True, type=int, choices=range(1, 7))
    parser.add_argument("--term-folder", required=True)
    parser.add_argument("--week", required=True, type=int)
    parser.add_argument("--subject", default="")
    parser.add_argument("--day", default="")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--file", action="append", default=[], dest="files")
    parser.add_argument("--dry-run", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        destination, files = sync_files(
            term_file=args.term_file.resolve(),
            school_root=args.school_root.resolve(),
            year_group=args.year,
            term_folder=args.term_folder.strip(),
            week=args.week,
            subject=args.subject.strip(),
            day=args.day.strip(),
            source=args.source.resolve(),
            requested=args.files,
            dry_run=args.dry_run,
        )
    except (OSError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"DESTINATION={destination}")
    for path in files:
        print(f"FILE={path.name}")
    print(f"STATUS={'DRY_RUN' if args.dry_run else 'COPIED'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
