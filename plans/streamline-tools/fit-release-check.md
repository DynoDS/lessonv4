# First check of the long-criteria fit release (4.2.289)

Checked on 24 September 2026 by a fresh reader, against `fit-release-brief.md`,
the investigation's "Recommendation" and "Decisions taken", the success-criteria
ledger's "Decisions taken" and "Read back, and settled", and the builder's
`fit-release-report.md`. Nothing in the repository was changed except this file.
All working files are in `plans/streamline-tools/scratch/fitchk/`.

## What I did

- Read the whole diff (`git diff HEAD -- plugins/lesson-v4`, the new tests and
  fixture), the change scripts, and the parts of the builder the change leans on
  (the panel, the image and figure finding stores, the build's preflight).
- Replayed the change scripts on a fresh copy of HEAD with every hardcoded root
  pointed at scratch (`replay/`), including the mapping rebuild.
- Built all 91 saved `lesson.json` files in the repository (node_modules and
  other agents' scratch left out) with HEAD's builder and today's, twice over:
  whole decks through `build.js --deliver-flagged` (80 build under both; 11 fail
  today's spec checks under both), and every slide drawn in-process the way
  `build.js` draws it, so the 11 that fail the spec checks are still compared
  (`draw-all.js`, `compare-draws.py`, `compare-decks.py`).
- Ran HEAD's lesson check and today's over all 90 saved `lesson-design.json`
  files (`validate-all.py`), and today's new measure on every steps list in them.
- Held the lesson check to the builder on 4,000 random lists with colour marks,
  reveal markers, labels, long words and sticky lines (`fuzz_parity.py`).
- Built a probe deck of twelve practice slides (the long lists on all four
  templates, beside landscape, portrait and square photographs and number
  lines, with a sticky line, and a list no width holds), rendered it to pictures
  and looked at every page (`probe/png/`).
- Ran the new tests against HEAD's builder, then undid each mend, each code
  change and each new sentence one at a time in a scratch copy of the whole
  plugin with the ledgers beside it, and ran the builder suite and the whole
  Python suite each time (`mutate.py`, `mutations/`). The pin tests were run on
  the untouched copy first.
- Ran the four suites the brief names in the plugin folder.

## Findings, most serious first

### 1. The short-list mend still refuses a short list by a hair outside the practice panel

The mend (fault 3) gives a short list "the height its lines need at 18pt". It
works that height out with the card shape of the smaller share (a smaller number
badge and a smaller gap between cards, both of which grow with the row), then
redraws at the new height, where the gap and badge are bigger, so the list needs
a little more than it was given and is refused with the zone mostly empty. In
the practice panel the share already has the full badge and gap, so the
practice panel is unaffected; in a shallower zone it is not.

Seen with today's builder, a one-step list in the bottom 40% band
(`split-v-60-40`):

> `Round to the nearer ten.` -> STEP_TEXT_OVERLOAD: criterion 1 does not fit its card at the 18pt readable minimum. The card is 0.34in tall and one line at 18pt needs 0.35in, so it holds no line at all and no wording will fit it. This is room, not words: each card here is about 0.01in short.

The same happens to `I can explain why people use symbols.` Given the whole
band it draws at 36pt. Over 8,100 zone and list combinations, 241 are refused
this way (zones up to about 2.8in tall); over the fixture's 120 real lists in
its fourteen shapes, 50 results are, all in the bottom bands and strips (the RE
steps, the two-step approved compare pair, and the three-step lists in the 40%
band). None of this is a regression (HEAD refuses them too), and the guidance
keeps a method's steps out of those bands, but it is the same kind of false
refusal the release set out to mend, in the mend itself, and its refusal
message sends the slide designer looking for room that is there. No test covers
a shallow zone (`criteria-fitter-mends.test.js` draws only the 4.60in panel).

Fix: size the short list again at the height it is given until the need stops
growing (two passes settle it, since the badge and gap stop growing), and add a
test with a one-step list in `split-v-60-40`.

### 2. The panel widens for any refusal inside it, not only for the list

`scPanelWidth` tries 4.60, 5.50 and 6.35in and keeps the first width at which
the panel draws without any error (`} catch (err) { refusal = err; }`). Its
comment says this is "the narrowest of SC_WIDTHS that holds the whole list,
which is to say at 18pt or more, since the step fitter refuses anything
smaller", which is only true when the list is the one thing in the panel that
can refuse. A criteria panel can also hold a stack with a picture in it.

Seen in the plugin's own test lesson `builder/test-lessons/eq-fractions` and its
copy under `output/working/.../_helper-test-root/`: slides 5, 9, 10, 11 and 12
carry the steps and a fraction wall in one stack. On HEAD each is refused
(`FRACTION_WALL_ZONE_TOO_SHALLOW`); now the panel widens to 5.50in for the wall
and the slides draw. In
the whole build slides 9 and 11 then fail the final text check on their header
chip, so they still reach the teacher flagged. That is 10 saved slides whose
panel widened, against the report's and build log's "No saved slide widened"
(true of the investigation's corpus, which left test lessons out, not of the
repository). It is also wider than he agreed: "a practice box that widens itself
when a list needs it", "only as far as 18pt needs".

Fix, or ask him: only a step-fit refusal (`STEP_TEXT_OVERLOAD`) moves to the
next width, and any other refusal is raised at 4.60in as before; add a test with
a picture in the criteria stack. If he would rather keep the wider behaviour,
the comment, the report and the build log should say so.

### 3. A photo beside the working space shrinks under its floor, and the finding is reported twice

On `maths-turn-sc` the picture moves above the working space only when it cannot
be drawn at all in its half (`!drawsIn(...)`). A number line is refused and so
moves; a photograph always draws, so it stays beside and gets smaller as the
panel widens. The probe's landscape photo is 3.67 by 2.44in beside the working
space at 4.60in, 3.21 by 2.14 at 5.50 and 2.79 by 1.86 at 6.35, each below the
3.00in floor for the one picture children work from, which is a blocking
`PICTURE_BELOW_READABLE_FLOOR` finding. Moving it above would not rescue it
(3.88 by 2.59 for the landscape, and a portrait gets smaller, 1.40 by 2.59), and
the landscape breaches the floor at 4.60in already, so this is a limit to tell
him about rather than a rule to change. No saved slide meets it today.

The part to fix: on every widened slide with a photo the finding is reported
twice, because the dry drawing in `drawsIn` records it in the picture-floor
store (and a shared figure would record its zone-fill finding the same way).
`withoutWarnings` silences `warn` and `note` but not those stores. Seen in the
probe build: two identical `PICTURE_BELOW_READABLE_FLOOR` diagnostics on each of
slides 1, 2 and 3, one on the unwidened slide 12. The build log's "those tries
raise no warnings of their own" is true of warnings, not of findings.

Fix: keep the finding stores out of the dry drawings (take a copy before and put
it back after, as the build does around its preflight), and a test.

### 4. The half-width split is a little roomier than the guidance and the refusal say

The report dropped 4.2.288's "when it refuses, use the half-width split" because
"the half side is no wider than the widest practice panel now", and the guidance
now says the half-width split holds "as much as the widest practice panel
holds". Measured: the half side's panel is 6.35 by 6.65in, the widest practice
panel 6.35 by 6.50in, so the half side is 0.15in taller. Of 1,554 random lists
that every practice width refuses, 113 draw in the half side, and the lesson
check refuses 104 of those with the words "no slide can give it more room beside
the work". The move he agreed in 4.2.288 therefore went on a premise that is not
quite right, and for the list that still reaches a slide too long (a sticky line
or helper added after the design) the half side is the one move that sometimes
holds it. Low: the lesson check catches nearly all of these first, and none of
the saved lists comes near the limit.

Fix: say "a little more than the widest practice panel" and keep the move for a
list the widest practice panel refuses; or soften the check's "no slide can give
it more room" to "no practice slide".

### 5. Noted, not faults of this build

- `maths-turn-ref-sc` keeps its picture beside the working space when its panel
  widens, so a number line there is refused (probe slide E,
  `NUMBERLINE_TOO_NARROW`, delivered as a "check this slide" page). The brief
  asked for the move on `maths-turn-sc` only, and none of the 14 saved
  `maths-turn-ref-sc` slides has a picture beside its working space. The builder
  names this.
- A refusal at the widest panel still offers "a wider or taller `sc-panel`
  composition up to half the slide". After finding 4 that is sometimes right.
- The lesson designer's guidance (`preferences.md`, Success Criteria) still says
  "There is no word target and no step target" and says nothing of the room a
  list has; it learns the limit from the refusal. Not asked for; the longest
  saved list takes 9 of the 14 lines, so the refusal will be rare. His call.
- "11 that were refused now draw" is right for the drawing. In the whole builds
  two of them (partition slide 6, balanced diet slide 7) are still flagged, for
  other content the old refusal had hidden: a question and a reference box too
  long for their space, and a photo below its floor.
- "on the 4.2.288 builder, 9 of the 13 new builder tests fail": there are 15
  new builder tests; the keep-size file's two were run against HEAD separately.
  With a stand-in for the new warnings helper, 9 of 15 fail on HEAD and 6 pass
  (the "nothing moves" and "still refused" ones). Without the stand-in 11 fail,
  two of them only because the helper is missing.

## Found sound

- Mend 1 is correct and minimal: only a refusal at 18pt gives way, by at most a
  millionth of an inch; every size above 18pt is measured as before.
- Mend 2 is correct: the pre-check now adds each step's own height at 18pt; its
  only job is to name the sticky line as the fault, and the per-card check after
  it still refuses anything that does not fit.
- Mend 3 cannot change a list that fitted: a list that fits has each card at or
  above its 18pt need, so its total is inside its share and the rule never gives
  way for it.
- The card geometry moved into `cardRows` word for word, and `stepFloorNeed`
  moved earlier with the same geometry.
- The width choice is the narrowest of 4.60, 5.50 and 6.35in on all four
  templates; the panel keeps its right edge (13.11in); each template's left side
  gives up exactly the widening, keeping the 0.30in gap; 6.35in is 41.3% of the
  slide; `SC_PANEL_TOO_LARGE` is untouched; the retired `maths-mtotyt-sc` keeps
  4.60in; a list no width holds is refused before anything is drawn.
- A number line on `maths-turn-sc` goes above the working space when the panel
  widens, and stays beside it at 4.60in (probe slides D and J, rendered).
- The lesson check gives the builder's verdict: 0 disagreements on 4,000 random
  lists beyond the 15 two-sticky-line cases the report allows; all 98 steps
  lists in the 90 saved designs pass (most lines 9).
- The check's refusal speaks to the writer, asks nothing downstream, and keeps
  decisions 3, 12 and 13: "Tighten the wording here, where it is written,
  keeping what each step tells a stuck child to do, until the whole list fits:
  no slide can give it more room beside the work, and nobody after you may
  reword a criterion."
- Saved designs: HEAD's check and today's give identical output on all 90.
- Saved slides, in-process: 1,123 slides of 91 lessons; 1,098 identical in every
  object; the 11 newly drawn are exactly the report's 11, each at its old width;
  the other 14 are eq-fractions slides: the 10 of finding 2, and 4 refused
  before and after, now before anything is drawn. Whole builds of 80
  decks agree: slide XML changes only on those slides; the remaining picture
  byte differences are anti-aliasing from building out of a different folder
  (the same code built from a scratch copy shows the same, and two builds from
  one folder are identical).
- Rendered probe: every step at 18pt or more and readable at projection size,
  nothing clipped, no panel over half the slide.
- The change scripts replayed on a copy of HEAD reproduce the working tree
  exactly (line endings aside), with the mapping rebuild printing
  `MAPPING_OK 466 pins; 80 changed rows mapped`. No file has mixed line endings.
- Both pins moved honestly: SC-DEC-11-FIT follows its sentence's new words with
  the reason written beside it; SC-K06's whole-paragraph pin follows the new
  paragraph, whose own sentence is unchanged.
- Suites in the plugin folder: Python 2188 passed, 1 skipped (71,510 subtests);
  builder 724 passed; worksheet 722 passed; working wall 142 passed. The same on
  the untouched scratch copy, where the pin and ledger tests alone gave 99
  passed.
- Sizes in the report and build log match to the byte (instructions +1,257,
  programs +16,696, validator +8,820, `maths-turn-sc.js` +4,069, `steps.js`
  +2,498, tests and pins +89,423 of which the fixture 55,552, build log +8,049).
- Both `plugin.json` files say 4.2.289. No em or en dash was added to plugin
  prose or code; the one in the new fixture is a saved lesson's own step.

## What undoing each piece shows

On HEAD's builder (with a stand-in for the new warnings helper) the new tests
fail where they should: 9 of the 15 new builder tests fail and the 6 that pass
are the "nothing moves" and "still refused" ones; the new Python test file cannot
run on HEAD at all (the check is not there).

Each line below is one piece undone in a scratch copy of the whole plugin, with
the builder suite and the whole Python suite run (`mutations/`). "Parity" is
`test_the_lesson_check_and_the_builder_give_the_same_verdict`; "guidance test"
is `test_the_guidance_says_what_the_builder_and_the_check_now_do`; "SC-K06" is
that row's whole-paragraph pin in `test_success_criteria_ledger_is_kept.py`.

| Undone | Caught by |
|---|---|
| Mend 1 (rounding at the floor) | its own two fault 1 tests, the long-lists test, parity |
| Mend 2 (sticky pre-check) | its own two fault 2 tests, parity |
| Mend 3 (short list gives way) | its own fault 3 test, parity |
| Mend 3 overdone (short list takes the whole panel) | the fault 3 test |
| No widening | four widening tests, parity, the widest-width test |
| Widest width tried first | six builder tests, parity, the widest-width test |
| Picture never moves above the working space | the number-line test |
| Picture above takes the whole height, not at most half | nothing |
| Width tries raise warnings | the warnings test |
| Cards, reference, question or writing panel not giving up the width (four undos) | the long-lists test (work runs into the panel) |
| Lesson check not called | the refusal test |
| Lesson check without its short-list rule | nothing, and nothing can: in the 6.35in panel the rule cannot change a verdict |
| Lesson check measuring the 4.60in panel | five tests |
| Refusal telling the writer to drop criteria | the refusal test |
| "What holds a list today ... 6.35in (about 39), each about 14 lines tall." | guidance test, SC-K06, SC-DEC-11-FIT |
| "The question and working side take what is left ..." | guidance test, SC-K06 |
| "In a free layout the roomiest place is the half-width split ..." | SC-K06 only |
| "A list too long even for that is caught by the lesson check ..." | guidance test, SC-K06 |
| The `templates.md` paragraph, or its last sentence | guidance test |
| Old sentences: "Never put a method's steps in a 30% column ..."; "A criteria table goes in ..." | SC-K06 |

Every mend, every code change that matters to the teacher and every new
sentence is caught. The one gap is the builder's own choice that a picture above
the working space takes at most half the height (report decision 4), which no
test holds.

## What I would fix before release

1. The short-list mend in shallow zones (finding 1), with a test.
2. Keep the widening to the list (finding 2), with a test; or ask him, and
   correct the comment, the report and the build log either way.
3. Keep the dry drawings out of the finding stores (finding 3), with a test.
4. Correct "as much as the widest practice panel holds" and the check's "no
   slide can give it more room" (finding 4); consider keeping the half-side move
   for a list the widest practice panel refuses.
5. Smaller: a test that a picture above the working space takes at most half
   the height, since nothing holds that choice today.
