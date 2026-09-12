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
