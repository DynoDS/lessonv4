"""The optional picture layer may use a slide's own space.

P2 and P3 used to share one rule forbidding either from touching the template,
and a separate rule forbade adding decoration to a sparse page. Between them an
optional picture could only ever sit beside some words: a slide whose content had
already claimed a template had nowhere to put one, and a text-heavy slide was
explicitly not allowed one. Both rules predate the builder being able to place a
picture by its own frame, in front of or behind content, which it has always
been able to do.

These assertions hold the corrected split. A P2 carries meaning, so it may hold a
place of its own and may be weighed while a light slide picks its template. A P3
carries none, so room is never arranged around one, but it is free to sit in
space the composition already left spare.
"""
from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def read(*parts: str) -> str:
    """Return the file with runs of whitespace collapsed to single spaces.

    These files are hard-wrapped prose, so a sentence worth asserting on
    routinely spans a line break. Matching the wrapped form would break every
    assertion here on a reflow that changed nothing.
    """
    text = ROOT.joinpath(*parts).read_text(encoding="utf-8")
    return re.sub(r"\s+", " ", text)


class OptionalPicturePlacementTests(unittest.TestCase):
    def setUp(self) -> None:
        self.context = read("references", "context-pictures.md")
        self.preferences = read("references", "preferences.md")
        self.designer = read("agents", "slide-designer.md")
        self.reviewer = read("agents", "visual-reviewer.md")

    def test_retired_rules_are_gone(self) -> None:
        """Each of these forbade exactly the placement the teacher asked for."""
        self.assertNotIn("do not add P3 merely to cure a sparse page", self.preferences)
        self.assertNotIn("change a template/layout/page count", self.context)

    def test_p2_may_be_weighed_while_a_light_slide_picks_its_template(self) -> None:
        self.assertIn("may be weighed while the template is still being chosen", self.context)
        self.assertIn("ask whether a relevant P2 belongs before settling its template", self.designer)

    def test_a_template_chosen_around_a_picture_still_reads_without_it(self) -> None:
        """The drawing is searched for later, so it may never arrive."""
        self.assertIn("still look finished as text on its own", self.designer)
        self.assertIn("reads as deliberate rather than holed", self.context)

    def test_no_room_is_ever_arranged_around_a_p3(self) -> None:
        self.assertIn("Room is never arranged around a P3", self.designer)
        self.assertIn("A P3 never gets a place made for it", self.context)
        self.assertIn("no template, layout or page count is ever arranged around one", self.context)

    def test_p3_has_its_two_triggers_on_both_surfaces_that_decide_it(self) -> None:
        for marker in ("still reads as a wall of text", "no imagery at all"):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.preferences)
                self.assertIn(marker, self.designer)

    def test_p3_has_somewhere_concrete_to_go(self) -> None:
        for placement in (
            "behind a text card",
            "straddling a card's edge",
            "tucked into a corner of the slide",
            "resting in the margin a card's shape already leaves",
        ):
            with self.subTest(placement=placement):
                self.assertIn(placement, self.context)
        self.assertIn("Overlapping content is normal", self.context)

    def test_placement_rules_load_before_the_template_is_chosen(self) -> None:
        """By the whole-deck opportunity pass the template decision has happened."""
        startup, marker, _ = self.context.partition("## The boundary")
        self.assertTrue(marker)
        self.assertIn("Where an optional picture sits on a slide", startup)

    def test_both_decoration_shapes_are_shown_not_only_the_wide_accent(self) -> None:
        self.assertIn("P3 decoration, as a wide accent behind the content", self.context)
        self.assertIn("P3 decoration, as one small drawing resting on a card's edge", self.context)
        self.assertIn('"layer": "low"', self.context)
        self.assertIn('"layer": "high"', self.context)

    def test_deliberate_overlap_is_not_a_visual_review_fault(self) -> None:
        self.assertIn("deliberately overlapping a card is not this fault", self.reviewer)
        self.assertIn(
            "covers a word, a number, a table cell or part of a figure a child reads",
            self.reviewer,
        )

    def test_the_protections_that_matter_survived(self) -> None:
        """Freedom over space, not over the child's experience."""
        for marker in (
            "becomes part of the answer, shrinks text",
            "reduces writing space, crowds a diagram",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.context)
        self.assertIn("P3 is always the first thing to remove", self.designer)
        self.assertIn("Missing P3 and deliberate sparseness are never findings", self.reviewer)


if __name__ == "__main__":
    unittest.main()
