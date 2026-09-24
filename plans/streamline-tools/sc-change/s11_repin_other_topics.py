"""Success criteria (4.2.288): the earlier topics' pins follow the words this
change altered. A whole-paragraph pin is re-read from its paragraph; a phrase
pin carries the same substitution the change made; each row's outcome names
the decision."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import ROOT, norm, paragraph_of, pin_of  # noqa: E402

REV = "agents/design-reviewer.md"
PREF = "references/preferences.md"
SKILL = "references/teaching-sequence-skill-based.md"
WSD = "agents/worksheet-designer.md"

PARAS = [
    # (pins, row, file, the paragraph's opening, note)
    ("quick_checks", "QC-C08", REV, "- the task requires the thinking named by the objective", "its paragraph re-pinned in 4.2.288, where the reviewer's criteria line took the success-criteria decisions 2, 6, 9 and 15"),
    ("quick_checks", "QC-E11", REV, "- the task requires the thinking named by the objective", "its paragraph re-pinned in 4.2.288, where the reviewer's criteria line took the success-criteria decisions 2, 6, 9 and 15"),
    ("quick_checks", "QC-P01", REV, "- the task requires the thinking named by the objective", "its paragraph re-pinned in 4.2.288, where the reviewer's criteria line took the success-criteria decisions 2, 6, 9 and 15"),
    ("teach_then_do", "TD-L07", REV, "- the task requires the thinking named by the objective", "its paragraph re-pinned in 4.2.288, where the reviewer's criteria line took the success-criteria decisions 2, 6, 9 and 15"),
    ("teach_then_do", "TD-L09", REV, "- the task requires the thinking named by the objective", "its paragraph re-pinned in 4.2.288, where the reviewer's criteria line took the success-criteria decisions 2, 6, 9 and 15"),
    ("teach_then_do", "TD-A12", PREF, "- **Written Voice (House Style)**", "the contents list re-pinned in 4.2.288, where the Success Criteria line names what the section holds"),
    ("vocabulary", "VOC-A03", PREF, "- **Written Voice (House Style)**", "the contents list re-pinned in 4.2.288, where the Success Criteria line names what the section holds"),
    ("teach_then_do", "TD-B16", SKILL, "**One concept, one SC.**", "its paragraph re-pinned in 4.2.288, where \"short verb-first imperatives\" became \"clear verb-first steps\" (success-criteria decision 10)"),
]

PHRASES = [
    # (pins, row, file, old words inside the pin, new words, note)
    ("assumed_knowledge", "AK-F30", SKILL,
     "**Name a familiar or just-taught action only when children genuinely know how to carry it out.**",
     "**Name a familiar action only when children genuinely know how to carry it out from earlier lessons.**",
     "\"just-taught\" left in 4.2.288 (success-criteria decision 16): only a method secure from earlier lessons is named without saying how"),
    ("vocabulary", "VOC-N29", PREF,
     "When one word could take two colours, the picture wins, then the taught word. Mark the words doing that work and leave the rest black: usually one or two parts of a step, and a step with nothing to pick out stays plain,",
     "Every taught word is green, every time, even when it also names a coloured part of the picture (`tens` beside a coloured tens column is green). The picture and orange marks go on the other words doing that work, so a step is not all black: usually one or two parts of a step, and a step with nothing else to pick out stays plain,",
     "the teacher's success-criteria decision 1 (4.2.288): every taught word green, every time, the picture's colour no longer winning; the one-or-two limit is for the other marks"),
]

# AK-J14's words left with rule 13: criteria never go on a sheet now.
J14_OLD = "Omit a duplicated panel when the surrounding lesson context already supplies the reference adequately. Include the exact concise criteria when the sheet must stand independently or access depends on that reference"
J14_NEW = "**Never print success criteria on a worksheet.** They stay on the board, where children consult them while they work, and the teacher does not want them on any sheet or slip."
J14_NOTE = "rule 13 turned round in 4.2.288 (success-criteria decision 8, \"I don't want any success criteria on worksheets\"): the sheet that must stand on its own no longer reprints the criteria"


def load(name):
    path = ROOT / "scripts" / "tests" / f"{name}_ledger_pins.json"
    return path, json.loads(path.read_text(encoding="utf-8"))


def save(path, data):
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def note_on(row, note):
    if note not in row["outcome"]:
        row["outcome"] += f"; then {note}"


for name, rid, rel, opening, note in PARAS:
    path, data = load(name)
    row = next(r for r in data["rows"] if r["id"] == rid)
    hits = [p for p in row["present"] if p.get("paragraph") and p["file"] == rel and p["text"].startswith(norm(opening))]
    assert len(hits) == 1, (rid, len(hits))
    row["present"][row["present"].index(hits[0])] = pin_of(rel, paragraph_of(rel, opening))
    note_on(row, note)
    save(path, data)
    print("repinned", rid)

for name, rid, rel, old, new, note in PHRASES + [("assumed_knowledge", "AK-J14", WSD, J14_OLD, J14_NEW, J14_NOTE)]:
    path, data = load(name)
    row = next(r for r in data["rows"] if r["id"] == rid)
    hits = [p for p in row["present"] if p["file"] == rel and norm(old) in p["text"]]
    assert len(hits) == 1, (rid, len(hits))
    if rid == "AK-J14":
        replacement = pin_of(rel, new)
    else:
        replacement = pin_of(rel, hits[0]["text"].replace(norm(old), norm(new)))
    assert replacement["text"] in norm((ROOT / rel).read_text(encoding="utf-8")), (rid, replacement["text"][:120])
    row["present"][row["present"].index(hits[0])] = replacement
    note_on(row, note)
    save(path, data)
    print("repinned", rid)
