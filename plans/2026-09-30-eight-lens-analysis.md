# Eight-lens analysis of lesson-v4 (30 Sept 2026)

Eight read-only reviewers, each one lens, on the same five lessons (Nativity RE, digestion science, maths L20 adding 2-digit mentally, Shaftesbury history, sensible choices PSHE) plus maths L15-20 as a run. Lenses: head teacher, SENCo, subject specialist, is it fun, three-week memory, tools to learn, quiet child, across a week. Nothing in the plugin was changed. Full reports were returned as chat text (subagents could not write files); this file keeps the synthesis and the plugin locations.

## Cross-cutting themes (ranked by how many lenses found them)

### A. The thinking is done for the child at the checking moments (quiet child, tools to learn, head, memory)
- Teach and Our Turn scripts ask and answer in one breath ("What is the 3 in 36 worth? Yes, 30."; "[Take answers.]" invented by the designer). Source: teacher-voice.md "It asks, and answers, so the class thinks along", applied to key questions too.
- Answer slide follows the task immediately; children self-mark; the excellent "what you look for" lines have no moment to be used. Nothing tells children what to do with a wrong answer (the maths notes explain "60 means you stopped at the ten" to the teacher only).
- No whole-class "move on or go back" hinge; do-beats.md 3.7 hinge is optional; preferences "routine belongs to the live teacher" leaves the gap.
- Guessable yes/no written, reasoning sent to partner; partner talk before the beat named as independent evidence (Shaftesbury Apply).
- The beat named "unaided" still shows the chain/decision on screen (science grandad slide, maths bridging prompt).
- Quiet child estimate: 15 to 22 minutes of required thinking per 40 to 45 minute lesson.

### B. Lesson ends (memory, tools, fun, week, head)
- No lesson returns to its opening question (PSHE "is loud good or bad?", RE cross, Shaftesbury/Sarah).
- Every lesson ends the same way: good beside weak, tell partner, write; support never fades across a week.
- Main written piece in last 8 to 10 minutes, lost when lessons overrun.
- Retelling asks what the child says "that evening", not in three weeks; nothing names what must come back (evidence-synthesis.md s8 "may" only).
- Success criteria used to start, never to check finished work.

### C. Each lesson designed as if it were the only one (week, memory, fun)
- BUG: previous lesson chosen by build time (resolve-filing.py latest_lesson); L17 was handed L15. Next lesson's objective only goes to the wall (plan-tracker coming_context); designer told "never plan the next lesson".
- Judged made-up child in 12 of 14 walk-throughs, about 25 made-up people across one week; the designer's own warning can't work from one lesson.
- Same opening ritual in 7 of 8 (date, recall list, answers, word card, Teach).
- Joins between lessons in planning notes, never said to children (L20 number bonds).
- Nothing older than last lesson returns (open question: does EMW already do spaced review?).

### D. Copying and reading that are not the learning (SENCo, head, quiet child)
- Board sorts without letters (PSHE, Nativity) copied out in full; history/science lettered. No default.
- Reading left to child alone when it is only the way in (Nativity wise men, science Below paragraph).
- Nobody plans the book page. No SEND/EAL barrier line in orientation (adaptive-adaptation.md bans adult roles; nothing names barriers).
- 40 min carpet-based (Shaftesbury); no handling or movement in any of the five (variety repair built, uncommitted).
- PSHE "sensible choice" vs "grown-up choice" for one idea. Tick/Circle instructions 9pt italic.

### E. Curiosity and delight have no owner (fun, head)
- Designer hands "light moments" to the voice editor, who can only change words; curiosity/surprise/puzzle belongs to nobody. Only geography mentions wonder.
- Puzzles answered on the same slide or before (takeaway-first; "lands it last" only offered for discovery/comparison). CONFLICTS with Daniel's Teach order ruling: proposal is only an exception for genuine puzzles.
- Hook question in notes only; jokes mostly in notes (about 15 of 20 trial voice edits).
- Belief and science story shapes have no stakes (history has); Nativity told flat.
- Maths knows only "real-world hook"; no maths-native sparks.

### F. Subject accuracy and depth (specialist)
- Science: digestion as mashing/sieving; tights lumps called what the body "can't break down"; GD answer accepts "none" absorbed. KS3 contradiction.
- History: significance as verdict to prove; "remembered" used as proof (subject-history.md ~58-62).
- RE: Luke and Matthew merged; "lived in Bethlehem" false card is contestable; no lived faith. Belief language excellent.
- Maths: plugin doesn't know the empty number line; practice includes 29+46, 72+19 where compensation is better. All sums correct.
- PSHE: teaches right behaviour, not the skill/strategy of choosing.
- Adaptation designer writes Below/GD answers after the review with no accuracy habit.

### G. Worksheets (head, SENCo)
- Below sheets are genuine scaffolding (keep).
- Where the sheet replaces the extended writing, Expected becomes sentence starters; GD Q1 = Expected Q3 in history.
- Maths Expected stays under 100.

### H. Starters in knowledge subjects are one-word recall (memory, fun, week)
- preferences.md Starters: subject line says retrieve "a prior fact, definition, or diagram" and "aim for high success"; maths starters get the decision right.

## What already works (every lens, do not break)
Do beats on fresh cases that can't be copied; "what you look for" lines; one story with real people (Sarah Gooder, Ines and Sofia); the banana and tights model; PSHE prediction-then-reveal; Below sheets; word cards just before use; careful RE belief language; accurate maths and 1842 Act; half-right claims as thinking (in moderation); the two-minute test on Teach headlines; no safeguarding issues, no 67.

## Decisions open for Daniel
1. Where to start (suggested: theme A).
2. Puzzle exception to takeaway-first (theme E).
3. Older-topic retrieval in starters vs EMW (theme C).
4. Previous-lesson-by-build-time bug: mechanical fix, needs his go.

## Effectiveness ranking (diagnosis only, 30 Sept 2026, no changes made)

Checked against the plugin text before ranking:
- teacher-voice.md:126 "It asks, and answers, so the class thinks along" comes from Daniel's own tooth lesson, which he liked. Any repair must keep it for recall inside a story and only stop it swallowing the key question or check.
- preferences.md:531 already asks for a check "capable of revealing more than the answers of willing volunteers"; preferences.md:130 keeps routines with the teacher. So theme A is existing guidance losing out to the voice example, not a missing rule.
- resolve-filing.py latest_lesson picks the previous lesson by file modified time (confirmed).
- preferences.md:303 (every starter item needs a call that could go the other way) conflicts with :308 (History/Geography/Science retrieve "a prior fact, definition, or diagram").
- The empty number line exists as the blank-surface helper (worksheet and wall catalogues); the specialist was wrong that the plugin doesn't know it. The slide/lesson designer just didn't reach for it.
- The retelling is framed "at home that evening" (lesson-designer.md:164).

Ranked by reach x leverage x evidence x risk:
1. Checking moments (theme A): separate "a question I answer myself" from "a question the class answers"; look before the reveal; one named move-on-or-go-back moment; wrong-answer meaning said to children. Every lesson, four lenses.
2. Lesson knows its neighbours (theme C): fix previous-lesson choice to plan order; hand the designer the next objective and the shape of the last few lessons. Makes existing warnings (judged claims, identical ritual, fading) workable without new rules.
3. Close the loop (theme B): return to the opening question in the closing talk; retelling aimed at three weeks and naming what comes back. Main-piece-late overlaps the uncommitted child's-seat timeline repair, so don't duplicate.
4. Record the decision, not the card text (theme D): lettered sorts by default; read aloud when reading is only the way in. Cheap, three lenses.
5. Answer-sheet accuracy (theme F): adaptation designer writes Below/GD answers after the review with no accuracy habit.
Then: starter conflict (:303 vs :308), subject-file depth points, puzzle exception (needs his ruling), hooks/jokes on the board, SEND barrier line (conflicts with deliberate rule), worksheet bar (one lens).

## Research: alternatives to the made-up child (30 Sept 2026, read-only agent)
Why the designer picks it: sold in lesson-designer.md "Giving misconception voice"; subject-maths.md (~94) makes a named child compulsory for anything judged on a maths sheet (this is Daniel's Classroom Secrets ruling, 4.2.220, so sheets are his call); do-beats worked examples 3.8, 8.8, 10.10 all use named children; history (Aisha/Lucas) and PSHE ("Whose reason is better?") model it too.
Already in the plugin but never linked to the misconception decision: do-beats 5.11 Which Picture, 5.2 Odd One Out, 5.7 Concept Attainment, 5.5 ASN, 5.10 Same/Different, 5.1 Card Sort, 10.3 Predict Before Reveal, 10.4 Change One Thing, 8.4 Missing Step, 8.5 Spot the Mistake, 3.7 Hinge; geography :155 (near-miss desert photos), history :141 Fix the claim.
Eleven approaches: trap card in a sort; near-miss picture; predict then reveal (POE); the model decides; right and wrong worked examples side by side, no people (Durkin & Rittle-Johnson 2012, Y4-5); anonymous real work (planned moment only, slide can't carry it); teacher makes the mistake live; diagnostic multiple choice (each wrong letter = one misconception); always/sometimes/never with no speaker (blocked on maths sheets by the named-child rule); real voices from the past or a faith; put it to scale or in order.
Made-up child genuinely best: PSHE and sensitive topics (distancing), low-confidence children, a reason with nothing that can settle it but argument.
Choice order: kind of sticking point -> can a test/model/picture/source settle it -> catch the child's own idea or judge someone else's -> does a voice add anything -> earlier beats as a tiebreak only, never rotation.
Evidence notes: concept cartoons (Naylor & Keogh) are strong but are several equal-status views plus a blank bubble, richer than "is she right?"; refutation (wrong then corrected) is weaker for young children (Tippett 2010; Schroeder & Kucera 2022), which undercuts the plugin's stated reason; judging someone else's idea shows who can spot it, not who holds it.

## Research: a lesson question answered by the end (30 Sept 2026, read-only agent)
Exists in pieces only: preferences.md :303/:308 (big question as starter when retrieval empty), subject-history.md :221-238 (unit enquiry, weak/strong table), dialogic route (contested question, different thing), lesson-designer.md :160 "the big questions" undefined, slide templates question-picture-answer / question-three-answers. No design field carries it, which is why the digestion sandwich question never reached a slide.
Good question: the final task answers it; answerable from this one lesson; a child couldn't answer it well at the start but wants to; the answer is the learning not a fact; Year 4 words; asks what the subject asks (no "was he nice?", no "is it true?"); doesn't hand over the answer. Failure modes (Ofsted, HA, Didau/Counsell): decoration title never returned to, bolted on afterwards, unanswerable, unpacked "it depends".
Fit: strong for science explanation, geography "why here", RE "why it matters to"; sometimes history (must serve the unit enquiry, never two on the board) and PSHE (a belief to turn round); rarely maths method lessons (anchor task in reasoning lessons only), naming/vocab lessons, dialogic lessons. Rough frequency one or two lessons in five; more means habit.
Running it: on the board after the starter (or as the starter when retrieval is empty), optional private guess (a think, not a Do); returns once or twice as a line in a Teach headline or script (prequestioning only helps if remembered, Pan & Carpenter 2023); the final task IS the answer, no extra beat, Do count unchanged; objective unchanged; board carries the answer; written into the first lines of the telling, never added after.
Owner: preferences.md (one passage near What a Lesson Is For or between Starters and Purposeful Endings); lesson-designer.md :160 defines it and records a one-line decision; subject files one example each; output template optional empty-by-default field; reviewer checks it only when present; voice editor may reword.
Verdicts: digestion yes (sandwich); Nativity yes ("Babies are born every day. Why do Christians still tell the story of this one baby?"); Shaftesbury yes if it serves the unit enquiry (fountain question); PSHE yes, already its starter, just bring it back without assuming the class's answer; maths L20 no.

## Test in progress: misconception choosing order (30 Sept 2026)
Frozen copy of the plugin (matched live lesson-designer.md at freeze) in scratchpad test/baseline; candidate = same copy with lesson-designer.md "Giving misconception voice" replaced by the choosing order and the duplicate alternatives sentence in the judged-claim paragraph replaced by a pointer. Nothing else changed (do-beats examples untouched on purpose, to test one change). At apply time: scripts/tests/routes_ledger_pins.json pins the old wording; the other agent's uncommitted edits to lesson-designer.md must be merged first.
Runs: sci, hist, maths, pshe x baseline/candidate, designer only, opus, same inputs; blind reviewer after. Expectation: PSHE keeps a made-up child; digestion moves off it.

## Test result: misconception choosing order (30 Sept 2026) - NOT supported, not applied
Blind reviewer (key: sci A=cand, hist A=cand, maths A=base, pshe A=cand) found: science baseline clearly better (predict-then-reveal with the tights, tempting diagnostic cards, near-miss sort; the candidate mostly told then retested), history candidate narrowly better (sort before telling, kind/famous shown as the weak answer), maths baseline narrowly better, PSHE baseline better (children commit to "is loud bad?" first; silent-but-drawing near miss; Kacper claim on a fresh case). Baseline 3, candidate 1. Named claims: candidate 5, baseline 7; both far below the 28 Sept-era lessons.
Reading: today's plugin (4.2.301+ wording, "a named child's claim is also only one way...") already stops the overuse seen in the week's lessons, which were built on earlier versions. The candidate did not improve staging and may have nudged toward tell-then-retest. One run per cell, so differences are within run-to-run variation; the honest conclusion is no evidence the change helps. Decision: do not apply. What the reviewer valued most (put the sticking point to children before the answer; tempting options that show who holds it) is what the current wording already produced in science and PSHE.
