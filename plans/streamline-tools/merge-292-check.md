# Merge check, 4.2.292 (colours into main)

Checked 26 September 2026 on main's working tree. Base `2db3ceba`; main side HEAD `2d1b5068` (the amended 4.2.291: `1713e7fe`, named in the brief, is the same commit before the amend, which added ledger records, the worksheets pins' move and the log's closing line); colours side the worktree `lessonv4-colours`, its `scratch/` and `colours-renders/` left out. Tools and outputs are in `scratch/mchk292/`. Nothing in the tree was changed.

## 1. Nothing lost

- 90 colours files (45 changed, 45 new). Where main also changed a file, the three-way merge was rebuilt with `git merge-file` and compared byte for byte with main's tree.
- The real overlap is smaller than the brief's list: the build log, `output-template.md`, `preferences.md`, `templates.md`, `working-wall-card-contracts.md`, `worksheet-helpers/maths.md`, the success-criteria pin file, and the two plan tools (`ledger_mapping.py`, `run-all-suites.sh`, the same edit on both sides). `frames.js`, `index.js` and `methods.js` were not touched by either main commit, so they came across whole.
- Every overlapping file but the log: the rebuilt merge is clean and identical to main's tree.
- The build log: its one conflict is settled as described. Main's side is whole, then a blank line, then the colours entry whole with "(4.2.292)" added to its heading. Nothing else differs.
- Every other colours file equals the worktree's copy. Every file main changed and colours did not is untouched, apart from the two version files (4.2.291 to 4.2.292) and the `.gitignore` line.

## 2. Pins

- At the start of this check `test_colours_are_kept.py` failed 6 subtests in two rows. Both came from the merge, not from lost words:
  - **COL-ADD-09**: its three build-log pins named the entry's heading without "(4.2.292)".
  - **PF-R97**: it pins `templates.md`'s whole content-object table, and the subject-files release added a sentence to the `circuit-diagram` row (symbols are Year 6; Year 4 shows a labelled photograph).
- `build_colours_mapping.py`, rerun on a scratch copy of the merged tree, changes exactly those two things in the pin file, plus line 229 of `plans/2026-09-25-colours-mapping.md` (the same table quote). The pin test then passes, 14 of 14.
- While this check ran, the lead's `k18_follow_at_merge.py` fixed main's pin file (00:08). It is now identical to the scratch rebuild, and the colours and success-criteria pin tests pass (29 passed). **Still stale: line 229 of the mapping file.** Rerunning `build_colours_mapping.py` now would change only that line. See section 5.
- The check that its rows are the ledgers' own now runs instead of skipping, and passes. No colours row is among the rows the subject-files release recorded in the ledgers.
- `k8_repin_other_topics.py` is not needed. The success-criteria pin file merged cleanly and its test passes. A rerun would stop at its first row (SC-J11's old words are already gone) and write nothing.
- The other seven ledger pin tests (assumed knowledge, quick checks, subject files, success criteria, teach then do, vocabulary, worksheets) passed throughout.
- The pin file's `snapshot` note still says the pins were made "on the side branch streamline/7c-colours". That is true as a record, so updating it is optional.

## 3. Contradictions

None found.

- **Method frame.** The worksheets release's line in preferences ("a fill-in frame the child writes into (`method-frame` in maths) is a question") is about where the frame sits. The colours line in `maths.md` is about its colour, so both stand. One soft spot is older than the merge: a partly worked frame (the fade in `maths.md`) is one a child writes into, yet under "one line or more worked right through" it is purple.
- **Blue on the sheet.** The other two releases add no colour words to the sheet guidance or the sheet engine. The one colour line they touched ("Colour is for navigation and support, not decoration") agrees.
- **Maths file.** Colours changed the frame paragraph and the ring colour. The other releases changed the Classroom Secrets paragraph, and the worksheets pins on it pass.
- **Subject files.** No colour words in history, PSHE, RE, science, geography or maths. Colours refusing purple on a source extract sits fine beside "a history lesson need not use sources". No colours text points at the removed skill or writing guide.
- **Targeted tests on the merged tree.** The sheet engine's generated references, doc claims and both colours tests pass (18). The builder's doc claims and colours test pass (55).

## 4. Build log

- The three 25 September entries are whole and in order: worksheets (4.2.290), subject files (4.2.291), colours (4.2.292).
- No conflict marker in any tracked or staged file.
- Dashes: the merge's own edits add none. No plugin file has more em or en dashes than at HEAD (net 8 fewer). The new pin file only quotes lines that already carry them.
- Side-branch words: one, "Built on a side branch beside 7A and 7B." It is past tense and reads as history. It is loose rather than wrong, since 7A and 7B are not built yet. "the rest-of-preferences list has none yet" is still true. There is no wording about merging.
- Its "Every suite passes" is the side branch's run. The lead's run on the merged tree is the one that confirms it.
- The "Not done" line names four pictures in `plans/streamline-tools/colours-renders/`. They are on disk, but `.gitignore` now keeps them out of git, so a push will not carry them.

## 5. The lead's `k18_follow_at_merge.py`

- **The move is right.** It retitles the three COL-ADD-09 section pins with "(4.2.292)" and replaces PF-R97's table pin with the merged table. Before replacing, it asserts that the merged table is the old one with exactly the subject-files sentence inserted.
- Its output is identical, byte for byte, to what the release's own builder writes from the merged tree. The builder also rechecks every row it maps: every kept phrase found, every retired phrase gone everywhere. On the merged tree it reports `MAPPING_OK`.
- It edits only the pin file, so the mapping's line 229 still quotes the old table (section 2).
- It is safe but cannot run twice. A second run finds no old heading, stops on its own check and writes nothing.
- **No other pin passes by luck.** For every pin in all eight pin files, I compared where it is found on its own side and on the merged tree: how many times, in which paragraph, and in which section.
  - Colours pins: only PF-R97 sits in a paragraph the other side changed. The rest of the moves are sections that grew elsewhere (the circuit sentence in templates.md, the Classroom Secrets paragraph in maths.md, the log heading), and a pin checked by section passes regardless.
  - The two pin files the colours side never ran (worksheets, subject files): SJ-DEC-08-CIRCUIT sits in the table that colours changed in another row (tally chart), and it still pins its own row's sentence. SJ-A40, WS-J15 and WS-L50 sit in sections colours changed elsewhere; their own paragraphs are untouched.
  - The older pin files (assumed knowledge, quick checks, success criteria, teach then do, vocabulary): every pin whose paragraph colours changed is word for word one the colours side already ran on its branch.
