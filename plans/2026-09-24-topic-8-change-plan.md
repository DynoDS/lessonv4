# Topic 8: the change plan (24 September 2026)

Step 5 onward of `streamline-plan.md` for topic 8, drafted from its four
ledgers and his answers of 24 September (afternoon), each in his words with the
read-back he agreed:

- the design reviewer, `2026-09-23-design-reviewer-ledger.md` (428 rows, `RV-`);
- the teaching routes and pedagogy references, `2026-09-23-routes-ledger.md` (592 rows, `RT-`);
- the subject files, `2026-09-23-subject-files-ledger.md` (490 rows, `SJ-`);
- the teacher voice guide, `2026-09-23-teacher-voice-ledger.md` (470 rows, `VG-`).

His words are the standard; where a read-back follows them, the read-back is
what he agreed. Nothing is committed or pushed until he says so. Planning only:
nothing in the plugin was changed to write this. Scratch for this plan is
`streamline-tools/scratch/t8plan_*` (one read-only probe, `t8plan_probe.py`,
whose findings are quoted below).

Paths are inside `plugins/lesson-v4/`. Short names: LD `agents/lesson-designer.md`;
REV `agents/design-reviewer.md`; REV-REPAIR `agents/design-reviewer-focused-repair.md`;
PACKET `scripts/design-review-packet.py`; VALIDATOR `scripts/validate-lesson-design.py`;
PREF `references/preferences.md`; TV `references/teacher-voice.md`; SPEECH
`references/slide-speech-and-characters.md`; CONTENT, SKILL, TASK, DIAL, DISC the
five `references/teaching-sequence-*.md`; DB `references/do-beats.md`; ES
`references/evidence-synthesis.md`; ET `references/explanation-tasks.md`; RP
`references/reasoning-prompts.md`; MF `references/modelling-formats.md`; OT
`references/output-template.md`; LDC `references/lesson-designer-components.md`;
LOG `references/build-review-log.md`; SUBJ-x `references/subject-x.md`.

---

## 0. Before anything changes

- **Wait for what is ahead of it.** 4.2.289 (the long-criteria fit release) is
  uncommitted in the working tree and touches VALIDATOR, PACKET's test
  (`test_design_review_packet.py`), `templates.md`, `slide-success-criteria.md`,
  the success-criteria pins, LOG and both `plugin.json`. Topic 8 edits the first
  four of those, so nothing starts until 4.2.289 is committed. The worksheets
  release (4.2.290, `2026-09-24-worksheets-change-plan.md`) edits REV's worksheet
  section (its I05, Q02 and Q08), the adaptation designer's L39 (RV-T22) and LOG;
  topic 7's three releases (`2026-09-24-topic-7-change-plan.md`: 7A 4.2.291, 7B
  4.2.292, 7C 4.2.293) edit PREF, the decorator's guide, PACKET's Apply trigger
  and several lines topic 8 also names (section 8, agreed with its planner).
  Topic 8 starts on the tree those leave, committed. The one exception is the
  humour diagnosis (section 7), which reads only and can start at once.
- **7A retires four lesson fields** (`testQuestionPath`, `lesson.scope`,
  `deferredLearning`, `lesson2Direction`), so every older saved design fails the
  validator on unknown keys. Topic 8's saved-design comparisons use 7A's
  normaliser (`t7a-change/strip_retired_keys.py`) the same way.
- **Re-check every ledger against the committed tree** with
  `streamline-tools/check-ledger-quotes.py` (the voice ledger with
  `scratch/vg_check_quotes.py`, which also reads `evals/` and `shared/`). Record
  every row whose line moved. A quote not found stops the release until it is
  explained: 4.2.289, 4.2.290 and topic 7 will have moved many lines (the
  explanation-task check the routes ledger places at VALIDATOR L1316 is now at
  L1629).
- **Baselines, per release:** `run-all-suites.sh <label>-before`;
  `validate-saved-designs.py` over the saved designs (53 today under its three
  roots); for the two releases that change PACKET (releases 2 and 3), every saved
  design's review card and view written before and after (the success-criteria
  checks' method), so every changed count line and card line is explained.

---

## 1. Six releases, in this order, and why

One release per list would put about 2,000 rows and three programs into four
commits, two of them too large to check. Split by what each moves, so each has
its own version, its own log entry and two independent checks:

| # | Release | Carries | Why here |
|---|---|---|---|
| 1 | **Subject files** | subject decisions 1 and 3 (the skill and its guide removed), 4, 6, 8 and settled items 7, 10, 12 | Almost self-contained: it deletes two maintainer files and edits the six subject files, and nothing else in topic 8 rests on its words. Doing it first removes about 30 KB the later releases would otherwise search. |
| 2 | **The design reviewer** | reviewer decisions 2 and 7, settled items 4, 5 (its own lines), 10, 11 | Its card change (decision 7) and the routes release's class-view change (7e) are in the same program and test file; they go one after the other, not together. Folding the reviewer's own file first means the routes release edits one pointer line (RV-C11) on a settled file. |
| 3 | **Routes: his decisions and the corrections** | route decisions 1, 2, 3 and 4, 5, 8; settled items 6 and 7a to 7k | The only topic 8 release that changes what the validator refuses; it makes the two headings (the teacher's way of explaining, and the launch) that release 4 folds into and release 5 points at. |
| 4 | **Routes: one copy of each rule** | the "folds that change nothing" | Pure moves, checkable by mapping alone once release 3 has fixed the headings. If release 3's checks come back clean and small, 4 may join it; say so in the report rather than decide it now. |
| 5 | **The voice guide** | voice decisions 1, 2, 4, 9 and 10 (turned round), 11, 12; settled 1, 5, 6, 8 (decision 13 is 7B's) | Last of the text releases because it reaches into files the others settle (the dialogic route, the lesson designer's notes voice, the reviewer's voice lines, the adaptation designer) and folds a rule written 32 times across them. |
| 6 | **Humour on the board** | "I still never see it on slides!" | After the diagnosis (section 7) and after release 5, which records "humour wherever" and brings the "never the reverse" copies to "normally". Its content is decided by the diagnosis and by him, not by this plan. |

Version numbers are the next free ones when each starts (after 7A to 7C, these
are 4.2.294 to 4.2.299). Scripts live in
`streamline-tools/t8-change/`, prefixed `sj_`, `rv_`, `rt3_`, `rt4_`, `vg_`,
`hu_`; the diagnosis in `streamline-tools/hu-diagnosis/`. Pins: one file per
list, `subject_files_ledger_pins.json`, `design_reviewer_ledger_pins.json`,
`routes_ledger_pins.json` (release 3 creates it, release 4 extends it),
`teacher_voice_ledger_pins.json`, each with its `test_<list>_ledger_is_kept.py`,
built with `streamline-tools/ledger_mapping.py` and checked by
`scripts/tests/ledger_pin_checks.py`, as `td-change/` and `sc-change/` did.

---

## 2. Release 1: the subject files

### Decisions 1 and 3 (his 1 and 2): the skill and its guide go completely

His words: "forget about 'writing a new subject file' guidance. it should just
knowe the files it has, nothing around what could be added in future." and "is
this a new skill called make subject file skill or something? just remove it
completely." Read-back: removed with the tests and pins that name them; nothing
speaks of files that could be added later, the "until a subject-English file
exists" hedges included.

- **Delete** `skills/make-subject-file/` (SKILL.md, 25.6 KB) and
  `references/authoring-subject-files.md` (5.0 KB). Rows SJ-B01 to B20 and C01 to
  C56 go with them; the mapping lists each as "removed with its file, his 24
  September decision". None is read in a lesson (B01 says so; the skill runs only
  on his command), so no lesson loses a rule. Before deleting, copy the one story
  not in LOG (C43 and C50, "geography lost two ideas") into this release's
  "Stories kept here" block.
- **RP L81** (SJ-A59, RT-L20): «Until a subject-English file exists, keep the
  detailed reading, writing and grammar guidance below active.» goes; the English
  bullets below it stay, now unconditionally live.
- **Stale lines about the reviewer and subject files**, corrected here because
  their files are this list's: SUBJ-geography L100 (SJ-G45, RV-T05) «The
  design-reviewer reads the book at the end of the lesson and asks whether it
  reads as the subject.» becomes what is true: "The design reviewer reads the
  finished design against this file and asks whether it reads as the subject."
  RV-T06 to T08 go with their files.
- **Tests and pins:** `test_plugin_root_contract.py` L32 loses the SKILL.md
  entry; `test_run_never_publishes.py`'s docstring (L14 to L15) stops naming
  `/make-subject-file`. Five pins in finished topics name the deleted files:
  AK-C03, SC-C15, SC-C16, TD-A14, VOC-M15. Each is retired in its pin file with
  the decision recorded in its own ledger, as earlier releases did when they moved
  another topic's pin. Check first how `ledger_pin_checks.py` treats a pin whose
  file no longer exists (retire, do not leave it failing). New test: no file under
  `agents/`, `references/` or `skills/` names the deleted files, and no text says
  a subject file may be added or written later.
- **The playbook's two shared lines** (agreed with the playbook planner):
  `references/computer-setup.md` L200 «(installing a helper, editing templates,
  writing a subject file)» loses «writing a subject file» (PB-V20; check its pins
  first), and PB-B21 (the skill's test-run line, SJ-C48) goes with the skill,
  recorded in the playbook ledger as removed.
- **Tell him:** Codex keeps the command until `codex plugin add lesson-v4@lessonv4`
  refreshes it (his memory note: installs copy to a per-version cache).

### Decision 4 (his 3): history does not always need sources

His words: "History doesnt always need sources right? It often leads to it
anyway, but does it have to be a strict rule?" Read-back: not a strict rule; the
top line gains "When the lesson uses sources".

- SUBJ-history L19 (SJ-E09): «Teach historical knowledge through the evidence: a
  concrete aspect of life, what a source shows or tells us about it, and a useful
  comparison or inference.» becomes «When the lesson uses sources, teach
  historical knowledge through the evidence: ...», the rest unchanged, and its
  second sentence unchanged. The sketch and its lead-in (E11 "The shape that
  produces this") do not change, bar its date (settled item 10). E66's "a history
  lesson does not need a source in it" now stands without a pull.
- Test: the new opening words, and E66's sentence, both present.

### Decision 5 (his a): decoration on a sad history lesson

Settled by his topic 7 answer ("there sh could be drawings on serious material,
as long as obviously the drawing isn't something that looks like I'm mocking").
SUBJ-history L160 (SJ-F28) «Omit P3 for death, casualties, persecution,
enslavement, atrocity, disaster, memorialisation, trauma ... A sparse page is
valid.» is the line topic 7's read-back names ("the limit goes from his
preferences and the history file's no-drawings list"). **7B carries it** (its
B4; section 8, item 2); this release checks it landed and does not
touch F28. F27 ("do not put a picture on a slide because the slide looked empty")
is about the designer's teaching pictures and stays.

### Decision 6 (his 4): the food rules become a pointer to the Eatwell Guide

His words: "those balanced diet things sound like things I wouldnt want in the
pshe subject files", then "extra rul4es yes, maybe the subject file could say to
look for guidance from eatwell guide thing", then "yes and yes" (science gets the
same one-line pointer).

- SUBJ-pshe L48 to L58 (SJ-J24 to J28): the heading `## Food and diet` stays and
  its four paragraphs become one line, for example: "A lesson about food, diet
  or healthy eating follows the NHS Eatwell Guide for what a balanced diet is and
  how it is shown." The wording is his read-back's ("a pointer to follow the NHS
  Eatwell Guide"), with nothing added.
- SUBJ-science gains the same heading and line, at the end; nothing else in it
  changes.
- **What stays elsewhere, named so "gone" is not overclaimed:** the reviewer's
  lunch-plan examples (RV-N13, RV-O03, his examples of a consistency check); the
  food-plate drawing's caption and its ban on good and bad foods (`templates.md`
  L2831, L2859, which reach a lesson only when it draws the plate); the general
  rule against an invented count in a criterion (SC-G01). J26's own row is shared
  with success criteria (SC-G02, pinned): that pin is retired with the decision
  recorded in the success-criteria ledger.
- **Tests:** `test_diet_and_safety_content_boundaries.py` L92 to L120 (four tests
  on J25 to J28) become one: both files carry the pointer, and the PSHE file no
  longer carries the four rules' own sentences (barred in subject files only,
  because the reviewer's example legitimately keeps `explain why the whole lunch
  is balanced`, which `test_reviewer_voice_authority.py` L132 holds).
- **The prophet line (RE L21, SJ-I08), the other half of decision 6's suggestion,
  is not in his answers** (they were all about food). It stays exactly as it is,
  and goes to him (section 13, question 1).

### Decision 8 (his 5): circuit symbols are Year 6

His "yes" to: the circuit drawing's guidance says it is for Year 6 symbol work,
and a Year 4 lesson shows a labelled photograph of a real circuit instead; the
science file stays as it is.

- The drawing guidance, wherever a designer reads it: `templates.md` L82 (the
  catalogue row) and L1460 (`circuit-diagram`'s section); `worksheet-helpers/science.md`
  L11 to L13 («so one helper covers the whole electricity unit»); and, if they
  carry the same claim, the wall and stick-in docs (`working-wall-card-contracts.md`,
  `working-wall-visual-language.md`, `stick-in-sheets-pedagogy.md`) and the
  generated `worksheet-helpers/catalogue.md` (changed only through
  `worksheet-html/scripts/build-catalogue.js` and `src/helpers/purposes.js`). New
  words, one sentence each place: "Standard circuit symbols are Year 6 work
  (`subject-science.md`); a Year 4 lesson shows a labelled photograph of a real
  circuit instead (`label-diagram` on the photograph)."
- **Mechanism check (the rounds' lesson):** the labelled photograph exists
  (`label-diagram`, the diagram anchor, the picture stage's search). Nothing
  refuses `circuit-diagram` in Year 4 and this release adds no refusal: it is
  guidance, and the reviewer's curriculum check (RV-H03) is the net. Code
  comments that say "covers the whole electricity unit" (`science.js` L44, its
  test L19) describe the helper's states, not a year, and stay.
- These are topic 9's and the worksheets' files, but no other plan carries this
  answer (the worksheets plan does not mention circuits), so this release does.

### Settled items

- **2** (the guide's "copy geography's shape"): moot, the guide is removed.
- **7, out-of-date:** SUBJ-history L156 (SJ-F26) «their own guidance is that a
  school timeline is almost never honestly to scale» becomes "their own guidance
  places each mark in proportion to its real date, and a line is never labelled
  not to scale"; L52 (SJ-E39) «The geographical-sounding part» becomes "The
  historical part". C10, C43, C50 go with the skill; SJ-H04 (science's old route
  names) stays until the content route's "Explicit Teaching (Content-based)"
  changes, which no topic 8 answer asks for.
- **9:** maths's three positions stay as written.
- **10, dates beside his examples:** SUBJ-history L21 loses «(4 September 2026)»;
  L32 «the user chose on 14 September 2026» becomes «the user chose»;
  SUBJ-maths L23 «(the teacher, 19 September 2026, after the nearest-100 lesson
  modelled 34 first)» becomes «(the teacher, after the nearest-100 lesson modelled
  34 first)»; L91 loses «(16 September 2026)» (the worksheets plan leaves this one
  here, its G09). Every date is already in LOG. SJ-E27 (the dated Tudor deck with
  his words) follows the standing story rule: the dated deck goes (LOG has it,
  per AK-H10), his words stay undated; it sits in AK's pinned E26 paragraph, whose
  pin moves.
- **11:** no change (the reviewer's equipment check covers every subject).
- **12, one copy of the start note:** SUBJ-history L3 and SUBJ-geography L3
  (SJ-E01, G01, word for word bar the subject) fold into LD's reading line (SJ-A04,
  L550), which gains what they carry: read at the start, before the structure is
  chosen, because in history and geography the file routes by the move the
  objective asks for; come back to it beside the teaching-sequence file once the
  structure is set, since the structure file gives the shape and the subject file
  the thinking inside it. The four other files' start notes carry their own extras
  and stay. SUBJ-pshe L12 «The PSHE label does not determine the route.» (SJ-J03)
  goes: LD's Structure Decision already says it (SJ-A09).

### Tests, pins and size

New `subject_files_ledger_pins.json` (the changed rows whole, the retired phrases
barred in the subject files), its test, the five retired pins and SC-G02 in their
own ledgers, and the tests named above. Rows: about 140 of 490 change (76 removed
with their files, 5 food rows, about 15 others, the rest pins). Bytes: the
package about 30.6 KB smaller; what a lesson reads: a PSHE lesson about 1.7 KB
less, a science lesson 0.15 KB more, history and geography about 0.5 KB less each
(the start note), LD about 0.3 KB more.

---

## 3. Release 2: the design reviewer

### Decision 2 (his 1, then "1. y"): the designer makes the three bigger fixes

His words: "if it's a small thing, say it's words aren't right and it thinks
these words would be better, then the reviewer changes them ... Swapping a photo
of a number line for a drawn one or rewriting a doobie. Sounds like it should be
for the lesson designer". Read-back he said yes to: small wording fixes are the
reviewer's; a picture swap or a rewritten Do beat goes to the lesson designer,
with the reviewer naming the fix.

- **RV-C10** (REV L44): «Repair it to what they will notice, or, when the
  picture's own label already names the thing, take the line off the board and let
  the key question do the pointing (...)» becomes "Return it to the Lesson
  Designer, naming the fix: the line rewritten as what they will notice, or, when
  the picture's own label already names the thing, the line taken off the board
  and the key question doing the pointing (...)". Pinned by TD (TD-L10): the pin
  moves with the decision recorded in the rhythm ledger.
- **RV-J34** (REV L204): «The repair is local and keeps the chunk: ask for the
  because, ...» becomes "The repair keeps the chunk and is the Lesson Designer's,
  because it changes what children have to think: return it naming the fix, which
  asks for the because, ..." with the whole list and both pointers unchanged.
  Pinned in QC (QC-F06), SC (SC-Q01) and TD pin files and by
  `test_an_explanation_gets_used_not_restated.py`: each moves.
- **RV-M14** (REV L295): «Raise it as a correction naming the helper that should
  draw it.» becomes "Return it to the Lesson Designer, naming the helper that
  should draw it." M15 (maths's real-world referent, "the fault is the
  substitution") unchanged.
- J11 (the clearest owner line), O04 (one bounded stimulus fix) and O05 are
  unchanged; they now agree with all three. **Fixture:**
  `scripts/tests/fixtures/design-reviewer-behaviour-cases.json` gains three cases
  (a photograph of a number line; a Do that says its Teach back; a Teach example
  written as an instruction to look), each `REDESIGN REQUIRED`, owner Lesson
  Designer, forbidden finding "do not make the change yourself; name it". Checked
  first: no existing case gives any of the three to the reviewer.
- **Honest note for the log:** each send-back is one more designer pass, and a
  run allows two (RV-R12).

### Decision 7 (his 2, "2. yes"): the card opens the three sections

Code, PACKET `PREFERENCE_REVIEW_ROUTES` (L90 to L196 today):

- `Slide Philosophy` gains the name case (RV-F12): after «...or when a
  substantial task arrives with instructions only» add "or when the view's `Names
  on the board` shows a name whose first appearance has no words telling the class
  who or what it is".
- `Lesson Designer visual-need boundary` gains the invented person (RV-M05): "and
  whenever a beat quotes, voices or names a made-up person who is present in it
  (one only referred back to is not this case)". The limit is the section's own
  (present, not referred back to), which the ledger says opening it brings.
- `Source and Scenario Integrity` gains the invented case (RV-C18): "and a made-up
  case that stands for a group (`An invented case is evidence about the group`)".
- The words are drafts. Each must be fired by something visible in the lesson:
  the comment above `ALWAYS_READ_REVIEW_SECTIONS` warns that a trigger needing
  the defect noticed first never fires. RV-F20 ("your whole reading assignment")
  is now true and stays. Tests in `test_design_review_packet.py`: each trigger's
  words on the card; the saved designs' cards compared before and after (only
  these three lines differ).

### Settled items

- **1** (his "not if it hassnt been broken anyway"): no line added.
- **4** (his b, stronger): RV-I07 (REV L166) «Judge the spoken and visible
  explanation together; do not solve a missing connection merely by adding words
  to an already crowded slide.» becomes "Judge the visible explanation first, on
  its own, and the spoken one separately, so nothing counts as taught on the board
  because the script says it; do not solve a missing connection merely by adding
  words to an already crowded slide." (The second half unchanged; the first
  carries his read-back reason.) RV-C15's «read the two together» stays: its job
  is the comparison that finds script-only teaching, which is his board-first
  check (risk 3).
- **5, the reviewer's own out-of-date lines:** RV-O14 (L390) «The orchestrator
  can only answer a failed check by sending the whole design back for repair,
  which delays every resource ...» becomes "A failed check sends your corrections
  to a focused repair and, only if that fails, the whole design to a fresh
  attempt, which delays every resource in the lesson so that one sentence can be
  shortened; shortening it here costs you a minute." RV-P06: the report shape
  (L426) gains, under the count line, `Closest to a repair:` and three lines
  `> "the exact string" - why it stands`, which the after-review check already
  requires. RV-J18 (L200) «The design now states this in each unit's `unlocks`»
  becomes «The design states this in each unit's `unlocks`» (pinned in QC, SC and
  TD: moves). **Not here:** RV-A10 and RV-R23 are the playbook's lines (PB-O08,
  PB-A04) and the playbook release carries them with the three tests that bar the
  retired review (made to read across line breaks and to read `SKILL.md` too);
  RV-T11 is PREF's Contents line (PF-A29 in topic 7's numbering), carried by 7A
  with the whole contents block.
- **6:** withdrawn; nothing added.
- **8** (maths `Apply`): RV-K02 is PF-V10, carried by 7A (its A11, "fixed once,
  here"). This release checks it landed.
- **Lines topic 7 edits first in this file:** 7B writes the launch pointer (RV-J36,
  REV L205) in routes decision 2's words and adds the four-pieces pointer to L42;
  7A adds a clause to PACKET's Apply trigger. This release re-reads L42 and
  PACKET on the committed 7B tree before its own edits.
- **9:** nothing here; the worksheets release takes "and what the reviewer
  checks" out of the adaptation designer (RV-T22, its settled m).
- **10, one copy:** RV-E05 (L322, «Do not recheck identifier or reference
  legality.») cut, E02 holds it; RV-K09 (L233, the "do not run it twice" bullet)
  cut, C02 holds it (it sits in AK's pinned K04 to K16 paragraph, AK-A49: the pin
  moves); RV-N14 (L324) cut, F18 holds the order; RV-P12 (L442) joins P09 as one
  paragraph ("Use `APPROVED` when ...; use `REDESIGN REQUIRED` when one or more
  purposeful lesson decisions must change."); RV-K03 keeps its middle sentence
  and loses «do not repeat a separate whole-lesson sweep» (G02 holds it). The
  near-repeats keep their words (O01 "one clear", K03's middle, N09, P08).
- **11, stories** (all six already in LOG): RV-C06 (L42, «The lesson that shows
  the gap: ...») out; RV-C08 (L44, «and the plugin approved a deck that failed it
  on 14 September 2026 (...)») out, the sentence ending at «this catches too
  little»; RV-C13 (L44) loses «On 22 September 2026 two lessons in a row were
  approved with `each Teach board can be taught with notes closed` while» and
  keeps its two script lines as plain examples of the finding; RV-G05 (L130)
  loses the Year 4 PSHE incident and keeps its last clause as the reason ("a count
  line alone is what a sweep that happened and a sweep that did not both
  produce"); RV-G21 (L138) loses «An RE beat printed» and keeps
  `What do their reasons share?` over its script as a plain example (pinned by
  `test_invented_people_and_the_spoken_question.py`); RV-M06 (L277) out. With
  them, three the ledger's stories table names: RV-F09 keeps its reason and loses
  «and that is how a class met ... after a review that found nothing» (inside AK's
  pinned F01 to F19 paragraph, AK-K01: moves); RV-D06 «and today the teacher edits
  it out by hand» becomes «and the teacher would have to edit it out by hand»
  (three phrases pinned by `test_reviewer_voice_authority.py`); and the two the
  worksheets plan leaves here (its Q10 and Q11): RV-L10's «This is the check that
  was too thin to catch a place-value-chart lesson whose sheet had no chart on
  it,» goes, its instruction staying («read the forms rather than confirming the
  objective matches»), and RV-L11's «it was the shape of every sheet counted on 12
  September 2026, including» goes, the teeth sheet staying as a plain undated
  example, as the worksheets plan keeps it in LDC (five and four phrases pinned by
  `test_a_maths_sheet_continues_the_lesson.py` and
  `test_the_form_of_the_answer_is_chosen.py`: moved with a reason).
- **The fixed reader:** RV-G09 (L130) «the actual eight- or nine-year-old the year
  group names» becomes «the actual child in this class». Not one of the four places
  7B carries, but his reason covers it ("the plugin is for years one, two, three,
  four, five, and six, right? So nine-year-old might have been overcomplicating";
  the lead's ruling of 24 September). Named in this release's report so he sees it.
  AK-G21's pin moves.

### Must not move

The two paragraph openings the voice harness's sweep runner reads
(`**Then sweep the voice, string by string.**` and «A child-facing or spoken string
in the wrong register is not polish.», VG-Q13), every report heading and marker
the after-review check reads (RV-S48 to S51), and the effort settings.

### Tests, pins and size

New `design_reviewer_ledger_pins.json` and its test; pins moved in AK, QC, SC, TD
and VOC with each decision recorded in its own ledger (the last round's lesson:
every pinned reviewer paragraph a fold touches is re-pinned whole); the fixture's
three cases; the card tests. Rows: about 40 of 428. REV about 2.0 to 2.5 KB
smaller (the stories 1.6 KB, the repeats 0.4 KB, the out-of-date reason about the
same length), from about 75 KB, read whole every review; PACKET about 0.4 KB
larger.

---

## 4. Release 3: the routes, his decisions and the corrections

### Decision 1 (his "y"): moving about

- DIAL L19 (RT-G05) «a ranking, a sort, a four-corners vote» becomes «a ranking,
  a sort, a vote with a written reason»; DIAL L24 (RT-G08), the Four corners
  bullet, is replaced by "A line on paper from agree to disagree, or a vote with a
  written reason (`do-beats.md` 6.2 and 6.4)". Role-play, hot-seating and the short
  debate keep their "only when every child first writes or picks a side" (G07).
- DB L364 (RT-J35) «Choose a whole-class movement beat only when the teacher asks
  for it.» gains "or when the movement is itself what is being learned (standing
  and making a quarter turn to learn what a quarter turn is)". LD L281 (RT-P04,
  the enactment sentence) and SKILL L35 (RT-B39, "children stand and make each
  turn") already say that case and now agree; 6.3 and 7.5 stay "Not used".
- Pins: J35 and J33 (`test_do_beats_look_like_the_subject.py`), G05's lead (TD-J56),
  G07 (TD-C19) are checked phrase by phrase before the edit. New test: no route
  offers four corners; the movement exception is present.

### Decision 2 (his "y"): a good example before a big written task, one rule everywhere

- Home stays CONTENT L53 (RT-E30): «Use `null` only when the practice is a set of
  questions children can begin from the question alone, or when an earlier beat
  of this lesson has already shown the class a good one of this product (a model
  answer revealed on the board, or an earlier launch).»
- TASK L31 (RT-F19) «A task children can begin from its question alone, because
  the enabling input was one unit and the product form is familiar, leaves
  `launch` null.» becomes E30's rule for the task: null only when children can
  begin from the question alone or an earlier beat of this lesson has already
  shown the class a good one of this product. TASK L120 (RT-F34) and CONTENT L171
  (RT-E70) gain E30's second case. (Release 4 then folds E70 and F34 into one.)
- REV L205 (RV-J36) and LD L243 and L406, the launch pointers, and the home in
  PREF L641 are written by 7B in decision 2's words only (its B10): skipped only
  when the class has already seen a good one earlier in this lesson. **His
  preferences decision 13b comes here**, moved from 7B so the words and the code
  land together (agreed with its planner): PREF L641 gains "success criteria on the
  board that already show what a good one looks like count as one seen, so no
  second model", and the three pointers gain the same case in the same words (a
  pointer that drops an exception misleads, the rounds' lesson). L641 is edited in
  two releases, each for a named change: 7B takes T03's date out (inside SC-R01,
  which moves), this release adds 13b; the log names the exception. Until this
  release lands, 7B's pointers are stricter than the validator for task and skill
  lessons, which 7B's log says.
- **Code:** VALIDATOR `validate_explanation_task_is_modelled` (L1629) today returns
  at once for a skill lesson and reads only `practise`. It extends to a
  Task-Centred `do-task` and a Skill-based `practise`; its docstring's «A skill
  lesson is left alone» and its message ("this Practise") name the beat kind.
  `_shows_the_class_a_model` (L1617) counts every My Turn and Our Turn as a good
  one shown, which in a skill lesson passes everything. **The probe:** of the 53
  saved designs, no task lesson would newly fail; six maths skill lessons would,
  if a turn counts only when it shows the kind of thing children then write (each
  ends on "Is Amira right? Explain" or the like, with no launch and no revealed
  model), and none would if every turn counts. Which reading his "one rule
  everywhere" means for a maths reasoning question is section 13's question 2;
  the code waits for it. `test_the_leisure_lesson_repairs.py` L112 (skill lessons
  left alone) inverts either way.
- **His 13b in the code.** Today the check passes only a launch with a
  `goodLooksLike` pair or an earlier model shown; a launch whose `goodLooksLike`
  is `null` because the criteria already show a good one (CONTENT L171's own case,
  and 13b) is refused unless an earlier beat showed one. The program cannot see
  whether criteria "show a good one". Proposed: a launch present with
  `goodLooksLike: null` passes when the beat carries success criteria
  (`successCriteriaRefs` not empty), and the reviewer judges the claim (its launch
  line, which gains 13b here). This loosens today's code in the one place his
  answer asks for; test both sides (risk 14).

### Decisions 3 and 4 (his 3, widened): the teacher's way of explaining, written once

His words: "thats how i explain anything, so might not neccearily be teach slides
i guess". Read-back: written once, as how he usually explains, read wherever
something is explained (a Teach slide in any kind of lesson, and the explanations
elsewhere), still not a template; the two exceptions (a skills lesson's brief
board, discovery's key sentence at the end) stay. His starters answer of the same
afternoon gives the parts in his words: the because or so "just to explain that
one key point"; "then addressing a misconception or pointing to an example".

- **Two headings in CONTENT's output block** (below the reviewer's line, so what
  the reviewer reads does not change; it already carries the four parts in REV
  C11): `### How this teacher explains`, holding L114 to L122 as they stand
  (RT-E45 to E63), with L124 to L130 (the Teach's `thinking`, `teachingText`,
  `keyQuestions` and anchor lines, RT-E64 to E67) moved above it first so the
  section holds only the explaining; and `### The launch`, holding L171 to L183
  (RT-E70 to E77).
  Moves, not rewords, except these: the bold sentence (RT-E45, «**The shape this
  teacher teaches in, more often than not, is four parts in this order, and the
  board should read that way unless the beat has a reason not to.**») becomes his
  read-back: this is how he usually explains anything, a Teach board or any other
  explanation, "the takeaway, then a because or so that explains that one key
  point, then an example or what it does not mean", not a template; one sentence
  names the two exceptions and where each lives; one sentence names the field that
  carries it in each route (CONTENT `explanation`; SKILL `teach` `explanation` and
  a `prepare` in `explanation` mode's `activity`; TASK `teach-needed`
  `explanation`; DISC `accurateExplanation`, its takeaway kept to the end; DIAL a
  `grounding-input` when it explains). "In this order" loosens for the last two
  parts, as his words do (risk 4).
- **Each route points there, keeping its own exception:** SKILL L194 (RT-C28,
  brief on the board: one sentence of why, something to look at, the line that
  lands it) is the paragraph 7A edits, so it stays word for word and the pointer
  goes in SKILL's output block instead (below); SKILL L239 (RT-D21, «two or
  three short lines on the board (what the idea means, why it matters, what it
  looks like)»), TASK L17 and L65 (RT-F05, F29, the same three-line shape) and
  DISC L37 and L65 (RT-H07, H14, «what happened, why, what it looks like») each
  replace their three-line shape with the heading, DISC keeping "the takeaway
  lands at the end, because children reach it themselves"; DIAL's grounding input
  (RT-G19) points there when it explains. SKILL's output block (RT-D29) gains one
  line: a `teach` beat takes CONTENT's Teach fields and explains as `How this
  teacher explains` says, kept brief as the Cycles section says (C28); a
  `practise` beat takes CONTENT's Practise fields and `The launch`. SKILL L198 (RT-C30, "the full launch its size
  deserves") names `The launch`.
- **The designer reads it:** LD, beside the success-criteria read line (RT-P11,
  L295), gains one paragraph modelled on it: when the route is not content-based
  and the lesson has a beat that explains (the kinds above), read
  `teaching-sequence-content-based.md` → `How this teacher explains` with
  `read-reference.py --select`, not the file; when it launches a substantial task
  (a `do-task`, a skill `practise`), read `→ The launch` the same way. The
  mechanism exists (`--select FILE::HEADING`, checked in `read-reference.py`).
  LD L406 (RT-P06) and REV L44 (RV-C11) name the new heading instead of
  "`teaching-sequence-content-based.md` → `explanation`".
- **Explanations elsewhere:** TV §5 (Explanations and definitions) gains one
  pointer sentence: an explanation usually goes the way the teacher explains
  (`teaching-sequence-content-based.md` → How this teacher explains), and it is not
  a template.
- **Pins:** E45 to E59 are pinned by `test_the_board_carries_the_route.py`,
  `test_the_lesson_is_written_as_a_lesson.py`,
  `test_the_board_teaches_and_the_criteria_are_runnable.py` and three more; E70 to
  E77 by `test_teaching_reaches_the_board.py` and the SC, AK and VOC pin files. A
  pin names its section by heading, so every one of these moves to the new heading
  in this release.

### Decision 5 (his "y"): when planning gets its own slide

TASK L27 (RT-F12) «Planning and doing may continue as one flowing task unless
separating the plan materially improves the work or protects one of those
important conditions.» becomes "Planning and doing continue as one flowing task,
with any check for safety or wasted materials inside it as the teacher's check;
the plan gets its own beat only when it produces something children need before
they start (a fair-test plan, a labelled design)." F11 (the checkpoint's own
conditions, QC-K16 pinned), F15 and F20 are unchanged and now agree. No code: the
validator already allows at most one plan beat.

### Decision 8 (his "y"): the "Look for" note

ET L81 (RT-K18) «Put those questions in `speakerNotes.lookFor` on the task beat,
naming the links most likely to be skipped and the question to ask at each»
becomes: the one link most children skip, and the question to ask at it, inside
the 25 words; the other likely gaps and their questions go in the task beat's
`speakerNotes.teacherInfo` beside the likely mistakes. Its example is shortened
to fit, checked by script (at most 25 words, as the validator counts them).
LD's Look for line (RT-P18) is unchanged.

### Settled items 6 and 7 (his "y")

- **6:** LDC L25 (RT-A24) «after one short enabling input» becomes «after a short
  enabling input, one idea at a time».
- **7a:** SKILL L55 (RT-B29) «for My Turn, do not create a following answer slide»
  becomes "the finished helper follows on the next slide as the unit's answer
  (`modelling-formats.md` → Live-complete helper)".
- **7b:** LD L327 (RT-P12) `ending.kind` = "reflect" becoming "Reflect" (as
  VALIDATOR L4130 and OT need) is carried by 7A (its A7, the same line). Checked
  here.
- **7c:** DB L25 (RT-I10) stops promising fields most entries lack (it says what
  the entries do carry, checked entry by entry); DB L62 (RT-I25) says seven, not
  eight, for §1 to §3 and names entries that exist instead of "brain dump" and
  "turn and talk"; J04 «Lower stakes than Brain Dump», J11's «Turn-and-Talk», J15's
  «Turn-and-Talk», J39's «Turn and Talk» name the entries that replaced them (1.1,
  2.1). The pinned §5 and §8 counts are true and stay.
- **7d:** ES L241 (RT-A42) «sentence stems, push-back questions and synthesis are
  conditional teaching tools» becomes «sentence stems and push-back questions are
  conditional teaching tools» and the one Synthesise is named as the route's
  (A19, G10, the validator).
- **7e (code):** PACKET `ACTIVITY_IS_THE_TASK_KINDS` (L71) and the class view's
  child-facing fields (`CHILD_FACING_CONTENT_KEYS`, L52) gain a `prepare` unit in `explanation` mode and
  a `teach-needed` unit's `modelledOn`; LD L359 (RT-P10) says the same. Every saved
  view with such a beat changes its count line; each difference is listed. The
  voice harness's fixture builder calls `build_class_view` (VG-Q04): its tests run
  in this release. (Found while planning, not in 7e and not changed: a
  `bounded-attempt`'s `activity` and a discovery `use-learning`'s `activity` are
  also words children are given; named for him in the report.)
- **7f:** LD L68 (RT-P19, "never the slot") is PF-V11, carried by 7A (its A11). This release rewords VALIDATOR L2982's message (RT-Q03) so it
  asks for the move after the turn word outside maths and accepts the plain turn
  word in maths, matching PREF → Slide Headings. The two rules the check holds
  and nothing states are written where the designer reads them: SKILL, beside
  RT-C20, "run each concept's cycles together, in the order `concepts` lists them"
  (RT-Q05); DIAL, beside RT-G22, "a Talk's `discussionQuestion` is its Stimulus's
  `question`, word for word" (RT-Q09).
- **7g:** LD L419 (RT-P07) points at `Cycles, and the beats around them` (AK-F13
  pin moves); ES L255's sources (RT-A48) move from the Task-Centred subsection to
  the Dialogic one (the structure menu reads exactly one `**Use when.**` paragraph
  per subsection: run it, and `test_make_lesson_static_contract.py`, after); ES
  «Roediger & Karpyne» becomes Karpicke (RT-O07, in §1, the starters' section:
  whichever release lands second re-reads it); ES L3 (RT-O01) «designing lesson
  PowerPoints» becomes «designing lessons»; SKILL L235 (RT-D19) «the existing
  route's optional explanation» becomes «the route's optional explanation»; DB's
  three sources for entries that are gone (RT-J52) come out.
- **7h and 7k are carried by 7A** (its A5, settled by the lead on 24 September:
  "this decision stays whole in 7A, route-file lines included"): CONTENT L31
  (RT-E12, E13, E80), L99 to L105 (E40 to E44, and E41 and E42's story), SKILL
  L194 and L196 (RT-C27, C29), OT L364. 7A keeps E80's banner, strip and
  labelled outcome and makes the headline "usually" the place, which is his g
  ("usually at the top, as you usually explain"). This release neither rewords
  nor moves those lines: the `How this teacher explains` heading starts at L114,
  after them, and SKILL's C27 and C29 stay where 7A leaves them. The lead ruled
  (24 September) that this decision stays whole in 7A; this release re-reads every
  one of those lines, and their 7A pins, on the committed 7A tree before editing
  anything near them.
- **7i:** LD L162 (RT-P37) «keep one takeaway as key line, full spoken in script»
  becomes «keep one takeaway as key line, with the route on the board in whole
  sentences and said more fully in the script».
- **7j:** VALIDATOR L2065's message (RT-Q33) «the route from what the class
  already has, through the thing on the board, to the sentence the slide lands»
  describes the teaching in his order, opening on the key sentence.
- **"You can pass"** (his preferences decision 15): CONTENT L122 (RT-E59, E63)
  and TASK L17 and L19 (RT-F06) lose it in 7B (its B6), before this release moves
  L122 under the new heading with 7B's words and pins.

### Stories leaving in this release (copied to LOG first where missing)

RT-C34 (the 19 September nearest-1,000 design; his words "the rubbing out was the
slowest part" added to LOG), RT-C36, RT-E14 and E62's second telling (the teeth
slide: LOG gains the `Incisors cut` wording; 7B copies PF-Q02, the same slide, so
check its words first), RT-E51, RT-E54's date (his words stay), RT-E58's tooth
slide (his Tudor words stay), RT-E77, RT-I12 (not in LOG; its reason stays),
RT-N05, RT-N08, RT-C05's date. RT-E42 is 7A's (its A13). His calibration
examples stay exactly: the Shaftesbury lines, "Look at her. She isn't being paid
to do this.", the Victorian children, the tooth-decay pair.

### Tests, pins and size

New `routes_ledger_pins.json` for the rows this release changes; pins moved in
TD, QC, SC, AK and VOC; the validator tests (a task and a skill explanation task,
both readings of question 2 until he answers); the review-view tests (7e); the
structure-menu test. Rows: about 65 of 592 (7A and 7B carry about ten of this
list's rows: 7b, 7h, 7k and the pass lines). Code: VALIDATOR about 1 KB larger,
PACKET small. Instructions: roughly even (the two headings and the designer's
read line in, three three-line shapes and the stale lines out); LD about 0.6 KB
larger. A non-content lesson that explains reads about 4 KB more (the section it
now meets); that is the point of his answer, not a saving.

---

## 5. Release 4: the routes, one copy of each rule

Every fold keeps each copy's extra condition, permission and example, and keeps
its strength. Homes are chosen where their reader reads them: a route's shared
lines do not move to `output-template.md`, because the designer reads that file
only selectively on the scaffold route (LD L569), which would drop them from
every normal run (risk 6).

| Family (ledger rows) | Home afterwards | Copies become |
|---|---|---|
| The route file's opening line, four copies (RT-A10) | LD's `Teaching Sequence - Read Matching Reference` (A54 to A57 already say it) | removed from SKILL, CONTENT, TASK, DIAL |
| The output blocks' closing lines: visuals by reference (D27, E67, F42, H17); answers and script in their fields (D28, E78, F42, H17) | LD's `Teaching Sequence - Read Matching Reference`, one paragraph carrying every clause (E78's "without leaking independent answers before the attempt", D28's "each turn's exact script") | removed from the five blocks; each block's opening line keeps its own kind list |
| The launch fields, twice (E70 to E77; F33 to F40) | CONTENT `### The launch` (release 3), which gains F35's design-and-make example beside E71's | TASK's block keeps its `do-task` JSON and points there; F18 (above the line) unchanged |
| The move and the exact instance, five copies, none whole (B27, F09, N17, O13, P08) | LD L227 (P08), gaining the teacher's freedom to swap the example, the suggested exemplar and the live helper staying constructable | B27, N17 point to it; F09 keeps its task-route sentences; O13 stays as the evidence file's own statement |
| The skill route's restatement of the modelling states (B23 to B33) | MF | B24, B30 cut; B32's "a skill lesson may set it" moves into MF N11; B25 stays (its "removed" is stronger than N14's "not a default"); B31, B34 to B38 are the skill route's own |
| The structure-reading rule, six copies (A04, A60, O04, P23) | within each file: A04 into P23 (LD), keeping A04's full Discovery subsection; A60 into O04 (ES) | cut |
| The answer rule (E34) | LD L385 (P17) | CONTENT keeps a one-line pointer |
| Procedure boundary, three discovery conditions, the 80% line, "the routine is the teacher's" | stay where they are | each copy carries its own clause (the ledger's own rows say so); the routine copies wait on topic 7's home (PF-F03) and are left if topic 7 does not fold them |

Rows: about 60. Bytes: the route files about 3 to 5 KB smaller, LD about 0.5 KB
larger. Measured, and reported plainly even if small.

---

## 6. Release 5: the voice guide

### Decisions

- **1 (his "yes"): the two parts nobody is sent to.** TV L20 (VG-A07) gains "a
  sentence stem or other support opens §7" and "§14 is read once, when the kind
  of lesson is settled".
- **2 (his "yes"): the chipped tooth.** The clause goes into PREF → Slide
  Philosophy, "A case arrives with the context that makes it make sense" (PF-P01,
  AK's pinned text): "before the case" means before the question about it, and
  when the thing is on the board the sentence about it comes first and the general
  one straight after. His own order in TV §6 (VG-F05) does not change. PREF is
  topic 7's file, but 7B leaves this paragraph (L559) to this release (its
  table); the AK pin moves with it.
- **4 (his "yes"): the speech guidance's trigger.** `agents/slide-designer.md` L55
  (VG-K24), `agents/slide-designer-focused-repair.md` L48 (K25) and
  `references/slide-composition-playbook.md` L282 (K26) take SPEECH's own list
  word for word: a speaking character, a voiced claim, a misconception, a
  disagreement, a prediction to judge, an advice-to-a-character move, or anyone
  who simply says what they think, gives their reason or asks a question. K24
  keeps its pinned opening («when a unit contains a speaking character»,
  `test_slide_designer_brain_contract.py`).
- **9 and 10 (his 4 and 5), turned round: humour wherever.** "Humour wherever, but
  I still never see it on slides!" and "humour is allowed in pshe". No instruction
  carries "never maths" (it is only in LOG, VG-D25); TV §4's "When humour is
  optional" (L239) gains his words, undated: every subject can have it, maths and
  PSHE included. D20 (procedural content "often" works best without) and D21, D22
  (never the sensitive issue itself) stay. The melons line stays as an example (the
  read-back). LOG records that "never maths" no longer stands. The complaint itself
  is section 7.
- **11 (his 6): a named class, livelier.** "Named but not always class 4a 4b etc,
  jazz it up." LD L125 (VG-K29) «Give it a plain ordinary name the first time it
  appears (`Class 4B`, `the Hill Road team`)» becomes a name the first time, and
  not always a class code (`Oak Class`, `the class at Hilltop School`, `the Hill
  Road team`), the examples his read-back used; TV §6 L378 to L380 (F12, F14) gain
  the same clause beside their examples, which stay. Pins: K29 (PF-N29, AK-B34),
  F12 and F14 (`test_the_class_is_inside_the_lesson.py`) move.
- **12 (his "yes"): discussion notes.** DIAL L29 (VG-L46, RT-G09) gains "the
  discussion itself is not scripted; the words that open and frame it are". The
  program's script requirement on `stimulus-talk` (VG-Q27) agrees.
- **13 (his a, via his preferences answer):** "a nine-year-old" goes from the four
  places, each saying a child in this class: LD L88, PREF L218 and L222, and
  `agents/adaptation-designer.md` L282 (VG-M21). All four are carried by 7B (its
  B1); this release checks them. The reviewer's "eight- or nine-year-old" is
  release 2's.

### Settled items

- **1:** TV L22's "the two most often missed" names all four (§6, §12, definitions,
  scripts), each with its reason; LD L555 (VG-M05) drops its own shorter list and
  points at that route, keeping its line sending the first script to §16H (pins in
  VOC, SC and a test move).
- **5 (to be looked at again in the humour fix):** "Do not normally reverse" stays;
  LD L90 (VG-L04) «never the reverse» and PREF L57 (VG-L20) «not the other way
  round» come into line with it (7B only takes L57's date off, its B17, and leaves
  the words to this release).
- **6, "keep precise subject vocabulary":** the home is Written Voice's "Explain
  rather than merely simplify" (VG-N02). Honestly, almost every copy is a
  condition for its own reader and stays: the fold is the two plain repeats,
  `adaptive-adaptation.md` L180 (N14, the same rule two lines above N15) cut, and
  `agents/adaptation-designer.md` L192 (N12) becoming a pointer that keeps "a
  separate Below resource". Both scripts' copies stay (N07, N08). VOC pins move.
  The log says what was folded and what was not.
- **8, out-of-date:** TV §16H's staging note (J27) names both cases; the em dash
  leaves TV §15's "avoid unless" list for the never list (J13); both "quick, punchy"
  orders stay as they are; PREF's hand-off pointer (VG-L27, «The full voice and
  worked examples live in the Speaker Notes Voice section of the lesson-designer
  agent») names TV §16H too, unless 7B's B1 rewrite of that section already has;
  PF-D41 and PF-F75, which 7B hands here, stay exactly, because they are his
  calibration examples (risk 15); LD's
  «That section is the one place every vocabulary decision is written» (M11) is
  corrected (VOC pin moves); the harness read-me's "empty structure" and the sweep
  runner's "the paragraph before" (Q02, Q13) are corrected; the long dashes in
  examples in topic 8's files (DB L157, L277, L382, L435; DIAL L26; TASK L29) are
  replaced, ES L243 keeps its dash only if it is the quoted thing to avoid; PREF's
  three (L317, L563, L675) are replaced here if 7B has left them; those in
  `templates.md` and the wall files, and the messages to him (item 8), go to
  topic 9.
- **3, 7, 14, 15:** no change.
- **Maintainer text:** TV's `## Maintenance` (VG-A16, A17) sits inside §17, which
  the reviewer prints every review; it moves to the harness read-me, keeping «Treat
  this guide as the default runtime specification.» in the guide.

### Stories

A11's three prompts leave TV L22 (LOG lacks the Greater Depth diet sheet: copied
first), A12's reason stays; C13 keeps one plain telling as its example (AK-G09
moves); C05's and D15's dates go, his words stay; L18, O07, O49, L61's tooth slide
and the code-comment stories (P04, Q29) are copied to LOG where missing.

### Tests, pins and size

New `teacher_voice_ledger_pins.json` and its test; pins moved in VOC, AK, SC, QC,
TD; the harness suite. Rows: about 45 of 470. TV about 1 to 2 KB smaller (A11,
Maintenance out; his humour words, the class clause and two routes in); LD about
0.3 KB smaller; the slide designer's three triggers about 0.3 KB larger.

---

## 7. "I still never see it on slides!": the diagnosis first, then release 6

His words: "Humour wherever, but I still never see it on slides!" Read-back: find
why a light line never reaches the board and repair the cause, not add a rule.

### The diagnosis (read only; can start now)

**What the probe already shows** (`scratch/t8plan_probe.py`, 53 saved designs):
a word search finds no humour line at all in 36 closing-decision records; 5
record "none"; of the lessons that found one, the lines went to the script ("one light spoken line",
"Used once, in the script for slide 3", "said in the first My Turn script", "One
spoken line on slide 3", "in the first spoken model") and one reached a board (the
tooth-decay lesson: "it is on the board, not in the notes"). The symptom is real
and consistent; the cause is not yet shown.

**Evidence to read, in order:**

1. Every saved design's recorded humour answer (LD L521 asks for it in the
   closing decisions), matched to where the named line ended: a board field, the
   script, or nowhere. Then the built `lesson.json` and the deck for the same
   lesson (the six decks at the project root, the working folders): did a line
   written into a board field survive the slide stage?
2. His Codex decks since 12 September on his drive, and the week 3 science lesson
   he taught on 23 September and named as wording worth studying.
3. LOG's 12 September entries (4.2.151, 4.2.152), which diagnosed the same symptom
   twice (the routing at the completion pass; the four-pieces ceiling demoting a
   line that arrived last), to see whether either fix reached the runs since.

**The rules a light line passes, each tested against that evidence:**

- *When the designer meets §4.* TV L20 and LD L555: "Read §4 once ... at
  completion, not for each string"; LD L519 to L521, the completion pass. Every
  board is written and validated by then, so a line found then is cheapest in the
  script.
- *Which surface the notes voice sends it to.* TV L119 "Do not normally reverse";
  LD L90 "never the reverse"; PREF L57 "not the other way round". A light line is
  conversational, and two of the three copies say a conversational line never goes
  on the board. (Release 5 already brings them to "normally".)
- *Whether a board has a place for it.* A Teach board's fields are the takeaway
  (`headline`), the route's four parts (`explanation`) and `keyQuestions`; a skill
  turn's board is "the question, the tool and the criteria" (Pride Lessons), with
  its guiding questions spoken (SKILL L75). No field names a light line, so one
  must pass as a part of the route or not go up at all. If that is the cause, the
  repair needs a mechanism that does not exist yet, and the diagnosis says so
  before anything promises it.
- *The budget.* PREF L788 to L792 (four pieces; "a light line competes here like
  anything else") covers a Teach board only.
- *The slide stage.* Whether the slide designer tightens, drops or moves a line it
  finds in a board field (its fit repairs, "every visible sentence earns its
  place").
- *The review.* REV G23 and G24 judge the opportunity once and accept "on the
  slide or in the script as the moment suits"; nothing asks whether a line the
  script carries would do more on the board ("on a slide holding four things it is
  the one a child reads twice", TV L229).
- *The programs.* Whether the validator's says-once check or any length check
  refuses an extra sentence in a board field.

**Output:** `plans/2026-09-2x-humour-on-the-board-diagnosis.md`, each cause with its
evidence and how many lines it accounts for, and the repair proposed to him in the
three-part shape. Limits the repair keeps whatever it is: never a quota, "none is
the right answer then", the turn test, and the sensitive-issue limits.

### Release 6

Decided by the diagnosis and his answer. Candidates only, none promised: meet §4
while each board is written rather than after; name where a light line sits on
each kind of board (only if a mechanism exists or is built); ask at review whether
a spoken light line should be on the board; and settled item 5's "normally", which
he left to this fix. It will likely reach PREF (topic 7's file) and the slide
designer (topic 9): the diagnosis names who carries each part.

---

## 8. Where topic 8 meets the other releases (who carries what)

Agreed with topic 7's plan (`2026-09-24-topic-7-change-plan.md`, "Where his
answers meet the other lists", which already names this plan's releases). Where
a line is carried elsewhere, the topic 8 release that owns the list checks it
landed and records that in its mapping, so no row is claimed twice or dropped.

| # | Lines | Carried by |
|---|---|---|
| 1 | Maths titles: RV-K02 = PF-V10, RT-P19 = PF-V11 | 7A (its A11), once; the validator's turn-label message RT-Q03 is release 3's |
| 2 | Drawings on serious history lessons: SJ-F28 | 7B (its B4) |
| 3 | "A nine-year-old": LD L88, PREF L218, L222, adaptation designer L282 (with PF-N82) | 7B (its B1); REV L130 (RV-G09) is release 2's, by the lead's ruling |
| 4 | The launch home (PREF L641) and pointers in LD (L243, L406) and REV (L205, RV-J36) | 7B writes them in routes decision 2's words; release 3 adds 13b's criteria case to all four with the route files and the validator (13b moved from 7B); L641 edited in both, each for a named change |
| 5 | Slide Philosophy's case-context clause (voice decision 2, PREF L559) | release 5 (7B leaves it) |
| 6 | PREF Contents reading paragraph (RV-T11) | 7A (its A12, with the whole contents block) |
| 7 | "You can pass" in CONTENT L122 (RT-E59, E63) and TASK L17, L19 (RT-F06, and L19's TD-pinned example) | 7B (its B6) |
| 8 | The sticky fact's and the key sentence's place (routes 7h, 7k; CONTENT L31, L99 to L105; SKILL L194, L196; OT L364; the slide SC line) | 7A (its A5), whole, by the lead's ruling; release 3 re-reads them after 7A lands and neither rewords nor moves them |
| 9 | ES precedence clauses (topic 7 settled 12, and ET L58, M30) and ES corrections (routes 7d, 7g) | 7B first; release 3 re-reads ES and ET |
| 10 | PREF L57 "not the other way round" (voice settled 5) | release 5 (7B takes only its date) |
| 11 | LD L327 `ending.kind` "Reflect" (routes 7b) | 7A (its A7) |
| 12 | PACKET | 7A first (the Scope, Deferred learning and Lesson 2 lines leave the view; the Apply trigger gains a case; the Pride note corrected); release 2's three triggers rebase on it |
| 13 | REV L42 (C01 to C06) | 7B adds the four-pieces pointer; release 2 takes C06's story out after it |
| 14 | A light line and Pride Lessons (PREF L788 to L792, L87) | release 6 if the diagnosis needs them (7B leaves them) |
| 15 | PF-D41 and PF-F75 (his stem and criteria examples in TV) | handed by 7B to release 5, where they stay exactly (risk 15) |
| 16 | The playbook's retired-review lines (RV-A10, R23), the Phase 1.25 paragraph order ("When it fails" after the validator run), RV-R14 (the review step's log sentence, PB-I14) | the playbook release, with its three hardened tests (agreed with its planner) |
| 16a | PB-B21 (the skill's test-run line) and `computer-setup.md` L200's "writing a subject file" (PB-V20) | release 1 |
| 17 | RV-T22, and the reviewer's worksheet section (WS I05, Q02, Q08) | the worksheets release (4.2.290); release 2 re-reads REV section 5 after it |
| 18 | Speaker pictures smaller wherever needed (his voice answer) | topic 9 |
| 19 | The circuit drawing guidance (subject decision 8) | release 1 (no other plan carries it) |

---

## 9. The homes afterwards

| Rule | Home | Pointers keeping their conditions |
|---|---|---|
| What the review is for, the two judgements, the four outcomes, what it may correct | REV | REV-REPAIR's own copies (its role never reads REV) |
| What the reviewer reads | PACKET's card (code) and REV's numbered list | REV F20 |
| The teacher's way of explaining | CONTENT → How this teacher explains | SKILL D29's new line (keeping C28's brevity), D21; TASK F05, F29; DISC H07, H14 (at the end); DIAL G19; LD P06 and its read line; REV C11; TV §5 |
| The launch, its fields | PREF → Slide Philosophy L641 for the rule (7B, with 13b from release 3); CONTENT → The launch for the fields | TASK F18, F34; SKILL C30, D29; LD L243, L406; REV J36 |
| When the launch may be null | CONTENT E30 | TASK F19, F34; CONTENT E70 |
| Movement and four corners | DB §6 and §7 (J33, J35, J36) | DIAL G05, G07; LD P04; SKILL B39 |
| Modelling states | MF | SKILL B23, B25, B28, B31 to B38 |
| Food and diet | the NHS Eatwell Guide, named in SUBJ-pshe and SUBJ-science | none |
| When to read a subject file | LD's reading line | the four files that carry their own extras |
| Humour | TV §4 | LD completion pass, REV G23 and G24, PREF L87 and L792 |
| Speech-bubble trigger | SPEECH's opening | the slide designer's three read lines, word for word |

---

## 10. Stories

The standing rule applies throughout: copy to LOG first when missing (one
"Stories kept here" block in each release's entry, as 4.2.288 did), check each by
script, then move the runtime text; reasons stay; his rulings keep his words
without their dates; his calibration examples stay exactly (the Victorian sketch,
the Tudor boards, Pride Lessons, the Shaftesbury lines, the tooth-decay pair, "Look
at her", the teeth jobs line). Missing from LOG today and copied first: SJ-C43/C50
(release 1); RT-I12, RT-C34's words, the teeth slide's wording (release 3; RT-E42
is 7A's);
VG-A11's diet sheet, L18, O07, O49, L61's tooth slide (release 5). Undated cases
that make a rule clear stay as plain examples (SJ-E42, H18, H39, I23).

---

## 11. Order of work within each release

Each release: re-check its ledger's quotes on the committed tree; baseline; copy
stories; edit by script (every replacement asserts its old text once; Windows line
endings; scripts written with the Write tool); move the pins it touches and record
each in its own ledger; build the mapping and pins; all suites and the saved
designs (and, for releases 2 and 3, the saved cards and views) before and after,
every difference explained; two independent checks (the second re-testing the
repairs), attacking the pins on a complete scratch copy tested untouched first; LOG
entry true to what was done; both `plugin.json` bumped; report to him and ask how
he wants the before-and-after lessons run (a Codex rerun overwrites the delivered
deck on his drive, so it is copied first). Release 3 adds a narrow third check on
the validator and the view code, as the success-criteria release needed.

Scripts: `sj_01_stories`, `sj_02_remove`, `sj_03_subjects`, `sj_04_reaches`
(RP, geography, templates, worksheet helpers), `sj_05_pins`; `rv_01_stories`,
`rv_02_reviewer`, `rv_03_card` (code), `rv_04_fixture`, `rv_05_pins`;
`rt3_01_stories`, `rt3_02_routes`, `rt3_03_headings`, `rt3_04_designer`,
`rt3_05_code` (validator messages and the explanation check, the class view),
`rt3_06_pins`; `rt4_01_folds`, `rt4_02_pins`; `vg_01_stories`, `vg_02_guide`,
`vg_03_reaches` (LD, DIAL, the slide designer's three lines, the adaptation
files), `vg_04_pins`.

---

## 12. Risks

1. **A pointer that paraphrases keeps the permitting half.** Decisions 3 and 4
   replace three-line shapes with a pointer: each keeps its exception in its own
   words (SKILL's brevity, DISC's sentence at the end), and each is pinned whole.
2. **Three of his answers meet in the launch.** His preferences settled item 2
   (the case first; the pointers keep their trigger), routes decision 2 (skipped
   only when a good one was seen earlier in this lesson) and preferences 13b
   (criteria that already show a good one count as seen). 7B writes the home and
   the three pointers with decision 2; release 3 adds 13b to all four with the
   route files and the code. Afterwards every place must say the same two
   exemptions and nothing wider; the checker compares them side by side.
3. **"Together" in RV-C15.** Settled item 4 removes "together" from RV-I07; C15's
   «read the two together» is the board-first comparison itself. A checker may
   flag it; the log says why it stays.
4. **His explaining order.** The home says "then an example or what it does not
   mean", his words, where CONTENT says "four parts in this order". The Victorian
   and Shaftesbury examples keep their order; the reviewer's C11 checks for the
   parts, not their order, so no finding changes.
5. **The explanation check's reach into maths** (question 2): the code is not
   written until he answers; the probe's six saved designs are the before-and-after
   evidence either way.
6. **A fold that moves a rule where its reader does not look.** Output-template is
   read selectively; the shared route lines go to LD instead. Every fold's home is
   checked against who reads it and when.
7. **Pinned paragraphs of five finished topics.** The reviewer's file is mostly
   other topics' checks (129 of 278 rows, 93 pinned); release 2 moves pins in AK,
   QC, SC, TD and VOC. The rounds' lesson: repin whole the paragraphs a changed
   sentence sits in, or their conditions thin unseen.
8. **Removing a skill removes a door.** After release 1 there is no command for
   writing a subject file; his answer wants exactly that. Codex keeps the command
   until he refreshes the install.
9. **Food rules outside PSHE.** "Gone" must not be overclaimed: the reviewer's
   lunch examples, the food-plate caption and the general count rule stay, and the
   log says so.
10. **The circuit guidance is topic 9's text.** Release 1 edits one sentence in
    each place a designer reads; topic 9 re-reads it.
11. **The review view's count changes** (7e): every affected saved review's count
    line differs; the voice harness reads the same view and its fixtures are re-run.
12. **The humour repair may need a board field that does not exist.** The
    diagnosis names the mechanism before anything promises it (the rounds' lesson:
    check the mechanism exists before writing the promise).
13. **Lines moved by five earlier releases** (4.2.289, 4.2.290, 7A, 7B, 7C). Every
    line number here is from the working tree of 24 September; the re-check in
    section 0 comes first.
14. **The launch check loosens in one place** (release 3, 13b): a launch with
    `goodLooksLike: null` on a beat that carries criteria would pass the program,
    which cannot see whether the criteria show a good one. The reviewer's launch
    line is the net; tests hold both sides, and the saved designs show whether any
    lesson now passes that failed before.
15. **Two of his answers meet on his own examples.** His preferences settled item
    14 approved correcting PF-F75 (the criteria example's `LO: Write a setting
    description` lacks `To`) and PF-D41 (the stem example writes `will not` for the
    question's `won't`); the voice list's settled 7 and the standing rule keep his
    calibration examples exactly. The standing rule and the more specific voice
    ruling win: both stay, and the log says why.
16. **What 7A and 7B leave in this plan's files.** 7B edits REV L42 and L205, the
    route files' pass lines and ES; 7A edits CONTENT and SKILL's key-sentence lines
    and PACKET. Each topic 8 release re-reads those lines on the committed tree and
    changes nothing 7A or 7B owns (section 8).

---

## 13. What his answers leave open

**Question 1: a picture of the Prophet in a lesson that is not RE.**

- **What it says now.** The RE file says no lesson may ask for a picture of the
  Prophet Muhammad or any prophet. Only RE lessons read that file, so a history
  lesson on early Islamic Baghdad never meets it. Your answers on the food rules
  did not cover this half.
- **What I think.** It is a real gap: the rule says "no lesson", and only one kind
  of lesson can see it.
- **What I suggest.** The one sentence moves to the picture rules every lesson
  reads; the RE file keeps its examples (the mosque, the Qur'an, calligraphy).
- **Question:** yes, or leave it where it is?
- **His reply (24 September, evening):** he asked who the Prophet Muhammad is and why
  pictures are not allowed; answered, and asked again.
- **His answer:** "Okay, so yeah, let's not have any pictures of him." Yes: the
  sentence moves to the picture rules every lesson reads; RE keeps its examples.

**Question 2: must a maths class see a good explanation before it writes one?**

- **What it says now.** You said yes to one rule everywhere: before children
  write an explanation, they see a good one earlier in the lesson, and the check
  covers a skills lesson's bigger practice too. Six of the saved maths lessons end
  on a question like "Amira says 3,448 rounds to 3,500 because the ones digit is
  8. Is Amira right? Explain using the number line." None of them showed a good
  explanation first; the My Turns showed the rounding, not an explanation of it.
- **What I think.** Your rule fits these: a child told "explain" who has never
  seen what a good maths explanation looks like is the leisure lesson's gap again.
  It costs little, because an Our Turn with a reasoning question whose answer is
  shown on the board is enough.
- **What I suggest.** A My Turn or Our Turn counts only when it shows the kind of
  thing children then write. Those six lessons would each have been sent back to
  show one good explanation first.
- **Question:** yes, or should a maths My Turn count as the good one?
- **His answer (24 September, evening):** "Yes", which takes the suggestion: a My Turn
  or Our Turn counts only when it shows the kind of thing children then write. Read
  back to him.

---

## 14. Size, honestly

- **Rows:** about 350 of the four lists' 1,980 change in topic 8's releases
  (release 1 about 140, most of them removed with their files; release 2 about 40;
  release 3 about 65; release 4 about 60; release 5 about 45), and about 20 more in
  topic 7's (section 8); the rest are pinned where they stand. Release 6 is
  sized by the diagnosis.
- **Files:** release 1 about 12 plus two deleted; release 2 about 4 (REV, PACKET,
  the fixture, tests) plus five pin files; release 3 about 17 (the five routes, DB,
  ES, ET, LD, LDC, PREF for 13b, REV, TV, VALIDATOR, PACKET and their tests); release 4 about 8;
  release 5 about 12.
- **Bytes:** the package about 31 KB smaller (the skill and its guide). What an
  agent reads: the reviewer about 2 KB less every review; a PSHE lesson about 1.7
  KB less; the route files about 3 to 5 KB less after the folds; the lesson
  designer's file about 1 KB larger (two read lines and the folded shared route
  lines), and a non-content lesson that explains reads about 4 KB more, because his
  answer asks it to. Pins and tests grow by about 150 to 250 KB across the four
  pin files; LOG gains each entry and the stories.
- **Effort:** release 1 small to medium; release 2 about vocabulary's size; release
  3 the largest, about the success-criteria release's size with less engine work
  (plan for two checks and a narrow code check); release 4 medium; release 5
  medium; the diagnosis a day's reading; release 6 unknown until then. About twelve
  independent checks in all.
