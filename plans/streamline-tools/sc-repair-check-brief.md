# Brief: independent check of the repairs to the success-criteria change (4.2.288)

You are the second fresh reader. A first independent check read the success-criteria change and wrote `plans/streamline-tools/success-criteria-change-check.md`. The repairs it asked for have since been made. Your job: check the repairs are right and complete, that they broke nothing, and that the whole change now stands. The teacher's condition: "A shorter file that loses a rule is a failure however clean it reads." You did not write any of it.

## Where to look

- Everything in `sc-change-check-brief.md` (beside this file) still applies: the plugin, the old text at HEAD (`git diff HEAD -- plugins/lesson-v4` from `C:\Users\Daniel\Projects\lessonv4`), the ledger `plans/2026-09-23-success-criteria-ledger.md` and its `Decisions taken` and `Read back, and settled`, the mapping, the pins, the change plan.
- The first check's report, and its closing list "What I would fix before release".
- The repair scripts in `plans/streamline-tools/sc-change/`: `r1_check_repairs_wording.py` to `r9_record_sheet_beside_board.py`, and the updated `build_sc_mapping.py`. `r8` was applied and then corrected by hand (its docstring says how); judge the files, not the script.
- **What was settled with the teacher after the first check.** Decision 8 is "no success criteria on worksheets", in his words: the first check found it had been widened to every method's steps, and it was narrowed back to success criteria only. His answer to 13 ("There should be a way to make it fit. We might need to do another investigation") led to a separate investigation, `plans/2026-09-23-long-criteria-fit-investigation.md`, whose fixes he agreed and which are the NEXT release, not this one; only its wrong-pointing messages (the capacity warning, the 18 to 19pt warning, the panel refusal) went in with these repairs. The first check's 1d (a list that fits nowhere ends as a flagged slide) is left to that release. Its 2c (a sheet used away from the board) is being put to him and is not yet answered, so a missing line for it is not a finding.

## What to check

1. **Each item of the first check's fix list**: done, done differently (and is the difference sound), or not done. Quote old and new.
2. **The repairs' own words**: anything lost, softened, widened or newly contradicted by them. In particular: decision 6 in the task-centred and content routes (the criteria as what a stuck child uses) against the rest of each route file, the stem banks and feature lists included; the narrowing of decision 8 back to criteria only, and whether anything now calls a method frame or a worked step list on a sheet wrong; the restored sheet-fit check; the second-sentence and question cues against decisions 9 and 15; "exact same steps or reference"; the wall's two-card condition and "picture off unless the steps refer to it" against the rule that the wall card keeps the diagram the support needs.
3. **The code repairs**: the worksheet designer's own preflight reporting the refusal (`checkWorksheet`), the scaffold's empty worksheet criteria, the new validator and node tests, the wall build's messages, the capacity and steps messages, and the review page's worksheet heading. Build review views and worksheets from saved designs (under `C:\Users\Daniel\Projects\lessonv4`, excluding `node_modules`) with HEAD's code and now: anything lost, noise added, crashes.
4. **The pins after the repairs**, attacked again on a scratch copy of the WHOLE plugin folder (everything except `node_modules`, the ledgers beside it; run the pin tests once on the untouched copy first). Repeat the first check's experiments that were caught by nothing and are now claimed to be (the short forms "fewer criteria", "just-taught", "under the steps as a note", "Same digits? Move right." and old rule 13's heading, brought back in new places; retired wordings brought back into the JavaScript programs; the capacity warning's "a cue to look"; the wall's message), and try the repairs' own new sentences: delete, soften and move them.
5. **The full suites**: from the plugin folder `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider`, and `node --test` in `worksheet-html`, `builder` (`node --test "test/*.test.js"`) and `working-wall-html`.
6. **Honesty**: the 4.2.288 build-log entry (end of `references/build-review-log.md`), now carrying a "second reader" bullet and a revised "Not done yet", against the files; the mapping; the earlier topics' pin outcomes. Any new em or en dash in plugin prose.

## Limits

Change nothing in the repository, and never run a script from the repository that writes files (run the mapping builder only on your scratch copy, and check its paths before you do). A different sound wording is not a finding. Put scratch copies only in `plans/streamline-tools/scratch/screp/`, and never clear or reuse any other folder there: other agents work in the same area.

## Your report

Write it to `plans/streamline-tools/success-criteria-repair-check.md`: what you did, numbered findings most serious first with quoted text, one line per thing checked and found sound, and a closing list of what you would still fix before release. Reply with a summary of no more than fifteen lines.
