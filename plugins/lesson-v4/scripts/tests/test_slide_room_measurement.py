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


CREAM = (255, 235, 179)   # the Writing deck's paper, stronger than any other


def cream_with_a_shadowed_card(draw, image) -> None:
    """Half a cream page empty, and a white card whose soft shadow darkens the
    paper beside it, as PowerPoint draws one."""
    for step in range(12):
        k = 0.88 + step * 0.01
        shade = tuple(round(channel * k) for channel in CREAM)
        draw.rectangle([60 - step, 60 - step, 760 + 12 - step, 500 + 12 - step], outline=shade)
    draw.rectangle([60, 60, 760, 500], fill=CARD)
    _text_line(draw, 90, 100, 600)


def pale_coloured_words_on_cream(draw, image) -> None:
    """Lines of pale but strongly coloured writing straight on the cream."""
    for top in range(45, PAGE_H - 60, 62):
        draw.rectangle([45, top, PAGE_W - 45, top + 42], fill=(156, 196, 224))


class TintedPaperTests(MeasureRunner):
    """The Writing decks' cream paper is more strongly coloured than the ink
    test allowed, so a half-empty cream slide measured as solid ink and every
    drawing on it was refused (Year 6 renga deck, 17 October 2026). The paper
    a page is printed on is surface whatever its tint; words in colour on it
    are still words."""

    def test_empty_cream_paper_is_room(self):
        _, slides = self.measure([cream_with_a_shadowed_card], background=CREAM)
        self.assertGreaterEqual(slides[0]["readableAreas"], 2)
        self.assertGreater(slides[0]["clearFraction"], 0.8)

    def test_coloured_words_on_cream_are_still_words(self):
        _, slides = self.measure([pale_coloured_words_on_cream], background=CREAM)
        self.assertEqual(slides[0]["readableAreas"], 0)


def a_long_thin_strip_and_one_square(draw, image) -> None:
    """Ink everywhere but a strip along the foot too thin for a drawing, and
    one two-inch square: the strip is bigger, the square is the room."""
    draw.rectangle([0, 0, PAGE_W, PAGE_H - 40], fill=INK)
    side = round(2 * PER_INCH)
    draw.rectangle([1100, 150, 1100 + side, 150 + side], fill=CARD)


class EveryDrawingSizedPlaceIsCountedTests(MeasureRunner):
    def test_a_thin_strip_does_not_end_the_count(self):
        """Renga deck slide 12 (17 October 2026): the strip under a table was
        the biggest clear shape, too thin to hold a drawing, and the count
        stopped there with the square beside the title still unseen."""
        _, slides = self.measure([a_long_thin_strip_and_one_square])
        self.assertEqual(slides[0]["readableAreas"], 1)
        self.assertGreaterEqual(slides[0]["areas"][0]["heightInches"], 1.8)


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


class TheStampIsWhatThePagesWereDrawnFromTests(unittest.TestCase):
    """The measurement used to be stamped with whatever lesson file the caller
    named. On 6 October 2026 a decorator whose measurement had been refused as
    stale measured an older render again, named the current lesson.json beside
    it, and the stale check passed over pages drawn before the deck moved. The
    preview check now keeps the lesson file it built from beside the deck, and
    that file is what gets stamped.
    """

    DRAWN = {"slides": [{"title": "Digestion", "dots": [{"x": 0.2, "y": 0.4}]}]}
    # The same words with one dot moved: nothing in the deck's text can tell
    # these two apart, which is what happened on the day.
    MOVED = {"slides": [{"title": "Digestion", "dots": [{"x": 0.6, "y": 0.4}]}]}
    DECORATED = {
        "slides": [
            {
                "title": "Digestion",
                "dots": [{"x": 0.2, "y": 0.4}],
                "decorations": [{"emoji": "x"}],
            }
        ]
    }

    def stamp(self, named, kept=None):
        """Measure one drawn page, naming `named` as the lesson and leaving
        `kept` beside the deck as the file the build says it drew."""
        Image, _ = _pil()
        with TemporaryDirectory() as tmp:
            preview = Path(tmp) / "preview"
            preview.mkdir()
            deck = preview / "deck.pptx"
            deck.write_bytes(b"deck")
            page = preview / "deck-page-01.png"
            Image.new("RGB", (PAGE_W, PAGE_H), (255, 255, 255)).save(page)
            if kept is not None:
                (preview / "lesson-source.json").write_text(
                    json.dumps(kept), encoding="utf-8"
                )
            manifest = preview / "render-manifest.json"
            manifest.write_text(
                json.dumps(
                    {
                        "version": 1,
                        "source": str(deck),
                        "pages": [{"number": 1, "path": str(page), "sha256": "x"}],
                    }
                ),
                encoding="utf-8",
            )
            lesson = Path(tmp) / "lesson.json"
            lesson.write_text(json.dumps(named), encoding="utf-8")
            output = Path(tmp) / "slide-room.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--render-manifest",
                    str(manifest),
                    "--lesson",
                    str(lesson),
                    "--output",
                    str(output),
                ],
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            record = json.loads(output.read_text(encoding="utf-8"))
            return result.stdout, record.get("compositionSha256")

    def test_an_older_render_cannot_be_stamped_as_the_current_deck(self):
        _, drawn = self.stamp(self.DRAWN)
        _, moved = self.stamp(self.MOVED)
        self.assertNotEqual(drawn, moved)
        said, stamped = self.stamp(self.MOVED, kept=self.DRAWN)
        # Stamped with what was drawn, so the stale check downstream still
        # refuses these pages for the deck as it now stands.
        self.assertEqual(stamped, drawn)
        self.assertIn("SLIDE_ROOM_PAGES_ARE_OLDER", said)
        self.assertIn("SLIDE_ROOM_OK: 1 slides", said)

    def test_adding_drawings_to_the_deck_that_was_rendered_is_not_a_mismatch(self):
        _, drawn = self.stamp(self.DRAWN)
        said, stamped = self.stamp(self.DECORATED, kept=self.DRAWN)
        self.assertEqual(stamped, drawn)
        self.assertNotIn("SLIDE_ROOM_PAGES_ARE_OLDER", said)

    def test_a_render_with_no_kept_lesson_is_stamped_as_before(self):
        _, moved = self.stamp(self.MOVED)
        said, stamped = self.stamp(self.MOVED, kept=None)
        self.assertEqual(stamped, moved)
        self.assertNotIn("SLIDE_ROOM_PAGES_ARE_OLDER", said)


class TheStampIsTheDeckNotHowItWasSavedTests(unittest.TestCase):
    """The builder reads 1.0 and 1 as the same number and draws the same page.
    On 7 October 2026 two decorators added their drawings by saving the deck
    through JavaScript, which writes 1.0 as 1; the stamp changed with no slide
    touched, and the picture check told them the deck had moved and every
    drawing had to be placed again (Year 2 noun phrases, Year 5 perimeter).
    """

    AS_DESIGNED = {"slides": [{"title": "Area", "zones": [{"share": 1.0}, {"share": 3.0}, {"share": 0.5}]}]}
    SAVED_AGAIN = {"slides": [{"title": "Area", "zones": [{"share": 1}, {"share": 3}, {"share": 0.5}]}]}
    RESIZED = {"slides": [{"title": "Area", "zones": [{"share": 1.5}, {"share": 3.0}, {"share": 0.5}]}]}

    def stamp(self, named, kept=None):
        return TheStampIsWhatThePagesWereDrawnFromTests.stamp(self, named, kept)

    def checker(self):
        import importlib.util

        script = ROOT / "scripts" / "check-optional-pictures.py"
        spec = importlib.util.spec_from_file_location("check_optional_pictures", script)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        return module

    def test_the_two_files_are_saved_differently(self):
        # Otherwise the tests below would pass for no reason.
        self.assertIn("1.0", json.dumps(self.AS_DESIGNED))
        self.assertNotIn("1.0", json.dumps(self.SAVED_AGAIN))

    def test_a_whole_number_saved_without_its_point_is_the_same_deck(self):
        _, designed = self.stamp(self.AS_DESIGNED)
        said, saved_again = self.stamp(self.SAVED_AGAIN, kept=self.AS_DESIGNED)
        self.assertEqual(saved_again, designed)
        self.assertNotIn("SLIDE_ROOM_PAGES_ARE_OLDER", said)
        _, alone = self.stamp(self.SAVED_AGAIN)
        self.assertEqual(alone, designed)

    def test_a_number_that_really_changed_is_still_a_different_deck(self):
        _, designed = self.stamp(self.AS_DESIGNED)
        said, resized = self.stamp(self.RESIZED, kept=self.AS_DESIGNED)
        self.assertEqual(resized, designed)
        self.assertIn("SLIDE_ROOM_PAGES_ARE_OLDER", said)
        _, alone = self.stamp(self.RESIZED)
        self.assertNotEqual(alone, designed)

    def test_the_picture_check_stamps_a_deck_exactly_as_the_measurement_does(self):
        # Two scripts work the stamp out, one writing it and one comparing it.
        check = self.checker()
        for deck in (self.AS_DESIGNED, self.SAVED_AGAIN, self.RESIZED):
            with self.subTest(deck=deck):
                _, measured = self.stamp(deck)
                self.assertEqual(check.composition_fingerprint(deck), measured)

    def test_the_picture_check_accepts_the_deck_saved_again_and_refuses_a_moved_one(self):
        check = self.checker()
        _, designed = self.stamp(self.AS_DESIGNED)
        self.assertEqual(check.composition_fingerprint(self.SAVED_AGAIN), designed)
        self.assertNotEqual(check.composition_fingerprint(self.RESIZED), designed)


if __name__ == "__main__":
    unittest.main()
