"""A safe local repair finishes inside the review that found it.

The failed run: slide 6's sticky statement rendered smaller than its zone
allowed. The reviewer blocked the deck and the orchestrator spawned a focused
slide-designer repair plus a confirmation round, for a change the reviewer's
own role names as its first permitted local repair ("making one existing
element larger within its settled layout"). Two rules pointed opposite ways:
the too-empty check called the repair "a layout choice upstream", while the
hand-over section said fix it yourself. These assertions hold the resolved
direction. The reviewer repairs, rebuilds through the supplied REBUILD_COMMAND,
re-renders, looks, and closes the finding itself; upstream keeps only repairs
that re-decide the layout. One role file serves the deck, the worksheets, the
stick-in sheets and the working wall, so the resolution reaches every artefact.
"""
from __future__ import annotations

import re
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / "scripts" / "make-lesson-runtime.py"


def read(*parts: str) -> str:
    text = ROOT.joinpath(*parts).read_text(encoding="utf-8")
    return re.sub(r"\s+", " ", text)


def runtime_slice(name: str) -> str:
    result = subprocess.run(
        ["python3", str(RUNTIME), "--slice", name],
        capture_output=True, text=True, check=True,
    )
    return re.sub(r"\s+", " ", result.stdout)


class ReviewerLocalRepairTests(unittest.TestCase):
    def setUp(self) -> None:
        self.reviewer = read("agents", "visual-reviewer.md")

    def test_the_too_small_element_is_the_local_repair_not_an_upstream_round(self) -> None:
        self.assertNotIn("a layout choice upstream rather than a re-render", self.reviewer)
        self.assertIn("make the change yourself and finish it", self.reviewer)
        self.assertIn(
            "making one existing element larger within its settled layout",
            self.reviewer,
        )

    def test_upstream_keeps_repairs_that_redecide_the_layout(self) -> None:
        self.assertIn(
            "Route it upstream only when giving the element its room means "
            "re-deciding the layout around it",
            self.reviewer,
        )

    def test_reviewer_finishes_its_own_repair_with_the_supplied_rebuild(self) -> None:
        self.assertNotIn("Do not rebuild.", self.reviewer)
        self.assertIn("`REBUILD_COMMAND`", self.reviewer)
        self.assertIn(
            "run that exact command, require its success result, re-render the "
            "affected pages through the established route",
            self.reviewer,
        )

    def test_fixed_still_requires_seeing_the_rebuilt_render(self) -> None:
        """The saved spawns must not cost the visual verification itself."""
        self.assertIn(
            "`FIXED` is valid only after visual verification of the rebuilt render",
            self.reviewer,
        )
        self.assertIn("restore the value you changed", self.reviewer)

    def test_the_wall_keeps_its_retained_builder_route(self) -> None:
        self.assertIn("Without a `REBUILD_COMMAND`", self.reviewer)
        self.assertIn("keep the finding explicitly unresolved", self.reviewer)

    def test_one_role_serves_every_artefact(self) -> None:
        self.assertIn(
            "`deck`, `worksheets`, `stick-in sheets`, or `working wall`",
            self.reviewer,
        )

    def test_orchestrator_supplies_the_rebuild_and_spawns_no_extra_rounds(self) -> None:
        text = runtime_slice("visual-review")
        self.assertIn("REBUILD_COMMAND", text)
        self.assertIn("finished inside that same review", text)
        self.assertIn("The working wall gets no `REBUILD_COMMAND`", text)
        self.assertIn(
            "Do not route a finding the reviewer has already fixed and confirmed "
            "into the focused-repair round",
            text,
        )


if __name__ == "__main__":
    sys.exit(unittest.main())
