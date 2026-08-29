#!/usr/bin/env python3
"""Read-only validator for the one complete run report.

At delivery the orchestrator writes ``[WORKING_DIR]/run-report.md`` - the single
record of what the run produced, what it could not, and why. This validator
proves that record: the headings are all present in order, the package status
is one of the four allowed values and never claims ``COMPLETE`` the evidence
cannot support, every earned resource is accounted for, every delivered path
exists, every picture the contract promised and the run did not publish is
named, and retained friction evidence is reported.

    python3 validate-run-report.py \
        --working-dir PATH --output-dir PATH --report PATH

Exit 0 and print ``RUN_REPORT_OK`` when the report holds. Otherwise exit 1 and
print every failure found, so one run reports everything that is wrong rather
than one problem at a time.

Standard library only. Writes nothing.
"""
from __future__ import annotations

import argparse
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
    "## Picture results",
    "## Helper gaps",
    "## Friction",
    "## Shared investigation log",
]

PACKAGE_STATUSES = ("COMPLETE", "PARTIAL", "BLOCKED", "UNVERIFIED")
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

STATUS_LINE_RE = re.compile(
    rf"^Package status: ({'|'.join(PACKAGE_STATUSES)})$"
)
SHARED_LOG_STATUS_RE = re.compile(r"^Status: (UPDATED|QUEUED|NOT REQUIRED)$")
NOT_DELIVERED_RE = re.compile(r"^-\s*(?P<name>.+?):\s*NOT DELIVERED\s*-\s*(?P<reason>\S.*)$")

NONE_LINE_RE = re.compile(r"^-\s*none\.?\s*$", re.IGNORECASE)
BULLET_RE = re.compile(r"^-\s*\S")


def read_json(path: Path, label: str, failures: list[str]):
    if not path.is_file():
        failures.append(f"{label}: file does not exist: {path}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        failures.append(f"{label}: not readable JSON: {exc}")
        return None


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


def report_obligations(working_dir: Path, failures: list[str]) -> dict[str, list[str]]:
    obligations = {
        "picture": [],
        "friction": [],
    }

    receipts_dir = working_dir / "orchestration-receipts"
    picture_dir = receipts_dir / "picture-terminal"
    published: set[str] = set()
    if picture_dir.is_dir():
        for path in sorted(picture_dir.glob("*.json")):
            payload = read_json(path, str(path), failures)
            if not isinstance(payload, dict):
                continue
            filename = payload.get("filename")
            if not isinstance(filename, str) or not filename:
                continue
            if payload.get("terminalState") == PICTURE_PUBLISHED_STATE:
                published.add(filename)
            elif payload.get("terminalState") in PICTURE_FAILURE_STATES:
                obligations["picture"].append(filename)

    # A promised picture with no published receipt never reached the lesson,
    # however far the picture stage got.
    for filename in promised_filenames(working_dir):
        if filename not in published and filename not in obligations["picture"]:
            obligations["picture"].append(filename)

    friction_path = working_dir / "friction.md"
    if friction_path.is_file():
        try:
            obligations["friction"] = [
                line.strip()
                for line in friction_path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
        except OSError as exc:
            failures.append(f"friction.md: not readable: {exc}")

    return obligations


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

    # ── Every delivered path exists ──────────────────────────────────────
    for bullet in delivered_bullets:
        tokens = path_tokens(bullet)
        if not tokens:
            failures.append(f"delivered resources: {bullet!r} names no path.")
            continue
        for token in tokens:
            if not path_exists(token, working, output):
                failures.append(
                    f"delivered resources: path does not exist: {token}"
                )

    # Every retained picture failure and friction record must be reported.
    obligations = report_obligations(working, failures)
    require_obligations(
        "picture results",
        sections.get("## Picture results", ""),
        obligations["picture"],
        failures,
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
        if "PAGE_FIT_UNVERIFIED" in text:
            failures.append(
                "COMPLETE: the report carries PAGE_FIT_UNVERIFIED; an unverified review "
                "cannot close as COMPLETE."
            )
        if obligations["picture"]:
            failures.append(
                "COMPLETE: picture(s) the contract promised were never published: "
                + ", ".join(obligations["picture"])
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
