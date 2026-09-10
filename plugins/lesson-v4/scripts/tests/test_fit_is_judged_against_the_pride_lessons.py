"""The reviewer holds the pride lessons before it judges teacher fit.

Daniel's stated aim for the plugin is a simple, calm, teachable surface with
the pedagogy underneath, and it is written down in `preferences.md` → Pride
Lessons: "The slides were minimal: the question, the tool, the SC. The
teacher's voice filled the rest." The reviewer's routing card sent it there
"only when a difficult quality boundary remains unresolved", and no review
ever found one. On 10 September 2026 the reviewer approved a Year 4 history
design with `Daniel-fit: PASS` on the strength of features present ("both
comparison objects available and live model space retained"); the lesson was
abandoned in the room because one practice beat carried four sources, a task
in three parts and the criteria at once, and the same plate came back on nine
of eighteen slides.

The repair gives the fit judgement its calibration and two questions (how much
one beat puts in front of the class; what is new each time evidence returns),
makes the report's Teacher fit line carry the heaviest beat and the simpler
route compared, and routes Pride Lessons to every review. None of it is a
count: the file says so, because hard caps make lessons worse.
"""

from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
PACKET = ROOT / "scripts" / "design-review-packet.py"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheReviewerJudgesAmountAgainstThePrideLessonsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(DESIGN_REVIEWER)

    def test_the_calibration_is_held_before_the_fit_judgement(self) -> None:
        self.assertIn(
            "Daniel-fit has a calibration, and you hold it before you judge: "
            "`preferences.md` → Pride Lessons.",
            self.text,
        )
        self.assertIn(
            "a slide is the question, the tool and the criteria, and his voice does the rest",
            self.text,
        )

    def test_both_amount_questions_are_asked_and_neither_is_a_count(self) -> None:
        self.assertIn(
            "what does the class look at while the teacher talks, and how much must they read before they can act?",
            self.text,
        )
        self.assertIn(
            "Each time the same object or text comes back, name what is new to work out.",
            self.text,
        )
        self.assertIn("Neither is a count.", self.text)
        self.assertIn(
            "There is no cap on beats, slides, sources or words",
            self.text,
        )

    def test_too_much_is_a_defect_the_designer_repairs_not_polish(self) -> None:
        self.assertIn(
            "Either one is REVISE on Daniel-fit and a purposeful design defect, not polish",
            self.text,
        )

    def test_the_report_line_carries_the_judgement_not_a_feature_list(self) -> None:
        self.assertIn(
            "Teacher fit: [the heaviest beat and what the class looks at there, "
            "the simpler route compared and why this one earned its extra;",
            self.text,
        )
        self.assertIn(
            "A line that lists features present has not made the judgement.",
            self.text,
        )
        self.assertNotIn(
            "each moment contains manageable reading, conceptual and working load",
            self.text,
        )


class TheRoutingCardOpensThePrideLessonsEveryReviewTests(unittest.TestCase):
    def test_pride_lessons_is_no_longer_conditional(self) -> None:
        text = flat(PACKET)
        self.assertNotIn(
            "Read only when a difficult quality boundary remains unresolved.",
            text,
        )
        self.assertIn(
            '"Read every review, before the Daniel-fit judgement: it is the " '
            '"calibration for how much one beat puts in front of the class and how " '
            '"often a lesson returns to the same evidence.',
            text,
        )


if __name__ == "__main__":
    unittest.main()
