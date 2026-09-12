"""Every modelled move is checked before the next one is taught: Y4 Maths,
round to 10, 100 or 1,000, reviewed 12 September 2026.

The deck modelled rounding to 10 on 43 and 45, guided 48, then went on to
hundreds and to thousands, and the class did not write an answer of their own
until a mixed set near the end. The teacher: "It used to be my turn, one or two
examples, our turn ... your turn, quick fire practise 1-4 questions. Then next
concept my turn, our turn, your turn same thing." And on the small bridging
cycle: "Even small scale, if we're startring small then scaling, can still do
it, maybe your turn just has less questions etc."

The route file had authorised the deck: a concept ran one or more My Turn plus
Our Turn cycles and then ONE Your Turn, so practice legitimately pooled at the
end. The shortcut beat ("why is it always the digit to the right?") had nowhere
to sit either, so it was written as a My Turn and pulled a cycle of its own
behind it.
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKILL_ROUTE = ROOT / "references" / "teaching-sequence-skill-based.md"
MATHS = ROOT / "references" / "subject-maths.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TheCheckFollowsEachMoveTests(unittest.TestCase):
    def setUp(self):
        self.module = load("vld_cycle", "validate-lesson-design.py")
        self.concepts = [{"id": "concept-001"}]

    def check(self, kinds, concepts=None):
        sequence = [
            {"kind": kind, "conceptRef": None if kind == "prepare" else "concept-001"}
            for kind in kinds
        ]
        self.module.validate_route_sequence(
            "Skill-based", sequence, concepts or self.concepts
        )

    def test_the_taught_rounding_shape_is_refused(self):
        with self.assertRaises(self.module.ContractError) as caught:
            self.check(
                ["my-turn", "our-turn", "my-turn", "our-turn", "your-turn"]
            )
        self.assertIn("no Your Turn after it", str(caught.exception))

    def test_each_cycle_may_keep_its_own_check(self):
        self.check(
            [
                "my-turn", "our-turn", "your-turn",
                "my-turn", "our-turn", "your-turn",
                "my-turn", "your-turn",
            ]
        )

    def test_the_derived_shortcut_sits_between_cycles_as_preparation(self):
        # The beat that asks why it is always the digit to the right models
        # nothing, so it is a prepare unit and does not owe a cycle.
        self.check(
            [
                "my-turn", "our-turn", "your-turn",
                "prepare",
                "my-turn", "our-turn", "your-turn",
            ]
        )

    def test_the_shortcut_may_also_close_the_concept(self):
        self.check(["my-turn", "our-turn", "your-turn", "prepare"])

    def test_a_second_concept_still_starts_its_own_cycles(self):
        sequence = [
            {"kind": "my-turn", "conceptRef": "concept-001"},
            {"kind": "our-turn", "conceptRef": "concept-001"},
            {"kind": "your-turn", "conceptRef": "concept-001"},
            {"kind": "my-turn", "conceptRef": "concept-002"},
            {"kind": "your-turn", "conceptRef": "concept-002"},
        ]
        self.module.validate_route_sequence(
            "Skill-based",
            sequence,
            [{"id": "concept-001"}, {"id": "concept-002"}],
        )

    def test_a_concept_that_never_hands_over_is_still_refused(self):
        with self.assertRaises(self.module.ContractError):
            self.check(["my-turn", "our-turn"])


class TheScaffoldAgreesTests(unittest.TestCase):
    """The scaffold refuses the same shapes, or a request only fails later."""

    def setUp(self):
        self.scaffold = load("scf_cycle", "lesson-design-scaffold.py")

    def shape(self, pairs):
        return [{"kind": kind, "conceptIndex": idx} for kind, idx in pairs]

    def test_the_taught_rounding_shape_is_refused(self):
        with self.assertRaises(self.scaffold.ScaffoldError) as caught:
            self.scaffold.validate_route_shape(
                "Skill-based",
                [{"concept": "Round to the nearest 10"}],
                self.shape(
                    [
                        ("my-turn", 1), ("our-turn", 1),
                        ("my-turn", 1), ("our-turn", 1), ("your-turn", 1),
                    ]
                ),
            )
        self.assertIn("no your-turn after it", str(caught.exception))

    def test_a_cycle_each_with_its_check_is_accepted(self):
        self.scaffold.validate_route_shape(
            "Skill-based",
            [{"concept": "Round to the nearest 10"}],
            self.shape(
                [
                    ("my-turn", 1), ("our-turn", 1), ("your-turn", 1),
                    ("prepare", None),
                    ("my-turn", 1), ("your-turn", 1),
                ]
            ),
        )


class TheGuidanceMatchesTheCheckTests(unittest.TestCase):
    def test_the_route_states_the_rhythm_and_the_reason(self):
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "**Every cycle ends with its own Your Turn, and it is a check "
            "rather than the main practice.**",
            route,
        )
        self.assertIn(
            "The your turns are good because they are a quick check of can we "
            "do this before moving on to the next concept",
            route,
        )

    def test_a_small_bridging_cycle_is_told_what_to_do(self):
        # Without this the rule reads as licence to skip the check whenever
        # the cycle was only a way in.
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "**A bridging cycle on small numbers earns two questions, not none**",
            route,
        )

    def test_the_last_cycle_still_carries_the_real_practice(self):
        # Or the rule turns one substantial independent task into three token
        # ones and the lesson never practises the objective's own numbers.
        route = flat(SKILL_ROUTE)
        self.assertIn(
            "The substantial independent practice is the last cycle's Your Turn",
            route,
        )
        self.assertIn("blocked-then-mixed", route)

    def test_the_route_no_longer_pools_practice_at_the_end(self):
        route = flat(SKILL_ROUTE)
        self.assertNotIn("then exactly one Your Turn", route)
        self.assertNotIn(
            "My Turn, Our Turn, My Turn, Our Turn, Your Turn", route
        )

    def test_the_shortcut_beat_is_told_which_unit_it_is(self):
        maths = flat(MATHS)
        self.assertIn(
            "a `prepare` unit with `mode: pattern-investigation`", maths
        )
        # And why, so it is not read as a filing preference.
        self.assertIn("nothing is being modelled", maths)
        self.assertIn("grows a cycle it never needed", maths)


if __name__ == "__main__":
    unittest.main()
