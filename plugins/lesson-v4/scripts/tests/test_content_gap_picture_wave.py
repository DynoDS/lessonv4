from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
RUNTIME = ROOT / "scripts" / "make-lesson-runtime.py"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ContentGapPictureWaveTests(unittest.TestCase):
    """A content gap found after the picture contract froze had no way out.

    On 30 August 2026 the Year 4 continents lesson blocked completely: the
    helper check answered "covered" because a map helper existed, the picture
    contract froze with no map photo on it, and when the slide designer
    discovered the helper's world asset omitted Antarctica it had no authority
    to add a picture requirement. The run's only moves were to build a pending
    helper and refuse to ship - while the picture pipeline's whole ladder
    (real search on Wikimedia and Unsplash, then authorised controlled
    generation with its visual checks) sat unused, because it only served
    pictures the design promised up front. The teacher's instruction: those
    sources are a rescue route too - a blocked lesson in the morning is the
    worse outcome.
    """

    def test_the_wave_exists_and_names_both_gap_signals(self) -> None:
        playbook = flat(PLAYBOOK)
        self.assertIn("The content-gap picture wave.", playbook)
        self.assertIn("`SLIDE_CONTENT_GAP` or `WORKSHEET_CONTENT_GAP`", playbook)

    def test_a_terminally_unsatisfied_picture_takes_the_wave_too(self) -> None:
        """The wave was scoped to helper gaps, so a lesson died of the other cause.

        On 3 September 2026 a Year 4 history lesson promised five archive
        photographs the approved sources do not hold. All five came back
        terminally `unsatisfied`, the focused slide and worksheet repairs
        correctly refused to invent the evidence their tasks read from, and the
        run reported "the Phase 3 helper-gap wave does not reopen these
        terminal filenames: these were already-authorised photographs, not
        missing helper depictions". The teacher got a working wall: no slides,
        no worksheet, no answer key. The signal has to be the trigger, or the
        cause becomes a reason to deliver nothing.
        """
        playbook = flat(PLAYBOOK)
        self.assertIn("The signal is the trigger, not the cause", playbook)
        self.assertIn(
            "a load-bearing picture the design promised that came back terminally "
            "`unsatisfied`",
            playbook,
        )
        self.assertIn(
            "an authorised photograph that never arrived is the same hole as a "
            "visual nobody requested",
            playbook,
        )

    def test_a_replacement_picture_never_reopens_the_spent_filename(self) -> None:
        """A spent filename is append-only, so the repair is a new one."""
        playbook = flat(PLAYBOOK)
        self.assertIn(
            "A replacement for a spent filename takes a new id and filename",
            playbook,
        )
        self.assertIn(
            "pitches the evidence at the level the teaching needs",
            playbook,
        )
        # Filling the hole with a generated photograph of a named real source
        # would be the lie authentic-real exists to refuse.
        self.assertIn("authenticity does not bend to fill the hole", playbook)

    def test_the_owner_repair_round_escalates_instead_of_excluding(self) -> None:
        """A resource owner refusing to invent evidence has diagnosed, not failed.

        Phase 3.5 told the owner to "re-point that one reference and keep the
        learning it was serving", which is impossible when the picture *was*
        the learning, and the run then excluded the resource on an honest
        refusal.
        """
        playbook = flat(PLAYBOOK)
        self.assertIn(
            "When re-pointing cannot keep the learning, the owner is the wrong "
            "repairer.",
            playbook,
        )
        self.assertIn(
            "it goes to the content-gap picture wave whenever it surfaces, "
            "never to exclusion",
            playbook,
        )

    def test_the_ladder_is_real_first_and_generation_is_checked(self) -> None:
        """Real sources lead; generated geography needs its check to pass."""
        playbook = flat(PLAYBOOK)
        self.assertIn(
            "real search up through Unsplash, Wikimedia, Openverse and the open web",
            playbook,
        )
        self.assertIn("authorised controlled generation with its visual checks", playbook)
        self.assertIn(
            "a real place's geography publishes only after its visual check "
            "confirms it",
            playbook,
        )

    def test_the_wave_reuses_the_provenance_machinery(self) -> None:
        """A rescue picture gets the same receipts as a promised one, or the
        provenance story ('every filename has at most two AI calls in its
        immutable ledger') stops being true."""
        playbook = flat(PLAYBOOK)
        self.assertIn("run the supplemental-wave mechanics over that snapshot", playbook)
        self.assertIn(
            "naming already-terminal filenames so nothing finished reopens",
            playbook,
        )

    def test_the_wave_is_bounded(self) -> None:
        """One rescue per run; a gap that survives it still excludes, and the
        pending helper is still built - the wave rescues a resource, it does
        not license retry loops."""
        playbook = flat(PLAYBOOK)
        self.assertIn("One wave per run", playbook)
        self.assertIn("the pending helper still built", playbook)

    def test_the_early_picture_route_names_its_reopening(self) -> None:
        """'Open here and closed after Phase 2' was read as final; the route
        must point at the one later reopening or the next orchestrator
        rediscovers the dead end."""
        self.assertIn(
            "It reopens exactly once more for a content gap a designer finds "
            "later: the content-gap picture wave in Phase 3.",
            flat(PLAYBOOK),
        )

    def test_the_wave_reaches_a_host_reading_slice_by_slice(self) -> None:
        """The runtime is loaded in bounded slices; a rule outside every
        slice reaches nobody."""
        result = subprocess.run(
            [sys.executable, str(RUNTIME), "--slice", "phase3"],
            capture_output=True,
            check=True,
        )
        slice_text = " ".join(result.stdout.decode("utf-8").split())
        self.assertIn("The content-gap picture wave.", slice_text)


if __name__ == "__main__":
    unittest.main()


class TheEssentialCheckSitsAtTheDecisionPointTests(unittest.TestCase):
    """The wave already covered this case and the run still never reached it.

    On 21 September 2026 five essential photographs came back terminal. Track A's
    reconcile says to re-point a dead filename and did, onto surviving pictures
    marked supporting context; the deck built clean and twelve of sixteen slides
    went to the teacher bare. The rule that would have stopped it lived four
    hundred lines away under a heading about a designer signal this path never
    emits. A rule is only read where the decision is made, so the exception now
    sits beside the reconcile it is an exception to, and ahead of every track.
    """

    def test_the_essential_check_runs_before_any_track_reconciles(self) -> None:
        playbook = flat(PLAYBOOK)
        self.assertIn("The essential ones first, before any track reconciles", playbook)
        self.assertIn("`essential: true`", playbook)
        self.assertIn("PICTURE_ESSENTIAL_LOST:", playbook)

    def test_the_check_precedes_the_reconcile_it_guards(self) -> None:
        """Order is the whole repair: after the reconcile it would be advice
        about a decision already taken."""
        playbook = flat(PLAYBOOK)
        check = playbook.index("The essential ones first, before any track reconciles")
        reconcile = playbook.index("Reconcile first: for any picture filename")
        self.assertLess(check, reconcile)

    def test_the_reconcile_names_its_exception(self) -> None:
        playbook = flat(PLAYBOOK)
        reconcile = playbook.index("Reconcile first: for any picture filename")
        after = playbook[reconcile:reconcile + 900]
        self.assertIn("This is for pictures the lesson can lose", after)
        self.assertIn("went to", after)

    def test_the_finalizer_announces_the_loss_where_it_happens(self) -> None:
        """Guidance that depends on somebody remembering to look is the shape
        that failed here, so the state says so itself."""
        source = (ROOT / "scripts" / "finalize-picture-assignment.py").read_text(
            encoding="utf-8"
        )
        self.assertIn("PICTURE_ESSENTIAL_LOST:", source)
        self.assertIn("content-gap picture wave", source)
