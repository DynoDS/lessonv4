from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REVIEWER = ROOT / "agents" / "design-reviewer.md"
VOICE_EDITOR = ROOT / "agents" / "lesson-voice-editor.md"
VOICE = ROOT / "references" / "teacher-voice.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ReviewerVoiceAuthorityTests(unittest.TestCase):
    """The voice guide was applied at authoring and had no enforceable second
    pass, so misses shipped despite three wiring repairs in one day.

    Two lessons built on 4.2.34 (31 Aug 2026, 13:20 and 13:25) went to the
    teacher's external voice calibrator. Every designer-side control added
    that morning was ACTIVE in those runs - the guide, the routed sections,
    the four read-back tells, the completion-pass pre-flight - and the
    calibrator still found: scripts in written-report English ("Trace where
    the electricity comes from in each photograph"), three nutrient sentences
    sharing one machine rhythm, a model answer running provides/provide/
    provide, and easy playful openings (the hand whisk, the lone apple) that
    nothing took.

    The design-reviewer sees every one of those strings (verified: the
    scripts appear in design-review-view.md), and its section 4 said to run
    the pre-flight. But its mandate gave a voice finding no legal outcome:
    register was absent from the material-defect list, "polish" reporting was
    banned, and bounded corrections existed only to "restore the settled
    lesson". A dutiful reviewer runs the check, classes the miss as polish,
    and moves on. The repair is authority, not another authoring tell.

    27 September 2026: that authority moved to the lesson voice editor, a worker
    whose only job is the words, run after the review approves the lesson. The
    reviewer's sweep had caught 4 of 62 strings on a Codex lesson and passed the
    adult register; a focused voice pass on the same lesson did far better. The
    calibration below moved with the authority, word for word.
    """

    def test_register_is_the_voice_editors_outcome_not_the_reviewers(self) -> None:
        reviewer = flat(REVIEWER)
        self.assertIn(
            "The teacher's voice in child-facing and spoken words is the lesson voice editor's outcome",
            reviewer,
        )
        self.assertIn("How a string sounds is not yours to judge or repair", reviewer)
        self.assertIn(
            "Do not report polish that has no material teaching or learning effect.",
            reviewer,
        )
        self.assertNotIn("Then sweep the voice, string by string.", reviewer)

    def test_the_editor_walks_every_string_not_an_impression(self) -> None:
        """"The voice seemed fine" is what failed; the editor walks strings."""
        editor = flat(VOICE_EDITOR)
        self.assertIn(
            "every script, explanation, definition, question, task "
            "instruction, success criterion, sticky fact, model answer and "
            "worksheet string",
            editor,
        )
        self.assertIn("Final pre-flight check", editor)
        self.assertIn('a general "the voice seemed fine" is not the job', editor)

    def test_the_real_misses_calibrate_the_editor(self) -> None:
        editor = flat(VOICE_EDITOR)
        self.assertIn("Trace where the electricity comes from in each photograph", editor)
        self.assertIn("Look at where each one gets its electricity from", editor)
        self.assertIn("Carbohydrates are our main source of energy.", editor)
        self.assertIn("The pitta provides", editor)
        self.assertIn("an easy playful opportunity the content handed over and nothing took", editor)
        self.assertIn("never force one", editor)

    def test_repairs_are_bounded_and_metadata_is_off_limits(self) -> None:
        """The calibrator's boundary: repair only genuine misses, and never
        judge planning fields as voice. The lane check enforces the second."""
        editor = flat(VOICE_EDITOR)
        self.assertIn("same meaning, same teaching, same difficulty, the teacher's register", editor)
        self.assertIn("rewriting sound strings to taste is the same fault in the other direction", editor)
        self.assertIn("Never reword planning metadata", editor)
        for field in ("`teacherInfo`", "`acceptanceCondition`", "`flagsForTeacher`"):
            with self.subTest(field=field):
                self.assertIn(field, editor)
        self.assertIn("check-voice-edit.py", editor)

    def test_a_recorded_caveat_binds_the_wording_it_governs(self) -> None:
        """The balanced-diet lesson wrote `a single lunch can illustrate
        balance but cannot prove that someone's whole diet is balanced; keep
        the wording about patterns over time` in teacherInfo, then set the
        task `explain why the whole lunch is balanced`. The consistency sweep
        now checks caveats against the strings they constrain."""
        reviewer = flat(REVIEWER)
        self.assertIn(
            "teacher-facing caveats against the wording they constrain",
            reviewer,
        )
        self.assertIn("keep the wording about patterns over time", reviewer)
        self.assertIn("explain why the whole lunch is balanced", reviewer)
        self.assertIn(
            "documented the limit and then shipped the wording that crosses "
            "it",
            reviewer,
        )

    def test_the_guide_stays_the_single_owner_of_the_register(self) -> None:
        """The repair is enforcement; the calibrated guide is untouched, and
        the sweep defers to it rather than restating its rules."""
        voice = flat(VOICE)
        self.assertIn("opportunity-sensitive, not quota-based", voice)
        self.assertIn("Final pre-flight check", voice)
        editor = flat(VOICE_EDITOR)
        self.assertIn("teacher-voice.md", editor)


if __name__ == "__main__":
    unittest.main()
