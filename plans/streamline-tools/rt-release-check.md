# The routes release (topic 8, release 3): the full independent check

Checked on 26 September 2026 against `routes-release-brief.md`, the change plan's sections 0, 1, 4, 8 and 10 to 13, the routes ledger ("Decisions taken", "His answers"), the preferences-rest ledger's decision 13 (his 13b), `streamline-plan.md` and the builder's `rt-release-report.md`. Nothing in either copy was changed except this file. All scratch work is in `plans/streamline-tools/scratch/rtchk1/` (the replay tree, the undo attacks, the trial-merge clone and every probe script).

## In short

**What must be repaired**

1. **One phrase in 13b says more than he agreed.** In four places the release writes that criteria that already show a good one "count as one seen". In the routes' own rule, "one seen" is what lets the whole launch go. His answer was only that such a task "skips a second model". The program agrees with him and refuses a missing launch, so a designer who follows the words gets sent back. The words should say what he said: the criteria stand in for the good example, and the launch keeps its case and steps.
2. **The report and the log tell half of what happened to the six maths lessons.** Both say each lesson passes once it shows a good explanation beside a weak one. That is true. But three of the six also pass with a one-line launch that shows no explanation at all, because their rounding steps are attached as criteria (tested below). If the program's 13b stays as built, he should be told this plainly.
3. **The merge instructions miss one conflict.** The reviewer's file clashes in two places, not one: line 44, and the section 3 list, where the reviewer's J34 and this release's J36 sit on neighbouring lines. The follow script puts J36 back, so the merged file comes out right. But its opening, and the report's "different lines; git merges them", should both say so.
4. **Small wording faults in the section other routes now read on its own.** It says "the validator refuses `null`", which is false for a big-task lesson's `explanation`. It also says "the fault above", which points outside the section. Either fix them now or name them for release 4.

**What is for him to decide**

5. **Should the program count a criteria panel as the good example?** As built, a big written task passes the program whenever its launch has no good example but its beat carries any success criteria. The reviewer is then the only check. His history comparison lesson now passes this way on a panel that lists what a good comparison has ("the same part of life, both periods, evidence, careful conclusions"). That is a checklist, not a good comparison. It is the kind of lesson the leisure lesson was.
   - The check's own history calls an exemption like this "the door, because nothing could check it".
   - My suggestion: the program keeps asking for a real good example, and the words keep his 13b for the reviewer and the designer.
6. **For the lead, not him: the reviewer still carries the old trigger.** Its launch line still says a launch is needed "when the product's form is new to the lesson". That is the leisure lesson's gap, which his decision 2 closed everywhere else. The fix was handed to 7B, and 7B is now parked until after the real-lesson finish line. His words for it are already given, so the one line could be carried in this release.

**What holds**

- Every decision is built as his words say. Nothing he asked for is lost: every removed sentence is in the plugin, in the build log or gone by his decision.
- All five departures from the plan follow from his words. The only thing added that he did not ask for is the program's 13b pass (item 5).
- All eight suites pass.
- The scripts replay on a clean `59f85708` to the branch byte for byte.
- All 28 undo attacks are caught.
- The trial merge onto `91687471` loses nothing from either side. It passes 2,355 Python tests and the voice harness.
- No em or en dash was added.

## 1. Nothing lost

Every sentence of the 17 changed runtime files at `59f85708` was looked for, whitespace-normalised, in the branch's whole plugin text (instructions, programs and the build log; `scratch/rtchk1/lost.py`). Each one not found is a change a decision names:

- Decision 1: the dialogic «a four-corners vote» and the Four corners bullet; do-beats' «Choose a whole-class movement beat only when the teacher asks for it.» (extended).
- Decision 2: the task route's «A task children can begin from its question alone, because the enabling input was one unit and the product form is familiar, leaves `launch` null.» and F18's «the product has a form children have not yet made in this lesson»; both `launch` lines gain the second case.
- Decisions 3 and 4: the old bold «**The shape this teacher teaches in, more often than not, is four parts in this order ...**»; the three-line shapes in the skill, task and discovery routes; the `→ explanation` pointers (REV C11, LD P06, PREF O03).
- Decision 5 (F12), decision 8 (K18 and its example), settled 6 (A24), 7a (B29), 7c (I10, I25, J04, J11, J15, J39), 7d (A42), 7g (O01, O07, D19, P07, SJ-D81, J52's three sources), 7i (P37), 7j and 7f (the two messages), 7e (the packet's kind test), and the validator's «A skill lesson is left alone».
- Stories: every removed story sentence (C34, C36, C05's date, E14, E51, E54's date, E58, E62, E77, I12, N05, N08) is in the new log entry word for word; the lost-sentence check finds them there.

Reasons kept as clauses: E58's «A picture with a label and one fact lets a teacher reading the board aloud say where the thing is and nothing else, so the children learn a label rather than what it names.» (old: «The children learn a label rather than a layer.»); I12's «A sort has a field for its handling and a written task does not, so preparation can end up decided by which beat happens to have a schema slot.» (old: «... was being decided by which beat happened ...»); N08's «Left completely bare, the helper is a surface waiting for someone who already knows the lesson, and a teacher meeting it cold has to invent the demonstration.» His calibration examples (the Shaftesbury lines, «Look at her. She isn't being paid to do this.», the Victorian children, the tooth-decay pair, the Tudor slide's words) are unchanged. The one dated story left in a moved paragraph (E48, «Three science boards were written that way on 22 September 2026») is named by the report and is in the log already.

Sizes (line endings normalised) match the report exactly: instruction files 832,931 to 835,258 (+2,327), the validator +2,253, the packet +615.

## 2. His words, decision by decision, and the five departures

Built as he said them:

- **Decision 1** («1. y»): the Stimulus «a ranking, a sort, a vote with a written reason»; the Talk bullet «A line on paper from agree to disagree, or a vote with a written reason (`do-beats.md` 6.2 and 6.4)» (6.2 Continuum Line and 6.4 Vote with Reason are both written, seated forms); do-beats «... only when the teacher asks for it, or when the movement is itself what is being learned (standing and making a quarter turn to learn what a quarter turn is).» 6.3 and 7.5 (Stand If) stay «Not used». No route file says four corners.
- **Decision 2** («2. y») and question 2 («Yes»): one rule in E30, F19, E70, F34 and F18; turns count only when «its own question asks for an explanation and its good one is on the board».
- **Decisions 3 and 4** («thats how i explain anything, so might not neccearily be teach slides i guess»): new bold sentence «**This is how this teacher usually explains anything, on a Teach board in any kind of lesson or wherever else something is explained: the takeaway, then a because or so that explains that one key point, then an example or what it does not mean.** It is how he usually explains, not a template, and the board reads that way unless the beat has a reason not to.» Both exceptions stay and resolve (`Cycles, and the beats around them` holds «brief on the board as well as in time»; discovery's `Teach why` exists). Every route points there keeping its own exception.
- **Decision 5** («5. y»), **decision 8** (the example counts 25 words by the validator's own `split()`), settled items 6, 7a, 7c to 7g, 7i, 7j: as the ledger's settled wording.

The five departures:

1. **F18's trigger** («the product has a form children have not yet made in this lesson» to «the class has not yet seen a good one of this product in this lesson»): follows from his words. Decision 2 lists F18 among its rows and quotes its question. No need to ask.
2. **A Do the task's `activity` is not searched**: a reasonable reading. The honest consequence for him: a big-task lesson whose product is a written explanation but carries neither `reasoningWords` nor `rehearsal` is not checked. For example, an older class whose connecting words have been faded, which `explanation-tasks.md` allows. Worth one line in the report, not a question.
3. **7B not built**: as the brief says. But see item 6 of "In short": B10 is the one piece of 7B that decides behaviour, and 7B is parked.
4. **The headings at the end of the output block**: needed so each reads as one section. The cost is that two back-references now point outside the section a non-content lesson is handed: «Saying the same thing three ways is the fault above» and «which is the same-shape fault above at the level of slides».
5. **PF-O03 and SJ-D81**: settled 7g («A pointer names its real section») covers both.

Added without his asking: the program's 13b pass, and the reviewer's «and the program cannot see whether they do, so judge that from the criteria beside the task». Both are the planner's proposal (plan section 4, «Proposed: ...»; risk 14), not put to him; see item 5 of "In short". Standing rulings: nothing reintroduces Stand If; no fixed count added; "repair first" is met as far as any validator rule meets it (section 3).

**The 13b wording.** New in PREF L643: «A short beat children can start from its question alone, and a task whose product this lesson has already shown them a good one of, need none of this. Success criteria on the board that already show what a good one looks like count as one seen, so the launch needs no second model.» The same «count as one seen» is in LD L243, LD L408 and REV L205. Read against E30, F19 and F34, where «an earlier beat of this lesson has already shown the class a good one» makes `launch` null, "one seen" invites a null launch. The program refuses a null launch whatever criteria the beat carries (`test_criteria_do_not_stand_in_for_a_launch_that_is_not_there`). His words (preferences decision 13, «13. Yeah, that's fine.» to «a writing task whose criteria already show a good paragraph skips a second model») skip only the second model. Suggested words: "success criteria on the board that already show what a good one looks like stand in for the good instance, so the launch keeps its case and steps and needs no second model". The pins and `test_13b_is_in_the_home_and_its_three_pointers_in_the_same_words` move with it.

## 3. New refusals, and the history lesson's pass

Probe (`scratch/rtchk1/probe_designs.py`: the check alone, `59f85708` against the branch, on every saved design):

- **Six newly refused**, all Year 4 maths skill lessons whose last Practise has `format: written-explanation` (or "a short spoken or written explanation") and `launch: null`, and whose turns show `exact` answers only. Examples: «Amira says, "3,448 rounds to 3,500 because the ones digit is 8." Is Amira right? Explain using the number line.»; «LXXXVIII or XCI?» with `reasoningWords: ["because"]`. These are the plan's six and his question 2 answer. None is a false refusal. «Compare these numbers» in a My Turn matches the explain pattern but does not count, because its answer is `exact`/`teacher-only`.
- **Where met, who repairs, can the run end without a lesson.** Met at the lesson designer's own validator passes in Phase 1, then the orchestrator's success check, then the focused repair, then one fresh designer attempt (`playbook-lite.md` L206 to L222). The lesson designer repairs it. A run ends `BLOCKED` with `design-decisions.md` and the diagnosis only if all three fail. That is the same floor as every validator rule: in principle yes, a run could end without its deck, though the fix (one good-beside-weak pair) is always open. A lesson already running when this is installed is re-checked at the adaptation picture step, which drops its Below and Greater Depth sheets on a refusal (7A's log), and at review. So install between lessons, as the report says. The two changed messages (7f, 7j) change words only, not what is refused. The 7e view change adds strings to the reviewer's view and its count line; it refuses nothing.
- **The loosening is wider than one lesson.** Old: `if isinstance(launch, dict) and launch.get("goodLooksLike") is not None: continue`. New: `if isinstance(launch, dict): if launch.get("goodLooksLike") is not None: continue / if unit.get("successCriteriaRefs"): continue`. `scratch/rtchk1/probe_bypass.py` gives three of the six refused maths lessons `launch: {"established": "We have learnt to round to the nearest hundred.", "goodLooksLike": null, "steps": []}` (`round-to-the-nearest-100`, `trial-c-round-10-secure`, `read-and-complete-number-lines`). Each then passes the check with no explanation shown anywhere, because each Practise carries `successCriteriaRefs: ["sc-001"]`, the rounding or number-line steps. The two that carry no criteria stay refused.
- **The history lesson** (`to-identify-the-continuities-and-changes-to-children-s-lives-using-a-range-of-sources (6)`) ends on «Write about one continuity and one change in children's lives ... Use details from both periods in each comparison.». Its launch is `{"established": "We've compared babies' play and children learning through work.", "goodLooksLike": null, "steps": [...]}`. Its only criteria are a table headed «Good comparisons show | Check» with rows «The same part of life», «Both periods», «Evidence», «Careful conclusions». No earlier beat reveals a model: both Do answers are `model`/`teacher-only`. That table tells a child what a good comparison has; it does not show one. His 13b is «a writing task whose criteria already show a good paragraph», and no criteria type (`steps`, `reference-table`, `labelled-reference`) can hold a paragraph. So for written explanations, the only work this check does, the pass is a door the program cannot see through. The validator's own docstring names that pattern: «The exemption the launch rule allowed, `a form they have made before`, was the door, because nothing could check it.» The reviewer's line («judge that from the criteria beside the task») carries no calibration saying a checklist is not a good one shown. This lesson is the leisure lesson's kind, the benchmark failure. His to decide; my suggestion is in "In short" item 5.
- Found in passing, not this release's: an earlier Do or Your Turn whose `model` or `standard` answer is revealed counts as the good one whatever it asked. Question 2's "the kind of thing children then write" was applied to My Turn and Our Turn only.

## 4. Cost: "about 12 KB more"

What: `How this teacher explains` (9,086 bytes through the bundled reader) and `The launch` (3,082). When: once per lesson, in the lesson designer only, on a route other than content-based. The first is read when the lesson has a skill `teach` or `prepare` in `explanation` mode, a task `teach-needed`, a discovery `teach-why` or a dialogic `grounding-input` that explains. The second is read for a task `do-task` or a skill `practise` (LD's new paragraph). On the 24 saved non-content designs (`probe_reads.py`):

| Saved non-content designs | Reads |
|---|---|
| 13 skill lessons | nothing new |
| 6 skill lessons | 3 KB (the launch) |
| 1 skill lesson | 9 KB (the explaining section) |
| 2 skill lessons, both task lessons | 12 KB (both) |

Needed on every such lesson? The explaining section is what his answer asks for. The launch is not needed for a task lesson yet: 11 of its 13 sentences are already in the task route's own output block (F33 to F40, "written out in full twice"). Only the first line (which F34 says in its own words) and «Only `show` makes a launch for a labelled diagram show two diagrams rather than a sentence about what a good label says.» are new to it. Until release 4 folds that copy, sending only a skill `practise` to `The launch` would save 3 KB on every task lesson and lose nothing. Inside the explaining section, «So the default is to write it, and the validator refuses `null`» is true of the content Teach's `explanation`. It is false for a task `teach-needed` `explanation`, which the task route makes «null only when the idea and its instance already carry the meaning» and the validator checks with `expect_nullable_string`. The plan estimated 4 KB; the builder moved exactly the paragraphs the plan named, so the difference is the plan's estimate.

## 5. Pins and replay

- **The pin file** holds what the report says: `ledgerIds` 592, equal to the row ids; 609 rows (506 unchanged in place, 66 changed and 20 moved = 86, 4 added records, 13 home records); no duplicates; 54 barred phrases, 51 barred everywhere. The three barred in their own file only are J35's old sentence and two code lines (Q16, Q27); code lines local is right, and J35 could be everywhere. One slip in the report: the explaining heading is pinned as 6 paragraphs (`HOME-RT-HOW-01` to `06`), not 5.
- **Earlier topics' pins** (`pinmoves.py`): 36 pins in 35 rows and three homes moved. Each new text is found in its file, and each outcome names the decision that moved it: QC-C08, E11, P01, D11 to D16; SA-E20, M08, PF-Q14; SJ-D81 and its home; SC-H03, H22, H29, H47, Q01; TD-A04, B07, C03, C19, D03, F13, I02, J03, J20, J56, L07, L09, L10, Z19 and its home; WS home 08. Assumed-knowledge pins need no move (AK-F13 pins no pointer text).
- **Replay** (`scratch/rtchk1/replay.py`): `git archive 59f85708` of the plugin and plans, the branch's `rt-change/` and `ledger_mapping.py` copied in, and `rt_run.py` ended `RUN_OK`. Every script printed a root inside the scratch tree. Result: 979 plugin files compared, none only on one side, none different; every `plans/2026-*` file identical. Every changed or new plugin file is identical in raw bytes, line endings included.
- **Undo attacks** (`scratch/rtchk1/attacks.py`, on the replay tree, which passed the 17 targeted test files untouched first: 347 passed, 1 skipped; each file restored byte for byte and re-compared). All 28 were caught:
  - skill exemption restored; every turn counts again; the 13b pass removed; 13b widened to a null launch; a Do the task's `activity` searched; an explaining turn counting without its answer shown;
  - `modelledOn` out of the view; a `prepare` explanation not child-facing (both also caught by the view test alone);
  - the reviewer's judgement clause thinned; discovery's takeaway-at-the-end dropped; the skill output line's brevity dropped; four-corners vote back; the designer's read line altered; the heading renamed; «not a template» dropped; the discovery exception dropped from the home; the voice guide's pointer removed;
  - the Look for example back to 26 words; the teeth story back in L31; F18's old trigger back; 13b out of the launch home; decision 2's second case out of `The launch`; the movement exception dropped; the skill Practise's pointer dropped; 13b out of the designer's rhythm line; 7a reverted; the activity list counting eight; 7j's message reverted.
- **`ledger_mapping.py`**: `next(generator)` became `next(generator, len(lines))`. For any heading with a later heading at its level, the result is identical. The only newly accepted case is a home at the end of its file, which used to raise `StopIteration`. So no earlier topic's run that succeeded can produce a different mapping or pins, and nothing catches `StopIteration`. `sj-change` uses its own copy. Trivial: `rt_07`'s docstring still says «which `ledger_mapping.home_paragraphs` does not allow».

## 6. The merge to come (base `59f85708`, main `91687471`, this branch)

A throwaway shared clone in `scratch/rtchk1/merge/clone`. The branch's 72 changed and new files were committed there on `59f85708` as `rt`, then `git merge rt` was run on `91687471`.

- **Conflicts:** the eight ledgers' closing sections, the build log, four pin files (quick checks 6 hunks, the rhythm 6, starters 2, success criteria 2), and `agents/design-reviewer.md` in **two** hunks. One is line 44. The other is lines 208 to 214, where the reviewer's J34 («The repair keeps the chunk and is the Lesson Designer's ...») and this release's J36 are neighbours. Clean: `design-review-packet.py`, `worksheets_ledger_pins.json`, everything else.
- **Resolved** as `rt_follow_at_merge.py` says. The log and ledgers keep both sides, the reviewer's first. The reviewer's file and the pin files take the reviewer's side in each conflicting hunk. The heading was numbered with a stand-in 4.2.295. `rt_follow_at_merge.py` then printed both put-backs (C11, J36) and `REPIN_OK`. It moved 11 of the reviewer's own pins (RV-C08, C10, C11, C13, E10, J18, J34, J36, J48, HOME-RV-BOUNDARY-07, HOME-RV-METHOD-26) and its two homes, rebuilt this topic's pins (`MAPPING_OK 609 pins`) and ended `FOLLOW_OK`.
- **Then:** Python suite 2,355 passed, 1 skipped (243,481 subtests); voice harness 21. The node suites were not run there (no `node_modules`); neither side changed an engine file.
- **Nothing lost or contradicted:**
  - The merged reviewer file is main's line for line except two lines. L44 changes only «`explanation`):» to «`How this teacher explains`):». L205 gains only 13b. So the reviewer's L44 keeps both story removals: «and the plugin approved a deck that failed it on 14 September 2026 (...)» stays out, and «A script line such as ... is that finding.» stays in.
  - Every file changed by one side only equals that side, except the reviewer's pin file (the 11 moves above).
  - A sentence-level check of every runtime and test file either side changed (`merge/sides.py`) finds nothing either side added missing and nothing either side removed back.
  - Two notes. L44 now points at the same place two ways: C10's «(`teaching-sequence-content-based.md` → `explanation`, part 3)», restored word for word by his reviewer answer, and C11's new heading. And each of the 11 moved RV pins carries the same three-change outcome even where one change applies (RV-E10's is only 7f).

## 7. The suites

`bash plans/streamline-tools/run-all-suites.sh rtchk1` from the worktree root, with the venv's `python3` first on `PATH` (6 min 26 s):

| Suite | Result |
|---|---|
| python | 2,334 passed, 1 skipped (230,237 subtests) |
| voice harness | 21 passed |
| builder | 772 pass, 0 fail |
| worksheet-html | 771 pass, 0 fail |
| stick-in-sheets-html | 73 pass, 0 fail |
| working-wall-html | 166 pass, 0 fail |
| shared | 126 pass, 0 fail |
| test | 46 pass, 0 fail |

The saved designs through the whole validator, before (`59f85708`) and after: 0 of 53 pass both times, and no design's result changes (`scratch/rtchk1/before-designs.json`, `after-designs.json`).

**Dashes** (`scratch/rtchk1/dashes.py`, every dash on an added line looked for at the base): none new. The dashes on edited lines were already there in the words round them: the activity list's contents and source lines, the dialogic Stimulus, and 2.5's «Best for» line. So were the pins, the mapping and the scripts that quote them.
