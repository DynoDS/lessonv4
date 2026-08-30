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

    def test_the_ladder_is_real_first_and_generation_is_checked(self) -> None:
        """Real sources lead; generated geography needs its check to pass."""
        playbook = flat(PLAYBOOK)
        self.assertIn("real search on Wikimedia and Unsplash", playbook)
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
