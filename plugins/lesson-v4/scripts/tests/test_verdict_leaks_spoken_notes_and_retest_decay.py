from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VOICE = ROOT / "references" / "teacher-voice.md"
DESIGNER = ROOT / "agents" / "lesson-designer.md"
REVIEWER = ROOT / "agents" / "design-reviewer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class VerdictPresuppositionTests(unittest.TestCase):
    """The second calibration round (4.2.37 balanced-diet lesson, 31 Aug
    2026) found `What is Nadia forgetting?` shipped as a Do-beat task and
    the reviewer approved it, though the guide's answer-leak rule carried
    the near-identical rejected example `What has Sam got wrong?`.

    The rule existed and lost to pattern-matching: the example only
    matched `got wrong`, so a synonym walked past both the designer and
    the reviewer's sweep. The repair names the family (forgetting,
    missed, wrong) and states a word-for-word test that discriminates it
    from the legitimate find-the-given-error task.
    """

    def test_guide_names_the_presupposition_family(self) -> None:
        voice = flat(VOICE)
        self.assertIn("a question that presupposes the verdict", voice)
        # The family, not one verb.
        self.assertIn("What is Sam forgetting?", voice)
        self.assertIn("What has Sam missed?", voice)
        self.assertIn("the verb changes, the leak is the same", voice)

    def test_guide_states_the_word_for_word_test(self) -> None:
        voice = flat(VOICE)
        self.assertIn(
            "could this question be asked, word for word, if the claim "
            "were actually right?",
            voice,
        )
        self.assertIn("it has done the judging for the child", voice)

    def test_guide_keeps_the_find_the_error_exception(self) -> None:
        voice = flat(VOICE)
        self.assertIn(
            "only when the error's existence is given and the task is "
            "finding, explaining or correcting it",
            voice,
        )
        self.assertIn("find the mistake in this working", voice)

    def test_preflight_and_comparison_prompts_carry_the_family(self) -> None:
        voice = flat(VOICE)
        # The reviewer's sweep runs the pre-flight on every string, so the
        # checklist itself must pattern-match the family.
        self.assertIn(
            "or presupposed the verdict the child is meant to reach?", voice
        )
        # §12 is routed for comparison and critique prompts.
        self.assertIn("including by presupposition", voice)


class SpokenNotesRegisterTests(unittest.TestCase):
    """The same round found speaker notes that were fuller without being
    conversational - `Make choices that bring different foods into the
    lunch. Your reasons need to show how each choice helps the body, not
    simply call the food healthy.` - authored prose no teacher says.

    §2 defined notes by permission (what they may contain), never by
    requirement (they must pass as speech), so polish satisfied it.
    """

    def test_notes_must_pass_as_speech(self) -> None:
        voice = flat(VOICE)
        self.assertIn("Fuller means more spoken, not more polished", voice)
        self.assertIn("Speaker notes are not longer slide copy.", voice)
        self.assertIn(
            "if you cannot hear the teacher saying it to this class, "
            "sentence by sentence",
            voice,
        )

    def test_the_tell_is_the_directive_chain(self) -> None:
        voice = flat(VOICE)
        self.assertIn(
            "a chain of tidy directives, each carrying a trailing "
            "qualifier clause",
            voice,
        )
        self.assertIn(
            "gives one instruction at a time and turns the caveat into a "
            "question",
            voice,
        )

    def test_preflight_check_three_covers_speech(self) -> None:
        voice = flat(VOICE)
        self.assertIn(
            "A script or note must pass as speech: hear the teacher "
            "saying it, sentence by sentence.",
            voice,
        )


class HumourSourceTests(unittest.TestCase):
    """Humour under-fired in both calibration rounds with the guidance
    active at designer and reviewer. §4's opportunity list taught only
    inherently funny content (quirky animals, popcorn), so a sensible
    lesson read as a lesson with no opportunities, and the sensitive-
    lesson section pushed the rest toward flat-safe.

    The repair teaches where to look: the lesson's own misconception,
    gently exaggerated - which is also the safest joke available in a
    sensitive lesson because it targets an idea, never a child or the
    issue.
    """

    def test_the_misconception_is_named_as_a_hook_source(self) -> None:
        voice = flat(VOICE)
        self.assertIn(
            "The hook is not always the content being amusing.", voice
        )
        self.assertIn(
            "take the wrong rule seriously for a moment and let its "
            "absurdity show",
            voice,
        )
        # The calibrated example the teacher endorsed.
        self.assertIn(
            'One apple isn\'t a magic "balanced diet" button!', voice
        )
        self.assertIn(
            "a lesson with no quirky content is not a lesson with no "
            "opportunities",
            voice,
        )

    def test_sensitive_lessons_get_the_safe_direction(self) -> None:
        voice = flat(VOICE)
        self.assertIn(
            "The safest lightness in a sensitive lesson usually targets "
            "the wrong idea being corrected",
            voice,
        )
        self.assertIn("nobody in the room is an idea", voice)


class PlanningLanguageTests(unittest.TestCase):
    """Three curriculum-writer registers shipped in child-facing strings:
    a success criterion (`Judge balance using the pattern across a day or
    week.`), an invented compound modifier (`a varied-looking lunch`),
    and guidance-document phrasing repeated across three model answers
    (`could contribute to a balanced diet`).
    """

    def test_criteria_are_in_the_childs_own_words(self) -> None:
        voice = flat(VOICE)
        self.assertIn("written in the child's own words", voice)
        self.assertIn(
            "still fail by being planning language", voice
        )
        self.assertIn(
            "Judge balance using the pattern across a day or week.", voice
        )
        self.assertIn(
            "Check the whole day or week.",
            voice,
        )

    def test_invented_compound_modifiers_are_a_named_avoid(self) -> None:
        voice = flat(VOICE)
        self.assertIn("invented compound modifiers", voice)
        self.assertIn("a varied-looking lunch", voice)

    def test_model_answers_translate_caution_into_child_words(self) -> None:
        voice = flat(VOICE)
        self.assertIn(
            "translate the caution into the child's own words", voice
        )
        self.assertIn("could be part of a balanced diet", voice)
        self.assertIn("could contribute to a balanced diet", voice)
        self.assertIn("the adult document showing through", voice)


class RetestDecayTests(unittest.TestCase):
    """The dominant misconception (one meal cannot prove a diet) was
    retested six times - starter, Teach, a Do beat, a practise caveat,
    Apply and a worksheet prompt - so children learned to repeat the
    corrective sentence rather than weigh evidence, and the lesson
    quietly narrowed its LO to the sticking point.

    The footprint rule licensed threading (`The dominant sticking point
    may thread through the lesson`) with no stopping point, and the
    reviewer's coherent-centre check counted presence, not decay.
    """

    def test_designer_bounds_the_dominant_arc(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn(
            "Even the dominant misconception has an arc, and the arc has "
            "an end.",
            designer,
        )
        self.assertIn(
            "exposed, taught, checked once, then retested once at the end",
            designer,
        )
        self.assertIn("the trap has become a catchphrase", designer)
        # Freed time goes to the objective's untaught parts.
        self.assertIn(
            "turn the middle ones toward the parts of the objective the "
            "correction does not cover",
            designer,
        )
        # The narrowing tell.
        self.assertIn(
            "would answer with the trap, not the LO", designer
        )
        # Worksheet prompts count among the response moments.
        self.assertIn(
            "beats, practise, Apply and worksheet prompts alike", designer
        )

    def test_designer_keeps_the_existing_footprint_rule(self) -> None:
        # The arc boundary extends the footprint rule; it must not have
        # replaced it.
        designer = flat(DESIGNER)
        self.assertIn(
            "Weight each misconception's footprint to how much it blocks "
            "today's objective.",
            designer,
        )

    def test_reviewer_checks_for_decay_and_narrowing(self) -> None:
        reviewer = flat(REVIEWER)
        self.assertIn(
            "the retesting of that centre has an end", reviewer
        )
        self.assertIn(
            "count the response moments, beats and worksheet prompts "
            "alike",
            reviewer,
        )
        self.assertIn(
            "repeating the sentence given two moments earlier", reviewer
        )
        self.assertIn(
            "has narrowed its objective to the sticking point", reviewer
        )


class StrongAnswerFirstTests(unittest.TestCase):
    """The worksheet's improve-the-lunch prompt had a stimulus already
    covering every taught body job, so no addition could demonstrate why
    variety matters. The designer's model (an orange) failed the new-
    food-group support line; the reviewer's bounded repair (yoghurt)
    cleared that check and failed the taught rationale instead, because
    hummus already supplied protein - the reviewer created the shipped
    weak answer and re-judged only the dimension it was fixing.
    """

    def test_designer_authors_from_the_strong_answer(self) -> None:
        designer = flat(DESIGNER)
        self.assertIn(
            "An improve-or-extend task is authored from its strong "
            "answer.",
            designer,
        )
        self.assertIn(
            "write the intended strong answer first", designer
        )
        self.assertIn(
            "demonstrates the lesson's taught rationale, not merely a "
            "true fact",
            designer,
        )
        self.assertIn(
            "When no strong answer exists, change the stimulus, not the "
            "answer.",
            designer,
        )

    def test_reviewer_checks_the_stimulus_gap_on_worksheets(self) -> None:
        reviewer = flat(REVIEWER)
        self.assertIn(
            "a stimulus that genuinely lacks something in the lesson's "
            "taught terms",
            reviewer,
        )

    def test_reviewer_rejudges_its_own_repairs(self) -> None:
        reviewer = flat(REVIEWER)
        self.assertIn(
            "judge the repaired string as if you had met it cold", reviewer
        )
        self.assertIn(
            "pass every check that condemned the original", reviewer
        )
        self.assertIn(
            "has moved the defect, not removed it", reviewer
        )
        # The escalation path when no local repair can succeed.
        self.assertIn(
            "the defect is upstream in the stimulus", reviewer
        )


if __name__ == "__main__":
    unittest.main()
