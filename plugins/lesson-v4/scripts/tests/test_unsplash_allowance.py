"""One search costs one call of the Unsplash allowance, not one per candidate.

Unsplash allows 50 calls an hour. The fetcher used to tell Unsplash about every
candidate a search downloaded, so a search of three candidates spent four calls
and one picture-heavy lesson could spend the hour alone. Every picture after
that was lost for the run: in the 7 October 2026 stress test that is how a
sponge, a raincoat and a night-time tree never arrived. Unsplash is now told
once, about the photograph that is published.
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


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


unsplash = load("allowance_unsplash", "unsplash_fetch.py")
finalizer = load("allowance_finalizer", "finalize-picture-assignment.py")


def write_jpeg(_url, dest):
    Image.new("RGB", (48, 32), (30, 90, 150)).save(dest, "JPEG")


class UnsplashAllowanceTests(unittest.TestCase):
    def test_a_search_tells_unsplash_about_no_candidate(self):
        photos = [{"id": f"p{n}", "urls": {"regular": f"https://x/{n}.jpg"}, "links": {"html": ""}} for n in range(6)]
        with tempfile.TemporaryDirectory() as tmp, \
                mock.patch.object(unsplash, "load_api_key", return_value="k"), \
                mock.patch.object(unsplash, "search_unsplash", return_value=photos), \
                mock.patch.object(unsplash, "trigger_download") as told, \
                mock.patch.object(unsplash, "download_image", side_effect=write_jpeg), \
                mock.patch.object(sys, "argv", ["fetch", "a sponge", "--count", "3", "--output", tmp]):
            unsplash.main()
        told.assert_not_called()

    def test_record_use_tells_unsplash_once(self):
        with mock.patch.object(unsplash, "load_api_key", return_value="k"), \
                mock.patch.object(unsplash, "trigger_download") as told, \
                mock.patch.object(sys, "argv", ["fetch", "--record-use", "p3"]):
            unsplash.main()
        told.assert_called_once_with("p3", "k")

    def test_record_use_never_fails_a_run(self):
        with mock.patch.object(unsplash, "load_api_key", side_effect=SystemExit(1)), \
                mock.patch.object(sys, "argv", ["fetch", "--record-use", "p3"]):
            unsplash.main()

    def summary(self, tmp, source):
        path = Path(tmp) / "summary.json"
        path.write_text(json.dumps({"results": [{"candidate_id": "p3", "source": source}]}), encoding="utf-8")
        return {"summary_path": str(path), "candidate_id": "p3"}

    def test_the_published_unsplash_photograph_is_recorded(self):
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(finalizer.subprocess, "run") as ran:
            finalizer.record_unsplash_use(self.summary(tmp, "unsplash"), "sourced")
        self.assertEqual(ran.call_args[0][0][-2:], ["--record-use", "p3"])

    def test_a_photograph_from_elsewhere_is_not(self):
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(finalizer.subprocess, "run") as ran:
            finalizer.record_unsplash_use(self.summary(tmp, "wikimedia"), "sourced")
            finalizer.record_unsplash_use(None, "generated")
        ran.assert_not_called()


if __name__ == "__main__":
    unittest.main()
