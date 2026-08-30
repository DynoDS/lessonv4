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
    "A question answered in the child's own words, with ruled lines under it.",
  "section-label":
    "The mode-of-work heading a block sits under: Fluency, Practise, Apply. Marks the kind of thinking, never the topic. Put it at the top of a stack.",
  "source-text":
    "A passage, account or extract the child reads and works from.",

  // ─── tables ───
  "data-table":
    "Values HANDED to the child to read from: a price list, a timetable, a set of results. Nobody writes in it.",
  "recording-table":
    "A table the CHILD completes: any cells may be supplied and the rest stay tall and blank for writing, sized by `writing` - one size, or one per column.",

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
    "A picture with a dot on each part it names, joined out to a printed label or a blank line for the child to write on. The one helper built around a PHOTOGRAPH.",

  // ─── drawn ───
  "clock-row":
    "A row of analogue clock faces, each with hands set or left blank for the child to draw.",
  "number-line":
    "A labelled number line carrying marked or blank jumps, boxes to write in, and an object bracket.",
  "fraction-bar":
    "One or more bars divided into equal parts, some shaded.",
  ruler:
    "A ruler printed at TRUE SIZE for a child to measure against. It refuses a zone too narrow rather than shrinking, because a scaled ruler makes every answer wrong on a page that looks normal.",

  // ─── forms ───
  "multiple-choice":
    "A stem, a tick instruction, then each option on its own line beside a tick box.",
  "sort-grid":
    "Named columns with blank rows for a child to sort items into, plus an optional word bank above.",
  "column-method-grid":
    "Ruled boxes for a written column calculation: the numbers stacked, a thick-topped answer row, and a carry row.",

  // ─── matching ───
  "match-up":
    "Two columns of cards with a dot on each facing edge, for the child to draw the joining line. The columns need not be the same length.",
  "card-row":
    "A row of small titled cards, each optionally carrying a picture: plants along the foot of a sheet, artefacts under a timeline.",
  timeline:
    "A line across the page with named bands along it and dated points beneath, for placing events or artefacts onto.",

  // ─── frames ───
  "speech-scene":
    "Turns of a conversation: a figure, and a bubble either printed to read or empty to fill. An instruction that asks for a tick or a cross is given a box to mark.",
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
  "inequality-with-boxes":
    "A displayed statement with some digits left as boxes to fill, so the child chooses numbers that make it true.",
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
    "A whole bubble with parts beneath it, joined by lines.",
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

  // ─── geography ───
  map:
    "A real map of a real place - one of the world and continent maps this package ships - with the lesson's own places, regions and rivers marked on top of it.",
  "cause-path-grid":
    "Named steps across the top and a choice to make at each one, so a child traces a cause through to its effect rather than naming both ends.",
  "evidence-chain-frame":
    "A set of possible actions, and for each piece of evidence the ones a child decides should stop now.",
};
