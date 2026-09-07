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
after it, and asks three questions. A repair may move content to another zone,
split a beat across two slides, change the template, swap a helper for an
equivalent one, add furniture, or drop an optional decoration. What it may not
do is leave the resource holding fewer of the things children work from than it
held when it arrived.

**Did a content object disappear?** Counting the field each engine uses to say
what a thing IS needs no per-helper knowledge and cannot fall out of date.

**Did anything a child reads or works from disappear?** Counting containers is
not counting content. Delete one question from a ``questions`` helper's item
list, one row from a recording table, one summand from a number sentence, or
one counter denomination from a claim, and every container count stays exactly
where it was. So the words, values and identities themselves are counted too,
and a repair that ends holding fewer of them has changed the work.

**Is there still somewhere to write?** A repair may not fill a blank in, shrink
three lines to one, or turn a box the child was going to write in into a value
printed for them. Places to write are counted, and the count may not fall. This
is the one that catches a scaffold quietly becoming an answer.

    python3 check-repair-scope.py --before PATH --after PATH

Exit 0 and print ``REPAIR_SCOPE_OK`` when nothing was lost. Otherwise exit 1 and
name every content object that went missing, so one run reports the whole scope
change rather than one piece of it at a time.

What this cannot see: whether a response target that survived is still big
enough to write in, and whether a diagram that survived still draws the values
it claims. Those are physical questions about a rendered page, and they belong
to the final resource review, which looks at the delivered file.

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

# What a repair is FOR. These say where a thing sits and how big it is drawn,
# and changing them is the whole point of the round, so their values are not
# counted as content. Everything not on this list is treated as something a
# child reads or works from.
PRESENTATION_KEYS = {
    "layout",
    "orientation",
    "template",
    "variant",
    "aspect",
    "widthMm",
    "blankWidthMm",
    "imageHref",
    "startAt",
    "number",
    "showNumbers",
    "phase",
    "letters",
    "style",
    "notes",
}

# `parts` means two different things, and treating them alike loses content.
# On a row it is the proportional split of the width, which a repair owns. On a
# part-whole model it is the nodes themselves, and skipping those meant a blank
# part could be replaced by the answer with nothing objecting. The two are told
# apart by what is in them: a split is numbers, nodes are objects.
def is_width_split(value: object) -> bool:
    return isinstance(value, list) and all(
        isinstance(item, (int, float)) and not isinstance(item, bool) for item in value
    )


# Two names for one renderer. Choosing between them is a rendering decision, so
# a repair that swaps one for the other has changed nothing children can see.
# Anything not paired here is a different object and counts as one.
ALIASES = {"part-whole-money": "part-whole"}

# Sizes a repair may legitimately grow. A blank widened from four characters to
# six is a better sheet, and counting "4" as content would call it a loss - so
# these are read by the response-space census below instead, where growing is
# allowed and shrinking is not.
SIZING_KEYS = {"chars", "blankChars", "marks", "lines", "sentences", "cells"}

# Places a child writes, and how many each is worth. Counted rather than
# listed, because what matters is that the room did not go: three ruled lines
# becoming one is the same fault as a blank becoming a printed answer.
#
#   blank        one box, stated as a boolean
#   cells        a digit frame, one place per cell
#   lines        ruled lines under a prompt
#   sentences    a demand the engine turns into lines
#   answerLine   the single line under a coin strip
RESPONSE_COUNT_KEYS = ("cells", "lines", "sentences")
RESPONSE_FLAG_KEYS = ("blank", "answerLine")


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


def repeats_of(value: dict) -> int:
    """How many times a repeated group actually stands on the page.

    ``{"stack": {...}, "repeat": 6}`` is six blank record rows written once.
    Walked literally it counts as one, and a repair that quietly changed six to
    four would take two rows off the sheet with nothing objecting.
    """
    repeat = value.get("repeat")
    listed = value.get("stack", value.get("row"))
    if isinstance(listed, dict) and isinstance(repeat, int) and repeat > 0:
        return repeat
    return 1


def census(node: object) -> tuple[Counter, Counter, Counter]:
    """Three counts of one specification: objects, content, and room to write.

    One walk, because they have to see the same tree - including the same
    expansion of repeated groups - or a repair could satisfy one and break
    another without either noticing.
    """
    objects: Counter = Counter()
    content: Counter = Counter()
    response: Counter = Counter()

    ordered: Counter = Counter()

    def note_content(value: object) -> None:
        if isinstance(value, bool):
            return
        if isinstance(value, str):
            text = value.strip()
            if text:
                content[text] += 1
        elif isinstance(value, (int, float)):
            content[repr(value)] += 1

    # An order that carries meaning, recorded as an order rather than as a bag.
    #
    # "9 + 4,000 + 50 + 200" asks the child to recombine values that arrive out
    # of place-value order, and that IS the question: sorted into 4,000 + 200 +
    # 50 + 9 it becomes a different, easier one. The same goes for four digit
    # cards including two zeros, and for the denominations a claim's counters
    # show. A bag of values cannot tell any of those from a reordering.
    #
    # Only lists whose entries are all values are read this way. A list of
    # zones or of questions is a list of containers, and moving one of those is
    # a repair rather than a change to the work.
    def is_flat(item: object) -> bool:
        """A value, not a container.

        This is what separates "9 + 4,000 + 50 + 200" from a list of slide
        objects. Every entry of a value sequence is a value or a small flat
        record of one; the moment an entry holds its own list or object it is a
        container, and moving containers about is what a repair does.
        """
        if isinstance(item, bool):
            return False
        if isinstance(item, (str, int, float)):
            return True
        return isinstance(item, dict) and not any(
            isinstance(child, (dict, list)) for child in item.values()
        )

    BLANK = "[blank]"

    def printed_part(item: object) -> str:
        if not isinstance(item, dict):
            return str(item)
        for field in ("value", "text", "caption", "label"):
            if field in item and not isinstance(item[field], bool):
                printed = str(item[field]).strip()
                if printed:
                    return printed
        return BLANK

    def value_sequence(items: list) -> tuple | None:
        if len(items) < 2 or not all(is_flat(item) for item in items):
            return None
        out = [printed_part(item) for item in items]
        # Placeholders alone say nothing: four identical empty boxes are not an
        # order, and calling them one would report every legal edit as a loss.
        if all(part == BLANK for part in out):
            return None
        return tuple(out)

    def walk(value: object, times: int = 1) -> None:
        if isinstance(value, list):
            for item in value:
                walk(item, times)
            return
        if not isinstance(value, dict):
            return

        if value.get("kind") in OPTIONAL_PICTURE_KINDS:
            return

        times *= repeats_of(value)

        for field in DISCRIMINATORS:
            kind = value.get(field)
            if isinstance(kind, str) and kind:
                objects[f"{field}:{ALIASES.get(kind, kind)}"] += times

        # A stick-in piece names its figure as a bare string on ``visual``,
        # where a wall card uses ``visual`` for a nested object that carries its
        # own ``type``. Counting the string form here catches the first without
        # double-counting the second, which the walk below reaches anyway.
        visual = value.get("visual")
        if isinstance(visual, str) and visual:
            objects[f"visual:{visual}"] += times

        for key in RESPONSE_COUNT_KEYS:
            room = value.get(key)
            if isinstance(room, int) and not isinstance(room, bool) and room > 0:
                response["places to write"] += room * times
        for key in RESPONSE_FLAG_KEYS:
            if value.get(key) is True:
                response["places to write"] += times
        # A label a child writes on, said the way a label-diagram says it.
        if value.get("given") is False:
            response["places to write"] += times

        for key, child in value.items():
            if key in DECORATIVE_KEYS:
                continue
            if key in PRESENTATION_KEYS or key in SIZING_KEYS:
                continue
            if key == "parts" and is_width_split(child):
                continue
            if key in DISCRIMINATORS or key == "visual":
                # Already counted as an object, with a helper's aliases
                # resolved. Counting the name again here would call a legal
                # swap between two names for one renderer a lost word.
                if isinstance(child, (dict, list)):
                    walk(child, times)
                continue
            if isinstance(child, list):
                sequence = value_sequence(child)
                if sequence is not None:
                    ordered[f"{key}: {', '.join(sequence)}"] += times
                walk(child, times)
            elif isinstance(child, dict):
                walk(child, times)
            else:
                for _ in range(times):
                    note_content(child)

    walk(node)
    # An ordered run is content too: it is counted alongside the words and
    # values so one report names everything that changed.
    content.update(ordered)
    return objects, content, response


def content_types(node: object) -> Counter:
    """Kept for callers that only want the object count."""
    return census(node)[0]


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


# A long list of missing words is unreadable, and the first few are enough to
# find the change that caused them.
MOST_TO_NAME = 12


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Prove a repair preserved what children work from."
    )
    parser.add_argument("--before", required=True, help="The specification the repair received")
    parser.add_argument("--after", required=True, help="The specification the repair produced")
    args = parser.parse_args(argv)

    before, before_content, before_room = census(read_spec(Path(args.before), "--before"))
    after, after_content, after_room = census(read_spec(Path(args.after), "--after"))

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

    # Same containers, less in them. This is the case counting objects cannot
    # see: one question gone from a set, one row gone from a table, one summand
    # gone from a number sentence, one source gone from a comparison.
    missing = losses(before_content, after_content)
    if missing:
        print(
            f"REPAIR_SCOPE_FAILED: the same content objects are there, but "
            f"{len(missing)} thing(s) children read or work from are not:"
        )
        for line in missing[:MOST_TO_NAME]:
            print(f"  - {line}")
        if len(missing) > MOST_TO_NAME:
            print(f"  - ...and {len(missing) - MOST_TO_NAME} more")
        print(
            "A question, a supplied value, a source, a heading or a required "
            "word is not presentation. Put it back and repair the presentation "
            "around it. An honest change to what children are asked belongs to "
            "the lesson designer, not to this round."
        )
        return 1

    was_room = before_room["places to write"]
    now_room = after_room["places to write"]
    if now_room < was_room:
        print(
            "REPAIR_SCOPE_FAILED: the sheet has fewer places to write than it "
            f"arrived with: {was_room} before the repair, {now_room} after."
        )
        print(
            "  - A blank that has been filled in, a box that now prints a "
            "value, or ruled lines that have been cut all count here. The "
            "child still has to do the work; a repair changes where they do "
            "it, never whether."
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

    print(
        f"REPAIR_SCOPE_OK: {sum(after.values())} content object(s), "
        f"{sum(after_content.values())} thing(s) children read or work from and "
        f"{now_room} place(s) to write preserved"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
