# Brief: build release 7A, how a lesson opens and closes (4.2.293)

The teacher, Daniel, answered every decision on the starters, sticky knowledge and Apply list and on the rest of preferences on 24 and 25 September; his words are in `plans/2026-09-23-starters-sticky-apply-ledger.md` and `plans/2026-09-23-preferences-rest-ledger.md` (their "Decisions taken" and "His answers" sections, and the closing sections later releases added). The change is planned in `plans/2026-09-24-topic-7-change-plan.md`, section "Release 7A" (A1 to A14), with "In one screen", "Before any release", "Where his answers meet the other lists", "Order of work" and "Risks". You build 7A only: 7B (the rest of preferences, words only) is a later release, and 7C (colours) is already committed. Two fresh agents will check your work afterwards, so make every choice easy to check. Nothing is committed or pushed; he decides that.

## Where things stand

Main is at `b1c2d427` (4.2.292). Since the plan was written, three releases landed on top of it: worksheets (4.2.290, `74e66166`), subject files (4.2.291, `2d1b5068`) and colours (4.2.292, `b1c2d427`). The plan's line numbers and some quoted words may have moved; find every old text by its words, and where a later release changed words the plan quotes, the committed words are the starting point and the report says so. In particular: colours asks 7A to pin its four `SA-` rows as `COLOURS_ROWS` in `plans/streamline-tools/colours-change/build_colours_mapping.py` leaves them; the worksheets release listed words other releases also change (its report's last section); the subject-files release recorded rows in five ledgers in closing sections.

## Read first

1. `plans/streamline-plan.md`, whole: his goal in his words, the rules for every topic, the method (steps 5 to 8 are yours), "Pace and order from 25 September" and "What the rounds have taught".
2. Both ledgers' decisions and answers, and the change plan's 7A section, whole, with the sections named above.
3. As your model of depth: the worksheets release (`plans/streamline-tools/ws-change/`, `ws-release-report.md` and its three checks) and the colours release (`colours-change/`, its report and four checks). The check reports show what each release missed; do not repeat it.
4. His standing rulings that bear on this release: the test-question starter is removed as if it never existed and is not rebuilt unless he asks by name; there is no fixed place for a sticky fact on a slide; the Lesson 2 plan goes (the designer already knows how much fits a lesson); repair first, and a last resort still leaves a finished piece; "no overcomplications".

## What to build

Exactly what the plan's 7A says, item by item, with his words as the standard. Where the plan and his words differ, his words win and the report says so. Move before you reword; keep his calibrating examples exactly; stories leave for the build log, reasons stay. Any engine or validator work the plan names is built with tests.

## How

- Write the change as scripts in `plans/streamline-tools/7a-change/`, each old text asserted to appear exactly once, keeping each file's own line endings, so the checkers can replay them on a clean `b1c2d427` copy.
- Map and pin, as the last releases did: a mapping builder in `7a-change/` that uses `plans/streamline-tools/ledger_mapping.py`, a pin file and a test through `scripts/tests/ledger_pin_checks.py`; every changed row mapped with the decision that changed it; retired wordings barred everywhere (instructions and programs); the homes pinned paragraph by paragraph. Every earlier topic's record builder is frozen: where your change moves another topic's pinned words, move that pin in place with a repin script, as `ws-change/w9_repin_other_topics.py` and `colours-change/k8_repin_other_topics.py` do.
- Bump both `plugin.json` files to 4.2.293 and write the build-log entry at the end of `references/build-review-log.md` in the style of the three 25 September entries: what changed and why, what is checked, what is pinned, size honestly, "Not done yet".
- Prove it: `bash plans/streamline-tools/run-all-suites.sh 7a-after` from the repository root (every suite green); `python -X utf8 plans/streamline-tools/validate-saved-designs.py plugins/lesson-v4/scripts/validate-lesson-design.py plans/streamline-tools/7a-after-designs.json` compared with the same run before your change (every new refusal explained); and, if what is drawn changes, rendered pages for him.
- Machine note: `python3` (the Microsoft Store alias) hangs on this computer and two tests call it by name. Put `C:\Users\Daniel\AppData\Local\Temp\claude\C--Users-Daniel-Projects-lessonv4\5661196e-1751-4711-8b0f-64aef26ec0c2\scratchpad\py3venv\Scripts` first on PATH for every test run.
- Run tests in the foreground. If you start anything in the background, keep working and check on it yourself; never go idle waiting for a notification, because it may not come.

## Limits

Edit only `plugins/lesson-v4` and your own files under `plans/streamline-tools/7a-change/` and `plans/streamline-tools/scratch/7ab/`; you may add closing notes to the two ledgers if the plan asks for them. Never clear any other scratch folder. Do not touch the worktrees `lessonv4-colours` or `lessonv4-subjects`. Commit nothing. No em or en dashes in anything you write. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks. Save as you go, so a stopped run loses little.

## Your report

Write `plans/streamline-tools/7a-release-report.md`: what you changed, item by item; every pin you moved and why; the suites; the saved designs; size before and after; anything he should know, in plain words. Reply with a summary under 300 words.
