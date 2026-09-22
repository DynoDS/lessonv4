"""A lesson builds on what children can actually use, and says honestly what each task shows.

The follow-on to the September 2026 Lesson Designer work (16 September 2026).
After the Tudor lesson, the teacher approved a short sequence in which children
learn the apprenticeship arrangement, rebuild it, use it on a case missing its
training, and reconsider it for a family that already had money: "a story like
structure, with do beats, that also built on top of each other". The same
conversation showed two opposite failures: tasks that looked varied but could
be answered from everyday sense, and tasks made to look historical by adding
untaught, unverified rules.

The repair lives in the existing owners rather than in new fields:

- `preferences.md` → What a Lesson Is For says what children can work with at a
  given point (new evidence allowed, new mechanisms not smuggled in);
- the rhythm section chooses material and thinking together before the response
  form, names each subject's kinds of material as examples, reads a link in the
  content with a correctness handover, and says what each kind of work can claim;
- `do-beats.md` carries an optional operations table, opened when a beat's
  operation is unclear; the rhythm section names the operations in a line at
  the point the task is chosen, and separates what a task is from how hard it
  is (review, 16 September 2026);
- `task-contrasts.md` adds one short-sequence contrast; the history file and
  the history contrast stop treating "name what is missing" as the thinking;
- the designer and reviewer point at those owners.

These are wiring checks. They prove the words reach the agents and nothing
else; behavioural evidence is in `evaluations/lesson-designer-cumulative-2026-09-16/`.
"""
from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "references"
PREFERENCES = REF / "preferences.md"
DO_BEATS = REF / "do-beats.md"
CONTRASTS = REF / "task-contrasts.md"
HISTORY = REF / "subject-history.md"
DESIGNER = ROOT / "agents" / "lesson-designer.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def read_section(selector: str) -> str:
    # A long section arrives in pages, the way a designer on Codex reads it:
    # every page in turn until the last one reports success.
    pages: list[str] = []
    for page in range(1, 20):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "read-reference.py"), "--select", selector,
             "--page", str(page)],
            capture_output=True, text=True, encoding="utf-8", cwd=str(ROOT),
        )
        assert result.returncode == 0, result.stderr
        pages.append(result.stdout)
        if "REFERENCE_READ_OK" in result.stdout:
            break
        assert "REFERENCE_READ_PARTIAL" in result.stdout, result.stdout
    assert "REFERENCE_READ_OK" in pages[-1], pages[-1]
    return " ".join("".join(pages).split())


class WhatChildrenCanUseTests(unittest.TestCase):
    def test_the_boundary_lives_in_what_a_lesson_is_for(self):
        text = read_section("preferences.md::What a Lesson Is For")
        self.assertIn("**Work from what children can use at that point.**", text)
        self.assertIn("never by writing the missing idea into the answer key", text)

    def test_new_evidence_is_allowed_and_new_mechanisms_are_not_smuggled_in(self):
        text = flat(PREFERENCES)
        self.assertIn("**New evidence is allowed:**", text)
        self.assertIn("this is not an instruction to tell them the answer before every investigation", text)
        self.assertIn("**A new explanatory mechanism is not:**", text)
        self.assertIn("a law, a guild rule, an economic arrangement or a scientific process the lesson never taught", text)

    def test_no_new_contract_field_was_added_for_it(self):
        spec = importlib.util.spec_from_file_location("vld_boundary", ROOT / "scripts" / "validate-lesson-design.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for field in ("knowledgeBoundary", "knowledgeOperation", "learningGain"):
            self.assertNotIn(field, module.UNIT_FIELDS)
            self.assertNotIn(field, flat(ROOT / "references" / "output-template.md"))


class MaterialThinkingAndResponseTests(unittest.TestCase):
    def setUp(self):
        self.rhythm = read_section("preferences.md::The Teach → Do → Teach → Do Rhythm")

    def test_material_and_thinking_are_one_decision_before_the_response_form(self):
        self.assertIn("**Choose the material and the thinking together, then how children respond.**", self.rhythm)
        self.assertIn("choose what they work on and what they have to do with it as one decision", self.rhythm)

    def test_each_subject_names_its_kinds_of_material_as_examples_only(self):
        for phrase in (
            "history may work on sources and accounts",
            "science on apparatus, models and results",
            "geography on maps and spatial information",
            "maths on mathematical objects and working",
            "English on language and texts",
            "RE on attributed accounts and religious material",
            "PSHE on strategies and situations",
            "These are examples, not exclusive routes",
        ):
            self.assertIn(phrase, self.rhythm)

    def test_the_task_is_judged_not_its_label_and_simple_work_stays_legitimate(self):
        self.assertIn("never its operation label", self.rhythm)
        self.assertIn("A quick check, fresh practice of a taught method and a discussion", self.rhythm)
        # The preference that no device is named in the rhythm section still holds.
        self.assertNotIn("whiteboard", self.rhythm)

    def test_a_link_is_read_in_the_content_with_a_correctness_handover(self):
        self.assertIn("**Read a link as four things in the actual content.**", self.rhythm)
        self.assertIn("**When later work builds on what children produced, the class has the right version first.**", self.rhythm)
        self.assertIn("not an answer slide after every beat", self.rhythm)
        self.assertIn("A repeated character, a reused photograph, a more ambitious title", self.rhythm)

    def test_the_claims_table_matches_work_to_what_it_can_show(self):
        self.assertIn("**Claim what the work can show, and no more.**", self.rhythm)
        for row in (
            "Read or point to an answer the board marks",
            "Recall or rebuild a taught arrangement",
            "Apply the arrangement to a fresh case",
            "Explain a consequence, revise a model or make a new instance",
            "Say a short reason aloud",
            "Move, colour, draw or cut",
        ):
            self.assertIn(row, self.rhythm)
        self.assertIn("A Do does not have to produce a new discovery.", self.rhythm)


class TheOptionalOperationsTableTests(unittest.TestCase):
    def test_the_table_is_its_own_optional_section_with_all_eleven_operations(self):
        text = read_section("do-beats.md::Operations to think with (optional)")
        for op in ("Retrieve", "Complete", "Discriminate", "Compare", "Change", "Predict",
                   "Test", "Diagnose", "Repair", "Compose", "Rehearse"):
            self.assertIn(f"| {op} |", text)
        self.assertIn("It is not a taxonomy to fill, a formula for choosing a task, a field to record, or a ladder", text)
        self.assertIn("a later row is not a better row", text)

    def test_the_operations_are_named_where_the_task_is_chosen_and_the_table_stays_conditional(self):
        # The trigger used to be "when the task looks thin", which relied on the
        # designer noticing the weakness the table exists to help it avoid.
        rhythm = " ".join(read_section("preferences.md::The Teach → Do → Teach → Do Rhythm").split())
        self.assertIn("say in a few words what the child does with the material", rhythm)
        self.assertIn("That is what the task is, not how hard it is", rhythm)
        self.assertIn("An operation is not a band", flat(DO_BEATS))
        self.assertNotIn("same choices at two grain sizes", flat(DO_BEATS))
        self.assertIn("when the operation of a beat the lesson relies on is unclear", flat(DESIGNER))


class TheCleanupPassReachesItsOwnersTests(unittest.TestCase):
    """Wiring only, for the bounded cleanup after the Victorian lesson
    (16 September 2026): the words are where the designer and reviewer read
    them. Behaviour is not proven here."""

    def test_history_labels_made_up_children_and_sizes_the_final_claim(self):
        history = flat(HISTORY)
        self.assertIn("**A made-up child is labelled as made up where children read the story.**", history)
        self.assertIn("**The final task claims no more than the evidence children studied.**", history)
        self.assertIn("an answer that generalises from the one story alone claims more than one story can show", flat(PREFERENCES))

    def test_vocabulary_and_worksheet_choices_are_owned(self):
        self.assertIn("Read each definition beside the teaching that uses the term and the success criteria that assess it", flat(DESIGNER))
        self.assertIn("describe the same concept the teaching uses and the success criteria assess", flat(ROOT / "agents" / "design-reviewer.md"))
        self.assertIn("When the sheet asks for essentially the same performance as the slide Practise, choose one", flat(PREFERENCES))
        self.assertIn("A sort done from the board, recorded on whiteboards or in books, prints nothing", flat(DESIGNER))


class ContrastsAndHistoryTests(unittest.TestCase):
    def test_the_contrasts_calibrate_a_short_sequence_with_its_boundary(self):
        text = read_section("task-contrasts.md::The contrasts")
        self.assertIn("### A short sequence: work that builds, and work that only looks connected", text)
        self.assertIn("**Weak, inflated.**", text)
        self.assertIn("the teacher confirms the fault before anyone builds on it", text)
        self.assertIn("Not every beat depends on the one before.", text)

    def test_naming_what_is_missing_is_no_longer_treated_as_the_thinking(self):
        contrasts = flat(CONTRASTS)
        history = flat(HISTORY)
        self.assertIn("Naming the missing training is not the thinking, because the case says it outright", contrasts)
        self.assertIn("Naming what is missing is not yet the history when the case states it outright", history)
        # The tidy single answer and the forced "minded losing most" placement are gone.
        self.assertNotIn("minded losing most", contrasts)
        self.assertNotIn("minded losing most", history)
        self.assertIn("does not make food and a bed worthless", history)
        self.assertIn("has to teach the hardship too", history)


class TheAgentsPointAtTheOwnersTests(unittest.TestCase):
    def test_the_designer_routes_to_the_shared_owners(self):
        text = flat(DESIGNER)
        self.assertIn("`Choose the material and the thinking together`", text)
        self.assertIn("`Work from what children can use at that point`", text)
        self.assertIn("the earlier unit's `answer` or `teacherInfo` gives the teacher the expected version", text)

    def test_the_reviewer_checks_inflation_links_and_handover_in_its_existing_pass(self):
        text = flat(REVIEWER)
        self.assertIn("has been made to look deeper by changing what it requires", text)
        self.assertIn("Read the link in the content, not the line", text)
        self.assertIn("check the correctness handover", text)
        self.assertIn("where the substantial work starts", text)


if __name__ == "__main__":
    unittest.main()
