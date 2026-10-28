"""A beat takes at least as long as its slides take to teach by asking (20 October 2026).

A cover teacher read each slide of a Year 4 history plan, asked the class up to
every line on it and ran its tasks: the first twelve slides, planned at 17
minutes, took him 40. The script is the teacher's help and is not counted.
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import taught_time  # noqa: E402


def words(n):
    return " ".join(["word"] * n)


def beat(minutes, board, script=0, **extra):
    return dict(minutes=minutes, content={"explanation": words(board)},
                speakerNotes={"script": words(script)}, **extra)


class TaughtTime(unittest.TestCase):
    def test_the_cover_lesson_is_timed_as_it_was_taught(self):
        # The cholera lesson up to the brewery check: about 635 words on its boards.
        design = {
            "starter": beat(3, 63),
            "teachingSequence": [beat(5, 149, label="smell"), beat(3, 103), beat(4, 132), beat(2, 149)],
            "vocabulary": [{"term": "cholera", "definition": words(19)}, {"term": "treatment", "definition": words(18)}],
        }
        total, rows = taught_time.honest_minutes(design)
        self.assertGreaterEqual(total, 38)  # he took about 40
        self.assertLessEqual(total, 44)
        self.assertIn(("smell", 5, 10), rows)

    def test_the_script_is_not_counted(self):
        short = taught_time.honest_minutes({"teachingSequence": [beat(2, 40, script=10)]})
        long = taught_time.honest_minutes({"teachingSequence": [beat(2, 40, script=900)]})
        self.assertEqual(short, long)

    def test_planned_minutes_stand_when_the_work_is_longer_than_the_words(self):
        # Independent writing is time the board does not show.
        total, _rows = taught_time.honest_minutes({"teachingSequence": [beat(12, 50)]})
        self.assertEqual(total, 12)

    def test_the_lesson_is_rounded_once_not_beat_by_beat(self):
        # 21 October 2026: five clearer words on one beat crossed its whole-minute
        # line and cost a full minute, so the teacher's own instruction was refused.
        # Three beats of 17 board words are 51 words, about 3.2 minutes: 4, not 6.
        total, rows = taught_time.honest_minutes({"teachingSequence": [beat(0, 17), beat(0, 17), beat(0, 17)]})
        self.assertEqual(total, 4)
        self.assertEqual([taught for _label, _planned, taught in rows], [2, 2, 2])


if __name__ == "__main__":
    unittest.main()
