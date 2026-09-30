# Handover: three changes Daniel wants (written 30 Sept 2026)

Daniel has approved all three changes in principle ("I do want them"). None has been applied. They come out of a long analysis session whose full notes are in `plans/2026-09-30-eight-lens-analysis.md`; read that only if you need more background than this file gives.

**Before you act on anything here:** the plugin has moved on since this was written. Other test sessions have changed instructions, and another agent was editing `agents/lesson-designer.md` and `references/preferences.md` at the time. Every file path, line number and quoted wording below is a pointer to where things were on 30 September, not a promise of where they are now. Re-find each one in the current plugin, check whether a later change has already dealt with it, then decide how to apply it using the `improving-agents-and-skills` skill (diagnose against the current state, choose the smallest upstream change, validate). Daniel is not a developer: explain any choice to him in plain English, in short chunks, with no em or en dashes.

Suggested order, with reasons: item 3 first (a clear visible fault he spotted himself, checkable by eye), then item 2 (a real mechanical mistake), then item 1 (a new teaching idea that needs a before-and-after test like the one described at the end).

---

## 1. A lesson question answered by the end (new optional choice for the lesson designer)

**What it is.** The lesson designer gets an extra option it may choose when it genuinely suits the lesson: pose one question at the start that the class cannot yet answer well but wants to, and have the lesson's existing final task be the answer to it. It is not a new lesson type and not a rule. Everything else in the lesson stays as it is: starter, word cards, Teach and Do beats, success criteria, worksheets, working wall.

**Where it came from.** A head teacher gave Daniel feedback that lessons can be shaped around a question the class answers by the end. Daniel's words: "I don't want to see it all the time. But when it's best, I don't see why it's a bad thing to be there."

**Why it's a gap now.** The idea exists only in scraps: history unit enquiry questions (`references/subject-history.md`, around lines 221 to 238, including a weak and strong table and "not every lesson needs a big question of its own"), the dialogic route's contested question (`references/teaching-sequence-dialogic.md`), and the starter rule allowing "the lesson's own big question" only when retrieval would be empty (`references/preferences.md`, Starters, around lines 303 and 308). `agents/lesson-designer.md` (around line 160) mentions "the big questions" without defining them. Nothing carries such a question to the board: there is no field for it in the design. Evidence: in the 30 Sept digestion lesson the designer wrote a strong hook ("How does a sandwich you eat at lunchtime end up helping you run around at playtime?") into the teacher's script, and it never reached a slide.

**Example.** Digestion lesson. After the starter, one slide shows the sandwich question with its picture. The banana, tights, grape and grandad beats run exactly as before. Once or twice the teacher says one line linking back ("So that's the first half of our answer: the food has to be broken down"). The children's final written explanation is worded as the answer to the sandwich question.

**What makes a good lesson question** (from research: Historical Association, Geographical Association, Ofsted subject reports, Didau/Counsell, Pan and Carpenter 2023 on asking before teaching):
- the lesson's final task answers it;
- it is answerable from this one lesson, not a whole unit ("What was life like for Victorian children?" is a unit);
- a child could not answer it well at the start but wants to (a puzzle or surprise);
- the answer is the learning, not a one-word fact ("Which organ absorbs nutrients?" is a quiz question answered halfway through);
- Year 4 words, from the children's world, one question not two;
- it asks what the subject asks (in history not "was he a nice man?"; in RE framed as what Christians believe, not "is it true?");
- it does not give the answer away.
Failure modes to guard against: a decoration title nobody returns to; a question bolted on after the lesson was built (Ofsted: "much less successful when the question was added to the topic retrospectively"); a question children lack the knowledge to answer.

**When it fits.** Usually: science "how and why" explanation lessons, geography "why here?" lessons, RE "why does this matter to Christians/Muslims" lessons. Sometimes: history (must serve the unit's enquiry question if there is one; never two big questions on the board), PSHE when there is a belief to turn round. Rarely: maths method lessons (the I do, we do, you do cycles are already the shape; a mastery "anchor task" in a reasoning lesson is the exception), naming or vocabulary lessons, dialogic lessons (already shaped around a question). Rough honest frequency: one or two lessons in five. If it starts appearing in most lessons it is being chosen by habit.

**How it runs.**
- On the board after the retrieval starter, with the picture that makes it worth asking (or as the starter itself when retrieval would be empty, which the Starters section already allows). An optional ten-second private guess is a think, not a Do beat.
- It comes back once or twice as one spoken line or a Teach headline, never printed on every slide. The asking-before-teaching research says the benefit only holds if the question is remembered.
- The existing final task is the answer. No extra closing activity, exit ticket or Apply, so the Do-beat count is unchanged.
- The closing talk may ask the question again. It must never assume what children said at the start. Daniel caught this: in his real PSHE lesson the class did not say "loud is bad", so a closing line like "At the start you said loud was bad" would have been false. Ask it again ("What would you say now, and why?"), don't quote an answer.
- The objective stays on the board unchanged. The board carries the answer (the same rule as a question used as a Teach title).
- It is written in the first lines of the told lesson, never added after the lesson is built.

**Constraints Daniel has set that this touches.** Three Do beats maximum per lesson, with the launch and tell-your-partner counting as Do-like load (memory: three-do-beats-and-the-launch). Variety means the best tool for the job, never taking turns: never choose a lesson question because the last lesson did not have one. The Nativity lesson already ran 50 to 55 minutes against 38 planned, so check the extra slide does not lengthen an already long lesson.

**Where the research suggested it belongs** (verify against the current structure): one short owning passage in `references/preferences.md` (near "What a Lesson Is For", or between Starters and the endings guidance); `agents/lesson-designer.md` defines it where "the big questions" is mentioned and records a one-line decision (chosen and why, or not chosen); one example per subject file (science, geography, RE, PSHE; maths "usually not"); history keeps ownership of unit enquiry questions; an optional, empty-by-default field in the design output so the slide designer can put it on the board; the design reviewer checks the question only when one exists and never asks for one; the voice editor may reword it.

**Verdicts on the five 30 Sept lessons** (useful as test cases): digestion yes (the sandwich question); Nativity yes ("Babies are born every day. Why do Christians still tell the story of this one baby, 2,000 years later?", currently buried mid-lesson); Shaftesbury yes if it serves the unit enquiry ("Thousands of people walk past this fountain every day. Why was it built for a man most of them have never heard of?"); PSHE yes (its starter "Is being loud a good thing or a bad thing?" already is one and never comes back); maths lesson 20 no.

---

## 2. Each lesson sees more of the lessons before it (and picks them by the plan, not the clock)

**What it is.** When a lesson is made, the designer is handed one "previous lesson". Change how that is chosen, and let the designer see a few earlier lessons in the sequence, plus what comes next when the plan knows.

**Why it's a problem.**
- The previous lesson is picked by file time: `scripts/resolve-filing.py`, function `latest_lesson` (around line 113), takes whichever `lesson-design.json` in the same year and subject was modified most recently. Its own docstring says "Without a calendar there is no slot order". Rebuilding an old lesson or building out of order hands the designer the wrong one.
- Example: Year 4 maths lesson 17 (Roman numerals to C) recorded that it was handed lesson 15 (negative numbers) as its previous lesson, although lesson 16 (Roman numerals to L) existed.
- The designer sees only one lesson back, so it cannot see patterns across a week. The "across a week" reviewer found every lesson opening with the same ritual and ending with the same routine, and support that never fades, because each lesson starts from zero.
- The plan tracker already knows what comes next (`scripts/plan-tracker.py`, `coming_context`), but only the working wall designer is given it. The lesson designer is told "never plan the next lesson" (`agents/lesson-designer.md`, around line 116), which was written about overflow content, not about knowing where the lesson is heading.
- Links between lessons live in planning notes but are not said to children. Lesson 20's key step ("68 is 2 away from 70") is lesson 19's number bonds to 10, and the deck never says so.

**Daniel's rulings on this.**
- He wants the designer to see more previous lessons: "it should definitely see more lessons from before."
- Seeing earlier lessons must not turn into rotation. His words: "just because it was on Monday doesn't mean you'll put it or won't put it on Tuesday... It chooses the best thing for the job." So the earlier lessons are context (what was taught, the words and models used, how much support the class has had), never a quota to vary against.
- Not decided: whether starters should bring back older topics (for example Roman numerals weeks later). It depends on whether his early morning maths sessions already do spaced review. Ask him before building anything that adds older retrieval to starters.

**Direction (to verify, not prescribed).** Choose the previous lesson by its position in the teacher's plan when the plan tracker has one, falling back to file time only when there is no plan. Hand the designer a short view of the last few lessons in the sequence and the next lesson's objective when known. Consider whether a known join should be said aloud in the children's hearing ("this is yesterday's number bond doing a new job").

**Validation idea.** A deterministic test on the selection itself (a plan with lessons 15, 16, 17 where 15 was built last must return 16 for lesson 17), plus a healthy control where there is no plan. For the wider context, check the designer's inputs actually carry the extra lessons.

---

## 3. Starter question text stays small in history, science and RE

**What it is.** Daniel noticed that starter question cards are smaller than they could be, with lots of empty space. Investigated and confirmed.

**What's already fixed (maths).** In maths, every question got its own row down the slide, so five short sums ran out of height at 24pt while most of the width sat empty. A wider-rows layout was added to `builder/src/content/numbered-questions.js` in commit 801b8c4b (29 Sept, 17:36), after the maths lesson 20 deck had been built (29 Sept, 14:01). Rebuilding that lesson's `lesson.json` with the current builder put the sums in two columns at 36pt instead of 24pt. Nothing more to do for maths unless the new chat finds otherwise.

**What's not fixed (sentence answers).**
- The starter question slide and its answer slide are a reveal pair and share one box and one font size, so nothing jumps when the answers appear (`numbered-questions.js`: `pairedEntries`, `layoutTexts`; `scripts/fit_text_postprocess.py`: the `revealpair-` group takes the smallest size across the pair).
- On the answer slide each box holds the question plus the full answer sentence. The box and size are chosen to fit that longer text, and the question slide inherits them.
- Evidence, Shaftesbury deck (`Lord Shaftesbury why was he significant.pptx` in the project root, built 30 Sept): "What did a trapper do in a coal mine?" sits at 28pt in an 11.6 x 2.3 inch box; "Why did many children from poor families go out to work?" at 28pt in 11.6 x 1.8. The science digestion starter is 24pt.
- Rebuilding the Shaftesbury `lesson.json` (`working/year-4-history-lesson-4/lesson.json`) with the current builder refuses to finish: `SLIDE_TEXT_UNDERFILLED`, naming exactly those two starter boxes at 21% and 26% of their box. So the current plugin detects the fault but cannot repair it itself; a run has to work around it.

**Direction (to verify).** Let the question slide size its questions on their own while the answer slide keeps its own layout. The honest trade-off to show Daniel: the question text would change size (and possibly position) when the answers appear, which the shared sizing was built to prevent. Build a before-and-after of a real starter (Shaftesbury is a good case) and let him judge by eye before deciding; alternatives worth considering include laying the answer out in its own box below the question so the pair can share position without the answer dictating the question's size.

**Validation idea.** Rebuild the Shaftesbury and digestion starters; check question text is larger, the underfill refusal no longer fires, the answer slide still reads well, and the maths two-column starter is unchanged (a healthy control).

---

## Already tried and rejected in this session (do not re-propose without new evidence)

Rewriting the lesson designer's misconception paragraph (around line 358, "Giving misconception voice") into a choosing order that steers away from made-up children judging claims. A blind four-lesson test (science, history, maths, PSHE, old and new wording, same inputs) found the old wording won 3 of 4, and both versions already used few named-child claims (7 old, 5 new). The overuse seen in the 28 to 29 Sept lessons came from older plugin versions; the current wording already handles it. Evidence and research are in `plans/2026-09-30-eight-lens-analysis.md`.

Also dropped by Daniel in this session, so leave them alone: scripts answering their own questions during teaching; lettered cards for board sorts (parked "for now"); a supposed conflict between starter rules (he reads recall and real decisions as compatible); the puzzle-before-the-answer idea (parked).
