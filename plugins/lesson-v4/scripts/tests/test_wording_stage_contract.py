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

# String fields whose value a child reads or hears, by key name. Item labels,
# vocabulary terms and photo fields stay decided by the decider, so they are
# deliberately absent.
WORDING_STRING_KEYS = {
    "script",
    "teacherOrientation",
    "definition",
    "text",
    "example",
    "task",
    "headline",
    "takeaway",
    "prompt",
    "question",
    "discussionQuestion",
    "checkpointQuestion",
    "investigationBrief",
    "pupilInstruction",
    "pupilPrompt",
    "stimulus",
    "pupilAction",
    "groupPrompt",
    "whatGoesHere",
    "firstRowWorked",
    "generator",
    "heading",
    "detail",
}

# List fields holding child-facing strings.
WORDING_LIST_KEYS = {
    "keyQuestions",
    "guidedQuestions",
    "sentenceStems",
    "steps",
}

ANSWER_KEYS = {"kind", "content", "acceptanceCondition", "delivery"}


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


def test_a_design_with_no_specs_fails_stage_validation():
    # A decider that marked nothing wrote the finished wording itself, which
    # defeats the fresh-context words pass the split exists for.
    design, photos = contract.valid_contract()
    try:
        module.validate_design(design, photos, wording_stage=True)
    except module.ContractError as exc:
        assert "found no wording specs" in str(exc), str(exc)
    else:
        raise AssertionError("unmarked design unexpectedly passed stage mode")


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
