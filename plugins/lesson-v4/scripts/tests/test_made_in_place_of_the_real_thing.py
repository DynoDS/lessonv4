"""A real thing that cannot be found may be made, and is never passed off.

On 12 October 2026 the teacher had Codex make six real things twice: the
source of the River Severn, the Severn Bridge, the 1675 painting of the Great
Fire, a leather fire bucket, a print of fire hooks and a portrait of Samuel
Pepys. Asked for plainly, every one would have fooled a teacher and each
carried invented facts: a museum card and catalogue number, a royal cypher
fifty years late, mottos nobody wrote, a gilt inscription with the wrong age.
Told what is true of each and to invent nothing, none did.

His rulings from real slides: the search still comes first; when it finds
nothing a made picture may stand in and the slide's words change to match
(`This is what it looks like where the River Severn begins`); an old source
children look at to see what happened may be an artist's picture; a source the
lesson studies as a source stays real.
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))


def load(name: str):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), ROOT / "scripts" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


validator = load("validate-lesson-design")
compiler = load("compile-picture-assignments")

NOTE = "Made in place of the real thing: the source of the River Severn on Plynlimon."
FLAG = "The picture of the source of the Severn was made: no real photograph could be found."


def photo(note: str | None = NOTE, mode: str = "controlled-ai") -> dict:
    return {"id": "photo-012", "filename": "unsplash/severn-source-made.jpg",
            "acquisition_mode": mode, "fallback_note": note}


def lesson(explanation: str, script: str = "Say to children: Look at the picture.",
           flags: tuple[str, ...] = (FLAG,)) -> dict:
    return {
        "teachingSequence": [{
            "sourceUnitId": "lesson-section/teaching-sequence/unit-001",
            "content": {"explanation": explanation},
            "pupilInstruction": None,
            "speakerNotes": {"script": script},
            "photoRefs": ["photo-012"],
        }, {
            "sourceUnitId": "lesson-section/teaching-sequence/unit-002",
            "content": {"explanation": "Look at the photograph of the bridge."},
            "photoRefs": ["photo-006"],
        }],
        "flagsForTeacher": list(flags),
    }


HONEST = "This is what it looks like where the River Severn begins, on a hill in Wales."


class TheWordsBesideAMadePictureTests(unittest.TestCase):
    def check(self, root: dict, photos: list[dict]) -> None:
        validator.validate_made_pictures_are_not_passed_off(root, photos)

    def refused(self, root: dict, photos: list[dict], expected: str) -> None:
        with self.assertRaises(validator.ContractError) as caught:
            self.check(root, photos)
        self.assertIn(expected, str(caught.exception))

    def test_honest_words_pass(self) -> None:
        self.check(lesson(HONEST), [photo()])

    def test_calling_it_a_photograph_is_refused(self) -> None:
        self.refused(lesson("Look at the photograph. This is where the River Severn begins."),
                     [photo()], "calls it a photograph")

    def test_the_spoken_script_is_held_too(self) -> None:
        self.refused(lesson(HONEST, script="Say to children: This photo shows the very spot."),
                     [photo()], "calls it a photograph")

    def test_saying_it_was_made_at_the_time_is_refused(self) -> None:
        self.refused(lesson("This picture was painted at the time, in 1666."),
                     [photo()], "says it was made at the time")

    def test_a_river_source_is_not_a_historical_source(self) -> None:
        """The discrimination case: the word is the lesson's own vocabulary."""
        self.check(lesson("The place where a river begins is called its source. " + HONEST), [photo()])

    def test_the_teacher_note_may_say_it_is_not_a_photograph(self) -> None:
        script = ("Say to children: Look at the picture.\n\nTeacher information: "
                  "this is a made picture, not a photograph.")
        self.check(lesson(HONEST, script=script), [photo()])

    def test_the_teacher_must_be_told(self) -> None:
        self.refused(lesson(HONEST, flags=()), [photo()], "`flagsForTeacher` must tell the teacher")

    def test_it_is_made_not_searched_for_again(self) -> None:
        self.refused(lesson(HONEST), [photo(mode="ordinary-real")], "`controlled-ai`")

    def test_an_ordinary_picture_keeps_its_words(self) -> None:
        """Seventy-four of eighty-six stress-test pictures are found or made
        and say `Look at the photograph`. Nothing here touches them."""
        self.check(lesson("Look at the photograph."), [photo(note=None, mode="ordinary-real")])
        self.check(lesson("Look at the photograph."), [photo(note="A plain note.")])


class EveryMadePictureIsToldToInventNothingTests(unittest.TestCase):
    def test_the_rule_reaches_the_generator_on_every_picture(self) -> None:
        rendered = compiler.render_prompt({
            "filename": "unsplash/fire-bucket.jpg",
            "subject": "An old leather fire bucket",
            "teaching_requirement": "See what people had to fight the fire with.",
            "pedagogical_constraint": "",
            "load_bearing_evidence": ["one leather bucket"],
            "use": "slide",
            "coherent_group": None,
            "coherent_visual_invariants": [],
            "generation_prompt": {
                "physical_state": "One dark leather bucket, empty.",
                "must_avoid": ["a crest or letters on the bucket"],
                "text_rule": "no readable text",
                "composition": "The whole bucket, landscape.",
            },
        })
        truth = rendered[rendered.index("TRUTH:"):]
        for needed in ("Invent nothing", "left out or kept too plain to be wrong",
                       "museum case", "catalogue card", "inscription"):
            self.assertIn(needed, truth)


class TheRuleReachesItsReadersTests(unittest.TestCase):
    def flat(self, *parts: str) -> str:
        return " ".join((ROOT.joinpath(*parts)).read_text(encoding="utf-8").split())

    def test_the_planner_has_the_rule_and_its_limit(self) -> None:
        rule = self.flat("references", "lesson-designer-components.md")
        start = rule.index("**When the real thing cannot be found, it may be made, honestly.**")
        section = rule[start:rule.index("**Name the evidence, not the file.**")]
        for needed in (
            "the search runs first",
            "`Made in place of the real thing:`",
            "The request states what is true",
            "The lesson's words say what it is",
            "The teacher is told",
            "**A source the lesson studies as a source is never made.**",
        ):
            self.assertIn(needed, section)

    def test_the_contract_and_the_run_point_to_it(self) -> None:
        self.assertIn("The one exception is a replacement made after the real search has failed",
                      self.flat("references", "output-template.md"))
        self.assertIn("anything else may be made honestly (Photograph acquisition)",
                      self.flat("skills", "make-lesson", "playbook-lite.md"))

    def test_authentic_evidence_itself_is_still_never_generated(self) -> None:
        self.assertIn("Do not generate authentic evidence",
                      self.flat("references", "image-scout-generation.md"))


if __name__ == "__main__":
    unittest.main()
