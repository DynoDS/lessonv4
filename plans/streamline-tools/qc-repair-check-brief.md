# Brief: independent re-check of the quick-checks repairs (4.2.286)

A first independent agent checked the uncommitted quick-checks change to this lesson plugin and wrote `plans/streamline-tools/quick-checks-change-check.md`. The author then repaired what it found. You are the second reader: you check the repairs, because repairs cause new faults. You did not write the change or the repairs.

The standard is the plugin owner Daniel's: "A shorter file that loses a rule is a failure however clean it reads." His decisions are in `plans/2026-09-22-quick-checks-ledger.md` (`Decisions taken`, then `Decisions for Daniel` for what each proposed; he agreed every proposal as written). Three points the author judged to need his word are queued in that ledger under `Open questions from the change`; judge whether leaving them for him is honest, and whether anything else should join them.

## Where to look

- Run from `C:\Users\Daniel\Projects\lessonv4`. Two uncommitted changes sit on commit `3de9c956`: Teach then Do (4.2.285) and quick checks (4.2.286). The old text for this topic is the 4.2.285 state: `git show stash@{0}:<path>` for tracked files, `plans/streamline-tools/td-4.2.285-snapshot.tar` for files new in 4.2.285.
- The repair scripts: `plans/streamline-tools/qc-change/qr1_repairs.py` to `qr5_log_and_questions.py`; the mapping scripts `qc-change/build_qc_mapping.py` and `td-change/build_td_mapping.py`; `plugins/lesson-v4/scripts/tests/ledger_pin_checks.py`; the view code `build_do_beside_teach` and the functions above it in `plugins/lesson-v4/scripts/design-review-packet.py`, and its test `test_every_pupil_beat_is_seen_beside_its_teaching.py`.
- The build-log entry for 4.2.286 is at the end of `plugins/lesson-v4/references/build-review-log.md`.

## What to check

1. **Each earlier finding, one by one:** repaired, partly, or not; quote the new text. Where it was left for Daniel, is that honest?
2. **Did a repair break or soften something else?** Read every sentence each repair touched and its neighbours. In particular the recall pointers against the home and against `What a Lesson Is For`; the view's new pairing on real saved designs (build the section for every `lesson-design.json` under `working`, `output/working` and `lesson-resources-output/working`, compare with what the 4.2.285 code printed, and look for a pupil beat now paired with the wrong teaching or counted against the wrong text); the new "everywhere" check over the plugin's programs (does any honest use now fail, or any retired phrase still hide?).
3. **The pins, attacked again** on a scratch copy of the WHOLE plugin folder (everything but `node_modules`; run the pin tests on the untouched copy first and confirm they pass). Repeat the first report's fourteen misses and add at least six attempts of your own aimed at the repairs.
4. **Suites:** from `plugins/lesson-v4`, `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider`; `node --test "test/*.test.js"` in `builder/`.
5. **Honesty:** is every claim in the 4.2.286 log entry borne out by the files? Any new em dash or en dash in plugin text?

## Limits

Change nothing in the repository. A different sound wording is not a finding.

## Your report

Write it to `plans/streamline-tools/quick-checks-repair-check.md`, in the shape of `plans/streamline-tools/teach-then-do-repair-check.md`. Reply with a summary of no more than fifteen lines.
