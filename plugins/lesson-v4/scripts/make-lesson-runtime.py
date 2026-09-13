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
        "## Phase 3.5 — The Focused Owner-Repair Round",
    ),
    "focused-repair": (
        "## Phase 3.5 — The Focused Owner-Repair Round",
        "## Phase 3.6 - Finalisation",
    ),
    "finalize": (
        "## Phase 3.6 - Finalisation",
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
# events - the first Worksheet Designer job, the first repair round - that an
# orchestrator can only recognise once it already holds the slice naming them,
# which is circular. A host with a large accumulated context usually
# reconstructs the order anyway; a host reading strictly slice by slice runs the
# document top to bottom instead, and a track whose next step sits in an
# unloaded slice simply stops. Naming the successor here puts it in the one
# component every host must call, and delivers it at the moment it is needed.
#
# Every track can reach `focused-repair`, because the mapping from a named owner
# to its compact repair role lives only there, and each track raises its own
# build and picture faults without ever loading a sibling's slice.
#
# Every track also ends at `phase3`, and that route was missing. No block named
# it, and `finalize` is reachable only through it, so by this table's own rule -
# a branch no NEXT block names has ended - the run ended when its last track
# did, with nothing to prove the pictures, write the report or file the
# lesson. Hosts carrying a large context inferred the rest and finished anyway,
# which is exactly why the hole survived: the failure it produced was not a
# missing report but a slower run, because the servicing discipline that keeps
# branches from serialising also lived behind that unnamed door.
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
        "These three are reference for whichever track has just landed, not a"
        " running order. Service a returned worker as soon as it returns; a"
        " track read to its end while a sibling's finished work waits is a"
        " branch serialised for nothing.",
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
        "The deck is built. Track A ends here; nothing downstream compares it"
        " to another resource, and nothing looks at it again.",
        "Load `focused-repair` for a build diagnostic or a terminally"
        " unavailable picture reference.",
        "The other tracks continue in parallel; this slice ends Track A only.",
        "Return to any track with work waiting; load `phase3` when all have"
        " ended.",
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
        "The worksheets are built. Track B ends here.",
        "Load `focused-repair` for a build diagnostic or a terminally"
        " unavailable picture reference.",
        "Return to any track with work waiting; load `phase3` when all have"
        " ended.",
    ),
    "other-resources": (
        "Each of these builds settles on its own. Track D ends when the wall"
        " builder returns its evidence result; Track F ends when the stick-in"
        " build is accepted.",
        "Load `focused-repair` for a build diagnostic on either.",
        "A track that ends with an empty spec earns no build; record it and"
        " carry on.",
        "Return to any track with work waiting; load `phase3` when all have"
        " ended.",
    ),
    "phase3": (
        "Load `focused-repair` for any branch whose deterministic check named"
        " a fault its owner can repair.",
        "Load `finalize` only once every branch has settled - built and"
        " checked, or excluded with its reason.",
    ),
    "focused-repair": (
        "Rebuild that one resource and rerun its own check. That rerun is the"
        " confirmation; return to the track the fault came from.",
    ),
    "finalize": (
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
