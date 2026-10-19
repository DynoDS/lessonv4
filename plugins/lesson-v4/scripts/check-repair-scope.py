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
import re
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
    # Where a picture's file sits, which is not a word anybody reads. Only
    # `imageHref` was released, so a deck whose fields are `imagePath` had every
    # re-point read as a lost word: told on 21 September 2026 that
    # `unsplash/bed-ready-for-sleep.jpg` was "1 thing children read or work from"
    # now missing, the repair kept five dead filenames in the file as inert
    # `sourceImagePath` provenance purely to get past this check, and the lesson
    # shipped carrying paths to pictures that do not exist. The picture a slide
    # carries is still covered: the census counts the picture object itself, so
    # taking one away is caught here as it always was, and an essential
    # photograph no longer reaches a re-point at all (4.2.270). What is released
    # is the string naming the file.
    # The record of a sheet sent back to its author (the worksheets topic,
    # 4.2.290). It is never printed, so it is not something a child reads.
    # The sheet it records is taken out whole, which `without_sheets_sent_back`
    # below releases and nothing else does, and a record already there may
    # not be taken away.
    "returned",
    "imagePath",
    "sourceImagePath",
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
    # A table's column shares are the same thing for a table: how the width is
    # divided, never a value a child reads. Counted as content, every repair
    # that resized a column failed (Year 6 divisibility, 2 October 2026), and
    # the orchestrator had to overrule the check by hand.
    "columnWidths",
    # Which design picture a slide answers to. No builder prints it: it is the
    # slide's pointer back to photo-requirements.json, and it is re-pointed
    # when a content-gap revision replaces a picture. Counted as content,
    # the correct re-point failed twice (Nativity, Shaftesbury, 30 September
    # 2026) and one repair left a stale id in place to pass. The picture a
    # slide carries is still counted, as its picture object.
    "photoRefs",
    # Whether a sheet is done in books or on the printed page, and the
    # designer's line to the teacher saying why. The build prints the reason on
    # no sheet and no answer key, and the mark decides slips or a sheet, which
    # is the worksheet designer's own page decision. Counted as content, a
    # repair that changed the mark was told "books: 2 before the repair, 0
    # after" (Year 4 Science, 6 October 2026). The questions, their lines and
    # their answers are all still counted where they sit.
    "recording",
    "recordingReason",
    "recordingLookedAgain",
    # The height of a card-row's picture viewport: geometry, like `widthMm`.
    # A pure viewport resize read "71" as a new word a child reads
    # (18 September 2026).
    "imageHeightMm",
    # Which house colour a line or a category takes: question blue, task blue,
    # the purple of a worked example. None of them is green, the validator
    # refuses green in both, and a repair that moves a question to a template
    # which no longer colours it must be able to say "blue" itself. A plain
    # `color` and the `emphasis` marks are read in `Census._visit`, where
    # green, the one colour that tells children something, is kept.
    "colorRole",
    "categoryColor",
    "textWeight",
}

# How a word is DRAWN, as opposed to what the word is. Bold, question blue and
# the orange of a supplied value are written inside the string, so compared
# letter for letter a line that gained a mark read as a line that had been
# deleted and a new one authored. A template that prints its questions blue by
# itself was swapped for a roomier one that does not, the repair wrapped the
# same line in `[[ ]]` to keep it blue, and was refused (Year 4 Maths, 10
# October 2026). So these come off before a string is counted.
#
# Green stays on. `{{ }}` is the answer and the taught word, and `||` opens an
# answer reveal: turning one of three options green gives the answer away
# without changing a letter. With the mark left in the string, adding or
# removing it reads as the change of wording it amounts to.
DRAWING_MARKS = re.compile(r"\*\*|\[\[|\]\]|<<|>>")
GREENS = {"00B050", "007A3D"}
GREEN_EMPHASIS_ROLES = {"vocabulary"}


def said(text: str) -> str:
    """A string as a child reads it: its words, in order, and what is green.

    Line breaks and spacing are how the words are laid out, and the repair
    guidance has always allowed them to change. The check did not: three facts
    with a blank line between each were closed up to three plain lines and
    refused as a lost sentence (Year 4 Science, 10 October 2026).
    """
    return " ".join(DRAWING_MARKS.sub("", text).split())


# Boxes that only hold other things in place, and the plain box of words. A row
# or a stack is where things sit, which is what a repair changes; and a text
# box's words are every one of them counted as content, so the box adds nothing
# the words do not already say. Counted as content objects, unwrapping a row
# read as "type:row: 1 before the repair, 0 after" with every word still on the
# slide (Year 4 PSHE, 10 October 2026), and so would taking out an empty spacer.
LAYOUT_ONLY_TYPES = {"row", "stack", "text"}

# The lists whose entries are whole pages, so a group of cards split over two
# pages can be told from one scattered through the lesson.
PAGE_LIST_KEYS = {"slides", "pages", "cards"}

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


def is_reveal_pair(value: object) -> bool:
    """Whether a reveal-pair declaration is the renderer's exact contract.

    This small declaration identifies two views of the same authored text; it
    is authoring metadata, not another content object. Keep this deliberately
    narrower than a generic nested-object exception.
    """
    if not isinstance(value, dict) or set(value) != {"id", "state"}:
        return False
    pair_id = value.get("id")
    state = value.get("state")
    return (
        isinstance(pair_id, str)
        and bool(re.fullmatch(r"[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*", pair_id))
        and isinstance(state, str)
        and state in {"question", "answer"}
    )


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
        isinstance(child, (dict, list))
        for key, child in item.items()
        if not (key == "revealPair" and is_reveal_pair(child))
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
        return " | ".join(BLANK if cell is None else said(str(cell)) for cell in item)
    if not isinstance(item, dict):
        return said(str(item))
    for field in ("value", "text", "caption", "label"):
        if field in item and not isinstance(item[field], bool):
            printed = said(str(item[field]))
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


def is_card_group(items: list) -> bool:
    """A list of slide objects, as opposed to a list of values.

    Three task cards in a stack are flat records, so they used to be read like
    the summands of a number sentence: one chain, protected as one string. But
    each card's words are already counted on their own, and what the chain was
    protecting - that the cards stay, in their order, together - does not
    depend on which box holds them. Read as one string, a plan-then-write task
    could not be split over two slides unless the pieces landed in boxes of
    exactly the right shape, and the repair gave up and printed everything
    twice (Year 4 PSHE, 10 October 2026). So a group of cards is checked for
    what matters instead: see `scattered_card_groups`.
    """
    return all(
        isinstance(item, dict)
        and any(isinstance(item.get(field), str) and item.get(field) for field in DISCRIMINATORS)
        for item in items
    )


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


def channel_of(channel: str, key: str, value: object = None) -> str:
    """Which audience the value under this key belongs to.

    Once inside the teacher's copy everything below stays there. Metadata is the
    same, except that the handful of fields the renderer prints from it climb
    back out onto the child's page.
    """
    if channel == "teacher" or key in TEACHER_KEYS:
        return "teacher"
    if key == "revealPair" and is_reveal_pair(value):
        return "metadata"
    if key in METADATA_KEYS:
        return "metadata"
    if channel == "metadata":
        return "pupil" if key in PRINTED_METADATA_FIELDS else "metadata"
    return channel


class Census:
    """Everything one specification holds, counted in a single walk."""

    def __init__(self, node: object) -> None:
        self.objects: Counter = Counter()
        # Whether the walk met anything that says what it is, a plain box of
        # words included, so an artefact of text alone is still one this check
        # read rather than one it did not recognise.
        self.recognised = 0
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
        # The pieces such a split can leave, in walk order: each sequence, and
        # each list of a single value, which is no order on its own but may be
        # the last piece of one (a wall card keeping one fact after a split).
        self.pieces: list[tuple[str, str, tuple, int, bool]] = []
        # Everything a child reads, in the order the walk met it, with the page
        # it is on; and each group of cards, by what its cards say.
        self.stream: list[tuple[int, str]] = []
        self.card_groups: list[tuple] = []
        # What stands as a page's title, so a split page may be titled from
        # its own words.
        self.titles: Counter = Counter()
        self._page = 0
        self._page_lists: set[int] = set()
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
            paged = id(value) in self._page_lists
            for item in value:
                if paged:
                    self._page += 1
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
                self.recognised += 1
            if isinstance(kind, str) and kind and not (
                field == "type" and kind in LAYOUT_ONLY_TYPES
            ):
                self.objects[f"{field}:{ALIASES.get(kind, kind)}"] += times

        # A stick-in piece names its figure as a bare string on ``visual``,
        # where a wall card uses ``visual`` for a nested object that carries its
        # own ``type``. Counting the string form here catches the first without
        # double-counting the second, which the walk below reaches anyway.
        visual = value.get("visual")
        if isinstance(visual, str) and visual:
            self.objects[f"visual:{visual}"] += times
            self.recognised += 1

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
            child_channel = channel_of(channel, key, child)
            if key in {"color", "colour"} and isinstance(child, str):
                # A colour is how a line is drawn, unless it is green.
                if child.strip().lstrip("#").upper() in GREENS:
                    self._note_key("green", "a whole line", times, own, child_channel)
                continue
            if key == "emphasis" and isinstance(child, list):
                # Bold, underline and the orange line are drawing. The taught
                # word's green is not, so it is counted and the rest is left.
                for entry in child:
                    if (isinstance(entry, dict) and entry.get("role") in GREEN_EMPHASIS_ROLES
                            and isinstance(entry.get("text"), str)):
                        self._note_key("green", said(entry["text"]), times, own, child_channel)
                continue
            if key == "title" and isinstance(child, str) and child_channel == "pupil":
                self.titles[said(child)] += times
            if key in PAGE_LIST_KEYS and isinstance(child, list):
                self._page_lists.add(id(child))
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
                    if sequence is not None and is_card_group(child):
                        if child_channel == "pupil":
                            self.card_groups.append(sequence)
                    elif sequence is not None:
                        self._note_key(key, ", ".join(sequence), times, own, child_channel)
                        self.sequences.append((child_channel, key, sequence, times))
                        self.pieces.append((child_channel, key, sequence, times, False))
                    elif len(child) == 1 and is_flat(child[0]) and printed_part(child[0]) != BLANK:
                        self.pieces.append((child_channel, key, (printed_part(child[0]),), times, True))
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
            text = said(value)
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
        self.stream.append((self._page, key))

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

    A piece may be a single value: the teacher's rule of one three-line fact a
    wall card sends the next fact to a second card of its own, and a list split
    so that one card keeps one item was refused as the lost chain it had
    rejoined (release 7A's fourth check, 26 September 2026). A single value has
    no chain of its own to count, so only the pieces that are chains are taken
    back off.
    """
    for channel, key, whole, times in before.sequences:
        entry = f"{key}: {', '.join(whole)}"
        wanted = before.content[entry] if channel == "pupil" else 0
        if channel != "pupil" or after.content.get(entry, 0) >= wanted:
            continue
        pieces = [(seq, t, single) for (c, k, seq, t, single) in after.pieces if c == channel and k == key]
        for start in range(len(pieces)):
            joined: tuple = ()
            used = []
            for seq, t, single in pieces[start:]:
                if t != times or tuple(whole[len(joined):len(joined) + len(seq)]) != seq:
                    break
                joined += seq
                used.append((seq, single))
                if joined == whole:
                    break
            if joined == whole and len(used) > 1:
                after.content[entry] += times
                for seq, single in used:
                    if single:
                        continue
                    piece = f"{key}: {', '.join(seq)}"
                    after.content[piece] -= times
                    if after.content[piece] <= 0:
                        del after.content[piece]
                break


def recut_wording(before: Counter, after: Counter) -> None:
    """Treat the same words in the same order, cut into different pieces, as unchanged.

    One block of three sentences and three one-sentence lines put exactly the
    same words in front of a child. Compared string by string they share
    nothing, so giving each fact its own line was refused as two new things a
    child reads (Year 4 Science, 10 October 2026). So a string that went
    missing is looked for as a run of the strings that appeared, end to end,
    and a string that appeared as a run of the ones that went missing. Only an
    exact tiling counts, word for word: a changed, added or dropped word leaves
    a piece over and is reported as it always was.
    """
    def spare(tally: Counter, other: Counter) -> Counter:
        return Counter({
            key: tally[key] - other.get(key, 0)
            for key in tally
            if isinstance(key, str) and tally[key] > other.get(key, 0)
        })

    def tiling(words: list[str], pieces: Counter) -> list[str] | None:
        if not words:
            return []
        for piece in sorted(pieces):
            cut = piece.split()
            if pieces[piece] > 0 and cut and words[:len(cut)] == cut:
                pieces[piece] -= 1
                rest = tiling(words[len(cut):], pieces)
                pieces[piece] += 1
                if rest is not None:
                    return [piece] + rest
        return None

    for whole_side, piece_side in ((before, after), (after, before)):
        for whole in sorted(spare(whole_side, piece_side)):
            while whole_side.get(whole, 0) > piece_side.get(whole, 0):
                pieces = spare(piece_side, whole_side)
                used = tiling(whole.split(), pieces)
                if not used or len(used) < 2:
                    break
                whole_side[whole] -= 1
                if whole_side[whole] <= 0:
                    del whole_side[whole]
                for piece in used:
                    piece_side[piece] -= 1
                    if piece_side[piece] <= 0:
                        del piece_side[piece]


def scattered_card_groups(before: "Census", after: "Census") -> list[str]:
    """Groups of cards that no longer stand together, in their order.

    Every card's words are counted on their own, so a dropped or reworded card
    is caught there. What is left to protect is the group: the cards still come
    in the order they were written, and on one page or two pages next to each
    other. Other things may stand between them, and the story a task is about
    may be repeated on both pages.
    """
    reports = []
    still_there = {text for _, text in after.stream}
    for group in before.card_groups:
        # A card that is gone or reworded is the wording checks' to report, or
        # to release when its words pointed at a picture that never arrived.
        parts = [part for part in group if part in still_there]
        if len(parts) < 2:
            continue
        for start, (first_page, text) in enumerate(after.stream):
            if text != parts[0]:
                continue
            at, page = start, first_page
            for part in parts[1:]:
                at = next((i for i in range(at + 1, len(after.stream))
                           if after.stream[i][1] == part), None)
                if at is None:
                    break
                page = after.stream[at][0]
            if at is not None and page - first_page <= 1:
                break
        else:
            reports.append(" / ".join(part[:40] for part in parts)[:150])
    return reports


def lifted_from_the_page(title: str, before: Counter) -> bool:
    """Whether a title is a run of words already in front of the class.

    A page made by a split needs a title. Repeating the old one was always
    allowed; a run of words taken exactly from a line already there says what
    this page is for and authors nothing.
    """
    def bare(text: str) -> list[str]:
        return [word.strip(".,;:!?\u201c\u201d\"'()") for word in text.split()]

    words = bare(title)
    if len(words) < 2:
        return False
    for line in before:
        if not isinstance(line, str):
            continue
        source = bare(line)
        if any(source[i:i + len(words)] == words for i in range(len(source) - len(words) + 1)):
            return True
    return False


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


# A Below or Greater Depth sheet sent back to its author (the worksheets topic,
# 4.2.290) leaves the spec whole, with its answer-key section, and is recorded
# in `returned`: that is a return, not a lost question. Only a tier the "after"
# spec both records and no longer holds is released, so taking a sheet out
# without recording it is caught as it always was.
#
# The same sheet comes back when its redesign goes in, and then the record
# comes off: the worksheet preflight refuses a record beside its own sheet
# (`RETURNED_INVALID`). This check used to refuse the record's removal whatever
# the spec held, so the repair that put a redesigned Below sheet in could pass
# one check or the other and never both (Year 4 Maths lesson 24, 6 October
# 2026). A record may now come off when that tier's sheet is back in `sheets`.
# The sheet that came back was not in the "before" spec, so there is nothing
# here to compare it with: it is left out of the count, and the preflight,
# which reads the adaptation, is what checks it. Every other sheet is compared
# as before.
SENT_BACK_TIERS = ("below", "greaterDepth")


def returned_tiers(spec: object) -> set:
    entries = spec.get("returned") if isinstance(spec, dict) else None
    if not isinstance(entries, list):
        return set()
    return {e.get("sheet") for e in entries if isinstance(e, dict) and isinstance(e.get("sheet"), str)}


def sheets_of(spec: object) -> dict:
    sheets = spec.get("sheets") if isinstance(spec, dict) else None
    return sheets if isinstance(sheets, dict) else {}


def returns_taken_away(before: object, after: object) -> list[str]:
    back = sheets_of(after)
    gone = sorted(
        tier for tier in returned_tiers(before) - returned_tiers(after) if tier not in back
    )
    return [f"the record of the {tier} sheet sent back" for tier in gone]


def without_sheets_come_back(before: object, after: object) -> object:
    """The "after" spec without a sheet whose redesign has just gone in."""
    if not isinstance(before, dict) or not isinstance(after, dict):
        return after
    before_sheets = sheets_of(before)
    after_sheets = sheets_of(after)
    came_off = returned_tiers(before) - returned_tiers(after)
    back = [t for t in SENT_BACK_TIERS if t in came_off and t in after_sheets and t not in before_sheets]
    if not back:
        return after
    trimmed = dict(after)
    trimmed["sheets"] = {k: v for k, v in after_sheets.items() if k not in back}
    if isinstance(after.get("answerKey"), dict):
        trimmed["answerKey"] = {k: v for k, v in after["answerKey"].items() if k not in back}
    return trimmed


def without_sheets_sent_back(before: object, after: object) -> object:
    if not isinstance(before, dict) or not isinstance(after, dict):
        return before
    before_sheets = before.get("sheets") if isinstance(before.get("sheets"), dict) else {}
    after_sheets = after.get("sheets") if isinstance(after.get("sheets"), dict) else {}
    recorded = returned_tiers(after)
    gone = [t for t in SENT_BACK_TIERS if t in recorded and t in before_sheets and t not in after_sheets]
    if not gone:
        return before
    trimmed = dict(before)
    trimmed["sheets"] = {k: v for k, v in before_sheets.items() if k not in gone}
    if isinstance(before.get("answerKey"), dict):
        trimmed["answerKey"] = {k: v for k, v in before["answerKey"].items() if k not in gone}
    return trimmed


# The keys that only say which picture file an object shows. Releasing them
# releases the picture and nothing a child reads.
PICTURE_POINTER_KEYS = {"imagePath", "imageHref", "photoRef", "alt"}
# A bare picture object: type, file, how it is drawn, and its caption.
BARE_PICTURE_KEYS = PICTURE_POINTER_KEYS | {
    "type", "fit", "essential", "caption", "crop", "focus", "width", "height", "frame",
}


# Where a labelled diagram keeps what it says about its picture.
LABEL_KEYS = {"callouts", "labels"}


def without_omitted_pictures(spec: object, omitted: set[str]) -> object:
    """The specification with every picture object naming an omitted file taken out.

    A picture the picture stage ended as omitted or unsatisfied will never
    exist, and the repair route is told it may compose the beat without it. A
    census that still counted that picture object refused the one repair it
    allows: the renga deck's slide 4 (2 October 2026) came back
    REPAIR_SCOPE_FAILED for an image count of 5 before and 4 after. Taking
    the object out of both sides lets the repair drop it, re-point it or keep
    it, and nothing else about the slide is released.
    """
    if not omitted:
        return spec

    def names_omitted(node: dict) -> bool:
        return any(isinstance(node.get(key), str) and node[key] in omitted
                   for key in ("imagePath", "imageHref"))

    def unlabelled(marks: object) -> bool:
        # A diagram's marks with no word on them and nowhere to write one: a
        # dot's position and nothing else. A label a child reads is a string,
        # and one a child writes says `given: false`.
        if isinstance(marks, str):
            return False
        if isinstance(marks, list):
            return all(unlabelled(item) for item in marks)
        if isinstance(marks, dict):
            return marks.get("given") is not False and all(
                unlabelled(value) for value in marks.values()
            )
        return True

    def bare_picture(node: dict) -> bool:
        # A picture object and nothing else: its keys say what it is, where its
        # file is and how it is drawn. A card, cell or label that carries a
        # picture also carries words, and only its picture is released.
        if node.get("type") == "image":
            return set(node) <= BARE_PICTURE_KEYS
        # A labelled diagram is its picture plus its labels, and with no label
        # on it the picture is all there is. One that carries a word, or a
        # blank for the child to label, stays counted: those are the task.
        if node.get("type") == "label-diagram":
            return set(node) <= BARE_PICTURE_KEYS | LABEL_KEYS and all(
                unlabelled(node.get(key)) for key in LABEL_KEYS
            )
        return False

    def strip(node: object) -> object:
        if isinstance(node, list):
            return [strip(item) for item in node
                    if not (isinstance(item, dict) and names_omitted(item) and bare_picture(item))]
        if isinstance(node, dict):
            if names_omitted(node):
                node = {key: value for key, value in node.items()
                        if key not in PICTURE_POINTER_KEYS}
            return {key: strip(value) for key, value in node.items()}
        return node

    return strip(spec)


def receipted_omissions(after_path: Path) -> set[str]:
    """Pictures the picture stage itself ended without a file, read from its receipts.

    The repair route is told it may compose a beat without a terminally
    unavailable picture, so the check must know which those are without the
    repairer having to say. The picture stage's terminal receipts sit beside the
    specification, one per filename; a receipt ending `omitted` or
    `unsatisfied` with no file at that name is the proof. Nothing else is
    released.
    """
    root = after_path.resolve().parent
    folder = root / "orchestration-receipts" / "picture-terminal"
    found: set[str] = set()
    if not folder.is_dir():
        return found
    for path in folder.glob("*.json"):
        try:
            receipt = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        name = receipt.get("filename") if isinstance(receipt, dict) else None
        if (isinstance(name, str) and receipt.get("terminalState") in {"omitted", "unsatisfied"}
                and not (root / name).exists()):
            found.add(name)
    return found


# Words that point at a picture: "Look at this sponge", "This photograph shows
# a place like it, at night", "These five pictures". When the picture they point
# at never arrived, keeping them exact is what leaves a slide telling the class
# to look at nothing (6 of 20 lessons in the 7 October 2026 stress test), and
# only the repairer knows which pictures came. So on the pages that named a
# receipted-lost picture, and the pages of the same design unit, a sentence
# carrying one of these cues may be reworded or dropped. A sentence without one
# is held exactly as before, and so is every other page.
POINTS_AT_A_PICTURE = re.compile(
    r"\b(pictures?|photos?|photographs?|images?|paintings?|drawings?|"
    r"look(?:ing)? at|you can see|shows?|shown)\b",
    re.IGNORECASE,
)
SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


def pages_of(spec: object) -> list:
    """The pages of a specification: slides, sheets, cards, stick-in pieces."""
    pages: list = []
    if isinstance(spec, dict):
        for value in spec.values():
            if isinstance(value, list):
                pages.extend(item for item in value if isinstance(item, dict))
            elif isinstance(value, dict):
                pages.extend(item for item in value.values() if isinstance(item, dict))
    return pages


def names_any(node: object, names: set[str]) -> bool:
    if isinstance(node, str):
        return node in names
    if isinstance(node, list):
        return any(names_any(item, names) for item in node)
    if isinstance(node, dict):
        return any(names_any(value, names) for value in node.values())
    return False


def pages_that_lost_a_picture(spec: object, omitted: set[str]) -> list:
    """Pages that named a lost picture, and the other pages of the same unit.

    A unit split over two slides keeps its script on one and its picture on the
    other, so the sentence that points and the picture it points at are often
    on different pages of one `designUnitId`.
    """
    if not omitted:
        return []
    pages = pages_of(spec)
    direct = [page for page in pages if names_any(page, omitted)]
    units = {page.get("designUnitId") for page in direct} - {None}
    return [page for page in pages
            if any(page is hit for hit in direct) or page.get("designUnitId") in units]


def release_pointing_words(before: "Census", after: "Census", lost_pages: list) -> int:
    """Let the words that pointed at a lost picture change, and nothing else.

    Returns how many were released. Each reworded line may bring one new line
    with it, never one copied off the teacher's answers, so the release cannot
    be used to print an answer.
    """
    if not lost_pages:
        return 0
    on_lost_pages = Census(lost_pages)
    changed = [text for text in before.content
               if isinstance(text, str) and text in on_lost_pages.content
               and after.content.get(text, 0) < before.content[text]
               and POINTS_AT_A_PICTURE.search(text)]
    replacements = [text for text in sorted(after.content)
                    if text not in before.content and text not in before.teacher]
    replacements = replacements[:len(changed)]
    # A list of lines is also counted whole, so the list that held a reworded
    # line goes with it on both sides.
    for tally, texts in ((after.content, replacements), (before.content, changed)):
        for key in [key for key in tally if isinstance(key, str)
                    and any(key == text or (": " in key and text in key) for text in texts)]:
            del tally[key]
    for text in changed:
        for tally in (before.cases, before.case_room):
            for fingerprint in [key for key in tally if f"{text}x" in key]:
                del tally[fingerprint]

    released = len(changed)
    kept_scripts = []
    for note in before.script:
        if note not in on_lost_pages.script or any(note in candidate for candidate in after.script):
            kept_scripts.append(note)
            continue
        sentences = [part for part in SENTENCE_END.split(note) if part.strip()]
        held = [part for part in sentences if not POINTS_AT_A_PICTURE.search(part)]
        if all(any(part in candidate for candidate in after.script) for part in held):
            released += 1
        else:
            kept_scripts.append(note)
    before.script[:] = kept_scripts
    return released


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Prove a repair preserved what children work from."
    )
    parser.add_argument("--before", required=True, help="The specification the repair received")
    parser.add_argument("--after", required=True, help="The specification the repair produced")
    args = parser.parse_args(argv)

    # Only the picture stage's own receipts prove a picture will never arrive.
    # A file merely missing from disk is not proof: a published picture a
    # worker deleted by mistake (2 October 2026) is restored, not dropped.
    omitted = receipted_omissions(Path(args.after))

    raw_before = read_spec(Path(args.before), "--before")
    lost_pages = pages_that_lost_a_picture(raw_before, omitted)
    before_spec = without_omitted_pictures(raw_before, omitted)
    after_spec = without_omitted_pictures(read_spec(Path(args.after), "--after"), omitted)
    taken_away = returns_taken_away(before_spec, after_spec)
    if taken_away:
        report(
            f"REPAIR_SCOPE_FAILED: {len(taken_away)} record(s) of a sheet sent back "
            "did not survive the repair:",
            taken_away,
            "A sheet sent back stays sent back until its redesign goes in. Taking "
            "its record away leaves that tier with no sheet and nothing to say so. "
            "The record comes off only with the redesigned sheet back in `sheets`.",
        )
        return 1
    before = Census(without_sheets_sent_back(before_spec, after_spec))
    after = Census(without_sheets_come_back(before_spec, after_spec))

    rejoin_split_sequences(before, after)
    pointing_words = release_pointing_words(before, after, lost_pages)
    recut_wording(before.content, after.content)

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

    added = [
        kind for kind in additions(before.content, after.content)
        if not (after.titles.get(kind, 0) >= after.content[kind]
                and lifted_from_the_page(kind, before.content))
    ]
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
            "not: the answer key is content, and it is not their channel. "
            "Green is counted with the words: marking something green that was "
            "not green before tells children it is the answer.",
        )
        return 1

    scattered = scattered_card_groups(before, after)
    if scattered:
        report(
            f"REPAIR_SCOPE_FAILED: {len(scattered)} group(s) of cards no longer "
            "stand together in their order:",
            scattered,
            "A group of cards may move as a whole, or split over two pages "
            "next to each other with every card in its original order. It may "
            "not be reordered or spread through the lesson.",
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
    if not before.recognised:
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
        + (f"; {pointing_words} line(s) that pointed at a lost picture reworded"
           if pointing_words else "")
    )
    return 0


if __name__ == "__main__":
    import utf8_output
    utf8_output.enable()
    sys.exit(main())
