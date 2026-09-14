"""The fact is the destination; teaching is the route; the board carries it.

A Year 4 history deck (14 September 2026, engine 4.2.199) reached the user
with its first Teach slide as a photograph, the label `A Tudor farm household`
and nothing to teach from; the route (what a home needs every day, none of it
came from a shop or a switch, look at what she is carrying) was in the notes
he was not reading. Traced: the Lesson Designer had put the destination on
the board and the route in the script, on the strength of an anchor written
from practice slides; the Teach beat was the one beat excused from a
`thinking` line; the reviewer's only calibration detected too much, never too
thin; and a repair split the beat at the page boundary.

He then chose, from four built versions, the Teach boards that are now the
calibration. These tests pin the contract (a Teach carries its route and its
thought), the calibration's presence at both owners, the reviewer's
notes-closed read, and the split rule.
"""

from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
PREFERENCES = ROOT / "references" / "preferences.md"
CONTENT_ROUTE = ROOT / "references" / "teaching-sequence-content-based.md"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
TEACHER_VOICE = ROOT / "references" / "teacher-voice.md"
PLAYBOOK = ROOT / "references" / "slide-composition-playbook.md"
HISTORY = ROOT / "references" / "subject-history.md"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
FOCUSED_REPAIR = ROOT / "agents" / "slide-designer-focused-repair.md"
EXAMPLE = ROOT / "references" / "examples" / "tudor-teach-slides.lesson.json"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ATeachCarriesItsRouteAndItsThought(unittest.TestCase):
    def setUp(self) -> None:
        self.validator = load("validate_lesson_design_route", "validate-lesson-design.py")
        contract = load("test_lesson_design_contract_route", "tests/test_lesson_design_contract.py")
        self.design, self.photos = contract.valid_content_contract()
        self.teach = next(u for u in self.design["teachingSequence"] if u["kind"] == "teach")

    def test_a_teach_with_no_explanation_is_refused_by_name(self) -> None:
        self.teach["content"]["explanation"] = None
        with self.assertRaises(self.validator.ContractError) as refused:
            self.validator.validate_design(self.design, self.photos)
        message = str(refused.exception)
        self.assertIn("route", message)
        self.assertIn("notes closed", message)

    def test_a_teach_with_no_thinking_line_is_refused(self) -> None:
        self.teach["thinking"] = None
        with self.assertRaises(self.validator.ContractError) as refused:
            self.validator.validate_design(self.design, self.photos)
        self.assertIn("On a Teach it is what the class works out while you teach", str(refused.exception))

    def test_a_my_turn_may_still_leave_thinking_null(self) -> None:
        # Discrimination: the modelling beat is still the teacher acting.
        self.assertIn("my-turn", self.validator.NO_PUPIL_ACTION_KINDS)
        self.assertNotIn("teach", self.validator.NO_PUPIL_ACTION_KINDS)
        self.assertNotIn("teach-why", self.validator.NO_PUPIL_ACTION_KINDS)
        self.assertNotIn("teach-needed", self.validator.NO_PUPIL_ACTION_KINDS)

    def test_an_idea_met_only_on_teach_beats_is_still_told_not_used(self) -> None:
        # A Teach now carries a thought, and an idea met only where the teacher
        # presents is still refused: the two sets are different questions.
        self.assertIn("teach", self.validator.TEACHER_PRESENTS_KINDS)
        self.assertTrue(self.validator.NO_PUPIL_ACTION_KINDS < self.validator.TEACHER_PRESENTS_KINDS)


class TheCalibrationIsAtBothOwners(unittest.TestCase):
    def test_preferences_defines_teaching_and_carries_the_chosen_boards(self) -> None:
        text = flat(PREFERENCES)
        self.assertIn("The fact is the destination. Teaching is the route. The slide carries the route.", text)
        self.assertIn("### What a Teach slide holds: the Tudor calibration", text)
        # The chosen boards, verbatim, so the designer writes to them.
        self.assertIn("Every home needs food, a fire and a roof, every single day.", text)
        self.assertIn("Look at her. She isn't being paid to do this. So how does carrying those sticks help her family?", text)
        # And what he rejected, so the amount rule is not the only guard.
        self.assertIn("No shops, no switches", text)
        self.assertIn("over-fragmented", text)
        # The amount calibration from 12 September keeps its heading.
        self.assertIn("### How much a Teach slide holds, calibrated on real boards", text)

    def test_the_content_route_writes_the_explanation_as_the_route(self) -> None:
        text = flat(CONTENT_ROUTE)
        self.assertIn("the route from what the class already has to the sentence the slide lands", text)
        self.assertIn("never `No shops, no switches`", text)
        self.assertIn("A Teach has a thought in it, and `thinking` names it.", text)
        # The teacher-who-does-not-know test survives from 12 September.
        self.assertIn("a teacher who does not already know this content and has not opened the notes", text)

    def test_the_template_and_the_designer_no_longer_excuse_the_teach(self) -> None:
        self.assertIn("that includes a Teach", flat(OUTPUT_TEMPLATE))
        self.assertIn("never a Teach", flat(LESSON_DESIGNER))
        self.assertIn("a Teach is the route in whole sentences", flat(LESSON_DESIGNER))

    def test_the_voice_guide_says_tighter_is_fewer_sentences_not_clipped_ones(self) -> None:
        text = flat(TEACHER_VOICE)
        self.assertIn("tighter means fewer of them than the script, never clipped ones", text)
        # The original calibration (a question, not a paragraph) stays.
        self.assertIn("Which fractions are equivalent?", text)

    def test_the_chosen_specification_ships_with_the_plugin(self) -> None:
        spec = json.loads(EXAMPLE.read_text(encoding="utf-8"))
        slides = spec["slides"]
        self.assertEqual(len(slides), 5)
        self.assertTrue(all(s["template"] == "teach-layout" for s in slides))
        # Three layouts across five slides, and no two consecutive slides
        # share one unless they carry the same beat.
        self.assertEqual(len({s["layout"] for s in slides}), 3)
        for earlier, later in zip(slides, slides[1:]):
            if earlier["layout"] == later["layout"]:
                self.assertEqual(earlier["designUnitId"], later["designUnitId"])
        self.assertTrue(all(s["speakerNotes"].startswith("Say to children:") for s in slides))
        self.assertIn("references/examples/tudor-teach-slides.lesson.json", flat(PREFERENCES))
        self.assertIn("references/examples/tudor-teach-slides.lesson.json", flat(PLAYBOOK))


class TheReviewerReadsTheBoardWithTheNotesClosed(unittest.TestCase):
    def test_the_other_half_of_user_fit(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("The other half of User-fit is whether each Teach board teaches", text)
        self.assertIn("with the `Teacher says:` line covered", text)
        self.assertIn("REVISE on User-fit and a purposeful design defect, because the route is content only the Lesson Designer writes", text)
        # Its limit: not every slide is a Teach board.
        self.assertIn("neither is read as a Teach board", text)


class ATeachBeatSplitsWhereItsTeachingTurns(unittest.TestCase):
    def test_the_playbook_and_the_repair_role_own_the_split(self) -> None:
        self.assertIn("A Teach beat splits where its teaching turns, and both halves are still teaching.", flat(PLAYBOOK))
        self.assertIn("TEACH_SPLIT_LEAVES_A_LABEL", flat(PLAYBOOK))
        self.assertIn("the split falls where the teaching turns, never at the page boundary", flat(FOCUSED_REPAIR))


class TheHistorySketchIsBack(unittest.TestCase):
    def test_the_users_sketch_is_the_calibration_again(self) -> None:
        # Added 4 September 2026 (4.2.99), removed 6 September by a
        # consolidation commit that said it changed no teaching, restored
        # 14 September.
        text = flat(HISTORY)
        self.assertIn("This is a classroom from 1897. What do you notice?", text)
        self.assertIn("Bridget was nearly twelve", text)
        self.assertIn("given as the calibration and not as the template", text)


if __name__ == "__main__":
    unittest.main()
