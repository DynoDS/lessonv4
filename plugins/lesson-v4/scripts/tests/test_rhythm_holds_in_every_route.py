"""The Teach -> Do rhythm reaches a task-centred lesson, and the route can carry it.

A Year 4 PSHE agreement lesson (2 September 2026, engine 4.2.72) shipped three
distinct safety ideas - the right to pass, made-up names, the adult-help
exception - in one `teach-needed` unit with one critique after all three. The
slide designer spread that unit over three consecutive slides of the teacher
talking, and the question box, which had no beat of its own, was appended to
the conclusion. The teacher's report: no rhythm, every slide its own thing, a
lot of slides where it was all the teacher talking.

Two causes, both mechanical enough to pin.

The scaffold and the design validator permitted exactly one `teach-needed`
unit in a Task-Centred lesson, so the designer, whose friction line says it
expected several, had nowhere to put a second idea except inside the first.
Both now accept one unit per idea, and the validator refuses a `teach-needed`
followed by another whose `pupilInstruction` is null, because that is two
ideas told before children used the first.

The lesson designer's loading route read the rhythm section "only when the
chosen structure uses that rhythm", the role's own summary handed Discovery
and Task-Centred off to "checks suited to routes", and the task-centred file
carried no version of the principle. The reviewer's routing card opened the
section "for Content-based processing". The principle preferences.md calls
load-bearing for every lesson had no owner on this route. It now reads at the
start for every structure, the task-centred file says how it lands there, and
the reviewer's trigger is route-neutral.
"""

from __future__ import annotations

import copy
import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
TASK_CENTRED = ROOT / "references" / "teaching-sequence-task-centred.md"

sys.path.insert(0, str(SCRIPTS / "tests"))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


scaffold = load("lesson_design_scaffold_rhythm", "lesson-design-scaffold.py")
validator = load("validate_lesson_design_rhythm", "validate-lesson-design.py")
packet = load("design_review_packet_rhythm", "design-review-packet.py")
contract = load("test_lesson_design_contract_rhythm", "tests/test_lesson_design_contract.py")


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def task_request(kinds: list[str]) -> dict:
    request = copy.deepcopy(
        {
            "schemaVersion": 1,
            "structure": "Task-Centred",
            "yearGroup": 4,
            "subject": "PSHE",
            "scope": "Complete lesson",
            "vocabularyCount": 3,
            "trimmedVocabularyCount": 0,
            "representations": [],
            "successCriteriaCount": 1,
            "stickyKnowledgeCount": 2,
            "misconceptionCount": 1,
            "concepts": [],
            "teachingSequence": [
                {"kind": kind, "conceptIndex": None} for kind in kinds
            ],
            "endingIncluded": True,
            "worksheet": {
                "status": "generated",
                "resourceMode": "per-child",
                "use": "separate-fresh-worksheet",
                "sheetShape": "question-set",
            },
            "photoCount": 0,
        }
    )
    return request


def two_idea_task_design(first_pupil_instruction: str | None):
    """A task-centred lesson whose task needs two distinct enabling ideas."""
    design, photos = contract.valid_task_contract()
    sequence = design["teachingSequence"]
    first = contract.source_unit(
        2,
        "teach-needed",
        {
            "enablingInput": "If you don't want to share something personal, you can say pass.",
            "modelledOn": "Amira says: \"In PSHE, everyone should tell a true story about themselves.\"",
        },
        pupil_instruction=first_pupil_instruction,
    )
    second = contract.source_unit(
        3,
        "teach-needed",
        {
            "enablingInput": "If you think someone might be unsafe, tell a trusted adult.",
            "modelledOn": "Kai says: \"A worry is private, so keep it to yourself.\"",
        },
    )
    sequence[1:2] = [first, second]
    for index, unit in enumerate(sequence, 1):
        unit["sourceUnitId"] = f"lesson-section/teaching-sequence/unit-{index:03d}"
    return design, photos


class RouteCarriesOneUnitPerIdeaTests(unittest.TestCase):
    def test_scaffold_accepts_one_teach_needed_unit_per_enabling_idea(self) -> None:
        scaffold.validate_request(
            task_request(
                ["set-task", "teach-needed", "teach-needed", "plan-checkpoint", "do-task", "share-conclude"]
            )
        )
        scaffold.validate_request(
            task_request(["set-task", "teach-needed", "teach-needed", "teach-needed", "do-task"])
        )

    def test_scaffold_still_refuses_an_enabling_idea_after_the_doing(self) -> None:
        with self.assertRaises(scaffold.ScaffoldError):
            scaffold.validate_request(
                task_request(["set-task", "do-task", "teach-needed", "share-conclude"])
            )

    def test_validator_accepts_two_ideas_when_children_use_the_first(self) -> None:
        design, photos = two_idea_task_design(
            "Would Amira's rule help everyone take part safely? Explain why."
        )
        validator.validate_design(design, photos)

    def test_validator_refuses_two_ideas_told_before_children_use_the_first(self) -> None:
        design, photos = two_idea_task_design(None)
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_design(design, photos)
        self.assertIn(
            "children use this enabling idea before the next teach-needed unit arrives",
            str(caught.exception),
        )

    def test_the_last_enabling_idea_may_be_used_by_the_task_itself(self) -> None:
        # The single-unit shape every existing task-centred lesson uses, with a
        # null pupilInstruction, still validates: the plan or the task is the use.
        design, photos = contract.valid_task_contract()
        self.assertIsNone(design["teachingSequence"][1]["pupilInstruction"])
        validator.validate_design(design, photos)


class RhythmHasAnOwnerOnEveryRouteTests(unittest.TestCase):
    def test_lesson_designer_reads_the_rhythm_at_the_start_for_every_structure(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertNotIn("only when the chosen structure uses that rhythm", text)
        self.assertNotIn("when Teach-to-Do rhythm exists", text)
        self.assertNotIn("Discovery/Task-Centred use checks/processing suited to routes", text)
        start = text.index("**At the start:**")
        decision_point = text.index("**At the decision point:**")
        self.assertIn("`The Teach → Do → Teach → Do Rhythm`", text[start:decision_point])

    def test_lesson_designer_says_how_the_rhythm_lands_in_a_task_centred_lesson(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("one enabling idea per `teach-needed` unit", text)
        self.assertIn("only the last may be used by the plan or the task itself", text)

    def test_task_centred_file_carries_the_rule_beside_the_unit_it_governs(self) -> None:
        text = flat(TASK_CENTRED)
        self.assertIn("One idea per enabling unit, used before the next arrives", text)
        self.assertIn("Use one `teach-needed` unit per distinct enabling idea", text)
        # The finish carries one job; a homeless routine goes onto the line.
        self.assertIn("The finish carries one job: completing the task", text)

    def test_preferences_states_the_rhythm_holds_in_every_structure(self) -> None:
        text = flat(PREFERENCES)
        self.assertIn("The rhythm holds in every structure", text)
        self.assertIn("Discovery and Task-Centred are not exempt", text)

    def test_reviewer_trigger_for_the_rhythm_is_route_neutral(self) -> None:
        routes = dict(packet.PREFERENCE_REVIEW_ROUTES)
        trigger = routes["The Teach → Do → Teach → Do Rhythm"]
        self.assertNotIn("Content-based", trigger)
        self.assertIn("in any route", trigger)


class LessonReadsAsOneLineTests(unittest.TestCase):
    """The teacher should be able to flick through the deck and see where it
    is going. Nothing in the system asked for that before."""

    def test_preferences_names_the_line_and_its_two_tells(self) -> None:
        text = flat(PREFERENCES)
        self.assertIn("A lesson reads as one line", text)
        self.assertIn("A beat carrying a second job that has no beat of its own", text)
        self.assertIn("a run of slides that are all the teacher talking", text)
        # The limit: an order of beats, not a story-shaped device.
        self.assertIn("not for a narrative device or a story-shaped hook", text)

    def test_lesson_designer_settles_and_records_the_line(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("the line of the lesson: the beats in order", text)
        self.assertIn("the lesson line as one row of arrows, beat by beat", text)

    def test_reviewer_reads_the_beats_as_a_line(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("the lesson reads as one line", text)
        self.assertIn("arrives one idea at a time with children using each before the next is taught", text)
        self.assertIn("carries nothing else", text)


if __name__ == "__main__":
    unittest.main()
