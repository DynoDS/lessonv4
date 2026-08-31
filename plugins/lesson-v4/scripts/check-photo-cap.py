#!/usr/bin/env python3
"""Enforce the lesson-wide ceiling on required Image Team picture requests."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# The lesson designer plans against 16. That is a design budget, not the whole
# run's ceiling: a helper, a repair or an adaptation that genuinely needs a
# picture later must be able to have one, so the stages after the design check
# against RUN_MAX_PHOTOS instead. Blocking a real late need was costing the
# lesson a picture it needed to protect a number chosen to bound the design.
MAX_PHOTOS = 16
RUN_MAX_PHOTOS = 24

STAGE_LIMITS = {"design": MAX_PHOTOS, "run": RUN_MAX_PHOTOS}


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


def check_photo_cap(path: Path, stage: str = "design") -> tuple[bool, int, str]:
    limit = STAGE_LIMITS[stage]
    data = read_requirements(path)
    count = len(data["photos"])
    if count > limit:
        scope = (
            "one lesson design may promote at most"
            if stage == "design"
            else "one automated lesson run may promote at most"
        )
        return (
            False,
            count,
            (
                f"PHOTO_CAP_EXCEEDED: {count} Image Team picture requests were "
                f"promoted, but {scope} {limit}. Return the competing visual jobs "
                "to the responsible pedagogical owner before any new picture work "
                "starts."
            ),
        )
    return (
        True,
        count,
        (
            f"PHOTO_CAP_OK: {count}/{limit} required Image Team picture "
            "requests promoted; optional P2/P3 Educational SVG pictures, emojis and "
            "engine-rendered visuals are outside this count."
        ),
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("requirements")
    parser.add_argument(
        "--stage",
        choices=sorted(STAGE_LIMITS),
        default="design",
        help=(
            "design: the lesson designer's own budget (16). "
            "run: the whole run's ceiling (24), for stages that legitimately "
            "add a picture after the design is settled."
        ),
    )
    return parser


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        ok, _, message = check_photo_cap(Path(args.requirements), args.stage)
    except ValueError as exc:
        print(f"PHOTO_CAP_CHECK_FAILED: {exc}", file=sys.stderr)
        return 1

    stream = sys.stdout if ok else sys.stderr
    print(message, file=stream)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
