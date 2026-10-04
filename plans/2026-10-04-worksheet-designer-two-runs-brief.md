# Worksheet designer: two runs of the same lesson, compared (brief for a fresh chat)

Written 4 October 2026 for a new Codex chat in `C:\Users\Daniel\Projects\lessonv4`. Daniel is the teacher who owns this plugin. He is not a developer.

## What this is for

Daniel wants worksheets that come out right the first time. The way to find what stands in the way is to run the worksheet designer twice on the same real lesson, with nothing changed between the two runs, and let him judge the results page by page with a note on each. Where the two runs differ, the instructions are leaving something to chance. Where both are wrong in the same way, something is wrong in general: in the worksheet engine, in the guidance, or in what the lesson design hands over.

This is not a test of a slimmed or changed worksheet designer. Both runs use the plugin exactly as it stands. Nothing in `plugins/lesson-v4` is edited during this job.

The same exercise was done for the slide designer earlier the same day. Its records are in `evaluations/slide-designer-context-2026-10-04/` (start with `README.md` and `RESULTS.md`). What it taught, and what this brief is built on:

- His slide-by-slide notes were the valuable part. The same wishes came up whichever run he was looking at, and each traced to a cause that could be fixed. So the page must make judging one page at a time, with a note, as easy as possible.
- He judges each item, not each lesson.
- He does not want repair rounds spent on the test runs. Whatever a run produces by itself is what he sees, and the page says plainly how the run went.
- Pictures dropped into a working folder part-way through a run changed what that run saw. Put everything in place before launching, identically for both runs.

## The job, in order

**1. Choose five recent real lessons.** They live in `working/`. A lesson qualifies when its folder holds what the worksheet designer was really given: `lesson-design.json`, `helper-check.json`, `adaptation.md` with its picture file where there is one, the photograph contract, and a finished `worksheet.json` showing the designer did run. Aim for variety of subject and year group. Recent candidates: the Year 6 renga lesson, Year 6 rules of divisibility, Year 4 history lesson 4 (Lord Shaftesbury), Year 4 RE (the Nativity story), Year 4 science (how the digestive system works), Year 4 maths lesson 21. Check file times: if a lesson's design was edited after its worksheet designer started, it is still usable, but say so in the record.

**2. Make two clean working folders per lesson**, under `evaluations/worksheet-designer-two-runs-2026-10-04/runs/`, with neutral names that say nothing about the run. Copy in only the inputs, byte for byte, and any delivered pictures the lesson's own run ended up with (its `unsplash/` folder), the same for both. Do not copy the old `worksheet.json`, and do not let either run read the original folder or the other run's folder: an earlier slide run found and read a previous build of its own lesson.

**3. Launch the worksheet designer twice per lesson, as two separate workers.** Use the real launch message from `plugins/lesson-v4/skills/make-lesson/playbook-lite.md`, Track B, the block that begins `You are the worksheet designer`, with `PLUGIN_ROOT` set to `C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4` so both runs read the working copy. Take the model and effort from `python plugins/lesson-v4/scripts/worker-launch.py spec --role worksheet-designer --host codex` and copy its fields verbatim: the point is to test the worksheet designer as real lessons run it. Track B also says how the photograph contract path is chosen (`photo-contract.py select-worksheet`); give both runs the same one and the same `PICTURE_STAGE` line. Run the adaptation designer for nothing: the lesson's own `adaptation.md` is the input.

Read long files with `"[PYTHON]" plugins/lesson-v4/scripts/read-reference.py --file <path> --page 1` and each page it names, because Codex cuts the middle out of long command output. Find Python with `node plugins/lesson-v4/scripts/find-python.js`.

**4. Keep a plain record of each run and add no repairs of your own.** For each run note: whether its first check passed, how many of its own repair attempts it used, any check it ended without passing (the diagnostic lines, word for word), and every `Friction:` line it reported. If a run asks you a question, answer it the way a real run's orchestrator would without changing its inputs, and give the other run the same answer if it asks. If a run ends without a passing `worksheet.json`, build from what it left if that is possible and mark it; if not, the page says that run produced no sheet. That is a result, not a problem to fix.

**5. Build each run's sheets with the fixed worksheet build** (`run-fixed-resource.py worksheets`, as Track B shows it), into the evaluation folder, never into Daniel's lesson output or his Drive. Then turn every page of every PDF (each level's pupil sheets, the slips where there are any, and the answer sheet) into a picture with `plugins/lesson-v4/scripts/render-pages.py`.

**6. Build the comparison page as one local HTML file** he opens in his browser (Codex cannot publish a Claude artifact). `evaluations/slide-designer-context-2026-10-04/tools/build_page.py` and `page_template.html` are the working version from the slide test and are the right starting point. What the page must do:

- One tab per lesson. The two runs are called A and B, and which run is A is chosen at random for each lesson and kept in a file he is not shown until he has finished. Neither is "the original": they are two runs of the same thing, and saying so on the page is right.
- Pair the pages level by level: A's Below page 1 beside B's Below page 1, then Expected, then Greater Depth, then slips, then the answer sheet. Where one run made a page the other did not, show the page with an empty place beside it.
- Under every pair: `A is better`, `B is better`, `About the same`, a tick box `Something is wrong on both`, and a one-line note. The tick box matters here in a way it did not for the A/B slide test: a fault both runs share is the most useful thing he can tell us.
- A line for each run saying how it went, from step 4, in plain words.
- Tapping a page shows it large, with a way to flick between A and B and to choose without leaving the large view.
- His choices are kept in the browser as he goes, and a `Copy my answers` button puts all of them, with the notes, into a text box and on the clipboard so he can paste them into the chat. There is no database behind a local page, so this is how his answers reach you.
- Slide pictures and file names carry nothing that tells the runs apart beyond A and B.

Write the page's own words the way he writes: short, plain, no em dashes or en dashes.

**7. Stop there and hand him the page.** Tell him where the file is and how many pairs there are. Do not analyse the sheets for him first and do not run evaluator agents: he wants to spend his own eyes on this, not usage.

**8. When he pastes his answers back, diagnose.** Follow the method in `C:\Users\Daniel\.claude\skills\improving-agents-and-skills\SKILL.md` (read the file; it is a set of instructions, and its `references/` are read only when their trigger applies). In short: group his notes into the things he asked for more than once; for each, find the cause before proposing anything, and say which kind it is: a fault in the worksheet engine (`plugins/lesson-v4/worksheet-html`), guidance that exists and is not checked, two instructions that disagree, or something the lesson design or the adaptation got wrong upstream. Check the cause in the code or the files before stating it, and say which causes you verified and which you only suspect. Faults both runs share come first. Then tell him what you found and what you would change, and wait for his word before changing anything in the plugin.

## Boundaries

- Nothing in `plugins/lesson-v4` or in `working/` is edited, and nothing is committed, pushed, installed or filed to Drive, unless he says so by name. The main working copy holds uncommitted fixes from the slide work of the same day; leave them as they are.
- Run only the worksheet designer and the fixed worksheet build. Do not run the whole `make-lesson` skill, and never inside a worker.
- Ten worksheet designer runs is the whole test. If a run dies for a reason that is not the designer's (a usage limit, a crash), start that one again once and say so; otherwise do not add runs without asking him.
- When something is not what this brief expects, say what you found and carry on with the part that does not depend on it.

## Talking to Daniel

Read the Communication Style section of `C:\Users\Daniel\.claude\CLAUDE.md` and follow it. The short version: plain English with no code names, file names or jargon; short chunks with a bold mini-heading and a line or two under each, never a dense block; no em dashes or en dashes anywhere; name things by their job ("the agent that designs the worksheets"); one clear question at a time, and answer his questions first.
