"""Build a topic's mapping and pin list from its ledger (the general form of
`vocabulary-example/build_mapping.py`).

For every ledger row: a row whose quotes are all still in its file is pinned by
those quotes where they now sit. A row that changed is mapped by hand, in the
topic's own script, to its new home, the words that now carry it and the
decision that changed it; a retired phrase is pinned as absent. Every phrase is
checked against the files before anything is written, so a mapping cannot
claim a home that does not exist.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"
HEADING = re.compile(r"^(#{1,6}) ")
Q = re.compile(r"«(.+?)»")
P = re.compile(r"`((?:agents|references|skills|commands|scripts|builder)/[^`]+)`")


def norm(text: str) -> str:
    return " ".join(text.split())


_texts: dict[str, str] = {}


def text_of(rel: str) -> str:
    if rel not in _texts:
        _texts[rel] = norm((ROOT / rel).read_text(encoding="utf-8"))
    return _texts[rel]


def sections_of(rel: str):
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    heads = []
    fence = False
    for i, line in enumerate(lines):
        if line.lstrip().startswith("```"):
            fence = not fence
            continue
        m = HEADING.match(line)
        if m and not fence:
            heads.append((i, len(m.group(1)), line.rstrip()))
    out = []
    seen: dict[str, int] = {}
    for n, (i, level, line) in enumerate(heads):
        end = next((j for j, lv, _ in heads[n + 1:] if lv <= level), len(lines))
        occurrence = seen.get(line, 0)
        seen[line] = occurrence + 1
        out.append((line, occurrence, level, norm("\n".join(lines[i:end]))))
    return out


def home_of(rel: str, phrase: str):
    if not rel.endswith(".md"):
        return None
    best = None
    for line, occurrence, level, text in sections_of(rel):
        if norm(phrase) in text and (best is None or level >= best[2]):
            best = (line, occurrence, level)
    if best is None:
        return None
    return {"heading": best[0], "occurrence": best[1], "intro": best[2] == 1}


def paragraph_of(rel: str, phrase: str) -> str | None:
    raw = (ROOT / rel).read_text(encoding="utf-8").replace("\r\n", "\n")
    for para in raw.split("\n\n"):
        if norm(phrase) in norm(para):
            return norm(para)
    return None


RUNTIME = [q for folder in ("agents", "references", "skills", "commands")
           for q in (ROOT / folder).rglob("*.md") if q.name != "build-review-log.md"]


def absent_everywhere(phrase: str) -> bool:
    return all(norm(phrase) not in norm(q.read_text(encoding="utf-8")) for q in RUNTIME)


REVIEW_LINE = "## Output Format Block"


def above_review_line(rel: str, phrase: str) -> bool:
    """True when a route file's phrase sits above the line the reviewer stops
    reading at. A pin names its section by heading, so a whole section moved
    below the line would carry its pins with it; this records where it was."""
    if not rel.startswith("references/teaching-sequence-"):
        return False
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    if REVIEW_LINE not in lines:
        return False
    return norm(phrase) in norm(" ".join(lines[:lines.index(REVIEW_LINE)]))


def pin_of(f: str, x: str, **extra) -> dict:
    pin = {"file": f, "text": norm(x), "section": home_of(f, x)}
    # A pin that is a whole paragraph must stay exactly that paragraph:
    # words added inside it, a label in front of it or a fence round it fail.
    if f.endswith(".md") and not f.endswith("build-review-log.md") and paragraph_of(f, x) == norm(x):
        pin["paragraph"] = True
    if above_review_line(f, x):
        pin["aboveReviewLine"] = True
    pin.update(extra)
    return pin


def home_paragraphs(rel: str, heading: str) -> list[str]:
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next(i for i in range(start + 1, len(lines))
               if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level)
    return [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]


def build(*, ledger: str, prefix: str, changed: dict, added: list, homes: list, pins: str,
          mapping: str, title: str, snapshot: str, intro: list[str]) -> None:
    ledger_path = REPO / "plans" / ledger
    rows = []
    for raw in ledger_path.read_text(encoding="utf-8").splitlines():
        m = re.match(rf"^\| ({prefix}-[A-Z]\d{{2}}) \|", raw)
        if not m:
            continue
        p = P.search(Q.sub("", raw))
        if not p:
            continue
        rows.append((m.group(1), p.group(1), Q.findall(raw)))
    unknown = sorted(set(changed) - {rid for rid, _r, _q in rows})
    assert not unknown, f"mapped rows the ledger does not have: {unknown}"

    out = []
    problems = []
    for rid, rel, quotes in rows:
        if rid in changed:
            outcome, present, absent = changed[rid]
        else:
            outcome, present, absent = "unchanged in place", [(rel, q) for q in quotes], []
        for f, phrase in present:
            if norm(phrase) not in text_of(f):
                problems.append(f"{rid}: not found in {f}: {phrase[:90]}")
        for f, phrase, *_scope in absent:
            if norm(phrase) in text_of(f):
                problems.append(f"{rid}: still present in {f}: {phrase[:90]}")
        present_pins = [pin_of(f, x) for f, x in present]
        if rid in changed:
            for f, x in present:
                para = paragraph_of(f, x) if f.endswith(".md") and not f.endswith("build-review-log.md") else None
                if para and para != norm(x) and all(para != q["text"] for q in present_pins):
                    present_pins.append(pin_of(f, para, paragraph=True))
        out.append({"id": rid, "outcome": outcome, "present": present_pins,
                    "absent": [{"file": a[0], "text": norm(a[1]),
                                "everywhere": (len(a) < 3 or a[2] != "local") and absent_everywhere(a[1])}
                               for a in absent]})
    for rid, outcome, present in added:
        for f, phrase in present:
            if norm(phrase) not in text_of(f):
                problems.append(f"{rid}: not found in {f}: {phrase[:90]}")
        out.append({"id": rid, "outcome": outcome,
                    "present": [pin_of(f, x) for f, x in present],
                    "absent": []})

    home_records = []
    for rel, heading, tag in homes:
        paragraphs = home_paragraphs(rel, heading)
        for n, para in enumerate(paragraphs, 1):
            out.append({"id": f"{tag}-{n:02d}", "outcome": f"a paragraph of {rel} {heading}, pinned whole",
                        "present": [{"file": rel, "text": para,
                                     "section": {"heading": heading, "occurrence": 0, "intro": False}}],
                        "absent": []})
        home_records.append({"file": rel, "heading": heading, "paragraphs": paragraphs})

    unmapped = [rid for rid, rel, quotes in rows if rid not in changed and any(norm(q) not in text_of(rel) for q in quotes)]
    problems += [f"{rid}: changed but not mapped" for rid in unmapped]
    if problems:
        print("\n".join(problems))
        raise SystemExit(f"MAPPING_FAILED {len(problems)}")

    (ROOT / pins).write_text(json.dumps({"ledger": f"plans/{ledger}", "snapshot": snapshot,
                                         "ledgerIds": [rid for rid, _rel, _quotes in rows],
                                         "homes": home_records, "rows": out},
                                        indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [f"# {title}", ""] + intro + [
        "",
        f"{sum(1 for p in out if p['outcome'] == 'unchanged in place')} rows unchanged in place; "
        f"{len(changed)} rows changed, moved, folded or retired; {len(added)} decisions added new words.", ""]
    for p in out:
        if p["outcome"] == "unchanged in place" or p["id"].startswith("HOME-"):
            continue
        lines += [f"## {p['id']}", "", f"**What happened:** {p['outcome']}."]
        lines += [f"- Now in `{i['file']}`: «{i['text']}»" for i in p["present"]]
        lines += [f"- Gone from `{i['file']}`: «{i['text']}»" for i in p["absent"]]
        lines.append("")
    lines += ["## Unchanged in place", "",
              ", ".join(p["id"] for p in out if p["outcome"] == "unchanged in place"), "",
              "## The homes, pinned paragraph by paragraph", ""]
    for rec in home_records:
        lines.append(f"- `{rec['file']}` {rec['heading']}: {len(rec['paragraphs'])} paragraphs, each inside its own section, in this order.")
    (REPO / "plans" / mapping).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"MAPPING_OK {len(out)} pins; {len(changed)} changed rows mapped")
