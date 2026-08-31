from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
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

    Since 4.2.46 the invariant is also enforced: the lesson-design validator
    rejects a stored prefix, so a slip becomes a validator failure inside the
    designer's bounded repair passes instead of a slide the class reads twice.
    The behavioural test lives in test_lesson_design_contract.py.
    """

    def test_the_builder_still_owns_the_prefix(self) -> None:
        """If this ever stops being true, the guidance below is wrong."""
        self.assertIn("'LO: ' + lo", HEADERS.read_text(encoding="utf-8"))

    def test_the_validator_owns_the_enforcement(self) -> None:
        validator = (ROOT / "scripts" / "validate-lesson-design.py").read_text(
            encoding="utf-8"
        )
        self.assertIn("no 'LO:' prefix", validator)

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
