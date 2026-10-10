"""A design revised after Phase 2 began, and the records written before it.

Two records are written from the lesson once and read many times afterwards:
the frozen Phase 2 picture list and `helper-check.json`. A late revision of the
design (a picture that never arrived, a sheet that would not fit) rewrites the
lesson and leaves both as they were. In the 20-lesson test of 7 October 2026
three runs met it:

- Year 2 history, the Great Fire of London: adaptation pictures were merged
  onto the frozen list, the revised design named `photo-010`, the validator
  refused it, and the run's answer to a failed adaptation is no Below or
  Greater Depth sheet.
- Year 5 science, day and night: the record still held a worksheet use the
  revised design had dropped, and the delivery check refused a correct sheet.
- Year 2 maths, telling the time: the record still asserted four clocks in a
  row after the sheet became three, and refused the three-clock sheet.

None of the three lost a different thing each time; each read a record older
than the lesson. These tests hold both records to the lesson as it stands.
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
COVERAGE = SCRIPTS / "check-helper-coverage.py"
PLAYBOOK = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
FLAT = " ".join(PLAYBOOK.split())


def load(name: str):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


contract_module = load("photo-contract")


def photo(photo_id: str, filename: str) -> dict:
    return {
        "id": photo_id,
        "subject": f"subject of {filename}",
        "pedagogical_constraint": "show the feature",
        "teaching_requirement": "identify the feature",
        "load_bearing_evidence": ["the visible feature"],
        "use": "worksheet",
        "essential": True,
        "filename": filename,
        "acquisition_mode": "controlled-ai",
        "source_profile": "none",
        "fallback_action": "omit",
        "fallback_note": None,
        "generation_prompt": {
            "physical_state": "the subject shown whole and unobstructed",
            "must_avoid": ["a second subject"],
            "text_rule": "no readable text, labels, logos or branding",
            "composition": "the whole subject in one clear frame",
        },
        "coherent_group": None,
        "coherent_mode": "none",
        "coherent_visual_invariants": [],
    }


def contract(photos: list[dict]) -> dict:
    return {"schema_version": 2, "lesson_name": "lesson", "photos": photos}


def write_json(path: Path, payload) -> Path:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path


ADAPTATION_MD = """# Adaptation

## Below

Fewer numbers.

## Greater Depth

Harder numbers.

## Photos for the sheets

```json
{json}
```
"""


class AdaptationPicturesJoinTheRevisedLessonTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.lost = photo("photo-001", "generated/lost.png")
        self.kept = photo("photo-002", "generated/kept.png")
        self.replacement = photo("photo-010", "generated/replacement.png")
        self.below = photo("adaptation-photo-001", "generated/below.png")
        self.initial = write_json(self.root / "phase2-initial-photo-requirements.json", contract([self.lost, self.kept]))
        self.adaptation = self.root / "adaptation.md"
        self.adaptation.write_text(ADAPTATION_MD.replace("{json}", json.dumps(contract([self.below]))), encoding="utf-8")

    def build(self, canonical: Path | None) -> list[str]:
        args = SimpleNamespace(
            initial=str(self.initial), adaptation=str(self.adaptation), output=str(self.root / "provisional.json"),
            lesson_design=None, receipt=str(self.root / "receipt.json"), requirements_snapshot=None,
            canonical=str(canonical) if canonical else None,
        )
        self.assertEqual(contract_module.cmd_build_provisional(args), 0)
        merged = json.loads((self.root / "provisional.json").read_text(encoding="utf-8"))
        return [entry["id"] for entry in merged["photos"]]

    def test_a_revised_lesson_keeps_its_replacement_and_loses_the_lost_picture(self):
        canonical = write_json(self.root / "photo-requirements.json", contract([self.kept, self.replacement]))
        self.assertEqual(self.build(canonical), ["photo-002", "photo-010", "adaptation-photo-001"])
        receipt = json.loads((self.root / "receipt.json").read_text(encoding="utf-8"))
        self.assertEqual(receipt["basePhotoSource"], "canonical")

    def test_the_frozen_list_alone_is_the_fault_this_repairs(self):
        """Undoing the repair: merged onto the frozen file, the replacement is absent."""
        ids = self.build(None)
        self.assertNotIn("photo-010", ids)
        self.assertIn("photo-001", ids)

    def test_an_unrevised_lesson_gives_the_same_list_as_before(self):
        canonical = write_json(self.root / "photo-requirements.json", contract([self.lost, self.kept]))
        with_canonical = self.build(canonical)
        self.assertEqual(with_canonical, self.build(None))

    def test_adaptation_pictures_an_earlier_promotion_left_behind_are_not_carried(self):
        stale = photo("adaptation-photo-001", "generated/old-below.png")
        canonical = write_json(self.root / "photo-requirements.json", contract([self.kept, self.replacement, stale]))
        self.build(canonical)
        merged = json.loads((self.root / "provisional.json").read_text(encoding="utf-8"))
        names = [entry["filename"] for entry in merged["photos"]]
        self.assertEqual(names, ["generated/kept.png", "generated/replacement.png", "generated/below.png"])

    def test_the_command_cannot_be_run_without_the_live_list(self):
        result = subprocess.run(
            [
                sys.executable, str(SCRIPTS / "photo-contract.py"), "build-provisional",
                "--initial", str(self.initial), "--adaptation", str(self.adaptation),
                "--output", str(self.root / "provisional.json"), "--receipt", str(self.root / "receipt.json"),
            ],
            capture_output=True, text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("--canonical", result.stderr)

    def test_the_playbook_passes_the_live_list(self):
        command = PLAYBOOK.split("Run `photo-contract.py build-provisional`", 1)[1].split("Number the snapshot", 1)[0]
        self.assertIn('--canonical "[WORKING_DIR]/photo-requirements.json"', command)


def design(features: list[str], *, with_sheet_use: bool = True) -> dict:
    """A lesson with a clock on the board and, usually, a row of clocks on the sheet."""
    representations = [
        {
            "id": "rep-001",
            "name": "Clock faces",
            "purpose": "Read quarter past and quarter to",
            "configurations": [
                {"id": "board", "description": "One clock face", "loadBearing": True, "requiredFeatures": []},
                {"id": "sheet-read", "description": "A row of clock faces", "loadBearing": True, "requiredFeatures": features},
            ],
        }
    ]
    sequence = [{"id": "unit-001", "representationRefs": [{"ref": "rep-001", "configuration": "board", "interaction": "view"}]}]
    lesson = {"representations": representations, "teachingSequence": sequence}
    if with_sheet_use:
        # A use named under the design's worksheet is required on the worksheet.
        lesson["worksheet"] = {"questions": [{"id": "q1", "representationRefs": [{"ref": "rep-001", "configuration": "sheet-read", "interaction": "view"}]}]}
    return lesson


def sheet_decision(feature: str, count: int) -> dict:
    return {
        "representationId": "rep-001",
        "configuration": "sheet-read",
        "requiredSurface": "worksheets",
        "decision": "covered",
        "helperKey": "clock-row",
        "featureChecks": [{"feature": feature, "path": "/count", "equals": count}],
    }


def sheet(helper: str, count: int) -> dict:
    return {"sheets": {"expected": {"zones": [{
        "helper": helper, "count": count,
        "helperUse": {"representationId": "rep-001", "configuration": "sheet-read"},
    }]}}}


class DeliveryIsHeldToTheLessonAsItStandsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def delivery(self, lesson: dict | None, decision: dict, spec: dict) -> subprocess.CompletedProcess:
        if lesson is not None:
            write_json(self.root / "lesson-design.json", lesson)
        write_json(self.root / "helper-check.json", {"schemaVersion": 1, "decisions": [decision]})
        write_json(self.root / "worksheet.json", spec)
        return subprocess.run(
            [sys.executable, str(COVERAGE), "delivery", "--verdict", str(self.root / "helper-check.json"),
             "--spec", str(self.root / "worksheet.json"), "--surface", "worksheets"],
            capture_output=True, text=True,
        )

    def test_a_use_the_revised_lesson_dropped_cannot_refuse_the_sheet(self):
        """Day and night: the revised design has no worksheet picture, and neither has the sheet."""
        result = self.delivery(
            design([], with_sheet_use=False),
            sheet_decision("four clock faces in a row", 4),
            {"sheets": {"expected": {"zones": [{"helper": "lines"}]}}},
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HELPER_DELIVERY_OK 0", result.stdout)
        self.assertIn("HELPER_RECORD_STALE: rep-001/sheet-read", result.stdout)
        self.assertIn("no longer requires", result.stdout)

    def test_without_the_design_beside_it_the_old_record_still_refuses(self):
        """Undoing the repair: the record alone cannot know the use was dropped."""
        result = self.delivery(
            None,
            sheet_decision("four clock faces in a row", 4),
            {"sheets": {"expected": {"zones": [{"helper": "lines"}]}}},
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("HELPER_DELIVERY_FAILED", result.stderr)

    def test_a_figure_the_revision_changed_is_not_held_to_its_old_features(self):
        """Telling the time: four clocks became three, and the three-clock sheet is right."""
        result = self.delivery(
            design(["three clock faces in a row"]),
            sheet_decision("four clock faces in a row", 4),
            sheet("clock-row", 3),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HELPER_DELIVERY_OK 1", result.stdout)
        self.assertIn("HELPER_RECORD_STALE: rep-001/sheet-read", result.stdout)
        self.assertIn("three clock faces in a row", result.stdout)

    def test_a_changed_figure_must_still_be_drawn_by_its_helper(self):
        """A stale record is no licence for the hand-built lookalike the check exists to catch."""
        result = self.delivery(
            design(["three clock faces in a row"]),
            sheet_decision("four clock faces in a row", 4),
            sheet("table", 3),
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("HELPER_DELIVERY_FAILED", result.stderr)

    def test_a_record_in_step_with_the_lesson_is_checked_in_full(self):
        """The healthy case: nothing stale, and a wrong count is still a failure."""
        lesson = design(["three clock faces in a row"])
        right = self.delivery(lesson, sheet_decision("three clock faces in a row", 3), sheet("clock-row", 3))
        self.assertEqual(right.returncode, 0, right.stderr)
        self.assertNotIn("HELPER_RECORD_STALE", right.stdout)
        wrong = self.delivery(lesson, sheet_decision("three clock faces in a row", 3), sheet("clock-row", 4))
        self.assertEqual(wrong.returncode, 1)
        self.assertIn("required feature", wrong.stderr)


class TheRunRefreshesItsRecordsTests(unittest.TestCase):
    """The rule is read only on a run that revises, so it lives in a reference."""

    REFERENCE = ROOT / "references" / "records-after-a-revision.md"

    def test_the_playbook_routes_every_revision_to_the_one_rule(self):
        self.assertIn("**After any design revision once Phase 2 has begun**", FLAT)
        pointer = FLAT.split("**After any design revision once Phase 2 has begun**", 1)[1].split("Once the last branch settles", 1)[0]
        self.assertIn("[PLUGIN_ROOT]/references/records-after-a-revision.md", pointer)
        self.assertIn("before relaunching any designer", pointer)
        self.assertLess(pointer.index("follow"), pointer.index("before relaunching any designer"))
        for route in ("this wave", "owner repair", "re-review"):
            self.assertIn(route, pointer)

    def test_the_rule_names_all_three_records_and_its_own_limit(self):
        rule = " ".join(self.REFERENCE.read_text(encoding="utf-8").split())
        for record in ("**`helper-check.json`.**", "**The photo contract.**", "**`adaptation.md`,**"):
            self.assertIn(record, rule)
        self.assertIn("Require `HELPER_COVERAGE_OK`", rule)
        self.assertIn("HELPER_RECORD_STALE:", rule)
        self.assertIn("A revision that leaves the Expected sheet as it was skips this third step", rule)

    def test_the_narrow_one_use_note_it_replaced_is_gone(self):
        self.assertNotIn("Re-record that use in `helper-check.json` as the wave leaves it", FLAT)

    def test_the_orchestrator_and_each_designer_know_a_stale_record_is_no_designer_fault(self):
        coverage = (SCRIPTS / "check-helper-coverage.py").read_text(encoding="utf-8")
        self.assertIn("references/records-after-a-revision.md", coverage)
        for role in ("slide-designer.md", "worksheet-designer.md"):
            with self.subTest(role=role):
                text = " ".join((ROOT / "agents" / role).read_text(encoding="utf-8").split())
                self.assertIn("HELPER_RECORD_STALE:", text)
                self.assertIn("copy it into your return", text)

    def test_a_lost_adaptation_is_tried_again_and_told_first(self):
        self.assertIn("Retry it once first; an omission opens the teacher report.", FLAT)
        rule = " ".join(self.REFERENCE.read_text(encoding="utf-8").split())
        self.assertIn("the teacher report opens with one plain line above the files", rule)


if __name__ == "__main__":
    unittest.main()
