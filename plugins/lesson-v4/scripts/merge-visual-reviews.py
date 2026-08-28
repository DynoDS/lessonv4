#!/usr/bin/env python3
"""Deterministically merge explicit visual-review findings and outcomes.

This script makes no pedagogical, visual or ownership judgement. It preserves
stable finding IDs, applies only later explicit outcomes for those IDs, and
writes the package verdict from the recorded states.

It also refuses to write a verdict while a finding is still blocking and no
repair is on record for it, so a run cannot deliver a fault that nobody was
ever asked to fix. Proof of a repair round is the confirmation pass that
re-reviewed the finding; where no repairer could be put in front of it,
``--unrepaired ID=reason-code: detail`` says so on the record, and the reason
is printed beside the finding in the merged review.
"""
import argparse
import re
import sys
from collections import OrderedDict
from dataclasses import dataclass
from pathlib import Path

ALLOWED_OUTCOMES = {"OPEN", "FIXED", "ACCEPTED MINOR", "DESIGNER REPAIR REQUIRED"}
BLOCKING_OUTCOMES = {"OPEN", "DESIGNER REPAIR REQUIRED"}
# The only honest reasons a still-blocking finding can reach delivery without a
# repair on record. Both say a repairer could not be put in front of it; neither
# says nobody looked. "It was attempted and failed" is not in this list because
# an attempt leaves its own evidence: the confirmation pass that re-reviewed it.
UNREPAIRED_REASONS = ("no-owner-authority", "owner-unavailable")
FINDING_SECTIONS = {
    "Repairs completed during review",
    "Blocking faults still needing repair",
    "Designer repair required",
    "Minor issues remaining",
}
EMPTY_FINDING_SECTION_BODIES = {
    "- None.",
    "None.",
    '- (or "None.")',
}
REQUIRED_FINDING_FIELDS = {
    "Classification", "Location", "Finding", "Required change", "Already passed",
    "Existing BUILD_DIAGNOSTIC", "Changed", "Unchanged",
    "Potential cross-resource impact", "Outcome", "Verification evidence",
}
REQUIRED_OUTCOME_FIELDS = {
    "Outcome", "Changed", "Unchanged", "Potential cross-resource impact",
    "Verification evidence", "Observed result",
}
ID_RE = re.compile(r"^(?:DECK|WORKSHEETS|STICK-IN|WORKING-WALL|CONSISTENCY)-\d{3}$")
FIELD_LINE_RE = re.compile(r"^- ([^:]+):\s*(.*)$")
STRUCTURED_SECTIONS = FINDING_SECTIONS | {"Repair outcomes"}
FINDING_BLOCK_FIELDS = set(REQUIRED_FINDING_FIELDS)
OUTCOME_BLOCK_FIELDS = (
    set(REQUIRED_OUTCOME_FIELDS) | set(REQUIRED_FINDING_FIELDS) | {"New finding"}
)


class MergeError(Exception):
    pass


@dataclass
class Finding:
    finding_id: str
    fields: OrderedDict
    raw: str
    source_label: str
    first_source: str

    @property
    def outcome(self):
        return self.fields["Outcome"]


def parse_assignment(value, option):
    if "=" not in value:
        raise MergeError(f"{option} must use Label=path: {value}")
    label, path = value.split("=", 1)
    if not label.strip() or not path.strip():
        raise MergeError(f"{option} must use non-empty Label=path: {value}")
    return label.strip(), Path(path).resolve()


def parse_unrepaired(value):
    """Read one ``ID=reason-code: detail`` declaration."""
    if "=" not in value:
        raise MergeError(
            f"--unrepaired must use ID=reason-code: detail: {value}"
        )
    finding_id, remainder = value.split("=", 1)
    finding_id = finding_id.strip()
    if not ID_RE.match(finding_id):
        raise MergeError(f"--unrepaired names a malformed finding ID: {finding_id}")
    if ":" not in remainder:
        raise MergeError(
            f"--unrepaired {finding_id} must give a reason code then a colon and "
            f"the detail: {value}"
        )
    reason, detail = remainder.split(":", 1)
    reason = reason.strip()
    detail = detail.strip()
    if reason not in UNREPAIRED_REASONS:
        raise MergeError(
            f"--unrepaired {finding_id} reason must be one of "
            + ", ".join(UNREPAIRED_REASONS)
            + f"; got {reason!r}"
        )
    if not detail:
        raise MergeError(
            f"--unrepaired {finding_id} must say which owner was missing or which "
            "change was outside every available owner's authority"
        )
    return finding_id, reason, detail


def section_blocks(text):
    """Yield (level2 section name, level3 heading, block text)."""
    current_section = None
    current_heading = None
    current_lines = []
    for line in text.splitlines():
        if line.startswith("## ") and not line.startswith("### "):
            if current_heading is not None:
                yield current_section, current_heading, "\n".join(current_lines).rstrip()
                current_heading, current_lines = None, []
            current_section = line[3:].strip()
            continue
        if line.startswith("### "):
            if current_heading is not None:
                yield current_section, current_heading, "\n".join(current_lines).rstrip()
            current_heading = line[4:].strip()
            current_lines = []
            continue
        if current_heading is not None:
            current_lines.append(line)
    if current_heading is not None:
        yield current_section, current_heading, "\n".join(current_lines).rstrip()


def parse_fields(block):
    fields = OrderedDict()
    current = None
    for line in block.splitlines():
        match = re.match(r"^- ([^:]+):\s*(.*)$", line)
        if match:
            current = match.group(1).strip()
            fields[current] = match.group(2).strip()
        elif current and line.startswith("  "):
            fields[current] += "\n" + line.strip()
    return fields


def normalise_heading_id(heading):
    token = heading.strip().split()[0].strip("[]") if heading.strip() else ""
    return token


def read_text(path, label):
    if not path.is_file():
        raise MergeError(f"Supplied {label} file does not exist: {path}")
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        raise MergeError(f"Cannot read {label} file {path}: {exc}") from exc


def has_unverified_state(text):
    return bool(re.search(
        r"(?im)^(?:[-*]\s*)?(?:visual\s+review\s+state|consistency\s+review\s+state|review\s+state|state)\s*:\s*`?UNVERIFIED`?\s*$",
        text,
    )) or bool(re.search(r"(?im)^##\s+(?:Review state|State)\s*\n\s*`?UNVERIFIED`?\s*$", text))


def parse_finding_blocks(text, label, path):
    findings = []
    for section, heading, block in section_blocks(text):
        if section not in FINDING_SECTIONS:
            continue
        finding_id = normalise_heading_id(heading)
        if not ID_RE.match(finding_id):
            raise MergeError(f"Malformed finding heading in {path}: ### {heading}")
        fields = parse_fields(block)
        missing = REQUIRED_FINDING_FIELDS - set(fields)
        if missing:
            raise MergeError(
                f"Malformed finding {finding_id} in {path}: missing {', '.join(sorted(missing))}"
            )
        if fields["Outcome"] not in ALLOWED_OUTCOMES:
            raise MergeError(f"Invalid outcome for {finding_id}: {fields['Outcome']}")
        raw = "### " + finding_id + "\n" + block.strip()
        findings.append(Finding(finding_id, fields, raw, label, str(path)))
    return findings


def parse_repair_outcomes(text, path):
    outcomes = []
    for section, heading, block in section_blocks(text):
        if section != "Repair outcomes":
            continue
        finding_id = normalise_heading_id(heading)
        if not ID_RE.match(finding_id):
            raise MergeError(f"Malformed repair-outcome heading in {path}: ### {heading}")
        fields = parse_fields(block)
        missing = REQUIRED_OUTCOME_FIELDS - set(fields)
        if missing:
            raise MergeError(
                f"Malformed repair outcome {finding_id} in {path}: missing {', '.join(sorted(missing))}"
            )
        if fields["Outcome"] not in ALLOWED_OUTCOMES:
            raise MergeError(f"Invalid outcome for {finding_id}: {fields['Outcome']}")
        explicit_new = fields.get("New finding", "").lower() in {"true", "yes"} or \
            "NEW FINDING" in heading.upper()
        outcomes.append((finding_id, fields, "### " + finding_id + "\n" + block.strip(), explicit_new))
    return outcomes


def extract_section(text, name):
    pattern = re.compile(
        rf"(?ms)^## {re.escape(name)}\s*$\n(.*?)(?=^## |\Z)"
    )
    matches = list(pattern.finditer(text))
    if not matches:
        return None
    return matches[-1].group(1).rstrip()


def iter_section_bodies(text):
    """Yield (level-2 section name, body text) for every section occurrence.

    Unlike ``section_blocks`` this keeps content that appears before the
    first level-3 heading, so structural validation can account for every
    line of a section rather than only its heading blocks.
    """
    current_section = None
    current_lines = []
    for line in text.splitlines():
        if line.startswith("## ") and not line.startswith("### "):
            if current_section is not None:
                yield current_section, "\n".join(current_lines).rstrip()
            current_section = line[3:].strip()
            current_lines = []
            continue
        if current_section is not None:
            current_lines.append(line)
    if current_section is not None:
        yield current_section, "\n".join(current_lines).rstrip()


def validate_structured_sections(text, path):
    """Fail closed on content a finding or outcome section does not account for.

    Every non-empty ordinary finding section and every ``## Repair outcomes``
    section must consist solely of stable-ID blocks: no prose or bullets
    before the first ``###`` heading, a valid stable finding ID on every
    heading, and only recognised, non-repeated ``- Field: value`` lines (or
    indented continuations of the preceding field) inside each block. Every
    mandatory field must appear exactly once per block. Anything else is
    malformed structured review data and must stop the merge instead of
    being silently ignored.
    """
    for section_name, body in iter_section_bodies(text):
        if section_name not in STRUCTURED_SECTIONS:
            continue
        stripped = body.strip()
        if not stripped or stripped in EMPTY_FINDING_SECTION_BODIES:
            continue
        if section_name == "Repair outcomes":
            allowed_fields = OUTCOME_BLOCK_FIELDS
            required_fields = set(REQUIRED_OUTCOME_FIELDS)
            kind = "repair outcome"
        else:
            allowed_fields = FINDING_BLOCK_FIELDS
            required_fields = set(REQUIRED_FINDING_FIELDS)
            kind = "finding"

        seen_heading = False
        finding_id = None
        seen_fields = set()
        current_field = None

        def require_complete_fields():
            missing = required_fields - seen_fields
            if missing:
                raise MergeError(
                    f"Malformed findings file {path}: {kind} "
                    f"{finding_id} is missing field(s) "
                    f"{', '.join(sorted(missing))}"
                )

        for line in body.splitlines():
            if line.startswith("### "):
                if seen_heading:
                    require_complete_fields()
                heading = line[4:].strip()
                finding_id = normalise_heading_id(heading)
                if not ID_RE.match(finding_id):
                    raise MergeError(
                        f"Malformed finding heading in {path}: ### {heading}"
                    )
                seen_heading = True
                seen_fields = set()
                current_field = None
                continue
            if not line.strip():
                continue
            if not seen_heading:
                raise MergeError(
                    f"Malformed findings file {path}: section "
                    f"{section_name!r} contains non-empty content but does "
                    "not begin with a stable-ID finding block"
                )
            if line.startswith("  "):
                if current_field is None:
                    raise MergeError(
                        f"Malformed findings file {path}: section "
                        f"{section_name!r} has an indented continuation line "
                        "before any field"
                    )
                continue
            match = FIELD_LINE_RE.match(line)
            if not match:
                raise MergeError(
                    f"Malformed findings file {path}: section "
                    f"{section_name!r} contains content that no stable-ID "
                    f"{kind} block accounts for: {line.strip()!r}"
                )
            field_name = match.group(1).strip()
            if field_name not in allowed_fields:
                raise MergeError(
                    f"Malformed findings file {path}: {kind} {finding_id} in "
                    f"section {section_name!r} has unknown field "
                    f"{field_name!r}"
                )
            if field_name in seen_fields:
                raise MergeError(
                    f"Malformed findings file {path}: {kind} {finding_id} in "
                    f"section {section_name!r} repeats field "
                    f"{field_name!r}"
                )
            seen_fields.add(field_name)
            current_field = field_name
        if seen_heading:
            require_complete_fields()


def validate_first_pass_report(text, path):
    if has_unverified_state(text):
        return
    required_sections = {
        "Checked",
        "Repairs completed during review",
        "Blocking faults still needing repair",
        "Designer repair required",
        "Minor issues remaining",
    }
    missing = [name for name in sorted(required_sections) if extract_section(text, name) is None]
    if missing:
        raise MergeError(
            f"Malformed findings file {path}: missing section(s) {', '.join(missing)}"
        )


def validate_confirmation_report(text, path):
    has_outcomes = extract_section(text, "Repair outcomes") is not None
    has_new_findings = any(section in FINDING_SECTIONS for section, _, _ in section_blocks(text))
    if not has_outcomes and not has_new_findings and not has_unverified_state(text):
        raise MergeError(
            f"Malformed confirmation file {path}: no Repair outcomes, new findings, or UNVERIFIED state"
        )

def finding_render(finding):
    lines = [f"### {finding.finding_id}"]
    for key, value in finding.fields.items():
        if "\n" in value:
            first, *rest = value.splitlines()
            lines.append(f"- {key}: {first}")
            lines.extend(f"  {line}" for line in rest)
        else:
            lines.append(f"- {key}: {value}")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", required=True)
    ap.add_argument("--date", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--finding", action="append", default=[])
    ap.add_argument("--confirmation", action="append", default=[])
    ap.add_argument("--consistency-required", action="store_true")
    ap.add_argument("--unrepaired", action="append", default=[])
    args = ap.parse_args()

    try:
        finding_inputs = [parse_assignment(v, "--finding") for v in args.finding]
        confirmation_inputs = [parse_assignment(v, "--confirmation") for v in args.confirmation]
        declared_unrepaired = OrderedDict()
        for value in args.unrepaired:
            finding_id, reason, detail = parse_unrepaired(value)
            if finding_id in declared_unrepaired:
                raise MergeError(f"--unrepaired declares {finding_id} twice")
            declared_unrepaired[finding_id] = (reason, detail)
        if not finding_inputs:
            raise MergeError("At least one --finding report is required")

        records = OrderedDict()
        first_reports_by_label = {}
        latest_reports_by_label = {}
        unverified = False
        consistency_supplied = False

        for label, path in finding_inputs:
            text = read_text(path, label)
            validate_first_pass_report(text, path)
            validate_structured_sections(text, path)
            first_reports_by_label[label] = text
            latest_reports_by_label[label] = text
            if label.lower() == "consistency":
                consistency_supplied = not has_unverified_state(text)
            if has_unverified_state(text):
                unverified = True
            for finding in parse_finding_blocks(text, label, path):
                if finding.finding_id in records:
                    prior = records[finding.finding_id]
                    raise MergeError(
                        f"Finding ID {finding.finding_id} is reused by two first-pass findings: "
                        f"{prior.first_source} and {path}"
                    )
                records[finding.finding_id] = finding

        confirmation_raw = []
        # Every ID a confirmation pass explicitly reported on. A repair round
        # that ran leaves this evidence whatever its result, so it is what
        # separates "repaired and still faulty" from "never sent for repair".
        reviewed_after_repair = set()
        for label, path in confirmation_inputs:
            text = read_text(path, label)
            validate_confirmation_report(text, path)
            validate_structured_sections(text, path)
            latest_reports_by_label[label] = text
            if label.lower() == "consistency" and not has_unverified_state(text):
                consistency_supplied = True
            if has_unverified_state(text):
                unverified = True

            # New findings introduced during confirmation use the ordinary full
            # finding block and therefore enter the stable-ID set explicitly.
            for finding in parse_finding_blocks(text, label, path):
                if finding.finding_id in records:
                    raise MergeError(
                        f"Confirmation reintroduced existing finding {finding.finding_id} "
                        "as a new first-pass block; use Repair outcomes for closure"
                    )
                records[finding.finding_id] = finding

            for finding_id, fields, raw, explicit_new in parse_repair_outcomes(text, path):
                reviewed_after_repair.add(finding_id)
                if finding_id not in records:
                    if not explicit_new:
                        raise MergeError(
                            f"Confirmation {path} refers to unknown finding {finding_id}"
                        )
                    # Explicitly marked new outcome blocks are accepted, but they
                    # still need the full finding fields to be useful downstream.
                    if not REQUIRED_FINDING_FIELDS.issubset(fields):
                        raise MergeError(
                            f"Explicit new finding {finding_id} in {path} lacks the full finding fields"
                        )
                    records[finding_id] = Finding(finding_id, fields, raw, label, str(path))
                else:
                    records[finding_id].fields["Outcome"] = fields["Outcome"]
                    records[finding_id].fields["Changed"] = fields["Changed"]
                    records[finding_id].fields["Unchanged"] = fields["Unchanged"]
                    records[finding_id].fields["Potential cross-resource impact"] = fields[
                        "Potential cross-resource impact"
                    ]
                    records[finding_id].fields["Verification evidence"] = fields[
                        "Verification evidence"
                    ]
                confirmation_raw.append(raw)

        # ── No blocking finding leaves the run without a repair on record ────
        # A skipped repair round and a failed one used to reach this point
        # identically: both simply left the finding OPEN, and the verdict came
        # out BLOCKED either way. An unattended run therefore had no way to
        # notice that a repairable fault was never sent to its owner. Each
        # still-blocking finding must now carry either the confirmation pass
        # that re-reviewed its repair, or an explicit declaration of why no
        # repairer could be put in front of it.
        still_blocking = [
            record for record in records.values()
            if record.outcome in BLOCKING_OUTCOMES
        ]
        blocking_ids = {record.finding_id for record in still_blocking}
        stale = [
            finding_id for finding_id in declared_unrepaired
            if finding_id not in blocking_ids
        ]
        if stale:
            known = ", ".join(
                f"{finding_id} ({records[finding_id].outcome})"
                if finding_id in records else f"{finding_id} (no such finding)"
                for finding_id in stale
            )
            raise MergeError(
                "--unrepaired declares findings that are not still blocking: " + known
            )
        undeclared = [
            record for record in still_blocking
            if record.finding_id not in reviewed_after_repair
            and record.finding_id not in declared_unrepaired
        ]
        if undeclared:
            raise MergeError(
                "no repair is on record for "
                + str(len(undeclared))
                + " still-blocking finding(s):\n"
                + "\n".join(
                    f"  - {record.finding_id} ({record.outcome}) in "
                    f"{record.source_label}: {record.fields['Location']}"
                    for record in undeclared
                )
                + "\nRun each one's repair round and supply the confirmation "
                "pass that re-reviewed it, or declare it with "
                "--unrepaired ID=<"
                + "|".join(UNREPAIRED_REASONS)
                + ">: <reason>."
            )
        for record in still_blocking:
            declaration = declared_unrepaired.get(record.finding_id)
            if declaration:
                reason, detail = declaration
                record.fields["Repair attempt"] = f"{reason} - {detail}"
            else:
                record.fields["Repair attempt"] = (
                    "attempted and re-reviewed; see Confirmation"
                )

        outcomes = [record.outcome for record in records.values()]
        if "OPEN" in outcomes or "DESIGNER REPAIR REQUIRED" in outcomes:
            verdict = "BLOCKED"
        elif unverified:
            verdict = "UNVERIFIED"
        elif args.consistency_required and not consistency_supplied:
            verdict = "UNVERIFIED"
        else:
            verdict = "PASS"

        checked_lines = []
        flags = []
        notes = []
        for label, _ in finding_inputs:
            latest = latest_reports_by_label.get(label, "")
            first = first_reports_by_label.get(label, "")
            checked = extract_section(latest, "Checked") or extract_section(first, "Checked")
            if checked:
                checked_lines.append(checked)
        # A confirmation may omit unchanged report-level sections. Preserve the
        # first-pass Checked/flags/notes unless a later report explicitly replaces them.
        for label in first_reports_by_label:
            latest = latest_reports_by_label.get(label, "")
            first = first_reports_by_label[label]
            section = extract_section(latest, "Flags for the teacher") or extract_section(
                first, "Flags for the teacher"
            )
            if section and section.strip() not in {"- (or \"None.\")", "- None.", "None."}:
                flags.append(section)
            section = extract_section(latest, "Notes") or extract_section(first, "Notes")
            if section and section.strip() not in {"- (or \"None.\")", "- None.", "None."}:
                notes.append(section)

        fixed = [r for r in records.values() if r.outcome == "FIXED"]
        open_findings = [r for r in records.values() if r.outcome == "OPEN"]
        designer = [r for r in records.values() if r.outcome == "DESIGNER REPAIR REQUIRED"]
        minor = [r for r in records.values() if r.outcome == "ACCEPTED MINOR"]

        def blocks(items):
            return "\n\n".join(finding_render(item) for item in items) if items else '- (or "None.")'

        output = f"""# Visual Review - {args.topic} - {args.date}

## Verdict
`{verdict}`

## Checked
{chr(10).join(checked_lines) if checked_lines else '- (or "None.")'}

## Repairs completed during review
{blocks(fixed)}

## Blocking faults still needing repair
{blocks(open_findings)}

## Designer repair required
{blocks(designer)}

## Minor issues remaining
{blocks(minor)}

## Flags for the teacher
{chr(10).join(flags) if flags else '- (or "None.")'}

## Notes
{chr(10).join(notes) if notes else '- (or "None.")'}

## Confirmation
{chr(10)+chr(10).join(confirmation_raw) if confirmation_raw else '- (or "None.")'}
"""
        output_path = Path(args.output).resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output, encoding="utf-8")
        print(verdict)
        return 0
    except MergeError as exc:
        print(f"MERGE_VISUAL_REVIEWS_ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
