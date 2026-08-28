import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "sharepoint_sync.py"
SPEC = importlib.util.spec_from_file_location("sharepoint_sync", SCRIPT)
sharepoint_sync = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(sharepoint_sync)


TERM_TEXT = """\
| Term | Starts | Ends |
| --- | --- | --- |
| Autumn, term 1 | Tuesday 1 September 2026 | Friday 23 October 2026 |
| Summer, term 6 | Monday 7 June 2027 | Wednesday 21 July 2027 |
"""


class SharePointSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.school_root = self.root / "Felmore Primary School"
        self.school_root.mkdir()
        self.source = self.root / "output"
        self.source.mkdir()
        self.term_file = self.root / "Term.md"
        self.term_file.write_text(TERM_TEXT, encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def test_derives_school_year_from_term_file(self):
        self.assertEqual(
            sharepoint_sync.derive_school_year(self.term_file),
            "2026-2027",
        )

    def test_copies_only_explicit_files_to_core_subject_day(self):
        wanted = self.source / "Decimals.pptx"
        wanted.write_bytes(b"pptx")
        (self.source / "Older Lesson.pptx").write_bytes(b"old")

        destination, files = sharepoint_sync.sync_files(
            term_file=self.term_file,
            school_root=self.school_root,
            year_group=4,
            term_folder="Autumn 1",
            week=2,
            subject="Maths",
            day="Monday",
            source=self.source,
            requested=["Decimals.pptx"],
            dry_run=False,
        )

        self.assertEqual(
            destination,
            self.school_root
            / "2026-2027 - Year 4"
            / "Autumn 1"
            / "Week 2"
            / "Maths"
            / "Monday",
        )
        self.assertEqual([path.name for path in files], ["Decimals.pptx"])
        self.assertTrue((destination / "Decimals.pptx").is_file())
        self.assertFalse((destination / "Older Lesson.pptx").exists())

    def test_foundation_subject_has_no_day_layer(self):
        (self.source / "Rainforests.html").write_text("lesson", encoding="utf-8")

        destination, _ = sharepoint_sync.sync_files(
            term_file=self.term_file,
            school_root=self.school_root,
            year_group=4,
            term_folder="Autumn 1",
            week=3,
            subject="Geography",
            day="",
            source=self.source,
            requested=["Rainforests.html"],
            dry_run=False,
        )

        self.assertEqual(destination.name, "Geography")
        self.assertEqual(destination.parent.name, "Week 3")

    def test_rejects_path_traversal(self):
        with self.assertRaises(ValueError):
            sharepoint_sync.validate_filename("../other.pptx")


if __name__ == "__main__":
    unittest.main()
