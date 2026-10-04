"""The routes release, step 8: a closing section on the routes ledger, and a short
one on each ledger whose rows or pins this release touched, so each later
release reads its own ledger against what landed. Written with each ledger's own
line endings; each asserts its heading is not there yet. A replay sets
`LESSONV4_PLANS_OUT` to a scratch copy of the plans folder.

    python -X utf8 rt_08_ledger_notes.py"""
import os
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PLANS = Path(os.environ.get("LESSONV4_PLANS_OUT") or REPO / "plans")
print(f"ledgers in: {PLANS}")
HEADING = "## After the routes release (topic 8, release 3; 26 September 2026)"

NOTES = {
    "2026-09-23-routes-ledger.md": """Every decision and settled item on this list that release 3 carries is built on the
side branch `streamline/8-routes`, uncommitted, unnumbered until the lead merges it
(`streamline-tools/rt-release-report.md`). All 592 rows are pinned in
`plugins/lesson-v4/scripts/tests/routes_ledger_pins.json`; the 69 that changed are mapped,
each with the decision that changed it, and 17 whose words stand but moved under the two
new headings are mapped as moved, in `2026-09-26-routes-mapping.md`. Twelve of the 66 were
changed first by earlier releases and are mapped with their words: C27, E12, E13, E40,
E41, E42, E44, J06, P12, P13, P19 by 7A, L20 by the subject files.

- **Where his words and the plan differed, his won:** F18's trigger for a launch asked
  whether children had made the form in this lesson, the question decision 2 replaced; it
  now asks whether they have seen a good one (the plan had kept F18's words).
- **Found by grepping for the concept:** the wrong pointer 7g corrects (P07) was written a
  second time in `subject-maths.md` (SJ-D81); both now name `Cycles, and the beats around
  them`.
- **His 13b, after the first check:** criteria stand in for the good instance only when
  they show an actual good one ("a writing task whose criteria already show a good
  paragraph"), never a list of what a good one includes, and the launch keeps its case and
  steps; the words say so in the launch home, its three pointers and E70 and F34. The
  program keeps asking a written explanation for its good instance, since no criteria
  shape holds a written model.
- **The reviewer's launch line** takes decision 2's words in this release (the lead's call
  after the first check): a launch when the class has not yet seen a good one of this
  product earlier in this lesson, and a null launch also when it has.
- **Left for 7B:** the designer's two launch pointers in decision 2's words and the
  case-first line (7B's B10, from PF settled item 2), and "You can pass" in E59, E63 and F06
  (7B's B6).
- **Left for release 4:** the folds (the launch fields written twice, the output blocks'
  closing lines, the structure-reading rule, and the rest of section 5), including the task
  route's copy of the launch fields, so a task lesson reads them twice until then. E48's dated story
  (three science boards) stays with its paragraph under the new heading, because no
  decision named it.
- **Found in passing, not changed:** a discovery Use the learning's `activity` and a
  bounded attempt's `activity` are also words children are given, and the review view
  still leaves them out.
""",
    "2026-09-22-teach-then-do-ledger.md": """The routes release moved these pins in place, each with its decision
(`streamline-tools/rt-change/rt_07_repin_other_topics.py`): TD-J56 and TD-C19 (four
corners leaves the discussion route, routes decision 1); TD-A04, B07, C03, D03, F13, I02,
J03, Z19 and the home paragraph HOME-TD-LD-01 (the designer's rhythm paragraph gains his
preferences decision 13b); TD-L07 and L09 (the reviewer's launch line gains 13b); TD-L10
(the reviewer's four-parts line names `How this teacher explains`); TD-J20 (the skill
route's Practise names `The launch`). No row was added or dropped.
""",
    "2026-09-22-quick-checks-ledger.md": """The routes release moved these pins in place, each with its decision: QC-C08,
E11 and P01 (the reviewer's launch line gains his preferences decision 13b); QC-D11 to D16
(the activity list's 1.2 names Free Recall, which replaced Brain Dump, routes settled item
7c). No row was added or dropped.
""",
    "2026-09-23-success-criteria-ledger.md": """The routes release moved these pins in place, each with its decision:
SC-H03 ("the existing route" goes, routes 7g); SC-H22 and SC-Q01 (his preferences decision
13b, in the designer's walk-through line and the reviewer's launch line, which also takes
routes decision 2's words); SC-R04 and R05 (the two `goodLooksLike` lines say the criteria
must show an actual good one, never a list of what a good one includes); SC-H29 (the Our
Turn ruling keeps his words without its date); SC-H47 (the task route's launch trigger
asks whether the class has seen a good one in this lesson, routes decision 2). No row was
added or dropped.
""",
    "2026-09-23-starters-sticky-apply-ledger.md": """The routes release moved three pins of this list's file in place: SA-E20 (a
skill `prepare` unit's `activity` in `explanation` mode and a task lesson's `modelledOn`
are words the class reads, routes 7e), SA-M08 (the reviewer's launch line gains his
preferences decision 13b) and PF-Q14's paragraph (the teeth slide's story left the content
route for the build log). SA-E20's words are the ledger's own row, extended.
""",
    "2026-09-23-subject-files-ledger.md": """The routes release changed SJ-D81's pointer: it named `Teaching Sequence
Specification`, where the step it points to sits under `Cycles, and the beats around them`
(the same slip as the routes list's P07, settled 7g). The picture-rules home's launch
paragraph (HOME-SJ-PICTURE-RULES-07) gains his preferences decision 13b. Both pins moved
in place; no row was added or dropped.
""",
    "2026-09-23-worksheets-ledger.md": """The routes release changed one paragraph of the designer's Worksheet home
(HOME-WS-LD-08): a skill `prepare` unit's `activity` in `explanation` mode and a task
lesson's `modelledOn` are words the class reads (routes settled item 7e). The home record
and its pin moved in place.
""",
    "2026-09-23-design-reviewer-ledger.md": """The routes release, built beside the reviewer release, changed three of this
list's rows' words: RV-C11 (the four-parts line names `How this teacher explains`, routes
decisions 3 and 4), RV-J36 (the launch line takes routes decision 2's words, a launch when
the class has not yet seen a good one of this product earlier in this lesson, and his
preferences decision 13b, criteria that show an actual good one standing in for the good
instance, which the program cannot see, so the reviewer judges it) and RV-E10 (the
turn-label message carries his maths ruling, routes 7f). The reviewer release's pins for
them, and for the paragraphs they sit in, move when the two releases are merged
(`streamline-tools/rt-change/rt_follow_at_merge.py`).
""",
    "2026-09-23-preferences-rest-ledger.md": """The routes release changed the lines these rows quote, for 7B to read before it
builds: 13b is written in the launch home and its three pointers (PF-T12, T13, T14; the
home's own row keeps its quote), criteria standing in only when they show an actual good
one, and the reviewer's pointer (PF-T14) already takes decision 2's words, so 7B's B10
adds decision 2's words and the case-first line to the designer's two and leaves 13b and
the reviewer's line as they are. The route and reference lines these rows copy
changed with their routes rows: PF-T18, T27, T28 (decision 2); PF-O03, Y01, Y03, Y08, Y09,
Y12, Y15, Y16, Y17, Y19, Y20 (decisions 3 and 4, the explaining heading, and the stories
leaving E51 and E58); PF-F36 (decision 1); PF-U37 (decision 8); PF-M60 (7a); PF-N20 (7d);
PF-B11 (7e); PF-O49 (7i); and the stories PF-C10, D22, M76, O45, O79, Q17, T42. Each
routes row says what now carries it (`2026-09-26-routes-mapping.md`). "You can pass" in
the route files is untouched: B6 is 7B's.
""",
    "2026-09-23-teacher-voice-ledger.md": """The routes release changed two lines these rows quote: VG-L16 (the designer's
form check now keeps the route on the board in whole sentences, said more fully in the
script, routes 7i) and VG-M49 (a skill `prepare` unit's `activity` in `explanation` mode
and a task lesson's `modelledOn` are child-facing, routes 7e). It also adds one pointer
sentence under §5: an explanation usually goes the way the teacher explains, and it is not
a template. Release 5 reads them as they now stand.
""",
}

for name, body in NOTES.items():
    path = PLANS / name
    text = path.read_bytes().decode("utf-8")
    assert HEADING not in text, name
    crlf = "\r\n" in text
    addition = "\n" + HEADING + "\n\n" + body
    if crlf:
        addition = addition.replace("\n", "\r\n")
    print(f"writing {path}")
    with open(path, "w", encoding="utf-8", newline="") as handle:
        handle.write(text.rstrip("\r\n") + ("\r\n" if crlf else "\n") + addition)
print("LEDGER_NOTES_OK")
