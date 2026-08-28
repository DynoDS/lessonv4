from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "validate-working-wall-evidence.py"
SPEC = importlib.util.spec_from_file_location(
    "validate_working_wall_evidence",
    SCRIPT,
)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Could not load {SCRIPT}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ValidateWorkingWallEvidenceTests(unittest.TestCase):
    def test_complete_emoji_picture_value_is_a_promised_visual(self) -> None:
        found: list[str] = []
        MODULE.collect_visuals(
            {
                "picture": {
                    "kind": "emoji",
                    "value": "🔌",
                    "alt": "electrical plug",
                }
            },
            "/cards/0",
            found,
        )
        self.assertEqual(found, ["/cards/0/picture/value"])

    def test_resolved_educational_svg_picture_keeps_image_path_pointer(self) -> None:
        found: list[str] = []
        MODULE.collect_visuals(
            {
                "picture": {
                    "kind": "educational-svg",
                    "concept": "electrical plug",
                    "context": "A recognisable electrical plug.",
                    "avoid": [],
                    "educationalSvgId": "standard/uk/uk-mains-plug.svg",
                    "educationalSvgSlug": "electrical-plug",
                    "imagePath": "icons/electrical-plug.png",
                }
            },
            "/cards/0",
            found,
        )
        self.assertEqual(found, ["/cards/0/picture/imagePath"])


if __name__ == "__main__":
    unittest.main()
