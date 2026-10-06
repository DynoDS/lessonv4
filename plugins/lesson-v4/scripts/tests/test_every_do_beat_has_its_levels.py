"""Every beat where children do something is planned at its levels (Daniel,
1 October 2026: "all do beats. There should be a decision"): the board always,
a printed sheet when it changes how children do or record the task, and real
things for a prepared day. These checks hold the contract the validator
enforces on a beat's `levels`."""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


VALIDATOR = load("levels_validator", "validate-lesson-design.py")
SCAFFOLD = load("levels_scaffold", "lesson-design-scaffold.py")

SORT = {
    "kind": "sort",
    "handling": {"kind": "sheet", "per": "pair", "groupCount": None, "where": "At tables."},
    "groups": [{"id": "group-001", "label": "Yes"}, {"id": "group-002", "label": "No"}],
    "items": [{"id": "item-001", "label": "A", "detail": None, "photoRef": None}],
}


def printed(form="task", per="pair", what="The case to judge and room to answer."):
    return {"form": form, "per": per, "what": what}


class TheLevelsContractTests(unittest.TestCase):
    def refused(self, levels, kind="do", task=None, info="If printed: the sheet, one between two, as the task is set.",
                script="Say to children: Prove Sam wrong.") -> str:
        unit = {"kind": kind, "taskStructure": task, "speakerNotes": {"script": script, "teacherInfo": info}}
        try:
            VALIDATOR.validate_levels(levels, "unit.levels", unit)
        except Exception as exc:  # the validator's ContractError
            return str(exc)
        return ""

    def test_a_printed_beat_and_a_board_beat_with_its_reason_pass(self):
        self.assertEqual(self.refused({"printed": printed(), "boardOnlyBecause": None, "realThings": None}), "")
        self.assertEqual(self.refused({
            "printed": None,
            "boardOnlyBecause": "A ten-second recall answered on whiteboards.",
            "realThings": None,
        }), "")
        self.assertEqual(self.refused({
            "printed": printed("figure", "pair", "The map of the UK to mark the rivers on."),
            "boardOnlyBecause": None,
            "realThings": "An atlas between two.",
        }), "")

    def test_board_only_needs_a_reason(self):
        self.assertIn("boardOnlyBecause", self.refused({"printed": None, "boardOnlyBecause": "no", "realThings": None}))

    def test_a_printed_beat_names_its_form_who_shares_and_what_is_on_it(self):
        for bad, phrase in (
            (printed(form="poster"), "printed.form invalid"),
            (printed(per="table"), "printed.per invalid"),
            ({"form": "task", "per": "pair"}, "printed"),
        ):
            with self.subTest(bad=bad):
                self.assertIn(phrase, self.refused({"printed": bad, "boardOnlyBecause": None, "realThings": None}))

    def test_a_sort_is_always_printed_from_its_sort(self):
        self.assertIn("always printed", self.refused(
            {"printed": None, "boardOnlyBecause": "Three names on the board.", "realThings": None}, task=SORT))
        self.assertIn("must be sort", self.refused(
            {"printed": printed("task"), "boardOnlyBecause": None, "realThings": None}, task=SORT))
        self.assertEqual(self.refused(
            {"printed": printed("sort"), "boardOnlyBecause": None, "realThings": None}, task=SORT), "")
        self.assertIn("needs the beat's taskStructure to be a sort", self.refused(
            {"printed": printed("sort"), "boardOnlyBecause": None, "realThings": None}))

    def test_a_printed_beat_tells_the_teacher_when_to_hand_it_out(self):
        self.assertIn("speakerNotes.teacherInfo must tell the teacher", self.refused(
            {"printed": printed(), "boardOnlyBecause": None, "realThings": None}, info=None))

    def test_the_hand_out_line_is_a_teacher_note_and_the_script_need_not_carry_it(self):
        # The script is spoken to the class. A hand-out sentence there does not
        # satisfy the check, and its absence there does not fail it.
        levels = {"printed": printed(), "boardOnlyBecause": None, "realThings": None}
        self.assertEqual(self.refused(levels, script="Say to children: Prove Sam wrong."), "")
        self.assertIn("speakerNotes.teacherInfo must tell the teacher", self.refused(
            levels, info="Watch for children who agree with Sam.",
            script="Say to children: If you've printed the sheets, give one to each pair now."))


class ThePackPrintsWhatTheBeatChoseTests(unittest.TestCase):
    def setUp(self):
        self.module = load("levels_resource_opportunities", "resource-opportunities.py")

    def design(self, form):
        return {"teachingSequence": [{
            "sourceUnitId": "lesson-section/teaching-sequence/unit-002",
            "kind": "do",
            "levels": {"printed": printed(form), "boardOnlyBecause": None, "realThings": None},
        }]}

    def test_a_printed_level_with_no_piece_is_a_fault_and_the_right_piece_clears_it(self):
        unit = "lesson-section/teaching-sequence/unit-002"
        for form, visual in (("task", "task-sheet"), ("source", "source-text"), ("figure", "venn")):
            with self.subTest(form=form):
                faults = self.module.level_faults(self.design(form), [])
                self.assertTrue(faults and unit in faults[0], faults)
                self.assertEqual(self.module.level_faults(self.design(form), [{"visual": visual, "sourceUnitId": unit}]), [])
        self.assertTrue(self.module.level_faults(self.design("task"), [{"visual": "venn", "sourceUnitId": unit}]))


    def test_the_scaffold_asks_every_doing_beat_for_its_levels_and_no_other(self):
        self.assertIn("levels", SCAFFOLD.source_unit("lesson-section/teaching-sequence/unit-001", "do", None))
        self.assertNotIn("levels", SCAFFOLD.source_unit("lesson-section/teaching-sequence/unit-001", "teach", None))
        self.assertEqual(SCAFFOLD.LEVEL_KINDS, VALIDATOR.LEVEL_KINDS)


if __name__ == "__main__":
    unittest.main()
