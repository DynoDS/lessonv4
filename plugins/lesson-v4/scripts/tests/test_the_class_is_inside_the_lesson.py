"""The rest of the 12 September pass on the first three built decks.

Daniel's remaining notes after the four repaired in 4.2.146. Each is a place
where the lesson is correct and the child is outside it.

- The chipped tooth arrived "abstract, random or sudden": the deck taught the
  three layers, then showed a chip and asked which layer was uncovered, never
  having said that teeth chip or why.
- `From the inside out` and `Name the layers` are "basically the same thing".
- `Name A, B and C.` should be "Label each letter with the name of that layer.
  Use the word bank to help you", with the instruction on top and the picture
  centred below "so I could write next to each label in the deadspace".
- `It's a wet break indoors. Suggest a safe way to be active.` should be
  "Imagine it's wet break time" then "What could you do to still be active?"
- `A class already dances most days` "feels off": "they need to connect with
  the class that dances, they need it relatable, they need to imagine its them
  and its personal".
- A PSHE slide leant on balancing, coordination and fitness without teaching
  any of them, so "teacher is explaining words instead of landing the teaching
  moments".
- A slide of four true black sentences: "its all black too. Could have used
  little images or the sticky knowledge star thing if they are sticky
  knowledge."
"""
from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PREFERENCES = ROOT / "references" / "preferences.md"
VOICE = ROOT / "references" / "teacher-voice.md"
DESIGNER = ROOT / "agents" / "lesson-designer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheChildIsInsideTheSituation(unittest.TestCase):
    def test_imagine_invites_where_a_statement_reports(self) -> None:
        voice = flat(VOICE)
        self.assertIn("Put the child inside the situation, then ask them", voice)
        self.assertIn("Imagine it's wet break time", voice)
        self.assertIn("a question to them rather than an instruction about a task", voice)

    def test_an_invented_class_is_somebody_a_child_can_be(self) -> None:
        voice = flat(VOICE)
        self.assertIn("`A class already dances most days` is a fact about strangers", voice)
        self.assertIn("The test is whether a child could be in it", voice)

    def test_the_two_colours_follow_the_two_jobs(self) -> None:
        """The scene tells and the question asks, which the colour rule
        already owns; this names which half is which."""
        self.assertIn("the scene tells, so it is black; the question asks, so it is blue", flat(VOICE))


class AnInstructionNamesTheWayIn(unittest.TestCase):
    def test_the_rule_and_the_worked_pair(self) -> None:
        voice = flat(VOICE)
        self.assertIn("Say what to do, and where the way in is", voice)
        self.assertIn("`Name A, B and C.` is three words", voice)
        self.assertIn("Use the word bank to help you", voice)
        self.assertIn("name the support that is on the slide", voice)

    def test_the_deliberate_puzzle_is_excepted(self) -> None:
        voice = flat(VOICE)
        self.assertIn("the prompt whose difficulty is the point", voice)
        self.assertIn("pointing at a word bank would hand it over", voice)


class ACaseArrivesWithItsContext(unittest.TestCase):
    def test_the_rule_names_the_cost_and_the_repair(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("A case arrives with the context that makes it make sense", preferences)
        self.assertIn("abstract, random and sudden", preferences)
        # The cost is attachment, not comprehension: the task is answerable either way.
        self.assertIn("the child has nothing to attach it to", preferences)
        self.assertIn("One sentence, before the case", preferences)

    def test_it_has_a_test_a_designer_can_run(self) -> None:
        self.assertIn(
            "could a child say why they are being shown this, before they are asked the question about it",
            flat(PREFERENCES).lower(),
        )


class TwoBeatsDoingTheSameJob(unittest.TestCase):
    def test_the_completion_pass_reads_the_demands_not_the_labels(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("**Same job twice:**", designer)
        self.assertIn("name what each one asks a child to do, in your own words rather than by its label", designer)

    def test_it_does_not_catch_a_second_instance_of_an_idea(self) -> None:
        """4.2.132 wants the same question over new evidence. This must not
        read as an argument against it."""
        designer = flat(DESIGNER)
        self.assertIn("This is not the rule against a second instance of an idea", designer)
        self.assertIn("two beats over the same evidence asking for the same thing", designer)


class AWordTheTeachingLeansOn(unittest.TestCase):
    def test_the_test_runs_from_the_teaching_back_to_the_words(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("A word the teaching leans on is taught", preferences)
        self.assertIn("find the words a child has to already hold for a sentence to land", preferences)
        self.assertIn("spends the beat explaining vocabulary rather than landing the teaching", preferences)

    def test_three_repairs_in_order_with_a_card_last(self) -> None:
        """A card is the expensive answer, and the vocabulary set is capped,
        so plainer words come first."""
        preferences = flat(PREFERENCES)
        self.assertIn("say it in words the class already has", preferences)
        self.assertIn("or give it a card", preferences)
        self.assertIn("What is not a repair is leaving it and hoping", preferences)


class TheChildHasRoomToWriteAndSomethingToLookAt(unittest.TestCase):
    def test_the_instruction_goes_on_top_when_they_write_beside_a_figure(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("the instruction goes on top and the figure sits centred below it", preferences)
        self.assertIn("the margins either side become the writing room", preferences)
        # Bounded, or it reorders every slide that has a picture.
        self.assertIn("it applies when they write on or beside the figure", preferences)

    def test_a_wall_of_black_has_a_named_repair(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("A slide that is one wall of black text has a repair", preferences)
        self.assertIn("mark it as one and it takes the star treatment", preferences)
        self.assertIn("the wall is the sameness, not the length", preferences)


if __name__ == "__main__":
    unittest.main()


class ImagineDoesNotBecomeATic(unittest.TestCase):
    """Daniel, the same day the rule landed: "am I going to see `imagine` all
    the time now." The word is the obvious opener and a model reaches for the
    concrete example it was given, so the rule needs the bound that the humour
    section already applies to a light line."""

    def test_the_test_is_the_child_not_the_word(self) -> None:
        voice = flat(VOICE)
        self.assertIn("The word `Imagine` is one way there and must not become the way", voice)
        self.assertIn("started having a habit", voice)

    def test_other_routes_are_named_so_there_is_somewhere_else_to_go(self) -> None:
        voice = flat(VOICE)
        self.assertIn("A class in Year 3 has dance lessons three times a week", voice)
        self.assertIn("You've got a wet break", voice)
        self.assertIn("start from the thing rather than the frame", voice)

    def test_a_real_thing_is_not_imagined(self) -> None:
        voice = flat(VOICE)
        self.assertIn("a real event, a real place or a real person is not imagined", voice)


class TheBoardsOwnSentenceComesFirst(unittest.TestCase):
    """Daniel on the chip slide: "I don't like how this sentence flows ...
    I would have said 'This tooth has lost a piece of enamel.' 'Sometimes,
    teeth can be chipped or broken if they ...'" The class is looking at the
    tooth, so the first line they read should be about the tooth."""

    def test_the_rule_and_the_worked_pair(self) -> None:
        voice = flat(VOICE)
        self.assertIn("Start with what is on the board, then generalise", voice)
        self.assertIn("the first sentence they read should be about the tooth", voice)
        self.assertIn("the small version of a whole deck that defines before it shows", voice)

    def test_the_limit_keeps_a_rule_and_its_example_the_right_way_round(self) -> None:
        voice = flat(VOICE)
        self.assertIn("a slide whose general statement is the teaching", voice)
        self.assertIn("there the statement leads and the example follows", voice)


class ThePlayfulDecisionIsWrittenDown(unittest.TestCase):
    """Three decks in a row came out with no light moment anywhere, including
    a teeth lesson whose tooth types Daniel had previously said hand one over.
    The question was being asked at the completion pass, where the cheapest
    answer is to change nothing."""

    def test_the_answer_is_recorded_in_the_closing_decisions(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("Write the answer down, in one line, in the walk-through's closing decisions", designer)
        self.assertIn("Name what the material offered and what you did with it", designer)

    def test_the_diagnosis_of_why_none_kept_winning_is_stated(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("the cheapest answer is to change nothing", designer)
        self.assertIn("A line you have to write is a decision", designer)

    def test_none_is_still_a_real_answer(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("`None` is still a perfectly good answer and stays common", designer)
        self.assertIn("Most lessons hand over nothing", designer)


class HowMuchATeachSlideHolds(unittest.TestCase):
    """His verdicts on real Teach slides, 12 September 2026, as the anchor the
    Pride Lessons do not give: they are practice slides, and a Teach slide is
    the other case."""

    def test_the_three_verdicts_are_recorded(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("How much a Teach slide holds, calibrated on real boards", preferences)
        self.assertIn("Right, and one more thing would be too much", preferences)
        self.assertIn("Slightly over", preferences)

    def test_the_working_ceiling_is_stated(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("about four pieces of text beside its picture", preferences)
        self.assertIn("the slide is over on pieces rather than on words", preferences)

    def test_teaching_that_will_not_fit_gets_a_slide_not_the_script(self) -> None:
        """My first instruction sent every over-long line to the script, and on
        one slide that moved the only place an idea was taught. Daniel: "if
        theyre important could they have gone to more slides?" """
        preferences = flat(PREFERENCES)
        self.assertIn("There are two repairs, and which one you owe depends on what the extra line is", preferences)
        self.assertIn("A line the final task needs is teaching, always, and may never be moved to the script", preferences)
        self.assertIn("reach for the second slide first", preferences)
        self.assertIn("the deck is allowed to be longer, and the board is not", preferences)

    def test_it_is_not_a_word_count(self) -> None:
        """The slide he called right carries a long sentence across its whole
        width; the slide he called over carries seven short ones."""
        preferences = flat(PREFERENCES)
        self.assertIn("What none of these judgements is about is word count", preferences)


class ALightLineHasATurnInIt(unittest.TestCase):
    """A teeth deck got a light line added and Daniel's reaction was "you call
    that humour?" The line was true, relevant, gently worded and not light.
    Section 4 said where opportunities come from and never how to tell a found
    one from a plain fact delivered wryly."""

    def test_the_calibrated_pair_is_his_own(self) -> None:
        voice = flat(VOICE)
        self.assertIn("A light line has a turn in it; a true sentence said kindly does not", voice)
        self.assertIn("rather than all applying for the same one", voice)
        self.assertIn("while enamel and dentine do all the hard work", voice)

    def test_the_test_is_the_turn_and_it_is_sayable(self) -> None:
        voice = flat(VOICE)
        self.assertIn("What the first has and the second has not is a **turn**", VOICE.read_text(encoding="utf-8"))
        self.assertIn("find the moment where the sentence does something you did not expect", voice)

    def test_no_turn_means_no_light_line_rather_than_a_weaker_one(self) -> None:
        voice = flat(VOICE)
        self.assertIn("you have written a sentence about the content, which is fine", voice)
        self.assertIn("A light line you had to reach for is not one", voice)
        self.assertIn("the class hears the delivery arrive and nothing land", voice)


class ALightLineCompetesForTheBoard(unittest.TestCase):
    """Two rules quietly cancelled each other. Section 4 says a light line has
    no fixed home and may sit on the slide; the Teach-slide ceiling is stated
    in pieces, so a board already holding four had no room for a fifth and the
    line went to the script by default. Daniel: "humour can go on slides too
    yaknow, it doesnt have to live in speaker notes, is that in plugin?" It
    was, and the amount rule was overruling it."""

    def test_the_line_is_one_of_the_four_rather_than_an_extra(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("A light line is one of the things this budget is for", preferences)
        self.assertIn("demoted for a reason that has nothing to do with where it belonged", preferences)
        self.assertIn("it does not do is lose automatically because it arrived last", preferences)

    def test_the_placement_rule_it_protects_is_still_there(self) -> None:
        voice = flat(VOICE)
        self.assertIn("A light line can sit on the slide where children read it themselves", voice)
        self.assertIn("There is no fixed home", voice)


class LookHarderWithoutLoweringTheBar(unittest.TestCase):
    """"now slides are simple and better, a bit of humour would make me like
    them more but has to be funny" (12 September 2026). Both halves are
    instructions, and the second is the one a model drops."""

    def test_the_lean_board_is_the_reason_to_look_again(self) -> None:
        voice = flat(VOICE)
        self.assertIn("Now there is room, so look harder, and refuse harder", voice)
        self.assertIn("on a slide holding four things it is the one a child reads twice", voice)

    def test_the_bar_does_not_move_with_the_appetite(self) -> None:
        voice = flat(VOICE)
        self.assertIn("The bar does not move with the appetite", voice)
        self.assertIn("a flat line is not a smaller version of that", voice)
        self.assertIn("write none and mean it", voice)
