# The worksheets release (4.2.290): what was built

Built from `ws-release-brief.md`, following `plans/2026-09-24-worksheets-change-plan.md`
and the teacher's words in `plans/2026-09-23-worksheets-ledger.md` ("Decisions taken",
"His answers, 24 September (morning)", the settled items he confirmed with "y", and
his evening "yes" to the one question they left open). Then repaired after the first
independent check (`ws-release-check.md`), finished with his answer to the question
that round held for him ("Asked from the release's first check", 25 September), and
repaired again after the second check (`ws-release-second-check.md`) and, for seven
small things, after the third (`ws-release-third-check.md`). Four items the
first round settled are the lead's readings of his earlier answers, told to him as
such, and he answered "those are fine" (the ledger, "Settled by the lead from his
earlier answers"); this report says whose words each is. Nothing is committed or
pushed.

## In short

- Every decision and settled item in the plan is built, with his words as the
  standard, and every finding of both checks is repaired or named as a limit.
- His answer on a sheet that cannot be made is built: a Below or Greater Depth sheet
  sent back, and at the last resort one the build cannot make for any fault, gets
  the Expected sheet in its place, its answer key covers it, and the tier and why
  are flagged for his report. Where a tier can still go without a sheet is said
  plainly under "The Expected sheet stands in".
- The change is fifteen scripts in `ws-change/` (replay order below), each old text
  asserted once, line endings kept, with the files they place in `ws-change/new/`.
  Replayed in place on a clean 4.2.289 tree (`scratch/wsb/replay.py`), they
  reproduce the working tree exactly ("different from the backup: nothing").
- Every suite passes. The 53 saved designs give the same results as on 4.2.289. Of
  the 61 saved worksheets, three change at the preflight, each explained below.
- Each engine, scope-check and run-script change, bent 58 ways, is caught by a
  test (`scratch/wsb/mutate.py`); the four pin attacks that got through the first
  check are still caught (`scratch/wsb/attack4.py`, 4 of 4).
- The instruction files are about 7.3 KB larger, not the 4 to 5 KB smaller
  the plan estimated. Said plainly below.

## Order of work, and the scripts

All in `plans/streamline-tools/ws-change/`, run with `python -X utf8 <script>`:

| Script | What it does |
|---|---|
| `_patch.py` | one replacement at a time, old text asserted once, line endings kept (a write retried when Windows briefly holds the file) |
| `w0_sheet_census.py` | every saved `worksheet.json` through the preflight, the build and the recording pass, signals only (`ws-before-sheets.json` on a clean 4.2.289 copy in `scratch/wsb/p289`, `ws-after-sheets.json` now) |
| `w1_stories_first.py` | the stories copied to the log before anything moved |
| `w2_preferences.py` | `preferences.md` |
| `w3_designer.py` | the lesson designer, its worksheet component, the contract |
| `w4_worksheet_designer.py` | the worksheet designer, its focused repair, the builder |
| `w5_references.py` | the helper guides, `books-or-sheet.md`, the brief-gap protocol, the adaptation designer's one line |
| `w6_reviewer_playbook.py` | the reviewer's three lines, the playbook's two |
| `w7_engine.py` | the sheet engine as first built |
| `w7b_regenerate.py` | `npm run catalogue` and `npm run layouts`, then proves only the intended lines changed |
| `w7c_pending_under_unavailable.py` | the preflight's pending-picture note follows the picture stage |
| `w7d_returned_and_books.py` | the return record and its gate, the returned stand-in, books or sheet by what the sheet holds, the generators' `--check`, the scope check |
| `w7e_expected_stands_in.py` | the key's stand-in line, the last resort for any sheet the build cannot make (before drawing and in the browser), the stand-in named once the pack is built, the run script's summary and flag, the tests |
| `w8_tests.py` | the moved and new tests (engine tests placed or appended from `ws-change/new/`), the pin checks |
| `w9_repin_other_topics.py` | the earlier topics' pins that followed the words |
| `build_ws_mapping.py` | the mapping (`plans/2026-09-24-worksheets-mapping.md`) and the pins |
| `w10_log_entry.py` | both `plugin.json` to 4.2.290, and the log entry |
| `w11_dash_check.py` | no em or en dash in any paragraph this release rewrote |
| `w12_compare.py` | the saved designs and saved sheets, before and after |
| `w13_sizes.py` | bytes before and after, as git stores them |

Replay order: w1, w2, w3, w4, w5, w6, w7, w7b, w7c, w7d, w7e, w8, w9,
build_ws_mapping, w10. Each repair round edited the change scripts themselves
(`scratch/wsb/edit_round*.py`), so the replay makes the repaired release directly.

## What changed, decision by decision

### Decision 2: the board's practice and the sheet never share questions

His words: "I wouldn't want the same exact questions on both ... It's just different
context, different numbers etc in maths. Other lessons like PSHE etc might be
different, it might be working towards a particular one question answered, the
sheet is the proof of that."

- `preferences.md` → What the sheet is for (B01): the practice slide keeps its own
  questions and the sheet never carries them; in maths different numbers and
  contexts; in a lesson like PSHE the sheet can be that one question, answered once,
  on the sheet, as the proof. "In place of the slide practice" replaces "a printed
  alternative"; the slide's diagram, labels and response structure may stay, with
  the sheet's own questions. B02 and A05 follow.
- The lesson designer (A08) and the components file (B05): "never its questions",
  and both carry his one-question case (the lead's reading of the words above,
  which he called fine).
- The reviewer (Q02): checks the sheet never repeats the practice slide's questions.
- His evening "yes" (S01, S02): the same kind of write-on figure may be on the sheet,
  with its own questions (3,250 and 4,750 on the practice line; 6,250 and 8,500 on
  the sheet's).

### Decision 5: a sheet a child could not use goes back

His words: "agree, should probably go back to be redesigned", said of a sheet a
child could not use as printed.

- Rule 11 is the one line: a problem a child could not get past as printed, or a
  sheet that contradicts the objective, stops that sheet; it goes back to its owner
  and the other sheets are made. A page merely plainer than hoped, or a doubt the
  teacher should know about, is a note. The objective case is the lead's reading of
  his words, which he called fine; it is not in his quote.
- Rule 1, How you work, `shared.md` (E08, E09, P24), the catalogue's generator line
  (P31) and the brief-gap protocol's **Worksheet Designer route** say the same, and
  since the second check both pointers carry the objective case too.
- **The return is a field.** Beside its `WORKSHEET_CONTENT_GAP` note, each returned
  sheet has an entry in the spec's top-level `returned`: `"problem": "teaching"`
  (a problem a child could not get past as printed, or a sheet that contradicts the
  objective) or `"problem": "picture"` with its `"refs"`. A sheet sent back is out of
  `sheets`; when its redesign goes in, the entry and the note come off. See "The
  engine".

### Decision 9: producing is chosen when it moves the objective on

`preferences.md` (D09), as the plan drafted; the pointer is fixed.

### Decision 10: a method's steps on a sheet

- `preferences.md` → The printed page (O09): "A list of a method's steps is never
  printed just as a reminder for the child to consult; a fill-in frame ... is a
  question, and steps a task needs worked through belong to their question." The
  example after it says "A one-line reminder of a method". "Never a list of steps
  printed just as a reminder" is the lead's wording of the suggestion he answered
  "yes" to, not his own words; he called the reading fine. It says nothing about
  where else the steps are shown.
- The worksheet designer's rule 13, final preflight and support paragraph follow.
- The engine's list refusal says "A list of a method's steps printed just as a
  reminder is left off too." It refuses three lines or more, so a two-line list is
  held by the words, not a check.

### Decision 13: the cases vary, not the forms

`preferences.md` (O11), as the plan drafted.

### The settled items (his "y")

- **a, b, d, e, g, h, i, j, l, m, n.** As the plan drafted (the first report's
  detail stands); the `lesson` field "heads the answer key; never printed on a
  pupil page".
- **f (a picture that will never arrive).** Step 1: re-point at a published picture
  or an engine drawing, never at words, else return the sheet. The focused repair:
  re-point at a published picture; if none can carry it, never words: a Below or
  Greater Depth sheet is taken out whole, with its key section, and recorded for
  the adaptation designer, and the Expected sheet stands in until the redesign goes
  in; on the Expected sheet the repair returns `WORKSHEET_CONTENT_GAP`, naming any
  engine drawing that could carry it, so the content-gap picture wave reaches the
  lesson designer.
- **o (the digit box).** His ruling wins by what the sheet holds (the lead's reading
  of his ruling, which he called fine): a box in the question's own sentence, or on
  a sheet whose only helpers are sentences and number sentences, is never flagged.
  See "The second check" for why the words now say "only helpers".

### Stories

Every story in the plan's section 4 list is in the log's "Stories kept here" before
it left. His calibrating examples are exactly as they were, dates included, and a
test holds each.

## The engine

- **`src/returned.js` (new) and `check-worksheet.js`: the return record.** The gate
  reads `returned`, never the note's words. A teaching problem stands, whatever the
  note mentions. A picture problem stands when every named ref will never arrive
  (absent from the contract, or its terminal receipt reads `unsatisfied` or
  `omitted`), and any picture problem stands under `--picture-stage` naming
  `unavailable`. Refused, the shape the gate was built for (the 30 August loss): a
  picture problem over a ref still coming, or naming no ref while pictures may
  come; and, whatever kind the entry names, a sheet whose own pictures (the
  adaptation's `- Photo refs:` field for that tier, exact ids, read with the
  receipts) are approved and not yet published. The refusal says to design the
  sheet to their promised filenames, and that anything a child could not get past
  once they arrive goes in its `WORKSHEET_CONTENT_GAP` note on the built sheet, which
  the run already treats as a content gap (the playbook's "Missing support or a
  wrong answer remains a content gap when recorded in notes"). Also refused: an
  entry beside a sheet still in `sheets` (the second check found one hiding a
  redesign), an entry for a tier the adaptation does not direct (it would print a
  pile nobody asked for), a returned Expected sheet (with a message that fits a
  content gap) and a malformed record, at the preflight and the build.
- **A sheet in `sheets` is always checked and built.** One beside its own entry is
  measured like any other; the build prints it, as its redesign, with
  `RETURN_RECORD_LEFT`.
- **The scope check** (`check-repair-scope.py`) releases exactly one change: a Below
  or Greater Depth sheet taken out whole, with its key section, and recorded. It
  still catches a sheet taken out with no record, part of a recorded sheet taken
  out, and a record taken away.
- **`slips.js`, `build-worksheet.js`: books or sheet.** Words about a box or a gap in
  the question's own sentence (`4,_50`), or on a sheet whose only helpers are
  sentences and number sentences (questions, written answers, instructions, number
  sentences, section labels), are never flagged; a sentence that names a figure
  ("Fill in the table"), and a box on a sheet that also holds a figure, are a prompt
  to look again (`RECORDING_LOOK_AGAIN`), answered by `"recordingLookedAgain": true`,
  never by the reason's words; the build corrects to "sheet" only an unanswered one.
- **`text.js`**: the list refusal's decision 10 sentence.
- **The pending-picture note** under an unavailable stage says the picture will
  never come (advisory only).
- **The generators**: both references regenerated, and both take `--check`, which a
  test runs.

## The Expected sheet stands in

His answer (the ledger, "Asked from the release's first check", 25 September): if a
Below or Greater Depth sheet sent back to be redesigned still cannot be made, those
children get the Expected sheet in its place, flagged so he knows ("yes"). The lead
passed it on for every Below or Greater Depth sheet the build cannot make.

- **A returned sheet** (`src/returned.js`, `build-worksheet.js`). While the spec
  records a Below or Greater Depth return, that tier holds the Expected sheet,
  printed in its slot with its pile code, and the returned sheet is never printed or
  its pictures read. The redesign replaces it when it goes in and the entry comes
  off. With no Expected sheet to print, the build refuses (`RETURNED_INVALID`).
- **The last resort, for any fault** (`--omit-unfittable`). Before anything is drawn,
  each Below or Greater Depth sheet goes through every check the build makes, on its
  own: its pictures, a criteria panel, its shape, its answer-key section, and what
  the page prints. When it would be refused while the Expected sheet passes all of
  them, the Expected sheet stands in. The Expected sheet is measured the same way
  first, so a stand-in is never announced and then dropped (the second check's
  mixed page shapes). After drawing, a Below or Greater Depth sheet the browser finds
  clipped, when the Expected sheet printed clean, gets the Expected sheet too: those
  pages are drawn again and the key written again.
- **The answer key covers it** (`src/worksheet.js`): that tier's section is the
  Expected answers under a line saying so and why, in plain words that promise
  nothing the run does not yet do: "The Expected sheet stands in here for the Below
  sheet, which could not be used as printed." (or "whose picture never arrived",
  "which the page could not hold", "which could not be built").
- **The flag names the tier and why**, once the pack is built:
  `SHEET_STANDS_IN: Below - the Expected sheet stands in for Below, and the Below
  section of the answer key is the Expected answers: the Below sheet could not be
  used as printed (a picture it needs will never arrive: adaptation-photo-002).` It is
  a flag for his report, never a fault for a repair round, so it carries no
  `BUILD_DIAGNOSTIC`. It says what happened, true now and after the playbook release,
  and never that a redesign is on its way.
- **Where a tier can still go without a sheet, said plainly** (each held by a test):
  - an Expected sheet the page cannot hold is omitted, as before (one sheet never
    costs the pack), and nothing stands in for the class's own sheet;
  - then a Below or Greater Depth sheet the page cannot hold is omitted too, since a
    copy of the Expected sheet would not fit either;
  - then a Below or Greater Depth sheet with any other fault refuses the whole pack,
    as it did on 4.2.289, since nothing can stand in;
  - an Expected sheet the browser finds clipped refuses the whole pack, as on
    4.2.289 (not changed in this release);
  - an Expected sheet with any other fault refuses the whole pack, as before: the
    class's own sheet is never built around;
  - a tier the Expected sheet stood in for that is then omitted or refused is named
    for its own reason, never with the Expected sheet's measurement as if it were
    its own, and nothing is announced and then dropped;
  - a refused pack leaves no answer key behind: the key, written before the pages
    are drawn, is removed when the browser's check refuses the pack (chosen over
    writing the key after the PDF, so a machine with no browser still gets its
    key);
  - and until the playbook release, the run passes `--omit-unfittable` only for a
    page too small, so a Below or Greater Depth fault of another kind still costs
    the pack in a real run (below).
- **The run's side that code can carry** (`scripts/run-fixed-resource.py`): its
  summary names every tier stood in for (`standInSheets`) with its reason and says
  `FIXED_RESOURCE_FLAGGED`, as it already did for an omitted sheet; its
  `--omit-unfittable` help says what the last resort does.
- **Words**: the focused repair, the worksheet designer's return paragraph and gate
  paragraph, the builder's and the contract's signal tables, and the contract's
  `returned` row. The worksheet designer is told that the Expected sheet stands in
  (its contract says so; the first report said it was not, which was wrong). The
  refusal of a teaching return while the sheet's own pictures are still coming is
  what keeps the stand-in from being an easy way out at design time.
- **Tests**: `test/stand-in.test.js`; the second check's cases in
  `directed-sheets.test.js` (a record beside a sheet refused at the preflight and
  built at the build, an undirected tier refused, a teaching return refused while
  its own pictures are coming and standing once they are published, unsatisfied or
  omitted or the stage was unavailable, another tier's pictures not counted, the
  build refusing a malformed record); in `omit-unfittable.test.js` the last resort:
  a Greater Depth sheet the page cannot hold (left to the engine and in a named
  layout), a word bank typed into a question, a picture that cannot be read, a page
  the browser finds clipped, the Expected sheet omitted, the mixed shapes, and every
  "said plainly" case above; and a run-script test. Two older last-resort tests
  changed their outcome and kept their point: the success-criteria topic's "a
  criteria panel is refused before the fit, and never costs the pack a sheet" (the
  panel is still never printed; the Greater Depth sheet carrying it now has the
  Expected sheet in its place, and without the flag the panel still refuses the
  pack), and "a fault that is not about page fit still refuses everything", now
  "never prints the faulty sheet" (on the Expected sheet it still refuses
  everything).

## The third check, and what was repaired

All ten of the second check's findings held (`ws-release-third-check.md`). Its seven
small things, each verified first:

| Small thing | Repair |
|---|---|
| 1. The key line and the flag promised a redesign the run does not yet ask for | plain words that say what happened: "which could not be used as printed", "whose picture never arrived"; the flag reads "the Below sheet could not be used as printed (...)" |
| 2. Four comments put the lead's reading in his mouth | `check-worksheet.js`, `run-fixed-resource.py` (comment and docstring), `build-worksheet.js` and `omit-unfittable.test.js` now say his "yes" was for a sheet sent back that still cannot be fixed, and that the widening to any sheet the build cannot make, and the objective case, are the lead's |
| 3. A refused last-resort build left a key with a stand-in line | the key is removed when the browser's check refuses the pack; tested |
| 4. Two wrong names (`s11`, `s10`) | a stand-in omitted because the Expected sheet cannot fit is named for its own reason; a clipped stand-in is named as the Expected sheet standing in, with the tier's reason; the summary says so |
| 5. The clipped Expected sheet was missing from the "said plainly" list | added there, to the builder's row, the contract and the log; the behaviour is unchanged |
| 6. Two stragglers | the picture refusal now ends "Anything else a child could not get past goes in its WORKSHEET_CONTENT_GAP note on the built sheet, which the run treats as a content gap."; the `slips.test.js` comment says "only helpers are sentences and number sentences" |
| 7. E7 and T6, held by nothing | a test of `s11`'s shape, and the contract row's "teaching" sentence pinned; each fails with its repair undone and passes again once put back (`scratch/wsb/undo_round5.py`, `undo_round5.txt`) |

## The first check, and what was repaired

As in the first report: all ten findings repaired (the note's words replaced by the
field; the designer's own line standing under `unavailable`; a dead Below picture
never costing the pack; the one-question pointers; the one-line reminder; rule 11's
bracket gone; the digit box by what the sheet holds; the Expected sheet's own
message; the log and report; the four attacks caught). The second check found
where some of those repairs fell short, below.

## The second check, and what was repaired

Each finding verified against the files first.

| Finding | Verified | Repair |
|---|---|---|
| 1. A record left in the spec hides the sheet it names; a record for an undirected tier makes a false pile | yes | a sheet in `sheets` is always checked and built; the preflight refuses an entry beside one and the build prints it with `RETURN_RECORD_LEFT`; the repair takes a returned sheet out whole, and the scope check allows exactly that; the designer is told to take the entry and note off when a redesign goes in; an entry for an undirected tier is refused |
| 2. A "teaching" return let the 30 August loss back; the report said the designer is not told | yes | a teaching return is refused while the sheet's own pictures (the adaptation's Photo refs for that tier, by the receipts) are approved and not yet published; the report corrected |
| 3. "Nothing is ever left with no sheet" was not true | yes | the last resort now stands the Expected sheet in for any Below or Greater Depth fault; every remaining gap is named plainly above, with a test, and the claim is gone from the log, report, `returned.js` and the tests |
| 4. A dead Expected picture sent back no marker | yes | the focused repair returns `WORKSHEET_CONTENT_GAP` for it |
| 5. A stand-in announced and then dropped (mixed page shapes) | yes | the Expected sheet is measured the same way before any stand-in, and stand-ins are named only once the pack is built; tested |
| 6 and 7. The lead's wording quoted as his; the objective case inside his quote | yes | the log, the report, the mapping (J03, J05, O09, and P20 and K15 for the other readings), `w9` and the five success-criteria outcomes it moved, `w2`'s comment and the decision test now say whose words each is |
| 6b. Rule 11's pointers still called a contradicting sheet a note | yes | the brief-gap route and `shared.md` carry the objective case, and so does the definition of `"teaching"` |
| 8. The books words said "only boxes", the engine checks "only sentence helpers" | yes | the words now say what the engine checks (below) |
| 9. The stand-in's diagnostic invited a repair round; what reaches his report | yes | no `BUILD_DIAGNOSTIC`; the playbook words below say what he sees until then |
| 10. The build no longer checked the record (attack C19) | yes | a test that the build refuses a malformed record |

**Books or sheet: why the words follow the engine.** His ruling's own case (a digit
box in the question's words) is never flagged either way. Making the engine look
for boxes would need to know, helper by helper, which print a box to write in, and
no field says so; guessing would put the word list back in charge. So the words say
what the engine checks by structure: a sheet whose only helpers are sentences and
number sentences. A sheet that also holds a figure gets a prompt, answered by one
field; unanswered, it prints as "sheet", so no child loses the printed page.

Still limits: a new sentence saying the opposite outside any pinned section, and a
condition inside unpinned code (held by the engine, scope-check and run-script
tests, 58 of 58 mutations caught; the full run missed one, the teaching key line, which a test added in the same round now catches). One mutation was dropped as equivalent in an
earlier round (letting the Expected sheet stand in for itself changes nothing).

## Every pin, and why

**The worksheets pins.** `scripts/tests/worksheets_ledger_pins.json` (614 pins),
built by `build_ws_mapping.py` on the shared `ledger_mapping.py`: all 478 rows, 68
changed rows each with the decision that changed it (and each repair round that
moved it, and whose reading it is), five added rows for new mechanisms (the gate,
the books engine, the return record, the Expected sheet standing in, the
generators' check), eleven homes paragraph by paragraph, and 87 retired wordings
barred in any case. `test_worksheets_ledger_is_kept.py` runs the shared checks, the
decision tests and the route-order test.

**Earlier topics' pins that followed the words** (`w9`, in place; the earlier
builders are frozen and refuse to run without `--i-know-it-is-frozen`):

| Pins | Row | Why |
|---|---|---|
| assumed knowledge | AK-A05, AK-A49, AK-J03, AK-J04, AK-J13 | settled a and b |
| the rhythm | TD-H03 | settled b |
| success criteria | SC-N17, SC-N18 | settled a |
| success criteria | SC-N01, SC-N04, SC-N05, SC-N07 | decision 10, as the lead read it (his wording corrected in their outcomes) |
| success criteria | SC-DEC-08-ENGINE | the list refusal line decision 10 split in two |
| success criteria | SC-N14 | outcome note only; its barred wordings stay barred |
| quick checks | QC-S42 | decision 2 |

Vocabulary's pins are untouched.

## Where I departed from the plan, and why

1. **The worksheet designer's fold is smaller** (its support paragraphs stay).
2. **The return is a field, not the note's words.**
3. **The compositions reference** says the level code sits in the printer margin,
   and every zone height it quotes was corrected.
4. **`RECORDING_NEEDS_SHEET` was also in the contract's signal table.**
5. **The pending-picture note** under an unavailable stage.
6. **Books or sheet by what the sheet holds, with a field.**
7. **A returned Below or Greater Depth sheet is out of `sheets`, and the Expected
   sheet stands in for it**, and, at the last resort, for any Below or Greater Depth
   sheet the build cannot make. The build does it from structure alone, with nothing
   for a designer to choose. It changes the Maths 15 rule for Below and Greater
   Depth only, and touches the run's script only so its summary flags the tier.

## The suites

`bash plans/streamline-tools/run-all-suites.sh ws-after`, final tree, with a
`python3.exe` from a venv in `scratch/wsb/py3only` first on `PATH` (the second
check's workaround for a `python3` that can hang; logs: `ws-after-*.log`):

| Suite | Result | Baseline (4.2.289) |
|---|---|---|
| python (`scripts/tests`) | 2,225 passed, 1 skipped | 2,201 passed, 1 skipped |
| voice harness | 21 passed | 21 |
| builder | 742 pass, 0 fail | 742 |
| worksheet-html | 766 pass, 0 fail | 722 |
| stick-in-sheets-html | 70 pass, 0 fail | 70 |
| working-wall-html | 142 pass, 0 fail | 142 |
| shared | 126 pass, 0 fail | 126 |
| test | 46 pass, 0 fail | 46 |

## The saved designs and sheets

- The 53 saved designs: `ws-after-designs.json` matches `ws-before-designs.json`
  design by design (the validator is untouched).
- The 61 saved worksheets (`w12_compare.py`):
  - his two trial returns (`caseA2`, `caseC2`) omit a sheet over a note alone; they
    now stop at `SHEET_DIRECTED_MISSING`, asking for the record, where 4.2.289 passed
    that gate unchecked (no photo contract sits beside them). With a
    `"problem": "teaching"` entry (`scratch/wsb/trial-caseA2`, `trial-caseC2`), the
    Greater Depth one stands and fails `NO_SHEETS` as before. The Below one (his
    `Choose a job.` case) stands without its photo contract and is refused with it
    (`CONTENT_GAP_UNFOUNDED`), as 4.2.289 refused it: its own four pictures are
    approved and not yet published, so it is built to their filenames and its three
    problems go in its note, for the run to route as a content gap;
  - `childrens-lives-continuity-and-change` omits a Below sheet with no note: the
    same refusal in the new words;
  - nothing else appeared or went.

## Size, before and after

Measured as git stores the files (`w13_sizes.py`):

| Group | 4.2.289 | 4.2.290 | Change |
|---|---|---|---|
| Instruction files (15) | 841,718 | 848,985 | +7,267 bytes (the builder's signal table 1.5 KB, the contract 2.4 KB) |
| Generated references (2) | 83,177 | 83,232 | +55 |
| Programs (10) | 258,351 | 297,146 | +38,795 (the preflight 11.0 KB, the build 10.9 KB, the return record 6.7 KB, the books prompt 3.8 KB, the scope check 2.6 KB, the run's script 1.7 KB, the generators' check 1.5 KB, the key's stand-in line 0.5 KB) |
| Tests and pins | 1,872,617 | 2,682,680 | +810 KB, 736 KB of it the new pin file |
| The build log | 699,322 | 722,710 | +23.4 KB: the entry and its stories |

The instruction files are not smaller. The worksheet designer's fold and the stories
took out about 1 KB; his decisions, the repair rounds and his stand-in answer added
words where they are read (decision 2's cases, his figure example, rule 11 and its
pointers, the return record and the stand-in in the designer, its repair, the
contract and the builder, the brief-gap route, books-or-sheet's prompt). The
playbook is 78,776 bytes (cap 78,848); the focused repair 7,866 (cap 8,000).

## Anything he should know

- **Untried on a real run.**
- **Words the playbook release must write** (not added here; the playbook is topic
  10's and at its cap, 72 bytes left):
  - send each Below or Greater Depth sheet with a `returned` entry to the adaptation
    designer to redesign (for a picture that will never arrive, without it), reading
    `returned` beside the sheet's notes (P43), and route a Below or Greater Depth
    picture gap there, not to the lesson designer's content-gap picture wave (P34)
    (the playbook's settled item k);
  - when the redesign comes back, have the worksheet designer put it in and take the
    entry and its note off, then rebuild;
  - reach the last resort (`--omit-unfittable`) for any Below or Greater Depth fault
    a repair round leaves, not only a page too small;
  - carry each `SHEET_STANDS_IN:` line into the report as a teacher flag naming the
    tier and why (the run's summary lists them as `standInSheets`), and a
    `RETURN_RECORD_LEFT:` line as a note to tidy;
  - rewrite "A pack the round did not clear still ships too": a Below or Greater
    Depth sheet the build cannot make now arrives as `SHEET_STANDS_IN:`, not
    `SHEET_OMITTED:`, and only an Expected sheet the page cannot hold (and then any
    copy of it) is omitted;
  - the focused repair's `WORKSHEET_CONTENT_GAP` for a dead Expected picture is the
    marker the content-gap picture wave already waits for; nothing new is needed
    there.

  Until then, what he sees of a stand-in is the answer key's line and a pile marked
  with that tier's code; the run's JSON summary has the flag, but his report does
  not carry it yet. The redesign is not asked for, and a Below or Greater Depth
  fault other than page size still costs the pack in a real run.
- **An Expected sheet with any fault still costs the pack**, as before, unless the
  run's repair and content-gap routes clear it; an Expected sheet the page cannot
  hold is omitted at the last resort, as the Maths 15 rule has done since 22
  September.
- **A teaching problem on a sheet whose own pictures are still coming** is not sent
  back at design time: the sheet is built to its pictures' filenames and the
  problem goes in its note, which the run routes as a content gap. That is the
  price of keeping the 30 August loss out, and his own trial case shows it: the
  `Choose a job.` Below sheet, with its three real problems, is refused as a return
  while its four pictures are still coming, as 4.2.289 refused it. The run already
  sends such a note to its owner as a content gap (the playbook's P43), and one it
  cannot resolve stays a blocking fault in his report; a sheet with those problems
  is what prints if that route is not taken.
- **Lines other releases also change** (re-read by whichever lands second): the
  playbook's A12 and P32; the reviewer's I05, Q02, Q08; preferences' O36 and O37.
- **Still unsure, as the ledger left them:** B11 and P44.
- **The brief-gap protocol's slide-designer bullets and the contract's `layout` row
  keep their em dashes**: I added beside them, not rewrote them (`w11` names both).
- **`plans/streamline-plan.md` is not updated by me** (outside my files).
- **Next:** the narrow check the lead has planned, then his before-and-after lessons
  in Codex after copying the delivered deck.
