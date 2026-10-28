"""Clearer wording may add up to a minute past the limit (21 October 2026).

The voice editor could not add "Put your finger on the UK" to a lesson already
at 50 minutes, and the instruction went out with no starting point. The teacher
ruled: "let clearer wording add up to a minute". The minute is given only when
the design as it stood before the wording pass fitted the limit, so it can
never carry a design that was already too long.
"""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location("validate_lesson_design", SCRIPTS / "validate-lesson-design.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def design_of(board_words):
    # One beat whose board alone sets its time (16 words a minute).
    return {"teachingSequence": [{"minutes": 0, "content": {"explanation": " ".join(["word"] * board_words)}}]}


class WordingAllowance(unittest.TestCase):
    def allowance_with_before(self, before_words):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "lesson-design.json"
            path.write_text("{}", encoding="utf-8")
            if before_words is not None:
                (Path(folder) / module.DESIGN_BEFORE_WORDING).write_text(json.dumps(design_of(before_words)), encoding="utf-8")
            return module.wording_allowance(path)

    def test_a_design_that_fitted_gets_the_minute(self):
        self.assertEqual(self.allowance_with_before(45 * 16), 1)

    def test_a_design_that_was_already_too_long_gets_nothing(self):
        self.assertEqual(self.allowance_with_before(46 * 16), 0)

    def test_no_wording_pass_means_no_minute(self):
        self.assertEqual(self.allowance_with_before(None), 0)


if __name__ == "__main__":
    unittest.main()
