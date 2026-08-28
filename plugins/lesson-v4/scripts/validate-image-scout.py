#!/usr/bin/env python3
"""Independent validation for compiled schema 2 image work."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SCHEMA_VERSION = 2
RESULT_FIELDS = {"filename", "status", "selection", "staging_path", "reason"}
STATUSES = {"sourced", "generated", "omitted", "unsatisfied"}
REASONS = {
    "optional_omission", "authorised_alternative", "no_faithful_real_match",
    "real_source_unavailable", "real_requirement_unfulfillable",
    "imagegen_capability_unavailable", "fundamental_generation_miss",
    "correction_failed", "attempt_budget_exhausted", "imagegen_output_unavailable",
}
REAL_SOURCES = {"unsplash", "wikimedia"}


class ValidationError(ValueError):
    pass


def read_json(path: Path, label: str):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValidationError(f"{label} does not exist: {path}") from exc
    except (OSError, json.JSONDecodeError) as exc:
        raise ValidationError(f"{label} is unreadable JSON: {path}: {exc}") from exc


def digest(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError as exc:
        raise ValidationError(f"cannot hash {path}: {exc}") from exc


def inside(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except (ValueError, OSError):
        return False


def load_compiler():
    spec = importlib.util.spec_from_file_location("picture_compiler_for_validation", SCRIPT_DIR / "compile-picture-assignments.py")
    if spec is None or spec.loader is None:
        raise ValidationError("cannot load picture compiler")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_attempts():
    spec = importlib.util.spec_from_file_location("picture_attempts_for_validation", SCRIPT_DIR / "image-scout-attempts.py")
    if spec is None or spec.loader is None:
        raise ValidationError("cannot load picture ledger")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def image_info(path: Path) -> tuple[int, int, str]:
    try:
        from PIL import Image
    except ImportError as exc:
        raise ValidationError(f"Pillow is required to validate picture results: {exc}") from exc
    try:
        with Image.open(path) as probe:
            decoded_format = str(probe.format or "").upper()
            probe.verify()
        with Image.open(path) as image:
            image.load()
            width, height = image.size
    except Exception as exc:
        raise ValidationError(f"unsupported or undecodable image {path}: {exc}") from exc
    if width <= 0 or height <= 0 or not decoded_format:
        raise ValidationError(f"image has invalid decoded metadata: {path}")
    return width, height, decoded_format


def validate_assignment_shape(assignment: dict, requirements_path: Path, working_dir: Path, expected_batch_id: str, expected: list[str]) -> tuple[dict, list[dict]]:
    if not isinstance(assignment, dict) or assignment.get("schema_version") != 2 or assignment.get("kind") != "image":
        raise ValidationError("assignment must be schema_version 2 and kind image")
    if assignment.get("batch_id") != expected_batch_id:
        raise ValidationError("assignment batch_id does not match expected batch")
    if set(assignment) - {"schema_version", "kind", "batch_id", "requirements", "work_root", "entries", "repair"}:
        raise ValidationError("assignment has unexpected fields")
    ref = assignment.get("requirements")
    if not isinstance(ref, dict) or set(ref) != {"path", "sha256"}:
        raise ValidationError("assignment requirements reference is malformed")
    if Path(ref["path"]).resolve() != requirements_path.resolve() or ref["sha256"] != digest(requirements_path):
        raise ValidationError("assignment requirements path or hash does not match frozen requirements")
    work_root = Path(assignment.get("work_root", "")).resolve()
    expected_root = (working_dir / "unsplash" / "_picture-work" / expected_batch_id).resolve()
    if work_root != expected_root:
        raise ValidationError("assignment work_root is not the exact durable batch work root")
    entries = assignment.get("entries")
    if not isinstance(entries, list) or not entries:
        raise ValidationError("assignment entries must be a non-empty list")
    names = [row.get("filename") if isinstance(row, dict) else None for row in entries]
    if names != expected:
        raise ValidationError(f"assignment filename order does not match expected set: {names!r}")
    compiler = load_compiler()
    requirements = compiler.validate_requirements(read_json(requirements_path, "requirements"))
    by_name = {photo["filename"]: photo for photo in requirements}
    for row in entries:
        if not isinstance(row, dict):
            raise ValidationError("assignment entry is not an object")
        required = {"entry_key", "filename", "subject", "pedagogical_constraint", "teaching_requirement", "load_bearing_evidence", "use", "essential", "acquisition_mode", "fallback_action", "coherent_group", "coherent_mode", "coherent_visual_invariants", "initial_route", "search_schedule", "generation_prompt_file", "generation_prompt_sha256", "ai_ledger_path"}
        if set(row) != required:
            raise ValidationError(f"{row.get('filename')}: assignment entry must contain only compiled fields")
        photo = by_name.get(row["filename"])
        if photo is None:
            raise ValidationError(f"assignment owns unknown filename {row['filename']}")
        for field in ("subject", "pedagogical_constraint", "teaching_requirement", "load_bearing_evidence", "use", "essential", "acquisition_mode", "fallback_action", "coherent_group", "coherent_mode", "coherent_visual_invariants"):
            if row[field] != photo[field]:
                raise ValidationError(f"{row['filename']}: compiled field {field} changed")
        if row["entry_key"] != compiler.entry_key(row["filename"]):
            raise ValidationError(f"{row['filename']}: unstable entry_key")
        expected_route = compiler.initial_route(photo)
        if row["initial_route"] != expected_route:
            raise ValidationError(f"{row['filename']}: initial_route is not compiler-derived")
        expected_steps = compiler.source_schedule(photo)
        if expected_steps:
            for step, actual in zip(expected_steps, row["search_schedule"]):
                expected_path = str((work_root / compiler.entry_key(photo["filename"]) / f"{step['source']}-r{step['round']}" / f"_search-summary-{step['source']}-r{step['round']}.json").resolve())
                if actual != {**step, "summary_path": expected_path}:
                    raise ValidationError(f"{row['filename']}: compiled search schedule changed")
            if len(row["search_schedule"]) != len(expected_steps):
                raise ValidationError(f"{row['filename']}: compiled search schedule length changed")
        elif row["search_schedule"] != []:
            raise ValidationError(f"{row['filename']}: AI entry must have no search schedule")
        authorised = compiler.ai_authorised(photo)
        if authorised:
            prompt = Path(row["generation_prompt_file"])
            if not prompt.is_file() or prompt.is_symlink() or row["generation_prompt_sha256"] != digest(prompt):
                raise ValidationError(f"{row['filename']}: prompt file or hash is stale")
            if row["ai_ledger_path"] != compiler.ai_ledger_path(working_dir, row["filename"]):
                raise ValidationError(f"{row['filename']}: AI ledger path is not compiler-derived")
        elif row["generation_prompt_file"] is not None or row["generation_prompt_sha256"] is not None or row["ai_ledger_path"] is not None:
            raise ValidationError(f"{row['filename']}: unauthorised AI fields are present")
    repair = assignment.get("repair")
    if repair is not None:
        required_repair = {"fault_file", "fault_sha256", "previous_receipt", "previous_receipt_sha256", "prior_summaries", "prior_staged_assets", "additional_real_searches"}
        if not isinstance(repair, dict) or set(repair) != required_repair or repair.get("additional_real_searches") != 1:
            raise ValidationError("repair object is incomplete or changes the one-search repair budget")
        for path_key, hash_key in (("fault_file", "fault_sha256"), ("previous_receipt", "previous_receipt_sha256")):
            path = Path(repair[path_key])
            if not path.is_file() or digest(path) != repair[hash_key]:
                raise ValidationError(f"repair {path_key} is stale")
        for collection in ("prior_summaries", "prior_staged_assets"):
            if not isinstance(repair[collection], list):
                raise ValidationError(f"repair {collection} must be a list")
            for item in repair[collection]:
                if not isinstance(item, dict) or set(item) != {"path", "sha256"} or not Path(item["path"]).is_file() or digest(Path(item["path"])) != item["sha256"]:
                    raise ValidationError(f"repair {collection} contains stale evidence")
    return assignment, entries


def validate_manifest(args) -> None:
    manifest = read_json(Path(args.manifest), "manifest")
    requirements_path = Path(args.requirements).resolve()
    compiler = load_compiler()
    requirements = compiler.validate_requirements(read_json(requirements_path, "requirements"))
    if not isinstance(manifest, dict) or manifest.get("schema_version") != 2 or manifest.get("kind") != "image":
        raise ValidationError("manifest must be schema 2 image")
    ref = manifest.get("requirements")
    if ref != {"path": str(requirements_path), "sha256": digest(requirements_path)}:
        raise ValidationError("manifest requirements hash is stale")
    assignments = manifest.get("assignments")
    expected_batches = compiler.pack_batches(requirements)
    if not isinstance(assignments, list) or len(assignments) != len(expected_batches):
        raise ValidationError("manifest batch count does not match deterministic partition")
    seen = []
    prefix = args.expected_prefix
    for number, (expected_batch, row) in enumerate(zip(expected_batches, assignments), 1):
        batch_id = f"{prefix}{number}"
        if not isinstance(row, dict) or set(row) != {"batch_id", "assignment", "filenames"}:
            raise ValidationError(
                f"manifest batch {number} must carry exactly batch_id, assignment and filenames"
            )
        if row["batch_id"] != batch_id:
            raise ValidationError(f"manifest batch {number} must be named {batch_id}")
        if row["filenames"] != [p["filename"] for p in expected_batch]:
            raise ValidationError(f"manifest batch {batch_id} filenames do not match deterministic partition")
        assignment_path = Path(row.get("assignment", ""))
        if not assignment_path.is_absolute() or assignment_path.name != f"{batch_id}.json" or assignment_path.is_symlink() or not assignment_path.is_file():
            raise ValidationError(f"manifest assignment path is malformed for {batch_id}")
        assignment, _ = validate_assignment_shape(read_json(assignment_path, "assignment"), requirements_path, Path(args.working_dir).resolve(), batch_id, row["filenames"])
        seen.extend(row["filenames"])
    expected_names = [photo["filename"] for photo in requirements]
    if len(seen) != len(expected_names) or set(seen) != set(expected_names):
        raise ValidationError("manifest omits, adds, or duplicates requirements")
    print(f"PICTURE_MANIFEST_OK: {len(assignments)} assignments")


def wikimedia_licence_allowed(name: str) -> bool:
    normal = " ".join(str(name).casefold().replace("-", " ").replace("_", " ").split())
    restrictive = ("nc", "nd", "noncommercial", "non commercial", "no derivatives", "no derivative", "noderivatives", "noderivative")
    tokens = set(normal.split())
    if any(token in tokens for token in restrictive) or any(token in normal for token in restrictive[2:]):
        return False
    return (normal.startswith("public domain") or normal == "pd" or normal.startswith("pd ")
            or normal == "pdm" or normal.startswith("pdm ")
            or normal.startswith(("cc0", "cc 0", "cc by", "cc attribution", "creative commons attribution", "attribution")))


def retry_summary_path(step: dict) -> Path:
    primary = Path(step["summary_path"]).resolve()
    return primary.parent / "retry-1" / primary.name


def step_summary_paths(step: dict) -> tuple[Path, Path]:
    primary = Path(step["summary_path"]).resolve()
    unexpected = [
        path for path in primary.parent.glob("retry-*")
        if path.name != "retry-1"
    ]
    if unexpected:
        raise ValidationError(
            f"compiled search step has an unauthorised retry path: {unexpected[0]}"
        )
    return primary, retry_summary_path(step)


def validate_step_summary_shape(summary: dict, step: dict, label: str) -> None:
    if (
        not isinstance(summary, dict)
        or not isinstance(summary.get("query"), str)
        or not summary["query"].strip()
        or summary.get("source") != step["source"]
        or summary.get("round") != step["round"]
        or summary.get("requested_count") != step["candidate_count"]
        or not isinstance(summary.get("results"), list)
        or type(summary.get("complete")) is not bool
    ):
        raise ValidationError(f"{label}: search summary does not match its compiled step")


def completed_step_summary(step: dict, label: str) -> tuple[Path, dict]:
    primary_path, retry_path = step_summary_paths(step)
    if not primary_path.is_file() or primary_path.is_symlink():
        raise ValidationError(f"{label}: compiled search step has no primary summary")
    primary = read_json(primary_path, f"{label} primary search summary")
    validate_step_summary_shape(primary, step, label)

    if primary["complete"] is True:
        if retry_path.exists():
            raise ValidationError(f"{label}: retry exists after a completed primary search")
        return primary_path, primary

    failure_kind = primary.get("failure_kind")
    if failure_kind not in {"transport", "auth", "rate_limit"}:
        raise ValidationError(f"{label}: incomplete search summary has no recognised failure kind")
    if failure_kind == "transport":
        if not retry_path.is_file() or retry_path.is_symlink():
            raise ValidationError(f"{label}: transient source failure lacks its one retry")
        retry = read_json(retry_path, f"{label} retry search summary")
        validate_step_summary_shape(retry, step, label)
        if retry["complete"] is not True:
            raise ValidationError(f"{label}: retry did not complete")
        return retry_path, retry

    if retry_path.exists():
        raise ValidationError(f"{label}: authentication or rate-limit failure must not be retried")
    raise ValidationError(f"{label}: compiled search step failed operationally")


def step_has_final_operational_failure(step: dict, label: str) -> bool:
    primary_path, retry_path = step_summary_paths(step)
    if not primary_path.is_file() or primary_path.is_symlink():
        return False
    primary = read_json(primary_path, f"{label} failed search summary")
    validate_step_summary_shape(primary, step, label)
    if primary["complete"] is True:
        return False
    if primary.get("failure_kind") not in {"transport", "auth", "rate_limit"}:
        raise ValidationError(f"{label}: incomplete search summary has no recognised failure kind")
    if primary.get("failure_kind") == "transport":
        if not retry_path.is_file() or retry_path.is_symlink():
            return False
        retry = read_json(retry_path, f"{label} failed retry summary")
        validate_step_summary_shape(retry, step, label)
        return retry["complete"] is not True
    return not retry_path.exists()


def attempted_step_summary(step: dict, label: str, *, allow_outage: bool):
    """A compiled search step that the worker was entitled to move on from.

    Without an authorised AI fallback a step must complete, because a picture
    invented in place of an outage would be provenance the contract refused.
    With `fallback_action: ai` the lesson already has an authorised substitute,
    so a step that stayed unavailable through its one allowed retry counts as
    attempted and generation continues. The retry itself is still owed: a
    transient blip is not an outage.
    """
    if not allow_outage:
        return completed_step_summary(step, label)
    try:
        return completed_step_summary(step, label)
    except ValidationError as incomplete:
        try:
            outage = step_has_final_operational_failure(step, label)
        except ValidationError:
            # The outage probe found its own fault with the summary. Report why
            # the step did not complete, not why the probe could not read it.
            raise incomplete from None
        if outage:
            return None
        raise


def terminal_ai_state(compiled: dict, label: str, attempts) -> dict:
    ledger_text = compiled.get("ai_ledger_path")
    if not isinstance(ledger_text, str):
        raise ValidationError(f"{label}: terminal AI reason is not authorised by the assignment")
    ledger_path = Path(ledger_text)
    if not ledger_path.is_file() or ledger_path.is_symlink():
        raise ValidationError(f"{label}: terminal AI reason lacks its immutable ledger")
    try:
        state = attempts.summarise(attempts.read_ledger(str(ledger_path), label))
    except Exception as exc:
        raise ValidationError(f"{label}: terminal AI ledger is invalid: {exc}") from exc
    if not state["attempts"]:
        raise ValidationError(f"{label}: terminal AI ledger has no consumed call")
    if any(attempt["state"] == "generated_unreviewed" for attempt in state["attempts"]):
        raise ValidationError(f"{label}: generated_unreviewed is not terminal")
    if any(
        attempt["outcome"] == "accepted" and not attempt["review_rejected"]
        for attempt in state["attempts"]
    ):
        raise ValidationError(f"{label}: no-file result conflicts with a live accepted AI output")
    return state


def summary_candidate(summary: dict, candidate_id: str, work_root: Path, label: str) -> dict:
    if (not isinstance(summary, dict) or summary.get("complete") is not True
            or not isinstance(summary.get("query"), str) or not summary["query"].strip()
            or not isinstance(summary.get("results"), list)):
        raise ValidationError(f"{label}: selected summary is not completed evidence")
    matches = [c for c in summary["results"] if isinstance(c, dict) and c.get("candidate_id") == candidate_id]
    if len(matches) != 1:
        raise ValidationError(f"{label}: candidate_id does not identify exactly one summary candidate")
    candidate = matches[0]
    fields = {"candidate_id", "sha256", "byte_count", "width", "height", "decoded_format", "source", "source_page_url", "creator", "licence_name", "licence_url", "description", "path"}
    if set(candidate) != fields:
        raise ValidationError(f"{label}: candidate summary has incomplete mechanical fields")
    if (candidate["source"] not in REAL_SOURCES
            or not isinstance(candidate["candidate_id"], str) or not candidate["candidate_id"]
            or not isinstance(candidate["sha256"], str)
            or not isinstance(candidate["byte_count"], int) or candidate["byte_count"] <= 0
            or not isinstance(candidate["width"], int) or candidate["width"] <= 0
            or not isinstance(candidate["height"], int) or candidate["height"] <= 0
            or not all(isinstance(candidate.get(field), str) and candidate[field].strip()
                       for field in ("source_page_url", "creator", "licence_name", "licence_url", "description"))):
        raise ValidationError(f"{label}: candidate mechanical metadata is invalid")
    if candidate["source"] == "unsplash" and (candidate["licence_name"] != "Unsplash License" or candidate["licence_url"] != "https://unsplash.com/license"):
        raise ValidationError(f"{label}: Unsplash candidate has an unbound licence")
    if candidate["source"] == "wikimedia" and (not wikimedia_licence_allowed(candidate["licence_name"]) or not candidate["licence_url"]):
        raise ValidationError(f"{label}: Wikimedia candidate has an unbound or restrictive licence")
    path = Path(candidate["path"]).resolve()
    if not inside(path, work_root) or path.is_symlink() or not path.is_file():
        raise ValidationError(f"{label}: candidate path is not a regular file under WORK_ROOT")
    if digest(path) != candidate["sha256"] or path.stat().st_size != candidate["byte_count"]:
        raise ValidationError(f"{label}: candidate hash or byte count does not match summary")
    width, height, decoded = image_info(path)
    if width != candidate["width"] or height != candidate["height"] or decoded.casefold() != str(candidate["decoded_format"]).casefold():
        raise ValidationError(f"{label}: candidate decode does not match summary")
    return candidate


def validate_result(args) -> None:
    assignment_path = Path(args.assignment).resolve()
    assignment = read_json(assignment_path, "assignment")
    expected = list(args.expected_filename)
    if not expected or len(set(expected)) != len(expected):
        raise ValidationError("expected filename set must be non-empty and unique")
    assignment, assignment_entries = validate_assignment_shape(assignment, Path(assignment["requirements"]["path"]).resolve(), Path(args.working_dir).resolve(), args.expected_batch_id, expected)
    work_root = Path(args.work_root).resolve()
    if work_root != Path(assignment["work_root"]).resolve():
        raise ValidationError("--work-root disagrees with assignment work_root")
    result = read_json(Path(args.result), "result")
    if not isinstance(result, dict) or set(result) != {"schema_version", "kind", "batch_id", "entries"} or result.get("schema_version") != 2 or result.get("kind") != "image" or result.get("batch_id") != args.expected_batch_id:
        raise ValidationError("result must contain only the schema 2 image result fields")
    rows = result.get("entries")
    if not isinstance(rows, list) or [r.get("filename") if isinstance(r, dict) else None for r in rows] != expected:
        raise ValidationError("result must contain exactly the expected filename set in order")
    compiler = load_compiler(); attempts = load_attempts()
    for row, compiled in zip(rows, assignment_entries):
        label = row.get("filename") if isinstance(row, dict) else "<invalid>"
        if not isinstance(row, dict) or set(row) != RESULT_FIELDS:
            raise ValidationError(f"{label}: result row has forbidden or missing fields")
        if row["filename"] != compiled["filename"] or row["status"] not in STATUSES:
            raise ValidationError(f"{label}: invalid result row identity or status")
        status = row["status"]; selection = row["selection"]; staged = row["staging_path"]; reason = row["reason"]
        if reason is not None and reason not in REASONS:
            raise ValidationError(f"{label}: invalid terminal reason")
        if status == "sourced":
            if compiled["initial_route"] != "real":
                raise ValidationError(f"{label}: controlled AI cannot report a sourced result")
            if not isinstance(selection, dict) or set(selection) != {"summary_path", "candidate_id"} or staged is not None or reason is not None:
                raise ValidationError(f"{label}: sourced requires only a summary selection")
            schedule = compiled["search_schedule"]
            allowed = {}
            for index, step in enumerate(schedule):
                for summary_path in step_summary_paths(step):
                    allowed[str(summary_path)] = (index, step)
            path = str(Path(selection["summary_path"]).resolve())
            prior = {str(Path(item["path"]).resolve()): item for item in (assignment.get("repair", {}).get("prior_summaries", []) if isinstance(assignment.get("repair"), dict) else [])}
            if path in allowed:
                step_index, step = allowed[path]
                summary_root = work_root
            elif path in prior:
                step_index, step = -1, None
                summary_root = (Path(args.working_dir).resolve() / "unsplash" / "_picture-work").resolve()
                if digest(Path(path)) != prior[path]["sha256"]:
                    raise ValidationError(f"{label}: prior source summary hash is stale")
            else:
                raise ValidationError(f"{label}: source summary is not at a compiled schedule path")
            if Path(path).is_symlink():
                raise ValidationError(f"{label}: source summary must not be a symlink")
            summary = read_json(Path(path), f"{label} source summary")
            if step is not None:
                validate_step_summary_shape(summary, step, label)
                selected_path = Path(path).resolve()
                primary_path, retry_path = step_summary_paths(step)
                if selected_path == retry_path:
                    if not primary_path.is_file():
                        raise ValidationError(f"{label}: retry summary has no primary failure")
                    primary = read_json(primary_path, f"{label} primary search summary")
                    validate_step_summary_shape(primary, step, label)
                    if primary["complete"] is True or primary.get("failure_kind") != "transport":
                        raise ValidationError(f"{label}: retry summary is not authorised")
                elif retry_path.exists():
                    raise ValidationError(f"{label}: selected primary summary has a later retry")

                for prior_step in schedule[:step_index]:
                    completed_step_summary(prior_step, label)
            candidate = summary_candidate(summary, selection["candidate_id"], summary_root, label)
            if step is not None and candidate["source"] != step["source"]:
                raise ValidationError(f"{label}: candidate source does not match compiled step")
            if step is not None:
                for later in schedule[step_index + 1:]:
                    if any(candidate.exists() for candidate in step_summary_paths(later)):
                        raise ValidationError(f"{label}: later search exists after an earlier selected winner")
        elif status == "generated":
            if selection is not None or not isinstance(staged, str) or reason is not None:
                raise ValidationError(f"{label}: generated requires a staged path and no selection")
            if not compiler.ai_authorised({"acquisition_mode": compiled["acquisition_mode"], "fallback_action": compiled["fallback_action"]}):
                raise ValidationError(f"{label}: generated status is not AI-authorised")
            outage_allowed = compiled["fallback_action"] == "ai"
            for step in compiled["search_schedule"]:
                attempted_step_summary(step, label, allow_outage=outage_allowed)
            staged_path = Path(staged).resolve()
            if not inside(staged_path, work_root) or staged_path.is_symlink() or not staged_path.is_file():
                raise ValidationError(f"{label}: generated staging path is outside WORK_ROOT")
            image_info(staged_path)
            prompt = Path(compiled["generation_prompt_file"])
            if digest(prompt) != compiled["generation_prompt_sha256"]:
                raise ValidationError(f"{label}: prompt hash is stale")
            ledger_path = Path(compiled["ai_ledger_path"])
            if not ledger_path.is_file() or ledger_path.is_symlink():
                raise ValidationError(f"{label}: AI ledger is missing")
            try:
                ledger_data = attempts.read_ledger(str(ledger_path), label)
                prompt_text = prompt.read_text(encoding="utf-8")
                state = attempts.summarise(ledger_data)
                if not state["attempts"]:
                    raise ValidationError(f"{label}: AI ledger has no reserved attempt")
                first = state["attempts"][0]
                if first["attempt"] != 1 or first["purpose"] != "initial" or first["prompt"] != prompt_text:
                    raise ValidationError(f"{label}: first AI reservation does not match the immutable initial prompt")
                for later_attempt in state["attempts"][1:]:
                    if later_attempt["purpose"] not in {"correction", "recovery", "retry"}:
                        raise ValidationError(f"{label}: later AI reservation has an illegal purpose")
                    if not isinstance(later_attempt["prompt"], str) or not later_attempt["prompt"].strip():
                        raise ValidationError(f"{label}: later AI reservation has no immutable prompt")
            except ValidationError:
                raise
            except Exception as exc:
                raise ValidationError(f"{label}: unreadable AI ledger: {exc}") from exc
            accepted = [a for a in state["attempts"] if a["outcome"] == "accepted" and not a["review_rejected"] and a["staging_path"] and Path(a["staging_path"]).resolve() == staged_path]
            if not accepted:
                raise ValidationError(f"{label}: generated output is not the effective accepted ledger output")
            if any(a["state"] == "generated_unreviewed" for a in state["attempts"]):
                raise ValidationError(f"{label}: generated_unreviewed is not terminal")
        else:
            if selection is not None or staged is not None or not isinstance(reason, str):
                raise ValidationError(f"{label}: no-file status requires a terminal reason only")
            if status == "omitted" and reason not in {
                "optional_omission",
                "authorised_alternative",
                "imagegen_capability_unavailable",
            }:
                raise ValidationError(f"{label}: omitted has an invalid reason")
            if status == "unsatisfied" and reason not in REASONS:
                raise ValidationError(f"{label}: unsatisfied has an invalid reason")

            if status == "omitted" and compiled["fallback_action"] != "omit":
                raise ValidationError(f"{label}: omission is not authorised by fallback_action")
            if reason == "optional_omission" and (status != "omitted" or compiled["essential"]):
                raise ValidationError(f"{label}: optional omission requires a non-essential omitted entry")
            if compiled["initial_route"] == "ai" and reason == "optional_omission":
                raise ValidationError(f"{label}: direct AI cannot skip generation with optional omission")
            if reason == "authorised_alternative" and status != "omitted":
                raise ValidationError(f"{label}: authorised alternative must use omitted status")
            if reason == "imagegen_capability_unavailable":
                expected_status = "omitted" if compiled["fallback_action"] == "omit" else "unsatisfied"
                if status != expected_status:
                    raise ValidationError(f"{label}: capability-unavailable status disagrees with fallback_action")
                ledger_text = compiled.get("ai_ledger_path")
                if isinstance(ledger_text, str) and Path(ledger_text).exists():
                    ledger_data = attempts.read_ledger(ledger_text, label)
                    if ledger_data.get("events"):
                        raise ValidationError(f"{label}: capability unavailable must consume no AI call")

            if compiled["initial_route"] == "ai" and reason in {
                "no_faithful_real_match",
                "real_source_unavailable",
                "real_requirement_unfulfillable",
            }:
                raise ValidationError(f"{label}: direct AI cannot report a real-search reason")

            completed_real_reasons = {
                "optional_omission",
                "authorised_alternative",
                "no_faithful_real_match",
                "real_requirement_unfulfillable",
            }
            if compiled["initial_route"] == "real" and reason in completed_real_reasons:
                for step in compiled["search_schedule"]:
                    completed_step_summary(step, label)

            # An authorised AI fallback exists so the lesson still gets its
            # picture. Neither an exhausted search nor a source outage is a
            # terminal answer while that fallback remains unused.
            if (
                compiled["initial_route"] == "real"
                and compiled["fallback_action"] == "ai"
                and reason in {
                    "no_faithful_real_match",
                    "real_requirement_unfulfillable",
                    "real_source_unavailable",
                }
            ):
                raise ValidationError(
                    f"{label}: authorised AI fallback cannot stop at a real-search outcome; "
                    f"generate, then report the generation outcome"
                )

            if compiled["initial_route"] == "real" and reason == "real_source_unavailable":
                if status != "unsatisfied":
                    raise ValidationError(f"{label}: source outage must be unsatisfied")
                if not any(
                    step_has_final_operational_failure(step, label)
                    for step in compiled["search_schedule"]
                ):
                    raise ValidationError(f"{label}: real_source_unavailable lacks final outage evidence")

            ai_terminal_reasons = {
                "fundamental_generation_miss",
                "correction_failed",
                "attempt_budget_exhausted",
                "imagegen_output_unavailable",
            }
            if reason in ai_terminal_reasons:
                state = terminal_ai_state(compiled, label, attempts)
                if reason == "attempt_budget_exhausted" and state["attempts_used"] != 2:
                    raise ValidationError(f"{label}: attempt budget is not exhausted")
                if reason == "correction_failed" and state["attempts_used"] != 2:
                    raise ValidationError(f"{label}: correction_failed requires two consumed calls")
                if reason == "imagegen_output_unavailable":
                    last = state["attempts"][-1]
                    if last["fault"] != "imagegen_output_unavailable":
                        raise ValidationError(f"{label}: output-unavailable reason does not match the ledger")
    print("PICTURE_RESULT_OK")


def parser():
    root = argparse.ArgumentParser(description=__doc__)
    sub = root.add_subparsers(dest="command", required=True)
    manifest = sub.add_parser("manifest")
    manifest.add_argument("--requirements", required=True)
    manifest.add_argument("--manifest", required=True)
    manifest.add_argument("--working-dir", required=True)
    manifest.add_argument("--expected-prefix", choices=("p", "w"), required=True)
    manifest.set_defaults(func=validate_manifest)
    result = sub.add_parser("result")
    result.add_argument("--assignment", required=True)
    result.add_argument("--result", required=True)
    result.add_argument("--working-dir", required=True)
    result.add_argument("--work-root", required=True)
    result.add_argument("--expected-batch-id", required=True)
    result.add_argument("--expected-filename", action="append", default=[])
    result.set_defaults(func=validate_result)
    return root


def main(argv=None) -> int:
    try:
        args = parser().parse_args(argv)
        args.func(args)
        return 0
    except ValidationError as exc:
        print(f"PICTURE_RESULT_INVALID: {exc}", file=sys.stderr)
        return 1
    except (OSError, KeyError, TypeError, ValueError) as exc:
        print(f"PICTURE_RESULT_INVALID: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
