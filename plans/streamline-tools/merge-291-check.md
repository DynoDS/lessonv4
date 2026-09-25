# Check of the 4.2.291 merge (worksheets 4.2.290 + subject files)

Checked on 25 September 2026 against main's working tree, `74e66166`, `2db3ceba` and the worktree `lessonv4-subjects`. Nothing was changed; scratch is in `scratch/mchk291/`.

**Verdict: the merge is sound.** One wrong word to fix (7A should be 7B) and two small gaps in the record.

## 1. Nothing lost

- **How it was checked.** For every file the worktree changed, a three-way merge was rebuilt (base `2db3ceba`, worksheets `74e66166`, subject files from the worktree) and compared with main.
- **Result.** 57 of 60 files match exactly. The other three:
  - the build log, which differs only by the settled conflict (section 4);
  - `sj-after-summary.txt` and `sj-final-summary.txt`, whose only difference is a Windows line ending on the last line.
- **Files the worksheets release changed and the subject files did not** are untouched.
- **Skipped, rightly.** The subject-files ledger, `ledger_mapping.py` and `run-all-suites.sh` were already byte-identical in `74e66166`.
- **Removed, rightly.** The skill folder and the writing guide are gone. The only file in the plugin that still names them is the test that checks they stay gone.
- **Not carried, rightly.** The worktree's `__pycache__`.
- **Checked by hand in the files touched on both sides** (preferences, both designers, the four pin files, `ledger_pin_checks.py`): every worksheets change is present and every subject-files change arrived.

## 2. Pins

- **Worksheets pins.** Of the worksheets pins in `74e66166`, 441 sit on the 19 plugin files this release touched. Exactly three would fail on the merged tree:
  - WS-G09;
  - HOME-WS-MATHS-WORDING-02;
  - the maths section's home.
- **All three were moved, not retired.** Each now holds the undated Classroom Secrets words that are in `subject-maths.md`. HOME-WS-MATHS-WORDING-02 also gained the whole-paragraph flag, which makes it stricter. No worksheets pin was retired.
- **Retirements in other pin files** came from the branch (`sj_06`), and each matches a real removal:
  - AK-C03, SC-C15, SC-C16, TD-A14 and VOC-M15: their files are deleted;
  - SC-G02: the PSHE food paragraph is gone.
- **Tests re-run.** The ledger and pin tests, plus the three tests the release edited: 126 passed.

## 3. sj_14's records and the rewritten log paragraph

**What is true**

- All 27 rows exist in their ledgers.
- Every SJ row they cite says what the note claims.
- The teacher's words are exact, quoted from the subject-files ledger, lines 206 to 243. Some are fragments, all verbatim.
- What each note says changed matches the diff:
  - setup guide and read-me;
  - geography's reviewer line;
  - the English hedges;
  - the undated examples;
  - the Eatwell line in PSHE and science;
  - the Prophet Muhammad line in `preferences.md` and the adaptation designer;
  - RE keeping "or of any prophet".

**One error, in two places**

- **Where.** The PF-N74/N75 note and the log paragraph both say "topic 7's 7A pins them".
- **Why it is wrong.** The topic 7 plan gives the rest-of-preferences pin file to 7B (its lines 66 to 67 and B18, line 731). 7A writes the starters pin file.
- **It also reads as done.** "pins them so" sounds finished, but no pin file names PF-N74 or N75 yet.
- **Where it came from.** It began on the branch (release report line 383, second check line 132) and was kept by `sj_14`.
- **Suggested wording.** "PF-N74 and N75 are gone; when topic 7's 7B pins them, it pins them gone, never kept."

## 4. The build log

- **Order and wholeness.**
  - Lines 1 to 4470 are `74e66166`'s log byte for byte. The worksheets entry comes first and is whole.
  - Then a blank line, then the subject-files entry, also whole. It is the worktree's entry except for "(4.2.291)" in its heading and the rewritten "Not done yet" paragraph.
- **Conflict markers.** None in any tracked or new file, and no `.rej` or `.orig` files.
- **Dashes.** The merge work added no em or en dash: not in the log changes, the five ledger sections, the pin outcomes, `sj_14` or the version lines. The only dashes in added lines are the release's own quotes of existing text, the same as on the branch.

## 5. Contradictions between the two releases

**None found.**

- The worksheets entry leaves the Classroom Secrets date to this release, and this release took it.
- The maths file's sheet sections agree with the worksheets rules:
  - new numbers, never the board's questions;
  - "three to six" questions, which the worksheet designer now cites from the maths file.
- The worksheets release's edits to both designers do not touch how a subject file is read.

## Small gaps worth closing before the commit

- **WS-G09 is barely recorded.** Its change now shows only in its pin outcome and the subject-files mapping (line 530):
  - the log rewrite dropped the only line that named it;
  - `2026-09-23-worksheets-ledger.md` got no closing note, although the other four earlier ledgers did (through `sj_07`).
- **The log's test counts are the branch's.** The subject-files entry's "Checked" paragraph gives Python 2,217 and the sheet engine 722. The combined 4.2.291 tree gives 2,241 and 766.
  - This is true of the branch, but a reader of 4.2.291 may be misled.
- **The version plans are out of date.** The topic 7 and topic 8 plans still say "7A is 4.2.291". The plans say to renumber, so this is a note only.
- **Commit housekeeping.**
  - `sj_14_record_other_ledgers.py` is untracked.
  - Not yet staged: the build log's post-apply edit, the five ledgers, both `plugin.json` files and the worksheets pins.
