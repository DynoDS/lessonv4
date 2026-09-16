# Review bundle manifest

Base revision `38c6a07cdd800cbb6e81785e065ad06a25f17a4c` (4.2.212). Head revision: the last commit on branch `lesson-designer-quality-2026-09-15`, named in `../report.md` section 1. Everything here was produced on this machine between 15 and 16 September 2026.

No credentials, no conversation history and no pupil-identifying material. The teacher's taught deck (`E:\Felmore Primary School\2026-2027 - Year 4\Autumn 1\Week 2\History\Why did Tudor children work.pptx`) is referenced by path and not copied.

| File | What it is | Trial or change it belongs to |
|---|---|---|
| `kit-preview/Why did Tudor children work - Stick-in Sheets.html` | The printable card kit built by the new `card-set` renderer from `plugins/lesson-v4/stick-in-sheets-html/test/fixtures/card-kit.json`: the now/later apprentice sort as a table kit, one set between two, class of 30, five pages. The `.html` fallback, because Chrome's PDF step (`puppeteer-core`) is not installed on this machine and the build reported `PDF_SKIPPED`; it is the same file the PDF prints from. | Section 7C, commit `113dab9b` |
| `kit-preview/Why did Tudor children work - Stick-in Sheets - Answers.txt` | The teacher's half of the same kit: the key card by card, the preparation line, the accepted second placement. Written to a separate file so it never reaches a pupil page. | Section 7C |
| `kit-preview/kit-page-1.png` | Screenshot of page 1 of the pack, so the pupil-facing result can be inspected without opening the file. | Section 7C, rendered check |
| `../judgement-cases.md` | The fourteen fixed judgement cases with their predefined expected findings, provenance and reasons. Evaluation material, not runtime guidance. | Section 9B |
| `../fixed-cases/blind-cases.md` | The same cases with the expected column stripped, as both reviewers received them. | Section 9B |
| `../fixed-cases/review-candidate-guidance.md` | Fourteen verdicts from a Claude subagent following the candidate reviewer's guidance. | Section 9B |
| `../fixed-cases/review-baseline-guidance.md` | The same, following the baseline reviewer's guidance at `38c6a07c`. | Section 9B control |
| `../fixed-cases/result.md` | Verdicts against expectations, and what the batch does and does not show. | Section 9B |
| `../trial-protocol.md` | The frozen briefs, launch settings, budget, stopping rule and scoring questions, written before any trial ran. | Section 9C |
| `../trials/` (see `../trials/README.md`) | The six fresh designs as first returned, plus any partial walk-through from the attempts a usage limit cut off, kept in each trial's `interrupted-attempt` folder rather than deleted. | Section 9C |
| `../pair-comparison.md` | The blind judgement of the three pairs against the four frozen questions, with the evidence quoted from the designs. Written before the arms were unblinded. | Section 9C |
| `blind/key.json` | Which lettered design in each pair was the baseline and which the candidate. Held back from the judge until after its answers were in. | Section 9C |
| `../baseline-failures.md` | The eleven pytest failures and one node failure present at the base revision on this machine, so new failures can be told from old. | Section 9A |
| `../report.md` | The implementation report. | All |

The lesson trials are stored outside this bundle folder, under `../trials/`, because they are plain text and small; nothing in them is private to a pupil or a school.
