# Third check of the long-criteria fit release (4.2.289): the last round of repairs

Checked on 24 September 2026 by a third fresh reader, against the second check
(`fit-release-second-check.md`), the builder's account of its repairs
(`fit-release-report.md`, "The second check, and what was repaired"), the
success-criteria ledger's decisions and the fit investigation's "Decisions
taken". Nothing in the repository was changed except this file. All working
files are in `plans/streamline-tools/scratch/fitchk3/`.

## What I did

- Diffed the second checker's copy of the plugin (`scratch/fitchk2/now/`)
  against today's plugin: the last round touched six files (the validator,
  `templates.md`, the build log, the success-criteria pins, the Python fit test
  and the builder widening test), plus the mapping builder and the mapping in
  `plans/`. I read every changed line.
- Point 4 end to end, in a scratch copy of the plugin (`e2e.py`, results in
  `e2e/`): a design with an eight-step list no named panel holds, checked by the
  real validator with no flag, with the flag the refusal asks for, and with
  eight near misses; that list copied onto the full-list practice slides of a
  saved deck that builds cleanly today (`week3-monday-round-to-100`); the slide
  designer's own check run on it; the deck built with the run's own command
  (`run-fixed-resource.py slides`); one slide moved to the half-width split as
  the widest refusal advises; the deck rendered with LibreOffice and looked at.
- Prepared the design review packet over a design carrying the flagged list
  (`review_view.py`) to see what the reviewer is shown.
- Read what defines and consumes `flagsForTeacher`: the lesson designer, its
  focused repair, the design reviewer and its focused repair, the output
  template, the scaffold, the review and wall packets, the playbook's Phase 1
  hand-back and final report, the slide designer's repair budget.
- Counted how many slides of each saved deck carry the same criteria list
  (`list_reach.py`).
- Measured the bottom strips (`strips.js`) and recounted sizes (`sizes.py`) and
  dashes (`dashes.py`).
- Compared HEAD's lesson check and today's over every saved `lesson-design.json`
  (`designs.py`) and measured every saved steps list (`lists.py`).
- Rebuilt the success-criteria pins with a copy of the mapping builder pointed
  only at a scratch copy, then attacked the new pin and the new tests: 25
  changes, each made alone in one of five scratch copies of the whole plugin
  with the ledgers from `plans/` beside it, then the whole builder suite and
  the whole Python suite (`mutate.py`, results in `mutations/`). Before that,
  the pin tests and both suites on an untouched copy.
- Ran the four suites in the plugin folder.

## Findings, most serious first

### 1. The way out says it costs one slide; it blanks every slide that shows the list

The refusal tells the designer what flagging costs:

> "the check then lets it through, and its slide is built flagged for the teacher to check, so the deck is still made."

The build log says "A list flagged that way passes the check, its slide is
refused at the widest panel, and the deck is delivered with that slide flagged
for the teacher to check", the report says the same, and the builder test is
named "a list no width holds costs only its own slide".

What happens: every slide that shows the list is refused, and a refused slide
is not "built flagged". It is replaced by a page that carries only its title
and this:

> "Check this slide before teaching. What it needs to show would not fit, so it has not been drawn. Its script is in the notes, and the run report says what did not fit."

In my end-to-end build the flagged list sat where the saved deck's full list
sits, and the delivered deck (`ok: true`, `FIXED_RESOURCE_FLAGGED slides: 9, 11,
13, 17, 19, 23`) has six of its 29 slides blank: every My Turn and Our Turn
slide of the lesson's method, question, working space and criteria all gone
(`e2e/render/p9.png`). That is normal, not an extreme: a lesson's criteria list
is on every practice slide of its method. Across the 50 distinct saved decks
with a list of three or more steps, the most-used list is on a median of 3
slides and up to 11 (`friday-round-to-10-reteach`, 11 of 27), and on 4 or more
slides in 23 decks.

Decision 11 is kept to the letter: a deck is written. But this matters twice.
The designer is choosing between tightening and flagging on a cost it is told
is one flagged slide, which makes the flag look cheap (finding 2). And the
teacher is told "the deck is still made" when the part of the lesson the
criteria exist for may reach him as blank pages.

Fix: say the true cost where the choice is made and where he reads it. In the
refusal, for example: "every slide that shows it is delivered as a page telling
the teacher to check it, with nothing drawn on it, so tighten it if any word can
go". The same in the build log, the report and the builder test's name.

### 2. Only the refusal's own words stand between the flag and skipping the tightening

The validator cannot see whether a list was tightened, as the report says
honestly. What else discourages a designer from writing the flag the first time
it sees the refusal:

- **The refusal's order and bar.** "Tighten ... first", then "Only if you have
  tightened it and no step can lose a word without losing what it tells a stuck
  child to do". That is good wording, and the tests hold both it and the order.
  But the cost it quotes is the understated one in finding 1.
- **The files that define the flag channel say something else, and were not
  touched.** `output-template.md`: "Put a concise string here only for:" five
  kinds (an unmet requirement, a gap in the brief, a subject clash, a continuity
  limitation, a teacher-owned judgement), and "Do not put a fault here when the
  lesson-designer can simply fix it." `lesson-designer.md`: "Three things
  belong: ...". None names this sixth kind. The report says "The designer and
  its focused repair read the refusal's lines, so the way out reaches them
  without new playbook words", which is true, but a designer now reads one rule
  in its own contract and another in the refusal. Nobody named this change to
  the channel's contract: a teacher-facing free-text list is now also a switch
  a program reads by its first words.
- **The reviewer sees it but is asked nothing about it.** The review view shows
  the criteria at line 169 with the ordinary cue ("Review cue (not a failure):
  8 steps: keep necessary actions; check the complete panel fits.") and the flag
  as the last thing in its 396 lines, under "## Existing flags for the teacher".
  Nothing tells the reviewer that the lesson check found the list fits no named
  panel, or asks it whether a word could go. The reviewer is the only second
  pair of eyes before the slides.

Fix, smallest first: finding 1's honest cost (the strongest discouragement
there is); one line in `output-template.md`'s list naming this flag and when it
is allowed; his call whether the reviewer's criteria check gains a clause for a
list flagged too long (the reviewer's file is topic 8's, whose decisions he has
answered).

### 3. The flag must match to the character, and a near miss ends the run with no deck

The check lets a list through only when a flag starts with exactly
`sc-001 is too long for the criteria panels:`. In scratch (`e2e/report.txt`):

| Flag written | Result |
|---|---|
| the words the refusal asks for | passes |
| the prefix alone, saying nothing why | passes |
| the whole prefix in backticks, as the refusal prints it | refused |
| the id in backticks | refused |
| a leading space | refused |
| `SC-001` | refused |
| "criteria panel", singular | refused |
| plain English naming the list | refused |

Each refusal is the same message word for word, with no sign the check saw a
flag that nearly matched. The designer has three repair passes; one that keeps
copying the backticks ends `LESSON_DESIGN_CHECK_FAILED`, and if the focused
repair and the fresh attempt do the same, the run ends `BLOCKED` with no deck,
which is the outcome this repair exists to prevent. The backtick case is the likeliest: the
refusal prints the words inside backticks. Also, "and says why" is not held: a
flag of the prefix alone passes.

Fix: match forgivingly (ignore backticks, quote marks, surrounding space and
case), or, when a flag mentions the id but does not begin with the words, say
so in the refusal.

### 4. The flag reaches him with an internal id, and can outlive the problem

- The playbook says "Carry every `flagsForTeacher` entry into the final
  report." So he will read "sc-001 is too long for the criteria panels: ...".
  Every flag written in the 85 distinct saved designs is plain English written
  to him; none carries an id, and he has no way to tell which list `sc-001` is.
  Keying the match on the id at the start of the line is what forces it there.
  A match on the id anywhere in the line, or on the list's first words, would
  let the flag read "The rounding steps (`Make the tens and ones 0 ...`) are too
  long for the board's criteria box: ...".
- A flag on a list that fits passes silently (`LESSON_DESIGN_OK` in scratch).
  A designer that flags and then tightens enough in the same pass, or a
  reviewer whose correction shortens the list, leaves a flag telling him
  something untrue; the reviewer may not remove it ("Never reword planning
  metadata - ... `flagsForTeacher`"). Refusing such a flag would cure it, but
  it would also send a reviewer's shortening back through the reviewer's
  focused repair, which returns "NOT A REVIEW CORRECTION" for a field it did not
  correct and so opens the fresh-attempt route. So the cure is his call: a
  reviewer allowed to remove a too-long flag once the list fits, or a
  validator note that does not refuse.

### 5. The slide guidance and the widest refusal do not know a flagged list is coming

`slide-success-criteria.md` (pinned as SC-K06 and SC-DEC-11-FIT) still says a
list neither shape holds "is caught by the lesson check before any slides are
made, and the lesson designer tightens it; one that still reaches a slide (a
sticky line or a helper beside a step can take the last of the room) is
delivered flagged". A flagged list now reaches the slide designer too, and the
widest refusal then tells it the half-width split "is a little taller and can
hold what this panel cannot", which the lesson check has already measured and
found false for that list. The slide designer spends its three repair passes,
the orchestrator a focused repair round, and then the deck ships as in finding
1. It costs time, not the deck (my build shows the delivery works), and the
guidance's last clause ("delivered flagged for the teacher to check, never cut
to fit") still covers it. Low; his call, since the sentence is pinned.

### 6. Smaller

- **Two gaps in the new test.** It holds one list only. Naming only the first
  list's flag in a two-list refusal, and letting a flag for one list pass every
  list, each pass every suite (changes V8 and V9 below). The second would let an
  unflagged too-long list reach the slides with no flag for him; the build still
  flags its slides.
- **A pin limit, not this release's.** A new paragraph added after the pinned
  `templates.md` paragraph that undoes it ("For a Your Turn slide, set
  `panelWidth` to 6.35 yourself") passes every suite. Whole-paragraph pins hold
  a paragraph, not what is written next to it.
- **One slide counted twice over.** The build log's "1,047 are identical ... 65
  are refused under both" differs by one from the second check's 1,048 and 64.
  The slide is `output/trial-2026-09-05/transfer-discovery` slide 10, refused
  in the builder's harness only because that harness prepared no parachute
  figure ("no prepared image exists for parachute-forces ..."); a real build
  draws it the same under both. Nothing turns on it.
- **Held over from before this round.** "nobody after you may reword a
  criterion" is said to the lesson designer, and the design reviewer, who comes
  after it, may correct a criterion's words. Not new here; noted only because
  the way out is now read by both.

## Point 4, question by question

- **The least invasive faithful way?** On balance yes. It is stateless, needs
  no playbook words (the playbook is at its byte cap), and keeps "tighten first"
  as the ordinary path. The alternatives the report weighed (a playbook step, a
  validator that remembers, a warning that never refuses) are each bigger or
  weaker. It is faithful to decision 11 in his words ("There is not a time where
  I want the PowerPoint slide deck to never be produced because of an error"),
  and at the edge it chooses that decision over the fit decision he also agreed
  ("so the lesson designer tightens it and the half-slide limit stays
  unbroken"). That choice is right by decision 11's wording, but he has not
  been told that the deck it saves can arrive with its practice slides blank
  (finding 1).
- **Can the flag be misused?** Yes: it can be written on first sight of the
  refusal, and only the refusal's words discourage it (finding 2).
- **Does a flagged list reach a built deck, flagged?** Yes. The flagged design
  gives `LESSON_DESIGN_OK`; the slide check fails with the widest refusal on
  each slide (`SLIDE_DESIGN_CHECK_FAILED`), as it should; the run's build
  command writes the deck with `ok: true` and those slides named. The half-width
  split refuses it too, with the older "a wider or taller `sc-panel`
  composition" words. The slides are placeholders, not drawn slides with a flag
  (finding 1).
- **Contract, scaffold, review page, tests?** The field's type is unchanged
  (a list of strings) and the scaffold is untouched. What changed unnamed: the
  channel's documented contract (finding 2), the id reaching his report and
  stale flags (finding 4). The review page shows the flag with nothing beside
  the list. No existing test changed except the review-packet copy of the
  letter-width file, which the check needs.
- **Does the reviewer see it?** Yes, as the last section of the view; it is
  asked nothing about it (finding 2).
- **Within the success-criteria decisions?** Yes. It never offers fewer
  criteria ("keep the words"); it tells nobody downstream to reword or drop
  one ("nobody after you may reword a criterion"); and the deck is never held
  back. Its only untrue words are the cost (finding 1).

## Points 1, 2, 3 and 5

- **Point 1, done.** SC-FIT-289-TPL pins the paragraph whole in the
  `maths-turn-sc` section. Taking out "never past half the slide", turning
  "nothing to set" into an instruction, appending a sentence, moving it to the
  end or under the `maths-turn-ref-sc` heading: each fails the pin test.
- **Point 2, done.** The log, the report and the test now say slides 5 and 9 to
  12 are refused at 4.60in by the wall and 7 and 8 at 6.35in by their steps;
  the test holds 7 and 8 to a card of 36 characters or more, and stopping a
  stacked list from widening fails it.
- **Point 3, done and true.** In today's builder the `quad-v` bottom strip and
  the 30% band draw one step of up to 182 characters (two lines) and refuse a
  longer one; the `centre-big-v` strip draws one step of up to 91 characters
  (one line); all three refuse two short steps. The sentences say so, SC-K38
  moved and SC-K12's whole-paragraph pin follows; putting either old sentence
  back, or dropping "never two", fails the pins.
- **Point 5, done.** Letting the zone-fill store or the missing-picture store
  record during the tries fails "no finding store keeps what a try raises";
  letting the picture move above at 4.60in fails "at 4.60in nothing moves".

## Suites, designs, pins, sizes, dashes

- **Suites, in the plugin folder:** Python 2190 passed, 1 skipped, 71,513
  subtests; builder 730; worksheet 722; working wall 142. As the report says.
- **Saved designs:** 144 `lesson-design.json` files (85 distinct) give
  identical output under HEAD's check and today's; none passes under either,
  for older faults. All 74 distinct saved steps lists pass the new measure; the
  most any takes in the half-width side is 9 lines.
- **Pins:** on the untouched copy, the ledger pin tests pass (84 passed, 69,451
  subtests; the ledger was found, nothing skipped). The mapping builder, pointed
  only at the copy, prints `MAPPING_OK 467 pins; 80 changed rows mapped`, and
  its pins and mapping are identical to the working tree's.
- **Sizes, to the byte:** instructions +1,415; programs +21,704 (validator
  +11,243, `maths-turn-sc.js` +4,733, `steps.js` +3,749, the three switch files
  +1,046); tests and pins +109,137 (fixture 55,552); build log +14,881. The
  log's 1.4, 21.7, 11.2, 4.7, 3.7, 1, 109 and 56 KB are right.
- **Dashes:** none added. The three added lines that carry one are the
  changed `centre-big-v` line and its pin and mapping, whose "0.4 to 0.5" range
  was written with an en dash before this release; the fixture's is a saved lesson's own step; the change scripts'
  are in old text they match.
- **The build log's changed sentences** match the files and my runs, except
  "its slide is refused at the widest panel, and the deck is delivered with that
  slide flagged" and "costing only its own slide" (finding 1) and the
  one-slide count (finding 6). "nothing in the playbook changed" is true.

## Tests and pins, attacked

Each change made alone in a scratch copy, then both whole suites. Baseline on
an untouched copy: builder 730 passed, Python 2190 passed, 1 skipped.

| Change | Caught by |
|---|---|
| P1 `templates.md` paragraph: "never past half the slide" out | SC-FIT-289-TPL (word for word, section, whole paragraph) |
| P2 "nothing to set" turned into an instruction | SC-FIT-289-TPL (three ways) |
| P3 paragraph moved to the end of the file | SC-FIT-289-TPL (section) |
| P4 paragraph moved under the `maths-turn-ref-sc` heading | SC-FIT-289-TPL (section) |
| P5 a sentence appended inside the paragraph | SC-FIT-289-TPL (whole paragraph) |
| P6 a paragraph added after it that undoes "nothing to set" | nothing (finding 6) |
| P7, P8 `quad-v` sentence back to "holds no criteria list", or "never two steps" dropped | SC-K38 (three ways) |
| P9, P10 `centre-big-v` sentence back, or "never two" dropped | SC-K12 (three ways) |
| V1 the check ignores the flag | decision-11 test |
| V2 any flag mentioning the id passes | decision-11 test |
| V3 any flag at all passes | decision-11 test |
| V4 the way out offered before "Tighten" | decision-11 test (order) |
| V5 the way out no longer conditional on tightening | decision-11 test |
| V6 "keep the words" dropped | decision-11 test |
| V7 "so the deck is still made" dropped | decision-11 test |
| V8 two lists refused, only the first one's flag named | nothing (finding 6) |
| V9 a flag for one list lets every list through | nothing (finding 6) |
| V10 the check not run at all | decision-11 test, refusal test |
| B1 zone-fill store records during the tries | "no finding store keeps what a try raises" |
| B2 missing-picture store records during the tries | the same |
| B3 the picture moves above at 4.60in too | "at 4.60in nothing moves" |
| B4 a list inside a criteria stack never widens | the fraction-wall test (slides 7 and 8) |
| B5 `--deliver-flagged` ignored | the flagged-deck test and the build's own delivery test |

Every copy was put back after its changes (only `__pycache__` differs).

## What I would still fix

1. Say the true cost of the flag in the refusal, the build log, the report and
   the builder test's name: every slide that shows the list is delivered as a
   page with nothing drawn on it (finding 1). And tell him plainly, since it
   decides what "the deck is still made" means at the edge.
2. Match the flag forgivingly, or say in the refusal when a flag nearly matched
   (finding 3), so a backtick cannot end the run with no deck.
3. Let the flag read as plain English for him: match the id anywhere in the
   line, or the list's first words (finding 4).
4. Add one line to `output-template.md`'s flag list naming this flag (finding
   2); add a two-list case to the decision-11 test (finding 6).
5. His call: a clause for the reviewer on a list flagged too long; what happens
   to a flag once its list fits; the slide guidance's pinned sentence naming a
   flagged list (findings 2, 4 and 5).
