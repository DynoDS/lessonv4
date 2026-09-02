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
        self.assertIn("never the rule alone", text)

    def test_content_based_takeaway_is_teaching_not_a_slogan(self) -> None:
        text = flat(CONTENT_BASED)
        self.assertIn("the takeaway is teaching, not a slogan", text)
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
        self.assertIn("The example and non-example are the last `teach-needed` unit", text)
        self.assertIn("the gathering line and the steps open `do-task.content.activity`", text)
        self.assertIn("A task children can begin from its question alone", text)

    def test_content_based_practise_is_launched(self) -> None:
        self.assertIn("A substantial Practise is launched, not only instructed", flat(CONTENT_BASED))

    def test_lesson_designer_records_the_launch(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("A substantial task is launched before it is instructed", text)
        self.assertIn("or why its question alone is enough", text)

    def test_reviewer_checks_the_launch(self) -> None:
        self.assertIn("a substantial task is launched before it is instructed", flat(DESIGN_REVIEWER))


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
