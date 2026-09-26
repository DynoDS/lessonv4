# Brief: build the routes release (topic 8, release 3) on a side branch

The teacher, Daniel, answered every decision on the routes and pedagogy references list on 24 September; his words are in `plans/2026-09-23-routes-ledger.md` ("Decisions taken", "His answers", and any closing sections later releases added). The change is planned in `plans/2026-09-24-topic-8-change-plan.md`, section 4 "Release 3: the routes, his decisions and the corrections", with sections 0, 1, 8 ("Where topic 8 meets the other releases"), 10, 11, 12 and 13. You build release 3 only: release 4 (one copy of each rule) is a later tidy, and 7B (the rest of preferences, words only) is not built yet, so where the plan hands a change to 7B or says "until 7B lands", build this release's part and name the rest in your report. One fresh agent checks your work on the branch, then a small look at the repairs; after the merge the combined plugin is tested again. Nothing is committed on the branch: the lead commits it at merge time.

## Where you work

- **Your copy:** the git worktree `C:\Users\Daniel\Projects\lessonv4-routes`, branch `streamline/8-routes`, made from `59f85708` (4.2.293). Edit only inside it. Its plugin is `plugins/lesson-v4`; its streamline tools are `plans/streamline-tools/` (the mapping helper and the suite runner work on the copy they sit in).
- **Beside you:** the design reviewer release is on another side branch (`C:\Users\Daniel\Projects\lessonv4-reviewer`, from 4.2.292) and merges into main before you. Read its report (`plans/streamline-tools/rv-release-report.md` in that worktree) so your change does not fight it, and list in your report every paragraph both releases touch (the plan's launch pointers in the reviewer file, RV-J36, are one).
- **The main checkout,** `C:\Users\Daniel\Projects\lessonv4`, is read only for you.
- **Libraries:** each node folder's `node_modules` in your copy is a link to the main checkout's. Never delete a `node_modules` folder, never run `git worktree remove`, and never run `npm install`.
- Every script you write finds its paths from its own location. Print the path before any script writes.

## Read first

1. `plans/streamline-plan.md`, whole: his goal, the rules for every topic, the method, "Pace and order from 25 September" and "What the rounds have taught".
2. The routes ledger's decisions and his answers, and the plan's section 4 with the sections named above, in his words.
3. As your model of depth: release 7A (`plans/streamline-tools/7a-change/`, `7a-release-report.md` and its five checks) and the colours release (`colours-change/`, its report and checks). The check reports show what each release missed; do not repeat it.
4. His standing rulings: repair first, a finished piece every time (no new refusal may cost a lesson, a deck, a sheet or a wall; a refusal is met where a designer can repair it, and the last step still delivers); "no overcomplications"; durable learning, not task completion; the random-slide test; never "Stand If"; no fixed count that makes every lesson the same.

## How

- Build exactly what the plan and his answers say; where they differ, his words win and the report says so. Move before you reword; keep his calibrating examples exactly; stories leave for the build log, reasons stay.
- Write the change as scripts in `plans/streamline-tools/rt-change/`, each old text asserted to appear exactly once, keeping each file's own line endings, so a checker can replay them on a clean `59f85708` copy.
- Map and pin with `plans/streamline-tools/ledger_mapping.py`, a pin file and a test through `scripts/tests/ledger_pin_checks.py`. Every finished topic's record builder is frozen; if you move an earlier topic's pin, write a repin script that finds each pin by its old words, as `colours-change/k8_repin_other_topics.py` does, so it replays on a merged tree.
- Any validator or engine change is built with tests; for each new refusal, show where in a real run it is met, who repairs it, and that a run still ends with the lesson delivered.
- **Do not bump the version** (the lead sets it at merge). Write your build-log entry at the end of `references/build-review-log.md`, in the style of the 26 September entry, headed without a version number.
- Prove it in your copy: `bash plans/streamline-tools/run-all-suites.sh rt-after` (every suite green); `python -X utf8 plans/streamline-tools/validate-saved-designs.py plugins/lesson-v4/scripts/validate-lesson-design.py plans/streamline-tools/rt-after-designs.json` compared with the same run before your change (every new refusal explained).
- Machine note: `python3` (the Microsoft Store alias) hangs on this computer and two tests call it by name. Put `C:\Users\Daniel\AppData\Local\Temp\claude\C--Users-Daniel-Projects-lessonv4\5661196e-1751-4711-8b0f-64aef26ec0c2\scratchpad\py3venv\Scripts` first on PATH for every test run.
- Run tests in the foreground. If you start anything in the background, keep working and check on it yourself; never go idle waiting for a notification. Make every undo attack in a scratch copy, never in your real files.
- No em or en dashes in anything you write. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks. Save as you go.

## Your report

Write `plans/streamline-tools/rt-release-report.md` in your copy: what you changed, decision by decision; pins moved and why; suites; saved designs; size before and after; the files you touched and every paragraph the reviewer release also touches (the merge needs this list); what you left for 7B or release 4; anything he should know, in plain words. Reply with a summary under 300 words.
