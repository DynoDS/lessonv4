"""The colours release (topic 7's 7C), step 18, run by the lead AFTER bringing it
into main on top of the worksheets (4.2.290) and subject-files (4.2.291)
releases. Two pins follow the merged words; no rule changes.

1. The build-log entry's heading now carries its version, " (4.2.292)", so every
   colours pin whose section is that entry names the numbered heading.
2. PF-R97 pins the templates.md helper table whole. The subject-files release
   added one sentence to that same paragraph (a Year 4 lesson shows a labelled
   photograph of a real circuit, symbols being Year 6 work), so the whole-paragraph
   pin takes the merged paragraph: the colours words it holds are unchanged, and
   the only difference is that sentence.

Each change is asserted: the old heading is found, and the new paragraph is the
old one with exactly that sentence inserted."""
import difflib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import ROOT  # noqa: E402

print(f"plugin: {ROOT}")
PINS = ROOT / "scripts" / "tests" / "colours_ledger_pins.json"
raw = PINS.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
data = json.loads(raw)

OLD_HEADING = ("## 2026-09-25 - Blue is a question or a short task, green a taught word or an "
               "answer, and a worked example is purple on the board, the sheet and the wall")
NEW_HEADING = OLD_HEADING + " (4.2.292)"
ADDED = (". Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 lesson "
         "shows a labelled photograph of a real circuit instead (`label-diagram` on the photograph).")

log = (ROOT / "references" / "build-review-log.md").read_text(encoding="utf-8")
assert log.count(NEW_HEADING + "\n") == 1


def flat(s: str) -> str:
    return " ".join(s.split())


tmpl = (ROOT / "references" / "templates.md").read_text(encoding="utf-8").replace("\r\n", "\n")
paras = [flat(p) for p in tmpl.split("\n\n")]

headings = 0
tables = 0


def walk(node):
    global headings, tables
    if isinstance(node, dict):
        sec = node.get("section")
        if isinstance(sec, dict) and sec.get("heading") == OLD_HEADING:
            sec["heading"] = NEW_HEADING
            headings += 1
        if node.get("file") == "references/templates.md" and isinstance(node.get("text"), str) \
                and node["text"] not in paras and "| `map` |" in node["text"]:
            old = node["text"]
            matches = [p for p in paras if p.replace(ADDED, "", 1) == old]
            assert len(matches) == 1, "the merged table is not the old one plus the added sentence"
            ops = [op for op in difflib.SequenceMatcher(None, old, matches[0], autojunk=False).get_opcodes()
                   if op[0] != "equal"]
            assert len(ops) == 1 and ops[0][0] == "insert", ops
            node["text"] = matches[0]
            tables += 1
        for v in node.values():
            walk(v)
    elif isinstance(node, list):
        for v in node:
            walk(v)


walk(data)
print(f"headings moved: {headings}; table pins moved: {tables}")
assert headings >= 1 and tables >= 1
out = json.dumps(data, ensure_ascii=False, indent=1) + "\n"
if crlf:
    out = out.replace("\n", "\r\n")
PINS.write_bytes(out.encode("utf-8"))
print("FOLLOW_OK")
