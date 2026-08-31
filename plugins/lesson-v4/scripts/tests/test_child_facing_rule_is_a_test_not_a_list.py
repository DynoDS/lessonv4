from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
ROUTE_FILES = sorted((ROOT / "references").glob("teaching-sequence-*.md"))


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ChildFacingRuleIsATestNotAListTests(unittest.TestCase):
    """One fault caused three of the four failures found on 31 Aug 2026.

    The rule stated the right test - "the test is where the words END UP,
    never what the field is called" - and then spent three hundred words
    enumerating about twelve fields, so the list became the working scope.
    Every field off it was ungoverned: a vocabulary `definition`
    (`A portable source of electrical energy for a device`), a
    `successCriteria` step (`Explain the job electricity powers`), and
    `answer.structure` values printed to a class
    (`A rechargeable battery charged from the mains`).

    The list could never have been complete, because most `content` fields
    are defined per route in the five teaching-sequence files rather than in
    the agent that carries the rule. So the repair inverts it: the test
    leads, the non-child-facing set is what gets enumerated because it is
    small and stable, and unknown fields default to child-facing.
    """

    def test_the_rule_leads_with_the_test_not_the_list(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "the test is where the words END UP, never what the field is "
            "called",
            designer,
        )
        self.assertIn(
            "Apply the test; do not look the field up on a list", designer
        )

    def test_an_unknown_field_defaults_to_child_facing(self) -> None:
        """The safe default is the whole point: a new field invented next
        year is governed without anyone editing this rule."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "When you cannot tell, treat it as child-facing", designer
        )

    def test_the_enumerated_set_is_the_internal_one(self) -> None:
        """Enumerating the child-facing set is what rotted; the internal set
        is short and changes rarely."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "The set that is NOT child-facing is the short and stable one",
            designer,
        )
        for internal in (
            "`speakerNotes.teacherInfo` and `lookFor`",
            "`answer.acceptanceCondition`",
            "`slideDesignNotes`, `flagsForTeacher`",
        ):
            with self.subTest(field=internal):
                self.assertIn(internal, designer)

    def test_the_surfaces_the_old_list_missed_are_now_covered(self) -> None:
        """The three real casualties sat outside a source unit's content."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "the top-level `vocabulary` definitions, `successCriteria` steps, "
            "`stickyKnowledge` text and `displayedLo`",
            designer,
        )

    def test_the_rule_names_why_a_list_here_cannot_be_complete(self) -> None:
        """Route-defined content fields are the structural reason."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "defined in your teaching-sequence file rather than here", designer
        )
        self.assertIn(
            "a list kept in this file could never be complete", designer
        )

    def test_every_route_content_field_is_reachable_by_the_rule(self) -> None:
        """Guard against the enumeration creeping back: each route file's
        child-facing content fields must either be named in the rule or be
        covered by it as a source unit's `content`.

        This asserts the rule keeps the blanket clause, because that clause
        is what covers the fields no list mentions.
        """
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "a source unit's `content`, `taskStructure` and `answer`, every "
            "worksheet block",
            designer,
        )
        # And the route files really do define content fields of their own,
        # which is the premise the rule rests on.
        route_fields: set[str] = set()
        for path in ROUTE_FILES:
            route_fields.update(
                re.findall(r'^\s+"([a-zA-Z]+)":', path.read_text(encoding="utf-8"), re.M)
            )
        for expected in ("headline", "keyQuestions", "discussionQuestion"):
            with self.subTest(field=expected):
                self.assertIn(expected, route_fields)


if __name__ == "__main__":
    unittest.main()
