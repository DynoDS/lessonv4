"""One thing to look at, staged teaching, and a reference that recedes.

A Year 4 History deck (3 September 2026) was correct in almost every rule and
still read as a textbook page. The teacher's report: nearly every area of nearly
every slide carried something to read, there was often no obvious place for
children's eyes to go while he explained, and the repeated success-criteria
panel could be as visually important as the new source comparison it served.

Four separate mechanisms produced that, and each is guarded here.

1. The hierarchy rules set one thing above another, two at a time, and never
   limited how many things compete at all. A slide with nine text objects
   satisfied every one of them.
2. Success criteria were referenced on three source units and printed on six
   slides, because one rule said a continuation repeats the full criteria while
   another said repeated reference material recedes. The imperative won.
3. Splits were triggered by overflow only, so a unit that establishes a thing
   and then asks something arrived as one complete information page, and when
   it did split it split at the page boundary: three explanation sentences and
   a timeline on one slide, the portrait they describe on the next.
4. Nothing connected a beat's kind to how its slide looks, so teacher input and
   independent work arrived as similarly dense cards.

The failure mode to design out is the opposite one, and it is the reason this
file exists rather than a word-count check: the cure for a crowded board is not
a picture and `What do you notice?` with the teaching moved into speaker notes.

Run:
  python3 -m pytest scripts/tests/test_attention_and_teaching_rhythm.py
"""
from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLAYBOOK = (ROOT / "references" / "slide-composition-playbook.md").read_text(
    encoding="utf-8"
)
PREFERENCES = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")


def flat(text: str) -> str:
    return " ".join(text.split())


FLAT_PLAYBOOK = flat(PLAYBOOK)


class OneThingToLookAt(unittest.TestCase):
    def test_the_rule_asks_the_question_a_teacher_actually_has(self) -> None:
        self.assertIn(
            "Ask what children are looking at while you say this.", FLAT_PLAYBOOK
        )
        self.assertIn("There should be one obvious answer", FLAT_PLAYBOOK)

    def test_it_says_why_the_existing_hierarchy_rules_were_not_enough(self) -> None:
        """Without this, the rule reads as a restatement and gets skipped."""
        self.assertIn(
            "They do not limit how many things are on the slide at all",
            FLAT_PLAYBOOK,
        )

    def test_the_cure_that_is_worse_is_named_as_a_failure(self) -> None:
        """The anti-goal, held here so a later density fix cannot reach for it.

        The teacher has had the opposite fault already and asked for it not to
        return: vague slides with the real explanation hidden in the notes.
        """
        self.assertIn("a picture and `What do you notice?`", FLAT_PLAYBOOK)
        self.assertIn(
            "The target is not less teaching on the board. It is less arriving "
            "at once.",
            FLAT_PLAYBOOK,
        )
        self.assertIn(
            "neither of them is a slide carrying nothing", FLAT_PLAYBOOK
        )

    def test_the_repair_is_staging_rather_than_deletion(self) -> None:
        self.assertIn(
            "The repair is almost always staging rather than deletion",
            FLAT_PLAYBOOK,
        )
        # Slide 4's exact fault: the object sat on the slide after its sentences.
        self.assertIn(
            "the object it is about goes on the slide with the sentence that "
            "teaches it, not the one after",
            FLAT_PLAYBOOK,
        )

    def test_the_owning_rule_on_form_over_relocation_still_stands(self) -> None:
        """This rule only works beside its counterweight, which lives in
        Slide Philosophy and the slide designer reads at startup."""
        self.assertIn(
            "the resolution is form, not relocation", flat(PREFERENCES)
        )
        self.assertIn(
            "The failure to design out is the text-only Teach slide",
            flat(PREFERENCES),
        )


class SuccessCriteriaRecede(unittest.TestCase):
    def test_the_imperative_that_multiplied_the_panel_is_gone(self) -> None:
        """It read: repeat the full exact criteria on every continuation slide,
        and its appearance on the first is not a reason to compact it later.
        Three referenced units became six panels."""
        self.assertNotIn(
            "repeat the full exact criteria on each one", FLAT_PLAYBOOK
        )
        self.assertNotIn(
            "is not a reason to remove or compact it later", FLAT_PLAYBOOK
        )

    def test_criteria_now_follow_the_same_rule_as_any_shared_reference(self) -> None:
        self.assertIn(
            "Success criteria follow the same rule as any other shared reference",
            FLAT_PLAYBOOK,
        )
        self.assertIn(
            "Put them on the slides where children are actually working to them",
            FLAT_PLAYBOOK,
        )
        self.assertIn("they take a receded share", FLAT_PLAYBOOK)

    def test_completeness_is_still_protected(self) -> None:
        """Receding is position and proportion, never truncation. Removing the
        old rule must not license shortening the criteria instead."""
        self.assertIn("they stay complete and exact", FLAT_PLAYBOOK)
        self.assertIn(
            "never a reason to shorten or compact them", FLAT_PLAYBOOK
        )
        self.assertIn(
            "Receding is position and proportion, never truncation",
            FLAT_PLAYBOOK,
        )

    def test_the_sideways_version_of_the_fault_is_named(self) -> None:
        """The panel was moved into the photograph row and took a third of it,
        which the old rule's own advice ('place it beside the task') produced."""
        self.assertIn("keep it the smallest column in that row", FLAT_PLAYBOOK)
        self.assertIn(
            "giving it a third of a row beside two photographs children must "
            "inspect does the same thing sideways",
            FLAT_PLAYBOOK,
        )

    def test_the_recede_principle_it_now_defers_to_still_exists(self) -> None:
        self.assertIn(
            "**Repeated reference material recedes; the current move leads.**",
            FLAT_PLAYBOOK,
        )


class SplitAtTheTeachingJoin(unittest.TestCase):
    def test_a_split_is_conditional_on_teaching_and_readability(self):
        self.assertIn("Establishing and asking can share a slide", FLAT_PLAYBOOK)
        self.assertIn("distinct teaching moments", FLAT_PLAYBOOK)
        self.assertIn("try the available width", FLAT_PLAYBOOK)

    def test_evidence_and_teaching_survive_the_split(self):
        self.assertIn("Preserve all required content across the sequence", FLAT_PLAYBOOK)
        self.assertIn("retains the evidence and support that action still needs", FLAT_PLAYBOOK)
        self.assertIn("Match necessary speaker notes to each physical teaching slide", FLAT_PLAYBOOK)


class ADoLooksDifferentFromATeach(unittest.TestCase):
    def test_the_rule_exists_and_says_what_carries_the_difference(self) -> None:
        self.assertIn(
            "A slide where children now do something should not look like a "
            "slide where the teacher was explaining.",
            FLAT_PLAYBOOK,
        )
        self.assertIn(
            "What carries that is what leads the slide and how much of it that "
            "thing takes",
            FLAT_PLAYBOOK,
        )

    def test_it_is_composition_and_explicitly_not_furniture(self) -> None:
        """The teacher ruled this out by name: no progress strip, no
        teacher-facing navigation, nothing explaining the lesson's structure
        back to him. The board helps him teach; it does not narrate itself."""
        self.assertIn("it is not made with badges, banners, a progress strip", FLAT_PLAYBOOK)
        self.assertIn(
            "adding a label is how a deck ends up explaining its own structure "
            "to the teacher instead of showing it",
            FLAT_PLAYBOOK,
        )


if __name__ == "__main__":
    unittest.main()
