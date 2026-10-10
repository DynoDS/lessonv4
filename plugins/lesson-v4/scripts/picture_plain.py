#!/usr/bin/env python3
"""Save a picture in plain standard form, so every worker can open it.

Two readers meet each photograph. The plugin's own tools (Pillow, the builders)
are forgiving. The viewer a worker looks at a picture through is strict, and it
refuses files the tools read without complaint. In the stress test of 7 October
2026 a geranium photograph began `FF D8 FF FF E1`: one legal fill byte before
its first marker. It downloaded, passed every check and printed on five slides,
and no worker could look at it. Worse, one refused picture in a worker's view
takes the pictures beside it down too, so the lesson designer lost all six
photographs, then its small copies and its contact sheet, and rebuilt a Year 1
lesson round a plant it had never seen. The workers guessed the photographs
were too large (that one was the smallest in the lesson) because shrinking a
copy happened to rewrite the file.

So a picture is rewritten by Pillow when it is downloaded and again when it is
published, which leaves nothing of the source file's own byte layout. A JPEG
keeps its quantisation tables, so the rewrite costs no visible quality. The
rewritten file carries a short mark, so it is rewritten once and its bytes
(and every hash taken of them) then stay put.

A worker who still cannot open a picture makes a fresh copy to look at:

  python picture_plain.py copy --source <picture> --output <scratch>/<name>.jpg
"""
from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

import python_extras  # noqa: F401,E402 - the plugin's own installed libraries

MARK = "lesson-v4 plain"
# A viewing copy is for looking, not printing: this long side shows everything
# a worker judges a photograph by.
COPY_LONG_SIDE_PX = 1600


def _is_marked(image) -> bool:
    comment = image.info.get("comment")
    if isinstance(comment, bytes):
        comment = comment.decode("latin-1", "replace")
    return comment == MARK or image.info.get("Comment") == MARK


def plain_bytes(data: bytes) -> bytes:
    """`data` rewritten in plain form, or `data` itself when there is nothing to do.

    Only JPEG and PNG are rewritten; they are what the sources serve and what a
    lesson publishes. Anything else, anything already marked, and anything
    Pillow cannot rewrite comes back untouched: the caller's own decode check
    is what refuses a file that is not a picture.
    """
    try:
        from PIL import Image
        from PIL.PngImagePlugin import PngInfo

        with Image.open(io.BytesIO(data)) as image:
            image.load()
            fmt = (image.format or "").upper()
            if fmt not in ("JPEG", "MPO", "PNG") or _is_marked(image):
                return data
            out = io.BytesIO()
            extras = {}
            if image.info.get("icc_profile"):
                extras["icc_profile"] = image.info["icc_profile"]
            if fmt == "PNG":
                info = PngInfo()
                info.add_text("Comment", MARK)
                image.save(out, format="PNG", pnginfo=info, **extras)
            else:
                if image.info.get("exif"):
                    extras["exif"] = image.info["exif"]
                if fmt == "JPEG" and image.mode in ("RGB", "L"):
                    image.save(out, format="JPEG", quality="keep", subsampling="keep", comment=MARK, **extras)
                else:
                    image.convert("RGB").save(out, format="JPEG", quality=95, comment=MARK, **extras)
        rewritten = out.getvalue()
        with Image.open(io.BytesIO(rewritten)) as check:
            check.load()
            if check.size != image.size:
                return data
        return rewritten
    except Exception:
        return data


def viewing_copy(source: Path, output: Path, long_side: int = COPY_LONG_SIDE_PX) -> tuple[int, int]:
    """Write a freshly encoded copy of `source` for a worker to look at."""
    from PIL import Image

    with Image.open(source) as image:
        image.load()
        copy = image.convert("RGB")
    copy.thumbnail((long_side, long_side))
    output.parent.mkdir(parents=True, exist_ok=True)
    fmt = "PNG" if output.suffix.lower() == ".png" else "JPEG"
    copy.save(output, format=fmt, **({"quality": 90} if fmt == "JPEG" else {}))
    return copy.size


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    copy = sub.add_parser("copy")
    copy.add_argument("--source", required=True)
    copy.add_argument("--output", required=True)
    copy.add_argument("--long-side", type=int, default=COPY_LONG_SIDE_PX)
    args = parser.parse_args()
    try:
        width, height = viewing_copy(Path(args.source), Path(args.output), args.long_side)
    except Exception as exc:
        print(f"PICTURE_PLAIN_FAILED: {exc}", file=sys.stderr)
        return 1
    print(f"PICTURE_PLAIN_COPY: {args.output} {width}x{height}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
