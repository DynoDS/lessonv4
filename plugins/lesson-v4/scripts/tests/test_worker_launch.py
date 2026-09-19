"""Every named worker launches at the model and effort its role file declares.

The playbook used to say "respect the model and effort declared in its
frontmatter", which asked the orchestrator to open the role file, translate its
shorthand into the host's model name and fill two extra fields, all from memory
at the moment of spawning, with nothing checking the result. One run launched
nine workers with no model or effort at all, so every one of them inherited the
controller's; other runs sent focused repairs out on the wrong model. Both runs
finished reporting success.

These tests hold both halves of the repair: the resolver that removes the
remembering, and the audit that reads the host's own launch record so the answer
does not depend on the orchestrator's account of itself.
"""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "worker-launch.py"
AGENTS = ROOT / "agents"


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True,
        text=True,
    )


def write_session(path: Path, launches: list[dict]) -> Path:
    """Write a session record in the shape the host actually produces."""
    lines = []
    for launch in launches:
        lines.append(
            json.dumps(
                {
                    "type": "response_item",
                    "payload": {
                        "type": "function_call",
                        "name": "spawn_agent",
                        "arguments": json.dumps(launch),
                    },
                }
            )
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


class SpecTests(unittest.TestCase):
    def test_every_role_the_package_ships_resolves(self) -> None:
        """A new role with an unmapped model must fail here, not in a lesson."""
        roles = sorted(path.stem for path in AGENTS.glob("*.md"))
        self.assertTrue(roles)
        args: list[str] = []
        for role in roles:
            args += ["--role", role]
        result = run("spec", *args)
        self.assertEqual(result.returncode, 0, result.stderr)
        for role in roles:
            with self.subTest(role=role):
                self.assertIn(f"role: {role}\n", result.stdout)

    def test_spec_prints_fields_that_can_be_copied_without_translation(self) -> None:
        result = run("spec", "--role", "lesson-designer")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("WORKER_LAUNCH_OK", result.stdout)
        for line in (
            "task_name: lesson_designer",
            "model: gpt-6-astra",
            "reasoning_effort: medium",
            "fork_turns: none",
        ):
            with self.subTest(line=line):
                self.assertIn(line, result.stdout)

    def test_working_wall_builder_gets_its_explicit_visual_review_settings(self) -> None:
        result = run("spec", "--role", "working-wall-builder")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("model: gpt-5.6-luna", result.stdout)
        self.assertIn("reasoning_effort: medium", result.stdout)

    def test_selected_normal_and_repair_roles_resolve_to_the_requested_matrix(self) -> None:
        expected = {
            "lesson-designer": ("gpt-6-astra", "medium"),
            "design-reviewer": ("gpt-6-astra", "high"),
            "design-reviewer-focused-repair": ("gpt-6-astra", "medium"),
            "adaptation-designer": ("gpt-6-astra", "low"),
            "slide-designer": ("gpt-5.6-sol", "medium"),
            "worksheet-designer": ("gpt-5.6-luna", "high"),
            "helper-builder": ("gpt-6-astra", "medium"),
            "image-scout": ("gpt-5.6-luna", "medium"),
            "diagram-anchor": ("gpt-5.6-sol", "medium"),
            "question-extractor": ("gpt-5.6-luna", "medium"),
            "slide-decorator": ("gpt-5.6-luna", "medium"),
            "stick-in-sheets-designer": ("gpt-5.6-luna", "xhigh"),
            "stick-in-sheets-designer-focused-repair": ("gpt-5.6-luna", "xhigh"),
            "slide-designer-focused-repair": ("gpt-5.6-sol", "medium"),
            "worksheet-designer-focused-repair": ("gpt-5.6-sol", "medium"),
            "working-wall-builder": ("gpt-5.6-luna", "medium"),
            "working-wall-designer": ("gpt-5.6-sol", "medium"),
            "working-wall-designer-focused-repair": ("gpt-5.6-sol", "medium"),
        }
        for role, (model, effort) in expected.items():
            with self.subTest(role=role):
                result = run("spec", "--role", role)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn(f"model: {model}", result.stdout)
                self.assertIn(f"reasoning_effort: {effort}", result.stdout)

    def test_an_unknown_role_fails_loudly(self) -> None:
        result = run("spec", "--role", "not-a-role")
        self.assertEqual(result.returncode, 2)
        self.assertIn("WORKER_LAUNCH_ERROR: unknown role: not-a-role", result.stderr)

    def test_claude_needs_no_fields_because_the_host_reads_the_agent(self) -> None:
        result = run("spec", "--host", "claude", "--role", "slide-designer")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("WORKER_LAUNCH_HOST_NATIVE: slide-designer", result.stdout)

    def test_claude_settings_are_resolved_and_shown_not_merely_assumed(self) -> None:
        """Nothing hands Claude Code its settings, so nothing catches a typo.

        Codex is given its model at launch and the audit reads back what it got.
        Claude Code reads the role file itself, and when it cannot place the name
        it drops back to the controller's own model in silence. Resolving here is
        the only gate on that, so it has to do more than confirm the file exists.
        """
        result = run("spec", "--host", "claude", "--role", "lesson-designer")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(
            "WORKER_LAUNCH_HOST_NATIVE: lesson-designer model=opus effort=xhigh",
            result.stdout,
        )

    def test_every_role_the_package_ships_resolves_on_claude_too(self) -> None:
        roles = sorted(path.stem for path in AGENTS.glob("*.md"))
        self.assertTrue(roles)
        args: list[str] = []
        for role in roles:
            args += ["--role", role]
        result = run("spec", "--host", "claude", *args)
        self.assertEqual(result.returncode, 0, result.stderr)
        for role in roles:
            with self.subTest(role=role):
                self.assertIn(f"WORKER_LAUNCH_HOST_NATIVE: {role} model=", result.stdout)

    def test_claude_roles_resolve_to_the_settings_carried_over_from_lesson_resources(
        self,
    ) -> None:
        """The Claude column is the lesson-resources package's own answer.

        That package ran this pipeline on Claude for a year, so its settings are
        evidence rather than a guess, and they are pinned here for the reason the
        Codex matrix above is pinned: an edit that quietly lowers the lesson
        designer costs a lesson nobody can see the difference in.
        """
        expected = {
            "lesson-designer": ("opus", "xhigh"),
            "design-reviewer": ("opus", "xhigh"),
            "slide-designer": ("opus", "xhigh"),
            "working-wall-designer": ("opus", "high"),
            "adaptation-designer": ("opus", "high"),
            "diagram-anchor": ("opus", "high"),
            "helper-builder": ("opus", "high"),
            "image-scout": ("sonnet", "high"),
            "question-extractor": ("sonnet", "high"),
            "worksheet-designer": ("sonnet", "high"),
            "stick-in-sheets-designer": ("sonnet", "xhigh"),
            "slide-decorator": ("sonnet", "medium"),
            "slide-builder": ("haiku", "low"),
            "worksheet-builder": ("haiku", "low"),
            "working-wall-builder": ("haiku", "low"),
            "stick-in-sheets-builder": ("haiku", "low"),
        }
        for role, (model, effort) in expected.items():
            with self.subTest(role=role):
                result = run("spec", "--host", "claude", "--role", role)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn(
                    f"WORKER_LAUNCH_HOST_NATIVE: {role} model={model} effort={effort}",
                    result.stdout,
                )

    def test_a_repair_worker_matches_the_role_it_repairs(self) -> None:
        """A focused repair reopens one named fault in a finished piece of work.

        It is the same judgement as the role that made it, on less of it, so it
        needs the same model to make it. Sending the repair out weaker than the
        author is how a run quietly loses the quality its own reviewer asked for.
        """
        repairs = sorted(path.stem for path in AGENTS.glob("*-focused-repair.md"))
        self.assertTrue(repairs)
        for repair in repairs:
            author = repair[: -len("-focused-repair")]
            with self.subTest(repair=repair):
                self.assertTrue((AGENTS / f"{author}.md").is_file(), author)
                made = run("spec", "--host", "claude", "--role", author)
                fixed = run("spec", "--host", "claude", "--role", repair)
                self.assertEqual(made.returncode, 0, made.stderr)
                self.assertEqual(fixed.returncode, 0, fixed.stderr)
                self.assertEqual(
                    made.stdout.split("model=", 1)[1].strip(),
                    fixed.stdout.split("model=", 1)[1].strip(),
                )

    def test_a_role_missing_one_host_fails_for_that_host_alone(self) -> None:
        """The two columns are independent, and a half-filled role says so.

        A role added with only Codex settings runs correctly on Codex and silently
        wrong on Claude Code, which is invisible from either side unless asking
        fails. So the miss is reported against the host that cannot launch it, and
        the other host is left working.
        """
        half = AGENTS / "_test-half-filled-role.md"
        half.write_text(
            "\n".join(
                [
                    "---",
                    "name: _test-half-filled-role",
                    "description: Codex settings declared, Claude settings missing.",
                    "codex_model: astra",
                    "codex_effort: medium",
                    "---",
                    "",
                    "Body.",
                    "",
                ]
            ),
            encoding="utf-8",
        )
        try:
            on_codex = run("spec", "--role", "_test-half-filled-role")
            on_claude = run(
                "spec", "--host", "claude", "--role", "_test-half-filled-role"
            )
        finally:
            half.unlink()

        self.assertEqual(on_codex.returncode, 0, on_codex.stderr)
        self.assertIn("model: gpt-6-astra", on_codex.stdout)
        self.assertEqual(on_claude.returncode, 2)
        self.assertIn("declares no model", on_claude.stderr)
        self.assertIn("claude", on_claude.stderr)

    def test_an_unrecognised_claude_model_fails_rather_than_falling_back(self) -> None:
        """Claude Code cannot place a name it does not know, and says nothing.

        Every role in this package named a Codex model until now, so a run on
        Claude Code would have put all twenty-one workers on the controller's own
        model and finished looking exactly like a correct one.
        """
        stray = AGENTS / "_test-stray-model-role.md"
        stray.write_text(
            "\n".join(
                [
                    "---",
                    "name: _test-stray-model-role",
                    "description: A role naming a model Claude Code never heard of.",
                    "model: astra",
                    "effort: medium",
                    "---",
                    "",
                    "Body.",
                    "",
                ]
            ),
            encoding="utf-8",
        )
        try:
            result = run("spec", "--host", "claude", "--role", "_test-stray-model-role")
        finally:
            stray.unlink()

        self.assertEqual(result.returncode, 2)
        self.assertIn("astra", result.stderr)
        self.assertIn("no claude equivalent", result.stderr)


class AuditTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(__file__).resolve().parent / "_worker_launch_tmp"
        self.tmp.mkdir(exist_ok=True)
        self.session = self.tmp / "rollout-test.jsonl"

    def tearDown(self) -> None:
        for path in self.tmp.glob("*"):
            path.unlink()
        self.tmp.rmdir()

    def audit(self) -> subprocess.CompletedProcess:
        return run("audit", "--session", str(self.session))

    def test_the_reported_failure_is_caught(self) -> None:
        """Nine workers launched with neither field set, all inheriting."""
        write_session(
            self.session,
            [
                {"task_name": "lesson_designer", "fork_turns": "none"},
                {"task_name": "design_reviewer", "fork_turns": "none"},
                {"task_name": "slide_designer", "fork_turns": "none"},
            ],
        )
        result = self.audit()
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("launched inherited/inherited", result.stdout)
        self.assertIn(
            "WORKER_LAUNCH_AUDIT_FAILED: 3 of 3 named workers", result.stdout
        )

    def test_a_correct_run_passes(self) -> None:
        write_session(
            self.session,
            [
                {
                    "task_name": "lesson_designer",
                    "model": "gpt-6-astra",
                    "reasoning_effort": "medium",
                    "fork_turns": "none",
                },
                {
                    "task_name": "image_scout_p1",
                    "model": "gpt-5.6-luna",
                    "reasoning_effort": "medium",
                    "fork_turns": "none",
                },
            ],
        )
        result = self.audit()
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("WORKER_LAUNCH_AUDIT_OK: 2 named workers", result.stdout)

    def test_the_wrong_model_is_caught_even_when_both_fields_were_set(self) -> None:
        """The quieter half of the fault: set, but set to the wrong thing."""
        write_session(
            self.session,
            [
                {
                    "task_name": "worksheet_designer",
                    "model": "gpt-5.6-terra",
                    "reasoning_effort": "high",
                    "fork_turns": "none",
                }
            ],
        )
        result = self.audit()
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("wanted gpt-5.6-luna/high", result.stdout)
        self.assertIn("launched gpt-5.6-terra/high", result.stdout)

    def test_a_repair_role_is_matched_by_its_longest_role_prefix(self) -> None:
        """A focused repair has its own settings; the base role's would pass wrongly."""
        write_session(
            self.session,
            [
                {
                    "task_name": "slide_designer_focused_repair",
                    "model": "gpt-5.6-sol",
                    "reasoning_effort": "medium",
                    "fork_turns": "none",
                }
            ],
        )
        result = self.audit()
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("WORKER_LAUNCH_AUDIT_OK: 1 named workers", result.stdout)

    def test_a_run_specific_suffix_still_matches_its_role(self) -> None:
        write_session(
            self.session,
            [
                {
                    "task_name": "lesson_designer_redesign_2",
                    "model": "gpt-6-astra",
                    "reasoning_effort": "medium",
                    "fork_turns": "none",
                }
            ],
        )
        result = self.audit()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_a_name_without_its_role_is_reported_rather_than_passed_over(self) -> None:
        """Otherwise a badly named lesson worker escapes the check in silence."""
        write_session(
            self.session,
            [
                {
                    "task_name": "stick_in_designer",
                    "model": "gpt-5.6-terra",
                    "reasoning_effort": "high",
                    "fork_turns": "none",
                }
            ],
        )
        result = self.audit()
        self.assertIn(
            "WORKER_LAUNCH_AUDIT_UNCHECKED: stick_in_designer", result.stdout
        )

    def test_a_missing_record_degrades_rather_than_stopping_the_run(self) -> None:
        result = run("audit", "--session", str(self.tmp / "absent.jsonl"))
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("WORKER_LAUNCH_AUDIT_UNAVAILABLE", result.stdout)

    def test_another_host_keeps_no_record_and_says_so(self) -> None:
        result = run("audit", "--host", "claude")
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("WORKER_LAUNCH_AUDIT_UNAVAILABLE", result.stdout)


class SessionChoiceTests(unittest.TestCase):
    """Which session file the audit reads when the caller names none.

    Every worker writes its own session file, so the newest file on disk stops
    being the orchestrator's the moment the first worker starts. Reading the
    newest one therefore read a record of a session that launched nothing, and a
    completed lesson reported its own launch settings as uncertifiable while the
    real record sat a few files back.
    """

    def setUp(self) -> None:
        self.home = Path(__file__).resolve().parent / "_worker_launch_home"
        self.sessions = self.home / "sessions" / "2026" / "08" / "31"
        self.sessions.mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        for path in sorted(self.home.rglob("*"), reverse=True):
            path.unlink() if path.is_file() else path.rmdir()
        self.home.rmdir()

    def worker_session(self, name: str, text: str) -> Path:
        path = self.sessions / name
        path.write_text(text, encoding="utf-8")
        return path

    def audit(self) -> subprocess.CompletedProcess:
        import os

        environment = dict(os.environ, CODEX_HOME=str(self.home))
        return subprocess.run(
            [sys.executable, str(SCRIPT), "audit"],
            capture_output=True,
            text=True,
            env=environment,
        )

    def touch_in_order(self, paths: list[Path]) -> None:
        """Give the files ascending modification times, oldest first."""
        import os

        for index, path in enumerate(paths):
            stamp = 1_700_000_000 + index
            os.utime(path, (stamp, stamp))

    def test_the_orchestrator_record_is_found_behind_its_workers(self) -> None:
        orchestrator = write_session(
            self.sessions / "rollout-2026-08-31T09-39-29-a.jsonl",
            [
                {
                    "task_name": "lesson_designer",
                    "model": "gpt-6-astra",
                    "reasoning_effort": "medium",
                    "fork_turns": "none",
                }
            ],
        )
        worker = self.worker_session(
            "rollout-2026-08-31T11-01-15-b.jsonl",
            json.dumps({"type": "message", "text": "Launch it with spawn_agent."}) + "\n",
        )
        self.touch_in_order([orchestrator, worker])

        result = self.audit()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("WORKER_LAUNCH_AUDIT_OK: 1 named workers", result.stdout)
        self.assertIn(orchestrator.name, result.stdout)

    def test_a_run_that_truly_launched_nothing_still_says_so(self) -> None:
        """Discrimination: the search must not invent a record. With no launch
        anywhere, the audit reports what it always did."""
        only = self.worker_session(
            "rollout-2026-08-31T11-01-15-b.jsonl",
            json.dumps({"type": "message", "text": "No launches here."}) + "\n",
        )
        self.touch_in_order([only])

        result = self.audit()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("WORKER_LAUNCH_AUDIT_UNAVAILABLE", result.stdout)
        self.assertIn(only.name, result.stdout)


class TimelineTests(unittest.TestCase):
    """Where a run's time went, read from the host's own record.

    Three runs on 1 September 2026 were timed by reading file modification
    times off the working folder after the fact, which is how a twelve-minute
    unserviced wait was found. The record already held every launch, every
    final answer and every orchestrator action with a timestamp; nothing read
    it. The fixture is a cut-down orchestrator record in the host's real shape:
    one worker whose finished result sat through a wait and a listing before
    the orchestrator acted, and one that never returned at all.
    """

    FIXTURE = Path(__file__).resolve().parent / "fixtures" / "rollout-timeline.jsonl"

    @staticmethod
    def local(iso: str) -> str:
        from datetime import datetime

        return datetime.fromisoformat(iso).astimezone().strftime("%H:%M:%S")

    def timeline(self) -> subprocess.CompletedProcess:
        return run("timeline", "--session", str(self.FIXTURE))

    def test_a_serviced_worker_shows_how_long_it_ran_and_how_long_it_waited(self) -> None:
        result = self.timeline()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn(f"WORKER_TIMELINE: session={self.FIXTURE}", result.stdout)
        launched = self.local("2026-09-01T13:00:26+00:00")
        returned = self.local("2026-09-01T13:06:46+00:00")
        self.assertRegex(
            result.stdout,
            r"adaptation-designer +adaptation_designer +"
            rf"launched {launched}  returned {returned}  ran 6m 20s  waited 11m 42s",
        )

    def test_a_wait_or_a_listing_is_not_servicing(self) -> None:
        """The orchestrator went back to sleep at 13:06:50 and looked at the
        agent list at 13:12:55; neither acted on the result. The first real
        action was the contract build at 13:18:28."""
        result = self.timeline()
        self.assertIn("waited 11m 42s", result.stdout)
        self.assertNotIn("waited 0m 4s", result.stdout)

    def test_a_worker_that_never_returned_prints_dashes_not_guesses(self) -> None:
        result = self.timeline()
        launched = self.local("2026-09-01T13:00:20+00:00")
        self.assertRegex(
            result.stdout,
            rf"slide-designer +slide_designer +launched {launched}  returned -  ran -  waited -",
        )
        self.assertIn("2 workers, 1 returned", result.stdout)

    def test_the_total_names_the_span_and_the_critical_path(self) -> None:
        result = self.timeline()
        self.assertIn(
            "WORKER_TIMELINE_TOTAL: span 18m 8s from first launch to last serviced; "
            "critical path adaptation_designer (18m 2s launch to serviced); "
            "2 workers, 1 returned",
            result.stdout,
        )

    def test_the_audit_prints_the_same_block_after_its_own_markers(self) -> None:
        result = run("audit", "--session", str(self.FIXTURE))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        lines = result.stdout.splitlines()
        marker = next(i for i, line in enumerate(lines) if line.startswith("WORKER_LAUNCH_AUDIT_OK"))
        block = next(i for i, line in enumerate(lines) if line.startswith("WORKER_TIMELINE:"))
        self.assertLess(marker, block, "the timeline follows the audit marker, never precedes it")
        self.assertIn("WORKER_LAUNCH_AUDIT_OK: 2 named workers", result.stdout)
        self.assertTrue(lines[-1].startswith("WORKER_TIMELINE_TOTAL:"))

    def test_a_record_with_no_launches_says_so(self) -> None:
        tmp = Path(__file__).resolve().parent / "_worker_timeline_tmp.jsonl"
        tmp.write_text(json.dumps({"type": "message", "text": "nothing"}) + "\n", encoding="utf-8")
        try:
            result = run("timeline", "--session", str(tmp))
        finally:
            tmp.unlink()
        self.assertEqual(result.returncode, 0)
        self.assertIn("WORKER_TIMELINE_UNAVAILABLE: no launches recorded", result.stdout)

    def test_another_host_keeps_no_record(self) -> None:
        result = run("timeline", "--host", "claude")
        self.assertEqual(result.returncode, 0)
        self.assertIn("WORKER_TIMELINE_UNAVAILABLE", result.stdout)


if __name__ == "__main__":
    unittest.main()
