# Exchanging shown happening (18 October 2026)

## 1. Why

The teacher's flag on the exchange pictures in the round six maths week (Y4 lessons 29-33, column subtraction): "too static", "not really a relationship between them", "just showing 2 different place value charts", "things are just highlighted, circled... it doesn't actually feel like you could look at it and know what's happening". He doubted that "before" and "after" labels would fix it.

What is drawn today (lesson 29 slide 5, 52 - 28): the `place-value-chart` `pair`, two charts side by side (5 tens 2 ones, 4 tens 12 ones), the ten that goes ringed green on the left, the ten ones ringed on the right, a green arrow between the charts, and an empty written-sum frame below. The rings were added 6 October after "it just looks bland". The counters change size between the two charts. Nothing shows the ten moving or becoming ten ones, nothing takes away 28, and the counters carry no values.

Causes found:
- `shared/visuals/place-value-chart-svg.js` can only draw ONE before-and-after `pair`. No drawing shows one set of pieces changing.
- `references/subject-maths.md` (paragraph "Counters shown beside a written method show only the two columns...") prescribes the pair for every first written exchange.
- The 18 October "show it happening" rule (`preferences.md` -> `A slide that explains how something happens shows it happening`, lesson designer `seesHappening`) is written for pictures and photos; maths exchanges never meet it.
- Slides place every shared drawing as ONE PNG (`builder/src/content/shared-figure.js` `drawerFor`), so even a better still picture could not move.
- Related fault from round six: Thursday's slides drew wrong exchange working because the slide designer hand-lists `exchanges`, and nothing derives them from the numbers.

Evidence the fix works: a hand-made test deck (`morph-test/Exchange morph test.pptx`, python-pptx) of 52 - 28 as one chart, one move per slide, PowerPoint's Morph transition between slides. The teacher clicked through it on his Microsoft 365 PowerPoint: "it works! It works great". What it did: the exchanged ten in orange; on the next slide it sits in the ones column with a dashed outline where it was and an arrow; then it breaks into ten orange ones beside the 2 blue ones; the written sum's crossed-out 5, the 4 above and the small 1 appear in the same orange on the same clicks; taken-away pieces fade; answer digits appear green as each column is taken away.

His ruling on blocks or counters: "it doesn't matter! it should just decide what it thinks", unless the teacher clearly asks for one.

## 2. Acceptance

- A column subtraction or addition whose method includes an exchange can be shown as ONE chart of pieces whose pieces visibly move and change, click by click, with the written sum beside it changing on the same clicks, and the same colour tying the moving piece to the digits it writes.
- On slides, the moves are real movement in PowerPoint (Morph), and every slide still makes sense on its own with no movement (dashed outline where a piece came from, an arrow to where it went), so an older PowerPoint or a PDF still teaches.
- The exchanges are worked out from the numbers, never typed, so the picture and the sum can never show the wrong exchange.
- The same drawing reaches the worksheet, the working wall and the stick-in pack as one still picture of the exchange happening (one chart, outline, arrow, the ten ones already landed), never two charts.
- The plugin picks blocks or counters itself; a teacher's explicit request wins.
- Planning guidance stops prescribing the before-and-after pair for exchanges and asks for the happening drawing; the pair stays for what it is good at (10 more, 100 more: comparisons where `same` under the still columns is the teaching).
- Nothing else changes: every existing deck, sheet and wall that does not use the new drawing builds identically.

A superficially compliant but bad result would be: slides that move but where the pieces jump about (inconsistent names), pieces that resize between clicks, a sum that fills in on different clicks from the picture, a deck that opens with a repair prompt, or a run of slides whose criteria panel or title shifts between clicks.

## 3. The new drawing: `exchange-happening`

New shared module `shared/visuals/exchange-happening-svg.js`, one drawing for every surface, registered under the item type `"exchange-happening"`.

Spec (the board's spelling):

```
{ "type": "exchange-happening",
  "operator": "-",               // "-" or "+"
  "numbers": ["52", "28"],       // whole numbers, up to 4 digits
  "pieces": "blocks",            // optional: "blocks" | "counters"; left out, the drawing decides
  "step": 2 }                    // optional: which moment; left out on a slide = the whole run
```

Steps are worked out from the numbers, the way the method is done on paper, right to left:

- Subtraction: `start`; then for each column from the ones: if its top digit (after earlier exchanges) is smaller than the bottom digit, the exchange into it, as `move` (one piece of the next column left lifts into this column) and `break` (it becomes ten pieces of this column); a giving column that is 0 first receives its own exchange from further left (across a zero: hundreds to tens, then tens to ones), exactly as written; then `take` (the bottom digit's worth of pieces fade). One `take` per column.
- Addition: `start` shows the top number's pieces and, beneath them in each column, the bottom number's pieces; then for each column from the ones: `join` (the two groups slide together, the answer digit is written if no exchange), and when the column reaches ten or more, `move` (ten of them gather and lift into the next column) and `break` (they become one piece of that column; the small exchanged digit is written under the answer in that column and the answer digit for this column is written).
- Each step carries a plain sentence for the teacher's notes ("The ten moves into the ones.", "It breaks into 10 ones. Now there are 12 ones.", "12 ones take away 8 ones leaves 4 ones.").

What the chart holds to:
- One chart, column headings in the house colours, the sum beside it to the right (or below when the zone is tall and narrow), drawn by the existing calculation code in `place-value-chart-svg.js` so it looks exactly like every other written sum.
- Every piece keeps one size for the whole run; positions are a fixed slot grid per column, so a piece only moves when the method moves it.
- Counters print their value ("10", "1", "100", "1000"). Blocks: a ten is a rod of ten visible cubes, a hundred a flat, a one a cube; a thousand is drawn only as counters (see choice).
- The exchanged piece and everything it becomes are orange (`#E46C0A`, the wall's first exchange colour); the sum's exchange marks for that exchange are the same orange (calculation `exchanges[].colour`). A second exchange takes the wall's second colour (`#7030A0`), and so on, so in 541 - 263 each exchange has its own colour on the pieces and in the sum.
- On a `move` step: a dashed outline in the exchange colour where the piece was, and an arrow from it to where it is now.
- Taken-away pieces stay in place at low opacity (they "fade"), so what is left is the answer you can count.
- Answer digits are green (house answer colour) and appear on the column's `take` (or `join`) step.
- Choice of pieces when `pieces` is left out: blocks when both numbers have at most 2 digits (the size of a ten against a one is the idea); counters otherwise (flats, cubes of a thousand and 19 rods in a column do not fit a slide zone at a readable size). `pieces` given always wins.
- Size floors: the slide's 18pt digit floor applies to the sum; a zone too small refuses by name (`EXCHANGE_HAPPENING_DOES_NOT_FIT`) with the size it needs, as the place value chart does.

Paper and the still: on the worksheet, wall and stick-in surfaces (and a slide item given an explicit `step`), it draws one still picture. With `step` left out on paper it draws the `exchange` still: the moment of the first exchange with the outline, the arrow AND the ten pieces already landed, plus the sum with its exchange marks and no answer, so one picture shows what happens. `step: "end"` draws the finished state.

Exports: `tightSvg(spec, profile)`, `cacheKey`, `normalise`, `minWidthPt`, `stepsFor(spec)` (the step list, for the builder and tests), and `slideLayers(spec, profile)` -> `{ w, h, layers: [{ name, svg, x, y, w, h }] }` in points: the frame (headings and column fills), the sum, and one layer per piece, outline and arrow, each named stably (`!!xh-T-3`, `!!xh-ex1-O-7`, `!!xh-sum`, `!!xh-ghost`, `!!xh-arrow`) so PowerPoint pairs them across slides.

## 4. Slides

- `builder/src/happening-runs.js` (new, small): a pre-pass in `build.js` right after `expandTeachLayouts`. A slide holding an `exchange-happening` item with no `step` becomes one slide per step (`stepsFor`), each a copy with that item's `step` set, the first keeping its speaker notes and each later one getting notes of the step's sentence. Copies after the first are marked for a Morph transition. A `revealPair` on such a slide is dropped from the run (the run is its own reveal) with a build note. Every other slide is untouched.
- `builder/src/content/shared-figure.js`: the `exchange-happening` FIGURES row. When the module offers `slideLayers`, the drawer requests and places each layer as its own picture, at the layer's position, with `objectName` set to the layer's name; otherwise it places the one picture as now. Measuring and fitting use the whole drawing's size, which is the same on every step.
- `builder/src/morph-transitions.js` (new): after `pptx.writeFile`, alongside the other package passes (the pattern in `src/mark-decorative-images.js`), add to each marked slide `mc:AlternateContent` with `p159:morph option="byObject"` (duration 1.6s) and a fade fallback, right after `p:clrMapOvr`. This is the XML the test deck used and PowerPoint accepted (effect 3954, no repair).
- Everything else on the slide (title, criteria panel, decorations) is the same object on each copy, so it stays still.

## 5. Other surfaces

Wire the new type into the worksheet (`worksheet-html/src/helpers`, catalogue), working wall (`working-wall-html/src/svg-renderer.js`, `visuals.js`) and stick-in (`stick-in-sheets-html/src/visual-registry.js`) registries as a still, following how `base-ten-blocks` is wired, and declare it in `shared/visual-parity.js`. No surface-specific drawing code.

## 6. Guidance

- `references/subject-maths.md`: replace the "Counters shown beside a written method..." paragraph's instruction for exchanges with: an exchange is taught by showing it happening (`exchange-happening`: the pieces and the sum together, one move per click); the plugin chooses blocks or counters unless the teacher asks; the before-and-after pair is for comparisons (10 more), not exchanges. Keep the 16 October points that still hold (the sum, the picture and the criteria on one slide; no `1 ten = 10 ones` label box).
- `references/templates.md`: catalogue entry for `exchange-happening` (spec, that it becomes a run of slides with movement, its size, that it carries its own written sum so the slide needs no second sum item), and the pair entry pointing exchanges to it.
- `references/worksheet-helpers/catalogue.md`, `references/working-wall-card-contracts.md`, `references/stick-in-sheets-pedagogy.md`: the still, one line each where the pair is offered for exchanges.
- Lesson designer: no new rule; its existing `seesHappening` line already applies, and subject-maths.md is what it reads for the representation. Check `scripts/check-helper-coverage.py` maps an exchange representation to the new helper as covering it.

## 7. Checks and tests

- `shared/test/exchange-happening.test.js`: steps derived for 52-28, 4,252-1,128, 541-263 (two exchanges), 302-158 (across a zero), 47+35, 2,468+1,375, and no-exchange cases; same piece names and sizes on every step; pieces never overlap; exchanged pieces carry the exchange colour; the sum's marks match the steps; pieces choice rule; refusal when it cannot fit.
- `builder/test/exchange-happening-run.test.js`: a lesson.json with one happening slide builds N slides; marked slides carry the morph transition in the saved package; layer object names repeat across the run; slides without the item are unchanged.
- Parity guard and the full builder, worksheet, wall, stick-in and Python suites pass.
- Rendered check: a test deck of the six cases above, exported to pictures through PowerPoint, every slide inspected; one deck opened for the teacher to click through.
- Unchanged-output control: rebuild existing saved decks before and after and compare (the 16 October method, 80 decks identical).

## 8. Not in this job

- A full make-lesson run to see whether the planner and slide designer pick it up by themselves (costs a full lesson; offer afterwards).
- The vocabulary card's exchange picture (it stays the pair for now).
- Checking hand-typed `exchanges` on ordinary written sums against their numbers (the round six Thursday bug on sums without the new drawing): logged as a follow-up.
- Exchanges in multiplication and division.
- No commit, push or release without the teacher's say-so.

## 9. What the review changed, and what was built (18 October 2026)

An independent reviewer read this plan against the code first. Taken from it: the pieces are PowerPoint shapes, not pictures, as in the approved test deck (a picture changing colour only cross-fades); every slide number the build reports is turned back into the lesson.json slide (`sourceOf`), so the designer's tools still edit the right slide; a reveal pair stays on the run's last click only; the wiring list for every surface (zone table, helper map, measure, success-criteria audit, worksheet purposes and catalogue, manifest `geometrySource`); `exchange-happening` added to the helper check's place value words; the blocks rule decided by the whole sum (answer included); a piece takes the colour of the exchange it moves in (across a zero the hundreds' tens are orange, the ten that moves on is purple).

Changed while building, against the plan above: pieces show only the columns the exchanges move between (the 16 October ruling), and a column worked without pieces is written into the sum where it falls in the method, not at the end; counters stand five, four or three to a row and the sum sits beside the chart or under it, whichever lets the pieces be largest; `"steps": [a, b]` runs part of a method (a lesson whose earlier slide finished the ones); any slide showing the same sum as the slide before opens with Morph, so an answers slide after a run moves too; on paper the sum prints at 13pt so the small exchanged 1 clears the 9pt floor.

Built and checked: the drawing, the runs, Morph, all four surfaces, guidance, tests. The Week 7 decks (Monday, Tuesday, Wednesday, Friday) were rebuilt from their lesson.json with the static pairs replaced, after checking each deck on the drive was exactly what its lesson.json builds; originals kept in `morph-test/Week 7 decks before the change/`.
