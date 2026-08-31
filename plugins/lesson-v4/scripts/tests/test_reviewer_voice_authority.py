from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REVIEWER = ROOT / "agents" / "design-reviewer.md"
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
    """

    def test_register_is_a_material_outcome(self) -> None:
        reviewer = flat(REVIEWER)
        self.assertIn(
            "the teacher's voice in child-facing and spoken words", reviewer
        )

    def test_the_polish_exclusion_no_longer_swallows_register(self) -> None:
        """"Do not report polish" stays for design polish; a wrong-register
        string is carved out with the reason it is not polish."""
        reviewer = flat(REVIEWER)
        self.assertIn(
            "Do not report polish that has no material teaching or learning "
            "effect.",
            reviewer,
        )
        self.assertIn(
            "A child-facing or spoken string in the wrong register is not "
            "polish.",
            reviewer,
        )
        # The reason: strings ship verbatim, so today the teacher fixes them.
        self.assertIn("no downstream agent is permitted to reword it", reviewer)
        self.assertIn("the teacher edits it out by hand", reviewer)

    def test_the_sweep_is_enumerated_not_an_impression(self) -> None:
        """"The voice seemed fine" is what failed; the sweep walks strings."""
        reviewer = flat(REVIEWER)
        self.assertIn("Then sweep the voice, string by string.", reviewer)
        self.assertIn(
            "every script, explanation, definition, question, task "
            "instruction, success criterion, sticky fact, model answer and "
            "worksheet string",
            reviewer,
        )
        self.assertIn("Final pre-flight check", reviewer)

    def test_the_real_misses_calibrate_the_sweep(self) -> None:
        reviewer = flat(REVIEWER)
        # The written-register script, with the spoken repair beside it.
        self.assertIn(
            "Trace where the electricity comes from in each photograph",
            reviewer,
        )
        self.assertIn(
            "Look at where each one gets its electricity from", reviewer
        )
        # The machine-rhythm run of nutrient sentences.
        self.assertIn("Carbohydrates are our main source of energy.", reviewer)
        # The repeated-construction model answer.
        self.assertIn("The pitta provides", reviewer)
        # The missed playful opening, guarded by the guide's own judgement.
        self.assertIn(
            "an easy playful opportunity the content handed over and nothing "
            "took",
            reviewer,
        )
        self.assertIn("never force one", reviewer)

    def test_repairs_are_bounded_and_metadata_is_off_limits(self) -> None:
        """The calibrator's boundary: repair only genuine misses, and never
        judge planning fields as voice."""
        reviewer = flat(REVIEWER)
        self.assertIn(
            "same meaning, same teaching, same difficulty, the teacher's "
            "register",
            reviewer,
        )
        self.assertIn(
            "rewriting sound strings to taste is the same fault in the other "
            "direction",
            reviewer,
        )
        self.assertIn("Never reword planning metadata", reviewer)
        for field in ("`teacherInfo`", "`acceptanceCondition`",
                      "`flagsForTeacher`"):
            with self.subTest(field=field):
                self.assertIn(field, reviewer)
        self.assertIn(
            "Record each repair under Corrections made", reviewer
        )

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
        reviewer = flat(REVIEWER)
        self.assertIn("teacher-voice.md", reviewer)


if __name__ == "__main__":
    unittest.main()
