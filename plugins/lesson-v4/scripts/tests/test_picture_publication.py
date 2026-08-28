from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

try:
    from PIL import Image as PILImage
except ImportError:  # pragma: no cover - environment dependent
    PILImage = None


ROOT = Path(__file__).resolve().parents[1]
PUBLISHER = ROOT / "publish-picture.py"


def run_publisher(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(PUBLISHER), *args],
        capture_output=True,
        text=True,
        check=False,
    )


@unittest.skipUnless(PILImage is not None, "Pillow is required to exercise the publisher")
class PicturePublisherTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working" / "lesson"
        self.real_staging = self.working / "unsplash" / "_staging" / "real" / "p1" / "try-1"
        self.ai_staging = self.working / "unsplash" / "_staging" / "ai" / "p1-ai1" / "try-1"
        self.real_staging.mkdir(parents=True)
        self.ai_staging.mkdir(parents=True)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write_image(self, path: Path, fmt="JPEG", mode="RGB", size=(24, 16), colour=(200, 40, 40)) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        image = PILImage.new(mode, size, colour if mode != "RGBA" else colour + (128,))
        image.save(path, format=fmt)
        return path

    def publish(self, source: Path, filename: str, replace="no") -> subprocess.CompletedProcess[str]:
        return run_publisher(
            "publish",
            "--source", str(source),
            "--filename", filename,
            "--working-dir", str(self.working),
            "--replace", replace,
        )

    def remove(self, filename: str) -> subprocess.CompletedProcess[str]:
        return run_publisher(
            "remove",
            "--filename", filename,
            "--working-dir", str(self.working),
        )

    def test_publishes_matching_encoding_byte_for_byte(self):
        staged = self.write_image(self.real_staging / "winner.jpg", fmt="JPEG")
        out = self.publish(staged, "unsplash/a.jpg")
        self.assertEqual(out.returncode, 0, out.stdout)
        published = self.working / "unsplash" / "a.jpg"
        self.assertEqual(published.read_bytes(), staged.read_bytes())
        self.assertEqual(json.loads(out.stdout)["action"], "copied")

    def test_converts_png_bytes_behind_a_jpg_name(self):
        staged = self.write_image(self.real_staging / "winner.png", fmt="PNG", mode="RGBA")
        out = self.publish(staged, "unsplash/a.jpg")
        self.assertEqual(out.returncode, 0, out.stdout)
        published = self.working / "unsplash" / "a.jpg"
        with PILImage.open(published) as image:
            self.assertEqual(image.format, "JPEG")
            self.assertEqual(image.mode, "RGB")
            image.load()

    def test_refuses_source_outside_staging(self):
        rogue = self.working / "unsplash" / "rogue.jpg"
        self.write_image(rogue)
        out = self.publish(rogue, "unsplash/a.jpg")
        self.assertEqual(out.returncode, 1)
        self.assertIn("must live inside", out.stdout)
        self.assertFalse((self.working / "unsplash" / "a.jpg").exists())

    def test_refuses_traversal_and_absolute_destinations(self):
        staged = self.write_image(self.real_staging / "winner.jpg")
        for bad in ("../escape.jpg", "unsplash/../../escape.jpg", "/etc/passwd"):
            with self.subTest(filename=bad):
                out = self.publish(staged, bad)
                self.assertEqual(out.returncode, 1)

    def test_initial_publication_will_not_silently_replace(self):
        staged = self.write_image(self.real_staging / "winner.jpg")
        self.assertEqual(self.publish(staged, "unsplash/a.jpg").returncode, 0)
        original = (self.working / "unsplash" / "a.jpg").read_bytes()
        second = self.publish(staged, "unsplash/a.jpg")
        self.assertEqual(second.returncode, 1)
        self.assertEqual((self.working / "unsplash" / "a.jpg").read_bytes(), original)
        self.assertEqual(self.publish(staged, "unsplash/a.jpg", replace="yes").returncode, 0)

    def test_remove_targets_exactly_one_file(self):
        a = self.write_image(self.real_staging / "a" / "winner.jpg")
        b = self.write_image(self.real_staging / "b" / "winner.jpg")
        self.assertEqual(self.publish(a, "unsplash/a.jpg").returncode, 0)
        self.assertEqual(self.publish(b, "unsplash/b.jpg").returncode, 0)
        out = self.remove("unsplash/a.jpg")
        self.assertEqual(out.returncode, 0, out.stdout)
        self.assertFalse((self.working / "unsplash" / "a.jpg").exists())
        self.assertTrue((self.working / "unsplash" / "b.jpg").exists())

    def test_focused_replacement_changes_only_the_target(self):
        a = self.write_image(self.real_staging / "a" / "winner.jpg", colour=(10, 10, 200))
        b = self.write_image(self.real_staging / "b" / "winner.jpg", colour=(10, 200, 10))
        self.assertEqual(self.publish(a, "unsplash/a.jpg").returncode, 0)
        self.assertEqual(self.publish(b, "unsplash/b.jpg").returncode, 0)
        sibling_before = (self.working / "unsplash" / "b.jpg").read_bytes()
        self.assertEqual(self.remove("unsplash/a.jpg").returncode, 0)
        repaired = self.write_image(self.ai_staging / "a" / "repair.jpg", colour=(240, 240, 10))
        out = self.publish(repaired, "unsplash/a.jpg", replace="yes")
        self.assertEqual(out.returncode, 0, out.stdout)
        self.assertEqual((self.working / "unsplash" / "a.jpg").read_bytes(), repaired.read_bytes())
        self.assertEqual((self.working / "unsplash" / "b.jpg").read_bytes(), sibling_before)

    def test_failed_repair_leaves_the_target_absent(self):
        staged = self.write_image(self.real_staging / "winner.jpg")
        self.assertEqual(self.publish(staged, "unsplash/a.jpg").returncode, 0)
        self.assertEqual(self.remove("unsplash/a.jpg").returncode, 0)
        failed = self.publish(self.real_staging / "missing.jpg", "unsplash/a.jpg", replace="yes")
        self.assertEqual(failed.returncode, 1)
        self.assertFalse((self.working / "unsplash" / "a.jpg").exists())

    def test_non_image_staged_file_is_refused(self):
        staged = self.real_staging / "winner.jpg"
        staged.write_bytes(b"this is not an image")
        out = self.publish(staged, "unsplash/a.jpg")
        self.assertEqual(out.returncode, 1)
        self.assertFalse((self.working / "unsplash" / "a.jpg").exists())


if __name__ == "__main__":
    unittest.main()
