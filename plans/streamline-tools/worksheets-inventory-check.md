# Independent check of the worksheets ledger

Checked against the plugin working tree on the night of 23 September 2026:
lesson-v4 4.2.287 (`79426973`) with the uncommitted success-criteria change
(4.2.288) on top, the snapshot the ledger was built on. Read-only: nothing in
the plugin or the ledger was changed. Scratch scripts are in
`plans\streamline-tools\scratch\wschk\` (`coverage.py`, `verify_quotes.py`,
`verify2.py`, `inledger.py`, and the helpers' `code_*` and `dup_*` files). Every
quote in this report was checked word for word against the working tree by
`verify_quotes.py` and `verify2.py` (179 quotes, all found). The success-criteria
repairs may move a few worksheet lines after this was written; the words are what
was checked.

**How the search was done.** `coverage.py` split every instruction file in
`agents\`, `references\` (with `worksheet-helpers\` and `examples\`, not the build
log), `skills\` and `commands\` into sentences, kept every sentence touching the
topic by a broad word list (worksheet, sheet, printed, paper, books, slips,
Expected, Below, Greater Depth, answer key, `responseForm`, fit priority,
independent practice or work, adaptation, frame, resource, optional, pencil and
others), and marked a sentence covered when a ledger quote from a row citing that
file covered most of it: 3,111 topic sentences were uncovered and 52 partly
covered. The reading was split four ways: the core worksheet files read whole
(preferences Worksheets, Support Checking and Release and Classroom Norms; the
lesson designer's Worksheet section, minutes paragraph and completion pass; the
components file's Generated worksheet; output-template Worksheet; books-or-sheet;
subject-maths L28 to L160; the reviewer's §5; the worksheet designer and its
focused repair; `worksheet-helpers.md`, `shared.md`, `maths.md`, `science.md`,
the visual profile); the adaptation designer and adaptive-adaptation whole, the
playbook, both skills and both commands; every other agent and reference by its
uncovered hits read in their paragraphs; and the code, tests and build log. Each
of the 86 rows marked duplicate or near-duplicate was read against the whole
paragraph its quote comes from.

---

## 1. Missed rules

No row and no appendix entry unless said otherwise. Ordered by how much a fold
would lose.

### Likely to matter

1. **Leaving a representation off a printed page has three named reasons, and
   "the board shows it" is not one of them.** Group I; bears on decision 1.
   - `references\preferences.md` L503: «Representations remain consistent
     wherever they are used, but they do not have to be printed or displayed
     everywhere. There are three reasons to leave one out, and the designer names
     which one applies: the real object is there instead, constructing the
     representation is itself the learning, or the printed version would hand over
     the answer.»
   - This is the general rule that I09 (the manipulative on the desk) and D11 (the
     child builds it) are cases of. I03 and I04 add a fourth reason, on the board
     or wall. Decision 1 is about exactly that fourth reason and quotes neither the
     rule that names only three nor the duty to name which one applies.

2. **The one exception to "independent work is not working with nothing".**
   Group I (it limits I02) and D.
   - `references\preferences.md` L509: «The one case that genuinely takes the
     support away is a task whose purpose is to check what a child can do unaided,
     and that is a decision made for that task and said out loud, not the default
     state of every independent task. Where it applies, remove the support for
     that task alone and leave it in place for the rest of the lesson.»
   - Without it, I02 reads as having no exception. A sheet is where an unaided
     check most often lives.

3. **The 45-minute clock already places independent work inside the lesson.**
   Group A; decision 3.
   - `references\preferences.md` L126: «**Time: a lesson runs about 45 minutes end
     to end; when children are expected to work independently afterwards, the
     taught input is about 30.**»
   - Same file L128: «When independent work follows, the roughly 30-minute taught
     section means the teacher-guided lesson sequence, including modelling,
     questions, guided attempts and short child-processing activities, not
     continuous teacher talk.»
   - `agents\lesson-designer.md` L247, the sentence A19's excerpt skips: «The
     lesson runs about 45 minutes end to end, and the beats may take 40 of them
     between them; the rest is books out, the date and objective, and moving
     children to tables and back.»
   - Decision 3 lists five places and none of these. Its suggestion (an
     extra-practice sheet sits outside the 45 minutes) meets L126 head on unless
     the sheet is not "independent work" in L126's sense. Unsure which he means;
     that is the question to put to him.

4. **A third side to decision 5: the brief-gap protocol says flag and continue,
   and the worksheet designer is told to follow it.** Group P.
   - `agents\worksheet-designer.md` L207: «leave unread until the brief asks for a
     shape no helper route can honestly deliver; then read and follow it.»
   - `references\brief-gap-protocol.md` L11: «If the exact need still cannot be
     produced in the current run, render every faithful part that can stand
     without changing the lesson, flag the exact remaining gap in the artefact's
     `notes` field, and continue the package wherever possible.» L76:
     «**Continue.** Do not stall, do not refuse to produce output, do not request
     a re-run.»
   - The Slide Designer is exempted by name (L17: «The generic continue-and-note
     route below does not govern Slide Designer.»); the worksheet designer is
     not. This sits against P05 and P19 ("omit the affected sheet").
   - Same file L13, for decision 8: «no prose description of a visual standing in
     for a picture the artefact cannot draw».
   - P28 cites this file only for L51 and L70.

5. **The orchestrator does not treat a note as closing a gap.** Group P, shared
   with topic 10; decision 5.
   - `skills\make-lesson\playbook-lite.md` L1222: «Missing support or a wrong
     answer remains a content gap when recorded in notes; a note naming another
     owner does not resolve it.» L1228: «an unresolved material gap remains a
     blocking fault in the final report.»
   - Decision 5 says "A note ships the sheet with the doubt in the report". For
     missing support or a wrong answer, the playbook says otherwise.

6. **What counts as blocking on a printed page.** Group O or P; decision 5.
   - `references\worksheet-visual-profile.md` L219: «A clipped zone, a missing
     source or a response with nowhere to go is blocking. A page that is merely
     plainer than hoped is not: keep the last valid version, say precisely what
     could not be improved, and never buy the improvement by cutting work,
     shrinking a response below a usable size, or invoking a fit-priority removal
     that the tightness was not actually forcing.»
   - It is the nearest thing the plugin has to decision 5's proposed line between
     "stops" and "a note", and it adds a limit that O14, O24 and P23 lack: a
     fit-priority removal only when the tightness forces it.

7. **What the books-or-sheet line must say is written three times and quoted
   nowhere.** Group K.
   - `references\books-or-sheet.md` L45: «For `"sheet"`, name the question that
     needs the page and what the child does to it - `"Q4: the child labels the
     printed photograph"`, `"Q2: the child plots the reading on the printed
     grid"`. For `"books"`, say what makes every question answerable from a shared
     copy»
   - Copies: `agents\worksheet-designer.md` L633 («For `"sheet"`, name the
     question that needs the printed page and what the child does to it»),
     `references\worksheet-helpers.md` L147 («for `"sheet"`, the question that
     needs the printed page and what the child does to it»).
   - K06, K12 and K13 quote the duty to have a line and its "report, not a
     defence" limit, never what the line contains. The code checks only that it
     exists (`RECORDING_REASON_MISSING`), so this sentence is the only thing
     making the line a decision rather than a default.

8. **What makes a sheet `"sheet"`.** Group K.
   - `references\books-or-sheet.md` L37: «What makes a sheet `"sheet"` is a
     printed thing the child cannot reproduce - a photograph, a map, a grid, a
     scale where exact placement is the point - or a copying cost that would
     swallow the lesson.»
   - K05 quotes the sentences either side of it. This is the positive definition,
     and its second limb (the copying cost) is the reason K10 exists. The worksheet
     designer's copy (L641 to L645) has no row either.

9. **The diagram anchor can withdraw a blank callout from a finished sheet.**
   Groups P and O.
   - `agents\diagram-anchor.md` L48: «A blank callout is a question, and a question
     the picture cannot answer is fairly withdrawn.» L72: «A blank write-on line
     stays a blank write-on line; a printed answer stays printed.»
   - It runs over `worksheet.json` after the worksheet designer. The appendix files
     L48 under pictures; L46 and L72 have no entry. It is told to record every drop
     for the teacher (L46), so P09's "nothing leaves without a line" holds in
     spirit, but P09 and P37 do not govern this step. Unsure whether the answer
     key keeps an entry for a withdrawn label (M02, M11).

10. **Greater Depth's home rules in the adaptation designer have no rows.**
    Group L.
    - `agents\adaptation-designer.md` L311 (rule 1): «**Greater Depth stays on the
      class objective and within year-group content.** Greater Depth means working
      more deeply with today's content, not accelerating into later curriculum
      content. Every generated Greater Depth item must remain answerable through
      the class objective and the knowledge or methods taught for it.» Copies in
      `adaptive-adaptation.md` L133 and L232. Neither L08 nor L28 carries
      "answerable through ... the knowledge or methods taught for it".
    - L275: «Do not create depth through:» (next-year content, extra quantity
      alone, longer reading, novelty alone, automatic scaffold withdrawal). Copy in
      `adaptive-adaptation.md` L145.
    - L269: «A new context or representation is one possible depth move, not
      automatic depth.»
    - L64: «The defining difference is authentic subject demand, not larger
      numbers or extra quantity alone.»
    - L286: «One rich prompt may be enough; another lesson may need several
      concise prompts. There is no fixed one-to-three quota.» Only maths has a row
      for this (G03, L28).
    - L20's excerpt of rule 5 (L319) drops: «Use stronger relationships,
      generalisation, comparison, justification, evaluation, representation
      choice, systematic search, richer constraints or another objective-specific
      subject demand. Keep support when it enables that thinking without supplying
      the answer.»

11. **Support on Below and Greater Depth has no row at its home, and L06 points
    at the wrong rows.** Groups L and D. L06 says it copies "L12, D11"; L12 is
    the dignity rule.
    - `agents\adaptation-designer.md` L273: «Support does not disappear merely
      because the resource is Greater Depth.» and «Remove support only when
      consulting it would perform the thinking being assessed.» (J11 quotes only
      the sentence between them, and files it under success criteria.)
    - L212: «Make the support decision explicitly. There is a light preference
      towards retaining useful visual or structural support, but do not repeat it
      on every question by reflex.»
    - `references\adaptive-adaptation.md` L166: «There is a light preference
      towards retaining useful visual or structural support on Below work so the
      sheet does not drift into a long run of plain-text questions.» and L172:
      «Using the Below resource does not by itself require a pre-drawn
      representation.» (Both inside appendix range L154 to L220.)
    - `agents\adaptation-designer.md` L218, inside appendix range L216 to L243:
      «There is no rule that Below must be more illustrated or that Greater Depth
      must lose its support.»

12. **The adaptation records given, blank and constructed parts, "and what the
    reviewer checks".** Groups L and N; inside appendix range L216 to L243.
    - `agents\adaptation-designer.md` L220: «Record, for every part of the
      resource, which parts are given, which stay blank and which the child
      constructs, and which support is kept, changed or removed with the reason.
      That is what the worksheet designer realises and what the reviewer checks»
    - The adaptation's side of D04 and D06. It answers the ledger's "who decides a
      Below frame's hints" (found in passing): the adaptation records them. "What
      the reviewer checks" contradicts Q10 (heading 4).

13. **The Tier 2 climb and the Tier 3 reach decide what prints, and in what
    order.** Group L, shared with topic 9. All inside appendix range L83 to L160,
    which says it kept "the rows about what the Below and Greater Depth sheets are
    for"; only the final item has rows (L18, L19, L31, P18).
    - `agents\adaptation-designer.md` L126: «**Reasoning sits at a scale the child
      already owns, not at the top of the climb.**»
    - L130: «So an ordinary Tier 2 maths sheet runs: a practice run that climbs,
      reasoning at a secure scale, and one class-sized question at the end.»
    - L138: «A third case settles itself: a final item the child could not attempt
      even with the help that will really be beside them.»
    - L140: «The relationship is never optional; the ladder is one way of carrying
      it, not the only way.»
    - L142: «What is never a reason: a climb is fiddly to write, or a sheet looks
      more impressive ending on a big number.»
    - L156: «**Point it at the class lesson.** One final item reaches towards what
      the class did, even one the child will need help with, shown beside the
      prerequisite it grew from.»
    - L158: «The connection is still required; only the printed item is
      conditional.» (pinned by a test, heading 5)
    - If these fold away, L18 and L19 survive without the limit on when the final
      item is printed.

14. **Decision 8 has more voices than the ledger lists.** Group P.
    - `agents\adaptation-designer.md` L245: «A required picture must have a
      corresponding photo request. Do not write a text-only fallback that changes
      the task.» L520 (inside the pictures appendix entry): «Do not write a
      text-only substitute for a task whose required picture is load-bearing.»
    - `references\adaptive-adaptation.md` L190: «Do not ignore that risk, silently
      remove a required picture or replace a picture-led task with plain text.»
    - `agents\worksheet-designer-focused-repair.md` L25, two paragraphs above the
      permission P23 quotes: «Do not change a required representation or
      photograph into a different access route.»
    - `skills\make-lesson\playbook-lite.md` L1365, an unlisted copy of the repair
      route: «A picture that never published at all is the different fault the
      tracks reconcile before they build, where the resource owner re-points that
      one reference and keeps the learning it was serving.»

15. **Maths prefers the child producing the maths.** Group G; decision 9.
    - `references\subject-maths.md` L118: «On repeatable number work, prefer the
      form where the child produces the maths over the form where they complete
      it.» It is the lead-in above G18's «Do not make generation the default.»,
      so maths prefers producing and declines only a default of generated values.
      Decision 9 presents maths as simply against a default.
    - Two more voices: `references\reasoning-prompts.md` L30: «Do not assume
      generation is automatically deep.»; `references\evidence-synthesis.md` L101:
      «Judge the thinking children actually do rather than treating a
      generative-looking activity as automatically deeper.»

16. **The lesson designer's visual set and "never make the designer guess what is
    expendable".** Groups O and N.
    - `agents\lesson-designer.md` L353: «**Smallest coherent visual set learning
      requires.** No universal max.» and «Name job of every visual, relationship
      requiring set stay together, size/write-on use protected, fit priority.
      Don't require designer to remove required visual, flatten task or guess
      expendable.»
    - The appendix sweeps only L351 (the picture budget). This is the lesson
      designer's side of P36's «Do not decide which required question, activity,
      support or visual is expendable».

17. **Worksheet designer rules 5 and 6 have no rows.** Groups F and P.
    - `agents\worksheet-designer.md` L834: «5. **Use a helper when one exists.**
      Never plain text where a helper renders the thing properly, and never a
      fraction written flat as "3/4" in question text: that is a different
      notation from the one the child is being taught to read.» A teaching rule
      (the sheet uses the notation the child is taught) that meets the verbatim
      rule; P16's «Verbatim governs the words, never the typography.» is what
      lets the two stand together, so a fold needs both.
    - L838: «6. **Helpers compose, and a name hints at a typical use rather than an
      exclusive one.**» and L840: «Before flagging a gap, list every helper that
      produces the visual ingredient you need and try building it with `row` and
      `stack`.» This is the first rung of rule 9's ladder and the "compose first"
      that P25, P26 and P28 summarise. Decision 6 quotes the summaries, not this.

18. **A frame, stimulus set or generator is never turned into a question list.**
    Group C.
    - `agents\worksheet-designer.md` L469: «For `frame`, `stimulus-set` and
      `child-generated`, honour that structured shape directly; do not convert it
      into a question list.»
    - Inside appendix range L290 to L540 (step 3's zone rules), swept as page
      mechanics. It is the worksheet designer's copy of C06 extended to all three
      shapes; C07 covers frames only.

19. **A reference on an earlier slide is not available during independent
    work.** Group I; decision 1.
    - `references\slide-composition-playbook.md` L194: «A reference on a previous
      slide is not accessible during independent work unless another usable copy
      is actually available.»
    - It answers I04's «the child demonstrably meets it elsewhere in this lesson»
      directly, and it is the support decision 1's suggestion needs.

### Worth adding

- `agents\worksheet-designer.md` L205: «Do not substitute
  `references/subject-[name].md` - those are the lesson-designer's pedagogy
  files, and the pedagogy is already settled by the time it reaches you.» Group
  P: the designer is kept away from the pedagogy it might re-decide.
- `agents\design-reviewer.md` L130: the voice sweep covers «every script,
  explanation, definition, question, task instruction, success criterion, sticky
  fact, model answer and worksheet string it prints - and put each through
  `teacher-voice.md` → Final pre-flight check». Group Q; R11 names only the code
  side.
- `agents\lesson-designer.md` L556: «- Read the relevant preference section
  before deciding the starter, vocabulary, sticky knowledge, success criteria,
  Apply or Reflect, reasoning, support and release, source use or worksheet.»
  Group A: the loading rule for PREF-WS, which A10 has for the components file.
- `references\preferences.md` L166: «Where a method has distinct cases, each case
  a child meets alone that changes the procedure is one they have seen worked,
  because a case modelled nowhere but met in independent practice is met cold»
  and «never by writing the missing idea into the answer key.» Groups D and M,
  shared with the rhythm and assumed knowledge. The sheet is independent practice
  and carries an answer key.
- `references\evidence-synthesis.md` L105 (group M): «Provide an answer, model,
  success criteria or another suitable comparison standard where the outcome is
  definite or exemplifiable. Do not prescribe whether the teacher live-marks,
  self-marks or examines work later.» L111 (group D): «Straightforward recall
  remains useful but should not be the only thinking children do with the
  content.»
- `references\reasoning-prompts.md` L23 (group M): «Children work systematically
  and explain completeness; the answer resource supplies the complete set and a
  suitable systematic route.» L8 and L10 (group L): «Below may use an appropriate
  reasoning shape for its selected objective, with the pupil-facing wording,
  support and reading demand pitched accessibly.» and «Extending the catalogue to
  Below does not weaken the whole-class worthwhile-reasoning expectation above.»
- Styling must not give the answer away. `references\worksheet-helpers\shared.md`
  L146: «each case gets the same treatment as the others: matched, so nothing
  about the styling hints which is which, and separate, so a child working case by
  case finds their case at a glance.» The same principle for particular helpers:
  `worksheet-helpers\maths.md` L227 («the child decides whether the claim is true,
  and the sheet must not tint, tick or total its way to the answer first.»,
  inside the swept "helper notes") and `templates.md` L1620 («Leave it off on a
  task slide where finding the part *is* the question, and off any write-on form,
  where a printed ring hands the child the answer.», which names no worksheet
  though the worksheet chart and line take `highlight`). Group O, beside O31 and
  D06.
- What a Below sheet leaves to the child. `shared.md` L128 (C12's paragraph, which
  C12 drops): «Scaffold the child's own choice of subject rather than replacing
  it: the starter finishes a sentence about the thing THEY picked.» With
  `adaptive-adaptation.md` L204: «Remove the access barrier while preserving
  meaningful pupil choice and ownership.», `adaptation-designer.md` L357: «If the
  class task gives pupils meaningful choice, preserve that ownership unless the
  available evidence makes a bounded choice necessary.», and
  `adaptive-adaptation.md` L230: «**Support becomes proxy completion.** Design
  work the pupil can own and complete through appropriate access support rather
  than having an adult perform or scribe the task.» Group L.
- `agents\adaptation-designer.md` L54: «Where one is needed, design it from the
  supplied worksheet's actual task architecture as well as the class LO and
  representations.» Groups A and L; A03 says only that adaptation is not ruled
  out.
- `agents\adaptation-designer.md` L196: «where a prompt quotes a person making a
  claim, name the drawn person with a speech bubble as the visual requirement».
  The drawn speaker is requested upstream, which settles the ledger's O30 and P38
  note (found in passing). Copy in `adaptive-adaptation.md` L178.
- `agents\adaptation-designer.md` L355: «And after one read of the question
  alone, could they say which numbers or which part of the picture to look at,
  and what to write?» The one-read test for Below and Greater Depth in every
  subject; G17 is maths only.
- `agents\adaptation-designer.md` L206, the tell E20 drops: «so a Below sheet
  that names the dial in its support decision and then writes ruled lines under
  every question has not turned it.» L190, the part of L22's paragraph it drops:
  «And it still asks the historical, geographical or scientific question the
  class was asked.» None of the dial table rows (Reading, Abstraction, Getting the
  answer down, Amount) has a row; only Holding the steps does (J16).
- `references\teaching-sequence-skill-based.md` L83: «Do not force three to six
  printed questions, a fixed easy-to-hard staircase or a harder final item.»
  Group D, beside G01's "Three to six ... is often enough" and P17's "up to six".
- `references\subject-science.md` L79: «Keep the expected result and failure
  guidance out of child-facing material when children are genuinely meant to find
  the result themselves.» `references\subject-history.md` L165: «Keep source,
  caption and question clearly associated, with placement chosen by the resource
  designer». Groups S and O.
- `references\worksheet-helpers\shared.md` L185: «Keep it concise, but preserve
  the steps children need to understand the task. A second necessary instruction
  is better than a compressed sentence that hides what to do.» Group F; F24 quotes
  the sentences either side. It reads beside decision 10 (steps on a sheet) and
  F16 (one entry line).
- `references\worksheet-helpers\shared.md` L77: «Do not read this as a form to
  fill in. Use the helpers the catalogue actually has, and where the honest answer
  is a page of text and ruled lines - a comprehension, an extended piece of
  writing - that is the right design and not a shortcut.» Group E; decision 13.
- `references\worksheet-helpers\maths.md` L99: «keep the chart on the Below sheet
  when removing it would remove access rather than fade a scaffold.» Inside the
  swept "helper notes", but it hands the worksheet designer a Below support call
  (heading 4).
- `references\worksheet-helpers\maths.md` L255, the limit G21 drops: «But that is
  the shape of a common sheet, not a shape to impose.» (followed by «A single
  investigation is a whole sheet.»).
- `references\worksheet-helpers.md` L259: «How many is an authored decision: a
  record with exactly as many rows as there are answers tells a child when to
  stop, which is sometimes the design and sometimes a giveaway.» An unlisted copy
  of G23 and D06 that does not say whose decision it is. L84: «`notes` | optional,
  top level only. A note written inside a sheet is dropped without a word; only
  top-level notes reach the builder's `Note:` lines and the teacher.» (P08's
  mechanics; decision 5 depends on notes arriving.)
- `references\worksheet-helpers\catalogue.md` (generated, change it in
  `build-catalogue.js`): L25 «Never write a number or a `startAt` yourself: a
  hand-numbered sheet is the failure the counting was built to end.» (H); L2376
  «Rare as plain working room, because children have books.» (I10, I11); L167
  «The mode-of-work heading a block sits under: Fluency, Practise, Apply.», a
  fourth wording of the section labels beside G27's "found in passing".
- `references\context-pictures.md` L867: «Worksheets keep CURRENT's P2 helper
  rules. P3 may sit only in the page-level collection and never enters a zone or
  pupil workspace.» Group O.
- `skills\make-lesson\playbook-lite.md` L900: «If adaptation fails
  deterministically, preserve the expected worksheet route and report adaptation
  omitted.» Group L, shared with topic 10 (inside the Track B range).
- `references\worksheet-helpers\shared.md` L406, inside the swept photograph
  range: «Never trim to make two objects match, to remove a maker's mark, a label,
  damage, or anything the questions touch: that is editing the evidence». A
  teaching limit sitting inside page mechanics.
- Unsure: `references\preferences.md` L479, «normally keep that exact item out of
  teaching and practice and use a fresh parallel.» The appendix sweeps "Practising
  a Test Question" (L477 to L487) as voice, but it decides what a sheet of
  practice may carry and sits beside F04 (a sheet may carry a test's exact form).
- Unsure: `skills\make-subject-file\SKILL.md` L219: «Read the draft and remove
  anything about pace, slide design, modelling, worksheets, his voice, or how much
  fits in a lesson.» Bears on decision 12, which proposes the maths file as a
  home for maths sheet rules.

### Copies the ledger does not list

A fold that finds only the listed copies would leave these behind.

- Verbatim: P37's two sentences also stand in
  `stick-in-sheets-designer-focused-repair.md` L57 and L63 and
  `working-wall-designer-focused-repair.md` L63 and L69; O19's «There is no general
  two-page flag, and `SHEET_DOES_NOT_FIT` never earns one.» also stands in
  `worksheet-helpers.md` L240.
- `worksheet-helpers.md` L215 to L219 and L236 to L238: O19's "decided and marked
  `Eligible` upstream; copy, never compose, the visual and reason", with no row.
- `agents\worksheet-designer.md` L151 to L155: a copy of O09 («Which of those you
  use is latitude. What is not is the top-left corner»). L27 to L29: a copy of L29.
  L623 to L646: copies of K02's reason, K06's content rule and K05.
- `agents\worksheet-designer-focused-repair.md` L25: a copy of P03 and P04 inside
  the repair.
- `agents\adaptation-designer.md` L241 (O04: «The worksheet designer must not
  decide which learning is expendable, which is exactly why the ordering is decided
  here.»), L233 (O02: «Do not use the exception for ordinary overflow.»), L208
  (O22: «A word bank is written under `Support` and remains a visibly separate
  labelled block.»), L317 (L03, L08: «Do not force the same bar model, key words,
  theme or surface representation merely to make the resources look shared.»),
  L284 and L286 (J12), L114 (L10's Tier 1 copy), L154 (L04's home).
- `references\adaptive-adaptation.md` L150, J12's own paragraph: «Do not bolt on
  extra work merely because a capable pupil may finish.» L194 and L196 (L24:
  «Below does not automatically contain more items than Expected.», «One rich
  task may replace separate practice and reasoning sections when it genuinely
  provides sufficient rehearsal, worthwhile thinking and usable evidence.»), L137
  (L10), L218 (L04).
- Below wording, F22's family: `adaptation-designer.md` L192 («Treat the sheet
  cautiously as a low-reading-load resource unless the brief gives a clear reason
  not to.») and L49; `adaptive-adaptation.md` L176, L182, L198.

---

## 2. Duplicates that are not duplicates

All 86 rows marked duplicate or near-duplicate were read in their whole
paragraphs. Only the ones that differ are listed.

### Likely to matter

1. **F14 is not a duplicate of F10 and F11.** `agents\lesson-designer.md` L363
   carries three wording rules for every task that the ledger quotes nowhere:
   «Chaining every demand into one line of matched imperatives» (with its
   example) «is complete and still fails», and «Don't swing to generic either
   (`Study each photograph. Decide, then justify.`): vague is not the repair for
   wordy. When demands genuinely stack, structure carries them - a taskStructure,
   a frame, consecutive units - not the sentence.» It also carries a worked
   category example. Folded into F10, all of it goes.

2. **O20 carries an ordering rule that pulls against O09, and four habits O06,
   O07 and O10 lack.** `agents\worksheet-designer.md`:
   - L116: «The pointer line of rule 12 is for a reference that genuinely serves
     several questions, and that reference sits earlier in reading order than the
     first question using it.» Against O09's «A word bank, a reminder or a worked
     reference ... sit later in the scan than the work does» (heading 4).
   - L114: «When it will not fit beside its question, that is a fit problem with a
     fit answer (another layout, or the fit-priority route), not a licence to
     exile the support.»
   - L130: «The test is whether a child answering question 2 has to cross the page
     to see what question 2 is about.»
   - L136: «Reading order still protects genuinely sequential material: a claim a
     question judges or a stem it completes stays ahead of its question.»

3. **P16 has a second exception the ledger does not record, so decision 6 counts
   three narrow exceptions where there are four.** `agents\worksheet-designer.md`
   L762: «A depth prompt opening with a bold pedagogical type (`**Compare two
   methods**:`, `**Reverse / working backwards**:`) loses the label and keeps
   everything after it verbatim.» Its limit is missing too, L775: «The boundary is
   the whole first line.» P02 and P24, marked copies of P16, carry neither.

4. **O19 is not a plain copy of O02.** `agents\worksheet-designer.md` L584 and
   L607 add who holds the decision (the upstream `Eligible` mark) and that the
   designer never writes its justification: «Do not write a new justification
   here: this object records a decision that was already made, and inventing
   wording for it would be making the decision instead of carrying it.» O02 has
   neither.

5. **C07 is not a duplicate of C06, and it pulls against C12.** C07 (L889): «the
   worksheet IS that frame across all pupil sheets». C12 (`shared.md` L118): «It
   is not a rule: the adaptation designer may settle on a different surface for a
   variant when constructing the structure is itself the learning, or when a
   recording barrier is what stands in a child's way». C06 says neither.

6. **G18's row and decision 9 miss the maths file's own lead-in** (heading 1,
   item 15), and the row's "the four moves duplicate D10 and D11" misses
   maths-only words in the support move, L134: «Fading is an important available
   pattern, not a compulsory sequence.» D10's «no double removal from Below» is not
   in the maths move either.

7. **L06 points at the wrong home** (heading 1, item 11).

8. **L10 is not a duplicate of L01.** `agents\adaptation-designer.md` L249 and
   L251 carry the test for leaving Greater Depth alone and a duty to explain:
   «Inspect the Expected task first.» and «... write `Resource decision: Use
   Expected unchanged` and explain why.» L01 states neither.

9. **M08 and G15 each carry what the other lacks.** M08 applies to Greater Depth
   in every subject and carries «test the full acceptance condition with boundary
   cases and a counterexample, not just the model example: a necessary condition
   may not be sufficient for the question's "exactly" or "always" claim.» G15 is
   maths only and keeps a fallback M08 lacks: «and add one short condition line
   only when that fails.»

10. **Three reviewer rows marked "duplicate as a check" carry their own rules.**
    `agents\design-reviewer.md`:
    - Q12 (L263) adds a correctness check D06 lacks: «Are the supplied values, the
      missing parts, the source identities, the compared cases and the zero or
      scale conventions right?»
    - Q11 (L262) adds: «Judge each `responseFormReason` as a claim - does this
      question's evidence really need words, or would a mark on the visual show the
      same thinking sooner».
    - Q10 (L261) adds «read the forms rather than confirming the objective
      matches».

11. **N03 drops the limit its copies carry.** `references\output-template.md`
    L846 says «Use `[]` when nothing may be removed.» with no condition; O17 and
    O04 limit it to a set that already fits. The row says N03 carries O17's
    exception and does not flag that it lacks this limit.

12. **S02 reads against S01.** S02 (`lesson-designer.md` L347): «A write-on figure
    the child could not rule by hand is a stick-in moment, not a worksheet». S01
    (`preferences.md` L699): «The same useful figure and task may also appear on
    that worksheet as a printed alternative, under the worksheet-use judgement
    above.» S02 lacks the permission and can be read as forbidding it.

13. **The home row H12 is looser than its copies.** H12
    (`lesson-designer-components.md` L69): «Several parts may share one main
    question when use one decision rule, one central stimulus or one dependent
    answer route.» H14 (`adaptation-designer.md` L210): «Sharing a stimulus or
    context is not sufficient when the pupil begins a separate decision or answer
    route.» H10 and H15 agree with H14. A fold into H12's wording keeps "one
    central stimulus" as grounds for grouping. Unsure whether that is intended.

### Worth fixing

- H05 (`lesson-designer.md` L373) is not a copy of H01 or H02: its rule is the
  author's "write every question as a plain sentence", closer to H06, and it
  covers slides as well as sheets.
- O16 (`worksheet-visual-profile.md` L17) adds «This is not a demand for
  decoration, a number of diagrams per sheet, a different helper on every
  question, or less writing everywhere.» O15 has only "no diagram quota"; the
  "different helper on every question" part bears on decision 13.
- K12 carries a reading trigger the proposed pointer must keep,
  `worksheet-designer.md` L627: «Read `[PLUGIN_ROOT]/references/books-or-sheet.md`
  at this step, the first time in a run:». Unsure: L644 «so a number line a Year 4
  child could rule for themselves is read from, not worked on» uses "read from"
  differently from K11's «a number line whose value they read off».
- P33 (`worksheet-builder.md` L65) is not a copy of P32: it adds the other branch,
  «No terminal receipt, or one that published: the file should be there, so a
  focused one-filename picture repair runs for that photo, not the designer.»
- J03 adds an exception J01 lacks: «A one-line job statement for a reference
  under rule 12 is not a criteria panel.»
- A05 (`preferences.md` L701) adds a permission its note omits: «Where a deeper
  application, different task or further practice would genuinely improve the
  lesson, the lesson designer may include it.»
- P17 (`worksheet-designer.md` L846) applies «A flat list commonly has up to six
  standalone questions» to every subject; G01's three to six is maths only.
- O24 (`worksheet-designer.md` L733) is filed against the wrong row: it copies
  the fit route (P36) and usable response space (E14), not O14.
- O17 prices every sheet without condition and so drops O05's «A short sheet whose
  whole protected set is one frame and three responses does not need pricing at
  all.»; its «Drop something else, or protect it and price the rest.» stands where
  I03 lists the redesign moves.
- E18 (`shared.md` L373) adds a ceiling: «Three separate photographs is the
  ceiling even numbered», and list-form uses at L355.
- C08 adds «so does any lesson whose adaptation step was skipped».
- A14 (playbook L855) is weaker than A08's "adaptation still run": «run
  Adaptation Designer when available».
- F21 is Below only and adds «an abstraction like `its main match` asks the child
  to decode the instruction as well as do it»; folding it into F03 would widen it
  to every sheet.
- B04 adds «Several purposes can coexist when the sequence earns them.»
- L28 (`subject-maths.md` L154) adds «Use harder in-year numbers, missing values,
  exchanges, less familiar cases or controlled variation only when the
  class-taught method still applies.» and a duty to preserve the practice
  architecture when it carries an invariant.

### "Copies:" lists that do not match

- A01 lists A16, which copies A04 (its own row says so).
- F10 lists F14, which is much broader (item 1).
- F15 lists H16. They differ both ways: H16 is the "one ask over its own answer
  space" rule, with a limit F15 lacks («`Is Sam correct? Explain your answer.` is
  two sentences and one response»); F15 carries «let Support carry a hint a child
  can use ... not the acceptance criteria restated», which H16 lacks.
- S01 lists S02, which reads against it (item 12).
- H01 lists H06, G01 lists G02, B08 lists B09 and J01 lists J04: each is a
  different rule, not a copy.
- K02 lists R15, the page-only wording code, not the paper reason.
- O09 lists only O21 and the slide copy; `worksheet-designer.md` L151 to L155 is a
  third copy.

---

## 3. Strength and scope

About sixty rows were spot-checked against their paragraphs. These have a fault.

**Strength wrong or missing**

- **S10**: "must (code: the validator refuses a datable list in order)". The
  answer-order check (`validate-lesson-design.py` L740) is called only for a slide
  option bank and a starter's bullet list (L2273, L2283). It never reads worksheet
  blocks, so on a sheet this is guidance only (P18).
- **G07**: strength and code-name columns are blank. The row holds a rule («What
  the grading prevents is a sheet that stops measuring the lesson.»), not only a
  story.
- **O19**: "must (code)". The engine checks that a two-page sheet has two pages and
  a non-empty visual and reason; nothing ties it to the upstream `Eligible` mark.
  The eligibility itself is guidance.
- **J03**: "must (code)". The code refuses the `steps` panel and an instruction of
  three lines or more; "nothing on the page reprints the criteria" in any other
  form is not enforced.
- **K06**: "must (code: the preflight refuses a missing reason)". True of the line
  existing; what it must say (heading 1, item 7) is unenforced and unquoted.

**A condition, exception or duty the row's excerpt drops**

- **I04**: "may, only when all three hold" is right, but the paragraph pairs the
  permission with a duty the row does not quote, `worksheet-designer.md` L559:
  «Record it in a top-level `notes` entry - the channel that reaches the teacher -
  naming the reference, where the child still meets it, and that the page would
  not otherwise fit.» That duty is what decision 1's suggestion would lean on.
- **I01**: its paragraph ends with the limit on dropping, `preferences.md` L507:
  «Do not repair a mismatch by removing needed support or inventing new demands to
  fit it.»
- **I02**: its only exception sits in the next paragraph (heading 1, item 2).
- **P15**: "One voice per task" lets restatements go unprinted; its boundary is
  dropped, `worksheet-designer.md` L419: «The boundary: `support` that tells a
  child what to do when stuck is worth printing - small, and beside the thing it
  supports, not as another line in the instruction stack.» This partly answers the
  ledger's "nothing says who decides a string is only a restatement".
- **P07**: the excerpt keeps the reason and drops the instruction,
  `worksheet-designer.md` L187: «That is the one thing you must not do, and it
  would arrive looking like your own work. Do not spawn subagents to read a
  reference, build a sheet, or check a sheet you wrote.»
- **O06**: the latitude is dropped, `preferences.md` L733: «The run flows so the
  next number is easy to find: usually straight down a column, because (2)
  directly under (1) is the easiest find there is, though a long question filling
  one side with the next beside it reads perfectly well.»
- **O09**: what does go after the work is dropped, L745: «A reminder of a method
  they have already used and a prompt to check their work pass that test, because
  they improve or check an answer that already exists, and those are what "after"
  was written for.»
- **O11**: "default", and the middle sentence is dropped: «Colour is for
  navigation and support, not decoration.» (L749), a firmer rule than the rest of
  the row.
- **O08**: kind "maintainer", proposed home LOG. Its paragraph ends in a live rule,
  `preferences.md` L739: «A panel every question works from is a stimulus, and it
  goes above its questions in their own column.» Sending the row to the log takes
  the rule with it.
- **E13**: the positive instruction is dropped, `lesson-designer-components.md`
  L65: «Say what the answer is (`an explanation`, `a labelled list`, `a name and
  one sentence`) and size the space for a real answer written in a child's hand.»
- **D07**: a check is dropped, L79: «Check that success provides evidence of the
  intended learning rather than a wording cue or familiar common-sense answer.»
  (and «Protect the representation and the work children need to do.»).
- **G12**: the row quotes the heading and the reason but not the seven endings
  themselves (L97: «`Is she correct? Explain your answer.`, `Who is correct?
  Explain your answer.`, ...»). The list is his Classroom Secrets calibration; a
  fold that rewrote it would not trip the quote check.
- **G14**: the list of where Greater Depth's demand comes from is dropped, L106:
  «harder in-year numbers, numbers written in words, a boundary case, more clues,
  more possibilities to find, a claim that is only sometimes true, less picture
  support.»
- **M02**: drops the rule for `answer.kind: none`, `worksheet-designer.md` L692:
  «`answer.kind: none` supplies no answer content: when such a task carries a
  printed number its entry states what a correct response must show and what to
  accept, and when it has no printed number it takes no entry.»
- **P36**: step 5 drops «Reaching this step means every move above was genuinely
  unavailable, and it stops the worksheets rather than thinning them, so say
  plainly in the gap what you tried and what the page is short by.» (L577), which
  is decision 5's "stop" in the designer's own words.
- **K05**: drops the positive definition (heading 1, item 8).
- **L22**, **E20**, **L20**, **S07**, **D15**, **J12**: each drops a sentence in
  its own paragraph (heading 1 and heading 2 give the words; D15's is
  `evidence-synthesis.md` L106 «Free recall may still be chosen deliberately when
  children have enough secure knowledge and open retrieval is the intended
  action.», S07's is `subject-history.md` L156 «and only when the lesson has more
  than one time to hold apart (two dated sources from inside one period do not
  need a timeline, they need their dates in their captions)»).

**"When it applies" too narrow**

- **B01**: given as "a sheet asking for much the same performance as the slide
  Practise". Its first half applies to every sheet: choose the relationship to
  slide practice and «Record this intended use in the existing worksheet planning
  fields».
- **E01**: "every question, part and prompt on a generated sheet" should carry
  E11's exception: a `frame` or `child-generated` block carries no
  `responseForm`.

**Wrong cross-references**

- **F05** and **F24** cite "R15" for the engine's refusal of an instruction of
  three lines or more. R15 is the books-or-sheet wording list; the refusal is
  R13.

---

## 4. Disagreements

### Voices the decisions miss

- **Decision 1 (which sheets may lean on the board).** Missing: the three named
  reasons for leaving a representation off, none of which is "the board shows it"
  (`preferences.md` L503); `slide-composition-playbook.md` L194 (a reference on an
  earlier slide is not accessible), which supports the suggestion; I04's own duty
  to name where the child still meets a dropped reference; and `subject-maths.md`
  L35, pinned by a test: «The teacher decides live grouping, carpet work, response
  surfaces, pace and when different children move on.» The suggestion's first
  sentence ("Every sheet is used in the lesson, with the board and the wall in the
  room") also meets his 4.2.157 ruling in the log (L1965): in his maths lessons the
  sheet is what children do at their tables straight after the teaching, but «He
  was explicit that this must not enter the plugin as his routine ("i just didn't
  want 'Daniel does X so do Y'")». The limb that matters (leave a reference off
  only when it is on the board or wall while they work) can stand without writing
  the routine in.
- **Decision 3 (the sheet and the 45 minutes).** Missing: `preferences.md` L126 and
  L128 (independent work already inside the 45, after about 30 taught);
  `lesson-designer.md` L247 (the beats may take 40); and the code, which refuses
  only above 50 minutes and skips the check when any beat has no minutes
  (heading 5).
- **Decision 5 (a note or stop the sheet).** Missing: the brief-gap protocol (flag
  and continue, which the worksheet designer is told to follow; heading 1 item 4);
  the playbook's "a note does not resolve a content gap" (item 5); the visual
  profile's line between blocking and plainer-than-hoped (item 6); P36's own "it
  stops the worksheets rather than thinning them"; and the log's 4.2.162 entry
  (L1753), which says the worksheet designer «realises the named form and returns a
  gap rather than substituting», siding with E07.
- **Decision 6 (ask it plainer).** There are four narrow exceptions, not three
  (heading 2 item 3), and P15 lets the designer leave upstream strings unprinted.
  Rule 6 (compose first) is the rule the three summaries paraphrase (heading 1 item
  17).
- **Decision 8 (a picture that never arrives).** Missing: adaptation designer L245
  and L520, adaptive-adaptation L190, brief-gap L13, the focused repair's own L25
  (all against a text fallback); the log's 2 September review (L2882): «The
  picture-repair roles may re-point a dead reference at a published picture, never
  replace it with a sentence saying what it showed.», which is where P23's limit
  comes from and is stricter than P23's "in words" route; and the scope checker,
  which likely refuses the "in words" route anyway (heading 5).
- **Decision 9 (generation by default).** Maths is not simply against it: its
  lead-in prefers the child producing the maths (heading 1 item 15).
  Reasoning-prompts L30 and evidence-synthesis L101 are further voices on the
  "not a default" side.
- **Decision 10 (a method's steps on a sheet).** Missing: `worksheet-helpers\maths.md`
  L61, «The board draws the same frame, so the child meets one picture in both
  places.» (a method frame is meant to be on the board and the sheet); the engine
  test that requires `method-frame` to stay (heading 5); J03's own exception for a
  reference's one-line job statement; and `shared.md` L185 («preserve the steps
  children need to understand the task»). Unsure: `explanation-tasks.md` L58 gives
  a fixed fade for sentence stems («a complete frame → a choice of starters → a
  prompt only ... → nothing»), against D10's «No fixed fully→partly→blank
  pattern».
- **Decision 13 (how varied a sheet's questions look).** Both sides have more
  voices. Against a quota: O16 («a different helper on every question»),
  `reasoning-prompts.md` L16 («There is no default character format and no
  requirement to vary formats for its own sake.»), `worksheet-designer.md` L396
  («work that repeats takes the same shape each time, and the shape changes only
  when the task does.», inside the swept range L290 to L540), and
  `worksheet-helpers\maths.md` L260 («**Fluency** wants the same helper repeated,
  so the child settles into a rhythm and the page stops being something to
  decode.»). For variation: `evidence-synthesis.md` L117 («Pages of identical
  questions with no variation» plateau learning) and `teaching-sequence-skill-based.md`
  L102 («Order the set by variation theory»). The suggestion holds, but the
  decision should show both.

### Two suggestions that pull against each other

- **Decisions 1 and 3.** Decision 1 suggests "Every sheet is used in the lesson,
  with the board and the wall in the room." Decision 3 suggests an extra-practice
  sheet sits outside the 45 minutes, "for anyone who finishes, or for another
  session". A sheet done in another session does not have this lesson's board up,
  so a reference dropped on decision 1's terms is not there. The two should be
  asked together, or decision 1's condition narrowed to "while they work on it".

### Pairs the decisions do not raise

1. **O20 against O09.** A reference serving several questions sits earlier in
   reading order than the first question using it (O20, `worksheet-designer.md`
   L116); a worked reference sits later in the scan than the work (O09,
   `preferences.md` L741). A worked example serving questions 1 and 2 goes first
   under one and after under the other.
2. **C07 against C12.** "The worksheet IS that frame across all pupil sheets"
   against "It is not a rule: the adaptation designer may settle on a different
   surface for a variant".
3. **S02 against S01.** "A stick-in moment, not a worksheet" against "may also
   appear on that worksheet as a printed alternative".
4. **H12 against H10, H14 and H15.** One central stimulus is grounds for grouping
   parts in the home row and explicitly not in its three copies.
5. **The adaptation designer against the reviewer.** `adaptation-designer.md` L220
   says its support record is "what the reviewer checks"; Q10 tells the reviewer
   «Below and Greater Depth sheets do not exist at this stage». The adaptation
   designer's own L46 says the opposite of L220: «Your wording is written after the
   design review has swept the lesson's own strings, so nobody downstream hears it
   before a class does». The ledger's "nobody reviews the Below and Greater Depth
   sheets" (found in passing) is right; L220 is the line that says otherwise.
6. **Who decides a Below sheet's support.** `worksheet-helpers\maths.md` L99 has the
   worksheet designer «keep the chart on the Below sheet when removing it would
   remove access rather than fade a scaffold», against P06 and P14 (the designer
   may not add or remove support) and L06 (the adaptation decides). Same family as
   the ledger's "who decides a Below frame's hints".
7. **How many questions.** G01 (maths): «Three to six substantial standalone
   questions is often enough»; P17 (every subject): «A flat list commonly has up to
   six standalone questions»; `teaching-sequence-skill-based.md` L83: «Do not force
   three to six printed questions».
8. **The books-or-sheet wording list against K05.** The engine's page-only list
   (`worksheet-html\src\slips.js` L77 and L79) catches "fill in" and "in the box",
   so `Write the missing digit in the box.` forces `"sheet"`, and K15 forbids
   rewording it; K05's ruling is that one digit box does not make a write-on
   sheet. How often that wording occurs is unsure.
9. **The review view and decision 2.** `design-review-packet.py` counts a
   worksheet's sticky-fact reference under "Drawn on by final work" (heading 5), so
   the reviewer is shown the optional sheet as final work.
10. Unsure: `do-beats.md` L37 says naming where the work goes «tells children a
    location, which is the teacher's business and not theirs»; I07 has the launch
    slide name the sheet in its title or first line. Decision 4 could note it.
11. Unsure: the diagram anchor (heading 1 item 9) against P09 and P37: a blank
    callout withdrawn from a finished sheet after the designer's accounting.
12. Unsure: `make-subject-file\SKILL.md` L219 against decision 12's MATHS home.

---

## 5. Code and tests

Items marked "checked" were re-read in the code for this report; the rest come
from the code sub-check and were not re-run.

1. **The scaffold still invites success criteria onto the sheet** (checked).
   `scripts\lesson-design-scaffold.py` L1248 writes `"successCriteriaRefs":
   [PLACEHOLDER]` for every generated worksheet, and the validator (L3845) refuses
   anything but `[]`. N07's scaffold row still lists "refs" among what to fill.
   Neither 4.2.288 nor the ledger catches it (decision 11).
2. **Nothing checks fit priority.** The validator checks its shape only
   (L3887 to L3892); the review view never prints `fitPriority` or
   `answerKeyMode`, and the reviewer is never asked about them. So O04, O17 and
   N03 (never pre-authorise a misconception retest or the sheet's one sticky fact;
   an empty removal list only when the page fits) are unchecked. Belongs in "What
   it does not enforce".
3. **The scope check likely refuses decision 8's "in words" route** (checked,
   not run). `scripts\check-repair-scope.py` `additions()` (L671) refuses any
   child-facing string that was not in the spec before the repair, with no
   exemption for a terminally unavailable picture, and the focused repair must
   return `REPAIR_SCOPE_OK`. Re-pointing at a published picture passes; a new
   sentence would not. The ledger's does-not-enforce paragraph also understates
   the scope check: besides "nothing went missing", it refuses new child-facing
   words, a case losing its own evidence, and lost writing room (its docstring,
   L19 to L52). Separately, `check-worksheet.js` `CONTENT_GAP_UNFOUNDED` reads only
   the photo contract, never the terminal receipts, so P10's "omit the sheet" for a
   directed Below or Greater Depth sheet is refused whenever the picture is in the
   contract (the log's 18 September entry, L3494, records this as open).
4. **A test pins which half of the Worksheets section a sentence sits in**
   (checked). `scripts\tests\test_the_reviewer_reads_once_and_repairs_small.py`
   L247 to L257 requires «Protect the learning before seeking fresh work» (B02) and
   «A worksheet is one of two kinds» (C01) inside `Worksheets > What the sheet is
   for`, and «The typeface is not yours to change» (O13) and «A stimulus and the
   questions that read it share a column» (O07) outside it. This limits every
   PREF-WS and PREF-PAGE home decision 12 proposes, and it means the reviewer never
   reads I03 or L01 although I05 asks it to judge support left off a sheet.
5. **`## Greater Depth in maths` is a heading the review code depends on.**
   `design-review-packet.py` L284 to L286 names it and L326 to L335 stops with an
   error if it goes; `test_the_reviewer_reads_once_and_repairs_small.py` L218 to
   L225 and `test_adaptation_architecture_contract.py` L283 pin it. The ledger names
   it only as where the lesson designer stops.
6. **The maths-sheet test bears on decisions 1 and 3.**
   `test_a_maths_sheet_continues_the_lesson.py` L104 to L116 bars "whiteboard",
   "carpet", "on the floor", "back to their" and "sitting" from the maths-sheet
   section, and L118 to L125 pins `subject-maths.md` L35 («The teacher decides live
   grouping, carpet work, response surfaces, pace and when different children move
   on.»), which has no row. A suggestion that writes a classroom routine into that
   section would fail it.
7. **S10 overstates the code** (checked; heading 3).
8. **The minutes check is looser than decision 3 says** (checked).
   `LESSON_MINUTES_AIM = 45`, `LESSON_MINUTES_MAX = 50` (L255, L256), with his 18
   September words in the comment at L244: «don't make it strictly 45, do 30-50
   mins, 45 the aim». It skips when any beat has no minutes. R10 and decision 3
   speak only of 45.
9. **The Expected-sheet refusal is conditional.** `EXPECTED_SHEET_MISSING` runs
   only when `meta.lessonDesignPath` is present and readable, otherwise it warns
   (`check-worksheet.js` L222 to L235). The ledger states it unconditionally, and
   `meta.lessonDesignPath` (which the designer is told to write,
   `worksheet-designer.md` L952) is missing from its names list.
10. **Engine refusals missing from the enforcement list.** `EMPTY_SET`
    (`worksheet.js` L1010 to L1050: a question with an empty set to act on, the
    engine's side of E14) and `DRAWING_SPACE_FRAME` (`forms.js` L238: working room
    must be a bordered box, the code behind I10 and I11).
11. **The no-67 rule is enforced on sheets with no row and no instruction**
    (checked). `reject_six_seven_numbers` covers the whole lesson design (validator
    L430, called at L3387) and the worksheet build refuses
    `NUMBER_CONTAINS_SIX_SEVEN` (`build-worksheet.js` L108); no instruction file
    mentions it. Whole-lesson rather than worksheet-only, so a note in group R at
    most.
12. **Pins the list misses** (verified at phrase level by the code sub-check):
    B09 (`test_diet_and_safety_content_boundaries.py`); C14
    (`test_adaptation_architecture_contract.py` L207, «`Task form: open task`»);
    D12 (`test_lesson_designer_component_loading.py` L127); F04
    (`test_lesson_design_contract.py`, `test_make_lesson_static_contract.py` and
    the assumed-knowledge pins); F08 (`test_child_facing_wording_reach.py` L147,
    `test_reference_loading_routes.py` L75); F09 («it is NOT printed»); H04
    (`test_lesson_designer_loading_guard.py` L167, which also pins the heading `##
    Question Labelling`); S07 and F20/G20 (assumed-knowledge pins). R12 is held by
    the success-criteria pins, not a Python test's phrase. Pinned with no row at
    all: `adaptation-designer.md` L54 («Where no separate resource is needed,
    record the applicable `Resource decision: Use Expected unchanged` value and the
    reason.»), L158 («The connection is still required; only the printed item is
    conditional.»), L241 («refusing to name a removal order does not save the
    content»). Group K is not wholly unpinned: `slips.test.js` L106 to L116 pins
    the wording behaviour in item 8 of heading 4.
13. **Pinned copies the fold must keep in place.** O17 and O25 must keep "Price the
    protected set against the page", "250mm" and "`preAuthorisedRemoval: []`" or
    "Page budget check" in their own files, and the Worksheets section must keep
    "about 250mm", "165mm" and the "Nothing may be removed" sentence
    (`test_make_lesson_static_contract.py` L620 to L631; the adaptation test L118
    to L136).
14. **A stale test comment and a method-frame pin** (checked).
    `worksheet-html\test\doc-claims.test.js` L26 to L29 says it pins «A small
    picture beside a word is cheap» in the lesson designer and «a picture-and-word
    bank are cheap» in the adaptation designer; neither sentence exists any more,
    and no engine test measures the price list (105, 55, 10 and 25mm). The same
    file (L193 to L196) requires `method-frame` to stay in the engine, which bears
    on decision 10. The ledger's doc-claims list also leaves out `subject-maths.md`.
15. **The review view treats the optional sheet as final work.**
    `design-review-packet.py` L1941 to L1943 counts a worksheet sticky reference
    under "Drawn on by final work" (L2166); the same pull as decision 2.

---

## 6. Stories

The build log was searched case-insensitively by distinctive words.

**Claims that are wrong**

- **H07, "Yes (1 September geography review)"**: not in the log (checked). The
  only "1, 2, 6" in the log (L2562) is "Slides 1, 2, 6, 7, 8 ... drew a schematic
  world map". The numbering story has been in `worksheet-helpers.md` since the
  plugin's first commit and needs copying to the log before it leaves.
- **F13, the Greater Depth question: half, not "No"** (checked). L2254 records
  «the two prompts that reached real sheets ... (`Choose a job.`, answered
  `Fireman`; the Greater Depth judgement question)». Its words, sheet and date are
  not there.
- **P37: half, not "No".** The 22 September Part D entry (L4255 to L4256) has "a
  repair that returned a comparison slide with the comparison gone"; the two-row
  table detail is only in the scope checker's docstring. The incident was on a
  slide, not a sheet, as the repair file itself says (L68: «A slide asking
  children to compare two objects went into a repair carrying a two-row recording
  table and came out carrying one column of boxes»).

**Stories the table leaves out**

- **Decision 8's own incident is not in the log.** P32's reason («one
  unreconciled reference loses all three and the answer key») rests on the
  buzzer-circuit run, which lives only in the docstring of
  `test_unavailable_picture_route.py` (L3 to L12).
- **O08 is not in the log** (no "evidence panel" anywhere), and its paragraph ends
  in a live rule (heading 3).
- **O20** repeats the 31 August ruling; like O07 it is not in the log.
- **L17**: «which is how three real sets went out mixed in one week»
  (`worksheet-helpers.md` L166) is a story with no row in the table. Unsure whether
  the log holds it.
- **The seven published worksheets** that "none could be built" (`worksheet-helpers.md`
  L399, `shared.md` L454) are a story in two places with no row in the table.
  Unsure whether the log holds it.
- A17's 15 September carpet sorts, E09's teeth sheet and J01's cut-off criteria
  are all in the log (L1135, L4366; 4.2.158, 4.2.162, 4.2.247), so leaving them out
  of the table does no harm.

**Log entries that bear on the decisions and are not cited**

- 4.2.157 (L1965), decisions 1 and 3: his "not my routine" ruling (heading 4).
- 4.2.162 (L1753), decision 5: the designer "returns a gap rather than
  substituting".
- 2 September review (L2880 to L2883) and 1 September (L2614), decision 8: the
  "never replace it with a sentence" rule, and a repair that turned an evidence
  card into text, recorded as "working as designed".

**Settled:** the eleven-sheet date. The log (L1716) says "between 5 and 12
September", agreeing with E02; Q11's "every sheet counted on 12 September" is the
one to change.

Every other claim in the Stories table holds, including I12 "Half".
