"""A wall the build refuses arrives after the focused repair's split.

The wall's one repair round is a focused repair and a rebuild. When the repair
is a split in order over two cards that leaves one card a single item (the
teacher's rule of one three-line fact a card sends the next fact to a card of
its own), the scope check refused it as a lost order, and with one round the
wall was lost (release 7A's fourth check, 26 September 2026). This runs the
route's own three steps on a real wall: the build through run-fixed-resource.py
refuses a sticky card too tall for its page, the split that leaves the second
card one fact passes check-repair-scope.py, and the rebuild delivers the wall.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

PLUGIN = Path(__file__).resolve().parents[2]
RUNNER = PLUGIN / "scripts" / "run-fixed-resource.py"
SCOPE = PLUGIN / "scripts" / "check-repair-scope.py"
PHOTO = PLUGIN / "working-wall-html" / "test-fixtures-a3" / "photos" / "pizza.jpg"

FACTS = [
    "Vikings sailed from Scandinavia in longships to raid and trade.",
    "Monks at Lindisfarne kept books and silver in the monastery.",
    "Some Viking families later settled and farmed land in England.",
    "Alfred the Great fought the Vikings and made peace with them.",
    "Viking place names such as Grimsby still show where they lived.",
]


def sticky(facts: list[str]) -> dict:
    return {
        "type": "stickyKnowledge",
        "page": {"size": "A3", "orientation": "landscape"},
        "title": "Remember",
        "photo": "photos/fact.jpg",
        "items": [{"text": text} for text in facts],
    }


class ASplitWallArrives(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        self.working = root / "working"
        self.output = root / "output"
        (self.working / "photos").mkdir(parents=True)
        self.output.mkdir()
        shutil.copyfile(PHOTO, self.working / "photos" / "fact.jpg")
        self.summary = root / "summary.json"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write_wall(self, cards: list[dict]) -> Path:
        path = self.working / "working-wall.json"
        path.write_text(json.dumps({"topic": "Vikings", "cards": cards}), encoding="utf-8")
        return path

    def build(self) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(RUNNER), "wall", "--lesson-name", "Vikings",
             "--plugin-root", str(PLUGIN), "--working-dir", str(self.working),
             "--output-dir", str(self.output), "--summary-output", str(self.summary)],
            capture_output=True, text=True, encoding="utf-8", check=False,
        )

    def test_the_split_passes_its_scope_check_and_the_wall_arrives(self) -> None:
        before = self.write_wall([sticky(FACTS)])
        refused = self.build()
        self.assertNotEqual(refused.returncode, 0, "five facts on one card should be too tall for its page")
        failed = json.loads(self.summary.read_text(encoding="utf-8"))
        self.assertIn("5 items need", failed["stderr"] + failed.get("stdout", ""))
        kept = self.working / "before.json"
        shutil.copyfile(before, kept)

        after = self.write_wall([sticky(FACTS[:4]), sticky(FACTS[4:])])
        scope = subprocess.run(
            [sys.executable, str(SCOPE), "--before", str(kept), "--after", str(after)],
            capture_output=True, text=True, encoding="utf-8", check=False,
        )
        self.assertEqual(scope.returncode, 0, scope.stdout + scope.stderr)
        self.assertIn("REPAIR_SCOPE_OK", scope.stdout)

        built = self.build()
        self.assertEqual(built.returncode, 0, built.stdout + built.stderr)
        walls = [path for path in self.output.iterdir() if path.name.startswith("Working Wall - Vikings")]
        self.assertEqual(len(walls), 1, [path.name for path in self.output.iterdir()])


if __name__ == "__main__":
    unittest.main()
