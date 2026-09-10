from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VOICE = ROOT / "references" / "teacher-voice.md"
PREFERENCES = ROOT / "references" / "preferences.md"
AGENTS = ROOT / "agents"

AUTHORING_AGENTS = (
    "lesson-designer.md",
    "adaptation-designer.md",
    "design-reviewer.md",
    "slide-designer.md",
    "worksheet-designer.md",
    "working-wall-designer.md",
    "stick-in-sheets-designer.md",
)

REPAIR_AGENTS = (
    "slide-designer-focused-repair.md",
    "worksheet-designer-focused-repair.md",
    "working-wall-designer-focused-repair.md",
    "stick-in-sheets-designer-focused-repair.md",
)


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TeacherVoiceGuideTests(unittest.TestCase):
    """Child-facing voice kept missing, and the cause was descriptive guidance.

    The teacher rejected the voice of slides, worksheets and wall cards
    across many lessons, then calibrated his actual register with
    evidence-based contrast testing (TVC-001 to TVC-029, 30-31 Aug 2026,
    validated on real lessons: naming electrical appliances, the seven
    continents, friendship boundaries, build-a-circuit). The result is
    `teacher-voice.md`: calibrated examples instead of adjectives. These
    pins keep the guide's load-bearing findings present and keep every
    agent that authors child-facing wording routed to it.
    """

    def test_guide_keeps_the_calibrated_anchors(self) -> None:
        voice = flat(VOICE)
        for anchor in (
            # TVC-003: the informality boundary that survived every retest.
            "Would this sound comfortable if the headteacher were watching?",
            # TVC-004/005/009: slide-vs-notes register split is asymmetric.
            "Do not normally reverse this relationship.",
            # TVC-001/021/022: humour is noticed, never forced or counted.
            "opportunity-sensitive, not quota-based",
            # TVC-011/012/017/018: model answers are their own register, and
            # mechanical sentence symmetry is what makes them sound generated.
            "A model answer is a **separate register**.",
            "Model-answer anti-AI check",
            # The runtime check agents actually run.
            "Final pre-flight check",
        ):
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, voice)

    def test_guide_carries_the_findings_the_first_draft_missed(self) -> None:
        """Three calibration findings were absent from the drafted guide."""
        voice = flat(VOICE)
        # TVC-007: a definition may give the idea before the term.
        self.assertIn("This is called **evaporation**", voice)
        # TVC-008: style varies by sentence function; openings may carry
        # narrative framing while definitions stay plain.
        self.assertIn("Every river has a journey", voice)
        # TVC-001: a normal hyphen, never an em dash, in pupil-facing text.
        self.assertIn("em dashes and en dashes", voice)

    def test_guide_is_year_neutral_and_owns_the_age_judgement(self) -> None:
        """The guide was drafted against Year 4 lessons, and the teacher asked
        for the tailoring to come out (31 Aug 2026): agents follow the
        teacher's voice, and the same voice serves every primary year. The
        KS1/KS2 paragraph moved here from Written Voice so age-of-register
        has one owner."""
        voice = flat(VOICE)
        # Calibration may name the teacher or the age of an example; neither
        # makes the operating guidance exclusive to that year group.
        self.assertIn("The voice is the same across the primary years", voice)
        self.assertIn("KS1 normally needs", voice)
        self.assertIn("KS2 can carry", voice)
        self.assertIn("Neither phase has a sentence-length target", voice)
        self.assertIn("age changes the support, not the humanity", voice)
        preferences = flat(PREFERENCES)
        self.assertNotIn(
            "**KS1 and KS2 change the support, not the humanity.**",
            preferences,
        )
        self.assertIn("owns that judgement", preferences)

    def test_guide_routes_selectively_and_names_its_boundary(self) -> None:
        """A 600-line guide read whole on every run crowds out its own rules,
        and two voice owners drift apart. The guide loads by section and says
        Written Voice owns what words must achieve."""
        voice = flat(VOICE)
        self.assertIn("How to read this file", voice)
        self.assertIn("Written Voice (House Style)", voice)


class TeacherVoiceRoutingTests(unittest.TestCase):
    def test_preferences_pairs_written_voice_with_the_guide(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("calibrated in `teacher-voice.md`", preferences)

    def test_the_slide_conversational_example_is_gone(self) -> None:
        """TVC-005: `Have a look at the fractions below...` is authentically
        the teacher speaking, and he still moved it off the slide into the
        notes. preferences.md used to offer `Have a look at this` as slide
        language, which taught the exact fault the calibration rejected."""
        preferences = flat(PREFERENCES)
        self.assertNotIn(
            "Slides can be conversational and occasionally use natural "
            "teacher-speak such as `Have a look at this`",
            preferences,
        )
        self.assertIn(
            "The slide carries the tighter, curated version of the voice",
            preferences,
        )

    def test_every_wording_authoring_agent_is_routed_to_the_guide(self) -> None:
        for name in AUTHORING_AGENTS:
            with self.subTest(agent=name):
                self.assertIn("teacher-voice.md", flat(AGENTS / name))

    def test_repair_agents_can_follow_a_finding_into_the_guide(self) -> None:
        for name in REPAIR_AGENTS:
            with self.subTest(agent=name):
                self.assertIn("teacher-voice.md", flat(AGENTS / name))

    def test_lesson_designer_runs_the_voice_check_at_completion(self) -> None:
        """The pre-flight is the voice test the Written Voice read-back is
        not; without it the model-answer register has no check anywhere."""
        self.assertIn(
            "Final pre-flight check", flat(AGENTS / "lesson-designer.md")
        )


if __name__ == "__main__":
    unittest.main()
