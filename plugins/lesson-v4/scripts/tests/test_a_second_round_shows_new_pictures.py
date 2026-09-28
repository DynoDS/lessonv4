"""A second round on the same source never hands back the first round's files.

On 27 September 2026 a Year 4 history lesson asked for the Houses of
Parliament. Its ladder ran `unsplash` round 1 and later `unsplash` round 2, the
scout used the same query both times, and round 2 downloaded the same two
photographs. One of the picture's four rungs showed nothing new, and the
picture came back unsatisfied. Round 2 now skips whatever round 1 of the same
source already showed, whatever query it is given.

Run:
  python3 -m pytest scripts/tests/test_a_second_round_shows_new_pictures.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))  # the fetch scripts import their shared helpers from scripts/


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


unsplash = load("test_second_round_unsplash", "unsplash_fetch.py")
wikimedia = load("test_second_round_wikimedia", "wikimedia_fetch.py")


def write_jpeg(_url, dest):
    Image.new("RGB", (48, 32), (30, 90, 150)).save(dest, "JPEG")


def run(module, entry: Path, round_number: int, query: str) -> dict:
    out = entry / f"{module.SOURCE}-r{round_number}"
    argv = ["fetch", query, "--count", "2", "--round", str(round_number), "--output", str(out)]
    with mock.patch.object(sys, "argv", argv):
        module.main()
    return json.loads((out / f"_search-summary-{module.SOURCE}-r{round_number}.json").read_text(encoding="utf-8"))


class SecondRound(unittest.TestCase):
    def test_unsplash_round_two_skips_what_round_one_showed(self):
        photos = [{"id": f"p{n}", "urls": {"regular": f"https://x/{n}.jpg"}, "links": {"html": ""}} for n in range(6)]
        with tempfile.TemporaryDirectory() as tmp, \
                mock.patch.object(unsplash, "load_api_key", return_value="k"), \
                mock.patch.object(unsplash, "search_unsplash", return_value=photos), \
                mock.patch.object(unsplash, "trigger_download"), \
                mock.patch.object(unsplash, "download_image", side_effect=write_jpeg):
            entry = Path(tmp) / "f1f47e02987d"
            first = run(unsplash, entry, 1, "Houses of Parliament London")
            second = run(unsplash, entry, 2, "Houses of Parliament London")
        self.assertEqual([row["candidate_id"] for row in first["results"]], ["p0", "p1"])
        self.assertEqual([row["candidate_id"] for row in second["results"]], ["p2", "p3"])
        self.assertTrue(second["complete"])

    def test_wikimedia_round_two_skips_what_round_one_showed(self):
        items = [{"title": f"File:P{n}.jpg", "thumb_url": f"https://x/{n}.jpg", "page_url": ""} for n in range(6)]
        with tempfile.TemporaryDirectory() as tmp, \
                mock.patch.object(wikimedia, "search_commons", return_value=(items, ["Palace of Westminster"])), \
                mock.patch.object(wikimedia, "download_image", side_effect=write_jpeg):
            entry = Path(tmp) / "f1f47e02987d"
            run(wikimedia, entry, 1, "Palace of Westminster")
            second = run(wikimedia, entry, 2, "Palace of Westminster")
        self.assertEqual([row["candidate_id"] for row in second["results"]], ["File:P2.jpg", "File:P3.jpg"])
        self.assertEqual(len(second["considered"]), 6)

    def test_a_first_round_is_untouched(self):
        self.assertEqual(unsplash.already_shown("anywhere/unsplash-r1", 1), set())
        self.assertEqual(wikimedia.already_shown("anywhere/wikimedia-r1", 1), set())

    def test_a_round_two_with_no_round_one_searches_normally(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(unsplash.already_shown(str(Path(tmp) / "unsplash-r2"), 2), set())


if __name__ == "__main__":
    unittest.main()
