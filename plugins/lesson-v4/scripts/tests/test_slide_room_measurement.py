"""The room on a slide is a fact about the drawn page, so it is measured there.

A twelve-slide deck came back with four slides declined as `full` and three as
`competes`. Three of the full ones had space for two drawings each, and the
competing ones had a strong central photograph with a clear column beside it.

The pass was not careless. It was answering from the specification, where a
three-zone template reads exactly the same whether its cards are packed to the
margins or holding four words each. Nothing in a JSON file can say where the
white is.

These assertions hold the measurement to the three cases that matter, and the
third is the one the reported failure was made of: a dominant central visual
with room either side of it must read as room.
"""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "measure-slide-room.py"

PAGE_W = 1467
PAGE_H = 825


def _pil():
    from PIL import Image, ImageDraw

    return Image, ImageDraw


class MeasureRunner(unittest.TestCase):
    def measure(self, painters):
        """Render each painter onto a white page and measure the result."""
        Image, ImageDraw = _pil()
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            pages = []
            for number, painter in enumerate(painters, start=1):
                image = Image.new("RGB", (PAGE_W, PAGE_H), (255, 255, 255))
                painter(ImageDraw.Draw(image))
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


def small_card(draw) -> None:
    draw.rectangle([40, 40, 400, 200], fill=(230, 240, 250))


def packed(draw) -> None:
    """Nine cards to the margins: only hairline gutters left over."""
    for row in range(3):
        for column in range(3):
            x = 20 + column * 480
            y = 20 + row * 268
            draw.rectangle([x, y, x + 455, y + 248], fill=(235, 235, 235))


def central_photograph(draw) -> None:
    """A dominant teaching visual with a clear column down each side."""
    draw.rectangle([330, 120, 1130, 700], fill=(90, 110, 130))


class WhatCountsAsRoomTests(MeasureRunner):
    def test_a_light_slide_reads_as_having_room(self):
        _, slides = self.measure([small_card])
        self.assertGreaterEqual(slides[0]["readableAreas"], 1)
        self.assertGreater(slides[0]["clearFraction"], 0.8)

    def test_a_genuinely_packed_slide_has_no_room(self):
        """The discrimination case. A full slide must stay bare."""
        _, slides = self.measure([packed])
        self.assertEqual(slides[0]["readableAreas"], 0)

    def test_a_strong_central_visual_leaves_room_beside_it(self):
        """The reported failure, measured.

        Three slides were declined as `competes` because their main visual was
        strong. A drawing in either of these columns covers none of it.
        """
        _, slides = self.measure([central_photograph])
        self.assertGreaterEqual(slides[0]["readableAreas"], 2)
        largest = slides[0]["largestClear"]
        self.assertGreaterEqual(largest["widthInches"], 1.2)
        self.assertGreaterEqual(largest["heightInches"], 1.2)


class TheBackgroundIsTakenFromTheEdgeTests(MeasureRunner):
    def test_a_deck_that_is_more_card_than_paper_is_not_inverted(self):
        """Reading the background as "the commonest colour" inverts here.

        With cards covering most of the page the modal colour is the card, and
        the measurement then reports every card as empty space and every margin
        as content - so the most crowded slide in the deck comes back as the
        roomiest. The page edge cannot invert that way: every template leaves a
        margin, so the ring around the page is paper by construction.
        """
        _, slides = self.measure([packed])
        self.assertEqual(slides[0]["readableAreas"], 0)
        self.assertLess(slides[0]["clearFraction"], 0.3)


class TheShapeIsReportedTests(MeasureRunner):
    def test_the_per_slide_shape_is_printed(self):
        result, slides = self.measure([small_card, packed, central_photograph])
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


if __name__ == "__main__":
    unittest.main()
