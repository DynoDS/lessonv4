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
        # The pass that places drawings runs in the Slide Decorator, its own
        # worker, since 1 Sept 2026; the designer keeps the first moment only.
        self.decorator = read("agents", "slide-decorator.md")

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
                self.assertIn(marker, self.decorator)

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

    def test_deliberate_overlap_is_not_a_fault_at_the_confirming_render(self) -> None:
        """The rule has outlived two owners now.

        A separate reviewer held "overlap by itself is never the fault", then
        the Slide Designer's built-deck look did. Both are gone. The confirming
        render the designer takes after resolving its own layer is the only pass
        that sees a P3 sitting on a card, so the boundary travels with it or the
        layer gets flagged for working exactly as designed.
        """
        self.assertIn("deliberately overlapping a card is the layer working as designed", self.decorator)
        self.assertIn(
            "covers a word, a number, a table cell or part of a figure a child reads",
            self.decorator,
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
        self.assertIn("Judge each slide on its own rather than against a deck quota", self.decorator)

    def test_variety_is_required_and_sameness_named_as_the_failure(self) -> None:
        self.assertIn("Vary what is used and where it sits", self.context)
        self.assertIn("reads as a template rather than a decision", self.context)
        self.assertIn("Slides that are genuinely full stay bare", self.context)

    def test_only_a_context_picture_has_to_be_about_its_subject(self) -> None:
        """The old line called any unrelated drawing worse than none.

        That contradicted decoration needing no link to the lesson, and both
        sentences reached the same reader. The rule now belongs to P2 alone.
        """
        self.assertNotIn("Never use an unrelated drawing to reach a number", self.context)
        self.assertIn("A P2 is about the thing beside it or it is not a P2", self.context)
        self.assertIn("claims no meaning", self.context)
        self.assertIn("Zero is valid only when", self.context)

    def test_the_deck_gathers_a_pool_before_it_places(self) -> None:
        """Three drawings turned round every slide (5 October 2026).

        Both decks ran one or two searches for the whole deck, so no slide had
        anything else to choose from. The teacher: "collect and search for as
        many as it wants, there's no limit".
        """
        self.assertIn("Gather the deck's drawings before you place any", self.decorator)
        self.assertIn("There is no limit on how many searches you run", self.decorator)
        self.assertIn("Reach for a drawing the deck has not used yet", self.decorator)
        self.assertIn("does not make plain decoration rare", self.decorator)
        self.assertIn("What each slide names", self.decorator)
        self.assertIn("What belongs to the lesson without being named on a slide", self.decorator)
        self.assertIn("A lesson drawing goes in the `decorations` array like any other", self.decorator)

    def test_a_plain_decoration_may_not_be_stamped_across_the_deck(self) -> None:
        """A retest still placed the same flower on three slides (5 October 2026)."""
        import importlib.util
        import sys

        script = Path(__file__).resolve().parents[1] / "check-optional-pictures.py"
        spec = importlib.util.spec_from_file_location("check_optional_pictures", script)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)

        def slide(text, concept, drawing):
            return {
                "title": text,
                "decorations": [
                    {"kind": "educational-svg", "concept": concept, "educationalSvgId": drawing}
                ],
            }

        stamped = {"slides": [slide(f"Slide {n}", "flower", "standard/fl/flower.svg") for n in range(3)]}
        self.assertEqual(len(module.repeated_decorations(stamped)), 1)

        twice = {"slides": stamped["slides"][:2]}
        self.assertEqual(module.repeated_decorations(twice), [])

        # A subject that returns takes a different drawing of it: the same
        # candle went on four slides and he said "still see some repeats".
        subject = {
            "slides": [
                slide("An orange stands for the world", "orange", "standard/or/orange.svg")
                for _ in range(4)
            ]
        }
        self.assertEqual(len(module.repeated_decorations(subject)), 1)
        self.assertIn("Vary the sizes, and tilt some", self.decorator)
        self.assertIn("A drawing belongs on the cards as much as beside them", self.decorator)
        self.assertLess(module.ON_INK_SHARE, 0.05)
        self.assertIn("Gather widely before placing anything", self.context)
        self.assertIn("not once per deck", self.context)
        self.assertNotIn("when they share a style", self.context)

    def test_a_page_clicked_through_keeps_its_drawings_still(self) -> None:
        """A column subtraction answered a digit a click swapped its drawing on
        every click, so the drawing moved more than the digit (7 October 2026).
        The teacher: the same drawing, unchanged, on every click."""
        import importlib.util
        import sys

        script = Path(__file__).resolve().parents[1] / "check-optional-pictures.py"
        spec = importlib.util.spec_from_file_location("check_optional_pictures", script)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)

        def click(answer, working, drawing, x=0.3):
            return {
                "title": "Answers",
                "template": "maths-turn-sc",
                "questionVisual": {"calculation": {"answer": answer}, "value": working},
                "speakerNotes": f"notes for {answer}",
                "decorations": [{
                    "id": f"decoration-{answer}",
                    "kind": "educational-svg",
                    "concept": drawing,
                    "educationalSvgId": f"standard/{drawing}.svg",
                    "frame": {"x": x, "y": 0.7, "width": 0.1, "height": 0.15},
                }],
            }

        steps = [("4", "Ones: 4\nTens:"), ("64", "Ones: 4\nTens: 6"),
                 ("164", "Ones: 4\nTens: 6"), ("3164", "Ones: 4\nTens: 6")]
        swapped = {"slides": [
            click(answer, working, drawing)
            for (answer, working), drawing in zip(steps, ["medal", "balloon", "man", "pencils"])
        ]}
        self.assertEqual(module.reveal_runs(swapped), [[1, 2, 3, 4]])
        moved = module.drawings_that_move_in_a_run(swapped)
        self.assertEqual(len(moved), 1)
        self.assertIn("slides 1 to 4", moved[0])

        # Held still, it passes, and four clicks of one page are one slide for
        # the two-slide repeat limit.
        still = {"slides": [click(answer, working, "man") for answer, working in steps]}
        self.assertEqual(module.drawings_that_move_in_a_run(still), [])
        self.assertEqual(module.repeated_decorations(still), [])

        # The same drawing nudged sideways still moves.
        nudged = {"slides": [
            click(answer, working, "man", x=0.3 + 0.02 * index)
            for index, (answer, working) in enumerate(steps)
        ]}
        self.assertEqual(len(module.drawings_that_move_in_a_run(nudged)), 1)

        # The discrimination case: a second page of questions has the same
        # shape and different words, so it is a new page and takes new drawings.
        pages = {"slides": [
            click("", "(1) 4,563 - 1,285 =", "medal"),
            click("", "(3) 6,435 - 2,718 =", "balloon"),
        ]}
        self.assertEqual(module.reveal_runs(pages), [])
        self.assertEqual(module.drawings_that_move_in_a_run(pages), [])
        # A question slide and the answers slide made from it are one page too,
        # and join the clicks that follow. An answers slide on another template
        # was laid out afresh, so it is a new page.
        def task(title, template="maths-turn-sc"):
            return {"title": title, "template": template, "designUnitId": "unit-004",
                    "questionVisual": {"type": "place-value-chart"}}

        answers = [dict(click(answer, working, "man"), designUnitId="unit-004")
                   for answer, working in steps]
        self.assertEqual(
            module.reveal_runs({"slides": [task("My Turn")] + answers}),
            [[1, 2, 3, 4, 5]],
        )
        self.assertEqual(
            module.reveal_runs({"slides": [task("Your Turn", "split-h-60-40"), answers[0]]}),
            [],
        )
        self.assertIn("A page clicked through keeps its drawings still", self.decorator)
        self.assertIn("What the drawing is decides how close it may come", self.decorator)

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
            "Competing is physical and judged on this slide alone", self.decorator
        )

    def test_a_framed_picture_is_stated_to_move_nothing(self) -> None:
        """The fact that makes a full-looking slide still a candidate.

        The reference described a picture beside words rewrapping the text
        column, which is true of the inline route and of nothing else. Read as
        the whole story it makes every framed picture look like a claim on
        space, so "the slide is full" reads as an answer for both routes. It is
        an answer for one.
        """
        self.assertIn(
            "nothing on the slide moves, resizes or reflows because of it",
            self.context,
        )
        self.assertIn("it is asking whether any part of the slide is clear", self.context)
        self.assertIn(
            'Answering that slide with "it is full" describes the inline route',
            self.context,
        )

    def test_a_strong_central_visual_is_not_competition(self) -> None:
        """Three slides were declined for having a good main picture on them.

        The old competing test read "covers, shrinks, crowds or pulls the eye
        off". The first three are physical and measurable. The fourth is not,
        and it is the one that let a dominant teaching visual close the layer on
        slides with a clear column beside it.
        """
        self.assertNotIn("pulls the eye off something", self.context)
        self.assertIn("a strong central teaching visual, however dominant", self.context)
        self.assertIn("Attention is not a resource this layer spends", self.context)
        self.assertIn(
            "neither does a strong central visual", self.decorator
        )

    def test_the_pass_asks_how_many_not_whether(self) -> None:
        """One slot per slide gives a flat deck however well each slide is judged."""
        self.assertIn("Ask how many, not whether", self.context)
        self.assertIn(
            "How many of those clear places hold a drawing, and which drawing?", self.decorator
        )
        self.assertIn("never when a count is reached", self.decorator)

    def test_deck_level_reasons_never_zero_the_layer(self) -> None:
        self.assertIn("is not competition and never zeroes the layer", self.context)
        self.assertIn("no task asks a child to read it", self.context)

    def test_the_confirming_render_judges_legibility_and_nothing_else(self) -> None:
        """Taste findings on a layer that teaches nothing crowd out real faults.

        The retired reviewer used to weigh relevance, cosmetic awkwardness and
        whether a slide had missed an opportunity. All three are opinions about
        a layer that costs a child nothing, and how much of it a deck uses is
        the teacher's call rather than a fault to report. The one pass that now
        sees the drawings in position inherits the restraint along with the job.
        """
        self.assertIn("overlap by itself is never the fault", self.decorator.lower())
        self.assertIn("Judge legibility rather than taste", self.decorator)
        self.assertIn("the choice of drawing itself", self.decorator)
        self.assertIn("are never faults here", self.decorator)

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
        self.assertIn("P3 is always the first thing to remove", self.decorator)
        self.assertIn("missing P3, deliberate sparseness", self.decorator)
        self.assertIn("are never faults here", self.decorator)


if __name__ == "__main__":
    unittest.main()
