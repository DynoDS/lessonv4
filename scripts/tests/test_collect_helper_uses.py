from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "collect-helper-uses.py"


class CollectHelperUsesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.design = self.root / "lesson-design.json"
        self.output = self.root / "uses.json"
        self.base = {
            "representations": [
                {
                    "id": "rep-001",
                    "name": "Part whole",
                    "purpose": "Show relationship",
                    "configurations": [
                        {
                            "id": "model",
                            "description": "Blank part",
                            "loadBearing": True,
                            "requiredFeatures": ["whole and parts"],
                        },
                        {
                            "id": "reminder",
                            "description": "Small reminder",
                            "loadBearing": False,
                            "requiredFeatures": [],
                        },
                    ],
                }
            ],
            "starter": {
                "representationRefs": [
                    {
                        "ref": "rep-001",
                        "configuration": "model",
                        "interaction": "pupil-writes-on",
                    }
                ]
            },
            "worksheet": {
                "representationRefs": [
                    {
                        "ref": "rep-001",
                        "configuration": "reminder",
                        "interaction": "view",
                    }
                ]
            },
        }

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_script(self, payload: dict, expected: int = 0) -> subprocess.CompletedProcess[str]:
        self.design.write_text(json.dumps(payload) + "\n", encoding="utf-8")
        completed = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--lesson-design",
                str(self.design),
                "--output",
                str(self.output),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(completed.returncode, expected, completed.stderr or completed.stdout)
        return completed

    def test_collects_and_deduplicates_exact_usage_keys(self) -> None:
        self.base["teachingSequence"] = [
            {
                "representationRefs": [
                    {
                        "ref": "rep-001",
                        "configuration": "model",
                        "interaction": "pupil-writes-on",
                    }
                ]
            }
        ]
        self.run_script(self.base)
        uses = json.loads(self.output.read_text(encoding="utf-8"))["uses"]
        keys = {
            (u["representationId"], u["configuration"], u["requiredSurface"], u["interaction"])
            for u in uses
        }
        self.assertEqual(
            keys,
            {
                ("rep-001", "model", "slides", "pupil-writes-on"),
                ("rep-001", "model", "stick-in", "pupil-writes-on"),
                ("rep-001", "reminder", "worksheets", "view"),
            },
        )

    def test_vocabulary_representation_is_slide_view(self) -> None:
        self.base["vocabulary"] = [
            {
                "visual": {
                    "kind": "representation",
                    "representationRef": "rep-001",
                    "configuration": "reminder",
                }
            }
        ]
        self.run_script(self.base)
        uses = json.loads(self.output.read_text(encoding="utf-8"))["uses"]
        self.assertTrue(
            any(
                u["configuration"] == "reminder"
                and u["requiredSurface"] == "slides"
                and u["interaction"] == "view"
                for u in uses
            )
        )

    def test_unknown_configuration_fails(self) -> None:
        self.base["starter"]["representationRefs"][0]["configuration"] = "missing"
        self.run_script(self.base, expected=2)
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
