"""A plainer photograph of the same thing beats a blank, and the teacher is told.

In the 7 October 2026 stress test a Year 3 rocks lesson on Claude Code, which
has no image generator, asked for water being poured onto a kitchen sponge.
Nobody photographs that. The scout found a large, free photograph of a dry
kitchen sponge and had to refuse it, because acceptance was all or nothing, so
the "permeable" card went out with nothing beside it. The same lesson's retry,
with the photo site answering again, still found no pouring water: the spent
allowance had made the loss look like an outage when it was a picture that does
not exist.

The teacher's rulings (10 October 2026): the plain sponge is better than the
blank; a pot plant on the "roots" card is still better than a blank, because he
can describe what is missing; the one exception is a picture children read
their answers from, where a near photograph would make the answers wrong. And
when the allowance is spent the run finishes and says so, with no waiting and
no second search at the end.

Run:
  python -m pytest scripts/tests/test_picture_stand_in.py
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


compiler = load("stand_in_compiler", "compile-picture-assignments.py")
validator = load("stand_in_validator", "validate-image-scout.py")
from test_finalize_picture_assignment import FinalizerFixture, finalizer  # noqa: E402

PROMPT = {
    "physical_state": "a dry kitchen sponge with a thin stream of water landing on it",
    "must_avoid": ["soap suds"],
    "text_rule": "no generated text",
    "composition": "the sponge filling most of the frame",
}
NOTE = "A dry sponge: no water is being poured onto it."


def photo(*, mode="ordinary-real", fallback="ai"):
    return {
        "id": "photo-001", "subject": "Water being poured onto a kitchen sponge and soaking into it",
        "pedagogical_constraint": "",
        "teaching_requirement": "a familiar thing that lets water soak in, beside the word permeable",
        "load_bearing_evidence": ["a kitchen sponge", "water landing on it and soaking in"], "use": "slide",
        "essential": True, "filename": "unsplash/water-soaking-into-sponge.jpg", "acquisition_mode": mode,
        "source_profile": "unsplash-then-wikimedia", "fallback_action": fallback,
        "fallback_note": "a generated record would misteach" if mode == "authentic-real" else None,
        "generation_prompt": PROMPT if fallback == "ai" else None,
        "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": [],
    }


class TheScoutMayTakeAPlainerPhotograph(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"; self.working.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def fixture(self, generation_available=False, **overrides):
        p = photo(**overrides)
        req = self.root / "requirements.json"
        req.write_text(json.dumps({"schema_version": 2, "lesson_name": "Rocks", "photos": [p]}) + "\n", encoding="utf-8")
        assignment = compiler.build_assignment(req, [p], "p1", "p", self.root / "assignments", self.working,
                                               generation_available=generation_available)
        path = self.root / "assignment.json"
        path.write_text(json.dumps(assignment, indent=2) + "\n", encoding="utf-8")
        entry = assignment["entries"][0]
        args = SimpleNamespace(assignment=str(path), result=str(self.root / "result.json"), working_dir=str(self.working),
                               work_root=assignment["work_root"], expected_batch_id="p1", expected_filename=[p["filename"]])
        return entry, args

    def summary(self, step, complete=True, failure_kind=None, with_candidate=False):
        path = Path(step["summary_path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        results = []
        if with_candidate:
            image = path.parent / "kitchen sponge_1.png"
            Image.new("RGB", (12, 9), "orange").save(image, format="PNG")
            results.append({
                "candidate_id": "sponge-1", "sha256": hashlib.sha256(image.read_bytes()).hexdigest(),
                "byte_count": image.stat().st_size, "width": 12, "height": 9, "decoded_format": "PNG",
                "source": step["source"], "source_page_url": "https://commons.wikimedia.org/wiki/File:Sponge-viscose.jpg",
                "creator": "Johan",
                "licence_name": "Unsplash License" if step["source"] == "unsplash" else "CC BY-SA 3.0",
                "licence_url": ("https://unsplash.com/license" if step["source"] == "unsplash"
                                else "https://creativecommons.org/licenses/by-sa/3.0/"),
                "description": "Dry synthetic household sponge", "path": str(image),
            })
        path.write_text(json.dumps({"query": "kitchen sponge", "source": step["source"], "round": step["round"],
                                    "complete": complete, "requested_count": step["candidate_count"],
                                    "results": results, "failure_kind": failure_kind}) + "\n", encoding="utf-8")

    def walk(self, schedule, winner, skip=(), rate_limited=()):
        """Leave every rung answered, with the plain sponge sitting on `winner`."""
        for index, step in enumerate(schedule):
            if index in skip:
                continue
            if index in rate_limited:
                self.summary(step, complete=False, failure_kind="rate_limit")
            else:
                self.summary(step, with_candidate=index == winner)

    def result(self, args, entry, step, **extra):
        row = {"filename": entry["filename"], "status": "sourced",
               "selection": {"summary_path": step["summary_path"], "candidate_id": "sponge-1"},
               "staging_path": None, "reason": None, **extra}
        Path(args.result).write_text(json.dumps({"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": [row]}) + "\n", encoding="utf-8")

    def wikimedia(self, schedule):
        return next(i for i, s in enumerate(schedule) if s["source"] == "wikimedia")

    def test_the_plain_sponge_is_accepted_from_an_earlier_rung(self):
        """The stress-test case: found early, the rest of the ladder walked, Unsplash spent."""
        entry, args = self.fixture()
        schedule = entry["search_schedule"]; found = self.wikimedia(schedule)
        self.walk(schedule, found, rate_limited=(0,))
        self.result(args, entry, schedule[found], stand_in=NOTE)
        validator.validate_result(args)

    def test_without_the_note_an_earlier_rung_is_still_refused(self):
        """Undo the repair and this is the only outcome: the sponge cannot be taken."""
        entry, args = self.fixture()
        schedule = entry["search_schedule"]; found = self.wikimedia(schedule)
        self.walk(schedule, found)
        self.result(args, entry, schedule[found])
        with self.assertRaisesRegex(validator.ValidationError, "later search exists"):
            validator.validate_result(args)

    def test_a_stand_in_waits_for_the_whole_ladder(self):
        """It is the last resort: the exact picture may be on the rung not yet walked."""
        entry, args = self.fixture()
        schedule = entry["search_schedule"]; found = self.wikimedia(schedule)
        self.walk(schedule, found, skip=(len(schedule) - 1,))
        self.result(args, entry, schedule[found], stand_in=NOTE)
        with self.assertRaisesRegex(validator.ValidationError, "every compiled search step"):
            validator.validate_result(args)

    def test_a_picture_that_can_be_generated_is_generated(self):
        entry, args = self.fixture(generation_available=True)
        schedule = entry["search_schedule"]
        self.walk(schedule, 0)
        self.result(args, entry, schedule[0], stand_in=NOTE)
        with self.assertRaisesRegex(validator.ValidationError, "generate it"):
            validator.validate_result(args)

    def test_a_particular_real_thing_never_takes_a_stand_in(self):
        entry, args = self.fixture(mode="authentic-real", fallback="unsatisfied")
        schedule = entry["search_schedule"]
        self.walk(schedule, 0)
        self.result(args, entry, schedule[0], stand_in=NOTE)
        with self.assertRaisesRegex(validator.ValidationError, "would misteach"):
            validator.validate_result(args)

    def test_the_note_says_something_and_sits_only_on_a_found_picture(self):
        entry, args = self.fixture()
        schedule = entry["search_schedule"]; found = self.wikimedia(schedule)
        self.walk(schedule, found)
        for bad in ("", "   ", "x" * 201, None, 3):
            with self.subTest(note=bad):
                self.result(args, entry, schedule[found], stand_in=bad)
                with self.assertRaisesRegex(validator.ValidationError, "one plain sentence"):
                    validator.validate_result(args)
        row = {"filename": entry["filename"], "status": "unsatisfied", "selection": None,
               "staging_path": None, "reason": "no_faithful_real_match", "stand_in": NOTE}
        Path(args.result).write_text(json.dumps({"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": [row]}) + "\n", encoding="utf-8")
        with self.assertRaisesRegex(validator.ValidationError, "only on a sourced row"):
            validator.validate_result(args)

    def test_an_ordinary_result_is_checked_exactly_as_before(self):
        """A healthy run: the first rung answers, nothing later is walked, no note."""
        entry, args = self.fixture()
        schedule = entry["search_schedule"]
        self.summary(schedule[0], with_candidate=True)
        self.result(args, entry, schedule[0])
        validator.validate_result(args)
        self.result(args, entry, schedule[0], other="field")
        with self.assertRaisesRegex(validator.ValidationError, "forbidden or missing fields"):
            validator.validate_result(args)


class TheTeacherIsTold(FinalizerFixture):
    def finalize(self, assignment, path, rows, publisher=None):
        out = io.StringIO()
        # Telling Unsplash a photograph was used is a real call; not from a test.
        with contextlib.redirect_stdout(out), mock.patch.object(finalizer, "record_unsplash_use"):
            code, _, summary = self.run_assignment(assignment, path, rows, publisher=publisher)
        return code, out.getvalue(), json.loads(summary.read_text(encoding="utf-8"))

    def spent_search(self, assignment, path, index, kind="rate_limit", complete=False):
        summary = self.root / "batch" / f"search-{index}.json"
        summary.write_text(json.dumps({"query": "sponge", "source": "unsplash", "round": 1, "complete": complete,
                                       "requested_count": 3, "results": [], "failure_kind": kind}) + "\n", encoding="utf-8")
        assignment["entries"][index]["search_schedule"] = [{"source": "unsplash", "round": 1, "candidate_count": 3, "summary_path": str(summary)}]
        path.write_text(json.dumps(assignment) + "\n", encoding="utf-8")

    def test_a_stand_in_is_named_with_what_it_lacks(self):
        req, assignment, path, photos = self.make_assignment()
        name = photos[0]["filename"]
        rows = [{"filename": name, "status": "sourced", "selection": self.source_row(name),
                 "staging_path": None, "reason": None, "stand_in": NOTE}]
        code, printed, summary = self.finalize(assignment, path, rows, publisher=self.publish_copy([]))
        self.assertEqual(code, 0)
        self.assertIn(f"PICTURE_STAND_IN: {name} - a plainer photograph was used: {NOTE} Say this to the teacher", printed)
        self.assertEqual(summary["entries"][0]["standIn"], NOTE)
        self.assertEqual(summary["entries"][0]["terminalState"], "published")

    def test_an_exact_photograph_says_nothing(self):
        req, assignment, path, photos = self.make_assignment()
        name = photos[0]["filename"]
        rows = [{"filename": name, "status": "sourced", "selection": self.source_row(name),
                 "staging_path": None, "reason": None}]
        code, printed, summary = self.finalize(assignment, path, rows, publisher=self.publish_copy([]))
        self.assertNotIn("PICTURE_STAND_IN", printed)
        self.assertNotIn("standIn", summary["entries"][0])

    def test_a_picture_lost_while_the_allowance_was_spent_says_so(self):
        req, assignment, path, photos = self.make_assignment(("unsplash/a.jpg", "unsplash/b.jpg"))
        self.spent_search(assignment, path, 0)
        self.spent_search(assignment, path, 1, kind=None, complete=True)
        rows = [{"filename": p["filename"], "status": "unsatisfied", "selection": None, "staging_path": None,
                 "reason": reason} for p, reason in zip(photos, ("real_source_unavailable", "no_faithful_real_match"))]
        code, printed, summary = self.finalize(assignment, path, rows)
        self.assertEqual(code, 0)
        self.assertEqual(summary["lostToAllowance"], ["unsplash/a.jpg"])
        self.assertIn("PICTURE_ALLOWANCE_SPENT: unsplash/a.jpg - ", printed)
        self.assertNotIn("unsplash/b.jpg -", printed.split("PICTURE_ALLOWANCE_SPENT:")[1].splitlines()[0])
        self.assertNotIn("allowanceSpent", summary["entries"][1])

    def test_a_picture_found_despite_a_spent_allowance_is_not_reported_lost(self):
        req, assignment, path, photos = self.make_assignment()
        self.spent_search(assignment, path, 0)
        name = photos[0]["filename"]
        rows = [{"filename": name, "status": "sourced", "selection": self.source_row(name),
                 "staging_path": None, "reason": None}]
        code, printed, summary = self.finalize(assignment, path, rows, publisher=self.publish_copy([]))
        self.assertNotIn("PICTURE_ALLOWANCE_SPENT", printed)
        self.assertNotIn("lostToAllowance", summary)


class TheGuidanceReachesItsReaders(unittest.TestCase):
    def read(self, relative):
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_the_scout_is_told_when_and_when_not(self):
        """Its own file is at its size limit, so the rule loads only where it can apply."""
        self.assertEqual(self.read("agents/image-scout.md").count(
            "Read `[PLUGIN_ROOT]/references/image-scout-stand-in.md` when `image_generation` is `unavailable`."), 1)
        text = self.read("references/image-scout-stand-in.md")
        self.assertIn("`stand_in`", text)
        self.assertIn("would make children's answers wrong", text)
        self.assertIn("An `authentic-real` entry never takes a stand-in", text)
        self.assertLessEqual(len(text.encode("utf-8")), 4000)

    def test_the_planner_is_told_how_to_rule_one_out(self):
        self.assertIn("one children take their answers from", self.read("references/output-template.md"))

    def test_every_line_tells_the_run_to_pass_it_on(self):
        """The playbook is at its size limit, so each line carries its own instruction.

        Three: the stand-in, the spent allowance, and a picture kept with a
        blemish (test_picture_choosing.py).
        """
        text = self.read("scripts/finalize-picture-assignment.py")
        self.assertEqual(text.count("to the teacher in the run report's picture results"), 3)


if __name__ == "__main__":
    unittest.main()
