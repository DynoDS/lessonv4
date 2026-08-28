"""The rule that keeps a platform-drawn emoji out of a load-bearing symbol.

A Year 4 electricity lesson asked for a UK three-pin plug and socket so children
could sort appliances by how they are powered. No helper carried that symbol,
nothing routed the requirement to one, and the designers typed the Unicode plug
emoji into the category labels instead. Every device draws that emoji its own
way, and the one the deck rendered was a generic two-pin plug, so the picture the
children were sorting by was the wrong object. The structural checks passed:
schema, completeness and page fit cannot see what a glyph looks like. Only the
visual review at the very end caught it, after the whole lesson had been built.

The guidance that lost was "emoji only when genuinely unambiguous". That test
reads as satisfied here, because the plug emoji unambiguously means a plug. What
failed was fidelity, not ambiguity: the right category and the wrong form.

Three files carry the repair, and each owns a different half of it, so this
checks all three rather than trusting one of them to survive an edit alone:

- ``agents/lesson-designer.md`` decides whether a visual is required at all;
- ``references/output-template.md`` routes a form-specific symbol into the
  declared representations, which is what puts it in front of the helper check
  before any renderer starts;
- ``references/context-pictures.md`` is read by all four visual designers and
  owns the emoji route itself.
"""
from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

LESSON_DESIGNER = (ROOT / "agents" / "lesson-designer.md").read_text(
    encoding="utf-8"
)
CONTEXT_PICTURES = (ROOT / "references" / "context-pictures.md").read_text(
    encoding="utf-8"
)
OUTPUT_TEMPLATE = (ROOT / "references" / "output-template.md").read_text(
    encoding="utf-8"
)

VISUAL_DESIGNERS = (
    "slide-designer",
    "worksheet-designer",
    "working-wall-designer",
    "stick-in-sheets-designer",
)


class SymbolFidelityContract(unittest.TestCase):
    def test_the_emoji_route_says_the_glyph_is_not_the_lessons_to_choose(self):
        """The reason, not just the rule.

        A designer who is told only "no emoji for a UK plug" has learned one
        case. A designer who is told the device draws the glyph can work out
        the pound coin, the road sign and the piece of apparatus on their own.
        """
        self.assertIn("drawn by the device", CONTEXT_PICTURES)
        self.assertIn("learn the wrong thing", CONTEXT_PICTURES)

    def test_the_emoji_rule_reaches_an_emoji_typed_into_text(self):
        """Where the failing emoji actually sat.

        Every existing emoji rule governed the ``picture`` object. The plug was
        typed straight into a sorting label, so it went past all of them. A rule
        that only covers ``picture`` would have let this exact lesson through
        again.
        """
        self.assertIn("not only in a `picture` object", CONTEXT_PICTURES)

    def test_the_emoji_rule_keeps_its_boundary(self):
        """Decoration is untouched.

        A relevant emoji lifting a text-only line is approved house style. A
        rule with no limit would have stripped those out too and made every
        slide plainer for no gain.
        """
        self.assertIn("decoration and is unaffected", CONTEXT_PICTURES)

    def test_all_four_visual_designers_read_the_reference_that_carries_it(self):
        for name in VISUAL_DESIGNERS:
            agent = (ROOT / "agents" / f"{name}.md").read_text(encoding="utf-8")
            with self.subTest(agent=name):
                self.assertIn("references/context-pictures.md", agent)

    def test_the_lesson_designer_tests_fidelity_rather_than_ambiguity(self):
        """The origin of the requirement.

        The old wording asked whether the emoji was unambiguous, which the plug
        emoji is. The new wording asks whether every device's drawing of it
        would still be the thing that was named, which the plug emoji is not.
        """
        self.assertIn(
            "any device's drawing of it would still be the thing you named",
            LESSON_DESIGNER,
        )
        self.assertNotIn("emoji only when genuinely unambiguous", LESSON_DESIGNER)

    def test_a_form_specific_symbol_is_declared_as_a_representation(self):
        """The routing half.

        The helper check at Phase 1.5 compares the design's declared
        representations against the helper catalogues. A symbol left as a bare
        label is never declared, so it never reaches that check and the gap is
        found only after everything has been built.
        """
        self.assertIn(
            "A symbol counts as a representation whenever the learning depends "
            "on its exact form",
            OUTPUT_TEMPLATE,
        )
        self.assertIn("however small it renders", OUTPUT_TEMPLATE)


if __name__ == "__main__":
    unittest.main()
