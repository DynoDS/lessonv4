from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class PluginVersionSyncTests(unittest.TestCase):
    def test_manifest_versions_are_valid_and_match(self) -> None:
        claude = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
        codex = json.loads((ROOT / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8"))
        self.assertEqual(claude["version"], codex["version"])
        self.assertRegex(
            claude["version"],
            re.compile(r"^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$"),
        )


if __name__ == "__main__":
    unittest.main()
