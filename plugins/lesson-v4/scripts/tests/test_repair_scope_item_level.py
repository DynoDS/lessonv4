"""Counting containers is not counting content.

The scope check counted the field each engine uses to say what a thing IS, and
that is a real check: it caught a recording table that came out of a repair as a
column of boxes. What it could not see is the case where the containers all
survive and there is less inside them. Delete one question from a set, one row
from a table, one summand from a number sentence, one counter denomination from
a claim, or fill a blank in with its answer, and every container count stays
exactly where it was.

The teacher-approved partitioning worksheets are the worked example. Their
acceptance list names the mutations that must fail - a sorted set of summands, a
missing digit card, a blank turned into a given zero, a verdict printed beside a
claim - alongside the repairs that must pass, which is the harder half: a
different layout, a moved block, or one of two names for the same renderer.
"""
from __future__ import annotations

import copy
import json
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-repair-scope.py"
FIXTURE = (
    ROOT / "worksheet-html" / "fixtures" / "maths-partition-four-digit-numbers.json"
)


def approved() -> dict:
    spec = json.loads(FIXTURE.read_text(encoding="utf-8"))
    return {"sheets": spec["sheets"]}


class ItemLevelCase(unittest.TestCase):
    def setUp(self) -> None:
        self.before = approved()

    def check(self, after: dict) -> subprocess.CompletedProcess:
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            before_path = root / "before.json"
            after_path = root / "after.json"
            before_path.write_text(json.dumps(self.before), encoding="utf-8")
            after_path.write_text(json.dumps(after), encoding="utf-8")
            return subprocess.run(
                [
                    sys.executable, "-S", str(SCRIPT),
                    "--before", str(before_path),
                    "--after", str(after_path),
                ],
                capture_output=True,
                text=True,
            )

    def assertCaught(self, after: dict) -> str:
        result = self.check(after)
        self.assertEqual(result.returncode, 1, f"this went through:\n{result.stdout}")
        self.assertIn("REPAIR_SCOPE_FAILED", result.stdout)
        return result.stdout

    def assertAllowed(self, after: dict) -> None:
        result = self.check(after)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    # Where the pieces of the approved sheet live.
    def mutated(self) -> dict:
        return copy.deepcopy(self.before)

    @staticmethod
    def work(spec: dict) -> list:
        return spec["sheets"]["expected"]["zones"][0]["stack"]

    @staticmethod
    def recombinations(spec: dict) -> list:
        return [
            item for item in ItemLevelCase.work(spec)
            if item.get("helper") == "number-sentence"
            and any(isinstance(t, dict) and t.get("cells") for t in item["terms"])
        ]

    @staticmethod
    def claims(spec: dict) -> dict:
        return next(
            item for item in ItemLevelCase.work(spec)
            if item.get("question") and item.get("row")
        )

    @staticmethod
    def investigation(spec: dict) -> list:
        return spec["sheets"]["greaterDepth"]["zones"][0]["stack"][1]["stack"]


class TheApprovedSheetSurvivesItselfTests(ItemLevelCase):
    def test_an_unchanged_specification_passes(self):
        result = self.check(self.before)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("place(s) to write preserved", result.stdout)


class LessInsideTheSameContainersTests(ItemLevelCase):
    def test_one_summand_removed_from_a_number_sentence(self):
        after = self.mutated()
        del self.recombinations(after)[0]["terms"][2:4]
        self.assertIn("4,000", self.assertCaught(after))

    def test_the_summands_sorted_into_place_value_order(self):
        # "9 + 4,000 + 50 + 200" out of order IS the question. Sorted, it is an
        # easier one, and every value is still on the page.
        after = self.mutated()
        self.recombinations(after)[0]["terms"] = [
            {"value": "4,000"}, "+", {"value": 200}, "+",
            {"value": 50}, "+", {"value": 9}, "=", {"cells": 4},
        ]
        self.assertIn("terms:", self.assertCaught(after))

    def test_a_duplicate_digit_card_dropped(self):
        after = self.mutated()
        self.investigation(after)[0]["digits"] = ["4", "0", "7"]
        self.assertIn("digits:", self.assertCaught(after))

    def test_a_counter_denomination_changed(self):
        after = self.mutated()
        self.claims(after)["row"][0]["stack"][0]["groups"][0]["value"] = "100"
        self.assertIn("1000", self.assertCaught(after))

    def test_a_counter_count_changed(self):
        after = self.mutated()
        self.claims(after)["row"][0]["stack"][0]["groups"][1]["count"] = 8
        self.assertCaught(after)

    def test_an_instruction_line_dropped(self):
        # "Use 0 for an empty part" is the whole reason four nodes are shown.
        after = self.mutated()
        self.work(after)[1]["text"] = "Write each number in expanded form."
        self.assertIn("Write each part in its box", self.assertCaught(after))

    def test_rows_cut_from_a_repeated_record(self):
        after = self.mutated()
        self.investigation(after)[3]["repeat"] = 3
        self.assertCaught(after)


class NoAnswerAppearsAndNoRoomGoesTests(ItemLevelCase):
    def test_a_blank_part_filled_in_with_its_answer(self):
        after = self.mutated()
        self.work(after)[2]["row"][0]["parts"][0] = {
            "value": 6000, "caption": "Thousands"
        }
        self.assertCaught(after)

    def test_a_blank_replaced_by_a_given_zero(self):
        # The states must not collapse. A given zero and a blank look the same
        # to anything that reads a value for truthiness, and they are opposite
        # designs: one hands the child the answer to that column.
        after = self.mutated()
        self.work(after)[2]["row"][1]["parts"][2] = {"value": 0, "caption": "Tens"}
        self.assertCaught(after)

    def test_a_verdict_printed_beside_a_claim(self):
        after = self.mutated()
        claim = self.claims(after)["row"][0]["stack"][0]
        claim["statement"] = claim["statement"] + " - correct"
        self.assertCaught(after)

    def test_ruled_lines_cut_from_three_to_one(self):
        after = self.mutated()
        explain = after["sheets"]["greaterDepth"]["zones"][1]["stack"][0]
        explain["items"][0]["lines"] = 1
        self.assertIn("fewer places to write", self.assertCaught(after))

    def test_more_room_to_write_is_never_a_fault(self):
        after = self.mutated()
        explain = after["sheets"]["greaterDepth"]["zones"][1]["stack"][0]
        explain["items"][0]["lines"] = 4
        self.assertAllowed(after)


class LegalRepairsStillPassTests(ItemLevelCase):
    def test_a_different_layout_and_orientation(self):
        after = self.mutated()
        after["sheets"]["expected"]["layout"] = "halves-stacked"
        after["sheets"]["expected"]["orientation"] = "landscape"
        self.assertAllowed(after)

    def test_a_block_moved_to_another_position(self):
        after = self.mutated()
        work = self.work(after)
        work[2], work[3] = work[3], work[2]
        self.assertAllowed(after)

    def test_two_names_for_one_renderer(self):
        # `part-whole` and `part-whole-money` draw the same model. Choosing
        # between them is a rendering decision and changes nothing a child sees.
        after = self.mutated()
        self.work(after)[2]["row"][0]["helper"] = "part-whole-money"
        self.assertAllowed(after)

    def test_a_blank_widened_for_the_answer_it_holds(self):
        after = self.mutated()
        for term in self.investigation(after)[2]["terms"]:
            if isinstance(term, dict) and term.get("blank"):
                term["chars"] = 6
        self.assertAllowed(after)

    def test_a_zone_split_into_two(self):
        after = self.mutated()
        work = self.work(after)
        after["sheets"]["expected"]["zones"] = [
            {"stack": work[:5]},
            {"stack": work[5:]},
        ]
        self.assertAllowed(after)


if __name__ == "__main__":
    unittest.main()
