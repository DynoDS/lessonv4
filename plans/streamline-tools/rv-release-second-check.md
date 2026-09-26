# The design reviewer release (topic 8, release 2): second independent check

Checked on 26 September 2026 by a fresh agent that wrote none of it: the branch
`streamline/8-reviewer` in `C:\Users\Daniel\Projects\lessonv4-reviewer` (from `b1c2d427`,
uncommitted), after the builder's repairs and his C10 answer, against
`reviewer-release-brief.md`, `rv-release-report.md`, the first check (`rv-release-check.md`),
`rv-name-trigger.md`, his words in `2026-09-23-design-reviewer-ledger.md` and `streamline-plan.md`
("What the rounds have taught"). Nothing in either copy was changed except this file (and the
`rvchk2-*.log` files the suite runner writes, as asked). Scratch and scripts:
`plans/streamline-tools/scratch/rvchk2/` (`paradiff.py`, `names_probe.py`,
`known_from_script.py`, `probe_unresolved_review.py`, `replay.py`, `attacks.py`,
`attacks_log_full.py`, `main_stable.py`, `merge_trial.py`).

## In short

**To repair (no question for him needed):**

1. **The log promises a floor no program holds, and three of its new sentences have no test.**
   The log says that after two send-backs "the unresolved finding leads his report, and the run
   never ends complete". The playbook says so too (pinned), but the run report check does not
   look at the review: a report saying `COMPLETE` passes it while `design-review-postflight.json`
   still says `REDESIGN REQUIRED`, as long as the findings were not copied into `Blocking faults`
   (`probe_unresolved_review.py`: `RUN_REPORT_OK`). And three sentences of the new log entry can
   be changed with every Python test still passing (2,275 passed, all three changed at once):
   C10 "stays the reviewer's own wording fix" turned to "goes to the Lesson Designer too"; the
   floor thinned to "the unresolved finding is noted."; "it fires on 19" turned to "none". By the
   rounds' rule (every "never" in a log gets a test or is softened): pin the C10 sentence and the
   floor sentence beside the reader line the test already pins, and either soften "never ends
   complete" to what the playbook tells the run, or give the run report check the rule (refuse
   `COMPLETE` when the last review says `REDESIGN REQUIRED`, and want a `Blocking faults` line for
   it). The check is the run report program's, so the lead may prefer to carry it to 10.
2. **The name list cannot see a one-word name that opens its sentence, so the name case cannot
   fire on it.** The Tudor farm lesson (`year-4-history-lesson-2`) has `England, 1485 to 1603.`
   under `A Tudor farm household`; the list prints only `Tudor` and `Imagined Tudor`, which is why
   the table needed "Tudor" to count. Same gap: `Bruegel painted more than two hundred children
   ...` in a saved history lesson (fires anyway on `Roman Britain`), and on made-up boards
   `Jenner tested his idea on a boy.`, `Childline is a free phone line for children.`,
   `Remembrance is on 11 November.`: none listed, so a science lesson with a scientist or a PSHE
   lesson with a real organisation named only that way never opens the paragraph. Named mid-sentence
   they are all listed (`Edward Jenner`, `NSPCC`, `NHS Eatwell Guide`, `Guru Nanak`, `River
   Thames`, `Great Fire of London`). A small prototype (`known_from_script.py`, scratch only):
   count as known any word the teacher's script capitalises mid-sentence. On the 53 saved designs
   it adds `England` to the Tudor farm lesson (so it fires by the trigger's own words), `Bruegel`
   to one lesson that fires anyway, and otherwise only made-up children (Nadia, Grace, Jack,
   Jamal, Aisha, Lena, Maya), none of which fires. Or leave the list and say 18 clear and one
   borderline. The lead's call; this release did not change the list, but it is the first thing
   that reads it.
3. **One line missing from "Anything he should know".** It says a maths lesson with a made-up
   child no longer opens the name section, but not that a made-up child quoted, voiced or named
   in a beat still opens the picture rules, about 15 KB (the first check's own example; the
   report's Size section says it).

**Is "Tudor" right to fire?** In intent, yes: that lesson's board names a real period and a real
place, and the paragraph's own rules (a name the class meets arrives with its context; a name an
earlier lesson taught gets a short reminder) are exactly what it needs. By the trigger's words,
no: a period is not "a real person, place, organisation or event", and the builder's own table
treats `Roman` (in Roman numerals) as not firing on the same kind of reading. So the "19" rests on
one generous reading, and the honest fix is item 2, not a wider trigger ("or period" would fire on
`Roman`, `Victorian` and `Stone Age` everywhere).

**Everything else holds.** Every first-check finding is done; C10 is back word for word and
J34 and M14 still go to the designer, nothing else moved; the send-back account matches the
playbook (item 1 above aside); nothing lost; the scripts replay to the branch exactly; 12 of 15
undo attacks caught (the three misses are item 1); the trial merge with 7A as it now stands
conflicts only where expected and the whole Python suite passes on it (2,300); every suite green
in the worktree; no dash added.

## 1. The first check's findings, each tried again

| First check | Now | Tried again |
|---|---|---|
| 1. Name trigger too wide («lists a name, for `A name, or a thing the class has never met, arrives with its context`.») | «lists a real person, place, organisation or event, for `A name, or a thing the class has never met, arrives with its context`; a made-up person or a label such as `Chart A` is not this case.» | Done. Every saved design the table says does not fire lists only made-up people, labels (`Chart A`, `Day A`, `Line A`, `Meal A`), subject names (`PSHE`, `RSE`), `LESSON`, place-value words or `Before, During and After`, and its board has no other real name hiding among its capitals (`names_probe.py`: only made-up children at sentence starts, such as `Nina`, `Aisha`, `Lena`, `Ben`). Every design it says fires lists a real one, except the Tudor farm lesson ("In short" 2). |
| 2. C10 sent to the designer | Back as on 4.2.292 (section 2 below) | Done, by his "yes" (ledger, "His answers", last bullet). |
| 3. Consequences he has not been told | The report's plain words and the log now say what a send-back costs and that the name case reads about 18 KB in 19 of 53 | Done, bar "In short" 3. |
| 4. The fixed reader is the lead's | The log, the mapping (RV-G09), the AK-G21 pin outcome, the assumed-knowledge and voice ledger notes and `rv_10`'s note all say "the lead's reading of his words, not his wording"; a test holds the log's sentence | Done (attack 12 caught). |

The first check's passing note (the list takes `LESSON`, `PSHE`, `Chart A` for names) is now
harmless: the trigger's words exclude them.

## 2. C10, J34 and M14

- **C10, old (4.2.292) and new are the same sentence:** «An example written as an instruction to
  look (`Follow the tube down from the mouth on the diagram`) is the example missing rather than
  present: the board sent the class to the picture and named nothing for them to find when they
  got there. Repair it to what they will notice, or, when the picture's own label already names
  the thing, take the line off the board and let the key question do the pointing
  (`teaching-sequence-content-based.md` → `explanation`, part 3).» Compared byte for byte with
  `b1c2d427`: identical, once in the file. No other copy anywhere changed (the content route, the
  log's stories, the pin files and the fixture are the only other places the words appear).
- **The fixture case:** `teach-example-written-as-an-instruction-to-look-is-rewritten`,
  `APPROVED AFTER BOUNDED CORRECTION`, owner `Design Reviewer`, with his example: `Look at the
  diagram.` and `Notice the enamel is the hardest layer.`
- **J34** still reads «The repair keeps the chunk and is the Lesson Designer's, because it changes
  what children have to think: return it naming the fix, which asks for the because» (old: «The
  repair is local and keeps the chunk: ask for the because»); **M14** still reads «Return it to
  the Lesson Designer, naming the helper that should draw it.» (old: «Raise it as a correction
  naming the helper that should draw it.»). Both send-back fixture cases stay `REDESIGN
  REQUIRED`, owner `Lesson Designer`.
- **Nothing else moved with it.** The first check's replay copy is the first build; against the
  branch now, the reviewer differs only in C10 (back to 4.2.292), the packet only in the name
  trigger, the fixture only in the C10 case, plus the tests, pins, mapping and log that follow
  them. J34, M14 and every other reviewer line are as the first build left them. The mapping
  (RV-C10) and its pin quote his answer and bar «Return it to the Lesson Designer, naming the fix:
  the line rewritten as what they will notice»; TD-L10's outcome now names only C08 and C13.

## 3. What happens when send-backs use up the two designer passes

Traced in `skills/make-lesson/playbook-lite.md` and the programs. The report's account is right:

- **Together, in one pass:** "For `REDESIGN REQUIRED`, give Lesson Designer the current canonical
  files plus the complete diagnosis" (Phase 1.25). A review's send-backs go in one pass.
- **Two passes:** "Permit at most two semantic redesign passes" (each re-validated and reviewed).
- **Then the lesson is built:** "If the review after the final permitted redesign still requires
  redesign, the review loop ends there ... Continue the pipeline from the current canonical files,
  which still pass deterministic validation, and carry the reviewer's unresolved findings verbatim
  into the run report's blocking faults and the teacher flags. This route can never end
  `COMPLETE`, and the teacher report must lead with the unresolved findings." Phase 4's `Teacher
  flags` carries "the design reviewer's unresolved findings"; Phase 5 saves the files "whatever the
  package outcome". The after-review check refuses any change to a photograph's count, id or
  filename, so before this release the reviewer could not have made the photograph fix either.
- **Held by words, not by a program:** the run report check reads the review only for retired
  pictures (`validate-run-report.py`, `reviewed_retired_pictures`). A `COMPLETE` report passes
  with the last review still `REDESIGN REQUIRED` if nothing was carried; carried, `COMPLETE` is
  refused ("1 blocking fault(s) remain") and `PARTIAL` passes. So the floor holds only if the run
  follows the playbook ("In short" 1). The playbook also names no outcome for this route (its
  `PARTIAL` and `BLOCKED` are defined for other faults); `PARTIAL` is what passes.
- **The one way no deck arrives (not this release's):** a redesign pass edits the same files in
  place; if it leaves a design the validator refuses and neither its focused repair nor the fresh
  attempt passes, Phase 1 ends the run `BLOCKED` with the walk-through and no deck. Two more kinds
  of send-back make that route a little more likely; the playbook release could fall back to the
  last design that passed.

## 4. Nothing lost; pins, replay, undo attacks

- **Nothing lost.** Every span the release removed from the reviewer is in the log entry word for
  word (the 10 September design, the 14 September deck, the 22 September lessons, the planning
  noun, the count-only sweep, the RE beat, the text cards, the place-value sheet, the 12 September
  sheets) or has its holder (E02 for "reference legality", F18 for the reading order, C02 for the
  amount bullet, G02 for the whole-lesson sweep); the rest are the planned rewrites (G09, O14).
  Size as reported: 74,602 to 73,271 bytes.
- **Pins:** 534 rows in the new pin file; the 17 earlier pins moved as the report lists; every
  pin test passes on the branch, the replay and the merged tree.
- **Replay:** `git archive b1c2d427`, the ten scripts in the report's order, each exit 0; then
  every file under `plugins/lesson-v4` (969) and `plans` (343) compared both ways with the branch:
  no difference; the branch alone has only the logs, reports and table nobody's script writes.
- **Undo attacks** on a copy of the replayed tree (its 52 reviewer-reading test files passing
  first: 1,092), one at a time, restored after each:

| # | Attack | Result |
|---|---|---|
| 1 | C10 sent to the designer in new words | caught (RV-C08 paragraph pin) |
| 2 | C10 given "When unsure, return it to the Lesson Designer instead." | caught (paragraph pin) |
| 3 | The C10 case's limit (a board that honestly lacks a part) dropped | caught (RV-DEC-02 fixture pin) |
| 4 | The C10 case's example swapped for `Teeth have layers.` | caught (fixture pin) |
| 5 | His recorded "yes" turned to "no" in the ledger | caught (C10 decision test) |
| 6 | Name trigger narrowed to "a real person or place" | caught (RV-S16 pin) |
| 7 | Its paragraph name thinned to `A name arrives with its context` | caught (RV-S16 pin) |
| 8 | Its limit loosened to "a made-up person is not this case." | caught (RV-S16 pin) |
| 9 | "whenever the view's" made "whenever you find that the view's" | caught (RV-S16 pin) |
| 10 | Log: C10 "goes to the Lesson Designer too" | **missed** (whole Python suite passes) |
| 11 | Log: the floor thinned to "the unresolved finding is noted." | **missed** |
| 12 | Log: the reader line claimed as his words | caught (reader test) |
| 13 | Log: "it fires on 19" made "none" | **missed** |
| 14 | J34 back to "The repair keeps the chunk: ask for the because," | caught |
| 15 | M14 given "or swap the picture yourself when that is quicker" | caught (RV-M14 pin) |

## 5. The trial merge with 7A

7A in the main checkout was still being worked on (the packet and a wall file changed between two
readings at 10:00); the copy was taken once nothing had changed for over three minutes and a
minute's readings agreed, and 7A's files were unchanged across the trial. 7A now changes 59 files
and adds 67 (the first check saw 57 and 61). A throwaway repo in scratch (base `b1c2d427` with
`.gitattributes`; branch 7a from the main checkout; branch rv from this worktree), `git merge rv`
into 7a:

- **Conflicts, exactly the four expected:** the build log and the quick-checks, success-criteria
  and teach-then-do pin files. None unexpected, none expected that merged clean.
- **Resolved as the notes say:** 7A's log, then this entry, heading numbered with a stand-in
  version; 7A's side of the three pin files. Then `rv_09_follow_at_merge.py`: exit 0, `REPIN_OK 9
  pins moved` (QC-C08, D08, E11, P01, SC-Q01, TD-L07, L09, L10 and 7A's SA-M08), `MAPPING_OK 534
  pins; 42 changed rows mapped` (this release's 35 and 7A's seven), both topic 7 ledgers recorded.
  Every path it printed was in scratch; the worktree's files hashed the same before and after.
- **Tests on the merged tree:** the whole Python suite, 2,300 passed and 1 skipped (the pin tests
  among them); voice harness 21. Node suites not run there (no `node_modules`; no engine changed).
- **Nothing lost or contradicted:** the merged reviewer is 4.2.292 plus 7A's four changes (H12,
  H14, J48, K02) plus this release's nineteen; across all 167 merged files no line either side
  added is missing, except in the four files resolved as planned, where `rv_09` then moved the
  pins and the tests pass.

## 6. The suites

`bash plans/streamline-tools/run-all-suites.sh rvchk2` from the worktree root, the venv first on
PATH: Python 2,275 passed, 1 skipped; voice harness 21; builder 762; worksheet-html 771;
stick-in-sheets-html 73; working-wall-html 154; shared 126; test 46. All as the report says. No
em or en dash in any added line of the tracked files or in any new file, apart from 32 strings in
the new pin file, each a quotation of text already in the plugin (checked one by one).
