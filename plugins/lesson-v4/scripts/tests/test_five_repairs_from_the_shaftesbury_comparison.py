"""Five repairs from comparing the plugin's Shaftesbury lesson with an outside AI's.

Daniel gave the same objective (To evaluate Lord Shaftesbury's significance to
children's lives) to the plugin and to an assistant knowing only his voice
guide, and read the two side by side (11 September 2026). The plugin's lesson
was the better lesson: every child commits four times, the criteria are
modelled then guided then independent, the complication is discovered rather
than told, and it fits the time. Five things the other lesson had, or had
better, each traced to its owner here.

Three were rules that existed and were missed, which is why each repair gives
the rule a method rather than a second warning:

1. Significance collapsed into impact. `subject-history.md` already warned
   about exactly this slip, in one clause, with no method attached, while
   change and continuity beside it had a full one. The lesson's criteria were
   "how many children, what changed, how do you know", which is impact three
   times, and the memorial fountain (the one piece of ascribed significance
   in the room) was spent as a vocabulary hook.
2. The character distinction never reached the children. The designer
   correctly refused "was he a good man" in its planning, but a rule about
   what a lesson asks is not a rule about what the class is told, and
   children reach for character anyway.
3. The ending was refused as "the same question at the same demand", which is
   true of asking it again and false of turning it round. Both the Apply
   rules framed the judgement as synthesis; transfer was in the examples and
   not in the test.

Two were genuine gaps:

4. Nothing said that a structure legible to a planner can be harder for a
   child than one that follows causes and people.
5. The support rules price only oversupport. Nothing asked whether the
   weakest child can start, and the lesson's pivot beat was a blank line.
"""
from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
HISTORY = ROOT / "references" / "subject-history.md"
PREFERENCES = ROOT / "references" / "preferences.md"
DESIGNER = ROOT / "agents" / "lesson-designer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class SignificanceAtPrimaryIsTheStory(unittest.TestCase):
    """The 4.2.139 method (criteria, a second case, a what-if ending) was retired on 27 September
    2026: with Year 4 it produced John Pounds from nowhere and a KS3 ending."""

    def test_significance_is_a_difference_and_remembering(self) -> None:
        history = flat(HISTORY)
        self.assertIn("Significance, at primary, is two plain things", history)
        self.assertIn("they made a big difference to a lot of people's lives, and people still remember them for it", history)

    def test_the_secondary_school_moves_are_named_and_refused(self) -> None:
        history = flat(HISTORY)
        self.assertIn("a set of criteria taught as a tool", history)
        self.assertIn("a second person brought in to compare", history)
        self.assertIn("what would have happened if they had never lived", history)
        self.assertNotIn("a lesson missing the third is teaching impact", history)

    def test_the_limit_keeps_a_named_comparison(self) -> None:
        history = flat(HISTORY)
        self.assertIn("names two people, or asks children to compare, gets its comparison", history)


class TheCharacterDistinctionReachesTheClass(unittest.TestCase):
    def test_the_rule_is_about_what_the_class_is_told(self) -> None:
        history = flat(HISTORY)
        self.assertIn("Where the lesson judges a person, the class is told what is being judged", history)
        self.assertIn("Designing the character question out is not the same as ruling it out in the room", history)
        # The words, so it is not left as an intention.
        self.assertIn("We're not asking whether he was a nice man", history)
        # It reaches past significance lessons.
        self.assertIn("wherever a real person is weighed, praised or blamed", history)

    def test_the_existing_today_question_rule_survives(self) -> None:
        history = flat(HISTORY)
        self.assertIn(
            "the today question is allowed when it asks why things changed, and not allowed when it asks whether people in the past were right",
            history,
        )


class AnEndingMayTransferNotOnlySynthesise(unittest.TestCase):
    def test_the_preference_names_transfer_as_a_second_kind(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("Synthesis is not the only thing an ending can be", preferences)
        self.assertIn("Judge what further thinking the ending would add", preferences)
        # The existing synthesis test is not removed, only bounded.
        self.assertIn("where the Your Turn and its answers already are the synthesis moment", preferences)

    def test_the_designer_holds_the_two_shapes(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("that is where the Apply comes from", designer)
        self.assertIn("the idea on an accessible case the lesson never showed", designer)
        # The turned-round what-if was retired on 27 September 2026.
        self.assertIn("A \"what if it had never happened?\" question is not this shape at primary", designer)
        self.assertNotIn("Would children's lives still have changed?", designer)


class OrderTheLessonTheWayAChildFollowsIt(unittest.TestCase):
    def test_the_preference_names_the_planner_child_split(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("Order the lesson the way a child follows it, not the way it files neatly", preferences)
        self.assertIn("a child never sees the plan", preferences)
        self.assertIn("Children follow people and causes", preferences)

    def test_it_has_two_tells_and_a_limit(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("an abstract tool taught before any case needs it", preferences)
        self.assertIn("could swap places with its neighbour", preferences)
        # Not an argument for withholding a needed tool.
        self.assertIn("this is not an argument for withholding a tool", preferences)


class EveryChildCanStart(unittest.TestCase):
    def test_the_support_section_prices_both_failures(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("Then check the other end: can every child start?", preferences)
        self.assertIn("what the weakest child in this class puts on the page in the first thirty seconds", preferences)
        self.assertIn("Run it hardest on the beat the lesson turns on", preferences)

    def test_the_ways_in_do_not_supply_the_thought(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("a way in that is not the answer", preferences)
        self.assertIn("a stem that contains the thought is the fault this section spends its length on", preferences)

    def test_the_oversupport_rules_are_not_weakened(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn(
            "Keep support when it enables the intended thinking; remove or reduce it when it supplies that thinking or the answer",
            preferences,
        )
        self.assertIn("Independent work means the child does the thinking", preferences)


if __name__ == "__main__":
    unittest.main()
