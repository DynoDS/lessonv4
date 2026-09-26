# The design reviewer release (topic 8, release 2): first independent check

Checked on 26 September 2026 by a fresh agent that wrote none of it: the branch
`streamline/8-reviewer` in `C:\Users\Daniel\Projects\lessonv4-reviewer` (from `b1c2d427`,
uncommitted), against `reviewer-release-brief.md`, the change plan's section 3 (with 0, 1,
8, 10 to 13), his words in `2026-09-23-design-reviewer-ledger.md` and `streamline-plan.md`.
Nothing in either copy was changed except this file. Scratch and scripts:
`plans/streamline-tools/scratch/rvchk1/` (`paradiff.py`, `replay.py`, `cards.py`, `views.py`,
`pindiff.py`, `attacks.py`, `merge_trial.py`, `merge_resolve.py`).

## In short

**To repair (no question for him needed):**

1. **The name trigger reads 18 KB for nothing in about two lessons in five.** The card now
   sends the reviewer to Slide Philosophy's content boundaries (18,433 bytes) whenever the
   view's name list "lists a name". Built for all 53 saved designs, the list names something
   in 43; in 20 of those the only "names" are made-up children in maths or PSHE questions
   (`Zara`, `Ella`, `Sam`, `Amira`), lettered labels (`Chart A`, `Line A`, `Day A`,
   `Meal A`) or false catches (`LESSON`, `PSHE`). The paragraph it opens is about real
   people, places, organisations and events, so nothing there is for those lessons. It also
   adds little the reviewer's own step 8 does not already say (only the two "set the scene"
   examples and "a board with several is too much to take in"). Suggested repair: fire on "a
   real person, place, organisation or event" in the list (the paragraph's own words, visible
   without judging a defect), or on the plan's narrower draft. The builder's reason for
   rejecting the plan's draft is weaker than it says: step 8 already makes the reviewer check
   every listed name, so a trigger on "a listed name nothing on the board explains" fires
   after a check it is told to do anyway.

**For him to decide:**

2. **The "look at the diagram" Teach line (RV-C10) now goes to the lesson designer.** His
   words keep it with the reviewer: "if it's a small thing, say it's words aren't right and it
   thinks these words would be better, then the reviewer changes them", naming only "Swapping
   a photo of a number line ... or rewriting a doobie" for the designer, then "Other than that,
   though, the reviewer fixes small things". The read-back he said "1. y" to names only "a
   picture swap or a rewritten Do beat". The report says "The question he answered 'y' to named
   C10"; the ledger does not record that. The case for the builder's reading is real (the same
   paragraph says a Teach board's route "is content only the Lesson Designer writes", and J11
   gives the designer a repair that changes "the preparation"), but so is the case against:
   step 8 still lets the reviewer add a clause to the board for an unexplained name ("you may
   repair it yourself as wording"), which is the same kind of board wording fix. Ask him with
   one example (`Follow the tube down from the mouth on the diagram`: reviewer rewrites it, or
   sends it back?). Turning it back is one sentence, one fixture case and the TD-L10 and
   design-reviewer pins.
3. **Consequences he has not been told.** Each of the three send-backs costs a designer pass
   and a whole second review; after two, the run cannot end complete and the dispute leads his
   report (the playbook's Phase 1.25). And the reading grows: a maths lesson with one named
   child now opens both the name section (18 KB) and the picture rules (14.6 KB) beside a
   73 KB instruction file.
4. **The fixed reader** ("the actual child in this class" for "the actual eight- or
   nine-year-old the year group names") is the lead's extension of his 7B reason, not a
   decision on this list. Same meaning, safely worded; he should just see it.

**Everything else holds:** nothing lost (every removed story is in the log word for word,
every cut repeat has its holder), his other decisions built in his sense, the scripts replay
to the branch exactly, 16 of 16 undo attacks caught, the trial merge with 7A loses and
contradicts nothing, every suite green, no dash added.

## 1. Nothing lost

Paragraph diff of `agents/design-reviewer.md`, 4.2.292 against the branch (19 changes):

| Row | Old | New | Where it lives now |
|---|---|---|---|
| C06 | «The lesson that shows the gap: a Year 4 history design was approved here on 10 September 2026 ... an evidence question at once.» | removed | log entry, word for word; the calibration (C02 to C05) stays |
| C08 | «this catches too little, and the plugin approved a deck that failed it on 14 September 2026 (... "there's nothing on the slide to guide me to know what to say").» | «this catches too little.» | log word for word; his quote also stays in `preferences.md` Slide Philosophy (L543) |
| C13 | «On 22 September 2026 two lessons in a row were approved with ... while every Teach script carried a reason or a refusal the board did not (`He wasn't...`; `People sometimes...`).» | «A script line such as `He wasn't ...` or `People sometimes ...`, with no counterpart on the board, is that finding.» | log word for word; "reason or refusal" is still carried by the sentence before (its `because`, `so`, `That doesn't mean`, `It wasn't`) |
| D06 | «and today the teacher edits it out by hand» | «and the teacher would have to edit it out by hand» | plan's words; log |
| F09 | «a specification, and that is how a class met `What does one visible detail suggest about this class?` after a review that found nothing.» | «a specification.» | log |
| G05 | «`Read 66 child-facing strings ...` was the whole sweep on a Year 4 PSHE lesson ... and that line is what a sweep that happened ...» | «A count line alone is what a sweep that happened and a sweep that did not both produce.» | log; the packet's check still carries the same reason |
| G21 | «An RE beat printed `What do their reasons share?` over ...; the plain version was already written and the class got the clever one.» | «`What do their reasons share?` printed over ... is the shape: the plain version is already written, and the class gets the clever one.» | log |
| L10, L11 | «This is the check that was too thin to catch a place-value-chart lesson ... so read»; «catch: it was the shape of every sheet counted on 12 September 2026, including» | «Read»; «catch, as in» | log; instruction and teeth example stay |
| M06 | «A Year 4 RE deck passed this review with two children's reasons on the board as text cards ...» | removed | log; the same case stays in `preferences.md` visual-need boundary |
| E05 | «Do not recheck identifier or reference legality.» | cut | E02's list («identifier syntax and existence; reference existence») and «Judge semantic consequences only.» |
| N14 | «Then read the closing decisions of `design-decisions.md`, the part you left until now.» | cut | F18 («11. Read the closing decisions ... only for the final decision-drift check.») and F15 |
| K09 | «- each moment carries only what the class can take in at once (the User-fit judgement above owns that test; do not run it twice);» | cut | C02 |
| K03 | «...teaching context; do not repeat a separate whole-lesson sweep.» | «...teaching context.» | G02 («Do not perform separate whole-lesson rereads for each one.») |
| P12 | own paragraph «Use `REDESIGN REQUIRED` when ...» | joined to P09, word for word | same file |

A script checked all ten removed story spans against the log entry, flattened: all present.
Retired wordings are barred in every runtime file and program by the new pins (26, all
"everywhere" except the three in files the subject-files release removed); a grep of the
plugin finds them only in the log, the pin test and the pin file.

## 2. His words, decision by decision

- **Decision 2, J34 and M14.** Old «The repair is local and keeps the chunk: ask for the
  because», new «The repair keeps the chunk and is the Lesson Designer's, because it changes
  what children have to think: return it naming the fix, which asks for the because»; old
  «Raise it as a correction naming the helper that should draw it.», new «Return it to the
  Lesson Designer, naming the helper that should draw it.» Both are his "rewriting a doobie"
  and "Swapping a photo of a number line". The list of repairs, both pointers and M15 are
  unchanged. The reviewer's own wording repairs stay (F12's clause, G22, J07, the voice sweep),
  each held by a test. Built as he said.
- **Decision 2, C10.** Old «Repair it to what they will notice, or, ... take the line off the
  board and let the key question do the pointing», new «Return it to the Lesson Designer,
  naming the fix: the line rewritten as what they will notice, or, ... the line taken off the
  board and the key question doing the pointing». Follows the plan, not clearly his words: see
  "In short" 2. The pin outcome on TD-L10 records it under his decision 2 "(a Teach example
  written as an instruction to look)", which his recorded read-back does not name.
- **Decision 7, the three triggers (builder's wording).** Each follows his "2. yes" to "Add the
  three cases to the card, beside their sections":
  - Slide Philosophy gains «Read its `Lesson Designer content boundaries` too whenever the
    view's `Names on the board` lists a name, for `A name, or a thing the class has never
    met, arrives with its context`.» The case is right; the firing condition is too wide
    ("In short" 1). Opening one subsection rather than all of Slide Philosophy's designer parts
    is a sound narrowing.
  - The visual-need boundary gains «Read it too whenever a beat quotes, voices or names a
    made-up person who is present in it, for `A person the lesson invents counts as something
    in the world`; one only referred back to is not this case.» The plan's draft almost word
    for word, with the section's own limit. It fires on maths word problems with a named
    child; that is not for nothing, since the reviewer's M05 already asks for "the face and the
    bubble" there and the section brings the limit.
  - Source and Scenario Integrity gains «Read it too when a made-up person or story stands for
    a group the objective is about (`An invented case is evidence about the group`).» Follows
    the ledger's case and excludes maths word problems by its own words.
  - Each appended as its own sentence rather than joined into the old one, which keeps TD-L18
    and AK-DEC-05 exactly as pinned: fine.
- **Settled item 4, board first.** Old «Judge the spoken and visible explanation together;»,
  new «Judge the visible explanation first, on its own, and the spoken one separately, so
  nothing counts as taught on the board because the script says it;». His "board first,
  speaker notes separate". C15's «Then uncover the script and read the two together» stays: it
  comes after reading the board with the notes covered, and its job is finding script-only
  teaching, which is his concern. The ledger told him "The one line that still says
  'together'" would change; C15 is a second, and the log says why it stays. No other copy of
  "judge together" exists (grepped the reviewer, its repair, the route checks, preferences,
  skills, programs).
- **Settled item 1, "about four pieces".** No line and no number added anywhere; his
  calibration is untouched and a test holds it. Built as he said ("not if it hassnt been broken
  anyway").
- **Settled item 5.** O14 now says what the playbook does (Phase 1.25: focused repair first,
  then the Phase 1 fresh attempt): true. P06's report shape matches `require_closest_calls`
  (heading, then `> "..." - reason` lines). J18 loses "now".
- **Added that he did not ask for:** the fixture's three case wordings (tests only, not read
  at run time); the name trigger's firing condition; the fixed reader (the lead's). Nothing
  else.

## 3. Cost and behaviour

Cards built for all 53 saved designs with the 4.2.292 program and the branch's
(`scratch/rvchk1/cards/`): every card differs in exactly the three trigger lines (+3, -3), and
all 51 buildable views are identical. What the reviewer is now told to read, and when:

| Trigger | Opens | Fires on (saved designs) |
|---|---|---|
| any name in `Names on the board` | 18,433 bytes | 43 of 53: 19 with real people or places (history, RE, geography), 4 borderline (`Roman`, `RSE`), 20 with only made-up children, lettered labels or `LESSON`/`PSHE` |
| a made-up person quoted, voiced or named in a beat | 14,577 bytes | most maths lessons with a named child (about 11 of 22) and the PSHE, RE and science lessons with characters |
| a made-up case standing for a group | 5,977 bytes | history and RE lessons with an invented child for a group |

So yes: the name trigger fires on nearly every lesson and, in about 20 of 53, for nothing.
The builder's sizes check out (reviewer 74,602 to 73,330 bytes; packet 130,293 to 130,922;
pin file 545,048). Every section named can be opened with the reader's `--select` as the card
names it.

## 4. Pins and replay

- **Pin file and test** hold what the report says: 534 pin rows (428 ledger rows plus one
  added, plus 105 paragraphs of the reviewer's seven sections), 393 unchanged in place, 26
  retired wordings, eight decision tests on top of the shared checks.
- **Earlier topics' pins** moved by `rv_06` (AK-A49, G21, K01; QC-C08, D08, E11, P01; SC-Q01;
  TD-L07, L09, L10; WS-I05, Q02, Q08, Q10, Q11 and the worksheets section 5 home): each word
  change is exactly this release's sentence, and each outcome names the right decision. The
  only doubtful reason is TD-L10's attribution of C10 to his decision 2 (above).
- **Replay:** `git archive b1c2d427` into scratch, the nine scripts run in order, then every
  file under `plugins/lesson-v4` and `plans` compared both ways with the branch: no
  differences.
- **Undo attacks** on that complete copy (16 test files, untouched first: 329 passed), each
  caught: C10 turned back to the reviewer; a permission added to M14 ("or swap it yourself");
  "on its own" dropped from I07; the name trigger's paragraph name dropped; the invented-person
  trigger's limit dropped; the scenario trigger removed; one `Closest` line dropped; E05 put
  back; a retired story pasted into the lesson designer; the log's 22 September sentence
  thinned; the photograph case's owner and result turned to the reviewer; the fixed reader
  turned back; "now" put back in J18; O14's focused repair dropped; K09 put back; P12 split off
  again.

## 5. The merge to come

A throwaway git repo in scratch: base `b1c2d427`; branch 7a from the main checkout's working
tree as it stood today (57 changed, 61 added); branch rv from this worktree (19 changed, 27
added); `git merge rv` into 7a. Conflicts, exactly as the builder found: the build log and the
quick-checks, success-criteria and teach-then-do pin files. Resolved as the builder's notes
say (7A's log then this entry, numbered with a stand-in version; 7A's side of the three pin
files), then `rv_09_follow_at_merge.py`: exit 0, 9 pins moved (including 7A's SA-M08, reason
correct), the design-reviewer mapping rebuilt with 7A's seven rows (42 changed rows), the two
topic 7 ledgers recorded. On the merged tree the whole Python suite passes (2,295 passed, 1
skipped) and the voice harness 21; the node suites were not run there (no `node_modules`;
this release changes no engine).

Nothing lost or contradicted: the merged reviewer file is exactly 4.2.292 plus 7A's four
changes (H12, H14, J48, K02) plus this release's nineteen; the merged packet keeps 7A's Apply
trigger, its Pride note and its removed lesson-field lines beside this release's three
triggers; the three sections the triggers name are unchanged by 7A. 7A was still under check
when this ran, so repeat `rv_09` on the real merge as planned.

## 6. The suites

`bash plans/streamline-tools/run-all-suites.sh rvchk1` from the worktree root, the venv first on
PATH: Python 2,274 passed, 1 skipped; voice harness 21; builder 762; worksheet-html 771;
stick-in-sheets-html 73; working-wall-html 154; shared 126; test 46. All as the report says.
No em or en dash in any added line of the diff, the new pin test, the mapping, the report or
the scripts.

## Found in passing (not this release's to fix)

- The name detector lists `LESSON`, `PSHE`, `Chart A` and `Day A` as names; harmless until a
  trigger reads the list.
- The builder's own three passing notes stand (the voice harness runner's paragraph order
  note, the maths `Apply` pointer, the compatibility route's "same conditional preference
  triggers", which only the card prints).
