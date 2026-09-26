# Merge check: routes release into main (4.2.295)

Base 59f85708, main HEAD 379e09b0 (91687471 + one build-log commit), routes worktree `lessonv4-routes` (uncommitted).

## 1. plugins/lesson-v4/agents/design-reviewer.md

Rebuilt the three-way merge with `git merge-file -p main base routes` in scratch (`plans/streamline-tools/scratch/mchk295/`). Two conflicting hunks.

**Hunk 1 (line 44, "Teach board teaches" paragraph, holds J34/J36 territory).** Both sides changed this paragraph. The working file matches main's side exactly (confirmed with `diff`). The routes-only addition here (two dated incidents: 14 Sept Tudor farm household quote, 22 Sept "notes closed" quote) was dropped, which matches the stated rule (main's side on this file).

**Hunk 2 (lines 204-205, section 3, two adjacent bullets).**
- Line 204 ("a Do beat following an explanation..."): working file took **main's** wording ("The repair keeps the chunk and is the Lesson Designer's, because it changes what children have to think").
- Line 205 ("a substantial task is launched before it is instructed..."): working file took **routes'** wording in full (the longer version adding "or the class has already seen a good one of this product earlier in this lesson" and the success-criteria-stands-in-for-the-model paragraph, verbatim match to `routes.md`).

So this one conflict block was resolved **line-by-line, not as a single hunk-wide "main wins"**: bullet 204 went to main, bullet 205 went to routes. This does not match a literal reading of "main's side in each conflicting hunk" (both bullets sit inside one conflict block). It does look like a deliberate content decision rather than damage — nothing from either side's text was lost or garbled, and dropping the routes launch improvement here would have silently discarded a decision (13b) that other files in this same release depend on. Flagging it as a discrepancy between the stated resolution rule and what the file actually contains, not as data loss.

Quoted, both sides at hunk 2:
- main: "The repair keeps the chunk and is the Lesson Designer's, because it changes what children have to think: return it naming the fix, which asks for..."
- routes (as kept in bullet 205): "...and a null `launch` is right only when children can begin from the question alone or the class has already seen a good one of this product earlier in this lesson; success criteria on the board that already show what a good one looks like... stand in for the good instance, so the launch keeps its case and steps and needs no second model..."

## 2. Other files routes changed that main also changed since 59f85708

Overlap set: `design-reviewer.md` (above), `references/build-review-log.md`, `scripts/design-review-packet.py`, and five pin JSONs (`quick_checks_ledger_pins.json`, `starters_sticky_apply_ledger_pins.json`, `success_criteria_ledger_pins.json`, `teach_then_do_ledger_pins.json`, `worksheets_ledger_pins.json`).

- `scripts/design-review-packet.py`: rebuilt three-way merge in scratch — clean, no conflicts, output matches the working file exactly.
- Pin JSONs: all five parse as valid JSON (loaded with `json.load`), no corruption.
- `build-review-log.md`: see section 3 below (this one did conflict).

Nothing lost from either side in these files.

## 3. Ledgers and the build log

- Grepped `plugins/lesson-v4` and `plans` for conflict markers (`<<<<<<<`, `>>>>>>>`): none found anywhere in the repo (outside the routes/reviewer scratch change-log folders, which are expected historical artefacts, not live conflicts).
- `build-review-log.md` did conflict at the very end of the file (two appended entries, both dated 2026-09-26). Rebuilt the three-way merge: working file's order is main's reviewer entry (4.2.294) → the Roman-numerals build-log run note (main, added after 91687471) → the routes entry (4.2.295) last. That is "both closing sections kept, main's first," as stated.
- Diffed each entry's full body against its source: the reviewer entry (4.2.294) matches main byte-for-byte except one blank separator line; the routes entry matches the routes worktree's file byte-for-byte except the working copy's heading carries the added "(4.2.295)" version tag. Both entries are whole, nothing truncated or interleaved.
- All 26 September entries are present and in order: 4.2.293 (pre-existing), 4.2.294 (reviewer), the Roman numerals run note, 4.2.295 (routes).
- Checked all files routes touched (`git diff 59f85708` name list minus scratch) for em dash (—) or en dash (–) via `grep -P '[\x{2013}\x{2014}]'`: none found in the plugin/reference files. (The earlier full-repo dash grep timed out on the huge working tree and was superseded by this scoped, faster check.)

## 4. Tests

Ran with the scratchpad venv Python first on PATH:
```
python -X utf8 -m pytest plugins/lesson-v4/scripts/tests -q -p no:cacheprovider -k "ledger or reviewer or routes or kept"
```
Result: **332 passed, 2027 deselected, 243805 subtests passed** in 158.52s. No failures, no errors.

## Verdict

CLEAN, with one flagged item: the design-reviewer.md hunk-2 resolution split a single conflict block line-by-line (main for bullet 204, routes for bullet 205) rather than taking one side for the whole hunk as the stated rule describes. Content-wise nothing is lost, garbled, or duplicated; it just doesn't match the literal wording of the stated resolution rule and is worth the lead's eyes.
