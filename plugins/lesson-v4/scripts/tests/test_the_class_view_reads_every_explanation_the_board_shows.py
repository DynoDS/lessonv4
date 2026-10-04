"""Words children read on the board are in the reviewer's view of the class.

Settled item 7e on the routes list (24 September 2026): a skill lesson's short
explanation before the first model is written in its `prepare` unit's `activity`
in `explanation` mode and read on the board, and a task lesson's teaching is
shown on its `modelledOn` instance. Both were left out of `As the class meets
it`, which lists every string a child reads or hears, so the reviewer's
board-first read and its voice sweep never saw them. The designer's list of
what is child-facing says the same now.
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TESTS = Path(__file__).resolve().parent


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


packet = load("class_view_reads_packet", ROOT / "scripts" / "design-review-packet.py")
contract = load("class_view_reads_contract", TESTS / "test_lesson_design_contract.py")

EXPLANATION = "Rounding gives a number that is easy to use. We look at the digit after the one we round to."


def prepare(mode: str) -> dict:
    return contract.source_unit(1, "prepare", {"mode": mode, "activity": EXPLANATION})


class TheSkillExplanationIsRead(unittest.TestCase):
    def test_a_prepare_explanation_is_in_the_class_view(self) -> None:
        out = packet.class_view_unit(prepare("explanation"), criteria={}, sticky={})
        self.assertIn(EXPLANATION, " ".join(out))

    def test_another_prepare_mode_keeps_its_activity_for_the_designer(self) -> None:
        out = packet.class_view_unit(prepare("pattern-investigation"), criteria={}, sticky={})
        self.assertNotIn(EXPLANATION, " ".join(out))

    def test_the_review_content_marks_it_as_printed_in_the_class_view(self) -> None:
        residual = packet.review_content(prepare("explanation"))
        self.assertEqual(residual["activity"], packet.IN_CLASS_VIEW)
        self.assertEqual(packet.review_content(prepare("bounded-attempt"))["activity"], EXPLANATION)

    def test_the_whole_view_counts_it(self) -> None:
        # The same beat in another mode prints its script but not its activity.
        design, _photos = contract.valid_contract()
        design["teachingSequence"].insert(0, prepare("pattern-investigation"))
        lines, before = packet.build_class_view(design)
        self.assertNotIn(EXPLANATION, "\n".join(lines))
        design["teachingSequence"][0] = prepare("explanation")
        lines, after = packet.build_class_view(design)
        self.assertEqual(after, before + 1)
        self.assertIn(EXPLANATION, "\n".join(lines))


class TheTaskInstanceIsRead(unittest.TestCase):
    def test_modelled_on_is_in_the_class_view(self) -> None:
        design, _photos = contract.valid_task_contract()
        teach = next(u for u in design["teachingSequence"] if u["kind"] == "teach-needed")
        lines, _count = packet.build_class_view(design)
        self.assertIn(teach["content"]["modelledOn"], "\n".join(lines))
        self.assertIn("modelledOn", packet.CHILD_FACING_CONTENT_KEYS)


class TheDesignerSaysTheSame(unittest.TestCase):
    def test_the_designers_list_names_both(self) -> None:
        designer = " ".join((ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8").split())
        self.assertIn("so is a skill `prepare` unit's `activity` in `explanation` mode, which is the explanation "
                      "children read on the board, and a task lesson's `modelledOn`, the instance its teaching is "
                      "shown on.", designer)


if __name__ == "__main__":
    unittest.main()
