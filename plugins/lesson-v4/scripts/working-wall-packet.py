#!/usr/bin/env python3
"""Build the Working Wall Designer's packet: a view of the lesson and a reference.

The wall designer used to read its 88 KB role, the complete wall preferences
and the complete wall visual language, then hunt through the lesson design,
the slide spec and the photo contract for the handful of strings and figures a
card could carry. That hunt is where paraphrase happens: the role's own rule is
that a success-criteria step retyped from memory is a card contradicting the
board it hangs beside. It is also most of what the worker reads, on every run,
to produce one card.

So, as the Design Reviewer already has, the wall designer now receives two
generated files:

- `working-wall-view.md`: every string a card could carry, byte for byte and
  with its source ID (success criteria with any flipchart flag, sticky
  knowledge, misconceptions with corrective facts, sentence stems, vocabulary
  with its needed teaching visuals, the modelled units, headline facts), every
  figure exactly as `lesson.json` rendered it, the photograph filenames with
  their terminal state where known, and the design's recorded wall decision.
- `working-wall-reference.md`: the wall-worthy test and the wording and visual
  rules every card needs, plus the contract, example, criteria and default
  orientation of only the card families this lesson triggers, and the specs
  of only the drawn primitives it uses. Cut by exact heading from the two wall
  references and from `working-wall-card-contracts.md`, with the card families
  taken from the builder's own registry so the reference cannot drift from
  what the engine draws.

Trigger table (a family is offered when its trigger holds; when in doubt the
trigger is generous, because an extra section costs bytes and a missing one
costs a card):

| Card family        | Trigger                                                   |
|--------------------|-----------------------------------------------------------|
| stickyKnowledge    | always                                                    |
| workedExample      | a modelled unit, a steps-shaped success criterion, a      |
|                    | My Turn / Our Turn unit, or a Skill-based structure       |
| misconception      | the design names at least one misconception               |
| sentenceStem       | any unit or worksheet block carries sentence stems        |
| vocabDefinition    | at least one vocabulary entry                             |
| vocabChips         | at least four vocabulary entries                          |
| referenceTable     | a rendered table on the slides, a representation or       |
|                    | worksheet block described as a table                      |
| labelledDiagram    | a rendered chart, clock, grid map, label diagram or other |
|                    | drawn primitive the wall can reproduce, or a              |
|                    | representation about reading a chart, map or diagram      |
| photoMapOverview,  | the photo contract promises at least one photograph       |
| heroCallouts,      |                                                           |
| causeCards         |                                                           |
| equivalenceGrid    | representations or vocabulary mention equivalence,        |
|                    | decimals or percentages                                   |
| mnemonicPoster     | any text names a mnemonic (RUCSAC, BIDMAS, BODMAS,        |
|                    | BUS STOP, or the word itself)                             |
| sectionHeading,    | never offered by evidence: wall furniture needs an        |
| banner             | explicit teacher request, and the reference says where    |
|                    | their contracts live                                      |

Primitives are offered when their type appears in `lesson.json` or their name
appears in a representation's text; a lesson with no slide spec is offered all
of them.

Usage:
    python3 working-wall-packet.py prepare \
        --plugin-root PATH --working-dir PATH \
        --lesson-design PATH [--lesson PATH] [--photo-requirements PATH] \
        --view-output PATH --reference-output PATH --receipt-output PATH

Prints exactly `WORKING_WALL_PACKET_OK` on success, otherwise one
`WORKING_WALL_PACKET_ERROR: <reason>` line and exit status 1.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path


class PacketError(Exception):
    """A packet that could not be built; the reason is the message."""


# ---------------------------------------------------------------------------
# Registries: the engine is the source of truth for what a wall can hold.

CARD_FAMILY_ORDER = (
    "photoMapOverview",
    "heroCallouts",
    "causeCards",
    "diagramSection",
    "stepByStep",
    "referenceTable",
    "workedExample",
    "labelledDiagram",
    "stickyKnowledge",
    "sentenceStem",
    "misconception",
    "vocabDefinition",
    "vocabChips",
    "equivalenceGrid",
    "mnemonicPoster",
    "sectionHeading",
    "banner",
)

FURNITURE = ("sectionHeading", "banner")

# Slide objects that lay text out rather than draw a figure. Everything else in
# `lesson.json` is copied into the view as the board drew it.
LAYOUT_TYPES = {"text", "stack", "row", "spacer"}

# Rendered slide types that mean the lesson is about reading a diagram.
DIAGRAM_READING_TYPES = {
    "pictogram",
    "bar-chart",
    "tally-chart",
    "line-graph",
    "clock",
    "grid-map",
    "label-diagram",
    "place-value-chart",
    "coordinate-grid",
    "map",
}

MNEMONIC_RE = re.compile(r"\b(mnemonic|RUCSAC|BIDMAS|BODMAS|BUS ?STOP|KFC)\b", re.I)
EQUIVALENCE_RE = re.compile(r"equivalen|decimal|per ?cent", re.I)
TABLE_RE = re.compile(r"\btable\b", re.I)
DIAGRAM_READING_RE = re.compile(
    r"\bread(?:ing)?\b.{0,40}\b(chart|graph|pictogram|clock|map|diagram|grid reference)",
    re.I,
)

PREFERENCE_SECTIONS_ALWAYS = (
    "The load-bearing principle: a card is something the teacher can point at",
    "Match the lesson's visual supports",
    "Card titles — fixed wording",
    "Wording style — short, concrete, self-contained",
    "When to skip a card",
    "How much text one body item holds",
    "When to combine items on one card",
)

PREFERENCE_SECTIONS_BY_FAMILY = {
    "workedExample": ("Step labels in worked examples",),
    "sentenceStem": ("Sentence stem formatting",),
    "misconception": ("Misconception cards",),
    "referenceTable": ("Reference table cards",),
    "vocabChips": ("Vocab chip cards — wording and selection",),
    "banner": ("Banner cards — wording and selection",),
    "sectionHeading": ("Section heading cards — wording and selection",),
}

VISUAL_SECTIONS_ALWAYS = (
    "Consistent identity, varied learning shapes",
    "The load-bearing principle: this is classroom signage, not a worksheet",
    "Choose visuals for the card's learning",
    "The six design moves the wall is built on",
    "What this means for your decisions",
    "When to attach a `visual`",
    "How the card types serve the visual language",
    "Anti-patterns — what breaks the visual language",
)

# Subsections of "When to attach a visual" that are cut only when triggered.
VISUAL_SUBSECTIONS_CONDITIONAL = {
    "Reach for primitive variants when the lesson is teaching the diagram itself": "primitives",
    "The anatomy poster — when the lesson is learning to *read* a diagram (`labelledDiagram`)": "labelledDiagram",
    'When the diagram should fill the card — `visualScale: "dominant"`': "labelledDiagram",
}

VISUAL_SECTIONS_BY_FAMILY = {
    "sectionHeading": ("Section heading cards — zoners, not teaching cards",),
    "banner": ("Banner cards — the wall's own title strip",),
}


# ---------------------------------------------------------------------------
# Small helpers

def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path, label: str) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except OSError as error:
        raise PacketError(f"{label} cannot be read: {path} ({error})") from error
    except json.JSONDecodeError as error:
        raise PacketError(f"{label} is not valid JSON: {path} ({error})") from error
    if not isinstance(data, dict):
        raise PacketError(f"{label} must be a JSON object: {path}")
    return data


def compact(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))


def walk(node, visit, path: str = ""):
    """Depth-first over a JSON tree, calling visit(node, path) on every dict."""
    if isinstance(node, dict):
        visit(node, path)
        for key, value in node.items():
            walk(value, visit, f"{path}/{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            walk(value, visit, f"{path}/{index}")


def all_strings(node) -> list[str]:
    found: list[str] = []

    def visit(item, _path):
        for value in item.values():
            if isinstance(value, str):
                found.append(value)

    walk(node, visit)
    return found


def registry_keys(source: str, opener: str, pattern: str, label: str) -> list[str]:
    """Keys of a JS object literal, read from the engine so nothing can drift."""
    start = source.find(opener)
    if start < 0:
        raise PacketError(f"{label} registry not found in the engine source")
    end = source.find("};", start)
    keys = re.findall(pattern, source[start:end], re.M)
    if not keys:
        raise PacketError(f"{label} registry is empty in the engine source")
    return keys


def card_families(plugin_root: Path) -> list[str]:
    build = plugin_root / "working-wall-html" / "build.js"
    try:
        source = build.read_text(encoding="utf-8")
    except OSError as error:
        raise PacketError(f"wall builder cannot be read: {build} ({error})") from error
    return registry_keys(source, "const RENDERERS = {", r"^\s+(\w+): render\w+,", "card family")


def visual_primitives(plugin_root: Path) -> list[str]:
    visuals = plugin_root / "working-wall-html" / "src" / "visuals.js"
    try:
        source = visuals.read_text(encoding="utf-8")
    except OSError as error:
        raise PacketError(f"wall visual registry cannot be read: {visuals} ({error})") from error
    return registry_keys(source, "const VISUAL_KEY_FNS = {", r'^\s+"?([\w-]+)"?:\s*\w+Key,', "visual primitive")


# ---------------------------------------------------------------------------
# Cutting a markdown file by exact heading

def sections(text: str) -> list[dict]:
    """Every heading with its level, exact title and body (to the next heading
    of the same or a higher level). Nested subsections are listed too, so a
    caller can cut a `##` section with or without a named `###` child."""
    lines = text.split("\n")
    heads = []
    for index, line in enumerate(lines):
        match = re.match(r"^(#{2,3}) (.+?)\s*$", line)
        if match:
            heads.append((index, len(match.group(1)), match.group(2)))
    out = []
    for position, (index, level, title) in enumerate(heads):
        end = len(lines)
        for later_index, later_level, _ in heads[position + 1:]:
            if later_level <= level:
                end = later_index
                break
        out.append({"level": level, "title": title, "start": index, "end": end})
    return out


class HeadingCutter:
    def __init__(self, path: Path, label: str):
        self.path = path
        self.label = label
        try:
            self.text = path.read_text(encoding="utf-8")
        except OSError as error:
            raise PacketError(f"{label} cannot be read: {path} ({error})") from error
        self.lines = self.text.split("\n")
        self.index = {section["title"]: section for section in sections(self.text)}

    def cut(self, title: str, *, drop_children: set[str] = frozenset()) -> str:
        section = self.index.get(title)
        if section is None:
            raise PacketError(f"{self.label} has no heading {title!r}; the packet cannot be cut")
        body = self.lines[section["start"]:section["end"]]
        if drop_children:
            kept = []
            skipping = False
            for line in body:
                match = re.match(r"^(#{3,}) (.+?)\s*$", line)
                if match:
                    skipping = match.group(2) in drop_children
                if not skipping:
                    kept.append(line)
            body = kept
        return "\n".join(body).rstrip() + "\n"


# ---------------------------------------------------------------------------
# Reading the lesson

def source_units(design: dict) -> list[dict]:
    units = []
    starter = design.get("starter")
    if isinstance(starter, dict):
        units.append(starter)
    for unit in design.get("teachingSequence") or []:
        if isinstance(unit, dict):
            units.append(unit)
    ending = design.get("ending")
    if isinstance(ending, dict) and ending.get("included") and isinstance(ending.get("beat"), dict):
        units.append(ending["beat"])
    return units


def rendered_objects(lesson: dict | None) -> list[tuple[int, str, dict]]:
    """Every drawn object on the slides: (slide number, path, object)."""
    found: list[tuple[int, str, dict]] = []
    if not lesson:
        return found
    for number, slide in enumerate(lesson.get("slides") or [], 1):
        def visit(item, path, number=number):
            kind = item.get("type")
            if isinstance(kind, str) and kind not in LAYOUT_TYPES:
                found.append((number, path or "/", item))

        walk(slide, visit)
    return found


def terminal_states(working_dir: Path) -> dict[str, str]:
    states: dict[str, str] = {}
    receipts = working_dir / "orchestration-receipts" / "picture-terminal"
    if not receipts.is_dir():
        return states
    for path in sorted(receipts.glob("*.json")):
        try:
            receipt = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        filename = receipt.get("filename")
        state = receipt.get("terminalState")
        if isinstance(filename, str) and isinstance(state, str):
            states[filename] = state
    return states


def triggers_for(design: dict, lesson: dict | None, photos: list[dict], primitives: list[str]) -> dict:
    units = source_units(design)
    criteria = design.get("successCriteria") or []
    vocabulary = design.get("vocabulary") or []
    structure = (design.get("lesson") or {}).get("structure")
    modelled = (
        any(unit.get("modellingState") for unit in units)
        or any(isinstance(item, dict) and item.get("type") == "steps" for item in criteria)
        or any(unit.get("kind") in {"my-turn", "our-turn"} for unit in units)
        or structure == "Skill-based"
    )
    stems = False
    for unit in units:
        content = unit.get("content")
        if isinstance(content, dict) and content.get("sentenceStems"):
            stems = True
    for block in (design.get("worksheet") or {}).get("contentBlocks") or []:
        if isinstance(block, dict) and block.get("sentenceStems"):
            stems = True

    representation_text = " ".join(all_strings(design.get("representations") or []))
    vocabulary_text = " ".join(all_strings(vocabulary))
    worksheet_text = " ".join(all_strings(design.get("worksheet") or {}))
    rendered = rendered_objects(lesson)
    rendered_types = {item.get("type") for _, _, item in rendered}

    used_primitives = [key for key in primitives if key in rendered_types]
    for key in primitives:
        if key in used_primitives:
            continue
        words = [w for w in re.split(r"[-_]|(?=[A-Z])", key) if w]
        if words and all(re.search(rf"\b{re.escape(word)}", representation_text, re.I) for word in words):
            used_primitives.append(key)
    # A method the board recorded only as a method frame may go on the wall
    # drawn onto its example's own digits (visual language, Choose visuals,
    # idea 1), so the digit cards' contract is offered whenever a frame is on
    # the board. Without it the 2 October 2026 divisibility wall was told the
    # route existed and handed no fields to take it.
    if "method-frame" in rendered_types and "digit-cards" in primitives and "digit-cards" not in used_primitives:
        used_primitives.append("digit-cards")
    if lesson is None:
        used_primitives = list(primitives)

    table = (
        bool(rendered_types & {"table", "data-table", "recording-table"})
        or bool(TABLE_RE.search(representation_text))
        or bool(TABLE_RE.search(worksheet_text))
    )
    diagram_reading = (
        bool(rendered_types & DIAGRAM_READING_TYPES)
        or bool(used_primitives)
        or bool(DIAGRAM_READING_RE.search(representation_text))
    )
    everything = " ".join(all_strings(design))
    return {
        "modelled": modelled,
        "misconceptions": bool(design.get("misconceptions")),
        "stems": stems,
        "vocabularyCount": len(vocabulary),
        "photoCount": len(photos),
        "table": table,
        "diagramReading": diagram_reading,
        "equivalence": bool(EQUIVALENCE_RE.search(representation_text + " " + vocabulary_text)),
        "mnemonic": bool(MNEMONIC_RE.search(everything)),
        "primitives": used_primitives,
    }


def offered_families(triggers: dict, families: list[str]) -> list[str]:
    rules = {
        "stickyKnowledge": True,
        "workedExample": triggers["modelled"],
        "misconception": triggers["misconceptions"],
        "sentenceStem": triggers["stems"],
        "vocabDefinition": triggers["vocabularyCount"] >= 1,
        "vocabChips": triggers["vocabularyCount"] >= 4,
        "referenceTable": triggers["table"],
        "labelledDiagram": triggers["diagramReading"],
        "photoMapOverview": triggers["photoCount"] >= 1,
        "heroCallouts": triggers["photoCount"] >= 1,
        "causeCards": triggers["photoCount"] >= 1,
        # Offered whenever the lesson draws anything. It is the only family
        # that puts several drawn figures on one sheet, so a lesson whose
        # pictures are diagrams must be able to see it.
        "diagramSection": triggers["diagramReading"],
        # A method or a sequence told stage by stage, each stage beside its
        # own picture: any lesson that models a method, draws, or has
        # photographs can use it.
        "stepByStep": bool(triggers["modelled"] or triggers["diagramReading"] or triggers["photoCount"] >= 1),
        "equivalenceGrid": triggers["equivalence"],
        "mnemonicPoster": triggers["mnemonic"],
        "sectionHeading": False,
        "banner": False,
    }
    unknown = [family for family in families if family not in rules]
    if unknown:
        raise PacketError(
            "the wall builder renders card families this packet has no trigger for: "
            + ", ".join(unknown)
        )
    ordered = [family for family in CARD_FAMILY_ORDER if family in families]
    ordered += [family for family in families if family not in ordered]
    return [family for family in ordered if rules[family]]


# ---------------------------------------------------------------------------
# The view

def bullet(label: str, value) -> str:
    return f"- {label}: {value}"


def build_view(
    design: dict,
    lesson: dict | None,
    photos: list[dict],
    states: dict[str, str],
    working_dir: Path,
    lesson_absent_reason: str | None,
    unit_context: str | None = None,
) -> str:
    meta = design.get("lesson") or {}
    lines = ["# Working Wall View", ""]
    lines.append(
        "Generated deterministically for this run. Every string below is copied "
        "byte for byte from the lesson's own files and carries the ID it came "
        "from, so a card can quote it exactly. Nothing here is a paraphrase, and "
        "nothing on a card should be either."
    )
    lines.append("")

    # The wall's own question is forward-looking, so the lessons around this
    # one come first in the view. Without them the designer was deciding
    # whether a card would still be wanted in two weeks while looking at a
    # single lesson, and two consecutive number-line lessons each printed
    # their own "find the scale" sheet.
    lines.extend(["## Where this lesson sits", ""])
    if unit_context:
        lines.append(unit_context.strip())
        lines.append("")
        lines.append(
            "Answer the point-at test against the lessons named above: name the one "
            "where the teacher would stand at this card and say \"remember when\"."
        )
    else:
        lines.append(
            "This run has no plan, so the lessons either side are unknown. You cannot "
            "name the later lesson the point-at test asks for, so put up only support "
            "that is durable by its nature - a representation, a structure that repeats "
            "at several scales, a disciplinary move the subject keeps using - and write "
            "`cards: []` for anything that is this lesson's own technique."
        )
    lines.append("")
    lines.extend(earlier_wall_section(working_dir))
    lines.extend(["## Lesson", ""])
    for key in ("structure", "subject", "yearGroup", "lo", "displayedLo", "durationMinutes"):
        if key in meta:
            lines.append(bullet(key, compact(meta[key])))
    lines.append(bullet("lessonSlug", working_dir.name))
    lines.append("")

    opportunities = design.get("resourceOpportunities")
    if isinstance(opportunities, dict) and isinstance(opportunities.get("workingWall"), dict):
        lines.extend(["## The design's own wall decision", ""])
        lines.append(
            "Recorded by the lesson designer and checked by the reviewer. It is "
            "evidence, not the verdict: the wall-worthy test is still yours."
        )
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(opportunities["workingWall"], ensure_ascii=False, indent=2))
        lines.append("```")
        lines.append("")

    lines.extend(["## Success criteria", ""])
    criteria = design.get("successCriteria") or []
    if not criteria:
        lines.append("(none)")
    for item in criteria:
        if not isinstance(item, dict):
            continue
        flags = []
        for flag in ("drawLive", "flipchart"):
            if flag in item:
                flags.append(f"{flag}: {compact(item[flag])}")
        lines.append(f"- {item.get('id')} ({item.get('type')}{'; ' + '; '.join(flags) if flags else ''})")
        content = item.get("content")
        steps = content.get("steps") if isinstance(content, dict) else None
        if isinstance(steps, list):
            for number, step in enumerate(steps, 1):
                lines.append(f"  {number}. {step}")
        elif content is not None:
            lines.append(f"  content: {compact(content)}")
    lines.append("")

    lines.extend(["## Sticky knowledge", ""])
    sticky = design.get("stickyKnowledge") or []
    if not sticky:
        lines.append("(none)")
    for item in sticky:
        if isinstance(item, dict):
            lines.append(f"- {item.get('id')}: {item.get('text')}")
    lines.append("")

    lines.extend(["## Misconceptions", ""])
    misconceptions = design.get("misconceptions") or []
    if not misconceptions:
        lines.append("(none: the design states that no misconception card can be sourced)")
    for item in misconceptions:
        if not isinstance(item, dict):
            continue
        lines.append(f"- {item.get('id')}")
        for key in ("belief", "correctiveFact", "strategy", "reason"):
            if key in item:
                lines.append(f"  - {key}: {item[key]}")
    lines.append("")

    lines.extend(["## Vocabulary", ""])
    vocabulary = design.get("vocabulary") or []
    if not vocabulary:
        lines.append("(none)")
    for item in vocabulary:
        if not isinstance(item, dict):
            continue
        lines.append(f"- {item.get('id')}: {item.get('term')}")
        lines.append(f"  - definition: {item.get('definition')}")
        lines.append(f"  - visual: {compact(item.get('visual'))}")
    lines.append("")

    lines.extend(["## Sentence stems", ""])
    any_stem = False
    for unit in source_units(design):
        content = unit.get("content")
        if isinstance(content, dict) and content.get("sentenceStems"):
            any_stem = True
            lines.append(f"- {unit.get('sourceUnitId')} ({unit.get('label')})")
            for stem in content["sentenceStems"]:
                lines.append(f"  - {stem}")
    for index, block in enumerate((design.get("worksheet") or {}).get("contentBlocks") or []):
        if isinstance(block, dict) and block.get("sentenceStems"):
            any_stem = True
            lines.append(f"- worksheet contentBlocks/{index}")
            for stem in block["sentenceStems"]:
                lines.append(f"  - {stem}")
    if not any_stem:
        lines.append("(none)")
    lines.append("")

    lines.extend(["## Headline facts and takeaways, in lesson order", ""])
    for unit in source_units(design):
        content = unit.get("content")
        if not isinstance(content, dict):
            continue
        parts = []
        for key in ("headline", "explanation", "takeaway", "task", "prompt", "question", "discussionQuestion"):
            if content.get(key) is not None:
                parts.append(f"{key}: {compact(content[key])}")
        if parts:
            lines.append(f"- {unit.get('sourceUnitId')} ({unit.get('kind')}, {unit.get('label')}): " + "; ".join(parts))
    lines.append("")

    lines.extend(["## Modelled units", ""])
    lines.append(
        "Units the design marks as modelled or as My Turn / Our Turn: the "
        "question, the modelled answer and the criteria they carry."
    )
    lines.append("")
    any_model = False
    for unit in source_units(design):
        if not (unit.get("modellingState") or unit.get("kind") in {"my-turn", "our-turn"}):
            continue
        any_model = True
        lines.append(f"- {unit.get('sourceUnitId')} ({unit.get('kind')}, {unit.get('label')})")
        lines.append(f"  - modellingState: {compact(unit.get('modellingState'))}")
        lines.append(f"  - pupilInstruction: {compact(unit.get('pupilInstruction'))}")
        lines.append(f"  - content: {compact(unit.get('content'))}")
        lines.append(f"  - answer: {compact(unit.get('answer'))}")
        lines.append(f"  - successCriteriaRefs: {compact(unit.get('successCriteriaRefs'))}")
        lines.append(f"  - representationRefs: {compact(unit.get('representationRefs'))}")
    if not any_model:
        lines.append("(none)")
    lines.append("")

    lines.extend(["## Representations", ""])
    representations = design.get("representations") or []
    if not representations:
        lines.append("(none: the lesson is plain text)")
    for representation in representations:
        if not isinstance(representation, dict):
            continue
        lines.append(f"- {representation.get('id')}: {representation.get('name')}")
        lines.append(f"  - purpose: {representation.get('purpose')}")
        for configuration in representation.get("configurations") or []:
            if isinstance(configuration, dict):
                lines.append(f"  - configuration {compact(configuration)}")
    lines.append("")

    lines.extend(["## Figures as the board drew them", ""])
    if lesson is None:
        lines.append(
            f"No slide spec was available ({lesson_absent_reason}). The figures above "
            "are the design's descriptions; there is no board for a card to match."
        )
    else:
        objects = rendered_objects(lesson)
        if not objects:
            lines.append("(the slides carry no drawn figure)")
        lines.append(
            "Each object below is copied from `lesson.json` as rendered. A wall "
            "figure reuses one of these kinds of drawing, field for field; it is "
            "never re-derived from the prose. It may hold different numbers only "
            "to show the card's own worked example, or to join one worked "
            "example's steps into its whole journey (visual language, Choose "
            "visuals for the card's learning)."
        )
        lines.append("")
        for number, path, item in objects:
            lines.append(f"- slide {number} `{path}`: {compact(item)}")
    lines.append("")

    lines.extend(["## Photographs", ""])
    if not photos:
        lines.append("(the contract promises no photographs)")
    if photos:
        # The role file is at its size limit, and this is where the designer
        # meets the photographs, so the pointer rides with the list.
        lines.extend([
            "If your viewer refuses one of these when you open it, read "
            "`[PLUGIN_ROOT]/references/picture-you-cannot-see.md` before deciding anything that "
            "depends on what is in it: the cause is the file's layout, not its size.",
            "",
        ])
    for photo in photos:
        filename = photo.get("filename")
        state = states.get(filename)
        on_disk = isinstance(filename, str) and (working_dir / filename).is_file()
        status = state or ("on disk" if on_disk else "promised, not yet terminal")
        lines.append(f"- {photo.get('id')}: `{filename}` [{status}]")
        for key in ("subject", "use", "essential", "pedagogical_constraint"):
            if key in photo:
                lines.append(f"  - {key}: {compact(photo[key])}")
    lines.append("")

    notes = design.get("slideDesignNotes") or []
    if notes:
        lines.extend(["## Slide design notes", ""])
        lines.extend(f"- {note}" for note in notes)
        lines.append("")
    flags = design.get("flagsForTeacher") or []
    if flags:
        lines.extend(["## Existing flags for the teacher", ""])
        lines.extend(f"- {flag}" for flag in flags)
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


# ---------------------------------------------------------------------------
# The reference

def build_reference(
    plugin_root: Path,
    families: list[str],
    offered: list[str],
    primitives: list[str],
    used_primitives: list[str],
    triggers: dict,
) -> tuple[str, dict[str, Path]]:
    references = plugin_root / "references"
    paths = {
        "cardContracts": references / "working-wall-card-contracts.md",
        "preferences": references / "working-wall-preferences.md",
        "visualLanguage": references / "working-wall-visual-language.md",
    }
    contracts = HeadingCutter(paths["cardContracts"], "working-wall-card-contracts.md")
    preferences = HeadingCutter(paths["preferences"], "working-wall-preferences.md")
    visual = HeadingCutter(paths["visualLanguage"], "working-wall-visual-language.md")

    missing_contracts = [family for family in families if family not in contracts.index]
    if missing_contracts:
        raise PacketError(
            "the wall builder renders card families the contracts file does not "
            "describe: " + ", ".join(missing_contracts)
        )
    missing_primitives = [key for key in primitives if key not in contracts.index]
    if missing_primitives:
        raise PacketError(
            "the wall builder draws primitives the contracts file does not "
            "describe: " + ", ".join(missing_primitives)
        )

    out = ["# Working Wall Reference", ""]
    out.append(
        "Generated deterministically for this run from the wall's own reference "
        "files and the builder's registries, cut by exact heading. It carries the "
        "rules every card needs and the contracts for the card families and drawn "
        "primitives this lesson's evidence triggers. The full files are named at "
        "the end; open one only when you want a card family this packet did not "
        "offer, and say so in `rationaleNote`."
    )
    out.append("")
    out.append(contracts.cut("The wall-worthy test"))

    out.append("## Wording and skipping rules (working-wall-preferences.md)")
    out.append("")
    for title in PREFERENCE_SECTIONS_ALWAYS:
        out.append(preferences.cut(title))

    out.append("## Visual language (working-wall-visual-language.md)")
    out.append("")
    # The renderer's own moves (title bar, font, panels, colour coding) are
    # facts about the builder, not decisions for the designer, so their
    # subsections stay in the full file.
    conditional_children = set(VISUAL_SUBSECTIONS_CONDITIONAL) | {
        title for title in visual.index if title.endswith("(renderer's job)")
    }
    for title in VISUAL_SECTIONS_ALWAYS:
        out.append(visual.cut(title, drop_children=conditional_children))
    for title, trigger in VISUAL_SUBSECTIONS_CONDITIONAL.items():
        wanted = (trigger == "primitives" and bool(used_primitives)) or trigger in offered
        if wanted:
            out.append(visual.cut(title))

    out.append(contracts.cut("Every card"))

    out.append("## Card families this lesson can use")
    out.append("")
    out.append(
        "Each family below is offered because the lesson's own evidence triggers "
        "it. Its criteria must all pass before it earns a card."
    )
    out.append("")
    for family in offered:
        out.append(contracts.cut(family))
        for title in PREFERENCE_SECTIONS_BY_FAMILY.get(family, ()):
            out.append(preferences.cut(title))
        for title in VISUAL_SECTIONS_BY_FAMILY.get(family, ()):
            out.append(visual.cut(title))

    not_offered = [family for family in families if family not in offered]
    out.append("## Card families not offered")
    out.append("")
    if not_offered:
        out.append(
            "Nothing in this lesson triggered these. Wall furniture (`sectionHeading`, "
            "`banner`) is never offered by evidence: it needs an explicit request "
            "from the teacher or the spawn prompt. Their contracts are in "
            f"`{paths['cardContracts']}` under `### <family>`, with their wording "
            f"rules in `{paths['preferences']}` and `{paths['visualLanguage']}`."
        )
        out.append("")
        for family in not_offered:
            out.append(f"- `{family}`")
    else:
        out.append("(every family the builder renders is offered)")
    out.append("")

    out.append("## Visual primitives this lesson uses")
    out.append("")
    if used_primitives:
        out.append(
            "Drawn by the builder from a spec. Each sits to the right of the panel."
        )
        out.append("")
        for key in used_primitives:
            out.append(contracts.cut(key))
    else:
        out.append(
            "The slides draw none of the wall's primitives. Every primitive's spec "
            f"is in `{paths['cardContracts']}` under `## Visual primitives`."
        )
        out.append("")

    out.append("## Triggers")
    out.append("")
    out.append("```json")
    out.append(json.dumps(triggers, ensure_ascii=False, indent=2))
    out.append("```")
    out.append("")
    out.append("## Full files")
    out.append("")
    for key, path in paths.items():
        out.append(f"- {key}: `{path}`")
    out.append("")
    out.append(
        "Open a full file only when you want a card family this packet did not "
        "offer, or a rule you cannot find above, and say so in `rationaleNote`."
    )
    return "\n".join(out).rstrip() + "\n", paths


# ---------------------------------------------------------------------------

def prepare(args: argparse.Namespace) -> int:
    plugin_root = Path(args.plugin_root).resolve()
    working_dir = Path(args.working_dir).resolve()
    design_path = Path(args.lesson_design).resolve()
    design = read_json(design_path, "lesson-design.json")
    if not isinstance(design.get("lesson"), dict):
        raise PacketError(f"lesson-design.json has no `lesson` object: {design_path}")

    lesson = None
    lesson_path = None
    lesson_absent_reason = "no --lesson path was given"
    if args.lesson:
        lesson_path = Path(args.lesson).resolve()
        if lesson_path.is_file():
            lesson = read_json(lesson_path, "lesson.json")
        else:
            lesson_absent_reason = f"{lesson_path} does not exist"
            lesson_path = None

    photos: list[dict] = []
    photo_path = None
    if args.photo_requirements:
        photo_path = Path(args.photo_requirements).resolve()
        if photo_path.is_file():
            contract = read_json(photo_path, "photo-requirements.json")
            rows = contract.get("photos")
            if not isinstance(rows, list):
                raise PacketError(f"photo-requirements.json photos must be an array: {photo_path}")
            photos = [row for row in rows if isinstance(row, dict)]
        else:
            photo_path = None

    families = card_families(plugin_root)
    primitives = visual_primitives(plugin_root)
    triggers = triggers_for(design, lesson, photos, primitives)
    offered = offered_families(triggers, families)
    states = terminal_states(working_dir)

    unit_context = None
    if getattr(args, "plan_lesson", None):
        plan_lesson_path = Path(args.plan_lesson).resolve()
        if plan_lesson_path.is_file():
            unit_context = plan_lesson_path.read_text(encoding="utf-8").strip() or None

    view = build_view(design, lesson, photos, states, working_dir, lesson_absent_reason, unit_context)
    reference, reference_paths = build_reference(
        plugin_root, families, offered, primitives, triggers["primitives"], triggers
    )

    view_output = Path(args.view_output)
    reference_output = Path(args.reference_output)
    receipt_output = Path(args.receipt_output)
    for path in (view_output, reference_output, receipt_output):
        path.parent.mkdir(parents=True, exist_ok=True)
    view_output.write_text(view, encoding="utf-8", newline="\n")
    reference_output.write_text(reference, encoding="utf-8", newline="\n")

    inputs = {"lessonDesign": design_path}
    if lesson_path:
        inputs["lesson"] = lesson_path
    if photo_path:
        inputs["photoRequirements"] = photo_path
    inputs.update(reference_paths)
    inputs["wallBuilder"] = plugin_root / "working-wall-html" / "build.js"
    inputs["wallVisuals"] = plugin_root / "working-wall-html" / "src" / "visuals.js"
    receipt = {
        "schemaVersion": 1,
        "inputs": {key: {"path": str(path), "sha256": sha256_file(path)} for key, path in inputs.items()},
        "triggers": triggers,
        "offeredCardFamilies": offered,
        "notOfferedCardFamilies": [family for family in families if family not in offered],
        "offeredPrimitives": triggers["primitives"],
        "outputs": {
            "view": {"path": str(view_output.resolve()), "bytes": len(view.encode("utf-8")), "sha256": sha256_file(view_output)},
            "reference": {"path": str(reference_output.resolve()), "bytes": len(reference.encode("utf-8")), "sha256": sha256_file(reference_output)},
        },
    }
    receipt_output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print("WORKING_WALL_PACKET_OK")
    return 0


# ─── earlier: the wall a lesson inherits from the lesson before ─────────
#
# Lessons 28 to 32 (Year 4 column subtraction, 15 October 2026) each ran the
# wall designer, and Thursday's and Friday's sheets came out the same: same
# title, layout, steps and kind of example. The teacher's rulings that day: a
# repeated sheet is fine, the helper time spent making it again is not; over a
# week of one method each day's wall adds to the one before; a new sheet is
# made only when the method steps change, not when the example gets harder;
# and in a set built side by side a day waits for the earlier wall it builds
# on, never for a lesson that has stopped.
#
# So a lesson's wall is settled against the lesson before it, here, before any
# helper starts. Same method steps word for word: the earlier sheet is copied
# and no designer runs (if the earlier lesson decided no sheet, neither does
# this one). Different steps: the designer runs with the earlier sheet in its
# view, to add to it. No steps list on either side: the designer runs as before.
#
# Lessons 29 to 33 (18 October 2026) copied Monday's sheet all week. The check
# compared only the main list, and Friday's new step ("A 0? Exchange into the
# 0 first.") sat in How to exchange, a list of its own since 16 October; so
# every list a lesson shows is compared now. The teacher's rulings that day: a
# day whose steps match but whose teaching needs an example the earlier sheet
# does not show (several exchanges on Wednesday) gets that sheet with only the
# example swapped, which the set's thread says in `wallExample`; a later day
# copies that newer sheet, not Monday's; and a sheet that adds a step replaces
# the earlier one on the wall, so it keeps its title.

WALL_RECORD = "wall-earlier.json"
WAIT_LIMIT_SECONDS = 60 * 60
WAIT_POLL_SECONDS = 20
STOPPED_STATES = ("stopped", "not saved", "finished")


def _script_module(filename: str, name: str):
    import importlib.util

    scripts = Path(__file__).resolve().parent
    if str(scripts) not in sys.path:
        sys.path.insert(0, str(scripts))
    spec = importlib.util.spec_from_file_location(name, scripts / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def filing_values(working_dir: Path) -> dict[str, str]:
    try:
        lines = (working_dir / "filing.txt").read_text(encoding="utf-8").splitlines()
    except OSError:
        lines = []
    return {key.strip(): value.strip() for key, value in (line.split("=", 1) for line in lines if "=" in line)}


def method_list(design: dict | None, plain) -> tuple[tuple[str, ...], ...]:
    """Every steps list the lesson shows, in order and in plain words; () when it has none.

    "How to exchange" beside "How to subtract" is a list of its own, and a step
    added to it changes the method as much as one added to the main list.
    """
    lists = []
    for item in (design or {}).get("successCriteria") or []:
        if isinstance(item, dict) and item.get("type") == "steps" and isinstance(item.get("content"), dict):
            steps = tuple(plain(step) for step in item["content"].get("steps") or [])
            if steps:
                lists.append(steps)
    return tuple(lists)


def thread_lists(entry: dict, plain) -> tuple[tuple[str, ...], ...]:
    """A thread day's lists as method_list gives a design's: the main list, then each sometimes list."""
    lists = [entry.get("methodSteps") or []]
    lists += [extra.get("steps") or [] for extra in entry.get("sometimesLists") or [] if isinstance(extra, dict)]
    return tuple(steps for steps in (tuple(plain(s) for s in raw) for raw in lists) if steps)


def related(one: tuple[tuple[str, ...], ...], other: tuple[tuple[str, ...], ...]) -> bool:
    """Two lessons teach one method when both show steps and they share a step."""
    return bool(set().union(*one) & set().union(*other)) if one and other else False


def wall_state(folder: Path | None, since: float = 0.0) -> dict | None:
    """What a lesson folder decided about its wall, or None while it has not decided.

    `since` ignores a record older than the lesson's own session, which belongs
    to an earlier run in the same folder.
    """
    if folder is None:
        return None
    record = folder / "build-results" / "wall.json"
    spec = folder / "working-wall.json"
    try:
        if not spec.is_file() or spec.stat().st_mtime < since:
            return None
        wall = json.loads(spec.read_text(encoding="utf-8"))
        if isinstance(wall, dict) and wall.get("cards") == []:
            # No sheet is a finished answer; the playbook builds nothing for it.
            return {"folder": folder, "spec": wall, "pdf": None}
        if not record.is_file() or record.stat().st_mtime < since:
            return None
        built = json.loads(record.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if not built.get("ok") or not isinstance(wall, dict) or not wall.get("cards"):
        return None
    for output in built.get("outputs") or []:
        path = Path(str(output.get("path", "")))
        if path.suffix.lower() != ".pdf":
            continue
        if path.is_file() and sha256_file(path) == output.get("sha256"):
            return {"folder": folder, "spec": wall, "pdf": path}
        # The shared output folder archives a file when a later lesson of the
        # same name builds over it: find the same bytes under its new name.
        for other in sorted(path.parent.glob("Working Wall - *.pdf")) if path.parent.is_dir() else []:
            if sha256_file(other) == output.get("sha256"):
                return {"folder": folder, "spec": wall, "pdf": other}
    return {"folder": folder, "spec": wall, "pdf": None, "lost": True}


def earlier_lessons(working_dir: Path, design: dict, plain) -> tuple[tuple[str, ...], list[dict]]:
    """This lesson's method list and the lessons before it, nearest first.

    Each is {"name", "steps", "example", "folder", "sibling", "status", "since"}.
    `example` is the thread's `wallExample` for that day: what its wall's
    example must show that the earlier sheet's does not, "" when nothing. A lesson
    in a set built side by side takes every list from the set's thread, which
    every design in the set is held to word for word, because a sibling may
    not have a design yet; a lesson on its own reads the designs.
    """
    values = filing_values(working_dir)
    thread_path = values.get("SET_THREAD") or os.environ.get("LESSON_SET_THREAD", "")
    key = values.get("SET_LESSON") or os.environ.get("LESSON_SET_LESSON", "")
    previous = values.get("PREVIOUS_LESSON", "")
    no_lesson = {"", "NO_LESSON", "NONE"}

    def design_steps(folder: Path) -> tuple[str, ...]:
        try:
            return method_list(json.loads((folder / "lesson-design.json").read_text(encoding="utf-8")), plain)
        except (OSError, ValueError):
            return ()

    found: list[dict] = []
    own = method_list(design, plain)
    own_example = ""
    if thread_path and key:
        thread_file = Path(thread_path)
        try:
            entries = json.loads(thread_file.read_text(encoding="utf-8")).get("lessons") or []
            batch = json.loads((thread_file.parent / "batch.json").read_text(encoding="utf-8"))
        except (OSError, ValueError, AttributeError):
            entries, batch = [], {}
        keys = [entry.get("key") for entry in entries if isinstance(entry, dict)]
        if key in keys:
            steps = {entry.get("key"): thread_lists(entry, plain) for entry in entries if isinstance(entry, dict)}
            examples = {entry.get("key"): str(entry.get("wallExample") or "").strip()
                        for entry in entries if isinstance(entry, dict)}
            own = steps[key] or own
            own_example = examples[key]
            members = {lesson.get("key"): lesson for lesson in batch.get("lessons") or []}
            output = thread_file.parent.parent.parent
            finder = _script_module("lesson-batch.py", "lesson_batch_for_wall")
            for sibling in reversed(keys[: keys.index(key)]):
                lesson = members.get(sibling) or {}
                folder = finder.working_folder_for(output, lesson) if lesson.get("brief") else None
                started = lesson.get("firstStarted") or lesson.get("started") or ""
                try:
                    since = datetime.fromisoformat(started).timestamp() if started else 0.0
                except ValueError:
                    since = 0.0
                found.append({"name": sibling, "steps": steps.get(sibling, ()), "example": examples.get(sibling, ""),
                              "folder": folder,
                              "sibling": True, "status": lesson.get("status", ""), "since": since})
            previous = (members.get(key) or {}).get("setPrevious") or previous
    if previous not in no_lesson and Path(previous).is_dir():
        folder = Path(previous)
        found.append({"name": folder.name, "steps": design_steps(folder), "example": "", "folder": folder,
                      "sibling": False, "status": "finished", "since": 0.0})
    return own, own_example, found


def settle_earlier(working_dir: Path, design: dict, plain) -> dict:
    """One look: {"decision": reuse|none|wait|design, ...}."""
    own, example, before = earlier_lessons(working_dir, design, plain)
    if not before:
        return {"decision": "design", "why": "no earlier lesson was found"}
    owner = None
    for lesson in before:
        if own and lesson["steps"] == own:
            owner = lesson
            if lesson["example"]:
                # That day swapped the example: its sheet is the newest, so go no further back.
                break
        else:
            break
    nearest = before[0]
    swap = bool(example and owner is not None)
    if swap:
        # Same steps, but today's teaching needs an example the earlier sheet does not show.
        target, owner = nearest, None
    else:
        target = owner or (nearest if related(own, nearest["steps"]) else None)
    if target is None:
        state = wall_state(nearest["folder"], nearest["since"]) if not nearest["sibling"] else None
        return {"decision": "design", "earlier": nearest["name"], "related": False, "state": state,
                "why": "the lesson before teaches a different method, or no steps list"}
    state = wall_state(target["folder"], target["since"])
    if state is None and target["sibling"] and target["status"] not in STOPPED_STATES:
        return {"decision": "wait", "earlier": target["name"], "reuse": owner is not None,
                "why": f"{target['name']} has not made its wall yet"}
    if owner is not None and state is not None:
        if not state["spec"].get("cards"):
            return {"decision": "none", "earlier": owner["name"], "state": state,
                    "why": f"{owner['name']} has the same method steps and decided no wall"}
        if state.get("pdf"):
            return {"decision": "reuse", "earlier": owner["name"], "state": state,
                    "why": f"{owner['name']} has the same method steps"}
    if swap:
        why = f"{target['name']} has the same steps, but this lesson's example must show {example}"
    elif owner is None:
        why = f"{target['name']} adds to the method"
    else:
        why = f"{target['name']} has the same steps but its wall could not be found"
    return {"decision": "design", "earlier": target["name"], "related": True, "state": state,
            "why": why, "example": example if swap else ""}


def copy_earlier_wall(plugin_root: Path, working_dir: Path, output_dir: Path, lesson_name: str, settled: dict) -> Path:
    fixed = _script_module("run-fixed-resource.py", "run_fixed_resource_for_wall")
    state = settled["state"]
    base = fixed.safe_filename_component(
        plugin_root, fixed.lesson_build_name(working_dir, lesson_name), "Lesson"
    )
    target = output_dir / f"Working Wall - {base}.pdf"
    source = Path(state["pdf"])
    archived = []
    if target.exists() and target.resolve() != source.resolve() and sha256_file(target) != sha256_file(source):
        archived = fixed.archive_paths([target])
    if target.resolve() != source.resolve():
        output_dir.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    write_reused_spec(working_dir, settled)
    record = {
        "schemaVersion": 1, "ok": True, "kind": "wall", "exitCode": 0,
        "stdout": f"Reused: {source}\nBuilt: {target}\nCards: {len(state['spec'].get('cards') or [])}\n",
        "stderr": "", "archived": archived, "degraded": False, "reusedFrom": str(state["folder"]),
        "outputs": [{"path": str(target), "sha256": sha256_file(target)}],
    }
    (working_dir / "build-results").mkdir(parents=True, exist_ok=True)
    (working_dir / "build-results" / "wall.json").write_text(
        json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return target


def write_reused_spec(working_dir: Path, settled: dict) -> None:
    """The earlier spec, so the run report sees the wall decided; its note says where it came from."""
    spec = dict(settled["state"]["spec"])
    note = f"Same method steps as {settled['earlier']}, so its wall is used again rather than made again."
    spec["rationaleNote"] = note if not spec.get("cards") else note + " " + str(spec.get("rationaleNote") or "")
    (working_dir / "working-wall.json").write_text(
        json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def earlier(args: argparse.Namespace) -> int:
    plugin_root = Path(args.plugin_root).resolve()
    working_dir = Path(args.working_dir).resolve()
    design = read_json(working_dir / "lesson-design.json", "lesson-design.json")
    plain = _script_module("validate-lesson-design.py", "validate_lesson_design_for_wall").plain_words
    record_path = working_dir / WALL_RECORD
    try:
        first_wait = float(json.loads(record_path.read_text(encoding="utf-8")).get("firstWaited") or 0)
    except (OSError, ValueError, AttributeError):
        first_wait = 0.0
    deadline = time.time() + 60 * max(0.0, float(args.wait_minutes or 0))
    while True:
        settled = settle_earlier(working_dir, design, plain)
        if settled["decision"] != "wait":
            break
        first_wait = first_wait or time.time()
        if time.time() - first_wait >= WAIT_LIMIT_SECONDS:
            settled = {"decision": "design", "earlier": settled["earlier"], "related": False, "state": None,
                       "why": f"waited an hour for {settled['earlier']}'s wall; making this lesson's own"}
            break
        if time.time() >= deadline:
            break
        time.sleep(WAIT_POLL_SECONDS)

    state = settled.get("state") or {}
    record = {
        "decision": settled["decision"],
        "earlierLesson": settled.get("earlier", ""),
        "why": settled["why"],
        "buildsOn": bool(settled["decision"] == "design" and settled.get("related") and state.get("spec")),
        "newExample": settled.get("example", ""),
        "earlierWall": str(Path(state["folder"]) / "working-wall.json") if state.get("folder") else "",
        "firstWaited": first_wait,
    }
    if settled["decision"] == "reuse":
        target = copy_earlier_wall(plugin_root, working_dir, Path(args.output_dir).resolve(), args.lesson_name, settled)
        record["copied"] = str(target)
    elif settled["decision"] == "none":
        write_reused_spec(working_dir, settled)
    record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

    lines = {
        "reuse": f"WALL_REUSED: {settled['why']}; its sheet is copied to {record.get('copied', '')} and build-results/wall.json records it",
        "none": f"WALL_NOT_NEEDED: {settled['why']}; working-wall.json records the empty wall",
        "wait": f"WALL_WAIT: {settled['why']}; carry on and run this again",
        "design": f"WALL_DESIGN: {settled['why']}" + ("; the view shows its wall to add to" if record["buildsOn"] else ""),
    }
    print(lines[settled["decision"]])
    return 0


def earlier_wall_section(working_dir: Path) -> list[str]:
    """The view's part about the earlier sheet, when `earlier` found one to add to."""
    try:
        record = json.loads((working_dir / WALL_RECORD).read_text(encoding="utf-8"))
        if not record.get("earlierWall"):
            return []
        wall = json.loads(Path(record["earlierWall"]).read_text(encoding="utf-8"))
    except (OSError, ValueError, AttributeError):
        return []
    lines = [f"## The wall before this one ({record.get('earlierLesson', '')})", ""]
    if record.get("buildsOn") and record.get("newExample"):
        lines.append(
            "That lesson has the same steps, but its example does not show what this lesson teaches. "
            "This wall replaces that sheet on the wall, so it is that sheet with only the example swapped "
            f"for one that shows {record['newExample']}: keep its title, card type, colours, steps and wording."
        )
    elif record.get("buildsOn"):
        lines.append(
            "That lesson teaches the same method, and this lesson's steps change it. This wall replaces "
            "that sheet on the wall, so it is that sheet with this lesson's new step added: "
            "keep its title, card type, colours and wording, change only what this lesson's "
            "steps change, and swap the example for one that shows the new step when the old one does not."
        )
    else:
        lines.append(
            "Teaches something else. Shown so a repeated layout is a choice the learning makes."
        )
    lines.extend(["", "```json", json.dumps(wall, ensure_ascii=False, indent=2), "```", ""])
    return lines


# ─── check: the design invariants a wall must not break ────────────────
#
# This once also refused a wall whose cards carried no picture while the lesson
# held a published photograph, with card_carries_a_visual and published_photo_names
# to serve it. All three were retired on 6 September 2026 along with the wall-wide
# visual gate, for the reason check() states below: picture availability elsewhere
# cannot decide a card-s teaching needs. Recover them from git if that is revisited.
#
# The rule below is a different one and does not revive that gate. It asks
# nothing about the lesson's photographs; it asks whether each sheet carries a
# picture of its own. The teacher's ruling of 29 September 2026: every working
# wall sheet has a picture, a diagram or a helper, never only words, because a
# sheet of words is the one he takes down (two of the 56 sheets built before 18
# September went up, both a picture with its parts pointed at). A card with no
# picture is not printed as words; the designer leaves it off, which
# `cards: []` with a reason already allows.

# Wall zone labels, not teaching sheets: a heading or banner names a part of
# the wall and carries no learning of its own.
DISPLAY_FAMILIES = {"sectionHeading", "banner"}
# Families whose build refuses a missing picture itself, so a card of these
# types that builds has one.
PICTURE_IS_THE_CARD = {"photoMapOverview", "heroCallouts", "causeCards", "diagramSection", "stepByStep"}


def card_carries_a_picture(card: dict) -> bool:
    kind = card.get("type")
    if kind in DISPLAY_FAMILIES or kind in PICTURE_IS_THE_CARD:
        return True
    if card.get("visual") or card.get("photo") or card.get("picture"):
        return True
    if kind == "vocabChips":
        return any(isinstance(chip, dict) and chip.get("photo") for chip in card.get("chips") or [])
    for row in card.get("rows") or []:
        cells = row if isinstance(row, list) else [row]
        if any(isinstance(cell, dict) and (cell.get("visual") or cell.get("photo")) for cell in cells):
            return True
    return False



# -------------------------------------------------------------------------
# Two faults a rendered wall cannot show you and a reader stops noticing.

NUMBER_RE = re.compile(r'-?\d[\d,]*(?:\.\d+)?')


# A wall table keeps the board's facts and may shorten its sentences.
#
# The check used to want the board's rows cell for cell, so a comparison table
# whose boxes were full sentences could not go up at all: the sentences do not
# fit a wall table at a size read across the room, and the few words a child
# writes in the same box ("the citizens voted") were refused as a changed row
# (Year 5 Athens and Sparta, stress test of 7 October 2026). What must not
# change is a lookup fact: a name, a term, a number. So a board cell of a few
# words is found on the wall as written, a number in a longer cell is found
# somewhere on the wall, and a sentence is otherwise the wall designer's to cut.
# The board's own marks (an answer's "||", a small-print "[[...]]" line, taught
# and key word brackets) are not part of what is compared.
SENTENCE_WORDS = 5


def plain_cell(cell: object) -> str:
    if not isinstance(cell, str):
        return ""
    text = re.sub(r"\[\[.*?\]\]", " ", cell, flags=re.S)
    text = re.sub(r"\|\||\{\{|\}\}|<<|>>", "", text)
    return " ".join(text.split()).casefold()


def changed_source_cell(card: dict, table: dict) -> str:
    """The first board cell this wall table has changed, or "" when it keeps them all."""
    wall_cells = [plain_cell(cell) for row in card.get("rows") or [] for cell in (row if isinstance(row, list) else [row])]
    wall_numbers = {number for cell in wall_cells for number in NUMBER_RE.findall(cell)}
    for row in table.get("rows") or []:
        for cell in row if isinstance(row, list) else [row]:
            if isinstance(cell, dict):
                if cell not in [c for r in card.get("rows") or [] for c in (r if isinstance(r, list) else [r])]:
                    return "picture cell"
                continue
            plain = plain_cell(cell)
            if not plain:
                continue
            if len(plain.split()) < SENTENCE_WORDS:
                if plain not in wall_cells:
                    return plain
            elif any(number not in wall_numbers for number in NUMBER_RE.findall(plain)):
                return plain
    return ""


def round_trip_example(text: str) -> bool:
    """Does this worked example finish on the number it started from?

    `2,950 + 100 = 3,050; 3,050 - 100 = 2,950` reached a printed wall. It adds
    a hundred and takes it straight back off, so the two operations cancel and
    the card demonstrates nothing about finding either. The lesson had written
    the clean single example; the card manufactured the return trip so that one
    example could cover both halves of its title.

    Scoped to items that actually work something out - two or more equals signs
    and three or more numbers - so an ordinary sentence that happens to repeat
    a number ("347 is closer to 350 than to 340") is left alone.
    """
    if text.count("=") < 2:
        return False
    numbers = NUMBER_RE.findall(text)
    return len(numbers) >= 3 and numbers[0] == numbers[-1]


def restates_title(title: str, heading: str) -> bool:
    """Is a table's first column heading just the card's title again?

    A card called "My explanation" whose first column is also "My explanation"
    reads as a slip and spends the widest line on the sheet saying the title
    twice. The singular of a plural title is not this fault: "Food groups" over
    a "Food group" column is the right heading for that column.
    """
    def norm(value: str) -> str:
        return re.sub(r"[^a-z0-9 ]", "", str(value or "").strip().lower())

    return bool(norm(title)) and norm(title) == norm(heading)


def check(args) -> int:
    plugin_root = Path(args.plugin_root).resolve()
    working_dir = Path(args.working_dir).resolve()
    wall_path = Path(args.working_wall).resolve()
    wall = read_json(wall_path, "working-wall.json")
    cards = [card for card in (wall.get("cards") or []) if isinstance(card, dict)]
    if not cards:
        # No wall is a real answer, and the commonest right one. The designer's
        # brief has always said so; this check used to refuse it, so in 45 built
        # lessons the wall was never once declined and the teacher put up two of
        # the 56 sheets it made. A refusal here does not improve a wall, it only
        # forces a sheet nobody asked for. All that is required is the reason,
        # which the run report prints.
        if not str(wall.get("rationaleNote") or "").strip():
            raise PacketError(
                f"working-wall.json declines the wall without saying why: {wall_path}. "
                "An empty wall is valid; it needs a rationaleNote the report can print."
            )
        print("WORKING_WALL_DESIGN_OK")
        return 0

    # Picture availability elsewhere cannot determine a card's teaching needs.
    # Semantic completeness and visual necessity belong to the designer and
    # rendered review. Preserve the existing exact-table hand-off invariant.
    lesson = None
    if args.lesson:
        lesson_path = Path(args.lesson).resolve()
        if lesson_path.is_file():
            lesson = read_json(lesson_path, "lesson.json")
    source_tables = [item for _, _, item in rendered_objects(lesson)
                     if item.get("type") == "table" and item.get("headers") and item.get("rows")]
    wordless = [card.get("title") or card.get("type") or "untitled" for card in cards if not card_carries_a_picture(card)]
    if wordless:
        names = ", ".join(f'"{name}"' for name in wordless)
        raise PacketError(
            f"Working-wall card{'s' if len(wordless) > 1 else ''} {names} carr{'y' if len(wordless) > 1 else 'ies'} no picture. "
            "Every wall sheet shows its learning in a picture, a diagram or a helper, never only words. "
            "Give the card the lesson's own figure or photograph; if the lesson has none that shows this "
            "learning, leave the card off (an empty wall with a rationaleNote is a valid answer)."
        )
    for card in cards:
        title = card.get("title") or ""
        for item in card.get("items") or []:
            text = item.get("text") if isinstance(item, dict) else item
            if round_trip_example(str(text or "")):
                raise PacketError(
                    f'Working-wall card "{title}" works an example that ends on the number it '
                    f'started from: "{text}". It applies an operation and undoes it, so it shows '
                    "the two cancelling rather than how to do either. Work one case through to a "
                    "different answer, and give a second direction its own line from a different "
                    "starting number."
                )
        if card.get("type") != "referenceTable":
            continue
        columns = card.get("columns") or []
        if columns and restates_title(title, columns[0]):
            raise PacketError(
                f'Working-wall table "{title}" repeats its own title as its first column heading. '
                "Name what that column holds instead, so the widest line on the sheet earns its space."
            )
        matching = [table for table in source_tables if card.get("columns") == table["headers"]]
        if matching:
            lost = [changed_source_cell(card, table) for table in matching]
            if all(lost):
                raise PacketError(
                    f"Working-wall reference table changes the source rows: the board's \"{lost[0]}\" is not on it. "
                    "A name, a number or a short fact is copied as the board has it; only a full sentence may be "
                    "cut to the few words a child would write in that box."
                )
    print("WORKING_WALL_DESIGN_OK")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build the Working Wall Designer's packet.")
    commands = parser.add_subparsers(dest="command", required=True)
    prep = commands.add_parser("prepare", help="write the view, the reference and a receipt")
    prep.add_argument("--plugin-root", required=True)
    prep.add_argument("--working-dir", required=True)
    prep.add_argument("--lesson-design", required=True)
    prep.add_argument("--lesson")
    prep.add_argument("--photo-requirements")
    prep.add_argument("--plan-lesson", help="the plan row for this lesson, when the run came from a long-term plan; carries what comes next in the unit")
    prep.add_argument("--view-output", required=True)
    prep.add_argument("--reference-output", required=True)
    prep.add_argument("--receipt-output", required=True)
    prep.set_defaults(func=prepare)
    ear = commands.add_parser("earlier", help="copy the lesson before's wall when the method steps match, else say what to build on")
    ear.add_argument("--plugin-root", required=True)
    ear.add_argument("--working-dir", required=True)
    ear.add_argument("--output-dir", required=True)
    ear.add_argument("--lesson-name", required=True)
    ear.add_argument("--wait-minutes", type=float, default=0, help="keep looking this long while an earlier lesson in the set is still making its wall")
    ear.set_defaults(func=earlier)
    chk =commands.add_parser("check", help="refuse a wall that breaks a design invariant")
    chk.add_argument("--plugin-root", required=True)
    chk.add_argument("--working-dir", required=True)
    chk.add_argument("--working-wall", required=True)
    chk.add_argument("--lesson")
    chk.set_defaults(func=check)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except PacketError as error:
        print(f"WORKING_WALL_PACKET_ERROR: {error}")
        return 1


if __name__ == "__main__":
    import utf8_output
    utf8_output.enable()
    sys.exit(main())
