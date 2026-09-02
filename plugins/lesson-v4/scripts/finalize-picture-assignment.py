#!/usr/bin/env python3
"""Validate, publish, receipt, and compile provenance for picture assignments."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import shutil
from pathlib import Path, PurePosixPath

SCHEMA_VERSION = 2
PUBLISH_ATTEMPTS = 1


class FinalizeError(ValueError):
    pass


def read_json(path: Path, label: str):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise FinalizeError(f"{label} does not exist: {path}") from exc
    except (OSError, json.JSONDecodeError) as exc:
        raise FinalizeError(f"{label} is unreadable JSON: {path}: {exc}") from exc


def sha256(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError as exc:
        raise FinalizeError(f"cannot hash {path}: {exc}") from exc


def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=str(path.parent), delete=False, suffix=".part")
    try:
        json.dump(payload, handle, indent=2, ensure_ascii=False); handle.write("\n"); handle.flush(); os.fsync(handle.fileno()); handle.close(); os.replace(handle.name, path)
    except BaseException:
        handle.close();
        if os.path.exists(handle.name): os.unlink(handle.name)
        raise


def inside(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve()); return True
    except (ValueError, OSError): return False


def receipt_path(working_dir: Path, filename: str) -> Path:
    return working_dir / "orchestration-receipts" / "picture-terminal" / f"{hashlib.sha256(filename.encode('utf-8')).hexdigest()}.json"


def matching_receipt_is_terminal(
    receipt: dict,
    working_dir: Path,
    filename: str,
) -> bool:
    state = receipt.get("terminalState")
    if state in {"omitted", "unsatisfied"}:
        return True
    if state == "picture_publish_failed":
        return False
    if state != "published":
        return False
    publication = receipt.get("publication")
    if not isinstance(publication, dict):
        raise FinalizeError(f"published terminal receipt has no publication evidence: {filename}")
    canonical = (working_dir / PurePosixPath(filename)).resolve()
    recorded_path = publication.get("canonicalPath")
    recorded_hash = publication.get("canonicalSha256")
    if (
        recorded_path != str(canonical)
        or not canonical.is_file()
        or not isinstance(recorded_hash, str)
        or sha256(canonical) != recorded_hash
    ):
        raise FinalizeError(f"published terminal receipt is stale: {filename}")
    return True


def validator_command(args, script_dir: Path) -> list[str]:
    values = [sys.executable, str(script_dir / "validate-image-scout.py"), "result", "--assignment", str(args.assignment), "--result", str(args.result), "--working-dir", str(args.working_dir), "--work-root", str(args.work_root), "--expected-batch-id", args.expected_batch_id]
    for filename in args.expected_filename: values.extend(["--expected-filename", filename])
    return values


def run_validator(args, script_dir: Path) -> tuple[list[str], str]:
    command = validator_command(args, script_dir)
    result = subprocess.run(command, capture_output=True, text=True)
    text = (result.stdout + result.stderr).strip()
    if result.returncode != 0 or "PICTURE_RESULT_OK" not in result.stdout.splitlines():
        raise FinalizeError(f"independent picture-result validation failed: {text}")
    return command, text


def candidate_provenance(selection: dict, work_root: Path) -> dict:
    summary_path = Path(selection["summary_path"]).resolve()
    summary = read_json(summary_path, "selected source summary")
    candidates = [c for c in summary.get("results", []) if isinstance(c, dict) and c.get("candidate_id") == selection.get("candidate_id")]
    if len(candidates) != 1: raise FinalizeError("selected source candidate is not unique")
    candidate = candidates[0]
    if candidate.get("source") == "unsplash" and (candidate.get("licence_name") != "Unsplash License" or candidate.get("licence_url") != "https://unsplash.com/license"):
        raise FinalizeError("Unsplash candidate has an unbound licence")
    if candidate.get("source") == "wikimedia":
        spec = importlib.util.spec_from_file_location("wikimedia_license", Path(__file__).resolve().parent / "wikimedia_fetch.py")
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        if not module.is_allowed_licence(candidate.get("licence_name")) or not candidate.get("licence_url"):
            raise FinalizeError("Wikimedia candidate has an unbound or restrictive licence")
    path = Path(candidate.get("path", "")).resolve()
    if not inside(path, work_root) or not path.is_file() or sha256(path) != candidate.get("sha256"):
        raise FinalizeError("selected candidate changed before publication")
    return {
        "kind": "sourced", "source": candidate["source"], "candidateId": candidate["candidate_id"],
        "sourcePageUrl": candidate["source_page_url"], "creator": candidate["creator"],
        "licenceName": candidate["licence_name"], "licenceUrl": candidate["licence_url"],
        "candidatePath": str(path), "candidateSha256": candidate["sha256"], "candidateByteCount": candidate["byte_count"],
        "summaryPath": str(summary_path), "summarySha256": sha256(summary_path),
    }


def ledger_provenance(entry: dict) -> dict:
    path = Path(entry["ai_ledger_path"]).resolve()
    if not path.is_file(): raise FinalizeError(f"AI ledger is missing: {path}")
    data = read_json(path, "AI ledger")
    return {"kind": "generated", "ledgerPath": str(path), "ledgerSha256": sha256(path), "history": data}


def expected_receipt(args, assignment: dict, result_row: dict, terminal_state: str, provenance: dict, canonical: Path | None, canonical_hash: str | None, publication_command: str | None, reason: str | None) -> dict:
    return {
        "schemaVersion": SCHEMA_VERSION, "filename": result_row["filename"], "terminalState": terminal_state,
        "requirements": {"path": assignment["requirements"]["path"], "sha256": assignment["requirements"]["sha256"]},
        "assignment": {"path": str(Path(args.assignment).resolve()), "sha256": sha256(Path(args.assignment))},
        "result": {"path": str(Path(args.result).resolve()), "sha256": sha256(Path(args.result))},
        "validator": {"command": " ".join(validator_command(args, Path(__file__).resolve().parent)), "result": "PICTURE_RESULT_OK", "exitCode": 0},
        "publication": {"command": publication_command, "canonicalPath": str(canonical) if canonical else None, "canonicalSha256": canonical_hash},
        "aiLedger": ({"path": provenance["ledgerPath"], "sha256": provenance["ledgerSha256"]} if provenance.get("kind") == "generated" else {"path": None, "sha256": None}),
        "provenance": provenance, "terminalReason": reason,
        "hostTerminalSuccessObserved": True, "hostOwnedDegradationReason": reason,
    }


def publish_one(script_dir: Path, working: Path, source: Path, filename: str, replace: str) -> tuple[bool, str, int]:
    # publish-picture.py intentionally accepts only its staging namespace. The
    # unified worker's durable root is the source of truth, so copy one proved
    # file into a finaliser-owned transient staging slot rather than weakening
    # that publisher boundary.
    slot = working / "unsplash" / "_staging" / "finalizer" / hashlib.sha256(filename.encode("utf-8")).hexdigest()
    try:
        slot.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, slot)
    except OSError as exc:
        return False, f"prepare publication staging for {filename}: {exc}", 1
    command = [sys.executable, str(script_dir / "publish-picture.py"), "publish", "--source", str(slot), "--filename", filename, "--working-dir", str(working), "--replace", replace]
    try:
        completed = subprocess.run(command, capture_output=True, text=True)
        return completed.returncode == 0, " ".join(command), completed.returncode
    finally:
        try:
            slot.unlink()
        except OSError:
            pass


def assignment_command(args) -> int:
    assignment_path = Path(args.assignment).resolve(); result_path = Path(args.result).resolve(); working = Path(args.working_dir).resolve(); work_root = Path(args.work_root).resolve()
    assignment = read_json(assignment_path, "assignment")
    result = read_json(result_path, "result")
    if args.replace == "yes" and "repair" not in assignment:
        raise FinalizeError("replace yes is reserved for a focused repair assignment")
    if args.replace == "no" and "repair" in assignment:
        raise FinalizeError("focused repair assignments require replace yes")
    # Whole-result validation is deliberately the first side effect boundary.
    command, _ = run_validator(args, Path(__file__).resolve().parent)
    rows = result["entries"]
    compiled = {row["filename"]: row for row in assignment["entries"]}
    summary = {
        "schemaVersion": 1,
        "ok": True,
        "schema_version": 2,
        "kind": "picture-finalization-summary",
        "batch_id": args.expected_batch_id,
        "releasedFilenames": [],
        "entries": [],
        "errors": [],
    }
    for row in rows:
        filename = row["filename"]; entry = compiled[filename]; canonical = (working / PurePosixPath(filename)).resolve()
        if not inside(canonical, working): raise FinalizeError(f"canonical path escapes working directory: {filename}")
        selected = row["selection"]; staged = row["staging_path"]; status = row["status"]
        if status == "sourced":
            provenance = candidate_provenance(selected, (working / "unsplash" / "_picture-work").resolve()); source_path = Path(next(c["path"] for c in read_json(Path(selected["summary_path"]), "summary")["results"] if c.get("candidate_id") == selected["candidate_id"])).resolve()
        elif status == "generated":
            provenance = ledger_provenance(entry); source_path = Path(staged)
        else:
            provenance = {"kind": "none"}; source_path = None
        existing = receipt_path(working, filename)
        if existing.is_file():
            old = read_json(existing, "terminal receipt")
            matches_current = (
                old.get("requirements") == assignment.get("requirements")
                and old.get("assignment", {}).get("sha256") == sha256(assignment_path)
                and old.get("result", {}).get("sha256") == sha256(result_path)
            )
            if matches_current and matching_receipt_is_terminal(old, working, filename):
                summary["releasedFilenames"].append(filename)
                summary["entries"].append(
                    {
                        "filename": filename,
                        "action": "already-finalized",
                        "terminalState": old.get("terminalState"),
                    }
                )
                continue
            if matches_current and old.get("terminalState") == "picture_publish_failed":
                pass
            elif isinstance(assignment.get("repair"), dict):
                repair = assignment["repair"]
                if (
                    Path(repair["previous_receipt"]).resolve() != existing.resolve()
                    or sha256(existing) != repair["previous_receipt_sha256"]
                ):
                    raise FinalizeError(f"focused repair previous receipt is stale: {filename}")
            else:
                raise FinalizeError(f"existing terminal receipt does not match {filename}")
        publication = None; canonical_hash = None; terminal_state = status if status in {"omitted", "unsatisfied"} else "unsatisfied"; reason = row.get("reason")
        if source_path is not None:
            ok, publication, _ = publish_one(Path(__file__).resolve().parent, working, source_path.resolve(), filename, args.replace)
            if ok and canonical.is_file(): terminal_state = "published"; canonical_hash = sha256(canonical); summary["releasedFilenames"].append(filename)
            else: terminal_state = "picture_publish_failed"; reason = "picture_publish_failed"; summary["ok"] = False; summary["errors"].append(f"{filename}: publication failed")
        receipt = expected_receipt(args, assignment, row, terminal_state, provenance, canonical if terminal_state == "published" else None, canonical_hash, publication, reason)
        atomic_json(existing, receipt)
        if source_path is None:
            summary["releasedFilenames"].append(filename)
        summary["entries"].append({"filename": filename, "action": "published" if terminal_state == "published" else "terminalized", "terminalState": terminal_state})
    atomic_json(Path(args.summary_output).resolve(), summary)
    print(json.dumps(summary, indent=2))
    return 0 if summary["ok"] else 1


def verify_receipt_provenance(receipt: dict, filename: str) -> None:
    provenance = receipt.get("provenance")
    if not isinstance(provenance, dict) or provenance.get("kind") not in {"sourced", "generated", "none"}:
        raise FinalizeError(f"invalid provenance evidence for {filename}")
    if provenance["kind"] == "sourced":
        summary = Path(provenance.get("summaryPath", "")).resolve()
        candidate = Path(provenance.get("candidatePath", "")).resolve()
        if not summary.is_file() or sha256(summary) != provenance.get("summarySha256"):
            raise FinalizeError(f"source summary hash evidence is stale for {filename}")
        if not candidate.is_file() or sha256(candidate) != provenance.get("candidateSha256") or candidate.stat().st_size != provenance.get("candidateByteCount"):
            raise FinalizeError(f"source candidate hash evidence is stale for {filename}")
    elif provenance["kind"] == "generated":
        ledger = Path(provenance.get("ledgerPath", "")).resolve()
        if not ledger.is_file() or sha256(ledger) != provenance.get("ledgerSha256"):
            raise FinalizeError(f"AI ledger hash evidence is stale for {filename}")
    elif receipt.get("terminalState") == "published":
        raise FinalizeError(f"published filename has no provenance: {filename}")


def receipt_matches_final_contract(
    receipt: dict,
    filename: str,
    final_photo: dict,
    working_dir: Path,
) -> None:
    reference = receipt.get("requirements")
    if not isinstance(reference, dict) or set(reference) != {"path", "sha256"}:
        raise FinalizeError(f"terminal receipt has malformed requirements evidence: {filename}")
    snapshot = Path(reference["path"]).resolve()
    if not inside(snapshot, working_dir):
        raise FinalizeError(f"terminal receipt requirements escape the lesson working directory: {filename}")
    if not snapshot.is_file() or sha256(snapshot) != reference["sha256"]:
        raise FinalizeError(f"terminal receipt requirements snapshot is stale: {filename}")
    document = read_json(snapshot, "terminal receipt requirements snapshot")
    if document.get("schema_version") != 2 or not isinstance(document.get("photos"), list):
        raise FinalizeError(f"terminal receipt requirements snapshot is not schema 2: {filename}")
    matches = [
        photo
        for photo in document["photos"]
        if isinstance(photo, dict) and photo.get("filename") == filename
    ]
    if len(matches) != 1 or matches[0] != final_photo:
        raise FinalizeError(f"terminal receipt photo contract is stale or changed: {filename}")


def early_wave_snapshot(args, working: Path) -> tuple[Path, dict[str, dict]] | None:
    """The immutable contract the early adaptation wave compiled from.

    The early wave sources every picture an adaptation asked for while the
    Worksheet Designer is still deciding which ones the sheet will carry, so at
    finalisation a receipt can belong to a picture the final contract never
    took. Those receipts are real evidence of real work (and of a licence the
    run must keep), not stray files: this is what lets provenance tell the two
    apart. Absent, or given a path that is not a schema-2 contract inside the
    working folder, and every receipt outside the final contract is stray, as
    it always was.
    """
    text = getattr(args, "early_wave_snapshot", None)
    if not text:
        return None
    snapshot = Path(text).resolve()
    if not inside(snapshot, working) or not snapshot.is_file():
        raise FinalizeError(f"early-wave snapshot is not a file inside the lesson working directory: {snapshot}")
    document = read_json(snapshot, "early-wave snapshot")
    if document.get("schema_version") != 2 or not isinstance(document.get("photos"), list):
        raise FinalizeError(f"early-wave snapshot is not schema 2: {snapshot}")
    photos = {
        photo["filename"]: photo
        for photo in document["photos"]
        if isinstance(photo, dict) and isinstance(photo.get("filename"), str)
    }
    return snapshot, photos


def receipt_bound_to(receipt: dict, snapshot: Path) -> bool:
    reference = receipt.get("requirements")
    return (
        isinstance(reference, dict)
        and isinstance(reference.get("path"), str)
        and Path(reference["path"]).resolve() == snapshot
    )


def provenance_command(args) -> int:
    requirements_path = Path(args.requirements).resolve(); requirements = read_json(requirements_path, "requirements")
    if requirements.get("schema_version") != 2 or not isinstance(requirements.get("photos"), list): raise FinalizeError("requirements must be schema 2")
    expected = [photo.get("filename") for photo in requirements["photos"]]
    final_by_filename = {
        photo["filename"]: photo
        for photo in requirements["photos"]
        if isinstance(photo, dict) and isinstance(photo.get("filename"), str)
    }
    if len(final_by_filename) != len(expected):
        raise FinalizeError("final requirements contain invalid or duplicate filenames")
    working = Path(args.working_dir).resolve()
    early = early_wave_snapshot(args, working)
    receipt_dir = Path(args.terminal_receipts_dir).resolve(); paths = sorted(receipt_dir.glob("*.json")); by_name = {}
    # Receipts the early wave wrote for pictures the final contract never took.
    unused: dict[str, dict] = {}
    for path in paths:
        receipt = read_json(path, "terminal receipt")
        if receipt.get("schemaVersion") != 2 or not isinstance(receipt.get("filename"), str): raise FinalizeError(f"invalid terminal receipt: {path}")
        filename = receipt["filename"]
        if receipt.get("terminalState") not in {"published", "omitted", "unsatisfied", "picture_publish_failed"}:
            raise FinalizeError(f"invalid terminal state for {filename}")
        expected_name = hashlib.sha256(filename.encode("utf-8")).hexdigest() + ".json"
        if path.name != expected_name: raise FinalizeError(f"stale terminal receipt filename: {path}")
        if filename not in final_by_filename:
            # Only a receipt the early wave wrote, against the early snapshot,
            # for a picture that snapshot holds, is an unused early picture.
            # Anything else outside the final contract is what it always was.
            if early is None or filename not in early[1] or not receipt_bound_to(receipt, early[0]):
                raise FinalizeError(f"extra terminal evidence: {filename}")
            receipt_matches_final_contract(receipt, filename, early[1][filename], working)
            if filename in unused: raise FinalizeError(f"duplicate terminal evidence: {filename}")
            unused[filename] = receipt
            continue
        receipt_matches_final_contract(
            receipt,
            filename,
            final_by_filename[filename],
            working,
        )
        if filename in by_name: raise FinalizeError(f"duplicate terminal evidence: {filename}")
        by_name[filename] = receipt
    missing = [name for name in expected if name not in by_name]; extra = [name for name in by_name if name not in expected]
    if missing: raise FinalizeError("missing terminal evidence: " + ", ".join(missing))
    if extra: raise FinalizeError("extra terminal evidence: " + ", ".join(extra))
    rows = []
    for filename in expected:
        receipt = by_name[filename]
        verify_receipt_provenance(receipt, filename)
        publication = receipt.get("publication", {}); canonical_text = publication.get("canonicalPath")
        if receipt.get("terminalState") == "published":
            canonical = Path(canonical_text or "").resolve()
            expected_canonical = (working / PurePosixPath(filename)).resolve()
            if canonical != expected_canonical or not canonical.is_file() or sha256(canonical) != publication.get("canonicalSha256"):
                raise FinalizeError(f"canonical hash evidence is stale for {filename}")
        rows.append({"filename": filename, "terminalState": receipt.get("terminalState"), "canonicalPath": canonical_text, "canonicalSha256": publication.get("canonicalSha256"), "provenance": receipt.get("provenance"), "terminalReason": receipt.get("terminalReason")})

    # An early picture the sheet did not take keeps every piece of evidence it
    # earned (its receipt, its search summary or AI ledger) and loses only the
    # published file, which nothing now references: left in place it would be a
    # picture in the lesson folder that no resource uses and no record names.
    # The receipt still proves what was fetched and under what licence, and
    # the row below says the file was removed on purpose.
    unused_rows = []
    for filename in sorted(unused):
        receipt = unused[filename]
        verify_receipt_provenance(receipt, filename)
        publication = receipt.get("publication", {})
        removed = False
        if receipt.get("terminalState") == "published":
            canonical = (working / PurePosixPath(filename)).resolve()
            if canonical.is_file():
                if sha256(canonical) != publication.get("canonicalSha256"):
                    raise FinalizeError(f"canonical hash evidence is stale for unused early picture {filename}")
                canonical.unlink()
                removed = True
            print(f"PICTURE_UNUSED_REMOVED: {filename}")
        unused_rows.append({"filename": filename, "terminalState": receipt.get("terminalState"), "canonicalPath": None, "canonicalSha256": publication.get("canonicalSha256"), "canonicalRemoved": removed, "provenance": receipt.get("provenance"), "terminalReason": receipt.get("terminalReason")})

    payload = {"schema_version": 2, "kind": "picture-provenance", "requirements": {"path": str(requirements_path), "sha256": sha256(requirements_path)}, "rows": rows}
    summary = {"schema_version": 2, "ok": True, "rows": len(rows), "output": str(Path(args.output).resolve())}
    if early is not None:
        early_used = [name for name in expected if receipt_bound_to(by_name[name], early[0])]
        payload["earlyWave"] = {"snapshot": str(early[0]), "sourcedEarly": len(early_used) + len(unused_rows), "used": early_used, "unused": [row["filename"] for row in unused_rows]}
        payload["unusedRows"] = unused_rows
        summary["earlyWave"] = {"sourcedEarly": len(early_used) + len(unused_rows), "used": len(early_used), "unused": len(unused_rows)}
        print(f"PICTURE_EARLY_WAVE: {len(early_used) + len(unused_rows)} sourced early, {len(early_used)} used, {len(unused_rows)} unused")
    atomic_json(Path(args.output).resolve(), payload)
    if args.summary_output:
        summary["schemaVersion"] = 1
        atomic_json(Path(args.summary_output).resolve(), summary)
    print("PICTURE_PROVENANCE_OK")
    return 0


def parser():
    root = argparse.ArgumentParser(description=__doc__); sub = root.add_subparsers(dest="command", required=True)
    assignment = sub.add_parser("assignment")
    for option in ("assignment", "result", "working-dir", "work-root", "expected-batch-id", "summary-output"): assignment.add_argument("--" + option, required=True)
    assignment.add_argument("--expected-filename", action="append", default=[]); assignment.add_argument("--replace", choices=("no", "yes"), required=True); assignment.set_defaults(func=assignment_command)
    provenance = sub.add_parser("provenance")
    for option in ("requirements", "terminal-receipts-dir", "working-dir", "output", "summary-output"): provenance.add_argument("--" + option, required=True)
    # The immutable contract the early adaptation picture wave compiled from,
    # when that wave ran; it is what lets an early-sourced picture the sheet
    # never took be accounted for rather than refused as stray evidence.
    provenance.add_argument("--early-wave-snapshot")
    provenance.set_defaults(func=provenance_command)
    return root


def main(argv=None):
    try:
        args = parser().parse_args(argv)
        return args.func(args)
    except FinalizeError as exc: print(f"PICTURE_FINALIZE_ERROR: {exc}", file=sys.stderr); return 1


if __name__ == "__main__": raise SystemExit(main())
