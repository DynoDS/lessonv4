"""Each content subject shows what its worksheets can look like (29 September 2026).

Daniel judged the maths sheets much better than every other subject's. Maths
had a whole worksheet standard in its subject file; the other subjects had
none, so their sheets defaulted to a block of reading and writing lines. Real
Year 3 and 4 sheets (Oak National Academy, Classroom Secrets, TAPS) showed
about a dozen shapes that work outside maths. His ruling: the designer chooses
the shape that fits the lesson from several, and no one shape (a knowledge
task then a thinking task, say) becomes the template.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "references"


def flat(path: Path) -> str:
    return re.sub(r"\s+", " ", path.read_text(encoding="utf-8"))


class EachSubjectShowsItsSheetShapes(unittest.TestCase):
    def test_every_content_subject_has_a_worksheet_section_that_is_a_menu(self) -> None:
        for subject in ("history", "geography", "science", "re", "pshe"):
            with self.subTest(subject=subject):
                text = flat(REF / f"subject-{subject}.md")
                self.assertIn("## What a worksheet looks like in", text)
                self.assertIn("none is the default", text)
                self.assertIn("Below and Greater Depth choose from the same set", text)

    def test_the_lesson_designer_is_routed_to_it_and_told_it_is_not_a_template(self) -> None:
        text = flat(REF / "lesson-designer-components.md")
        self.assertIn("a `What a worksheet looks like` section", text)
        self.assertIn("it is a menu, never a template or a rotation", text)
        # The old line pointed at a "subject page standard" only maths had.
        self.assertNotIn("choose shape with subject page standard", text)

    def test_paper_is_a_tie_break_never_a_reason_to_lose_thinking(self) -> None:
        text = flat(REF / "lesson-designer-components.md")
        self.assertIn("When two shapes carry the thinking equally well, prefer the one a child can answer in their book from a small question slip", text)
        self.assertIn("never give up thinking to get there", text)

    def test_the_adaptation_designer_uses_the_same_shapes(self) -> None:
        self.assertIn(
            "its `What a worksheet looks like` section holds the sheet shapes a separate Below or Greater Depth resource chooses from too",
            flat(ROOT / "agents" / "adaptation-designer.md"),
        )


if __name__ == "__main__":
    unittest.main()
