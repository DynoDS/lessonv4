from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
VALIDATOR_SRC = ROOT / "scripts" / "validate-lesson-design.py"
SCAFFOLD_SRC = ROOT / "scripts" / "lesson-design-scaffold.py"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
SCAFFOLD_REF = ROOT / "references" / "lesson-design-scaffold.md"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class MathsHelperGapHasAnExitTests(unittest.TestCase):
    """A maths lesson that hit a drawing gap had no legal outcome at all.

    On 1 September 2026 a Year 4 maths run stopped dead:

        LESSON_DESIGN_INVALID: Maths lesson-design may not define initial
        photo-### requirements ... A maths visual the engine cannot draw goes
        through the helper check's substitute route, never an initial photo
        requirement

    The helper check had found a visual the engine could not draw. Its
    documented rescue is the picture route, which adds a `controlled-ai`
    picture requirement and re-runs the design validator. So the message named
    a substitute route whose actual outcome was the very thing it refused, and
    the lesson could neither add the picture nor pass the gate. Every maths
    lesson meeting a drawing gap would have stopped the same way.

    The intent behind the ban was right and is kept: the engine draws number
    lines and bar models, it does not photograph them. What was wrong was
    enforcing it as a subject-wide ban on a mechanism, in a validator that
    cannot see what a picture depicts.
    """

    def test_the_design_gate_accepts_a_maths_photo_requirement(self) -> None:
        """The failure path, at its enforcement point."""
        validator = load(VALIDATOR_SRC, "lesson_design_validator_for_maths_test")
        source = VALIDATOR_SRC.read_text(encoding="utf-8")
        self.assertNotIn("may not define initial photo-### requirements", source)
        # The message must not survive anywhere, since it is the thing that
        # sent the run to a route that does not exist.
        self.assertNotIn("goes through the helper check's substitute", source)
        self.assertTrue(hasattr(validator, "validate_design"))

    def test_the_scaffold_gate_accepts_one_too(self) -> None:
        """Both gates had to open: the scaffold request is written first, so a
        count refused there stops the design before the validator sees it."""
        self.assertNotIn(
            "Maths scaffold request must use", SCAFFOLD_SRC.read_text(encoding="utf-8")
        )

    def test_the_picture_route_is_open_to_every_subject(self) -> None:
        """The rescue route must not name a subject it excludes."""
        playbook = flat(PLAYBOOK)
        route = playbook[playbook.index("### The picture route"):]
        route = route[: route.index("Record the decision as `gap`")]
        self.assertIn("add the visual as a picture", route)
        # Which picture route it takes is the ordinary acquisition decision,
        # not a fixed answer: an object ordinary photography covers tries the
        # real route first, so a host with no image generation still gets a
        # picture instead of losing the visual.
        self.assertIn("its acquisition mode the designer's own rule", route)
        self.assertNotIn("Maths", route)

    def test_the_real_rule_survives_as_a_judgement_where_it_can_be_seen(self) -> None:
        """Removing the ban must not lose what it was protecting. A validator
        cannot tell a photographed bar model from a photographed measuring jug;
        the designer and the reviewer can, and the rule is theirs now - stated
        for every subject, not just the one where it bites most."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn("Never photograph a tool the engine draws.", designer)
        self.assertIn("This holds in every subject", designer)

        reviewer = flat(DESIGN_REVIEWER)
        self.assertIn("whether it is photographing a tool the engine draws", reviewer)
        self.assertIn("The fault is the substitution, never the subject.", reviewer)

    def test_the_two_legitimate_maths_cases_are_named(self) -> None:
        """Discrimination. Without naming them, "maths normally has none" reads
        back as the ban that was just removed."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn('"Normally none" is not "never".', designer)
        self.assertIn("a real-world referent the maths is about rather than a maths tool", designer)
        self.assertIn("the helper check's own rescue route", designer)

    def test_no_document_still_states_the_ban_as_fact(self) -> None:
        """A rule removed from the code and left standing in a reference is a
        rule a designer still obeys."""
        for path in (OUTPUT_TEMPLATE, SCAFFOLD_REF):
            with self.subTest(path=path.name):
                text = flat(path)
                self.assertNotIn("Maths always has an empty", text)
                self.assertNotIn("For Maths, `photoCount` must be 0", text)


if __name__ == "__main__":
    unittest.main()
