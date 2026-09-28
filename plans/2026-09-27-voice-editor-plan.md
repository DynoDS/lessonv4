# A voice editor after the design review: investigation and plan (27 September 2026)

Status: decided and built as 4.2.299 (27 Sept), then repaired after one independent check the same day (section at the end); suites green apart from nine failures that are not this release's; not committed, not yet installed in Codex, not yet run live. Method: `improving-agents-and-skills` (identical to github.com/DynoDS/improving-agents-and-skills, checked 27 Sept). His decisions and the build record are at the end; the proposal below is kept as it was written, and the decisions win where they differ.

## What the evidence says

All runs are Year 4 History lesson 5 (leisure). Pages and folders are in `evaluations/trial-2026-09-27/`.

- The reading fault (4.2.298) was real but not sufficient. With every instruction arriving whole, the Codex designer on astra high produced a sound structure (a clear shape, a changed/continued sort, a model answer matching the final task). It still wrote adult, caveat-led wording with no story, no people and no light moment.
- The Codex design reviewer on astra high caught four real teaching faults: Do beats that repeat the explanation, a final task that only reassembles given answers, missing pictures, and an overloaded board. Its string-by-string voice sweep changed 4 of 62 strings and passed the adult register.
- A focused voice pass (only `teacher-voice.md`, the Shaftesbury calibration and Daniel's end goal; not told what was wrong) on the reviewed lesson:
  - **sol medium:** the warmest Codex wording of the day (Sarah Gooder, washing the dishes, "Great, time to play!", steam explained) in 12 minutes.
  - **sol low:** nearly as warm, but it dropped the real person, used harder words and flattened the action notes. The saving was small (about 15% of input tokens).
  - **luna xhigh:** a light polish at five times sol medium's tokens.
- Focus, not thinking, is what moved the voice. A voice pass cannot add a story the designer did not choose, and it did not remove the plan-note cautions, because it was told to keep what the lesson teaches.
- The slides built from sol medium's wording kept the warm lines in the notes. Voice guide §2 says "Short/direct can become the slide. Fuller/conversational can expand it in the notes. Do not normally reverse this relationship". Daniel ruled against that on 14 Sept ("never one and definitely not the other") and again on 23 Sept ("most of the time a teacher does not read the speaker notes. So the board has to show the teaching").
- Slides 4 to 6 were bare because the design had no pictures there. The reviewer's redesign, skipped in the test, would have been sent to add them. Slide 4's biggest box showing the dates is a separate slide-designer fault (fix-later 30).

## Earlier decisions this touches

- **One reviewer (10 Sept):** "Once it's downstream, it's being made." The voice editor is not a reviewer: it edits words in place and passes no verdict. It is, however, the first semantic worker after the review, and Daniel should confirm that.
- **The parked designer split (branch `agent-split`, 4.2.51, 31 Aug):** a decider that left placeholders, a words-writer (`lesson-author.md`, sol high) writing every word from specs, a worksheet content designer, and two reviews. It ran once (Y4 circuits, about 90 minutes). The old route did better, and most of the faults were decision faults. This plan is much smaller:
  - the designer still writes a complete, valid lesson with real words;
  - the voice editor edits in place;
  - there is still one reviewer;
  - if the voice editor fails, the run continues with the reviewed words.
- **Reuse from that branch rather than rebuild:** its lane checker `scripts/check-design-ownership.py` (it diffs a writer's output against its baseline and refuses changes outside its lane or to the photo contract), and its lesson learned: "a new route is not wired until every always-loaded rule that names roles by name has been re-read against it".
- **Teacher voice ownership (31 Aug):** the register lives in `teacher-voice.md`, and Written Voice keeps what words must achieve. The reviewer's voice sweep is pinned by `test_teacher_voice_reach.py` and `test_reviewer_voice_authority.py`, and the review packet's `verify` checks the sweep's count and its "closest to a repair" quotes.

## Proposal

### The new worker: `voice-editor`

- **Job:** make every word children see or hear sound like Daniel and make sense to the child who understands least. It changes wording only: never what is taught, the order, what a task asks children to decide, an answer's meaning, a number, an id or the photo contract. It may add a sentence the words need (explaining what steam does) and a light line where the material offers one. When it cannot word something without changing a decision, it writes a flag instead of redesigning.
- **Reads:** `teacher-voice.md` whole, Written Voice core rules and read-back, the Shaftesbury calibration, and the end goal. Worksheet words use the guide's sections for questions, instructions, success criteria and model answers, plus `subject-maths.md` → How a maths sheet's questions are worded. There is no separate worksheet voice file.
- **Owns:** child-facing string values in `lesson-design.json` and the matching passages of `design-decisions.md`, plus a short `voice-edit.md` of the main changes.
- **Guarded in code, not prose:**
  - the lane checker (ported from `agent-split`) with a numbers check, so every number in a changed string survives unchanged;
  - `validate-lesson-design.py` must pass;
  - the photo contract must be untouched.
- **Settings:** on Codex, sol medium (tested). On Claude, untested: suggest opus at medium and compare once.

### Where it runs

After the review is approved and its postflight verified. Alongside it: the helper check, the photo freeze, picture compilation and the image scouts, none of which read wording. Waiting for it: the slide designer, worksheet routing and adaptation, the wall and the stick-ins, all of which copy the words. The added wall time is roughly the voice pass minus the picture stage it overlaps. Later focused repairs that reword a string do not pass through it; record that as a known gap.

### What the lesson designer keeps and loses

- **Keeps (teaching decisions made in words):**
  - Tell the lesson before any slide: background first, one story, examples children can picture, the recap, the hands-up read-back for missing knowledge;
  - `How this teacher explains` (takeaway, because, example, what it is not);
  - the Shaftesbury calibration;
  - vocabulary choice and what each definition means;
  - task design (one ask at a time, the response form, actionable instructions);
  - success-criteria method.
- **Loses to the voice editor (how it sounds):**
  - Speaker Notes Voice register guidance (keep one line: each script is the telling's words for that slide);
  - the four surface tells;
  - the completion pass's Written Voice read-back and voice pre-flight;
  - "put the script's words on the board";
  - the humour question (the designer still chooses the vivid material);
  - the whole voice guide and Written Voice as extra role pages (reverse today's companion bundle for this role, and keep the reader mechanism for other uses).
- **Measured:** about 30,000 of the designer's 154,000 characters mention wording, plus the 88,000 characters of companion pages added today.

### What the design reviewer keeps and loses

- **Keeps:** every teaching check, including whether each explanation walks the child through the thought, whether needed knowledge is taught, and whether the board carries the teaching.
- **Loses:**
  - "First: authored wording" (the string-by-string voice sweep and its report);
  - register judgements in §4 (it keeps the comprehension and agreement checks).
- **The packet's `verify` stops requiring the sweep receipt.** The voice editor's report can carry a similar, small check.

### Adaptation and worksheets

The adaptation designer writes Below and Greater Depth words after the voice editor. It keeps its own wording guidance, unchanged. The worksheet designer never rewrites question text, so the Expected sheet's wording is the voice editor's.

## Separate items, not in this plan

- The plan converter's "Watch for" column writes historians' cautions that Codex turns into the lesson's thread (scheme-to-long-term-plan). Designer judgement of plan notes is also involved.
- Why the astra designer decided the work/time Teach needed no picture ("No factory photograph is needed because..."). Daniel: investigate afterwards.
- Slide designer faults: fix-later 30.

## Build and test outline, after his decisions

1. `voice-editor.md`, the worker-launch spec, the playbook step, the SKILL.md role lists, and the lane checker port with its tests.
2. Designer and reviewer strip, word for word. Every moved rule is accounted for in a ledger (the streamline method), with pins moved and suites green.
3. Voice guide §2 aligned to his 14 Sept ruling, if he confirms.
4. One independent check of the whole change.
5. One Codex run of a fresh lesson (not leisure): designer, review, voice editor, slides. Daniel judges the result.

## His decisions (27 September 2026)

- **A. Name:** `lesson-voice-editor`, so it sits beside the lesson designer and the design reviewer.
- **B. Order:** designer, then design reviewer, then the voice editor. No reviewer after it. Easy mechanical checks are fine; otherwise trust the agent.
- **C. Jokes:** the voice editor decides whether there is a light moment.
- **D. Board and notes:** the chatty version goes in the speaker notes, but the board loses nothing. A reason, an example or a question that teaches is on the board too, in shorter words.
- **E. Worksheets:** yes, the voice editor also words the Expected sheet (its questions live in `lesson-design.json`). The adaptation designer is unchanged. There is no separate worksheet voice guide.
- **F. Testing:** one independent check of the whole change, then one Codex run of a fresh lesson (not leisure). "Don't worry if it needs to be redesigned." Later the same day: "when you test it, test it on codex first."
- **Who owns the board (his "Yes"):** the lesson designer decides what goes on the board. The voice editor rewords inside those pieces, and a light line goes inside a sentence already there or in the script, never as a new piece. The slide designer only lays the pieces out.

## What was built (4.2.299)

- **The agent:** `agents/lesson-voice-editor.md`. Opus medium on Claude, `gpt-6-sol` medium on Codex (a new `sol6` setting in `worker-launch.py`; the other Codex roles stay on their current models until he decides). Its role read brings `teacher-voice.md` whole, Written Voice core rules and read-back, and the Tudor and Shaftesbury calibrations (six pages, about 107 KB, all read in single calls since 4.2.298).
- **Moved to it word for word:** the reviewer's string-by-string sweep method and its six real misses, the designer's script voice and register tells, "put the spoken question on the board", the light-moment reasoning, and the four surface tells for every string.
- **The lane check:** `scripts/check-voice-edit.py` (new, written for this rather than ported from `agent-split`; rebuilt after the independent check, below).
- **The pipeline:** first built as Phase 1.4, beside the helper check; moved after the independent check to Phase 1.6, after it (below). A `voice-edit` slice in `make-lesson-runtime.py`; the slide, worksheet, wall and stick-in designers wait for it. The playbook's size allowance rose by 3.5 KB to hold the step.
- **The lesson designer:** keeps every teaching decision made in words: the told lesson, how this teacher explains, the directing-script tell, vocabulary, task wording choices and the §5 check of each Teach board's takeaway and reason. It loses the register tells, the humour question, the script-beside-board pass and the companion pages.
- **The design reviewer:** "First: authored wording" became "First: what the words teach". It judges what words teach; how they sound is not its to judge or repair. The Voice sweep report section, its count and closest calls, and the packet's check of them are retired.
- **The voice guide:** the "How to read" routing sends §4 to the voice editor, and §2 now says fuller means more words, never more teaching, with his 23 Sept quote.
- **Tests and ledgers:** about 130 ledger pins follow their rules to the new homes, each row noting this release. Every voice test now points at the file that owns the rule. `test_lesson_voice_editor.py` covers the lane check. Final counts are in the section below.

## The independent check and its repairs (27 September 2026)

One fresh reader compared 4.2.298 with 4.2.299 rule by rule, read only. It found three serious faults, six medium and some stale text. What was done:

- **The lane check refused every multi-line string** (284 across 85 saved designs), because it searched the printed view for each string. It now matches whole strings against the class view's own list (`class_view_blocks`, split out of `build_class_view`), labels included, since a beat's label is its slide title. Re-tested: 2,236 neutral rewordings across the 85 designs, none refused.
- **The editor's map was the pre-review view.** `snapshot` now writes `voice-edit-view.md` from the approved design, and the editor reads that.
- **The helper check ran beside the editor but can revise the design.** The editor now runs after it (Phase 1.6); pictures still start beside the editor; a content-gap picture wave waits for it.
- **The lane was narrower than its instructions claimed.** It now also catches, slide by slide and string by string: a spelled-out number swapped for another, thousands commas read as the same number, the taught word gone from a board even while the script says it, and a person or place the approved lesson never mentioned. A short teacher-only answer no longer slips through as a fragment of a longer class string. It is still a floor: a swapped pair of dates or a meaning reversed in plain words passes, and the instructions now say so rather than claiming more.
- **A failure threw away the whole edit.** After the one retry, `settle` now puts back only the strings at fault; a change of structure restores all three files (`restore` does the same by hand). On the three trial passes it keeps 53 of 62 edits (sol medium), 49 of 63 (luna xhigh) and 42 of 53 (sol low). What it put back was out of lane in every case checked: a named mine child and new law details added to a starter the reviewer had corrected, the taught word `leisure` swapped for `time to play` on the boards that taught it (all three passes did this), invented card numbers and an invented child.
- **Rules lost on the way over, restored in the editor word for word:** judge both what a child can do and whether these are this teacher's words; run the voice judgement even when the knowledge is secure; use §5 to compare a doubtful sentence; stating the relationship does not establish voice fit. Also given to it: no praise lines, reassurance never on a slide, `children`/`you`/`we`.
- **Model answers only the teacher sees** stay the designer's, with its voice judgement restored and a route to `teacher-voice.md` §8 (what a model may claim is a teaching decision). The editor rewords only the model answers the class is shown.
- **The editor could grow boards after the only amount check.** It now keeps each board piece about the length the designer gave it, never takes teaching off a board, and names a missing board piece for the designer instead of adding one. No length cap was added (his 10 September ruling).
- **Routes:** the editor runs on whatever design goes forward (approved, carried on after the last redesign, or validated with no reviewer), is skipped when absent, and a later design revision does not return to it (a known gap, now stated for all of them). Its reading note tells a Claude run to read its pages too.
- **Stale text:** the reviewer's `voice sweep as rhythm` line, its `natural` and `adult prose` checks, the packet's `unnatural` route trigger, the harness README, the voice guide's routing line, the designer's reader example, and the light-line paragraph in `preferences.md`, which now says a light line on the board sits inside a sentence already there (his board ruling) and is never pushed off by the ceiling.
- **Left as it is, on purpose:** the reviewer's focused repair still checks its rewritten words against §17, because repairs after the voice edit never pass back through the editor.
- **Counts:** script suite 2,398 pass. Nine fail, none this release's: eight from the unfinished playbook 10A work and one slide-designer size check that fails identically on 4.2.298. My first count had missed two of this release's sweep-runner pins, because it read only whole-test failures and not sub-test ones; those are fixed. Lane tests 19, harness 21, builder doc-claims 42.
- **One question for him:** a model answer the teacher reads aloud when going over answers is heard by children. Should the editor own those too? For now the designer keeps them, so nothing is lost either way.

## The recheck (same day)

The same reader rechecked the repairs. It confirmed them and found a smaller layer, all repaired:

- `settle` left the walk-through telling what it had put back (Sarah Gooder stayed in `design-decisions.md`). It now returns the walk-through to its approved text whenever it puts anything back, and the playbook says to run the validator after it.
- Legitimate edits refused: `1 hour` to `one hour`, numbers of a hundred or more said in words, and everyday capitalised words in the everyday examples the editor is asked for (`help Mum`, `watch TV`). Number words are now read whole (`eight hundred and sixty-five`), a lone `one` may confirm a 1 but never counts as a new number, and the names rule refuses only a new name of two or more words or one name swapped for another.
- Holes closed: a number swapped while another copy stays in the sentence, and a date swapped for one already on the slide, are now swaps (a number said less often while another is said more often). Settings and ids that happen to read like class words (`ending.kind` "Apply", a configuration id) are no longer in the lane.
- Kept on purpose, now said in the editor's file: the taught noun stays even where a verb would sound more natural; the verb works beside it.
- Decision D restored in full: teaching in the script is on the board too, brought into its piece in a few words; a new piece goes to the designer. (Round two had narrowed it to "never take teaching off a board".)
- Counts: script suite 2,404 pass, the same nine older failures; the reader's own probes all pass, with none of 2,431 neutral rewordings refused.
