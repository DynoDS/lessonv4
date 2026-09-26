# Brief: build the voice guide release (topic 8, release 5) on a side branch

The teacher, Daniel, answered every decision on the teacher voice guide's list on 24 September; his words are in `plans/2026-09-23-teacher-voice-ledger.md` ("Decisions taken", "His answers", and closing sections later releases added). The change is planned in `plans/2026-09-24-topic-8-change-plan.md`, section 6 "Release 5: the voice guide", with sections 0, 1, 8 ("Where topic 8 meets the other releases"), 10, 11, 12 and 13. You build release 5 only. Release 6 (humour reaching the board) waits for his answer on the diagnosis `plans/streamline-tools/humour-diagnosis.md`; where the plan says release 5 carries part of a humour cause (the "never the reverse" copies brought to "normally", his "humour wherever" recorded, maths and PSHE included), build that part and nothing of release 6. One fresh agent checks your work, then a small look at the repairs; after the merge the combined plugin is tested again. Nothing is committed on the branch: the lead commits it at merge time.

## Where you work

- **Your copy:** the git worktree `C:\Users\Daniel\Projects\lessonv4-voice`, branch `streamline/8-voice`, made from `91687471` (4.2.294). Edit only inside it. Its plugin is `plugins/lesson-v4`; its streamline tools are `plans/streamline-tools/`.
- **Beside you:** the routes release (topic 8, release 3) is being built on another side branch (`C:\Users\Daniel\Projects\lessonv4-routes`, from 4.2.293) and will merge first. Read the plan's section 8 for where the two meet, and list in your report every paragraph both releases touch.
- **The main checkout,** `C:\Users\Daniel\Projects\lessonv4`, is read only for you.
- **His model lesson.** He named the speaker notes of his week 3 science lesson as the wording to study: "there's a good example in week three science ... that kind of wording and phrasing and whatever might be something that's good for you to look at". A copy of that deck is `plans/streamline-tools/scratch/vgb/week3-science-tooth-decay.pptx` in your copy (it is "Explain how a tooth decays", taught on 23 September, which he may have edited by hand). Read its slides and speaker notes with python-pptx, study how the notes talk to children (length, rhythm, how they link, how they sound), and let what you find calibrate the guide's speaker-notes teaching as his answers ask: notes as long as the idea needs, conversational, talking to children, thinking "how can I talk to children to get them to understand it". Quote his lines from it exactly where you use them as examples, and never copy the original into the plugin repository (a quoted line or two is fine; the deck is not).
- **Libraries:** each node folder's `node_modules` in your copy is a link to the main checkout's. Never delete a `node_modules` folder, never run `git worktree remove`, and never run `npm install`.
- Every script you write finds its paths from its own location. Print the path before any script writes.

## Read first

1. `plans/streamline-plan.md`, whole: his goal, the rules for every topic, the method, the pace section and "What the rounds have taught".
2. The voice ledger's decisions and his answers, the plan's section 6 with the sections named above, and the humour diagnosis's causes 1 and 3 for the parts release 5 carries.
3. As your model of depth: the reviewer release (commit `91687471`: `plans/streamline-tools/rv-change/`, `rv-release-report.md` and its checks) and 7A (`7a-change/`, its report and checks).
4. His standing rulings: repair first, a finished piece every time; "no overcomplications"; no em or en dashes in anything a child or parent reads, and his voice rule carried into any file he owns that authors such text; the random-slide test (the board shows the teaching, because notes mostly go unread); "Teaching lives on the slide and in the notes": slide and script are the same teaching in two registers.

## How

- Build exactly what the plan and his answers say; where they differ, his words win and the report says so. Move before you reword; keep his calibrating examples exactly; stories leave for the build log, reasons stay.
- Write the change as scripts in `plans/streamline-tools/vg-change/`, each old text asserted to appear exactly once, keeping each file's own line endings, so a checker can replay them on a clean `91687471` copy.
- Map and pin with `plans/streamline-tools/ledger_mapping.py`, a pin file and a test through `scripts/tests/ledger_pin_checks.py`. Every finished topic's record builder is frozen; if you move an earlier topic's pin, write a repin script that finds each pin by its old words, so it replays on a merged tree.
- **Do not bump the version.** Write your build-log entry at the end of `references/build-review-log.md`, in the style of the 26 September entries, headed without a version number.
- Prove it in your copy: `bash plans/streamline-tools/run-all-suites.sh vg-after` (every suite green, the voice harness included); `python -X utf8 plans/streamline-tools/validate-saved-designs.py plugins/lesson-v4/scripts/validate-lesson-design.py plans/streamline-tools/vg-after-designs.json` compared with the same run before your change.
- Machine note: `python3` (the Microsoft Store alias) hangs on this computer and two tests call it by name. Put `C:\Users\Daniel\AppData\Local\Temp\claude\C--Users-Daniel-Projects-lessonv4\5661196e-1751-4711-8b0f-64aef26ec0c2\scratchpad\py3venv\Scripts` first on PATH for every test run.
- Run tests in the foreground; never go idle waiting for a notification. Make every undo attack in a scratch copy, never in your real files.
- No em or en dashes in anything you write. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks. Save as you go.

## Your report

Write `plans/streamline-tools/vg-release-report.md` in your copy: what you changed, decision by decision; what his week 3 notes taught and where it went; pins moved and why; suites; saved designs; size before and after; the files you touched and every paragraph the routes release also touches; what you left for release 6; anything he should know, in plain words. Reply with a summary under 300 words.
