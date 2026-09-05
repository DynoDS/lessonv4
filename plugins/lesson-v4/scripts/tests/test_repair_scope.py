"""A repair changes how the work is shown, never what the work is.

The observed failure: a slide titled "Compare the objects" went into a visual
repair carrying a three-column, two-row recording table - one row per object -
and came out carrying a single column of boxes. Two things to compare, one place
to write. Every deterministic check passed, because everything left on the slide
fitted beautifully, and the comparison the slide existed for had gone.

The repairing roles are already told they do not own pedagogy. Nothing checked
it, so the rule only held while the repairer agreed with it. This does the
checking: the specification that arrived and the specification that left are
compared, and a content object that vanished is a fault.
"""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-repair-scope.py"

REPAIRERS = [
    ("slide-designer-focused-repair.md", "lesson.json"),
    ("worksheet-designer-focused-repair.md", "worksheet.json"),
    ("working-wall-designer-focused-repair.md", "working-wall.json"),
    ("stick-in-sheets-designer-focused-repair.md", "stick-in-sheets.json"),
]


def compare_slide(body: dict) -> dict:
    return {"template": "body-full", "title": "Compare the objects", "body": body}


# The slide as the repairer received it: a prompt, the two named objects, and a
# table with a row for each of them.
BEFORE = {
    "slides": [
        compare_slide(
            {
                "type": "stack",
                "items": [
                    {"type": "text", "text": "Both fans move air. Which is electrical?"},
                    {"type": "chip-bank", "chips": ["Desk fan", "Hand fan"]},
                    {
                        "type": "table",
                        "headers": ["Object name", "Power source", "Electricity's job"],
                        "rows": [["", "", ""], ["", "", ""]],
                    },
                ],
            }
        )
    ]
}


class RepairScopeCase(unittest.TestCase):
    def run_check(self, before: dict, after: dict) -> subprocess.CompletedProcess:
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            before_path = root / "before.json"
            after_path = root / "after.json"
            before_path.write_text(json.dumps(before), encoding="utf-8")
            after_path.write_text(json.dumps(after), encoding="utf-8")
            return subprocess.run(
                [
                    sys.executable, "-S", str(SCRIPT),
                    "--before", str(before_path),
                    "--after", str(after_path),
                ],
                capture_output=True,
                text=True,
            )


class ContentThatVanishedTests(RepairScopeCase):
    def test_a_recording_table_that_became_boxes_is_caught(self):
        after = {
            "slides": [
                compare_slide(
                    {
                        "type": "stack",
                        "items": [
                            {"type": "text", "text": "Both fans move air. Which is electrical?"},
                            {"type": "chip-bank", "chips": ["Desk fan", "Hand fan"]},
                            {"type": "text", "text": "Object name"},
                            {"type": "answer-box"},
                            {"type": "text", "text": "Power source"},
                            {"type": "answer-box"},
                        ],
                    }
                )
            ]
        }
        result = self.run_check(BEFORE, after)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("REPAIR_SCOPE_FAILED", result.stdout)
        self.assertIn("table: 1 before the repair, 0 after", result.stdout)
        # The message has to say where an honest task change belongs, or the
        # repairer's only visible option is to put the fault back untouched.
        self.assertIn("lesson designer", result.stdout)

    def test_splitting_the_slide_in_two_is_a_repair_not_a_loss(self):
        """The discrimination case, and the repair the engine now steers toward.

        Splitting a crowded beat across consecutive slides is the structural fix
        for a composition fault. It moves every content object and loses none, so
        this must never stand in its way.
        """
        after = {
            "slides": [
                compare_slide(
                    {
                        "type": "stack",
                        "items": [
                            {"type": "text", "text": "Both fans move air. Which is electrical?"},
                            {"type": "chip-bank", "chips": ["Desk fan", "Hand fan"]},
                        ],
                    }
                ),
                compare_slide(
                    {
                        "type": "table",
                        "headers": ["Object name", "Power source", "Electricity's job"],
                        "rows": [["", "", ""], ["", "", ""]],
                    }
                ),
            ]
        }
        result = self.run_check(BEFORE, after)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("REPAIR_SCOPE_OK", result.stdout)

    def test_changing_the_template_around_the_content_is_allowed(self):
        after = json.loads(json.dumps(BEFORE))
        after["slides"][0]["template"] = "split-h-60-40"
        result = self.run_check(BEFORE, after)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_adding_content_is_allowed(self):
        after = json.loads(json.dumps(BEFORE))
        after["slides"][0]["body"]["items"].append({"type": "text", "text": "Now explain."})
        result = self.run_check(BEFORE, after)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


class DecorationMayGoTests(RepairScopeCase):
    """Reclaiming space from decoration is exactly what a repair is for."""

    def test_an_optional_drawing_may_be_dropped(self):
        before = json.loads(json.dumps(BEFORE))
        before["slides"][0]["body"]["items"].append(
            {"type": "image", "kind": "educational-svg", "concept": "desk fan"}
        )
        result = self.run_check(before, BEFORE)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_whole_decorations_block_may_be_dropped(self):
        before = json.loads(json.dumps(BEFORE))
        before["slides"][0]["decorations"] = [
            {"type": "image", "kind": "emoji", "emoji": "💡"}
        ]
        result = self.run_check(before, BEFORE)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_required_photograph_may_not_be_dropped(self):
        """A picture children work from is not decoration, whatever it costs."""
        before = json.loads(json.dumps(BEFORE))
        before["slides"][0]["body"]["items"].append(
            {"type": "image", "imagePath": "unsplash/desk-fan.jpg", "essential": True}
        )
        result = self.run_check(before, BEFORE)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("image: 1 before the repair, 0 after", result.stdout)


class EveryRepairerRunsItTests(unittest.TestCase):
    def test_all_four_owners_snapshot_and_check(self):
        for name, spec in REPAIRERS:
            with self.subTest(role=name):
                text = (ROOT / "agents" / name).read_text(encoding="utf-8")
                self.assertIn("check-repair-scope.py", text)
                self.assertIn("REPAIR_SCOPE_OK", text)
                # The check needs the specification as it arrived, and the role
                # edits in place, so the snapshot has to be its first act.
                self.assertIn(f"{spec}.before-repair", text)

    def test_the_orchestrator_expects_the_marker_back(self):
        playbook = (
            ROOT / "skills" / "make-lesson" / "playbook-lite.md"
        ).read_text(encoding="utf-8")
        self.assertIn("Repair scope: REPAIR_SCOPE_OK", playbook)


if __name__ == "__main__":
    unittest.main()


class EveryEngineIsActuallyReadTests(RepairScopeCase):
    """The check guards four artefacts and used to read only one of them.

    It counted objects by a ``type`` field on the stated grounds that ``type``
    is what every engine uses. It is not: a worksheet names its content with
    ``helper`` and a stick-in piece with ``visual``. So on those two the check
    counted nothing, found nothing missing, and printed OK - including for a
    worksheet with two of its three sheets deleted. Every focused worksheet
    repair in the 5 September pass returned that marker, and it meant nothing.
    """

    def test_a_worksheet_losing_two_of_three_sheets_is_caught(self):
        before = {
            "sheets": {
                "below": {"zones": [{"stack": [{"helper": "written-answers"}]}]},
                "expected": {"zones": [{"stack": [{"helper": "speech-scene"}]}]},
                "greaterDepth": {"zones": [{"stack": [{"helper": "chip-bank"}]}]},
            }
        }
        after = {"sheets": {"below": before["sheets"]["below"]}}
        result = self.run_check(before, after)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("REPAIR_SCOPE_FAILED", result.stdout)
        self.assertIn("helper:speech-scene", result.stdout)

    def test_a_stick_in_losing_a_piece_is_caught(self):
        before = {"items": [{"visual": "source-copy"}, {"visual": "geoboard-row"}]}
        after = {"items": [{"visual": "source-copy"}]}
        result = self.run_check(before, after)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("visual:geoboard-row", result.stdout)

    def test_an_unchanged_specification_of_each_kind_still_passes(self):
        for spec in (
            {"sheets": {"a": {"zones": [{"stack": [{"helper": "questions"}]}]}}},
            {"items": [{"visual": "venn"}]},
            {"slides": [{"template": "body-full", "body": {"type": "text"}}]},
        ):
            result = self.run_check(spec, spec)
            self.assertEqual(result.returncode, 0, result.stdout)
            self.assertIn("REPAIR_SCOPE_OK", result.stdout)

    def test_an_artefact_the_walker_cannot_read_is_a_failure_not_an_ok(self):
        # The trap that let this sleep: nothing recognised means nothing lost.
        # A real specification always holds content, so zero means the walker
        # did not understand the file, and the marker must not claim otherwise.
        unreadable = {"sheets": {"below": {"zones": [{"widget": "mystery"}]}}}
        result = self.run_check(unreadable, unreadable)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn("no content object was recognised", result.stdout)
