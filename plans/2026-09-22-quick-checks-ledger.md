# Quick checks rule ledger (topic 4)

Step 1 of the streamline method in `streamline-plan.md`, for one topic: quick
checks. Nothing in the plugin was changed to make it.

**Snapshot.** lesson-v4 4.2.284, commit `3de9c956`. Line numbers are the line
in that commit where the quote starts. Every «quoted» passage is the file's own
words; `streamline-tools/check-ledger-quotes.py` confirms each one exists in
the file named in its Where column.

**What counts as quick checks here.** What makes a check, or a Do beat's
expected response, genuine rather than a restatement of the teaching just
given: the rule that a quick check is a fresh case and not the last slide
again, with every copy of it; the "name it as a check" excuse and every
sibling of it that survived 4.2.283; a Do whose expected answer is a summary,
headline or recap of its Teach; the `thinking` line read against the board;
`Which Claim Does This Support?` and its narrowing; option banks, matches and
sorts that can be answered from the board, including wrong options no child
would believe and answers readable from position; when a term's exact wording
is the learning; the check before independent practice of a new procedure;
retrieval against instant recall; the probes that ask whether a child who
missed the teaching could still do it; and the review view's `Each Do beside
the teaching before it`, the routing card and the one validator check that
reads an answer off the page.

**What belongs to a neighbour.** The Teach then Do rhythm (one idea per Teach,
every Teach followed by a Do every child does, the Do using its own Teach,
orientation, links between beats), what children are assumed to already know,
vocabulary (finished and pinned), starters, sticky knowledge, the launch and
Apply, answer slides, the voice guide and the slide designers. Rules from those
that touch this ground are listed as shared, in the group they touch or in
group S, so nothing is hidden, and are left to their own topics.

## How to read a row

| Column | Meaning |
|---|---|
| ID | `QC-` then a group letter and a number. Groups: A the rule (a quick check is a fresh case), B the "name it as a check" excuse, its siblings and the honest claim rules beside them, C permissions that leave out the fresh-case condition, D a Do that summarises its own Teach, E the `thinking` line read against the board, F `Which Claim Does This Support?`, G option banks, matches and sorts, H wrong options a child would believe and verdicts read off the format, I when a term's exact wording is the learning, J skill lessons (fresh guided and independent cases), K the check before independent practice, L retrieval against instant recall, M the probes and what a response can claim, N retests that decay into a catchphrase, P the review view, routing card, code and test fixtures, S neighbouring rules listed so nothing is lost. |
| What the agent is told | The rule's own words. Several «quotes» in one row are separate sentences of the same rule. |
| When it applies | The condition, and any exception the text gives. |
| Strength | **must** (never, always, only, or refused by code), **default** (normally, usually, prefer), **may** (a permission), **check** (a test or tell the agent runs), **mechanics** (how to record or build it). "Code" means a program refuses the lesson when it is broken. |
| Code names | Field names, headings, markers or messages a program or test depends on. These cannot change without the code. |
| Where | The file, its section and line. The primary row of a rule also lists its copies. |
| Kind | rule; your example; your ruling (your words, dated); duplicate; near-duplicate (with what it adds or lacks); contradiction (a numbered decision below); story (a dated incident); pointer; maintainer; stale; code; shared (another topic owns it). |
| Proposed home | Where the one kept copy would live. A proposal only: see decision 8. Codes: **PREF-QC** preferences.md → The Teach → Do → Teach → Do Rhythm, the paragraph `A quick check is a fresh case, not the last slide again`; **PREF-MATCH** the same section's paragraph `A quick match, sort or label is a real Do beat`; **PREF-EXPL** the same section's list `Name what the chunk needs children to do with it`; **PREF-WLF** preferences.md → What a Lesson Is For; **PREF-SCR** preferences.md → Support, Checking and Release; **LD** the lesson designer, keeping only what it adds and a pointer; **REV** the design reviewer's own check (it opens the rhythm section only when its trigger fires); **CAT** the Do-beat catalogue entry; **TC** the task contrasts file; **ES** the evidence synthesis; **SUBJ** its subject file; **ROUTE** its route file; **CODE** stays in code; **LOG** the build log; **STAYS** another topic owns it. |

## What the list shows, in short

- **307 places** in 32 files (29 instruction files, two programs and one test
  fixture) say something about quick checks. **69** repeat a rule written
  elsewhere, and **83** belong to another topic and are listed so a fold can
  see them.
- **41 of the repeats are not true copies**: each carries an extra condition,
  example, limit or strength, or lacks one the home has (marked
  "near-duplicate" or "plus" in its row). A fold has to keep the extra words,
  or it loses a rule, and has to decide whether a copy that lacks the
  condition gains it.
- **The fresh-case rule is written about twenty-five times** (group A and its
  pointers), and the one sentence that says what makes a case fresh is not
  beside it: a new picture or name counts only when children must use its
  features, and reusing the taught conclusion is weak evidence (A21, in the
  worksheet guidance).
- **The "name it as a check" excuse did not go everywhere.** Five places
  survive: two in the contrasts file (B01, B02), "orientation" versions in the
  reviewer and the history file (B03, B04), and "and the design says so" in the
  sort-and-match rule (B05). Beside them sit at least nine honest rules that
  also tell the designer to say what a beat is for, so the excuse cannot be
  taken out by searching for "say so" (decision 1).
- **Recall and checking pull against each other.** The fresh-case rule says
  repeating the sentence just said is finding; your own ruling the same day
  says a recall thirty seconds later "tells the teacher who has it. That is
  worth the minute". Seven permissions for a short recall leave any condition
  out. What separates the two is whether the answer is still in front of the
  child (decision 4).
- **The catalogue offers eight formats that give back what was just taught**
  (two summaries, a headline, two things, teach your partner, three things, a
  quick sketch, a sketchnote), and its own explanation section lists diagram to
  words "after a modelled diagram", while the reviewer calls a one-sentence
  recap a restatement (decisions 5 and 6).
- **Labelling pulls two ways** (decision 3), with two honest limits: a thing
  with no other picture (the world map), and a label task in a later lesson,
  which is retrieval.
- **PSHE and RE word the condition more loosely than the home** ("not
  already settled", "not already explained") (decision 7).
- **The reviewer's reach is narrower than its instructions.** Its routing card
  opens the rhythm section only for a restated explanation, never a restating
  sort, option bank or label; its side-by-side view covers only content-lesson
  Do beats, prints "none written" for a sort and does not count the Teach's
  takeaway (decisions 8 and 9).
- **The code enforces little here, on purpose**: an ordering task in an option
  bank or starter list may not print its datable items sorted either way;
  every skill cycle ends with its own Your Turn; and a `thinking` line is
  required except where the teacher acts, a list that lets a bounded attempt,
  where every child acts, go without one (found in passing). Whether an answer
  restates its Teach is judgement: a word-overlap refusal was measured and
  rejected in 4.2.283.
- **The reviewer's sample cases still encode the old excuse** (P08 to P10), but
  no agent reads their text and tests read only their ids, so changing them is
  record-keeping.
- **Tests already pin a phrase in 103 rows** (listed at the end), including
  two survivors (B04, B05) and two permissions decision 4 touches (C01, and
  C06's table row), so each change moves a test in the same release.
- **Two stories are not in the build log, and one is there only as its twin**
  (listed below).

## Decisions taken (23 September 2026)

Daniel answered all ten in one message: "Q1. Agree. Q2. Agree. Q3. Agree. Q4.
Agree. Q5. Agree. Q6. Agree. Q7. Agree. Q8. Agree. Q9. Agree, Q10. Agree."
Every suggestion is taken as written below.

### Open questions answered (23 September 2026)

His words, in one message: "4. agree 5. agree 6. rewrite 7. thats fine". So the map sentence says a label-reading check is on a map the lesson has not shown; the history contrast names the quick match of jobs the slide did not show; the summary formats' best-use lines, Quick Sketch's opening and Diagram to Words' copied-picture clause are rewritten to the moment their limits allow; and 4.2.285 and 4.2.286 are committed as two commits, pushed with 4.2.284, and the leisure lesson is rerun untouched in Codex.

### Open questions from the change (23 September 2026), as they were put to Daniel

1. **The map contrast's label-reading sentence.** Decision 1 took out "named as one" and kept the rest: «a quick label-reading check after a new map skill is an honest recall beat». The new recall line says recall is honest when the answer is off the board, and a label read off a map is on it. Proposal: «a quick label-reading check on a map the lesson has not shown is an honest check».
2. **The history contrast's "where the simpler task is right".** With the orientation permission gone (decision 2) it names no simpler task that is right, though every other contrast does. Proposal: name the quick match of jobs the slide did not show to what each gave the family (the fresh match already in `preferences.md`), or leave it saying only what the sort is not.
3. **Five summary formats' "Best for" lines** (Two Things, 30-Second Expert, One-Sentence Summary, Sketchnote, Headline the Lesson) and Quick Sketch's opening («Pupils draw what was just described») still name straight after the Teach, which their new limit (decision 5) rules out; Diagram to Words keeps «and as the check that a picture children copied actually means something to them», which decision 6's condition now pulls against. Proposal: rewrite each to the moment the limit allows (across several chunks, with the teaching off the board).

## Decisions for Daniel

What the designer and reviewer read:

1. **When saying what a beat is for is honest, and when it is the excuse.**
   - **What it says now.** Your decision B takes out «It is fine there, named
     as a check» (QC-B01). The same file has a second copy: a quick map
     label-reading check «is an honest recall beat, named as one» (QC-B02).
     But at least nine other rules also tell the designer to say what a beat
     is for, and they are honest:
     - a check of unaided work takes its support away, «a decision made for
       that task and said out loud» (K22);
     - «Decide, and say, which the good instance is» for a launch model (S43);
     - reusing a task «is legitimate when that is its stated purpose, rather
       than claiming it demonstrates unseen transfer» (S42);
     - a support that gives something away on a sheet: «Say so when it is
       deliberate» (S32, S33);
     - «describe their purpose honestly» and «An explicitly supported rehearsal
       may supply a decision without claiming to assess it» (M25, M26);
     - «A quick recall check is fine when recall is the claim» (B06);
     - a needed check «is sound when the design says that is its job» (B07).
   - **What I think.** The line between them: an honest "say so" changes what
     the beat claims, or what is done to the task. The excuse lets a label stand
     in for the fresh case, so finding the answer on the board becomes
     acceptable because the beat was called a check. A tidy-up that deletes
     "say so" wording by search would hit the honest ones.
   - **What I suggest.** Take out "named as a check" (already decided) and
     "named as one", keeping the rest of each sentence. Write that line once
     beside the fresh-case rule, so later changes know which is which. Every
     honest rule in the list stays word for word. Example: after teaching the
     key on a map of Brazil, the check is reading the key on a map of Kenya;
     calling it "a quick check" does not make re-reading the Brazil map one.
   - **Question.** Shall both clauses go, with one sentence saying which "say
     so" rules are honest?

2. **The good/bad apprentice sort as a "two-minute orientation".**
   - **What it says now.** Three places say a sort a child can finish from
     everyday sense is fine as a quick orientation before the real question,
     just not as evidence: the contrasts file (QC-B01, its first sentence), the
     reviewer (QC-B03, «a pleasant/unpleasant sort is adequate as a brief
     orientation») and the history file (QC-B04, «still a fair two-minute
     orientation»).
   - **What I think.** You taught that exact sort on 15 September and children
     did it from everyday sense. The contrasts file itself says the thinking
     «arrives as a discussion after a sort that already felt like the work»
     (G28). And your rhythm rules already say orientation «does not require a
     manufactured Do activity», and the reviewer should «remove a manufactured
     Do» (S50, S51). So "orientation" is the same excuse under another name, and
     the rhythm rules point the same way. One honest note: the contrasts file
     says the sort "settles the vocabulary of the deal"; the fresh-case way to
     settle it is sorting a different apprentice's deal.
   - **What I suggest.** Remove the orientation permission in all three places.
     Keep what each also says: such a sort is not evidence, and a lesson that
     leans on it has taught less than it looks. The reviewer's first clause
     (do not reject a task because the information is supplied) stays. A test
     pins the history wording and changes with it.
   - **Question.** Shall "fine as an orientation" go in all three places?

3. **A label check straight after teaching.**
   - **What it says now.** The sort-and-match limit (QC-B05) says that when the
     exact word is the point, labelling the taught thing is right («naming the
     layers on the tooth diagram just taught») «and the design says so», and it
     points at «the recap boundary above», which 4.2.283 removed. The reviewer
     (QC-I01, already agreed in the vocabulary topic) says the check is «the
     term used on a fresh case», and science (QC-I02) says label «a different
     plant, tooth or circuit from the one taught». Two catalogue formats (I06,
     I07) do not say which. Two honest limits exist: the world map has no other
     picture, and its write-on copy is kept «a genuine retrieval task» (I09); and
     a photograph annotated in an earlier lesson, brought back later, is
     retrieval (I10).
   - **What I think.** The rules disagree on one thing: the same picture or a
     new one, straight after the Teach. "And the design says so" is the excuse
     again.
   - **What I suggest.** Straight after the Teach, children label a new picture
     of the same thing. Where no other picture of the thing exists, a blank copy
     of the same one is the check. In a later lesson the same picture is fine,
     because by then it is retrieval. "The design says so" goes, the pointer
     names the fresh-case rule, and the two catalogue formats say which picture.
     Example: after the Teach labels enamel, dentine and pulp on one tooth,
     children label them on a different tooth cut in half. A test pins the
     current wording and changes with it.
   - **Question.** Shall a label check straight after teaching use a new
     picture, with those two limits?

4. **Recalling a fact straight after teaching, and checking an idea.**
   - **What it says now.** The fresh-case rule says «Choosing, completing or
     repeating the sentence the slide or the teacher has just said is finding
     it». Your ruling the same day says a recall beat thirty seconds after the
     answer «makes every child produce the thing rather than hear it, and it
     tells the teacher who has it. That is worth the minute.» (L01). A fact,
     name or definition «needs surfacing: recall it, match it, sort by it»
     (S52). Several permissions allow a short recall with no condition: «A
     short recall response may secure new knowledge» (C03), «A response after
     new teaching may simply establish or retrieve it» (C02), «A short response
     can establish new knowledge» (C04), «Accurate classification may itself be
     the intended check» (C05), «A quick check ... stay legitimate choices»
     (C01), «useful simple checks» (C08), «A quick recall check is fine when
     recall is the claim» (B06).
   - **What I think.** My first suggestion, adding "on a fresh case" to every
     one, would have stopped facts being recalled at all, which goes against
     your ruling: a fact has no case the Teach did not show. What separates
     the two is whether the answer is still in front of the child. The
     catalogue's own test for recall is «The answer is not visible and the next
     step needs it held» (L03). Recalling a fact from memory, with the board
     moved on, is worth the minute. Picking it off the board, or choosing the
     Teach's own sentence from an option bank, is finding.
   - **What I suggest.** Write the line once beside the fresh-case rule: a
     fact, name or definition may be recalled straight after teaching when the
     answer is no longer on show, as a quick read of who has it, and it claims
     recall, never understanding; a check that an idea, a relationship or a
     method's decision has landed is a fresh case. Each permission keeps its
     words and points to that line. Example: after the enamel slide, "cover the
     board: what is the hard outer layer called?" is fine recall; "which of
     these says what enamel does?" with the Teach's own sentence as the right
     option is finding; "which of these three teeth has lost its enamel?" is the
     fresh case. The table row saying that pointing at an answer the board marks
     «checks a detail was noticed» (C06) limits what such a task may claim, and
     stays as it is. Tests pin C01's wording.
   - **Question.** Shall the rule separate recall from memory (fine straight
     after teaching) from finding the answer on the board, and keep the fresh
     case for ideas?

5. **Catalogue formats that give back what was just taught.**
   - **What it says now.** Eight formats: one-sentence summary, six-word
     summary, headline the lesson, two things you now know, teach your partner
     what you just learnt, three things I learned, a quick sketch of "what was
     just described", and a sketchnote of "the chunk" (D11 to D16, D19, D20).
     Some are listed as best straight after a Teach. Two Truths and a Lie has no
     limit (H05), where True or False carries your «fine, but can be cheap». The
     research already in the plugin gives one condition: «a summary works when
     summarising has been taught and collapses into copying otherwise ... Brief
     the condition alongside the form» (D10).
   - **What I think.** Two limits are possible and you should see both: the
     research's (summarising has been taught) and mine (never straight after the
     Teach it gives back; it earns its place when children choose across
     several things with the teaching off the board). They answer different
     faults: whether children can summarise, and whether the summary is
     anything but copying.
   - **What I suggest.** Each of the eight keeps its place with a one-line
     limit carrying both: not straight after the Teach it gives back, and only
     where summarising, or sketching from memory, has been taught. Two Truths
     and a Lie takes True or False's limit. Example: at the end of the teeth
     lesson, "which of today's three facts would help a dentist most?", not "sum
     up what we just learnt" after the enamel slide.
   - **Question.** Shall these formats stay, with that limit? (No would retire
     them.)

6. **Turning the diagram just modelled into words.**
   - **What it says now.** The explanation list counts «turn the words into a
     diagram or the diagram back into words» and «explain one link in the chain»
     as uses of an explanation (D01). The catalogue lists Diagram to Words as
     best «after a modelled diagram» (D21), Explain One Link as the link the
     Teach drew (D22), and Words to Diagram as the spoken explanation drawn
     (D23). The reviewer calls «a summary, headline or one-sentence recap of the
     explanation just given» a restatement (D08).
   - **What I think.** A one-sentence account of the diagram the teacher has
     just talked through is both at once. It becomes a use when the child has to
     do the translating themselves.
   - **What I suggest.** The three formats say so: the diagram is one the class
     has not had explained (the same process drawn differently, a new cycle), or
     the link is one the Teach did not explain. Example: after the water cycle
     is modelled, "what is this drawing of a puddle drying telling us?", not "say
     in one sentence what our water cycle shows". Words to Diagram is the
     least certain of the three; leave it out if you think drawing what was
     just said is already a use.
   - **Question.** Shall the three formats carry that condition?

7. **PSHE's and RE's own wording.**
   - **What it says now.** The home asks for something «the Teach did not show».
     PSHE asks for a scenario «the Teach did not already settle» (A15), RE for a
     practice, person or text «the Teach did not already explain» (A14).
     Geography and science match the home.
   - **What I think.** PSHE and RE allow the Teach's own scenario or practice,
     as long as its answer was not given. That fits those subjects: a situation
     shown and left open for children to decide is a real decision. It reads as
     deliberate rather than drift.
   - **What I suggest.** Keep both as their subjects' own form; the home stays
     as it is. Example: a PSHE Teach shows Mia's message and stops; children
     deciding whether it is pressure is a real check, because the Teach did not
     settle it.
   - **Question.** Keep PSHE's and RE's wording as it is?

Where things live, and code:

8. **One home for the rule.**
   - **What it says now.** The fresh-case rule is written about twenty-five
     times (group A, with pointers in C, E, G and I).
   - **What I think.** Most copies do a real job. The reviewer's routing card
     opens the rhythm section only when a Do's expected answer is a restated
     explanation, so a restating sort, option bank or label never sends it
     there; its own sentences (A08, A09, G05, E08) are its only reach for those.
     Each subject file says the rule for that subject, and the designer's copy
     sits where disagreement beats are designed.
   - **What I suggest.** One home: the fresh-case paragraph in your preferences
     file's rhythm section, with the definition of "fresh" (A21) and the lines
     from decisions 1 and 4 beside it. The reviewer keeps its own sentences word
     for word. Everywhere else keeps a one-line pointer carrying any extra
     condition its copy has. Only true repeats fold. The section's contents line
     names quick checks. The rhythm topic's home is in the same section, so the
     two are planned together.
   - **Question.** Is that the right home?

9. **The reviewer's side-by-side view and its trigger (a code change,
   later).**
   - **What it says now.** The reviewer is told the view «puts each Do's
     expected answer next to the Teach it follows». The program does this only
     for a content lesson's Do straight after a Teach; for a sort or an evidence
     classification it prints "none written", because their answers are stored
     in another shape; it does not count the Teach's takeaway, the line a Do is
     most likely to say back; and it never shows a skill lesson's Your Turn
     beside its My Turn, or a beat in the other routes. The routing card fires
     only for a restated explanation.
   - **What I think.** The steam option bank was caught because it was an option
     bank in a content lesson. The same restatement as a sort, or as a Your Turn
     that re-sorts the shapes just placed, would pass unseen.
   - **What I suggest.** A follow-on code change with its own tests: include
     sorts and evidence classifications, count the takeaway, show the first
     pupil beat after teaching in every route, and let the trigger fire for any
     Do whose expected answer repeats its Teach, whatever its form.
   - **Question.** Shall it be widened?

10. **Your Tudor sorts in the history file.**
    - **What it says now.** The history file tells the story of your rebuilt
      Tudor lesson: its job match worked, and its two sorts were approved for
      their wording and were shallow when you taught them (QC-G26, G27). It is
      in the build log.
    - **What I think.** It is your own classroom read, and it is how the agents
      learn what "could a child place every card without the history?" means in
      your room. The plan keeps your calibration examples exactly.
    - **What I suggest.** Keep it as one of your calibration examples, without
      its date. The other dated or real-deck cases in this topic (listed below)
      follow the standing rule: the reason stays, the incident goes to the log.
    - **Question.** Keep it as a calibration example?

For later topics, nothing here pulls against them: the starter's cover test
(S21) and "high success with no decision in it is not retrieval" (L11) are the
starter's own version of this rule; the launch rule that a model of the same
case needs a later fresh case (S08) agrees with it; the voice guide's "do not
leak the answer" and its exception (S12, S37) are its wording side; and the
slide designers' "different properties for the Your Turn sort" (J08) agrees.
The maths file names its example sheets as its standard and says they fail on
one point (H10); that is already settled in its own words. The catalogue's own
counts are stale (found in passing), for whichever topic folds it.

---

## A. The rule: a quick check is a fresh case

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-A01 | «**A quick check is a fresh case, not the last slide again.** A short check straight after teaching is a real Do beat when children apply what was just taught to something the Teach did not show: a new picture to place, a new card to sort, a new example to judge, a new situation to predict (the teacher's ruling, 14 September 2026).» «Choosing, completing or repeating the sentence the slide or the teacher has just said is finding it, not checking it: a child gets it right by remembering where the words were, the teacher learns only who was listening, and calling the beat a check does not change what the child does. That holds for an option bank whose right answer is the Teach's own sentence reworded, and for a wrong option no child this age would believe.» | every short check straight after teaching, in every route; limits in A02 | must | the bold lead is cited by name in the designer, the reviewer, the catalogue and twice more in the same file, and printed by the review view's code; tests pin the lead, `a new card to sort` and `calling the beat a check does not change what the child does`, and bar `and the design says which` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204. Copies: A04 to A19, C01 to C10, E03, G01, I01, P03 | rule; your ruling (dated; in the log at 4.2.205) | PREF-QC (the home) |
| QC-A02 | «A retrieval starter is still meant to use what children already know, and practice that repeats a method on new numbers is still practice.» | the limits of A01 | may | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204. Copies: A05, C09, C10 | rule (limit) | PREF-QC |
| QC-A03 | «Let the activity take the time its thinking genuinely needs, but do not let a beat intended as a quick check quietly expand until it crowds out the lesson. When a worthwhile sort, explanation, diagram or other activity becomes substantial, treat it as main practice rather than continuing to call it a tiny Do beat.» | a check that grows | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204. Copies: A16, A17 | rule (a check's size) | PREF-QC |
| QC-A04 | «The same test sits inside every response moment. A child answering because they remember what the teacher said a minute ago has shown attention, not learning. An answer that needs the idea applied to a case the teaching did not already cover shows the idea has landed, and that is what each Do beat is for.» | every response moment | must (the reason) | heading `What a Lesson Is For` (the reviewer always reads it) | `references/preferences.md` › What a Lesson Is For · L150 | rule (the reason A01 rests on) | PREF-WLF |
| QC-A05 | «The limit: a retrieval starter is meant to be what children already know, a quick check after a Teach is right on a case the Teach did not show (`A quick check is a fresh case, not the last slide again`), and fluency practice repeats a known move on purpose. The test is for the learning the lesson claims and the thinking it claims, not for every response.» | the limit of the "could a child have said it before the lesson" test | may (limit) | test pins its opening | `references/preferences.md` › What a Lesson Is For · L158 | pointer; near-duplicate of A01 and A02: adds that the test is for claimed learning, not every response | PREF-WLF |
| QC-A06 | «Selecting a paraphrase of the conclusion just given is finding the sentence, not a check of understanding (`A quick check is a fresh case, not the last slide again`); a new response format does not itself increase demand.» | reading the finished sequence for demand | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm (`Climb the demand`) · L224 | near-duplicate of A01: adds that a new response format does not raise demand | STAYS in Climb the demand, as a pointer |
| QC-A07 | «A quick check straight after teaching is a legitimate beat, and not every Do must stretch, when children use what was just taught on a case the Teach did not show: a new picture to place, a new card to sort (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `A quick check is a fresh case, not the last slide again`). Keep it short and save the reasoning for later. Picking or finishing the sentence just said is not a check, whatever the beat is named. What this rule prevents is a reasoning beat, staged as disagreement, doing a checking beat's work while taking a reasoning beat's time.» | every quick check straight after teaching (its first clause is general, though it sits in Misconceptions); its last sentence names the case it guards, a disagreement doing a check's work | may (not every Do must stretch); must not (the sentence just said) | | `agents/lesson-designer.md` › Misconceptions · L313 | near-duplicate of A01: adds "keep it short and save the reasoning for later" and the disagreement case | LD (keeps the disagreement case and a pointer) |
| QC-A08 | «A quick check straight after a Teach may only establish that the class caught a new distinction, and it does that on a case the Teach did not show; picking the sentence just said is not a check, whatever the design calls it (`preferences.md` → `A quick check is a fresh case, not the last slide again`).» | a limit on the reviewer's two probes: a fresh check that only establishes a distinction is not rejected by them | may (limit); must not (the sentence just said) | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L191 | near-duplicate of A01: a limit A01 lacks (a fresh check may only establish that the class caught a distinction) | REV (keeps its words; decision 8) |
| QC-A09 | «A restatement is never preserved as a check, because a check is a case the Teach did not show;» | every Do the reviewer reads | must | test pins it | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L204 | duplicate of A01, and the one limit on D08's local repair (it must stay beside D08) | REV |
| QC-A10 | «Cheap, fast, and the right choice when you genuinely need to know the class caught something before you build on it, on items the Teach did not show: matching the slide's own words back to it is finding them, not knowing them (`preferences.md` → `A quick check is a fresh case, not the last slide again`). This is the band that quietly fills a lesson, because these beats are the easiest to write.» | the surface band of Do beats | may (when you need to know the class caught something, on items the Teach did not show); must not (the slide's own words) | | `references/do-beats.md` › intro (the three bands) · L11 | near-duplicate of A01: adds that this band quietly fills a lesson | CAT |
| QC-A11 | «and the cards are cases the Teach did not show:» | history Do beats | must | | `references/subject-history.md` › Choose the response that reveals the history · L137 | duplicate of A01 in the subject's Do list | SUBJ |
| QC-A12 | «and each works on a place or map the Teach did not already use:» | geography Do beats | must | | `references/subject-geography.md` › What a Do beat looks like in geography · L74 | duplicate of A01 | SUBJ |
| QC-A13 | «and each changes the case from the one the Teach showed:» | science Do beats | must | | `references/subject-science.md` › What a Do beat looks like in science · L59 | duplicate of A01 | SUBJ |
| QC-A14 | «and each uses a practice, person or text the Teach did not already explain:» | RE Do beats | must | | `references/subject-re.md` › What a Do beat looks like in RE · L29 | near-duplicate of A01 with its own condition: not already *explained* (the Teach may have shown it); decision 7 | SUBJ |
| QC-A15 | «and each uses a scenario the Teach did not already settle:» | PSHE Do beats | must | | `references/subject-pshe.md` › What a Do beat looks like in PSHE · L34 | near-duplicate of A01 with its own condition: not already *settled* (the Teach may have shown it); decision 7 | SUBJ |
| QC-A16 | «If the activity becomes substantial, treat it as main practice rather than letting a nominally quick beat swallow the lesson.» | a check that grows | must | | `references/do-beats.md` › intro · L3 | pointer to A03; lacks A03's permission (let the activity take the time its thinking needs) | CAT (pointer) |
| QC-A17 | «If a worthwhile activity becomes substantial, treat it as main practice, in the place that beat was going to sit if the class is ready for it there, and protect the rest of the lesson rather than pretending it is still a tiny beat.» | content lessons | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L47 | near-duplicate of A03: adds where the main practice then sits (shared with the rhythm topic) | ROUTE |
| QC-A18 | «*"Give me an example — not from my slide — of an invertebrate."*» «Tests whether the concept is portable or just memorised» | after defining a category | may | | `references/do-beats.md` › §8 Generative (8.6 Give-an-Example) · L428 | rule (a format that is the rule's own shape) | CAT |
| QC-A19 | «Announcing the reason first and then asking children to label the lines from memory converts the one piece of real thinking in the lesson into a recall task. Where the pattern is legible, show it and ask before you explain.» | geography, when a pattern can be read | default | | `references/subject-geography.md` › Making the thinking geographical · L66 | rule (subject); shares ground with vocabulary (a definition must not hand over a discovery) | SUBJ |
| QC-A20 | «- **Work with** (apply the idea to a fresh instance, sort where the criterion has to be found, correct an error, choose between two positions and say why, rank and justify). The child holds the idea and does something to it.» | the middle band of Do beats | default | | `references/do-beats.md` › intro (the three bands) · L12 | rule (the band above surface names a fresh instance too) | CAT |
| QC-A21 | «For procedural fluency, fresh values can be sufficient when executing the procedure is itself the target. For reasoning, inference or explanation, a different name, picture or claim earns freshness only when children must examine or use its relevant features to reach an answer. The same conclusion can be valid in two cases when each requires that work; do not force different answers. Conversely, reusing the taught conclusion while ignoring the new material is weak evidence of fresh application.» | what makes a case count as fresh | must | | `references/lesson-designer-components.md` › Generated worksheet · L73 | rule (the only definition of "fresh" in the plugin; A01's examples lack it); misfiled as worksheet freshness in the first appendix | PREF-QC, carried beside A01's examples (decision 8) |
| QC-A22 | «Reaching the same conclusion is also legitimate when children examine each case to earn it. Do not make every answer different or strip useful support to manufacture independence.» | the reviewer's freshness judgement | must not (manufacture novelty); may (the same conclusion) | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L170 | rule (the counterweight to A01; agrees with A21) | REV |
| QC-A23 | «transfer the idea to a situation the lesson never showed them, generate a new example and defend it» | the reason-with band of Do beats | default | | `references/do-beats.md` › intro (the three bands) · L13 | rule | CAT |

## B. The "name it as a check" excuse, its siblings, and the honest claim rules beside them

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-B01 | «As a two-minute orientation straight after the deal is taught, the good/bad sort settles the vocabulary of the deal before the question that matters. It is fine there, named as a check, and it is not the lesson's evidence.» | the Tudor good/bad sort; the reviewer reads this file every run, the designer when choosing evidence | may | a test counts seven `**Where the simpler task is right.**` paragraphs | `references/task-contrasts.md` › History: the reason behind a choice · L17 | contradiction: your decision B ("remove it") for "named as a check"; decision 2 for "orientation" | TC, both clauses out |
| QC-B02 | «Reading labels off a map is right when reading a map is what is being taught, and a quick label-reading check after a new map skill is an honest recall beat, named as one.» | map-reading lessons | may | as B01 | `references/task-contrasts.md` › Geography: reading a map versus using one · L37 | contradiction: decision 1 (a second survivor decision B did not name) | TC, "named as one" out |
| QC-B03 | «Do not reject any of these because the information is supplied or the task is straightforward; judge what the task claims to accomplish, so a pleasant/unpleasant sort is adequate as a brief orientation and insufficient as the main evidence of an explanation.» | the reviewer's limits on its probes | must not (its first clause, obeyed every run); may (the orientation clause) | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L191 | contradiction: decision 2 (the orientation clause only; the first clause stays) | REV, "adequate as a brief orientation" out |
| QC-B04 | «To `sort what was bad and what was good about being an apprentice` is still a fair two-minute orientation before the question that matters; it is not evidence that children can explain the choice, and a lesson that treats it as the main work has taught less than it looks.» | history | may | tests pin `sort what was bad and what was good about being an apprentice` and `it is not evidence that children can explain the choice` | `references/subject-history.md` › Choose the response that reveals the history · L135 | contradiction: decision 2 | SUBJ, the permission out |
| QC-B05 | «The limit is the recap boundary above: where securing the exact term is the point (naming the layers on the tooth diagram just taught), labelling the taught thing is right, and the design says so.» | a match or label whose point is the exact term | may | test pins `labelling the taught thing is right, and the design says so` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L208 | contradiction: decision 3 (against I01 and I02); stale: "the recap boundary above" was removed in 4.2.283 | PREF-MATCH |
| QC-B06 | «A quick recall check is fine when recall is the claim; do not present it as deeper evidence.» | the lesson's diagnostic check | may | | `agents/lesson-designer.md` › Before You Design Anything · L120 | honest claim rule (what a recall may claim), listed in decision 1; decision 4 (it does not say the answer is off the board) | LD |
| QC-B07 | «a beat that makes nothing new but gives useful practice, a needed check or parallel evidence is sound when the design says that is its job.» | the reviewer's spine check | may | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L200 | honest claim rule, listed in decision 1; shared with the rhythm topic (links between beats) | REV |

## C. Permissions that leave out the fresh-case condition

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-C01 | «A quick check, fresh practice of a taught method and a discussion in which each child's reasoning is heard all stay legitimate choices rather than failures to aim higher.» | choosing a beat's operation | may | test pins the opening words | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm (`Choose the material and the thinking together`) · L206 | near-duplicate of A01 without its condition; decision 4 | STAYS, gains the pointer |
| QC-C02 | «A response after new teaching may simply establish or retrieve it, including the last short response before main practice.» | the demand across a lesson | may | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm (`Climb the demand`) · L224 | near-duplicate of A01 without its condition; decision 4; shared with the rhythm topic (TD-F12) | STAYS, gains the pointer (decision 4) |
| QC-C03 | «A short recall response may secure new knowledge, including in the last Do. Read what children actually do; do not label recall as reasoning or force each response to be harder.» | choosing a Do's demand | may | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L257 | near-duplicate of A01 without its condition; decision 4 | LD |
| QC-C04 | «A short response can establish new knowledge; select meaningful use or reasoning where the objective supports it rather than making the last Do harder by position alone.» | the shape across a lesson | may | | `references/do-beats.md` › intro · L17 | near-duplicate of A01 without its condition; decision 4 | CAT |
| QC-C05 | «Add a short justification when the reason behind a placement is part of the intended learning or when it will distinguish understanding from guessing. Accurate classification may itself be the intended check; do not turn every quick sort into a written explanation.» | a sort after teaching | default (a reason when it is the learning or separates understanding from guessing); must not (turn every quick sort into a written explanation) | | `references/do-beats.md` › intro · L15 | near-duplicate of A01 and G01 without their condition; decision 4; its first sentence is also a rhythm row | CAT |
| QC-C06 | «Read or point to an answer the board marks (`training ✗`, a highlighted word)» «It orients the class or checks a detail was noticed. It is not independent inference.» | writing a beat's claim | check | test pins the first cell | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm (`Claim what the work can show`) · L230 | rule (honest claim: it limits what such a task may claim and does not license it as a check); shared with the rhythm topic (TD-G07) | STAYS |
| QC-C07 | «Recall or rebuild a taught arrangement» «It consolidates the arrangement and prepares later work. It is not automatically deeper than explaining it.» | writing a beat's claim | check | test pins the first cell | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm (`Claim what the work can show`) · L231 | rule (honest claim) | STAYS |
| QC-C08 | «Preserve purposeful repeated practice and useful simple checks;» | the reviewer's variety check | must | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L203 | near-duplicate of A02 without the condition; decision 4 | REV |
| QC-C09 | «A retrieval starter is meant to use what children already know.» «Repeated calculations practise a method. A source on the page may be exactly what children should read and interpret.» | the limits on the reviewer's probes | may | tests pin all three sentences | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L191 | duplicate of A02, plus: a source on the page may be the thing to read | REV |
| QC-C10 | «New numbers using the same taught method is exactly what practice is; repetition of a known move is the point, and a reference (the steps, a worked example beside the questions) stays where it enables the method without making the decision. Do not replace fluency with novelty to look harder.» | maths practice | must | | `references/task-contrasts.md` › Maths: practice that repeats, and support that decides · L47 | duplicate of A02, plus: the reference stays | TC |

## D. A Do that summarises its own Teach

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-D01 | «**An explanation, a cause, a mechanism or a relationship** needs using *as* an explanation. This is the chunk most often answered with a written summary that only says it back, so reach past that: complete the because, explain one link in the chain, predict what the idea says will happen before the answer is shown, change one condition and say what follows, turn the words into a diagram or the diagram back into words, or decide which of two explanations is better and why.» | a Teach that explained a cause, mechanism, reason or relationship | must | tests pin the entry, `only says it back` and each of the six moves; list heading `Name what the chunk needs children to do with it` (test constant) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L199. Copies: D02 to D09 | rule | PREF-EXPL |
| QC-D02 | «The case to watch is a Teach that explained a cause, mechanism, reason or relationship: the reflex answer is a written summary, which only says the explanation back, and `do-beats.md` §10 holds the beats that actually use it (complete the because, explain one link, predict before reveal, change one condition, words to diagram and back, what can we tell, connect it back, which explanation is better).» «a kind can be right and the thought still be copying» | as D01 | must | tests pin `the reflex answer is a written summary` and `a kind can be right and the thought still be copying` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L257 | near-duplicate of D01: names all eight §10 beats | LD (pointer, keeping the list) |
| QC-D03 | «Most Teach beats in a content lesson explain a cause, a mechanism or a relationship, and that is the chunk most often answered with a written summary that only says it back; `do-beats.md` §10 holds the formats that use an explanation as an explanation.» | content lessons | must | tests pin `do-beats.md` §10 inside it and the paragraph's order (substance before form) | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L51 | near-duplicate of D01: makes the explanation case the default in content lessons | ROUTE |
| QC-D04 | «An explanation, cause, mechanism or relationship is the case with no obvious channel, and the one most often answered with a summary that only says it back: §10 holds the beats that use it, and talk (§2), writing (§3) or a diagram (§4) can each carry them.» | picking a format | must | test pins `§10 holds the beats that use it` | `references/do-beats.md` › How to pick · L53 | near-duplicate of D01: adds the channels that can carry it | CAT |
| QC-D05 | «This is the commonest chunk in a content lesson and the easiest one to answer with a summary that only says it back.» | the catalogue's contents | pointer | | `references/do-beats.md` › Contents · L71 | pointer | CAT |
| QC-D06 | «The failure they exist to prevent is the summary that only says the explanation back, which reads as processing and is closer to copying.» | §10 formats | must | test pins `only says the explanation back` | `references/do-beats.md` › §10 Explain, predict, infer and connect · L491 | duplicate of D01 (the reason) | CAT |
| QC-D07 | «The test on a finished answer is whether the word "because" is followed by a mechanism or by a restatement. The test on the stem itself is whether the because is already on the board, or was just spoken, in the words the child will give back:» «gets the slide read back to it and shows attention rather than learning. When the Teach has stated the reason, ask for it applied to a case the Teach did not cover (a different practice, a different person), or move to 10.4 or 10.9.» | a because stem | must (its last sentence is the fresh-case rule's own form for because stems) | tests pin `whether the because is already on the board` and `applied to a case the Teach did not cover` | `references/do-beats.md` › §10 (10.1 Because Sentence) · L496 | rule, with an example from a real deck (in the log in other words, L2348) | CAT |
| QC-D08 | «a Do beat following an explanation uses the explanation rather than restating it.» «Where a Teach taught a cause, mechanism, reason or relationship, read the expected answer and ask what a child had to work out that the Teach did not already say: a summary, headline or one-sentence recap of the explanation just given is a restatement wearing a processing beat's clothes, and it passes every check that only asks whether the response matched the teaching. The repair is local and keeps the chunk:» | every Do after an explanation | check | tests pin `uses the explanation rather than restating it` and `what a child had to work out that the Teach did not already say` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L204 | near-duplicate of D01: adds the reading method, the warning that it passes every check that only matches the teaching, and "the repair is local and keeps the chunk" (with F06's list) | REV |
| QC-D09 | «answer is a summary, headline, recap or restatement of the » | the reviewer's routing card opens the rhythm section on it | code | `PREFERENCE_REVIEW_ROUTES`; test pins the trigger | `scripts/design-review-packet.py` › PREFERENCE_REVIEW_ROUTES · L114 | code | CODE |
| QC-D10 | «- Generative forms carry conditions, and the conditions decide whether they work: a summary works when summarising has been taught and collapses into copying otherwise;» «a drawing task needs its contents named; imagining suits children with prior knowledge and is the wrong pick for beginners (Fiorella & Mayer 2016; Dunlosky et al. 2013). Brief the condition alongside the form.» | any summary, drawing or imagining task | must | | `references/evidence-synthesis.md` › 4. Independent Practice · L107 | rule (the research condition); decision 5 | ES |
| QC-D11 | «*"In one sentence, capture what we just learnt."* The constraint is the work — picking the load-bearing idea (Edutopia retrieval-practice strategies). Use sparingly. Do not stack four of these in one lesson.» «**Best for:** end of a Teach chunk where there is a single core idea.» | §3.1 One-Sentence Summary | may | | `references/do-beats.md` › §3 Write (3.1) · L173 | contradiction: decision 5 (a recap of the Teach, offered straight after it) | CAT, with a limit |
| QC-D12 | «*"Summarise what we just learnt in six words. No more."* The cap forces ruthless selection of what matters» «**Best for:** abstract or wordy chunks where pupils need to identify the core.» | §3.3 Six-Word Summary | may | | `references/do-beats.md` › §3 Write (3.3) · L183 | contradiction: decision 5 | CAT, with a limit |
| QC-D13 | «*"In one headline, sum up the most important thing we've learnt so far."*» «**Best for:** end of a major Teach chunk; bridge into the lesson's main Practise.» | §8.7 Headline the Lesson | may | | `references/do-beats.md` › §8 Generative (8.7) · L433 | contradiction: decision 5 | CAT, with a limit |
| QC-D14 | «*"Write two things you now know about X."*» «**Best for:** consolidating a single Teach chunk fast. Lower stakes than Brain Dump.» | §1.2 Two Things | may | | `references/do-beats.md` › §1 Recall (1.2) · L88 | contradiction: decision 5; stale: "Brain Dump" has no entry | CAT, with a limit |
| QC-D15 | «One child gets 30 seconds to teach the partner what they just learnt; then swap.» «**Best for:** after a content-rich Teach slide; works as the bridge into written response.» | §2.8 30-Second Expert | may | | `references/do-beats.md` › §2 Talk (2.8) · L161 | contradiction: decision 5 | CAT, with a limit |
| QC-D16 | «*Three things I learned, two things I wonder, one thing I want to remember.*» «**Best for:** end-of-lesson consolidation; mid-lesson if you want a wider sweep.» | §9.4 Three-Two-One | may | | `references/do-beats.md` › §9 Metacognitive (9.4) · L465 | contradiction: decision 5 | CAT, with a limit |
| QC-D17 | «"Write everything we learned" not Apply: changes nothing, primary children recall little onto blank - if synthesis needs remembering, give structure to remember into.» | the ending | must not | | `agents/lesson-designer.md` › Apply Slide · L339 | shared (Apply, topic 7); bears on decision 5 | STAYS |
| QC-D18 | «Adding `because`, `explain` or `how do you know?` does not by itself turn recall or identification into deep reasoning.» | writing a reasoning prompt | must | | `references/reasoning-prompts.md` › Stem clauses that sharpen a prompt · L38 | rule | STAYS |
| QC-D19 | «Pupils draw what was just described. *"Sketch the water cycle as I described it. 90 seconds. Stick figures fine."*» | §4.1 Quick Sketch | may | | `references/do-beats.md` › §4 Visual / Draw (4.1) · L217 | decision 5 (gives back what was just described, no limit) | CAT, with a limit |
| QC-D20 | «A small box in which pupils combine icons, arrows, and a few words to capture the chunk» «**Best for:** end-of-chunk consolidation when content is conceptual.» | §4.4 Sketchnote | may | | `references/do-beats.md` › §4 Visual / Draw (4.4) · L232 | decision 5 | CAT, with a limit |
| QC-D21 | «Children say or write in one sentence what a diagram, arrow or model shows.» «**Best for:** after a modelled diagram, and as the check that a picture children copied actually means something to them.» | §10.6 Diagram to Words | may | | `references/do-beats.md` › §10 (10.6 Diagram to Words) · L521 | contradiction: decision 6 (a one-sentence account of the diagram just modelled, against D08) | CAT |
| QC-D22 | «Where the Teach produced a chain or a diagram with arrows, each child explains a single named link rather than the whole thing.» | §10.2 Explain One Link | may | | `references/do-beats.md` › §10 (10.2 Explain One Link) · L501 | contradiction: decision 6 (no condition that the link is not the one the Teach explained) | CAT |
| QC-D23 | «Children turn the spoken explanation into a drawing, arrows, a labelled sketch or a completed part-drawn figure.» | §10.5 Words to Diagram | may | | `references/do-beats.md` › §10 (10.5 Words to Diagram) · L516 | decision 6 (the same shape when the Teach already showed the diagram) | CAT |

## E. The `thinking` line read against the board

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-E01 | «**Write each beat's `thinking` before you choose its activity.**» «Then read the line against what the slide will show and against what the class knew walking in: a thought a child can finish by finding words on the board is copying, one they could finish before the lesson is guessing, and neither leaves anything about the idea behind.» | every beat's `thinking` line | check | `thinking` (validator: at most 200 characters; null allowed only for teacher-acts kinds, which include every `prepare` unit, even a bounded attempt where every child acts); tests pin the lead and `one they could finish before the lesson is guessing` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L253. Copies: E03, E05 to E08 | rule (the board test); the `thinking` line itself is shared with the rhythm topic | LD |
| QC-E02 | «A Year 4 RE beat asked children to finish `My walk matters because...` under a bubble that already said `being outside helps me feel calm`; the line for that beat, honestly written, was `Where on the slide is the reason?`, and seeing it written is what makes the repair obvious: take her reason away and ask what could make a walk matter.» | illustrates E01 | | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L253 | story (a real deck; not in the log) | undated example, or LOG |
| QC-E03 | «So before opening the catalogue, write the beat's own `thinking` line: the question a child's mind is answering while they work, in that child's terms. Then read it against what the slide will show. If the line can be answered by reading the board, choose again, because copying is what will be remembered» | before choosing a Do format | must | test pins `If the line can be answered by reading the board, choose again` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204 | near-duplicate of E01: lacks the guessing half (what the class knew walking in), adds "copying is what will be remembered" | PREF-EXPL (keep both halves) |
| QC-E04 | «Settling the kind is not yet settling the thought: `complete the because` was on this list, a Year 4 RE design picked it after a slide that already stated the because, and the thought a child actually had was where to copy the words from.» | illustrates E03 | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204 | story (in the log, 4.2.123) | undated example, or LOG |
| QC-E05 | «Every subject has a doing that passes for thinking because the objective names it» «For each `thinking` line: could a child answer it from what is on the board, or from what they knew walking in? If yes, the beat is reading or guessing, whatever it is called.» | every beat | check | | `references/preferences.md` › What a Lesson Is For · L158 | duplicate of E01 | PREF-WLF |
| QC-E06 | «`thinking` is one short line naming the thought every child has to have to do this beat» «Read it against what the slide shows and against what the class knew walking in: if a child can complete the thought by finding words already on the board, the beat is copying; if they could have completed it before the lesson, the beat is guessing; and the residue of either is nothing about the idea.» | recording `thinking` | must | `thinking` | `references/output-template.md` › Source-unit contract · L446 | duplicate of E01 (the field's contract) | STAYS (contract) |
| QC-E07 | «a format that lets the child answer that question by reading the slide, or from what they knew walking in, is out, whatever section it came from;» | picking a format | must | | `references/do-beats.md` › How to pick · L51 | duplicate of E01 | CAT |
| QC-E08 | «A line a child can complete by finding words already on the board (`My walk matters because...` under a bubble that supplies the reason) is copying wearing a Do beat's clothes, and the format having come from the right catalogue section does not save it;» | every beat the reviewer reads | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L201 | duplicate of E01 | REV |
| QC-E09 | «a sentence stem that reads `My walk matters because...` under a speech bubble that already says `being outside helps me feel calm` is a fine-looking activity whose thought is finding words on the slide.» | illustrates the three questions | | | `references/preferences.md` › What a Lesson Is For · L152 | example; shared (the three questions, What a Lesson Is For) | STAYS |
| QC-E10 | «A line answerable by reading the source (`what changed about the starting age?` when both ages are printed) is this comprehension text again, however dated the two sources are, and it fails the test whatever the beat is called.» | history source beats | check | | `references/subject-history.md` › How a history lesson goes shallow while staying accurate · L107 | rule (the subject's version of E01) | SUBJ |
| QC-E11 | «`What changed about when children could start?` over a slide printing `before sixteen` and `at least sixteen` is answered by reading;» «`what is different about these two rattles?` is answered from the picture by a child who knows no history; both are the subject's doing (using sources) passing for its thinking (what the source shows about the people, and why), and a reviewer approved both.» | as E10, and the guessing half | check | tests pin `is answered by reading` and `a reviewer approved both` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L201 | near-duplicate of E10: adds the second example (answered from the picture with no history), the half E10 lacks; story in the log (L2306) | REV |
| QC-E12 | «**A source used as a comprehension text.** A source on the board that children read answers off is a slide with facts on it. It becomes evidence the moment a child has to work out something the source does not say outright» «reading a source together for what it plainly says is exactly right when that is the knowledge being taught.» «a source beat's `thinking` line names the thing the source does not say outright about the people» | history sources; exception: the source's plain words are the knowledge being taught | must; may (the limit) | test pins the `thinking` clause | `references/subject-history.md` › How a history lesson goes shallow while staying accurate · L107. Copies: E10, E13 | rule (E10 is its last sentence) | SUBJ |
| QC-E13 | «**A map used as a picture rather than a tool.** A map on the board that children read answers off is a slide with facts on it.» «`what can you see on the map?` is reading a picture, and a line a child could answer without the map at all (`is it hot in the desert?`) is not geography yet» «a map on the board is exactly right when it is the shared reference the class annotates during teaching, or the thing being explained.» | geography maps; exception: the shared reference the class annotates, or the thing explained | must; may (the limit) | | `references/subject-geography.md` › Making the thinking geographical · L60 | near-duplicate of E12 for maps, with its own limit; bears on decision 1 (map label-reading) | SUBJ |

## F. `Which Claim Does This Support?` and evidence children read for themselves

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-F01 | «The evidence is something children read for themselves: when the Teach has just said what a source shows, the right claim is that sentence again and choosing it is finding, not weighing. Each wrong option is one a child this age might really believe (`Plant A had more sunlight`, a cause the result cannot show), never the `every` and `nothing` extremes a child rejects on sight.» | the Which Claim format | must | heading `### 10.8 Which Claim Does This Support?` (test); tests pin `choosing it is finding, not weighing` and `never the \`every\` and \`nothing\` extremes a child rejects on sight` | `references/do-beats.md` › §10 (10.8 Which Claim Does This Support?) · L531. Copies: F03, F05 | rule (narrowed in 4.2.283) | CAT |
| QC-F02 | «**Best for:** results, readings and records children interpret for themselves. In primary history, `Match the evidence to the claim` in `subject-history.md` does the same work with cards children can hold, and a claim about what one document proves is rarely the right thought for Years 3 and 4.» | the Which Claim format | default | | `references/do-beats.md` › §10 (10.8) · L532 | rule (limit, with a history pointer) | CAT |
| QC-F03 | «**Evidence** needs a conclusion drawn from it carefully: what it tells us, and the detail in it that shows so; what it cannot tell us yet, when the lesson's question turns on that. The evidence is something children read for themselves, not a source the Teach has just interpreted for them.» | a chunk that is evidence | must | test pins `what it cannot tell us yet` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L200 | rule | PREF-EXPL |
| QC-F04 | «**Match the evidence to the claim.** Three source cards and the claim `Tudor children worked`: children tick the sources that could show it and cross the one that could not. The crossed one is about the right period and the wrong question.» | history | may | | `references/subject-history.md` › Choose the response that reveals the history · L141 | rule (the subject's form of F01) | SUBJ |
| QC-F05 | «**Which result supports it?** Choose the result that is evidence for the claim, and say what rules the others out (10.8).» | science | may | | `references/subject-science.md` › What a Do beat looks like in science · L66 | near-duplicate of F01 without its two conditions (evidence the children read; wrong options they would believe), reached only by the pointer; decision 8 | SUBJ, with the pointer |
| QC-F06 | «the detail in fresh evidence that shows the idea, or which of two explanations a child could genuinely believe is better» | the reviewer's repair list | may | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L204 | duplicate (repair list of D08) | REV |
| QC-F07 | «**Say what the source cannot tell us.** Under a source children have not seen, two boxes: children write one thing it shows and one thing it cannot tell us. For a lesson whose objective is what sources can tell us; elsewhere the caution is the one question step 5 of the sketch asks, not a beat of its own.» | history | may (in a lesson on what sources tell us); must not (a beat of its own elsewhere) | | `references/subject-history.md` › Choose the response that reveals the history · L143 | shared (history subject; narrowed in the same release) | STAYS |

## G. Option banks, matches and sorts that can be answered from the board

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-G01 | «**A quick match, sort or label is a real Do beat when the things on the cards are new.**» «What decides whether the child is using the idea or finding the slide is what the items are.» «So write the items as fresh cases of what was taught: a new fraction to label, an unseen photograph to sort, a material the demonstration did not use. A match that can be finished by elimination gets one card that belongs nowhere, so the last pair still has to be decided.» | every quick match, sort or label; the permission beside it is G30 (no explanation bolted on); the limit is B05 | must | the bold lead is cited by name (reviewer, catalogue); tests pin it and `gets one card that belongs nowhere` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L208. Copies: G03 to G05 | rule; your decision of 14 September (in the log at 4.2.205) | PREF-MATCH |
| QC-G02 | «A Teach saying `Tom fetched wood, which gave the family a fire`, followed by matching `fetched wood` to `a fire`, has children finding the slide's own words.» «The same match over jobs the slide did not show (`carried water`, `minded the pigs`) needs the idea that a child's work gave the family something it needed.» | illustrates G01, both ways | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L208 | example (undated; from the Tudor deck the log records) | with G01 |
| QC-G03 | «**What makes it thinking:** the items are fresh cases of what was taught, not the slide's own words, and one card belongs nowhere so the last pair cannot be won by elimination» | §5.4 Match the Pairs | must | | `references/do-beats.md` › §5 Sort / Classify (5.4) · L285 | duplicate of G01 | CAT (pointer) |
| QC-G04 | «`right` may carry distractors that match nothing (here `40` and `70`), so children round each number rather than pairing by elimination.» | the `matching` helper | mechanics | `matching` (`left`, `right`, `connections`) | `references/templates.md` › `matching` · L841 | near-duplicate of G01: the helper's way of adding the spare card | STAYS (catalogue) |
| QC-G05 | «so is a match, sort or label whose cards are the slide's own words, where a quick placement over cases the Teach did not show would have used the idea» | every beat the reviewer reads | check | test pins `whose cards are the slide's own words` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L201 | duplicate of G01 | REV |
| QC-G06 | «The groups of a sort are the other half, and a child has to understand them before any card can be placed. Say the difference between the two groups in one plain sentence a nine-year-old would follow.» «Then read the key for every card as a child would defend it. A card that honestly belongs in both groups is confusion rather than challenge, unless the idea being taught is that one thing can be both, and then the lesson says so out loud» «Three repairs, and the beat's purpose decides which: choose a cleaner card (`his own shop one day`); keep the card and record the second placement as accepted, with its reason, in the answer's `acceptanceCondition`, so the teacher hears the reason rather than the column; or change the task so the overlap is the point (`which of these helped him now, and later too?`).» | every sort | must | tests pin the plain-sentence rule, `is confusion rather than challenge, unless the idea being taught is that one thing can be both`, `choose a cleaner card` and `record the second placement as accepted, with its reason`; `acceptanceCondition` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L210. Copies: G07, G08 | rule (groups and key) | PREF-MATCH |
| QC-G07 | «`knowing when bread is baked just right` was keyed to `helped him when he grew up` because it is what earned his living, and a child who put it under `helped him straight away` because he was learning it now was right as well; a key that marks that child wrong is the fault, not the child.» | illustrates G06 | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L210 | example (in the log, L1137) | with G06 |
| QC-G08 | «`knowing when bread is baked just right` under `helped him straight away`, because he was learning it now, is right, and a key that allows only `when he grew up` marks that child wrong; the `acceptanceCondition` is where the second placement belongs.» | the reviewer's second probe | check | `acceptanceCondition` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L189 | duplicate of G06 and G07 | REV |
| QC-G09 | «Sorting into supplied categories may test recognition; identifying categories, resolving an ambiguous placement or defending a criterion may demand substantial reasoning. Do not assign a cognitive level merely because the activity is called a sort.» | §5 sorts | check | | `references/do-beats.md` › §5 Sort / Classify · L261 | rule | CAT |
| QC-G10 | «Every keyed format in this section passes through the answer-scatter principle in the core notes at the top of this file: scatter the key so each item has to be decided on its own merits.» | §5 keyed formats | must | | `references/do-beats.md` › §5 Sort / Classify · L263 | pointer; stale name: the top of the file calls it `Protect answers without destroying meaningful order` | CAT |
| QC-G11 | «**Protect answers without destroying meaningful order.** Avoid accidental item-position patterns that let children guess answers when order carries no teaching meaning. Preserve chronology, procedural sequence, deliberate mathematical patterns and any other order that is itself part of the learning.» | every keyed format | must | | `references/do-beats.md` › intro · L21. Copies: G10, G12, G13, H11 | rule | CAT |
| QC-G12 | «An ordering task hands over its answer when its items are printed in order, and it happens easily because the designer types them in the order they know: Stone Age, Roman, Anglo-Saxon, today. Shuffle them, so the child has to decide. The design validator refuses a datable list printed in answer order, but the habit belongs here.» | history ordering tasks | must (code, for option banks and starter lists) | validator: answer-order refusal (P06) | `references/subject-history.md` › Chronology, and what the starter should recall · L201 | near-duplicate of G13 for history: adds why it happens and the validator note | SUBJ |
| QC-G13 | «Scramble the display so the order has to be decided, then keep the true order in the answer.» | §5.8 Put It in Order, in every subject | must | | `references/do-beats.md` › §5 Sort / Classify (5.8) · L303. Copy: G12 | rule (the cross-subject form; adds "keep the true order in the answer") | CAT |
| QC-G14 | «- a child cannot succeed by copying, reformatting, reading a visible answer or following a predictable answer pattern;» | every task the reviewer reads | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L206 | rule | REV |
| QC-G15 | «- a hinge or checking question cannot be answered from an incidental picture cue, wording cue, answer position or immediate repetition; the correct response must depend on the relationship, decision or method being assessed;» | every check the reviewer reads | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L207 | rule (the reviewer's form of K11) | REV |
| QC-G16 | «The cases differ on the taught feature rather than on wording, colour or position. A picture feature is fine when it is the evidence the idea reads (the river on the map, the rust on the nail); a cue that gives the answer without the idea makes it recognition.» | a discriminate beat | check | | `references/do-beats.md` › Operations to think with (Discriminate) · L555 | rule | CAT |
| QC-G17 | «The fault is not marked for the child, and finding it needs the taught arrangement or method; a printed cross makes it reading.» | a diagnose beat | check | | `references/do-beats.md` › Operations to think with (Diagnose) · L560 | rule | CAT |
| QC-G18 | «The comparison is not already completed on the board, and the criterion comes from the teaching rather than from general sense.» | a compare beat | check | | `references/do-beats.md` › Operations to think with (Compare) · L556 | rule | CAT |
| QC-G19 | «The surrounding wording does not cue the missing part, so filling it needs the taught relationship rather than the pattern of the sentence.» | a complete beat | check | | `references/do-beats.md` › Operations to think with (Complete) · L554 | rule | CAT |
| QC-G20 | «What was taught gives a reason for the prediction and nothing on the board gives it away.» «The prediction need not be certain (`probably, because...` is a prediction); one with no taught reason behind it is a guess.» | a predict beat | check | | `references/do-beats.md` › Operations to think with (Predict) · L558 | rule | CAT |
| QC-G21 | «A label is not the decision. `Diagnose` can mean reading a cross printed on the board and `retrieve` can be exactly the check the next step needs, so name the thing to diagnose, the material it sits in and the understanding that makes it possible, and judge the task children will actually do, never its operation label.» | naming a beat's operation | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm (`Choose the material and the thinking together`) · L206 | rule; shared with the rhythm topic | STAYS |
| QC-G22 | «`items` contains 2 to 12 entries. Each `label` is the exact child-facing text for that item. Preserve item order.» | recording an option bank | mechanics (code) | `taskStructure.kind` `option-bank`, exact keys `id`, `label`, `item-###` | `references/output-template.md` › Source-unit contract · L468 | mechanics | STAYS (contract) |
| QC-G23 | «Never downgrade a sort to an option bank, evidence-classification or prose because the beat carries no answer slide; the structure records what children actually do.» | recording a sort | mechanics | `taskStructure` kinds | `agents/lesson-designer.md` › Worksheet · L375 | mechanics | LD |
| QC-G24 | «The criteria for comparing come from what was taught, or the sort is a spot-the-difference picture game.» | §5.10 Same and Different | must | | `references/do-beats.md` › §5 Sort / Classify (5.10) · L313 | rule | CAT |
| QC-G25 | «So the test of a hands-on beat is the test of a sentence: could a child place every card without the history the lesson just taught? If yes, the cards are the wrong cases or the groups are the wrong contrast, and the decision the objective names has to sit where the period is needed to make it:» | history sorts and matches | check | tests pin the question | `references/subject-history.md` › Choose the response that reveals the history · L135 | rule (the subject's form of M01) | SUBJ |
| QC-G26 | «Its two sorts were approved for their wording and their plain headings, and taught the next day they were shallow: a child could put `a hot dinner every day` under `helped him straight away` and `up before sunrise` under `bad things about being an apprentice` from everyday sense, with no Tudor knowledge at all,» | illustrates G25 | | test pins `approved for their wording and their plain headings` | `references/subject-history.md` › Choose the response that reveals the history · L135 | your example (taught 15 September; in the log, L1135); decision 10 | SUBJ |
| QC-G27 | «What decides whether a placement is the thinking is what a child has to know to make it, and the Tudor lesson rebuilt on 14 September 2026 is the calibration for both halves.» | history | | | `references/subject-history.md` › Choose the response that reveals the history · L135 | your example (dated); decision 10 | SUBJ, undated |
| QC-G28 | «Requires: reading the card and knowing that early mornings are unpleasant. A child who slept through the lesson sorts all six correctly.» «is where the thinking was meant to be, and it arrives as a discussion after a sort that already felt like the work.» | the history contrast's weak task; its second quote is the file's own reason the orientation sort fails (decision 2) | check | | `references/task-contrasts.md` › History: the reason behind a choice · L13 | rule (the contrast) | TC |
| QC-G29 | «**Protect answer:** Don't reveal via wording, stems, neighbours, order, patterns unless revealed feature is teaching target. When judging correctness, use stems working for either verdict; state error exists only when locating/explaining/correcting known error is task. Keep related instances together when relationship/pattern/contrast is learning; separate when neighbours would cue answer.» «Item labels count: a qualifier bolted onto a label to pre-settle its classification ("ordinary pedal bicycle") hands child the answer and breaks child voice at once.» | every item a child decides; exceptions: the revealed feature is the teaching target; an error may be named only when locating, explaining or correcting it is the task; related instances stay together when the relationship is the learning | must | | `agents/lesson-designer.md` › Lesson Components - design in sequence, record key reasons in decisions · L170 | rule (the designer's own answer protection; overlaps G11, H09 and S12) | LD |
| QC-G30 | «Straight after a new idea, a simple placement can be exactly the right beat, and it does not need an explanation bolted on to count: the user wants children matching and sorting, not explaining after every slide.» | a match, sort or label straight after teaching | may | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L208 | your ruling (your words; the permission G01's fresh-case condition limits, and what C05 rests on) | PREF-MATCH, word for word |
| QC-G31 | «The result settles the question and is not supplied with its conclusion attached.» | a test beat | check | | `references/do-beats.md` › Operations to think with (Test) · L559 | rule | CAT |
| QC-G32 | «Only one thing changes, and what was taught is enough to work out the consequence.» | a change beat | check | | `references/do-beats.md` › Operations to think with (Change) · L557 | rule (K11's condition as an operation) | CAT |
| QC-G33 | «The read-back test: look at the source you are about to hand over and ask whether any part of it already sits in the target form. If a child could reach the finished script by copying your source and adding punctuation, the source has leaked the answer» | a skill lesson's source to convert | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L43 | rule (the route's form of G14); its reviewer quotation is stale (found in passing) | ROUTE |
| QC-G34 | «The bubbles, lines, or boxes the child fills in to demonstrate that doing stay blank.» «Labelling every tick hands over the answer, because the child then reads a printed number instead of reasoning about the scale.» | any scaffold | must | heading `Cognitive Load Triage on Scaffolds` (routing card: "when a scaffold may reveal the answer") | `references/preferences.md` › Cognitive Load Triage on Scaffolds · L247 | shared (scaffolds and support, topic 7) | STAYS |
| QC-G35 | «**Break predictable patterns.** Where the order is yours, shuffle so answers do not climb or alternate. The exception is a sequence an upstream designer ordered deliberately to make a pattern surface» «blank's length never leaks which word it wants.» | worksheet questions and stems; exception: an order the designer set to make a pattern surface | must | | `agents/worksheet-designer.md` › Rules that never change · L854 | shared (worksheets, topic 6); the sheet's form of G11 | STAYS |

## H. Wrong options a child would believe, and verdicts read off the format

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-H01 | «**Wrong option must be genuinely tempting - never obvious strawman.** Wrong idea plainly silly teaches nothing. Wrong position should be one thoughtful child this age could actually hold - close enough to right that telling apart demands thinking taught. Calibrate gap to year group: Y1–2 obvious contrast fine, Y3 needs thought, Y4–6 plausible enough child must reason carefully, never poles where right obvious. Holds anywhere children weigh right vs wrong.» | anywhere children weigh right against wrong; exception: Y1 to 2 may have an obvious contrast | must | | `agents/lesson-designer.md` › Misconceptions · L309. Copies: H02 to H04, H06, H10, and the last clause of A01 and F01 | rule (the fullest copy) | LD |
| QC-H02 | «**Temptingness judged in position, not isolation.** Claim can be perfectly chosen and dead because what sits immediately before: when Teach just stated correction large type and teacher said aloud 30 sec earlier, disagreement that follows asks repeat sentence not weigh idea. Check each option against slide before it: could child answer without understanding idea, just remembering sentence I said? When yes, move thinking on not make wrong sillier - push claim one step past stated into consequence needing reasoning. Y4+ can carry that step.» | a claim judged straight after a Teach | check | | `agents/lesson-designer.md` › Misconceptions · L311 | rule (the position half of A01) | LD |
| QC-H03 | «Make each wrong option plausible for the age and tied to a specific misunderstanding.» | §3.7 hinge question | must | | `references/do-beats.md` › §3 Write (3.7) · L200 | near-duplicate of H01 and H06: adds "tied to a specific misunderstanding", which H01 lacks | CAT |
| QC-H04 | «**The limit:** the user finds true or false "fine, but can be cheap". A statement a child can mark by remembering the slide is surface; it earns its place only when the statement is one a child in the class could genuinely believe (`Tudor families sent children to work because they didn't care about them`) and the reason is written. Prefer a sort, a match or an odd one out when those force the same decision.» | §5.3 True or False | must | | `references/do-beats.md` › §5 Sort / Classify (5.3) · L279 | your ruling (14 September; in the log, L1201) | CAT |
| QC-H05 | «**Best for:** recall consolidation that feels like a game.» | §5.6 Two Truths and a Lie | may | | `references/do-beats.md` › §5 Sort / Classify (5.6) · L294 | near-duplicate of H04's format without its limit; decision 5 | CAT, with H04's limit |
| QC-H06 | «- Use **diagnostic questions** (Hodgen, Craig Barton style): multiple choice where each distractor maps to a specific misconception, so a wrong answer tells you *which* misconception.» | multiple choice | default | | `references/evidence-synthesis.md` › 5. Misconceptions · L132 | rule (research) | ES |
| QC-H07 | «- When you build a two-option discrimination — a spot-the-mistake pair, a contrast, a hinge question, a diagnostic distractor — make the two options differ on *exactly* the dimension you are teaching and be equivalent on every other.» «Test it by trying to defend the option you marked wrong: if a sharp pupil could win that argument, the pair is confounded» | every two-option discrimination | must | | `references/evidence-synthesis.md` › 5. Misconceptions · L134 | rule | ES |
| QC-H08 | «Both must be about the same case and differ only on the taught point, or a child can win the argument for the wrong one (`evidence-synthesis.md` §5).» | §10.10 Which Explanation Is Better? | must | test pins `differ only on the taught point` | `references/do-beats.md` › §10 (10.10) · L541 | duplicate of H07 | CAT |
| QC-H09 | «**A judged claim is only a judgement while the child cannot tell the verdict from the shape of the slide.**» «Across a lesson with more than one judged claim, let at least one be right; across a unit, keep the mix genuinely unpredictable.» | one-voice `Is X right?` and always, sometimes, never; not a two-voice disagreement or find the mistake | must | | `agents/lesson-designer.md` › Misconceptions · L319. Copy: H10 | rule | LD |
| QC-H10 | «The named child is right often enough that the verdict cannot be read off the shape (`lesson-designer.md` → Misconceptions): the example sheets fail here, with every claim on some sheets wrong.» | maths sheets | must | | `references/subject-maths.md` › How a maths sheet's questions are worded · L110 | near-duplicate of H09: adds that the example sheets the file names as its standard (L91) fail here | SUBJ |
| QC-H11 | «- Where wrong options are used, map them cleanly to plausible misconceptions and protect the answer from wording or position cues.» | checks with options | must | | `references/evidence-synthesis.md` › 6. Checking for Understanding · L151 | duplicate of H06 and G11 | ES |
| QC-H12 | «The prediction is only worth making when what was just taught decides it; one a child could make from general good sense is a guess, and the next Teach then only tells them whether they were lucky (10.3 holds the stronger form).» | §8.2 Predict the Next Slide | must | test pins the first clause | `references/do-beats.md` › §8 Generative (8.2) · L408 | rule | CAT |
| QC-H13 | «The prediction has to be settled by the explanation just taught, not by general good sense, or it is a guess with a reason attached.» | §10.3 Predict Before Reveal | must | | `references/do-beats.md` › §10 (10.3) · L506 | duplicate of H12 | CAT |
| QC-H14 | «Name an error in the prompt only when locating or repairing a known fault is itself the intended task; otherwise that wording supplies the verdict. Include enough of the attempt for children to inspect its relevant features rather than repeat a familiar correction.» | an Inspect an attempt prompt | must | | `references/reasoning-prompts.md` › Reasoning prompt types · L20 | near-duplicate of G29 and S12: adds that the attempt must show enough to inspect rather than repeat a familiar correction | STAYS (reasoning prompts) |
| QC-H15 | «**A contrast that teaches a category changes one thing only.** The pair exists to isolate the feature children must learn to see, so hold every irrelevant feature stable and vary only that one - the same principle the diagnostic check uses, applied to teaching.» «A muddled pair is never repaired by better wording» «This governs every contrast used to teach or test a category, wherever it sits - a misconception strategy, a Teach beat's examples, a sorting set, a key question.» | every contrast that teaches or tests a category; limit in S39 | must | test pins it | `agents/lesson-designer.md` › Misconceptions · L305 | rule (the designer's form of H07 and K11) | LD |
| QC-H16 | «**Do not ask "which is better?"** The class answers that correctly from length alone and learns nothing.» | a launch's strong and weak instances | must not | | `references/explanation-tasks.md` › When the launch shows the model · L87. Copy: S44 | rule (a check answered from a surface cue); shared with the launch | STAYS |
| QC-H17 | «**Let a child state the pattern; don't state it and ask why.** `Explain why the difference stays the same` hands over the finding and then asks for a proof.» | maths reasoning questions | must | | `references/subject-maths.md` › How a maths sheet's questions are worded · L104 | rule; shared (maths sheets); beside S12 | SUBJ |
| QC-H18 | «A blind guess is not useful prediction evidence.» | science predictions | must | | `references/subject-science.md` › Make predictions and conclusions useful · L53 | duplicate of H12 and H13 | SUBJ |

## I. When a term's exact wording is the learning

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-I01 | «when a term's exact wording is the learning, the check is the term used on a fresh case, not the sentence said back» | a check on a term | must | test pins it; vocabulary pin VOC-G10 | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L204 | shared with vocabulary (VOC-G10); against B05 (decision 3) | STAYS (pinned) |
| QC-I02 | «**Label a new diagram.** The same parts on a different plant, tooth or circuit from the one taught, so the label is recognised rather than remembered.» | science | may | | `references/subject-science.md` › What a Do beat looks like in science · L65 | rule; against B05 (decision 3) | SUBJ |
| QC-I03 | «Choose a deliberate oral rehearsal only when saying the exact word, definition, sequence or response together is the learning activity.» | §1.3; a teacher-owned routine, never selected unless the teacher asks | may | | `references/do-beats.md` › §1 Recall (1.3) · L94 | rule | CAT |
| QC-I04 | «Whole-class rehearsal of a definition, date or sequence step where saying the exact response together is the learning activity» «**Best for:** locking in vocabulary, sticky knowledge, key facts.» | §1.7 Choral Response; a teacher-owned routine | may | | `references/do-beats.md` › §1 Recall (1.7) · L112 | near-duplicate of I03 | CAT |
| QC-I05 | «When a check asks children to *produce or name* something (write the column that changes, name the shape family), the words they answer with have to be somewhere on screen, or the task tests recall of the vocabulary rather than the thing being checked.» | a quick-check slide | must | `split-h-75-25`, `chip-bank`; vocabulary pin VOC-N26 | `references/templates.md` › `numbered-questions` · L1142 | shared with vocabulary (VOC-N26) | STAYS (pinned) |
| QC-I06 | «A simple unlabelled diagram is provided; pupils add labels, arrows, and short notes from memory» | §3.5 Annotate the Image / Label the Diagram | may | | `references/do-beats.md` › §3 Write (3.5) · L193 | near-duplicate of I02 without saying the diagram is new; decision 3 | CAT |
| QC-I07 | «Given a partially-blank diagram, pupils fill in labels» | §4.2 Labelled Diagram from Memory | may | | `references/do-beats.md` › §4 Visual / Draw (4.2) · L222 | near-duplicate of I02 without saying the diagram is new; decision 3 | CAT |
| QC-I08 | «**The rail carries the words a child answers WITH, never the answer.** A heading strip, the category names, a criteria line — those give a child the language and leave the thinking to them. A worked example or a filled-in chart does the thinking, and the check stops checking.» | the quick-check rail beside a check | must | `split-h-75-25` | `references/templates.md` › `numbered-questions` · L1161 | rule (the other half of I05); shared with the slide designers | STAYS |
| QC-I09 | «The stick-in builder always forces the write-on world form, even if a labelled teaching map was copied from the slide, so the child's map stays a genuine retrieval task.» | a world map a child labels | must (code) | write-on world form, `continentMarkers`, `oceanMarkers` | `references/stick-in-sheets-pedagogy.md` › The stick-in-sheets spec · L110 | shared (stick-in, topic 9); decision 3's limit: a unique thing has no other picture | STAYS |
| QC-I10 | «A photograph children annotated in an earlier lesson, brought back for four labels from memory, is often a better locational retrieval than the same recall written out as questions.» | geography starters | may | | `references/subject-geography.md` › Retrieving where places are · L128 | shared (starters, topic 7); decision 3's limit: a later lesson's label task is retrieval | STAYS |

## J. Skill lessons: fresh guided and independent cases

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-J01 | «**Every cycle ends with its own Your Turn, and it is a check rather than the main practice.** The teacher's words: "The your turns are good because they are a quick check of can we do this before moving on to the next concept, even if its similar."» «So the Your Turn after a cycle answers one question, can the class do this yet, and it is sized to the cycle rather than to the lesson.» «**A bridging cycle on small numbers earns two questions, not none**» | skill lessons | must (code: a cycle with no Your Turn is refused) | `your-turn`; tests pin your words | `references/teaching-sequence-skill-based.md` › Output Format Block · L215 | your ruling (your words) | ROUTE |
| QC-J02 | «A Your Turn that re-sorts the exact shapes the teacher just placed, by the same labels, is a copy of the demo, not independent practice — the child finishing it would barely notice the slide changed. The method stays identical (that is the point of the rhythm); the *problem* is fresh.» | a skill lesson teaching a tool | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L33 | rule | ROUTE |
| QC-J03 | «The failure to avoid is the inverse: pouring the hardest discriminations into My Turn and Our Turn and then giving a Your Turn that re-runs the same easy instances already shown, so the modelling does the thinking and the independent practice tests nothing.» | as J02 | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L31 | rule | ROUTE |
| QC-J04 | «Both look like two examples but are one: the whole chart, every row, is on screen throughout the My Turn, so the row the Our Turn turns to was never new, and children read off a chart they have already watched the teacher read.» | reading a value off a multi-item visual; exception: a fixed dataset where the question changes to a new move | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L77 | rule | ROUTE |
| QC-J05 | «a second example that undoes the first: `1,390 + 10 =` followed by `1,400 - 10 =` asks the class to find 1,390, which is already printed above it as the first example's starting number, so the second question is read off rather than worked and the pair demonstrates one instance while looking like two.» «The limit is when the inverse relationship is itself the teaching point» | a unit's examples; exception: the inverse is itself the teaching point | must | tests pin the pair and `the second question is read off rather than worked` | `references/teaching-sequence-skill-based.md` › Output Format Block · L235 | rule | ROUTE |
| QC-J06 | «For Skill-based lessons, check that distinct independent cases are prepared, processes are modelled rather than merely displayed, guided and independent examples are fresh, and support enables rather than supplies the intended performance.» | the reviewer, skill lessons | check | | `references/design-review-route-checks.md` › Skill-based · L7 | rule (the reviewer's form of J02 to J05) | REV (route checks) |
| QC-J07 | «- For a repeatable skill, use a fresh supported attempt focused on the decisions children will later make independently.» | guided practice | default | | `references/evidence-synthesis.md` › 3. Guided Practice and Release for Repeatable Skills · L85 | rule (research) | ES |
| QC-J08 | «the Your Turn usually sorts by different properties from the taught examples, so a child chooses against fresh criteria rather than echoing the demonstration.» | the slide designer building a Your Turn diagram | default ("usually") | | `references/slide-representations.md` › Practice sorts: the diagram, its labels, and the items live on the practice slide · L45 | shared (slide designers, topic 9) | STAYS |
| QC-J09 | «**A bounded attempt only works while the answer is still the child's to find.**» «A starter photograph of the working circuit, or a `complete / incomplete` card taught two minutes earlier, turns *Can you make the lamp light?* into copying from the board, and the modelling that follows then answers a question nobody has.» | a bounded attempt | must | | `references/teaching-sequence-skill-based.md` › intro · L9 | shared with vocabulary (VOC-E11 holds the audit sentence beside it) | STAYS |
| QC-J10 | «Keep each example close enough to My Turn to practise the same learning and different enough to require application.» | a skill lesson's guided examples | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L75 | rule (each guided example is itself fresh) | ROUTE |
| QC-J11 | «The My Turn and Our Turn each take their own fresh visual, left in the configuration required by their selected resource state.» | a skill lesson's modelled and guided visuals | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L55 | rule | ROUTE |

## K. The check before independent practice

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-K01 | «Design a worthwhile check before independent practice of a new procedure when its result can genuinely inform whether the class is ready. The check should be capable of revealing more than the answers of willing volunteers, but generated materials do not prescribe how the teacher gathers responses.» | a new procedure, before release; only when the result can inform the next move | must, when the result can inform readiness (the checker read it so; "default" if Daniel reads the condition as optional) | | `references/preferences.md` › Support, Checking and Release · L505. Copies: K02, K03, K07, K08 | rule | PREF-SCR |
| QC-K02 | «- Include a worthwhile check before release when its result can genuinely inform whether the class is ready.» | as K01 | default | | `references/evidence-synthesis.md` › 3. Guided Practice and Release for Repeatable Skills · L87 | duplicate of K01 | ES |
| QC-K03 | «- The check should be capable of revealing class understanding beyond willing volunteers, but the material does not prescribe books, whiteboards, cold calling, wait time, show call or another response routine.» | as K01 | must | | `references/evidence-synthesis.md` › 3. Guided Practice and Release for Repeatable Skills · L88 | near-duplicate of K01: names the routines not to prescribe | ES |
| QC-K04 | «forcing a separate hinge slide where no decision depends on it;» | things to avoid | must not | | `references/evidence-synthesis.md` › 3. Guided Practice and Release for Repeatable Skills · L91. Copy: K08 | rule | ES |
| QC-K05 | «**Principle.** Design checks capable of revealing whether the intended learning is secure enough for the lesson's next decision. Do not equate a good check with a prescribed classroom response routine.» | every check | must | | `references/evidence-synthesis.md` › 6. Checking for Understanding · L145 | rule (the principle) | ES |
| QC-K06 | «**Why it works.** Volunteer answers can overstate class understanding. A useful check gives the live teacher access to evidence from more than the keen volunteers and, before independent practice of a new procedure, can inform whether the class is ready to continue or needs more support.» | as K05 | | | `references/evidence-synthesis.md` › 6. Checking for Understanding · L147 | rule (the reason) | ES |
| QC-K07 | «- Create a question or task that diagnoses the learning rather than merely asking whether everyone understands.» | every check | must | | `references/evidence-synthesis.md` › 6. Checking for Understanding · L150 | rule | ES |
| QC-K08 | «- Before independent practice of a new procedure, include a worthwhile check when the result can genuinely affect the next move. Do not force a separate hinge-question slide in every lesson.» | as K01 | default | | `references/evidence-synthesis.md` › 6. Checking for Understanding · L152 | duplicate of K01 and K04 | ES |
| QC-K09 | «What the design still owes them is the reading: where a check gates a part of the lesson that cannot proceed without it, say what the likely wrong answers mean and name the move that answers each,» «This is not a response routine and does not become one» | a check that gates the next part | must | tests pin it and the three moves | `references/evidence-synthesis.md` › 6. Checking for Understanding · L154 | rule | ES |
| QC-K10 | «**Avoid.** "Does everyone understand?" as the only evidence. Relying only on volunteers.» | every check | must not | | `references/evidence-synthesis.md` › 6. Checking for Understanding · L156 | rule | ES |
| QC-K11 | «**Diagnostic evidence:** Plan one check that is hard to pass by surface cue, answer position or repetition from the previous slide. Hold irrelevant features stable, vary the taught feature, and require the target decision, explanation, trace or performance.» | every lesson (its last sentence is B06) | must | | `agents/lesson-designer.md` › Before You Design Anything · L120. Copies: G15, K12 | rule | LD |
| QC-K12 | «Design at least one check that cannot be passed by spotting an incidental picture cue or repeating the previous slide. Change the critical scientific condition while keeping irrelevant features stable, then require children to predict, trace, explain or perform. If a child can answer without using the relationship taught, the check is evidence of noticing rather than understanding.» | science | must | | `references/subject-science.md` › Build the lesson around the scientific sticking point · L29 | near-duplicate of K11: adds the test (answer without the relationship taught) and noticing against understanding | SUBJ |
| QC-K13 | «Use one carefully designed question when the result can genuinely show whether children hold the taught distinction or a predictable wrong rule.» | §3.7 hinge question | may | | `references/do-beats.md` › §3 Write (3.7) · L200 | rule | CAT |
| QC-K14 | «A short open question deliberately designed to expose a likely misconception, not just to check recall.» | §3.8 Diagnostic Question | may | | `references/do-beats.md` › §3 Write (3.8) · L205 | near-duplicate of K13 (two entries for one format) | CAT |
| QC-K15 | «A diagnostic question may deliberately reveal widespread misunderstanding, and many incorrect answers can be useful evidence.» | success rates | may | | `references/do-beats.md` › intro · L19 | rule | CAT |
| QC-K16 | «**Plan + checkpoint (optional)** — include a checkpoint only when an unchecked decision could waste substantial time or materials, create a safety risk, make the task impossible or invalidate the evidence or outcome.» «Do not add one merely because planning occurs.» | task-centred lessons; planning and doing may continue as one flowing task unless separating them improves the work or protects one of those conditions | must; must not (one merely because planning occurs) | `plan-checkpoint`, `checkpointQuestion` | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L27. Copy: K17 | rule | ROUTE |
| QC-K17 | «a checkpoint exists only when it can prevent a consequential failure,» | the reviewer, task-centred lessons | check | | `references/design-review-route-checks.md` › Task-Centred · L25 | duplicate of K16 | REV (route checks) |
| QC-K18 | «A confidence rating reports how secure children feel. It may support reflection, but it is not evidence of what they understand or can do. Use a genuine learning check when actual understanding matters.» | §9.1 confidence check | must | | `references/do-beats.md` › §9 Metacognitive (9.1) · L450 | rule | CAT |
| QC-K19 | «**The limit:** the user finds it "a bit better" than Stand If and still a weak Do beat. A thumb reports how a child feels, and a child who has misunderstood can feel sure, so it never stands in for a beat where every child uses the idea; it is not a Do beat at all, only a quick read the teacher may add beside one.» | §9.6 thumbs; a teacher-owned routine, never selected unless the teacher asks (L475) | must not | test pins the last clause | `references/do-beats.md` › §9 Metacognitive (9.6) · L479 | your ruling (14 September; in the log, L1201) | CAT |
| QC-K20 | «**Best for:** binary or three-way decisions; quick check before moving on.» | §4.8 Visual Vote | may | | `references/do-beats.md` › §4 Visual / Draw (4.8) · L253 | rule (a check format; the fresh-case condition applies through A01) | CAT |
| QC-K21 | «a two-minute check after a Teach stays on the board.» | a sort after a Teach | must | | `agents/lesson-designer.md` › Printed extras: stick-in piece and wall · L385 | rule (a check is not a card kit); shared with stick-in pieces | STAYS |
| QC-K22 | «The one case that genuinely takes the support away is a task whose purpose is to check what a child can do unaided, and that is a decision made for that task and said out loud, not the default state of every independent task. Where it applies, remove the support for that task alone and leave it in place for the rest of the lesson.» | a check of unaided work | must | | `references/preferences.md` › Support, Checking and Release · L499 | rule; honest "say so" rule (decision 1's list); shared (support, topic 7) | STAYS |
| QC-K23 | «Content, dialogic and task-centred lessons use checks suited to their structure rather than a universal My Turn → Our Turn → Your Turn gate.» | checks outside skill lessons | must | | `references/evidence-synthesis.md` › 3. Guided Practice and Release for Repeatable Skills · L80 | rule (the limit on K01) | ES |
| QC-K24 | «The live teacher decides from the real class response whether to proceed, add support, model another case or extend guided practice.» | after a check | must | | `references/evidence-synthesis.md` › 3. Guided Practice and Release for Repeatable Skills · L89 | rule | ES |
| QC-K25 | «State the learning action and intended evidence. The live teacher chooses how to gather and inspect responses, including hands up, cold calling, partner work, writing or another routine.» | every check | must | | `references/evidence-synthesis.md` › 6. Checking for Understanding · L153 | near-duplicate of K03: adds "state the learning action and intended evidence" | ES |

## L. Retrieval against instant recall

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-L01 | «**A beat thirty seconds after the answer was given is not that, and calling it retrieval practice does not make it so.** The testing effect comes from pulling something back after it has begun to fade, so straight after teaching the honest value of one of these is different and still real: it makes every child produce the thing rather than hear it, and it tells the teacher who has it. That is worth the minute. What it does not do is secure the memory for next week, which needs the same knowledge asked for again after a delay, with the answer or correction supplied (`evidence-synthesis.md` §1 and §8).» «So use these here for the processing and the read on the class, and let the durable version be planned as something that comes back.» | a recall beat straight after teaching; decision 4 turns on it | must | tests pin the lead and `makes every child produce the thing rather than hear it` | `references/do-beats.md` › §1 Recall · L80 | rule; your decision of 14 September (in the log at 4.2.205: "Immediate recall is not called retrieval practice") | CAT |
| QC-L02 | «**Mechanism:** retrieval practice: pulling a fact from memory strengthens that memory more than re-reading it ever could» «Use these when the prior chunk is a fact, name, date, definition, or rule that children need to lock in before building on it.» | §1 recall formats | default | | `references/do-beats.md` › §1 Recall · L78 | rule (L01 is its limit) | CAT |
| QC-L03 | «Brings back a fact, term, method or case already taught, without it on show» «The answer is not visible and the next step needs it held. It shows the learning is ready to use, not understanding beyond what was recalled.» | a retrieve beat | check | | `references/do-beats.md` › Operations to think with (Retrieve) · L553 | rule | CAT |
| QC-L04 | «Retrieval is a storage event, not just a test.» «Spacing retrieval across days produces more durable learning than massed practice.» | retrieval | | | `references/evidence-synthesis.md` › 1. Opener / Retrieval Practice · L29 | rule (research reason) | ES |
| QC-L05 | «- Retrieval strengthens memory when pupils make a genuine attempt and then receive the answer, correction or support needed to complete the memory accurately. Repeated uncorrected failure does not carry the same benefit.» | retrieval | must | | `references/evidence-synthesis.md` › 1. Opener / Retrieval Practice · L36 | rule | ES |
| QC-L06 | «- Succeeding at the end of a lesson is not the same as having learned it, and the gap is closed by meeting the knowledge again after a delay.» «Naming what has to come back is not the same as inventing a next lesson: the design may say which one or two things this lesson leaves behind that a later starter should ask for, in the lesson's own words, without claiming when, how the class did, or what needs reteaching.» | the ending | must; may (name what comes back) | tests pin the first sentence and `Naming what has to come back is not the same as inventing a next lesson` | `references/evidence-synthesis.md` › 8. Purposeful Lesson Closure · L193 | rule; shared (endings, topic 7) | ES |
| QC-L07 | «Quick recall works well on facts and works poorly on reasons, so quizzing a class on *what* happened is not the same intervention as quizzing them on *why* it happened.» | history retrieval | default | | `references/subject-history.md` › Chronology, and what the starter should recall · L203 | rule; shared (starters, topic 7) | SUBJ |
| QC-L08 | «**A repetition earns its place by changing something.** More items is not more practice.» «makes them retrieve rather than copy,» «This holds in content lessons as much as in maths» | every further item | must | tests pin the lead, four of its changes and the last clause | `references/evidence-synthesis.md` › 4. Independent Practice · L115 | rule | ES |
| QC-L09 | «Straightforward recall remains useful but should not be the only thinking children do with the content.» | content lessons | default | | `references/evidence-synthesis.md` › 4. Independent Practice · L111 | rule | ES |
| QC-L10 | «Recall-only practice standing in for thinking in a content lesson.» | things to avoid | must not | | `references/evidence-synthesis.md` › 4. Independent Practice · L117 | duplicate of L09 | ES |
| QC-L11 | «High success is the point of retrieval, but high success with no decision in it is not retrieval, it is administration:» | the starter | must | | `references/preferences.md` › Starters · L287 | shared (starters, topic 7) | STAYS |
| QC-L12 | «This is retrieval, not re-teaching.» «Questions children can mostly answer are the point, because the starter strengthens a memory rather than diagnosing a gap.» | the starter | must | | `references/preferences.md` › Starters · L282 | shared (starters, topic 7) | STAYS |

## M. The probes, and what a response can claim

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-M01 | «**could a child who missed the teaching do this well from the board and everyday sense?**» «A lesson is never asked to match an example's names, order or materials;» | the main task and any Do the lesson relies on as evidence | check | heading `The contrasts` (the reviewer's always-read list, code) | `references/task-contrasts.md` › intro · L5. Copies: M03 to M07, G25, S01, S02 | rule (the question every contrast turns on) | TC |
| QC-M02 | «It exists because a task can be clear, varied, hands-on and well worded and still be completable without the learning the lesson claims to have taught.» «The contrast is never "sorting bad, explaining good". A sort can be the stronger task and a sentence the weaker one.» | reading the contrasts | must not (never sorting bad, explaining good) | test pins the last sentence | `references/task-contrasts.md` › intro · L3 | rule (the file's purpose and limit) | TC |
| QC-M03 | «For the main task, and for any Do beat the lesson relies on as evidence of an important understanding, write the response a child who has understood would give, then the response a child with a plausible misunderstanding could give from the board and everyday sense» «When the two come out the same, the task has not tested the learning, and the repair is upstream, a different case, a changed condition or a connection still to be explained, not a harder wording.» «`One Completion Pass, Then Done` runs this on the finished contract» | the main task and evidence Dos | must | test pins `the response a child with a plausible misunderstanding could give` | `agents/lesson-designer.md` › Settle the classroom experience before collecting content · L60 | rule | LD |
| QC-M04 | «Then work it a second time holding the plausible misunderstanding (step 4 of `Settle the classroom experience before collecting content`): if that child's answer also passes, the task has not tested the learning, and the case, the condition or the missing explanation changes, not the wording.» | the completion pass | check | test pins the first clause | `agents/lesson-designer.md` › One Completion Pass, Then Done · L512 | duplicate of M03 | LD |
| QC-M05 | «**Two probes on the worked answer, before the checks below.**» «Now run it twice more on the main task, and on any Do beat the design relies on as evidence of an important understanding, with `task-contrasts.md` → The contrasts as the calibration.» | every review | check | test pins the lead | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L185 | rule | REV |
| QC-M06 | «*Can weak understanding still pass?* Name one plausible misunderstanding a child in this class could hold after the teaching» «then attempt the task holding it, using only what is on the board and everyday sense. Name the bypass and the answer it permits: sorting by pleasant and unpleasant wording, following the answer's colour or position, lifting the expected conclusion from the slide before, a general opinion that never uses the learning.» «This is a logical check of the task, not a claim to have simulated a child, and "this might be too easy" is not a finding without the answer written out.» | as M05; a finding needs the answer written out | check | tests pin the question and `Name the bypass and the answer it permits` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L187 | rule | REV |
| QC-M07 | «*Can good understanding be marked wrong?* Try a defensible alternative answer, interpretation or placement and read the key against it.» «Tell genuine ambiguity from a deliberate challenge whose reading the lesson has established. An open or interpretive task needs a justified acceptance boundary, not an invented single answer, and in a subject involving belief or reflection, agreement with a supplied view is never evidence of learning.» | as M05 | check; must (a justified acceptance boundary) | tests pin the question and `agreement with a supplied view is never evidence of learning` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L189 | rule | REV |
| QC-M08 | «A material finding from either probe names the exact task, the response that bypasses or challenges it, the learning left untested or misrepresented, and the smallest repair: a different case, a changed condition, a connection still to be taught, a second accepted placement.» | a finding from the probes | mechanics | test pins it | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L193 | rule | REV |
| QC-M09 | «Read `task-contrasts.md` → The contrasts once, when choosing the main task or a Do beat the lesson will rely on as evidence of an important understanding. It calibrates step 4 of `Settle the classroom experience before collecting content` across subjects: what a task actually requires a child to know, and where the simpler task is right. It is not a menu.» | the designer's reading route | must (read) | test pins the first clause | `agents/lesson-designer.md` › Reference Files - precedence and decision-point loading · L566 | pointer | LD |
| QC-M10 | «`task-contrasts.md` → The contrasts;» | the reviewer's compatibility route (the packet route reads it by code) | must (read) | the packet's always-read list names `task-contrasts.md` / `The contrasts` | `agents/design-reviewer.md` › Compatibility route · L116 | pointer | REV |
| QC-M11 | «Naming the missing training is not the thinking, because the case says it outright; the consequence is.» «a changed condition checks the same understanding from the other side» «which does not make food and a bed worthless» | a case with the connection missing | must | | `references/task-contrasts.md` › History: the reason behind a choice · L15. Copies: M12, M13 | rule | TC |
| QC-M12 | «Naming what is missing is not yet the history when the case states it outright; the consequence is,» | history | must | | `references/subject-history.md` › Choose the response that reveals the history · L135 | duplicate of M11 | SUBJ |
| QC-M13 | «provided the question asks what that meant for Will's future rather than what was missing, which the case already says.» | the reviewer's first probe | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L187 | duplicate of M11 | REV |
| QC-M14 | «Requires: looking at the drawing. The picture answers the question the relationship was meant to answer.» | the science contrast's weak task | check | | `references/task-contrasts.md` › Science: a prediction that the relationship decides · L23 | rule (the contrast) | TC |
| QC-M15 | «A clear diagram and a short one-line prediction are enough; do not add a paragraph, a table or an extra variable to make it look rigorous.» «And a diagram that supplies the information the prediction needs (the wire lengths) is not answer leakage; it is the question.» | as M14 | may (limit); must not (add a paragraph, a table or a variable to look rigorous) | | `references/task-contrasts.md` › Science: a prediction that the relationship decides · L27 | rule (limit) | TC |
| QC-M16 | «Requires: reading two labels. It claims to test the relationship and tests the key.» | the geography contrast's weak task | check | | `references/task-contrasts.md` › Geography: reading a map versus using one · L33 | rule (the contrast) | TC |
| QC-M17 | «Supplying the new map is the task, not a giveaway.» | as M16 | may (limit) | | `references/task-contrasts.md` › Geography: reading a map versus using one · L35 | rule (limit) | TC |
| QC-M18 | «Requires: following the highlight. The support supplies the very decision being assessed.» | the maths contrast's weak task | check | | `references/task-contrasts.md` › Maths: practice that repeats, and support that decides · L43 | rule (the contrast) | TC |
| QC-M19 | «It is weaker only as evidence, when the answers can be read from position rather than decided, so the questions the lesson treats as each child's decision come in no pattern.» | an ordered run of practice | must | | `references/task-contrasts.md` › Maths: practice that repeats, and support that decides · L47 | rule | TC |
| QC-M20 | «A child who says `yes, because of Jesus` may understand more than that and may be repeating the board; the answer is too short to tell, and the question gives no way to find out.» | the RE contrast's weak task | check | | `references/task-contrasts.md` › RE and PSHE · L63 | rule (the contrast) | TC |
| QC-M21 | «**Claim what the work can show, and no more.** Write the claim in `unlocks` and the walk-through to match the task children actually do:» | every beat's claim | must | `unlocks` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L226. Copies: C06, C07, M22, M24 to M26 | rule; shared with the rhythm topic (`unlocks`) | STAYS |
| QC-M22 | «Apply the arrangement to a fresh case» «Application, when no cue or completed comparison already gives the answer.» | as M21 | check | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L232 | rule | STAYS |
| QC-M23 | «A Do does not have to produce a new discovery. The gain can be a clearer representation, a more fluent performance, a corrected misunderstanding or reliable evidence that the teacher can move on.» | every Do | may | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L237 | rule (limit) | STAYS |
| QC-M24 | «- the independent assessment evidence, including why it cannot be passed by a surface cue or copied answer path;» | the walk-through's closing decisions | must | | `agents/lesson-designer.md` › Write the lesson, then the contract - the walk-through is the alignment anchor · L425 | rule (recording) | LD |
| QC-M25 | «Teaching and supported rehearsal may deliberately give a conclusion; describe their purpose honestly rather than claiming they demonstrate an unaided judgement.» | the completion pass | must | | `agents/lesson-designer.md` › One Completion Pass, Then Done · L512 | rule | LD |
| QC-M26 | «An explicitly supported rehearsal may supply a decision without claiming to assess it.» | the reviewer | may | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L170 | near-duplicate of M25: adds that the support must be explicit | REV |
| QC-M27 | «Matching, labelling and short factual answers can consolidate or demonstrate important historical knowledge; copying labels alone does not demonstrate an objective requiring explanation or comparison.» «an elaborate paragraph or attractive product may show little historical understanding» | history responses | check | | `references/subject-history.md` › What the board and the page hold · L181 | rule | SUBJ |
| QC-M28 | «Matching, locating, labelling or short factual answers may show exactly what the objective requires.» «Copying does not demonstrate an explanation, and an elaborate product does not establish understanding.» | geography responses | check | | `references/subject-geography.md` › What the page should look like · L108 | duplicate of M27 (both halves now quoted in each) | SUBJ |
| QC-M29 | «a PSHE beat's `thinking` line names the taught reason or boundary the child applies to decide it» «because a choice children would have made before the lesson shows nothing the lesson taught.» | PSHE thinking lines | check | | `references/subject-pshe.md` › Choose evidence that shows the PSHE learning · L26 | rule (the subject's form of A04) | SUBJ |
| QC-M30 | «the slides are written as if the teacher never opens the notes, so a check whose expected answer lives only in a script (`breathing`, said aloud on the slide before and printed nowhere) is unprepared.» | every check the reviewer reads | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L197 | rule, with a story (not in the log); shared with S13 | REV |
| QC-M31 | «The repair follows from the diagnosis. With one repair on show it is supported practice of the move, which is often right straight after teaching; it shows the child's own repair when they have to find it.» | a repair beat | check | | `references/do-beats.md` › Operations to think with (Repair) · L561 | rule (honest claim of supported practice) | CAT |
| QC-M32 | «The practice is of the taught move on fresh cases. It shows fluency or readiness, which is often exactly what the lesson needs, and does not need to claim more.» | a rehearse beat | check | | `references/do-beats.md` › Operations to think with (Rehearse) · L563 | rule (the fresh-case rule for practice; A02's limit in operation form) | CAT |
| QC-M33 | «Recognition, reading, copying, explanation and demonstration may still be useful steps or the correct form for the objective. Judge the thinking children actually do rather than treating a generative-looking activity as automatically deeper.» | independent practice | may | | `references/evidence-synthesis.md` › 4. Independent Practice · L101 | rule (limit) | ES |
| QC-M34 | «Then read it a second time from the other end: would the check named after `evidenced by` catch a child who lacked what the clause after `because` names? When it would not, the sentence describes a lesson that teaches one thing and assesses another, and the class can do the second without the first.» | the walk-through's read-back sentence | check | | `agents/lesson-designer.md` › Write the lesson, then the contract - the walk-through is the alignment anchor · L416 | rule (the probe applied to the lesson's own evidence), with a story (in the log, L2348) | LD |
| QC-M35 | «Requires: counting adjectives. `The big green forest had tall dark trees` meets it. The sentence may still give the place some feeling, but the task never asked the writer to choose words for that, so what a child writes cannot show whether they did.» | the English contrast's weak task | check | | `references/task-contrasts.md` › English: a count is not the quality · L53 | rule (the contrast) | TC |
| QC-M36 | «A short grammar drill (`add a fronted adverbial to each of these sentences`) is legitimate practice of a move, and a one-sentence example can be the whole task; not every English task becomes discussion or a paragraph.» | English | may (limit) | a test counts this paragraph | `references/task-contrasts.md` › English: a count is not the quality · L57 | rule (limit) | TC |
| QC-M37 | «When the objective is personal reflection (`what does this festival mean to me`), the child's own meaning placed beside the taught ones is the intended outcome, and asking for it is right. A supplied view is material to interpret, never a view to agree with.» | RE and PSHE | may (limit); must not (agreement as evidence) | a test counts this paragraph | `references/task-contrasts.md` › RE and PSHE · L67. Copy: M07's second quote | rule (limit) | TC |
| QC-M38 | «A changed condition is the same strength when it stays inside the relationship that was taught» «Adding a second cell brings in a second relationship (more cells, a brighter bulb), so it is a fair question only once that has been taught as well; it is not the same thinking with a new variable.» | a changed-condition check | must | | `references/task-contrasts.md` › Science: a prediction that the relationship decides · L25 | rule; shared with assumed knowledge (no row there) | TC |
| QC-M39 | «The same method on fresh numbers in no pattern, with the number line drawn and the halfway mark unmarked» | maths evidence | must | | `references/task-contrasts.md` › Maths: practice that repeats, and support that decides · L45 | rule (the contrast's stronger task) | TC |
| QC-M40 | «The criteria are the taught quality rather than a count of features, and the entry route has been prepared.» | a compose beat | check | | `references/do-beats.md` › Operations to think with (Compose) · L562 | rule (beside M35) | CAT |
| QC-M41 | «When the choice of task matters, because it is the main work or the evidence for the learning the lesson claims, compare a genuine alternative: not two route names, and not "this one is more engaging", but the actual explanation and pupil work side by side, asking what each requires a child to know and what a response to each would show.» | the main task and evidence Dos | must | tests pin two phrases | `agents/lesson-designer.md` › Settle the classroom experience before collecting content · L58 | rule (the designer's form of the contrasts method) | LD |
| QC-M42 | «Check what decision remains theirs and whether the evidence supports the conclusion.» «Read teacher scripts alongside prompts and support: hiding a reminder does not preserve a diagnostic decision if the script supplies it.» | the completion pass | check | | `agents/lesson-designer.md` › One Completion Pass, Then Done · L512 | near-duplicate of S14 for the designer | LD |

## N. Retests that decay into a catchphrase

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-N01 | «**Even the dominant misconception has an arc, and the arc has an end.** Built on it means exposed, taught, checked once, then retested once at the end where the thinking comes together - not re-run at every response moment.» «more response moments rehearse the corrective sentence than perform the action the objective names, so a child asked what today was about would answer with the trap, not the LO.» «A retest only tests while the child has to think to pass it: by the third time the class gives the same corrective answer, children are pattern-matching the question (`say we'd need to see the whole week again`) and the trap has become a catchphrase.» «where several elicit essentially the same sentence, keep the first and the final retest and turn the middle ones toward the parts of the objective the correction does not cover,» | a lesson built on one misconception | must | | `agents/lesson-designer.md` › Misconceptions · L323. Copy: N02 | rule | LD |
| QC-N02 | «count the response moments, beats and worksheet prompts alike, that elicit essentially the same corrective answer» «when a later one can be passed by repeating the sentence given two moments earlier, the centre has decayed into a catchphrase and its time belongs to the parts of the objective still untaught.» «A lesson most of whose response moments rehearse the correction has narrowed its objective to the sticking point, which is a purposeful design defect, not polish;» | the reviewer | check; must (the severity) | tests pin the counting method and the severity | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L199 | near-duplicate of N01: adds the counting method and the severity (a purposeful design defect) | REV |
| QC-N03 | «Then the retest asks the inference the wrong rule gets wrong (`Ava's family put up a tree; do we know what they believe?`), not a comparison of two stated meanings, which a child can make correctly while still holding the wrong rule» | a many-meanings or cannot-infer lesson | must | | `agents/lesson-designer.md` › Misconceptions · L307 | the designer's case of N04 (a many-meanings or cannot-infer lesson) | LD |
| QC-N04 | «The retest asks the question the wrong rule answers wrongly:» «and a task comparing two stated meanings does not test it, because a child can make that comparison while still holding the rule.» | every lesson's centre (its first clause is general) | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L198. Copy: N03 | rule (the general form) | REV |
| QC-N05 | «Each misconception you name gets a question attached that a child holding it answers *wrongly*, because that is the only way it surfaces. "Does everyone understand?" catches nothing, and neither does a question the child can get right either way. If the misconception is that all deserts are hot, the question is which of these four photographs shows a desert, with a cold one in the set.» | geography misconceptions | must | | `references/subject-geography.md` › Misconceptions worth planning against · L138. Copy: N06 | rule (a check a child can get right either way checks nothing) | SUBJ |
| QC-N06 | «attach to each one a question a child holding it answers *wrongly*, because that is the only way it surfaces. "Does everyone understand?" catches nothing.» | history misconceptions | must | | `references/subject-history.md` › Misconceptions worth planning against · L233 | duplicate of N05 | SUBJ |
| QC-N07 | «A misconception from this list is checked in a lesson, not built into its spine. The lesson's centre is what happened; the wrong idea is met once, at the point where the knowledge makes it visibly wrong (Saturday school is on this one timetable; does that mean every child?), and tested once more at the end. Build the whole lesson on the correction and every beat rehearses the same sentence, which is the methodology lesson again by another door.» | history | must | | `references/subject-history.md` › Misconceptions worth planning against · L235 | near-duplicate of N01 for history (the same arc) | SUBJ |

## P. The review view, routing card, code and test fixtures

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-P01 | «The view's `Each Do beside the teaching before it` puts each Do's expected answer next to the Teach it follows, with how many of the answer's words that Teach already said; read that section here.» | every review | must (read) | heading `Each Do beside the teaching before it`; test pins it | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L204 | pointer; it claims more than the code shows (decision 9) | REV |
| QC-P02 | «## Each Do beside the teaching before it» | the review view | code | test pins the heading | `scripts/design-review-packet.py` › build_do_beside_teach · L1455 | code: only `do` units straight after `teach`, `teach-why` or `teach-needed`; a structured answer prints "none written" (decision 9) | CODE |
| QC-P03 | «remembering the last slide, without using the idea on anything new? » | the view's instruction line | code | | `scripts/design-review-packet.py` › build_do_beside_teach · L1461 | code (prints the fresh-case rule's name) | CODE |
| QC-P04 | «- Words of the expected answer the Teach's board or script already said: » | the view's count | code | test pins it | `scripts/design-review-packet.py` › build_do_beside_teach · L1500 | code (the count is where to look, not a verdict) | CODE |
| QC-P05 | «restatement (`Steam could drive roundabouts, so children had a new kind of» | the function's comment | | | `scripts/design-review-packet.py` › build_do_beside_teach · L1449 | maintainer, with a story (in the log, 4.2.283) | CODE |
| QC-P06 | «asks children to put items in order, but the {what} prints » | an option bank or starter list with an ordering cue and three or more datable items | must (code) | `check_not_printed_in_answer_order`, `ORDERING_CUE_RE`, `PERIOD_ORDER` | `scripts/validate-lesson-design.py` › check_not_printed_in_answer_order · L757 | code | CODE |
| QC-P07 | «The one thing an ordering task must not do is print its items already in» | the validator's comment | | | `scripts/validate-lesson-design.py` › comment above the ordering check · L61 | maintainer, with a story (4 September) | CODE |
| QC-P08 | «Do not reject a deliberately brief recall check when recall is the stated evidence claim.» | the reviewer's sample case `surface-cue-check-mimics-understanding` | test data | tests read the case ids | `scripts/tests/fixtures/design-reviewer-behaviour-cases.json` › surface-cue-check-mimics-understanding · L227 | stale against A01; record only (no agent or script reads the text, tests read only the id); decisions 1 and 4 | changes with decisions 1 and 4, id kept |
| QC-P09 | «and the sort is fine as a named two-minute orientation before the question that matters.» | the sample case `shallow-sort-passes-a-misunderstanding` | test data | tests read the case ids | `scripts/tests/fixtures/design-reviewer-behaviour-cases.json` › shallow-sort-passes-a-misunderstanding · L483 | stale against A01 and decision B; record only; decision 2 | changes with decision 2, id kept |
| QC-P10 | «A quick check may establish only that the class caught a new distinction when the design says so; judge what the beat claims, not whether a misunderstanding could pass a beat that never claimed to test one.» «Do not demand reasoning, a because sentence or fresh cases from a beat whose stated job is securing the names; do not call a supplied diagram answer leakage.» | the sample case `quick-check-after-a-teach-is-legitimate` (its own case is a fresh outline, which A01 approves) | test data | tests read the case ids | `scripts/tests/fixtures/design-reviewer-behaviour-cases.json` › quick-check-after-a-teach-is-legitimate · L498 | stale against A01 ("when the design says so", "do not demand fresh cases"); record only; decisions 3 and 4 | changes with decisions 3 and 4, id kept |

## S. Neighbouring rules listed so nothing is lost

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| QC-S01 | «A question put to the class is answered by the children whose hands go up, and it can often be answered from the slide or from general good sense as easily as from the idea just taught,» «Two tests on a finished beat: could a child answer it without the idea this slide taught, and could most of the class sit it out?» | every Do | must | heading `Questioning is not doing` (routing card) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L184 | shared (rhythm) | STAYS |
| QC-S02 | «if a child who slept through this Teach and woke for the one before could still do it, the pair has come apart.» | every Teach and Do pair | check | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L186 | shared (rhythm) | STAYS |
| QC-S03 | «It is not a check that children were listening, and the test that separates the two is whether a child who missed every piece of teaching could still do it well from what they brought with them.» | the final task | must | | `references/preferences.md` › What a Lesson Is For · L148 | shared (Apply and the final task, topic 7) | STAYS |
| QC-S04 | «naming it as sticky has turned the final task into recall of the slide, because a sticky fact that is the sentence the final task expects is the answer handed over early.» | sticky knowledge | must | | `references/preferences.md` › What a Lesson Is For · L158 | shared (sticky knowledge, topic 7) | STAYS |
| QC-S05 | «And a sticky fact that is the very sentence the final task expects (`write one continuity`, and the sticky says it) has made the task recall of the slide;» | sticky knowledge | must | | `agents/lesson-designer.md` › Sticky Knowledge · L231 | shared (sticky knowledge) | STAYS |
| QC-S06 | «a sticky fact that is the sentence the final task expects has made the task recall of the slide, and is a finding.» | the reviewer | check | | `agents/design-reviewer.md` › 1. Learning contract · L155 | shared (sticky knowledge) | STAYS |
| QC-S07 | «the first question was answered a minute before children met it, and the design still counted the writing as each child's own explanation. That is the defect - not the model.» | a launch model of the same case | must | | `references/preferences.md` › Lesson Designer visual-need boundary · L627 | shared (the launch, topic 7); story (not in the log under Sigurd) | STAYS |
| QC-S08 | «And a later stage - the worksheet, the ending, a fresh case - carries the evidence of what each child can do unaided. A lesson that cannot point at that stage has no evidence and must use the parallel case instead.» | a launch model of the same case | must | | `references/preferences.md` › Lesson Designer visual-need boundary · L631 | shared (the launch; your ruling of 18 September) | STAYS |
| QC-S09 | «Then read the launch's good instance beside the task that follows, as children meet them one after the other: when the model answers a question the task then asks and the design treats that answer as each child's own evidence, that is a finding, repaired with a parallel case or an honest supported label, never by removing the model;» | the reviewer | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L205 | shared (the launch) | STAYS |
| QC-S10 | «A stem must not supply the judgement, answer, reason or conclusion the child is meant to decide.» | sentence stems | must | | `references/preferences.md` › Written Voice (House Style) › Core rules · L75. Copy: S11 | shared (voice, topic 8) | STAYS |
| QC-S11 | «- sentence stems help expression without supplying the decision;» | the reviewer | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L209 | shared (voice) | STAYS |
| QC-S12 | «The commonest leak is a question that presupposes the verdict.» «The test: could this question be asked, word for word, if the claim were actually right?» | question wording | must | | `references/teacher-voice.md` › Do not leak the answer · L437 | shared (voice) | STAYS |
| QC-S13 | «anything a later check, Do beat or task expects a child to produce must have been visible on a slide before it, not only spoken. A Year 4 PSHE quick check asked what Sophie's body uses energy for when she is sitting still; the answer, breathing, lived only in the script of the slide before,» | every check | must | | `references/preferences.md` › Written Voice (House Style) › Core rules · L63 | shared (slides carry the meaning, topic 7); story (not in the log) | STAYS |
| QC-S14 | «Keep that reference when the child still has to perform the intended thinking; change it if its conclusion can simply be copied to answer this task. Read the spoken script too, because it can supply a decision that the printed support carefully withholds.» | support beside a task | must | | `references/preferences.md` › Support, Checking and Release · L497 | shared (support, topic 7) | STAYS |
| QC-S15 | «This is not a licence to mark the question slide as well - what is unmarked there is usually what the child has to work out, and marking it hands over the task.» | the slide designer | must not | | `agents/slide-designer.md` › 5. Use answers from the structured answer object only · L247 | shared (slide designers, topic 9) | STAYS |
| QC-S16 | «That is a brief check the teacher runs, not an answer slide after every beat and not generic advice to circulate.» | work a later beat builds on | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L222 | shared (rhythm, links between beats) | STAYS |
| QC-S17 | «Simple recall, a sentence stem or a sketch can be the best choice.» | variety across Dos | may | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L216 | shared (rhythm, variety); the fresh-case condition applies through A01 | STAYS |
| QC-S18 | «Two that come out the same sentence are one beat and a repeat of it, however different their headings look:» «This is not the rule against a second instance of an idea, which is right and wanted when the evidence changes; it is two beats over the same evidence asking for the same thing.» | the completion pass | check | | `agents/lesson-designer.md` › One Completion Pass, Then Done · L516 | shared (rhythm); story (in the log, L2105) | STAYS |
| QC-S19 | «**Protect the learning before seeking fresh work.**» «Naming a required set needs opportunities to identify its members; mentioning a member in a prompt, giving its name in a claim, or asking about a neighbour does not assess identifying it.» | a worksheet replacing slide practice | must | | `references/preferences.md` › What the sheet is for · L679 | shared (worksheets, topic 6) | STAYS |
| QC-S20 | «Check that success provides evidence of the intended learning rather than a wording cue or familiar common-sense answer.» «Use a boundary case or misconception check when diagnosing that distinction matters; it is not a compulsory final question.» «Do not add a justification to every response merely to make practice appear demanding.» | a generated worksheet | check; must not (a justification on every response) | | `references/lesson-designer-components.md` › Generated worksheet · L79 | shared (worksheets) | STAYS |
| QC-S21 | «The test: cover everything except the blank — could a child who had genuinely forgotten still write it from what is left on the line? If so, the answer is on the slide, and it belongs only on the answer slide that follows.» | a starter blank | check | | `references/preferences.md` › Starters · L303 | shared (starters, topic 7) | STAYS |
| QC-S22 | «A quick check: if a child who answered every starter question would already know how today's investigation turns out, the starter has stepped onto the lesson's ground — pull it back to the prior knowledge underneath.» | a starter before an investigation | check | | `references/preferences.md` › Starters · L309 | shared (starters) | STAYS |
| QC-S23 | «Exact-answer Do beats, Our Turn, smaller checks use teacher-only.» | answer delivery | default (not enforced: the validator forces `teacher-only` only for some My Turns and worksheet answers) | `answer.delivery` `teacher-only` | `agents/lesson-designer.md` › Answers, models and checking support · L389 | shared (answer slides, a later topic) | STAYS |
| QC-S24 | «Every child uses it; a question to the room is a key question, not this beat» | content-lesson Dos | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L45 | shared (rhythm) | STAYS |
| QC-S25 | «Match the Pairs and Odd One Out are both sort-and-classify beats, but one asks a child to recognise four things they were just told and the other asks them to find a criterion nobody gave them.» | register against demand | check | | `references/do-beats.md` › intro · L7 | shared (rhythm, variety); agrees with A01 | STAYS |
| QC-S26 | «The second question does not hand over the answer.» | a guiding second question | must | | `references/teacher-voice.md` › Say what you mean, and give a second question that leads to the first · L413 | shared (voice) | STAYS |
| QC-S27 | «Changing a paragraph into a claim to judge earns no new application if children can repeat the same conclusion without making a further decision. A fresh case can earn it when children must select or connect evidence anew.» | the ending | must | | `agents/lesson-designer.md` › Apply Slide · L333 | shared (Apply, topic 7); the ending's form of A01 | STAYS |
| QC-S28 | «First, judging becomes reasoning from evidence rather than recall of what the teacher said a minute ago.» | a character's claim the class judges | default | | `references/slide-speech-and-characters.md` › Show the real referent the claim is judged against · L69 | shared (slide designers, topic 9); agrees with A04 | STAYS |
| QC-S29 | «Leave it off on a task slide where finding the part *is* the question, and off any write-on form, where a printed ring hands the child the answer.» | the `highlight` ring | must not | `highlight` | `references/templates.md` › Pointing at part of a figure: `highlight` · L1620 | shared (slide designers) | STAYS |
| QC-S30 | «Never use a verdict-revealing title such as "Fix it" or "What did Priya get wrong?", which announces the fault before the child has looked and collapses judging into locating a guaranteed error.» | a one-voice judged claim's title | must not | | `references/slide-speech-and-characters.md` › The title follows the move, and stays open · L23 | shared (slide designers); agrees with S12 | STAYS |
| QC-S31 | «6. **Have I accidentally given away the answer - or presupposed the verdict the child is meant to reach?**» | the voice pre-flight check | check | heading `17. Final pre-flight check` (always-read list) | `references/teacher-voice.md` › 17. Final pre-flight check · L966 | shared (voice) | STAYS |
| QC-S32 | «Then the harder half: does it hand over something that was supposed to be the child's - a strategy, a classification, a verdict, an exact count of how many answers there are?» «A record with exactly as many rows as there are solutions tells a child when to stop.» «both must be marked as deliberate here» | worksheet representations | check; honest "say so" rule (decision 1's list) | | `agents/design-reviewer.md` › 5. Worksheet evidence · L263 | shared (worksheets, topic 6) | STAYS |
| QC-S33 | «**Then check the representation still leaves the thinking to the child.** Does it supply a strategy, a classification, a verdict, or the number of answers there are?» «A record with exactly as many rows as there are solutions tells a child when to stop; counters beside a claim that only depict the true one settle it; a pre-drawn diagram answers a construction task.» «Say so when it is deliberate: nobody downstream is allowed to add or remove it» | a generated worksheet | check; honest "say so" rule (decision 1's list) | | `references/lesson-designer-components.md` › Generated worksheet · L61 | shared (worksheets) | STAYS |
| QC-S34 | «do not add a second answer key in teacherInfo/lookFor or reveal an independent task's answer before children attempt it.» | speaker notes | must not | `teacherInfo`, `lookFor` | `agents/lesson-designer.md` › Speaker Notes Voice · L92 | shared (speaker notes and answers) | STAYS |
| QC-S35 | «Do not duplicate an answer-key block in notes or leak an independent answer before the attempt.» | the structured answer | must not | `answer` | `references/output-template.md` › Source-unit contract · L543 | shared (answers) | STAYS |
| QC-S36 | «**The idea on a case the lesson never showed**» «If child finishing Your Turn barely notices slide changed, Apply not earning place» | the ending | must | | `agents/lesson-designer.md` › Apply Slide · L341 | shared (Apply, topic 7); the ending's fresh-case rule, beside S27 | STAYS |
| QC-S37 | «The presupposition is legitimate only when the error's existence is given and the task is finding, explaining or correcting it - `find the mistake in this working` - because there the judgement was never the thinking being asked for.» | question wording | may (the exception to S12) | | `references/teacher-voice.md` › Do not leak the answer · L447 | shared (voice); the same exception H09 and H14 carry | STAYS |
| QC-S38 | «**Needed is not tidy.**» «So when the idea being taught is that one thing carries more than one meaning, or that one thing cannot be read from another, the set of examples includes a case that holds both, and the lesson says so out loud.» | examples for a many-meanings lesson | must | the bold lead is cited by name (G06); a test file is named for it | `references/preferences.md` › What a Lesson Is For · L156. Copies: S39, S40 | shared (What a Lesson Is For, topic 7); the reason a sort's key may allow a card in both groups | STAYS |
| QC-S39 | «**A contrast isolates a feature; it must not teach that the feature sorts people.** One-thing-only is right when the learning is a category, because the pair exists to make the feature visible.» | a many-meanings lesson; the limit on H15 | must | test pins it | `agents/lesson-designer.md` › Misconceptions · L307 | shared (topic 7) | STAYS |
| QC-S40 | «Check too that the examples used to teach a many-meanings or cannot-infer idea include one case that holds both;» «has taught a sort in place of the idea, which is a purposeful design defect» | the reviewer | check | tests pin it | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L198 | shared (topic 7) | STAYS |
| QC-S41 | «A child who missed every Teach and could still produce the final piece well from what they brought with them has met a product, and a lesson whose named learning nothing later needs is a purposeful design defect, not polish, whatever the practice shows about the objective's wording.» | the final task | check | | `agents/design-reviewer.md` › 1. Learning contract · L155 | shared (final task, topic 7); the reviewer's copy of S03 | STAYS |
| QC-S42 | «Reusing a task for consolidation is legitimate when that is its stated purpose, rather than claiming it demonstrates unseen transfer.» | a reused task | may | | `references/preferences.md` › What the sheet is for · L679 | shared (worksheets); honest "say so" rule (decision 1's list) | STAYS |
| QC-S43 | «**Decide, and say, which the good instance is: a parallel case children transfer from, or a model of this very case that they rehearse.**» | a launch model | must | | `references/preferences.md` › Lesson Designer visual-need boundary · L627 | shared (the launch); honest "say so" rule (decision 1's list) | STAYS |
| QC-S44 | «It is never `the strong one is better`, which every class answers correctly from length alone» | a launch's difference line | must not | | `references/preferences.md` › Lesson Designer visual-need boundary · L635 | shared (the launch); duplicate of H16 | STAYS |
| QC-S45 | «When the item is being held for later assessment, normally keep that exact item out of teaching and practice and use a fresh parallel.» | a held test item | default | | `references/preferences.md` › Practising a Test Question · L471. Copy: S46 | shared (the rest of preferences, topic 7): a fresh case that protects an assessment item | STAYS |
| QC-S46 | «a named test question is practised at the same structure, scale, response form and demand, with fresh content.» | the reviewer | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L216 | shared; duplicate of S45 | STAYS |
| QC-S47 | «The case has to come from what was taught, so the lesson must have supplied it or the idea to find it.» | §8.8 Prove Sam Wrong | must | | `references/do-beats.md` › §8 Generative (8.8) · L438 | shared (assumed knowledge) | STAYS |
| QC-S48 | «A response becomes a sort, a match or a stem; it does not become copying» | a Below resource | must | | `agents/adaptation-designer.md` › 4. Design any separate Below resource · L190 | shared (adaptation) | STAYS |
| QC-S49 | «can leak the classification they are meant to decide» | item labels on a slide | must not | | `references/slide-composition-playbook.md` › 4. State the task once and set the material apart from it · L96 | shared (slide designers); agrees with G29 | STAYS |
| QC-S50 | «This does not require a manufactured Do activity or a full extra teaching cycle.» | orientation | must not | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L188 | shared (rhythm, TD-I01); supports decision 2 | STAYS |
| QC-S51 | «keep only the orientation needed to enter the example, using a brief separate presentation moment if needed, and remove a manufactured Do» | the reviewer | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L200 | shared (rhythm); supports decision 2 | STAYS |
| QC-S52 | «- **A fact, name or definition** needs surfacing: recall it, match it, sort by it.» | a fact, name or definition just taught | default | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L196 | shared (rhythm, TD-E02); decision 4 turns on it | STAYS |
| QC-S53 | «PPT examples must not duplicate worksheet numbers/contexts.» «so the deck's examples must not reuse its numbers or contexts» | a deck beside a worksheet | must | | `agents/lesson-designer.md` › Before You Design Anything · L121 | shared (worksheets): fresh cases between deck and sheet | STAYS |
| QC-S54 | «so the independent task the lesson's evidence depends on has already been answered together.» | a board that reprints the sheet's questions | must not | | `references/slide-composition-playbook.md` › 5. Build a hierarchy, not a pile of equal boxes · L157 | shared (slide designers) | STAYS |

---

## Out-of-date text

| Row | What it says | Why it is out of date |
|---|---|---|
| QC-B05 | «The limit is the recap boundary above:» | 4.2.283 replaced the recap boundary with the fresh-case paragraph; nothing above is called that now (decision 3). |
| QC-G10 | «passes through the answer-scatter principle in the core notes at the top of this file» | The top of the file names the principle `Protect answers without destroying meaningful order`; "answer-scatter" appears nowhere else. |
| QC-D14 | «Lower stakes than Brain Dump.» | There is no Brain Dump entry; §1 skips from 1.3 to 1.5. |
| QC-G33 | «a task that only reformats the material it hands over» (quoted from the reviewer on the same line) | That phrase is no longer in the reviewer's file. |
| QC-P08 to P10 | the reviewer's sample cases | They still approve a sort "fine as a named two-minute orientation", a check "when the design says so", and forbid asking for "fresh cases", which 4.2.283 turned round. No agent reads them. |
| (code comment) | the reviewer's always-read list calls the contrasts file "Six short contrasts" | There are seven, and a test counts seven. |

## Stories and dated rulings

| Row | Story | In the build log? |
|---|---|---|
| QC-A01 | "the teacher's ruling, 14 September 2026" | Yes (L1213, 4.2.205). As you gave it, the ruling is about matches, sorts and labels; 4.2.283 widened it to new examples and situations (L4328). |
| QC-E02 | The RE beat `My walk matters because...` under a bubble that gave the reason | Only as its twin, the Zara beat in the same RE design (L2336); the walk words are not there, so copy them before they leave |
| QC-E04 | The RE design that picked "complete the because" after a slide that stated it | Yes (L2336) |
| QC-D07 | `his birth shows God's love for people` read back into a because stem | Yes in other words (L2348, "Why read the birth story?") |
| QC-M34 | The RE read-back whose evidence a child who slept through the Christian meaning could write | Yes (L2348) |
| QC-E11 | The rattles and `before sixteen` thinking lines a reviewer approved | Yes (L2306) |
| QC-E01's line | "28 saved designs in a row had written `null` there" | Yes (L1255) |
| QC-M30, QC-S13 | The PSHE quick check whose answer, breathing, lived only in the script | **No** (the "breathing" hit at L2057 is a different story) |
| QC-N01 | The catchphrase `say we'd need to see the whole week again` | **No**; it may be an invented example |
| QC-S07 | The Viking launch model (Sigurd) that answered the task before children met it | Yes in substance (L977), without the name |
| QC-G06's line | The `Hard working conditions` / `A reason families still chose it` groups nobody could tell apart | Yes (L1187) |
| QC-G26, G27 | Your rebuilt Tudor lesson: the job match worked, the two sorts were shallow | Yes (L1135, with the approved wording at L1137); decision 10 |
| QC-K21's line | Three whiteboard sorts on the carpet (15 September) | Yes (L1135) |
| QC-J01's line | The rounding lesson that modelled 43 and 45 and practised once at the end | Yes (L927 and later) |
| QC-G07 | `knowing when bread is baked just right` keyed to one group | Yes (L1137) |
| QC-S18 | The science deck that asked for the three layers twice | Yes (L2105) |
| QC-P05 | The steam option bank (code comment) | Yes (4.2.283) |
| QC-P07 | The history starter printed in answer order (4 September, code comment) | Yes (L3348) |
| QC-H04 | Your ruling: true or false is "fine, but can be cheap" | Your words (L1233); keep |
| QC-K19 | Your ruling: thumbs are "a bit better" than Stand If and still weak | Your words (L1201); keep |
| QC-G30 | Your wish: children matching and sorting, not explaining after every slide | Your words; keep |
| QC-J01 | Your ruling: "The your turns are good because they are a quick check..." | Your words; keep |
| QC-S08 | Your ruling (18 September) on a model of the same case | Your words; keep |

## Names the code depends on

These are read by programs or tests and do not change without the code:
the bold leads `A quick check is a fresh case, not the last slide again` (cited
by name in the designer, the reviewer, the catalogue and twice more in
preferences, and printed by the review view) and `A quick match, sort or label
is a real Do beat when the things on the cards are new`; the list name `Name
what the chunk needs children to do with it` (a test constant); the headings
`The Teach → Do → Teach → Do Rhythm`, `What a Lesson Is For`, `Cognitive Load
Triage on Scaffolds` and `Slide Philosophy` (routing card, always-read list,
tests); `### 10.8 Which Claim Does This Support?` and `## 10. Explain,
predict, infer and connect` in the catalogue; `## The contrasts` and the count
of seven `**Where the simpler task is right.**` paragraphs in the contrasts
file; the review view heading `## Each Do beside the teaching before it` and
its count line; the routing card's trigger texts; the `thinking` field (at
most 200 characters) and the kinds allowed a null one (`prepare`, `my-turn`,
`grounding-input`, `stimulus`, `set-task`); the `prepare` modes, including
`bounded-attempt` and `pattern-investigation`; `TEACH_KINDS` and the route
kinds (`do` exists only in content lessons); `taskStructure` kinds
`option-bank`, `sort`, `evidence-classification` and the option bank's exact
keys; `answer.delivery`; `acceptanceCondition`; the `your-turn` cycle check;
the write-on world form the stick-in builder forces; and the reviewer's sample
case ids `shallow-sort-passes-a-misunderstanding`,
`quick-check-after-a-teach-is-legitimate` and
`surface-cue-check-mimics-understanding`.

What the code enforces today: an ordering task in an option bank or a
starter's bulleted list, when its wording asks for an order and three or more
items carry a readable date or period, may not print those items sorted either
way (undated items among them are ignored); every skill cycle ends with its own
Your Turn; a `thinking` line of at most 200 characters is required on every
beat except those where the teacher acts, and that list includes every
`prepare` unit.

What it does not enforce, although the text might suggest it: nothing checks
that a Do's expected answer is not a restatement (a word-overlap refusal was
measured and rejected in 4.2.283; the view only counts, and does not count the
Teach's takeaway); nothing checks for a spare card against elimination, for a
wrong option a child would believe, or for the position of right answers; the
answer-order check does not reach a sort or a match; nothing checks that a
sort's key allows a second placement; nothing forces `teacher-only` delivery on
an exact-answer Do; nothing reads a check's expected answer against its own
slide's visible text; and the review view's side-by-side section covers only a
content lesson's `do` straight after a Teach, printing "none written" when the
answer is a structured sort (decision 9).

## Rows whose wording a test already pins

Found by matching every phrase-length string in `scripts/tests` against the
quotes, then removing matches on headings or generic words. A row here cannot
lose that phrase without a test failing; a fold that moves the phrase moves the
test with it.

A01, A05, A09; B04, B05; C01, C06, C07, C09; D01, D02, D03, D04, D06, D07, D08,
D09; E01 to E08, E11, E12; F01, F03; G01, G05, G06, G07, G08, G15, G21, G25,
G26; H04, H08, H12, H15, H16; I01, I05; J01, J05, J06, J09; K09, K11, K12,
K19; L01, L06, L08; M01 to M12, M21 to M24, M29, M34, M41; N01 to N04; P01,
P02, P04; S01, S02, S03, S05, S06, S08, S09, S12, S16, S18, S19, S24, S26,
S31, S36 to S40, S44, S53; and the fixture rows P08 to P10 through their case
ids. Pinned by the vocabulary topic as well: I01 (VOC-G10) and I05 (VOC-N26).

Rows with no pin today include most copies of the fresh-case rule outside the
home and the reviewer: A04, A06 to A08, A10 to A23; the permissions C02 to C05,
C08 and C10; the summary and diagram formats D11 to D16 and D19 to D23; the
label formats I06 and I07; and the definition of "fresh" (A21).

## Mentions judged to belong to another topic

Looked at and left out of the rows, because checking is not what they govern:

- **Numbering quick checks** (question labelling): preferences L319;
  templates L1173, L1191; slide-designer L369.
- **Answer slides after checks**: preferences L425, L507; content-based L57;
  output-template L627.
- **Worksheet freshness and evidence**: preferences L669, L677;
  design-reviewer L251, L259, L262; lesson-designer-components L77.
- **Greater Depth "fresh same-objective practice"**: adaptation-designer L269,
  L317; adaptive-adaptation L135; subject-maths L154.
- **The Do-beat catalogue's other formats** (talk, movement, rank, draw), which
  say nothing about whether a response is genuine: do-beats §2, §4 (except
  4.1, 4.2, 4.4 and 4.8), §6, §7.
- **Starters that retrieve**: preferences L289 to L299; subject-geography L126;
  subject-history L199; evidence-synthesis L32 to L38.
- **The launch's `established` line "sets the case, not a recap"**:
  content-based L175; task-centred L122; preferences L627 (its recap part).
- **Stems and word banks that hand over an answer**: teacher-voice L390, L824;
  preferences L111.
- **Pictures that leak a task**: context-pictures L426; slide-designer-focused-
  repair L31.
- **The quick-check slide layout and its title**: templates L527 (the
  quick-check rail), L903 (the heading strip in it); preferences L653 (`Quick
  check` as a warm title).
- **Other uses of the word "check"**: design-review-route-checks L13 (a short
  Teach and Do pair before the first Practise, rhythm); subject-history L97 (a
  check on the design that knowledge is taught before inference, assumed
  knowledge); teacher-voice L680 (a success-criteria step never supplies the
  verdict); do-beats L308 (what a causal chain checks); task-contrasts L75 (an
  inflated task with untaught rules, assumed knowledge).

## Found in passing

- **4.2.283's own record overstates the removal.** Its log entry says the
  excuse "is gone from the designer, the reviewer, `preferences.md` and the
  catalogue"; five survivors remain (B01 to B05), and the reviewer's sample
  cases still teach it (P08 to P10). The log is history and is not edited; this
  ledger is the correction.
- **A bounded attempt can go to review with no `thinking` line.** The
  validator allows `thinking: null` for every kind in its teacher-acts list,
  which includes `prepare` (`validate-lesson-design.py` L285 to L291, used at
  L2147), and a `prepare` unit's mode may be `bounded-attempt` or
  `pattern-investigation` (L1691 to L1705), both beats where every child acts.
  The 4.2.123 log entry describes the rule as refusing null "anywhere every
  child acts". A code gap, raised, not changed; it bears on E01 and J09.
- **The ordering check refuses a list sorted either way**, whatever order the
  task asks for, and ignores undated items among the dated ones. A fold that
  moves G12's words should keep them true.
- **The review view is content-lesson only by construction.** `do` exists only
  in the content route, so `teach-why` and `teach-needed`, though listed as
  Teach kinds, can never be followed by a `do`. Its count reads the Teach's
  headline, explanation, source text, key questions, script and answer, but not
  its takeaway (decision 9).
- **The routing card's reach.** The rhythm trigger fires only for a restated
  explanation; `Cognitive Load Triage on Scaffolds` opens "when a scaffold may
  reveal the answer", the reviewer's only route to G34; `Slide Philosophy` opens
  when "a Do beat is a question to the room".
- **The reviewer's sample cases carry no force.** Two tests read the fixture,
  and both check only that case ids exist; no agent, script or evaluation reads
  the case text.
- **Two maintainer texts are stale**: the always-read list's comment ("Six short
  contrasts", there are seven) and the skill route's quotation of the reviewer
  (G33).
- **The catalogue's counts are stale.** Its contents say §1 has eight recall
  formats, §2 eight talk formats and §3 eight write formats; each has seven
  (1.4, 2.3 and 3.6 were removed), and §1's contents still name "brain dump".
  §3.7 and §3.8 are two entries for one format (hinge or diagnostic question).
- **The rhythm section's contents line does not mention quick checks**, so an
  agent reading contents to find the rule would not find it (decision 8).
- **The designer's quick-check paragraph sits in Misconceptions** (A07), the
  one place a designer reading for Do beats is least likely to look; its pointer
  is what reaches the home.
- **The review view's count reads a Teach's script as well as its board**, so a
  Do that restates only the script is counted as a restatement, which matches
  the rule.

## Independent check: what was not taken

The independent check (`streamline-tools/quick-checks-inventory-check.md`) was
read whole and every finding checked against the files. Everything it found
was verified and taken, except:

- **The maths example sheets against H10 (its pair 7)**: not raised as a
  decision. The maths file already says in its own words that the sheets fail
  on this point, and those sheets are not among the calibration examples the
  plan keeps word for word.
- **Held test items (its item 35)**: added as shared rows S45 and S46, with no
  decision; the fresh parallel there protects an assessment item, which is the
  rest of the preferences file's ground, not a check's.
- **K01 as "must" (its section 3, item 7)**: taken as "must, when the result can
  inform readiness", with the checker's own doubt kept in the row.
- **`blocked-then-mixed` on J01's line (its section 5, item 4)**: left
  unquoted; it is how maths practice is ordered, not a check.
- **Words to Diagram (its item 9, marked unsure)**: taken into decision 6 as
  the least certain of three, so Daniel can leave it out.
