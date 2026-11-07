"""When the picture maker's usage runs out, a real-first picture searches on.

On 6 November 2026 a Year 4 PSHE deck (friendship challenges) went out with
grey "Picture to add" boxes on nine slides. Each real-first picture had the
short search an AI-fallback picture compiles to (one Unsplash round, one
Openverse round), then the maker answered "usage limit reached". "Building
bricks" had returned brick walls; a plain photograph of toy bricks was one
more search away. On a host with no maker the same pictures get the whole
ladder and a plainer stand-in, but the run only learns the maker is spent
after the short search.

The teacher's ruling (6 November 2026): a plainer real photograph is better,
"as long as it makes sense and won't confuse anything", and "the easiest world
would be to have something there rather than me having to do work". The grey
box stays for what no search can find, such as a made picture.

Run:
  python -m pytest scripts/tests/test_picture_usage_spent_ladder.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


compiler = load("usage_ladder_compiler", "compile-picture-assignments.py")
validator = load("usage_ladder_validator", "validate-image-scout.py")
search = load("usage_ladder_search", "picture-search.py")

PROMPT = {
    "physical_state": "a loose pile of plastic building bricks with a half-built model beside them",
    "must_avoid": ["logos"],
    "text_rule": "no generated text",
    "composition": "the bricks filling most of the frame",
}
NOTE = "Toy bricks only: there is no half-built model and no table."


def photo(*, mode="ordinary-real", fallback="ai"):
    return {
        "id": "photo-001", "subject": "Colourful plastic building bricks on a classroom table, with a half-built model",
        "pedagogical_constraint": "",
        "teaching_requirement": "Lets the class picture the model challenge on its card.",
        "load_bearing_evidence": ["a pile of plastic building bricks", "a half-built model"], "use": "slide",
        "essential": True, "filename": "unsplash/building-bricks-table.jpg", "acquisition_mode": mode,
        "source_profile": "none" if mode == "controlled-ai" else "unsplash-then-wikimedia", "fallback_action": fallback,
        "fallback_note": "a generated record would misteach" if mode == "authentic-real" else None,
        "generation_prompt": PROMPT if fallback == "ai" or mode == "controlled-ai" else None,
        "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": [],
    }


class Fixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"; self.working.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def compile(self, generation_available=True, **overrides):
        p = photo(**overrides)
        req = self.root / "requirements.json"
        req.write_text(json.dumps({"schema_version": 2, "lesson_name": "PSHE", "photos": [p]}) + "\n", encoding="utf-8")
        assignment = compiler.build_assignment(req, [p], "p1", "p", self.root / "assignments", self.working,
                                               generation_available=generation_available)
        path = self.root / "assignment.json"
        path.write_text(json.dumps(assignment, indent=2) + "\n", encoding="utf-8")
        entry = assignment["entries"][0]
        args = SimpleNamespace(assignment=str(path), result=str(self.root / "result.json"), working_dir=str(self.working),
                               work_root=assignment["work_root"], expected_batch_id="p1", expected_filename=[p["filename"]])
        return assignment, entry, args

    def spend_usage(self, entry):
        ledger = Path(entry["ai_ledger_path"])
        ledger.parent.mkdir(parents=True, exist_ok=True)
        ledger.write_text(json.dumps({"schema_version": 1, "filename": entry["filename"], "events": [
            {"event": "reserved", "attempt": 1, "purpose": "initial", "prompt": "x", "reserved_at": 1.0},
            {"event": "interrupted", "attempt": 1, "reason": "imagegen_usage_spent"},
        ]}) + "\n", encoding="utf-8")

    def summary(self, step, with_candidate=False):
        path = Path(step["summary_path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        results = []
        if with_candidate:
            image = path.parent / "toy bricks_1.png"
            Image.new("RGB", (12, 9), "red").save(image, format="PNG")
            results.append({
                "candidate_id": "bricks-1", "sha256": hashlib.sha256(image.read_bytes()).hexdigest(),
                "byte_count": image.stat().st_size, "width": 12, "height": 9, "decoded_format": "PNG",
                "source": step["source"], "source_page_url": "https://commons.wikimedia.org/wiki/File:Toy_bricks.jpg",
                "creator": "Someone",
                "licence_name": "Unsplash License" if step["source"] == "unsplash" else "CC BY-SA 3.0",
                "licence_url": ("https://unsplash.com/license" if step["source"] == "unsplash"
                                else "https://creativecommons.org/licenses/by-sa/3.0/"),
                "description": "Toy plastic bricks", "path": str(image),
            })
        path.write_text(json.dumps({"query": "toy bricks", "source": step["source"], "round": step["round"],
                                    "complete": True, "requested_count": step["candidate_count"],
                                    "results": results, "failure_kind": None}) + "\n", encoding="utf-8")

    def walk(self, steps, winner=None):
        for index, step in enumerate(steps):
            self.summary(step, with_candidate=index == winner)

    def write(self, args, row):
        Path(args.result).write_text(json.dumps({"schema_version": 2, "kind": "image", "batch_id": "p1",
                                                 "entries": [row]}) + "\n", encoding="utf-8")

    def sourced(self, args, entry, step, **extra):
        self.write(args, {"filename": entry["filename"], "status": "sourced",
                          "selection": {"summary_path": step["summary_path"], "candidate_id": "bricks-1"},
                          "staging_path": None, "reason": None, **extra})

    def spent(self, args, entry):
        self.write(args, {"filename": entry["filename"], "status": "unsatisfied", "selection": None,
                          "staging_path": None, "reason": "imagegen_usage_spent"})


class TheRestOfTheLadderIsCompiled(Fixture):
    def test_a_real_first_picture_that_can_be_made_carries_the_rest_of_its_ladder(self):
        _, entry, _ = self.compile()
        short = {(s["source"], s["round"]) for s in entry["search_schedule"]}
        extra = entry["usage_spent_schedule"]
        self.assertTrue(extra)
        self.assertFalse(short & {(s["source"], s["round"]) for s in extra}, "no step is walked twice")
        # Together they are the ladder a host with no maker would have walked.
        no_maker = {(s["source"], s["round"]) for s in compiler.source_schedule(photo(), False)}
        self.assertEqual(short | {(s["source"], s["round"]) for s in extra}, no_maker)
        self.assertIn("web", {s["source"] for s in extra})

    def test_nothing_extra_where_the_short_schedule_is_the_whole_story(self):
        for label, kwargs in (
            ("no maker on this host", {"generation_available": False}),
            ("a made picture", {"mode": "controlled-ai", "fallback": "unsatisfied"}),
            ("a particular real thing", {"mode": "authentic-real", "fallback": "unsatisfied"}),
        ):
            with self.subTest(label):
                _, entry, _ = self.compile(**kwargs)
                self.assertNotIn("usage_spent_schedule", entry)


class TheCheckFollowsTheSpentUsage(Fixture):
    def test_a_plainer_stand_in_after_the_whole_ladder_is_accepted(self):
        _, entry, args = self.compile()
        self.spend_usage(entry)
        steps = entry["search_schedule"] + entry["usage_spent_schedule"]
        self.walk(steps, winner=0)
        self.sourced(args, entry, steps[0], stand_in=NOTE)
        validator.validate_result(args)

    def test_a_faithful_photograph_from_a_further_step_is_accepted(self):
        _, entry, args = self.compile()
        self.spend_usage(entry)
        steps = entry["search_schedule"] + entry["usage_spent_schedule"]
        found = len(entry["search_schedule"])
        self.walk(steps[: found + 1], winner=found)
        self.sourced(args, entry, steps[found])
        validator.validate_result(args)

    def test_with_usage_left_the_picture_is_made_not_stood_in(self):
        _, entry, args = self.compile()
        steps = entry["search_schedule"] + entry["usage_spent_schedule"]
        self.walk(steps, winner=0)
        self.sourced(args, entry, steps[0], stand_in=NOTE)
        with self.assertRaisesRegex(validator.ValidationError, "generate it"):
            validator.validate_result(args)

    def test_with_usage_left_a_further_step_is_not_a_compiled_path(self):
        _, entry, args = self.compile()
        steps = entry["search_schedule"] + entry["usage_spent_schedule"]
        found = len(entry["search_schedule"])
        self.walk(steps[: found + 1], winner=found)
        self.sourced(args, entry, steps[found])
        with self.assertRaisesRegex(validator.ValidationError, "compiled schedule path"):
            validator.validate_result(args)

    def test_a_stand_in_still_waits_for_the_whole_ladder(self):
        _, entry, args = self.compile()
        self.spend_usage(entry)
        steps = entry["search_schedule"] + entry["usage_spent_schedule"]
        self.walk(steps[:-1], winner=0)
        self.sourced(args, entry, steps[0], stand_in=NOTE)
        with self.assertRaisesRegex(validator.ValidationError, "every compiled search step"):
            validator.validate_result(args)

    def test_a_grey_box_only_after_the_rest_of_the_search(self):
        """The 6 November case: short search, spent maker, straight to a grey box."""
        _, entry, args = self.compile()
        self.spend_usage(entry)
        self.walk(entry["search_schedule"])
        self.spent(args, entry)
        with self.assertRaisesRegex(validator.ValidationError, "usage_spent_schedule"):
            validator.validate_result(args)
        self.walk(entry["usage_spent_schedule"])
        validator.validate_result(args)

    def test_a_made_picture_is_a_grey_box_at_once(self):
        _, entry, args = self.compile(mode="controlled-ai", fallback="unsatisfied")
        self.spend_usage(entry)
        self.spent(args, entry)
        validator.validate_result(args)


class TheSearchToolOffersTheRest(Fixture):
    def test_the_further_steps_appear_only_once_the_usage_is_spent(self):
        assignment, entry, _ = self.compile()
        before, open_before = search.entry_ladder(assignment, entry)
        self.assertEqual(before, entry["search_schedule"])
        self.assertFalse(open_before)
        self.walk(entry["search_schedule"])
        self.assertIn("generate it", search.describe_next(entry, before, open_before))

        self.spend_usage(entry)
        after, open_after = search.entry_ladder(assignment, entry)
        self.assertTrue(open_after)
        self.assertEqual(after, entry["search_schedule"] + entry["usage_spent_schedule"])
        index, step, _ = search.next_step(after)
        self.assertEqual(step, entry["usage_spent_schedule"][0])

        self.walk(after)
        last = search.describe_next(entry, after, open_after)
        self.assertIn("stand-in", last)
        self.assertIn("imagegen_usage_spent", last)


class TheScoutIsToldToSearchOn(unittest.TestCase):
    def test_the_generation_reference_sends_a_real_first_picture_on(self):
        text = " ".join((ROOT / "references" / "image-scout-generation.md").read_text(encoding="utf-8").split())
        self.assertIn("--reason imagegen_usage_spent", text)
        self.assertIn("`usage_spent_schedule`", text)
        self.assertIn("image-scout-stand-in.md", text)

    def test_the_stand_in_reference_is_read_after_a_spent_usage(self):
        text = " ".join((ROOT / "references" / "image-scout-stand-in.md").read_text(encoding="utf-8").split())
        self.assertIn("usage is used up", text)
        self.assertIn("`usage_spent_schedule`", text)


if __name__ == "__main__":
    unittest.main()
