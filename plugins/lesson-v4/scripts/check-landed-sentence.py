#!/usr/bin/env python3
"""Check that the sentence a Teach beat lands reaches the board.

The design writes it once, in the beat's `headline`: the one sentence children
should still have tomorrow, carrying its reason where the reason is part of what
makes it true (`teaching-sequence-content-based.md`, Teach). On the slide it
normally leads, because the first line a child reads is the most valuable line
on the board.

It does not have to lead every time. Ten of the Teach layouts carry a line
across the top and seventeen do not, and a deck whose every Teach slide used the
same shape would be the repetition the composition rules already refuse. So the
sentence may arrive as the banner, as the star line, or as the slide's big
statement: what it may not do is fail to arrive at all, which is exactly what a
layout with no top slot allows today. Nothing on the built deck looks wrong when
it happens. The slide is composed, the picture is there, the class discusses it,
and the one sentence the beat existed to leave them with was never on screen.

The comparison is by content words rather than by string, because a designer may
justly re-punctuate or split a long sentence across a banner and a card, and an
exact match would refuse that while a bare substring test would accept a passing
mention of the same nouns.

Usage:
    python3 check-landed-sentence.py \\
        --lesson-design "[WORKING_DIR]/lesson-design.json" \\
        --spec "[WORKING_DIR]/lesson.json"

Exit codes:
    0  every content Teach beat's sentence is carried by one of its own slides
    1  a beat's sentence never reached the board
    2  bad input
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


class LandedSentenceError(ValueError):
    """Bad input: a file that cannot be read or is not the expected shape."""


def load(path: Path, label: str) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise LandedSentenceError(f"cannot read the {label} at {path}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise LandedSentenceError(f"the {label} at {path} is not valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise LandedSentenceError(f"the {label} at {path} is not a JSON object")
    return data


# The slots a landed sentence may legitimately occupy: the banner across the
# top, the star line, the slide's one big statement. An ordinary explanation
# card is not one of them: a sentence buried in the middle of the route is the
# route, not the destination.
PROMINENT = ("lead", "sticky", "statement", "banner")

STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "to", "is", "are", "was", "were", "it",
    "its", "in", "on", "at", "for", "with", "they", "them", "their", "this",
    "that", "so", "we", "you", "your", "our", "as", "be", "can", "he", "she",
    "his", "her", "also", "too", "not", "had", "has", "have", "from", "by",
}


def text_of(value) -> str:
    if isinstance(value, dict):
        value = value.get("value", value.get("text", ""))
    text = str(value or "")
    for marker in ("**", "[[", "]]", "{{", "}}", "<<", ">>", "((", "))", "||"):
        text = text.replace(marker, "")
    return " ".join(text.split())


def content_words(text: str) -> list[str]:
    words = [w.strip("'") for w in re.findall(r"[a-z0-9']+", text.lower())]
    return [w for w in words if w and w not in STOPWORDS]


def carries(sentence: str, candidate: str) -> bool:
    """True when `candidate` says what `sentence` says.

    The shorter of the two is measured against the longer, the same way the
    design validator decides whether two lines say one thing. That is what
    lets a board legitimately carry the sentence in fewer words than the
    design wrote it: the slide's line is shorter because a banner holds about
    seventy characters, and every word it does use is the design's. What it
    refuses is a line that says something else, which is drift rather than
    trimming, and the fix for that is to agree the wording in the design
    rather than to leave the two saying different things.
    """
    words_a, words_b = content_words(sentence), content_words(candidate)
    if not words_a or not words_b:
        return False
    shorter, longer = (words_a, words_b) if len(words_a) <= len(words_b) else (words_b, words_a)
    if len(shorter) < 3:
        return text_of(sentence).lower() in text_of(candidate).lower()
    longer_set = set(longer)
    hits = sum(1 for word in shorter if word in longer_set)
    return hits / len(shorter) >= 0.8


def prominent_texts(node, found: list[str]) -> None:
    """Every prominent line on this slide, however deeply the template nests."""
    if isinstance(node, dict):
        for key, value in node.items():
            if key in PROMINENT and not isinstance(value, (dict, list)):
                found.append(text_of(value))
            elif key in PROMINENT and isinstance(value, dict):
                found.append(text_of(value))
            else:
                prominent_texts(value, found)
    elif isinstance(node, list):
        for item in node:
            prominent_texts(item, found)


def teach_units(design: dict) -> list[dict]:
    units = design.get("teachingSequence")
    units = units if isinstance(units, list) else []
    return [
        unit for unit in units
        if isinstance(unit, dict)
        and unit.get("kind") == "teach"
        and isinstance(unit.get("content"), dict)
        and isinstance(unit["content"].get("headline"), str)
        and unit["content"]["headline"].strip()
    ]


def sticky_text(design: dict, ref: str) -> str:
    for entry in design.get("stickyKnowledge") or []:
        if isinstance(entry, dict) and entry.get("id") == ref:
            return text_of(entry.get("text"))
    return ""


def landed_sentence(design: dict, unit: dict) -> str:
    """What this beat lands: the headline, or the sticky fact a takeaway names
    when the beat withholds its sentence until children have reached it."""
    content = unit["content"]
    takeaway = content.get("takeaway")
    if isinstance(takeaway, dict):
        if takeaway.get("kind") == "text" and str(takeaway.get("text") or "").strip():
            return text_of(takeaway["text"])
        if takeaway.get("kind") == "sticky":
            sticky = sticky_text(design, takeaway.get("ref"))
            if sticky:
                return sticky
    return text_of(content["headline"])


def faults(design: dict, spec: dict) -> list[str]:
    slides = spec.get("slides")
    slides = slides if isinstance(slides, list) else []
    by_unit: dict[str, list[dict]] = {}
    for slide in slides:
        if isinstance(slide, dict) and isinstance(slide.get("designUnitId"), str):
            by_unit.setdefault(slide["designUnitId"], []).append(slide)

    problems = []
    for unit in teach_units(design):
        unit_id = unit.get("sourceUnitId")
        sentence = landed_sentence(design, unit)
        unit_slides = by_unit.get(unit_id, [])
        if not unit_slides:
            continue  # a beat with no slide at all is another check's fault
        lines: list[str] = []
        for slide in unit_slides:
            prominent_texts(slide, lines)
        if any(carries(sentence, line) for line in lines):
            continue
        where = "its slide" if len(unit_slides) == 1 else f"any of its {len(unit_slides)} slides"
        problems.append(
            f"{unit_id}: the sentence this beat lands is not on {where}. "
            f"It reads `{sentence}`. Put it where the class reads it: the banner across the top "
            "(`lead`), the star line (`sticky`), or the slide's one big statement. A layout with "
            "no top slot is a fine choice and this sentence still has to be on the board, because "
            "a beat whose landed sentence never appears leaves the class with the discussion and "
            "not the thing to keep"
        )
    return problems


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-design", required=True, type=Path)
    parser.add_argument("--spec", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        design = load(args.lesson_design, "lesson design")
        spec = load(args.spec, "slide specification")
    except LandedSentenceError as exc:
        print(f"LANDED_SENTENCE_ERROR: {exc}")
        return 2
    problems = faults(design, spec)
    for problem in problems:
        print(f"LANDED_SENTENCE_FAULT: {problem}")
    if problems:
        return 1
    print(f"LANDED_SENTENCE_OK: {len(teach_units(design))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
