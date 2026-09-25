# Second check of the long-criteria fit release (4.2.289)

Checked on 24 September 2026 by a second fresh reader, against
`fit-release-brief.md`, the investigation's "Recommendation" and "Decisions
taken", the success-criteria ledger's decisions, the first check
(`fit-release-check.md`) and the builder's report after its repairs
(`fit-release-report.md`). Nothing in the repository was changed except this
file (the plugin diff hashes the same before and after, and `git status` is the
same). All working files are in `plans/streamline-tools/scratch/fitchk2/`.

## What I did

- Read the whole diff, the new tests and fixture, and the parts of the builder
  the change leans on (the panel, the finding stores, the preflight, the shared
  figure store, the house-style sanitiser, the text splitter).
- Made a copy of HEAD's plugin from git (`head/`) and a copy of the working tree
  (`now/`) at the same folder depth, so the two builders differ only in code.
- Copied every saved `lesson.json` in the repository into scratch with the files
  it names (91 outside scratch, 1,123 slides; plus the 7 distinct test decks in
  other scratch folders, 58 slides), then:
  - built all 98 as whole decks with `build.js --deliver-flagged` under both
    builders and compared slide XML, pictures and every build diagnostic
    (`compare-decks.py`);
  - drew every slide in-process the way `build.js` does (preflight first,
    same context), so the 11 decks the spec check refuses under both builders
    are compared too (`draw-all.js`, `compare-draws.py`).
- Ran HEAD's lesson check and today's over every saved `lesson-design.json`
  (142 files, 85 distinct), and today's measure on every steps list in them
  (74 distinct).
- Held the lesson check to the builder shape by shape (each of the four named
  shapes on its own, not only "any of them") on 6,400 random lists with colour
  marks, reveal markers, labels, line breaks, sticky lines, curly quotes,
  symbols, an emoji and non-breaking spaces (`fuzz.py`, `shapes-verdict.js`).
- Swept 192 lists (the 32 real short ones and 160 made) through criteria panels
  of 176 sizes, 33,792 drawings each, with HEAD's builder, today's, and a copy
  that counts the short-list mend's passes (`sweep.py`).
- Traced the plugin's fraction-wall test lesson through both builders
  (`eqf.js`), and drew short lists in the three bottom strips (`strips.js`).
- Built and rendered with LibreOffice a 35-slide deck: the six long lists on
  all four practice templates, widened `maths-turn-sc` slides with a landscape,
  a portrait and a square photograph and two number lines, a photo with no
  working space, the eight-step list in the half-width split, and the three
  mended lists. I looked at every page (`render/png/`).
- Rebuilt the success-criteria pins with a copy of the mapping builder pointed
  only at a scratch copy (`mapping/`): `MAPPING_OK 466 pins; 80 changed rows
  mapped`, and the pins and mapping came out identical to the working tree.
- Ran the 18 new builder tests on the 4.2.288 builder with a stand-in for the
  new helper: 12 fail, 6 pass, as the report says.
- Attacked the tests: 73 changes, each made alone in a scratch copy of the whole
  plugin with the ledgers from `plans/` beside it, then the whole builder suite
  and the whole Python suite (`mutate.py`, results in `mutations/`). Before
  that, the pin tests on the untouched copy (65 passed, 69,448 subtests) and
  both suites on an untouched copy (727; 2189 passed, 1 skipped).
- Ran the four suites in the plugin folder, and checked sizes, versions and
  dashes against the files.

## Findings, most serious first

### 1. Most of the new `templates.md` paragraph is held by no test

The report says "The new guidance sentences, the template paragraph and the
refusals' words are held by the new tests", and the build log says the same.
For `slide-success-criteria.md` that is true: every sentence I removed,
softened, moved or put back was caught by the guidance test and by the SC-K06
and SC-DEC-11-FIT pins. For the new paragraph in `templates.md` it is not. The
guidance test checks only its opening words ("**The panel widens itself for a
long list.** Across the `*-sc` family") and its last words ("the builder puts
it above the working space instead."), and no pin covers it. With each of these
alone, every suite stayed green:

- "never past half the slide" taken out of "to read at 18pt, never past half
  the slide;";
- "There is nothing to set, and a list" changed to "Set `panelWidth` to widen
  it, and a list", an instruction the builder would ignore;
- the whole paragraph moved from under `maths-turn-sc` to the end of the
  3,051-line file.

Under his condition this matters: the half-slide limit in that paragraph could
be lost and nothing would say so (the same limit is still pinned in
`slide-success-criteria.md` and enforced by `SC_PANEL_TOO_LARGE`).

Fix: hold the whole paragraph word for word and hold where it sits (between the
`maths-turn-sc` and `maths-turn-ref-sc` headings), in the guidance test or as a
pin, and correct the report's and the build log's sentence.

### 2. The fraction-wall test lesson is not "refused at 4.60 inches, never widened" on every slide

The build log's "Checked" bullet says the widening is tested "with the
plugin's own fraction-wall test lesson (refused at 4.60 inches, never
widened)", and its "Before and after" says "65 are refused the same way as
before". The report says the same. That holds for slides 5 and 9 to 12, whose
refusal is the wall's. Slides 7 and 8 of the same lesson (and of its copy under
`output/working/.../_helper-test-root/`) carry the steps and the wall in one
criteria stack, and there the steps are what refuse, so the panel now tries
5.50 and 6.35in and is refused at 6.35in with the wider card's numbers:

> HEAD: `STEP_TEXT_OVERLOAD: step 1 does not fit its card at the 18pt readable minimum. The card holds about 28 characters at 18pt (1 line of about 28); this one is 40 characters, which wrap to 2 lines. Shorten the step to that, or give the zone more room; nothing was shrunk further or cut.`
>
> Now: `STEP_TEXT_OVERLOAD: step 2 does not fit its card at the 18pt readable minimum. The card holds about 42 characters at 18pt (1 line of about 42); this one is 46 characters, which wrap to 2 lines. Shorten the step to that, or give the zone more room; nothing was shrunk further or cut.`

The behaviour is within the rule he agreed (the list not fitting is what widens
the panel) and the delivered deck is identical: those slides still become
"check this slide" pages. But the two sentences above are not true of four
saved slides, and the test holds only slides 5 and 9 to 12. My counts for the
1,123 saved slides: 1,048 identical in every object, 11 newly drawn at their old
widths, and 64 refused under both builders, of which 59 give the same words and
5 give other words (these four, and `childrens-lives-continuity-and-change`
slide 14, whose short-list card is now measured one character narrower).

A note from the same slides, not new in this release: a list inside a criteria
stack loses the criteria flags, so its refusal says "Shorten the step to that",
which decisions 12 and 13 forbid downstream, and the new widest-panel wording
does not reach it either.

Fix: correct the two sentences in the build log and the report (for example,
"slides 5 and 9 to 12 are refused at 4.60 inches by the wall; slides 7 and 8,
whose steps share the stack with the wall, try the wider widths and are refused
at 6.35 inches"), and let the test say which slides it holds.

### 3. Two template-guide sentences now understate the bottom strips

Mend 3 lets a one-step list draw in the bottom strips. With HEAD's builder
`Round to the nearer ten.`, `Add the ones first.` and `I can explain why people
use symbols.` are refused in the `centre-big-v` strip, the `quad-v` strip and the
30% band; today each draws at 18pt in all three (a two-step list is still
refused). `templates.md` still says, from 4.2.288:

> "a short fourth piece in the bottom strip, which holds no criteria list at 18pt: put steps in a practice template's panel or the half-width side" (pinned as SC-K38)
>
> "The bottom strip of `centre-big-v` (~1.66″) holds no criteria list at 18pt"

The advice (never put a method's steps there) is still right and errs on the
safe side, but the brief asked that the guidance say what the code now does.
Low. His call whether to reword ("holds at most one short step") and move the
SC-K38 pin, or leave it.

### 4. A list the lesson designer cannot tighten now stops the run

The build log says a list neither shape can hold "is caught by the lesson check
and tightened where it is written, so it never reaches a slide". If the
designer cannot tighten it, the playbook's validator hand-back applies: "If
that attempt also fails the validator, nothing downstream can build from an
invalid design: go to Phase 4, report `BLOCKED`". That is no deck, over the
criteria, where decision 11 says "There is not a time where I want the
PowerPoint slide deck to never be produced because of an error." He agreed the
catch at design time, and tightening words to fit about 14 lines is a routine
repair, so this is unlikely; but he has not been told this end. Suggest one
line in "Not done yet".

### 5. Smaller gaps the attack found

- Nothing holds that the zone-fill store stays quiet during the tries: making
  it record anyway passes every suite. (The missing-picture store's matching
  change is harmless, because it keys by slide and picture, so a try cannot
  add a second entry.)
- Nothing holds "at today's width nothing moves" for a picture that cannot be
  drawn beside the working space at 4.60in: letting the picture move above at
  4.60in as well passes every suite. It could only change slides that are
  refused today, so it cannot break the promise to lessons that draw.
- The lesson check's copy of the short-list rule, its settling passes and its
  rounding allowance can each be removed with no test failing, and so can the
  builder mend's rounding allowance, or be made a thousand times larger. In the
  four named shapes a short list's share is already tall enough for the badge
  and gap to be full size, so the check's rule never changes a verdict; and in
  my 33,792-drawing sweep the builder's allowance never decided one either.
  Harmless weight, not a fault.
- Not from this release: the 17 September rule that only criteria panels keep
  a short list to its share of four rows is held by no test (applying it to
  every steps list passes every suite).

### 6. Notes

- At the half-width side, a refusal (a sticky line or helper added downstream)
  still offers "a wider or taller `sc-panel` composition up to half the slide",
  though the guidance names nothing roomier. It then reaches the deck flagged,
  as the guidance says. Wording from before this release.
- The report's size table says "five templates"; four changed. The totals are
  right.

## The first check's findings

1. **Short-list mend in shallow bands: done.** Old (first build): `if
   (floorTotal > innerH + 1e-9) innerH = Math.min(panelH, floorTotal +
   FLOOR_ROUNDING);`, one pass. New: `for (let pass = 0; pass < 8 && innerH <
   panelH; pass += 1) { ... if (floorTotal <= innerH + 1e-9) break; innerH =
   Math.min(panelH, floorTotal + FLOOR_ROUNDING); }`. Sound: it cannot loop (at
   most eight passes, the height only grows and stops at the whole panel); in
   22,935 short-list runs it took at most 4 passes and never ran out unsettled;
   its first pass has the old geometry, so a list that fitted cannot change,
   and none did (5,769 drawn under both, identical; none newly refused).
   Held by "fault 3 in a shallow band".
2. **Widening for any refusal: done.** Old: `} catch (err) { refusal = err; }`.
   New: `const listDoesNotFit = /^STEP_TEXT_OVERLOAD:/.test(...)` and `if
   (!listDoesNotFit || w === SC_WIDTHS[SC_WIDTHS.length - 1]) throw err;`.
   Sound, with the wording fault in finding 2. Held by the fraction-wall test.
3. **Findings reported twice: done differently, sound.** Old: `withoutWarnings`
   (warnings only) and "those tries raise no warnings of their own". New:
   `withoutRecording`, with `recording()` asked by the picture-floor,
   missing-picture and zone-fill stores, and "those tries record nothing". The
   builder has no other store that drawing writes to; context changes are put
   back in `finally`; a shared figure a try asks for only adds a picture to
   rasterise. No real finding can be lost: the real drawing still records
   everything it draws. In the rendered deck each floor finding appears once.
4. **The half-width split is roomier: done differently, sound.** Old guidance:
   "as much as the widest practice panel holds"; old refusal: "no slide can give
   it more room beside the work". New guidance: "about 39 characters a line
   like the widest practice panel, and 0.15in taller, so it holds a little
   more"; the check measures the four named shapes; the refusal says "the slide
   designer has no roomier panel to give it". The half side is 6.3465 by 6.65in
   in every `split-h-50-50` I drew (either side, with an instruction, a
   subtitle or a chip header).
5. **A test that a picture above takes at most half the height: done.**
   `picture.h <= 0.5 * (7.25 - picture.y)`; taking the whole height, or 60%,
   is caught.
6. **Its notes:** the widest refusal no longer offers "a wider or taller
   composition" (done, see below); `maths-turn-ref-sc`'s number line and the
   lesson designer's guidance are not done and are named in "Not done yet";
   the two still-flagged slides are now in the report; the test count is
   corrected to 12 of 18 failing on 4.2.288, which I confirmed.

## The repairs' own code, found sound

- The settling short-list mend: bounded, monotone, cannot change a fitting list (above).
- Widening only on `STEP_TEXT_OVERLOAD`: every other refusal is raised at the width where it happened; fraction-wall slides 5 and 9 to 12 give HEAD's exact words, now before anything is drawn.
- Eq-fractions as a delivered deck: slide XML identical under both builders; only the build diagnostics for slides 7 and 8 differ (finding 2).
- The quiet tries: `quiet` is a counter restored in `finally`; nothing drawn for real runs inside one.
- The lesson check agrees with the builder shape by shape: 0 disagreements in 6,400 random lists with at most one sticky line; with two, the check is only ever the looser (26 lists), as the report says.
- The check reads the builder's letter table (code points, the same cancelling allowance, the same word splitting, the same mark and reveal handling); a dash cannot reach a slide from a valid design, so the sanitiser's dash rewrite cannot split them.
- The check's message is true on a real refusal ("its 7 steps take 18 lines (step by step: 3, 2, 2, 2, 3, 3, 3) ... which holds 15 lines of about 40 characters for 7 steps") and keeps decisions 3, 12 and 13: it asks the writer to tighten, never for fewer criteria, and tells nobody downstream to reword.
- The widest refusal's new wording is true: a list only the half side holds is refused at 6.35in with "The practice panel is already as wide as it goes ... the half-width split ... is a little taller and can hold what this panel cannot, never fewer criteria", and the half side then draws it at 18pt.

## Evidence, rerun

- Whole builds: 87 of 98 decks build under both builders; the same 11 are refused by the spec check under both (the 67 rule, font floors). Of the 80 saved decks that build, 75 are identical in slide XML and pictures; the other 5 differ only on the 11 newly drawn slides, whose new pictures are the only picture differences.
- In-process, all 1,123 saved slides: 1,048 identical, 11 newly drawn at the width each always had (the report's eleven), 64 refused under both (finding 2). No practice panel is drawn wider than 4.60in. The 7 scratch test decks: 37 newly drawn, 17 identical, 4 refused under both.
- Saved designs: HEAD's check and today's give identical output on all 85 distinct designs; all 74 distinct steps lists pass the new measure, every one held by the 4.60in panel, the longest taking 9 lines in the half side.
- Rendered deck: every step at 18pt or more and readable, nothing clipped, the widest panel 6.35in (41% of the slide). Four long lists take 5.50in and two 6.35in on every template. Number lines sit above the working space at 5.50 and 6.35in. A widened slide with a landscape photo shrinks it to 2.79 by 1.86in and a square to 2.79in, each flagged once below its floor, as the build log says; a portrait draws unflagged; the 4.60in landscape is flagged as it was at HEAD.

## Tests and pins, attacked

Each line is one change made alone, then both whole suites. "Guidance test" is
`test_the_guidance_says_what_the_builder_and_the_check_now_do`; "parity" is
`test_the_lesson_check_and_the_builder_give_the_same_verdict`; "either side" is
`test_either_side_of_the_new_limit`; "long lists" is the builder test that draws
the six long lists on all four templates.

| Change | Caught by |
|---|---|
| Mend 1 undone | its own test, the half-side test, long lists, parity, either side |
| Mend 1 at every size | keep-size test |
| Mend 2 undone | its two tests, parity, either side |
| Mend 3 undone | its two tests, parity, either side |
| Repair 1 undone (sized once) | shallow-band test |
| Mend 3 takes the whole panel | RE single-step test |
| No widening; widest first; 5.50 skipped; widening to 7.00 and 7.80 | 4 to 8 tests each |
| Repair 2 undone (any refusal widens) | fraction-wall test |
| No-width refusal given the 4.60 card's numbers; widest flag not passed; widest words back to "a wider or taller"; "or fewer criteria" | the no-width test |
| Panel grows left not right; question, working side, cards, either reference, the ref-sc working space not giving up the width; your-turn or writing panel drawn at 4.60 | long lists (the working side also by the number-line and photo tests) |
| Picture never above; above takes the whole height; above takes 60% | number-line test |
| Every picture above when widened, photos too | photo test |
| Picture moves above at 4.60 too | nothing (finding 5) |
| Tries raise warnings; the switch never turns back on | photo test, warnings test |
| Repair 3 undone; picture-floor store ignores the switch; either try records its findings | photo test or warnings test |
| Zone-fill store ignores the switch | nothing (finding 5) |
| Missing-picture store ignores the switch | nothing, and harmless (finding 5) |
| Check not called | the refusal test |
| Check drops the half side | 242 tests |
| Check's half side 0.15in shorter; check adds the top 60% band | sizes test, parity, either side |
| Check measures only the widest practice panel | sizes test |
| Practice panel 0.10in shorter in the builder only | long lists, keep-size test, either side |
| Check reads marks as printed; check's letter widths without the allowance cancelled | parity (and either side) |
| Check without its short-list rule, sized once, or without its allowance | nothing, and harmless (finding 5) |
| Refusal says drop criteria; says the slide designer will shorten it; back to "no slide can give it more room"; loses its numbers | the refusal test |
| `slide-success-criteria.md`: widths sentence gone; "never past half the slide" gone; "never cut to fit" softened | guidance test, SC-K06 (and SC-DEC-11-FIT for the first two) |
| Nothing-to-choose sentence gone or softened; half-width sentence gone or back to "as much as the widest practice panel holds"; lesson-check sentence gone | guidance test, SC-K06 |
| The 4.2.288 sentences put back | guidance test, SC-K06, SC-DEC-11-FIT |
| The new sentences moved to the end of the file, or into the next section | SC-K06, SC-DEC-11-FIT (section pins) |
| `templates.md` paragraph gone; its last sentence gone | guidance test |
| `templates.md` "never past half the slide" gone; "nothing to set" turned into an instruction; paragraph moved to the end | nothing (finding 1) |

## Suites

In the plugin folder: Python 2189 passed, 1 skipped, 71,510 subtests; builder
727 passed; worksheet 722 passed; working wall 142 passed. The same as the
report.

## Honesty

- Sizes in the report and the build log match the files to the byte: instructions +1,349, programs +20,529 (validator +10,068, `maths-turn-sc.js` +4,733, `steps.js` +3,749), tests and pins +100,424 of which the fixture 55,552, build log +11,554.
- Both `plugin.json` files say 4.2.289.
- No em or en dash was added to plugin prose or code; the one in the new fixture is a saved lesson's own step.
- The two pin moves are as described, with the reason beside them, and the mapping rebuilds exactly.
- Not true as written: the template-paragraph claim (finding 1), the fraction-wall and "refused the same way" sentences (finding 2), and "five templates" (note).

## What I would fix before release

1. Hold the whole `templates.md` paragraph, and where it sits, in a test or a pin (finding 1).
2. Correct the build log and the report on the fraction-wall lesson and the "refused the same way" count (finding 2), and the template-paragraph claim.
3. Add one line to "Not done yet": a list the lesson designer cannot tighten ends the run blocked, with no deck (finding 4).
4. His call, small: reword the two bottom-strip sentences and move SC-K38 (finding 3); add tests for the zone-fill store's silence and for a picture at 4.60in that cannot sit beside (finding 5).
