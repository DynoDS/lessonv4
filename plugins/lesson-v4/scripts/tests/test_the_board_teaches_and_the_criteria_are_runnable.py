"""Four repairs from the first three decks Codex built on the new structure.

Daniel read `Round to the nearest 10 and 100`, `Name the layers of teeth` and
`How can being active help my mind and body` on 12 September 2026 and was
happy with the structure: the journeys, the headings, the as-and-when
vocabulary and the two maths rules all worked. Four faults in what reached
the board.

1. The Teach board stopped teaching. Every Teach beat in the teeth deck wrote
   `explanation: null`, and every Teach beat in all four decks built that week
   wrote `keyQuestions: []`, so a teach slide was a picture, a heading and one
   sticky sentence. Daniel: "if the teacher wasn't confident what enamel was,
   but didn't use the speaker notes, they'd find it hard to actually teach the
   children anything apart from 'this is where the enamel is on the tooth'."
   The explanation default was flipped to null on 11 September while repairing
   a slide that said one thing three ways; saying one thing three ways and
   saying what it is, why it is there and what it does are different, and the
   repair took the second with the first.

2. A success criterion has to be runnable by the weakest child. `Find the
   neighbouring multiples.` is short, imperative, specific and actionable and
   passes every rule in the guide. Daniel: "doesn't help dumb kids." And
   `Already a multiple? Keep it and stop.` is not part of running the method,
   so as a step it stops every child on every question for a case most of them
   do not have; his own answer was a star note under the steps.

3. The criteria panel rode on all four answer slides of the maths deck, where
   it takes a third of the board beside the answers nobody is checking it
   against.

4. Question labels reached a science deck, including `(1)` on a slide holding
   one instruction. Daniel: "with question numbers, lets just leave that for
   maths. We didnt need question numbers anywhere here (this is a change in my
   teaching from the github master version days)."
"""
from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PREFERENCES = ROOT / "references" / "preferences.md"
VOICE = ROOT / "references" / "teacher-voice.md"
CONTENT_ROUTE = ROOT / "references" / "teaching-sequence-content-based.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheTeachBoardTeaches(unittest.TestCase):
    def test_writing_the_explanation_is_the_default(self) -> None:
        route = flat(CONTENT_ROUTE)
        self.assertIn("So the default is to write it", route)
        self.assertIn("`explanation` is the teaching, as the child reads it", route)
        # What it carries, in the child's terms.
        self.assertIn("what it is, why it is there, what it does, what it has to do with them", route)

    def test_the_two_faults_are_held_apart(self) -> None:
        """Or the repair for one becomes the other."""
        route = flat(CONTENT_ROUTE)
        self.assertIn("Saying the same thing three ways is the fault above", route)
        self.assertIn("saying what it is, why it is there and what it does is three different things", route)

    def test_the_test_is_a_teacher_who_does_not_know_the_content(self) -> None:
        route = flat(CONTENT_ROUTE)
        self.assertIn("a teacher who does not already know this content and has not opened the notes", route)
        self.assertIn("The children learn a label rather than a layer", route)
        # Null stays available, as the exception you can defend.
        self.assertIn("`null` is the exception you can defend", route)

    def test_a_key_question_is_not_a_second_response_demand(self) -> None:
        route = flat(CONTENT_ROUTE)
        self.assertIn("A key question is not a second response demand competing with the Do", route)
        self.assertIn("makes them look at the thing while you are teaching it", route)
        self.assertIn("Most Teach beats earn one", route)


class CriteriaAreRunnableByTheWeakestChild(unittest.TestCase):
    def test_the_register_test_is_on_the_step_not_its_shape(self) -> None:
        voice = flat(VOICE)
        self.assertIn("Read each step as an instruction to the weakest child in the class", voice)
        self.assertIn("the shape of a step and not the test of one", voice)
        # The worked pair, so the distinction is recognisable.
        self.assertIn("`Find the neighbouring multiples.`", voice)
        self.assertIn("each side of your number", voice)

    def test_a_rare_condition_is_a_note_not_a_step(self) -> None:
        voice = flat(VOICE)
        self.assertIn("A condition that does not happen every time is not a step", voice)
        self.assertIn("stops every child on every question to rule out a case most of them do not have", voice)
        # The every-time condition keeps its home in the steps, as a sentence.
        self.assertIn("A condition the method meets every time stays in the steps as a sentence", voice)


class ThePanelComesOffTheAnswerSlide(unittest.TestCase):
    def test_the_rule_and_its_reason(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("And they come off the answer slide", preferences)
        self.assertIn("the panel beside it is the one thing nobody looks at", preferences)

    def test_it_does_not_take_the_panel_off_teaching_and_practice(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("On the teaching and practice slides that is correct", preferences)
        self.assertIn("The criteria belong on the My Turn slide and on practice slides", preferences)


class QuestionLabelsAreForMaths(unittest.TestCase):
    def test_the_starter_is_numbered_in_every_subject(self) -> None:
        """Corrected within the hour: "I didnt mean starters, starters should
        still have them." A starter is the matching case in every lesson."""
        preferences = flat(PREFERENCES)
        self.assertIn("The starter is numbered in every subject", preferences)
        self.assertIn("every starter numbers its questions, whatever the subject", preferences)

    def test_after_the_starter_labels_are_for_maths(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("After the starter, labels are for maths and nothing else", preferences)
        self.assertIn("in every other subject, number the starter and nothing else on the slides", preferences)
        # The reason, so it generalises rather than being a bare ban.
        self.assertIn("so a child can match what they wrote to the answer being read out", preferences)

    def test_worksheets_keep_theirs_because_the_key_is_separate(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("keep bracketed numbers for independent questions in every subject", preferences)
        self.assertIn("the answer key is a separate sheet and has to match", preferences)

    def test_maths_keeps_its_existing_scheme(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("In maths, My Turn has no question label", preferences)
        self.assertIn("Your Turn starts at (1)", preferences)


if __name__ == "__main__":
    unittest.main()


class TheExplanationIsSeparatePiecesNotABlock(unittest.TestCase):
    """4.2.146 got the teaching onto the board and the composition put every
    line of it in one black card. Daniel, with three hand-built mock-ups of the
    same science slide: "teaching doesnt have to be all together grouped all
    black. paragraph breaks, different places, different colours etc."

    Two of his three mock-ups use no colour at all: one lifts the first line to
    a full-width statement across the top, the other places each line against
    the part it describes. That is the repair, and it is composition.
    """

    COMPOSITION = ROOT / "references" / "slide-composition-playbook.md"
    PROFILE = ROOT / "references" / "teacher-slide-visual-profile.md"

    def test_the_lines_are_composed_as_separate_pieces(self) -> None:
        composition = flat(self.COMPOSITION)
        self.assertIn("Compose the explanation's lines as separate pieces, not as one block", composition)
        self.assertIn("a slab of them in one card is three sentences a child reads as a paragraph", composition)

    def test_the_arrangements_are_built_layouts_not_described_shapes(self) -> None:
        """Superseded on 13 September 2026. Naming three shapes in prose left
        the cheapest one to assemble, a column of cards down one side, as the
        one every Teach slide of the next unsupervised deck used. The good
        arrangements are now named layouts the builder draws, and the check
        refuses a Teach unit built any other way; see
        builder/test/teach-layouts.test.js for what is built."""
        composition = flat(self.COMPOSITION)
        self.assertIn("slide is `template: \"teach-layout\"` with a `layout`", composition)
        self.assertIn("`TEACH_SLIDE_NEEDS_TEACH_LAYOUT`", composition)
        self.assertIn("**The next Teach slide takes a different layout.**", composition)
        self.assertIn("`TEACH_LAYOUT_REPEATED`", composition)
        # The column down one side is no longer offered as the first good shape.
        self.assertNotIn("stacked as separate cards down one side", composition)

    def test_the_choice_is_made_by_what_each_line_is_about(self) -> None:
        composition = flat(self.COMPOSITION)
        self.assertIn("a line about one part sits next to that part", composition)
        self.assertIn("concatenated into one black card because they arrived in one field", composition)

    def test_one_line_may_be_orange_and_layout_comes_first(self) -> None:
        """Daniel settled the colour question the same day: "Orange was fine
        to break up black teach, we should do that." Orange is free on a Teach
        slide because its existing text job tints a value a question hands the
        child, and a Teach slide is not asking."""
        profile = flat(self.PROFILE)
        self.assertIn("One line of a Teach slide's explanation may be orange, and only one", profile)
        self.assertIn("a Teach slide is not asking", profile)
        self.assertIn("which line you would say louder", profile)
        # Layout is still the first reach.
        self.assertIn("Reach for layout first", flat(self.COMPOSITION))

    def test_the_three_bounds_hold_the_permission(self) -> None:
        """Without these it becomes the tic Daniel asked about on the last
        rule the same afternoon."""
        profile = flat(self.PROFILE)
        self.assertIn("One line per slide", profile)
        self.assertIn("Not on every Teach slide", profile)
        self.assertIn("has a tic rather than a voice", profile)
        self.assertIn("never touches the sticky line", profile)
        # And not a line carrying a taught term: a PSHE slide put a whole line
        # in orange around the green word `Oxygen` and the term stopped reading
        # as vocabulary.
        self.assertIn("nor a line carrying a taught vocabulary term", profile)
        self.assertIn("the term wins and the line loses", profile)
        # And the general case is unchanged outside that one permission.
        self.assertIn(
            "Outside that one case, prominence on a black explanatory line is still size, position and spacing",
            profile,
        )
