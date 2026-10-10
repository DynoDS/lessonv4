"""Every downloaded picture is saved in a form the worker's viewer can open.

The plugin's tools read a file the worker's picture viewer refuses, and one
refused picture takes the pictures beside it out of the worker's view (stress
test, 7 October 2026: seven workers, three files, all beginning FF D8 FF FF).
"""
from __future__ import annotations

import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    from PIL import Image, ImageChops
except ImportError:  # pragma: no cover - environment dependent
    Image = None

import picture_plain  # noqa: E402

FETCHERS = ("unsplash_fetch.py", "wikimedia_fetch.py", "openverse_fetch.py", "web_fetch.py")


def photo(fmt="JPEG", size=(96, 64), **options) -> bytes:
    image = Image.new("RGB", size)
    image.putdata([(x * 255 // size[0], y * 255 // size[1], 120) for y in range(size[1]) for x in range(size[0])])
    out = io.BytesIO()
    image.save(out, format=fmt, **options)
    return out.getvalue()


def pixels(data: bytes):
    with Image.open(io.BytesIO(data)) as image:
        return image.convert("RGB").copy()


@unittest.skipUnless(Image is not None, "Pillow is required")
class PlainPictureTests(unittest.TestCase):
    def test_a_stray_fill_byte_is_gone_and_the_picture_is_the_same(self):
        raw = photo(quality=85)
        odd = raw[:2] + b"\xff" + raw[2:]
        plain = picture_plain.plain_bytes(odd)
        self.assertEqual(plain[:2], b"\xff\xd8")
        self.assertNotEqual(plain[2:4], b"\xff\xff")
        before, after = pixels(odd), pixels(plain)
        self.assertEqual(before.size, after.size)
        worst = max(high for _, high in ImageChops.difference(before, after).getextrema())
        self.assertLessEqual(worst, 16)

    def test_a_plain_picture_is_left_exactly_alone(self):
        once = picture_plain.plain_bytes(photo(quality=85))
        self.assertEqual(picture_plain.plain_bytes(once), once)
        png = picture_plain.plain_bytes(photo("PNG"))
        self.assertEqual(picture_plain.plain_bytes(png), png)
        self.assertEqual(pixels(png).tobytes(), pixels(photo("PNG")).tobytes())

    def test_what_is_not_a_picture_comes_back_untouched(self):
        for data in (b"", b"<html>not found</html>", photo("GIF")):
            self.assertEqual(picture_plain.plain_bytes(data), data)

    def test_every_source_saves_its_download_plain(self):
        for name in FETCHERS:
            source = (ROOT / name).read_text(encoding="utf-8")
            self.assertIn("_atomic_write(dest_path, plain_bytes(data))", source, name)
            self.assertNotIn("_atomic_write(dest_path, data)", source, name)

    def test_a_worker_can_make_a_fresh_copy_to_look_at(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "big.jpg"
            source.write_bytes(photo(size=(2400, 1200)))
            output = Path(tmp) / "view" / "big.jpg"
            done = subprocess.run(
                [sys.executable, str(ROOT / "picture_plain.py"), "copy", "--source", str(source), "--output", str(output)],
                capture_output=True, text=True, check=False,
            )
            self.assertEqual(done.returncode, 0, done.stderr)
            self.assertIn("PICTURE_PLAIN_COPY:", done.stdout)
            with Image.open(output) as image:
                self.assertEqual(image.size, (1600, 800))


if __name__ == "__main__":
    unittest.main()
