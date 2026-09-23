"""The review page's list of names reads what the class reads (4.2.287).

The teacher's decision of 23 September 2026 on the assumed-knowledge topic:
words and names thrown on the board with no context overload the class, and
the notes are how the teacher says the board, never a place a child learns
what the board lacks. So the list the reviewer reads now takes in the slide
titles and the vocabulary cards as well as the board; it finds a one-word name
at the start of a sentence when the lesson capitalises the same word where
nothing made it so; and it counts a name as said earlier only when the board
showed the whole word. The ordinary words a list cannot see (`government`,
`order`) are the reviewer's to read for, every review, by the vocabulary rule.
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TESTS = Path(__file__).resolve().parent


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


packet = load("names_on_the_board_packet", ROOT / "scripts" / "design-review-packet.py")
contract = load("names_on_the_board_contract", TESTS / "test_lesson_design_contract.py")


def listed(design: dict) -> dict[str, str]:
    return {
        line[2:].split(":", 1)[0]: line
        for line in packet.build_board_names(design)
        if line.startswith("- ") and "first on the board" in line
    }


def unit(design: dict, kind: str) -> dict:
    return next(u for u in design["teachingSequence"] if u["kind"] == kind)


class AOneWordNameAtTheStartOfASentence(unittest.TestCase):
    def test_counts_when_the_lesson_capitalises_it_elsewhere(self) -> None:
        self.assertEqual(packet.board_names_in("Answer: Shaftesbury.", {"Shaftesbury"}), ["Shaftesbury"])
        self.assertEqual(packet.board_names_in("Tudor children worked.", {"Tudor"}), ["Tudor"])

    def test_does_not_count_on_its_capital_alone(self) -> None:
        self.assertEqual(packet.board_names_in("Answer: Shaftesbury."), [])
        text = (
            "Every Tudor child stopped watching plays. Use the rides to explain. (a) Listen to each other. "
            "Children's lives | Play and learning. Label A and B. Write XLIV in numbers."
        )
        # The words the lesson capitalises elsewhere are the signal, so an
        # ordinary opening word stays out however many names the lesson has.
        self.assertEqual(packet.board_names_in(text, {"Tudor", "Thames", "Elizabeth"}), ["Tudor"])

    def test_the_lesson_supplies_the_signal(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "teach")["content"]["explanation"] += " Lord Shaftesbury wanted shorter hours."
        unit(design, "do")["content"]["task"] = "Who changed the law? Shaftesbury. Explain why."
        names = listed(design)
        self.assertIn("Lord Shaftesbury", names)
        # `Shaftesbury.` on its own is a sentence opening; the Teach's
        # `Lord Shaftesbury` is what makes it a name, and the board said it.
        self.assertIn("first on the board in `Do`; said earlier on the board", names["Shaftesbury"])


class TitlesAndVocabularyCardsAreRead(unittest.TestCase):
    def test_a_name_in_a_slide_title_is_listed(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "do")["label"] = "What did Queen Victoria want?"
        names = listed(design)
        self.assertIn("Queen Victoria", names)
        self.assertIn("first on the board in `What did Queen Victoria want?`", names["Queen Victoria"])

    def test_a_name_on_a_vocabulary_card_is_listed(self) -> None:
        design, _photos = contract.valid_content_contract()
        design["vocabulary"][0]["definition"] = "A road is a wide path, like the ones Parliament paid for."
        names = listed(design)
        self.assertIn("Parliament", names)
        self.assertIn("vocabulary cards after Starter", names["Parliament"])

    def test_a_title_with_every_word_capitalised_is_not_a_list_of_names(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "observe")["label"] = "Look Closely"
        unit(design, "do")["label"] = "Your Turn - Order"
        names = listed(design)
        for word in ("Closely", "Turn", "Order"):
            self.assertNotIn(word, names)

    def test_an_opening_verb_or_pronoun_is_not_part_of_a_name(self) -> None:
        self.assertEqual(packet.board_names_in("Prove Oliver wrong. Someone said so. I'd like to know."), ["Oliver"])
        # Mid-sentence, where the old list printed `Someone I` and `I'm`.
        self.assertEqual(packet.board_names_in("Then Someone I know said so. Maybe I'm wrong, and so is Mia."), ["Mia"])

    def test_a_sentence_case_title_supplies_the_signal(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "observe")["label"] = "What did Queen Victoria change?"
        unit(design, "do")["content"]["task"] = "Victoria changed the law. Explain one effect."
        self.assertIn("Victoria", listed(design))


class SaidEarlierMeansTheBoardShowedTheWholeWord(unittest.TestCase):
    def test_a_longer_word_does_not_count(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "teach")["content"]["explanation"] += " Victorian children worked long hours."
        unit(design, "do")["content"]["task"] = "What did the new laws of Victoria change?"
        self.assertIn("not said earlier on the board", listed(design)["Victoria"])

    def test_the_script_does_not_count(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "teach")["speakerNotes"] = {"script": "The Thames runs through London.", "teacherInfo": None}
        unit(design, "do")["content"]["task"] = "Why did people skate on the frozen Thames?"
        self.assertIn("first on the board in `Do`; not said earlier on the board", listed(design)["Thames"])

    def test_the_board_does_count(self) -> None:
        design, _photos = contract.valid_content_contract()
        unit(design, "teach")["content"]["explanation"] += " The River Thames runs through London."
        unit(design, "do")["content"]["task"] = "Why did people skate on the frozen Thames?"
        names = listed(design)
        self.assertIn("River Thames", names)
        self.assertIn("said earlier on the board", names["Thames"])
        self.assertNotIn("not said", names["Thames"])


class TheReviewerReadsTheRuleForOrdinaryWordsEveryReview(unittest.TestCase):
    def test_vocabulary_is_an_every_review_read(self) -> None:
        always = {(name, heading) for name, heading, _why in packet.ALWAYS_READ_REVIEW_SECTIONS}
        self.assertIn(("preferences.md", "Vocabulary"), always)
        why = next(why for name, heading, why in packet.ALWAYS_READ_REVIEW_SECTIONS if heading == "Vocabulary")
        self.assertIn("A word the teaching leans on is taught", why)
        self.assertNotIn("Vocabulary", {heading for heading, _trigger in packet.PREFERENCE_REVIEW_ROUTES})

    def test_the_page_and_the_reviewer_name_the_ordinary_words(self) -> None:
        design, _photos = contract.valid_content_contract()
        intro = " ".join(packet.build_board_names(design))
        self.assertIn("A word the teaching leans on is taught", intro)
        reviewer = " ".join((ROOT / "agents" / "design-reviewer.md").read_text(encoding="utf-8").split())
        self.assertIn("The list cannot see an ordinary word a sentence leans on", reviewer)


if __name__ == "__main__":
    unittest.main()
