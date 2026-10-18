"""The teacher's rulings of 18 October 2026, from his review of the Year 4 Sound pair.

Lesson 2 ("Explain how we hear sounds") taught sound through solids for a
string telephone's sake, five parts of the ear, rice on a cling-film bowl,
cupped hands and the bell's whole journey: each piece needed by the next, and
three chunks of teaching before its explanation task. Every check passed. The
teacher found it "so much". Asked one decision at a time, he ruled:

1. A lesson is about achieving its objective for this year group; a scheme is
   ideas, binding only where he marks it.
2. A word stays when it helps achieve the objective, never babyish.
3. Quick checks teach nothing new and cost time; usually two chunks of
   teaching, then a short lead-in and the final task.
4. Depth follows what the child must explain.
5. A picture shows what the words explain; ask what the child must see before
   choosing a helper.
6. One yes-or-no on its own carries its reason; no bare `Write yes or no.`
7. A test that is the evidence says why it counts.

These checks hold that each ruling reaches the reader who acts on it.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, flat, section_by_heading  # noqa: E402

PREFS = ROOT / "references" / "preferences.md"
DESIGNER = flat((ROOT / "agents" / "lesson-designer.md").read_text(encoding="utf-8"))
REVIEWER = flat((ROOT / "agents" / "design-reviewer.md").read_text(encoding="utf-8"))
SCIENCE = flat((ROOT / "references" / "subject-science.md").read_text(encoding="utf-8"))
COMPONENTS = flat((ROOT / "references" / "lesson-designer-components.md").read_text(encoding="utf-8"))
PACKET = (ROOT / "scripts" / "design-review-packet.py").read_text(encoding="utf-8")


class ScopeComesFromTheObjective(unittest.TestCase):
    FITS = section_by_heading(PREFS, "## How Much Fits in One Lesson", 0)

    def test_the_home_holds_the_ruling_and_both_growths(self) -> None:
        self.assertIn("**Scope comes from the objective, never from the list a plan offers or from a need "
                      "the lesson made for itself.**", self.FITS)
        # Priority marks are the school's view, not a binding list.
        self.assertIn("a scheme's core knowledge beside its possible or supporting facts", self.FITS)
        # The one test, and its limit in both directions.
        self.assertIn("does a child explain or understand better with it, or only name more?", self.FITS)
        self.assertIn("a lesson never goes babyish to stay small", self.FITS)
        # The two growths, each with the real case.
        self.assertIn("A case, a lesson question or a final task brings in an idea the objective does not name",
                      self.FITS)
        self.assertIn("beats justify each other in a loop", self.FITS)
        self.assertIn("So follow every `needed by` to its end.", self.FITS)
        # Length is not filled for its own sake: the teacher judged a 34-minute
        # plan "right" (18 October 2026), so no line here asks for padding.
        self.assertNotIn("still fills its 45 to 50 minutes", self.FITS)

    def test_the_chain_ends_at_the_objective(self) -> None:
        lesson_for = section_by_heading(PREFS, "## What a Lesson Is For", 0)
        self.assertIn("The chain ends at the objective", lesson_for)
        self.assertIn("follow the chain on until it reaches what the objective asks", DESIGNER)

    def test_a_listing_offers_and_does_not_require(self) -> None:
        self.assertNotIn("approved objective or supplied sequence requires it", DESIGNER)
        self.assertNotIn("approved objective, supplied sequence or curriculum for this lesson requires it", SCIENCE)
        self.assertIn("a plan that lists it offers it", DESIGNER)
        self.assertIn("a plan that lists a term or a fact offers it", SCIENCE)

    def test_the_designer_settles_depth_before_reading_the_plans_lists(self) -> None:
        self.assertIn("as if the plan's content lists were not there", DESIGNER)
        self.assertIn("`follow this plan`, which binds even where you would teach it differently", DESIGNER)
        self.assertIn("needed means needed for what the objective asks", DESIGNER)
        self.assertIn("One idea told through several new names", DESIGNER)

    def test_the_reviewer_reads_the_whole_lessons_load(self) -> None:
        self.assertIn("Then read the whole lesson's load against what the objective needs for this class",
                      REVIEWER)
        self.assertIn("A plan having listed it is not the reason it stays.", REVIEWER)
        # The trigger for the amount section no longer rests only on an unused idea.
        self.assertIn("three or more chunks of teaching before the main work", PACKET)


class QuickChecksAndChunks(unittest.TestCase):
    RHYTHM = section_by_heading(PREFS, "## The Teach → Do → Teach → Do Rhythm", 0)

    def test_quick_checks_never_make_room_for_ideas(self) -> None:
        self.assertNotIn("a lesson with four things to teach keeps each one used without four tasks", self.RHYTHM)
        self.assertIn("A quick check checks what was just taught and teaches nothing new", self.RHYTHM)
        self.assertIn("Quick checks still cost time", self.RHYTHM)
        self.assertIn("Count the chunks of teaching as well as the tasks", self.RHYTHM)
        self.assertIn("It is the picture a judgement starts from, not a template", self.RHYTHM)

    def test_the_child_seat_view_counts_the_chunks(self) -> None:
        script = ROOT / "scripts" / "do-beats-in-a-row.py"
        design = {"teachingSequence": [
            {"kind": "starter", "sourceUnitId": "s", "label": "Recall", "pupilInstruction": "Answer."},
            {"kind": "teach", "sourceUnitId": "t1", "label": "The air", "content": {"explanation": "a"}},
            {"kind": "do", "sourceUnitId": "d1", "label": "Table test", "minutes": 4,
             "pupilInstruction": "Test it."},
            {"kind": "do", "sourceUnitId": "d2", "label": "Rice", "minutes": 2,
             "pupilInstruction": "Will the rice jump? Why do you think so?"},
            {"kind": "teach", "sourceUnitId": "t2", "label": "The eardrum", "content": {"explanation": "b"}},
            {"kind": "do", "sourceUnitId": "d3", "label": "Cupped hands", "minutes": 2,
             "pupilInstruction": "Louder or quieter? Why?"},
            {"kind": "teach", "sourceUnitId": "t3", "label": "To the brain", "content": {"explanation": "c"}},
            {"kind": "do", "sourceUnitId": "d4", "label": "The chain", "minutes": 5,
             "pupilInstruction": "Put it in order."},
            {"kind": "practise", "sourceUnitId": "p", "label": "Explain", "minutes": 13,
             "pupilInstruction": "Explain how Simran hears Yusuf."},
        ]}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder, "lesson-design.json")
            path.write_text(json.dumps(design), encoding="utf-8")
            out = subprocess.run([sys.executable, str(script), str(path)], capture_output=True, text=True,
                                 encoding="utf-8").stdout
        # Three chunks: the rice follows the table test with no teaching
        # between, so it does not start a chunk of its own here.
        self.assertIn("Chunks of teaching before the main work, each ended by a quick check or a task: 3.", out)
        self.assertIn("never a cap", out)


class WhatChildrenAnswerAndSee(unittest.TestCase):
    def test_a_lone_yes_or_no_carries_its_reason(self) -> None:
        text = flat(PREFS.read_text(encoding="utf-8"))
        self.assertIn("One yes-or-no decision on its own carries its reason", text)
        self.assertNotIn("Write yes or no, then one reason", text)
        self.assertIn("Every child writes a prediction and why", SCIENCE)

    def test_depth_follows_what_the_child_explains(self) -> None:
        self.assertIn("**Depth follows what the child must explain.**", SCIENCE)
        self.assertIn("The same depth everywhere is not the aim", SCIENCE)

    def test_a_test_says_why_it_counts(self) -> None:
        self.assertIn("**A test that is the evidence says why it counts.**", SCIENCE)
        self.assertIn("This does not turn every demonstration into a fair test.", SCIENCE)

    def test_a_slide_explaining_how_shows_it_happening(self) -> None:
        boundary = section_by_heading(PREFS, "### Lesson Designer visual-need boundary", 0)
        self.assertIn("**A slide that explains how something happens shows it happening.**", boundary)
        self.assertIn("Choosing the picture that is already to hand and letting it decide what is shown is the mistake",
                      boundary)
        self.assertIn("a helper's boxes and arrows drew a route where the lesson was explaining a push", boundary)
        self.assertIn("The limit is judged step by step, never for the whole lesson.", boundary)
        self.assertIn("A route diagram is right where the route is the point", boundary)
        self.assertIn("the features name the thing and the happening", DESIGNER)
        self.assertIn("A picture made to show a process happening that no camera can catch", COMPONENTS)

    def test_the_helper_inventory_prints_each_purpose(self) -> None:
        script = ROOT / "scripts" / "check-helper-coverage.py"
        design = {"representations": [{
            "id": "rep-001", "name": "The sound's path",
            "purpose": "Shows the vibration being passed from one thing to the next.",
            "configurations": [{"id": "air-path", "description": "Drum, a box for the air, an ear.",
                                "loadBearing": True,
                                "requiredFeatures": ["a box of words reading \"the air\""]}]}],
            "teachingSequence": [{"kind": "teach", "sourceUnitId": "t1", "content": {"explanation": "a"},
                                  "representationRefs": [{"ref": "rep-001", "configuration": "air-path",
                                                          "interaction": "view"}]}]}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder, "lesson-design.json")
            path.write_text(json.dumps(design), encoding="utf-8")
            result = subprocess.run([sys.executable, str(script), "inventory", "--lesson-design", str(path)],
                                    capture_output=True, text=True, encoding="utf-8")
        out = result.stdout
        self.assertIn("REQUIRED USES 1", out, result.stderr)
        self.assertIn("(purpose: Shows the vibration being passed from one thing to the next.)", out)
        self.assertIn("is a lookalike of that purpose", out)


class TheBuiltDecksOf18October(unittest.TestCase):
    """What the teacher saw in the rebuilt food chains and digestion decks."""

    def test_a_question_is_asked_before_its_answer_is_shown(self) -> None:
        templates = flat((ROOT / "references" / "templates.md").read_text(encoding="utf-8"))
        content = flat((ROOT / "references" / "teaching-sequence-content-based.md").read_text(encoding="utf-8"))
        self.assertIn("A question that a line on the same slide already answers has stopped being a question", templates)
        self.assertIn("An opening question starts a way in from what children know or can see", content)
        self.assertIn("never a line that only points at the picture (`Look at this rabbit.`)", content)

    def test_board_lines_lower_the_words_not_what_is_taught(self) -> None:
        core = flat(PREFS.read_text(encoding="utf-8"))
        self.assertIn("That lowers the words, never what is taught", core)
        self.assertIn("read every board line as you read a sticky fact", core)

    def test_two_chunks_never_means_cramming(self) -> None:
        rhythm = section_by_heading(PREFS, "## The Teach → Do → Teach → Do Rhythm", 0)
        self.assertIn("A chunk is counted in ideas, so two is never a reason to pack more new things into one", rhythm)
        self.assertIn("the answer is fewer things, never bigger chunks", rhythm)
        self.assertIn("more new things are never folded into one telling to keep the count low", DESIGNER)

    def test_a_photograph_of_the_thing_is_not_the_thing_happening(self) -> None:
        boundary = section_by_heading(PREFS, "### Lesson Designer visual-need boundary", 0)
        self.assertIn("a food chains deck put its sunlit grass photograph on the slide explaining that grass makes its own food from sunlight, which shows grass", boundary)
        self.assertIn("a digestion deck kept one labelled diagram on every board", boundary)

    def test_one_look_for_one_chain(self) -> None:
        templates = flat((ROOT / "references" / "templates.md").read_text(encoding="utf-8"))
        self.assertIn("**One look for one chain.**", templates)
        figure = (ROOT / "builder" / "src" / "content" / "shared-figure.js").read_text(encoding="utf-8")
        self.assertIn("checkChainTurn", figure)
        self.assertIn("PROCESS_CHAIN_TURNED_FOR_ROOM", (ROOT / "builder" / "src" / "content" / "_zone-fill.js").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
