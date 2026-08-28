#!/usr/bin/env python3
"""Per-filename AI attempt ledger for the picture pipeline.

One lesson filename may receive at most two real ImageGen calls during one
automated lesson run: one normal generation and, only when justified, one
correction or recovery call. This helper is the only thing that decides whether
a call is legal, and it is deliberately small: it records history atomically and
refuses to rewrite it. It is not a controller, it never publishes an asset, and
it never launches anything.

Ledger location is derived, never chosen by the caller:

    WORKING_DIR/unsplash/_ai-ledger/<basename>-<short digest of the filename>.json

Commands:

    status         --working-dir DIR --filename unsplash/x.jpg
    reserve        --working-dir DIR --filename unsplash/x.jpg
                   --purpose initial|correction|recovery|retry
                   (--prompt-file PATH | --prompt TEXT)
    record-generated --working-dir DIR --filename unsplash/x.jpg --attempt N
                     --staging-path PATH
    complete       --working-dir DIR --filename unsplash/x.jpg --attempt N
                   --outcome accepted|near_miss|provider_misdirection|rejected
                   [--staging-path P] [--fault-file PATH | --fault TEXT]
    interrupt-open --working-dir DIR --filename unsplash/x.jpg
    review-reject  --working-dir DIR --filename unsplash/x.jpg --attempt N
                   (--fault-file PATH | --fault TEXT) --correctable yes|no

Prefer `--prompt-file` and `--fault-file`. A generation prompt is arbitrary
text — quotes, apostrophes, newlines, `$`, backticks, parentheses — and the whole
point of recording it is to know exactly what was sent. Text that has been
through a shell argument is not that: at best the quoting mangles it, at worst
shell-significant characters are interpreted instead of stored. The file variants
read the exact UTF-8 bytes the worker already wrote to staging, so the ledger and
the picture were built from the same string. The inline variants remain for short,
plainly safe values.

Every command prints one JSON object on stdout. A refusal exits non-zero with
`{"ok": false, "error": "..."}` and leaves the ledger byte-identical.

Standard library only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from pathlib import PurePosixPath

SCHEMA_VERSION = 1
LEDGER_DIRNAME = "_ai-ledger"
MAX_ATTEMPTS = 2

EVENT_TYPES = (
    "reserved",
    "generated_unreviewed",
    "completed",
    "interrupted",
    "review_rejected",
)
COMPLETED_OUTCOMES = (
    "accepted",
    "near_miss",
    "provider_misdirection",
    "rejected",
)
PURPOSES = ("initial", "correction", "recovery", "retry")


class LedgerError(Exception):
    """A refusal. The ledger is never modified when this is raised."""


def resolve_text(inline, path, label):
    """Take arbitrary text from a file when offered, so nothing goes via the shell."""
    if path and inline:
        raise LedgerError(f"give either --{label} or --{label}-file, not both")
    if path:
        try:
            with open(path, encoding="utf-8") as handle:
                return handle.read()
        except OSError as exc:
            raise LedgerError(f"cannot read --{label}-file: {exc}")
    return inline


# --------------------------------------------------------------------------
# paths
# --------------------------------------------------------------------------

def check_filename(filename: str) -> str:
    """Reject anything that is not a plain, normalised, relative picture path."""
    if not filename or not filename.strip():
        raise LedgerError("filename is empty")
    if filename != filename.strip():
        raise LedgerError("filename has surrounding whitespace")
    if "\\" in filename:
        raise LedgerError(f"filename must use forward slashes: {filename!r}")
    if filename.startswith("/") or (len(filename) > 1 and filename[1] == ":"):
        raise LedgerError(f"filename must be relative: {filename!r}")
    parts = PurePosixPath(filename).parts
    if not parts:
        raise LedgerError(f"filename is not a path: {filename!r}")
    for part in parts:
        if part in ("", ".", ".."):
            raise LedgerError(f"filename is not normalised: {filename!r}")
    if str(PurePosixPath(filename)) != filename:
        raise LedgerError(f"filename is not normalised: {filename!r}")
    return filename


def ledger_slug(filename: str) -> str:
    """One checked filename maps to exactly one ledger name, and never shares it.

    Flattening separators alone is not enough: `unsplash/a__b.jpg` and
    `unsplash/a/b.jpg` are different pictures that would flatten to the same
    name, and two pictures sharing one ledger would share one two-call budget.
    A digest of the full path guarantees separation; the readable basename is
    kept in front so a human can still tell what a ledger belongs to.
    """
    check_filename(filename)
    digest = hashlib.sha256(filename.encode("utf-8")).hexdigest()[:12]
    base = PurePosixPath(filename).name
    safe_base = "".join(c if c.isalnum() or c in "-._" else "_" for c in base)[:60]
    return f"{safe_base}-{digest}"


def ledger_path(working_dir: str, filename: str) -> str:
    return os.path.join(
        os.path.abspath(working_dir),
        "unsplash",
        LEDGER_DIRNAME,
        f"{ledger_slug(filename)}.json",
    )


# --------------------------------------------------------------------------
# io
# --------------------------------------------------------------------------

def read_ledger(path: str, filename: str) -> dict:
    if not os.path.exists(path):
        return {"schema_version": SCHEMA_VERSION, "filename": filename, "events": []}
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError) as exc:
        raise LedgerError(f"ledger is unreadable and will not be repaired: {exc}")
    if not isinstance(data, dict):
        raise LedgerError("ledger root is not an object")
    if data.get("schema_version") != SCHEMA_VERSION:
        raise LedgerError("ledger schema_version is not supported")
    if data.get("filename") != filename:
        raise LedgerError(
            f"ledger belongs to {data.get('filename')!r}, not {filename!r}"
        )
    events = data.get("events")
    if not isinstance(events, list):
        raise LedgerError("ledger events is not a list")
    for event in events:
        if not isinstance(event, dict) or event.get("event") not in EVENT_TYPES:
            raise LedgerError("ledger contains an unrecognised event")
    return data


def write_ledger(path: str, data: dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    directory = os.path.dirname(path)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=directory, delete=False, suffix=".part"
    )
    try:
        json.dump(data, handle, indent=2)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
        handle.close()
        os.replace(handle.name, path)
    except BaseException:
        handle.close()
        if os.path.exists(handle.name):
            os.remove(handle.name)
        raise


# --------------------------------------------------------------------------
# derived state
# --------------------------------------------------------------------------

def summarise(data: dict) -> dict:
    """Fold the immutable event list into the current per-attempt picture."""
    attempts: dict[int, dict] = {}
    order: list[int] = []
    for event in data["events"]:
        kind = event["event"]
        number = event.get("attempt")
        if kind == "reserved":
            if number in attempts:
                raise LedgerError(f"attempt {number} was reserved twice")
            attempts[number] = {
                "attempt": number,
                "purpose": event.get("purpose"),
                "prompt": event.get("prompt"),
                "outcome": None,
                "fault": None,
                "staging_path": None,
                "review_rejected": False,
                "review_correctable": None,
                "review_fault": None,
                "state": "open",
            }
            order.append(number)
            continue
        if number not in attempts:
            raise LedgerError(f"{kind} event for unreserved attempt {number}")
        record = attempts[number]
        if kind == "generated_unreviewed":
            if record["state"] != "open":
                raise LedgerError(
                    f"generated_unreviewed event for attempt {number} in state "
                    f"{record['state']!r}"
                )
            staging_path = event.get("staging_path")
            if not isinstance(staging_path, str) or not staging_path.strip():
                raise LedgerError(
                    f"generated_unreviewed event for attempt {number} has no staging_path"
                )
            record["staging_path"] = staging_path
            record["state"] = "generated_unreviewed"
        elif kind == "completed":
            record["outcome"] = event.get("outcome")
            record["fault"] = event.get("fault")
            record["staging_path"] = event.get("staging_path")
            record["state"] = "completed"
        elif kind == "interrupted":
            record["state"] = "interrupted"
            record["outcome"] = None
        elif kind == "review_rejected":
            record["review_rejected"] = True
            record["review_correctable"] = event.get("correctable")
            record["review_fault"] = event.get("fault")

    numbers = sorted(attempts)
    if numbers and numbers != list(range(1, len(numbers) + 1)):
        raise LedgerError("attempt numbers are not contiguous from 1")

    open_attempt = next(
        (n for n in numbers if attempts[n]["state"] == "open"), None
    )
    effective_accepted = next(
        (
            n
            for n in reversed(numbers)
            if attempts[n]["outcome"] == "accepted"
            and not attempts[n]["review_rejected"]
        ),
        None,
    )
    return {
        "filename": data["filename"],
        "attempts": [attempts[n] for n in numbers],
        "attempts_used": len(numbers),
        "attempts_remaining": max(0, MAX_ATTEMPTS - len(numbers)),
        "open_attempt": open_attempt,
        "effective_accepted_attempt": effective_accepted,
    }


def next_legal_reservation(state: dict) -> tuple[int, tuple[str, ...], str | None]:
    """Return (attempt number, allowed purposes, refusal reason)."""
    used = state["attempts_used"]
    if state["open_attempt"] is not None:
        return (
            used + 1,
            (),
            f"attempt {state['open_attempt']} is still open — complete or interrupt it first",
        )
    if used == 0:
        return 1, ("initial",), None
    if used >= MAX_ATTEMPTS:
        return (
            used + 1,
            (),
            f"attempt budget exhausted: {used} of {MAX_ATTEMPTS} calls already consumed",
        )
    last = state["attempts"][-1]
    if last["state"] == "generated_unreviewed":
        return (
            used + 1,
            (),
            f"attempt {last['attempt']} has a generated image waiting for visual review; "
            "complete that review before reserving another call",
        )
    if last["state"] == "interrupted":
        return used + 1, ("recovery",), None
    if last["outcome"] == "near_miss":
        return used + 1, ("correction",), None
    if last["outcome"] == "provider_misdirection":
        return used + 1, ("retry",), None
    if last["outcome"] == "accepted":
        if last["review_rejected"] and last["review_correctable"] is True:
            return used + 1, ("correction",), None
        if last["review_rejected"]:
            return (
                used + 1,
                (),
                "reviewer rejected this attempt as not correctable — no further call is authorised",
            )
        return used + 1, (), "attempt is accepted and unrejected — no further call is needed"
    if last["outcome"] == "rejected":
        return (
            used + 1,
            (),
            "attempt was a fundamental miss — a second call is not automatically authorised",
        )
    return used + 1, (), "previous attempt is in an unrecognised state"


# --------------------------------------------------------------------------
# commands
# --------------------------------------------------------------------------

def cmd_status(args) -> dict:
    path = ledger_path(args.working_dir, args.filename)
    state = summarise(read_ledger(path, args.filename))
    attempt, purposes, refusal = next_legal_reservation(state)
    state["next_attempt"] = attempt if not refusal else None
    state["allowed_purposes"] = list(purposes)
    state["reserve_refusal"] = refusal
    state["ledger_path"] = path
    return state


def cmd_reserve(args) -> dict:
    if args.purpose not in PURPOSES:
        raise LedgerError(f"unknown purpose {args.purpose!r}")
    prompt = resolve_text(args.prompt, args.prompt_file, "prompt")
    if not prompt or not prompt.strip():
        raise LedgerError("a reservation requires the exact prompt text")
    path = ledger_path(args.working_dir, args.filename)
    data = read_ledger(path, args.filename)
    state = summarise(data)
    attempt, purposes, refusal = next_legal_reservation(state)
    if refusal:
        raise LedgerError(refusal)
    if attempt > MAX_ATTEMPTS:
        raise LedgerError(
            f"attempt {attempt} is never legal: the lifetime limit is {MAX_ATTEMPTS}"
        )
    if args.purpose not in purposes:
        raise LedgerError(
            f"purpose {args.purpose!r} is not legal here; allowed: {', '.join(purposes)}"
        )
    data["events"].append(
        {
            "event": "reserved",
            "attempt": attempt,
            "purpose": args.purpose,
            "prompt": prompt,
        }
    )
    write_ledger(path, data)
    return {"reserved_attempt": attempt, "purpose": args.purpose, "ledger_path": path}


def cmd_record_generated(args) -> dict:
    staging_path = os.path.abspath(args.staging_path)
    if not os.path.isfile(staging_path):
        raise LedgerError(
            f"cannot record generated output because staging_path is not a file: "
            f"{staging_path}"
        )
    path = ledger_path(args.working_dir, args.filename)
    data = read_ledger(path, args.filename)
    state = summarise(data)
    record = next(
        (a for a in state["attempts"] if a["attempt"] == args.attempt), None
    )
    if record is None:
        raise LedgerError(f"attempt {args.attempt} was never reserved")
    if record["state"] != "open":
        raise LedgerError(
            f"attempt {args.attempt} is already {record['state']} - history is immutable"
        )
    data["events"].append(
        {
            "event": "generated_unreviewed",
            "attempt": args.attempt,
            "staging_path": staging_path,
        }
    )
    write_ledger(path, data)
    return {
        "generated_unreviewed_attempt": args.attempt,
        "staging_path": staging_path,
    }


def cmd_complete(args) -> dict:
    if args.outcome not in COMPLETED_OUTCOMES:
        raise LedgerError(f"unknown outcome {args.outcome!r}")
    fault_text = resolve_text(args.fault, args.fault_file, "fault")
    fault = fault_text if (fault_text or "").strip() else None
    if args.outcome == "accepted" and fault:
        raise LedgerError("an accepted attempt must not carry a fault")
    if args.outcome in ("near_miss", "provider_misdirection", "rejected") and not fault:
        raise LedgerError(f"a {args.outcome} completion requires a visible fault")
    path = ledger_path(args.working_dir, args.filename)
    data = read_ledger(path, args.filename)
    state = summarise(data)
    record = next(
        (a for a in state["attempts"] if a["attempt"] == args.attempt), None
    )
    if record is None:
        raise LedgerError(f"attempt {args.attempt} was never reserved")
    if record["state"] not in ("open", "generated_unreviewed"):
        raise LedgerError(
            f"attempt {args.attempt} is already {record['state']} — history is immutable"
        )
    staging_path = args.staging_path or None
    if record["state"] == "generated_unreviewed":
        recorded_path = record["staging_path"]
        if args.staging_path and os.path.abspath(args.staging_path) != recorded_path:
            raise LedgerError(
                f"attempt {args.attempt} must complete the generated output already recorded "
                f"at {recorded_path}"
            )
        staging_path = recorded_path
    data["events"].append(
        {
            "event": "completed",
            "attempt": args.attempt,
            "outcome": args.outcome,
            "staging_path": staging_path,
            "fault": fault,
        }
    )
    write_ledger(path, data)
    return {"completed_attempt": args.attempt, "outcome": args.outcome}


def cmd_interrupt_open(args) -> dict:
    path = ledger_path(args.working_dir, args.filename)
    data = read_ledger(path, args.filename)
    state = summarise(data)
    open_attempt = state["open_attempt"]
    if open_attempt is None:
        return {"interrupted_attempt": None, "note": "no open reservation"}
    data["events"].append(
        {
            "event": "interrupted",
            "attempt": open_attempt,
            "reason": (args.reason or "host attempt ended before a usable image existed"),
        }
    )
    write_ledger(path, data)
    return {"interrupted_attempt": open_attempt}


def cmd_review_reject(args) -> dict:
    fault = resolve_text(args.fault, args.fault_file, "fault") or ""
    if not fault.strip():
        raise LedgerError("a review rejection requires the precise visible fault")
    if args.correctable not in ("yes", "no"):
        raise LedgerError("--correctable must be yes or no")
    path = ledger_path(args.working_dir, args.filename)
    data = read_ledger(path, args.filename)
    state = summarise(data)
    record = next(
        (a for a in state["attempts"] if a["attempt"] == args.attempt), None
    )
    if record is None:
        raise LedgerError(f"attempt {args.attempt} was never reserved")
    if record["outcome"] != "accepted":
        raise LedgerError(
            f"attempt {args.attempt} was never accepted, so it cannot be review-rejected"
        )
    if record["review_rejected"]:
        raise LedgerError(f"attempt {args.attempt} is already review-rejected")
    data["events"].append(
        {
            "event": "review_rejected",
            "attempt": args.attempt,
            "fault": fault,
            "correctable": args.correctable == "yes",
        }
    )
    write_ledger(path, data)
    return {
        "review_rejected_attempt": args.attempt,
        "correctable": args.correctable == "yes",
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    subparsers = parser.add_subparsers(dest="command", required=True)

    def common(sub):
        sub.add_argument("--working-dir", required=True)
        sub.add_argument("--filename", required=True)
        return sub

    common(subparsers.add_parser("status"))

    reserve = common(subparsers.add_parser("reserve"))
    reserve.add_argument("--purpose", required=True)
    reserve.add_argument("--prompt", help="short, plainly shell-safe prompt text")
    reserve.add_argument(
        "--prompt-file",
        help="file holding the exact prompt (preferred: arbitrary text never goes via the shell)",
    )

    generated = common(subparsers.add_parser("record-generated"))
    generated.add_argument("--attempt", required=True, type=int)
    generated.add_argument("--staging-path", required=True)

    complete = common(subparsers.add_parser("complete"))
    complete.add_argument("--attempt", required=True, type=int)
    complete.add_argument("--outcome", required=True)
    complete.add_argument("--staging-path")
    complete.add_argument("--fault")
    complete.add_argument("--fault-file", help="file holding the exact visible fault")

    interrupt = common(subparsers.add_parser("interrupt-open"))
    interrupt.add_argument("--reason")

    reject = common(subparsers.add_parser("review-reject"))
    reject.add_argument("--attempt", required=True, type=int)
    reject.add_argument("--fault", help="short, plainly shell-safe fault text")
    reject.add_argument("--fault-file", help="file holding the exact reviewer fault")
    reject.add_argument("--correctable", required=True)

    return parser


HANDLERS = {
    "status": cmd_status,
    "reserve": cmd_reserve,
    "record-generated": cmd_record_generated,
    "complete": cmd_complete,
    "interrupt-open": cmd_interrupt_open,
    "review-reject": cmd_review_reject,
}


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = HANDLERS[args.command](args)
    except LedgerError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        return 1
    result = {"ok": True, **result}
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
