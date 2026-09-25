# Brief: build a release on a side branch

The teacher, Daniel, agreed on 25 September to build two releases on side branches, alongside the main line, and merge them afterwards. You build one of them. Two fresh agents will check it on the branch, and after the merge the combined plugin is tested again. Nothing is committed on the branch: the lead commits it at merge time, on his word.

## Where you work

- **Your copy:** a git worktree on its own branch, named in your spawn message, made from commit `2db3ceba` (4.2.289). Edit only inside it. Its plugin is `<your copy>/plugins/lesson-v4`; its streamline tools are `<your copy>/plans/streamline-tools/` (the mapping helper and the suite runner there work on the copy they sit in).
- **The main checkout,** `C:\Users\Daniel\Projects\lessonv4`, is read only for you. Its working tree holds the worksheets release (4.2.290, not yet committed), which will be committed and merged before yours; your branch does not have it, so do not rely on anything in it. Read your ledger, your change plan and the answered decisions from the main checkout's `plans/` folder (they are not on your branch): `C:\Users\Daniel\Projects\lessonv4\plans\...`.
- **Libraries:** each node folder's `node_modules` in your copy is a link to the main checkout's. Never delete a `node_modules` folder, never run `git worktree remove`, and never run `npm install`: deleting through the link would delete the main checkout's libraries.
- Every script you write finds its paths from its own location, never from the main checkout's path. Print the path before any script writes.

## Read first (from the main checkout)

1. `plans/streamline-plan.md`, whole: his goal, the rules for every topic, the method, "Pace and order from 25 September" (two checks per release) and "What the rounds have taught" (the fault kinds past checks found; avoid them).
2. Your topic's ledger and change plan, and every answer of his they record, in his words.
3. As a model of depth: the fit release (commit `2db3ceba`: `plans/streamline-tools/fit-change/` and `fit-release-report.md` are on your branch) and the worksheets release's approach (`plans/streamline-tools/ws-change/` and `ws-release-report.md` in the main checkout).

## How

- Build exactly what the plan and his answers say; where they differ, his words win and the report says so. Move before you reword; keep his calibrating examples exactly; stories leave for the build log, reasons stay.
- Write the change as scripts in your copy's `plans/streamline-tools/<prefix>-change/`, each old text asserted to appear exactly once, keeping Windows line endings, so a checker can replay them on a clean `2db3ceba` copy.
- Map and pin your rows with `plans/streamline-tools/ledger_mapping.py` (in your copy), with a pin file and a test through `scripts/tests/ledger_pin_checks.py`. Every finished topic's record builder is frozen; if you move an earlier topic's pin, write a repin script for it, as `ws-change/w9_repin_other_topics.py` in the main checkout does.
- **Do not bump the version** (the lead sets it at merge). Write your build-log entry at the end of `references/build-review-log.md`, in the style of the 4.2.288 and 4.2.289 entries, headed without a version number; the lead numbers it at merge.
- Prove it in your copy: `bash plans/streamline-tools/run-all-suites.sh <prefix>-after` (every suite green); `python -X utf8 plans/streamline-tools/validate-saved-designs.py plugins/lesson-v4/scripts/validate-lesson-design.py plans/streamline-tools/<prefix>-after-designs.json` (it reads the saved designs from the main checkout; compare with a run of the same command before your change); and, where your release changes what is drawn, rendered pages for him to see.
- No em or en dashes in anything you write. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks. Save as you go.

## Your report

Write `<your copy>/plans/streamline-tools/<prefix>-release-report.md`: what you changed, decision by decision; pins moved and why; suites; saved designs; renders if any; size before and after; which files you touched (the merge needs this list); anything he should know. Reply with a summary under 300 words.
