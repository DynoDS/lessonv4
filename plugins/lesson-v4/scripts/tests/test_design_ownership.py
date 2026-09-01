"""The approved design survives the words phase, and each writer stays in
its lane.

The chain edits one canonical lesson-design.json in place, so without a
snapshot the approved wording specs are destroyed at exactly the moment they
become the reference the words should be checked against - and a failed
writer retry has nothing to restart from. check-design-ownership.py freezes
the approved state and diffs each writer's output against its baseline; a
violation is recovered by restoring the baseline and relaunching once.
"""
from __future__ import annotations

import copy
import importlib.util
import json
import tempfile
from pathlib import Path

import test_lesson_design_contract as contract

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-design-ownership.py"

spec = importlib.util.spec_from_file_location("check_design_ownership", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

MARKER = module.WORDING_MARKER


def specced_design() -> dict:
    """The approved state: lesson specs everywhere the author will write."""
    import test_wording_stage_contract as stage

    design, _ = contract.valid_contract()
    return stage.marked(design)


def run_check(stage_name: str, baseline: dict, current: dict) -> list[str]:
    return module.check(stage_name, baseline, current)


class AuthorLaneTests:
    pass


def test_author_replacing_specs_outside_worksheet_is_clean():
    baseline = specced_design()
    current = copy.deepcopy(baseline)
    current["teacherOrientation"] = "Teacher orientation: written words."
    current["teachingSequence"][0]["speakerNotes"]["script"] = (
        "Say to children: watch how I partition each number first."
    )
    assert run_check("author", baseline, current) == []


def test_author_rewriting_a_settled_decision_is_a_violation():
    baseline = specced_design()
    current = copy.deepcopy(baseline)
    current["lesson"]["stickingPoint"] = "A different sticking point."
    faults = run_check("author", baseline, current)
    assert any("was not a wording spec" in fault for fault in faults), faults


def test_author_touching_the_worksheet_is_a_violation():
    baseline = specced_design()
    current = copy.deepcopy(baseline)
    current["worksheet"]["contentBlocks"][0]["pupilPrompt"] = "Add 34 + 25."
    faults = run_check("author", baseline, current)
    assert any("inside `worksheet`" in fault for fault in faults), faults


def test_author_adding_or_removing_structure_is_a_violation():
    baseline = specced_design()
    current = copy.deepcopy(baseline)
    current["vocabulary"].append(copy.deepcopy(current["vocabulary"][0]))
    faults = run_check("author", baseline, current)
    assert any("was added" in fault for fault in faults), faults


def test_worksheet_designer_owning_its_blocks_is_clean():
    baseline = specced_design()
    current = copy.deepcopy(baseline)
    block = current["worksheet"]["contentBlocks"][0]
    block["pupilPrompt"] = "Add 63 + 28."
    block["answer"] = contract.exact_answer("91", "teacher-only")
    current["worksheet"]["fitPriority"]["protected"] = ["the six calculations"]
    assert run_check("worksheet", baseline, current) == []


def test_worksheet_designer_changing_the_brief_is_a_violation():
    baseline = specced_design()
    current = copy.deepcopy(baseline)
    current["worksheet"]["demand"] = "A different demand."
    faults = run_check("worksheet", baseline, current)
    assert any("approved brief" in fault for fault in faults), faults


def test_worksheet_designer_leaving_its_lane_is_a_violation():
    baseline = specced_design()
    current = copy.deepcopy(baseline)
    current["teacherOrientation"] = "Rewritten orientation."
    faults = run_check("worksheet", baseline, current)
    assert any("outside `worksheet`" in fault for fault in faults), faults


def test_review_rewording_strings_in_place_is_clean():
    design, _ = contract.valid_contract()
    current = copy.deepcopy(design)
    current["teachingSequence"][0]["speakerNotes"]["script"] = (
        "Say to children: watch how I split each number first."
    )
    assert run_check("review", design, current) == []


def test_review_touching_planning_metadata_is_a_violation():
    design, _ = contract.valid_contract()
    current = copy.deepcopy(design)
    current["teachingSequence"][2]["speakerNotes"]["lookFor"] = (
        "Look for: something else entirely."
    )
    faults = run_check("review", design, current)
    assert any("planning metadata" in fault for fault in faults), faults


def test_review_restructuring_is_a_violation():
    design, _ = contract.valid_contract()
    current = copy.deepcopy(design)
    del current["vocabulary"][0]
    faults = run_check("review", design, current)
    assert any("was removed" in fault for fault in faults), faults


def test_snapshot_and_cli_check_round_trip():
    import subprocess
    import sys

    design, photos = contract.valid_contract()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        d = tmp_path / "lesson-design.json"
        p = tmp_path / "photo-requirements.json"
        a = tmp_path / "approved-lesson-spec.json"
        ap = tmp_path / "approved-photo-contract.json"
        d.write_text(json.dumps(design), encoding="utf-8")
        p.write_text(json.dumps(photos), encoding="utf-8")

        snap = subprocess.run(
            [sys.executable, str(SCRIPT), "snapshot",
             "--design", str(d), "--photos", str(p),
             "--out-design", str(a), "--out-photos", str(ap)],
            capture_output=True, text=True,
        )
        assert snap.returncode == 0, snap.stderr
        assert snap.stdout.strip() == "DESIGN_SNAPSHOT_OK"

        clean = subprocess.run(
            [sys.executable, str(SCRIPT), "check", "--stage", "review",
             "--baseline", str(a), "--current", str(d),
             "--photos-baseline", str(ap), "--photos-current", str(p)],
            capture_output=True, text=True,
        )
        assert clean.returncode == 0, clean.stderr
        assert clean.stdout.strip() == "DESIGN_OWNERSHIP_OK"

        # The photograph contract is nobody's in the words phase.
        p.write_text(json.dumps({**photos, "lesson_name": "changed"}),
                     encoding="utf-8")
        dirty = subprocess.run(
            [sys.executable, str(SCRIPT), "check", "--stage", "review",
             "--baseline", str(a), "--current", str(d),
             "--photos-baseline", str(ap), "--photos-current", str(p)],
            capture_output=True, text=True,
        )
        assert dirty.returncode == 1
        assert "photo-requirements.json changed" in dirty.stderr


if __name__ == "__main__":
    for name, value in sorted(globals().items()):
        if name.startswith("test_") and callable(value):
            value()
    print("ok")
