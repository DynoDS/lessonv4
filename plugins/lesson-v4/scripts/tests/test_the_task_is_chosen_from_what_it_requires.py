"""The teaching decision runs in one order, and the review probes the task.

The Tudor lesson taught on 15 September 2026 passed every check and its main
beats could be completed from everyday sense. The repair is not another rule:
the designer's overlapping guidance is folded into one working order (settle
the understanding, choose what establishes it, choose what children do, check
what the responses would show); a small set of cross-subject contrasts
calibrates the last step for designer and reviewer alike; and the reviewer's
existing worked answer gains two probes, can weak understanding still pass and
can good understanding be marked wrong, with the limits that keep a quick check,
purposeful repetition and a supplied source legitimate.

These are wiring checks. They show the words reach the agents; they say nothing
about the lessons the agents then produce. The behavioural evidence lives in
`evaluations/lesson-designer-quality-2026-09-15/`.
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DESIGNER = ROOT / "agents" / "lesson-designer.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"
CONTRASTS = ROOT / "references" / "task-contrasts.md"
CASES = ROOT / "scripts" / "tests" / "fixtures" / "design-reviewer-behaviour-cases.json"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TheDesignerWorksInOneOrderTests(unittest.TestCase):
    def test_the_working_order_is_stated_once_and_points_at_its_owners(self):
        text = flat(DESIGNER)
        self.assertIn(
            "settle what children need to understand → choose the explanation, example, evidence or "
            "demonstration that establishes it → choose what children do with it → check what their "
            "responses would actually show",
            text,
        )
        # The four steps route to the existing owners rather than restating them.
        self.assertIn("`Before You Design Anything`, `Teaching substance and demand`, owns how", text)
        self.assertIn("`The Teach → Do Rhythm`, below, owns both", text)
        self.assertIn("`One Completion Pass, Then Done` runs this on the finished contract", text)

    def test_the_pivotal_teaching_supplies_the_missing_connection(self):
        text = flat(DESIGNER)
        self.assertIn("find the connection a child would otherwise have to invent", text)
        self.assertIn("A fact, a picture and a question on one board do not supply it", text)
        self.assertIn("a short direct explanation may be all it needs", text)

    def test_research_answers_a_real_uncertainty_not_a_habit(self):
        text = flat(DESIGNER)
        self.assertIn("do not run a general search about how to teach the topic on every lesson", text)
        self.assertIn("do not treat an example in these references as a historical source", text)

    def test_an_alternative_is_compared_as_work_not_as_route_names(self):
        text = flat(DESIGNER)
        self.assertIn("the actual explanation and pupil work side by side", text)
        self.assertIn("Two complete candidate lessons are never required", text)

    def test_the_misunderstanding_is_worked_at_design_and_at_completion(self):
        text = flat(DESIGNER)
        self.assertIn("the response a child with a plausible misunderstanding could give", text)
        self.assertIn("Then work it a second time holding the plausible misunderstanding", text)

    def test_the_completion_pass_budgets_actions_not_slides(self):
        text = flat(DESIGNER)
        self.assertIn("Budget the actions, not the slides", text)
        self.assertIn("a Teach split across two slides is one episode, not two", text)
        self.assertIn("a universal carpet-time limit or a fixed movement interval is not wanted", text)
        self.assertIn("the orientation says what to prepare and where the main work sits", text)

    def test_the_old_rehearsal_section_was_folded_not_duplicated(self):
        text = DESIGNER.read_text(encoding="utf-8")
        self.assertEqual(text.count("rehearse how you would teach the objective yourself"), 1)
        self.assertEqual(text.count("Walk through the middle as carefully as the opening"), 1)


class TheContrastsReachBothAgentsTests(unittest.TestCase):
    def test_the_file_holds_a_boundary_case_for_every_contrast(self):
        text = CONTRASTS.read_text(encoding="utf-8")
        # Six single-task contrasts and, since the follow-on (16 September
        # 2026), one short-sequence contrast, each with its boundary case.
        self.assertEqual(text.count("### "), 7)
        # Since 6 October 2026 a section of its own after them: saying it back
        # beside using it, for a lesson that is one story, one process or one
        # set of meanings. It has its own boundary case.
        self.assertEqual(text.count("**Where the simpler task is right.**"), 8)
        self.assertIn("\n## One story, one process, one set of meanings\n", text)
        self.assertIn("A sort can be the stronger task and a sentence the weaker one", text)
        self.assertIn("never asked to match an example's names, order or materials", text)

    def test_the_designer_reads_it_at_the_task_decision(self):
        text = flat(DESIGNER)
        self.assertIn("Read `task-contrasts.md` → The contrasts once, when choosing the main task", text)

    def test_the_reviewer_packet_always_reads_it(self):
        packet = load("packet_contrasts", "design-review-packet.py")
        names = {(name, heading) for name, heading, _ in packet.ALWAYS_READ_REVIEW_SECTIONS}
        self.assertIn(("task-contrasts.md", "The contrasts"), names)
        self.assertIn("`task-contrasts.md` → The contrasts", flat(REVIEWER))

    def test_the_section_resolves_through_the_reader(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "read-reference.py"),
             "--select", "task-contrasts.md::The contrasts"],
            capture_output=True, text=True, encoding="utf-8", cwd=str(ROOT),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("REFERENCE_READ_OK", result.stdout)
        self.assertIn("### RE and PSHE", result.stdout)

    def test_the_designers_own_loading_list_names_the_say_it_back_section(self):
        """Round four, 6 October 2026: the RE designer read it because the RE
        file points at it; the science designer read `The contrasts`, as its
        loading list said, and never met it. The route is the designer's list,
        in every subject, not a subject file's pointer."""
        whole = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        loading = whole.split("## Reference Files")[-1]
        line = next(row for row in loading.splitlines() if row.startswith("- Read `task-contrasts.md`"))
        self.assertIn("read `task-contrasts.md` → `One story, one process, one set of meanings`", " ".join(line.split()))
        self.assertIn("in every subject", " ".join(line.split()))
        self.assertIn("in a read of its own", " ".join(line.split()))
        self.assertIn("It is a step, not an option", " ".join(line.split()))

    def test_the_five_points_arrive_with_the_field_every_do_carries(self):
        """Round five, 6 October 2026: a designer met the loading line and did
        not act on it, and read `use` three times because the scaffold writes
        the field. So the test's five points live there, and none may go."""
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "read-reference.py"), "--select", "output-template.md::use"],
            capture_output=True, text=True, encoding="utf-8", cwd=str(ROOT),
        )
        self.assertIn("REFERENCE_READ_OK", result.stdout)
        for point in (
            "Name the wrong answer first.",
            "Put it where it can pull.",
            "Start from a real case.",
            "never an invented `imagine if`",
            "Read it from the surface.",
            "One ask.",
        ):
            with self.subTest(point=point):
                self.assertIn(point, result.stdout)

    def test_the_use_definition_is_under_the_heading_its_pointers_name(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "read-reference.py"), "--select", "output-template.md::use"],
            capture_output=True, text=True, encoding="utf-8", cwd=str(ROOT),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("REFERENCE_READ_OK", result.stdout)
        self.assertIn("`wrong` goes with `new`", result.stdout)
        self.assertIn("one Do or quick check declared `rehearsal` at most", result.stdout)

    def test_the_say_it_back_section_is_read_whole_in_one_page(self):
        """Inside `The contrasts` it sat on page 2 of a read that had been one page."""
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "read-reference.py"),
             "--select", "task-contrasts.md::One story, one process, one set of meanings"],
            capture_output=True, text=True, encoding="utf-8", cwd=str(ROOT),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("REFERENCE_READ_OK", result.stdout)
        self.assertIn("put the wrong answer where it can pull", result.stdout)


class TheReviewerProbesTheTaskTests(unittest.TestCase):
    def test_both_probes_sit_on_the_existing_worked_answer(self):
        text = flat(REVIEWER)
        self.assertIn("Two probes on the worked answer, before the checks below", text)
        self.assertIn("Can weak understanding still pass?", text)
        self.assertIn("Can good understanding be marked wrong?", text)
        self.assertIn("Name the bypass and the answer it permits", text)

    def test_the_probes_carry_their_limits(self):
        text = flat(REVIEWER)
        self.assertIn("A retrieval starter is meant to use what children already know", text)
        self.assertIn("Repeated calculations practise a method", text)
        self.assertIn("A source on the page may be exactly what children should read and interpret", text)
        self.assertIn("agreement with a supplied view is never evidence of learning", text)

    def test_a_finding_names_the_task_the_bypass_the_learning_and_the_repair(self):
        text = flat(REVIEWER)
        self.assertIn(
            "names the exact task, the response that bypasses or challenges it, the learning left "
            "untested or misrepresented, and the smallest repair",
            text,
        )

    def test_the_fixed_cases_cover_both_probes_and_their_limits(self):
        ids = {row["id"] for row in json.loads(CASES.read_text(encoding="utf-8"))["cases"]}
        for case in (
            "shallow-sort-passes-a-misunderstanding",
            "exclusive-key-marks-a-defensible-placement-wrong",
            "quick-check-after-a-teach-is-legitimate",
            "purposeful-repetition-and-a-visible-reference-are-not-shallow",
            "early-practise-is-judged-by-readiness-not-position",
            "launch-model-answers-the-task-it-launches",
            "parallel-launch-model-before-independent-task",
        ):
            self.assertIn(case, ids)


if __name__ == "__main__":
    unittest.main()
