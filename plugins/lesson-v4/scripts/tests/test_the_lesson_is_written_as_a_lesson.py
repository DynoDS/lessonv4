"""The lesson is written as a lesson before it is written as a contract.

Daniel compared the plugin's decks with lessons an assistant wrote for him from
the same objectives, knowing only his voice guide (11 September 2026). Those
lessons had a journey, a why for each slide and an amount the board could
hold; the plugin's had the same pedagogy in their design files and none of it
on the board. Traced across 34 built lessons, the story was lost four ways,
all downstream of a design that mostly had one: a vocabulary slide at each
point of need broke the deck's story and defined the teeth before the class
had looked at them; each Teach slide said its one sentence three ways
(headline, explanation, star line); the slide stage renamed the design's
move-shaped headings into slot names; and no surface anyone read said why a
slide was there. Underneath all four, the planner never wrote the lesson as a
lesson, so nothing made it read as one and nobody checked that it did.

These tests pin the repair at each owner: the planner writes a walk-through
first, the reviewer reads it first, the teacher receives it, one vocabulary
slide, one landed sentence per Teach slide, and the design's label is the
slide's title.
"""
from __future__ import annotations

import copy
import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DESIGNER = ROOT / "agents" / "lesson-designer.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"
SLIDE_DESIGNER = ROOT / "agents" / "slide-designer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
CONTENT_ROUTE = ROOT / "references" / "teaching-sequence-content-based.md"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
COMPOSITION = ROOT / "references" / "slide-composition-playbook.md"
SCAFFOLD_DOC = ROOT / "references" / "lesson-design-scaffold.md"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"

CONTRACT_TESTS = Path(__file__).with_name("test_lesson_design_contract.py")
SPEC = importlib.util.spec_from_file_location("contract_tests_lesson", CONTRACT_TESTS)
assert SPEC is not None and SPEC.loader is not None
contract = importlib.util.module_from_spec(SPEC)
sys.modules["contract_tests_lesson"] = contract
SPEC.loader.exec_module(contract)

module = contract.module
valid_content_contract = contract.valid_content_contract
assert_invalid_contract = contract.assert_invalid_contract


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ThePlannerWritesTheLessonFirst(unittest.TestCase):
    def test_the_walk_through_is_the_first_artefact_and_has_its_shape(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("a walk-through a teacher could teach from", designer)
        # The journey is written before the slides, and tested against the route.
        self.assertIn("The journey, in one line", designer)
        self.assertIn("it is the route, not this lesson's journey", designer)
        # Every slide carries what a teacher reads, in the order they read it.
        self.assertIn("never the slot", designer)
        self.assertIn("on the board: exactly what is there", designer)
        self.assertIn("why it is here", designer)
        # Writing the board is where the amount is judged, not a number.
        self.assertIn("Writing the board out is the amount check", designer)

    def test_the_walk_through_has_a_slot_for_the_thought_and_the_orientation(self) -> None:
        """The first trial run (Shaftesbury, 11 September 2026) found both
        holes: the designer had settled a `thinking` line for every beat and
        the walk-through had nowhere to put it, so it was folded into what the
        teacher listens for, which is a different thing and after the work
        rather than during it; and a teacher opening the walk-through met
        slide 1 with no paragraph saying what the lesson was."""
        designer = flat(DESIGNER)
        self.assertIn("the thought: the question a child's mind is answering while they work", designer)
        # Written before the activity, as 4.2.123 requires, and not confused
        # with the look-for line.
        self.assertIn("it is written before the next bullet", designer)
        self.assertIn("It is not what you are listening for", designer)
        # The orientation is one paragraph in two places, not a second write-up.
        self.assertIn("Then the orientation", designer)
        self.assertIn("write it once and use it in both places", designer)

    def test_the_walk_through_order_puts_the_thought_before_the_activity(self) -> None:
        text = DESIGNER.read_text(encoding="utf-8")
        section = text.split("**Then each slide, in order.**", 1)[1].split("**Then the read-back", 1)[0]
        self.assertLess(section.index("- the thought:"), section.index("- what happens:"))

    def test_the_read_back_and_the_closing_decisions_survive(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("Then the read-back", designer)
        self.assertIn("By the end, children will", designer)
        self.assertIn("Then the decisions the walk-through does not show", designer)
        # The walk-through and the contract are held together, not written twice.
        self.assertIn("Walk-through to sequence", designer)

    def test_the_old_shape_is_gone(self) -> None:
        designer = flat(DESIGNER)
        self.assertNotIn("compact semantic quality lock", designer)
        self.assertNotIn("not to write a second account of the same lesson", designer)


class TheReviewerReadsTheLessonFirst(unittest.TestCase):
    def test_the_walk_through_is_read_before_the_view(self) -> None:
        reviewer = REVIEWER.read_text(encoding="utf-8")
        walk = reviewer.index("Read the walk-through that opens `[WORKING_DIR]/design-decisions.md`")
        view = reviewer.index("Read `[WORKING_DIR]/design-review-view.md` once, straight through")
        self.assertLess(walk, view)

    def test_the_designers_reasons_still_wait_for_the_drift_check(self) -> None:
        reviewer = flat(REVIEWER)
        self.assertIn("leave those until the drift check", reviewer)
        self.assertIn("Read the closing decisions of `design-decisions.md` only for the final decision-drift check", reviewer)
        self.assertNotIn("keep `design-decisions.md` closed", reviewer)

    def test_a_walk_through_that_is_not_a_lesson_is_a_finding(self) -> None:
        reviewer = flat(REVIEWER)
        self.assertIn("a list of reasons for activities rather than a lesson is itself a finding", reviewer)
        self.assertIn("where it and the walk-through disagree", reviewer)


class TheTeacherReceivesTheLesson(unittest.TestCase):
    def test_the_walk_through_goes_where_the_deck_goes(self) -> None:
        playbook = flat(PLAYBOOK)
        self.assertIn("walk-through.md", playbook)
        self.assertIn("what the teacher reads to see where the lesson is going", playbook)


class VocabularyArrivesWhenItIsNeeded(unittest.TestCase):
    """4.2.138 collapsed vocabulary to one slide on my reading of Daniel's
    30 August position. That position was against a run of single-word slides
    at the open, which is a different thing, and he corrected it the same day:
    "I like it when lesson designer decides which slides it is before, so vocab
    is taught when children need it, not at start and have to wait ages before
    they need it, even if it splits vocab up." Reverted in 4.2.143. What
    survives from the teeth deck is the genuine finding, which is about
    placement rather than count."""

    def test_the_designer_decides_how_many_and_where(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("Introduce each word where it is most useful", preferences)
        self.assertIn("let the lesson carry as many introductions as it genuinely needs", preferences)
        self.assertIn("one entry per introduction, in the order they happen", preferences)
        self.assertIn("one `key-vocabulary` slide per entry", flat(SLIDE_DESIGNER))

    def test_both_ways_of_getting_it_wrong_are_still_named(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("putting them all at the top because that is where they went last time", preferences)
        self.assertIn("splitting a set into one word per slide to look thorough", preferences)

    def test_a_card_may_not_answer_the_next_beats_question(self) -> None:
        """The teeth deck asked what was different about two teeth's biting
        edges, then defined incisors on the very next slide."""
        preferences = flat(PREFERENCES)
        self.assertIn("a card must not answer the question the very next beat is about to ask", preferences)
        self.assertIn("Read each introduction against the beat that follows it", preferences)
        self.assertIn("read each introduction against the beat that follows it", flat(DESIGNER).lower())


class TheDesignsLabelIsTheTitle(unittest.TestCase):
    def test_the_headings_rule_no_longer_hands_out_slot_names(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn("The design's label is the slide's title", preferences)
        # The warm titles survive only as the fallback for an internal label.
        self.assertIn("are for that case alone", preferences)
        self.assertNotIn('can be titled "Your Practice"', preferences)
        # The skim test is still the check.
        self.assertIn("Read the titles alone, in order: they should tell the lesson's story", preferences)

    def test_the_slide_designer_keeps_a_label_that_names_the_move(self) -> None:
        self.assertIn("The source unit's label is the title unless it is an internal slot name", flat(SLIDE_DESIGNER))


class ATeachSlideLandsItsSentenceOnce(unittest.TestCase):
    def test_the_rule_is_at_both_owners(self) -> None:
        self.assertIn("It carries it once.", flat(PREFERENCES))
        self.assertIn("and it carries it once", flat(CONTENT_ROUTE))
        self.assertIn("A Teach slide lands its sentence once", flat(OUTPUT_TEMPLATE))
        # The explanation's job is stated as what the board cannot show, with
        # both ends of the limit named: the pride lessons' bare slide, and the
        # PSHE slide that left what pass means in the script.
        self.assertIn("which is the shape of the pride lessons", flat(CONTENT_ROUTE))
        self.assertIn("Use lines for a rule that cannot show its reason", flat(CONTENT_ROUTE))


# -- the validator holds the mechanical half ----------------------------------


def first_teach(design):
    for unit in design["teachingSequence"]:
        if unit["kind"] == "teach":
            return unit
    raise AssertionError("the content fixture has no Teach unit")


def test_a_null_takeaway_is_the_ordinary_teach_slide():
    design, photos = valid_content_contract()
    teach = first_teach(design)
    teach["content"]["takeaway"] = None
    module.validate_design(design, photos)


def test_a_text_takeaway_that_repeats_the_headline_is_refused():
    design, photos = valid_content_contract()
    teach = first_teach(design)
    teach["content"]["headline"] = "Incisors cut; canines help tear."
    teach["content"]["explanation"] = None
    teach["content"]["takeaway"] = {"kind": "text", "text": "Incisors cut food and canines help tear food."}
    assert_invalid_contract(design, photos, "lands its sentence once")


def test_a_sticky_takeaway_that_repeats_the_headline_is_refused():
    design, photos = valid_content_contract()
    teach = first_teach(design)
    sticky = design["stickyKnowledge"][0]
    sticky["text"] = "Incisors cut food and canines help tear food."
    teach["content"]["headline"] = "Incisors cut; canines help tear."
    teach["content"]["explanation"] = None
    teach["content"]["takeaway"] = {"kind": "sticky", "ref": sticky["id"]}
    if sticky["id"] not in teach["stickyKnowledgeRefs"]:
        teach["stickyKnowledgeRefs"] = list(teach["stickyKnowledgeRefs"]) + [sticky["id"]]
    assert_invalid_contract(design, photos, "lands its sentence once")


def test_an_explanation_sentence_that_repeats_the_sticky_fact_is_refused():
    # The RE nativity slide: the explanation's first line was the sticky fact
    # in other words, and both were on the board with the headline.
    design, photos = valid_content_contract()
    teach = first_teach(design)
    sticky = design["stickyKnowledge"][0]
    sticky["text"] = "At Christmas, Christians celebrate Jesus' birth. They believe he is God's Son."
    teach["content"]["headline"] = "A nativity scene tells the Christmas story."
    teach["content"]["explanation"] = "Christians believe Jesus is God's Son.\nFor them, his birth shows God's love for people."
    teach["content"]["takeaway"] = {"kind": "sticky", "ref": sticky["id"]}
    if sticky["id"] not in teach["stickyKnowledgeRefs"]:
        teach["stickyKnowledgeRefs"] = list(teach["stickyKnowledgeRefs"]) + [sticky["id"]]
    assert_invalid_contract(design, photos, "lands its sentence once")


def test_a_headline_that_names_the_thing_beside_a_sticky_fact_is_allowed():
    # Naming the thing on the board and landing the fact are two jobs.
    design, photos = valid_content_contract()
    teach = first_teach(design)
    sticky = design["stickyKnowledge"][0]
    sticky["text"] = "At Christmas, Christians celebrate Jesus' birth. They believe he is God's Son."
    teach["content"]["headline"] = "A nativity scene tells the Christmas story."
    teach["content"]["explanation"] = None
    teach["content"]["takeaway"] = {"kind": "sticky", "ref": sticky["id"]}
    if sticky["id"] not in teach["stickyKnowledgeRefs"]:
        teach["stickyKnowledgeRefs"] = list(teach["stickyKnowledgeRefs"]) + [sticky["id"]]
    module.validate_design(design, photos)


def test_an_explanation_that_adds_what_the_board_cannot_show_is_allowed():
    design, photos = valid_content_contract()
    teach = first_teach(design)
    teach["content"]["headline"] = "In PSHE, you can choose to pass."
    teach["content"]["explanation"] = (
        "Sometimes you don't want to answer a question or share something personal.\n"
        "You can say \"I'd like to pass.\" You don't have to explain why."
    )
    teach["content"]["takeaway"] = None
    module.validate_design(design, photos)


def test_a_short_line_beside_a_fuller_one_is_not_a_repeat():
    # Three content words is below the floor: `The baby represents Jesus.`
    # beside a fuller sentence about Jesus is a caption, not a copy.
    design, photos = valid_content_contract()
    teach = first_teach(design)
    teach["content"]["headline"] = "Christians believe Jesus is God's Son, so his birth matters to them."
    teach["content"]["explanation"] = "The baby represents Jesus."
    teach["content"]["takeaway"] = None
    module.validate_design(design, photos)


def test_the_check_does_not_touch_other_units():
    design, photos = valid_content_contract()
    original = copy.deepcopy(design)
    module.validate_design(design, photos)
    assert design == original
