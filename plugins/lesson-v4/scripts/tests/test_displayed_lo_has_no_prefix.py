from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VALIDATOR = ROOT / "scripts" / "validate-lesson-design.py"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
TEMPLATE = ROOT / "references" / "output-template.md"
HEADERS = ROOT / "builder" / "src" / "headers.js"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class DisplayedLoHasNoPrefixTests(unittest.TestCase):
    """A Y4 Science lesson shipped `displayedLo` as `LO: To name electrical
    appliances`, which the builder renders as `LO: LO: To name electrical
    appliances` on the starter slide, because it adds the prefix itself.

    Cause: the agent and the preferences both wrote the format as
    `LO: To [verb] [object]`, so the prefix read as part of the stored value,
    while the schema shows `"displayedLo": "To ..."`. Three descriptions of
    one thing, two of them wrong about where the prefix comes from.
    """

    def test_the_builder_still_owns_the_prefix(self) -> None:
        """If this ever stops being true, the guidance below is wrong."""
        self.assertIn("'LO: ' + lo", HEADERS.read_text(encoding="utf-8"))

    def test_the_schema_stores_the_objective_without_the_prefix(self) -> None:
        self.assertIn('"displayedLo": "To ..."', flat(TEMPLATE))

    def test_the_designer_says_the_field_carries_no_prefix(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "`displayedLo` holds `To [verb] [object]` and nothing else",
            designer,
        )
        # The failure it prevents, named so the rule carries its reason.
        self.assertIn("LO: LO: To name electrical appliances", designer)

    def test_preferences_distinguishes_the_board_from_the_stored_value(
        self,
    ) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn(
            "The stored objective is the \"To ...\" part alone", preferences
        )
        # The old wording made the prefix look like part of the value.
        self.assertNotIn(
            "Slide format is **LO: To [verb] [object]**", preferences
        )


class PhotoBudgetIsNotTheRunCeilingTests(unittest.TestCase):
    """The same lesson used exactly 16 photographs against a ceiling of 16,
    leaving no room for an adaptation, helper or repair picture. One number
    was doing two jobs: the designer's budget and the run's ceiling."""

    def test_the_designer_is_told_its_budget(self) -> None:
        """It was never given the number, so it could only discover the limit
        by being rejected at the validator."""
        designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "Your picture budget is 16 across the whole design", designer
        )
        self.assertIn("not the run's ceiling", designer)

    def test_the_two_limits_are_defined_separately(self) -> None:
        script = (ROOT / "scripts" / "check-photo-cap.py").read_text(
            encoding="utf-8"
        )
        self.assertIn("MAX_PHOTOS = 16", script)
        self.assertIn("RUN_MAX_PHOTOS = 24", script)

    def test_post_design_stages_check_the_run_ceiling(self) -> None:
        contract = (ROOT / "scripts" / "photo-contract.py").read_text(
            encoding="utf-8"
        )
        self.assertIn('"--stage", "run"', contract)

    def test_the_validator_no_longer_caps_at_the_design_budget(self) -> None:
        """It runs after the adaptation merge, so a 16 here would have made
        the run ceiling unreachable."""
        validator = (ROOT / "scripts" / "validate-lesson-design.py").read_text(
            encoding="utf-8"
        )
        self.assertIn("at most 24 photos", validator)
        self.assertNotIn("at most 16 photos", validator)

    def test_the_playbook_does_not_send_a_late_need_back(self) -> None:
        playbook = flat(ROOT / "skills" / "make-lesson" / "playbook-lite.md")
        self.assertIn(
            "16 is the **design** budget, not the run's ceiling", playbook
        )
        self.assertIn(
            "Do not send a real late need back to be cut", playbook
        )


if __name__ == "__main__":
    unittest.main()


def _validator():
    import importlib.util

    spec = importlib.util.spec_from_file_location("lesson_design_validator", VALIDATOR)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class DisplayedLoIsTheTeachersWordsTests(unittest.TestCase):
    """A Y4 Geography plan said `To describe and give examples of a biome and
    find the location and some features of the Amazon rainforest`; the deck
    showed `To describe and give examples of biomes, and locate and describe
    the Amazon rainforest`. The old rule asked for "the shortest form that
    preserves the learning", which reads as licence to rewrite. The board
    objective is the teacher's own words, cut short at a tacked-on tail at
    most."""

    def setUp(self) -> None:
        self.ok = _validator().displayed_lo_is_the_objective_or_its_opening

    def test_the_reworded_geography_objective_is_refused(self) -> None:
        self.assertFalse(self.ok(
            "To describe and give examples of a biome and find the location "
            "and some features of the Amazon rainforest.",
            "To describe and give examples of biomes, and locate and describe "
            "the Amazon rainforest",
        ))

    def test_the_objective_word_for_word_passes(self) -> None:
        lo = ("To describe and give examples of a biome and find the location "
              "and some features of the Amazon rainforest.")
        self.assertTrue(self.ok(lo, lo.rstrip(".")))
        self.assertTrue(self.ok(lo, lo))

    def test_a_tacked_on_tail_may_be_cut_at_its_join(self) -> None:
        self.assertTrue(self.ok(
            "To solve problems involving time conversions: hours/minutes, "
            "minutes/seconds", "To solve problems involving time conversions"))
        self.assertTrue(self.ok(
            "To add two-digit numbers using partitioning",
            "To add two-digit numbers"))
        self.assertTrue(self.ok(
            "Plan a fair test, deciding what I will change",
            "To plan a fair test"))

    def test_a_cut_that_is_not_at_a_join_is_refused(self) -> None:
        self.assertFalse(self.ok(
            "To add two-digit numbers using partitioning", "To add two-digit"))
        self.assertFalse(self.ok("To find 10 and 100 more or less", ""))

    def test_the_validator_wires_the_check_in(self) -> None:
        source = VALIDATOR.read_text(encoding="utf-8")
        self.assertIn(
            "displayed_lo_is_the_objective_or_its_opening(lesson[\"lo\"], "
            "lesson[\"displayedLo\"])", source)

    def test_the_designer_no_longer_asks_for_a_shortened_objective(self) -> None:
        designer = flat(LESSON_DESIGNER)
        self.assertNotIn("shortened displayed LO header", designer)
        self.assertIn("The board objective is the teacher's words, not yours", designer)
        preferences = flat(PREFERENCES)
        self.assertNotIn("uses the shortest form that preserves the learning", preferences)
