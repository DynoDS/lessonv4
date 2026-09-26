# Streamline handover (26 September 2026, afternoon)

Read this first, then `plans/streamline-plan.md` (the method, his rules, "What the rounds have taught"). This file says exactly where the work stopped and how to carry on, whether in Claude Code or in Codex.

## Where it stands

- **Committed on main, not pushed:** 4.2.287 to 4.2.295. The last is `8af6f8a9` (routes). Main's working tree is clean apart from two ignored comparison files (`plans/streamline-tools/ws-after-sheets.json`, `ws-before-sheets.json`, never committed).
- **Codex:** he installed 4.2.294 from the main checkout at 12:21 on 26 September and ran a lesson (Roman numerals to L) on it. **Codex installs whatever is in the main checkout's working tree at that moment**, so never leave a half-joined release uncommitted in main when he might install, and tell him before he does.
- **Done (7 of 10 behaviour releases):** worksheets 4.2.290, subject files 4.2.291, colours 4.2.292, 7A openings and closings 4.2.293, reviewer 4.2.294, routes 4.2.295, and the voice release built (below).
- **Left:** finish and join voice; playbook 10A (started); humour (release 6); playbook 10B; playbook 10C. Then the tidy-ups (7B, routes release 4 folds, topic 9, two engine jobs), which are not needed before he uses it.

## In flight

### 1. Voice guide (topic 8, release 5): nearly done
- Worktree `C:\Users\Daniel\Projects\lessonv4-voice`, branch `streamline/8-voice`, from `91687471`. Report `plans/streamline-tools/vg-release-report.md` there; full check `vg-release-check.md` there.
- Built, fully checked, every repair done, and his last answer ("yes thats fine": a phrase repeated for rhythm is fine in speaker notes, the warning stays for the written slide) built by `vg_00` and the guide's section 2 and 3 changes. Every suite passes on the branch (Python 2,325), 60 of 60 undo attacks caught, replay exact; a trial merge onto `8af6f8a9` passes (Python 2,382). `vg_09` restores his answer in the voice ledger if a conflict resolution drops it.
- Then: a small look at the repairs (a fresh agent, smaller model), then join main (see "Joining a side branch"), numbered **4.2.296**, merge follow script `plans/streamline-tools/vg-change/vg_09_follow_at_merge.py` (take main's side in conflicts, then run it).

### 2. Playbook 10A: started, stopped part way
- Worktree `C:\Users\Daniel\Projects\lessonv4-playbook`, branch `streamline/10a-playbook`, from `8af6f8a9`. Brief: `plans/streamline-tools/playbook-10a-brief.md` (in main).
- The builder was stopped for usage after writing scripts `c1` to `c7c` in `plans/streamline-tools/pb-change/` (worktree) and editing about 30 files. No report yet.
- To resume: in the worktree, put the plugin back to `8af6f8a9` (`git -C C:/Users/Daniel/Projects/lessonv4-playbook checkout -- plugins/lesson-v4`, keeping `plans/`), rerun the scripts in order to see each one applies cleanly, then carry on from the brief. If a script half-applied or fails, fix that script, not the files.

## Still to build, in order

3. **Humour (topic 8, release 6).** His answer "do those humour fixes" is recorded in `plans/streamline-tools/humour-diagnosis.md` (section "His answer"): all five changes. Build after voice has joined (it reaches the voice guide, the lesson designer, the content route, preferences' Pride Lessons and the reviewer). Plan: `plans/2026-09-24-topic-8-change-plan.md` section 7.
4. **Playbook 10B (the four run faults).** Plan section 4 of `plans/2026-09-24-topic-10-change-plan.md`, plus two items carried in `streamline-plan.md` row 10: the decorator told to preview with `--deliver-flagged` though the slide check refuses it (a flagged deck gets no drawings); and the run report check passing COMPLETE while the last review still says REDESIGN REQUIRED.
5. **Playbook 10C (the wall and stick-in pack ship flagged).** Plan section 5. Note: a single wall fact over about 106 letters is still refused by the build; 10C's "ship flagged after every repair" covers it.

## The method for each release (as agreed with him)

1. A brief in `plans/streamline-tools/` (copy the shape of `playbook-10a-brief.md`).
2. One builder in its own worktree (or on main if nothing else is in flight). It writes the change as replayable scripts, maps and pins rows, runs every suite, writes a report.
3. **One full independent check** by a fresh agent on the strong model (a new chat in Codex). It changes nothing and writes a report.
4. The builder repairs. A release that changed code gets a **small look at the repairs only** (smaller model is fine); a words-only release's word repairs the lead checks against the tests.
5. Join main, a **joining check** (smaller model), every suite, then commit. He gave standing leave to commit once checks are clean; **never push, never install on Codex, without him.** Stop and ask him if a check finds something real that his words do not settle.
6. His answers are recorded word for word in the relevant ledger before anything is built from them. Talk to him in plain words: short chunks, bold mini-headings, no code names, no em or en dashes, one clear question.

## Joining a side branch to main

In Git Bash from `C:\Users\Daniel\Projects\lessonv4`:

1. In the worktree: `git add -A -- . ':!plans/streamline-tools/scratch'`, then `git diff --cached --binary --full-index <its base commit> > <scratch>/x.patch`, then `git reset -q` (the worktree stays uncommitted).
2. In main: `git apply --3way <scratch>/x.patch`. If it errors with "does not match index", main has uncommitted changes (for example a lesson run's build-log note or a Codex version stamp in `.codex-plugin/plugin.json`): commit the note, restore the stamp, then apply again.
3. Resolve conflicts as the release's own `*_follow_at_merge.py` docstring says. Ledgers and the build log keep both sides, main's first. `plans/streamline-tools/scratch/resolve_rt_merge.py` is a reusable resolver (edit its two lists).
4. Number the new log entry's heading `(4.2.N)`; make any "Built on a side branch; the version is set at merge." line historical; set both `plugin.json` files to 4.2.N; `git add` the resolved files; run the follow script.
5. `bash plans/streamline-tools/run-all-suites.sh <label>` with the python3 workaround first on PATH; a joining check; then `git add -A -- plans plugins/lesson-v4 ':!plans/streamline-tools/ws-after-sheets.json' ':!plans/streamline-tools/ws-before-sheets.json'` and commit with the release's one-line summary and "(4.2.N)".

## Machine gotchas

- **python3 hangs** (the Microsoft Store alias). For every test run put `C:\Users\Daniel\AppData\Local\Temp\claude\C--Users-Daniel-Projects-lessonv4\5661196e-1751-4711-8b0f-64aef26ec0c2\scratchpad\py3venv\Scripts` first on PATH (a venv whose `python.exe` is copied to `python3.exe`). If that folder is gone, make a new venv anywhere, `pip install pytest`, copy `python.exe` to `python3.exe`. Codex can also use `scripts/find-python.js`.
- **Worktrees' `node_modules` are junctions** to main's. Before any `git worktree remove`, remove each junction with `rmdir` (never a recursive delete), or main loses its libraries. Worktrees still open: `lessonv4-colours`, `lessonv4-subjects`, `lessonv4-reviewer`, `lessonv4-routes` (all joined, safe to remove after rmdir-ing their four junctions), `lessonv4-voice`, `lessonv4-playbook` (in flight).
- Agents doing undo attacks must do them in a scratch copy, never in the real files.
- Test suites take about 5 minutes (Python) plus 2 (node). Agents often go idle waiting on background test runs; tell them to run in the foreground.
- Large pictures (`colours-renders/`, `7a-renders/`) are git-ignored on purpose.

## Handing this to Codex

Open Codex with the working folder `C:\Users\Daniel\Projects\lessonv4`, Full access (the suites need the computer's Python and Node), and give it:

> Read `plans/streamline-handover.md` and `plans/streamline-plan.md`. Carry on with the first unfinished item in "In flight", following the method there exactly. Do not push or install anything. Do not change `C:\Users\Daniel\Projects\lessonv4` except to join a finished, checked release. Stop and tell me before anything his recorded answers do not settle.

For each independent check, start a **new** Codex chat (a fresh reader matters) and give it the check part of the method with the release's brief and report paths. Honest limits: Codex cannot run several agents side by side the way Claude Code does, so it will be one release at a time and slower; a weaker model will find fewer faults in the full check, so for the humour release (the most judgement-heavy left) a strong model is worth waiting for.
