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


# These are the templates that actually call drawScPanel. A suffix alone
# would incorrectly accept a made-up template that renders no cue.
PANEL_TEMPLATES = {
    "maths-turn-sc", "maths-turn-ref-sc", "maths-your-turn-sc",
    "maths-mtotyt-sc", "writing-turn-ref-sc",
}
NON_RENDERED = {"speakerNotes", "teacherInfo", "slideDesignNotes", "decorations"}


def plain(value) -> str:
    """Presentation markers/line breaks may change; authored words may not."""
    if isinstance(value, dict):
        value = value.get("text", value.get("value", ""))
    text = str(value or "")
    for marker in ("**", "[[", "]]", "{{", "}}", "<<", ">>", "||"):
        text = text.replace(marker, "")
    return " ".join(text.split())


def content_nodes(node):
    if isinstance(node, dict):
        yield node
        for key, value in node.items():
            if key not in NON_RENDERED:
                yield from content_nodes(value)
    elif isinstance(node, list):
        for value in node:
            yield from content_nodes(value)


def panel_matches(panel, source: dict) -> bool:
    """Confirm source content, not just an ID beside an unrelated panel.

    Steps preserve order (inline helpers and a folded sticky line are allowed).
    Tables preserve cells. Labelled sets preserve their labels/text; checking
    their actual diagram geometry belongs to the existing visual review.
    """
    if not isinstance(panel, dict):
        return False
    content = source.get("content") or {}
    nodes = list(content_nodes(panel))
    if source.get("type") == "steps":
        expected = [plain(s) for s in content.get("steps") or []]
        for node in nodes:
            if node.get("type") != "steps":
                continue
            actual = [plain(s) for s in node.get("steps") or []
                      if not plain(s).startswith("✨")]
            # A combined panel may also contain another criterion; the whole
            # source's steps still have to occur in order without omissions.
            if expected and any(actual[i:i + len(expected)] == expected
                                for i in range(len(actual) - len(expected) + 1)):
                return True
        return False
    if source.get("type") == "reference-table":
        expected_headers = [plain(c) for c in content.get("columns") or []]
        expected_rows = [[plain(c) for c in row] for row in content.get("rows") or []]
        return any(
            node.get("type") in {"table", "reference-table"}
            and [plain(c) for c in node.get("headers", node.get("columns", []))] == expected_headers
            and [[plain(c) for c in row] for row in node.get("rows") or []] == expected_rows
            for node in nodes
        )
    # Source-labelled sets can become rows of diagrams, image captions or a
    # table; do not require one physical representation for recognition.
    expected = [plain(item.get(key)) for item in content.get("items") or []
                for key in ("label", "text") if plain(item.get(key))]
    visible = []
    for node in nodes:
        for key in ("text", "value", "label", "caption", "heading", "title"):
            if isinstance(node.get(key), str):
                visible.append(plain(node[key]))
        if node.get("type") in {"table", "reference-table"}:
            visible.extend(plain(c) for c in node.get("headers", node.get("columns", [])))
            visible.extend(plain(c) for row in node.get("rows") or [] for c in row)
    return bool(expected) and all(text in visible for text in expected)


def flag_owners(node, path="", hidden=False):
    """Return all flags, including misplaced ones, rather than ignoring them."""
    if isinstance(node, dict):
        if node.get("flipchart") is True:
            yield path or "/", node, hidden
        for key, value in node.items():
            yield from flag_owners(value, f"{path}/{key}", hidden or key in NON_RENDERED)
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from flag_owners(value, f"{path}/{index}", hidden)


def run(design_path: Path, spec_path: Path) -> int:
    design = load(design_path, "lesson design")
    spec = load(spec_path, "slide specification")
    slides = spec.get("slides")
    raw_criteria = design.get("successCriteria")
    if not isinstance(slides, list) or not all(isinstance(s, dict) for s in slides):
        raise HandoffError("the slide specification must have an array of slide objects")
    if not isinstance(raw_criteria, list):
        raise HandoffError("the lesson design must have a successCriteria array")
    criteria = {}
    for source in raw_criteria:
        if (not isinstance(source, dict) or not isinstance(source.get("id"), str)
                or not isinstance(source.get("drawLive"), bool)
                or not isinstance(source.get("content"), dict)):
            raise HandoffError("each success criterion needs an id, drawLive boolean and content object")
        if source["id"] in criteria:
            raise HandoffError(f"duplicate success criterion: {source['id']}")
        criteria[source["id"]] = source
    marked = {key for key, source in criteria.items() if source["drawLive"]}
    reached = set()
    failures = []
    for location, owner, hidden in flag_owners(spec):
        parts = location.strip("/").split("/")
        if len(parts) < 2 or parts[0] != "slides" or not parts[1].isdigit():
            failures.append(f"flipchart at {location} is not on a rendered slide panel")
            continue
        index = int(parts[1])
        slide = slides[index]
        is_slide = len(parts) == 2
        if hidden or (is_slide and slide.get("template") not in PANEL_TEMPLATES) or (
                not is_slide and owner.get("type") != "sc-panel"):
            failures.append(f"flipchart at {location} is not a rendered cue owner; use a *-sc slide or sc-panel")
            continue
        refs = slide.get("successCriteriaRefs") or []
        if not isinstance(refs, list):
            raise HandoffError(f"slide {index + 1} successCriteriaRefs must be an array")
        panel = owner.get("criteria") or owner.get("content")
        ref = owner.get("criteriaRef")
        if ref is not None:
            candidates = [ref] if isinstance(ref, str) and ref in refs and ref in criteria else []
        else:
            candidates = [key for key in refs if isinstance(key, str) and key in criteria
                          and panel_matches(panel, criteria[key])]
            candidates = list(dict.fromkeys(candidates))
        if len(candidates) != 1:
            failures.append(f"flipchart at {location} has no unambiguous source; set criteriaRef to the displayed criterion in successCriteriaRefs")
            continue
        ref = candidates[0]
        if ref not in marked:
            reason = "no criteria in the design is marked drawLive" if not marked else f"{ref} is not marked drawLive"
            failures.append(f"flipchart at {location}: {reason}")
            continue
        if not panel_matches(panel, criteria[ref]):
            failures.append(f"flipchart at {location} names {ref} but its panel does not carry that criterion's content")
            continue
        reached.add(ref)

    for ref in sorted(marked - reached):
        showing = [str(i) for i, slide in enumerate(slides, 1)
                   if ref in (slide.get("successCriteriaRefs") or [])]
        if showing:
            failures.append(f"{ref} is marked drawLive but has no correctly bound flipchart cue (slides {', '.join(showing)}); set it beside its criteria on the *-sc slide or its sc-panel")
        else:
            failures.append(f"{ref} is marked drawLive but no slide references it, so its cue has nowhere to appear")
    if failures:
        print("DRAWLIVE_HANDOFF_FAILED", file=sys.stderr)
        for message in failures:
            print(f"- {message}", file=sys.stderr)
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
