from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DESIGNER = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
TEMPLATE = (ROOT / "references" / "output-template.md").read_text(encoding="utf-8")
SCOUT_SEARCH = (ROOT / "references" / "image-scout-search.md").read_text(encoding="utf-8")


def flat(text: str) -> str:
    return " ".join(text.split())


class PictureRequirementsAreGettableTests(unittest.TestCase):
    """Who finds a picture, and what the contract is allowed to say about it.

    A Year 4 history lesson (3 September 2026) searched the web while planning,
    found five ideal photographs - a Shakespeare Birthplace Trust hornbook, and
    Ford End School, Essex, around 1900 and in 2017 - and had no way to hand any
    of them to the pipeline. It wrote the source pages into
    `pedagogical_constraint`, shipped a contract it had already recorded as
    unbuildable, and the teacher received a working wall with no slides, no
    worksheet and no answer key.

    The repair went both ways. The scout's ladder now reaches those photographs,
    so the lesson was right to want them. The designer still does not fetch
    them: it names the subject and the institution, and the scout - which
    searches several pictures at once and has to look at the candidates
    anyway - goes and gets it.
    """

    def test_the_designer_may_search_the_web_for_the_teaching(self) -> None:
        """The search itself was good work and stays encouraged."""
        designer = flat(DESIGNER)
        self.assertIn("Search the web whenever it makes the lesson better.", designer)
        self.assertIn(
            "the one thing not to bring back is a shopping list of image files",
            designer,
        )

    def test_the_designer_names_the_evidence_and_the_scout_fetches_it(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("Name the evidence, not the file.", designer)
        self.assertIn(
            "What the contract has no field for is *this exact file*",
            designer,
        )
        # Speed is half the reason, and it belongs in the rule so the rule
        # generalises past this one lesson.
        self.assertIn("the scout searches several pictures at once", designer)

    def test_a_specific_archive_item_is_now_a_fair_thing_to_ask_for(self) -> None:
        """The old advice would have thrown away the right answer.

        Naming one institution's photograph used to be a design fault because
        nothing could reach it. The open-web rung reaches it, so what is left is
        the ordinary judgement: bind to one item when the teaching rests on that
        source, and describe the kind when any faithful example would do.
        """
        designer = flat(DESIGNER)
        self.assertIn("So a specific real source *is* a fair thing to ask for", designer)
        self.assertIn(
            "the Ford End School classroom around 1900, held by Essex Record Office",
            designer,
        )
        self.assertIn(
            "Keep the specific item and the general one honestly apart.",
            designer,
        )

    def test_the_designer_knows_how_far_the_route_reaches(self) -> None:
        """A designer that thinks the shelf is two libraries wide designs small."""
        designer = flat(DESIGNER)
        self.assertIn("The Image Scout climbs a ladder", designer)
        for rung in ("Unsplash and Wikimedia", "Openverse", "the open web itself"):
            with self.subTest(rung=rung):
                self.assertIn(rung, designer)

    def test_the_schema_reference_carries_the_same_rule(self) -> None:
        """Two owners of one field must not disagree about what goes in it."""
        template = flat(TEMPLATE)
        self.assertIn(
            "Every text field here says what has to be visible, never where to get it",
            template,
        )
        self.assertIn(
            "the validator therefore rejects a web address anywhere in a picture object".lower(),
            template.lower(),
        )
        self.assertIn("Openverse", template)

    def test_the_scout_reference_carries_every_compiled_rung(self) -> None:
        """A rung the scout cannot find the command for is a rung it will skip."""
        search = flat(SCOUT_SEARCH)
        self.assertIn("## The ladder", SCOUT_SEARCH)
        for command in (
            "unsplash_fetch.py",
            "wikimedia_fetch.py",
            "openverse_fetch.py",
            "web_fetch.py",
        ):
            with self.subTest(command=command):
                self.assertIn(command, search)


if __name__ == "__main__":
    unittest.main()
