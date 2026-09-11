"""Two repairs from the geography comparison (11 September 2026).

The plugin's `To describe how Indigenous peoples use the Amazon rainforest`,
designed from Daniel's own Kapow long-term-plan row, was read against the same
row written up by an assistant knowing only his voice guide. The plugin's was
the better lesson: a printed map every child fails to find a road on before
anyone names that the rivers are the roads, four written commitments before
the main task, full scripts, a final task that matches the objective's verb,
and a caught factual error in the plan itself.

Two things the other one had.

1. Its slide 3 asks `Imagine this is your home. What would you need every
   day?` and the class produces water, food, shelter, transport, medicine.
   The rest of its lesson answers that list. The plugin decided its own two
   categories (the river, the forest) and handed them over. Nothing anywhere
   in the plugin said a set could be built by the class first; the nearest
   thing, `subject-history.md`'s speculation rule, is about the opening of a
   history lesson, not about the categories a content lesson will supply.

2. It says `Different Indigenous communities live in different ways`, in the
   children's hearing. The plugin's lesson teaches one riverside community
   and never says it, so a child leaves with thatched houses and canoes as
   the life of all 350 groups. This is not a new principle: `subject-history.md`
   holds it for a past society and `subject-re.md` for a tradition. It was
   missing for anyone alive now, so it goes to the general owner rather than
   into two more subject files.
"""
from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PREFERENCES = ROOT / "references" / "preferences.md"
HISTORY = ROOT / "references" / "subject-history.md"
RE = ROOT / "references" / "subject-re.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheClassBuildsTheSetFirst(unittest.TestCase):
    def test_the_rule_and_what_it_buys(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn(
            "Where the lesson is going to hand over a set, let the class build it first",
            preferences,
        )
        self.assertIn("every chunk afterwards answers a question the children asked", preferences)
        self.assertIn("What would you need every day?", preferences)
        # The chunks have to connect back, or the elicitation is decoration.
        self.assertIn("each chunk names the item it is answering as it arrives", preferences)

    def test_the_limit_is_what_a_child_can_actually_produce(self) -> None:
        """Without this the rule turns every Teach into a guessing round, and
        the wrong list is what the class remembers."""
        preferences = flat(PREFERENCES)
        self.assertIn("It fails when the set is the knowledge itself", preferences)
        self.assertIn("guessing dressed as elicitation", preferences)
        self.assertIn("no child generates the four layers of a rainforest", preferences)
        # A test the designer can actually run.
        self.assertIn("answering your own question as a nine-year-old", preferences)

    def test_it_does_not_replace_the_history_speculation_rule(self) -> None:
        """That one is about the opening of a history lesson and stays."""
        self.assertIn("Children can speculate from their own world at the start of a lesson", flat(HISTORY))


class OneCaseIsNotTheGroup(unittest.TestCase):
    def test_the_rule_reaches_the_children_not_the_planning(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("One case is not the group, and the class hears so", preferences)
        self.assertIn("Different Indigenous communities live in different ways", preferences)
        self.assertIn("placed where the case is taught rather than in the planning", preferences)

    def test_one_well_chosen_case_is_still_the_right_shape(self) -> None:
        """The repair must not become an argument for a tour of six examples."""
        preferences = flat(PREFERENCES)
        self.assertIn("one well-chosen case is how content becomes real", preferences)
        self.assertIn("a tour of six teaches nothing", preferences)

    def test_it_defers_to_the_subject_files_that_already_hold_it(self) -> None:
        """Folded, not stacked: history and RE keep their own versions and the
        general rule names them rather than repeating them."""
        preferences = flat(PREFERENCES)
        self.assertIn("the subject file has not already said it", preferences)
        self.assertIn("Everybody alive in a period lived the same life", flat(HISTORY))
        self.assertIn("the same practice carries different meanings for different people", flat(RE))


if __name__ == "__main__":
    unittest.main()
