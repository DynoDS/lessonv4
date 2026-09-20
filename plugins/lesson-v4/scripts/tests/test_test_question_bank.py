"""The maths test-question bank: what it will and will not hand a lesson.

The bank is reached the way the drawing library is, by an index of names the
plugin ships and a fetch of the one file a lesson chooses. These tests hold the
boundaries that a wrong answer on a classroom board would otherwise pass
through: that only maths can ask it, that a question always arrives with an
answer, and that the index never names a question the bank cannot answer.

Nothing here reaches the network. The fetch route is exercised against a local
bank, which is the same code path a developer working on the bank uses.
"""
from __future__ import annotations

import gzip
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEARCH = ROOT / "scripts" / "search-test-questions.js"
BUILD_INDEX = ROOT / "scripts" / "build-test-question-index.js"
SHIPPED_INDEX = ROOT / "test-questions" / "index.txt.gz"

PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d494844520000000100000001080600000"
    "01f15c4890000000a49444154789c6360000002000100ffff03000006"
    "0005573bcaa20000000049454e44ae426082"
)


def run(*args, env=None):
    return subprocess.run(
        ["node", str(SEARCH), *map(str, args)],
        capture_output=True, text=True, env=env, cwd=str(ROOT),
    )


def make_bank(root: Path, questions):
    """questions: (year, strand, name, has_text, has_picture)"""
    for year, strand, name, text, picture in questions:
        folder = root / year / strand
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"{name}.png").write_bytes(PNG)
        if text:
            (folder / f"{name}.answer.txt").write_text(
                "answer: 300\nmarks: 1\nnote: accept three hundred\n", encoding="utf-8"
            )
        if picture:
            (folder / f"{name}.answer.png").write_bytes(PNG)


def bank_env(monkey_root: Path, index: Path):
    import os

    env = dict(os.environ)
    env["LESSON_TEST_QUESTIONS_ROOT"] = str(monkey_root)
    env["LESSON_TEST_QUESTIONS_INDEX"] = str(index)
    env["LESSON_TEST_QUESTIONS_OFFLINE"] = "1"
    return env


class SubjectBoundary(unittest.TestCase):
    """The bank holds maths. Any other subject must be turned away here.

    A history lesson handed a maths question, or a plausible name that matches
    on words alone, is worse than no starter help at all, because the name looks
    like an answer to the request.
    """

    def test_a_subject_that_is_not_maths_is_refused(self) -> None:
        for subject in ("history", "science", "geography", "re", "pshe"):
            with self.subTest(subject=subject):
                result = run("--subject", subject, "--year", "4", "--query", "x", "--into", ROOT)
                self.assertEqual(result.returncode, 2)
                self.assertIn("maths questions only", result.stderr)
                self.assertIn(subject, result.stderr)

    def test_no_subject_at_all_is_refused_rather_than_assumed(self) -> None:
        result = run("--year", "4", "--query", "x", "--into", ROOT)
        self.assertEqual(result.returncode, 2)
        self.assertIn("--subject is required", result.stderr)


class WhatArrives(unittest.TestCase):
    def setUp(self) -> None:
        import tempfile

        self.tmp = Path(tempfile.mkdtemp())
        self.bank = self.tmp / "bank"
        make_bank(self.bank, [
            ("year-4", "number", "round-256-to-the-nearest-100", True, False),
            ("year-4", "number", "find-all-combinations-of-3-shirts-and-2-shorts", False, True),
            ("year-2", "number", "round-86-to-the-nearest-10", True, False),
        ])
        self.index = self.tmp / "index.txt.gz"
        built = subprocess.run(
            ["node", str(BUILD_INDEX), "--bank", str(self.bank), "--out", str(self.index)],
            capture_output=True, text=True, cwd=str(ROOT),
        )
        self.assertEqual(built.returncode, 0, built.stderr)
        self.env = bank_env(self.bank, self.index)
        self.into = self.tmp / "lesson"

    def test_a_search_finds_the_question_and_brings_its_picture(self) -> None:
        result = run("--subject", "maths", "--year", "4", "--query", "round to the nearest 100",
                     "--into", self.into, env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("TEST_QUESTION_SHORTLIST", result.stdout)
        self.assertIn("round-256-to-the-nearest-100.png", result.stdout)
        self.assertTrue((self.into / "test-questions" / ".preview"
                         / "round-256-to-the-nearest-100.png").exists())

    def test_taking_a_question_brings_its_answer_and_prints_it(self) -> None:
        result = run("--subject", "maths", "--take", "year-4/number/round-256-to-the-nearest-100.png",
                     "--into", self.into, env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("TEST_QUESTION_TAKEN", result.stdout)
        self.assertIn("answer: 300", result.stdout)
        folder = self.into / "test-questions"
        self.assertTrue((folder / "round-256-to-the-nearest-100.png").exists())
        self.assertTrue((folder / "round-256-to-the-nearest-100.answer.txt").exists())

    def test_a_picture_answer_comes_across_too(self) -> None:
        result = run("--subject", "maths",
                     "--take", "year-4/number/find-all-combinations-of-3-shirts-and-2-shorts.png",
                     "--into", self.into, env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.into / "test-questions"
                         / "find-all-combinations-of-3-shirts-and-2-shorts.answer.png").exists())

    def test_nothing_matching_says_so_and_does_not_invent_a_question(self) -> None:
        result = run("--subject", "maths", "--year", "4", "--query", "photosynthesis of a rainforest canopy",
                     "--into", self.into, env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("TEST_QUESTION_NONE_MATCHED", result.stdout)
        self.assertIn("Design the starter as usual", result.stdout)

    def test_an_empty_year_widens_to_its_neighbours_and_says_it_did(self) -> None:
        """Year labels guide difficulty; they do not gate it.

        Year 3 holds nothing in this bank, so a Year 3 lesson asking for
        rounding should still be offered the Year 2 and Year 4 questions, and
        must be told that is what happened, because where a question was filed
        is part of judging whether it suits the class.
        """
        result = run("--subject", "maths", "--year", "3", "--query", "round to the nearest",
                     "--into", self.into, env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("TEST_QUESTION_WIDENED", result.stdout)
        self.assertIn("round-", result.stdout)


    def test_when_no_picture_can_be_fetched_it_says_so_instead_of_listing_names(self) -> None:
        """A name is not evidence that a question fits.

        With no network, no sign-in to the private bank, or fetching switched
        off, the names still match. A shortlist of names with no pictures reads
        exactly like a shortlist of choices, so the one case where a designer
        might pick a question it has never seen has to be named out loud.
        """
        env = dict(self.env)
        env.pop("LESSON_TEST_QUESTIONS_ROOT")
        env["LESSON_TEST_QUESTIONS_OFFLINE"] = "1"
        result = run("--subject", "maths", "--year", "4", "--query", "round to the nearest 100",
                     "--into", self.into, env=env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("TEST_QUESTION_UNAVAILABLE", result.stdout)
        self.assertIn("not seen", result.stdout)


class TheIndexNeverPromisesWhatTheBankCannotAnswer(unittest.TestCase):
    def test_a_question_with_no_answer_is_left_out_of_the_index(self) -> None:
        import tempfile

        tmp = Path(tempfile.mkdtemp())
        bank = tmp / "bank"
        make_bank(bank, [
            ("year-4", "number", "has-an-answer", True, False),
            ("year-4", "number", "has-no-answer-at-all", False, False),
        ])
        index = tmp / "index.txt.gz"
        built = subprocess.run(
            ["node", str(BUILD_INDEX), "--bank", str(bank), "--out", str(index)],
            capture_output=True, text=True, cwd=str(ROOT),
        )
        self.assertEqual(built.returncode, 0, built.stderr)
        listed = gzip.decompress(index.read_bytes()).decode("utf8")
        self.assertIn("has-an-answer", listed)
        self.assertNotIn("has-no-answer-at-all", listed)
        self.assertIn("Left out 1 question", built.stderr)


class TheShippedIndex(unittest.TestCase):
    def test_it_exists_and_every_line_is_a_real_question_with_an_answer(self) -> None:
        self.assertTrue(SHIPPED_INDEX.exists(), "the plugin ships no question index")
        lines = [
            line for line in
            gzip.decompress(SHIPPED_INDEX.read_bytes()).decode("utf8").splitlines()
            if line.strip()
        ]
        self.assertGreater(len(lines), 1000)
        import re

        pattern = re.compile(
            r"^year-[1-6]/(?:geometry|measurement|number|statistics)/"
            r"[a-z0-9]+(?:-[a-z0-9]+)*\.png\t(?:t|p|tp)$"
        )
        for line in lines:
            self.assertRegex(line, pattern)


if __name__ == "__main__":
    unittest.main()
