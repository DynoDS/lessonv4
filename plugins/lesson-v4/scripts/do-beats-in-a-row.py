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
        form = content.get("format") or "-"
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
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
