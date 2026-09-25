# Fourth check of the long-criteria fit release (4.2.289): the third check's six repairs

Checked on 24 September 2026 by a fourth fresh reader, against the third check
(`fit-release-third-check.md`), the builder's account ("The third check, and
what was repaired" in `fit-release-report.md`) and its scripts in
`fit-change/`. Nothing in the repository was changed except this file. Every
working file is in `plans/streamline-tools/scratch/fitchk4/`.

## What I did

- Diffed the third checker's copy of the plugin (`scratch/fitchk3/now/`) against
  today's plugin. The last round touched ten files: the validator, the review
  page script, `output-template.md`, `lesson-designer.md`,
  `slide-success-criteria.md`, `steps.js`, the build log, the success-criteria
  pins, the Python fit test and the builder widening test. I read every changed
  line.
- Probed the forgiving flag match with flags written for other reasons, short
  first steps, and lists that open alike, including a real pair from a saved
  design (`probe.py`, `probe_shared.py`, `real_flags.py`, results in the `.txt`
  beside each).
- Built one lesson end to end in a scratch copy of the whole plugin (`e2e.py`,
  results in `e2e/`): an eight-step rounding list refused with no flag and
  passed with a flag written the way the refusal asks; the review page prepared
  over it; the list copied onto every slide of a saved deck that shows its
  list (`friday-round-to-10-reteach`, 27 slides); the slide check run; the deck
  built with the run's own command (`run-fixed-resource.py slides`); pages
  rendered with LibreOffice and looked at.
- Checked that the new note and the refusal's quoted words survive a Python not
  in UTF-8 mode with its output piped (`encoding.py`): they do; characters
  outside the Windows code page print escaped, and nothing crashes.
- Ran the four suites in the plugin folder, compared HEAD's lesson check and
  today's over every saved `lesson-design.json` (`designs.py`), measured sizes
  and dashes (`sizes.py`).
- Ran the pin tests on an untouched copy of the whole plugin with the ledgers
  from `plans/` beside it, rebuilt the success-criteria pins there with a copy of
  the mapping builder pointed only at that copy, then attacked this round's
  tests and sentences: 37 changes, each made alone in one of five copies, then
  the whole builder suite and the whole Python suite (`mutate.py`, results in
  `mutations/`). Every copy was put back and matches the plugin.

## Findings, most serious first

### 1. The forgiving match lets a flag written for something else pass a too-long list, and covers lists it does not name

A flag covers a too-long list when it carries a does-not-fit phrase ("too
long", "too big", "does not fit", "cannot fit" and the like) and either names
the list by the first four words of its first step, or names no list but has
the word "criteria" or "criterion". The second path covers one list per flag,
whatever the flag was about. With the refusal's own eight-step list and
nothing meant for it, each of these passes the check (`probe.txt`, part A):

> "The plan's success criterion "I can multiply any 3-digit number" is too big for one lesson, so this lesson teaches 3-digit by 1-digit only."

> "The supplied success criteria were too long for Year 4 to read, so I rewrote them."

> "The success criteria check at the end does not fit in the ten minutes the plan gives it."

> "The success criteria are not too long for the panels."

> "The worksheet's last criterion cannot fit the Below group's page; the adaptation designer decides."

The first is the first kind of flag the contract asks for ("an unmet direct
teacher requirement or departure from the supplied plan's curriculum
coverage"). When such a flag sits beside a list no panel holds, the designer
never sees the refusal, its "Tighten ... first" or the cost; every slide that
shows the list reaches him blank; and the flag he reads says nothing about it.
That is the one thing the check exists to stop.

It also covers more lists than it names:

- Two lists that open with the same four words are both covered by a flag that
  names one (part C). Six of the 82 distinct saved designs have such a pair
  (`real_flags.txt`: "read both endpoints", "show the starting number", "find
  the tens column" and others).
- A list whose first step is one word is named by that word: with a first step
  of "Estimate.", "Estimate first: the numbers are too big for mental rounding
  in Year 3, so children use a number line." passes it, and so does "The Below
  group cannot estimate yet, and the numbers are too big for them" (part F).
- Two unrelated flags that each mention criteria and "too big" or "too long"
  cover two too-long lists (part B).

How likely: it needs a list no panel holds (none of the 78 steps lists in the
saved designs) and such a flag (none of their 60 flags mentions criteria or
carries a does-not-fit phrase). Rare today; but the answer to "can it let a list
through that was never meant to be flagged, or cover more lists than it names"
is yes, both.

Fix, smallest first: count a flag only when it says where the list does not fit,
as the refusal asks ("too long for the criteria panels"; "panel", "box" or
"board"); a flag that mentions criteria and a fit phrase without that is a near
miss the refusal names, not a cover; and name a list by enough of its words to
tell it from the others (or by its id when two open alike), never by fewer than
three.

### 2. The note and the review page can tell the designer and the reviewer to take out a flag that is needed

A flag is "stale" when it names a list that fits, or names none, mentions
criteria and has a fit phrase, and every list fits. Both misfire:

- **A real pair of lists** (`represent-and-estimate-on-a-number-line`: both
  begin "Read both endpoints.") with the second made too long (`probe_shared.txt`).
  The refusal asks for a flag naming the list by "its first words
  ("Read both endpoints.")", which are also the other list's. The flag written
  exactly as asked covers the long list and names the fitting one, so the check
  passes and prints:

  > "LESSON_DESIGN_NOTE: flagsForTeacher[0] says the success criteria that begin "Read both endpoints." are too long for the criteria panels, but they fit now: take the flag out, so the teacher is not told something untrue. This is a note; the check passed."

  and the review page says beside the fitting list: "a flag for the teacher
  calls this list too long for the criteria panels, but it fits; say so in your
  review, so the flag comes out". Taking it out makes the check refuse again.
- **Every list fits, and a departure-from-plan flag** (part E): "The plan's
  success criterion ... is too big for one lesson, so this lesson teaches 3-digit
  by 1-digit only." draws "flagsForTeacher[0] says a success-criteria list is too
  long for the criteria panels, but every list fits now: take the flag out, so
  the teacher is not told something untrue." So does "The supplied success
  criteria were too long for Year 4 to read, so I rewrote them in shorter
  steps." The designer runs the check itself and reads the note; following it
  deletes a flag he needs. This one needs no too-long list at all, so it is the
  likelier of the two to fire.

Fix: a flag that covers any too-long list is never stale; a flag that names no
list is stale only when it speaks of the panels; the note says "if this flag is
about the criteria panels".

### 3. The review page's line: the page itself is not held, and it presumes the designer skipped tightening

The line is right in substance. In my build it sits at line 179 of the view,
directly under the list and its cues, and it keeps the reviewer's own file
untouched (`agents/design-reviewer.md` is unchanged in the release). It asks a
conditional question and names the fix for the lesson designer: "Could any
step lose words without losing what it tells a stuck child to do? If so, return
`REDESIGN REQUIRED` and name the tightening: the words are the lesson
designer's to change." So it does not ask the reviewer to demand tightening of
a list that truly cannot be tightened, and nothing in it tells the reviewer to
shorten a criterion itself. Three things:

- **Only the function that words it is tested, not the page.** Taking out the two
  lines that put it on the page (R4), or moving it to the end of the page away
  from the list (R5), passes every suite. The build log says "the review page,
  beside a flagged list, asks the reviewer"; nothing holds "on the page" or
  "beside".
- **It states as fact what the contract forbids.** "the lesson designer flagged
  it for the teacher instead of tightening it". The flag is only allowed after
  tightening has failed, so the reviewer is told the designer skipped the step
  it was required to take first. That leans the conditional question towards
  `REDESIGN REQUIRED`. "after trying to tighten it" says what should have
  happened and lets the question do the work.
- **Its bar is lower than the one that matters.** "Could any step lose words"
  is not "could the list be tightened until it fits". Since the cost is all or
  nothing (a list either fits or every slide that shows it is blank), a return
  that trims a few words and still does not fit gains the deck nothing, costs
  one of the two redesign passes, and after two the playbook continues with "the
  reviewer's unresolved findings" and "This route can never end `COMPLETE`". The
  deck is still built (decision 11 holds), but his report then leads with a
  dispute about wording. Low, and the lesson designer's re-check will show
  whether the trim reached the fit.

### 4. The slide designer is told to leave the slide, which its own file does not allow, and only one refusal tells it

The widest refusal now adds: "If the lesson design flags this list for the
teacher as too long for the criteria panels, no panel holds it: leave the
slide, which is delivered flagged for the teacher to check." The guidance adds
"spend no repair pass looking for one". But:

- `STEP_TEXT_OVERLOAD` is reported with `faultClass: "composition"`
  (`builder/build.js`), and `agents/slide-designer.md`, unchanged, says of such
  faults "you MUST repair all such diagnostics" and "Do not return
  `SLIDE_DESIGN_CHECK_FAILED` while an allowed candidate-repair pass remains and
  at least one unresolved diagnostic is entirely within your repair authority".
  Neither of its exit lines fits leaving it: `EXHAUSTED 3/3` needs three passes
  spent, `BLOCKED_OUTSIDE_AUTHORITY` needs no owned fault left. The focused
  repair says "Creation-mode composition faults stay with the original Slide
  Designer until `Slide self-repair: EXHAUSTED 3/3`".
- In my build the list sat on 11 slides; 6 were practice templates and carried
  the new sentence, 5 were `split-h-60-40` slides whose refusal still says "Give
  the panel more room instead: a wider or taller `sc-panel` composition up to
  half the slide, never fewer criteria". The half-width split's refusal is the
  same (the third check saw it).

This costs time, never the deck: the playbook ships "A deck the round did not
clear". Low.

### 5. "A near miss never withholds the deck" says more than the match does

The build log: "The flag is matched forgivingly (...), so a near miss never
withholds the deck." The test is named the same. Two plain-English near misses
are still refused with no sign the flag was seen (`probe.txt`, part G): "The
steps for short multiplication are too long for the board's box: every step is
needed." and "The short multiplication method will not fit on one board." (no
first words, no "criteria"). The refusal then says exactly what to write, and
there are three passes, a focused repair and a fresh attempt before `BLOCKED`,
so the risk is small; the sentence should say "rarely" or the refusal should
name any flag that says a list does not fit without naming it.

### 6. Smaller

- **Tests that hold less than they are named for.** Each of these passed every
  suite: naming a list by its first word alone instead of four (V8); dropping
  "too big", or "cannot fit" and "will not fit", from the fit phrases (V11,
  V12); dropping the note for a flag that names no list (V16); reading a sticky
  line as a list's first step (V19); moving the new `output-template.md` bullet
  out of the "only for:" list to the end of the file, or adding a line after it
  that undoes it (T2, T3); a paragraph before the pinned `templates.md`
  paragraph that undoes it (T7; the new test holds only what comes after);
  naming a list by its id no longer working (V7, which matters little now that
  the id is not asked for).
- **The report's account of the build.** "At the build, every slide that shows
  it is refused at the widest panel" (`fit-release-report.md`, second check,
  item 4): slides that carry the list in another panel are refused there (5 of
  11 in my build). The outcome it states is right.
- **The "why" is still not held**, as the report says: a flag of the words alone
  passes. Left to him, which is reasonable.
- **Escaped characters.** Where a list's first words carry a character outside
  the Windows code page, the refusal prints it escaped (`≈`) when Python is
  not in UTF-8 mode; a flag copying the escape does not name the list (the
  criteria path then covers it). Nothing crashes. Noted only.

## The six points, one by one

1. **The cost: done, as asked.** Old refusal: "its slide is built flagged for the
   teacher to check, so the deck is still made." New: "The check then lets it
   through, but it costs every slide that shows the list: each reaches the
   teacher as a blank page that says to check it before teaching, with its
   question, working space and criteria not drawn. So tighten it if any word can
   go." The same cost is now in the build log ("costs every slide that shows it:
   each is delivered as a blank page for the teacher to check before teaching,
   never cut to fit, and never at the cost of the deck"), the report, the
   builder test's name, `output-template.md`, `lesson-designer.md`, the review
   page and the validator's own docstring; the slide guidance says "each slide
   that shows it is delivered flagged", which is true. Confirmed in a build: all
   11 slides that showed the list came out as the title and "Check this slide
   before teaching. What it needs to show would not fit, so it has not been
   drawn." (`e2e/render/p-07.png`); the rest drew (`p-08.png`). Sound.
2. **The contract and the reviewer: done, the reviewer part differently.**
   `output-template.md` gains "- as a last resort, a success-criteria list ... so
   it is never a way round tightening." inside the "only for:" list;
   `lesson-designer.md` gains "A fourth, only as a last resort: ... so tighten
   first." The third check left the reviewer to his call; the builder put a
   question on the review page instead, citing his ruling today, and left the
   reviewer's file alone. Sound in substance; finding 3.
3. **The match: done differently.** Old: a flag had to begin with exactly
   "`sc-001 is too long for the criteria panels:`". New: case, backticks, quote
   marks, spacing and punctuation set aside; a list named by its first four
   words or its id; a flag naming no list but mentioning criteria covers one;
   a flag naming a list without a fit phrase is pointed out in the refusal
   ("names this list but does not say it does not fit"). The backtick, leading
   space, capital and "panel" cases now pass. Too forgiving in two directions
   (findings 1 and 2), and not quite "never" (finding 5).
4. **Plain English and stale flags: done.** The refusal no longer asks for an id;
   it quotes the list's first words ("Write the 3-digit number on top..."). A
   flag on a list that fits is a note on the error stream after the pass, and a
   line on the review page, never a refusal. The pass line is untouched: the
   review packet and `photo-contract.py` read standard output only, and the
   test runs the program. Sound, except that the note misfires (finding 2).
5. **The slide designer: done.** Guidance: "One it could not tighten is flagged
   ... so spend no repair pass looking for one, and each slide that shows it is
   delivered flagged." Widest refusal: quoted in finding 4. SC-K06's
   whole-paragraph pin follows the paragraph (dropping the sentence fails four
   pin tests and the guidance test). Finding 4.
6. **The three uncaught attacks: done.** The third check's V8 and V9, remade in
   today's code (V20 only the first list named, V21 one flag lets every list
   through), both fail `test_two_lists_too_long_need_a_flag_each`. Its P6 (a
   paragraph after the pinned `templates.md` paragraph setting `panelWidth`) now
   fails the new section test (T6). The count now reads 1,048 identical and 64
   refused under both, with the parachute slide explained.

## Found sound

- Decision 11 holds: a flagged list passes, the slide check refuses its slides, and `run-fixed-resource.py slides` writes the deck (`ok: true`, `FIXED_RESOURCE_FLAGGED slides: 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23`).
- Nothing in the release tells anyone after the lesson designer to shorten, reword or drop a criterion; every added line with "shorten", "tighten", "reword", "drop" or "fewer" is addressed to the lesson designer, says "never fewer criteria", or asks the reviewer only to name a tightening.
- The reviewer's own file, the reviewer's focused repair, the playbook and the slide designer's file are unchanged.
- The refusal keeps its order: tighten first, the way out only "if you have tightened it and no step can lose a word", then the cost.
- Two too-long lists are named separately, a flag for one lets only that one through, and one unnamed flag covers one list, not two.
- `REDESIGN REQUIRED` from the review question is bounded by the playbook's two redesign passes and never withholds the deck.
- The note cannot change a pass into a failure: it goes to the error stream, and a character outside the code page is escaped, not fatal.
- The review page reads the lesson check's own function, so the two cannot disagree about which list is flagged.

## Suites, designs, pins, sizes, dashes, the log

- **Suites, in the plugin folder:** Python 2,198 passed, 1 skipped, 71,513
  subtests; builder 730; worksheet 722; working wall 142. As the report says.
  The plugin folder gained no file.
- **Saved designs:** 90 `lesson-design.json` files outside the scratch folders
  (85 distinct) give identical output under HEAD's check and today's; none
  passes under either, for older faults. The flag reader finds nothing in any
  of them. In the other checkers' scratch folders, 3 of 73 differ, all the
  third checker's own made-up designs (the new refusal wording and the note).
- **Pins:** on the untouched copy, the five ledger test files pass (65 tests,
  69,451 subtests, nothing skipped). The mapping builder, pointed only at the
  copy, prints `MAPPING_OK 467 pins; 80 changed rows mapped`, and its pins and
  mapping are byte for byte the working tree's.
- **Sizes, to the byte, match the report and the log:** instructions +2,521
  (the two the slide designer reads +1,667, the flag contract and the designer's
  list +854); programs +28,969 (validator +16,231, `maths-turn-sc.js` +4,733,
  `steps.js` +3,950, review page +2,076, the switch +1,046, the other three
  templates and the panel +933); tests and pins +120,885 (fixture 55,552); build
  log +17,770. The log's "about 29 KB" names 28.0 KB of parts; the other 0.9 KB
  (the other templates and the panel) is unnamed. Harmless.
- **Dashes:** none added in this round (0 of 300 added lines across the ten
  files). In the whole release, only the pre-existing "0.4 to 0.5" en dash range
  line and its pin, and one saved lesson's step inside the fixture.
- **The build log's changed sentences** match the files and my runs, except
  "so a near miss never withholds the deck" (finding 5), "a flag that says a
  criteria list is too long without saying which covers one list, never two"
  (true per flag, but any such flag counts, finding 1), "the review page,
  beside a flagged list" (true, but untested, finding 3) and "so it spends no
  repair pass looking for one" (what the texts say; its own file says otherwise,
  finding 4). "nothing in the playbook changed" is true.

## Tests attacked

Baseline on an untouched copy: builder 730 passed, Python 2,198 passed, 1
skipped. Each change alone, then both whole suites.

| Change | Caught by |
|---|---|
| V1 the refusal's cost sentence dropped | the decision-11 test |
| V2 the cost softened back to one slide | the decision-11 test |
| V3 the refusal asks for the id again | the decision-11 test |
| V4 an unnamed flag covers every list | two-lists test |
| V5 a named flag covers without a fit phrase | "must say it does not fit" test |
| V6 lists named by id only | six tests |
| V7 lists named by first words only, not id | nothing |
| V8 a list named by its first word alone | nothing (finding 6) |
| V9 case not set aside | forgiving-match test |
| V10 an unnamed flag covers nothing | forgiving-match and two-lists tests |
| V11 "too big" not read | nothing |
| V12 "cannot fit", "will not fit" not read | nothing |
| V13 the near-miss hint dropped | "must say it does not fit" test |
| V14 the which-list hint dropped | two-lists test |
| V15 a stale flag refused | three tests |
| V16 the note for an unnamed stale flag dropped | nothing |
| V17 the note on the pass line's stream | the program test |
| V18 the note not printed | the program test |
| V19 a sticky line read as the first step | nothing |
| V20 two lists refused, only the first named | two-lists test |
| V21 a flag for one list lets every list through | two-lists test |
| R1 the review line's opening words changed | nothing (its later words are held) |
| R2 the review question made unconditional | reviewer test |
| R3 the reviewer told to tighten it itself | reviewer test |
| R4 the review line never printed on the page | nothing (finding 3) |
| R5 the review line moved to the end of the page | nothing (finding 3) |
| R6 the stale line's opening words changed | nothing (its later words are held) |
| R6b the stale line never added | reviewer test |
| T1 the `output-template.md` bullet dropped | contract test |
| T2 that bullet moved out of its list | nothing |
| T3 a line after it that undoes it | nothing |
| T4 the designer's fourth kind dropped | contract test |
| T5 "so tighten first" turned round | contract test |
| T6 a paragraph after the `templates.md` paragraph setting `panelWidth` | the new section test |
| T7 a paragraph before it that undoes it | nothing |
| S1 the guidance's flagged-list sentence dropped | guidance test and SC-K06 (three pin tests) |
| S2 the widest refusal's flagged-list sentence dropped | builder widest-refusal test |

## What I would still fix

1. Stop the match reading flags it was not written for (finding 1): count a
   flag only when it says the list does not fit where it goes (panels, box,
   board); treat criteria-plus-"too big" without that as a near miss the refusal
   names; name a list by enough words to tell it from the others, never fewer
   than three, or by its id when two open alike.
2. Never call a flag stale when it covers a too-long list, and let an unnamed
   flag be stale only when it speaks of the panels (finding 2), so no note or
   review line tells anyone to delete a flag he needs.
3. Test the review line on the page, beside its list (build the view, not only
   the function); change "instead of tightening it" to "after trying to tighten
   it"; consider asking "could it be tightened until it fits" (finding 3).
4. His call, as it touches the slide designer's own file: let a composition fault
   on a list the design flags as too long end the slide designer's pass without
   spending its budget (an exit line for it), and put the flagged-list sentence
   in the other panel refusals too (finding 4).
5. Soften "never" in the build log and the test name, or name every does-not-fit
   flag the check could not place (finding 5); add the small test holes in
   finding 6 if they are wanted.
