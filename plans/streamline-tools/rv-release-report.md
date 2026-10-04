# The design reviewer release (topic 8, release 2): what was built

Built from `reviewer-release-brief.md`, following `plans/2026-09-24-topic-8-change-plan.md`
section 3 (with sections 0, 1, 8, 10 to 13) and the teacher's words in
`plans/2026-09-23-design-reviewer-ledger.md` ("Decisions taken", "His answers, 24 September
(afternoon)", the settled items, and the closing section the subject-files release added).
Built on the side branch `streamline/8-reviewer` in `C:\Users\Daniel\Projects\lessonv4-reviewer`,
from `b1c2d427` (4.2.292). Nothing is committed; the version is not bumped (the lead sets it at
merge). Repaired after the first independent check (`rv-release-check.md`), and C10 turned back
by his answer of 26 September, then repaired after the second independent check
(`rv-release-second-check.md`): see "Repairs after the second check", "His answer on C10" and
"Repairs after the first check", which come first.

## Repairs after the second check

The lead asked for three last repairs before the merge (7A is now committed on main as `59f85708`,
4.2.293).

1. **The log and report now say only what is true today about two used-up designer passes.** They
   had said the run "never ends complete". That is the playbook's instruction to the run, and no
   program holds it: the run report check passes a report marked complete while the last review
   still says `REDESIGN REQUIRED`, if the unresolved finding was not carried into the report's
   blocking faults (the second check's `probe_unresolved_review.py`). The log now says the playbook
   tells the run to build the lesson from the last design, carry the finding into the blocking
   faults and his teacher flags, lead his report with it and never end complete; that this is held
   by the playbook's words, not a program; and that the missing check is carried to the playbook's
   run-faults release (the lead adds it there). **Three log sentences are pinned** (new pin row
   `RV-DEC-LOG-SENTENCES`): C10 staying the reviewer's by his answer; that floor, as it is now worded;
   and the name case's count ("fired on 41 of the 53", "fires on 19 of the 53"). Four new undo
   checks change each one and each is caught.
2. **The name list sees a one-word name that opens its board sentence.** `England, 1485 to 1603.`,
   `Bruegel painted ...`, `Jenner tested his idea ...`, `Childline is ...`: each is capitalised only
   for being first, so the list dropped it unless the lesson capitalised the same word elsewhere,
   and only the board and titles could vouch for it. Now the teacher's script vouches too, the way the
   board's own mid-sentence capitals already did (the 4.2.287 finder, `board_names_in`, reused
   unchanged): a word the script capitalises mid-sentence counts as known. The script only vouches;
   a name only the script says is never listed, because the class cannot read the script. The
   second check's prototype, built into the packet (`rv_03b_names_from_the_script.py`,
   `spoken_reading`), with a test: a board's `England, 1485 to 1603.` is listed once the script says
   "in England" mid-sentence, not when the script only opens a sentence with it, and "London" said
   only in the script is not listed. Seven saved views now list one or two more names: `England`
   (the Tudor farm lesson), `Bruegel` (a history lesson that fires anyway) and made-up children
   (Nadia and Grace, Jack and Jamal, Aisha, Lena, Maya), none of which fires. **The trigger table**
   (`rv-name-trigger.md`) reads the before-views and after-views each; `Tudor` is now named the
   borderline case it is, a period that does not fire by the trigger's own words, and the Tudor
   farm lesson fires on `England`. Still 41 before and 19 after, now every one of the 19 on a real
   person, place, organisation or event. Two new undo checks are caught (the script no longer
   vouching; a name only the script says listed).
3. **One more line for him** under "Anything he should know": a made-up child named in a beat still
   opens the picture rules, about 15 KB.

Also: the trial merge now reads 7A from its commit, `59f85708`, never from the main checkout, and
runs the whole Python suite on the merged tree. The log entry is now written before the pins are
built (its sentences are pinned), so the replay order puts `rv_08` before `build_rv_mapping.py`.

## His answer on C10 (26 September)

Asked, with "Look at the diagram." as the example, whether the reviewer rewrites a Teach example
written as an instruction to look itself, as what children will notice ("Notice the enamel is the
hardest layer."), he said "yes". The lead recorded it in the design reviewer's ledger ("His
answers"). So C10 stays the reviewer's own wording fix; J34 (a Do that says its Teach back) and
M14 (a photograph of a tool the engine draws) still go to the lesson designer.

- **The sentence:** RV-C10 is back word for word as it was on 4.2.292: "Repair it to what they
  will notice, or, when the picture's own label already names the thing, take the line off the
  board and let the key question do the pointing (...)". `rv_02` no longer touches it.
- **The fixture case:** now `teach-example-written-as-an-instruction-to-look-is-rewritten`,
  `APPROVED AFTER BOUNDED CORRECTION`, owner Design Reviewer, with his example: `Look at the
  diagram.` rewritten as `Notice the enamel is the hardest layer.`, or the line taken off the board
  when the picture's own label already names the thing. Its forbidden finding: "Do not send a line
  of words back to the Lesson Designer; make the wording fix yourself." The two send-back cases are
  unchanged.
- **Mapped with his words:** RV-C10's outcome in the mapping and pins quotes his answer and his
  decision 2 words, pins the kept sentence, and bars the words that first sent it to the designer.
  TD-L10 still moves (for C08 and C13 only), and its outcome and the rhythm ledger's note no longer
  mention C10. The rest-of-preferences row that quotes C10 (PF-Q25) is unchanged, so the later
  lists' changed rows are 16 and 2, not 17 and 2.
- **His answer is in the replay:** the lead recorded it in this branch's copy of the ledger;
  `rv_00_his_c10_answer.py` places the same words there on a clean tree (checked byte for byte
  against the lead's record), so the replay still makes the branch exactly.
- **In the log and tests:** the log entry says so in his words; a test holds the sentence, the
  fixture case and his recorded "yes"; two new undo checks are caught (the sentence sent to the
  designer again; the case given to the designer again).

## Repairs after the first check

The lead asked for three repairs, and to hold C10 while he asked the teacher (done above).

1. **The name trigger fires on a real person, place, organisation or event, not on any name.**
   The check found the first wording ("lists a name") fired on 43 of 53 saved designs, 20 of them
   for nothing: made-up children in maths and PSHE questions, labels such as `Chart A` or `Day A`,
   and words the list takes for names (`LESSON`, `PSHE`), each costing the reviewer about 18 KB.
   It now reads: "Read its `Lesson Designer content boundaries` too whenever the view's `Names on
   the board` lists a real person, place, organisation or event, for `A name, or a thing the class
   has never met, arrives with its context`; a made-up person or a label such as `Chart A` is not
   this case." "A named person, place, organisation or event" is the opened paragraph's own opening
   words, and whether a listed name is real is seen, not a defect judged. **Before and after, design
   by design:** `plans/streamline-tools/rv-name-trigger.md` (`rv_17_name_trigger_table.py`, every
   name's reading written out). Fires before on 41 of 53, after on 19 of 53: the three Christmas
   lessons, the twelve history lessons on children's lives and Victorian work, the two geography
   lessons, the Shaftesbury lesson, and the Tudor farm lesson (`year-4-history-lesson-2`), which at
   first listed only `Tudor`, a period, and was counted on a generous reading; after the second
   check it lists `England` too and fires on that. The Roman numerals lessons (`Roman`) and the two PSHE lessons naming `RSE` do not
   fire. (The check counted 43 because it could build views for the two old designs this branch's
   view builder cannot; neither has a real name either way.) A test holds the words and that "lists
   a name," is gone; three new undo checks are caught (the trigger widened back, its limit dropped,
   the log's reader line claimed as his).
2. **The fixed reader is the lead's reading, and every place says so.** His words, on the
   rest-of-preferences list (24 September), were about other lines: "I actually don't know why it
   says nine-year-old. Um, because the plugin is for years one, two, three, four, five, and six,
   right?" The wording "the actual child in this class" is the lead's. The log entry, the mapping
   (RV-G09's outcome), the AK-G21 pin outcome, the assumed-knowledge and voice ledger notes, the
   after-merge rest-of-preferences note and this report now say "the lead's reading of his words,
   not his wording". A test holds the log's sentence.
3. **What happens when send-backs use up the run's designer passes** (the playbook's Phase 1.25,
   unchanged by this release):
   - **All of one review's send-backs go back together, in one designer pass.** A `REDESIGN
     REQUIRED` gives the Lesson Designer "the current canonical files plus the complete
     diagnosis", every redesign item at once. A review that finds a photographed number line and
     a restating Do costs one designer pass, not two.
   - **A run allows two such passes**, each followed by validation and a fresh review.
   - **If the review after the second pass still sends something back, the playbook tells the run
     to build the lesson anyway.** The review loop ends; the pipeline continues from the last
     design, which still passes every deterministic check, and builds the deck, sheets and the rest.
     The playbook tells the run to carry the unresolved findings into the run report's blocking
     faults and the teacher flags, lead his report with them, and never end `COMPLETE`. That is his
     repair-first rule's floor (a finished piece with the fault named), but it is held by the
     playbook's words, not a program: the run report check passes `COMPLETE` if the findings were
     not carried over (the second check's finding; the check is carried to the playbook's
     run-faults release). And the fix the reviewer named is not made: the photographed number line
     stays a photograph, the restating Do stays.
   - Before this release the reviewer was told to make these two fixes itself, which for the
     photograph it could not do (the after-review check refuses any change to the photographs), so
     a photographed tool was never repaired by the review either way.

After every repair and his C10 answer: every suite green (below), the replay makes the branch
exactly, 38 of 38 undo checks caught, no dash added, and the trial merge with 7A run again (below).

## In short

- Every decision and settled item in section 3 is built, with his words as the standard: his
  decision 2 (the designer makes two bigger fixes, the reviewer names them, and by his answer of
  26 September the "look at the diagram" line stays the reviewer's), decision 7
  (the card opens the three sections), settled items 4, 5 (the reviewer's own lines), 10 and 11,
  and the lead's reading of his words for the "fixed reader". Settled items 1, 6, 8 and 9 add nothing here, as the plan
  says.
- The change is eleven scripts in `rv-change/`, each old text asserted once, line endings kept.
  Replayed in order on a clean `git archive b1c2d427` copy (`rv_16_replay.py`), they make this
  branch's tree exactly: "different from this branch: nothing" (the plugin byte for byte, the
  seven ledgers and the mapping).
- Every suite passes (table below). The 53 saved designs give the same result as before, design
  by design. Every saved design's review card differs from before in exactly the three trigger
  lines; seven review views list one or two more names, and nothing else in any view changes.
- Each of the changes, undone one at a time on a scratch copy, is caught by a test
  (`rv_13_undo_checks.py`, 38 of 38).
- A trial merge with 7A's commit, `59f85708` (`rv_14`, `rv_15`): the reviewer's file, the review
  packet and its tests merge cleanly; the log and three pin files conflict as expected; resolved as
  the lead would and followed by `rv_09_follow_at_merge.py`, the whole Python suite passes on the
  merged tree (2,301 passed, 1 skipped).
- The reviewer's instructions, read whole every review, are 1.3 KB smaller (74.6 to 73.3 KB),
  not the 2.0 to 2.5 KB the plan estimated. The routing card now opens more reading in some
  lessons (19 of 53 saved designs for the name case). Both said plainly under "Size".

## The scripts, in replay order

All in `plans/streamline-tools/rv-change/`, run with `python -X utf8 <script>`. Each finds the
tree from its own place and prints it before it writes.

| Script | What it does |
|---|---|
| `_patch.py` | one replacement at a time, old text asserted once, line endings kept |
| `rv_00_his_c10_answer.py` | his answer on C10 as the lead recorded it in the reviewer's ledger, placed so a replay makes the same ledger |
| `rv_01_stories_first.py` | the build-log entry's heading and its "Stories kept here" block: every story sentence that leaves the reviewer, word for word, before anything moves |
| `rv_02_reviewer.py` | the reviewer's instructions: decision 2 (J34, M14; C10 left as it was), settled items 4, 5, 10, 11, the fixed reader |
| `rv_03_card.py` | decision 7: the three triggers on the routing card (code) |
| `rv_03b_names_from_the_script.py` | the second check's item 2: the name list takes a one-word name opening its board sentence when the script names it mid-sentence (code) |
| `rv_04_fixture.py` | decision 2's two send-back cases and his C10 case in the reviewer's behaviour fixture |
| `rv_05_tests.py` | two tests follow changed words; the packet tests gain the card, fixture and report-shape tests (`new/packet_tests_addition.py`); the new pin test is placed (`new/test_design_reviewer_ledger_is_kept.py`) |
| `rv_06_repin_other_topics.py` | earlier topics' pins that held a changed sentence follow it, found by their words, so it replays on the merged tree too |
| `rv_07_record_in_ledgers.py` | a closing section in the AK, QC, SC, TD, WS, voice and reviewer ledgers |
| `rv_08_log_entry.py` | the log entry above its stories |
| `build_rv_mapping.py` | `plans/2026-09-26-design-reviewer-mapping.md` and `scripts/tests/design_reviewer_ledger_pins.json` (after the log, whose sentences it pins) |

Tools, not part of the replay: `rv_cards.py` (every saved design's card and view, before and
after), `rv_11_dash_check.py`, `rv_12_sizes.py`, `rv_13_undo_checks.py`, `rv_14_merge_trial.py`
and `rv_15_merge_trial_resolve.py`, `rv_16_replay.py`. For the lead at merge:
`rv_09_follow_at_merge.py` (runs `rv_06`, the mapping builder and `rv_10_record_after_merge.py`).

## What changed, decision by decision

### Decision 2 (his 1, then "1. y", and his C10 answer): the designer makes two bigger fixes, the reviewer names them

His words: "if it's a small thing, say it's words aren't right and it thinks these words would be
better, then the reviewer changes them ... Swapping a photo of a number line for a drawn one or
rewriting a doobie. Sounds like it should be for the lesson designer", then "1. y" to the read-back
(small wording fixes are the reviewer's; a picture swap or a rewritten Do beat goes to the lesson
designer, with the reviewer naming the fix).

- **RV-C10** (a Teach example written as an instruction to look): unchanged, the reviewer's own
  wording fix, by his answer of 26 September (see "His answer on C10"). The plan had sent it to the
  designer, and the first build did.
- **RV-J34** (a Do that says its Teach back): "The repair keeps the chunk and is the Lesson
  Designer's, because it changes what children have to think: return it naming the fix, which
  asks for the because, ..." The list of repairs and both pointers are unchanged. The plan's words.
- **RV-M14** (a photograph of a tool the engine draws): "Return it to the Lesson Designer, naming
  the helper that should draw it." M15 unchanged. The plan's words.
- J11, O04 and O05 are unchanged and now agree with J34 and M14. The wording repairs stay the
  reviewer's (a clause saying who a name is, F11; carrying the script's question onto the board,
  G22; a second accepted placement, J07; the voice sweep); a test holds each.
- **Fixture:** two send-back cases, each `REDESIGN REQUIRED`, owner Lesson Designer, forbidden
  finding opening "Do not make the change yourself; name it."; and his C10 case, `APPROVED AFTER
  BOUNDED CORRECTION`, owner Design Reviewer, with his example. Checked first: none of the ten cases
  the fixture gives the reviewer as a bounded correction is either send-back. Each case's forbidden
  finding carries its check's own limit from the reviewer's file (a board that honestly lacks a
  part; a quick check on a fresh case; a real-world referent). The case wording is mine, bar his
  example.
- **What a send-back costs** (in the log): all of one review's send-backs go back together in one
  designer pass; a run allows two; after that the lesson is still built and his report leads with
  the unresolved finding (see "Repairs after the first check", item 3).

### Decision 7 (his 2, "2. yes"): the card opens the three sections

- Each trigger keeps every word it had and gains one sentence after its last line:
  - Slide Philosophy: "Read its `Lesson Designer content boundaries` too whenever the view's
    `Names on the board` lists a real person, place, organisation or event, for `A name, or a
    thing the class has never met, arrives with its context`; a made-up person or a label such as
    `Chart A` is not this case." (repaired after the first check; it first said "lists a name")
  - Lesson Designer visual-need boundary: "Read it too whenever a beat quotes, voices or names a
    made-up person who is present in it, for `A person the lesson invents counts as something in
    the world`; one only referred back to is not this case."
  - Source and Scenario Integrity: "Read it too when a made-up person or story stands for a group
    the objective is about (`An invented case is evidence about the group`)."
- RV-F20 ("your whole reading assignment") is now true for the reviewer's pointers F12, M05 and
  C18, and stays.
- Tests: a real `prepare` prints each full trigger line on the card; each sentence ends its
  trigger with the earlier words whole; each paragraph it names is in the section it opens, limit
  included. The saved designs' cards, all 53, differ from before in exactly these three lines.

### Settled item 4 (his b, stronger): the board first, the notes separately

His words: "maybe it should look at the board first. Judge the board first ... So maybe it should
be board first, speaker notes separate." RV-I07 now reads "Judge the visible explanation first, on
its own, and the spoken one separately, so nothing counts as taught on the board because the
script says it; do not solve a missing connection merely by adding words to an already crowded
slide." (the plan's words). RV-C15's "read the two together" stays (the plan's risk 3): it is the
comparison that finds script-only teaching. The log says why. No other copy of "judge together"
exists (grepped the reviewer, its repair, the route checks, references, skills and programs).

### Settled item 5, the reviewer's own out-of-date lines

- **RV-O14:** "A failed check sends your corrections to a focused repair and, only if that fails,
  the whole design to a fresh attempt, which delays every resource in the lesson so that one
  sentence can be shortened; shortening it here costs you a minute." The plan's words.
- **RV-P06:** the report shape gains, under the count line, `Closest to a repair:` and three lines
  `> "the exact string" - why it stands`. A test reads the shape out of the file and matches each
  line against the after-review check's own patterns, so the two cannot drift apart again.
- **RV-J18:** "The design states this in each unit's `unlocks`".
- Not here, as the plan agreed: RV-A10 and RV-R23 (the playbook release), RV-T11 (7A).

### Settled item 10: one copy of each rule

Cut: RV-E05 ("Do not recheck identifier or reference legality.", E02 holds it), RV-K09 (the amount
bullet, C02 holds it; AK-A49 and WS-I05 moved), RV-N14 (the reading-order line before the drift
check; F15 and F18 hold it), and K03's "do not repeat a separate whole-lesson sweep" (G02 holds it).
RV-P12 moves word for word to follow P09 in one paragraph ("Use `APPROVED` when ... may exist.
Use `REDESIGN REQUIRED` when ..."). The near-repeats keep their words (O01's "one clear", K03's
middle sentence, N09, P08); a test holds each.

### Settled item 11: the stories

Copied first, word for word, into the log entry's "Stories kept here" (the ledger said every
incident was in the log, but not every sentence was: the 22 September verdict quote, for one).
Out of the reviewer: C06, C08 (the sentence ends at "this catches too little"; his words stay in
`preferences.md`, Slide Philosophy and the Tudor calibration), C13 (its two script lines stay as
plain examples: "A script line such as ... with no counterpart on the board, is that finding."),
F09 (the reason stays), G05 (its last clause stays as the reason: "A count line alone is what a
sweep that happened and a sweep that did not both produce."), G21 (`What do their reasons share?`
over its script stays as a plain example, "is the shape: the plain version is already written, and
the class gets the clever one."), M06, D06 ("and the teacher would have to edit it out by hand"),
and the worksheets plan's two (L10: "Read the forms rather than confirming the objective
matches."; L11: the teeth sheet stays as "as in a *name the layers of teeth* sheet that asked for
three names on three ruled lines under an unused diagram."). The words round the kept examples
are mine; everything else is the plan's.

### The fixed reader

RV-G09: "the actual eight- or nine-year-old the year group names" became "the actual child in this
class". This is the lead's reading of his words, not his wording: on the rest-of-preferences list
(24 September) he said "I actually don't know why it says nine-year-old. Um, because the plugin is
for years one, two, three, four, five, and six, right?" of other lines, and the lead carried it to
this one. The log, the mapping and the ledger notes say so, so he sees it as the lead's.

### Left exactly as it was

Settled item 1 (his "not if it hassnt been broken anyway"): no line added to the four-pieces
calibration. The effort settings, every heading and marker the after-review check reads, and the
two paragraph openings the voice harness's sweep runner reads; a test holds each.

## Where I departed from the plan, and why

1. **The card's triggers are my wording.** The plan called its wording drafts that must each fire
   on something visible. Its name draft ("a name whose first appearance has no words telling the
   class who or what it is") needs the defect judged first, which the comment above
   `ALWAYS_READ_REVIEW_SECTIONS` says never fires. Mine first fired on any name the list prints,
   which the first check found far too wide; it now fires on a real person, place, organisation or
   event the list prints, in the paragraph's own words. Each sentence names the paragraph it is
   for, as the Vocabulary note does.
2. **The name case opens one subsection, not all of Slide Philosophy's designer parts**: about
   18 KB, where all three designer parts are about 34 KB.
3. **Each new sentence follows its trigger rather than joining its sentence.** The plan said "after
   «...instructions only» add 'or when...'". Appending a sentence keeps every line the earlier
   topics pinned (TD-L18, AK-DEC-05) exactly as it is.
4. **RV-P12 moved word for word** beside P09, not in the plan's semicolon form (move before
   reword).
5. **The reviewer's instructions are pinned as this topic's home, section by section** (seven
   sections, 105 paragraphs). A later release that edits the reviewer must move those pins, as it
   already must for the six earlier topics' pins on the same file.
6. **C10 is not built as the plan had it.** The plan sent the Teach example written as an
   instruction to look to the lesson designer, and the first build did; the first check found his
   words keep a wording fix with the reviewer, and asked with an example he said "yes" to the
   reviewer rewriting it itself (26 September). His words win: C10 is unchanged.

## Every pin, and why

**New.** `scripts/tests/design_reviewer_ledger_pins.json` (536 pin rows, 551 KB) with
`test_design_reviewer_ledger_is_kept.py`: all 428 rows (393 unchanged in place; 34 changed, each
with its decision and each changed row's whole paragraph; and C10, kept as it was, mapped with his
answer of 26 September; 26 retired wordings barred, among them the words that first sent C10 to
the designer), three added rows (the fixture's three cases; three pinned log sentences; the name
list's new witness in the packet), and the reviewer's seven sections
paragraph by paragraph (105). Nine of the 34 were changed after the ledger's snapshot by earlier
releases and are mapped to the words they left: RV-S39 (the success-criteria release), RV-K10, L02,
L08, T22 (worksheets), RV-T05 to T08 (subject files; T06 to T08 held by their removed files staying
gone). Nine decision tests. The mapping's last section names the 18 rows of later lists (16
rest-of-preferences, 2 voice) that quote a changed line.

**Earlier topics' pins moved in place** (`rv_06`, 17 pins and one home record; each outcome names
the decision; each topic's ledger says so):

| Pins | Rows | Why |
|---|---|---|
| assumed knowledge | AK-A49; AK-G21; AK-K01 | the amount bullet cut (settled 10); the fixed reader (the lead's reading); the reading list's F09 story (settled 11) |
| quick checks | QC-C08, E11, P01 (section 3 list); QC-D08 | the restating Do goes to the designer (decision 2); "now" (settled 5) |
| success criteria | SC-Q01 | the same section 3 list |
| the rhythm | TD-L07, L09; TD-L10 | the section 3 list; the Teach-board paragraph (C08 and C13; C10 in it is unchanged) |
| worksheets | WS-I05; WS-Q02, Q08, HOME-WS-REV-03, the section 5 home record; WS-Q10, Q11 | the amount bullet; the two stories the worksheets plan left here (settled 11) |

Vocabulary, colours and subject-files pins are untouched.

## The suites

`bash plans/streamline-tools/run-all-suites.sh rv-after`, with the venv's `python3` first on
`PATH` (logs `rv-after-*.log`, baseline `rv-before-*.log`):

| Suite | After | Before (4.2.292) |
|---|---|---|
| python | 2,276 passed, 1 skipped | 2,255 passed, 1 skipped |
| voice harness | 21 | 21 |
| builder | 762 | 762 |
| worksheet-html | 771 | 771 |
| stick-in-sheets-html | 73 | 73 |
| working-wall-html | 154 | 154 |
| shared | 126 | 126 |
| test | 46 | 46 |

The twenty-one new Python tests are the new pin test (eight shared checks, nine decision tests)
and the four packet tests. No engine changed, so the engine suites are as before.

## The saved designs, the cards and the views

- **Validator:** `rv-after-designs.json` against `rv-before-designs.json`: the same 53 designs,
  every result identical (none passes either way; the validator is untouched).
- **Cards and views** (`rv_cards.py before|after`, built with the packet's own functions, because
  `prepare` runs the validator first and refuses every saved design): 53 cards, each differing in
  exactly the three trigger lines; 51 views, 44 identical and seven listing one or two more names
  (`England`, `Bruegel` and made-up children; two old designs cannot build a view, before or
  after). A test runs the real `prepare` on a valid design and finds the three lines on its
  card.

## Size, before and after

Line endings normalised (`rv_12_sizes.py`):

| Group | 4.2.292 | After | Change |
|---|---|---|---|
| Instruction files (the reviewer's) | 74,602 | 73,271 | -1,331 |
| Programs (the review packet) | 130,293 | 132,433 | +2,140 (the triggers 0.8 KB, the name list's witness 1.4 KB) |
| Tests, pins and the fixture (11 files) | 2,592,133 | 3,172,333 | +580,200 (the new pin file 550,724) |
| The build log | 749,791 | 764,829 | +15,038 (the entry and its stories) |

- **The reviewer's instructions: 1.3 KB smaller**, not the plan's 2.0 to 2.5 KB. The stories and
  repeats took out 2.0 KB; his decisions put 0.7 KB back where they are read (the two fixes named
  for the designer, the board-first sentence, the closest calls in the report shape, the true
  failed-check route).
- **What the reviewer reads grows in some lessons.** The card is about 0.7 KB longer. The name case
  opens Slide Philosophy's content boundaries, about 18 KB, in a lesson whose board names a real
  person, place, organisation or event (19 of 53 saved designs, the history, RE and geography
  lessons), when the older triggers had not sent it there; a made-up person in a beat opens the
  picture rules, about 15 KB (most maths lessons with a named child); a made-up case standing for a
  group opens Source and Scenario Integrity, about 6 KB. That is what "yes" to decision 7 costs, and
  he was not told it in those words.

## The merge with 7A, and every paragraph both releases touch

Trial merge (`rv_14`, `rv_15`, against 7A's commit on main, `59f85708`, read from the commit):

- **Merge cleanly:** `agents/design-reviewer.md`, `scripts/design-review-packet.py`,
  `scripts/tests/test_design_review_packet.py`, `assumed_knowledge_ledger_pins.json`,
  `worksheets_ledger_pins.json`.
- **Conflict, as expected:** `references/build-review-log.md` (both append an entry: keep 7A's,
  then this one); `quick_checks_ledger_pins.json`, `success_criteria_ledger_pins.json`,
  `teach_then_do_ledger_pins.json` (both moved the same section 3 pins: take 7A's side).
- **Then** number this entry's heading and run `rv_09_follow_at_merge.py`: it moves this release's
  sentences inside those pins and inside 7A's own SA-M08, rebuilds this topic's pins and mapping
  (which find 7A's words and map its seven rows of this list: H12, H14, J48, K02, S05, S25, T11),
  and records the rest-of-preferences and starters rows in their ledgers (both carry 7A's closing
  notes, so this could not be done on the branch). On the trial tree the whole Python suite then
  passes, 2,301 and 1 skipped, 7A's own pin test among them. The node suites were not run there (it
  has no `node_modules`; no engine changed); the lead runs every suite on the real merge. Earlier
  trials read 7A from the main checkout while 7A's own checks were writing undo attacks into it
  for a few seconds at a time, and two copied one mid-attack; `rv_14` now reads 7A from its
  commit only.

**Paragraphs and lines both releases touch:**

- `agents/design-reviewer.md`, section 3's check list (one paragraph, from "- the task requires the
  thinking named by the objective" to the test-question line): 7A rewrote its test-question line
  (RV-J48); this release rewrote the `unlocks` line (RV-J18) and the restating-Do repair (RV-J34).
  Different lines; git merges them.
- `agents/design-reviewer.md`, section 4: 7A's Apply label paragraph (RV-K02) sits one blank line
  above this release's K03 paragraph; this release also cut K09 from the check list below. Different
  paragraphs; git merges them.
- `agents/design-reviewer.md`, section 1's check list: 7A only (RV-H12, H14). No line of this
  release is there.
- `scripts/design-review-packet.py`, `PREFERENCE_REVIEW_ROUTES`: 7A's Apply trigger, this release's
  three other triggers; and 7A's Pride note in `ALWAYS_READ_REVIEW_SECTIONS`, which this release does
  not touch.
- `scripts/tests/test_design_review_packet.py`: 7A removes a fixture key, this release appends
  tests at the end.
- Pins on the section 3 list, moved by both: QC-C08, QC-E11, QC-P01, SC-Q01, TD-L07, TD-L09, and
  7A's SA-M08.
- Not touched here and still 7B's to meet: the User-fit paragraph (RV-C01 to C05, where 7B adds its
  four-pieces pointer; this release took C06's story out of it) and the launch line (RV-J36). 7B must
  read them on the tree this release leaves.

## The files touched

- **Plugin, changed:** `agents/design-reviewer.md`, `references/build-review-log.md`,
  `scripts/design-review-packet.py`, `scripts/tests/fixtures/design-reviewer-behaviour-cases.json`,
  `scripts/tests/test_design_review_packet.py`, `scripts/tests/test_reviewer_voice_authority.py`,
  `scripts/tests/test_a_maths_sheet_continues_the_lesson.py`, and the pin files
  `assumed_knowledge`, `quick_checks`, `success_criteria`, `teach_then_do`, `worksheets`
  (`scripts/tests/*_ledger_pins.json`).
- **Plugin, new:** `scripts/tests/design_reviewer_ledger_pins.json`,
  `scripts/tests/test_design_reviewer_ledger_is_kept.py`.
- **Plans, changed:** closing sections appended to the assumed-knowledge, quick-checks,
  success-criteria, teach-then-do, worksheets, teacher-voice and design-reviewer ledgers.
- **Plans, new:** `plans/2026-09-26-design-reviewer-mapping.md`, `plans/streamline-tools/rv-change/`,
  this report, `rv-before-summary.txt`, `rv-after-summary.txt` (and, ignored by git, the
  `rv-*.log` files, `rv-before-designs.json`, `rv-after-designs.json`, and the evidence in
  `scratch/rv/`: the cards and views before and after, the undo run, the replay and the trial
  merge).

## Anything he should know, in plain words

- **Untried on a real run.**
- **The reviewer now sends two kinds of fix back instead of making them.** A photograph of a
  number line and a Do that just says the Teach back each go back to the lesson designer with the
  fix spelled out. Everything one review sends back goes in one designer pass, and a run allows
  two. If a fault is still there after the second, the run's instructions say the lesson still
  arrives finished, with that fault at the top of his report, unfixed. No program checks the run
  followed that; the check is going to the playbook's run-faults release.
- **A Teach line that only says "look at the diagram" the reviewer rewrites itself,** as what
  children will notice ("Notice the enamel is the hardest layer."), as he answered.
- **The reviewer reads more in some lessons.** When a lesson's board names a real person, place,
  organisation or event, it now opens the rule about names arriving with their context: about 18 KB
  of reading on top of its 73 KB instructions. In the saved lessons that is 19 of 53, the history,
  RE and geography ones; a maths lesson with a made-up child no longer opens it.
- **A made-up child named in a beat still opens the picture rules,** about 15 KB (Amira in a maths
  question, say), because the reviewer checks that a made-up person has a face and a speech bubble.
- **"Judge the board first"** is in, in his words' sense: nothing counts as taught because the
  notes say it.
- **The child the reviewer imagines is the child in the class,** not a Year 4 age. That wording is
  the lead's reading of what he said about "nine-year-old", not his own words.
- **Nine old stories left the reviewer** and are kept word for word in the change log.
- **Found in passing, not changed:** the voice harness's sweep runner says the "wrong register"
  paragraph comes just before the sweep paragraph, but it sits in the opening section, 70 lines
  up (the voice release's); the reviewer's maths `Apply` check points at a preferences section the
  card never opens (settled item 8 put the exception in the line itself, which 7A carries); the
  compatibility route with no packet still says to "use the same conditional preference
  triggers", which only the card prints.
- **Not updated by me:** `plans/streamline-plan.md` (outside my files). Nothing committed.
