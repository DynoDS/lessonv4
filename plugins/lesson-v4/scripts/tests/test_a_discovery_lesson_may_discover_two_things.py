"""A discovery lesson may discover more than one thing.

The teacher's decision of 23 September 2026: "If we want them to discover two
things, then isn't the whole point of a discovery lesson giving them a task to
discover that thing? Whether that's a task that gets them to discover both at
the same time, or whether the lesson designer thinks it's better to discover
one thing in one task and then something else in a different task and it
builds on." Until 4.2.285 the route allowed exactly one explanation and one
use, so a finding that needed two ideas had nowhere to put the second.

Either shape keeps the rhythm: each finding is taught why and then used before
the next is taught. The validator and the scaffold each hold a copy of every
route shape, so they must agree on this one too.
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
DISCOVERY = ROOT / "references" / "teaching-sequence-discovery.md"
ROUTE_CHECKS = ROOT / "references" / "design-review-route-checks.md"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


validator = load("validate_lesson_design_two_findings", "validate-lesson-design.py")
scaffold = load("lesson_design_scaffold_two_findings", "lesson-design-scaffold.py")

FIRST = ["question", "explore", "make-sense", "teach-why", "use-learning"]
SHAPES = {
    "one finding": (FIRST + ["finish"], True),
    "a second finding from the same exploration": (FIRST + ["teach-why", "use-learning", "finish"], True),
    "a second exploration that builds on the first": (
        FIRST + ["explore", "make-sense", "teach-why", "use-learning", "finish"], True),
    "three findings": (FIRST + ["teach-why", "use-learning", "explore", "make-sense", "teach-why", "use-learning", "finish"], True),
    "two explanations before either is used": (
        ["question", "explore", "make-sense", "teach-why", "teach-why", "use-learning", "use-learning", "finish"], False),
    "a second explanation with no use after it": (FIRST + ["teach-why", "finish"], False),
    "a second exploration never explained": (FIRST + ["explore", "make-sense", "use-learning", "finish"], False),
    "the explanation before the result is made visible": (
        ["question", "explore", "teach-why", "make-sense", "use-learning", "finish"], False),
    "no finish": (FIRST, False),
    "no question first": (FIRST[1:] + ["finish"], False),
}


class BothProgramsAgreeTests(unittest.TestCase):
    def test_each_shape_is_judged_the_same_by_both(self) -> None:
        for name, (kinds, expected) in SHAPES.items():
            with self.subTest(shape=name):
                self.assertIs(validator.discovery_shape_is_valid(kinds), expected)
                self.assertIs(scaffold.discovery_shape_is_valid(kinds), expected)

    def test_the_scaffold_gate_accepts_both_of_the_teachers_shapes(self) -> None:
        # The gate, not only its helper: a scaffold that went back to the
        # one-finding list would refuse both shapes the teacher asked for.
        for name in ("a second finding from the same exploration", "a second exploration that builds on the first"):
            kinds = SHAPES[name][0]
            with self.subTest(shape=name):
                scaffold.validate_route_shape("Discovery", [], [{"kind": kind} for kind in kinds])

    def test_the_scaffold_refuses_what_the_validator_refuses(self) -> None:
        kinds = SHAPES["two explanations before either is used"][0]
        with self.assertRaises(scaffold.ScaffoldError) as caught:
            scaffold.validate_route_shape("Discovery", [], [{"kind": kind} for kind in kinds])
        self.assertIn("Discovery request must be:", str(caught.exception))


class TheRouteSaysHowTests(unittest.TestCase):
    def test_the_route_names_both_shapes_and_the_rhythm_inside_them(self) -> None:
        text = flat(DISCOVERY)
        self.assertIn("### When the lesson discovers two things", DISCOVERY.read_text(encoding="utf-8"))
        self.assertIn("each finding is taught and then used before the next is taught", text)
        self.assertIn("When one exploration reveals both", text)
        self.assertIn("When the second finding builds on the first, run a second exploration", text)
        self.assertIn("each `Teach why` carries one idea", text)

    def test_the_output_block_states_the_sequence(self) -> None:
        self.assertIn(
            "then for each further finding either `teach-why`, `use-learning` (the same "
            "exploration showed it) or `explore`, `make-sense`, `teach-why`, `use-learning` "
            "(a second exploration), then `finish`",
            flat(DISCOVERY),
        )

    def test_the_reviewer_checks_each_finding_is_explained_and_used(self) -> None:
        self.assertIn(
            "explicit explanation follows each finding, with children using one finding "
            "before the next is taught",
            flat(ROUTE_CHECKS),
        )


if __name__ == "__main__":
    unittest.main()
