from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "design-revision-catch-up.py"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
RUNTIME = ROOT / "scripts" / "make-lesson-runtime.py"
RECORDS = ROOT / "references" / "records-after-a-revision.md"
CATCH_UP = ROOT / "references" / "catching-up-after-a-revision.md"

UNIT_5 = "lesson-section/teaching-sequence/unit-005"
UNIT_6 = "lesson-section/teaching-sequence/unit-006"

OLD_LINE = "Look at the firefighter spraying water from the long hose."
NEW_LINE = "Today, firefighters come in a fire engine like this one."
OLD_PHOTO = ("photo-009", "unsplash/fire-engine-firefighter-hose.jpg")
NEW_PHOTO = ("photo-010", "wikimedia/modern-fire-engine.jpg")


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


def design(engine_line: str, engine_photo: str) -> dict:
    return {
        "teachingSequence": [
            {
                "sourceUnitId": UNIT_5,
                "kind": "teach",
                "content": {"lines": [engine_line]},
                "photoRefs": [engine_photo],
            },
            {
                "sourceUnitId": UNIT_6,
                "kind": "do",
                "content": {"task": "Did the gap in the houses stop the fire?"},
            },
        ]
    }


def contract(*photos: tuple[str, str]) -> dict:
    return {"photos": [{"id": pid, "filename": name} for pid, name in photos]}


def deck(line: str, picture: str) -> dict:
    return {
        "lessonName": "The Great Fire of London",
        "slides": [
            {"title": "How did people try to stop the fire?", "designUnitId": UNIT_5,
             "lines": [line], "pictures": [{"imagePath": picture}]},
            {"title": "Did the gap stop the fire?", "designUnitId": UNIT_6,
             "lines": ["Did the gap in the houses stop the fire?"]},
        ],
    }


class CatchUpFixture(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.dir = Path(self._tmp.name)
        self.write("lesson-design.json", design(OLD_LINE, OLD_PHOTO[0]))
        self.write("photo-requirements.json", contract(OLD_PHOTO))

    def write(self, name: str, data: object) -> Path:
        path = self.dir / name
        path.write_text(json.dumps(data), encoding="utf-8")
        return path

    def run_tool(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args, "--working-dir", str(self.dir)],
            capture_output=True, text=True, encoding="utf-8",
        )

    def revise(self) -> None:
        self.assertIn("REVISION_BASELINE_OK", self.run_tool("mark").stdout)
        self.write("lesson-design.json", design(NEW_LINE, NEW_PHOTO[0]))
        self.write("photo-requirements.json", contract(NEW_PHOTO))


class TheRevisionIsListedTests(CatchUpFixture):
    """On 7 October 2026 a lost picture stopped every designer of a 26-slide
    deck, because nothing could say which slides the rework reached."""

    def test_only_the_pages_the_revision_reaches_are_named(self) -> None:
        self.revise()
        spec = self.write("lesson.json", deck(OLD_LINE, OLD_PHOTO[1]))
        out = self.run_tool("changes", "--spec", str(spec)).stdout
        self.assertIn(f"{UNIT_5}: content, photoRefs", out)
        self.assertIn("REVISION_RETIRED_PICTURES: " + OLD_PHOTO[1], out)
        self.assertIn("REVISION_TOUCHES lesson.json: 1 ", out)
        self.assertIn("slide 1", out)
        self.assertNotIn("slide 2", out)

    def test_a_resource_the_revision_never_reached_goes_on_as_it_stands(self) -> None:
        self.revise()
        wall = self.write("working-wall.json", {"cards": [{"title": "The gap", "steps": [
            "Did the gap in the houses stop the fire?"]}]})
        out = self.run_tool("changes", "--spec", str(wall)).stdout
        self.assertIn("REVISION_TOUCHES_NOTHING working-wall.json", out)

    def test_a_specification_not_yet_written_is_named_not_failed(self) -> None:
        self.revise()
        result = self.run_tool("changes", "--spec", str(self.dir / "worksheet.json"))
        self.assertEqual(result.returncode, 0)
        self.assertIn("REVISION_SPEC_NOT_WRITTEN worksheet.json", result.stdout)

    def test_the_first_baseline_stands_through_a_second_revision(self) -> None:
        self.revise()
        self.assertIn("already kept", self.run_tool("mark").stdout)
        kept = json.loads(
            (self.dir / "revision-baseline" / "lesson-design.json").read_text("utf-8")
        )
        self.assertEqual(kept, design(OLD_LINE, OLD_PHOTO[0]))

    def test_no_baseline_says_what_to_do_instead(self) -> None:
        spec = self.write("lesson.json", deck(OLD_LINE, OLD_PHOTO[1]))
        result = self.run_tool("check", "--spec", str(spec))
        self.assertEqual(result.returncode, 2)
        self.assertIn("REVISION_BASELINE_MISSING", result.stdout)
        self.assertIn("Relaunch each affected designer", result.stdout)


class NothingOldSlipsThroughTests(CatchUpFixture):
    """A designer that carried on wrote from the lesson as it was. Every other
    check passes such a page: it fits, and its picture reference is repaired
    by the reconcile. Only this one knows the lesson moved."""

    def test_a_page_still_showing_the_old_lesson_is_refused(self) -> None:
        self.revise()
        spec = self.write("lesson.json", deck(OLD_LINE, OLD_PHOTO[1]))
        result = self.run_tool("check", "--spec", str(spec))
        self.assertEqual(result.returncode, 1)
        self.assertIn("names the retired picture " + OLD_PHOTO[1], result.stdout)
        self.assertIn("still says", result.stdout)
        self.assertNotIn("slide 2", result.stdout)

    def test_a_line_break_does_not_hide_an_old_sentence(self) -> None:
        self.revise()
        broken = "Look at the firefighter\nspraying water from the long hose."
        spec = self.write("lesson.json", deck(broken, NEW_PHOTO[1]))
        self.assertEqual(self.run_tool("check", "--spec", str(spec)).returncode, 1)

    def test_a_page_brought_up_to_the_revised_lesson_passes(self) -> None:
        self.revise()
        spec = self.write("lesson.json", deck(NEW_LINE, NEW_PHOTO[1]))
        result = self.run_tool("check", "--spec", str(spec))
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("REVISION_CARRIED_OK", result.stdout)

    def test_words_that_moved_to_another_unit_are_not_a_fault(self) -> None:
        """The discrimination case: a sentence is old only when the revised
        lesson says it nowhere."""
        self.assertIn("REVISION_BASELINE_OK", self.run_tool("mark").stdout)
        moved = design(NEW_LINE, OLD_PHOTO[0])
        moved["teachingSequence"][1]["content"]["established"] = OLD_LINE
        self.write("lesson-design.json", moved)
        spec = self.write("lesson.json", deck(OLD_LINE, OLD_PHOTO[1]))
        self.assertEqual(self.run_tool("check", "--spec", str(spec)).returncode, 0)

    def test_a_short_phrase_any_page_may_carry_is_not_held(self) -> None:
        self.write("lesson-design.json", design("Tell your partner.", OLD_PHOTO[0]))
        self.revise()
        spec = self.write("lesson.json", deck("Tell your partner.", NEW_PHOTO[1]))
        self.assertEqual(self.run_tool("check", "--spec", str(spec)).returncode, 0)


class TheRunCarriesOnTests(unittest.TestCase):
    """The teacher's ruling of 12 October 2026: carry on with what can be done.
    It keeps his ruling of 3 October that no designer is held for a picture.

    The run's own instructions are at their agreed size, so the rule is said
    by the step that announces the loss and the copy is kept by that step."""

    def test_the_picture_step_says_nobody_is_stopped_and_keeps_the_lesson(self) -> None:
        source = (ROOT / "scripts" / "finalize-picture-assignment.py").read_text("utf-8")
        announced = source[source.index("if lost_essential:"):source.index("if lost_to_allowance:")]
        self.assertIn("Designers already working carry on", announced)
        self.assertIn("stop none of them", announced)
        self.assertIn('"design-revision-catch-up.py"', announced)
        self.assertIn('"mark"', announced)

    def test_the_rule_gives_the_run_both_commands_and_the_delivered_end(self) -> None:
        rule = flat(RECORDS)
        for needed in (
            'design-revision-catch-up.py" changes',
            'design-revision-catch-up.py" check',
            "REVISION_TOUCHES_NOTHING",
            "REVISION_BASELINE_MISSING",
            "[PLUGIN_ROOT]/references/catching-up-after-a-revision.md",
            "build and deliver the resource",
        ):
            self.assertIn(needed, rule)

    def test_the_catch_up_block_carries_what_the_repair_roles_forbid(self) -> None:
        """The compact repair roles bar a change of wording and sit at their
        agreed size, so the block the run sends is where the job is licensed."""
        self.assertTrue(CATCH_UP.exists())
        rule = flat(RECORDS)
        block = rule[rule.index("FOCUSED REPAIR"):rule.index("Its success check")]
        for needed in (
            "Finding: The lesson was revised after this was written.",
            "words, pictures and tasks included",
            "return no `Repair scope:` line",
            "Already passed - leave unchanged: every page not listed above.",
        ):
            self.assertIn(needed, block)
        self.assertIn("`The lesson was revised after this was written`", flat(CATCH_UP))


if __name__ == "__main__":
    unittest.main()
