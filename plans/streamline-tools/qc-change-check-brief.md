# Brief: independent check of the quick-checks change (4.2.286)

You are checking someone else's work. The teacher who owns this lesson plugin, Daniel, set one condition above all others: "A shorter file that loses a rule is a failure however clean it reads." Past tidy-ups reworded rules, reported nothing had changed, and dropped things. Find anything this change lost, softened, widened, contradicted or got wrong before he reads it. You did not write it, which is why you are asked.

## What changed, and where to look

- The plugin: `C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4`. Two uncommitted changes sit on commit `3de9c956`: the Teach then Do change (4.2.285, already checked twice) and, on top of it, the quick-checks change (4.2.286), which is yours.
- **The old text for this change is the 4.2.285 state**, not HEAD: for a tracked file, `git show stash@{0}:<path>` (run from `C:\Users\Daniel\Projects\lessonv4`; the stash is a snapshot, the working tree is untouched); for files new in 4.2.285, `plans/streamline-tools/td-4.2.285-snapshot.tar`. Diff those against the working tree. HEAD shows both changes together.
- The rule list: `plans/2026-09-22-quick-checks-ledger.md` (307 rows, each rule's own words in «guillemets»). Daniel's decisions: its `Decisions taken (23 September 2026)` section (all ten "Agree") and `Decisions for Daniel` for what each proposed; he agreed each proposal as written, so the proposal text is the standard.
- The mapping: `plans/2026-09-23-quick-checks-mapping.md`. The pins: `scripts/tests/quick_checks_ledger_pins.json`, checked by `test_quick_checks_ledger_is_kept.py` through `ledger_pin_checks.py`. This change also moved nine rows of the Teach then Do pins (`teach_then_do_ledger_pins.json`, built by `plans/streamline-tools/td-change/build_td_mapping.py`, its `QC_ROWS`).
- The scripts that made the change: `plans/streamline-tools/qc-change/q1_text.py`, `q2_fixture_and_log.py`, `q3_view_code.py`, and the mapping script beside them.
- The depth expected, and the shape of your report: `plans/streamline-tools/teach-then-do-change-check.md`, the check of the previous change.

## What to check

1. **Row by row, every changed row**, old words beside new: a lost condition or exception, a strength that dropped, a rule widened or narrowed, a pointer that drops what its copy carried. Quote both.
2. **Each of the ten decisions** applied as proposed, no more and no less. Decision 4 (recall with the answer off the board, the fresh case for ideas) and decision 1 (which "say so" rules are honest) are new wording in the home: check they match the proposals and do not quietly license what the fresh-case rule refuses.
3. **The honest "say so" rules the decision listed** (K22, S43, S42, S32, S33, M25, M26, B06, B07) are all still there word for word.
4. **The code.** `design-review-packet.py`'s `build_do_beside_teach` was replaced to reach every route, read structured answers and count the takeaway. Look for pupil beats it still misses or wrongly pairs, crashes on real designs (build review views for several saved `lesson-design.json` files under `C:\Users\Daniel\Projects\lessonv4\working` and `output\working`), and anything it no longer shows that it did. Run the Python suite from the plugin folder: `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider`.
5. **Collateral and contradictions** anywhere in the plugin that now disagree with the new wording (search the whole plugin).
6. **The pins**, attacked on a scratch copy of the WHOLE plugin folder (copy everything except `node_modules`; a copy missing a folder fails for that reason alone, so run the pin tests once on the untouched copy first and confirm they pass). Delete, soften, move and re-add rules this change touched, and bring back the retired excuse wordings in new places. Report each attempt: caught by the pin test, by another test, or by nothing.
7. **Honesty.** The 4.2.286 build-log entry (end of `references/build-review-log.md`): true to the files? Any new em dash or en dash in plugin text written by this change?

## Limits

Change nothing in the repository. A different sound wording is not a finding.

## Your report

Write it to `plans/streamline-tools/quick-checks-change-check.md`, in the shape of the previous check: what you did, numbered findings most serious first with quoted old and new text, one line per thing checked and found sound, and a closing list of what you would fix before release. Reply with a summary of no more than fifteen lines.
