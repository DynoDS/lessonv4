#!/usr/bin/env python3
"""Return one bounded make-lesson runtime slice from the retained playbook."""
from __future__ import annotations

import sys
from pathlib import Path


PLAYBOOK = (
    Path(__file__).resolve().parents[1]
    / "skills"
    / "make-lesson"
    / "playbook.md"
)

SLICE_BOUNDS: dict[str, tuple[str, str | None]] = {
    "controller": (
        "## Internal orchestration controller",
        "## Worker context isolation",
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
        "**The picture stage** — if `[WORKING_DIR]/photo-requirements.json` has a non-empty `photos` array:",
    ),
    "pictures": (
        "**The picture stage** — if `[WORKING_DIR]/photo-requirements.json` has a non-empty `photos` array:",
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
        "**Worksheet Designer** — if `worksheet-designer` exists AND either:",
    ),
    "worksheet-render": (
        "**Worksheet Designer** — if `worksheet-designer` exists AND either:",
        "### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)",
    ),
    "other-resources": (
        "### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)",
        "## Phase 3 — Wait for All Branches",
    ),
    "phase3": (
        "## Phase 3 — Wait for All Branches",
        "## Phase 3.5 — Visual Check and Repair (after all builders, before the report and sync)",
    ),
    "visual-review": (
        "## Phase 3.5 — Visual Check and Repair (after all builders, before the report and sync)",
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
    except RuntimeSliceError as exc:
        print(f"MAKE_LESSON_RUNTIME_ERROR: {exc}", file=sys.stderr)
        return 2

    sys.stdout.buffer.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
