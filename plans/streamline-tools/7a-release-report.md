# Release 7A (4.2.293): how a lesson opens and closes, what was built

Built from `7a-release-brief.md`, following `plans/2026-09-24-topic-7-change-plan.md`
section "Release 7A" (A1 to A14) and the teacher's words in the two topic 7 ledgers
("Decisions taken", "His answers, 24 September", the settled items, and the change
plan's two questions he answered "yes"). Built on `b1c2d427` (4.2.292) with nothing
committed or pushed. Where a later release had changed words the plan quotes, the
committed words were the starting point (said below where it mattered). Then repaired
after the first independent check (`7a-release-check.md`), as the lead asked; see
"Repair round 1", then "Repair rounds 2 and 3" (the untitled grid, the decorator's
check, and his answer on a wall card's order), then "Repair round 4" (the second check,
`7a-release-second-check.md`), then "Repair round 5" (his answer on a long sticky fact,
and the wall planning the page it draws), then "Repair round 6" (the lead's go: every panel
card planned as drawn, a Chrome test per type, and the saved walls wall by wall), then
"Repair round 7" (the diagram section's heading, and a standing guard over every card type),
then "Repair round 8" (the third check, `7a-release-third-check.md`: arrows drawn within the
line, and its undo misses), then "Repair round 9" (an arrow as heavy as the digits, and an arrow
test for every place the arrow face is written), then "Repair round 10" (his answer: one
three-line fact a card), then "Repair round 11" (the fourth check: his rule never loses a wall).

## In short

- Every item A1 to A13 is built, with his words as the standard; the pins (A14) are
  written and every earlier topic's pin that held a changed paragraph moved in place.
- The change is thirty-six scripts in `7a-change/` (and four that check it), each old
  text asserted once, line endings kept. Replayed in order on a clean `git archive b1c2d427` copy
  (`scratch/7ab/replay.py`), they reproduce the working tree, the pin files and the
  mapping exactly ("different from the working tree: nothing").
- Every suite passes. The saved designs give the same results once the four retired
  keys are stripped (one differs only by one fewer unfilled placeholder); as saved, 37
  are now refused first on the retired keys, each explained below.
- Each of 28 program and promise changes, undone one at a time, is caught by a test
  (`scratch/7ab/mutate.py`, 74 of 74; the tree restored byte for byte).
- The instruction files are about 3.3 KB larger, not smaller. Said plainly below.
- **Install 4.2.293 only between lessons.** A lesson already running when it lands, or
  picked up again after it, has its design refused at the adaptation picture step and at
  review (see "The saved designs").

## The scripts, in replay order

All in `plans/streamline-tools/7a-change/`, run with `python -X utf8 <script>`.
`_patch.py` and `_root.py` take `LESSONV4_PLUGIN_ROOT` (and the builder
`LESSONV4_MAPPING_OUT`), so a checker can replay on a scratch copy; each prints the
root before it writes.

| Script | What it does |
|---|---|
| `a1_stories_first.py` | SA-H13's story (the 17 September history Teach slide) copied to the log before anything moved |
| `a2_retired_fields.py` | A1 and A2: the test-question slot and the Lesson 2 plan out of the contract, validator, scaffold, review view, wall packet, preferences, designer, reviewer, playbook |
| `a2t_retired_fields_tests.py` | their tests and the fixture |
| `a3_starter.py` | A3, A9, A10 |
| `a3t_starter_tests.py` | the tall-picture starter never prints a slide's title (round 1) |
| `a4_sticky.py` | A4 and A5 |
| `a4t_moved_rule_tests.py` | three tests follow words the fold moved |
| `a5_wall.py` | A6 |
| `a5t_wall_tests.py` | the wall's refusal test |
| `a5b_picture_gives_way.py` | the wall build lets a picture give up a little width before it refuses (round 3) |
| `a5c_wall_order.py`, `a5ct_wall_order_tests.py` | his order of moves on a wall card, in every copy, and its tests (round 3) |
| `a6_apply.py` | A7 and the routing card's Apply trigger |
| `a7_test_question.py` | A8 (the reviewer's line) |
| `a8_titles.py`, `a8t_titles_tests.py` | A11, its code and tests (the untitled grid moved into the slide check in round 2) |
| `a8c_settled_check.py` | the slide check's `--settled`, used by the decorator and the playbook (round 2) |
| `a8d_second_check.py`, `a8dt_second_check_tests.py` | the second check's repairs and their tests (round 4) |
| `a8j_never_lose_the_wall.py`, `a8jt_split_wall_arrives_test.py` | a card with more than one long fact is built with its photo off, never refused for the count; the scope check lets a split leave a card one item; the test through the route (round 11) |
| `a8i_one_long_fact_a_card.py` | one three-line fact a card, a second on a second card (round 10, his answer; its tests are in the copy a8et makes) |
| `a8h_heavier_arrows.py`, `a8ht_arrow_face_test.py` | the arrow as heavy as the digits, still within the line, and the arrow-face test (round 9) |
| `a8g_arrows_within_the_line.py` | arrows drawn from Arial within the line, and the arrow widths in the plan (round 8; its tests are in the copies a8et and a8ft make from `7a-change/new/`) |
| `a8f_section_heading.py`, `a8ft_no_card_outside_its_box_test.py` | the diagram section's heading strip, and the standing guard over every card type (round 7) |
| `a8e_wall_true_fit.py`, `a8et_wall_true_fit_tests.py` | the wall plans the page it draws, and a long sticky fact keeps its photo (round 5; the replacements generated from the tree by `scratch/7ab/second/make_change_script.py`) |
| `a9_contents_and_out_of_date.py`, `a9t_pride_note_test.py` | A12: the contents block once, the Pride note, `lesson-cover` |
| `a10_repin_other_topics.py` | the earlier topics' pins that followed the words |
| `a11_place_new_test.py` | the new pin test (from `7a-change/new/`) |
| `build_7a_mapping.py` | the mapping and the SA pin file |
| `a12_version.py`, `a12b_log_entry.py` | both `plugin.json` to 4.2.293, and the log entry |
| `a13_compare_designs.py` | the saved designs with the normaliser |
| `a14_sizes.py`, `a15_dash_check.py` | sizes, and no new dash |
| `a16_ledger_notes.py` | closing notes on the two topic 7 ledgers |

## What changed, item by item

### A1. The test-question starter is gone as if it never existed (settled item 1)

His words: "get rid of the 'will return' stuff, it needs to be like it didnt even
exist". `"testQuestionPath": null` and the whole note beside it leave the contract;
the validator's starter keys are `activity`, `connection`, `format`, so the slot is
refused as an unknown field, and its answer rule is gone; the scaffold stops writing
it; the tall-picture template and its code comment lose "such as a scanned question",
and "the question image" becomes "the image" (the `question` slot, a name the code
reads, and its answer example stay). The test of the old answer rule became a test that
the slot is refused, empty or filled; the packet test and the geography fixture lose
it. Barred everywhere: `testQuestionPath`, "will return to it", "scanned question".

### A2. The Lesson 2 plan goes (PF decision 20, and the change plan's question 2)

His words: "Is there a thing that says ... it suggests what the second lesson should
contain? If so, I think that should come out because it already knows how much it can
fit in one lesson", then "yes and yes"; question 2, "yes".

- `lesson.scope`, `deferredLearning` and `lesson2Direction` leave the contract, the
  validator (refused as unknown fields; tested for each), the scaffold (its request no
  longer takes `scope`; tested), the review view and the wall packet.
- How Much Fits: the Roman diary example goes; "make the production the opening of the
  next lesson, warmed by a quick retrieval" goes and "ending on the lesson's core idea
  while it is still fresh" stays; the bracketed pointer to research sections 7 and 8
  goes (PF-I09: neither carries that mechanism); the three-facts sentence and the
  starter-slide orientation become "today's lesson teaches what fits properly and says in
  one line of the walk-through's closing decisions what it left for another lesson; it
  does not plan that lesson". The judgement sentence and "A lesson that builds to a clear
  conceptual high point ... with the production saved for tomorrow" are unchanged.
- The designer's L116: TD-Z10's first two sentences stay; "production opens next" and
  "Signal split in ..." become "today teaches/consolidates knowledge and ends on its core
  idea ... If it left something out, say what in one line of the walk-through's closing
  decisions; never plan the next lesson." ("Production opens next" was the same plan in
  the designer's words, so question 2 reaches it; the plan did not name it.)
- The reviewer's two lines read against the walk-through, strength kept; the playbook's
  report line says what was left in one line (16 bytes; the playbook has 56 left).
- The walk-through's closing decision "related content deliberately deferred" is
  unchanged (three pin files hold it). The plain-English "lesson scope" in the
  reviewer's and the playbook's lists stays.

### A3. When a question about today may open instead (SA decision 3, "Yes")

Both lines take the pitch paragraph's two cases; the subject bullet also takes his
limit (a question children think and talk about, never a prediction or the task
explained). The bullet keeps its label dash, as its sibling bullets do.

### A4. Sticky knowledge in one home (the fold, and settled item 5)

`preferences.md` → Sticky Knowledge takes G09's "trace each one forward", G12 (in its
own words, "And" dropped, the pewter plates kept as its example), H05's rule in full
prose, H08 (phrasing consistency) in full prose with the working wall named (decision
7), and H02 corrected to the reference on each unit. The designer's G08 copy goes; its
section keeps a pointer that names what it adds without paraphrasing the home, G10 and
G11 word for word, H03's recording word for word with H05's last sentence, H06 and H07
word for word, and H09 as in A5. Settled item 5: "Teacher may provide - use it" became
"When the teacher's plan lists sticky facts, judge them like anything else it offers,
and keep one the teacher marks as required."

### A5. Where a sticky fact sits (settled item 6, turned round; routes 7h and 7k)

Every line in the plan's table, and only those: the content route's L31 ("usually the
`headline`"; the beat that lands it last uses `takeaway`), L99's lead ("usually leads
... that is how this teacher usually explains, not a rule for every slide", the
mechanism sentences word for word), L101 (the story to the log, the reason as a clause:
"Whatever leads, the top line is never a caption of the picture"), L105 (the shape for a
beat that withholds its fact, and a choice where the fact reads better last; the
headline then never a caption); the skill route's two lines; the contract; the
designer's H09 and "Not teaching tool"; the slide guide's L105. The slide guide's
pointer to "the lesson-designer's phrasing consistency rule" now names its home, since
the rule moved. No program changed: the validator already took either placement.

### A6. The wall keeps the lesson's sentences whole (SA decision 7; PF decision 22)

Rule 8 is the home: prose a child reads stays a whole sentence; the sticky statement
joins the definition sentence ("So does a sticky-knowledge statement."; VOC-O07's
sentence word for word); making room is the first move, in his order since round 3 (the
build shrinks the picture a little, then a list goes over a second card, and the picture
comes off only when nothing else fits), and a modelled sentence or a stem's framing is
shortened only to a whole sentence. Wall preferences: principle 2's example
keeps the taught term beside its plain words; principle 4 says two lines is what a card
holds, not a quota on writing; principle 5 says the same as rule 8 (SC-O05's sentence
and VOC-O16's definition sentence word for word); the sticky row says 106. The build's
refusal still names the budget ("62 is the most that fits") and leads with room.

### A7. The Apply (SA decision 9 "yes", the fold, settled items 11 and 12)

The home takes J05's two cases, J11 (keep rehearsal within practice, omit the ending
when practice already draws on the intended learning, the three repairs in order) with
the intended learning named as the read-back sentence that closes the walk-through and
the sticky knowledge ("quality-lock sentence" goes), and loses "which is the only place
that decides it". The designer's J19 keeps its ready-made reason for a fact or a method
and says what a lesson that named an idea writes; the maths line leads with settled item
11; K02 says "Reflect" and loses the retired prose line; J08, J09, J10, J17, J48 word
for word. The routing card's trigger gains the clause, and a test holds its exact words;
the behaviour case that forbids demanding an extra Apply slide is unchanged and passes.

### A8 to A13

- **A8** (settled item 2): the reviewer's line and the contents line carry both
  exceptions, and nothing wider.
- **A9** (settled item 4): the catalogue says only a `heading` the starter carries prints
  under "Starter", in his words "Just the starter heading that's underlined is enough";
  the PSHE story (in the log since 2 September) goes; the tall template's slot line says
  `heading`.
- **A10**: the two mixed-retrieval formats carry A07's conditions in its own words.
- **A11**: `Apply` is a slot name outside maths only in preferences, the designer, the
  reviewer and the slide designer; the slide check flags a bare `Practise` everywhere and
  a bare `Apply` outside maths, with the maths note; the grid's `Independent Tasks`
  default is gone, the slide check sends an untitled grid back naming the fix, and the
  final build draws one with no title line (round 2; it first refused); the numbered
  helpers' labels are purple and main independent work is numbered in maths only (the
  sentences a builder test holds kept word for word, the limit beside them).
- **A12**: the contents block edited once (L11, L20, L25, L26); the Pride note (PF-X46)
  and its test; `lesson-cover` loses "for historical reasons".
- **A13**: SA-H13's story copied to the log first; the others were already there.

## Where I departed from the plan, and why

1. **The wall's other copies of the old rule changed too.** The plan named rule 8 and the
   designer's L36, L44 and L333. The same file's repair order still said "condense the
   wording" first and "rather than adding or removing a picture to gain a character
   allowance", its floor line and the wall preferences' floor line put shortening first,
   the focused repair said an item "fits only reworded", and the build's panel remedy said
   "shorten the longest". Each now says room first, then a whole sentence. The
   success-criteria step is still never shortened, in every one.
2. **The wall designer had 20 bytes left under its 51 KiB cap** (a test). Rather than
   raise the cap, its copies point at rule 8 instead of repeating it; after his order of
   moves went in (round 3) it ends one byte larger than before, 19 bytes under the cap.
   The wall's focused repair ends at 7,993 bytes, under its 8,000 test.
3. **PF-B77's "becomes a poster" sentence** was first replaced; the first check found that
   a reason he never retired, and round 1 put it back word for word (below).
4. **G10 and H03 are kept word for word**; a first draft had reworded both.
5. **The contents line for The Apply Slide** says the section judges an ending against the
   learning the lesson named, because that is now in it.
6. **How Much Fits is pinned as a home here** (the plan's A14 list left it out), because
   the split's rows and barred words live there. 7B need not pin it again.
7. **SA-D23** is mapped with the colours release's words: that release changed it (via
   PF-R18) without listing it in `COLOURS_ROWS`.
8. **The CLI wrong-type test** used `lesson.scope` only to have a field of the wrong type;
   it uses `stickingPoint` now and keeps its point.
9. **The slide check's `presentationWarnings` is exported** so the new test reads it
   directly.
10. **The Apply trigger's test** sits in the new pin test file and reads the packet's own
    routing card.

## Every pin, and why

**New.** `scripts/tests/starters_sticky_apply_ledger_pins.json` (496 pin rows) with
`test_starters_sticky_apply_ledger_is_kept.py`: all 390 SA rows (325 unchanged in place;
65 changed, each with the decision that changed it and each changed row's whole
paragraph), ten added mechanisms, nine homes paragraph by paragraph, the 45 PF rows 7A
changed (`PF_ROWS`, for 7B to import), and 25 retired wordings barred in the programs as
well as the words; a barred phrase gone in any case is barred in any case. Ten decision
tests. The mapping is `plans/2026-09-26-starters-sticky-apply-mapping.md`, and its last
section lists the rows of the routes, reviewer, playbook and voice ledgers 7A changed.

**Earlier topics' pins moved in place** (`a10`, 37 pins in 28 rows; each outcome names the
decision; no row added or dropped; every earlier pin file then checked whole):

| Pins | Rows | Why |
|---|---|---|
| assumed knowledge | AK-F01 | the designer's L116 (A2) |
| quick checks | QC-B06; QC-C08, E11, P01; QC-S46 | L116 (A2); the reviewer's section 3 paragraph (A2, A8); the test-question line (A8) |
| success criteria | SC-A02; SC-Q01; SC-L12; SC-O03, O04, O18, O19, O20, O22; SC-DEC-12, SC-DEC-12-WALL | the contents block (A12); the reviewer's paragraph; the wall designer's Written Voice trigger (PF-A54); the wall's words (A6) and his order of moves (round 3), each success-criteria step still never shortened |
| the rhythm | TD-A12; TD-D12; TD-J18, J19; TD-L07, L09 | the contents block; the retrieval formats (A10); the skill route (A5); the reviewer's paragraph |
| vocabulary | VOC-A03; VOC-O07, O16 | the contents block; the wall paragraphs round the unchanged definition sentences |
| worksheets | WS-B07 | phrasing consistency moved to preferences (A4); the pin follows it |
| colours | PF-R97 | the catalogue's helper table (A11: the labels purple) |

Subject files' pins are untouched.

## The suites

`bash plans/streamline-tools/run-all-suites.sh 7a-after` on the final tree, with the
venv's `python3` first on `PATH` (logs `7a-after-*.log`):

| Suite | 7A | Before (4.2.292, `7a-before-*.log`) |
|---|---|---|
| python | 2,280 passed, 1 skipped | 2,255 passed, 1 skipped |
| voice harness | 21 | 21 |
| builder | 772 | 762 |
| worksheet-html | 771 | 771 |
| stick-in-sheets-html | 73 | 73 |
| working-wall-html | 166 | 154 |
| shared | 126 | 126 |
| test | 46 | 46 |

The new pin test takes about 37 seconds (the worksheets one about 20). Most of it is
reading every file once per barred phrase; caching those reads in the shared checks would
cut it, which I have not done (shared by every topic).

## The saved designs

- **Stripped of the four retired keys** (`a13`, `7a-after-stripped-designs.json`): 52 of
  53 give the same first fault as on 4.2.292. The other, an unfilled scaffold, reports
  280 placeholders instead of 281, because a stripped key was one of them.
- **As saved** (`validate-saved-designs.py`, `7a-after-designs.json` against
  `7a-before-designs.json`): 16 give the same first fault as before (a check that reads
  the whole file, an em dash, a 67 or a placeholder, runs before the contract), and 37 are
  now refused first with "lesson has unknown fields: deferredLearning, lesson2Direction,
  scope". None passed before or after. A new lesson never carries the retired keys. A
  lesson already running when 4.2.293 is installed, or stopped and picked up again after
  it, has its design checked again at the adaptation picture step (where a refusal makes
  the run drop its Below and Greater Depth sheets) and at any later review, and is refused;
  an old folder reopened to redo a resource meets the same refusals. So 4.2.293 is
  installed only between lessons (the first check's finding; the log says so too).
- No rendered pages: a deck draws as before except an untitled grid, which loses its
  "Independent Tasks" line, and a wall draws as before except a card that used to be
  refused, which now builds with its picture a little narrower. Tests hold both.

## Size, before and after

Line endings normalised (`a14`):

| Group | 4.2.292 | 4.2.293 | Change |
|---|---|---|---|
| Instruction files (16) | 1,252,186 | 1,255,460 | +3,274 |
| Programs (16) | 677,842 | 705,483 | +27,641 |
| Tests and pins (29) | 3,327,551 | 4,077,084 | +749,533 (the new pin file 645,534) |
| The build log | 749,791 | 768,776 | +18,985 (the entry and its story) |

Not smaller. The lesson designer lost 882 bytes and the contract 563 to the folds, but his
decisions added words where they are read: preferences +1,778 (the sticky home, the Apply
home, the starter's cases), the wall preferences +1,441, the activity list's conditions
+416, the reviewer +381, the decorator +193 (`--settled`). The programs lost 1.9 KB of
retired fields (validator, scaffold, review view) and gained 3.1 KB in the slide check (the
maths note, the untitled grid and its turn, `--settled`) and 18.7 KB in the wall's fitter (the
page it draws, 10.2 KB of it in `layout.js` with the reasons; the misconception pair and the
stacked figure as drawn; the picture giving way; the photo at a third; its message in his
order).

## Anything he should know

- **Untried on a real run.**
- **Install 4.2.293 only between lessons, never while one is running.** Old lessons'
  design files carry the three removed Lesson 2 boxes, and a lesson running when it lands
  (or picked up after it) is refused at the adaptation picture step, losing its Below and
  Greater Depth sheets, and at review. A new lesson is not affected.
- **A slide titled just "Practise" is now stopped at the slide check.** Two saved
  geography decks had four each; a new run renames them. In maths "Apply" still passes.
- **An untitled arithmetic grid is sent back to be titled** at the slide check, and if one
  ever reaches the final build it is drawn with no title line, never "Independent Tasks"
  and never at the cost of the deck. No saved deck has one.
- **A title slip never costs the deck its drawings.** The decorator's check, and the
  orchestrator's after it, run with `--settled`; a bare "Practise" the designer's round left
  is a note there. The designer's own check never does (a test).
- **A wall card keeps its picture.** The picture gives up a little width first; a sticky fact
  that still does not fit keeps its photo, narrowed to about a third, on three lines; then a
  list over a second card, then a shorter whole sentence, and the picture off last of all.
  Every saved fact of 73 to 106 letters keeps its photo and its whole sentence.
- **Nothing on a wall prints past a panel's edge now**, measured in Chrome on every saved wall.
  Twenty of the 45 saved walls draw differently, each named with its reason in "Repair
  round 6" and "Repair round 7": mostly larger type; five cards a size smaller, four where
  their words ran into or past the edge and one that ran to six lines; six larger stacked
  figures; and one diagram section whose heading strips now hold their words.
- **Arrows on the wall are a little bigger and heavier.** They are Segoe Print's own arrows,
  as his walls had them, drawn 40% larger so they read as clearly as the digits beside them,
  and held inside the line (before, a line holding one printed 28% taller than planned). Only
  the arrow changes; every other letter is as before. `7a-renders/arrow-weight.png` shows all
  three. Worth a look on the
  first walls; pictures in `plans/streamline-tools/7a-renders/`.
- **The two wall glance tests and the wall's example sticky card** are topic 9's, as the
  plan said.
- **Kept dashes**: ten lines I edited keep a dash that was already there in words I did
  not rewrite (contents lines, bullet labels, untouched sentences); `a15` lists them.
- **Other releases**: the rows of the routes, reviewer, playbook and voice ledgers 7A
  changed are listed in the mapping and in the starters ledger's closing note; none of the
  worksheets release's "re-read" lines (playbook A12 and P32, reviewer I05, Q02 and Q08,
  preferences O36 and O37) was touched.
- **Not updated by me**: `plans/streamline-plan.md` (outside my files). Nothing committed;
  Codex still runs its installed version.

## Repair round 1 (after `7a-release-check.md`)

The lead's six items, each checked against the files first. The wall's order of moves
(the picture off before a sentence is trimmed) is held as built, pending his answer.

1. **The wall's "poster" reason is back.** Principle 4 of the wall preferences reads again
   "Three lines turns the item into a paragraph and the wall stops being a wall and becomes
   a poster.", word for word; only its lead and the "not a quota on writing" sentence are
   new. It is off the retired list, and PF-B77's mapping keeps it. **For the lead to add to
   topic 9's carried questions** (I may not write in the plan's table): the ledger notes that
   "becomes a poster" clashes with the wall visual language's L31, which makes the display
   poster the wall's model; which does he mean?
2. **The log and this report no longer say nothing re-checks an old design during a run.**
   Both now say what happens to a lesson running when 4.2.293 lands, and to install it only
   between lessons. (`a13`'s own note says the same.)
3. **The two untested promises have tests**, each shown failing with its repair undone
   (`mutate.py`): `builder/test/starter-question-tall-title.test.js` (the tall-picture
   starter never prints the slide's title, and prints a heading it carries; caught when the
   template reads `title` again), and `test_the_guide_example_request_is_one_the_scaffold_accepts`
   in `test_lesson_design_scaffold.py` (the guide's example is exactly the fields the scaffold
   takes, no `scope`, and the scaffold accepts it; caught when `scope` is put back).
4. **The six moved reviewer pins give the true reason**: QC-C08, QC-E11, QC-P01, SC-Q01,
   TD-L07 and TD-L09 now say their paragraph changed only by the test-question line (SA
   settled item 2), the split lines being in section 1. Their words were already right.
5. **The tall-picture starter's examples are an ordinary starter from his saved deck
   `output/working/name-the-layers-of-teeth`** (Year 4 science, starter "Teeth and their
   jobs"): the prompt example is "Which teeth cut food?" and the answer example "||Incisors cut
   food.", from its check slide. The `question` slot keeps its name (code). SA-F13 and PF-I27
   are mapped with the new words.
6. **The low notes.**
   - The reviewer's "honest": fixed ("says so, honestly and visibly, in the walk-through").
   - The playbook's leftover "lesson scope": fixed (the report list no longer names it; the
     playbook is 78,778 bytes).
   - The wall's remedy naming a picture for a card with none: fixed ("if the card carries a
     picture, take it off unless the words need it"); the test follows. Round 3 rewrote
     the remedy again in his order, still naming a picture only as "any picture beside it".
   - **Left, with why:** rule 8's short sticky sentence ("So does a sticky-knowledge
     statement.") stays short: the wall designer has 59 bytes under its cap, the sentence
     before it carries every condition it points back to, and the wall preferences say it in
     full. And the content route's "When that sentence is one of the lesson's sticky facts, the
     headline still carries it" stays word for word, as the plan kept it: it describes the
     case where the headline carries the sentence, and the lead line above it now says
     "usually".

After the round: every suite passes (python 2,276, builder 767, the rest unchanged); the
replay of the edited scripts on a clean 4.2.292 copy gives the working tree, the pin files
and the mapping exactly; 19 of 19 undo checks are caught; no new dash.

## Repair rounds 2 and 3 (the lead's three later messages)

**Round 2, the untitled grid (the check's repair 5).** An untitled number grid never
costs the deck. The refusal left the final build's validator and joined the slide check as
a presentation fault, `GRID_WITHOUT_TITLE`, beside `INTERNAL_STAGE_TITLE`, with the same
message naming the fix. The grid template now draws an untitled grid with no title line,
never "Independent Tasks". The grid test moved with it
(`builder/test/grid-calc-title.test.js`): the slide check sends the grid back; the
validator accepts it; the drawing has no "Independent Tasks"; and `build.js`, run with
`--deliver-flagged` and without, exits 0 and writes the deck. The bare "Practise" flag
stays as built.

**Round 2, a title slip never costs the drawings.** Small, so built. The slide check takes
`--settled`: on a settled deck a wording, title or layout fault the designer's round left
prints to stderr as a note ("the slide designer's to mend and never a reason to withhold
its drawings") and the check passes; a fault the decorator's own drawings cause (a picture
drawn twice, a picture fault) still fails. The decorator's command and the playbook's
decorator check both pass `--settled`, and the decorator's page says why. Two tests: a
bare "Practise" passes settled and fails without it, while a picture drawn twice fails
either way; and the real command line passes the flag through.

**Round 3, his order on a wall card.** His words, quoted in the log entry and the mapping:
"answer to your wall question, I guess, but I rarely also use cards with no picture or
helper, so?".

- **The fitter had an order, so it got his first move.** A card's words take 60% of its
  width beside a picture. When an item overflows there, the build now tries 65% and then
  70% before it refuses (`panelFractionThatFits` in `visuals.js`, used by the sticky,
  definition, worked-example and sentence-stem cards). A card whose words fit keeps the
  picture's full share. Measured: a sticky item beside a picture now fits up to 72
  characters (73 is refused), and 106 with no picture, as before.
- **"The card grows" is not a move the build has**: every card prints at A3, fixed, so the
  nearest move is a second card. The order written everywhere is: the build shrinks the picture a little, then a list goes
  over a second card, and the picture comes off only when nothing else fits. It is in the
  wall designer's rule 8, its success-criteria paragraph and its budget section, the wall
  preferences' principle 5, floor line and budget table (62, "about 72 characters once the
  build has shrunk the picture a little", 106), the focused repair, and the build's
  refusal message.
- **Tests**: the budget test (72 builds with the picture, 73 refused), a unit test that the
  picture keeps its share when the words fit and gives way only to 70%, and the message
  test in his order. Four new undo checks are caught.
- **One reading for him to confirm.** "A sentence is never cut" is built as never clipped:
  no sentence is ever trimmed into a fragment, and a whole-sentence rewrite stays the wall
  designer's very last resort, after the picture is off (his decision 7 kept that). If he
  meant never shortened at all, the last step becomes "omit the card", a one-line change.

**Two things for the lead, not built.**

- **The decorator's flagged-deck step cannot run, and has not since before 7A.** Its page
  tells it to build the preview with `--deliver-flagged`, but the slide check's command
  line has never taken that flag (it prints its usage line and fails), and `build.js`
  ignores the flag on a preview. So a flagged deck's decorator fails and the deck gets no
  drawings. That is the run-faults release's, I think; it is outside what I was asked.
- **The poster clash** (round 1, item 1) is still for topic 9's questions.

**After the rounds.** Every suite passes (python 2,276 and 1 skipped, voice 21, builder
770, worksheet 771, stick-in 73, wall 155, shared 126, test 46). The 24 change scripts,
replayed in order on a clean 4.2.292 copy, give the working tree, the pin files and the
mapping exactly ("different from the working tree: nothing"). 28 of 28 undo checks are
caught. No new dash (11 kept from the lines they stood in). The saved designs give the
same results as in round 1. The wall designer is 19 bytes under its cap and the focused
repair 7 bytes under its 8,000.

## Repair round 4 (after `7a-release-second-check.md`)

The lead's four items; the order of moves for a sticky fact too long to sit beside its photo
(the check's item 3) is held for his answer, untouched.

1. **The untitled grid's own fix now passes.** The turn check counts a grid's calculations
   as its turn, so a grid titled "Your Turn" (the title the message asks for) passes the
   whole slide check; a "Your Turn" grid with no calculations is still refused as a turn
   with no task. A grid under the starter header, which never prints a title, is no longer
   sent back for one. Test: the real check on both decks (exit 0), and on the empty grid
   (refused).
2. **The designer's own check can no longer be made lenient unnoticed.** A builder test reads
   every slide-check command in the agents' pages and the playbook: the decorator's carry
   `--settled`, the slide designer's and the playbook's Track A check never do. Adding the
   switch to either now fails it.
3. **The wall's fit estimate: not a small change, so stopped, as asked.** Measured in the
   Chrome the builds print with, on the second check's cases (`scratch/7ab/second/`):
   - A 72-letter fact beside a photo at 80pt: the fitter plans 5 lines, the page draws 6.
   - Three separate gaps, each the same direction: the page draws a line 1.40 times the type
     size (Comic Sans' own line height) where the fitter plans 1.3; the panel's padding and
     border take 0.58in where the fitter allows 0.4in; and the page wraps whole words, bold,
     where the fitter counts letters at 0.55 of the type size (plus 0.28in between sticky
     items where it plans 0.22in).
   - Making it true means the fitter measuring whole words with the font's own widths (the
     table the board already uses), the real line height and padding, and each card type's
     own text width (the step badge column, a stem's indent and bullet), then a check on
     every saved wall and a test that measures the printed page. Every correction only makes
     the plan larger, so a card that fits today keeps its size exactly and only a card that
     spills draws a size smaller; the 62, 72 and 106 budgets can stay as they are. That is
     five card renderers and the fitter, not a small change.
   - What 7A does to it: the saved walls draw exactly as on 4.2.292 (one, the Christmas
     wall, already spilled there); the new room lets through some cards that spill (a
     72-letter fact beside a photo; worked steps of 64 to 72 letters). The log's "Not done
     yet" says so.
4. **The low notes and the missed undo checks.**
   - The wall's refusal named 62 though the build had already tried 72 beside a picture a
     little smaller. A card that fits at no share is now measured and refused at the widest
     share tried, so the message names 72 (the balanced-diet wall's refusal now reads "72 is
     the most that fits ... (36 per line)"). Only refused cards change: every saved wall that
     builds draws byte for byte as in round 3.
   - Principle 4's reason now says what the engine does: nothing "needs more than two lines
     at the card's smallest type, which is what each item's character budget measures; a
     roomy card prints the same words larger." The poster reason is unchanged.
   - The playbook's orchestrator re-check after the decorator now says "with `--settled`"
     (16 bytes; the playbook is 78,805, under its cap).
   - The definition and sentence-stem give-way have a test: beside a drawing, 130 letters
     build only because the drawing gives way, and 146 are refused.

**Also seen, not changed:** under the starter header the grid draws "Starter" but not the
slide's `heading` (older than 7A, the second check's note).

**After the round.** Every suite passes (python 2,276 and 1 skipped, voice 21, builder 772,
worksheet 771, stick-in 73, wall 156, shared 126, test 46). The 26 change scripts, replayed on
a clean 4.2.292 copy, give the working tree, the pins and the mapping exactly. 38 of 38 undo
checks are caught, the second check's two misses and its item 2 among them. No new dash. The
earlier topics' pins are still 37 in 28 rows; SC-O18 follows principle 4's corrected reason.

## Repair round 5 (his answer on a long sticky fact, and the true fit)

His words, recorded by the lead in the preferences-rest ledger: asked whether a sticky fact
too long to sit beside its photo should keep it, the photo shrinking further, to about a
third of the card, so the whole sentence fits beside it; only then a shorter whole sentence;
the photo off only as the very last move, he answered "yys" (yes). Quoted in the log.

**The wall plans the page it draws** (`layout.js`, What the page draws). Measured in the
Chrome the wall prints with, the old plan was short three ways: a line is 1.40 times the type
(the font's ascender plus descender, each rounded to a pixel), not 1.3; the panel's padding
and border take 0.58in, not 0.4in; and whole words wrap, where letters were counted. The board's
width table matches Chrome's widths to a hundredth of a pixel, so the sticky, definition,
worked-example and sentence-stem cards now plan each item as its HTML draws it: its padding,
a step's badge, a stem's bullet and indent, a worked example's label, the panel's real width
and edge. Two more gaps turned up and are closed: a stacked figure's caption was never counted
(a saved number-line card's words ran into its panel's padding), and a dominant figure, which
sits beside its panel, reserved room beneath it that the page never used. The worked example's
flat 0.2in badge reserve goes, since each row is now measured. The character budgets (62, 72,
106) still decide which card is refused. The misconception pair keeps its own arithmetic: it
plans both halves stacked, so it only ever over-plans (a sweep of pairs found nothing past an
edge).

- Checked in Chrome: every saved wall (45), the second check's sweep (78 cards), a second sweep
  of stems, definitions and number-line cards, and the 48 long facts: no line of text past a
  panel's edge, and none in its padding. The plan matches Chrome's drawn body to within 0.1px.
- **His walls change.** Superseded by round 6, which also plans the misconception pair and
  a stacked figure as drawn: the final list, wall by wall, is in "Repair round 6".

**His order, built.** A sticky fact that does not fit beside its photo even when the photo
gives way a little keeps both: the photo narrows to about a third of the card (the widest
share, where the photo takes 30% of the sheet) and the fact runs to three lines at the floor
size, about 106 letters. All 48 saved facts of 73 to 106 letters now build with their photo and
their whole sentence. Then a list over a second card, then the wall designer's shorter whole
sentence, and the picture off last of all, in rule 8, the budget section (a new step, "Take
the picture off", before dropping the card) and the layout check's pointer (which had still
put "shorten the text" first); the wall preferences' principle 4, principle 5, floor line and
sticky row; the focused repair; and the build's refusal.

- **One thing to confirm with him.** At the floor size, three lines is the only way a 73 to 106
  letter fact fits beside a photo at a third, so principle 4 ("two lines is what fits an item")
  now names the long sticky fact as its one exception. The type is usually larger than the
  floor anyway, over four or five lines, as on every roomy card.
- I applied "the picture off last of all" to every wall sentence, not only sticky facts, since
  his first answer also puts the picture last; a success-criteria step is still never reworded,
  so its card's order is the list over two cards, then the picture off.
- **Before and after, for him** (`scratch/7ab/second/renders/`): `biome-pair.png` (80
  letters), `christmas-pair.png` (92), `lamp-pair.png` (105), each with the photo its own lesson
  used: before, round 3 had to take the photo off; after, the photo narrows and the whole
  sentence stays. `spill-pair.png` is the Christmas wall's card, its words past the panel
  before and inside after.

**Tests.** `working-wall-html/test/nothing-prints-past-a-panel-edge.test.js` builds the 48 facts
beside a photo, the Christmas card, two worked examples and the captioned number-line card, and
measures each in Chrome: the picture is there, every sentence whole, nothing in the padding or
past the edge, and the plan equal to the drawing. It also checks a fact a few letters over keeps
65% of the sheet for its words (the photo gives up only a little) and the line box at 36 and
80pt. The doc-claims budgets follow (73 and 106 letters build beside a photo, 109 is refused),
and the refusal's order. Twelve new undo checks are caught (50 of 50 then; 54 of 54 after round 6).

**Sizes.** The wall designer is 14 bytes larger than on 4.2.292 and 6 under its cap; the focused
repair is 7,959 bytes; the wall preferences 1.4 KB larger. The wall's programs are 15.7 KB
larger, most of it `layout.js`'s page model and the reasons for it.

**After the round.** Every suite passes (python 2,276 and 1 skipped, voice 21, builder 772,
worksheet 771, stick-in 73, wall 159, shared 126, test 46). The 28 change scripts, replayed on a
clean 4.2.292 copy, give the working tree, the pins and the mapping exactly. No new dash.

## Repair round 6 (the lead's go on the true fit)

The lead's message crossed with round 5's reply, so this round adds what it asked for beyond
round 5, and puts one scope question back (below).

**Every panel card planned as drawn.** Round 5 did sticky knowledge, definitions, worked
examples and sentence stems. Now the misconception pair is planned as the two cells it draws,
side by side under their labels ("✗ Don't", "✓ Do"), as tall as the taller cell, with the
picture beneath it taken from their height (it had been planned as one panel with both
sentences stacked, and the picture forgotten). And a figure stacked under a panel is planned
at the height it is drawn, with its gap, rather than at the reserve it is offered, which a wide
figure often does not fill (a captioned number line had left its words a size smaller than
their panel allowed).

**A Chrome test for each type** (`working-wall-html/test/each-panel-card-prints-the-lines-it-planned.test.js`):
twelve cards across the five types (beside a photo, beside a drawing, stacked over a captioned
number line, on their own, a long fact at a third, a short stem whose bullet pushes a word
over, a pair with a drawing beneath) are printed in Chrome, and for every item the lines it
printed are the lines the fitter planned, its height is within 1.5px of the plan, no text is in
the padding, and one size larger would not have fitted, so no card is drawn smaller than it
needs. A second check pins the stacked figure's planned height to the drawing code. With
`nothing-prints-past-a-panel-edge.test.js` (the 48 facts), the wall suite is 161 tests.

**The other eleven card types.** A Chrome audit of all sixteen types, every fixture and every
saved wall (`scratch/7ab/second/audit-all-types.js`), finds text outside its box on one card
only: a diagram section's note on `year-4-maths-lesson-14`, by 2.3px. Titles, banners, section
headings, chips, equivalence rows, reference tables, mnemonic posters, diagram captions,
overviews, hero callouts, cause cards and diagram sections each have their own fitter and are
unchanged. **Put to the lead:** convert all eleven (a much bigger change, which would also move
title sizes on every wall), only the diagram section, or leave them as audited.

**His saved walls, wall by wall.** Built on round 3's engine and this one, then compared (the
wall's text never crosses its panel's edge now; round 3 had one wall past the edge and three
more with words in a panel's padding). Nineteen of the 45 draw differently; none that built
before is refused, and none newly built:

| Saved wall | What changed | Why |
|---|---|---|
| `lesson-output/.../year-4-maths-lesson-3` | worked example 36 to 44pt | the old plan was too cautious; the steps fit larger |
| `lesson-resources-output/.../partition-4-digit-numbers` | stacked figure 109 to 121mm wide | the words' plan needs less of the sheet, so the figure takes more |
| `lesson-resources-output/.../partition-4-digit-numbers (1)` | stacked figure 192 to 210mm | the same |
| `lesson-resources-output/.../represent-and-estimate-on-a-number-line` | two cards, 40 to 44 and 44 to 48pt | too cautious |
| `lesson-resources-output/.../to-explain-what-the-christmas-celebrations...` | worked example 44 to 48pt; sticky card 68 to 64pt | the steps: too cautious; the sticky card printed 50px past its panel and now fits |
| `lesson-resources-output/.../to-identify-the-continuities-and-changes...` | 36 to 44pt | too cautious |
| `output/completion-2026-09-05/repeat-maths` | one card 64 to 68pt; stacked figure 203 to 217mm | too cautious; the figure takes the room freed |
| `output/trial-2026-09-05/diet` | 44 to 48pt beside a large figure | the figure sits beside the panel; the room it reserved beneath was never used |
| `output/trial-2026-09-05/maths` | stacked figure 203 to 217mm | the figure takes the room freed |
| `output/trial-2026-09-05/transfer-discovery` (the parachute) | 44 to 40pt | the fact had run to six lines, one more than an item may take; now five |
| `output/working/childrens-lives-continuity-and-change` | 60 to 64pt | too cautious |
| `output/working/name-the-layers-of-teeth` | 80 to 76pt | its words ran 18px into the panel's padding |
| `output/working/order-4-digit-numbers` | stacked figure 110 to 132mm | the figure takes the room freed |
| `output/working/partition-4-digit-numbers` | 40 to 48pt | too cautious |
| `output/working/round-to-the-nearest-10-and-100` | 44 to 40pt | its words ran 60px into the padding |
| `output/working/to-identify-the-continuities...sources (1)` | one card 36 to 40pt; one 68 to 64pt | too cautious; the other ran 42px into the padding |
| `output/working/year-4-maths-lesson-2` | stacked figure 134 to 147mm | the figure takes the room freed |
| `output/working/year-4-maths-represent-4-digit-numbers` | 40 to 44pt | too cautious |
| `tmp/balanced-pattern-plate-wall-review` | 44 to 52pt beside a large figure | the room reserved beneath a figure at the side is gone |

The balanced-diet wall is still refused, as on 4.2.292, now naming the 72-letter budget.

**Renders for him** in `plans/streamline-tools/7a-renders/` (before on the left, round 3; after
on the right): `biome-pair.png`, `christmas-pair.png`, `lamp-pair.png` (a saved fact of 80, 92
and 105 letters: before, the photo came off; after, it narrows to a third and the whole sentence
stays); `spill-pair.png` (the Christmas card: words past the panel, then inside);
`saved-wall-maths-lesson-3-pair.png` (larger steps), `saved-wall-layers-of-teeth-pair.png` (a
size smaller, out of the padding) and `saved-wall-parachute-pair.png` (six lines to five, a
size smaller). The single sheets are there too.

**After the round.** Every suite passes (python 2,276 and 1 skipped, voice 21, builder 772,
worksheet 771, stick-in 73, wall 161, shared 126, test 46). The 28 change scripts, replayed on a
clean 4.2.292 copy, give the working tree, the pins and the mapping exactly. 54 of 54 undo
checks are caught. No new dash.

## Repair round 7 (the lead's answer: the diagram section, and a guard)

**The diagram section's heading.** The audit's one other card printing outside its box was
the saved "Counting through zero" section (`lesson-resources-output/working/year-4-maths-lesson-14`):
each heading's words reached 2.3px past its strip. A heading line is 1.15 times its type,
tighter than the font's own line box (about 1.4 times), so the words of a heading's first and
last lines reach past their line; the strip's flat 0.06in padding did not cover that at 44pt.
The padding now takes at least the overhang (2.05mm at 44pt, from 1.52mm), and the heading is
measured as the page draws it (whole words of Comic Sans MS Bold across the strip's own width),
so each part plans its strip's real height (its lines, its padding and the gap under it; it had
planned one line and 0.14in). On that wall the strips hold their words and the two number lines
are a little smaller (186mm wide, from 196mm): the twentieth saved wall that draws differently,
rendered in `7a-renders/saved-wall-counting-through-zero-pair.png`. The other ten card types
keep their own fitters, as audited, so no title size moves on any wall. The section test that
compares a part's drawing with and without words now allows the exact 40% to the hundredth of
a millimetre the HTML writes (the heading's true height put it on that boundary).

**The standing guard** (`working-wall-html/test/no-card-prints-outside-its-box.test.js`, about
12 seconds): it builds every one of the engine's A3 fixtures, the "Counting through zero"
section (no fixture holds a diagram section), and every saved wall beside the plugin in this
checkout (50 found here; none in an installed copy), prints each page in Chrome, and fails if
any line of text lies outside the nearest drawn box around it (a fill or a border) or the page.
It also fails unless the fixtures and the section draw every card type in build.js's table (all
sixteen). A saved wall the build refuses draws nothing and is skipped. Flattening the heading
strip's padding again is caught.

**After the round.** Every suite passes (python 2,276 and 1 skipped, voice 21, builder 772,
worksheet 771, stick-in 73, wall 162, shared 126, test 46). The 30 change scripts, replayed on a
clean 4.2.292 copy, give the working tree, the pins and the mapping exactly. 55 of 55 undo
checks are caught. No new dash.

**What changed after round 6**, for the third checker: `a8f_section_heading.py` (the section
heading in `working-wall-html/src/render-section.js`, and the 40% test's tolerance),
`a8ft_no_card_outside_its_box_test.py` with `7a-change/new/no-card-prints-outside-its-box.test.js`,
the mapping's `SA-ADD-13-NO-CARD-OUTSIDE`, the log entry's true-fit bullet and sizes, and one
undo check.

## Repair round 8 (after `7a-release-third-check.md`)

**Arrows, drawn within the line** (`a8g_arrows_within_the_line.py`). The check found a line
holding an arrow printing about 28% taller than planned: Comic Sans MS has no arrows, and Chrome
drew them from the next font in the wall's own stack, Segoe Print, whose line is 1.78 times its
type (142px against 111px at 60pt, measured here with Chrome's own record of which font drew
each glyph). Of the two repairs the lead offered, I drew the arrow within the line rather than
planning the taller line: a "Wall Arrows" face takes Arial's arrows alone (`unicode-range`
U+2190 to U+21FF, `local()`, bold and regular) and sits after Comic Sans MS in every font stack
the wall writes. Arial's line sits inside Comic Sans's own, so a line holding an arrow is the
height every other line is, on all sixteen card types, and the plan needs no second font's
measurements (which would differ by machine); every other character Comic Sans lacks still
falls to Segoe Print. The arrows' advances (Arial Bold: 1em across, half that up or down) join
the plan's width table. The one visible change: the arrows are Arial's, a little plainer than
Segoe Print's hand-drawn ones (`7a-renders/saved-wall-rounding-arrows-pair.png`).

- The third check's arrow sweep, rebuilt here (178 cards that build: worked examples and facts
  with an arrow on most lines, landscape and portrait, with a photo and without): none past its
  panel, none into its padding.
- The saved rounding wall: its plan now equals its print. It stays at 40pt, where round 6 put
  it: at 44pt its steps would still need 1,236px of a 1,218px panel.
- The saved walls: the same twenty draw differently as in round 7, now all with the arrow face
  in their font stacks; the rounding wall is the only one holding an arrow.

**The arrow cases in the Chrome tests.** The per-type test gains a sticky card and a worked
example full of arrows (their planned lines and heights are the printed ones), and the standing
guard gains the arrow sweep (60 cards over both orientations, with a photo and without; it fails
if fewer than 40 are drawn or any prints outside its box). Drawing arrows from Segoe Print again
is caught.

**The undo misses.** The per-type test now holds two definitions the letter count sized wrongly
(beside a drawing, one planned a size too large and one a size too small), a card beside a
dominant figure (a reserve beneath it would size it from 72 down to 48pt), and a fact too long
beside a drawing, refused against its four lines, never the photo's three. All four undo checks
are caught.

**Held:** the three-line exception, as built, while the lead asks him.

**After the round.** Every suite passes (python 2,276 and 1 skipped, voice 21, builder 772,
worksheet 771, stick-in 73, wall 163, shared 126, test 46). The 31 change scripts, replayed on a
clean 4.2.292 copy, give the working tree, the pins and the mapping exactly. 59 of 59 undo
checks are caught. No new dash.

**Changed since round 6**, for the checker: `a8f_section_heading.py` (render-section.js, the 40%
test's tolerance), `a8ft_no_card_outside_its_box_test.py`, `a8g_arrows_within_the_line.py`
(shared.js, the five render files' font stacks, layout.js's widths), the two test files in
`7a-change/new/` (`each-panel-card-prints-the-lines-it-planned.test.js` and
`no-card-prints-outside-its-box.test.js`), the mapping's `SA-ADD-13` and `SA-ADD-14`, the log
entry, five undo checks, and two renders.

## Repair round 9 (the updated third check: the arrow's weight, and arrow tests everywhere)

**An arrow as heavy as the digits, still within the line** (`a8h_heavier_arrows.py`). The check
found round 8's Arial arrow a hairline: a 4px shaft at 60pt against Comic Sans MS Bold's digits'
11px. As the lead asked, I first tried heavier arrows within the line, measured in the Chrome
the wall prints with (`scratch/7ab/second/arrow-weight.js`, `arrow-look.js`): Arial Bold 4px,
Segoe UI Black 5px, Segoe UI Symbol 7px, Segoe Print Bold 8px, and synthetic bold on any of them
thickened nothing. None reached the digits. So I kept the arrow within the line another way: the
"Wall Arrows" face is now Segoe Print's own arrow (the one his walls had), drawn 40% larger
(`size-adjust: 140%`), which gives an 11px shaft, the digits' weight, and the face's own ascent
and descent are held under Comic Sans's (`ascent-override: 78%`, `descent-override: 20%`), so a
line holding an arrow is the height of one without at every size from 20 to 100pt, both weights.
The plan still needs no second font; the arrows' advances follow (1.397em across, 0.697em up or
down). Measured: the 178-card arrow sweep, none past its panel or into its padding; the per-type
test's arrow cards print the lines planned.

- **Renders:** `7a-renders/arrow-weight.png` (the arrow as his walls had it, round 8's hairline,
  and now, each on the panel's colour with its line marked) and
  `7a-renders/saved-wall-rounding-arrows-pair.png` again (the rounding wall's steps at 40pt, the
  arrows now heavy; 44pt still needs 1,236px of a 1,218px panel).

**An arrow test for every place the face is written**
(`working-wall-html/test/every-arrow-is-drawn-from-the-wall-arrows.test.js`, copied by
`a8ht_arrow_face_test.py`). It builds an arrow into a panel card and its title bar, a stacked
figure's caption, a table, a section heading, an overview's callouts and a diagram section's
notes, and into a bare line under the page's own default, and fails if any arrow is drawn another
way (the face's arrow is 1.4em across; Segoe Print's or Arial's about 1em). A second test fails if
a line holding an arrow is taller than one without, or if the shaft is under 10px at 60pt.
Removing the face from any of the six font stacks, or from the page's default, or undoing the 40%
or the held metrics, is caught (eight new undo checks).

**Held:** the three-line exception, as built.

**After the round.** Every suite passes (python 2,276 and 1 skipped, voice 21, builder 772,
worksheet 771, stick-in 73, wall 165, shared 126, test 46). The 33 change scripts, replayed on a
clean 4.2.292 copy, give the working tree, the pins and the mapping exactly. 67 of 67 undo
checks are caught. No new dash.

**Changed since round 8:** `a8h_heavier_arrows.py` (shared.js's arrow face and comment,
layout.js's arrow widths), `a8ht_arrow_face_test.py` with
`7a-change/new/every-arrow-is-drawn-from-the-wall-arrows.test.js`, the mapping's `SA-ADD-14`,
the log entry's arrow sentence and sizes, eight undo checks, and two renders.

## Repair round 10 (his answer: how many long facts one card holds)

His words, recorded by the lead in the preferences-rest ledger ("How many long facts one wall
card holds"): asked whether a long fact may run to three lines but a card holds only one of
them, any other going on a second card, he answered "yes". Quoted in the log.

**Built** (`a8i_one_long_fact_a_card.py`). On a sticky card whose photo has narrowed to about a
third, the fitter counts the facts that take the floor's third line; more than one, and the card
is refused, naming each and the move: "Put the second long fact, and any after it, in order on
a second card of the same type and title: that keeps every word and is a layout change a
focused repair may make (the teacher's rule, one three-line fact a card)". Written in rule 8
("a sticky fact's photo to a third; one such fact a card"), the wall preferences' principle 4
beside the poster sentence ("... becomes a poster, so a card holds at most one sticky fact on
three lines: a second goes, in order, on a second card of the same type and title"), the focused
repair ("A panel too tall for its page, or a second three-line sticky fact, is a layout fault you
can repair without touching a word"), and the build's message. The wall designer stays 6 bytes
under its cap (its budget line and layout-check pointer say the same in fewer words); the focused
repair is 7,996 bytes, under its 8,000. The earlier topics' pins follow the focused repair's
changed sentence (38 pins in 28 rows now).

**Tested** (`nothing-prints-past-a-panel-edge.test.js`): a card of three 106-letter saved facts
is refused with that message, and each of them alone on a card builds; a card of one 106-letter
fact and two short ones builds, its photo and every sentence kept and nothing past its panel.
Letting a card hold any number, or two, three-line facts, or dropping the move from the focused
repair, is caught. No saved wall is newly refused.

**After the round.** Every suite passes (python 2,276 and 1 skipped, voice 21, builder 772,
worksheet 771, stick-in 73, wall 166, shared 126, test 46). The 34 change scripts, replayed on a
clean 4.2.292 copy, give the working tree, the pins and the mapping exactly. 70 of 70 undo
checks are caught. No new dash.

## Repair round 11 (after `7a-release-fourth-check.md`: his rule never loses a wall)

The fourth check found his rule could lose a wall: with three long facts the named move left two
on the second card, refused again, and a wall takes two teaching cards; and the focused repair's
split failed its own scope check whenever a card kept a single item, so with one repair round
the wall was excluded. His standing rule is repair first, and a finished piece every time.

1. **His rule stays the designer's instruction.** Rule 8 ("a sticky fact's photo to a third; one
   such fact a card") is unchanged; the wall preferences, beside the poster sentence, now say the
   second long fact goes "on a second card of the same type and title where the wall has room.
   Where it has none, the build takes that card's photo off and keeps every sentence whole, and
   says so."
2. **The build never loses a wall for it** (`a8j_never_lose_the_wall.py`). The move I chose: a
   sticky card that still holds more than one long fact beside its photo at build time, and fits
   once its photo is off, is built with **that card's photo off, every sentence kept whole on the
   full width**, and a note: "more than one fact needs three lines beside the photo, and a card
   holds one fact that long, so this card is built with its photo off and every sentence whole.
   To keep the photo, the wall designer moves the next long fact to a second card where the wall
   has room, or gives it a shorter whole sentence." Why: of the last moves of his order, a
   shorter whole sentence is the designer's to write, and the build never writes words; the
   photo off is the one move the build can take, and it keeps every word. A refusal stays only
   where even the full width cannot hold a fact (over 106 letters), and its message now says the
   next fact goes to a second card where the wall has room and a fact that still cannot fit gets
   the designer's shorter sentence.
3. **The scope check allows the split.** `check-repair-scope.py` keeps each single-value list as a
   piece that may end a split, in walk order, so a split in order rejoins; a reordered or dropped
   item is still caught. Tests: a split leaving a card one step, two long facts one to a card, a
   single item out of order still refused; and through the route itself
   (`scripts/tests/test_a_split_wall_arrives.py`): `run-fixed-resource.py wall` refuses a sticky
   card too tall for its page, the split that leaves the second card one fact passes the scope
   check, and the rebuild delivers the wall.
4. **The undo miss.** The edge test builds two and three long facts on one photo card: each is
   built, the photo off, every sentence whole, nothing outside the panel, and the note names the
   move; letting two long facts through beside one photo (the checker's `+ 1`) is caught, as are
   refusing the card again, keeping the photo, and the scope check refusing the split.

**After the round.** Every suite passes (python 2,280 and 1 skipped, voice 21, builder 772,
worksheet 771, stick-in 73, wall 166, shared 126, test 46). The 36 change scripts, replayed on a
clean 4.2.292 copy, give the working tree, the pins and the mapping exactly. 74 of 74 undo
checks are caught. No new dash. No saved wall changes (none holds two long facts beside a photo).
