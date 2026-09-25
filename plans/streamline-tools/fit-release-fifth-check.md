# Fifth check of the long-criteria fit release (4.2.289): the mark, the 16pt drawing, the cue and the rarest case

Checked on 25 September 2026 by a fifth fresh reader, against the fourth check
(`fit-release-fourth-check.md`), the handover (`fit-release-handover.md`), the
report (`fit-release-report.md`), the change scripts `c5b` to `c5d` and the
teacher's words at the end of `plans/2026-09-23-long-criteria-fit-investigation.md`
and in the success-criteria ledger's decisions. Nothing in the repository was
changed except this file. Every working file is in
`plans/streamline-tools/scratch/fitchk5/`. The plugin's files were hashed at the
start and at the end of the check and did not change.

## What I did

- Read every changed and new line of the plugin (`git diff HEAD -- plugins/lesson-v4`
  and the seven untracked files), the build-log entry, the report and the handover.
- Made an untouched copy of the whole plugin (`copy/`, everything but
  `node_modules`, the ledgers from `plans/` beside it) and ran the five ledger pin
  tests there first; then rebuilt the success-criteria pins with copies of
  `ledger_mapping.py` and `build_sc_mapping.py` pointed only at that copy
  (`point_mapping.py`).
- Built one lesson end to end in each state of a list (`e2e.py`, results in
  `e2e/report.txt`): the lesson check unmarked and marked; the review page; the
  list copied onto all eleven list slides of a saved deck
  (`friday-round-to-10-reteach`: six practice slides, five `split-h-60-40` slides)
  with a design beside it; the slide designer's own check; the run's own build
  command (`run-fixed-resource.py slides`); the step sizes in the written deck;
  and the pages rendered and looked at.
- Built and rendered a deck of marked lists on all four practice templates, in
  the half-width split at 16pt, beside a sticky line, and the rarest case
  (`look.py`, `look/render/`). Probed free layouts (`free_zones.js`), sticky lines
  (`sticky*.js`, `sticky3.py`) and the slide check's real faults (`checkfaults.js`).
- Ran the four suites in the plugin folder; compared HEAD's lesson check and
  today's over every saved `lesson-design.json` (`designs.py`); built every saved
  `lesson.json` with HEAD's builder and today's, each in its own scratch folder
  with its design and pictures, and compared the written decks slide by slide
  (`compare_decks.py`, `compare_decks2.txt`); rendered the slides that changed.
- Attacked this round's code, tests and sentences: 57 changes, each alone in one
  of four more copies of the whole plugin (`m1` to `m4`), then the whole builder
  suite and the fit, review, contract, scaffold and success-criteria pin tests;
  the four nothing caught were run again against the whole Python suite
  (`mutate.py`, `mutate-run.txt`, `mutate-whole.txt`, `mutations/`). Every copy
  was put back and matches the plugin.
- Measured sizes and looked for added dashes (`sizes.py`, `sizes.txt`).

## Findings, most serious first

### 1. A mark the lesson check calls stale still draws the list under 18pt, on slides the slide designer could have repaired, and tells the teacher something untrue

The builder honours `tooLongForPanels` wherever it meets the list's words, and a
free layout's panel lowers the floor wherever the slide designer put it
(`success-criteria-panel.js`: `(!zone.practicePanel || zone.widestPracticePanel)`).
It never asks whether a shape the guidance names holds the list at 18pt. The
lesson check does ask, but for a list it does not find too long it only prints a
note ("take the mark out"), and the review page only asks the reviewer to "say
so in your review". Nothing in the playbook or the lesson designer's file reads
a `LESSON_DESIGN_NOTE`, and a review that says so and approves leaves the mark in
place, so a stale mark reaches the build.

- **In a built deck** (`e2e/deck-stale`): a seven-step list the widest practice
  panel holds at 18pt, marked. On the six practice slides it draws at 18pt. On the
  five `split-h-60-40` slides it draws at 17pt, reported as
  `CRITERIA_BELOW_READABLE_FLOOR` with `faultClass: "content"`, the design's to
  leave. Unmarked, the same five slides are composition faults that name a roomier
  shape, and the slide designer moves them to 18pt. Page 3 of
  `e2e/deck-stale/render/` shows the 17pt list; page 7 the same list at 18pt.
- **On a practice template**: a six-step list only the half-width side holds at
  18pt (the check says so), marked, draws at 17pt at 6.35in; unmarked it is
  refused with "the half-width split (`split-h-50-50`) ... can hold what this panel
  cannot" (`sticky.txt`).
- **A sweep** (`free_zones.txt`): 25 list-and-zone pairs where a list a named
  shape holds at 18pt, once marked, is drawn at 16 or 17pt in a 40% side or a 30%
  column that refuses it unmarked. (For lists the check really finds too long, the
  sweep found no free panel that drew them smaller than a named shape would.)
- **The message the teacher gets** on each such slide is untrue: "the lesson
  design marks the list too long for every criteria panel (`tooLongForPanels`),
  because the lesson designer could not tighten it".

How it arises: the review line beside a marked list asks for it to be tightened
"until it fits at 18pt"; a lesson designer who does so and does not also clear
the mark (the contract says when it may be true, but nothing asks the designer
to look at it again after tightening, and the note that says so is printed
beside a pass, which nothing in the run is told to read)
leaves a stale mark, and the reviewer is then told only to mention it.

It contradicts the build log ("a list that fits at 18pt somewhere keeps exactly
what it had, marked or not"), the handover ("a marked list is drawn in its
widest panel at the largest size that fits, down to 16 point"), his "The 18 point
floor stands for everything else" and "repair first". The report's decision 9
says a free panel "goes under 18pt where the slide designer put it", but not
that this reaches lists that fit at 18pt.

Fix, smallest first: in the builder, lower the floor for a marked list only when
neither the practice panel at its widest nor the half-width split holds it at
18pt (the build already draws those two shapes for `markedListRoom`), so a
stale mark changes nothing and an unmarked-looking slide stays a composition
fault with its roomier shape named. That also makes the log sentence and the
flag message true.

### 2. A sticky line beside a marked list goes under 18pt too

When the floor is lowered, the step fitter lays out the whole panel at it,
sticky reference line included, and names that line
`marked-step-reference-N`, which the final text fit lets go to 17 or 16pt (the
Python test pins it: `floor("GROWFIT__...__MIN17__marked-step-reference-2") == 17`).

- A properly marked seven-step list with "✨ Five or more rounds up." beside it:
  the sticky line is laid out at 17pt on `maths-turn-sc` (`sticky4.txt`).
- In a written deck (`sticky3.txt`, `look/render/Look-page-06.png`) the sticky
  line is at 17pt on every slide that carries one.
- Unmarked, the same slides are refused with "the sticky-knowledge reference line
  does not fit its card at the 18pt readable minimum ... carry the fact in its own
  on-slide treatment, or give the zone more room", a repair the slide designer
  can make.

The sticky line is sticky knowledge, not the marked list. The log says the final
fit "lets those lines, and only those, go under 18pt", and the report's "Noticed"
item mentions a sticky line only as a way to reach the rarest case. Fix: keep the
sticky line at 18pt beside a marked list (its old name and an 18pt measure), so
one that does not fit is refused and moved out as today; or, if he would rather
it shrink with the list, say so in the log, the report and the slide guidance.
His call only in the second case.

### 3. The report still says a marked list too long even at 16pt is refused

Under "The check and the guidance name the same shapes", the report says
"**The refusal now reads**" and quotes this round's predecessor: "Even at 16pt it
does not fit, so marking it would not let it through." and "It then lets the list
through if it fits at 16pt, but it costs ...". The check now says "Even at 16pt
it does not fit: marked, it would pass with a note, but every slide that shows it
would reach the teacher as a page to check with nothing drawn on it, so tighten it
at least until it fits at 16pt." and "It then lets the list through, and it costs
... ; a list too long even at 16pt cannot be drawn at all ...". The next quote is
introduced "Marked, that same eight-step list is refused like this:"; it now
passes with a note (`e2e/report.txt`). "What changed, file by file" still says a
marked list the smaller panels do not hold "is sorted as `beyond_smaller` and
refused with the 16pt measure", and its test list says "one too long even at 16pt
refused". The caveat that these are an earlier round's words is 120 lines away,
in another section. The "In short", the last-round section, the log and every
file in the plugin state the true cost; these three places do not.

### 4. Tests that hold less than the release says

Four of the 57 changes pass every suite (whole builder and whole Python suites):

- **V2, a mark left `false` counted as a mark** by the lesson check. The scaffold
  writes `"tooLongForPanels": False` on every list, so `is True` is exactly what
  stops a list being marked by accident, and nothing tests it on the check's side
  (the builder's side is tested, B1).
- **V5, the note printed after the pass line.** The log says the note "comes
  before anything else the check prints"; the two go to different streams, so
  only "first line of the error stream" is held. Harmless.
- **G2 and G6, a sentence elsewhere that undoes a pinned one** ("A list marked too
  long may be shortened by the slide designer until it fits at 18pt." after the
  slide guidance paragraph; "Any long success-criteria list may simply be marked
  `tooLongForPanels: true`." in the lesson designer's file). The pin limit the
  third and fourth checks named (their T3 and T7); the report leaves it, which is
  reasonable.

### 5. Smaller

- **The lesson designer's focused repair may mark first.** It is told to make the
  smallest change that clears the validator, and marking is smaller than
  rewording. The refusal's order ("Tighten ... first") and the review page's
  conditional question are the guards. Noted only.
- **Balanced diet slide 7** (`output/working/what-is-a-balanced-diet...`), one of
  the report's eleven that now draw, now shows four text boxes overflowing their
  cards (flagged `TEXT_OVERLOAD`, as the report says, "for other content the old
  refusal had hidden"), where HEAD delivered a page to check
  (`decks/047/render-head` and `render-now`, page 7). From before this release.

## The fourth check's findings, one by one

1. **The forgiving flag match: done, by removing it.** No code reads a flag's
   words; `flagsForTeacher` is only type-checked. The fourth check's own flags let
   nothing through (test), and a mark covers exactly the list it is on in the
   check (V1 caught). Sound.
2. **The note that could delete a needed flag: done.** The note is now about a
   mark, and fires only on a list the check does not find too long, so it can
   never ask for a needed mark to come out. Sound, but nobody acts on it
   (finding 1).
3. **The review line: done.** Under its list on the built page (R5 caught), "after
   trying to tighten it" (R7 caught), asking whether it "could be tightened until
   it fits at 18pt". Sound.
4. **The slide designer told to leave what its file says to repair: done in the
   build.** A list drawn smaller is `content` and not a finding the check refuses
   over; the rarest case is `content` with "Leave the slide flagged"; a marked list
   a named shape holds at 16pt is still `composition`, so the slide designer moves
   it. `slide-designer.md` is unchanged and agrees. Sound, except for stale marks
   (finding 1).
5. **"A near miss never withholds the deck": gone** with the matching. Sound.
6. **The test holes: T2 held now; T3 and T7 still open** (my G2, G6).

## The three changes since, and the rarest case

- **The mark.** Cannot be set by accident: the scaffold writes it false (G7
  caught), the check refuses anything but a boolean (`"true"` refused in
  `e2e/report.txt`), the builder reads only `=== true` on a steps list (B1
  caught). It carries to no other list in the check (by index, V1 caught); in the
  build it is known by the list's words, so an identical twin list shares it, but
  the check would refuse the twin unless it were marked too. Beside a marked list
  the reviewer is asked, conditionally, to return `REDESIGN REQUIRED` naming the
  tightening; beside one too long even at 16pt, unconditionally (R1 to R4 caught).
- **The 16pt drawing.** Never under 16pt (B6, F2, F3 caught; the written deck's
  marked lines are 16 or 17pt). Never clipped: seven drawn pages at 16 and 17pt
  looked at, every line inside its card. The box widest first on every practice
  template (P1, T1, T2 caught; every drawn-smaller practice panel is 6.35in).
  Only marked lists under 18pt: not quite (findings 1 and 2).
- **The slide designer's check.** The cue is `cue: true` (K1, K2 caught), a note
  in the check, pass or fail (C1, C2 caught), and `faultClass: "note"` in the
  build (BD5 caught). A real fault still fails: a long fixed caption fails
  `SLIDE_DESIGN_CAPACITY`, an unmarked list too long fails with its composition
  fault (`checkfaults.txt`).
- **The rarest case.** A marked list too long even at 16pt passes the lesson check
  (exit 0, `LESSON_DESIGN_OK` alone on standard output, the note first on the
  error stream); the review page asks for it back; `run-fixed-resource.py slides`
  writes the deck, exit 0, with all eleven list slides flagged as pages to check,
  `content`, "Leave the slide flagged" (`e2e/deck-beyond`, `look` page 7). Sound.

## Found sound

- Nothing after the lesson designer is told to shorten, reword or drop a criterion; the rarest case's message asks for nothing (B9 caught).
- The refusal keeps its order: tighten first, the mark only "if you have tightened it and no step can lose a word".
- The true cost is stated the same way in the refusal, the note, `output-template.md`, `lesson-designer.md`, both review lines, `slide-success-criteria.md`, the builder's messages and the test names.
- A marked list that fits at 18pt on a practice template draws exactly as unmarked (B5 caught).
- The decision-11 route: a design with a list too long even at 16pt never stops the run, and the playbook's two redesign passes still end in a built deck.
- The drawn-smaller finding is recorded once per slide and on the delivered deck's list to check (B8, BD2, BD6 caught).
- The `faultClass: "note"` is read by nothing that expects the old classes.
- `lesson-design.json` is read beside the candidate the slide designer checks (`lesson.json.tmp.*` sits beside it) and beside the lesson the run builds.

## Suites, designs, decks, pins, sizes, dashes, the log

- **Suites, in the plugin folder:** Python 2,200 passed, 1 skipped, 71,655
  subtests; builder 740; worksheet 722; working wall 142. As the report says.
- **Pins:** on the untouched copy the five ledger test files pass (65 tests,
  69,593 subtests). The mapping builder, pointed only at the copy, prints
  `MAPPING_OK 467 pins; 80 changed rows mapped`, and its pins and mapping are byte
  for byte the working tree's.
- **Saved designs:** 90 `lesson-design.json` outside the scratch folders (85
  distinct) give identical output under HEAD's check and today's; none passes
  under either, for older faults. Their 98 steps lists all fit (the longest takes
  9 lines of the half side's 14 at 18pt), and none carries the mark.
- **Saved decks, built for real:** 91 `lesson.json`. Eleven are refused under both
  builders for older faults (nine in the same words; two lose earlier criteria
  refusals, `round-to-the-nearest-10-and-100` slides 4, 5, 6, 8 and
  `year-4-maths-lesson-2` slide 8, then stop at the same older fault). The other
  80 give 945 slides: 939 identical in every slide's XML and relationships (once
  the scratch path in a picture's alt text is evened out); 6 differ, all among the
  report's eleven that now draw: `partition-4-digit-numbers` 5 and 6, the
  September trials' history slide 16 (in two copies) and maths slide 15, and
  balanced diet 7. Partition 5, both history 16s and maths 15 leave the list to
  check; partition 6 and balanced diet 7 stay on it, for other content. No
  practice panel wider than 4.60in.
- **Sizes, to the byte, match the report's table and the log:** instructions
  +3,240 (+1,823 and +1,417); programs +47,645 (validator +19,062,
  `marked-criteria.js` +7,329, `steps.js` +5,938, `maths-turn-sc.js` +4,901,
  review page +3,115, `build.js` +1,947, panel +1,396, the switch +1,046, slide
  check +899, final text fit +724, the rest +1,288); tests and pins +157,198
  (fixture 55,552); build log +26,011.
- **Dashes:** none added. The only dashes on added lines are the existing
  "0.4 to 0.5" range (written with an en dash) in the edited `templates.md`
  sentence and its pin, and one saved
  lesson's words inside the fixture; in the change scripts, only quoted old text.
- **The build log's entry** matches the files and my runs, except "a list that
  fits at 18pt somewhere keeps exactly what it had, marked or not" (finding 1),
  "lets those lines, and only those, go under 18pt" (finding 2), and "comes before
  anything else the check prints" (true per stream only, finding 4). Its test
  counts (738 made lists, 3,000 random) match the tests.

## Tests attacked

Each change alone in a copy of the whole plugin; the whole builder suite and the
fit, review, contract, scaffold and pin tests; the four nothing caught were then
run against the whole Python suite.

| Change | Caught by |
|---|---|
| V1 one mark covers every too-long list | two-lists test |
| V2 a mark left false counts | nothing, whole suites |
| V3 a list too long even at 16pt refused again | passes-with-a-note test |
| V4 the check measures marked lists to 15pt | four fit tests |
| V5 the note printed after the pass line | nothing, whole suites |
| V6 the unmarked refusal's 16pt sentence dropped | goes-back-to-its-writer test |
| V7 the refusal's cost back to a blank page | drawn-smaller refusal test |
| V8, V9 either note dropped | stale-mark and note tests |
| V10 the note stops saying the reviewer sends it back | passes-with-a-note test |
| V11 any marked list counted as drawn smaller | review page test |
| R1 to R7 the review lines dropped, conditional, telling the reviewer to tighten, away from the list, saying tightening was skipped | review page test |
| B1 to B9 the build's mark reading, size choice, room check, finding and rarest message | builder mark tests |
| P1 to P3, T1, T2 smaller before widest, never in a free panel, always 16pt | builder mark and widening tests |
| S1 to S4 the fitter's floor, line names, warning, wording | builder mark tests |
| BD1 to BD6 the build's classes, flags, marks and findings | delivered-deck and slide-check tests |
| C1 to C3, K1, K2 the cue refusing, unprinted or unmarked; no spec-stage capacity refusal | slide-check cue and fixed-caption tests |
| F1 to F3 the final fit's floor | final text fit test |
| G1, G3 to G5, G7 the guidance, contract, designer's list and scaffold | guidance and contract tests, SC-K06 pins |
| G2, G6 a sentence elsewhere undoing a pinned one | nothing, whole suites |

## What I would still fix before release

1. Make the builder lower the floor only for a list no named shape holds at 18pt
   (finding 1), so a stale mark draws nothing smaller and the slide designer
   still moves the slide; the log sentence and the flag message then hold.
2. Keep a sticky line at 18pt beside a marked list, or, if he wants it to shrink
   with the list, say so in the log, report and guidance (finding 2).
3. Correct the three stale places in the report (finding 3).
4. Add a test that the lesson check ignores a mark left false (finding 4, V2).
