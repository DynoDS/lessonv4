# Independent check of the routes and pedagogy ledger

Checked against the plugin working tree on the night of 23 to 24 September 2026:
lesson-v4 4.2.287 (`79426973`) with the uncommitted success-criteria change
(4.2.288) on top, the snapshot the ledger was built on. Read-only: nothing in
the plugin or in any ledger was changed. Scratch scripts are in
`plans\streamline-tools\scratch\rtchk\` (`coverage.py`, `outside.py`, `pins.py`).

How the search was done. The thirteen files of the topic (five routes, six
pedagogy references, the component guidance, the lesson designer) were split
into sentences, and every sentence was listed that no «quote» covers in any
ledger, mapping or `*_ledger_pins.json`; about 700 were read by hand, most of
them catalogue lines, JSON shapes and other topics' text. Every other
instruction file was searched for the routes' names, beat kinds, the modelling
states and the pedagogy references' names, dropping lines any ledger cites.
Every string of 25 or more characters in `scripts\tests` was matched against
the topic's files. The route files were read whole, and so were the lesson
designer's Structure Decision, Teaching Representations, Misconceptions, Apply,
Worksheet, Answers and walk-through sections.

One caution on "missed". The preferences list (`PF-`) and the subject-files
list were still being written while this check ran, and the preferences list
is taking copies of preferences rules from the routes and pedagogy files. Where
a sentence below is already a row there, it says so: it is not lost, but the
fold needs to know which list owns it.

The most important findings, in order:

1. Decision 7f is partly wrong: the turn-label rule is written in
   `preferences.md` → Slide Headings, which the designer reads. The real pull
   is the designer's own label rule against your maths ruling (section 4, pull 4).
2. Decision 8 is stronger than stated: the explanation guide's own `Look for`
   example is 26 words by the validator's count and would be refused.
3. Decision 4's suggestion needs a mechanism that does not exist yet: no
   heading in the content route holds just the Teach and launch rules, so
   "read those two parts" means reading most of the file.
4. Decisions 3 and 4 miss two limits: the skills route's brevity calibration
   for a methods-lesson Teach, and the discovery route's takeaway kept to the
   end.
5. Decision 6 is not a new pull; your rhythm decision already settled it.
6. 23 rows point to the wrong decision number (6 and 7 swapped).
7. About a dozen rules have no row in any list, the largest group being the
   lesson designer's Misconceptions section, which the ledger says no topic owns.
8. The route order is enforced by two programs, not one; the ledger names only
   the validator.
9. Four story claims are wrong: three stories the ledger calls missing or half
   there are in the build log (E58, E77, K03), and the teeth slide said three
   ways (E14, E62) is half there, not missing.

---

## 1. Missed rules

No RT row and no appendix entry, unless said otherwise. Ordered by how much a
fold would lose.

### In no list at all

1. **The designer's Misconceptions section has rows only where it repeats a
   pedagogy reference, and several of its rules are in no list.** The ledger
   says (P14) "the designer's misconception section belongs to no topic yet".
   These have no row anywhere:
   - `agents/lesson-designer.md` L313: «When choose this, write both speakers
     lines and "who is right, and why?" prompt as actual child-facing words in
     beat where happens - confident wrong, clear correct, decision. Those words
     are what children reason with and what slide will carry, so yours to
     author here, not slide maker.» The lead sentence («Giving misconception
     voice - two people disagree, children judge - worth when wrong rule
     sensible child would genuinely hold and explaining why it fails is itself
     part of what want them learn.») has no row either.
   - L299: «Approaches: diagnostic question in Your Turn, guided question during
     Our Turn ("Some children might think X - what do you think?"), brief
     explicit teaching moment: show wrong answer ask find error, speaker note
     flagging what to watch, counter-example making wrong rule visible,
     two-character disagreement: one voices wrong rule, other correct, children
     decide who right and why.» This places misconception work on named route
     beats.
   - L311: «Pre-empting before practise avoids encoding wrong rule. Diagnosing
     via question gives teacher real-time info. Both valid. Choose based on how
     predictable/serious.»
   - L317: «**Weight each misconception's footprint to how much it blocks
     today's objective.**» and «The tell: more lesson real estate on the side
     correction than on the objective's own sticking point.» (the middle
     sentence is partly in SA-G19 and WS-B09).
   - L321: «Note choice for each and reason.»
   Group P, or a named owner. The rest of the section is held: L301's own-clause
   rule is PF-B34, L305 to L309 and L319 are quick checks' (QC-H01, H02, N01).

2. **The skills route's operative sentences for recognition and process
   skills.** B17 and B18 quote only the bold lead of each paragraph, and no
   list quotes what the teacher actually does.
   - `references/teaching-sequence-skill-based.md` L35: «For these, the
     teaching before practice first *establishes and displays the whole set* —
     every category named and shown, with any distinction the practice depends
     on (clockwise vs anticlockwise, the boundary between two classes) made
     visible — so the child carries the set into the identification rather
     than meeting a category for the first time inside a "My Turn, what is
     this?".»
   - L37: «What the process half means for the teaching: reading or deriving an
     attribute is a *process*, even inside a lesson whose title sounds like
     classification, and it is taught by modelling the method on an example: the
     teacher works each criterion on the shape in front of the class, annotating
     it or filling a small table live as they go, so children watch the
     properties being *found*.» and «A blank or partly-blank `table` the teacher
     completes live (property down the side, "true for this shape?" beside it) is
     often the cleanest way to model a property-reading process, because the
     filling-in *is* the modelling.»
   Group B.

3. **The Our Turn carries the hardest case.** L23: «So plan the modelling
   across My Turn and Our Turn together to span the set — each distinct case
   demonstrated at least once on its own worked example, with the Our Turn
   carrying the hardest position.» B11's kind column mentions the clause in
   words; no list quotes it. Group B.

4. **A tool lesson still shows every case once.** L31: «Showing each distinct
   case once still holds — the child should see a "both" and a "neither" placed
   before meeting them alone — but a clear demonstration is all the modelling
   owes them.» B15 quotes only the bold lead, whose words ("keep the modelling's
   cases clear") read as permission to show fewer; this sentence is its limit.
   Group B.

5. **Key questions a brief lists are not all dropped.** Content route L39:
   «A long-term plan or a scheme that names the questions for a lesson is
   naming the thinking the teacher expects to happen, so a design that quietly
   drops all of them has thrown that away while looking complete.» E20 quotes
   only the permission to leave some out. Group E.

6. **The discussion route's second red flag.** `references/evidence-synthesis.md`
   L243: «Dialogic used for content that genuinely has a right answer (e.g. how
   the digestive system works, how to multiply two-digit numbers) — that's
   Content-based or Skill-based.» A43 quotes two of the five red flags (PF-D43
   holds two others). Group A.

7. **The scaffold reference restates route rules where the designer reads
   them.** `references/lesson-design-scaffold.md`, read on the normal route:
   - L131: «For a Skill-based lesson, add one object per concept in final
     concept order» (the only text near decision 7f's second rule).
   - L157: «A cycle has one `our-turn` unit however many guided examples it
     walks through ... A second guided unit is only right after a new My Turn,
     as part of a new cycle.»
   - L159: «In every other route, `conceptIndex` is `null` unless the lesson
     names an idea and this unit is an instance of it ... the design validator
     requires at least two instances of a named idea.»
   - L161: «Use only kinds allowed by the selected route. The scaffold rejects
     an out-of-order route before writing the files.»
   Copies of C01, Q05, Q13 and Q02; group Q or P as copies.

8. **A sixth copy of the structure-reading rule.** `references/evidence-synthesis.md`
   L21: «While choosing the structure, read each subsection's "Use when" line;
   once chosen, read only that structure's full subsection — plus the discovery
   caveats whenever an investigation is on the table.» Copies: A04, O04, P23.

9. **The designer records why its route beats the nearest one.**
   `agents/lesson-designer.md` L418: «and why the chosen structure fits better
   than the nearest alternative». Held by the assumed-knowledge list; group A
   has no shared row for the one line that asks the designer to justify its
   route choice.

### Held by the preferences list tonight, with no RT row

Not lost, but two lists now claim them and the fold needs one owner:

10. `references/lesson-designer-components.md` L33 (PF-H14): «Modelling slides
    (My/Our): blank what's being learned for live annotation; fill what's only
    support (cognitive-load triage in preferences).» Pinned by
    `test_lesson_designer_component_loading.py`. And L35 (PF-H25): «When
    representation pairs abstract diagram (part-whole, bar, number line) with
    concrete thing it represents (coins, base-10), say explicitly. Modelling
    needs both side by side». Both are modelling rules; the modelling file (N03)
    holds the first half only.
11. `references/output-template.md` L677 (PF-M57): «A My Turn completed live on
    a representation uses `answer-slide`, so the finished representation
    follows on the next slide. Any other My Turn whose answer is not
    pupil-visible from the start uses `teacher-only`; a prepared completed model
    uses `visible-in-unit`.» The only text statement of the My Turn
    `teacher-only` rule the check enforces (Q19), and a copy decision 7a must
    agree with.
12. `agents/lesson-designer.md` L90 (PF-U09): «My Turn/Teach/Apply = modelling
    narration; Our Turn/Do = guided questions; Your Turn rarely needs script.»
    The script's shape by beat kind. L361 (PF-U15): «A My Turn or Our Turn
    `content.example` IS what the board carries while you model, so write the
    example in a child's words».
13. Content route L120 (PF-Y12): «The boards he chose instead are written out in
    `preferences.md` → Pride Lessons, `What a Teach slide holds`; write to them.»
    The pointer from the first-day test to your calibration boards.
14. `references/evidence-synthesis.md` L54 (PF-U35): «the only real option
    for a physical skill that must be *shown* (handwriting, apparatus, a
    technique)». O11 quotes two of the menu's six entries; this condition and
    L59's «Nothing — straight to the doing — when pupils already hold the
    schema» (AK) are the others.
15. `references/reasoning-prompts.md` L16 (PF-L25): «A character's claim is useful
    when judging that claim serves the learning; a direct question or comparison
    may make the same thinking clearer with less reading.» The condition beside
    L05's «no default character format».

---

## 2. Duplicates that are not duplicates

1. **A57** (marked duplicate of A54 and A56) carries «with `--file` and every
   page». A56 says read one file; only A57 says read all of it, including the
   output block below the reviewer's line where the Teach and launch rules live.
2. **B25** (marked duplicate of N13 and N14) says «Keep generic working boxes
   removed.»; N14 says «Generic working boxes are not a default; purposeful room
   for the specified live working is legitimate.» Different strengths; N14 also
   carries the permission. And N13 has «use one shared instruction when several
   moves genuinely need the same state», which B25 lacks (the ledger notes that
   one only on N13).
3. **F25** (marked duplicate of F10's placement) adds a place F10 does not
   allow: «That spot-the-mistake can sit at the share as a closing check, or —
   often more powerfully — before the independent attempt as the bridge into it»
   against F10's «Place it after the short teach, as the bridge into the doing.»
   F10 is the flawed version as enabling input; F25 is any spot-the-mistake for
   a predictable task mistake. Keep both.
4. **O14** (marked duplicate of B09, B10, B24, C14, N02) carries «Pair spoken
   explanation with a useful visual or representation when that combination
   supports the learning.», which none of the five holds.
5. **O37, I07, O16** (the 80% line "three times") each carry a clause the others
   lack: O37 «success above 95% is not automatically unproductive»; I07 «A
   diagnostic question may deliberately reveal widespread misunderstanding, and
   many incorrect answers can be useful evidence.»; O16 «not a result a generated
   resource can know, a guarantee, or a universal lesson metric».
6. **P23** (marked duplicate of O04) carries the reason «Do not wait until you
   feel uncertain; that can hide the guidance needed to recognise a mistake.»;
   O04 carries «Leave sections whose decisions this lesson does not touch
   unread.» A04 says «Read the full `Discovery / Inquiry` subsection» where O04
   says «the Discovery caveats».
7. **C13** (marked duplicate of O17) carries «The live teacher decides from the
   real class whether to release, skip a planned guided example or add further
   support.»; O17's quote does not.
8. **A36** (marked duplicate of H12, and "same" in the across-routes table):
   H12 adds «The procedure is then clearly explained, modelled and secured through
   Skill-based teaching.» A36 and A30 stop at the ban.
9. **H01** (marked duplicate of A35): A35 carries «Productive Discovery is
   bounded, focused and followed by accurate explanation.» and the point that the
   evidence cautions against minimal guidance, not against the route.
10. **"The routine is the teacher's: eight copies, one meaning"** is not one
    meaning. I09 carries a counter-rule and a permission: «Do not ban
    mini-whiteboards or devices» and «Name a device, medium or substantive
    response structure only when it genuinely forms part of the selected
    activity.» C02 carries «State the question, learning action and any
    substantive response structure that genuinely changes the task». A fold to
    "the routine is the teacher's" keeps the limit and drops both permissions.
11. **"The move and the exact instance: P08 is the fullest"** but P08 is not a
    superset. It lacks «The teacher may substitute another suitable example
    during the real lesson.» (F09, N17), «A teacher-facing suggested exemplar may
    still be supplied when it helps delivery.» (B27), and «The active part of a
    live-complete helper stays constructable, but the teacher is not left to
    invent the instance itself.» (O13).

---

## 3. Strength and scope

About 45 rows spot-checked (A01, A03, A05, A13, A16, A17, A19, A21, A24, A25,
A27, B03, B04, B06, B11, B12, B13, B14, B15, B25, C04, C10, C12, C16, C22, C31,
C32, C35, C37, E12, E19, E20, E24, E30, E40, E45, E47, E56, F07, F12, F15, F19,
G07, G12, H02, I07, I13, I24, J33, J35, J36, J44, K18, L05, L16, N07, N10, P16,
P17, P18). Only the faults are listed.

1. **P16's scope lacks its exclusions.** `agents/lesson-designer.md` L315: «This
   applies to the one-voice `Is X right?` / `Do you agree?` shape and to `always,
   sometimes, never`. It does not apply to a two-voice disagreement, where the
   contest itself says one is wrong, or to `find the mistake`, where the error's
   existence is given and locating it is the task.» The row's "when it applies"
   says only "a named character's claim children judge". A fold from the row
   would stretch "let at least one be right" to find-the-mistake beats, where it
   is wrong by definition.
2. **E47's exception is described, not quoted.** L114: «It is obvious, and the
   step stays spoken, when the thing is the only thing on the board, or when the
   picture's own label names it: a diagram labelled `oesophagus` has written the
   example already, and the key question does the pointing». The row quotes only
   the "not obvious" cases; a fold keeps what is quoted.
3. **L16 lacks its own permission.** reasoning-prompts L53: «Where children must
   answer and justify, calculate and compare, find cases and establish
   completeness, or complete a multi-part test form, present the connected
   actions as clear ordered or labelled parts rather than forcing an artificial
   one-clause limit.» (PF-C12 holds it.) Without it, L16 folded into P20 («A pupil
   prompt asks one thing at a time») reads as a one-clause limit.
4. **B15 and E20** each quote the permitting half and not the limit (section 1,
   items 4 and 5).
5. **B25** is labelled "must" like N14 but says something stronger (section 2).
6. **N10** is labelled "must" and opens «normally reserve a clear, usable area»:
   a default with musts after it.
7. **A27** is labelled "default"; «This is the most important decision the agent
   makes. The evidence is clear but nuanced.» is framing, not a rule.
8. **Decision numbers in rows are wrong in 23 rows.** Rows say "decision 6" for
   the out-of-date group that is decision 7 (A19, A42, B29, D21, F05, G22, I10,
   I25, J04, J11, J15, J39, N04, P10, P12, P19, Q03, Q05, Q09, Q23, Q27), and
   "decision 7" for the enabling-input question that is decision 6 (A24, F07).
   A change made from the rows would apply the wrong answer.

---

## 4. Disagreements

You asked for no overcomplications. For each of the eight: is it a real
pull, or something a fold settles?

1. **Moving about.** Real pull (four corners in the discussion route against
   your "Not used" rulings), and the standing-to-turn part asks for a new
   exception to «Choose a whole-class movement beat only when the teacher asks for
   it» (J35), so it is your call. Missed: the definition of a Do beat itself lists
   movement as a normal way to show thinking, and a fold must carry these:
   `do-beats.md` L3 «it leaves something the teacher can see: a written answer, a
   partner's spoken response, a visible decision, a physical position» and «A
   spoken response, visible decision, movement, physical action, drawing or
   writing may be enough»; content route L47 the same list. Unsure: whether
   role-play, hot-seating and structured debate (G07, "performing at the front",
   which J35 names) stay; the rhythm list gave them conditions, so the question
   should say they stay.
2. **Launch example in a big-task lesson.** Real pull, but the question
   misdescribes the task route. Its own trigger is scoped to this lesson, L31:
   «when the enabling input has run to several units, or the product has a form
   children have not yet made in this lesson (a rule, a plan, a paragraph)»; the
   reviewer uses «when the product's form is new to the lesson» (RV-J36). The real
   difference is "made in this lesson" against "seen a good one in this lesson",
   plus F19's unscoped «familiar». And the task route is chosen precisely when
   children already command the form (A13, A21), so "one rule for both" means a
   good and weak pair on the board in every big-task lesson whose product is an
   explanation, even a form the class writes weekly. The question should say so.
3. **Four parts on every teaching slide.** Real pull (a change of meaning), but
   the suggestion would override two things the ledger does not mention: the
   skills route's methods-lesson brevity, with its own calibration, L194: «In a
   methods lesson it is brief on the board as well as in time» and «A slide that
   sets `43 children came to the fair` and `about 40 children` in two text cards
   around a small number line is the right idea and reads as wordy.»; and the
   discovery route's takeaway kept to the end where children reach it (H07, E44),
   which "takeaway first" reverses. Also missed: a skill lesson's designer already
   reads the four parts, in its own walk-through line P06 («a Teach is the route
   in whole sentences (the takeaway, the because or so, the example the class
   looks at, and what it does not mean ...)»), so for a skill `teach` beat it
   reads two shapes that disagree (P06 and C28). Suggest merging 3 and 4 into one
   question.
4. **Teaching slides and big tasks in a skills lesson.** Real gap. The "lands a
   takeaway" correction is settled by your headline-first ruling and needs no
   question. The mechanism does not exist yet: P11 works because `Writing the
   Success Criteria` is one heading; the Teach and launch rules are spread through
   `Teaching Sequence Specification` and `Output Format Block` among the Do,
   observe and Practise rules, so "read those two parts" needs new headings (which
   moves pins and what the reviewer reads) or the COMMON and LAUNCH homes the
   ledger already proposes. Also, the check already refuses a skill `teach` on
   content-route rules (section 5, item 4).
5. **Plan on its own slide.** Real pull (F12 "unless ... materially improves the
   work or protects one of those important conditions" against F15, F20 and L33
   "only when ... a distinct artefact"). Keep.
6. **One short enabling input.** Not a new pull. The rhythm change you approved
   (4.2.285, TD-J72 to J73) already made each enabling idea its own unit, used
   before the next, and the reviewer checks it that way; the choosing test's
   "one" is wording left behind by it. A fold settles it; list it under 7.
7. **Out-of-date text.** Folds, with three corrections. (f1) is wrong: the
   turn-label rule is written in `preferences.md` L663, «The validator holds the
   turn word on a skill-based turn; the move after it is yours.», and the
   validator's own comment (L2641) says so. (f2) is half-written: the scaffold
   reference says «in final concept order» (L131). (e) is a mechanical choice
   (which field children read), not yours.
8. **Look for.** Real pull, stronger than stated: the validator splits on spaces
   (L1145), so the guide's own example, «the acid named as something the germs
   make - if a child jumps from sugar to the hole, ask what the germs did with the
   sugar.», counts 26 and is refused.

**Pulls the list missed.** All but the first two are settled by rulings you
have already made, so they belong in decision 7 as corrections, not new questions.

1. **The content Teach paragraph permits a sentence at the foot.** L31, inside
   E12: «a short key sentence in a banner or strip, a labelled outcome below the
   visual, or a headline that names the answer all work», then in the same
   paragraph «the landed sentence is the `headline`, and it is there rather than
   at the foot of the slide». E40 and your 17 September rebuild put it at the top.
   Settled by your ruling. Unsure whether "banner or strip" means a top strip.
   PF-Q07 holds the whole paragraph; `preferences.md` L575 has the general form.
2. **The designer's register check keeps the old board.** `agents/lesson-designer.md`
   L162: «Re-form here: attach explanation to thing learned (labels, callouts,
   marked-up example, wrong beside right), keep one takeaway as key line, full
   spoken in script.» Against E50 («nothing that teaches in the script is missing
   from the board») and your ruling that the board carries the teaching. Settled
   by your ruling (PF-O49 holds the line).
3. **The validator's Teach message teaches the old order.** L1743: «the route
   from what the class already has, through the thing on the board, to the
   sentence the slide lands». Your four parts open on the takeaway. Settled
   (section 5).
4. **The designer's label rule against your maths ruling.** P19: «never the slot
   it fills (`Still part of the lesson`, `Apply`)», against `preferences.md` L665:
   «In maths, the plain words are what the teacher wants: `My Turn`, `Our Turn`,
   `Your Turn`, `Answers`, `Apply`.» The validator's message (L2661) adds «and
   then name the move», which that ruling makes optional in maths. Settled by your
   ruling: P19 and the message carry its exception.
5. The Do-beat definition's movement (under decision 1) and the brevity and
   withheld-takeaway limits (under decision 3), above.

---

## 5. Code and tests

1. **The route order lives in two programs.** `scripts/lesson-design-scaffold.py`
   `validate_route_shape` (L454) and `discovery_shape_is_valid` repeat every
   route's grammar with their own messages, which the designer reads, for
   example «run a concept's cycles together and use a practise unit to mix
   concepts already taught» (L531). Its comment (L555) says «The parity test in
   scripts/tests keeps the two copies saying the same thing». Group Q and "Names
   the code depends on" name only the validator. Any change to a route's order
   changes both.
2. **Q03 and decision 7f(1) are wrong** (section 4, decision 7): the rule is in
   `preferences.md` → Slide Headings, and the validator comment cites it.
3. **The Teach `explanation` message and comment state the pre-22-September
   route** (L1734 to L1743, quoted above). Not in the ledger's list of messages.
4. **Two Teach checks reach the skills route.** `validate_teach_says_it_once` and
   the non-null `explanation` rule apply to every `teach` unit, including a skill
   lesson's `teach` beat, whose rules are in a file it never reads. Q14 says
   "only the teach kind" without saying this; it strengthens decision 4.
5. **The explanation check skips skill lessons too.** `validate_explanation_task_is_modelled`
   returns at L1319 for Skill-based, so a skill `practise` beat asking for an
   explanation (C30 puts «the reasoning question about the method as a whole»
   there) is never checked. Since `practise` exists only in the skill and content
   routes, the check runs on content lessons alone. "What nothing checks" names
   only the task route.
6. **Look for is counted by spaces** (L1145 to L1146): decision 8's example fails.
7. **Pins the ledger omits.** `test_lesson_designer_component_loading.py` pins
   the Representation configurations lines L31 «**Families, not single objects -
   pick config deliberately.**», L33 «blank what's being learned for live
   annotation» and L39 «two PWMs per scaffolded question, one per amount»; the
   ledger's list for that test names none of them.
8. **The class view** (`CHILD_FACING_CONTENT_KEYS`, design-review-packet L52)
   omits `modelledOn`, as the ledger says; confirmed.

---

## 6. Stories

Searched `references/build-review-log.md` case-insensitively for each story's
own phrases.

- **RT-E58, the tooth cross-section: in the log**, not "no". L2117: «Every Teach
  beat in the teeth deck wrote `explanation: null`, so a teach slide was a
  picture, a heading and one sticky sentence.», with your words «if the teacher
  wasn't confident what enamel was, but didn't use the speaker notes, they'd find
  it hard to actually teach the children anything apart from 'this is where the
  enamel is on the tooth'.» The PSHE pass slide (E59, F06) is there too.
- **RT-E77, the launch prose: in the log**, not "half". L941: «Four tenths of the
  board was prose about two cards».
- **RT-K03, your research summary: in the log**, not "half". L953: «He then
  brought back his own research (EEF oral-language, primary-science and literacy
  guidance, IES writing, the dialogic-teaching trial)».
- **RT-E14 and E62, the teeth slide said three ways: half**, not "no". L2117
  names «a slide that said one sentence three ways»; the `Incisors cut` wording is
  not there.
- **RT-C05**: the log's version is L2137 («The Our Turn slides printed the
  questions the teacher was going to ask»); the claim holds.
- Confirmed not in the log: E42 (the Victorian beat's sentence demoted) and I12
  (the printed record with no words to the children). Confirmed half: C34 (the
  design is at L929; «rubbing out» is not).

So two stories are missing (E42, I12) and two are half there (C34, E14/E62),
not four and three.
