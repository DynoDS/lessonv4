"""Every worker is told to save a long script as a file before running it.

Claude Code on Windows cuts a shell command longer than about 7,500 characters
short, so a page-filling script typed straight into the shell fails with
`unexpected EOF` (or, past about 32,000, `ENAMETOOLONG`). In the 15 October 2026
five-lesson round this happened in four of the five lessons, and a decorator
tidying up deleted the slide designer's attempt file. The one line every worker
prompt carries, `SCRATCH_DIR:`, is where both are said, so each copy of that
line that carries words must carry these two.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SKILL = ROOT / "skills" / "make-lesson" / "SKILL.md"
HELPER_ROUTE = ROOT / "references" / "helper-route.md"

SAVE_THEN_RUN = (
    "save a script longer than a few lines here with your file tool and run "
    "it by path, because the shell cuts a long typed command short on Windows"
)
DELETE_ONLY_YOUR_OWN = "delete no file outside it that you did not make"


def scratch_lines(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    return re.findall(r"^SCRATCH_DIR: .*\(yours alone:.*$", text, flags=re.M)


class ALongScriptIsSavedBeforeItRuns(unittest.TestCase):
    def test_every_worded_scratch_line_says_save_then_run(self):
        for path in (SKILL, HELPER_ROUTE):
            lines = scratch_lines(path)
            with self.subTest(file=path.name):
                self.assertEqual(len(lines), 1, "one worded SCRATCH_DIR line")
                self.assertIn(SAVE_THEN_RUN, lines[0])
                self.assertIn(DELETE_ONLY_YOUR_OWN, lines[0])

    def test_the_two_worded_lines_say_the_same_thing(self):
        def words(path: Path) -> str:
            return scratch_lines(path)[0].split("(yours alone:", 1)[1]

        self.assertEqual(words(SKILL), words(HELPER_ROUTE))

    def test_the_playbook_lines_are_still_sent_with_the_words(self):
        # The playbook's templates print the path only; the clause reaches a
        # worker because the skill tells the orchestrator to add the words.
        text = " ".join(SKILL.read_text(encoding="utf-8").split())
        self.assertIn("send it with the words in brackets", text)


if __name__ == "__main__":
    unittest.main()
