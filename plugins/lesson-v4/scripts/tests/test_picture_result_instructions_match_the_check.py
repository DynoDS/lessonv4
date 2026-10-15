"""The picture stage's instructions and its result check say the same thing.

The 7 October 2026 stress test logged three mismatches between what the run is
told and what its tools accept, on every lesson and again in the Codex round:

- the scout's instructions listed an ATTEMPT_REQUEST_FILE to read first, a file
  the playbook retired on 28 August 2026 used to create and nothing has written
  since;
- the playbook told the orchestrator to check a result against "the exact
  assignment, result, work root and batch ID", and the check refused unless it
  was also handed every filename the assignment already carries;
- no instruction showed the result's shape, so seven scouts wrote their rows
  under `results`, and the refusal ("must contain only the schema 2 image result
  fields") did not say which field was wrong.

Run:
  python -m pytest scripts/tests/test_picture_result_instructions_match_the_check.py
"""
from __future__ import annotations

import contextlib
import hashlib
import importlib.util
import io
import json
import re
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


compiler = load("result_shape_compiler", "compile-picture-assignments.py")
validator = load("result_shape_validator", "validate-image-scout.py")


def photo(number: int) -> dict:
    return {
        "id": f"photo-00{number}", "subject": f"A red fox standing in a field, view {number}",
        "pedagogical_constraint": "", "teaching_requirement": "the animal the sentences are about",
        "load_bearing_evidence": ["a red fox"], "use": "slide", "essential": False,
        "filename": f"unsplash/red-fox-{number}.jpg", "acquisition_mode": "ordinary-real",
        "source_profile": "unsplash-then-wikimedia", "fallback_action": "omit", "fallback_note": None,
        "generation_prompt": None, "coherent_group": None, "coherent_mode": "none",
        "coherent_visual_invariants": [],
    }


class ResultCheck(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"; self.working.mkdir()
        photos = [photo(1), photo(2)]
        req = self.root / "requirements.json"
        req.write_text(json.dumps({"schema_version": 2, "lesson_name": "Foxes", "photos": photos}) + "\n", encoding="utf-8")
        self.assignment = compiler.build_assignment(req, photos, "p1", "p", self.root / "assignments", self.working)
        self.assignment_path = self.root / "assignment.json"
        self.assignment_path.write_text(json.dumps(self.assignment) + "\n", encoding="utf-8")
        self.names = [p["filename"] for p in photos]
        self.rows = [self.sourced_row(entry) for entry in self.assignment["entries"]]

    def tearDown(self):
        self.temp.cleanup()

    def sourced_row(self, entry) -> dict:
        step = entry["search_schedule"][0]
        summary = Path(step["summary_path"]); summary.parent.mkdir(parents=True, exist_ok=True)
        image = summary.parent / "fox_1.png"
        Image.new("RGB", (12, 9), "orange").save(image, format="PNG")
        candidate = {
            "candidate_id": "fox-1", "sha256": hashlib.sha256(image.read_bytes()).hexdigest(),
            "byte_count": image.stat().st_size, "width": 12, "height": 9, "decoded_format": "PNG",
            "source": step["source"], "source_page_url": "https://unsplash.com/photos/fox-1", "creator": "A Person",
            "licence_name": "Unsplash License", "licence_url": "https://unsplash.com/license",
            "description": "A red fox", "path": str(image),
        }
        summary.write_text(json.dumps({"query": "red fox", "source": step["source"], "round": step["round"],
                                       "complete": True, "requested_count": step["candidate_count"],
                                       "results": [candidate], "failure_kind": None}) + "\n", encoding="utf-8")
        return {"filename": entry["filename"], "status": "sourced",
                "selection": {"summary_path": str(summary), "candidate_id": "fox-1"},
                "staging_path": None, "reason": None}

    def check(self, result: dict, expected_filename=()):
        """Run the check as the command line does; return (exit code, what it printed)."""
        path = self.root / "result.json"
        path.write_text(json.dumps(result) + "\n", encoding="utf-8")
        argv = ["result", "--assignment", str(self.assignment_path), "--result", str(path),
                "--working-dir", str(self.working), "--work-root", self.assignment["work_root"],
                "--expected-batch-id", "p1"]
        for name in expected_filename:
            argv += ["--expected-filename", name]
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = validator.main(argv)
        return code, out.getvalue() + err.getvalue()

    def good(self) -> dict:
        return {"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": self.rows}

    def test_the_four_things_the_playbook_names_are_enough(self):
        code, text = self.check(self.good())
        self.assertEqual(code, 0, text)
        self.assertIn("PICTURE_RESULT_OK", text)

    def test_naming_the_filenames_still_passes(self):
        code, text = self.check(self.good(), self.names)
        self.assertEqual(code, 0, text)

    def test_a_named_list_the_assignment_does_not_match_is_still_refused(self):
        code, text = self.check(self.good(), self.names[:1])
        self.assertEqual(code, 1)
        self.assertIn("assignment filename order does not match expected set", text)

    def test_a_result_missing_a_picture_is_refused_without_any_named_list(self):
        result = self.good(); result["entries"] = self.rows[:1]
        code, text = self.check(result)
        self.assertEqual(code, 1)
        self.assertIn(self.names[1], text)

    def test_rows_under_results_are_told_where_they_belong(self):
        result = self.good(); result["results"] = result.pop("entries")
        code, text = self.check(result)
        self.assertEqual(code, 1)
        self.assertIn("missing entries", text)
        self.assertIn("not allowed results", text)

    def test_a_row_with_a_wrong_field_is_told_which(self):
        result = self.good()
        row = dict(self.rows[0]); row["path"] = row.pop("staging_path"); result["entries"] = [row, self.rows[1]]
        code, text = self.check(result)
        self.assertEqual(code, 1)
        self.assertIn("missing staging_path", text)
        self.assertIn("not allowed path", text)


class ScoutInstructions(unittest.TestCase):
    def setUp(self):
        self.scout = (ROOT / "agents" / "image-scout.md").read_text(encoding="utf-8")
        self.playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")

    def test_the_scout_is_handed_nothing_the_run_cannot_supply(self):
        # The file the retired playbook wrote. Nothing creates it now.
        self.assertNotIn("ATTEMPT_REQUEST_FILE", self.scout)
        self.assertNotIn("ATTEMPT_REQUEST_FILE", self.playbook)

    def test_the_example_result_has_the_shape_the_check_accepts(self):
        section = self.scout.split("## Result", 1)[1].split("## Report", 1)[0]
        block = re.search(r"```json\n(.*?)```", section, re.S)
        self.assertIsNotNone(block, "the Result section shows no example")
        example = json.loads(block.group(1))
        self.assertEqual(set(example), {"schema_version", "kind", "batch_id", "entries"})
        self.assertEqual((example["schema_version"], example["kind"]), (2, "image"))
        for row in example["entries"]:
            self.assertEqual(set(row), validator.RESULT_FIELDS)
            self.assertIn(row["status"], validator.STATUSES)
            if row["status"] == "sourced":
                self.assertEqual(set(row["selection"]), {"summary_path", "candidate_id"})
        for status in validator.STATUSES:
            self.assertIn(f"`{status}`" if status != "sourced" else '"sourced"', section)

    def test_the_scout_validates_with_what_the_playbook_names(self):
        section = self.scout.split("Validate with:", 1)[1].split("```", 2)[1]
        self.assertNotIn("--expected-filename", section)
        for option in ("--assignment", "--result", "--working-dir", "--work-root", "--expected-batch-id"):
            self.assertIn(option, section)


if __name__ == "__main__":
    unittest.main()
