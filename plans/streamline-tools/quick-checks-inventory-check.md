# Independent check of the quick checks ledger

Checked against lesson-v4 at `3de9c956` (4.2.284); the plugin working tree has
no local changes. Read-only: nothing in the repo was changed except this report.
The ledger checked is `plans/2026-09-22-quick-checks-ledger.md` as it stood at
23:16 on 22 September 2026.

## 1. Missed rules

How the search was done: every file and line the four ledgers cite (quick
checks, the Teach then Do rhythm, assumed knowledge, vocabulary), plus the
quick checks appendix, was collected by script. Every instruction file in
`agents`, `references` (with `references/worksheet-helpers`), `skills` and
`commands`, less the build log, was then split into sentences, and each
sentence carrying one of about sixty topic words (fresh, restate, recap,
summary, said back, read off, from the board, elimination, distractor, hinge,
retrieve, just taught, a minute ago, everyday sense, slept, missed the
teaching, orientation, leak, give away, hand over, catchphrase, unseen, did
not show, surface, recognition, copying, guess, previous slide, a check,
and others) was compared with every «quote» in all four ledgers. The core
sections (the rhythm section and What a Lesson Is For in `preferences.md`,
the designer's Before You Design, Misconceptions, rhythm, Apply and completion
pass, the reviewer's sections 1 to 3, the whole contrasts file) were then read
in full, because the rules that matter most here often avoid the topic's words.

A rule below is "missed" when no quick checks row quotes it, it is not in the
appendix, and no neighbouring ledger quotes it either. Where a neighbour cites
the line but quotes a different sentence, that is said. Line numbers are file
lines at `3de9c956`.

### Likely to matter

1. **`agents/lesson-designer.md` L305, Misconceptions.** The designer's
   one-thing-only rule for any contrast that teaches *or tests* a category. No
   row in any ledger, and it is the designer's own statement of what H07
   (evidence synthesis) and K11 (the diagnostic check) say:
   «**A contrast that teaches a category changes one thing only.** The pair
   exists to isolate the feature children must learn to see, so hold every
   irrelevant feature stable and vary only that one - the same principle the
   diagnostic check uses, applied to teaching.» and «This governs every
   contrast used to teach or test a category, wherever it sits - a
   misconception strategy, a Teach beat's examples, a sorting set, a key
   question.» It carries the kettle and whisk example and «A muddled pair is
   never repaired by better wording». Group H (with H07, H08) or K (with K11).

2. **`agents/design-reviewer.md` L170, section 2.** The reviewer's limit on
   freshness repairs. M26 quotes only the last sentence of this line; the
   sentences before it are the counterweight to the whole fresh-case rule and
   are in no ledger (AK quotes «New evidence with the same taught reasoning is
   legitimate», nothing else):
   «Reaching the same conclusion is also legitimate when children examine each
   case to earn it. Do not make every answer different or strip useful support
   to manufacture independence.» A fold that strengthens the fresh-case rule
   (decisions 2 to 4) without this limit would let the reviewer demand novelty
   for its own sake. Group A (a limit beside A02) or M.

3. **`agents/design-reviewer.md` L187, the first probe.** The probe's own
   limit, on a line the ledger cites (M06, M13) but does not quote:
   «This is a logical check of the task, not a claim to have simulated a
   child, and "this might be too easy" is not a finding without the answer
   written out.» It is what stops the two probes producing vague findings.
   Group M, with M06.

4. **`agents/design-reviewer.md` L189, the second probe.** M07 quotes only
   the question. The rest of the line is in no ledger:
   «Tell genuine ambiguity from a deliberate challenge whose reading the lesson
   has established. An open or interpretive task needs a justified acceptance
   boundary, not an invented single answer, and in a subject involving belief
   or reflection, agreement with a supplied view is never evidence of
   learning.» The last clause is the reviewer's copy of the contrasts file's
   «A supplied view is material to interpret, never a view to agree with.»
   (`task-contrasts.md` L67, also missed, item 7). Group M.

5. **`agents/lesson-designer.md` L416, the read-back.** The "could a child who
   missed the teaching pass it" probe, applied to the lesson's own evidence.
   In no ledger:
   «Then read it a second time from the other end: would the check named after
   `evidenced by` catch a child who lacked what the clause after `because`
   names? When it would not, the sentence describes a lesson that teaches one
   thing and assesses another, and the class can do the second without the
   first.» It carries an RE story (a child «who slept through the Christian
   meaning could write that explanation well»); see section 6. Group M, with
   M03.

6. **`agents/design-reviewer.md` L155, section 1.** The reviewer's copy of the
   final-task test (S03 is the preferences copy). QC cites L155 for S06 and AK
   cites the line, but neither quotes this sentence:
   «A child who missed every Teach and could still produce the final piece well
   from what they brought with them has met a product, and a lesson whose named
   learning nothing later needs is a purposeful design defect, not polish,
   whatever the practice shows about the objective's wording.» Group S (shared
   with the final task, topic 7), beside S03.

7. **`references/task-contrasts.md`, lines with no row.** The reviewer reads
   this file on every run as its calibration. The ledger rows five of the six
   weak-task "Requires" lines (English is missing) and four of the seven
   "Where the simpler task is right" paragraphs (English and RE/PSHE are
   missing; the sequence one is vocabulary's VOC-E43). A test counts all seven.
   - L53, English weak task: «Requires: counting adjectives. `The big green
     forest had tall dark trees` meets it. The sentence may still give the
     place some feeling, but the task never asked the writer to choose words
     for that, so what a child writes cannot show whether they did.» Group M,
     beside M14, M16, M18, M20.
   - L57, English limit: «A short grammar drill (`add a fronted adverbial to
     each of these sentences`) is legitimate practice of a move, and a
     one-sentence example can be the whole task; not every English task
     becomes discussion or a paragraph.» Group M or C.
   - L67, RE and PSHE limit: «When the objective is personal reflection (`what
     does this festival mean to me`), the child's own meaning placed beside the
     taught ones is the intended outcome, and asking for it is right. A
     supplied view is material to interpret, never a view to agree with.»
     Group M.
   - L27, science limit, first sentence (M15 quotes only the second): «A clear
     diagram and a short one-line prediction are enough; do not add a
     paragraph, a table or an extra variable to make it look rigorous.»
   - L25, science stronger task: «A changed condition is the same strength
     when it stays inside the relationship that was taught» and «Adding a
     second cell brings in a second relationship (more cells, a brighter
     bulb), so it is a fair question only once that has been taught as well;
     it is not the same thinking with a new variable.» Shared with assumed
     knowledge; AK has no row for it.
   - L45, maths stronger task: «The same method on fresh numbers in no
     pattern, with the number line drawn and the halfway mark unmarked».
   - L15 and L13 (lines cited for M11 and G28, sentences not quoted): «a
     changed condition checks the same understanding from the other side» and
     «The follow-up ... is where the thinking was meant to be, and it arrives
     as a discussion after a sort that already felt like the work.» The second
     matters to decision 2: it is the file's own reason the orientation sort
     fails.

8. **`references/do-beats.md` L559, Operations, the Test row.** The ledger rows
   five operations' conditions (G16 to G20) plus Retrieve, Repair and Rehearse,
   but not three more:
   - L559 Test: «The result settles the question and is not supplied with its
     conclusion attached.» Group G, beside G17 (the board giving the answer
     away).
   - L557 Change: «Only one thing changes, and what was taught is enough to
     work out the consequence.» Group G or K (it is K11's condition as an
     operation).
   - L562 Compose: «The criteria are the taught quality rather than a count of
     features, and the entry route has been prepared.» Group M, beside the
     English contrast (item 7).

9. **`references/do-beats.md`, summary formats decision 5 does not name.**
   Decision 5 lists six formats that give back what was just taught. Four
   more do the same in drawing or talk, with no limit:
   - L217, §4.1 Quick Sketch: «Pupils draw what was just described. *"Sketch
     the water cycle as I described it. 90 seconds. Stick figures fine."*»
   - L232 to L233, §4.4 Sketchnote: «A small box in which pupils combine icons,
     arrows, and a few words to capture the chunk» and «**Best for:**
     end-of-chunk consolidation when content is conceptual.»
   - L521 to L522, §10.6 Diagram to Words: «Children say or write in one
     sentence what a diagram, arrow or model shows.» and «**Best for:** after a
     modelled diagram». A one-sentence account of the diagram just modelled is
     the restatement D08 describes. See section 4, pair 3.
   - L501, §10.2 Explain One Link: «Where the Teach produced a chain or a
     diagram with arrows, each child explains a single named link rather than
     the whole thing.» No condition that the link was not the one the Teach
     just explained.
   Group D, beside D11 to D16. §10.5 Words to Diagram (L516, «Children turn the
   spoken explanation into a drawing») is the same shape when the Teach already
   showed the diagram; unsure whether it needs the limit.

10. **`agents/lesson-designer.md` L323, the lead of N01.** N01 cites the line
    and quotes two later sentences; the rule itself is not quoted:
    «**Even the dominant misconception has an arc, and the arc has an end.**
    Built on it means exposed, taught, checked once, then retested once at the
    end where the thinking comes together - not re-run at every response
    moment.» and its tell: «more response moments rehearse the corrective
    sentence than perform the action the objective names, so a child asked
    what today was about would answer with the trap, not the LO.» The bold
    lead is the heading a pointer would cite. Group N.

11. **The subject files' "a question a child holding it answers wrongly".**
    The check that surfaces a misconception, written twice and in no ledger:
    - `references/subject-geography.md` L138: «Each misconception you name
      gets a question attached that a child holding it answers *wrongly*,
      because that is the only way it surfaces. "Does everyone understand?"
      catches nothing, and neither does a question the child can get right
      either way. If the misconception is that all deserts are hot, the
      question is which of these four photographs shows a desert, with a cold
      one in the set.»
    - `references/subject-history.md` L233: «attach to each one a question a
      child holding it answers *wrongly*, because that is the only way it
      surfaces. "Does everyone understand?" catches nothing.»
    «a question the child can get right either way» is the quick-check rule
    in its plainest form. Group N (beside N03, N04) or K (beside K07, K10).

12. **`references/subject-history.md` L235.** History's copy of the arc in
    item 10, in no ledger: «A misconception from this list is checked in a
    lesson, not built into its spine. The lesson's centre is what happened;
    the wrong idea is met once, at the point where the knowledge makes it
    visibly wrong (Saturday school is on this one timetable; does that mean
    every child?), and tested once more at the end. Build the whole lesson on
    the correction and every beat rehearses the same sentence, which is the
    methodology lesson again by another door.» Group N. (The same "checked once
    more at the end" sits in step 5 of the Victorian sketch, L27, which the plan
    keeps word for word.)

13. **The source and map leads in history and geography.** E10 quotes the last
    sentence of history L107; the rule and its limit are not quoted anywhere,
    and geography's copy has no row at all:
    - `references/subject-history.md` L107: «**A source used as a comprehension
      text.** A source on the board that children read answers off is a slide
      with facts on it. It becomes evidence the moment a child has to work out
      something the source does not say outright» and the limit «reading a
      source together for what it plainly says is exactly right when that is
      the knowledge being taught.»
    - `references/subject-geography.md` L60: «**A map used as a picture rather
      than a tool.** A map on the board that children read answers off is a
      slide with facts on it.» with the thinking-line test «`what can you see
      on the map?` is reading a picture, and a line a child could answer
      without the map at all (`is it hot in the desert?`) is not geography
      yet» and the limit «a map on the board is exactly right when it is the
      shared reference the class annotates during teaching, or the thing being
      explained.»
    Group E, beside E10. The geography limit matters to decision 1 (map
    label-reading).

14. **`references/teaching-sequence-skill-based.md`, the fresh guided example.**
    J02 to J05 are rowed; the rule that each guided example is itself fresh is
    not, in any ledger:
    - L75: «Keep each example close enough to My Turn to practise the same
      learning and different enough to require application.»
    - L55: «The My Turn and Our Turn each take their own fresh visual, left in
      the configuration required by their selected resource state.»
    Group J.

15. **`references/teaching-sequence-skill-based.md` L43.** A source that
    already sits in the target form leaks the answer, in no ledger:
    «The read-back test: look at the source you are about to hand over and ask
    whether any part of it already sits in the target form. If a child could
    reach the finished script by copying your source and adding punctuation,
    the source has leaked the answer». Group G, beside G14 («a child cannot
    succeed by copying, reformatting...»). The same line quotes the reviewer as
    saying «a task that only reformats the material it hands over»; that phrase
    is no longer in `design-reviewer.md` (stale pointer, found in passing).

16. **`references/templates.md` L1161, the quick-check rail.** The appendix
    files L527 and L903 as layout; the rule on the same component is not
    filed anywhere: «**The rail carries the words a child answers WITH, never
    the answer.** A heading strip, the category names, a criteria line - those
    give a child the language and leave the thinking to them. A worked example
    or a filled-in chart does the thinking, and the check stops checking.» It
    is the other half of I05 (L1142), which vocabulary pinned. Group I or G,
    shared with the slide designers.

17. **`references/preferences.md` L499, Support, Checking and Release.** The
    one sanctioned way a check takes support away, in no ledger: «The one case
    that genuinely takes the support away is a task whose purpose is to check
    what a child can do unaided, and that is a decision made for that task and
    said out loud, not the default state of every independent task. Where it
    applies, remove the support for that task alone and leave it in place for
    the rest of the lesson.» Group K. (It is a "said out loud" rule too, so a
    fold that removes every "name it" phrase under decisions 1 to 4 must not
    catch it: this one names a real change to the task, not a label.)

18. **`references/evidence-synthesis.md` §3 and §6, limits on checks.** No
    ledger has these:
    - L80: «Content, dialogic and task-centred lessons use checks suited to
      their structure rather than a universal My Turn → Our Turn → Your Turn
      gate.» Group K, the limit on K01.
    - L89: «The live teacher decides from the real class response whether to
      proceed, add support, model another case or extend guided practice.»
    - L153: «State the learning action and intended evidence. The live teacher
      chooses how to gather and inspect responses, including hands up, cold
      calling, partner work, writing or another routine.» Beside K03.

19. **`references/evidence-synthesis.md` L107, the rest of D10.** D10 stops at
    the summary clause; the line goes on: «a drawing task needs its contents
    named; imagining suits children with prior knowledge and is the wrong pick
    for beginners (Fiorella & Mayer 2016; Dunlosky et al. 2013). Brief the
    condition alongside the form.» «Brief the condition alongside the form» is
    what decision 5 proposes for the catalogue, already written as a rule; it
    also bears on the drawing formats in item 9.

20. **`references/preferences.md` L208, the sentence after G01's lead.** The
    rows quote the lead and the sentences after this one; this one, which
    carries Daniel's own wish, is quoted in no ledger:
    «Straight after a new idea, a simple placement can be exactly the right
    beat, and it does not need an explanation bolted on to count: the user
    wants children matching and sorting, not explaining after every slide.»
    It is the permission the fresh-case condition limits, and it is what C05
    («do not turn every quick sort into a written explanation») rests on. A
    fold of G01 that keeps only the quoted sentences drops his words. The same
    line's positive example is also unquoted: «The same match over jobs the
    slide did not show (`carried water`, `minded the pigs`) needs the idea
    that a child's work gave the family something it needed.» Group G, with
    G01 and G02.

21. **"Needed is not tidy", in no ledger.** `references/preferences.md` L156
    (What a Lesson Is For) has no row in any of the four ledgers, although G06
    points at it by name for the sort key, and its two copies on cited lines
    are unquoted:
    - `agents/lesson-designer.md` L307, the lead of N03's line: «**A contrast
      isolates a feature; it must not teach that the feature sorts people.**
      One-thing-only is right when the learning is a category, because the
      pair exists to make the feature visible.»
    - `agents/design-reviewer.md` L198: «Check too that the examples used to
      teach a many-meanings or cannot-infer idea include one case that holds
      both; a set where each person sits in exactly one box ... has taught a
      sort in place of the idea, which is a purposeful design defect».
    It is the reason a sort's key must allow a card in both groups (G06 to
    G08). Shared with topic 7 (What a Lesson Is For), but some ledger has to
    hold it.

22. **Retrieval that comes back later.** L01 says the durable version needs
    the knowledge asked for again after a delay; the two instructions that make
    the design do that are unquoted:
    - `references/do-beats.md` L80, the last sentence of L01's paragraph: «So
      use these here for the processing and the read on the class, and let the
      durable version be planned as something that comes back.»
    - `references/evidence-synthesis.md` L193 (L06's line): «Naming what has
      to come back is not the same as inventing a next lesson: the design may
      say which one or two things this lesson leaves behind that a later
      starter should ask for, in the lesson's own words, without claiming when,
      how the class did, or what needs reteaching.»
    Group L.

### Misfiled in the appendix

23. **`references/lesson-designer-components.md` L73.** Filed as "worksheet
    freshness", but it is the only sentence anywhere that says what makes a
    case count as fresh, which A01's «a new picture to place, a new card to
    sort» does not: «For procedural fluency, fresh values can be sufficient
    when executing the procedure is itself the target. For reasoning,
    inference or explanation, a different name, picture or claim earns
    freshness only when children must examine or use its relevant features to
    reach an answer. Conversely, reusing the taught conclusion while ignoring
    the new material is weak evidence of fresh application.» Group A, as the
    condition on A01's examples. Without it, "a new picture" satisfies the
    rule even when the child answers with the Teach's conclusion and never
    looks at the picture.

24. **`references/preferences.md` L679.** S19 cites the line for a different
    sentence and the appendix files L677 as worksheets. This sentence is a
    claim-based permission of exactly the B06/B07 kind decision 4 is about:
    «Reusing a task for consolidation is legitimate when that is its stated
    purpose, rather than claiming it demonstrates unseen transfer.» Unlike B06
    and B07 it is honest (it forbids claiming transfer), so decision 4 should
    either say it stays or ask about it. Group B or C, shared with worksheets.

### Smaller, or shared with a neighbour but in no ledger

25. **`references/do-beats.md` L438, §8.8 Prove Sam Wrong.** «The case has to
    come from what was taught, so the lesson must have supplied it or the idea
    to find it.» Shared with assumed knowledge; no AK row.
26. **`references/do-beats.md` L13, the Reason-with band.** «transfer the idea
    to a situation the lesson never showed them, generate a new example and
    defend it». A20 rows the Work-with band only.
27. **`agents/lesson-designer.md` L512.** The designer's copy of S14's last
    sentence, on a line cited for M04 and M25: «Read teacher scripts alongside
    prompts and support: hiding a reminder does not preserve a diagnostic
    decision if the script supplies it.» and «Check what decision remains
    theirs and whether the evidence supports the conclusion.»
28. **`agents/lesson-designer.md` L385.** «a two-minute check after a Teach
    stays on the board.» Only in the rhythm ledger's appendix.
29. **`agents/worksheet-designer.md` L854 and L831.** The worksheet's own
    answer protection, beside G11 and G29: «**Break predictable patterns.**
    Where the order is yours, shuffle so answers do not climb or alternate.
    The exception is a sequence an upstream designer ordered deliberately to
    make a pattern surface» and «Draw every blank in a stem the same width,
    sized for the longest word that could fill any of them, so a blank's
    length never leaks which word it wants.» Shared with worksheets.
30. **`references/preferences.md` L247 and L254, Cognitive Load Triage on
    Scaffolds.** «The bubbles, lines, or boxes the child fills in to
    demonstrate that doing stay blank.» and «Labelling every tick hands over
    the answer, because the child then reads a printed number instead of
    reasoning about the scale.» (templates L877 says the same for the number
    line helper). Group G, shared with support.
31. **`references/subject-maths.md` L104.** «**Let a child state the pattern;
    don't state it and ask why.** `Explain why the difference stays the same`
    hands over the finding and then asks for a proof.» Beside S12; shared with
    maths sheets.
32. **`references/explanation-tasks.md` L87 and `references/preferences.md`
    L635.** A check answered from a surface cue: «**Do not ask "which is
    better?"** The class answers that correctly from length alone and learns
    nothing.» and «It is never `the strong one is better`, which every class
    answers correctly from length alone». Group H; shared with the launch.
33. **`references/teacher-voice.md` L447.** The exception to S12, in no
    ledger: «The presupposition is legitimate only when the error's existence
    is given and the task is finding, explaining or correcting it - `find the
    mistake in this working` - because there the judgement was never the
    thinking being asked for.» It is the same exception H09 and H14 carry.
34. **`agents/lesson-designer.md` L341 and L343, Apply.** «**The idea on a case
    the lesson never showed**» and «If child finishing Your Turn barely notices
    slide changed, Apply not earning place». The ending's fresh-case rule,
    beside S27; shared with topic 7.
35. **Held test items.** `references/preferences.md` L471: «When the item is
    being held for later assessment, normally keep that exact item out of
    teaching and practice and use a fresh parallel.» and
    `agents/design-reviewer.md` L216: «a named test question is practised at
    the same structure, scale, response form and demand, with fresh content.»
    A fresh-case rule for another purpose; unsure which topic owns it.
36. **Other near copies with no row:** `references/subject-science.md` L53
    («A blind guess is not useful prediction evidence», beside H12, H13);
    `agents/adaptation-designer.md` L190 («A response becomes a sort, a match
    or a stem; it does not become copying»); `agents/lesson-designer.md` L349
    and L121 (the deck's examples must not reuse the teacher's sheet's numbers
    or contexts, fresh cases between deck and sheet); `references/slide-
    composition-playbook.md` L96 (a label that «can leak the classification
    they are meant to decide») and L157 (a board that reprints the sheet's
    questions gets the independent task «answered together»).
37. **`agents/lesson-designer.md` L58, step 3.** The designer's own form of the
    contrasts method, in no ledger: «When the choice of task matters, because
    it is the main work or the evidence for the learning the lesson claims,
    compare a genuine alternative: not two route names, and not "this one is
    more engaging", but the actual explanation and pupil work side by side,
    asking what each requires a child to know and what a response to each
    would show.» Group M, beside M03 and M09.
38. **Limits on cited lines, unquoted.** Each sits on a line a row cites, and
    a fold keeping only the quoted words would drop it:
    - `references/do-beats.md` L558 (G20): «The prediction need not be certain
      (`probably, because...` is a prediction); one with no taught reason
      behind it is a guess.»
    - `references/teaching-sequence-task-centred.md` L27 (K16): «Do not add
      one merely because planning occurs.» The must-not half of K16.
    - `references/lesson-designer-components.md` L79 (S20): «Use a boundary
      case or misconception check when diagnosing that distinction matters; it
      is not a compulsory final question.» and «Do not add a justification to
      every response merely to make practice appear demanding.»
    - `references/subject-history.md` L181 (M27) and `references/subject-
      geography.md` L108 (M28): each row quotes a different half of the same
      two-part rule; history's «an elaborate paragraph or attractive product
      may show little historical understanding» and geography's «Matching,
      locating, labelling or short factual answers may show exactly what the
      objective requires» are unquoted.
    - `agents/design-reviewer.md` L263 and `references/lesson-designer-
      components.md` L61 (S32, S33): the representation giveaways themselves,
      «A record with exactly as many rows as there are solutions tells a child
      when to stop; counters beside a claim that only depict the true one
      settle it; a pre-drawn diagram answers a construction task», and the
      rule that «each has to be a decision you made» and «Say so when it is
      deliberate». See section 4, pair 1.

## 2. Duplicates that are not duplicates

Every row whose kind is plain "duplicate" was read beside the row it is said
to copy, in the file, not only in the quote. Rows already marked
"near-duplicate" or "plus:" are left alone unless their note is wrong. These
carry something the home lacks, or the direction of the copy is backwards.

**Carry an extra condition, limit or strength**

1. **QC-A15 (PSHE) and QC-A14 (RE) are weaker than A01.** A01's condition is a
   case «the Teach did not show». PSHE says «a scenario the Teach did not
   already *settle*» and RE «a practice, person or text the Teach did not
   already *explain*»: both allow the very scenario or practice the Teach
   showed, provided it was not settled or explained. Geography («did not
   already use») and science («changes the case from the one the Teach
   showed») match A01. Either the difference is deliberate (in PSHE a shown
   but unresolved scenario can be the Do) and a fold must keep it, or it is
   drift and belongs in decision 6. Unsure which; it is Daniel's call.

2. **QC-A08 (reviewer L191) is a limit, not a copy.** It sits under «Apply both
   with their limits» and its job is to stop the two probes over-firing on a
   check: «A quick check straight after a Teach may **only establish that the
   class caught a new distinction**». A01 never says what a check may claim.
   Folding A08 into a pointer to A01 would lose the permission that a fresh
   check need not survive the "weak understanding" probe. (Its strength is
   also wrong; see section 3.)

3. **QC-E03 (preferences L204) lacks half of E01.** E03 tests the thinking line
   only against the board: «If the line can be answered by reading the board,
   choose again». E01, E05, E06 and E07 all test it against what the class
   «knew walking in» as well (the guessing half). E03 is the copy in the
   rhythm section, the one the plan proposes as the topic's home area, so a
   fold that keeps E03's wording would drop the guessing test. E03 adds its
   own reason, «because copying is what will be remembered», which the others
   lack.

4. **QC-E11 (reviewer L201) carries a second example and a general rule.** The
   row quotes only the history example. The same sentence goes on: «`what is
   different about these two rattles?` is answered from the picture by a child
   who knows no history; both are the subject's doing (using sources) passing
   for its thinking (what the source shows about the people, and why), and a
   reviewer approved both.» That second example is the "could say it before
   the lesson" half, which E10 (history L107) does not have.

5. **QC-H10 (maths L110) carries a warning about Daniel's own calibration
   sheets.** Besides extending H09 to worksheets, it says «the example sheets
   fail here, with every claim on some sheets wrong». "The example sheets" are
   the Classroom Secrets sheets `subject-maths.md` L91 names as his standard.
   A fold into H09 would lose the one place that says where the standard is
   not to be copied.

6. **QC-H03 (do-beats §3.7 L200) adds «tied to a specific misunderstanding».**
   H01 (the designer) asks only that the wrong option be tempting and
   calibrates by year group; the diagnostic mapping is H06's and H11's. H03 is
   a near-duplicate of H01 plus H06, not a copy of H01, and H01 lacks the
   mapping condition.

7. **QC-N02 (reviewer L199) carries its own severity and method.** Beyond N01
   it says «count the response moments, beats and worksheet prompts alike»
   and «A lesson most of whose response moments rehearse the correction has
   narrowed its objective to the sticking point, which is a purposeful design
   defect, not polish». The classification decides what the reviewer does
   with the finding; N01 has no equivalent.

8. **QC-D08 (reviewer L204) carries a test and a repair limit D01 lacks.** The
   row calls it a duplicate "with its repair list". It also carries the
   reading method, «ask what a child had to work out that the Teach did not
   already say», the warning that a restatement «passes every check that only
   asks whether the response matched the teaching», and the constraint «The
   repair is local and keeps the chunk». These are reviewer instructions with
   no home copy.

9. **QC-K12 (science L29) adds a test K11 lacks.** «If a child can answer
   without using the relationship taught, the check is evidence of noticing
   rather than understanding.» K11 names the method (hold irrelevant features
   stable) but not this test or the noticing/understanding distinction.

10. **QC-M26 (reviewer L170) adds «explicitly».** M25 says «Teaching and
    supported rehearsal may deliberately give a conclusion»; M26 says «An
    **explicitly** supported rehearsal may supply a decision». The reviewer's
    permission needs the support to be declared; the designer's does not say
    so. Small, but it is a condition. The same line holds the unquoted limit
    in section 1, item 2.

11. **QC-A09 (reviewer L204) is the limit on D08's repair.** «A restatement is
    never preserved as a check» follows «The repair is local and keeps the
    chunk»: it tells the reviewer the one thing the local repair may not do
    (keep the restatement by calling it a check). As a pointer to A01 that
    link is lost.

12. **QC-D03 (content route L51) widens D01's scope.** «**Most Teach beats in a
    content lesson** explain a cause, a mechanism or a relationship» makes the
    explanation case the default in content lessons; D01 says only that it is
    the chunk «most often answered with a written summary».

**Direction of the copy is backwards**

13. **QC-G13 (do-beats §5.8 L303) is the general rule; G12 (history L201) is
    the subject copy.** 5.8 covers «events, stages of a process, steps of a
    practice» and is best for science, geography, RE and PSHE as well as
    history, and it adds «then keep the true order in the answer». Folding G13
    into G12 as the ledger marks it would leave the cross-subject rule living
    in the history file.

14. **QC-N04 (reviewer L198) is broader than N03.** Its first clause is general,
    for any lesson's centre: «The retest asks the question the wrong rule
    answers wrongly». N03 is scoped to «a many-meanings or cannot-infer
    lesson». N04 is the rule and N03 the case.

**True copies whose quotes miss half**

15. **QC-M27 (history L181) and QC-M28 (geography L108)** each quote a
    different half of the same two-part rule (section 1, item 38). They are
    true copies of each other, but neither quote is the whole rule.

16. **QC-A16 (do-beats L3) lacks A03's permission.** A03 begins «Let the
    activity take the time its thinking genuinely needs»; A16 has only the
    "treat it as main practice" half. As a pointer that is fine; as the kept
    copy it would lose the permission.

The rest of the plain duplicates checked (A11, A12, A13, E05, E06, E07, E08,
F06, G03, G05, G08, H08, H11, H13, K02, K08, K17, L10, M04, M12, M13) are true
copies for this topic's purpose; where they sit on a line that also holds an
unquoted rule, that rule is in section 1.

## 3. Strength and scope

About 110 rows were read against their files for strength and for whether
"when it applies" carries every exception the text gives. These are wrong or
incomplete:

1. **QC-A07.** «When it applies: a check next to a disagreement beat» is
   narrower than the text, whose first clause is general: «A quick check
   straight after teaching is a legitimate beat, and not every Do must
   stretch, when children use what was just taught on a case the Teach did not
   show». It only sits in Misconceptions. Its strength "must" also hides the
   permission «not every Do must stretch» (may).

2. **QC-A08.** Marked "check". It is a limit on the probes (the reviewer must
   not reject a fresh quick check for only establishing a distinction), so
   "may (limit)", with a must-not for picking the sentence just said.

3. **QC-B03.** Marked "may". Its first clause is a must-not the reviewer
   obeys every run: «Do not reject any of these because the information is
   supplied or the task is straightforward; judge what the task claims to
   accomplish». Decision 2 removes only the orientation clause, so the kept
   half is stronger than the row suggests.

4. **QC-C05.** "When it applies: a sort after teaching" leaves out the
   condition in the sentence before it on the same line (TD quotes it): «Add a
   short justification when the reason behind a placement is part of the
   intended learning or when it will distinguish understanding from guessing.»
   And «do not turn every quick sort into a written explanation» is a
   must-not, not a may.

5. **QC-J08.** Marked "must", but the text says «the Your Turn **usually**
   sorts by different properties»: default.

6. **QC-M02.** No strength. «The contrast is never "sorting bad, explaining
   good". A sort can be the stronger task and a sentence the weaker one.» is a
   must-not ("never") that a test pins.

7. **QC-K01 (and K02, K08).** "default". The text is an imperative inside a
   condition: «Design a worthwhile check before independent practice of a new
   procedure when its result can genuinely inform whether the class is
   ready.» That is must-when, not "normally". Unsure: Daniel may read "when
   its result can genuinely inform" as leaving it optional, in which case
   default is right.

8. **QC-K16.** "must", but the "when it applies" misses its must-not, «Do not
   add one merely because planning occurs», and the permission that planning
   and doing «may continue as one flowing task» (task-centred L27).

9. **QC-K19.** "When it applies: §9.6 thumbs" misses the entry's other
   condition, «**Teacher-owned response routine:** do not select this unless
   the teacher explicitly requests it» (L475). The row reads as if thumbs may
   be added freely beside a Do.

10. **QC-D07.** "check". The last sentence is an instruction, «When the Teach
    has stated the reason, ask for it applied to a case the Teach did not cover
    (a different practice, a different person), or move to 10.4 or 10.9»:
    must, and it is the fresh-case rule's own form for because stems.

11. **QC-G29.** "When it applies" lists one exception (the revealed feature is
    the teaching target); the text gives two more: state an error exists
    «only when locating/explaining/correcting known error is task», and «Keep
    related instances together when relationship/pattern/contrast is
    learning».

12. **QC-F07.** "may". Its last sentence is a must-not outside the one lesson
    type: «elsewhere the caution is the one question step 5 of the sketch
    asks, not a beat of its own.»

13. **QC-A10.** "must". The row mixes a conditional permission («the right
    choice when you genuinely need to know the class caught something before
    you build on it, on items the Teach did not show») with a must-not
    («matching the slide's own words back to it is finding them»). Both halves
    should be visible, because decision 4 turns on exactly this pairing.

14. **QC-G01.** "When it applies" omits the permission on the same line
    (section 1, item 20): a simple placement «does not need an explanation
    bolted on to count».

15. **QC-E01, "Code names".** «null refused where every child acts» is not
    what the validator does. `NO_PUPIL_ACTION_KINDS` lets every `prepare` unit
    write `thinking: null`, and `prepare` includes the modes `bounded-attempt`
    and `pattern-investigation`, where every child acts. See section 5.

Checked and right as written (strength and scope): A01, A02, A03, A05, A06,
A17, A18, B01, B02, B04, B05, B06, B07, C01, C03, C04, C07, C08, C09, C10,
D01, D02, D04, D06, D10, D11 to D18, E03 (strength), E06, E10, F01 to F05,
G04, G06, G09, G11, G12, G15 to G22, G24, G25, H01, H02, H04, H05, H07,
H09, H12, H14, I01 to I07, J01 to J07, J09, K05, K09, K11, K13 to K15, K17,
K18, K20, L01 to L12, M01, M03 to M33, N01 to N04, P06.

## 4. Disagreements

The eight decisions each describe a real pull in the text, with the
qualifications below. Then the pairs the ledger did not raise, most
important first.

### Qualifications to the ledger's own decisions

- **Decision 4 applies wrongly to C06.** C06 is the claim table's first row:
  reading or pointing at an answer the board marks «orients the class or checks
  a detail was noticed. It is not independent inference.» It limits what such
  a task may *claim*; it does not license it as a quick check of learning.
  "On a case the Teach did not show" cannot be added to a row about an answer
  the board already marks. C06 and C02 are also the rhythm ledger's rows
  (TD-G07 and TD-F12), so a change to either is a cross-topic decision.
- **Decision 4 would also make C03 unworkable for facts** (pair 2 below).
- **Decision 5 names two conditions and chooses one silently.** The research
  condition already in the catalogue's source is D10's «a summary works when
  summarising has been taught and collapses into copying otherwise», and
  `evidence-synthesis.md` L107 ends «Brief the condition alongside the form».
  The decision proposes a different limit («never straight after the Teach it
  summarises»). Daniel should see both. It also misses four formats of the same
  shape (section 1, item 9).
- **Decision 3's "always a new picture" meets a code-backed exception.** See
  pair 4.
- **Decision 6 cannot turn the reviewer's copies into bare pointers.** The
  routing card opens the rhythm section only «when a Do beat's expected answer
  is a summary, headline, recap or restatement of the explanation its own
  Teach just gave» (`design-review-packet.py` L114). An option bank, sort or
  label that restates the Teach never trips it, so the reviewer's own copies
  (A08, A09, G05, E08) are its only reach to the fresh-case rule for those
  formats. Either they keep their words or the trigger widens.
- **Decisions 6 here and 1 in the rhythm ledger both place a home inside the
  same preferences section.** The fresh-case paragraph (A01) sits in the middle
  of the rhythm ledger's PREF-RHY material (the `These name the thinking`
  paragraph at L204). The two folds need to be planned together.

### Pairs the ledger missed

1. **The "say so" rules that are not the excuse.** Decisions 1 to 4 remove
   «named as a check», «named as one», «and the design says so», «fine when
   recall is the claim» and «when the design says that is its job». At least
   six other rules also tell the designer to say what a beat is for, and they
   are honest-claim rules, not excuses:
   - `preferences.md` L499: a check of unaided work removes support, «a
     decision made for that task and said out loud»;
   - `preferences.md` L627: «**Decide, and say, which the good instance is: a
     parallel case children transfer from, or a model of this very case that
     they rehearse.**»;
   - `lesson-designer-components.md` L61: «Say so when it is deliberate:
     nobody downstream is allowed to add or remove it»;
   - `design-reviewer.md` L263: «both must be marked as deliberate here»;
   - `preferences.md` L679: reuse «is legitimate when that is its stated
     purpose, rather than claiming it demonstrates unseen transfer»;
   - M25, «describe their purpose honestly», and M26, «An explicitly supported
     rehearsal may supply a decision without claiming to assess it».
   The line between them: an honest "say so" changes what the beat claims or
   what is done to the task; the excuse lets a label stand in for the fresh
   case. A fold under decisions 1 to 4 that deletes "say so" wording by search
   would hit these. Worth one sentence in the decision.

2. **The fresh-case rule against immediate recall of a fact, both Daniel's
   rulings of 14 September.** A01: «Choosing, completing or repeating the
   sentence the slide or the teacher has just said is finding it, not checking
   it: ... the teacher learns only who was listening». L01 (do-beats L80),
   about a recall beat thirty seconds after the answer: «it makes every child
   produce the thing rather than hear it, and it tells the teacher who has it.
   That is worth the minute.» `preferences.md` L196 (TD's row) says a fact,
   name or definition «needs surfacing: recall it, match it, sort by it», and
   C03 says «A short recall response may secure new knowledge». A fact has no
   "case the Teach did not show", so decision 4's condition added to C03 would
   forbid what L01 and L196 recommend. The difference may be whether the words
   are still on the board (L03, Retrieve: «The answer is not visible»), but no
   text says so. This is the pull under decision 4 and it is unraised.

3. **§10's own formats against D08.** D01 lists «turn the words into a diagram
   or the diagram back into words» as a use of an explanation, and §10.6
   Diagram to Words is «Best for: after a modelled diagram»: «Children say or
   write in one sentence what a diagram, arrow or model shows.» D08 says «a
   summary, headline or one-sentence recap of the explanation just given is a
   restatement». A one-sentence account of the diagram just modelled is both.
   §10.2 Explain One Link has the same shape (explain the link the Teach just
   drew). Unraised.

4. **Decision 3 (label a new picture) against the world-map write-on form and
   delayed retrieval.** `stick-in-sheets-pedagogy.md` L110: «The stick-in
   builder always forces the write-on world form, even if a labelled teaching
   map was copied from the slide, so the child's map stays a genuine retrieval
   task.» `templates.md` L2276 makes that write-on world map «the only form the
   stick-in pack prints». There is no "new picture" of the world, so decision 3
   needs its limit: a blank of the same map is the check where the thing is
   unique. `subject-geography.md` L128 (appendix) also endorses «A photograph
   children annotated in an earlier lesson, brought back for four labels from
   memory». That is delayed, which makes it retrieval rather than the last
   slide again. Decision 3 should say it governs a label check straight after
   the Teach, not a later one.

5. **The orientation sort against "orientation needs no manufactured Do".**
   `preferences.md` L188 (TD): orientation «does not require a manufactured Do
   activity or a full extra teaching cycle», and `design-reviewer.md` L200
   (TD): «keep only the orientation needed to enter the example ... and remove
   a manufactured Do». B01, B03 and B04 call the good/bad sort a fine
   orientation («a two-minute orientation», «a brief orientation»). The rhythm
   rules point the same way as decision 2, which
   strengthens it; the ledger does not cite them.

6. **PSHE and RE's weaker fresh-case condition against A01.** «a scenario the
   Teach did not already settle» and «a practice, person or text the Teach did
   not already explain» against «something the Teach did not show» (section 2,
   item 1).

7. **H10 against Daniel's calibration sheets.** The maths file names the
   Classroom Secrets sheets as the standard (L91) and then says «the example
   sheets fail here, with every claim on some sheets wrong» (L110). Not a
   contradiction to repair, but the only exception to a calibration example in
   this topic; the plan keeps his calibrations exactly, so it needs saying
   which wins.

## 5. Code and tests

Read: `scripts/validate-lesson-design.py` (the ordering check, the `thinking`
check, the skill cycle check, the answer and task-structure contracts),
`scripts/design-review-packet.py` (the routing card, the always-read list,
`build_do_beside_teach`), the reviewer sample-case fixture, and every
`assertIn` / `assertNotIn` literal in `scripts/tests`, matched by script
against the lines the ledger cites.

**Stated wrongly**

1. **"Every beat where children act has a `thinking` line" is not what the
   validator enforces** (the ledger's "What the code enforces today", and
   E01's code note «null refused where every child acts»). `thinking: null`
   is allowed for every kind in `NO_PUPIL_ACTION_KINDS` = `prepare`,
   `my-turn`, `grounding-input`, `stimulus`, `set-task`
   (`validate-lesson-design.py` L285 to L291, used at L2147). A `prepare`
   unit's `mode` may be `bounded-attempt` or `pattern-investigation` (L1691 to
   L1705), both beats where every child acts, so a bounded attempt, the very
   beat J09 says must keep its answer «the child's to find», can go to review
   with no thinking line. The log's 4.2.123 entry (L2338) describes the rule
   the same way. Code gap, relevant to group E and J09.

2. **The ordering check refuses reverse order too.** `check_not_printed_in_answer_order`
   (L740 to L761) refuses a list that is ascending *or* descending by date,
   whatever order the task asks for. The ledger's «may not print them in
   answer order» is right in effect, but the check is "not already sorted
   either way", and it only reads the items the script can date: undated items
   among them are ignored, so three datable items in order among undated ones
   are still refused. Small, but a fold that moves G12's words («The design
   validator refuses a datable list printed in answer order») should keep them
   true.

3. **The review view's count misses the Teach's takeaway.** Decision 7 is right
   that `build_do_beside_teach` (`design-review-packet.py` L1444 to L1507) sees
   only a `do` after a Teach and prints «(none written)» for a structured sort.
   Two more limits it does not state: the count of «words the Teach already
   said» reads the Teach's `headline`, `explanation`, `teachingText`,
   `keyQuestions`, script and answer, but not its `takeaway` (the line the class
   keeps, often a sticky fact), which is the likeliest sentence for a Do to say
   back; and `teach-why` and `teach-needed` are in `TEACH_KINDS` but can never
   be followed by a `do`, because `do` exists only in the content route
   (`ROUTE_KINDS`, validator L186 to L195). So the view is content-route only
   by construction, not by choice.

4. **"Tests already pin a sentence in 87 rows" is right by row but not by
   phrase.** A test pins a phrase on the line of each row listed, but in many
   rows the pinned phrase is not inside the row's quote, so the list does not
   show what a fold must keep. Pinned, on a line a quick-checks row cites, and
   quoted in no quick-checks row:
   - `agents/design-reviewer.md` L189 «agreement with a supplied view is never
     evidence of learning» (M07's line; section 1, item 4);
   - `agents/lesson-designer.md` L323 «Even the dominant misconception has an
     arc, and the arc has an end.», «exposed, taught, checked once, then
     retested once at the end», «beats, practise, Apply and worksheet prompts
     alike» and «would answer with the trap, not the LO» (N01's line; section
     1, item 10);
   - `agents/design-reviewer.md` L199 «the retesting of that centre has an
     end», «count the response moments, beats and worksheet prompts alike» and
     «has narrowed its objective to the sticking point» (N02; section 2, item
     7);
   - `agents/design-reviewer.md` L201 «a reviewer approved both» and «each
     beat's `thinking` line is the thought the beat actually produces» (E08,
     E11; section 2, item 4);
   - `agents/lesson-designer.md` L307 and `agents/design-reviewer.md` L198
     «Needed is not tidy», «A contrast isolates a feature; it must not teach
     that the feature sorts people», «one case holds both» and «has taught a
     sort in place of the idea» (a whole test file,
     `test_needed_is_not_tidy.py`; section 1, item 21);
   - `references/preferences.md` L210 «choose a cleaner card» and «record the
     second placement as accepted, with its reason» (G06's repairs, pinned by
     `test_a_sort_key_can_accept_a_second_home.py`);
   - `references/task-contrasts.md` L5 «never asked to match an example's
     names, order or materials» (M01's line);
   - `references/task-contrasts.md` L15 and `references/subject-history.md`
     L135 «does not make food and a bed worthless» (M11, M12 lines);
   - `references/evidence-synthesis.md` L193 «Naming what has to come back is
     not the same as inventing a next lesson» (section 1, item 22), L115 «This
     holds in content lessons as much as in maths» (L08), L154 «This is not a
     response routine and does not become one» (K09);
   - `references/teaching-sequence-skill-based.md` L9 «A bounded attempt only
     works while the answer is still the child's to find.» (J09), L215 «A
     bridging cycle on small numbers earns two questions, not none» and
     «blocked-then-mixed» (J01), L235 «The limit is when the inverse
     relationship is itself the teaching point» and «The same trap catches any
     reversible move» (J05);
   - `references/subject-history.md` L107 «a source beat's `thinking` line
     names the thing the source does not say outright» (E10; section 1, item
     13), `references/subject-pshe.md` L26 «a PSHE beat's `thinking` line names
     the taught reason or boundary» (M29);
   - `agents/lesson-designer.md` L253 «Write each beat's `thinking` before you
     choose its activity», L257 «a kind can be right and the thought still be
     copying», L60 «`One Completion Pass, Then Done` runs this on the finished
     contract»; `references/output-template.md` L446 «`thinking` is one short
     line naming the thought every child has to have»;
   - `references/preferences.md` L158 «Every subject has a doing that passes for
     thinking» (E05's line), L679 «Protect the learning before seeking fresh
     work» (S19's line).
   Also: D03 is not unpinned as the ledger says. The content route's test pins
   «do-beats.md` §10», which is inside D03's quote, and the list name on the
   same line, not only the paragraph order
   (`test_an_explanation_gets_used_not_restated.py` L180 to L186).

5. **The reviewer sample cases (P08 to P10) carry no force.** The fixture is
   read by two tests, and both check only that case ids exist
   (`test_the_task_is_chosen_from_what_it_requires.py` L147 to L157,
   `test_design_review_packet.py` L58 to L94). No agent, script or eval reads
   the case text. So the stale wording decisions 2 to 4 would change reaches
   nobody; changing it is record-keeping, and the ids must survive.

**Omitted**

6. **Routing card names the ledger does not list.** `PREFERENCE_REVIEW_ROUTES`
   (`design-review-packet.py` L90 onwards) routes the reviewer to
   `Cognitive Load Triage on Scaffolds` «when a scaffold may reveal the
   answer» and to `Slide Philosophy` «when a Do beat is a question to the room».
   The first is the section holding the scaffold giveaway rules in section 1,
   item 30; its heading is a code-read name. And the rhythm section's trigger
   fires only on a restated *explanation*, never on a sort, match or option bank
   that restates (section 4, qualification on decision 6).

7. **Two maintainer comments are stale.** The always-read list's comment calls
   the contrasts file «Six short contrasts» (`design-review-packet.py` L257);
   there are seven, and a test counts seven. And
   `teaching-sequence-skill-based.md` L43 quotes the reviewer as saying «a task
   that only reformats the material it hands over», which is no longer in
   `design-reviewer.md` (section 1, item 15).

8. **What the code does not enforce, beyond the ledger's list:** nothing checks
   that a Teach's sort key allows a second placement (the `acceptanceCondition`
   comment at validator L1097 is guidance only); nothing forces `teacher-only`
   delivery on an exact-answer Do (the validator forces it only on some My Turn
   states and on worksheet answers, L2383 and L2461 onward); and nothing reads
   a check's expected answer against its own slide's visible text (only the
   Teach before it, in the view).

## 6. Stories

The build log (`references/build-review-log.md`, 4,350 lines) was searched
case-insensitively by script for each story's words and for other words of
the same incident. (A note for whoever repeats this: in this Git Bash, `grep
-F -i` on the log returns nothing even for words that are there; `grep -i` or
Python works.)

**The ledger's "No" is wrong, or probably wrong:**

1. **QC-D07 (`his birth shows God's love for people`).** In the log in other
   words, L2348, the Year 4 RE Christmas lesson: «"Why read the birth story?"
   asked for a because the previous slide had already stated in almost the
   same words.» Same lesson, same fault; the catalogue's quote is the slide's
   own wording.

2. **QC-E02 (`My walk matters because...` under a bubble).** Probably in the
   log, L2336, as the same Year 4 RE design: «The same operation sat under
   "Help Zara explain": her speech supplied the reason, the stem asked for it
   after "because", and the residue of that minute was nothing about meaning.»
   L2338 adds that `preferences.md` → What a Lesson Is For «carries the three
   questions in his order with the Zara case worked both ways», which is where
   the walk example now sits. Unsure it is the identical beat (the log never
   says "walk"), so copying the walk sentence to the log before it leaves is
   still the safe course.

3. **QC-S07 (the Viking launch model, Sigurd).** The ledger says "No under that
   name". The substance is at L977: «the Viking defect was never the model, it
   was claiming the writing as each child's own after answering its question a
   minute earlier». Only the name Sigurd is missing.

**The ledger's "Yes" points at the wrong line:**

4. **QC-H04 ("fine, but can be cheap").** The ledger gives L1201. Daniel's
   exact words are at L1233: «True or false are fine, but can be cheap.» L1201
   is the thumbs ruling («Thumbs up if is a bit better. But I think it's kind
   of a weak do beat... Same with true or false.»), which is right for K19.

5. **QC-A01 ("the teacher's ruling, 14 September 2026").** The 4.2.205 ruling
   in the log (L1213) is narrower than A01's wording: «(3) A quick match, sort
   or label straight after teaching is a real Do beat when its cards are cases
   the Teach did not show». A01's «a new example to judge, a new situation to
   predict» is 4.2.283's widening (L4328), which cites the same ruling. Not
   wrong, but the ruling as Daniel gave it is about matches, sorts and labels;
   worth saying if the date leaves the rule.

**Confirmed as the ledger says:** E04 (L2336), G26 and G27 (L1135, with the
approved wording and headings at L1137), G07 (L1137), S18 (L2105), P05
(L4319 and L4331), P07 (L3348), K19 (L1201). M30 and S13 (the PSHE check whose
answer, breathing, lived only in the script) are not in the log: the
«breathing» hit at L2057 is a different PSHE story (`When you rest, it all
settles down again`).

**Stories on quick-checks lines the ledger does not list at all:**

- `agents/lesson-designer.md` L416, the RE read-back «a child who slept through
  the Christian meaning could write that explanation well»: in the log, L2348.
- `agents/design-reviewer.md` L201, the rattles and «before sixteen» lines «and
  a reviewer approved both»: in the log, L2306.
- `agents/lesson-designer.md` L253 (E01's line), «28 saved designs in a row had
  written `null` there»: in the log, L1255 («28 of 28 saved Teach beats had
  written null»).
- `references/preferences.md` L210 (G06's line), the `Hard working conditions`
  / `A reason families still chose it` headings «the teacher who wrote the
  lesson could not tell the groups apart»: in the log, L1187.
- `agents/lesson-designer.md` L385, the three whiteboard sorts on the carpet
  (15 September 2026): in the log, L1135.
- `references/teaching-sequence-skill-based.md` L215 (J01's line), the Year 4
  rounding lesson that modelled 43 and 45 and practised once at the end: in
  the log (L927 and later).
- `references/task-contrasts.md` L75, «which in the case this came from was
  also unverified»: in the log, L1125 (the guild rule).
- `agents/lesson-designer.md` L323 (N01), the catchphrase `say we'd need to see
  the whole week again`: not in the log. Unsure whether it is a real lesson or
  an invented example.
- `scripts/tests/test_an_explanation_gets_used_not_restated.py`, a docstring:
  «a reviewer used that on 22 September 2026 to pass a steam option bank»: in
  the log (L4322). A test, not an instruction file, so no action; noted
  because the plan's pins will sit beside it.
