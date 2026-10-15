"""The small tool slips of the Codex lessons of 10 and 11 October 2026.

Three real lessons were built on Codex and their workers logged these, in two
of the three:

- a picture scout sent its downloads to the picture's own folder, one level
  above the folder each compiled step's record belongs in, and searched again;
  its own loop over four pictures then dropped one search; a scout's first
  write failed because nothing had made its result folder;
- the scouts searched a library the rules held in reserve, because one
  instruction said to skip it and another said to generate only after every
  compiled step (the teacher has since ruled that a second library comes
  before a made picture, so the reserve is an ordinary step);
- a slide build's output could not be read back on Windows, because it held a
  curly closing quote and was read in the computer's own text format;
- pages from the paged reader arrived with their middle cut out, because a
  Codex worker sets its own output limit on each command and nothing told it
  how big a page is.

Run:
  python -m pytest scripts/tests/test_small_tool_slips.py
"""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module  # a dataclass looks its own module up by name
    spec.loader.exec_module(module)
    return module


compiler = load("slips_compiler", "compile-picture-assignments.py")
search = load("slips_search", "picture-search.py")
fixed = load("slips_fixed_resource", "run-fixed-resource.py")
reader = load("slips_reader", "read-reference.py")


PROMPT = {
    "physical_state": "alive, in a garden", "must_avoid": ["a cartoon animal"],
    "text_rule": "no text", "composition": "one animal, close, plain background",
}


def photo(name: str, fallback: str = "ai", essential: bool = True, number: int = 1) -> dict:
    return {
        "id": f"photo-{number:03d}", "subject": f"A {name} in a garden",
        "pedagogical_constraint": "", "teaching_requirement": "the animal the chain names",
        "load_bearing_evidence": [f"a {name}"], "use": "slide", "essential": essential,
        "filename": f"unsplash/{name}.jpg", "acquisition_mode": "ordinary-real",
        "source_profile": "wikimedia-only", "fallback_action": fallback, "fallback_note": None,
        "generation_prompt": PROMPT if fallback == "ai" else None,
        "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": [],
    }


class OneSearchCommand(unittest.TestCase):
    """The scout gives the words; the command supplies everything the schedule compiled."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"
        self.working.mkdir()
        photos = [photo("aphid"), photo("barn-owl", number=2)]
        requirements = self.root / "requirements.json"
        requirements.write_text(
            json.dumps({"schema_version": 2, "lesson_name": "Food chains", "photos": photos}) + "\n",
            encoding="utf-8",
        )
        self.assignment = compiler.build_assignment(
            requirements, photos, "p4", "p", self.root / "assignments", self.working
        )
        self.assignment_path = self.root / "p4.json"
        self.assignment_path.write_text(json.dumps(self.assignment) + "\n", encoding="utf-8")
        self.entry = self.assignment["entries"][0]
        self.calls: list[list[str]] = []
        self.outcomes: list[dict] = []

    def tearDown(self):
        self.temp.cleanup()

    def fake_fetch(self, command, **_):
        """Stand in for a fetcher: write the record it would write, where it was told to."""
        self.calls.append(command)
        outcome = self.outcomes.pop(0) if self.outcomes else {"complete": True}
        source = Path(command[1]).name.split("_")[0]
        number = command[command.index("--round") + 1]
        folder = Path(command[command.index("--output") + 1])
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"_search-summary-{source}-r{number}.json").write_text(json.dumps({
            "query": command[2], "source": source, "round": int(number),
            "requested_count": int(command[command.index("--count") + 1]), "results": [],
            "failure_kind": None, **outcome,
        }), encoding="utf-8")
        return subprocess.CompletedProcess(command, 0 if outcome.get("complete", True) else 1)

    def go(self, *extra: str, filename: str = "unsplash/aphid.jpg") -> tuple[int, str]:
        out = io.StringIO()
        with mock.patch.object(search.subprocess, "run", self.fake_fetch), \
                contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            code = search.main(["--assignment", str(self.assignment_path), "--filename", filename, *extra])
        return code, out.getvalue()

    def test_the_record_lands_where_the_compiled_step_names_it(self):
        """The fault itself: downloads went to the picture's folder, one level too high."""
        code, out = self.go("--query", "aphid")
        self.assertEqual(code, 0, out)
        step = self.entry["search_schedule"][0]
        self.assertTrue(Path(step["summary_path"]).is_file(), out)
        command = self.calls[0]
        self.assertEqual(command[command.index("--output") + 1], str(Path(step["summary_path"]).parent))
        self.assertEqual(command[command.index("--count") + 1], str(step["candidate_count"]))
        self.assertEqual(Path(command[1]).name, f"{step['source']}_fetch.py")
        self.assertIn("PICTURE_SEARCH: unsplash/aphid.jpg step 1 of 2", out)

    def test_each_run_takes_the_next_step_and_then_says_none_is_left(self):
        self.go("--query", "aphid")
        _, second = self.go("--query", "aphid insect")
        self.assertEqual(
            [Path(c[1]).name for c in self.calls],
            [f"{s['source']}_fetch.py" for s in self.entry["search_schedule"]],
        )
        self.assertIn("no search is left", second)
        self.assertIn("generate it", second)
        code, third = self.go("--query", "aphid")
        self.assertEqual(code, 0)
        self.assertIn("PICTURE_SEARCH_NONE_LEFT", third)
        self.assertEqual(len(self.calls), 2, "a third run searches nothing")

    def test_one_picture_never_takes_another_pictures_step(self):
        """The dropped search: four pictures in one loop, three searched."""
        self.go("--query", "aphid")
        self.go("--query", "barn owl", filename="unsplash/barn-owl.jpg")
        for entry in self.assignment["entries"]:
            self.assertTrue(Path(entry["search_schedule"][0]["summary_path"]).is_file(), entry["filename"])
            self.assertFalse(Path(entry["search_schedule"][1]["summary_path"]).exists(), entry["filename"])

    def test_a_transport_failure_is_retried_once_beside_the_first_record(self):
        self.outcomes = [{"complete": False, "failure_kind": "transport"},
                         {"complete": False, "failure_kind": "transport"}]
        _, first = self.go("--query", "aphid")
        self.assertIn("has one retry", first)
        self.go("--query", "aphid")
        primary = Path(self.entry["search_schedule"][0]["summary_path"])
        self.assertTrue((primary.parent / "retry-1" / primary.name).is_file())
        self.assertTrue(primary.is_file(), "the first record is kept")
        self.go("--query", "aphid")
        self.assertEqual(Path(self.calls[2][1]).name, f"{self.entry['search_schedule'][1]['source']}_fetch.py")

    def test_a_spent_quota_is_not_retried_and_the_next_library_is_offered(self):
        self.outcomes = [{"complete": False, "failure_kind": "rate_limit"}]
        self.go("--query", "aphid")
        self.go("--query", "aphid")
        self.assertEqual(len(self.calls), 2)
        self.assertNotIn("retry-1", self.calls[1][self.calls[1].index("--output") + 1])
        self.assertEqual(Path(self.calls[1][1]).name, f"{self.entry['search_schedule'][1]['source']}_fetch.py")

    def test_a_refused_key_stops_the_ladder(self):
        self.outcomes = [{"complete": False, "failure_kind": "auth"}]
        self.go("--query", "aphid")
        _, out = self.go("--query", "aphid")
        self.assertEqual(len(self.calls), 1)
        self.assertIn("refused its key", out)

    def test_a_picture_outside_the_batch_is_refused_by_name(self):
        code, out = self.go("--query", "fox", filename="unsplash/fox.jpg")
        self.assertEqual(code, 2)
        self.assertIn("unsplash/aphid.jpg", out)
        self.assertEqual(self.calls, [])

    def test_a_reserve_step_in_an_older_job_is_still_left_alone(self):
        """A lesson folder compiled before 13 October 2026 keeps its meaning."""
        self.entry["search_schedule"][1]["standby_only"] = True
        self.assignment_path.write_text(json.dumps(self.assignment) + "\n", encoding="utf-8")
        self.go("--query", "aphid")
        _, out = self.go("--query", "aphid")
        self.assertEqual(len(self.calls), 1)
        self.assertIn("PICTURE_SEARCH_NONE_LEFT", out)

    def test_the_instructions_name_this_command_and_no_other(self):
        text = (ROOT / "references" / "image-scout-search.md").read_text(encoding="utf-8")
        self.assertIn("scripts/picture-search.py", text)
        self.assertIsNone(re.search(r"(unsplash|wikimedia|openverse|web)_fetch\.py", text))
        for name in ("image-scout-search.md", "image-scout-generation.md", "image-scout-recovery-repair.md"):
            self.assertNotIn("standby", (ROOT / "references" / name).read_text(encoding="utf-8"), name)
        self.assertNotIn("standby", (ROOT / "agents" / "image-scout.md").read_text(encoding="utf-8"))


class TheJobMakesItsOwnFolders(unittest.TestCase):
    def test_compiling_makes_each_batchs_result_folder(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            working = root / "working"
            working.mkdir()
            requirements = root / "requirements.json"
            requirements.write_text(
                json.dumps({"schema_version": 2, "lesson_name": "Food chains", "photos": [photo("aphid")]}) + "\n",
                encoding="utf-8",
            )
            with contextlib.redirect_stdout(io.StringIO()):
                code = compiler.main([
                    "compile", "--requirements", str(requirements), "--output-dir", str(root / "assignments"),
                    "--working-dir", str(working), "--summary-output", str(root / "summary.json"),
                    "--expected-prefix", "p",
                ])
            self.assertEqual(code, 0)
            self.assertTrue((working / "picture-results" / "p1").is_dir())


class BuildOutputIsReadAsItWasWritten(unittest.TestCase):
    def test_a_curly_quote_in_a_helpers_output_comes_back_whole(self):
        """Read as cp1252 the closing quote's last byte has no meaning, and the read failed."""
        name = "Tariq says “help”"
        self.assertEqual(fixed.safe_filename_component(ROOT, name), name)

    def test_no_plugin_step_reads_its_own_helpers_in_the_computers_format(self):
        """Node and the plugin's own Python steps are read as UTF-8, wherever they are run from."""
        for name in ("run-fixed-resource.py", "check-optional-pictures.py", "finalize-picture-assignment.py",
                     "photo-contract.py", "design-review-packet.py"):
            source = (SCRIPTS / name).read_text(encoding="utf-8")
            for found in re.finditer(r"\btext=True\b", source):
                nearby = source[found.start():found.start() + 120]
                self.assertIn('encoding="utf-8"', nearby, f"{name}: {nearby.splitlines()[0]}")


class TheReaderSaysHowMuchToAskFor(unittest.TestCase):
    def test_on_codex_a_full_page_says_so_at_its_head_and_its_foot(self):
        page = "A rule.\n\n" * 2600
        with mock.patch.dict(os.environ, {"CODEX_THREAD_ID": "thread-1"}):
            note = reader.output_note(page[:reader.PAGE_CHARS])
        self.assertIn("max_output_tokens of at least 10000", note)
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "read-reference.py"), "--role", "slide-designer", "--page", "1"],
            capture_output=True, text=True, encoding="utf-8",
            env={**os.environ, "CODEX_THREAD_ID": f"slips-{os.getpid()}", "PYTHONIOENCODING": "utf-8"},
        )
        lines = result.stdout.strip().splitlines()
        self.assertIn("max_output_tokens", lines[0])
        self.assertIn("max_output_tokens", lines[-2])
        self.assertTrue(lines[-1].startswith("REFERENCE_READ_PARTIAL"), lines[-1])

    def test_a_short_read_and_any_other_host_are_left_as_they_were(self):
        with mock.patch.dict(os.environ, {"CODEX_THREAD_ID": "thread-1"}):
            self.assertIsNone(reader.output_note("A short read.\n" * 100))
        with mock.patch.dict(os.environ, {"CODEX_THREAD_ID": ""}):
            self.assertIsNone(reader.output_note("A rule.\n\n" * 2600))

    def test_every_codex_worker_is_launched_knowing_it(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "worker-launch.py"), "spec", "--host", "codex",
             "--role", "design-reviewer", "--role", "image-scout"],
            capture_output=True, text=True, encoding="utf-8",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.count("full_reads: "), 2)
        self.assertIn("max_output_tokens: 10000", result.stdout)
        claude = subprocess.run(
            [sys.executable, str(SCRIPTS / "worker-launch.py"), "spec", "--host", "claude",
             "--role", "design-reviewer"],
            capture_output=True, text=True, encoding="utf-8",
        )
        self.assertNotIn("full_reads", claude.stdout)


if __name__ == "__main__":
    unittest.main()
