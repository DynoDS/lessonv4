#!/usr/bin/env python3
"""Work through a long-term plan one lesson at a time, for any subject.

A scheduled run cannot read the teacher's plan document on their drive, and it
cannot remember where the last run got to. So each plan is imported once into
a folder of plain files, kept in the teacher's private letterbox repository
where every run can reach it:

    plans/<plan>/plan.json      year, subject, source document, how far ahead to build
    plans/<plan>/lessons.json   one entry per lesson, in teaching order
    plans/<plan>/built.json     the last lesson a run has built   (written by runs)
    plans/<plan>/filed.json     the last lesson saved to the drive (written by the
                                teacher's computer, or by a run that saves directly)

`built` and `filed` are separate files because different computers write them:
a cloud run advances one while the teacher's computer advances the other, and a
single shared file would let one overwrite the other's number.

Commands (all take --plans-dir, the folder holding `plans/`):
    import <docx> --plan <name> --year <n> --subject <subject> [--buffer <n>] [--start-after <n>]
    next --plan <name>               what to build now, or why nothing is due, as one JSON line
    advance --plan <name> --index <n>
    set-filed --plan <name> --index <n>
    move --plan <name> --to <n>      the teacher says lesson <n> is the last one done
    status                           every plan and where it is
    resync --plan <name> <docx>      refresh lesson text from an edited document
    open                             put a letterbox clone on the plans' branch, as GitHub has it
    publish --plan <name>            commit that plan's folder to the branch and push it

The next lesson is the one after the last built. Nothing is built while the
lessons built but not yet saved to the drive already reach the plan's buffer, so
a run never races ahead of the teacher, and a finished plan does nothing at all.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import python_extras  # noqa: F401,E402 - the plugin's own installed libraries

DAILY_SUBJECTS = {"maths", "mathematics", "english", "reading", "writing", "literacy", "numeracy", "spelling"}
PLAN_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class PlanError(ValueError):
    pass


# ---------------------------------------------------------------------- files

def plan_dir(plans_dir: Path, plan: str) -> Path:
    if not PLAN_NAME_RE.match(plan or ""):
        raise PlanError(f"plan names are lower-case words joined by hyphens, like year4-maths, not {plan!r}")
    return plans_dir / "plans" / plan


def read_json(path: Path, default=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        if default is not None:
            return default
        raise PlanError(f"missing {path}; is this plan imported, and are its files here?")
    except ValueError as exc:
        raise PlanError(f"{path} is not readable JSON ({exc})")


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def counter(path: Path) -> int:
    value = read_json(path, default={"up_to": 0})
    return int(value.get("up_to", 0))


def set_counter(path: Path, up_to: int, why: str) -> None:
    write_json(path, {"up_to": up_to, "updated": datetime.now(timezone.utc).isoformat(), "why": why})


def load(plans_dir: Path, plan: str) -> tuple[Path, dict, list[dict]]:
    folder = plan_dir(plans_dir, plan)
    meta = read_json(folder / "plan.json")
    lessons = read_json(folder / "lessons.json")
    if not isinstance(lessons, list) or not lessons:
        raise PlanError(f"{folder / 'lessons.json'} holds no lessons")
    return folder, meta, lessons


# --------------------------------------------------------------------- import

def _cell_text(cell) -> str:
    return cell.text.strip()


def extract_lessons(docx_path: Path) -> list[dict]:
    """Every lesson row of the plan's lesson table, whatever its other columns.

    The plans this was written against differ: maths has Unit, Description and a
    numbering column; the Kapow-derived geography and history plans have a
    lesson title column and unit rows that span the whole table. What they
    share is a Lesson Objective column whose lesson rows start `LO:`. Every other
    column is kept under its own heading, so nothing the plan says is lost and
    no subject's layout is assumed.
    """
    try:
        from docx import Document
    except ModuleNotFoundError:
        raise PlanError("reading a .docx plan needs python-docx; run check-setup.js --fix")
    try:
        document = Document(str(docx_path))
    except Exception as exc:  # python-docx raises its own types for a missing or damaged file
        raise PlanError(f"could not open {docx_path} as a Word document ({exc})")
    table = None
    for candidate in document.tables:
        headers = [_cell_text(c).lower() for c in candidate.rows[0].cells]
        if any("lesson objective" in h for h in headers):
            table = candidate
            break
    if table is None:
        raise PlanError(f"no table with a 'Lesson Objective' column in {docx_path.name}")

    headers = [_cell_text(c) for c in table.rows[0].cells]
    lo_col = next(i for i, h in enumerate(headers) if "lesson objective" in h.lower())
    unit_col = next((i for i, h in enumerate(headers) if h.strip().lower() == "unit"), None)
    skip_cols = {lo_col} | ({unit_col} if unit_col is not None else set())
    skip_cols |= {i for i, h in enumerate(headers) if h.strip() in {"#", "No", "No."}}

    lessons: list[dict] = []
    unit = ""
    carried: dict[int, str] = {}
    for row in table.rows[1:]:
        texts = [_cell_text(c) for c in row.cells]
        distinct = {t for t in texts if t}
        # A unit title merged across the whole row repeats in every cell.
        if len(distinct) == 1 and not texts[lo_col].startswith("LO:"):
            unit = distinct.pop()
            carried = {}
            continue
        if unit_col is not None and texts[unit_col]:
            if texts[unit_col] != unit:
                carried = {}
            unit = texts[unit_col]
        lo = texts[lo_col]
        if not lo.startswith("LO:"):
            continue
        sections = []
        for i, header in enumerate(headers):
            if i in skip_cols:
                continue
            value = texts[i] or ""
            # A statement written once for a run of rows applies to each of them.
            if header.lower().startswith("national curriculum"):
                value = value or carried.get(i, "")
                carried[i] = value
            if value:
                sections.append(f"{header}:\n{value}")
        lessons.append({
            "index": len(lessons) + 1,
            "unit": unit.splitlines()[0].strip() if unit else "",
            "lo": lo[len("LO:"):].strip(),
            "info": "\n\n".join(sections),
        })
    if not lessons:
        raise PlanError(f"no lesson rows (a Lesson Objective starting 'LO:') in {docx_path.name}")
    return lessons


def import_plan(plans_dir: Path, plan: str, docx: Path, year: int, subject: str, buffer: int | None,
                start_after: int) -> dict:
    folder = plan_dir(plans_dir, plan)
    lessons = extract_lessons(docx)
    if not 0 <= start_after <= len(lessons):
        raise PlanError(f"--start-after must be between 0 and {len(lessons)}")
    daily = subject.strip().lower() in DAILY_SUBJECTS
    meta = {
        "plan": plan,
        "year": year,
        "subject": subject.strip(),
        "source": docx.name,
        "lessons": len(lessons),
        # A daily subject is taught five times a week, a weekly one once, so the
        # same number of lessons ahead is a week for one and a half-term for the other.
        "buffer": buffer if buffer is not None else (5 if daily else 2),
        "imported": datetime.now(timezone.utc).isoformat(),
    }
    write_json(folder / "plan.json", meta)
    write_json(folder / "lessons.json", lessons)
    set_counter(folder / "built.json", start_after, "imported")
    set_counter(folder / "filed.json", start_after, "imported")
    return meta


# ----------------------------------------------------------------------- next

def prior_context(lessons: list[dict], index: int) -> str:
    """What the class covered just before, so the starter can connect back.

    Scoped to the unit, because a starter retrieves what today builds on and
    that sits in the lessons around it, not in the plan as a whole.
    """
    current = lessons[index - 1]
    prior = lessons[: index - 1]
    earlier = [l for l in prior if l.get("unit") == current.get("unit")]
    if earlier:
        lines = "\n".join(f"  - {l['lo']}" for l in earlier)
        return (
            f'Today\'s lesson is part of the unit "{current.get("unit")}". Earlier in this unit the class '
            f"has already covered, in order:\n{lines}\n\nRetrieve what they have recently learned when "
            "that is the best warm-up for today's objective, or a prerequisite that builds toward it."
        )
    if not prior:
        return ""
    previous_unit = prior[-1].get("unit")
    lines = "\n".join(f"  - {l['lo']}" for l in prior if l.get("unit") == previous_unit)
    return (
        f'Today\'s lesson opens a new unit, "{current.get("unit")}". The class has just finished '
        f'"{previous_unit}", covering:\n{lines}\n\nBridge from it if that helps, or retrieve a '
        "prerequisite that builds toward today's objective."
    )


def decide_next(folder: Path, meta: dict, lessons: list[dict]) -> dict:
    built = counter(folder / "built.json")
    filed = counter(folder / "filed.json")
    buffer = int(meta.get("buffer", 2))
    base = {"plan": meta["plan"], "year": meta["year"], "subject": meta["subject"],
            "built_up_to": built, "filed_up_to": filed, "buffer": buffer, "lessons": len(lessons)}
    if built >= len(lessons):
        return {**base, "status": "skip", "reason": "plan_complete"}
    if built - filed >= buffer:
        return {**base, "status": "skip", "reason": "buffer_full"}
    lesson = lessons[built]
    return {**base, "status": "build", "index": lesson["index"], "unit": lesson["unit"], "lo": lesson["lo"],
            "info": lesson["info"], "prior_context": prior_context(lessons, lesson["index"])}


def lesson_brief(decision: dict) -> str:
    """The plan row as the lesson designer reads a supplied lesson plan."""
    parts = [
        f"Year {decision['year']} {decision['subject']}, lesson {decision['index']} of {decision['lessons']} in the long-term plan.",
        f"Unit: {decision['unit']}" if decision.get("unit") else "",
        f"Learning objective: {decision['lo']}",
        decision.get("info", ""),
        f"What came before:\n{decision['prior_context']}" if decision.get("prior_context") else "",
    ]
    return "\n\n".join(p for p in parts if p) + "\n"


# ---------------------------------------------------------------- the letterbox

def git(clone: Path, *args: str, check: bool = True):
    import subprocess

    import plugin_settings

    result = subprocess.run(["git", *plugin_settings.letterbox_git_args(), "-C", str(clone), *args],
                            capture_output=True, text=True)
    if check and result.returncode != 0:
        raise PlanError(f"git {' '.join(args)} failed: {(result.stderr or result.stdout).strip()}")
    return result


def letterbox_branch() -> str:
    import os

    import plugin_settings

    return os.environ.get(plugin_settings.LETTERBOX_BRANCH_VARIABLE, "").strip() or plugin_settings.DEFAULT_LETTERBOX_BRANCH


def open_letterbox(clone: Path) -> str:
    """Put the letterbox clone on the branch the plans live on, exactly as GitHub has it."""
    if not (clone / ".git").exists():
        raise PlanError(f"{clone} is not a git clone of the letterbox")
    branch = letterbox_branch()
    if git(clone, "fetch", "-q", "origin", branch, check=False).returncode != 0:
        raise PlanError(f"the letterbox has no {branch} branch yet, so no plan has been imported into it")
    git(clone, "checkout", "-q", "-B", branch, f"origin/{branch}")
    git(clone, "reset", "-q", "--hard", f"origin/{branch}")
    return branch


def publish_plan(clone: Path, plan: str, message: str) -> str:
    """Commit this plan's folder to the letterbox branch and push it.

    The teacher's computer and cloud runs each change only their own counter
    file, so a push that meets someone else's newer commit rebases cleanly.
    """
    import os

    branch = letterbox_branch()
    folder = plan_dir(clone, plan).relative_to(clone)
    git(clone, "add", "--", str(folder))
    if not git(clone, "status", "--porcelain", "--", str(folder)).stdout.strip():
        return "nothing to publish"
    identity = []
    if not git(clone, "config", "user.email", check=False).stdout.strip():
        identity = ["-c", "user.name=Lesson resources", "-c", "user.email=lesson-resources@users.noreply.github.com"]
    git(clone, *identity, "commit", "-q", "-m", message)
    for _ in range(3):
        if git(clone, "push", "-q", "origin", f"HEAD:refs/heads/{branch}", check=False).returncode == 0:
            return f"published to {branch}"
        git(clone, "pull", "--rebase", "-q", "origin", branch, check=False)
    raise PlanError(f"the plan could not be pushed to {branch}")


# ----------------------------------------------------------------------- main

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Work through a long-term plan one lesson at a time.")
    parser.add_argument("--plans-dir", required=True, type=Path)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("import")
    p.add_argument("docx", type=Path)
    p.add_argument("--plan", required=True)
    p.add_argument("--year", required=True, type=lambda v: int(re.sub(r"\D", "", v)))
    p.add_argument("--subject", required=True)
    p.add_argument("--buffer", type=int)
    p.add_argument("--start-after", type=int, default=0)
    p = sub.add_parser("next")
    p.add_argument("--plan", required=True)
    p.add_argument("--brief", type=Path, help="also write the lesson brief to this file")
    for name in ("advance", "set-filed"):
        p = sub.add_parser(name)
        p.add_argument("--plan", required=True)
        p.add_argument("--index", required=True, type=int)
    p = sub.add_parser("move")
    p.add_argument("--plan", required=True)
    p.add_argument("--to", required=True, type=int)
    sub.add_parser("status")
    p = sub.add_parser("resync")
    p.add_argument("--plan", required=True)
    p.add_argument("docx", type=Path)
    sub.add_parser("open")
    p = sub.add_parser("publish")
    p.add_argument("--plan", required=True)
    p.add_argument("--message", default="")
    args = parser.parse_args(argv)
    plans_dir = args.plans_dir.resolve()

    try:
        if args.command == "import":
            meta = import_plan(plans_dir, args.plan, args.docx, args.year, args.subject, args.buffer, args.start_after)
            print(f"PLAN_IMPORTED: {meta['plan']}, {meta['lessons']} lessons, building up to {meta['buffer']} ahead, "
                  f"next lesson {args.start_after + 1}")
        elif args.command == "next":
            folder, meta, lessons = load(plans_dir, args.plan)
            decision = decide_next(folder, meta, lessons)
            if args.brief and decision["status"] == "build":
                args.brief.parent.mkdir(parents=True, exist_ok=True)
                args.brief.write_text(lesson_brief(decision), encoding="utf-8")
            print(json.dumps(decision, ensure_ascii=False))
        elif args.command == "advance":
            folder, meta, lessons = load(plans_dir, args.plan)
            built = counter(folder / "built.json")
            # Only the next lesson can be marked built, so a repeated or stale
            # run can never skip a lesson or count one twice.
            if args.index != built + 1:
                raise PlanError(f"the next lesson to mark built is {built + 1}, not {args.index}")
            set_counter(folder / "built.json", args.index, "built by a run")
            print(f"PLAN_BUILT_UP_TO={args.index}")
        elif args.command == "set-filed":
            folder, meta, lessons = load(plans_dir, args.plan)
            if not 0 <= args.index <= len(lessons):
                raise PlanError(f"lesson {args.index} is not in this plan of {len(lessons)}")
            # Never backwards: lessons can be saved out of order, and the counter
            # says how far saving has reached.
            filed = max(counter(folder / "filed.json"), args.index)
            set_counter(folder / "filed.json", filed, "saved to the drive")
            print(f"PLAN_FILED_UP_TO={filed}")
        elif args.command == "move":
            folder, meta, lessons = load(plans_dir, args.plan)
            if not 0 <= args.to <= len(lessons):
                raise PlanError(f"lesson {args.to} is not in this plan of {len(lessons)}")
            set_counter(folder / "built.json", args.to, "moved by the teacher")
            set_counter(folder / "filed.json", args.to, "moved by the teacher")
            upcoming = lessons[args.to]["lo"] if args.to < len(lessons) else "nothing: the plan is finished"
            print(f"PLAN_MOVED: {args.plan} now builds lesson {args.to + 1} next ({upcoming})")
        elif args.command == "status":
            root = plans_dir / "plans"
            for folder in sorted(p for p in root.iterdir() if p.is_dir()) if root.is_dir() else []:
                meta = read_json(folder / "plan.json")
                lessons = read_json(folder / "lessons.json")
                decision = decide_next(folder, meta, lessons)
                upcoming = decision.get("lo") or decision.get("reason")
                print(f"PLAN: {meta['plan']} | Year {meta['year']} {meta['subject']} | built {decision['built_up_to']} "
                      f"| saved {decision['filed_up_to']} | of {len(lessons)} | ahead limit {decision['buffer']} | next: {upcoming}")
        elif args.command == "open":
            print(f"PLANS_OPEN: {plans_dir} on {open_letterbox(plans_dir)}")
        elif args.command == "publish":
            outcome = publish_plan(plans_dir, args.plan, args.message or f"Update plan {args.plan}")
            print(f"PLAN_PUBLISHED: {args.plan}, {outcome}")
        elif args.command == "resync":
            folder, meta, lessons = load(plans_dir, args.plan)
            fresh = extract_lessons(args.docx)
            if len(fresh) != len(lessons):
                raise PlanError(
                    f"the document now has {len(fresh)} lessons, not {len(lessons)}, which would shift what every "
                    "later lesson number means; import it again and move the plan to the right lesson instead"
                )
            write_json(folder / "lessons.json", fresh)
            print(f"PLAN_RESYNCED: {args.plan}")
    except PlanError as exc:
        print(f"PLAN_ERROR: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
