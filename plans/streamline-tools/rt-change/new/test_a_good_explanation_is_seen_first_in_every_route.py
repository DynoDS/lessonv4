"""Before children write an explanation, they see a good one, in every route.

The teacher's decision 2 on the routes list (24 September 2026, "y"): "One rule
everywhere: the example is skipped only when the class has seen a good one
earlier in this lesson, and the check covers big-task lessons and a skills
lesson's bigger practice task too." Asked then whether a maths My Turn should
count as the good one, he answered "Yes" to the suggestion: "A My Turn or Our
Turn counts only when it shows the kind of thing children then write." His
preferences decision 13b: "a writing task whose criteria already show a good
paragraph skips a second model". Criteria stand in only when they show an actual
good one, never a list of what a good one includes; no criteria shape holds a
written model, so the program keeps asking a written explanation for its good
instance, and the words carry 13b for the designer and the reviewer.

These tests hold the validator to all three, both sides of each, and show that
the refusal's own repair passes: a design sent back for it can always be
mended by the designer that wrote it.
"""
from __future__ import annotations

import copy
import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TESTS = Path(__file__).resolve().parent


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


validator = load("good_explanation_first_validator", ROOT / "scripts" / "validate-lesson-design.py")
contract = load("good_explanation_first_contract", TESTS / "test_lesson_design_contract.py")

PAIR = {
    "established": None,
    "goodLooksLike": {
        "strong": {"words": "3,448 is nearer 3,000, because 3,448 is less than 3,500, the halfway number.", "show": None},
        "weak": {"words": "3,448 rounds to 3,000.", "show": None},
        "difference": "The strong one says why, using the halfway number.",
    },
    "steps": [],
}


def unit(kind: str, content: dict, **fields) -> dict:
    base = {"kind": kind, "content": content, "answer": {"kind": "none", "delivery": "none"}, "successCriteriaRefs": []}
    base.update(fields)
    return base


def maths_practise(**content) -> dict:
    """The six saved maths lessons' shape: a reasoning question with no launch."""
    body = {"format": "written explanation", "reasoningWords": ["because"], "rehearsal": None, "launch": None,
            "task": "Amira says 3,448 rounds to 3,500. Is Amira right? Explain using the number line."}
    body.update(content)
    return unit("practise", body)


def rounding_turn(kind: str) -> dict:
    return unit(kind, {"example": "Round 3,462 to the nearest 1,000.", "modelledExemplar": None},
                answer={"kind": "exact", "delivery": "answer-slide"})


def refuses(structure: str, sequence: list[dict]) -> str:
    try:
        validator.validate_explanation_task_is_modelled(structure, sequence)
    except validator.ContractError as refused:
        return str(refused)
    raise AssertionError("the sequence was not refused")


class ASkillLessonsPractiseIsChecked(unittest.TestCase):
    def test_the_saved_maths_shape_is_refused(self) -> None:
        # My Turns and an Our Turn that model the rounding, then "Explain".
        message = refuses("Skill-based", [rounding_turn("my-turn"), rounding_turn("our-turn"), maths_practise()])
        self.assertIn("this Practise asks each child to write an explanation or comparison", message)
        self.assertIn("a My Turn or Our Turn counts only when its own question asks for an explanation", message)

    def test_a_launch_pair_passes(self) -> None:
        validator.validate_explanation_task_is_modelled(
            "Skill-based", [rounding_turn("my-turn"), maths_practise(launch=copy.deepcopy(PAIR))])

    def test_an_our_turn_that_explains_with_its_model_on_the_board_passes(self) -> None:
        our_turn = unit("our-turn", {"example": "Sam says 3,462 rounds to 4,000. Is Sam right? Explain."},
                        answer={"kind": "model", "delivery": "answer-slide"})
        validator.validate_explanation_task_is_modelled("Skill-based", [rounding_turn("my-turn"), our_turn, maths_practise()])

    def test_an_our_turn_that_explains_but_keeps_its_answer_in_the_notes_does_not_count(self) -> None:
        our_turn = unit("our-turn", {"example": "Sam says 3,462 rounds to 4,000. Is Sam right? Explain."},
                        answer={"kind": "model", "delivery": "teacher-only"})
        refuses("Skill-based", [our_turn, maths_practise()])

    def test_a_turn_whose_model_is_on_the_board_but_is_not_an_explanation_does_not_count(self) -> None:
        worked = unit("our-turn", {"example": "Round 3,462 to the nearest 1,000."},
                      answer={"kind": "model", "delivery": "answer-slide"})
        refuses("Skill-based", [worked, maths_practise()])

    def test_a_my_turn_that_writes_its_explanation_live_counts(self) -> None:
        my_turn = unit("my-turn", {"example": "Explain why 3,462 rounds to 3,000.",
                                   "modelledExemplar": "3,462 is less than 3,500, so it is nearer 3,000."},
                       answer={"kind": "model", "delivery": "teacher-only"})
        validator.validate_explanation_task_is_modelled("Skill-based", [my_turn, maths_practise()])

    def test_a_practise_that_is_not_an_explanation_is_left_alone(self) -> None:
        validator.validate_explanation_task_is_modelled(
            "Skill-based",
            [rounding_turn("my-turn"), maths_practise(format="mixed rounding questions", reasoningWords=None,
                                                      task="Round each number to the nearest 1,000.")])


class ATaskLessonsDoTheTaskIsChecked(unittest.TestCase):
    def explaining_task(self, **content) -> dict:
        body = {"activity": "Write a paragraph for the museum leaflet.", "launch": None,
                "reasoningWords": ["because", "so"], "rehearsal": None}
        body.update(content)
        return unit("do-task", body)

    def test_a_written_explanation_with_nothing_shown_is_refused(self) -> None:
        teach = unit("teach-needed", {"enablingInput": "A leaflet says why a visitor should come.",
                                      "explanation": None, "modelledOn": "The castle leaflet."})
        message = refuses("Task-Centred", [unit("set-task", {"question": "Why visit?"}), teach, self.explaining_task()])
        self.assertIn("this Do the task asks each child to write an explanation or comparison", message)

    def test_a_prepared_model_shown_in_the_enabling_input_passes(self) -> None:
        teach = unit("teach-needed", {"enablingInput": "A leaflet says why a visitor should come.",
                                      "explanation": None, "modelledOn": "The castle leaflet."},
                     answer={"kind": "model", "delivery": "visible-in-unit"})
        validator.validate_explanation_task_is_modelled("Task-Centred", [teach, self.explaining_task()])

    def test_a_rehearsal_alone_marks_the_task_as_an_explanation(self) -> None:
        refuses("Task-Centred", [self.explaining_task(
            reasoningWords=None, rehearsal={"sayIt": "Tell your partner why.", "partnerAsks": "Why does that matter?"})])

    def test_an_enquiry_that_compares_materials_is_not_a_written_comparison(self) -> None:
        # The task route's own fixture: "Plan the comparison, get the fairness check, then run the investigation."
        design, _photos = contract.valid_task_contract()
        validator.validate_explanation_task_is_modelled("Task-Centred", design["teachingSequence"])


class CriteriaAreNotAGoodOneShown(unittest.TestCase):
    """His 13b lets criteria that show an actual good one stand in for a second
    model; a list of what a good one includes never does, and no criteria shape
    holds a written model, so a written explanation keeps needing its good
    instance. The first build passed any launch whose beat carried criteria."""

    ONE_LINE = {"established": "We have learnt to round to the nearest hundred.", "goodLooksLike": None, "steps": []}

    def test_three_maths_lessons_shape_one_line_launch_and_rounding_steps_is_refused(self) -> None:
        # The shape of three saved maths lessons: rounding steps attached as
        # criteria and a one-line launch that shows no explanation.
        practise = maths_practise(launch=copy.deepcopy(self.ONE_LINE))
        practise["successCriteriaRefs"] = ["sc-001"]
        refuses("Skill-based", [rounding_turn("my-turn"), practise])

    def test_the_history_comparisons_checklist_launch_is_refused(self) -> None:
        # A comparison launched with its case and steps and a criteria table of
        # what a good comparison has, and no good comparison shown.
        practise = maths_practise(format="Two short comparisons followed by one source judgement.", reasoningWords=None,
                                  launch={"established": "We've compared babies' play and children learning through work.",
                                          "goodLooksLike": None, "steps": ["Choose a continuity.", "Choose a change."]})
        practise["successCriteriaRefs"] = ["sc-001"]
        message = refuses("Content-based", [practise])
        self.assertIn("success criteria that list what a good one includes are not a good one shown", message)

    def test_the_same_launch_with_its_good_one_beside_a_weak_one_passes(self) -> None:
        launch = copy.deepcopy(self.ONE_LINE)
        launch["goodLooksLike"] = copy.deepcopy(PAIR["goodLooksLike"])
        practise = maths_practise(launch=launch)
        practise["successCriteriaRefs"] = ["sc-001"]
        validator.validate_explanation_task_is_modelled("Skill-based", [rounding_turn("my-turn"), practise])
        validator.validate_explanation_task_is_modelled("Content-based", [practise])

    def test_criteria_do_not_stand_in_for_a_launch_that_is_not_there(self) -> None:
        practise = maths_practise()
        practise["successCriteriaRefs"] = ["sc-001"]
        refuses("Skill-based", [practise])


class TheWholeDesignIsRefusedAndItsRepairPasses(unittest.TestCase):
    """Where the refusal is met in a run: the lesson designer's own validator
    run, the orchestrator's success check after it, and the review packet's.
    The repair its message names is always open to the designer: a launch pair
    on the beat it names."""

    PAIR_FOR = {
        "skill": {"strong": {"words": "Yes: 20 + 10 is 30 and 3 + 4 is 7, so 37.", "show": None},
                  "weak": {"words": "Yes, it is 37.", "show": None},
                  "difference": "The strong one says why."},
        "task": {"strong": {"words": "Foam blocked most sound, because the sound meter read lowest behind it.", "show": None},
                 "weak": {"words": "Foam was best.", "show": None},
                 "difference": "The strong one gives the reading as its reason."},
    }

    def test_a_skill_lesson(self) -> None:
        design, photos = contract.valid_contract()
        practise = contract.source_unit(
            len(design["teachingSequence"]) + 1, "practise",
            {"activity": "Reason about the method", "format": "written explanation",
             "task": "Amira says 23 + 14 is 37 because she added the ones first. Is Amira right? Explain.",
             "launch": None, "reasoningWords": ["because"], "rehearsal": None},
            label="Explain your thinking",
            answer={"kind": "model", "content": "Yes, because partitioning keeps tens with tens.",
                    "acceptanceCondition": "Accept a reason about place value.", "delivery": "answer-slide"})
        design["teachingSequence"].append(practise)
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_design(design, photos)
        self.assertIn("this Practise asks each child to write an explanation or comparison", str(refused.exception))
        practise["content"]["launch"] = {"established": None, "goodLooksLike": copy.deepcopy(self.PAIR_FOR["skill"]), "steps": []}
        validator.validate_design(design, photos)

    def test_a_task_lesson(self) -> None:
        design, photos = contract.valid_task_contract()
        task = next(u for u in design["teachingSequence"] if u["kind"] == "do-task")
        task["content"]["reasoningWords"] = ["because", "so"]
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_design(design, photos)
        self.assertIn("this Do the task asks each child to write an explanation or comparison", str(refused.exception))
        task["content"]["launch"] = {"established": None, "goodLooksLike": copy.deepcopy(self.PAIR_FOR["task"]), "steps": []}
        validator.validate_design(design, photos)


class AContentLessonIsCheckedAsBefore(unittest.TestCase):
    def test_an_earlier_do_whose_model_is_revealed_still_counts(self) -> None:
        do = unit("do", {"task": "Why did the road matter?"}, answer={"kind": "model", "delivery": "answer-slide"})
        validator.validate_explanation_task_is_modelled("Content-based", [do, maths_practise()])

    def test_the_whole_design_refuses_the_shape_and_passes_its_repair(self) -> None:
        design, photos = contract.valid_content_contract()
        practise = next(u for u in design["teachingSequence"] if u["kind"] == "practise")
        repaired = copy.deepcopy(practise["content"]["launch"])
        practise["content"]["launch"] = None
        for earlier in design["teachingSequence"]:
            if earlier is practise:
                break
            earlier["answer"]["delivery"] = "teacher-only" if earlier["answer"]["delivery"] == "answer-slide" else earlier["answer"]["delivery"]
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_design(design, photos)
        self.assertIn("this Practise asks each child to write an explanation or comparison", str(refused.exception))
        practise["content"]["launch"] = repaired
        validator.validate_design(design, photos)


class TheRouteFilesSayTheSameRule(unittest.TestCase):
    def flat(self, rel: str) -> str:
        return " ".join((ROOT / rel).read_text(encoding="utf-8").split())

    def test_the_task_route_no_longer_skips_the_example_for_a_familiar_form(self) -> None:
        task = self.flat("references/teaching-sequence-task-centred.md")
        self.assertNotIn("the product form is familiar", task)
        self.assertNotIn("a form children have not yet made in this lesson", task)
        self.assertIn("or the class has not yet seen a good one of this product in this lesson", task)
        earlier = "or when an earlier beat of this lesson has already shown the class a good one of this product"
        self.assertIn("`launch` is null only when children can begin from the task's question alone, " + earlier, task)
        self.assertIn("`launch` is `null` only when children can begin from the question alone, " + earlier, task)
        content = self.flat("references/teaching-sequence-content-based.md")
        self.assertIn("`launch` is `null` when children can begin from the question alone, " + earlier, content)

    def test_13b_is_in_the_home_and_its_three_pointers_in_the_same_words(self) -> None:
        # It skips only a second model: the launch keeps its case and steps.
        words = ("success criteria on the board that already show what a good one looks like (an actual good one, such "
                 "as a model answer or a good paragraph, never a list of what a good one includes) stand in for the good "
                 "instance, so the launch keeps its case and steps and needs no second model")
        self.assertIn(words[0].upper() + words[1:], self.flat("references/preferences.md"))
        designer = self.flat("agents/lesson-designer.md")
        self.assertEqual(designer.count(words), 2)
        reviewer = self.flat("agents/design-reviewer.md")
        self.assertIn(words + ", and the program cannot see whether they do, so judge that from the criteria beside the task", reviewer)
        for rel in ("references/preferences.md", "agents/lesson-designer.md", "agents/design-reviewer.md"):
            self.assertNotIn("count as one seen", self.flat(rel))
        for rel in ("references/teaching-sequence-content-based.md", "references/teaching-sequence-task-centred.md"):
            self.assertIn("`goodLooksLike` is `null` when the success criteria already show what a good one looks like "
                          "(an actual good one, such as a model answer or a good paragraph, never a list of what a good "
                          "one includes).", self.flat(rel))

    def test_the_reviewers_launch_line_takes_decision_2s_words(self) -> None:
        reviewer = self.flat("agents/design-reviewer.md")
        self.assertNotIn("the product's form is new to the lesson", reviewer)
        self.assertIn("- a substantial task is launched before it is instructed: when the class has not yet seen a good "
                      "one of this product earlier in this lesson or the enabling input ran to several units", reviewer)
        self.assertIn("a null `launch` is right only when children can begin from the question alone or the class has "
                      "already seen a good one of this product earlier in this lesson;", reviewer)


if __name__ == "__main__":
    unittest.main()
