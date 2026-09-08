"""A criteria panel is a glance reference beside the work, so the validator
refuses criteria that cannot be read as one: a sixth step, or a table cell
that has become a sentence.

Two lessons of 7-8 September 2026 showed what happens when it does not. A
six-step list (four steps plus two "Exchange...?" conditions written as steps)
could not fit the panel at a readable size, so the slide designer showed four
or five steps per slide and split the six practice questions across four
slides to match. A history criteria table whose cells read "A detail from each
period that supports your comparison." took half of every slide it sat on, and
the practice question beside it shrank to 10pt.
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import test_lesson_design_contract as contract  # noqa: E402


def load_validator():
    spec = importlib.util.spec_from_file_location(
        "vld", ROOT / "scripts" / "validate-lesson-design.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class CriteriaFitAGlanceTests(unittest.TestCase):
    def test_five_short_steps_still_validate(self):
        module = load_validator()
        design, photos = contract.valid_contract()
        design["successCriteria"][0]["content"]["steps"] = [
            "Find the thousands column.",
            "Add one thousand, or take one away.",
            "Full column? Exchange ten for one.",
            "Keep the hundreds, tens and ones.",
            "Write the number.",
        ]
        module.validate_design(design, photos)

    def test_a_sixth_step_is_refused_and_the_message_names_the_branch(self):
        module = load_validator()
        design, photos = contract.valid_contract()
        design["successCriteria"][0]["content"]["steps"] = [
            "Find the thousands column.",
            "Subtracting with no thousands? Exchange one ten thousand.",
            "1,000 more? Add one thousand.",
            "Ten thousands? Exchange them for one ten thousand.",
            "Keep the hundreds, tens and ones the same.",
            "Write the number, keeping any zeros it needs.",
        ]
        with self.assertRaises(module.ContractError) as caught:
            module.validate_design(design, photos)
        self.assertIn("has 6 steps", str(caught.exception))
        self.assertIn("reference-table", str(caught.exception))

    def test_a_step_carrying_its_reason_is_refused_and_the_message_says_why(self):
        module = load_validator()
        design, photos = contract.valid_contract()
        # The circuits lesson's own step: the "to close the loop" was taught on
        # the Teach slide, and eight words of panel went on repeating it.
        design["successCriteria"][0]["content"]["steps"][0] = (
            "Connect the lamp back to the cell to close the loop"
        )
        with self.assertRaises(module.ContractError) as caught:
            module.validate_design(design, photos)
        message = str(caught.exception)
        self.assertIn("cap 8", message)
        self.assertIn("the reason", message)

    def test_a_criteria_table_cell_that_is_a_sentence_is_refused(self):
        module = load_validator()
        design, photos = contract.valid_contract()
        design["successCriteria"][0] = {
            "id": "sc-001",
            "type": "reference-table",
            "drawLive": False,
            "content": {
                "columns": ["Your comparison", "What it shows"],
                "rows": [
                    ["Continuity", "What children did in both periods."],
                    ["Change", "What was different between the periods."],
                    ["Source detail", "A detail from each period that supports your comparison."],
                ],
            },
        }
        with self.assertRaises(module.ContractError) as caught:
            module.validate_design(design, photos)
        self.assertIn("rows[2][1] is 9 words", str(caught.exception))
        self.assertIn("label or a short action", str(caught.exception))

    def test_a_label_sized_table_still_validates(self):
        module = load_validator()
        design, photos = contract.valid_contract()
        design["successCriteria"][0] = {
            "id": "sc-001",
            "type": "reference-table",
            "drawLive": True,
            "content": {
                "columns": ["Question says", "Operation"],
                "rows": [["altogether", "add"], ["difference", "subtract"]],
            },
        }
        module.validate_design(design, photos)

    def test_the_guidance_names_the_caps_so_they_cannot_drift(self):
        skill_route = flat(ROOT / "references" / "teaching-sequence-skill-based.md")
        self.assertIn("the validator refuses a sixth", skill_route)
        self.assertIn("the validator refuses a step past 8", skill_route)
        preferences = flat(ROOT / "references" / "preferences.md")
        self.assertIn(
            "refuses a sixth step, a step past eight words and a cell past eight words",
            preferences,
        )
        self.assertIn("A table of facts the child reads is a representation, not the criteria", preferences)


if __name__ == "__main__":
    unittest.main()
