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
after it. A repair may move content to another zone, split a beat across two
slides, change the template, swap a helper for one of its own aliases, or drop
an optional decoration. What it may not do is change what the work is.

Five questions, and the last three exist because the first two were not enough.

**Did a content object disappear?** Counting the field each engine uses to say
what a thing IS needs no per-helper knowledge and cannot fall out of date.

**Did anything a child reads or works from disappear?** Counting containers is
not counting content. Delete one question from a ``questions`` helper's item
list, one row from a recording table, one summand from a number sentence, or
one counter denomination from a claim, and every container count stays exactly
where it was.

**Did words appear that nobody wrote upstream?** Preservation is not only about
loss. A repairer may not author child-facing wording, so a string that was not
in the specification when it arrived has no business being in it now - and the
one that matters is the helpful line explaining which of two claims is correct.
Repeating a string that was already there is a different thing and stays legal:
splitting one slide into two repeats its title.

**Did each case keep its own evidence and its own response?** The four above are
bags. A bag cannot tell the counters that belong to the first equation from the
counters that belong to the second, so exchanging them changes nothing it can
see, and the sheet then shows the wrong evidence under each claim. Each numbered
question, and each case inside a row of parallel cases, is therefore fingerprinted
on its own and the fingerprints are compared as a set. Moving one somewhere else
keeps its fingerprint; taking its evidence away does not.

**Did every one of them keep its room to write?** Totalled across a sheet, one
question can lose two ruled lines while another gains two. Counted against the
case it belongs to, it cannot. Targets, the characters they hold and the ruled
lines under them are three separate tallies, because a blank narrowed from
twelve characters to one is still a blank and still a place to write. Room is
kept out of the fingerprint itself and compared beside it, so that giving a
question MORE room stays what it should be: an improvement, not a change.

    python3 check-repair-scope.py --before PATH --after PATH

Exit 0 and print ``REPAIR_SCOPE_OK`` when nothing changed that should not have.
Otherwise exit 1 and name everything that did, so one run reports the whole
scope change rather than one piece of it at a time.

What this cannot see, and what therefore still belongs to the final resource
review of the delivered file: whether a response target that survived is big
enough to write in on paper, whether a diagram that survived actually draws the
values it claims, and whether two helpers that this file cannot know are
equivalent really are. A preserved identity on an unprintably small box is not
preservation, and no reading of the specification will say so.

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

# Sizes a repair may legitimately grow. Counting "4" as content would call a
# blank widened from four characters to six a lost word, so these are read by
# the room census instead, where growing is allowed and shrinking is not.
SIZING_KEYS = {"chars", "blankChars", "marks", "lines", "sentences", "cells"}

# Two names for one renderer. Choosing between them is a rendering decision, so
# a repair that swaps one for the other has changed nothing children can see.
# Anything not paired here is a different object and counts as one. This file
# cannot know which OTHER pairs of helpers are equivalent, and does not guess:
# an unlisted substitution reads as a loss, which sends a real judgement to a
# person rather than making it here.
ALIASES = {"part-whole-money": "part-whole"}


# `parts` means two different things, and treating them alike loses content. On
# a row it is the proportional split of the width, which a repair owns. On a
# part-whole model it is the nodes themselves, and skipping those meant a blank
# part could be replaced by the answer with nothing objecting. The two are told
# apart by what is in them: a split is numbers, nodes are objects.
def is_width_split(value: object) -> bool:
    return isinstance(value, list) and all(
        isinstance(item, (int, float)) and not isinstance(item, bool) for item in value
    )


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


def is_flat(item: object) -> bool:
    """A value, not a container.

    This is what separates "9 + 4,000 + 50 + 200" from a list of slide objects.
    Every entry of a value sequence is a value or a small flat record of one;
    the moment an entry holds its own object it is a container, and moving
    containers about is what a repair does.
    """
    if isinstance(item, bool):
        return False
    if isinstance(item, (str, int, float)):
        return True
    if isinstance(item, list):
        return all(
            isinstance(cell, (str, int, float)) and not isinstance(cell, bool)
            for cell in item
        )
    return isinstance(item, dict) and not any(
        isinstance(child, (dict, list)) for child in item.values()
    )


BLANK = "[blank]"


def printed_part(item: object) -> str:
    if isinstance(item, list):
        # One row of a table, kept whole, so two cells cannot swap rows
        # unnoticed while the bag of cell values stays identical.
        return " | ".join(str(cell) for cell in item)
    if not isinstance(item, dict):
        return str(item)
    for field in ("value", "text", "caption", "label"):
        if field in item and not isinstance(item[field], bool):
            printed = str(item[field]).strip()
            if printed:
                return printed
    return BLANK


def value_sequence(items: list) -> tuple | None:
    """An order that carries meaning, recorded as an order rather than as a bag.

    "9 + 4,000 + 50 + 200" asks the child to recombine values that arrive out of
    place-value order, and that IS the question: sorted into 4,000 + 200 + 50 + 9
    it becomes a different, easier one. The same goes for four digit cards
    including two zeros, for the rows of a results table, and for the
    denominations a claim's counters show.

    Only lists whose entries are all values are read this way. A list of zones
    or of questions is a list of containers, and moving one of those is a repair.
    """
    if len(items) < 2 or not all(is_flat(item) for item in items):
        return None
    out = [printed_part(item) for item in items]
    # Placeholders alone say nothing: four identical empty boxes are not an
    # order, and calling them one would report every legal edit as a loss.
    if all(part == BLANK for part in out):
        return None
    return tuple(out)


# ─── what a case is ──────────────────────────────────────────────────────
#
# A bag of content is blind to which evidence belongs to which claim. So the
# units that hold a case together are fingerprinted separately: a numbered
# question, and each member of a row of parallel cases, which is how two
# equations, three sources or four objects are laid out side by side.
#
# A fingerprint is everything inside that unit - its words, its values, its
# order and its room to write - so exchanging the counters under two claims
# changes both, while moving a whole question to another zone changes neither.


def is_case(value: dict, in_row: bool) -> bool:
    if value.get("question") is True:
        return True
    return in_row and any(
        key in value for key in ("helper", "type", "stack", "row")
    )


class Census:
    """Everything one specification holds, counted five ways in a single walk."""

    def __init__(self, node: object) -> None:
        self.objects: Counter = Counter()
        self.content: Counter = Counter()
        self.room: Counter = Counter()
        self.cases: Counter = Counter()
        # Room, keyed by the case that holds it, so a question cannot pay for
        # its neighbour's extra line with one of its own.
        self.case_room: Counter = Counter()
        self._walk(node)

    # ─── one node's own room to write ───
    @staticmethod
    def _room_of(value: dict, times: int) -> Counter:
        """Places to write, the characters they hold and the lines under them.

        Three tallies rather than one total, because they are three different
        units and a blank narrowed from twelve characters to one is still one
        blank. Aggregating them would let that narrowing pass.
        """
        found: Counter = Counter()
        cells = value.get("cells")
        if isinstance(cells, int) and not isinstance(cells, bool) and cells > 0:
            found["targets"] += times
            found["characters"] += cells * times
        for key in ("lines", "sentences"):
            room = value.get(key)
            if isinstance(room, int) and not isinstance(room, bool) and room > 0:
                found["targets"] += times
                found["ruled lines"] += room * times
        for key in ("blank", "answerLine"):
            if value.get(key) is True:
                found["targets"] += times
                chars = value.get("chars", value.get("blankChars"))
                if not isinstance(chars, int) or isinstance(chars, bool) or chars < 1:
                    chars = 4  # the helpers' own default for an unstated blank
                found["characters"] += chars * times
        # A label a child writes on, said the way a label-diagram says it.
        if value.get("given") is False:
            found["targets"] += times
        return found

    def _walk(self, value: object, times: int = 1, in_row: bool = False,
              case: Counter | None = None) -> None:
        if isinstance(value, list):
            for item in value:
                self._walk(item, times, in_row, case)
                if not isinstance(item, (dict, list)):
                    self._note(item, times, case)
            return
        if not isinstance(value, dict):
            return

        if value.get("kind") in OPTIONAL_PICTURE_KINDS:
            return

        times *= repeats_of(value)

        # A case opens its own fingerprint. Everything below it lands in that
        # fingerprint as well as in the whole-document bags, so a case can be
        # moved but not hollowed out.
        own = case
        if is_case(value, in_row):
            own = Counter()

        for field in DISCRIMINATORS:
            kind = value.get(field)
            if isinstance(kind, str) and kind:
                self.objects[f"{field}:{ALIASES.get(kind, kind)}"] += times

        # A stick-in piece names its figure as a bare string on ``visual``,
        # where a wall card uses ``visual`` for a nested object that carries its
        # own ``type``. Counting the string form here catches the first without
        # double-counting the second, which the walk below reaches anyway.
        visual = value.get("visual")
        if isinstance(visual, str) and visual:
            self.objects[f"visual:{visual}"] += times

        room = self._room_of(value, times)
        self.room.update(room)
        if own is not None:
            own["#room"] += 0  # so a case with no room still has an entry
            for tally, count in room.items():
                own[f"#room:{tally}"] += count

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
                    self._walk(child, times, False, own)
                continue
            if isinstance(child, list):
                sequence = value_sequence(child)
                if sequence is not None:
                    self._note_key(key, ", ".join(sequence), times, own)
                self._walk(child, times, key == "row", own)
            elif isinstance(child, dict):
                self._walk(child, times, key == "row", own)
            else:
                self._note(child, times, own)

        if own is not case and own is not None:
            # Identity is what the case SAYS; room is what it gives the child
            # to say it in. Kept apart, because a repair may hand a question
            # another ruled line and must not hand it another value.
            said = {k: v for k, v in own.items() if not k.startswith("#room")}
            fingerprint = self._fingerprint(said)
            self.cases[fingerprint] += 1
            for key, count in own.items():
                if key.startswith("#room:"):
                    self.case_room[f"{fingerprint} :: {key[6:]}"] += count
            if case is not None:
                # A case inside a case still counts towards the outer one, or a
                # question could lose a whole claim and keep its fingerprint.
                case.update(own)

    @staticmethod
    def _fingerprint(said: dict) -> str:
        return " ; ".join(f"{k}x{v}" for k, v in sorted(said.items()))

    def _note(self, value: object, times: int, case: Counter | None) -> None:
        if isinstance(value, bool):
            return
        if isinstance(value, str):
            text = value.strip()
            if not text:
                return
            key = text
        elif isinstance(value, (int, float)):
            key = repr(value)
        else:
            return
        self.content[key] += times
        if case is not None:
            case[key] += times

    def _note_key(self, key: str, text: str, times: int, case: Counter | None) -> None:
        entry = f"{key}: {text}"
        self.content[entry] += times
        if case is not None:
            case[entry] += times


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


def additions(before: Counter, after: Counter) -> list[str]:
    """Words that were not in the specification when the repair received it.

    A repairer may not author child-facing wording, so a string nobody wrote
    upstream has no business appearing here. Repeating a string that was already
    present is a different thing and stays legal: splitting one slide into two
    repeats its title, and that is the structural fix a repair is for.
    """
    return [str(kind) for kind in sorted(after) if kind not in before]


# A long list of missing words is unreadable, and the first few are enough to
# find the change that caused them.
MOST_TO_NAME = 12


def report(headline: str, lines: list[str], advice: str) -> None:
    print(headline)
    for line in lines[:MOST_TO_NAME]:
        print(f"  - {line}")
    if len(lines) > MOST_TO_NAME:
        print(f"  - ...and {len(lines) - MOST_TO_NAME} more")
    print(advice)


CHANGED_WORK = (
    "A repair changes how the work is shown, never what the work is. Put back "
    "what went missing and repair the presentation around it. If the honest fix "
    "really is to ask children to do something else, that is a design decision "
    "and belongs to the lesson designer, not to this round."
)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Prove a repair preserved what children work from."
    )
    parser.add_argument("--before", required=True, help="The specification the repair received")
    parser.add_argument("--after", required=True, help="The specification the repair produced")
    args = parser.parse_args(argv)

    before = Census(read_spec(Path(args.before), "--before"))
    after = Census(read_spec(Path(args.after), "--after"))

    lost = losses(before.objects, after.objects)
    if lost:
        report(
            f"REPAIR_SCOPE_FAILED: {len(lost)} content object(s) did not survive "
            "the repair:",
            lost,
            CHANGED_WORK,
        )
        return 1

    # Same containers, less in them. This is the case counting objects cannot
    # see: one question gone from a set, one row gone from a table, one summand
    # gone from a number sentence, one source gone from a comparison.
    missing = losses(before.content, after.content)
    if missing:
        report(
            "REPAIR_SCOPE_FAILED: the same content objects are there, but "
            f"{len(missing)} thing(s) children read or work from are not:",
            missing,
            "A question, a supplied value, a source, a heading or a required "
            "word is not presentation. Put it back and repair the presentation "
            "around it. An honest change to what children are asked belongs to "
            "the lesson designer, not to this round.",
        )
        return 1

    added = additions(before.content, after.content)
    if added:
        report(
            f"REPAIR_SCOPE_FAILED: {len(added)} thing(s) a child reads are new "
            "since the repair began:",
            added,
            "Nothing here writes words for children. A line that tells them "
            "which answer is right, a label that classifies a source, or a "
            "value printed where one was to be worked out all change the task "
            "even though nothing was taken away. Repeating wording that was "
            "already in the specification is fine; inventing it is not.",
        )
        return 1

    # Each case keeps its own evidence and its own room. Two claims can hold the
    # same counters between them and still be wrong about which set belongs to
    # which, and no bag of content can tell.
    rearranged = losses(before.cases, after.cases)
    if rearranged:
        report(
            f"REPAIR_SCOPE_FAILED: {len(rearranged)} question(s) or case(s) no "
            "longer hold what they held:",
            [line.split(":")[0][:110] + " ..." for line in rearranged],
            "Something moved between cases rather than moving as a case. The "
            "evidence for one claim, the response under one source, the values "
            "in one model: each belongs to its own question, and a repair moves "
            "the whole thing or nothing.",
        )
        return 1

    short = losses(before.case_room, after.case_room) + losses(before.room, after.room)
    if short:
        report(
            "REPAIR_SCOPE_FAILED: there are fewer places to write, or less "
            "room in them, than when the repair began:",
            [line if len(line) < 120 else line[:110] + " ..." for line in short],
            "A blank that has been filled in, a box that now prints a value, a "
            "blank narrowed until the answer will not fit, or ruled lines that "
            "have been cut all count here. The child still has to do the work; "
            "a repair changes where they do it, never whether.",
        )
        return 1

    # A check that counted nothing used to say OK, which is how this one slept
    # through every worksheet and stick-in repair it was meant to guard. Zero
    # content objects means the walker did not recognise this artefact, not that
    # the artefact is empty: a real specification always holds some.
    if not before.objects:
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
        f"REPAIR_SCOPE_OK: {sum(after.objects.values())} content object(s), "
        f"{sum(after.content.values())} thing(s) children read or work from, "
        f"{sum(after.cases.values())} question(s) or case(s) intact and "
        f"{after.room['targets']} place(s) to write preserved"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
