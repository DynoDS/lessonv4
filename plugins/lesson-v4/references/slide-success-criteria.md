# Success criteria on slides: placement mechanics

The Slide Designer reads this reference whenever the current source unit has `successCriteriaRefs` or `stickyKnowledgeRefs`. The constants are simple: source-authored success-criteria wording stays exact, every referenced criterion or sticky fact remains available on that source unit, and wording is never shortened to fit. This reference holds the placement mechanics for exact `successCriteriaRefs` and for a sticky fact already named in the current source unit's `stickyKnowledgeRefs`.

### Terminology: Success Criteria Helpers

**Success Criteria Helper** is the plain-English name for a small, fixed visual placed beside a success-criteria step when that step names a stable visible mark, placement, structure or movement the child makes. Success Criteria Helpers live in the same shared visual catalogue as normal full-size helpers. Every visual is audited as `full-size`, `SC-inline`, `both`, or `unsuitable`: reuse full-size geometry when it remains readable, give it a deliberate simplified inline treatment when detail would collapse, and allow an `SC-inline`-only entry when the tiny cue is useful but no standalone diagram is needed. They are never emojis, AI-generated pictures, or external assets.

A catalogue line records an audited decision; it does not make an arbitrary full-size visual suitable. Before adding one, build the proposed geometry at the real 0.68in-wide by at-most-0.62in-high slot, render it on a representative Success Criteria panel, and inspect the slide at full size. Reuse the full-size geometry only when the named mark remains unmistakable. Otherwise add a simplified inline mode to the same shared geometry module, or classify the cue as unsuitable. Never copy the drawing into a Success-Criteria-only library.

## Prefer a slot that labels the panel

The SC needs to read as the success criteria, not as a free-floating list. The fixed `*-sc` templates and the `sc-panel` content object carry a "✓ Success Criteria" heading automatically. The standalone `success-criteria` template does not: it prints "Success Criteria" as the slide title over a plain body zone, so a `steps` object placed there keeps its own heading. Because a `*-sc` panel already prints the heading, a `steps` object you place inside its criteria slot should leave its own `heading` blank: a `heading: "✓ Success Criteria"` there is redundant (the builder drops a heading that just repeats the panel label), so save the field for a heading that says something different. The `steps` `heading` is otherwise for bare free-template zones (a `split-h-60-40` `secondary`, the steps inside a plain body) that have no label of their own.

Prefer the labelled slot over dropping the steps into a bare `primary`/`secondary` zone of a free template, where a child sees a column of imperatives under the question and has no way to tell those steps are the standard to work to.

## One success-criteria object keeps one visual identity

When procedural `steps` are shown inside a success-criteria panel, use the same internal treatment whether the panel comes from a fixed `*-sc` template or the free `sc-panel` content object:

- pale green outer panel;
- `✓ Success Criteria` heading;
- one compact white card per criterion;
- green number badges;
- one shared readable step-text size.

Only the panel dimensions change with the layout. Do not switch the same procedural criteria to a flat divided list merely because a free template carries it.

## When a free template is the right geometry, wrap the criteria in `sc-panel`

Sometimes a free template genuinely is the right geometry, most often because the criteria is a *wide visual reference* (a labelled `row` of diagrams) that needs a full-width strip the narrow `*-sc` side-panel can't give. There, wrap the criteria in an `sc-panel` content object so it keeps the full green-box identity (the rounded green box and the "✓ Success Criteria" label) wherever it sits, instead of rendering as a bare list or row a child reads as just more content. Use `sc-panel` only *outside* the `maths-*-sc` templates; their own criteria slot already draws the box, so wrapping there would double it.

## Fit the complete reference, not a step-count quota

Five short steps is a useful default, not the capacity of every composition. Try the complete approved method in the existing `*-sc` panel. If it cannot share the screen with readable questions and a genuinely usable working surface, use a roomier free composition with `sc-panel`; changing panel width and height is a presentation decision, up to half the slide's area. The build refuses a bigger panel (`SC_PANEL_TOO_LARGE`) on any slide but a `success-criteria` slide, whose only job is the criteria and which may fill the slide; past half, show fewer criteria on the slide or give them that slide of their own. Keep the order, wording and necessary steps together wherever children need the whole method. Do not split the concept, drop steps, merge their wording or fragment an otherwise coherent practice set to fit the default sidebar.

Steps carry an 18pt minimum through both initial layout and the final text-fitting pass. That floor is a backstop, not a claim that every slide at 18pt is good: inspect the rendered task, reference and writing space together at projection size. A word-count review cue is not permission to shrink text or bypass a failed build. If no supported composition can present the necessary work, report the specific representation or layout capability needed through the existing repair route rather than pretending the lesson only needs five steps.

## Bind a live-drawing cue to its own reference

When setting `flipchart: true`, put `criteriaRef: "sc-001"` beside it on the same cue owner: the slide for a fixed `*-sc` template, or the `sc-panel` object in a free layout. It must name the source criterion actually shown inside that panel and be included in the slide's `successCriteriaRefs`. Do not put the flag on an arbitrary nested object or in notes; those locations do not draw the cue. Existing specifications without `criteriaRef` remain valid when the panel's content identifies one source unambiguously. The handoff check verifies each cue separately, even when marked and unmarked criteria share a slide.

## Keep the SC beside what its steps refer to

When a step points at the question or task ("read the question: what am I comparing?"), the question has to be on the same slide, or the step has nothing to point at. A labelled slot is the goal, but never at the cost of stranding the steps on a question-less slide. When the steps reference the question, choose a template that holds the question and the steps together (a body zone with the question line above a `steps` object) rather than the full-slide `success-criteria` template, which leaves no room for the question.

## Success Criteria Helpers: a visible-mark step shows that mark

When a success-criteria step names a stable visible mark, placement, structure or movement the child will physically make, place the matching Success Criteria Helper beside that step. This includes notation, sorting destinations, transformation movements, diagram structure and construction actions. An ordinary thinking or calculation step stays as plain text. The helper shows the action itself, never an emoji, and it does not license a decorative picture beside every criterion.

Keep the lesson-designer's step wording verbatim. The slide-designer changes only that step's JSON shape from a string to `{ "text": "...", "helper": "..." }`; the visible words do not change. Existing lesson JSON using `figure` remains supported as a compatibility alias, but new lessons use `helper`. The shared catalogue is:

| Helper key | Size support | Shared geometry / small treatment | Use only when the step tells the child to… |
|---|---|---|---|
| `venn-overlap` | `SC-inline` | `venn`; compact circles with the overlap marked | place an item that matches both criteria in the overlap |
| `venn-outside` | `SC-inline` | `venn`; compact circles with the outside region marked | place an item that matches neither criterion outside both circles |
| `carroll-one-box` | `SC-inline` | `carroll`; label-free 2×2 grid with one cell marked | place each item in exactly one Carroll-diagram box |
| `angle-arc` | `both` | `angle`; inline shortens the arms and enlarges the arc and strokes | mark an angle with an arc |
| `dash-equal-sides` | `both` | `triangle` (isosceles); the same tick-mark geometry scales inline | mark equal sides with matching dashes |
| `reflect-across-line` | `both` | `reflection-grid`; inline omits the tiny grid and keeps two bold shapes plus the mirror line | reflect the shape the same distance across the mirror line |
| `translate-shape` | `both` | `translation-shape`; inline removes grid numbers and keeps one unchanged shape moving | move every vertex the same direction and distance |
| `label-with-leader` | `SC-inline` | `label-diagram`; target dot, ruled leader and label line | connect a label to the exact part with a ruled leader line |
| `arrow-parallels` | `both` | `line-pair`; the same parallel-arrow geometry scales inline | mark parallel lines with matching arrows |
| `square-corner` | `both` | `line-pair`; the same right-angle geometry scales inline | add the right-angle square |
| `line-of-symmetry` | `both` | `geoboard`; inline omits the tiny pegs and keeps a bold outline plus dashed symmetry line | draw a line that divides the shape into matching halves |
| `bar-model-parts` | `both` | `bar-model`; simplified divided bar without task values | split a whole bar into its parts |
| `bar-model-compare` | `both` | `bar-model`; simplified aligned bars with the difference gap | align two bars and show the difference |
| `tally-five` | `SC-inline` | `tally-chart`; reuses the chart's tally-stroke layout without its frame or headings | draw the fifth tally across the first four |
| `turn-clockwise` | `SC-inline` | compact curved-arrow treatment owned by `turn-diagram` | turn clockwise |
| `turn-anticlockwise` | `SC-inline` | compact curved-arrow treatment owned by `turn-diagram` | turn anticlockwise |
| `jump-right` | `SC-inline` | compact number-line treatment; values stay in the question | jump right on a number line |
| `jump-left` | `SC-inline` | compact number-line treatment; values stay in the question | jump left on a number line |
| `plot-grid` | `both` | `coordinate-grid`; inline hides axis numbers and keeps only the across-then-up route | plot a coordinate across, then up |
| `join-in-order` | `SC-inline` | simplified numbered points and route arrows | join plotted points in the stated order |
| `close-the-shape` | `SC-inline` | simplified open shape with the closing edge highlighted | connect the last point back to the first |
| `count-scale-intervals` | `SC-inline` | value-free equal tick intervals shared by dials and measuring containers | count equal scale intervals before reading the value |
| `number-pyramid` | `SC-inline` | two neighbouring boxes feeding the box above | combine neighbouring boxes to make the box above |
| `draw-bars` | `SC-inline` | `bar-chart`; label-free equal-width bars from one baseline | draw equal-width bars to the correct heights |
| `one-per-column` | `SC-inline` | `place-value-chart`; one mark in each generic coloured column | put one digit or counter in each place-value column |
| `count-array` | `SC-inline` | compact rows-and-columns grid owned by `area-grid` | count both the rows and columns of an array |
| `part-whole` | `SC-inline` | one whole linked to two task-value-free parts | place the whole and parts in the correct circles |

Entries marked `SC-inline` are deliberately compact actions, not fake standalone diagrams. Use the normal task-specific full-size visual (`venn`, `carroll`, `tally-chart`, `turn-diagram`, `numberline`, `bar-chart`, `place-value-chart`, and so on) in the teaching area, and use the catalogue key only beside the matching step. For a `both` entry, request the normal full-size content type and request the compact treatment by its helper key on the step.

The code audit in `shared/visual-parity.js` covers every visual primitive, including those kept full-size or judged unsuitable. Adding a new visual requires an audit decision there. Adding a helper requires measured shared SVG geometry, a real inline treatment, validation and rendered inspection; a catalogue name on its own is not enough.

```json
{ "type": "steps", "steps": [
  { "text": "Dash the equal sides.", "helper": "dash-equal-sides" },
  "Write the side lengths.",
  { "text": "Mark the square corner.", "helper": "square-corner" }
] }
```

Within a set, Success Criteria Helpers are intentionally mixed: the steps that name a visible mark get one and the ordinary steps do not. This is deliberate because each helper identifies a particular visible action; it is not a decoration applied to every line.

## Sticky knowledge shares the panel

When a sticky fact needs to be visible on a practice slide (My Turn / Our Turn / Your Turn), the default is to fold it into the success-criteria panel as a reference line: the criteria slot takes two things, the SC steps plus one reference, rather than a separate box beside it. A separate box is fine when there's a reason; the combined panel is the default, and it keeps the practice slide from carrying the SC, a sticky-knowledge box, the question and a working zone all at once.

Open the folded line with ✨ as its first character in the `steps` array. The leading ✨ is the signal the builder reads: it renders that line full width with the star as its marker and no number badge, and the genuine steps keep counting 1..N around it. Without it the builder numbers the fact like any other step, and a child reads "the ones stay the same" as the next thing to *do* rather than a rule to remember. (A ✨ anywhere else in the line doesn't trigger this; it has to lead.)

When the success-criteria panel is already filled by a multi-row branch or lookup table, do not crush the table merely to force a second box into the same slot. This exception changes **physical placement only**. It does not authorise omission of a fact named in the source unit's `stickyKnowledgeRefs`. If the same fact is already visibly expressed by the table or success criteria, render it once under the existing same-slide deduplication rule. Otherwise choose another pupil-visible treatment or a roomier composition. Speaker notes alone do not satisfy a `stickyKnowledgeRefs` entry.

When a slide's sticky-knowledge fact is the same sentence as the slide's Teach key sentence, render the sentence once, with its sticky-knowledge visual treatment (the ✨ marker, or whatever the template provides), never twice. Two visually-identical sentences sitting two centimetres apart on one slide reads as a copy-paste error to a child, not as emphasis. The cross-slide repetition the lesson-designer's "phrasing consistency" rule asks for happens *between* slides; on one slide, one render.

The same holds when the sticky fact restates the success-criteria steps. A sticky line appears only when the current source unit's `stickyKnowledgeRefs` names that fact; the lesson-designer has already made the pedagogical availability decision. When a spec still hands you a sticky line that only says what the numbered steps already say, let the steps be the reference and add nothing: a restating line reads to a child as a puzzling extra step under the method.
