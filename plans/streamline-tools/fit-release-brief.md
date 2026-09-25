# Brief: build the long-criteria fit release (4.2.289)

The teacher agreed this work on 23 September ("agree on everything"). You build it; two fresh agents will check it afterwards, so make every choice easy to check. Nothing is committed or pushed; he decides that.

## Read first

1. `plans/2026-09-23-long-criteria-fit-investigation.md`, whole: the problem, the measurements, the options, the recommendation and "Decisions taken". Its evidence and prototype code are in `plans/streamline-tools/scratch/fit/` (the corpus, the harness that draws a panel in every shape with the builder's own code, and `alt/`, scratch copies of the step fitter, the panel and `maths-turn-sc` with each option switchable).
2. `plans/streamline-plan.md`, "Rules for every topic" and "What the rounds have taught".
3. The success-criteria release you build on: commit `baabb1b3` (4.2.288), its build-log entry at the end of `plugins/lesson-v4/references/build-review-log.md`, and `references/slide-success-criteria.md` (its "What holds a list today" paragraph).

## What he agreed, and so what to build

1. **The three measuring faults in the step fitter** (`builder/src/content/steps.js`): a tolerance when a card is given exactly its lines' height; the sticky-line pre-check measured at 18pt, step by step; the short-list rule giving way when the list needs the height. Tests from the real lists the investigation names (find 1,000 more or less, round to 10 and 100, partition 4-digit numbers, the RE single step), plus a test that every list that fits today keeps its size.
2. **The practice panel widens itself, only as far as 18pt needs.** One shared choice used by all four `*-sc` templates: the narrowest of 4.60, 5.50 and 6.35 inches that holds the whole list at 18pt or more. Never past half the slide: the half-slide check stays. He chose 18pt, not 20pt, so no saved lesson that draws today changes. The templates take their left-side widths from it, and `maths-turn-sc` puts the picture above the working space when side by side would drop the picture's column below its own minimum. The designer has nothing to choose. Tests: the long lists draw; a short list keeps 4.60 inches; a number-line slide still draws when the panel widens.
3. **A list too long even for the widest box is caught by the lesson check** (`scripts/validate-lesson-design.py`) before any slides are made, so the lesson designer, who owns the words, tightens it at design time and the half-slide limit stays unbroken. Measure honestly (the investigation found about 14 lines at 18pt, about 26 characters a line, in the practice panel; use the builder's own measure, or a conservative rule that agrees with it on the corpus). The message must not tell anyone downstream to shorten or drop criteria: decisions 3, 12 and 13 of the success-criteria topic (never fewer criteria; the wall never rewords; the slide designer never reports back) still stand, and this check is upstream, where the words are written.
4. **The guidance** says what the code now does: `slide-success-criteria.md`'s "What holds a list today" and any template-guide line the widening changes. Where 4.2.288 left "until then a list that fits no layout is delivered as a flagged slide", say what happens now.

## How

- Move before you reword; keep the teacher's decisions exactly. No em or en dashes in anything you write (a spaced hyphen, a comma or a colon instead).
- Build only what the four points say. Anything else you notice goes in your report as a note.
- The success-criteria pins (`scripts/tests/success_criteria_ledger_pins.json`, built by `plans/streamline-tools/sc-change/build_sc_mapping.py`) hold some of the words you may change. If a pinned phrase must change, change its entry in the mapping builder with a one-line reason, rebuild with `python -X utf8 plans/streamline-tools/sc-change/build_sc_mapping.py` until it prints `MAPPING_OK`, and list every pin you moved. Write your change as scripts in `plans/streamline-tools/fit-change/` (each old text asserted to appear exactly once), so the checkers can read what you did.
- Bump both `plugins/lesson-v4/.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` to 4.2.289, and add a build-log entry at the end of `references/build-review-log.md` in the style of the 4.2.288 entry: what changed, why, what is checked, what is pinned, size honestly, and "Not done yet". Plain words.
- Prove it: `bash plans/streamline-tools/run-all-suites.sh fit-after` (every suite green), `python -X utf8 plans/streamline-tools/validate-saved-designs.py plugins/lesson-v4/scripts/validate-lesson-design.py plans/streamline-tools/fit-after-designs.json` compared with `sc-after6-designs.json` (every new refusal explained), and the investigation's own before-and-after runs over the saved slides (`scratch/fit/saved-slides.js` and `real.js`): which saved slides change, and how.

## Limits

Edit only `plugins/lesson-v4` and your own files under `plans/streamline-tools/fit-change/` and `plans/streamline-tools/scratch/fitb/`. Never clear any other scratch folder. Commit nothing. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; files are UTF-8, many with Windows line endings (keep them); run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks.

## Your report

Write `plans/streamline-tools/fit-release-report.md`: what you changed, file by file; every pin you moved and why; the suites; the saved designs; which saved slides change and how; size before and after; anything you decided that he might want to know. Reply with a summary under 300 words.
