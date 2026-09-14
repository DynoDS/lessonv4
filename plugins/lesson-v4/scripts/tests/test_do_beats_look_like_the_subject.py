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


if __name__ == "__main__":
    unittest.main()
