# Worksheets right first time: where it stands and what to do next

Written 4 October 2026 for a fresh chat. Daniel is the teacher who owns this plugin; he is not a developer. Read the Communication Style section of `C:\Users\Daniel\.claude\CLAUDE.md` before writing to him. Use the `improving-agents-and-skills` skill for the method.

## The goal, in his words

"The whole idea is making sure that the worksheet designer one-shots worksheets almost perfectly. Perfectly meaning I'm happy with them when I judge them." Two measures: the worksheet designer passes its own check on the first try, and a run almost never loses a level (Below or Greater Depth replaced by the Expected sheet). Keep the worksheet designer on Luna; move it to Sol only if fixes cannot get there.

## State of the working copy

Everything below is in `C:\Users\Daniel\Projects\lessonv4`, uncommitted, not pushed, not installed on Codex or Claude Code. The worksheet engine's 830 tests and every ledger check pass. Two SLIDE checks fail in the same working copy from the slide work of the same day (`test_a_teach_run_is_paced`, builder "in a 4.4in board every letter has the height of one readable line"); they are not from the worksheet work and must be settled before any release.

Records, pages and his judgements: `evaluations/worksheet-designer-three-runs-2026-10-04/` (README, `round2/`, `round3/`, `round4/`). The full history, his words and every page address are in the memory file `worksheet-designer-three-runs-2026-10-04.md`.

## What changed on 4 October

Engine (`plugins/lesson-v4/worksheet-html`): a too-tall single column is split into zones by the engine; one check names every refused sheet and prices each part; the no-67 rule ignores notes to the teacher and now runs in the preflight too; a 43mm trim strip (foot of portrait, right of landscape, slips untouched); one-column portrait sheets 144mm wide, left-aligned; a line between two columns; number line shorter, capped at 130mm, with `work: above | below | both`; recording tables no wider than their columns need; a sentence starter is filled in its gap OR on lines, never both; frames stop growing at what their lines use; answer blank after an equals sign; a full line for a written answer; missing-digit box drawn; tile and write-in box the same size; the asking sentence in question blue where a prompt also sets a scene; slips half a page either way with no ruled lines; a stand-in's answers printed once.

Guidance: `preferences.md` (The printed page) re-priced against the engine and the 225mm page; `adaptation-designer.md` and `lesson-designer-components.md` carry the same height, the "steps on one printed text are lettered parts" rule and (adaptation only) the no-67 rule; `worksheet-designer.md` carries the page sizes, "zones are for what must sit together", "read the prices before you cut", "a text several questions work on is not itself a question", and six page-composing habits.

## What the four rounds showed

| Round | What ran | First-time passes | Every level made |
|---|---|---|---|
| 1 | 15 worksheet runs, old adaptations | 0 of 15 | 6 of 15 |
| 2 | 15 worksheet runs, old adaptations, first engine fixes | 2 of 15 | 6 of 15 |
| 3 | 5 fresh adaptations then 5 worksheet runs | 2 of 5 | 5 of 5 |
| 4 | the same again after more guidance | 2 of 5 | 1 of 5 |

Round 4's losses were not worksheet-designer faults: a 67 in an adaptation answer (now caught), a wrong "no helper can do this" return on a poem (helper description corrected), the adaptation designer refusing to design over an old lesson design that breaks the 1 October one-answer rule, and a new adaptation photograph the test did not source. One go per lesson swings widely with the adaptation's run, so it cannot be judged from one go.

## What to do next, in order

1. **Make the measure fair before changing anything else.** Three goes per lesson, on lesson designs made under the current rules (rerun the lesson designer for the five lessons, or pick five lessons designed after 1 October), with adaptation photographs either sourced or stood in for. Count from the Codex logs: goes to first pass, failing signals, levels lost and why. The tally script is in the memory file's notes and `round3/tools`.

2. **Stop losing a level.** Tally every stand-in across the rounds by its cause, and fix the biggest cause first. The causes seen so far: a Below sheet over its page after every allowed cut (the adaptation's pricing, changed on 4 October, needs proving); a small format fault the designer never repaired (numbering conflict, a list written as an instruction, text not printed); a page that fits the estimate at 98 to 100 per cent and clips in the browser; an upstream stop (adaptation withheld, Expected returned). Ask of each refusal: could the engine do the right thing itself and say so, instead of refusing?

3. **Make the first check pass.** The first-check failures that remain are transcription slips, not design choices: `NUMBERING_CONFLICT`, `INSTRUCTION_IS_A_LIST`, `QUESTION_GROUP_INVALID`, `ANSWER_KEY_EXTRA`, `ANSWER_KEY_DUPLICATE`, `SPEC_INVALID`, `TIMELINE_ZONE_TOO_NARROW`. Two candidate repairs, to be weighed with evidence and not assumed: a scaffold that writes the worksheet's skeleton from the lesson design and the adaptation (question ids, group ids and answer-key slots already in place, as `lesson-design-scaffold.py` does for the lesson designer), so the designer fills a frame and cannot mis-number it; and an engine that repairs what it can (wrap a set in a stack, draw a multi-line instruction as a list) and reports it.

4. **Only then consider Sol** for the worksheet designer, with a matched comparison on the same inputs.

## His open notes on how sheets look

Not done: timeline labels wrapping under the next date (the timeline is one drawing shared with slides); "padding between questions" on the maths sheet (he has not yet said what is wrong); headings lining up across two columns; whether a sticky-knowledge line on a sheet should be purple with the star as on slides; sheets that are "so texty" and want pictures of the people speaking (partly upstream). Unproven on a real run: speech bubbles for what a child says, lettered parts on one poem, the poem not indented, labelled working boxes, the number line's `work` side.

## How to test without waste

- Looks: rebuild existing `worksheet.json` files with the engine and show before and after. No AI runs. `round2/tools/rebuild_after.py` and `round3/tools/finish.py` do it.
- Tries: Codex runs, counted from the logs. Launch method, model settings and the Python to hand a Codex worker are in the memory file.
- Publish rebuilt pictures under a NEW folder name each time: his browser kept old pictures when names were reused.
- Never run the whole make-lesson skill inside a worker. A full lesson is run as a real lesson run.

## Boundaries he has set

Nothing is committed, pushed or installed without his word. When he gives a direction, build it and show the result rather than returning with more options. Answer every note he gives, or say plainly which are not done.

## Round 5, the fair measure (7 October 2026): step 1 is done

Released 4.2.315 as Codex has it installed. Five lessons he really ran 4 to 6 October (Year 4 maths Lessons 22, 23, 24; RE Christingle; science digestion), each with the adaptation and pictures its own run accepted, so only the worksheet designer varies. Three goes each on Luna high. Records in `evaluations/worksheet-designer-three-runs-2026-10-04/round5/` (`goes.json`, `builds.json`, `tools/tally.py`, `tools/build_all.py`).

- First-time passes: 5 of 15. Passed in the end: 14 of 15. Three to thirteen minutes a run.
- Every level made: 11 of 15. Lesson 24 lost Below in all three goes; Christingle lost its pack in one of three.
- Of the ten first checks that failed, eight were transcription slips (`INSTRUCTION_IS_A_LIST` 2, `NUMBERING_CONFLICT` 2, `QUESTION_GROUP_INVALID`, `ANSWER_KEY_INCOMPLETE`, `SPEC_INVALID`, `PLACE_VALUE_CHART_IS_A_CALCULATION`), one was fit, one was how a returned sheet is written down (`SHEET_DIRECTED_MISSING`).
- No run of fifteen used `suggest.js` to measure.

Causes of the lost levels, for step 2:
- Lesson 24 Below (3 of 3, and the real run of 6 October hit the same): the adaptation asks for two landscape pages and in the same breath says the central write-on visual exception is "Not claimed"; the engine allows two pages only with that exception. Every go returned the sheet. Not chance, and not the worksheet designer: the adaptation designer and the engine disagree about when two pages are allowed.
- Christingle Below (1 of 3): the adaptation priced the sheet at 221mm of 225mm with five stems and twelve lines as one task; that go laid it out at 324mm and never recovered. The other two goes fitted by dropping the word bank, as the real run did. The build of the failed go also found an empty labelled diagram on Expected and Greater Depth.

## Step 2, first cause: the digit square (7 October 2026, working copy, uncommitted)

His ruling: plain practice is one page, and the column sum "could have been made smaller and still be usable". On the real Lesson 24 Below sheet printed at 12mm and at 10mm squares: "both fine". Built: a worksheet column sum prints at 12mm and may shrink to 10mm (was 14 to 15), in `shared/visuals/place-value-chart-svg.js` (`CALC_PAPER_COL_MM`), and the other written methods moved with it (`GRID_CELL_MIN_MM`, `GRID_CELL_MAX_MM` in `worksheet-html/src/helpers/methods.js`). Stick-ins and counter charts unchanged. Catalogue regenerated; four pins updated; worksheet 841, shared 243, stick-in 89 tests green (the full `run_all_checks.py` not run: another session was editing lesson-designer files in the same tree).

Proof (`round5/proof-12mm/`, released 4.2.315 plus only this change): one fresh adaptation for Lesson 24 (Sol), then three worksheet goes (Luna). The adaptation planned Below on one page by itself ("Central write-on visual exception: Not needed"), and all three goes delivered Below, Expected and Greater Depth, one page each. First-time pass 1 of 3 (two fit, one `ANSWER_KEY_INCOMPLETE`). No new guidance was added: the one-page rule already existed. Seen and not fixed: in one go the shared instruction sits in the row beside (1a), pushing the sums right.

Still open in step 2: Christingle Below (a plan priced at 221 of 225mm). Then step 3, the transcription slips.

## His two notes on the proof pages (7 October 2026, working copy, uncommitted)

1. "3 is untidy": the shared instruction sat in the row beside (1a) and squeezed the two grids to different square sizes. Already repaired in the unreleased commit `ba72e27c` (the line goes above the row); the proof had run on released 4.2.315. Rebuilt with the branch engine: instruction above, squares equal.
2. "when it says answer to write down and then counters, the line is miles away, it should be right next to it". Three engine changes in `worksheet-html/src/helpers/text.js`, each with a test in `test/drawn-boxes.test.js` (844 green):
   - a gap written into a question (`___ counters`, `7 + ___ = 10`) is its answer place, so no second blank is added at the page edge (`answerInTheWords`, which replaces `answerAfterEquals`);
   - a question on several lines keeps its blank beside a short last line, as a one-line question already did; a last line that asks for words is left alone;
   - a unit printed on its own (an `instruction` of one or two lower-case words) is drawn with its answer line (`withItsAnswerLine`).
   A sentence telling the worksheet designer to write gap and unit together was tried first and did NOT take: two goes of three on Luna still printed the bare word with the sentence read. It was removed and the engine draws the line instead. Proof: `round5/proof-unit/` (three goes, working copy; every level on one page; first-time pass 1 of 3, the other two `NUMBERING_CONFLICT`). One go printed no unit line at all (the answer goes in the grid).

## Round 6 and the blank sign (7 October 2026, afternoon; working copy, uncommitted)

Step 3 first: of 14 failed first checks in round 5 and its proofs, `NUMBERING_CONFLICT` was 4 (a Part written as a bare one-question set with a group id). The engine now makes the wrap itself (`worksheet.js`, test in `nested-numbering.test.js`); several questions under one group id are still refused. `INSTRUCTION_IS_A_LIST` (2) was a three-sentence story written as an instruction, which the agents then moved to `source-text`: left alone, because that refusal protects his success-criteria ruling. Christingle's lost pack was one go splitting one task into five writing frames (1 of 55 packs across all rounds): no change.

Round 6 = the same fifteen on the working copy (Lesson 24 with the fresh adaptation): passed in the end 15 of 15 (was 14), first-time 6 of 15 (was 5), every level 12 of 15 (was 11). Lesson 24 and Christingle whole in all goes; `NUMBERING_CONFLICT` gone. But Lesson 22 lost Below in 3 of 3 (0 of 3 in round 5). Six isolating goes (`round6/isolate/`): released plus the size change 1 of 3 returned, branch HEAD 2 of 3 returned, so not one side's change. Cause: the adaptation asks for an empty column frame with the sign left blank for the child to choose, the `calculation` drawing always printed a sign, and the worksheet catalogue never mentioned `calculation` at all (agents found it by reading source). Round 5's agents had quietly drawn a plain blank chart instead.

Built: `operator: ""` leaves the sign's place empty (`normaliseCalculation`, test in `shared/test/column-calculation-svg.test.js`); the `place-value-chart` purpose now names `calculation`, the empty frame and the blank sign (213 characters, limit 220); and a question whose answer line is printed with its unit further down keeps no second line (`holdsAnswerLine`, `answerBlank` in `worksheet.js` and `text.js`). Full suite green: 5,174. Proof (`round6/sign/`): three Lesson 22 goes on the working copy, Below made in 3 of 3, two of them using the blank sign and passing first time.

Counting Lesson 22 from that proof, every level is now made in all fifteen. Not yet re-measured as one clean fifteen. Still open: first-time passes (6 of 15), the story-as-instruction false alarm, answer-key slips (`ANSWER_KEY_INCOMPLETE`, `ANSWER_KEY_EXTRA`), and whether Sol is needed (step 4). Today used 45 Luna runs and 1 Sol run.
