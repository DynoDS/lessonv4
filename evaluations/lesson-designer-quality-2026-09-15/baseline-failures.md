# Baseline test failures on this machine (38c6a07c, Windows, core.autocrlf=true)

Identical before and after the branch's changes. Full pytest output is in the scratchpad runs recorded in report.md; the failing ids:

- FAILED scripts/tests/test_image_scout_recovery.py::UnifiedPictureArchitectureTests::test_worker_instructions_keep_visual_review_and_unified_session
- FAILED scripts/tests/test_make_lesson_static_contract.py::MakeLessonStaticContractTests::test_written_voice_interview_rules_are_encoded
- FAILED scripts/tests/test_slide_decorator.py::SlideDecoratorRoleTests::test_the_launch_spec_resolves_the_new_role
- FAILED scripts/tests/test_slide_decorator.py::SlideDecoratorRoleTests::test_the_role_retains_its_configured_launch_settings
- FAILED scripts/tests/test_slide_designer_brain_contract.py::SlideDesignerBrainContractTests::test_model_and_reasoning_route_are_unchanged
- SUBFAILED(owner='slide-designer') scripts/tests/test_make_lesson_runtime.py::MakeLessonRuntimeTests::test_focused_repair_entrypoints_are_compact_and_keep_owner_models
- SUBFAILED(section='Dialogic route') scripts/tests/test_lesson_designer_component_loading.py::ComponentExtractionTests::test_all_five_sections_are_addressable_without_siblings
- SUBFAILED(section='Generated worksheet') scripts/tests/test_lesson_designer_component_loading.py::ComponentExtractionTests::test_all_five_sections_are_addressable_without_siblings
- SUBFAILED(section='Photograph acquisition') scripts/tests/test_lesson_designer_component_loading.py::ComponentExtractionTests::test_all_five_sections_are_addressable_without_siblings
- SUBFAILED(section='Representation configurations') scripts/tests/test_lesson_designer_component_loading.py::ComponentExtractionTests::test_all_five_sections_are_addressable_without_siblings
- SUBFAILED(section='Task-Centred route') scripts/tests/test_lesson_designer_component_loading.py::ComponentExtractionTests::test_all_five_sections_are_addressable_without_siblings

Node: test/optional-visual-contract.test.js, 'working-wall authorities agree that P3 never earns wall-worthiness' fails at baseline (regex /P3/ against a CRLF working file).

Cause where known: the five component-loading subtests and the working-wall test compare LF expected text with the CRLF working copy; the compact-entrypoint subtest (8322 not less than 8000 bytes) and the four string assertions (image-scout recovery, written-voice interview rules, slide-decorator launch spec, slide-designer brain contract) fail on the untouched main checkout too.
