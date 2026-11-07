"""Receipts measure exact emitted ranges, not requested or inferred reading."""
import contextlib
from concurrent.futures import ThreadPoolExecutor
import importlib.util
import io
import json
import os
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
import reference_usage as usage

spec = importlib.util.spec_from_file_location("usage_test_reader", SCRIPTS / "read-reference.py")
reader = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = reader
spec.loader.exec_module(reader)


class UsageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.root = self.base / "plugin"
        for folder in ("references", "agents", ".claude-plugin"):
            (self.root / folder).mkdir(parents=True)
        (self.root / ".claude-plugin/plugin.json").write_text('{"version":"4.2.test"}')
        self.db = self.base / "home" / "reference-usage.sqlite3"
        env = patch.dict(os.environ, {"LESSON_REFERENCE_USAGE_DB": str(self.db), "CODEX_THREAD_ID": "", "CLAUDE_SESSION_ID": "", "CLAUDECODE": ""})
        env.start()
        self.addCleanup(env.stop)

    def put(self, text, name="sample.md"):
        (self.root / "references" / name).write_text(text, encoding="utf-8", newline="")

    def run_reader(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            rc = reader.main(["--plugin-root", str(self.root), *args])
        return rc, out.getvalue(), err.getvalue()

    def rows(self):
        return usage.read_receipts(self.db)

    def section(self, name):
        return next(r for r in usage.report(self.root, self.rows(), reader.headings, "sample.md", 3)
                    if r["section"] == name)

    def test_parent_counts_children_but_not_neighbour_and_stores_no_text(self):
        self.put("# Guide\n## A\nSECRET CONTENT\n### Child\n£ →\n## B\nunseen\n")
        rc, out, err = self.run_reader("--select", "sample.md::A", "--host", "claude", "--reader-role", "lesson-designer", "--lesson-id", "lesson-one")
        self.assertEqual((rc, err), (0, ""))
        r = self.rows()[0]
        self.assertEqual((r["host"], r["role"], r["lesson"], r["plugin_version"]), ("claude", "lesson-designer", "lesson-one", "4.2.test"))
        self.assertNotIn("SECRET CONTENT", json.dumps(r))
        self.assertEqual(self.section("Guide > A")["coverage"], "full")
        self.assertEqual(self.section("Guide > A > Child")["coverage"], "full")
        self.assertEqual(self.section("Guide > B")["coverage"], "unobserved")

    def test_pages_count_only_emitted_characters_including_unicode(self):
        self.put("# Guide\n## A\n" + "£ → one\n\n" * 20 + "## B\nlast\n")
        with patch.object(reader, "PAGE_CHARS", 60), patch.object(reader, "pages", side_effect=lambda text: original_pages(text, 60)):
            self.assertEqual(self.run_reader("--file", "sample.md", "--page", "1")[0], 0)
            self.assertEqual(self.section("Guide > A")["coverage"], "partial")
            self.assertEqual(self.section("Guide > B")["coverage"], "unobserved")
            output = reader.read_source(self.root, "sample.md")
            for page in range(2, len(original_pages(output, 60)) + 1):
                self.assertEqual(self.run_reader("--file", "sample.md", "--page", str(page))[0], 0)
        self.assertEqual(self.section("Guide > A")["current_text_coverage_percent"], 100)
        self.assertEqual(self.section("Guide > B")["coverage"], "full")

    def test_missing_index_out_of_range_and_refusal_get_no_receipt(self):
        self.put("## A\nbody\n")
        self.assertEqual(self.run_reader("--select", "sample.md::Missing")[0], 2)
        self.assertEqual(self.run_reader("--index", "sample.md")[0], 0)
        self.assertEqual(self.run_reader("--file", "sample.md", "--page", "2")[0], 2)
        with patch.object(reader, "same_call_log", return_value=self.base / "guard"), patch.object(reader, "claim_read", return_value=False), patch.object(reader, "finish_read"):
            self.assertEqual(self.run_reader("--file", "sample.md")[0], 3)
        self.assertEqual(self.rows(), [])

    def test_working_lesson_file_is_not_recorded(self):
        path = self.base / "lesson-design.json"
        path.write_text('{"private":"lesson content"}')
        self.assertEqual(self.run_reader("--file", str(path))[0], 0)
        self.assertFalse(self.db.exists())

    def test_intro_uses_the_readers_boundary_even_with_a_preamble(self):
        self.put("preamble\n# Guide\n## A\nbody\n")
        self.assertEqual(self.run_reader("--select", "sample.md::@intro")[0], 0)
        self.assertEqual(self.section("@intro")["coverage"], "full")
        self.assertEqual(self.section("Guide > A")["coverage"], "unobserved")

    def test_companions_count_on_claude_without_counting_injected_role(self):
        self.put("# Guide\n## A\ncompanion\n## B\nnot requested\n")
        (self.root / "agents/lesson-designer.md").write_text("# Role\nnot emitted\n")
        with patch.dict(reader.ROLE_COMPANIONS, {"lesson-designer": (("sample.md", ("A",)),)}):
            rc, _, err = self.run_reader("--role", "lesson-designer", "--companions-only", "--host", "claude")
        self.assertEqual((rc, err), (0, ""))
        self.assertEqual(self.section("Guide > A")["coverage"], "full")
        self.assertTrue(all(s["file"].startswith("references/") for s in self.rows()[0]["sections"]))

    def test_menu_does_not_claim_full_execution_sections(self):
        text = "## " + reader.STRUCTURES_HEADING + "\n\n" + "\n".join(
            "### " + name + "\n**Use when.** condition\n\n**Why.** execution never emitted\n"
            for name in reader.STRUCTURES)
        self.put(text, "evidence-synthesis.md")
        rc, _, err = self.run_reader("--structure-menu")
        self.assertEqual((rc, err), (0, ""))
        rows = usage.report(self.root, self.rows(), reader.headings, "evidence-synthesis.md", 3)
        self.assertTrue(all(r["coverage"] == "partial" for r in rows))

    def test_changed_section_does_not_inherit_old_coverage(self):
        self.put("# Guide\n## A\nold\n## B\nother\n")
        self.run_reader("--file", "sample.md")
        self.put("# Guide\n## A\nnew\n## B\nother\n")
        self.assertEqual(self.section("Guide > A")["coverage"], "different-text")
        self.assertEqual(self.section("Guide > B")["coverage"], "full")

    def test_database_failure_warns_without_losing_read(self):
        self.put("## A\nbody\n")
        with patch.object(usage, "append_receipt", side_effect=sqlite3.OperationalError("read only")):
            rc, out, err = self.run_reader("--file", "sample.md")
        self.assertEqual(rc, 0)
        self.assertIn("REFERENCE_READ_OK", out)
        self.assertIn("REFERENCE_USAGE_UNAVAILABLE", err)

    def test_output_failure_does_not_record_delivery(self):
        self.put("## A\nbody\n")
        stream = io.StringIO()
        with patch.object(stream, "flush", side_effect=BrokenPipeError), contextlib.redirect_stdout(stream):
            with self.assertRaises(BrokenPipeError):
                reader.main(["--plugin-root", str(self.root), "--file", "sample.md"])
        self.assertEqual(self.rows(), [])

    def test_claude_environment_is_detected_without_codex(self):
        self.put("## A\nbody\n")
        with patch.dict(os.environ, {"CLAUDECODE": "1", "CLAUDE_SESSION_ID": "claude-session"}):
            self.run_reader("--file", "sample.md")
        self.assertEqual(self.rows()[0]["host"], "claude")
        self.assertEqual(self.rows()[0]["session"], "claude-session")

    def test_concurrent_workers_keep_every_receipt(self):
        # Exercise first-use schema creation too, not just inserts to a ready DB.
        def write(n):
            usage.append_receipt(self.db, {"timestamp": f"2026-11-04T00:00:{n:02d}Z", "n": n})
        with ThreadPoolExecutor(max_workers=8) as workers:
            list(workers.map(write, range(24)))
        self.assertEqual({r["n"] for r in self.rows()}, set(range(24)))
        self.assertEqual(len(usage.read_receipts(self.db, "2026-11-05")), 0)

    def test_both_hosts_share_report_without_being_merged(self):
        self.put("## A\nbody\n")
        for host in ("claude", "codex"):
            self.run_reader("--file", "sample.md", "--host", host, "--reader-role", "test", "--lesson-id", host + "-lesson")
        r = self.section("A")
        self.assertEqual(r["hosts"], ["claude", "codex"])
        self.assertEqual(r["lesson_contexts"], 2)


original_pages = reader.pages

if __name__ == "__main__":
    unittest.main()
