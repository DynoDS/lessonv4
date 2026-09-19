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
import re
import sys
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
    lines.extend(["## Lesson", ""])
    for key in ("structure", "subject", "yearGroup", "lo", "displayedLo", "durationMinutes", "scope"):
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
            "figure reuses one of these; it is never re-derived from the prose."
        )
        lines.append("")
        for number, path, item in objects:
            lines.append(f"- slide {number} `{path}`: {compact(item)}")
    lines.append("")

    lines.extend(["## Photographs", ""])
    if not photos:
        lines.append("(the contract promises no photographs)")
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


# ─── check: the design invariants a wall must not break ────────────────
#
# This once also refused a wall whose cards carried no picture while the lesson
# held a published photograph, with card_carries_a_visual and published_photo_names
# to serve it. All three were retired on 6 September 2026 along with the wall-wide
# visual gate, for the reason check() states below: picture availability elsewhere
# cannot decide a card-s teaching needs. Recover them from git if that is revisited.



# -------------------------------------------------------------------------
# Two faults a rendered wall cannot show you and a reader stops noticing.

NUMBER_RE = re.compile(r'-?\d[\d,]*(?:\.\d+)?')


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
        if matching and not any(card.get("rows") == table["rows"] for table in matching):
            raise PacketError("Working-wall reference table changes the source rows; preserve the teaching reference.")
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
    chk = commands.add_parser("check", help="refuse a wall that breaks a design invariant")
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
    sys.exit(main())
