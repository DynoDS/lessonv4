"""Do beats look like the subject, and a quick match uses fresh cases (4.2.205).

Daniel's deep-research report on Do beats (14 September 2026) was read
against the plugin. Most of it was already here; three contradictions were
decided with him: no scoring engine for choosing activities, immediate recall
is not called retrieval practice, and a quick match, sort or label is a real
Do beat when its cards are cases the Teach did not show. What was missing was
a picture of a Do beat inside each content subject, which is why the Tudor
lesson defaulted every beat to explaining.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "references"


def flat(path: Path) -> str:
    return re.sub(r"\s+", " ", path.read_text(encoding="utf-8"))


class ADoBeatLooksLikeTheSubject(unittest.TestCase):
    def test_every_content_subject_says_what_a_do_beat_looks_like(self) -> None:
        for subject in ("history", "geography", "science", "re", "pshe"):
            with self.subTest(subject=subject):
                text = flat(REF / f"subject-{subject}.md")
                self.assertIn("What a Do beat looks like in", text)
                self.assertIn("not a list to work through", text)

    def test_the_choice_is_routed_to_the_subject_section(self) -> None:
        self.assertIn("the subject file's `What a Do beat looks like`", flat(REF / "preferences.md"))
        self.assertIn("the subject file's `What a Do beat looks like`", flat(REF / "do-beats.md"))
        self.assertIn(
            "the subject file's `What a Do beat looks like`",
            flat(REF / "teaching-sequence-content-based.md"),
        )


class AQuickMatchUsesFreshCases(unittest.TestCase):
    def test_preferences_owns_the_fresh_cases_rule_with_its_limit(self) -> None:
        text = flat(REF / "preferences.md")
        self.assertIn("**A quick match, sort or label is a real Do beat when the things on the cards are new.**", text)
        self.assertIn("gets one card that belongs nowhere", text)
        self.assertIn("labelling the taught thing is right, and the design says so", text)

    def test_the_reviewer_reads_for_a_match_over_the_slides_own_words(self) -> None:
        self.assertIn("whose cards are the slide's own words", flat(ROOT / "agents" / "design-reviewer.md"))


class TheCatalogueAgreesWithItself(unittest.TestCase):
    def test_new_formats_are_listed_and_indexed(self) -> None:
        text = flat(REF / "do-beats.md")
        for heading in ("### 5.8 Put It in Order", "### 5.9 Causal Chain", "### 5.10 Same and Different", "### 8.8 Prove Sam Wrong"):
            self.assertIn(heading, text)
        self.assertIn("ten keyed decision formats", text)
        self.assertIn("eight make-something-new formats", text)

    def test_a_prediction_is_decided_by_the_teaching(self) -> None:
        text = flat(REF / "do-beats.md")
        self.assertNotIn("prediction has no wrong answer", text)
        self.assertIn("The prediction is only worth making when what was just taught decides it", text)

    def test_four_corners_is_not_used(self) -> None:
        text = flat(REF / "do-beats.md")
        self.assertIn("This is the move-to-show family 7.5 rules out", text)


class ACalmClassroom(unittest.TestCase):
    """His follow-up the same evening: calm room; thumbs up is weak."""

    def test_movement_beats_give_way_to_seated_forms(self) -> None:
        text = flat(REF / "do-beats.md")
        self.assertIn("**The user keeps a calm classroom.**", text)
        self.assertIn("Choose a whole-class movement beat only when the teacher asks for it.", text)

    def test_thumbs_up_is_not_a_do_beat(self) -> None:
        self.assertIn("it is not a Do beat at all, only a quick read the teacher may add beside one", flat(REF / "do-beats.md"))

    def test_the_venn_is_offered_for_comparing_two_cases(self) -> None:
        self.assertIn("**Comparing two cases.**", flat(REF / "templates.md"))

class EachIdeaNamesWhatEveryChildDoes(unittest.TestCase):
    """Daniel: "i dont get it how theyre beats, theyre questions?" (14 September 2026)."""

    def test_every_list_says_a_question_alone_is_not_the_beat(self) -> None:
        for subject in ("history", "geography", "science", "re", "pshe"):
            with self.subTest(subject=subject):
                self.assertIn(
                    "each names what every child does with the cards, map or page",
                    flat(REF / f"subject-{subject}.md"),
                )

    def test_no_list_item_opens_its_body_with_a_bare_question(self) -> None:
        pattern = re.compile(r"^- \*\*[^*]+\*\* (Which|What|Will|Is|Where|How)", re.M)
        for subject in ("history", "geography", "science", "re", "pshe"):
            with self.subTest(subject=subject):
                text = (REF / f"subject-{subject}.md").read_text(encoding="utf-8")
                self.assertEqual(pattern.findall(text), [])

    def test_the_seven_added_ideas_are_there(self) -> None:
        self.assertIn("**Local, national or global?**", flat(REF / "subject-geography.md"))
        self.assertIn("**Model or real?**", flat(REF / "subject-science.md"))
        self.assertIn("**Which beliefs clash?**", flat(REF / "subject-re.md"))
        self.assertIn("**Which website would you trust?**", flat(REF / "subject-pshe.md"))
        self.assertIn("**What does each person need?**", flat(REF / "subject-pshe.md"))
        maths = flat(REF / "subject-maths.md")
        self.assertIn("**Estimate first:**", maths)
        self.assertIn("**Compare two methods:**", maths)

class ASortsGroupsAreAPlainContrast(unittest.TestCase):
    """Daniel on the rebuilt Tudor sort: "i dont get the difference between the 2 groups"."""

    def test_preferences_asks_for_one_plain_sentence_between_the_groups(self) -> None:
        text = flat(REF / "preferences.md")
        self.assertIn("Say the difference between the two groups in one plain sentence a nine-year-old would follow.", text)
        self.assertIn("is confusion rather than challenge, unless the idea being taught is that one thing can be both", text)

    def test_titles_and_headings_name_the_thing(self) -> None:
        self.assertIn("A slide title and the headings of a sort are read the same way", flat(REF / "teacher-voice.md"))

    def test_the_history_example_no_longer_models_the_muddy_sort(self) -> None:
        text = flat(REF / "subject-history.md")
        self.assertNotIn("the reasons families still chose it", text)
        self.assertIn("sort what was bad and what was good about being an apprentice", text)

    def test_the_history_file_no_longer_certifies_the_tudor_sorts_as_the_thinking(self) -> None:
        # Taught on 15 September 2026, the two rebuilt sorts could be completed
        # from everyday sense. The file keeps them as approved wording and
        # names the test a hands-on beat has to pass; it does not hold them up
        # as evidence that children can explain the choice.
        text = flat(REF / "subject-history.md")
        self.assertIn("approved for their wording and their plain headings", text)
        self.assertIn("could a child place every card without the history the lesson just taught?", text)
        self.assertIn("it is not evidence that children can explain the choice", text)
        self.assertNotIn("did its thinking with its hands instead", text)

    def test_the_reviewer_reads_sort_headings(self) -> None:
        self.assertIn("a sort whose two groups a child could not tell apart in one plain sentence", flat(ROOT / "agents" / "design-reviewer.md"))


if __name__ == "__main__":
    unittest.main()
