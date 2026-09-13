"""Seven repairs from one reviewed lesson: Y4 Science, build and draw a
series circuit, 1 Sep 2026.

The run exposed a defanged bounded attempt (the starter showed the working
circuit and the vocabulary taught complete/incomplete before `Can you make
the lamp light?`), success criteria that taught the model's arbitrary
connection order as if it were the invariant, 12-14 word steps, `series`
never taught despite the LO naming it, `battery` simultaneously deferred in
trimmedVocabulary and taught in the cell definition, `output component`
reaching child-facing text, and children told not to use circuit symbols
they had never met. Each repair lives at the owning file; the step-length
cap lives in the validator, where a limit belongs.
"""
from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DESIGNER = ROOT / "agents" / "lesson-designer.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"
SKILL_ROUTE = ROOT / "references" / "teaching-sequence-skill-based.md"
SCIENCE = ROOT / "references" / "subject-science.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class BoundedAttemptStaysGenuineTests(unittest.TestCase):
    def test_the_spoiler_audit_exists_where_the_attempt_is_chosen(self):
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "A bounded attempt only works while the answer is still the "
            "child's to find.",
            route,
        )
        self.assertIn("the starter, the vocabulary cards", route)
        self.assertIn("copying from the board", route)
        # The reviewer's authority over it is named, so the check fires twice.
        self.assertIn("purposeful design defect, not polish", route)


class StepsTeachTheInvariantTests(unittest.TestCase):
    def test_the_artefact_order_rule_exists_with_its_limit(self):
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "Steps encode the decision rule, never an artefact of the worked "
            "example.",
            route,
        )
        self.assertIn(
            "would a different-but-correct performance fail it?", route
        )
        # The limit: order stays when order IS the procedure.
        self.assertIn("the order IS the procedure being taught", route)

    def test_wordy_steps_remain_a_review_concern_not_a_numeric_ban(self):
        route = flat(SKILL_ROUTE)
        self.assertIn("which is not a rejection and not a request to shorten", route)
        self.assertIn("There is no word or step target", route)
        self.assertIn("Do not compress two distinct actions", route)
        # Both directions are named, so trimming wordy steps cannot become
        # compressing clear ones (September 2026 rewrites).
        self.assertIn("*Too short to run.*", route)
        self.assertIn("*Too long to use.*", route)


class TheObjectivesOwnTermIsTaughtTests(unittest.TestCase):
    def test_the_vocabulary_rule_exists_with_its_exception(self):
        designer = flat(DESIGNER)
        self.assertIn(
            "A technical term the approved objective itself names is "
            "learning-critical by definition:",
            designer,
        )
        self.assertIn("never left living only in planning metadata", designer)
        self.assertIn(
            "a term the teacher's own sequence explicitly defers", designer
        )


class DeferredMeansDeferredTests(unittest.TestCase):
    def test_the_reviewer_sweeps_trimmed_vocabulary_against_the_lesson(self):
        reviewer = flat(REVIEWER)
        self.assertIn("`trimmedVocabulary` against the lesson", reviewer)
        self.assertIn("must not be taught, defined or policed anywhere", reviewer)


class EquipmentObeysTheRuleTests(unittest.TestCase):
    def test_the_science_file_owns_the_falsifying_equipment_rule(self):
        science = flat(SCIENCE)
        self.assertIn(
            "Equipment must not be able to falsify the rule being taught.",
            science,
        )
        self.assertIn("polarity-sensitive buzzer", science)
        self.assertIn(
            "stays out of the moment where the rule itself is being proven",
            science,
        )


class ChildrenGetThePositiveFormTests(unittest.TestCase):
    def test_untaught_prohibitions_are_teacher_facing(self):
        designer = flat(DESIGNER)
        self.assertIn(
            "Tell children what to do, never what not to do with something "
            "they have never met.",
            designer,
        )
        self.assertIn("draw each component as a simple picture", designer)
        # The limit: a prohibition can face children when they might really
        # reach for the thing.
        self.assertIn(
            "children already know and might actually reach for", designer
        )

    def test_category_abstractions_join_the_planning_word_tell(self):
        designer = flat(DESIGNER)
        self.assertIn("output components", designer)
        self.assertIn("we can use a lamp or a buzzer", designer)


if __name__ == "__main__":
    unittest.main()
