from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PREFERENCES = ROOT / "references" / "preferences.md"
PLAYBOOK = ROOT / "references" / "slide-composition-playbook.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ProseDensityAndRhythmReachTests(unittest.TestCase):
    """Child-facing prose was inconsistently broken up, and the cause was scope.

    On 30 August 2026 the Year 4 water-cycle deck shipped its slide 11 model
    answer as one six-sentence centred paragraph (accepted as DECK-004), and
    the Year 4 friendships deck ran five-sentence model answers together on
    slides 11, 12 and 14. The engine renders a double newline as a paragraph
    break, so nothing mechanical was missing. The only written trigger for a
    break lived in the slide-composition playbook, scoped to task instructions
    only - a scenario, a model answer, an explanation or any other prose a
    child reads was left to taste, and the worksheet, wall and stick-in sides
    said nothing at all. The repair widened the one rule inside Written Voice,
    which every child-facing designer loads, and folded the playbook's
    task-only version into it.
    """

    def test_written_voice_owns_the_density_and_rhythm_rule(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn(
            "A block of connected sentences is judged on density and rhythm",
            preferences,
        )
        # The rule must name the prose kinds that were previously uncovered,
        # or it is the old task-only trigger under a new heading.
        self.assertIn(
            "a scenario, a model answer, an explanation, a piece of reasoning, "
            "a task",
            preferences,
        )

    def test_the_break_only_separates_existing_words(self) -> None:
        """The wording itself stays the Lesson Designer's."""
        preferences = flat(PREFERENCES)
        self.assertIn(
            "a break only separates words that are already there", preferences
        )
        self.assertIn("never rewords, reorders or adds", preferences)

    def test_the_rule_names_its_limit(self) -> None:
        """A rule with no stated boundary over-fires: a definition or a
        two-sentence answer must not come back needlessly chopped."""
        self.assertIn(
            "a block that is already one move", flat(PREFERENCES)
        )

    def test_copying_designers_are_routed_to_the_rule(self) -> None:
        """Slide, worksheet, wall and stick-in designers copy settled wording,
        so the routing sentence must name break-placement as one of the acts
        that sends them to Written Voice."""
        self.assertIn(
            "place a paragraph break in settled prose", flat(PREFERENCES)
        )

    def test_the_playbook_task_only_version_is_folded_not_duplicated(self) -> None:
        """Two owners for one judgement drift apart; the playbook defers."""
        playbook = flat(PLAYBOOK)
        self.assertNotIn(
            "When one source-authored task string contains consecutive phases",
            playbook,
        )
        self.assertIn(
            "owned by Written Voice (House Style) in `preferences.md`", playbook
        )
        # The playbook keeps only what genuinely belongs to slides: the
        # presentation roles layered on top of the break.
        self.assertIn("survival phrase", playbook)


if __name__ == "__main__":
    unittest.main()
