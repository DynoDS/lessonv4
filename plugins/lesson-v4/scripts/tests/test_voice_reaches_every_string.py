from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
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
        belongs in a script rather than how it reads - and the split was the
        one thing the lesson got right."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn("`teacher-voice.md` §§1-3", designer)
        self.assertIn("§1 and §3 settle HOW IT SOUNDS", designer)
        # The tells, or the rule is an adjective again.
        self.assertIn("do not all receive", designer)
        self.assertIn("what provides the power", designer)

    def test_the_tells_fire_per_component_not_once_at_the_top(self) -> None:
        """Cause three. Voice is a property of every string, so a single
        start-of-run read decays; the worksheet clue set written last was the
        worst rhythm failure in the lesson."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn("Four tells the register has slipped", designer)
        self.assertIn(
            "Voice is a property of every string, not a decision made once",
            designer,
        )
        # It must sit inside the per-component read-back to fire repeatedly.
        components = designer[designer.index("Read every component as child"):]
        self.assertLess(
            components.index("Four tells the register has slipped"),
            components.index("Calculation questions normally full equations"),
        )
        for tell in (
            "a full form where speech contracts",
            "no verb doing the work",
            "a planning word standing where the child needs the thing",
            "adjacent sentences built to the same shape and length",
        ):
            with self.subTest(tell=tell):
                self.assertIn(tell, designer)

    def test_definitions_and_scripts_are_named_in_the_loading_route(self) -> None:
        """The routing named model answers, worked examples and success
        criteria and stopped there, so §5 had no trigger anywhere."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn("§5 a vocabulary definition or explanation", designer)
        self.assertIn("§§1 and 3 a spoken script", designer)
        self.assertIn(
            "Definitions and scripts are the two most often missed", designer
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


if __name__ == "__main__":
    unittest.main()
