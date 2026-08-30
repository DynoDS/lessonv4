"""Reference loading has one owner per agent, and heavy references load at
their trigger rather than at startup.

The failures behind these pins: lesson-designer.md carried two live loading
instructions for preferences.md - an early "read it in full" and the canonical
selective route at the end of the file - so a run could legally start by
swallowing the whole 100KB file the selective route exists to keep out of
context. Separately, three exact-copy designers preloaded the full Written
Voice section they rarely use, several agents preloaded the whole brief-gap
protocol against a gap most runs never meet, and a "when unsure, read it too"
sentence gave every one of them an open door out of selective loading.
"""

from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
WORKSHEET_DESIGNER = ROOT / "agents" / "worksheet-designer.md"
WALL_DESIGNER = ROOT / "agents" / "working-wall-designer.md"
STICK_IN_DESIGNER = ROOT / "agents" / "stick-in-sheets-designer.md"
ADAPTATION_DESIGNER = ROOT / "agents" / "adaptation-designer.md"
SLIDE_DESIGNER = ROOT / "agents" / "slide-designer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
GAP = ROOT / "references" / "brief-gap-protocol.md"

EXACT_COPY_DESIGNERS = (WORKSHEET_DESIGNER, WALL_DESIGNER, STICK_IN_DESIGNER)
ALL_DESIGNERS = EXACT_COPY_DESIGNERS + (
    LESSON_DESIGNER,
    ADAPTATION_DESIGNER,
    SLIDE_DESIGNER,
)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class LessonDesignerLoadingOwnerTests(unittest.TestCase):
    def test_preferences_loading_has_exactly_one_owner(self) -> None:
        text = read(LESSON_DESIGNER)
        # The eager instruction that contradicted the canonical route.
        self.assertNotIn("`preferences.md` full (precedence)", text)
        self.assertNotIn("preferences.md` full", text)
        # The early bullet defers to the canonical section instead.
        self.assertIn(
            "follow `Reference Files - precedence and decision-point loading`",
            text,
        )
        # The canonical route still exists and still reads selectively.
        self.assertIn(
            "## Reference Files - precedence and decision-point loading", text
        )
        self.assertIn(
            "Read the introduction and contents of `preferences.md`", text
        )
        self.assertIn("**At the decision point:**", text)


class WrittenVoiceRoutingTests(unittest.TestCase):
    def test_exact_copy_designers_route_written_voice_conditionally(self) -> None:
        for path in EXACT_COPY_DESIGNERS:
            text = read(path)
            with self.subTest(agent=path.name):
                # The printed-wording habits still reach every printed surface
                # (the planning-name-on-a-wall-card repair stays honoured).
                self.assertIn(
                    "Three habits keep any printed child-facing wording plain",
                    text,
                )
                # The rest of Written Voice waits for its trigger.
                self.assertIn("Read the rest of Written Voice only when", text)

    def test_adaptation_designer_still_preloads_written_voice(self) -> None:
        # The adaptation-designer authors new child-facing questions on every
        # run, so for it Written Voice is startup guidance, per preferences.md.
        self.assertIn(
            "your sections: Written Voice", read(ADAPTATION_DESIGNER)
        )

    def test_preferences_still_carries_the_exact_copy_rule_and_habits(self) -> None:
        text = read(PREFERENCES)
        self.assertIn(
            "An agent that normally copies settled wording exactly reads "
            "Written Voice only",
            text,
        )
        self.assertIn(
            "Three habits keep any printed child-facing wording plain", text
        )

    def test_no_designer_keeps_the_read_it_too_escape_hatch(self) -> None:
        # "When unsure whether a section touches the task, read it too" undoes
        # selective loading exactly when context is already under pressure.
        for path in ALL_DESIGNERS:
            with self.subTest(agent=path.name):
                self.assertNotIn("read it too", read(path))


class BriefGapProtocolRoutingTests(unittest.TestCase):
    def test_protocol_no_longer_calls_itself_standing_context(self) -> None:
        text = read(GAP)
        self.assertNotIn("A standing instruction for every downstream", text)
        self.assertIn("opens this protocol only when a real gap", text)
        # The principle every specialist carries inline stays one line here.
        self.assertIn("never invent or reword content to bridge a gap", text)

    def test_agents_load_the_protocol_at_its_trigger_not_at_startup(self) -> None:
        for path, trigger in (
            (WORKSHEET_DESIGNER, "leave unread until the brief asks"),
            (WALL_DESIGNER, "leave unread until the lesson-design's anchor"),
            (ADAPTATION_DESIGNER, "leave unread until the lesson-design's brief"),
            (SLIDE_DESIGNER, "only when no documented route can preserve"),
        ):
            with self.subTest(agent=path.name):
                text = read(path)
                self.assertIn(trigger, text)
                self.assertNotIn("applies on every run", text)
                self.assertIn("brief-gap-protocol.md", text)


if __name__ == "__main__":
    unittest.main()
