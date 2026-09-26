# Brief: build the design reviewer release (topic 8, release 2) on a side branch

The teacher, Daniel, answered every decision on the design reviewer's list on 24 September; his words are in `plans/2026-09-23-design-reviewer-ledger.md` ("Decisions taken", "His answers", and the closing section the subject-files release added). The change is planned in `plans/2026-09-24-topic-8-change-plan.md`, section 3 "Release 2: the design reviewer", with sections 0, 1, 8 ("Where topic 8 meets the other releases"), 10, 11, 12 and 13. You build release 2 only. Two fresh agents will check it on the branch, and after the merge the combined plugin is tested again. Nothing is committed on the branch: the lead commits it at merge time.

## Where you work

- **Your copy:** the git worktree `C:\Users\Daniel\Projects\lessonv4-reviewer`, branch `streamline/8-reviewer`, made from `b1c2d427` (4.2.292). Edit only inside it. Its plugin is `plugins/lesson-v4`; its streamline tools are `plans/streamline-tools/` (the mapping helper and the suite runner work on the copy they sit in). The ledgers and plans are committed, so your copy has them.
- **The main checkout,** `C:\Users\Daniel\Projects\lessonv4`, is read only for you. Its working tree holds release 7A (4.2.293, not yet committed), which will be committed and merged before yours. 7A touches the design reviewer too (its section 3 test-question line, "honest and visible", and pins on the reviewer's paragraphs); do not rely on it, but read its report (`plans/streamline-tools/7a-release-report.md` in the main checkout) so your change does not fight it, and list in your report every reviewer paragraph both releases touch.
- **Libraries:** each node folder's `node_modules` in your copy is a link to the main checkout's. Never delete a `node_modules` folder, never run `git worktree remove`, and never run `npm install`.
- Every script you write finds its paths from its own location. Print the path before any script writes.

## Read first

1. `plans/streamline-plan.md`, whole: his goal, the rules for every topic, the method, "Pace and order from 25 September" and "What the rounds have taught".
2. The reviewer ledger's decisions and his answers, and the plan's section 3 with the sections named above, in his words. Among them: the reviewer fixes small things itself (words that are not right and better words exist), with the same understanding as the lesson designer; "Obviously, you don't want a busy slide. Maybe that was just a rough guidance" (no number that makes every slide the same); judge the board first, the speaker notes separately.
3. As your model of depth: the worksheets release (`plans/streamline-tools/ws-change/`, `ws-release-report.md` and its three checks) and the colours release (`colours-change/`, its report and four checks). The check reports show what each release missed; do not repeat it.
4. His standing rulings: repair first, a flag a last resort that still leaves a finished piece; "one reviewer, no caps, no room theory"; "no overcomplications"; the random-slide test (any slide shows what it does and why, or one or two back do; the board shows the teaching because notes mostly go unread).

## How

- Build exactly what the plan and his answers say; where they differ, his words win and the report says so. Move before you reword; keep his calibrating examples exactly; stories leave for the build log, reasons stay.
- Write the change as scripts in `plans/streamline-tools/rv-change/`, each old text asserted to appear exactly once, keeping each file's own line endings, so a checker can replay them on a clean `b1c2d427` copy.
- Map and pin with `plans/streamline-tools/ledger_mapping.py`, a pin file and a test through `scripts/tests/ledger_pin_checks.py`. Every finished topic's record builder is frozen; if you move an earlier topic's pin, write a repin script for it, as `colours-change/k8_repin_other_topics.py` does, finding each pin by its old words so it replays on a merged tree.
- **Do not bump the version** (the lead sets it at merge). Write your build-log entry at the end of `references/build-review-log.md`, in the style of the 25 September entries, headed without a version number.
- Prove it in your copy: `bash plans/streamline-tools/run-all-suites.sh rv-after` (every suite green); `python -X utf8 plans/streamline-tools/validate-saved-designs.py plugins/lesson-v4/scripts/validate-lesson-design.py plans/streamline-tools/rv-after-designs.json` compared with the same run before your change; and, if the review page changes, the review packet built for two or three saved designs before and after.
- Machine note: `python3` (the Microsoft Store alias) hangs on this computer and two tests call it by name. Put `C:\Users\Daniel\AppData\Local\Temp\claude\C--Users-Daniel-Projects-lessonv4\5661196e-1751-4711-8b0f-64aef26ec0c2\scratchpad\py3venv\Scripts` first on PATH for every test run.
- Run tests in the foreground. If you start anything in the background, keep working and check on it yourself; never go idle waiting for a notification.
- No em or en dashes in anything you write. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks. Save as you go.

## Your report

Write `plans/streamline-tools/rv-release-report.md` in your copy: what you changed, decision by decision; pins moved and why; suites; saved designs; size before and after; the files you touched and every paragraph 7A also touches (the merge needs this list); anything he should know, in plain words. Reply with a summary under 300 words.
