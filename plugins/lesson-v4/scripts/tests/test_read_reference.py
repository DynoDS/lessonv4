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
import unittest.mock

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

    def test_menu_joins_a_batched_select(self):
        # The designer reads the menu at the same moment as its start-of-lesson
        # sections and is told to batch a moment's reads; that call used to fail.
        self.put("## A\nkeep\n")
        (self.root / "references" / "evidence-synthesis.md").write_text(self.menu_source(), encoding="utf-8")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            rc = reader.main(["--plugin-root", str(self.root), "--select", "sample.md::A", "--structure-menu"])
        self.assertEqual(rc, 0)
        self.assertIn("keep", out.getvalue())
        self.assertEqual(out.getvalue().count("**Use when.**"), 5)

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


class PagingTests(unittest.TestCase):
    """A read longer than one page arrives in pages, because the Codex host
    cuts the middle out of any longer output and the success line printed last
    still arrives. Nothing here grades the guidance being read."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "references").mkdir()
        (self.root / "agents").mkdir()
        # The lesson voice editor's role read carries its companion guidance.
        (self.root / "references" / "teacher-voice.md").write_text("# Teacher Voice Guide\n\nvoice\n", encoding="utf-8")
        (self.root / "references" / "preferences.md").write_text(
            "# Teacher Preferences\n\n## Written Voice (House Style)\n\n### Core rules\n\ncore\n\n"
            "### Written Voice read-back\n\nread-back\n\n### Calibration examples\n\nnot this\n\n"
            "## Pride Lessons (Quality Anchor)\n\n### What a Teach slide holds: the Tudor calibration\n\ntudor boards\n\n"
            "### A whole lesson at the right amount: the Shaftesbury calibration\n\nshaftesbury lesson\n",
            encoding="utf-8",
        )

    def run_main(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            rc = reader.main(["--plugin-root", str(self.root), *args])
        return rc, out.getvalue(), err.getvalue()

    def long_text(self, paragraphs=40, width=1500):
        return "# Role\n\n" + "".join(f"Rule {n}. " + ("word " * (width // 5)) + "\n\n" for n in range(paragraphs))

    def test_pages_join_back_exactly_and_respect_the_limit(self):
        text = self.long_text()
        split = reader.pages(text, limit=5000)
        self.assertGreater(len(split), 1)
        self.assertEqual("".join(split), text)
        self.assertTrue(all(len(page) <= 5000 for page in split))

    def test_a_page_breaks_between_paragraphs_when_one_fits(self):
        split = reader.pages(self.long_text(paragraphs=10, width=1500), limit=5000)
        for page in split[:-1]:
            self.assertTrue(page.endswith("\n\n"), page[-40:])

    def test_an_oversized_paragraph_still_splits_under_the_limit(self):
        text = "x" * 12_000
        split = reader.pages(text, limit=5000)
        self.assertEqual("".join(split), text)
        self.assertTrue(all(len(page) <= 5000 for page in split))

    def test_a_short_read_is_one_page_and_unchanged(self):
        (self.root / "references" / "sample.md").write_text("## A\nkeep\n", encoding="utf-8")
        rc, out, _ = self.run_main("--select", "sample.md::A")
        self.assertEqual(rc, 0)
        self.assertNotIn("page 1 of", out)
        self.assertTrue(out.rstrip().endswith("source bytes"))

    def test_only_the_last_page_reports_success(self):
        (self.root / "agents" / "lesson-designer.md").write_text(self.long_text(), encoding="utf-8")
        total = len(reader.pages(reader.role_reading(self.root, "lesson-designer")))
        self.assertGreater(total, 1)
        seen = ""
        for page in range(1, total + 1):
            rc, out, _ = self.run_main("--role", "lesson-designer", "--page", str(page))
            self.assertEqual(rc, 0)
            self.assertIn(f"<!-- page {page} of {total} -->", out)
            if page < total:
                self.assertNotIn("REFERENCE_READ_OK", out)
                self.assertIn(f"--page {page + 1}", out)
            else:
                self.assertIn(f"REFERENCE_READ_OK", out)
                self.assertIn(f"page {total} of {total}", out.splitlines()[-1])
            self.assertLessEqual(len(out), reader.PAGE_CHARS + 400)
            seen += out
        for n in range(40):
            self.assertIn(f"Rule {n}.", seen)

    def test_a_page_past_the_end_is_an_error(self):
        (self.root / "agents" / "slide-designer.md").write_text("# Role\nshort\n", encoding="utf-8")
        rc, out, err = self.run_main("--role", "slide-designer", "--page", "2")
        self.assertEqual(rc, 2)
        self.assertEqual(out, "")
        self.assertIn("1 page", err)

    def test_role_names_a_role_not_a_path(self):
        for bad in ("../references/x", "agents/lesson-designer", "Lesson-Designer.md"):
            with self.assertRaises(reader.ReferenceError):
                reader.read_role(self.root, bad)

    def test_file_reads_a_markdown_file_by_path(self):
        view = self.root / "design-review-view.md"
        view.write_text("# View\nthe class view\n", encoding="utf-8")
        rc, out, _ = self.run_main("--file", str(view))
        self.assertEqual(rc, 0)
        self.assertIn("the class view", out)
        with self.assertRaises(reader.ReferenceError):
            reader.read_working_file(self.root / "slides.pptx")

    def test_file_pages_the_design_json_and_a_plan(self):
        # A worker reads the design it builds from; on Codex a long one lost its middle.
        design = self.root / "lesson-design.json"
        design.write_text("{\n" + "".join(f'  "field{n}": "{"x" * 900}",\n' for n in range(60)) + '  "end": 1\n}\n', encoding="utf-8")
        (self.root / "plan.txt").write_text("Lesson 5\n", encoding="utf-8")
        total = len(reader.pages(design.read_text(encoding="utf-8")))
        self.assertGreater(total, 1)
        seen = ""
        for page in range(1, total + 1):
            rc, out, _ = self.run_main("--file", str(design), "--page", str(page))
            self.assertEqual(rc, 0)
            seen += out
        self.assertIn('"field0"', seen)
        self.assertIn('"field59"', seen)
        self.assertIn("REFERENCE_READ_OK", seen)
        rc, out, _ = self.run_main("--file", str(self.root / "plan.txt"))
        self.assertIn("Lesson 5", out)

    def test_the_voice_editor_role_read_carries_the_voice_it_writes_in(self):
        # Its whole job is the words children hear, so the guide arrives with the role.
        (self.root / "agents" / "lesson-voice-editor.md").write_text("# Lesson Voice Editor\nrole\n", encoding="utf-8")
        rc, out, _ = self.run_main("--role", "lesson-voice-editor")
        self.assertEqual(rc, 0)
        self.assertLess(out.index("role"), out.index("voice"))
        for piece in ("core", "read-back", "tudor boards", "shaftesbury lesson"):
            self.assertIn(piece, out)
        self.assertNotIn("not this", out)
        # The designer decides the teaching; the voice guide is not its role read.
        (self.root / "agents" / "lesson-designer.md").write_text("# Lesson Designer\ndesigns\n", encoding="utf-8")
        rc, out, _ = self.run_main("--role", "lesson-designer")
        self.assertNotIn("voice", out)


class SameCallTests(unittest.TestCase):
    """On Codex a tool call's output is cut in the middle past about 10,000 tokens,
    whether it holds one read or several. A read that shares a call with reads it
    would not fit beside is refused, so what does print arrives whole."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "agents").mkdir()
        (self.root / "references").mkdir()
        body = "# Role\n\n" + "".join(f"Rule {n}. " + ("word " * 300) + "\n\n" for n in range(60))
        (self.root / "agents" / "slide-designer.md").write_text(body, encoding="utf-8")
        self.clock = [1000.0]
        patches = [
            unittest.mock.patch.dict(os.environ, {"CODEX_THREAD_ID": "thread-1"}),
            unittest.mock.patch.object(reader.tempfile, "gettempdir", return_value=str(self.root / "tmp")),
            unittest.mock.patch.object(reader, "_now", side_effect=lambda: self.clock[0]),
        ]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)

    def read(self, page, advance=1.0):
        self.clock[0] += advance
        out = io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(io.StringIO()):
            rc = reader.main(["--plugin-root", str(self.root), "--role", "slide-designer", "--page", str(page)])
        return rc, out.getvalue()

    def test_a_second_page_in_the_same_call_is_refused_and_named(self):
        rc, first = self.read(1)
        self.assertEqual(rc, 0)
        rc, second = self.read(2)
        self.assertEqual(rc, 3)
        self.assertIn("REFERENCE_READ_REFUSED", second)
        self.assertIn("--role slide-designer --page 2", second)
        self.assertNotIn("Rule", second)

    def test_a_chain_of_pages_in_one_call_prints_one_page(self):
        printed = [self.read(page)[1] for page in (1, 2, 3, 4)]
        self.assertEqual(sum("REFERENCE_READ_REFUSED" in out for out in printed), 3)
        self.assertLessEqual(sum(len(out) for out in printed), reader.SAME_CALL_BUDGET_CHARS)

    def test_pages_in_separate_calls_all_arrive(self):
        for page in (1, 2, 3):
            rc, out = self.read(page, advance=2.5)
            self.assertEqual(rc, 0, page)
            self.assertNotIn("REFERENCE_READ_REFUSED", out)

    def test_short_reads_share_a_call(self):
        (self.root / "references" / "a.md").write_text("## A\nshort\n", encoding="utf-8")
        for _ in range(3):
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                self.assertEqual(reader.main(["--plugin-root", str(self.root), "--select", "a.md::A"]), 0)
            self.clock[0] += 0.1

    def test_off_codex_nothing_is_refused(self):
        with unittest.mock.patch.dict(os.environ, {"CODEX_THREAD_ID": ""}):
            for page in (1, 2):
                rc, out = self.read(page)
                self.assertEqual(rc, 0)

    def test_reads_started_together_print_at_most_one_page(self):
        # Real processes, as a code cell's parallel reads are.
        env = {**os.environ, "CODEX_THREAD_ID": f"parallel-{os.getpid()}", "TMP": str(self.root / "tmp"), "TEMP": str(self.root / "tmp")}
        (self.root / "tmp").mkdir(exist_ok=True)
        procs = [
            subprocess.Popen([sys.executable, str(SCRIPT), "--plugin-root", str(self.root), "--role", "slide-designer", "--page", str(p)],
                             env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            for p in (1, 2, 3)
        ]
        outs = [p.communicate(timeout=60)[0].decode("utf-8") for p in procs]
        self.assertLessEqual(sum("<!-- page" in out for out in outs), 1)
        self.assertLessEqual(sum(len(out) for out in outs), reader.SAME_CALL_BUDGET_CHARS)


if __name__ == "__main__":
    unittest.main()
