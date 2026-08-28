#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("validate-lesson-design.py")
SPEC = importlib.util.spec_from_file_location("validate_lesson_design", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


def option_bank() -> dict:
    return {
        "kind": "option-bank",
        "items": [
            {"id": "item-001", "label": "cell"},
            {"id": "item-002", "label": "wire"},
            {"id": "item-003", "label": "lamp"},
            {"id": "item-004", "label": "switch"},
        ],
    }


class OptionBankValidationTests(unittest.TestCase):
    def test_accepts_ordered_option_bank(self) -> None:
        result = validator.validate_task_structure(
            option_bank(),
            "starter.taskStructure",
            unit_photo_refs=set(),
        )
        self.assertEqual(
            [item["label"] for item in result["items"]],
            ["cell", "wire", "lamp", "switch"],
        )

    def test_rejects_duplicate_option_bank_ids(self) -> None:
        invalid = option_bank()
        invalid["items"][1]["id"] = "item-001"
        with self.assertRaisesRegex(
            validator.ContractError,
            "contains duplicate id: item-001",
        ):
            validator.validate_task_structure(
                invalid,
                "starter.taskStructure",
                unit_photo_refs=set(),
            )

    def test_option_bank_refuses_answer_structure(self) -> None:
        with self.assertRaisesRegex(
            validator.ContractError,
            "option-bank answers use answer.content",
        ):
            validator.validate_answer_structure(
                {
                    "kind": "option-bank",
                    "results": [],
                },
                "starter.answer.structure",
                task_structure=option_bank(),
            )


if __name__ == "__main__":
    unittest.main()
