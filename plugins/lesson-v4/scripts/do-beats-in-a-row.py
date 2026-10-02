#!/usr/bin/env python3
"""Print a lesson design's Do beats one after another, as the class meets them.

A look, never a verdict: nothing here passes or fails. It exists for the lesson
designer's completion check "The Do beats read in a row" and for a redesign,
which both have to read every Do beat together rather than one at a time.

For each Do beat (and the practice) it prints how children answer (the
format and the first words of what they are told to do), and any run of three
or more words the beat's task or answer shares with the Teach just before it or
with a star fact printed on it. On 28 September 2026 a Codex design went back
to its designer twice: first because a Do repeated the case its Teach had just
taught ("hot, very little rain" in both), then because the repair left all
three Do beats asking for a written answer. Both were visible in a list like
this one before any review ran.

After the Do beats it prints the whole lesson from a child's seat: every
stretch where children only listen, with the words the teacher says and
roughly how long they take to say, and every time children do something, with
cards in their hands or from the board, on their own or with someone. On
30 September 2026 a Year 4 RE lesson on the Nativity passed every check with a
deck and script the teacher called fantastic, and lost the class: every task
before the writing was answered alone, off the board, and two gave back words
the teacher had just said ("a lot of listening, a lot of sitting"). Each Do
beat looked fine on its own; only the whole run showed it. The review view
prints the same lines (`design-review-packet.py`).

    python do-beats-in-a-row.py <lesson-design.json>

Standard library only.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Words that make a shared run look meaningful when it is only grammar.
LITTLE = {
    "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "is",
    "are", "was", "were", "it", "its", "it's", "that", "this", "with", "as", "be",
    "you", "your", "they", "their", "we", "our", "i", "my", "he", "she", "his",
    "her", "what", "why", "how", "do", "does", "did", "not", "if", "so", "from",
    "by", "can", "will", "would", "has", "have", "had", "there", "then", "when",
}


def words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", str(text or "").lower())


def runs(text: str, size: int = 3) -> set[tuple[str, ...]]:
    ws = words(text)
    return {
        tuple(ws[i:i + size])
        for i in range(len(ws) - size + 1)
        if sum(w not in LITTLE for w in ws[i:i + size]) >= 2
    }


def shared(beat_text: str, board_text: str) -> list[str]:
    """Longest word runs (three or more words) both texts carry."""
    common = runs(beat_text) & runs(board_text)
    if not common:
        return []
    # Join overlapping three-word runs back into the phrases they came from.
    ws = words(beat_text)
    phrases, i = [], 0
    while i < len(ws) - 2:
        if tuple(ws[i:i + 3]) in common:
            j = i + 3
            while j < len(ws) and tuple(ws[j - 2:j + 1]) in common:
                j += 1
            phrases.append(" ".join(ws[i:j]))
            i = j
        else:
            i += 1
    return phrases


def flatten(value) -> str:
    if isinstance(value, dict):
        return " ".join(flatten(v) for v in value.values())
    if isinstance(value, list):
        return " ".join(flatten(v) for v in value)
    return str(value) if value is not None else ""


def first_words(text: str, count: int = 8) -> str:
    ws = str(text or "").split()
    return " ".join(ws[:count]) + (" ..." if len(ws) > count else "")


# Beats where the teacher presents and no child produces anything (the lesson
# design validator's TEACHER_PRESENTS_KINDS). The main work is the first beat
# of a kind that carries it; a skill lesson with none ends on its last Your Turn.
LISTEN_KINDS = {"prepare", "my-turn", "grounding-input", "stimulus", "set-task",
                "teach", "teach-why", "teach-needed"}
MAIN_KINDS = {"practise", "do-task", "use-learning", "synthesise", "finish"}
# A steady classroom reading pace. What the teacher says aloud, before any
# question is asked or answered, so the real stretch is longer.
WORDS_A_MINUTE = 120
# A Do planned at this many minutes or fewer is a quick check; longer is a task,
# however it is described (the teacher, 30 September 2026, after a four-minute
# rice test with equipment was counted as "quick").
QUICK_CHECK_MINUTES = 2
TOGETHER = re.compile(r"\b(partners?|pairs?|groups?|together|table)\b", re.IGNORECASE)


def script_of(unit: dict) -> str:
    notes = unit.get("speakerNotes")
    if isinstance(notes, dict) and isinstance(notes.get("script"), str):
        return notes["script"]
    return unit.get("script") if isinstance(unit.get("script"), str) else ""


def time_to_say(count: int) -> str:
    minutes = count / WORDS_A_MINUTE
    if minutes < 0.75:
        return "under a minute to say"
    rounded = round(minutes * 2) / 2
    return f"about {rounded:g} minute{'' if rounded == 1 else 's'} to say"


def how_answered(unit: dict) -> str:
    """The format the design names, or what its task structure shows."""
    content = unit.get("content") or {}
    if content.get("format"):
        return str(content["format"])
    structure = unit.get("taskStructure") or {}
    if structure.get("kind"):
        handling = structure.get("handling") or {}
        where = (f"with printed cards, one set per {handling.get('per')}"
                 if handling.get("kind") == "cards"
                 else f"on a printed sheet, one per {handling.get('per')}"
                 if handling.get("kind") == "sheet" else "from the board")
        return f"{structure['kind']} {where}"
    return "-"


def class_order(design: dict) -> list[tuple[str, dict]]:
    """Every beat the class meets, in order, with each word card where it is
    shown: ("unit", unit) or ("card", {"terms": [...], "script": ...})."""
    starter = design.get("starter") if isinstance(design.get("starter"), dict) else None
    starter_id = (starter or {}).get("sourceUnitId") or ""
    terms = {row.get("id"): row.get("term", "") for row in design.get("vocabulary") or []
             if isinstance(row, dict)}
    cards: dict[str, list[dict]] = {}
    introductions = design.get("vocabularyIntroductions")
    if isinstance(introductions, list) and introductions:
        for entry in introductions:
            if isinstance(entry, dict):
                cards.setdefault(entry.get("after") or starter_id, []).append({
                    "terms": [terms.get(ref, ref) for ref in entry.get("vocabularyRefs") or []],
                    "script": entry.get("script") if isinstance(entry.get("script"), str) else "",
                })
    elif terms:
        placement = design.get("vocabularyPlacement")
        anchor = placement.get("after") if isinstance(placement, dict) else None
        cards[anchor or starter_id] = [{"terms": list(terms.values()), "script": ""}]

    units = ([starter] if starter else []) + [
        unit for unit in design.get("teachingSequence") or [] if isinstance(unit, dict)]
    ending = design.get("ending") or {}
    if ending.get("included") and isinstance(ending.get("beat"), dict):
        units.append(ending["beat"])
    order: list[tuple[str, dict]] = []
    placed = set()
    for unit in units:
        order.append(("unit", unit))
        anchor = unit.get("sourceUnitId") or ""
        if anchor in cards and anchor not in placed:
            placed.add(anchor)
            order.extend(("card", card) for card in cards[anchor])
    for anchor, group in cards.items():
        if anchor not in placed:
            order[1:1] = [("card", card) for card in group]
    return order


def child_seat(design: dict) -> list[str]:
    """The lesson as the class lives it: listening stretches and what children
    do, in order. A look, never a verdict."""
    order = class_order(design)
    main_at = next((i for i, (what, unit) in enumerate(order)
                    if what == "unit" and unit.get("kind") in MAIN_KINDS), None)
    if main_at is None:
        main_at = max((i for i, (what, unit) in enumerate(order)
                       if what == "unit" and unit.get("kind") not in LISTEN_KINDS), default=None)

    lines = ["From a child's seat, in the order the class meets it (words the teacher says, "
             f"at about {WORDS_A_MINUTE} a minute, before any question is asked or answered):"]
    listened = 0
    stretch: list[tuple[str, int]] = []
    stretches: list[list[tuple[str, int]]] = []
    before_main = {"do": 0, "cards": 0, "together": 0, "quick": 0}
    after_main = 0
    for i, (what, item) in enumerate(order):
        if what == "card":
            name = "word card: " + ", ".join(t for t in item["terms"] if t)
            count = len(item["script"].split())
            lines.append(f"  listen  {name} ({count} words, {time_to_say(count)})")
            listened += count
            stretch.append((name, count))
            continue
        name = item.get("label") or item.get("sourceUnitId") or item.get("kind") or "beat"
        count = len(script_of(item).split())
        if item.get("kind") in LISTEN_KINDS:
            lines.append(f"  listen  {name} ({count} words, {time_to_say(count)})")
            listened += count
            stretch.append((name, count))
            continue
        if stretch:
            stretches.append(stretch)
            stretch = []
        content = item.get("content") or {}
        told = (item.get("pupilInstruction") or content.get("task") or content.get("prompt")
                or content.get("question") or content.get("activity") or "")
        handling = (item.get("taskStructure") or {}).get("handling") or {}
        cards = handling.get("kind") == "cards"
        together = (handling.get("per") in {"pair", "group"}) or bool(TOGETHER.search(flatten(told)))
        sheet = handling.get("kind") == "sheet"
        levels = item.get("levels") if isinstance(item.get("levels"), dict) else {}
        printed = levels.get("printed") if isinstance(levels.get("printed"), dict) else None
        # The board version always runs; the printed level is what the teacher
        # can hand out instead, shown so the run of beats reads as the class
        # could live it on a prepared day as well as from the slides.
        where = (f"with printed cards, one set per {handling.get('per')}" if cards
                 else f"on a printed sheet, one per {handling.get('per')}" if sheet
                 else f"from the board, or a printed {printed.get('form')} sheet one per {printed.get('per')}" if printed
                 else "from the board or in books")
        if levels.get("realThings"):
            where += f", or with {levels['realThings']}"
        who = "with a partner or group" if together else "on their own"
        planned = item.get("minutes")
        # A beat with a printed sheet is a task however short it was planned:
        # handing out, doing and checking a sheet is not a one-minute check.
        # The Shaftesbury lesson of 1 October 2026 planned three tasks and a
        # quick check, printed the check, and the teacher felt four tasks.
        quick = (item.get("kind") != "starter" and i != main_at and printed is None
                 and isinstance(planned, (int, float)) and planned <= QUICK_CHECK_MINUTES)
        tag = "MAIN" if i == main_at else ("quick" if quick else "do")
        minutes = f", {planned} min planned" if isinstance(planned, (int, float)) else ""
        lines.append(f"  {tag:<6}  {name}: \"{first_words(flatten(told), 10)}\" - {where}, {who}"
                     f" (teacher says {count} words{minutes})")
        if item.get("kind") == "starter":
            continue
        if main_at is not None and i < main_at and quick:
            before_main["quick"] += 1
        elif main_at is not None and i < main_at:
            before_main["do"] += 1
            before_main["cards"] += cards
            before_main["together"] += together
        elif main_at is not None and i > main_at:
            after_main += 1
    if stretch:
        stretches.append(stretch)

    lines.append(f"  Children only listen to {listened} words in all, {time_to_say(listened)}.")
    if stretches:
        longest = max(stretches, key=lambda run: sum(count for _name, count in run))
        words_in = sum(count for _name, count in longest)
        lines.append(f"  The longest listening stretch is {words_in} words, {time_to_say(words_in)}: "
                     + "; ".join(name for name, _count in longest) + ".")
    if main_at is not None:
        lines.append(
            f"  Between the starter and the main work children do {before_main['do']} "
            f"task{'' if before_main['do'] == 1 else 's'} and {before_main['quick']} quick "
            f"check{'' if before_main['quick'] == 1 else 's'} (a Do planned at {QUICK_CHECK_MINUTES} minutes "
            f"or less): {before_main['cards']} with cards in their hands, {before_main['together']} with "
            f"a partner or group, the rest on their own from the board or in books."
        )
        if after_main:
            lines.append(f"  After the main work they do something {after_main} more time"
                         f"{'' if after_main == 1 else 's'}.")
        counted = before_main["do"] + 1 + after_main
        lines.append(f"  Tasks counted against the two or three a lesson holds (the main work and anything "
                     f"after it included, quick checks not): {counted}.")
    return lines


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print("usage: do-beats-in-a-row.py <lesson-design.json>", file=sys.stderr)
        return 2
    design = json.loads(Path(argv[0]).read_text(encoding="utf-8"))
    sticky = {
        item.get("id"): flatten(item.get("text") or item)
        for item in design.get("stickyKnowledge") or []
        if isinstance(item, dict)
    }

    last_teach = ""
    count = 0
    for unit in design.get("teachingSequence") or []:
        if not isinstance(unit, dict):
            continue
        kind = unit.get("kind")
        content = unit.get("content") or {}
        if kind == "teach":
            last_teach = flatten(content)
            continue
        if kind not in {"do", "practise"}:
            continue
        count += 1
        task = content.get("task") or content.get("prompt") or content.get("question") or ""
        told = unit.get("pupilInstruction") or task or content.get("activity") or ""
        form = how_answered(unit)
        label = "practice" if kind == "practise" else f"Do {count}"
        print(f"{label}: {unit.get('label') or unit.get('sourceUnitId')}")
        print(f"  answered as: {form}; told: \"{first_words(told)}\"")

        beat_text = " ".join([flatten(task), flatten((unit.get("answer") or {}).get("content"))])
        repeats = shared(beat_text, last_teach)
        if repeats:
            print(f"  also in the Teach just before: {'; '.join(repeats)}")
        for ref in unit.get("stickyKnowledgeRefs") or []:
            printed = shared(beat_text, sticky.get(ref, ""))
            if printed:
                print(f"  also in its star fact ({ref}): {'; '.join(printed)}")

    print(
        f"DO_BEATS_IN_A_ROW: {count} beats. A look, not a verdict: a shared phrase is "
        "fine where the beat uses the idea on a new case, and one answer form is fine "
        "where the thinking genuinely suits it."
    )
    print()
    print("\n".join(child_seat(design)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
