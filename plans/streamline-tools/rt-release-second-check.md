# Second check of repair round 1 (routes release, topic 8, release 3)

Checked 26 September 2026 against `rt-release-check.md`'s six items, `rt-release-report.md`'s
"Repair round 1" section, and `plans/streamline-tools/rt-change/rt_05b_round1.py`. All scratch
work is in `plans/streamline-tools/scratch/rtchk2/`. Nothing else was touched.

## 1. The six findings, quoted old and new

1. **"Count as one seen" removed.** Old (found in the first check): "success criteria on the
   board that already show what a good one looks like count as one seen, so the launch needs no
   second model." New, in `agents/design-reviewer.md`, `agents/lesson-designer.md` (x2) and
   `references/output-template.md`: "success criteria on the board that already show what a good
   one looks like (an actual good one, such as a model answer or a good paragraph, never a list
   of what a good one includes) stand in for the good instance, so the launch keeps its case and
   steps and needs no second model." Confirmed in all four places by grep.
2. **The program's criteria-pass is gone.** Verified directly (below): a criteria checklist no
   longer lets a written-explanation task pass; only an actual good example does.
3. **The three maths lessons.** The report itself now states plainly that
   `round-to-the-nearest-100`, `trial-c-round-10-secure` and `read-and-complete-number-lines`
   would also have passed on a bare one-line launch (rounding steps as criteria) under the first
   build, and confirms all three are refused after the fix.
4. **Merge conflict, two places.** `rt-release-report.md` now says the reviewer's file conflicts
   "in two places... line 44, and section 3's list, where the reviewer's J34 and this release's
   J36 are neighbouring lines," and that the follow script's put-back covers both. Matches the
   original finding exactly.
5. **Wording faults in the shared explaining section.** Old: "the fault above" (pointing outside
   the section it's read from). New, in `references/teaching-sequence-content-based.md`: "Saying
   the same thing three ways is a fault (this section's last paragraph: the landed sentence again
   in other words)" and the parallel line for slides. Also "the validator refuses `null`" is now
   scoped: "the validator refuses `null` on a `teach` beat (a task lesson's `teach-needed` keeps
   its own rule...)" — confirmed in the file and in `test_the_board_teaches_and_the_criteria_are_runnable.py`
   and `test_routes_ledger_is_kept.py`.
6. Not separately itemised in the check's six but covered by round 1's item 6: the reviewer's old
   trigger "when the product's form is new to the lesson" is gone from `design-reviewer.md`,
   replaced with decision 2's wording ("when the class has not yet seen a good one of this product
   earlier in this lesson..."). Confirmed by grep — no remaining hit for the old phrase.

## 2. Validator check on two scratch designs

Built from the saved history comparison lesson (`...continuities-and-changes-to-children-s-lives...(6)`,
copied to `scratch/rtchk2/checklist` and `scratch/rtchk2/goodexample`). Its Practise launch as
saved carries only a criteria table ("Good comparisons show: the same part of life / both
periods / evidence / careful conclusions") with `goodLooksLike: null` — the checklist case named
in the report.

Running `validate-lesson-design.py`'s full pipeline hit unrelated schema drift this old saved
design predates (a retired `lesson2Direction`/`scope`/`deferredLearning`, a retired
`testQuestionPath`, and an unrelated `thinking` rule) — the same drift the release's own
`rt_designs.py` works around by calling the isolated check function directly rather than the
whole validator, because (its own docstring) "the whole validator refuses every saved design
earlier for other reasons." I followed the same approach and called
`validate_explanation_task_is_modelled` from `validate-lesson-design.py` directly on each:

- **checklist** (criteria table only, no good example): **REFUSED** — "this Practise asks each
  child to write an explanation or comparison, and nothing earlier in the lesson has shown the
  class a good one: the launch has no good instance..."
- **goodexample** (same design, `goodLooksLike` given an actual good/weak comparison pair):
  **PASSES**.

This is the exact behaviour item 2/5 of the check asked for.

## 3. Replay

`python -X utf8 rt_replay.py` from `plans/streamline-tools/rt-change/`: `RUN_OK`. Compared 979
plugin files plus the plans' ledgers and mappings against a clean `git archive 59f85708` rebuild
with the branch's own `rt-change/` and `ledger_mapping.py` copied in and re-run. Result:
"different from this branch: nothing." The scripts reproduce the branch exactly.

## 4. Full test suite

`python -X utf8 -m pytest plugins/lesson-v4/scripts/tests -q -p no:cacheprovider` from the
worktree, with the venv's Scripts directory first on PATH:

**2,337 passed, 1 skipped, 231,545 subtests passed** in 280.42s. No failures, no errors.

## Conclusion

CLEAN. All six findings from `rt-release-check.md` are repaired exactly as
`rt-release-report.md`'s "Repair round 1" describes, verified by direct grep/quote and by an
independent validator run on two built designs. The change scripts replay byte-for-byte onto a
clean `59f85708`. The full test suite passes. No em or en dash was added.
