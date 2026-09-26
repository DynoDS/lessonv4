"""The routes release, step 7: the earlier topics' pins whose words this release
changed follow them, in place, each with the decision that changed it, as the
worksheets, colours and 7A releases did (`ws-change/w9_repin_other_topics.py`,
`colours-change/k8_repin_other_topics.py`, `7a-change/a10_repin_other_topics.py`).
Every earlier topic's record builder is frozen; a rerun of one would undo these
moves.

Every pin is found by its words, never by its place in the file, so this script
replays on a merged tree too (the design reviewer release moves some of the
same pins for its own sentences; run this after it, and the paragraph it reads
is the merged one). A whole-paragraph pin is re-read from its paragraph, found by
its opening words; a phrase pin carries the substitution the change made; a
home is re-read whole, and only the paragraphs this release changed may differ.
Each row's outcome names the decision. No row is added or dropped, no section
or paragraph flag changes, and no barred wording is touched."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE))
import _root  # noqa: E402,F401  (a replay on a scratch copy sets LESSONV4_PLUGIN_ROOT)
import ledger_mapping  # noqa: E402
from ledger_mapping import norm, paragraph_of, pin_of  # noqa: E402

LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
PREF = "references/preferences.md"
CONTENT = "references/teaching-sequence-content-based.md"
SKILL = "references/teaching-sequence-skill-based.md"
TASK = "references/teaching-sequence-task-centred.md"
DIAL = "references/teaching-sequence-dialogic.md"
DB = "references/do-beats.md"

R = "the routes release (topic 8, release 3): "
D1 = R + "routes decision 1 (his \"y\"): four corners comes out of the discussion route"
D2 = (R + "routes decision 2 (his \"y\"): one rule everywhere, the good example skipped only when the class has seen a "
      "good one earlier in this lesson")
T13B = ("success criteria on the board that already show what a good one looks like (an actual good one, such as a "
        "model answer or a good paragraph, never a list of what a good one includes) stand in for the good instance, "
        "so the launch keeps its case and steps and needs no second model")
ACTUAL = "(an actual good one, such as a model answer or a good paragraph, never a list of what a good one includes)"
B13 = (R + "his preferences decision 13b, carried with the routes release: " + T13B)
RVL = (R + "the reviewer's launch line takes routes decision 2's words (a launch when the class has not yet seen a good "
       "one of this product earlier in this lesson; a null launch also when it has) and his preferences decision 13b: "
       + T13B)
D34 = (R + "routes decisions 3 and 4 (his 3, widened): the teacher's way of explaining and the launch, each written once "
       "under its own heading in the content route, which every route and the reviewer now name")
S7C = R + "routes settled item 7c: the activity list names the entries that replaced Brain Dump and Turn-and-Talk"
S7E = (R + "routes settled item 7e: a skill `prepare` unit's `activity` in `explanation` mode and a task lesson's "
       "`modelledOn` are words the class reads")
S7G = R + "routes settled item 7g: \"the existing route\" is maintainer wording and goes"
ST = R + "stories leave for the build log (copied there first by rt_01), reasons stay, his rulings keep his words without their dates"

PARAS = [
    # (pins, row, file, the paragraph's opening, note)
    ("quick_checks", "QC-C08", REV, "- the task requires the thinking named by the objective", RVL),
    ("quick_checks", "QC-E11", REV, "- the task requires the thinking named by the objective", RVL),
    ("quick_checks", "QC-P01", REV, "- the task requires the thinking named by the objective", RVL),
    ("success_criteria", "SC-Q01", REV, "- the task requires the thinking named by the objective", RVL),
    ("teach_then_do", "TD-L07", REV, "- the task requires the thinking named by the objective", RVL),
    ("teach_then_do", "TD-L09", REV, "- the task requires the thinking named by the objective", RVL),
    ("starters_sticky_apply", "SA-M08", REV, "- the task requires the thinking named by the objective", RVL),
    ("teach_then_do", "TD-L10", REV, "**The other half of User-fit is whether each Teach board teaches", D34),
    ("quick_checks", "QC-D11", DB, "### 1.2 Two Things", S7C),
    ("quick_checks", "QC-D12", DB, "### 1.2 Two Things", S7C),
    ("quick_checks", "QC-D13", DB, "### 1.2 Two Things", S7C),
    ("quick_checks", "QC-D14", DB, "### 1.2 Two Things", S7C),
    ("quick_checks", "QC-D15", DB, "### 1.2 Two Things", S7C),
    ("quick_checks", "QC-D16", DB, "### 1.2 Two Things", S7C),
    ("starters_sticky_apply", "PF-Q14", CONTENT, "**The slide must carry the takeaway, not only the prompt, and it carries it once.**", ST),
    ("success_criteria", "SC-H47", TASK, "**Launch the task; do not only instruct it.**", D2),
    ("teach_then_do", "TD-A04", LD, "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm:", B13),
    ("teach_then_do", "TD-B07", LD, "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm:", B13),
    ("teach_then_do", "TD-C03", LD, "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm:", B13),
    ("teach_then_do", "TD-D03", LD, "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm:", B13),
    ("teach_then_do", "TD-F13", LD, "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm:", B13),
    ("teach_then_do", "TD-I02", LD, "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm:", B13),
    ("teach_then_do", "TD-J03", LD, "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm:", B13),
    ("teach_then_do", "TD-C19", DIAL, "**Talk** — children discuss the Stimulus.", D1),
    ("teach_then_do", "TD-J20", SKILL, "**A `practise` beat is independent work that is not any one cycle's check.**", D34),
]

PHRASES = [
    # (pins, row, file, old words, new words, note)
    ("quick_checks", "QC-D14", DB,
     "Lower stakes than Brain Dump.", "Lower stakes than Free Recall (1.1).", S7C),
    ("starters_sticky_apply", "SA-E20", LD,
     "For starter, observe, apply and reflect units, `activity` is the actual pupil-facing prompt and must be written "
     "and reviewed as such.",
     "For starter, observe, apply and reflect units, `activity` is the actual pupil-facing prompt and must be written "
     "and reviewed as such; so is a skill `prepare` unit's `activity` in `explanation` mode, which is the explanation "
     "children read on the board, and a task lesson's `modelledOn`, the instance its teaching is shown on.", S7E),
    ("success_criteria", "SC-H03", SKILL,
     "This preserves the existing route's optional explanation", "This preserves the route's optional explanation", S7G),
    ("success_criteria", "SC-H22", LD,
     "or why its question alone is enough.",
     "or why its question alone is enough (" + T13B + ").", B13),
    ("success_criteria", "SC-H29", SKILL,
     "the criteria and the number line and nothing else (the user, 12 September 2026).",
     "the criteria and the number line and nothing else.", ST),
    ("teach_then_do", "TD-J56", DIAL,
     "a ranking, a sort, a four-corners vote", "a ranking, a sort, a vote with a written reason", D1),
    ("subject_files", "SJ-D81", "references/subject-maths.md",
     "(`teaching-sequence-skill-based.md` → Teaching Sequence Specification, `A step the method needs`)",
     "(`teaching-sequence-skill-based.md` → Cycles, and the beats around them, `A step the method needs`)",
     R + "routes settled item 7g: a pointer names its real section (the same pointer as RT-P07)"),
    ("teach_then_do", "TD-Z19", LD,
     "the steps, on the board (`preferences.md` → Slide Philosophy,",
     "the steps, on the board; " + T13B + " (`preferences.md` → Slide Philosophy,", B13),
    ("success_criteria", "SC-R04", CONTENT,
     "`goodLooksLike` is `null` when the success criteria already show what a good one looks like.",
     "`goodLooksLike` is `null` when the success criteria already show what a good one looks like " + ACTUAL + ".",
     B13 + "; the output-block line it came from carries the same limit"),
    ("success_criteria", "SC-R05", TASK,
     "`goodLooksLike` is `null` when the success criteria already show what a good one looks like.",
     "`goodLooksLike` is `null` when the success criteria already show what a good one looks like " + ACTUAL + ".",
     B13 + "; the output-block line it came from carries the same limit"),
]

HOMES = [
    # (pins, file, heading, the opening of each paragraph this release changed, note)
    ("teach_then_do", LD, "### The Teach → Do Rhythm",
     ["`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm:"], B13),
    ("worksheets", LD, "### Worksheet", ["The set that is NOT child-facing is the short and stable one"], S7E),
    ("subject_files", PREF, "### Lesson Designer visual-need boundary",
     ["**Giving a task its instructions is not launching it.**"], B13),
]


def load(name):
    path = ledger_mapping.ROOT / "scripts" / "tests" / f"{name}_ledger_pins.json"
    return path, json.loads(path.read_text(encoding="utf-8"))


def save(path, data):
    # Each pin file keeps its own line endings (a worktree checks them out with
    # LF, the main checkout with CRLF).
    crlf = b"\r\n" in path.read_bytes()
    body = json.dumps(data, indent=1, ensure_ascii=False) + "\n"
    print(f"writing {path}")
    with open(path, "w", encoding="utf-8", newline="") as handle:
        handle.write(body.replace("\n", "\r\n") if crlf else body)


def note_on(row, note):
    if note in row["outcome"]:
        return
    if row["outcome"] == "unchanged in place":
        row["outcome"] = f"unchanged in place until the routes release; then {note}"
    else:
        row["outcome"] += f"; then {note}"


def keep_flags(old, new):
    for key in ("paragraph", "aboveReviewLine"):
        if old.get(key) and key not in new:
            new[key] = old[key]
    return new


def current(rel):
    return norm((ledger_mapping.ROOT / rel).read_text(encoding="utf-8"))


def home_now(rel, heading):
    """A home's paragraphs as the pin test reads them (a home may run to the
    end of its file)."""
    lines = (ledger_mapping.ROOT / rel).read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if ledger_mapping.HEADING.match(lines[i]) and len(ledger_mapping.HEADING.match(lines[i]).group(1)) <= level),
               len(lines))
    body = "\n".join(lines[start + 1:end])
    return [norm(x) for x in body.split("\n\n") if norm(x) and norm(x) != "---"]


# After the merge (`rt_follow_at_merge.py`), a pin that git or the lead's
# resolution already brought to the merged words is left as it is, and checked.
FOLLOW = "--follow" in sys.argv

for name, rid, rel, opening, note in PARAS:
    path, data = load(name)
    row = next(r for r in data["rows"] if r["id"] == rid)
    hits = [p for p in row["present"] if p.get("paragraph") and p["file"] == rel and p["text"].startswith(norm(opening)[:40])
            and p["text"] not in current(rel)]
    if FOLLOW and not hits:
        assert any(p["text"] == paragraph_of(rel, opening) for p in row["present"]), (name, rid, "neither old nor new")
        print("already follows", name, rid)
        continue
    assert len(hits) == 1, (name, rid, len(hits))
    para = paragraph_of(rel, opening)
    assert para and para != hits[0]["text"], (rid, "paragraph not found or unchanged")
    new = keep_flags(hits[0], pin_of(rel, para))
    assert new.get("section") == hits[0].get("section"), (rid, new.get("section"), hits[0].get("section"))
    row["present"][row["present"].index(hits[0])] = new
    note_on(row, note)
    save(path, data)
    print("repinned paragraph", name, rid)

for name, rid, rel, old, new_words, note in PHRASES:
    path, data = load(name)
    row = next(r for r in data["rows"] if r["id"] == rid)
    hits = [p for p in row["present"] if p["file"] == rel and not p.get("paragraph") and norm(old) in p["text"]
            and p["text"] not in current(rel)]
    if FOLLOW and not hits:
        assert any(norm(new_words) in p["text"] and p["text"] in current(rel) for p in row["present"]), \
            (name, rid, "neither old nor new")
        print("already follows", name, rid)
        continue
    assert len(hits) == 1, (name, rid, len(hits))
    new = keep_flags(hits[0], pin_of(rel, hits[0]["text"].replace(norm(old), norm(new_words))))
    if new.get("section") != hits[0].get("section"):
        # A pin named by an enclosing heading (SC-R04 and R05 name `## Output
        # Format Block`, which still holds `### The launch`) keeps its heading
        # while the words are still inside it.
        old_section = hits[0]["section"]
        texts = [text for line, occurrence, _level, text in ledger_mapping.sections_of(rel)
                 if line == old_section["heading"] and occurrence == old_section["occurrence"]]
        assert len(texts) == 1 and new["text"] in texts[0], rid
        new["section"] = old_section
    row["present"][row["present"].index(hits[0])] = new
    note_on(row, note)
    save(path, data)
    print("repinned phrase", name, rid)

for name, rel, heading, openings, note in HOMES:
    path, data = load(name)
    home = next(h for h in data["homes"] if h["file"] == rel and h["heading"] == heading)
    now = home_now(rel, heading)
    if FOLLOW and now == home["paragraphs"]:
        print("already follows", name, heading)
        continue
    assert len(now) == len(home["paragraphs"]), (heading, "the home gained or lost a paragraph")
    changed = [n for n, (was, is_) in enumerate(zip(home["paragraphs"], now)) if was != is_]
    assert sorted(changed) == sorted(n for n, p in enumerate(now) if any(p.startswith(norm(o)[:40]) for o in openings)), \
        (heading, changed)
    for n in changed:
        old_text = home["paragraphs"][n]
        home_rows = [r for r in data["rows"] if r["id"].startswith("HOME-")
                     and any(p["file"] == rel and p["text"] == old_text for p in r["present"])]
        assert len(home_rows) == 1, (heading, n, len(home_rows))
        pin = next(p for p in home_rows[0]["present"] if p["text"] == old_text)
        pin["text"] = now[n]
        home_rows[0]["outcome"] = f"{home_rows[0]['outcome']}; then {note}" if note not in home_rows[0]["outcome"] else home_rows[0]["outcome"]
        print("repinned home paragraph", name, home_rows[0]["id"])
    home["paragraphs"] = now
    save(path, data)

# Every pin in every earlier topic's file must hold against the files as they
# now are; nothing else in them was touched.
EARLIER = ["assumed_knowledge", "quick_checks", "success_criteria", "teach_then_do", "vocabulary", "worksheets",
           "colours", "subject_files", "starters_sticky_apply"]
for name in EARLIER:
    _path, data = load(name)
    for row in data["rows"]:
        for pin in row["present"]:
            assert pin["text"] in current(pin["file"]), (name, row["id"], pin["text"][:100])
    for home in data.get("homes", []):
        assert home_now(home["file"], home["heading"]) == home["paragraphs"], (name, home["heading"])
print("REPIN_OK")
