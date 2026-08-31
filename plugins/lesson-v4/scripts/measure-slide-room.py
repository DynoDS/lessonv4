#!/usr/bin/env python3
"""Measure how much of each rendered slide is actually clear.

The optional-picture pass turns on one question - has this slide room to spare -
and until now that question was answered from the specification, before anything
was drawn. A specification cannot answer it. A three-zone template looks full in
JSON whether its cards are packed to the margins or holding four words each, and
a designer reading its own file back has nothing to correct the impression with.

So decks kept declining slides as `full` that were half white when you looked at
them, and the pass record could not be argued with: `nothing-fits` had to name
real searches and real rejections, while `full` and `competes` cost nothing to
write. Under any pressure at all the two free answers are the ones that get used.

This script makes them cost something. It reads the pages the designer just
rendered and reports, per slide, the largest rectangle containing no content at
all and how many separate drawing-sized clear areas the slide has.

`check-optional-pictures.py` reads the result, so `full` on a slide with a
readable clear rectangle in it fails the same way an invented rejection does.

What counts as occupied is deliberately generous: a card, a photograph, a
figure, a rule and a word are all content, so space *behind* a card - which a
`layer: "low"` drawing could genuinely use - is counted as taken. The
measurement therefore only ever understates the room, and a slide it calls full
really is full.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCHEMA_VERSION = 1

# The rendered pages are 16:9 and the cells come out square at this grid, so a
# floor expressed in cells means the same thing horizontally and vertically.
GRID_W = 160
GRID_H = 90

SLIDE_W_INCHES = 13.333
SLIDE_H_INCHES = 7.5

# A drawing smaller than this is a smudge rather than a picture, so a gap this
# size is not room. The published P3 examples sit a little above it: the banana
# resting on a card edge is 0.10 x 0.18 of the slide, or about 1.33 x 1.35
# inches. A slide with nothing this big anywhere in it is genuinely full.
READABLE_INCHES = 1.2
FLOOR_CELLS_W = max(1, round(READABLE_INCHES / (SLIDE_W_INCHES / GRID_W)))
FLOOR_CELLS_H = max(1, round(READABLE_INCHES / (SLIDE_H_INCHES / GRID_H)))

# How far a pixel may sit from the background colour and still count as clear.
# Anti-aliasing round a letter lands well outside this, which is what keeps a
# text card from reading as empty space.
COLOUR_TOLERANCE = 12

# A cell is clear only when essentially all of it is background. Kept this tight
# on purpose: the cost of calling a busy slide empty is a refused honest `full`,
# and that is the one error this check must not make.
CELL_CLEAR_THRESHOLD = 254

# Past this the count says "lots of small gaps" rather than anything useful, and
# a slide is not improved by a seventh drawing.
MAX_AREAS = 6

# A full-bleed photograph reaches the page edge, so the edge colour is then just
# one shade out of the picture and stands for nothing. Kept low on purpose: a
# busy slide with narrow margins still has a background, and setting this high
# enough to catch that case would zero the very slides whose corners are worth
# measuring. The rectangle search finds nothing on a real photograph anyway,
# since a photograph is not flat, so this is a cheap stop rather than the guard.
MIN_BACKGROUND_SHARE = 0.05


class MeasureError(RuntimeError):
    pass


def load_image(path: Path):
    try:
        from PIL import Image, ImageChops
    except ImportError as exc:  # pragma: no cover - environment fault
        raise MeasureError(f"Pillow is not available: {exc}") from exc
    try:
        image = Image.open(path)
        image.load()
    except OSError as exc:
        raise MeasureError(f"{path} is not a readable image: {exc}") from exc
    return image.convert("RGB"), Image, ImageChops


def background_colour(image, Image) -> tuple[tuple[int, int, int], float]:
    """The paper colour, taken from the page's outer edge.

    The obvious reading - the colour the page is mostly made of - is wrong on
    exactly the slides this measurement matters for. A deck whose cards are
    tinted and packed can be more card than paper, and then the modal colour is
    the card: the measurement inverts, reads every card as empty space and every
    margin as content, and reports a crowded slide as the roomiest in the deck.

    The outer edge cannot invert that way. Every template in this system leaves a
    margin, so the ring around the page is paper by construction, whatever the
    composition inside it is doing.

    Sampled with NEAREST so real pixel values are counted rather than averages of
    a letter and the paper behind it. The share returned is of the whole page,
    not of the ring, because it answers a different question: whether this page
    has a background at all.
    """
    width, height = 200, 120
    band = 3
    sample = image.resize((width, height), Image.NEAREST)
    pixels = sample.load()

    edge: dict[tuple[int, int, int], int] = {}
    for y in range(height):
        on_edge_row = y < band or y >= height - band
        for x in range(width):
            if not on_edge_row and band <= x < width - band:
                continue
            colour = pixels[x, y]
            edge[colour] = edge.get(colour, 0) + 1
    if not edge:
        raise MeasureError("could not read the page's edge colours")
    colour = max(edge.items(), key=lambda entry: entry[1])[0]

    whole = sample.getcolors(width * height) or []
    matching = sum(
        count
        for count, other in whole
        if all(abs(a - b) <= COLOUR_TOLERANCE for a, b in zip(other, colour))
    )
    return colour, matching / float(width * height)


def clear_grid(image, colour, Image, ImageChops) -> list[list[bool]]:
    """A GRID_H x GRID_W table saying which cells hold nothing but background."""
    flat = Image.new("RGB", image.size, colour)
    difference = ImageChops.difference(image, flat)
    red, green, blue = difference.split()
    # Per-channel maximum: a pixel is background only when every channel matches,
    # so a colour that differs in one channel alone still reads as content.
    spread = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    mask = spread.point(
        [255 if value <= COLOUR_TOLERANCE else 0 for value in range(256)]
    )
    reduced = mask.resize((GRID_W, GRID_H), Image.BOX)
    data = list(reduced.getdata())
    return [
        [data[row * GRID_W + column] >= CELL_CLEAR_THRESHOLD for column in range(GRID_W)]
        for row in range(GRID_H)
    ]


def largest_clear_rectangle(grid: list[list[bool]]):
    """The biggest all-clear rectangle in the grid, by area.

    The usual histogram sweep: each row keeps how many clear cells stand above
    every column, and the widest bar span at each height is the best rectangle
    ending on that row.
    """
    heights = [0] * GRID_W
    best = None

    for row_index, row in enumerate(grid):
        for column in range(GRID_W):
            heights[column] = heights[column] + 1 if row[column] else 0

        stack: list[int] = []
        for column in range(GRID_W + 1):
            current = heights[column] if column < GRID_W else 0
            while stack and heights[stack[-1]] >= current:
                top = stack.pop()
                height = heights[top]
                left = stack[-1] + 1 if stack else 0
                width = column - left
                area = width * height
                if height and width and (best is None or area > best["area"]):
                    best = {
                        "area": area,
                        "left": left,
                        "top": row_index - height + 1,
                        "width": width,
                        "height": height,
                    }
            if column < GRID_W:
                stack.append(column)

    return best


def clear_areas(grid: list[list[bool]]) -> list[dict]:
    """Every drawing-sized clear rectangle, largest first, taken greedily.

    Each one found is marked occupied before the next is looked for, so the
    count is separate places a drawing could go rather than one gap counted
    several ways.
    """
    working = [row[:] for row in grid]
    found: list[dict] = []
    while len(found) < MAX_AREAS:
        best = largest_clear_rectangle(working)
        if not best:
            break
        if best["width"] < FLOOR_CELLS_W or best["height"] < FLOOR_CELLS_H:
            break
        found.append(best)
        for row in range(best["top"], best["top"] + best["height"]):
            for column in range(best["left"], best["left"] + best["width"]):
                working[row][column] = False
    return found


def as_inches(rectangle: dict | None) -> dict | None:
    if not rectangle:
        return None
    cell_w = SLIDE_W_INCHES / GRID_W
    cell_h = SLIDE_H_INCHES / GRID_H
    return {
        "widthInches": round(rectangle["width"] * cell_w, 2),
        "heightInches": round(rectangle["height"] * cell_h, 2),
        "xInches": round(rectangle["left"] * cell_w, 2),
        "yInches": round(rectangle["top"] * cell_h, 2),
        "areaFraction": round(
            rectangle["area"] / float(GRID_W * GRID_H), 4
        ),
    }


def measure_page(path: Path) -> dict:
    image, Image, ImageChops = load_image(path)
    colour, share = background_colour(image, Image)
    if share < MIN_BACKGROUND_SHARE:
        return {
            "clearFraction": 0.0,
            "largestClear": None,
            "readableAreas": 0,
            "note": "no dominant background colour; treated as fully covered",
        }
    grid = clear_grid(image, colour, Image, ImageChops)
    clear_cells = sum(1 for row in grid for cell in row if cell)
    areas = clear_areas(grid)
    largest = largest_clear_rectangle(grid)
    return {
        "clearFraction": round(clear_cells / float(GRID_W * GRID_H), 4),
        "largestClear": as_inches(largest),
        "readableAreas": len(areas),
        "areas": [as_inches(area) for area in areas],
    }


def read_manifest(path: Path) -> list[tuple[int, Path]]:
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise MeasureError(f"{path} is unreadable JSON: {exc}") from exc
    pages = manifest.get("pages")
    if not isinstance(pages, list) or not pages:
        raise MeasureError(f"{path} lists no rendered pages")
    entries: list[tuple[int, Path]] = []
    for page in pages:
        if not isinstance(page, dict):
            raise MeasureError(f"{path} has a malformed page entry")
        number = page.get("number")
        page_path = page.get("path")
        if not isinstance(number, int) or not isinstance(page_path, str):
            raise MeasureError(f"{path} has a page entry with no number or path")
        entries.append((number, Path(page_path)))
    return sorted(entries)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Measure the clear space on each rendered slide, so a pass record "
            "claiming a slide is full can be checked against the drawn page."
        )
    )
    parser.add_argument("--render-manifest", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args(argv)

    try:
        entries = read_manifest(Path(args.render_manifest))
    except MeasureError as exc:
        print(f"SLIDE_ROOM_FAILED: {exc}", file=sys.stderr)
        return 1

    slides = []
    for number, page_path in entries:
        if not page_path.is_file():
            print(
                f"SLIDE_ROOM_FAILED: page {number} is missing at {page_path}",
                file=sys.stderr,
            )
            return 1
        try:
            measurement = measure_page(page_path)
        except MeasureError as exc:
            print(f"SLIDE_ROOM_FAILED: page {number}: {exc}", file=sys.stderr)
            return 1
        measurement["slide"] = number
        slides.append(measurement)

    record = {
        "schemaVersion": SCHEMA_VERSION,
        "renderManifest": str(Path(args.render_manifest).resolve()),
        "readableInches": READABLE_INCHES,
        "slides": slides,
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"SLIDE_ROOM_OK: {len(slides)} slides")
    print(
        "SLIDE_ROOM_AREAS: "
        + ",".join(str(slide["readableAreas"]) for slide in slides)
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
