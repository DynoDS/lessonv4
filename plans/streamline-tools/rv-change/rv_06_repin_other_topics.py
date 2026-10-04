"""The design reviewer release, step 6: the earlier topics' pins whose words this
release changed follow them, in place, each with the decision that changed it,
as the worksheets and colours releases did (`ws-change/w9_repin_other_topics.py`,
`colours-change/k8_repin_other_topics.py`). The earlier topics' mapping builders
are frozen and are not rerun: a rerun would undo moves like these.

Every pin is found by its words, not by a fixed old text: each of this
release's replacements in the reviewer's instructions is applied, sentence by
sentence, to every pin on that file that still holds the old sentence. So the
script replays on a clean 4.2.292 tree after steps 1 to 5, and equally on the
tree the merge with release 7A leaves, where 7A has already moved some of the
same paragraph pins for its own lines (the reviewer's section 3 list among
them) and has pins of its own on them (`starters_sticky_apply_ledger_pins.json`):
the other release's words are left as they are, and only this release's
sentences change. This topic's own pin file is built by `build_rv_mapping.py`
and is not touched here.

Each changed pin's row records the decision in its outcome, and each topic's
ledger records it too (`rv_07_record_in_ledgers.py`)."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import HEADING, ROOT, norm  # noqa: E402

REV = "agents/design-reviewer.md"
RELEASE = "the design reviewer release (topic 8, release 2)"
print(f"repinning in {ROOT}")

D2 = ("his decision 2 on the design reviewer's list (24 September 2026, \"1. y\"): a picture swap or a rewritten Do "
      "beat goes to the lesson designer, with the reviewer naming the fix")
S4 = ("his settled item 4 on that list (\"Judge the board first ... board first, speaker notes separate\"): the "
      "visible explanation is judged first, on its own, and the spoken one separately")
S5 = "its settled item 5: out-of-date text says what is true now"
S10 = "its settled item 10: one copy of each rule"
S11 = ("its settled item 11: the dated story left for the build log, where the release copied it first; the reason "
       "stays")
READER = ("the lead's reading of his words, not his own wording (he said \"I actually don't know why it says "
          "nine-year-old. Um, because the plugin is for years one, two, three, four, five, and six, right?\" of other "
          "lines on the rest-of-preferences list, 24 September): the sweep imagines the child in this class")

# (old sentence, new sentence, why), each exactly as rv_02 replaced it, with
# runs of whitespace as one space, as pins hold them.
EDITS = [
    (" The lesson that shows the gap: a Year 4 history design was approved here on 10 September 2026 with `both "
     "comparison objects available and live model space retained`, and was abandoned in the room, because one plate "
     "came back on nine of eighteen slides and the practice beat carried all four sources, a two-part task, three "
     "bullets and an evidence question at once.", "", S11 + " (the Year 4 history design of 10 September)"),
    ("Amount catches too much; this catches too little, and the plugin approved a deck that failed it on 14 September "
     "2026 (a photograph, `A Tudor farm household` under it, the teaching in the notes; the user: \"there's nothing on "
     "the slide to guide me to know what to say\").", "Amount catches too much; this catches too little.",
     S11 + " (the Tudor deck of 14 September; his words stay in `preferences.md`)"),
    ("On 22 September 2026 two lessons in a row were approved with `each Teach board can be taught with notes closed` "
     "while every Teach script carried a reason or a refusal the board did not (`He wasn't a king who could order "
     "everybody to obey him`; `People sometimes call the whole front of their body their tummy, but the stomach is "
     "this one organ`).",
     "A script line such as `He wasn't a king who could order everybody to obey him` or `People sometimes call the "
     "whole front of their body their tummy, but the stomach is this one organ`, with no counterpart on the board, is "
     "that finding.", S11 + " (the two lessons of 22 September; their two script lines stay as plain examples)"),
    ("and today the teacher edits it out by hand.", "and the teacher would have to edit it out by hand.",
     S11 + " (a moment written as a reason)"),
    ("A string read inside JSON braces beside its field name is read as a specification, and that is how a class met "
     "`What does one visible detail suggest about this class?` after a review that found nothing.",
     "A string read inside JSON braces beside its field name is read as a specification.", S11),
    ("`Read 66 child-facing strings as a Year 4 child; repaired 0.` was the whole sweep on a Year 4 PSHE lesson whose "
     "four task strings the teacher could not read at all (`Food: rush through the morning without eating until late "
     "afternoon.`), and that line is what a sweep that happened and a sweep that did not both produce.",
     "A count line alone is what a sweep that happened and a sweep that did not both produce.", S11),
    ("the actual eight- or nine-year-old the year group names, who has not read the plan",
     "the actual child in this class, who has not read the plan", READER),
    ("An RE beat printed `What do their reasons share?` over a script saying `Tell your partner what is the same and "
     "what is different`; the plain version was already written and the class got the clever one.",
     "`What do their reasons share?` printed over a script saying `Tell your partner what is the same and what is "
     "different` is the shape: the plain version is already written, and the class gets the clever one.", S11),
    ("Judge the spoken and visible explanation together; do not solve a missing connection merely by adding words to "
     "an already crowded slide.",
     "Judge the visible explanation first, on its own, and the spoken one separately, so nothing counts as taught on "
     "the board because the script says it; do not solve a missing connection merely by adding words to an already "
     "crowded slide.", S4),
    ("The design now states this in each unit's `unlocks`", "The design states this in each unit's `unlocks`",
     S5 + " (\"now\" was a note about a past change)"),
    ("The repair is local and keeps the chunk: ask for the because, one link in the chain,",
     "The repair keeps the chunk and is the Lesson Designer's, because it changes what children have to think: return "
     "it naming the fix, which asks for the because, one link in the chain,",
     D2 + " (a Do that says its Teach back)"),
    # A pin that stops at that sentence's colon (QC-D08).
    ("The repair is local and keeps the chunk:",
     "The repair keeps the chunk and is the Lesson Designer's, because it changes what children have to think:",
     D2 + " (a Do that says its Teach back)"),
    ("Here judge the wording you noted in its teaching context; do not repeat a separate whole-lesson sweep.",
     "Here judge the wording you noted in its teaching context.", S10 + " (the review method's opening says it)"),
    ("- each moment carries only what the class can take in at once (the User-fit judgement above owns that test; do "
     "not run it twice); ", "", S10 + " (the User-fit judgement owns the amount test)"),
    ("This is the check that was too thin to catch a place-value-chart lesson whose sheet had no chart on it, so read "
     "the forms rather than confirming the objective matches.",
     "Read the forms rather than confirming the objective matches.",
     S11 + " (the worksheets plan's Q10, left to this release; the instruction stays)"),
    ("is the shape this check exists to catch: it was the shape of every sheet counted on 12 September 2026, including "
     "a *name the layers of teeth* sheet", "is the shape this check exists to catch, as in a *name the layers of teeth* "
     "sheet", S11 + " (the worksheets plan's Q11, left to this release; the teeth sheet stays as a plain example)"),
    (" A Year 4 RE deck passed this review with two children's reasons on the board as text cards and its own "
     "carol-singing photograph unused.", "", S11 + " (the Year 4 RE deck)"),
    ("Raise it as a correction naming the helper that should draw it.",
     "Return it to the Lesson Designer, naming the helper that should draw it.",
     D2 + " (a photograph of a tool the engine draws)"),
    ("The orchestrator can only answer a failed check by sending the whole design back for repair, which delays every "
     "resource in the lesson so that one sentence can be shortened, and shortening it here costs you a minute.",
     "A failed check sends your corrections to a focused repair and, only if that fails, the whole design to a fresh "
     "attempt, which delays every resource in the lesson so that one sentence can be shortened; shortening it here "
     "costs you a minute.", S5 + " (the run's focused repair)"),
]


def spaced(old: str) -> str:
    """The old sentence as a pin holds it, keeping the one joining space a
    removal takes with it."""
    return (" " if old.startswith(" ") else "") + norm(old) + (" " if old.endswith(" ") else "")


EDITS = [(spaced(old), norm(new), why) for old, new, why in EDITS]

raw = (ROOT / REV).read_text(encoding="utf-8").replace("\r\n", "\n")
now_text = norm(raw)
now_paragraphs = {norm(x) for x in raw.split("\n\n")}
for old, new, _why in EDITS:
    assert norm(old) not in now_text, f"the reviewer still holds: {old[:80]}"
    assert not new or norm(new) in now_text, f"the reviewer lacks: {new[:80]}"


def home_paragraphs(heading: str) -> list[str]:
    """A section's paragraphs as the shared checks read them (to the next
    heading at its level or above, or the file's end)."""
    lines = raw.split("\n")
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level), len(lines))
    return [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]


def note_on(row, note):
    if note in row["outcome"]:
        return
    if row["outcome"] == "unchanged in place":
        row["outcome"] = f"unchanged in place until {RELEASE}; then {note}"
    else:
        row["outcome"] += f"; then {note}"


moved = []
files = []
for path in sorted((ROOT / "scripts" / "tests").glob("*_ledger_pins.json")):
    if path.name == "design_reviewer_ledger_pins.json":
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    changed_here = False
    for row in data["rows"]:
        whys = []
        for pin in row["present"]:
            if pin["file"] != REV:
                continue
            text = pin["text"]
            for old, new, why in EDITS:
                if old.strip() and norm(old) in text:
                    # A removal takes its one joining space with it.
                    text = text.replace(old, new) if old in text else text.replace(norm(old), new)
                    text = norm(text)
                    whys.append(why)
            if text != pin["text"]:
                assert text, (path.name, row["id"], "a pin whose whole text left")
                assert text in now_text, (path.name, row["id"], text[:120])
                if pin.get("paragraph"):
                    assert text in now_paragraphs, (path.name, row["id"], "no longer a whole paragraph", text[:120])
                pin["text"] = text
        if whys:
            unique = list(dict.fromkeys(whys))
            note_on(row, f"{RELEASE} changed words inside this pinned text, which follows them: " + "; ".join(unique))
            moved.append((path.name, row["id"]))
            changed_here = True
    # A home on the reviewer's file keeps its own list of paragraphs beside the
    # rows that pin them; it follows the same sentences, and must then be
    # exactly the section's paragraphs in order.
    for home in data.get("homes", []):
        if home["file"] != REV:
            continue
        paragraphs = []
        for para in home["paragraphs"]:
            for old, new, _why in EDITS:
                if old.strip() and norm(old) in para:
                    para = norm(para.replace(old, new) if old in para else para.replace(norm(old), new))
            paragraphs.append(para)
        if paragraphs != home["paragraphs"]:
            assert paragraphs == home_paragraphs(home["heading"]), (path.name, home["heading"])
            home["paragraphs"] = paragraphs
            moved.append((path.name, f"home {home['heading']}"))
            changed_here = True
    files.append((path, data, changed_here))

for name, rid in moved:
    print(f"moved {name} {rid}")

# On this branch these are the pins that held the changed words; on the merged
# tree 7A's own pins on the same paragraphs follow too, and are listed above.
EXPECTED = {
    ("assumed_knowledge_ledger_pins.json", "AK-A49"), ("assumed_knowledge_ledger_pins.json", "AK-G21"),
    ("assumed_knowledge_ledger_pins.json", "AK-K01"),
    ("quick_checks_ledger_pins.json", "QC-C08"), ("quick_checks_ledger_pins.json", "QC-D08"),
    ("quick_checks_ledger_pins.json", "QC-E11"), ("quick_checks_ledger_pins.json", "QC-P01"),
    ("success_criteria_ledger_pins.json", "SC-Q01"),
    ("teach_then_do_ledger_pins.json", "TD-L07"), ("teach_then_do_ledger_pins.json", "TD-L09"),
    ("teach_then_do_ledger_pins.json", "TD-L10"),
    ("worksheets_ledger_pins.json", "WS-I05"), ("worksheets_ledger_pins.json", "WS-Q02"),
    ("worksheets_ledger_pins.json", "WS-Q08"), ("worksheets_ledger_pins.json", "WS-Q10"),
    ("worksheets_ledger_pins.json", "WS-Q11"), ("worksheets_ledger_pins.json", "HOME-WS-REV-03"),
    ("worksheets_ledger_pins.json", "home ### 5. Worksheet evidence"),
}
# On a clean 4.2.292 tree every one of them moves here. On a merged tree a pin
# file git merged cleanly already carries this release's words, so its pins
# have nothing left to follow: they must then hold as they are (checked below),
# and no pin anywhere may still carry an old sentence.
already = EXPECTED - set(moved)
for name, rid in sorted(already):
    print(f"already following this release's words: {name} {rid}")
for path, data, _changed in files:
    for row in data["rows"]:
        for pin in row["present"]:
            if pin["file"] == REV:
                for old, _new, _why in EDITS:
                    assert norm(old) not in pin["text"], (path.name, row["id"], old[:80])
    for home in data.get("homes", []):
        if home["file"] == REV:
            assert home["paragraphs"] == home_paragraphs(home["heading"]), (path.name, home["heading"])

# Every pin on the reviewer's file in every earlier topic's pin file holds now,
# checked before anything is written.
for path, data, _changed in files:
    for row in data["rows"]:
        for pin in row["present"]:
            if pin["file"] == REV:
                assert pin["text"] in now_text, (path.name, row["id"], pin["text"][:100])
                if pin.get("paragraph"):
                    assert pin["text"] in now_paragraphs, (path.name, row["id"], pin["text"][:100])
for path, data, changed in files:
    if changed:
        path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(f"REPIN_OK {len(moved)} pins moved")
