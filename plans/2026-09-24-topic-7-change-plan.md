# Topic 7: the change plan (24 September 2026)

Step 5 of `streamline-plan.md` for topic 7, drafted from Daniel's answers of 24
September on both of its ledgers: starters, sticky knowledge and the Apply slide
(`2026-09-23-starters-sticky-apply-ledger.md`, `SA-`, 390 rows) and the rest of
`preferences.md` (`2026-09-23-preferences-rest-ledger.md`, `PF-`, 1,779 rows).
His words in each ledger's "His answers, 24 September" sections are the standard;
where a read-back follows them, the read-back is what he agreed. Planning only:
nothing in the plugin was changed to write this. Scratch work is in
`streamline-tools/scratch/t7plan_*` (the row parser, the pin finder and its two
reports, `t7plan_pins_a.txt` and `t7plan_pins_b.txt`, which list every pin and
test holding a paragraph this plan edits).

Line numbers are the working tree of 24 September: 4.2.288 committed
(`baabb1b3`) with the 4.2.289 long-criteria fit release uncommitted on top.
Where a number comes from a ledger row, it is the night of 23 September; in
`templates.md`, lines after L186 now sit two lower, because 4.2.289 added two.
Scripts must find text by its words, never by these numbers.

## In one screen

- **Three releases carry his answers, and two more he already set apart.**
  - **7A, how a lesson opens and closes.** The whole starters, sticky and Apply
    ledger, plus the answers from the other list that live in the same
    paragraphs or the same code: the Lesson 2 plan (PF decision 20), the slide
    titles (PF settled item 1, decision 21), and the working wall's wording (SA
    decision 7 with the wording half of PF decision 22). Both retired fields go
    here, so the lesson file's contract changes once.
  - **7B, the rest of preferences.** Every other answer on the second list.
    Words only: no program changes.
  - **7C, colours.** PF decision 11 (blue and green strict, worked examples
    purple) and the colour half of decision 22 (the wall uses the board's
    colours). These change what four builders draw and are checked by
    rendering, not by comparing rows, so they go as an engine release. **It waits
    on question 1 below.**
  - **Decisions 10 and 18** (grow the text or shrink the card; a picture on a
    printed sort card) he set apart himself as their own releases. Outlined at
    the end, not planned here.
- **Why not two.** 7A and 7B are the fold, each checkable row by row against its
  ledger. Putting the colour change inside 7B would give one release two kinds
  of check (rows and renders) and put builder code into a release that otherwise
  touches no program. It is the same judgement he made himself for decisions 10
  and 18.
- **Versions.** Assuming 4.2.289 (fit) and topic 6 (worksheets, 4.2.290) are
  committed first: 7A is 4.2.291, 7B 4.2.292, 7C 4.2.293. Renumber if the order
  changes. Each builds on the one before, committed.
- **One paragraph, one release.** A paragraph that two answers reach changes in
  one release, with both. The assignments below follow that, and the mapping
  names the release for every changed row.

## Before any release

- **Baseline** on the committed release before it: `run-all-suites.sh
  t7a-before` (then `t7b-before`, `t7c-before`) and `validate-saved-designs.py`
  over the saved designs.
- **The saved-design comparison needs a normaliser in 7A.** Removing
  `starter.content.testQuestionPath` and `lesson.scope`, `lesson.deferredLearning`
  and `lesson.lesson2Direction` makes every saved design fail the new validator
  on unknown fields. Write `t7a-change/strip_retired_keys.py`: compare each saved
  design stripped of those four keys (the real comparison), and separately
  confirm each unstripped design fails on those keys and nothing else. No
  program re-validates an old design at run time (callers of the validator: the
  lesson designer at design, the reviewer after review, the review packet,
  `photo-contract.py`, `resource-opportunities.py`, the scaffold; all run on the
  current lesson), so the refusal of an old file never reaches a run.
- **Pin files.** 7A writes `scripts/tests/starters_sticky_apply_ledger_pins.json`
  and its test; 7B writes `scripts/tests/preferences_rest_ledger_pins.json` and its
  test, with `streamline-tools/ledger_mapping.py` and
  `scripts/tests/ledger_pin_checks.py` as in the earlier topics. The PF pin file
  covers 1,779 rows, four times the largest so far; time the pin test and say
  so if it slows the suite.
- **No em or en dash in any new words.** An existing dash in a line that is only
  being corrected elsewhere is left alone; a sentence being rewritten loses it.

---

## Release 7A: how a lesson opens and closes

### A1. The test-question starter goes as if it never existed (SA settled item 1)

His words: "get rid of the 'will return' stuff, it needs to be like it didnt even
exist". Read back: every trace an agent reads, and the always-empty slot in the
lesson file with the checks and tests that name it.

- `references/output-template.md` › Starter: `"testQuestionPath": null` comes out
  of the example (L695), and the whole note at L719 («`testQuestionPath` is always
  `null`. The route that filled it ... and the route will return to it.») goes.
  (SA-F09, F10)
- `references/templates.md` › 2.8 Tall-image starter: «such as a scanned question»
  (L472) and «Right side is one full-height zone for the question image.» (L474,
  "the image") lose the scanned question. The template, its `question` slot name
  (code) and its answer example stay. (SA-F11, F13)
- **Code.** `scripts/validate-lesson-design.py`: the starter's exact keys become
  `activity`, `connection`, `format` (L1915 to L1918), so a design carrying
  `testQuestionPath` is refused as an unknown field; the answer rule for a starter
  with a path goes (L2593 to L2597). `scripts/lesson-design-scaffold.py` L308 stops
  writing the key. The code comment in `builder/src/templates/starter-question-tall.js`
  L8 loses "as a scanned question".
- **Tests.** `test_lesson_design_contract.py`: the base starter loses the key
  (L172); the test at L1620 to L1625 is replaced by one proving the key is now
  refused. `test_design_review_packet.py` L1974 and the fixture
  `fixtures/working-wall-packet/geography/lesson-design.json` L27 lose it.
- **Barred everywhere** (runtime files and programs, by the SA pin file):
  `testQuestionPath`, `will return to it`, `scanned question`.
- Left alone: the build log's history entries, `parked/test-question-bank/` and
  `CONSOLIDATION_REPORT.md` (neither is read by any agent), and Practising a Test
  Question, which is a live rule (A8).

### A2. The Lesson 2 plan goes (PF decision 20)

His words: "Is there a thing that says that if I've provided a lot of things that
it suggests what the second lesson should contain? If so, I think that should
come out because it already knows how much it can fit in one lesson." Settled:
the designer still fits one lesson properly and splits rather than crams; if it
left something out, it says so in one line in the walk-through. The Lesson 2
field, its checks, scaffold, review view and tests go; so does the starter-slide
orientation paragraph about the split; so does the Roman diary example.

**What `scope` and `deferredLearning` become (settled here, as he left it to the
change):** both go with `lesson2Direction`. `scope` exists only to say `Lesson 1
of 2`, which names a second lesson; `deferredLearning` is the one line, and its
home already exists: the walk-through's closing decisions list «the approved
objective, exact end performance, approved curriculum boundary for today and
related content deliberately deferred» (`lesson-designer.md` L417, unchanged;
three other topics' pin files hold it).

- `preferences.md` › How Much Fits in One Lesson:
  - L274: «"know how a Roman lived, then write a diary entry as one";» comes out of
    the list; the other two examples stay. (PF-I01; TD-Z08's pinned phrase in the
    same line is untouched.)
  - L278, from «When a split is chosen» to the end of the paragraph, becomes:
    when a split is chosen, today's lesson teaches what fits properly and says in
    one line of the walk-through's closing decisions what it left for another
    lesson; it does not plan that lesson. The first sentence (a judgement, not
    automatic) stays. (PF-I03, SA-L20)
  - L276 waits on **question 2** (below). Its bracketed pointer to "the
    cognitive-load and closure mechanisms" in the research file's sections 7 and
    8 is corrected either way, because neither section carries that mechanism
    (PF-I09): it goes.
- `lesson-designer.md` › Before You Design Anything L116: «Signal split in
  `lesson.scope`, `deferredLearning`, `lesson2Direction` + orientation.» becomes: if
  it left something out, say what in one line of the walk-through's closing
  decisions; never plan the next lesson. (SA-L21, PF-I06; TD-Z10 pins the first
  two sentences, which stay.)
- `output-template.md`: the three keys leave the example (L37 to L39) and their
  three rules go (L67 to L71). (SA-L22, PF-I12)
- `references/lesson-design-scaffold.md` L34: `"scope"` leaves the request example.
- `design-reviewer.md` › 1. Learning contract L156 and L158: «deferred learning is
  not taught early;» and «any lesson split is honest and visible;» read against
  the walk-through line: what the walk-through says was left for another lesson
  is not taught early; a lesson that left learning out says so there. Strength
  kept. (SA-M16, PF-I10, I11)
- `skills/make-lesson/playbook-lite.md` L1521: «State when a two-lesson scope covers
  Lesson 1 only and name deferred learning.» becomes: when the walk-through says
  the lesson left something for another lesson, say what in one line.
- **Code.** Validator: `scope`, `deferredLearning`, `lesson2Direction` leave the
  lesson's keys (L3650) and their checks go (L3697 to L3705). Scaffold: `scope`
  leaves the request's required keys (L20) and its checks and output (L780 to
  L789, L1270 to L1280). Review packet: the Scope, Deferred learning and Lesson 2
  direction lines go (L2070 to L2079). `working-wall-packet.py` L501 drops `scope`
  from the lesson bullets (it was tolerant of absence already).
- **Tests.** `test_lesson_design_contract.py` (base lesson L151 to L153; a new test
  that the three keys are refused), `test_lesson_design_scaffold.py` (L39),
  `test_rhythm_holds_in_every_route.py` (L75), `test_two_our_turns_message.py`
  (L21), `test_design_review_packet.py` (no `Lesson 2 direction` line), the
  geography fixture (L10 to L12).
- **Barred:** `lesson2Direction`, `deferredLearning`, `Lesson 1 of 2`, `know how a
  Roman lived`.
- The routing card's How Much Fits trigger («Read when the lesson may need an
  honest split») stays: splitting stays.

### A3. When a question about today may open instead of recall (SA decision 3: yes)

- `preferences.md` › Starters L297, the last clause of «History, Geography and
  Science usually retrieve prior content (a fact, a definition, a labelled
  diagram) or set up a question the lesson will answer.»: the question about
  today opens instead only in the two cases the pitch paragraph names (the
  retrieval would be empty, or the brief says the surface is already easy).
- L300, the history, geography and science bullet: «or a hook question the lesson
  will answer» takes the same two conditions and the limit from his suggestion:
  it stays a question children think and talk about, never a prediction or the
  task explained.
- Unchanged: B03 and B04 (the two cases), B05 and B19 (predictions and framing),
  maths' hook beside its recall starter (B10). Neither line is pinned today.
- Rows: SA-C01, C04.

### A4. Sticky knowledge in one home (the fold, and SA settled item 5)

The preferences section is the home; the designer's section keeps the recording,
the designer-only shapes and a pointer. Both are read by the lesson designer at
the same moment, and the preferences section is also what the reviewer, the
slide designer and the wall designer are sent to.

- `preferences.md` › Sticky Knowledge takes, word for word where it can:
  - G09's «so trace each one forward to the stage that needs it» at the end of
    the knowledge-subject sentence (L419);
  - G12: a sticky fact is not where an idea goes (the pewter plates as a plain
    example), `concepts` is, in every route;
  - H05: a fact that would reveal the thinking a later task requires is left off
    that task, unless the task genuinely needs it as a reference;
  - H08, phrasing consistency, with decision 7 (A6): the same words wherever the
    fact appears, the working wall included;
  - H02 corrected (L423): «(that's the PPT designer's decision)» and «Document»
    become the reference on each unit (`stickyKnowledgeRefs`), placement being the
    slide designer's.
  - G08's copy goes; the home keeps G03's wording, where the ending checks a fact
    only in place of the final task (the designer's copy read as four
    alternatives).
- `lesson-designer.md` › Sticky Knowledge (L231 to L239) keeps: the pointer; G10's
  two examples beside the test (the test itself lives in What a Lesson Is For);
  G11 (pinned QC-S05, word for word); H03's recording; H06 (pinned SC-F20) and H07
  (pinned SC-F19) word for word; H09 as corrected in A5.
- **Settled item 5.** «Teacher may provide - use it.» becomes: when the teacher's
  plan lists sticky facts, judge them like anything else it offers, and keep one
  the teacher marks as required. (SA-G13, beside G15.)
- Tests: `test_would_a_child_have_needed_this_lesson.py` holds «could a child in
  this class have said it before the lesson» in the designer's file, which stays.
- Rows: SA-G08, G09, G12, G13, H02, H03, H05, H08.

### A5. Where a sticky fact sits on the slide that teaches it (SA settled item 6, turned round, with routes settled 7h and 7k)

His words: "I dont think this needs to be a clear rule like 'sticky knowledge
statement always at top' ... That doesn't mean every slide I wanted was this
structure". Corrected read-back: the because or so explains the one key point.
The routes list's 7h and 7k were put to him in the light of this answer
("usually at the top, as you usually explain, not a fixed rule") and are carried
here, because they are the same sentences.

The validator already accepts both placements (the headline, or the star line
through `takeaway`, never both), so this is words only.

**Settled by the lead (24 September): this decision stays whole in 7A, route-file
lines included.** Every line below changes in 7A and in no other release. The
routes release (topic 8) leaves them in place and unreworded: its new heading
("How this teacher explains", its decisions 3 and 4) starts at content route L114,
after L99 to L105, and the skill route's L194 and L196 stay where 7A leaves them
(confirmed by the topic 8 planner). Rows are named in both ledgers so neither
release assumes.

| File and line (24 September) | Rows | What changes in 7A |
|---|---|---|
| `teaching-sequence-content-based.md` L31, sentence «Once means once: the landed sentence is the `headline`, and it is there rather than at the foot of the slide because it is the first thing a child reads» | SA settled 6; RT-E12, RT-E80 (7h) | "usually the `headline`"; the banner, strip and labelled outcome in the same line stay as they are |
| same line, sentence «The one beat that keeps its sentence for the end ... is written with a `takeaway` instead, under `The landed sentence leads the board` below.» | RT-E13 | the beat that lands its sentence last uses `takeaway`; the pointer's name follows L99's new lead |
| `teaching-sequence-content-based.md` L99, «**The landed sentence leads the board.** It goes in the `headline` ...» | SA-H10; RT-E40 (7h) | usually leads, usually the headline, because that is how this teacher usually explains, not a rule for every slide. The mechanism sentences (the unit whose headline is the fact leaves it out of its own `stickyKnowledgeRefs`; the validator refuses the pair; later beats reference it) stay word for word |
| `teaching-sequence-content-based.md` L101, «This file used to offer a second shape ...» | SA-H13; RT-E41, RT-E42 | the story goes to the log first (A13); its reason stays as a clause: the top line is never a caption of the picture, because a child can already see what the picture shows and cannot see why |
| `teaching-sequence-content-based.md` L105, «Keep a `takeaway` referencing a sticky fact for the beat that deliberately withholds ...» | SA-H14; RT-E44 | a `takeaway` referencing the fact lands it last, as the star line: the shape for a beat that withholds its fact until children reach it, and a choice where the fact reads better last; the headline is then the move the class is making, never a caption |
| `teaching-sequence-skill-based.md` L194, «so it lands a `takeaway`» | PF-Q18; RT-C27 (7k) | "so it lands its sentence, usually as the `headline`"; the rest of the paragraph (TD-J18, AK-F21, VOC-E48 pins) stays word for word |
| `teaching-sequence-skill-based.md` L196, «which is why it has a takeaway» | SA-G20; PF-Q19; RT-C29 | "which is why it lands a sentence"; TD-J19's pinned phrases stay |
| `output-template.md` L364, «A Teach slide lands its sentence once, at the top.» and «A `takeaway` referencing a sticky fact is for the beat that withholds its fact ...» | SA-H11, H12 | "once, usually at the top"; the takeaway sentence says what L105 says |
| `lesson-designer.md` L239, «Write once (typically sticky fact).» | SA-H09 | once, as the headline or as the star line, never both, pointing to the content route |
| `lesson-designer.md` L231, «Not teaching tool - reference/retention anchor.» | SA-G13 | "Not teaching tool" goes (a sticky fact may be the sentence a Teach lands); the rest is A4's |
| `slide-success-criteria.md` L105, «render the sentence once, with its sticky-knowledge visual treatment ...» | SA-H27 | once, never twice: as the headline when the unit's headline carries it, as the star line when the unit references it |

**Checked and unchanged**, so no release touches them for this decision:
`teaching-sequence-content-based.md` L89 (the `headline` and `explanation` field
descriptions, RT-E39) and L103 (a sentence carrying its own reason, RT-E43, SA-H15);
`teaching-sequence-discovery.md` L37 (Teach why keeps its sentence to the end,
RT-H07, SA-H16); `preferences.md` L577 («as the headline or as the sticky fact this
slide lands, never both», SA-H18, already loose); the validator's message
(`validate_teach_says_it_once`, RT-Q14, SA-N09, the same mechanism); Pride Lessons
L810, which stays exactly and already reads as a default («a beat whose takeaway
can lead does lead with it»).

### A6. Sticky facts on the wall, and the wall keeps sentences whole (SA decision 7: yes; PF decision 22, wording half: yes)

SA 7: the lesson's own words on the wall, shortened only when they genuinely
cannot fit, and then still a whole sentence a teacher would say. PF 22: the wall
keeps children's sentences whole (a bigger or second card rather than a clipped
one). They agree: room first, a whole sentence always.

**The mechanism, checked.** A wall card is a fixed A3 sheet, the wall's cap is two
sheets, and the engine caps a body item at two lines (`working-wall-html/src/layout.js`
`maxLinesPerItem`, `render-section.js` L273), which is where the 62 and 106
character budgets come from (a wall test pins both). "A bigger card" therefore
means the card with no picture (about 106 characters an item); "a second card" is
the items carried in order over a second card of the same type (it exists; a wall
takes two teaching cards). Lifting the two-line cap would be a new engine change
he did not ask for, so it is not planned.

- `working-wall-designer.md` › Rules That Never Change, rule 8 (L134, L136): the
  sticky-knowledge statement leaves the list of prose that «may be tightened» and
  joins the definition sentence (the lesson's own words, shortened only when it
  genuinely cannot fit, then a whole sentence). «Condensing is the *first* move
  when an item overruns, not the last.» is turned round: making room is the first
  move (the picture off, then a second card); a modelled sentence or a stem's
  framing may then be shortened only to a whole sentence with the same meaning,
  characters, setting and protections, never a clipped phrase, and the original
  goes in `rationaleNote`. VOC-O07 pins the definition sentence: it stays word for
  word; SC-O03 moves.
- `working-wall-preferences.md` › Wording style: principle 5 (L98) says the same,
  keeping «What has to stay word for word is what a child compares board against
  wall» (SC-O05) and the vocabulary sentence (VOC-O16) exactly; «Condense first,
  before dropping anything» becomes make room first; principle 4 (L81, «Two-line
  maximum on every item») is said as what fits a card, not a quota on writing;
  principle 2's example (L74) keeps the taught term beside its plain words (the
  independent clause, the part that makes sense on its own) instead of replacing
  it; the sticky row of the budget table (L91) says 106, not «about 100». (SA-I05,
  I06, I29; PF-B77, B78, C80)
- `working-wall-designer.md` L333 (sticky statement over budget) and L36 («short by
  necessity», which gains: short, never clipped), and L44 («your cards are copied
  verbatim», true on most runs, and the trigger names a shortened sentence).
  (SA-I07; PF-C75, A54)
- **Code.** `working-wall-html/src/layout.js` L149 and L160 to L163: the refusal still
  names the budget (the problem sentence keeps "62 is the most that fits"), and its
  remedy leads with making room; «an item over its own budget fits only reworded»
  becomes the whole-sentence last resort. `working-wall-html/test/doc-claims.test.js`
  L202 (asserts «Cut it to 62 characters or fewer») moves with it; the SC pins on
  these messages move.
- Left for topic 9 (the wall's own list): the two-second against five-second
  glance tests (PF-O69, Y37, Y40), and the wall's example sticky card that reads as
  a method step (SA neighbour note N3). The wall's colours are 7C.

### A7. The Apply: one home, and leaving it out of a lesson that named an idea (SA decision 9: yes; J07, J11; settled item 11)

- `preferences.md` › The Apply Slide:
  - L469 (J05): a lesson that doesn't earn one says so and says why; one whose
    learning is a fact or a method may say its Your Turn and answers were enough;
    one that named an idea says where the idea met a case it was not taught on
    (usually its Practise, on evidence children had not seen), or earns an Apply
    that takes it there.
  - L471 takes J11 from the designer: keep useful rehearsal within practice and
    leave the ending out when practice already draws on the intended learning;
    intended learning is what the read-back sentence closing the walk-through and
    the sticky knowledge name (the stale «quality-lock sentence» goes); the three
    repairs in order, the third being to drop a claim only when it was never
    today's.
  - L473 (J07): «which is the only place that decides it» goes; the designer's
    section holds what an Apply has to be, its shapes and its recording.
  - Contents L25: «the full decision lives with the lesson-designer» says the same.
- `lesson-designer.md` › Apply Slide:
  - L329 loses the J11 sentences to the home and points; J09 and J10 stay (QC-S27
    pinned). `test_learning_is_named_before_the_task.py` holds «omit the ending
    when practice already draws on the» in the designer's file: it follows the
    sentence to `preferences.md`.
  - L341 (J19): «"Your Turn and answers is sufficient AFL here - no distinct
    synthesis task is needed" is complete justification.» keeps its words for a
    lesson whose learning is a fact or a method, and says what a lesson that named
    an idea writes instead.
  - L327 (K02): `ending.kind` = "Reflect", capital R; «don't fill retired "APPLY
    SLIDE" prose» goes (settled item 12). TD-J63's pinned sentence stays.
  - L334 (settled item 11): reasoning and problem solving are `practise` beats
    placed as `subject-maths.md` says; the last is the Apply only when it closes
    the lesson and asks more than the Your Turns did; then the existing shapes.
  - L325 (J08, the narrow first definition) and L337 (J17, J48, the two shapes and
    their two minutes) stay; J17's "that is where the Apply comes from" reads
    under L341's new sentence and the home's "earned".
- **Code.** `scripts/design-review-packet.py` routing card, The Apply Slide
  (L165): «Read when Apply may be unearned or repeat Your Turn.» gains: and when a
  lesson that named an idea has no Apply and its reason does not say where the
  idea met a case it was not taught on. **Test:** a packet test asserts the new
  clause. The reviewer behaviour case `cumulative-scale-learning` («Do not require
  an extra Apply slide») stays and must still pass.
- Rows: SA-J05, J07, J08, J11, J15, J19, K02, M13 (and J01).

### A8. Practising a test question (SA settled item 2: "keep with small fix")

- Contents L26: «the real item stays out of the lesson» carries both exceptions:
  while it is held for a later test, and unless he asks for that exact item.
- `design-reviewer.md` L216: «with fresh content» carries the same two (the exact
  held item when he asks for it by name; a real question not being held). QC-S46
  pins this line and moves.
- The section itself (L479 to L487) is unchanged.

### A9. The starter's title (SA settled item 4)

- `templates.md` › 1.4 L139: «Give the slide a `title` (or a `heading`) as normal
  ... so `title: "What do you remember about PSHE?"` renders as» becomes: only a
  `heading` the starter deliberately carries prints under `Starter`; a `title` never
  does, because the teacher wants the underlined heading alone ("Just the starter
  heading that's underlined is enough", his words kept, undated). The history
  sentence («Before this, a title in that slot replaced ...») goes.
- `templates.md` › 2.8 L478: the `title` slot line says `heading`.
- The designer's label naming what is remembered (E09) and `Starter - check`
  (D24) stay. `builder/test/starter-heading.test.js` already holds the behaviour.

### A10. Mixed retrieval in the activity list (SA-D13, D28, folded under A07)

- `references/do-beats.md` 1.5 («**Best for:** the starter of lesson 2+ in a
  sequence.», L102) and 1.6 («**Best for:** mid-unit lessons where prior topics
  matter.», L107) carry A07's conditions: when the teacher asks for it, or the
  sequence gives it a purpose and children are secure enough to choose between
  methods, and a pointer to `preferences.md` → Starters. TD-D12 moves.

### A11. Slide titles (PF settled item 1, decision 21, SA neighbour note N2)

- Maths `Apply`: the lines that call `Apply` a slot name gain the maths exception:
  `preferences.md` L667 (PF-V04), `lesson-designer.md` L68 (PF-V11, SA-J42),
  `design-reviewer.md` L222 (PF-V10, SA-J47; the reviewer list's settled item 8
  says this is fixed once, here), `slide-designer.md` L49 (SA-J43;
  `test_the_lesson_is_written_as_a_lesson.py` holds this line and moves). The
  contract's ending example label `Apply` (L738) stays: it is a maths example.
- **Practise flagged (decision 21).** `builder/scripts/check-slide-design.js`: the
  `INTERNAL_STAGE_TITLE` pattern (L86) takes a bare `Practise`; the comment that
  names it a valid child-facing label (L81 to L85) and the message gain the maths
  note. **Test** in `builder/test/slide-design-check.test.js`: `Practise` flagged
  in every subject, `Apply` flagged outside maths only.
- **The grid's default title.** `builder/src/templates/grid-calc.js` L23 prints
  `Independent Tasks` for an untitled grid. The default goes and the builder's
  validation refuses an untitled `grid-calc`, naming the fix (the design's label,
  `Your Turn` in maths). `templates.md` L424 says so. **Test:** a builder test. No
  test fixture relies on the default.
- **Numbering scope (N2) and label colour.** Contents L20, and the two helpers in
  `templates.md` (L63, L1097, L1175, L1193) and `questionNumbering` (L2342): the
  main independent work is numbered in maths only; the labels are purple, as the
  code draws them (PF-A10, Y71, Y73, R98, R99; SA-D18 to D20, J45). The sentences
  `builder/test/doc-claims.test.js` holds (L278 to L293) stay.
- The dated lines in Slide Headings (L663, L665) are 7B's (B17).

### A12. Out of date (SA settled item 12), and the contents block

- Done above: F10 (A1), E08 and E25 (A9), F11 and F13 (A1), K02 and J11 (A7), H02
  (A4), I06 (A6).
- `templates.md` L155 (SA-E13): the `lesson-cover` parenthesis loses «for
  historical reasons» and keeps its must-not (never used in a lesson; build tests
  only).
- **The contents block moves once.** SC-A02, TD-A12 and VOC-A03 each pin the whole
  contents block (3,779 characters) as well as single lines, so every contents
  edit is in 7A: L20 (A11), L25 (A7), L26 (A8), and the reading paragraph L11,
  whose «reads only the named section when its trigger applies» gains the
  always-read sections (PF-A29, with the routing card note PF-X46 corrected in the
  same pass, a test asserting that note moving with it).

### A13. Stories in 7A

- **Copy first:** SA-H13, the Year 4 history Teach slide rebuilt by hand on 17
  September 2026 (`A photograph of Victorian children who worked.` at the top, the
  lasting sentence demoted to the star line), with the 4.2.223 rule it caused. Not
  in the log today (checked by its words).
- Kept as they are (undated, the rule's example, already in the log): SA-G05 (the
  Christmas fact), J04 (the significance lesson), E09, G10, G12.
- His rulings keep his words: E24 (the starter title), J30, J40.

### A14. 7A's pins and tests, in one place

- **New:** `starters_sticky_apply_ledger_pins.json` (390 rows; homes: preferences
  Starters, Sticky Knowledge, The Apply Slide, Practising a Test Question,
  Purposeful Endings, and the designer's Starter, Sticky Knowledge and Apply Slide
  sections, in paragraph order) and `test_starters_sticky_apply_ledger_is_kept.py`.
- **Moved in other topics' pin files:** the contents block and lines (SC-A02,
  TD-A12, VOC-A03); TD-Z10 (L116), TD-D12 (do-beats), TD-J18 and TD-J19 (skill
  route), QC-S46 (reviewer L216), SC-O03, SC-O05, SC-O19, SC-O20 and the SC pins on
  the wall messages (wall), VOC-O07 and VOC-O16 checked unchanged.
- **Test files touched:** `test_lesson_design_contract.py`,
  `test_lesson_design_scaffold.py`, `test_rhythm_holds_in_every_route.py`,
  `test_two_our_turns_message.py`, `test_design_review_packet.py`,
  `test_learning_is_named_before_the_task.py`, `test_the_lesson_is_written_as_a_lesson.py`,
  the geography fixture, `builder/test/slide-design-check.test.js`, a grid-calc
  builder test, `working-wall-html/test/doc-claims.test.js`.

---

## Release 7B: the rest of preferences (words only)

### B1. The speaker notes (PF decision 3; settled item 3; the voice list's decision 13)

**Moved to the voice guide release (topic 8, release 5), 26 September.** The lead brought the lesson designer's notes voice line (L88), the hand-off's gain of his words, and the voice list's decision 13 (preferences L218 and L222, the adaptation designer's Greater Depth line with PF-N82's named child) into that release after its first check, so the designer and the guide no longer pull against each other; 7B no longer carries them. B1's other part, the hand-off naming the notes' lines in the order they print (settled item 3), stays 7B's.

His words: "speaker notes are as long as the idea needs, of course, and they're
also conversational ... It's talking to children. It just needs to think how can
I talk to children to get them to understand it."

- `lesson-designer.md` › Speaker Notes Voice L88: «clear simple language a
  nine-year-old follows easily, short straightforward sentences» becomes his
  words: as long as the idea needs, conversational, in words the children in this
  class follow, and the question he asks (how would I say this so these children
  understand it). AK-G19 pins the line and moves.
- `preferences.md` › Speaker notes hand-off L655 gains his words beside «chosen for
  the idea rather than a mechanical simplicity rule», and (settled item 3) names
  the lines in the order they print: `On the board:` first on a model finished
  live, then the script, teacher info, the answer, `Look for:`; slide 1 opens with
  the orientation. «a fixed shape: a **script** first» is corrected to that. VOC-J10
  («Necessary taught subject vocabulary stays.») stays exactly. The designer's
  own line (`lesson-designer.md` L84, «Every note: **script** first ...») says the
  same order; the slide designer's list (L418 to L426) already prints it. (PF-U01,
  U05, U14, U40)
- **"A nine-year-old" everywhere else he answered** (voice list decision 13, which
  defers to this answer: "each says a child in this class"): `preferences.md` L218
  (the groups of a sort) and L222 (answering your own question), and
  `adaptation-designer.md` L282. L218 and L222 are paragraphs 18 and 20 of the
  rhythm home pinned by both the Teach then Do and the quick-check pin files, and
  held by `test_do_beats_look_like_the_subject.py` L125 and
  `test_the_class_builds_the_set_and_one_case_is_not_the_group.py` L65; AK-B19 and
  AK-B20 too. All move. The same adaptation line carries PF-N82 (`Is she right about
  all of it?` becomes the named child), fixed in the same edit.
- Other "nine-year-old" lines (How Much Fits L282, the vocabulary line L349, history,
  the voice guide, the reviewer's «eight- or nine-year-old», RV-G09) are not among
  the four his answer covers. The lead ruled RV-G09 covered by his reason, and the
  reviewer release (topic 8) carries it; nothing for 7B.
- His pointer to the week 3 science lesson's notes on his drive is for the voice
  release (topic 8), not this one.

### B2. Answer slides (PF decision 5; settled item 4)

- `preferences.md` › Support, Checking and Release L517: the answer slide is for
  work with definite answers (a Your Turn with definite answers keeps its answer
  slide, after each cycle in a skill lesson); open writing, where many answers are
  right, gets no answer slide that looks like the one answer, and a model is shown
  only as one possible answer, labelled as one; a My Turn or Our Turn the teacher
  finishes live is followed by one slide showing it finished (settled item 4, the
  17 September cover-teacher repair). «Every structured answer ... remains
  available in the speaker notes» stays.
- The copies point: `lesson-designer.md` L385 keeps «Exact-answer Do beats, Our
  Turn, smaller checks use teacher-only.» (QC-S23; `builder/test/doc-claims.test.js`
  holds it) and points for the rest; `teaching-sequence-skill-based.md` L55
  (PF-M60, stale: «do not create a following answer slide») is corrected.
- **The label has no field.** Nothing in the design says "one possible answer";
  the slide designer titles the model slide, within its furniture exception. So
  `slide-designer.md` › answer slides (L375) gains: a model answer to open writing
  is titled as one possible answer. No check enforces it.
- `slide-visual-sizing.md` L160 (PF-M74, each split question slide gets its own
  answer slide) is corrected to his 19 September merge (one reveal where they fit);
  `templates.md` L3047 (PF-Z86) no longer states the arrow preference as a method.

### B3. Where children write is his to choose (PF decision 7)

- `references/do-beats.md` L37: «Which book, which page, one between two, sitting
  where: all of that is handling, and it belongs in the teacher's script and the
  lesson's `teacherOrientation`» becomes: where children write (which book, which
  page, a whiteboard) is the teacher's to choose and nothing names it; the
  handling a task genuinely needs (one set of cards between two, at tables) goes
  in the script.
- `preferences.md` › Classroom Norms L130 gains the handling sentence after its
  existing rule. TD-C24's pinned text is kept whole.
- `stick-in-sheets-pedagogy.md` L53: «A quick marking move is whiteboard work» says
  it needs no printed piece, without naming a whiteboard.

### B4. Drawings (PF decision 9, turned round; settled item 9)

His words: "there sh could be drawings on serious material, as long as obviously
the drawing isn't something that looks like I'm mocking"; "drawing size - yes".

- `preferences.md` › Visual priority (L397 to L413): P3 is decoration and need not
  be about the lesson; as many as the spare room holds, with his 19 September
  words ("p3 is decoration which I want too. not just 1 per slide, many!",
  undated); sized to the space it sits in and may be large ("small" goes); «On
  serious material omit P3 before it makes the treatment cute, jokey or trivial»
  becomes: a serious lesson may have drawings, as long as none looks as though it
  mocks the subject. The room-doing-a-job limit stays word for word.
- **Where the settled item and the size answer meet:** settled item 9 said "one
  emoji per line" becomes "a small drawing, or an emoji where the library has
  none"; his later size answer takes "small" out of his preferences. So L597 and
  L601 read "a drawing, or an emoji where the library has none". L601's «The rule
  below» becomes "above" (PF-R08).
- `subject-history.md` › Optional decoration on sensitive history (L158 to L163):
  the omission list goes; the P1 and P2 sentences stay; the limit becomes his. The
  subject-files list's settled item a is this answer, so it is carried here, not in
  topic 8.
- `context-pictures.md`: "relevant" comes off wherever it governs P3 (L8, and the
  rows PF-K37, R54, Z01 to Z06), not where it governs P2; the paragraph telling the
  reversal's history (L37 to L41) goes to the log (it is there, 4.2.264) and his
  words stay.
- `slide-decorator.md` L13 («a relevant drawing»), L17 («room, relevance and
  legibility») and L86 («How many of those clear places hold a relevant drawing? ...
  stop when the relevant subjects run out»): a drawing, room and legibility, and
  stop when the clear places run out. **A behaviour change** (more drawings per
  slide); watch it in the after lessons.
- The page mechanics of wall decoration (PF-K59, K61) are topic 9's.

### B5. The takeaway and the launch (PF decision 13; settled item 13c)

- (a) `preferences.md` L575: a slide whose title is a question shows its answer,
  except a talk slide, whose open question the children answer (`Should zoos
  exist?`) and which may show a modelled example labelled as one, in the dialogic
  route's words (the takeaway lives in the children's response).
- (b) **Carried by the routes release, not 7B, so the words land with the code.**
  Today `validate_explanation_task_is_modelled` refuses a launch whose
  `goodLooksLike` is null (the criteria already show a good one) unless an earlier
  beat showed a model, so a home sentence letting the criteria stand in would be
  looser than the check for a content lesson and designs following it would be
  refused. The routes release proposes the check accept that case when the beat
  carries `successCriteriaRefs`, the reviewer judging the claim; it adds 13b's
  clause to L641 («... need none of this.»: criteria on the board that already show
  what a good one looks like count as one seen, so no second model) in the same
  release. **L641 is therefore edited in two releases, by named change:** 7B takes
  the date out of T03 (B17) and writes nothing about 13b; the routes release adds
  13b's clause. Both plans name it.
- (13c) L152 (What a Lesson Is For, paragraph 4 of the assumed-knowledge home): a
  Teach has a thought in it too, and `thinking` is empty only where the teacher
  alone acts, as the program and two routes require. The AK home pin
  (HOME-AK-WLF-05) is rebuilt; QC-E09's pinned sentence stays.

### B6. "You can pass" comes out (PF decision 15, turned round)

- `preferences.md` L391: «"You can pass without giving a reason" is not an object.
  A wall card carrying it was illustrated with the media player's skip button,
  which tells a child who cannot read the sentence that something is being
  fast-forwarded.» goes; the rule around it stays (a picture of what the statement
  is about passes; a symbol or an interface control standing in for an idea fails;
  when nothing true exists the statement goes on its own). VOC-D19 pins the bold
  lead, which stays.
- `context-pictures.md` L554 to L556: the raised hand beside "you can pass" goes; the
  skip-button point stays without those words.
- `lesson-designer.md` L94: `you can choose to pass` leaves the example pair. TD-H07
  moves.
- `teaching-sequence-content-based.md` L122: the PSHE `pass` sentence and the "For
  the right to pass" board go (RT-E59, E63). `test_teaching_reaches_the_board.py`
  asserts «left what pass means in the script» (L235) and moves. Test designs that
  use the words as sample content are test data, not instructions, and stay.
- `teaching-sequence-task-centred.md` L17 (RT-F06: «`You can pass without giving a
  reason` above Chloe's bubble ...») loses the example; L19's example of two
  inputs («the right to pass and what happens to a worry») keeps only an example
  that is not passing. L19 is a Teach then Do pinned paragraph; its pin moves.
  Agreed with the topic 8 planner: these route lines are carried here, not in the
  routes release.

### B7. A word bank sits with its question (PF decision 16)

- `preferences.md` L618 («Success criteria, a steps list, a word bank or a
  reminder ... come after the work in the scan»): a word bank the answer is chosen
  from sits with its question, after the task: the task, then a line such as
  `Use the word bank to help you`, then the words, then the space to answer; a
  reminder a child only glances at still goes aside. SC-K20 pins this paragraph
  and moves.
- `templates.md` L903 (PF-Y69, a place-value chart reference at the top) is a
  reference the question reads from, which the worksheets list's settled item 14
  puts before its question; it stays.
- The sheet designer's lines (PF-R80, R83) are the worksheets release's; 7B checks
  after it that they carry this order and adds only the order if not.

### B8. A stick-in piece carries the board's label (PF decision 17)

- `preferences.md` L333 and L335: stick-in pieces leave «keep bracketed numbers ...
  does not continue from the starter or slide lesson» and «each worksheet,
  adaptation sheet and stick-in piece starts again at A»: a piece carries the
  label the board gave that moment (its `tag`, which exists). Worksheets and
  adaptation sheets keep their own numbering; the worksheets release may have
  edited these two lines (its H01, H02): 7B edits only the stick-in half.
- `stick-in-sheets-pedagogy.md` L89 (PF-J26): the model caption `a)` becomes `(a)`.

### B9. The words never shrink below the readable size (PF decision 19)

His words: "I stood in the class and tested what the smallest font size should
be so that everyone can see it, and it was 20. The reason I had 19 and 18 was for
those things because I didn't want a whole slide to just fail".

- `preferences.md` L543: «the words never shrink, and they are never clipped to
  fit» becomes: never shrunk below the readable size and never clipped; the build
  fits text down to 18 point (20 is what every child in his class test could read;
  18 and 19 are allowed so one box does not fail a slide), and a line that would
  need less takes another slide. The same paragraph loses the dated Tudor story
  (B17). AK-B13 and SC-H23 pin other sentences, which stay.
- Copies corrected to that: `teaching-sequence-content-based.md` L122 (with B6),
  `slide-builder.md` L40, L42, L65, L68 (PF-Y56, Y27, Y28, S64),
  `helper-authoring.md` L151 and L169 (Y44, Y45), `templates.md` L662 (Y51),
  `commands/edit-templates.md` L150 (Y54), `helper-builder.md` L69 (Y55).
- Unchanged: Pride Lessons L816 («The words never shrink to fit»), which stays
  exactly; the wall's 36 point floor.

### B10. Launching a task (PF settled item 2)

- `lesson-designer.md` L243 and L406 and `design-reviewer.md` L205 point to the
  home (the case and its question first; a recap only when there is no case).
  Their trigger («when the product's form is new to the lesson or the enabling
  input ran to several units») takes the routes list's decision 2, agreed with the
  topic 8 planner: the good-and-weak example is skipped only when the class has
  already seen a good one earlier in this lesson, in every route. That matches the
  validator for a knowledge lesson; for task and skill lessons the pointers are
  stricter than the check until the routes release extends it (said in the log).
  13b's criteria case is not written here (B5): the routes release adds it to these
  three pointers as well as to L641, with its validator change, so a pointer never
  lacks an exception its home carries. These three lines are therefore also edited
  in two releases by named change, as L641 is; both plans name it. (PF-T12, T13, T14; RV-J36.) The route
  files' launch lines (PF-T18 and RT-E30, F19, F34, E70) and the validator's check
  are the routes release's.
- `templates.md` L347 (PF-T54): the catalogue's worked strong-and-weak pair uses the
  very difference line the home says fails; its line becomes the one the home
  gives as right. `explanation-tasks.md` L13 and L89 (T35, T39) corrected.

### B11 to B14. Minutes, the four pieces, the research file, precedence

- **Minutes (settled item 6).** `preferences.md` L126 gains his "30 to 50, 45 the
  aim"; «the beats may take 40» goes from `lesson-designer.md` L247 and
  `output-template.md` L97; L36 says what `durationMinutes` is for. TD-M08 and
  TD-Z14's phrases stay.
- **Four pieces (settled item 8).** `lesson-designer.md` L515 and L548: «Hold its
  two tests» names where the two tests live (the completion pass and the
  reviewer), keeps «no cap on beats, slides, sources or words», and points to the
  four pieces for a Teach slide, noting the Teach layouts refuse more than five.
  TD-A13 pins the start-up list and moves. The reviewer's line (L42) gets only the
  pointer: the reviewer list's settled item 1 says no line is added to his
  calibration, and none is.
- **The research file (settled item 12).** A short clause naming his rule beside
  each: `evidence-synthesis.md` L170 (Y21), L164 (K42), L56 (T34), L72 (M36), L191
  (I14), L68 (S14), and `explanation-tasks.md` L58 (M30). The stale bracket at L55
  (M27) and `this pupil` at L131 (D63) are corrected.
- **Precedence (settled item 23).** `worksheet-designer.md` L200 and
  `working-wall-designer.md` L44 point to the designer's full order. (PF-A48, A53)

### B15. A real fact has to stand up: into Source and Scenario Integrity

- `lesson-designer.md` › Starter L196 (SA-B12, PF-N33) governs every fact, not the
  starter: it moves, in its own words, to `preferences.md` › Source and Scenario
  Integrity beside «For invented scenarios and real-world claims», keeping its
  limits (a precise recent date; the care is for a load-bearing figure, "not every
  number"). `subject-maths.md` L174 (SA-B13) stops calling the designer's Starter
  section its general rule and points there.
- The section is the assumed-knowledge home, pinned paragraph for paragraph: that
  home is rebuilt in the same edit.

### B16. Out of date (PF settled item 14): who carries each

7B corrects every out-of-date row in a file a 7B decision already opens, or in
`preferences.md`, the lesson designer, the research file, the contract and the
scaffold guide: A25, F07 and F72 (unless the worksheets release has), F10, F15,
F21, F76, I09 (with A2), K24, K33, K37, K78, L02, M27, M60, M74, N27, N82, O68,
O87, O96, T13, T14, T35, T39, T42, T54, Y28, Y54, Y56, Y67, E30, D26, D63, S64, Z86.

Elsewhere, named so none is lost: A10, A29, X46, Q18, Q19, V31, Y71, Y73, R98, R99
in 7A; R04, R32, R28, R72, R95, R97 and J13 in 7C (colour words and the profile's
colour section); D41 and F75 to the voice release (the voice guide); M84 goes with
its file (topic 8 removes it); F87 to the worksheets release (WS-O35); P10, S50,
S56, S57, Z36, D97 and D98 to topic 9 (the picture scout and the wall's own list).

### B17. Stories and dates in 7B

- **Copy first:** PF-Q02 (a teeth slide saying one fact three times, L577; not in
  the log by its words) and the Sigurd model sentence (PF-T05, L641; the log has
  "the Viking defect" but not the words). Both stay as plain undated examples.
- **Dates off, his words kept:** L49 (B08; the 21 and 32 point band stays as the
  example of the choice), L57 (C04), L327 (J03), L531 (N03, N04; the AK home pin
  holds both dates and is rebuilt), L641 (T03, inside SC-R01, which moves), L645
  (T07), L649 (T10), L663 (V02), L665 (V03).
- **Story out, reason kept:** L543's Tudor deck sentence (PF-O02), since Pride
  Lessons carries his words; the context-pictures history paragraph (B4).
- **Stays exactly:** Pride Lessons, dates included (his calibration; the voice
  list's settled items 8 and 14).
- The fourteen stories the independent check found outside the log (PF-V22, H29,
  K76, K95, R78, H32, C65, N84, S49, X91, J31, H68, J34, S61) sit in designer files
  7B does not open; they wait for topic 9.

### B18. 7B's pins and tests

- **New:** `preferences_rest_ledger_pins.json` (1,779 rows; homes: every
  preferences section this list owns, in paragraph order) and its test.
- **Moved:** the assumed-knowledge homes What a Lesson Is For and Source and
  Scenario Integrity; the Teach then Do and quick-check rhythm homes (paragraphs 18
  and 20); AK-B19, AK-B20, AK-G19, QC-G06, QC-G07, TD-Z02, TD-G09, TD-H07, TD-A13,
  SC-K20, SC-R01.
- **Test files touched:** `test_teaching_reaches_the_board.py`,
  `test_do_beats_look_like_the_subject.py`,
  `test_the_class_builds_the_set_and_one_case_is_not_the_group.py`, and the pin
  tests above. No program changes, so no new behaviour test; every changed row is
  checked by its pin.

---

## Release 7C: colours (engine; waits on question 1)

His words: "I want blue means question or like a short task as in like explain why
or something like that. And yeah, green is vocabulary or an answer. So we'd have
to fix those. Worked examples can be something different. Maybe purple." Then:
"worked example purple too". And decision 22: the wall "uses the board's colour
meanings". Read back: a task line in blue is right.

- **Blue for a short task.** Today the slide check refuses a blue instruction
  (`BLUE_WITHOUT_A_QUESTION`, `builder/scripts/check-slide-design.js` L660 to L740,
  whose comment quotes his 3 September "can we make only questions to children
  blue"), the turn message tells designers the task stays black (L270 to L276),
  the header draws the instruction in body black (`builder/src/headers.js` L80),
  and the profile says «a task is black either way» (`teacher-slide-visual-profile.md`
  L104) with the 3 September and 19 September cases. **Question 1** settles how far
  blue reaches; the imperative test the check needs already exists (`TASK_OPENERS`,
  `isTaskWording`). Then: the check, its message, the header colour, the profile's
  Semantic colour section, `preferences.md` L589 to L593 (R02 to R04, which the
  ledger proposes folding into the profile, the section that owns them; his words
  stay in preferences), `slide-speech-and-characters.md` L43 (R72), and the tests
  (`slide-design-check.test.js`, `check-reports-every-fault.test.js`).
- **Green, with the catalogue's exceptions fixed.** `templates.md`: a table's
  deciding word in bold, not blue (L804, Y68); a chain the lesson shows is wrong is
  not marked as an answer (L925, Y70; guidance only); a word bank's taught words
  green (L1547, Y74; spec marks or code, checked at the change); the callout's
  green default and its blue variant (L1777, L1786, Y76, Y77; code in
  `builder/src/content/callout.js`); the tally summary (L55, R97). Label colours in
  the profile (L167, J13), the maths helper guide's ring (R95), and "task-action
  verbs may use house blue" (R04, R32).
- **Worked examples purple.** `builder/src/content/method-frame.js` (the green
  method panel and title) and its board twin `worksheet-html/src/helpers/methods.js`,
  so the child meets one picture on board and paper; `templates.md` L2641.
  **Unchanged:** the success-criteria panel's green box (settled in 4.2.288; not
  among the exceptions he was shown).
- **The wall uses the board's colours (decision 22).** The palette is one file,
  `working-wall-html/style.json`, drawn by `render-panels.js` and `render-grids.js`.
  Proposed mapping, by what each card's words are: sticky fact purple and worked
  example purple (the board's colours for both, now shared); taught words green
  (the vocabulary cards, not teal); a misconception's right answer green and wrong
  one red (unchanged); titles and headers blue (the board's own titles are blue);
  sentence stems and reference tables neutral, with any taught word inside green.
  `working-wall-visual-language.md` (R89, R91, I14 to I16) and the card contracts
  say so. This mapping is derived from his answer, not given by him: the rendered
  walls go to him before the release is committed.
- **Proof:** every builder, sheet, wall and slide-check test that names a colour;
  the saved decks and walls rebuilt before and after; contact sheets of five decks
  and three walls for him.

## The two engine repairs he set apart (outline only)

- **Decision 10, fill the box you're in.** The build grows short text and tightens
  the card: `preferences.md` L597 (R06's text-size sentence; its emoji clause is
  7B's) and the profile's card boundary (R45) change with the builder, in his words.
- **Decision 18, a picture on a printed sort card.** The stick-in `card-set` learns
  to print a picture on a card, where it helps; until then a Below sort that needs
  pictures is done from the board.

## The homes, afterwards

| Rule | Its one home | Copies that stay as pointers, with their conditions |
|---|---|---|
| The starter | `preferences.md` › Starters | Designer's Starter (recording, maths hook pointer); research §1 (evidence, unchanged) |
| Sticky knowledge | `preferences.md` › Sticky Knowledge | Designer's Sticky Knowledge (recording, one fact per practice unit, steps enact the fact, the Teach sentence once, the two examples) |
| Where a sticky fact sits | `teaching-sequence-content-based.md` (usually the headline; the star line when it lands last) | Contract L364; slide SC L105; skill route L194 |
| The Apply and the ending's reason | `preferences.md` › The Apply Slide | Designer's Apply Slide (shapes, forms, route lines, recording) |
| A test question | `preferences.md` › Practising a Test Question | Contents line and reviewer line, both carrying both exceptions |
| A split | `preferences.md` › How Much Fits | Designer L116, walk-through closing decision, reviewer L156 and L158, playbook L1521 |
| The wall's words | `working-wall-designer.md` rule 8 (its own surface) | Wall preferences principle 5; the sticky fact's rule in `preferences.md` › Sticky Knowledge |
| Slide titles | `preferences.md` › Slide Headings | Designer L68, reviewer L222, slide designer L49, the slide check's message |
| Notes voice and order | `preferences.md` › Speaker notes hand-off | Designer's Speaker Notes Voice (the full voice), slide designer's order |
| Answer slides | `preferences.md` › Support, Checking and Release | Designer L385, contract L565, routes, slide designer |
| Decoration | `preferences.md` › Visual priority | Picture guide, decorator, history's one line |
| A real fact | `preferences.md` › Source and Scenario Integrity | Maths hook pointer |
| Colour (7C) | `teacher-slide-visual-profile.md` › Semantic colour | `preferences.md` presentation rules keep his words and point |

Rules written in several subject files stay in each (the subject-files list's
settled item 12); rules in the reviewer's checks and the designers' page files
stay with their readers.

## Where his answers meet the other lists

| His answer here | Meets | Carried by |
|---|---|---|
| Sticky place, no fixed rule (SA 6) | Routes 7h, 7k (usually at the top); routes 3 and 4 (his way of explaining written once) | 7A, whole, route-file lines included (settled by the lead, 24 September; every line listed in A5's table); the routes release moves the route paragraphs under its heading with 7A's pins and does not reword them |
| Launch trigger (PF settled 2, 13b) | Routes decision 2 (skipped only when a good one was seen earlier in this lesson) | 7B writes the designer's and reviewer's pointers in decision 2's words; the routes release adds 13b's criteria clause to the home (L641) and to those three pointers with the validator change that accepts it, so words and code land together (L641, LD L243, L406 and REV L205 edited in both releases by named change); the routes release carries the route files and the validator |
| "You can pass" in the route files (PF 15) | Routes rows E59, E63, F06 | 7B |
| Research file clauses (PF settled 12) | The routes release's edits to the same file | 7B first; the routes release re-reads. `explanation-tasks.md` L58 (M30) is 7B's too |
| The review packet | Reviewer release's new triggers (Slide Philosophy, visual-need boundary, Source and Scenario Integrity) | 7A changes other entries (the Apply trigger, the always-read Pride note, the lesson lines in the view); whichever lands second rebases |
| Maths `Apply` title (PF settled 1, SA N1) | Reviewer settled 8; routes 7f | 7A, once |
| Drawings on serious lessons (PF 9) | Subject files settled a (history's no-drawings list) | 7B |
| Notes voice, "a nine-year-old" (PF 3) | Voice decision 13 (all four places) | 7B |
| Four pieces pointer (PF settled 8) | Reviewer settled 1 (no line added) | 7B, pointer only |
| Word bank (PF 16) | Worksheets settled 14 | 7B for the slide scan path; the worksheets release for the sheet |
| Stick-in labels (PF 17) | Worksheets H01, H02 (same two lines) | 7B, stick-in half only |
| Wall words and colours (SA 7, PF 22) | Topic 9's wall list | 7A (words), 7C (colours); glance times and the example card left to topic 9 |
| The Lesson 2 plan (PF 20) | The playbook (report line) | 7A |
| The contents paragraph's "reads only the named section" (PF-A29) | Reviewer settled 5 (the same correction) | 7A, once, with the rest of the contents block |
| Out-of-date rows in the voice guide | Voice list's own out-of-date items | The voice release |
| Rows in the subject-file guide and skill | Subject files decisions 1 and 3 (both removed) | Topic 8; 7B does not touch them |
| Chipped tooth clause in Slide Philosophy | Voice decision 2 | The voice release; 7B leaves L559 alone |
| A light line never reaching the board | Voice decisions 9 and 10 | The voice release; 7B leaves Pride Lessons and the humour paragraph alone |
| Three cases on the reviewer's reading card | Reviewer decision 7 | The reviewer release (its own entries beside 7A's Apply trigger) |

**Overlap with 4.2.289 (the fit release), which lands first.** It edits
`slide-success-criteria.md` (the placement paragraph only; 7A edits L105 in
"Sticky knowledge shares the panel"), `templates.md` (the `*-sc` family and
`quad-v`; 7A edits other sections), the validator (its new criteria measure
counts at most one sticky line exactly, which matches the designer's one fact
per practice unit, SA-H06, kept word for word), and the SC pin file (7A moves
other SC pins). 7A is written against the committed 4.2.289.

**Overlap with the worksheets release (topic 6).** It edits `preferences.md` ›
Worksheets and the sheet designer; 7B's decisions 16 and 17 sit beside those lines
and are written against it.

## Order of work, and the change scripts

Each script asserts its old text appears exactly once, replaces it, and keeps the
Windows line endings; written with the Write tool, never a heredoc.

**7A (`streamline-tools/t7a-change/`):** `a0` baseline and the saved-design
normaliser; `a1` the story to the log; `a2` the two retired fields (code, contract,
scaffold guide, tests, fixture, playbook, designer L116, How Much Fits L274 and
L278, reviewer L156 and L158); `a3` the starter (A3, A9, A10); `a4` sticky fold and
settled 5 and 6 (A4, A5); `a5` the wall words and message (A6); `a6` the Apply and
its routing trigger (A7); `a7` the test question (A8); `a8` titles (A11, code and
tests); `a9` the contents block and out-of-date (A12); `a10` other topics' pins;
`a11` mapping and the SA pin file (`ledger_mapping.py`); `a12` log entry and both
`plugin.json`. Then two independent checks, repairs, a second check.

**7B (`t7b-change/`):** `b0` baseline; `b1` stories to the log; `b2` notes and the
nine-year-old lines (B1); `b3` answer slides (B2); `b4` which book (B3); `b5`
drawings (B4); `b6` decision 13 and 13c (B5); `b7` you can pass (B6); `b8` word bank
and stick-in labels (B7, B8); `b9` never below the readable size (B9); `b10` launch,
minutes, four pieces, research file, precedence (B10 to B14); `b11` the real fact
(B15); `b12` out-of-date and dates (B16, B17); `b13` other topics' pins; `b14`
mapping and the PF pin file; `b15` log and `plugin.json`.

**7C (`t7c-change/`):** after question 1; code first with its tests, then the
profile and preferences words, then the wall palette, then renders for him.

The reusable scripts from 4.2.288 (`sc-change/`) show the shape: story first, home,
copies, code, tests, other topics' pins, mapping, log.

## Risks

1. **The retired fields fail every saved design.** Explained by the normaliser; any
   future tool that re-validates an old design will refuse it (none does today).
2. **Loosening the sticky fact's place can let the caption back.** The reason H13
   carried (the top line is never a caption of the picture) must survive as a
   clause in L101 and in L105's "never a caption", or "usually" reads as licence.
3. **Decision 9's trigger could make the reviewer demand an Apply.** The behaviour
   case forbidding that stays, and the trigger only sends it to read.
4. **"A bigger card" does not exist on the wall** (fixed A3, two-line cap, two-sheet
   cap). The plan uses the no-picture card and a second card; a sentence that fits
   neither is still shortened to a whole sentence, which SA 7 allows. If he meant
   more lines on a card, that is a new engine change.
5. **A vocabulary pin sits inside the wall paragraph being changed** (VOC-O07): the
   definition sentence must stay word for word while the sticky fact joins it.
6. **The contents block is pinned whole three times**, and the assumed-knowledge
   homes and the rhythm homes are pinned paragraph for paragraph: every edit to
   them rebuilds those homes on purpose, never by deleting a pin.
7. **Blue for a short task reverses his 3 September ruling**, which the slide check
   enforces and quotes. Question 1; 7C does not start without it.
8. **"Suggests what the second lesson should contain"** may reach L276's "make the
   production the opening of the next lesson". Question 2; the evidence file
   already forbids prescribing tomorrow's lesson (PF-I14).
9. **Settled item 9's "a small drawing" meets his later "small goes".** The later
   answer wins; the plan writes "a drawing".
10. **The decorator's new stopping rule changes behaviour** (more drawings). It is
    what he asked for on 19 September; watch the first decks.
11. **A pointer can paraphrase away a limit.** The test-question contents line and
    reviewer line must carry both exceptions and nothing wider; the do-beats
    retrieval entries must carry all of A07's conditions; the Apply's J17 stays
    conditional on "earned".
12. **The model slide's "one possible answer" label has no field or check.** It
    rests on the slide designer's furniture exception.
13. **An untitled grid now fails the build.** No fixture relies on the default; a
    saved deck rebuilt without a title would.
14. **Four releases edit `preferences.md` in a row** (fit is not one; worksheets,
    7A, 7B, 7C are). Each is written against the committed one before.
15. **The PF pin file is the largest yet**; if the pin test slows the suite
    noticeably, say so rather than trimming what it pins.

## Questions for him

**1. The colour of a short task on the board.**
- **What it says now.** Your answer on 24 September: blue means a question or a
  short task like "Explain why". But on 3 September you asked "can we make only
  questions to children blue", after a history deck came out almost all blue, and
  the slide check has refused a blue instruction ever since. So today "Is Isla
  correct?" is blue and "Explain your answer." under it is black.
- **What I think.** Your newer answer wins, but it needs a limit or the all-blue
  board comes back. A short task is the child's job in a few words; a longer
  instruction about how to go about it is not.
- **What I suggest.** A question or a short task is blue ("Explain your answer.",
  "Write one reason."); a longer instruction stays black ("Point to the details in
  the photograph that support your comparison.").
- **Question:** is that the line, or should every instruction be blue?
- **His answer (24 September, evening):** "yes". A question or a short task is blue; a
  longer instruction about how to go about it stays black. 7C can start.

**2. What today's lesson says about the next one.**
- **What it says now.** When a lesson is really two, your preferences say teach the
  knowledge today and "make the production the opening of the next lesson, warmed
  by a quick retrieval of today's learning".
- **What I think.** That sentence plans the next lesson a little, which you said
  should come out ("it already knows how much it can fit in one lesson"). But its
  first half is what tells today's lesson where to stop: on the idea, not on half a
  piece of writing.
- **What I suggest.** Keep where today stops (end on the lesson's main idea while
  it is fresh) and take out what the next lesson opens with.
- **Question:** yes, or keep the sentence as it is?
- **His answer (24 September, evening):** "yes". Today's lesson still ends on its main
  idea while it is fresh; what the next lesson opens with comes out.

## Size, honestly

- **7A:** about 85 changed rows (about 63 of the 390 starter rows and 22 from the
  other list), about 45 paragraphs in 20 instruction files, eight program files,
  most of them small (validator, scaffold, review packet, wall packet, the grid
  template and the builder's check of it, the slide check, the wall's messages,
  one code comment), 11 test files and a fixture, pins moved in all five earlier pin files, and a new pin
  file of 390 rows. About one and a quarter times 4.2.288. Bytes: a small net
  saving (two duplicated designer sections shrink, the contract loses its retired
  parts); written honestly in the log whatever it comes to.
- **7B:** about 150 changed rows of 1,779, most of them small (a date, a stale word,
  a pointer), about 70 paragraphs in 30 files, no program, 3 test files, four homes
  rebuilt in other pin files, and the largest pin file yet. Twice 4.2.288 in rows,
  lighter per row. Bytes barely move: this list is mostly homes that stay.
- **7C:** about 40 rows, six programs, about 12 test files, and renders for him.
- Two independent checks each, and a second check after repairs, as before.
