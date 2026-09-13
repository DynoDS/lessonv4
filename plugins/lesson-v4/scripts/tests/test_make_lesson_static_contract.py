from __future__ import annotations

import json
import unittest
from pathlib import Path

from reference_test_support import component_text


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
        self.assertNotIn("image-scout-designer", result.stdout)
        self.assertNotIn("image-scout-ai", result.stdout)

    def test_compilation_loads_with_phase_2_not_with_the_scouts(self):
        """Compilation answers whether photographs are coming at all.

        It is loaded and run with the Phase 2 core, before the designers, so its
        answer can shape the specifications rather than arrive after them. The
        scout slice is loaded later and only when there is picture work to do.
        """
        import subprocess

        def slice_text(name):
            return subprocess.run(
                ["python3", str(RUNTIME), "--slice", name],
                capture_output=True, text=True, check=True,
            ).stdout

        core = slice_text("phase2-core")
        pictures = slice_text("pictures")
        self.assertIn("compile-picture-assignments.py", core)
        self.assertIn("PICTURE_MANIFEST_OK", core)
        self.assertNotIn("compile-picture-assignments.py", pictures)

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
            "PICTURE_MANIFEST_OK",
            "validate-image-scout.py result",
            "validate-image-scout.py manifest",
        ):
            self.assertIn(marker, text)

    def test_no_obsolete_picture_roles_or_preflight_names_remain(self):
        text = "\n".join(path.read_text(encoding="utf-8") for path in [SKILL, PLAYBOOK])
        for marker in ("image-scout-designer", "image-scout-ai", "picture-plan", "real-to-AI successor"):
            self.assertNotIn(marker, text)

    def test_unattended_run_failure_branches_deliver_instead_of_stopping(self):
        """Every bounded budget must end in delivery plus honest flags.

        An unattended cloud run cannot answer questions or restart itself, so
        an exhausted budget that dead-stops hands the teacher nothing in the
        morning. The playbook must keep the recovery branches that turn each
        exhaustion into a delivered package with the faults named.
        """
        playbook = " ".join(PLAYBOOK.read_text(encoding="utf-8").split())

        # Design review: bounded passes, then continue with findings on record.
        self.assertIn("Permit at most two semantic redesign passes", playbook)
        self.assertNotIn("stop as `BLOCKED`", playbook)
        self.assertIn("carry the reviewer's unresolved findings", playbook)

        # An invalid design gets one fresh recovery attempt, then an evidence-rich stop.
        self.assertIn("LESSON_DESIGN_CHECK_FAILED", playbook)
        self.assertIn("one fresh clean-context Lesson Designer attempt", playbook)

        # BLOCKED labels the record; built resources are still delivered and synced.
        self.assertIn("`BLOCKED` labels the record, not the delivery", playbook)
        self.assertIn("Sync the delivered files whatever the package outcome", playbook)

        # Report validation repairs the record; it never withholds the teacher report.
        self.assertIn("send the teacher report anyway", playbook)

        # An unresolved filing destination degrades to local delivery.
        self.assertIn("plan local-only delivery", playbook)

    def test_wall_designer_is_spawned_every_run_and_stick_in_reads_the_design(self):
        """Wall-worthiness belongs to its designer; the stick-in gate is the design's.

        The regressed wording, "If the approved lesson earns a wall", handed
        the orchestrator a judgement it has no criteria for and no signal to
        answer, so runs silently skipped the spawn and lessons shipped without
        walls nobody had decided against. The wall spawn stays unconditional.
        The stick-in designer found nothing to print on two of three lessons
        in a day, so the reviewed design now records that decision and a
        deterministic command reads it; the orchestrator still never judges
        the question, and only a validated `none` skips the worker.
        """
        import subprocess
        result = subprocess.run(
            ["python3", str(RUNTIME), "--slice", "other-resources"],
            capture_output=True, text=True, check=True,
        )
        text = " ".join(result.stdout.split())
        self.assertIn("Launch Working Wall Designer on every run", text)
        self.assertIn("resource-opportunities.py", text)
        self.assertIn("On `STICK_IN_LAUNCH`, launch the stick-in designer", text)
        self.assertIn("the orchestrator never judges the question itself", text)
        self.assertIn("only when `cards` is non-empty", text)
        self.assertIn("non-empty `items` list", text)
        playbook = " ".join(PLAYBOOK.read_text(encoding="utf-8").split())
        self.assertNotIn("If the approved lesson earns", playbook)
        self.assertNotIn("If the approved design earns", playbook)

    def test_lesson_designer_self_repair_is_bounded(self):
        """The designer's validate-and-fix loop must not run unbounded.

        Every other self-repair loop in the pipeline has a budget; an uncapped
        validator loop can burn an entire unattended run without producing a
        design or a diagnosis.
        """
        designer = " ".join(
            (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8").split()
        )
        self.assertIn("three repair passes", designer)
        self.assertIn("LESSON_DESIGN_CHECK_FAILED", designer)

    def test_finalizer_keeps_publisher_boundary(self):
        finalizer = FINALIZER.read_text(encoding="utf-8")
        self.assertIn("publish-picture.py", finalizer)
        self.assertIn("_staging", finalizer)

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

        self.assertIn("model: astra", reviewer)
        self.assertIn("effort: high", reviewer)
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
            "\"[PYTHON]\" \"[PLUGIN_ROOT]/scripts/"
            "lesson-design-scaffold.py\"",
            "--request \"[WORKING_DIR]/"
            "lesson-design-scaffold-request.initial.json\"",
            "--lesson-design \"[WORKING_DIR]/"
            "lesson-design.json\"",
            "--photo-requirements \"[WORKING_DIR]/"
            "photo-requirements.json\"",
            "LESSON_DESIGN_SCAFFOLD_OK",
            "\"[PYTHON]\" \"[PLUGIN_ROOT]/scripts/"
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

    def test_scaffold_builder_is_never_a_lesson_designer_success_check(self):
        """The builder rewrites both files as the empty scaffold.

        Listing it under SUCCESS_CHECK, or telling the orchestrator to re-run
        it after the designer returns, discards the finished design.
        """
        text = PLAYBOOK.read_text(encoding="utf-8")
        start = text.index(
            "You are the lesson designer. "
            "Read your agent instructions at:"
        )
        end = text.index("TERMINAL_STATE: COMPLETE", start)
        prompt = text[start:end]

        builder = "lesson-design-scaffold.py"
        self.assertLess(
            prompt.index(builder),
            prompt.index("SUCCESS_CHECK:"),
            "the scaffold builder must be run before filling, "
            "not as a success check",
        )
        self.assertNotIn(
            builder,
            prompt[prompt.index("SUCCESS_CHECK:"):],
        )
        self.assertIn("BUILD_SCAFFOLD_ONCE", prompt)

        after_prompt = text[end:]
        self.assertIn(
            "Do\nnot re-run the scaffold builder",
            after_prompt,
        )
        self.assertNotIn(
            "run both success checks yourself",
            text,
        )

    def test_scaffold_fill_is_in_place_never_delete_and_recreate(self):
        """Filling means editing the generated files where they stand.

        A designer that deletes and re-creates lesson-design.json re-authors
        the mechanical envelope the scaffold owns, which is slower, shows the
        teacher a confusing wipe in the activity feed, and can corrupt IDs the
        validator then reports as semantic faults.
        """
        designer = (ROOT / "agents" / "lesson-designer.md").read_text(
            encoding="utf-8"
        )
        guide = (
            ROOT / "references" / "lesson-design-scaffold.md"
        ).read_text(encoding="utf-8")

        self.assertIn("by editing them in place", designer)
        self.assertIn(
            "Do not delete a generated file to rewrite it",
            designer,
        )
        self.assertIn(
            "Fill by editing the generated files in place",
            guide,
        )
        self.assertIn(
            "Never delete or rewrite a generated file to fill it; edit it.",
            guide,
        )

    def test_every_worker_editing_its_own_file_edits_it_in_place(self):
        """The rule the Lesson Designer already had, owned once for everyone.

        The Worksheet Designer was told to "write the updated worksheet.json
        atomically" after resolving three picture paths, and re-emitted the
        whole specification to carry them. A whole-file rewrite silently
        re-decides every question, page and answer it retypes, leaves no
        readable diff for the confirmation pass, and shows the teacher their
        lesson deleted and rebuilt for a one-word fix.
        """
        revising = (ROOT / "references" / "revising-in-place.md").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            "## Changing a file you already wrote: edit the lines, not the file",
            revising,
        )
        self.assertIn("every worker in the pipeline", revising)
        self.assertIn(
            "Atomic means nobody sees a partial file; it does not mean the "
            "content has to be retyped.",
            revising,
        )
        self.assertIn(
            "The first authoring pass is the exception", revising
        )

        worksheet = (ROOT / "agents" / "worksheet-designer.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("Edit the resolved identity and path fields where they", worksheet)
        self.assertIn("revising-in-place.md", worksheet)

        playbook = PLAYBOOK.read_text(encoding="utf-8")
        repair = playbook.split("## Phase 3.5 — The Focused Owner-Repair Round", 1)[
            1
        ].split("## Phase 3.6 - Final Resource Review and Finalisation", 1)[0]
        self.assertIn("Edit the named file in place", repair)
        self.assertIn("references/revising-in-place.md", repair)

    def test_a_table_zone_carries_a_height_budget_the_designer_can_read(self):
        """The reported fault was a table zone 1.119in tall holding two rows.

        Every cell got 0.19in, and the numbers "(1)" and "(2)" came back as
        TEXT_OVERLOAD on a generated box name - a content signal for a problem
        no amount of cutting words could fix. The sizing reference listed
        table widths and no heights at all, so the designer had nothing to size
        the zone against.
        """
        sizing = (ROOT / "references" / "slide-visual-sizing.md").read_text(
            encoding="utf-8"
        )
        table_line = next(
            line for line in sizing.splitlines() if line.startswith("- `table`:")
        )
        self.assertIn("0.74", table_line)
        self.assertIn("0.2", table_line)
        self.assertIn("row", table_line)

        helper = (
            ROOT / "builder" / "src" / "content" / "table.js"
        ).read_text(encoding="utf-8")
        self.assertIn("TABLE_ZONE_TOO_SHORT", helper)
        self.assertIn("ROW_MIN_H", helper)

    def test_a_missing_helper_can_be_answered_with_a_generated_picture(self):
        """A one-off symbol is not an engine helper's job.

        The lesson needed a UK three-pin plug and socket. It was declared as a
        representation, no helper drew one, and the only routes on offer were
        build a helper or record a gap - so the deck fell back on the plug
        emoji, which the platform draws as a generic two-pin plug. The run has
        image generation throughout; a fixed depiction of one real thing is
        exactly what it produces.
        """
        playbook = PLAYBOOK.read_text(encoding="utf-8")
        helpers = playbook.split(
            "## Phase 1.5 — Helper Check (Before Spawning Any Renderer)", 1
        )[1].split("## Phase 2 — Spawn Parallel Rendering Branches", 1)[0]

        self.assertIn("substitute", helpers)
        self.assertIn("a fixed depiction of one real thing", helpers)
        self.assertIn("UK three-pin plug and socket", helpers)
        # The route is a PICTURE. Which picture route it takes - generated, or
        # a real photograph with generation behind it - is the ordinary
        # acquisition decision, and pinning "controlled-ai" here once taught a
        # Year 4 circuits lesson to send a photograph of a cell in a battery
        # holder to generation and arrive with nothing on a host that had none.
        self.assertIn("its acquisition mode the designer's own rule", helpers)
        # A helper's late picture is exactly the need the run ceiling exists
        # to allow, so this route is measured against 24, not the 16 the
        # designer budgeted to.
        self.assertIn("run ceiling of 24 rather than the 16 design budget", helpers)
        # The gap record stays available, but only after both routes are shut.
        self.assertIn("only when neither", helpers)

        template = (ROOT / "references" / "output-template.md").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            "A fixed depiction of one real thing is the opposite", template
        )
        self.assertIn("Ask for that visual as a picture instead", template)
        # And that the template keeps the two decisions apart, so an object
        # ordinary photography covers still tries the real route first.
        self.assertIn("does not settle where the picture comes from", template)
        self.assertIn("`ordinary-real` with `fallback_action: ai`", template)

    def test_scaffold_owns_route_specific_content_envelopes(self):
        """The builder emits each unit's content envelope; the designer only
        fills decided values, so the guide must not send it back to
        reconstructing content objects from the reference files."""
        guide = (
            ROOT / "references" / "lesson-design-scaffold.md"
        ).read_text(encoding="utf-8")

        self.assertIn(
            "route-specific envelope with the exact fields for its kind",
            guide,
        )
        self.assertNotIn(
            "replace the whole value with the exact route-specific "
            "content object",
            guide,
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
        text = component_text("Dialogic route")
        self.assertIn("After the final discussion, include one honest Synthesise beat.", text)
        self.assertIn("It names and compares the positions, frames or tensions that genuinely appeared.", text)
        self.assertIn("It must not invent class views or announce one predetermined answer.", text)
        self.assertIn("A separate individual Reflect is conditional and belongs in the ending.", text)
        self.assertNotIn("Add an honest synthesis when useful", text)

    def test_stage1_support_fading_summary(self):
        designer = component_text("Generated worksheet")
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
        # Each word where it is most useful (teacher review, 5 September 2026).
        # "Meaning first, then the word" was the whole rule and only ever
        # covered half the lesson: it says nothing about a word children need
        # BEFORE they can follow an instruction, and one placement field could
        # not hold both answers in one lesson anyway. What is pinned here is
        # that the designer plans a moment per word, that both reasons for
        # choosing a moment survive, and that the two failures either side of
        # it are still named.
        self.assertIn("Plan when each word is introduced", text)
        self.assertIn("`vocabularyIntroductions`", text)
        # A term needed to follow an instruction goes in first.
        self.assertIn("goes in before that instruction", text)
        # A term the material can show goes in after the noticing.
        self.assertIn("goes in after that noticing", text)
        self.assertIn("Discovery still introduces formal vocabulary after the exploration", text)
        # Grouping is a decision, not a quota, in both directions.
        self.assertIn("Group words that are needed together", text)
        self.assertIn("a word introduced after the last moment it was any use", text)

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
        start = text.index("## Write the lesson, then the contract")
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
        start = text.index("## Write the lesson, then the contract")
        end = text.index("### Complete the picture contract here")
        section = text[start:end]
        self.assertIn("deliberate omissions", section)
        self.assertIn("anything deliberately omitted", section)

    def test_preferences_are_loaded_by_named_section(self):
        designer = self._designer_text()
        preferences = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        self.assertIn(
            "stops before the next heading at the same or a higher level.",
            designer,
        )
        self.assertIn("### Core rules", preferences)
        self.assertIn("### Lesson Designer content boundaries", preferences)
        self.assertIn("### Lesson Designer visual-need boundary", preferences)
        self.assertIn("### Speaker notes hand-off", preferences)

    def test_lesson_designer_prices_the_protected_set_against_the_page(self):
        # A protected set nobody counted is how a sheet reaches the worksheet
        # designer over a page with no removal authorised, and comes straight
        # back for a decision that was always the designer's.
        designer = component_text("Generated worksheet")
        self.assertIn("Price the protected set against the page", designer)
        self.assertIn("250mm", designer)
        self.assertIn("preAuthorisedRemoval: []", designer)
        preferences = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        worksheets = preferences.split("## Worksheets", 1)[1].split("\n## ", 1)[0]
        self.assertIn("Price the protected set against the page", worksheets)
        self.assertIn("about 250mm of stacked height", worksheets)

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

    def test_lesson_quality_lock_centres_learning_without_copying_mechanics(self):
        """The failed lesson completed fields but lost the learning centre.

        The compact record now protects the curriculum boundary, central gap
        and diagnostic evidence. Mechanical JSON and picture bookkeeping stay
        at their deterministic owners instead of competing in the first
        semantic pass.
        """
        designer = self._designer_text()
        section = designer.split(
            "When every decision is made,",
            1,
        )[1].split(
            "Use these alignment traces:",
            1,
        )[0]
        semantic_record = section.split(
            "Do not duplicate mechanical IDs",
            1,
        )[0]

        for required in (
            "a walk-through a teacher could teach from",
            "By the end, children will",
            "approved curriculum boundary",
            "dominant sticking point or misconception",
            "cannot be passed by a surface cue",
            "fresh worksheet evidence",
        ):
            self.assertIn(required, semantic_record)

        for retired_duplication in (
            "representation family IDs",
            "sticky-knowledge IDs",
            "answers or models and their delivery",
            "authenticity classes and comparison-set invariants",
        ):
            self.assertNotIn(
                retired_duplication,
                semantic_record,
            )

        self.assertIn(
            "Their canonical JSON files and deterministic validators own them.",
            section,
        )

    def test_designer_and_reviewer_defend_scope_and_diagnostic_validity(self):
        designer = self._designer_text()
        reviewer = (
            ROOT / "agents" / "design-reviewer.md"
        ).read_text(encoding="utf-8")

        self.assertIn("Related does not mean prerequisite.", designer)
        self.assertIn("surface cue, answer position", designer)
        self.assertIn(
            "related later content, notation or technique",
            reviewer,
        )
        self.assertIn(
            "incidental picture cue, wording cue, answer position",
            reviewer,
        )
        self.assertIn(
            "rather than a list of facts or a lesson outline",
            reviewer,
        )

    def test_science_progression_and_practical_safety_are_explicit(self):
        science = (
            ROOT / "references" / "subject-science.md"
        ).read_text(encoding="utf-8")

        for required in (
            "Year 4 children construct simple series circuits",
            "Recognised circuit symbols belong to Year 6",
            "cannot be passed by spotting an incidental picture cue",
            "equipment-specific precaution",
            "do not connect a wire directly across the battery terminals",
        ):
            self.assertIn(required, science)

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


    def test_written_voice_interview_rules_are_encoded(self):
        """Rules the teacher gave in the language-guidance interview stay encoded.

        Each assertion below traces to an interview answer: the class-reference
        words, contractions, praise and reassurance placement, protecting
        authentic assessment language, and the vocabulary card not counting as
        teaching. A consolidation that drops one silently reopens the gap.
        """
        preferences = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        self.assertIn("**The class is `children`, `you` and `we`.**", preferences)
        self.assertIn("never says `kids`, `pupils` or `students`", preferences)
        self.assertIn("the contractions natural speech uses", preferences)
        self.assertIn("generated wording does not praise", preferences)
        self.assertIn("can sit naturally in the spoken script but not on the board", preferences)
        self.assertIn("Do not simplify wording merely because an assessment word is formal", preferences)
        self.assertIn("a vocabulary card alone is a reference, not that teaching", preferences)

        reviewer = (ROOT / "agents" / "design-reviewer.md").read_text(encoding="utf-8")
        self.assertIn("check child-facing and spoken text calls the class `children`, `you` or `we`", reviewer)
        self.assertIn("no praise line", reviewer)

        designer = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        self.assertIn("No praise lines - live teacher's job.", designer)
        self.assertNotIn("No fake praise.", designer)


if __name__ == "__main__":
    unittest.main()
