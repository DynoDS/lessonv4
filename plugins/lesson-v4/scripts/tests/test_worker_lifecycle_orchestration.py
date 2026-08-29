from __future__ import annotations

import json
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
        # Both model workers whose prompt names a photo contract carry the state.
        self.assertEqual(
            text.count("PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]"), 2
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

    def test_final_resource_visual_review_remains_in_playbook(self):
        text = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        self.assertIn("Visual Review", text)
        self.assertIn("visual-review.md", text)
        self.assertIn("**Start each artefact's visual reviewer here", text)

    def test_visual_review_starts_per_artefact_not_after_every_branch(self):
        """A per-artefact trigger competing with a whole-pipeline gate loses.

        The gate won on a real run: the slide deck was built and checked, and
        its reviewer still waited for the worksheet branch, costing a whole
        review round and delaying every repair behind it.
        """
        playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(
            encoding="utf-8"
        )
        skill = (ROOT / "skills" / "make-lesson" / "SKILL.md").read_text(encoding="utf-8")
        runtime = (ROOT / "scripts" / "make-lesson-runtime.py").read_text(encoding="utf-8")

        # Nothing may still read as "hold every reviewer until every branch ends".
        self.assertNotIn("Wait for All Branches", playbook)
        self.assertNotIn("after all builders", playbook)
        self.assertNotIn("Before visual review, every earned resource", playbook)

        self.assertIn("## Phase 3 — Service Each Branch as It Lands", playbook)
        self.assertIn(
            "## Phase 3.5 — Visual Check and Repair (per artefact, as each build lands)",
            playbook,
        )
        self.assertIn(
            "A finished artefact's own visual reviewer is one of those dependants",
            playbook,
        )
        self.assertIn("That trigger is per artefact, not per pipeline", playbook)
        flat_playbook = " ".join(playbook.split())
        flat_skill = " ".join(skill.split())
        self.assertIn(
            "The only work that genuinely waits for every branch is the "
            "cross-resource consistency review",
            flat_playbook,
        )
        self.assertIn(
            "as soon as any one artefact's build is accepted", flat_skill
        )

        # The slice markers are the playbook's own headings, so they move together.
        self.assertIn("## Phase 3 — Service Each Branch as It Lands", runtime)
        self.assertIn(
            "## Phase 3.5 — Visual Check and Repair (per artefact, as each build lands)",
            runtime,
        )


if __name__ == "__main__":
    unittest.main()
