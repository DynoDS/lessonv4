"""The design chain is the pipeline, wired end to end.

Design and wording as separate passes: lesson-architect decides and writes
wording specs, decision-reviewer judges the compact design, lesson-author
writes the finished lesson words in a fresh context, worksheet-content-
designer writes the sheet against that finished wording, wording-reviewer
checks the words. Built first as an opt-in route beside the old single
Lesson Designer; switched over on Daniel's instruction, 31 Aug 2026, with
the old launch retired and `agents/lesson-designer.md` kept as the
architect's base craft file.
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

CHAIN_ROLES = (
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


class ChainRolesResolveTests(unittest.TestCase):
    def test_all_five_roles_resolve_launch_settings(self) -> None:
        result = subprocess.run(
            [sys.executable, str(WORKER_LAUNCH), "spec", "--host", "codex"]
            + [arg for role in CHAIN_ROLES for arg in ("--role", role)],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        for role in CHAIN_ROLES:
            self.assertIn(role.replace("-", "_"), result.stdout)

    def test_the_audit_resolves_chain_roles_from_their_task_names(self):
        # role_for reads the agents directory live; a launch named for one of
        # these must not land in WORKER_LAUNCH_AUDIT_UNCHECKED.
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "worker_launch", WORKER_LAUNCH
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for role in CHAIN_ROLES:
            task = module.task_name_for(role)
            self.assertEqual(module.role_for(task), role)
            self.assertEqual(module.role_for(f"{task}_2"), role)


class ChainSliceTests(unittest.TestCase):
    def test_the_design_slice_launches_the_architect(self):
        design = slice_text("design")
        self.assertIn("You are the lesson architect", design)
        self.assertIn("LESSON_DESIGN_WORDING_STAGE_OK", design)
        # The old single-designer launch is retired, not merely renamed.
        self.assertNotIn("You are the lesson designer", design)
        self.assertNotIn("split route", design)

    def test_the_review_slice_launches_the_decision_reviewer(self):
        review = slice_text("design-review")
        self.assertIn("You are the decision reviewer", review)
        self.assertIn("design-review-decisions.md", review)
        # The review packet is retired from the chain.
        self.assertIn("There is no review packet", review)

    def test_the_words_slice_carries_all_three_writing_steps_in_order(self):
        words = slice_text("design-words")
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
            words.index("The Lesson Author"),
            words.index("The Worksheet Content Designer"),
        )
        self.assertLess(
            words.index("The Worksheet Content Designer"),
            words.index("The Wording Reviewer"),
        )


class OrchestratorKnowsTheChainTests(unittest.TestCase):
    """The always-loaded skill file outranks any slice, so what it says about
    roles must describe the chain that actually runs. Its allow-list once
    named only the retired single designer, which would have denied the brief
    to the chain's own decider - the higher, always-present rule winning a
    contradiction the slice could not see.
    """

    def test_the_brief_reaches_the_decider_and_reviewer_only(self):
        skill = (ROOT / "skills" / "make-lesson" / "SKILL.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("- `lesson-architect`;", skill)
        self.assertIn("- `decision-reviewer`;", skill)
        self.assertIn(
            "`lesson-author`, `worksheet-content-designer` and "
            "`wording-reviewer` do not\nreceive them",
            skill,
        )
        # The retired launch name must not linger anywhere role-authoritative.
        self.assertNotIn("- `lesson-designer`;", skill)

    def test_missing_roles_degrade_honestly(self):
        setup = " ".join(slice_text("setup").split())
        self.assertIn(
            "`lesson-architect` and `lesson-author` are required", setup
        )
        # The architect's base craft file is part of the requirement.
        self.assertIn("base craft file", setup)
        self.assertIn(
            "the Lesson Author writes the worksheet's specs as well", setup
        )
        self.assertIn("report the decisions review skipped", setup)
        self.assertIn("report the words check skipped", setup)

    def test_the_two_reviews_do_not_overwrite_each_other(self):
        """Both reviews reach the teacher.

        They ran in sequence over one run and both wrote `design-review.md`,
        so the early review's corrections and flags were erased by the later
        one - and a decision corrected before any words existed leaves no
        trace in the finished lesson, so the teacher would never learn of it.
        """
        decision = DECISION_REVIEWER.read_text(encoding="utf-8")
        wording = WORDING_REVIEWER.read_text(encoding="utf-8")
        review = slice_text("design-review")

        self.assertIn("design-review-decisions.md", decision)
        self.assertIn("not to\n`design-review.md`", decision)
        # The later review keeps the canonical name and leaves the other alone.
        self.assertIn("leave that file alone", wording)
        # The orchestrator owns getting both into the report.
        self.assertIn("Both reviews in the design chain reach the\nteacher", review)

    def test_later_phase_revisions_go_to_the_architect(self):
        # The single designer's focused revisions (photo cap, helper picture
        # route, content-gap wave) belong to the architect now, which carries
        # the one carve-out letting it write small finished wording in place.
        playbook = (
            ROOT / "skills" / "make-lesson" / "playbook-lite.md"
        ).read_text(encoding="utf-8")
        self.assertIn("focused `lesson-architect` revision", playbook)
        self.assertNotIn("focused Lesson Designer revision", playbook)
        architect = ARCHITECT.read_text(encoding="utf-8")
        self.assertIn("The one place you write finished wording", architect)


class ChainRoleContractTests(unittest.TestCase):
    def test_the_architect_rides_on_the_designer_and_specs_wording(self):
        text = ARCHITECT.read_text(encoding="utf-8")
        self.assertIn("agents/lesson-designer.md", text)
        self.assertIn("__LESSON_WORDING_FILL__", text)
        self.assertIn("LESSON_DESIGN_WORDING_STAGE_OK", text)
        # Sound belongs to the writers; the decider never opens the guide.
        self.assertIn("Do not open `teacher-voice.md`", text)

    def test_the_base_craft_file_knows_it_is_not_launched(self):
        text = (ROOT / "agents" / "lesson-designer.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("Not launched directly", text)
        self.assertIn("lesson-architect reads this file as its base role", text)

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

    def test_the_decision_reviewer_reviews_specs_with_the_stage_validator(self):
        text = DECISION_REVIEWER.read_text(encoding="utf-8")
        self.assertIn("agents/design-reviewer.md", text)
        self.assertIn("--wording-stage", text)
        self.assertIn("REDESIGN REQUIRED", text)
        # Spec completeness is this reviewer's own check.
        self.assertIn("no new decision", text)

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

    def test_the_wording_reviewer_repairs_words_and_cannot_redesign(self):
        text = WORDING_REVIEWER.read_text(encoding="utf-8")
        self.assertIn("agents/design-reviewer.md", text)
        self.assertIn("do not return `REDESIGN REQUIRED`", text)
        self.assertIn("Flags for the teacher", text)
        self.assertIn("LESSON_DESIGN_OK", text)


if __name__ == "__main__":
    unittest.main()
