"""Assumed knowledge (4.2.287): the earlier topics' pins follow the repairs.
A whole-paragraph pin is re-read from its paragraph; a phrase pin is replaced
by the words that now carry it; each row's outcome names the repair."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import ROOT, norm, paragraph_of, pin_of  # noqa: E402

LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"

UPDATES = [
    # (pins, row, file, old pin prefix, new text or None to re-read the paragraph from the prefix, note)
    ("quick_checks", "QC-B06", LD, "- **Teaching substance and demand:**", None,
     "re-pinned again after the change check: the reminder reaches any earlier lesson"),
    ("teach_then_do", "TD-H03", LD, "- **Brief:** Trace every *marked* requirement", None,
     "re-pinned again after the change check: the completion pass's reason says the script never teaches what the board lacks"),
    ("quick_checks", "QC-A22", REV, "judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point`, and its limits",
     "judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point` (new evidence is allowed; a new explanation the lesson never taught is not) and `The work claims no more than the evidence, and keeps its support` beside it.",
     "the reviewer's pointer names both limits and the paragraph beside the home (the change check)"),
]

for name, rid, rel, old, new, note in UPDATES:
    path = ROOT / "scripts" / "tests" / f"{name}_ledger_pins.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    row = next(r for r in data["rows"] if r["id"] == rid)
    hits = [p for p in row["present"] if p["file"] == rel and p["text"].startswith(norm(old))]
    assert len(hits) == 1, (rid, len(hits))
    replacement = pin_of(rel, paragraph_of(rel, old) if new is None else new)
    assert replacement["text"] in norm((ROOT / rel).read_text(encoding="utf-8")), rid
    row["present"][row["present"].index(hits[0])] = replacement
    if note not in row["outcome"]:
        row["outcome"] += f"; {note}"
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print("repinned", rid)

# TD-DEC-06 pins the compatibility route's always-read list, which now names
# Vocabulary (assumed knowledge decision 8, the change check's 2a).
path = ROOT / "scripts" / "tests" / "teach_then_do_ledger_pins.json"
data = json.loads(path.read_text(encoding="utf-8"))
row = next(r for r in data["rows"] if r["id"] == "TD-DEC-06")
hits = [p for p in row["present"] if p["file"] == REV and "always read `preferences.md` → Pride Lessons" in p["text"]]
assert len(hits) == 1, len(hits)
old = hits[0]["text"]
new_text = old.replace(
    "What a Lesson Is For and The Teach → Do → Teach → Do Rhythm, `teacher-voice.md`",
    "What a Lesson Is For, The Teach → Do → Teach → Do Rhythm and Vocabulary (for `A word the teaching leans on is taught`), `teacher-voice.md`",
)
assert new_text != old
replacement = pin_of(REV, new_text)
assert replacement["text"] in norm((ROOT / REV).read_text(encoding="utf-8"))
row["present"][row["present"].index(hits[0])] = replacement
note = "the compatibility route also reads Vocabulary every review (assumed knowledge decision 8, 4.2.287)"
if note not in row["outcome"]:
    row["outcome"] += f"; then {note}"
path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print("repinned TD-DEC-06")

# This topic's own decision test follows the repaired name paragraph.
test = ROOT / "scripts" / "tests" / "test_assumed_knowledge_ledger_is_kept.py"
t = test.read_text(encoding="utf-8")
old = '        self.assertIn("The repair is in how the teaching is worded, not a vocabulary card.", self.SLIDES)\n'
new = ('        self.assertIn("For these, the repair is in how the teaching is worded, not a vocabulary card.", self.SLIDES)\n'
       '        # Only names and things met on the way: an ordinary word keeps the\n'
       '        # vocabulary rule\'s three repairs, a card among them.\n'
       '        self.assertIn("a word the teaching leans on takes the three repairs", self.SLIDES)\n')
assert t.count(old) == 1
test.write_text(t.replace(old, new), encoding="utf-8")
print("test follows")
