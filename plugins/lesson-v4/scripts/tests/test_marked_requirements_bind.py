from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
MAKE_LESSON = ROOT / "skills" / "make-lesson" / "SKILL.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class MarkedRequirementsBindTests(unittest.TestCase):
    """Briefs were being covered rather than judged, and the cause was two
    unreliable signals for what binds.

    The teacher reported (31 Aug 2026) that every lesson tried to use
    everything he supplied. Two real briefs showed why. A Y4 Science
    appliances brief offered three approaches as "possible approaches you
    could take" and six vocabulary words as "key vocab could be"; a Y4
    circuits brief supplied a scheme's JSON with six activities, five sticky
    facts and nine vocabulary words under keys reading "Core Knowledge" and
    "Possible Activities". Bindingness was decided by channel ("what the
    teacher asked for in their own message") and by directive wording, so
    hedged suggestions typed in his own message read as requirements, while
    a printed plan's ordinary imperative voice ("Use this", "Tell the
    children") read as a demand. The completion trace then required every
    brief item to land or be flagged, which made covering the brief cheaper
    than designing the lesson.

    The repair: bindingness is marked by the teacher, never inferred from
    grammar.
    """

    def test_binding_is_marked_not_inferred_from_grammar(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "Binding is marked by the teacher, never inferred from grammar",
            designer,
        )
        # The named channel for marking it, or the rule has no handle.
        self.assertIn("`Must include` list", designer)
        # The plan-voice case that made a scheme's house style read as a demand.
        self.assertIn("Tell the children", designer)
        self.assertIn("house style", designer)

    def test_the_old_channel_definition_is_gone(self) -> None:
        """"What the teacher asked for in their own message" made a hedged
        suggestion binding purely because he typed it himself."""
        designer = flat(LESSON_DESIGNER)
        self.assertNotIn(
            "A **direct requirement** is what the teacher asked for in their "
            "own message or clarifications",
            designer,
        )
        self.assertIn(
            "A **direct requirement** is what the teacher marked as required",
            designer,
        )

    def test_the_commission_facts_still_bind(self) -> None:
        """Judgement over suggestions must not become judgement over the
        objective, the year group or the text he supplied to teach from."""
        self.assertIn(
            "The facts of the commission bind the same way", flat(LESSON_DESIGNER)
        )

    def test_safeguarding_and_curriculum_still_outrank_a_requirement(self) -> None:
        """A Must include naming Year 6 content in a Year 4 lesson loses."""
        self.assertIn(
            "must be honoured within safeguarding, factual accuracy and the "
            "approved curriculum objective",
            flat(LESSON_DESIGNER),
        )

    def test_declining_a_suggestion_costs_no_flag(self) -> None:
        """The trace is what made "use everything" the cheap path: leaving a
        suggestion out required a written justification, using it required
        nothing."""
        designer = flat(LESSON_DESIGNER)
        self.assertNotIn(
            "Trace every part of what teacher asked for to where landed",
            designer,
        )
        self.assertIn("Trace every *marked* requirement", designer)
        self.assertIn(
            "A suggestion you judged and declined needs neither trace nor flag",
            designer,
        )
        # Coverage stays the school's call, so it keeps its flag.
        self.assertIn("coverage is the school's call", designer)

    def test_the_reviewer_does_not_push_the_brief_back_in(self) -> None:
        """The reviewer independently checked that teacher requirements were
        followed; left unchanged it would raise a finding for every declined
        suggestion and undo the repair."""
        reviewer = flat(DESIGN_REVIEWER)
        self.assertIn("is not a finding", reviewer)
        self.assertIn(
            "Judge the lesson in front of you, not its coverage of the brief",
            reviewer,
        )

    def test_the_orchestrator_may_not_invent_a_must_include(self) -> None:
        """A marker the teacher did not write would turn a suggestion he was
        happy to lose into a requirement nobody downstream can decline."""
        skill = flat(MAKE_LESSON)
        self.assertIn("never add, infer, relabel or reword one", skill)


if __name__ == "__main__":
    unittest.main()
