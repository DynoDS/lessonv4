# Independent check of the Teach then Do ledger

Checked against lesson-v4 at `3de9c956` (4.2.284); the plugin working tree has
no local changes. Read-only: nothing in the repo was changed except this
report. Line numbers are file lines at `3de9c956`.

How the search was done: every «quote» in the four ledgers written tonight
(Teach then Do, quick checks, assumed knowledge, vocabulary) was located by
script and the file lines it covers recorded, so a line counts as "covered"
only where a quote actually sits on it. Then the core homes were read in full,
line by line against that map: the preferences rhythm section and the rest of
`preferences.md` where the rhythm is mentioned (What a Lesson Is For, Classroom
Norms, How Much Fits, Starters, Support, Slide Philosophy, Pride Lessons), the
whole lesson designer, all five route files, the do-beats core notes and every
catalogue entry, the reviewer's material-defect boundary and review sections 1
to 3, the route checks, all six subject files, the evidence synthesis,
`lesson-designer-components.md`, `task-contrasts.md`, the slide playbook's
split rules and Lesson rhythm section, and `teacher-voice.md` §13. Every other
instruction file in `agents`, `references` (build log excluded), `skills` and
`commands` was then swept for the rhythm's usual words and for words that
avoid them (to the room, hands up, sit out, in a row, teacher talk, orientation,
earns its place, enrichment, detour, cycle, every child, each child, confident
speakers, one idea, before the next, Do beat, Teach/Do). "Shared" below means
another topic owns the rule, but the Teach then Do ledger should still carry a
row so the fold cannot lose it.

**Most important, in one place.**

1. Decision 1 would delete the designer's only copy of "a substantial task is
   launched before it is instructed" (section 1, item 1), and would move I02's
   "cut" without its three written limits (item 3).
2. Rules with no row that a fold would lose: the skill route's splitting axis
   (item 2), Daniel's bridging-cycle floor (item 7, pinned by a test),
   Discovery's pairing test (item 6), what follows an early Practise (item 9),
   comparisons run side by side (item 11), and the subject files' "not only the
   confident speakers" (item 4).
3. Missed pulls: every child commits against "the teacher chooses hands up";
   the three-in-a-row trigger reads a `format` field the template leaves null;
   sort-then-explain as one beat or two; a conditional synthesis against the
   code's compulsory one; the practical-lesson shape with none of the
   bounded-attempt conditions (section 4).
4. Decision 3's premise is doubtful (the Teach split already gives a separate
   scene-setting slide), decision 6's is partly wrong (the reviewer already
   returns a missing short cycle), and decision 2 misses that Daniel's own Tudor
   boards are two teacher slides in a row.
5. The scaffold holds a second copy of every route shape, tests pin section
   order as well as phrases, and the rhythm section is read by the reviewer only
   when a trigger fires (section 5).

---

## 1. Missed rules

No row and no appendix entry in the Teach then Do ledger, unless the item says
otherwise. Ordered by how much a fold would lose.

### Likely to matter

1. **`agents/lesson-designer.md` L245, last sentence (inside the designer's own
   rhythm section).**
   «A substantial task is launched before it is instructed: what the lesson has established, a good instance beside a weak one, the steps, on the board (`preferences.md` → Slide Philosophy, `Giving a task its instructions is not launching it`).»
   Shared (launching a task). It matters because decision 1 proposes that the
   designer's rhythm section keeps "only how to record each beat ... and the
   instruction to read your section". This sentence is neither, is not about the
   rhythm, and would be deleted with the section's restatements. The appendix
   lists launching only at `preferences.md` L627 to L637, not this copy.

2. **`agents/lesson-designer.md` L152 and L154: what counts as one concept in a
   skill lesson.** Group B (and J, skill).
   - L152: «**Splitting axis when LO names multiple outputs** (words+digital, add+subtract, pounds↔pence, standard+expanded, fraction+decimal): do outputs share one procedure or different? Same procedure different outputs = one concept (a/an: check next sound). Different procedures = two concepts (words = minutes-first, next hour for to-times; digital = hours-first, just-left hour).»
   - L154: «When LO has output fork AND directional/categorical fork (words vs digital × past vs to), split on output fork - not directional. Output type is act child doing; directional is decision inside act. Concepts split by act, not decision.»
   - Its companion, `references/teaching-sequence-skill-based.md` L174: «If you find yourself wanting to write two SCs for one concept (one for output X, one for output Y) that's the signal that you've got two procedures sharing a concept, not one — split them into two concepts at the structure level (see "Picking the splitting axis" earlier).»
   Group B has no skill-route rule for what one idea is beyond J11's "small
   variations". Note the L174 pointer is also stale: there is no "Picking the
   splitting axis" anywhere in the skill route; the rule lives only in the
   designer's Structure Decision (for decision 7).

3. **The limit on "cut the beat": brief enrichment may stay.** Group I, the
   counterweight to I02's «Where beat serves nothing objective asks and cannot be linked back honestly, cut.»
   - `agents/lesson-designer.md` L399: «A brief relevant fact can also earn its time as interesting subject knowledge children take away, without becoming a new assessed objective. Remove detours that crowd out the learning; do not mistake the fewest facts or slides for the clearest lesson.»
   - `references/teaching-sequence-content-based.md` L21 (B09's line, unquoted by B09; AK-B10 quotes only «Keep the context needed for this step.»): «Brief relevant enrichment may be worthwhile knowledge in its own right; a substantial new strand still needs a place within the objective, teaching and available time.» and «Preserve the explicit knowledge needed for meaningful success rather than making the teaching thin.»
   - `references/design-review-route-checks.md` L13 (L13's line, unquoted): «Preserve knowledge needed for the response and brief relevant enrichment that earns its time as worthwhile subject learning; it need not all be assessed.»
   Decision 1 moves I02's "cut" into the preferences section as a one-place
   rule. Without these three, the moved rule is stronger than the files meant.
   The last sentence of the content-route line is also the counterweight to
   B01's «Long teacher talk replaces practice with listening».

4. **"Every child", as the subject files say it: enough individual evidence,
   not the confident speakers.** Group C (the subject copies of C01's "could
   most of the class sit it out?"). No ledger quotes any of the three.
   - `references/subject-pshe.md` L28: «Flexibility does not mean weak evidence. The design must still identify enough individual evidence to know whether each child can understand, decide or perform the intended learning rather than relying only on confident speakers.»
   - `references/subject-re.md` L49: «There must still be enough individual evidence to show that children understood the intended knowledge, interpretation, comparison or reasoned view rather than relying only on confident speakers.»
   - `references/subject-history.md` L146: «Make each child's understanding available to the teacher rather than relying on the most confident group spokesperson.»
   The ledger's claim that "a question to the room is not a Do" is written in
   about 12 places misses these three.

5. **The teacher chooses hands up.** Shared (Classroom Norms), but it pulls
   directly against C01 (see section 4).
   - `references/preferences.md` › Classroom Norms L130: «Generated slides, notes and task briefs normally state the learning action only, such as "Write...", "Discuss...", "Draw..." or "Choose...", without naming a recording surface or routine participation method. Name a medium, device or response structure only when it is genuinely part of the selected task or required resource. The teacher chooses whether children use books, whiteboards, devices, hands up, cold calling, wait time or another routine in the live classroom.»
   - Copies: `references/evidence-synthesis.md` L153 («The live teacher chooses how to gather and inspect responses, including hands up, cold calling, partner work, writing or another routine.»), `references/do-beats.md` L23 («Normally state the learning action. Name a device, medium or substantive response structure only when it genuinely forms part of the selected activity.»), `references/preferences.md` › Starters L299, and the catalogue's repeated «the teacher chooses how responses are gathered» (2.2, 3.7, 6.x, `templates.md` L1882).
   C11 quotes the one sentence that tries to reconcile the two («The teacher chooses how responses are gathered; the Do remains each child's opportunity to use the learning.») but not the rule it answers.

6. **`references/teaching-sequence-discovery.md` L41: Discovery's own pairing
   test.** Group D. AK-E16 quotes only the sentence before it.
   «Its `thinking` line, like the Explore's, names what the pattern lets a child predict or explain (`if we moved the torch closer, where would the shadow fall, and why?`), not the looking or the recording; a line a child could answer before the exploration has made the exploration decoration.»
   The ledger says the pairing rule sits in the routes' `thinking` guidance in
   three places (D06 skill, D07 task, D08 dialogic). This is the fourth, and the
   only Discovery one.

7. **`references/teaching-sequence-skill-based.md` L215: the bridging cycle,
   in Daniel's words.** Group J (skill). On J13's line but in no quote, and not
   in QC-J01 either.
   «**A bridging cycle on small numbers earns two questions, not none**: "even if its similar ... maybe your turn just has less questions".»
   The same line also carries «which is also where `subject-maths.md`'s blocked-then-mixed rule lands, because the earlier cycles' Your Turns are the blocks and the last one mixes them.» J13 says the Your Turn is "sized to the cycle"; this is the floor on that sizing, and it is his ruling.

8. **`references/teaching-sequence-skill-based.md` L51: a distinct modelled move
   as its own `my-turn` "inside the same concept".** Group J (skill).
   «In the structured hand-off, each genuinely distinct My Turn modelled move is its own `my-turn` source unit inside the same concept, so it can carry its own starting instance, modelling state, representation configuration, script and answer/model.»
   Read alone, this sends a designer to two `my-turn` units, which J21 and the
   validator refuse unless an Our Turn and Your Turn come between. It needs a
   row beside J21 and a question (section 4).

9. **`references/teaching-sequence-content-based.md` L15: what follows an early
   Practise.** Group J (content). On J31's line, unquoted.
   «Teaching that the work earns (feedback on what they produced, the next distinction, a short transfer check) continues after it as ordinary Teach→Do pairs, and an Apply slide follows if earned.»
   The reviewer's copy carries the strength: `design-review-route-checks.md` L13, «do the pairs after it teach something the work earned (feedback on what was produced, the next distinction, a short transfer check) rather than carry on the lesson as if the main work had not happened? A Practise placed early on knowledge not yet taught, or an early Practise followed by beats kept only because they were already written, is a purposeful design defect.» L13's row quotes neither.

10. **`references/teaching-sequence-content-based.md` L116 and L118: a wrong
    idea a Do is built to expose is left for the Do.** Group D/E (pairing a
    Teach with its Do). The ledger's "Found in passing" parks the four-part
    explanation for a Teach-board topic, but these two sentences are about the
    pair, not the board.
    - L116: «When the class can settle it themselves, the honest move is not a statement: the wrong reading meets them in the Do that follows and the board carries the question.»
    - L118: «The limit is the wrong idea a later beat has children correct themselves. This lesson's `fix the claim` beat on `their parents did not care about them` is worth far more as a sentence a child rewrites than as a line they read, and taking it away on the Teach slide spends the beat before they reach it. So ask which of the two a wrong idea is: one nothing downstream touches, which belongs here, or one a Do beat is built to expose, which does not.»

11. **A comparison runs side by side, not taught once and produced at the
    end.** Group K. Both subject files state a rhythm shape the ledger has no
    row for.
    - `references/subject-geography.md` L40 (table row; K01 quotes two other rows): «Compare two places or environments | Content-based | The comparison is the spine, not a closing question»
    - `references/subject-geography.md` L68: «**Comparison bolted on at the end.** When the LO is comparative, the two places run side by side through the lesson rather than one being taught and the other produced at the finish for a closing question.»
    - `references/subject-history.md` L79 (table row; K11 quotes three other rows): «Compare two periods, or say what changed and what stayed the same | Content-based | Both periods run side by side, not one taught and the other produced at the end»

12. **`agents/design-reviewer.md` L166: the reviewer already checks the
    mini-cycle.** Group L. L02 and L03 quote other sentences of this line.
    «For a method, work the hardest case children do alone, step by step, as a child in this class, before you read the designer's step trace in the walk-through's closing decisions, then compare the two: a step that neither an earlier lesson at this size nor today's teaching supplies is a missing short cycle and goes back for redesign, and so is a step the trace calls secure that the brief and neighbouring lessons do not support.»
    Decision 6 says the reviewer never reads the mini-cycle rule (J17). It never
    reads J17's wording, but it is told to return the same fault. See section 4.

### Smaller, or companions of rows that exist

13. **`references/slide-composition-playbook.md` L398: the dialogic paragraph of
    the playbook's Lesson rhythm section.** Group N. N01 to N04 are the other
    four paragraphs of the same section; this one has no row. «In dialogic lessons, keep stimulus and prompt available together. A discussion slide shows the actual claim, scenario, source, choice or referent rather than teacher prose. The Reflect is purposeful individual synthesis and does not read as an answer to a discussion.»

14. **`references/slide-composition-playbook.md` L194, misfiled in the appendix.**
    The appendix puts L192 to L194 under "where a Teach splits across slides".
    L194 also carries the slide designer's own copy of J21, with an exception
    J21 does not state: «A My Turn is the one beat where a split has to prove what it is: two modelling slides in a row means the class watches two MOVES before practising either, so the build refuses a second consecutive My Turn slide from a different source unit (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`). Two moves is the fault, and the source unit is the evidence. Examples of one move live in one My Turn unit, so two My Turn slides carrying the same unit are one modelling moment the layout had to divide, and the class still practises that one move next.» Group N. (AK-B28 quotes other sentences of this line.)

15. **`references/teaching-sequence-content-based.md` L7: the permission for a
    bounded observation, with its limit.** Group J (content). J34 is only its
    serialisation. «A bounded observation, pattern or short exploration may sit inside this route when seeing it first gives children something useful to explain. Follow it with the accurate teaching that secures the meaning. This does not replace Discovery as a full route when the investigation itself is the best main lesson shape.»

16. **Discovery's middle beats.** Group J (Discovery). J45 to J48 cover the
    conditions, Teach why, Use the learning and the code; Explore and Make
    sense have no rows.
    - `references/teaching-sequence-discovery.md` L27: «State the limits, available material and any safety conditions children need. Do not leave the exploration as “see what you can find out” with no dependable focus.»
    - L31: «Bring together or inspect the observations, outcomes or pattern before the explicit `Teach why` beat.»

17. **Dialogic: a missing view is discussed before it is synthesised.** Group J
    (dialogic). `references/teaching-sequence-dialogic.md` L33: «If an important missing perspective is needed, introduce it honestly as a new perspective or question, let children discuss it, and only then include it in the synthesis.» Its designer copy, `references/lesson-designer-components.md` L9, «After the final discussion, include one honest Synthesise beat.», is a must with no row either (J58 is the route's copy).

18. **Dialogic: a Talk that grows.** Group C/J (the dialogic form of C09).
    `references/teaching-sequence-dialogic.md` L29: «Do not let a small discussion accidentally take over the lesson or cut a rich discussion short merely to satisfy a timer.» Later decision C (time numbers) should also cite this line's «Three to five minutes is a useful estimate, not a fixed limit.»

19. **Three catalogue formats are "do not select" routines.** Group C (and
    decision 5). `references/do-beats.md` L93 (1.3 Whole-class oral rehearsal),
    L111 (1.7 Choral Response) and L475 (9.6 Thumbs-Direction): «**Teacher-owned response routine:** do not select this unless the teacher explicitly requests it.» C13 quotes only Thumbs' limit line and marks it "must not"; the stricter must-not above it, and the same rule on two other formats, have no row.

20. **Thought Tracking, one pupil speaks.** Group C (decision 5).
    `references/do-beats.md` L365: «Mid-freeze-frame, the teacher taps one pupil's shoulder; they say one line of what their character is thinking (dramaresource.com).» Decision 5 lists four formats where most of the class watches; this is a fifth. (It is also a movement beat, which L357 already restricts to «only when the teacher asks for it».)

21. **`references/do-beats.md` L102: a recall Do after Teach 1 that uses only
    earlier learning.** Group D. 1.5 Last Lesson / Last Week / Last Term: «**Best for:** lesson 2+ in a sequence; opening Do beat after Teach 1.» See section 4.

22. **The object comes back when the next task works on it.** Group G. On
    G06's line, unquoted by any ledger. `references/preferences.md` L222: «When the next task works on the same object (the sorted cards, the marked map, the drawn circuit), that object is in front of the class again; when it works on an idea, no card has to follow it through the slides.»

23. **Each subject's material, and where to look for operations.** Group E. On
    E06's line, unquoted. `references/preferences.md` L206: «Each subject has its own kinds of material: history may work on sources and accounts; science on apparatus, models and results; geography on maps and spatial information; maths on mathematical objects and working; English on language and texts; RE on attributed accounts and religious material; PSHE on strategies and situations.» and «a diagnosis can be easy or demanding depending on the material and the support, so judge demand separately. `do-beats.md` → Operations to think with gives each one an example and what makes it the real thing; open it when a candidate's operation is unclear or you want wider options.» E06 quotes «These are examples, not exclusive routes», which refers to the list it leaves out.

24. **E02 quotes only the lead-in of four of its seven kinds.** Group E. The
    substance of each is unquoted: L199 «complete the because, explain one link in the chain, predict what the idea says will happen before the answer is shown, change one condition and say what follows, turn the words into a diagram or the diagram back into words, or decide which of two explanations is better and why»; L200 «what it tells us, and the detail in it that shows so; what it cannot tell us yet, when the lesson's question turns on that» (a condition); L201 «what links this to what we already knew, what it changes about the earlier answer». A fold built from E02's quotes would keep the headings and lose the moves.

25. **`agents/lesson-designer.md` L58: compare a genuine alternative, with its
    condition.** Group E/F (the designer's form of F01's «Consider plausible alternatives»). On E07's line, unquoted. «When the choice of task matters, because it is the main work or the evidence for the learning the lesson claims, compare a genuine alternative: not two route names, and not "this one is more engaging", but the actual explanation and pupil work side by side, asking what each requires a child to know and what a response to each would show. Two complete candidate lessons are never required, and a beat whose choice is routine needs no comparison written down.»

26. **A caveat meant for the children is its own beat.** Group H (a home for a
    second job, beside H02's three repairs). `agents/lesson-designer.md` L94:
    «When the caveat is genuinely for the children (`you can choose to pass`, `you don't have to tell me what you believe`), it is not an aside either: it is taught, in its own beat, with its own words, where the class can take it in.»

27. **`agents/lesson-designer.md` L166: «Keep question-shape consistent across My/Our/Your Turn.»** Group J (skill); the design-side partner of N02.

28. **`references/teaching-sequence-skill-based.md` L23: the reach for an
    unmodelled case.** Group J; a J21 copy with its own must-not. AK-A31 quotes
    other sentences. «Reaching an unmodelled case means another example inside the My Turn when it teaches the same move, or a second cycle when the case is genuinely a different move (the structure section below governs which); it never means a second My Turn slide stacked on the first.»

29. **`references/teaching-sequence-content-based.md` L57: no fixed climb.**
    Group F (a copy of F12's limit). «It does not have to climb from simple to hard in a fixed order.»

30. **`references/do-beats.md` L173 (3.1 One-Sentence Summary), shared with
    quick checks as QC-D11:** «Use sparingly. Do not stack four of these in one lesson.» Group F. It is the catalogue's only numeric variety limit and sits beside F03's "three or more in a row"; the F group should list it as shared.

31. **`references/do-beats.md` L52: step 2 of "How to pick".** Group E. Steps
    1, 3 and 4 are E09, E10 and F10; step 2 has no row. «Notice the response form's actual demands and supports, such as writing load, spoken language, public performance, reading, movement, fine-motor control, partner dependence or visual structure.»

32. **The same evidence twice: G15 is not only in the completion pass.** The
    ledger (decision 1 and "What the list shows") says the "same job twice"
    check exists only in the designer's completion pass. Its near relatives are
    in the reviewer and the designer's amount check (Pride Lessons topic):
    `agents/design-reviewer.md` L42, «Each time the same object or text comes back, name what is new to work out. A second instance of an idea on new evidence, and practice that repeats a known move on purpose, are right; the same evidence met again with nothing new to notice is time spent», and `agents/lesson-designer.md` L519, «the same evidence met again with nothing new to notice is not, and a lesson that does this more than once has been built on one case.» Not the same check (G15 compares what two beats ask; these compare what is new to notice), so unsure whether a fold should merge them, but G15's row should name them.

33. **The slide side of "a Do is not a Teach" and "each beat changes the
    state".** Group N; all three are pinned by tests (section 5) and none has
    a row or an appendix entry.
    - `references/slide-composition-playbook.md` L82: «**A slide where children now do something should not look like a slide where the teacher was explaining.**» with «on a Teach the thing being taught is the largest object and the task line is small or absent; on a Do the pupil's question or task leads and the material is the field it acts on».
    - `agents/slide-designer.md` L135: «what each unit changes since the one before it, and which reference it carries over unchanged, because the change is what its slide must let lead and the carried reference is what recedes.» (The appendix lists L137 beside it, not this line.)
    - `references/slide-composition-playbook.md` L455: «7. What changed since the last slide, and is that the first thing the eye lands on?»

34. **`references/teaching-sequence-content-based.md` L51, the sentence between
    D04 and F03.** Group E (the content route's copy of E01), pinned in order by
    a test: «Then match the form to what was just taught, settling what that teaching needs from children before you name an activity (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Name what the chunk needs children to do with it`).»

35. **`references/teaching-sequence-content-based.md` L35 and L39: key
    questions, the companions of C11.** Group C. «A short precise answer can reveal understanding; longer wording is not evidence of deeper thinking.» and «**Where the brief already lists key questions, start from those.**» C11 is the only key-question row.

Searched with nothing further found: `agents/slide-decorator.md`,
`slide-designer.md` (L137 and L393 are in the appendix), the focused-repair
agents, the stick-in, wall, worksheet and adaptation agents and references
(their "in a row" and "one idea" lines are layout or tier wording),
`skills/make-lesson/SKILL.md` and `playbook-lite.md` (L1267 is a pipeline
rule about re-review, not the rhythm), `skills/make-subject-file/SKILL.md`
(L50 is A14), `commands/*`, `reasoning-prompts.md`, `explanation-tasks.md`,
`modelling-formats.md`, `lesson-from-plan.md`, `brief-gap-protocol.md`,
`revising-in-place.md`, `books-or-sheet.md`, `output-template.md` and
`lesson-design-scaffold.md` (their rhythm lines are M rows or repeat J22).

---

## 2. Duplicates that are not duplicates

Every row marked "duplicate" was compared with the row it copies. These carry
something the kept copy lacks; a fold that deletes them loses the quoted words.

- **C04 is stricter than C01, not a copy.** C01 lets a question to the class be
  the Do when «chosen, not defaulted» and every child commits; C03 and C05 keep
  that exception. The content route drops it: «Every child uses it; a question to the room is a key question, not this beat». In a content lesson the text as written bans the committed discussion question C01 allows. Folding C04 into C01 widens the content route; keeping C04 keeps a disagreement (section 4).
- **H04 is not "a copy of H03 for the recording".** H04 splits a sort from its
  explanation: «When children first sort, then explain, then generate new case, write three consecutive source units, each own prompt and answer.» H03's limit keeps «a claim to judge and the explanation of that same claim» as one beat, and do-beats L15 (Z18) adds «a short justification when the reason behind a placement is part of the intended learning» inside the same beat. H04 has no limit and a different default (section 4).
- **G13 adds "the final performance" to the beside-the-spine list.** G03 lists
  «vocabulary, a routine, a safeguarding note or setup»; G13 (and M02) add
  «the final performance». On the same line, unquoted, G13 also carries the
  move test for a line that names the final task: «A line that names the final task as what it feeds has to name the move the final task makes with it, and that move has to be the one this beat had children make.»
- **L04 carries an exception G01 to G03 lack.** «a beat that makes nothing new but gives useful practice, a needed check or parallel evidence is sound when the design says that is its job». G03 accepts parallel evidence and beats beside the spine, not useful practice or a needed check. L04 also says which failure matters most: «a chain of lines that reads as written-after-the-fact tidy-up while the beats themselves do not connect is the one worth returning.»
- **L06 adds a detection test to I01.** «A Teach→Do pair whose Do nothing later uses is orientation wearing a chunk's clothes». I01 says when orientation is not a chunk; L06 says how to spot one that was built as a chunk anyway. Folding L06 into I01 loses the test.
- **L13 carries a strength and a check the rows it copies lack.** Unquoted on the
  same line: «do the pairs after it teach something the work earned (feedback on what was produced, the next distinction, a short transfer check) rather than carry on the lesson as if the main work had not happened? A Practise placed early on knowledge not yet taught, or an early Practise followed by beats kept only because they were already written, is a purposeful design defect.», and the enrichment limit (section 1, item 3). J31 says «the beats kept after an early Practise each earn their place or go»; only L13 makes it a defect.
- **J61 is not J55: it makes the synthesis conditional.** The unquoted rest of its line: «Add an honest synthesis when it helps children compare what actually emerged, then obtain proper individual evidence in the lightest form that still shows the learning.» J58, `lesson-designer-components.md` L9 and the validator make the Synthesise compulsory, once and last (section 4).
- **J76 carries a rule J75 lacks.** J76's quote is only the fragmenting clause.
  Its line's rule is «**A task with several stages stays one `do-task`, and `steps` is where the stages live.**», with «the slide designer gives a stage that needs the board its own slide» and «Reach for a separate `plan-checkpoint` unit only when planning produces a distinct artefact before the doing begins.» J75 has none of these, and all sit below the line the reviewer reads to (section 4).
- **B10 adds a sufficiency condition to B06.** «Teach a new thinking move through the material it helps children understand, with enough explanation and guided use for the later task.» B06 has «an unfamiliar inference may need an explicit model and guided attempt» but not «enough ... for the later task». The ledger proposes "CONTENT (pointer) or remove"; removal loses it.
- **E09 adds a guessing test E03 lacks.** Unquoted on E09's line: «a format that lets the child answer that question by reading the slide, or from what they knew walking in, is out, whatever section it came from; and read the line against the subject file's own doing-versus-thinking test». E03 tests only «If the line can be answered by reading the board». (M04 in the designer has the guessing half; the preferences home does not.)
- **J04 adds "decision rules" as a reason to split.** «split when genuinely different procedures/decision rules or combined complexity too high». J11, the kept copy, splits on complexity only. J27 (evidence) has «changes the decision rule» too. Folding J04 into J11 drops the decision-rule trigger unless J11 gains it.
- **A04 states the rule's purpose in words A02 and A03 do not.** «Rule prevents several different concepts taught before children do anything». That sentence is the test decision 2 proposes for the reviewer, so it is worth keeping somewhere even if the rest of A04 goes. It also says «Short explanation», where A03 says only «An explanation».
- **F11 adds "no SEND format".** «There is no compulsory non-writing activity, fixed content-to-format route or SEND format.» F01's limit names «no register quota, compulsory movement or requirement to make each task harder», not SEND or a content-to-format route.
- **F05 names access as a reason to vary.** «Vary form when improves learning/attention/access, not quota.» F01 names «learning value and engagement»; access appears only in F07. Minor.
- **L02 adds rehearsal to what may legitimately stand without a chain.** «Parallel evidence gathering, rehearsal and necessary setup remain legitimate; do not demand a written product or strict chain between every slide.» G04 names parallel sources only. Minor.
- **J78 is not J70.** J70 guards against the input swelling; J78 guards against
  fragmentation, «without turning the lesson into a sequence of disconnected exercises», which is J76's point. Minor.
- **C13 is not the whole Thumbs rule.** The line above it in the same entry,
  L475, is stricter than the quoted limit: «**Teacher-owned response routine:** do not select this unless the teacher explicitly requests it.» The same line heads 1.3 and 1.7 (section 1, item 19).

Checked and a true duplicate (a fold loses nothing): A05, A08, B07, C03 (keeping
the field names, as the ledger says), C05, C08, C16, C17, D03, E07, F09, F10,
F13, F14, G10, G12, G14, J35, J73, L05, L08, L16, L21, I03.

---

## 3. Strength and scope (about 110 rows checked)

Wrong or incomplete:

- **C07 is recorded "default (the time)".** Its first two sentences are musts:
  «A short processing beat makes children use one manageable chunk before the next distinct idea arrives. It gives every child something concrete to do with the chunk and leaves something the teacher can see». C08, its copy, is recorded "must". Only the one-to-three minutes is a default.
- **I01 is recorded "default / may"; the assumed-knowledge ledger records the
  same sentence as "must" (AK-B15, «must (give the context)»).** «Give children the context needed to enter the first example» is an instruction; the separate moment is the "may". The two ledgers should agree before Daniel sees either.
- **C13's strength misses its stronger half.** Recorded "must not ... a thumbs
  check". The entry is a teacher-owned routine, not selected at all unless the
  teacher asks (L475). The quoted limit is the weaker rule.
- **H04's "when it applies" (every pupil action) has no limit,** though H03's
  limit (a single task with parts is one beat) and Z18 (a placement may carry
  its justification) bear on exactly its example.
- **C04's scope is right (content lessons) but its strength needs a note:** it
  has no committed-question exception, so it is stricter than C01.
- **F03's "when it applies" should say it depends on `format` being filled.**
  The trigger reads the Do beats' `format` lines, but the content Do template
  says «Use a non-null `format` only when the substantive response structure is genuinely part of the learning; otherwise use `null`.» (L145). On a design that follows the template the trigger usually has nothing to count (section 4).
- **J16 "must (code)" overstates the code.** The validator keeps other beats out
  of a cycle only among `teachingSequence` units. A vocabulary slide is placed
  by `vocabularyIntroductions`, not as a unit, so nothing in the code stops one
  anchored after a My Turn (the vocabulary check found the same).
- **J13 "must (code)" is code only for "a cycle ends with a Your Turn".** "A check
  rather than the main practice", "sized to the cycle" and the two-question
  floor for a bridging cycle are prose; the floor also sits in the validator's
  error message, a code name the row does not list.
- **J57's code names miss a rule.** The validator also refuses a Talk whose
  `discussionQuestion` is not exactly the preceding Stimulus's `question`
  (`validate-lesson-design.py` L2832 to L2835). `discussionQuestion` is not in
  the ledger's field list.
- **M06 "must (code: a lesson over 50 minutes is refused)" is stated loosely.**
  The refusal is on the sum of the starter, every teaching unit and the ending
  beat, and only when every one of them carries `minutes`; each beat must also
  be 1 to 25 minutes. The row's own text says «the beats may take 40 of them», so
  prose and code differ by ten minutes (shared with the time topic).
- **M03 and M04's "when it applies" copy prose narrower than the code.** The text
  allows a null `thinking` only on «a My Turn, a stimulus, the setting of a task»; the code also allows it on `prepare` and `grounding-input` (`NO_PUPIL_ACTION_KINDS`, L285). A `prepare` in `bounded-attempt` mode is a beat where children act, and the code lets its thinking be null.
- **C10 is recorded "default" but its last clause is C09's must:** the grown
  beat is treated as main practice «and protect the rest of the lesson». Minor.
- **C11's scope "content Teach beats" is narrower than the text:** the skill
  route's `teach` beat «can ask a question that makes the class look while it runs» (J18's line, L223). Minor.
- **J23 is recorded "default" but carries a must-not:** «do not use either exception to jump from one model to independent work on genuinely new or difficult learning». Minor.
- **E02 "must": unsure.** E10 calls the same kinds «starting possibilities, not routes that settle the choice», and E03 says «These name the thinking, not the format». "Must settle the kind of thinking" fits; "must use these activities" would not.

Checked and correct: A01, A02, A03, A05, A06, A09, A11, A13, B01, B03, B04, B05,
B06, B09, B13, C01, C06, C09, C12, C14, C18, C19, D01, D04, D06, E01, E05, E06,
E10, E11, F01, F07, F12, F15, G01, G03, G04, G06, G07, G08, G09, G15, H01, H02,
H03, H05, H06, I02, I03, I05, I07, I08, J01, J10, J12, J17, J18, J21 (with its
note about "for the same concept"), J22, J24, J25, J26, J31, J33, J34, J47, J48,
J55, J58, J63, J70, J71, J72, J74, J75, K02, K03, K12, K13, K14, K18, K21, K22,
L07, L10, L12, L17, M01, M09, N05 (a presentation fault that fails the slide
check; note it finds a My Turn by its title, not its kind), Z05.

---

## 4. Disagreements

### The ledger's decisions 2 to 6, read against the text

- **Decision 2 (teacher-only runs): genuine, and it misses the strongest case.**
  The preferences tell is worded in slides, not beats: «a run of slides that are all the teacher talking» (H01; a test pins that exact phrase, section 5). Daniel's own Teach calibration is two teacher slides in a row for one beat: board 1 (`Why did Tudor families need their children's help?`, a lead and an orange line, no question) and board 2 (same title, the question band) in `preferences.md` L786 to L787. The playbook splits a Teach that way by design («the scene set on the first slide ..., the look and the landed sentence on the second», L192), and B13 already says «a Teach split across two slides is one episode, not two». So H01 read literally flags his chosen boards; the reviewer's L07 («teacher-presented beats») does not. The routing card (L17) fires at «two teacher-presented beats», not "a run". Decision 2 should name the slides-or-beats wording and the calibration, and A04 has the test wording it needs (section 2).
- **Decision 3 (scene-setting in a knowledge lesson): the premise is doubtful.**
  I01 asks for «a brief separate presentation moment», not a beat, and the text
  already builds one without a new kind: the first Teach beat carries the way in
  (content route L114: «What the class already has may open the route when the takeaway needs it (`Every home needs food, a fire and a roof, every single day.` before the Tudor sentence); it is the way in, not a fifth part.»), and when the board is full the Slide Designer splits it «the scene set on one slide and the look and the landed sentence on the next, with the picture on both» (content L122; playbook L192). Tudor board 1 is exactly that scene-setting slide. What cannot be built is scene-setting as its own beat with no Do after it, which is what L06 («using a brief separate presentation moment if needed, and remove a manufactured Do») warns against anyway. Unsure which Daniel means; the question as written ("the rule cannot actually be built") overstates it. If a new beat kind is still wanted, the scaffold has its own copy of the route shape and a test that holds the two together (section 5).
- **Decision 4 (Discovery with two ideas): genuine.** Nothing to add beyond the
  Discovery pairing test the ledger missed (section 1, item 6).
- **Decision 5 (formats where most watch): genuine but incomplete.** Add 7.2
  Thought Tracking («the teacher taps one pupil's shoulder; they say one line», L365), and note that 1.3, 1.7 and 9.6 are already "do not select unless the teacher asks" (section 1, item 19), which is the existing pattern for the fix the decision proposes. The calm-classroom paragraph already says «Choose a whole-class movement beat only when the teacher asks for it» (L357), so Human Sequencing is restricted today, not listed freely.
- **Decision 6 (rules the reviewer never reads): partly wrong.** The reviewer
  never reads J17's words, but its own file makes it return the same fault: «a step that neither an earlier lesson at this size nor today's teaching supplies is a missing short cycle and goes back for redesign» (`design-reviewer.md` L166). The skill-route rules genuinely unread are J12, J13, J16, J18 to J21 and the bridging floor. The task-centred route also has a rule only below its line: J76's «A task with several stages stays one `do-task`» (L132). On the second half: `Slide Philosophy` is not empty of the rule, it has one clause, «a Do slide is still the case and what every child decides» (`preferences.md` L531), but the ledger is right that the rule itself lives in the rhythm section.

### Pairs the ledger did not raise

1. **"Every child commits" against "the teacher chooses hands up".**
   - C01: the form «has to make every child commit to one (a decision each child writes down, talk partners then a line each, a vote with a reason)».
   - Classroom Norms L130: task briefs «normally state the learning action only ... without naming a recording surface or routine participation method», and «The teacher chooses whether children use books, whiteboards, devices, hands up, cold calling». The same in `do-beats.md` L23, `evidence-synthesis.md` L153 and the catalogue's «the teacher chooses how responses are gathered».
   - A designer who follows Classroom Norms writes `Discuss ...`; the teacher may then take it with hands up, which C01 says is a question to the room. C11's «The teacher chooses how responses are gathered; the Do remains each child's opportunity» reconciles the two for key questions only.
2. **The three-in-a-row trigger reads a field the template leaves empty.**
   - F03: «read the Do beats' `format` lines in order: when three or more in a row are talk or written explanation, open §5 and §6»; L10: «every `format` a spoken or written explanation».
   - Content route L145: «Use a non-null `format` only when the substantive response structure is genuinely part of the learning; otherwise use `null`.»; `do-beats.md` L23: «Name a device, medium or substantive response structure only when it genuinely forms part of the selected activity.»
   - The validator lets a content Do's `format` be null (L1754). Followed as written, the trigger has nothing to read.
3. **Sort then explain: one beat or two?**
   - H04: «When children first sort, then explain, then generate new case, write three consecutive source units».
   - H03's limit: «a claim to judge and the explanation of that same claim ... is one job and stays one beat»; Z18 (`do-beats.md` L15): «Add a short justification when the reason behind a placement is part of the intended learning»; F03: «its placement is the decision, and the reason for the hardest placement is where the explanation goes».
4. **A distinct modelled move: its own `my-turn` in the same concept, or its own cycle?**
   - Skill route L51: «each genuinely distinct My Turn modelled move is its own `my-turn` source unit inside the same concept».
   - J21 and the validator: two My Turn units in a row are refused; «a genuinely different move earns its own cycle rather than a second My Turn beside the first». L51 is right only if each `my-turn` opens its own cycle, which it does not say.
5. **Dialogic synthesis: compulsory or when it helps?**
   - J61's line (`evidence-synthesis.md` L237): «Add an honest synthesis when it helps children compare what actually emerged».
   - J58, `lesson-designer-components.md` L9 («After the final discussion, include one honest Synthesise beat.»), J62 («Discussion with no Synthesise» is a red flag) and the validator («Dialogic Synthesise must occur exactly once and last»).
6. **The practical-lesson shape against the bounded-attempt conditions.**
   - A11 (`teacher-voice.md` §13): «Challenge → brief teaching → try it → quick check → improve it → record it.», with no conditions.
   - J26: a first attempt only «when the attempt is safe, cheap and quick to reset, the goal is self-evident, and success or failure is visible to the child», «Do not use it where a wrong attempt looks fine to the child»; K18: maths never uses it.
   - Decision 1 moves A11 into the rhythm section; moved alone it licenses challenge-first in any practical lesson, maths included.
7. **A recall Do after Teach 1 that uses only earlier learning.**
   - `do-beats.md` L102 (1.5 Last Lesson / Last Week / Last Term): «**Best for:** lesson 2+ in a sequence; opening Do beat after Teach 1.»
   - D01: «What breaks the pair is a Do that uses only the earlier idea, leaving the new one taught and unused.»
8. **"Cut the beat" against "a brief fact can earn its time".**
   - I02: «Where beat serves nothing objective asks and cannot be linked back honestly, cut.»
   - `lesson-designer.md` L399: «A brief relevant fact can also earn its time as interesting subject knowledge children take away, without becoming a new assessed objective.»; the same limit at `preferences.md` L154, content route L21 and route checks L13. Resolvable (a beat versus a fact inside one), but a fold that moves only I02 loses the limit.
9. **A question to the room in a content lesson: never, or when every child commits?**
   - C04: «a question to the room is a key question, not this beat».
   - C01, C03, C05: it can be the Do when chosen so the answer needs the idea and every child commits.
10. **The reviewer's rhythm trigger against the packet's own reason for triggers.**
    - `design-review-packet.py` L101 to L107 (comment): «"Read when a Do practises a different idea from the one its own Teach taught" asks the reviewer to have already found the fault in order to be sent to the section that would help it find the fault».
    - The rhythm trigger directly below it still includes «when a Do beat practises a different idea from the one its own Teach just taught», and `test_the_do_uses_what_its_teach_taught.py` pins that phrase; it also includes «when a beat carries a second job that has no beat of its own», the same kind of trigger. Code against its own comment. It bears on decision 1, because the rhythm section is conditional for the reviewer (section 5).
11. **The designer's lesson clock against the code's.** M06: «The lesson runs about 45 minutes end to end, and the beats may take 40 of them»; the validator refuses only above 50 (`LESSON_MINUTES_MAX`). For the time topic (later decision C).

---

## 5. Code and tests

Omitted from, or stated wrongly in, "What the code enforces today", "Names the
code depends on" and "Rows whose wording a test already pins".

- **The scaffold is a second gate with its own copy of every route shape.**
  `lesson-design-scaffold.py` `validate_route_shape` (from L423) refuses a
  second My Turn, a second Our Turn, a cycle with no Your Turn, a returned-to
  concept, a Practise before any pair and so on, in its own words, before the
  files are written. `test_the_main_work_sits_where_the_lesson_earns_it.py`
  `test_both_copies_agree_on_every_shape` holds the two copies together, and
  `test_the_lesson_is_not_limited_to_the_cycles.py` tests the scaffold's
  «runs uninterrupted» message. The ledger names only the validator. Decision 3,
  if it adds a beat kind, is a change to both programs and to that test, not
  "a small program change with its own test".
- **The rhythm section is conditional for the reviewer.** Its always-read list
  (`ALWAYS_READ_REVIEW_SECTIONS`, `design-review-packet.py` L226) is Pride
  Lessons, What a Lesson Is For, `teacher-voice.md` §17 and `task-contrasts.md`.
  The rhythm section is read only when a routing-card trigger fires. So decision
  1's "PREF-RHY so the reviewer shares it" (for G15, H02's repairs, I02) holds
  only on lessons that trip a trigger; a lesson with two Teach beats and no
  teacher-only run may never open it.
- **The routing card fires at two beats.** «Read when two teacher-presented beats run with no pupil action between them, in any route» (L110). The ledger's L17 row quotes it, but decision 2 describes the reviewer's rule without it. The card also opens the section «whenever the sequence has three or more Teach beats», which is how most content lessons reach it.
- **Order pins, not only phrase pins.** `test_the_do_uses_what_its_teach_taught.py`
  requires `**The Do uses the idea its own Teach just taught.**` to come after
  `**Questioning is not doing.**` in preferences, and the content route's
  «Match the substance before the form» to come before «Then match the form to what was just taught». `test_rhythm_holds_in_every_route.py` requires `The Teach → Do → Teach → Do Rhythm` to sit between `**At the start:**` and `**At the decision point:**` in the designer (A13's line). A fold that reorders the section or moves the reading line fails these; the ledger speaks only of phrases.
- **Pinned text on lines with no row** (so the ledger's list of pinned rows
  cannot show them): the bridging floor (skill route L215, `test_every_cycle_ends_with_its_own_your_turn.py` `test_a_small_bridging_cycle_is_told_what_to_do`); «Our Turn need not match My Turn in number.» (skill route L21, `test_a_my_turn_is_used_before_the_next_is_taught.py` L182); the playbook's My Turn split sentences at L194 («from a different source unit», «two My Turn slides carrying the same unit are one modelling moment», same test, L145 to L147); the playbook's L82 Do-versus-Teach rule (`test_attention_and_teaching_rhythm.py`); slide designer L135 and playbook L455 (`test_rhythm_holds_in_every_route.py`); the content route's «Then match the form» (above).
- **A phrase the test pins that decision 2 would change.** `test_rhythm_holds_in_every_route.py` L229 pins «a run of slides that are all the teacher talking» in preferences. If Daniel answers decision 2 by rewording H01 (slides to beats, or a one-new-idea condition), that test moves in the same release.
- **The validator's own messages carry rhythm rules.** The "no Your Turn" message
  says «sized to that cycle: a bridging cycle on small numbers earns two questions, not none. A Teach or Practise beat goes between cycles rather than inside one» (L2700 to L2708), and tests pin «sized to that cycle», «runs uninterrupted» and «between cycles rather than inside one». These are code names the ledger does not list.
- **Dialogic:** the Talk's `discussionQuestion` must equal the Stimulus's
  `question` exactly (L2832 to L2835). The summary says "asking the same
  question"; the field is missing from the ledger's list.
- **Time:** refused only when every beat, including the starter and the ending
  beat, carries `minutes` (`validate_lesson_fits_the_slot`, from L3263); each beat 1 to 25
  (`BEAT_MINUTES_MAX`); the sum over 50. The summary's "may not add up to more
  than 50" omits both conditions.
- **Null `thinking`:** the code's list (`NO_PUPIL_ACTION_KINDS`, L285) is
  `prepare`, `my-turn`, `grounding-input`, `stimulus`, `set-task`. The ledger's
  "Names" section is right; the M rows' prose is narrower (section 3).
- **`format` is nullable on a content Do** (L1754) and is not a child-facing
  key in the review view (`CHILD_FACING_CONTENT_KEYS` comment, packet L46 to
  L50), so it reaches the reviewer only in the unit's residual fields. F03 and
  L10 lean on it (section 4, pair 2).
- **The reviewer's route-file limit is given in words at packet L694 to L697**
  («read from the file start to, but not including, `## Output Format Block`»);
  L580, the line the ledger cites, only records the scope for the hash check.
  The file itself is handed over whole, so moving rules above the line is a text
  change, as decision 6 says, with the vocabulary pins that name the section.
- **"Each Do beside the teaching before it" covers content `do` units only**
  (packet L1444 to L1500): a `do` straight after a Teach kind. Your Turns,
  enabling-input `pupilInstruction`s, Talk and Use the learning are not shown.
  Shared with quick checks, but it limits what L11 and L20 can see.
- **The slide check finds My Turn slides by title** (`MY_TURN_TITLE`,
  `check-slide-design.js` L377 to L411), skips answer slides and slides from
  the same unit, and reports a presentation fault that fails the check. N05 is
  right about the effect.

Checked and matching the ledger: the skill cycle grammar (any two My Turns in a
row are refused, whatever the concept; one Our Turn; out-of-place Our Turn or
Your Turn refused; concepts in declared order, not returned to); the content
grammar (Teach then Do or Practise, Observe only before a Teach, a pair before
the first Practise, a Practise present); Discovery's exact order; the
task-centred check on the earlier `teach-needed` unit; `unlocks` at most 200
characters with one non-null; a named idea's two instances; the pupil
instruction on a Do that hands over a representation. The "no pin today" list
(A09, A11, C10's clause, C18 to C20, F07, G05, I01, I02, J17, J25, J33, L03's
clause, L06, L12) was spot-checked by phrase against the tests and holds (G05's
"number-line lesson" appears only in test comments).

---

## 6. Stories

Searched `build-review-log.md` case-insensitively for each claim.

Wrong:

- **TD-G11, "not found by phrase": it is in the log.** L2234: «The arrows retired on 2 September were asked to carry the spine; these carry the story, and the spine stays slide by slide in the why line». The maintainer clause can leave without copying anything.
- **TD-J21, "Yes (L1967)": wrong line.** L1967 is the worksheet half of the same
  lesson («its sheet had no chart anywhere»). The two-My-Turns story is in the
  4.2.84 teacher review (heading L3146): L3167 to L3170, «The deck went My Turn (cross a hundred), My Turn (cross a thousand), one Our Turn, Your Turn. Children watched two different moves before practising either, and the plain case was modelled once and then met again only in independent work.» The file's version («modelled a plain number, then modelled crossing a thousand, then guided only the crossing») tells it differently; unsure whether that matters for an undated example.
- **TD-J13, "your words on Your Turns ... Yes": the quoted words are not in the
  log.** «The your turns are good because they are a quick check of can we do this before moving on to the next concept, even if its similar.» is found nowhere in it. The 4.2.154 entry (L2011 to L2021) has the story and two other remarks of his («Ive noticed that maths slides like this one are a different sequence...», «Even small scale, if we're startring small then scaling, can still do it, maybe your turn just has less questions etc.»). His words stay in the file anyway, so nothing is lost, but the log does not back this quote. Note also that L215's bridging quote («"even if its similar ... maybe your turn just has less questions"») splices words from the two remarks; unsure whether he said them together.

Partly right:

- **TD-J17:** the story is in the 4.2.221 entry (L1015 to L1021: «children could not find the two multiples of 10 either side of a number, worst with hundreds and thousands»), but not the number `3,998`, nor the repair's `528` and `5,996`.
- **TD-J32:** right that the log lacks the route's reason («because the route put the main work last»), and no release entry for the Practise-placement change was found (searched readiness, main work, after any complete, last pair). But L1135 already holds Daniel's half of the point: «by the time the written cases arrived (slides 16 to 18, the ones that actually needed the history) he wanted the class at tables doing that work.» Copy only the reason.
- **TD-J18:** the change is logged (L1021: «The Teach beat paragraph now says a why-beat in a methods lesson is one sentence, something to look at and the landing line.»), the `43 children came to the fair` example is not. The ledger's "probably" holds.

Stories on this ledger's rows that the table does not list:

- **TD-M06 (kept in the designer's rhythm section, LD-RHY):** «A teacher met exactly that on a finished Year 4 history deck (18 September 2026): "because we had a big task already, then we've also got to do worksheet, it won't fit the 45 min."» Not in the log (the `minutes` field was added on 18 September, which is likely inside the known 4.2.223 to 4.2.234 gap); the same quote sits in the validator's comment above `LESSON_MINUTES_AIM`. Copy before it leaves, or keep his words without the date.
- **TD-M04 (LD-RHY):** «28 saved designs in a row had written `null` there» is in the log (L1255, «28 of 28 saved Teach beats had written null»). The Year 4 RE `My walk matters because...` example on the same line is not found in the log by phrase; it is also written, undated, in What a Lesson Is For (L152), so it survives there.
- **TD-L10's line (`design-reviewer.md` L44):** «the plugin approved a deck that failed it on 14 September 2026 (a photograph, `A Tudor farm household` under it, the teaching in the notes; the user: "there's nothing on the slide to guide me to know what to say")». In the log (4.2.200, L1251 onwards). The row quotes only the rhythm half of the line.
- **Skill route L221 (TD-J17's line):** the repair details («a My Turn on two cases (`528` and `5,996` ...) and a Your Turn on four more, about four minutes before any rounding») are not in the log; `528` appears only in an unrelated entry (L2410).

Checked and right: B02 (L3089), C02 (Chloe not found), C11 (L2119), C13
(L1201), D02 and D03 (L3076), E04 (L2336), F04 (L1233), F15 (L1133 to L1140),
G15 (L2105), H03 (L2031), J14 (L2011 to L2021, the story), J15 (L1997), K17
(L2023).
