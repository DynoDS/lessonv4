from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
# When the pipeline split deciding from wording, the register craft these
# tests pin moved to the role that now writes every finished string. The
# failures they guard are wording-time failures, so they are pinned where
# the wording is written.
AUTHOR = ROOT / "agents" / "lesson-author.md"
PREFERENCES = ROOT / "references" / "preferences.md"
VOICE = ROOT / "references" / "teacher-voice.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class VoiceReachesEveryStringTests(unittest.TestCase):
    """The voice guide was wired at four points and failed at the others.

    A Y4 Science appliances lesson built on 31 Aug 2026, AFTER the guide
    entered the pipeline, came back with the guide's named surfaces right and
    its unnamed surfaces wrong. Correct: the slide-versus-script split (§2,
    named in the script route), model answers (§8), success criteria (§10),
    "Is Dev right?" (§12) - all named in the loading route. Wrong: the
    vocabulary card `A portable source of electrical energy for a device`
    (§5, named nowhere), the scripts `Electrical appliances do not all
    receive electricity in the same way` and `Look closely at what provides
    the power` (§§1 and 3, reachable only through a start-of-run read), the
    instructions `Use both photographs to complete the classification` and
    `then complete the source and job`, and a worksheet clue set of four
    identically shaped two-sentence blocks.

    Three causes, three repairs pinned here.
    """

    def test_the_definition_rule_no_longer_pays_for_compression(self) -> None:
        """Cause one. The routed rule said "short" four times, and the
        cheapest way to obey is to nominalise, so the battery card passed
        every test in front of it while teaching nothing."""
        preferences = flat(PREFERENCES)
        self.assertIn(
            "a sentence a teacher would actually say to the class, with a "
            "verb doing the work",
            preferences,
        )
        self.assertIn("the shortness follows", preferences)
        # The real card, kept as the counter-example that made the point.
        self.assertIn(
            "A portable source of electrical energy for a device", preferences
        )
        # "one breath" must not read as a prize for squeezing.
        self.assertIn(
            "not a phrase squeezed until it fits", preferences
        )

    def test_the_script_route_reaches_how_it_sounds(self) -> None:
        """Cause two. The script was routed to §2 alone, which governs what
        belongs in a script rather than how it reads. What belongs where is
        the decider's; how it reads now lives with the words writer."""
        author = flat(AUTHOR)
        self.assertIn("§§1 and 3 for a spoken script", author)
        # The tells, or the rule is an adjective again.
        self.assertIn("do not all receive", author)
        self.assertIn("what provides the power", author)
        # And the decider keeps the split itself: script versus slide.
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "the script carries the fuller conversational register", designer
        )

    def test_the_tells_fire_per_component_not_once_at_the_top(self) -> None:
        """Cause three. Voice is a property of every string, so a single
        start-of-run read decays; the worksheet clue set written last was the
        worst rhythm failure in the lesson. The words writer checks each
        string as it goes."""
        author = flat(AUTHOR)
        self.assertIn("check each string against them as you go", author)
        for tell in (
            "A full form where speech contracts",
            "No verb doing the work",
            "A planning word standing where the child needs the thing",
            "Adjacent sentences built to the same shape and length",
        ):
            with self.subTest(tell=tell):
                self.assertIn(tell, author)

    def test_definitions_and_scripts_are_named_in_the_loading_route(self) -> None:
        """The routing named model answers, worked examples and success
        criteria and stopped there, so §5 had no trigger anywhere."""
        author = flat(AUTHOR)
        self.assertIn("§5 for a definition or explanation", author)
        self.assertIn("§§1 and 3 for a spoken script", author)
        self.assertIn(
            "Definitions and scripts are the two most often missed", author
        )

    def test_the_vocabulary_decision_point_carries_the_pointer(self) -> None:
        """Routing at the end of the file is not routing at the decision."""
        self.assertIn(
            "never a noun phrase compressed until it is short",
            flat(LESSON_DESIGNER),
        )

    def test_the_guide_itself_was_not_edited_for_this_repair(self) -> None:
        """The teacher's calibrated wording is his; the repair is wiring.
        §5 must still be the section the new routing points at."""
        voice = flat(VOICE)
        self.assertIn("# 5. Explanations and definitions", voice)
        self.assertIn("An electrical appliance is something that uses "
                      "electricity to work.", voice)


class ScriptTeachesRatherThanDirectsTests(unittest.TestCase):
    """Two script lines survived the 4.2.29 register repair unchanged, across
    two runs of the Y4 appliances lesson:

        "Use that to decide whether Dev's rule holds."
        "Use the photographs as evidence and use the success criteria to
         check each decision."

    Neither is a contraction or abstraction fault, so the two tells added then
    could not catch either. The fault is different in kind: the script narrates
    what the child should do with the materials instead of saying the thing the
    teacher is there to say, so deleting it would cost the class nothing.
    """

    def test_a_third_tell_covers_directing_instead_of_teaching(self) -> None:
        # The decider must spec the idea the script exists to hand over, or
        # the fault is unfixable downstream; stage directions are its tell.
        designer = flat(LESSON_DESIGNER)
        self.assertIn("stage directions rather than teaching", designer)
        # And the words writer re-runs the same test over the sentence it
        # actually wrote.
        author = flat(AUTHOR)
        self.assertIn("a **script** must still teach", author)

    def test_both_surviving_lines_are_named_with_their_repair(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "Use the photographs as evidence and use the success criteria to "
            "check each decision",
            designer,
        )
        self.assertIn(
            "having a plug isn't what makes something electrical",
            designer,
        )
        # The adult idiom, folded in beside the abstraction it belongs with -
        # a wording-time fault, pinned where the wording is written.
        author = flat(AUTHOR)
        self.assertIn("decide whether Dev's rule holds", author)
        self.assertIn("so, is Dev right?", author)

    def test_the_tell_is_checkable_rather_than_an_adjective(self) -> None:
        """"Sound natural" is what failed twice; a deletion test can be run,
        and both halves of the split run it - the decider over its spec, the
        words writer over its sentence."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "if this script were deleted, what would the class actually lose?",
            designer,
        )
        author = flat(AUTHOR)
        self.assertIn(
            "could be deleted and the class would lose nothing but the "
            "running order",
            author,
        )

    def test_the_first_two_tells_survive(self) -> None:
        author = flat(AUTHOR)
        self.assertIn("do not all receive", author)
        self.assertIn("what provides the power", author)


if __name__ == "__main__":
    unittest.main()
