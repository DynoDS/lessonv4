#!/usr/bin/env python3
"""Tracks progress through a Long Term Plan docx for the maths-plan auto-scheduling
routine. See docs/superpowers/specs/2026-07-04-maths-plan-filing-and-helpers-design.md.

Subcommands:
    import <docx_path> <lessons_json_path>
        One-time (or re-run) extraction of every real lesson row from the plan's
        table into a plain JSON list.
    next <lessons_json_path> <progress_json_path>
        Prints the next lesson to build, or a skip reason, as one JSON line.
    advance <progress_json_path> <index>
        Marks a lesson as built. Must be exactly built_up_to + 1.
    set-filed <progress_json_path> <lessons_json_path> <index>
        Advances the filed_up_to counter (idempotent max, never moves backwards).
        Called by the login helper as each lesson is filed.
    resync <docx_path> <lessons_json_path>
        Re-extracts from the docx and updates changed fields in place. Refuses
        (exit 1) if the lesson count no longer matches, since that would shift
        what every later index means.
    outbox-order <outbox_dir>
        Lists the contents of a lesson outbox folder, sorted by their numeric
        index, printing one line per folder as "<index>\t<folder>".
"""
import argparse, json, sys
import os, re


def find_lesson_table(doc):
    for table in doc.tables:
        header_cells = [c.text.strip().lower() for c in table.rows[0].cells]
        if any("lesson objective" in h for h in header_cells):
            return table
    raise ValueError("No table with a 'Lesson Objective' column found")


def extract_lessons_from_docx(docx_path):
    # python-docx is only needed here, for the `import` and `resync` commands
    # that read the Long Term Plan .docx. The scheduled cloud routine only calls
    # next/advance/set-filed/outbox-order, which never touch the docx, so importing
    # at call time rather than at module load keeps those commands working on a
    # fresh cloud box that has no python-docx installed (the sandbox starts empty).
    # If a docx command does run without the package, this fails with a clear hint
    # instead of a bare ModuleNotFoundError at startup.
    try:
        from docx import Document
    except ModuleNotFoundError:
        sys.exit("Reading the Long Term Plan .docx needs python-docx, which is not "
                 "installed. Install it with:  pip install python-docx")
    doc = Document(docx_path)
    table = find_lesson_table(doc)
    lessons = []
    last_unit = ""
    last_nc = ""
    index = 0
    for row in table.rows[1:]:
        cells = row.cells
        unit = cells[0].text.strip()
        nc = cells[1].text.strip()
        lo_cell = cells[2].text.strip()
        description = cells[3].text.strip()
        things = cells[4].text.strip()
        questions = cells[5].text.strip()
        stems = cells[6].text.strip()

        if unit:
            last_unit = unit
        if nc:
            last_nc = nc

        if not lo_cell.startswith("LO:"):
            continue

        lo = lo_cell[len("LO:"):].strip()
        sections = []
        if last_nc:
            sections.append(f"National Curriculum: {last_nc}")
        if description:
            sections.append(description)
        if things:
            sections.append(f"Things to look for (misconceptions):\n{things}")
        if questions:
            sections.append(f"Key questions:\n{questions}")
        if stems:
            sections.append(f"Sentence stems:\n{stems}")

        index += 1
        lessons.append({
            "index": index,
            "unit": last_unit,
            "lo": lo,
            "info": "\n\n".join(sections),
        })
    return lessons


def build_prior_context(lessons, next_index):
    """A ready-to-paste note on what the class has recently covered, so the
    lesson designer can shape a backward-connected starter. Scoped by unit,
    because a starter retrieves the schema today's lesson builds on and that
    schema lives in the lessons around it, not in the plan as a whole: the
    earlier lessons of the current unit when there are any, otherwise the unit
    just finished. The designer is told it may use this or instead retrieve a
    skill that builds toward today's objective, so a warm-up is never forced to
    look backwards when a forward-building one fits the lesson better.
    """
    # Group on the full unit string, but show only its first line: the plan's
    # unit cell sometimes carries a trailing "2 weeks" duration line that reads
    # as noise in the brief.
    def label(u):
        return (u.splitlines()[0].strip() if u else u)

    current = lessons[next_index - 1]
    unit = current.get("unit", "")
    prior = lessons[: next_index - 1]
    earlier_this_unit = [l for l in prior if l.get("unit") == unit]
    if earlier_this_unit:
        lines = "\n".join(f"  - {l['lo']}" for l in earlier_this_unit)
        return (
            f'Today\'s lesson is part of the unit "{label(unit)}". Earlier in this unit the '
            f"class has already covered, in order:\n{lines}\n\n"
            "Design the starter to retrieve what they have recently learned in this "
            "unit when that is the best warm-up for today's objective. You may instead "
            "retrieve a prerequisite skill that builds toward today's lesson if that "
            "serves the children better - use your judgement."
        )
    if not prior:
        return ""  # the very first lesson of the plan has nothing behind it
    prev_unit = prior[-1].get("unit", "")
    prev_unit_lessons = [l for l in prior if l.get("unit") == prev_unit]
    lines = "\n".join(f"  - {l['lo']}" for l in prev_unit_lessons)
    return (
        f'Today\'s lesson opens a new unit, "{label(unit)}". The class has just finished the '
        f'unit "{label(prev_unit)}", covering:\n{lines}\n\n'
        "Bridge from that unit in the starter if it helps, or retrieve a prerequisite "
        "skill that builds toward today's objective - use your judgement."
    )


def decide_next(lessons, progress):
    total = len(lessons)
    built_up_to = progress["built_up_to"]
    filed_up_to = progress["filed_up_to"]
    buffer = progress["buffer"]

    if built_up_to >= total:
        return {"status": "skip", "reason": "plan_complete"}
    if built_up_to - filed_up_to >= buffer:
        return {"status": "skip", "reason": "buffer_full"}

    next_index = built_up_to + 1
    lesson = lessons[next_index - 1]
    return {
        "status": "build",
        "index": lesson["index"],
        "unit": lesson["unit"],
        "lo": lesson["lo"],
        "info": lesson["info"],
        "prior_context": build_prior_context(lessons, next_index),
    }


def advance_built(progress, index):
    expected = progress["built_up_to"] + 1
    if index != expected:
        raise ValueError(f"expected to advance to lesson {expected}, got {index}")
    progress["built_up_to"] = index
    return progress


def set_filed(progress, index, total_lessons):
    if index < 0 or index > total_lessons:
        raise ValueError(f"index {index} out of range 0..{total_lessons}")
    progress["filed_up_to"] = max(progress["filed_up_to"], index)
    return progress


def parse_outbox_index(folder_name):
    m = re.match(r"^(\d+) - ", folder_name)
    if not m:
        raise ValueError(f"not an index-tagged lesson folder: {folder_name!r}")
    return int(m.group(1))


def outbox_order(outbox_dir):
    if not os.path.isdir(outbox_dir):
        return []
    entries = []
    for name in os.listdir(outbox_dir):
        if not os.path.isdir(os.path.join(outbox_dir, name)):
            continue
        try:
            entries.append({"index": parse_outbox_index(name), "folder": name})
        except ValueError:
            continue
    return sorted(entries, key=lambda e: e["index"])


def resync_lessons(docx_path, lessons_json_path):
    with open(lessons_json_path) as f:
        existing = json.load(f)
    fresh = extract_lessons_from_docx(docx_path)
    if len(fresh) != len(existing):
        return {"status": "mismatch", "existing_count": len(existing), "new_count": len(fresh)}
    changed = 0
    for old, new in zip(existing, fresh):
        if old["unit"] != new["unit"] or old["lo"] != new["lo"] or old["info"] != new["info"]:
            old["unit"], old["lo"], old["info"] = new["unit"], new["lo"], new["info"]
            changed += 1
    with open(lessons_json_path, "w") as f:
        json.dump(existing, f, indent=2)
    return {"status": "updated", "changed_count": changed}


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    p_import = sub.add_parser("import")
    p_import.add_argument("docx_path")
    p_import.add_argument("lessons_json_path")

    p_next = sub.add_parser("next")
    p_next.add_argument("lessons_json_path")
    p_next.add_argument("progress_json_path")

    p_advance = sub.add_parser("advance")
    p_advance.add_argument("progress_json_path")
    p_advance.add_argument("index", type=int)

    p_filed = sub.add_parser("set-filed")
    p_filed.add_argument("progress_json_path")
    p_filed.add_argument("lessons_json_path")
    p_filed.add_argument("index", type=int)

    p_resync = sub.add_parser("resync")
    p_resync.add_argument("docx_path")
    p_resync.add_argument("lessons_json_path")

    p_outbox = sub.add_parser("outbox-order")
    p_outbox.add_argument("outbox_dir")

    args = parser.parse_args()

    if args.command == "import":
        lessons = extract_lessons_from_docx(args.docx_path)
        with open(args.lessons_json_path, "w") as f:
            json.dump(lessons, f, indent=2)
        print(f"WROTE {len(lessons)} lessons to {args.lessons_json_path}")
    elif args.command == "next":
        with open(args.lessons_json_path) as f:
            lessons = json.load(f)
        with open(args.progress_json_path) as f:
            progress = json.load(f)
        print(json.dumps(decide_next(lessons, progress)))
    elif args.command == "advance":
        with open(args.progress_json_path) as f:
            progress = json.load(f)
        try:
            advance_built(progress, args.index)
        except ValueError as e:
            print(f"ERROR: {e}", file=sys.stderr)
            sys.exit(1)
        with open(args.progress_json_path, "w") as f:
            json.dump(progress, f, indent=2)
        print(f"built_up_to={progress['built_up_to']}")
    elif args.command == "set-filed":
        with open(args.lessons_json_path) as f:
            lessons = json.load(f)
        with open(args.progress_json_path) as f:
            progress = json.load(f)
        try:
            set_filed(progress, args.index, len(lessons))
        except ValueError as e:
            print(f"ERROR: {e}", file=sys.stderr)
            sys.exit(1)
        with open(args.progress_json_path, "w") as f:
            json.dump(progress, f, indent=2)
        print(f"filed_up_to={progress['filed_up_to']}")
    elif args.command == "resync":
        result = resync_lessons(args.docx_path, args.lessons_json_path)
        print(json.dumps(result))
        if result["status"] == "mismatch":
            sys.exit(1)
    elif args.command == "outbox-order":
        for entry in outbox_order(args.outbox_dir):
            print(f"{entry['index']}\t{entry['folder']}")


if __name__ == "__main__":
    main()
