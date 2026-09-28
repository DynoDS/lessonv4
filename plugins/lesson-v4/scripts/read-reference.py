#!/usr/bin/env python3
"""Read exact Markdown reference sections without loading neighbouring guidance.

Standard library only. Reads files and writes no run state; on Codex it keeps a
small record of recent reads in the system temp folder so it can refuse a read
that would be cut (see SAME_CALL_BUDGET_CHARS). Selection is mechanical:
lesson-design decisions and reading triggers remain in the existing role files.
"""
from __future__ import annotations

import argparse
import contextlib
import os
import re
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path


class ReferenceError(ValueError):
    """A requested source or unambiguous section is unavailable."""


@dataclass
class Heading:
    title: str
    path: tuple[str, ...]
    level: int
    start: int
    body: int
    end: int


HEADING = re.compile(r"^ {0,3}(#{1,6})[ \t]+(.+?)\s*$")
FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})(.*)$")
STRUCTURES = (
    "Skill-based", "Content-based", "Discovery / Inquiry",
    "Dialogic / Scenario-based (children form and justify positions through structured talk)",
    "Task-Centred",
)
STRUCTURES_HEADING = "9. Lesson Structures — When Each Is Evidence-Based"

# A page is what one tool call may print and still arrive whole. Codex caps
# each command's output at about 10,000 tokens and removes the MIDDLE of
# anything longer, marking the gap `…N tokens truncated…`, while the head and
# the tail still arrive, so a success line printed last looks like success.
# On 22 September 2026 a Year 4 history designer read its own role file whole
# and lost 26,616 of its 36,408 tokens on every pass, and two preferences
# sections it needed never reached any pass. 24,000 characters is about 7,000
# tokens of this guidance, which leaves room for the markdown's punctuation.
PAGE_CHARS = 24_000

# The limit is per tool call, not per read. A Codex model can run several reads
# inside one call (a code cell that awaits pages 2, 3 and 4 and prints them
# together), and the host then cuts the middle out of the joined output exactly
# as it would out of the whole file. On 27 September 2026 a lesson designer lost
# about 31,000 characters of its role file this way, a fifth of it, and carried
# on past the `truncated output` warning. So on Codex a read that shares a call
# with earlier reads, and would not arrive whole beside them, prints a short
# refusal instead of its page. The host marks every command it runs with
# CODEX_THREAD_ID; elsewhere (Claude Code saves a long output to a file rather
# than cutting it) nothing changes.
SAME_CALL_BUDGET_CHARS = 32_000
# Across 40,260 Codex commands in September 2026 the quickest a model issued its
# next command was 1.35 seconds after the previous result, and Codex's sandbox
# then takes about a second to start it; reads inside one call follow one another
# after that start-up alone. Measured in a sol designer run on 27 September:
# 0.99 and 1.05 seconds between reads in one cell, 4.4 to 6.3 between calls.
SAME_CALL_GAP_SECONDS = 2.0

# A role whose whole job is the words children hear reads the guidance that
# governs them as further pages of its own role read, so reading the role to the
# end is reading it. On 27 September 2026 a Codex lesson designer read every page
# of its role file, never opened the voice guide the file pointed to, and wrote a
# lesson in an adult register; the lesson voice editor now owns that wording, and
# its read cannot stop short of the voice.
ROLE_COMPANIONS: dict[str, tuple[tuple[str, tuple[str, ...]], ...]] = {
    "lesson-voice-editor": (
        ("teacher-voice.md", ()),
        ("preferences.md", (
            "Teacher Preferences > Written Voice (House Style) > Core rules",
            "Teacher Preferences > Written Voice (House Style) > Written Voice read-back",
            "Teacher Preferences > Pride Lessons (Quality Anchor) > What a Teach slide holds: the Tudor calibration",
            "Teacher Preferences > Pride Lessons (Quality Anchor) > A whole lesson at the right amount: the Shaftesbury calibration",
        )),
    ),
}


def headings(text: str) -> list[Heading]:
    """Find ATX headings outside fenced code; end at the next peer or ancestor."""
    found: list[Heading] = []
    active: list[Heading] = []
    fence: tuple[str, int] | None = None
    offset = 0
    for line in text.splitlines(keepends=True):
        raw = line.rstrip("\r\n")
        if offset == 0:
            raw = raw.lstrip("\ufeff")
        match = FENCE.match(raw)
        if fence is not None:
            if match and match[1][0] == fence[0] and len(match[1]) >= fence[1] and not match[2].strip():
                fence = None
        elif match and not (match[1][0] == "`" and "`" in match[2]):
            fence = (match[1][0], len(match[1]))
        elif match := HEADING.match(raw):
            level = len(match[1])
            title = re.sub(r"[ \t]+#+[ \t]*$", "", match[2]).strip()
            while active and active[-1].level >= level:
                active.pop().end = offset
            entry = Heading(title, tuple(h.title for h in active) + (title,),
                            level, offset, offset + len(line), len(text))
            found.append(entry)
            active.append(entry)
        offset += len(line)
    return found


def locate(text: str, selector: str) -> Heading:
    path = tuple(part.strip() for part in selector.split(" > "))
    if not all(path):
        raise ReferenceError("empty heading in selector")
    matches = [h for h in headings(text) if h.path[-len(path):] == path]
    if len(matches) != 1:
        reason = "missing" if not matches else "ambiguous"
        raise ReferenceError(f"{reason} heading: {selector}; use --index for exact paths")
    return matches[0]


def interval(text: str, selector: str) -> tuple[int, int]:
    if selector == "@intro":
        entries = headings(text)
        boundary = 1 if entries and entries[0].level == 1 and not text[:entries[0].start].strip() else 0
        return (0, entries[boundary].start if len(entries) > boundary else len(text))
    h = locate(text, selector)
    return h.start, h.end


def read_source(root: Path, name: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*\.md", name):
        raise ReferenceError(f"use a reference basename ending in .md, not a path: {name}")
    folder = (root / "references").resolve()
    path = folder / name
    if path.resolve().parent != folder:
        raise ReferenceError(f"reference escapes its directory: {name}")
    try:
        with path.open("r", encoding="utf-8", newline="") as handle:
            return handle.read()
    except (OSError, UnicodeError) as exc:
        raise ReferenceError(f"cannot read {name}: {exc}") from exc


def read_role(root: Path, name: str) -> str:
    """A role file from `agents/`, read whole so it can be paged."""
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", name):
        raise ReferenceError(f"use a role name such as lesson-designer, not a path: {name}")
    folder = (root / "agents").resolve()
    path = folder / f"{name}.md"
    if path.resolve().parent != folder:
        raise ReferenceError(f"role escapes its directory: {name}")
    try:
        with path.open("r", encoding="utf-8", newline="") as handle:
            return handle.read()
    except (OSError, UnicodeError) as exc:
        raise ReferenceError(f"cannot read role {name}: {exc}") from exc


def role_reading(root: Path, name: str) -> str:
    """The role file, then the guidance its first steps are written in, as one read."""
    parts = [read_role(root, name)]
    for source, selectors in ROLE_COMPANIONS.get(name, ()):
        if selectors:
            text, _ = selected_text(root, [f"{source}::{selector}" for selector in selectors])
        else:
            text = f"<!-- reference: {source} -->\n" + read_source(root, source)
        parts.append(
            f"<!-- companion reading for {name}: {source}. It is part of your instructions: "
            f"the words it governs are written from your first step. -->\n{text}"
        )
    return "\n\n".join(parts)


# Text a run or a plan hands a worker: its own review view, the design it builds
# from, the plan it was given. Office files and PDFs are extracted, not paged.
WORKING_FILE_SUFFIXES = (".md", ".json", ".txt")


def read_working_file(path: Path) -> str:
    """A run's own text file (review view, design JSON, plan), read whole so it can be paged."""
    if path.suffix.lower() not in WORKING_FILE_SUFFIXES:
        raise ReferenceError(f"--file reads a Markdown, JSON or text file: {path}")
    try:
        with path.open("r", encoding="utf-8", newline="") as handle:
            return handle.read()
    except (OSError, UnicodeError) as exc:
        raise ReferenceError(f"cannot read {path}: {exc}") from exc


def pages(text: str, limit: int = PAGE_CHARS) -> list[str]:
    """Split at paragraph breaks, then line breaks, so no page exceeds `limit`.

    A rule is a paragraph here, and a page that ends mid-paragraph hands the
    reader half a rule, so the cut goes between paragraphs whenever one fits.
    Joining the pages gives back the text exactly.
    """
    if len(text) <= limit:
        return [text]
    result: list[str] = []
    current = ""
    for block in re.split(r"(?<=\n\n)", text):
        pieces = [block]
        if len(block) > limit:
            pieces = re.split(r"(?<=\n)", block)
        for piece in pieces:
            while len(piece) > limit:
                if current:
                    result.append(current)
                    current = ""
                result.append(piece[:limit])
                piece = piece[limit:]
            if current and len(current) + len(piece) > limit:
                result.append(current)
                current = ""
            current += piece
    if current:
        result.append(current)
    return result


def merge_intervals(parts: list[tuple[int, int]]) -> list[tuple[int, int]]:
    merged: list[tuple[int, int]] = []
    for start, end in sorted(set(parts)):
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(end, merged[-1][1]))
        else:
            merged.append((start, end))
    return merged


def selected_text(root: Path, requests: list[str]) -> tuple[str, int]:
    """Resolve the entire request before emitting anything; deduplicate overlap.

    Files follow first-request order; sections within a file follow source order.
    Repeated words in different sections/files are not semantically deduplicated.
    """
    sources: dict[str, str] = {}
    ranges: dict[str, list[tuple[int, int]]] = {}
    for request in requests:
        name, sep, selector = request.partition("::")
        if not sep or not selector.strip():
            raise ReferenceError("use --select 'filename.md::Exact heading'")
        if name not in sources:
            sources[name] = read_source(root, name)
            ranges[name] = []
        ranges[name].append(interval(sources[name], selector.strip()))
    output: list[str] = []
    byte_count = 0
    for name, text in sources.items():
        for start, end in merge_intervals(ranges[name]):
            part = text[start:end]
            byte_count += len(part.encode("utf-8"))
            output.append(f"<!-- reference: {name} -->\n" + part)
    return "\n".join(output), byte_count


def structure_menu(text: str) -> tuple[str, int]:
    """Return the source's five use-when paragraphs, not five execution guides."""
    parent = locate(text, STRUCTURES_HEADING)
    children = [h for h in headings(text) if parent.start < h.start < parent.end and h.level == parent.level + 1]
    if tuple(h.title for h in children) != STRUCTURES:
        raise ReferenceError("structure menu changed: inspect evidence-synthesis.md before updating the selector")
    parts = [text[parent.start:children[0].start]]
    for child in children:
        body = text[child.body:child.end]
        paragraphs = re.findall(r"(?m)^\*\*Use when\.\*\*[^\r\n]*(?:\r?\n(?![ \t]*\r?$|#{1,6}[ \t]|\*\*)[^\r\n]+)*", body)
        if len(paragraphs) != 1:
            raise ReferenceError(f"expected exactly one Use when paragraph: {child.title}")
        parts.append(text[child.start:child.body] + paragraphs[0] + "\n")
    result = "\n".join(parts)
    return result, len(result.encode("utf-8"))


def _now() -> float:
    return time.time()


def same_call_log() -> Path | None:
    """This Codex session's record of recent reads, or None off Codex or where it cannot be kept."""
    thread = os.environ.get("CODEX_THREAD_ID", "").strip()
    if not thread:
        return None
    try:
        folder = Path(tempfile.gettempdir()) / "lesson-v4-reads"
        folder.mkdir(parents=True, exist_ok=True)
    except OSError:
        # A read-only sandbox has no temp folder at all (`No usable temporary
        # directory found`): it loses the guard, never the read.
        return None
    return folder / f"{re.sub(r'[^A-Za-z0-9_.-]', '_', thread)[:80]}.log"


@contextlib.contextmanager
def _locked(log: Path):
    """Serialise reads that start together; give up waiting rather than hang a run."""
    lock = log.with_name(log.name + ".lock")
    handle = None
    deadline = _now() + 5
    while handle is None:
        try:
            handle = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            try:
                if _now() - lock.stat().st_mtime > 10:
                    lock.unlink()
                    continue
            except OSError:
                pass
            if _now() > deadline:
                break
            time.sleep(0.02)
    try:
        yield handle is not None
    finally:
        if handle is not None:
            os.close(handle)
            with contextlib.suppress(OSError):
                lock.unlink()


def _entries(log: Path) -> list[list[float]]:
    try:
        rows = [line.split() for line in log.read_text(encoding="utf-8").splitlines()]
    except OSError:
        return []
    return [[float(v) for v in row] for row in rows if len(row) == 4]


def _write(log: Path, entries: list[list[float]]) -> None:
    log.write_text("".join(f"{s:.3f} {e:.3f} {n:.0f} {p:.0f}\n" for s, e, n, p in entries), encoding="utf-8")


def claim_read(log: Path, size: int) -> bool:
    """Record this read; False when it shares a call with reads it would not fit beside."""
    try:
        with _locked(log) as held:
            if not held:
                return True
            return _claim(log, size)
    except OSError:
        return True


def _claim(log: Path, size: int) -> bool:
    now = _now()
    # start, end (0 while printing), characters printed, process id
    entries = [e for e in _entries(log) if max(e[0], e[1]) > now - 60]
    # Reads still printing share this call. So does each finished read that
    # ended less than the gap before the call's earliest read so far: a cell
    # that reads pages one after another is one chain, however long.
    same_call = [e for e in entries if e[1] == 0 and now - e[0] < 30]
    earliest = min([now] + [e[0] for e in same_call])
    for entry in sorted((e for e in entries if e[1]), key=lambda e: e[1], reverse=True):
        if earliest - entry[1] >= SAME_CALL_GAP_SECONDS:
            break
        same_call.append(entry)
        earliest = min(earliest, entry[0])
    allowed = not same_call or sum(e[2] for e in same_call) + size <= SAME_CALL_BUDGET_CHARS
    entries.append([now, 0, size if allowed else 800, os.getpid()])
    _write(log, entries)
    return allowed


def finish_read(log: Path) -> None:
    try:
        with _locked(log) as held:
            if not held:
                return
            entries = _entries(log)
            for entry in entries:
                if entry[3] == os.getpid() and entry[1] == 0:
                    entry[1] = _now()
            _write(log, entries)
    except OSError:
        pass


def refusal(args: list[str]) -> str:
    return (
        "REFERENCE_READ_REFUSED: this read ran in the same command as another long read, and together they are "
        "longer than Codex will show. Codex keeps only about 40,000 characters of one command's output and cuts "
        "the middle out of the rest, so this page would have reached you with its middle missing. Nothing was "
        "read. Run the same read again as a command of its own, one page per command:\n"
        f"read-reference.py {' '.join(args)}"
    )


def main(argv: list[str] | None = None) -> int:
    raw_args = list(sys.argv[1:] if argv is None else argv)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plugin-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--select", action="append", metavar="FILE::HEADING")
    parser.add_argument("--index", metavar="FILE")
    # The menu is read at the same moment as the start-of-lesson sections, and
    # the instructions say to batch a moment's reads, so it joins a --select.
    parser.add_argument("--structure-menu", action="store_true")
    # A role file and a run's review view are read whole, so they are the reads
    # most likely to outgrow one page; both go through the same pager.
    parser.add_argument("--role", metavar="ROLE")
    parser.add_argument("--file", type=Path, metavar="PATH")
    parser.add_argument("--page", type=int, default=1, metavar="N")
    args = parser.parse_args(argv)
    whole = [flag for flag, value in (("--index", args.index), ("--role", args.role), ("--file", args.file)) if value]
    if len(whole) > 1 or (whole and (args.select or args.structure_menu)):
        parser.error(f"{whole[0]} is read on its own: run it without --select, --structure-menu or another whole-file flag")
    if not (whole or args.select or args.structure_menu):
        parser.error("one of --select, --index, --role, --file or --structure-menu is required")
    if args.page < 1:
        parser.error("--page counts from 1")
    # Configure before reading so even missing Unicode headings report safely.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    try:
        if args.index:
            source = read_source(args.plugin_root, args.index)
            output = "\n".join(" > ".join(h.path) for h in headings(source))
            size = 0
        elif args.role:
            output = role_reading(args.plugin_root, args.role)
            size = len(output.encode("utf-8"))
        elif args.file:
            output = read_working_file(args.file)
            size = len(output.encode("utf-8"))
        else:
            output, size = selected_text(args.plugin_root, args.select) if args.select else ("", 0)
            if args.structure_menu:
                menu, menu_size = structure_menu(read_source(args.plugin_root, "evidence-synthesis.md"))
                output = f"{output}\n<!-- structure menu: evidence-synthesis.md -->\n{menu}" if output else menu
                size += menu_size
        split = pages(output)
        if args.page > len(split):
            raise ReferenceError(f"--page {args.page} does not exist: this read has {len(split)} page(s)")
        text = split[args.page - 1]
        log = same_call_log()
        if log is not None and not claim_read(log, len(text)):
            try:
                print(refusal([a for a in raw_args if a != "--plugin-root" and a != str(args.plugin_root)]))
            finally:
                finish_read(log)
            return 3
        try:
            if len(split) > 1:
                print(f"<!-- page {args.page} of {len(split)} -->")
            print(text, end="" if text.endswith("\n") else "\n")
            if args.page < len(split):
                # No success line until the last page: a reader who stops here has
                # read part of the guidance, and the success line is what the
                # instructions tell it to require.
                print(
                    f"REFERENCE_READ_PARTIAL: page {args.page} of {len(split)}. Run the same command "
                    f"with --page {args.page + 1}, as a command of its own, and read every page before "
                    f"relying on this reading."
                )
                return 0
            done = f", page {args.page} of {len(split)}" if len(split) > 1 else ""
            print(f"REFERENCE_INDEX_OK{done}" if args.index else f"REFERENCE_READ_OK: {size} source bytes{done}")
            return 0
        finally:
            if log is not None:
                finish_read(log)
    except ReferenceError as exc:
        print(f"REFERENCE_READ_ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
