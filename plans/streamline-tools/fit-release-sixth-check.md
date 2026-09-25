# Sixth check of the fit release (4.2.289): the fifth check's repairs

Checked on 25 September 2026, against `fit-release-fifth-check.md`, the repair
script `fit-change/c5e_only_a_list_too_long_goes_smaller.py` and the report's
section "The fifth check, and what was repaired". Only this round was checked.
Nothing in the repository was changed except this file. Every working file is in
`scratch/fitchk6/`. The plugin's files were hashed at the start and the end and
did not change. Builds and attacks ran on a copy of the plugin (`copy/`), which
was put back each time and matches the plugin.

## Verdict

All five points hold. One small thing is noted under point 4; it does not
reach a slide.

## 1. A marked list goes under 18pt only when no named shape holds it at 18pt

Two scratch decks, each built with `build.js --deliver-flagged` beside a design
that marks its lists, and again with the marks false (`decks.py`, `decks.txt`,
`decks/`).

- **The stale deck:** a list the widest practice panel holds at 18pt and one
  only the half-width split holds at 18pt, on eight slides (practice, 30%
  column, 40% side, half side, and one with a two-line sticky line). Marked and
  unmarked give the same diagnostics, the same step sizes and the same build
  output, line for line. Two slides draw at 18pt; six are refused at 18pt as
  composition faults naming the roomier shape (the half-width split on the
  practice slide, "a wider or taller `sc-panel` composition" in the columns).
  No slide carries `CRITERIA_BELOW_READABLE_FLOOR`, so no slide is told the
  list is too long for every panel. The slide designer's own check prints the
  same thing both ways.
- **The long deck:** lists neither shape holds at 18pt, marked. They draw at
  17pt on the practice slide and in the half side, flagged; a list only the
  half-width side holds is refused on the practice slide at 16pt, naming the
  half-width split, for the slide designer to move. Each flag is true.

## 2. A sticky line beside a marked list stays at 18pt

- **Laid out:** 19pt on every drawing, the dry ones the panel makes while it
  looks for the list's floor and the real one, while the steps are at 16 or
  17pt (`sticky.js`, `sticky.txt`). It has its own size group and no lower
  floor in its name.
- **In the written deck,** after the final text fit: 20pt beside steps at 17pt,
  on the practice slide and in the half side. Pages 2 and 3 of
  `decks/long-marked/render/` show it; nothing is clipped.
- **Too long at 18pt:** refused exactly as beside the same list unmarked, a
  composition fault ("carry the fact in its own on-slide treatment").
- **A sweep** of sticky lines from 2 to 21 words beside three marked lists in
  three panels (180 drawings, `k1sweep.js`): none laid out under 18pt (58
  drawn, 122 refused).
- The lesson check's copy of the fitter measures a sticky line at 18pt.

## 3. The report's three stale places

All three now say that a marked list too long even at 16pt passes with a note:

- "The refusal now reads" and the note under it are the check's own words today,
  character for character (`quotes.py` compares them with what the check prints),
  and the note is introduced "Marked, that same eight-step list passes, and the
  check prints this note before its pass line".
- "What changed, file by file": `beyond_smaller` "in `c5c` it was refused ...;
  since `c5d` it passes, with the note".
- Its test list: "one too long even at 16pt passing with a note printed before
  the pass line and still making a deck".

The older section "His ruling on the last resort" still quotes that round's
words and one test name that no longer exists
(`..._is_refused_so_it_is_tightened_at_least_that_far`), but it says twice that
they are that round's words. Fine as history.

## 4. The new tests fail when their repair is undone

Each undone alone in the copy, then the fit tests of both suites (`mutate.py`,
`mutate.txt`, `mutations/`).

| Repair undone | Caught by |
|---|---|
| A mark left false counts (`in sc`, and again as `is not None`) | `test_a_mark_left_false_is_no_mark` |
| The note printed after the pass line | the passes-with-a-note test (one stream, unbuffered) |
| The stale-mark test taken out of the panel | the stale-mark test |
| The stale-mark test asking only the practice panel | the stale-mark test |
| The sticky line named as a marked line in the list's group | the sticky-line test |
| The sticky line in the list's group | the sticky-line test |
| The final fit lowering the floor for any `marked-` line | the final text fit test |
| The sticky line's size chosen against the lowered floor | nothing |

The last is one of the two the report says no test catches. The report says it
"still draws at 18pt or more". In the written deck that is true: the final text
fit lifts it back to 18pt (`k1deck.txt`). When the slide is first laid out it
is not: the sticky line is laid out at 17pt beside a six-step marked list on a
practice slide, in 26 of the 180 sweep drawings (`k1parts.txt`). Nothing reaches
the teacher, so I would leave it; a test on the laid-out size would hold it.

## 5. Suites and dashes

- **Suites, in the plugin folder:** Python 2,201 passed, 1 skipped, 71,655
  subtests; builder 742; worksheet 722; working wall 142. All pass, as the
  report's table says.
- **Dashes:** none added in this round (every file `c5e` changed and every new
  test file, against the builder's own copies from before `c5e`; the `c5e`
  script; the report). Across the whole release the only dashes on added lines
  are the existing "0.4 to 0.5" range in `templates.md` and its pin, both also
  on a removed line, and one saved lesson's words in the fixture, as the fifth
  check found.
