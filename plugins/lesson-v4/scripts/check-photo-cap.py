#!/usr/bin/env python3
"""Enforce the lesson-wide ceiling on required Image Team picture requests."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

MAX_PHOTOS = 16


def read_requirements(path: Path) -> dict:
    try:
        with path.open(encoding="utf-8") as handle:
            data = json.load(handle)
    except OSError as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    except ValueError as exc:
        raise ValueError(f"{path} is not valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError("photo requirements root must be an object")
    photos = data.get("photos")
    if not isinstance(photos, list):
        raise ValueError("top-level 'photos' must be an array")
    return data


def check_photo_cap(path: Path) -> tuple[bool, int, str]:
    data = read_requirements(path)
    count = len(data["photos"])
    if count > MAX_PHOTOS:
        return (
            False,
            count,
            (
                f"PHOTO_CAP_EXCEEDED: {count} Image Team picture requests were "
                f"promoted, but one automated lesson run may promote at most "
                f"{MAX_PHOTOS}. Return the competing visual jobs to the responsible "
                "pedagogical owner before any new picture work starts."
            ),
        )
    return (
        True,
        count,
        (
            f"PHOTO_CAP_OK: {count}/{MAX_PHOTOS} required Image Team picture "
            "requests promoted; optional P2/P3 Educational SVG pictures, emojis and "
            "engine-rendered visuals are outside this count."
        ),
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("requirements")
    return parser


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        ok, _, message = check_photo_cap(Path(args.requirements))
    except ValueError as exc:
        print(f"PHOTO_CAP_CHECK_FAILED: {exc}", file=sys.stderr)
        return 1

    stream = sys.stdout if ok else sys.stderr
    print(message, file=stream)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
