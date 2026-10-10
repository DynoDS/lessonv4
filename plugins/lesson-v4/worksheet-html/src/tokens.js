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
  vocab: "#00B050", // a taught word. This is the deck's green, which on the
  // board and on the teacher's answer sheet ALSO means a revealed answer. A
  // pupil sheet never shows an answer, so here green is kept to a taught word
  // and the steps panel, and nothing else may wear it: not a word bank because
  // of its title, not a digit handed to the child inside a drawing (the shared
  // drawings print those in ink on a sheet; see `answerColour` in
  // shared/visuals/surface-profiles.js). A sheet that breaks this looks already
  // marked (stress test, 7 October 2026: seven lessons of twenty).
  given: "#E46C0A", // material handed to the child: supplied values, choices,
  // and the edge of a word-bank card.
  givenCard: "#FFF2CC", // the cream ground of a word-bank card, the board's own
  // word-bank fill, so the bank on the sheet is the bank on the slide.
  worked: "#7030A0", // a worked example's frame: the edge and title of a method
  // frame that shows worked numbers, the title being words a child reads. The
  // deck's sticky and worked-example purple (the teacher's rule of 24 September
  // 2026). A frame the child fills in every line keeps its ink edge and blue
  // title (his answer of 25 September). What a child writes, and the frame's
  // labels, stay ink.
  ink: "#000000", // what the child writes, ordinary body text, AND scaffold
  paper: "#FFFFFF", // explicit printable surface; never a raw CSS colour.
  // sentence-starters, which are set apart by size, weight and their own line
  // rather than by a colour of their own. The deck does the same with a writing
  // frame, and it keeps scaffold from becoming a colour meaning of its own.
  quiet: "#666666", // notes and secondary labels.
  rule: "#999999", // writing lines and hairline borders.
  tint: "#F1F4F5", // the one neutral fill, for a panel that needs separating.
  surface: "#EAF3F8", // quiet grouping surface; remains distinct in greyscale.
  criteria: "#D5F5E3", // the pale green ground of the steps panel, and the one
  // place green is a SURFACE rather than a word. It is the deck's own
  // `scPanelBg`, kept to the hex, because the panel a child worked from on the
  // board and the panel on their sheet have to be recognisably the same object
  // - that recognition is the whole reason the panel is on the paper at all.
  // It does not give green a second meaning: on paper green still means "the
  // lesson handed you this to lean on", which is what a taught word and a
  // success criterion both are. What it must never become is a fill behind
  // ordinary prose, which would make green decoration.
};

// Deliberately absent: an `answer` colour (a pupil sheet never shows one; the
// teacher's answer sheet takes its green from the shared palette) and a
// `scaffold` colour (scaffold carries no colour).

// Point sizes. Print, so points rather than pixels.
const TYPE = {
  note: 9,
  body: 12,
  question: 13,
  // A question LABEL, which is smaller than the question it labels.
  //
  // It was body size, so "(1a)" printed 8mm wide and filled the 9mm column the
  // page had reserved for it - which is why the rounding sheet came out
  // "(1a)6,734" with nothing between the label and the number being rounded.
  // The obvious repair, a wider column, is not free: the approved partitioning
  // page has about 3mm of spare width in total, and a pair of four-part models
  // side by side has less than 4mm, so every millimetre the label takes is a
  // millimetre off a model a child writes in. Two points off the label buys
  // 1.3mm of clear space and costs 1mm of page.
  //
  // It is also the right size on its own terms. A label says where you are; it
  // is not part of the question, and set as large as the question it competes
  // with the thing it is only there to number. The deck settled the same point
  // from the other end on 11 September 2026, capping a slide's question number
  // at 24pt under 40pt questions. The floor is note size: nothing on a
  // worksheet goes below that, and 10 is one step clear of it.
  questionNumber: 10,
  sectionLabel: 14,
  // A sentence a child writes a mark into (a comma, a capital letter): a size
  // up from the words around it, so the place for the mark is easy to find.
  writeIn: 14,
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

// The height of a line a child writes a sentence on, by phase. It is THE
// height, not a floor: every ruled line in a pack is this far from the next,
// under a question, in a frame, under a claim or in a speech bubble.
//
// Until 9 October 2026 these were floors (8 and 6) and a line stretched to half
// as much again whenever its block was handed spare height, so the spacing a
// child got was decided by how much paper happened to be left under that
// question: 12mm and 8.3mm on one Year 2 sheet, 9mm and 7.5mm on one Year 4
// sheet (the stress test of 7 October 2026, 5 of 20 lessons). The teacher chose
// both sizes from true-size pages of those sheets.
const WRITING_LINE_MM = {
  lower: 10, // Years 1 to 3
  upper: 8, // Years 4 to 6
};

// A ruled line does not grow. Spare height stays as paper at the foot of the
// page, and it never becomes extra lines either: how many lines a question
// gets says how much to write, so it comes from the question (`sentences`,
// `lines`) and never from leftover room (the teacher, 9 October 2026). Kept as
// a named 1 so the helpers that cap a line at its own height say why.
const WRITING_LINE_GROWN_RATIO = 1;

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
