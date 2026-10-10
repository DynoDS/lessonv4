"""A picture that is right for the subject and wrong for a classroom.

The 7 October 2026 stress test let these through in 4 of 20 lessons: both
"strong wind" photographs in a Year 2 Great Fire of London lesson were the
stars and stripes; "London in 1666" was a modern York street with shop signs; a
Year 3 slate was a museum shot with its name handwritten on the rock and a
scale bar; an archive's stamp sat in the corner of the Severn estuary, 50mm
wide on the A3 wall sheet.

Three causes. The designer's list of what would spoil each picture
(`must_avoid`, `text_rule`) was compiled only into the generation prompt, so a
searched photograph was judged without it. The scout's checks asked whether the
subject was right and had no order of preference among right pictures. And when
the best picture had a mark on it the scout could only take it or leave a
blank: nothing could trim it and nothing told the teacher.

The teacher's rulings (10 October 2026), each made from the real slide: a clean
picture that teaches as well always wins; a mark at the edge is trimmed off,
unless the trimmed picture looks wrong; otherwise the picture is kept and he is
told. A British flag is fine. Small collection stickers do not matter. A
matching set is a nicety. None of it is ever worth a blank.

Run:
  python -m pytest scripts/tests/test_picture_choosing.py
"""
from __future__ import annotations

import contextlib
import hashlib
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(Path(__file__).resolve().parent))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


compiler = load("choosing_compiler", "compile-picture-assignments.py")
validator = load("choosing_validator", "validate-image-scout.py")
trimmer = load("choosing_trim", "picture_trim.py")
from test_finalize_picture_assignment import FinalizerFixture, finalizer  # noqa: E402

FLAG_PROMPT = {
    "physical_state": "A plain red flag on a tall pole, stretched straight out in a strong wind.",
    "must_avoid": ["people", "more than one flag"],
    "text_rule": "no readable text, emblems or lettering on the flag",
    "composition": "The flag and the top of the pole against the sky, landscape.",
}
STAMP = "The archive's stamp is in the bottom left corner."


def photo(*, mode="ordinary-real", fallback="ai"):
    return {
        "id": "photo-006", "subject": "A flag on a pole blowing straight out in a strong wind",
        "pedagogical_constraint": "One flag, stretched out sideways by the wind.",
        "teaching_requirement": "Children see what a strong wind does before they predict what it did to the fire.",
        "load_bearing_evidence": ["one flag on a pole"], "use": "slide", "essential": True,
        "filename": "unsplash/flag-blowing-in-strong-wind.jpg", "acquisition_mode": mode,
        "source_profile": "unsplash-then-wikimedia", "fallback_action": fallback,
        "fallback_note": "a generated record would misteach" if mode == "authentic-real" else None,
        "generation_prompt": FLAG_PROMPT if fallback == "ai" else None,
        "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": [],
    }


class TheAvoidListReachesASearchedPhotograph(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"; self.working.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def fixture(self, generation_available=True, **overrides):
        p = photo(**overrides)
        req = self.root / "requirements.json"
        req.write_text(json.dumps({"schema_version": 2, "lesson_name": "Great Fire", "photos": [p]}) + "\n", encoding="utf-8")
        assignment = compiler.build_assignment(req, [p], "p1", "p", self.root / "assignments", self.working,
                                               generation_available=generation_available)
        return req, assignment, p

    def check(self, req, assignment, p):
        return validator.validate_assignment_shape(assignment, req, self.working, "p1", [p["filename"]])

    def test_a_real_first_entry_carries_what_the_designer_said_to_avoid(self):
        for available in (True, False):
            with self.subTest(generation_available=available):
                req, assignment, p = self.fixture(generation_available=available)
                entry = assignment["entries"][0]
                self.assertEqual(entry["initial_route"], "real")
                self.assertEqual(entry["avoid"], ["people", "more than one flag",
                                                  "no readable text, emblems or lettering on the flag"])
                self.check(req, assignment, p)

    def test_a_picture_with_no_prompt_has_an_empty_list(self):
        req, assignment, p = self.fixture(mode="authentic-real", fallback="unsatisfied")
        self.assertEqual(assignment["entries"][0]["avoid"], [])
        self.check(req, assignment, p)

    def test_the_list_cannot_be_edited_on_the_way(self):
        req, assignment, p = self.fixture()
        assignment["entries"][0]["avoid"] = ["people"]
        with self.assertRaisesRegex(validator.ValidationError, "avoid changed"):
            self.check(req, assignment, p)

    def test_an_assignment_compiled_before_the_field_still_validates(self):
        """A run resumed across the upgrade holds assignments without it."""
        req, assignment, p = self.fixture()
        del assignment["entries"][0]["avoid"]
        self.check(req, assignment, p)


class TheScoutMayLookFurtherAndComeBack(unittest.TestCase):
    """The first trial of the new guidance (10 October 2026) met this: told to
    look further for a cleaner street, the scout did, found none, went back to
    the first picture, and had to delete its later search to pass the check."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"; self.working.mkdir()
        p = photo()
        req = self.root / "requirements.json"
        req.write_text(json.dumps({"schema_version": 2, "lesson_name": "Great Fire", "photos": [p]}) + "\n", encoding="utf-8")
        assignment = compiler.build_assignment(req, [p], "p1", "p", self.root / "assignments", self.working)
        path = self.root / "assignment.json"
        path.write_text(json.dumps(assignment, indent=2) + "\n", encoding="utf-8")
        self.entry = assignment["entries"][0]
        self.args = SimpleNamespace(assignment=str(path), result=str(self.root / "result.json"), working_dir=str(self.working),
                                    work_root=assignment["work_root"], expected_batch_id="p1", expected_filename=[p["filename"]])
        first, second = self.entry["search_schedule"][:2]
        self.summary(first, with_candidate=True)
        self.summary(second)
        self.first = first

    def tearDown(self):
        self.temp.cleanup()

    def summary(self, step, with_candidate=False):
        path = Path(step["summary_path"]); path.parent.mkdir(parents=True, exist_ok=True)
        results = []
        if with_candidate:
            image = path.parent / "flag_1.png"
            Image.new("RGB", (12, 9), "red").save(image, format="PNG")
            results.append({
                "candidate_id": "flag-1", "sha256": hashlib.sha256(image.read_bytes()).hexdigest(),
                "byte_count": image.stat().st_size, "width": 12, "height": 9, "decoded_format": "PNG",
                "source": step["source"], "source_page_url": "https://unsplash.com/photos/example", "creator": "Someone",
                "licence_name": "Unsplash License", "licence_url": "https://unsplash.com/license",
                "description": "US flag", "path": str(image),
            })
        path.write_text(json.dumps({"query": "flag wind", "source": step["source"], "round": step["round"], "complete": True,
                                    "requested_count": step["candidate_count"], "results": results, "failure_kind": None}) + "\n", encoding="utf-8")

    def result(self, **extra):
        row = {"filename": self.entry["filename"], "status": "sourced",
               "selection": {"summary_path": self.first["summary_path"], "candidate_id": "flag-1"},
               "staging_path": None, "reason": None, **extra}
        Path(self.args.result).write_text(json.dumps({"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": [row]}) + "\n", encoding="utf-8")

    def test_a_picture_gone_back_to_says_what_is_wrong_with_it(self):
        self.result(blemish="The flag is the American flag.")
        validator.validate_result(self.args)
        self.result(trim={"bottom": 0.2})
        validator.validate_result(self.args)

    def test_a_clean_winner_still_ends_the_search(self):
        self.result()
        with self.assertRaisesRegex(validator.ValidationError, "later search exists"):
            validator.validate_result(self.args)


class TheTrimIsAStripOffTheEdge(unittest.TestCase):
    def test_the_named_strip_is_cut_and_the_rest_is_untouched(self):
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "estuary.png"; out = Path(temp) / "out" / "estuary.png"
            image = Image.new("RGB", (200, 100), "blue")
            for x in range(60):
                for y in range(70, 100):
                    image.putpixel((x, y), (255, 255, 255))  # the stamp
            image.save(source)
            self.assertEqual(trimmer.trim_file(source, out, {"bottom": 0.3}), (200, 70))
            with Image.open(out) as cut:
                self.assertEqual(cut.size, (200, 70))
                self.assertEqual(set(cut.getdata()), {(0, 0, 255)})
            with Image.open(source) as whole:
                self.assertEqual(whole.size, (200, 100))

    def test_a_trim_that_is_really_a_different_picture_is_refused(self):
        for bad in ({}, {"bottom": 0}, {"bottom": 0.45}, {"top": 0.3, "bottom": 0.3}, {"middle": 0.1},
                    {"left": "0.2"}, {"left": True}, {"left": -0.1}, [0.1], None):
            with self.subTest(trim=bad), self.assertRaises(trimmer.TrimError):
                trimmer.checked(bad)

    def test_the_result_validator_reads_the_same_rule(self):
        base = {"filename": "unsplash/a.jpg", "selection": None, "staging_path": None, "reason": None}
        validator.validate_kept_picture_notes({**base, "status": "sourced", "trim": {"bottom": 0.3}, "blemish": STAMP}, "a")
        validator.validate_kept_picture_notes({**base, "status": "generated", "trim": {"left": 0.1}}, "a")
        validator.validate_kept_picture_notes({**base, "status": "sourced"}, "a")
        for row, message in (
            ({**base, "status": "sourced", "trim": {"bottom": 0.9}}, "fraction from 0 to"),
            ({**base, "status": "unsatisfied", "trim": {"bottom": 0.2}}, "delivers a picture"),
            ({**base, "status": "omitted", "blemish": STAMP}, "delivers a picture"),
            ({**base, "status": "sourced", "blemish": ""}, "one plain sentence"),
            ({**base, "status": "sourced", "blemish": "x" * 201}, "one plain sentence"),
        ):
            with self.subTest(row=row), self.assertRaisesRegex(validator.ValidationError, message):
                validator.validate_kept_picture_notes(row, "a")


class TheFinaliserCutsOnceAndTellsTheTeacher(FinalizerFixture):
    def finalize(self, assignment, path, rows, publisher=None):
        out = io.StringIO()
        with contextlib.redirect_stdout(out), mock.patch.object(finalizer, "record_unsplash_use"):
            code, _, summary = self.run_assignment(assignment, path, rows, publisher=publisher)
        return code, out.getvalue(), json.loads(summary.read_text(encoding="utf-8"))

    def real_picture(self, selection):
        """Put a real 200 x 100 image where the fixture left placeholder bytes."""
        summary_path = Path(selection["summary_path"])
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
        candidate = summary["results"][0]
        Image.new("RGB", (200, 100), "blue").save(candidate["path"], format="PNG")
        data = Path(candidate["path"]).read_bytes()
        candidate.update(sha256=hashlib.sha256(data).hexdigest(), byte_count=len(data), width=200, height=100)
        summary_path.write_text(json.dumps(summary) + "\n", encoding="utf-8")
        return Path(candidate["path"])

    def row(self, name, selection, **extra):
        return {"filename": name, "status": "sourced", "selection": selection, "staging_path": None, "reason": None, **extra}

    def test_the_published_file_is_the_trimmed_one_and_the_candidate_is_kept_whole(self):
        req, assignment, path, photos = self.make_assignment()
        name = photos[0]["filename"]
        selection = self.source_row(name)
        candidate = self.real_picture(selection)
        code, printed, summary = self.finalize(assignment, path, [self.row(name, selection, trim={"bottom": 0.3})],
                                               publisher=self.publish_copy([]))
        self.assertEqual(code, 0)
        with Image.open(self.working / name) as published:
            self.assertEqual(published.size, (200, 70))
        with Image.open(candidate) as whole:
            self.assertEqual(whole.size, (200, 100))
        self.assertIs(summary["entries"][0]["trimmed"], True)
        self.assertNotIn("PICTURE_BLEMISH", printed)

    def test_a_trim_that_cannot_be_made_still_publishes_the_picture(self):
        """Never worth a blank: the fixture's placeholder bytes are not an image."""
        req, assignment, path, photos = self.make_assignment()
        name = photos[0]["filename"]
        code, printed, summary = self.finalize(assignment, path, [self.row(name, self.source_row(name), trim={"bottom": 0.3})],
                                               publisher=self.publish_copy([]))
        self.assertEqual(code, 0)
        self.assertEqual(summary["entries"][0]["terminalState"], "published")
        self.assertIs(summary["entries"][0]["trimmed"], False)
        self.assertIn(f"PICTURE_TRIM_SKIPPED: {name} - published whole", printed)
        self.assertEqual((self.working / name).read_bytes(), b"real-image-bytes")

    def test_a_kept_blemish_is_said_in_the_scouts_words(self):
        req, assignment, path, photos = self.make_assignment()
        name = photos[0]["filename"]
        code, printed, summary = self.finalize(assignment, path, [self.row(name, self.source_row(name), blemish=STAMP)],
                                               publisher=self.publish_copy([]))
        self.assertEqual(code, 0)
        self.assertIn(f"PICTURE_BLEMISH: {name} - kept as the best picture available: {STAMP} Say this to the teacher", printed)
        self.assertEqual(summary["entries"][0]["blemish"], STAMP)

    def test_a_clean_picture_says_nothing(self):
        req, assignment, path, photos = self.make_assignment()
        name = photos[0]["filename"]
        code, printed, summary = self.finalize(assignment, path, [self.row(name, self.source_row(name))],
                                               publisher=self.publish_copy([]))
        self.assertNotIn("PICTURE_BLEMISH", printed)
        self.assertNotIn("PICTURE_TRIM", printed)
        self.assertNotIn("blemish", summary["entries"][0])
        self.assertNotIn("trimmed", summary["entries"][0])


class TheGuidanceReachesItsReaders(unittest.TestCase):
    def read(self, relative):
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_the_scout_reads_it_before_accepting_anything(self):
        self.assertEqual(self.read("agents/image-scout.md").count(
            "Read `[PLUGIN_ROOT]/references/image-scout-choosing.md` before you accept any picture."), 1)
        self.assertLessEqual(len(self.read("references/image-scout-choosing.md").encode("utf-8")), 5000)

    def test_every_preference_is_a_preference(self):
        """The ruling behind all of it: better fixed, never worth a blank."""
        text = self.read("references/image-scout-choosing.md")
        self.assertIn("nothing in this file turns a found picture into `unsatisfied` or `omitted`", text)
        for field in ("`avoid`", '"trim"', '"blemish"', "picture_trim.py"):
            self.assertIn(field, text)
        self.assertIn("A clean picture that teaches as well always wins", text)
        self.assertIn("does not require", text)

    def test_the_planner_is_told_what_the_scout_cannot_guess(self):
        text = self.read("references/output-template.md")
        self.assertIn("are read for a photograph that is searched for as well as for one that is generated", text)
        self.assertIn("stands for a child the lesson names", text)
        self.assertIn("a picture made at the time", text)


if __name__ == "__main__":
    unittest.main()
