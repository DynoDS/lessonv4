from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
COVERAGE = ROOT / "scripts" / "check-helper-coverage.py"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
SLIDE_DESIGNER = ROOT / "agents" / "slide-designer.md"
WORKSHEET_DESIGNER = ROOT / "agents" / "worksheet-designer.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class HelperDeliveryAtTheDesignerGateTests(unittest.TestCase):
    """A promised helper was substituted, and nothing noticed until after the build.

    On 1 September 2026 the Year 4 balanced-diet deck recorded `body-jobs` as
    covered by `concept-map`, then composed a visually similar layout out of
    ordinary slide elements. The slide-design validator accepted it, because it
    only asks whether the specification is valid. The helper-delivery check
    caught it correctly - but it ran at the orchestrator, after the deck was
    built, so the run paid a focused repair worker and a second render for a
    fault the designer could have seen at its own gate.

    The check reads the specification only. Nothing about it needed the build.
    """

    def test_the_check_needs_no_built_artefact(self) -> None:
        """Sufficiency: if it needed the deck, moving it earlier would be a lie."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            verdict = root / "helper-check.json"
            verdict.write_text(json.dumps({
                "schemaVersion": 1,
                "decisions": [{
                    "representationId": "rep-001",
                    "configuration": "body-jobs",
                    "requiredSurface": "slides",
                    "decision": "covered",
                    "helperKey": "concept-map",
                }],
            }), encoding="utf-8")

            substitute = root / "lesson.json.tmp.a1"
            substitute.write_text(json.dumps({
                "slides": [{
                    "template": "split-h-70-30",
                    "primary": {"type": "row", "items": [{"type": "stack", "items": []}]},
                }],
            }), encoding="utf-8")

            failed = subprocess.run(
                [sys.executable, str(COVERAGE), "delivery", "--verdict", str(verdict),
                 "--spec", str(substitute), "--surface", "slides"],
                capture_output=True, text=True,
            )
            self.assertEqual(failed.returncode, 1)
            self.assertIn("HELPER_DELIVERY_FAILED", failed.stderr)
            self.assertIn("concept-map", failed.stderr)

            delivered = root / "lesson.json.tmp.a2"
            delivered.write_text(json.dumps({
                "slides": [{
                    "template": "split-h-70-30",
                    "primary": {"type": "concept-map", "centre": "Nutrients", "spokes": []},
                }],
            }), encoding="utf-8")

            passed = subprocess.run(
                [sys.executable, str(COVERAGE), "delivery", "--verdict", str(verdict),
                 "--spec", str(delivered), "--surface", "slides"],
                capture_output=True, text=True,
            )
            self.assertEqual(passed.returncode, 0, passed.stderr)
            self.assertIn("HELPER_DELIVERY_OK 1", passed.stdout)

    def test_each_designer_is_given_the_verdict_it_is_held_to(self) -> None:
        """A designer cannot keep a promise it was never shown.

        `helper-check.json` was not among either designer's authoritative
        inputs, so the recorded `helperKey` reached neither of them.
        """
        playbook = flat(PLAYBOOK)
        self.assertEqual(
            playbook.count("HELPER_CHECK: [WORKING_DIR]/helper-check.json"), 2,
            "both the slide and worksheet designer launches must carry the verdict",
        )
        self.assertIn("helper-check.json", flat(SLIDE_DESIGNER))
        self.assertIn("helper-check.json", flat(WORKSHEET_DESIGNER))

    def test_each_designer_runs_the_delivery_check_at_its_own_gate(self) -> None:
        for role, surface in ((SLIDE_DESIGNER, "slides"), (WORKSHEET_DESIGNER, "worksheets")):
            with self.subTest(role=role.name):
                text = flat(role)
                self.assertIn('check-helper-coverage.py" delivery', text)
                self.assertIn(f"--surface {surface}", text)
                self.assertIn("HELPER_DELIVERY_OK", text)

    def test_a_lookalike_is_named_as_not_delivery(self) -> None:
        """The general rule ('a helper gap beats a false representation') was
        already there and lost anyway, because nothing tied it to the recorded
        decision. Each designer now says what a substitute is."""
        for role in (SLIDE_DESIGNER, WORKSHEET_DESIGNER):
            with self.subTest(role=role.name):
                self.assertIn("hand-built", flat(role))

    def test_the_orchestrator_keeps_its_independent_backstop(self) -> None:
        """The designer's own gate is the cheap catch, not a reason to drop the
        independent one: a designer that skips its check would otherwise ship."""
        playbook = flat(PLAYBOOK)
        self.assertIn("Require `HELPER_DELIVERY_OK`. A failure means", playbook)
        self.assertIn("a failure here is a designer that skipped it", playbook)

    def test_a_promised_helper_gets_its_layout_first(self) -> None:
        """The substitute was reached for because the layout was chosen first and
        the helper did not fit what was left."""
        self.assertIn("layout priority over prose, furniture and decoration", flat(SLIDE_DESIGNER))
        self.assertIn("The priority stops at the thing children read from", flat(SLIDE_DESIGNER))


if __name__ == "__main__":
    unittest.main()
