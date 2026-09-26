# Brief: build playbook release 10A (topic 10) on a side branch

The teacher, Daniel, answered every decision on the make-lesson playbook's list on 24 September; his words are in `plans/2026-09-23-playbook-ledger.md` ("Decisions taken", "His answers", and closing sections later releases added). The change is planned in `plans/2026-09-24-topic-10-change-plan.md`: sections 1 and 2 ("Release 10A: his decisions" and "the settled items a to m"), with "In one screen", 0, 3 ("The room, measured"), 6 to 10, 12, 13, and the closing section "Carried from the worksheets release (4.2.290, 25 September)", whose words 10A must write. You build 10A only: 10B (the four run faults) and 10C (the wall and stick-in pack ship flagged) are later releases on top of yours. One fresh agent checks your work, then a small look at the repairs; after the merge the combined plugin is tested again. Nothing is committed on the branch: the lead commits it at merge time.

## Where you work

- **Your copy:** the git worktree `C:\Users\Daniel\Projects\lessonv4-playbook`, branch `streamline/10a-playbook`, made from `8af6f8a9` (4.2.295). Edit only inside it. Its plugin is `plugins/lesson-v4`; the playbook is `skills/make-lesson/playbook-lite.md`; its streamline tools are `plans/streamline-tools/`.
- **Beside you:** the voice guide release is on another side branch (`C:\Users\Daniel\Projects\lessonv4-voice`) and will merge before or after you; the humour release follows it. Neither is planned to touch the playbook, but list in your report every file you touch so the merge can be checked.
- **The main checkout,** `C:\Users\Daniel\Projects\lessonv4`, is read only for you. Codex installs the plugin from it, so never write there.
- **Libraries:** each node folder's `node_modules` in your copy is a link to the main checkout's. Never delete a `node_modules` folder, never run `git worktree remove`, and never run `npm install`.
- Every script you write finds its paths from its own location. Print the path before any script writes.

## Read first

1. `plans/streamline-plan.md`, whole: his goal, the rules for every topic, the method, the pace section, "Checks, commits and the smaller model" and "What the rounds have taught". The topic table's row 10 carries items for 10B that are not yours; leave them.
2. The playbook ledger's decisions and his answers, and the plan's sections named above, in his words. The playbook sits at its byte cap: section 3 measures the room, and the plan says what makes room. Keep the cap unless the plan or his words say otherwise; if his words cannot fit, stop and tell the lead rather than raising a cap on your own.
3. As your model of depth: the routes release (commit `8af6f8a9`: `plans/streamline-tools/rt-change/`, `rt-release-report.md` and its checks) and 7A (`7a-change/`, its report and checks). The check reports show what each release missed; do not repeat it.
4. His standing rulings: repair first, a finished piece every time ("i hardly want things broken so then the agents just go oh well let's just report it ... it should still try to fix it try to repair it"); a flag is a last resort that still leaves a finished piece; "no overcomplications"; the Drive gets teaching resources only; the build log takes engine faults only.

## How

- Build exactly what the plan and his answers say; where they differ, his words win and the report says so. Move before you reword; keep his calibrating examples exactly; stories leave for the build log, reasons stay.
- Write the change as scripts in `plans/streamline-tools/pb-change/`, each old text asserted to appear exactly once, keeping each file's own line endings, so a checker can replay them on a clean `8af6f8a9` copy.
- Map and pin with `plans/streamline-tools/ledger_mapping.py`, a pin file and a test through `scripts/tests/ledger_pin_checks.py`. Every finished topic's record builder is frozen; if you move an earlier topic's pin, write a repin script that finds each pin by its old words, so it replays on a merged tree.
- Any script or engine change is built with tests; for each new refusal or gate, show where in a real run it is met, who repairs it, and that the run still ends with the lesson delivered.
- **Do not bump the version.** Write your build-log entry at the end of `references/build-review-log.md`, in the style of the 26 September entries, headed without a version number.
- Prove it in your copy: `bash plans/streamline-tools/run-all-suites.sh pb-after` (every suite green); `python -X utf8 plans/streamline-tools/validate-saved-designs.py plugins/lesson-v4/scripts/validate-lesson-design.py plans/streamline-tools/pb-after-designs.json` compared with the same run before your change.
- Machine note: `python3` (the Microsoft Store alias) hangs on this computer and two tests call it by name. Put `C:\Users\Daniel\AppData\Local\Temp\claude\C--Users-Daniel-Projects-lessonv4\5661196e-1751-4711-8b0f-64aef26ec0c2\scratchpad\py3venv\Scripts` first on PATH for every test run.
- Run tests in the foreground; never go idle waiting for a notification. Make every undo attack in a scratch copy, never in your real files.
- No em or en dashes in anything you write. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks. Save as you go.

## Your report

Write `plans/streamline-tools/pb-release-report.md` in your copy: what you changed, decision by decision and item by item; the worksheets release's carried words and where each went; the playbook's size against its cap before and after; pins moved and why; suites; saved designs; the files you touched; what you left for 10B and 10C; anything he should know, in plain words. Reply with a summary under 300 words.
