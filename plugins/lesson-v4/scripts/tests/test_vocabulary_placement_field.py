"""The vocabulary slide may follow the beat that gave its words meaning.

A lesson that shows a Victorian classroom and asks what is the same and what
is different, and only then says the first is called a continuity and the
second a change, has to be able to say so: `vocabularyPlacement` names the
teaching-sequence unit the one vocabulary slide follows. Null, or the key left
out, keeps the slide straight after the starter.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

CONTRACT_TESTS = Path(__file__).with_name("test_lesson_design_contract.py")
SPEC = importlib.util.spec_from_file_location("contract_tests_vp", CONTRACT_TESTS)
assert SPEC is not None and SPEC.loader is not None
contract = importlib.util.module_from_spec(SPEC)
sys.modules["contract_tests_vp"] = contract
SPEC.loader.exec_module(contract)

module = contract.module
valid_content_contract = contract.valid_content_contract
assert_invalid_contract = contract.assert_invalid_contract

ROOT = Path(__file__).resolve().parents[1]
SCAFFOLD = ROOT / "lesson-design-scaffold.py"


def test_key_may_be_omitted_by_an_older_design():
    design, photos = valid_content_contract()
    design.pop("vocabularyPlacement", None)
    module.validate_design(design, photos)


def test_null_keeps_the_default_placement():
    design, photos = valid_content_contract()
    design["vocabularyPlacement"] = None
    module.validate_design(design, photos)


def test_after_a_real_teaching_unit_passes():
    design, photos = valid_content_contract()
    design["vocabularyPlacement"] = {"after": design["teachingSequence"][0]["sourceUnitId"]}
    module.validate_design(design, photos)


def test_after_an_unknown_unit_is_refused():
    design, photos = valid_content_contract()
    design["vocabularyPlacement"] = {"after": "lesson-section/teaching-sequence/unit-099"}
    assert_invalid_contract(
        design, photos, "vocabularyPlacement.after must name a teachingSequence sourceUnitId"
    )


def test_the_starter_is_not_a_placement_target():
    design, photos = valid_content_contract()
    design["vocabularyPlacement"] = {"after": "lesson-section/starter/unit-001"}
    assert_invalid_contract(
        design, photos, "vocabularyPlacement.after must name a teachingSequence sourceUnitId"
    )


def test_any_other_shape_is_refused():
    design, photos = valid_content_contract()
    design["vocabularyPlacement"] = {"before": "lesson-section/teaching-sequence/unit-001"}
    assert_invalid_contract(design, photos, "vocabularyPlacement")


def test_scaffold_emits_the_field_as_null():
    scaffold_tests = Path(__file__).with_name("test_lesson_design_scaffold.py")
    spec = importlib.util.spec_from_file_location("scaffold_tests_vp", scaffold_tests)
    assert spec is not None and spec.loader is not None
    tests = importlib.util.module_from_spec(spec)
    sys.modules["scaffold_tests_vp"] = tests
    spec.loader.exec_module(tests)
    design, _photos = tests.scaffold.build_scaffold(tests.base_request())
    assert "vocabularyPlacement" in design
    assert design["vocabularyPlacement"] is None
