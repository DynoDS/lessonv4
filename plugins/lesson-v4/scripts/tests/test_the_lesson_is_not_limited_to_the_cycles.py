"""A skill lesson is more than its cycles: Daniel, 12 September 2026.

Asked whether every maths lesson would now be my turn, our turn, your turn and
nothing else, he answered: "i still want good pedgagogical designs, like what
weve been doing, i dont want to limit it to starter, answers, key vocab, mtotyt
cycles. If it thinks teach in a place do it, if it thinks seperate key vocab do
it. if it thinks apply now, or problem solving now do it, etc".

The Skill-based route had four beat kinds, and the sequence check consumed the
whole sequence as cycles, so there was nowhere for a Teach beat or a
problem-solving beat to stand. Reasoning and problem solving had to arrive
inside the last Your Turn's task or as the earned Apply ending, which is also
why a lesson could finish without either and still look complete.

The route now carries `teach` and `practise` as well, placed where the lesson
earns them. What stays fixed is the cycle: a My Turn, an optional Our Turn and
its own Your Turn, uninterrupted.
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKILL_ROUTE = ROOT / "references" / "teaching-sequence-skill-based.md"
MATHS = ROOT / "references" / "subject-maths.md"
DESIGNER = ROOT / "agents" / "lesson-designer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TheSequenceHasRoomForTheLessonTests(unittest.TestCase):
    def setUp(self):
        self.module = load("vld_free", "validate-lesson-design.py")

    def check(self, units, concepts=("concept-001",)):
        sequence = []
        for item in units:
            kind, concept = item if isinstance(item, tuple) else (item, "concept-001")
            if kind == "prepare":
                concept = None
            sequence.append({"kind": kind, "conceptRef": concept})
        self.module.validate_route_sequence(
            "Skill-based", sequence, [{"id": c} for c in concepts]
        )

    def test_the_route_carries_the_two_borrowed_kinds(self):
        self.assertEqual(
            self.module.ROUTE_KINDS["Skill-based"],
            {"prepare", "my-turn", "our-turn", "your-turn", "teach", "practise"},
        )

    def test_a_teach_beat_may_open_the_lesson(self):
        # A conversion lesson teaches what a kilogram is before modelling the
        # method that uses it.
        self.check([("teach", None), "my-turn", "our-turn", "your-turn"])

    def test_a_teach_beat_may_sit_between_cycles(self):
        self.check(
            [
                "my-turn", "our-turn", "your-turn",
                ("teach", None),
                "my-turn", "our-turn", "your-turn",
            ]
        )

    def test_reasoning_and_problem_solving_are_beats_after_the_cycles(self):
        self.check(
            [
                "my-turn", "our-turn", "your-turn",
                "my-turn", "our-turn", "your-turn",
                ("practise", None),
                ("practise", None),
            ]
        )

    def test_a_practise_beat_may_carry_its_concept(self):
        self.check(["my-turn", "our-turn", "your-turn", "practise"])

    def test_a_beat_may_not_interrupt_a_cycle(self):
        # The class has been modelled to and is waiting to try it. The message
        # has to say where the beat goes instead, or the repair is a guess.
        with self.assertRaises(self.module.ContractError) as caught:
            self.check(["my-turn", "our-turn", ("teach", None), "your-turn"])
        message = str(caught.exception)
        self.assertIn("runs uninterrupted", message)
        self.assertIn("between cycles rather than inside one", message)

    def test_a_guided_beat_with_no_model_in_front_of_it_is_refused(self):
        with self.assertRaises(self.module.ContractError) as caught:
            self.check([("practise", None), "our-turn", "your-turn"])
        self.assertIn("out-of-place our-turn unit", str(caught.exception))

    def test_returning_to_a_concept_after_moving_on_is_refused(self):
        # Mixing two concepts is a practise beat, not a third cycle on the
        # first concept dropped in after the second.
        with self.assertRaises(self.module.ContractError) as caught:
            self.module.validate_route_sequence(
                "Skill-based",
                [
                    {"kind": "my-turn", "conceptRef": "concept-001"},
                    {"kind": "your-turn", "conceptRef": "concept-001"},
                    {"kind": "my-turn", "conceptRef": "concept-002"},
                    {"kind": "your-turn", "conceptRef": "concept-002"},
                    {"kind": "my-turn", "conceptRef": "concept-001"},
                    {"kind": "your-turn", "conceptRef": "concept-001"},
                ],
                [{"id": "concept-001"}, {"id": "concept-002"}],
            )
        self.assertIn("returns to concept-001 after moving on", str(caught.exception))

    def test_a_concept_with_no_cycle_at_all_is_refused(self):
        with self.assertRaises(self.module.ContractError) as caught:
            self.module.validate_route_sequence(
                "Skill-based",
                [
                    {"kind": "my-turn", "conceptRef": "concept-001"},
                    {"kind": "your-turn", "conceptRef": "concept-001"},
                    {"kind": "practise", "conceptRef": None},
                ],
                [{"id": "concept-001"}, {"id": "concept-002"}],
            )
        self.assertIn(
            "at least one My Turn cycle for every concept", str(caught.exception)
        )


class TheScaffoldAgreesTests(unittest.TestCase):
    def setUp(self):
        self.scaffold = load("scf_free", "lesson-design-scaffold.py")

    def shape(self, pairs):
        return [{"kind": kind, "conceptIndex": idx} for kind, idx in pairs]

    def test_a_teach_and_a_practise_beat_pass_the_scaffold(self):
        self.scaffold.validate_route_shape(
            "Skill-based",
            [{"concept": "Convert kilograms to grams"}],
            self.shape(
                [
                    ("teach", None),
                    ("my-turn", 1), ("our-turn", 1), ("your-turn", 1),
                    ("practise", None),
                ]
            ),
        )

    def test_the_scaffold_refuses_an_interrupted_cycle(self):
        with self.assertRaises(self.scaffold.ScaffoldError) as caught:
            self.scaffold.validate_route_shape(
                "Skill-based",
                [{"concept": "Convert kilograms to grams"}],
                self.shape([("my-turn", 1), ("practise", None), ("your-turn", 1)]),
            )
        self.assertIn("runs uninterrupted", str(caught.exception))


class TheGuidanceMatchesTheCheckTests(unittest.TestCase):
    def test_the_route_says_the_lesson_around_the_cycles_is_the_design_s(self):
        route = flat(SKILL_ROUTE)
        self.assertIn("**What else the sequence may hold.**", route)
        self.assertIn(
            "Three further source-unit kinds are available in this route, "
            "`prepare`, `teach` and `practise`",
            route,
        )
        # In his own words, so the permission is not read as a shrug.
        self.assertIn("if it thinks apply now, or problem solving now do it", route)

    def test_the_teach_beat_is_bounded_by_what_it_does(self):
        # Without a limit a Teach beat becomes the place a lesson explains the
        # method instead of modelling it, and the cycle rule is bypassed.
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "the moment a beat shows how the method is carried out, it is a My "
            "Turn and owes the rest of its cycle",
            route,
        )
        # A test the designer can actually run.
        self.assertIn(
            "If they could attempt a question from having watched, it was modelling",
            route,
        )

    def test_prepare_and_teach_are_told_apart(self):
        route = flat(SKILL_ROUTE)
        self.assertIn("ask whether anything has to survive the lesson", route)
        self.assertIn(
            "content for the idea to disappear at the first Your Turn", route
        )

    def test_a_practise_beat_is_told_apart_from_a_your_turn(self):
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "A Your Turn belongs to the move just modelled and is sized to it",
            route,
        )
        self.assertIn(
            "An apply task that closes the lesson is still the `ending` block",
            route,
        )

    def test_maths_names_the_beat_for_each_of_the_three_demands(self):
        maths = flat(MATHS)
        self.assertIn("Reasoning and problem solving are `practise` units", maths)
        self.assertIn("Fluency lives in the cycles' Your Turns", maths)
        # Both failure directions, since the old shape produced both.
        self.assertIn("wing bolted on at the end out of habit", maths)
        self.assertIn("skipped by default because the cycles filled the time", maths)

    def test_the_designer_has_to_write_the_decision_down(self):
        # A question only asked is a formality; a line that has to be written
        # is a decision. Same reasoning as the playful-opportunity line.
        designer = flat(DESIGNER)
        self.assertIn("- **Reasoning and problem solving:**", designer)
        self.assertIn(
            "write the answer in one line in the closing decisions", designer
        )
        self.assertIn("then maybe it did a reasoning, or a problem solving", designer)


if __name__ == "__main__":
    unittest.main()
