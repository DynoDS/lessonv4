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
PLAYBOOK = ROOT / "references" / "slide-composition-playbook.md"
SLIDE_DESIGNER = ROOT / "agents" / "slide-designer.md"

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
            "vocabularyIntroductionCount": 1,
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
            "explanation": None,
            "modelledOn": "Amira says: \"In PSHE, everyone should tell a true story about themselves.\"",
        },
        pupil_instruction=first_pupil_instruction,
    )
    second = contract.source_unit(
        3,
        "teach-needed",
        {
            "enablingInput": "If you think someone might be unsafe, tell a trusted adult.",
            "explanation": None,
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


class EachBeatChangesTheStateOfTheLessonTests(unittest.TestCase):
    """Flicked through as a deck, the PSHE lesson could be assembled in the
    head but the slides did not carry the story: the starter's discovery
    disappeared, the safety teaching read as an information section, Kai and
    the question box could have moved elsewhere with nothing lost, and the
    biggest move of the lesson (my rule, our rules, our agreement) was the
    small part of three near-identical slides. The first repair (4.2.74) had
    written "a lesson reads as one line" and asked the designer for a row of
    arrows, which labels the order without making one beat depend on the
    last. The teacher's own framing replaces it: each major beat changes the
    state of the lesson and the next builds from that change, the move test is
    a challenge rather than a fault, and repeated reference material recedes
    while the current move leads."""

    def test_preferences_owns_the_state_change_principle(self) -> None:
        text = flat(PREFERENCES)
        self.assertNotIn("A lesson reads as one line", text)
        self.assertIn(
            "Each major beat changes the state of the lesson, and what follows builds from that change",
            text,
        )
        self.assertIn(
            "what children now know, notice, can do, have decided, are wondering or have produced",
            text,
        )
        self.assertIn("a beat carrying a second job that has no beat of its own", text)
        self.assertIn("a run of slides that are all the teacher talking", text)

    def test_the_move_test_is_a_challenge_with_a_stated_boundary(self) -> None:
        """Vocabulary, a routine, a safeguarding note or setup may sit beside
        the spine, and no beat is made to produce an artefact for linking."""
        text = flat(PREFERENCES)
        self.assertIn("The test is movability", text)
        self.assertIn("That is a challenge to answer, not an automatic fault", text)
        self.assertIn(
            "vocabulary, a routine, a safeguarding note or setup can legitimately sit beside the spine",
            text,
        )
        self.assertIn(
            "a beat is never made to produce an artefact so that the next beat has something to name",
            text,
        )
        self.assertIn("forced linking imposes one lesson shape on every subject", text)

    def test_lesson_designer_settles_and_records_the_state_changes(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertNotIn("the lesson line as one row of arrows", text)
        self.assertIn("what each major beat changes", text)
        self.assertIn(
            "the change it makes and the later beat that depends on it, with the link carried in that later beat's own words",
            text,
        )
        self.assertIn("never forced linking", text)

    def test_reviewer_reads_the_beats_as_state_changes(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertNotIn("the lesson reads as one line", text)
        self.assertIn("name what each changes and what later depends on it", text)
        self.assertIn("do not answer it by demanding forced links", text)
        # Route-specific checks are read for the lesson's own route only.
        self.assertIn("design-review-route-checks.md", text)
        checks = flat(ROOT / "references" / "design-review-route-checks.md")
        self.assertIn("arrives one idea at a time with children using each before the next is taught", checks)
        self.assertIn("carries nothing else", checks)


class TitlesTellTheStoryTests(unittest.TestCase):
    """`Still part of the lesson` passed every check that existed, because no
    rule said what a title is for. One owner: Slide Headings in preferences,
    with the designer's unit label named as the seed of the title."""

    def test_slide_headings_owns_the_skim_title_rule(self) -> None:
        text = flat(PREFERENCES)
        self.assertIn("Read the titles alone, in order: they should tell the lesson's story", text)
        self.assertIn("`Still part of the lesson` names a slot", text)

    def test_lesson_designer_labels_name_the_move_and_read_slide_headings(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("A source unit's `label` becomes its slide title", text)
        self.assertIn("never the slot it fills", text)
        self.assertIn("Read `Slide Headings` before writing source-unit labels", text)

    def test_reviewer_reads_labels_in_order_as_titles(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("Read the source-unit labels alone, in order, as the slide titles they become", text)


class ReferenceRecedesAndTheMoveLeadsTests(unittest.TestCase):
    def test_playbook_states_the_hierarchy_rule_with_its_limit(self) -> None:
        text = flat(PLAYBOOK)
        self.assertIn("Repeated reference material recedes; the current move leads", text)
        self.assertIn("Receding is position and proportion, never truncation", text)

    def test_playbook_tells_and_read_back_carry_it(self) -> None:
        text = flat(PLAYBOOK)
        self.assertIn(
            "the same reference panel dominating three consecutive slides while the thing that changed between them sits small",
            text,
        )
        self.assertIn(
            "7. What changed since the last slide, and is that the first thing the eye lands on?",
            text,
        )

    def test_slide_designer_sequence_read_notices_the_change(self) -> None:
        text = flat(SLIDE_DESIGNER)
        self.assertIn("what each unit changes since the one before it", text)


if __name__ == "__main__":
    unittest.main()
