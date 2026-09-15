"""A structured sort's key can accept a card in a second group, with a reason.

`knowing when bread is baked just right` was keyed to `helped him when he grew
up` in the Tudor lesson taught on 15 September 2026, and a child who put it
under `helped him straight away` because he was learning it now was right as
well. The contract refused an `acceptanceCondition` on a structured sort, so
the only key a designer could write was the exclusive one, and the reviewer had
nothing to read a defensible second placement against.

The condition is teacher-facing: it reaches the speaker notes as `Also accept:`
and the review view as an acceptance line, and never prints for children.
"""
from __future__ import annotations

import copy
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
SLIDE_DESIGNER = ROOT / "agents" / "slide-designer.md"
PREFERENCES = ROOT / "references" / "preferences.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


SORT = {
    "kind": "sort",
    "groups": [
        {"id": "group-001", "label": "Helped him straight away"},
        {"id": "group-002", "label": "Helped him when he grew up"},
    ],
    "items": [
        {"id": "item-001", "label": "a hot dinner every day", "detail": None, "photoRef": None},
        {"id": "item-002", "label": "knowing when bread is baked just right", "detail": None, "photoRef": None},
        {"id": "item-003", "label": "his own shop one day", "detail": None, "photoRef": None},
    ],
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
    "acceptanceCondition": (
        "Accept the baking card under either heading: he learned it now, and it earned his living later."
    ),
    "delivery": "teacher-only",
}


class TheValidatorAcceptsTheSecondHomeTests(unittest.TestCase):
    def setUp(self):
        self.module = load("vld_sort_acceptance", "validate-lesson-design.py")

    def test_an_acceptance_condition_on_a_structured_sort_validates(self):
        self.module.validate_answer(copy.deepcopy(ANSWER), "answer", task_structure=SORT)

    def test_a_structured_sort_without_one_still_validates(self):
        answer = copy.deepcopy(ANSWER)
        answer["acceptanceCondition"] = None
        self.module.validate_answer(answer, "answer", task_structure=SORT)

    def test_the_key_itself_still_names_every_card_once(self):
        answer = copy.deepcopy(ANSWER)
        answer["structure"]["placements"].append({"itemRef": "item-002", "groupRef": "group-001"})
        with self.assertRaises(self.module.ContractError) as caught:
            self.module.validate_answer(answer, "answer", task_structure=SORT)
        self.assertIn("duplicate itemRef", str(caught.exception))


class TheConditionReachesTheTeacherTests(unittest.TestCase):
    """Wiring only: the words that route the condition to the notes and name
    the repair are present. This proves nothing about the keys designers write."""

    def test_the_contract_says_what_the_condition_is_for(self):
        text = flat(OUTPUT_TEMPLATE)
        self.assertIn("`acceptanceCondition` may name a second placement the teacher accepts", text)
        self.assertIn("never prints for children", text)

    def test_the_slide_designer_composes_it_as_also_accept(self):
        text = flat(SLIDE_DESIGNER)
        self.assertIn("follow the answer with `Also accept:`", text)
        self.assertIn("including for a structured sort", text)

    def test_preferences_names_the_three_repairs_and_drops_the_exclusive_key(self):
        text = flat(PREFERENCES)
        self.assertNotIn("The hard card has one right home once the idea is used", text)
        self.assertIn("a key that marks that child wrong is the fault, not the child", text)
        self.assertIn("choose a cleaner card", text)
        self.assertIn("record the second placement as accepted, with its reason", text)


if __name__ == "__main__":
    unittest.main()
