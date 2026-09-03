from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DESIGNER = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
TEMPLATE = (ROOT / "references" / "output-template.md").read_text(encoding="utf-8")


def flat(text: str) -> str:
    return " ".join(text.split())


class PictureRequirementsAreGettableTests(unittest.TestCase):
    """A picture requirement only one archive can satisfy has no answer here.

    A Year 4 history lesson (3 September 2026) searched the web while planning,
    found five ideal photographs - a Shakespeare Birthplace Trust hornbook, and
    Ford End School, Essex, around 1900 and in 2017 - and made all five
    essential, load-bearing evidence. The only acquisition route is a compiled
    search of Wikimedia and Unsplash, which holds none of them. The designer
    wrote the impossibility down twice, in `pedagogical_constraint` and in its
    own decisions record, and shipped the contract anyway; the teacher received
    a working wall, with no slides, no worksheet and no answer key.

    The teaching never needed those exact items: a British classroom around
    1900 and a modern one would have taught continuity and change just as well,
    and Wikimedia holds many of each.
    """

    def test_the_designer_pitches_evidence_at_the_teaching_level(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("Name the evidence at the level the teaching needs.", designer)
        # The contrastive pair is what makes the rule usable: both are
        # authentic-real, and only one has an answer in the approved sources.
        self.assertIn(
            "`An authentic photograph of a British elementary-school classroom "
            "around 1900, children at rows of desks` is a requirement Wikimedia "
            "holds many answers to",
            designer,
        )
        self.assertIn(
            "Authenticity is not what narrows this: the first of those is "
            "`authentic-real` too",
            designer,
        )

    def test_a_known_impossibility_is_a_redesign_not_a_flag(self) -> None:
        """Writing down why the route cannot work is the moment to change the
        design, not the moment to hand the problem to the teacher."""
        designer = flat(DESIGNER)
        self.assertIn(
            "A picture you have concluded cannot be acquired is a redesign now, "
            "not a flag.",
            designer,
        )
        self.assertIn(
            "A flag reaches the teacher hours later attached to nothing.",
            designer,
        )

    def test_searching_the_web_stays_allowed_and_its_finding_has_a_home(self) -> None:
        """The search itself found good evidence and better subject knowledge.

        The rule narrows what the search may be turned into, not whether it may
        happen: an ideal source the libraries do not hold reaches the teacher
        through `flagsForTeacher` instead of stalling the run.
        """
        designer = flat(DESIGNER)
        self.assertIn("Searching the web while planning is fine and often good", designer)
        self.assertIn("its URL belongs in `flagsForTeacher`", designer)

    def test_the_schema_reference_carries_the_same_rule(self) -> None:
        """Two owners of one field must not disagree about what goes in it."""
        template = flat(TEMPLATE)
        self.assertIn(
            "Every text field here says what has to be visible, never where to "
            "get it",
            template,
        )
        self.assertIn(
            "the validator rejects a web address anywhere in a picture object",
            template,
        )


if __name__ == "__main__":
    unittest.main()
