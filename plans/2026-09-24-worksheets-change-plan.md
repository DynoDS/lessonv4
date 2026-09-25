# Worksheets: the change plan (24 September 2026)

Step 5 onward of `streamline-plan.md` for topic 6, drafted from the ledger
(`2026-09-23-worksheets-ledger.md`, 478 rows): his 23 September ruling, his
answers of 24 September (morning) with their read-backs, and the fifteen
settled items he confirmed ("y"). His words are the standard; where a read-back
follows them, the read-back is what he agreed. One release, **4.2.290**, built
on the committed 4.2.289. Nothing is committed or pushed until he says so.
Scratch work for this plan is `streamline-tools/scratch/wsplan_*.py`; the change
scripts go in `streamline-tools/ws-change/`.

Paths below are inside `plugins/lesson-v4/`. Short names: PREF
`references/preferences.md`; LD `agents/lesson-designer.md`; LDC
`references/lesson-designer-components.md`; OT `references/output-template.md`;
WSD `agents/worksheet-designer.md`; REPAIR
`agents/worksheet-designer-focused-repair.md`; BUILDER `agents/worksheet-builder.md`;
WSH `references/worksheet-helpers.md`; SHARED `references/worksheet-helpers/shared.md`;
MATHSH `references/worksheet-helpers/maths.md`; BOS `references/books-or-sheet.md`;
GAP `references/brief-gap-protocol.md`; REV `agents/design-reviewer.md`; ADAPT
`agents/adaptation-designer.md`; PB `skills/make-lesson/playbook-lite.md`; LOG
`references/build-review-log.md`; ENGINE `worksheet-html/`.

---

## 0. Before anything changes

- **Wait for 4.2.289 to be committed.** It touches, in files this plan also
  touches: `scripts/tests/success_criteria_ledger_pins.json` (its rows
  SC-DEC-11-FIT, K06, K12, K38 and the new SC-FIT-289-TPL; this plan moves the
  SC rows of I01, I04, J03, J05, O09 and O21, which are different rows),
  `references/build-review-log.md` (this entry goes after its entry) and both
  `plugin.json`. It also touches files this plan does not: the lesson validator,
  `templates.md`, `slide-success-criteria.md`, the slide builder and
  `test_design_review_packet.py`. Nothing here edits the validator.
- **Re-check the ledger against the committed tree** with
  `scratch/ws_check_quotes.py` (the copy of `check-ledger-quotes.py` that also
  reads `worksheet-html/`). Record any row whose line moved. A quote not found
  stops the work until it is explained.
- **Baseline:** `run-all-suites.sh ws-before`; `validate-saved-designs.py` to
  `ws-before-designs.json`; and one baseline this topic needs that the others
  did not: every saved `worksheet.json` in the repository through the preflight
  (`check-worksheet.js`, with `--adaptation` and `--photo-requirements` where the
  working folder has them) and through the build's recording pass, signals only,
  to `ws-before-sheets.json` (script `ws-change/w0_sheet_census.py`). Three of the
  changes below are to the sheet engine's own checks, and the SC release showed
  that engine changes need the saved sheets run before and after.

---

## 1. Every edit, by decision

Each item gives his words, then what changes (file, section, old words), what
the new words must achieve (with a draft), what moves rather than rewords, the
rows, and the tests and pins. Draft wording is a draft: the change script may
tighten it, but may not add a permission, an example or a condition that is not
named here.

### Decision 2: the board's practice and the sheet never share questions

His words: "They are different yes. Its just I wouldn't want the same exact
questions on both. It's silly if they practise one thing on the board, then
independently get the exact same thing on their sheet. It's just different
context, different numbers etc in maths. Other lessons like PSHE etc might be
different, it might be working towards a particular one question answered, the
sheet is the proof of that. But its just trying to avoid same thing they
practied you know?" Read-back: the practice slide keeps its own questions and
the deck still carries the lesson; what it must not do is show the sheet's
questions; in maths the sheet has different numbers and contexts; in a subject
like PSHE the sheet can be the one question the lesson worked towards, answered,
as the proof.

1. **PREF › Worksheets › What the sheet is for, the paragraph "Choose the
   worksheet's relationship to slide practice" (B01).** Reword:
   - "The teacher may use the worksheet as additional practice or as a printed
     alternative to the slide task. For an alternative, keeping the same useful
     task, diagram, labels and response structure is legitimate: the child does
     that work once, using the chosen medium." becomes, in substance: *The
     practice slide keeps its own questions, and the sheet never carries them:
     in maths the sheet has different numbers and contexts; in a lesson like
     PSHE that works towards one question, the sheet can be that question,
     answered once, on the sheet, as the proof. The teacher may use the
     worksheet as additional practice or in place of the slide practice. In its
     place, keeping the slide's diagram, labels and response structure is
     legitimate, with the sheet's own questions: the child does the work once,
     using the chosen medium.*
   - "it replaces that Practise (children do the work once, on paper)" keeps
     "it replaces that Practise" (the sheet takes the practice's time, as settled
     item 3 says) and the bracket becomes "(children do the sheet in its place)".
   - "it does not prohibit this deliberate reuse" becomes "it does not prohibit
     keeping the slide's representation".
   - Unchanged: "Choose the worksheet's relationship ... before asking for
     freshness", "The slide lesson remains teachable without printing", "When
     the sheet asks for essentially the same performance as the slide Practise,
     choose one and say it in `worksheet.demand`" (a test holds this sentence),
     "`It can replace the slide Practise or follow it` hands the design's
     decision to the teacher", and the last sentence on withholding a worked
     answer.
   - What must not happen: "same performance" (the same skill) must not be
     read as "same questions". The new sentence says questions, not performance.
2. **PREF, same section, "Protect the learning before seeking fresh work" (B02).**
   "Reusing a task for consolidation is legitimate when that is its stated
   purpose" becomes "Reusing a task's shape for consolidation, with the sheet's
   own questions, is legitimate when that is its stated purpose". The quick-checks
   pin that holds the old sentence moves (section 5).
3. **PREF, same section, "Your Turn is genuine pupil practice" (A05).**
   "including as the printed alternative described above" becomes "including in
   place of the slide practice, as described above".
4. **LD › Worksheet, first paragraph (A08).** "That owner permits a printed
   alternative using the same task; the lesson still does not depend on printing
   it." becomes "That owner lets the sheet keep the slide task's representation,
   never its questions; the lesson still does not depend on printing it." The
   supplied-sheet clauses before it stay word for word (two tests and a
   quick-checks pin hold them).
5. **LDC › Generated worksheet, "For fresh additional practice, change instances
   rather than the teaching medium" (B05).** Its second sentence, "A printed
   alternative may retain the same task under `preferences.md` → Worksheets.",
   becomes "A sheet in place of the slide practice may keep its representation,
   never its questions (`preferences.md` → Worksheets)." The first sentence and
   the photographs example stay (two tests hold them).
6. **REV › 5. Worksheet evidence, first check (Q02).** "a printed alternative may
   preserve the same slide task and representation; additional practice or
   claimed fresh application follows `preferences.md` → Worksheets. Do not reject
   deliberate consolidation or printed reuse for lacking novelty;" becomes, in
   substance: *the sheet never repeats the practice slide's questions (in maths,
   different numbers and contexts; in a lesson working towards one question, the
   sheet may be that question, answered once); a sheet in place of the slide
   practice may keep its representation; additional practice or claimed fresh
   application follows `preferences.md` → Worksheets. Do not reject deliberate
   consolidation for lacking novelty;*. The reviewer topic's ledger (RV-L02)
   proposes nothing of its own here and waits for this.
7. **The write-on figure (S01 in PREF, S02 in LD)** meets settled item 16, and is
   question 1 in section 9. Until he answers, S01 and S02 are not touched.

Left unchanged, and why: A01 ("separate fresh work", now exactly his rule), A04
and A16 (the deck carries the lesson), B03 and B06 (fresh evidence; the trace
when the sheet takes the practice's place), A20 (the launch: "a later stage - the
worksheet ... carries the evidence"; his "the sheet is the proof of that"
answers the pull the ledger raised, so the launch topic's note that this
decision changes a launch sentence falls away), I07 (the slide rule that the
board names the sheet and never reprints its questions is exactly "what it must
not do is show the sheet's questions"), R24 (the review page calling the sheet
final work).

Mechanism: none is built. The lesson designer writes both surfaces, and the
review page's class view already prints the beats and then the worksheet in
lesson order (`design-review-packet.py`, `build_class_view`), so the reviewer's
check in item 6 can be run from what it is shown. An exact-repeat cue on the
review page is possible later if runs show repeats; it is not in this release.

Rows: A05, A08, B01, B02, B05, Q02 (S01, S02 by question 1). Tests:
`test_the_lesson_builds_on_what_children_can_use.py` (the "same performance"
sentence stays), `test_brief_absorption_and_unrouted_rules.py` and
`test_lesson_designer_component_loading.py` (B05's kept sentences; A08's kept
clauses). Retired, barred everywhere: "keeping the same useful task, diagram,
labels and response structure is legitimate", "it does not prohibit this
deliberate reuse", "permits a printed alternative using the same task", "A
printed alternative may retain the same task", "a printed alternative may
preserve the same slide task", "or printed reuse for lacking novelty", "including
as the printed alternative described above", "Reusing a task for consolidation
is legitimate".

### Decision 5: a sheet a child could not use goes back; a plainer page is a note

His words: "agree, should probably go back to be redesigned". Settled: a sheet
with a problem a child could not get past as printed goes back to its author to
be redesigned before it prints, while the other sheets are still made; a page
merely plainer than hoped prints with a note to him.

The line already exists in the visual profile (O39: "A clipped zone, a missing
source or a response with nowhere to go is blocking. A page that is merely
plainer than hoped is not"), and the worksheet designer's opening already sends
a poor or misleading brief back through `WORKSHEET_CONTENT_GAP` (P05, F13, E07).
The edits bring the four places that say "note it and carry on" into line.

1. **WSD › Rules that never change, rule 11 (P20).** "**Flag, do not fix.**
   Upstream ambiguity, a contradiction with the LO, something the helpers cannot
   render: add a `notes` entry and carry on." is rewritten as the one line:
   *A sheet a child could not use goes back; a doubt the teacher should hear is a
   note. A problem a child could not get past as printed (a question they cannot
   act on, missing support, a wrong answer, a form or visual no helper can carry
   faithfully) stops that sheet: omit it and return `WORKSHEET_CONTENT_GAP` to
   its owner, and make the other sheets as normal. A page merely plainer than
   hoped, or a doubt the teacher should know about, is a `notes` entry and the
   sheet ships (`worksheet-visual-profile.md` draws the same line).* The owner
   routing stays where it is (P05: Expected to the lesson designer, Below and
   Greater Depth to the adaptation designer).
2. **WSD rule 1 (P16).** "Flag it in `notes` instead." becomes "A question you
   believe is wrong goes under rule 11." The two exceptions and the boundary stay
   word for word.
3. **WSD › How you work (P08).** "Problems go in `notes`, where the orchestrator
   surfaces them to the teacher; a flag written into your reply instead reaches
   nobody." gains one clause: a sheet a child could not use is not a note (rule
   11).
4. **SHARED › Start from what the child does (E08).** "a form you believe is
   wrong is a `notes` entry, exactly like a question you believe is wrong."
   becomes "a form you believe is wrong goes back through
   `WORKSHEET_CONTENT_GAP`, like a question a child could not answer as printed
   (the worksheet designer's rules 1 and 11)."
5. **SHARED, same section (E09).** "Say so in `notes` with the form and the
   sheet, and build the nearest honest thing only where it is genuinely the same
   action." becomes "Build the nearest honest thing only where it is genuinely
   the same action; otherwise return it through `WORKSHEET_CONTENT_GAP`, naming
   the form and the sheet." The teeth-sheet sentence after it stays (a plain
   example, undated).
6. **SHARED › Questions are copied, never rewritten (P24).** "If something
   upstream looks wrong, say so in `notes`." becomes: something a child could
   not act on goes back through `WORKSHEET_CONTENT_GAP`, a doubt the teacher
   should hear goes in `notes` (rule 11). "Do not fix it silently: the sheet then
   disagrees with the board, and nobody finds out until a child does." stays.
7. **GAP (the brief-gap protocol).** Its generic route says "flag the exact
   remaining gap in the artefact's `notes` field, and continue", and "Continue.
   Do not stall ... do not request a re-run", and exempts only the slide
   designer by name (P41, P42). Add a short **Worksheet Designer route**, after
   the Slide Designer route: the continue-and-note route does not govern a sheet
   a child could not use as printed; the worksheet designer omits that sheet and
   returns `WORKSHEET_CONTENT_GAP` (its rules 9 and 11), and the other sheets
   continue. The worksheet example under "How to apply" is decision 6's edit.
   The pointer in WSD › Before you start (P40) stays word for word (a test holds
   "leave unread until the brief asks").
8. **The generated catalogue (P31).** `ENGINE/scripts/build-catalogue.js` lines
   217 to 218, "If a lesson needs something no helper here can express, say so in
   `notes` rather than bending the nearest one to fit." becomes "..., return it
   as a gap (the worksheet designer's rule 11) rather than bending the nearest
   one to fit." Regenerate `catalogue.md` with `npm run catalogue`.

Unchanged and consistent: P05, E07, F13, P19 (rule 9's third rung), P36 (a
`PAGE_PLAN_GAP` stops the worksheets rather than thinning them), O39, P43 (the
playbook: a note does not close a gap for missing support or a wrong answer).

**Code: a teaching gap on a Below or Greater Depth sheet is refused today.**
`ENGINE/scripts/check-worksheet.js`, `checkDirectedSheets`: when the run passes
`--photo-requirements` (the worksheet designer is told to, whenever an adaptation
exists), a directed Below or Greater Depth sheet omitted with a
`WORKSHEET_CONTENT_GAP` note that names no photo ref fails
`CONTENT_GAP_UNFOUNDED` ("names no photo ref, so the claim cannot be checked").
So decision 5 cannot be followed for those sheets at all. Change: a note that
names no photo ref **and does not claim a picture** (no "photo", "picture",
"image" or "visual" in it) is a teaching gap: it stands, with the same warning
the absent-ref case prints ("the gap stands and goes back to its owner"). A note
that claims a picture and names no ref is still refused, which keeps the case
the check was built for (a Below sheet dropped because its pictures "had not
arrived"). Tests in `ENGINE/test/directed-sheets.test.js`: a teaching gap on a
directed Below sheet stands; a picture excuse with no ref is still refused; the
existing four tests unchanged. The Expected sheet keeps `EXPECTED_SHEET_MISSING`
failing on purpose, which is what routes it back (its comment says so).

Rows: P20, P16, P08, E08, E09, P24, P31, P40 (unchanged), P41 and P42 (the new
route beside them), R16 (the check). Retired: "**Flag, do not fix.**", "add a
`notes` entry and carry on", "Flag it in `notes` instead", "is a `notes` entry,
exactly like a question you believe is wrong", "Say so in `notes` with the form
and the sheet", "If something upstream looks wrong, say so in `notes`", "say so in
`notes` rather than bending the nearest one to fit" (programs included).

### Decision 9: producing is chosen when it moves the objective on

His answer: yes. The suggestion: producing is chosen when it moves the objective
on; making up their own values is one option, not the default; maths keeps its
lean towards the child producing the maths.

- **PREF › What the sheet is for, "Practice can have the child produce the work"
  (D09).** "Reach for them by default on repeatable practice, falling back to a
  set list of questions only when generating would change the skill or there is
  no natural generator." becomes "Choose one when producing moves the objective
  on; making up their own values is one option, not the default. In maths the
  lean is towards the child producing the maths (`subject-maths.md` → Making
  practice generative)." The paragraph's first four sentences stay. Its last
  sentence is settled item 11's pointer fix.
- Unchanged and now in agreement: D08 (LDC: "it is not an additional task every
  worksheet needs"), G18 ("Do not make generation the default"), G29 (maths
  prefers the child producing the maths), D22, D23.
- Rows: D09. Retired: "Reach for them by default on repeatable practice".

### Decision 10: a method's steps on a sheet

His answer: yes. The suggestion: no criteria panel and no list of the method's
steps printed as a reference; a fill-in frame the child writes into, and steps a
task needs, may print; the engine's message says the same.

- **The home: PREF › Worksheets › The printed page, the paragraph "A step list a
  child must work *through*" (O09).** Add one sentence after its first: *A
  method's steps are not printed as a list for the child to consult; a fill-in
  frame the child writes into (`method-frame` in maths) is a question, and steps
  a task needs worked through belong to their question.* It says nothing about
  where else the steps are shown: the decision did not, so the sentence must not
  claim they are on the board. Everything else in O09 stays (a test and the SC
  pins hold it; the SC pin row moves with this decision recorded).
- **WSD rule 13 (J03).** After "nothing on the page reprints them, as a panel or
  as a list", add: *nor is a method's steps list printed for the child to
  consult (`preferences.md` → The printed page); a fill-in frame the child
  writes into, and steps a task needs worked through, print with their
  question.* "A one-line job statement for a reference under rule 12 is not a
  criteria panel." stays.
- **WSD › Final preflight (J05).** "Confirm no success criteria are printed, as
  a panel or as an instruction carrying a list." gains "or a method's steps
  printed only to consult".
- **Engine message, `ENGINE/src/helpers/text.js` (`INSTRUCTION_IS_A_LIST`, R13).**
  Its first branch, "If they are the lesson's success criteria, leave them off:
  they stay on the board and are never printed on a worksheet", stays, and a
  sentence after it leaves off **a method's steps listed only for the child to
  consult** too, without saying where they are shown instead (only the criteria
  are known to be on the board); the second branch (steps a child works through go with their question, one to
  a line, or in maths `method-frame`) and the third (questions) stay. The
  `CRITERIA_NOT_ON_SHEETS` message in `render.js` (R12) is unchanged: it refuses
  only the `steps` panel.
- **Barred wording to avoid.** The SC pins bar, everywhere including programs,
  "or the steps of its method, leave them" and "Success criteria, and a method's
  steps, stay on the board" (SC-N14). The new wording must not use either
  string; the SC mapping records decision 10 against N14's rows so a checker
  sees why "a method's steps" is back, bounded to "printed only to consult".
- Unchanged: J14 and J15 (the maths fill-in frame), G24 (`method-frame` when the
  steps are named), J16 (the Below "Holding the steps" dial, which reads as the
  task chunked, as the SC fourth check found), J17 (`complete-the-model`).
- Tests: `ENGINE/test` gains one on the message's words (both branches present,
  neither barred SC string present). Rows: O09, J03, J05, R13.

### Decision 13: the cases vary, not the forms for their own sake

His answer: yes. The suggestion: each question takes the form its thinking
needs, and the cases vary, not the forms for their own sake.

- **PREF › The printed page, "A worksheet should look like a purposeful
  children's activity" (O11).** "and enough variation in response type to make
  the thinking visible" goes; a sentence is added: *Each question takes the form
  its thinking needs, and what varies is the cases, not the forms for their own
  sake.* "A title followed by a long numbered list and answer lines is a warning
  sign even when the prose is colour-coded." becomes "A long numbered list with
  answer lines that was never chosen is a warning sign, even when the prose is
  colour-coded": "A title" is stale (settled item 11), and "never chosen" is
  E05's own limit in the same section ("The fault is the list that was never
  chosen"), which the old sentence contradicted for maths fluency. "Colour is for
  navigation and support, not decoration" and the last sentence stay.
- Unchanged and now in agreement: E03, E05, E26, O16, G22.
- Rows: O11. Retired: "enough variation in response type to make the thinking
  visible", "A title followed by a long numbered list".

---

## 2. The settled items (his "y" to a to o)

**a (settled 1). When a sheet may lean on the board.** His 23 September ruling
("worksheets are not homework, worksheets are delivered in class all the time")
and his preferences' "while they work".
- PREF › Support, Checking and Release (I01): "A separate worksheet need not
  duplicate a reference that remains accessible, but a resource intended for use
  on its own cannot assume an unseen board." becomes "A worksheet need not
  duplicate a reference the board or the working wall shows while children
  work: every sheet is done in class." AK and SC pins move.
- WSD › 4. Trust the refusal, rung 3 (I04): "when the same thing is on the board
  or the working wall throughout the lesson" becomes "while they work on the
  sheet"; "the child demonstrably meets it elsewhere in this lesson, which you
  establish from the lesson design's own slides, representations or
  working-wall entries rather than assuming it" becomes "the board or the working
  wall shows it while they work on the sheet, which you establish from the lesson
  design's own slides, representations or working-wall entries rather than
  assuming it". The "never yours to drop" list and the `notes` line stay word for
  word. AK and SC pins move.
- REV › 4. Language, load and teacher usability (I05): "check the planned shared
  access before making a finding; do not assume either that nothing is available
  or that the board will always be there" becomes "check whether the board or the
  working wall shows it while children work before making a finding (every sheet
  is done in class)". AK pin moves.
- Unchanged: I03 (already "while they work"), I15 (its three reasons are about
  representations; I03 and I04 are about a reference to consult, and I04 already
  separates the two), I17, C03, F11, J06.
- Not touched, and named so a checker does not read them as missed: C01's
  "made self-contained, and carries the framing a child needs when no teacher is
  talking them through it" and F01's "self-contained enough that a child knows
  what to do". Both are about wording a child reads alone at the table, which
  his ruling does not change; neither says the board is absent.

**b (settled 3). The sheet and the lesson's minutes.** A sheet is never set for
another time and never added on top: its time is inside the 45, either the beat
it replaces or the independent work the slides leave room for. No routine is
written in, and nothing new is built to count it.
- LD › One Completion Pass, the "Classroom sequence" bullet (A18): "Explain where
  an optional worksheet fits and what it replaces if used within the lesson; do
  not budget it as compulsory extra work or leave the teacher to infer the
  substitution." becomes "Say where the worksheet's time sits inside the lesson:
  the beat it replaces, or the independent work the slides leave room for. It is
  never set for another time and never added on top of a full lesson; do not
  leave the teacher to infer the substitution." The AK and TD pins hold this
  whole bullet list; both move.
- REV › 5 (Q08): "Count only work expected in the lesson against its duration; an
  optional sheet does not automatically need extra minutes, but a proposed
  replacement must preserve the intended learning and evidence;" becomes "the
  sheet's time sits inside the lesson's minutes, in the beat it replaces or the
  independent work the slides leave room for, never set for another time or
  added on top; a replacement must preserve the intended learning and
  evidence;".
- Nothing goes into the maths file's sections: its test bars classroom-routine
  words there (I18). The validator's minutes check is not touched (R10, R27).
- Retired: "do not budget it as compulsory extra work", "an optional sheet does
  not automatically need extra minutes".

**c (settled 4)** is merged into decision 2.

**d (settled 6). "Ask it plainer".** The summaries say what rule 9 says: compose
from existing helpers first, never write a replacement question, and a question
no helper can carry faithfully goes back as a named gap (decision 5 makes the
gap a return, not a note).
- SHARED › When nothing fits (P25): "the short of it is **change how a question
  is asked, never whether**. Compose from existing helpers first ..., then keep
  the question's words and ask it plainer, and only a question that cannot be
  asked honestly at all goes in `notes` as a named gap." becomes rule 9's own
  words: compose from existing helpers first (the catalogue is bigger than its
  names suggest), never write a replacement question, and return a question no
  helper can carry faithfully through `WORKSHEET_CONTENT_GAP`. "Never bend the
  nearest helper into a shape it does not draw" stays. The "seven published
  worksheets" story leaves (section 4); "Flagged gaps are how helpers get
  built" stays as "A returned gap is how the next helper gets built".
- WSH › When nothing in the catalogue fits (P26): the same rewrite and the same
  story out.
- GAP › How to apply, the worksheet-designer example (P28): "then keep the
  question's words and change how it is asked rather than whether, and flag in
  `notes` only a question that cannot be asked honestly at all" becomes "never
  write a replacement question, and return a question no helper can carry
  faithfully through `WORKSHEET_CONTENT_GAP`, omitting that sheet while the
  others continue". The list item at GAP L51 ("The brief specifies a worksheet
  question shape no helper supports.") stays.
- The four narrow exceptions stay word for word: WSD rule 1's bold label and
  lifted heading (P16), step 2's position fix (P11), step 3's split at a sentence
  boundary (H17).
- Retired: "keep the question's words and ask it plainer", "then change how the
  question is asked and never whether", "flag in `notes` only a question that
  cannot be asked honestly at all", "only a question that cannot be asked
  honestly at all goes in `notes`".

**e (settled 7). A card kit.** LD › Printed extras (A17): "and the main task does
not automatically get a worksheet as well" becomes "and the sort is not repeated
on the lesson's worksheet". The test's phrase ("A kit the beat depends on is part
of the lesson, not a bonus sheet") stays. Retired: "does not automatically get a
worksheet as well".

**f (settled 8). A picture that will never arrive.** His 2 September review:
"may re-point a dead reference at a published picture, never replace it with a
sentence saying what it showed". Re-pointed at another published picture or a
drawing the engine makes, never at words; if neither can carry it, it goes back
to the lesson designer.
- WSD › 1. Work out what goes on it (P10): under `unavailable`, "treat every
  affected ref as a required visual with no usable picture, apply the rule
  immediately below" gains the first move: re-point the question at a picture
  this run has published or a drawing the engine makes; never at words; only when
  neither can carry it does the rule below apply (omit the sheet and return
  `WORKSHEET_CONTENT_GAP`). "Never invent, substitute or quietly rewrite the task
  as text because of it." stays. The permission is scoped to a picture that will
  never arrive, in the same words the repair uses ("Any other picture stays
  exactly as it is"), because the opening's "Do not ... replace a required photo"
  (P02) stands for every other picture.
- REPAIR › Scope (P23): "Re-author that single reference against what actually
  exists: a picture this run has already published, a supported helper, or a
  task that carries its own demand in words and the child's own drawing."
  becomes "Re-point that single reference at a picture this run has already
  published." The "in words" boundary sentence goes with the route it bounded;
  its last clause stays in substance: if no published picture can carry it,
  leave it unrepaired and say it needs the lesson designer, naming the engine
  drawing that could carry it. "Keep the learning that reference was serving",
  "change nothing else" and "Any other picture stays exactly as it is" stay (a
  test holds all three). The file stays under its 8,000-byte cap (it shrinks).
  Why the repair does not make the drawing swap itself: see Risks, item 5.
- BUILDER › `IMAGE_MISSING` row (P33): "the worksheet-designer re-authors that
  one reference instead" becomes "re-points that one reference at a published
  picture, or hands it back for the lesson designer". The test that holds the old
  phrase moves (`test_unavailable_picture_route.py`).
- PB › Track B (P32): "telling it the filename is terminally unavailable and that
  re-authoring that one question against what exists is the repair" becomes
  "... and that re-pointing that one reference at what exists is the repair".
  Shorter, so the playbook's 77 KiB cap holds. The test phrases ("Reconcile before
  building", "loses all three and the answer key", "the repair, not a scope
  breach") stay. P48 already says "re-points". This line is the playbook's
  (topic 10); that release must re-read it.
- **Code: the founded-gap check has no view of the terminal receipts** (R16; the
  log's 18 September run notes: "The gate should consult the terminal
  receipts"). Today a designer told the picture stage failed, who omits a Below or
  Greater Depth sheet over a ref that is in the contract, is refused
  `CONTENT_GAP_UNFOUNDED`. Change `checkDirectedSheets`: read
  `orchestration-receipts/picture-terminal/*.json` beside the spec (the same
  reading `working-wall-packet.py`'s `terminal_states` does: `filename` to
  `terminalState`), map each named ref to its filename through the contract, and
  let the gap stand when every named ref's receipt is `unsatisfied` or
  `omitted`. A `published` receipt, or no receipt, still refuses. To verify at
  the change: whether `PICTURE_STAGE: unavailable` writes receipts at all. If it
  does not, add `--picture-stage` to the WSD's gate command (the
  `check-worksheet.js` block near the end of the file, beside `--adaptation` and
  `--photo-requirements`) and accept `unavailable` there. Tests in `directed-sheets.test.js`:
  terminal receipts let the gap stand; a published receipt still refuses; no
  receipt still refuses.
- Unchanged and consistent: P34, P37, P48, P49, P50, P51, R26 (the scope check).
- Retired: "or a task that carries its own demand in words and the child's own
  drawing", "One boundary on \"in words\"", "the worksheet-designer re-authors
  that one reference", "re-authoring that one question against what exists".

**g (settled 11). Out-of-date text, thirteen places, no rule changes.**
- PREF O02: ", and a compact child-facing title" goes (the sentence ends
  "readable type and usable writing or plotting space.").
- PREF O12: "Keep a compact title, one quiet accent" becomes "Keep one quiet
  accent".
- PREF O36 (Classroom Norms): "in the lesson design, worksheet headers, and spoken
  teacher orientation" becomes "in the lesson design and spoken teacher
  orientation". The rest-of-preferences ledger lists the same line (PF-F07).
- LD O37 (Date + LO): "used in internal planning, worksheet headers, orientation"
  becomes "used in internal planning and orientation" (PF-F72 lists it too).
- WSD O33 (step 4): "The compact title and sheet code use the existing top printer
  margin and do not take space from the zones." becomes "The sheet code uses the
  top printer margin and takes no space from the zones."
- WSH O34: the `lesson` row "required. Prints on every sheet." becomes "required.
  Names the lesson in the file; never printed."
- `ENGINE/scripts/build-layouts-doc.js` L148 (O35): "the band the learning
  objective and sheet code sit in" becomes "the band the sheet code sits in";
  regenerate `worksheet-compositions.md` with `npm run layouts`.
- LD C06: "Leave `resourceMode` unset for a per-child sheet" becomes "Set
  `resourceMode` to `per-child` for a child's own sheet" (the test phrases in the
  paragraph stay).
- PB A12 (Edge cases): "; an unexplained `not-needed` decision is a design
  fault" goes (shorter; the validator refuses anything but the two values). The
  playbook ledger lists it (PB-U03).
- PREF A06: the last paragraph of What the sheet is for becomes a true pointer:
  how a generated sheet is designed lives in `lesson-designer-components.md` →
  Generated worksheet, which the lesson designer loads for a generated sheet, and
  the lesson designer's own Worksheet section records it. "and it is the only
  place that judgement lives" becomes "and this is its home" (A08 now points
  here rather than restating it).
- PREF D09's last sentence: "The operational moves for briefing them live in the
  lesson-designer Worksheet section" becomes "live in
  `lesson-designer-components.md` → Generated worksheet".
- R13: already corrected in the SC repairs; nothing to do.
- `ENGINE/test/doc-claims.test.js` L27 to L28: the comment naming two sentences
  that no longer exist ("A small picture beside a word is cheap", "a
  picture-and-word bank are cheap") is corrected to what the test measures.
- Found alongside and done with them: REV Q11 says "every sheet counted on 12
  September 2026" where the log and E02 say "between 5 and 12 September". The
  reviewer topic's settled item 11 takes Q10's and Q11's stories out of the
  reviewer altogether, so this plan leaves Q10 and Q11 to that release.
- Retired: "compact child-facing title", "Keep a compact title", "The compact
  title and sheet code", "Prints on every sheet", "the band the learning
  objective and sheet code sit in", "worksheet headers", "Leave `resourceMode`
  unset", "an unexplained `not-needed` decision", "The operational moves for
  briefing them live in the lesson-designer Worksheet section", "How one is
  generated lives in the Worksheet section of the lesson-designer agent", "and it
  is the only place that judgement lives".

**h (settled 12). One home for the rules.** See section 3 for the homes. The
folds this release makes are the copies read by the same reader:
- **WSD's restatement of the printed page** (WSD › Worksheet Designer, from
  "**That holds across columns too" to "Neither child could start."; rows O20 in
  part, O50, O21, and the 31 August paragraph). The WSD reads PREF › Worksheets
  in full before it starts (its Before you start list), and composes at step 3, a
  later moment, so the copy becomes a pointer that keeps each rule's both halves,
  not a bare pointer. It keeps, one sentence each: the top-left corner belongs to
  whatever the questions read from, and where support a child only glances at
  goes (the right-hand column or a band below) is latitude; what sends something
  to the back is whether a child could answer without it, so a definition, a
  sentence starter the answer is written into, a word bank the answer is chosen
  from and a step list worked *through* sit with their question, above the
  writing space; a stimulus and the questions that read it share a column,
  stimulus first, and a lettered set is one block. And it keeps O20's four
  extras whole: support is never exiled to another zone for a fit, a shared panel
  carries its one job line (`Look at these photographs.`), the cross-the-page
  test, and sequential material ahead of its question. The phrases
  `test_reading_order_on_the_page.py` holds in the WSD ("Support a child glances
  at while working", "sometimes a band below", "latitude", "top-left corner", "a
  step list worked *through*", "could do without it, not what kind of thing it
  is", "reminder of a method they have already used", "sentence starter the
  answer is written into", "word bank the answer is chosen from") stay in the
  pointer, with "a child who never read it could still produce an answer", so
  that test should not need to move; if a phrase does move, its test
  moves with a reason. The 31 August ruling's paragraph goes from the WSD (his
  ruling stays in PREF exactly, O07); the WSD's "carries the decision and the
  superseded panel-on-the-right arrangement it replaced" becomes "carries the
  decision". The two cases in O21 (the sentence start printed under its own
  line; `continuity = stayed similar` at the foot of the page) go to the log, and
  the first moves into PREF O09 as one plain, undated example.
- **WSD step 5, books or sheet (K12, K20).** It restates BOS nearly whole. It
  becomes: set `recording` and `recordingReason` once the sheet's content is
  settled; read `books-or-sheet.md` at this step, the first time in a run, and
  follow it (the reason it gives stays: the same number line is `"books"` in
  Year 4 and `"sheet"` in Year 2); decide each level on its own sheet, and treat
  the mark as a report on the sheet you built, never a target; on a books sheet,
  mark a figure the children draw for themselves `"onSlip": false`. The copies of
  the test, the reason line and the blank-is-not-a-page paragraph go; K20's
  version, which lacked the copying-cost limb, goes with them. The SC pin on the
  BOS path stays.
- **WSD › Representations and support (L06)** is settled item j's edit.
- **WSD › How the resource variants relate (O24)**: "Every generated sheet keeps
  usable response space. If the complete authorised content does not fit, follow
  the fit-priority route rather than independently removing learning." goes;
  the opening (E14) and step 4 (P36) say both in the same file.
- **LDC O18**: "**Normally one page per resource version.** ..." becomes a pointer
  that keeps its one extra: one page per sheet and the two-page exception are
  `preferences.md` → The printed page's; when the exception applies, state the
  eligibility and protect the visual. The component-loading test holds "Two pages
  only when the central task needs a substantial write-on visu..."; it moves to
  PREF O02's words, with a reason.
- **OT N03**: "Use `[]` when nothing may be removed." gains O04's condition:
  "Use `[]` only when nothing may be removed and the priced set already fits."
  (A copy that dropped a condition brought into line.)
- **Not folded here, and why.** The reviewer's worksheet checks (Q01 to Q17)
  stay as the reviewer's own checklist: the reviewer is sent to PREF › What the
  sheet is for only when in doubt (the routing card), so its one-line checks are
  what it reads; only the decisions above change them. The adaptation designer's
  internal repeats (C10 and C11, F29 and F30, L07 and L11, L12 and L13, L20
  written four times, L36 and L37, O25, O41 to O43, J10 and J12, P50 and P51)
  are topic 9's, which lists the adaptation designer after this. The page
  mechanics repeats in SHARED and WSH (E16, E24, I11, H11, K13, K14, O44) are
  topic 9's too. The build-log entry says so, so "written once" is not claimed
  for them.
- The subject-file guide's line that a subject file says nothing about worksheets
  goes with the whole guide in the subject-files release (his "just remove it
  completely").

**i (settled 14). A reference several questions use.** WSD (O20): "The pointer
line of rule 12 is for a reference that genuinely serves several questions, and
that reference sits earlier in reading order than the first question using it."
becomes: the pointer line is for a reference several questions use, and it sits
where the printed page's test puts any support: before the first question that
reads from it, after the work when a child only glances at it. O09 is unchanged
(it already carries the test in his words). Retired: "sits earlier in reading
order than the first question using it".

**j (settled 15). Who shapes the Below and Greater Depth sheets.** The
adaptation designer records what is given, blank and built on each sheet, and
the sheet designer realises it.
- WSD rule 10 (C07): "the worksheet IS that frame across all pupil sheets"
  becomes "the worksheet IS that frame on every pupil sheet, unless the adaptation
  records a different surface for a variant".
- SHARED (C12): "The below sheet hangs a `hint` and a `wordBank` on the fields
  that need one" becomes "... on the fields its adaptation names". The rest of
  the paragraph, including "never a stretch block bolted underneath" and the
  sentence on scaffolding the child's own choice (L44), stays.
- MATHSH › Place value (L50): "and keep the chart on the Below sheet when removing
  it would remove access rather than fade a scaffold" becomes "and the Below
  sheet keeps the chart when its adaptation keeps it, because removing it there
  would remove access rather than fade a scaffold".
- WSD › Representations and support (L06): the four bullets that describe
  support calls ("Greater Depth may retain or add a support ...", "Below receives a
  pre-drawn representation when ...", "a light preference towards retaining ...")
  become one sentence: realise the support each sheet's adaptation records (given,
  blank, built; kept, changed or removed), and add, keep or remove none on your
  own judgement. The rules themselves stay in ADAPT (L36, L37, D11), so the
  retired phrases are barred in WSD only.
- Unchanged: L36, L39 (settled item m trims it), P06, P14.

**k (settled 16). A figure a child writes on.** Question 1 in section 9: it
meets decision 2. Not changed until he answers.

**l (settled 17). When several parts make one question.** LDC › Generated
worksheet (H12): "Several parts may share one main question when use one
decision rule, one central stimulus or one dependent answer route. Shared
picture/topic/context not enough when actually separate assessment job; start
new question." becomes "Several parts share one main question only when they
are one job: one decision rule or one dependent answer route. A shared picture,
stimulus, topic or context is not enough when each part is a separate
assessment job; start a new question." (The file's clipped style kept.) H10,
H13, H14, H15 unchanged. Retired: "one central stimulus".

**m (settled 18). Who checks the Below and Greater Depth sheets.** ADAPT › 5
(L39): "That is what the worksheet designer realises and what the reviewer
checks;" becomes "That is what the worksheet designer realises;". Nothing
replaces it (the reviewer topic's settled item 9 agrees). Retired: "and what the
reviewer checks".

**n (settled 19). How many questions.** WSD rule 7 (P17): "A flat list commonly
has up to six standalone questions; that is not permission to trim a table,
sort, matched set or other grouped activity to six cells." becomes "How many
standalone questions a maths sheet holds is `subject-maths.md`'s (three to six is
often enough, not a cap); other subjects have no number. Neither is permission to
trim a table, sort, matched set or other grouped activity." G01 and D19
unchanged. Retired: "commonly has up to six standalone questions".

**o (settled 20). The digit box and the books mark.** His 19 September ruling:
one digit box does not make a write-on sheet. The word list becomes a prompt to
look again, not a verdict.
- **Code today:** `ENGINE/src/slips.js` `recordingProblems` raises
  `RECORDING_NEEDS_SHEET` for any page-only word on a `"books"` sheet (its list
  catches "in the box", "in the boxes", "in the gaps", "tick", "label", "fill in"
  and more); the preflight (`check-worksheet.js`) fails on it, and the build
  (`build-worksheet.js`) turns the sheet into `"sheet"` and prints
  `RECORDING_CHANGED`. So `Write the missing digit in the box.` makes a sheet
  `"sheet"` against his ruling, at both stages.
- **Change:** the word check leaves `recordingProblems` for its own advisory
  list, renamed `RECORDING_LOOK_AGAIN` (the old name states a verdict; the name
  is read only by these three files, their test and BOS). The preflight prints it
  as a warning naming the words and the question, and saying: look at that
  question against `books-or-sheet.md`; a small blank a child copies into a book
  in seconds keeps `"books"`, and saying so in `recordingReason` quiets this; a
  printed thing the child cannot reproduce makes it `"sheet"`; never reword the
  question. The advisory is quiet when `recordingReason` names the flagged
  words (the way the orientation advisory is quieted by a note). The build keeps
  its correction to `"sheet"` only for an advisory the reason does not answer,
  so a books sheet nobody looked at still never prints slips that ask a child to
  circle something they do not have.
- **BOS › What the build checks (K15)** is rewritten to say that; the digit-box
  paragraph (K05) and its ruling stay exactly (settled item h names it). WSD step
  5's pointer covers the designer's side.
- Tests (`ENGINE/test/slips.test.js`): "a books sheet whose words need the
  printed page is caught" becomes "... is flagged to look again" (advisory, not a
  problem); new: the reason naming the words quiets it; the build keeps an
  answered `"books"` and still corrects an unanswered one; `Write the missing
  digit in the box.` with an answering reason stays `"books"`. Retired, programs
  included: `RECORDING_NEEDS_SHEET`, "marks a sheet `\"sheet\"` whatever it was set
  to", "The preflight refuses the contradiction as".

---

## 3. The homes, afterwards

| What | Its one home | Copies that stay as pointers, keeping their conditions |
|---|---|---|
| What a sheet is for; its relationship to the slide practice (decision 2); the two kinds; producing (decision 9) | PREF › Worksheets › What the sheet is for | LD › Worksheet (A08's clause), LDC (B03, B05), REV › 5 (Q02, the reviewer's checklist) |
| The printed page: one page, pricing, reading order, columns, support after the work, a method's steps (decision 10), the look (decision 13) | PREF › Worksheets › The printed page | WSD opening (the pointer keeping both halves and O20's extras), WSD rules 13 and 14, LDC (O17, O18), ADAPT (O25, O41, O42: topic 9) |
| When a sheet leans on the board (settled 1) | PREF › Support, Checking and Release (I01) with The printed page (I03) | WSD step 4 rung 3 (I04), REV › 4 (I05) |
| The sheet's time (settled 3) | LD › One Completion Pass (A18) | REV › 5 (Q08) |
| Designing the activity, the response form, grouping parts (settled 17) | LDC › Generated worksheet | OT (mechanics), WSD rules 7 and 10 |
| A maths sheet: sections, wording, how many (settled 19) | `subject-maths.md` | WSD rule 7, MATHSH |
| Books or sheet (settled 20) | BOS | WSD step 5 (pointer keeping "never a target" and the trigger) |
| Below and Greater Depth: what is given, blank and built (settled 15) | ADAPT (L39) | WSD rule 10 and › Representations and support, SHARED (C12), MATHSH (L50) |
| Realising faithfully; what goes back and what is a note (decision 5); nothing fits (settled 6) | WSD rules 1, 9 and 11 | SHARED (E08, E09, P24, P25), WSH (P26), GAP (its new Worksheet Designer route, P28), the generated catalogue (P31) |
| A picture that never arrives (settled 8) | WSD step 1 (P10) at design; REPAIR (P23) after | BUILDER (P33), PB (P32, P48) |
| The reviewer's worksheet checks | REV › 5 | none |

---

## 4. Stories

His standing rules: stories leave, reasons stay; a case that makes a rule clear
may stay as a plain example; his rulings keep his words without their dates;
his calibrating examples stay exactly. Settled item h, which he confirmed, names
the examples that stay exactly: the partitioning sheets he approved, his column
rulings, the Classroom Secrets endings and his digit-box ruling. Where the
ledger's stories table said "undated" for the column rulings, the confirmed
item wins: O07, O15, O38 and K05 stay exactly, dates included, and the log
gains each date and his words.

**Copied to the log first** (script `w1_stories_first.py`, one "Stories kept
here" block in this release's entry, as 4.2.288 did), before any runtime text
moves: B05 (appliances described in words), E15 (the three-centimetre tail; the
child who copied the whole stem), F02 (the exam-voice Year 4 sheet; voice topic's
text, copied only), F08 (`Name:` and `The job:`), F13 (the Greater Depth diet
sheet's words), H07 (the sheet numbered 1, 2, 6), I12 ("To ex" and "To id"),
L17 (three sets mixed in one week), L30 (Below lost `balanced`), L31 (five
two-digit questions), O07 and O20 (29 and 31 August, his rejections), O08 (the
superseded evidence panel), O15 and O38 (6 September, "Yes that looks incredible
and premium."), O21 (the sentence start under its line; `continuity = stayed
similar`), O28 (the 209mm rectangle), P11 (`look at 92 + 10 in the chart
above`), P32 (the buzzer photograph that cost the pack, now only in a test's
docstring), P37 (the two-row table, and that it was a slide), P39 (`bread roll`
and `egg` as blank lines), I07 (the history deck's three questions under "answer
the three questions on your sheet"), and the "seven published worksheets" that
could not be built.

**Leaving the runtime in this release** (each keeps its reason): E02's count
(LDC: "Eleven sheets built between 5 and 12 September 2026 were counted ..."; the
reason stays, that the choice was made by default and nobody could see it,
because `response` was free text; the *name the layers of teeth* sentence stays
as a plain, undated example; `test_the_form_of_the_answer_is_chosen.py` holds the
dated sentence, and that assertion moves to the log); I12 (WSH: "(Dropped 8 September 2026, after two packs
shipped ...)"); H07 (WSH: "This exists because a real sheet came out numbered 1,
2, 6 ..."; the reason is H06's in the same reader); O08's history (PREF: "This
supersedes the earlier ... That is the shape he rejected."; its last sentence, a
live rule, stays); K02's date only (BOS: "(16 September 2026)", a
reason's date); the WSD's 31 August paragraph and O21's two cases (with the
fold); the "seven published worksheets" sentences (SHARED and WSH, with settled
item d); the REPAIR's "in words" boundary (with settled item f).

**Staying as plain, undated examples** (copied to the log): B05, E15, F08, F13,
P11, E17's tooth cutaway, E02's teeth sheet. O09's 1 September PSHE ruling stays
as it is, date included: it may be one of "your column rulings", and when unsure
it stays.

**Left for their own topic's release** (copied to the log now, runtime text
untouched): L17, O28, P39 (topic 9, page mechanics), L30, L31 (topic 9,
adaptation), I07 (slides), F02 (voice), G09's date (the subject-files release's
settled item 10), Q10 and Q11 (the reviewer release's settled item 11).

---

## 5. Order of work, and the scripts

All in `streamline-tools/ws-change/`. Every scripted replacement asserts its old
text appears exactly once; files keep their Windows line endings; scripts are
written with the Write tool, not heredocs. Any paragraph this release rewrites
loses its em and en dashes (a spaced hyphen, a colon or a comma, as his
CLAUDE.md asks); paragraphs it only moves or leaves are not re-punctuated.

1. `w0_sheet_census.py` and the two baselines (section 0).
2. `w1_stories_first.py`: the log copies (section 4). Check each by script
   (`scratch/ws_log_check.py` already exists for this) before step 3.
3. `w2_preferences.py`: PREF (decisions 2, 9, 10, 13; settled a, g, h's O21
   example and O08; stories).
4. `w3_designer.py`: LD, LDC, OT (decision 2; settled b, e, g, h's O18 and N03,
   l; E02).
5. `w4_worksheet_designer.py`: WSD (decisions 5 and 10; settled a, f, g, h's two
   folds and O24, i, j, n), REPAIR and BUILDER (settled f). Run the suites here:
   this is the step most likely to move a test.
6. `w5_references.py`: SHARED, WSH, MATHSH, BOS, GAP, ADAPT's L39 (decision 5;
   settled d, g, j, m, o's text; stories).
7. `w6_reviewer_playbook.py`: REV (I05, Q02, Q08) and PB (A12, P32). Check the
   playbook's measured size stays under 77 KiB.
8. `w7_engine.py`: `check-worksheet.js` (the teaching gap and the terminal
   receipts), `slips.js`, `build-worksheet.js` and `check-worksheet.js`
   (`RECORDING_LOOK_AGAIN`), `text.js` (the message), `build-catalogue.js`,
   `build-layouts-doc.js`, the doc-claims comment; then `npm run catalogue` and
   `npm run layouts`, and diff the two generated files: only the intended lines
   may change.
9. `w8_tests.py`: the moved and new tests (Python and engine), each with a
   docstring saying which decision moved it.
10. `w9_repin_other_topics.py`: the other topics' pins whose words this changes,
    each with the decision recorded, as the SC release did: **assumed knowledge**
    (A18's bullet list, I01, I04, I05, J03), **success criteria** (I01, I04,
    J03, J05, O09, O21; and the WHY for SC-N14's barred phrases under decision
    10), **quick checks** (B02's "Reusing a task for consolidation"), **the
    rhythm** (A18's bullet list). Vocabulary's pins are untouched.
11. `build_ws_mapping.py` on `ledger_mapping.py`, writing
    `plans/2026-09-24-worksheets-mapping.md`,
    `scripts/tests/worksheets_ledger_pins.json` and
    `scripts/tests/test_worksheets_ledger_is_kept.py`. `ledger_mapping.py`'s path
    pattern reads only `agents|references|skills|commands|scripts|builder`; this
    topic has 13 rows in `worksheet-html/`, so the pattern gains `worksheet-html`
    (a one-line change to the shared tool; rerun the earlier topics' mapping
    builders afterwards to prove their output is unchanged). Pins: every row in
    its section; whole paragraphs for changed rows; the homes of section 3 in
    exact paragraph order; the retired phrases of sections 1 and 2 barred
    everywhere (programs included), except those that live on in ADAPT, barred
    in WSD only.
12. The build-log entry (`w10_log_entry.py`), true to what shipped, with its
    "Not done yet, and named" (section 7's open items); both `plugin.json` to
    4.2.290.
13. `run-all-suites.sh ws-after`; saved designs compared (none should change:
    this release does not touch the validator); the sheet census compared, and
    every new or lost signal explained (expected: `RECORDING_NEEDS_SHEET`
    refusals become `RECORDING_LOOK_AGAIN` advisories; no other change).
14. Two independent checks, and a narrow third for the engine code (the SC
    release needed four once engine code changed). Then report to him, and ask
    how he wants the before-and-after lessons run (Codex, after copying the
    delivered deck).

---

## 6. Risks

1. **The fold of the WSD's printed-page copy could soften a rule.** A pointer that
   paraphrases tends to keep the half that permits and drop the half that limits.
   The pointer must carry both halves of each rule (the corner is firm, the side
   is latitude; need decides, with its four "part of the question" cases; the
   column rule; O20's four extras) and is pinned whole. The first check attacks
   exactly this.
2. **Decision 2's narrowing is a line, and the one place a question appears on
   both surfaces.** "Same useful task" goes; "diagram, labels and response
   structure" stay, with the sheet's own questions. The PSHE case (the one
   question the lesson worked towards) is the one place the board may pose a
   question the sheet carries; the words say it is answered once, on the sheet.
   A checker should read the new B01 against his words, not against the old
   permission.
3. **Decision 10 meets the SC pins.** SC-N14 bars two phrases about a method's
   steps everywhere; decision 10 brings "a method's steps" back, bounded to
   "printed only to consult". New wording must avoid the barred strings, and
   the SC mapping must say why the idea returned. The engine still refuses only
   the `steps` panel and a three-line instruction: a steps list typed into a
   question's prompt or `support` is caught by no program, only by the
   designers.
4. **Decision 5's route for Below and Greater Depth rests on the run reading
   notes.** After the code change, a returned Below or Greater Depth sheet passes
   the preflight with a warning; the playbook's "Read the returned ... resource
   notes" (P02) and the worksheet designer's owner routing (P05) send it back.
   The playbook's settled item k, which writes that routing into the playbook, is
   topic 10's. The Expected sheet is enforced by code. And the narrowed
   `CONTENT_GAP_UNFOUNDED` must still refuse a picture excuse with no ref:
   tested both ways.
5. **Settled item f needs a mechanism the repair does not have.** The quick repair
   runs `check-repair-scope.py`, which counts the picture object itself; swapping
   a picture for an engine drawing reads as lost content, and the log's 22
   September "Part D" entry records that loosening this check is the change most
   likely to lose what it protects. So the plan does not loosen it: the quick
   repair re-points at a published picture, and when only an engine drawing
   would do, it names the drawing and hands back, and the lesson designer's
   content-gap pass (settled item f's own fallback, P34) can choose it. The
   creation-mode designer may choose an engine drawing itself. Who makes the
   swap after design is one step removed from settled item f's words; the report
   to him says so plainly.
6. **The terminal-receipt reading must not accept a picture that is only
   pending.** A `published` receipt, or none, still refuses; only `unsatisfied`
   and `omitted` let the gap stand. Unverified at planning: whether
   `PICTURE_STAGE: unavailable` writes receipts; if not, the `--picture-stage`
   flag is needed and the WSD's gate command gains it.
7. **Settled item o's quieting can be gamed** by a reason that names the words
   without looking. It is a report, like `recordingReason` itself; the build's
   correction stays for an unanswered advisory. A checker should confirm no
   saved sheet changes mark except where a reason answers the advisory.
8. **Two of his answers meet in three places.** Decision 2 and settled item k
   (question 1). Settled item i and the rest-of-preferences decision 16 (a word
   bank with its question, after the task is explained, a line such as "Use the
   word bank to help you", then the words, then the space): this release keeps
   O09's "above the writing space" and O20's bar on a pointer line only for a
   bank "parked in another zone", so his in-question line is not barred; the
   topic 7 release writes his order. Settled item h's "stay exactly" and the
   stories table's "undated": the confirmed item wins (section 4).
9. **Lines another release also changes.** This plan corrects O36 (PF-F07), O37
   (PF-F72), A12 (PB-U03), P32 (playbook), I05, Q02 and Q08 (the reviewer's
   sections), and leaves G09's date and Q10 and Q11 to theirs. Whichever release
   lands second re-reads the lines. The playbook is at its 77 KiB cap: both
   edits there shrink it. The quick repair is under its 8,000-byte cap: its edit
   shrinks it.
10. **Folding moves tests that pinned the copies on purpose.** The reading-order
    test was written to hold the WSD's copy consistent with PREF; the plan keeps
    its phrases in the pointer so it should stand. E02's story, O18 and B02's
    quick-checks pin do move, each with a reason.
11. **The generated files.** `catalogue.md` and `worksheet-compositions.md` change
    only through their generators; the doc-claims test holds numbers in them, and
    the regenerated diff must show only the intended lines.
12. **"Written once" must not be overclaimed.** The adaptation designer's and the
    page mechanics' repeats (section 2, item h) are left for topic 9, and the log
    says so.

---

## 7. What his answers leave open

**Question 1: a figure a child writes on, on the sheet too?** (settled item k
against decision 2)

- **What it says now.** When the class's own practice needs a figure a child
  cannot draw by hand, it comes on a stick-in piece. On 24 September you
  confirmed the sheet may carry the same figure and task too, as a choice, with
  the child doing it once. The same morning you said the board's practice and
  the sheet should never have the same questions.
- **What I think.** Those two meet here. The same figure on the sheet is fine.
  The same questions on it is what you said you did not want.
- **What I suggest.** The sheet may carry the same kind of figure with its own
  questions (in maths, different numbers), never the practice's own questions.
  Example: the practice marks 3,250 and 4,750 on a number line in steps of 250;
  the sheet's line asks for 6,250 and 8,500.
- **Question:** yes?
- **His answer (24 September, evening):** "yes". The sheet may carry the same kind
  of figure with its own questions, never the practice's own questions.

Named for the report, not questions: the quick repair hands an engine-drawing
swap back rather than making it (Risks 5); the Below and Greater Depth route
waits on the playbook topic's settled item k (Risks 4); and two items the ledger
left unsure stay unsure (B11, a held test question and the sheet; P44, whether a
label the diagram anchor withdraws keeps its answer key entry).

---

## 8. Size, honestly

- **Rows:** about 90 to 100 of the 478 change (the five decisions about 30,
  the fifteen settled items about 45, the folds and stories about 20). The
  other rows are pinned where they stand.
- **Files:** about 17 instruction files, 6 engine files plus 2 regenerated
  references, 1 shared tool (`ledger_mapping.py`, one line), about 10 test
  files moved or added, 4 other topics' pin files, the log and both
  `plugin.json`.
- **Bytes:** the instruction files about 4 to 5 KB smaller, nearly all of it the
  worksheet designer's two folds (about 3 KB of its 68 KB) and the stories; the
  preferences file about the same size (decision 10 and 13's sentences in, the
  stale title words and the evidence-panel history out). The engine about 3 to 4
  KB larger (the receipts reading and the teaching gap in the preflight, and the
  advisory). The pins and tests about 60 to 90 KB larger, most of it the pin
  file. The log gains the stories and the entry, about 12 KB.
- **Effort:** about the size of the success-criteria release: fewer decisions,
  more rows, and three engine checks changed, so plan for two independent checks
  and a narrow third on the engine code.
