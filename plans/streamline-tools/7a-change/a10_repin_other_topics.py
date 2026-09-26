"""Release 7A (4.2.293), step 10: the earlier topics' pins whose words this
release changed follow them, in place, each with the decision that changed it
(change plan A14, "Moved in other topics' pin files"), as the worksheets and
colours releases did (`ws-change/w9_repin_other_topics.py`,
`colours-change/k8_repin_other_topics.py`). Every earlier topic's record
builder is frozen; a rerun of one would undo these moves.

A whole-paragraph pin is re-read from its paragraph, found by its opening
words; a phrase pin carries the substitution the change made; each row's
outcome names the decision. No row is added or dropped, no section or paragraph
flag changes except where a phrase followed its rule to another file (WS-B07),
and no barred wording is touched. Vocabulary's definition sentence (VOC-O07)
and the success-criteria sentence of the wall preferences (SC-O05) are
unchanged, so their own pins are untouched; only the paragraphs round them
move."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE))
import _root  # noqa: E402,F401  (a replay on a scratch copy sets LESSONV4_PLUGIN_ROOT)
import ledger_mapping  # noqa: E402
from ledger_mapping import norm, paragraph_of, pin_of  # noqa: E402

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
TMPL = "references/templates.md"
DOBEATS = "references/do-beats.md"
SKILL = "references/teaching-sequence-skill-based.md"
WALLD = "agents/working-wall-designer.md"
WALLR = "agents/working-wall-designer-focused-repair.md"
WALLP = "references/working-wall-preferences.md"
LAYOUT = "working-wall-html/src/layout.js"

R = "release 7A (4.2.293): "
CONTENTS = (R + "the contents block moves once, with every contents edit in it: numbering for the starter in every "
            "subject and the main independent work in maths only (SA neighbour note N2, PF settled item 14), the "
            "Apply's line (the fold), the test question's two exceptions (SA settled item 2), and the reviewer "
            "reading its always-read sections (PF-A29)")
SPLIT = (R + "PF decision 20 (the Lesson 2 plan goes) and the change plan's question 2 (today ends on its main idea; "
         "what the next lesson opens with comes out); the first two sentences, TD-Z10's, stay")
REVIEWER = (R + "SA settled item 2 (\"keep with small fix\"): the test-question line of the reviewer's section 3 "
            "carries both exceptions (the split lines PF decision 20 changed are in section 1)")
WALL = (R + "SA decision 7 and PF decision 22's wording half: room first, a whole sentence always; the "
        "sticky-knowledge statement joins the definition sentence, which is unchanged")
WALL_ORDER = (R + "his answer of 26 September 2026 on a wall card whose sentence does not fit (\"answer to your wall "
              "question, I guess, but I rarely also use cards with no picture or helper, so?\"): the build shrinks the "
              "picture a little, then a list goes over a second card, and the picture comes off only when nothing else "
              "fits; a success-criteria step is still never reworded")
STICKY_THIRD = (R + "his answer of 26 September 2026 on a sticky fact too long to sit beside its photo (\"yys\"): "
                "the photo narrows to about a third of the card and the whole sentence fits beside it, then a shorter "
                "whole sentence, the photo off last of all")
ONE_LONG = (R + "his answer of 26 September 2026 on how many long facts one wall card holds (\"yes\"): one "
            "three-line fact a card, a second on a second card")
STICKY_PLACE = (R + "SA settled item 6, turned round (no fixed rule for where a sticky fact sits; the routes list's 7k): "
                "the skill route's Teach lands its sentence, usually as the headline")
A07 = R + "the mixed-retrieval formats carry SA-A07's conditions in its own words and point at Starters"
N2 = R + "SA neighbour note N2 and PF settled item 14: the numbered helpers' labels are purple and the main independent work is numbered in maths only"

PARAS = [
    # (pins, row, file, the paragraph's opening, note[, the old paragraph's opening when it changed])
    ("assumed_knowledge", "AK-F01", LD, "- **Teaching substance and demand:** Name first", SPLIT),
    ("quick_checks", "QC-B06", LD, "- **Teaching substance and demand:** Name first", SPLIT),
    ("quick_checks", "QC-C08", REV, "- the task requires the thinking named by the objective", REVIEWER),
    ("quick_checks", "QC-E11", REV, "- the task requires the thinking named by the objective", REVIEWER),
    ("quick_checks", "QC-P01", REV, "- the task requires the thinking named by the objective", REVIEWER),
    ("success_criteria", "SC-Q01", REV, "- the task requires the thinking named by the objective", REVIEWER),
    ("teach_then_do", "TD-L07", REV, "- the task requires the thinking named by the objective", REVIEWER),
    ("teach_then_do", "TD-L09", REV, "- the task requires the thinking named by the objective", REVIEWER),
    ("success_criteria", "SC-A02", PREF, "- **Written Voice (House Style)** — what every word", CONTENTS),
    ("teach_then_do", "TD-A12", PREF, "- **Written Voice (House Style)** — what every word", CONTENTS),
    ("vocabulary", "VOC-A03", PREF, "- **Written Voice (House Style)** — what every word", CONTENTS),
    ("success_criteria", "SC-L12", WALLD, "- `[PLUGIN_ROOT]/references/preferences.md` — classroom norms",
     R + "PF decision 22's wording half: the wall designer's Written Voice trigger names a shortened lesson sentence (PF-A54)"),
    ("success_criteria", "SC-O19", WALLP, "| Card type | Length budget per item (rough guide) |",
     R + "SA settled item 12: the sticky row says 106, as the wall test and the designer do, and about 72 once the "
     "build has shrunk the picture a little (his answer on a wall card's order), and about 106 beside a photo "
     "narrowed to a third (his answer on a long sticky fact)"),
    ("success_criteria", "SC-O20", WALLD, "A worked-example step you write that runs past its budget", WALL,
     "A worked-example step or sticky-knowledge statement"),
    ("success_criteria", "SC-O22", WALLR, "A panel too tall for its page, or a second three-line sticky fact, is a layout fault", WALL + "; and " + STICKY_THIRD + "; and " + ONE_LONG,
     "A panel too tall for its page is a layout fault"),
    ("success_criteria", "SC-O04", WALLD, "**Success criteria steps in particular must be verbatim.**", WALL_ORDER),
    ("teach_then_do", "TD-D12", DOBEATS, "### 1.5 Last Lesson / Last Week / Last Term", A07),
    ("teach_then_do", "TD-J18", SKILL, "**A `teach` beat carries knowledge the method leans on", STICKY_PLACE),
    ("teach_then_do", "TD-J19", SKILL, "**Between `prepare` and `teach`, ask whether anything has to survive", STICKY_PLACE),
    ("vocabulary", "VOC-O07", WALLD, "**Prose a child reads stays a whole sentence;", WALL,
     "**Prose a child reads may be condensed to fit;"),
    ("vocabulary", "VOC-O16", WALLP, "**5. Prose a child reads stays a whole sentence;", WALL + "; and " + WALL_ORDER + "; and " + STICKY_THIRD,
     "**5. Prose a child reads may be condensed for the wall;"),
    ("colours", "PF-R97", TMPL, "| Type | What it is |", N2),
]

PHRASES = [
    # (pins, row, file, old words, new words, note)
    ("success_criteria", "SC-O22", WALLR,
     "A panel too tall for its page is a layout fault",
     "A panel too tall for its page, or a second three-line sticky fact, is a layout fault",
     ONE_LONG),
    ("quick_checks", "QC-S46", REV,
     "a named test question is practised at the same structure, scale, response form and demand, with fresh content.",
     "a named test question is practised at the same structure, scale, response form and demand, with fresh content while the real item is held for a later test, unless the teacher explicitly asks for that exact item; a suitable real question that is not being held may be used itself.",
     R + "SA settled item 2 (\"keep with small fix\"): the reviewer's line carries both exceptions"),
    ("success_criteria", "SC-O03", WALLD,
     "**Prose a child reads may be condensed to fit; a contract a child checks against may not.**",
     "**Prose a child reads stays a whole sentence; a contract a child checks against stays word for word.**", WALL),
    ("success_criteria", "SC-O18", WALLP,
     "**4. Two-line maximum on every item.** Nothing — title, step, worked example, sentence stem, reference cell — wraps beyond two lines.",
     "**4. Two lines is what fits an item on a card.** Nothing (title, step, worked example, sentence stem, reference cell) needs more than two lines at the card's smallest type, which is what each item's character budget measures; a roomy card prints the same words larger.",
     R + "PF decision 22's wording half: two lines is what a card holds at its smallest type, not a quota on writing"),
    ("success_criteria", "SC-O20", WALLD,
     "A worked-example step or sticky-knowledge statement that runs past its budget",
     "A worked-example step you write that runs past its budget", WALL),
    ("success_criteria", "SC-O22", WALLR,
     "An item over its own character budget is different: it fits only reworded, and rewording is not this round's to do, so leave that finding unrepaired and say it needs the wall designer's wording.",
     "An item over its own character budget is different: it needs its card's room first (a list over a second card), then a shorter whole sentence, the picture off last; all are the wall designer's, not this round's, so leave that finding unrepaired and say it needs the wall designer.",
     WALL + "; and " + WALL_ORDER + "; and " + STICKY_THIRD),
    ("success_criteria", "SC-O22", WALLR,
     "say instead that its card needs room (its picture off unless its steps need it, or its list over two cards).",
     "say instead that its card needs room (its list over two cards, its picture off only when nothing else fits).",
     WALL_ORDER),
    ("success_criteria", "SC-O04", WALLD,
     "make room: take the card's picture off unless the steps need it (about 106 characters a step instead of 62), drop non-SC extras, or carry the list in order over two cards of the same type and title when the wall has room for both;",
     "make room: drop non-SC extras, carry the list in order over two cards of the same type and title when the wall has room for both, and only when nothing else fits take the card's picture off, unless the steps need it (about 106 characters a step instead of 62);",
     WALL_ORDER),
    ("success_criteria", "SC-O19", WALLP,
     "the card makes room instead (no picture unless the steps need it, or the list over two cards).",
     "the card makes room instead (the list over two cards, and the picture off only when nothing else fits).",
     WALL_ORDER),
    ("success_criteria", "SC-DEC-12", LAYOUT,
     "a success-criteria step is never reworded, so its card makes room instead (the picture off unless the steps need it, or the list over two cards)",
     "a success-criteria step is never reworded, so its card makes room instead (the list over two cards, and the picture off only when nothing else fits)",
     WALL_ORDER),
    ("success_criteria", "SC-DEC-12-WALL", WALLP,
     "shorten faithful display text (never a success-criteria step, which is copied word for word)",
     "shorten faithful display text to a whole sentence (never a success-criteria step, which is copied word for word)",
     WALL + "; a success-criteria step is still never shortened"),
    ("success_criteria", "SC-DEC-12-WALL", WALLD,
     "a success-criteria step is the exception (Rules That Never Change).",
     "A success-criteria step is never written short: it is copied, and the card makes room (Rules That Never Change).",
     WALL + ": making room is now the first move for every sentence the lesson wrote, so the sentence that said a success-criteria step was the exception to keeping the picture went, and the section's own sentence carries decision 12"),
    ("success_criteria", "SC-DEC-12", LAYOUT,
     "otherwise remove an item or shorten the longest, never a success-criteria step, which is copied word for word",
     "otherwise remove an item or shorten the longest to a whole sentence, never a success-criteria step, which is copied word for word",
     WALL),
    ("teach_then_do", "TD-D12", DOBEATS,
     "**Best for:** the starter of lesson 2+ in a sequence.",
     "**Best for:** the starter of lesson 2+ in a sequence, when the teacher requests mixed retrieval or the wider sequence gives it a clear purpose and children have enough security to choose productively between methods or knowledge (`preferences.md` → Starters).",
     A07),
    ("vocabulary", "VOC-O07", WALLD,
     "Free-standing prose that no child is matching word for word — a worked-example modelled sentence, a sticky-knowledge statement, a sentence stem's framing — may be tightened to come inside the card's budget,",
     "Free-standing prose that no child is matching word for word (a worked-example modelled sentence, a sentence stem's framing) may be tightened to come inside the card's budget,",
     WALL),
]

# WS-B07's phrase followed its rule to another file: phrasing consistency moved
# from the lesson designer's Sticky Knowledge to its home in preferences.
MOVED = [
    ("worksheets", "WS-B07", LD, "Cross-slide repetition - phrase on Teach matches Practise reference later, worksheet, Apply.",
     PREF, "The repetition is across slides: the phrase on the Teach matches the later Practise reference, the worksheet, the Apply and the working wall,",
     R + "the fold (SA-H08): phrasing consistency moved to preferences.md -> Sticky Knowledge in full prose, naming the worksheet as before and now the working wall (SA decision 7)"),
]


def load(name):
    path = ledger_mapping.ROOT / "scripts" / "tests" / f"{name}_ledger_pins.json"
    return path, json.loads(path.read_text(encoding="utf-8"))


def save(path, data):
    print(f"writing {path}")
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def note_on(row, note):
    if note in row["outcome"]:
        return
    if row["outcome"] == "unchanged in place":
        row["outcome"] = f"unchanged in place until 4.2.293; then {note}"
    else:
        row["outcome"] += f"; then {note}"


def keep_flags(old, new):
    for key in ("paragraph", "aboveReviewLine"):
        if old.get(key) and key not in new:
            new[key] = old[key]
    return new


for name, rid, rel, opening, note, *was in PARAS:
    path, data = load(name)
    row = next(r for r in data["rows"] if r["id"] == rid)
    old_opening = was[0] if was else opening
    hits = [p for p in row["present"] if p.get("paragraph") and p["file"] == rel and p["text"].startswith(norm(old_opening)[:40])
            and p["text"] not in norm((ledger_mapping.ROOT / rel).read_text(encoding="utf-8"))]
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
    hits = [p for p in row["present"] if p["file"] == rel and not p.get("paragraph") and norm(old) in p["text"]]
    assert len(hits) == 1, (name, rid, len(hits))
    new = keep_flags(hits[0], pin_of(rel, hits[0]["text"].replace(norm(old), norm(new_words))))
    assert new.get("section") == hits[0].get("section"), (rid, new.get("section"), hits[0].get("section"))
    row["present"][row["present"].index(hits[0])] = new
    note_on(row, note)
    save(path, data)
    print("repinned phrase", name, rid)

for name, rid, old_rel, old, new_rel, new_words, note in MOVED:
    path, data = load(name)
    row = next(r for r in data["rows"] if r["id"] == rid)
    hits = [p for p in row["present"] if p["file"] == old_rel and p["text"] == norm(old)]
    assert len(hits) == 1, (name, rid, len(hits))
    row["present"][row["present"].index(hits[0])] = pin_of(new_rel, new_words)
    note_on(row, note)
    save(path, data)
    print("moved phrase", name, rid)

# Every pin in every earlier topic's file must hold against the files as they
# now are; nothing else in them was touched.
for name in ("assumed_knowledge", "quick_checks", "success_criteria", "teach_then_do", "vocabulary", "worksheets",
             "colours", "subject_files"):
    _path, data = load(name)
    for row in data["rows"]:
        for pin in row["present"]:
            text = norm((ledger_mapping.ROOT / pin["file"]).read_text(encoding="utf-8"))
            assert pin["text"] in text, (name, row["id"], pin["text"][:100])
print("REPIN_OK")
