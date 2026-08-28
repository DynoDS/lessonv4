"""Runs the builder's own guards as part of the suite people actually run.

The builder keeps five deterministic guards beside it under
``builder/scripts/``. Each one proves something a lesson depends on: that every
drawn helper is documented, that a figure declared for one surface is wired on
all of them, that a deck does not open asking to be repaired, that a slide which
failed to draw stops publication, and that the pictures a deck asks for are
really inside it.

They were reachable only through ``npm run check`` inside the builder folder,
which nothing else calls, so a guard could start failing and stay silent through
a full green test run. That is the opposite of what a guard is for. This runs
them where the rest of the suite runs, and skips rather than fails when Node is
not on the machine, because a missing toolchain is not a broken lesson.
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest

BUILDER = Path(__file__).resolve().parents[2] / "builder"

GUARDS = (
    "check-catalogue.js",
    "check-parity.js",
    "check-paragraph-props.js",
    "check-render-failures.js",
    "check-pictures.js",
    "check-vocab-visuals.js",
)


@pytest.mark.parametrize("guard", GUARDS)
def test_builder_guard_passes(guard: str) -> None:
    node = shutil.which("node")
    if node is None:
        pytest.skip("node is not installed on this machine")

    script = BUILDER / "scripts" / guard
    assert script.is_file(), f"builder guard is missing: {script}"

    result = subprocess.run(
        [node, str(script)],
        cwd=str(BUILDER),
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, (
        f"{guard} failed:\n{result.stdout}\n{result.stderr}"
    )
