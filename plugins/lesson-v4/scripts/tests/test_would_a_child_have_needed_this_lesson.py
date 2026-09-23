"""The fourth test: would a child have needed this lesson to say it?

A Year 4 history deck built on 4.2.123 (9 September 2026) answered all three of
Daniel's questions and passed every check, including the plugin's own reviewer.
Its learning was `Babies had rattles in Tudor times, and babies still have
rattles today`; its thought was `What is different about these two toys?`; its
final task used both. A child could have said the fact before the lesson and
answered the question from the picture without any history. The two sticky
facts were the sentences the final task expected, handed over on the teaching
slides.

Daniel: "if you think it's weak, something in your fix didn't really help,
maybe just helped that specific thing." He was right. The three questions were
answered; nothing judged the answers. And he asked for the repair to reach
every subject and every lesson type, not history alone.

So the test runs on the answers: each named fact and the opening sentence's
`because` (could a child have said it before?), and each thinking line (could a
child answer it from the board, or from what they knew walking in?). Every
subject file already carried its own doing-versus-thinking test at the level
of the lesson; each now ties the per-beat line to it. Every lesson type's
response beat says what its thinking line names.

These tests guard the reach.
"""

from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "references"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
PREFERENCES = REF / "preferences.md"

TEST = "Would a child have needed this lesson to say it?"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def section(path: Path, heading: str) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.index("## " + heading)
    end = text.find("\n## ", start + 1)
    body = text[start:] if end == -1 else text[start:end]
    return " ".join(body.split())


class TheFourthTestIsStatedTests(unittest.TestCase):
    def test_preferences_run_the_test_on_the_answers_to_the_other_three(self) -> None:
        body = section(PREFERENCES, "What a Lesson Is For")
        self.assertIn(TEST, body)
        self.assertIn("could a child in this class have said it before the lesson", body)
        self.assertIn("from what they knew walking in", body)
        self.assertIn("Every subject has a doing that passes for thinking", body)
        self.assertIn("The limit: a retrieval starter is meant to be what children already know", body)

    def test_the_designer_applies_it_to_sticky_facts_the_thought_and_the_opening_sentence(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("could a child in this class have said it before the lesson?", text)
        self.assertIn("has made the task recall of the slide", text)
        self.assertIn("one they could finish before the lesson is guessing", text)
        self.assertIn("has named no learning at all", text)

    def test_the_reviewer_applies_it_and_names_the_case_it_missed(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("could have said it before the lesson", text)
        self.assertIn("is answered by reading", text)
        # The two cases stay as plain examples; that a reviewer approved them
        # is the incident, kept in the build log (quick-checks decision 10).
        self.assertIn("is answered from the picture by a child who knows no history", text)
        self.assertNotIn("a reviewer approved both", text)

    def test_the_catalogue_and_the_contract_carry_the_walking_in_clause(self) -> None:
        self.assertIn("or from what they knew walking in", flat(REF / "do-beats.md"))
        self.assertIn("if they could have completed it before the lesson, the beat is guessing", flat(REF / "output-template.md"))


class EverySubjectTiesTheThinkingLineToItsOwnTestTests(unittest.TestCase):
    def test_history(self) -> None:
        self.assertIn("a source beat's `thinking` line names the thing the source does not say outright", flat(REF / "subject-history.md"))

    def test_geography(self) -> None:
        self.assertIn("A map beat's `thinking` line names that interrogation, not the looking", flat(REF / "subject-geography.md"))

    def test_maths(self) -> None:
        self.assertIn("a fluency beat's `thinking` line names the decision inside the method", flat(REF / "subject-maths.md"))

    def test_science(self) -> None:
        self.assertIn("a science beat's `thinking` line names the explanation, prediction or fair-test decision", flat(REF / "subject-science.md"))

    def test_pshe(self) -> None:
        self.assertIn("a PSHE beat's `thinking` line names the taught reason or boundary", flat(REF / "subject-pshe.md"))

    def test_re_already_says_what_a_reflection_draws_on(self) -> None:
        self.assertIn("Design the reflection so it draws on that learning", flat(REF / "subject-re.md"))


class EveryLessonTypeSaysWhatItsThinkingLineNamesTests(unittest.TestCase):
    def test_skill_based_names_the_decision_not_the_doing(self) -> None:
        text = flat(REF / "teaching-sequence-skill-based.md")
        self.assertIn("The beat's `thinking` line names that decision", text)
        self.assertIn("A Your Turn the class could have done before the My Turn has practised nothing this lesson taught", text)

    def test_dialogic_names_the_position_and_its_grounding(self) -> None:
        self.assertIn("a position children held walking in", flat(REF / "teaching-sequence-dialogic.md"))

    def test_discovery_names_the_prediction_not_the_looking(self) -> None:
        self.assertIn("has made the exploration decoration", flat(REF / "teaching-sequence-discovery.md"))

    def test_task_centred_names_the_decisions_inside_the_task(self) -> None:
        self.assertIn("a task children could have done before the enabling input has used none of it", flat(REF / "teaching-sequence-task-centred.md"))

    def test_content_based_already_writes_the_line_before_the_catalogue(self) -> None:
        self.assertIn("write the beat's `thinking` line", flat(REF / "teaching-sequence-content-based.md"))


if __name__ == "__main__":
    unittest.main()
