# Brief: a third, narrow check of the success-criteria repairs (4.2.288)

You are a fresh reader. Two independent checks have read the success-criteria change: `success-criteria-change-check.md` (the first) and `success-criteria-repair-check.md` (the second, of the first round of repairs). A second round of repairs answered the second check. Your job is only that second round: are its repairs right, complete and faithful to the teacher's decisions, and did they break anything? The teacher's condition: "A shorter file that loses a rule is a failure however clean it reads." You did not write any of it.

## Where to look

- The plugin: `C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4`; the old text is HEAD (`git diff HEAD -- plugins/lesson-v4` from `C:\Users\Daniel\Projects\lessonv4`). The repository root holds about 50 MB of untracked built lessons; ignore them.
- The second check's report, its findings 1 to 11 and "What I would still fix before release".
- The repair scripts `plans/streamline-tools/sc-change/r11_engine_after_second_check.py` to `r18_log_after_second_check.py` (with `r11b`, `r11c`). Some were corrected by hand after they ran, and each says how in its docstring or closing comment; judge the files, not the scripts.
- The teacher's decisions: `plans/2026-09-23-success-criteria-ledger.md`, its "Decisions taken", "Read back, and settled" and "After the first change check"; and the long-list investigation's "Decisions taken" (`plans/2026-09-23-long-criteria-fit-investigation.md`), which is the next release, not this one.

## What to check

1. **Each of the second check's eleven findings:** done, done differently (and is the difference sound), or not done. Quote old and new.
2. **The engine repairs** (findings 1 and 2): the list refusal's new words against decision 8 ("no success criteria on worksheets") and against the worksheets topic's open decision 10 (whether a method's steps belong on a sheet), which this release must neither widen nor settle; the new early check for a panel on an "auto" sheet in the preflight and the build. Run the preflight (`worksheet-html/scripts/check-worksheet.js`, which writes nothing) over every saved `worksheet.json` under the repository (excluding `node_modules`) with HEAD's engine and now, and build a few into scratch: signals lost, new noise, crashes, a sheet omitted or wrongly measured. Look hard at the code that takes panels off before measuring: can it leave an empty row, stack or zone, change anything but the panels, or touch a sheet with a named layout?
3. **The wording repairs** (findings 3, 4, 5, 7, 9, 10, 11): anything lost, softened, widened or newly contradicted. In particular: does "unless the steps need it" keep the wall's diagram rule and lose nothing of "refer to it"; is the two-card exception written where it cannot be read as permission for a second card for anything else; does the halfway example's new reason agree with the voice guide's rule on occasional cases and with decision 2; does the 18 to 19pt warning now match his "widen only as far as 18pt needs".
4. **The review page's new heading** (finding 8), over all saved `lesson-design.json` files: crashes, and whether it names the right beats.
5. **The pins and tests after this round**, attacked on a scratch copy of the WHOLE plugin folder (everything except `node_modules`, the ledgers beside it; run the pin tests on the untouched copy first and confirm they pass). Repeat the second check's attempts that were caught by nothing and are now claimed to be (its Q02, Q03, Q05, Q06, Q08, Q09, Q10, Q12, P10, P10b, P14b, V01, V02, F03), and delete, soften and move this round's new sentences. Also check the vocabulary test's new reach: a retired vocabulary rule wording in a program is caught, and a retired story in a program comment is allowed.
6. **The suites:** from the plugin folder `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider`, and `node --test` in `worksheet-html`, `builder` (`node --test "test/*.test.js"`) and `working-wall-html`.
7. **Honesty:** the 4.2.288 build-log entry's new and changed sentences, including its size figures (measure them), against the files; any new em or en dash in plugin prose.

## Limits

Change nothing in the repository except writing your report, and never run a repository script that writes files (the mapping builder only on your scratch copy, with its paths pointed there). A different sound wording is not a finding. Scratch work only in `plans/streamline-tools/scratch/sc3/`; never clear or reuse any other folder there, as other agents work in the same area.

## Your report

Write it to `plans/streamline-tools/success-criteria-third-check.md`: what you did, numbered findings most serious first with quoted text, one line per thing checked and found sound, and a closing list of what you would still fix before release. Reply with a summary of no more than fifteen lines.
