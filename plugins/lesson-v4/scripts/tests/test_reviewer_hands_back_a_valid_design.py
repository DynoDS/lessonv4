"""The design reviewer must prove its own corrections still validate.

Y4 Science, `Build and draw a series circuit`, 31 Aug 2026, plugin 4.2.43. The
reviewer's second pass returned `APPROVED` after making two bounded
corrections. One of them widened a Your Turn success standard so the teacher
would check the cell and the switch as well as the closed loop, and that
rewrite took `teachingSequence[2].speakerNotes.lookFor` to 31 words against a
validator limit of 25. The orchestrator's `design-review-packet.py verify` then
failed, and the run stopped while a six-word reduction was being prepared. No
PowerPoint, no worksheet, no answer key: the whole package was lost to a
sentence the reviewer could have shortened in the pass that wrote it.

Two gaps, both repaired here.

1. The reviewer was the only spec-owning worker in the pipeline whose spawn
   carried no `SUCCESS_CHECK`, and its role file forbade one named check
   (`design-review-packet.py verify`) without naming the one it did own. It
   read `Trust deterministic validation` as covering the design it was handed
   and never re-read that as covering the wording it wrote over the top.

2. The recovery for that failure sent the whole design to a fresh Lesson
   Designer attempt - a worker that never saw the string, at full design cost -
   rather than to the pass that made the edit and still held what the edit had
   to mean.

The limits stay in the validator, not in the reviewer's prose, so the reviewer
is never asked to carry a word count in its head; it is asked to run the check.
"""
from __future__ import annotations

import copy
import importlib.util
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
REVIEWER = ROOT / "agents" / "design-reviewer.md"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
VALIDATOR = ROOT / "scripts" / "validate-lesson-design.py"
CONTRACT_FIXTURES = HERE / "test_lesson_design_contract.py"


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


validator = load_module(VALIDATOR, "reviewer_handback_validator")
fixtures = load_module(CONTRACT_FIXTURES, "reviewer_handback_fixtures")


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


# The reviewer's real correction: it widened the success standard so the
# teacher checks the cell and the switch, not only the closed loop.
OVERLONG_LOOK_FOR = (
    "Look for: children who can explain that the cell provides the energy for "
    "the circuit and that the switch opens or closes the path so the lamp "
    "lights, and who say both in their own words"
)

# The same meaning, inside the limit - what the reviewer should have handed
# back, and what its own check now makes it reach before returning.
REPAIRED_LOOK_FOR = (
    "Look for: children who explain that the cell gives the energy and the "
    "switch opens or closes the path."
)


class ReviewerCorrectionIsStillDeterministicallyChecked(unittest.TestCase):
    """The failure itself, at the enforcement point."""

    def look_for_path(self, design: dict) -> dict:
        # teachingSequence[2] is the Your Turn unit, the same path the real
        # run failed on.
        return design["teachingSequence"][2]["speakerNotes"]

    def test_a_reviewer_style_widening_breaks_the_word_limit(self) -> None:
        design, photos = fixtures.valid_contract()
        validator.validate_design(
            copy.deepcopy(design), copy.deepcopy(photos)
        )

        self.look_for_path(design)["lookFor"] = OVERLONG_LOOK_FOR

        with self.assertRaises(validator.ContractError) as caught:
            validator.validate_design(design, photos)

        message = str(caught.exception)
        self.assertIn(
            "teachingSequence[2].speakerNotes.lookFor",
            message,
        )
        self.assertIn("at most 25 words", message)

    def test_the_same_meaning_inside_the_limit_validates(self) -> None:
        """A correction that will not validate has a shorter form that does;
        the reviewer's job is to find it, not to abandon the correction."""
        design, photos = fixtures.valid_contract()
        self.look_for_path(design)["lookFor"] = REPAIRED_LOOK_FOR
        validator.validate_design(design, photos)

    def test_restoring_the_original_wording_also_validates(self) -> None:
        """The other permitted exit: the design arrived valid, so putting the
        found wording back is always available to the reviewer."""
        design, photos = fixtures.valid_contract()
        original = self.look_for_path(design)["lookFor"]
        self.look_for_path(design)["lookFor"] = OVERLONG_LOOK_FOR
        self.look_for_path(design)["lookFor"] = original
        validator.validate_design(design, photos)


class ReviewerRunsTheValidatorOverItsOwnEdits(unittest.TestCase):
    """Gap 1: the editing pass now proves its own hand-off."""

    def test_the_role_file_names_the_validator_it_owns(self) -> None:
        reviewer = flat(REVIEWER)
        self.assertIn("### Prove your own edits still validate", reviewer)
        self.assertIn("scripts/validate-lesson-design.py", reviewer)
        self.assertIn("--initial-photo-namespace", reviewer)
        self.assertIn("Require exactly `LESSON_DESIGN_OK`", reviewer)

    def test_the_reason_is_authorship_not_a_new_ritual(self) -> None:
        """A reviewer that reads `trust deterministic validation` as covering
        its own rewrite is the failure; the file now separates the two."""
        reviewer = flat(REVIEWER)
        self.assertIn(
            "once you edit it you are the author of whatever it now contains",
            reviewer,
        )
        self.assertIn(
            "trusting it about the design you were given, not about the "
            "wording you have just written over it",
            reviewer,
        )

    def test_the_check_stays_cheap_and_bounded(self) -> None:
        """One run at the end, and none at all on a clean approval, so the
        repair for a slow run does not itself slow every run."""
        reviewer = flat(REVIEWER)
        self.assertIn(
            "Run it once at the end rather than after each correction, and "
            "skip it entirely when you corrected nothing",
            reviewer,
        )

    def test_an_unvalidatable_correction_is_out_of_bounds(self) -> None:
        """The escape hatch that keeps the canonical files always valid: the
        pre-edit design passed, so the reviewer can always return to it."""
        reviewer = flat(REVIEWER)
        self.assertIn(
            "**A correction that will not validate is not a bounded "
            "correction.**",
            reviewer,
        )
        self.assertIn("Restore the wording you found", reviewer)
        self.assertIn(
            "Never hand back a design that fails this check", reviewer
        )

    def test_the_mechanical_limits_stay_in_the_validator(self) -> None:
        """The reviewer is pointed at the check, not asked to memorise the
        numbers, so the limits cannot drift out of step with the validator."""
        reviewer = flat(REVIEWER)
        self.assertIn(
            "mechanical limits you are not asked to carry in your head",
            reviewer,
        )

    def test_the_packet_check_is_still_the_orchestrator_s(self) -> None:
        """The prohibition that misled the reviewer is kept, with the check it
        does own named beside it so the two cannot be confused again."""
        reviewer = flat(REVIEWER)
        self.assertIn(
            "This is the validator over the file you edited, and it is yours.",
            reviewer,
        )
        self.assertIn(
            "the orchestrator owns that one, and you do not run it", reviewer
        )

    def test_the_spawn_prompt_carries_the_success_check(self) -> None:
        """Every other spec-owning worker in this pipeline is launched with a
        SUCCESS_CHECK; the reviewer was the exception."""
        playbook = flat(PLAYBOOK)
        self.assertIn(
            "SUCCESS_CHECK - run this yourself before returning, unless you "
            "corrected nothing:",
            playbook,
        )
        self.assertIn(
            "The design handed to you already passed this check, so any "
            "failure is a correction you wrote.",
            playbook,
        )
        self.assertIn(
            "Do not return a design that fails it.",
            playbook,
        )
        # The review packet is retired from the chain; the reviewer must not
        # be sent hunting for it.
        self.assertIn(
            "There is no review packet: do not run `design-review-packet.py`.",
            playbook,
        )


class AFailedHandBackIsRepairedByThePassThatCausedIt(unittest.TestCase):
    """Gap 2: proportionate recovery, so one field never costs a package."""

    def test_the_repair_goes_back_to_the_reviewer(self) -> None:
        playbook = flat(PLAYBOOK)
        self.assertIn(
            "the fault is in the review pass's own corrections, because the "
            "design validated before the reviewer opened it",
            playbook,
        )
        self.assertIn(
            "launch one focused clean-context `decision-reviewer` job",
            playbook,
        )
        self.assertIn(
            "repair only the fields the validator names", playbook
        )
        # The same principle for the words check: its broken correction is
        # its own to shorten, never the author's or a wider recovery's.
        self.assertIn(
            "one focused clean-context `wording-reviewer` repair naming only "
            "the failing fields",
            playbook,
        )

    def test_the_review_result_is_not_re_litigated(self) -> None:
        """A mechanical repair must not reopen the semantic judgement, or the
        cheap route becomes a third full review."""
        playbook = flat(PLAYBOOK)
        self.assertIn(
            "leave the `Result` in `design-review-decisions.md` as it stands",
            playbook,
        )
        self.assertIn(
            "do not discard or re-run the review", playbook
        )

    def test_the_fresh_designer_attempt_is_the_last_resort(self) -> None:
        playbook = flat(PLAYBOOK)
        self.assertIn(
            "Only when that repair also fails has the review pass genuinely "
            "corrupted the design, and only then does the Phase 1 "
            "fresh-attempt recovery apply.",
            playbook,
        )

    def test_the_round_is_recorded_like_any_other_repair(self) -> None:
        playbook = flat(PLAYBOOK)
        self.assertIn(
            "Record the round in the run's friction file like any other "
            "repair.",
            playbook,
        )


if __name__ == "__main__":
    unittest.main()
