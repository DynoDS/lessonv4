"""The subject-files release (topic 8, release 1), step 6: the earlier topics'
pins whose words this release changed follow them, in place, each with the
decision that changed it, as the worksheets release does
(`ws-change/w9_repin_other_topics.py`). The earlier topics' mapping builders
are not edited or rerun: a rerun would undo these moves.

Five pins named the two files his decisions 1 and 3 removed (AK-C03, SC-C15,
SC-C16, TD-A14, VOC-M15): each is retired, held by its file staying gone
(`fileRemoved`), because a pin whose file no longer exists cannot be read and
must not be left failing (change plan section 2). SC-G02 is PSHE's per-meal
quota rule, which his decision 6 took out of the PSHE file: retired, its
paragraph barred where it was. Three pins held words this release kept but
moved or undated: AK-B37 and TD-K09 (the dates beside his examples, settled item
10) and TD-A13 (the designer's reading list, which gained the start note,
settled item 12).

Written to run on a clean 2db3ceba tree after steps 1 to 5, and equally on the
tree the merge with the worksheets release (4.2.290) leaves: every change finds
its row by id and its pin by the old words, whatever else that release moved.
The decision is recorded in each pin's outcome here and in each topic's ledger
by `sj_07_record_in_ledgers.py`."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import ROOT, absent_everywhere, norm, paragraph_of, pin_of  # noqa: E402

print(f"plugin: {ROOT}")

LD = "agents/lesson-designer.md"
HISTORY = "references/subject-history.md"
PSHE = "references/subject-pshe.md"
SKILL = "skills/make-subject-file/SKILL.md"
GUIDE = "references/authoring-subject-files.md"

REMOVED = ("his decisions 1 and 3 of 24 September, \"forget about 'writing a new subject file' guidance. it "
           "should just knowe the files it has, nothing around what could be added in future.\" and \"is this "
           "a new skill called make subject file skill or something? just remove it completely.\"")
DIET = ("his decision 6 of 24 September, \"those balanced diet things sound like things I wouldnt want in the "
        "pshe subject files\" and \"maybe the subject file could say to look for guidance from eatwell guide "
        "thing\": the PSHE food section is one line pointing to the NHS Eatwell Guide; the general rule against "
        "an invented count in a criterion (SC-G01) stays where every lesson reads it")
DATES = ("the subject-files topic's settled item 10: the dates beside his examples go, every word of the "
         "examples stays (the log holds each date)")
START = ("the subject-files topic's settled item 12: the designer's subject-file reading line gains what "
         "history's and geography's word-for-word start notes carried (read before the structure is chosen "
         "because the routing is part of that choice; come back beside the teaching-sequence file; what each "
         "file is for), and the two notes go")
RELEASE = "the subject-files release (topic 8, release 1)"


def load(name):
    path = ROOT / "scripts" / "tests" / f"{name}_ledger_pins.json"
    return path, json.loads(path.read_text(encoding="utf-8"))


def save(path, data):
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def row_of(data, rid):
    hits = [r for r in data["rows"] if r["id"] == rid]
    assert len(hits) == 1, (rid, len(hits))
    return hits[0]


def note_on(row, note):
    if note in row["outcome"]:
        return
    row["outcome"] = (f"unchanged in place until {RELEASE}; then {note}" if row["outcome"] == "unchanged in place"
                      else row["outcome"] + f"; then {note}")


# Retired with their file: every present pin on the removed file becomes an
# absent pin held by the file staying gone.
for name, rid, rel in (
    ("assumed_knowledge", "AK-C03", SKILL),
    ("success_criteria", "SC-C15", GUIDE),
    ("success_criteria", "SC-C16", SKILL),
    ("teach_then_do", "TD-A14", SKILL),
    ("vocabulary", "VOC-M15", SKILL),
):
    assert not (ROOT / rel).exists(), f"{rel} is still there: run steps 1 to 5 first"
    path, data = load(name)
    row = row_of(data, rid)
    gone = [p for p in row["present"] if p["file"] == rel]
    assert gone and len(gone) == len(row["present"]), (rid, "a pin outside the removed file would be lost")
    row["present"] = []
    row["absent"] += [{"file": rel, "text": p["text"], "everywhere": False, "fileRemoved": True} for p in gone]
    row["outcome"] = (f"retired: removed with its file in {RELEASE}, {REMOVED}; unchanged in place until then")
    save(path, data)
    print("retired with its file", rid)

# SC-G02: the per-meal quota rule leaves the PSHE file (decision 6).
path, data = load("success_criteria")
row = row_of(data, "SC-G02")
old = [p for p in row["present"] if p["file"] == PSHE]
assert len(old) == 1 and old[0]["text"].startswith("**No invented per-meal quotas.**") and len(row["present"]) == 1
text = old[0]["text"]
assert text not in norm((ROOT / PSHE).read_text(encoding="utf-8"))
row["present"] = []
row["absent"].append({"file": PSHE, "text": text, "everywhere": absent_everywhere(text)})
row["outcome"] = f"retired in {RELEASE}, {DIET}; unchanged in place until then"
save(path, data)
print("retired SC-G02")

# Phrase pins that carry the same substitution the change made.
for name, rid, rel, before, after, note in (
    ("assumed_knowledge", "AK-B37", HISTORY,
     "The Teach boards of the Tudor lesson the user chose on 14 September 2026 (",
     "The Teach boards of the Tudor lesson the user chose (", DATES),
):
    path, data = load(name)
    row = row_of(data, rid)
    hits = [p for p in row["present"] if p["file"] == rel and norm(before) in p["text"]]
    assert len(hits) == 1, (rid, len(hits))
    at = row["present"].index(hits[0])
    row["present"][at] = pin_of(rel, hits[0]["text"].replace(norm(before), norm(after)))
    note_on(row, note)
    save(path, data)
    print("repinned phrase", rid)

# Whole-paragraph pins re-read from their paragraph.
for name, rid, rel, opening, before, note in (
    ("teach_then_do", "TD-K09", HISTORY, "The shape that produces this, in the order a child meets it,",
     "(4 September 2026)", DATES),
    ("teach_then_do", "TD-A13", LD, "- Read the introduction and contents of `preferences.md`, then",
     "- Read the one matching `subject-*.md` file when it exists, whole, with `--file` and every page. List", START),
):
    path, data = load(name)
    row = row_of(data, rid)
    hits = [p for p in row["present"] if p.get("paragraph") and p["file"] == rel and p["text"].startswith(norm(opening))]
    assert len(hits) == 1, (rid, len(hits))
    assert norm(before) in hits[0]["text"], (rid, "the pin no longer holds the old words")
    para = paragraph_of(rel, opening)
    assert para and para != hits[0]["text"] and norm(before) not in para, (rid, "paragraph not found or unchanged")
    row["present"][row["present"].index(hits[0])] = pin_of(rel, para)
    note_on(row, note)
    save(path, data)
    print("repinned paragraph", rid)

# Every pin moved here holds against the files as they now are.
for name in ("assumed_knowledge", "success_criteria", "teach_then_do", "vocabulary"):
    _path, data = load(name)
    for row in data["rows"]:
        for pin in row["present"]:
            text = norm((ROOT / pin["file"]).read_text(encoding="utf-8"))
            assert pin["text"] in text, (name, row["id"], pin["text"][:100])
        for pin in row["absent"]:
            if pin.get("fileRemoved"):
                assert not (ROOT / pin["file"]).exists(), (name, row["id"])
            else:
                assert pin["text"] not in norm((ROOT / pin["file"]).read_text(encoding="utf-8")), (name, row["id"])
print("REPIN_OK")
