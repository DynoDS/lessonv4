"""Assumed knowledge (4.2.287): the finished topics' pins follow the words
this topic changed. Each row keeps every pin the change did not touch; each
touched pin is replaced by the words that now carry it, and the row's outcome
says which decision moved it. Nothing is unpinned."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import ROOT, norm, paragraph_of, pin_of  # noqa: E402

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
HIST = "references/subject-history.md"
PACKET = "scripts/design-review-packet.py"
LOG = "references/build-review-log.md"

# (pins file, row, [(old pin text or None for a whole paragraph, file, new text)], note)
UPDATES = [
    ("quick_checks", "QC-A22",
     [("Reaching the same conclusion is also legitimate when children examine each case to earn it. Do not make every answer different or strip useful support to manufacture independence.",
       PREF, "Reaching the same conclusion in two cases is legitimate when children examine each case to earn it; do not make every answer different, or strip useful support to manufacture independence.")],
     [(REV, "judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point`, and its limits")],
     "moved in 4.2.287 to `The work claims no more than the evidence, and keeps its support`, beside the one home of `Work from what children can use at that point` (assumed knowledge decision 9); the reviewer points to both, and reads that section every review"),
    ("quick_checks", "QC-S13",
     [("anything a later check, Do beat or task expects a child to produce must have been visible on a slide before it, not only spoken. A Year 4 PSHE quick check asked what Sophie's body uses energy for when she is sitting still; the answer, breathing, lived only in the script of the slide before,",
       PREF, "anything a later check, Do beat or task expects a child to produce must have been visible on a slide before it, not only spoken. A quick check that asks what a body uses energy for when it is sitting still is unprepared when the answer, breathing, was only ever said in the script of the slide before.")],
     [(LOG, "A Year 4 PSHE quick check asked what Sophie's body uses energy for when she is sitting still")],
     "the story left `preferences.md` in 4.2.287 for the log (copied in 4.2.286), and its case stays there as a plain example (assumed knowledge decision 1)"),
    ("quick_checks", "QC-B06",
     [(None, LD, "- **Teaching substance and demand:**")],
     [],
     "its paragraph re-pinned in 4.2.287, where assumed knowledge decisions 2 and 3 gave `Prior knowledge` the plan's earlier lessons and the short reminder"),
    ("teach_then_do", "TD-H03",
     [(None, LD, "- **Brief:** Trace every *marked* requirement")],
     [],
     "its paragraph re-pinned in 4.2.287, where assumed knowledge decision 1 made the completion pass work an answer from what children have seen, not from spoken preparation"),
    ("teach_then_do", "TD-K14",
     [("**So this is a check on the design rather than advice.** Every beat that asks children to infer, judge, evaluate or explain names where the knowledge it runs on was taught: earlier in this lesson, or in a named earlier lesson of the enquiry. A beat that cannot point at either is a guessing beat and needs the teaching putting in front of it.",
       PREF, "So this is a check on the design rather than advice, in every subject: every beat that asks children to infer, judge, evaluate or explain names where the knowledge it runs on was taught, earlier in this lesson or in a named earlier lesson (with its short reminder today, `lesson-designer.md` → Prior knowledge). A beat that cannot point at either is a guessing beat and needs the teaching putting in front of it.")],
     [(HIST, "**So this is a check on the design rather than advice**, and it holds in every subject (`preferences.md` → What a Lesson Is For, `Knowledge before judgement, beat by beat`); in history, the earlier lesson a beat names is one of the enquiry.")],
     "moved in 4.2.287 to `preferences.md` → What a Lesson Is For for every subject (assumed knowledge decision 6); history points there and keeps its enquiry"),
    ("vocabulary", "VOC-H07",
     [("For each name, find the words that tell this class who or what it is, on the board where it first appears or in an earlier lesson the brief names. A name nothing explains is a finding on User-fit, and you may repair it yourself as wording",
       REV, "For each name, find the words on the board that tell this class who or what it is, where it first appears; a name an earlier lesson taught still gets a short reminder there (`Lord Shaftesbury, who we met last week, ...`). A name nothing explains is a finding on User-fit, and you may repair it yourself as wording")],
     [],
     "reworded in 4.2.287 by assumed knowledge decisions 1 and 3: the words are on the board, and a name an earlier lesson taught gets a short reminder"),
    ("vocabulary", "VOC-M06",
     [("Named people, places and events are content the lesson teaches and children need, but they belong in the teaching rather than on cards, because knowing them makes a child knowledgeable about one period rather than a stronger historical thinker. In the teaching means explained where each first appears on the board, in a clause a child can hold (`Queen Elizabeth I, who ruled England in Tudor times`, `the River Thames, which runs through London`), unless an earlier lesson the brief names taught it. A name nothing explains is a word the class cannot use, and the limit on vocabulary cards is no reason to leave it unexplained.",
       HIST, "Named people, places and events are content the lesson teaches and children need, but they belong in the teaching rather than on cards, because knowing them makes a child knowledgeable about one period rather than a stronger historical thinker. In the teaching means explained where each first appears on the board, in a clause a child can hold (`Queen Elizabeth I, who ruled England in Tudor times`, `the River Thames, which runs through London`), and a name an earlier lesson taught gets a short reminder there instead (`Lord Shaftesbury, who we met last week, ...`), never a reteach. A name nothing explains is a word the class cannot use, and the limit on vocabulary cards is no reason to leave it unexplained.")],
     [],
     "reworded in 4.2.287 by assumed knowledge decision 3: a name an earlier lesson taught gets a short reminder, never a reteach"),
    ("vocabulary", "VOC-L05",
     [("Read when vocabulary selection, definition, quantity or placement",
       PACKET, "\"vocabulary selection, definition, quantity or placement is in doubt.\"")],
     [(PACKET, "\"Read every review, for `A word the teaching leans on is taught`: the \"")],
     "the trigger became an every-review read in 4.2.287 (assumed knowledge decision 8), keeping its old condition for the rest of the section"),
]

for name, rid, swaps, extra, note in UPDATES:
    path = ROOT / "scripts" / "tests" / f"{name}_ledger_pins.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    row = next(r for r in data["rows"] if r["id"] == rid)
    for old, rel, new in swaps:
        if old is None:
            hits = [p for p in row["present"] if p.get("paragraph") and p["file"] == rel and p["text"].startswith(norm(new))]
            assert len(hits) == 1, (rid, "paragraph", len(hits))
            text = paragraph_of(rel, new)
            assert text, (rid, new)
            replacement = pin_of(rel, text)
        else:
            hits = [p for p in row["present"] if p["text"] == norm(old)]
            assert len(hits) == 1, (rid, len(hits), old[:60])
            replacement = pin_of(rel, new)
        assert replacement["text"] in norm((ROOT / rel).read_text(encoding="utf-8")), (rid, new[:80])
        row["present"][row["present"].index(hits[0])] = replacement
    for rel, text in extra:
        pin = pin_of(rel, text)
        assert pin["text"] in norm((ROOT / rel).read_text(encoding="utf-8")), (rid, text[:80])
        row["present"].append(pin)
    if note not in row["outcome"]:
        row["outcome"] = f"{row['outcome']}; then {note}"
    # The file keeps its own layout: one row per line, as the builder wrote it.
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print("repinned", name, rid)

# Added after a6 changed two contents lines: the contents list is pinned whole
# by TD-A12 and VOC-A03, and was re-pinned the same way (run inline, recorded
# here): the paragraph starting `- **Written Voice (House Style)**`, re-read.
