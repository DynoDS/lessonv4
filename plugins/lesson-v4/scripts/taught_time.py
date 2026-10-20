#!/usr/bin/env python3
"""How long a lesson takes to teach, timed from what is on its slides.

The designer's own `minutes` were the time to read a beat aloud, and a lesson
planned that way does not fit. A cover teacher taught a 25-minute Year 4 history
plan (cholera, 20 October 2026) the way the teacher wants every lesson taught:
he barely read the notes, read each slide, asked his way up to every line on it
("did everyone have their own tap?", "what would be the problem if everyone used
the same pump?"), had children read slides aloud, and ran each task. The first
twelve slides, about 640 words of board, planned at 17 minutes, took him 40,
and the class "had enough" before the final task.

So the time comes from the slides, never from the script (the teacher, 20
October 2026: "Script is separate"). Each beat takes at least its board words
at about 16 a minute: reading the slide, the questions it needs before it makes
sense, and the task it sets, answers gone through. A task whose doing outlasts
its words (children writing on their own) keeps its planned minutes. One
lesson set this rate; when the teacher reports another, recalibrate it here,
where the design check and the designer's view both read it.

Standard library only.
"""
from __future__ import annotations

import math

BOARD_WORDS_A_MINUTE = 16

# What a content field holds that is about the board rather than on it.
NOT_ON_THE_BOARD = {"format", "connection", "kind", "ref", "per", "form", "show"}


def _words(value) -> int:
    if isinstance(value, str):
        return len(value.split())
    if isinstance(value, list):
        return sum(_words(item) for item in value)
    if isinstance(value, dict):
        return sum(_words(item) for key, item in value.items() if key not in NOT_ON_THE_BOARD)
    return 0


def board_words(unit: dict, design: dict) -> int:
    """The words a beat puts in front of the class: its board, its task, the
    line to remember and the answers gone through. Never its script."""
    content = unit.get("content") if isinstance(unit.get("content"), dict) else {}
    count = sum(_words(value) for key, value in content.items() if key != "takeaway")
    takeaway = content.get("takeaway")
    if isinstance(takeaway, dict) and takeaway.get("ref"):
        sticky = {row.get("id"): row for row in design.get("stickyKnowledge") or [] if isinstance(row, dict)}
        count += _words((sticky.get(takeaway["ref"]) or {}).get("text") or "")
    elif isinstance(takeaway, str):
        count += _words(takeaway)
    count += _words(unit.get("pupilInstruction") or "")
    count += _words(unit.get("answer") or {})
    return count


def taught_minutes(words: int) -> int:
    return math.ceil(words / BOARD_WORDS_A_MINUTE) if words > 0 else 0


def card_words(design: dict) -> int:
    """The word cards: each term and its meaning, read and asked about."""
    return sum(_words(row.get("term") or "") + _words(row.get("definition") or "")
               for row in design.get("vocabulary") or [] if isinstance(row, dict))


def lesson_beats(design: dict) -> list[tuple[str, dict]]:
    beats: list[tuple[str, dict]] = []
    if isinstance(design.get("starter"), dict):
        beats.append(("the starter", design["starter"]))
    for unit in design.get("teachingSequence") or []:
        if isinstance(unit, dict):
            beats.append((unit.get("label") or unit.get("sourceUnitId") or "a beat", unit))
    ending = design.get("ending") or {}
    if isinstance(ending, dict) and ending.get("included") and isinstance(ending.get("beat"), dict):
        beats.append((ending["beat"].get("label") or "the ending", ending["beat"]))
    return beats


def honest_minutes(design: dict) -> tuple[int, list[tuple[str, int, int]]]:
    """Each beat as the longer of its planned minutes and its board taught,
    plus the word cards: (total, [(label, planned, taught), ...])."""
    rows: list[tuple[str, int, int]] = []
    total = 0
    for label, unit in lesson_beats(design):
        planned = unit.get("minutes") if isinstance(unit.get("minutes"), int) else 0
        taught = taught_minutes(board_words(unit, design))
        rows.append((label, planned, taught))
        total += max(planned, taught)
    cards = taught_minutes(card_words(design))
    if cards:
        rows.append(("the word cards", 0, cards))
        total += cards
    return total, rows
