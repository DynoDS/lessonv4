"""A modelled move is used before the next one is taught: Y4 Maths, find 10
and 100 more or less, taught 3 Sep 2026.

The deck went My Turn (cross a hundred), My Turn (cross a thousand), one Our
Turn, Your Turn. The teacher abandoned the lesson on the second My Turn: the
class had watched two different moves before practising either, and the plain
non-crossing case was modelled once and then met again only in independent
work. The route file had authorised it, with "one or more My Turn source
units ... followed by at most one Our Turn", and had dropped the older rule
that a quick move gets two examples and the Our Turn answers two as well, so
extra cases became extra slides instead of extra examples.

The structural half lives in two deterministic gates, where an ordering limit
belongs: the design validator refuses two My Turn source units for one concept,
and the slide check refuses two consecutive My Turn slides, which is the same
board reached by splitting one unit whose examples cannot share a visual. The
slide gate's own tests live in `builder/test/slide-design-check.test.js`.
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKILL_ROUTE = ROOT / "references" / "teaching-sequence-skill-based.md"
PREFERENCES = ROOT / "references" / "preferences.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def validator():
    spec = importlib.util.spec_from_file_location(
        "vld", ROOT / "scripts" / "validate-lesson-design.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def unit(kind: str, concept: str = "concept-001") -> dict:
    return {"kind": kind, "conceptRef": concept}


class TwoMyTurnsInARowAreRefusedTests(unittest.TestCase):
    def setUp(self):
        self.module = validator()
        self.concepts = [{"id": "concept-001"}]

    def check(self, kinds: list[str]):
        self.module.validate_route_sequence(
            "Skill-based", [unit(kind) for kind in kinds], self.concepts
        )

    def test_the_taught_lesson_s_own_shape_is_refused(self):
        with self.assertRaises(self.module.ContractError) as caught:
            self.check(["my-turn", "my-turn", "our-turn", "your-turn"])
        message = str(caught.exception)
        self.assertIn("two My Turn units in a row", message)
        # The error has to say what to do instead, not only that it failed.
        self.assertIn("its own cycle with an Our Turn", message)

    def test_a_run_of_my_turns_is_refused_wherever_it_sits(self):
        with self.assertRaises(self.module.ContractError):
            self.check(["my-turn", "our-turn", "my-turn", "my-turn", "your-turn"])

    def test_the_approved_two_cycle_shape_validates(self):
        # My Turn, Our Turn, My Turn, Our Turn, Your Turn: the plain move is
        # practised before the boundary move is taught.
        self.check(
            ["my-turn", "our-turn", "my-turn", "our-turn", "your-turn"]
        )

    def test_one_cycle_still_validates_with_and_without_its_our_turn(self):
        self.check(["my-turn", "our-turn", "your-turn"])
        self.check(["my-turn", "your-turn"])

    def test_a_preparation_unit_still_opens_the_concept(self):
        sequence = [
            {"kind": "prepare", "conceptRef": None},
            unit("my-turn"),
            unit("our-turn"),
            unit("your-turn"),
        ]
        self.module.validate_route_sequence(
            "Skill-based", sequence, self.concepts
        )

    def test_a_second_cycle_may_not_smuggle_in_a_second_your_turn(self):
        with self.assertRaises(self.module.ContractError):
            self.check(
                [
                    "my-turn",
                    "our-turn",
                    "your-turn",
                    "my-turn",
                    "our-turn",
                    "your-turn",
                ]
            )


class TheGuidanceMatchesTheCheckTests(unittest.TestCase):
    def test_the_rule_is_stated_where_the_sequence_is_designed(self):
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "Several examples of one move belong inside one My Turn unit; a "
            "genuinely different move earns its own cycle rather than a second "
            "My Turn beside the first.",
            route,
        )
        # The reason, so the rule generalises past this lesson.
        self.assertIn(
            "the second model arrives to a class still holding an unfinished "
            "first one",
            route,
        )
        # Both named gates, so prose and code cannot silently drift.
        self.assertIn(
            "`validate-lesson-design.py` refuses two My Turn units in a row",
            route,
        )
        self.assertIn(
            "`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`", route
        )

    def test_the_split_rule_names_what_a_second_my_turn_has_to_prove(self):
        # The rule used to refuse every second My Turn slide and say a layout
        # problem could never justify one. A representation with a minimum usable
        # size disproved that: two four-column charts on one slide give each
        # column around 0.6in, which the build now refuses outright, so a lesson
        # modelling two numbers on charts had nowhere left to go.
        # Two MOVES is still the fault, and the source unit is the evidence.
        playbook = flat(ROOT / "references" / "slide-composition-playbook.md")
        self.assertIn("`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`", playbook)
        self.assertIn("from a different source unit", playbook)
        self.assertIn("two My Turn slides carrying the same unit are one modelling moment", playbook)
        # And the permission is bounded, or every crowded My Turn takes it.
        self.assertIn("for a representation that cannot be used shared, and for nothing else", playbook)
        # BOTH build signals, because the first version of this guidance named
        # only the counter one and a chart with an empty row - the chart a
        # teacher writes in, which draws no counters at all - shipped too narrow
        # the very next day.
        self.assertIn("`PLACE_VALUE_COUNTERS_TOO_SMALL`", playbook)
        self.assertIn("`PLACE_VALUE_WRITE_IN_TOO_NARROW`", playbook)
        self.assertNotIn("they are different moves rather than a layout problem", playbook)

    def test_the_split_rule_asks_what_the_representation_is_for(self):
        # Readability alone was the wrong question: a chart of printed digits
        # survives being shared and the same chart with an empty row does not,
        # and the difference does not show on screen.
        playbook = flat(ROOT / "references" / "slide-composition-playbook.md")
        self.assertIn("Ask what the representation is FOR, not only whether it can be read", playbook)
        self.assertIn("written in", playbook)

    def test_the_structure_spec_describes_cycles_not_a_run_of_models(self):
        route = flat(SKILL_ROUTE)
        self.assertIn("**one or more My Turn plus Our Turn cycles**", route)
        self.assertNotIn("**one or more My Turn source units**", route)

    def test_coverage_cannot_be_read_as_licence_to_stack_my_turns(self):
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "it never means a second My Turn slide stacked on the first", route
        )


class AQuickMoveGetsTwoExamplesTests(unittest.TestCase):
    def test_the_rep_count_default_is_back_with_its_limit(self):
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "Match the number of examples to how long one instance takes, and "
            "give the Our Turn the same number.",
            route,
        )
        self.assertIn(
            "two for quick instances and one for lengthy ones", route
        )
        # The limit, so the default does not become a quota to fill.
        self.assertIn(
            "It is a default, not a quota, so two examples of a move that "
            "takes two minutes each is padding.",
            route,
        )

    def test_examples_are_chosen_to_share_one_visual(self):
        route = flat(SKILL_ROUTE)
        self.assertIn("`643 + 10 =` beside `643 - 100 =`", route)
        self.assertIn("one chart with two answer rows", route)

    def test_a_second_example_may_not_undo_the_first(self):
        # The taught deck paired `1,390 + 10 =` with `1,400 - 10 =`, so the
        # second question asked for a number already printed above it as the
        # first question's starting value (flagged by Daniel, 3 Sep 2026).
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "a second example that undoes the first: `1,390 + 10 =` followed "
            "by `1,400 - 10 =`",
            route,
        )
        self.assertIn(
            "the second question is read off rather than worked", route
        )
        # It generalises past arithmetic.
        self.assertIn("The same trap catches any reversible move", route)
        # The limit: a deliberate inverse demonstration is legitimate.
        self.assertIn(
            "The limit is when the inverse relationship is itself the teaching "
            "point",
            route,
        )


class TheRhythmHasNoSkillBasedExemptionTests(unittest.TestCase):
    def test_practice_follows_each_modelled_move(self):
        preferences = flat(PREFERENCES)
        self.assertIn(
            "Skill-based lessons carry it as the guided and independent "
            "practice that follows each modelled move, never as one block of "
            "practice at the end of several models",
            preferences,
        )


if __name__ == "__main__":
    unittest.main()
