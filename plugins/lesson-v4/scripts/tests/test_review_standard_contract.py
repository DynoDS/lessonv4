"""A reviewer judges a classroom resource against this package, and nothing else.

Opening a built `.pptx` can wake a general-purpose presentation skill the host
offers. It is written for business decks - template pickers, house styles,
narrative arcs, corporate density and typography norms - and it arrives without
being asked for, so nothing in it was chosen for this job. A reviewer reading it
starts measuring a Year 4 deck against a boardroom, and the finding that reaches
the teacher is about the wrong artefact entirely.

The rule lives in `review-evidence.md` because both reviewers read that file
before writing any finding, which is the exact moment the standard has to be
settled.
"""
from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "references" / "review-evidence.md"
VISUAL_REVIEWER = ROOT / "agents" / "visual-reviewer.md"
CONSISTENCY_REVIEWER = ROOT / "agents" / "visual-consistency-reviewer.md"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class ReviewStandardTests(unittest.TestCase):
    def test_the_evidence_reference_settles_what_a_finding_is_measured_against(self):
        text = read(EVIDENCE)
        self.assertIn("The standard a finding is measured against", text)
        self.assertIn("They do not apply here", text)
        self.assertIn("nothing in one ever\nbecomes a finding", text)

    def test_it_names_the_host_skill_case_rather_than_reading_discipline_alone(self):
        # "Read nothing else" does not cover a skill the host loads on its own:
        # the reviewer never chose to read it.
        text = read(EVIDENCE)
        for token in ("general-purpose skill", "without being asked for", "host"):
            self.assertIn(token, text)

    def test_a_finding_must_trace_to_this_package(self):
        text = read(EVIDENCE)
        self.assertIn("lesson-design.json", text)
        self.assertIn("is not a finding", text)

    def test_repair_stays_on_the_fixed_build_route(self):
        # A general document tool editing a built deck bypasses the spec that
        # every other surface is rebuilt from.
        text = read(EVIDENCE)
        self.assertIn("own fixed\nbuild command", text)
        self.assertIn("Never edit a built file directly", text)

    def test_both_reviewers_read_it_before_writing_a_finding(self):
        for path in (VISUAL_REVIEWER, CONSISTENCY_REVIEWER):
            text = read(path)
            self.assertIn("review-evidence.md", text)
            self.assertIn("before writing any finding", text)


if __name__ == "__main__":
    unittest.main()
