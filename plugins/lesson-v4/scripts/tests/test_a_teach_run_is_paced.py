"""The deck the teacher chose on 28 September 2026, and the rules that make it.

A Year 4 history lesson on how diseases spread was built twice with the same
words: seven slides for the opening, and eleven with one thing to look at on
each. He chose the second: "THIS POWERPOINT is good. Its not a lot of concepts
and abstract things to learn, its broken down nicely, theres visuals and
pictures everywhere." These tests keep the example and the rules it depends on.
"""
from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXAMPLE = ROOT / "references" / "examples" / "diseases-paced-teach-slides.lesson.json"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


PREFERENCES = flat(ROOT / "references" / "preferences.md")
PLAYBOOK = flat(ROOT / "references" / "slide-composition-playbook.md")
DESIGNER = flat(ROOT / "agents" / "lesson-designer.md")
CONTENT = flat(ROOT / "references" / "teaching-sequence-content-based.md")


class TheChosenDeckShips(unittest.TestCase):
    def test_every_teach_slide_has_something_to_look_at(self) -> None:
        spec = json.loads(EXAMPLE.read_text(encoding="utf-8"))
        teach = [s for s in spec["slides"] if s["template"] == "teach-layout"]
        self.assertGreaterEqual(len(teach), 8)
        for slide in teach:
            self.assertTrue(slide.get("pictures"), slide["title"])
        opening = [s for s in teach if s["designUnitId"].endswith("unit-001")]
        self.assertEqual(len(opening), 4)
        self.assertEqual([s["title"] for s in teach].count("Who was John Snow?"), 1)

    def test_it_passes_the_slide_check(self) -> None:
        result = subprocess.run(
            ["node", str(ROOT / "builder" / "scripts" / "check-slide-design.js"), str(EXAMPLE)],
            capture_output=True, text=True, encoding="utf-8",
        )
        self.assertIn("SLIDE_DESIGN_CHECK_OK", result.stdout + result.stderr)

    def test_the_slide_designer_is_pointed_at_it(self) -> None:
        self.assertIn("references/examples/diseases-paced-teach-slides.lesson.json", PREFERENCES)
        self.assertIn("references/examples/diseases-paced-teach-slides.lesson.json", PLAYBOOK)


class TheRulesThatMakeIt(unittest.TestCase):
    def test_pace_is_one_thing_to_look_at_per_slide(self) -> None:
        self.assertIn("**A Teach run is paced: one thing to look at per slide.**", PREFERENCES)
        self.assertIn("It's the information, but paced up.", PREFERENCES)
        self.assertIn("Pacing moves words between slides and never removes them", PREFERENCES)
        self.assertNotIn("a beat splits once", PREFERENCES)
        self.assertNotIn("one split per beat", PLAYBOOK)

    def test_a_picture_is_planned_for_each_thing_the_board_talks_about(self) -> None:
        self.assertIn("asks the question of each group of board lines about one thing", PREFERENCES)
        self.assertIn("**Smallest coherent visual set a task requires.**", DESIGNER)

    def test_the_retelling_comes_before_the_telling(self) -> None:
        text = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        self.assertLess(text.index("**Then the retelling, before a word of the telling.**"),
                        text.index("**Tell the lesson before any slide.**"))
        self.assertIn("never rewrite the lines to fit the telling", DESIGNER)

    def test_words_arrive_before_the_headline_and_title_use_them(self) -> None:
        self.assertIn("so can the beat's `label`, which prints as the slide title above it", CONTENT)
        self.assertIn("A vocabulary card shown earlier is not that introduction", CONTENT)
        self.assertIn("It says which words are about to come up and roughly what they mean", PREFERENCES)
        self.assertNotIn("or straight after the beat whose story brought it in", PREFERENCES)

    def test_the_scene_comes_before_the_headline(self) -> None:
        self.assertIn("The scene comes before it.", PLAYBOOK)
        self.assertIn("Okay, random. You need to set the scene so it doesn't feel as random.", PLAYBOOK)
        self.assertIn("A beat with no scene lines leads with its headline as before.", PLAYBOOK)

    def test_a_chunk_carries_one_new_idea(self) -> None:
        self.assertIn("A chunk carries one new idea, so read each chunk's new things before you keep it.", DESIGNER)
        self.assertIn("the limit is the new things, not the scene", DESIGNER)


if __name__ == "__main__":
    unittest.main()
