"""The worksheets release (4.2.290), step 10: the earlier topics' pins whose
words this release changed follow them, each with the decision that changed
it (change plan section 5, item 10), as the success-criteria release did
(`sc-change/s11_repin_other_topics.py`).

A whole-paragraph pin is re-read from its paragraph; a phrase pin carries the
same substitution the change made; each row's outcome names the decision. The
earlier topics' mapping builders are not edited here (they sit outside this
release's files): if one of them is ever rerun, it must be given the same rows
and reasons first, or it will report them as changed but not mapped.

Vocabulary's pins are untouched: the worksheet designer's two support
paragraphs they hold were kept word for word."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import ROOT, norm, paragraph_of, pin_of  # noqa: E402

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
WSD = "agents/worksheet-designer.md"
TEXT = "worksheet-html/src/helpers/text.js"

SETTLED_A = ("the worksheets topic's settled item a (4.2.290), his 23 September ruling "
             "\"worksheets are not homework, worksheets are delivered in class all the time\": "
             "a sheet leans on what the board or the working wall shows while children work")
SETTLED_B = ("the worksheets topic's settled item b (4.2.290), his words \"it won't fit the 45 min\" "
             "and \"worksheets are delivered in class all the time\": the Classroom sequence bullet says "
             "the sheet's time sits inside the lesson, in the beat it replaces or the independent work "
             "the slides leave room for, never set for another time or added on top")
DECISION_10 = ("the worksheets topic's decision 10 (4.2.290), his \"yes\", as the lead read it "
               "(\"never a list of steps printed just as a reminder\", the lead's wording, which he "
               "called \"fine\"): a list of a method's steps is never printed just "
               "as a reminder, a one-line reminder of a method is support, and a fill-in frame the child "
               "writes into, and steps a task needs worked through, print with their question (it says "
               "nothing about where else the steps are shown)")
DECISION_2 = ("the worksheets topic's decision 2 (4.2.290), his words \"I wouldn't want the same exact "
              "questions on both\": reuse for consolidation keeps the task's shape, with the sheet's own questions")

PARAS = [
    # (pins, row, file, the paragraph's opening, note)
    ("assumed_knowledge", "AK-A05", LD, "- **Brief:** Trace every *marked* requirement", SETTLED_B),
    ("teach_then_do", "TD-H03", LD, "- **Brief:** Trace every *marked* requirement", SETTLED_B),
    ("assumed_knowledge", "AK-A49", REV, "- pupil wording is clear, natural, accurate and age-appropriate;", SETTLED_A),
    ("success_criteria", "SC-N01", WSD, "13. **Never print success criteria on a worksheet.**", DECISION_10),
    ("success_criteria", "SC-N04", WSD, "- Confirm `Pupil prompt` contains only child-facing wording", DECISION_10),
    ("success_criteria", "SC-N05", WSD, "**What sends something to the back is what a child could do without it, not what",
     DECISION_10 + "; its example is now a one-line reminder"),
    ("success_criteria", "SC-N07", PREF, "A step list a child must work *through*",
     DECISION_10 + "; and its settled item h, the worksheet designer's sentence-start case moved here as a plain example"),
]

I01_OLD = "A separate worksheet need not duplicate a reference that remains accessible, but a resource intended for use on its own cannot assume an unseen board."
I01_NEW = "A worksheet need not duplicate a reference the board or the working wall shows while children work: every sheet is done in class."
PHRASES = [
    # (pins, row, file, old words inside the pin, new words, note)
    ("assumed_knowledge", "AK-J03", PREF, I01_OLD, I01_NEW, SETTLED_A),
    ("success_criteria", "SC-N17", PREF, I01_OLD, I01_NEW, SETTLED_A),
    ("assumed_knowledge", "AK-J04", WSD,
     "the child demonstrably meets it elsewhere in this lesson, which you establish from the lesson design's own slides, representations or working-wall entries rather than assuming it;",
     "the board or the working wall shows it while they work on the sheet, which you establish from the lesson design's own slides, representations or working-wall entries rather than assuming it;",
     SETTLED_A),
    ("success_criteria", "SC-N18", WSD,
     "when the same thing is on the board or the working wall throughout the lesson.",
     "when the same thing is on the board or the working wall while they work on the sheet.",
     SETTLED_A),
    ("assumed_knowledge", "AK-J13", REV,
     "For needed support omitted from a sheet, check the planned shared access before making a finding; do not assume either that nothing is available or that the board will always be there;",
     "For needed support omitted from a sheet, check whether the board or the working wall shows it while children work before making a finding (every sheet is done in class);",
     SETTLED_A),
    ("success_criteria", "SC-N07", PREF,
     "A reminder of a method they have already used and a prompt to check their work pass that test,",
     "A one-line reminder of a method they have already used and a prompt to check their work pass that test,",
     DECISION_10 + "; the reminder that comes after is one line"),
    ("quick_checks", "QC-S42", PREF,
     "Reusing a task for consolidation is legitimate when that is its stated purpose, rather than claiming it demonstrates unseen transfer.",
     "Reusing a task's shape for consolidation, with the sheet's own questions, is legitimate when that is its stated purpose, rather than claiming it demonstrates unseen transfer.",
     DECISION_2),
]

# SC-DEC-08-ENGINE held the list refusal line by line; decision 10 split one
# line in two, so that one pin becomes two.
ENGINE_OLD = "'board and are never printed on a worksheet. Otherwise, if they are steps a child ' +"
ENGINE_NEW = [
    "'board and are never printed on a worksheet. A list of a method\\'s steps printed ' +",
    "'just as a reminder is left off too. Otherwise, if they are steps a child ' +",
]

N14_NOTE = ("the worksheets topic's decision 10 (4.2.290) brought \"a method's steps\" back to a sheet's "
            "rules, bounded to steps printed only to consult, which are left off; both barred wordings "
            "stay barred everywhere, and nothing says where the steps are shown")


def load(name):
    path = ROOT / "scripts" / "tests" / f"{name}_ledger_pins.json"
    return path, json.loads(path.read_text(encoding="utf-8"))


def save(path, data):
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def note_on(row, note):
    if note in row["outcome"]:
        return
    if row["outcome"] == "unchanged in place":
        row["outcome"] = f"unchanged in place until 4.2.290; then {note}"
    else:
        row["outcome"] += f"; then {note}"


for name, rid, rel, opening, note in PARAS:
    path, data = load(name)
    row = next(r for r in data["rows"] if r["id"] == rid)
    hits = [p for p in row["present"] if p.get("paragraph") and p["file"] == rel and p["text"].startswith(norm(opening))]
    assert len(hits) == 1, (rid, len(hits))
    para = paragraph_of(rel, opening)
    assert para and para != hits[0]["text"], (rid, "paragraph not found or unchanged")
    row["present"][row["present"].index(hits[0])] = pin_of(rel, para)
    # A phrase pin inside the same paragraph that the change reworded
    # (SC-N04's own line) follows too.
    note_on(row, note)
    save(path, data)
    print("repinned paragraph", rid)

# SC-N04's own phrase pin, beside its paragraph pin.
path, data = load("success_criteria")
row = next(r for r in data["rows"] if r["id"] == "SC-N04")
hits = [p for p in row["present"] if not p.get("paragraph") and p["text"] == norm("- Confirm no success criteria are printed, as a panel or as an instruction carrying a list.")]
assert len(hits) == 1, len(hits)
row["present"][row["present"].index(hits[0])] = pin_of(WSD, "- Confirm no success criteria are printed, as a panel or as an instruction carrying a list, or a list of a method's steps printed just as a reminder.")
save(path, data)
print("repinned phrase SC-N04")

# SC-N05's own phrase, beside its paragraph pin.
path, data = load("success_criteria")
row = next(r for r in data["rows"] if r["id"] == "SC-N05")
hits = [p for p in row["present"] if not p.get("paragraph") and p["text"] == norm("an answer. A reminder of a method they have already used, a prompt to check their work: yes,")]
assert len(hits) == 1, len(hits)
row["present"][row["present"].index(hits[0])] = pin_of(WSD, "an answer. A one-line reminder of a method they have already used, a prompt to check their work: yes,")
save(path, data)
print("repinned phrase SC-N05")

for name, rid, rel, old, new, note in PHRASES:
    path, data = load(name)
    row = next(r for r in data["rows"] if r["id"] == rid)
    hits = [p for p in row["present"] if p["file"] == rel and norm(old) in p["text"]]
    assert len(hits) == 1, (rid, len(hits))
    row["present"][row["present"].index(hits[0])] = pin_of(rel, hits[0]["text"].replace(norm(old), norm(new)))
    note_on(row, note)
    save(path, data)
    print("repinned phrase", rid)

path, data = load("success_criteria")
row = next(r for r in data["rows"] if r["id"] == "SC-DEC-08-ENGINE")
hits = [p for p in row["present"] if p["file"] == TEXT and p["text"] == norm(ENGINE_OLD)]
assert len(hits) == 1, len(hits)
at = row["present"].index(hits[0])
row["present"][at:at + 1] = [pin_of(TEXT, line) for line in ENGINE_NEW]
note_on(row, DECISION_10 + "; the one pinned line of the list refusal it split is now two")
n14 = next(r for r in data["rows"] if r["id"] == "SC-N14")
note_on(n14, N14_NOTE)
save(path, data)
print("repinned SC-DEC-08-ENGINE and noted SC-N14")

# Every pin moved here must hold against the files as they now are.
for name in ("assumed_knowledge", "success_criteria", "quick_checks", "teach_then_do"):
    _path, data = load(name)
    for row in data["rows"]:
        for pin in row["present"]:
            text = norm((ROOT / pin["file"]).read_text(encoding="utf-8"))
            assert pin["text"] in text, (name, row["id"], pin["text"][:100])
print("REPIN_OK")
