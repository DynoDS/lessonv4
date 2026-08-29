from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PREFERENCES = ROOT / "references" / "preferences.md"
STICK_IN_PEDAGOGY = ROOT / "references" / "stick-in-sheets-pedagogy.md"
WALL_DESIGNER = ROOT / "agents" / "working-wall-designer.md"
STICK_IN_DESIGNER = ROOT / "agents" / "stick-in-sheets-designer.md"
WORKSHEET_DESIGNER = ROOT / "agents" / "worksheet-designer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ChildFacingWordingReachTests(unittest.TestCase):
    def test_plain_prompt_habits_cover_every_printed_surface(self) -> None:
        """A child reads a wall card and a stick-in piece unaided too.

        These three habits were written as worksheet rules, so a planning name
        such as `the balance rule` was barred from a sheet and allowed onto a
        card that stays on the wall for weeks. The register paragraph sits in
        Written Voice, which every designer already reads, so the repair is to
        widen the one rule rather than copy it into each designer file.
        """
        preferences = flat(PREFERENCES)

        self.assertIn(
            "Three habits keep any printed child-facing wording plain, on a "
            "worksheet, a stick-in piece or a wall card alike",
            preferences,
        )
        self.assertNotIn(
            "Three habits keep worksheet prompts plain", preferences
        )

        # The habits themselves must still be the ones that were widened.
        for habit in (
            "An instruction is a short imperative",
            "A prompt never lists choices the page already prints",
            "never reaches the child",
        ):
            with self.subTest(habit=habit):
                self.assertIn(habit, preferences)

    def test_every_child_facing_designer_reads_written_voice(self) -> None:
        """Widening the rule only works if these designers load the section."""
        for path in (WALL_DESIGNER, STICK_IN_DESIGNER, WORKSHEET_DESIGNER):
            with self.subTest(agent=path.name):
                self.assertIn("Written Voice", flat(path))

    def test_designer_set_response_space_is_counted_from_the_demand(
        self,
    ) -> None:
        """The stick-in builder sizes its pieces; one piece is the exception.

        `geographical-description-frame` lets the designer set the number of
        writing lines, which is the same undercounting fault the worksheet
        rules already name, so the count rule sits beside that spec.
        """
        pedagogy = flat(STICK_IN_PEDAGOGY)
        self.assertIn(
            "This is the one piece whose response space you set rather than "
            "the builder",
            pedagogy,
        )
        self.assertIn("at the width it prints", pedagogy)


if __name__ == "__main__":
    unittest.main()
