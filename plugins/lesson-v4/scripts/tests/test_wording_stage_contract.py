"""The split route's two-stage validation contract.

The decider fills every child-facing or spoken string as a wording spec
(`__LESSON_WORDING_FILL__: ` plus the meaning the words must carry) and the
words pass replaces each spec with finished wording. Stage validation must
accept a fully specced design on every teaching route while still enforcing
every decision-level rule; strict validation must refuse any surviving spec,
so a half-written lesson can never reach a build.

Run:
  python3 -m pytest test_wording_stage_contract.py
"""
from __future__ import annotations

import copy
import json
import tempfile
from pathlib import Path

import test_lesson_design_contract as contract

module = contract.module
MARKER = module.WORDING_MARKER

# The ownership map is the validator's, not this test's: the validator is
# what enforces it at runtime, so a drift between the two would mean the
# test checked a map nobody runs.
WORDING_STRING_KEYS = module.WORDING_KEYS
WORDING_LIST_KEYS = module.WORDING_LIST_KEYS
ANSWER_KEYS = module.ANSWER_SHAPE_KEYS


def spec(value: str) -> str:
    return f"{MARKER} carry this meaning: {value}"


def mark_tree(node) -> None:
    """Replace every child-facing string in place with a wording spec."""
    if isinstance(node, dict):
        is_answer = set(node) == ANSWER_KEYS
        for key, value in node.items():
            if isinstance(value, str) and value.strip():
                if key in WORDING_STRING_KEYS or (is_answer and key == "content"):
                    node[key] = spec(value)
            elif isinstance(value, list) and key in WORDING_LIST_KEYS:
                node[key] = [
                    spec(item) if isinstance(item, str) and item.strip() else item
                    for item in value
                ]
            else:
                mark_tree(value)
        return
    if isinstance(node, list):
        for value in node:
            mark_tree(value)


def marked(design: dict) -> dict:
    design = copy.deepcopy(design)
    mark_tree(design)
    return design


ROUTE_FIXTURES = (
    contract.valid_contract,
    contract.valid_content_contract,
    contract.valid_discovery_contract,
    contract.valid_dialogic_contract,
    contract.valid_task_contract,
    contract.valid_shared_frame_contract,
)


def test_marked_designs_pass_stage_validation_on_every_route():
    for fixture in ROUTE_FIXTURES:
        design, photos = fixture()
        module.validate_design(marked(design), photos, wording_stage=True)


def test_a_marked_design_fails_strict_validation():
    design, photos = contract.valid_contract()
    contract.assert_invalid_contract(
        marked(design), photos, "still holds a wording spec"
    )


def test_a_spec_with_nothing_after_the_marker_is_refused():
    design, photos = contract.valid_contract()
    design = marked(design)
    design["teacherOrientation"] = f"{MARKER}   "
    try:
        module.validate_design(design, photos, wording_stage=True)
    except module.ContractError as exc:
        assert "nothing after it" in str(exc), str(exc)
    else:
        raise AssertionError("empty spec unexpectedly validated")


def test_a_marker_buried_mid_string_is_refused():
    design, photos = contract.valid_contract()
    design = marked(design)
    design["teacherOrientation"] = f"Teacher orientation: {MARKER} the rest"
    try:
        module.validate_design(design, photos, wording_stage=True)
    except module.ContractError as exc:
        assert "buries the wording marker" in str(exc), str(exc)
    else:
        raise AssertionError("buried marker unexpectedly validated")


def test_a_half_specced_design_fails_stage_validation():
    # One marker used to satisfy stage mode while the decider quietly wrote
    # the rest of the wording itself, bypassing the fresh-context writers.
    design, photos = contract.valid_contract()
    design = marked(design)
    design["vocabulary"][0]["definition"] = (
        "A fully finished definition written by the decider."
    )
    try:
        module.validate_design(design, photos, wording_stage=True)
    except module.ContractError as exc:
        assert "must still be a wording spec at this stage" in str(exc), str(exc)
        assert "definition" in str(exc), str(exc)
    else:
        raise AssertionError("half-specced design unexpectedly validated")


def test_a_spec_in_planning_metadata_is_refused():
    # Planning fields are the decider's to write final; a spec there routes
    # a teacher-facing note through the child-wording pass.
    design, photos = contract.valid_contract()
    design = marked(design)
    design["teachingSequence"][2]["speakerNotes"]["lookFor"] = (
        f"{MARKER} what to look for while children work"
    )
    try:
        module.validate_design(design, photos, wording_stage=True)
    except module.ContractError as exc:
        assert "planning metadata" in str(exc), str(exc)
    else:
        raise AssertionError("planning-field spec unexpectedly validated")


def test_a_design_with_no_specs_fails_stage_validation():
    # A decider that marked nothing wrote the finished wording itself, which
    # defeats the fresh-context words pass the split exists for. The walk
    # names every finished string standing where a spec was owed.
    design, photos = contract.valid_contract()
    try:
        module.validate_design(design, photos, wording_stage=True)
    except module.ContractError as exc:
        assert "must still be a wording spec at this stage" in str(exc), str(exc)
    else:
        raise AssertionError("unmarked design unexpectedly passed stage mode")


def mark_worksheet_only(design: dict) -> dict:
    """The state the Lesson Author hands to the Worksheet Content Designer:
    every string finished except the worksheet's own."""
    design = copy.deepcopy(design)
    marked_ws = {"worksheet": copy.deepcopy(design["worksheet"])}
    mark_tree(marked_ws)
    design["worksheet"] = marked_ws["worksheet"]
    return design


def test_scoped_stage_mode_accepts_specs_only_in_the_worksheet():
    design, photos = contract.valid_contract()
    module.validate_design(
        mark_worksheet_only(design), photos,
        wording_stage=True, wording_scope="worksheet",
    )


def test_scoped_stage_mode_refuses_a_spec_outside_the_scope():
    # A lesson spec surviving the author must fail its own check, not slip
    # through to be discovered downstream.
    design, photos = contract.valid_contract()
    design = mark_worksheet_only(design)
    design["teacherOrientation"] = spec("orientation the author never wrote")
    try:
        module.validate_design(
            design, photos, wording_stage=True, wording_scope="worksheet"
        )
    except module.ContractError as exc:
        assert "outside `lesson-design.json.worksheet`" in str(exc), str(exc)
    else:
        raise AssertionError("out-of-scope spec unexpectedly validated")


def test_scoped_stage_mode_accepts_zero_specs():
    # A provided-by-teacher worksheet has no strings at all to leave, so the
    # authored design legitimately carries no specs anywhere.
    design, photos = contract.valid_contract()
    design["worksheet"].update({
        "status": "provided-by-teacher",
        "resourceMode": "per-child",
        "activityArchitecture": None,
        "sheetShape": None,
        "demand": None,
        "successCriteriaRefs": [],
        "stickyKnowledgeRefs": [],
        "fitPriority": None,
        "centralWriteOnVisualException": None,
        "contentBlocks": [],
        "answerKeyMode": "not-applicable",
        "providedWorksheet": {
            "source": "teacher-supplied.pdf",
            "skillMatch": "Aligned with LO",
            "duplicateCheck": "No slide example duplicates its values.",
            "notes": "",
        },
    })
    module.validate_design(
        design, photos, wording_stage=True, wording_scope="worksheet"
    )


def test_scoped_stage_mode_requires_worksheet_strings_to_stay_specs():
    # After the author, a generated worksheet's own strings must still be
    # specs: finished worksheet wording at that point means the author wrote
    # the sheet the worksheet content designer owns.
    design, photos = contract.valid_contract()
    try:
        module.validate_design(
            design, photos, wording_stage=True, wording_scope="worksheet"
        )
    except module.ContractError as exc:
        assert "worksheet" in str(exc), str(exc)
        assert "must still be a wording spec" in str(exc), str(exc)
    else:
        raise AssertionError(
            "finished worksheet wording unexpectedly passed scoped stage mode"
        )


def test_stage_validation_still_enforces_decision_rules():
    # Wording may be a spec; decisions are still held to the full contract.
    design, photos = contract.valid_contract()
    design = marked(design)
    design["lesson"]["subject"] = "Mathematics"
    try:
        module.validate_design(design, photos, wording_stage=True)
    except module.ContractError as exc:
        assert "must be exactly 'Maths'" in str(exc), str(exc)
    else:
        raise AssertionError("stage mode skipped a decision rule")


def test_a_marker_in_the_photo_contract_is_refused_in_both_modes():
    # The photograph contract is planning material, never child-facing
    # wording, so the decider finishes it completely in one pass.
    for wording_stage in (False, True):
        design, photos = contract.valid_contract()
        if wording_stage:
            design = marked(design)
        photos = copy.deepcopy(photos)
        photos["lesson_name"] = spec("Adding two-digit numbers")
        try:
            module.validate_design(design, photos, wording_stage=wording_stage)
        except module.ContractError as exc:
            assert "photo-requirements.json" in str(exc), str(exc)
        else:
            raise AssertionError("photo-contract marker unexpectedly validated")


def test_the_stage_receipt_is_distinct_from_the_strict_receipt(capsys=None):
    # Orchestration reads exact markers; a stage pass must never print the
    # marker that means "fully worded and buildable".
    design, photos = contract.valid_contract()
    design = marked(design)
    with tempfile.TemporaryDirectory() as tmp:
        design_path = Path(tmp) / "lesson-design.json"
        photos_path = Path(tmp) / "photo-requirements.json"
        design_path.write_text(json.dumps(design), encoding="utf-8")
        photos_path.write_text(json.dumps(photos), encoding="utf-8")
        import subprocess
        import sys

        stage = subprocess.run(
            [sys.executable, str(contract.VALIDATOR), "--wording-stage",
             str(design_path), str(photos_path)],
            capture_output=True, text=True,
        )
        assert stage.returncode == 0, stage.stderr
        assert stage.stdout.strip() == "LESSON_DESIGN_WORDING_STAGE_OK"

        strict = subprocess.run(
            [sys.executable, str(contract.VALIDATOR),
             str(design_path), str(photos_path)],
            capture_output=True, text=True,
        )
        assert strict.returncode == 1
        assert "still holds a wording spec" in strict.stderr


if __name__ == "__main__":
    for name, value in sorted(globals().items()):
        if name.startswith("test_") and callable(value):
            value()
    print("ok")
