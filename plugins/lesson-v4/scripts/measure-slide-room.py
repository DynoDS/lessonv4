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
import hashlib
import json
import sys
from pathlib import Path
import python_extras  # noqa: F401,E402 - the plugin's own installed libraries

SCHEMA_VERSION = 1

# The rendered pages are 16:9 and the cells come out square at this grid, so a
# floor expressed in cells means the same thing horizontally and vertically.
GRID_W = 160
GRID_H = 90

SLIDE_W_INCHES = 13.333
SLIDE_H_INCHES = 7.5

# The smallest drawing that still reads from the back of the room, and so the
# smallest gap that counts as somewhere to put one.
#
# This has now been too high twice. 1.2 came from a published example and wrote
# off every gap between two lines of large text. 0.8 came from the padlock Daniel
# places by hand across a card's edge, measured at "about 0.75 inches" - so the
# floor was set above the very drawing that justified it, and rounding on a
# 160x90 grid lifted it again to an effective 0.83.
#
# What that cost, measured across 20 built lessons: 41 slides declined as full
# while 69% of each slide was clear, every one of them holding a strip about ten
# inches wide and 0.58 to 0.75 inches tall. Ten inches of empty board turned down
# for want of a fraction of an inch of height.
#
# Daniel, on being shown those numbers: "I dont get how they cant fit. they can
# be resized right, they can be roated, they can be overlapping boxes instead of
# deadspace... it only needs to be away from text."
#
# He is right, and a clear rectangle is away from text by construction: this
# grid is built from the ink. A drawing keeps its proportions and can be scaled,
# so a strip that is tall enough holds one however wide it is. 0.6 rounds to an
# effective 0.58, which is about 2.6 inches on a classroom screen, and is below
# the hand-placed padlock rather than above it.
READABLE_INCHES = 0.6
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


# A pixel belongs to a figure when it is not the colour of the card behind it.
# This is finer than ink on purpose: a shape's pale fill and a chart's thin
# gridline are both surface to the page measurement and both figure here.
FIGURE_PIXEL_DIFFERENCE = 10
FIGURE_CELL_SHARE = 0.02


def figure_cells(image, Image, ImageChops, figure: dict) -> set[tuple[int, int]]:
    """The grid cells one drawn figure occupies, empty-looking ones included.

    The builder says which box it drew a chart or a shape into. Inside that box
    a cell is the figure when something is drawn in it, or when the figure lies
    on both sides of it: to its left and its right, or above and below it. That
    takes in the inside of an L-shape and the empty middle of a bar chart, under
    its title and over its axis, where the teacher draws the bars. It leaves out
    the notch of the L and the border round the picture, which are card, and
    where a drawing that belongs to the lesson may still sit.
    """
    cell_w = SLIDE_W_INCHES / GRID_W
    cell_h = SLIDE_H_INCHES / GRID_H
    try:
        x, y = float(figure["x"]), float(figure["y"])
        w, h = float(figure["w"]), float(figure["h"])
    except (KeyError, TypeError, ValueError):
        return set()
    left = max(0, int(x / cell_w + 0.5))
    right = min(GRID_W, int((x + w) / cell_w + 0.5))
    top = max(0, int(y / cell_h + 0.5))
    bottom = min(GRID_H, int((y + h) / cell_h + 0.5))
    columns, rows = right - left, bottom - top
    if columns <= 0 or rows <= 0:
        return set()
    # The blank beside a sum left open is kept whole. Nothing is drawn after
    # the equals sign, so there is no drawn edge to read it by: that blank is
    # where the teacher writes the answer.
    if figure.get("whole") is True:
        return {
            (row, column)
            for row in range(top, bottom)
            for column in range(left, right)
        }
    px_w = image.width / float(GRID_W)
    px_h = image.height / float(GRID_H)
    crop = image.crop((
        int(left * px_w), int(top * px_h), int(right * px_w), int(bottom * px_h)
    ))
    if crop.width < columns or crop.height < rows:
        return set()
    sample = crop.resize((48, 48), Image.NEAREST)
    background = max(sample.getcolors(48 * 48))[1]
    difference = ImageChops.difference(
        crop, Image.new("RGB", crop.size, background)
    ).convert("L")
    drawn_pixels = difference.point(
        lambda value: 255 if value > FIGURE_PIXEL_DIFFERENCE else 0
    )
    shares = list(drawn_pixels.resize((columns, rows), Image.BOX).getdata())
    drawn = [
        [shares[row * columns + column] / 255.0 > FIGURE_CELL_SHARE for column in range(columns)]
        for row in range(rows)
    ]
    cells: set[tuple[int, int]] = set()
    row_spans = [
        (min(c for c in range(columns) if line[c]), max(c for c in range(columns) if line[c]))
        if any(line) else None
        for line in drawn
    ]
    column_spans = []
    for column in range(columns):
        marked = [row for row in range(rows) if drawn[row][column]]
        column_spans.append((marked[0], marked[-1]) if marked else None)
    for row in range(rows):
        for column in range(columns):
            across, down = row_spans[row], column_spans[column]
            if (
                drawn[row][column]
                or (across and across[0] < column < across[1])
                or (down and down[0] < row < down[1])
            ):
                cells.add((top + row, left + column))
    return cells


def measure_page(path: Path, figures: list[dict] | None = None) -> dict:
    image, Image, ImageChops, ImageFilter = load_image(path)
    grid = clear_grid(image, Image, ImageChops, ImageFilter)
    # A figure is occupied all the way across, not only where its lines are.
    # Ink is what this page is read by, and that forgives a pale fill and a thin
    # line because a card is made of them; a chart's gridlines and a shape's
    # inside are made of them too, so the empty middle of a bar chart was
    # measured as a clear place and a drawing was put where the teacher draws a
    # bar (six of twenty lessons, 7 October 2026).
    kept: list[dict] = []
    for figure in figures or []:
        cells = figure_cells(image, Image, ImageChops, figure)
        if not cells:
            continue
        for row, column in cells:
            grid[row][column] = False
        entry = {
            "type": str(figure.get("type") or "figure"),
            "x": figure["x"], "y": figure["y"], "w": figure["w"], "h": figure["h"],
        }
        if figure.get("whole") is True:
            entry["whole"] = True
        kept.append(entry)
    clear_cells = sum(1 for row in grid for cell in row if cell)
    areas = clear_areas(grid)
    largest = largest_clear_rectangle(grid)
    measurement = {
        "clearFraction": round(clear_cells / float(GRID_W * GRID_H), 4),
        "largestClear": as_inches(largest),
        "readableAreas": len(areas),
        "areas": [as_inches(area) for area in areas],
    }
    if kept:
        measurement["figures"] = kept
    return measurement


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


def composition_fingerprint(lesson_path: Path) -> str | None:
    """A hash of everything about the deck except its optional drawings.

    The drawings are what gets placed against this measurement, so they are left
    out: adding them must not invalidate the page they were placed on. Anything
    else moving - a line of text, a card, a picture, a template - moves the clear
    space with it.
    """
    try:
        lesson = json.loads(lesson_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None

    def stripped(node):
        if isinstance(node, dict):
            return {k: stripped(v) for k, v in node.items() if k != "decorations"}
        if isinstance(node, list):
            return [stripped(item) for item in node]
        return node

    payload = json.dumps(stripped(lesson), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


# The preview check leaves a copy of the lesson file it built the deck from
# beside that deck, under this name. It is the only record of what the rendered
# pages actually show.
RENDERED_LESSON_NAME = "lesson-source.json"


def rendered_lesson(manifest_path: Path) -> Path | None:
    """The lesson file the rendered deck was built from, when the build kept it."""
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    source = manifest.get("source") if isinstance(manifest, dict) else None
    if not isinstance(source, str) or not source:
        return None
    kept = Path(source).parent / RENDERED_LESSON_NAME
    return kept if kept.is_file() else None


# And beside the same deck, where each chart, shape and table was drawn.
RENDERED_FIGURES_NAME = "figure-boxes.json"


def rendered_figures(manifest_path: Path) -> dict[int, list[dict]]:
    """Each slide's figures, when the build that drew these pages kept them.

    Absent for a deck built before the builder said, and then the page is
    measured by its ink alone, as it always was.
    """
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        source = manifest.get("source") if isinstance(manifest, dict) else None
        if not isinstance(source, str) or not source:
            return {}
        kept = json.loads(
            (Path(source).parent / RENDERED_FIGURES_NAME).read_text(encoding="utf-8")
        )
    except (OSError, json.JSONDecodeError):
        return {}
    figures = kept.get("figures") if isinstance(kept, dict) else None
    found: dict[int, list[dict]] = {}
    for figure in figures if isinstance(figures, list) else []:
        if isinstance(figure, dict) and isinstance(figure.get("slide"), int):
            found.setdefault(figure["slide"], []).append(figure)
    return found


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Measure the clear space on each rendered slide, so a pass record "
            "claiming a slide is full can be checked against the drawn page."
        )
    )
    parser.add_argument("--render-manifest", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--lesson",
        help=(
            "the lesson.json these pages were rendered from. Stamps the measurement with the "
            "composition it describes, so a later check can tell whether the deck has moved on"
        ),
    )
    args = parser.parse_args(argv)

    try:
        entries = read_manifest(Path(args.render_manifest))
    except MeasureError as exc:
        print(f"SLIDE_ROOM_FAILED: {exc}", file=sys.stderr)
        return 1

    figures = rendered_figures(Path(args.render_manifest))
    slides = []
    for number, page_path in entries:
        if not page_path.is_file():
            print(
                f"SLIDE_ROOM_FAILED: page {number} is missing at {page_path}",
                file=sys.stderr,
            )
            return 1
        try:
            measurement = measure_page(page_path, figures.get(number))
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
    # Where the pages came from a lesson.json, stamp what its composition was.
    # Clear space is a fact about one arrangement of one deck: change a banner's
    # wording and the band beneath it moves, so a drawing placed against the old
    # measurement ends up behind a card. That happened to a Year 4 history deck
    # on 18 September 2026 and nothing noticed, because the measurement carries
    # no record of what it measured.
    #
    # The stamp is what the pages were drawn from, not what the caller says
    # they were drawn from. On 6 October 2026 a decorator whose measurement had
    # been refused as stale measured an older render again, named the current
    # lesson.json beside it, and the stale check passed: the stamp was only ever
    # the caller's word. Where the build kept its lesson file beside the deck,
    # that file is the answer, and a different `--lesson` is reported rather
    # than believed, so the check downstream still sees the pages are old.
    claimed = composition_fingerprint(Path(args.lesson)) if args.lesson else None
    drawn_from = rendered_lesson(Path(args.render_manifest))
    drawn = composition_fingerprint(drawn_from) if drawn_from else None
    mismatch = bool(drawn and claimed and drawn != claimed)
    fingerprint = drawn or claimed
    if fingerprint:
        record["compositionSha256"] = fingerprint
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"SLIDE_ROOM_OK: {len(slides)} slides")
    if mismatch:
        print(
            f"SLIDE_ROOM_PAGES_ARE_OLDER: these pages were drawn from a different "
            f"arrangement of the deck than {args.lesson}, and the measurement is "
            "stamped with the one they were drawn from. To measure that file, "
            "build its preview, render it, and measure that render: measuring "
            "these pages again gives this answer again."
        )
    print(
        "SLIDE_ROOM_AREAS: "
        + ",".join(str(slide["readableAreas"]) for slide in slides)
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
