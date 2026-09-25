# The worksheets release (4.2.290): second independent check

Checked on 25 September 2026 against the uncommitted working tree on `2db3ceba`
(4.2.289), after the repair round that followed the first check
(`ws-release-check.md`) and his answer recorded under "Asked from the release's
first check" in the worksheets ledger. I did not write any of it. Nothing in the
repository was changed except this file; all scratch work is in
`plans/streamline-tools/scratch/wsrel2/`. Three files outside scratch changed while
I worked, none of them by me: `plans/streamline-tools/ledger_mapping.py` and
`run-all-suites.sh` (12:11) and `side-branch-brief.md` (12:19). The plugin, the pin
file and the mapping were the same at the end as at the start.

## What I did

- Read every changed line of the repair round against the first check's findings,
  his words in the ledger and the builder's report, with the paragraph either side;
  followed each new mechanism into every file that writes, reads or routes it (the
  preflight, the build, the answer key, the run script, the scope check, the
  worksheet designer, its focused repair, the builder, the contract, the playbook).
- Ran the preflight (it writes nothing) over all 137 saved `worksheet.json` in the
  repository outside `node_modules` (61 outside scratch, 76 in earlier checks'
  scratch folders) on a `git archive` copy of HEAD and on the working tree, with
  `--adaptation` and `--photo-requirements` where the folder has them, and a third
  time on the working tree with `--picture-stage "PICTURE_STAGE: unavailable - ..."`.
- Ran the design validator over all 263 saved `lesson-design.json` (90 outside
  scratch) at HEAD and now.
- Wrote 15 preflight and build cases for the return record and the stand-in
  (`scen/`) and 10 build cases for the last resort and the books prompt (`bld/`),
  built them into scratch, rendered the PDF pages and read the answer keys.
- Rebuilt the pins with copies of `build_ws_mapping.py` and `ledger_mapping.py`
  whose every write I redirected into scratch (each path printed and asserted
  before writing; the repository's pin file and mapping hashed before and after).
- Attacked the pins and tests on a full scratch copy of the plugin (everything but
  `node_modules`, the engines' libraries copied in, the `plans/` ledgers beside it):
  70 attacks, each restored byte for byte. The untouched copy passed every Python
  and engine test first, and matched the working tree at the end.
- Ran every suite from the plugin folder, and measured sizes with line endings
  normalised.

One thing about the machine: from about 12:45 today, starting `python3` (the
Windows alias) hangs, and some Python tests start `python3`. My suite run on the real
plugin finished before that. For the last attack runs I put a `python3.exe` from a
venv inside my scratch folder first on PATH (the lead's workaround too); I reran
every attack whose result could have been touched by the hang, and the table below
uses only those reruns for them. The hang is the machine's, not the release's: every
test run that finished, before or after it, passed on the untouched copy, and no
fault in this report comes from it.

## Findings, most serious first

### 1. A `returned` entry left in the spec hides the sheet it names, and nothing tells anyone to take it away

The stand-in is keyed on the record alone. The report: «A redesigned sheet replaces
the stand-in by taking the record away.» and, in its list for the playbook, «when
the redesign comes back, have the worksheet designer realise it (which takes the
record away)». Nothing takes it away. The worksheet designer's only line about a
rebuild is unchanged: «The orchestrator returns an Expected gap to the lesson
designer and a Below or Greater Depth gap to the adaptation designer. Rebuild only
the affected sheet after the source is repaired.» Neither its file, the contract nor
the focused repair says to remove the entry and its note when the redesigned sheet
goes in.

- `scen/11`: the redesigned Below sheet back in the spec (its source headed
  `REDESIGNED BELOW NOTEBOOK`), its entry and note left in place. The preflight says
  `WORKSHEET_PREFLIGHT_OK` and «[returned] Below sheet returned (...): not measured
  here», so the redesigned sheet is never measured; the build prints the Expected
  sheet in the Below slot with `SHEET_STANDS_IN: ... no redesigned sheet has replaced
  it`, which is now untrue, and the redesigned sheet is nowhere in the PDF.
- `scen/10`: an entry for a Below sheet the adaptation never directed ("Below uses
  the Expected sheet unchanged") passes the preflight without a word, and the build
  adds a `B` pile of the Expected sheet, flagged as sent back to the adaptation
  designer.

So a sheet can be returned by accident, and a redesign can be lost after the whole
loop has been run for it.

### 2. A "teaching" return always stands, so the loss the gate was built for passes again under that word; and the worksheet designer is told the Expected sheet will stand in

The directed-sheet gate exists for the 30 August loss (`directed-sheets.test.js`,
its opening lines): «the designer omitted it because its three adaptation
photographs "had not arrived"». The gate now trusts the kind the designer writes.
`scen/02`: the Below sheet omitted with the note «adaptation-photo-002 has not
arrived yet, so the Below sheet cannot be designed» and `{ "sheet": "below",
"problem": "teaching" }`, the contract approving that picture, no receipt. 4.2.290:
`WORKSHEET_PREFLIGHT_OK`, and the build gives the Below children the Expected sheet,
flagged as «a problem a child could not get past as printed». HEAD refused the same
folder (`CONTENT_GAP_UNFOUNDED`). The picture refusal points the way round: «If what
stops a child is something else, return it as "problem": "teaching".»

The cost is smaller than on 30 August (the Below children get the Expected sheet,
flagged, not nothing), but promotion then sources none of that sheet's pictures, so
a redesign that wants them starts without them. The log's «The one shape still
refused is the one the gate was built for» holds only for a return labelled
`picture`.

The report also says: «The worksheet designer and the adaptation designer are not
told, so the stand-in cannot become an easy way out of a redesign.» The worksheet
designer is told. Its "Before you start" list sends it to `worksheet-helpers.md`
(«the shape of `worksheet.json` and what the builder reports back»), whose new
`returned` row says «until a redesigned sheet replaces it the build prints the
Expected sheet in its place, with the Expected answers as its key section», and
whose new `SHEET_STANDS_IN` row says the same. With a kind nothing checks, that is
the easy way out the report says does not exist.

### 3. "Nothing is ever left with no sheet" is not true, and he has not been told where it fails

The report records the lead's instruction as «nothing is ever left with no sheet»,
and the files claim it: the report («nothing is ever left with no sheet»; «No build
leaves a tier with nothing any more: `SHEET_RETURNED` is gone.»), the log («**No tier
is ever left with no sheet: the Expected sheet stands in**»; «so no child is left
without a sheet»), `returned.js` («no tier is ever left with no sheet») and
`stand-in.test.js` («Nothing is ever left with no sheet»). Where it is false:

- their own case: an Expected sheet the page cannot hold is omitted, and then a Below
  or Greater Depth sheet the page cannot hold is omitted too (the log's paragraph
  says so under a heading that says the opposite);
- a Below or Greater Depth sheet whose fault after its repair round is anything but a
  page too small. `bld/04`: a Below sheet printing `Word bank: less, more. ...` under
  `--omit-unfittable` refuses the whole pack (exit 1, no PDF, no key) for all three
  tiers, although the Expected sheet fits and could stand in. The lead read "the
  sheet cannot be made" to cover a page too small; a sheet that cannot be made for
  another reason still costs everything;
- an Expected sheet whose picture never arrives after design (finding 4).

Each was true on 4.2.289 too, so nothing got worse; but his standing rule is that a
last resort still leaves a finished piece, the rounds' rule is that every "never" in
a log gets a test or is softened, and he should be told each case before release.

### 4. An Expected picture that never arrives after design: the first check's finding 3 is half done

The first check asked to «have the quick repair return `WORKSHEET_CONTENT_GAP` so the
playbook's route recognises it». For Below and Greater Depth the repair now writes
the entry and a `WORKSHEET_CONTENT_GAP` note. For the Expected sheet it says only:
«On the Expected sheet, leave it unrepaired and say it needs the lesson designer,
naming any engine drawing that could carry it.» The playbook sends a repair to the
content-gap picture wave only when it is «A repair returning `SLIDE_CONTENT_GAP` or
`WORKSHEET_CONTENT_GAP` because the missing picture *was* the task's evidence». Left
unrepaired, the Expected sheet still names the dead picture, the build refuses
`IMAGE_MISSING`, and «The sheets are one document, so one unreconciled reference
loses all three and the answer key»; even the wave is «One wave per run; a gap that
survives it excludes as before». Neither the report nor the log tells him that one
dead picture on the class's own sheet can still cost the whole pack.

### 5. At the last resort the build announces a stand-in and then takes it away

`bld/03`: the Expected sheet in a named layout the page cannot hold, the Greater Depth
sheet left to the engine and too tall. The first pass asks only whether the Expected
sheet "gets a shape from the library" (`expectedFits`), which a named layout always
does, so it prints `SHEET_STANDS_IN: Greater Depth - the Expected sheet stands in
...`; the second pass then finds the Expected sheet too tight and omits both
(`SHEET_OMITTED: Expected ...`, `SHEET_OMITTED: Greater Depth ...`). The run script's
summary lists Greater Depth in both `standInSheets` and `omittedSheets` and prints
`FIXED_RESOURCE_FLAGGED worksheets: Expected, Greater Depth, Greater Depth`. The
pack is right (Below only, the key covers Below); the flags contradict each other.
The tests cover each shape alone and both sheets in the same shape, not this mix.

### 6. The lead's wording is quoted as his in the log, the pins, the mapping, a test and the report

The lead has now recorded the four items the repair round settled, in the ledger
under "Settled by the lead from his earlier answers (25 September), not asked
again", each named as the lead's reading, with his reply to all four: "those are
fine". The ledger is plain that «"Never a list of steps printed just as a reminder"
is the lead's wording of the suggestion he answered "yes" to, not his own words.»
Every file below still presents it as his:

- the log, the 4.2.290 entry's decisions bullet, which opens «(his words are in the
  ledger)»: «A list of a method's steps is never printed just as a reminder (his
  "never a list of steps printed just as a reminder")»;
- `worksheets_ledger_pins.json`, the outcomes of WS-J03, WS-J05 and WS-O09: «his
  words \"never a list of steps printed just as a reminder\"»;
- `success_criteria_ledger_pins.json`, five outcomes moved by `w9` (lines 6703,
  6798, 6833, 6885, 9128): «his \"yes\" and his words \"never a list of steps printed
  just as a reminder\"»; an earlier topic's pin file now carries the misquote too;
- `test_worksheets_ledger_is_kept.py`, line 90: «# His words: "never a list of steps
  printed just as a reminder"»;
- the mapping (`2026-09-24-worksheets-mapping.md`, WS-J03, J05, O09);
- the report: «(his words, passed on in the repair round: "never a list of steps
  printed just as a reminder"; the check's finding 5)»;
- their sources in `ws-change/`: `build_ws_mapping.py` lines 110, 111, 121,
  `w9_repin_other_topics.py` (`DECISION_10`), `w10_log_entry.py`,
  `new/test_worksheets_ledger_is_kept.py`, and `w2_preferences.py`'s comment («His
  answer on decision 10, as the first check's repair round passed it on»).

The log also puts the objective case inside his quoted words: «A sheet a child could
not use as printed, or one that contradicts the objective, goes back to its author to
be redesigned ... ("agree, should probably go back to be redesigned")». His words
were said of a sheet a child could not use; the objective case is the lead's reading,
which he has now confirmed. The log should say so, as the ledger does. Correcting the
pins means correcting `build_ws_mapping.py` and `w9` and rerunning them (the earlier
builders stay frozen), so the files and their record builders agree.

### 7. The four items the lead settled, against his words

Each checked against the words the ledger now cites; with his "those are fine" all
four stand, and only the wording faults above and finding 6b below remain.

- **The PSHE case in the two pointers**, from his decision 2 answer («Other lessons
  like PSHE etc might be different, it might be working towards a particular one
  question answered, the sheet is the proof of that»). The pointers («never its
  questions (in a lesson like PSHE that works towards one question, the sheet can be
  that question, answered as the proof)») say what he said, closer to his words than
  the home's «answered once, on the sheet». Sound.
- **A one-line method reminder allowed, a list of steps as a reminder not**, from the
  decision 10 suggestion he answered "yes" («no list of the method's steps printed as
  a reference»). "Just as a reminder for the child to consult" keeps "as a reference";
  "one-line" is a new limit that removes the first check's contradiction between the
  rule and its example. Sound as a reading he has confirmed. The engine refuses only
  three lines or more, so a two-line list reaches the page unrefused; the words,
  not a check, hold it.
- **A sheet that contradicts the objective goes back**, the lead's reading of decision
  5. Confirmed. What remains is finding 6b.
- **Books or sheet by what the sheet holds**, the mechanism for settled item 20
  («becomes a prompt to look again rather than a verdict, so your ruling wins»). His
  own sheet's box (`2,_80`, in the question's words) is never flagged, so his ruling
  wins. Sound; finding 8 is about what the words claim beyond that.

### 6b. Rule 11's objective case is not in the two pointers to it

New rule 11: «..., or a sheet that contradicts the objective, stops that sheet». The
two places that point at rule 11 still draw the old line. The brief-gap protocol's
new route: «A doubt that leaves the sheet usable is still a `notes` entry, as
below.» `shared.md`: «Something a child could not act on goes back through
`WORKSHEET_CONTENT_GAP`, and a doubt the teacher should hear goes in `notes` (the
worksheet designer's rule 11).» A sheet teaching against its own objective that a
child can still work through is a note by both pointers and a return by the rule
they point at, and the rounds found pointers are read first. The lead's reading
calls it «a teaching problem, not a plain page», so `"problem": "teaching"` fits, but
the kind is defined everywhere only as «a problem a child could not get past as
printed»; one clause in that definition and in the two pointers would close it.

### 8. Books or sheet: the words say "only boxes", the engine tests "only sentence helpers"

`books-or-sheet.md`, the contract and the log («or on a sheet whose only boxes are
those of sentences and number sentences, are never flagged, whatever the reason
says») describe a test the engine does not run. It exempts a sheet only when every
helper on it is `questions`, `written-answers`, `instruction`, `number-sentence` or
`section-label`. `bld/07`: a books sheet whose only box is a number sentence's
(`Write the missing digit in the box.`), with a plain number line captioned `Use the
number line to help you.` beside it. The line has no box; the sheet is flagged, and
the build prints it as "sheet" (`RECORDING_CHANGED`) because nothing answered the
prompt. Nothing makes the designer answer (the preflight exits OK), as the first
check noted; that is a fair safety default, but it means the word list is still a
verdict at the build whenever the designer does not look.

### 9. The stand-in's diagnostic, and what reaches his report before the playbook release

Each stand-in prints `SHEET_STANDS_IN:` and `BUILD_DIAGNOSTIC:
{"signal":"SHEET_STANDS_IN",...,"faultClass":"content",...}` on a build that
succeeded. The playbook today sends «a semantic build diagnostic» into the focused
repair round, and the scope check now lets a repair take the `returned` entry away (a
presentation key). A repair that clears the diagnostic by deleting the entry prints
the returned sheet: a dead picture then refuses the pack, and a teaching return
prints the sheet a child could not use. The report's list for the playbook does not
name this. Nor does the stand-in reach his report yet: the report says «flagged in
the run's summary», but that is a JSON file, and the playbook carries only
`SHEET_OMITTED:` lines into his report. Until the playbook release he sees the
answer key's line («The Expected sheet stands in here for the Below sheet, which went
back to be redesigned. These are the Expected answers.») and a pile marked `B`.

### 10. What the pins and tests cannot hold

Of 70 attacks, 44 were caught by the pins or the decision tests (42 by the pin
checks themselves, 2 by the route-order test alone), 25 only by other tests (23 by
the engine tests, 2 by the run-script test), and 1 by nothing: the build no longer
checking the `returned` record (C19). The preflight still refuses a malformed record, but a hand build or a spec
edited after the gate then builds as if the entry were absent. The first check's four
gaps are closed (L01 to L04), and the route moved to the end of the file no longer
crashes the homes check (L08). As the report says, the conditions inside the
preflight and the build are held by the engine tests, not the pins; every such attack
I made was caught by one.

## The first check's findings, one by one

| # | First check | Now | Verdict |
|---|---|---|---|
| 1 | the gate judged the note's words (`PICTURE_CLAIM`) | the `returned` field, read by `checkDirectedSheets`; `PICTURE_CLAIM` gone | done differently; sound except this check's finding 2 |
| 2 | the designer's own return line refused under `unavailable` | «any picture problem under a picture stage that was `unavailable`» stands; tested with the designer's line and its dash | done (`scen/07`) |
| 3 | a dead Below picture after design could lose the pack; tell him; have the repair return `WORKSHEET_CONTENT_GAP` | Below and Greater Depth: the entry, the note, the stand-in (old: «Re-author that single reference against what actually exists»; new: «change nothing on the sheet: add its `returned` entry ... until a redesigned sheet replaces it, the build prints the Expected sheet in its place»); Expected: «leave it unrepaired», cost not told | half done (finding 4) |
| 4 | the pointers dropped the PSHE case (old: «never its questions;») | «never its questions (in a lesson like PSHE that works towards one question, the sheet can be that question, answered as the proof)» in both | done |
| 5 | a reminder of a method printed at the back (old: «A reminder of a method they have already used») | «A one-line reminder of a method»; «A list of a method's steps is never printed just as a reminder for the child to consult» | done, the lead's reading he confirmed; quoted as his words, finding 6 |
| 6 | rule 11's bracket of shipping doubts | bracket gone; «or a sheet that contradicts the objective, stops that sheet» | done differently, the lead's reading he confirmed; the pointers, finding 6b |
| 7 | the digit box won only by repeating the engine's words (`reason.includes(...)`) | by what the sheet holds, and `"recordingLookedAgain": true` | done differently; sound for his sheet; finding 8 |
| 8 | the Expected sheet's return got fit advice; no last piece for Below or Greater Depth | «the Expected sheet is returned to the lesson designer ... Report the return and stop»; the designer told «returning it ends your run without `WORKSHEET_PREFLIGHT_OK`»; the stand-in | done |
| 9 | the log and report | the two trial sheets, «The generated references are 55 bytes larger», the frozen builders, the `lesson` field («never printed on a pupil page») | done |
| 10 | four attacks got through | all four caught now | done |

## Checked and found sound

- A malformed record, a record naming a present Expected sheet, and a record with no note are refused with messages that say what to do (`scen/13`, `09`, `12`).
- A teaching return stands whatever its note mentions (`scen/01`).
- A picture return stands for an `unsatisfied` or `omitted` receipt and is refused for a `published` or missing one, and when one of two refs is still coming (`scen/03` to `06`, `14`).
- Under `unavailable` any picture return stands; under `attempting` one naming no ref is refused (`scen/07`, `07b`).
- A returned Expected sheet fails the preflight with the new message, and the designer is told to stop (`scen/08`).
- The stand-in prints in the right slot with the right tier letter: the Below page carries `B` over the Expected sheet's questions (`scen/14`), the Greater Depth page `GD` (`bld/01`, `02`); the returned sheet's dead picture is never read.
- The answer key's stood-in section is exactly the Expected answers under its line, «which went back to be redesigned» or «which the page could not hold».
- The run script lists each tier stood in for with its reason and flags the pack (`bld/01`).
- A return with no Expected sheet to print is refused (`RETURNED_INVALID`).
- An Expected sheet the page cannot hold is stated truly as still omitted in the log, report, builder table, contract and run-script help.
- `"recordingLookedAgain": true` keeps books and its slips (`bld/08`); a non-boolean is refused at the preflight (`bld/10`); a box in the question's own words, or on a sheet of sentences alone, is never flagged (`bld/09`, `06`).
- The scope check lets a repair add the entry and still catches the sheet taken out.
- The PSHE pointers, the one-line reminder in all four places, rule 11 without its bracket, the Expected message, the `lesson` field line: as the report says.
- The 61 saved sheets outside scratch give the same exit codes at HEAD and now; his `caseA2` and `caseC2` move from an unchecked pass to `SHEET_DIRECTED_MISSING`, and `childrens-lives-continuity-and-change` keeps the same refusal in new words, exactly as the log and report say.
- The 76 sheets in earlier scratch folders change only where they were written for the old note-reading gate or the old books refusal; the unavailable stage changes no saved sheet.
- The 263 saved designs give identical validator output at HEAD and now (none of the 90 outside scratch passes either way; the validator is untouched).
- The pins reproduce byte for byte: 614 pins, 67 changed rows, 87 retired phrases barred in any case.
- Sizes with line endings normalised match the report and log exactly: instruction files +5,549 bytes (841,718 to 847,267), generated references +55, programs +27,907 (each file's share in the log is right), the log +19,968, tests and pins +782,083 (the new pin file 727,816).
- Both `plugin.json` files say 4.2.290.
- No em or en dash in any added plugin line except the one test quoting the designer's return line, as the report says; the pin file's 45 dashes quote existing text.
- The playbook is 78,776 bytes against its cap of 78,848 (77 KiB, measured without carriage returns by `test_make_lesson_runtime.py`); the focused repair 7,784 of 8,000.
- The earlier topics' record builders all refuse to run without `--i-know-it-is-frozen`, as the corrected log says.
- The playbook words the report says are still needed (send a returned sheet to the adaptation designer and route a Below or Greater Depth picture gap there; rebuild with the redesign; carry `SHEET_STANDS_IN` into the report; rewrite «A pack the round did not clear still ships too») are real and named truly; findings 1, 4 and 9 add three more.

## The pins and tests, attacked

"Pins" means the ledger pin checks (this topic's or an earlier topic's); "decision
tests" the tests in `test_worksheets_ledger_is_kept.py`; "engine tests" `node --test`
in `worksheet-html`; "other python tests" the rest of `scripts/tests`. Each attack
ran the whole Python suite and the engine suite. The attack list and harness are
`scratch/wsrel2/attacks_list.py` and `attack.py`; the results are in
`attacks-results*.jsonl` (the file ending `-void` is a run whose Python half never
started and is not used).

| # | Attack | Caught by |
|---|---|---|
| C01 | preflight: a teaching return stands only when its note has no picture word | engine tests |
| C02 | preflight: the unavailable stage no longer lets a picture return stand | engine tests |
| C03 | preflight: terminal receipts not read | engine tests |
| C04 | preflight: a published receipt counts as never arriving | pins, engine tests |
| C05 | preflight: one never-arriving ref lets a return over two refs stand | engine tests |
| C06 | preflight: a returned sheet needs no note | engine tests |
| C07 | preflight: a directed sheet missing with no entry passes | engine tests |
| C08 | preflight: a returned Expected sheet gets the old fit advice | engine tests |
| C09 | preflight: a returned sheet still in the spec is measured | engine tests |
| C10 | preflight: a malformed record is not refused | engine tests |
| C11 | a record naming a present Expected sheet is allowed | engine tests |
| C12 | the books prompt becomes a refusal again | pins, engine tests |
| C13 | the pending-picture note under `unavailable` says the build waits again | engine tests |
| C14 | build: the returned sheet is printed, no stand-in | pins, engine tests |
| C15 | build: no `SHEET_STANDS_IN` line (diagnostic kept) | engine tests |
| C16 | key: the stood-in section loses its line | engine tests |
| C17 | key: the stood-in tier keeps its own answers | engine tests |
| C18 | build: a return with no Expected sheet builds the rest | engine tests |
| C19 | build: a malformed record is not refused | **nothing** |
| C20 | build: a sheet left to the engine that the page cannot hold is omitted again | pins, engine tests |
| C21 | build: a named-layout sheet the page cannot hold is omitted again | engine tests |
| C22 | build: stands in even when the Expected sheet cannot fit | engine tests |
| C23 | build: the page-fit key line says "went back to be redesigned" | pins, engine tests |
| C24 | run script: a stood-in tier is not flagged | other python tests |
| C25 | run script: the stood-in reason dropped | other python tests |
| C26 | scope check: the record counts as child content | pins, other python tests |
| C27 | slips: the looked-again field no longer quiets the prompt (pinned line kept) | engine tests |
| C28 | slips: a box in a named figure exempt like a sentence blank | engine tests |
| C29 | slips: a sheet of only sentences flagged again | engine tests |
| C30 | slips: a box in the question's own sentence flagged again | engine tests |
| C31 | build: an unanswered flagged books sheet keeps books and slips | engine tests |
| C32 | the list refusal loses the method-steps sentence | pins, decision tests, other python tests, engine tests |
| P01 | designer: the paragraph telling it to record the return | pins, decision tests |
| P02 | designer: "returning it ends your run without `WORKSHEET_PREFLIGHT_OK`" | pins |
| P03 | rule 11: a sheet that contradicts the objective no longer goes back | pins, decision tests |
| P04 | rule 11: the entry dropped from the return | pins |
| P05 | step 1: the return line's entry sentence | pins |
| P06 | the gate paragraph: how the gate reads the record | pins |
| P07 | step 1: the engine drawing dropped (settled f) | pins |
| P08 | designer: "one-line" dropped from the reminder | pins |
| P09 | rule 13: the one-line reminder pointer | pins |
| P10 | the final check's method-steps clause | pins |
| P11 | preferences: "one-line" dropped | pins, decision tests |
| P12 | focused repair: the stand-in sentence | pins, other python tests |
| P13 | focused repair: no entry added | pins, other python tests |
| P14 | focused repair: "never write the evidence out in words" | pins |
| P15 | focused repair: the Expected sheet's engine-drawing pointer | pins, other python tests |
| P16 | focused repair: re-point at a supported helper again | pins, other python tests |
| P17 | contract: the `returned` row | pins |
| P18 | contract: the `recordingLookedAgain` row | pins |
| P19 | contract: the `SHEET_STANDS_IN` row | pins |
| P20 | builder: the `SHEET_STANDS_IN` row | pins |
| P21 | builder: the `RETURNED_INVALID` row | pins |
| P22 | contract: the `lesson` field "Prints on every sheet." again | pins |
| P23 | books-or-sheet: the looked-again sentence | pins |
| P24 | books-or-sheet: what the build does with an unanswered prompt | pins |
| P25 | books-or-sheet: the number-sentence exemption | pins |
| P26 | brief-gap route: the entry dropped | pins |
| P27 | lesson designer pointer: the PSHE case | pins, decision tests |
| P28 | components pointer: the PSHE case | pins, decision tests |
| P29 | rule 11: the bracket of shipping doubts back | pins, decision tests |
| P30 | playbook: "re-authoring that one question against" back | pins |
| L01 | a retired sentence with a capital letter in the slide designer (first check's 10) | pins |
| L02 | an opposite paragraph in the lesson designer's Worksheet section (first check's 5) | pins |
| L03 | the brief-gap route below How to apply (first check's 69) | decision tests |
| L04 | the compositions reference back to its short heights (first check's 70) | engine tests |
| L05 | a new sentence telling the designer the Expected sheet stands in | pins |
| L06 | a sentence in the adaptation designer: a returned sheet needs only its note | pins |
| L07 | a sentence telling the designer to leave the entry in place when it rebuilds | pins |
| L08 | the brief-gap route moved to the end of the file (first check's 19) | decision tests |

## The suites

From `plugins/lesson-v4`, on the working tree, before the `python3` hang began:

| Suite | Result |
|---|---|
| `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider` | 2,223 passed, 1 skipped (103,473 subtests) |
| `node --test "test/*.test.js"` in `builder` | 742 pass, 0 fail |
| `node --test` in `worksheet-html` | 751 pass, 0 fail |
| `node --test` in `working-wall-html` | 142 pass, 0 fail |
| `node --test` in `stick-in-sheets-html` | 70 pass, 0 fail |

## What I would fix before release

Code and routes:

1. Finding 1: the designer's rebuild line says to remove the entry and its note when
   it realises a redesign; the preflight refuses an entry for a sheet the adaptation
   does not direct; its line for a returned sheet still in the spec asks whether this
   is the redesign; a test for each.
2. Finding 2: a warning (or refusal) when a teaching return's note names a contract
   ref that is approved and still coming (refs are exact ids, not free text); and
   correct the report's "not told" sentence.
3. Finding 4: the focused repair returns `WORKSHEET_CONTENT_GAP` for the Expected
   sheet too, so the wave recognises it.
4. Finding 5: measure the Expected sheet the same way in both passes (or drop a
   stand-in the second pass omits), with a test for the mixed case.
5. Finding 10: a test that the build refuses a malformed record.

Question for him (one line):

6. A Below or Greater Depth sheet with a fault other than page fit after its repair
   round: should the Expected sheet stand in there too? Today the whole pack goes.

Text:

7. Stop quoting the lead's wording as his (finding 6): the log's decisions bullet
   (and its objective case), the three worksheets pins and five success-criteria pin
   outcomes (through `build_ws_mapping.py` and `w9`, rerun), the mapping, the test
   comment, `w2`'s comment and the report.
8. Rule 11's objective case into the brief-gap route, `shared.md` and the
   definition of `"problem": "teaching"` (finding 6b).
9. Soften the five "nothing is ever left with no sheet" sentences to what the build
   does, and name in the log's "Not done yet" the Expected-picture cost (finding 4)
   and the other-fault cost (finding 3).
10. Word the books reference, the contract and the log to the engine's real test
    (finding 8), or have the engine look for boxes.
11. Add findings 1, 4 and 9 to the report's list of playbook words, and say that until
    then what he sees of a stand-in is the answer key's line.
