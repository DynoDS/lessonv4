# Independent check of the success-criteria ledger

Checked against the plugin working tree on the evening of 23 September 2026:
lesson-v4 4.2.286 (`bf658468`) with the uncommitted assumed-knowledge change
(4.2.287) on top, the same snapshot the ledger was built on. Read-only: nothing
in the plugin was changed. Scratch scripts are in
`plans\streamline-tools\scratch\scchk\` (`coverage.py`, `pins.py`).

How the search was done. Every instruction file in `agents\`, `references\`
(with `references\worksheet-helpers\` and `references\examples\`, not the build
log), `skills\` and `commands\` was split into sentences, and every sentence
touching the topic was listed unless a ledger «quote» covers most of it. Two
passes: the topic's words (success criteria, criteria, criterion, SC,
`sc-panel`, `-sc`, `successCriteria`, `drawLive`, flipchart, "the panel",
"green panel", checklist, "what good looks like", "I can", "Remember to", "the
standard", step, steps), then the words rules use when they avoid them
(imperative, how-to, consult, glance, "method steps", "numbered list", "marked
against", "judged against", self-check, WALT). About 790 uncovered sentences
were read by hand; most are image-scout, setup, or launch `steps` the appendix
already files elsewhere. The core sections were then read whole: preferences
Success Criteria, teacher-voice §10, the skill route's Writing the Success
Criteria, the designer's Success Criteria Types, `slide-success-criteria.md`,
the reviewer's criteria paragraph, and the wall and worksheet rules round the
criteria panel. For pins, every string of 20+ characters in `scripts\tests`,
`builder\test`, `shared\test`, `worksheet-html\test` and `working-wall-html\test`
was matched against every quote.

---

## 1. Missed rules

No row and no appendix entry, unless said otherwise. Ordered by how much a fold
would lose.

### Likely to matter

1. **The wall's length limits apply to criteria steps, and they pull against
   copying them word for word.** Group O. None has a row; O04 quotes only the
   rule they collide with.
   - `references\working-wall-preferences.md` L83: «**4. Two-line maximum on
     every item.**» ... «wraps beyond two lines.» (the list it names includes
     «step»).
   - Same file L89, the budget table: «Worked-example step | ≤ 60 characters»
     ... «longer steps need splitting.»
   - `agents\working-wall-designer.md` L333-336: «A worked-example step or
     sticky-knowledge statement that runs past its budget is not a formatting
     problem to fix later: it is a sentence that was never going to read from
     the back of the room. Write it short first, and let the build's refusal
     message, which names the card, the item and the exact overage, aim the
     repair.»
   - `agents\working-wall-designer-focused-repair.md` L88: «A panel too tall for
     its page is a layout fault you can repair without touching a word: put the
     card's items, in their order, on two cards of the same type and title, when
     the wall holds only one teaching card (it takes two).» and «An item over
     its own character budget is different: it fits only reworded, and rewording
     is not this round's to do, so leave that finding unrepaired and say it
     needs the wall designer's wording.»
   - The first half of that repair line is the "over two cards if needed" your
     decision 3 suggestion relies on. Only the ledger's "Found in passing" names
     the builder's message; the text the wall designer and its repair actually
     read has no row. See section 4, pair 1.

2. **The worksheet `steps` example is written in the very forms §10 rules
   out.** `references\worksheet-helpers\catalogue.md` L248-263. N15 quotes the
   purpose line at L250 but not the example under it:
   ```
   "title": "Use these steps to help you.",
   "steps": [
     "Read the question: 10s or 100s?",
     "Find the 10s or 100s each side.",
     "Draw a number line. Mark your number.",
     "Find halfway. Before it or after it?"
   ```
   - `Find the 10s or 100s each side.` is nearly the step teacher-voice §10
     (D26) calls «plainer and still not runnable».
   - `Read the question: 10s or 100s?` and `Before it or after it?` are the
     question-fragment form D16 and D44 rule out.
   - The title differs from the board's «✓ Success Criteria». The code defaults
     the title to "Success criteria" when none is given (`worksheet-html\src\helpers\frames.js`
     L712-715), and the source comment says so (`worksheet-html\test\helper-examples.js`
     L50-51: «The title is the lesson's own wording for the panel. Left out it
     reads "Success criteria", which is what the board calls it.»).
   - The catalogue is generated from `helper-examples.js`
     (`worksheet-html\test\doc-claims.test.js` L48), and
     `page-furniture.test.js` L162 asserts the «✓ Use these steps to help you.»
     title. Rewriting it means editing a test file and regenerating the
     catalogue.
   - Group N; it belongs in decision 7.

3. **The wall has a second home for method steps, with no verbatim rule and an
   example that fails §10.** `references\working-wall-card-contracts.md` L101
   (`diagramSection`): «`cards[].parts[].steps` | Optional numbered method, when
   this part *is* the strategy: `["Find the neighbouring multiples.", "Find
   halfway.", "Choose the closest."]`. Each step numbers itself in the part's
   colour.» The complete example at L122 repeats it.
   - `Find the neighbouring multiples.` is the exact step D26 calls one that
     «tells them nothing they can do».
   - O04's verbatim rule is written for «a worked-example card», so nothing
     says a `diagramSection` part's steps are the lesson's criteria copied
     exactly.
   - `working-wall-html\test\section-gives-the-figure-the-room.test.js` L80
     uses the same three strings as test data.
   - Group O; also decision 7.

4. **The slide designer may turn a criteria table into lines.**
   `references\templates.md` L1754 (`sc-panel`, the `content` field). K10 cites
   the line and quotes only its story and its last warning. The instruction in
   the middle has no row: «Check the nested type's own row before nesting it,
   and put a criteria table in a wide zone or give the same criteria as lines.»
   - "give the same criteria as lines" is a change of form made downstream,
     where C01 makes form the designer's decision and I02 and I07 forbid
     re-shaping. See section 4, pair 4.
   - The same paragraph's last sentence is pinned by a builder test (section 5)
     and is quoted by no row: «the route to the panel does not change the
     criteria's visual identity».
   - Group K.

5. **Two rules on the `steps` heading, one of which undoes the green box.**
   Group K.
   - `references\templates.md` L740: «Use it to title a step list inside a
     free-template zone» ... «`"heading": "✓ Success Criteria"` over a criteria
     panel ... so the label reads as part of the list.»
   - `references\slide-success-criteria.md` L13 (K01 cites the line, these
     sentences are not quoted): «a `steps` object you place inside its criteria
     slot should leave its own `heading` blank» and «The `steps` `heading` is
     otherwise for bare free-template zones (a `split-h-60-40` `secondary`, the
     steps inside a plain body) that have no label of their own.»
   - Both describe criteria sitting as a bare labelled list in a free zone,
     which K04 and K40 say to wrap in `sc-panel` instead («A success criteria
     dropped bare into a `split-v` secondary or a plain body zone has no green
     box and reads to a child as just another list»). The builder also only
     warns (does not refuse) a "Success Criteria" heading inside a `*-sc` slot
     (`builder\src\validate.js` L350-357).

6. **The worksheet may drop the criteria panel to make a page fit.** Group N;
   decisions 3 and 8.
   - `agents\worksheet-designer.md` L546-569, the fit repair: «**Drop a printed
     reference the child already has in front of them.** A reference is a thing
     to consult» ... «You may take one off on your own judgement, including one
     marked required, when all three hold». It does not name the criteria, but
     a criteria panel is exactly a reference «on the board or the working wall
     throughout the lesson», so it is the route by which a required panel
     leaves a sheet. That pulls against N01's «do not remove required criteria
     for layout convenience».
   - `references\preferences.md` L725, the lesson designer pricing a sheet:
     «drop a reference the board is already showing while they work».
   - Both are assumed-knowledge rows (AK-J04, AK-J16). The criteria ledger
     should list them as shared, because decisions 3 and 8 cannot be settled
     without them.

7. **Criteria reach the wall only inside a worked example.** Group O; decision
   5. The appendix files `working-wall-card-contracts.md` L183 under "wall-worthy
   criteria", but it is the rule that decides whether the criteria steps go up
   at all:
   - `working-wall-card-contracts.md` L183, the `workedExample` test:
     «Includes a finished worked example, not just steps».
   - `working-wall-preferences.md` L31: «A worked example modelled on the slides
     becomes a `workedExample` card with the same finished sentence/equation
     visible» ... «not just the steps.»
   - Same file L104-108, `## Step labels in worked examples` (a heading the wall
     packet cuts by exact title, `working-wall-packet.py` L147): «**Maths**:
     number the steps ("Step 1", "Step 2"). Always.» «**English**: label
     semantically ("What", "Why", "How") rather than numbering, where the
     procedure has named phases.» «Always end a worked example card with one
     labelled `"Worked example"` item».
   - So a draw-live labelled set, or a method the lesson never works through as
     one finished example, has no card family that puts its steps up. L01's
     promise that «the working wall reproduces the same reference» cannot hold
     for those.

8. **Who counts as a taught word for the green mark.** Group J; decision 1.
   `references\teacher-slide-visual-profile.md` L114. J04 quotes two sentences
   of this paragraph; these carry its scope and one exception:
   - «The terms are the lesson's vocabulary cards (and a prior lesson's term the
     design says children already hold), not every subject noun on the slide»
   - «Answer reveals keep their own green, so a taught term inside a revealed
     answer is not marked twice.»
   - "Every taught word green" (decision 16) needs this scope. AK-F29 records
     that the design has nowhere to say a prior lesson's term is held.

9. **The orange mark's two limits.** `references\modelling-formats.md` L19
   (J07's line, unquoted): «Two limits. Where the move is a judgement rather
   than a change to a visible part, there is nothing to mark and nothing is
   marked. And the mark is on the part the move acts on, never on the answer:
   marking what changes shows the child where to work, while marking what it
   becomes does the work for them.» Group J. Nothing in group J says the
   criteria's own orange mark may not sit on the answer.

### Smaller copies and companions with no row

10. `agents\working-wall-designer.md` L32: «every word on a card is copied
    verbatim from upstream - » (the file uses a dash here) «the success-criteria
    steps in the same words, the same punctuation, the same number of steps. A
    paraphrased step is a card that contradicts the board it hangs beside.» A
    copy of O04, and the reason the wall designer may not delegate. Group O.
11. `references\teaching-sequence-skill-based.md` L140 (F01's paragraph,
    unquoted): «The exchange has to precede removal when there is no ten to
    remove, and its actual method must already have been modelled.» A condition:
    a step's method must have been modelled before the step appears. Group F.
12. `references\slide-representations.md` L11: «**Question and reference**
    shows the exact question, useful criteria and reference while the teacher
    produces separate working.» and L19: «The slide carries the exact question,
    the blank or partly blank configuration and the SC.» (a Live-complete
    helper). Which modelling slides carry the criteria. Group H.
13. `agents\slide-designer.md` L400: «If a structured set must split, split only
    at a complete item or card boundary, use consecutive slides with the same
    `designUnitId`, and repeat every still-needed live reference.» The playbook
    says the same at L372. Group H; see section 4, pair 10.
14. `agents\slide-designer-focused-repair.md` L85: «When a reference panel or
    table is too small to read, the first move is re-shaping - a side panel in
    a row instead of a full-width band under the task, a tighter card, a
    different template - not growing its share of the stack, which squeezes the
    task the reference serves.» The repair role's only copy of H07's last
    sentence; that role never reads the playbook. Group K.
15. `references\brief-gap-protocol.md` L84: «The line is crossed when the
    specialist starts making decisions in the *lesson-designer's* domain»
    ... «what the success criteria say.» A fourth place in the file I10 quotes
    three times. Group I.
16. `references\templates.md` L735, the `steps` example: `["Read the
    question.", "Underline the key information.", "Solve."]`. The same
    stage-name form as C18, in the catalogue the slide designer reads. Decision
    7.
17. `references\templates.md` L697: «Do not set text `color` to `00B050` and do
    not use `||`, `{{green}}` or `{{answer-green}}` on a teaching slide.» and
    «Vocabulary and success criteria keep their established green treatments.»
    The appendix files L697 as "slide inline markers in general", but the ban
    reads against J06's instruction to copy the criteria's `{{...}}` marks as
    they arrive. See section 4, pair 12.
18. `references\working-wall-visual-language.md` L86-88: «This is how children
    learn "the green cards are how-to-do-it cards"» and «If the lesson teaches a
    procedure, that is a `workedExample` card; it goes on a green panel, with
    the green identity.» The wall's version of K02's one identity. Group O.
19. `references\worksheet-helpers\maths.md` L44-45: «A grid gives the child the
    ruled shape and nothing else. If the lesson wants the steps named as well,
    that is `method-frame`.» A second worksheet object for "taught method
    steps", beside N02's `steps`. Group N (unsure whether method-frame lines
    count as criteria).
20. `references\subject-history.md` L64, second half (U01's line): «Then the
    class meets those criteria on more than one case, so a child can see that
    the same three questions produce a different answer for a different
    person.» Group U.
21. `references\slide-composition-playbook.md` L41: «A vertical list of steps
    needs a tall zone.» Group K, minor.

Searched with nothing further found: `slide-decorator.md`, the builders,
`diagram-anchor.md`, `image-scout*`, `helper-builder.md` (maintainer only, K27
to K29), `skills\make-lesson\*` (only L15), `make-subject-file` (C16),
`commands\*`, `lesson-from-plan.md`, `revising-in-place.md`,
`design-review-route-checks.md`, `worksheet-compositions.md`,
`worksheet-visual-profile.md`, `examples\tudor-teach-slides.lesson.json`, and
the discovery route (which, as the ledger says, has no criteria rule).

**One header error.** The ledger's opening says assumed-knowledge rows «G23 to
G27 and G29» appear «as E01 to E05 and E09». AK-G27 («Those four are short and
already clear...») is D13 here, not E05; E05 is the vocabulary rule VOC-I02.

---

## 2. Duplicates that are not duplicates

- **E12 is looser than E11.** E11 lets a step name a sub-procedure «only when
  that sub-procedure is secure from earlier lessons». E12 says «Name a familiar
  or just-taught action only when children genuinely know how to carry it
  out». "Just-taught" admits today's teaching, which E11 excludes. E12 also has
  its own literal-mark examples (`":"`, `"Write it down."`, «the templated
  answer»). Folding E12 into E11 either narrows E12 or quietly widens E11; this
  is a question for Daniel, not a fold.
- **H15 and H41 are stronger than H13.** H13: «may remain when it enables the
  intended performance». H15: «Keep success criteria ... when it enables the
  intended performance without supplying the answer or making the key
  decision.» H41: «Keep word bank, representation, worked example, reference or
  SC that still enables intended thinking». "Keep" is a must where H13 is a
  may, and H15 adds «or making the key decision».
- **H11 is not H10.** H10 is item 3 of the order to protect content «When the
  most suitable composition is still tight». H11 is the positive rule for a
  slide whose work happens away from it: «Show the exact question,
  representation, reference and success criteria named by the source unit.»
  Two different rules.
- **I03 carries the remedy I01 lacks:** «Choose a roomier slot, a different
  template or a coherent split.» "A coherent split" is a permission the fold
  must keep, and decision 3 must weigh.
- **K10 is not K04.** It carries the sidebar refusal («in a narrow sidebar
  (E-narrow) the panel takes `steps`, `text` or a list and a `table` is
  refused»), the two keys («Put the criteria under one of them»), the
  empty-panel warning, and the unquoted "give the same criteria as lines"
  (missed rule 4).
- **K40 adds «a Reflect slide»** as a place for a criteria panel. No other row
  puts criteria on a Reflect slide.
- **C21 is wider than C20.** C20 is the practice-sort rule. C21's condition
  (templates L214, in the quoted row's own line) covers «a Venn or Carroll, a
  coordinate grid, a dial».
- **F15 adds `conceptRef`.** «use the same `conceptRef` and exact concept
  `successCriteriaRefs`». F14 names only the refs, and the validator checks
  both.
- **O11 is stronger than O10.** O10: «should be the same clock» (default). O11:
  «The wall card needs the same diagram or the support evaporates» (must).
- **P03 has a condition P01 lacks:** «When the task is open» and «rather than
  an extra prompt block».
- **A07 is wider than A06.** A06: «stays visible while children work». A07:
  «kept visible throughout», which, read literally, pulls against H05 (off the
  answer slide) and H07 (not on every part of a split).
- **B06 names a different field for a different program**
  (`successCriteriaIndexes` in the scaffold request, where B05 is
  `successCriteriaRefs` in the contract). Tests pin both. It cannot fold into
  B05; the ledger's STAYS is right, the word "duplicate" is not.
- **H26 is the reviewer's amount test,** not a copy of H22: «A beat that hands a
  Year 4 class two sources, a scenario, three questions and a criteria panel at
  once is not unclear, it is too much». H22 has no such limit.
- **Smaller:** N15 adds «Nothing in it is written on.»; O06 adds «with any
  `flipchart` flag».

---

## 3. Strength and scope (about 100 rows checked)

Wrong or incomplete:

- **H10: the scope is wrong.** The row says «what every slide must show». The
  quote is item 3 of «When the most suitable composition is still tight,
  protect content in this order», and the next paragraph allows such a
  reference to be «moved to another consecutive slide with the same
  `designUnitId`».
- **D12: "must not (I can)" is too strong.** The text is «Do not default to: >
  I can use expanded noun phrases.», which is a default, not a ban. The kind
  column's «the one place that rules out "I can" statements» overstates it.
- **Q01 weakens D06, and the ledger does not say so.** D06 and D31: a condition
  the method always meets «stays in the steps». The reviewer's copy: «A
  condition the method always meets may stay in the steps as an `If...`
  sentence». The row calls Q01 the reviewer's copy of D06 without noting the
  drop from must to may.
- **J04: "every slide" misses the scope and the exception in its own
  paragraph** (missed rule 8): only the lesson's cards and a prior lesson's
  term the design says is held, «not every subject noun»; and answer reveals
  keep their own green.
- **J07: "a modelled case" misses its two limits** (missed rule 9).
- **R09 "must (code)" is narrower in code than the row says.** The check
  returns early when the good instance has no `words` string («A good instance
  the class looks at rather than reads - a diagram, a sketch, a sorted set -
  carries its words on the picture»). It reads only the criteria on the launch's
  own unit. It matches a loose stem by substring (`term_is_used`). And its
  refusal offers «or take the word out of the criteria» (section 4, pair 2).
- **N02 "(code: a three-line instruction is refused)".** The code counts line
  breaks in the text (`INSTRUCTION_MAX_LINES = 2`,
  `worksheet-html\src\helpers\text.js` L38-57), not printed lines. A criteria
  list run together on one line passes.
- **A09 "default":** «Provide an answer, model, success criteria or another
  suitable comparison standard where the outcome is definite or exemplifiable»
  is an imperative with a condition, and the quoted second sentence is a
  must-not («Do not prescribe whether the teacher live-marks...»).
- **J10 "must" should say code.** `builder\src\validate.js` L413 refuses
  `categoryColor` on `steps` («keep ordinary question lists and success-criteria
  steps uncoloured»), and `builder\test\category-colours.test.js` L178 pins the
  playbook sentence.
- **H07's "when it applies" is too narrow.** «a unit split across slides» fits
  the first rule only. The second, «Place a repeated panel beside the task (a
  row) rather than as a full-width band beneath it when the stack is tight», is
  for any repeated panel.
- **D21 "must":** «look for the shorter way to say how» is a check or default.
- **D19 is rated default** while D15 to D18, the same bulleted list of «What
  changed each time», are must. Unsure; D19's «are more immediate than» may
  justify it.
- **B01's «the only place any file says a task may have no criteria"** is too
  strong. B02 («Often not needed as a procedural list»), B05 and B06 («when no
  criteria belong to it») also allow none.
- **K33's note is probably a misreading.** The row says the quick-check rail
  puts «a criteria line on a check slide, where H05 takes the panel off check
  slides». H05's «check slide» is the answer slide («the moment the class
  compares what they wrote with what was right»). The rail is on the question
  slide children answer from, and preferences L515 says smaller checks get no
  answer slide. Unsure, but it looks like no conflict.
- **S20** omits the second warning: past 320 characters in total
  (`SC_LONG_TOTAL_CHARS`, `builder\src\content\capacity.js` L20, L97-104).

Checked and correct: A01, A04, A06, A10, B02, B03, B04, B08, C01, C02, C04,
C05, C12, C13, C14, C20, D01, D04, D06, D10, D11, D14, D17, D20, D25, D26, D27,
D28, D34, D38, D40, E01, E02, E05, E07, E11, E13, F01, F03, F04, F05, F06, F11,
F12, F13, G01, G03, H01, H02, H04, H05, H09, H12, H13, H16, H17, H34, I01, I07,
I12, J02, J03, K01, K05, K06, K07, K24, L01, L03, L07, L11, L14, M01, M03,
M04, N01, N08, N09, N12, O03, O04, P02, Q01 (apart from the point above), U01,
U03.

---

## 4. Disagreements

### The ledger's decisions 1 to 11

All nine pulls are real in the text. Several have more evidence than the
ledger gives:

1. **Green words (decision 1).**
   - The launch check turns decision 16 into a refusal. Every `{{taught word}}`
     in the beat's criteria must appear in the model's words, so greening every
     taught word makes the check stricter.
   - Its message then offers the way out that undoes decision 16: «Write the
     model as a child meeting the criteria would write it, or take the word out
     of the criteria» (`validate-lesson-design.py` L2076-2082).
   - The question also needs J04's scope (missed rule 8): which words are
     "taught".
2. **The occasional case (decision 2).**
   - E13 and E14 assume there are criteria steps that sometimes do not apply:
     «including a case that takes each conditional branch and one where that
     branch should not apply» and «including when conditional steps apply or
     should be skipped».
   - Under D27 («A condition that does not happen every time is not a step»),
     those steps would not exist.
3. **Fewer criteria (decision 3).**
   - More places allow a partial or reshaped set: I03 («a coherent split»),
     templates L1754 («give the same criteria as lines»), the worksheet fit
     step (missed rule 6), and the wall's «longer steps need splitting» with
     its repair's «two cards of the same type and title» (missed rule 1).
   - The suggestion, «shown all together or not at all», also needs an
     exception for the Below dial at `agents\adaptation-designer.md` L183:
     «Holding the steps | One step at a time, the sequence chunked, a worked
     example beside the first attempt.» As worded, it would forbid that dial.
5. **Build live and the wall (decision 5).**
   - Beyond L01, L04, L05 and L12, the promise is also in the hand-off check's
     docstring (S17) and the 4.2.109 log entry («the wall reproduces either»).
   - The wall's own card families cannot keep it for a labelled set, or for a
     method with no finished worked example (missed rule 7).
6. **Explaining and discussion lessons (decision 6).**
   - The suggestion, «a short list of what good work does, as steps in the
     child's words», meets U01.
   - A history significance lesson's criteria are three questions the class
     judges with («How much changed. How many people it changed things for. And
     how long it lasted»), not steps. Decide whether U01 is an exception.
7. **Examples (decision 7).** Add:
   - the worksheet `steps` example (missed rule 2);
   - the wall `diagramSection` example (missed rule 3);
   - the templates `steps` example (missed rule 16);
   - smaller: H34's own illustration, «"read the question: what am I
     comparing?"».
8. **The worksheet (decision 8).**
   - The ledger quotes only the slip half of the 19 September ruling. The same
     log line (`build-review-log.md` L785) opens: «I've had worksheets before
     that had the success criteria and I did chop it off. So I do think it's a
     kind of waste».
   - The entry's author then reads it as «Daniel kept it there, Below
     included» (L787). The two readings should go to Daniel rather than be
     settled by the gloss.
   - Add the two "drop a reference the board shows" rules (missed rule 6).
9. **Two-sentence steps (decision 9).**
   - The strongest statement of the rule is missing. The reviewer (Q01) is
     told: «a step of two sentences, or one that explains a word or suggests
     content, is carrying teaching». The skill route (D38) says «the usual
     sign is a second sentence inside one step».
   - Both would mark Daniel's approved rounding rewrite as a fault, and both
     need the same exception the suggestion names.
11. **Out-of-date text (decision 11).** Two more candidates:
   - O04's «The 2-line cap exception above does NOT extend to SC steps»
     points at nothing: no two-line exception sits above it in
     `working-wall-designer.md` (unsure what it once referred to).
   - The build's capacity warning says «past the ${SC_MANY_ITEMS} the panel
     holds at a readable size» (`capacity.js` L94-95). That is the same "five"
     the ledger flags in K05, printed to the slide designer as a capacity.

### Pairs the ledger did not raise

1. **Word-for-word criteria against the wall's length limits.**
   - O04 says: «same number of steps, same wording», «never reword the steps».
   - The wall budget says: «≤ 60 characters», «longer steps need splitting»,
     «Write it short first». The repair adds that an over-budget item «fits
     only reworded».
   - Daniel's approved `Put < or > between the numbers, with the open side
     facing the greater number.` is 77 characters, so on the wall it is either
     split, reworded or its card dropped.
   - This also pulls against D01 and D21's direction, where clearer steps came
     out longer.
2. **The launch check's message against decision 16** (above).
3. **The `steps` heading against `sc-panel` identity** (missed rule 5).
   templates L740 and slide-success-criteria L13 describe a bare list with a
   "✓ Success Criteria" heading. K04 and K40 say a bare list «reads to a child
   as just another list».
4. **"Give the same criteria as lines" against the form rule and the copy
   rule.**
   - templates L1754 lets the slide designer change a table to lines.
   - C01 makes form the lesson designer's choice. `slide-designer.md` L261
     says «Keep a structured visual structured. Do not flatten a table, bank,
     sequence, checklist, diagram or card set into prose».
5. **F13's own rule, not only its example.**
   - F13: «Not the full SC verbatim, but enough to trigger the right
     procedure». This asks for a compressed paraphrase of an earlier concept's
     criteria.
   - M01: «a reworded step reads to a child as a new rule». F11: «If the
     wording drifts - even slightly» (the file uses a dash). D37 names this
     kind of stage cue as «Too short to run».
   - Decision 7 treats only the example.
6. **Questions in a decision list against sentences in steps.**
   - F05 allows «a short decision list» as a branching guide, and F06 says
     «Phrase each branch as the question the child asks - "Is the answer
     missing?"» (the file uses a dash).
   - D16 and D44 say write a condition as a sentence, not a slogan.
   - The review packet's cue (`FRAGMENT_CONDITION`, `^[^?.!]{1,30}\?\s+\S`)
     fires on `Is the answer missing? Slide right.` when a decision list is
     written as steps. Tables escape it, because cells get only a length cue.
7. **E12 against E11** (section 2): "just-taught" against «secure from earlier
   lessons».
8. **The worksheet's steps title against one identity.**
   - N02 says the sheet's panel is the one «the class worked from on the
     board». K02 fixes the board's heading as «✓ Success Criteria».
   - The only example teaches «Use these steps to help you.» (missed rule 2).
     Nothing tells the worksheet designer which to use.
9. **Dropping the panel from a sheet against keeping required criteria**
   (missed rule 6 against N01).
10. **Not on every part of a split, against repeating live references.**
    - H07: «What they must not do is arrive on every part of a split by
      default».
    - Against it: `slide-designer.md` L400 and playbook L372 («repeat every
      still-needed live reference»), I12 («A continuation repeats that identity
      without drift»), H12 («stays visible»).
    - "Still-needed" can reconcile them, but only H07 says criteria are
      usually not still needed on a continuation slide.
11. **A07's "throughout" against H05 and H07** (section 2).
12. **The slide catalogue's green ban against the criteria's green marks.**
    - templates L697: «do not use `||`, `{{green}}` or `{{answer-green}}` on a
      teaching slide».
    - J06: copy the criteria's `{{...}}` marks as they arrive.
    - The ledger's "Found in passing" notes the double meaning of `{{...}}`, but
      not that the slide catalogue bans it on exactly the slides the criteria
      sit on.
13. **Smaller, unsure.** `method-frame` draws «a green "method" panel»
    (templates L2639) and a green title, while J08 reserves green for answers,
    vocabulary and criteria. A method frame beside the criteria panel shows two
    green boxes. For the slide topic.

---

## 5. Code and tests

**Pins the ledger's scan could not see.** It matched strings in
`scripts\tests` only. The node suites also read the plugin's instruction files
and pin criteria text:

- `builder\test\doc-claims.test.js`:
  - L790: K03's «one compact white card per criterion» in the visual profile.
  - L733-734: the heading `## One success-criteria object keeps one visual
    identity` in `slide-success-criteria.md`.
  - L726-728: templates L1754's «the route to the panel does not change the
    criteria's visual identity».
  - So "group K's panel mechanics" are not unpinned. Folding K03 to a pointer
    (its proposed home) breaks this test.
- `builder\test\category-colours.test.js` L178 pins J10's «Ordinary question
  lists and success-criteria steps stay out of that palette».
- `working-wall-html\test\doc-claims.test.js` L164-165 pins «62 characters» and
  «106 characters» (the wall budget that governs criteria steps). L68 and L217
  pin the `### workedExample` and `### diagramSection` headings.
- `worksheet-html\test\doc-claims.test.js` L277-294 pins the catalogue's
  `#### \`steps\`` heading and index line (N14, N15). The catalogue is generated
  from `helper-examples.js`, and `page-furniture.test.js` L162 pins the «✓ Use
  these steps to help you.» title.

**Names the code depends on, missing from the ledger's list:**
- the headings `## Step labels in worked examples` and `## How much text one
  body item holds` in `working-wall-preferences.md` (cut by exact title,
  `working-wall-packet.py` L140-147);
- the slide-success-criteria heading above;
- the worksheet `steps` helper's `title` field, which defaults to "Success
  criteria";
- the builder's `criteriaLabel` or `label`, which defaults to «✓ Success
  Criteria» (`success-criteria-panel.js` L36).

**Enforced but not in "What the code enforces today":**
- `validate-lesson-design.py` L3525-3573:
  - a criterion has exactly four keys (no others);
  - a labelled reference's items have exactly `label`, `text`,
    `representationRef`, `configuration`, where the representation must exist,
    its configuration must be one of that representation's, and the
    configuration is null without one;
  - an unknown `successCriteriaRefs` entry is refused (`validate_ref_list`).
- `builder\src\validate.js`:
  - refuses an unknown Success Criteria Helper key, and a step giving both
    `helper` and a different legacy `figure` (L389-393);
  - refuses `categoryColor` on `steps` (L413);
  - only warns about a "Success Criteria" heading or an `sc-panel` inside a
    `*-sc` slot (L350-357).
- `worksheet-html\src\slips.js` L233 drops `steps` on a slip (confirmed).

**Stated too broadly:**
- The launch check (R09, S07): the exemption, the loose stem match and the
  message are in section 3.
- The three-line instruction refusal counts line breaks, not printed lines.
- `SUCCESS_CRITERIA_CAPACITY` also warns past 320 characters.

**What the review page prints, not recorded:**
- Since 4.2.286 the class view prints each beat's referenced criteria beside it
  (`class_view_criteria`, `design-review-packet.py` L952-973). It also prints
  the worksheet's criteria, and the concept list prints each concept's refs
  (L2186-2191).
- Cues run only on `steps` and table cells. A labelled reference gets no cue at
  all, and the vocabulary cue runs on steps only.
- Under decision 16, the vocabulary cue («uses `{term}` from this lesson's
  vocabulary; is it the subject's own word...») fires on every green taught
  word in a step. That is intended as a question, but the reviewer will see it
  on every step that follows the decision.

The rest of the ledger's code section matches the code: the three types, the
open-mark and picture-mark refusals, the same refs on every turn, the
shared-frame sheet, the draw-live hand-off both ways, `SC_PANEL_TOO_LARGE`, the
18pt floor, the four-step card height in a criteria panel only, and the
non-blocking capacity signal.

---

## 6. Stories

Searched `build-review-log.md` case-insensitively.

- **D35 (`Explain the job electricity powers`) and H08 (a history panel printed
  on six slides): the ledger is right, neither is in the log.** No match for
  "electricity powers", "job electricity", "three source units", "continuation
  slide", "as loud" in that sense, or "green box". The only "six slides" lines
  (L1259, L2466, L3517) are other incidents.
- **D26: only partly logged.**
  - 4.2.146 (L2121) has `neighbouring multiples` with «doesn't help dumb
    kids».
  - 4.2.221 (L1017) has the incident: children «could not find the two
    multiples of 10 either side», and the class that found the longer list too
    wordy.
  - The number `346` appears nowhere in the log. The only match is `5,346` in
    4.2.165, a different story. If D26 keeps its example without the date, this
    does not matter. If the story leaves, add the number.
- **N12: in the log, but only half quoted.** The log's words start with the
  worksheet ruling (section 4, decision 8).
- **Confirmed as the ledger says:**
  - C03: 4.2.109, L2442, «the nutrient table wearing the criteria label».
  - D02 and D01: 4.2.183.
  - E06: 4.2.209, with «I dont understand it at all».
  - H06: 4.2.146, L2123.
  - H29: 4.2.145, L2131-2137.
  - K05 and S18: 4.2.211, L1154, both quotations word for word.
  - J01: 4.2.212, L1144.
  - K10: the 21 September PSHE rebuild, L3885-3888.
  - L02: 4.2.109 and 4.2.110, L2430 and L2443. Both say the exchange steps the
    teacher wrote up by hand. "Flipchart" is there, "how to exchange" is not.
  - N03: 4.2.158, L1907.
  - R01 and R10: 4.2.235.
  - U02: 4.2.139, L2212.
  - D21: 4.2.221, L1017.
  - Decision 16: 4.2.284, L4350, names «green in success criteria» as waiting.
- **One dated story near the criteria is not in the ledger's table.**
  preferences L741, the 1 September PSHE sheet whose steps sat in a 30% left
  column. It is in the log (L2797, "2026-09-01 Year 4 PSHE balanced diet"), so
  it can leave. It sits in N06's paragraph, which is marked STAYS (Worksheets).
