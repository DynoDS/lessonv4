#!/usr/bin/env python3
"""Cut a strip off the edge of a picture, once, before anything uses it.

A slide can show a chosen part of a picture, but a worksheet, the working wall
and a card print all of it. So an archive's stamp in the corner of the one
photograph that showed how wide the Severn estuary is went onto two slides and
onto the A3 wall sheet about 50mm wide (stress test, 7 October 2026). The
teacher's ruling on it (10 October 2026): a clean photograph that teaches as
well comes first; failing that, trim the mark off; and if the trimmed picture
looks wrong, keep the picture as it was. Never a blank.

The Image Scout names the strip as fractions of each edge, looks at the result
with `preview`, and writes the same fractions in its result row. The finaliser
applies them to the file it publishes, so every surface gets the trimmed
picture and nothing downstream has to know.

  python picture_trim.py preview --source <candidate> --output <WORK_ROOT>/... --bottom 0.3
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import python_extras  # noqa: F401,E402 - the plugin's own installed libraries

EDGES = ("top", "bottom", "left", "right")
# A trim removes a mark at the edge. More than this off one edge, or more than
# half the picture across one direction, is a different picture, and choosing a
# different picture is done by looking for one.
MAX_EDGE = 0.4
MAX_AXIS = 0.5


class TrimError(ValueError):
    pass


def checked(trim) -> dict[str, float]:
    """The four edge fractions, or TrimError saying what is wrong with them."""
    if not isinstance(trim, dict) or not trim or set(trim) - set(EDGES):
        raise TrimError("trim names edges to cut: top, bottom, left, right, each a fraction of the picture")
    out = {}
    for edge in EDGES:
        value = trim.get(edge, 0)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= MAX_EDGE:
            raise TrimError(f"trim {edge} must be a fraction from 0 to {MAX_EDGE}")
        out[edge] = float(value)
    if not any(out.values()):
        raise TrimError("trim cuts nothing: leave the field out for a picture used whole")
    if out["top"] + out["bottom"] > MAX_AXIS or out["left"] + out["right"] > MAX_AXIS:
        raise TrimError(f"trim removes more than {MAX_AXIS} of the picture in one direction; that is a different picture")
    return out


def trim_file(source: Path, output: Path, trim) -> tuple[int, int]:
    """Write `source` with the named strips cut off. Returns the new size."""
    from PIL import Image

    edges = checked(trim)
    with Image.open(source) as image:
        image.load()
        width, height = image.size
        box = (
            round(width * edges["left"]), round(height * edges["top"]),
            width - round(width * edges["right"]), height - round(height * edges["bottom"]),
        )
        cut = image.crop(box)
        fmt = image.format or "PNG"
        output.parent.mkdir(parents=True, exist_ok=True)
        options = {"quality": 95} if fmt == "JPEG" else {}
        if fmt == "JPEG" and cut.mode not in {"RGB", "L"}:
            cut = cut.convert("RGB")
        cut.save(output, format=fmt, **options)
        return cut.size


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    preview = sub.add_parser("preview")
    preview.add_argument("--source", required=True)
    preview.add_argument("--output", required=True)
    for edge in EDGES:
        preview.add_argument(f"--{edge}", type=float, default=0)
    args = parser.parse_args()
    trim = {edge: getattr(args, edge) for edge in EDGES if getattr(args, edge)}
    try:
        width, height = trim_file(Path(args.source), Path(args.output), trim)
    except (TrimError, OSError) as exc:
        print(f"PICTURE_TRIM_REFUSED: {exc}", file=sys.stderr)
        return 1
    print(f"PICTURE_TRIM_PREVIEW: {args.output} {width}x{height} trim {trim}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
