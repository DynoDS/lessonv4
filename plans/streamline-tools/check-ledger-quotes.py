"""Check a rule ledger's quotes against the plugin files.

Every «quoted» passage in a ledger row must exist, word for word, in the file
its Where column names (runs of whitespace are treated as one space, because
some files wrap a sentence across lines). The line a quote starts on is
compared with the row's stated L-number. Text outside the quotes is checked
for em and en dashes, which the teacher does not use.

    python -X utf8 check-ledger-quotes.py <ledger.md> [<plugin root>]
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

# Row IDs are a topic prefix, a group letter and two digits: VOC-A01, AK-B12.
ROW = re.compile(r"^\| ([A-Z]{2,5}-[A-Z]\d{2}) \|")
QUOTE = re.compile(r"«(.+?)»")
PATH = re.compile(r"`((?:agents|references|skills|commands|scripts|builder)/[^`]+)`")
LINE = re.compile(r"· L(\d+)")


def normalised(text: str) -> tuple[str, list[int]]:
    """Whitespace runs become one space; keep each character's source line."""
    out: list[str] = []
    lines: list[int] = []
    line = 1
    in_space = False
    for ch in text:
        if ch.isspace():
            if not in_space and out:
                out.append(" ")
                lines.append(line)
            in_space = True
        else:
            out.append(ch)
            lines.append(line)
            in_space = False
        if ch == "\n":
            line += 1
    return "".join(out), lines


def main() -> int:
    ledger = Path(sys.argv[1]).resolve()
    root = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else ledger.parent.parent / "plugins" / "lesson-v4"
    cache: dict[str, tuple[str, list[int]]] = {}
    faults: list[str] = []
    notes: list[str] = []
    ids: Counter[str] = Counter()
    kinds: Counter[str] = Counter()
    checked = 0

    for number, raw in enumerate(ledger.read_text(encoding="utf-8").splitlines(), 1):
        outside = QUOTE.sub("", raw)
        for dash in ("—", "–"):
            if dash in outside:
                faults.append(f"ledger L{number}: {'em' if dash == chr(0x2014) else 'en'} dash outside a quote")
        match = ROW.match(raw)
        if not match:
            continue
        row_id = match.group(1)
        quotes = QUOTE.findall(raw)
        path_match = PATH.search(QUOTE.sub("", raw))
        if not path_match:
            continue  # a summary table row that repeats a quote without a Where column
        ids[row_id] += 1
        cells = [c.strip() for c in QUOTE.sub("", raw).strip().strip("|").split("|")]
        if len(cells) >= 7:
            kinds[cells[6].split(";")[0].split(" (")[0].split(",")[0].strip()] += 1
        rel = path_match.group(1)
        target = root / rel
        if not target.exists():
            faults.append(f"{row_id}: file not found: {rel}")
            continue
        if rel not in cache:
            cache[rel] = normalised(target.read_text(encoding="utf-8"))
        text, line_of = cache[rel]
        stated = LINE.search(QUOTE.sub("", raw))
        for quote in quotes:
            wanted, _ = normalised(quote)
            wanted = wanted.strip()
            at = text.find(wanted)
            checked += 1
            if at < 0:
                faults.append(f"{row_id}: quote not found in {rel}: «{wanted[:90]}...»")
                continue
            if text.find(wanted, at + 1) >= 0:
                notes.append(f"{row_id}: quote occurs more than once in {rel}: «{wanted[:60]}...»")
            first_line = line_of[at]
            if stated and quote is quotes[0] and abs(int(stated.group(1)) - first_line) > 0:
                notes.append(f"{row_id}: stated L{stated.group(1)}, quote starts at L{first_line}")

    duplicates = [i for i, n in ids.items() if n > 1]
    for i in duplicates:
        faults.append(f"{i}: row ID used {ids[i]} times")

    print(f"rows checked: {sum(ids.values())}; quotes checked: {checked}")
    print("kinds:", ", ".join(f"{k} {n}" for k, n in kinds.most_common()))
    for note in notes:
        print("NOTE", note)
    for fault in faults:
        print("FAULT", fault)
    print("LEDGER_QUOTES_OK" if not faults else f"LEDGER_QUOTES_FAILED {len(faults)}")
    return 0 if not faults else 1


if __name__ == "__main__":
    sys.exit(main())
