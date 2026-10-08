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

sys.path.insert(0, str(Path(__file__).resolve().parent))
import beside_teaching  # noqa: E402 - the count the designer's tool and the design check also read

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

# The review view opens with every string a child reads or hears, printed as
# plain text in lesson order, because a reviewer that meets `"task": "..."`
# inside a JSON block reads a specification, and a reviewer that meets the same
# words on their own line hears a child at the back of the room. A
# history lesson went to a class with `What does one visible detail suggest
# about this class?` on the board after a review that corrected nothing: every
# string had passed in its braces. The section's opening line carries the count.
# The reviewer reads it for what the words teach; since 27 September 2026 the
# lesson voice editor walks the same section for how they sound.
CLASS_VIEW_HEADING = "## As the class meets it"
CLASS_VIEW_COUNT_RE = re.compile(
    r"^(\d+) child-facing strings for a Year (\d+) class\."
)

# Content fields a child reads on the board or hears the teacher say, across
# every teaching route. Anything not named here is treated as written for a
# designer or the teacher and never reaches the class-facing view: `activity`,
# `format`, `focus`, `evidenceProduced`, `modelledExemplar`,
# `activityArchitecture`, `teacherListensFor` and their kind. In starter,
# observe, apply and reflect units, activity is the actual pupil prompt, and in
# a skill `prepare` unit in `explanation` mode it is the explanation children
# read on the board. A task lesson's `modelledOn` is the instance its teaching
# is shown on, so the class reads it too.
CHILD_FACING_CONTENT_KEYS = (
    "headline",
    "explanation",
    "teachingText",
    "keyQuestions",
    "task",
    "example",
    "question",
    "prompt",
    "discussionQuestion",
    "sentenceStems",
    "input",
    "materialOnSlide",
    "enablingInput",
    "modelledOn",
    "checkpointQuestion",
    "investigationBrief",
    "accurateExplanation",
    "conditionsAndSafety",
)
ACTIVITY_IS_THE_TASK_KINDS = {"starter", "observe", "apply", "reflect"}
ACTIVITY_IS_READ_PREPARE_MODES = {"explanation"}


def activity_is_child_facing(unit: dict) -> bool:
    """Whether a unit's `activity` is words the class reads rather than a
    description written for a designer."""
    content = unit.get("content") or {}
    return unit.get("kind") in ACTIVITY_IS_THE_TASK_KINDS or (
        unit.get("kind") == "prepare" and content.get("mode") in ACTIVITY_IS_READ_PREPARE_MODES
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
        "unclear, overloaded or answer-giving.",
    ),
    (
        "Classroom Norms",
        "Read when timing, routine teacher autonomy, partner talk or the "
        "visible learning objective is in doubt.",
    ),
    (
        "Slide Philosophy",
        "Read its Lesson Designer parts when a unit's child-facing content "
        "states a rule or fact whose meaning, reason or example lives only "
        "in its script, or when a substantial task arrives with "
        "instructions only."
        " Read its `Lesson Designer content boundaries` too whenever the "
        "view's `Names on the board` lists a real person, place, "
        "organisation or event, for `A name, or a thing the class has "
        "never met, arrives with its context`; a made-up person or a label "
        "such as `Chart A` is not this case.",
    ),
    (
        "Cognitive Load Triage on Scaffolds",
        "Read when a scaffold may reveal the answer, remove necessary "
        "support or overload the task.",
    ),
    (
        "How Much Fits in One Lesson",
        "Read when the lesson sets a second scene partway through (a new "
        "place, time or problem with its own people), when the lesson may "
        "need an honest split, and whenever an idea "
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
    # The old trigger here was "read when a vocabulary image may not carry the
    # intended meaning", which cannot fire on the failure that actually
    # happens: every word set to none. Eleven consecutive decks shipped a
    # text-only vocabulary slide and no review ever opened the section,
    # because absence is not an image that might be wrong.
    (
        "A Picture Beside a Word",
        "Read when any vocabulary word has no visual, and for each such word "
        "name what a camera could be pointed at before accepting none; also "
        "read when a vocabulary image may not carry the intended meaning.",
    ),
    (
        "Lesson Designer visual-need boundary",
        "Read when a teaching or task unit's own content names something "
        "that exists in the world - an object, food, coin, building, place, "
        "practice, event or person doing something - and that unit has no "
        "photograph or representation attached. Count those units from the "
        "view before judging any of them: a lesson with several is the shape "
        "of the failure this section exists to catch, and a lesson whose "
        "units genuinely name no such thing is right to have none."
        " Read it too whenever a beat quotes, voices or names a made-up "
        "person who is present in it, for `A person the lesson invents "
        "counts as something in the world`; one only referred back to is "
        "not this case.",
    ),
    (
        "Sticky Knowledge",
        "Read when a sticky item may be weak, excessive or absent without "
        "reason, or is drawn on by no later stage.",
    ),
    (
        "Success Criteria",
        "Read when criteria are present, with teacher-voice.md → 10. Success "
        "criteria: check each step runs from its own words for a stuck child, "
        "any review cues, and whether drawLive true or false matches a "
        "reference worth retaining.",
    ),
    (
        "The Apply Slide",
        "Read when Apply may be unearned or repeat Your Turn, and when a lesson "
        "that named an idea has no Apply and its reason does not identify its "
        "meaningful instances and independent pupil decision.",
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
        "Read before judging any task that asks children to explain or justify "
        "a verdict, including when no support is supplied, with "
        "teacher-voice.md → 7. Scaffolding. Also read when other support or "
        "release to independence is in doubt.",
    ),
    (
        "Purposeful Endings and Linked Lessons",
        "Read when the ending or linked-lesson boundary is in doubt.",
    ),
    (
        "Source and Scenario Integrity",
        "Read for real, classic, sensitive or changing sources and claims, "
        "a named source, story or clip that may cost more explaining than it "
        "teaches, and any beat that invites children's own experience."
        " Read it too when a made-up person or story stands for a group "
        "the objective is about (`An invented case is evidence about the "
        "group`).",
    ),
    # Only the teaching half. The page half (columns, pricing, blank space,
    # typeface) belongs to the page designers, and the reviewer is told not
    # to choose composition.
    (
        "Worksheets > What the sheet is for",
        "Read when worksheet freshness, purpose, evidence or activity "
        "architecture is in doubt.",
    ),
)

# Read every review, whatever the lesson shows. A trigger that needs the
# reviewer to have noticed the defect first never fires on the defect the
# section exists to calibrate.
ALWAYS_READ_REVIEW_SECTIONS = (
    # This was "read only when a difficult quality boundary remains
    # unresolved", and no review ever found one: the section is the
    # calibration for how much a beat carries and how often a lesson returns
    # to the same evidence, and a reviewer without it passed a history lesson
    # on the features it had (10 September 2026) that was abandoned in the
    # room for its amount.
    (
        "preferences.md",
        "Pride Lessons (Quality Anchor)",
        "Read every review, before the User-fit judgement: it is the "
        "calibration for how much one beat puts in front of the class, and it "
        "holds the Teach slides the teacher chose, written out. A fit judgement "
        "that lists features present has not used it.",
    ),
    # Its old trigger ("when the final task could be produced by a child who
    # missed the teaching") was the finding itself, and its own contents line
    # already says reviewers read it every run.
    (
        "preferences.md",
        "What a Lesson Is For",
        "The learning-contract checks cite it throughout; read it before them.",
    ),
    # The rhythm was a conditional read, and two of its triggers (a Do on a
    # different idea from its own Teach, a beat with a second job) could only
    # be met by a reviewer that had already found the fault. A Year 4 History
    # lesson was approved twice with nothing but punctuation corrections. The
    # teacher's decision of 23 September 2026 made it an every-review read,
    # which also covers a question to the room, once routed to Slide
    # Philosophy, where only one clause on it lived.
    (
        "preferences.md",
        "The Teach → Do → Teach → Do Rhythm",
        "Read every review, before the thinking, practice and evidence "
        "checks: one idea per Teach used by every child before the next, "
        "counted in ideas rather than slides; a question to the room against "
        "every child using the idea; the pairing test; a beat that carries a "
        "second job; a Do whose expected "
        "answer is a summary, headline, recap or restatement of the "
        "explanation its own Teach just gave; orientation and every beat "
        "earning its place; quick checks; and each beat changing the state of "
        "the lesson. When the sequence has three or more Teach "
        "beats, say in your own words the move each Teach taught and what its "
        "own Do makes children do, and check each pair before reading on.",
    ),
    # The explanation standard every route writes its teaching to (takeaway,
    # because, example, what it is not; the first line uses only words the class
    # has; the child's route before the board's shape). It sits inside the
    # content route's Output Format Block, and the route read stops before that
    # block, so a reviewer following its reading card never read the standard it
    # judges Teach boards against (logged 28 September 2026, the day the
    # known-words rule moved into it). Every route has a beat that explains.
    (
        "teaching-sequence-content-based.md",
        "How this teacher explains",
        "Read every review, before the language and teacher-usability "
        "checks: it is the standard every Teach board in every route is "
        "written to, and it holds the rule that a board's first line and its "
        "title use only words the class already has.",
    ),
    # Its trigger was "when vocabulary selection, definition, quantity or
    # placement is in doubt", which the rule that catches an ordinary word a
    # sentence leans on (`government`, `order`) could never trip: the names
    # list does not show those words, and a reviewer who knows them does not
    # see the gap. The teacher's decision of 23 September 2026 made it an
    # every-review read.
    (
        "preferences.md",
        "Vocabulary",
        "Read every review, for `A word the teaching leans on is taught`: the "
        "names list cannot see an ordinary word a sentence leans on, and this "
        "is the rule that catches it. The rest of the section is for when "
        "vocabulary selection, definition, quantity or placement is in doubt.",
    ),
    # The two probes in the thinking checks (can weak understanding still
    # pass; can good understanding be marked wrong) need a calibration across
    # subjects, or a reviewer passes by rejecting every sort and praising
    # every explanation. Seven short contrasts, each with the case where the
    # simpler task is right.
    (
        "task-contrasts.md",
        "The contrasts",
        "Read before the thinking, practice and evidence checks: what a task "
        "actually requires a child to know, beside the simpler task that is "
        "exactly right. It calibrates the two probes; it is not a list of "
        "banned activities.",
    ),
    # The other half of the same calibration (6 October 2026): a task a child
    # passes by remembering the last slide, and the test both faults fail
    # (name the wrong answer first, then put it where it can pull).
    (
        "task-contrasts.md",
        "One story, one process, one set of meanings",
        "Read with the contrasts: saying it back beside using it, the wrong "
        "answer a real child gives, and reading a question from its surface. "
        "It is what `Each Do` is judged against.",
    ),
)

# Sections of a subject file written for another agent. The reviewer checks
# the class lesson; Greater Depth resources are designed after this review.
SUBJECT_SECTIONS_FOR_OTHER_AGENTS = {
    "subject-maths.md": ("Greater Depth in maths",),
}

ROUTE_CHECKS_FILE = "design-review-route-checks.md"
ROUTE_CHECK_SECTIONS = {
    "Skill-based": "Skill-based",
    "Content-based": "Content-based",
    "Discovery": "Discovery",
    "Dialogic": "Dialogic",
    "Task-Centred": "Task-Centred",
}


def _load_reference_reader():
    import importlib.util

    name = "lesson_v4_read_reference"
    if name in sys.modules:
        return sys.modules[name]
    path = Path(__file__).resolve().parent / "read-reference.py"
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    # Registered before running: its dataclass resolves annotations through
    # sys.modules, and an unregistered module fails there.
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def subject_scope(subject_path: Path) -> str:
    return (
        "every section except those written for another agent"
        if SUBJECT_SECTIONS_FOR_OTHER_AGENTS.get(subject_path.name)
        else "complete file"
    )


def subject_selectors(subject_path: Path) -> list[str] | None:
    """Exact read-reference selectors for the reviewer's part of a subject
    file, or None when the whole file is the reviewer's."""
    skipped = SUBJECT_SECTIONS_FOR_OTHER_AGENTS.get(subject_path.name)
    if not skipped:
        return None
    reader = _load_reference_reader()
    text = subject_path.read_text(encoding="utf-8")
    entries = reader.headings(text)
    missing = [title for title in skipped if title not in {h.title for h in entries}]
    if missing:
        raise PacketError(
            f"{subject_path.name} no longer has the section(s) the reviewer skips: "
            + ", ".join(missing)
        )
    top = min((h.level for h in entries if h.level > 1), default=2)
    selectors = ["@intro"]
    for heading in entries:
        if heading.level == top and heading.title not in skipped:
            selectors.append(" > ".join(heading.path))
    return selectors


def read_reference_command(plugin_root: Path, requests: list[str]) -> str:
    # Printed for a shell to run as written; a heading carrying a quote, a
    # dollar or a backtick would run as something else.
    unsafe = [request for request in requests if re.search(r'["$`]', request)]
    if unsafe:
        raise PacketError(
            "a reviewer reading selector cannot be quoted safely: " + ", ".join(unsafe)
        )
    parts = [
        f'"{sys.executable}"',
        f'"{(plugin_root / "scripts" / "read-reference.py").resolve()}"',
        f'--plugin-root "{plugin_root.resolve()}"',
    ]
    parts.extend(f'--select "{request}"' for request in requests)
    return " ".join(parts)


def read_file_command(plugin_root: Path, path: Path) -> str:
    """A whole reference read through the pager, never with cat: on Codex a
    command's output past about 10,000 tokens loses its middle, and the subject
    and route files are each longer than that."""
    return " ".join([
        f'"{sys.executable}"',
        f'"{(plugin_root / "scripts" / "read-reference.py").resolve()}"',
        f'--file "{path}"',
        "--page 1",
    ])


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


def is_later_review(working_dir: Path) -> bool:
    """True once a verified Phase 2 photo freeze exists.

    One reading of the freeze, used by BOTH prepared commands, because a packet
    that validated a later review's references while holding its pictures to
    the initial design budget refused a legitimate 17th picture.
    """
    receipt_path = working_dir / "phase2-initial-photo-requirements.receipt.json"
    if not receipt_path.exists():
        return False
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
    return True


def validator_command(
    plugin_root: Path,
    working_dir: Path,
) -> list[str]:
    # An owner may replace an exhausted picture with a native representation.
    # Its frozen Phase 2 requirement remains provenance, not a fake live use.
    # Keep the strict initial namespace until a verified freeze establishes
    # that this is a later review; all live references still validate below.
    namespace_args = [] if is_later_review(working_dir) else ["--initial-photo-namespace"]
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
    # 16 bounds the initial design; a review after the verified freeze may be
    # looking at a helper's, a repair's or an adaptation's later picture, which
    # the run ceiling exists to allow.
    stage = "run" if is_later_review(working_dir) else "design"
    return [
        sys.executable,
        str(
            (
                plugin_root
                / "scripts"
                / "check-photo-cap.py"
            ).resolve()
        ),
        "--stage",
        stage,
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


def review_source_scopes(subject_path: Path | None) -> dict[str, str]:
    """The reading scope recorded for each hashed source, shared by prepare
    and verify so the two cannot drift."""
    scopes = {
        "preferences": "always-read and conditional sections by exact heading",
        "doBeats": "decision-point activity section only",
        "teachingSequence": (
            "file start through the line before ## Output Format Block"
        ),
        "teacherVoice": "only the section a doubtful explanation calls for (the lesson voice editor owns the rest)",
        "routeChecks": "the lesson's own route section only",
    }
    if subject_path is not None:
        scopes["subject"] = subject_scope(subject_path)
    return scopes


def build_review_reference(
    preferences_path: Path,
    do_beats_path: Path,
    teaching_sequence_path: Path,
    subject_path: Path | None,
    lesson: dict,
    worksheet: dict,
    photo_count: int,
    photo_maximum: int,
    *,
    plugin_root: Path,
    teacher_voice_path: Path,
    route_checks_path: Path,
) -> tuple[str, dict]:
    source_paths = {
        "preferences": preferences_path,
        "doBeats": do_beats_path,
        "teachingSequence": teaching_sequence_path,
        "teacherVoice": teacher_voice_path,
        "routeChecks": route_checks_path,
    }
    if subject_path is not None:
        source_paths["subject"] = subject_path
    source_scopes = review_source_scopes(subject_path)

    always_read = "\n".join(
        f"- `{name}` → `{heading}`: {why}"
        for name, heading, why in ALWAYS_READ_REVIEW_SECTIONS
    )
    always_read_command = read_reference_command(
        plugin_root,
        [f"{name}::{heading}" for name, heading, _ in ALWAYS_READ_REVIEW_SECTIONS],
    )
    preference_routes = "\n".join(
        f"- `{heading}`: {trigger}"
        for heading, trigger in PREFERENCE_REVIEW_ROUTES
    )
    route_section = ROUTE_CHECK_SECTIONS[lesson["structure"]]
    route_checks_command = read_reference_command(
        plugin_root, [f"{ROUTE_CHECKS_FILE}::{route_section}"]
    )
    if subject_path is None:
        subject_instruction = "- Subject reference: No matching subject file exists."
    else:
        selectors = subject_selectors(subject_path)
        if selectors is None:
            subject_instruction = (
                f"- Subject reference: `{subject_path}` - read the complete file, "
                "every page:\n\n```bash\n"
                + read_file_command(plugin_root, subject_path)
                + "\n```"
            )
        else:
            skipped = ", ".join(
                f"`## {title}`"
                for title in SUBJECT_SECTIONS_FOR_OTHER_AGENTS[subject_path.name]
            )
            subject_instruction = (
                f"- Subject reference: `{subject_path}` - read every section except "
                f"{skipped}, which is written for another agent and describes "
                "resources made after this review. Read it with:\n\n"
                "```bash\n"
                + read_reference_command(
                    plugin_root,
                    [f"{subject_path.name}::{selector}" for selector in selectors],
                )
                + "\n```"
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
        "## Reading contract\n\n"
        "This card is the whole reading assignment: the sections below marked "
        "always, and the conditional sections whose trigger you can see in the "
        "lesson. A reading note inside a reference addressed to another agent, "
        "or to someone authoring a lesson from scratch, does not widen it. "
        "A reading command that prints `REFERENCE_READ_PARTIAL` has more pages: "
        "run it again with the `--page` it names until the last page prints "
        "`REFERENCE_READ_OK`, because the host cuts the middle out of any "
        "longer output and the pages are how all of it arrives.\n\n"
        "## Always read\n\n"
        f"{always_read}\n\n"
        "```bash\n"
        f"{always_read_command}\n"
        "```\n\n"
        "## Required semantic references\n\n"
        f"- Teaching-route reference: `{teaching_sequence_path}` - read from "
        "the file start to, but not including, `## Output Format Block`, "
        "page by page:\n\n```bash\n"
        f"{read_file_command(plugin_root, teaching_sequence_path)}\n"
        "```\n\n"
        f"{subject_instruction}\n\n"
        "## Route checks\n\n"
        f"The review checks for a {lesson['structure']} lesson:\n\n"
        "```bash\n"
        f"{route_checks_command}\n"
        "```\n\n"
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


# The structured sections carry what a reviewer needs beyond the words: kinds,
# references, unlocks, thinking, answer delivery, teacher-only notes and the
# fields no child meets. A field the class view has already printed in full is
# named here with this marker instead of printed a second time, so the reviewer
# still sees that the field is filled and reads its words once, in lesson order.
IN_CLASS_VIEW = "(in the class view)"


def class_view_prints(value) -> bool:
    """Whether `class_view_strings` prints this value in full."""
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list) and value:
        return all(isinstance(item, str) for item in value) and any(
            item.strip() for item in value
        )
    return False


def without_class_view_strings(mapping: dict, keys) -> dict:
    """A copy of `mapping` with each fully printed field replaced by the marker."""
    copy = dict(mapping)
    for key in keys:
        if class_view_prints(copy.get(key)):
            copy[key] = IN_CLASS_VIEW
    return copy


def review_content(unit: dict) -> dict:
    content = unit.get("content") or {}
    keys = list(CHILD_FACING_CONTENT_KEYS)
    if activity_is_child_facing(unit):
        keys.append("activity")
    residual = without_class_view_strings(content, keys)
    takeaway = content.get("takeaway")
    if isinstance(takeaway, dict) and takeaway.get("kind") == "text":
        residual["takeaway"] = without_class_view_strings(takeaway, ["text"])
    launch = content.get("launch")
    if isinstance(launch, dict):
        residual_launch = without_class_view_strings(
            launch, ["established", "steps"]
        )
        pair = launch.get("goodLooksLike")
        if isinstance(pair, dict):
            residual_pair = without_class_view_strings(pair, ["difference"])
            for side in ("strong", "weak"):
                instance = pair.get(side)
                if isinstance(instance, dict):
                    residual_pair[side] = without_class_view_strings(
                        instance, ["words"]
                    )
            residual_launch["goodLooksLike"] = residual_pair
        residual["launch"] = residual_launch
    residual = without_class_view_strings(residual, ["reasoningWords"])
    rehearsal = content.get("rehearsal")
    if isinstance(rehearsal, dict):
        residual["rehearsal"] = without_class_view_strings(
            rehearsal, ["sayIt", "partnerAsks"]
        )
    return residual


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
    # Printed even when null. A substantial teaching beat that unlocks nothing
    # is the finding, and a field that only appears when filled hides exactly
    # the case the reviewer is looking for.
    unlocks = unit.get("unlocks")
    lines.append(
        f"- Unlocks: {unlocks}" if unlocks else "- Unlocks: none recorded"
    )
    # The thought this beat makes a child have. Printed beside the content so
    # the reviewer can read it against what the slide shows: a thought a child
    # can complete by reading the slide is copying, whatever the format is.
    thinking = unit.get("thinking")
    lines.append(
        f"- Thinking: {thinking}" if thinking else "- Thinking: none recorded"
    )
    if unit["pupilInstruction"] is not None:
        instruction = unit["pupilInstruction"]
        lines.append(
            "- Pupil instruction: "
            + (IN_CLASS_VIEW if class_view_prints(instruction) else str(instruction))
        )
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

    append_review_json(lines, "Content", review_content(unit))
    if unit.get("taskStructure") is not None:
        append_review_json(lines, "Task structure", unit["taskStructure"])

    notes = unit["speakerNotes"]
    script = notes["script"]
    if script is not None:
        if isinstance(script, str) and script.strip():
            lines.extend([f"- Speaker script: {IN_CLASS_VIEW}", ""])
        else:
            lines.extend(["**Speaker script:**", str(script), ""])
    for label, key in (
        ("On the board", "onTheBoard"),
        ("Teacher information", "teacherInfo"),
        ("Look for", "lookFor"),
    ):
        if notes.get(key) is not None:
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
        # The class view prints a model only when children see it; a model the
        # class never sees is printed here and nowhere else.
        shown = answer["delivery"] in {"answer-slide", "visible-in-unit"} and bool(
            answer["content"]
        )
        lines.append(
            "- Answer/model: " + (IN_CLASS_VIEW if shown else str(answer["content"]))
        )
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


DRAWING_PREFIX = "On the drawing: "


def drawn_words(design: dict) -> dict[tuple[str, str], list[str]]:
    """The words each representation configuration prints for children, as
    the lesson designer quoted them in its `requiredFeatures`, keyed by
    (representation id, configuration id). A drawing's labels are children's
    reading like any board line, so the class view prints them where a unit
    or a worksheet block uses the drawing, and the voice editor's lane
    (`check-voice-edit.py`) reaches them through the view."""
    words: dict[tuple[str, str], list[str]] = {}
    extract = _load_design_validator().diagram_print
    for rep in design.get("representations") or []:
        if not isinstance(rep, dict):
            continue
        for config in rep.get("configurations") or []:
            if not isinstance(config, dict):
                continue
            found = [
                text
                for feature in config.get("requiredFeatures") or []
                for text in extract(feature)
            ]
            if found:
                words[(rep.get("id"), config.get("id"))] = found
    return words


def class_view_drawings(refs: object, drawings: dict | None, out: list[str]) -> None:
    for ref in refs if isinstance(refs, list) else []:
        if isinstance(ref, dict):
            for text in (drawings or {}).get((ref.get("ref"), ref.get("configuration")), []):
                out.append(DRAWING_PREFIX + text)


def class_view_unit(
    unit: dict,
    *,
    criteria: dict[str, dict],
    sticky: dict[str, str],
    drawings: dict[tuple[str, str], list[str]] | None = None,
) -> list[str]:
    """Every string on this unit a child reads or hears, in the order they meet it."""
    out: list[str] = []
    content = unit.get("content") or {}
    if activity_is_child_facing(unit):
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
        pair = launch.get("goodLooksLike")
        if isinstance(pair, dict):
            for side in ("strong", "weak"):
                instance = pair.get(side)
                if isinstance(instance, dict):
                    class_view_strings(instance.get("words"), out)
            class_view_strings(pair.get("difference"), out)
        class_view_strings(launch.get("steps"), out)
    class_view_strings(content.get("reasoningWords"), out)
    rehearsal = content.get("rehearsal")
    if isinstance(rehearsal, dict):
        class_view_strings(rehearsal.get("sayIt"), out)
        class_view_strings(rehearsal.get("partnerAsks"), out)
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
    class_view_drawings(unit.get("representationRefs"), drawings, out)
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
    drawings: dict[tuple[str, str], list[str]] | None = None,
) -> list[str]:
    out: list[str] = []
    for ref in worksheet.get("successCriteriaRefs") or []:
        class_view_criteria(ref, criteria, out)
    for ref in worksheet.get("stickyKnowledgeRefs") or []:
        class_view_strings(sticky.get(ref), out)
    for block in worksheet.get("contentBlocks") or []:
        kind = block.get("kind")
        class_view_drawings(block.get("representationRefs"), drawings, out)
        if kind == "question":
            class_view_strings(block.get("pupilPrompt"), out)
            class_view_strings(block.get("support"), out)
        elif kind == "question-group":
            class_view_strings(block.get("groupPrompt"), out)
            for part in block.get("parts") or []:
                class_view_drawings(part.get("representationRefs"), drawings, out)
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
                class_view_drawings(prompt.get("representationRefs"), drawings, out)
                class_view_strings(prompt.get("pupilPrompt"), out)
                class_view_strings(prompt.get("support"), out)
        elif kind == "child-generated":
            class_view_strings(block.get("generator"), out)
            class_view_strings(block.get("firstRowWorked"), out)
    return out


def review_worksheet_blocks(blocks: list) -> list:
    """The worksheet's blocks with every string `class_view_worksheet` printed
    replaced by the marker, keeping response forms, answers and structure."""
    residual = []
    for block in blocks or []:
        if not isinstance(block, dict):
            residual.append(block)
            continue
        kind = block.get("kind")
        if kind == "question":
            copy = without_class_view_strings(block, ["pupilPrompt", "support"])
        elif kind == "question-group":
            copy = without_class_view_strings(block, ["groupPrompt"])
            if isinstance(block.get("parts"), list):
                copy["parts"] = [
                    without_class_view_strings(part, ["pupilPrompt", "support"])
                    if isinstance(part, dict)
                    else part
                    for part in block["parts"]
                ]
        elif kind == "frame":
            copy = dict(block)
            if isinstance(block.get("sections"), list):
                copy["sections"] = [
                    without_class_view_strings(section, ["heading", "whatGoesHere"])
                    if isinstance(section, dict)
                    else section
                    for section in block["sections"]
                ]
        elif kind == "stimulus-set":
            copy = without_class_view_strings(block, ["stimulus", "pupilAction"])
            if isinstance(block.get("prompts"), list):
                copy["prompts"] = [
                    without_class_view_strings(prompt, ["pupilPrompt", "support"])
                    if isinstance(prompt, dict)
                    else prompt
                    for prompt in block["prompts"]
                ]
        elif kind == "child-generated":
            copy = without_class_view_strings(block, ["generator", "firstRowWorked"])
        else:
            copy = block
        residual.append(copy)
    return residual


def shared_required_features(configurations: list[dict]) -> list[str]:
    """Features every configuration of a representation repeats, in order."""
    if len(configurations) < 2:
        return []
    first = configurations[0].get("requiredFeatures") or []
    return [
        feature
        for feature in first
        if all(feature in (row.get("requiredFeatures") or []) for row in configurations[1:])
    ]


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
    """Every planned vocabulary introduction, in order, as (anchor, words)."""
    return [(anchor, group) for anchor, group, _script in vocabulary_introductions(design)]


def vocabulary_introductions(design: dict) -> list[tuple[str, list[dict], str]]:
    """Every planned vocabulary introduction, in order, as (anchor, words,
    script). The script is what the teacher says while that slide is up; a
    saved design carrying only `vocabularyPlacement` has none.

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
        schedule: list[tuple[str, list[dict], str]] = []
        for entry in introductions:
            if not isinstance(entry, dict):
                continue
            group = [words[ref] for ref in entry.get("vocabularyRefs") or [] if ref in words]
            script = entry.get("script") if isinstance(entry.get("script"), str) else ""
            if group:
                schedule.append((entry.get("after") or starter_id, group, script))
        return schedule

    placement = design.get("vocabularyPlacement")
    anchor = placement["after"] if isinstance(placement, dict) and placement.get("after") else starter_id
    return [(anchor, list(words.values()), "")]


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


def worksheet_heading(design: dict) -> str:
    """The worksheet's heading in the class view. Criteria are never printed
    on a sheet (the teacher, 23 September 2026), so a child doing it uses the
    board's; the heading names, for each list the lesson shows, the last beat
    that showed it, so the reviewer checks they fit the sheet's own task, not
    only the board task they served. A label the lesson uses more than once is
    told apart by its place ("the second Your Turn")."""
    units = design.get("teachingSequence") or []
    labels = [unit.get("label") or "" for unit in units]
    last_shown: dict[str, int] = {}
    for index, unit in enumerate(units):
        for ref in unit.get("successCriteriaRefs") or []:
            if isinstance(ref, str):
                last_shown[ref] = index
    if not last_shown:
        return "Worksheet"
    places = []
    for index in sorted(set(last_shown.values())):
        label = labels[index]
        if labels.count(label) > 1:
            nth = labels[: index + 1].count(label)
            words = ["first", "second", "third", "fourth", "fifth"]
            place = words[nth - 1] if nth <= len(words) else f"number {nth}"
            label = f"the {place} {label}"
        places.append(label)
    return f"Worksheet (done beside the success criteria shown above at {' and at '.join(places)})"


def class_view_blocks(design: dict) -> list[tuple[str, list[str]]]:
    """The class view's strings, grouped under the label of the unit they
    follow, before any of them is printed. `check-voice-edit.py` matches whole
    strings against these, so the lesson voice editor's lane is exactly what
    this view prints."""
    criteria = {row["id"]: row for row in design.get("successCriteria") or []}
    sticky = {row["id"]: row["text"] for row in design.get("stickyKnowledge") or []}
    drawings = drawn_words(design)
    blocks: list[tuple[str, list[str]]] = []

    # Words grouped by the unit they follow, so each group can be dropped into
    # the reading at the point the class actually meets it. A group whose
    # anchor names no unit in this lesson would otherwise vanish from the
    # reading entirely, so anything unplaced trails the last unit and is
    # visible.
    # The slide's script is printed with its words, the way every other beat's
    # is, because the teacher stands in front of a vocabulary slide and says
    # it: a review that never heard those words could not sweep their voice.
    scheduled: dict[str, list[list[str]]] = {}
    for anchor, group, script in vocabulary_introductions(design):
        lines = [f"{row['term']}: {row['definition']}" for row in group]
        if script.strip():
            spoken = re.sub(r"^\s*Say to children:\s*", "", script, count=1)
            lines.append(f"Teacher says: {spoken}")
        scheduled.setdefault(anchor, []).append(lines)

    def vocabulary_after(source_unit_id: str) -> None:
        for group in scheduled.pop(source_unit_id, []):
            blocks.append(("Vocabulary", group))

    starter = design.get("starter")
    if starter:
        blocks.append(
            (starter["label"], class_view_unit(starter, criteria=criteria, sticky=sticky, drawings=drawings))
        )
        vocabulary_after(starter.get("sourceUnitId") or "")

    question = design.get("lessonQuestion")
    if isinstance(question, dict) and question.get("text"):
        # Its own slide after the starter; the voice editor's lane is what
        # this view prints, so the question and its scene line are reworded
        # with the rest of the class's words.
        spoken = re.sub(r"^\s*Say to children:\s*", "", str(question.get("script") or ""), count=1)
        blocks.append(("Our question", [question["text"]] + ([f"Teacher says: {spoken}"] if spoken.strip() else [])))

    for unit in design.get("teachingSequence") or []:
        blocks.append((unit["label"], class_view_unit(unit, criteria=criteria, sticky=sticky, drawings=drawings)))
        vocabulary_after(unit.get("sourceUnitId") or "")

    for groups in scheduled.values():
        for group in groups:
            blocks.append(("Vocabulary (unplaced)", group))

    ending = design.get("ending") or {}
    beat = ending.get("beat")
    if ending.get("included") and beat:
        blocks.append((beat["label"], class_view_unit(beat, criteria=criteria, sticky=sticky, drawings=drawings)))

    worksheet = design.get("worksheet") or {}
    if worksheet.get("status") == "generated":
        strings = class_view_worksheet(worksheet, criteria=criteria, sticky=sticky, drawings=drawings)
        if strings:
            blocks.append((worksheet_heading(design), strings))
    return blocks


def build_class_view(design: dict) -> tuple[list[str], int]:
    """The lesson as the class meets it: plain text, lesson order, no field names.

    Returns the section's lines and the number of strings it printed.
    """
    blocks = class_view_blocks(design)
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
            # Keep authored wording distinct from packet commentary.
            lines.extend("> " + line for line in text.split("\n"))
            lines.append("")
        lines.append("")
    return lines, count


TEACH_KINDS = {"teach", "teach-why", "teach-needed"}

# Words that open a sentence with a capital because they open it, and names a
# Year 4 child is not being asked to learn.
NOT_A_NAME = {
    "I", "A", "An", "The", "Teacher", "OK", "Yes", "No",
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays",
    "January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December", "English", "Year", "Turn",
    "Someone", "I'd", "I'm", "I've", "I'll",
}
NAME_RUN = re.compile(
    r"\b(?:[A-Z][A-Za-z’'-]*|[A-Z]{2,})(?:\s+(?:[A-Z][A-Za-z’'-]*|[A-Z]{2,}|I{1,3}|IV|VI{0,3}|of|the|and|&))*"
)
CONNECTORS = {"of", "the", "and", "&"}
# A sentence's first word is capitalised for being first. When it is one of
# these it is not part of a name, and the rest of the run is (`Every Tudor
# child`, `Did the Mines Act`); any other first word of a longer run is kept,
# because `English Heritage` and `John Pounds` open sentences too.
SENTENCE_OPENERS = {
    "A", "An", "The", "This", "That", "These", "Those", "Every", "Each", "Some", "Many",
    "Most", "All", "Both", "No", "Not", "One", "Two", "Three", "Our", "Your", "Their",
    "His", "Her", "Its", "My", "We", "You", "They", "He", "She", "It", "There", "Here",
    "What", "Which", "Who", "Why", "How", "When", "Where", "Did", "Does", "Do", "Is",
    "Are", "Was", "Were", "Can", "Could", "Would", "Should", "Will", "If", "So", "But",
    "And", "Or", "Then", "Now", "Today", "Use", "Choose", "Sort", "Name", "Add", "Find",
    "Explain", "Look", "Write", "Read", "Say", "Tell", "Put", "Match", "Draw", "Label",
    "Describe", "Compare", "Think", "Talk", "Decide", "Check", "Show", "Give", "Make",
    "Remember", "Imagine", "Before", "After", "During", "In", "On", "At", "For", "From",
    "With", "By", "About", "Later", "Centuries", "Children", "People", "Families",
    "Only", "Sometimes", "Order", "Locate", "Everyone", "Something", "Pass",
    "Help", "Ask", "Meet", "Visit", "Remembering", "Comparing", "Using", "Finding",
    "Looking", "Exploring", "Meeting", "Helping", "Prove", "Maybe", "Perhaps",
}
SOURCE_LABEL = re.compile(r"modern summary|reconstruct\w*|adapted from|\bsummary\b", re.IGNORECASE)


def board_names_in(text: str, known: frozenset[str] | set[str] = frozenset()) -> list[str]:
    """Capitalised runs that are names, not sentence openings.

    A sentence's first word is capitalised for being first, so it is dropped
    and the rest of its run is kept (`Every Tudor child` gives `Tudor`). A
    one-word opening is kept when `known` holds it, meaning the lesson has the
    same word capitalised somewhere nothing else made it so: `Answer:
    Shaftesbury` beside `Lord Shaftesbury`.
    """
    found: list[str] = []
    # A sentence ends at . ! ? or : (also just inside a closing quotation
    # mark), at a semicolon between labelled parts, or at a line break.
    # A table cell (` | `) and a quotation opening mid-line start afresh too.
    for sentence in re.split(r"(?<=[.!?:;])\s+|(?<=[.!?:][\"'”’)\]])\s+|\s+\|\s+|\s+(?=[\"“‘])|\n+", text):
        # A lettered or numbered line, a bullet or a quotation mark in front
        # still leaves the first word first.
        sentence = re.sub(r"^\(?[a-z0-9]{1,2}\)\s*", "", sentence.strip())
        sentence = re.sub(r"^[^A-Za-z]+", "", sentence)
        if not sentence:
            continue
        for match in NAME_RUN.finditer(sentence):
            words = match.group(0).split()
            while words and words[-1] in CONNECTORS:
                words = words[:-1]
            if match.start() == 0 and words:
                first = re.sub(r"['’]s$", "", words[0])
                acronym = len(first) > 1 and first.isupper()
                if first in SENTENCE_OPENERS or (len(words) == 1 and not acronym and first not in known):
                    words = words[1:]
            while words and words[0] in CONNECTORS:
                words = words[1:]
            while words and words[-1] in CONNECTORS:
                words = words[:-1]
            if not words:
                continue
            name = re.sub(r"['’]s$", "", " ".join(words))
            capitals = [re.sub(r"['’]s$", "", word) for word in words if word not in CONNECTORS]
            # Days and months, diagram letters (`A and B`) and Roman numerals are
            # not names a child has to be told about.
            if len(name) < 2 or all(
                word in NOT_A_NAME or len(word) == 1 or re.fullmatch(r"[IVXLCDM]+", word)
                for word in capitals
            ):
                continue
            found.append(name)
    return found


def lesson_units(design: dict) -> list[dict]:
    units = [design["starter"]] if design.get("starter") else []
    units.extend(design.get("teachingSequence") or [])
    ending = design.get("ending") or {}
    if ending.get("included") and ending.get("beat"):
        units.append(ending["beat"])
    return units


def _said_on_the_board(name: str, board_text: str) -> bool:
    """Whether the board has already shown the name as a whole word, so that
    `Victoria` is not counted as said because `Victorian` was."""
    return re.search(rf"(?<![A-Za-z]){re.escape(name)}(?![A-Za-z])", board_text) is not None


def board_reading(design: dict) -> list[tuple[str, list[str], list[str]]]:
    """What the class reads, in the order they meet it, as (where, title,
    board strings): each unit's title (its `label` is the slide title) and
    board, then the vocabulary cards introduced after it. The teacher's script
    is left out: it is how the teacher says the board, and the class cannot
    read it."""
    criteria = {row["id"]: row for row in design.get("successCriteria") or []}
    sticky = {row["id"]: row["text"] for row in design.get("stickyKnowledge") or []}
    cards: dict[str, list[str]] = {}
    for anchor, group, _script in vocabulary_introductions(design):
        cards.setdefault(anchor, []).extend(f"{row['term']}: {row['definition']}" for row in group)
    reading: list[tuple[str, list[str], list[str]]] = []
    for unit in lesson_units(design):
        strings = class_view_unit(unit, criteria=criteria, sticky=sticky)
        title = [piece for piece in re.split(r"\s+[-–]\s+", unit.get("label") or "") if piece.strip()]
        reading.append((unit["label"], title, [text for text in strings if not text.startswith("Teacher says:")]))
        placed = cards.pop(unit.get("sourceUnitId") or "", [])
        if placed:
            reading.append((f"vocabulary cards after {unit['label']}", [], placed))
    for leftover in cards.values():
        reading.append(("vocabulary cards (unplaced)", [], leftover))
    return reading


def spoken_reading(design: dict) -> list[str]:
    """What the teacher says: each unit's script, without its `Say to
    children:` opening, and the script of each vocabulary slide. The class
    hears it and cannot read it, so it is never a place a name is listed from;
    it only shows which words the lesson treats as names."""
    spoken: list[str] = []
    for unit in lesson_units(design):
        script = (unit.get("speakerNotes") or {}).get("script")
        if isinstance(script, str) and script.strip():
            spoken.append(re.sub(r"^\s*Say to children:\s*", "", script, count=1))
    spoken.extend(script for _anchor, _group, script in vocabulary_introductions(design) if script.strip())
    return spoken


def build_board_names(design: dict) -> list[str]:
    """Every name the class reads on the board, where it first appears, and
    whether the board said it earlier.

    Written for the curse the reviewer cannot see from inside: an adult reads
    `Order from Elizabeth I's government` and knows who and what, and a Year 4
    class on 22 September 2026 knew neither, nor the Thames, nor English
    Heritage, and nothing on the board said. A list of the names turns "read
    it as a child" into something a reader who is not a child can do. It reads
    the slide titles and vocabulary cards as well as the board, because a name
    there is read too, and it counts only the board as having said a name
    earlier, because the teacher decided on 23 September 2026 that the notes
    are how to say the board and never teach what the board lacks.
    """
    reading = board_reading(design)
    # A word the board capitalises where nothing made it so is a name wherever
    # it appears, including at the start of a sentence or a title.
    # A title written with every word capitalised says nothing, so only a
    # sentence-case title adds to what is known.
    def capitalised_throughout(piece: str) -> bool:
        words = [word for word in piece.split() if word[:1].isalpha()]
        return len(words) > 1 and all(word[:1].isupper() for word in words)

    known: set[str] = set()
    for _where, title, board in reading:
        for text in [piece for piece in title if not capitalised_throughout(piece)] + board:
            for name in board_names_in(text):
                known.update(re.sub(r"['’]s$", "", word) for word in name.split() if word not in CONNECTORS)
    # A one-word name that opens its board sentence (`England, 1485 to 1603.`,
    # `Bruegel painted ...`) is capitalised there for being first, so the board
    # alone cannot tell it from `Look`. The teacher's script can: a word it
    # capitalises where nothing else made it so is a name, as a word the board
    # capitalises mid-sentence is. The script only vouches for a word; a name
    # only the script says is not listed, because the class cannot read it.
    for spoken in spoken_reading(design):
        for name in board_names_in(spoken):
            known.update(re.sub(r"['’]s$", "", word) for word in name.split() if word not in CONNECTORS)

    def title_names(piece: str) -> list[str]:
        names = board_names_in(piece, known)
        if capitalised_throughout(piece):
            # `Look Closely`: every word has a capital, so none of them says name.
            names = [name for name in names
                     if all(re.sub(r"['’]s$", "", word) in known or word in CONNECTORS for word in name.split())]
        return names

    said_before = ""
    first_seen: dict[str, tuple[str, bool]] = {}
    labels: list[tuple[str, str]] = []
    for where, title, board in reading:
        found = [name for piece in title for name in title_names(piece)]
        found += [name for text in board for name in board_names_in(text, known)]
        for name in found:
            if name not in first_seen:
                first_seen[name] = (where, _said_on_the_board(name, said_before))
        for text in board:
            for label in SOURCE_LABEL.findall(text):
                labels.append((where, label))
        said_before += " " + " ".join(title + board)
    lines = [
        "## Names on the board",
        "",
        (
            "Every name of a person, place, organisation or thing the class reads "
            "on the board, in a slide title or on a vocabulary card, with the beat "
            "where it first appears and whether the board said it earlier. A child "
            "of this year group knows none of them unless this lesson taught it, "
            "and a name an earlier lesson taught still gets a short reminder where "
            "it first appears today. For each, find where the board tells the class "
            "who or what it is in words they can hold; a name nothing explains is a "
            "finding, repaired by a clause in the sentence that brings it in or by "
            "taking it off the board. Ordinary words a sentence leans on "
            "(`government`, `order`, `steam engine`) are not listed: read for them "
            "by `preferences.md` → Vocabulary, `A word the teaching leans on is "
            "taught`."
        ),
        "",
    ]
    if not first_seen:
        lines.append("- None.")
    for name, (label, earlier) in first_seen.items():
        note = "said earlier on the board" if earlier else "not said earlier on the board"
        lines.append(f"- {name}: first on the board in `{label}`; {note}.")
    if labels:
        lines.extend(["", "Words on the board about where a source came from, which a child reads as one more thing to ask about:", ""])
        for label, words in labels:
            lines.append(f"- `{words}` in `{label}`")
    lines.append("")
    return lines


# The count, and the beats it reads, live in `beside_teaching.py` so the
# designer's tool, the design check and this view show one number.
_answer_words = beside_teaching.answer_words
BESIDE_PUPIL_KINDS = beside_teaching.BESIDE_PUPIL_KINDS
BESIDE_SHOWN_KINDS = beside_teaching.BESIDE_SHOWN_KINDS
_beside_teaching_text = beside_teaching.beside_teaching_text
_beside_expected_answer = beside_teaching.beside_expected_answer
_beside_pairs = beside_teaching.beside_pairs


def build_do_beside_teach(design: dict) -> list[str]:
    """Each pupil beat with the teaching it follows and the answer it expects.

    The class view prints them in order, but the expected answer of a quick
    check is usually teacher-only and lives far down the view, so the
    restatement (`Steam could drive roundabouts, so children had a new kind of
    ride to enjoy`, every word of it said on the slide before) is never seen
    beside what the class was just told. Until 4.2.286 this read only a
    content lesson's Do straight after a Teach, printed a structured sort's
    answer as `(none written)` and ignored the Teach's takeaway, so the same
    restatement as a sort, or as a Your Turn re-sorting the shapes just
    placed, passed unseen.

    Until 6 October 2026 the count closed with `where to look, not the
    verdict`, and a review shown `16 of 17` beside a task whose answer was its
    Teach board approved it. Now each Do says what it brings or that it is
    rehearsal (`beside_teaching.py`), the claim is printed here beside the
    count and the teaching sentence nearest the answer, and the review gives
    each one a line.
    """
    lines = [
        "## Each Do beside the teaching before it",
        "",
        (
            "For each beat where children use what was just taught, in every "
            "route: the teaching sentence nearest the answer, the answer the "
            "design expects, how many of that answer's words the teaching "
            "already said, and what the design says the task brings. A high "
            "count does not make a beat wrong: a task that uses a taught idea "
            "on a new case says the idea in the Teach's words. So for every "
            "Do, decide which it is and write it in `Each Do`: it uses the "
            "learning on something the class has not been shown; it is "
            "rehearsal, and rehearsal is the right job at that point; or it "
            "can be answered by remembering the last slide (`preferences.md` "
            "→ `A quick check is a fresh case, not the last slide again`). "
            "The design's own claim is a claim: read `new` against the "
            "teaching sentence, and `rehearsal` against where the lesson then "
            "uses the thing rehearsed."
        ),
        "",
    ]
    rows = beside_teaching.read_beside(design)
    whole = beside_teaching.whole_lesson_line(rows)
    if whole:
        lines.extend([whole, ""])
    count = 0
    for row in rows:
        shown, pupil = row.shown, row.pupil
        answer = row.answer
        content = pupil.get("content") or {}
        asked = (
            pupil.get("pupilInstruction")
            or content.get("task")
            or content.get("discussionQuestion")
            or content.get("question")
            or content.get("example")
            or content.get("activity")
            or ""
        )
        asked = " ".join(str(asked).split())
        before = [unit for unit in shown
                  if not (unit.get("label") == pupil.get("label") and unit.get("kind") == pupil.get("kind"))]
        if not before:
            lines.append(f"### {pupil['label']} (its own pupil instruction)")
        else:
            names = ", ".join(f"`{unit['label']}`" for unit in before)
            lines.append(f"### {pupil['label']} (after {names})")
        lines.append(f"- Asked: {asked}")
        structure = pupil.get("taskStructure") or {}
        items = [entry.get("label", "") for entry in structure.get("items") or [] if entry.get("label")]
        if items and structure.get("kind") == "option-bank":
            lines.append("- Options: " + " | ".join(items))
        elif items and structure.get("kind") == "sort":
            groups = [entry.get("label", "") for entry in structure.get("groups") or []]
            lines.append("- Cards: " + " | ".join(items) + "; groups: " + " | ".join(groups))
        if row.total and row.taught_sentence:
            lines.append(f"- The teaching said: {row.taught_sentence}")
        lines.append(f"- Expected answer: {answer or '(none written)'}")
        if row.total:
            lines.append(
                f"- Words of the expected answer the Teach's board or script already said: "
                f"{row.repeated} of {row.total}"
            )
        declared = row.declaration_line()
        if declared:
            lines.append(f"- {declared}")
        lines.append("")
        count += 1
    if not count:
        lines.extend(["- No beat where children use the teaching follows a teaching beat.", ""])
    return lines


def _load_do_beats_in_a_row():
    import importlib.util

    name = "lesson_v4_do_beats_in_a_row"
    if name in sys.modules:
        return sys.modules[name]
    path = Path(__file__).resolve().parent / "do-beats-in-a-row.py"
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def build_child_seat(design: dict) -> list[str]:
    """The whole lesson as the class lives it, from the same reading the
    designer's completion check uses. Each Do beat can pass beside its own
    Teach while the run of them is one long listen: the 30 September 2026
    Nativity lesson was approved with every task before the writing answered
    alone, off the board, and the class was lost."""
    seat = _load_do_beats_in_a_row().child_seat(design)
    return [
        "## The lesson from a child's seat",
        "",
        (
            "Every stretch where children only listen, and every time they do "
            "something, in the order the class meets it. Read it for the "
            "pupil-experience check (`preferences.md` → `Use variety "
            "deliberately, without a quota`): a run of tasks each answered "
            "alone, off the board, giving back what was just said, is a lesson "
            "children listened to rather than did, however right each beat is "
            "beside its Teach. Read the count of what children do between the "
            "starter and the main work, and after it, against `preferences.md` → "
            "`A lesson holds two or three Dos, then its final task`. The numbers "
            "are where to look, not the verdict."
        ),
        "",
        seat[0],
        *(f"- {line.strip()}" for line in seat[1:]),
        "",
    ]


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


def require_review_judgements(review_path: Path, review_result: str) -> dict[str, str]:
    """Require distinct judgements, not a claim that either was judged well."""
    text = review_path.read_text(encoding="utf-8")
    judgements = {}
    for label in ("Pedagogy", "User-fit"):
        matches = re.findall(
            rf"^{re.escape(label)}: (PASS|REVISE)\s*$", text, re.MULTILINE
        )
        if len(matches) != 1:
            raise PacketError(f"design-review.md requires exactly one '{label}: PASS' or '{label}: REVISE' line")
        judgements[label] = matches[0]
    if review_result == "APPROVED" and "REVISE" in judgements.values():
        raise PacketError("APPROVED requires both Pedagogy and User-fit to PASS")
    if review_result == "REDESIGN REQUIRED" and "REVISE" not in judgements.values():
        raise PacketError("REDESIGN REQUIRED must identify which judgement needs revision")
    return judgements


# Units whose work is the lesson's final performance. A sticky fact that no
# later stage draws on has been told rather than learned; this lists the
# references so the reviewer starts from the design's own claim rather than
# from memory. References are availability decisions, so the reviewer still
# reads the task: the designer withholds a fact from a task it would answer.
FINAL_WORK_KINDS = {
    "your-turn",
    "practise",
    "use-learning",
    "do-task",
    "synthesise",
    "apply",
    "reflect",
}


def concept_instances(design: dict, concept_id: str) -> list[dict]:
    units = list(design.get("teachingSequence") or [])
    ending = design.get("ending") or {}
    beat = ending.get("beat") if ending.get("included") else None
    if beat:
        units.append(beat)
    return [u for u in units if u.get("conceptRef") == concept_id]


def sticky_usage(design: dict) -> dict[str, tuple[list[str], list[str]]]:
    units = list(design.get("teachingSequence") or [])
    ending = design.get("ending") or {}
    beat = ending.get("beat") if ending.get("included") else None
    if beat:
        units.append(beat)
    worksheet = design.get("worksheet") or {}
    usage: dict[str, tuple[list[str], list[str]]] = {}
    for row in design.get("stickyKnowledge") or []:
        sid = row["id"]
        referenced: list[str] = []
        final: list[str] = []
        for unit in units:
            refs = set(unit.get("stickyKnowledgeRefs") or [])
            takeaway = (unit.get("content") or {}).get("takeaway") or {}
            if takeaway.get("kind") == "sticky" and takeaway.get("ref") == sid:
                refs.add(sid)
            if sid not in refs:
                continue
            label = f"{unit.get('label')} (`{unit.get('kind')}`)"
            referenced.append(label)
            if unit.get("kind") in FINAL_WORK_KINDS:
                final.append(label)
        if sid in (worksheet.get("stickyKnowledgeRefs") or []):
            referenced.append("worksheet")
            final.append("worksheet")
        usage[sid] = (referenced, final)
    return usage


# `Same? Move right.` / `Different? Choose < or >.`: a short question then an
# instruction. Lookup rows naming content (`Hours → minutes? × 60`) are table
# cells, not steps, and are not checked here.
FRAGMENT_CONDITION = re.compile(r"^[^?.!]{1,30}\?\s+\S")
# A full stop, then a capital: `Look at the equator. Above means north.`
# Digits (`1.5`) and a leading sparkle-note are not sentence breaks.
SECOND_SENTENCE = re.compile(r"[a-z0-9)][.!]\s+[A-Z]")


def criteria_review_cues(row: dict, vocabulary_terms: list[str] | None = None) -> list[str]:
    """Counts invite semantic review; they neither approve nor reject wording."""
    content = row.get("content") or {}
    steps = content.get("steps") or []
    rows = content.get("rows") or []
    cues = []
    if len(steps) > 5:
        cues.append(f"{len(steps)} steps: keep necessary actions; check the complete panel fits")
    if len(rows) > 5:
        cues.append(f"{len(rows)} rows: check lookup load and readable placement")
    # A length cue on its own only ever pushed review towards shorter steps,
    # and the September 2026 lists the user rewrote were short and vague. Long
    # steps still get a reread for explanation the teaching already gave. A
    # second sentence and a question step are asked about, not faulted: the
    # teacher's decisions of 23 September 2026 keep a condition that is part of
    # the step and a question that tells the child what to do next.
    # A step may carry smaller points on lines of its own (what only some
    # children need on only some questions). The step is its first line, and
    # the cues below are asked of that; a smaller point is a cue, so a long one
    # is raised (the teacher's own lists, 8 October 2026).
    for index, step in enumerate(steps, 1):
        whole = step if isinstance(step, str) else str((step or {}).get("text", ""))
        lines = [line.strip() for line in whole.splitlines() if line.strip()]
        text = lines[0] if lines else ""
        for point in lines[1:]:
            if len(point.split()) > 10:
                cues.append(
                    f"step {index}: a smaller point of {len(point.split())} words; it is "
                    "there for a glance, so is it as brief as a cue (the child's question, then what to do)?"
                )
        words = len(text.split())
        if words > 16:
            cues.append(
                f"step {index}: {words} words; reread for explanation the "
                "teaching already gave, keeping every word that makes it runnable"
            )
        if SECOND_SENTENCE.search(text.strip()):
            cues.append(
                f"step {index}: more than one sentence; does the second only "
                "name what the step produced, restate it or explain it (then it "
                "goes), is it a second step, or is it a condition that is part of the "
                "step or a stem the child writes into (then it stays)?"
            )
        if FRAGMENT_CONDITION.match(text.strip()):
            cues.append(
                f"step {index}: a question step; does it tell the child what to "
                "do next or what to look for? If so it stands, as `Same? Move "
                "right.` does"
            )
        # 14 September 2026: `Decide which two landmarks the number lies
        # between.` read as a clear sentence and passed, because the lesson had
        # given `landmark` a vocabulary slide. The cue only points; a subject
        # word the learning needs is right to stay.
        for term in vocabulary_terms or []:
            pattern = r"\b" + re.escape(term) + r"(s|es)?\b"
            if re.search(pattern, text, re.IGNORECASE):
                cues.append(
                    f"step {index}: uses `{term}` from this lesson's vocabulary; "
                    "is it the subject's own word, or a name for something the "
                    "child can already see and the step could name?"
                )
    for r, cells in enumerate(rows, 1):
        for c, cell in enumerate(cells, 1):
            words = len(str(cell).split())
            if words > 16:
                cues.append(f"row {r}, cell {c}: {words} words; reread for a scannable lookup")
    return cues


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
    ]
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
            "## Beyond the words",
            "",
            (
                "Everything below adds what the class view does not show: kinds, "
                "references, what each beat unlocks, teacher-only notes, answer "
                "delivery and the fields no child meets. A field marked "
                f"`{IN_CLASS_VIEW}` is filled, and its words are printed above "
                "under the same heading."
            ),
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

    question = design.get("lessonQuestion")
    lines.extend(["## Lesson question", ""])
    if isinstance(question, dict) and question.get("text"):
        lines.extend([
            f"- Question (its own slide after the starter): {question['text']}",
            f"- Teacher says: {question.get('script', '')}",
            f"- Picture: {', '.join(question.get('photoRefs') or []) or '(none)'}",
            f"- Why this lesson earns it, and how the final task answers it: {question.get('reason', '')}",
            "- Read it against `preferences.md` → `A lesson question, when one earns its place`: the final "
            "task answers it, this lesson alone can answer it, a child cannot answer it well yet, and the "
            "answer is the learning.",
            "",
        ])
    else:
        lines.extend(["- None. Most lessons have none; never ask for one.", ""])

    lines.extend(["## Vocabulary", ""])
    scheduled_words = {
        row["id"] for _, group in vocabulary_schedule(design) for row in group
    }
    for row in design["vocabulary"]:
        definition = (
            IN_CLASS_VIEW if row["id"] in scheduled_words else row["definition"]
        )
        lines.extend(
            [
                f"- `{row['id']}` **{row['term']}**: {definition}",
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
        shared = shared_required_features(row["configurations"])
        if shared:
            lines.append(
                "- Required in every configuration: " + "; ".join(shared)
            )
        for configuration in row["configurations"]:
            lines.append(
                f"- `{configuration['id']}`: "
                f"{configuration['description']} "
                f"(load-bearing: "
                f"{str(configuration['loadBearing']).lower()})"
            )
            own = [
                feature
                for feature in configuration["requiredFeatures"]
                if feature not in shared
            ]
            if own:
                lines.append(
                    "  - Required features: "
                    + "; ".join(own)
                )
        lines.append("")

    lines.extend(["## Success criteria", ""])
    vocabulary_terms = [
        str(row.get("term") or "").strip()
        for row in design.get("vocabulary") or []
        if str(row.get("term") or "").strip()
    ]
    mark_lines = criteria_mark_lines(design)
    for index, row in enumerate(design["successCriteria"]):
        lines.append(
            f"- `{row['id']}` {row['type']} "
            f"(drawLive: {str(row['drawLive']).lower()}): "
            f"{review_json(row['content'])}"
        )
        for cue in criteria_review_cues(row, vocabulary_terms):
            lines.append(f"  - Review cue (not a failure): {cue}.")
        for line in mark_lines.get(index, []):
            lines.append(f"  - {line}")
    lines.append("")

    lines.extend(["## Sticky knowledge", ""])
    usage = sticky_usage(design)
    for row in design["stickyKnowledge"]:
        lines.append(f"- `{row['id']}` {row['text']}")
        referenced, final = usage[row["id"]]
        lines.append(
            "  - Referenced by: "
            + (", ".join(referenced) if referenced else "no unit")
        )
        lines.append(
            "  - Drawn on by final work (by reference): "
            + (
                ", ".join(final)
                if final
                else "none - a reference is availability, not use, so read "
                "the final task and ending for whether this fact is needed"
            )
        )
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
                f"{', '.join(row['successCriteriaRefs']) or 'none'})"
            )
            # An idea is learned across instances whose evidence differs. List
            # them with their pictures and whether they carry their own source
            # text, so a reviewer can see at a glance when every instance is
            # the same pair of objects under a new title.
            instances = concept_instances(design, row["id"])
            for unit in instances:
                content = unit.get("content") or {}
                own_text = bool(content.get("teachingText")) or bool(content.get("task"))
                lines.append(
                    f"  - Instance: {unit.get('label')} (`{unit.get('kind')}`) | pictures: "
                    + (", ".join(unit.get("photoRefs") or []) or "none")
                    + (" | carries its own source text" if own_text else "")
                )
            photo_sets = {tuple(sorted(u.get("photoRefs") or [])) for u in instances}
            if len(instances) >= 2 and len(photo_sets) == 1 and next(iter(photo_sets)):
                lines.append(
                    "  - Evidence: every instance uses the same pictures; read whether the "
                    "evidence genuinely changes between them or the idea is being shown once, twice"
                )
        lines.append("")

    lines.extend(["## Teaching sequence", ""])
    for unit in design["teachingSequence"]:
        append_review_unit(
            lines,
            unit,
            concepts=concepts,
        )

    lines.extend(build_board_names(design))
    lines.extend(build_do_beside_teach(design))
    lines.extend(build_child_seat(design))

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
        if key == "contentBlocks" and worksheet["status"] == "generated":
            value = review_worksheet_blocks(value)
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


def _load_design_validator():
    import importlib.util

    name = "lesson_v4_validate_lesson_design"
    if name in sys.modules:
        return sys.modules[name]
    path = Path(__file__).resolve().parent / "validate-lesson-design.py"
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def criteria_mark_lines(design: dict) -> dict[int, list[str]]:
    """What the review page says beside a criteria list the lesson designer
    has marked too long for every criteria panel, keyed by the list's position.
    A marked list too long even at 16pt passes the lesson check with a note,
    because the deck is always made; here the reviewer is asked to send it
    back to the lesson designer, naming the tightening (the teacher's ruling of
    24 September 2026: the fix is the designer's, the reviewer names it)."""
    status = _load_design_validator().criteria_fit_status(design.get("successCriteria"))
    lines: dict[int, list[str]] = {}
    for entry in status["marked"]:
        lines.setdefault(entry["index"], []).append(
            "Lesson check (read this one): no criteria panel a slide is built with holds this "
            "list at 18pt, and the lesson designer has marked it too long for them after trying "
            "to tighten it, so every slide that shows it will draw the list smaller than the "
            "18pt floor, down to 16pt, and be flagged for the teacher to check before teaching. "
            "Could the list be tightened until it fits at 18pt, with every step still telling a "
            "stuck child what to do? If so, return `REDESIGN REQUIRED` and name the tightening: "
            "the words are the lesson designer's to change."
        )
    for entry in status["beyond_smaller"]:
        lines.setdefault(entry["index"], []).append(
            "Lesson check (read this one): no criteria panel a slide is built with holds this "
            "list even at 16pt, the least a list marked too long is drawn at, so every slide that "
            "shows it will reach the teacher as a page to check before teaching, with its "
            "question, working space and criteria not drawn. Return `REDESIGN REQUIRED` and name "
            "the tightening that brings it to 16pt at least, and to 18pt if it can, with every "
            "step still telling a stuck child what to do: the words are the lesson designer's to "
            "change."
        )
    for entry in status["stale"]:
        lines.setdefault(entry["index"], []).append(
            "Lesson check: this list is marked too long for the criteria panels, but the check "
            "does not find it too long; say so in your review, so the mark and the flag that "
            "explains it come out and the teacher is not told something untrue."
        )
    return lines


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
        "teacherVoice": (
            plugin_root / "references" / "teacher-voice.md"
        ).resolve(),
        "routeChecks": (
            plugin_root / "references" / ROUTE_CHECKS_FILE
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
        plugin_root=plugin_root,
        teacher_voice_path=paths["teacherVoice"],
        route_checks_path=paths["routeChecks"],
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
                paths["teacherVoice"],
                paths["routeChecks"],
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
    canonical = canonical_paths(plugin_root, plugin_root)
    expected_sources = {
        "preferences": canonical["preferences"],
        "doBeats": canonical["doBeats"],
        "teacherVoice": canonical["teacherVoice"],
        "routeChecks": canonical["routeChecks"],
        "teachingSequence": routed["teachingSequence"],
        **(
            {"subject": routed["subject"]}
            if "subject" in routed
            else {}
        ),
    }
    expected_scopes = review_source_scopes(routed.get("subject"))

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


EACH_DO_HEADING = "## Each Do"
EACH_DO_VERDICTS = ("uses", "rehearsal", "says it back", "guessable")


def require_every_do_has_its_line(review_path: Path, design: dict) -> None:
    """Every Do the design sets gets one line in the review, with a verdict.

    On 6 October 2026 a review sent one beat of a science lesson back and
    listed the beat beside it under `Preserve`. That beat's answer was its
    Teach board, 16 words of 17, and no later pass looked at it again, because
    a beat named as passing is protected. A line for each Do is how a review
    shows it read every one before it names any as sound. This checks that
    the line is there; whether the verdict is right is the review's own work.
    """
    labels = [
        row.pupil.get("label")
        for row in beside_teaching.read_beside(design)
        if row.declares and row.pupil.get("label")
    ]
    if not labels:
        return
    lines = review_path.read_text(encoding="utf-8").splitlines()
    starts = [index for index, line in enumerate(lines) if line.strip() == EACH_DO_HEADING]
    if len(starts) != 1:
        raise PacketError(
            f"design-review.md must contain exactly one {EACH_DO_HEADING!r} heading: one line "
            "for each Do and quick check, saying whether it uses the learning on something "
            "new, is rehearsal, says it back, or is guessable"
        )
    section: list[str] = []
    for line in lines[starts[0] + 1:]:
        if line.startswith("## "):
            break
        section.append(line)
    for label in labels:
        own = [line for line in section if label in line]
        if not own:
            raise PacketError(
                f"design-review.md {EACH_DO_HEADING!r} has no line for `{label}`"
            )
        if not any(verdict in line.lower() for line in own for verdict in EACH_DO_VERDICTS):
            raise PacketError(
                f"design-review.md {EACH_DO_HEADING!r}: the line for `{label}` gives no verdict "
                f"(one of: {', '.join(EACH_DO_VERDICTS)})"
            )


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

    judgements = require_review_judgements(review_path, review_result)
    require_every_do_has_its_line(
        review_path,
        load_json(paths["lessonDesign"], "lesson-design.json"),
    )

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
