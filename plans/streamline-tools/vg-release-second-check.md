CLEAN

# Voice release second check

Checked only the repairs made after `plans/streamline-tools/vg-release-check.md`, using the later repair rounds in `vg-release-report.md` and the release scripts in `vg-change/`. All experiments and both requested suites ran in `plans/streamline-tools/scratch/vg-release-second-check/`.

## Findings from the first check

1. **DONE - the week 3 length is corrected.**
   Old: the slide's script "ran to nearly two hundred words".
   New: it "ran to about a hundred and fifty words". The guide now gives the script length, not the longer count that includes teacher information.

2. **DONE - VG-O41 is mapped and the merge succeeds.**
   Old: the follow-at-merge script failed with `VG-O41: changed but not mapped`; the route said "which is the same-shape fault above at the level of slides". The old report/log count was "two rows".
   New: `build_vg_mapping.py` includes `VG-O41`, keyed to the routes release's "which is saying the same thing three ways, at the level of slides" wording and its teacher ruling. The report and log say "three rows". The scratch merge trial ran `vg_09_follow_at_merge.py`, reported `FOLLOW_AT_MERGE_OK`, mapped 781 pins and 43 changed rows, then ended `MERGE_TRIAL OK`.

3. **DONE - the critique route is restored.**
   Old guide route: "a comparison prompt §12", although the lesson designer's route said "a comparison or critique prompt".
   New guide route: "a comparison or critique prompt §12". The ledger test asserts that exact phrase.

4. **DONE - the gap after the guide title is guarded.**
   Old: the injected sentence "Maths lessons stay straight: no light lines in maths." could sit between the title and `## Purpose` without a test noticing.
   New: `test_nothing_sits_between_the_title_and_the_purpose` asserts that no nonblank line sits there.

5. **DONE - the Below-resource pointer reads in one direction.**
   Old: "Keep essential subject vocabulary and proper nouns on a separate Below resource as Written Voice's Below paragraph says: supported, not automatically replaced."
   New: "On a separate Below resource, keep essential subject vocabulary and proper nouns as Written Voice's Below paragraph says: supported, not automatically replaced."

6. **DONE - all six retired wordings are barred everywhere.**
   Old scope was each wording's own file only. The six exact wordings are "Do **not** keep expanding it every time one sentence is corrected."; "Keep detailed calibration examples, rejected alternatives and testing history"; `## Maintenance`; "A Year 4 RE slide printed `What do their reasons share?`"; "§§1 and 3 a spoken script"; and "Keep necessary subject vocabulary and use accessible support around it.".
   New: all six corresponding absence pins have `everywhere: true` in `teacher_voice_ledger_pins.json`.

7. **DONE - Year 4 remains attached to the example.**
   Old: "A slide that prints `What do their reasons share?`" left the nine-year-old as a fixed reader.
   New: "A Year 4 slide that prints `What do their reasons share?`". The guide now identifies the class in the example.

## The teacher's answer

**DONE.** The ledger entry `His week 3 notes, and a phrase repeated for rhythm (26 September)` records his answer verbatim as `> yes thats fine`, followed by the agreed read-back. The guide builds it as recorded: "A phrase repeated for rhythm is how speech builds" in speaker notes, with the repeated tooth-decay phrase as its example; §3 limits that exception to speech and keeps the warning for the written board and page.

## Replay and validation

A clean clone was checked out at `9168747170f86f4a8dfc497d31518760f44478a8` inside the scratch folder. The release's replay script archived that commit, ran its 11 generation scripts in order, and compared the resulting plugin files and the release-written plan files with the branch copy. Every script exited 0; the comparison said `different from this branch: nothing`.

Both requested commands ran from that exact replay output:

- `python -X utf8 -m pytest plugins/lesson-v4/scripts/tests -q -p no:cacheprovider` - **2,325 passed, 1 skipped, 232,361 subtests passed**.
- `python -X utf8 -m pytest plugins/lesson-v4/evals/teacher-voice -q` - **21 passed**.

The independent scratch merge trial also passed after resolving the expected ledger, log, and rhythm-pin conflicts. Its merged-tree suites reported **2,382 passed, 1 skipped, 260,022 subtests passed** and **21 voice-harness tests passed**.