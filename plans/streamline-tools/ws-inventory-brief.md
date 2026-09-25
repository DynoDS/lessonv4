# Worksheets: the topic's part of the inventory brief (streamline topic 6)

Read `plans/streamline-tools/inventory-agent-brief.md` first and follow it, with the changes below. Where the two disagree, this file wins.

## Snapshot and file

- **Snapshot:** the plugin's working tree as it is now: lesson-v4 4.2.287 (commit `79426973`) with the success-criteria change (4.2.288) sitting uncommitted on top. Quote the working tree, not a commit, and say so in the header. Another agent is checking that change at the same time and may read the same files; neither of you changes anything in the plugin. A few of its lines may still move after its check; the quote checker catches that.
- **Ledger:** `plans/2026-09-23-worksheets-ledger.md`. Row prefix `WS-`.
- The finished success-criteria ledger (`plans/2026-09-23-success-criteria-ledger.md`) is the closest model of what a good list looks like now, including its "Decisions taken" and read-back.

## The topic

Everything the plugin says about a lesson's worksheets as teaching: when a lesson has a worksheet at all and when it does not; what a sheet is for (normally optional independent practice, and the required task-resource exception); per-child sheets, shared frames and question slips for books (the books-or-sheet mark); what a sheet may assume the child has (the board, the working wall, the teacher) and which sheets count as used on their own; fresh practice against reused lesson content; the response form each question asks for and who chooses it; how a maths sheet's questions are worded; question separation and numbering; the Expected, Below and Greater Depth sheets as the teacher meets them; the answer key; what the lesson designer records for the sheet in `lesson-design.json`; the printed page as far as it is a teaching decision (what goes first, what support sits where, blank space, one page per child); and what the programs check or refuse about sheets (`validate-lesson-design.py`, the worksheet engine in `worksheet-html`, the slip builder).

Search by meaning, not only by "worksheet": "sheet", "printed", "the page", "Expected", "Below", "Greater Depth", "books", "slips", "recording", "per-child", "shared-frame", "answer key", "response form", "contentBlocks", "the child's own sheet".

**Neighbours.** Success criteria has just decided there are none on any worksheet; its worksheet rows (its group N) are listed there, and here as shared with success criteria. Assumed knowledge (4.2.287) listed seven places that disagree about which sheets count as used on their own (its rows J03, J04 and J13 to J17, and its "For later topics" note); those are this topic's. Vocabulary, the Teach then Do rhythm and quick checks are finished. The worksheet designer's page mechanics (columns, pricing in millimetres, helper sizes, fitting) belong to topic 9 with the other designers: a worksheet rule inside the worksheet designer's file is a row here when it is a teaching decision, and marked shared with topic 9 when it is page mechanics. Adaptation's Below and Greater Depth design is topic 9 too; rows about what those sheets are for are here, shared.

**Stories and rulings.** The teacher's worksheet rulings are calibration and stay; say which are dated and whether the build log holds each.

Return the summary the general brief asks for.
