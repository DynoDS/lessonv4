"""Where children record an answer is the teacher's choice, so no lesson names it.

Daniel read a Year 4 RE deck (5 October 2026) whose quick check said `Write your
answer on your whiteboard.` and ruled: "It should never say whiteboards or books
or anything like that. That's up to teacher." The rule was already in
`preferences.md` as a "normally"; the design reviewer had sent the lesson back
for checks where no child committed an answer, and the redesign named a
whiteboard on three boards, in three scripts and in the teacher's orientation.

He ruled on the line itself too: `Write your answer` "is a waste of time, the
pencil icon does that for us". So a board line that only says to write the
answer is refused, and a line that says how much is kept.
"""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]

spec = importlib.util.spec_from_file_location("validate_lesson_design_recording", SCRIPTS / "validate-lesson-design.py")
assert spec and spec.loader
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def design(task: str, script: str = "Say to children: Have a go.", orientation: str = "Teacher orientation: A lesson.") -> dict:
    return {
        "teacherOrientation": orientation,
        "starter": None,
        "teachingSequence": [
            {
                "content": {"task": task},
                "pupilInstruction": None,
                "taskStructure": None,
                "speakerNotes": {"script": script, "teacherInfo": None, "lookFor": None},
                # A designer's own reasoning may still think about whiteboards.
                "levels": {"boardOnlyBecause": "One word on a mini-whiteboard is enough."},
            }
        ],
        "ending": None,
    }


class RecordingIsTheTeachersChoice(unittest.TestCase):
    def refused(self, **kwargs) -> str:
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_recording_is_the_teachers_choice(design(**kwargs))
        return str(caught.exception)

    def allowed(self, **kwargs) -> None:
        validator.validate_recording_is_the_teachers_choice(design(**kwargs))

    def test_a_board_that_names_a_whiteboard_is_refused(self) -> None:
        message = self.refused(task="What does the orange stand for? Write its meaning on your whiteboard.")
        self.assertIn("teachingSequence[0].content.task", message)
        self.assertIn("on your whiteboard", message)

    def test_the_script_and_the_orientation_are_held_to_it_too(self) -> None:
        self.assertIn(
            "speakerNotes.script",
            self.refused(task="What does the orange stand for?", script="Say to children: Write one word on your whiteboard."),
        )
        self.assertIn(
            "teacherOrientation",
            self.refused(task="What does the orange stand for?", orientation="Teacher orientation: Quick checks use mini-whiteboards."),
        )

    def test_writing_in_a_book_is_refused(self) -> None:
        self.refused(task="Write the date and your answer in your book.")
        self.refused(task="Draw the circuit in your science books.")

    def test_a_line_that_only_says_to_write_the_answer_is_refused_on_the_board(self) -> None:
        message = self.refused(task="What does the orange stand for? Write your answer.")
        self.assertIn("pencil sign", message)
        # The teacher may still say it aloud.
        self.allowed(task="What does the orange stand for?", script="Say to children: Write your answer. One word is enough.")

    def test_the_action_and_how_much_stay(self) -> None:
        self.allowed(task="What does the orange stand for? Write one word before you talk.")
        self.allowed(task="Write one reason.")

    def test_a_whiteboard_or_a_book_that_is_the_subject_is_not_a_recording_surface(self) -> None:
        self.allowed(task="A Victorian classroom had no interactive whiteboard. What else has changed?")
        self.allowed(task="Find the word 'gloomy' in your reading book.")
        self.allowed(task="Answer the three questions on your sheet.")


if __name__ == "__main__":
    unittest.main()
