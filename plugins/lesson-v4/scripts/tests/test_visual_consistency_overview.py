from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    fitz = None


SCRIPT = (
    Path(__file__).resolve().parents[1]
    / "build-visual-consistency-overview.py"
)


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


@unittest.skipIf(fitz is None, "PyMuPDF is unavailable")
class VisualConsistencyOverviewTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.output_dir = self.root / "overview"
        self.output_manifest = self.root / "visual-consistency-overview.json"

    def make_png(self, path: Path, label: str) -> None:
        document = fitz.open()
        try:
            page = document.new_page(width=200, height=120)
            page.insert_text((20, 60), label, fontsize=18)
            pixmap = page.get_pixmap(alpha=False)
            pixmap.save(str(path))
        finally:
            document.close()

    def make_render_manifest(
        self,
        label: str,
        page_count: int,
    ) -> Path:
        slug = label.lower().replace(" ", "-")
        source = self.root / f"{slug}.pdf"
        source_document = fitz.open()
        try:
            source_document.new_page(width=200, height=120)
            source_document.save(str(source))
        finally:
            source_document.close()

        kept_pdf = self.root / f"{slug}-source.pdf"
        kept_pdf.write_bytes(source.read_bytes())

        pages = []
        for number in range(1, page_count + 1):
            page_path = self.root / f"{slug}-page-{number:02d}.png"
            self.make_png(page_path, f"{label} {number}")
            pages.append(
                {
                    "number": number,
                    "path": str(page_path),
                    "sha256": sha256_file(page_path),
                }
            )

        manifest = self.root / f"{slug}-render.json"
        manifest.write_text(
            json.dumps(
                {
                    "version": 1,
                    "source": str(source),
                    "sourceSha256": sha256_file(source),
                    "officeRoute": None,
                    "pdfRoute": "pymupdf",
                    "dpi": 110,
                    "pdf": {
                        "path": str(kept_pdf),
                        "sha256": sha256_file(kept_pdf),
                    },
                    "pages": pages,
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        return manifest

    def run_script(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *arguments],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_build_and_verify_overview(self) -> None:
        deck = self.make_render_manifest("Deck", 5)
        worksheets = self.make_render_manifest("Worksheets", 2)

        built = self.run_script(
            "build",
            "--output-dir",
            str(self.output_dir),
            "--output-manifest",
            str(self.output_manifest),
            "--manifest",
            f"Deck={deck}",
            "--manifest",
            f"Worksheets={worksheets}",
        )

        self.assertEqual(built.returncode, 0, built.stderr)
        self.assertIn(
            "VISUAL_CONSISTENCY_OVERVIEW_OK",
            built.stdout,
        )
        self.assertTrue(self.output_manifest.is_file())

        overview = json.loads(
            self.output_manifest.read_text(encoding="utf-8")
        )
        self.assertEqual(overview["schemaVersion"], 1)
        self.assertEqual(
            [resource["label"] for resource in overview["resources"]],
            ["Deck", "Worksheets"],
        )
        self.assertEqual(
            overview["resources"][0]["overviewPages"][0]["sourcePages"],
            [1, 2, 3, 4, 5],
        )

        for resource in overview["resources"]:
            for page in resource["overviewPages"]:
                page_path = Path(page["path"])
                self.assertTrue(page_path.is_file())
                self.assertEqual(
                    sha256_file(page_path),
                    page["sha256"],
                )

        verified = self.run_script(
            "verify",
            "--manifest",
            str(self.output_manifest),
        )
        self.assertEqual(verified.returncode, 0, verified.stderr)
        self.assertIn(
            "VISUAL_CONSISTENCY_OVERVIEW_VERIFIED",
            verified.stdout,
        )

    def test_stale_render_page_is_rejected(self) -> None:
        deck = self.make_render_manifest("Deck", 2)
        deck_manifest = json.loads(deck.read_text(encoding="utf-8"))
        stale_page = Path(deck_manifest["pages"][1]["path"])
        stale_page.write_bytes(b"changed rendered pixels")

        completed = self.run_script(
            "build",
            "--output-dir",
            str(self.output_dir),
            "--output-manifest",
            str(self.output_manifest),
            "--manifest",
            f"Deck={deck}",
        )

        self.assertEqual(completed.returncode, 1)
        self.assertIn(
            "Deck page 2 SHA-256 changed",
            completed.stderr,
        )
        self.assertFalse(self.output_manifest.exists())

    def test_duplicate_resource_label_is_rejected(self) -> None:
        deck_one = self.make_render_manifest("Deck One", 1)
        deck_two = self.make_render_manifest("Deck Two", 1)

        completed = self.run_script(
            "build",
            "--output-dir",
            str(self.output_dir),
            "--output-manifest",
            str(self.output_manifest),
            "--manifest",
            f"Deck={deck_one}",
            "--manifest",
            f"Deck={deck_two}",
        )

        self.assertEqual(completed.returncode, 1)
        self.assertIn(
            "duplicate resource label: Deck",
            completed.stderr,
        )
        self.assertFalse(self.output_manifest.exists())

    def test_technical_failure_after_verified_evidence_is_unavailable(
        self,
    ) -> None:
        # Every recorded hash must verify first, so a page that is
        # hash-correct but not a loadable image is a technical inability to
        # create the optional overview (exit 2), not stale evidence (exit 1).
        deck = self.make_render_manifest("Deck", 1)
        manifest_data = json.loads(deck.read_text(encoding="utf-8"))
        page_path = Path(manifest_data["pages"][0]["path"])
        page_path.write_bytes(b"not a real image, just recorded bytes")
        manifest_data["pages"][0]["sha256"] = sha256_file(page_path)
        deck.write_text(
            json.dumps(manifest_data, indent=2) + "\n",
            encoding="utf-8",
        )

        completed = self.run_script(
            "build",
            "--output-dir",
            str(self.output_dir),
            "--output-manifest",
            str(self.output_manifest),
            "--manifest",
            f"Deck={deck}",
        )

        self.assertEqual(completed.returncode, 2)
        self.assertIn(
            "VISUAL_CONSISTENCY_OVERVIEW_UNAVAILABLE",
            completed.stderr,
        )
        self.assertFalse(self.output_manifest.exists())


if __name__ == "__main__":
    unittest.main()
