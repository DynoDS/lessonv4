"""A picture that will never arrive must not take a whole resource with it.

The run this came from: one worksheet photograph - an incomplete buzzer circuit
for a Year 4 no-symbol drawing task - could not be generated inside its two-call
budget and terminalised `unsatisfied`. Nothing reconciled that against
`worksheet.json`, which still named it, so the build ran into a certain
`IMAGE_MISSING` and returned `FIXED_RESOURCE_FAILED worksheets`. The failure was
then sent to the worksheet designer's focused repair, whose role file forbids
changing a required photograph into a different access route, so it correctly
reported `NOT FIXED` and changed nothing. The class got no Below sheet, no
Expected sheet, no Greater Depth sheet and no answer key, for one picture on one
question.

Three things had to be true for that to happen, and each is checked here:

1. the tracks did not compare the specification's picture references against
   the terminal receipts before building;
2. the builder's `IMAGE_MISSING` row named only the picture-repair route, which
   cannot run once a filename's ledger is spent;
3. the focused repair roles had no exception for a reference nobody can honour.
"""
from __future__ import annotations

import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / "scripts" / "make-lesson-runtime.py"
WORKSHEET_BUILDER = ROOT / "agents" / "worksheet-builder.md"
GENERATION = ROOT / "references" / "image-scout-generation.md"
WORKSHEET_REPAIR = ROOT / "agents" / "worksheet-designer-focused-repair.md"
SLIDE_REPAIR = ROOT / "agents" / "slide-designer-focused-repair.md"
WALL_REPAIR = ROOT / "agents" / "working-wall-designer-focused-repair.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def slice_text(name: str) -> str:
    return " ".join(
        subprocess.run(
            ["python3", str(RUNTIME), "--slice", name],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.split()
    )


class UnavailablePictureRouteTests(unittest.TestCase):
    def test_the_picture_slice_says_terminal_means_never_coming(self):
        text = slice_text("pictures")
        self.assertIn("terminal means never coming", text)
        self.assertIn("nothing left to run for it", text)
        self.assertIn("reconciles its own specification", text)

    def test_the_worksheet_track_reconciles_before_it_builds(self):
        """The sheets are one document, so this is where the family is lost."""
        text = slice_text("worksheet-render")
        self.assertIn("Terminal includes `unsatisfied` and `omitted`", text)
        self.assertIn("Reconcile before building", text)
        self.assertIn("loses all three and the answer key", text)
        self.assertIn("the repair, not a scope breach", text)

    def test_the_slide_track_reconciles_before_it_builds(self):
        text = slice_text("slides-finalize")
        self.assertIn("Reconcile first", text)
        self.assertIn("`unsatisfied` or `omitted`", text)
        self.assertIn("focused Slide Designer repair", text)
        self.assertIn("the repair, not a scope breach", text)

    def test_the_reconciliation_is_readable_without_the_other_track_s_slice(self):
        """A worksheet-only reader never loads the picture or slide slices.

        A pointer to a section in a slice this branch does not load is a rule
        nobody can follow, which is the same shape as the dead route it is
        replacing. Each track therefore states its own reconciliation whole.
        """
        for name in ("worksheet-render", "slides-finalize"):
            with self.subTest(track=name):
                text = slice_text(name)
                self.assertIn("terminally unavailable", text)
                self.assertIn("repair", text)

    def test_a_good_base_for_an_edit_is_defined_by_where_the_fault_is(self):
        """The second call was spent editing an image with the wrong object in it.

        The buzzer's fault was that its body carried no two distinct terminals -
        the taught object itself. The correction edited that image, which kept
        the object and added terminals beside the wrong contact, and the budget
        was gone. "Prefer an edit when the first image is a good base" gave no
        way to tell that case from a bad crop.
        """
        text = flat(GENERATION)
        self.assertIn("A good base is an image whose fault is not in the taught object", text)
        self.assertIn("identity, structure or connection points", text)
        self.assertIn("spend the call on a fresh prompt", text)

    def test_the_budget_itself_is_unchanged(self):
        """Two calls per filename is a cost decision, not the bug found here."""
        ledger = (ROOT / "scripts" / "image-scout-attempts.py").read_text(
            encoding="utf-8"
        )
        self.assertIn("MAX_ATTEMPTS = 2", ledger)
        self.assertIn("There is never a third call", flat(GENERATION))

    def test_the_builder_splits_image_missing_by_who_can_fix_it(self):
        text = flat(WORKSHEET_BUILDER)
        self.assertIn("whether that filename already has a terminal picture receipt", text)
        self.assertIn("the picture route is a dead end", text)
        self.assertIn("the worksheet-designer re-authors that one reference", text)

    def test_every_focused_repair_role_carries_the_one_exception(self):
        for path in (WORKSHEET_REPAIR, SLIDE_REPAIR, WALL_REPAIR):
            with self.subTest(agent=path.name):
                text = flat(path)
                self.assertIn("terminally unavailable", text)
                self.assertIn("will never exist", text)
                # The exception must close behind itself, or it becomes a
                # general licence to swap any awkward picture.
                self.assertIn("Any other picture stays exactly as it is", text)

    def test_the_worksheet_exception_still_protects_the_learning(self):
        text = flat(WORKSHEET_REPAIR)
        self.assertIn("Keep the learning that reference was serving", text)
        self.assertIn("change nothing else", text)
        # And the original prohibition must still stand for every other case.
        self.assertIn(
            "Do not change a required representation or photograph into a "
            "different access route",
            text,
        )


if __name__ == "__main__":
    unittest.main()
