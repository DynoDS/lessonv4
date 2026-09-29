"""A host that cannot generate gets the whole real ladder, and nothing else changes.

On 29 September 2026 a Year 4 PSHE lesson on Claude Code, which has no image
generator, asked for eight essential school-scene photographs. Each was
`ordinary-real` with an AI fallback, so each compiled to one Unsplash (or
Wikimedia) round plus an Openverse standby that is only walked after an outage.
One round each found nothing, the fallback could not run, and all eight ended
as `imagegen_capability_unavailable`. A rescue wave of six more lost five the
same way. The short schedule is right only where generation can catch the miss.

Run:
  python -m pytest scripts/tests/test_picture_ladder_no_generator.py
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


compiler = load("no_generator_compiler", "compile-picture-assignments.py")
validator = load("no_generator_validator", "validate-image-scout.py")

PROMPT = {
    "physical_state": "children walking calmly along a school corridor",
    "must_avoid": ["logos", "readable signs"],
    "text_rule": "no generated text",
    "composition": "corridor seen from one end, several children in frame",
}


def photo(filename="unsplash/school-corridor-walking.jpg", *, mode="ordinary-real",
          profile="unsplash-only", fallback="ai", essential=True, index=1):
    return {
        "id": f"photo-{index:03d}", "subject": f"a school scene {index}",
        "pedagogical_constraint": "an ordinary UK primary school",
        "teaching_requirement": "children picture the place the choice happens",
        "load_bearing_evidence": ["children in a school setting"], "use": "slide",
        "essential": essential, "filename": filename, "acquisition_mode": mode,
        "source_profile": profile, "fallback_action": fallback,
        "fallback_note": "a generated record would misteach" if mode == "authentic-real" else None,
        "generation_prompt": PROMPT if fallback == "ai" or mode == "controlled-ai" else None,
        "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": [],
    }


def ladder(steps):
    return [(s["source"], s["round"], bool(s.get("standby_only"))) for s in steps]


class TheScheduleOnEachHost(unittest.TestCase):
    def test_no_generator_climbs_every_real_rung(self):
        """Both stock libraries, Openverse, a second phrasing, then the open web."""
        steps = compiler.source_schedule(photo(), generation_available=False)
        self.assertEqual(ladder(steps), [
            ("unsplash", 1, False), ("wikimedia", 1, False), ("openverse", 1, False),
            ("unsplash", 2, False), ("web", 1, False),
        ])
        self.assertTrue(all(s["candidate_count"] == 3 for s in steps))

    def test_the_designers_own_shelf_still_leads(self):
        steps = compiler.source_schedule(photo(profile="wikimedia-only"), generation_available=False)
        self.assertEqual([s["source"] for s in steps][:2], ["wikimedia", "unsplash"])
        self.assertEqual(ladder(steps)[3], ("wikimedia", 2, False))

    def test_an_optional_picture_skips_only_the_open_web(self):
        steps = compiler.source_schedule(photo(essential=False), generation_available=False)
        self.assertNotIn("web", [s["source"] for s in steps])
        self.assertIn("openverse", [s["source"] for s in steps])

    def test_a_generation_host_keeps_its_short_ladder(self):
        """Codex compiles exactly what it compiled before: one search, a standby."""
        for p in (photo(), photo(essential=False), photo(profile="unsplash-then-wikimedia")):
            with self.subTest(p=p["source_profile"], essential=p["essential"]):
                self.assertEqual(compiler.source_schedule(p, generation_available=True), compiler.source_schedule(p))
        self.assertEqual(ladder(compiler.source_schedule(photo())), [("unsplash", 1, False), ("openverse", 1, True)])

    def test_pictures_with_no_ai_fallback_are_the_same_on_both_hosts(self):
        for p in (photo(fallback="omit", essential=False),
                  photo(mode="authentic-real", fallback="unsatisfied"),
                  photo(mode="controlled-ai", profile="none", fallback="omit")):
            with self.subTest(mode=p["acquisition_mode"], fallback=p["fallback_action"]):
                self.assertEqual(compiler.source_schedule(p, generation_available=False), compiler.source_schedule(p))


class TheCompiledAssignment(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.req = self.root / "requirements.json"
        self.photos = [photo(), photo("unsplash/carpet-time-listening.jpg", profile="wikimedia-only", index=2)]
        self.req.write_text(json.dumps({"schema_version": 2, "lesson_name": "PSHE", "photos": self.photos}) + "\n", encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def compile(self, generation: str, out: str):
        return subprocess.run([
            sys.executable, str(SCRIPTS / "compile-picture-assignments.py"), "compile",
            "--requirements", str(self.req), "--expected-prefix", "p",
            "--output-dir", str(self.root / out), "--working-dir", str(self.root),
            "--summary-output", str(self.root / f"{out}-summary.json"),
            "--image-generation", generation,
        ], capture_output=True, text=True)

    def test_the_host_is_read_from_its_own_environment(self):
        resolve = compiler.resolve_image_generation
        self.assertEqual(resolve("auto", {"CLAUDECODE": "1"}), "unavailable")
        # Codex started from inside a Claude Code session inherits CLAUDECODE,
        # and is still Codex.
        self.assertEqual(resolve("auto", {"CLAUDECODE": "1", "CODEX_THREAD_ID": "t"}), "available")
        self.assertEqual(resolve("auto", {"CODEX_THREAD_ID": "t"}), "available")
        # A host this cannot recognise keeps the behaviour it always had.
        self.assertEqual(resolve("auto", {}), "available")
        # Naming it outright overrides the environment either way.
        self.assertEqual(resolve("available", {"CLAUDECODE": "1"}), "available")
        self.assertEqual(resolve("unavailable", {"CODEX_THREAD_ID": "t"}), "unavailable")
        self.assertEqual(compiler.parser().parse_args([
            "compile", "--requirements", "r.json", "--expected-prefix", "p",
            "--output-dir", "o", "--working-dir", "w", "--summary-output", "s.json",
        ]).image_generation, "auto")

    def test_no_generator_leaves_nothing_to_reserve(self):
        done = self.compile("unavailable", "none")
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertIn("PICTURE_IMAGE_GENERATION: unavailable", done.stdout)
        assignment = json.loads((self.root / "none" / "p1.json").read_text(encoding="utf-8"))
        self.assertEqual(assignment["image_generation"], "unavailable")
        for entry in assignment["entries"]:
            self.assertIsNone(entry["generation_prompt_file"])
            self.assertIsNone(entry["ai_ledger_path"])
            self.assertFalse(any(s.get("standby_only") for s in entry["search_schedule"]))
        self.assertFalse((self.root / "none" / "prompts").exists())
        checked = subprocess.run([
            sys.executable, str(SCRIPTS / "validate-image-scout.py"), "manifest",
            "--requirements", str(self.req), "--manifest", str(self.root / "none" / "manifest.json"),
            "--working-dir", str(self.root), "--expected-prefix", "p",
        ], capture_output=True, text=True)
        self.assertEqual(checked.returncode, 0, checked.stderr)

    def test_a_generation_host_compiles_the_same_bytes_as_before(self):
        done = self.compile("available", "gen")
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertNotIn("PICTURE_IMAGE_GENERATION", done.stdout)
        written = json.loads((self.root / "gen" / "p1.json").read_text(encoding="utf-8"))
        before = compiler.build_assignment(self.req, self.photos, "p1", "p", self.root / "gen", self.root)
        self.assertEqual(written, before)
        self.assertNotIn("image_generation", written)
        self.assertTrue(all(e["ai_ledger_path"] for e in written["entries"]))

    def test_a_repair_slice_keeps_the_host(self):
        self.assertEqual(self.compile("unavailable", "none").returncode, 0)
        fault = self.root / "fault.txt"; fault.write_text("wrong scene\n", encoding="utf-8")
        receipt = self.root / "receipt.json"; receipt.write_text("{}\n", encoding="utf-8")
        args = SimpleNamespace(
            assignment=str(self.root / "none" / "p1.json"), batch_id="p1r", output=str(self.root / "slice.json"),
            working_dir=str(self.root), expected_filename=self.photos[0]["filename"],
            review_fault_file=str(fault), previous_receipt=str(receipt), summary_output=str(self.root / "slice-summary.json"),
        )
        self.assertEqual(compiler.repair_command(args), 0)
        self.assertEqual(json.loads(Path(args.output).read_text(encoding="utf-8"))["image_generation"], "unavailable")

    def test_the_scout_is_told_what_the_mark_means(self):
        text = (ROOT / "agents" / "image-scout.md").read_text(encoding="utf-8")
        self.assertIn("image_generation: unavailable", text)
        self.assertIn("never `imagegen_capability_unavailable`", text)


class TheResultOnANoGeneratorHost(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"; self.working.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def fixture(self, generation_available=False, **overrides):
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
        return entry, args

    def result(self, args, entry, status, reason=None, staging=None):
        row = {"filename": entry["filename"], "status": status, "selection": None, "staging_path": staging, "reason": reason}
        Path(args.result).write_text(json.dumps({"schema_version": 2, "kind": "image", "batch_id": "p1", "entries": [row]}) + "\n", encoding="utf-8")

    def summary(self, step, complete=True, failure_kind=None, retry=False):
        path = validator.retry_summary_path(step) if retry else Path(step["summary_path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"query": "school corridor", "source": step["source"], "round": step["round"],
                                    "complete": complete, "requested_count": step["candidate_count"], "results": [],
                                    "failure_kind": failure_kind}) + "\n", encoding="utf-8")

    def test_no_generator_is_never_the_answer_for_a_real_first_picture(self):
        """What the PSHE scouts wrote after one round each is now refused."""
        entry, args = self.fixture()
        self.summary(entry["search_schedule"][0])
        self.result(args, entry, "unsatisfied", reason="imagegen_capability_unavailable")
        with self.assertRaisesRegex(validator.ValidationError, "no generator"):
            validator.validate_result(args)

    def test_an_empty_ladder_ends_only_when_every_rung_has_answered(self):
        entry, args = self.fixture()
        schedule = entry["search_schedule"]
        self.summary(schedule[0])
        self.result(args, entry, "unsatisfied", reason="no_faithful_real_match")
        with self.assertRaises(validator.ValidationError):
            validator.validate_result(args)
        for step in schedule[1:]:
            self.summary(step)
        validator.validate_result(args)

    def test_one_shut_shelf_does_not_end_the_ladder(self):
        entry, args = self.fixture()
        schedule = entry["search_schedule"]
        self.summary(schedule[0], complete=False, failure_kind="transport")
        self.summary(schedule[0], complete=False, failure_kind="transport", retry=True)
        self.result(args, entry, "unsatisfied", reason="real_source_unavailable")
        with self.assertRaises(validator.ValidationError):
            validator.validate_result(args)
        for step in schedule[1:]:
            self.summary(step)
        validator.validate_result(args)

    def test_a_generated_result_cannot_come_from_a_host_with_no_generator(self):
        entry, args = self.fixture()
        stage = Path(args.work_root) / entry["entry_key"] / "ai" / "out.png"
        stage.parent.mkdir(parents=True)
        from PIL import Image
        Image.new("RGB", (8, 8), "white").save(stage, format="PNG")
        self.result(args, entry, "generated", staging=str(stage))
        with self.assertRaisesRegex(validator.ValidationError, "cannot generate"):
            validator.validate_result(args)

    def test_a_generation_host_still_must_generate_after_an_empty_search(self):
        entry, args = self.fixture(generation_available=True)
        self.summary(entry["search_schedule"][0])
        self.result(args, entry, "unsatisfied", reason="no_faithful_real_match")
        with self.assertRaisesRegex(validator.ValidationError, "authorised AI fallback"):
            validator.validate_result(args)


if __name__ == "__main__":
    unittest.main()
