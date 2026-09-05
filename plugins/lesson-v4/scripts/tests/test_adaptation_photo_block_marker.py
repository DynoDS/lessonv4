"""The `Photos for the sheets` block is a heading, not a phrase.

An adaptation that needed no new pictures wrote, in prose, "there is no
`Photos for the sheets` block and nothing to merge into the picture contract".
The parser searched for that phrase anywhere in the file, found it inside its
own denial, went looking for a fenced JSON object after it, and failed the whole
contract with `Photos for the sheets exists but has no fenced json object`.

The adaptation was correct. The run lost its worksheet track to a sentence.
"""
from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load():
    spec = importlib.util.spec_from_file_location(
        "photo_contract", ROOT / "scripts" / "photo-contract.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


SECTIONS = "## Greater Depth\n\nsomething\n\n## Below\n\nsomething\n\n"

FENCE = "```"


class AdaptationPhotoBlockMarkerTests(unittest.TestCase):
    def setUp(self):
        self.module = load()
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def write(self, body: str) -> Path:
        path = self.root / "adaptation.md"
        path.write_text(SECTIONS + body, encoding="utf-8")
        return path

    def test_a_prose_mention_of_the_block_is_not_the_block(self):
        path = self.write(
            "No new photographs are needed. Both sheets reuse photo-004, so there "
            "is no `Photos for the sheets` block and nothing to merge into the "
            "picture contract.\n"
        )
        self.assertEqual(self.module.adaptation_photos(path), [])

    def test_the_documented_heading_is_still_found_and_parsed(self):
        path = self.write(
            "## Photos for the sheets\n\n"
            + FENCE
            + 'json\n{"schema_version": 2, "lesson_name": "L", "photos": []}\n'
            + FENCE
            + "\n"
        )
        self.assertEqual(self.module.adaptation_photos(path), [])

    def test_a_heading_with_no_fenced_object_is_still_a_fault(self):
        # The check this was protecting must survive: a block that promises
        # pictures and carries none is a real error, and silently returning zero
        # would drop every picture the adaptation asked for.
        path = self.write("## Photos for the sheets\n\nnothing here\n")
        with self.assertRaises(self.module.PhotoContractError):
            self.module.adaptation_photos(path)

    def test_a_bold_heading_is_accepted_too(self):
        path = self.write(
            "**Photos for the sheets**\n\n"
            + FENCE
            + 'json\n{"schema_version": 2, "lesson_name": "L", "photos": []}\n'
            + FENCE
            + "\n"
        )
        self.assertEqual(self.module.adaptation_photos(path), [])


if __name__ == "__main__":
    unittest.main()
