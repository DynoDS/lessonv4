# Worksheet designer: three runs of the same lesson, 4 October 2026

Daniel's aim: the worksheet designer should get worksheets right first time. Five real lessons, each given to the worksheet designer three times on Codex with nothing changed between the runs. He judges the results level by level on the page; his answers then go through the improving-agents-and-skills method.

Comparison page: https://claude.ai/artifact/WYXqdgJAHEuD9wUGdJTrjj. His answers are stored in its `votes` collection, one document per lesson (`subtract`, `renga`, `divisibility`, `leisure`, `choices`), holding `rows` keyed `below-1`, `expected-1`, `greaterDepth-1`, `answers-1` with `c` (A, B, C or same), `w` (something is wrong on all three) and `n` (his thoughts), plus `notes` for the lesson as a whole. A, B and C are simply runs a, b and c: there is no blind, all three are the same thing.

## How the runs were made

- Lessons and their source folders are in `lessons.json`. Each run folder under `runs/` holds only the inputs: lesson design, helper check, adaptation, the two photograph contracts and the lesson's delivered pictures. No earlier `worksheet.json`.
- Launch message: the Track B block from `playbook-lite.md`, in `launch/`. Photograph contract: the provisional adaptation contract, as a first attempt receives. Plugin root: the working copy (4.2.310 plus the uncommitted slide work of 4 October).
- Codex: the desktop app's `codex.exe` 0.160.0 (`codex exec`, `gpt-6-luna`, effort high, workspace-write sandbox, the run folder as its root). The npm Codex 0.154.0 does not know Luna. PYTHON is Codex's runtime Python, the one `find-python.js` returns inside the sandbox; the user's own Python is refused there.
- No repairs were added. `tools/finish_lesson.py` runs the fixed worksheet build on what each run left and turns the PDFs into pictures; `tools/build_page.py` makes the page. Records per lesson are in `records/`, Codex logs in `logs/`.

## How the fifteen runs went

No run passed its own check first time. Runs took 11 to 32 minutes.

| Lesson | A | B | C |
|---|---|---|---|
| Y4 maths, subtract | passed, all levels (no separate Below by design) | passed | passed |
| Y6 writing, renga | passed | passed | did not pass; Expected stands in for Below and Greater Depth |
| Y6 maths, divisibility | passed only by returning Below and Greater Depth upstream; Expected stands in for both | did not pass (Below over the page); stand-ins | did not pass (Below over the page); stand-ins |
| Y4 history, leisure | did not pass (Below over the page); Expected stands in for Below | did not pass; the build refused it (INSTRUCTION_IS_A_LIST), no sheets | passed |
| Y4 PSHE, choices | passed | passed | passed |

Where a build first refused, it was run again with `--omit-unfittable`, the plugin's own last resort.

## Two things found before he judged anything

1. The no-67 rule fires on the designer's own note to the teacher. Leisure A's note quoted "267mm available" (the page height the check itself prints) and leisure C's "167mm over"; the build refused both with NUMBER_CONTAINS_SIX_SEVEN. Leisure C had passed `check-worksheet.js`, so the check and the build disagree. For the page only, `runs-note-reworded/` holds copies with that one note reworded; nothing a child reads was changed. Not fixed in the plugin.
2. In three of five lessons a Below sheet would not fit its page after every cut the adaptation allowed (divisibility in all three runs, leisure in two). That points upstream at the page plan the adaptation hands over, or at how the designer sizes the page, not at chance.

Nothing in `plugins/lesson-v4` or `working/` was changed.
