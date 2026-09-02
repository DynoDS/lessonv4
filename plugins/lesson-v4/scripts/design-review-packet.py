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
)

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
    (
        "The Teach → Do → Teach → Do Rhythm",
        "Read when two teacher-presented beats run with no pupil action "
        "between them, in any route, when a Do beat practises a different "
        "idea from the one its own Teach just taught, or when a beat "
        "carries a second job that has no beat of its own.",
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
        "Read when the lesson may need an honest split.",
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
    return [
        sys.executable,
        str(
            (
                plugin_root
                / "scripts"
                / "validate-lesson-design.py"
            ).resolve()
        ),
        "--initial-photo-namespace",
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
            "",
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

    postflight = {
        "schemaVersion": 1,
        "kind": "design-review-postflight",
        "result": "OK",
        "reviewResult": review_result,
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
