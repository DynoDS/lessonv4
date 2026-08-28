from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class PluginVersionSyncTests(unittest.TestCase):
    def test_manifests_are_3300_and_match(self) -> None:
        claude = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
        codex = json.loads((ROOT / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8"))
        self.assertEqual(claude["version"], "3.30.0")
        self.assertEqual(codex["version"], "3.30.0")


if __name__ == "__main__":
    unittest.main()
