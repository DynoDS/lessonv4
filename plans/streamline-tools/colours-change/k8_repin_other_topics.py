"""The colours release, step 8: the earlier topics' pins whose words this release
changed follow them, each with the decision that changed it, as the worksheets
release did (`ws-change/w9_repin_other_topics.py`, in the main checkout).

Only the success-criteria pins move; the vocabulary, assumed-knowledge, rhythm
and quick-check pins hold every word this release touched.

- SC-J11 and SC-J12 hold "success-criteria body text is black". Preferences'
  copy (J11) folded into the visual profile with the rest of the blue rule, and
  the profile's sentence (J12) now ends on the longer instruction: both pin the
  profile's sentence.
- SC-O15 pins the wall's anti-pattern table whole; its sticky-panel row now
  gives the card's shape, not its colour, as what says "fact".
- SC-O28 held the wall's green worked-example panel; it is purple now.
- SC-O23 pins the wall section's field table whole; it gains the part's
  `worked` field, which prints a worked part's result purple.

The earlier topics' mapping builders are not edited here. On the merged tree
they are frozen (a rerun would undo moves like these); this script edits the
pin file in place and finds each pin by its old words, so it can be replayed on
a merged tree too.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import ROOT, norm, paragraph_of, pin_of  # noqa: E402

PREF = "references/preferences.md"
PROFILE = "references/teacher-slide-visual-profile.md"
WALL_VL = "references/working-wall-visual-language.md"
WALL_CC = "references/working-wall-card-contracts.md"

print(f"repinning in {ROOT}")

DECISION_11 = ("the rest-of-preferences ledger's decision 11 and the topic 7 plan's question 1 "
               "(the colours release, 24 September 2026), his words \"I want blue means question or "
               "like a short task\" and \"yes\": a question or a short task is blue, a longer instruction "
               "about how to go about it stays black")
FOLD = ("; preferences' three blue paragraphs folded into the visual profile, which owns the grammar "
        "(the change plan's homes table), so this row is held by the profile's sentence")
DECISION_22 = ("the rest-of-preferences ledger's decisions 11 and 22 (the colours release, 24 September "
               "2026), \"worked example purple too\" and the wall \"uses the board's colour meanings\": "
               "a worked-example card is purple, sharing the sticky fact's colour, so the card's shape "
               "(numbered steps, or one sentence) says method or fact")

BLACK_OLD = ("- Black carries everything else the board says: teacher explanation, supporting prose, "
             "statements, takeaways, success-criteria body text, reminder body text, and the instructions "
             "children act on.")
BLACK_NEW = ("- Black carries everything else the board says: teacher explanation, supporting prose, "
             "statements, takeaways, success-criteria body text, reminder body text, and a longer "
             "instruction about how to go about the task.")
J11_OLD = ("Everything else on the slide is black - ordinary teacher explanation, statements, takeaways, "
           "success-criteria body text, reminder body text, and the instructions children act on.")

O28 = [
    ("This is how children learn \"the green cards are how-to-do-it cards\" without anyone telling them.",
     "This is how children learn what each card is for without anyone telling them."),
    ("If the lesson teaches a procedure, that is a `workedExample` card; it goes on a green panel, with the green identity.",
     "If the lesson teaches a procedure, that is a `workedExample` card; it goes on a purple panel with its steps numbered down the left."),
]

path = ROOT / "scripts" / "tests" / "success_criteria_ledger_pins.json"
data = json.loads(path.read_text(encoding="utf-8"))
rows = {row["id"]: row for row in data["rows"]}


def note_on(row, note):
    if note in row["outcome"]:
        return
    if row["outcome"] == "unchanged in place":
        row["outcome"] = f"unchanged in place until the colours release; then {note}"
    else:
        row["outcome"] += f"; then {note}"


def swap(rid, rel, old, new_rel, new):
    row = rows[rid]
    hits = [p for p in row["present"] if p["file"] == rel and p["text"] == norm(old)]
    assert len(hits) == 1, (rid, len(hits))
    row["present"][row["present"].index(hits[0])] = pin_of(new_rel, new)


swap("SC-J11", PREF, J11_OLD, PROFILE, BLACK_NEW)
note_on(rows["SC-J11"], DECISION_11 + FOLD)
swap("SC-J12", PROFILE, BLACK_OLD, PROFILE, BLACK_NEW)
note_on(rows["SC-J12"], DECISION_11)

row = rows["SC-O15"]
hits = [p for p in row["present"] if p.get("paragraph") and p["file"] == WALL_VL
        and p["text"].startswith(norm("| Anti-pattern | Why it hurts |"))]
assert len(hits) == 1, len(hits)
table = paragraph_of(WALL_VL, "| Anti-pattern | Why it hurts |")
assert table and table != hits[0]["text"]
row["present"][row["present"].index(hits[0])] = pin_of(WALL_VL, table)
note_on(row, DECISION_22 + "; the anti-pattern table's sticky-panel row now names the card's shape, "
             "not a blue panel, as what says \"fact\"")

for old, new in O28:
    swap("SC-O28", WALL_VL, old, WALL_VL, new)
note_on(rows["SC-O28"], DECISION_22)

row = rows["SC-O23"]
hits = [p for p in row["present"] if p.get("paragraph") and p["file"] == WALL_CC
        and "`cards[].parts[].result`" in p["text"]]
assert len(hits) == 1, len(hits)
table = paragraph_of(WALL_CC, "| `cards[].parts[].result` | Optional single answer line")
assert table and table != hits[0]["text"] and "`cards[].parts[].worked`" in table
row["present"][row["present"].index(hits[0])] = pin_of(WALL_CC, table)
note_on(row, DECISION_22 + "; the section's field table gains the part's `worked` field, which prints "
             "a worked part's result purple rather than answer green")

path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")

# Every pin in every earlier topic's file must hold against the files as they now
# are: its words present, and a paragraph pinned whole still exactly a paragraph.
for name in ("vocabulary", "assumed_knowledge", "success_criteria", "quick_checks", "teach_then_do"):
    pins = json.loads((ROOT / "scripts" / "tests" / f"{name}_ledger_pins.json").read_text(encoding="utf-8"))
    for pinned in pins["rows"]:
        for pin in pinned["present"]:
            raw = (ROOT / pin["file"]).read_text(encoding="utf-8").replace("\r\n", "\n")
            assert pin["text"] in norm(raw), (name, pinned["id"], pin["text"][:100])
            if pin.get("paragraph"):
                assert pin["text"] in {norm(x) for x in raw.split("\n\n")}, (name, pinned["id"], pin["text"][:100])
print("REPIN_OK")
