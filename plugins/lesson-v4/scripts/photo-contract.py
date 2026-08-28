#!/usr/bin/env python3
"""Deterministic photo-contract operations for make-lesson.

This script owns byte-stable initial freezing, adaptation-photo extraction and
conflict checks, provisional worksheet contracts, promotion of only photos
actually used by an accepted worksheet plan, and worksheet photo-contract
selection. It does not decide whether a picture is pedagogically needed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SCHEMA_VERSION = 2
RECEIPT_SCHEMA_VERSION = 1
PHOTO_ID_RE = re.compile(r"^adaptation-photo-\d{3}$")
FENCED_JSON_RE = re.compile(r"```json\s*(\{.*?\})\s*```", re.S | re.I)


class PhotoContractError(ValueError):
    pass


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def read_json(path: Path, label: str) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PhotoContractError(f"{label} is unreadable JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise PhotoContractError(f"{label} root must be an object")
    photos = data.get("photos")
    if not isinstance(photos, list):
        raise PhotoContractError(f"{label}.photos must be an array")
    return data




def require_schema2(data: dict, label: str) -> dict:
    if not isinstance(data, dict) or data.get("schema_version") != SCHEMA_VERSION:
        raise PhotoContractError(f"{label} must use schema_version 2")
    if set(data) != {"schema_version", "lesson_name", "photos"}:
        raise PhotoContractError(f"{label} must contain exactly schema_version, lesson_name and photos")
    if not isinstance(data.get("lesson_name"), str) or not data["lesson_name"].strip():
        raise PhotoContractError(f"{label}.lesson_name must be non-empty")
    if not isinstance(data.get("photos"), list):
        raise PhotoContractError(f"{label}.photos must be an array")
    return data


def atomic_write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "wb", dir=str(path.parent), delete=False, suffix=".part"
    )
    try:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
        handle.close()
        os.replace(handle.name, path)
    except BaseException:
        handle.close()
        if os.path.exists(handle.name):
            os.remove(handle.name)
        raise


def atomic_write_json(path: Path, payload: dict) -> None:
    atomic_write_bytes(
        path,
        (json.dumps(payload, indent=2, ensure_ascii=False) + "\n").encode("utf-8"),
    )


def photo_identity(photo: dict, label: str) -> tuple[str, str]:
    if not isinstance(photo, dict):
        raise PhotoContractError(f"{label} must be an object")
    photo_id = photo.get("id")
    filename = photo.get("filename")
    if not isinstance(photo_id, str) or not photo_id:
        raise PhotoContractError(f"{label}.id must be a non-empty string")
    if not isinstance(filename, str) or not filename:
        raise PhotoContractError(f"{label}.filename must be a non-empty string")
    return photo_id, filename


def validate_unique(photos: list[dict], label: str) -> None:
    ids: dict[str, dict] = {}
    filenames: dict[str, str] = {}
    for index, photo in enumerate(photos):
        photo_id, filename = photo_identity(photo, f"{label}.photos[{index}]")
        if photo_id in ids and ids[photo_id] != photo:
            raise PhotoContractError(f"{label}: conflicting duplicate id {photo_id}")
        if filename in filenames and filenames[filename] != photo_id:
            raise PhotoContractError(
                f"{label}: filename {filename!r} belongs to both "
                f"{filenames[filename]!r} and {photo_id!r}"
            )
        ids[photo_id] = photo
        filenames[filename] = photo_id


def adaptation_photos(path: Path) -> list[dict]:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise PhotoContractError(f"adaptation file is unreadable: {exc}") from exc
    marker = text.lower().find("photos for the sheets")
    if marker < 0:
        return []
    tail = text[marker:]
    match = FENCED_JSON_RE.search(tail)
    if not match:
        raise PhotoContractError(
            "Photos for the sheets exists but has no fenced json object"
        )
    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        raise PhotoContractError(f"adaptation photo block is invalid JSON: {exc}") from exc
    if not isinstance(data, dict) or data.get("schema_version") != SCHEMA_VERSION or not isinstance(data.get("lesson_name"), str) or not isinstance(data.get("photos"), list):
        raise PhotoContractError("adaptation photo block must be a schema 2 object with a photos array")
    photos = data["photos"]
    expected_fields = {"id", "subject", "pedagogical_constraint", "teaching_requirement", "load_bearing_evidence", "use", "essential", "filename", "acquisition_mode", "source_profile", "fallback_action", "fallback_note", "generation_prompt", "coherent_group", "coherent_mode", "coherent_visual_invariants"}
    for index, photo in enumerate(photos):
        if not isinstance(photo, dict) or set(photo) != expected_fields:
            raise PhotoContractError(f"adaptation.photos[{index}] must be a complete schema 2 photo object")
    validate_unique(photos, "adaptation")
    for index, photo in enumerate(photos, 1):
        photo_id, _ = photo_identity(photo, f"adaptation.photos[{index - 1}]")
        expected = f"adaptation-photo-{index:03d}"
        if photo_id != expected:
            raise PhotoContractError(
                f"adaptation photo ids must be sequential: expected {expected}, got {photo_id}"
            )
    return photos


def merge_photos(base: dict, additions: list[dict]) -> tuple[dict, list[str], list[str]]:
    result = json.loads(json.dumps(base))
    photos = result["photos"]
    validate_unique(photos, "base")
    by_id = {photo["id"]: photo for photo in photos}
    by_filename = {photo["filename"]: photo["id"] for photo in photos}
    new_ids: list[str] = []
    new_filenames: list[str] = []
    for photo in additions:
        photo_id, filename = photo_identity(photo, "addition")
        existing = by_id.get(photo_id)
        if existing is not None:
            if existing != photo:
                raise PhotoContractError(
                    f"same id has different photo object: {photo_id}"
                )
            continue
        filename_owner = by_filename.get(filename)
        if filename_owner is not None and filename_owner != photo_id:
            raise PhotoContractError(
                f"same filename has different id: {filename} -> {filename_owner}, {photo_id}"
            )
        photos.append(photo)
        by_id[photo_id] = photo
        by_filename[filename] = photo_id
        new_ids.append(photo_id)
        new_filenames.append(filename)
    return result, new_ids, new_filenames


def collect_strings(value) -> set[str]:
    found: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if isinstance(key, str):
                found.add(key)
            found.update(collect_strings(child))
    elif isinstance(value, list):
        for child in value:
            found.update(collect_strings(child))
    elif isinstance(value, str):
        found.add(value)
    return found


def run_photo_cap(path: Path) -> None:
    script = Path(__file__).resolve().parent / "check-photo-cap.py"
    completed = subprocess.run(
        [sys.executable, str(script), str(path)],
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise PhotoContractError(
            completed.stderr.strip() or completed.stdout.strip() or "photo cap failed"
        )


def run_lesson_design_validator(lesson_design: Path, photo_requirements: Path) -> None:
    script = Path(__file__).resolve().parent / "validate-lesson-design.py"
    completed = subprocess.run(
        [sys.executable, str(script), str(lesson_design), str(photo_requirements)],
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0 or "LESSON_DESIGN_OK" not in completed.stdout.splitlines():
        raise PhotoContractError(
            completed.stderr.strip()
            or completed.stdout.strip()
            or "lesson-design/photo validation failed"
        )


def cmd_freeze_initial(args) -> int:
    canonical = Path(args.canonical)
    snapshot = Path(args.snapshot)
    require_schema2(read_json(canonical, "canonical photo requirements"), "canonical photo requirements")
    data = canonical.read_bytes()
    if snapshot.exists():
        if snapshot.read_bytes() != data:
            raise PhotoContractError(
                "initial snapshot already exists with different bytes"
            )
    else:
        atomic_write_bytes(snapshot, data)
    receipt = {
        "schemaVersion": 1,
        "canonicalPath": str(canonical.resolve()),
        "snapshotPath": str(snapshot.resolve()),
        "sha256": sha256_bytes(data),
    }
    atomic_write_json(Path(args.receipt), receipt)
    print(f"PHOTO_CONTRACT_INITIAL_FROZEN {receipt['sha256']}")
    return 0


def cmd_build_provisional(args) -> int:
    initial_path = Path(args.initial)
    adaptation_path = Path(args.adaptation)
    initial = require_schema2(read_json(initial_path, "initial photo requirements"), "initial photo requirements")
    additions = adaptation_photos(adaptation_path)
    merged, new_ids, new_filenames = merge_photos(initial, additions)
    output = Path(args.output)
    atomic_write_json(output, merged)
    run_photo_cap(output)
    if args.lesson_design:
        run_lesson_design_validator(Path(args.lesson_design), output)
    receipt = {
        "schemaVersion": 1,
        "baseInitialPhotoSha256": sha256_file(initial_path),
        "adaptationSha256": sha256_file(adaptation_path),
        "provisionalPhotoSha256": sha256_file(output),
        "provisionalPath": str(output.resolve()),
        "adaptationPhotoIds": new_ids,
        "adaptationFilenames": new_filenames,
    }
    atomic_write_json(Path(args.receipt), receipt)
    print(f"PHOTO_CONTRACT_PROVISIONAL_OK {len(new_ids)}")
    return 0


def cmd_promote_used(args) -> int:
    initial_path = Path(args.initial)
    provisional_path = Path(args.provisional)
    worksheet_path = Path(args.worksheet)
    canonical_path = Path(args.canonical)
    adaptation_path = Path(args.adaptation)
    initial = require_schema2(read_json(initial_path, "initial photo requirements"), "initial photo requirements")
    provisional = require_schema2(read_json(provisional_path, "provisional photo requirements"), "provisional photo requirements")
    worksheet = json.loads(worksheet_path.read_text(encoding="utf-8"))
    strings = collect_strings(worksheet)
    provisional_adaptation = [
        photo
        for photo in provisional["photos"]
        if isinstance(photo, dict)
        and isinstance(photo.get("id"), str)
        and PHOTO_ID_RE.fullmatch(photo["id"])
    ]
    used = [photo for photo in provisional_adaptation if photo["id"] in strings]
    base = require_schema2(read_json(canonical_path, "canonical photo requirements"), "canonical photo requirements") if canonical_path.exists() else initial
    merged, new_ids, new_filenames = merge_photos(base, used)

    # Write to a temporary candidate first so the 16-picture cap cannot corrupt
    # canonical state.
    candidate = canonical_path.with_name(f".{canonical_path.name}.candidate")
    atomic_write_json(candidate, merged)
    try:
        run_photo_cap(candidate)
        if args.lesson_design:
            run_lesson_design_validator(Path(args.lesson_design), candidate)
        atomic_write_bytes(canonical_path, candidate.read_bytes())
    finally:
        if candidate.exists():
            candidate.unlink()

    receipt = {
        "schemaVersion": 1,
        "baseInitialPhotoSha256": sha256_file(initial_path),
        "adaptationSha256": sha256_file(adaptation_path),
        "worksheetSha256": sha256_file(worksheet_path),
        "mergedPhotoSha256": sha256_file(canonical_path),
        "newPhotoIds": new_ids,
        "newFilenames": new_filenames,
    }
    snapshot = Path(args.requirements_snapshot)
    atomic_write_bytes(snapshot, canonical_path.read_bytes())
    receipt["requirementsSnapshot"] = str(snapshot.resolve())
    receipt["requirementsSnapshotSha256"] = sha256_file(snapshot)
    atomic_write_json(Path(args.receipt), receipt)
    print(f"PHOTO_CONTRACT_PROMOTED {len(new_ids)}")
    return 0


def valid_receipt(path: Path) -> dict | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict) or data.get("schemaVersion") != RECEIPT_SCHEMA_VERSION:
        return None
    return data


def choose_latest_supplemental(receipt_dir: Path) -> Path | None:
    candidates = []
    for path in receipt_dir.glob("photo-requirements-w-*.json"):
        match = re.fullmatch(r"photo-requirements-w-(\d+)\.json", path.name)
        if match:
            candidates.append((int(match.group(1)), path))
    if not candidates:
        return None

    # Supplemental revisions are append-only accepted states. Once a later wave
    # receipt exists, silently falling back to an older wave would discard an
    # accepted contract. Validate only the highest numbered receipt; if it is
    # stale or malformed, surface that dependency as stale instead.
    _, path = max(candidates)
    data = valid_receipt(path)
    if data is None:
        raise PhotoContractError(
            f"latest supplemental photo receipt is invalid: {path}"
        )
    snapshot_text = data.get("requirementsSnapshot")
    digest = data.get("requirementsSnapshotSha256")
    if (
        not isinstance(snapshot_text, str)
        or not isinstance(digest, str)
        or not Path(snapshot_text).is_file()
        or sha256_file(Path(snapshot_text)) != digest
    ):
        raise PhotoContractError(
            f"latest supplemental photo snapshot is stale: {path}"
        )
    require_schema2(read_json(Path(snapshot_text), "latest supplemental photo snapshot"), "latest supplemental photo snapshot")
    return Path(snapshot_text)


def cmd_select_worksheet(args) -> int:
    working = Path(args.working_dir)
    receipt_dir = working / "orchestration-receipts"
    selected = choose_latest_supplemental(receipt_dir)
    reason = "supplemental"

    if selected is None:
        merge_receipt = receipt_dir / "adaptation-photo-merge.json"
        data = valid_receipt(merge_receipt)
        canonical = working / "photo-requirements.json"
        if (
            data is not None
            and isinstance(data.get("mergedPhotoSha256"), str)
            and canonical.is_file()
            and sha256_file(canonical) == data["mergedPhotoSha256"]
        ):
            selected = canonical
            reason = "adaptation-merge"

    if selected is None and args.adaptation_accepted:
        provisional_receipt = (
            receipt_dir / "adaptation-photo-provisional.json"
        )
        data = valid_receipt(provisional_receipt)
        # The receipt records where build-provisional actually wrote, so the
        # caller chooses the location and this gate never has to guess it.
        provisional = Path(data["provisionalPath"]) if isinstance(data, dict) and isinstance(data.get("provisionalPath"), str) else None
        if (
            data is not None
            and provisional is not None
            and isinstance(data.get("provisionalPhotoSha256"), str)
            and provisional.is_file()
            and sha256_file(provisional) == data["provisionalPhotoSha256"]
        ):
            require_schema2(read_json(provisional, "provisional photo requirements"), "provisional photo requirements")
            selected = provisional
            reason = "adaptation-provisional"

    if selected is None:
        # The freeze receipt is the phase boundary and names the snapshot it
        # wrote, so the frozen contract is found wherever the caller froze it.
        freeze_receipt = working / "phase2-initial-photo-requirements.receipt.json"
        data = valid_receipt(freeze_receipt)
        if data is None:
            raise PhotoContractError(
                f"initial photo requirements freeze receipt is missing or invalid: {freeze_receipt}"
            )
        snapshot_text = data.get("snapshotPath")
        digest = data.get("sha256")
        if not isinstance(snapshot_text, str) or not isinstance(digest, str):
            raise PhotoContractError(
                f"initial photo requirements freeze receipt names no snapshot: {freeze_receipt}"
            )
        selected = Path(snapshot_text)
        if not selected.is_file():
            raise PhotoContractError(f"initial photo requirements snapshot is missing: {selected}")
        if sha256_file(selected) != digest:
            raise PhotoContractError(f"initial photo requirements snapshot is stale: {selected}")
        require_schema2(read_json(selected, "initial photo requirements"), "initial photo requirements")
        reason = "initial"

    payload = {
        "schemaVersion": 1,
        "ok": True,
        "path": str(selected.resolve()),
        "sha256": sha256_file(selected),
        "reason": reason,
    }
    if args.summary_output:
        atomic_write_json(Path(args.summary_output), payload)
    print(json.dumps(payload, separators=(",", ":")))
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    sub = root.add_subparsers(dest="command", required=True)

    freeze = sub.add_parser("freeze-initial")
    freeze.add_argument("--canonical", required=True)
    freeze.add_argument("--snapshot", required=True)
    freeze.add_argument("--receipt", required=True)
    freeze.set_defaults(func=cmd_freeze_initial)

    provisional = sub.add_parser("build-provisional")
    provisional.add_argument("--initial", required=True)
    provisional.add_argument("--adaptation", required=True)
    provisional.add_argument("--output", required=True)
    provisional.add_argument("--lesson-design")
    provisional.add_argument("--receipt", required=True)
    provisional.set_defaults(func=cmd_build_provisional)

    promote = sub.add_parser("promote-used")
    promote.add_argument("--initial", required=True)
    promote.add_argument("--provisional", required=True)
    promote.add_argument("--adaptation", required=True)
    promote.add_argument("--worksheet", required=True)
    promote.add_argument("--canonical", required=True)
    promote.add_argument("--lesson-design")
    promote.add_argument("--receipt", required=True)
    # choose_latest_supplemental refuses a receipt without this immutable
    # snapshot, so a promote that omitted it wrote an unusable receipt.
    promote.add_argument("--requirements-snapshot", required=True)
    promote.set_defaults(func=cmd_promote_used)

    select = sub.add_parser("select-worksheet")
    select.add_argument("--working-dir", required=True)
    select.add_argument("--adaptation-accepted", action="store_true")
    select.add_argument("--summary-output")
    select.set_defaults(func=cmd_select_worksheet)
    return root


def main(argv=None) -> int:
    args = parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except PhotoContractError as exc:
        print(f"PHOTO_CONTRACT_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
