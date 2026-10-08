"""A drawing never sits on a chart, a shape or a table, and never copies a sign.

The page measurement reads clear space by ink and forgives pale fills and thin
lines, because that is what a card is made of and a drawing may sit on a card.
A chart's gridlines are thin lines and a shape's inside is a pale fill, so the
empty middle of a bar chart was measured as a clear place: a ladybird went on
the line where the teacher draws a bar, a cloud went inside the L-shape whose
sides the class was finding, and one decorator took seven such drawings off by
eye after the check had allowed them (six of twenty lessons, 7 October 2026).

The teacher, on the real pages (8 October 2026): "I dont think they should be
over helpers like this". Beside a figure stayed open: a drawing in the notch of
an L-shape, or next to a labelled photograph's labels, is the decorator's
judgement. And a decorative pencil beside the pencil sign was "annoying because
theres already a pencil icon to get children to write", across the whole deck.
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
MEASURE = ROOT / "scripts" / "measure-slide-room.py"
CHECK = ROOT / "scripts" / "check-optional-pictures.py"

PAGE_W = 1467
PAGE_H = 825
PER_INCH = PAGE_W / 13.333
INK = (0, 0, 0)
GRIDLINE = (217, 217, 217)
SHAPE_FILL = (198, 224, 244)
SHAPE_LINE = (0, 112, 192)

# Where the builder says it drew each figure, in inches.
CHART = {"slide": 1, "type": "bar-chart", "x": 1.0, "y": 1.0, "w": 4.0, "h": 5.0}
SHAPE = {"slide": 1, "type": "polygon", "x": 7.0, "y": 1.0, "w": 5.0, "h": 5.0}


def px(inches: float) -> int:
    return int(round(inches * PER_INCH))


def paint(draw) -> None:
    # An empty bar chart: a title, an axis each way with numbers and names, and
    # hairline gridlines. Nothing at all in the middle.
    draw.rectangle([px(1.6), px(1.05), px(4.6), px(1.3)], fill=INK)
    draw.line([px(1.6), px(1.6), px(1.6), px(5.4)], fill=INK, width=3)
    draw.line([px(1.6), px(5.4), px(4.9), px(5.4)], fill=INK, width=3)
    for step in range(5):
        y = px(1.8 + step * 0.8)
        draw.rectangle([px(1.15), y - 8, px(1.4), y + 8], fill=INK)
        draw.line([px(1.6), y, px(4.9), y], fill=GRIDLINE, width=1)
    for step in range(4):
        x = px(1.9 + step * 0.8)
        draw.rectangle([x, px(5.55), x + px(0.4), px(5.8)], fill=INK)
    # An L-shape, pale inside: an upright leg on the left and a foot along the
    # bottom, so its notch is the top right of the box.
    outline = [
        (px(7.5), px(1.5)), (px(9.0), px(1.5)), (px(9.0), px(4.0)),
        (px(11.5), px(4.0)), (px(11.5), px(5.5)), (px(7.5), px(5.5)),
    ]
    draw.polygon(outline, fill=SHAPE_FILL, outline=SHAPE_LINE)
    draw.line(outline + [outline[0]], fill=SHAPE_LINE, width=6)


def drawing(name: str, x: float, y: float, size: float = 0.8, **more) -> dict:
    return {
        "id": f"decoration-{name}",
        "kind": "educational-svg",
        "concept": name,
        "frame": {
            "x": x / 13.333, "y": y / 7.5,
            "width": size / 13.333, "height": size / 7.5,
        },
        **more,
    }


def load_check():
    spec = importlib.util.spec_from_file_location("check_optional_pictures", CHECK)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class FiguresAreNotClearSpaceTests(unittest.TestCase):
    def measured(self, tmp: Path, figures: list[dict] | None) -> dict:
        from PIL import Image, ImageDraw

        preview = tmp / "preview"
        preview.mkdir()
        deck = preview / "deck.pptx"
        deck.write_bytes(b"deck")
        image = Image.new("RGB", (PAGE_W, PAGE_H), (255, 255, 255))
        paint(ImageDraw.Draw(image))
        page = preview / "deck-page-01.png"
        image.save(page)
        if figures is not None:
            (preview / "figure-boxes.json").write_text(
                json.dumps({"schemaVersion": 1, "figures": figures}), encoding="utf-8"
            )
        manifest = preview / "render-manifest.json"
        manifest.write_text(
            json.dumps({
                "version": 1,
                "source": str(deck),
                "pages": [{"number": 1, "path": str(page), "sha256": "x"}],
            }),
            encoding="utf-8",
        )
        output = tmp / "slide-room.json"
        result = subprocess.run(
            [sys.executable, str(MEASURE), "--render-manifest", str(manifest),
             "--output", str(output)],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(output.read_text(encoding="utf-8"))

    def refused(self, room: dict, *decorations: dict) -> list[str]:
        lesson = {"slides": [{"title": "My Turn", "decorations": list(decorations)}]}
        failures, looked = load_check().drawings_on_ink(lesson, room)
        self.assertTrue(looked)
        return failures

    def test_the_empty_middle_of_a_chart_is_not_a_clear_place(self):
        with TemporaryDirectory() as tmp:
            room = self.measured(Path(tmp), [CHART, SHAPE])
            inside = [
                area for area in room["slides"][0]["areas"]
                if 1.7 < area["xInches"] < 4.0 and 1.5 < area["yInches"] < 5.0
            ]
            self.assertEqual(inside, [])
            failures = self.refused(room, drawing("ladybird", 2.8, 2.9))
            self.assertEqual(len(failures), 1)
            self.assertIn("sits on the bar chart", failures[0])

    def test_the_inside_of_a_shape_is_not_a_clear_place(self):
        with TemporaryDirectory() as tmp:
            room = self.measured(Path(tmp), [CHART, SHAPE])
            failures = self.refused(room, drawing("cloud", 7.8, 2.4))
            self.assertEqual(len(failures), 1)
            self.assertIn("sits on the polygon", failures[0])

    def test_beside_a_figure_stays_open(self):
        """The discrimination cases: the notch of the L, and the card round a
        chart. Fencing the whole box would have refused twenty-four drawings on
        one perimeter deck, most of them a fence or a ruler beside the shape."""
        with TemporaryDirectory() as tmp:
            room = self.measured(Path(tmp), [CHART, SHAPE])
            self.assertEqual(
                self.refused(
                    room,
                    drawing("fence", 10.0, 2.0),      # the notch of the L
                    drawing("leaf", 5.4, 3.0),        # between the two figures
                    drawing("flower", 2.5, 6.4),      # under the chart
                ),
                [],
            )

    def test_without_the_builders_word_the_page_is_read_by_ink_alone(self):
        """What happened before, and what still happens for a deck built before
        the builder said where its figures are."""
        with TemporaryDirectory() as tmp:
            room = self.measured(Path(tmp), None)
            self.assertNotIn("figures", room["slides"][0])
            self.assertEqual(self.refused(room, drawing("ladybird", 2.8, 2.9)), [])


class DecorationsDoNotCopyTheSignsTests(unittest.TestCase):
    def lookalikes(self, *decorations: dict) -> list[str]:
        lesson = {"slides": [{"title": "t", "decorations": list(decorations)}]}
        return load_check().sign_lookalikes(lesson)

    def test_a_pencil_a_tick_a_bolt_and_a_sheet_are_refused(self):
        for name in ("pencil", "set pencils", "coloured pencil", "green tick",
                     "check mark", "lightning bolt", "sheet of paper", "worksheet"):
            with self.subTest(name=name):
                self.assertEqual(len(self.lookalikes(drawing(name, 1, 1))), 1)

    def test_the_library_name_counts_when_the_concept_does_not_say(self):
        found = self.lookalikes(
            drawing("stationery", 1, 1, educationalSvgId="standard/pe/sharpened-pencil.svg")
        )
        self.assertEqual(len(found), 1)
        self.assertIn("pencil sign", found[0])

    def test_other_drawings_are_untouched(self):
        for name in ("star", "ruler", "paper lantern", "nut and bolt", "ticket",
                     "bed sheet", "crayon", "magnifying glass"):
            with self.subTest(name=name):
                self.assertEqual(self.lookalikes(drawing(name, 1, 1)), [])

    def test_the_decorator_is_told_both(self):
        brief = (ROOT / "agents" / "slide-decorator.md").read_text(encoding="utf-8")
        self.assertIn("Beside a figure, never on it", brief)
        self.assertIn("Leave the signs to the signs", brief)


if __name__ == "__main__":
    unittest.main()
