"""Every teaching-route and pedagogy-reference rule the teacher's ledger recorded
is still where it lives.

What the plugin says about how a lesson's route works and how it teaches was
written 592 times across the five route files, the activity list, the evidence,
explanation, reasoning, modelling and task-contrast references, the lesson
designer's own file and three programs. The streamline of 23 and 24 September
2026 listed every one (plans/2026-09-23-routes-ledger.md), the teacher answered
its decisions and settled items, and the routes release (topic 8, release 3)
built them.

`routes_ledger_pins.json` holds each row's words where they now live, each
changed rule's whole paragraph, the two new headings in the content route
paragraph by paragraph, and the wordings that left as gone. The fix for a
failure here is to update the ledger and the pins on purpose, with the
teacher's say-so.
"""

from __future__ import annotations

import re
import subprocess
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, flat, make_ledger_tests, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("routes_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-23-routes-ledger.md"
REF = ROOT / "references"
CONTENT = REF / "teaching-sequence-content-based.md"
SKILL = REF / "teaching-sequence-skill-based.md"
TASK = REF / "teaching-sequence-task-centred.md"
DIAL = REF / "teaching-sequence-dialogic.md"
DISC = REF / "teaching-sequence-discovery.md"
ROUTES = (CONTENT, SKILL, TASK, DIAL, DISC)
LD = ROOT / "agents" / "lesson-designer.md"
REV = ROOT / "agents" / "design-reviewer.md"
HOW = "`teaching-sequence-content-based.md` → `How this teacher explains`"

EveryRoutesRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "RT", 592)


def text(path: Path) -> str:
    return flat(path.read_text(encoding="utf-8"))


class MovingAbout(unittest.TestCase):
    """Decision 1 (his "y")."""

    def test_no_route_offers_four_corners(self) -> None:
        for route in ROUTES:
            with self.subTest(route=route.name):
                self.assertNotIn("four corners", text(route).lower())
                self.assertNotIn("four-corners", text(route).lower())
        self.assertIn("- A line on paper from agree to disagree, or a vote with a written reason (`do-beats.md` 6.2 and "
                      "6.4)", text(DIAL))
        self.assertIn("a ranking, a sort, a vote with a written reason", text(DIAL))

    def test_the_formats_that_need_every_child_to_commit_first_keep_their_condition(self) -> None:
        dial = text(DIAL)
        self.assertIn("only when every child first writes what their character would say, or picks a side, before "
                      "anyone performs", dial)
        self.assertIn("Short structured debate, only when every child first picks a side and writes one reason", dial)

    def test_movement_is_allowed_unasked_only_when_it_is_what_is_learned(self) -> None:
        self.assertIn("Choose a whole-class movement beat only when the teacher asks for it, or when the movement is "
                      "itself what is being learned (standing and making a quarter turn to learn what a quarter turn "
                      "is).", text(REF / "do-beats.md"))
        # The two places that already said the case, and now agree.
        self.assertIn("children stand and make each turn before naming one on a diagram", text(SKILL))
        self.assertIn("having children enact it (standing and turning quarter, half, clockwise/anticlockwise)", text(LD))


class TheTeachersWayOfExplaining(unittest.TestCase):
    """Decisions 3 and 4 (his 3, widened): "thats how i explain anything, so
    might not neccearily be teach slides i guess"."""

    def test_it_is_written_once_below_the_reviewers_line(self) -> None:
        lines = CONTENT.read_text(encoding="utf-8").splitlines()
        output = lines.index("## Output Format Block")
        self.assertGreater(lines.index("### How this teacher explains"), output)
        self.assertGreater(lines.index("### The launch"), lines.index("### How this teacher explains"))
        section = section_by_heading(CONTENT, "### How this teacher explains", 0)
        self.assertIn("**This is how this teacher usually explains anything, on a Teach board in any kind of lesson or "
                      "wherever else something is explained: the takeaway, then a because or so that explains that one "
                      "key point, then an example or what it does not mean.**", section)
        self.assertIn("It is how he usually explains, not a template", section)
        # One sentence names each route's field, one the two exceptions and where they live.
        for field in ("`explanation` on this route's Teach and on a skill lesson's `teach`",
                      "`activity` on a skill `prepare` in `explanation` mode",
                      "`explanation` on a task lesson's `teach-needed`",
                      "`accurateExplanation` on a discovery `teach-why`",
                      "`input` on a dialogic `grounding-input` when it explains"):
            self.assertIn(field, section)
        self.assertIn("a skills lesson's teaching board stays brief (`teaching-sequence-skill-based.md` → Cycles, and "
                      "the beats around them)", section)
        self.assertIn("a discovery lesson lands its takeaway at the end, because children reach it themselves", section)
        # It holds the explaining, not the Teach's other fields or the Do.
        for part in ("(1) The takeaway", "(2) The because or the so", "(3) The example", "(4) What it does not mean",
                     "**The fourth part: when the sentence invites a wrong reading",
                     "**The test is a teacher who does not already know this content"):
            self.assertIn(part, section)
        for elsewhere in ("A Teach has a thought in it", "\"kind\": \"do\"", "`launch` is `null`"):
            self.assertNotIn(elsewhere, section)
        self.assertNotIn("The shape this teacher teaches in", text(CONTENT))

    def test_the_bundled_reader_hands_each_section_over_whole(self) -> None:
        for heading, first, last in (
                ("How this teacher explains", "**This is how this teacher usually explains anything",
                 "a card that restates the headline with one detail added is yours to refuse."),
                ("The launch", "`launch` is `null` when children can begin from the question alone",
                 "the words that connect it.")):
            with self.subTest(heading=heading):
                done = subprocess.run(
                    [sys.executable, "-X", "utf8", str(ROOT / "scripts" / "read-reference.py"),
                     "--select", f"teaching-sequence-content-based.md::{heading}"],
                    capture_output=True, text=True, encoding="utf-8", check=True)
                self.assertIn("REFERENCE_READ_OK", done.stdout)
                body = flat(done.stdout)
                self.assertIn(first, body)
                self.assertIn(last, body)

    def test_the_section_is_true_read_on_its_own(self) -> None:
        # Other routes read it alone: no pointer to something above it, and no
        # claim that is only true of a knowledge lesson's Teach.
        section = section_by_heading(CONTENT, "### How this teacher explains", 0)
        self.assertNotIn("fault above", section)
        self.assertIn("the validator refuses `null` on a `teach` beat (a task lesson's `teach-needed` keeps its own "
                      "rule: `null` only when the idea and its instance already carry the meaning)", section)
        self.assertIn("Saying the same thing three ways is a fault (this section's last paragraph: the landed sentence "
                      "again in other words)", section)
        self.assertIn("which is saying the same thing three ways, at the level of slides", section)

    def test_every_route_points_there_and_keeps_its_own_exception(self) -> None:
        skill, task, disc, dial = text(SKILL), text(TASK), text(DISC), text(DIAL)
        self.assertIn("its `explanation` explains as " + HOW + " says, kept brief on the board as `Cycles, and the "
                      "beats around them` says", skill)
        self.assertIn("In a methods lesson it is brief on the board as well as in time", skill)
        self.assertIn("two or three short lines on the board, the way this teacher explains (" + HOW + ")", skill)
        self.assertIn("It takes the full launch its size deserves (`teaching-sequence-content-based.md` → `The "
                      "launch`).", skill)
        self.assertIn("`explanation` supplies necessary visible meaning beside the `modelledOn` instance, the way this "
                      "teacher explains (" + HOW + ")", task)
        self.assertIn("in two or three short lines, the way this teacher explains", task)
        self.assertIn("with the takeaway landing at the end, because children reach it themselves", disc)
        self.assertIn("the takeaway landing at the end", disc)
        self.assertIn("When the input explains something rather than naming it, it explains the way this teacher "
                      "explains (" + HOW + ").", dial)
        # The older shapes are gone, each route's length kept.
        self.assertNotIn("what it means, why it matters, what it looks like", skill + task)
        self.assertNotIn("what happened, why, what it looks like", disc)

    def test_the_designer_reads_the_two_sections_and_the_pointers_name_the_heading(self) -> None:
        designer = text(LD)
        self.assertIn("read `teaching-sequence-content-based.md::How this teacher explains` with "
                      "`read-reference.py --select`", designer)
        self.assertIn("read `teaching-sequence-content-based.md::The launch` the same way", designer)
        self.assertIn("in the order and with the exceptions " + HOW + " gives", designer)
        self.assertIn("Read each Teach board for the four parts the teacher teaches in (" + HOW + ")", text(REV))
        self.assertIn("(" + HOW + " owns the four parts and their exceptions)", text(REF / "preferences.md"))
        self.assertIn("An explanation usually goes the way this teacher explains (" + HOW + "); that is how he "
                      "usually explains, not a template.", text(REF / "teacher-voice.md"))

    def test_his_calibration_examples_stay_exactly(self) -> None:
        content = text(CONTENT)
        # The teacher rejected the earlier campaign/laws sentence on 26 September
        # and explicitly endorsed this concrete takeaway. Preserve that calibration.
        for example in ("`Lord Shaftesbury wanted children to spend less time working in factories.`",
                        "`Long days at work left children tired, with little time to learn or play.`",
                        "`Look at her. She isn't being paid to do this.`",
                        "`Victorian children from poor families worked because their families needed the money`",
                        "\"we want variety, and sometimes it's not relevant just stating the misconception\"",
                        "\"the scene hasn't been set; there's nothing on the slide to guide me to know what to say.\""):
            self.assertIn(example, content)
        self.assertIn("> **Weak:** \"Jack eats toffees. There are germs in his mouth. Germs make acid. His tooth "
                      "hurts.\"", (REF / "explanation-tasks.md").read_text(encoding="utf-8"))


class ThePlanTheLookForAndTheEnablingInput(unittest.TestCase):
    def test_planning_gets_its_own_beat_only_for_something_children_need(self) -> None:
        task = text(TASK)
        self.assertIn("the plan gets its own beat only when it produces something children need before they start (a "
                      "fair-test plan, a labelled design)", task)
        self.assertIn("with any check for safety or wasted materials inside it as the teacher's check", task)
        self.assertNotIn("materially improves the work", task)
        # The checkpoint's own conditions are unchanged.
        self.assertIn("include a checkpoint only when an unchecked decision could waste substantial time or "
                      "materials, create a safety risk", task)

    def test_look_for_names_one_link_inside_the_25_words(self) -> None:
        guide = text(REF / "explanation-tasks.md")
        self.assertIn("Put the one link most children skip, and the question to ask at it, in `speakerNotes.lookFor`",
                      guide)
        self.assertIn("The other likely gaps and their questions go in the same beat's `speakerNotes.teacherInfo`",
                      guide)
        example = re.search(r"`(Look for: [^`]+)`", guide).group(1)
        # Counted as the validator counts it.
        self.assertLessEqual(len(example[len("Look for:"):].strip().split()), 25)

    def test_a_big_task_lessons_enabling_input_is_one_idea_at_a_time(self) -> None:
        self.assertIn("after a short enabling input, one idea at a time", text(REF / "lesson-designer-components.md"))


class TheSettledItems(unittest.TestCase):
    def test_a_live_my_turns_finished_helper_follows(self) -> None:
        skill = text(SKILL)
        self.assertNotIn("do not create a following answer slide", skill)
        self.assertIn("the finished helper follows on the next slide as the unit's answer", skill)

    def test_the_activity_lists_contents_count_its_entries(self) -> None:
        catalogue = (REF / "do-beats.md").read_text(encoding="utf-8")
        words = {"five": 5, "seven": 7, "eight": 8, "ten": 10}
        for number in range(1, 11):
            section = re.search(rf"(?ms)^## {number}\. .*?(?=^## |\Z)", catalogue).group(0)
            entries = len(re.findall(rf"(?m)^### {number}\.\d+ ", section))
            line = re.search(rf"(?m)^- \*\*§{number} [^*]+\*\*[^\n]*", catalogue).group(0)
            said = next(value for word, value in words.items() if f"— {word} " in line or f": {word} " in line)
            with self.subTest(section=number):
                self.assertEqual(said, entries, line)
        contents = flat(catalogue.split("## Contents")[1].split("---")[0])
        for gone in ("brain dump", "turn and talk"):
            self.assertNotIn(gone, contents.lower())
        for gone in ("Brain Dump", "Turn-and-Talk", "(Turn and Talk)"):
            self.assertNotIn(gone, flat(catalogue))

    def test_the_catalogue_opening_says_what_entries_carry(self) -> None:
        self.assertIn("Each entry says what it is and what it is best for, and gives its access notes",
                      text(REF / "do-beats.md"))
        self.assertNotIn("register, best for, why it works, SEND access notes, source", text(REF / "do-beats.md"))

    def test_the_one_synthesise_is_the_routes_own(self) -> None:
        evidence = text(REF / "evidence-synthesis.md")
        self.assertIn("sentence stems and push-back questions are conditional teaching tools", evidence)
        self.assertIn("the one Synthesise after the last discussion is the route's own beat", evidence)

    def test_the_two_unwritten_rules_are_written_where_the_designer_reads_them(self) -> None:
        self.assertIn("Run each concept's cycles together, in the order `concepts` lists them.", text(SKILL))
        self.assertIn("A Talk's `discussionQuestion` is its Stimulus's `question`, word for word.", text(DIAL))
        validator = text(ROOT / "scripts" / "validate-lesson-design.py")
        self.assertIn("In maths \" f\"the plain words are what the teacher wants ('{word}')", validator)

    def test_the_slips(self) -> None:
        self.assertIn("(`teaching-sequence-skill-based.md` → Cycles, and the beats around them, `A step the method "
                      "needs`)", text(LD))
        dialogic = section_by_heading(REF / "evidence-synthesis.md",
                                      "### Dialogic / Scenario-based (children form and justify positions through "
                                      "structured talk)", 0)
        task = section_by_heading(REF / "evidence-synthesis.md", "### Task-Centred", 0)
        self.assertIn("**Sources.** Robin Alexander, *A Dialogic Teaching Companion* (2020)", dialogic)
        self.assertNotIn("Robin Alexander", task)
        evidence = text(REF / "evidence-synthesis.md")
        self.assertIn("Roediger & Karpicke", evidence)
        self.assertNotIn("Karpyne", evidence)
        self.assertNotIn("designing lesson PowerPoints", evidence)
        self.assertNotIn("the existing route's optional explanation", text(SKILL))
        for gone in ("Pose Pause Pounce Bounce", "Round Robin", "role on the wall"):
            self.assertNotIn(gone, text(REF / "do-beats.md"))

    def test_the_board_carries_the_route_in_the_designers_form_check(self) -> None:
        designer = text(LD)
        self.assertIn("keep one takeaway as key line, with the route on the board in whole sentences and said more "
                      "fully in the script", designer)
        self.assertNotIn("full spoken in script", designer)

    def test_the_teach_message_opens_on_the_landed_sentence(self) -> None:
        validator = text(ROOT / "scripts" / "validate-lesson-design.py")
        self.assertIn("the route this teacher usually walks after the sentence the slide lands, the because or so "
                      "that explains it", validator)
        self.assertNotIn("the route from what the class already has, through the thing on the board", validator)


class TheStoriesLeftForTheLog(unittest.TestCase):
    STORIES = (
        (SKILL, "the rubbing out was the slowest part of the lesson (19 September 2026)"),
        (SKILL, "A Year 4 rounding deck bundled two roundings into one sentence"),
        (SKILL, "(the user, 12 September 2026)"),
        (CONTENT, "A teeth slide that printed the same fact as its headline"),
        (CONTENT, "`Incisors cut; canines help tear.`"),
        (CONTENT, "Both Week 4 lessons (22 September 2026)"),
        (CONTENT, "four of five boards of one lesson on 22 September 2026"),
        (CONTENT, "A Year 4 science slide showed a tooth cross-section"),
        (CONTENT, "(14 September 2026)"),
        (CONTENT, "four tenths of its slide on prose"),
        (REF / "do-beats.md", "A Year 4 history beat on 17 September 2026"),
        (REF / "modelling-formats.md", "a cover teacher given a Year 4 rounding deck of blank number lines"),
        (REF / "modelling-formats.md", "(19 September 2026)"),
    )

    def test_each_is_gone_from_the_runtime_and_kept_in_the_log(self) -> None:
        log = text(REF / "build-review-log.md")
        for path, phrase in self.STORIES:
            with self.subTest(phrase=phrase):
                self.assertNotIn(phrase, text(path))
                self.assertIn(phrase, log)


if __name__ == "__main__":
    unittest.main()
