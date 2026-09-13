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

        destination, files, _ = sharepoint_sync.sync_files(
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
        (self.source / "Rainforests.pptx").write_bytes(b"deck")

        destination, _, _ = sharepoint_sync.sync_files(
            term_file=self.term_file,
            school_root=self.school_root,
            year_group=4,
            term_folder="Autumn 1",
            week=3,
            subject="Geography",
            day="",
            source=self.source,
            requested=["Rainforests.pptx"],
            dry_run=False,
        )

        self.assertEqual(destination.name, "Geography")
        self.assertEqual(destination.parent.name, "Week 3")

    def test_rejects_path_traversal(self):
        with self.assertRaises(ValueError):
            sharepoint_sync.validate_filename("../other.pptx")


    def test_a_file_already_at_its_destination_is_left_in_place(self):
        """A maths run built its resources directly in the mapped SharePoint
        folder, so source and destination were the same files; the copy
        raised WinError 32 and the report logged a sync failure for a
        delivery that had already happened."""
        destination = sharepoint_sync.destination_for(
            self.school_root, "2026-2027", 4, "Autumn 1", 1, "Maths", "Thursday"
        )
        destination.mkdir(parents=True)
        (destination / "Lesson.pptx").write_bytes(b"deck")
        result_destination, files, _ = sharepoint_sync.sync_files(
            term_file=self.term_file,
            school_root=self.school_root,
            year_group=4,
            term_folder="Autumn 1",
            week=1,
            subject="Maths",
            day="Thursday",
            source=destination,
            requested=["Lesson.pptx"],
            dry_run=False,
        )
        self.assertEqual(result_destination, destination)
        self.assertEqual([path.name for path in files], ["Lesson.pptx"])
        self.assertEqual((destination / "Lesson.pptx").read_bytes(), b"deck")

    def test_only_teaching_resources_reach_the_drive(self):
        """The teacher's drive gets the deck, worksheets, wall and stick-in
        sheets. A run once filed its run report and walk-through into the
        day folder and the teacher deleted them (13 September 2026)."""
        names = [
            "Lesson.pptx", "Lesson - Worksheets.pdf", "Working Wall - Lesson.pdf",
            "Lesson - Stick-in Sheets.pdf", "Lesson - Answers.txt",
            "Lesson - walk-through.md", "Lesson - run report.md",
            "Lesson - Worksheets-expected.html",
        ]
        for name in names:
            (self.source / name).write_bytes(b"x")
        destination, files, skipped = sharepoint_sync.sync_files(
            term_file=self.term_file, school_root=self.school_root, year_group=4,
            term_folder="Autumn 1", week=2, subject="Maths", day="Monday",
            source=self.source, requested=names, dry_run=False,
        )
        copied = sorted(p.name for p in destination.iterdir())
        self.assertEqual(copied, sorted(names[:4]))
        self.assertEqual(sorted(p.name for p in skipped), sorted(names[4:]))
        self.assertTrue((self.source / "Lesson - run report.md").is_file(), "records stay where the run made them")


if __name__ == "__main__":
    unittest.main()
