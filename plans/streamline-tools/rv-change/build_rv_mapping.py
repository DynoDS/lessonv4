"""The design reviewer mapping and pins (topic 8, release 2).

Every row of `plans/2026-09-23-design-reviewer-ledger.md` (428) is pinned: a row
whose words still stand is pinned where they now sit; a changed row names the
decision that changed it, the words that now carry it and the words that went,
and its whole paragraph is pinned; words a decision added that no row quoted are
their own rows; the reviewer's instructions are its home, pinned paragraph by
paragraph, section by section. `ledger_mapping.build` checks every phrase
against the files before anything is written.

Rows three earlier releases changed after the ledger's snapshot (4.2.288's
working tree) are mapped to the words those releases left, with the release
that changed them: the success-criteria release (4.2.288, S39), the worksheets
release (4.2.290, K10, L02, L08, T22) and the subject-files release (4.2.291,
T05 to T08; T06 to T08 lived in files it removed, so they are held by those
files staying gone, as that release's own builder holds them).

Release 7A (topic 7, 4.2.293) is merged before this release. It changes seven
rows of this ledger (H12, H14, J48, K02, S05, S25, T11; its mapping's last
section). On this branch those rows stand as the ledger quotes them; on the
merged tree they carry 7A's words. So this builder reads which tree it is on
(7A's reviewer line is present or it is not) and maps the seven rows to 7A's
words only when they are there. After the merge the lead reruns it once, then
it is frozen like every finished topic's builder.

    python -X utf8 plans/streamline-tools/rv-change/build_rv_mapping.py
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger_mapping  # noqa: E402
from ledger_mapping import P, Q, REPO, ROOT, build, norm  # noqa: E402

print(f"plugin: {ROOT}")
print(f"plans: {REPO / 'plans'}")

LEDGER = "2026-09-23-design-reviewer-ledger.md"
PINS = "scripts/tests/design_reviewer_ledger_pins.json"
MAPPING = "2026-09-26-design-reviewer-mapping.md"

REV = "agents/design-reviewer.md"
PACKET = "scripts/design-review-packet.py"
FIXTURE = "scripts/tests/fixtures/design-reviewer-behaviour-cases.json"
LOG = "references/build-review-log.md"
PREF = "references/preferences.md"
ADAPT = "agents/adaptation-designer.md"
GEOGRAPHY = "references/subject-geography.md"
SKILL = "skills/make-subject-file/SKILL.md"
GUIDE = "references/authoring-subject-files.md"
REMOVED_FILES = (SKILL, GUIDE)

# A removed file reads as empty, so its phrases are "gone from it" (the
# subject-files builder's own handling, repeated here for its rows T06 to T08).
_text_of = ledger_mapping.text_of


def text_of(rel: str) -> str:
    if rel in REMOVED_FILES:
        assert not (ROOT / rel).exists(), f"{rel} should have been removed"
        return ""
    return _text_of(rel)


ledger_mapping.text_of = text_of


def ledger_rows():
    rows = {}
    for raw in (REPO / "plans" / LEDGER).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\| (RV-[A-Z]\d{2}) \|", raw)
        if not m:
            continue
        p = P.search(Q.sub("", raw))
        if p and m.group(1) not in rows:
            rows[m.group(1)] = (p.group(1), Q.findall(raw))
    return rows


ROWS = ledger_rows()
assert len(ROWS) == 428, len(ROWS)


def quotes(rid):
    return ROWS[rid][1]


def keep(rid, *indexes):
    """The row's own quotes that still stand, pinned where they sit."""
    rel, qs = ROWS[rid]
    return [(rel, qs[i]) for i in (indexes or range(len(qs)))]


# --- His words (the ledger's "His answers, 24 September (afternoon)").
D2 = ("decision 2 (his 1, then \"1. y\"): \"if it's a small thing, say it's words aren't right and it thinks these "
      "words would be better, then the reviewer changes them ... Swapping a photo of a number line for a drawn one or "
      "rewriting a doobie. Sounds like it should be for the lesson designer\"; read back and agreed: small wording "
      "fixes are the reviewer's; a picture swap or a rewritten Do beat goes to the lesson designer, with the reviewer "
      "naming the fix")
D7 = ("decision 7 (his 2, \"2. yes\"): the three sections the reviewer's checks point at, for cases the routing card "
      "never listed, go on the card beside their sections, each trigger firing on something the reviewer can see")
S4 = ("settled item 4 (his b, stronger): \"maybe it should look at the board first. Judge the board first ... So maybe "
      "it should be board first, speaker notes separate\"; \"together\" goes, because it could let the reviewer count "
      "something as covered because it is in the notes")
S5 = "settled item 5 (his c, \"yes\"): out-of-date text says what is true now"
S10 = "settled item 10 (his g, \"sure\"): one copy of each rule; each near-repeat keeps its own words"
S11 = ("settled item 11 (his h, \"sure\"): the dated incident leaves for the build log, where the release copied its "
       "sentences first; the reason stays")
READER = ("the lead's reading of his words, not his own wording: on the rest-of-preferences list (24 September) he "
          "said \"I actually don't know why it says nine-year-old. Um, because the plugin is for years one, two, three, "
          "four, five, and six, right?\" of other lines, and the lead carried it to this one (the change plan, section "
          "3); \"the actual child in this class\" is the lead's wording for the reader the sweep imagines")

C10 = ("his answer of 26 September, asked after the release's first check (the lead's record in this ledger, \"His "
       "answers\"): with the example \"Look at the diagram.\", asked whether the reviewer rewrites it itself as what "
       "children will notice (\"Notice the enamel is the hardest layer.\"), he answered \"yes\". His decision 2 words "
       "keep a wording fix with the reviewer (\"if it's a small thing, say it's words aren't right and it thinks these "
       "words would be better, then the reviewer changes them\"). So the row is unchanged, the reviewer's own bounded "
       "correction; the release first sent it to the lesson designer, and those words are barred")

# --- The new words, as they now stand.
C10_KEPT = ("Repair it to what they will notice, or, when the picture's own label already names the thing, take the line "
            "off the board and let the key question do the pointing (`teaching-sequence-content-based.md` → "
            "`explanation`, part 3).")
J34_NEW = ("The repair keeps the chunk and is the Lesson Designer's, because it changes what children have to think: "
           "return it naming the fix, which asks for the because, one link in the chain, a prediction the idea decides, "
           "what changes when one condition changes, the words turned into a diagram or a diagram the Teach did not "
           "explain turned back into words, the detail in fresh evidence that shows the idea, or which of two "
           "explanations a child could genuinely believe is better (`preferences.md` → The Teach → Do → Teach → Do "
           "Rhythm, `Name what the chunk needs children to do with it`; `do-beats.md` §10).")
M14_NEW = ("**The drawn-tool check.** A number line, place-value chart, bar model, array, fraction wall, coordinate "
           "grid, Venn or clock face is the engine's to draw, and a photograph of one is a worse version of a thing "
           "already done properly. Return it to the Lesson Designer, naming the helper that should draw it.")
I07_NEW = ("Judge the visible explanation first, on its own, and the spoken one separately, so nothing counts as taught "
           "on the board because the script says it; do not solve a missing connection merely by adding words to an "
           "already crowded slide.")
O14_NEW = ("A failed check sends your corrections to a focused repair and, only if that fails, the whole design to a "
           "fresh attempt, which delays every resource in the lesson so that one sentence can be shortened; shortening "
           "it here costs you a minute.")
P06_NEW = ("## Voice sweep Read [N] child-facing strings as a Year [Y] child; repaired [M]. Closest to a repair: > \"the "
           "exact string\" - why it stands > \"the exact string\" - why it stands > \"the exact string\" - why it "
           "stands")
J18_NEW = ("- each major beat changes the state of the lesson and the next builds from it: read the beats in order and "
           "name what each changes and what later depends on it. The design states this in each unit's `unlocks`, so "
           "read the recorded line against the beat that follows rather than only forming your own view:")
K03_NEW = ("The first wording pass above owns the voice sweep. Here judge the wording you noted in its teaching "
           "context.")
P09_P12 = ("Use `APPROVED` when no purposeful lesson decision remains defective. Local corrections and teacher flags "
           "may exist. Use `REDESIGN REQUIRED` when one or more purposeful lesson decisions must change.")
C07_NEW = ("**The other half of User-fit is whether each Teach board teaches, and its calibration is `preferences.md` → "
           "Pride Lessons, `What a Teach slide holds`.** Amount catches too much; this catches too little.")
C13_NEW = ("A script line such as `He wasn't a king who could order everybody to obey him` or `People sometimes call "
           "the whole front of their body their tummy, but the stomach is this one organ`, with no counterpart on the "
           "board, is that finding.")
F09_NEW = "A string read inside JSON braces beside its field name is read as a specification."
G05_NEW = "A count line alone is what a sweep that happened and a sweep that did not both produce."
G21_NEW = ("`What do their reasons share?` printed over a script saying `Tell your partner what is the same and what is "
           "different` is the shape: the plain version is already written, and the class gets the clever one.")
D06_NEW = ("so a script in curriculum-writer English or a model answer with machine rhythm reaches the class exactly as "
           "written, and the teacher would have to edit it out by hand.")
L10_NEW = ("Read the forms rather than confirming the objective matches. Where the sheet moves into a form the lesson "
           "never used, say whether the lesson should have met it once first rather than only flagging the sheet;")
L11_NEW = ("A sheet whose questions are all `written-explanation` and `short-answer` is the shape this check exists to "
           "catch, as in a *name the layers of teeth* sheet that asked for three names on three ruled lines under an "
           "unused diagram.")
G09_NEW = ("Read each one first as the child: the actual child in this class, who has not read the plan, and then as the "
           "teacher saying it.")
S16_NEW = ('"instructions only." " Read its `Lesson Designer content boundaries` too whenever the " "view\'s '
           '`Names on the board` lists a real person, place, " "organisation or event, for `A name, or a thing the class '
           'has " "never met, arrives with its context`; a made-up person or a label " "such as `Chart A` is not this '
           'case.",')
S22_NEW = ('"units genuinely name no such thing is right to have none." " Read it too whenever a beat quotes, voices or '
           'names a made-up " "person who is present in it, for `A person the lesson invents " "counts as something in '
           'the world`; one only referred back to is " "not this case.",')
S30_NEW = ('"teaches, and any beat that invites children\'s own experience." " Read it too when a made-up person or story '
           'stands for a group " "the objective is about (`An invented case is evidence about the " "group`).",')

# The stories as the release copied them into the log (`rv_01_stories_first.py`).
LOGGED = {
    "RV-C06": "The lesson that shows the gap: a Year 4 history design was approved here on 10 September 2026",
    "RV-C08": "the plugin approved a deck that failed it on 14 September 2026 (a photograph, `A Tudor farm household`",
    "RV-C13": "On 22 September 2026 two lessons in a row were approved with `each Teach board can be taught with notes "
              "closed` while every Teach script carried a reason or a refusal the board did not",
    "RV-F09": "and that is how a class met `What does one visible detail suggest about this class?` after a review that "
              "found nothing.",
    "RV-G05": "`Read 66 child-facing strings as a Year 4 child; repaired 0.` was the whole sweep on a Year 4 PSHE lesson",
    "RV-G21": "An RE beat printed `What do their reasons share?` over a script saying `Tell your partner what is the same "
              "and what is different`; the plain version was already written and the class got the clever one.",
    "RV-M06": "A Year 4 RE deck passed this review with two children's reasons on the board as text cards and its own "
              "carol-singing photograph unused.",
    "RV-L10": "This is the check that was too thin to catch a place-value-chart lesson whose sheet had no chart on it",
    "RV-L11": "it was the shape of every sheet counted on 12 September 2026, including a *name the layers of teeth* sheet",
    "RV-D06": "and today the teacher edits it out by hand.",
}

CHANGED = {
    # Decision 2.
    "RV-C10": (f"kept as it is, the reviewer's: {C10}",
               [(REV, "An example written as an instruction to look (`Follow the tube down from the mouth on the "
                      "diagram`) is the example missing rather than present: the board sent the class to the picture "
                      "and named nothing for them to find when they got there."), (REV, C10_KEPT)],
               [(REV, "Return it to the Lesson Designer, naming the fix: the line rewritten as what they will notice")]),
    "RV-J34": (f"{D2}: a Do that says its Teach back goes back to the Lesson Designer, because the repair changes what "
               "children have to think; the list of repairs and both pointers are unchanged",
               [(REV, J34_NEW)],
               [(REV, "The repair is local and keeps the chunk: ask for the because")]),
    "RV-M14": (f"{D2}: a photograph of a tool the engine draws goes back to the Lesson Designer, naming the helper that "
               "should draw it (the after-review check refuses any change to the photographs, and adding or removing a "
               "photograph was never the reviewer's); M15, the real-world referent, is unchanged",
               [(REV, M14_NEW)],
               [(REV, "Raise it as a correction naming the helper that should draw it.")]),
    # Decision 7 (code). Each trigger's earlier lines are unchanged, and the
    # reviewer's pointers (F12 to Slide Philosophy, M05 to the visual-need
    # boundary, C18 to Source and Scenario Integrity) are now opened by the
    # card, so F20 ("your whole reading assignment") is true.
    "RV-S16": (f"{D7}: Slide Philosophy's trigger gains the name case, fired by a real person, place, organisation "
               "or event the view's `Names on the board` lists (the paragraph's own words; a made-up person or a label "
               "such as `Chart A` is not the case, after the first check found any listed name fired it on 20 of 53 "
               "saved designs for nothing), opening only the subsection that holds its paragraph; F12 points here",
               keep("RV-S16") + [(PACKET, S16_NEW)], []),
    "RV-S22": (f"{D7}: the visual-need boundary's trigger gains the made-up person present in a beat, with the "
               "section's own limit (one only referred back to is not this case); M05 points here",
               keep("RV-S22") + [(PACKET, S22_NEW)], []),
    "RV-S30": (f"{D7}: Source and Scenario Integrity's trigger gains the made-up case standing for a group the "
               "objective is about; C18 points here, and the section brings its limits (a case whose person is the "
               "subject, and a maths or English scenario, need no group sentence)",
               keep("RV-S30") + [(PACKET, S30_NEW)], []),
    # Settled item 4.
    "RV-I07": (f"{S4}; the second half is unchanged, and C15's \"read the two together\" stays, because it is the "
               "board-first comparison that finds a sentence only the script teaches",
               [(REV, I07_NEW)],
               [(REV, "Judge the spoken and visible explanation together")]),
    # Settled item 5.
    "RV-O14": (f"{S5}: a failed check now goes to the reviewer's own focused repair first, and only then to a fresh "
               "design attempt; the reason (a minute here against a round later) stays",
               [(REV, O14_NEW)],
               [(REV, "The orchestrator can only answer a failed check by sending the whole design back for repair")]),
    "RV-P06": (f"{S5}: the report shape shows, under the count line, the `Closest to a repair:` line and the three "
               "quoted strings the after-review check already refuses a report without",
               [(REV, P06_NEW)], []),
    "RV-J18": (f"{S5}: \"now\" goes from a note about a past change; the field is simply there",
               [(REV, J18_NEW)],
               [(REV, "The design now states this in each unit's `unlocks`")]),
    # Settled item 10.
    "RV-E05": (f"{S10}: the cut duplicate of the validator list, which holds it (E02)",
               keep("RV-E02"),
               [(REV, "Do not recheck identifier or reference legality.")]),
    "RV-K09": (f"{S10}: the cut pointer to the amount test, which the User-fit judgement owns (C02)",
               keep("RV-C02"),
               [(REV, "- each moment carries only what the class can take in at once (the User-fit judgement above "
                      "owns that test; do not run it twice);")]),
    "RV-N14": (f"{S10}: the cut repeat of the reading order; the reading list's step 11 (F18) and the walk-through "
               "step (F15) hold it",
               keep("RV-F18") + keep("RV-F15"),
               [(REV, "Then read the closing decisions of `design-decisions.md`, the part you left until now.")]),
    "RV-P12": (f"{S10}: moved word for word beside P09, as one paragraph, so the two results are defined together",
               [(REV, P09_P12)], []),
    "RV-K03": (f"{S10}: the middle sentence stays; \"do not repeat a separate whole-lesson sweep\" was G02's \"Do not "
               "perform separate whole-lesson rereads for each one\" said again",
               [(REV, K03_NEW)] + keep("RV-G02"),
               [(REV, "do not repeat a separate whole-lesson sweep")]),
    # Settled item 11, the stories.
    "RV-C06": (f"story retired to the build log: {S11}; the reason is C02 to C05, which stay",
               [(LOG, LOGGED["RV-C06"])],
               [(REV, LOGGED["RV-C06"])]),
    "RV-C08": (f"{S11}: the sentence ends at \"this catches too little\"; his words stay in `preferences.md` (Slide "
               "Philosophy, and the Tudor calibration)",
               [(REV, C07_NEW), (LOG, LOGGED["RV-C08"])],
               [(REV, LOGGED["RV-C08"])]),
    "RV-C13": (f"{S11}: the two script lines stay, as plain examples of the finding",
               [(REV, C13_NEW), (LOG, LOGGED["RV-C13"])],
               [(REV, "On 22 September 2026 two lessons in a row were approved")]),
    "RV-F09": (f"{S11}: the reason stays",
               [(REV, F09_NEW), (LOG, LOGGED["RV-F09"])],
               [(REV, LOGGED["RV-F09"])]),
    "RV-G05": (f"{S11}: its last clause, the reason the closest calls exist, stays",
               [(REV, G05_NEW), (LOG, LOGGED["RV-G05"])],
               [(REV, "was the whole sweep on a Year 4 PSHE lesson")]),
    "RV-G21": (f"{S11}: `What do their reasons share?` over its script stays as a plain example",
               [(REV, G21_NEW), (LOG, LOGGED["RV-G21"])],
               [(REV, "An RE beat printed `What do their reasons share?`")]),
    "RV-M06": (f"story retired to the build log: {S11}; the check it told (M05) and its limit (M07) stay",
               [(LOG, LOGGED["RV-M06"])],
               [(REV, LOGGED["RV-M06"])]),
    "RV-D06": (f"{S11}: \"today the teacher edits it out by hand\" was a moment written as a reason; the reason stays "
               "as \"the teacher would have to edit it out by hand\"",
               [(REV, "A child-facing or spoken string in the wrong register is not polish. Every authored "
                      "string ships verbatim - no downstream agent is permitted to reword it -"),
                (REV, D06_NEW), (LOG, LOGGED["RV-D06"])],
               [(REV, LOGGED["RV-D06"])]),
    "RV-L10": (f"{S11} (the worksheets plan's Q10, left to this release): the instruction stays",
               keep("RV-L10", 0, 1) + [(REV, L10_NEW), (LOG, LOGGED["RV-L10"])],
               [(REV, LOGGED["RV-L10"])]),
    "RV-L11": (f"{S11} (the worksheets plan's Q11, left to this release): the teeth sheet stays as a plain undated "
               "example, as the lesson designer's components keep it",
               [(REV, "- **the response forms fit the objective, read across the whole sheet.** Take each question's "
                      "`responseForm` and ask what the objective's verb actually asks a child to do"),
                (REV, L11_NEW), (REV, quotes("RV-L11")[2]), (LOG, LOGGED["RV-L11"])],
               [(REV, LOGGED["RV-L11"])]),
    # The fixed reader.
    "RV-G09": (READER, [(REV, G09_NEW)], [(REV, "the actual eight- or nine-year-old the year group names")]),
    # Rows earlier releases changed after this ledger's snapshot.
    "RV-K10": ("changed by the worksheets release (4.2.290, its WS-I05, settled item a: every sheet is done in "
               "class): needed support omitted from a sheet is checked against what the board or the working wall "
               "shows while children work",
               [(REV, "- support remains where it enables the intended thinking, and its words still fit each task "
                      "using it."),
                (REV, "For needed support omitted from a sheet, check whether the board or the working wall shows it "
                      "while children work before making a finding (every sheet is done in class);")], []),
    "RV-L02": ("changed by the worksheets release (4.2.290, its WS-Q02, decision 2): the sheet never repeats the "
               "practice slide's questions",
               [(REV, "- the work serves its stated practice purpose: the sheet never repeats the practice slide's "
                      "questions (in maths, different numbers and contexts; in a lesson working towards one question, "
                      "the sheet may be that question, answered once);")], []),
    "RV-L08": ("changed by the worksheets release (4.2.290, its WS-Q08, settled item b): the sheet's time sits inside "
               "the lesson",
               [(REV, "The sheet's time sits inside the lesson's minutes, in the beat it replaces or the independent "
                      "work the slides leave room for, never set for another time or added on top;")], []),
    "RV-S39": ("changed by the success-criteria release (4.2.288, its SC-N08): the view heads a sheet with every place "
               "the criteria were shown",
               [(PACKET, "return f\"Worksheet (done beside the success criteria shown above at {' and at '.join(places)})\"")],
               []),
    "RV-T05": ("changed by the subject-files release (4.2.291, its SJ-G45, settled item 7): the reviewer reads the "
               "finished design against the whole subject file and never sees a book",
               [(GEOGRAPHY, "The design reviewer reads the finished design against this file and asks whether it reads "
                            "as the subject.")],
               [(GEOGRAPHY, "The design-reviewer reads the book at the end of the lesson")]),
    "RV-T22": ("changed by the worksheets release (4.2.290, its WS-L39, settled item m): the reviewer runs before the "
               "Below and Greater Depth sheets exist, so \"and what the reviewer checks\" went (this ledger's settled "
               "item 9)",
               [(ADAPT, "That is what the worksheet designer realises; a support decision left implicit is one nobody "
                        "downstream can tell from an oversight.")],
               [(ADAPT, "That is what the worksheet designer realises and what the reviewer checks")]),
}
REMOVED = ("retired: removed with its file by the subject-files release (4.2.291), his decisions 1 and 3 on that "
           "list (24 September): \"forget about 'writing a new subject file' guidance. it should just knowe the files "
           "it has, nothing around what could be added in future.\" and \"just remove it completely\"")
for rid in ("RV-T06", "RV-T07", "RV-T08"):
    rel, qs = ROWS[rid]
    assert rel in REMOVED_FILES
    CHANGED[rid] = (REMOVED, [], [(rel, q, "local") for q in qs])

# --- Release 7A's rows, mapped to its words only on the merged tree.
SEVEN_A_MARK = "a lesson that left learning for another lesson says so, honestly and visibly, in the walk-through;"
SEVEN_A = norm(SEVEN_A_MARK) in text_of(REV)
print("release 7A's words are", "present: its seven rows follow them" if SEVEN_A else "not on this tree")
if SEVEN_A:
    A = "changed by release 7A (topic 7, 4.2.293)"
    CHANGED.update({
        "RV-H12": (f"{A}, its SA-M16: the reviewer's split lines read against the walk-through",
                   [(REV, "- what the walk-through says was left for another lesson is not taught early;")],
                   [(REV, "- deferred learning is not taught early;")]),
        "RV-H14": (f"{A}, its SA-M16",
                   [(REV, "- " + SEVEN_A_MARK)],
                   [(REV, "- any lesson split is honest and visible;")]),
        "RV-J48": (f"{A}, its SA-M08: the test-question line carries both exceptions",
                   [(REV, "- a named test question is practised at the same structure, scale, response form and "
                          "demand, with fresh content while the real item is held for a later test, unless the "
                          "teacher explicitly asks for that exact item; a suitable real question that is not being "
                          "held may be used itself.")], []),
        "RV-K02": (f"{A}, its SA-J47: `Apply` is a slot name outside maths only (this ledger's settled item 8)",
                   [(REV, "A label naming a slot rather than a move (`Still part of the lesson`, or `Apply` outside "
                          "maths, where the teacher wants the plain words `My Turn`, `Our Turn`, `Your Turn`, "
                          "`Answers` and `Apply`) is a bounded correction under `preferences.md` → Slide Headings; "
                          "write the move a child is making.")], []),
        "RV-S05": (f"{A}, its PF-X46: the Pride Lessons note",
                   [(PACKET, quotes("RV-S05")[0]),
                    (PACKET, "calibration for how much one beat puts in front of the class, and it ")], []),
        "RV-S25": (f"{A}, its SA-M13: the Apply trigger",
                   [(PACKET, "Read when Apply may be unearned or repeat Your Turn, and when a lesson ")], []),
        "RV-T11": (f"{A}, its PF-A04: the preferences contents line names the always-read sections (this ledger's "
                   "settled item 5, carried by 7A)",
                   [(PREF, "The Design Reviewer receives a compact runtime routing card: it reads the sections the "
                           "card marks as always read in every review, and any other named section only when its "
                           "trigger applies.")],
                   [(PREF, "reads only the named section when its trigger applies")]),
    })

# --- Words the decisions added that no row quoted.
ADDED = [
    ("RV-DEC-02-FIXTURE",
     f"{D2}: the reviewer's behaviour fixture gains its two send-backs, each REDESIGN REQUIRED, owner Lesson Designer, "
     f"the reviewer naming the fix and not making it; and, by {C10}, the Teach example written as an instruction to "
     "look as the reviewer's own bounded correction",
     [(FIXTURE, '"id": "teach-example-written-as-an-instruction-to-look-is-rewritten",'),
      (FIXTURE, '"id": "do-that-says-its-teach-back-goes-back-named",'),
      (FIXTURE, '"id": "photograph-of-a-drawn-tool-goes-back-named",'),
      (FIXTURE, '"protectedBehaviour": "An example written as an instruction to look is the example missing; the '
                'reviewer rewrites it itself as what children will notice (`Notice the enamel is the hardest layer.`), '
                'or takes the line off the board when the picture\'s own label already names the thing and the key '
                'question does the pointing."'),
      (FIXTURE, '"forbiddenFinding": "Do not send a line of words back to the Lesson Designer; make the wording fix '
                'yourself. A board that honestly lacks a part, with nothing in the script supplying it, is not this '
                'finding."'),
      (FIXTURE, '"forbiddenFinding": "Do not make the change yourself; name it. Do not return a quick check on a case '
                'the Teach did not show, or a term used on a fresh case when the term\'s exact wording is the '
                'learning."'),
      (FIXTURE, '"forbiddenFinding": "Do not make the change yourself; name it. Do not return a photograph of a '
                'real-world referent (a real measuring jug, real coins, a real shelf label) or a picture the helper '
                'check\'s rescue route produced."')]),
    ("RV-DEC-LOG-SENTENCES",
     "the release's second check (item 1): three sentences of this release's build-log entry are pinned, so none "
     "can change unseen: C10 staying the reviewer's by his answer; what happens after two send-backs, said as the "
     "playbook's words and the missing program check (carried to the playbook's run-faults release), not as a floor "
     "a program holds; and the name case's count on the saved designs",
     [(LOG, "A Teach example written as an instruction to look stays the reviewer's own wording fix, word for word as "
            "it was: the release first sent it to the designer, the first independent check found his words keep a "
            "wording fix with the reviewer, and asked with \"Look at the diagram.\" whether the reviewer rewrites it "
            "itself as what children will notice (\"Notice the enamel is the hardest layer.\"), he said \"yes\" (26 "
            "September)."),
      (LOG, "If the review after the second still finds one, the playbook tells the run to build the lesson from the "
            "last design, which still passes every check, to carry the unresolved finding into the run report's "
            "blocking faults and his teacher flags, to lead his report with it, and never to end the run complete; "
            "the fix it named is not made. That last part is held by the playbook's words, not by a program: the run "
            "report check passes a report marked complete while the last review still says `REDESIGN REQUIRED`, if "
            "the finding was not carried over. The missing check is carried to the playbook's run-faults release."),
      (LOG, "Its first wording, any listed name, fired on 41 of the 53 saved designs"),
      (LOG, "and in the paragraph's own words it fires on 19 of the 53 (`plans/streamline-tools/rv-name-trigger.md`, "
            "design by design).")]),
    ("RV-DEC-NAMES-FROM-SCRIPT",
     "the release's second check (item 2): the review view's name list takes a one-word name that opens its board "
     "sentence (`England, 1485 to 1603.`) when the teacher's script capitalises it mid-sentence, as the board's own "
     "mid-sentence capitals already vouched; the script only vouches, so a name only the script says is never listed",
     [(PACKET, "def spoken_reading(design: dict) -> list[str]:"),
      (PACKET, "    for spoken in spoken_reading(design):"),
      (PACKET, "        for name in board_names_in(spoken):"),
      (PACKET, "# capitalises mid-sentence is. The script only vouches for a word; a name"),
      (PACKET, "# only the script says is not listed, because the class cannot read it.")]),
]

# The reviewer's instructions are this topic's home: every section below the
# title, paragraph by paragraph, so a rule added, dropped or reordered anywhere
# in them is caught.
HOMES = [
    (REV, "## Material-defect boundary", "HOME-RV-BOUNDARY"),
    (REV, "## Trust deterministic validation", "HOME-RV-TRUST"),
    (REV, "## What to read", "HOME-RV-READ"),
    (REV, "## Review method", "HOME-RV-METHOD"),
    (REV, "## Cross-section consistency", "HOME-RV-CONSISTENCY"),
    (REV, "## Correction and ownership boundary", "HOME-RV-CORRECTION"),
    (REV, "## Output", "HOME-RV-OUTPUT"),
]

# ledger_mapping's home reader stops at the next heading at the same level and
# does not reach a file's end; `## Output` is the last section, so it is read to
# the file's end here, as the shared checks read it.
from ledger_mapping import HEADING  # noqa: E402


def home_paragraphs(rel: str, heading: str) -> list[str]:
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level), len(lines))
    return [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]


ledger_mapping.home_paragraphs = home_paragraphs

build(
    ledger=LEDGER, prefix="RV", changed=CHANGED, added=ADDED, homes=HOMES, pins=PINS, mapping=MAPPING,
    title="The design reviewer: where each row went (topic 8, release 2)",
    snapshot=("b1c2d427 (4.2.292) with the design reviewer release built on its side branch, 26 September 2026"
              + ("; rebuilt on the tree merged with release 7A" if SEVEN_A else "")),
    intro=[
        "Built by `streamline-tools/rv-change/build_rv_mapping.py` from `2026-09-23-design-reviewer-ledger.md` "
        "(428 rows) and his answers of 24 September, recorded in that ledger and planned in "
        "`2026-09-24-topic-8-change-plan.md`, section 3. Every phrase below was checked against the files before "
        "this was written. A row an earlier release changed is mapped to the words it left, with that release named; "
        "a row removed with its file is held by that file staying gone.",
    ],
)

# Mark every pin on a removed file, so the shared checks hold it by the file
# staying gone rather than trying to read it.
path = ROOT / PINS
data = json.loads(path.read_text(encoding="utf-8"))
marked = 0
for row in data["rows"]:
    for pin in row["absent"]:
        if pin["file"] in REMOVED_FILES:
            assert not pin["everywhere"]
            pin["fileRemoved"] = True
            marked += 1
path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(f"marked {marked} pins as held by their removed file")

# The shared tool writes in text mode; the repository keeps text at LF on disk.
mapping = REPO / "plans" / MAPPING
mapping.write_text(mapping.read_text(encoding="utf-8"), encoding="utf-8", newline="\n")

# The rows of later topics' lists whose quoted words this release changed (found
# by running `check-ledger-quotes.py` on each list against a clean 4.2.292 copy
# and against this tree, and keeping the new faults). No pin holds them yet:
# each list's own release reads its ledger against the tree first.
LATER_ROWS = [
    ("the rest of preferences (`2026-09-23-preferences-rest-ledger.md`, topic 7)", [
        ("PF-B30", "RV-D06"), ("PF-C21", "RV-G21"), ("PF-E17", "RV-F09"), ("PF-E18", "RV-G09"),
        ("PF-E19", "RV-G05"), ("PF-G28", "RV-J18"), ("PF-N14", "RV-S30"), ("PF-O20", "RV-S16"),
        ("PF-O21", "RV-I07"), ("PF-S11", "RV-S22"), ("PF-S18", "RV-M06"),
        ("PF-S25", "RV-M14"), ("PF-W23", "RV-K09"), ("PF-W28", "RV-C08"), ("PF-X44", "RV-C06"),
        ("PF-Y04", "RV-C13"),
    ]),
    ("the voice guide (`2026-09-23-teacher-voice-ledger.md`, topic 8 release 5)", [
        ("VG-O25", "RV-D06"), ("VG-O26", "RV-G09"),
    ]),
]
lines = ["", "## Rows of later topics' lists that this release changed", "",
         "Each quotes a line this release changed; the row named beside it says how. No pin file on this branch holds them. "
         "The routes, playbook and starters lists quote none of the changed lines.", ""]
for where, pairs in LATER_ROWS:
    lines.append(f"- {where}: " + ", ".join(f"{a} ({b})" for a, b in pairs) + ".")
text = mapping.read_text(encoding="utf-8").rstrip("\n") + "\n" + "\n".join(lines) + "\n"
mapping.write_text(text, encoding="utf-8", newline="\n")
print("later rows listed:", sum(len(p) for _w, p in LATER_ROWS))
