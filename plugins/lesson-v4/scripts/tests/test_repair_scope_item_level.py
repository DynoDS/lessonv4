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


class EachCaseKeepsItsOwnTests(ItemLevelCase):
    """The holes a bag of content cannot see.

    An independent audit ran these against the first version of the item-level
    check and every one of them went through. They are here as regressions
    because each has the same shape: the totals are right and the sheet is
    wrong. Fixing them individually with keyword rules would leave the shape
    intact, so what changed was the model - each question and each parallel
    case is fingerprinted on its own, and its room is compared beside it.
    """

    def test_the_evidence_for_two_claims_is_exchanged(self):
        # Every counter still on the page, every count identical, and each
        # claim now sitting above the other one's evidence.
        after = self.mutated()
        row = self.claims(after)["row"]
        row[0]["stack"][0]["groups"], row[1]["stack"][0]["groups"] = (
            row[1]["stack"][0]["groups"],
            row[0]["stack"][0]["groups"],
        )
        self.assertCaught(after)

    def test_one_question_loses_the_lines_another_gains(self):
        after = self.mutated()
        row = self.claims(after)["row"]
        row[0]["stack"][1]["items"][0]["lines"] = 1
        row[1]["stack"][1]["items"][0]["lines"] = 3
        self.assertCaught(after)

    def test_a_word_blank_narrowed_until_the_word_will_not_fit(self):
        # Still a blank, still counted as a place to write, and now a box for
        # one character where the answer is "seven".
        after = self.mutated()
        words = next(
            item for item in self.work(after)
            if item.get("helper") == "number-sentence" and item.get("text")
        )
        for term in words["terms"]:
            if isinstance(term, dict) and term.get("blank"):
                term["chars"] = 1
        self.assertIn("room in them", self.assertCaught(after))


class NestedRowsAreContentTooTests(ItemLevelCase):
    """Primitive cells live in lists inside lists, which the walk skipped.

    Normal table `rows` are exactly that shape, so every cell and every whole
    row of every data table and recording table in the pipeline was invisible.
    """

    TABLES = {
        "sheets": {"expected": {"zones": [{"stack": [
            {"helper": "data-table",
             "headers": ["Material", "Waterproof?"],
             "rows": [["Glass", "yes"], ["Cardboard", "no"], ["Foil", "yes"]]},
            {"helper": "recording-table",
             "columns": ["Source", "What it shows"],
             "writing": ["word", "sentence"],
             "rows": [["Source A", ""], ["Source B", ""]]},
        ]}]}}
    }

    def setUp(self) -> None:
        self.before = copy.deepcopy(self.TABLES)

    @staticmethod
    def tables(spec: dict) -> list:
        return spec["sheets"]["expected"]["zones"][0]["stack"]

    def test_a_cell_value_changed(self):
        after = self.mutated()
        self.tables(after)[0]["rows"][0][1] = "no"
        self.assertCaught(after)

    def test_a_whole_row_removed(self):
        after = self.mutated()
        del self.tables(after)[0]["rows"][1]
        self.assertCaught(after)

    def test_a_recording_row_and_its_cells_removed(self):
        after = self.mutated()
        del self.tables(after)[1]["rows"][1]
        self.assertCaught(after)

    def test_two_cells_swapped_between_rows(self):
        # The bag of cell values is identical; the table now says the opposite.
        after = self.mutated()
        rows = self.tables(after)[0]["rows"]
        rows[0][1], rows[1][1] = rows[1][1], rows[0][1]
        self.assertCaught(after)

    def test_the_same_tables_unchanged_still_pass(self):
        self.assertAllowed(self.mutated())


class IdentityComesFromWhatAThingIsTests(ItemLevelCase):
    """The second audit's four, and they were one mistake wearing four faces.

    The first version of the case model decided what a case was by looking at
    its wrapper: a child of a `row` was a case, and nothing else was. A wrapper
    is presentation, so the model was wrong in both directions at once. Two
    numbered questions inside one `written-answers` helper were not cases at
    all, and one could take the other's ruled lines. Two intact claims moved
    from a row into a stack lost both their fingerprints and were reported as
    a loss, which is the same mistake pointed the other way.

    A case is now decided by what a node IS: it says so, or it binds something
    to read to somewhere to write, or it holds a case and evidence of its own
    beside it.
    """

    def two_questions_in_one_helper(self) -> dict:
        return {"sheets": {"expected": {"zones": [{"stack": [
            {"question": True, "helper": "written-answers", "items": [
                {"text": "Why does the river slow down here?", "lines": 3},
                {"text": "What would change if it rained for a week?", "lines": 3},
            ]},
        ]}]}}}

    def test_one_item_takes_the_ruled_lines_of_the_item_beside_it(self):
        # Six lines before and six after, and the first question has lost two.
        # The engine numbers these items even though neither carries
        # `question: true`, so the checker and the numberer disagreed about
        # what a question was.
        self.before = self.two_questions_in_one_helper()
        after = self.mutated()
        items = after["sheets"]["expected"]["zones"][0]["stack"][0]["items"]
        items[0]["lines"] = 1
        items[1]["lines"] = 5
        self.assertIn("room", self.assertCaught(after))

    def test_both_items_gaining_a_line_is_still_an_improvement(self):
        self.before = self.two_questions_in_one_helper()
        after = self.mutated()
        for item in after["sheets"]["expected"]["zones"][0]["stack"][0]["items"]:
            item["lines"] = 4
        self.assertAllowed(after)

    def test_two_intact_cases_may_move_from_a_row_into_a_stack(self):
        claims = [
            {"stack": [
                {"helper": "counter-group", "statement": "5,009 = 5,000 + 9",
                 "joiner": "+", "groups": [{"value": "1000", "count": 5},
                                           {"value": "1", "count": 9}]},
                {"helper": "written-answers", "showNumbers": False,
                 "items": [{"text": "", "lines": 2}]}]},
            {"stack": [
                {"helper": "counter-group", "statement": "5,009 = 500 + 9",
                 "joiner": "+", "groups": [{"value": "100", "count": 5},
                                           {"value": "1", "count": 9}]},
                {"helper": "written-answers", "showNumbers": False,
                 "items": [{"text": "", "lines": 2}]}]},
        ]
        self.before = {"sheets": {"expected": {"zones": [{"stack": [
            {"question": True, "row": claims}]}]}}}
        after = {"sheets": {"expected": {"zones": [{"stack": [
            {"question": True, "stack": claims}]}]}}}
        self.assertAllowed(after)


class TheTwoChannelsStaySeparateTests(ItemLevelCase):
    """An answer already in the document is still new to the child.

    The additions check asked whether a string was new to the whole file. A
    teacher answer copied out of the key and onto a pupil instruction is not
    new to the file, and every count stayed where it was.
    """

    def marked_sheet(self) -> dict:
        return {
            "sheets": {"expected": {"zones": [{"stack": [
                {"question": True, "helper": "written-answers", "items": [
                    {"text": "Is Rowan right? How do you know?", "lines": 3}]},
            ]}]}},
            "answerKey": {"expected": [{
                "question": 1,
                "answer": "No. The day is already balanced, so nothing needs adding.",
            }]},
        }

    def setUp(self) -> None:
        self.before = self.marked_sheet()

    def test_a_teacher_answer_copied_onto_the_pupil_page(self):
        after = self.mutated()
        after["sheets"]["expected"]["zones"][0]["stack"].append(
            {"helper": "instruction",
             "text": "No. The day is already balanced, so nothing needs adding."}
        )
        self.assertIn("teacher", self.assertCaught(after))

    def test_the_teacher_answer_itself_may_not_be_dropped(self):
        after = self.mutated()
        after["answerKey"]["expected"] = []
        self.assertIn("teacher answer", self.assertCaught(after))

    def test_the_same_marked_sheet_unchanged_passes(self):
        self.assertAllowed(self.mutated())


class ATableCellKeepsItsRowTests(ItemLevelCase):
    """A part-completed table's given words move to the wrong source.

    Rows containing a null response cell were skipped by the ordered-row check,
    because a null is not a value, and the nulls were not counted as places to
    write either. So a supplied statement could be moved under a different
    source with the word counts identical.
    """

    TABLE = {"sheets": {"expected": {"zones": [{"stack": [
        {"question": True, "helper": "recording-table",
         "columns": ["Source", "What it says", "What you think"],
         "writing": ["word", "sentence", "sentence"],
         "rows": [["Source A", "The river flooded twice.", None],
                  ["Source B", "The bridge was rebuilt.", None]]},
    ]}]}}}

    def setUp(self) -> None:
        self.before = copy.deepcopy(self.TABLE)

    @staticmethod
    def rows(spec: dict) -> list:
        return spec["sheets"]["expected"]["zones"][0]["stack"][0]["rows"]

    def test_given_cells_reassigned_to_the_other_source(self):
        after = self.mutated()
        rows = self.rows(after)
        rows[0][1], rows[1][1] = rows[1][1], rows[0][1]
        self.assertCaught(after)

    def test_a_blank_cell_filled_in_with_a_given_word(self):
        after = self.mutated()
        self.rows(after)[0][2] = "It flooded because the banks were low."
        self.assertCaught(after)

    def test_the_same_table_unchanged_passes(self):
        self.assertAllowed(self.mutated())


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
