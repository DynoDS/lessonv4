# Teacher answer sheet

Written 30 September 2026. Steps 1 to 7 were built the same day (uncommitted, version 4.2.305, every automatic check green); step 8, the live runs, and step 9, the release, wait for Daniel.

Differences from the plan as written, found while building:
- The designer's section grew by about 2 KB rather than staying the same length.
- The designer keeps two rules the first draft dropped: a labelled entry (`"Model response"`) for an open task with no printed number, and the `answer.kind: none` sentence word for word.
- The build also keeps the answer sheet's HTML beside the PDF, as each pupil sheet does; only the PDF is delivered.
- The run-report line naming `ANSWER_LONG` was left out: it pushed the delivery slice past its size limit and a guarded paragraph. The builder still passes the lines through under Notes.
- The worksheets ledger pins (`scripts/tests/worksheets_ledger_pins.json`) were moved to the new wording, with the old text-file wording pinned as gone.

## The short version (for Daniel)

**What you asked for:** the text file of answers hasn't worked in class. You want an answer sheet a tired teacher can mark from at a glance.

**What you approved:** mock-up 2 (`Place value problem solving - Answers MOCK-UP 2.pdf`, in the lessonv4 folder).
- One side of A4, turned sideways.
- Below, Expected and Greater Depth in three columns.
- Each question shows its label and a short green answer.
- A few grey words appear only where they save a marking mistake.
- A small picture appears only when words can't give the answer.

**What we'd build:**
1. The worksheet designer writes short marking answers instead of model paragraphs. The long, careful answers upstream stay as they are, because they are what makes the questions right.
2. The sheet engine prints those answers as the approved page, in place of the text file.
3. Everything that expected the text file (the runner, the builder's report, the delivery to your drive, the tests) takes the new PDF.

**How we'd check it:**
- Rebuild the answer sheets for five saved lessons without rerunning them.
- Then run one real lesson on Claude Code and one on Codex, so the designer's short answers are tested for real.

**Decisions for you:** none are outstanding. Your rulings are listed at the end, so nothing gets reopened.

## What was found

**1. The key is written for study, not marking.**
- The worksheet designer copies the upstream answers faithfully: the lesson design's `answer` (`content` plus `acceptanceCondition`) for Expected, and the adaptation's answer blocks for Below and Greater Depth (`agents/worksheet-designer.md`, "Pupil sheets and the separate answer key").
- Those upstream answers are deliberately full. The adaptation designer is told to test every boundary case and counterexample (`agents/adaptation-designer.md` line 294), because that is how the question gets made right.
- So the place value key's Greater Depth (3a) carries four lines of near misses, and (2) a three-sentence model plus a three-sentence acceptance.
- Nothing between upstream and the key turns a full answer into a marking answer. The job belongs to the worksheet designer, who already owns the key.

**2. The engine has only a text form.**
- `build-worksheet.js` writes `renderAnswerKey()` output (`src/worksheet.js`) to `[Topic] - Answers.txt`.
- It is written even when no PDF can be made, and deleted when the pack is refused.
- The designer is told not to spend effort on answer presentation.

**3. Most of what the new page needs already exists.**
- The engine already matches key entries to printed labels (`answerKeyOf`), so every printed question gets exactly one answer.
- It already has the stand-in wording for a tier the Expected sheet replaced.
- The page's colours and font come from the worksheet's own tokens.
- Pictures drawn from the shared drawings can print a finished answer in green (number line `answer`, place value chart `answer: true` rows, `||` cells in pyramids, times-table grids, label diagrams and tally charts), because the answer slides use them.

**4. A mock-up finding the build must allow for.**
- Drawing a sheet's place value chart small, with a blank row, set off `PLACE_VALUE_WRITE_IN_TOO_NARROW`, which protects a child's writing room.
- An answer picture is finished, so it has no blank row and should not meet that refusal.
- If some drawing still refuses at column width, the answer prints as words and the build says so. The key is never lost.

**5. Consumers of the text file.**
- `scripts/run-fixed-resource.py` line 133 (the worksheet outputs it expects).
- `scripts/deliver_files.py` (its " - Answers.txt" rule stays, because the stick-in card kit still writes one, ruling 5).
- `agents/worksheet-builder.md` (description, the `Built answers:` row, the report line).
- `skills/make-lesson/playbook-lite.md` lines 1167 and 1589 to 1591.
- `references/worksheet-helpers.md` (`answerKey` row and example).
- Tests: `worksheet-html/test/chrome.test.js`, `omit-unfittable.test.js`, `stand-in.test.js` and `worksheet.test.js`; `scripts/tests/test_run_fixed_resource.py`, `test_deliver_files.py`, `test_letterbox.py`, `test_run_report.py` and `test_a_card_kit_reaches_the_table.py`. The card-kit test is the stick-in text file, so it should stay green untouched.

## Proposed changes, in order

Each step is small enough to review on its own. Nothing is committed, pushed or installed without Daniel's word.

**Step 1. The key's shape** (`worksheet-html/src/worksheet.js`, `answerKeyOf`).
- An entry becomes `{ "question", "answer", "note"?, "picture"? }`.
  - `note` is a string.
  - `picture` is one worksheet helper spec.
- Refuse a `picture` whose `helper` is not a worksheet helper (`ANSWER_PICTURE_UNKNOWN`), naming the question.
- Keep `note` and `picture` on the normalised entries.
- Every existing refusal (missing, extra, duplicate, invalid label) is unchanged.
- An old spec whose `answer` runs over several lines still validates. That is how saved lessons rebuild (Step 2).

**Step 2. The answer page** (new `worksheet-html/src/answer-sheet.js`, replacing `renderAnswerKey`).

Layout, to match mock-up 2:
- A4 landscape, 10mm by 12mm margins.
- A header line: "[lesson] - Answers" in navy, and "Teacher only" in quiet grey.
- Three columns that flow.
- Each level starts a new column under a navy bar: "Below (B)", "Expected (E)", "Greater Depth (GD)". There are no codes when there is only one level, as the sheets do.

Each entry:
- The label in question blue, then the answer in green bold.
- An answer longer than one line prints green regular, which the mock-up showed reads better.
- The `note` sits beneath in grey at about three-quarters size.
- A `picture` is drawn at column width with the worksheet renderer, under its answer.

Other rules:
- An old multi-line answer prints its first line as the answer and each later line as a note, with any "Acceptance:" prefix dropped.
- The stand-in sentence for a replaced tier prints under that level's bar, in the same words the text file used.

Fit:
- Print once and count the sides.
- Over two sides: step the text down to a floor (answers 10pt, notes 8pt) and reprint.
- Still over two: keep the third side and print `ANSWERS_THIRD_SIDE` with the page count for the report. Never drop or shorten an answer (ruling 4).

Reuse `cssVariables()` and the helper CSS so the colours and font are the sheets' own. Retire `renderAnswerKey` and its text output, and keep its stand-in wording.

**Step 3. The build** (`worksheet-html/scripts/build-worksheet.js`).
- Write `[answerBase] - Answers.pdf` where the text file was written, and print `Built answers: <path>`.
- With no PDF maker (`PDF_SKIPPED`), write `[answerBase] - Answers.html` and list it with the other HTML, as the sheets do.
- A refused pack removes the answer files, as it removes the text file today.
- The answer page is never merged into the pupil PDF. Both stay separate files, which is the existing reason `sheets.answers` is refused.

**Step 4. Short marking answers** (`agents/worksheet-designer.md`).
Replace the answer-key paragraphs from "Instead, every populated pupil sheet must have a complete top-level `answerKey` section" to "spend tokens making it attractive." with the wording in the next section. It is about the same length, so the file does not grow; that matters because Codex reads this role in pages (4.2.298). `agents/worksheet-designer-focused-repair.md` needs no change: it only asks the repair to keep the key aligned with the sheet (checked 30 September).

**Step 5. A preflight advisory** (`worksheet-html/scripts/check-worksheet.js`).
- `ANSWER_LONG`, advisory only and never a refusal. It names any entry that prints more than two lines at the page's column width: "(3) prints four lines on the teacher sheet. Say the answer and the idea that decides the mark."
- This is how a paragraph slipping back in gets seen, on Codex especially, without a word count. The layout does the measuring.

**Step 6. Everything that named the text file.**
- `run-fixed-resource.py` expects `- Answers.pdf`, or `- Answers.html` when Chrome is unavailable.
- `deliver_files.py`: the PDF is already a resource. Keep `ANSWER_KEY_SUFFIX` for the stick-in card kit's text file, and reword its comment so it names that file.
- `worksheet-builder.md`: description, the success row ("the separate teacher answer sheet, a PDF"), and the report line.
- `playbook-lite.md`: "Require the complete answer key as a separate teacher answer sheet", and the Phase 5 list names "the answer sheet".
- `worksheet-helpers.md`: the `answerKey` row and example show `note` and `picture`.
- Tests updated to the PDF, plus new tests for the new page:
  - three levels fit one side;
  - a long pack reaches the text floor before a third side;
  - a picture entry draws;
  - an unknown picture helper is refused;
  - an old multi-line key prints as answer plus notes;
  - a stand-in level shows its sentence;
  - with no PDF maker, the HTML is written.
- Undo the Step 2 fit rule in a scratch copy and confirm the "floor before a third side" test fails.

**Step 7. Check on saved lessons.**
- Rebuild the answer sheets from saved `worksheet.json` for:
  - place value problem solving;
  - explain how the digestive system works;
  - how did children's leisure time change;
  - make sensible choices in different situations;
  - Roman numerals to L.
- These keys are the old long ones, so this checks layout, fit, stand-ins and the old-key path, not short answers. Look at every page at print size.

**Step 8. Live runs.**
- One lesson on Claude Code and one on Codex, as every change is tested on both.
- One maths and one non-maths (history or science), so the reasoning and opinion wording is exercised.
- Judge each key against the mock-up: one line where it can be, the verdict and deciding idea for reasoning, notes only where they save a marking mistake, a picture only for a drawn or placed answer.

**Step 9. Release.** 4.2.305. Commit and push only on Daniel's word. Reinstall in Codex (`codex plugin add lesson-v4@lessonv4`) and check the version.

## Wording for the worksheet designer (Step 4)

This replaces the current paragraphs from "Instead, every populated pupil sheet must have a complete top-level `answerKey` section" through "spend tokens making it attractive."

> Instead, every populated pupil sheet must have a complete top-level
> `answerKey` section:
>
> ```json
> "answerKey": {
>   "below": [
>     { "question": 1, "answer": "Smallest 4,068. Greatest 8,640.", "note": "Not 0,468: zero can't go first." }
>   ],
>   "expected": [
>     { "question": "1a", "answer": "9,642" },
>     { "question": 3, "answer": "Yes. 0 can't go first, so 2 does: 2,058." }
>   ],
>   "greaterDepth": [
>     { "question": "4a", "answer": "5 and three smaller cards, e.g. 5, 3, 1, 0" }
>   ]
> }
> ```
>
> Use one entry for every numbered question the child sees; `question` is the
> label the engine prints. The builder prints the key as the teacher's answer
> sheet: every level in columns on one side of A4, each label with its answer in
> green. The teacher marks from it at the end of the day with a pile of books,
> so write each entry to be read at a glance: what the teacher needs to tick
> the child's work, one line where it can be and never more than two. An entry
> that reads like a model paragraph gets skipped, and then the sheet has failed
> the teacher it was for.
>
> - **`answer`** leads with the answer itself: the number, the word, the list,
>   the choice. For a reasoning question, give the verdict and then the one idea
>   the child's reason has to contain ("Yes. 0 can't go first, so 2 does:
>   2,058."; "Only tiny pieces can pass through the gut wall into the blood.").
>   The teacher ticks any wording that carries that idea, so this is what
>   decides the mark, not a model to compare against. Several right answers: a
>   short set is listed in full ("3,268 or 3,286"); a set too long to list
>   becomes the rule and one example. An open or opinion question: what any good
>   answer needs, and one short example ("Either view. Must use a fact, e.g. he
>   stopped young children working in mines.").
> - **`note`** is optional and a few words long. Use it for the one thing a
>   teacher would otherwise mark wrongly: the usual wrong answer ("Not 0,468:
>   zero can't go first.") or a partial answer that still earns the tick ("Some
>   of them is fine."). Leave it out whenever the answer says enough.
> - **`picture`** is only for an answer the child draws or places, where words
>   would take a sentence and still leave the teacher unsure: a shape reflected
>   on a grid, lines of symmetry, a working circuit, a route on a map, a sort
>   with many items. It is the sheet's own figure spec, finished, with the answer
>   drawn in green wherever the figure can show one. A number in a chart, a
>   matched pair, a lettered label or a shaded fraction is words ("Any 3 of the
>   8 parts"), not a picture.
>
> Take every answer from its source: the lesson design's structured `answer`
> for Expected, the adaptation's answer blocks for Below and Greater Depth.
> Those carry the full model, the acceptance condition and every boundary case,
> which is how the question and its answer were made right. The key keeps their
> result and the idea that decides the mark, and never changes what counts as
> right. Calculate deterministic answers. Do not reverse-engineer an Expected
> answer from its question. `answer.kind: none` supplies no answer content: when
> such a task carries a printed number, its entry says what a correct response
> must show, and when it has no printed number it takes no entry. Worksheet
> answer delivery is always teacher-only. The final JSON is not complete while
> any pupil sheet lacks its own answer section or any numbered question lacks an
> entry.
>
> The builder lays out the answer sheet: the columns, the colours, the pages.
> You write the entries and design no page.

## His rulings (30 September 2026), so nothing is reopened

- The text answer file is retired for worksheets. The answer sheet replaces it.
- No whole sheet mirrored with answers filled in. That was mock-up 1, and he called it "too complicated".
- Short answers for a tired teacher. Accept notes only a few words, and only when they help.
- A picture only when a text answer won't work, drawn small with the answer in green.
- One side if possible, two at most. Shrink the text before a third side, and never cut an answer.
- Several answers: list a short set, or give the rule plus an example. Reasoning: the verdict and the deciding idea. Opinion: what a good answer needs plus an example.
- Stick-in card-sort answers stay a text file for now, and get the same treatment once this works.
