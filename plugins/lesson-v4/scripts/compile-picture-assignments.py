#!/usr/bin/env python3
"""Deterministically compile a schema 2 picture contract into small workers."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path, PurePosixPath

SCHEMA_VERSION = 2
SOURCES = {
    "unsplash-only": ["unsplash"],
    "wikimedia-only": ["wikimedia"],
    "unsplash-then-wikimedia": ["unsplash", "wikimedia"],
    "wikimedia-then-unsplash": ["wikimedia", "unsplash"],
    "none": [],
}

# The two rungs below the designer's chosen profile. Neither is a profile the
# designer picks, because neither is a preference: they are what the ladder does
# when the shelf it was pointed at turns out to be empty.
#
# `openverse` searches about a hundred collections at once - Flickr Commons,
# where archives and museums publish their photographs, the Science Museum
# Group, the Smithsonian, Europeana, university libraries - and every result
# carries its own licence. It costs one free keyless call, so it goes on the end
# of every real schedule.
#
# `web` leaves the indexed libraries altogether: the scout finds the holding
# institution's own page and `web_fetch.py` takes the picture from it. That is
# more expensive and it is the only rung that needs a judgement about reuse, so
# it is authorised for one case only - a picture whose contract says the lesson
# gets nothing if the search fails. A Year 4 history lesson lost its slides, its
# worksheet and its answer key to five such photographs that were sitting on a
# county record office's blog the whole time.
LADDER_SOURCE = "openverse"
OPEN_WEB_SOURCE = "web"
AI_PROMPT_FIELDS = {"physical_state", "must_avoid", "text_rule", "composition"}
PROMPT_USES = {"slide", "worksheet", "both"}
STYLE_RULE = "photorealistic, generic, classroom-suitable, no decorative extras"


class AssignmentError(ValueError):
    pass


def run_ceiling() -> int:
    """The most pictures one run may carry, owned by check-photo-cap.py.

    A wave compiles from a merged snapshot: the frozen design contract plus
    every picture an adaptation or a later need added. The design budget is 16,
    but those additions are exactly what the run ceiling of 24 exists to allow,
    and a compiler that stopped at 16 refused a valid seventeenth picture's
    whole wave. One number, read from the script that defines it.
    """
    import importlib.util

    script = Path(__file__).resolve().parent / "check-photo-cap.py"
    spec = importlib.util.spec_from_file_location("check_photo_cap", script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return int(module.RUN_MAX_PHOTOS)


def nonempty(value) -> bool:
    return isinstance(value, str) and bool(value.strip())


def safe_filename(value) -> bool:
    if not nonempty(value) or "\\" in value or value.startswith("/"):
        return False
    if len(value) > 1 and value[1] == ":":
        return False
    parts = PurePosixPath(value).parts
    return bool(parts) and all(part not in {"", ".", ".."} for part in parts) and str(PurePosixPath(value)) == value


def read_json(path: Path, label: str):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise AssignmentError(f"{label} does not exist: {path}") from exc
    except (OSError, json.JSONDecodeError) as exc:
        raise AssignmentError(f"{label} is unreadable JSON: {path}: {exc}") from exc


def file_hash(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError as exc:
        raise AssignmentError(f"cannot hash {path}: {exc}") from exc


def immutable_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if path.read_bytes() != data:
            raise AssignmentError(f"immutable output already exists with different bytes: {path}")
        return
    temporary = path.with_name(f".{path.name}.tmp-{os.getpid()}")
    try:
        with temporary.open("wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    except OSError as exc:
        temporary.unlink(missing_ok=True)
        raise AssignmentError(f"cannot write immutable output {path}: {exc}") from exc


def entry_key(filename: str) -> str:
    return hashlib.sha256(filename.encode("utf-8")).hexdigest()[:12]


def ai_ledger_path(working_dir: Path, filename: str) -> str:
    digest = hashlib.sha256(filename.encode("utf-8")).hexdigest()[:12]
    stem = "".join(c if c.isalnum() or c in "-._" else "_" for c in PurePosixPath(filename).name)[:60]
    return str((working_dir / "unsplash" / "_ai-ledger" / f"{stem}-{digest}.json").resolve())


def prompt_valid(prompt) -> bool:
    return (
        isinstance(prompt, dict)
        and set(prompt) == AI_PROMPT_FIELDS
        and nonempty(prompt.get("physical_state"))
        and isinstance(prompt.get("must_avoid"), list)
        and all(nonempty(v) for v in prompt["must_avoid"])
        and nonempty(prompt.get("text_rule"))
        and nonempty(prompt.get("composition"))
    )


def ai_authorised(photo: dict) -> bool:
    return photo["acquisition_mode"] == "controlled-ai" or photo["fallback_action"] == "ai"


def render_prompt(photo: dict) -> str:
    prompt = photo.get("generation_prompt")
    if not prompt_valid(prompt):
        raise AssignmentError(f"{photo.get('filename')}: generation prompt is not complete")
    evidence = "\n".join(f"- {x}" for x in photo["load_bearing_evidence"])
    avoid = "\n".join(f"- {x}" for x in prompt["must_avoid"]) or "- no additional avoid requirements"
    group = "none"
    if photo["coherent_group"] is not None:
        group = "\n".join([f"group: {photo['coherent_group']}", *[f"- {x}" for x in photo["coherent_visual_invariants"]]])
    return (
        f"SUBJECT:\n{photo['subject']}\n\n"
        f"TEACHING JOB:\n{photo['teaching_requirement']}\n\n"
        f"PEDAGOGICAL CONSTRAINT:\n{photo['pedagogical_constraint']}\n\n"
        f"MUST SHOW:\n{evidence}\n\n"
        f"PHYSICAL STATE:\n{prompt['physical_state']}\n\n"
        f"USE:\n{prompt.get('use', photo['use'])}\n\n"
        f"MATCHED SET:\n{group}\n\n"
        f"MUST AVOID:\n{avoid}\n\n"
        f"TEXT RULE:\n{prompt['text_rule']}\n\n"
        f"COMPOSITION:\n{prompt['composition']}\n\n"
        f"STYLE:\n{STYLE_RULE}"
    )

# Kept public for callers that need to render/check the compiler's exact bytes.
def render_initial_prompt(entry: dict) -> str:
    return render_prompt(entry)


def _validate_photo(photo: dict, index: int) -> None:
    required = {
        "id", "subject", "pedagogical_constraint", "teaching_requirement",
        "load_bearing_evidence", "use", "essential", "filename",
        "acquisition_mode", "source_profile", "fallback_action", "fallback_note",
        "generation_prompt", "coherent_group", "coherent_mode",
        "coherent_visual_invariants",
    }
    if not isinstance(photo, dict) or set(photo) != required:
        raise AssignmentError(f"photo {index + 1}: exact schema 2 field set is required")
    if not nonempty(photo["id"]) or not re.fullmatch(r"(?:photo|adaptation-photo)-\d{3}", photo["id"]):
        raise AssignmentError(f"photo {index + 1}: invalid id")
    for field in ("subject", "teaching_requirement"):
        if not nonempty(photo[field]):
            raise AssignmentError(f"{photo['id']}: {field} must be non-empty")
    if not isinstance(photo["pedagogical_constraint"], str):
        raise AssignmentError(f"{photo['id']}: pedagogical_constraint must be a string")
    if not isinstance(photo["load_bearing_evidence"], list) or not photo["load_bearing_evidence"] or not all(nonempty(v) for v in photo["load_bearing_evidence"]):
        raise AssignmentError(f"{photo['id']}: load_bearing_evidence must be non-empty strings")
    if photo["use"] not in PROMPT_USES or type(photo["essential"]) is not bool or not safe_filename(photo["filename"]):
        raise AssignmentError(f"{photo['id']}: invalid use, essential, or filename")
    if photo["acquisition_mode"] not in {"authentic-real", "ordinary-real", "controlled-ai"}:
        raise AssignmentError(f"photo contract route error: {photo['id']}: invalid acquisition_mode")
    if photo["source_profile"] not in SOURCES:
        raise AssignmentError(f"photo contract route error: {photo['id']}: invalid source_profile")
    if photo["fallback_action"] not in {"ai", "omit", "unsatisfied"}:
        raise AssignmentError(f"photo contract route error: {photo['id']}: invalid fallback_action")
    if photo["fallback_note"] is not None and not isinstance(photo["fallback_note"], str):
        raise AssignmentError(f"{photo['id']}: fallback_note must be null or a string")
    if photo["coherent_mode"] not in {"none", "all-real", "all-generated"}:
        raise AssignmentError(f"photo contract coherence error: {photo['id']}: invalid coherent_mode")
    if photo["coherent_group"] is None:
        if photo["coherent_mode"] != "none" or photo["coherent_visual_invariants"] != []:
            raise AssignmentError(f"photo contract coherence error: {photo['id']}: null group requires none and []")
    elif not nonempty(photo["coherent_group"]) or not isinstance(photo["coherent_visual_invariants"], list) or not photo["coherent_visual_invariants"] or not all(nonempty(v) for v in photo["coherent_visual_invariants"]):
        raise AssignmentError(f"photo contract coherence error: {photo['id']}: invalid group invariants")
    prompt_needed = photo["acquisition_mode"] == "controlled-ai" or photo["fallback_action"] == "ai"
    if prompt_needed and not prompt_valid(photo["generation_prompt"]):
        raise AssignmentError(f"photo contract route error: {photo['id']}: complete generation_prompt required")
    if not prompt_needed and photo["generation_prompt"] is not None:
        raise AssignmentError(f"photo contract route error: {photo['id']}: generation_prompt must be null")
    if photo["acquisition_mode"] == "authentic-real":
        if photo["source_profile"] == "none" or photo["fallback_action"] == "ai" or photo["generation_prompt"] is not None:
            raise AssignmentError(f"photo contract route error: {photo['id']}: invalid authentic-real route")
        # authentic-real is the only route that can end a lesson with no picture
        # and no authorised substitute, so the reason has to be written down
        # rather than reached by default.
        if not nonempty(photo["fallback_note"]):
            raise AssignmentError(
                f"photo contract route error: {photo['id']}: authentic-real requires a fallback_note "
                f"saying why a faithful generated photograph would misteach; use ordinary-real when it would not"
            )
    elif photo["acquisition_mode"] == "ordinary-real":
        if photo["source_profile"] == "none":
            raise AssignmentError(f"photo contract route error: {photo['id']}: ordinary-real requires a source profile")
        # ordinary-real means authenticity is not load-bearing, so a faithful
        # generated photograph does the same teaching job. Refusing that
        # substitute is what leaves an essential picture undelivered.
        if photo["fallback_action"] == "unsatisfied":
            raise AssignmentError(
                f"photo contract route error: {photo['id']}: ordinary-real cannot use fallback_action unsatisfied; "
                f"use ai, or omit when the picture is not essential"
            )
        if photo["essential"] and photo["fallback_action"] != "ai":
            if photo["coherent_mode"] == "all-real":
                # The set forbids the AI fallback this member needs, so the
                # whole comparison can arrive empty. A matched generated set
                # also gives the shared framing a comparison depends on.
                raise AssignmentError(
                    f"photo contract coherence error: {photo['id']}: an essential ordinary-real member of an "
                    f"all-real set has no way to be delivered; use all-generated with controlled-ai members, "
                    f"or authentic-real members when real origin is the evidence"
                )
            raise AssignmentError(
                f"photo contract route error: {photo['id']}: an essential ordinary-real picture requires "
                f"fallback_action ai with a complete generation_prompt; use authentic-real only when a "
                f"generated photograph would misteach"
            )
    else:
        if photo["source_profile"] != "none" or photo["fallback_action"] == "ai":
            raise AssignmentError(f"photo contract route error: {photo['id']}: invalid controlled-ai route")


def validate_requirements(document: dict) -> list[dict]:
    if not isinstance(document, dict) or document.get("schema_version") != 2:
        raise AssignmentError("photo requirements schema_version must be 2")
    if set(document) != {"schema_version", "lesson_name", "photos"} or not nonempty(document.get("lesson_name")):
        raise AssignmentError("photo requirements must contain schema_version, lesson_name and photos")
    photos = document["photos"]
    if not isinstance(photos, list) or len(photos) > run_ceiling():
        raise AssignmentError(f"photo requirements photos must be a list of at most {run_ceiling()}")
    ids: set[str] = set(); filenames: set[str] = set(); semantic: set[str] = set(); groups: dict[str, list[dict]] = {}
    for index, photo in enumerate(photos):
        _validate_photo(photo, index)
        if photo["id"] in ids or photo["filename"] in filenames:
            raise AssignmentError("duplicate photo id or filename")
        ids.add(photo["id"]); filenames.add(photo["filename"])
        key = json.dumps({k: photo[k] for k in photo if k not in {"id", "filename"}}, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        if key in semantic:
            raise AssignmentError(f"duplicate exact photo contract: {photo['id']}")
        semantic.add(key)
        if photo["coherent_group"] is not None:
            groups.setdefault(photo["coherent_group"], []).append(photo)
    for group, members in groups.items():
        if len(members) > 4:
            raise AssignmentError(f"photo contract coherence error: group {group!r} is larger than four")
        modes = {p["coherent_mode"] for p in members}
        invariant_bytes = {json.dumps(p["coherent_visual_invariants"], ensure_ascii=False) for p in members}
        if len(modes) != 1 or len(invariant_bytes) != 1:
            raise AssignmentError(f"photo contract coherence error: group {group!r} members disagree")
        mode = next(iter(modes))
        if mode == "all-real" and any(p["acquisition_mode"] == "controlled-ai" or p["fallback_action"] == "ai" for p in members):
            raise AssignmentError(f"photo contract coherence error: all-real group {group!r} cannot use AI")
        if mode == "all-generated" and any(p["acquisition_mode"] != "controlled-ai" for p in members):
            raise AssignmentError(f"photo contract coherence error: all-generated group {group!r} requires controlled AI")
    return photos


def select_expected(photos: list[dict], expected_filenames) -> list[dict]:
    """Narrow validated requirements to the filenames one wave owns.

    A supplemental wave compiles only the pictures a later designer promised,
    against a merged snapshot that also carries every already-finished picture.
    The compiler and its independent validator must narrow that snapshot
    identically, or the wave's manifest is measured against a partition it
    never claimed and a correct manifest is rejected. An empty selection means
    the whole contract, which is what Phase 2 asks for.
    """
    wanted = list(expected_filenames or [])
    if not wanted:
        if not photos:
            raise AssignmentError("at least one picture filename is required")
        return photos
    if len(set(wanted)) != len(wanted):
        raise AssignmentError("--expected-filename contains a duplicate")
    by_name = {photo["filename"]: photo for photo in photos}
    missing = [name for name in wanted if name not in by_name]
    if missing:
        raise AssignmentError(f"requirements do not contain expected filename {missing[0]}")
    chosen = [photo for photo in photos if photo["filename"] in set(wanted)]
    if not chosen:
        raise AssignmentError("at least one picture filename is required")
    return chosen


def source_schedule(photo: dict) -> list[dict]:
    if photo["acquisition_mode"] == "controlled-ai":
        return []
    sources = SOURCES[photo["source_profile"]]
    if not sources:
        raise AssignmentError(f"{photo['id']}: real route has no source profile")
    if photo["coherent_mode"] == "all-real" or photo["acquisition_mode"] == "authentic-real":
        budget = 3
    elif photo["essential"] and photo["fallback_action"] != "ai":
        budget = 2
    else:
        budget = 1
    count = 3 if photo["essential"] else 2

    candidates = [(sources[0], 1)]
    if budget >= 2:
        if len(sources) > 1:
            candidates.append((sources[1], 1))
        else:
            candidates.append((sources[0], 2))
    if budget >= 3 and len(sources) > 1:
        candidates.append((sources[0], 2))

    steps = [
        {
            "source": source,
            "round": round_number,
            "candidate_count": count,
        }
        for source, round_number in candidates[:budget]
    ]

    # The scout stops at the first faithful winner, so a rung below the
    # designer's own profile costs nothing on a picture the profile serves.
    steps.append({"source": LADDER_SOURCE, "round": 1, "candidate_count": count})
    if photo["fallback_action"] == "unsatisfied":
        steps.append({"source": OPEN_WEB_SOURCE, "round": 1, "candidate_count": count})
    return steps


def initial_route(photo: dict) -> str:
    return "ai" if photo["acquisition_mode"] == "controlled-ai" else "real"


def prompt_paths(photo: dict, output_dir: Path, batch_id: str, working_dir: Path) -> tuple[str | None, str | None]:
    if not ai_authorised(photo):
        return None, None
    path = (output_dir / "prompts" / batch_id / f"{entry_key(photo['filename'])}.txt").resolve()
    data = (render_prompt(photo) + "\n").encode("utf-8")
    immutable_write(path, data)
    return str(path), hashlib.sha256(data).hexdigest()


def units_for(photos: list[dict]) -> list[list[dict]]:
    groups: dict[str, list[dict]] = {}
    units: list[list[dict]] = []
    for photo in photos:
        group = photo["coherent_group"]
        if group is None:
            units.append([photo])
        elif group not in groups:
            group_members = [p for p in photos if p["coherent_group"] == group]
            groups[group] = group_members
            units.append(group_members)
    return sorted(units, key=lambda u: min(photos.index(p) for p in u))


def can_join(batch: list[list[dict]], unit: list[dict]) -> bool:
    entries = sum(len(existing) for existing in batch) + len(unit)
    direct_ai = sum(
        1
        for existing_unit in batch
        for photo in existing_unit
        if initial_route(photo) == "ai"
    ) + sum(1 for photo in unit if initial_route(photo) == "ai")

    if entries > 4:
        return False
    if len(unit) == 4 and unit[0]["coherent_mode"] == "all-generated":
        return not batch
    if any(
        len(existing) == 4
        and existing[0]["coherent_mode"] == "all-generated"
        for existing in batch
    ):
        return False
    return direct_ai <= 3


def pack_batches(photos: list[dict]) -> list[list[dict]]:
    units = units_for(photos)
    best: list[list[list[dict]]] | None = None
    best_key = None

    def key(batches):
        return (len(batches), tuple(tuple(sorted(photos.index(p) for unit in b for p in unit)) for b in batches))

    def visit(index: int, batches: list[list[dict]]) -> None:
        nonlocal best, best_key
        remaining_entries = sum(len(unit) for unit in units[index:])
        lower_bound = len(batches) + (remaining_entries + 3) // 4
        if best is not None and lower_bound > len(best):
            return
        if index == len(units):
            candidate_key = key(batches)
            if best_key is None or candidate_key < best_key:
                best = [list(batch) for batch in batches]
                best_key = candidate_key
            return
        unit = units[index]
        seen_shapes = set()
        for batch_index, batch in enumerate(batches):
            shape = (sum(len(existing) for existing in batch), sum(sum(1 for photo in existing if initial_route(photo) == "ai") for existing in batch), tuple(sorted({photo["coherent_mode"] for existing in batch for photo in existing if photo["coherent_mode"] != "none"})))
            if shape in seen_shapes:
                continue
            seen_shapes.add(shape)
            if can_join(batch, unit):
                batch.append(unit)
                visit(index + 1, batches)
                batch.pop()
        # A new batch is always considered after existing batches, so ties are
        # stable and follow the earliest original requirement indexes.
        batches.append([unit])
        visit(index + 1, batches)
        batches.pop()

    visit(0, [])
    if best is None:
        raise AssignmentError("requirements cannot be packed into valid batches")
    ordered = []
    for batch in sorted(best, key=lambda b: min(photos.index(p) for u in b for p in u)):
        ordered.append(sorted((p for u in batch for p in u), key=photos.index))
    return ordered


def build_assignment(requirements_path: Path, photos: list[dict], batch_id: str, prefix: str, output_dir: Path, working_dir: Path, repair: dict | None = None) -> dict:
    work_root = (working_dir / "unsplash" / "_picture-work" / batch_id).resolve()
    rows = []
    for photo in photos:
        prompt_file, prompt_hash = prompt_paths(photo, output_dir, batch_id, working_dir)
        rows.append({
            "entry_key": entry_key(photo["filename"]),
            "filename": photo["filename"],
            "subject": photo["subject"],
            "pedagogical_constraint": photo["pedagogical_constraint"],
            "teaching_requirement": photo["teaching_requirement"],
            "load_bearing_evidence": photo["load_bearing_evidence"],
            "use": photo["use"],
            "essential": photo["essential"],
            "acquisition_mode": photo["acquisition_mode"],
            "fallback_action": photo["fallback_action"],
            "coherent_group": photo["coherent_group"],
            "coherent_mode": photo["coherent_mode"],
            "coherent_visual_invariants": photo["coherent_visual_invariants"],
            "initial_route": initial_route(photo),
            "search_schedule": [
                {
                    **step,
                    "summary_path": str((work_root / entry_key(photo["filename"]) / f"{step['source']}-r{step['round']}" / f"_search-summary-{step['source']}-r{step['round']}.json").resolve()),
                }
                for step in source_schedule(photo)
            ],
            "generation_prompt_file": prompt_file,
            "generation_prompt_sha256": prompt_hash,
            "ai_ledger_path": ai_ledger_path(working_dir, photo["filename"]) if ai_authorised(photo) else None,
        })
    assignment = {
        "schema_version": 2,
        "kind": "image",
        "batch_id": batch_id,
        "requirements": {"path": str(requirements_path.resolve()), "sha256": file_hash(requirements_path)},
        "work_root": str(work_root),
        "entries": rows,
    }
    if repair is not None:
        assignment["repair"] = repair
    return assignment


def write_json_immutable(path: Path, value: dict) -> None:
    immutable_write(path, (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))


def compile_command(args) -> int:
    requirements_path = Path(args.requirements).resolve()
    requirements = read_json(requirements_path, "requirements")
    photos = select_expected(validate_requirements(requirements), args.expected_filename)
    prefix = args.expected_prefix
    output_dir = Path(args.output_dir).resolve()
    working_dir = Path(args.working_dir).resolve()
    batches = pack_batches(photos)
    manifest_rows = []
    for number, batch in enumerate(batches, 1):
        batch_id = f"{prefix}{number}"
        assignment_path = (output_dir / f"{batch_id}.json").resolve()
        assignment = build_assignment(requirements_path, batch, batch_id, prefix, output_dir, working_dir)
        write_json_immutable(assignment_path, assignment)
        manifest_rows.append({
            "batch_id": batch_id,
            "assignment": str(assignment_path),
            "filenames": [p["filename"] for p in batch],
        })
    public_manifest = {"schema_version": 2, "kind": "image", "requirements": {"path": str(requirements_path), "sha256": file_hash(requirements_path)}, "assignments": manifest_rows}
    manifest_path = (output_dir / "manifest.json").resolve()
    write_json_immutable(manifest_path, public_manifest)
    summary = {
        "schemaVersion": 1,
        "ok": True,
        "schema_version": 2,
        "kind": "picture-compile-summary",
        "requirements": public_manifest["requirements"],
        "assignment_manifest": str(manifest_path),
        "batch_ids": [row["batch_id"] for row in manifest_rows],
        "filenames": [p["filename"] for p in photos],
    }
    write_json_immutable(Path(args.summary_output).resolve(), summary)
    # Both counts, because they are different numbers and the orchestrator has
    # to report the second. The picture stage's state line is "attempting [N]
    # pictures", and a run that had only the assignment count in front of it
    # told four designers a contract of five photographs was attempting two.
    print(
        f"PICTURE_ASSIGNMENTS_OK: {len(batches)} assignments, "
        f"{len(photos)} pictures"
    )
    print(f"MANIFEST={manifest_path}")
    print(f"SUMMARY={Path(args.summary_output).resolve()}")
    return 0


def _hash_recorded_path(value, label: str) -> dict | None:
    if not isinstance(value, str):
        return None
    path = Path(value)
    if not path.is_file():
        return {"path": value, "sha256": None}
    return {"path": str(path.resolve()), "sha256": file_hash(path)}


def repair_command(args) -> int:
    assignment_path = Path(args.assignment).resolve()
    assignment = read_json(assignment_path, "assignment")
    if not isinstance(assignment, dict) or assignment.get("schema_version") != 2 or assignment.get("kind") != "image":
        raise AssignmentError("assignment must be schema 2 image")
    entries = assignment.get("entries")
    if not isinstance(entries, list):
        raise AssignmentError("assignment entries is not a list")
    matching = [row for row in entries if row.get("filename") == args.expected_filename]
    if len(matching) != 1:
        raise AssignmentError("repair filename must belong to exactly one assignment entry")
    fault = Path(args.review_fault_file).resolve()
    receipt = Path(args.previous_receipt).resolve()
    if not fault.is_file() or not receipt.is_file():
        raise AssignmentError("repair fault and previous receipt must exist")
    fault_hash = file_hash(fault); receipt_hash = file_hash(receipt)
    receipt_data = read_json(receipt, "previous receipt")
    prior_summaries = []; staged_assets = []
    def collect(node):
        if isinstance(node, dict):
            for key, value in node.items():
                if isinstance(value, str) and ("summary" in key.lower() or "staging" in key.lower() or "asset" in key.lower()):
                    record = _hash_recorded_path(value, key)
                    if record and record["sha256"]:
                        (staged_assets if "stag" in key.lower() or "asset" in key.lower() else prior_summaries).append(record)
                collect(value)
        elif isinstance(node, list):
            for value in node: collect(value)
    collect(receipt_data)
    row = dict(matching[0])
    repair = {"fault_file": str(fault), "fault_sha256": fault_hash, "previous_receipt": str(receipt), "previous_receipt_sha256": receipt_hash, "prior_summaries": prior_summaries, "prior_staged_assets": staged_assets, "additional_real_searches": 1}
    output = Path(args.output).resolve()
    repaired = {"schema_version": 2, "kind": "image", "batch_id": args.batch_id, "requirements": assignment["requirements"], "work_root": str((Path(args.working_dir).resolve() / "unsplash" / "_picture-work" / args.batch_id).resolve()), "entries": [row], "repair": repair}
    write_json_immutable(output, repaired)
    summary = {"schema_version": 2, "kind": "picture-repair-slice", "assignment": str(assignment_path), "output": str(output), "fault_sha256": fault_hash, "previous_receipt_sha256": receipt_hash, "additional_real_searches": 1}
    write_json_immutable(Path(args.summary_output).resolve(), summary)
    print(f"PICTURE_REPAIR_ASSIGNMENT_OK: {output}")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    sub = root.add_subparsers(dest="command", required=True)
    compile_parser = sub.add_parser("compile")
    compile_parser.add_argument("--requirements", required=True)
    # p: the Phase 2 wave; a: the early adaptation wave; w: a supplemental wave.
    compile_parser.add_argument("--expected-prefix", choices=("p", "a", "w"), required=True)
    compile_parser.add_argument("--expected-filename", action="append", default=[])
    compile_parser.add_argument("--output-dir", required=True)
    compile_parser.add_argument("--working-dir", required=True)
    compile_parser.add_argument("--summary-output", required=True)
    compile_parser.set_defaults(func=compile_command)
    repair = sub.add_parser("slice")
    for option in ("assignment", "batch-id", "output", "working-dir", "expected-filename", "review-fault-file", "previous-receipt", "summary-output"):
        repair.add_argument("--" + option, required=True)
    repair.set_defaults(func=repair_command)
    return root


def main(argv=None) -> int:
    try:
        args = parser().parse_args(argv)
        return args.func(args)
    except AssignmentError as exc:
        print(f"PICTURE_ASSIGNMENT_ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
