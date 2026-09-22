# -*- coding: utf-8 -*-
"""Build a Teacher Voice evaluator fixture from the real Design Review class view.

The production reviewer never sees field names or surface labels. It reads the
`## As the class meets it` section of `design-review-view.md`: plain strings,
grouped under the beat label they belong to, in lesson order, with spoken
scripts marked only by their `Teacher says:` prefix.

This module derives the fixture from `build_class_view` in the production
packet script, so an experiment reads exactly the strings production prints,
with the same boundaries. Nothing here changes production behaviour, and the
packet script is imported, never edited.

Beat labels are section headings in that view, not strings the reviewer judges,
so they are not fixture cases. The same wording may reach a slide as its title
downstream; that is a separate surface whose voice status is unsettled.

Usage:
    python class_view_fixture.py <lesson-design.json> <out.json> <id-prefix>
"""
from __future__ import annotations

import importlib.util
import io
import json
import sys
from pathlib import Path

PACKET = (Path(__file__).resolve().parents[2] / "scripts" / "design-review-packet.py")


def load_packet():
    """Import the production packet script by path (its name is not importable)."""
    spec = importlib.util.spec_from_file_location("design_review_packet", PACKET)
    module = importlib.util.module_from_spec(spec)
    sys.modules["design_review_packet"] = module
    spec.loader.exec_module(module)
    return module


def class_view_blocks(design: dict) -> list[tuple[str, list[str]]]:
    """Re-read the production view's own output back into (label, strings).

    Parsing the rendered lines rather than calling the private block builder
    keeps this honest: if the packet changes how it prints, the fixture moves
    with it and the tests notice.
    """
    packet = load_packet()
    lines, count = packet.build_class_view(design)
    blocks: list[tuple[str, list[str]]] = []
    label: str | None = None
    current: list[str] = []
    buffer: list[str] = []

    def flush_string() -> None:
        if buffer:
            current.append("\n".join(buffer))
            buffer.clear()

    for line in lines[4:]:  # skip heading, blank, count line, blank
        if line.startswith("### "):
            flush_string()
            if label is not None:
                blocks.append((label, current))
            label, current = line[4:], []
        elif line.startswith("> "):
            buffer.append(line[2:])
        else:
            flush_string()
    flush_string()
    if label is not None:
        blocks.append((label, current))

    total = sum(len(strings) for _, strings in blocks)
    if total != count:
        raise AssertionError(
            "parsed %d strings but the view states %d; the packet's print format moved"
            % (total, count)
        )
    return blocks


def build(design: dict, prefix: str) -> dict:
    lesson = design["lesson"]
    year = lesson["yearGroup"]
    cases = []
    for label, strings in class_view_blocks(design):
        for text in strings:
            cases.append({
                "id": "%s-%03d" % (prefix, len(cases) + 1),
                "year_group": year,
                "subject": lesson.get("subject"),
                "beat": label,
                "wording": text,
            })
    return {
        "version": 1,
        "set": "class-view",
        "description": (
            "Year %s %s (%s). Every string the production Design Review class view "
            "prints, in lesson order, with the same boundaries. Beat labels are "
            "section headings, not cases. No surface labels: the reviewer decides "
            "what each string is, as it does in production. No gold labels exist."
            % (year, lesson.get("subject"), lesson.get("lo"))
        ),
        "source_design": None,
        "cases": cases,
    }


def main(design_path: str, out_path: str, prefix: str) -> None:
    design = json.load(io.open(design_path, encoding="utf-8"))
    payload = build(design, prefix)
    payload["source_design"] = design_path.replace("\\", "/")
    with io.open(out_path, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print("cases:", len(payload["cases"]))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
