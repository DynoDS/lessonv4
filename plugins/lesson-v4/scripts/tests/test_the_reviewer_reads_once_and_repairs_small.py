"""The design reviewer reads each thing once and a small repair stays small.

4.2.181, from an outside audit of the reviewer checked against the code:

- the review view printed every script, answer, prompt and worksheet string
  twice, once in `As the class meets it` and again in the structured sections;
- the packet held a review after the Phase 2 freeze to the initial picture
  budget of 16 while its validator already allowed the run's later pictures;
- the reviewer was sent to the whole maths subject file, including the
  Greater Depth section written for the Adaptation Designer, and to the whole
  Worksheets section, including page layout it is told not to decide;
- a validator failure in the review's own wording relaunched the full
  58 KB reviewer to shorten one sentence.

Each test pins the property, not the wording that delivers it.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TESTS = Path(__file__).resolve().parent


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


packet = load("reviewer_reads_once_packet", ROOT / "scripts" / "design-review-packet.py")
fixtures = load("reviewer_reads_once_fixtures", TESTS / "test_lesson_design_contract.py")
packet_tests = load("reviewer_reads_once_packet_tests", TESTS / "test_design_review_packet.py")


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


# Validator-owned bookkeeping the view has never printed (it was absent before
# 4.2.181 too); everything else in a unit, the worksheet, the vocabulary and
# the representations must still reach the reviewer.
NEVER_PRINTED = {"fitPriority", "answerKeyMode", "sourceUnitId"}


def string_leaves(value, out: list[str]) -> None:
    if isinstance(value, str):
        out.extend(line.strip() for line in value.split("\n") if line.strip())
    elif isinstance(value, dict):
        for key, item in value.items():
            if key not in NEVER_PRINTED:
                string_leaves(item, out)
    elif isinstance(value, list):
        for item in value:
            string_leaves(item, out)


def unquoted(view: str) -> str:
    return "\n".join(line[2:] if line.startswith("> ") else line for line in view.splitlines())


class TheViewPrintsEachStringOnceAndLosesNothing(unittest.TestCase):
    def setUp(self) -> None:
        self.design, self.photos = fixtures.valid_contract()
        self.view = packet.build_review_view(self.design, self.photos)
        self.body = unquoted(self.view)

    def units(self):
        yield self.design["starter"]
        yield from self.design["teachingSequence"]
        beat = self.design["ending"].get("beat")
        if beat:
            yield beat

    def test_every_script_is_printed_once(self) -> None:
        scripts = [
            re.sub(r"^\s*Say to children:\s*", "", unit["speakerNotes"]["script"])
            for unit in self.units()
            if unit["speakerNotes"].get("script")
        ]
        self.assertTrue(scripts)
        for script in scripts:
            with self.subTest(script=script[:40]):
                self.assertEqual(self.body.count(script), 1)
        self.assertIn("- Speaker script: (in the class view)", self.view)

    def test_every_string_in_the_design_still_reaches_the_view(self) -> None:
        leaves: list[str] = []
        for unit in self.units():
            string_leaves(unit, leaves)
        string_leaves(self.design["worksheet"], leaves)
        string_leaves(self.design["vocabulary"], leaves)
        string_leaves(self.design["representations"], leaves)
        for leaf in leaves:
            probe = re.sub(r"^Say to children:\s*", "", leaf)
            with self.subTest(leaf=leaf[:50]):
                self.assertIn(probe, self.body)

    def test_the_class_view_itself_is_untouched(self) -> None:
        lines, count = packet.build_class_view(self.design)
        self.assertIn("\n".join(lines), self.view)
        self.assertGreater(count, 0)

    def test_a_model_the_class_never_sees_is_still_printed(self) -> None:
        design = json.loads(json.dumps(self.design))
        unit = next(
            u
            for u in design["teachingSequence"]
            if u["answer"]["kind"] != "none" and u["answer"]["content"]
        )
        unit["answer"]["delivery"] = "teacher-only"
        view = packet.build_review_view(design, self.photos)
        self.assertIn(f"- Answer/model: {unit['answer']['content']}", view)

    def test_shared_representation_features_print_once(self) -> None:
        design = json.loads(json.dumps(self.design))
        rep = design["representations"][0]
        shared = "Same anatomy and orientation in every configuration."
        base = rep["configurations"][0]
        rep["configurations"] = [
            dict(base, id=f"{base['id']}-{n}", requiredFeatures=[shared, f"own feature {n}"])
            for n in (1, 2, 3)
        ]
        view = packet.build_review_view(design, self.photos)
        self.assertEqual(view.count(shared), 1)
        for n in (1, 2, 3):
            self.assertIn(f"own feature {n}", view)


def prepare(working_dir: Path):
    return packet_tests.prepare(working_dir)


def freeze(working_dir: Path) -> None:
    canonical = working_dir / "photo-requirements.json"
    snapshot = working_dir / "phase2-initial-photo-requirements.json"
    snapshot.write_bytes(canonical.read_bytes())
    (working_dir / "phase2-initial-photo-requirements.receipt.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "canonicalPath": str(canonical),
                "snapshotPath": str(snapshot),
                "sha256": hashlib.sha256(snapshot.read_bytes()).hexdigest(),
            }
        ),
        encoding="utf-8",
    )


class ALaterReviewUsesTheRunPictureCeiling(unittest.TestCase):
    def test_seventeen_pictures_fail_a_first_review_and_pass_a_later_one(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            working_dir = Path(tmp)
            packet_tests.write_science_contract(working_dir, photo_count=17)

            first, _, _ = prepare(working_dir)
            self.assertNotEqual(first.returncode, 0)
            self.assertIn("PHOTO_CAP_EXCEEDED", first.stderr)

            freeze(working_dir)
            later, preflight, _ = prepare(working_dir)
            self.assertEqual(later.returncode, 0, later.stderr)
            row = json.loads(preflight.read_text(encoding="utf-8"))["photoCap"]
            self.assertEqual(row["maximum"], 24)
            self.assertEqual(row["command"][-3:-1], ["--stage", "run"])

            review = packet_tests.write_review(working_dir, "APPROVED")
            verified, _ = packet_tests.verify(
                working_dir, preflight, working_dir / "design-review-reference.md", review
            )
            self.assertEqual(verified.returncode, 0, verified.stderr)

    def test_the_launch_prompt_takes_the_prepared_command(self) -> None:
        playbook = flat(ROOT / "skills" / "make-lesson" / "playbook-lite.md")
        start = playbook.index("## Phase 1.25")
        launch = playbook[start : playbook.index("ORCHESTRATOR_CHECK_AFTER_RETURN", start)]
        self.assertIn("the exact `validator.command` in [WORKING_DIR]/design-review-preflight.json", launch)
        self.assertNotIn("--initial-photo-namespace", launch)


class TheCardSendsTheReviewerOnlyToItsOwnReading(unittest.TestCase):
    def run_card_command(self, reference: str, heading: str) -> str:
        section = reference[reference.index(heading):]
        command = re.search(r"```bash\n(.+?)\n```", section, re.S).group(1)
        result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout

    def maths_card(self, tmp: str) -> str:
        working_dir = Path(tmp)
        design, _ = packet_tests.write_science_contract(working_dir)
        design["lesson"]["subject"] = "Maths"
        (working_dir / "lesson-design.json").write_text(json.dumps(design), encoding="utf-8")
        result, _, reference = prepare(working_dir)
        self.assertEqual(result.returncode, 0, result.stderr)
        return reference.read_text(encoding="utf-8")

    def test_maths_reads_the_class_lesson_sections_and_skips_greater_depth(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            card = self.maths_card(tmp)
            text = self.run_card_command(card, "- Subject reference:")
            self.assertIn("## The shape of a maths lesson", text)
            self.assertIn("## Vocabulary in maths", text)
            self.assertIn("A maths sheet is the lesson continued", text)
            self.assertNotIn("## Greater Depth in maths", text)

    def test_always_read_sections_arrive_whatever_the_lesson(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            card = self.maths_card(tmp)
            text = self.run_card_command(card, "## Always read")
            self.assertIn("## Pride Lessons (Quality Anchor)", text)
            self.assertIn("## What a Lesson Is For", text)
            self.assertIn("Final pre-flight check", text)
            routes = card[card.index("## Conditional teacher-preference routing"):]
            self.assertNotIn("`Pride Lessons (Quality Anchor)`", routes)
            self.assertNotIn("`What a Lesson Is For`", routes)

    def test_route_checks_are_the_lessons_own_route_only(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            card = self.maths_card(tmp)
            text = self.run_card_command(card, "## Route checks")
            self.assertIn("For Skill-based lessons", text)
            self.assertNotIn("For Dialogic lessons", text)
        reviewer = flat(ROOT / "agents" / "design-reviewer.md")
        self.assertNotIn("For Dialogic lessons, check", reviewer)

    def test_the_worksheet_route_opens_the_teaching_half_only(self) -> None:
        reader = packet._load_reference_reader()
        text = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        start, end = reader.interval(text, "Worksheets > What the sheet is for")
        teaching = text[start:end]
        self.assertIn("Protect the learning before seeking fresh work", teaching)
        self.assertIn("A worksheet is one of two kinds", teaching)
        self.assertNotIn("The typeface is not yours to change", teaching)
        self.assertNotIn("A stimulus and the questions that read it share a column", teaching)
        # Every other reader still gets the whole section under its old name.
        start, end = reader.interval(text, "Worksheets")
        self.assertIn("The typeface is not yours to change", text[start:end])


class TheReviewerRepairsAfterItJudges(unittest.TestCase):
    def test_voice_misses_are_heard_first_and_repaired_after_the_checks(self) -> None:
        reviewer = flat(ROOT / "agents" / "design-reviewer.md")
        self.assertIn("Hear every string in this pass, before the learning-contract checks below", reviewer)
        self.assertIn("a string in a beat you return for redesign is about to be replaced", reviewer)
        self.assertIn("Name its miss inside that redesign item instead", reviewer)
        self.assertNotIn("Complete this pass before the learning-contract checks below", reviewer)

    def test_a_validator_hand_back_goes_to_the_compact_repair_role(self) -> None:
        playbook = flat(ROOT / "skills" / "make-lesson" / "playbook-lite.md")
        self.assertIn("agents/design-reviewer-focused-repair.md", playbook)
        role = flat(ROOT / "agents" / "design-reviewer-focused-repair.md")
        self.assertIn("name: design-reviewer-focused-repair", role)
        self.assertIn("Change only the fields the validator names", role)
        self.assertIn("Do not change `## Result` or `## Judgements`", role)
        self.assertIn("put the `Before` wording back exactly", role)
        full = (ROOT / "agents" / "design-reviewer.md").stat().st_size
        self.assertLess((ROOT / "agents" / "design-reviewer-focused-repair.md").stat().st_size, full / 5)


if __name__ == "__main__":
    unittest.main()
