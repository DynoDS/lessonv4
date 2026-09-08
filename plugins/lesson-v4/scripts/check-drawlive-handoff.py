#!/usr/bin/env python3
"""Check that a draw-live criteria reached the slide that shows its cue.

The lesson designer marks a criteria `drawLive: true` when it is worth building
live with the class and keeping up: a labelled set a later lesson assumes, or a
method children run across a sequence of lessons. The builder already draws the
flipchart in the corner of the green panel whenever a slide's criteria carries
`flipchart: true`, and the working wall already reproduces a flagged reference.
The one link with nothing watching it is the middle: the slide designer reading
the design's decision and setting the slide's flag.

That link had never carried anything. Across 31 designs between 25 August and
8 September 2026 `drawLive: true` appears in none, and the slide-designer role
did not mention the flag at all, so a design that had set it would have lost it
here anyway. The teacher wrote his own "how to exchange" reference on the
flipchart during the 1,000 more-or-less lesson, which is exactly the cue this
flag exists to offer in advance.

A missing cue is invisible in the built deck: nothing is wrong on the slide, the
suggestion simply never appears, and only the design says it should have. So the
check compares the two files rather than the deck.

Usage:
    python3 check-drawlive-handoff.py \\
        --lesson-design "[WORKING_DIR]/lesson-design.json" \\
        --spec "[WORKING_DIR]/lesson.json"

Exit codes:
    0  every draw-live criteria reaches at least one slide carrying its cue,
       and no slide claims the cue for a criteria the design did not mark
    1  a cue was lost or invented
    2  bad input
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


class HandoffError(ValueError):
    """Bad input: a file that cannot be read or is not the expected shape."""


def load(path: Path, label: str) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise HandoffError(f"cannot read the {label} at {path}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise HandoffError(f"the {label} at {path} is not valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise HandoffError(f"the {label} at {path} is not a JSON object")
    return data


def draw_live_ids(design: dict) -> list[str]:
    out = []
    for item in design.get("successCriteria") or []:
        if isinstance(item, dict) and item.get("drawLive") is True:
            out.append(str(item.get("id")))
    return out


def flipchart_flagged(node, path="") -> list[str]:
    """Every place in the spec that asks for the cue.

    The flag lives at slide level on the `*-sc` templates and on the `sc-panel`
    object elsewhere, so it is found by walking rather than by looking in one
    known place.
    """
    found = []
    if isinstance(node, dict):
        if node.get("flipchart") is True:
            found.append(path or "/")
        for key, value in node.items():
            found.extend(flipchart_flagged(value, f"{path}/{key}"))
    elif isinstance(node, list):
        for index, value in enumerate(node):
            found.extend(flipchart_flagged(value, f"{path}/{index}"))
    return found


def slides_for(spec: dict, criteria_id: str) -> list[int]:
    """Slide numbers whose `successCriteriaRefs` name this criteria."""
    out = []
    for number, slide in enumerate(spec.get("slides") or [], start=1):
        if not isinstance(slide, dict):
            continue
        refs = slide.get("successCriteriaRefs") or []
        if isinstance(refs, list) and criteria_id in [str(r) for r in refs]:
            out.append(number)
    return out


def slide_carries_cue(slide) -> bool:
    return bool(flipchart_flagged(slide))


def run(design_path: Path, spec_path: Path) -> int:
    design = load(design_path, "lesson design")
    spec = load(spec_path, "slide specification")
    slides = spec.get("slides")
    if not isinstance(slides, list):
        raise HandoffError(f"the slide specification at {spec_path} has no slides array")

    marked = draw_live_ids(design)
    failures = []

    for criteria_id in marked:
        showing = slides_for(spec, criteria_id)
        if not showing:
            failures.append(
                f"{criteria_id} is marked drawLive in the design but no slide "
                "references it, so its cue has nowhere to appear"
            )
            continue
        with_cue = [n for n in showing if slide_carries_cue(slides[n - 1])]
        if not with_cue:
            listed = ", ".join(str(n) for n in showing)
            failures.append(
                f"{criteria_id} is marked drawLive in the design but no slide "
                f"showing it sets flipchart: true (slides {listed}). Set it at "
                "slide level beside criteria on the *-sc templates, or on the "
                "sc-panel object elsewhere; the teacher never sees the "
                "suggestion otherwise"
            )

    # The other direction: a cue on a criteria the design did not mark tells the
    # teacher to keep something the lesson never judged worth keeping, and the
    # cue means less every time it appears without reason.
    if not marked:
        for location in flipchart_flagged(spec):
            failures.append(
                f"the specification sets flipchart: true at {location} but no "
                "criteria in the design is marked drawLive; the cue is the "
                "design's decision, not a presentation choice"
            )

    if failures:
        print("DRAWLIVE_HANDOFF_FAILED", file=sys.stderr)
        for line in failures:
            print(f"- {line}", file=sys.stderr)
        return 1

    print(f"DRAWLIVE_HANDOFF_OK {len(marked)}")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-design", required=True)
    parser.add_argument("--spec", required=True)
    args = parser.parse_args(argv)
    return run(Path(args.lesson_design), Path(args.spec))


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except HandoffError as exc:
        print(f"DRAWLIVE_HANDOFF_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
