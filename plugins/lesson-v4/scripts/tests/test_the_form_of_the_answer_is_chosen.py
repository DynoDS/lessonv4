"""What the child DOES to answer is a choice, made when the question is written.

Daniel, 12 September 2026, on the sheets the plugin had been building: "there's
mainly always text and children write on line instead of - label a diagram -
draw arrows / connect pairs - sort cards into boxes - circle / tick / cross -
complete part of a table - highlight evidence - annotate a picture - sequence
items - complete a model - correct something directly on an example - draw or
construct an answer ... And then use answer lines only where explaining
something in words is genuinely the best task."

Counted before anything was written. Eleven worksheet specs built between 5 and
12 September were read by what they actually draw. Ruled writing lines and a
plain printed instruction were the two commonest elements on every one of them;
label-a-diagram, match-up, sort-grid, sequencing and correct-an-example appeared
zero times across all eleven. The worksheet engine draws every one of those.

The cause was upstream of the page. `response` was free text, so a lesson or
adaptation designer writing "two handwriting lines" had already settled the
form, and the worksheet designer is required not to change a settled response.
The clearest casualty: a Year 4 sheet whose objective was *name the layers of
teeth* asked for three names on three ruled lines, under a labelled diagram that
the sheet never let a child write on, with half the page empty. Its final review
passed it.

So the form is now a named choice from a fixed vocabulary, enforced where it is
made rather than described where it is realised, and `written-explanation` is
the one value that has to say what the words evidence.
"""
from __future__ import annotations

import copy
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VALIDATOR = ROOT / "scripts" / "validate-lesson-design.py"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
COMPONENTS = ROOT / "references" / "lesson-designer-components.md"
SHARED_HELPERS = ROOT / "references" / "worksheet-helpers" / "shared.md"
ADAPTATION_DESIGNER = ROOT / "agents" / "adaptation-designer.md"
WORKSHEET_DESIGNER = ROOT / "agents" / "worksheet-designer.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"

spec = importlib.util.spec_from_file_location("validate_lesson_design", VALIDATOR)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

contract = importlib.util.spec_from_file_location(
    "contract_fixtures", Path(__file__).with_name("test_lesson_design_contract.py")
)
assert contract and contract.loader
fixtures = importlib.util.module_from_spec(contract)
contract.loader.exec_module(fixtures)

FORMS = module.WORKSHEET_RESPONSE_FORMS


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class TheVocabularyIsTheOneDanielNamedTests(unittest.TestCase):
    """Every action on his list has somewhere to go, or the field just renames
    the old default."""

    def test_each_action_he_named_has_a_value(self):
        for value in (
            "label-the-visual",
            "mark-on-a-visual",
            "match-or-join",
            "sort-into-groups",
            "put-in-order",
            "choose-from-options",
            "complete-the-table",
            "complete-the-model",
            "correct-the-example",
            "draw-or-construct",
            "complete-the-sentence",
            "short-answer",
            "written-explanation",
        ):
            self.assertIn(value, FORMS)

    def test_the_contract_documents_every_value_the_validator_accepts(self):
        template = flat(OUTPUT_TEMPLATE)
        for value in FORMS:
            self.assertIn(f"`{value}`", template, f"{value} is enforced but undocumented")

    def test_every_value_names_the_helpers_that_draw_it(self):
        # A form nobody can render is a form the page quietly substitutes for.
        helpers = flat(SHARED_HELPERS)
        for value in FORMS:
            self.assertIn(f"`{value}`", helpers, f"{value} has no helper route")


class TheValidatorEnforcesTheChoiceTests(unittest.TestCase):
    def setUp(self):
        self.design, self.photos = fixtures.valid_contract()
        self.block = self.design["worksheet"]["contentBlocks"][0]

    def validate(self):
        module.validate_design(copy.deepcopy(self.design), copy.deepcopy(self.photos))

    def test_the_baseline_fixture_is_valid(self):
        self.validate()

    def test_a_question_with_no_form_is_refused(self):
        del self.block["responseForm"]
        del self.block["responseFormReason"]
        with self.assertRaises(module.ContractError):
            self.validate()

    def test_an_invented_form_is_refused_and_the_message_lists_the_real_ones(self):
        self.block["responseForm"] = "handwriting-lines"
        with self.assertRaises(module.ContractError) as caught:
            self.validate()
        message = str(caught.exception)
        self.assertIn("responseForm invalid: handwriting-lines", message)
        self.assertIn("label-the-visual", message)

    def test_written_explanation_without_its_reason_is_refused(self):
        self.block["responseForm"] = "written-explanation"
        self.block["responseFormReason"] = None
        with self.assertRaises(module.ContractError):
            self.validate()

    def test_written_explanation_with_its_reason_is_accepted(self):
        self.block["responseForm"] = "written-explanation"
        self.block["responseFormReason"] = (
            "The reasoning is the evidence; a tick would not show whether the "
            "child partitioned or guessed."
        )
        self.validate()

    def test_a_reason_on_a_form_that_does_not_need_one_is_refused(self):
        # Otherwise it becomes a general commentary field and stops meaning
        # "I considered the alternatives to writing".
        self.block["responseForm"] = "complete-the-model"
        self.block["responseFormReason"] = "Because the model is clearer."
        with self.assertRaises(module.ContractError):
            self.validate()


class TheRuleReachesEveryQuestionCarryingBlockTests(unittest.TestCase):
    """A group's parts and a stimulus set's prompts are questions a child
    answers, so a form settled only on plain question blocks would leave the
    history and PSHE sheets - which are stimulus sets - exactly as they were."""

    def test_a_question_group_part_needs_its_form(self):
        design, photos = fixtures.valid_contract()
        design["worksheet"]["sheetShape"] = {
            "kind": "question-set",
            "reason": "Two closely connected parts of one job.",
        }
        part = {
            "id": "ws-qg-001-part-01",
            "pupilPrompt": "Round 5,834 to the nearest 10.",
            "responseForm": "mark-on-a-visual",
            "responseFormReason": None,
            "response": "Mark the number on the printed line.",
            "support": "",
            "visualRequirements": "",
            "representationRefs": [],
            "stickyKnowledgeRefs": [],
            "photoRefs": [],
            "answer": fixtures.exact_answer("5,830", "teacher-only"),
        }
        second = copy.deepcopy(part)
        second["id"] = "ws-qg-001-part-02"
        second["pupilPrompt"] = "Round 8,995 to the nearest 10."
        second["answer"] = fixtures.exact_answer("9,000", "teacher-only")
        design["worksheet"]["contentBlocks"] = [
            {
                "id": "ws-qg-001",
                "kind": "question-group",
                "groupPrompt": "Round to the nearest 10.",
                "representationRefs": [],
                "stickyKnowledgeRefs": [],
                "photoRefs": [],
                "parts": [part, second],
            }
        ]
        module.validate_design(copy.deepcopy(design), copy.deepcopy(photos))

        del design["worksheet"]["contentBlocks"][0]["parts"][1]["responseForm"]
        del design["worksheet"]["contentBlocks"][0]["parts"][1]["responseFormReason"]
        with self.assertRaises(module.ContractError):
            module.validate_design(design, photos)

    def test_a_stimulus_set_prompt_needs_its_form(self):
        design, photos = fixtures.valid_contract()
        design["worksheet"]["sheetShape"] = {
            "kind": "stimulus-set",
            "reason": "The prompts work from one shared source.",
        }
        design["worksheet"]["contentBlocks"] = [
            {
                "id": "ws-stimulus-001",
                "kind": "stimulus-set",
                "stimulus": "Source A: a pewter toy plate.",
                "relationship": "Children compare the two toys.",
                "pupilAction": "Use both sources.",
                "representationRefs": [],
                "stickyKnowledgeRefs": [],
                "photoRefs": [],
                "prompts": [
                    {
                        "id": "ws-stimulus-001-prompt-01",
                        "pupilPrompt": "Which parts of play stayed the same?",
                        "responseForm": "sort-into-groups",
                        "responseFormReason": None,
                        "response": "Place each card under Stayed the same or Changed.",
                        "support": "",
                        "visualRequirements": "",
                        "representationRefs": [],
                        "stickyKnowledgeRefs": [],
                        "photoRefs": [],
                        "answer": fixtures.exact_answer(
                            "Stayed the same: pretend meals.", "teacher-only"
                        ),
                    }
                ],
            }
        ]
        module.validate_design(copy.deepcopy(design), copy.deepcopy(photos))

        design["worksheet"]["contentBlocks"][0]["prompts"][0]["responseForm"] = "tick-box"
        with self.assertRaises(module.ContractError):
            module.validate_design(design, photos)


class TheRuleStopsWhereTheFormIsAlreadySettledTests(unittest.TestCase):
    """Discrimination. A frame's sections and a generated task's recording
    surface ARE the form, so demanding a second name for it would be asking the
    same question twice and would refuse two legitimate sheet shapes."""

    def test_a_frame_block_needs_no_response_form(self):
        design, photos = fixtures.valid_contract()
        design["worksheet"]["sheetShape"] = {
            "kind": "frame",
            "reason": "The class watched the teacher fill this frame.",
        }
        design["worksheet"]["contentBlocks"] = [
            {
                "id": "ws-frame-001",
                "kind": "frame",
                "representationRefs": [],
                "stickyKnowledgeRefs": [],
                "photoRefs": [],
                "sections": [
                    {
                        "heading": "What I noticed",
                        "whatGoesHere": "One thing you saw change.",
                        "noteSpace": "Two lines.",
                    }
                ],
                "answer": fixtures.no_answer(),
            }
        ]
        design["worksheet"]["answerKeyMode"] = "not-applicable"
        module.validate_design(design, photos)

    def test_a_child_generated_block_needs_no_response_form(self):
        design, photos = fixtures.valid_contract()
        design["worksheet"]["sheetShape"] = {
            "kind": "child-generated",
            "reason": "Children supply their own numbers.",
        }
        design["worksheet"]["contentBlocks"] = [
            {
                "id": "ws-generated-001",
                "kind": "child-generated",
                "generator": "Write a four-digit number where 10 more changes the hundreds digit.",
                "recordingSurface": "A table with My number and 10 more.",
                "firstRowWorked": "3,496 and 3,506.",
                "representationRefs": [],
                "stickyKnowledgeRefs": [],
                "photoRefs": [],
                "answer": fixtures.no_answer(),
            }
        ]
        design["worksheet"]["answerKeyMode"] = "not-applicable"
        module.validate_design(design, photos)


class TheGuidanceCarriesTheJudgementTests(unittest.TestCase):
    """The validator can only check that a value was chosen. Whether it is the
    RIGHT value is judgement, so each agent that touches the form has to be told
    what it is for and where it stops."""

    def test_the_designer_chooses_it_as_the_question_is_written(self):
        components = flat(COMPONENTS)
        self.assertIn(
            "**Name what the child does with their pencil, question by question, "
            "in `responseForm`.**",
            components,
        )
        # The reason, or it reads as one more field to fill.
        self.assertIn(
            "the action is part of the question and the space is a consequence of it",
            components,
        )

    def test_the_designer_is_shown_the_count_that_caused_it(self):
        components = flat(COMPONENTS)
        self.assertIn("Eleven sheets built between 5 and 12 September 2026", components)
        self.assertIn("name the layers of teeth", components)

    def test_the_designer_is_given_the_boundary_in_both_directions(self):
        components = flat(COMPONENTS)
        # Words are sometimes right...
        self.assertIn(
            "`written-explanation` is the right answer and not a failure", components
        )
        # ...and variety for its own sake is the opposite failure.
        self.assertIn("has swapped one wrong default for a livelier one", components)

    def test_the_adaptation_designer_writes_the_form_per_item(self):
        adaptation = flat(ADAPTATION_DESIGNER)
        self.assertIn("`Response form:`", adaptation)
        # Both templates, Below and Greater Depth.
        self.assertEqual(
            adaptation.count("- Response form: [one `output-template.md` responseForm value"),
            2,
        )

    def test_the_adaptation_designer_knows_the_tier_does_not_decide_it_alone(self):
        adaptation = flat(ADAPTATION_DESIGNER)
        self.assertIn(
            "a child whose barrier is the subject needs the question to change "
            "while the form stays as the class's",
            adaptation,
        )

    def test_the_worksheet_designer_realises_the_form_rather_than_re_picking_it(self):
        designer = flat(WORKSHEET_DESIGNER)
        self.assertIn("**`responseForm` is a settled decision, like the question's words.**", designer)
        self.assertIn("WORKSHEET_CONTENT_GAP", designer)

    def test_the_reviewer_reads_the_forms_against_the_objective(self):
        reviewer = flat(REVIEWER)
        self.assertIn(
            "**the response forms fit the objective, read across the whole sheet.**",
            reviewer,
        )
        # The specific shape that passed review, named so it cannot pass again.
        self.assertIn(
            "A sheet whose questions are all `written-explanation` and "
            "`short-answer` is the shape this check exists to catch",
            reviewer,
        )
        # And the opposite error, so the check does not simply demand variety.
        self.assertIn(
            "forms rotated for variety across an objective none of them fit", reviewer
        )


if __name__ == "__main__":
    unittest.main()
