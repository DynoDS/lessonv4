"""The slide decoration pass runs in its own worker, beside the wall and stick-in designers.

The Slide Designer used to end with the whole-deck optional visual pass: render,
measure the room, search the drawing library, place P2 and P3 drawings, render
again and look. The Working Wall and Stick-in designers were launched only when
that worker returned, and every string and figure they copy was settled before
the first drawing was placed. On today's three runs that wait cost those
branches three to seven minutes, and it was the tail of the run twice.

So the pass moved into the Slide Decorator, launched the moment the
composition passes its checks, with the wall and stick-in designers launched
beside it. These tests pin the split: the new role exists at its declared
settings, the designer no longer owns the pass, the playbook launches the three
together and builds the slides only after the decorator, and a decorator that
fails degrades to a plain deck rather than blocking the lesson.
"""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

from test_run_report import RunReportCase

ROOT = Path(__file__).resolve().parents[2]
DECORATOR = ROOT / "agents" / "slide-decorator.md"
DESIGNER = ROOT / "agents" / "slide-designer.md"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
SKILL = ROOT / "skills" / "make-lesson" / "SKILL.md"
CONTEXT = ROOT / "references" / "context-pictures.md"
PROFILE = ROOT / "references" / "teacher-slide-visual-profile.md"
RUNTIME = ROOT / "scripts" / "make-lesson-runtime.py"
LAUNCH = ROOT / "scripts" / "worker-launch.py"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def frontmatter(text: str) -> dict[str, str]:
    head = text.split("---", 2)[1]
    fields = {}
    for line in head.strip().splitlines():
        key, _, value = line.partition(":")
        fields[key.strip()] = value.strip()
    return fields


class SlideDecoratorRoleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.decorator = read(DECORATOR)
        self.designer = read(DESIGNER)
        self.playbook = read(PLAYBOOK)

    def test_the_role_retains_its_configured_launch_settings(self) -> None:
        fields = frontmatter(self.decorator)
        self.assertEqual(fields["name"], "slide-decorator")
        self.assertEqual(fields["model"], "luna")
        # Composition is settled before it runs; its judgement is room,
        # relevance and legibility, and the role says so beside the setting.
        self.assertEqual(fields["effort"], "xhigh")

    def test_the_launch_spec_resolves_the_new_role(self) -> None:
        result = subprocess.run(
            [sys.executable, str(LAUNCH), "spec", "--host", "codex", "--role", "slide-decorator"],
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("task_name: slide_decorator", result.stdout)
        self.assertIn("reasoning_effort: xhigh", result.stdout)

    def test_the_decorator_owns_the_pass_and_its_markers(self) -> None:
        for token in (
            "optional-picture-pass.json",
            "check-optional-pictures.py",
            "OPTIONAL_PICTURE_PASS_OK",
            "--preview",
            "scripts/render-pages.py",
            "measure",
            "Slide decoration check: SLIDE_DECORATION_OK: [N] slides",
            "SLIDE_DECORATION_FAILED",
            "Removal is always valid",
            "Overlap by itself is never the fault",
        ):
            with self.subTest(token=token):
                self.assertIn(token, self.decorator)

    def test_the_decorator_may_not_reopen_composition(self) -> None:
        self.assertIn("Composition is closed", self.decorator)
        self.assertIn("touching only picture and decoration fields", self.decorator)
        self.assertIn("Do not read the lesson design", self.decorator)

    def test_the_designer_no_longer_runs_the_pass(self) -> None:
        for token in (
            "### Confirm the layer landed where you put it",
            "### Resolve your own Educational SVG requests",
            "check-optional-pictures.py",
            "Optional visual zero reason",
        ):
            with self.subTest(token=token):
                self.assertNotIn(token, self.designer)
        # The first moment stays: a light slide leaves a P2 somewhere to sit,
        # and the room measurement is still the designer's, taken on the
        # settled layout.
        self.assertIn("ask whether a relevant P2 belongs before settling its template", self.designer)
        self.assertIn("measure-slide-room.py", self.designer)
        self.assertIn("Slide design check: SLIDE_DESIGN_CHECK_OK: [N] slides", self.designer)
        # And it says why the pass left, so the boundary reads as a decision.
        self.assertIn("Slide Decorator", self.designer)
        self.assertIn("settled before a single drawing is placed", self.designer)

    def test_the_shared_references_name_the_decorator_as_the_pass_owner(self) -> None:
        context = read(CONTEXT)
        profile = read(PROFILE)
        self.assertIn("## Slide Designer and Slide Decorator read route", context)
        self.assertIn("At Slide Decorator startup", context)
        self.assertIn("Record that zero reason in the Slide Decorator completion", context)
        self.assertIn("the Slide Decorator renders the promoted deck", context)
        self.assertIn("the Slide Decorator runs that pass after this one", profile)


class SlideDecoratorOrchestrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.playbook = read(PLAYBOOK)

    def slice(self, name: str) -> str:
        result = subprocess.run(
            [sys.executable, str(RUNTIME), "--slice", name],
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout

    def test_the_designer_prompt_no_longer_owns_the_record(self) -> None:
        prompt = self.playbook.split("You are the slide designer.", 1)[1].split("```", 1)[0]
        self.assertIn("- [WORKING_DIR]/lesson.json\n- [WORKING_DIR]/slide-room.json", prompt)
        self.assertNotIn("optional-picture-pass.json", prompt)
        self.assertNotIn("check-optional-pictures.py", prompt)

    def test_three_workers_launch_together_on_the_settled_deck(self) -> None:
        slides = self.slice("slides-design")
        self.assertIn("three workers start together", slides)
        self.assertIn("You are the slide decorator.", slides)
        self.assertIn("SLIDE_DECORATION_OK: [N] slides", slides)
        other = self.slice("other-resources")
        self.assertIn("beside the Slide Decorator, never after it", other)
        self.assertIn("beside the Slide Decorator and Track D", other)

    def test_the_slide_build_waits_for_the_decorator(self) -> None:
        finalize = self.slice("slides-finalize")
        self.assertIn(
            "Wait until Slide Designer, the Slide Decorator (or its degrade) and all",
            finalize,
        )
        # Optional decoration stays separate from final output judgement.
        self.assertIn("final resource review in Phase 3.6", finalize)
        self.assertIn("earlier optional-picture stage", finalize)

    def test_a_failed_decorator_degrades_and_never_blocks(self) -> None:
        slides = self.slice("slides-design")
        self.assertIn("degrades, never blocks", slides)
        self.assertIn("SLIDE_DECORATION_OMITTED: [reason]", slides)
        self.assertIn("Do not spend a focused repair", slides)

    def test_the_decorator_receives_no_teacher_files(self) -> None:
        self.assertIn("`slide-decorator`", read(SKILL))


class DecoratorDegradeReportTests(RunReportCase):
    def test_a_deck_built_without_its_layer_validates_with_the_omission_recorded(self):
        # No decorator record means no OPTIONAL_PICTURE_LIBRARY line to copy.
        # The record is honest instead: the layer was omitted, and why.
        self.write_report({
            "library": "",
            "accepted": (
                "- SLIDE_DECORATION_OMITTED: the slide decorator returned "
                "SLIDE_DECORATION_FAILED after its infrastructure retry, so the "
                "deck was built from the settled specification without its "
                "optional drawing layer."
            ),
        })
        result = self.validate()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("RUN_REPORT_OK", result.stdout)

    def test_a_deck_with_neither_line_still_fails(self):
        self.write_report({"library": ""})
        result = self.validate()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("SLIDE_DECORATION_OMITTED", result.stdout)


if __name__ == "__main__":
    unittest.main()


def test_the_decorator_measures_the_pages_when_the_designer_left_none():
    """A geography deck came back with 12 slides declined as `full`, 1 as
    `competes` and no library search run at all, and the pass record's own
    room line said UNMEASURED: the designer had produced no slide-room.json,
    so every "no room here" answer stood on the record's word. The decorator
    renders the deck for its own pass, so it can always measure."""
    role = (ROOT / "agents" / "slide-decorator.md").read_text(encoding="utf-8")
    assert "If `slide-room.json` is not there, measure the pages you have just rendered" in role
    assert "measure-slide-room.py" in role
    assert "--render-manifest" in role
    # And the exception stays only for a machine that cannot render at all.
    assert "Only a run with no render route at all" in role


def test_the_playbook_no_longer_reads_as_permission_to_skip_measuring():
    playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(
        encoding="utf-8"
    )
    assert "It is not a licence to skip the measurement" in playbook
