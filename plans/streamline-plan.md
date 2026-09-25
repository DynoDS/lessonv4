# The lesson-v4 streamline: the plan every chat reads first

This is the living plan for making lesson-v4's instructions smaller and more
focused without losing anything Daniel asked for. Read it whole before doing
anything on the streamline, follow it, and update the "Where each topic
stands" table and the "What the rounds have taught" list before you finish.
It replaces `2026-09-22-streamline-brief.md`, which is kept as the original
brief. Keep this file to what applies to every topic; each topic's detail
belongs in its own ledger.

## What Daniel is trying to achieve

In his words: "I want it optimized so it makes the files smaller. It makes the
reading less. It makes it more focused. But without dropping things, without
removing some random feature that I like... Every rule's there for a reason.
How do we streamline them? How do we get the agents to think exactly like I'm
thinking?" He wants the instructions to read like something the best prompt
engineers would write, so the agents plan a lesson the way he does.

Success is two things at once, and neither alone counts:

- **Less to read, more focused.** Each rule lives once, in the place its
  decision is made, with its reason in a clause and its limit beside it.
  Guidance only some lessons need is read only by those lessons. Nothing in a
  runtime file is there for a maintainer rather than the agent doing the work.
- **Nothing he wanted is lost.** Every rule exists because a real lesson went
  wrong without it. Past tidy-ups rewrote rules, reported that nothing had
  changed, and dropped things, including his own history lesson sketch. A
  shorter file that loses a rule is a failure however clean it reads.

The point underneath both: lessons a newly qualified teacher could pick up and
teach from. The Year 4 History leisure lesson that one could not teach from is
the benchmark failure.

### Where "shorter" comes from, when nothing is lost

A rule is only ever lost if its meaning goes. The words that can go are the
ones that carry no meaning of their own: the second, third and ninth copies of
a rule (the assumed-knowledge rule was written nine times), dated stories
where a reason in a clause does the work, text written for maintainers, and
text that no longer matches the code. The other saving is in reading rather
than bytes: guidance moved to where only the lessons that need it read it.
Expect modest byte savings where a "copy" turns out to carry its own condition
(vocabulary went from about 20 KB to 18 KB for that reason) and larger savings
where copies are true repeats. One copy instead of several that disagree is a
gain even when the bytes barely move.

## Rules for every topic

- **When unsure whether something matters, it stays, and you ask Daniel.**
- **He decides every disagreement and every change in meaning.** A rule you
  think is wrong is a question for him, never a fix inside the restructure.
- **Ask every decision in one message**, numbered, each with what it says now,
  what you think, what you suggest and one question, "yes" meaning take the
  suggestion. He asked for this so context is not lost across many messages.
  Record his answers word for word in the topic's ledger before changing
  anything.
- **Move before you reword.** Keep a rule's words where you can. A fold carries
  every condition, example and exception either copy held, and keeps each
  rule's strength: "must not" stays "must not". A pointer that summarises a
  rule keeps its alternatives and exceptions, because the pointer is read
  first.
- **Stories leave; reasons stay.** In his words: "we can still teach the lesson
  designer the whys without telling it exactly what happened in a specific
  lesson. And I feel like if something has to tell it what happened in a
  specific lesson, then the rule's not really fixed at all." A dated incident
  goes to `plugins/lesson-v4/references/build-review-log.md` (copy it there
  first if it is missing); a case that makes a rule clear may stay only as a
  plain example; his own rulings keep his words without their dates.
- **His calibrating examples stay exactly as they are:** the Victorian
  schooling sketch in `subject-history.md`, the Tudor Teach slides he chose,
  Pride Lessons, and his quoted rulings. They are how the agents learn his
  taste.
- **Names the code or tests read** (fields, markers, commands, headings named
  by `read-reference.py`, the review routing card or a test) change only with
  that code and its tests, in the same release.
- **Leave alone without asking:** the effort settings in the role files, and
  the teaching behaviour itself.
- **One topic per release**, its own version, its own build-log entry, so any
  loss can be found by its commit. Nothing is committed or pushed until he
  says so.
- **Talk to him** as his CLAUDE.md says: plain English, short chunks, no file
  or code names, no em dashes anywhere, including in plugin text you write.

## The method, one topic at a time

1. **Inventory, editing nothing.** One row per place the topic is written, in
   the columns of `2026-09-22-vocabulary-ledger.md`: the rule's own words in
   «guillemets», when it applies and its exceptions, strength (must, default,
   may, check, mechanics), names the code depends on, file › section · line,
   kind, and a proposed home. Read the code and tests too. Give the topic its
   own ID prefix and run `streamline-tools/check-ledger-quotes.py` until every
   quote is found word for word.
2. **A fresh agent checks the inventory** for missed rules (they often avoid
   the topic's obvious words), "duplicates" that carry an extra condition,
   wrong strengths and unraised disagreements. Verify each finding before
   adding it.
3. **Show Daniel; all decisions in one message;** record his answers.
4. **Baseline:** `streamline-tools/run-all-suites.sh before`, and
   `streamline-tools/validate-saved-designs.py` over the saved designs.
5. **Change,** moving before rewording, under the rules above.
6. **Map and pin:** a mapping like `2026-09-22-vocabulary-mapping.md`, every
   changed row's new home checked by script (the example is
   `streamline-tools/vocabulary-example/build_mapping.py`); pins like
   `scripts/tests/vocabulary_ledger_pins.json`: each row in its section, whole
   paragraphs for changed rows, the topic's home in exact paragraph order,
   retired phrases barred everywhere, and the pins compared with the ledger.
7. **Two independent checks.** A fresh agent compares old and new row by row
   against the ledger and his decisions and attacks the pins on a scratch
   copy; after the repairs, a second fresh agent re-tests them. You do not mark
   your own work.
8. **Prove it:** all suites green, saved designs compared with every new
   refusal explained, a true build-log entry, both `plugin.json` files bumped.
   Then report to him and ask how he wants the before-and-after lessons run.

## Pace and order from 25 September

Asked how long was left after two days, he agreed ("y") to finish sooner this way:

- **Two independent checks per release**, as the method says, plus one small extra
  check only when a release changes engine code. The last two releases ran four and
  six; later rounds found ever smaller things.
- **Behaviour changes first, tidying last.** In order: worksheets (4.2.290); topic 7's
  7A (starters, sticky knowledge, the Apply, the Lesson 2 plan, slide titles, the wall's
  wording) and 7C (colours); topic 8's reviewer, routes-decisions, subject-files, and
  voice-with-humour releases; the playbook's 10A, 10B (run faults) and 10C (the wall
  and stick-ins ship flagged, after every repair). Pure folds wait: 7B, topic 8's
  routes folds, topic 9, and his own-release items (pictures on printed sort cards,
  text that grows to fill its box).
- **A real lesson is the finish line.** After those releases, one before-and-after
  lesson in Codex (his to start; installing a version switches all his Codex runs, so
  ask first). Then he decides whether the tidy-ups are worth their time.
- **One release at a time.** Offered a pipeline (the next release built on a copy while
  the last is checked, about a third quicker, but no escape from the usage limit), he
  said "its fine, you said it wont make it faster".
- **Then two side branches (25 September).** Asked whether releases could run on
  separate branches and merge afterwards, he agreed ("yes") to side branches for the
  two releases that barely overlap the others: 7C colours (branch
  `streamline/7c-colours`, worktree `C:/Users/Daniel/Projects/lessonv4-colours`) and
  topic 8's subject files (branch `streamline/8-subject-files`, worktree
  `C:/Users/Daniel/Projects/lessonv4-subjects`), both from `2db3ceba`. Brief:
  `streamline-tools/side-branch-brief.md`. Each worktree's `node_modules` folders are
  junctions to the main checkout's: before any `git worktree remove`, remove those
  junctions first (`rmdir`, not delete-recursive), or the main checkout loses its
  libraries. Versions and build-log order are set at merge; after each merge, every
  suite runs on the combined plugin and a short combined check reads the merge.
  `ledger_mapping.py` and `run-all-suites.sh` now work on the copy they sit in.
- **Merge notes, collected as the side branches report:** colours overlaps the
  worksheets release in `preferences.md`, `maths.md`, the build log and the SC pin file
  (different rows; if the pin file conflicts, rerun its `k8_repin_other_topics.py`, then
  `build_colours_mapping.py`); 7A and 7B must take the 31 colour rows from
  `COLOURS_ROWS` in `build_colours_mapping.py`. Subject files conflicts with worksheets
  only in the build log (keep both entries, worksheets first), then run its
  `sj-change/sj_09_follow_at_merge.py` (moves WS-G09 and its home); its copy of the
  subject-files ledger is byte-identical to main's untracked one (commit main's first,
  or drop the copy); record PB-V20 and PB-B21 in the playbook ledger; and Codex must be
  refreshed before the removed skill command leaves it. Two dated stories stay in the
  maths file (17 and 12 September) because no decision named them; they leave with the
  tidy-ups.

## Where each topic stands

| # | Topic | State | Notes |
|---|---|---|---|
| 1 | Vocabulary | Done, 4.2.284, `3de9c956`, pushed 23 Sept | Before-and-after lessons: the leisure lesson rerun on 4.2.286 covers topics 1, 3 and 4 together. |
| 2 | What children are assumed to already know | Done, 4.2.287, `79426973`, committed 23 Sept (not pushed): two independent checks, all repairs made, his picture rulings (rounds 3 to 5 of decision 7) in; all suites green | Change plan, mapping, both check reports and the scripts (`streamline-tools/ak-change/`) are in `plans/`. The before-and-after lessons are not run: the leisure rerun on 4.2.286 is the before; a rerun on 4.2.287 after release is the after. His caption idea is one sentence of option in the slide rules ("just a small suggestion that could happen sometimes"). |
| 3 | The Teach then Do rhythm | Done, 4.2.285, `e167ff77`, pushed 23 Sept | His open questions answered 23 Sept (ledger). |
| 4 | Quick checks | Done, 4.2.286, `bf658468`, pushed 23 Sept | His open questions answered 23 Sept (ledger). Codex installed 4.2.286 the same day; the old leisure deck and working folder are backed up in `C:\Users\Daniel\Projects\lessonv4-backups\2026-09-22 leisure lesson (4.2.276)`. |
| 5 | Success criteria | Done, 4.2.288, `baabb1b3`, committed 24 Sept at his word (not pushed; Codex still on 4.2.286): 16 decisions, four independent checks all repaired (reports in `streamline-tools/success-criteria-*-check.md`), all suites green, saved designs unchanged. Not run live. Then the long-list fit release, 4.2.289, `2db3ceba`, committed 25 Sept at his word (not pushed): measuring fixes, the practice box widening only as far as 18pt needs, the lesson check's length catch, and his 24 Sept rulings (a list truly too long is marked and drawn down to 16pt on a finished, flagged slide; the deck is always written); six independent checks (`streamline-tools/fit-release-*check.md`) | Includes his decision 16: every taught word green in criteria; the one-or-two limit is for the other marks. |
| 6 | Worksheets | List built 23 Sept on the 4.2.288 working tree (`2026-09-23-worksheets-ledger.md`, 393 rows, 13 decisions); independent list check done (report `streamline-tools/worksheets-inventory-check.md`) and folded in: 478 rows; his in-class ruling recorded; all decisions answered 24 Sept morning (his words in the ledger): board practice and sheet never share questions, a sheet a child could not use goes back to be redesigned, 9, 10, 13 yes, the fifteen settled items confirmed ("y"). Change plan `2026-09-24-worksheets-change-plan.md`; built as 4.2.290 on 25 Sept, uncommitted (report `streamline-tools/ws-release-report.md`, scripts `streamline-tools/ws-change/`; 67 changed rows mapped, 13 earlier-topic pins moved in place by `w9`); three independent checks (`ws-release-check.md`, `-second-check.md`, `-third-check.md`), each round's findings repaired; his "yes" of 25 Sept (the Expected sheet stands in for a sheet sent back that still cannot be made) built, the lead widening it to any Below or Greater Depth sheet the build cannot make, marked as the lead's. Words the playbook release (10A) must write are listed in the report's last section. The success-criteria record builder is frozen after 4.2.289 so a rerun cannot undo those moves | Full copies in the designer's file and `preferences.md`. |
| 7 | Starters, sticky knowledge, the Apply slide and the rest of `preferences.md` | Two lists built and checked 23 to 24 Sept (see `streamline-tools/overnight-run-2026-09-23.md`): starters, sticky knowledge and Apply (`2026-09-23-starters-sticky-apply-ledger.md`, 390 rows; all answered 24 Sept, his words in the ledger: the test-question starter goes as if it never existed, no fixed place for a sticky fact); the rest of preferences (`2026-09-23-preferences-rest-ledger.md`, 1,779 rows). All decisions on both lists answered 24 Sept, his words in the ledgers (turned round: drawings allowed on serious lessons and may be large; worked examples purple; the Lesson 2 plan goes; "You can pass" examples out) | The preferences list was thin after a usage limit; its check added 649 rows. |
| 8 | The design reviewer, subject files, teacher voice guide | Four lists built and checked 23 to 24 Sept: reviewer (428 rows; all answered 24 Sept, his words in the ledger), routes and pedagogy references (592; all answered 24 Sept), subject files (490; all answered 24 Sept: the make-subject-file skill and its guide removed, food rules replaced by a pointer to the NHS Eatwell Guide in PSHE and science), voice guide (470; all answered 24 Sept: humour allowed everywhere and the reason it never reaches slides to be found and fixed; named invented classes, livelier names). All four topic-8 lists answered | Voice: "keep precise subject vocabulary" is written about fifteen times. |
| 9 | Slide, worksheet, wall and adaptation designers | Waiting: listed after topic 8 changes, since 6 to 8 move text out of these files | Carried from topic 8 (24 Sept): speaker pictures may be made smaller wherever a slide needs the room. Parked from vocabulary: the wall's two-sheet arithmetic (decision 14), retire word-grid chip cards (15), split a vocabulary slide whose pictures do not fit (17), one list of when a definition may run to two sentences (18). |
| 10 | The make-lesson playbook | List built and checked 24 Sept (`2026-09-23-playbook-ledger.md`, 452 rows); all answered 24 Sept (his words in the ledger): full designer for a repair needing new words, the template editor asks before pushing, no watching line, log for engine faults only, wall and stick-ins ship flagged, feedback edits in place, four run faults as their own release | At its byte cap, blocking Part D of `2026-09-22-six-run-mechanical-repairs.md`. |

## What the rounds have taught

- From the success-criteria and fit releases (4.2.288, 4.2.289), ten checks in all:
  grep for the concept, not only the retired phrase, across routes, contracts,
  focused repairs, templates and programs; read the paragraph either side of every
  edit; read the file that defines every channel a new mechanism uses and the file
  of every agent that receives it; every refusal the build makes must also fire in
  the preflight, before layout, on every sheet or slide shape; test the neighbouring
  inputs (other refusals, the false case, two of them), not only the case in hand;
  assert whole messages and pin whole paragraphs with their section; undo each repair
  yourself and see a test fail; every "never", "every" or "only" in a log gets a
  test or is softened; regenerate every figure last, with line endings normalised;
  and tell him every consequence (a blank page, a run with no deck) before release.
- Match nothing by free text when a field will do: the fit release's word-matched
  flag took three rounds to tame and was replaced by a plain mark on the list.
- `ledger_mapping.py` writes to the repository's own paths; a checker's edit to point
  it at scratch failed silently and it rewrote the real pin file (identical by luck).
  Give it the root as an argument and print the path before writing, before the next
  topic's checks.
- Every finished topic's record builder is frozen (25 Sept): later releases move its
  pins in place with a repin script, and a rerun would undo them. Each refuses to run
  without `--i-know-it-is-frozen`; a new release that moves an earlier topic's pins
  writes its own repin script, as `ws-change/w9_repin_other_topics.py` does.

- The first inventory missed about one rule in ten; the independent check is
  not optional.
- Folds soften rules quietly: a "must not" becomes a description, "elsewhere"
  narrows to one place, a summary pointer drops an exception. Compare
  strengths, not only words.
- Repairs cause new faults (vocabulary's matcher lost "valleys" while being
  fixed); re-test the repairs with a second fresh agent.
- Tests already pin some duplicate copies; folding a copy means moving its
  test in the same release.
- The saving is honest only when measured: count bytes before and after, and
  report it plainly even when it is small.
- Practical: plugin files use Windows line endings (Python's text mode keeps
  them); in the Bash tool, long heredocs with quote marks often fail, so write
  patch scripts to files, and make every scripted replacement assert its old
  text appears exactly once.
- A pin names its section by heading, so a whole section moved (below the
  line the reviewer stops reading at, say) carries its pins with it and they
  still pass. `ledger_mapping.py` now records which route pins sit above that
  line and `ledger_pin_checks.py` fails if one moves below it. Pin whole the
  paragraphs a new rule points at, or their conditions can thin unseen.
- A decision can promise something the system cannot do (the scene "on a slide
  of its own when that makes sense", when only the Slide Designer splits, and
  only for fit). Check the mechanism exists before writing the promise.
- Folding a clipped copy into full prose, and writing in his new decisions,
  can make the files longer. Say so plainly; the gain is one copy, not bytes.
- The reusable tools for a topic's change are `streamline-tools/ledger_mapping.py`
  (build the mapping and pins from a hand-written list of changed rows) and
  `scripts/tests/ledger_pin_checks.py` (the checks); `td-change/` is the worked
  example.
- A pointer that paraphrases a rule tends to carry the half that permits and
  drop the half that limits. Point without paraphrasing, or carry both halves.
- Never write in a permission or example the proposal did not contain, even
  one that looks like the honest completion of a decision; it goes to him.
- Attack the pins on a complete copy of the plugin, and run the tests on the
  untouched copy first: a copy missing a folder fails every attack for that
  reason alone and reports them all as caught.
- In the Bash tool, `
` inside a heredoc-fed Python string can arrive as a
  real newline and break the file it writes; use the Write tool for scripts.
- Before-and-after lessons run in Codex, which loads the plugin from this
  project folder: installing a new version (`codex plugin add
  lesson-v4@lessonv4`) switches all his Codex lessons to it, and a rerun
  overwrites the delivered deck on his drive, so copy it first and ask him.
