from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SKILL = ROOT / "skills" / "make-lesson" / "SKILL.md"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
RUNTIME = ROOT / "scripts" / "make-lesson-runtime.py"
FINALIZER = ROOT / "scripts" / "finalize-picture-assignment.py"


class MakeLessonStaticContractTests(unittest.TestCase):
    def test_runtime_picture_slice_is_unified_and_lazy(self):
        import subprocess
        result = subprocess.run(["python3", str(RUNTIME), "--slice", "pictures"], capture_output=True, text=True, check=True)
        self.assertIn("one unified `image-scout`", result.stdout)
        self.assertIn("compile-picture-assignments.py", result.stdout)
        self.assertNotIn("image-scout-designer", result.stdout)
        self.assertNotIn("image-scout-ai", result.stdout)

    def test_picture_playbook_has_contract_review_compile_worker_finalise_order(self):
        text = PLAYBOOK.read_text(encoding="utf-8")
        flat = " ".join(text.split())
        for marker in (
            "Freeze the approved initial photo contract once",
            "Compile assignments directly",
            "Launch one unified `image-scout` per assignment",
            "Finalise each valid batch immediately",
        ):
            self.assertIn(marker, text)
        self.assertLess(flat.index("Freeze the approved initial photo contract once"), flat.index("Compile assignments directly"))
        self.assertLess(flat.index("Compile assignments directly"), flat.index("Launch one unified `image-scout` per assignment"))
        self.assertLess(flat.index("Launch one unified `image-scout` per assignment"), flat.index("Finalise each valid batch immediately"))

    def test_picture_paths_and_release_gates_are_explicit(self):
        text = PLAYBOOK.read_text(encoding="utf-8")
        for marker in (
            "assignment `work_root`",
            "picture-results/[batch-id]/result.json",
            "orchestration-receipts/picture-terminal",
            "--replace no",
            "--replace yes",
            "PICTURE_RESULT_OK",
            "PICTURE_PROVENANCE_OK",
            "validate-image-scout.py result",
        ):
            self.assertIn(marker, text)

    def test_no_obsolete_picture_roles_or_preflight_names_remain(self):
        text = "\n".join(path.read_text(encoding="utf-8") for path in [SKILL, PLAYBOOK])
        for marker in ("image-scout-designer", "image-scout-ai", "picture-plan", "real-to-AI successor"):
            self.assertNotIn(marker, text)

    def test_finalizer_keeps_publisher_boundary_and_controller_transition_is_generic(self):
        finalizer = FINALIZER.read_text(encoding="utf-8")
        controller = (ROOT / "scripts" / "orchestration-controller.py").read_text(encoding="utf-8")
        self.assertIn("publish-picture.py", finalizer)
        self.assertIn("_staging", finalizer)
        self.assertIn("command jobs may own a transition", controller)
        self.assertIn("transition", controller)

    def test_plugin_metadata_lists_only_unified_picture_worker(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("| `image-scout` |", readme)
        self.assertNotIn("image-scout-ai", readme)
        self.assertNotIn("image-scout-designer", readme)


    def test_primary_worker_prompts_are_assignment_only(self):
        text = PLAYBOOK.read_text(
            encoding="utf-8"
        )

        for retired_prompt_text in (
            "Also read these reference files at the start:\n"
            "- [PLUGIN_ROOT]/references/preferences.md\n"
            "- [PLUGIN_ROOT]/references/evidence-synthesis.md",
            "Treat the successful validator, photo-cap result, "
            "reference legality, answer-delivery legality",
            "Follow the exact `Writing and self-checking lesson.json` workflow",
            "The worksheet-designer is the sole owner of physical page planning",
        ):
            with self.subTest(
                text=retired_prompt_text
            ):
                self.assertNotIn(
                    retired_prompt_text,
                    text,
                )

        self.assertGreaterEqual(
            text.count(
                "AUTHORITATIVE_INPUTS:"
            ),
            4,
        )
        self.assertGreaterEqual(
            text.count(
                "OWNED_OUTPUTS:"
            ),
            4,
        )
        self.assertGreaterEqual(
            text.count(
                "SUCCESS_CHECK:"
            ),
            3,
        )
        self.assertIn(
            "ORCHESTRATOR_CHECK_AFTER_RETURN:",
            text,
        )

    def test_design_review_uses_compact_semantic_contract(self):
        playbook = PLAYBOOK.read_text(
            encoding="utf-8"
        )
        reviewer = (
            ROOT / "agents" / "design-reviewer.md"
        ).read_text(encoding="utf-8")

        self.assertIn("effort: xhigh", reviewer)
        self.assertIn(
            "## Material-defect boundary",
            reviewer,
        )
        for outcome in (
            "Bounded objective correction",
            "Purposeful design defect",
            "Teacher-owned choice",
            "Acceptable variation",
        ):
            self.assertIn(outcome, reviewer)
        self.assertNotIn(
            "Notice everything; filter afterwards.",
            reviewer,
        )
        self.assertNotIn(
            "## Central design evidence",
            reviewer,
        )
        self.assertIn("After return, run `design-review-packet.py verify`", playbook)
        self.assertIn(
            "Do not run design-review-packet.py verify. "
            "The orchestrator owns that check.",
            playbook,
        )

    def test_lesson_designer_prompt_supplies_scaffold_command(
        self,
    ):
        text = PLAYBOOK.read_text(
            encoding="utf-8"
        )
        start = text.index(
            "You are the lesson designer. "
            "Read your agent instructions at:"
        )
        end = text.index("TERMINAL_STATE: COMPLETE", start)
        prompt = text[start:end]

        markers = [
            "python3 \"[PLUGIN_ROOT]/scripts/"
            "lesson-design-scaffold.py\"",
            "--request \"[WORKING_DIR]/"
            "lesson-design-scaffold-request.initial.json\"",
            "--lesson-design \"[WORKING_DIR]/"
            "lesson-design.json\"",
            "--photo-requirements \"[WORKING_DIR]/"
            "photo-requirements.json\"",
            "LESSON_DESIGN_SCAFFOLD_OK",
            "python3 \"[PLUGIN_ROOT]/scripts/"
            "validate-lesson-design.py\"",
            "LESSON_DESIGN_OK",
        ]
        positions = [
            prompt.index(marker)
            for marker in markers
        ]

        self.assertEqual(
            positions,
            sorted(positions),
        )

    def test_stage1_lesson_designer_has_no_retired_route_names(self):
        text = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        for retired in ("Procedural Skills and Explicit Teaching", "Explicit Teaching (Skill-based)", "Explicit Teaching (Content-based)", "Explicit-content", "Procedural / Explicit"):
            self.assertNotIn(retired, text, f"retired phrase still present: {retired}")

    def test_stage1_evidence_synthesis_has_task_centred_and_no_retired(self):
        text = (ROOT / "references" / "evidence-synthesis.md").read_text(encoding="utf-8")
        self.assertIn("Task-Centred", text)
        self.assertIn("### Task-Centred", text)
        self.assertIn("One sustained real task is the lesson's centre of gravity", text)
        self.assertIn("Use Skill-based when repeated performances are needed to acquire a method", text)
        self.assertNotIn("still Explicit-content", text)
        self.assertNotIn("explicit/conceptual, discovery and dialogic", text)

    def test_stage1_readme_has_five_structures(self):
        text = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("Skill-based / Content-based / Discovery / Dialogic / Task-Centred", text)
        self.assertNotIn("iteration-2", text)
        self.assertNotIn("eq-fractions", text)

    def test_stage1_dialogic_synthesis_required(self):
        text = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        self.assertIn("After the final discussion, include one honest Synthesise beat.", text)
        self.assertIn("It names and compares the positions, frames or tensions that genuinely appeared.", text)
        self.assertIn("It must not invent class views or announce one predetermined answer.", text)
        self.assertIn("A separate individual Reflect is conditional and belongs in the ending.", text)
        self.assertNotIn("Add an honest synthesis when useful", text)

    def test_stage1_support_fading_summary(self):
        designer = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        preferences = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        self.assertIn("Keep support when it enables the intended thinking; remove or reduce it when it supplies that thinking or the answer.", preferences)
        self.assertIn("Keep, reduce or remove support by whether enables target thinking or supplies answer.", designer)
        self.assertNotIn("scaffolds fading by Your Turn", designer)

    def test_stage1_subject_precedence(self):
        designer = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        self.assertIn("Subject files refine the general guidance for the discipline.", designer)
        self.assertIn("The main agent and teacher preferences own cross-subject boundaries.", designer)
        self.assertIn("Use the subject file to interpret what the objective asks children to do, then apply the five structure boundary tests.", designer)
        self.assertNotIn("These files add a subject's thinking; they never overrule", designer)
        self.assertNotIn("follow this table and append the unresolved clash", designer)

        maths = (ROOT / "references" / "subject-maths.md").read_text(encoding="utf-8")
        self.assertIn("This file refines the general guidance for Maths.", maths)
        self.assertIn("The Lesson Designer stops this pass here and resumes at `## Vocabulary in maths`.", maths)

    def test_stage1_do_beats_fixes(self):
        text = (ROOT / "references" / "do-beats.md").read_text(encoding="utf-8")
        self.assertNotIn("Silent think (30 sec)", text)
        self.assertIn("the teacher chooses how thinking time, pairing and sharing are managed", text)
        self.assertIn("### 1.3 Whole-class oral rehearsal\n**Teacher-owned response routine:**", text)
        self.assertIn("### 1.7 Choral Response\n**Teacher-owned response routine:**", text)
        self.assertNotIn("SEND access: language demand is low", text)

    def test_stage1_preferences_routing(self):
        text = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        self.assertIn("The Lesson Designer reads the introduction, contents and the sections named by its runtime route.", text)
        self.assertIn(
            "The Design Reviewer receives a compact runtime routing card",
            text,
        )

    def test_stage1_vocabulary_placement(self):
        text = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        self.assertIn("Place vocabulary at the point where children have enough context to understand and use it.", text)
        self.assertIn("In Skill-based and Content-based lessons, this is normally after the starter", text)
        self.assertIn("In Discovery, introduce formal vocabulary after the exploration", text)
        self.assertIn("In Dialogic and Task-Centred lessons, place it before the first discussion or task that depends on it.", text)

    def _designer_text(self):
        return (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")

    def test_authority_order_puts_safeguarding_and_curriculum_above_teacher_requirements(self):
        text = self._designer_text()
        start = text.index("## Authority and precedence")
        end = text.index("## Your Role as Decision-Maker")
        section = text[start:end]
        self.assertIn("Safeguarding and factual accuracy.", section)
        self.assertIn("The approved curriculum objective and required curriculum content.", section)
        self.assertIn("A direct teacher requirement.", section)
        self.assertLess(
            section.index("Safeguarding and factual accuracy."),
            section.index("A direct teacher requirement."),
        )
        self.assertLess(
            section.index("The approved curriculum objective"),
            section.index("A direct teacher requirement."),
        )
        self.assertIn(
            "must be honoured within safeguarding, factual accuracy and the approved curriculum objective",
            text,
        )

    def test_decisions_record_names_the_learning_chain(self):
        text = self._designer_text()
        start = text.index("## Settle the Decisions, Then Write")
        end = text.index("### Complete the picture contract here")
        section = text[start:end]
        for term in (
            "prior knowledge",
            "visible foundation",
            "new learning",
            "sticking point",
            "independence",
            "assessment evidence",
        ):
            self.assertIn(term, section)

    def test_decisions_record_covers_deliberate_omissions(self):
        text = self._designer_text()
        start = text.index("## Settle the Decisions, Then Write")
        end = text.index("### Complete the picture contract here")
        section = text[start:end]
        self.assertIn("deliberate omissions", section)
        self.assertIn("anything deliberately omitted", section)

    def test_preferences_are_loaded_by_named_section(self):
        designer = self._designer_text()
        preferences = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        self.assertIn(
            "Read a named section from its heading to the next heading of the same level.",
            designer,
        )
        self.assertIn("### Core rules", preferences)
        self.assertIn("### Lesson Designer content boundaries", preferences)
        self.assertIn("### Lesson Designer visual-need boundary", preferences)
        self.assertIn("### Speaker notes hand-off", preferences)

    def test_lesson_designer_does_not_read_slide_designer_presentation_rules(self):
        designer = self._designer_text()
        preferences = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        self.assertIn("Do not read `Slide Designer presentation rules`.", designer)
        self.assertIn("### Slide Designer presentation rules", preferences)

    def test_exactly_one_teaching_sequence_reference_is_selected(self):
        text = self._designer_text()
        self.assertIn("read exactly one matching `teaching-sequence-*.md` file.", text)
        self.assertIn("Read one teaching-sequence file per lesson, not all five.", text)

    def test_scaffold_guide_remains_part_of_the_normal_route(self):
        text = self._designer_text()
        self.assertIn(
            "After decisions are settled, read `lesson-design-scaffold.md` on the normal scaffold route.",
            text,
        )
        self.assertIn(
            "Read `lesson-design-scaffold.md`, write the scaffold request from the settled decisions",
            text,
        )

    def test_output_template_remains_the_fallback_contract(self):
        designer = self._designer_text()
        output_template = (ROOT / "references" / "output-template.md").read_text(encoding="utf-8")
        self.assertIn(
            "Read it in full only when no scaffold command is supplied.",
            designer,
        )
        self.assertIn("full fallback contract", output_template)

    def test_consolidation_report_records_pr69_result_without_stale_claims(self):
        report = (ROOT / "CONSOLIDATION_REPORT.md").read_text(encoding="utf-8")

        self.assertIn(
            "Baseline at `4fbc51565755f01e14805fd6c92587c506180d42`: "
            "61284 bytes",
            report,
        )
        self.assertIn(
            "Pull request 69 implementation at "
            "`c0d3e31f1b6a32943f4e1547f20d31e87f302b9c`: "
            "63161 bytes",
            report,
        )
        self.assertIn(
            "Pull request 69 reduction from the original: "
            "57904 bytes, or 47.8%",
            report,
        )

        for stale_claim in (
            "- Current: 61284 bytes",
            "- Target: <=61440 bytes (60 KiB) - ACHIEVED",
            "preferences full at start",
            "current size meets target",
        ):
            with self.subTest(stale_claim=stale_claim):
                self.assertNotIn(stale_claim, report)


if __name__ == "__main__":
    unittest.main()
