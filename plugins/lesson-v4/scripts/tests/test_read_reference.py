"""Deterministic section-reader tests; these do not grade lesson quality."""
from __future__ import annotations
import contextlib
import importlib.util
import io
import os
import subprocess
from pathlib import Path
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "read-reference.py"
spec = importlib.util.spec_from_file_location("lesson_reference_reader", SCRIPT)
assert spec and spec.loader
reader = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = reader
spec.loader.exec_module(reader)


class ReferenceReaderTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "references").mkdir()

    def put(self, text, name="sample.md"):
        (self.root / "references" / name).write_bytes(text.encode("utf-8"))

    def selected(self, text, selector):
        start, end = reader.interval(text, selector)
        return text[start:end]

    def test_peer_boundary(self):
        self.assertEqual(self.selected("# T\n## A\none\n## B\ntwo\n", "A"), "## A\none\n")

    def test_ancestor_boundary(self):
        text = "# T\n## A\n### Last child\nkeep\n## B\nexclude\n"
        self.assertEqual(self.selected(text, "Last child"), "### Last child\nkeep\n")

    def test_parent_keeps_all_children(self):
        text = "# T\n## A\n### C\nkeep\n#### D\nexception\n## B\nno\n"
        self.assertEqual(self.selected(text, "A"), "## A\n### C\nkeep\n#### D\nexception\n")

    def test_final_section_reaches_eof(self):
        self.assertEqual(self.selected("# T\n## Last\nkeep", "Last"), "## Last\nkeep")

    def test_missing_is_error(self):
        with self.assertRaises(reader.ReferenceError): reader.interval("# T\n", "Absent")

    def test_duplicate_heading_is_error(self):
        with self.assertRaises(reader.ReferenceError): reader.interval("# A\n## Same\nx\n# B\n## Same\ny", "Same")

    def test_parent_path_disambiguates(self):
        self.assertEqual(self.selected("# A\n## Same\nx\n# B\n## Same\ny", "B > Same"), "## Same\ny")

    def test_fenced_fake_heading_is_ignored(self):
        text = "# T\n## A\n```md\n## Fake\n```\nkeep\n## B\nno"
        self.assertIn("keep", self.selected(text, "A"))
        with self.assertRaises(reader.ReferenceError): reader.locate(text, "Fake")

    def test_tilde_fence_is_ignored(self):
        text = "## A\n~~~~\n## Fake\n~~~~\n## B\n"
        self.assertIn("## Fake", self.selected(text, "A"))

    def test_shorter_fence_does_not_close(self):
        text = "## A\n````\n```\n## Fake\n````\n## B\n"
        self.assertEqual([h.title for h in reader.headings(text)], ["A", "B"])

    def test_wrong_fence_character_does_not_close(self):
        self.assertEqual([h.title for h in reader.headings("## A\n```\n~~~\n## Fake\n```\n## B\n")], ["A", "B"])

    def test_fence_with_language(self):
        self.assertEqual([h.title for h in reader.headings("## A\n```python\n# fake\n```\n## B\n")], ["A", "B"])

    def test_indented_code_is_not_heading(self):
        self.assertEqual([h.title for h in reader.headings("## A\n    ## code\n## B\n")], ["A", "B"])

    def test_closing_hashes(self):
        self.assertEqual(reader.headings("## A ###\n")[0].title, "A")

    def test_heading_requires_space(self):
        self.assertEqual(reader.headings("#not-a-heading\n"), [])

    def test_intro_keeps_title_and_purpose(self):
        text = "# T\npurpose\n\n## Contents\nlist"
        self.assertEqual(self.selected(text, "@intro"), "# T\npurpose\n\n")

    def test_intro_without_title(self):
        self.assertEqual(self.selected("purpose\n## A\nbody", "@intro"), "purpose\n")

    def test_no_headings_intro_is_whole_text(self):
        self.assertEqual(self.selected("purpose only", "@intro"), "purpose only")

    def test_unicode_exact(self):
        text = "## Teach → Do\n£1.20 – café\n## Next\nno"
        self.assertEqual(self.selected(text, "Teach → Do"), "## Teach → Do\n£1.20 – café\n")

    def test_crlf_preserved(self):
        text = "## A\r\nkeep\r\n## B\r\nno\r\n"
        self.put(text)
        result, size = reader.selected_text(self.root, ["sample.md::A"])
        self.assertIn("## A\r\nkeep\r\n", result)
        self.assertEqual(size, len("## A\r\nkeep\r\n".encode()))

    def test_duplicate_request_only_once(self):
        self.put("## A\nunique\n")
        result, _ = reader.selected_text(self.root, ["sample.md::A", "sample.md::A"])
        self.assertEqual(result.count("unique"), 1)

    def test_nested_overlap_only_once(self):
        self.put("## A\nparent\n### B\nunique\n## C\nexclude")
        result, _ = reader.selected_text(self.root, ["sample.md::B", "sample.md::A"])
        self.assertEqual(result.count("unique"), 1)
        self.assertNotIn("exclude", result)

    def test_does_not_deduplicate_meaning_across_files(self):
        self.put("## A\nidentical\n", "one.md")
        self.put("## A\nidentical\n", "two.md")
        result, _ = reader.selected_text(self.root, ["one.md::A", "two.md::A"])
        self.assertEqual(result.count("identical"), 2)

    def test_batch_failure_prints_no_partial_output(self):
        self.put("## A\nfirst\n")
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            rc = reader.main(["--plugin-root", str(self.root), "--select", "sample.md::A", "--select", "sample.md::Missing"])
        self.assertEqual(rc, 2)
        self.assertEqual(out.getvalue(), "")
        self.assertIn("REFERENCE_READ_ERROR", err.getvalue())

    def test_path_traversal_rejected(self):
        with self.assertRaises(reader.ReferenceError): reader.read_source(self.root, "../outside.md")

    def test_non_markdown_rejected(self):
        with self.assertRaises(reader.ReferenceError): reader.read_source(self.root, "script.py")

    def test_symlink_escape_rejected(self):
        outside = self.root / "outside.md"
        outside.write_text("secret", encoding="utf-8")
        try:
            (self.root / "references" / "alias.md").symlink_to(outside)
        except OSError:
            self.skipTest("symlinks unavailable on this host")
        with self.assertRaises(reader.ReferenceError): reader.read_source(self.root, "alias.md")

    def test_missing_file_rejected(self):
        with self.assertRaises(reader.ReferenceError): reader.read_source(self.root, "missing.md")

    def menu_source(self):
        return "## " + reader.STRUCTURES_HEADING + "\n\n" + "\n".join(
            "### " + name + "\n**Use when.** condition for " + name + "\n\n**Why.** detail excluded from menu\n"
            for name in reader.STRUCTURES
        ) + "\n## Cross-Cutting Principles\nNot the menu.\n"

    def test_menu_keeps_all_five_conditions(self):
        result, _ = reader.structure_menu(self.menu_source())
        self.assertEqual(result.count("**Use when.**"), 5)
        self.assertNotIn("detail excluded", result)
        self.assertNotIn("Cross-Cutting", result)

    def test_menu_missing_route_rejected(self):
        text = self.menu_source().replace("### Task-Centred", "### Changed")
        with self.assertRaises(reader.ReferenceError): reader.structure_menu(text)

    def test_menu_missing_condition_rejected(self):
        text = self.menu_source().replace("**Use when.**", "**Use if.**", 1)
        with self.assertRaises(reader.ReferenceError): reader.structure_menu(text)

    def test_menu_keeps_multiline_condition(self):
        text = self.menu_source().replace("condition for Skill-based", "first line\ncontinuation matters")
        self.assertIn("continuation matters", reader.structure_menu(text)[0])

    def test_success_marker_and_no_writes(self):
        self.put("## A\nkeep\n")
        before = {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            rc = reader.main(["--plugin-root", str(self.root), "--select", "sample.md::A"])
        self.assertEqual(rc, 0)
        self.assertIn("REFERENCE_READ_OK", out.getvalue())
        self.assertEqual(before, {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()})

    def test_index_contains_scoped_paths_only(self):
        self.put("# Root\n## Child\nbody-not-an-index\n")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            rc = reader.main(["--plugin-root", str(self.root), "--index", "sample.md"])
        self.assertEqual(rc, 0)
        self.assertIn("Root > Child", out.getvalue())
        self.assertNotIn("body-not-an-index", out.getvalue())


    def test_ascii_console_unicode_output(self):
        self.put("## A\n£1 → £2\n")
        env = dict(os.environ, PYTHONIOENCODING="ascii", PYTHONUTF8="0")
        result = subprocess.run([sys.executable, str(SCRIPT), "--plugin-root", str(self.root), "--select", "sample.md::A"], env=env, capture_output=True)
        self.assertEqual(result.returncode, 0)
        self.assertIn("£1 → £2", result.stdout.decode("utf-8"))

    def test_ascii_console_unicode_error(self):
        self.put("## A\ncontent\n")
        env = dict(os.environ, PYTHONIOENCODING="ascii", PYTHONUTF8="0")
        result = subprocess.run([sys.executable, str(SCRIPT), "--plugin-root", str(self.root), "--select", "sample.md::Missing → heading"], env=env, capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, b"")
        self.assertIn("REFERENCE_READ_ERROR", result.stderr.decode("utf-8"))
        self.assertNotIn("UnicodeEncodeError", result.stderr.decode("utf-8"))

if __name__ == "__main__":
    unittest.main()
