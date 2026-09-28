"""Ordinary reveal declarations do not hide changes to authored content."""
from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-repair-scope.py"

spec = importlib.util.spec_from_file_location("repair_scope", SCRIPT)
scope = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(scope)


class RevealMetadataScopeTests(unittest.TestCase):
    def setUp(self) -> None:
        def slide(title: str, values: list[str], state: str | None = None) -> dict:
            items = [{"type": "text", "value": "Change each sentence to the past tense."}]
            for source_id, value in zip(("a", "b", "c"), values):
                item = {"type": "text", "id": source_id, "value": value}
                if state is not None:
                    item["revealPair"] = {"id": f"grammar-{source_id}", "state": state}
                items.append(item)
            return {"title": title, "body": {"type": "stack", "items": items}}

        self.before = {"slides": [
            slide("Changing tense", ["I walk to the gate.", "She runs to the shop.", "We carry the bags."]),
            slide("Changing tense - check", ["||I walked to the gate.", "||She ran to the shop.", "||We carried the bags."]),
        ]}
        self.after = {"slides": [
            slide("Changing tense", ["I walk to the gate.", "She runs to the shop.", "We carry the bags."], "question"),
            slide("Changing tense - check", ["||I walked to the gate.", "||She ran to the shop.", "||We carried the bags."], "answer"),
        ]}

    def check(self, after: dict) -> subprocess.CompletedProcess:
        with TemporaryDirectory() as tmp:
            before_path = Path(tmp) / "before.json"
            after_path = Path(tmp) / "after.json"
            before_path.write_text(json.dumps(self.before), encoding="utf-8")
            after_path.write_text(json.dumps(after), encoding="utf-8")
            return subprocess.run(
            [
                sys.executable, "-S", str(SCRIPT),
                "--before", str(before_path), "--after", str(after_path),
            ],
                capture_output=True, text=True,
            )

    def assert_rejected(self, after: dict) -> None:
        result = self.check(after)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("REPAIR_SCOPE_FAILED", result.stdout)

    def test_real_question_answer_metadata_addition_passes(self):
        result = self.check(self.after)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_loss_of_authored_sentence_still_fails(self):
        changed = copy.deepcopy(self.after)
        changed["slides"][0]["body"]["items"][1]["value"] = "I walk."
        self.assert_rejected(changed)

    def test_rewording_still_fails(self):
        changed = copy.deepcopy(self.after)
        changed["slides"][0]["body"]["items"][1]["value"] = "I stroll to the gate."
        self.assert_rejected(changed)

    def test_item_reorder_still_fails(self):
        changed = copy.deepcopy(self.after)
        items = changed["slides"][0]["body"]["items"]
        items[1], items[2] = items[2], items[1]
        self.assert_rejected(changed)

    def test_source_id_change_still_fails(self):
        changed = copy.deepcopy(self.after)
        changed["slides"][0]["body"]["items"][1]["id"] = "different-source"
        self.assert_rejected(changed)

    def test_only_exact_reveal_pair_is_flat_and_metadata(self):
        valid = {"id": "grammar-a", "state": "question"}
        self.assertTrue(scope.is_flat({"id": "a", "value": "I walk.", "revealPair": valid}))
        self.assertEqual(scope.channel_of("pupil", "revealPair", valid), "metadata")

    def test_arbitrary_nested_objects_remain_containers(self):
        self.assertFalse(scope.is_flat({"value": "I walk.", "other": {"id": "nested"}}))
        self.assertFalse(scope.is_flat({"value": "I walk.", "revealPair": {"id": "a", "nested": {}}}))

    def test_malformed_reveal_pair_is_not_ignored(self):
        malformed = {"id": "grammar-a", "state": "question", "extra": "content"}
        self.assertFalse(scope.is_flat({"value": "I walk.", "revealPair": malformed}))
        self.assertEqual(scope.channel_of("pupil", "revealPair", malformed), "pupil")


if __name__ == "__main__":
    unittest.main()
