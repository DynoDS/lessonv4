from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
AGENT = ROOT / "agents" / "slide-designer.md"
# The whole-deck optional pass moved into its own worker on 1 Sept 2026, so
# the Working Wall and Stick-in designers could start on the settled deck
# instead of waiting for drawings they never copy. The pass judgement is
# pinned on that role; the designer keeps only the first moment.
DECORATOR = ROOT / "agents" / "slide-decorator.md"
PREFERENCES = ROOT / "references" / "preferences.md"
PROFILE = ROOT / "references" / "teacher-slide-visual-profile.md"
TEMPLATES = ROOT / "references" / "templates.md"
PLAYBOOK = ROOT / "references" / "slide-composition-playbook.md"
SIZING = ROOT / "references" / "slide-visual-sizing.md"
CONTEXT = ROOT / "references" / "context-pictures.md"
GAP = ROOT / "references" / "brief-gap-protocol.md"
SUCCESS = ROOT / "references" / "slide-success-criteria.md"
REPRESENTATIONS = ROOT / "references" / "slide-representations.md"
SPEECH = ROOT / "references" / "slide-speech-and-characters.md"
MODELLING = ROOT / "references" / "modelling-formats.md"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def section(text: str, start: str, end: str) -> str:
    start_at = text.index(start)
    end_at = text.index(end, start_at)
    return text[start_at:end_at]


class SlideDesignerBrainContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.agent = read(AGENT)
        self.decorator = read(DECORATOR)
        self.preferences = read(PREFERENCES)
        self.profile = read(PROFILE)
        self.templates = read(TEMPLATES)
        self.playbook = read(PLAYBOOK)
        self.sizing = read(SIZING)
        self.context = read(CONTEXT)
        self.gap = read(GAP)
        self.success = read(SUCCESS)
        self.representations = read(REPRESENTATIONS)
        self.speech = read(SPEECH)
        self.modelling = read(MODELLING)
        self.runtime = "\n".join(
            (
                self.agent,
                self.preferences,
                self.profile,
                self.templates,
                self.playbook,
                self.sizing,
                self.context,
                self.gap,
                self.success,
                self.representations,
                self.speech,
                self.modelling,
            )
        )

    def assert_tokens(self, text: str, *tokens: str) -> None:
        for token in tokens:
            with self.subTest(token=token):
                self.assertIn(token, text)

    def test_role_refuses_general_presentations_skill(self) -> None:
        self.assertIn(
            "description: Slide specification designer for UK primary lessons.",
            self.agent,
        )
        self.assertIn("This role delivers JSON and inspects its prescribed private PowerPoint preview.", self.agent)
        self.assertIn("orchestrator alone runs and publishes the final PowerPoint build", self.agent)
        self.assertIn(
            "Do not load or use the global `Presentations` skill for this role.",
            self.agent,
        )
        self.assertIn(
            "fixed builder owns PowerPoint creation",
            self.agent,
        )
        self.assertNotIn(
            "description: Slide designer for UK primary lesson PowerPoints.",
            self.agent,
        )

    def test_model_and_reasoning_route_are_unchanged(self) -> None:
        self.assertIn("model: sol", self.agent)
        self.assertIn("effort: high", self.agent)

    def test_preferences_allow_exact_copy_agents_to_route_written_voice_conditionally(self) -> None:
        self.assertIn(
            "An agent that normally copies settled wording exactly reads Written Voice only",
            self.preferences,
        )

    def test_template_catalogue_is_progressively_loaded(self) -> None:
        self.assert_tokens(
            self.templates,
            "Do not load every example or field contract at startup",
            "read that template's complete entry before selecting it",
            "read that object's complete section 4 entry before its first use",
            "A later use reopens the entry only when it depends on a different mode",
        )

    def test_startup_route_loads_only_canonical_owners(self) -> None:
        startup = section(
            self.agent,
            "Read at startup:",
            "Read before the first affected decision:",
        )
        self.assert_tokens(
            startup,
            "preferences.md",
            "teacher-slide-visual-profile.md",
            "templates.md",
            "slide-composition-playbook.md",
            "context-pictures.md",
        )
        for specialist in (
            "slide-visual-sizing.md",
            "slide-success-criteria.md",
            "slide-representations.md",
            "slide-speech-and-characters.md",
            "modelling-formats.md",
            "brief-gap-protocol.md",
        ):
            self.assertNotIn(specialist, startup)

    def test_conditional_routes_name_the_exact_trigger(self) -> None:
        route = section(
            self.agent,
            "Read before the first affected decision:",
            "Read from the working directory:",
        )
        self.assert_tokens(
            route,
            "when you must author narrow child-facing furniture",
            "before assigning or rendering any question number",
            "when a source unit has `successCriteriaRefs` or `stickyKnowledgeRefs`",
            "when a source unit has `representationRefs` or non-null `modellingState`",
            "when a unit contains a speaking character",
            "immediately before choosing the template, zone, row or stack for the first load-bearing visual",
            "immediately before first use",
            "only when no documented route can preserve a required slide",
        )

    def test_source_wording_and_content_ownership_remain_strict(self) -> None:
        self.assert_tokens(
            self.agent,
            "Copy every source-authored child-facing string exactly",
            "Do not polish, shorten, simplify or rewrite wording to make it fit",
            "A wording problem is an upstream content fault",
            "You make no pedagogical decisions",
            "Do not read the teacher's original brief",
            "when `pupilInstruction` is null",
            "must not add a new task, concept, phase or pedagogical decision",
        )

    def test_core_preserves_execution_cues_without_second_ownership(self) -> None:
        self.assert_tokens(
            self.agent,
            "The main pupil task or teaching object is the strongest body-level element",
            "Show the task once",
            "Make task phases visible",
            "Preserve card boundaries",
            "row-versus-stack judgement",
            "PUPIL_INSTRUCTION_AMBIGUOUS",
            "Sparse physical-demonstration slides remain intentionally sparse",
        )
        self.assertNotIn("## Starter slide", self.agent)
        self.assertNotIn("## Vocabulary slides", self.agent)
        self.assertNotIn("## Skill-based lesson rhythm", self.agent)

    def test_profile_keeps_teacher_visual_preferences_authoritative(self) -> None:
        self.assert_tokens(
            self.profile,
            "card boundaries and whether important content remains unnecessarily small beside unused background space",
            "principal pupil task is in the body at task-reading size",
            "real task phases are visibly separated",
            "physically attached to those objects",
            "smallest load-bearing visual",
            "survival phrase",
            "task-action",
            "The same teaching object keeps the same visual identity",
            "Answer green belongs only to answers being revealed or marked",
        )

    def test_playbook_preserves_surface_specific_rules_moved_from_core(self) -> None:
        self.assert_tokens(
            self.playbook,
            "## Surface execution cues",
            "### Starter",
            "### Vocabulary",
            "### Teaching and pupil action",
            "### Worked examples and physical demonstrations",
            "### Comparison, sequence, and fan-in",
            "### Maps, charts, diagrams, and photographs",
            "### Lesson rhythm",
            "### Colour",
            "PUPIL_INSTRUCTION_AMBIGUOUS",
            "sort-board",
            "evidence-cards",
            "physical-demonstration slide",
            "source-pathway",
            "contain",
            "cover",
            "task-centred",
            "The full objective remains in teacher orientation",
            "structured `keyQuestions`",
            "Do not print planning metadata",
            "The Reflect is purposeful individual synthesis",
            "only the decisions pupils must make and the standard they need to meet",
        )

    def test_success_criteria_and_repeated_references_keep_identity(self) -> None:
        self.assert_tokens(
            self.success,
            "One success-criteria object keeps one visual identity",
            "sc-panel",
            "SC-inline",
        )
        self.assert_tokens(
            self.agent,
            "A continuation repeats that identity without drift",
            "attached to the exact object or decision named by the source",
            "one faithful combined reference rather than two competing copies",
        )

    def test_representation_and_modelling_fidelity_remain_strict(self) -> None:
        self.assert_tokens(
            self.agent,
            "Preserve identity, configuration, colour, orientation, role and prepared-versus-live state exactly",
            "Do not improve, swap or reinterpret a source-authored representation",
        )
        self.assert_tokens(
            self.representations,
            "The structured `modellingState` is authoritative",
            "return a named content hand-off fault",
        )
        self.assertIn("Generic working boxes remain removed", self.modelling)

    def test_answer_treatment_remains_source_controlled(self) -> None:
        answer_section = section(
            self.agent,
            "### 5. Use answers from the structured answer object only",
            "### 6. Place source references exactly",
        )
        self.assert_tokens(
            answer_section,
            "sole authority for answer treatment",
            "delivery: teacher-only",
            "delivery: answer-slide",
            "delivery: visible-in-unit",
            "delivery: none",
            "Do not reconstruct an answer from the question",
            "Do not invent a model because an open task looks empty without one",
        )
        self.assertIn("Do not add a generic \"Answer\" slide for open discussion work", self.agent)

    def test_optional_visual_pass_has_one_owner_and_one_timing(self) -> None:
        # The timing moved on 31 Aug 2026. The pass turns on whether a slide has
        # clear space, which is a fact about a drawn page, and running it over
        # the specification meant answering from evidence that cannot show it.
        self.assertIn(
            "After the core deck has passed its check and its preview has been "
            "rendered, run the one whole-deck opportunity pass against those "
            "rendered pages",
            self.context,
        )
        self.assertNotIn("After the core slide geometry is settled, run the one", self.context)
        # The reviewer checks the pass; it does not run one. Until the pass wrote
        # a record there was nothing to check it against, so the profile now
        # names the record rather than asking for a verification it could not do.
        self.assertIn("optional-picture-pass.json", self.profile)
        self.assertIn("check the earlier optional P2/P3 pass", self.profile)
        self.assertNotIn("perform the optional P2/P3 opportunity pass", self.profile)

    def test_optional_pass_preserves_priority_and_no_delegation(self) -> None:
        self.assert_tokens(
            self.decorator,
            "strict order P1 > P2 > P3",
            "P3 is always the first thing to remove",
            "Do not create or delegate to a new agent or a separate Educational SVG resolver worker",
        )

    def test_a_photograph_on_the_slide_does_not_end_the_pass(self) -> None:
        # "P1 already carries the meaning" used to be the first of four answers,
        # which made a photograph a full stop rather than an answer about what a
        # picture may displace. A deck came back with seventeen slides and no
        # drawing on any of them, explained as "most slides already had strong P1".
        self.assertNotIn("P1 already carries the meaning", self.decorator)
        self.assert_tokens(
            self.decorator,
            "A photograph on this slide does not answer question 1",
            "It never settles whether the slide has room",
        )

    def test_a_picture_elsewhere_is_not_a_budget(self) -> None:
        self.assert_tokens(
            self.decorator,
            "A picture on another slide answers nothing at all",
            "There is no deck budget",
        )

    def test_the_pass_writes_a_record_the_deck_check_can_read(self) -> None:
        # The pass used to leave no trace, so a slide-by-slide weighing and one
        # thought about the whole deck produced the identical artefact.
        self.assert_tokens(
            self.decorator,
            "optional-picture-pass.json",
            "check-optional-pictures.py",
            "OPTIONAL_PICTURE_PASS_OK",
        )
        self.assert_tokens(
            self.context,
            "The pass writes a record, one line per slide",
            "There is no code for a deck-level answer",
            "`nothing-fits` is paid for, not asserted",
            "An emoji-only slide pays the same price",
            "OPTIONAL_PICTURE_SHAPE",
        )

    def test_the_library_is_the_route_and_the_emoji_is_the_fallback(self) -> None:
        # A deck came back with seventeen slides and no drawing in it. The
        # designer had typed an emoji weather strip onto the one slide that
        # wanted a picture, without ever searching the library, and then reported
        # zero requests as though the library had been consulted. The old opening
        # line - "Use either an emoji or a hand-drawn Educational SVG picture" -
        # is what made that read like a free choice between equals.
        self.assertNotIn(
            "Use either an emoji or a hand-drawn Educational SVG picture.",
            self.context,
        )
        self.assert_tokens(
            self.context,
            "Look in the Educational SVG library first",
            "an emoji is a decision made **after** a search, never instead of one",
            "it is skipping the route",
        )

    def test_the_library_is_resolved_at_the_start_of_the_pass(self) -> None:
        # Resolving it only when a decision reaches the library means a designer
        # that never looks never runs the check, and then reports an empty layer
        # as though the library had been searched and found wanting.
        self.assertIn("the first act of the opportunity pass", self.context)
        self.assertNotIn(
            "before the opportunity pass reaches any Educational SVG decision",
            self.context,
        )

    def test_zero_drawings_beside_emojis_is_not_a_zero_pass(self) -> None:
        self.assert_tokens(
            self.context,
            "Zero drawings is not the same as zero optional pictures",
            "a pass that never opened the library",
        )
        self.assert_tokens(
            self.decorator,
            "an emoji typed in without a search is a slide the pass skipped",
            "deck-level judgement never zeroes this layer",
        )

    def test_pass_judgement_has_one_owner_and_the_agent_defers_to_it(self) -> None:
        # The agent frames the pass - when it runs, the record it writes, the
        # per-slide questions - and keeps its anchor rules. The full judgement
        # (what counts as room, what competes, zero evidence, deck variety) is
        # owned by context-pictures.md rather than taught a second time in the
        # agent, where the two copies drifted.
        self.assertIn("`context-pictures.md` owns the judgement", self.decorator)
        self.assertNotIn("a normal deck carries several", self.decorator)
        self.assertNotIn("reads as a template rather than a decision", self.decorator)
        self.assertIn("Expect a normal deck to carry several", self.context)

    def test_incident_stories_live_in_tests_not_runtime_prompts(self) -> None:
        # The seventeen-slide deck is regression history. Its lessons are held
        # as rules ("A photograph on this slide does not answer question 1")
        # and as deterministic checks; the story itself stays in the tests and
        # the checker docstrings, not in the context every future run pays for.
        self.assertNotIn("seventeen", self.agent)
        self.assertNotIn("seventeen", self.context)

    def test_the_completion_report_names_both_routes_from_the_check(self) -> None:
        # Reporting only the drawing count hides an all-emoji layer, which is
        # exactly what a skipped pass looks like from the outside.
        self.assert_tokens(
            self.decorator,
            "SLIDE_DESIGN_OPTIONAL_PICTURES",
            "Educational SVG P2/P3 requests authored, [E] emoji",
            "Optional visual library result",
        )
        # The designer copies the same route line, which on its own deck reads
        # zero and zero: the layer is added after it promotes.
        self.assertIn("SLIDE_DESIGN_OPTIONAL_PICTURES", self.agent)

    def test_slide_gap_route_has_one_current_owner(self) -> None:
        self.assert_tokens(
            self.gap,
            "## Slide Designer route",
            "SLIDE_HELPER_GAP",
            "pending-helper/",
            "later manual installation",
            "Do not create or update canonical `[WORKING_DIR]/lesson.json`",
        )
        # A missing helper must still prevent an unfaithful final spec, but
        # today's route cannot resume on helpers awaiting manual installation.
        worker_rules = self.gap + self.agent + read(ROOT / "agents" / "worksheet-designer.md")
        for retired in ("HELPERS_IN_PROGRESS", "RESUME_CHECKPOINT", "SOURCE_SNAPSHOT"):
            self.assertNotIn(retired, worker_rules)
        self.assertNotIn(
            "record the exact missing capability in `notes`",
            self.representations,
        )

    def test_null_instruction_exception_is_not_contradicted(self) -> None:
        self.assert_tokens(
            self.gap,
            "When `pupilInstruction` is null",
            "one narrow child-facing title or instruction",
            "does not add a task, concept, phase or pedagogical choice",
        )

    def test_representation_reference_routes_load_bearing_gaps_to_current_contract(self) -> None:
        self.assertIn("follow the Slide Designer route in `brief-gap-protocol.md`", self.representations)

    def test_core_uses_current_gap_route_and_three_repair_passes(self) -> None:
        self.assert_tokens(
            self.agent,
            "read and follow the Slide Designer route in `brief-gap-protocol.md`",
            "You may make no more than three candidate-repair passes",
        )
        self.assertNotIn("no more than two", self.agent)

    def test_core_passes_the_frozen_photo_contract_to_the_checker(self) -> None:
        self.assertIn(
            '--photo-requirements "[PHOTO_REQUIREMENTS_PATH]"',
            self.agent,
        )

    def test_question_helpers_share_one_stage_boundary(self) -> None:
        question_cards = section(
            self.templates,
            "### `question-cards`",
            "Zone class compatibility",
        )
        self.assert_tokens(
            question_cards,
            "restricted to a starter or the lesson's main independent work",
            "A Do beat, quick check, discussion question, My Turn or other smaller task uses an unnumbered composition",
        )

    def test_capacity_rule_matches_the_blocking_slide_check(self) -> None:
        self.assert_tokens(
            self.templates,
            "never shorten, remove or rewrite content",
            "final `check-slide-design.js` gate treats them as blocking composition diagnostics",
            "change layout, allocate more space or split faithfully",
        )


if __name__ == "__main__":
    unittest.main()
