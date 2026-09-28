# Primary-access release: what changed and why (27 September 2026)

From Daniel's complaint about the Codex-built Year 4 deck "Lord Shaftesbury" (26 September 2026): wording pitched at KS3, no background or story, people and words arriving from nowhere, Do beats that did not use the teaching. Investigated and tested in Claude Code with Opus 5.5 as the lesson designer over eleven trial lessons (history, geography, Year 6 geography, maths, science, RE, PSHE). Evidence, trial pages, both Shaftesbury decks and the change scripts: `evaluations/trial-2026-09-27/`.

Every change below was tested on first-attempt lessons from the designer, with no reviewer involved, and read by Daniel. His last reads: "It definetly sounds better", then "its much better... the wording is much better".

## What changed, by owner

**`agents/lesson-designer.md`**
- New: **Tell the lesson before any slide.** The designer writes the whole lesson as the teacher would say it to this class, then cuts every board and script from that telling. What the telling must do: start where the children are; be one connected story; explain each new idea the way this teacher explains, with an example they can picture (their own lives and bodies, or a picture of the idea happening); let children use each idea straight away, doing the subject's own thinking with it. It then reads the telling back as the child who understands least: listening for the difference between telling information simply and walking them through the thought simply, and for every word that would make a hand go up. The teacher's whole Shaftesbury lesson is the anchor for the amount (read first).
- Changed: the slide-by-slide walk-through is cut from the telling. The board carries the takeaway always, and beyond it what this moment needs, varied; story detail moves to the script before the because, the example or the wrong idea put right; a light line may go on the board; a word the telling explained brings its explanation onto the board; pointing words point at something the child can find.
- Changed: a recap of an earlier lesson is told on the board before the new idea, enough for a child who forgot or was away, not "a short reminder, never a reteach"; when it is worth thinking about (someone's own account), it is a chunk with its own Do.
- Changed: a supplied plan is authoritative on the objective and the order of the unit only; the content it lists is judged like any suggestion, and anything left out gets one line in `flagsForTeacher` (Daniel: "It's guidance, suggestions, context etc instead of MUSTS").
- Removed: the Apply's "question asked the other way round" (`Imagine Lord Shaftesbury had never campaigned...`), which produced the rejected ending.

**`references/preferences.md`**
- The class is described: working well below its age, many SEND or EAL, knowing nothing about the topic; Year 6 is the ceiling. SEND/EAL access is naming things and saying the cause out loud, not tiny sentences.
- Orientation: plain scene-setting still opens the first Teach, but a scene with something to think about is a chunk with its own Do.
- The Apply section loses the Shaftesbury what-if example.
- `significance` is no longer listed among the ideas taught across several cases.
- Pride Lessons gains a fourth anchor: the teacher's own Shaftesbury lesson, for rhythm and amount.

**`references/teaching-sequence-content-based.md`** (`How this teacher explains`)
- The takeaway is on every Teach board and the because nearly always with it; the other parts vary in use and order, never a fixed shape (Daniel: "I don't always want to see 5 things on every teach slide").
- The balance, with both ways each part fails: less means fewer things, not shorter ones, with the floor "if a teacher did nothing but read the board aloud, would the children still succeed?"; assume children know nothing about the topic, not that they can't think; the slides carry the teaching and the teacher brings the rest.

**`references/subject-history.md`**
- Significance at primary is a big difference to many lives plus being remembered, taught through the story. The criteria toolkit, the second person and the what-if ending (added 11 September 2026, 4.2.139) are retired; they produced John Pounds and the KS3 ending. The routing row and the misconception list follow.

**`references/teacher-voice.md`**
- §16 I: the teacher's own polish of six drafted Shaftesbury boards, as wording examples only ("better, teachable, but not perfect").

**`references/output-template.md`**
- `significance` removed from the list of ideas in `concepts`.

**Later the same evening, from his read of the changes**
- Humour: the designer looks for a light moment while it tells the lesson (`Notice what the material hands you`), where the material is in view; the completion pass checks and records the answer. A light line sits outside the "less is more" balance: it is never there to help a child succeed, so the read-aloud floor is not its test (Daniel: "otherwise that one phrase may make humor never appear").
- The slide ceiling in his words: five things on the board at most, counting the picture, helpers, text cards, the question and the starred fact; judged, not a target, and never a reason to cut every board to two cards and a picture ("its just 5 is a max"). Replaces "about four pieces of text beside its picture, five the top of the range".
- Restored three rules the earlier Codex edits of this investigation had dropped: the voice guide's "Does this sound natural, or suspiciously polished?", the Do-beat catalogue's reason "Explain your thinking" fails younger children, and the vocabulary rule's run-the-other-way check with its order of repairs (words the class has, then teach the word, a card last).

Version set to 4.2.297 locally and installed in Codex for his test (not committed).

## Ledger pins moved

Forty pins followed their text, which these changes rewrote in place; nineteen rows (AK-D04, AK-F37, SA-J03, SA-J04, SA-J17, SA-J48, SJ-E44 to SJ-E48, SJ-E53, SC-U01 to SC-U05, TD-K11, VOC-M08) pinned rules that were replaced on purpose and now pin the sentence that replaced them, each with its reason in its `outcome`.

## The reading release (4.2.298, same day)

The first Codex test of the changes above (sol, high reasoning, Year 4 History lesson 5) came back thin and adult. Its session showed why, before any question of wording: Codex keeps about 10,000 tokens of one tool call's output and cuts the middle out of the rest, and the designer had read pages 2 to 4 of its role file in one code cell, so about 31,000 characters (a fifth of the role file: the starter, vocabulary, Teach → Do rhythm and success-criteria rules) never reached it. It also never opened `teacher-voice.md`, only its index: every pointer to it said "at the moment you write it", and it wrote the whole walk-through in one step. Across this machine's Codex sessions, 212 of 425 lesson runs in August and 805 of 1,463 in September lost part of something they read; the paging added on 22 September (4.2.283) did not change the rate, because most cuts were direct file reads and batched pages. The Codex setting `tool_output_token_limit` and turning code mode off were both tested and change nothing: the limit is fixed per model.

- `scripts/read-reference.py`: on Codex (`CODEX_THREAD_ID` set) a read that shares a tool call with reads it would not fit beside prints a short `REFERENCE_READ_REFUSED` naming the command to run alone. Tested live: three pages batched in one cell, one printed and two refused, then read one by one, nothing cut. In a read-only sandbox (no temp folder) the guard steps aside and the read still happens; lesson runs are never read-only.
- `--file` now pages JSON and text as well as Markdown, so a worker can read a long `lesson-design.json` or plan whole.
- `--role lesson-designer` now ends with `teacher-voice.md` whole and Written Voice's core rules and read-back, as further pages of the same read.
- `agents/lesson-designer.md`: the voice guide and Written Voice are read at the start, before the lesson is told; the later route back to the numbered sections stays; §4 is held while telling and asked again at completion (matching `Notice what the material hands you`, which the old line contradicted). One reader command may select several sections; each reader command gets a call of its own.
- `references/teacher-voice.md` → How to read this file: §4 is read for the lesson as a whole, by a designer while first telling it and again at completion.
- The six long role files' Codex reading note: one page per command, and `--file` for JSON and text too. Kept within the wall designer's size budget.
- Pins moved with notes: RV-A06, SJ-A04, SJ-E01, SJ-G01, TD-A13, VG-A06, VG-A07, VG-M05, VG-M07, VG-M08, HOME-VG-READ-02 and the `How to read this file` home. Three tests follow the new wording (`test_four_kinds_are_the_most_often_missed_and_the_designer_reads_that_route`, `test_section_four_is_routed_by_moment_not_by_kind_of_string`, `test_voice_routing_keeps_the_fixed_question_trigger_without_maintenance_history`).

## The voice editor release (4.2.299, same day)

The reading release made every page arrive, and the next Codex runs (astra high) showed that was not enough: a sound structure, still in an adult register, and a reviewer sweep that passed it. A focused voice pass after the review, on sol medium, wrote the warmest Codex wording of the day. So how every word sounds moved out of the lesson designer and the design reviewer into a new `agents/lesson-voice-editor.md`, which runs once after approval. Everything about it, including his decisions and the build record, is in `plans/2026-09-27-voice-editor-plan.md`.

Two things above are reversed by it:

- `--role lesson-designer` no longer adds `teacher-voice.md` whole and Written Voice as extra pages; those pages now go to `--role lesson-voice-editor`, with the Tudor and Shaftesbury calibrations.
- §4 (the light moment) is no longer asked by the designer while telling and again at completion: the voice editor asks it once, of the lesson's material.

## Not yet done

- Not tested on Codex, which is where lessons are made (astra, low effort).
- Found along the way and listed for later, not fixed: `evaluations/trial-2026-09-27/fix-later.md`.
