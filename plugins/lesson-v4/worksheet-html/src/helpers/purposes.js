"use strict";

// One sentence per helper, saying what it is FOR.
//
// The engine has never needed this: nothing in it cares what a bar chart means.
// The worksheet-designer does. It is choosing between sixty-four things with
// nothing to go on but their names, and a name is not enough to tell a
// recording table from a data table, or a blank-surface from a number-line.
//
// So this is written for a reader who has to choose, and it is the reference
// document the designer reads - `npm run catalogue` turns this, the examples
// and each helper's own stated minimum into that document. Writing the
// catalogue by hand is what the old one did, and a hand-written catalogue drifts
// from the code the first time anyone is in a hurry.
//
// The same rule as test/helper-examples.js: a helper with no line here fails
// the tests by name. An undocumented helper is one the designer will never
// reach for, which is the same as not having built it.
//
// Say what it is and when to reach for it. Do not say how to configure it - the
// example does that, and it cannot go stale.

module.exports = {
  // ─── text ───
  instruction:
    "A quiet child-facing direction that needs no question number or answer space.",
  questions:
    "One-line read-off questions with a short answer space on that line; use written-answers when the prompt itself will wrap.",
  "written-answers":
    "A question answered in the child's own words, with ruled lines under it. " +
    "Say how many written things the prompt demands (`sentences`) and the " +
    "engine sizes the lines to the zone; `lines` sets an exact count.",
  "section-label":
    "The mode-of-work heading a block sits under: Fluency, Practise, Apply. Marks the kind of thinking, never the topic. Put it at the top of a stack.",
  "source-text":
    "A passage, account or extract the child reads and works from.",
  steps:
    "Success criteria or the steps of the taught method, in the same green panel the class worked from on the board. Nothing in it is written on.",


  // ─── tables ───
  "data-table":
    "Values HANDED to the child to read from: a price list, a timetable, a set of results. Nobody writes in it.",
  "recording-table":
    "A table the CHILD completes: supplied cells stay put and the rest stay tall and blank, sized by `writing` - `tick`, `number`, `word` or `sentence`, one size or one per column. Any other size is refused.",

  // ─── visuals ───
  "bar-chart":
    "A bar chart to read off. Each bar needs room for its label underneath, so more categories need more width.",
  venn:
    "Sorting into two overlapping properties. Blank is the frame the child fills; placed is the worked example. Not maths-only.",
  carroll:
    "A 2x2 sorting grid: the same idea as a Venn, read off a grid instead of overlapping rings.",
  angle:
    "A classified angle: two arms and a marking arc or right-angle square. It reads at a glance or not at all.",
  "line-pair":
    "The parallel, perpendicular or neither pair. Like an angle, it reads at a glance and gains nothing from growing.",
  triangle:
    "A classified triangle: filled body, tick marks, and an optional right-angle square or angle arcs.",
  "bar-model":
    "The White Rose bar model: a part-whole bar or a two-bar comparison. Any whole split into named parts fits it.",
  "blank-surface":
    "A draw-your-own surface (a bare number line, empty bar outlines) for a strategy the child constructs rather than fills in.",
  "coordinate-grid":
    "A numbered first-quadrant grid a child plots on.",
  "reflection-grid":
    "A dot lattice with a mirror line and a shape to reflect.",
  "translation-shape":
    "A numbered grid carrying a shape and its slid image, joined by an arrow.",
  geoboard:
    "A dotty-paper peg grid for drawing polygons on.",
  "grid-map":
    "A four-figure grid-reference map, usually the whole point of its sheet. " +
    "Invent each lesson's numbers, river and features; the example is not a template.",
  "line-graph":
    "A titled time-series line graph with numbered axes.",
  pictogram:
    "A row-of-symbols pictogram with a key, where one symbol stands for several.",
  "tally-chart":
    "A tally table: bundles of five drawn as marks rather than the number written out.",
  "rainforest-layers":
    "The rainforest cross-section, labelled by layer.",
  "balanced-pattern-plate":
    "A neutral proportional food-group plate. The five shares are fixed; you set each group's label, its example foods, and which groups arrive blank for the child.",
  "label-diagram":
    "A picture with a dot on each part it names, joined out to a printed label or a blank line for the child to write on. Every callout states which with `given`, and unstated is refused. Built around a PHOTOGRAPH.",

  // ─── drawn ───
  "clock-row":
    "A row of analogue clock faces, each with hands set or left blank for the child to draw.",
  "number-line":
    "A labelled number line with a `caption` beneath (\"Each interval is worth 100.\"): `jumps` between marks and a `highlight`ed space, or instead `boxes` at ticks, `arrows`, a ruler's `unit` and `object`.",
  "fraction-bar":
    "One or more bars divided into equal parts, some shaded.",
  ruler:
    "A ruler printed at TRUE SIZE for a child to measure against. It refuses a zone too narrow rather than shrinking, because a scaled ruler makes every answer wrong on a page that looks normal.",
  "dial-scale":
    "A round weighing scale: 0 at the top, numbered marks round the dial and a red needle at `value`, for reading a mass off a scale. `label` prints a line under it.",
  "measuring-jug":
    "A measuring jug with a scale up its side. Leave `value` off for an empty jug the child marks a level on; give it to show the level. `label` prints a line under it.",
  "number-network":
    "Circles joined by lines where each joined pair adds to `target`; a circle with no value is a blank the child fills.",

  // ─── forms ───
  "multiple-choice":
    "A stem, a tick instruction, then each option on its own line beside a tick box.",
  "sort-grid":
    "Named columns a child sorts words or items into. For somewhere to DRAW, use drawing-space: a sorting grid is a table and looks like one.",
  "drawing-space":
    "The boxed surface a child draws on, sized by what it holds: `draw`, `annotate`, or a stated height. Rare as plain working room, because children have books.",
  "column-method-grid":
    "Ruled boxes for a written column calculation: the numbers stacked, a thick-topped answer row, and a carry row. `showHeadings: true` adds place-value letters above the columns, derived from the numbers' own width.",

  // ─── matching ───
  "match-up":
    "Two columns of cards with a dot on each facing edge, for the child to draw the joining line. The columns need not be the same length.",
  "card-row":
    "A row of small titled cards, each optionally carrying a picture: plants along the foot of a sheet, artefacts under a timeline.",
  timeline:
    "A line across the page with named bands along it and dated points beneath, for placing events or artefacts onto.",

  // ─── frames ───
  "speech-scene":
    "Turns of a CONVERSATION: a figure and a bubble each, printed to read or empty to fill. One person saying one thing is named-claim, since every turn here gets its own figure.",
  "named-claim":
    "One person, one thing they said, and room to judge it: the claim in a panel with the speaker's name, then a tick-or-cross box and ruled lines. No figures and no bubbles.",
  "fact-file":
    "Named slots a child fills in. The field NAMES are what makes it teach: they say what counts as knowing about this thing.",
  "writing-frame":
    "Sentence starters with room after each, inside a frame whose SHAPE says what kind of writing this is: a museum tag, a postcard, a plaque.",
  storyboard:
    "Numbered boxes to draw in with writing lines beneath: a journey, a life cycle, a story retold in order.",

  // ─── methods ───
  "short-multiplication-grid":
    "Column multiplication by a single digit, with a thick-topped answer row and a carry row.",
  "long-multiplication-grid":
    "The long multiplication shape: one partial product row per digit of the multiplier, then the total.",
  "bus-stop-grid":
    "Short division: the answer row on top under the roof, the divisor outside the wall to the left.",
  "long-division-grid":
    "The same bus stop with a blank working box beneath, for the child to show the subtract-and-bring-down steps.",
  "method-frame":
    "A taught mental strategy printed as a fill-in method: labelled lines inside a panel, with boxes where the child writes.",

  // ─── comparing ───
  "compare-row":
    "Two values with an empty box between them, for less-than, greater-than and equals work.",
  "comparison-target":
    "The single empty < > = response target inside a comparisonPair; normally use the composition rather than this helper alone.",
  "inequality-with-boxes":
    "A displayed statement with some digits left as boxes to fill, so the child chooses numbers that make it true.",
  "number-sentence":
    "A number sentence with its terms kept apart: supplied values on their own tiles, operators between them, a box or digit frame where the answer goes. For when composing, recombining or a missing term IS the work.",
  "order-numbers":
    "Numbers to order on a card, with one blank per number underneath and the separator between them.",
  "order-table":
    "The same ordering task laid out as a two-row table: values on top, an empty cell under each.",
  "data-table-with-ordering":
    "A stem, a table of results, a row of blanks to order them into, and room to explain.",
  "circle-the-answer":
    "A prompt, the options to circle, and room to explain the choice.",

  // ─── place value ───
  "place-value-counter-chart":
    "Coloured counters in place-value columns: what number is shown, or left empty for the child to draw counters.",
  "base-ten-blocks":
    "Native SVG Dienes blocks for thousands, hundreds, tens and ones, used when the blocks themselves are the place-value representation.",
  "counter-group":
    "The same counters without the chart: one compact group per denomination, under the claim they are evidence for. For two cases compared side by side, where two charts would be two pages.",
  "place-value-chart":
    "Place names across the top, a row per number. Fill a row to hand a number over, leave it empty to be written in, label it to say what it is, highlight a cell to pick out the digit that changed.",
  "digit-cards":
    "A row of cards, one digit each, handed to the child to make numbers from.",
  "times-table-grid":
    "The multiplication-facts grid: headers across and down, products in the body, blanks to find.",
  "number-pyramid":
    "Each brick is the sum of the two below it. A blank upper brick is reached by adding, a blank base brick by subtracting.",

  // ─── money and fractions ───
  "coin-strip":
    "A row of coins and notes drawn at their real sizes relative to each other, over a line for the total.",
  "part-whole-money":
    "A whole bubble with parts beneath it, joined by lines. The money-flavoured name for part-whole, kept because saved specs use it; its bubbles may carry coins.",
  "part-whole":
    "A whole joined to its parts: partitioning, decomposition, a missing addend. Every node says whether the child is handed it, reads it or writes it, and a node that says nothing is refused.",
  "chip-bank":
    "A set of short labels drawn as separate bordered choices, each sized to its own word, so they read as options rather than as running text. A bank titled Word bank prints in vocabulary green unless a variant overrides it.",
  "stacked-fraction":
    "A fraction written properly, numerator sitting on a rule above the denominator, with a question stem.",
  "fraction-sequence":
    "The same stacked fractions as a bare row, for use inside a compound question.",

  // ─── geometry ───
  shape:
    "A 2D shape with its measurements written on the sides: the picture a child reads to find a perimeter, area or missing length.",
  "triangle-square":
    "The SATs part-whole puzzle: two triangles joined by lines to a square, the arrow pointing into the square.",
  "turn-diagram":
    "Angle as a turn: two rays from a vertex with a curved arrow sweeping between them.",

  // ─── science ───
  "circuit-diagram":
    "One series circuit or a row of them in the standard symbols, each carrying its own state.",
  "classification-key":
    "A branching yes/no identification key down to named living things.",
  "process-chain":
    "Boxes joined by arrows: a food chain, a life cycle, the order of events. The arrows are the point.",
  "concept-map":
    "One central idea joined to two to six others round it, each line optionally naming the relationship.",
  fishbone:
    "Cause and effect: causes on ribs off a spine that points at the effect.",
  "continuum-line":
    "A line between two opposite ends (disagree to agree) for a child to mark a position on, with optional ticks and a question above.",
  "source-pathway":
    "Two to six separate sources joining one middle state and then one outcome, for when the shared middle is the learning.",

  // ─── geography ───
  map:
    "A real map of a real place - one of the shipped world and continent maps - with the lesson's marks on top. `worksheetMode: \"continents-and-oceans\"` is the full-width landscape write-on world form, Antarctica included.",
  "cause-path-grid":
    "Named steps across the top and a choice to make at each one, so a child traces a cause through to its effect rather than naming both ends.",
  "evidence-chain-frame":
    "A set of possible actions, and for each piece of evidence the ones a child decides should stop now.",
};
