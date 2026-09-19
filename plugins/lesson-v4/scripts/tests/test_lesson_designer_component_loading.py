"""Reachability and exact-view checks, not a test of model judgement quality."""
from __future__ import annotations

import itertools
import subprocess
import sys
import unittest
from pathlib import Path

from reference_test_support import READER, ROOT, component_text

CORE = (ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
COMPONENTS = (ROOT / "references" / "lesson-designer-components.md").read_text(encoding="utf-8")
SECTIONS = (
    "Dialogic route", "Task-Centred route", "Representation configurations",
    "Generated worksheet", "Photograph acquisition",
)
STARTS = {
    "Dialogic route": "**Dialogic:** Objective requires",
    "Task-Centred route": "**Task-Centred:** Built around",
    "Representation configurations": "**Families, not single objects - pick config deliberately.**",
    "Generated worksheet": "**Design independent activity before content or surface.**",
    "Photograph acquisition": "**Choosing the acquisition mode.**",
}


class ComponentExtractionTests(unittest.TestCase):
    def test_all_five_sections_are_addressable_without_siblings(self):
        for section in SECTIONS:
            with self.subTest(section=section):
                view = component_text(section)
                heading = READER.locate(COMPONENTS, section)
                exact = COMPONENTS[heading.start:heading.end]
                self.assertIn(exact, view)
                self.assertIn(STARTS[section], view)
                for other in SECTIONS:
                    if other != section:
                        self.assertNotIn(STARTS[other], view)

    def test_batched_views_have_each_requested_block_once(self):
        for count in range(1, len(SECTIONS) + 1):
            for selection in itertools.combinations(SECTIONS, count):
                with self.subTest(sections=selection):
                    view, _ = READER.selected_text(ROOT, [
                        f"lesson-designer-components.md::{name}" for name in selection
                    ])
                    for name, marker in STARTS.items():
                        self.assertEqual(view.count(marker), int(name in selection))

    def test_repeated_selection_does_not_repeat_a_component(self):
        request = "lesson-designer-components.md::Generated worksheet"
        once = READER.selected_text(ROOT, [request])
        twice = READER.selected_text(ROOT, [request, request])
        self.assertEqual(once, twice)

    def test_missing_component_is_an_error_not_an_empty_pass(self):
        with self.assertRaises(READER.ReferenceError):
            component_text("Renamed or missing component")

    def test_actual_cli_resolves_each_component(self):
        for section in SECTIONS:
            with self.subTest(section=section):
                result = subprocess.run([
                    sys.executable, str(ROOT / "scripts" / "read-reference.py"),
                    "--select", f"lesson-designer-components.md::{section}",
                ], capture_output=True, text=True, encoding="utf-8", check=True)
                self.assertIn(STARTS[section], result.stdout)
                self.assertTrue(result.stdout.rstrip().splitlines()[-1].startswith("REFERENCE_READ_OK:"))

    def test_details_are_not_still_duplicated_in_core(self):
        for marker in STARTS.values():
            self.assertNotIn(marker, CORE)


class ActivationAndPreservationTests(unittest.TestCase):
    def test_delegated_rules_keep_the_main_agents_authority(self):
        authority = CORE.split("## Authority and precedence", 1)[1].split("\n---", 1)[0]
        self.assertIn("6. This agent for cross-subject lesson-design decisions, including its delegated `lesson-designer-components.md` sections.", authority)

    def test_conditional_file_is_not_in_the_startup_list(self):
        loading = CORE.split("## Reference Files - precedence and decision-point loading", 1)[1]
        startup = loading.split("**At the start:**", 1)[1].split("**At the decision point:**", 1)[0]
        self.assertNotIn("lesson-designer-components.md", startup)
        self.assertIn("Do not open this component file in full or load it at startup.", loading)

    def test_each_component_has_an_explicit_point_of_use(self):
        for name in SECTIONS:
            self.assertIn(f"`lesson-designer-components.md` → {name}", CORE)

    def test_route_details_are_read_before_not_after_committing(self):
        self.assertIn("When Dialogic is a candidate", CORE)
        self.assertIn("Dialogic route before committing the structure", CORE)
        self.assertIn("When Task-Centred is a candidate", CORE)
        self.assertIn("Task-Centred route before committing the structure", CORE)

    def test_structure_menu_keeps_every_entry_condition(self):
        evidence = READER.read_source(ROOT, "evidence-synthesis.md")
        menu, _ = READER.structure_menu(evidence)
        self.assertEqual(menu.count("**Use when.**"), 5)
        for route in READER.STRUCTURES:
            self.assertIn("### " + route, menu)
        self.assertIn("mandatory `--structure-menu` read", CORE)
        self.assertIn("safe, dependable phenomenon", menu)
        self.assertIn("multiple defensible positions exist", menu)

    def test_investigation_safeguards_apply_outside_discovery_too(self):
        self.assertIn("Read the full `Discovery / Inquiry` subsection whenever an investigation or bounded exploration is being considered, even when the final route is not Discovery.", CORE)
        self.assertIn("novices must receive clear direct teaching", CORE)

    def test_writing_form_boundary_still_precedes_route_commitment(self):
        self.assertIn("Writing lesson turns on whether form already child's", CORE)
        self.assertIn("learning to write this form or applying form already held", CORE)
        self.assertIn("Splitting axis when LO names multiple outputs", CORE)

    def test_configuration_guide_is_cross_subject_and_before_configuration(self):
        self.assertIn("Before specifying or changing a representation configuration", CORE)
        self.assertIn("diagrams, tables, maps and other helpers in any subject", CORE)
        view = component_text("Representation configurations")
        self.assertIn("blank what's being learned for live annotation", view)
        self.assertIn("two PWMs per scaffolded question, one per amount", view)

    def test_representation_eligibility_and_non_helper_models_remain_in_core(self):
        self.assertIn("Choose the view by the relationship children must understand", CORE)
        self.assertIn("Use `[]` when no representation", CORE)
        self.assertIn("**Modelling resource state:**", CORE)
        self.assertIn("**Model the move; supply the exact instance.**", CORE)

    def test_generated_sheet_guidance_precedes_activity_and_fit_decisions(self):
        self.assertIn("Generated worksheet before choosing its activity, examples, shape, support or page-fit priorities", CORE)
        view = component_text("Generated worksheet")
        for needed in (
            "activityArchitecture", "fitPriority", "preAuthorisedRemoval: []",
            "a paragraph in a writing lesson", "the sheet carries photographs",
            "Two pages only when the central task needs a substantial write-on visual",
        ):
            self.assertIn(needed, view)

    def test_supplied_worksheet_does_not_remove_coverage_or_adaptation(self):
        self.assertIn("their sheet is the Expected sheet", CORE)
        self.assertIn("the deck's examples must not reuse its numbers or contexts", CORE)
        self.assertIn("Below and Greater Depth adaptation still run", CORE)
        self.assertIn("Do not load generated-sheet authoring merely to inspect a supplied sheet", CORE)

    def test_shared_frame_routing_remains_available_without_generating_a_sheet(self):
        self.assertIn("worksheet.resourceMode", CORE)
        self.assertIn("shared-frame", CORE)
        self.assertIn("the sheet is built once and adaptation is skipped", CORE)

    def test_slide_and_pupil_wording_rules_have_not_disappeared_into_worksheet(self):
        for needed in (
            "Make each pupil action independently presentable",
            "Make every non-null pupilInstruction independently actionable",
            "every `answer.structure` value a child reads",
            "A frame-shaped task keeps its instruction to one entry line",
            "A generative task names the category it is generating from",
            "Structure visible multi-part tasks instead of prose",
        ):
            self.assertIn(needed, CORE)

    def test_visual_need_and_budget_are_not_hidden_behind_photo_selection(self):
        for needed in (
            "Settle WHICH pictures the lesson wants before any of that",
            "Lesson Designer visual-need boundary", "Your picture budget is 16 across the whole design",
            "Smallest coherent visual set learning requires", "Never photograph a tool the engine draws",
            '"Normally none" is not "never"',
        ):
            self.assertIn(needed, CORE)

    def test_photo_guidance_is_prospective_and_applies_to_maths_and_repairs(self):
        self.assertIn("When a required photograph is being considered", CORE)
        self.assertIn("before committing the visual plan or authoring its contract", CORE)
        self.assertIn("This applies in Maths too, and to repairs that introduce a photograph", CORE)
        view = component_text("Photograph acquisition")
        for needed in ("authentic-real", "ordinary-real", "controlled-ai", "A single named object is not staging", "A direct comparison set is all real or all generated"):
            self.assertIn(needed, view)

    def test_factual_research_remains_available_without_photographs(self):
        self.assertIn("Search the web whenever it makes the lesson better", CORE)
        self.assertIn("the one thing not to bring back is a shopping list of image files", CORE)

    def test_dialogic_exception_boundaries_are_preserved(self):
        view = component_text("Dialogic route")
        self.assertIn("It must not invent class views or announce one predetermined answer", view)
        self.assertIn("A separate individual Reflect is conditional", view)
        self.assertIn("If substantial new knowledge must be taught, use Content-based", view)

    def test_task_centre_does_not_turn_ordinary_practice_into_a_sustained_task(self):
        view = component_text("Task-Centred route")
        self.assertIn("ordinary practice/knowledge lesson not task-centred just because ends in task", view)
        self.assertIn("Outcome may be open or tightly funnelled", view)

    def test_fresh_workers_and_context_loss_still_require_reading(self):
        self.assertIn("After context loss, a source change or a fresh worker, read the needed sections again", CORE)
        self.assertIn("another worker's reading does not count", CORE)

    def test_completion_quality_lock_and_original_model_are_untouched(self):
        for needed in (
            "model: opus\neffort: xhigh\ncodex_model: astra\ncodex_effort: low",
            "## One Completion Pass, Then Done",
            "Then run `teacher-voice.md` → Final pre-flight check over the same strings",
            "By the end, children will [performance] because the lesson gives them",
            "LESSON_DESIGN_CHECK_FAILED", "Full trace runs once at end",
        ):
            self.assertIn(needed, CORE)


if __name__ == "__main__":
    unittest.main()
