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

**Did words appear on the child's page that were not on it before?** A repairer
may not author child-facing wording, so a string that was not in front of
children when the repair began has no business being there now - and the two
that matter are the helpful line explaining which of two claims is correct, and
the answer lifted out of the teacher's key. The teacher's channel and the authoring metadata are
counted apart from the pupil's for exactly that reason: the document already
held the words, and the child did not. Repeating a string that was already on the
page is a different thing and stays legal: splitting one slide into two repeats
its title.

**Did each case keep its own evidence and its own response?** The four above are
bags. A bag cannot tell the counters that belong to the first equation from the
counters that belong to the second, so exchanging them changes nothing it can
see, and the sheet then shows the wrong evidence under each claim. So the units
that bind a case together are fingerprinted on their own and compared as a set.
What counts as one is decided by what a node IS rather than by what wraps it -
see `Census` below, which explains why, and what it cost to learn.

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
    # How much of a stack or row a child's content is given. It is the share of
    # the space, not the content, and re-dividing the space is what a
    # composition repair IS. Counted as content, the numbers had to survive as a
    # multiset, so a repair could move a figure into a taller zone only by
    # finding somewhere else to put the number it used to have: the Year 4
    # History run rearranged a slide around that constraint rather than around
    # the slide (7 September 2026). Every value a child actually reads is
    # counted somewhere else in this file, so releasing these loses no cover.
    "weight",
    "weights",
    "flex",
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
    if item is None:
        return True
    if isinstance(item, (str, int, float)):
        return True
    if isinstance(item, list):
        # A table row whose response cells are null is still a row of values.
        # Excluding it left every part-completed recording table unordered.
        return all(
            cell is None
            or (isinstance(cell, (str, int, float)) and not isinstance(cell, bool))
            for cell in item
        )
    return isinstance(item, dict) and not any(
        isinstance(child, (dict, list)) for child in item.values()
    )


BLANK = "[blank]"


def printed_part(item: object) -> str:
    if item is None:
        return BLANK
    if isinstance(item, list):
        # One row of a table, kept whole, so two cells cannot swap rows
        # unnoticed while the bag of cell values stays identical. A null cell
        # is the child's own space and is written out, so a row cannot quietly
        # trade its blanks for the row above's given words.
        return " | ".join(BLANK if cell is None else str(cell) for cell in item)
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
# A bag of content is blind to which evidence belongs to which claim, so the
# units that bind a case together are fingerprinted separately. The first
# version of this decided that by looking at the wrapper - a child of a `row`
# was a case - and a wrapper is presentation. Two consequences, both wrong in
# opposite directions: two questions inside one `written-answers` helper were
# not cases at all, so one could take the other's ruled lines; and moving two
# intact claims from a row into a stack destroyed both fingerprints and was
# reported as a loss.
#
# So a node is a case because of what it IS:
#
#   1. it says so - `question: true`;
#   2. it BINDS - its subtree holds both something to read and somewhere to
#      write, and no smaller part of it does. This is the numbered item inside
#      a helper, the part node with its caption, the claim with its evidence;
#   3. it holds a case AND content of its own that sits outside every case in
#      it. That is a claim whose evidence is beside its response rather than
#      inside it, and it is what catches evidence swapped between two claims.
#
# A layout slot is never a case on rules 2 and 3. A zone holds whatever the
# page put there, and moving a question between zones is the repair itself.
LAYOUT_SLOT_KEYS = {"zones", "sheets", "slides", "pages"}

# A specification carries three audiences and they are counted apart, because
# "has a child seen this word before?" is the question the additions check is
# actually asking and every channel mixed into one answers it wrongly.
#
# The teacher's channel: answers, acceptance conditions and marking notes. Real
# content that must survive, and not on the child's page. Counted apart so that
# copying an answer out of the key and onto a pupil instruction reads as what it
# is - a string that is new to the child, even though the document already
# contained it.
TEACHER_KEYS = {
    "answerKey",
    "answers",
    "answer",
    "acceptanceCondition",
    "lookFor",
    "teacherInfo",
    "onTheBoard",
}

# The authoring channel: what the build needs to know, as opposed to what it
# prints. `meta.yearGroup` picks the height of a ruled line and never appears on
# paper - and while it was counted as something a child had read, a worksheet
# for Year 4 could have the teacher answer `4` copied onto the page and the
# addition read as a repeat. The digit was in the file. It was not in front of
# the class.
METADATA_KEYS = {"meta", "metadata"}

# The teacher's spoken script. It is never on the child's page, and it is the one
# content field a repair is routinely REQUIRED to add to: the orientation a
# design review asks for is prepended to the notes that are already there.
# Counted as an ordinary string, the whole note is one census item, so inserting
# a sentence at the top reads as the entire original note being deleted and a
# different one authored - which is exactly what the Find 1,000 more/less run
# was told on 8 September 2026 while its byte diff showed only the insertion.
# So these are compared by CONTAINMENT below rather than by equality: the script
# that was there has to still be there, and a repair may add to it.
SCRIPT_KEYS = {"speakerNotes"}

# Except for the fields the renderer genuinely prints from it. Blanket-ignoring
# metadata would be the same mistake pointed the other way: `worksheet.js` falls
# back to `meta.lesson` or `meta.name` for the sheet's title and to `meta.lo`
# for the objective printed at the top of the page, so those ARE the child's.
PRINTED_METADATA_FIELDS = {"lo", "lesson", "name", "title"}

# Helpers whose `items` each own a response, and how many ruled lines an item
# gets when it does not say. Named because the renderer names them:
# `isNumberPrintingSet` in `worksheet-html/src/worksheet.js` numbers exactly
# these two, a `questions` item answers on its own line, and `writingLinesFor`
# gives a `written-answers` item three lines when it states none.
#
# Without this a plain question set looked like a page with nothing to answer on
# it: no response target, and therefore no task binding anything to anything.
RESPONSE_SET_HELPERS = {"questions": 0, "written-answers": 3}


def channel_of(channel: str, key: str) -> str:
    """Which audience the value under this key belongs to.

    Once inside the teacher's copy everything below stays there. Metadata is the
    same, except that the handful of fields the renderer prints from it climb
    back out onto the child's page.
    """
    if channel == "teacher" or key in TEACHER_KEYS:
        return "teacher"
    if key in METADATA_KEYS:
        return "metadata"
    if channel == "metadata":
        return "pupil" if key in PRINTED_METADATA_FIELDS else "metadata"
    return channel


class Census:
    """Everything one specification holds, counted in a single walk."""

    def __init__(self, node: object) -> None:
        self.objects: Counter = Counter()
        self.content: Counter = Counter()
        self.teacher: Counter = Counter()
        self.script: list[str] = []
        self.metadata: Counter = Counter()
        self.room: Counter = Counter()
        self.cases: Counter = Counter()
        # Room, keyed by the case that holds it, so a question cannot pay for
        # its neighbour's extra line with one of its own.
        self.case_room: Counter = Counter()
        # Every ordered value sequence, in the order the walk met it, so a
        # sequence split over consecutive containers can be recognised whole.
        self.sequences: list[tuple[str, str, tuple, int]] = []
        self._visit(node, 1, False, "pupil")

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

    @staticmethod
    def _implicit_room_of(value: object, times: int,
                          default_lines: int | None) -> Counter:
        """An item's effective room when its helper supplies the default.

        Resolve this on the item, not on the containing helper. Otherwise an
        omitted default belongs to one group case while the equivalent explicit
        value belongs to each individual question, changing the case identity
        even though the rendered work has not changed.
        """
        found: Counter = Counter()
        if default_lines is None:
            return found
        if isinstance(value, dict) and any(
            isinstance(value.get(key), int)
            and not isinstance(value.get(key), bool)
            and value.get(key) > 0
            for key in ("lines", "sentences")
        ):
            return found
        found["targets"] += times
        if default_lines:
            found["ruled lines"] += default_lines * times
        return found

    def _visit(self, value: object, times: int, in_slot: bool, channel: str,
               implicit_lines: int | None = None):
        """Walk one node.

        Returns what the subtree holds that is NOT already inside a case:
        (content, room, holds_a_case). The parent needs that to answer rule 3 -
        does it have evidence of its own beside the case it contains?
        """
        free: Counter = Counter()
        free_room: Counter = Counter()
        holds_case = False

        if isinstance(value, list):
            for item in value:
                if isinstance(item, (dict, list)):
                    sub, sub_room, sub_case = self._visit(
                        item, times, in_slot, channel, implicit_lines
                    )
                    free.update(sub)
                    free_room.update(sub_room)
                    holds_case = holds_case or sub_case
                else:
                    self._note(item, times, free, channel)
                    item_room = self._implicit_room_of(item, times, implicit_lines)
                    self.room.update(item_room)
                    free_room.update(item_room)
                    # A null cell in a table row is a place to write, and it is
                    # the only shape of response target that carries no key of
                    # its own. Left uncounted, a table's blanks could be moved
                    # to other rows or removed with the words intact.
                    if item is None:
                        self.room["targets"] += times
                        free_room["targets"] += times
            return free, free_room, holds_case

        if not isinstance(value, dict):
            return free, free_room, holds_case

        if value.get("kind") in OPTIONAL_PICTURE_KINDS:
            return free, free_room, holds_case

        times *= repeats_of(value)

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

        own: Counter = Counter()
        own_room = self._room_of(value, times)
        own_room.update(self._implicit_room_of(value, times, implicit_lines))
        self.room.update(own_room)

        kind = value.get("helper") or value.get("type")
        item_default = RESPONSE_SET_HELPERS.get(kind)

        for key, child in value.items():
            if key in DECORATIVE_KEYS:
                continue
            if key in SCRIPT_KEYS:
                if isinstance(child, str) and child.strip():
                    self.script.append(child.strip())
                continue
            if key in PRESENTATION_KEYS or key in SIZING_KEYS:
                continue
            if key == "parts" and is_width_split(child):
                continue
            child_channel = channel_of(channel, key)
            if key in DISCRIMINATORS or key == "visual":
                # Already counted as an object, with a helper's aliases
                # resolved. Counting the name again here would call a legal
                # swap between two names for one renderer a lost word.
                if isinstance(child, (dict, list)):
                    sub, sub_room, sub_case = self._visit(
                        child, times, False, child_channel
                    )
                    own.update(sub)
                    own_room.update(sub_room)
                    holds_case = holds_case or sub_case
                continue
            if isinstance(child, (dict, list)):
                if isinstance(child, list):
                    sequence = value_sequence(child)
                    if sequence is not None:
                        self._note_key(key, ", ".join(sequence), times, own, child_channel)
                        self.sequences.append((child_channel, key, sequence, times))
                sub, sub_room, sub_case = self._visit(
                    child, times, key in LAYOUT_SLOT_KEYS, child_channel,
                    item_default if key == "items" else None,
                )
                own.update(sub)
                own_room.update(sub_room)
                holds_case = holds_case or sub_case
            else:
                self._note(child, times, own, child_channel)

        # Rule 1 outranks the slot rule: a zone that IS a numbered question is a
        # question, whatever it is standing in.
        explicit = value.get("question") is True
        # Rule 2: it binds, and nothing smaller inside it does.
        binds = (not holds_case) and bool(own) and bool(own_room)
        # Rule 3: it holds a case, and evidence of its own beside it.
        beside = holds_case and bool(own)
        is_case = explicit or (not in_slot and (binds or beside))

        if is_case:
            fingerprint = self._fingerprint(own)
            self.cases[fingerprint] += 1
            for tally, count in own_room.items():
                self.case_room[f"{fingerprint} :: {tally}"] += count
            # Everything here is now accounted for by this case, so the parent
            # does not see it as loose content of its own.
            return Counter(), Counter(), True

        return own, own_room, holds_case

    @staticmethod
    def _fingerprint(said: Counter) -> str:
        return " ; ".join(f"{k}x{v}" for k, v in sorted(said.items()))

    def _note(self, value: object, times: int, free: Counter, channel: str) -> None:
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
        if channel == "teacher":
            self.teacher[key] += times
            return
        if channel == "metadata":
            self.metadata[key] += times
            return
        self.content[key] += times
        free[key] += times

    def _note_key(self, key: str, text: str, times: int, free: Counter,
                  channel: str) -> None:
        entry = f"{key}: {text}"
        if channel == "teacher":
            self.teacher[entry] += times
            return
        if channel == "metadata":
            self.metadata[entry] += times
            return
        self.content[entry] += times
        free[entry] += times


def read_spec(path: Path, label: str) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"REPAIR_SCOPE_FAILED: {label} is not readable JSON: {exc}")


def script_losses(before: list[str], after: list[str]) -> list[str]:
    """Teacher scripts that did not survive, allowing for an insertion.

    A note survives when the whole of it is still readable inside one of the
    notes the repair produced. That keeps the guarantee that matters - nobody
    may quietly drop or reword the teacher's script - while letting a repair do
    the one thing it is regularly asked to do, which is add a sentence to the
    front of it. Each surviving note is claimed once, so two notes cannot both
    be discharged by the same after-note.
    """
    remaining = list(after)
    lost = []
    for note in before:
        for index, candidate in enumerate(remaining):
            if note in candidate:
                remaining.pop(index)
                break
        else:
            lost.append(note)
    return lost


def rejoin_split_sequences(before: "Census", after: "Census") -> None:
    """Treat an ordered sequence split over consecutive containers as unchanged.

    The steps of a worked example are an ordered sequence, and their order is
    protected like the order of a number sentence's summands. But a card too tall
    for its page keeps every word when its steps go on two cards, first steps on
    the first, and reading the list as one chain that vanished refused exactly
    that repair on the 14 September 2026 cloud run. So when a sequence is missing
    after the repair and the next sequences under the same key, in order, join
    back into it exactly, the pieces stand for the original. Reordered, dropped
    or added values do not join back, so they are still reported.
    """
    for channel, key, whole, times in before.sequences:
        entry = f"{key}: {', '.join(whole)}"
        wanted = before.content[entry] if channel == "pupil" else 0
        if channel != "pupil" or after.content.get(entry, 0) >= wanted:
            continue
        pieces = [(i, seq, t) for i, (c, k, seq, t) in enumerate(after.sequences) if c == channel and k == key]
        for start in range(len(pieces)):
            joined: tuple = ()
            used = []
            for index, seq, t in pieces[start:]:
                if t != times or tuple(whole[len(joined):len(joined) + len(seq)]) != seq:
                    break
                joined += seq
                used.append(seq)
                if joined == whole:
                    break
            if joined == whole and len(used) > 1:
                after.content[entry] += times
                for seq in used:
                    piece = f"{key}: {', '.join(seq)}"
                    after.content[piece] -= times
                    if after.content[piece] <= 0:
                        del after.content[piece]
                break


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

    rejoin_split_sequences(before, after)

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

    lost_meta = losses(before.metadata, after.metadata)
    if lost_meta:
        report(
            f"REPAIR_SCOPE_FAILED: {len(lost_meta)} piece(s) of the "
            "specification's own authoring data did not survive the repair:",
            lost_meta,
            "A year group sizes the ruled lines, a subject routes the sheet, a "
            "lesson name titles it. None of them is decoration.",
        )
        return 1

    lost_teacher = losses(before.teacher, after.teacher)
    if lost_teacher:
        report(
            f"REPAIR_SCOPE_FAILED: {len(lost_teacher)} teacher answer(s) or "
            "marking note(s) did not survive the repair:",
            lost_teacher,
            "The teacher's copy is content too. A question with no answer "
            "beside it is a question nobody can mark.",
        )
        return 1

    lost_script = script_losses(before.script, after.script)
    if lost_script:
        report(
            f"REPAIR_SCOPE_FAILED: {len(lost_script)} teacher script(s) did not "
            "survive the repair:",
            [note[:110] + (" ..." if len(note) > 110 else "") for note in lost_script],
            "Speaker notes are the teacher's own words for delivering the "
            "lesson. A repair may add to a note - an approved orientation goes "
            "at the front of one - but what was already there has to still be "
            "there, and rewording it is authoring, not repair.",
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
            "even though nothing was taken away. Repeating wording already on "
            "the child's page is fine. Copying it off the teacher's copy is "
            "not: the answer key is content, and it is not their channel.",
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
        f"{sum(after.cases.values())} question(s) or case(s) intact, "
        f"{sum(after.teacher.values())} teacher answer(s), "
        f"{after.room['targets']} place(s) to write and "
        f"{sum(after.metadata.values())} piece(s) of authoring data preserved"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
