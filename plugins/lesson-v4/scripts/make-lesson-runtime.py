#!/usr/bin/env python3
"""Return one bounded make-lesson runtime slice from the retained playbook."""
from __future__ import annotations

import sys
from pathlib import Path


PLAYBOOK = (
    Path(__file__).resolve().parents[1]
    / "skills"
    / "make-lesson"
    / "playbook-lite.md"
)

SLICE_BOUNDS: dict[str, tuple[str, str | None]] = {
    "execution": (
        "## Lightweight execution protocol",
        "## Before Each Run: Know What Exists",
    ),
    "setup": (
        "## Before Each Run: Know What Exists",
        "## Phase 1 — Run the Lesson Designer (Sequential, Blocking)",
    ),
    "design": (
        "## Phase 1 — Run the Lesson Designer (Sequential, Blocking)",
        "## Phase 1.25 — Review the Design (Sequential, Blocking)",
    ),
    "design-review": (
        "## Phase 1.25 — Review the Design (Sequential, Blocking)",
        "## Phase 1.5 — Helper Check (Before Spawning Any Renderer)",
    ),
    "helpers": (
        "## Phase 1.5 — Helper Check (Before Spawning Any Renderer)",
        "## Phase 2 — Spawn Parallel Rendering Branches",
    ),
    "phase2-core": (
        "## Phase 2 — Spawn Parallel Rendering Branches",
        "### Track A — Slides (slide-designer + the picture stage → fixed slide build)",
    ),
    "slides-design": (
        "### Track A — Slides (slide-designer + the picture stage → fixed slide build)",
        "**The picture stage** - only when Phase 2 resolved `PICTURE_STAGE: attempting`:",
    ),
    "pictures": (
        "**The picture stage** - only when Phase 2 resolved `PICTURE_STAGE: attempting`:",
        "**Track A trigger:**",
    ),
    "slides-finalize": (
        "**Track A trigger:**",
        "### Track B — Worksheets (adaptation-designer → merge gate → worksheet-designer → fixed worksheet build)",
    ),
    "worksheet-routing": (
        "### Track B — Worksheets (adaptation-designer → merge gate → worksheet-designer → fixed worksheet build)",
        "**Adaptation Designer** — if `adaptation-designer` exists AND the worksheet is a per-child sheet (not a shared frame, per the check just above):",
    ),
    "worksheet-adaptation": (
        "**Adaptation Designer** — if `adaptation-designer` exists AND the worksheet is a per-child sheet (not a shared frame, per the check just above):",
        "**Worksheet Designer** — launch whenever the role exists, reading",
    ),
    "worksheet-render": (
        "**Worksheet Designer** — launch whenever the role exists, reading",
        "### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)",
    ),
    "other-resources": (
        "### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)",
        "## Phase 3 — Service Each Branch as It Lands",
    ),
    "phase3": (
        "## Phase 3 — Service Each Branch as It Lands",
        "## Phase 3.5 — Visual Check and Repair (per artefact, as each build lands)",
    ),
    "visual-review": (
        "## Phase 3.5 — Visual Check and Repair (per artefact, as each build lands)",
        "### The focused owner-repair round",
    ),
    "focused-repair": (
        "### The focused owner-repair round",
        "### Deterministic final merge",
    ),
    "finalize-review": (
        "### Deterministic final merge",
        "## Phase 4 — Final Assembly and Report",
    ),
    "delivery": (
        "## Phase 4 — Final Assembly and Report",
        None,
    ),
}


# What becomes due when each slice's work is finished.
#
# A bounded slice used to end at its own `---` and say nothing about what
# followed, so the only record of the pipeline's shape was the skill's list of
# "load slice X immediately before Y" bullets. Those bullets are keyed on
# events - the first visual-review launch, the first Worksheet Designer job -
# that an orchestrator can only recognise once it already holds the slice
# naming them, which is circular. A host with a large accumulated context
# usually reconstructs the order anyway; a host reading strictly slice by slice
# runs the document top to bottom instead, so per-artefact review collapses
# into one batch at the end and a track whose next step sits in an unloaded
# slice simply stops. Naming the successor here puts it in the one component
# every host must call, and delivers it at the moment it is needed.
NEXT_STEPS: dict[str, tuple[str, ...]] = {
    "execution": (
        "Load `setup`: establish what this package ships and gather the brief.",
    ),
    "setup": (
        "Load `design` and run the Lesson Designer.",
    ),
    "design": (
        "Load `design-review` once the Lesson Designer has returned.",
    ),
    "design-review": (
        "Load `helpers` once a design is approved, before any renderer.",
    ),
    "helpers": (
        "Load `phase2-core` and open the rendering phase.",
    ),
    "phase2-core": (
        "Open all three rendering tracks now; they run concurrently, and"
        " starting one is not finishing this phase.",
        "Track A: load `slides-design`.",
        "Track B: load `worksheet-routing`.",
        "Tracks D-F: load `other-resources` for the working wall and the"
        " stick-in sheets.",
    ),
    "slides-design": (
        "Load `pictures` when the resolved state is"
        " `PICTURE_STAGE: attempting`; otherwise go straight to"
        " `slides-finalize`.",
    ),
    "pictures": (
        "Load `slides-finalize` once every picture assignment is terminal.",
    ),
    "slides-finalize": (
        "The deck is built. Load `visual-review` and start the deck's reviewer"
        " on this build now - do not hold it for the worksheet, wall or"
        " stick-in branches, which review independently.",
        "The other tracks continue in parallel; this slice ends Track A only.",
    ),
    "worksheet-routing": (
        "Per-child sheet: load `worksheet-adaptation`.",
        "Shared frame, or no Adaptation Designer: go straight to"
        " `worksheet-render`.",
    ),
    "worksheet-adaptation": (
        "Load `worksheet-render` and launch the Worksheet Designer. Adaptation"
        " produces `adaptation.md`, never a sheet, so a run that stops here"
        " has built no worksheet at all - including when adaptation was"
        " omitted or failed, which leaves the expected-range sheet still to"
        " be designed.",
    ),
    "worksheet-render": (
        "The worksheets are built. Load `visual-review` and start the"
        " worksheets reviewer on this build now, alongside any reviewer"
        " already running.",
    ),
    "other-resources": (
        "Each of these builds is reviewable on its own. As the wall build and"
        " the stick-in build are accepted, load `visual-review` and start that"
        " artefact's reviewer immediately.",
        "A track that ends with an empty spec earns no build and no reviewer;"
        " record it and carry on.",
    ),
    "phase3": (
        "Load `visual-review` for each artefact whose build has been accepted"
        " and is not yet under review.",
        "Load `finalize-review` only once every branch has settled.",
    ),
    "visual-review": (
        "Load `focused-repair` as soon as one finding needs an owner other"
        " than the reviewer.",
        "Load `finalize-review` when every artefact has reviewed and every"
        " blocking finding has a repair on record.",
    ),
    "focused-repair": (
        "Re-review the repaired artefact, then load `finalize-review` when"
        " nothing is left open.",
    ),
    "finalize-review": (
        "Load `delivery` for final assembly, the teacher report and sync.",
    ),
    "delivery": (
        "This is the last slice. The run ends with the teacher report.",
    ),
}


class RuntimeSliceError(ValueError):
    """Raised when a fixed runtime slice cannot be read safely."""


def extract_slice(data: bytes, start_text: str, end_text: str | None) -> bytes:
    start = start_text.encode("utf-8")
    start_count = data.count(start)
    if start_count != 1:
        raise RuntimeSliceError(
            f"start marker must occur exactly once: {start_text}"
        )

    start_index = data.index(start)

    if end_text is None:
        return data[start_index:]

    end = end_text.encode("utf-8")
    end_count = data.count(end)
    if end_count != 1:
        raise RuntimeSliceError(
            f"end marker must occur exactly once: {end_text}"
        )

    end_index = data.index(end)
    if end_index <= start_index:
        raise RuntimeSliceError(
            f"end marker occurs before start marker: {end_text}"
        )

    return data[start_index:end_index]


def render_next_block(name: str) -> bytes:
    """The successor steps this slice hands back, as a bounded trailer."""
    steps = NEXT_STEPS.get(name)
    if not steps:
        raise RuntimeSliceError(
            f"slice has no recorded successor: {name}"
        )
    lines = ["", "## NEXT: what this slice hands you", ""]
    lines.extend(f"- {step}" for step in steps)
    lines.append("")
    lines.append(
        "Load a named slice with `make-lesson-runtime.py --slice [name]`. This"
    )
    lines.append(
        "block is the pipeline's order of work, not optional commentary: a step"
    )
    lines.append(
        "named here is due, and a branch left unnamed by any NEXT block has"
    )
    lines.append(
        "ended. Where two steps are named, both are due unless one carries a"
    )
    lines.append(
        "condition this run does not meet."
    )
    lines.append("")
    return "\n".join(lines).encode("utf-8")


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)

    if len(args) != 2 or args[0] != "--slice":
        print(
            "Usage: python3 make-lesson-runtime.py --slice <name>",
            file=sys.stderr,
        )
        return 2

    name = args[1]
    bounds = SLICE_BOUNDS.get(name)
    if bounds is None:
        print(
            f"MAKE_LESSON_RUNTIME_ERROR: unknown slice: {name}",
            file=sys.stderr,
        )
        return 2

    try:
        data = PLAYBOOK.read_bytes()
    except OSError as exc:
        print(
            f"MAKE_LESSON_RUNTIME_ERROR: playbook unreadable: {exc}",
            file=sys.stderr,
        )
        return 2

    try:
        output = extract_slice(data, *bounds)
        trailer = render_next_block(name)
    except RuntimeSliceError as exc:
        print(f"MAKE_LESSON_RUNTIME_ERROR: {exc}", file=sys.stderr)
        return 2

    sys.stdout.buffer.write(output)
    sys.stdout.buffer.write(trailer)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
