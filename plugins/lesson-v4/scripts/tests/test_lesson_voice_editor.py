"""The lesson voice editor changes how the lesson is said, never what it decided.

These tests pin the lane check (`check-voice-edit.py`) on the package's own
sample lesson. They do not grade wording; they prove that a rewording passes
and that each kind of decision a voice pass could quietly change is refused.
On 27 September 2026 three real voice passes over one reviewed lesson reworded
the teacher-only answer key and a design note meant for the slide designer;
both are outside the editor's job and both are refused here.
"""
from __future__ import annotations

import copy
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-voice-edit.py"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


checker = load("check_voice_edit_under_test", SCRIPT)
fixtures = load("voice_editor_contract_fixtures", ROOT / "scripts" / "tests" / "test_lesson_design_contract.py")


class TheLaneCheck(unittest.TestCase):
    def setUp(self) -> None:
        self.before, self.photos = fixtures.valid_content_contract()
        self.after = copy.deepcopy(self.before)
        self.teach = self.after["teachingSequence"][1]

    def faults(self) -> list[str]:
        return checker.check(self.before, self.after)

    def test_rewording_what_the_class_sees_and_hears_passes(self) -> None:
        self.teach["content"]["headline"] = "A road lets people into the forest"
        self.teach["speakerNotes"]["script"] = "Say to children: Look at this road. Who can get in now?"
        self.after["vocabulary"][0]["definition"] = "A road is a wide path for people, cars and lorries."
        self.assertEqual(self.faults(), [])

    def test_a_piece_added_or_removed_is_refused(self) -> None:
        self.teach["content"]["keyQuestions"].append("A brand new question?")
        self.assertTrue(any("was added" in f for f in self.faults()))
        self.after = copy.deepcopy(self.before)
        del self.after["teachingSequence"][1]["content"]["headline"]
        self.assertTrue(any("was removed" in f for f in self.faults()))

    def test_a_setting_is_refused(self) -> None:
        self.teach["minutes"] = (self.teach.get("minutes") or 0) + 5
        self.assertTrue(any("not wording" in f for f in self.faults()))

    def test_planning_notes_are_outside_the_lane(self) -> None:
        self.after["teachingSequence"][0]["content"]["focus"] = "What is different now?"
        self.after["slideDesignNotes"] = list(self.after.get("slideDesignNotes") or []) or ["note"]
        self.before["slideDesignNotes"] = copy.deepcopy(self.after["slideDesignNotes"])
        self.after["slideDesignNotes"][0] = self.after["slideDesignNotes"][0] + " Reworded."
        found = self.faults()
        self.assertTrue(any("teachingSequence[0].content.focus" in f and "outside the editor's lane" in f for f in found))
        self.assertTrue(any("slideDesignNotes[0]" in f for f in found))

    def test_the_taught_word_and_the_lesson_record_never_change(self) -> None:
        self.after["vocabulary"][0]["term"] = "highway"
        self.after["lesson"]["displayedLo"] = "To add numbers"
        found = self.faults()
        self.assertTrue(any("vocabulary[0].term" in f for f in found))
        self.assertTrue(any("lesson.displayedLo" in f for f in found))

    def test_an_invented_number_is_refused(self) -> None:
        self.teach["content"]["headline"] = "Roads open up 45 kilometres of forest"
        self.assertTrue(any("brings in ['45']" in f for f in self.faults()))

    def test_a_number_may_leave_the_script_while_the_slide_keeps_it(self) -> None:
        self.before["teachingSequence"][1]["content"]["headline"] = "The road opened in 1975"
        self.before["teachingSequence"][1]["speakerNotes"]["script"] = "Say to children: This road opened in 1975."
        self.after = copy.deepcopy(self.before)
        self.after["teachingSequence"][1]["speakerNotes"]["script"] = "Say to children: Look how new this road is."
        self.assertEqual(self.faults(), [])
        self.after["teachingSequence"][1]["content"]["headline"] = "The road is new"
        self.assertTrue(any("drops ['1975']" in f for f in self.faults()))


class WhatTheIndependentCheckFound(unittest.TestCase):
    """27 September 2026: an independent reader of the release reproduced a lane
    check that refused every multi-line board string (284 across 85 saved
    designs), let a short teacher-only answer through because its words sat
    inside a longer class string, missed spelled-out numbers and a taught word
    replaced on the boards, and threw away the whole edit when anything failed.
    Real voice passes over the leisure lesson also invented a person and
    dropped the taught word from the boards."""

    def setUp(self) -> None:
        self.before, _photos = fixtures.valid_content_contract()
        self.teach = self.before["teachingSequence"][1]
        self.teach["content"]["explanation"] = (
            "A road runs through the forest now.\nIt took two hours to walk in before. About 1500 trees stood here."
        )
        self.teach["label"] = "The road arrives"
        self.teach["speakerNotes"]["script"] = "Say to children: Sort the three cards. The road is new."
        self.after = copy.deepcopy(self.before)
        self.words = self.after["teachingSequence"][1]

    def faults(self) -> list[str]:
        return checker.check(self.before, self.after)

    def test_a_board_string_over_several_lines_can_be_reworded(self) -> None:
        self.words["content"]["explanation"] = self.words["content"]["explanation"].replace(
            "It took two hours to walk in before.", "Before, walking in took two hours."
        )
        self.assertEqual(self.faults(), [])

    def test_the_label_is_the_slide_title_and_can_be_reworded(self) -> None:
        self.words["label"] = "Here comes the road"
        self.assertEqual(self.faults(), [])

    def test_a_spelled_out_number_is_a_number(self) -> None:
        text = self.words["content"]["explanation"]
        self.words["content"]["explanation"] = text.replace("two hours", "2 hours").replace("1500", "1,500")
        self.assertEqual(self.faults(), [])
        self.words["content"]["explanation"] = text.replace("two hours", "three hours")
        self.assertTrue(any("swaps ['2'] for ['3']" in f for f in self.faults()))

    def test_a_count_word_may_go_as_a_plain_count(self) -> None:
        self.words["speakerNotes"]["script"] = "Say to children: Sort the cards. The road is new."
        self.assertEqual(self.faults(), [])

    def test_the_taught_word_stays_on_the_board_even_while_the_script_says_it(self) -> None:
        self.words["content"]["headline"] = "Tracks open up the forest"
        self.words["content"]["explanation"] = self.words["content"]["explanation"].replace("A road", "A track")
        self.words["content"]["takeaway"]["text"] = "A track can let more people reach the forest."
        self.words["content"]["keyQuestions"][0] = "What might happen once a track is there?"
        self.words["label"] = "The track arrives"
        found = self.faults()
        self.assertTrue(any("no longer says 'road'" in f and "on the board" in f for f in found), found)

    def test_a_person_the_lesson_never_named_is_refused(self) -> None:
        # A real person brought into a script (a trial pass added `Sarah Gooder` to a starter the
        # reviewer had corrected), or one name put where another stood.
        self.words["speakerNotes"]["script"] = "Say to children: Sort the three cards. Think of Sarah Gooder in the mine."
        self.assertTrue(any("names ['Sarah Gooder']" in f for f in self.faults()))
        self.before["teachingSequence"][1]["speakerNotes"]["script"] = "Say to children: Sort the three cards, like Oliver did."
        self.after = copy.deepcopy(self.before)
        self.after["teachingSequence"][1]["speakerNotes"]["script"] = "Say to children: Sort the three cards, like Oscar did."
        self.assertTrue(any("names ['Oscar']" in f for f in self.faults()))

    def test_everyday_words_and_openings_are_not_names(self) -> None:
        # The everyday example the editor is asked for (`help Mum`, `watch TV`) and a line opened
        # by a capital are not people the lesson failed to name.
        self.words["speakerNotes"]["script"] = (
            "Say to children: Sort the three cards. The road is new. After school you might help Mum or watch TV. "
            "'Great, a new road!'"
        )
        self.assertEqual(self.faults(), [])

    def test_numbers_said_in_words_are_the_same_numbers(self) -> None:
        text = self.words["content"]["explanation"]
        self.words["content"]["explanation"] = text.replace("About 1500 trees", "About five hundred trees")
        self.assertTrue(any("swaps ['1500'] for ['500']" in f for f in self.faults()))
        for said in ("About fifteen hundred trees", "About one thousand five hundred trees"):
            self.words["content"]["explanation"] = text.replace("About 1500 trees", said)
            self.assertEqual(self.faults(), [], said)

    def test_a_number_swapped_while_another_copy_stays_is_still_a_swap(self) -> None:
        self.teach["content"]["explanation"] = "It took two hours to walk in, and two hours to walk out."
        self.after = copy.deepcopy(self.before)
        self.after["teachingSequence"][1]["content"]["explanation"] = "It took three hours to walk in, and two hours to walk out."
        self.assertTrue(any("swaps ['2'] for ['3']" in f for f in self.faults()))

    def test_one_may_stand_for_one(self) -> None:
        self.teach["content"]["explanation"] = "It took 1 hour to walk in."
        self.after = copy.deepcopy(self.before)
        self.after["teachingSequence"][1]["content"]["explanation"] = "It took one hour to walk in."
        self.assertEqual(self.faults(), [])

    def test_a_definition_holding_a_semicolon_can_be_reworded(self) -> None:
        # The Codex acceptance run (lesson 6) had `Bacteria are tiny living things; some can
        # cause disease.`, which the card prints after its term and a split on `; ` hid.
        self.before["vocabulary"][0]["definition"] = "A road is a wide path; people and vehicles use it."
        self.after = copy.deepcopy(self.before)
        self.after["vocabulary"][0]["definition"] = "A road is a wide path that people and cars use."
        self.assertEqual(self.faults(), [])

    def test_a_setting_that_reads_like_a_word_is_still_a_setting(self) -> None:
        self.before["teachingSequence"][1]["kind"] = "The road arrives"
        self.after = copy.deepcopy(self.before)
        self.after["teachingSequence"][1]["kind"] = "Here comes the road"
        self.assertTrue(any("is a setting or an id" in f for f in self.faults()))

    def test_a_teacher_only_answer_is_matched_whole_not_as_a_fragment(self) -> None:
        self.before["teachingSequence"][0]["answer"] = {
            "kind": "exact", "content": "Compare", "acceptanceCondition": None, "delivery": "none",
        }
        self.after = copy.deepcopy(self.before)
        self.after["teachingSequence"][0]["answer"]["content"] = "Contrast"
        self.assertTrue(any("answer.content is not words the class sees" in f for f in self.faults()))


def with_a_drawing(design: dict, used: bool = True) -> dict:
    """The sample lesson with a process chain whose boxes the lesson designer
    has written for children, the way a real run should have: on 28 September
    2026 the slide designer composed them from a description after the voice
    edit and printed `Bites; passes bacteria` and `Vict.`."""
    design["representations"].append({
        "id": "rep-002",
        "name": "How plague reached a person",
        "purpose": "Show the flea carrying the bacteria from the rat to a person.",
        "configurations": [{
            "id": "chain",
            "description": "Three boxes joined by arrows, rat to flea to person.",
            "loadBearing": True,
            "requiredFeatures": [
                "three boxes in this order, joined by arrows",
                'boxes reading, in order, "Infected rat", "The flea bites the rat" and "Bites; passes bacteria"',
                "a caption reading \"The plague came back in 1665\"",
            ],
        }],
    })
    if used:
        design["teachingSequence"][1]["representationRefs"].append(
            {"ref": "rep-002", "configuration": "chain", "interaction": "view"}
        )
    return design


FEATURES = ("representations", 1, "configurations", 0, "requiredFeatures")


class TheWordsADrawingPrints(unittest.TestCase):
    """The words inside a drawn diagram are children's reading, so the lesson
    designer quotes them in the representation's required features, the voice
    editor sees and rewords them, and the slide designer copies them."""

    def setUp(self) -> None:
        self.before = with_a_drawing(fixtures.valid_content_contract()[0])
        self.after = copy.deepcopy(self.before)
        self.features = self.after["representations"][1]["configurations"][0]["requiredFeatures"]

    def faults(self) -> list[str]:
        return checker.check(self.before, self.after)

    def test_the_view_shows_them_where_the_class_meets_the_drawing(self) -> None:
        packet = checker.load_packet()
        blocks = dict(packet.class_view_blocks(self.before))
        teach = blocks[self.before["teachingSequence"][1]["label"]]
        for words in ("Infected rat", "The flea bites the rat", "Bites; passes bacteria", "The plague came back in 1665"):
            self.assertIn(f"On the drawing: {words}", teach)
        lines, _count = packet.build_class_view(self.before)
        self.assertIn("> On the drawing: Bites; passes bacteria", lines)

    def test_rewording_the_printed_words_passes(self) -> None:
        self.features[1] = (
            'boxes reading, in order, "A rat has the plague", "A flea bites the rat" and '
            '"The flea bites a person and passes on the bacteria"'
        )
        self.features[2] = "a caption reading \"In 1665 the plague came back\""
        self.assertEqual(self.faults(), [])

    def test_a_changed_number_is_refused(self) -> None:
        self.features[2] = "a caption reading \"The plague came back in 1666\""
        found = self.faults()
        self.assertTrue(any("requiredFeatures[2]" in f and "swaps ['1665'] for ['1666']" in f for f in found), found)

    def test_the_description_around_the_words_is_not_the_editors(self) -> None:
        self.features[1] = (
            'two boxes reading "Infected rat", "The flea bites the rat" and "Bites; passes bacteria"'
        )
        self.features[0] = "three boxes in this order, with arrows"
        found = self.faults()
        self.assertTrue(any("requiredFeatures[1]" in f and "inside the quotation marks" in f for f in found), found)
        self.assertTrue(any("requiredFeatures[0]" in f and "outside the editor's lane" in f for f in found), found)

    def test_a_drawing_no_beat_shows_is_outside_the_lane(self) -> None:
        self.before = with_a_drawing(fixtures.valid_content_contract()[0], used=False)
        self.after = copy.deepcopy(self.before)
        self.after["representations"][1]["configurations"][0]["requiredFeatures"][2] = (
            "a caption reading \"In 1665 the plague came back\""
        )
        self.assertTrue(any("outside the editor's lane" in f for f in self.faults()))

    def test_settle_puts_back_only_the_label_at_fault(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            (work / "lesson-design.json").write_text(json.dumps(self.before), encoding="utf-8")
            (work / "photo-requirements.json").write_text(
                json.dumps(fixtures.valid_content_contract()[1]), encoding="utf-8")
            run = lambda *a: subprocess.run([sys.executable, str(SCRIPT), *a, "--working-dir", str(work)],
                                            capture_output=True, text=True, encoding="utf-8")
            self.assertIn("VOICE_EDIT_SNAPSHOT_OK", run("snapshot").stdout)
            view = (work / "voice-edit-view.md").read_text(encoding="utf-8")
            self.assertIn("> On the drawing: Bites; passes bacteria", view)
            self.assertIn("reword only the words inside the quotation marks", view)
            self.features[1] = self.features[1].replace(
                "Bites; passes bacteria", "The flea bites a person and passes on the bacteria")
            self.features[2] = "a caption reading \"The plague came back in 1666\""
            (work / "lesson-design.json").write_text(json.dumps(self.after), encoding="utf-8")
            self.assertIn("VOICE_EDIT_SETTLED: 1 strings reworded kept, 1 put back", run("settle").stdout)
            settled = json.loads((work / "lesson-design.json").read_text(encoding="utf-8"))
            features = settled["representations"][1]["configurations"][0]["requiredFeatures"]
            self.assertIn("The flea bites a person and passes on the bacteria", features[1])
            self.assertEqual(features[2], self.before["representations"][1]["configurations"][0]["requiredFeatures"][2])


class TheQuotedWordsAreFoundExactly(unittest.TestCase):
    validator = load("validator_for_drawn_words", ROOT / "scripts" / "validate-lesson-design.py")

    def test_each_quoted_phrase_is_one_printed_label(self) -> None:
        cases = {
            'boxes reading "A rat", "The flea\'s bite" and "A person"': ["A rat", "The flea's bite", "A person"],
            "one band labelled 'In the pit' from 4 am to 5:30 pm": ["In the pit"],
            "the stem 'Sarah's day in 1842' written above the line": ["Sarah's day in 1842"],
            "callout labels “The children’s hands” and “Coal”": ["The children’s hands", "Coal"],
            "the children's day labelled 'At school'": ["At school"],
        }
        for feature, words in cases.items():
            self.assertEqual(self.validator.diagram_print(feature), words, feature)

    def test_a_feature_that_prints_nothing_gives_nothing(self) -> None:
        for feature in ("every integer labelled, with correct negative signs",
                        "No caption: children work it out",
                        "the word \"tick\" is not needed here",
                        "three boxes in this order, joined by arrows"):
            self.assertEqual(self.validator.diagram_print(feature), [], feature)

    def test_the_frame_is_the_feature_without_its_printed_words(self) -> None:
        frame = self.validator.diagram_print_frame
        self.assertEqual(frame('boxes reading "A rat" and "A flea"'), frame('boxes reading "Rat" and "The flea"'))
        self.assertNotEqual(frame('boxes reading "A rat" and "A flea"'), frame('two boxes reading "A rat" and "A flea"'))
        self.assertNotEqual(frame('boxes reading "A rat" and "A flea"'), frame('boxes reading "A rat"'))


class SettleKeepsWhatIsInTheLane(unittest.TestCase):
    def run_in(self, *args: str, script: Path = SCRIPT) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, str(script), *args, "--working-dir", str(self.work)],
                              capture_output=True, text=True, encoding="utf-8")

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.work = Path(self.tmp.name)
        self.design, photos = fixtures.valid_content_contract()
        (self.work / "lesson-design.json").write_text(json.dumps(self.design), encoding="utf-8")
        (self.work / "photo-requirements.json").write_text(json.dumps(photos), encoding="utf-8")
        (self.work / "design-decisions.md").write_text("approved\n", encoding="utf-8")
        self.assertIn("VOICE_EDIT_SNAPSHOT_OK", self.run_in("snapshot").stdout)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def write(self, design: dict) -> None:
        (self.work / "lesson-design.json").write_text(json.dumps(design), encoding="utf-8")

    def test_the_snapshot_writes_the_approved_class_view(self) -> None:
        view = (self.work / "voice-edit-view.md").read_text(encoding="utf-8")
        self.assertIn("> Roads open up the forest", view)
        self.assertIn("Anything not printed here is not yours to change", view)

    def test_only_the_strings_at_fault_go_back(self) -> None:
        edited = copy.deepcopy(self.design)
        edited["teachingSequence"][1]["content"]["headline"] = "A road lets people in"
        edited["teachingSequence"][0]["content"]["focus"] = "Reworded planning note"
        self.write(edited)
        self.assertIn("VOICE_EDIT_SETTLED: 1 strings reworded kept, 1 put back", self.run_in("settle").stdout)
        settled = json.loads((self.work / "lesson-design.json").read_text(encoding="utf-8"))
        self.assertEqual(settled["teachingSequence"][1]["content"]["headline"], "A road lets people in")
        self.assertEqual(settled["teachingSequence"][0]["content"]["focus"],
                         self.design["teachingSequence"][0]["content"]["focus"])
        self.assertIn("VOICE_EDIT_OK", self.run_in("check").stdout)

    def test_a_string_put_back_takes_its_identical_copy_with_it(self) -> None:
        base = {("a",): "Same question?", ("b",): "Same question?", ("c",): "Other words"}
        curr = {("a",): "Reworded question?", ("b",): "Reworded question?", ("c",): "Other, reworded"}
        self.assertEqual(checker.with_twins([("a",)], base, curr), [("a",), ("b",)])

    def test_a_change_of_structure_restores_all_three_files(self) -> None:
        edited = copy.deepcopy(self.design)
        edited["teachingSequence"][1]["content"]["keyQuestions"].append("A new question?")
        self.write(edited)
        (self.work / "design-decisions.md").write_text("edited\n", encoding="utf-8")
        (self.work / "photo-requirements.json").write_text("{}", encoding="utf-8")
        self.assertIn("VOICE_EDIT_RESTORED", self.run_in("settle").stdout)
        for name, before in (("lesson-design.json", "lesson-design.before-voice.json"),
                             ("design-decisions.md", "design-decisions.before-voice.md"),
                             ("photo-requirements.json", "photo-requirements.before-voice.json")):
            self.assertEqual((self.work / name).read_bytes(), (self.work / before).read_bytes(), name)

    def test_without_the_packet_the_check_says_so_with_a_marker(self) -> None:
        alone = self.work / "alone"
        alone.mkdir()
        shutil.copyfile(SCRIPT, alone / SCRIPT.name)
        result = self.run_in("check", script=alone / SCRIPT.name)
        self.assertEqual(result.returncode, 2)
        self.assertIn("VOICE_EDIT_CHECK_ERROR", result.stdout)


class TheCommand(unittest.TestCase):
    def test_snapshot_then_check_passes_an_edit_and_refuses_a_photo_change(self) -> None:
        design, photos = fixtures.valid_content_contract()
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            (work / "lesson-design.json").write_text(json.dumps(design), encoding="utf-8")
            (work / "photo-requirements.json").write_text(json.dumps(photos), encoding="utf-8")
            run = lambda *a: subprocess.run([sys.executable, str(SCRIPT), *a, "--working-dir", str(work)],
                                            capture_output=True, text=True, encoding="utf-8")
            self.assertIn("VOICE_EDIT_SNAPSHOT_OK", run("snapshot").stdout)
            design["teachingSequence"][1]["content"]["headline"] = "A road lets people in"
            (work / "lesson-design.json").write_text(json.dumps(design), encoding="utf-8")
            result = run("check")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("VOICE_EDIT_OK: 1 strings reworded", result.stdout)
            photos["schemaVersion"] = 99
            (work / "photo-requirements.json").write_text(json.dumps(photos), encoding="utf-8")
            result = run("check")
            self.assertEqual(result.returncode, 1)
            self.assertIn("photograph contract", result.stdout)


if __name__ == "__main__":
    unittest.main()
