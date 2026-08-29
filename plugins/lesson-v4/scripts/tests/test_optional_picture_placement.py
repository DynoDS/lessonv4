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

    def test_use_is_judged_per_slide_not_against_a_deck_quota(self) -> None:
        """A count fixed in advance is met by finding that many, relevant or not.

        The old target was one or two across a whole deck, which was consistent
        while the layer could only sit beside words. Once every text-heavy and
        every imageless slide became a candidate, that number left almost every
        slide bare for a reason that no longer applied.
        """
        self.assertNotIn("One or two meaningful uses remains the normal target", self.context)
        self.assertIn("Decide slide by slide rather than against a whole-deck quota", self.context)
        self.assertIn("Expect a normal deck to carry several", self.context)
        self.assertIn("Judge each slide on its own rather than against a deck quota", self.designer)

    def test_variety_is_required_and_sameness_named_as_the_failure(self) -> None:
        self.assertIn("Vary what is used and where it sits", self.context)
        self.assertIn("reads as a template rather than a decision", self.context)
        self.assertIn("Slides that are genuinely full stay bare", self.context)

    def test_a_number_never_justifies_an_unrelated_drawing(self) -> None:
        self.assertIn("Never use an unrelated drawing to reach a number", self.context)
        self.assertIn("Zero is valid only when", self.context)

    def test_competing_is_defined_physically_and_per_surface(self) -> None:
        """Strong P1 visuals must not zero the optional layer.

        A balanced-diet deck carried its plate and nutrient table on nearly
        every slide, and the designer read that strength as competition,
        shipping a deck with no optional pictures at all. Competition is
        covering, shrinking, crowding on the picture's own surface; the deck's
        P1 identity, a shared subject, and imagined endorsement are not it.
        """
        self.assertIn('"Competes" is physical and local', self.context)
        self.assertIn("Judge it one surface at a time", self.context)
        self.assertIn("never why the whole deck goes without it", self.context)
        self.assertIn(
            "Competing is physical and judged on this slide alone", self.designer
        )

    def test_deck_level_reasons_never_zero_the_layer(self) -> None:
        self.assertIn("is not competition and never zeroes the layer", self.context)
        self.assertIn("no task asks a child to read it", self.context)

    def test_the_reviewer_judges_legibility_and_nothing_else(self) -> None:
        """Taste findings on a layer that teaches nothing crowd out real faults.

        The reviewer used to weigh relevance, cosmetic awkwardness and whether a
        slide had missed an opportunity. All three are opinions about a layer
        that costs a child nothing, and how much of it a deck uses is the
        teacher's call rather than a fault to report.
        """
        review = read("references", "visual-review-deck.md")
        self.assertIn("exactly one fault: a picture covering something a child has to read", review)
        self.assertIn("overlap by itself is never the fault", review)
        for retired in (
            "check relevance, subordination and non-obstruction",
            "Harmless cosmetic awkwardness is MINOR at most",
            "a MINOR finding may name that missed opportunity",
        ):
            with self.subTest(retired=retired):
                self.assertNotIn(retired, review)

        reviewer = read("agents", "visual-reviewer.md")
        self.assertIn("judge legibility rather than taste", reviewer)
        self.assertIn("the choice of drawing itself are never findings", reviewer)

    def test_previews_are_compared_on_one_sheet(self) -> None:
        """One look per drawing is the cost that kept a deck down to one or two."""
        self.assertIn("--sheet", self.context)
        self.assertIn("Candidates for several requests may share one sheet", self.context)

    def test_the_protections_that_matter_survived(self) -> None:
        """Freedom over space, not over the child's experience."""
        for marker in (
            "becomes part of the answer, shrinks text",
            "reduces writing space, crowds a diagram",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.context)
        self.assertIn("P3 is always the first thing to remove", self.designer)
        self.assertIn("Missing P3, deliberate sparseness", self.reviewer)
        self.assertIn("are never findings", self.reviewer)


if __name__ == "__main__":
    unittest.main()
