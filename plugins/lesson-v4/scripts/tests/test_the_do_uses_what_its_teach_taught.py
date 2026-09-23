"""A Do beat practises the move its own Teach taught, not a neighbouring one.

A Year 4 History lesson (2 September 2026, engine 4.2.72) on continuity and
change in children's lives ran two strong Teach->Do pairs and then broke.

The third Teach was headed `Which source helps with our question?`, and its
explanation defined a primary source, defined a secondary source, and said a
later explanation can help interpret an old picture. The Do that followed asked
whether Edward's portrait can tell us what Edward wore, and whether it can tell
us what all Tudor children wore: a genuine, committed, whole-class task about
the scope of what one source proves. Primary and secondary were taught and used
by nobody. Scope was used and taught by nobody.

Every existing check passed it. `Questioning is not doing` asks whether the beat
is a use at all, and this one was; the reviewer's Do-beat bullet asks the same
question in the same words; the reviewer's routing card only opened the rhythm
section for two teacher-presented beats in a row or a homeless second job. The
whole system was checking whether children were active, and none of it was
checking whether they were active on the thing just taught.

The teacher's report: the lesson loses itself, another history lesson enters the
room, and the task afterwards does not practise what was just taught.

Two further faults came from the same beat. Its heading named one move while its
explanation taught two others, and nothing read the two fields against each
other, so a block could carry three ideas while every field looked right alone.
And the load that grew out of that (source, observation, deduction, continuity,
change, primary, secondary, and what one source cannot prove, in forty-five
minutes) passed the vocabulary cap only because terms had been paired onto
cards, while `How Much Fits in One Lesson` covered only the
knowledge-plus-product kind of overload.

preferences.md now owns the pairing test as its own rule beside
`Questioning is not doing`, states that heading, teaching and following Do must
name one move between them, and names too many new abstractions as the second
way a lesson is too big. The designer, the reviewer, the content-based route and
the reviewer's routing card all carry it.
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
CONTENT_BASED = ROOT / "references" / "teaching-sequence-content-based.md"

sys.path.insert(0, str(SCRIPTS / "tests"))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


packet = load("design_review_packet_pairing", "design-review-packet.py")

RULE = "The Do uses the idea its own Teach just taught"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class PreferencesOwnsThePairingTestTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(PREFERENCES)

    def test_the_pairing_test_is_its_own_rule_not_a_clause_inside_questioning(self) -> None:
        self.assertIn("**" + RULE + ".**", self.text)
        questioning = self.text.index("**Questioning is not doing.**")
        pairing = self.text.index("**" + RULE + ".**")
        self.assertGreater(pairing, questioning)

    def test_it_distinguishes_a_use_at_all_from_a_use_of_this(self) -> None:
        self.assertIn("asks whether the beat is a use at all", self.text)
        self.assertIn("asks whether it is a use of *this*", self.text)

    def test_it_gives_the_designer_something_to_run_not_only_a_warning(self) -> None:
        self.assertIn(
            "if a child who slept through this Teach and woke for the one before could still do it",
            self.text,
        )

    def test_it_names_the_boundary_so_carrying_learning_forward_stays_legal(self) -> None:
        self.assertIn("a Do may and often should carry earlier learning forward", self.text)
        self.assertIn("uses only the earlier idea", self.text)

    def test_the_contents_index_points_at_the_pairing_test(self) -> None:
        self.assertIn(
            "the pairing test that each Do uses the idea its own Teach taught",
            self.text,
        )


class OneMoveAcrossHeadingTeachingAndDoTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(PREFERENCES)

    def test_the_one_concept_rule_reads_three_surfaces_not_one_field(self) -> None:
        self.assertIn("Three surfaces have to agree about what the one thing is", self.text)
        self.assertIn(
            "the idea the block names, the teaching written underneath it, "
            "and what children do straight after",
            self.text,
        )

    def test_it_carries_the_case_where_every_field_looked_right_alone(self) -> None:
        self.assertIn("has named one move and taught two others", self.text)
        self.assertIn("Read the three back to back before you move on", self.text)


class ConceptualLoadIsASecondKindOfOverloadTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(PREFERENCES)

    def test_how_much_fits_covers_too_many_ideas_not_only_knowledge_plus_product(self) -> None:
        self.assertIn(
            "**A lesson is also too big when it teaches too many new ideas",
            self.text,
        )

    def test_it_gives_the_measure_rather_than_a_countable_cap(self) -> None:
        self.assertIn(
            "it is how many new abstractions a child holds at once "
            "while also holding the content",
            self.text,
        )
        self.assertIn("what one move this lesson makes children better at", self.text)

    def test_it_closes_the_paired_card_route_round_the_vocabulary_cap(self) -> None:
        self.assertIn(
            "only stays inside five cards because terms have been paired onto them",
            self.text,
        )

    def test_the_contents_index_points_at_the_second_kind_of_overload(self) -> None:
        self.assertIn("when a lesson is carrying too many new ideas", self.text)


class TheRuleReachesEveryAgentThatCouldBreakItTests(unittest.TestCase):
    def test_the_designer_carries_the_pairing_test_beside_questioning_is_not_doing(self) -> None:
        # The designer's worked copy folded into the one home in 4.2.285; its
        # pointer names both rules together and keeps the read-back.
        text = flat(LESSON_DESIGNER)
        self.assertIn(
            "questioning is not doing, and the Do uses the idea its own Teach just taught",
            text,
        )
        self.assertIn(
            "heading, explanation and following Do name one move between them",
            text,
        )

    def test_the_designer_serves_a_broad_objective_rather_than_flagging_it_away(self) -> None:
        # The rule this replaces let a lesson teach one strand, keep the
        # objective's wording and note the narrowing in the flags. Daniel's
        # answer (5 September 2026): the objective says what children must be
        # able to do by the end, and preserving its words while teaching a
        # corner of it does not satisfy it.
        text = flat(LESSON_DESIGNER)
        self.assertIn("Teach the objective's meaning, not only its words", text)
        # The test is the end performance, not the coverage plan.
        self.assertIn("what does a child who does it well now know and demonstrate", text)
        # And it is not answered by sampling every strand.
        self.assertIn("Breadth-by-checklist is the failure at this end", text)
        self.assertIn("one well-chosen case can carry a whole objective", text.lower())
        # A genuinely impossible brief is reported as a conflict, not resolved
        # silently into a different lesson.
        self.assertIn("Never quietly teach a different objective and report success", text)
        self.assertIn("never edit the objective to match the lesson", text)

    def test_the_reviewer_can_call_it_a_defect_rather_than_polish(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("it is the idea *this* Teach taught rather than a neighbouring one", text)
        self.assertIn("the move that was taught is used by nobody", text)
        self.assertIn("purposeful design defect rather than polish", text)
        self.assertIn("`" + RULE + "`", text)

    def test_the_content_based_route_matches_substance_before_form(self) -> None:
        text = flat(CONTENT_BASED)
        substance = text.index("Match the substance before the form")
        form = text.index("Then match the form to what was just taught")
        self.assertLess(substance, form)
        self.assertIn("`" + RULE + "`", text)

    def test_the_reviewer_reads_the_rhythm_for_a_mismatched_pair_every_review(self) -> None:
        # Since 4.2.285 the section is read every review rather than on a
        # trigger the reviewer could only meet after finding the fault.
        always = {heading: note for _name, heading, note in packet.ALWAYS_READ_REVIEW_SECTIONS}
        note = " ".join(always["The Teach → Do → Teach → Do Rhythm"].split())
        self.assertIn("the pairing test", note)
        self.assertNotIn("The Teach → Do → Teach → Do Rhythm", dict(packet.PREFERENCE_REVIEW_ROUTES))


if __name__ == "__main__":
    unittest.main()
