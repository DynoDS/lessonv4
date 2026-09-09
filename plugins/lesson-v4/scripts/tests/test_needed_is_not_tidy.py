"""Needed is not tidy, and a final task's moves are practised before they are asked.

The 4.2.122 and 4.2.123 releases made the final task need the teaching. A
headteacher's second review of the rerun (9 September 2026) found the two ways
that rule over-fires when followed hard:

1. The examples were sharpened into a sort. Christians sing for Jesus, everyone
   else for family. That makes the dependency visible and teaches a false rule,
   and the first version's line that one person can value both was lost.
2. The final task gained a comparison step that no earlier beat had the class
   make. The `unlocks` line claimed the star beat fed it; producing two meanings
   is not comparing your own with someone else's. A prepared model paragraph
   showed the product and did not practise the move.

The Ava worksheet prompt was pre-authorised for removal because "the last
section asks a version of the same question", which is the same slip in
miniature: comparing two stated meanings does not test the inference the
misconception gets wrong.

Daniel's instruction: fix all future lessons, not this one. So the limits live
beside the rule that produced them, and the RE subject file carries the
accuracy and inclusion lines the review named as essential.

These tests guard the reach of the two limits.
"""

from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
DESIGN_REVIEWER = ROOT / "agents" / "design-reviewer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
CONTENT_BASED = ROOT / "references" / "teaching-sequence-content-based.md"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"
SUBJECT_RE = ROOT / "references" / "subject-re.md"
TEACHER_VOICE = ROOT / "references" / "teacher-voice.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def section(path: Path, heading: str) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.index("## " + heading)
    end = text.find("\n## ", start + 1)
    body = text[start:] if end == -1 else text[start:end]
    return " ".join(body.split())


class NeededIsNotTidyTests(unittest.TestCase):
    def test_the_limit_sits_beside_the_rule_it_bounds(self) -> None:
        body = section(PREFERENCES, "What a Lesson Is For")
        self.assertIn("Needed is not tidy", body)
        self.assertIn("includes a case that holds both", body)
        self.assertIn("does not have to be made binary to be needed", body)

    def test_the_contrast_rule_names_its_own_limit(self) -> None:
        text = flat(LESSON_DESIGNER)
        self.assertIn("A contrast isolates a feature; it must not teach that the feature sorts people", text)
        self.assertIn("one case holds both", text)
        self.assertIn("not a comparison of two stated meanings", text)

    def test_the_reviewer_checks_for_a_sort_and_for_the_retest_shape(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("The retest asks the question the wrong rule answers wrongly", text)
        self.assertIn("has taught a sort in place of the idea", text)

    def test_re_reflection_is_not_a_two_way_choice(self) -> None:
        text = flat(SUBJECT_RE)
        self.assertIn("whether more than one of those meanings could be true of one person", text)
        self.assertIn("Like-or-unlike as a two-way choice invites the sort", text)


class FinalTaskMovesArePractisedTests(unittest.TestCase):
    def test_preferences_read_the_final_task_backwards_as_moves(self) -> None:
        body = section(PREFERENCES, "What a Lesson Is For")
        self.assertIn("Read the final task backwards as moves, not facts", body)
        self.assertIn("a prepared model paragraph is the product shown, not the move practised", body)

    def test_the_unlocks_line_is_tested_against_the_move_it_claims_to_feed(self) -> None:
        self.assertIn("could a child who did this beat now do that step of the final task without being shown a further move", flat(LESSON_DESIGNER))
        self.assertIn("name the move the final task makes with what this beat gave", flat(OUTPUT_TEMPLATE))

    def test_the_content_route_asks_for_a_supported_attempt_at_a_new_move(self) -> None:
        text = flat(CONTENT_BASED)
        self.assertIn("the last Do before the Practise is a supported attempt at that move", text)
        self.assertIn("it does not have the class make the move", text)

    def test_the_reviewer_reads_the_final_task_as_moves(self) -> None:
        text = flat(DESIGN_REVIEWER)
        self.assertIn("a move first performed in the final task is a missing stage", text)


class TheCheckIsNotDroppedBecauseTheTaskCoversItTests(unittest.TestCase):
    def test_designer_and_contract_refuse_the_covered_by_the_final_section_reason(self) -> None:
        self.assertIn("is never pre-authorised on the ground that the final section", flat(LESSON_DESIGNER))
        self.assertIn("is never listed here on the ground that another section", flat(OUTPUT_TEMPLATE))


class ReSubjectAccuracyAndInclusionTests(unittest.TestCase):
    def test_re_distinguishes_commemoration_from_a_known_date(self) -> None:
        text = flat(SUBJECT_RE)
        self.assertIn("Say what the tradition claims", text)
        self.assertIn("not a known date of the event", text)
        self.assertIn("something a person accepts as true", text)

    def test_re_puts_the_protective_choices_in_the_child_facing_words(self) -> None:
        self.assertIn("in the words the class hears and reads, not in a flag to the teacher", flat(SUBJECT_RE))

    def test_model_comparisons_do_not_reach_for_a_clever_likeness(self) -> None:
        text = flat(TEACHER_VOICE)
        self.assertIn("a clever likeness in a comparison model that the taught facts cannot support", text)


if __name__ == "__main__":
    unittest.main()
