"""The teaching reaches the board; a question is not a use; a task is launched.

A Year 4 PSHE agreement lesson (2 September 2026, engine 4.2.77) taught each
of its four enabling ideas as a slogan. The slide for the right to pass read
`Listening and thinking are ways to join in.` / `You can pass without giving a
reason.` beside Chloe's `I'd like to pass`, and a child meeting the idea cold
could fairly ask: pass what? why would I? when am I allowed to? The speaker
notes had the teaching (`Chloe doesn't want to answer this question... In PSHE
you can say "I'd like to pass". You don't have to tell us why. You can still
listen and think, then join in when you're ready.`). The made-up-stories slide
had the same shape, and so did the others.

That is one mechanism with three symptoms, and the teacher named all three:

1. A heading, fact or rule on the board is not the teaching of the idea. The
   lesson designer is told to teach in its script (`if this script were
   deleted, what would the class lose?`) and to keep the slide `tighter`, the
   route's child-facing field was described as `the one focused input`, and
   the slide designer must copy that field exactly and may not add teaching.
   So an explanation that only the script carried could never reach the
   board, and the notes-closed test in Slide Philosophy asked only whether a
   child would know what to do and whether the standard was on screen, both
   of which a slogan-plus-question passes.
2. Questioning is not doing. The rhythm was satisfied by any non-null
   `pupilInstruction`, and the task-centred file suggested `a one-line
   decision on a fictional case`, so a question put to the room counted as
   every child using the idea.
3. Giving a task its instructions is not launching it. The agreement task
   arrived as `Write or draw one rule on a sticky note` with no gathering of
   what the lesson had established, no good rule beside a weak one, and no
   steps, because the only launch guidance sent `framing` to the notes.

Preferences owns each principle; the designer, the two route files, the
catalogue, the reviewer and its routing card carry it to the decision points.
"""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
PREFERENCES = ROOT / "references" / "preferences.md"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
SLIDE_DESIGNER = ROOT / "agents" / "slide-designer.md"
TASK_CENTRED = ROOT / "references" / "teaching-sequence-task-centred.md"
CONTENT_BASED = ROOT / "references" / "teaching-sequence-content-based.md"
DO_BEATS = ROOT / "references" / "do-beats.md"

RULE_TITLE = "A heading, a fact or a rule on the board is not the teaching of it"
QUESTION_TITLE = "Questioning is not doing"
LAUNCH_TITLE = "Giving a task its instructions is not launching it"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def section(path: Path, heading: str) -> str:
    """The text of one `## ` section, from its heading to the next `## `."""
    text = path.read_text(encoding="utf-8")
    start = text.index(f"## {heading}")
    end = text.find("\n## ", start + 1)
    body = text[start:] if end == -1 else text[start:end]
    return " ".join(body.split())


class QuestioningIsNotDoingTests(unittest.TestCase):
    def test_preferences_owns_the_distinction_with_two_tests(self) -> None:
        rhythm = section(PREFERENCES, "The Teach → Do → Teach → Do Rhythm")
        self.assertIn(f"**{QUESTION_TITLE}.**", rhythm)
        self.assertIn(
            "could a child answer it without the idea this slide taught, and could most of the class sit it out",
            rhythm,
        )

    def test_a_discussion_question_can_still_be_the_beat_when_chosen(self) -> None:
        rhythm = section(PREFERENCES, "The Teach → Do → Teach → Do Rhythm")
        self.assertIn("A discussion question can be the Do beat, but it is chosen, not defaulted", rhythm)
        self.assertIn("the form has to make every child commit", rhythm)

    def test_lesson_designer_and_task_centred_route_carry_it(self) -> None:
        self.assertIn("Questioning is not doing: the Do half", flat(LESSON_DESIGNER))
        task = flat(TASK_CENTRED)
        self.assertNotIn("a quick judgement, a sort, a one-line decision on a fictional case", task)
        self.assertIn("is every child using that idea", task)

    def test_content_based_do_and_the_catalogue_point_at_it(self) -> None:
        self.assertIn("a question to the room is a key question, not this beat", flat(CONTENT_BASED))
        self.assertIn("A question put to the room is not one unless it is chosen", flat(DO_BEATS))

    def test_reviewer_checks_each_do_beat_is_a_use(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn(
            "each Do beat or `pupilInstruction` is every child using the idea just taught, not a question to the room",
            text,
        )
        self.assertIn("judge worthwhile use or reasoning across the whole lesson", text)

    def test_the_old_plugin_definition_of_a_do_beat_is_back(self) -> None:
        """Lesson v4's packaging (28 August 2026) softened the Do beat from
        `requires children to use what they just heard`, leaving something
        the teacher can see, to `a chance to process`, and dropped the
        expectation that demand climbs by the last beat before practice and
        the default that matches the form to what was taught. The teacher
        asked for those back (3 September 2026), without the books and
        whiteboards norm."""
        rhythm = section(PREFERENCES, "The Teach → Do → Teach → Do Rhythm")
        self.assertIn("requires every child to use what they have just been told", rhythm)
        self.assertIn(
            "a written answer, a partner's spoken response, a visible decision, a physical position",
            rhythm,
        )
        self.assertIn("Match the form to what was just taught", rhythm)
        self.assertIn("**Climb the demand across the lesson, without forcing a staircase.**", rhythm)
        # September 7 clarification: main practice may supply progression;
        # the last short check can still establish the newly taught knowledge.
        self.assertIn("main practice can supply that progression", rhythm.lower())
        self.assertIn("Do not demand a harder intermediate task solely", rhythm)
        # The caveat survives: an expectation for the shape, not a rule per step.
        self.assertIn("not a rule for each step", rhythm)
        # No device is named as the way to commit.
        self.assertNotIn("whiteboard", rhythm)

    def test_the_catalogue_and_designer_carry_the_restored_definition(self) -> None:
        do_beats = flat(DO_BEATS)
        self.assertIn("It requires every child to use the chunk they have just been taught", do_beats)
        self.assertIn("The shape across the lesson matters more than any single beat", do_beats)
        self.assertIn("A fact may suit recall or a sort", do_beats)
        designer = flat(LESSON_DESIGNER)
        self.assertIn("Every Do beat: every child uses the chunk and leaves something the teacher can see", designer)
        self.assertIn("Demand climbs across lesson", designer)
        self.assertIn("Then match the form to what was just taught", flat(CONTENT_BASED))


class GivingInstructionsIsNotLaunchingTests(unittest.TestCase):
    def test_preferences_owns_the_launch_with_its_parts_and_its_limit(self) -> None:
        philosophy = section(PREFERENCES, "Slide Philosophy")
        self.assertIn(f"**{LAUNCH_TITLE}.**", philosophy)
        self.assertIn("why they are doing it now, what they are making, what a good one looks like and how the work will run", philosophy)
        self.assertIn("Those are beats on the board, not framing prose", philosophy)
        self.assertIn("never the launch crammed on to the instruction", philosophy)
        # The boundary: a short beat, or a familiar product, needs none of it.
        self.assertIn(
            "A short beat children can start from its question alone, and a task whose product they have made before, need none of this",
            philosophy,
        )
        # The older framing-in-notes line survives, scoped to spoken orientation.
        self.assertIn("Framing-in-notes still holds for the teacher's spoken orientation", philosophy)

    def test_task_centred_route_launches_the_doing(self) -> None:
        text = flat(TASK_CENTRED)
        self.assertIn("**Launch the task; do not only instruct it.**", text)
        self.assertIn("They live in `do-task.content.launch`", text)
        self.assertIn("`launch` is `null` only when children can begin from the question alone", text)

    def test_content_based_practise_is_launched(self) -> None:
        self.assertIn("A substantial Practise is launched, not only instructed", flat(CONTENT_BASED))

    def test_lesson_designer_records_the_launch(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("A substantial task is launched before it is instructed", text)
        self.assertIn("or why its question alone is enough", text)

    def test_reviewer_checks_the_launch(self) -> None:
        self.assertIn("a substantial task is launched before it is instructed", flat(DESIGN_REVIEWER))


class TheContentTeachUnitHasAPlaceForTheExplanationTests(unittest.TestCase):
    """The next lesson (3 September 2026, engine 4.2.79) put `You can pass
    without giving a reason` and Theo's example on the board and left `what
    pass means` in the script, because a content Teach unit had nowhere to
    put an explanation: a one-line headline, a one-line takeaway, a text slot
    reserved for sources, and questions. The rule said two or three short
    lines; the contract had no field for them."""

    def test_the_scaffold_and_validator_carry_the_field(self) -> None:
        scaffold = load("lesson_design_scaffold_board", "lesson-design-scaffold.py")
        self.assertIn("explanation", scaffold.CONTENT_ENVELOPE_FIELDS["teach"])
        validator = load("validate_lesson_design_board", "validate-lesson-design.py")
        contract = load("test_lesson_design_contract_board", "tests/test_lesson_design_contract.py")
        design, photos = contract.valid_content_contract()
        teach = next(unit for unit in design["teachingSequence"] if unit["kind"] == "teach")
        teach["content"]["explanation"] = (
            "Sometimes you don't want to answer a question. In PSHE, you can choose to pass.\n"
            "You can say \"I'd like to pass.\" You don't have to explain why."
        )
        validator.validate_design(design, photos)
        # Null was allowed until 14 September 2026, when a Teach board that was
        # a label under a photograph reached the user; the route is required.
        teach["content"]["explanation"] = None
        with self.assertRaises(validator.ContractError) as refused:
            validator.validate_design(design, photos)
        self.assertIn("route", str(refused.exception))
        del teach["content"]["explanation"]
        with self.assertRaises(validator.ContractError):
            validator.validate_design(design, photos)

    def test_the_route_file_documents_the_field_and_its_limit(self) -> None:
        text = flat(CONTENT_BASED)
        # The field keeps its job (the PSHE `pass` slide is still the case it
        # exists for). Its default was flipped to null on 11 September while
        # repairing a slide that said one thing three ways, and three decks
        # then shipped with every Teach explanation empty; writing it is the
        # default again (12 September 2026).
        self.assertIn('"explanation": "the route to the landed sentence, in whole sentences the teacher could say', text)
        self.assertIn("`explanation` is the teaching, as the child reads it", text)
        self.assertIn("So the default is to write it", text)
        self.assertIn("left what pass means in the script", text)
        self.assertIn("It is not the place for the explanation", text)

    def test_downstream_renders_it_as_teaching_lines_and_the_reviewer_names_it(self) -> None:
        """It is still child-facing teaching text kept as its own short lines,
        and since 12 September those lines are composed as separate pieces
        rather than concatenated into one card between the headline and the
        example, which is what the teacher saw and called one big black text."""
        self.assertIn("a content Teach unit's `explanation`, kept as its own short lines", flat(SLIDE_DESIGNER))
        playbook = " ".join((ROOT / "references" / "slide-composition-playbook.md").read_text(encoding="utf-8").split())
        self.assertIn("A content Teach unit's `explanation` is child-facing teaching text", playbook)
        self.assertIn("Compose the explanation's lines as separate pieces, not as one block", playbook)


class TheFormHasASlotForEverythingTheRulesAskForTests(unittest.TestCase):
    """The audit (3 September 2026). The content Teach got its explanation
    slot on 4.2.80 and the next lesson showed the form beats the prose: a
    slot that exists gets filled in its own shape, a slot that does not exist
    leaks into the notes. So the same slot reaches the task-centred teaching
    beat and discovery's teach-why (with a takeaway line), and the two big-task
    beats
    carry a launch. Minutes on every beat were tried here too and taken out
    at the teacher's request the same day."""

    def setUp(self) -> None:
        self.scaffold = load("lesson_design_scaffold_audit", "lesson-design-scaffold.py")
        self.validator = load("validate_lesson_design_audit", "validate-lesson-design.py")
        self.contract = load("test_lesson_design_contract_audit", "tests/test_lesson_design_contract.py")

    def test_every_teaching_beat_has_an_explanation_slot(self) -> None:
        fields = self.scaffold.CONTENT_ENVELOPE_FIELDS
        self.assertIn("explanation", fields["teach"])
        self.assertIn("explanation", fields["teach-needed"])
        self.assertIn("takeaway", fields["teach-why"])
        design, photos = self.contract.valid_task_contract()
        unit = next(u for u in design["teachingSequence"] if u["kind"] == "teach-needed")
        unit["content"]["explanation"] = "You can say \"I'd like to pass.\" You don't have to explain why."
        self.validator.validate_design(design, photos)
        design, photos = self.contract.valid_discovery_contract()
        unit = next(u for u in design["teachingSequence"] if u["kind"] == "teach-why")
        unit["content"]["takeaway"] = {"kind": "sticky", "ref": design["stickyKnowledge"][0]["id"]}
        self.validator.validate_design(design, photos)
        del unit["content"]["takeaway"]
        with self.assertRaises(self.validator.ContractError):
            self.validator.validate_design(design, photos)

    def test_the_big_task_beats_carry_a_launch(self) -> None:
        fields = self.scaffold.CONTENT_ENVELOPE_FIELDS
        self.assertIn("launch", fields["practise"])
        self.assertIn("launch", fields["do-task"])
        design, photos = self.contract.valid_content_contract()
        practise = next(u for u in design["teachingSequence"] if u["kind"] == "practise")
        practise["content"]["launch"] = {
            "established": "We've found what our agreement needs: joining in, passing, privacy, questions, help.",
            "goodLooksLike": "\"Be respectful\" tells you nothing to do. \"Listen while someone else is speaking\" does.",
            "steps": ["Write one rule.", "Combine your group's rules.", "Agree ours."],
        }
        self.validator.validate_design(design, photos)
        practise["content"]["launch"]["goodLooksLike"] = None
        self.validator.validate_design(design, photos)
        practise["content"]["launch"] = {"established": "x", "steps": []}
        with self.assertRaises(self.validator.ContractError):
            self.validator.validate_design(design, photos)
        practise["content"]["launch"] = None
        self.validator.validate_design(design, photos)

    def test_the_launch_is_documented_and_rendered(self) -> None:
        self.assertIn("Its `launch` carries, as the child reads them", flat(CONTENT_BASED))
        playbook = flat(ROOT / "references" / "slide-composition-playbook.md")
        self.assertIn("`launch` takes a slide of its own before the task slide", playbook)
        self.assertIn("a task's `launch`: its `established` line, its `goodLooksLike` pair and each of its `steps`", flat(SLIDE_DESIGNER))
        self.assertIn("the unit's `launch` carries what the lesson has established", flat(DESIGN_REVIEWER))


class ReviewerRoutingReachesSlidePhilosophyTests(unittest.TestCase):
    """The reviewer read Slide Philosophy on no trigger at all, so the one
    section that says what a slide must carry never reached the review."""

    def test_routing_card_opens_slide_philosophy_on_the_three_tells(self) -> None:
        packet = load("design_review_packet_board", "design-review-packet.py")
        routes = dict(packet.PREFERENCE_REVIEW_ROUTES)
        trigger = routes["Slide Philosophy"]
        self.assertIn("lives only in its script", trigger)
        self.assertIn("question to the room", trigger)
        self.assertIn("instructions only", trigger)

    def test_every_routed_heading_exists_in_preferences(self) -> None:
        packet = load("design_review_packet_board_headings", "design-review-packet.py")
        reader = packet._load_reference_reader()
        text = PREFERENCES.read_text(encoding="utf-8")
        for heading, _trigger in packet.PREFERENCE_REVIEW_ROUTES:
            reader.locate(text, heading)
        for name, heading, _why in packet.ALWAYS_READ_REVIEW_SECTIONS:
            reader.locate((PREFERENCES.parent / name).read_text(encoding="utf-8"), heading)


if __name__ == "__main__":
    unittest.main()
