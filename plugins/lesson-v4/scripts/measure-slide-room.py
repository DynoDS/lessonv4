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
rendered and reports, per slide, the largest rectangle containing nothing a
child reads and how many separate drawing-sized clear areas the slide has.

`check-optional-pictures.py` reads the result, so `full` on a slide with a
readable clear rectangle in it fails the same way an invented rejection does.

**What counts as occupied is ink, not furniture.** A card is a container, and
the blank part of a card is room: a framed drawing is placed in front of or
behind what is already there, so it may lie over a card's white, cross a card's
edge or bridge the gap between two cards, and none of that moves or hides
anything. The first version of this script counted a card, its outline and its
shadow as content, which inverted the measurement on exactly the decks that
needed it: a text-heavy deck whose white cards reach the margins came back with
no clear areas on any slide, the pass wrote `full` down the whole record, and
the deck that most wanted drawings to break up its walls of text was the one
guaranteed to get none (flagged by Daniel, 2 September 2026, over a Year 4 PSHE
deck: "there are 0 p2 or p3 educational svgs here ... this slide is full, but
it's full of TEXT").

So a pixel is occupied when it is dark or strongly coloured - a letter, a
number, a rule, a drawn figure - or when its immediate neighbourhood varies,
which is what a photograph, map or chart always does and what a flat fill never
does. Paper, card fill, panel fill, table shading and the soft shadow around a
card are all surface, and surface is room.
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
# size is not room. Calibrated against the drawings Daniel places by hand on a
# text-heavy slide: a padlock resting across a card's left edge measures about
# 0.75 inches on the board and reads clearly from the back of the room. The
# earlier 1.2 was taken from a published example rather than from the smallest
# drawing that actually works, and it wrote off every gap between two lines of
# large text - which on a wall-of-text slide is where all the room is.
READABLE_INCHES = 0.8
FLOOR_CELLS_W = max(1, round(READABLE_INCHES / (SLIDE_W_INCHES / GRID_W)))
FLOOR_CELLS_H = max(1, round(READABLE_INCHES / (SLIDE_H_INCHES / GRID_H)))

# Ink is dark. Every colour this deck writes in - black body text, house blue,
# LO purple, vocabulary green, problem red, the grey gridline - sits below this
# luminance, and every surface it fills with - white card, peach paper, blue
# maths paper, green success-criteria panel, peach table shading, the shadow
# under a card - sits above it.
INK_LUMINANCE = 170

# ...or strongly coloured. A pale but saturated fill would slip past the
# luminance test; the tinted surfaces this deck uses are all inside this spread
# (the peach paper is the widest, at 43) and no text colour is.
INK_CHROMA = 60

# ...or part of a picture. Surface is flat by construction - one fill colour, or
# a slow shadow gradient - and a photograph, map or chart never is, so a pixel
# whose immediate neighbourhood varies by more than this is textured. This is
# what stops a drawing being placed on a bright sky.
INK_LOCAL_RANGE = 6

# A cell is clear when essentially all of it is surface. The slack is
# deliberate: a hairline rule or the edge of a card may cross a cell without
# making that cell content, because a drawing may lie across a card's edge.
CELL_CLEAR_SHARE = 0.94

# Texture is judged by the share of the cell, not pixel by pixel, and for the
# same reason. The step from paper to card fill is a sharp edge, so every card
# outline in the deck is textured along one thin line - counting that as content
# rebuilds the wall this measurement exists to see past, and a drawing lying
# across a card edge is the ordinary case. A photograph fills its cells with
# variation; a card edge crosses one in a line two pixels wide.
CELL_TEXTURE_SHARE = 0.30

# Past this the count says "lots of small gaps" rather than anything useful, and
# a slide is not improved by a seventh drawing.
MAX_AREAS = 6


class MeasureError(RuntimeError):
    pass


def load_image(path: Path):
    try:
        from PIL import Image, ImageChops, ImageFilter
    except ImportError as exc:  # pragma: no cover - environment fault
        raise MeasureError(f"Pillow is not available: {exc}") from exc
    try:
        image = Image.open(path)
        image.load()
    except OSError as exc:
        raise MeasureError(f"{path} is not a readable image: {exc}") from exc
    return image.convert("RGB"), Image, ImageChops, ImageFilter


def ink_and_texture_masks(image, ImageChops, ImageFilter):
    """Two one-band images: where the page is ink, and where it is textured.

    Ink is what a child reads - a letter, a number, a rule, a drawn figure - and
    it is dark or strongly coloured. Texture is variation in the immediate
    neighbourhood, which is what a photograph, map or chart always has and what
    paper, card fill, panel fill and a card's shadow never have. They are kept
    apart because they are judged differently: a single ink pixel matters, and a
    thin line of texture (the edge of a card) does not.
    """
    red, green, blue = image.split()

    grey = image.convert("L")
    dark = grey.point([255 if v < INK_LUMINANCE else 0 for v in range(256)])

    high = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    low = ImageChops.darker(ImageChops.darker(red, green), blue)
    chroma = ImageChops.difference(high, low)
    coloured = chroma.point([255 if v >= INK_CHROMA else 0 for v in range(256)])

    local = ImageChops.difference(
        grey.filter(ImageFilter.MaxFilter(3)), grey.filter(ImageFilter.MinFilter(3))
    )
    textured = local.point([255 if v > INK_LOCAL_RANGE else 0 for v in range(256)])

    return ImageChops.lighter(dark, coloured), textured


def cell_shares(mask, Image):
    """Each grid cell's share of the mask, 0.0 to 1.0."""
    reduced = mask.resize((GRID_W, GRID_H), Image.BOX)
    return [value / 255.0 for value in reduced.getdata()]


def clear_grid(image, Image, ImageChops, ImageFilter) -> list[list[bool]]:
    """A GRID_H x GRID_W table saying which cells hold nothing a child reads."""
    ink, textured = ink_and_texture_masks(image, ImageChops, ImageFilter)
    ink_share = cell_shares(ink, Image)
    texture_share = cell_shares(textured, Image)
    ink_ceiling = 1.0 - CELL_CLEAR_SHARE
    return [
        [
            ink_share[row * GRID_W + column] <= ink_ceiling
            and texture_share[row * GRID_W + column] <= CELL_TEXTURE_SHARE
            for column in range(GRID_W)
        ]
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
    image, Image, ImageChops, ImageFilter = load_image(path)
    grid = clear_grid(image, Image, ImageChops, ImageFilter)
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
