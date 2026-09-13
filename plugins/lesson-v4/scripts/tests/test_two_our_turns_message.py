"""Two Our Turn units in a row are refused with a message that says so.

The scaffold used to let a second Our Turn fall through to "has a my-turn
cycle with no your-turn after it", when a Your Turn sat straight after it.
Four lesson runs spent a retry working out what was actually wrong
(13 September 2026). One Our Turn unit holds every guided example.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCAFFOLD = Path(__file__).resolve().parents[1] / "lesson-design-scaffold.py"

REQUEST = {
    "schemaVersion": 1, "structure": "Skill-based", "yearGroup": 4, "subject": "Maths",
    "scope": "Complete lesson", "vocabularyCount": 1, "vocabularyIntroductionCount": 1,
    "trimmedVocabularyCount": 0,
    "representations": [{"configurations": [{"id": "model", "loadBearing": True}]}],
    "successCriteriaCount": 1, "stickyKnowledgeCount": 0, "misconceptionCount": 1,
    "concepts": [{"successCriteriaIndexes": [1]}],
    "teachingSequence": [],
    "endingIncluded": False,
    "worksheet": {"status": "generated", "resourceMode": "per-child",
                  "use": "separate-fresh-worksheet", "sheetShape": "question-set"},
    "photoCount": 0,
}


def run(sequence):
    request = dict(REQUEST, teachingSequence=sequence)
    with tempfile.TemporaryDirectory() as tmp:
        req = Path(tmp) / "request.json"
        req.write_text(json.dumps(request), encoding="utf-8")
        return subprocess.run(
            [sys.executable, str(SCAFFOLD), "--request", str(req),
             "--lesson-design", str(Path(tmp) / "d.json"),
             "--photo-requirements", str(Path(tmp) / "p.json")],
            capture_output=True, text=True,
        )


class TwoOurTurns(unittest.TestCase):
    def test_a_second_our_turn_is_named_as_the_fault(self):
        result = run([{"kind": "my-turn", "conceptIndex": 1}, {"kind": "our-turn", "conceptIndex": 1},
                      {"kind": "our-turn", "conceptIndex": 1}, {"kind": "your-turn", "conceptIndex": 1}])
        out = result.stdout + result.stderr
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("two our-turn units in a row", out)
        self.assertNotIn("no your-turn after it", out)

    def test_one_our_turn_is_still_accepted(self):
        result = run([{"kind": "my-turn", "conceptIndex": 1}, {"kind": "our-turn", "conceptIndex": 1},
                      {"kind": "your-turn", "conceptIndex": 1}])
        self.assertNotIn("our-turn units in a row", result.stdout + result.stderr)
        self.assertNotIn("no your-turn after it", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
