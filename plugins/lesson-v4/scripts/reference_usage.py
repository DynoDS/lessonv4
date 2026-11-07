"""Local receipts for guidance emitted by read-reference.py, shared by both hosts.

No lesson text is stored. A receipt cannot prove host delivery, understanding,
application, or that a conditional reading opportunity occurred.
"""
from __future__ import annotations

import argparse
from contextlib import closing
import hashlib
import importlib.util
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

from plugin_settings import plugin_home


def database_path() -> Path:
    override = os.environ.get("LESSON_REFERENCE_USAGE_DB", "").strip()
    if override:
        return Path(override).expanduser()
    return plugin_home() / "reference-usage.sqlite3"


def digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def section_ranges(source, heading_parser, depth=6):
    hs = heading_parser(source)
    boundary = 1 if hs and hs[0].level == 1 and not source[:hs[0].start].strip() else 0
    intro_end = hs[boundary].start if len(hs) > boundary else len(source)
    return [("@intro", 0, intro_end)] + [
        (" > ".join(h.path), h.start, h.end) for h in hs if h.level <= depth]


def page_sections(output, split, page, sources, heading_parser):
    """Intersect exact source fragments with this page, excluding added wrappers.

    A parent selection includes descendants; the structure menu includes only
    its source headings and Use-when paragraphs, never full execution sections.
    Offsets are Python characters, not bytes, consistently throughout.
    """
    lo = sum(len(p) for p in split[:page - 1])
    hi = lo + len(split[page - 1])
    cursor = 0
    entries = {}
    for file, source, start, fragment in sources:
        if not fragment:
            continue
        at = output.find(fragment, cursor)
        if at < 0:
            raise ValueError(f"cannot map emitted source: {file}")
        cursor = at + len(fragment)
        left, right = max(at, lo), min(cursor, hi)
        if left >= right:
            continue
        source_lo, source_hi = start + left - at, start + right - at
        for section, begin, end in section_ranges(source, heading_parser):
            a, b = max(source_lo, begin), min(source_hi, end)
            if a >= b:
                continue
            key = (file, section, digest(source[begin:end]))
            row = entries.setdefault(key, {"file": file, "section": section,
                "sha256": key[2], "length": end - begin, "ranges": []})
            row["ranges"].append([a - begin, b - begin])
    return list(entries.values())


def append_receipt(path: Path, receipt: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # SQLite serialises concurrent Claude/Codex workers without a shared
    # read/modify/write file or stale application lock.
    with closing(sqlite3.connect(path, timeout=5)) as db, db:
        db.execute("CREATE TABLE IF NOT EXISTS receipts (id INTEGER PRIMARY KEY, timestamp TEXT NOT NULL, data TEXT NOT NULL)")
        db.execute("INSERT INTO receipts(timestamp, data) VALUES (?, ?)",
                   (receipt["timestamp"], json.dumps(receipt, ensure_ascii=False)))


def record_page(args, output, split, sources, heading_parser):
    try:
        sections = page_sections(output, split, args.page, sources, heading_parser)
        if not sections:
            return
        root = args.plugin_root
        try:
            version = json.loads((root / ".claude-plugin/plugin.json").read_text(encoding="utf-8"))["version"]
        except (OSError, ValueError, KeyError):
            version = "unknown"
        host = args.host or ("codex" if os.environ.get("CODEX_THREAD_ID")
                             else "claude" if os.environ.get("CLAUDECODE") == "1" else "unknown")
        session = (os.environ.get("CODEX_THREAD_ID", "") if host == "codex"
                   else os.environ.get("CLAUDE_SESSION_ID", "") if host == "claude" else "")
        append_receipt(database_path(), {
            "schema": 1, "status": "emitted",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "host": host, "session": session or None,
            "role": args.reader_role or args.role or "unknown",
            "lesson": args.lesson_id or str(Path.cwd()),
            "plugin_version": version,
            "reading_sha256": digest(output), "page": args.page, "pages": len(split),
            "sections": sections,
        })
    except (OSError, sqlite3.Error, ValueError) as exc:
        # Losing measurement must be visible, but must never lose the lesson.
        print(f"REFERENCE_USAGE_UNAVAILABLE: {exc}", file=sys.stderr)


def read_receipts(path: Path, since: str | None = None) -> list[dict]:
    if not path.exists():
        return []
    # Reporting is read-only; it must not create a database at a mistyped path.
    with closing(sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)) as db:
        query = "SELECT data FROM receipts"
        params = ()
        if since:
            query += " WHERE timestamp >= ?"
            params = (since,)
        return [json.loads(row[0]) for row in db.execute(query, params)]


def merged_length(ranges):
    end = total = 0
    for a, b in sorted(ranges):
        total += max(0, b - max(a, end))
        end = max(end, b)
    return total


def report(root: Path, receipts: list[dict], heading_parser, file=None, depth=2):
    observed = {}
    for receipt in receipts:
        for row in receipt["sections"]:
            key = (row["file"], row["section"])
            value = observed.setdefault(key, {"last_emitted": "", "hosts": set(),
                "roles": set(), "lessons": set(), "versions": {}})
            value["last_emitted"] = max(value["last_emitted"], receipt["timestamp"])
            value["hosts"].add(receipt["host"])
            value["roles"].add(receipt["role"])
            value["lessons"].add(receipt["lesson"])
            value["versions"].setdefault(row["sha256"], []).extend(row["ranges"])
    result = []
    for folder in ("references", "agents"):
        for p in sorted((root / folder).glob("*.md")):
            relative = p.relative_to(root).as_posix()
            if file and file not in (p.name, relative):
                continue
            with p.open(encoding="utf-8", newline="") as handle:
                source = handle.read()
            for name, a, b in section_ranges(source, heading_parser, depth):
                if a == b:
                    continue
                value = observed.get((relative, name))
                spans = value["versions"].get(digest(source[a:b]), []) if value else []
                length = merged_length(spans)
                result.append({"file": relative, "section": name,
                    "last_emitted": value["last_emitted"] if value else None,
                    "hosts": sorted(value["hosts"]) if value else [],
                    "roles": sorted(value["roles"]) if value else [],
                    "lesson_contexts": len(value["lessons"]) if value else 0,
                    "current_text_coverage_percent": round(100 * length / (b-a), 1),
                    "coverage": "full" if length == b-a else "partial" if length else "different-text" if value else "unobserved"})
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description="Report section text emitted by Lesson v4 on Claude and Codex; not proof of reading or application.")
    parser.add_argument("--database", type=Path, default=database_path())
    parser.add_argument("--plugin-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--file", help="Reference/agent basename or package-relative path")
    parser.add_argument("--depth", type=int, choices=range(1, 7), default=2)
    parser.add_argument("--since", type=lambda s: datetime.strptime(s, "%Y-%m-%d").date().isoformat())
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    try:
        spec = importlib.util.spec_from_file_location("usage_section_reader", Path(__file__).with_name("read-reference.py"))
        reader = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = reader
        spec.loader.exec_module(reader)
        receipts = read_receipts(args.database, args.since)
        rows = report(args.plugin_root, receipts, reader.headings, args.file, args.depth)
        if args.json:
            print(json.dumps({"database": str(args.database), "receipts": len(receipts), "sections": rows}, ensure_ascii=False, indent=2))
        else:
            print(f"Emitted guidance only; cumulative coverage is not proof of one agent reading a section.\nDatabase: {args.database}\nReceipts: {len(receipts)}. Unobserved does not mean unnecessary.")
            print("Last emitted | Current text coverage | Hosts | Roles | Lesson contexts | Section")
            for row in rows:
                date = row["last_emitted"][:10] if row["last_emitted"] else "unobserved"
                print(f"{date} | {row['coverage']} {row['current_text_coverage_percent']}% | {','.join(row['hosts']) or '-'} | {','.join(row['roles']) or '-'} | {row['lesson_contexts']} | {row['file']} :: {row['section']}")
        return 0
    except (OSError, sqlite3.Error, ValueError) as exc:
        print(f"REFERENCE_USAGE_ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    import utf8_output
    utf8_output.enable()
    raise SystemExit(main())
