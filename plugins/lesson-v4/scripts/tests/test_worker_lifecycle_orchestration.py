from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RESOURCES = ROOT


class WorkerLifecycleOrchestrationTests(unittest.TestCase):
    def test_retired_controller_scripts_stay_deleted(self):
        """The live route launches workers directly; the generic controller is gone.

        These scripts were retired dead weight: no agent, skill or command
        referenced them, and the playbook forbids the artefacts they produce.
        Reintroducing one silently re-creates a second orchestration route.
        """
        for name in (
            "orchestration-controller.py",
            "orchestration-attempt.py",
            "build-orchestration-latency-report.py",
        ):
            with self.subTest(script=name):
                self.assertFalse((ROOT / "scripts" / name).exists())

    def test_unified_picture_worker_is_the_only_picture_agent(self):
        agents = sorted(path.name for path in (ROOT / "agents").glob("*image-scout*"))
        self.assertEqual(agents, ["image-scout.md"])
        self.assertIn("name: image-scout", (ROOT / "agents" / "image-scout.md").read_text(encoding="utf-8"))

    def test_compiler_and_finalizer_are_the_picture_boundaries(self):
        compiler = (ROOT / "scripts" / "compile-picture-assignments.py").read_text(encoding="utf-8")
        finalizer = (ROOT / "scripts" / "finalize-picture-assignment.py").read_text(encoding="utf-8")
        self.assertIn("def compile_command", compiler)
        self.assertIn("def repair_command", compiler)
        self.assertIn("def assignment_command", finalizer)
        self.assertIn("def provenance_command", finalizer)
        self.assertIn("PUBLISH_ATTEMPTS = 1", finalizer)

    def test_active_runtime_uses_direct_picture_workers(self):
        text = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        self.assertIn("Launch one unified `image-scout` per assignment", text)
        self.assertIn("up to four at", text)
        self.assertIn("no more than two direct-AI batches", text)
        self.assertNotIn("orchestration-controller.py", text)

    def test_worker_spec_contract_is_documented(self):
        text = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        for marker in ("unified `image-scout`", "exact assignment path", "one unique result path"):
            self.assertIn(marker, text)

    def test_durable_work_root_and_result_path_are_exact(self):
        compiler = (ROOT / "scripts" / "compile-picture-assignments.py").read_text(encoding="utf-8")
        playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        self.assertIn("_picture-work", compiler)
        self.assertIn("[WORKING_DIR]/picture-results/[batch-id]/result.json", playbook)

    def test_compiler_emits_one_manifest_shape_the_validator_accepts(self):
        """The compiler and its gate must agree on the manifest row fields.

        The retired controller mode added `worker_job_id` to every row while the
        direct route never did, and the gate demanded it unconditionally, so no
        image scout could be launched for any lesson that needed photographs.
        """
        compiler = (ROOT / "scripts" / "compile-picture-assignments.py").read_text(encoding="utf-8")
        validator = (ROOT / "scripts" / "validate-image-scout.py").read_text(encoding="utf-8")
        for text in (compiler, validator):
            self.assertNotIn("worker_job_id", text)
            self.assertNotIn("orchestration-job-manifest", text)
        self.assertIn('{"batch_id", "assignment", "filenames"}', validator)

    def test_no_live_script_reads_from_a_retired_orchestration_directory(self):
        """Scripts must look where the live route actually writes.

        The retired controller route kept its artefacts under generic
        `orchestration-*` directories. The playbook now writes to the working
        directory, and any script still hardcoding an old location fails on an
        artefact the run definitely produced.
        """
        retired = ("orchestration-snapshots", "orchestration-events", "orchestration-jobs")
        for path in sorted((ROOT / "scripts").glob("*.py")):
            text = path.read_text(encoding="utf-8")
            for directory in retired:
                with self.subTest(script=path.name, directory=directory):
                    self.assertNotIn(directory, text)

    def test_picture_stage_is_resolved_before_any_designer_launches(self):
        """The cheap deterministic gate runs before the expensive worker.

        Compilation and its manifest check read only the frozen contract and
        finish in seconds. Run beside the designers instead, they answer whether
        the promised photographs are coming only after a deck has already been
        composed around them, so a stage that fails its gate costs a redesign
        nobody can route.
        """
        text = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        flat = " ".join(text.split())
        resolve = flat.index("Resolve the picture stage before launching any designer")
        compile_at = flat.index("Compile assignments directly")
        launch_branches = flat.index("Launch independent first-pass designers concurrently")
        slide_designer = flat.index("You are the slide designer.")
        self.assertLess(resolve, compile_at)
        self.assertLess(compile_at, launch_branches)
        self.assertLess(launch_branches, slide_designer)
        self.assertEqual(flat.count("Compile assignments directly"), 1)

    def test_resolved_picture_state_reaches_every_designer_that_reads_a_contract(self):
        text = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        for marker in (
            "PICTURE_STAGE: none required",
            "PICTURE_STAGE: attempting",
            "PICTURE_STAGE: unavailable",
            "PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, text)
        # Every model worker whose prompt names a photo contract carries the
        # state: the Slide Designer, the Slide Decorator (whose scratch check
        # draws the promised photographs at their guaranteed room) and the
        # Worksheet Designer.
        self.assertEqual(
            text.count("PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]"), 3
        )

    def test_designers_are_told_which_absent_picture_means_which_thing(self):
        """Not yet sourced and never coming look identical on disk.

        Treated as one state, the designer either wastes a pass composing around
        a picture that will never arrive, or abandons a picture that is merely
        late.
        """
        slides = (ROOT / "agents" / "slide-designer.md").read_text(encoding="utf-8")
        worksheets = (ROOT / "agents" / "worksheet-designer.md").read_text(encoding="utf-8")
        for text in (slides, worksheets):
            self.assertIn("PICTURE_STAGE:", text)
            self.assertIn("unavailable", text)
        self.assertIn("Never refuse to write `lesson.json`", slides)
        self.assertIn("on your first pass", slides)

    def test_track_a_is_one_worker_from_design_to_report(self):
        """Two reviewers went, then the look that replaced them went too.

        The look re-read a 52KB role file to confirm a deck that had already
        passed its check. Its one catch that mattered - a photograph too small
        for the zone it was given - is enforced in the builder, whether or not
        anybody looks, and the photograph itself was never the designer's to
        repair, so a wrong picture reached the teacher as a flag either way.

        What the designer needed instead was to see its own optional drawings in
        position, and the pass that places them now does: the scratch build
        draws them and the Slide Decorator renders that deck itself. That pass
        runs in its own worker since 1 Sept 2026 so the wall and stick-in
        designers can start on the settled composition, but it is the same
        pass at the same point over the same private preview, never a look at
        the built deck.
        """
        playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(
            encoding="utf-8"
        )
        designer = (ROOT / "agents" / "slide-designer.md").read_text(encoding="utf-8")
        check = (
            ROOT / "builder" / "scripts" / "check-slide-design.js"
        ).read_text(encoding="utf-8")

        self.assertNotIn("ASSIGNMENT: BUILT_DECK_LOOK", playbook)
        self.assertNotIn("slide_designer_built_deck_look", playbook)
        self.assertNotIn("## The built-deck look", designer)
        # A removed stage that is merely undocumented gets reinvented.
        self.assertIn("Do not reinstate it", playbook)

        decorator = (ROOT / "agents" / "slide-decorator.md").read_text(encoding="utf-8")
        self.assertIn("## Confirm the layer landed where you put it", decorator)
        self.assertNotIn("Confirm the layer landed where you put it", designer)
        self.assertIn("SLIDE_DECORATION_OK", playbook)
        self.assertIn("The Slide Decorator is not that spawn", playbook)
        self.assertNotIn("'--skip-optional-decorations'", check)

    def test_a_track_a_worker_launch_still_has_only_two_shapes(self):
        """The audit matches a launch to a role by its task name.

        Track A launches the designer, and a focused repair when a fault it owns
        survives. Any third Track A task name is a stage that came back.
        """
        playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(
            encoding="utf-8"
        )
        skill = (ROOT / "skills" / "make-lesson" / "SKILL.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("slide_designer_focused_repair", skill)
        self.assertNotIn("slide_designer_built", playbook)
        self.assertNotIn("slide_designer_built", skill)

    def test_the_removed_reviewers_leave_nothing_behind(self):
        """A route to an agent that no longer exists stalls a run silently.

        `visual-reviewer` and `visual-consistency-reviewer` were retired along
        with their references, their merge script and the review phase. Any
        surviving instruction to launch one, or to read a file only they wrote,
        is a hand-off into nothing.
        """
        agents = {path.name for path in (ROOT / "agents").glob("*.md")}
        self.assertNotIn("visual-reviewer.md", agents)
        self.assertNotIn("visual-consistency-reviewer.md", agents)

        for name in (
            "review-evidence.md",
            "visual-review-deck.md",
            "visual-review-worksheets.md",
            "visual-review-working-wall.md",
            "visual-review-stick-in-sheets.md",
        ):
            with self.subTest(reference=name):
                self.assertFalse((ROOT / "references" / name).exists())

        for name in ("merge-visual-reviews.py", "zoom-region.py"):
            with self.subTest(script=name):
                self.assertFalse((ROOT / "scripts" / name).exists())

        runtime = (ROOT / "scripts" / "make-lesson-runtime.py").read_text(
            encoding="utf-8"
        )
        self.assertNotIn('"visual-review"', runtime)

        # Only the shared build review log, which is a historical record and
        # deliberately keeps what past runs found, may still name them.
        live = [
            path
            for pattern in ("agents/*.md", "skills/**/*.md", "references/*.md",
                            "scripts/*.py", "commands/*.md")
            for path in ROOT.glob(pattern)
            if path.name != "build-review-log.md"
        ]
        # Both spellings: the role's filename, and its prose name. A file
        # naming "the Visual Reviewer" in a sentence routes a run just as
        # surely as one naming `visual-reviewer.md`, and the hyphenated check
        # alone let exactly that survive in a repair role's entry conditions.
        retired = (
            "visual-reviewer",
            "visual-consistency-reviewer",
            "merge-visual-reviews",
            "zoom-region",
            "review-evidence.md",
            "visual reviewer",
            "visual consistency reviewer",
            "designer repair required",
        )
        for path in live:
            text = path.read_text(encoding="utf-8").lower()
            for token in retired:
                with self.subTest(file=path.name, token=token):
                    self.assertNotIn(token, text)

    def test_a_finished_branch_does_not_wait_for_its_siblings(self):
        """A per-artefact trigger competing with a whole-pipeline gate loses.

        The gate won on a real run: the slide deck was built and checked, and
        the pass that judged it still waited for the worksheet branch. With the
        cross-resource comparison gone there is nothing left that could need
        two resources, so nothing may still read as "hold until every branch
        ends".
        """
        playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(
            encoding="utf-8"
        )
        skill = (ROOT / "skills" / "make-lesson" / "SKILL.md").read_text(encoding="utf-8")
        runtime = (ROOT / "scripts" / "make-lesson-runtime.py").read_text(
            encoding="utf-8"
        )

        self.assertNotIn("Wait for All Branches", playbook)
        self.assertNotIn("after all builders", playbook)

        self.assertIn("## Phase 3 — Service Each Branch as It Lands", playbook)
        flat_playbook = " ".join(playbook.split())
        self.assertIn(
            "A branch that has built its resource, passed its check and resolved any "
            "reported material content gap is finished.",
            flat_playbook,
        )
        self.assertIn(
            "Only the deterministic finalisation waits for every branch",
            flat_playbook,
        )

        # Prose states the principle; the successor block is what makes a run
        # act on it, because that is where the orchestrator is standing.
        flat_skill = " ".join(skill.split())
        self.assertIn(
            "every slice ends with a `## NEXT` block naming what it hands you",
            flat_skill,
        )
        for slice_name in (
            "slides-finalize",
            "worksheet-render",
            "other-resources",
        ):
            with self.subTest(slice=slice_name):
                stdout = subprocess.run(
                    [
                        sys.executable,
                        str(ROOT / "scripts" / "make-lesson-runtime.py"),
                        "--slice",
                        slice_name,
                    ],
                    capture_output=True,
                    check=True,
                ).stdout.decode("utf-8")
                trailer = stdout.split(
                    "## NEXT: what this slice hands you"
                )[1]
                self.assertIn("focused-repair", trailer)

        # The slice markers are the playbook's own headings, so they move together.
        self.assertIn("## Phase 3 — Service Each Branch as It Lands", runtime)
        self.assertIn("## Phase 3.5 — The Focused Owner-Repair Round", runtime)
        self.assertIn("## Phase 3.6 — Deterministic Finalisation", runtime)


if __name__ == "__main__":
    unittest.main()
