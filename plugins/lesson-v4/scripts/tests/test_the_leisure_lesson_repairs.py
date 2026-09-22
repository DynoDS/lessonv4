"""The five faults a teacher found in one Year 4 history lesson, and the repairs.

On 22 September 2026 a newly qualified teacher was given "How did children's
leisure time change?" (built in Codex on 4.2.276) and could not see what to do
with it, and the teacher who plans these lessons read it slide by slide:

1. it talked as if children already knew Elizabeth I, a government, an order,
   a "modern summary", the Thames and a steam engine;
2. no slide said why it was there;
3. the Do slides were "pick the sentence I just said";
4. the written explanation came with no model and no practice;
5. it was pitched at Year 9: what a government order does and does not prove.

The investigation found most of the guidance already written and not arriving
(Codex cut the middle out of every long role file), or cancelled by an escape
hatch, or pushing the other way. These tests pin the repairs by the property
each one guards, so a later tidy-up cannot quietly remove them: the reader
pages, the validator shows a model before an explanation task, the reviewer
gets a list of names and each Do beside its Teach, and the rules that pushed
toward the faults say the opposite now.
"""
from __future__ import annotations

import copy
import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TESTS = Path(__file__).resolve().parent
REF = ROOT / "references"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


validator = load("leisure_repairs_validator", ROOT / "scripts" / "validate-lesson-design.py")
packet = load("leisure_repairs_packet", ROOT / "scripts" / "design-review-packet.py")
contract = load("leisure_repairs_contract", TESTS / "test_lesson_design_contract.py")


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def leisure_explanation_task():
    """The fixture reshaped into the leisure lesson's ending: an explanation Do
    whose model stays with the teacher, then a written comparison with no
    launch."""
    design, photos = contract.valid_content_contract()
    practise = next(u for u in design["teachingSequence"] if u["kind"] == "practise")
    practise["content"]["launch"] = None
    practise["content"]["format"] = "written-explanation"
    practise["content"]["task"] = "Explain how these examples show change and continuity in children's games."
    do = next(u for u in design["teachingSequence"] if u["kind"] == "do")
    do["answer"]["delivery"] = "teacher-only"
    return design, photos, practise, do


class AnExplanationIsShownBeforeItIsAskedFor(unittest.TestCase):
    def test_the_leisure_shape_is_refused(self) -> None:
        design, photos, _, _ = leisure_explanation_task()
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_design(design, photos)
        self.assertIn("nothing earlier in the lesson has shown the class a good one", str(refused.exception))

    def test_a_launch_with_a_good_one_beside_a_weak_one_passes(self) -> None:
        design, photos, practise, _ = leisure_explanation_task()
        practise["content"]["launch"] = {
            "established": None,
            "goodLooksLike": {
                "strong": {"words": "Victorian rides were turned by steam and today's by electric motors, but children still ride round together for fun.", "show": None},
                "weak": {"words": "Fairs are different now.", "show": None},
                "difference": "The strong one names what changed and what stayed.",
            },
            "steps": [],
        }
        validator.validate_design(design, photos)

    def test_an_earlier_model_the_class_sees_passes(self) -> None:
        design, photos, _, do = leisure_explanation_task()
        do["answer"]["delivery"] = "answer-slide"
        validator.validate_design(design, photos)

    def test_the_task_s_own_answer_slide_does_not_count(self) -> None:
        # It comes after the writing, so it models nothing for it.
        design, photos, practise, _ = leisure_explanation_task()
        self.assertEqual(practise["answer"]["delivery"], "answer-slide")
        with self.assertRaises(validator.ContractError):
            validator.validate_design(design, photos)

    def test_a_practice_that_is_not_an_explanation_is_left_alone(self) -> None:
        design, photos, practise, _ = leisure_explanation_task()
        practise["content"]["reasoningWords"] = None
        practise["content"]["rehearsal"] = None
        practise["content"]["format"] = "short-answer questions"
        practise["content"]["task"] = "Answer the three questions about the road."
        validator.validate_design(design, photos)

    def test_a_skill_lesson_is_left_alone(self) -> None:
        # My Turn and Our Turn model the move in every skill lesson.
        sequence = [
            {"kind": "practise", "content": {"format": "written-explanation", "reasoningWords": ["because"], "launch": None}},
        ]
        validator.validate_explanation_task_is_modelled("Skill-based", sequence)


class TheReviewerSeesTheNamesAndEachDoBesideItsTeach(unittest.TestCase):
    def test_names_a_year_4_child_would_need_explaining_are_listed(self) -> None:
        text = (
            "Order from Elizabeth I's government, 1590 (modern summary): Plays were to stop on Sundays and Thursdays. "
            "Tudor winter crowds enjoyed games on the frozen Thames. English Heritage summary. NSPCC summary."
        )
        names = packet.board_names_in(text)
        for expected in ("Elizabeth I", "Thames", "English Heritage", "NSPCC"):
            self.assertIn(expected, names)
        self.assertNotIn("Sundays and Thursdays", names)
        self.assertNotIn("Order", names)

    def test_sentence_openers_labels_and_numerals_are_not_names(self) -> None:
        text = (
            "Every Tudor child stopped watching plays. Use the rides to explain. (a) Listen to each other. "
            "Children's lives | Play and learning. Label A and B. Write XLIV in numbers."
        )
        self.assertEqual(packet.board_names_in(text), ["Tudor"])

    def test_the_view_carries_both_sections_after_the_teaching_sequence(self) -> None:
        design, photos = contract.valid_content_contract()
        view = packet.build_review_view(design, photos)
        self.assertLess(view.index("## Teaching sequence"), view.index("## Names on the board"))
        self.assertIn("## Each Do beside the teaching before it", view)
        self.assertIn("Words of the expected answer the Teach's board or script already said", view)

    def test_the_reviewer_is_told_what_to_do_with_them(self) -> None:
        text = flat(ROOT / "agents" / "design-reviewer.md")
        self.assertIn("Then read the view's `Names on the board`", text)
        self.assertIn("A name nothing explains is a finding on User-fit", text)
        self.assertIn("The view's `Each Do beside the teaching before it`", text)


class TheRulesThatPushedTowardTheFaultsNowSayTheOpposite(unittest.TestCase):
    def test_history_thinking_is_about_the_people_not_source_limits(self) -> None:
        designer = flat(ROOT / "agents" / "lesson-designer.md")
        self.assertIn("what it shows about the people, and why they acted as they did, is the thought", designer)
        self.assertNotIn("what it can and cannot tell us is the thought", designer)
        self.assertNotIn("its thinking (what the source can and cannot tell us)", flat(ROOT / "agents" / "design-reviewer.md"))

    def test_the_sketch_caution_serves_the_lesson_and_never_becomes_it(self) -> None:
        history = flat(REF / "subject-history.md")
        self.assertIn("It serves the lesson's own question (has school changed?) and never becomes it", history)
        self.assertNotIn("The idea the lesson is built to land", history)

    def test_a_source_that_costs_more_explaining_than_it_teaches_is_replaced(self) -> None:
        history = flat(REF / "subject-history.md")
        self.assertIn("When the first list is the longer, choose a clearer source or tell the knowledge plainly", history)
        designer = flat(ROOT / "agents" / "lesson-designer.md")
        self.assertIn("A source, story or clip the plan names is part of its activity, not its coverage", designer)

    def test_names_and_source_labels_are_in_words_a_child_has(self) -> None:
        history = flat(REF / "subject-history.md")
        self.assertIn("Identify sources honestly, in words the class already has", history)
        self.assertIn("In the teaching means explained where each first appears on the board", history)

    def test_the_reviewer_can_take_a_detour_out_instead_of_promoting_it(self) -> None:
        reviewer = flat(ROOT / "agents" / "design-reviewer.md")
        self.assertIn("The repair has two directions, and you choose before you write it", reviewer)
        self.assertIn("the repair takes it out of the script and the lesson rather than promoting it to the board", reviewer)

    def test_the_which_claim_format_is_not_a_restatement_pick(self) -> None:
        do_beats = flat(REF / "do-beats.md")
        self.assertIn("choosing it is finding, not weighing", do_beats)
        self.assertIn("never the `every` and `nothing` extremes a child rejects on sight", do_beats)

    def test_a_teach_slide_is_not_excused_as_a_modelling_slide(self) -> None:
        preferences = flat(REF / "preferences.md")
        self.assertNotIn("not as a page that must teach an absent teacher's whole explanation", preferences)
        self.assertIn("That is a rule about modelling. A Teach slide is judged the other way", preferences)

    def test_a_headline_that_is_the_sticky_fact_is_not_referenced_again(self) -> None:
        # The route and the output template used to tell the designer to do the
        # one thing the once-rule refuses (4.2.223 against 4.2.277).
        for path in (REF / "teaching-sequence-content-based.md", REF / "output-template.md"):
            text = flat(path)
            self.assertNotIn("records the fact as usual", text, path.name)
            self.assertNotIn("still records the fact", text, path.name)
            self.assertIn("out of its own `stickyKnowledgeRefs`", text, path.name)


class EveryLongRoleIsReadInPages(unittest.TestCase):
    def test_each_role_longer_than_a_page_says_how_to_read_it(self) -> None:
        reader = load("leisure_repairs_reader", ROOT / "scripts" / "read-reference.py")
        for role in sorted((ROOT / "agents").glob("*.md")):
            text = role.read_text(encoding="utf-8")
            if len(reader.pages(text)) == 1:
                continue
            with self.subTest(role=role.stem):
                head = text[: text.index("\n", text.index("# ")) + 2000]
                self.assertIn(f"--role {role.stem} --page 1", head)


if __name__ == "__main__":
    unittest.main()
