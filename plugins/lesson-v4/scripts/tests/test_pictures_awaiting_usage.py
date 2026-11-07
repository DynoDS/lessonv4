"""A picture lost because the picture tool's usage ran out waits on the slide.

The teacher's ruling, 6 November 2026: when the picture tool cannot get a
picture because its usage has run out, the slide keeps a grey box that says in
plain words what goes there, and the run leaves a list so he, or a fresh
session once the usage is back, can add it. Only then: "I dont want to see
grey placeholder because we couldnt get picture even though you have usage".
A search that ran properly and found nothing keeps the reconcile it had.

So three things are checked here: the finaliser marks exactly those pictures
(and keeps them out of the content-gap wave), the image scout's validator
accepts the new reason only where a generator could have been spent, and the
slide wrapper hands them to the build and writes the list.
"""
from __future__ import annotations

import importlib.util
import io
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from test_finalize_picture_assignment import FinalizerFixture, finalizer

ROOT = Path(__file__).resolve().parents[2]
WRAPPER = ROOT / "scripts" / "run-fixed-resource.py"


def no_file_row(filename, reason, status="unsatisfied"):
    return {"filename": filename, "status": status, "selection": None,
            "staging_path": None, "reason": reason}


class FinaliserMarksPicturesAwaitingUsage(FinalizerFixture):
    def receipt(self, filename):
        return json.loads(finalizer.receipt_path(self.working, filename).read_text(encoding="utf-8"))

    def test_a_spent_generator_marks_the_picture_and_skips_the_wave(self):
        req, assignment, path, photos = self.make_assignment(
            names=("unsplash/a.jpg",), essential=("unsplash/a.jpg",)
        )
        rows = [no_file_row("unsplash/a.jpg", "imagegen_usage_spent")]
        with mock.patch("sys.stdout", new=io.StringIO()) as out:
            code, _, summary = self.run_assignment(assignment, path, rows)
        printed = out.getvalue()
        self.assertEqual(code, 0)
        self.assertIs(self.receipt("unsplash/a.jpg").get("awaitingUsage"), True)
        self.assertIn("PICTURE_AWAITING_USAGE: unsplash/a.jpg", printed)
        self.assertIn("leave every slide reference", printed)
        # Essential or not, a grey box waiting for usage is not a hole in the
        # teaching to redesign around.
        self.assertNotIn("PICTURE_ESSENTIAL_LOST", printed)

    def test_no_generator_on_this_host_counts_as_no_usage(self):
        req, assignment, path, photos = self.make_assignment(names=("unsplash/a.jpg",))
        rows = [no_file_row("unsplash/a.jpg", "imagegen_capability_unavailable")]
        with mock.patch("sys.stdout", new=io.StringIO()):
            self.run_assignment(assignment, path, rows)
        self.assertIs(self.receipt("unsplash/a.jpg").get("awaitingUsage"), True)

    def test_a_search_that_found_nothing_is_not_marked(self):
        """The limit of the ruling: usage was there, and the reconcile stays."""
        req, assignment, path, photos = self.make_assignment(
            names=("unsplash/a.jpg",), essential=("unsplash/a.jpg",)
        )
        rows = [no_file_row("unsplash/a.jpg", "attempt_budget_exhausted")]
        with mock.patch("sys.stdout", new=io.StringIO()) as out:
            self.run_assignment(assignment, path, rows)
        self.assertNotIn("awaitingUsage", self.receipt("unsplash/a.jpg"))
        self.assertNotIn("PICTURE_AWAITING_USAGE", out.getvalue())
        self.assertIn("PICTURE_ESSENTIAL_LOST", out.getvalue())

    def test_the_mark_is_repeated_on_a_second_pass(self):
        req, assignment, path, photos = self.make_assignment(names=("unsplash/a.jpg",))
        rows = [no_file_row("unsplash/a.jpg", "imagegen_usage_spent")]
        with mock.patch("sys.stdout", new=io.StringIO()):
            self.run_assignment(assignment, path, rows)
        with mock.patch("sys.stdout", new=io.StringIO()) as out:
            self.run_assignment(assignment, path, rows)
        self.assertIn("PICTURE_AWAITING_USAGE: unsplash/a.jpg", out.getvalue())


class SlideBuildDrawsAndListsThem(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "work"
        self.output = self.root / "out"
        (self.working / "orchestration-receipts" / "picture-terminal").mkdir(parents=True)
        lesson = {
            "lessonName": "Grey Box", "yearGroup": "Year 4", "subject": "History",
            "slides": [{
                "template": "body-full", "headerStyle": "title", "title": "Burning tar",
                "body": {"type": "image", "imagePath": "unsplash/lump-of-tar.jpg", "caption": "Tar"},
            }],
        }
        (self.working / "lesson.json").write_text(json.dumps(lesson), encoding="utf-8")
        (self.working / "photo-requirements.json").write_text(json.dumps({"photos": [{
            "filename": "unsplash/lump-of-tar.jpg",
            "subject": "A lump of tar, thick, black and sticky, seen close up",
            "teaching_requirement": "Children see what tar is.",
            "load_bearing_evidence": ["black sticky tar"],
        }]}), encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def receipt(self, **extra):
        payload = {"filename": "unsplash/lump-of-tar.jpg", "terminalState": "unsatisfied",
                   "terminalReason": "imagegen_usage_spent", **extra}
        (self.working / "orchestration-receipts" / "picture-terminal" / "a.json").write_text(
            json.dumps(payload), encoding="utf-8")

    def build(self):
        summary = self.working / "build-results" / "slides.json"
        done = subprocess.run(
            [sys.executable, str(WRAPPER), "slides", "--plugin-root", str(ROOT),
             "--working-dir", str(self.working), "--output-dir", str(self.output),
             "--lesson-name", "Grey Box", "--summary-output", str(summary)],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
        return done, json.loads(summary.read_text(encoding="utf-8"))

    def test_an_awaited_picture_is_a_labelled_box_and_a_list(self):
        self.receipt(awaitingUsage=True)
        done, summary = self.build()
        self.assertTrue(summary["ok"], done.stdout + done.stderr)
        self.assertIn("PICTURE_AWAITING_USAGE:", summary["stdout"])
        self.assertNotIn("SLIDE_PICTURE_MISSING", summary["stdout"] + summary["stderr"])
        self.assertIn("PICTURES_TO_ADD: 1 picture(s)", done.stdout)
        listed = (self.working / "pictures-to-add.md").read_text(encoding="utf-8")
        self.assertIn("A lump of tar, thick, black and sticky", listed)
        self.assertIn("Slide 1", listed)
        self.assertIn(str(self.working / "unsplash/lump-of-tar.jpg"), listed)

    def test_an_unmarked_missing_picture_is_still_a_fault(self):
        """Only the usage case is excused; any other missing picture is flagged."""
        self.receipt()
        done, summary = self.build()
        self.assertIn("SLIDE_PICTURE_MISSING", summary["stdout"] + summary["stderr"])
        self.assertFalse((self.working / "pictures-to-add.md").exists())

    def test_a_picture_added_later_replaces_its_box_and_clears_the_list(self):
        self.receipt(awaitingUsage=True)
        self.build()
        self.assertTrue((self.working / "pictures-to-add.md").is_file())
        from PIL import Image
        picture = self.working / "unsplash" / "lump-of-tar.jpg"
        picture.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (1200, 900), (20, 20, 20)).save(picture)
        done, summary = self.build()
        self.assertTrue(summary["ok"], done.stdout + done.stderr)
        self.assertNotIn("PICTURE_AWAITING_USAGE", summary["stdout"])
        self.assertFalse((self.working / "pictures-to-add.md").exists())


class TheCodexBridgeNamesASpentLimit(unittest.TestCase):
    """On Claude the pictures are made through Codex, and a spent plan answered
    every call with "You've hit your usage limit" (4 November 2026). The bridge
    says so, so the scout can report the reason that gets a grey box."""

    def setUp(self):
        path = ROOT / "scripts" / "codex-imagegen.py"
        spec = importlib.util.spec_from_file_location("codex_imagegen", path)
        self.bridge = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.bridge)
        self.temp = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.temp.cleanup()

    def events(self, text):
        path = Path(self.temp.name) / "codex-events.jsonl"
        path.write_text(text, encoding="utf-8")
        return str(path)

    def test_the_limit_message_is_recognised(self):
        path = self.events(
            '{"type":"error","message":"You\'ve hit your usage limit. Try again at Nov 8th, 2026 9:21 PM."}\n'
        )
        self.assertTrue(self.bridge.usage_spent_in(path))

    def test_an_ordinary_empty_call_is_not(self):
        path = self.events('{"type":"thread.started","thread_id":"x"}\n{"type":"turn.completed"}\n')
        self.assertFalse(self.bridge.usage_spent_in(path))


class ScoutReasonForASpentGenerator(unittest.TestCase):
    """The reference the scout reads names the new reason and its limit."""

    def test_the_generation_reference_separates_a_spent_limit_from_a_refusal(self):
        text = " ".join((ROOT / "references" / "image-scout-generation.md").read_text(encoding="utf-8").split())
        self.assertIn("`imagegen_usage_spent`", text)
        self.assertIn("This reason is only for a spent limit", text)


if __name__ == "__main__":
    unittest.main()
