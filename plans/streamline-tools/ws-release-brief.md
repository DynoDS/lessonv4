# Brief: build the worksheets release (4.2.290)

The teacher, Daniel, answered every worksheets decision on 23 and 24 September; his words are in `plans/2026-09-23-worksheets-ledger.md` ("Decisions taken", "His answers, 24 September (morning)" and the note on settled item 16). The change is planned in `plans/2026-09-24-worksheets-change-plan.md`. You build it. Two fresh agents will check it afterwards, so make every choice easy to check. Nothing is committed or pushed; he decides that.

## Read first

1. `plans/streamline-plan.md`, whole: his goal in his words, the rules for every topic, the method (steps 5 to 8 are yours), and "What the rounds have taught".
2. The ledger, whole, and the change plan, whole.
3. The last two releases as your model of depth: 4.2.288 (success criteria, commit `baabb1b3`: its scripts in `plans/streamline-tools/sc-change/`, its mapping builder `sc-change/build_sc_mapping.py`, its pin test and its four check reports `plans/streamline-tools/success-criteria-*check.md`) and 4.2.289 (the fit release, commit `2db3ceba`: `plans/streamline-tools/fit-change/`, its report and its six checks). The check reports show what each release missed; do not repeat it.
4. His standing rulings that bear on this release: worksheets are done in class ("worksheets are not homework, worksheets are delivered in class all the time"); repair first, and a last resort still leaves a finished piece ("i hardly want things broken so then the agents just go oh well let's just report it ... it should still try to fix it try to repair it"); a fix that changes what children read is the lesson designer's, with the reviewer naming it.

## What to build

Exactly what the change plan says, decision by decision, with his words as the standard. Where the plan and his words differ, his words win and the report says so. Move before you reword; keep his calibrating examples exactly (the partitioning sheets he approved, his column rulings, the Classroom Secrets endings, his digit-box ruling). Stories leave for the build log, reasons stay. The engine work the plan names (decisions 5 and 8) is built with tests.

## How

- Write the change as scripts in `plans/streamline-tools/ws-change/`, each old text asserted to appear exactly once, keeping Windows line endings where the file has them, so the checkers can replay them on a clean 4.2.289 copy.
- Map and pin, as 4.2.288 did: a mapping builder in `ws-change/` that uses `plans/streamline-tools/ledger_mapping.py`, a pin file `plugins/lesson-v4/scripts/tests/worksheets_ledger_pins.json` and a test `test_worksheets_ledger_is_kept.py` through `scripts/tests/ledger_pin_checks.py`; every changed row mapped with the decision that changed it; retired wordings barred; the homes pinned paragraph by paragraph. Where the change moves another topic's pinned words, move that pin with its reason.
- Bump both `plugin.json` files to 4.2.290 and write the build-log entry at the end of `references/build-review-log.md` in the style of the 4.2.288 and 4.2.289 entries: what changed and why, what is checked, what is pinned, size honestly, "Not done yet".
- Prove it: `bash plans/streamline-tools/run-all-suites.sh ws-after` from the repository root (every suite green); `python -X utf8 plans/streamline-tools/validate-saved-designs.py plugins/lesson-v4/scripts/validate-lesson-design.py plans/streamline-tools/ws-after-designs.json` compared with the 4.2.289 results (every new refusal explained); and the saved worksheets through the preflight (`worksheet-html/scripts/check-worksheet.js`) at 4.2.289 and now.

## Limits

Edit only `plugins/lesson-v4` and your own files under `plans/streamline-tools/ws-change/` and `plans/streamline-tools/scratch/wsb/`. Never clear any other scratch folder. Commit nothing. No em or en dashes in anything you write. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks. Save as you go, so a stopped run loses little.

## Your report

Write `plans/streamline-tools/ws-release-report.md`: what you changed, decision by decision; every pin you moved and why; the suites; the saved designs and sheets; size before and after; anything he should know. Reply with a summary under 300 words.
