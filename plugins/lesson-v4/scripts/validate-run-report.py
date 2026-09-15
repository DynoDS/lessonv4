#!/usr/bin/env python3
"""Read-only validator for the one complete run report.

At delivery the orchestrator writes ``[WORKING_DIR]/run-report.md`` - the single
record of what the run produced, what it could not, and why. This validator
proves that record: the headings are all present in order, the package status
is one of the four allowed values and never claims ``COMPLETE`` the evidence
cannot support, every earned resource is accounted for, every delivered path
exists, every picture the contract promised and the run did not publish is
named, and the run's friction record - every obstacle, block and repair round,
each tagged with the agent it came from - is reported.

    python3 validate-run-report.py \
        --working-dir PATH --output-dir PATH --report PATH

Exit 0 and print ``RUN_REPORT_OK`` when the report holds. Otherwise exit 1 and
print every failure found, so one run reports everything that is wrong rather
than one problem at a time.

Standard library only. Writes nothing.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

HEADINGS = [
    "# Lesson run report",
    "## Outcome",
    "## Delivered resources",
    "## Excluded resources",
    "## Blocking faults",
    "## Accepted minor issues",
    "## Build attempts",
    "## Worker launches",
    "## Picture results",
    "## Helper gaps",
    "## Friction",
    "## Shared investigation log",
]

PACKAGE_STATUSES = ("COMPLETE", "PARTIAL", "BLOCKED", "UNVERIFIED")
# Every terminal state `worker-launch.py audit` can reach. Requiring one of them
# is what stops a run reporting clean while its workers ran on the controller's
# model instead of their own: without this the check could simply not be run,
# and nothing downstream would know.
WORKER_LAUNCH_MARKERS = (
    "WORKER_LAUNCH_AUDIT_OK",
    "WORKER_LAUNCH_AUDIT_FAILED",
    "WORKER_LAUNCH_AUDIT_UNAVAILABLE",
)
# Every terminal state the finaliser can write that leaves a lesson without its
# picture. A publication failure is a missing picture too, so the teacher must be
# told about it in the run report.
PICTURE_FAILURE_STATES = ("omitted", "unsatisfied", "picture_publish_failed")
# The one state that means the lesson actually got the picture it promised.
PICTURE_PUBLISHED_STATE = "published"

# The resources a run can earn, and the specification that proves each.
EARNED_RESOURCES = [
    ("slides", "lesson.json", "slides"),
    ("worksheets", "worksheet.json", "sheets"),
    ("working wall", "working-wall.json", "cards"),
    ("stick-in sheets", "stick-in-sheets.json", "items"),
]

# The resources whose designer runs on every lesson and answers with its spec
# file, empty or not. A missing file means nobody made the decision: that
# silent skip once cost a teacher a wall the lesson had clearly earned, so it
# must surface as an explicit exclusion rather than pass as "not earned".
DECIDED_RESOURCES = [
    ("working wall", "working-wall.json", "cards"),
    ("stick-in sheets", "stick-in-sheets.json", "items"),
]

STATUS_LINE_RE = re.compile(
    rf"^Package status: ({'|'.join(PACKAGE_STATUSES)})$"
)
SHARED_LOG_STATUS_RE = re.compile(r"^Status: (UPDATED|QUEUED|NOT REQUIRED)$")
NOT_DELIVERED_RE = re.compile(r"^-\s*(?P<name>.+?):\s*NOT DELIVERED\s*-\s*(?P<reason>\S.*)$")

NONE_LINE_RE = re.compile(r"^-\s*none\.?\s*$", re.IGNORECASE)
BULLET_RE = re.compile(r"^-\s*\S")

# Every line of ``friction.md`` names the agent it came from and which of the
# three record kinds it is. Untagged friction is what this shape exists to stop:
# a run's obstacles used to arrive as loose sentences with no way to tell which
# role met them, so nothing in the file could be traced back to a decision point
# and the whole record read as noise. The orchestrator writes the tag, because
# it is the only party that knows which spawn a line came back from.
FRICTION_RECORD_RE = re.compile(
    r"^AGENT:\s*(?P<role>[^|]*\S)\s*\|\s*(?P<kind>FRICTION|BLOCK|REPAIR):\s*(?P<body>\S.*)$"
)
# A repair round's verdict. A repair recorded without one is the case the file
# most needs: "a repairer came in" and "the fault went away" are different
# facts, and only the second closes an investigation.
REPAIR_VERDICT_RE = re.compile(r"\bNOT FIXED\b|\bFIXED\b")


def read_json(path: Path, label: str, failures: list[str]):
    if not path.is_file():
        failures.append(f"{label}: file does not exist: {path}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        failures.append(f"{label}: not readable JSON: {exc}")
        return None


def design_skipped_stick_in(design) -> bool:
    """Whether the approved lesson itself recorded that no stick-in piece is earned."""
    if not isinstance(design, dict):
        return False
    block = design.get("resourceOpportunities")
    entry = block.get("stickIn") if isinstance(block, dict) else None
    return isinstance(entry, dict) and entry.get("decision") == "none"


def design_requires_card_kit(design) -> list[str]:
    """Units whose sort the approved design says children do with printed cards.

    A kit the main activity depends on is not a bonus sheet: without it the
    lesson as designed cannot be taught, so its absence can never be quiet.
    """
    if not isinstance(design, dict):
        return []
    units = [design.get("starter"), *(design.get("teachingSequence") or [])]
    ending = design.get("ending") or {}
    if isinstance(ending, dict) and ending.get("included") and isinstance(ending.get("beat"), dict):
        units.append(ending["beat"])
    required = []
    for unit in units:
        if not isinstance(unit, dict):
            continue
        task = unit.get("taskStructure")
        if not isinstance(task, dict) or task.get("kind") != "sort":
            continue
        handling = task.get("handling")
        if isinstance(handling, dict) and handling.get("kind") == "cards":
            required.append(str(unit.get("sourceUnitId")))
    return required


def earned_resources(working_dir: Path) -> list[str]:
    """Resources this run earned, derived from the specifications themselves."""
    earned: list[str] = []
    for name, filename, key in EARNED_RESOURCES:
        spec = read_json(working_dir / filename, f"{filename}", [])
        if isinstance(spec, dict):
            value = spec.get(key)
            if isinstance(value, list) and value:
                earned.append(name)
    return earned


def section_bullets(text: str) -> list[str]:
    """Bullet lines, ignoring the conventional '- None.' placeholder."""
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if not BULLET_RE.match(line) or NONE_LINE_RE.match(line):
            continue
        lines.append(line)
    return lines


def resource_names(bullets: list[str]) -> set[str]:
    """The lowercased resource name each bullet names, formatted ``- name: ...``."""
    names = set()
    for bullet in bullets:
        match = re.match(r"^-\s*(?P<name>[^:]+?)\s*:", bullet)
        if match:
            names.add(match.group("name").strip().lower())
    return names


def promised_filenames(working_dir: Path) -> list[str]:
    """Every picture the approved contract promised this lesson.

    The contract is the only record of a picture the run owed the teacher that
    survives a picture stage which never started. Receipts do not: a stage that
    fails its compile or manifest gate writes none at all, so a report derived
    from receipts alone reads a deck with no photographs as nothing wrong.
    """
    contract = read_json(working_dir / "photo-requirements.json", "photo requirements", [])
    if not isinstance(contract, dict):
        return []
    photos = contract.get("photos")
    if not isinstance(photos, list):
        return []
    names = []
    for photo in photos:
        if isinstance(photo, dict):
            filename = photo.get("filename")
            if isinstance(filename, str) and filename and filename not in names:
                names.append(filename)
    return names


def reviewed_retired_pictures(working_dir: Path) -> set[str]:
    """Retired photo history stays reportable without blocking a reviewed repair.

    Require a current successful review of the actual design and contract, no
    live owner reference, and no filename in any resource spec. A stale review
    or a downstream use still owes the picture; merely deleting a use is not
    proof that the replacement teaching was approved.
    """
    try:
        post = json.loads((working_dir / "design-review-postflight.json").read_text(encoding="utf-8"))
        if post.get("result") != "OK" or post.get("reviewResult") != "APPROVED":
            return set()
        for key, name in (("lessonDesign", "lesson-design.json"), ("photoRequirements", "photo-requirements.json")):
            if hashlib.sha256((working_dir / name).read_bytes()).hexdigest() != post["currentInputs"][key]["sha256"]:
                return set()
        design = json.loads((working_dir / "lesson-design.json").read_text(encoding="utf-8"))
        photos = json.loads((working_dir / "photo-requirements.json").read_text(encoding="utf-8"))["photos"]
        # Exact JSON string tokens also catch references in nested structures.
        owner_text = json.dumps(design)
        specs = []
        for name in ("lesson.json", "worksheet.json", "working-wall.json", "stick-in-sheets.json"):
            path = working_dir / name
            if path.is_file():
                specs.append(json.dumps(json.loads(path.read_text(encoding="utf-8"))))
        if not (working_dir / "lesson.json").is_file():
            return set()
        return {
            photo["filename"] for photo in photos
            if json.dumps(photo["id"]) not in owner_text
            and all(json.dumps(photo["filename"]) not in spec for spec in specs)
        }
    except (OSError, ValueError, KeyError, TypeError):
        return set()


def helper_obligations(working_dir: Path) -> list[str]:
    """Every visual the lesson needed that no live helper drew.

    A run that decides a lesson needs a helper it does not have, and then ships
    a picture or a stand-in in its place, has made a real decision the teacher
    has to hear: the same lesson type will degrade the same way next week until
    the helper exists. That decision used to live only in the run's own head, so
    it reached nobody. It is now recorded per use in ``helper-check.json``, and a
    helper the run built but could not install waits in ``pending-helper/``, so
    both are evidence the report has to carry.
    """
    owed: list[str] = []

    verdict = working_dir / "helper-check.json"
    if verdict.is_file():
        try:
            data = json.loads(verdict.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            data = None
        decisions = data.get("decisions") if isinstance(data, dict) else None
        if isinstance(decisions, list):
            for decision in decisions:
                if not isinstance(decision, dict):
                    continue
                if decision.get("decision") != "substitute":
                    continue
                owed.append(
                    f"{decision.get('representationId')}/"
                    f"{decision.get('configuration')} "
                    f"({decision.get('requiredSurface')})"
                )

    pending = working_dir / "pending-helper"
    if pending.is_dir():
        for child in sorted(pending.iterdir()):
            if child.is_dir():
                owed.append(f"pending helper {child.name}")

    return owed


def early_wave_evidence(working_dir: Path) -> tuple[Path | None, set[str]]:
    """The early adaptation wave's snapshot and the filenames it could source.

    The wave sources every picture the adaptation asked for while the sheet is
    still being designed, against an immutable copy of the provisional contract
    that build-provisional names in its receipt. A receipt bound to that copy
    for a picture the final contract never took is an early picture the sheet
    dropped: real work, honestly recorded, and not a picture the lesson owed.
    """
    receipt = read_json(
        working_dir / "orchestration-receipts" / "adaptation-photo-provisional.json",
        "adaptation provisional receipt",
        [],
    )
    if not isinstance(receipt, dict):
        return None, set()
    text = receipt.get("requirementsSnapshot")
    if not isinstance(text, str) or not text:
        return None, set()
    snapshot = Path(text)
    contract = read_json(snapshot, "early-wave snapshot", [])
    if not isinstance(contract, dict) or not isinstance(contract.get("photos"), list):
        return None, set()
    names = {
        photo.get("filename")
        for photo in contract["photos"]
        if isinstance(photo, dict) and isinstance(photo.get("filename"), str)
    }
    return snapshot.resolve(), names


def report_obligations(working_dir: Path, failures: list[str]) -> dict[str, list[str]]:
    obligations = {
        "picture": [],
        "friction": [],
        "earlyWaveRan": False,
    }

    receipts_dir = working_dir / "orchestration-receipts"
    picture_dir = receipts_dir / "picture-terminal"
    published: set[str] = set()
    early_snapshot, early_names = early_wave_evidence(working_dir)
    promised = promised_filenames(working_dir)
    if picture_dir.is_dir():
        for path in sorted(picture_dir.glob("*.json")):
            payload = read_json(path, str(path), failures)
            if not isinstance(payload, dict):
                continue
            filename = payload.get("filename")
            if not isinstance(filename, str) or not filename:
                continue
            reference = payload.get("requirements")
            bound_early = (
                early_snapshot is not None
                and isinstance(reference, dict)
                and isinstance(reference.get("path"), str)
                and Path(reference["path"]).resolve() == early_snapshot
            )
            if bound_early:
                obligations["earlyWaveRan"] = True
            if payload.get("terminalState") == PICTURE_PUBLISHED_STATE:
                published.add(filename)
            elif payload.get("terminalState") in PICTURE_FAILURE_STATES:
                # An early picture the sheet never took is not a picture the
                # lesson owed, whatever became of it; the PICTURE_EARLY_WAVE
                # line is where that cost is reported.
                if bound_early and filename in early_names and filename not in promised:
                    continue
                obligations["picture"].append(filename)

    # A promised picture with no published receipt never reached the lesson,
    # however far the picture stage got.
    for filename in promised:
        if filename not in published and filename not in obligations["picture"]:
            obligations["picture"].append(filename)

    friction_path = working_dir / "friction.md"
    if friction_path.is_file():
        try:
            lines = [
                line.strip()
                for line in friction_path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
        except OSError as exc:
            failures.append(f"friction.md: not readable: {exc}")
        else:
            obligations["friction"] = lines
            failures.extend(friction_record_failures(lines))

    return obligations


def friction_record_failures(lines: list[str]) -> list[str]:
    """Check the shape of the run's friction record.

    The file collects three kinds of thing a later investigation needs together:
    an obstacle a worker worked around, a block that stopped a role, and a repair
    round that answered one. Each carries the agent it came from, a repair
    carries whether it actually fixed anything, and a repair sits under the block
    it answered - grouping is the point of collecting them in one file at all.
    """
    failures: list[str] = []
    seen_block = False

    for line in lines:
        match = FRICTION_RECORD_RE.match(line)
        if not match:
            failures.append(
                f"friction.md: {line!r} is not a tagged record. Every line reads "
                "`AGENT: [role] | FRICTION|BLOCK|REPAIR: ...`, so every obstacle, "
                "block and repair can be traced to the agent that met it."
            )
            continue

        kind = match.group("kind")
        if kind == "BLOCK":
            seen_block = True
            continue
        if kind != "REPAIR":
            continue

        if not REPAIR_VERDICT_RE.search(match.group("body")):
            failures.append(
                f"friction.md: {line!r} is a repair record with no FIXED or NOT "
                "FIXED verdict. A repair round that ran and a fault that went "
                "away are different facts."
            )
        if not seen_block:
            failures.append(
                f"friction.md: {line!r} names no block above it. A repair record "
                "sits under the BLOCK record it answered, so a block and "
                "everything it caused read together."
            )

    return failures


def require_obligations(
    section_name: str,
    section_text: str,
    required_tokens: list[str],
    failures: list[str],
) -> None:
    for token in required_tokens:
        if token not in section_text:
            failures.append(
                f"{section_name}: required run evidence is missing: {token}"
            )


BACKTICK_SPAN_RE = re.compile(r"`([^`]+)`")


def path_tokens(text: str) -> list[str]:
    """The file paths a line names.

    Paths carry spaces - `Beatrix Potter - Worksheets.pdf` is a real name - so a
    path is backtick-quoted in the report; falling back to whitespace tokens
    covers only paths without whitespace."""
    spans = [
        span.strip() for span in BACKTICK_SPAN_RE.findall(text)
        if "/" in span or "\\" in span
    ]
    if spans:
        return spans
    tokens = []
    for raw in text.split():
        token = raw.strip("`,;:()[]{}\"'“”")
        if not token:
            continue
        if "/" in token or "\\" in token:
            tokens.append(token)
    return tokens


def path_exists(token: str, working_dir: Path, output_dir: Path) -> bool:
    path = Path(token).expanduser()
    if path.exists():
        return True
    for base in (working_dir, output_dir):
        try:
            if (base / token).exists():
                return True
        except OSError:
            continue
    return False


def validate(working_dir: str, output_dir: str, report: str) -> list[str]:
    failures: list[str] = []
    working = Path(working_dir)
    output = Path(output_dir)

    report_path = Path(report)
    if not report_path.is_file():
        return [f"--report path does not exist: {report}"]
    try:
        text = report_path.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"--report is not readable: {exc}"]

    lines = text.splitlines()

    # ── Headings: all present, exactly once, in the required order ───────
    positions: dict[str, int] = {}
    for index, line in enumerate(lines):
        stripped = line.strip()
        if stripped in HEADINGS:
            if stripped in positions:
                failures.append(f"headings: {stripped!r} appears more than once.")
            positions.setdefault(stripped, index)
    previous = -1
    for heading in HEADINGS:
        if heading not in positions:
            failures.append(f"headings: missing required heading {heading!r}.")
            continue
        if positions[heading] < previous:
            failures.append(f"headings: {heading!r} is out of the required order.")
        previous = max(previous, positions[heading])

    sections: dict[str, str] = {}
    ordered = [h for h in HEADINGS if h in positions]
    for index, heading in enumerate(ordered):
        start = positions[heading] + 1
        end = positions[ordered[index + 1]] if index + 1 < len(ordered) else len(lines)
        sections[heading] = "\n".join(lines[start:end])

    # ── Worker launches: the audit was run and its result carried over ───
    launches = sections.get("## Worker launches", "")
    if not any(marker in launches for marker in WORKER_LAUNCH_MARKERS):
        failures.append(
            "worker launches: the section must carry one line from "
            "`worker-launch.py audit`, one of "
            + ", ".join(WORKER_LAUNCH_MARKERS)
            + "."
        )

    # ── Outcome: exactly one allowed package status ──────────────────────
    status_lines = [
        line.strip() for line in sections.get("## Outcome", "").splitlines()
        if line.strip().startswith("Package status:")
    ]
    package_status = None
    if not status_lines:
        failures.append(
            "outcome: exactly one `Package status: <status>` line is required; found none."
        )
    else:
        if len(status_lines) > 1:
            failures.append(
                f"outcome: multiple `Package status:` lines ({len(status_lines)}); expected one."
            )
        match = STATUS_LINE_RE.match(status_lines[0])
        if not match:
            failures.append(
                f"outcome: {status_lines[0]!r} is not one of "
                + ", ".join(PACKAGE_STATUSES)
                + "."
            )
        else:
            package_status = match.group(1)

    # ── Earned resources are all accounted for ───────────────────────────
    earned = earned_resources(working)
    delivered_bullets = section_bullets(sections.get("## Delivered resources", ""))
    excluded_bullets = section_bullets(sections.get("## Excluded resources", ""))
    delivered_names = resource_names(delivered_bullets)
    excluded_names = resource_names(excluded_bullets)

    for bullet in excluded_bullets:
        if not NOT_DELIVERED_RE.match(bullet):
            failures.append(
                f"excluded resources: {bullet!r} must read "
                "`- <resource>: NOT DELIVERED - <reason>`."
            )


    double_counted = delivered_names & excluded_names
    if double_counted:
        failures.append(
            "resources: listed as both delivered and excluded: "
            + ", ".join(sorted(double_counted))
            + "."
        )

    for name in earned:
        if name not in delivered_names and name not in excluded_names:
            failures.append(
                f"earned resource {name!r} is not accounted for: it appears under "
                "neither Delivered resources nor Excluded resources."
            )

    # ── Every always-run designer decision is on the record ──────────────
    design = read_json(working / "lesson-design.json", "lesson-design.json", [])
    for name, filename, key in DECIDED_RESOURCES:
        spec = read_json(working / filename, filename, [])
        decided = isinstance(spec, dict) and isinstance(spec.get(key), list)
        if not decided and name not in excluded_names and name not in delivered_names:
            if name == "stick-in sheets" and design_skipped_stick_in(design):
                failures.append(
                    "stick-in sheets: the approved design recorded none, so no "
                    "designer ran; list it under Excluded resources as "
                    "`- stick-in sheets: NOT DELIVERED - not needed: <the design's reason>` "
                    "so the teacher can see the decision."
                )
                continue
            failures.append(
                f"{name}: no decision is on record. Its designer runs on every "
                f"lesson and answers with {filename} (an empty {key} list is a "
                "valid answer); a run without that file must exclude the "
                "resource with a reason, not skip the decision silently."
            )

    # ── A kit the main activity depends on is delivered, or the report says so ──
    kit_units = design_requires_card_kit(design)
    kit_missing = bool(kit_units) and "stick-in sheets" not in delivered_names
    if kit_missing and "stick-in sheets" not in excluded_names:
        stick_in_spec = read_json(working / "stick-in-sheets.json", "stick-in-sheets.json", [])
        card_sets = [
            item for item in ((stick_in_spec or {}).get("items") or [])
            if isinstance(item, dict) and item.get("visual") == "card-set"
        ] if isinstance(stick_in_spec, dict) else []
        failures.append(
            "stick-in sheets: the approved design handles a sort with printed cards ("
            + ", ".join(kit_units)
            + ") and the pack is under neither Delivered nor Excluded resources"
            + ("; the stick-in spec holds no card-set for it" if not card_sets else "")
            + ". The kit is part of the main activity, not a bonus sheet: list it under "
            "Excluded resources with the reason and name the missing kit under Blocking "
            "faults."
        )

    # ── Every delivered path exists ──────────────────────────────────────
    for bullet in delivered_bullets:
        tokens = path_tokens(bullet)
        if not tokens:
            failures.append(f"delivered resources: {bullet!r} names no path.")
            continue
        # A path left unquoted is split at its spaces, so the token reported is
        # a fragment ("...PSHE agreement" arrives as ".../To") and the real file
        # is sitting there. Say so in the failure rather than leaving the author
        # to work out that the missing file is a quoting fault.
        unquoted = not BACKTICK_SPAN_RE.search(bullet)
        for token in tokens:
            if not path_exists(token, working, output):
                hint = (
                    "; wrap the path in backticks - lesson filenames carry "
                    "spaces, and an unquoted one is read as several broken "
                    "paths"
                    if unquoted
                    else ""
                )
                failures.append(
                    f"delivered resources: path does not exist: {token}{hint}"
                )

    # Every retained picture failure and friction record must be reported.
    obligations = report_obligations(working, failures)
    require_obligations(
        "picture results",
        sections.get("## Picture results", ""),
        obligations["picture"],
        failures,
    )

    # ── Whether there was a drawing library to search ────────────────────
    #
    # A deck with no Educational SVG in it is a good deck when the library was
    # searched and had nothing for these slides, and a broken one when there was
    # no library on the machine to ask. Both used to close as a clean run and
    # read identically ever after, so the question "why did it not use the
    # drawings?" could not be answered from anything the run left behind, and
    # the answer kept being sought in the guidance, where the fault was not.
    # `check-optional-pictures.py` now says which happened on every run; this is
    # what stops that line dying in a terminal.
    #
    # The one honest alternative is a deck built without its optional layer
    # because the Slide Decorator failed or never returned: the layer carries
    # no teaching, so the deck ships, and the record says so under accepted
    # minor issues with `SLIDE_DECORATION_OMITTED:` rather than pretending a
    # check ran that had no record to read.
    lesson_spec = read_json(working / "lesson.json", "lesson.json", [])
    deck_ran = isinstance(lesson_spec, dict) and bool(lesson_spec.get("slides"))
    decoration_omitted = "SLIDE_DECORATION_OMITTED:" in sections.get(
        "## Accepted minor issues", ""
    )
    if (
        deck_ran
        and not decoration_omitted
        and "OPTIONAL_PICTURE_LIBRARY:" not in sections.get("## Picture results", "")
    ):
        failures.append(
            "picture results: this run built a deck, so the section must carry "
            "the `OPTIONAL_PICTURE_LIBRARY:` line from `check-optional-"
            "pictures.py`, verbatim, unless `## Accepted minor issues` carries "
            "`SLIDE_DECORATION_OMITTED:` because the Slide Decorator did not "
            "finish. A deck with no drawings means one thing when the library "
            "was there and another when it was not, and nothing else on the "
            "record tells them apart."
        )
    # ── What the early adaptation picture wave cost ───────────────────────
    #
    # The wave sources adaptation pictures beside the Worksheet Designer, so a
    # picture the sheet then drops was fetched for nothing. That is the price
    # of the minutes it saves, and the teacher who pays for pictures is the one
    # who decides whether it is worth it, so a run that took the early route
    # says so on the record with the one line provenance prints for it.
    if obligations["earlyWaveRan"] and "PICTURE_EARLY_WAVE:" not in sections.get("## Picture results", ""):
        failures.append(
            "picture results: this run sourced adaptation pictures early, so the "
            "section must carry the `PICTURE_EARLY_WAVE:` line that "
            "`finalize-picture-assignment.py provenance` printed, verbatim: how "
            "many were sourced early, how many the sheet used and how many it "
            "did not is what the early route cost, and it belongs on the record."
        )

    require_obligations(
        "friction",
        sections.get("## Friction", ""),
        obligations["friction"],
        failures,
    )

    # ── Shared investigation log: QUEUED/UPDATED lines carry their path ──
    shared_log = sections.get("## Shared investigation log", "")
    shared_status_lines = [
        line.strip() for line in shared_log.splitlines()
        if line.strip().startswith("Status:")
    ]
    shared_status = None
    for line in shared_log.splitlines():
        match = SHARED_LOG_STATUS_RE.match(line.strip())
        if match:
            shared_status = match.group(1)
    if shared_status is None:
        if re.search(r"\bNOT REQUIRED\b", shared_log):
            shared_status = "NOT REQUIRED"
        else:
            failures.append(
                "shared investigation log: a status of UPDATED, QUEUED or NOT REQUIRED "
                "is required."
            )
    if shared_status in ("UPDATED", "QUEUED"):
        if not shared_status_lines:
            failures.append(
                f"shared investigation log: `{shared_status}` requires a `Status: {shared_status}` line."
            )
        path_lines = [
            line.strip() for line in shared_log.splitlines()
            if line.strip().startswith("Path:")
        ]
        if not path_lines:
            failures.append(
                f"shared investigation log: `{shared_status}` requires a `Path:` line naming "
                "the log that was (or would have been) written."
            )
        elif shared_status == "QUEUED":
            queued_token = path_lines[0][len("Path:"):].strip().strip("`").strip()
            if Path(queued_token).name != "pending-build-review-log.md":
                failures.append(
                    "shared investigation log: a QUEUED entry's only path is "
                    "[WORKING_DIR]/pending-build-review-log.md."
                )
            elif not path_exists(queued_token, working, output):
                failures.append(
                    f"shared investigation log: queued path does not exist: {queued_token}"
                )

    # ── Helper gaps are reported, never silently absorbed ────────────────
    owed_helpers = helper_obligations(working)
    if owed_helpers:
        gap_section = sections.get("## Helper gaps", "")
        gap_bullets = section_bullets(gap_section)
        if not gap_bullets:
            failures.append(
                "helper gaps: this run substituted for, or left pending, "
                + str(len(owed_helpers))
                + " visual(s) no live helper draws ("
                + ", ".join(owed_helpers)
                + "), and the Helper gaps section reports none."
            )
        else:
            for item in owed_helpers:
                token = item.split(" (")[0]
                if token not in gap_section:
                    failures.append(
                        f"helper gaps: {token} was substituted or left pending "
                        "and is not named in the Helper gaps section."
                    )

    # ── COMPLETE is earned, not declared ─────────────────────────────────
    if package_status == "COMPLETE":
        blocked = section_bullets(sections.get("## Blocking faults", ""))
        if blocked:
            failures.append(
                f"COMPLETE: {len(blocked)} blocking fault(s) remain in the report."
            )
        excluded_earned = [name for name in earned if name in excluded_names]
        if excluded_earned:
            failures.append(
                "COMPLETE: earned resource(s) excluded: "
                + ", ".join(excluded_earned)
                + "; a package that omits what it earned is PARTIAL, not COMPLETE."
            )
        if kit_missing:
            failures.append(
                "COMPLETE: the approved design handles a sort with printed cards ("
                + ", ".join(kit_units)
                + ") and the stick-in pack that carries the kit was not delivered; "
                "a lesson whose main activity's materials are missing is PARTIAL, not COMPLETE."
            )
        if "PAGE_FIT_UNVERIFIED" in text:
            failures.append(
                "COMPLETE: the report carries PAGE_FIT_UNVERIFIED; an unverified review "
                "cannot close as COMPLETE."
            )
        missing_live_pictures = set(obligations["picture"]) - reviewed_retired_pictures(working)
        if missing_live_pictures:
            failures.append(
                "COMPLETE: picture(s) the contract promised were never published: "
                + ", ".join(sorted(missing_live_pictures))
                + "; a package that ships without a picture it promised is PARTIAL, "
                "not COMPLETE."
            )
    return failures


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate the one complete run report."
    )
    parser.add_argument("--working-dir", required=True, help="Lesson working folder")
    parser.add_argument("--output-dir", required=True, help="Output folder the report lists")
    parser.add_argument("--report", required=True, help="Path to run-report.md")
    args = parser.parse_args(argv)

    failures = validate(args.working_dir, args.output_dir, args.report)
    if failures:
        print(f"RUN_REPORT_FAILED: {len(failures)} failure(s):")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("RUN_REPORT_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
