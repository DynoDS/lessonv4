"""The split route ships wired, resolvable and off by default.

Design and wording as two passes: lesson-architect decides and writes
wording specs, decision-reviewer judges the compact design, lesson-author
writes the finished words in a fresh context, wording-reviewer checks the
words. The normal route must be untouched, and nothing may choose the split
route except the teacher's own words.
"""
from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / "scripts" / "make-lesson-runtime.py"
WORKER_LAUNCH = ROOT / "scripts" / "worker-launch.py"
ARCHITECT = ROOT / "agents" / "lesson-architect.md"
AUTHOR = ROOT / "agents" / "lesson-author.md"
DECISION_REVIEWER = ROOT / "agents" / "decision-reviewer.md"
WORDING_REVIEWER = ROOT / "agents" / "wording-reviewer.md"

SPLIT_ROLES = (
    "lesson-architect",
    "decision-reviewer",
    "lesson-author",
    "wording-reviewer",
)


def slice_text(name: str) -> str:
    return subprocess.run(
        [sys.executable, str(RUNTIME), "--slice", name],
        capture_output=True, text=True, check=True,
    ).stdout


class SplitRouteRolesResolveTests(unittest.TestCase):
    def test_all_four_roles_resolve_launch_settings(self) -> None:
        result = subprocess.run(
            [sys.executable, str(WORKER_LAUNCH), "spec", "--host", "codex"]
            + [arg for role in SPLIT_ROLES for arg in ("--role", role)],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        for role in SPLIT_ROLES:
            self.assertIn(role.replace("-", "_"), result.stdout)


class SplitRouteSliceTests(unittest.TestCase):
    def test_the_design_slice_carries_the_trigger_and_the_normal_route(self):
        design = slice_text("design")
        # The trigger, and its guard against silent adoption.
        self.assertIn("load the `design-split` slice", design)
        self.assertIn("off by default", design)
        self.assertIn("teacher's own words", design)
        # The normal route is untouched.
        self.assertIn("Launch `lesson-designer` directly", design)

    def test_the_split_slice_is_served_complete_with_a_next_block(self):
        split = slice_text("design-split")
        for marker in (
            "LESSON_DESIGN_WORDING_STAGE_OK",
            "WORDING_GAPS",
            "agents/lesson-architect.md",
            "agents/decision-reviewer.md",
            "agents/lesson-author.md",
            "agents/wording-reviewer.md",
            "rejoins the normal pipeline at Phase 1.5",
            "## NEXT",
        ):
            self.assertIn(marker, split)
        # Steps run in pipeline order.
        self.assertLess(
            split.index("Split step 1"), split.index("Split step 2")
        )
        self.assertLess(
            split.index("Split step 3"), split.index("Split step 4")
        )

    def test_the_delivery_slice_does_not_swallow_the_split_section(self):
        self.assertNotIn("Split step 1", slice_text("delivery"))


class SplitRoleContractTests(unittest.TestCase):
    def test_the_architect_rides_on_the_designer_and_specs_wording(self):
        text = ARCHITECT.read_text(encoding="utf-8")
        self.assertIn("agents/lesson-designer.md", text)
        self.assertIn("__LESSON_WORDING_FILL__", text)
        self.assertIn("LESSON_DESIGN_WORDING_STAGE_OK", text)
        # Sound belongs to the author; the architect must not open the guide.
        self.assertIn("do not open that file", text)

    def test_the_author_writes_words_and_never_decides(self):
        text = AUTHOR.read_text(encoding="utf-8")
        self.assertIn("__LESSON_WORDING_FILL__", text)
        self.assertIn("WORDING_GAP:", text)
        self.assertIn("Never invent the missing decision", text)
        self.assertIn("LESSON_DESIGN_OK", text)
        self.assertIn("LESSON_WORDING_CHECK_FAILED", text)

    def test_the_decision_reviewer_reviews_specs_with_the_stage_validator(self):
        text = DECISION_REVIEWER.read_text(encoding="utf-8")
        self.assertIn("agents/design-reviewer.md", text)
        self.assertIn("--wording-stage", text)
        self.assertIn("REDESIGN REQUIRED", text)
        # Spec completeness is this reviewer's own check.
        self.assertIn("no new decision", text)

    def test_the_wording_reviewer_repairs_words_and_cannot_redesign(self):
        text = WORDING_REVIEWER.read_text(encoding="utf-8")
        self.assertIn("agents/design-reviewer.md", text)
        self.assertIn("do not return `REDESIGN REQUIRED`", text)
        self.assertIn("Flags for the teacher", text)
        self.assertIn("LESSON_DESIGN_OK", text)


if __name__ == "__main__":
    unittest.main()
