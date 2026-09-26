# The routes release (topic 8, release 3): what was built

Built from `routes-release-brief.md`, following `plans/2026-09-24-topic-8-change-plan.md` section 4
(with sections 0, 1, 8, 10 to 13) and the teacher's words in `plans/2026-09-23-routes-ledger.md`
("Decisions taken", "His answers, 24 September (afternoon)", the settled items, and the closing
section the subject-files release added), with the change plan's question 2 as he answered it. Built
on the side branch `streamline/8-routes` in `C:\Users\Daniel\Projects\lessonv4-routes`, from
`59f85708` (4.2.293). Nothing is committed; the version is not bumped and the log entry has no
number (the lead sets both at merge). Repaired after the full check (`rt-release-check.md`): see
"Repair round 1", which comes first.

## Repair round 1 (after `rt-release-check.md`, the lead's six items)

One script, `rt-change/rt_05b_round1.py`, run after `rt_05_code.py`; the tests, pins, notes and log
that follow it were rebuilt from it.

1. **13b skips only a second model.** "count as one seen" (which the routes' own rule uses to let a
   whole launch go) is gone from the launch home and its three pointers. Each now says: "success
   criteria on the board that already show what a good one looks like (an actual good one, such as a
   model answer or a good paragraph, never a list of what a good one includes) stand in for the good
   instance, so the launch keeps its case and steps and needs no second model".
2. **Criteria count only when they show an actual good one.** His example was "a writing task whose
   criteria already show a good paragraph". The same limit is in the four places above and in the two
   output-block lines the words came from (RT-E70, F34). The program's criteria pass is gone: no
   criteria shape (steps, a reference table, labelled references) holds a written model, so the program
   cannot see one, and a written explanation keeps needing its good instance, a launch pair or an
   earlier beat that showed one. The message adds "success criteria that list what a good one includes
   are not a good one shown". The words keep 13b for the designer and the reviewer. Tests hold both
   sides: the three maths lessons' shape (a one-line launch, rounding steps attached as criteria) and
   the history comparison's checklist launch are refused; the same launches with a good one beside a
   weak one pass.
3. **The three maths lessons, honestly.** In the first build, three of the six newly refused maths
   lessons (`round-to-the-nearest-100`, `trial-c-round-10-secure`, `read-and-complete-number-lines`)
   would also have passed with a one-line launch and no explanation shown, because their rounding steps
   are attached as criteria. Item 2 closes that: `rt_designs.py` now gives each of them that one-line
   launch, and each is refused. The history comparison lesson that passed in the first build is refused
   again, as it was on 4.2.293, until it shows a good comparison.
4. **The reviewer's file conflicts in two places at merge**, not one: line 44, and section 3's list,
   where the reviewer's J34 and this release's J36 are neighbouring lines. `rt_follow_at_merge.py`'s
   opening and this report now say so; its put-back covers both.
5. **The section other routes read on its own.** "So the default is to write it, and the validator
   refuses `null` on a `teach` beat (a task lesson's `teach-needed` keeps its own rule: `null` only when
   the idea and its instance already carry the meaning)." The two "fault above" pointers now name the
   fault inside the section: "Saying the same thing three ways is a fault (this section's last
   paragraph: the landed sentence again in other words)" and "which is saying the same thing three
   ways, at the level of slides". Two existing tests that held the old words follow them.
6. **The reviewer's launch line in decision 2's words**: "when the class has not yet seen a good one of
   this product earlier in this lesson or the enabling input ran to several units, ... and a null
   `launch` is right only when children can begin from the question alone or the class has already seen
   a good one of this product earlier in this lesson". "when the product's form is new to the lesson"
   is gone from the plugin.

Also from the check: RT-J35's old sentence is barred everywhere; the explaining home is six
paragraphs, not five; the repin script's stale docstring line is fixed; each of the reviewer's pins
the follow script moves names only the changes its words carry. The 3 KB a task lesson reads twice
(`The launch` beside the task route's own copy) is left for release 4, as the lead asked.

**Found while repairing:** a lesson designed today in the main checkout,
`working/year-4-maths-lesson-16-roman-numerals-to-l` (13:02), passes 4.2.293's validator whole and is
refused by this release: its last Practise asks "Lily says: "XXVIII is greater than XL because it has
more letters."" with `written-explanation`, no launch, and every turn an exact answer in the notes. It
is his question 2's case exactly; the fix is one good explanation beside a weak one before it.

After the round: every suite passes (Python 2,337, the rest unchanged); the replay makes the branch
exactly; 63 of 63 undo attacks are caught (eight new for this round); the trial merge onto `91687471`: the reviewer's file conflicts in exactly the two places above, and after the follow script the whole Python suite (2,358) and the voice harness pass on the merged tree.

## In short

- Every decision on the list that release 3 carries is built: decisions 1, 2 (with question 2 and
  his preferences decision 13b), 3 and 4 (his 3, widened), 5 and 8; settled items 6, 7a, 7c, 7d,
  7e, 7f, 7g, 7i and 7j. 7b, 7h and 7k (and 7f's designer half) were 7A's and are checked landed.
  The stories the plan names leave, copied to the build log first.
- The change is ten scripts in `rt-change/` (and a runner), each old text asserted once, line
  endings kept. Replayed in order on a clean `git archive 59f85708` copy (`rt_replay.py`), they make
  this branch exactly: "different from this branch: nothing" (979 plugin files, every ledger and
  the mapping).
- Every suite passes (table below). Python 2,337 (2,280 before; 57 new tests).
- Each of 63 changes, undone one at a time on a complete scratch copy (the untouched copy passing
  first), is caught by a test (`rt_undo_checks.py`, 63 of 63; the copy restored byte for byte).
- A trial merge onto main as it now is (`91687471`, the reviewer release committed): the expected
  conflicts only; resolved as `rt_follow_at_merge.py` says, the whole Python suite (2,358) and the
  voice harness pass on the merged tree.
- The instruction files are 3.5 KB larger, not smaller; a lesson on another route that explains
  now reads about 12 KB it did not before. Said plainly under "Size".
- Five departures from the plan, one of them his words over the plan's (the task route's launch
  trigger), are listed under "Where I departed from the plan".

## The scripts, in replay order

All in `plans/streamline-tools/rt-change/`, run with `python -X utf8 <script>` (or all of them with
`rt_run.py`). Each finds the tree from its own place and prints it before it writes; the plugin root
can be moved with `LESSONV4_PLUGIN_ROOT`, the mapping with `LESSONV4_MAPPING_OUT`, the ledgers with
`LESSONV4_PLANS_OUT`.

| Script | What it does |
|---|---|
| `_patch.py`, `_root.py` | one replacement at a time, old text asserted once, line endings kept; the mapping tool pointed at a scratch copy |
| `rt_01_stories_first.py` | the log entry's heading and its "Stories kept here" block: every story sentence that leaves, word for word, before anything moves |
| `rt_02_routes.py` | decisions 1, 5 and 8; settled 6, 7a, 7c, 7d, 7f (the two unwritten rules), 7g, 7i; the stories out |
| `rt_03_explaining.py` | decisions 3 and 4: the two headings, every route's pointer, the designer's read line, the reviewer's, preferences' and voice guide's pointers |
| `rt_04_launch.py` | decision 2 in words, and 13b in the launch home and its three pointers |
| `rt_05_code.py` | the validator (the widened check, question 2, 7j and 7f messages); the review view (7e) and the designer's child-facing list |
| `rt_05b_round1.py` | repair round 1: 13b's words, the program asking for an actual good one, the reviewer's launch line, the section read alone |
| `rt_06_tests.py` | five existing tests follow changed words; three new test files placed (from `rt-change/new/`) |
| `rt_07_repin_other_topics.py` | the earlier topics' pins that held a changed sentence follow it, found by their words (`--follow` after the merge) |
| `build_rt_mapping.py` | `plans/2026-09-26-routes-mapping.md` and `scripts/tests/routes_ledger_pins.json` |
| `rt_08_ledger_notes.py` | a closing section on the routes ledger and on each ledger whose rows or pins this release touched |
| `rt_09_log_entry.py` | the log entry above its stories |

Tools, not part of the replay: `rt_designs.py` (the widened check on every saved design, before and
after, with the named repair), `rt_cards.py` (every saved design's card and view, before and after),
`rt_sizes.py`, `rt_dash_check.py`, `rt_undo_checks.py`, `rt_replay.py`, `rt_merge_trial.py`. For the
lead at merge: `rt_follow_at_merge.py`.

One shared tool changed: `plans/streamline-tools/ledger_mapping.py`'s `home_paragraphs` failed on a
home that is the last section of its file (`The launch` is); it now reads to the end of the file, as
the pin test already did. No earlier caller reaches the end of a file, so nothing else changes.

## What changed, decision by decision

### Decision 1 (his "y"): moving about

- The discussion route's Stimulus: "a ranking, a sort, a four-corners vote" became "a ranking, a
  sort, a vote with a written reason". Its Four corners Talk format became "A line on paper from agree
  to disagree, or a vote with a written reason (`do-beats.md` 6.2 and 6.4)". Role-play, hot-seating
  and the short debate keep "only when every child first writes ... or picks a side".
- The activity list's calm-classroom line gains "or when the movement is itself what is being learned
  (standing and making a quarter turn to learn what a quarter turn is)". The designer's enactment
  sentence and the skill route's recognition paragraph already said this and are unchanged.
- Tests: no route file says four corners in any case; the formats' conditions and the exception are
  held; the movement test follows its sentence.

### Decision 2 (his "y"), the plan's question 2 (his "Yes") and his 13b

His words: "One rule everywhere: the example is skipped only when the class has seen a good one
earlier in this lesson, and the check covers big-task lessons and a skills lesson's bigger practice
task too"; then "Yes" to "a My Turn or Our Turn counts only when it shows the kind of thing children
then write".

- **Words.** The content route's home rule (RT-E30) is unchanged. The task route's "A task children
  can begin from its question alone, because the enabling input was one unit and the product form is
  familiar, leaves `launch` null" became "`launch` is null only when children can begin from the task's
  question alone, or when an earlier beat of this lesson has already shown the class a good one of this
  product (a model answer revealed on the board, or an earlier launch)". Both output-block lines
  (RT-E70, F34) gain that second case. The task route's own trigger for a launch (RT-F18) changed from
  "the product has a form children have not yet made in this lesson" to "the class has not yet seen a
  good one of this product in this lesson" (see "Where I departed").
- **13b** (moved here from 7B so the words land with the code), as repaired: "success criteria on the
  board that already show what a good one looks like (an actual good one, such as a model answer or a
  good paragraph, never a list of what a good one includes) stand in for the good instance, so the
  launch keeps its case and steps and needs no second model", in the same words in preferences' launch
  paragraph (the home), the designer's rhythm line, the designer's walk-through line and the reviewer's
  launch line, and the limit in E70 and F34. The reviewer's line adds "and the program cannot see
  whether they do, so judge that from the criteria beside the task". The reviewer's line also takes
  decision 2's words (round 1, item 6).
- **Code** (`validate_explanation_task_is_modelled`): it now reads a content or skill lesson's
  `practise` and a task lesson's `do-task`. A beat is an explanation task when it carries
  `reasoningWords` or `rehearsal` (the explanation-task fields), or, on a Practise, its `format` says
  explain, compare, paragraph or justify, as before. A Do the task's `activity` is not searched: the
  task route's own test lesson says "Plan the comparison ... run the investigation", and an enquiry
  that compares materials is not a written comparison (the first build searched it and refused that
  lesson; tests hold both sides now). A My Turn or Our Turn counts only when its own `example` asks
  for an explanation and its good one is on the board (a model or standard answer revealed, or a My
  Turn's `modelledExemplar` written live); other beats count as before (a model answer revealed, or an
  earlier launch pair). Criteria never stand in for the program (round 1): no criteria shape holds a
  written model. The message names the beat ("this Practise", "this Do the task") and says what
  a turn needs to count. The docstring no longer says a skill lesson is left alone.

### Decisions 3 and 4 (his 3, widened): his way of explaining, written once

His words: "thats how i explain anything, so might not neccearily be teach slides i guess"; his
starters answer the same afternoon: the because or so "just to explain that one key point", "then
addressing a misconception or pointing to an example".

- **Two headings at the end of the content route's output block**, `### How this teacher explains`
  (the five `explanation` paragraphs, RT-E45 to E63) and `### The launch` (the seven launch paragraphs,
  RT-E70 to E77), moved word for word. They go last because a section runs to the next heading at its
  level: anywhere else, the Do and Practise shapes would have been read as part of it. The Teach and the
  Practise each keep a one-line pointer where their paragraphs were. The Teach's `thinking`,
  `teachingText`, `keyQuestions` and anchor lines stay with the Teach.
- **The bold sentence** is his read-back: "This is how this teacher usually explains anything, on a
  Teach board in any kind of lesson or wherever else something is explained: the takeaway, then a
  because or so that explains that one key point, then an example or what it does not mean. It is how
  he usually explains, not a template, and the board reads that way unless the beat has a reason not
  to." The rest of that paragraph opens the section with one sentence naming the field that carries it
  in each route and one naming the two exceptions and where each lives (a skills lesson's brief board,
  discovery's takeaway at the end). The numbered parts and his examples are unchanged.
- **Every route points there, keeping its own exception and its own length:** the skill route's
  prepare explanation ("two or three short lines on the board, the way this teacher explains"), its
  output block's new line (a `teach` takes the knowledge route's Teach fields and explains as the
  section says, kept brief as its Cycles section says; a `practise` takes the Practise fields and `The
  launch`), and its Practise's "full launch" names `The launch`; the task route's enabling input
  (above the reviewer's line) and its output field; the discovery route's Teach why (above the line)
  and its output field, both "with the takeaway landing at the end"; the dialogic grounding input, one
  new sentence when it explains. The older three-line shapes are gone; SKILL's "In a methods lesson it
  is brief on the board as well as in time" (C28) is word for word.
- **The designer reads it:** a new paragraph beside its success-criteria read line tells a lesson on
  another route to read `teaching-sequence-content-based.md::How this teacher explains` (and `::The
  launch` for a `do-task` or a skill `practise`) with `read-reference.py --select`, not the file. The
  walk-through line, the reviewer's four-parts line (RV-C11) and preferences' pointer (PF-O03) name the
  heading; the voice guide's §5 gains "An explanation usually goes the way this teacher explains (...);
  that is how he usually explains, not a template." Both sections read whole through the bundled
  reader (a test runs it).

### Decision 5 (his "y"): planning

"Planning and doing continue as one flowing task, with any check for safety or wasted materials inside
it as the teacher's check; the plan gets its own beat only when it produces something children need
before they start (a fair-test plan, a labelled design)." The checkpoint's own conditions (F11) and
F15, F20 are unchanged.

### Decision 8 (his "y"): the Look for note

"Put the one link most children skip, and the question to ask at it, in `speakerNotes.lookFor` on the
task beat, inside its 25 words: `Look for: the acid named as something the germs make: if a child jumps
from sugar to the hole, ask what the germs did with the sugar.` The other likely gaps and their
questions go in the same beat's `speakerNotes.teacherInfo`, beside the likely mistakes." The example was
26 words by the validator's count (the " - " counted as a word); a colon makes it 25, with every word of
the question kept. A test counts it as the validator does.

### The settled items

- **6:** the choosing test says "after a short enabling input, one idea at a time".
- **7a:** "the finished helper follows on the next slide as the unit's answer (`modelling-formats.md` →
  Live-complete helper)".
- **7c:** the activity list's opening says what entries carry, checked entry by entry (all 76 have
  Best for and one of SEND access (62) or Demands and supports (14); some carry The limit, a Register
  and Mechanism, or a Teacher-owned response routine; two are Not used). §1 to §3 say seven, naming free
  recall and partner discussion; 1.2, 2.5, 3.2 and 8.3 name Free Recall (1.1) and partner discussion
  (2.1). A test counts every section's entries against its contents line. The pinned §5 and §8 counts
  were already true.
- **7d:** "sentence stems and push-back questions are conditional teaching tools ..., and the one
  Synthesise after the last discussion is the route's own beat".
- **7e:** the review view's words-children-read list gains `modelledOn`, and a `prepare` unit's
  `activity` in `explanation` mode (a small function beside `ACTIVITY_IS_THE_TASK_KINDS`, whose name
  stays); the designer's list says the same.
- **7f:** "Run each concept's cycles together, in the order `concepts` lists them." (skill route,
  beside C20) and "A Talk's `discussionQuestion` is its Stimulus's `question`, word for word." (dialogic,
  beside G22), each its own paragraph so no earlier pin moves; the turn-label message: "In maths the
  plain words are what the teacher wants ('My Turn'); in other subjects name the move after them". The
  check already accepted the plain word.
- **7g:** the designer's pointer names `Cycles, and the beats around them`, and so does the same
  pointer in `subject-maths.md` (SJ-D81), found by grepping for it; the dialogic sources moved under
  Dialogic (the structure menu still reads one `Use when` per subsection); Karpicke; "designing
  lessons"; "the route's optional explanation"; Pose Pause Pounce Bounce, Round Robin and role on the
  wall out of the sources.
- **7i:** "keep one takeaway as key line, with the route on the board in whole sentences and said more
  fully in the script".
- **7j:** the empty-Teach message: "the route this teacher usually walks after the sentence the slide
  lands, the because or so that explains it, then an example on the board or what it does not mean";
  its code comment follows.
- **7b, 7h, 7k and 7f's designer line** are 7A's and landed (RT-P12, E12, E13, E40, E41, E42, E44, C27,
  P19, mapped with 7A's words).

### The stories

Copied first, word for word, into the log entry's "Stories kept here": RT-C34 (with his "the rubbing
out was the slowest part", not in the log before), C36, C05's date, E14 and E62's teeth slide (the
`Incisors cut` wording, not in the log before), E51, E54's date, E58's tooth slide and the Tudor
slide's date, E77, I12 (not in the log before), N05, N08. Kept as reasons or plain examples: the four
script lines of E51 ("Script lines such as ..., said and never shown, are that tell."), E58's reason
("A picture with a label and one fact lets a teacher reading the board aloud say where the thing is and
nothing else, so the children learn a label rather than what it names."), I12's and N08's reasons. His
rulings keep his words without their dates (C05, E54, the Tudor slide). The words round the kept
reasons are mine. His calibration examples are untouched (a test holds the Shaftesbury lines, "Look at
her", the Victorian children, the tooth-decay pair).

## Where I departed from the plan, and why

1. **RT-F18's trigger changed.** The plan kept F18's words. But decision 2 lists F18 among its rows,
   its "what it says now" describes F18's question ("have children made this kind of work earlier in
   this lesson?"), and he said yes to one rule everywhere. Left alone, F18 would still tell a task
   designer that a form made earlier needs no launch while F19 said otherwise. His words win; only the
   trigger's second half changed (the several-units half stays).
2. **The explanation check does not search a Do the task's `activity`.** The plan's probe did not look
   at it either; the first build did, and refused the task route's own test lesson, whose fair test
   "compares" materials. A Do the task is an explanation when it carries the explanation-task fields.
3. **7B is not built**, so its parts stay undone (see "Left for 7B"): the designer's two pointers
   carry 13b without decision 2's words, and "You can pass" moved under the new heading as it stood.
   The reviewer's launch line, B10's one piece that decides behaviour, takes decision 2's words here
   (round 1, the lead's call).
4. **The headings sit at the end of the output block**, not where their paragraphs were, so each is
   one readable section (above).
5. **PF-O03 (preferences' pointer to `→ explanation`) and SJ-D81 changed too**, found by grepping for
   the concept; the plan named only the designer's and the reviewer's pointers. The reviewer's other
   pointer inside C10 ("`explanation`, part 3") is left: the reviewer release restored C10 word for word
   by his answer, and it still resolves.

## Every pin, and why

**New.** `scripts/tests/routes_ledger_pins.json` (610 pin rows, 608 KB) with
`test_routes_ledger_is_kept.py`: all 592 rows (506 unchanged in place; 69 changed, each with its
decision and each changed row's whole paragraph; 17 moved under the new headings, their pins naming the
new section), five added records (13b in its four places, the reviewer's launch line, the designer's
read line, the pointers, the two pointer lines), and the two new headings paragraph by paragraph (6 and
7). Twelve changed rows were
changed first by earlier releases and are mapped to their words: C27, E12, E13, E40, E41, E42, E44,
J06, P12, P13, P19 (7A) and L20 (subject files). Twenty-one decision tests in five classes hold every
decision and settled item and the stories. Two more test files: `test_a_good_explanation_is_seen_first_in_every_route.py`
(22 tests: each route, each turn case, criteria never standing in, the reviewer's launch line, the whole design refused and its repair passing
in a skill and a task lesson) and `test_the_class_view_reads_every_explanation_the_board_shows.py` (6).

**Earlier topics' pins moved in place** (`rt_07`, 38 pins in 37 rows and three home records; each
outcome names the decision; each topic's ledger says so):

| Pins | Rows | Why |
|---|---|---|
| quick checks | QC-C08, E11, P01; QC-D11 to D16 | the reviewer's launch line gains 13b; 1.2 names Free Recall (7c) |
| success criteria | SC-Q01; SC-H22; SC-R04, R05; SC-H03; SC-H29; SC-H47 | the reviewer's launch line (decision 2 and 13b); 13b in the walk-through; the output-block limit; "the existing route" (7g); the Our Turn ruling's date; the task route's trigger (decision 2) |
| the rhythm | TD-L07, L09; TD-A04, B07, C03, D03, F13, I02, J03, Z19, HOME-TD-LD-01; TD-L10; TD-J56, C19; TD-J20 | 13b (reviewer, designer's rhythm line); the four-parts line names the heading; four corners out; the skill Practise names `The launch` |
| starters | SA-M08; SA-E20; PF-Q14 | 13b; 7e; the teeth story out of the content route's L31 |
| subject files | SJ-D81; HOME-SJ-PICTURE-RULES-07 | the pointer (7g); 13b in the launch home |
| worksheets | HOME-WS-LD-08 | 7e in the designer's Worksheet home |

Assumed-knowledge, vocabulary and colours pins are untouched.

## The suites

`bash plans/streamline-tools/run-all-suites.sh rt-r1` on the final tree, the venv's `python3` first
on `PATH` (logs `rt-r1-*.log`, baseline `rt-before-*.log`, both summaries beside them):

| Suite | After | Before (4.2.293) |
|---|---|---|
| python | 2,337 passed, 1 skipped | 2,280 passed, 1 skipped |
| voice harness | 21 | 21 |
| builder | 772 | 772 |
| worksheet-html | 771 | 771 |
| stick-in-sheets-html | 73 | 73 |
| working-wall-html | 166 | 166 |
| shared | 126 | 126 |
| test | 46 | 46 |

The 57 new Python tests: the routes pin test (8 shared checks and 21 decision tests), the explanation
check in every route (22) and the class view (6). No engine changed, so the engine suites are as before.

**Dashes** (`rt_dash_check.py`): none in any sentence this release wrote. Eighteen edited lines keep a
dash that was already there, in words not rewritten (the activity list's contents and source lines, a
Stimulus line, two task-route lead-ins, and the pins that hold them); the mapping, the scripts and the
pins quote the files' own dashes.

## The saved designs, the cards and the views

A 54th saved design appeared in the main checkout during repair round 1 (a Year 4 maths lesson on
Roman numerals to L, designed at 13:02); every figure below is on all 54.

- **As saved** (`validate-saved-designs.py`, `rt-after-designs.json` against `rt-before-designs.json`,
  both rerun on the 54): 53 give exactly the faults they gave before (7A's retired keys and earlier
  checks stop them first). The new Roman numerals lesson passed 4.2.293 whole and is now refused by the
  widened check alone (its Practise: "Lily says: "XXVIII is greater than XL because it has more
  letters."", `written-explanation`, no launch, every turn an exact answer in the notes).
- **The widened check itself** (`rt_designs.py`, each design stripped of 7A's four retired keys, the
  check run alone on a clean 4.2.293 validator and on this one):
  - **Seven newly refused**, all Year 4 maths skill lessons ending on a reasoning question with no
    launch: the plan's six (`year-4-maths-lesson-15-compare-and-order-negative-numbers`,
    `year-4-maths-lesson-17-roman-numerals-to-c`, `read-and-complete-number-lines`,
    `round-to-the-nearest-100`, `trial-c-round-10-secure`, `year-4-maths-lesson-14`) and today's Roman
    numerals to L. His question 2 answer asks for exactly this. Each passes once its Practise's launch is
    given a good instance beside a weak one, the fix the message names; each is refused with a one-line
    launch and no good one, including the three whose rounding steps are attached as criteria (round 1).
  - **None refused before and passing now.** The history comparison lesson the first build let through
    on its criteria checklist is refused, as on 4.2.293.
  - The whole validator's first fault changes on five stripped designs: four because the new refusal is
    added to their list (one of them the Roman numerals lesson, which had none), one because the
    empty-Teach message is reworded (7j).
- **Where the refusal is met in a run, who repairs it, and why a run still delivers.** It is the
  design validator, so it is met in the lesson designer's own bounded repair passes, then the
  orchestrator's success check, then any later re-check (the review packet's, the adaptation picture
  step's). The lesson designer repairs it: the message names two fixes, and one of them (a launch pair
  on the beat it names) is always open, because every `practise` and `do-task` has a launch. Then the
  focused repair, then one fresh designer attempt, as for every validator fault; only if all of those
  failed would the run end BLOCKED with the diagnosis, which is the same floor every existing validator
  rule has. Tests show a whole skill design and a whole task design refused and then passing with the
  named fix, and `rt_designs.py` shows each of the seven saved lessons passing with it.
- **Cards and views** (`rt_cards.py`, built with the packet's own functions): all 54 cards differ only in
  the source fingerprints of the files they name; 52 views build (two old designs cannot, before or
  after). Two views change: the two task-centred PSHE lessons gain their `modelledOn` instances in `As
  the class meets it` (49 to 53 strings; 47 to 48), and the residual content shows `(in the class view)`
  for them. No saved design has a skill `prepare` in `explanation` mode.

## Size, before and after

Line endings normalised (`rt_sizes.py`, after repair round 1):

| Group | 4.2.293 | After | Change |
|---|---|---|---|
| Instruction files (15) | 832,931 | 836,398 | +3,467 |
| Programs (2) | 345,113 | 348,479 | +3,366 |
| Tests and pins (14) | 3,301,506 | 3,971,182 | +669,676 (the new pin file 608,059) |
| The build log | 768,776 | 785,433 | +16,657 (the entry and its stories) |

- **Not smaller, as the plan expected ("roughly even").** The lesson designer is 1.5 KB larger (the read
  line, 13b twice with its limit, the child-facing list; the plan said 0.6 KB); the reviewer 0.5 KB (13b
  and decision 2's words); the task route 0.5 KB and the content route 0.3 KB (the pointers and the
  limit); the dialogic and discovery routes 0.2 KB each; the activity list 0.2 KB and the modelling file
  0.35 KB smaller (the stories).
- **The validator is 2.8 KB larger**, not the plan's 1 KB: most of it the docstrings saying why.
- **A lesson on another route that explains now reads the two sections**, about 9.2 KB and 3.1 KB, not
  the plan's 4 KB. That is what "read wherever something is explained" costs. A task lesson reads the
  launch fields twice (`The launch` and its own route's copy) until release 4 folds them, as the lead
  asked.

## The merge onto main, and every paragraph both releases touch

Trial (`rt_merge_trial.py`, on scratch copies in `scratch/rt/merge/`): `git archive 91687471` (main,
4.2.294, the reviewer release committed with its follow-up run), then this branch merged onto it with
`git merge-file`, base `59f85708`:

- **Merge cleanly:** `scripts/design-review-packet.py`, `worksheets_ledger_pins.json`, and every file
  only one side changed.
- **Conflict, as expected:** `agents/design-reviewer.md` in **two** places (line 44, and section 3's
  list, where the reviewer's J34 and this release's J36 are neighbouring lines); the build log; four pin
  files (quick checks in 6 places, the rhythm in 6, starters in 2, success criteria in 2); and eight
  ledgers' closing sections (quick checks, the rhythm, reviewer, rest of preferences, starters, success
  criteria, voice, worksheets).
- **Resolved** as `rt_follow_at_merge.py`'s opening says: the log and the ledgers keep both entries, the
  reviewer's first; `design-reviewer.md` and the pin files take main's side in each conflict; the
  heading numbered with a stand-in 4.2.295. Then `rt_follow_at_merge.py` put back both of this release's
  reviewer lines (C11's heading; the launch line with decision 2's words and 13b), moved the earlier
  topics' pins, moved eleven pins of the reviewer's own pin file (RV-C08, C10, C11, C13, E10, J18, J34,
  J36, J48 and the two home paragraphs) with its two home records, each outcome naming only the change
  its words carry, and rebuilt this topic's pins (`FOLLOW_OK`).
- **Then:** the whole Python suite on the merged tree, 2,358 passed and 1 skipped; the voice harness,
  21. The node suites were not run there (no `node_modules`); no engine file changed in either
  release, and the lead runs every suite on the real merge.

**Paragraphs and lines both releases touch:**

- `agents/design-reviewer.md` line 44, the Teach-board paragraph (`## Material-defect boundary`): the
  reviewer took C08's and C13's stories out; this release names the heading in C11's four-parts
  sentence. One line in the file, so git conflicts; the follow script puts C11 back on main's line.
- `agents/design-reviewer.md`, section 3's check list (`### 3. Thinking, practice and evidence`): the
  reviewer rewrote the `unlocks` line (J18) and the restating-Do repair (J34); this release rewrites
  the launch line (J36: decision 2's words and 13b). J34 and J36 are neighbours, so git takes them as one
  conflicting hunk; the follow script puts J36 back on main's lines.
- `scripts/validate-lesson-design.py`: this release only (the reviewer's RV-E10 row quotes the turn
  message this release rewords).
- `scripts/design-review-packet.py`: the reviewer's three card triggers in `PREFERENCE_REVIEW_ROUTES`;
  this release's `CHILD_FACING_CONTENT_KEYS`, the new `activity_is_child_facing` and its two call
  sites. Different lines; git merges them.
- The pins both move: QC-C08, E11, P01, SC-Q01, TD-L07, L09 and SA-M08 (the section 3 list), TD-L10
  (line 44); and in the reviewer's own pin file, RV-C11, J36, E10, the paragraph pins of C08, C10, C13,
  J18, J34, J48, and its home records for those two paragraphs (HOME-RV-BOUNDARY-07, HOME-RV-METHOD-26).
- The build log (both append an entry) and the closing sections both append to the rhythm, quick
  checks, success criteria, worksheets, reviewer and voice ledgers (and, through the reviewer's
  `rv_10`, the two topic 7 ledgers).
- No test file both touch: the reviewer appends to `test_design_review_packet.py`; this release's view
  tests are in a new file for that reason.

## The files touched

- **Plugin, changed:** `agents/design-reviewer.md`, `agents/lesson-designer.md`,
  `references/build-review-log.md`, `do-beats.md`, `evidence-synthesis.md`, `explanation-tasks.md`,
  `lesson-designer-components.md`, `modelling-formats.md`, `preferences.md`, `subject-maths.md`,
  `teacher-voice.md`, the five `teaching-sequence-*.md`; `scripts/validate-lesson-design.py`,
  `scripts/design-review-packet.py`; tests `test_do_beats_look_like_the_subject.py`,
  `test_the_board_carries_the_route.py`, `test_the_board_teaches_and_the_criteria_are_runnable.py`,
  `test_the_lesson_is_written_as_a_lesson.py`, `test_the_leisure_lesson_repairs.py`; pins
  `quick_checks`, `starters_sticky_apply`, `subject_files`, `success_criteria`, `teach_then_do`,
  `worksheets` (`scripts/tests/*_ledger_pins.json`).
- **Plugin, new:** `scripts/tests/routes_ledger_pins.json`, `test_routes_ledger_is_kept.py`,
  `test_a_good_explanation_is_seen_first_in_every_route.py`,
  `test_the_class_view_reads_every_explanation_the_board_shows.py`.
- **Plans, changed:** closing sections on the routes, rhythm, quick checks, success criteria, starters,
  subject files, worksheets, reviewer, rest-of-preferences and voice ledgers;
  `streamline-tools/ledger_mapping.py` (the end-of-file fix).
- **Plans, new:** `plans/2026-09-26-routes-mapping.md`, `plans/streamline-tools/rt-change/`, this report,
  `rt-before-summary.txt`, `rt-after-summary.txt`, `rt-r1-summary.txt` (and, ignored by git, the
  `rt-*.log` files, `rt-before-designs.json`, `rt-after-designs.json`, and `scratch/rt/`: the clean copy,
  the designs probe, the cards and views, the undo run, the replay and the trial merge).

## Left for 7B or release 4

- **7B (words only, not built yet, now parked):** its B10 writes decision 2's words into the
  designer's two launch pointers and the case-first line from PF settled item 2 (the reviewer's line has
  them now; 13b is already in all three in the same words, so B10 adds around it). B6 takes "You can
  pass" out of the content route (now under `How this teacher explains`: E59, E63) and the task route
  (F06, and L19's example). B9's 18-point floor reaches the content route's "the words are never shrunk
  or clipped to fit" (now under the new heading). B17 takes T03's date out of the launch home, beside
  13b. The preferences ledger's closing section lists the rows whose quoted lines this release changed.
- **Release 4 (one copy of each rule):** every fold in section 5, unchanged in scope. The launch fields
  are still written twice (content `The launch` and the task route's block, E70 to E77 and F33 to F40),
  so a task lesson reads them twice (about 3 KB) until then; E70 and F34 now say the same cases and the
  same limit, ready to fold. E48's dated story (three science boards, 22 September 2026) sits in a moved
  paragraph; no decision named it; it is already in the log.
- **Found in passing, not changed:** a discovery Use the learning's `activity` and a bounded attempt's
  `activity` are words children are given, and the review view still leaves them out (the plan's own
  note); the reviewer's C10 pointer still says "`explanation`, part 3"; a Do the task whose written
  explanation carries neither `reasoningWords` nor `rehearsal` (an older class whose connecting words
  have been faded) is not checked by the program, only by the reviewer's launch line; and an earlier Do
  or Your Turn whose model answer is revealed counts as the good one whatever it asked (question 2's
  "the kind of thing children then write" was put to him about My Turns and Our Turns only).

## Anything he should know, in plain words

- **Untried on a real run.**
- **Maths lessons that end on "explain" now need a good example first.** Six of his saved maths lessons,
  and one designed today (Roman numerals to L), end on a question like "Is Amira right? Explain" without
  ever showing what a good explanation looks like. They would now be sent back to add one, as he asked.
  The fix is one slide: a good answer beside a weak one before the question.
- **A criteria panel counts as the good example only when it is one.** His 13b ("criteria that already
  show a good paragraph skip a second model") now says an actual good one, never a list of what a good
  one has. The computer cannot see a good paragraph in a criteria panel, so it keeps asking for the good
  example itself; the history comparison lesson whose panel only listed what a good comparison has needs
  its good example, like the others.
- **His way of explaining is written once, for every kind of lesson.** Maths, task, discovery and
  discussion lessons now read it when they explain something. It is written as how he usually explains,
  not a rule for every slide. They read about 12 KB more to get it.
- **Four corners is gone.** Moving about happens only when he asks, or when the moving is the learning
  itself (standing to make a quarter turn).
- **Install between lessons.** A lesson already running when this lands is checked again at the
  picture step and at review, and could be sent back for the new rule.
- **Not updated by me:** `plans/streamline-plan.md` (outside my files). Nothing committed.
