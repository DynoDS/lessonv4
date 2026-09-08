"""A Do beat after an explanation uses the explanation, rather than saying it back.

Daniel's standing complaint (8 September 2026) was the story, structure and flow
of lessons, and specifically "the do beats after teacher explanations". A deep
research report on dependency-based instructional coherence located the cause,
and it was not the rhythm rules, which by 4.2.109 already held semantic
completeness, the pairing test, all-pupil commitment and demand without a quota.

It was the selector. Every place that told the designer how to pick a Do beat
carried one four-way map: a fact suits recall or a sort, a process labelling or
sketching, a concept writing or generating, a value ranking or talk. A taught
explanation - a cause, a mechanism, a reason, a relationship - is the commonest
chunk in a content lesson and it has no entry there. It falls to "concept", and
"concept" routes to write a sentence about it. So after every explanation the
designer was pointed at the one response that can be produced without using the
explanation at all: a summary that repeats it.

The catalogue could not rescue that choice, because it held no formats for the
operations an explanation actually needs. Sixty entries indexed by response
channel (recall, talk, write, draw, sort, rank, move, generate, metacognitive)
offered no because-sentence, no prediction the taught idea decides, no words-to-
diagram or diagram-to-words, no inference from evidence, and no connection back
to earlier learning. The research's own activity bank is indexed by mental
operation, and those are exactly the operations it lists for a taught model.

The repair: `preferences.md` keeps "Match the form to what was just taught" and
now says what a taught explanation needs, `do-beats.md` gains section 10 for
those beats, and the designer, the content-based route, the reviewer and the
reviewer's routing card all carry the explanation case.

This test guards the reach, not the prose: the rule has to arrive at every agent
that could break it, the way the pairing test does.
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
DO_BEATS = ROOT / "references" / "do-beats.md"
CONTENT_BASED = ROOT / "references" / "teaching-sequence-content-based.md"

sys.path.insert(0, str(SCRIPTS / "tests"))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


packet = load("design_review_packet_explanation", "design-review-packet.py")

RULE = "Name what the chunk needs children to do with it"
RHYTHM = "The Teach → Do → Teach → Do Rhythm"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def section(path: Path, heading: str) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.index("## " + heading)
    end = text.find("\n## ", start + 1)
    body = text[start:] if end == -1 else text[start:end]
    return " ".join(body.split())


class PreferencesOwnsTheSelectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.rhythm = section(PREFERENCES, RHYTHM)

    def test_the_selector_is_its_own_named_rule(self) -> None:
        self.assertIn("**" + RULE + ".**", self.rhythm)

    def test_the_settled_form_matching_default_survives_the_repair(self) -> None:
        """The 3 September 2026 request was for this default to come back.
        The repair widens what it routes to; it does not withdraw it."""
        self.assertIn("Match the form to what was just taught", self.rhythm)

    def test_an_explanation_has_its_own_entry_and_names_the_restatement_trap(self) -> None:
        self.assertIn("explanation, a cause, a mechanism or a relationship", self.rhythm)
        self.assertIn("only says it back", self.rhythm)

    def test_the_entry_names_moves_that_need_the_explanation(self) -> None:
        for move in (
            "complete the because",
            "explain one link in the chain",
            "predict what the idea says will happen",
            "change one condition",
            "turn the words into a diagram",
            "which of two explanations is better",
        ):
            with self.subTest(move=move):
                self.assertIn(move, self.rhythm)

    def test_evidence_and_connection_are_covered_too(self) -> None:
        self.assertIn("what it cannot tell us yet", self.rhythm)
        self.assertIn("needs connecting", self.rhythm)

    def test_a_deliberate_recap_is_still_allowed(self) -> None:
        """Discrimination: the rule must not fire on a lesson that chose a short
        recap because securing the wording is what the moment needed."""
        self.assertIn("a short recap is the right beat when securing the wording", self.rhythm)
        self.assertIn("What is ruled out is reaching for it by default", self.rhythm)

    def test_the_thinking_is_named_before_the_format_not_instead_of_it(self) -> None:
        self.assertIn("These name the thinking, not the format", self.rhythm)
        self.assertIn("do-beats.md", self.rhythm)

    def test_the_contents_card_advertises_the_selector(self) -> None:
        contents = section(PREFERENCES, "Contents — each agent reads its own sections")
        self.assertIn("naming what a chunk needs children to do with it", contents)


class TheCatalogueCarriesTheMissingOperationsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(DO_BEATS)

    def test_section_ten_exists_and_is_indexed(self) -> None:
        self.assertIn("## 10. Explain, predict, infer and connect", self.text)
        self.assertIn("**§10 Explain, predict, infer and connect**", self.text)

    def test_every_missing_operation_now_has_a_format(self) -> None:
        for entry in (
            "### 10.1 Because Sentence",
            "### 10.2 Explain One Link",
            "### 10.3 Predict Before Reveal",
            "### 10.4 Change One Thing",
            "### 10.5 Words to Diagram",
            "### 10.6 Diagram to Words",
            "### 10.7 What Can We Tell?",
            "### 10.8 Which Claim Does This Support?",
            "### 10.9 Connect It Back",
            "### 10.10 Which Explanation Is Better?",
        ):
            with self.subTest(entry=entry):
                self.assertIn(entry, self.text)

    def test_the_section_names_the_failure_it_exists_to_prevent(self) -> None:
        self.assertIn("only says the explanation back", self.text)

    def test_young_children_get_precise_prompts_not_explain_your_thinking(self) -> None:
        """Fiorella & Mayer: unscaffolded self-explanation is weak for younger
        primary. The stems are what makes these reachable in Year 2."""
        self.assertIn("Explain your thinking", self.text)
        self.assertIn("the stems below name the exact link being asked for", self.text)

    def test_the_picker_still_starts_from_the_purpose_and_routes_an_explanation(self) -> None:
        self.assertIn("A fact may suit recall or a sort", self.text)
        self.assertIn("`" + RULE + "`", self.text)
        self.assertIn("§10 holds the beats that use it", self.text)

    def test_the_two_option_contrast_defers_to_the_confounded_pair_rule(self) -> None:
        self.assertIn("differ only on the taught point", self.text)
        self.assertIn("evidence-synthesis.md` §5", self.text)


class TheRuleReachesEveryAgentThatCouldBreakItTests(unittest.TestCase):
    def test_the_designer_names_the_reflex_and_the_alternative(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("`" + RULE + "`", text)
        self.assertIn("the reflex answer is a written summary", text)
        self.assertIn("do-beats.md` §10", text)

    def test_the_content_based_route_keeps_substance_then_form_then_the_selector(self) -> None:
        text = flat(CONTENT_BASED)
        substance = text.index("Match the substance before the form")
        form = text.index("Then match the form to what was just taught")
        self.assertLess(substance, form)
        self.assertIn("`" + RULE + "`", text)
        self.assertIn("do-beats.md` §10", text)

    def test_the_reviewer_can_call_a_restatement_a_defect(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("uses the explanation rather than restating it", text)
        self.assertIn("what a child had to work out that the Teach did not already say", text)
        self.assertIn("`" + RULE + "`", text)

    def test_the_reviewer_preserves_a_deliberate_restatement(self) -> None:
        """Securing exact wording is sometimes the intended check. The rule
        must not fire on a design that says so."""
        text = flat(DESIGN_REVIEWER)
        self.assertIn("Preserve a restatement that is genuinely the intended check", text)

    def test_the_routing_card_opens_the_rhythm_for_a_restating_do(self) -> None:
        routes = dict(packet.PREFERENCE_REVIEW_ROUTES)
        trigger = routes[RHYTHM]
        self.assertIn(
            "when a Do beat's expected answer is a summary, headline, recap or "
            "restatement of the explanation its own Teach just gave",
            trigger,
        )

    def test_the_trigger_is_visible_before_the_judgement_is_made(self) -> None:
        """The file's own warning: a trigger the reviewer can only apply after
        finding the fault never fires. The expected answer is on the face of
        the view, so this one does."""
        routes = dict(packet.PREFERENCE_REVIEW_ROUTES)
        trigger = routes[RHYTHM]
        self.assertIn("expected answer", trigger)


class ProblemFirstIsNarrowedNotBannedTests(unittest.TestCase):
    """The productive-failure evidence does not support a blanket ban, and the
    plugin's own Discovery route and flawed-example input already permit a
    designed problem-first opening. The Avoid line used to forbid both."""

    def test_the_ban_names_the_unstructured_version_only(self) -> None:
        text = flat(ROOT / "references" / "evidence-synthesis.md")
        self.assertIn("no designed problem, no bounded outcome and no explanation afterwards", text)

    def test_the_designed_version_is_explicitly_permitted(self) -> None:
        text = flat(ROOT / "references" / "evidence-synthesis.md")
        self.assertIn("a deliberately chosen problem-first opening", text)
        self.assertIn("prepare children for the explanation rather than to make them discover it", text)

    def test_modelling_first_remains_the_default(self) -> None:
        text = flat(ROOT / "references" / "evidence-synthesis.md")
        self.assertIn("the default here stays modelling first", text)
        self.assertIn("few of those studies were younger primary", text)


class AVocabularyDefinitionGetsATestedBoundaryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.vocab = section(PREFERENCES, "Vocabulary")

    def test_the_boundary_decision_follows_the_definition(self) -> None:
        self.assertIn("one quick decision at its boundary", self.vocab)

    def test_it_is_bounded_so_it_does_not_become_its_own_beat(self) -> None:
        self.assertIn("a few seconds inside the introduction rather than a beat of its own", self.vocab)
        self.assertIn("has no interesting edge", self.vocab)

    def test_the_word_comes_back_once_the_definition_has_gone(self) -> None:
        self.assertIn("once the definition has left the screen", self.vocab)


class TheCheckEarnsANextMoveTests(unittest.TestCase):
    """A check that cannot change the teaching is not formative. The house
    position that the live teacher owns the response routine is preserved; what
    the design now owes is the reading of the likely answers."""

    def setUp(self) -> None:
        self.text = flat(ROOT / "references" / "evidence-synthesis.md")

    def test_a_gating_check_names_what_the_wrong_answers_mean(self) -> None:
        self.assertIn("say what the likely wrong answers mean and name the move that answers each", self.text)

    def test_the_common_patterns_get_different_moves(self) -> None:
        for move in (
            "a shared misconception wants the point re-explained on a changed example",
            "a class split between two conceptions wants the two compared openly",
            "right answers with weak reasons want the explanation asked for",
        ):
            with self.subTest(move=move):
                self.assertIn(move, self.text)

    def test_the_teachers_ownership_of_the_routine_survives(self) -> None:
        self.assertIn("This is not a response routine and does not become one", self.text)
        self.assertIn("stays theirs", self.text)


class LearningOutlastsTheLessonTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(ROOT / "references" / "evidence-synthesis.md")

    def test_end_of_lesson_success_is_not_treated_as_learning(self) -> None:
        self.assertIn("Succeeding at the end of a lesson is not the same as having learned it", self.text)

    def test_naming_what_comes_back_is_separated_from_inventing_a_next_lesson(self) -> None:
        self.assertIn("Naming what has to come back is not the same as inventing a next lesson", self.text)
        self.assertIn("without claiming when, how the class did, or what needs reteaching", self.text)

    def test_the_guard_against_invented_results_survives(self) -> None:
        self.assertIn("do not invent class results, apply a fixed threshold or prescribe tomorrow's lesson", self.text)

    def test_an_immediate_recall_beat_is_not_sold_as_durable_retrieval(self) -> None:
        do_beats = flat(DO_BEATS)
        self.assertIn("A beat thirty seconds after the answer was given is not that", do_beats)
        self.assertIn("makes every child produce the thing rather than hear it", do_beats)


class PracticeChangesSomethingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(ROOT / "references" / "evidence-synthesis.md")

    def test_a_repetition_has_to_earn_its_minutes(self) -> None:
        self.assertIn("A repetition earns its place by changing something", self.text)

    def test_the_criterion_is_named_not_gestured_at(self) -> None:
        for change in (
            "builds fluency",
            "forces a discrimination",
            "removes a piece of support",
            "reaches a new case",
        ):
            with self.subTest(change=change):
                self.assertIn(change, self.text)

    def test_it_reaches_content_lessons_not_only_maths(self) -> None:
        self.assertIn("This holds in content lessons as much as in maths", self.text)


class TalkAndMaterialsServeTheThinkingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(PREFERENCES)

    def test_each_child_settles_an_answer_before_the_pair_when_it_is_the_evidence(self) -> None:
        self.assertIn("give them a moment to settle their own answer before they talk", self.text)
        self.assertIn("tells you one of them thought and not which one", self.text)

    def test_talk_that_generates_is_not_slowed_down_by_the_rule(self) -> None:
        self.assertIn("straight into the pair is right", self.text)

    def test_a_manipulative_is_connected_to_the_idea(self) -> None:
        self.assertIn("A manipulative earns its place by being connected to the idea", self.text)
        self.assertIn("say what each object and each action stands for", self.text)

    def test_the_object_is_planned_to_leave(self) -> None:
        self.assertIn("the point of the concrete stage is a child who can work without it", self.text)

    def test_a_word_gets_the_investment_its_job_needs(self) -> None:
        self.assertIn("How much a word is worth depends on the job it does today", self.text)
        self.assertIn("the commonest waste is the same middling treatment given to both", self.text)

    def test_a_card_set_is_not_sold_as_vocabulary_growth(self) -> None:
        self.assertIn("does not by itself widen a child's vocabulary", self.text)


class TheSpineIsRecordedNotOnlyJudgedTests(unittest.TestCase):
    def test_preferences_points_the_principle_at_the_field(self) -> None:
        self.assertIn("Each beat records this in its own `unlocks` line", flat(PREFERENCES))

    def test_the_designer_is_told_to_write_it_forward(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("Write each beat's `unlocks` by looking forward, not back", text)
        self.assertIn("a line you cannot write forward is a beat whose place in the lesson has not been decided", text)

    def test_null_stays_a_real_answer_so_chains_are_not_manufactured(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("never given a manufactured artefact so that a later one has something to name", text)

    def test_the_reviewer_reads_the_recorded_line_against_the_next_beat(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("read the recorded line against the beat that follows", text)
        self.assertIn("a line describing the activity", text)

    def test_the_template_gives_the_field_a_contract(self) -> None:
        text = flat(ROOT / "references" / "output-template.md")
        self.assertIn("`unlocks` is one short line naming what children can now do", text)
        self.assertIn("At least one teaching-sequence unit must be non-null", text)


class TheValidatorEnforcesTheFieldTests(unittest.TestCase):
    def setUp(self) -> None:
        self.validator = load("validate_lesson_design_unlocks", "validate-lesson-design.py")

    def test_unlocks_is_a_required_envelope_field(self) -> None:
        self.assertIn("unlocks", self.validator.UNIT_FIELDS)

    def test_the_line_is_capped_so_it_stays_a_link_not_a_summary(self) -> None:
        self.assertEqual(self.validator.UNLOCKS_MAX_CHARS, 200)


class TheEnforcementActuallyRefusesTests(unittest.TestCase):
    """A guarantee is only established at its enforcement point: can a
    violating design still pass? These run the real validator."""

    def setUp(self) -> None:
        contract = load("lesson_design_contract_fixture", "tests/test_lesson_design_contract.py")
        self.contract = contract
        self.validator = contract.module

    def refused(self, mutate, expected):
        design, photos = self.contract.valid_contract()
        mutate(design)
        with self.assertRaises(self.validator.ContractError) as caught:
            self.validator.validate_design(design, photos)
        self.assertIn(expected, str(caught.exception))

    def test_the_baseline_fixture_is_valid(self) -> None:
        design, photos = self.contract.valid_contract()
        self.validator.validate_design(design, photos)

    def test_a_sequence_with_no_spine_at_all_is_refused(self) -> None:
        def mutate(design):
            for unit in design["teachingSequence"]:
                unit["unlocks"] = None
        self.refused(mutate, "has no dependency in it")

    def test_a_missing_field_is_refused_rather_than_defaulted(self) -> None:
        self.refused(lambda d: d["teachingSequence"][0].pop("unlocks"), "unlocks")

    def test_a_blank_line_does_not_pass_as_an_answer(self) -> None:
        """A beat with nothing to record uses null, not an empty string."""
        self.refused(
            lambda d: d["teachingSequence"][0].__setitem__("unlocks", "   "),
            "unlocks must not be empty",
        )

    def test_a_paragraph_is_refused_so_the_line_stays_a_link(self) -> None:
        self.refused(
            lambda d: d["teachingSequence"][0].__setitem__("unlocks", "x" * 201),
            "at most 200 characters",
        )

    def test_the_reviewer_view_prints_the_line_including_when_it_is_missing(self) -> None:
        """The reviewer is told to read the recorded line. A field that only
        renders when filled would hide the case it is meant to catch."""
        design, _ = self.contract.valid_contract()
        unit = design["teachingSequence"][0]
        unit["conceptRef"] = None
        concepts: dict = {}
        filled: list[str] = []
        packet.append_review_unit(filled, unit, concepts=concepts)
        self.assertTrue(any(line.startswith("- Unlocks: ") for line in filled))
        unit["unlocks"] = None
        empty: list[str] = []
        packet.append_review_unit(empty, unit, concepts=concepts)
        self.assertIn("- Unlocks: none recorded", empty)

    def test_one_recorded_link_is_enough_for_the_floor(self) -> None:
        """Discrimination: the floor must not demand a filled field on every
        beat, or it manufactures chains."""
        design, photos = self.contract.valid_contract()
        for index, unit in enumerate(design["teachingSequence"]):
            unit["unlocks"] = None if index else "They can partition, which the adding step needs."
        self.validator.validate_design(design, photos)


if __name__ == "__main__":
    unittest.main()
