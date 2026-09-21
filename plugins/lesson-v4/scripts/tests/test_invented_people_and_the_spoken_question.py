from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VOICE = ROOT / "references" / "teacher-voice.md"
PREFERENCES = ROOT / "references" / "preferences.md"
SPEECH = ROOT / "references" / "slide-speech-and-characters.md"
TEMPLATES = ROOT / "references" / "templates.md"
COMPONENTS = ROOT / "references" / "lesson-designer-components.md"
DESIGNER = ROOT / "agents" / "lesson-designer.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class InventedPeopleAreShownTests(unittest.TestCase):
    """A Year 4 RE deck (11 September 2026) put people on slides as words.

    Daniel's reading of the built deck: "A visitor asks" was an abstract
    stand-in for a person nobody ever drew; Nadia and Grace were quoted with
    no faces and no photograph, which "makes it sound like these aren't
    actually people, it's just what teacher wrote down to pretend".

    Three causes, each pinned here. The speech-bubble route was written
    entirely around judging, so a modelling beat where nobody is right or
    wrong never opened it. The visual-need referent test asks whether a slide
    names something that exists in the world, and an invented child answers
    no. And the naming rule was scoped to claims, so a person invented to
    hold a question kept a role noun.
    """

    def test_the_speech_route_covers_more_than_judging(self) -> None:
        speech = flat(SPEECH)
        self.assertIn("gives their reason", speech)
        self.assertIn("asks a question", speech)
        self.assertIn("An invented person is shown, or is not invented", speech)
        # The rule needs its limit, or it puts portraits on real historical figures.
        self.assertIn("not people it reports", speech)

    def test_the_referent_test_names_its_hole(self) -> None:
        preferences = flat(PREFERENCES)
        self.assertIn(
            "A person the lesson invents counts as something in the world",
            preferences,
        )
        # The carve-out that licensed the empty slide must stay bounded.
        self.assertIn("whether a person is present in the beat", preferences)

    def test_the_naming_rule_reaches_every_invented_person(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("not only the ones making a claim children judge", designer)
        # Show first, cut second: the teacher's stated order.
        self.assertIn("whether the beat needs a person at all", designer)

    def test_the_character_art_is_described_as_it_actually_looks(self) -> None:
        """The keys read as two teachers and a dog; the art is a boy and a girl.

        A designer that believes it has no child portraits falls back to text
        cards, which is exactly what happened to the two carol singers.
        """
        for path in (SPEECH, TEMPLATES):
            text = flat(path)
            self.assertIn("`mr-sear` is drawn as a boy", text)
            self.assertIn("`miss-brooker` as a girl", text)

    def test_the_reviewer_checks_for_the_missing_face(self) -> None:
        self.assertIn(
            "A person the lesson invents is a teaching object",
            flat(REVIEWER),
        )


class TheSpokenQuestionReachesTheBoardTests(unittest.TestCase):
    """The same deck printed `What do their reasons share?` on slide 8.

    Its own script for that slide already said "Tell your partner what is the
    same and what is different", which is the wording the voice guide's §12
    calibrated. The plain version was written first, by the same agent, and
    the board got the compression. Nobody downstream may repair it: the Slide
    Designer copies source-authored wording exactly.

    Daniel, 11 September 2026: "the teacher speaker notes is better ... I
    don't want that on slides."
    """

    def test_the_voice_guide_owns_the_check(self) -> None:
        voice = flat(VOICE)
        self.assertIn("The check that catches the reversal", voice)
        self.assertIn("the script's wording is the teacher's", voice)
        # Without its limit this fires on every script that frames or explains.
        self.assertIn("genuine difference of job", voice)

    def test_the_designer_runs_it_at_completion(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("read each beat's script beside its own visible wording", designer.lower())
        self.assertIn("Nobody downstream may repair it", designer)

    def test_the_reviewer_runs_it_in_the_voice_sweep(self) -> None:
        self.assertIn(
            "a question the script asks plainly and the slide asks compactly",
            flat(REVIEWER),
        )


class VoiceGuidanceStaysInTheAlwaysReadPathTests(unittest.TestCase):
    """Three commits on 10 September 2026 thinned voice guidance.

    Each said in its own message that teaching guidance was unchanged. One
    moved the one-thing-at-a-time rule for pupil prompts out of the always-read
    role file into a component fetched only when a worksheet is designed; one
    deleted the note recording the two prompts that reached real sheets because
    §6 was never opened. A rule you have to remember to fetch is not a rule,
    and the provenance is what makes it bite.

    These pins exist so the next consolidation pass has to argue with a test.
    """

    def test_the_pupil_prompt_rule_is_in_the_role_not_the_component(self) -> None:
        self.assertIn(
            "A pupil prompt asks one thing at a time",
            flat(DESIGNER),
        )
        # The component keeps a pointer, never a second copy that can drift.
        components = flat(COMPONENTS)
        self.assertIn("lives in the main role", components)
        self.assertNotIn(
            "is two questions and a marking rubric wearing one prompt",
            components,
        )

    def test_the_routing_card_carries_what_happens_when_it_is_skipped(self) -> None:
        voice = flat(VOICE)
        self.assertIn("Choose a job.", voice)
        self.assertIn("Fireman", voice)
        self.assertIn("What do their reasons share?", voice)
        self.assertIn("Routing by the kind of string only works", voice)

    def test_a_common_word_carrying_an_adult_sense_is_named(self) -> None:
        voice = flat(VOICE)
        self.assertIn("sharing means giving someone half", voice)
        self.assertIn("What is the same about their reasons?", voice)


if __name__ == "__main__":
    unittest.main()


OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
COMPOSITION = ROOT / "references" / "slide-composition-playbook.md"
VISUAL_PROFILE = ROOT / "references" / "teacher-slide-visual-profile.md"


class AnInventedGroupIsNamedTooTests(unittest.TestCase):
    """`a class` is the group's version of `someone`.

    The placeholder-names rule covers "every person you invent" and its tells
    are all individuals: `a visitor asks`, `someone wonders`, `a friend says`.
    A class is not a person, so a Year 4 PSHE lesson said `a class` ten times
    across its beats and asked children to advise somebody who was never
    introduced (21 September 2026). The teacher, reading the task slides cold:
    "I don't know who the class is."
    """

    def test_an_invented_group_gets_a_name(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("A group you invent is named too", designer)
        self.assertIn("the group's version of", designer)

    def test_the_name_is_used_every_time_as_for_a_person(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn("use that name every time the lesson speaks about it", designer)

    def test_a_scenario_carrying_only_numbers_still_needs_no_name(self) -> None:
        """The discrimination case, and it is the person rule's own limit: a
        class that exists to hold a number is not a character."""
        designer = flat(DESIGNER)
        self.assertIn("a class has 24 pencils", designer)
        self.assertIn("needs no name", designer)


class AnOptionBankLabelIsAsLongAsItNeedsTests(unittest.TestCase):
    """The four parts of a day arrived as four telegrams.

    `taskStructure` has three kinds and all three are selection structures, so
    a task of "four situations, respond to each" has no kind of its own and the
    designer reached for the nearest. The schema permits any string as a
    `label`, but the contract called it "option text" and its worked example is
    `cell`, `wire`, `lamp`, `switch`. So the parts of a day became
    `Food: rush through the morning without eating until late afternoon.` and
    the teacher read the board and asked why it sounded like a robot.
    """

    def test_a_label_may_carry_a_whole_situation(self) -> None:
        contract = flat(OUTPUT_TEMPLATE)
        self.assertIn("A label is as long as the child needs it to be", contract)
        self.assertIn("carries that situation in whole sentences", contract)

    def test_the_single_word_bank_is_still_correct(self) -> None:
        """The discrimination case. Widening the label must not turn a genuine
        bank of choices into sentences: those four words are whole labels."""
        contract = flat(OUTPUT_TEMPLATE)
        self.assertIn("are whole labels because each item is one word children choose between", contract)

    def test_responding_to_every_item_names_who_it_is_about(self) -> None:
        contract = flat(OUTPUT_TEMPLATE)
        self.assertIn("respond to every item rather than choosing between them", contract)
        self.assertIn("Say who the situation is about, by name", contract)

    def test_the_read_aloud_test_is_given(self) -> None:
        contract = flat(OUTPUT_TEMPLATE)
        self.assertIn("could be read aloud to the class is the test", contract)

    def test_downstream_reads_material_not_prose_as_separateness(self) -> None:
        """Both downstream owners said "material, not prose", which a slide
        designer could read as licence to shorten a sentence to a tag."""
        for path in (COMPOSITION, VISUAL_PROFILE):
            with self.subTest(path=path.name):
                text = flat(path)
                self.assertIn("separat", text)
                self.assertIn("never about its length", text) if path is COMPOSITION \
                    else self.assertIn("not length", text)

    def test_the_no_rejoining_rule_survives(self) -> None:
        """The obligation these paragraphs already carried, unchanged."""
        self.assertIn("rather than joining them back into the instruction", flat(COMPOSITION))
        self.assertIn("never rejoined into comma-separated prose", flat(VISUAL_PROFILE))
