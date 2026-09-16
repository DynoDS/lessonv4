"""A content lesson's substantial work sits where the class is ready for it.

The Content-based route pinned its Practise to the last unit, so the only
legal shape was every Teach -> Do pair first and the main work at the end.
A Year 4 history class (15 September 2026) was ready for its written
explanations after the second chunk and instead sat through every remaining
short beat on the carpet; the guidance already said "treat a substantial beat
as main practice", but the route had nowhere earlier to put one.

The rhythm is unchanged: every Teach is used at once, an Observe only ever
sets up the Teach after it, and a Practise needs a Teach -> Do pair before
it. A Teach may be used by the Practise straight after it, because a Do that
became substantial is main practice in the same place, and requiring a
separate Do first only added a token beat (review, 16 September 2026). What moved is the Practise, which may now follow any complete pair,
once or more, with teaching the work earned continuing after it as ordinary
pairs. The scaffold refuses the same shapes as the validator, because it
checks the request before any file is written.
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT_ROUTE = ROOT / "references" / "teaching-sequence-content-based.md"
ROUTE_CHECKS = ROOT / "references" / "design-review-route-checks.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CONVENTIONAL = ["teach", "do", "teach", "do", "practise"]
EARLY_MAIN_WORK = ["teach", "do", "teach", "do", "practise", "teach", "do"]
OBSERVE_THEN_EARLY = ["observe", "teach", "do", "practise", "teach", "do", "practise"]
# A Do that became substantial is the Practise in the same place: no token
# Do is needed between its Teach and the work that uses it.
PROMOTED_IN_PLACE = ["teach", "do", "teach", "practise"]
PROMOTED_THEN_MORE = ["observe", "teach", "do", "teach", "practise", "teach", "do"]

# Each malformed shape with the phrase its refusal has to carry, so a repair
# knows what to move rather than guessing.
MALFORMED = [
    (["practise", "teach", "do"], "before it"),
    (["teach", "do"], "requires a Practise"),
    (["teach", "practise"], "before it"),
    (["observe", "teach", "practise", "teach", "do"], "before it"),
    (["teach", "do", "practise", "teach"], "followed immediately by Do"),
    (["teach", "do", "practise", "do"], "Teach -> Do pairs"),
    (["do", "teach", "do", "practise"], "Teach -> Do pairs"),
    (["teach", "do", "observe", "practise"], "observe must be followed immediately by Teach"),
    (["observe", "do", "practise"], "observe must be followed immediately by Teach"),
]


class TheValidatorLetsThePractiseMoveTests(unittest.TestCase):
    def setUp(self):
        self.module = load("vld_practise_position", "validate-lesson-design.py")

    def check(self, kinds):
        self.module.validate_route_sequence(
            "Content-based", [{"kind": kind, "conceptRef": None} for kind in kinds], []
        )

    def test_the_conventional_route_still_validates(self):
        self.check(CONVENTIONAL)

    def test_the_main_work_may_follow_the_second_pair_with_teaching_after_it(self):
        self.check(EARLY_MAIN_WORK)

    def test_an_observe_opening_and_a_second_practise_are_both_allowed(self):
        self.check(OBSERVE_THEN_EARLY)

    def test_a_substantial_beat_can_be_the_practise_straight_after_its_teach(self):
        self.check(PROMOTED_IN_PLACE)
        self.check(PROMOTED_THEN_MORE)

    def test_a_genuinely_malformed_route_is_still_refused(self):
        for kinds, phrase in MALFORMED:
            with self.subTest(kinds=kinds):
                with self.assertRaises(self.module.ContractError) as caught:
                    self.check(kinds)
                self.assertIn(phrase, str(caught.exception))


class TheScaffoldRefusesTheSameShapesTests(unittest.TestCase):
    """The scaffold checks the request before writing files, so it has its own
    copy of the rule; this is what keeps the two from drifting apart."""

    def setUp(self):
        self.scaffold = load("scf_practise_position", "lesson-design-scaffold.py")
        self.validator = load("vld_practise_position_b", "validate-lesson-design.py")

    def scaffold_ok(self, kinds) -> bool:
        try:
            self.scaffold.validate_route_shape(
                "Content-based", [], [{"kind": kind, "conceptIndex": None} for kind in kinds]
            )
        except self.scaffold.ScaffoldError:
            return False
        return True

    def validator_ok(self, kinds) -> bool:
        try:
            self.validator.validate_route_sequence(
                "Content-based", [{"kind": kind, "conceptRef": None} for kind in kinds], []
            )
        except self.validator.ContractError:
            return False
        return True

    def test_both_copies_agree_on_every_shape(self):
        shapes = [CONVENTIONAL, EARLY_MAIN_WORK, OBSERVE_THEN_EARLY, PROMOTED_IN_PLACE, PROMOTED_THEN_MORE] + [kinds for kinds, _ in MALFORMED]
        for kinds in shapes:
            with self.subTest(kinds=kinds):
                self.assertEqual(self.scaffold_ok(kinds), self.validator_ok(kinds))

    def test_the_scaffold_accepts_the_early_main_work(self):
        self.assertTrue(self.scaffold_ok(EARLY_MAIN_WORK))

    def test_the_scaffold_refuses_a_practise_before_any_teaching(self):
        with self.assertRaises(self.scaffold.ScaffoldError) as caught:
            self.scaffold.validate_route_shape(
                "Content-based", [], [{"kind": "practise", "conceptIndex": None}]
            )
        self.assertIn("before it", str(caught.exception))


class TheRouteGuidanceSaysWhereTheWorkMayGoTests(unittest.TestCase):
    """Wiring only: the words that tell the designer and reviewer the slot has
    moved are present. This proves nothing about the lessons they produce."""

    def test_the_content_route_no_longer_pins_practise_to_the_end(self):
        text = flat(CONTENT_ROUTE)
        self.assertNotIn("After all the teaching is done, a main Practise", text)
        self.assertIn("after any complete Teach", text)

    def test_the_reviewer_route_check_judges_what_follows_an_early_practise(self):
        text = flat(ROUTE_CHECKS)
        self.assertIn("Practise that sits before the last Teach", text)


if __name__ == "__main__":
    unittest.main()
