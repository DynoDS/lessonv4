#!/usr/bin/env python3
"""Prove a repair changed how a resource looks, not what it asks children to do.

A repair round exists to fix presentation: a crowded zone, a template that will
not hold its content, a picture with no room. The owner running it is explicitly
barred from changing the task. Nothing checked that, and the gap has a cost on
the record: a slide called "Compare the objects" went into a repair carrying a
three-column, two-row recording table - one row per object - and came out
carrying a single column of boxes. The comparison, which was the whole slide,
had gone. Every deterministic check passed, because everything that remained fit
on the slide perfectly well.

So this compares the specification before the repair with the specification
after it, and asks one question: did a content object disappear? A repair may
move content to another zone, split a beat across two slides, change the
template, add furniture, or drop an optional decoration. What it may not do is
leave the resource holding fewer of the things children work from than it held
when it arrived.

    python3 check-repair-scope.py --before PATH --after PATH

Exit 0 and print ``REPAIR_SCOPE_OK`` when nothing was lost. Otherwise exit 1 and
name every content object that went missing, so one run reports the whole scope
change rather than one piece of it at a time.

Standard library only. Writes nothing.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

# The optional visual layer is allowed to disappear. It is decoration by
# definition - a drawing or emoji that earns its place only while there is room
# for it - so a repair that reclaims space by dropping one has done exactly what
# a repair is for. Every other content object is something a child reads, works
# from, or writes into.
OPTIONAL_PICTURE_KINDS = {"educational-svg", "emoji"}

# Whole subtrees that are decoration by position rather than by kind.
DECORATIVE_KEYS = {"decorations"}


# What each engine calls the field that says what a thing IS.
#
# This used to be ``type`` alone, on the stated grounds that ``type`` "is the
# discriminator every one of these engines uses". It is not, and the cost was
# that this check silently counted nothing on two of the four artefacts it
# guards. A worksheet specification names its content with ``helper`` and a
# stick-in piece names it with ``visual``; only slides use ``type``. So a
# worksheet handed to a focused repair could come back with two of its three
# sheets deleted and still print REPAIR_SCOPE_OK: 0 content object(s)
# preserved - which is what it did, on the real PSHE worksheet, when a repairer
# thought to test the check rather than trust it.
#
# A zero count is now a failure in its own right below, so a fifth engine
# arriving with a fifth field name cannot put this check quietly back to sleep.
DISCRIMINATORS = ("type", "helper")


def content_types(node: object) -> Counter:
    """Every content object in a specification, counted by what it is.

    Counting the discriminator needs no per-helper knowledge and cannot fall out
    of date as helpers are added.
    """
    counts: Counter = Counter()
    seen: set[int] = set()

    def walk(value: object) -> None:
        if isinstance(value, list):
            for item in value:
                walk(item)
            return
        if not isinstance(value, dict):
            return
        if id(value) in seen:
            return
        seen.add(id(value))

        if value.get("kind") in OPTIONAL_PICTURE_KINDS:
            return

        for field in DISCRIMINATORS:
            kind = value.get(field)
            if isinstance(kind, str) and kind:
                counts[f"{field}:{kind}"] += 1

        # A stick-in piece names its figure as a bare string on ``visual``,
        # where a wall card uses ``visual`` for a nested object that carries its
        # own ``type``. Counting the string form here catches the first without
        # double-counting the second, which the walk below reaches anyway.
        visual = value.get("visual")
        if isinstance(visual, str) and visual:
            counts[f"visual:{visual}"] += 1

        for key, child in value.items():
            if key in DECORATIVE_KEYS:
                continue
            walk(child)

    walk(node)
    return counts


def read_spec(path: Path, label: str) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"REPAIR_SCOPE_FAILED: {label} is not readable JSON: {exc}")


def losses(before: Counter, after: Counter) -> list[str]:
    reports = []
    for kind in sorted(before):
        was = before[kind]
        now = after.get(kind, 0)
        if now < was:
            reports.append(f"{kind}: {was} before the repair, {now} after")
    return reports


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Prove a repair preserved what children work from."
    )
    parser.add_argument("--before", required=True, help="The specification the repair received")
    parser.add_argument("--after", required=True, help="The specification the repair produced")
    args = parser.parse_args(argv)

    before = content_types(read_spec(Path(args.before), "--before"))
    after = content_types(read_spec(Path(args.after), "--after"))

    lost = losses(before, after)
    if lost:
        print(
            f"REPAIR_SCOPE_FAILED: {len(lost)} content object(s) did not survive "
            "the repair:"
        )
        for line in lost:
            print(f"  - {line}")
        print(
            "A repair changes how the work is shown, never what the work is. "
            "Put back what went missing and repair the presentation around it. "
            "If the honest fix really is to ask children to do something else, "
            "that is a design decision and belongs to the lesson designer, not "
            "to this round."
        )
        return 1

    # A check that counted nothing used to say OK, which is how this one slept
    # through every worksheet and stick-in repair it was meant to guard. Zero
    # content objects means the walker did not recognise this artefact, not that
    # the artefact is empty: a real specification always holds some.
    if not before:
        print(
            "REPAIR_SCOPE_FAILED: no content object was recognised in --before, "
            "so nothing could be compared."
        )
        print(
            "  - This check reads the field an engine uses to say what a thing "
            f"is ({', '.join(DISCRIMINATORS)}, or a string 'visual'). An "
            "artefact naming its content some other way needs that name adding "
            "here before this marker means anything."
        )
        return 1

    print(f"REPAIR_SCOPE_OK: {sum(after.values())} content object(s) preserved")
    return 0


if __name__ == "__main__":
    sys.exit(main())
