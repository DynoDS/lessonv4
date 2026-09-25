# Brief: draft one topic's change plan (read only)

The teacher, Daniel, has answered every decision on this topic's rule ledger. Your job is to draft the plan for making the change, so the release can start the moment the one before it is committed. **Planning only: change nothing in the plugin.** Another release (4.2.289, the long-criteria fit release) is uncommitted in the working tree and being checked; the plugin will change under you, so plan against the files as they are and name anything that release touches.

## Read first

1. `plans/streamline-plan.md`, whole: his goal in his words, the rules for every topic, the method (your plan is step 5 onward), and "What the rounds have taught".
2. Your topic's ledger (named in your spawn message), whole, above all its "Decisions taken" and his answers in his own words, which are the standard. Where a read-back follows his words, that is what he agreed.
3. The last change plan, as the model of depth and shape: `plans/2026-09-23-success-criteria-change-plan.md`, with what it produced (`plans/streamline-tools/sc-change/` scripts, `plans/2026-09-23-success-criteria-mapping.md`, the 4.2.288 build-log entry at the end of `plugins/lesson-v4/references/build-review-log.md`, and the four check reports `plans/streamline-tools/success-criteria-*check.md`, whose findings show what that plan missed).

## What the plan says

For every decision and settled item, in his words first: what changes, where (file, section, the exact old words), what the new words are or must achieve, what moves rather than rewords, which ledger rows it touches, which tests and pins move with it (search `scripts/tests` and the pin files `scripts/tests/*_ledger_pins.json`), and what code changes (validator, review page, scaffold, builders), with the test that proves each. Then:

- **The homes:** where each rule lives once afterwards, and which copies become pointers that keep their conditions.
- **Stories:** each dated story in a runtime file, whether the build log holds it, and what reason stays.
- **Order of work** and what can be scripted; which change scripts to write.
- **Risks:** where a fold could soften a rule, where two of his answers meet, where a decision needs a mechanism that does not exist yet (name it, as the last rounds taught), and where the change reaches another topic's pinned words.
- **Anything his answers leave open**, as a short plain question for him, in the three-part shape, only if it is a real pull.
- **Size**, honestly estimated.

## Limits

Write only your plan (the file named in your spawn message) and scratch files under `plans/streamline-tools/scratch/` whose names start with your prefix. Never clear anything else there. No em or en dashes. Windows with Git Bash: Bash takes Unix paths (/c/Users/...), the file tools take Windows paths; run Python with `python -X utf8`; write scripts to files rather than heredocs with quote marks. Reply with a summary under 250 words: the plan's size, the riskiest parts, and any question for him.
