"""The room on a slide is a fact about the drawn page, so it is measured there.

A twelve-slide deck came back with four slides declined as `full` and three as
`competes`. Three of the full ones had space for two drawings each, and the
competing ones had a strong central photograph with a clear column beside it.

The pass was not careless. It was answering from the specification, where a
three-zone template reads exactly the same whether its cards are packed to the
margins or holding four words each. Nothing in a JSON file can say where the
white is.

Then the measurement itself made the same mistake one level down. It counted a
card as content, so a text-heavy deck whose white cards reach the margins came
back with no clear areas anywhere, the pass wrote `full` down the whole record,
and the deck that most wanted drawings to break up its walls of text was the one
guaranteed to get none (flagged by Daniel, 2 September 2026, over a Year 4 PSHE
deck: "this slide is full, but it's full of TEXT").

So what occupies a slide is ink - a word, a number, a rule, a figure, a
photograph - and a card is furniture. These assertions hold the measurement to
that distinction from both sides: the blank inside a card is room, and a slide
genuinely dense with ink still has none.
"""
from __future__ import annotations

import json
import random
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "measure-slide-room.py"

PAGE_W = 1467
PAGE_H = 825
PER_INCH = PAGE_W / 13.333

PAPER = (242, 217, 199)   # the deck's warm peach
CARD = (255, 255, 255)
INK = (0, 0, 0)


def _pil():
    from PIL import Image, ImageDraw

    return Image, ImageDraw


class MeasureRunner(unittest.TestCase):
    def measure(self, painters, background=(255, 255, 255)):
        """Render each painter onto a page and measure the result."""
        Image, ImageDraw = _pil()
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            pages = []
            for number, painter in enumerate(painters, start=1):
                image = Image.new("RGB", (PAGE_W, PAGE_H), background)
                painter(ImageDraw.Draw(image), image)
                path = root / f"deck-page-{number:02d}.png"
                image.save(path)
                pages.append({"number": number, "path": str(path), "sha256": "x"})
            manifest = root / "render-manifest.json"
            manifest.write_text(
                json.dumps({"version": 1, "pages": pages}), encoding="utf-8"
            )
            output = root / "slide-room.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--render-manifest",
                    str(manifest),
                    "--output",
                    str(output),
                ],
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            record = json.loads(output.read_text(encoding="utf-8"))
            return result, record["slides"]


def small_card(draw, image) -> None:
    draw.rectangle([40, 40, 400, 200], fill=(230, 240, 250))


def _text_line(draw, x, y, width, height=52):
    """A line of writing, as the block of ink one actually is at this scale."""
    draw.rectangle([x, y, x + width, y + height], fill=INK)


def wall_of_text(draw, image) -> None:
    """The reported failure: three white cards reaching the margins, each
    holding a couple of lines of large text with real white left between them.

    No part of this page is *background* - the cards cover it - and yet a
    drawing fits in three separate places without touching a word.
    """
    cards = [(40, 330), (350, 560), (580, 790)]
    for top, bottom in cards:
        draw.rectangle([25, top, PAGE_W - 25, bottom], fill=CARD)
    _text_line(draw, 60, 55, 1300)
    _text_line(draw, 60, 215, 1300)
    _text_line(draw, 60, 375, 900)
    _text_line(draw, 60, 605, 1150)


def ink_dense(draw, image) -> None:
    """A slide genuinely packed with writing: a line every half inch, all the
    way down, in cards that reach the margins. This one really is full."""
    draw.rectangle([25, 25, PAGE_W - 25, PAGE_H - 25], fill=CARD)
    for top in range(45, PAGE_H - 60, 62):
        _text_line(draw, 45, top, PAGE_W - 90, height=42)


def central_photograph(draw, image) -> None:
    """A dominant teaching visual with a clear column down each side."""
    draw.rectangle([330, 120, 1130, 700], fill=(90, 110, 130))


def pale_photograph(draw, image) -> None:
    """A bright, washed-out photograph filling the page.

    Pale enough to pass any test that only asks how dark a pixel is, which is
    why the measurement also asks whether the neighbourhood varies. A drawing
    laid over a sky covers part of a picture children are looking at.
    """
    rng = random.Random(7)
    pixels = image.load()
    for y in range(PAGE_H):
        for x in range(PAGE_W):
            base = 232 + rng.randint(-12, 12)
            pixels[x, y] = (base, base, min(255, base + 8))


class WhatCountsAsRoomTests(MeasureRunner):
    def test_a_light_slide_reads_as_having_room(self):
        _, slides = self.measure([small_card])
        self.assertGreaterEqual(slides[0]["readableAreas"], 1)
        self.assertGreater(slides[0]["clearFraction"], 0.8)

    def test_a_slide_full_of_text_is_not_a_full_slide(self):
        """The reported failure, measured.

        Every pixel of this page is card or word, so under the old measurement
        it had no room at all and the pass had no choice but to write `full`.
        The white between the lines is where the drawing goes.
        """
        _, slides = self.measure([wall_of_text], background=PAPER)
        self.assertGreaterEqual(slides[0]["readableAreas"], 2)
        largest = slides[0]["largestClear"]
        self.assertGreaterEqual(largest["widthInches"], 0.8)
        self.assertGreaterEqual(largest["heightInches"], 0.8)

    def test_a_drawing_may_lie_across_the_edge_of_a_card(self):
        """A card's outline is furniture, not something a child reads, so a
        clear area is allowed to bridge one. Without this the gap between two
        cards walls every band off from the next and the room disappears again.
        """
        _, slides = self.measure([wall_of_text], background=PAPER)
        bridging = [
            area
            for area in slides[0]["areas"]
            if area["heightInches"] >= 1.0 and area["widthInches"] >= 4.0
        ]
        self.assertTrue(
            bridging,
            "a band of white spanning a card edge must read as one clear area",
        )

    def test_a_genuinely_packed_slide_has_no_room(self):
        """The discrimination case. A full slide must stay bare."""
        _, slides = self.measure([ink_dense], background=PAPER)
        self.assertEqual(slides[0]["readableAreas"], 0)

    def test_a_strong_central_visual_leaves_room_beside_it(self):
        """Three slides were declined as `competes` because their main visual
        was strong. A drawing in either of these columns covers none of it."""
        _, slides = self.measure([central_photograph])
        self.assertGreaterEqual(slides[0]["readableAreas"], 2)
        largest = slides[0]["largestClear"]
        self.assertGreaterEqual(largest["widthInches"], 0.8)
        self.assertGreaterEqual(largest["heightInches"], 0.8)

    def test_a_pale_photograph_is_still_a_photograph(self):
        """The cost of counting card white as room, held in check.

        Loosening what counts as occupied must not reach as far as a picture.
        A washed-out photograph is pale everywhere and flat nowhere, and it is
        the second test that catches it.
        """
        _, slides = self.measure([pale_photograph])
        self.assertEqual(slides[0]["readableAreas"], 0)


class TheShapeIsReportedTests(MeasureRunner):
    def test_the_per_slide_shape_is_printed(self):
        result, slides = self.measure([small_card, ink_dense, central_photograph])
        self.assertIn("SLIDE_ROOM_OK: 3 slides", result.stdout)
        self.assertIn("SLIDE_ROOM_AREAS:", result.stdout)
        shape = [str(slide["readableAreas"]) for slide in slides]
        self.assertIn(f"SLIDE_ROOM_AREAS: {','.join(shape)}", result.stdout)


class ItNeverStopsADeckTests(unittest.TestCase):
    def test_a_manifest_with_no_pages_fails_cleanly(self):
        with TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "render-manifest.json"
            manifest.write_text(json.dumps({"version": 1, "pages": []}), encoding="utf-8")
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--render-manifest",
                    str(manifest),
                    "--output",
                    str(Path(tmp) / "slide-room.json"),
                ],
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("SLIDE_ROOM_FAILED", result.stderr)

    def test_the_designer_is_told_to_continue_without_a_measurement(self):
        """No render route on a machine is a quieter deck, never a blocked one."""
        designer = (ROOT / "agents" / "slide-designer.md").read_text(encoding="utf-8")
        self.assertIn("Optional picture room: unmeasured", designer)
        self.assertIn("A missing measurement never stops the\ndeck.", designer)


class TheGuidanceSaysTheSameThingTests(unittest.TestCase):
    """The measurement and the words the pass reads must not drift apart.

    The reason the pass wrote `full` on a wall of text was not that it
    disbelieved the numbers - it was that both the numbers and the reference
    told it a card was content. Fixing one without the other leaves the pass
    arguing with its own measurement.
    """

    def test_the_reference_says_a_card_is_not_content(self):
        reference = " ".join(
            (ROOT / "references" / "context-pictures.md")
            .read_text(encoding="utf-8")
            .split()
        )
        self.assertIn("Clear means no ink, not no furniture.", reference)
        self.assertIn("is full of text, not full", reference)

    def test_the_decorator_asks_for_ink_rather_than_furniture(self):
        decorator = (ROOT / "agents" / "slide-decorator.md").read_text(encoding="utf-8")
        self.assertIn("Where on this rendered page is nothing a child reads?", decorator)
        self.assertIn("A card is a container", decorator)


if __name__ == "__main__":
    unittest.main()
