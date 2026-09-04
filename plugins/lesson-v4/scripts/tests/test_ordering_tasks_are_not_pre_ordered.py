"""An ordering task must not print its items already in answer order.

The Year 4 history starter of 4 September 2026 read "Put these in order,
earliest first" over Stone Age Britain, Roman Britain, Anglo-Saxon Britain,
today, printed in exactly that order, and the Do beat's chips read 1862, 1897,
2026 under "What came first, next and last?". The designer's rule ("don't
reveal by order or pattern") and the reviewer's check both existed; neither was
a check. The validator now reads the printed order whenever the wording asks
for an order and three or more items carry a date it can read.
"""
from __future__ import annotations

import copy
import importlib.util
import sys
from pathlib import Path

CONTRACT_TESTS = Path(__file__).with_name("test_lesson_design_contract.py")
SPEC = importlib.util.spec_from_file_location("contract_tests", CONTRACT_TESTS)
assert SPEC is not None and SPEC.loader is not None
contract = importlib.util.module_from_spec(SPEC)
sys.modules["contract_tests"] = contract
SPEC.loader.exec_module(contract)

module = contract.module
source_unit = contract.source_unit
valid_content_contract = contract.valid_content_contract
assert_invalid_contract = contract.assert_invalid_contract

ANSWER_ORDER = "prints them already in answer order"


def starter_activity(items: list[str], cue: str = "Put these in order, earliest first:") -> str:
    return cue + "\n\n" + "\n".join(f"- {item}" for item in items) + "\n\nName one source a historian could use."


def with_starter(items: list[str], cue: str = "Put these in order, earliest first:"):
    design, photos = valid_content_contract()
    design["starter"]["content"]["activity"] = starter_activity(items, cue)
    return design, photos


def ordering_do(
    labels: list[str],
    task: str = "What came first, next and last?",
    instruction: str = "Place the sources and today from earliest to latest.",
    activity: str = "Use the dates on the sources",
):
    return source_unit(
        3,
        "do",
        {"activity": activity, "format": None, "task": task},
        pupil_instruction=instruction,
        answer={
            "kind": "exact",
            "content": "the earliest first",
            "acceptanceCondition": None,
            "delivery": "teacher-only",
        },
    ) | {
        "taskStructure": {
            "kind": "option-bank",
            "items": [
                {"id": f"item-{index:03d}", "label": label}
                for index, label in enumerate(labels, 1)
            ],
        }
    }


def with_bank(labels: list[str], **kwargs):
    design, photos = valid_content_contract()
    do_index = next(
        index for index, unit in enumerate(design["teachingSequence"]) if unit["kind"] == "do"
    )
    design["teachingSequence"][do_index] = ordering_do(labels, **kwargs)
    return design, photos


# ── the reported failure ────────────────────────────────────────────────────


def test_starter_list_printed_in_period_order_is_refused():
    design, photos = with_starter(
        ["Stone Age Britain", "Roman Britain", "Anglo-Saxon Britain", "today"]
    )
    assert_invalid_contract(design, photos, ANSWER_ORDER)


def test_option_bank_printed_in_date_order_is_refused():
    design, photos = with_bank(
        ["Hampton timetable, 1862", "Port Sunlight classroom, 1897", "today, 2026"]
    )
    assert_invalid_contract(design, photos, ANSWER_ORDER)


def test_reverse_order_is_also_the_answer():
    design, photos = with_bank(["today, 2026", "1897", "1862"], task="Which is oldest?")
    assert_invalid_contract(design, photos, ANSWER_ORDER)


# ── the repair passes ───────────────────────────────────────────────────────


def test_shuffled_starter_list_passes():
    design, photos = with_starter(
        ["Roman Britain", "today", "Stone Age Britain", "Anglo-Saxon Britain"]
    )
    module.validate_design(design, photos)


def test_shuffled_option_bank_passes():
    design, photos = with_bank(
        ["Port Sunlight classroom, 1897", "today, 2026", "Hampton timetable, 1862"]
    )
    module.validate_design(design, photos)


# ── the boundaries ──────────────────────────────────────────────────────────


def test_a_bank_with_no_ordering_cue_may_stand_in_any_order():
    """A bank of dated sources children choose from, not order, is not an
    ordering task, and its printed order carries no answer."""
    design, photos = with_bank(
        ["Hampton timetable, 1862", "Port Sunlight classroom, 1897", "today, 2026"],
        task="Which source would tell you what lessons children had?",
        instruction="Choose the source that answers the question.",
    )
    module.validate_design(design, photos)


def test_fewer_than_three_datable_items_is_not_judged():
    design, photos = with_bank(
        ["Hampton timetable, 1862", "Port Sunlight classroom, 1897", "a school bell"]
    )
    module.validate_design(design, photos)


def test_undated_labels_are_never_judged():
    design, photos = with_bank(["wake up", "eat breakfast", "walk to school"])
    module.validate_design(design, photos)


def test_years_ago_and_million_years_ago_are_dated():
    design, photos = with_starter(
        ["2,000,000 years ago", "4,000 years ago", "Roman Britain", "today"],
        cue="Put these on the timeline, oldest first:",
    )
    assert_invalid_contract(design, photos, ANSWER_ORDER)
