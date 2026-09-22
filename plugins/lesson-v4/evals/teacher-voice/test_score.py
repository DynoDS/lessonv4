from __future__ import annotations

import json
import unittest
from pathlib import Path

from score import (
    EvaluationDataError,
    load_gold_cases,
    load_input_cases,
    load_predictions,
    merge_cases,
    score,
)


ROOT = Path(__file__).resolve().parent
INPUT = ROOT / "calibration-input.json"
GOLD = ROOT / "calibration-gold.json"
BASELINE_INPUT = ROOT / "existing-10-input.json"
BASELINE_GOLD = ROOT / "existing-10-gold.json"
HELD_OUT = ROOT / "held-out-input.json"


class TeacherVoiceFixtureTests(unittest.TestCase):
    def test_calibration_has_all_requested_cases_and_surfaces(self) -> None:
        inputs = load_input_cases(INPUT)
        gold = load_gold_cases(GOLD)
        self.assertEqual(len(inputs), 32)
        self.assertEqual({case["id"] for case in inputs}, {case["id"] for case in gold})
        self.assertEqual(
            {case["surface_type"] for case in inputs},
            {
                "teach_explanation",
                "speaker_note",
                "success_criteria",
                "sticky_knowledge",
                "question",
                "model_answer",
            },
        )
        expected_by_wording = {
            case["wording"]: gold_case["expected"]
            for case, gold_case in zip(inputs, gold)
        }
        self.assertEqual(
            expected_by_wording[
                "A habit of regular meals helps us through the day. Leaving a long gap without food can leave us hungry and tired."
            ],
            "REPAIR",
        )
        self.assertEqual(
            expected_by_wording[
                "Explain how your change helps the body."
            ],
            "KEEP",
        )

    def test_frozen_baseline_still_has_ten_cases(self) -> None:
        inputs = load_input_cases(BASELINE_INPUT)
        gold = load_gold_cases(BASELINE_GOLD)
        self.assertEqual(len(inputs), 10)
        self.assertEqual([case["id"] for case in inputs], [case["id"] for case in gold])
        self.assertEqual(
            [(case["id"], gold_case["expected"]) for case, gold_case in zip(inputs, gold)],
            [
                ("voice-001", "REPAIR"),
                ("voice-002", "REPAIR"),
                ("voice-003", "KEEP"),
                ("voice-004", "KEEP"),
                ("voice-005", "REPAIR"),
                ("voice-006", "KEEP"),
                ("voice-007", "REPAIR"),
                ("voice-008", "KEEP"),
                ("voice-009", "REPAIR"),
                ("voice-010", "KEEP"),
            ],
        )

    def test_held_out_file_has_no_gold_fields_or_answers(self) -> None:
        # The held-out set may hold cases; what it may never hold is an answer.
        # A human labels these separately, so a label reaching this file would
        # let a blind run read its own gold.
        raw = json.loads(HELD_OUT.read_text(encoding="utf-8"))
        self.assertNotIn("gold", raw)
        self.assertNotIn("expected", raw)
        self.assertNotIn("rationale", raw)
        for case in raw["cases"]:
            for field in ("expected", "rationale", "decision", "prediction"):
                self.assertNotIn(field, case, f"{field} leaked into {case['id']}")


class TeacherVoiceScorerTests(unittest.TestCase):
    def _all_inputs(self):
        return merge_cases(
            (BASELINE_INPUT, INPUT),
            load_input_cases,
        )

    def _all_gold(self):
        return merge_cases(
            (BASELINE_GOLD, GOLD),
            load_gold_cases,
        )

    def test_perfect_predictions_report_every_requested_metric(self) -> None:
        inputs = self._all_inputs()
        gold = self._all_gold()
        predictions = {case["id"]: case["expected"] for case in gold}
        report = score(inputs, gold, predictions)

        self.assertEqual(report["total"], 42)
        self.assertEqual(report["overall_accuracy"], 1.0)
        self.assertEqual(report["catch_rate"], 1.0)
        self.assertEqual(report["preservation_rate"], 1.0)
        for surface in (
            "teach_explanation",
            "speaker_note",
            "success_criteria",
            "sticky_knowledge",
            "question",
            "model_answer",
        ):
            self.assertEqual(report[f"{surface}_accuracy"], 1.0)

    def test_catch_and_preservation_are_not_the_same_metric(self) -> None:
        inputs = load_input_cases(INPUT)
        gold = load_gold_cases(GOLD)
        predictions = {case["id"]: "KEEP" for case in inputs}
        report = score(inputs, gold, predictions)

        self.assertEqual(report["preservation_rate"], 1.0)
        self.assertEqual(report["catch_rate"], 0.0)
        self.assertLess(report["overall_accuracy"], 1.0)

    def test_alignment_rejects_missing_predictions(self) -> None:
        inputs = load_input_cases(INPUT)
        gold = load_gold_cases(GOLD)
        with self.assertRaises(EvaluationDataError):
            score(inputs, gold, {})

    def test_input_loader_rejects_leaked_gold(self) -> None:
        broken = ROOT / "_broken-input.json"
        try:
            broken.write_text(
                json.dumps(
                    {
                        "cases": [
                            {
                                "id": "bad",
                                "year_group": 4,
                                "subject": "PSHE",
                                "surface_type": "question",
                                "wording": "A question",
                                "expected": "KEEP",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            with self.assertRaises(EvaluationDataError):
                load_input_cases(broken)
        finally:
            broken.unlink(missing_ok=True)

    def test_prediction_loader_accepts_the_documented_shape(self) -> None:
        predictions_path = ROOT / "_predictions.json"
        try:
            predictions_path.write_text(
                json.dumps(
                    {"predictions": [{"id": "one", "decision": "KEEP"}]}
                ),
                encoding="utf-8",
            )
            self.assertEqual(load_predictions(predictions_path), {"one": "KEEP"})
        finally:
            predictions_path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
