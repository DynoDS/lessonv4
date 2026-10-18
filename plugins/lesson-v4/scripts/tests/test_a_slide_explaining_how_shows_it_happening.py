"""A beat that explains how something happens names its own picture of it.

The teacher ruled on 18 October 2026 that children look at the picture first
while the words are read, so a slide explaining how something happens shows it
happening. In five test runs that day every designer read the rule, and on
lessons the rule's examples did not mention it landed once in three: a food
chains deck put its sunlit grass photograph on the slide explaining how grass
makes its food, and a digestion deck kept one labelled diagram on every board
while the words said the oesophagus squeezes and the stomach churns. Both
pictures had already been chosen for something else, and nothing wrote the
decision down where a check could see it.

These hold the repair: the `seesHappening` line, the validator's own-picture
rule (a diagram counts as used in any configuration), the photo request's
`Shows it happening:` opening, and the stand-in the picture finaliser uses
instead of a redesign when the made picture never arrives.
"""
from __future__ import annotations

import importlib.util
import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


validator = load("validate_lesson_design_happening", "validate-lesson-design.py")
finalize = load("finalize_picture_assignment_happening", "finalize-picture-assignment.py")


def entry(photo=None, rep=None, stand_in=None, see="sunlight going into the leaves, so the grass makes food"):
    return {"see": see, "photoRef": photo, "representationRef": rep, "standInPhotoRef": stand_in}


def unit(photos=(), reps=(), sees=()):
    return {
        "photoRefs": list(photos),
        "representationRefs": [{"ref": r, "configuration": c, "interaction": "view"} for r, c in reps],
        "seesHappening": list(sees),
    }


PHOTOS = {
    "photo-001": {"pedagogical_constraint": "Children say where the rabbit's food comes from."},
    "photo-002": {"pedagogical_constraint": "Shows it happening: sunlight into the leaves, water up the roots."},
    "photo-003": {"pedagogical_constraint": "The producer at the start of the chain."},
}


class ShapeOfTheLine(unittest.TestCase):
    def check(self, sees, photos=("photo-001", "photo-002"), reps=()):
        validator.validate_sees_happening_shape(
            sees, "u.seesHappening",
            unit_photo_refs=set(photos),
            unit_representation_refs=[{"ref": r, "configuration": c, "interaction": "view"} for r, c in reps],
            photo_ids=set(PHOTOS),
        )

    def test_a_photo_line_with_a_stand_in_reads(self):
        self.check([entry(photo="photo-002", stand_in="photo-003")])

    def test_an_empty_line_is_the_ordinary_beat(self):
        self.check([])

    def test_it_names_exactly_one_picture(self):
        with self.assertRaises(validator.ContractError):
            self.check([entry()])
        with self.assertRaises(validator.ContractError):
            self.check([entry(photo="photo-002", rep={"ref": "rep-001", "configuration": "a"})], reps=[("rep-001", "a")])

    def test_the_picture_is_one_of_this_beats_own(self):
        with self.assertRaises(validator.ContractError):
            self.check([entry(photo="photo-003")])

    def test_a_drawn_helper_takes_no_stand_in(self):
        with self.assertRaises(validator.ContractError):
            self.check([entry(rep={"ref": "rep-001", "configuration": "a"}, stand_in="photo-003")], reps=[("rep-001", "a")])


class ItsOwnPicture(unittest.TestCase):
    def test_the_grass_photo_reused_from_the_slide_before_is_refused(self):
        sequence = [
            unit(photos=["photo-001", "photo-003"]),
            unit(photos=["photo-003"], sees=[entry(photo="photo-003")]),
        ]
        photos = {**PHOTOS, "photo-003": {"pedagogical_constraint": "Shows it happening: grass."}}
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_sees_happening_has_its_own_picture(sequence, photos)
        self.assertIn("already on an earlier beat", str(caught.exception))

    def test_a_diagram_gaining_a_label_per_slide_is_still_the_same_diagram(self):
        sequence = [
            unit(reps=[("rep-001", "top")]),
            unit(reps=[("rep-001", "stomach")], sees=[entry(rep={"ref": "rep-001", "configuration": "stomach"})]),
        ]
        with self.assertRaises(validator.ContractError):
            validator.validate_sees_happening_has_its_own_picture(sequence, PHOTOS)

    def test_a_new_made_picture_reads_and_may_return_later(self):
        sequence = [
            unit(photos=["photo-001"]),
            unit(photos=["photo-001", "photo-002"], sees=[entry(photo="photo-002", stand_in="photo-003")]),
            unit(photos=["photo-002", "photo-003"]),
        ]
        validator.validate_sees_happening_has_its_own_picture(sequence, PHOTOS)

    def test_the_request_says_it_shows_it_happening(self):
        sequence = [unit(photos=["photo-001"], sees=[entry(photo="photo-001")])]
        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_sees_happening_has_its_own_picture(sequence, PHOTOS)
        self.assertIn("Shows it happening:", str(caught.exception))

    def test_a_route_lesson_with_no_line_is_left_alone(self):
        sequence = [unit(photos=["photo-001"]), unit(photos=["photo-001", "photo-003"])]
        validator.validate_sees_happening_has_its_own_picture(sequence, PHOTOS)

    def test_a_beat_is_allowed_to_carry_the_field(self):
        self.assertIn("seesHappening", validator.UNIT_OPTIONAL_FIELDS)


class TheStandIn(unittest.TestCase):
    def test_the_finaliser_reads_the_stand_in_from_the_working_folder(self):
        with tempfile.TemporaryDirectory() as folder:
            working = Path(folder)
            (working / "lesson-design.json").write_text(json.dumps({"teachingSequence": [
                unit(photos=["photo-002"], sees=[entry(photo="photo-002", stand_in="photo-003")]),
            ]}), encoding="utf-8")
            (working / "photo-requirements.json").write_text(json.dumps({"photos": [
                {"id": "photo-002", "filename": "generated/grass-making-food.png"},
                {"id": "photo-003", "filename": "unsplash/grass.jpg"},
            ]}), encoding="utf-8")
            found = finalize.happening_stand_ins(working)
        self.assertEqual(found["generated/grass-making-food.png"][0], "unsplash/grass.jpg")

    def test_a_folder_without_a_design_names_no_stand_ins(self):
        with tempfile.TemporaryDirectory() as folder:
            self.assertEqual(finalize.happening_stand_ins(Path(folder)), {})


class TheScaffold(unittest.TestCase):
    def test_every_beat_starts_with_an_empty_line(self):
        text = (SCRIPTS / "lesson-design-scaffold.py").read_text(encoding="utf-8")
        self.assertIn('"seesHappening": []', text)


if __name__ == "__main__":
    unittest.main()
