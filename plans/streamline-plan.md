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

## Where each topic stands

| # | Topic | State | Notes |
|---|---|---|---|
| 1 | Vocabulary | Done, 4.2.284, committed as `3de9c956`, not pushed | Before-and-after lessons not yet run. Ledger, mapping and the three check reports are the worked example. |
| 2 | What children are assumed to already know | List built and checked (283 rows, `2026-09-22-assumed-knowledge-ledger.md`); he answered on 23 Sept (recorded in the ledger); decision 8 re-asked, 1 and 2 read back to him | The leisure lesson's biggest fault. Shares ground with vocabulary; decision 3 would change a vocabulary-pinned sentence. |
| 3 | The Teach then Do rhythm | Changed as 4.2.285, uncommitted (`2026-09-23-teach-then-do-change-plan.md`, mapping `2026-09-23-teach-then-do-mapping.md`, pins `teach_then_do_ledger_pins.json`); all suites green; both checks done and repaired (`streamline-tools/teach-then-do-change-check.md`, `teach-then-do-repair-check.md`); three open questions for Daniel are listed in the ledger above its decisions | Size went up about 4.4 KB (his new decisions); designer's own file down 2.2 KB. Quick checks (4.2.286) follow once this is checked. |
| 4 | Quick checks | Changed as 4.2.286 on top of 4.2.285, uncommitted (scripts in `streamline-tools/qc-change/`, mapping `2026-09-23-quick-checks-mapping.md`, pins `quick_checks_ledger_pins.json`); all suites green; first change check done and repaired (`streamline-tools/quick-checks-change-check.md`); second check done and repaired (`quick-checks-repair-check.md`); three open questions for Daniel in the ledger above its decisions | The 4.2.285 state is saved as `git stash` entry `td-4.2.285 snapshot` plus `streamline-tools/td-4.2.285-snapshot.tar`, so the two can be committed separately. Instruction files +6.3 KB, packet code +6.4 KB. |
| 5 | Success criteria | Waiting | Includes his decision 16: every taught word green in criteria; the one-or-two limit is for the other marks. |
| 6 | Worksheets | Waiting | Full copies in the designer's file and `preferences.md`. |
| 7 | Starters, sticky knowledge, the Apply slide and the rest of `preferences.md` | Waiting | |
| 8 | The design reviewer, subject files, teacher voice guide | Waiting | Voice: "keep precise subject vocabulary" is written about fifteen times. |
| 9 | Slide, worksheet, wall and adaptation designers | Waiting | Parked from vocabulary: the wall's two-sheet arithmetic (decision 14), retire word-grid chip cards (15), split a vocabulary slide whose pictures do not fit (17), one list of when a definition may run to two sentences (18). |
| 10 | The make-lesson playbook | Waiting | At its byte cap, blocking Part D of `2026-09-22-six-run-mechanical-repairs.md`. |

## What the rounds have taught

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
