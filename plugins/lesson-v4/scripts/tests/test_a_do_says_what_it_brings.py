"""A Do whose answer the teaching just said owes an answer, and a true one.

On 6 October 2026 a Year 4 science lesson taught the absorption of nutrients
on one slide and asked pairs to "repair" an explanation whose model answer
was that slide, 16 words of 17. The designer's tool and the reviewer's view
both showed the overlap under `a look, not a verdict`, and the lesson reached
the teacher after a redesign and two reviews.

These hold the repair: one count for everyone, a declaration on each Do
(`use`), and a check that refuses a missing or untrue one while leaving a
good task with a high count alone.
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
import beside_teaching  # noqa: E402


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def teach(label: str, headline: str, explanation: str) -> dict:
    return {
        "kind": "teach", "label": label,
        "content": {"headline": headline, "explanation": explanation},
        "speakerNotes": {"script": explanation},
    }


def do(label: str, task: str, answer: str, use: dict | None = None) -> dict:
    unit = {
        "kind": "do", "label": label, "pupilInstruction": "Write your answer.",
        "content": {"task": task}, "answer": {"content": answer},
    }
    if use is not None:
        unit["use"] = use
    return unit


ABSORPTION = teach(
    "How does food help the body?",
    "The useful parts of food have to reach the rest of your body.",
    "Tiny nutrients pass through the wall of the small intestine into the blood. This is "
    "absorption. The blood carries nutrients round the body for energy, growth and repair.",
)
SAID_BACK = (
    "Nutrients are inside the small intestine. Blood is outside its wall. Rewrite these "
    "sentences to explain how nutrients get to the rest of the body.",
    "Nutrients pass through the wall of the small intestine into the blood. This is absorption. "
    "The blood carries them round the body.",
)
SWEETCORN = (
    "Sometimes people see bits of sweetcorn skin in their poo. Why does that happen?",
    "The body can't break the skin down into tiny nutrients, so it can't pass through the wall "
    "of the small intestine into the blood.",
)


def row(use: dict | None, task_and_answer=SAID_BACK) -> beside_teaching.Beside:
    design = {"teachingSequence": [ABSORPTION, do("The task", *task_and_answer, use=use)]}
    return beside_teaching.read_beside(design)[0]


class TheCountDecidesWhoAnswers(unittest.TestCase):
    def test_a_task_that_hands_the_teaching_back_is_asked_and_refused(self) -> None:
        said_back = row(None)
        self.assertTrue(said_back.asked)
        fault = said_back.fault()
        self.assertIn("does not say what it brings", fault)
        self.assertIn("The teaching said:", fault)
        self.assertIn("Two ways this goes wrong", fault)

    def test_a_good_task_with_a_high_count_is_asked_and_passes_with_a_true_new(self) -> None:
        fresh = row({"new": "bits of sweetcorn skin in their poo", "rehearsal": None}, SWEETCORN)
        self.assertTrue(fresh.asked, "a fresh case says the idea in the Teach's words")
        self.assertIsNone(fresh.fault())

    def test_a_low_count_is_not_asked_and_an_older_design_still_reads(self) -> None:
        unasked = row(None, ("Which of these is a mammal?", "A whale, because it feeds its young milk."))
        self.assertFalse(unasked.asked)
        self.assertIsNone(unasked.fault())

    def test_the_final_task_is_never_asked(self) -> None:
        final = {**do("Final", *SAID_BACK), "kind": "practise"}
        rows = beside_teaching.read_beside({"teachingSequence": [ABSORPTION, final]})
        self.assertFalse(rows[0].declares)
        self.assertIsNone(rows[0].fault())


class TheAnswerIsWhatCanBeWrong(unittest.TestCase):
    def test_a_new_the_lesson_already_said_is_refused(self) -> None:
        fault = row({"new": "Nutrients are inside the small intestine", "rehearsal": None}).fault()
        self.assertIn("the lesson had already said", fault)

    def test_a_new_that_is_not_in_the_task_is_refused(self) -> None:
        fault = row({"new": "a fresh explanatory condition about digestion", "rehearsal": None}).fault()
        self.assertIn("the task children are set does not contain", fault)

    def test_both_at_once_is_refused(self) -> None:
        fault = row({"new": "sweetcorn skin", "rehearsal": "They say it back before they write it."}).fault()
        self.assertIn("one or the other", fault)

    def test_a_label_is_not_a_reason_for_rehearsal(self) -> None:
        self.assertIn("gives no reason", row({"new": None, "rehearsal": "supported rehearsal"}).fault())

    def test_a_reasoned_rehearsal_passes_and_is_left_for_the_review_to_judge(self) -> None:
        reasoned = row({"new": None, "rehearsal": "Pairs say the journey aloud before each child writes it alone."})
        self.assertIsNone(reasoned.fault())
        self.assertIn("rehearsal", reasoned.declaration_line())


class EveryoneSeesTheSameNumber(unittest.TestCase):
    def setUp(self) -> None:
        self.design = {"teachingSequence": [ABSORPTION, do("The task", *SAID_BACK)]}
        self.row = beside_teaching.read_beside(self.design)[0]

    def test_the_reviewers_view_prints_the_shared_count_and_the_claim(self) -> None:
        packet = load("design_review_packet_under_test", "design-review-packet.py")
        view = "\n".join(packet.build_do_beside_teach(self.design))
        self.assertIn(f"already said: {self.row.repeated} of {self.row.total}", view)
        self.assertIn("The teaching said:", view)
        self.assertIn("does not say what this task brings", view)
        self.assertIn("0 of 1 say they use the learning on something new", view)
        self.assertNotIn("where to look, not the verdict", view)

    def test_a_lesson_of_nothing_but_rehearsal_is_named(self) -> None:
        rows = beside_teaching.read_beside({"teachingSequence": [
            ABSORPTION,
            do("The task", *SAID_BACK, use={"new": None, "rehearsal": "They say it back before they write it down."}),
        ]})
        self.assertIn("Nowhere before the final task", beside_teaching.whole_lesson_line(rows))


REASON = {"new": None, "rehearsal": "Children say it back so it is secure before the next part."}


class ALessonHoldsOneSayItBackAtMost(unittest.TestCase):
    """The teacher, 6 October 2026, shown a christingle lesson whose first two
    tasks said back what the orange and the ribbon mean: `two is too many, one
    at most`."""

    def lesson(self, *uses) -> list:
        sequence = []
        for index, use in enumerate(uses):
            sequence += [ABSORPTION, do(f"Task {index + 1}", *SAID_BACK, use=use)]
        return beside_teaching.read_beside({"teachingSequence": sequence})

    def test_one_is_allowed(self) -> None:
        self.assertIsNone(beside_teaching.too_much_rehearsal(self.lesson(REASON)))

    def test_a_second_is_refused_and_both_are_named(self) -> None:
        fault = beside_teaching.too_much_rehearsal(self.lesson(REASON, REASON))
        self.assertIn("`Task 1`, `Task 2`", fault)
        self.assertIn("two is too many, one at most", fault)
        self.assertIn("unfair", fault)
        self.assertIn("one name swapped", fault)

    def test_however_the_second_reason_is_worded(self) -> None:
        other = {"new": None, "rehearsal": "A fact may be recalled with the answer off the board."}
        self.assertIsNotNone(beside_teaching.too_much_rehearsal(self.lesson(REASON, other)))

    def test_the_final_task_and_a_maths_turn_are_not_counted(self) -> None:
        final = {**do("Final", *SAID_BACK), "kind": "practise"}
        turn = {**do("Your Turn", *SAID_BACK), "kind": "your-turn"}
        rows = beside_teaching.read_beside({"teachingSequence": [
            ABSORPTION, do("Task 1", *SAID_BACK, use=REASON), ABSORPTION, turn, ABSORPTION, final,
        ]})
        self.assertIsNone(beside_teaching.too_much_rehearsal(rows))

    def test_with_the_limit_taken_out_the_second_passes(self) -> None:
        """The check is what refuses it: lift the limit and the same lesson is let through."""
        kept = beside_teaching.REHEARSAL_MOST
        try:
            beside_teaching.REHEARSAL_MOST = 99
            self.assertIsNone(beside_teaching.too_much_rehearsal(self.lesson(REASON, REASON)))
        finally:
            beside_teaching.REHEARSAL_MOST = kept
        self.assertIsNotNone(beside_teaching.too_much_rehearsal(self.lesson(REASON, REASON)))

    def test_the_design_check_reports_it(self) -> None:
        validator = load("validate_lesson_design_one_rehearsal", "validate-lesson-design.py")
        found: list[str] = []

        class Log:
            def add(self, fault: str) -> None:
                found.append(fault)

        sequence = [ABSORPTION, do("Task 1", *SAID_BACK, use=REASON), ABSORPTION, do("Task 2", *SAID_BACK, use=REASON)]
        validator.validate_each_do_says_what_it_brings({"teachingSequence": sequence}, Log())
        self.assertEqual(len(found), 1)
        self.assertIn("one say-it-back Do or quick check at most", found[0])


class AUseHasAWrongAnswerAChildWouldGive(unittest.TestCase):
    """The first design made from the five moves (christingle, 6 October 2026)
    asked `We use a bigger orange. Does that mean the world has grown?`: new,
    and no child says yes. So a `new` names the wrong answer a child would
    really give, where the designer and the reviewer can read it."""

    NEW = "bits of sweetcorn skin in their poo"

    def test_a_named_wrong_answer_passes_and_is_printed_beside_the_claim(self) -> None:
        named = row({"new": self.NEW, "wrong": "It was not chewed enough, so it came out", "rehearsal": None}, SWEETCORN)
        self.assertIsNone(named.fault())
        self.assertIn("A child who has not understood would say:", named.declaration_line())

    def test_a_bare_yes_is_not_a_wrong_answer(self) -> None:
        for bare in ("yes", None):
            with self.subTest(wrong=bare):
                fault = row({"new": self.NEW, "wrong": bare, "rehearsal": None}, SWEETCORN).fault()
                self.assertIn("would the child who understands answer differently", fault)

    def test_a_design_saved_before_the_field_still_reads(self) -> None:
        self.assertIsNone(row({"new": self.NEW, "rehearsal": None}, SWEETCORN).fault())

    def test_rehearsal_names_no_wrong_answer(self) -> None:
        fault = row({"new": None, "wrong": "They forget it by the next slide", "rehearsal": "They say it back so it is secure before the next part."}).fault()
        self.assertIn("leave `wrong` as null", fault)


class SayingItAloudCanBeTheSkill(unittest.TestCase):
    """In PSHE a child saying a refusal in their own voice is practising what
    the lesson is for. The teacher, 6 October 2026: `different because saying
    it is the point`. It is declared `practice` and is not the one say-it-back."""

    PRACTICE = {"new": None, "wrong": None, "rehearsal": None,
                "practice": "Each child says a clear, calm no to their partner in their own words."}

    def lesson(self) -> list:
        return beside_teaching.read_beside({"teachingSequence": [
            ABSORPTION, do("Task 1", *SAID_BACK, use=REASON),
            ABSORPTION, do("Task 2", *SAID_BACK, use=self.PRACTICE),
        ]})

    def test_practice_is_a_complete_answer(self) -> None:
        rows = self.lesson()
        self.assertIsNone(rows[1].fault())
        self.assertIn("practises the skill itself", rows[1].declaration_line())

    def test_it_is_not_counted_with_the_say_it_back_beats(self) -> None:
        self.assertIsNone(beside_teaching.too_much_rehearsal(self.lesson()))

    def test_a_second_rehearsal_beside_the_practice_is_still_refused(self) -> None:
        rows = beside_teaching.read_beside({"teachingSequence": [
            ABSORPTION, do("Task 1", *SAID_BACK, use=REASON),
            ABSORPTION, do("Task 2", *SAID_BACK, use=self.PRACTICE),
            ABSORPTION, do("Task 3", *SAID_BACK, use=REASON),
        ]})
        self.assertIn("`Task 1`, `Task 3`", beside_teaching.too_much_rehearsal(rows))

    def test_a_label_is_not_practice(self) -> None:
        thin = {**self.PRACTICE, "practice": "partner practice"}
        fault = beside_teaching.read_beside({"teachingSequence": [ABSORPTION, do("Task", *SAID_BACK, use=thin)]})[0].fault()
        self.assertIn("recited to a partner is rehearsal, not practice", fault)


STOMACH = teach(
    "What does the stomach do?",
    "The stomach churns food and mixes it with digestive juices.",
    "The stomach churns food and mixes it with digestive juices, which help break it down.",
)
A = "The stomach churns food and mixes it with digestive juices. These help break food down before it moves on."
WRONG_B = "Food travels into the stomach after leaving the oesophagus. It stays for a while, then travels into the small intestine."


def which_is_better(use: dict | None) -> beside_teaching.Beside:
    unit = do("Which explanation?", f"A: {A}\n\nB: {WRONG_B}", "A explains the stomach's job. B only says where food goes.", use=use)
    unit["pupilInstruction"] = "Which explanation helps us understand the stomach's job?"
    return beside_teaching.read_beside({"teachingSequence": [STOMACH, unit]})[0]


class OnAChoiceTheRightOptionIsWhatIsRead(unittest.TestCase):
    """Round three on Codex (science, 6 October 2026): `which explanation is
    better`, where the better one was the Teach's sentences. Its written
    answer explained the choice in fresh words, so the count was low, and
    `new` held both options pasted in, so the wrong option's words were new."""

    def test_the_right_option_is_found_and_counted(self) -> None:
        row = which_is_better(None)
        self.assertEqual(row.right_option, A)
        self.assertTrue(row.asked)
        self.assertIn("the option children should choose", row.fault())

    def test_the_options_pasted_in_are_not_what_is_new(self) -> None:
        fault = which_is_better({"new": f"A: {A} B: {WRONG_B}", "wrong": "B is better because it says where food goes", "rehearsal": None}).fault()
        self.assertIn("Say in a phrase", fault)

    def test_the_wrong_options_words_do_not_make_it_new(self) -> None:
        fault = which_is_better({"new": "Food travels into the stomach after leaving the oesophagus", "wrong": "B is better because it says where food goes", "rehearsal": None}).fault()
        self.assertIn("A different wrong option does not change that", fault)

    def test_it_may_still_be_the_lessons_one_rehearsal(self) -> None:
        self.assertIsNone(which_is_better(REASON).fault())

    def test_a_choice_about_a_new_case_still_passes(self) -> None:
        unit = do(
            "The stick", "One stick falls out of this Christingle. You still have plenty of food. Which repair keeps the reminder of the whole year?",
            "Put the fourth stick back.",
            use={"new": "One stick falls out. You still have plenty of food", "wrong": "Add more food, because there is plenty", "rehearsal": None},
        )
        unit["taskStructure"] = {"kind": "option-bank", "items": [{"id": "i1", "label": "Add more food to the three sticks."}, {"id": "i2", "label": "Put the fourth stick back."}]}
        seasons = teach("Four sticks", "The four sticks stand for the four seasons.", "The four sticks stand for spring, summer, autumn and winter.")
        row = beside_teaching.read_beside({"teachingSequence": [seasons, unit]})[0]
        self.assertEqual(row.right_option, "Put the fourth stick back.")
        self.assertIsNone(row.fault())


class TheReviewGivesEveryDoALine(unittest.TestCase):
    def setUp(self) -> None:
        self.packet = load("design_review_packet_lines", "design-review-packet.py")
        self.design = {"teachingSequence": [ABSORPTION, do("The task", *SAID_BACK)]}

    def check(self, body: str) -> None:
        import tempfile
        with tempfile.TemporaryDirectory() as folder:
            review = Path(folder) / "design-review.md"
            review.write_text(body, encoding="utf-8")
            self.packet.require_every_do_has_its_line(review, self.design)

    def test_a_review_with_no_line_for_a_do_is_refused(self) -> None:
        with self.assertRaises(self.packet.PacketError):
            self.check("## Result\nAPPROVED\n\n## Each Do\n- Another beat | uses | a new case\n")

    def test_a_line_with_a_verdict_passes(self) -> None:
        self.check("## Result\nREDESIGN REQUIRED\n\n## Each Do\n- The task | says it back | the answer is the Teach board\n\n## Judgements\n")


if __name__ == "__main__":
    unittest.main()
