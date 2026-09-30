"""The optional lesson question (preferences.md, `A lesson question, when one
earns its place`): absent or null in most lessons; when present, one question
children read after the starter, its scene line, its one picture and the reason
the lesson earns it. These checks hold the contract the validator enforces and
that the review view and the voice editor's lane both show it."""
from __future__ import annotations

import copy
import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "scripts" / "tests" / "fixtures" / "working-wall-packet" / "geography"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


VALIDATOR = load("lesson_question_validator", "validate-lesson-design.py")
PACKET = load("lesson_question_packet", "design-review-packet.py")


def fixture():
    design = json.loads((FIXTURE / "lesson-design.json").read_text(encoding="utf-8"))
    photos = json.loads((FIXTURE / "photo-requirements.json").read_text(encoding="utf-8"))
    # The fixture's shortened objective predates the displayed-objective rule,
    # which stops the pass before later sections; the full objective lets the
    # lesson question be reached.
    design["lesson"]["displayedLo"] = design["lesson"]["lo"]
    return design, photos


def first_photo(photos) -> str:
    return photos["photos"][0]["id"]


def question(photo_id: str) -> dict:
    return {
        "text": "Why did people build a town exactly where this river bends?",
        "script": "Say to children: Look at this town from the air. Have a think on your own for ten seconds.",
        "photoRefs": [photo_id],
        "reason": "A why-here lesson; the final explanation answers it.",
    }


class TheLessonQuestionContractTests(unittest.TestCase):
    PHOTOS = {"photo-001": {}, "photo-002": {}}

    def refused(self, raw) -> str:
        try:
            VALIDATOR.validate_lesson_question(raw, self.PHOTOS)
        except Exception as exc:  # the validator's ContractError
            return str(exc)
        return ""

    def test_it_is_an_optional_top_level_field(self):
        self.assertIn("lessonQuestion", VALIDATOR.OPTIONAL_TOP_LEVEL_FIELDS)
        self.assertNotIn("lessonQuestion", VALIDATOR.TOP_LEVEL_FIELDS)

    def test_a_good_question_with_its_picture_passes(self):
        self.assertEqual(self.refused(question("photo-001")), "")
        with_scene = question("photo-001")
        with_scene["text"] = "The river bends here. Why did people build a town exactly here?"
        self.assertEqual(self.refused(with_scene), "")

    def test_a_question_is_refused_without_its_question_mark_its_one_picture_or_its_reason(self):
        for name, mutate, phrase in (
            ("no question mark", lambda q: q.update(text="Why towns grow by rivers"), "question mark"),
            ("no picture", lambda q: q.update(photoRefs=[]), "exactly one picture"),
            ("two pictures", lambda q: q.update(photoRefs=["photo-001", "photo-002"]), "exactly one picture"),
            ("unknown picture", lambda q: q.update(photoRefs=["photo-999"]), "names no photo requirement"),
            ("no reason", lambda q: q.update(reason="  "), "reason"),
            ("no script", lambda q: q.update(script=" "), "script"),
            ("an extra field", lambda q: q.update(answer="the river"), "lessonQuestion"),
        ):
            with self.subTest(name=name):
                changed = question("photo-001")
                mutate(changed)
                self.assertIn(phrase, self.refused(changed))

    def test_the_review_view_and_the_voice_lane_show_the_question(self):
        design, photos = fixture()
        design["lessonQuestion"] = question(first_photo(photos))
        blocks = dict(PACKET.class_view_blocks(design))
        self.assertIn("Our question", blocks)
        self.assertIn(design["lessonQuestion"]["text"], blocks["Our question"])
        view = PACKET.build_review_view(design, photos)
        self.assertIn("## Lesson question", view)
        self.assertIn("never ask for one", PACKET.build_review_view(fixture()[0], photos))


if __name__ == "__main__":
    unittest.main()
