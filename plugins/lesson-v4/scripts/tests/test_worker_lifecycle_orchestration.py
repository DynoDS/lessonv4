from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RESOURCES = ROOT


class WorkerLifecycleOrchestrationTests(unittest.TestCase):
    def test_unified_picture_worker_is_the_only_picture_agent(self):
        agents = sorted(path.name for path in (ROOT / "agents").glob("*image-scout*"))
        self.assertEqual(agents, ["image-scout.md"])
        self.assertIn("name: image-scout", (ROOT / "agents" / "image-scout.md").read_text(encoding="utf-8"))

    def test_compiler_and_finalizer_are_the_picture_boundaries(self):
        compiler = (ROOT / "scripts" / "compile-picture-assignments.py").read_text(encoding="utf-8")
        finalizer = (ROOT / "scripts" / "finalize-picture-assignment.py").read_text(encoding="utf-8")
        self.assertIn("def compile_command", compiler)
        self.assertIn("def repair_command", compiler)
        self.assertIn("def assignment_command", finalizer)
        self.assertIn("def provenance_command", finalizer)
        self.assertIn("PUBLISH_ATTEMPTS = 1", finalizer)

    def test_active_runtime_uses_direct_picture_workers(self):
        text = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        self.assertIn("Launch one unified `image-scout` per assignment", text)
        self.assertIn("up to four at", text)
        self.assertIn("no more than two direct-AI batches", text)
        self.assertNotIn("orchestration-controller.py", text)

    def test_worker_spec_contract_is_documented(self):
        text = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        for marker in ("unified `image-scout`", "exact assignment path", "one unique result path"):
            self.assertIn(marker, text)

    def test_durable_attempt_result_path_is_exact(self):
        text = (ROOT / "scripts" / "compile-picture-assignments.py").read_text(encoding="utf-8")
        self.assertIn("picture-workers", text)
        self.assertIn("try-{attemptNumber}", text)
        self.assertIn("result.json", text)
        self.assertIn("_picture-work", text)

    def test_final_resource_visual_review_remains_in_playbook(self):
        text = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
        self.assertIn("Visual Review", text)
        self.assertIn("visual-review.md", text)
        self.assertIn("**Start each artefact's visual reviewer here", text)


if __name__ == "__main__":
    unittest.main()
