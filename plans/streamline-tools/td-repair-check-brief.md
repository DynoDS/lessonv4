# Brief: independent re-check of the Teach then Do repairs (4.2.285)

A first independent agent checked the uncommitted Teach then Do change to this lesson plugin and wrote `plans/streamline-tools/teach-then-do-change-check.md`. The author then repaired what it found. You are the second reader: you check the repairs, because repairs cause new faults (in the previous topic a repair to a word matcher broke plurals). You did not write the change or the repairs, which is why you are asked.

The teacher who owns the plugin, Daniel, set the standard: "A shorter file that loses a rule is a failure however clean it reads." His decisions are the authority: `plans/2026-09-22-teach-then-do-ledger.md`, sections `Decisions taken (23 September 2026)` and `Second round`.

## Where to look

- Run from `C:\Users\Daniel\Projects\lessonv4`. The whole change is `git diff HEAD -- plugins/lesson-v4`; `git show HEAD:<path>` is the old text. The repairs are the part made after the first report: its findings 1a to 1g, section 3's J21 clause, section 4's README line and the designer's "again", section 5's always-read note and Slide Philosophy test, and section 6's pin gaps. The repair scripts are `plans/streamline-tools/td-change/r1_repairs.py` and the changes to `plans/streamline-tools/ledger_mapping.py`, `td-change/build_td_mapping.py`, `plugins/lesson-v4/scripts/tests/ledger_pin_checks.py` and `test_teach_then_do_ledger_is_kept.py`.
- The build-log entry for 4.2.285 is at the end of `plugins/lesson-v4/references/build-review-log.md`.

## What to check

1. **Each earlier finding, one by one:** repaired, partly repaired, or not. Quote the new text. Where the author chose not to fix something (1a's wider question is to go to Daniel; gap 3 and E12 are stated as limits), say whether that is honest.
2. **Did any repair break or soften something else?** Read every sentence each repair touched, and its neighbours. In particular: the practical-lesson paragraph's new sentences against the science file, the Discovery route and the content route's `observe`; the scene sentence in `preferences.md` against the content route's copy and the slide playbook's split rule; the skill route's J21 sentence against the slide check's tests; the designer's reading pointer against its `Reference Files` section.
3. **The pins, attacked again** on a scratch copy of the plugin (copy it into your scratchpad; never edit the repository). Repeat the first report's twelve misses (E02, E03, E04, E05, E08, E09, E11b, E12, E14b, E15, E20, E24) and add at least six new attempts of your own aimed at the repairs and at the new "above the reviewer's line" check (for example: move a pinned paragraph within a section, split a pinned paragraph in two, move `## Output Format Block` itself, put a rule inside a code fence). Report each: caught by the pin test, caught only by another test, or caught by nothing.
4. **Suites:** from `plugins/lesson-v4`, `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider`; and `node --test "test/*.test.js"` in `builder/`.
5. **Honesty:** does the build-log entry say what was done, what the checks found and what is left, with no claim the files do not bear out? Any new em dash or en dash in plugin text?

## Limits

Change nothing in the repository. A different sound wording is not a finding. Findings are rules lost, softened, widened or contradicted, decisions misapplied, repairs that broke something, and pins that miss real damage.

## Your report

Write it to `plans/streamline-tools/teach-then-do-repair-check.md` in the shape of `plans/streamline-tools/vocabulary-example/repair-independent-check.md`: real problems first, then the earlier findings one by one, then whether the repairs broke anything, then what you checked and found sound. End with what you would fix before release. Reply with a summary of no more than fifteen lines.
