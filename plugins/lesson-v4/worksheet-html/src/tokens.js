"use strict";

// The worksheet's design system. Data only, no logic beyond emitting CSS.
//
// The colour roles are shared with the slide deck on purpose: a child meets
// one meaning for each colour across a whole lesson rather than learning a
// second system for paper. builder/src/styles.js holds the deck's side.

// Locked pipeline-wide. Not a taste decision and not changeable here alone.
const FONT = "Comic Sans MS";

const COLOUR = {
  navy: "#17365D", // page/product identity: titles and structural rules.
  question: "#0070C0", // the question or focus. Matches the deck's title blue.
  vocab: "#00B050", // a word that matters. This is the deck's green, carrying
  // the deck's OTHER meaning. On slides green means both a revealed answer and
  // a vocabulary headword; a worksheet never reveals an answer (the child
  // writes it, the board reveals it), so only the vocabulary meaning can arise
  // here and green is unambiguous on paper.
  given: "#E46C0A", // material handed to the child: word banks, supplied values.
  ink: "#000000", // what the child writes, ordinary body text, AND scaffold
  paper: "#FFFFFF", // explicit printable surface; never a raw CSS colour.
  // sentence-starters, which are set apart by size, weight and their own line
  // rather than by a colour of their own. The deck does the same with a writing
  // frame, and it keeps the system to four meanings instead of five.
  quiet: "#666666", // notes and secondary labels.
  rule: "#999999", // writing lines and hairline borders.
  tint: "#F1F4F5", // the one neutral fill, for a panel that needs separating.
  surface: "#EAF3F8", // quiet grouping surface; remains distinct in greyscale.
};

// Deliberately absent: an `answer` colour (a worksheet never shows one) and a
// `scaffold` colour (scaffold carries no colour).

// Point sizes. Print, so points rather than pixels.
const TYPE = {
  note: 9,
  body: 12,
  question: 13,
  questionNumber: 12,
  sectionLabel: 14,
  pageTitle: 16,
};

// Millimetres. Four steps only: more than four and the rhythm stops reading
// as a rhythm.
const SPACE = {
  hair: 1,
  tight: 2,
  item: 4,
  section: 8,
};

// The room INSIDE a box, in millimetres, as opposed to SPACE which is the room
// between one block and the next. They are different systems on purpose: 4mm
// inside a table cell is enormous, 1mm between two question blocks is nothing.
//
// Added after an audit found five padding values in use (1, 1.4, 1.5, 2, 3, 4)
// with nothing to say which belonged where. Some of that was real drift - a
// place value cell was inset 1.5mm and a place value CHART cell 1.4mm, the same
// cell a tenth of a millimetre apart in two files - and a card was inset 2mm in
// one helper, 3mm in another and 2mm by 3mm in a third. Three cards, three
// insets, which is the border problem again in a different measurement.
//
// Every step is tighter top-to-bottom than side-to-side, and that is the rule
// the best of the existing values already followed without saying so: a line of
// text carries its own leading above and below it, so it needs less room added
// vertically, while nothing at all separates it from the box edge at its sides.
// A cell padded equally in both directions reads as though the text is falling
// out of it sideways.
//
//   cell   a table or grid cell, where the box is barely bigger than its text
//   card   a card, chip, bubble or frame the child reads or works inside
//   panel  a frame that holds several other things
const INSET = {
  cell: { v: 1, h: 2 },
  card: { v: 2, h: 3 },
  panel: { v: 3, h: 4 },
};

// Line weights, in millimetres. Three, and there is a reason for each.
//
// Added after an audit found NINE different border widths across the helper
// files, three of which (0.3, 0.35, 0.4) were doing the same job. Nobody chose
// that: each helper's author picked a sensible-looking number and they drifted.
// It shows on a sheet that carries a table beside a grid beside a card, where
// three boxes of the same kind print in three slightly different weights, and
// the page reads as assembled from parts rather than designed.
//
//   hair  a line a child WRITES ON, and the light internal rule of a table.
//         Dotted where it is written on, so it reads as an invitation.
//   line  the border of a box, cell or frame. Anything a child works inside.
//   heavy the emphasis rule: the thick line under a column method's working,
//         which says "the answer goes below here". It has to beat `line`
//         clearly or it says nothing at all.
const RULE = {
  hair: 0.35,
  line: 0.4,
  heavy: 0.8,
};

// The floor for a line a child writes on, by phase. These are the numbers a
// zone's floor is built from, so they are deliberately generous: a line too
// short to write on makes the whole question useless.
const WRITING_LINE_MM = {
  lower: 8, // Years 1 to 3
  upper: 6, // Years 4 to 6
};

// The tallest a ruled line may grow to when a block is handed spare height.
// A line exists to be written on, and past about half as much again the gap
// between rules stops reading as generous and starts reading as a fault - so
// room beyond this is left as paper rather than pushed into the rules. A sheet
// that keeps hitting the cap is telling the designer its questions want more
// lines, which is `sentences`, not a rendering decision.
const WRITING_LINE_GROWN_RATIO = 1.5;

function cssVariables() {
  const lines = [":root {"];
  lines.push(`  --font: "${FONT}", cursive;`);
  for (const [role, value] of Object.entries(COLOUR)) {
    lines.push(`  --colour-${role}: ${value};`);
  }
  for (const [role, value] of Object.entries(TYPE)) {
    lines.push(`  --type-${role}: ${value}pt;`);
  }
  for (const [role, value] of Object.entries(SPACE)) {
    lines.push(`  --space-${role}: ${value}mm;`);
  }
  for (const [role, value] of Object.entries(RULE)) {
    lines.push(`  --rule-${role}: ${value}mm;`);
  }
  // Both axes, plus the pair as one shorthand, because a padding written as
  // two separate variables is a padding someone will eventually write with the
  // wrong one in front.
  for (const [role, pair] of Object.entries(INSET)) {
    lines.push(`  --inset-${role}-v: ${pair.v}mm;`);
    lines.push(`  --inset-${role}-h: ${pair.h}mm;`);
    lines.push(`  --inset-${role}: ${pair.v}mm ${pair.h}mm;`);
  }
  lines.push("}");
  return lines.join("\n");
}

module.exports = { FONT, COLOUR, TYPE, SPACE, RULE, INSET, WRITING_LINE_MM, WRITING_LINE_GROWN_RATIO, cssVariables };
