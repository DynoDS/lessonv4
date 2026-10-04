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
