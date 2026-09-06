#!/usr/bin/env python3
"""Build and verify the deterministic Design Reviewer packet."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ALLOWED_REVIEW_RESULTS = {
    "APPROVED",
    "REDESIGN REQUIRED",
}

REQUIRED_REVIEW_HEADINGS = (
    "## Result",
    "## Corrections made",
    "## Redesign required",
    "## Flags for the teacher",
    "## Voice sweep",
)

# The review view opens with every string a child reads or hears, printed as
# plain text in lesson order, because a reviewer that meets `"task": "..."`
# inside a JSON block reads a specification, and a reviewer that meets the same
# words on their own line hears a child at the back of the room. A
# history lesson went to a class with `What does one visible detail suggest
# about this class?` on the board after a review that corrected nothing: every
# string had passed in its braces. The section's opening line carries the count,
# and the review report returns the count as an omission check. Matching counts
# do not prove the sweep happened or that its judgements were sound.
CLASS_VIEW_HEADING = "## As the class meets it"
CLASS_VIEW_COUNT_RE = re.compile(
    r"^(\d+) child-facing strings for a Year (\d+) class\."
)
VOICE_SWEEP_HEADING = "## Voice sweep"
VOICE_SWEEP_RE = re.compile(
    r"^Read (\d+) child-facing strings as a Year (\d+) child; repaired (\d+)\.$"
)

# Content fields a child reads on the board or hears the teacher say, across
# every teaching route. Anything not named here is treated as written for a
# designer or the teacher and never reaches the class-facing view: `activity`,
# `format`, `focus`, `evidenceProduced`, `modelledExemplar`,
# `activityArchitecture`, `teacherListensFor` and their kind. In starter,
# observe, apply and reflect units, activity is the actual pupil prompt.
CHILD_FACING_CONTENT_KEYS = (
    "headline",
    "explanation",
    "teachingText",
    "keyQuestions",
    "task",
    "example",
    "guidedQuestions",
    "question",
    "prompt",
    "discussionQuestion",
    "sentenceStems",
    "input",
    "materialOnSlide",
    "enablingInput",
    "checkpointQuestion",
    "investigationBrief",
    "accurateExplanation",
    "conditionsAndSafety",
)
ACTIVITY_IS_THE_TASK_KINDS = {"starter", "observe", "apply", "reflect"}

STRUCTURE_REFERENCE_FILES = {
    "Skill-based": "teaching-sequence-skill-based.md",
    "Content-based": "teaching-sequence-content-based.md",
    "Discovery": "teaching-sequence-discovery.md",
    "Dialogic": "teaching-sequence-dialogic.md",
    "Task-Centred": "teaching-sequence-task-centred.md",
}

SUBJECT_REFERENCE_FILES = {
    "Science": "subject-science.md",
    "Maths": "subject-maths.md",
    "Geography": "subject-geography.md",
    "History": "subject-history.md",
    "PSHE": "subject-pshe.md",
    "RE": "subject-re.md",
}

PREFERENCE_REVIEW_ROUTES = (
    (
        "Written Voice (House Style)",
        "Read when exact child-facing or parent-facing wording is materially "
        "unclear, unnatural, overloaded or answer-giving.",
    ),
    (
        "Classroom Norms",
        "Read when timing, routine teacher autonomy, partner talk or the "
        "visible learning objective is in doubt.",
    ),
    # A trigger has to be something the reviewer can see in the view before it
    # has made the judgement, or it never fires. "Read when a Do practises a
    # different idea from the one its own Teach taught" asks the reviewer to
    # have already found the fault in order to be sent to the section that
    # would help it find the fault, and a Year 4 History lesson was approved
    # twice with nothing but punctuation corrections. Counting Teach beats and
    # reading the last task are things the view answers on its face.
    (
        "The Teach → Do → Teach → Do Rhythm",
        "Read when two teacher-presented beats run with no pupil action "
        "between them, in any route, when a Do beat practises a different "
        "idea from the one its own Teach just taught, when a beat carries a "
        "second job that has no beat of its own, or whenever the sequence has "
        "three or more Teach beats - with three, say in your own words the "
        "move each Teach taught and what its own Do makes children do, and "
        "check each pair before reading on.",
    ),
    (
        "Slide Philosophy",
        "Read its Lesson Designer parts when a unit's child-facing content "
        "states a rule or fact whose meaning, reason or example lives only "
        "in its script, when a Do beat is a question to the room rather "
        "than every child using the idea, or when a substantial task "
        "arrives with instructions only.",
    ),
    (
        "Cognitive Load Triage on Scaffolds",
        "Read when a scaffold may reveal the answer, remove necessary "
        "support or overload the task.",
    ),
    (
        "How Much Fits in One Lesson",
        "Read when the lesson may need an honest split, and whenever an idea "
        "a Teach beat taught is not used again by the independent practice or "
        "the ending. That one is countable from the view: list what each Teach "
        "taught, then read the practice and the ending and mark off the ideas "
        "they actually need.",
    ),
    (
        "Starters",
        "Read when the starter's retrieval purpose, form, duration or scope "
        "is in doubt.",
    ),
    (
        "Question Labelling",
        "Read only when question labels may affect pupil use.",
    ),
    (
        "Vocabulary",
        "Read when vocabulary selection, definition, quantity or placement "
        "is in doubt.",
    ),
    (
        "A Picture Beside a Word",
        "Read when a vocabulary image may not carry the intended meaning.",
    ),
    (
        "Sticky Knowledge",
        "Read when a sticky item may be weak, excessive or absent without "
        "reason.",
    ),
    (
        "Success Criteria",
        "Read when form, wording, use or alignment is in doubt.",
    ),
    (
        "The Apply Slide",
        "Read when Apply may be unearned or repeat Your Turn.",
    ),
    (
        "Practising a Test Question",
        "Read when the lesson prepares pupils for a named test item.",
    ),
    (
        "Reasoning Is Every Child's Entitlement",
        "Read when reasoning may be absent, superficial or reserved for a "
        "subset.",
    ),
    (
        "Support, Checking and Release",
        "Read when support or release to independence is in doubt.",
    ),
    (
        "Purposeful Endings and Linked Lessons",
        "Read when the ending or linked-lesson boundary is in doubt.",
    ),
    (
        "Source and Scenario Integrity",
        "Read for real, classic, sensitive or changing sources and claims.",
    ),
    (
        "Worksheets",
        "Read when worksheet freshness, purpose, evidence or activity "
        "architecture is in doubt.",
    ),
    (
        "Pride Lessons (Quality Anchor)",
        "Read only when a difficult quality boundary remains unresolved.",
    ),
)


class PacketError(ValueError):
    """A deterministic Design Review packet failure."""


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def require_file(path: Path, label: str) -> None:
    if not path.is_file():
        raise PacketError(f"{label} is missing: {path}")


def load_json(path: Path, label: str) -> dict:
    require_file(path, label)
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PacketError(f"{label} is not readable JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise PacketError(f"{label} root must be an object")
    return value


def atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_bytes(text.encode("utf-8"))
    os.replace(temporary, path)


def atomic_write_json(path: Path, payload: dict) -> None:
    atomic_write_text(
        path,
        json.dumps(
            payload,
            ensure_ascii=False,
            indent=2,
            sort_keys=False,
        )
        + "\n",
    )


def write_immutable_json(path: Path, payload: dict) -> None:
    data = (
        json.dumps(
            payload,
            ensure_ascii=False,
            indent=2,
            sort_keys=False,
        )
        + "\n"
    ).encode("utf-8")

    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        if path.read_bytes() != data:
            raise PacketError(
                f"immutable output already exists with different bytes: {path}"
            )
        return

    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_bytes(data)
    os.replace(temporary, path)


def remove_stale(*paths: Path) -> None:
    for path in paths:
        try:
            path.unlink()
        except FileNotFoundError:
            pass


def run_exact(command: list[str], label: str) -> str:
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
        )
    except OSError as exc:
        raise PacketError(f"{label} could not run: {exc}") from exc

    if result.returncode != 0:
        detail = (
            result.stderr.strip()
            or result.stdout.strip()
            or f"exit {result.returncode}"
        )
        raise PacketError(detail)

    return result.stdout.strip()


def validator_command(
    plugin_root: Path,
    working_dir: Path,
) -> list[str]:
    # An owner may replace an exhausted picture with a native representation.
    # Its frozen Phase 2 requirement remains provenance, not a fake live use.
    # Keep the strict initial namespace until a verified freeze establishes
    # that this is a later review; all live references still validate below.
    receipt_path = working_dir / "phase2-initial-photo-requirements.receipt.json"
    namespace_args = ["--initial-photo-namespace"]
    if receipt_path.exists():
        try:
            receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
            snapshot = Path(receipt["snapshotPath"])
            if (
                receipt.get("schemaVersion") != 1
                or Path(receipt["canonicalPath"]).resolve()
                != (working_dir / "photo-requirements.json").resolve()
                or not snapshot.is_file()
                or sha256_file(snapshot) != receipt["sha256"]
            ):
                raise ValueError("freeze receipt does not match its snapshot")
        except (OSError, ValueError, KeyError, TypeError) as exc:
            raise PacketError(f"Invalid Phase 2 photo freeze receipt: {exc}") from exc
        namespace_args = []
    return [
        sys.executable,
        str(
            (
                plugin_root
                / "scripts"
                / "validate-lesson-design.py"
            ).resolve()
        ),
        *namespace_args,
        str((working_dir / "lesson-design.json").resolve()),
        str((working_dir / "photo-requirements.json").resolve()),
    ]


def photo_cap_command(
    plugin_root: Path,
    working_dir: Path,
) -> list[str]:
    return [
        sys.executable,
        str(
            (
                plugin_root
                / "scripts"
                / "check-photo-cap.py"
            ).resolve()
        ),
        str((working_dir / "photo-requirements.json").resolve()),
    ]


def run_validator(command: list[str]) -> None:
    stdout = run_exact(
        command,
        "lesson-design validator",
    )
    if stdout != "LESSON_DESIGN_OK":
        raise PacketError(
            "lesson-design validator did not print exactly "
            f"LESSON_DESIGN_OK: {stdout!r}"
        )


def run_photo_cap(
    command: list[str],
) -> tuple[int, int, str]:
    stdout = run_exact(
        command,
        "photo-cap check",
    )
    match = re.match(
        r"^PHOTO_CAP_OK: (\d+)/(\d+)\b",
        stdout,
    )
    if not match:
        raise PacketError(
            "photo-cap check did not print PHOTO_CAP_OK: "
            f"{stdout!r}"
        )

    return (
        int(match.group(1)),
        int(match.group(2)),
        stdout,
    )


def build_review_reference(
    preferences_path: Path,
    do_beats_path: Path,
    teaching_sequence_path: Path,
    subject_path: Path | None,
    lesson: dict,
    worksheet: dict,
    photo_count: int,
    photo_maximum: int,
) -> tuple[str, dict]:
    source_paths = {
        "preferences": preferences_path,
        "doBeats": do_beats_path,
        "teachingSequence": teaching_sequence_path,
    }
    source_scopes = {
        "preferences": "conditional sections by exact heading",
        "doBeats": "decision-point activity section only",
        "teachingSequence": (
            "file start through the line before ## Output Format Block"
        ),
    }
    if subject_path is not None:
        source_paths["subject"] = subject_path
        source_scopes["subject"] = "complete file"

    preference_routes = "\n".join(
        f"- `{heading}`: {trigger}"
        for heading, trigger in PREFERENCE_REVIEW_ROUTES
    )
    subject_instruction = (
        f"- Subject reference: `{subject_path}` - read the complete file."
        if subject_path is not None
        else "- Subject reference: No matching subject file exists."
    )
    source_hashes = "\n".join(
        f"- {key}: `{sha256_file(path)}`"
        for key, path in source_paths.items()
    )

    reference = (
        "# Design Review Runtime Reference\n\n"
        "Generated deterministically for this review attempt. This is a "
        "routing card and trusted machine receipt. It does not copy the "
        "canonical reference bodies.\n\n"
        "## Trusted deterministic receipt\n\n"
        "- Lesson design validator: PASS\n"
        "- Photo-cap check: PASS\n"
        f"- Subject: {lesson['subject']}\n"
        f"- Year group: {lesson['yearGroup']}\n"
        f"- Duration: {lesson['durationMinutes']} minutes\n"
        f"- Teaching structure: {lesson['structure']}\n"
        f"- Worksheet status: {worksheet['status']}\n"
        f"- Worksheet resource mode: {worksheet['resourceMode']}\n"
        f"- Worksheet use: {worksheet['use']}\n"
        f"- Planned photographs: {photo_count} of {photo_maximum}\n\n"
        "## Required semantic references\n\n"
        f"- Teaching-route reference: `{teaching_sequence_path}` - read from "
        "the file start to, but not including, `## Output Format Block`.\n"
        f"{subject_instruction}\n\n"
        "## Conditional teacher-preference routing\n\n"
        f"{preference_routes}\n\n"
        "## Conditional activity routing\n\n"
        f"Read only the named activity section from `{do_beats_path}` when "
        "the lesson's exact activity format or expected response remains "
        "unclear after reading the lesson itself. Do not read the catalogue "
        "at startup.\n\n"
        "## Protected deterministic ownership\n\n"
        "Schema, required fields, allowed values, identifier and reference "
        "legality, route order, structured-answer completeness, "
        "answer-delivery legality, worksheet contract shape, photo cap and "
        "protected photo identity have already passed deterministic checks. "
        "Review their teaching meaning, not their mechanical validity.\n\n"
        "## Canonical source hashes\n\n"
        f"{source_hashes}\n"
    )

    sources = {
        key: {
            "path": str(path),
            "sha256": sha256_file(path),
            "scope": source_scopes[key],
        }
        for key, path in source_paths.items()
    }

    return reference, sources


def review_json(value) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=False)


def append_review_json(lines: list[str], label: str, value) -> None:
    lines.extend(
        [
            f"**{label}:**",
            "```json",
            json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False),
            "```",
            "",
        ]
    )


def append_review_unit(
    lines: list[str],
    unit: dict,
    *,
    concepts: dict[str, dict],
) -> None:
    lines.extend(
        [
            f"### {unit['label']} (`{unit['sourceUnitId']}`)",
            f"- Kind: `{unit['kind']}`",
        ]
    )
    if unit["conceptRef"] is not None:
        ref = unit["conceptRef"]
        lines.append(f"- Concept: `{ref}` {concepts[ref]['name']}")
    if unit["pupilInstruction"] is not None:
        lines.append(f"- Pupil instruction: {unit['pupilInstruction']}")
    if unit["modellingState"] is not None:
        lines.append(f"- Modelling state: {unit['modellingState']}")

    if unit["representationRefs"]:
        lines.append(
            "- Representation refs: "
            + ", ".join(
                "`"
                f"{ref['ref']}/{ref['configuration']}/{ref['interaction']}"
                "`"
                for ref in unit["representationRefs"]
            )
        )
    for label, key in (
        ("Success-criteria refs", "successCriteriaRefs"),
        ("Sticky-knowledge refs", "stickyKnowledgeRefs"),
        ("Misconception refs", "misconceptionRefs"),
        ("Planned-photograph refs", "photoRefs"),
    ):
        if unit[key]:
            lines.append(
                f"- {label}: "
                + ", ".join(
                    f"`{ref}`"
                    for ref in unit[key]
                )
            )
    lines.append("")

    append_review_json(lines, "Content", unit["content"])
    if unit.get("taskStructure") is not None:
        append_review_json(lines, "Task structure", unit["taskStructure"])

    notes = unit["speakerNotes"]
    for label, key in (
        ("Speaker script", "script"),
        ("Teacher information", "teacherInfo"),
        ("Look for", "lookFor"),
    ):
        if notes[key] is not None:
            lines.extend([f"**{label}:**", notes[key], ""])

    answer = unit["answer"]
    if answer["kind"] == "none":
        lines.extend(["- Answer: none", ""])
        return

    lines.extend(
        [
            f"- Answer kind: `{answer['kind']}`",
            f"- Answer visibility: `{answer['delivery']}`",
        ]
    )
    if answer["content"] is not None:
        lines.append(f"- Answer/model: {answer['content']}")
    if answer["acceptanceCondition"] is not None:
        lines.append(
            f"- Acceptance condition: {answer['acceptanceCondition']}"
        )
    lines.append("")
    if answer.get("structure") is not None:
        append_review_json(
            lines,
            "Structured answer",
            answer["structure"],
        )


def class_view_strings(values, out: list[str]) -> None:
    """Append every non-empty string in `values` (a string or a list of strings)."""
    if isinstance(values, str):
        if values.strip():
            out.append(values)
    elif isinstance(values, list):
        for value in values:
            if isinstance(value, str) and value.strip():
                out.append(value)


def class_view_criteria(ref: str, criteria: dict[str, dict], out: list[str]) -> None:
    row = criteria.get(ref)
    if row is None:
        return
    content = row.get("content") or {}
    kind = row.get("type")
    if kind == "steps":
        class_view_strings(content.get("steps"), out)
    elif kind == "reference-table":
        columns = content.get("columns") or []
        if columns:
            out.append(" | ".join(str(cell) for cell in columns))
        for cells in content.get("rows") or []:
            out.append(" | ".join(str(cell) for cell in cells))
    elif kind == "labelled-reference":
        for item in content.get("items") or []:
            label = item.get("label") or ""
            text = item.get("text") or ""
            out.append(f"{label}: {text}" if text else label)


def class_view_answer(unit: dict, out: list[str]) -> None:
    answer = unit.get("answer") or {}
    if answer.get("delivery") not in {"answer-slide", "visible-in-unit"}:
        return
    if answer.get("content"):
        out.append(answer["content"])
        return
    structure = answer.get("structure")
    task = unit.get("taskStructure") or {}
    if not isinstance(structure, dict):
        return
    if structure.get("kind") == "sort":
        items = {row["id"]: row.get("label", "") for row in task.get("items") or []}
        groups = {row["id"]: row.get("label", "") for row in task.get("groups") or []}
        for placement in structure.get("placements") or []:
            out.append(
                f"{items.get(placement.get('itemRef'), placement.get('itemRef'))}: "
                f"{groups.get(placement.get('groupRef'), placement.get('groupRef'))}"
            )
    elif structure.get("kind") == "evidence-classification":
        fields = {row["id"]: row.get("label", "") for row in task.get("fields") or []}
        for result in structure.get("results") or []:
            out.append(
                "; ".join(
                    f"{fields.get(value.get('fieldRef'), value.get('fieldRef'))}: "
                    f"{value.get('value')}"
                    for value in result.get("values") or []
                )
            )


def class_view_unit(
    unit: dict,
    *,
    criteria: dict[str, dict],
    sticky: dict[str, str],
) -> list[str]:
    """Every string on this unit a child reads or hears, in the order they meet it."""
    out: list[str] = []
    content = unit.get("content") or {}
    if unit.get("kind") in ACTIVITY_IS_THE_TASK_KINDS:
        class_view_strings(content.get("activity"), out)
    for key in CHILD_FACING_CONTENT_KEYS:
        class_view_strings(content.get(key), out)
    takeaway = content.get("takeaway")
    if isinstance(takeaway, dict):
        if takeaway.get("kind") == "text":
            class_view_strings(takeaway.get("text"), out)
        elif takeaway.get("kind") == "sticky":
            class_view_strings(sticky.get(takeaway.get("ref")), out)
    launch = content.get("launch")
    if isinstance(launch, dict):
        class_view_strings(launch.get("established"), out)
        class_view_strings(launch.get("goodLooksLike"), out)
        class_view_strings(launch.get("steps"), out)
    class_view_strings(unit.get("pupilInstruction"), out)
    task = unit.get("taskStructure")
    if isinstance(task, dict):
        for row in task.get("groups") or []:
            class_view_strings(row.get("label"), out)
        for row in task.get("fields") or []:
            class_view_strings(row.get("label"), out)
        for row in task.get("items") or []:
            class_view_strings(row.get("label"), out)
            class_view_strings(row.get("detail"), out)
    for ref in unit.get("successCriteriaRefs") or []:
        class_view_criteria(ref, criteria, out)
    for ref in unit.get("stickyKnowledgeRefs") or []:
        class_view_strings(sticky.get(ref), out)
    class_view_answer(unit, out)
    script = (unit.get("speakerNotes") or {}).get("script")
    if isinstance(script, str) and script.strip():
        spoken = re.sub(r"^\s*Say to children:\s*", "", script, count=1)
        out.append(f"Teacher says: {spoken}")
    return out


def class_view_worksheet(
    worksheet: dict,
    *,
    criteria: dict[str, dict],
    sticky: dict[str, str],
) -> list[str]:
    out: list[str] = []
    for ref in worksheet.get("successCriteriaRefs") or []:
        class_view_criteria(ref, criteria, out)
    for ref in worksheet.get("stickyKnowledgeRefs") or []:
        class_view_strings(sticky.get(ref), out)
    for block in worksheet.get("contentBlocks") or []:
        kind = block.get("kind")
        if kind == "question":
            class_view_strings(block.get("pupilPrompt"), out)
            class_view_strings(block.get("support"), out)
        elif kind == "question-group":
            class_view_strings(block.get("groupPrompt"), out)
            for part in block.get("parts") or []:
                class_view_strings(part.get("pupilPrompt"), out)
                class_view_strings(part.get("support"), out)
        elif kind == "frame":
            for section in block.get("sections") or []:
                class_view_strings(section.get("heading"), out)
                class_view_strings(section.get("whatGoesHere"), out)
        elif kind == "stimulus-set":
            class_view_strings(block.get("stimulus"), out)
            class_view_strings(block.get("pupilAction"), out)
            for prompt in block.get("prompts") or []:
                class_view_strings(prompt.get("pupilPrompt"), out)
                class_view_strings(prompt.get("support"), out)
        elif kind == "child-generated":
            class_view_strings(block.get("generator"), out)
            class_view_strings(block.get("firstRowWorked"), out)
    return out


def unit_label(design: dict, source_unit_id: str) -> str:
    """The name a person would use for a unit, for a line about where something
    sits. Falls back to the id when the anchor names nothing, so a broken
    schedule reads as broken rather than silently as the starter."""
    starter = design.get("starter") or {}
    if starter.get("sourceUnitId") == source_unit_id:
        return starter.get("label") or "the starter"
    for unit in design.get("teachingSequence") or []:
        if unit.get("sourceUnitId") == source_unit_id:
            return unit.get("label") or source_unit_id
    return source_unit_id


def vocabulary_schedule(design: dict) -> list[tuple[str, list[dict]]]:
    """Every planned vocabulary introduction, in order, as (anchor, words).

    One reading of the schedule, used by BOTH the placement summary and the
    class view, because those two disagreeing is how a reviewer approved a
    lesson it had read in an order the class never met. The class view used to
    print every word straight after the starter whatever the design said.

    `vocabularyIntroductions` is the current field. A saved design carrying
    only `vocabularyPlacement` keeps its original meaning: all the words in one
    group, after the named unit, or after the starter when it is null or
    absent. A design with no vocabulary has no schedule.
    """
    words = {row["id"]: row for row in design.get("vocabulary") or []}
    if not words:
        return []

    starter_id = (design.get("starter") or {}).get("sourceUnitId") or ""

    introductions = design.get("vocabularyIntroductions")
    if isinstance(introductions, list) and introductions:
        schedule: list[tuple[str, list[dict]]] = []
        for entry in introductions:
            if not isinstance(entry, dict):
                continue
            group = [words[ref] for ref in entry.get("vocabularyRefs") or [] if ref in words]
            if group:
                schedule.append((entry.get("after") or starter_id, group))
        return schedule

    placement = design.get("vocabularyPlacement")
    anchor = placement["after"] if isinstance(placement, dict) and placement.get("after") else starter_id
    return [(anchor, list(words.values()))]


def vocabulary_placement_line(design: dict) -> str:
    """Where each group of words is introduced, so the reviewer can judge
    whether every word arrives after the meaning and before its use."""
    schedule = vocabulary_schedule(design)
    if not schedule:
        return "no key vocabulary"
    parts = []
    for anchor, group in schedule:
        terms = ", ".join(row["term"] for row in group)
        parts.append(f'{terms} after "{unit_label(design, anchor)}"')
    return "; ".join(parts)


def build_class_view(design: dict) -> tuple[list[str], int]:
    """The lesson as the class meets it: plain text, lesson order, no field names.

    Returns the section's lines and the number of strings it printed.
    """
    criteria = {row["id"]: row for row in design.get("successCriteria") or []}
    sticky = {row["id"]: row["text"] for row in design.get("stickyKnowledge") or []}
    blocks: list[tuple[str, list[str]]] = []

    # Words grouped by the unit they follow, so each group can be dropped into
    # the reading at the point the class actually meets it. A group whose
    # anchor names no unit in this lesson would otherwise vanish from the
    # reading entirely, so anything unplaced trails the last unit and is
    # visible.
    scheduled: dict[str, list[list[str]]] = {}
    for anchor, group in vocabulary_schedule(design):
        scheduled.setdefault(anchor, []).append(
            [f"{row['term']}: {row['definition']}" for row in group]
        )

    def vocabulary_after(source_unit_id: str) -> None:
        for group in scheduled.pop(source_unit_id, []):
            blocks.append(("Vocabulary", group))

    starter = design.get("starter")
    if starter:
        blocks.append(
            (starter["label"], class_view_unit(starter, criteria=criteria, sticky=sticky))
        )
        vocabulary_after(starter.get("sourceUnitId") or "")

    for unit in design.get("teachingSequence") or []:
        blocks.append((unit["label"], class_view_unit(unit, criteria=criteria, sticky=sticky)))
        vocabulary_after(unit.get("sourceUnitId") or "")

    for groups in scheduled.values():
        for group in groups:
            blocks.append(("Vocabulary (unplaced)", group))

    ending = design.get("ending") or {}
    beat = ending.get("beat")
    if ending.get("included") and beat:
        blocks.append((beat["label"], class_view_unit(beat, criteria=criteria, sticky=sticky)))

    worksheet = design.get("worksheet") or {}
    if worksheet.get("status") == "generated":
        strings = class_view_worksheet(worksheet, criteria=criteria, sticky=sticky)
        if strings:
            blocks.append(("Worksheet", strings))

    count = sum(len(strings) for _, strings in blocks)
    year = design["lesson"]["yearGroup"]
    lines = [
        CLASS_VIEW_HEADING,
        "",
        (
            f"{count} child-facing strings for a Year {year} class. Read each one "
            "as that child at the back of the room, then as the teacher saying it "
            "aloud."
        ),
        "",
    ]
    for label, strings in blocks:
        lines.append(f"### {label}")
        for text in strings:
            lines.append(text)
        lines.append("")
    return lines, count


def read_class_view_count(view_path: Path) -> tuple[int, int]:
    """The count and year the review view printed at the head of its class view."""
    for line in view_path.read_text(encoding="utf-8").splitlines():
        match = CLASS_VIEW_COUNT_RE.match(line.strip())
        if match:
            return int(match.group(1)), int(match.group(2))
    raise PacketError(
        "design-review-view.md carries no `## As the class meets it` count line; "
        "re-run prepare so the view and the review come from the same packet"
    )


def require_voice_sweep(
    review_path: Path,
    *,
    expected_count: int,
    expected_year: int,
) -> tuple[int, int, int]:
    """The review must say how many child-facing strings it read, and the number
    must be the one the view printed. This checks reported coverage only;
    it cannot establish that the reviewer read or judged the strings well."""
    lines = review_path.read_text(encoding="utf-8").splitlines()
    positions = [
        index for index, line in enumerate(lines) if line.strip() == VOICE_SWEEP_HEADING
    ]
    expected_line = (
        f"Read {expected_count} child-facing strings as a Year {expected_year} child; "
        "repaired [M]."
    )
    if len(positions) != 1:
        raise PacketError(
            f"design-review.md must contain exactly one {VOICE_SWEEP_HEADING!r} "
            f"heading followed by the line `{expected_line}`, where M is the number "
            "of strings repaired in place"
        )
    cursor = positions[0] + 1
    while cursor < len(lines) and not lines[cursor].strip():
        cursor += 1
    line = lines[cursor].strip() if cursor < len(lines) else ""
    match = VOICE_SWEEP_RE.match(line)
    if not match:
        raise PacketError(
            f"design-review.md {VOICE_SWEEP_HEADING} must be followed by exactly one "
            f"line of the form `{expected_line}`; found {line!r}. The review view "
            f"printed {expected_count} child-facing strings, and M counts the "
            "strings repaired in place"
        )
    read_count, year, repaired = (int(group) for group in match.groups())
    if read_count != expected_count:
        raise PacketError(
            f"design-review.md {VOICE_SWEEP_HEADING} says {read_count} strings were "
            f"read, but the review view printed {expected_count} child-facing "
            f"strings; the line must read `{expected_line}`"
        )
    if year != expected_year:
        raise PacketError(
            f"design-review.md {VOICE_SWEEP_HEADING} names Year {year}, but this is "
            f"a Year {expected_year} lesson; the line must read `{expected_line}`"
        )
    if repaired > read_count:
        raise PacketError(
            f"design-review.md {VOICE_SWEEP_HEADING} repaired {repaired} strings, "
            f"which cannot exceed the {read_count} strings read"
        )
    return read_count, year, repaired


def require_review_judgements(review_path: Path, review_result: str) -> dict[str, str]:
    """Require distinct judgements, not a claim that either was judged well."""
    text = review_path.read_text(encoding="utf-8")
    judgements = {}
    for label in ("Pedagogy", "Daniel-fit"):
        matches = re.findall(
            rf"^{re.escape(label)}: (PASS|REVISE)\s*$", text, re.MULTILINE
        )
        if len(matches) != 1:
            raise PacketError(f"design-review.md requires exactly one '{label}: PASS' or '{label}: REVISE' line")
        judgements[label] = matches[0]
    if review_result == "APPROVED" and "REVISE" in judgements.values():
        raise PacketError("APPROVED requires both Pedagogy and Daniel-fit to PASS")
    if review_result == "REDESIGN REQUIRED" and "REVISE" not in judgements.values():
        raise PacketError("REDESIGN REQUIRED must identify which judgement needs revision")
    return judgements


def build_review_view(design: dict, photo_requirements: dict) -> str:
    concepts = {
        row["id"]: row
        for row in design["concepts"]
    }
    lesson = design["lesson"]

    lines = [
        "# Design Review View",
        "",
        (
            "Generated deterministically from the authoritative "
            "`lesson-design.json` and `photo-requirements.json` before "
            "Design Review. This is a read-only review surface, not a second "
            "authority. It preserves reviewer-relevant meaning and exact "
            "pupil/teacher text while omitting validator-owned bookkeeping "
            "that is not part of qualitative review. Edit only the "
            "authoritative JSON files."
        ),
        "",
        "## Lesson",
        "",
        f"- Structure: {lesson['structure']}",
        f"- Year group: {lesson['yearGroup']}",
        f"- Subject: {lesson['subject']}",
        f"- Full learning objective: {lesson['lo']}",
        f"- Displayed learning objective: {lesson['displayedLo']}",
        f"- Duration: {lesson['durationMinutes']} minutes",
        f"- Scope: {lesson['scope']}",
    ]
    if lesson["deferredLearning"] is not None:
        lines.append(
            f"- Deferred learning: {lesson['deferredLearning']}"
        )
    if lesson["lesson2Direction"] is not None:
        lines.append(
            f"- Lesson 2 direction: {lesson['lesson2Direction']}"
        )
    lines.extend(
        [
            f"- Sticking point: {lesson['stickingPoint']}",
            f"- Vocabulary introduced: {vocabulary_placement_line(design)}",
            "",
        ]
    )
    class_view_lines, _class_view_count = build_class_view(design)
    lines.extend(class_view_lines)
    lines.extend(
        [
            "## Teacher orientation",
            "",
            design["teacherOrientation"],
            "",
            "## Starter",
            "",
        ]
    )
    append_review_unit(
        lines,
        design["starter"],
        concepts=concepts,
    )

    lines.extend(["## Vocabulary", ""])
    for row in design["vocabulary"]:
        lines.extend(
            [
                f"- `{row['id']}` **{row['term']}**: {row['definition']}",
                f"  - Visual: {review_json(row['visual'])}",
            ]
        )
    lines.append("")
    if design["trimmedVocabulary"]:
        append_review_json(
            lines,
            "Trimmed vocabulary",
            design["trimmedVocabulary"],
        )

    lines.extend(["## Representations", ""])
    for row in design["representations"]:
        lines.extend(
            [
                f"### {row['name']} (`{row['id']}`)",
                f"- Purpose: {row['purpose']}",
            ]
        )
        for configuration in row["configurations"]:
            lines.append(
                f"- `{configuration['id']}`: "
                f"{configuration['description']} "
                f"(load-bearing: "
                f"{str(configuration['loadBearing']).lower()})"
            )
            if configuration["requiredFeatures"]:
                lines.append(
                    "  - Required features: "
                    + "; ".join(configuration["requiredFeatures"])
                )
        lines.append("")

    lines.extend(["## Success criteria", ""])
    for row in design["successCriteria"]:
        lines.append(
            f"- `{row['id']}` {row['type']}: "
            f"{review_json(row['content'])}"
        )
    lines.append("")

    lines.extend(["## Sticky knowledge", ""])
    for row in design["stickyKnowledge"]:
        lines.append(f"- `{row['id']}` {row['text']}")
    lines.append("")

    lines.extend(["## Misconceptions", ""])
    for row in design["misconceptions"]:
        lines.extend(
            [
                f"- `{row['id']}` {row['belief']} → "
                f"{row['correctiveFact']}",
                f"  - Strategy: {row['strategy']} | "
                f"Reason: {row['reason']}",
            ]
        )
    lines.append("")

    if design["concepts"]:
        lines.extend(["## Concepts", ""])
        for row in design["concepts"]:
            lines.append(
                f"- `{row['id']}` {row['name']} "
                f"(success criteria: "
                f"{', '.join(row['successCriteriaRefs'])})"
            )
        lines.append("")

    lines.extend(["## Teaching sequence", ""])
    for unit in design["teachingSequence"]:
        append_review_unit(
            lines,
            unit,
            concepts=concepts,
        )

    ending = design["ending"]
    lines.extend(
        [
            "## Ending",
            "",
            f"- Included: {str(ending['included']).lower()}",
            f"- Kind: {ending['kind']}",
            f"- Reason: {ending['reason']}",
            "",
        ]
    )
    if ending["beat"] is not None:
        append_review_unit(
            lines,
            ending["beat"],
            concepts=concepts,
        )

    worksheet = design["worksheet"]
    lines.extend(
        [
            "## Worksheet",
            "",
            f"- Status: {worksheet['status']}",
            f"- Resource mode: {worksheet['resourceMode']}",
            f"- Use: {worksheet['use']}",
        ]
    )
    if worksheet["demand"] is not None:
        lines.append(f"- Demand: {worksheet['demand']}")
    lines.append("")
    for label, key in (
        ("Activity architecture", "activityArchitecture"),
        ("Sheet shape", "sheetShape"),
        (
            "Central write-on-visual exception",
            "centralWriteOnVisualException",
        ),
        ("Content blocks", "contentBlocks"),
        ("Provided worksheet", "providedWorksheet"),
    ):
        value = worksheet[key]
        if value not in (None, []):
            append_review_json(lines, label, value)

    opportunities = design.get("resourceOpportunities")
    if opportunities:
        lines.extend(["## Resource opportunities", ""])
        for key, label in (("stickIn", "Stick-in sheets"), ("workingWall", "Working wall")):
            entry = opportunities[key]
            units = ", ".join(f"`{unit}`" for unit in entry["sourceUnitIds"]) or "none named"
            lines.append(
                f"- {label}: **{entry['decision']}** ({units}) - {entry['reason']}"
            )
        lines.append("")

    lines.extend(["## Planned photographs", ""])
    for row in photo_requirements["photos"]:
        lines.extend(
            [
                f"### `{row['id']}`",
                f"- Subject: {row['subject']}",
                (
                    "- Pedagogical constraint: "
                    f"{row['pedagogical_constraint'] or '(none)'}"
                ),
                f"- Teaching requirement: {row['teaching_requirement']}",
                f"- Load-bearing evidence: {json.dumps(row['load_bearing_evidence'], ensure_ascii=False)}",
                f"- Use: {row['use']}",
                f"- Essential: {str(row['essential']).lower()}",
                f"- Acquisition mode: {row['acquisition_mode']}",
                f"- Source profile: {row['source_profile']}",
                f"- Fallback action: {row['fallback_action']}",
                f"- Fallback note: {row['fallback_note'] if row['fallback_note'] is not None else '(none)'}",
                f"- Generation prompt: {json.dumps(row['generation_prompt'], ensure_ascii=False) if row['generation_prompt'] is not None else '(none)'}",
                f"- Coherent group: {row['coherent_group'] or '(none)'}",
                f"- Coherent mode: {row['coherent_mode']}",
                f"- Coherent visual invariants: {json.dumps(row['coherent_visual_invariants'], ensure_ascii=False)}",
                f"- Filename: {row['filename']}",
                "",
            ]
        )

    if design["slideDesignNotes"]:
        lines.extend(["## Slide design notes", ""])
        lines.extend(
            f"- {item}"
            for item in design["slideDesignNotes"]
        )
        lines.append("")
    if design["flagsForTeacher"]:
        lines.extend(["## Existing flags for the teacher", ""])
        lines.extend(
            f"- {item}"
            for item in design["flagsForTeacher"]
        )
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def canonical_paths(
    plugin_root: Path,
    working_dir: Path,
) -> dict[str, Path]:
    return {
        "lessonDesign": (
            working_dir / "lesson-design.json"
        ).resolve(),
        "designDecisions": (
            working_dir / "design-decisions.md"
        ).resolve(),
        "photoRequirements": (
            working_dir / "photo-requirements.json"
        ).resolve(),
        "preferences": (
            plugin_root / "references" / "preferences.md"
        ).resolve(),
        "doBeats": (
            plugin_root / "references" / "do-beats.md"
        ).resolve(),
    }


def review_reference_paths(
    plugin_root: Path,
    lesson: dict,
) -> dict[str, Path]:
    structure = lesson["structure"]
    route_name = STRUCTURE_REFERENCE_FILES.get(
        structure
    )
    if route_name is None:
        raise PacketError(
            "lesson structure has no Design Review reference: "
            f"{structure!r}"
        )

    route_path = (
        plugin_root / "references" / route_name
    ).resolve()
    require_file(
        route_path,
        "selected teaching-route reference",
    )

    result = {
        "teachingSequence": route_path,
    }
    subject_name = SUBJECT_REFERENCE_FILES.get(
        lesson["subject"]
    )
    if subject_name is not None:
        subject_path = (
            plugin_root / "references" / subject_name
        ).resolve()
        require_file(
            subject_path,
            "selected subject reference",
        )
        result["subject"] = subject_path

    return result


def input_record(path: Path) -> dict:
    return {
        "path": str(path),
        "sha256": sha256_file(path),
    }


def parse_photo_baseline(
    photos: dict,
) -> list[dict]:
    rows = photos.get("photos")

    if not isinstance(rows, list):
        raise PacketError(
            "photo-requirements.json photos must be an array"
        )

    baseline: list[dict] = []
    for position, row in enumerate(rows, 1):
        if not isinstance(row, dict):
            raise PacketError(
                "photo-requirements.json photos entries must be objects"
            )
        baseline.append(
            {
                "position": position,
                "id": row.get("id"),
                "filename": row.get("filename"),
                "essential": row.get("essential"),
            }
        )
    return baseline


def build_review_job_spec(
    job_id: str,
    dependency_job_id: str,
    reference_output: Path,
    view_output: Path,
    paths: dict[str, Path],
    reference_inputs: list[Path],
    teacher_inputs: list[Path],
) -> dict:
    lesson_design = str(paths["lessonDesign"])
    design_decisions = str(paths["designDecisions"])
    photo_requirements = str(paths["photoRequirements"])
    reference = str(reference_output)
    view = str(view_output)
    review = str(
        paths["lessonDesign"].parent
        / "design-review.md"
    )
    outputs = [
        lesson_design,
        design_decisions,
        photo_requirements,
        review,
    ]
    read_only_inputs = [
        reference,
        view,
        *[str(path) for path in reference_inputs],
        *[str(path) for path in teacher_inputs],
    ]

    return {
        "schemaVersion": 1,
        "jobId": job_id,
        "kind": "design-review",
        "executionClass": "worker",
        "capacityClass": "general",
        "dependencies": [dependency_job_id],
        "sourcePaths": read_only_inputs,
        "writePaths": outputs,
        "holdsBarriers": [],
        "requiresClearBarriers": [],
        "maxAttempts": 4,
        "attempt": {
            "role": "design-reviewer",
            "identity": job_id,
            "expectedOutputs": outputs,
            "allowedDeclaredStates": [
                "APPROVED",
                "REDESIGN REQUIRED",
            ],
            "outputsByDeclaredState": {
                "APPROVED": outputs,
                "REDESIGN REQUIRED": outputs,
            },
            "inputs": [
                {
                    "sourcePath": lesson_design,
                    "mode": "read-write",
                },
                {
                    "sourcePath": design_decisions,
                    "mode": "read-write",
                },
                {
                    "sourcePath": photo_requirements,
                    "mode": "read-write",
                },
                *[
                    {
                        "sourcePath": path,
                        "mode": "read-only",
                    }
                    for path in read_only_inputs
                ],
            ],
            "checks": [],
        },
    }


def prepare(args: argparse.Namespace) -> int:
    controller_values = (
        args.job_id,
        args.dependency_job_id,
        args.job_spec_output,
        args.job_manifest_output,
    )
    if any(value is not None for value in controller_values) and not all(
        value is not None for value in controller_values
    ):
        raise PacketError(
            "--job-id, --dependency-job-id, --job-spec-output and "
            "--job-manifest-output must be supplied together"
        )

    plugin_root = Path(
        args.plugin_root
    ).resolve()
    working_dir = Path(
        args.working_dir
    ).resolve()
    preflight_output = Path(
        args.preflight_output
    ).resolve()
    reference_output = Path(
        args.reference_output
    ).resolve()
    view_output = (
        Path(args.view_output).resolve()
        if args.view_output is not None
        else (working_dir / "design-review-view.md").resolve()
    )

    teacher_inputs = [
        Path(args.teacher_brief).resolve(),
        *[
            Path(value).resolve()
            for value in args.teacher_clarification
        ],
        *[
            Path(value).resolve()
            for value in (
                args.orchestrator_context,
                args.lesson_plan_input,
                args.teacher_worksheet_input,
            )
            if value is not None
        ],
    ]

    if len(set(teacher_inputs)) != len(
        teacher_inputs
    ):
        raise PacketError(
            "reviewer read-only inputs contain a duplicate"
        )

    for path in teacher_inputs:
        require_file(
            path,
            "reviewer read-only input",
        )

    remove_stale(
        preflight_output,
        reference_output,
        view_output,
    )

    paths = canonical_paths(
        plugin_root,
        working_dir,
    )

    for label, path in paths.items():
        require_file(path, label)

    validator = validator_command(
        plugin_root,
        working_dir,
    )
    photo_cap = photo_cap_command(
        plugin_root,
        working_dir,
    )

    run_validator(validator)

    (
        photo_count,
        maximum,
        photo_cap_stdout,
    ) = run_photo_cap(photo_cap)

    design = load_json(
        paths["lessonDesign"],
        "lesson-design.json",
    )
    photos = load_json(
        paths["photoRequirements"],
        "photo-requirements.json",
    )
    lesson = design["lesson"]
    worksheet = design["worksheet"]
    reference_paths = review_reference_paths(
        plugin_root,
        lesson,
    )

    (
        reference_text,
        reference_sources,
    ) = build_review_reference(
        paths["preferences"],
        paths["doBeats"],
        reference_paths["teachingSequence"],
        reference_paths.get("subject"),
        lesson,
        worksheet,
        photo_count,
        maximum,
    )

    atomic_write_text(
        reference_output,
        reference_text,
    )

    view_text = build_review_view(
        design,
        photos,
    )
    atomic_write_text(
        view_output,
        view_text,
    )

    baseline = parse_photo_baseline(
        photos
    )

    packet = {
        "schemaVersion": 1,
        "kind": "design-review-preflight",
        "inputs": {
            "lessonDesign": input_record(
                paths["lessonDesign"]
            ),
            "designDecisions": input_record(
                paths["designDecisions"]
            ),
            "photoRequirements": input_record(
                paths["photoRequirements"]
            ),
        },
        "reviewReference": {
            "path": str(reference_output),
            "sha256": sha256_file(
                reference_output
            ),
            "sources": reference_sources,
        },
        "reviewView": {
            "path": str(view_output),
            "sha256": sha256_file(
                view_output
            ),
        },
        "validator": {
            "command": validator,
            "expectedMarker": "LESSON_DESIGN_OK",
            "status": "OK",
        },
        "photoCap": {
            "command": photo_cap,
            "status": "OK",
            "count": photo_count,
            "maximum": maximum,
            "stdout": photo_cap_stdout,
        },
        "derived": {
            "subject": lesson["subject"],
            "yearGroup": lesson["yearGroup"],
            "durationMinutes": lesson[
                "durationMinutes"
            ],
            "structure": lesson["structure"],
            "worksheetStatus": worksheet[
                "status"
            ],
            "worksheetResourceMode": worksheet[
                "resourceMode"
            ],
            "worksheetUse": worksheet["use"],
            "photoCount": photo_count,
            "photoIds": [
                row["id"]
                for row in baseline
            ],
        },
        "protectedPhotoBaseline": baseline,
    }

    atomic_write_json(
        preflight_output,
        packet,
    )

    if all(value is not None for value in controller_values):
        job_spec_path = Path(args.job_spec_output).resolve()
        job_manifest_path = Path(args.job_manifest_output).resolve()
        job_spec = build_review_job_spec(
            args.job_id,
            args.dependency_job_id,
            reference_output,
            view_output,
            paths,
            [
                paths["preferences"],
                paths["doBeats"],
                reference_paths["teachingSequence"],
                *(
                    [reference_paths["subject"]]
                    if "subject" in reference_paths
                    else []
                ),
            ],
            teacher_inputs,
        )
        write_immutable_json(job_spec_path, job_spec)

        write_immutable_json(
            job_manifest_path,
            {
                "schemaVersion": 1,
                "kind": "orchestration-job-manifest",
                "sourceJobId": args.dependency_job_id,
                "jobs": [
                    {
                        "specPath": str(job_spec_path),
                        "specSha256": sha256_file(job_spec_path),
                        "spec": job_spec,
                    }
                ],
            },
        )

    print("DESIGN_REVIEW_PREFLIGHT_OK")
    return 0


def require_preflight_shape(
    preflight: dict,
) -> None:
    if preflight.get("schemaVersion") != 1:
        raise PacketError(
            "preflight schemaVersion must be 1"
        )

    if (
        preflight.get("kind")
        != "design-review-preflight"
    ):
        raise PacketError(
            "preflight kind must be "
            "design-review-preflight"
        )


def require_same_command(
    actual,
    expected: list[str],
    label: str,
) -> None:
    if actual != expected:
        raise PacketError(
            f"{label} command no longer matches "
            "the deterministic expected command"
        )


def require_preflight_inputs(
    preflight: dict,
    paths: dict[str, Path],
) -> None:
    inputs = preflight.get("inputs")

    if not isinstance(inputs, dict):
        raise PacketError(
            "preflight inputs are missing"
        )

    for key in (
        "lessonDesign",
        "designDecisions",
        "photoRequirements",
    ):
        row = inputs.get(key)

        if not isinstance(row, dict):
            raise PacketError(
                f"preflight input {key} is missing"
            )

        if row.get("path") != str(paths[key]):
            raise PacketError(
                f"preflight input {key} path changed"
            )

        sha256 = row.get("sha256")

        if (
            not isinstance(sha256, str)
            or not re.fullmatch(
                r"[0-9a-f]{64}",
                sha256,
            )
        ):
            raise PacketError(
                f"preflight input {key} sha256 "
                "is malformed"
            )


def require_reference_current(
    preflight: dict,
    plugin_root: Path,
    reference_path: Path,
) -> None:
    review_reference = preflight.get(
        "reviewReference"
    )

    if not isinstance(
        review_reference,
        dict,
    ):
        raise PacketError(
            "preflight reviewReference is missing"
        )

    if (
        review_reference.get("path")
        != str(reference_path)
    ):
        raise PacketError(
            "preflight reviewReference path does not "
            "match the supplied reference"
        )

    require_file(
        reference_path,
        "design-review-reference.md",
    )

    if (
        review_reference.get("sha256")
        != sha256_file(reference_path)
    ):
        raise PacketError(
            "design-review-reference.md changed "
            "after preflight"
        )

    sources = review_reference.get(
        "sources"
    )

    if not isinstance(sources, dict):
        raise PacketError(
            "preflight reviewReference.sources "
            "is missing"
        )

    derived = preflight.get("derived")
    if not isinstance(derived, dict):
        raise PacketError(
            "preflight derived metadata is missing"
        )
    routed = review_reference_paths(
        plugin_root,
        derived,
    )
    expected_sources = {
        "preferences": (
            plugin_root / "references" / "preferences.md"
        ).resolve(),
        "doBeats": (
            plugin_root / "references" / "do-beats.md"
        ).resolve(),
        "teachingSequence": routed["teachingSequence"],
        **(
            {"subject": routed["subject"]}
            if "subject" in routed
            else {}
        ),
    }
    expected_scopes = {
        "preferences": "conditional sections by exact heading",
        "doBeats": "decision-point activity section only",
        "teachingSequence": (
            "file start through the line before ## Output Format Block"
        ),
        **(
            {"subject": "complete file"}
            if "subject" in routed
            else {}
        ),
    }

    if set(sources) != set(expected_sources):
        raise PacketError(
            "preflight reviewReference.sources keys changed"
        )

    for key, path in expected_sources.items():
        require_file(path, key)
        row = sources.get(key)

        if not isinstance(row, dict):
            raise PacketError(
                "preflight reviewReference.sources."
                f"{key} is missing"
            )

        if row.get("path") != str(path):
            raise PacketError(
                f"preflight {key} source path changed"
            )

        if (
            row.get("sha256")
            != sha256_file(path)
        ):
            raise PacketError(
                f"canonical {path.name} changed "
                "after preflight"
            )
        if row.get("scope") != expected_scopes[key]:
            raise PacketError(
                f"preflight {key} source scope changed"
            )


def require_review_view_current(
    preflight: dict,
    view_path: Path,
) -> None:
    review_view = preflight.get(
        "reviewView"
    )

    if not isinstance(
        review_view,
        dict,
    ):
        raise PacketError(
            "preflight reviewView is missing"
        )

    if (
        review_view.get("path")
        != str(view_path)
    ):
        raise PacketError(
            "preflight reviewView path does not "
            "match the supplied view"
        )

    require_file(
        view_path,
        "design-review-view.md",
    )

    if (
        review_view.get("sha256")
        != sha256_file(view_path)
    ):
        raise PacketError(
            "design-review-view.md changed after preflight"
        )


def compare_photo_transition(
    preflight: dict,
    photos: dict,
) -> dict:
    baseline = preflight.get(
        "protectedPhotoBaseline"
    )

    if not isinstance(baseline, list):
        raise PacketError(
            "preflight protectedPhotoBaseline "
            "is missing"
        )

    current = photos.get("photos")

    if not isinstance(current, list):
        raise PacketError(
            "photo-requirements.json photos "
            "must be an array"
        )

    if len(current) != len(baseline):
        raise PacketError(
            "protected photo count changed during "
            "Design Review: "
            f"{len(baseline)} -> {len(current)}"
        )

    essential_changes: list[dict] = []

    for position, (
        before,
        after,
    ) in enumerate(
        zip(baseline, current),
        1,
    ):
        if not isinstance(before, dict):
            raise PacketError(
                "preflight protectedPhotoBaseline "
                "entries must be objects"
            )

        if not isinstance(after, dict):
            raise PacketError(
                "photo-requirements.json photos "
                "entries must be objects"
            )

        if before.get("position") != position:
            raise PacketError(
                "preflight protected photo "
                "positions are malformed"
            )

        if (
            after.get("id")
            != before.get("id")
        ):
            raise PacketError(
                "protected photo id changed at "
                f"position {position}: "
                f"{before.get('id')!r} -> "
                f"{after.get('id')!r}"
            )

        if (
            after.get("filename")
            != before.get("filename")
        ):
            raise PacketError(
                "protected photo filename changed at "
                f"position {position}: "
                f"{before.get('filename')!r} -> "
                f"{after.get('filename')!r}"
            )

        if (
            after.get("essential")
            != before.get("essential")
        ):
            essential_changes.append(
                {
                    "position": position,
                    "id": before.get("id"),
                    "before": before.get(
                        "essential"
                    ),
                    "after": after.get(
                        "essential"
                    ),
                }
            )

    return {
        "status": "OK",
        "countUnchanged": True,
        "orderAndIdentityUnchanged": True,
        "essentialChanges": essential_changes,
    }


def parse_review_result(
    review_path: Path,
) -> str:
    require_file(
        review_path,
        "design-review.md",
    )

    lines = review_path.read_text(
        encoding="utf-8"
    ).splitlines()

    heading_positions: list[int] = []

    for heading in REQUIRED_REVIEW_HEADINGS:
        matches = [
            index
            for index, line in enumerate(lines)
            if line.strip() == heading
        ]

        if len(matches) != 1:
            raise PacketError(
                "design-review.md must contain "
                f"exactly one {heading!r} heading"
            )

        heading_positions.append(
            matches[0]
        )

    if heading_positions != sorted(
        heading_positions
    ):
        raise PacketError(
            "design-review.md required headings "
            "are out of order"
        )

    result_heading = heading_positions[0]
    cursor = result_heading + 1

    while (
        cursor < len(lines)
        and not lines[cursor].strip()
    ):
        cursor += 1

    if cursor >= len(lines):
        raise PacketError(
            "design-review.md is missing a usable "
            "## Result value"
        )

    result = lines[cursor].strip()

    if (
        result.startswith("`")
        and result.endswith("`")
        and len(result) >= 2
    ):
        result = result[1:-1]

    if result not in ALLOWED_REVIEW_RESULTS:
        raise PacketError(
            "design-review.md Result must be "
            "exactly APPROVED or REDESIGN REQUIRED"
        )

    return result


def verify(args: argparse.Namespace) -> int:
    plugin_root = Path(
        args.plugin_root
    ).resolve()
    working_dir = Path(
        args.working_dir
    ).resolve()
    preflight_path = Path(
        args.preflight
    ).resolve()
    reference_path = Path(
        args.reference
    ).resolve()
    view_path = Path(
        args.view
    ).resolve()
    review_path = Path(
        args.review
    ).resolve()
    postflight_output = Path(
        args.postflight_output
    ).resolve()

    remove_stale(
        postflight_output
    )

    expected_review = (
        working_dir / "design-review.md"
    ).resolve()

    if review_path != expected_review:
        raise PacketError(
            "review path must be the canonical "
            "[WORKING_DIR]/design-review.md"
        )

    preflight = load_json(
        preflight_path,
        "design-review-preflight.json",
    )

    require_preflight_shape(
        preflight
    )

    paths = canonical_paths(
        plugin_root,
        working_dir,
    )

    for label in (
        "lessonDesign",
        "designDecisions",
        "photoRequirements",
    ):
        require_file(
            paths[label],
            label,
        )

    require_preflight_inputs(
        preflight,
        paths,
    )

    require_reference_current(
        preflight,
        plugin_root,
        reference_path,
    )
    require_review_view_current(
        preflight,
        view_path,
    )

    expected_validator = validator_command(
        plugin_root,
        working_dir,
    )
    expected_photo_cap = photo_cap_command(
        plugin_root,
        working_dir,
    )

    validator_row = preflight.get(
        "validator"
    )
    photo_cap_row = preflight.get(
        "photoCap"
    )

    if (
        not isinstance(validator_row, dict)
        or not isinstance(photo_cap_row, dict)
    ):
        raise PacketError(
            "preflight validator/photoCap "
            "records are missing"
        )

    require_same_command(
        validator_row.get("command"),
        expected_validator,
        "validator",
    )
    require_same_command(
        photo_cap_row.get("command"),
        expected_photo_cap,
        "photo-cap",
    )

    photos = load_json(
        paths["photoRequirements"],
        "photo-requirements.json",
    )

    transition = compare_photo_transition(
        preflight,
        photos,
    )

    run_validator(
        expected_validator
    )

    (
        photo_count,
        maximum,
        photo_cap_stdout,
    ) = run_photo_cap(
        expected_photo_cap
    )

    review_result = parse_review_result(
        review_path
    )

    (
        class_view_count,
        class_view_year,
    ) = read_class_view_count(view_path)
    design_year = load_json(
        paths["lessonDesign"],
        "lesson-design.json",
    )["lesson"]["yearGroup"]
    if class_view_year != design_year:
        raise PacketError(
            "design-review-view.md was prepared for a "
            f"Year {class_view_year} lesson but the "
            f"design now says Year {design_year}"
        )
    (
        sweep_read,
        _sweep_year,
        sweep_repaired,
    ) = require_voice_sweep(
        review_path,
        expected_count=class_view_count,
        expected_year=design_year,
    )

    judgements = require_review_judgements(review_path, review_result)

    postflight = {
        "schemaVersion": 1,
        "kind": "design-review-postflight",
        "result": "OK",
        "reviewResult": review_result,
        "judgements": judgements,
        "preflight": {
            "path": str(preflight_path),
            "sha256": sha256_file(
                preflight_path
            ),
        },
        "reviewReference": {
            "path": str(reference_path),
            "sha256": sha256_file(
                reference_path
            ),
        },
        "reviewView": {
            "path": str(view_path),
            "sha256": sha256_file(
                view_path
            ),
        },
        "reviewReport": {
            "path": str(review_path),
            "sha256": sha256_file(
                review_path
            ),
        },
        "voiceSweep": {
            "childFacingStrings": sweep_read,
            "repaired": sweep_repaired,
        },
        "currentInputs": {
            "lessonDesign": input_record(
                paths["lessonDesign"]
            ),
            "designDecisions": input_record(
                paths["designDecisions"]
            ),
            "photoRequirements": input_record(
                paths["photoRequirements"]
            ),
        },
        "protectedPhotoTransition": (
            transition
        ),
        "validator": {
            "command": expected_validator,
            "expectedMarker": "LESSON_DESIGN_OK",
            "status": "OK",
        },
        "photoCap": {
            "command": expected_photo_cap,
            "status": "OK",
            "count": photo_count,
            "maximum": maximum,
            "stdout": photo_cap_stdout,
        },
    }

    atomic_write_json(
        postflight_output,
        postflight,
    )

    print(
        "DESIGN_REVIEW_POSTFLIGHT_OK"
    )
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=__doc__
    )
    subparsers = parser.add_subparsers(
        dest="command",
        required=True,
    )

    prepare_parser = subparsers.add_parser(
        "prepare"
    )
    prepare_parser.add_argument(
        "--plugin-root",
        required=True,
    )
    prepare_parser.add_argument(
        "--working-dir",
        required=True,
    )
    prepare_parser.add_argument(
        "--preflight-output",
        required=True,
    )
    prepare_parser.add_argument(
        "--reference-output",
        required=True,
    )
    prepare_parser.add_argument(
        "--view-output",
    )
    prepare_parser.add_argument(
        "--teacher-brief",
        required=True,
    )
    prepare_parser.add_argument(
        "--teacher-clarification",
        action="append",
        default=[],
    )
    prepare_parser.add_argument(
        "--orchestrator-context",
    )
    prepare_parser.add_argument(
        "--lesson-plan-input",
    )
    prepare_parser.add_argument(
        "--teacher-worksheet-input",
    )
    prepare_parser.add_argument("--job-id")
    prepare_parser.add_argument("--dependency-job-id")
    prepare_parser.add_argument("--job-spec-output")
    prepare_parser.add_argument("--job-manifest-output")

    verify_parser = subparsers.add_parser(
        "verify"
    )
    verify_parser.add_argument(
        "--plugin-root",
        required=True,
    )
    verify_parser.add_argument(
        "--working-dir",
        required=True,
    )
    verify_parser.add_argument(
        "--preflight",
        required=True,
    )
    verify_parser.add_argument(
        "--reference",
        required=True,
    )
    verify_parser.add_argument(
        "--view",
        required=True,
    )
    verify_parser.add_argument(
        "--review",
        required=True,
    )
    verify_parser.add_argument(
        "--postflight-output",
        required=True,
    )

    return parser


def main(
    argv: list[str] | None = None,
) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.command == "prepare":
            return prepare(args)
        return verify(args)
    except PacketError as exc:
        marker = (
            "DESIGN_REVIEW_PREFLIGHT_FAILED"
            if args.command == "prepare"
            else "DESIGN_REVIEW_POSTFLIGHT_FAILED"
        )
        print(
            f"{marker}: {exc}",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
