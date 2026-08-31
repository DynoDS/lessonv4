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
WORKSHEET_CONTENT = ROOT / "agents" / "worksheet-content-designer.md"
WORDING_REVIEWER = ROOT / "agents" / "wording-reviewer.md"

SPLIT_ROLES = (
    "lesson-architect",
    "decision-reviewer",
    "lesson-author",
    "worksheet-content-designer",
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

    def test_the_split_slices_are_served_complete_with_next_blocks(self):
        split = slice_text("design-split")
        for marker in (
            "LESSON_DESIGN_WORDING_STAGE_OK",
            "agents/lesson-architect.md",
            "agents/decision-reviewer.md",
            "rejoins the pipeline at Phase 1.5",
            "design-split-words",
            "## NEXT",
        ):
            self.assertIn(marker, split)
        self.assertLess(
            split.index("Split step 1"), split.index("Split step 2")
        )

        words = slice_text("design-split-words")
        for marker in (
            "WORDING_GAPS",
            "WORKSHEET_GAPS",
            "--wording-scope worksheet",
            "agents/lesson-author.md",
            "agents/worksheet-content-designer.md",
            "agents/wording-reviewer.md",
            "run the strict validator yourself once more",
            "## NEXT",
        ):
            self.assertIn(marker, words)
        self.assertLess(
            words.index("Split step 3"), words.index("Split step 4")
        )
        self.assertLess(
            words.index("Split step 4"), words.index("Split step 5")
        )

    def test_the_delivery_slice_does_not_swallow_the_split_section(self):
        self.assertNotIn("Split step 1", slice_text("delivery"))


class OrchestratorKnowsTheNewRolesTests(unittest.TestCase):
    """The always-loaded skill file outranks any slice, so the split route's
    roles have to be reachable from it. Its allow-list named exactly three
    roles, which would have denied the brief to the route's own decider while
    the slice said to hand it over - the higher, always-present rule winning
    a contradiction the slice could not see.
    """

    def test_the_brief_reaches_the_split_route_decider_and_reviewer(self):
        skill = (ROOT / "skills" / "make-lesson" / "SKILL.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("`lesson-architect` and `decision-reviewer` stand in", skill)
        # And is still withheld from the roles that only express an approved design.
        self.assertIn(
            "`lesson-author`, `worksheet-content-designer` and\n`wording-reviewer` do not receive them",
            skill,
        )

    def test_a_missing_split_role_falls_back_to_the_normal_route(self):
        setup = " ".join(slice_text("setup").split())
        self.assertIn("the split route needs all five", setup)
        self.assertIn("run the normal Phase 1 route instead", setup)

    def test_the_two_split_reviews_do_not_overwrite_each_other(self):
        """Both reviews reach the teacher.

        They ran in sequence over one run and both wrote `design-review.md`,
        so the early review's corrections and flags were erased by the later
        one - and a decision corrected before any words existed leaves no
        trace in the finished lesson, so the teacher would never learn of it.
        """
        decision = DECISION_REVIEWER.read_text(encoding="utf-8")
        wording = WORDING_REVIEWER.read_text(encoding="utf-8")
        split = slice_text("design-split")

        self.assertIn("design-review-decisions.md", decision)
        self.assertIn("not to\n`design-review.md`", decision)
        # The later review keeps the canonical name and leaves the other alone.
        self.assertIn("leave that file alone", wording)
        # The orchestrator owns getting both into the report.
        self.assertIn("Both split reviews reach\nthe teacher", split)
        self.assertIn("design-review-decisions.md", split)

    def test_the_audit_resolves_split_roles_from_their_task_names(self):
        # role_for reads the agents directory live; a launch named for one of
        # these must not land in WORKER_LAUNCH_AUDIT_UNCHECKED.
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "worker_launch", WORKER_LAUNCH
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for role in SPLIT_ROLES:
            task = module.task_name_for(role)
            self.assertEqual(module.role_for(task), role)
            self.assertEqual(module.role_for(f"{task}_2"), role)


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
        # The worksheet's words belong to its own designer, and the author's
        # own check is scoped so a string it left unwritten fails here, not
        # three workers later.
        self.assertIn("touch nothing inside `worksheet`", text)
        self.assertIn("--wording-scope worksheet", text)
        self.assertIn("LESSON_DESIGN_WORDING_STAGE_OK", text)
        self.assertIn("LESSON_WORDING_CHECK_FAILED", text)

    def test_the_worksheet_content_designer_owns_only_the_worksheet(self):
        text = WORKSHEET_CONTENT.read_text(encoding="utf-8")
        self.assertIn("Edit only inside the top-level `worksheet` object", text)
        self.assertIn("The photograph contract is not yours", text)
        self.assertIn("WORKSHEET_GAP:", text)
        self.assertIn("LESSON_DESIGN_OK", text)
        self.assertIn("WORKSHEET_CHECK_FAILED", text)
        # Freshness is judged against the finished board wording, which is
        # why this role runs after the author.
        self.assertIn("freshness baseline", text)

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
