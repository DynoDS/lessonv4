from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class PictureContextBudgetTests(unittest.TestCase):
    def test_reference_byte_budgets(self):
        limits = {
            ROOT / "agents" / "image-scout.md": 8000,
            ROOT / "references" / "image-scout-search.md": 10000,
            ROOT / "references" / "image-scout-generation.md": 9000,
            ROOT / "references" / "image-scout-recovery-repair.md": 5000,
        }
        for path, limit in limits.items():
            self.assertLessEqual(len(path.read_bytes()), limit, path.name)

    def test_deleted_planner_and_ai_agent_paths_do_not_exist(self):
        self.assertFalse((ROOT / "agents" / "image-scout-designer.md").exists())
        self.assertFalse((ROOT / "agents" / "image-scout-ai.md").exists())

    def test_active_picture_instructions_have_no_photo_plan_files(self):
        active = "\n".join([
            (ROOT / "agents" / "image-scout.md").read_text(encoding="utf-8"),
            (ROOT / "skills" / "make-lesson" / "SKILL.md").read_text(encoding="utf-8"),
            (ROOT / "skills" / "make-lesson" / "playbook.md").read_text(encoding="utf-8"),
        ])
        self.assertNotIn("photo-plan-", active)
        self.assertNotIn("image-scout-designer", active)
        self.assertNotIn("image-scout-ai", active)

    def test_image_scout_names_each_conditional_reference_exactly_once(self):
        text = (ROOT / "agents" / "image-scout.md").read_text(encoding="utf-8")
        for name in ("image-scout-search.md", "image-scout-generation.md", "image-scout-recovery-repair.md"):
            self.assertEqual(text.count(name), 1, name)


if __name__ == "__main__":
    unittest.main()
