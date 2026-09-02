"""A lesson's playful opportunity is judged once, against its material.

The teacher's report on the Year 4 History lesson (2 September 2026, engine
4.2.83): "was any humour used in this lesson? could it have been? i havent seen
one yet." Not one light line in the starter, the seven scripts, the models or
the ending. The material had handed over at least two easy ones: a Tudor prince
painted at about a year old in cloth of gold, and a Roman school carving.

Two causes.

`teacher-voice.md` section 4 was never routed to the lesson designer at all. The
designer's reference map routes the guide's numbered sections by the kind of
string being written - section 5 for a definition, sections 1 and 3 for a
script, section 8 for a model answer. A playful opportunity is not a kind of
string, so it had no entry and the section was never opened.

The one place the question did reach the designer was the final pre-flight
check, whose ten questions are run "over the same strings". Nine of them can be
answered by looking at one string. The playful one cannot, and asked sentence by
sentence at the end of a long run it can only ever be answered no. The reviewer
carried the same question inside the same per-string sweep, with the same
result.

A third fault was in the guidance itself, found while repairing the first two.
Section 4 named the lesson's misconception as the easiest opportunity and gave
it the worked example, so the route that is available in every lesson was also
the most prominent. Routing the designer there would have produced a wry remark
about the wrong answer in every deck, which the teacher named before it shipped:
"dont always want it in misconceptions?"

Section 4 now leads with six routes, the misconception last, and says plainly
that sameness across lessons is the failure while silence is not. The question
is asked once, of the lesson's material, at the completion pass, by both the
designer and the reviewer. Placement stays open: slide, script or both.
"""

from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
TEACHER_VOICE = ROOT / "references" / "teacher-voice.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheGuideOffersMoreThanTheMisconceptionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(TEACHER_VOICE)

    def test_it_names_several_routes_rather_than_one_default(self) -> None:
        self.assertIn("Where the opportunities actually come from", self.text)
        self.assertIn("none of them the default", self.text)

    def test_the_material_itself_leads_and_the_wrong_idea_comes_last(self) -> None:
        source = self.text.index("**The source, photograph or object the class is looking at.**")
        wrong_idea = self.text.index("**The lesson's own wrong idea, taken seriously for a second.**")
        self.assertLess(source, wrong_idea)

    def test_every_route_carries_an_example_in_the_teachers_voice(self) -> None:
        for example in (
            "He's about one year old here. Imagine wearing that to play out.",
            "The Romans didn't travel all the way to Britain for the weather!",
            "Priya's bought forty-seven melons. We won't ask why.",
            "You've made it work. Now break it.",
            "It doesn't need to be a masterpiece",
            'One apple isn\'t a magic "balanced diet" button!',
        ):
            self.assertIn(example, self.text)

    def test_no_example_uses_a_dash_the_teacher_does_not_write(self) -> None:
        section = self.text[
            self.text.index("# 4. Humour and personality") : self.text.index(
                "# 5. Explanations and definitions"
            )
        ]
        self.assertNotIn("—", section)
        self.assertNotIn("–", section)

    def test_repeating_one_route_across_lessons_is_named_as_the_failure(self) -> None:
        self.assertIn("Sameness across lessons is the failure, not silence", self.text)
        self.assertIn("stopped having a voice and started having a habit", self.text)

    def test_placement_stays_open_rather_than_becoming_a_slot(self) -> None:
        self.assertIn(
            "can sit on the slide where children read it themselves, or in the script",
            self.text,
        )
        self.assertIn("giving it one turns it into a slot to fill", self.text)

    def test_a_straight_lesson_is_not_a_faulty_lesson(self) -> None:
        self.assertIn("Most lessons hand over nothing", self.text)
        self.assertIn("is not a lesson with a fault", self.text)


class ThePreFlightAsksItOfTheLessonNotOfEachStringTests(unittest.TestCase):
    def test_the_playful_question_says_it_is_asked_once(self) -> None:
        text = flat(TEACHER_VOICE)
        self.assertIn(
            "Asked once for the whole lesson, not of each sentence",
            text,
        )
        self.assertIn("Per sentence this question can only ever be answered no", text)

    def test_the_other_pre_flight_questions_are_untouched(self) -> None:
        text = flat(TEACHER_VOICE)
        self.assertIn("**If humour is present, did the content genuinely invite it?**", text)
        self.assertIn("**Does this sound natural, or suspiciously polished?**", text)


class BothAgentsAskItAtTheEndWithTheMaterialInViewTests(unittest.TestCase):
    def test_the_designer_asks_it_at_the_completion_pass(self) -> None:
        text = flat(LESSON_DESIGNER)
        completion = text.index("## One Completion Pass, Then Done")
        self.assertIn(
            "the playful-opportunity one is asked once, of the lesson",
            text[completion:],
        )
        self.assertIn("the sources, pictures, real facts, numbers and people", text[completion:])

    def test_the_designer_is_told_why_asking_it_while_writing_fails(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn(
            "how a whole lesson comes out correct and completely flat",
            text,
        )

    def test_section_four_is_routed_by_moment_not_by_kind_of_string(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("§4 is routed by moment rather than by kind of string", text)
        self.assertIn("read it once at the completion pass, not while authoring", text)

    def test_the_designer_is_warned_off_the_misconception_becoming_the_default(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("reach past the lesson's wrong idea", text)
        self.assertIn("mannerism rather than a voice", text)

    def test_the_reviewer_judges_it_against_the_material_not_each_string(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn(
            "Judge this one once, against the lesson's material rather than against each string",
            text,
        )
        self.assertIn("correct in every sentence and flat all the way through", text)

    def test_the_reviewer_may_not_report_a_lesson_that_offers_nothing(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn(
            "A lesson that offers nothing keeps its straight face and that is not a finding",
            text,
        )

    def test_the_reviewer_leaves_placement_to_the_moment(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("on the slide or in the script as the moment suits", text)


if __name__ == "__main__":
    unittest.main()
