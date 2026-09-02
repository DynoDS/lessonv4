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


class ARuleOnTheBoardIsNotTheTeachingTests(unittest.TestCase):
    def test_preferences_owns_the_rule_with_its_read_back(self) -> None:
        philosophy = section(PREFERENCES, "Slide Philosophy")
        self.assertIn(f"**{RULE_TITLE}.**", philosophy)
        # The notes-closed test now asks whether a child who knew nothing
        # would understand the idea, not only whether they know what to do.
        self.assertIn(
            "would a child who knew nothing before this slide understand what the idea means, "
            "why it matters and what it looks like",
            philosophy,
        )
        self.assertIn("cover the script and read the child-facing lines", philosophy)
        self.assertIn("it never carries the meaning alone", philosophy)

    def test_the_rule_answers_the_more_text_objection_with_form(self) -> None:
        philosophy = section(PREFERENCES, "Slide Philosophy")
        self.assertIn("That is not more text", philosophy)
        self.assertIn("takes two slides doing less each", philosophy)

    def test_the_rule_names_its_limit(self) -> None:
        """A convention or a name has no why a child can use; padding one on
        would be the fault in the other direction."""
        philosophy = section(PREFERENCES, "Slide Philosophy")
        self.assertIn("The limit is a thing with no reason a child can use", philosophy)
        self.assertIn("a manufactured why would only pad the slide", philosophy)

    def test_the_notes_no_longer_own_the_why_and_the_explanation(self) -> None:
        """The old sentence handed `the why-it-matters, the worked-aloud
        explanation` to the notes, which is the licence the slogan used."""
        philosophy = section(PREFERENCES, "Slide Philosophy")
        self.assertNotIn(
            "the framing, the why-it-matters, the worked-aloud explanation", philosophy
        )
        self.assertNotIn(
            "The extended explanation belongs in the speaker notes", philosophy
        )
        self.assertIn("the meaning of the idea does not live there alone", philosophy)

    def test_lesson_designer_reads_tighter_as_fewer_words_not_the_label(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("Tighter is fewer words for the same meaning, not the label for it", text)
        self.assertIn(
            "A script that teaches an idea the slide only names has put the lesson in the notes",
            text,
        )
        # The decisions record settles where each idea's teaching lives.
        self.assertIn(
            "the child-facing lines that carry its meaning, reason and example on the board",
            text,
        )

    def test_task_centred_enabling_input_is_the_teaching_as_the_child_reads_it(self) -> None:
        text = flat(TASK_CENTRED)
        self.assertIn("Short is one idea and a few minutes, not the idea cut to a heading", text)
        self.assertIn(
            "what the idea means, why it matters and what it looks like, in two or three short lines",
            text,
        )
        self.assertNotIn('"enablingInput": "the one focused input children need"', text)
        self.assertIn("never because the script explains it", text)

    def test_content_based_takeaway_is_teaching_not_a_slogan(self) -> None:
        text = flat(CONTENT_BASED)
        self.assertIn("The takeaway stays one line, and it is not the teaching on its own", text)
        self.assertIn(RULE_TITLE, text)

    def test_reviewer_covers_the_script_and_reads_the_board(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("every taught idea reaches the board as teaching, not a label", text)
        self.assertIn("cover each unit's script and read its child-facing content", text)
        self.assertIn(RULE_TITLE, text)

    def test_slide_designer_names_a_slogan_it_cannot_repair(self) -> None:
        text = flat(SLIDE_DESIGNER)
        self.assertIn(
            "one line per unit whose child-facing content states a rule or fact that only its script explains",
            text,
        )


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
        self.assertIn("working with or reasoning with the idea rather than retrieving it", text)

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
        self.assertIn("working with the idea or reasoning with it rather than retrieving it", rhythm)
        # The caveat survives: an expectation for the shape, not a rule per step.
        self.assertIn("not a rule for each step", rhythm)
        # No device is named as the way to commit.
        self.assertNotIn("whiteboard", rhythm)

    def test_the_catalogue_and_designer_carry_the_restored_definition(self) -> None:
        do_beats = flat(DO_BEATS)
        self.assertIn("It requires every child to use the chunk they have just been taught", do_beats)
        self.assertIn("The shape across the lesson matters more than any single beat", do_beats)
        self.assertIn("As a default, a fact suits recall or a sort", do_beats)
        designer = flat(LESSON_DESIGNER)
        self.assertIn("Every Do beat: every child uses the chunk and leaves something the teacher can see", designer)
        self.assertIn("Demand climbs across lesson", designer)
        self.assertIn("Match the form to what was just taught", flat(CONTENT_BASED))


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
        teach["content"]["explanation"] = None
        validator.validate_design(design, photos)
        del teach["content"]["explanation"]
        with self.assertRaises(validator.ContractError):
            validator.validate_design(design, photos)

    def test_the_route_file_documents_the_field_and_its_limit(self) -> None:
        text = flat(CONTENT_BASED)
        self.assertIn('"explanation": "the teaching of that idea as the child reads it', text)
        self.assertIn("`explanation` is the board's teaching of the idea", text)
        self.assertIn("Use `null` only for a name, a convention or a fact that simply is so", text)
        self.assertIn("It is not the place for the explanation", text)
        self.assertIn("is not left asking `what's pass?`", text)

    def test_downstream_renders_it_as_teaching_lines_and_the_reviewer_names_it(self) -> None:
        self.assertIn("a content Teach unit's `explanation`, kept as its own short lines", flat(SLIDE_DESIGNER))
        playbook = " ".join((ROOT / "references" / "slide-composition-playbook.md").read_text(encoding="utf-8").split())
        self.assertIn("render it black, as its own short lines, between the headline and the example it explains", playbook)
        self.assertIn("on a content Teach that teaching is the `explanation` field", flat(DESIGN_REVIEWER))


class OrientationIsNotATeachChunkTests(unittest.TestCase):
    """The same lesson spent a full Teach→Do on what PSHE is for (children
    explained what learning about sleep, jealousy or saving could help
    someone do) before the lesson's own problem arrived. The designer's
    earns-its-place rule said to keep groundwork and link it, and the rhythm
    demanded a Do after every Teach, so orientation became a chunk with a
    manufactured beat that nothing later used."""

    def test_preferences_owns_the_rule_with_its_test_and_limit(self) -> None:
        rhythm = section(PREFERENCES, "The Teach → Do → Teach → Do Rhythm")
        self.assertIn("**Orientation is not a Teach chunk, and it earns no Do beat.**", rhythm)
        self.assertIn("does anything later depend on what children did here", rhythm)
        self.assertIn("orientation wearing a chunk's clothes", rhythm)
        self.assertIn("First: how do we disagree safely?", rhythm)
        self.assertIn("groundwork children must use", rhythm)
        self.assertIn("is a real chunk and keeps its Do", rhythm)

    def test_designer_route_and_reviewer_carry_it(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn("groundwork children will use", designer)
        self.assertIn("it is not a chunk and earns no Do", designer)
        self.assertIn("**The first Teach poses the lesson's problem; orientation folds into it.**", flat(CONTENT_BASED))
        self.assertIn("A Teach→Do pair whose Do nothing later uses is orientation wearing a chunk's clothes", flat(DESIGN_REVIEWER))


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

    def test_the_explanation_slots_are_documented_on_their_routes(self) -> None:
        task = flat(TASK_CENTRED)
        self.assertIn("`enablingInput` is the one line children keep; `explanation` is the teaching as the child reads it", task)
        discovery = flat(ROOT / "references" / "teaching-sequence-discovery.md")
        self.assertIn("The board carries it, not only the script.", discovery)
        self.assertIn("`takeaway` is the one line children keep", discovery)
        skill = flat(ROOT / "references" / "teaching-sequence-skill-based.md")
        self.assertIn("Its `activity` is then the explanation as the child reads it", skill)

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
        text = PREFERENCES.read_text(encoding="utf-8")
        for heading, _trigger in packet.PREFERENCE_REVIEW_ROUTES:
            self.assertIn(f"## {heading}", text, heading)


if __name__ == "__main__":
    unittest.main()
