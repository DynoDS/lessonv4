# The worksheets release (4.2.290): first independent check

Checked on 25 September 2026 against the uncommitted working tree on `2db3ceba`
(4.2.289), including the builder's late edit to the brief-gap route (file time
08:13 local): my scratch copy was taken after it and matched the working tree
at the end of the run, and the rebuilt pins and mapping match the current ones. I did not write this release. Nothing in the repository was changed
except this file; all scratch work is in `plans/streamline-tools/scratch/wsrel1/`.

## What I did

- Read every changed line of the 42 changed plugin files word by word (old beside
  new), against the ledger's "Decisions taken", his 24 September answers, the
  evening "yes" on settled item 16, the change plan and the builder's report,
  and read the paragraph either side of each edit.
- Grepped the whole plugin (instructions, routes, contracts, repairs, templates,
  programs, evals) for each retired wording and for the concept behind it.
- Ran the preflight at 4.2.289 (a `git archive` copy) and now over all 61 saved
  `worksheet.json` outside scratch and the 56 in earlier checks' scratch folders,
  with `--adaptation` and `--photo-requirements` where the folder has them, a
  third run with `--picture-stage "PICTURE_STAGE: unavailable ..."`, and the
  books-or-sheet pass replayed from each engine's own `slips.js`. Ran both design
  validators over all 90 saved `lesson-design.json`. Built three saved sheets and
  three made-up books sheets into scratch with both engines.
- Wrote 13 targeted preflight cases for the new directed-sheet and picture-stage
  code (`scratch/wsrel1/scenarios.js`), and ran his own two returned trial sheets
  (`Choose a job.` and the Greater Depth judgement question) through both engines
  with a photo contract beside them.
- Rebuilt the pins with a copy of `build_ws_mapping.py` whose writes I redirected
  to scratch (read first, path printed before writing): the pin file and the
  mapping came out byte for byte the same as the repository's.
- Checked the 13 earlier-topic pin moves field by field against HEAD.
- Attacked the pins on a full scratch copy of the plugin (everything but
  `node_modules`, with the engine's libraries copied in and the `plans/` ledgers
  beside it). The untouched copy passed all 2,219 Python tests and 737 engine
  tests first. 70 attacks, each restored byte for byte afterwards; the copy
  was compared with the working tree at the end and is identical.
- Ran every suite from the plugin folder, and measured sizes with line endings
  normalised.

## Findings, most serious first

### 1. Decision 5 still cannot be followed for many Below and Greater Depth sheets: the preflight judges the note's words, not the problem, and tells the designer to ship the sheet

The worksheet designer's gate text now says (new):
«A sheet returned for a problem a child could not get past that is not a picture,
or over pictures the picture stage says will never arrive, stands, and goes back
to its owner.»

The preflight does not test whether the problem is a picture. It tests whether
the note contains a picture word:
`const PICTURE_CLAIM = /\b(?:photo\w*|pictures?|images?|approved request)\b/i;`
and a note with no ref that contains one is refused with
«CONTENT_GAP_UNFOUNDED: ... names no photo ref, so the claim cannot be checked
against the contract. Name the missing ref, or design the sheet.»

Primary sheets are full of picture-led questions, so a teaching gap is often
described with those words. Run on the new engine (`scen/02` to `scen/05`, `scen/13`):

| Note (Below sheet omitted) | 4.2.290 |
|---|---|
| `question 2 asks the child to choose a job without saying what a job means here` | stands (the only case the tests use) |
| `question 2 asks 'What is happening in the photograph?' and a Below child has nothing to act on` | refused |
| `the label-the-picture form the adaptation names has no helper that can carry it faithfully` (rule 11's own example, "a form ... no helper can carry faithfully") | refused |
| `the answer given for the image question is wrong` (rule 11's "a wrong answer") | refused |
| `question 3 on adaptation-photo-001 asks the child to name a part the adaptation never taught` | refused: "design the sheet to the promised filenames instead of omitting it" |
| `find a job on the photocopy of the timetable` (`photo\w*` matches "photocopy") | refused |

Each refusal tells the designer to design the sheet, which is exactly what
decision 5 ("should probably go back to be redesigned") says not to do. His own
two returned trial sheets do now stand (they happen to use no picture word), and
they were refused on 4.2.289, so the change is a real gain; but the line it
draws is the words of a note. The rounds' own lesson applies: "Match nothing by
free text when a field will do." The new tests (`directed-sheets.test.js`) only
ever use a teaching note with no picture word, so they cannot see this.

### 2. Under an unavailable picture stage, the designer's own return line is still refused

Step 1 (new) sends a picture that will never arrive to «the rule immediately
below, and name the affected refs in your completion report». That rule's return
line, unchanged, is (the file's own dash after `[sheet]` left out here)
«`WORKSHEET_CONTENT_GAP: [sheet] ... required visual [role] has no approved request; return to [lesson designer / adaptation designer]`».
It names no ref (the refs go in the completion report, not the note) and it
contains "approved request", which departure 2 made a picture word on purpose.
So with `--picture-stage "PICTURE_STAGE: unavailable ..."` a Below sheet
returned in exactly the form the designer is told to use is refused
(`scen/06`), and the refusal again says "Name the missing ref, or design the
sheet". Designing the sheet to filenames that will never be published is the
18 September failure this item was meant to close. The same note naming the
refs stands (`scen/07`), which is the only form the test uses.

The same line is refused with no stage at all when a required visual genuinely
has no request: there is no ref to name, so this documented route has never
passed for a Below or Greater Depth sheet; the release had the chance to fix it
and chose not to.

### 3. A dead adaptation picture after design still has no route that ends in a sheet, and he has not been told the cost

Settled item f, his words: re-point "at a published picture, never replace it
with a sentence", and the confirmed item adds "or a drawing the engine makes ...
if neither can carry it, it goes back to the lesson designer". The quick repair
(new): «Re-point that single reference at a picture this run has already
published. ... If no published picture can carry it, leave it unrepaired and say
it needs the lesson designer, naming any engine drawing that could carry it».
Old: «Re-author that single reference against what actually exists: a picture
this run has already published, a supported helper, or a task that carries its
own demand in words and the child's own drawing.»

Following the route onward:
- the playbook sends such a repair to «the content-gap picture wave» only when
  it returns a content gap «because the missing picture *was* the task's
  evidence» (unchanged); the repair file does not tell it to return
  `WORKSHEET_CONTENT_GAP`, only to "say it needs the lesson designer";
- the wave is «one focused Lesson Designer revision», and its brief says
  nothing about using the engine drawing the repair named;
- for a Below or Greater Depth picture (`adaptation-photo-###`) the playbook
  ledger already records that this revision cannot add one (PB-P10: "no rescue
  route");
- «One wave per run; a gap that survives it excludes as before», and «The sheets
  are one document, so one unreconciled reference loses all three and the answer
  key».

So one Below picture that terminalises with nothing published to swap in can
still cost the class every sheet and the key, the buzzer-circuit story in the
same entry. This may be no worse than 4.2.289 (the ledger's R26 row judged the
old helper and "in words" routes would likely fail the scope check anyway), but
the "drawing the engine makes" half of settled item f exists only at design time
under an unavailable stage. The log calls it «one step removed from his words»;
the honest consequence is "a lost pack in this case", and his standing rule is
that a last resort still leaves a finished piece.

### 4. The pointers the lesson designer reads drop the one-question case

Home (new, `preferences.md` › What the sheet is for): «The practice slide keeps
its own questions, and the sheet never carries them: in maths the sheet has
different numbers and contexts; in a lesson like PSHE that works towards one
question, the sheet can be that question, answered once, on the sheet, as the
proof.» The reviewer carries the case too.

The two places the lesson designer (who writes both surfaces) reads while
designing the sheet say the absolute:
- lesson designer › Worksheet (new): «That owner lets the sheet keep the slide
  task's representation, never its questions;» (old: «That owner permits a
  printed alternative using the same task;»)
- components › Generated worksheet (new): «A sheet in place of the slide
  practice may keep its representation, never its questions» (old: «A printed
  alternative may retain the same task»).

Both follow the plan's drafts, and both point at the home. But the rounds'
lesson is that a pointer is read first and keeps its exceptions; a PSHE designer
reading "never its questions" may refuse the very sheet his answer allowed.
Whether his PSHE case is an exception to "never" or a different question is a
reading he should settle; the pointers should then say it.

### 5. Decision 10's new sentence sits beside an example that permits a method reminder at the back

`preferences.md` › The printed page (new sentence): «A method's steps are not
printed as a list for the child to consult; a fill-in frame the child writes
into (`method-frame` in maths) is a question, and steps a task needs worked
through belong to their question.» Two sentences later, unchanged: «A reminder
of a method they have already used and a prompt to check their work pass that
test, because they improve or check an answer that already exists, and those are
what "after" was written for.» The worksheet designer's pointer keeps the same
permission («A reminder of a method they have already used, a prompt to check
their work: yes, ... so they come after»).

A "reminder of a method" is a thing a child consults. His answer was "no list of
the method's steps printed as a reference". Nothing now says whether a one-line
reminder still may print and a list may not. The engine only refuses three
lines or more, so a two-line steps reminder at the foot of a sheet passes every
check and can be read as licensed by the example. An example contradicting its
rule; one line from him settles it.

### 6. Rule 11 writes in two examples of a shipping doubt that the plan did not contain

New rule 11: «A page merely plainer than hoped, or a doubt the teacher should
know about (an upstream ambiguity, or a contradiction with the LO that a child
could still work through as printed), is a `notes` entry and the sheet ships».
The plan's draft stopped at «or a doubt the teacher should know about, is a
`notes` entry and the sheet ships». The bracket keeps the old rule's two
triggers (a "smaller choice" the report names). It means a sheet that
contradicts the objective prints with a note. That may be right, but it is a
classification his decision did not make, and the plan's own rule is "never
write in a permission or example the proposal did not contain; it goes to him".

### 7. His digit-box ruling wins only when the reason repeats the engine's words exactly

The prompt is quieted only when `recordingReason` contains each flagged phrase
verbatim (`reason.includes(flatLower(f.phrase))`), and the build still turns an
unanswered books sheet into "sheet". Built into scratch on 4.2.290:
- `Write the missing digit in the box: 4,_50 ...` with the reason
  `Books: one digit box is copied into a book in seconds.` prints as **sheet**
  (`RECORDING_CHANGED`), exactly as on 4.2.289;
- the same sheet with `Books: 'in the box' is one digit ...` stays **books**
  with slips.

A reason in his own words ("one digit box") loses; a reason that merely
contains the word (`no circle is needed in a book`) wins. The preflight only
warns, and the designer's gate asks only for `WORKSHEET_PREFLIGHT_OK`, so
nothing makes the designer answer the prompt. The log's «his digit-box ruling
wins over the engine's word list» is true only for a reason that quotes the
engine. Free-text matching again; a field on the sheet (for example the
questions the designer looked at) would not have this problem.

### 8. The Expected sheet: rule 11 says omit and return, the preflight refuses with fit advice, and the new picture note says "omit the sheet" for every level

Rule 11 (new) sends any sheet a child could not use back, Expected included,
and the new pending-picture note under an unavailable stage says «omit the sheet
and return WORKSHEET_CONTENT_GAP» without exception. For Expected the preflight
(unchanged) fails `EXPECTED_SHEET_MISSING` with «name a removal order in the
worksheet block's fitPriority, or reduce the amount, then rebuild this sheet»,
advice for a page that does not fit, not for `Choose a job.`; and the designer is
told «Do not report completion until it prints `WORKSHEET_PREFLIGHT_OK`». This
predates the release, but decision 5 now makes it the main route for his own
case on the class sheet. The failing exit is meant to route it back; the message
should say what to do for a content gap, and the designer should be told that a
returned Expected sheet ends without the OK line.

The same question for Below and Greater Depth: a returned sheet the run then
cannot redesign leaves those children with no sheet, recorded as «an unresolved
material gap remains a blocking fault in the final report» (playbook, unchanged).
Nothing says what finished piece is left as the last resort (the Expected sheet,
flagged, would be one). The report hands the routing to the playbook topic's
settled item k; the last-resort piece is not named anywhere, and his 24 September
rule was that a last resort still leaves one.

### 9. The log and report say things that are not quite true

- Log: «none is a books sheet carrying page-only words and none omits a directed
  sheet over a note». Two saved trial sheets omit directed sheets over notes
  (`output/trial-2026-09-05/evidence/wording-experiment/caseA2` and `caseC2`,
  his `Choose a job.` and Greater Depth cases). They show no change only because
  their folders hold no photo contract, so the new branch is never reached. With
  a contract beside them both now stand, and both were refused on 4.2.289: the
  best evidence the release works, and it is not mentioned.
- Log: «The generated references are the same size.» They are 55 bytes larger
  (report's own table: 83,177 to 83,232).
- Log: «The earlier topics' mapping builders were not edited, so rerunning one
  needs these moved rows named in it first.» Since 08:11 to 08:18 on 25 September
  every earlier builder is frozen and refuses to run without
  `--i-know-it-is-frozen` (`plans/streamline-plan.md`, "What the rounds have
  taught"). The line is out of date.
- Report: «The earlier topics' mapping builders ... are outside my files and were
  not edited» and «none omits a directed sheet with a note»: the same two points
  as above. (Its size table, as it stands now, matches my measurement: +642, the
  protocol +421.)
- `worksheet-helpers.md`: the `lesson` field «Names the lesson in the file; never
  printed.» It prints as the first line of the answer key (`${title} - Answer
  Key`). Not on the pupil page, which is what the line means; a word would fix it.

### 10. What the pins cannot hold (limits, not faults of this release alone)

- A retired wording brought back with a capital first letter passes: the
  barred phrase `keeping the same useful task, diagram, labels and response
  structure is legitimate` is matched case for case, and `Keeping the same useful
  task, ...` in the slide designer passed every test.
- A new paragraph saying the opposite, placed beside a pinned one outside a home
  (the lesson designer's Worksheet section: "the worksheet may simply reprint the
  Your Turn's own questions"), passes everything. Inside a home it is caught.
- The directed-sheet logic is held by the engine tests, not the pins: the pins
  hold its lines (`PICTURE_CLAIM`, `NEVER_ARRIVES`, the flag), so a condition
  changed inside an unpinned `if` is caught only by `directed-sheets.test.js`.
- `PROGRAMS` in `ledger_pin_checks.py` does not read `scripts/*.js` or any Python
  below `scripts/`; nothing there carries worksheet wording today.
- Moving the new brief-gap route below How to apply, so its own words «The
  principle above, and How to apply below» point the wrong way, passes: a pin
  names its section by heading. (Moving it to the very end of the file is
  caught, but only because the homes check then crashes looking for the
  section's end.)
- The compositions reference put back to its stale zone heights (the fault
  departure 3 found and fixed), keeping the corrected sentence, passes every
  test. Nothing checks that a generated reference is what its generator writes
  today; `w7b` proved it once.

## Checked and found sound

- Decision 2's home sentence, "in place of the slide practice", "with the sheet's
  own questions", "same performance" kept (and still tested), B02's "task's
  shape", A05, the reviewer's Q02: as he answered.
- Settled item 16 (his evening "yes"): the figure paragraph carries his example
  exactly (3,250 and 4,750; 6,250 and 8,500, no 67), and the lesson designer's
  "not a worksheet" became "so the lesson does not depend on the worksheet for it".
- Decision 5's text: rule 11, rule 1's two exceptions and boundary word for word,
  How you work, `shared.md` (E08, E09, P24), the catalogue line and its generator,
  and the new brief-gap route all say one thing.
- The engine's new acceptance: terminal receipts are read the way
  `working-wall-packet.py` reads them, only `unsatisfied` and `omitted` count (not
  `published`, not `picture_publish_failed`, not a missing receipt), every named
  ref must never arrive, an attempting or none-required stage refuses, and
  `unavailable` matches the playbook's real line (`PICTURE_STAGE: unavailable -
  [marker]`). A ref absent from the contract still stands as before. His two real
  returned sheets now stand.
- The pending-picture note under an unavailable stage: advisory only, exit code
  unchanged, the old wording kept for every other stage.
- Decision 9 (D09), decision 13 (O11), decision 10's engine sentence (neither
  barred success-criteria wording used; the criteria sentence untouched) and
  rule 13 and the final preflight line.
- Settled a (I01, I04 and its "never yours to drop" list and `notes` line, I05),
  b (A18, Q08; nothing in the maths file; validator untouched), d (P25, P26, P28;
  the four narrow exceptions untouched), e, g (all thirteen lines; `per-child` is
  what the validator requires), j, l, m, n (the maths file does say "Three to six
  ... often enough; it is not a cap"), o's text.
- Settled h folds: the reading-order pointer keeps every rule's both halves and
  O20's four extras; step 5 keeps the trigger, the year-group reason, "never a
  target" and `onSlip`, and everything it dropped is in `books-or-sheet.md`
  (the test, both reason examples, "go and look", the blank paragraph,
  `RECORDING_REASON_MISSING`, the paper reason); O24's two halves are in the same
  file (line 574 and step 4); O18's pointer keeps its limit; N03 gained O04's
  condition.
- Stories: every story in the plan's section 4 list is in the log before it left
  (E02's count and K02's date were already there, 4.2.162 and 4.2.218).
- His calibrating examples are untouched: the partitioning sheets, both column
  rulings with their dates, "Yes that looks incredible and premium.", the
  Classroom Secrets endings, the digit-box paragraph and ruling.
- Departures 1, 3, 4 and 5 are sound and explained (for 5, see finding 8 on the
  Expected sheet). The regenerated compositions
  reference changed only zone heights, each up by 1 to 6 mm and never a width
  (all 264 rows parsed); the engine's `headerMm` is 0, so the new heights are the
  true ones. Departure 2 (leaving out "visual") is right as far as it goes; see
  finding 1 for what the word list still catches.
- Nothing outside the plan moved in meaning. No added line anywhere in the plugin
  carries an em or en dash; the one rewritten paragraph that still has them is the
  brief-gap protocol's numbered item, whose dashes sit in the slide designer's
  bullets, as the report says.
- The 13 earlier-topic pin moves are honest: in each, the old words were at HEAD
  and are gone, the new words are present in the named section, no section,
  paragraph flag or barred phrase changed, no row was added or dropped
  (SC-DEC-08-ENGINE split one pinned line in two and added the second; SC-N14 is an
  outcome note only). Vocabulary's pins are untouched.
- The pins reproduce: `build_ws_mapping.py` run with its writes redirected to
  scratch gives the same pin file and mapping, byte for byte (595 pins, 67 changed
  rows). The 13 engine-only rows are real (R12 to R21, R28 to R30).
- Saved work: the 61 saved sheets and 56 scratch sheets give the same exit code,
  signals and books-or-sheet marks on 4.2.289 and now, and the unavailable-stage
  run changes none of them; the 90 saved designs give identical validator results
  (none passes either way; the validator is untouched).
- Builds into scratch: the three saved sheets build the same on both engines.
- Both `plugin.json` files say 4.2.290. Sizes (line endings normalised):
  instruction files +642 bytes, programs +7,876, generated references +55, log
  +14,815, tests and pins +704,603.

## The pins, attacked

Of 70 attacks, 60 were caught by the pins (most also by a test), 6 only by the engine tests (each a change to the logic of the preflight, the build or the books prompt, whose lines the pins hold but whose conditions they do not), and 4 by nothing (finding 10). Every retired wording brought back in lower case, in an instruction file or a program, was caught; every undone code file was caught. The attack list and harness are `scratch/wsrel1/attacks_list.py` and `attack.py`; the raw results are `attacks-results.jsonl`.

"Pins" means the ledger pin checks (this topic's or an earlier topic's); "decision tests" the ten tests in `test_worksheets_ledger_is_kept.py`; "engine tests" `node --test` in `worksheet-html`.

| # | Attack | Caught by |
|---|---|---|
| 1 | delete the home sentence: practice slide keeps its own questions, the sheet never carries them | pins, decision tests |
| 2 | soften 'the sheet never carries them' to 'should avoid them' | pins, decision tests |
| 3 | widen the one-question case from 'a lesson like PSHE' to any lesson | pins, decision tests |
| 4 | lesson designer pointer: keep the representation AND its questions | pins, decision tests |
| 5 | a new paragraph beside the pinned one in the lesson designer's Worksheet section that says the opposite | **nothing** |
| 6 | a new paragraph in the components file's Generated worksheet (a home) saying the sheet may reuse the practice questions | pins |
| 7 | reviewer: drop the maths and one-question cases | pins |
| 8 | bring back 'Keeping the same useful task, diagram, labels and response structure is legitimate' (capitalised) at the end of a pinned worksheet designer paragraph | pins, but only because that paragraph is pinned whole (see 10) |
| 9 | bring back the retired sentence, lower case, in the slide designer (an unpinned place) | pins |
| 10 | the same retired sentence, starting with a capital, in the slide designer | **nothing** |
| 11 | bring back 'a printed alternative may preserve the same slide task' as a message in the preflight | pins |
| 12 | the figure example's sheet line asks for the practice's own numbers | pins, decision tests |
| 13 | 'same performance' becomes 'same questions' | pins, decision tests, other Python tests |
| 14 | rule 11: 'stops that sheet' becomes 'may stop that sheet' | pins |
| 15 | rule 11: drop 'make the other sheets as normal' | pins, decision tests |
| 16 | rule 11 back to 'Flag, do not fix ... add a notes entry and carry on' | pins, decision tests |
| 17 | How you work: drop 'A sheet a child could not use is not a note' | pins |
| 18 | brief-gap protocol: delete the Worksheet Designer route | pins, decision tests |
| 19 | brief-gap protocol: move the Worksheet Designer route to the end of the file (its 'above' and 'below' then point the wrong way) | pins, but only by accident: the moved section became the last in the file and the homes check crashes looking for its end |
| 20 | shared.md: a form you believe is wrong 'is a notes entry' (a variant wording, not the retired phrase) | pins |
| 21 | bring back 'Flag it in `notes` instead' in a review-packet program | pins |
| 22 | preflight: refuse a teaching gap again (branch disabled, pinned lines kept) | engine tests |
| 23 | preflight: one never-arriving receipt lets the gap stand (.some for .every) | engine tests |
| 24 | preflight: an attempting picture stage lets a picture gap stand | engine tests |
| 25 | preflight: add 'visual' to the picture words | pins, engine tests |
| 26 | worksheet designer's gate command loses --picture-stage | pins |
| 27 | the whole preflight back to 4.2.289 | pins, decision tests, engine tests |
| 28 | producing becomes the default again (new words) | pins, decision tests |
| 29 | delete decision 10's sentence from the printed page | pins, decision tests |
| 30 | decision 10's sentence gains a claim the decision did not make: the steps stay on the board | pins |
| 31 | rule 13 loses the method's steps sentence | pins |
| 32 | the engine message uses the success-criteria topic's barred wording | pins, other Python tests, engine tests |
| 33 | the list refusal back to 4.2.289 | pins, decision tests, other Python tests, engine tests |
| 34 | the look rule asks for varied response types again (new words) | pins, decision tests |
| 35 | settled a: I01 back to 'a resource intended for use on its own cannot assume an unseen board' | pins, decision tests |
| 36 | settled a: rung 3 back to 'meets it elsewhere in this lesson' (variant) | pins |
| 37 | settled b: 'never set for another time and never added on top' softened | pins, decision tests |
| 38 | settled b: the reviewer's line loses 'never set for another time or added on top' | pins |
| 39 | settled e: the kit line says the main task does not automatically get a worksheet | pins |
| 40 | settled f: step 1 loses 'never at words' | pins |
| 41 | settled f: the quick repair may re-point at a supported helper again | pins, other Python tests |
| 42 | settled f: the retired 'in words' route written into the worksheet designer | pins |
| 43 | settled f: the builder row back to 're-authors that one reference instead' | pins, other Python tests |
| 44 | settled f: the pending-picture note under an unavailable stage says the build waits again | engine tests |
| 45 | settled h: the pointer loses 'a lettered set is one block' | pins |
| 46 | settled h: the pointer loses the ping-pong limit | pins |
| 47 | settled h: 'share a column' softened to 'usually share a column' | pins |
| 48 | settled h: step 5 loses 'never a target' | pins |
| 49 | settled h: the components file's pointer loses 'A second page is never for overflow' | pins, other Python tests |
| 50 | settled j: the worksheet designer may add or remove support on its own judgement again | pins |
| 51 | settled j: rule 10 ignores the adaptation | pins |
| 52 | settled j: a retired support bullet written into shared.md, which the worksheet designer reads | pins |
| 53 | settled n: 'commonly has up to six standalone questions' written into shared.md | pins |
| 54 | settled o: the books wording back to a verdict (new words) | pins, decision tests |
| 55 | settled o: his digit-box ruling reworded | pins, decision tests |
| 56 | settled o: the preflight refuses the books prompt (pinned lines kept) | engine tests |
| 57 | settled o: a naming reason no longer quiets the prompt | engine tests |
| 58 | slips.js back to 4.2.289 | pins, decision tests, engine tests |
| 59 | build-worksheet.js back to 4.2.289 | pins, engine tests |
| 60 | build-layouts-doc.js back to 4.2.289 (not regenerated) | pins |
| 61 | build-catalogue.js back to 4.2.289 (not regenerated) | pins |
| 62 | worksheet-compositions.md back to 4.2.289 (the stale heights) | pins |
| 63 | the 31 August paragraph back in the worksheet designer | pins |
| 64 | 'seven published worksheets' back in shared.md | pins |
| 65 | the approved partitioning sheets lose 'whole-part models with the parts left empty' | pins |
| 66 | his 'Yes that looks incredible and premium.' altered | pins, decision tests |
| 67 | a Classroom Secrets ending altered | pins, decision tests |
| 68 | his 29 August column ruling loses its date | pins, decision tests |
| 69 | brief-gap protocol: move the Worksheet Designer route below How to apply (its 'How to apply below' then points the wrong way) | **nothing** |
| 70 | the compositions reference back to its stale (short) zone heights, keeping the new sentence | **nothing** |

## The suites

From `plugins/lesson-v4`, on the working tree:

| Suite | Result |
|---|---|
| `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider` | 2,219 passed, 1 skipped (168 s) |
| `node --test "test/*.test.js"` in `builder` | 742 pass, 0 fail |
| `node --test` in `worksheet-html` | 737 pass, 0 fail |
| `node --test` in `working-wall-html` | 142 pass, 0 fail |
| `node --test` in `stick-in-sheets-html` | 70 pass, 0 fail |

The repository's `git status` was the same before and after every run.

## What I would fix before release

Code and routes (these change what happens in a run):

1. Let a Below or Greater Depth sheet go back for its teaching without the note's
   wording deciding it (finding 1). Either the note says which kind of gap it is
   (a word or field the designer writes, such as a "not about a picture" marker
   the gate reads), or the preflight refuses only the one shape it was built for
   (a picture excuse over refs that are still coming). Whichever, the refusal
   must stop telling the designer to "design the sheet" when the gap is about the
   child, and a test must use a teaching note that mentions a photograph, a wrong
   answer on an image question, and a named ref.
2. Make the unavailable stage work with the designer's own words (finding 2):
   either step 1 and the return line put the affected refs in the note, or the
   preflight lets any picture gap stand under an unavailable stage (nothing is
   coming, so "has no approved request" or "has not arrived" is then simply
   true). Test it with the return line exactly as the designer file prints it.
3. Tell him plainly, before release, that a dead Below or Greater Depth picture
   with no published picture to swap in can still cost the whole worksheet pack
   and its key after design (finding 3), and ask whether that is acceptable until
   the playbook and topic 9 releases give it a rescue route; and have the quick
   repair return `WORKSHEET_CONTENT_GAP` so the playbook's route recognises it.
4. Give the Expected sheet's return a message that fits a content gap, and tell
   the designer a returned Expected sheet ends without the OK line (finding 8);
   at least, make the unavailable-stage picture note not say "omit the sheet" for
   Expected.

Questions for him (one line each, his words decide):

5. The one-question PSHE case: should the lesson designer's and the components
   file's "never its questions" carry it (finding 4)?
6. A reminder of a method at the back of a sheet: still allowed as one line, or
   gone with decision 10 (finding 5)?
7. A sheet that contradicts the objective: note and ship, or back to be
   redesigned (finding 6)?
8. His digit-box ruling: is a reason that must repeat the engine's own words
   what he wants, or should the designer's look be recorded another way
   (finding 7)?
9. A returned Below or Greater Depth sheet the run cannot redesign: what finished
   piece is left for those children, for example the Expected sheet, flagged
   (finding 8)?

Text and honesty (small):

10. Correct the log's "none omits a directed sheet over a note" (and say his two
    trial sheets now stand where 4.2.289 refused them), "the same size" for the
    generated references, and the line about the earlier builders now being
    frozen (in the log and the report); and make the `lesson` field line say
    "never printed on a pupil page" (finding 9).
11. Consider a test that each generated reference matches its generator, so the
    stale heights cannot come back unseen (finding 10).
