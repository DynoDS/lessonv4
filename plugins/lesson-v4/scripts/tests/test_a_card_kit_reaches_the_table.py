"""A sort the design does with printed cards arrives as a printed kit, or the run says so.

The Tudor lesson taught on 15 September 2026 ran its sorts on whiteboards on
the carpet, and the teacher wanted a calm move to tables with prepared cards
and headings. Nothing in the plugin printed items to move: the worksheet
prints in place with no cut guides, and the stick-in pack knew only figures a
child writes on and sources a child reads. The kit now travels as a third
stick-in moment, copied from the unit's own sort:

- the design says a sort is handled as cards (`taskStructure.handling`);
- the stick-in spec carries a `card-set` for that unit, and the orchestrator's
  `stick-in-kits` check refuses one that drifts from the unit or is missing;
- the build prints the cards and headings with cut guides and writes the key
  to a separate teacher file, which delivery already carries;
- the run report cannot close COMPLETE while the kit is undelivered, and cannot
  leave it unmentioned.

The JS half (cards printed once per set, never in key order, the key never on
a pupil page) is tested in stick-in-sheets-html/test/card-kit.test.js.
"""
from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import types
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TESTS = Path(__file__).resolve().parent
sys.path.insert(0, str(TESTS))

from test_run_report import RunReportCase  # noqa: E402

COMMAND = ROOT / "scripts" / "resource-opportunities.py"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


HANDLING = {"kind": "cards", "per": "pair", "groupCount": None, "where": "At tables, one set between two."}

SORT = {
    "kind": "sort",
    "groups": [
        {"id": "group-001", "label": "Helped the family straight away"},
        {"id": "group-002", "label": "Helped the child when he grew up"},
    ],
    "items": [
        {"id": "item-001", "label": "a hot dinner every day", "detail": None, "photoRef": None},
        {"id": "item-002", "label": "knowing when bread is baked just right", "detail": None, "photoRef": None},
        {"id": "item-003", "label": "his own bakery one day", "detail": None, "photoRef": None},
    ],
    "handling": HANDLING,
}

ANSWER = {
    "kind": "exact",
    "content": None,
    "structure": {
        "kind": "sort",
        "placements": [
            {"itemRef": "item-001", "groupRef": "group-001"},
            {"itemRef": "item-002", "groupRef": "group-002"},
            {"itemRef": "item-003", "groupRef": "group-002"},
        ],
    },
    "acceptanceCondition": "Accept the baking card under either heading.",
    "delivery": "teacher-only",
}

UNIT_ID = "lesson-section/teaching-sequence/unit-004"


def kit_design() -> dict:
    return {
        "starter": {"sourceUnitId": "lesson-section/starter/unit-001", "taskStructure": None},
        "teachingSequence": [
            {
                "sourceUnitId": UNIT_ID,
                "kind": "do",
                "pupilInstruction": "Put each card under a heading.",
                "taskStructure": copy.deepcopy(SORT),
                "answer": copy.deepcopy(ANSWER),
            }
        ],
        "ending": {"included": False, "beat": None},
        "resourceOpportunities": {
            "stickIn": {"decision": "candidate", "sourceUnitIds": [UNIT_ID], "reason": "A card kit for the sort."},
            "workingWall": {"decision": "none", "sourceUnitIds": [], "reason": "Nothing durable."},
        },
    }


def faithful_card_set() -> dict:
    return {
        "visual": "card-set",
        "tag": "Deal",
        "label": "What did the deal give?",
        "spec": {
            "sourceUnitId": UNIT_ID,
            "instruction": "Put each card under a heading.",
            "headings": [{"id": g["id"], "label": g["label"]} for g in SORT["groups"]],
            "cards": [{"id": i["id"], "label": i["label"]} for i in SORT["items"]],
            "sets": {"per": "pair", "groupCount": None},
            "teacher": {
                "where": "At tables, one set between two.",
                "answer": [
                    {"cardId": p["itemRef"], "headingId": p["groupRef"]}
                    for p in ANSWER["structure"]["placements"]
                ],
                "alsoAccept": "Accept the baking card under either heading.",
            },
        },
    }


class TheDesignSaysHowASortIsHandledTests(unittest.TestCase):
    def setUp(self):
        self.module = load("vld_handling", "validate-lesson-design.py")

    def structure(self, handling):
        sort = copy.deepcopy(SORT)
        if handling is None:
            sort.pop("handling")
        else:
            sort["handling"] = handling
        return self.module.validate_task_structure(sort, "taskStructure", unit_photo_refs=set())

    def test_a_board_sort_needs_no_handling_block(self):
        self.structure(None)

    def test_cards_per_pair_validates(self):
        self.structure(HANDLING)

    def test_a_group_kit_states_its_count_and_others_leave_it_null(self):
        self.structure({**HANDLING, "per": "group", "groupCount": 6})
        for bad in (
            {**HANDLING, "per": "group", "groupCount": None},
            {**HANDLING, "per": "child", "groupCount": 30},
            {**HANDLING, "per": "table"},
            {**HANDLING, "kind": "counters"},
            {**HANDLING, "where": "  "},
        ):
            with self.subTest(bad=bad):
                with self.assertRaises(self.module.ContractError):
                    self.structure(bad)

    def test_the_helper_tells_a_card_sort_from_a_board_sort(self):
        unit = kit_design()["teachingSequence"][0]
        self.assertIsNotNone(self.module.sort_handled_as_cards(unit))
        unit["taskStructure"].pop("handling")
        self.assertIsNone(self.module.sort_handled_as_cards(unit))


class TheKitMatchesTheUnitTests(unittest.TestCase):
    def setUp(self):
        self.module = load("resource_opportunities_kits", "resource-opportunities.py")

    def faults(self, design, items):
        return self.module.kit_faults(design, {"items": items})

    def test_a_faithful_kit_has_no_faults(self):
        self.assertEqual(self.faults(kit_design(), [faithful_card_set()]), [])

    def test_a_missing_kit_is_the_loudest_fault(self):
        faults = self.faults(kit_design(), [])
        self.assertEqual(len(faults), 1)
        self.assertIn("no card-set for it", faults[0])

    def test_every_kind_of_drift_is_named(self):
        cases = {
            "cards differ": lambda s: s["cards"].pop(),
            "headings differ": lambda s: s["headings"].append({"id": "group-003", "label": "Both"}),
            "key differs": lambda s: s["teacher"]["answer"].__setitem__(0, {"cardId": "item-001", "headingId": "group-002"}),
            "alsoAccept differs": lambda s: s["teacher"].__setitem__("alsoAccept", None),
            "sets differ": lambda s: s["sets"].__setitem__("per", "child"),
            "teacher.where differs": lambda s: s["teacher"].__setitem__("where", "On the carpet."),
        }
        for phrase, mutate in cases.items():
            with self.subTest(phrase=phrase):
                item = faithful_card_set()
                mutate(item["spec"])
                faults = self.faults(kit_design(), [item])
                self.assertTrue(any(phrase in f for f in faults), faults)

    def test_a_kit_for_a_board_sort_is_refused_too(self):
        design = kit_design()
        design["teachingSequence"][0]["taskStructure"].pop("handling")
        faults = self.faults(design, [faithful_card_set()])
        self.assertTrue(any("not handled as cards" in f for f in faults), faults)

    def test_the_command_reports_ok_or_every_fault(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            design_path = Path(tmp) / "lesson-design.json"
            stick_path = Path(tmp) / "stick-in-sheets.json"
            design_path.write_text(json.dumps(kit_design()), encoding="utf-8")
            stick_path.write_text(json.dumps({"items": [faithful_card_set()]}), encoding="utf-8")
            ok = subprocess.run(
                [sys.executable, str(COMMAND), "stick-in-kits", "--lesson-design", str(design_path), "--stick-in", str(stick_path)],
                capture_output=True, text=True,
            )
            self.assertEqual(ok.returncode, 0, ok.stderr)
            self.assertTrue(ok.stdout.startswith("STICK_IN_KITS_OK: 1 card kit required"), ok.stdout)
            stick_path.write_text(json.dumps({"items": []}), encoding="utf-8")
            bad = subprocess.run(
                [sys.executable, str(COMMAND), "stick-in-kits", "--lesson-design", str(design_path), "--stick-in", str(stick_path)],
                capture_output=True, text=True,
            )
            self.assertEqual(bad.returncode, 1)
            self.assertIn("STICK_IN_KIT_FAULT:", bad.stdout)


class TheBuildReportsTheTeacherFileTests(unittest.TestCase):
    def test_the_stick_in_outputs_carry_the_answers_file_when_the_build_wrote_one(self):
        module = load("run_fixed_kits", "run-fixed-resource.py")
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            pack = out / "Lesson - Stick-in Sheets.pdf"
            answers = out / "Lesson - Stick-in Sheets - Answers.txt"
            args = types.SimpleNamespace(kind="stick-in", output_dir=str(out))
            paths, degraded = module.expected_outputs(args, f"Built: {pack}\nBuilt answers: {answers}\n")
            self.assertEqual([p.name for p in paths], [pack.name, answers.name])
            self.assertFalse(degraded)
            paths, _ = module.expected_outputs(args, f"Built: {pack}\n")
            self.assertEqual([p.name for p in paths], [pack.name])
            family = module.actual_family
            self.assertIn("Stick-in Sheets - Answers.txt", " ".join(str(p) for p in family(
                "stick-in", ROOT, self._working_with_spec(out), out, "Lesson"
            )))

    @staticmethod
    def _working_with_spec(out: Path) -> Path:
        working = out / "working"
        working.mkdir(exist_ok=True)
        (working / "stick-in-sheets.json").write_text(json.dumps({"meta": {"lesson": "Lesson"}, "items": []}), encoding="utf-8")
        return working


class TheRunCannotCloseWithoutTheKitTests(RunReportCase):
    def setUp(self):
        super().setUp()
        self.write_json(self.working / "lesson-design.json", kit_design())

    def test_a_complete_report_with_no_kit_delivered_is_refused(self):
        report = self.write_report(overrides={"outcome": "Package status: COMPLETE"})
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("handles a sort with printed cards", result.stdout)
        self.assertIn("under neither Delivered nor Excluded", result.stdout)

    def test_a_partial_report_that_names_the_missing_kit_passes(self):
        report = self.write_report(
            overrides={
                "outcome": "Package status: PARTIAL",
                "excluded": "- stick-in sheets: NOT DELIVERED - the card kit for the deal sort was not built.",
                "blocking": "- stick-in sheets: the card kit for unit-004 is missing, so the sort cannot run at tables.",
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_complete_report_that_excludes_the_kit_is_still_refused(self):
        report = self.write_report(
            overrides={
                "outcome": "Package status: COMPLETE",
                "excluded": "- stick-in sheets: NOT DELIVERED - the card kit was not built.",
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 1)
        self.assertIn("main activity's materials are missing is PARTIAL, not COMPLETE", result.stdout)

    def test_a_delivered_kit_closes_normally(self):
        pack = self.output / "Beatrix Potter - Stick-in Sheets.pdf"
        pack.write_bytes(b"pack fixture")
        answers = self.output / "Beatrix Potter - Stick-in Sheets - Answers.txt"
        answers.write_bytes(b"key fixture")
        self.write_json(self.working / "stick-in-sheets.json", {"items": [faithful_card_set()]})
        report = self.write_report(
            overrides={
                "outcome": "Package status: COMPLETE",
                "delivered": (
                    f"- slides: `{self.slides_out}`\n"
                    f"- worksheets: `{self.worksheets_out}`\n"
                    f"- worksheets: `{self.answers_out}`\n"
                    f"- stick-in sheets: `{pack}`\n"
                    f"- stick-in sheets: `{answers}`"
                ),
            }
        )
        result = self.validate(report)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


class TheRouteIsWiredTests(unittest.TestCase):
    def test_the_playbook_runs_the_kit_check_and_delivers_the_teacher_file(self):
        text = flat(ROOT / "skills" / "make-lesson" / "playbook-lite.md")
        self.assertIn("resource-opportunities.py\" stick-in-kits", text)
        self.assertIn("Require `STICK_IN_KITS_OK`", text)
        self.assertIn("Stick-in Sheets - Answers.txt", text)

    def test_the_designer_and_the_stick_in_designer_know_the_third_purpose(self):
        designer = flat(ROOT / "agents" / "lesson-designer.md")
        self.assertIn("a card kit for a sort children do with their hands at tables", designer)
        self.assertIn("A kit the beat depends on is part of the lesson, not a bonus sheet", designer)
        stick = flat(ROOT / "agents" / "stick-in-sheets-designer.md")
        self.assertIn("Emit one `card-set` item for that unit", stick)
        pedagogy = flat(ROOT / "references" / "stick-in-sheets-pedagogy.md")
        self.assertIn("## The handling moments - items the child moves, not marks", pedagogy)
        self.assertIn("**`card-set`**", pedagogy)
        template = flat(ROOT / "references" / "output-template.md")
        self.assertIn('"handling": { "kind": "cards"', template)


if __name__ == "__main__":
    unittest.main()
