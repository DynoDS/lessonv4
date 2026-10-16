'use strict';

// THE place value chart. One drawing, placed by the board, the worksheet, the
// working wall and the stick-in pack.
//
// It was three. The board drew PowerPoint tables in a 1,266-line file, the wall
// drew this module's older SVG in Arial on a fixed canvas, and the sheet drew a
// CSS grid with no column colours, orange digits and a blue ring, plus a second
// CSS chart of counters in the manipulatives' purple, blue and red. The board and
// the wall had been matched feature by feature (the pair, the counters, "same"),
// and still every repair had to be made twice, while a child moving from the
// board to the sheet met a different picture of the same columns (13 September
// 2026). This file is now the one place a place value chart is drawn; each
// surface passes the box it has and its profile (shared/visuals/
// surface-profiles.js).
//
// Laid out in points at the size it prints, so a digit's size is a real size
// on every surface and a chart squeezed into a small slide zone refuses by name
// rather than printing digits nobody can read.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout, anchor, anchors }
//                              `anchors` only for a calculation: the places a
//                              step can point at, by name (see describeCalculation)
//   cacheKey(spec, profile) -> string
//   normalise(spec)         -> the chart, in one vocabulary
//   minWidthPt(spec, profile) -> the narrowest box the chart can be drawn in
//
// ─── the spec (the board's spelling) ─────────────────────────────────────
//
//   columns    headings in order: ["Th","H","T","O"], [".","t","h"] for
//              decimals, or the words ("Thousands"). Supported: M, HTh, TTh,
//              Th, H, T, O, ".", t, h, th.
//   rows       one entry per row. A bare array is its cells; an object may
//              carry { label, cells, highlight, counters, counterLabels }.
//              `rows: []` is the bare heading strip; leaving `rows` out is one
//              blank row for live completion.
//     label      what the row IS ("3,462", "10 more"), in a column at the left
//     highlight  which cell(s) changed, by column name or index
//     answer     true prints this row's digits in answer green with no ring:
//                the row is a result, not the number the question started from
//     worked     true prints this row's digits in the worked-example purple:
//                the row is part of a worked example the class watches, a
//                mistaken one included; never with `answer`
//     counters   { Th: 3, H: 4, ... } place-value counters above the digits
//     counterLabels  true prints each counter's value on it
//   title      a heading above a stacked chart (the wall's)
//   instances  several copies side by side (the sheet's "write each number")
//   pair       ONE before-and-after comparison:
//              { from, to, operation, title, counters: { from, to },
//                exchanges: [{ from, to, count, label }] }
//   calculation  ONE written column calculation, the way the teacher sets it out:
//              { operator, numbers, answer, carry, worked, exchanges, ring }
//              `exchanges: [{ from: "T", to: "O" }]` on a subtraction, in the
//              order they are made: the giving column's digit is crossed out
//              with one fewer written above it, and the column to its right
//              gets a small 1 in front of its digit. `ring: "O"` rings the
//              digits being worked in that column.
//              `numbers: ["", ""]` with `columns` is the empty frame a child
//              sets a calculation out in, and `operator: ""` leaves the sign's
//              place blank too, for a problem where they choose the operation.
//              The rows are laid out by the drawing, never authored: the numbers
//              lined up from the ones, the sign in a narrow column beside the
//              last of them, a thick rule, the answer row, a second thick rule
//              (the two rules are the "big equals sign"), and a shallow row
//              UNDER the answer for the small carried digit. `columns` may be
//              left out, and is then read off the longest number.
//              LONG MULTIPLICATION is the same field with rows of working
//              between the numbers and the answer, one for each digit of the
//              second number: { operator: "x", numbers: ["2314", "32"],
//              upTo: "tens zero" }. `upTo` says how far the working has got
//              ("set out", "ones row", "tens zero", "tens row", "total") and
//              the drawing does the arithmetic, so a row, its place-holder
//              zero and its carried digits can never disagree with the
//              numbers. `partials: ["4628", "6942"]` writes the rows by hand
//              instead (a mistake the class inspects), and `partials: 2` is
//              the empty frame. `ring: "T"` rings the digit being multiplied
//              by. `colours: { "tens zero": "E46C0A" }` gives one stage its
//              own ink, which is how the wall ties a row to its step.
//              Each row says what it is: `look: "labelled"` (left out, the
//              same) puts "x 6", "x 30", "add" at the left of the rows, and
//              `look: "explained"` puts "24 x 6 = 144" over "the 6 ones"
//              beside each row instead (see longRowColour). Paper is
//              always labelled. The row under the total for a carried digit
//              is left out when the addition carries nothing.
//
// Older spellings still draw: the sheet's counter chart
// ({ columns: ["thousands", ...], counts: { thousands: 2 } }) is a chart whose
// one row is counters with their values on them and no digit row, because that
// sheet asks "what number is shown?" and the answer is written elsewhere.
//
// ─── what the picture holds to, and why ──────────────────────────────────
//
// A highlighted cell KEEPS its column colour and gains a green ring with a green
// digit. Recolouring the cell would say "this is not a tens column any more",
// and the column coding is the other half of what the chart teaches. Green is the
// answer colour, which is what a changed digit is. (The sheet used question blue
// until 13 September 2026; one picture has one ring.)
//
// The pair's changed column is DERIVED by comparing `from` with `to`, never
// declared, so the picture can never ring a column that did not move, and the
// exchange case (3,497 to 3,507) rings both. An empty result cell is an unknown
// for the child, not a digit that "changed to blank", so it is not ringed and no
// "same" is printed under a pair still being worked out. The title is read off
// the `to` cells unless overridden, so the words and the digits cannot disagree.
// "same" prints under every column that held still, in that column's own
// darkened colour, because without it the picture says only what changed and a
// child infers the rest - exactly the half of "10 more" they get wrong. ONE pair
// is ONE comparison: 10 more and 100 more of 3,462 are two pairs, never a chain
// of three charts, because a chain says the third number grew out of the second.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor, answerColour } = require('./surface-profiles');
const { insetProfile } = require('./fit-unit');
const { clearlyUnder } = require('./hair-under');

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
// Sizes are in D, the digit's font size, so the whole chart grows and shrinks
// together; the proportions are the board's, which had been tuned for a room
// (0.45in columns, 0.38in heading band and 0.55in rows at 18pt digits).
const DIGIT_OF_FONT = 0.75;   // D at its natural size, as a share of the profile's
                              // font: the board's 18pt digit beside its 24pt numerals
const MAX_SCALE = 1.7;        // how far D may grow past natural; the board's ceiling,
                              // which puts a sheet's digit at about the 14pt it was
const BOARD_MIN_SCALE = 0.65; // the smallest a chart given a height may go anywhere
                              // but a slide: the scale the board chart once held
// On a slide the chart, the counters chart and the written sum are never drawn
// with digits under 18pt, which is D at its natural size. The teacher, shown
// the same sum at full slide width getting shorter (6 October 2026), chose the
// 18pt one as the last that looks right ("I'd say E probably"), and of the 14pt
// sum on Year 4 Maths Lesson 24 slide 11 he said it "looks awful". Number
// lines, fraction walls and tables already held 18pt on a slide; the chart had
// kept 0.65 of it (11.7pt digits, 9pt headings) from the board chart it
// replaced, and nobody had decided that. Headings have the same 18pt floor of
// their own (headingsFor). A zone too short for it is refused by
// PLACE_VALUE_CHART_DOES_NOT_FIT with the height it needs, as before. The
// before-and-after pair takes the same floor on a slide (his answer the same
// evening: "yes same 18pt floor"); its own smaller scales below are for the
// other surfaces that give it a height.
const SLIDE_MIN_SCALE = 1.0;
const COL_W = 1.8;            // one digit column
const POINT_W = 0.4;          // the decimal point's narrow column, in digit columns
const LABEL_COLS = 1.55;      // a row label's column, in digit columns. Fixed rather
                              // than measured, so charts side by side stay in register
const LABEL_MAX_SHARE = 0.3;  // ...and never more than this share of the chart, or a
                              // two-column chart is a caption with digits stapled on
const HEADER_H = 1.52;
const ROW_H = 2.2;
const COUNTER_H = 4.8;        // the counter band above a row of digits
const HEAD_FONT = 0.72;       // a heading, as a share of D
const SLIDE_HEAD_FONT = 0.9;  // ...and the most it grows to on a slide, where a wide
                              // column has room for it: just under the digit
const LABEL_FONT = 0.78;      // a row label
const TITLE_FONT = 0.87;
const TITLE_GAP = 0.3;
const COL_MAX = 5;            // paper's widest digit column, in D at its ceiling: a
                              // column wider than 24mm is not easier to write in,
                              // just emptier (the sheet's PVCHART_COL_MAX_MM)
const INSTANCE_GAP = 1.2;     // between charts side by side, so borders never touch
const CELL_INSET_OF_N = 0.32; // the margin either side of a cell's words (0.08in at 18pt)
const GRID_W = 0.05;          // a cell rule, at least 1pt
const RING_W = 0.12;          // the ring round a changed digit, at least 3pt: three
                              // times the rule, because from the back of the room a
                              // slightly thicker line is no line
const RING_INSET = 0.13;      // keeps two adjacent rings as two rings, not one outline
                              // with a knot in the corner
const COUNTER_MAX = 20;       // guards a malformed spec from flooding a chart
const COUNTER_MAX_D = 1.0;    // an unlabelled counter at most as wide as a digit is tall
const LABELLED_COUNTER_MAX_D = 2.0; // a counter carrying "0.01" needs about a 9mm disc on
                              // paper: the sheet's counter, which it was sized for
const COUNTER_FILL_SHARE = 0.68;
// A column of six or more counters goes close together, as one block in the
// middle of its cell and as large as the cell allows. A column of fewer than
// six stays spread across its cell, at the size it always had.
//
// Counters used to be spread whatever their number: each sat in the middle of
// an equal share of its cell and was never wider than a digit is tall, so
// thirteen tens in a wide shallow cell stood five to a row with wide gaps, held
// small while most of the cell was empty. The teacher (6 October 2026): "the
// counters are so spread out". Every column was then drawn close together at
// one size across the chart, and shown that on his wall sheet and his slide he
// said: "they look better spaced out, maybe only if its a certain amount they
// start going together". Three hundreds had become a small clump in a big
// cell. Shown five ways, he chose this one ("E I think"): going together
// begins at six, which is where three to a row begins. Each column is sized by
// its own cell, so a chart's counters are not all one size; the arrangement is
// what it always was (two, three or five to a row, ten as two rows of five).
//
// The two cells of a clean exchange leave room for its rings whether or not
// the rings are drawn, so a marked pair and an unmarked one are the same
// picture: the ten that go stand a ring's width clear of the cell's edge and of
// the counters that stay, and the one they become stands a ring's width from
// its neighbours. A ring's line then runs through no counter.
//
// Counters that carry their value ("0.01") are sized by their words and are
// not changed. Take a surface out of this set to give it back the spread.
const COUNTER_CLOSE_FROM = 6;
const COUNTER_PITCH = 1.25;
const CLOSE_COUNTERS = new Set(['slides', 'worksheets', 'wall', 'stickin']);
const LABELLED_FILL_SHARE = 0.82;
const COUNTER_FACE_WIDTH = 0.9; // the share of a disc its value may use across
// The smallest a counter can be and still be counted.
//
// The chart had a height floor and never a width one, and the two are not
// interchangeable: the counter band grows with the scale while a column keeps
// the width the layout gave it, so a tall thin cell spends its height on gaps.
// Two four-column charts sharing the 60% side of a split gave six counters
// 0.10in each, every check passed and the deck shipped (Daniel, 3 September
// 2026: "2 in one slide is still too small to do anything with. The columns are
// too narrow"). Half the intended board counter, which is also the smallest
// mark a heading's own 9pt minimum allows.
const COUNTER_READABLE_PT = 9;
// A column of counters drawn close together has a higher floor of its own.
//
// Closing counters up makes them bigger in the same cell, so the floor above,
// which was measured on spread counters, let through what it had refused: the
// two four-column charts of 3 September drew their six counters at 3.4mm, just
// over it, and built. Shown that slide (6 October 2026) he said: "you're right,
// they're too cramped". So a close column must reach the size a spread column
// reaches at 3.2mm in the same cell, which is 3.7mm. The floor is worked out
// from the two spacings, never typed, so exactly the cells that were refused
// before the counters were closed up are refused now, and no others.
const COUNTER_CLOSE_READABLE_PT = COUNTER_READABLE_PT / (COUNTER_PITCH * COUNTER_FILL_SHARE);
const COUNTER_FACE_MIN_PT = 9; // a counter's value below this is a smudge, not a number
// The narrowest a column can be and still be written in.
//
// The counter floor measures counters, so a chart drawing none passed it by
// having nothing to measure, and the chart a teacher writes into is exactly the
// chart with none. Two charts with a blank "Value" row shared a slide at 0.72in
// and 0.64in a column (Daniel, 4 September 2026: "there's no way the teacher if
// they wanted to could write neatly in the columns because they're not wide
// enough"). Paper answered how much room one handwritten digit needs: 14mm,
// with a 16mm row. The board holds the same standard converted by its type,
// 14mm at 12pt being 0.83in at 18pt, and a teacher's pen on the board needs no
// taller row than the chart already draws.
const WRITE_IN = {
  slides: { colPt: 0.83 * 72, rowPt: 0 },
  worksheets: { colPt: (14 * 72) / 25.4, rowPt: (16 * 72) / 25.4 },
  stickin: { colPt: (14 * 72) / 25.4, rowPt: (16 * 72) / 25.4 },
  wall: { colPt: 0, rowPt: 0 }, // a wall chart is read, never written on
};

// ── the pair ────────────────────────────────────────────────────────────────
const PAIR_MAX_SCALE = 2.6;        // a pair carries one row per chart, so there is
                                   // height to spend on big digits
const PAIR_BOARD_MIN_SCALE = 0.7;
const PAIR_COUNTER_MIN_SCALE = 0.42;
const PAIR_COUNTER_COL_W = 2.6;    // a pair column holding counters, at least
const PAIR_COUNTER_COL_MAX = 3.5;  // ...and at most, in D
const PAIR_GAP = 4.1;              // between the charts; the arrow lives in it
// The wall's pair (profile.pairArrow === 'narrow'). On a sheet of its own the
// gap that held the arrow's words took two fifths of the picture, and the
// thirteen tens counters beside it printed about 4mm across (the teacher,
// 6 October 2026: "the arrow that says 10 tens = 1 hundred isn't as important
// that wide ... The tens are hard to see"). So the arrow keeps only the room
// an arrow needs, the columns take what it gives up, and the words stand in a
// band above the charts unless the exchange cue already prints the same words
// there. The picture is also held to a height (profile.pairMaxHeightPt), the
// depth a sheet has under its title, so the room goes to wider columns and
// not to a taller drawing the card would only shrink again. The board, the
// sheet and the stick-in pack never ask for this and draw exactly as before.
const PAIR_GAP_NARROW = 2.2;
// What happened, marked on the counters (profile.pairExchangeMarks). With the
// arrow short and wordless the wide pair was two charts of dots: "I'd have some
// indication what happened though, like colours round the 10 and moving to the
// hundreds with arrows or whatever, otherwise it just looks bland" (the
// teacher, 6 October 2026). So the ten counters that are exchanged are ringed
// as one group, the one counter they become is ringed in the other chart, and
// the arrow between the charts takes the rings' colour and leaves at the
// group's height, so the three read as one move. The colour is the chart's own
// "this changed" green, the ring `highlight` draws round a changed digit; a
// white line under it keeps the ring visible on the green hundreds column.
// The marks are worked out from the two charts, never declared (as the pair's
// changed digits are), so they cannot ring counters that did not move.
const EXCHANGE_MARK_W = 0.13;       // the ring's line, in D, at least 3.5pt
const EXCHANGE_MARK_MARGIN = 0.28;  // clear space between a counter and its ring, in counters
const PAIR_COUNTER_COL_MAX_NARROW = 4.5;
const PAIR_OP_BAND_H = 1.5;
const PAIR_ARROW_W = 0.33;         // bold on purpose: the arrow IS the change
const PAIR_ARROW_HEAD = 0.74;
const PAIR_ARROW_INSET = 0.25;
const PAIR_OP_FONT = 1.0;
const PAIR_TITLE_H = 1.6;
const PAIR_TITLE_GAP = 0.45;
const PAIR_TITLE_R = 0.25;
const SAME_H = 1.13;
const SAME_FONT = 0.78;
const SAME_TEXT = 'same';
const EXCHANGE_H = 3.4;        // the exchange cue band: tall enough that ten counters
                              // read as ten counters and not a row of dots
const EXCHANGE_GAP = 0.25;
const EXCHANGE_FONT = 0.67;

// ── the written calculation ─────────────────────────────────────────────────
// Set out the way it is taught (the teacher, 5 October 2026): the two numbers,
// a thick rule, the answer, a second thick rule, and what is carried written
// small UNDER the answer. Until then a column sum was a place value chart with
// a "+" typed into the row caption, which gave the sign a column wider than a
// digit's, put the carried digit above the answer because nothing said where it
// went, and drew every rule the same weight.
const CALC_OP_W = 0.55;        // the sign's column, in digit columns: it holds one
                               // character and is never written in
const CALC_CARRY_H = 1.25;     // the carry row on the board and the wall, in D:
                               // shallow, because a carried digit is written small
const CALC_CARRY_OF_ROW = 0.5; // ...and on paper, as a share of a digit row
const CALC_CARRY_FONT = 0.62;  // the carried digit, as a share of D
const CALC_ONE_FONT = 0.55;   // the small 1 an exchange puts in front of a digit
const CALC_ABOVE_FONT = 0.74; // the digit written above a crossed-out one
const CALC_STRIKE_W = 0.11;   // the line through a crossed-out digit
// The wall's colours for a subtraction's exchanges, in order: the board's
// decide-orange and worked-purple, then the step sheet's pink and teal.
const CALC_EXCHANGE_WALL = ['#E46C0A', '#7030A0', '#C2185B', '#00828A'];
const CALC_HEAVY_W = 0.16;     // the two thick rules, at least three times a cell
                               // rule so they still read as thick across a room
// A written calculation's squares on paper, in millimetres: [smallest a child
// writes one digit in, the size it prints at when there is room]. A worksheet's
// were 14 and 15 until 7 October 2026, when five sums a Below child needed
// would not fit one page by 13mm and the plan asked for a second (Daniel, on
// the same sheet printed at 12mm and at 10mm: "both fine"). A maths book's own
// squares are smaller than either. A stick-in keeps the older size.
const CALC_PAPER_COL_MM = { worksheets: [10, 12], stickin: [14, 15] };
const calcPaperColPt = (profile) => (CALC_PAPER_COL_MM[profile.surface] || CALC_PAPER_COL_MM.stickin).map((mm) => (mm * 72) / 25.4);
// How far under its smallest a square may come out when a sheet asks for it
// (`squaresGive: true`). Asked for only to keep (1a), (1b), (1c) beside a row
// of frames that is a few millimetres too wide for them: the teacher, shown
// Monday's Below sheet with 9.7mm squares and the numbers beside, and the same
// sheet with full squares and the numbers above, chose the first, "as long as
// helpers are usable for children", and agreed 9.5mm as the least (15 October
// 2026). Nothing else draws under the floor.
const CALC_PAPER_GIVE = 0.95;
const calcPaperFloorPt = (profile, chart) => calcPaperColPt(profile)[0] * (chart && chart.squaresGive ? CALC_PAPER_GIVE : 1);
const CALC_MAX_NUMBERS = 4;
const CALC_MAX_PARTIALS = 4;   // rows of working in a long multiplication

// ── long multiplication: what each row IS ───────────────────────────────────
// The teacher, a Year 4 teacher, looked at the finished 24 x 36 (14 October
// 2026) and could not tell what the rows were. Every UK scheme he could be
// pointed at explains it as parts: 24 x 36 is 24 x 6 plus 24 x 30, and each row
// is one of those parts. So each digit of the multiplier and the row it makes
// share a colour, and every row says what it is in one of two looks, which he
// chose from mock-ups:
//   "explained"  beside each row its sentence, "24 x 6 = 144" over a small
//                "the 6 ones", "24 x 30 = 720" over "the 3 tens, so a 0 goes
//                in first", "144 + 720 = 864" over "add the two rows"; a row
//                not yet written has its sentence with no answer ("24 x 6 =").
//                For modelling, where the teacher talks the method through.
//   "labelled"   a short label at the left of each row, "x 6", "x 30", "add".
//                For practice, answers and paper, where the child writes in
//                the rows and a sentence would only be read instead.
// The colour is the place's own, the darkened column colour a success
// criterion gives `((ones))` or `((tens))` (SAME_COLOURS): the ones digit and
// its row in the ones column's red, the tens digit and its row in the tens
// column's gold, a hundreds row in the hundreds green, the total in the
// answer's green. The mock-ups had used orange and blue, and beside a
// criterion colouring "tens digit" orange the tens row was blue (the teacher,
// 14 October 2026); the place's own colour is the one the criteria, the column
// headings and the "same" under a chart already use. A row's label cell is its
// colour mixed pale, so a surface that recolours a row (the wall's step sheet)
// recolours its band too.
const longRowColour = (k) => SAME_COLOURS[WHOLE_COLUMNS[k]] || '#404040';
const LONG_LABEL_FONT = 0.78;    // a row's label, as a share of D (the row label's size)
const LONG_SAY_FONT = 0.9;       // a row's sentence, a little under the digits
const LONG_NOTE_FONT = 0.75;     // the small line under it
// On a slide the sentences and their small lines print at the board's label
// size, 20pt, and at 18pt only when 20pt will not fit beside the sum (the
// teacher's ruling for labels on the board, 8 October 2026). At the room's
// 18pt floor beside a success criteria panel the small lines were too small to
// read from the back (14 October 2026).
const LONG_SLIDE_WORDS_PT = 20;
const LONG_NOTE_INK = '#404040';
const LONG_ARROW = 1.5;          // the arrow from a sentence to its row, in D
const LONG_SIDE_GAP = 0.45;      // either side of that arrow, in D
const LONG_COL_OF_D = 1.8;       // beside sentences a column keeps the board's
const LONG_COL_MAX_OF_D = 2.6;   // proportions, and grows no wider than this
// Where the small digits carried WHILE MULTIPLYING go is still open (a Year 6
// teacher's view is awaited): today a shallow row under each row of working.
// `partialCarry: false` on a spec draws without them; change this one default
// to change every long multiplication.
const LONG_CARRY_ROWS = true;

const COLOURS = {
  grid: '#666666',
  text: '#000000',
  ring: '#00B050',     // house answer-green
  worked: '#7030A0',   // the worked-example purple, the sticky fact's colour
  title: '#0070C0',    // house focus blue, the board's title bar
  titleInk: '#FFFFFF',
  counterLine: '#4A4A4A',
  labelFill: '#FFFFFF',
  headerFill: '#D0D0D0',
  cellFill: '#FFFFFF',
};
// The stick-in pack is photocopied, so its chart keeps the rules, the ring and
// the counters and gives up the tints, which print as muddy grey.
const INK = {
  grid: '#1A1A1A',
  text: '#1A1A1A',
  ring: '#1A1A1A',
  worked: '#1A1A1A',
  title: '#1A1A1A',
  titleInk: '#FFFFFF',
  counterLine: '#1A1A1A',
  labelFill: '#FFFFFF',
  headerFill: '#E6E6E6',
  cellFill: '#FFFFFF',
};

// The palette every surface draws, so a column means the same colour on the
// board, the sheet and the wall. Each entry is [header fill, cell fill].
const COLUMN_COLOURS = {
  M:    ['#8AB8E8', '#C5DCFF'],
  HTh:  ['#8AB8E8', '#C5DCFF'],
  TTh:  ['#8AB8E8', '#C5DCFF'],
  Th:   ['#8AB8E8', '#C5DCFF'],
  H:    ['#8AC88A', '#C5EBC5'],
  T:    ['#E8D84A', '#FFF5A0'],
  O:    ['#E89090', '#FFD6D6'],
  '.':  ['#D0D0D0', '#EBEBEB'],
  t:    ['#E8D84A', '#FFF5A0'],
  h:    ['#8AC88A', '#C5EBC5'],
  th:   ['#8AB8E8', '#C5DCFF'],
};

// "same" in its column's own colour, so it reads as belonging to that column.
// The cell colours are pale tints meant to sit behind black digits, and pale
// yellow text on white is no text at all, so each family gets a darkened version
// of its own hue: the same colour to the eye, readable across a room.
const SAME_COLOURS = {
  M: '#2E75B6', HTh: '#2E75B6', TTh: '#2E75B6', Th: '#2E75B6', th: '#2E75B6',
  H: '#3E8E41', h: '#3E8E41',
  T: '#9C7A00', t: '#9C7A00',
  O: '#C0504D',
  '.': '#808080',
};
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

// A place-value column has a canonical short name - Th, H, T, O - and that is
// what the palette is keyed on. A designer naturally writes the full word, and
// until this map existed a chart headed "Thousands, Hundreds, Tens, Ones" lost
// two things at once, both silently: every colour lookup missed, so every column
// drew grey, and "Thousands", one word with no break, split mid-word in a column
// narrower than itself. A Year 4 deck (3 September 2026) shipped
// "Thousan/ds Hundred/s" in grey across three slides, and the same lesson's wall
// failed its build on the overlap and was repaired by hand to Th/H/T/O.
//
// Case is significant among the canonical keys - T is tens and t is tenths, H is
// hundreds and h hundredths, Th thousands and th thousandths - so an
// already-canonical label is returned untouched and only a spelled-out name is
// folded to lower case.
const CANONICAL_COLUMN = {
  million: 'M', millions: 'M',
  'hundred thousand': 'HTh', 'hundred thousands': 'HTh',
  'ten thousand': 'TTh', 'ten thousands': 'TTh',
  thousand: 'Th', thousands: 'Th',
  hundred: 'H', hundreds: 'H',
  ten: 'T', tens: 'T',
  one: 'O', ones: 'O', unit: 'O', units: 'O',
  tenth: 't', tenths: 't',
  hundredth: 'h', hundredths: 'h',
  thousandth: 'th', thousandths: 'th',
  point: '.',
};

// A column's everyday name, which is how a step names the place it points at
// ("ones answer", "tens carry").
const COLUMN_PLACE = {
  M: 'millions', HTh: 'hundred thousands', TTh: 'ten thousands', Th: 'thousands',
  H: 'hundreds', T: 'tens', O: 'ones', t: 'tenths', h: 'hundredths', th: 'thousandths',
};

function canonicalColumn(label) {
  const raw = label == null ? '' : String(label);
  if (Object.prototype.hasOwnProperty.call(COLUMN_COLOURS, raw)) return raw;
  const words = raw.toLowerCase().replace(/\s+/g, ' ').trim().replace(/ (?:column|place)$/, '');
  const found = CANONICAL_COLUMN[words];
  return found === undefined ? raw : found;
}

// Values are derived from the column, never separately authored answer text.
const COUNTER_VALUES = { M: '1000000', HTh: '100000', TTh: '10000', Th: '1000', H: '100', T: '10', O: '1', t: '0.1', h: '0.01', th: '0.001' };
function counterValue(column) {
  const value = COUNTER_VALUES[canonicalColumn(column)];
  if (!value) throw new Error('PLACE_VALUE_COUNTER_LABEL_UNKNOWN_COLUMN: ' + column);
  return value;
}

const PLACE_VALUE = { M: 1e6, HTh: 1e5, TTh: 1e4, Th: 1000, H: 100, T: 10, O: 1, t: 0.1, h: 0.01, th: 0.001 };
const COLUMN_WORD = {
  M: 'million', HTh: 'hundred thousand', TTh: 'ten thousand', Th: 'thousand',
  H: 'hundred', T: 'ten', O: 'one', t: 'tenth', h: 'hundredth', th: 'thousandth',
};

// Kept for callers that lay out labelled counters in their own units: the grid
// that leaves the most diameter for the whole label, refused rather than shrunk
// below the font a child can read.
function labelledCounterGrid(w, h, count, label, minFont, unitsPerPoint, maxDiameter = Infinity) {
  let best = null;
  for (let cols = 1; cols <= count; cols += 1) {
    const rows = Math.ceil(count / cols);
    const stepW = w / cols;
    const stepH = h / rows;
    const d = Math.min(Math.min(stepW, stepH) * 0.82, maxDiameter);
    const font = Math.min(14, (d * 0.72) / (label.length * 0.62 * unitsPerPoint));
    if (!best || d > best.d) best = { cols, rows, stepW, stepH, d, font };
  }
  if (!best || best.font < minFont) throw new Error('PLACE_VALUE_COUNTER_LABELS_DO_NOT_FIT: enlarge the chart or use fewer simultaneous examples');
  return best;
}

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function asList(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function str(v) {
  return v == null ? '' : String(v);
}

function esc(s) {
  return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function f2(n) {
  return Math.round(n * 100) / 100;
}

// A counter population is written the way the lesson talks about the column,
// so `{ Thousands: 6 }` has to find a chart headed "Th" and the other way round.
function populations(raw) {
  if (!isObj(raw)) return null;
  const out = {};
  Object.keys(raw).forEach((key) => {
    const n = Number(raw[key]);
    out[canonicalColumn(key)] = Number.isFinite(n) && n > 0 ? Math.min(COUNTER_MAX, Math.floor(n)) : 0;
  });
  return out;
}

function countIn(pops, column) {
  return pops ? pops[column] || 0 : 0;
}

// A highlight names cells by their COLUMN, the way the lesson talks ("the tens
// changed"); a chart never repeats a column, so the name is unambiguous. An index
// works too. A name the chart does not have marks nothing, rather than guessing.
function pickedIndices(highlight, columns) {
  const picked = new Set();
  asList(highlight).forEach((h) => {
    if (typeof h === 'number' && Number.isInteger(h)) {
      if (h >= 0 && h < columns.length) picked.add(h);
      return;
    }
    const at = columns.indexOf(canonicalColumn(h));
    if (at !== -1) picked.add(at);
  });
  return picked;
}

function normaliseRow(row, columns) {
  if (Array.isArray(row)) row = { cells: row };
  if (!isObj(row)) row = {};
  const cells = Array.isArray(row.cells) ? row.cells.map(str) : [];
  return {
    label: str(row.label),
    cells,
    picked: pickedIndices(row.highlight, columns),
    highlight: asList(row.highlight).map(str),
    counters: populations(row.counters),
    counterLabels: row.counterLabels === true,
    digits: row.digits !== false,
    answer: row.answer === true,
    worked: row.worked === true,
  };
}

// The number a row of cells spells, as a reader writes it: digits in column
// order, the point where the "." sits, thousands separators through the whole
// part. A thousands placeholder shown in the chart ("0 | 9 | 0 | 0") is written
// 900, not 0,900, so leading zeros go from the title and stay in the cells.
function numberFromCells(columns, cells) {
  let whole = '';
  let frac = '';
  let seenPoint = false;
  columns.forEach((c, i) => {
    if (c === '.') { seenPoint = true; return; }
    const d = str(cells[i]);
    if (seenPoint) frac += d; else whole += d;
  });
  const grouped = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac === '' ? grouped : grouped + '.' + frac;
}

function plural(word, qty) {
  return qty === 1 ? word : word + 's';
}

// An array because a boundary can cascade (1,990 to 2,000 needs T to H and H to
// Th). A cue naming a column the chart does not have is dropped rather than
// drawn against the wrong column.
function normaliseExchanges(pair, columns) {
  const raw = asList(pair.exchanges != null ? pair.exchanges : pair.exchange);
  return raw
    .filter((cue) => isObj(cue) && columns.includes(canonicalColumn(cue.from)) && columns.includes(canonicalColumn(cue.to)))
    .map((cue) => {
      const from = canonicalColumn(cue.from);
      const to = canonicalColumn(cue.to);
      const count = Number.isFinite(Number(cue.count)) && Number(cue.count) > 1 ? Math.min(COUNTER_MAX, Math.floor(Number(cue.count))) : 10;
      const up = (PLACE_VALUE[from] || 0) < (PLACE_VALUE[to] || 0);
      const fromQty = up ? count : 1;
      const toQty = up ? 1 : count;
      const label = cue.label != null
        ? String(cue.label)
        : `${fromQty} ${plural(COLUMN_WORD[from] || from, fromQty)} = ${toQty} ${plural(COLUMN_WORD[to] || to, toQty)}`;
      return { from, to, fromQty, toQty, label };
    });
}

// ─── the written calculation ────────────────────────────────────────────────
const OPERATORS = { '+': '+', '-': '−', '−': '−', '–': '−', x: '×', X: '×', '×': '×', '*': '×' };
const WHOLE_COLUMNS = ['O', 'T', 'H', 'Th', 'TTh', 'HTh', 'M'];
const FRACTION_COLUMNS = ['t', 'h', 'th'];
const SUPERSCRIPTS = { '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁰': '0' };

// A column sum written as stacked `rows` with the sign typed into a row's
// caption is the spelling this replaces. It is refused by name rather than
// drawn, because drawn it is the wrong picture every time: the row order, the
// sign's wide column and the even rules are exactly what the teacher sent back.
function refuseCalculationAsRows(spec) {
  if (!Array.isArray(spec.rows)) return;
  const sign = spec.rows.find((r) => isObj(r) && Object.prototype.hasOwnProperty.call(OPERATORS, str(r.label).trim()));
  if (!sign) return;
  throw new Error(
    `PLACE_VALUE_CHART_IS_A_CALCULATION: a row captioned "${str(sign.label).trim()}" is a written column calculation, and rows cannot set one out. ` +
      'Use the `calculation` field instead of `rows`: "calculation": { "operator": "+", "numbers": ["3426", "237"] } for the blank one the class completes, ' +
      'adding "answer": "3663" and "carry": { "T": "1" } for the finished one. The drawing lines the digits up and puts the answer and the carried digit in their rows.'
  );
}

function splitNumber(value, what) {
  // A number given cell by cell is one set out in the WRONG columns on purpose
  // (402 written under the thousands, for the class to catch). It is placed
  // exactly as typed; every other number is lined up by the drawing.
  if (Array.isArray(value)) return { whole: '', frac: '', placed: value.map((v) => str(v).trim()) };
  const s = str(value).replace(/[,\s]/g, '');
  if (s === '') return { whole: '', frac: '' };
  if (!/^\d+(\.\d+)?$/.test(s)) {
    throw new Error(`PLACE_VALUE_CALCULATION_INVALID: ${what} "${str(value)}" is not a number a column calculation can set out digit by digit.`);
  }
  const [whole, frac = ''] = s.split('.');
  return { whole, frac };
}

// A subtraction's exchanges, worked out from the top number so a mark can never
// disagree with the digits: for each, which digit is crossed out, what is
// written above it, and where the small 1 goes. The teacher's wall for column
// subtraction listed "12 - 8 = 4" under a sum that showed 2 - 8, because the
// drawing had no way to show the exchange (stress test of 7 October 2026; "show
// that on the place value chart too", 10 October). A column gives once and
// receives once: a 4 that gives is crossed with a 3 above it, and if it then
// receives, the small 1 stands in front of that 3; a 0 that receives first and
// then gives has its small 1 crossed out with it and a 9 above.
function normaliseCalcExchanges(c, columns, operator, top) {
  const raw = asList(c.exchanges != null ? c.exchanges : c.exchange);
  if (raw.length === 0) return null;
  const refuse = (why) => {
    throw new Error(`PLACE_VALUE_CALCULATION_INVALID: ${why}`);
  };
  if (operator !== '−') {
    refuse('`exchanges` are the crossings-out of a column subtraction. A digit carried in an addition or a multiplication goes in `carry`.');
  }
  const value = top.map((d) => (/^\d$/.test(d) ? Number(d) : 0));
  const marks = columns.map(() => ({ crossed: null, above: null, one: null }));
  // A surface that tells its steps apart by colour may give an exchange its own.
  const colours = raw.map((e) => hexColour(isObj(e) ? e.colour : ''));
  raw.forEach((e, k) => {
    const from = columns.indexOf(canonicalColumn(str(isObj(e) ? e.from : '')));
    const to = columns.indexOf(canonicalColumn(str(isObj(e) ? e.to : '')));
    const right = columns[from + 1] === '.' ? from + 2 : from + 1;
    if (from === -1 || to === -1 || columns[from] === '.' || to !== right) {
      refuse(`exchange ${k + 1} names the column that gives one and the column to its right that gets ten, for example { "from": "T", "to": "O" }.`);
    }
    if (marks[from].crossed !== null || marks[to].one !== null) {
      refuse(`exchange ${k + 1} repeats one already listed: a column gives once and receives once in a written subtraction.`);
    }
    if (value[from] < 1) {
      refuse(`exchange ${k + 1} takes one ${COLUMN_WORD[columns[from]]} and the top number has none there yet. List the exchange INTO that column first, as it is done on paper.`);
    }
    value[from] -= 1;
    value[to] += 10;
    marks[to].one = { level: marks[to].above ? 1 : 0, k };
    marks[from].crossed = k;
    marks[from].above = { text: String(value[from]), k };
  });
  return { count: raw.length, marks, colours };
}

function hexColour(value) {
  const text = str(value).trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(text) ? `#${text.toUpperCase()}` : '';
}

// ─── long multiplication ───────────────────────────────────────────────────
// The stages a long multiplication is worked through, in the order they are
// written: each digit of the second number makes a row, and every row after
// the first begins with its place-holder zero.
function longStages(digits) {
  const stages = ['set out'];
  for (let k = 0; k < digits; k += 1) {
    const place = COLUMN_PLACE[WHOLE_COLUMNS[k]];
    if (k > 0) stages.push(`${place} zero`);
    stages.push(`${place} row`);
  }
  stages.push('total');
  return stages;
}

// The whole of a long multiplication, worked: each row with what is carried
// while multiplying, then the total with what is carried while adding. A digit
// carried out of the last column is written straight into the row, as it is by
// hand, so it is never also shown small.
function workLongMultiplication(top, bottom) {
  const t = top.split('').reverse().map(Number);
  const rows = bottom.split('').reverse().map(Number).map((d, k) => {
    let carried = 0;
    const digits = [];
    const carry = {};
    t.forEach((digit, j) => {
      const v = digit * d + carried;
      carried = Math.floor(v / 10);
      digits.push(v % 10);
      if (carried && j < t.length - 1) carry[WHOLE_COLUMNS[j + 1 + k]] = String(carried);
    });
    if (carried) digits.push(carried);
    return { value: digits.reverse().join('') + '0'.repeat(k), carry };
  });
  const width = Math.max(...rows.map((r) => r.value.length));
  const digitAt = (value, i) => Number(value[value.length - 1 - i] || 0);
  let carried = 0;
  const total = [];
  const carry = {};
  for (let i = 0; i < width; i += 1) {
    const v = rows.reduce((sum, r) => sum + digitAt(r.value, i), 0) + carried;
    carried = Math.floor(v / 10);
    total.push(v % 10);
    if (carried && i < width - 1) carry[WHOLE_COLUMNS[i + 1]] = String(carried);
  }
  if (carried) total.push(carried);
  return { rows, total: total.reverse().join(''), carry };
}

// `upTo` in the words a lesson uses for it.
function stageAsked(value, stages) {
  let asked = str(value).toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  asked = asked.replace(/place ?holders?( zeros?)?/, 'zero').replace(/zeros$/, 'zero');
  if (asked === '' || asked === 'blank' || asked === 'frame' || asked === 'setout') asked = 'set out';
  if (asked === 'answer' || asked === 'all' || asked === 'finished' || asked === 'add') asked = 'total';
  if (asked === 'zero' && stages.length === 5) asked = 'tens zero';
  return stages.indexOf(asked);
}

// How far a long multiplication given with `upTo` has been worked: its stages
// in order and the one it has reached, or null for any other calculation. A
// surface that colours each step's writing (the wall) asks this, so it never
// has to know the order a long multiplication is worked in.
function longMultiplicationProgress(calculation) {
  if (!isObj(calculation) || calculation.upTo == null) return null;
  const second = str(asList(calculation.numbers)[1]).replace(/[,\s]/g, '');
  if (!/^\d{2,}$/.test(second)) return null;
  const stages = longStages(second.length);
  const at = stageAsked(calculation.upTo, stages);
  return at === -1 ? null : { stages, at };
}

// `look` in the words a lesson might use for it (see longRowColour).
const LONG_LOOKS = {
  explained: 'explained', explain: 'explained', explaining: 'explained', sentences: 'explained', model: 'explained', modelling: 'explained', modeling: 'explained',
  labelled: 'labelled', labeled: 'labelled', label: 'labelled', labels: 'labelled', practice: 'labelled',
};

// A whole number as a class reads it: 2,314 and 69,420, never 69420.
function grouped(digits) {
  const s = String(digits).replace(/^0+(?=\d)/, '');
  return s.length < 4 ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const LONG_PLACE_ONE = ['one', 'ten', 'hundred', 'thousand'];
const LONG_PLACE_MANY = ['ones', 'tens', 'hundreds', 'thousands'];
const LONG_ZEROS_FIRST = ['', 'a 0 goes', 'two 0s go', 'three 0s go'];
const LONG_HOW_MANY = ['', 'one', 'two', 'three', 'four'];

// What row k of a long multiplication is: its label, its sentence and the
// small line under the sentence. `top` and `by` are whole numbers or '' when
// the frame has none; `value` is the row once written, '' until then, so a
// sentence never gives away a row the class has not reached.
function rowMeaning(top, by, k, value) {
  if (!by) return { label: '', say: '', note: '' };
  const d = Number(by[by.length - 1 - k]);
  const part = grouped(String(d) + (d ? '0'.repeat(k) : ''));
  const note = `the ${d} ${d === 1 ? LONG_PLACE_ONE[k] : LONG_PLACE_MANY[k]}${k ? `, so ${LONG_ZEROS_FIRST[k]} in first` : ''}`;
  return {
    label: `× ${part}`,
    say: top ? `${grouped(top)} × ${part} =${value ? ` ${grouped(value)}` : ''}` : '',
    note,
  };
}

// What the total is: "add", and "144 + 720 = 864" over "add the two rows".
// Before the rows are written the sentence is the instruction alone.
function totalMeaning(rows, total, count) {
  const add = `add the ${LONG_HOW_MANY[count] || count} rows`;
  if (!rows || rows.some((r) => !r)) return { label: 'add', say: add, note: '' };
  return { label: 'add', say: `${rows.map(grouped).join(' + ')} =${total ? ` ${grouped(total)}` : ''}`, note: add };
}

// The rows of working a long multiplication has, or null for any other
// calculation. `upTo` works them out; `partials` writes them by hand.
function normaliseLong(c, operator, numbers) {
  if (c.partials == null && c.upTo == null) return null;
  const refuse = (why) => {
    throw new Error(`PLACE_VALUE_CALCULATION_INVALID: ${why}`);
  };
  if (operator !== '×') {
    refuse('`partials` and `upTo` are the rows of working of a long multiplication, so the operator is "x". Any other column calculation has one answer row: give `answer`.');
  }
  if (numbers.length !== 2) refuse('a long multiplication has exactly two `numbers`: the number being multiplied, then the number it is multiplied by.');
  const whole = (n) => !n.placed && n.frac === '' && n.whole !== '';
  const multiplier = numbers[1];
  const digits = whole(multiplier) ? multiplier.whole.length : 0;
  const placeOf = (k) => COLUMN_PLACE[WHOLE_COLUMNS[k]] || '';
  const colours = {};
  if (isObj(c.colours)) {
    Object.keys(c.colours).forEach((key) => {
      const hex = hexColour(c.colours[key]);
      if (hex) colours[key.toLowerCase().trim()] = hex;
    });
  }
  const look = c.look == null || c.look === '' ? 'labelled' : LONG_LOOKS[str(c.look).toLowerCase().trim()];
  if (!look) {
    refuse(`\`look\` is "${str(c.look)}". A long multiplication is drawn "explained" (each row's sentence beside it, for modelling the method) or "labelled" (a short label at the left of each row, for practice, answers and paper).`);
  }
  const top = whole(numbers[0]) ? numbers[0].whole : '';
  const by = whole(multiplier) ? multiplier.whole : '';

  if (c.upTo != null) {
    if (!whole(numbers[0]) || !whole(multiplier) || digits < 2) {
      refuse('`upTo` works a long multiplication out from two whole numbers, the second with two digits or more (["2314", "32"]). For anything else write the rows yourself in `partials`, and for a one-digit multiplier give `answer`.');
    }
    if (digits > CALC_MAX_PARTIALS) refuse(`a long multiplication is drawn with at most ${CALC_MAX_PARTIALS} rows of working.`);
    if (c.partials != null || (c.answer != null && c.answer !== '') || isObj(c.carry) || Array.isArray(c.carry)) {
      refuse('`upTo` works out every row, the total and what is carried from the two numbers, so leave `partials`, `answer` and `carry` out beside it (they could only disagree with it).');
    }
    const stages = longStages(digits);
    const at = stageAsked(c.upTo, stages);
    if (at === -1) {
      refuse(`\`upTo\` is "${str(c.upTo)}", which is not a stage of this long multiplication. Its stages, in order: ${stages.map((s) => `"${s}"`).join(', ')}.`);
    }
    const done = workLongMultiplication(numbers[0].whole, multiplier.whole);
    const reached = (stage) => at >= stages.indexOf(stage);
    const rowDone = done.rows.map((r, k) => reached(`${placeOf(k)} row`));
    return {
      productDigits: done.total.length,
      colours,
      look,
      meanings: done.rows.map((r, k) => rowMeaning(top, by, k, rowDone[k] ? r.value : '')),
      total: totalMeaning(rowDone.every(Boolean) ? done.rows.map((r) => r.value) : null, reached('total') ? done.total : '', digits),
      // The finished sentences, which the layout is sized by at every stage,
      // so the slides of one build line up however far each has got.
      sizeBy: done.rows.map((r, k) => rowMeaning(top, by, k, r.value)).concat(totalMeaning(done.rows.map((r) => r.value), done.total, digits)),
      addCarries: Object.keys(done.carry).length > 0,
      rows: done.rows.map((r, k) => {
        const place = placeOf(k);
        if (reached(`${place} row`)) return { value: splitNumber(r.value), carry: r.carry, zeros: k, place };
        if (k > 0 && reached(`${place} zero`)) return { value: splitNumber('0'.repeat(k)), carry: null, zeros: k, place };
        return { value: splitNumber(''), carry: null, zeros: k, place };
      }),
      answer: reached('total') ? done.total : '',
      carry: reached('total') ? done.carry : {},
    };
  }

  let rows;
  if (Array.isArray(c.partials)) rows = c.partials.slice();
  else if (typeof c.partials === 'number' && Number.isFinite(c.partials)) rows = Array.from({ length: Math.floor(c.partials) }, () => '');
  else if (c.partials === true) rows = [];
  else refuse('`partials` is the rows of working, top to bottom: ["4628", "69420"] finished, ["4628", ""] with the tens row still to do, or a number of empty rows (2) for a frame the class sets out itself.');
  // One row for each digit of the second number, however few were written.
  while (rows.length < (digits || 2)) rows.push('');
  if (rows.length > CALC_MAX_PARTIALS) refuse(`a long multiplication is drawn with at most ${CALC_MAX_PARTIALS} rows of working.`);
  const bothWhole = whole(numbers[0]) && whole(multiplier);
  // Rows written by hand may be wrong on purpose, so their sentences never say
  // what a row comes to: "3,152 x 40 =" beside a row missing its zero is the
  // question the class answers. The row under the total for a carried digit
  // stays unless the true working shows the addition carries nothing.
  const matches = bothWhole && by.length === rows.length;
  const givenCarry = (isObj(c.carry) && Object.keys(c.carry).length > 0) || (Array.isArray(c.carry) && c.carry.some((v) => !['', '0'].includes(str(v).trim())));
  return {
    productDigits: bothWhole ? String(BigInt(numbers[0].whole) * BigInt(multiplier.whole)).length : 0,
    colours,
    look,
    meanings: rows.map((r, k) => rowMeaning(top, matches ? by : '', k, '')),
    total: totalMeaning(null, '', rows.length),
    addCarries: givenCarry || !matches || Object.keys(workLongMultiplication(top, by).carry).length > 0,
    rows: rows.map((r, k) => ({
      value: splitNumber(isObj(r) ? r.answer : r, `row ${k + 1} of the working`),
      carry: isObj(r) ? r.carry : null,
      zeros: k,
      place: placeOf(k),
    })),
    answer: null,
    carry: null,
  };
}

function normaliseCalculation(spec) {
  const c = isObj(spec.calculation) ? spec.calculation : {};
  // `operator: ""` leaves the sign's place empty, for a problem where choosing
  // the operation is the child's job. Left out, it is an addition as before.
  const asked = str(c.operator == null ? '+' : c.operator).trim();
  const operator = asked === '' ? '' : OPERATORS[asked];
  if (operator === undefined) {
    throw new Error(`PLACE_VALUE_CALCULATION_INVALID: operator "${str(c.operator)}" is not one a column calculation is written with; use "+", "-" or "x", or "" to leave the sign for the child to write.`);
  }
  const numbers = asList(c.numbers).map((n, i) => splitNumber(n, `number ${i + 1}`));
  if (numbers.length < 2 || numbers.length > CALC_MAX_NUMBERS) {
    throw new Error(`PLACE_VALUE_CALCULATION_INVALID: a column calculation needs its \`numbers\`, between two and ${CALC_MAX_NUMBERS} of them, for example ["3426", "237"] (or ["", ""] with \`columns\` for the empty frame the class sets a calculation out in).`);
  }
  const long = normaliseLong(c, operator, numbers);
  const answer = splitNumber(long && long.answer != null ? long.answer : c.answer, 'the answer');
  const all = numbers.concat(answer, long ? long.rows.map((r) => r.value) : []);

  let given = Array.isArray(spec.columns) ? spec.columns.map(str) : [];
  if (given.length === 0) {
    // A long multiplication still to be worked keeps a column for every digit
    // of its answer: the first digit of 4,326 x 52 = 224,952 once had nowhere
    // to go but under the sign (stress test, 7 October 2026).
    const product = long ? long.productDigits : 0;
    const whole = Math.max(1, product, ...all.map((n) => (n.placed ? n.placed.length : n.whole.length)));
    const frac = Math.max(0, ...all.map((n) => n.frac.length));
    if (whole > WHOLE_COLUMNS.length || frac > FRACTION_COLUMNS.length) {
      throw new Error('PLACE_VALUE_CALCULATION_INVALID: these numbers are longer than the place value columns a chart has.');
    }
    given = WHOLE_COLUMNS.slice(0, whole).reverse().concat(frac ? ['.'].concat(FRACTION_COLUMNS.slice(0, frac)) : []);
  }
  const columns = given.map(canonicalColumn);
  const written = given.map((w, i) => (columns[i] !== w && /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w));
  const ones = columns.indexOf('O');
  if (ones === -1) {
    throw new Error('PLACE_VALUE_CALCULATION_INVALID: a column calculation is lined up from its ones, so `columns` must include "O" (or leave `columns` out and the drawing works them out).');
  }
  const point = columns.indexOf('.');

  // Lined up from the ones, by the drawing, so a three-digit number under a
  // four-digit one can never be typed one column out.
  const cellsOf = (n, what) => {
    if (n.placed) return columns.map((c, i) => (c === '.' ? '' : n.placed[i] || ''));
    const cells = columns.map(() => '');
    const refuse = () => {
      throw new Error(
        `PLACE_VALUE_CALCULATION_DOES_NOT_FIT: ${what} has more digits than this chart has columns (${given.join(', ')}). ` +
          'Add the column it needs, or leave `columns` out and the drawing works them out from the numbers and the answer.'
      );
    };
    n.whole.split('').reverse().forEach((d, k) => {
      const at = ones - k;
      if (at < 0 || columns[at] === '.') refuse();
      cells[at] = d;
    });
    n.frac.split('').forEach((d, k) => {
      const at = point === -1 ? -1 : point + 1 + k;
      if (at < 0 || at >= columns.length) refuse();
      cells[at] = d;
    });
    return cells;
  };

  const small = (v) => {
    const t = str(v).trim().split('').map((ch) => SUPERSCRIPTS[ch] || ch).join('');
    return t === '0' ? '' : t;
  };
  const carryCells = (raw) => {
    const out = columns.map(() => '');
    if (Array.isArray(raw)) {
      raw.slice(0, columns.length).forEach((v, i) => { if (columns[i] !== '.') out[i] = small(v); });
    } else if (isObj(raw)) {
      Object.keys(raw).forEach((key) => {
        const at = columns.indexOf(canonicalColumn(key));
        if (at === -1 || columns[at] === '.') {
          throw new Error(`PLACE_VALUE_CALCULATION_INVALID: a digit is carried into "${key}", a column this chart does not have (${given.join(', ')}).`);
        }
        out[at] = small(raw[key]);
      });
    }
    return out;
  };
  const carry = carryCells(long && long.carry ? long.carry : c.carry);
  // Each row of working: its digits, what was carried while multiplying, and
  // which of its cells are place-holder zeros (the rightmost, one for the tens
  // row and two for the hundreds), so a stage's ink can be told apart.
  const partials = !long ? null : long.rows.map((r, k) => ({
    cells: cellsOf(r.value, `row ${k + 1} of the working`),
    carry: carryCells(r.carry),
    zeros: columns.map((col, i) => col !== '.' && i > ones - r.zeros && i <= ones),
    place: r.place,
  }));

  return {
    columns,
    written,
    title: str(spec.title),
    instances: 1,
    form: 'calculation',
    squaresGive: spec.squaresGive === true,
    inBooks: spec.inBooks === true,
    headings: spec.headings !== false && spec.showHeadings !== false,
    calculation: {
      operator,
      numbers: numbers.map((n, i) => cellsOf(n, `number ${i + 1}`)),
      answer: cellsOf(answer, 'the answer'),
      carry,
      // Addition and multiplication carry a digit under the answer; subtraction
      // exchanges above the top number and has nothing to write beneath. A
      // lesson taught before exchanging is met says `carry: false`, so the
      // class is not shown a row nobody has explained yet.
      // A long multiplication's total keeps that row only when its addition
      // carries: on 24 x 36 an empty row under 864 was one more row nobody
      // could explain (the teacher, 14 October 2026).
      carryRow: operator !== '−' && c.carry !== false && !(long && !long.addCarries),
      worked: c.worked === true,
      exchange: normaliseCalcExchanges(c, columns, operator, cellsOf(numbers[0], 'number 1')),
      ring: ringColumn(c, columns),
      ringColour: hexColour(c.ringColour),
      ...(long ? {
        partials,
        // A shallow row under each row of working for what is carried while
        // multiplying, and a thick line under the total as well as above it.
        // Both are on unless a spec turns one off, which only the comparison
        // pictures made for the teacher do.
        partialCarry: c.carry !== false && (c.partialCarry == null ? LONG_CARRY_ROWS : c.partialCarry !== false),
        closingRule: c.closingRule !== false,
        colours: long.colours,
        look: long.look,
        meanings: long.meanings,
        total: long.total,
        sizeBy: long.sizeBy || long.meanings.concat(long.total),
      } : {}),
    },
  };
}

// The column whose digits are being worked, ringed: `ring: "O"`.
function ringColumn(c, columns) {
  if (c.ring == null || c.ring === '' || c.ring === false) return '';
  const column = canonicalColumn(str(c.ring));
  if (column === '.' || columns.indexOf(column) === -1) {
    throw new Error(`PLACE_VALUE_CALCULATION_INVALID: \`ring\` names "${str(c.ring)}", a column this calculation does not have (${columns.join(', ')}).`);
  }
  return column;
}

function normalise(spec = {}) {
  if (spec.calculation != null) return normaliseCalculation(spec);
  refuseCalculationAsRows(spec);
  const given = Array.isArray(spec.columns) ? spec.columns.map(str) : [];
  const columns = given.map(canonicalColumn);
  // The sheet's counter chart names its columns in lower case ("thousands"),
  // and a heading is printed the way a child reads it: "Thousands".
  const written = given.map((w, i) => (columns[i] !== w && /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w));
  if (columns.length === 0) {
    throw new Error('PLACE_VALUE_CHART_INVALID: a place value chart needs its `columns`, for example ["Th", "H", "T", "O"].');
  }
  const base = {
    columns,
    written,
    title: str(spec.title),
    instances: Math.max(1, Math.min(6, Math.floor(Number(spec.instances) || 1))),
    inBooks: spec.inBooks === true,
  };

  const p = spec.pair;
  if (isObj(p) && Array.isArray(p.from) && Array.isArray(p.to)) {
    const from = p.from.map(str);
    const to = p.to.map(str);
    const operation = str(p.operation);
    const result = numberFromCells(columns, to);
    // An explicit "" is a deliberate "no title bar".
    const title = p.title != null ? String(p.title) : operation === '' ? result : result === '' ? operation : `${operation}: ${result}`;
    const changed = new Set();
    columns.forEach((c, i) => {
      if (c === '.') return;
      if (to[i] === '') return;
      if (str(from[i]) !== to[i]) changed.add(i);
    });
    const unknown = columns.some((c, i) => c !== '.' && str(to[i]) === '');
    const counters = isObj(p.counters) ? p.counters : {};
    return {
      ...base,
      form: 'pair',
      pair: {
        from,
        to,
        operation,
        title,
        changed,
        unknown,
        fromCounters: populations(counters.from),
        toCounters: populations(counters.to),
        exchanges: normaliseExchanges(p, columns),
      },
    };
  }

  // The sheet's counter chart: `counts` and no rows.
  if (spec.rows == null && isObj(spec.counts)) {
    return {
      ...base,
      form: 'rows',
      headerOnly: false,
      rows: [normaliseRow({ counters: spec.counts, counterLabels: true, digits: false }, columns)],
    };
  }

  const headerOnly = Array.isArray(spec.rows) && spec.rows.length === 0;
  const rawRows = headerOnly ? [] : Array.isArray(spec.rows) && spec.rows.length ? spec.rows : [{ cells: columns.map(() => '') }];
  return { ...base, form: 'rows', headerOnly, rows: rawRows.map((r) => normaliseRow(r, columns)) };
}

// ─── measuring ──────────────────────────────────────────────────────────────

function widthPt(text, pt) {
  return textWidthEm(str(text), true) * pt;
}

// A board chart the children answer in their books (`inBooks: true`) has an
// empty row nobody writes in on the board: it fills only when the answers
// slide shows it. The handwriting width above was for a row the teacher might
// write in (4 September 2026), and holding a Your Turn's sums to it spread
// five view-only sums over three slides; the teacher agreed it goes when the
// children answer in books (16 October 2026). Paper is where children write,
// so a sheet keeps its squares whatever the flag says.
function writeInFor(profile, chart) {
  if (profile.surface === 'slides' && chart && chart.inBooks) return { colPt: 0, rowPt: 0 };
  return WRITE_IN[profile.surface] || WRITE_IN.worksheets;
}

// The smallest a word may print on this surface. Paper and the wall never
// shrink a chart, so a word there is never below the surface's own floor; the
// board fits a fixed zone and has always let a chart's parts shrink to shares
// of its projection floor (a digit to 0.65 of it, a heading to half).
// The smallest scale a chart given a height may be drawn at: see SLIDE_MIN_SCALE.
function boardMinScale(profile) {
  return profile.surface === 'slides' ? SLIDE_MIN_SCALE : BOARD_MIN_SCALE;
}

function floorPt(profile, boardShare) {
  return profile.heightPt ? profile.minFontPt * boardShare : profile.minFontPt;
}

// `answer` is the colour of a digit that has been worked out or that changed:
// the ring's green on the board and the wall. On a pupil sheet nothing has been
// worked out, so every printed digit is the ink of a given digit, the bottom
// row of a missing-digit sum included, while the ring itself stays green
// because a ring points and does not answer (the teacher, 9 October 2026:
// "black is fine", and "green ring with a black digit is fine").
function paletteFor(profile) {
  const pal = profile.palette === 'ink' ? INK : COLOURS;
  return { ...pal, answer: answerColour(profile, pal.ring, pal.text) };
}

function columnFills(profile, column) {
  const c = paletteFor(profile);
  if (profile.palette === 'ink') return [c.headerFill, c.cellFill];
  return COLUMN_COLOURS[column] || [c.headerFill, c.cellFill];
}

// Which spelling of the column names this chart can print, and at what size.
// The full word is preferred wherever a column is wide enough to hold it, and
// the short name (the form the schema leads with and a teacher writes on a
// whiteboard) is the fallback rather than a smaller full word. All the headings
// change together or none does: "Th | Hundreds | T | O" is a chart that cannot
// decide what it is.
//
// On a slide a heading is never under the projection floor, the same 18pt the
// digits stop at. It had been allowed half of that, and it kept the whole word
// squeezed small in preference to the short name at a size the room reads:
// "Thousands" at 11pt over three starter sums, and "HTh" at 14pt in three
// six-column sums across one slide (stress test, 7 October 2026). Nothing saw
// either, because by the time a slide is checked the words are inside a picture.
// The teacher's rulings on those pages (8 October 2026): the short name whenever
// the word will not fit at a proper size, never a second line, never under
// 18pt, and a slide split in two rather than a smaller heading. So the word is
// used where it fits at 18pt, the short name otherwise, either grows into a
// wide column up to just under the digit, and a column too narrow for even the
// short name at 18pt is refused with the width it needs. Paper and the wall are
// drawn as they were.
function headingsFor(chart, colW, D, profile, inset) {
  const onSlide = profile.surface === 'slides';
  const floor = onSlide ? profile.minFontPt : floorPt(profile, 0.5);
  const startPt = onSlide ? Math.max(floor, SLIDE_HEAD_FONT * D) : HEAD_FONT * D;
  const fit = (labels) => {
    const widest = labels.reduce((m, l, i) => (chart.columns[i] === '.' ? m : Math.max(m, textWidthEm(l, true))), 0);
    if (widest <= 0) return { font: startPt, fits: true, widest: 0 };
    const byWidth = Math.max(0.1, colW - inset) / widest;
    const font = Math.max(floor, Math.min(startPt, byWidth));
    return { font, fits: widest * font <= colW - inset + 0.01, widest, byWidth };
  };
  const written = fit(chart.written);
  if (written.fits) return { labels: chart.written, font: written.font };
  const short = fit(chart.columns);
  if (onSlide && !short.fits) {
    const longest = chart.columns.reduce((m, l, i) => (chart.columns[i] !== '.' && textWidthEm(l, true) > textWidthEm(m, true) ? l : m), '');
    throw new Error(
      `PLACE_VALUE_HEADINGS_TOO_SMALL: this chart's column headings ("${longest}") would print at ${short.byWidth.toFixed(1)}pt, below the ` +
        `${floor}pt the class reads from the board, because each column is only ${(colW / 72).toFixed(2)}in wide and the heading needs ` +
        `${((short.widest * floor + inset) / 72).toFixed(2)}in. Height is not the lever, so a taller zone will not move it: give the chart more WIDTH - ` +
        'fewer charts side by side on this slide (two across instead of three, or one above another), a wider zone, ' +
        'or a template that does not spend 40% of the board on a side panel. Where the sums will not all fit at that width, put them on two slides.'
    );
  }
  return { labels: chart.columns, font: short.font };
}

// A label fits its own column, shrinking to the floor and then wrapping onto
// further lines, so the longest label never decides how big the digits are.
function fitLabel(text, colW, startPt, floor, inset) {
  const avail = Math.max(1, colW - inset);
  const one = textWidthEm(text, true);
  if (one <= 0) return { font: startPt, lines: [] };
  const font = Math.max(floor, Math.min(startPt, avail / one));
  if (one * font <= avail + 0.01) return { font, lines: [text] };
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && widthPt(next, font) > avail) { lines.push(line); line = word; } else line = next;
  });
  if (line) lines.push(line);
  return { font, lines };
}

// Counters in a strict grid inside their own cell, so one can never drift over a
// place-value rule into the column next door. Ten goes two rows of five, which
// makes the whole exchange group countable at a glance; every surface uses the
// same arrangement because a child glancing from one to the other must count the
// same shapes in the same places.
function counterGridCols(count) {
  if (count === 10) return 5;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 5;
}

function counterLayout(w, h, count, column, labelled, D, set = {}) {
  const pad = Math.min(0.08 * 72, w * 0.08, h * 0.08);
  const innerW = Math.max(1, w - 2 * pad);
  const innerH = Math.max(1, h - 2 * pad);
  // `ring` is { kind: 'group' | 'one', margin, line }: the share of a counter a
  // ring stands off by, and the width of its line.
  if (set.close && !labelled && count >= COUNTER_CLOSE_FROM) {
    const cols = counterGridCols(count);
    const rows = Math.ceil(count / cols);
    const P = COUNTER_PITCH;
    let own = Math.min(innerW / (cols * P), innerH / (rows * P));
    // What the floor is asked of: the size the cell allows, before a ring's
    // room is taken from it, so a ring never refuses a column by itself.
    const plain = own;
    const ring = set.ring;
    const m = ring ? ring.margin : 0;
    const line = ring ? ring.line : 0;
    // The ten are parted from the counters under them when there are any.
    const parted = Boolean(ring) && ring.kind === 'group' && count > 10;
    const apart = Boolean(ring) && ring.kind === 'one' && count > 1;
    if (ring && ring.kind === 'group') {
      own = Math.min(own,
        (w - 2 * line) / ((cols - 1) * P + 1 + 2 * m),
        (h - 2 * line - (parted ? line + 1 : 0)) / ((rows - 1) * P + 1 + 2 * m + (parted ? Math.max(0, m - (P - 1)) : 0)));
    } else if (apart) {
      own = Math.min(own,
        (w - 2 * line - (cols - 1) * (line + 1)) / ((cols - 1) * (1 + m) + 1 + 2 * m),
        (h - 2 * line - (rows - 1) * (line + 1)) / ((rows - 1) * (1 + m) + 1 + 2 * m));
    }
    const d = Math.max(own, 0.1);
    const step = apart ? d * (1 + m) + line + 1 : d * P;
    const gap = parted ? Math.max(0, m * d + line + 1 - (P - 1) * d) : 0;
    return {
      cols, rows, stepW: step, stepH: step, d, raw: plain, floor: COUNTER_CLOSE_READABLE_PT, fontPt: 0, face: '',
      x0: (w - step * cols) / 2, y0: (h - step * rows - gap) / 2,
      rowY: (r) => r * step + (parted && r >= 2 ? gap : 0),
    };
  }
  const face = labelled ? counterValue(column) : '';
  const tryCols = (cols) => {
    const rows = Math.ceil(count / cols);
    const stepW = innerW / cols;
    const stepH = innerH / rows;
    const maxD = (labelled ? LABELLED_COUNTER_MAX_D : COUNTER_MAX_D) * D;
    const raw = Math.min(stepW, stepH) * (labelled ? LABELLED_FILL_SHARE : COUNTER_FILL_SHARE);
    const d = Math.min(raw, maxD);
    const fontPt = labelled ? Math.min(d * 0.6, (d * COUNTER_FACE_WIDTH) / textWidthEm(face, true)) : 0;
    return { cols, rows, stepW, stepH, d, raw, fontPt, face };
  };
  let best = tryCols(counterGridCols(count));
  // A labelled counter keeps the house arrangement when its value fits, and
  // otherwise takes whichever grid leaves the most room for the value.
  if (labelled && best.fontPt < COUNTER_FACE_MIN_PT) {
    for (let cols = 1; cols <= count; cols += 1) {
      const t = tryCols(cols);
      if (t.fontPt > best.fontPt) best = t;
    }
  }
  // A spread column whose last counter is ringed keeps a ring's width between
  // its counters, by drawing them a little smaller where the spacing is tight.
  if (set.close && !labelled && set.ring && set.ring.kind === 'one' && count > 1) {
    const clear = (Math.min(best.stepW, best.stepH) - set.ring.line - 1) / (1 + set.ring.margin);
    if (clear < best.d) best.d = Math.max(clear, 0.1);
  }
  best.x0 = (w - best.stepW * best.cols) / 2;
  best.y0 = (h - best.stepH * best.rows) / 2;
  best.rowY = (r) => r * best.stepH;
  best.floor = COUNTER_READABLE_PT;
  return best;
}

// How tall a counter band has to be for its values to print at a readable size:
// a counter with "0.01" on it cannot be shrunk to fit a band, so the band grows
// to hold the rows it needs. An empty counter chart is where the child draws
// counters, and keeps room for the nine a column can ever need.
function bandHeight(rows, columns, D) {
  let h = COUNTER_H * D;
  rows.forEach((row) => {
    if (!row.counters || !row.counterLabels) return;
    const counts = columns.map((c) => countIn(row.counters, c));
    const most = Math.max(0, ...counts);
    const needRows = most === 0 ? 3 : Math.ceil(most / counterGridCols(most));
    h = Math.max(h, (needRows * LABELLED_COUNTER_MAX_D * D) / LABELLED_FILL_SHARE + 2 * 0.08 * 72 * 0.5);
  });
  return h;
}

// ─── layout: stacked rows ───────────────────────────────────────────────────

function unitsOf(chart) {
  const dots = chart.columns.filter((c) => c === '.').length;
  const grid = chart.columns.length - dots + dots * POINT_W;
  const hasLabels = chart.form === 'rows' && chart.rows.some((r) => r.label !== '');
  const label = hasLabels ? Math.min(LABEL_COLS, (LABEL_MAX_SHARE / (1 - LABEL_MAX_SHARE)) * grid) : 0;
  return { grid, label, total: grid + label, hasLabels };
}

function isWriteRow(row, columns) {
  if (!row.digits || row.counters) return false;
  return columns.some((c, i) => c !== '.' && str(row.cells[i]) === '');
}

function stackedLayout(chart, profile) {
  const N = profile.fontPt * DIGIT_OF_FONT;
  const hi = N * MAX_SCALE;
  const lo = profile.heightPt ? Math.max(N * boardMinScale(profile), 0) : Math.max(profile.minFontPt, 0);
  const inset = CELL_INSET_OF_N * N;
  const units = unitsOf(chart);
  const n = chart.instances;
  const gap = INSTANCE_GAP * hi;
  const perChart = (profile.widthPt - (n - 1) * gap) / n;
  const writeIn = writeInFor(profile, chart);
  const rows = chart.rows;
  const hasCounters = rows.some((r) => r.counters);

  // A board chart fills its zone's width, as its table always did; paper and the
  // wall stop widening a column past the point where it is only emptier.
  let colW = perChart / units.total;
  // A column carrying counters with their values on them is as wide as three of
  // those counters, which is what the sheet's counter chart always was.
  const labelledCounters = rows.some((r) => r.counters && r.counterLabels);
  const colCap = labelledCounters ? Math.max(COL_MAX, (3 * LABELLED_COUNTER_MAX_D) / LABELLED_FILL_SHARE + 0.6) : COL_MAX;
  if (!profile.heightPt) colW = Math.min(colW, colCap * hi);

  const widestDigit = rows.reduce((m, r) => r.cells.reduce((k, c) => Math.max(k, textWidthEm(c, true)), m), 0);
  const byWidth = widestDigit > 0 ? Math.max(1, colW - inset) / widestDigit : Infinity;

  const heightIn = (D) => {
    const title = chart.title ? D * TITLE_FONT * 1.3 + TITLE_GAP * D : 0;
    let h = title + HEADER_H * D;
    const band = hasCounters ? bandHeight(rows, chart.columns, D) : 0;
    rows.forEach((row) => {
      h += band;
      if (row.digits) h += Math.max(ROW_H * D, isWriteRow(row, chart.columns) ? writeIn.rowPt : 0);
    });
    return h;
  };

  let D = Math.min(hi, byWidth);
  if (profile.heightPt) {
    // Height is priced at D, and the write rows on paper are a fixed size, so
    // walk down until it fits rather than dividing once.
    for (let k = 0; k < 40 && heightIn(D) > profile.heightPt && D > lo; k += 1) {
      D = Math.max(lo, D * Math.min(0.98, profile.heightPt / heightIn(D)));
    }
  }
  if (D < lo) D = lo;

  if (profile.heightPt && !chart.headerOnly && heightIn(D) > profile.heightPt + 0.5) {
    throw new Error(
      `PLACE_VALUE_CHART_DOES_NOT_FIT: this chart needs at least ${(heightIn(lo) / 72).toFixed(2)}in of height at its smallest readable size ` +
        `(${rows.length} row(s)${hasCounters ? ' with counters' : ''}), but its zone offers ${(profile.heightPt / 72).toFixed(2)}in. ` +
        'Give it a taller zone, fewer rows, or drop the counters.'
    );
  }
  if (!profile.heightPt && colW < Math.min(lo, 0.6 * hi) * 1.2) {
    throw new Error(
      `PLACE_VALUE_CHART_TOO_NARROW: at ${(profile.widthPt / 72 * 25.4).toFixed(0)}mm each column of this chart is ${(colW / 72 * 25.4).toFixed(1)}mm, ` +
        'too narrow to print a digit readably. Give the chart more width, or fewer charts side by side.'
    );
  }
  return { N, D, hi, lo, inset, units, colW, gap, perChart, writeIn, hasCounters, band: hasCounters ? bandHeight(rows, chart.columns, D) : 0 };
}

function describeStacked(chart, profile) {
  const L = stackedLayout(chart, profile);
  const { D, N, colW, units, inset } = L;
  const pal = paletteFor(profile);
  const cols = chart.columns;
  const labelFloor = floorPt(profile, 10 / 18);
  const heading = headingsFor(chart, colW, D, profile, inset);
  const labelW = units.label * colW;
  const colWs = cols.map((c) => (c === '.' ? colW * POINT_W : colW));
  const gridW = colWs.reduce((a, b) => a + b, 0);
  const chartW = labelW + gridW;

  // Refuse a column too narrow for its counters to be counted. Width is the
  // lever here: the counter band already has the height it needs.
  const pieces = [];
  let smallest = null;
  let facesTooSmall = null;
  const close = CLOSE_COUNTERS.has(profile.surface);
  const counterLayouts = chart.rows.map((row) =>
    cols.map((c, i) => {
      if (!row.counters || c === '.') return null;
      const count = countIn(row.counters, c);
      if (count <= 0) return null;
      return counterLayout(colWs[i], L.band, count, c, row.counterLabels, D, { close });
    })
  );
  chart.rows.forEach((row, r) => counterLayouts[r].forEach((lay) => {
    if (!lay) return;
    // The cell furthest under its own floor: a close column's is the higher one.
    if (!row.counterLabels && (smallest === null || lay.raw / lay.floor < smallest.raw / smallest.floor)) smallest = lay;
    if (row.counterLabels && lay.fontPt < COUNTER_FACE_MIN_PT) facesTooSmall = lay;
  }));
  if (smallest !== null && clearlyUnder(smallest.raw, smallest.floor, { surface: profile.surface, what: "a place value chart's counters" })) {
    throw new Error(
      `PLACE_VALUE_COUNTERS_TOO_SMALL: this chart's counters come out ${(smallest.raw / 72).toFixed(2)}in across, below the ` +
        `${(smallest.floor / 72).toFixed(3)}in a child can count from the carpet${smallest.floor > COUNTER_READABLE_PT ? ' when they stand close together' : ''}, because each column is only ${(colW / 72).toFixed(2)}in wide. ` +
        'The counter band already has the height it needs, so a taller zone will not move it: give the chart more WIDTH - a wider zone, ' +
        'one chart on this slide instead of two, or a template that does not spend 40% of the board on a side panel. ' +
        "Fewer counters in a column works too, where the lesson's numbers allow it."
    );
  }
  if (facesTooSmall) {
    throw new Error(
      `PLACE_VALUE_COUNTER_LABELS_DO_NOT_FIT: a counter's value ("${facesTooSmall.face}") would print at ${facesTooSmall.fontPt.toFixed(1)}pt, below the ` +
        `${COUNTER_FACE_MIN_PT}pt a child reads. Enlarge the chart, or use fewer simultaneous examples.`
    );
  }
  // Refuse a column too narrow to write in. If nobody writes in the chart, the
  // honest repair is to say so: print the digits, or ask for the heading strip.
  const writeRows = chart.rows.some((r) => isWriteRow(r, cols));
  if (writeRows && L.writeIn.colPt && clearlyUnder(colW, L.writeIn.colPt - 0.01, { surface: profile.surface, what: "a place value chart's write-in columns" })) {
    throw new Error(
      `PLACE_VALUE_WRITE_IN_TOO_NARROW: this chart has a row left blank for somebody to write in, but each column is only ` +
        `${(colW / 72).toFixed(3)}in wide, below the ${(L.writeIn.colPt / 72).toFixed(2)}in one handwritten digit needs at the size this chart prints its own digits. ` +
        'Height is not the lever, so a taller zone will not move it: give the chart more WIDTH - a wider zone, one chart on this slide instead of two, ' +
        'or a template that does not spend 40% of the board on a side panel. If nobody writes in this chart, say so instead: set `inBooks: true` ' +
        'when the children answer it in their books, print the digits in the blank cells, or ask for the headings alone with "rows": [] for a reference strip.'
    );
  }

  const rule = Math.max(1, GRID_W * D);
  const ringW = Math.max(3, RING_W * D);
  const ringInset = Math.max(ringW / 2 + 1, RING_INSET * D);
  const cells = [];
  const texts = [];
  const circles = [];
  const rings = [];
  const labels = [];
  const labelFonts = [];

  const drawOne = (ox) => {
    let y = 0;
    if (chart.title) {
      const tf = Math.max(floorPt(profile, 0.5), TITLE_FONT * D);
      texts.push({ role: 'title', text: chart.title, x: ox + chartW / 2, y, h: tf * 1.3, pt: tf, fill: pal.title });
      y += tf * 1.3 + TITLE_GAP * D;
    }
    const headerH = HEADER_H * D;
    // The cell above the labels stays blank: the labels name rows, not a column.
    if (labelW > 0) cells.push({ role: 'label-head', x: ox, y, w: labelW, h: headerH, fill: pal.labelFill });
    let x = ox + labelW;
    cols.forEach((c, i) => {
      cells.push({ role: 'header', column: c, x, y, w: colWs[i], h: headerH, fill: columnFills(profile, c)[0] });
      if (c !== '.') texts.push({ role: 'heading', text: heading.labels[i], x: x + colWs[i] / 2, y, h: headerH, pt: heading.font, fill: pal.text });
      x += colWs[i];
    });
    y += headerH;

    chart.rows.forEach((row, r) => {
      const digitH = row.digits ? Math.max(ROW_H * D, isWriteRow(row, cols) ? L.writeIn.rowPt : 0) : 0;
      const rowH = L.band + digitH;
      if (labelW > 0) {
        cells.push({ role: 'label', x: ox, y, w: labelW, h: rowH, fill: pal.labelFill });
        if (row.label) {
          // Twice the cell margin: a caption touching its rule reads as cramped from across a room.
          const fitted = fitLabel(row.label, labelW, LABEL_FONT * D, labelFloor, 2 * inset);
          labelFonts.push(fitted.font);
          const lineH = fitted.font * 1.25;
          const top = y + (rowH - lineH * fitted.lines.length) / 2;
          fitted.lines.forEach((line, k) =>
            texts.push({ role: 'label', text: line, x: ox + labelW / 2, y: top + k * lineH, h: lineH, pt: fitted.font, fill: pal.text })
          );
          labels.push({ text: row.label, x: ox, y, w: labelW, h: rowH, pt: fitted.font, lines: fitted.lines.length });
        }
      }
      let cx = ox + labelW;
      if (L.hasCounters) {
        cols.forEach((c, i) => {
          cells.push({ role: 'band', column: c, x: cx, y, w: colWs[i], h: L.band, fill: columnFills(profile, c)[1] });
          const lay = counterLayouts[r][i];
          if (lay) {
            const fill = profile.palette === 'ink' ? pal.cellFill : columnFills(profile, c)[0];
            const count = countIn(row.counters, c);
            for (let k = 0; k < count; k += 1) {
              const px = cx + lay.x0 + (k % lay.cols) * lay.stepW + lay.stepW / 2;
              const py = y + lay.y0 + Math.floor(k / lay.cols) * lay.stepH + lay.stepH / 2;
              circles.push({ role: 'counter', column: c, cx: px, cy: py, r: lay.d / 2, fill, stroke: pal.counterLine, sw: Math.max(0.75, 0.04 * D), face: row.counterLabels ? lay.face : '', pt: lay.fontPt });
            }
          }
          cx += colWs[i];
        });
      }
      if (row.digits) {
        const dy = y + L.band;
        const hasDigits = cols.some((c, i) => c !== '.' && str(row.cells[i]) !== '');
        cx = ox + labelW;
        cols.forEach((c, i) => {
          const isDot = c === '.';
          const picked = !isDot && row.picked.has(i);
          const text = isDot ? (hasDigits ? '.' : '') : str(row.cells[i]);
          cells.push({ role: text === '' ? 'write' : 'digit', column: c, x: cx, y: dy, w: colWs[i], h: digitH, fill: columnFills(profile, c)[1] });
          // Green says "this number is the result of working something out".
          // A RINGED cell says something narrower - "this is the digit that
          // changed" - and rings one cell in one picture, so it could never
          // say "all twelve of these are the answer". An answer slide showing a
          // completed chart printed its digits in plain black beside the
          // original number, which is the one thing on the slide that is NOT an
          // answer (the teacher, 19 September 2026: "I wish the answers on slide
          // 5 and 7, in the table were green"). `answer: true` on a row colours
          // its digits and adds no ring, so a reveal reads as a reveal and the
          // ring keeps its own meaning. In the same edit he greened a worked chain
          // that was wrong; his later answer changed that: green is a taught word
          // or an answer, and a worked example is purple, a mistaken one included
          // ("purple is fine", 24 September 2026). So a worked row is `worked: true`,
          // never `answer`, and every digit in it is the worked-example purple, the
          // ringed one included, and so is the ring (his answer of 25 September
          // 2026, shown it still green: "yes" to purple): green anywhere on a
          // worked row would call a wrong digit right.
          const worked = !isDot && row.worked && !row.answer && text !== '';
          const revealed = !isDot && row.answer && text !== '';
          if (text !== '') texts.push({ role: 'digit', text, x: cx + colWs[i] / 2, y: dy, h: digitH, pt: D, fill: worked ? pal.worked : (picked || revealed) ? pal.answer : pal.text, picked });
          const ringStroke = row.worked && !row.answer ? pal.worked : pal.ring;
          if (picked) rings.push({ x: cx + ringInset, y: dy + ringInset, w: colWs[i] - 2 * ringInset, h: digitH - 2 * ringInset, sw: ringW, column: c, stroke: ringStroke });
          cx += colWs[i];
        });
      }
      y += rowH;
    });
    return y;
  };

  let h = 0;
  for (let k = 0; k < chart.instances; k += 1) h = drawOne(k * (chartW + L.gap));
  const w = chart.instances * chartW + (chart.instances - 1) * L.gap;
  return {
    form: 'rows', D, N, colW, colWs, labelW, chartW, w, h, rule, pal,
    headings: heading, labelFonts, labels, cells, texts, circles, rings, lines: [], polys: [], bars: [],
    anchor: chart.headerOnly ? 'top' : 'middle',
  };
}

// ─── layout: the written calculation ────────────────────────────────────────

function calculationUnits(chart) {
  const dots = chart.columns.filter((c) => c === '.').length;
  const grid = chart.columns.length - dots + dots * POINT_W;
  return { grid, total: grid + CALC_OP_W };
}

// What a long multiplication adds to the written calculation's layout: its
// look, the inks that tie each digit of the multiplier to its row, the label
// column's width and the sentences' width, each as a function of D so the
// layout can size the digits and the words together. Null for any other sum.
function longParts(chart, profile, paper) {
  const calc = chart.calculation;
  const partials = calc.partials || [];
  if (!partials.length || !calc.meanings) return null;
  const pal = paletteFor(profile);
  const ink = profile.palette === 'ink';
  const all = calc.sizeBy;
  const side = !paper && calc.look === 'explained' && calc.meanings.some((m) => m.say);
  const inset = CELL_INSET_OF_N * profile.fontPt * DIGIT_OF_FONT;
  const words = { floor: profile.surface === 'slides' ? Math.max(profile.minFontPt, LONG_SLIDE_WORDS_PT) : profile.minFontPt };
  const floor = profile.minFontPt;
  const labelPt = (D) => Math.max(floor, LONG_LABEL_FONT * D);
  const sayPt = (D) => Math.max(words.floor, LONG_SAY_FONT * D);
  const notePt = (D) => Math.max(words.floor, LONG_NOTE_FONT * D);
  const labelEm = side ? 0 : Math.max(0, ...all.map((m) => (m.label ? textWidthEm(m.label, true) : 0)));
  const sayEm = Math.max(0, ...all.map((m) => textWidthEm(m.say, true)));
  // A small line too wide for the room breaks once, at its comma: "the 3
  // tens," over "so a 0 goes in first". It is the widest thing beside a
  // 4-digit by 2-digit sum, and breaking it is what lets that sum keep its
  // sentences beside a success criteria panel at the room's 18pt floor.
  const linesOf = (m, wrap) => (!m.note ? [] : wrap && m.note.includes(', ') ? [m.note.slice(0, m.note.indexOf(', ') + 1), m.note.slice(m.note.indexOf(', ') + 2)] : [m.note]);
  const noteEm = (wrap) => Math.max(0, ...all.map((m) => Math.max(0, ...linesOf(m, wrap).map((l) => textWidthEm(l, false)))));
  // A row's own colour: the one the surface gave its stage, or the look's.
  const colourOf = (k) => (calc.colours && calc.colours[`${partials[k].place} row`]) || longRowColour(k);
  const mix = (hex, share) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * share + 255 * (1 - share)));
    return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  };
  // A column beside sentences is never narrower than its short heading needs
  // at the size it prints (on a slide never under the room's floor): squeezed
  // for the sentences on the wall, "TTh" and "Th" ran into one word.
  const headEm = chart.headings ? Math.max(0, ...chart.columns.map((c) => (c === '.' ? 0 : textWidthEm(c, true)))) : 0;
  const headFloor = profile.surface === 'slides' ? profile.minFontPt : 0;
  const headNeed = (D) => (headEm ? headEm * Math.max(headFloor, HEAD_FONT * D) + inset : 0);
  const parts = {
    side,
    wrap: false,
    // The words fall to the room's floor only when the board's size cannot fit.
    smallestWords: () => { words.floor = floor; },
    headNeed,
    labelPt,
    sayPt,
    notePt,
    // a label keeps half its size clear each side, so "× 30" never touches the rule
    labelW: (D) => (labelEm ? labelEm * labelPt(D) + 2 * Math.max(inset, labelPt(D) / 2) : 0),
    sideW: (D) => (side ? (2 * LONG_SIDE_GAP + LONG_ARROW) * D + Math.max(sayEm * sayPt(D), noteEm(parts.wrap) * notePt(D)) : 0),
    // Where a row's sentence and its small line(s) go, from the row's top: the
    // sentence level with the row's digits and its arrow, the small line under
    // it; a small line broken in two lifts the sentence by half a line.
    place: (m, D, rowH) => {
      const lines = linesOf(m, parts.wrap);
      const lineH = notePt(D) * (lines.length > 1 ? 1.15 : 1.25);
      const sayTop = rowH / 2 - sayPt(D) * 0.6 - Math.max(0, lines.length - 1) * lineH * 0.5;
      const noteTop = sayTop + sayPt(D) * 1.2;
      return { sayTop, lines, lineH, noteTop, bottom: noteTop + lines.length * lineH };
    },
    // The label, the multiplier's digit, the arrow and the sentence of row k.
    ink: (k) => (ink ? pal.text : colourOf(k)),
    // The digits written in row k: the row's colour where answers are coloured,
    // the given ink on a pupil sheet, purple in a worked example.
    digitInk: (k) => (calc.worked ? pal.worked : ink ? pal.answer : answerColour(profile, colourOf(k), pal.text)),
    tint: (k) => (ink ? pal.labelFill : mix(colourOf(k), 0.2)),
    totalInk: ink ? pal.text : (calc.colours && calc.colours.total) || answerColour(profile, COLOURS.ring, pal.text),
    noteInk: ink ? pal.text : LONG_NOTE_INK,
  };
  return parts;
}

function describeCalculation(chart, profile) {
  const calc = chart.calculation;
  const cols = chart.columns;
  const pal = paletteFor(profile);
  const N = profile.fontPt * DIGIT_OF_FONT;
  const hi = N * MAX_SCALE;
  const lo = profile.heightPt ? N * boardMinScale(profile) : profile.minFontPt;
  const inset = CELL_INSET_OF_N * N;
  const units = calculationUnits(chart);
  // Paper a child writes on: square cells, as a written method is ruled in a
  // maths book, so place value lines up down the page as well as across it.
  const paper = profile.surface === 'worksheets' || profile.surface === 'stickin';
  const writeIn = paper ? { colPt: calcPaperFloorPt(profile, chart) } : writeInFor(profile, chart);

  let colW = profile.widthPt / units.total;
  if (!profile.heightPt) colW = Math.min(colW, paper ? calcPaperColPt(profile)[1] : COL_MAX * hi);

  const digitEm = textWidthEm('8', true);
  // A long multiplication's rows of working, each with its own shallow row
  // beneath for what is carried while multiplying.
  const partials = calc.partials || [];
  // ...and what each row is, in the look asked for. Paper, where the child
  // writes in the rows, is always the labelled look, and so is a frame with no
  // numbers yet, which has no sentences to say.
  const long = longParts(chart, profile, paper);
  const rowsOf = calc.numbers.length + 1 + partials.length;
  const rowH = (D) => (paper ? Math.max(colW, ROW_H * D) : ROW_H * D);
  const shallowH = (D) => (paper ? rowH(D) * CALC_CARRY_OF_ROW : CALC_CARRY_H * D);
  const carryH = (D) => (!calc.carryRow ? 0 : shallowH(D));
  const partialCarryH = (D) => (partials.length && calc.partialCarry ? shallowH(D) : 0);
  const titleH = (D) => (chart.title ? D * TITLE_FONT * 1.3 + TITLE_GAP * D : 0);
  const headH = (D) => (chart.headings ? HEADER_H * D : 0);
  // A subtraction with exchanges keeps a shallow band above its top number,
  // inside that number's own cells, for the digit written over a crossed-out one.
  const exchange = calc.exchange;
  const exchangeH = (D) => (!exchange ? 0 : paper ? rowH(D) * CALC_CARRY_OF_ROW : CALC_CARRY_H * D);
  // An explained total's sentence may reach below the last rule.
  const belowH = (D) => (!long || !long.side ? 0 : Math.max(0, long.place(calc.sizeBy[calc.sizeBy.length - 1], D, rowH(D)).bottom - rowH(D) - carryH(D)));
  const heightIn = (D) => titleH(D) + headH(D) + rowsOf * rowH(D) + carryH(D) + partials.length * partialCarryH(D) + exchangeH(D) + belowH(D);

  let D;
  if (long) {
    // A long multiplication's left column widens for its labels, and the
    // explained look's sentences take the width beside the grid, so the
    // column width and the digit size are found together: the largest digit
    // whose columns, labels and sentences fit the width (and the height).
    // Beside sentences a column is never narrower than its heading needs, or
    // than a handwritten digit needs while a row is still to be written.
    const writing = cols.some((c, i) => c !== '.' && calc.answer[i] === '') || partials.some((p) => p.cells[cols.indexOf('O')] === '');
    const minCol = (d) => Math.max(long.headNeed(d), writing && writeIn.colPt ? writeIn.colPt : 0);
    const colFor = (d) => {
      const room = profile.widthPt - long.sideW(d);
      let c = room / units.total;
      if (CALC_OP_W * c < long.labelW(d)) c = (room - long.labelW(d)) / units.grid;
      if (!profile.heightPt) c = Math.min(c, paper ? calcPaperColPt(profile)[1] : COL_MAX * hi);
      return long.side ? Math.min(c, Math.max(LONG_COL_MAX_OF_D * d, minCol(d))) : c;
    };
    const fits = (d) => {
      colW = colFor(d);
      if (d > (colW - inset) / digitEm + 0.01) return false;
      if (long.side && colW < Math.max(LONG_COL_OF_D * d, minCol(d)) - 0.01) return false;
      return !profile.heightPt || heightIn(d) <= profile.heightPt;
    };
    if (long.side && !fits(lo)) long.wrap = true;
    if (long.side && !fits(lo)) long.smallestWords();
    if (fits(hi)) D = hi;
    else if (!fits(lo)) D = lo;
    else {
      let [a, b] = [lo, hi];
      for (let k = 0; k < 30; k += 1) {
        const m = (a + b) / 2;
        if (fits(m)) a = m;
        else b = m;
      }
      D = a;
    }
    colW = colFor(D);
    if (long.side && colW < Math.max(digitEm * D + inset, minCol(D)) - 0.5) {
      const need = units.total * Math.max(LONG_COL_OF_D * lo, minCol(lo)) + long.labelW(lo) + long.sideW(lo);
      throw new Error(
        `PLACE_VALUE_CHART_TOO_NARROW: this long multiplication explained, its sentence beside each row, needs ${(need / 72).toFixed(2)}in of width ` +
          `at the smallest size the room reads, but its zone offers ${(profile.widthPt / 72).toFixed(2)}in. Give it a wider zone or its own slide, ` +
          'or draw it `"look": "labelled"` where the rows have already been explained.'
      );
    }
    // The labels too need room beside the columns, and a column narrower than
    // its digit or its heading is refused rather than drawn: the wall, trying
    // narrower and narrower layouts to fit a room, took one whose labels had
    // squeezed the columns until "TTh" and "Th" ran together (14 October 2026).
    if (!long.side && !paper && colW < Math.max(digitEm * D + inset, long.headNeed(D)) - 0.5) {
      throw new Error(
        `PLACE_VALUE_CHART_TOO_NARROW: at ${(profile.widthPt / 72 * 25.4).toFixed(0)}mm this long multiplication's labels leave each column ` +
          `${(colW / 72 * 25.4).toFixed(1)}mm, too narrow for its digits and headings. Give it more width.`
      );
    }
  } else {
    D = Math.min(hi, Math.max(1, colW - inset) / digitEm);
    if (profile.heightPt) {
      for (let k = 0; k < 40 && heightIn(D) > profile.heightPt && D > lo; k += 1) {
        D = Math.max(lo, D * Math.min(0.98, profile.heightPt / heightIn(D)));
      }
    }
  }
  if (D < lo) D = lo;
  if (profile.heightPt && heightIn(D) > profile.heightPt + 0.5) {
    throw new Error(
      `PLACE_VALUE_CHART_DOES_NOT_FIT: this column calculation needs at least ${(heightIn(lo) / 72).toFixed(2)}in of height at its smallest readable size ` +
        `(${calc.numbers.length} numbers, ${partials.length ? `${partials.length} rows of working, ` : ''}the answer${calc.carryRow ? ' and the carry row' : ''}), but its zone offers ${(profile.heightPt / 72).toFixed(2)}in. ` +
        'Give it a taller zone, or its own slide.'
    );
  }
  if (!profile.heightPt && colW < Math.min(lo, 0.6 * hi) * 1.2) {
    throw new Error(
      `PLACE_VALUE_CHART_TOO_NARROW: at ${(profile.widthPt / 72 * 25.4).toFixed(0)}mm each column of this calculation is ${(colW / 72 * 25.4).toFixed(1)}mm, ` +
        'too narrow to print a digit readably. Give it more width.'
    );
  }
  const onesAt = cols.indexOf('O');
  // A row of working is somebody's to write while its ones cell is empty.
  const blankAnswer = cols.some((c, i) => c !== '.' && calc.answer[i] === '') || partials.some((p) => p.cells[onesAt] === '');
  if (blankAnswer && writeIn.colPt && clearlyUnder(colW, writeIn.colPt - 0.01, { surface: profile.surface, what: "a column calculation's write-in columns" })) {
    throw new Error(
      `PLACE_VALUE_WRITE_IN_TOO_NARROW: this calculation's answer row is blank for somebody to write in, but each column is only ` +
        `${(colW / 72).toFixed(3)}in wide, below the ${(writeIn.colPt / 72).toFixed(2)}in one handwritten digit needs. ` +
        'Height is not the lever: give it more WIDTH - a wider zone, or one calculation on this slide instead of two. ' +
        'If the children answer it in their books and nobody writes in it on the board, set `inBooks: true` on the chart.'
    );
  }

  // A sum drawn without its heading row has no heading to size or to refuse.
  const heading = chart.headings ? headingsFor(chart, colW, D, profile, inset) : { labels: chart.columns, font: 0 };
  const opW = Math.max(CALC_OP_W * colW, long ? long.labelW(D) : 0);
  const colWs = cols.map((c) => (c === '.' ? colW * POINT_W : colW));
  const chartW = opW + colWs.reduce((a, b) => a + b, 0);
  const rule = Math.max(1, GRID_W * D);
  const heavy = Math.max(3 * rule, CALC_HEAVY_W * D);
  const cells = [];
  const texts = [];
  const lines = [];
  // The places a step can point at, by name: "sign", and for each column
  // "ones heading", "ones number 1", "ones number 2", "ones answer", "ones
  // carry". Each is the box of what is written there (the digit, not its
  // cell), so an arrow from outside the grid stops just short of the ink. A
  // step's number circle used to be dropped onto the grid by eye and landed on
  // the lines between the digits, pointing at nothing (5 October 2026).
  const points = {};
  const point = (name, cx, top, h, text, pt) => {
    const halfW = text === '' ? pt * 0.3 : (textWidthEm(text, true) * pt) / 2;
    points[name] = { cx, cy: top + h / 2, halfW, halfH: pt * 0.45, written: text !== '' };
  };
  // Everything worked out prints in the answer's green, or in the worked
  // example's purple when the class is watching it be done (or done wrong).
  // The numbers the sum was set with stay in the given ink even then: three
  // children's finished working of 4,573 - 276 drawn all purple left no way to
  // tell what they were given from what they wrote (the teacher, 16 October
  // 2026: given numbers black, the child's working purple, on every worked sum).
  const worked = calc.worked ? pal.worked : pal.answer;
  const given = pal.text;

  let y = 0;
  if (chart.title) {
    const tf = Math.max(floorPt(profile, 0.5), TITLE_FONT * D);
    texts.push({ role: 'title', text: chart.title, x: chartW / 2, y, h: tf * 1.3, pt: tf, fill: pal.title });
    y += titleH(D);
  }
  if (chart.headings) {
    const h = headH(D);
    cells.push({ role: 'label-head', x: 0, y, w: opW, h, fill: pal.labelFill });
    let x = opW;
    cols.forEach((c, i) => {
      cells.push({ role: 'header', column: c, x, y, w: colWs[i], h, fill: columnFills(profile, c)[0] });
      if (c !== '.') texts.push({ role: 'heading', text: heading.labels[i], x: x + colWs[i] / 2, y, h, pt: heading.font, fill: pal.text });
      if (COLUMN_PLACE[c]) point(`${COLUMN_PLACE[c]} heading`, x + colWs[i] / 2, y, h, heading.labels[i], heading.font);
      x += colWs[i];
    });
    y += h;
  }

  // `head` is room above the digits inside the same cells (the exchange band).
  // `fill` is one colour, or a function of the column for a row whose cells
  // were written at different stages (a place-holder zero, then the row).
  // `side` is a long multiplication's: the label cell's tint and its label.
  const row = (role, digits, h, pt, fill, sign, name, head = 0, side = {}) => {
    const inkOf = (i) => (typeof fill === 'function' ? fill(i) : fill);
    const shallow = role === 'carry' || role === 'partial-carry';
    cells.push({ role: 'label', x: 0, y, w: opW, h: h + head, fill: side.tint || pal.labelFill });
    if (side.label) {
      texts.push({ role: 'row-label', of: role, text: side.label, x: opW / 2, y: y + head, h, pt: side.pt, fill: side.ink });
      // "row 1 label", "answer label": where a wall's step is pinned to a row
      // from the left, so its arrow lands on the label and never crosses it.
      point(`${name} label`, opW / 2, y + head, h, side.label, side.pt);
    }
    const cellTop = y;
    y += head;
    if (sign) {
      const signPt = Math.min(D, (opW * 0.8) / textWidthEm(sign, true));
      texts.push({ role: 'operator', text: sign, x: opW / 2, y, h, pt: signPt, fill: given });
      point('sign', opW / 2, y, h, sign, signPt);
    }
    const any = cols.some((c, i) => c !== '.' && digits[i] !== '');
    let x = opW;
    cols.forEach((c, i) => {
      const text = c === '.' ? (any && !shallow ? '.' : '') : digits[i];
      const cellRole = shallow ? 'carry' : text === '' && (role === 'answer' || role === 'partial') ? 'write' : 'digit';
      cells.push({ role: cellRole, row: role, column: c, x, y: cellTop, w: colWs[i], h: h + head, fill: columnFills(profile, c)[1] });
      if (text !== '') texts.push({ role: shallow ? 'carry' : 'digit', row: role, column: c, text, x: x + colWs[i] / 2, y, h, pt, fill: inkOf(i) });
      if (COLUMN_PLACE[c]) point(`${COLUMN_PLACE[c]} ${name}`, x + colWs[i] / 2, y, h, text, pt);
      x += colWs[i];
    });
    const top = y;
    y += h;
    return { y: top, h };
  };

  const marks = { numbers: [] };
  const strikes = [];
  const rings = [];
  calc.numbers.forEach((digits, i) => {
    const last = i === calc.numbers.length - 1;
    // Each digit of the multiplier is the colour of the row it makes.
    const ink = long && last ? (j) => (onesAt - j >= 0 && onesAt - j < partials.length ? long.ink(onesAt - j) : given) : given;
    marks.numbers.push(row('number', digits, rowH(D), D, ink, last ? calc.operator : '', `number ${i + 1}`, i === 0 ? exchangeH(D) : 0));
  });
  if (exchange) {
    // Each exchange's marks share one colour: the worked colour, or the colour a
    // surface gives that exchange (the wall's step sheet colours each by its step).
    // On the wall an exchange nobody coloured is still not the answer's green:
    // beside green step numbers and a green answer the crossings-out vanished
    // into them ("you got the exchanging which is also green", 10 October 2026).
    const wall = profile.surface === 'wall' && !calc.worked ? CALC_EXCHANGE_WALL : [];
    const colourOf = (k) => exchange.colours[k] || (Array.isArray(profile.exchangeColours) && profile.exchangeColours[k]) || wall[k % (wall.length || 1)] || worked;
    const top = marks.numbers[0];
    const bandH = exchangeH(D);
    const bandY = top.y - bandH;
    const abovePt = CALC_ABOVE_FONT * D;
    const digitW = digitEm * D;
    const oneEm = textWidthEm('1', true);
    const strikeW = Math.max(1.5, CALC_STRIKE_W * D);
    let x = opW;
    cols.forEach((c, i) => {
      const m = exchange.marks[i];
      const cx = x + colWs[i] / 2;
      x += colWs[i];
      if (c === '.') return;
      const oneBelow = m.one && m.one.level === 0;
      const oneAbove = m.one && m.one.level === 1;
      // The small 1 in front of the top digit: 2 becomes 12.
      const onePt = CALC_ONE_FONT * D;
      const oneW = oneEm * onePt;
      const oneX = cx - digitW / 2 - oneW / 2;
      if (oneBelow) {
        texts.push({ role: 'exchange-one', row: 'number', column: c, text: '1', x: oneX, y: top.y, h: top.h * 0.62, pt: onePt, fill: colourOf(m.one.k) });
      }
      if (m.crossed !== null) {
        const left = (oneBelow ? oneX - oneW / 2 : cx - digitW / 2) - 0.05 * D;
        strikes.push({ role: 'cross-out', column: c, x1: left, y1: top.y + top.h * 0.82, x2: cx + digitW / 2 + 0.05 * D, y2: top.y + top.h * 0.18, sw: strikeW, stroke: colourOf(m.crossed) });
      }
      if (m.above) {
        const leadPt = abovePt * 0.75;
        const lead = oneAbove ? oneEm * leadPt : 0;
        const aboveW = textWidthEm(m.above.text, true) * abovePt;
        texts.push({ role: 'exchange', row: 'exchange', column: c, text: m.above.text, x: cx + lead / 2, y: bandY, h: bandH, pt: abovePt, fill: colourOf(m.above.k) });
        if (oneAbove) {
          texts.push({ role: 'exchange-one', row: 'exchange', column: c, text: '1', x: cx + lead / 2 - aboveW / 2 - lead / 2, y: bandY, h: bandH * 0.8, pt: leadPt, fill: colourOf(m.one.k) });
        }
      }
      if (COLUMN_PLACE[c]) point(`${COLUMN_PLACE[c]} exchange`, cx, bandY, bandH, m.above ? m.above.text : '', abovePt);
    });
    marks.exchange = { y: bandY, h: bandH };
  }
  if (calc.ring) {
    // One ring round the column's digits in every number: what is being worked.
    const i = cols.indexOf(calc.ring);
    const left = opW + colWs.slice(0, i).reduce((a, b) => a + b, 0);
    const inset = RING_INSET * D;
    // In a long multiplication the ring is round the one digit being
    // multiplied by: every digit of the top number meets it in turn.
    const last = marks.numbers[marks.numbers.length - 1];
    const first = partials.length ? last : marks.numbers[0];
    rings.push({ role: 'working-column', column: calc.ring, x: left + inset, y: first.y + inset, w: colWs[i] - 2 * inset, h: last.y + last.h - first.y - 2 * inset, sw: Math.max(3, RING_W * D), stroke: calc.ringColour || pal.ring });
  }
  const rules = [y];
  // A stage's ink: the colour a surface gave it, or the worked colour. A row of
  // working's is its row's colour, its place-holder zero included; the wall's
  // step sheet gives each stage its step's colour instead.
  const stageInk = (stage) => (calc.colours && calc.colours[stage]) || worked;
  const polys = [];
  if (partials.length) {
    marks.partials = partials.map((p, k) => {
      const rowInk = (calc.colours && calc.colours[`${p.place} row`]) || long.digitInk(k);
      const zeroInk = (calc.colours && calc.colours[`${p.place} zero`]) || rowInk;
      const tint = long.tint(k);
      const label = long.side ? {} : { label: calc.meanings[k].label, pt: long.labelPt(D), ink: long.ink(k) };
      const at = row('partial', p.cells, rowH(D), D, (i) => (p.zeros[i] ? zeroInk : rowInk), '', `row ${k + 1}`, 0, { tint, ...label });
      if (calc.partialCarry) at.carry = row('partial-carry', p.carry, partialCarryH(D), CALC_CARRY_FONT * D, rowInk, '', `row ${k + 1} carry`, 0, { tint });
      return at;
    });
    rules.push(y);
  }
  const totalInk = partials.length ? stageInk('total') : worked;
  const totalLabel = long && !long.side ? { label: calc.total.label, pt: long.labelPt(D), ink: long.totalInk } : {};
  marks.answer = row('answer', calc.answer, rowH(D), D, totalInk, '', 'answer', 0, totalLabel);
  if (!partials.length || calc.closingRule) rules.push(y);
  if (calc.carryRow) marks.carry = row('carry', calc.carry, carryH(D), CALC_CARRY_FONT * D, totalInk, '', 'carry');
  // The two thick rules, across the whole calculation: the big equals sign.
  rules.forEach((ry) => lines.push({ role: 'heavy-rule', x1: 0, y1: ry, x2: chartW, y2: ry, sw: heavy, stroke: pal.text }));

  // The explained look: beside each row, an arrow to it and what it is.
  let w = chartW;
  let h = y;
  if (long && long.side) {
    const sayPt = long.sayPt(D);
    const notePt = long.notePt(D);
    const arrowX = chartW + LONG_SIDE_GAP * D;
    const textX = arrowX + LONG_ARROW * D + LONG_SIDE_GAP * D;
    const say = (m, at, ink, role) => {
      const cy = at.y + at.h / 2;
      const spot = long.place(m, D, at.h);
      const shaft = Math.max(2, 0.12 * D);
      const head = 0.55 * D;
      lines.push({ role: 'say-arrow', x1: arrowX + head * 0.9, y1: cy, x2: arrowX + LONG_ARROW * D, y2: cy, sw: shaft, stroke: ink });
      polys.push({ points: [[arrowX, cy], [arrowX + head, cy - head * 0.5], [arrowX + head, cy + head * 0.5]], fill: ink });
      texts.push({ role, text: m.say, x: textX, y: at.y + spot.sayTop, h: sayPt * 1.2, pt: sayPt, fill: ink, anchor: 'start' });
      spot.lines.forEach((line, i) => texts.push({ role: `${role}-note`, text: line, x: textX, y: at.y + spot.noteTop + i * spot.lineH, h: spot.lineH, pt: notePt, fill: long.noteInk, anchor: 'start', weight: 'normal' }));
      h = Math.max(h, at.y + spot.bottom);
    };
    // Sized by the finished sentences, so a build's slides are one size.
    w = chartW + long.sideW(D);
    h = Math.max(h, y + belowH(D));
    marks.partials.forEach((at, k) => say(calc.meanings[k], at, long.ink(k), 'say'));
    say(calc.total, marks.answer, long.totalInk, 'say');
  }

  return {
    form: 'calculation', D, N, colW, colWs, labelW: opW, chartW, w, h, rule, heavy, pal,
    headings: heading, labelFonts: [], labels: [], cells, texts, circles: [], rings, lines, polys, bars: [], strikes,
    rows: marks, anchor: 'middle', points,
  };
}

// ─── layout: the pair ───────────────────────────────────────────────────────

// The one clean exchange between two charts of counters, or null.
//
// Ten counters leave one column and one arrives in the column to its left
// (ten tens for a hundred, in addition), or one leaves and ten arrive in the
// column to its right (a hundred for ten tens, in subtraction), and every
// other column is as it was. Anything else, two exchanges at once included,
// is not a picture the rings can tell truthfully, so nothing is marked.
// Returns which chart ("from" or "to") holds the group of ten and in which
// column, and the same for the single counter.
function exchangeBetween(pair, cols) {
  if (!pair.fromCounters || !pair.toCounters) return null;
  const places = cols.filter((c) => c !== '.');
  const change = places.map((c) => countIn(pair.toCounters, c) - countIn(pair.fromCounters, c));
  const moved = change.map((d, i) => (d === 0 ? -1 : i)).filter((i) => i >= 0);
  if (moved.length !== 2 || moved[1] !== moved[0] + 1) return null;
  const [big, small] = [places[moved[0]], places[moved[1]]];
  const [dBig, dSmall] = [change[moved[0]], change[moved[1]]];
  if (dBig === 1 && dSmall === -10) return { group: { chart: 'from', column: small }, one: { chart: 'to', column: big } };
  if (dBig === -1 && dSmall === 10) return { group: { chart: 'to', column: small }, one: { chart: 'from', column: big } };
  return null;
}

// Which way a pair with counters too small has to grow.
//
// The refusal used to say "more WIDTH" whatever held the counters down. A pair
// is scaled to fit its zone both ways, so in a short zone it is height that
// holds it: a Year 4 column addition slide (6 October 2026) stood a full-width
// pair in half of a column, was told to find width it already had all of, and
// the fault cleared the moment the pair's share of the height was raised. So
// the pair is laid out again taller, and again wider, and the lever named is
// the one that made the counters bigger. Each is tried at up to three times the
// size, because a little more of the right thing does not always show: a pair
// in a narrow zone is drawn at its smallest scale, and its counters do not grow
// until the zone is wide enough to lift it off that. Where no height is set (a
// sheet, a wall card) width is the only lever there is, as before.
function pairCounterLever(chart, profile, raw) {
  const widthOnly = 'Give the pair more WIDTH, or its own slide.';
  if (profile.leverProbe) return '';
  if (!profile.heightPt) return widthOnly;
  const with_ = (change) => {
    try {
      describePair(chart, { ...profile, ...change, leverProbe: true });
      return Infinity;
    } catch (error) {
      return Number.isFinite(error.counterRaw) ? error.counterRaw : null;
    }
  };
  const bigger = (size) => size !== null && size > raw * 1.03;
  const grows = (field) => [1.5, 2, 3].some((times) => bigger(with_({ [field]: profile[field] * times })));
  const taller = grows('heightPt');
  const wider = grows('widthPt');
  if (taller && wider) return 'Give the pair more HEIGHT or more WIDTH (either makes the counters bigger), or its own slide.';
  if (taller) {
    return 'Height is the lever here, not width: give the pair a taller zone or a bigger share of its column, or its own slide.';
  }
  if (wider) return `${widthOnly} A taller zone will not move it.`;
  return 'Neither a taller nor a wider zone makes them bigger: put fewer counters in a column, or give the pair its own slide.';
}

function describePair(chart, profile) {
  const pair = chart.pair;
  const cols = chart.columns;
  const pal = paletteFor(profile);
  const N = profile.fontPt * DIGIT_OF_FONT;
  const hasCounters = Boolean(pair.fromCounters || pair.toCounters);
  const hi = N * PAIR_MAX_SCALE;
  // On a slide the pair stops at 18pt digits like the chart ("yes same 18pt
  // floor", the teacher, 6 October 2026); anywhere else it keeps its own scales.
  const lo = !profile.heightPt ? profile.minFontPt
    : profile.surface === 'slides' ? N * SLIDE_MIN_SCALE
      : N * (hasCounters ? PAIR_COUNTER_MIN_SCALE : PAIR_BOARD_MIN_SCALE);
  const inset = CELL_INSET_OF_N * N;
  const smallFloor = floorPt(profile, 0.5);
  const units = unitsOf({ ...chart, form: 'pair' }).grid;
  const hasTitle = pair.title !== '';
  const exchanges = pair.exchanges;
  const anySame = !pair.unknown && cols.some((c, i) => c !== '.' && !pair.changed.has(i));

  const titleFontAt = (D) => Math.max(smallFloor, Math.max(TITLE_FONT * D, Math.min(profile.fontPt, 1.2 * D)));
  const opFontAt = (D) => Math.max(smallFloor, PAIR_OP_FONT * D);
  const narrowArrow = profile.pairArrow === 'narrow';
  const exchange = profile.pairExchangeMarks ? exchangeBetween(pair, cols) : null;
  let groupMidY = null;
  const opAbove = narrowArrow && Boolean(pair.operation) && !exchanges.some((cue) => cue.label === pair.operation);
  const gapAt = (D) => (narrowArrow
    ? PAIR_GAP_NARROW * D
    : Math.max(PAIR_GAP * D, pair.operation ? widthPt(pair.operation, opFontAt(D)) + 2 * PAIR_ARROW_INSET * D + 4 : 0));
  // Counters need wider columns than digits do: a column one digit wide gave a
  // Year 4 exchange slide counters a tenth of an inch across.
  const colFactor = hasCounters ? PAIR_COUNTER_COL_W : COL_W;
  const widthAt = (D) => 2 * units * colFactor * D + gapAt(D);
  const heightAt = (D) => {
    let h = 0;
    if (hasTitle) h += Math.max(PAIR_TITLE_H * D, titleFontAt(D) * 1.45) + PAIR_TITLE_GAP * D;
    if (exchanges.length) h += EXCHANGE_H * D + EXCHANGE_GAP * D;
    if (opAbove) h += PAIR_OP_BAND_H * D;
    h += HEADER_H * D + (hasCounters ? COUNTER_H * D : 0) + ROW_H * D;
    if (anySame) h += SAME_H * D;
    return h;
  };

  let D = hi;
  for (let k = 0; k < 60; k += 1) {
    const over = Math.max(
      widthAt(D) / profile.widthPt,
      profile.heightPt ? heightAt(D) / profile.heightPt : 0,
      profile.pairMaxHeightPt ? heightAt(D) / profile.pairMaxHeightPt : 0
    );
    if (over <= 1.0005 || D <= lo) break;
    D = Math.max(lo, D / Math.max(1.002, over));
  }
  if (widthAt(D) > profile.widthPt + 0.5 || (profile.heightPt && heightAt(D) > profile.heightPt + 0.5)) {
    throw new Error(
      `PLACE_VALUE_CHART_DOES_NOT_FIT: this before-and-after pair needs at least ${(widthAt(lo) / 72).toFixed(2)}in x ${(heightAt(lo) / 72).toFixed(2)}in ` +
        `to print its digits readably${hasCounters ? ' with counters' : ''}${exchanges.length ? ' and an exchange cue' : ''}, and was given ` +
        `${(profile.widthPt / 72).toFixed(2)}in${profile.heightPt ? ` x ${(profile.heightPt / 72).toFixed(2)}in` : ''}. ` +
        'Beside a written sum, give it only the two columns the exchange moves between and no `exchanges` cue; otherwise give it a full-width zone, or show the two charts on their own slide.'
    );
  }

  const gap = gapAt(D);
  // On the board a counter pair takes the width its zone has spare, up to the
  // widest a counter column is useful, so its counters are as big as they can be.
  const colW = hasCounters && (profile.heightPt || narrowArrow)
    ? Math.max(colFactor * D, Math.min((narrowArrow ? PAIR_COUNTER_COL_MAX_NARROW : PAIR_COUNTER_COL_MAX) * D, (profile.widthPt - gap) / (2 * units)))
    : colFactor * D;
  const colWs = cols.map((c) => (c === '.' ? colW * POINT_W : colW));
  const chartW = colWs.reduce((a, b) => a + b, 0);
  const totalW = 2 * chartW + gap;
  const heading = headingsFor(chart, colW, D, profile, inset);
  const rule = Math.max(1, GRID_W * D);
  const ringW = Math.max(3, RING_W * D);
  const ringInset = Math.max(ringW / 2 + 1, RING_INSET * D);
  const markW = Math.max(3.5, EXCHANGE_MARK_W * D);
  const cells = [];
  const texts = [];
  const circles = [];
  const rings = [];
  const lines = [];
  const polys = [];
  const bars = [];

  let y = 0;
  if (hasTitle) {
    const th = Math.max(PAIR_TITLE_H * D, titleFontAt(D) * 1.45);
    const pad = 0.4 * D;
    const tf = Math.max(smallFloor, Math.min(titleFontAt(D), (totalW - 2 * pad) / Math.max(0.1, textWidthEm(pair.title, true))));
    bars.push({ role: 'title-bar', x: 0, y, w: totalW, h: th, r: PAIR_TITLE_R * D, fill: pal.title });
    texts.push({ role: 'title', text: pair.title, x: totalW / 2, y, h: th, pt: tf, fill: pal.titleInk });
    y += th + PAIR_TITLE_GAP * D;
  }

  if (exchanges.length) {
    const eh = EXCHANGE_H * D;
    const cueGap = Math.min(EXCHANGE_GAP * D, totalW * 0.02);
    const cueW = (totalW - cueGap * (exchanges.length - 1)) / exchanges.length;
    exchanges.forEach((cue, i) => {
      const cx = i * (cueW + cueGap);
      bars.push({ role: 'exchange-box', x: cx, y, w: cueW, h: eh, r: 0.12 * D, fill: pal.cellFill, stroke: pal.grid, sw: rule });
      const labelPt = Math.max(smallFloor, Math.min(EXCHANGE_FONT * D, (cueW - 0.4 * D) / Math.max(0.1, textWidthEm(cue.label, true))));
      const labelH = labelPt * 1.3;
      const picH = Math.max(0.3 * D, eh - labelH - 0.2 * D);
      const groupW = cueW * 0.34;
      const leftX = cx + cueW * 0.04;
      const rightX = cx + cueW - cueW * 0.04 - groupW;
      [[cue.from, cue.fromQty, leftX], [cue.to, cue.toQty, rightX]].forEach(([column, qty, gx]) => {
        const lay = counterLayout(groupW, picH, qty, column, false, D);
        const fill = profile.palette === 'ink' ? pal.cellFill : columnFills(profile, column)[0];
        for (let k = 0; k < qty; k += 1) {
          circles.push({
            role: 'exchange-counter', column,
            cx: gx + lay.x0 + (k % lay.cols) * lay.stepW + lay.stepW / 2,
            cy: y + 0.1 * D + lay.y0 + Math.floor(k / lay.cols) * lay.stepH + lay.stepH / 2,
            r: Math.max(1.5, Math.min(lay.raw * 1.2, COUNTER_MAX_D * D) / 2), fill, stroke: pal.counterLine, sw: Math.max(0.75, 0.04 * D), face: '', pt: 0,
          });
        }
      });
      const ay = y + 0.1 * D + picH / 2;
      arrowParts(lines, polys, leftX + groupW + 0.1 * D, rightX - 0.1 * D, ay, Math.max(1.5, 0.14 * D), 0.35 * D, pal.title);
      texts.push({ role: 'exchange-label', text: cue.label, x: cx + cueW / 2, y: y + eh - labelH - 0.05 * D, h: labelH, pt: labelPt, fill: pal.text });
    });
    y += eh + EXCHANGE_GAP * D;
  }

  if (opAbove) {
    const band = PAIR_OP_BAND_H * D;
    const opPt = Math.max(smallFloor, Math.min(opFontAt(D), (totalW - 0.8 * D) / Math.max(0.1, textWidthEm(pair.operation, true))));
    texts.push({ role: 'operation', text: pair.operation, x: totalW / 2, y, h: band, pt: opPt, fill: pal.title });
    y += band;
  }

  const chartY = y;
  // The two cells of a clean exchange keep room for its rings whether or not
  // the marks are asked for, so a marked pair and an unmarked one set their
  // counters in the same places.
  const closePair = CLOSE_COUNTERS.has(profile.surface);
  const exchanged = exchangeBetween(pair, cols);
  const ringIn = (pops, column) => {
    const which = pops === pair.fromCounters ? 'from' : 'to';
    const kind = exchanged && ['group', 'one'].find((k) => exchanged[k].chart === which && exchanged[k].column === column);
    return kind ? { kind, margin: EXCHANGE_MARK_MARGIN, line: markW } : null;
  };
  const drawChart = (ox, cells_, pops, picked, which) => {
    const headerH = HEADER_H * D;
    let x = ox;
    cols.forEach((c, i) => {
      cells.push({ role: 'header', column: c, x, y: chartY, w: colWs[i], h: headerH, fill: columnFills(profile, c)[0] });
      if (c !== '.') texts.push({ role: 'heading', text: heading.labels[i], x: x + colWs[i] / 2, y: chartY, h: headerH, pt: heading.font, fill: pal.text });
      x += colWs[i];
    });
    let yy = chartY + headerH;
    if (hasCounters) {
      const band = COUNTER_H * D;
      x = ox;
      cols.forEach((c, i) => {
        cells.push({ role: 'band', column: c, x, y: yy, w: colWs[i], h: band, fill: columnFills(profile, c)[1] });
        const count = countIn(pops, c);
        if (count > 0 && c !== '.') {
          const mark = exchange && [exchange.group, exchange.one].find((m) => m.chart === which && m.column === c);
          const lay = counterLayout(colWs[i], band, count, c, false, D, { close: closePair, ring: ringIn(pops, c) });
          if (clearlyUnder(lay.raw, lay.floor, { surface: profile.surface, what: "a before-and-after chart's counters" })) {
            const refusal = new Error(
              `PLACE_VALUE_COUNTERS_TOO_SMALL: this pair's counters come out ${(lay.raw / 72).toFixed(2)}in across, below the ` +
                `${(lay.floor / 72).toFixed(3)}in a child can count from the carpet${lay.floor > COUNTER_READABLE_PT ? ' when they stand close together' : ''}. ${pairCounterLever(chart, profile, lay.raw)}`
            );
            refusal.counterRaw = lay.raw;
            throw refusal;
          }
          const fill = profile.palette === 'ink' ? pal.cellFill : columnFills(profile, c)[0];
          if (mark) {
            // The group is the first ten counters, which the grid sets out as
            // two full rows of five; the single counter is the last one drawn.
            const isGroup = mark === exchange.group;
            const first = isGroup ? 0 : count - 1;
            const last = isGroup ? Math.min(count, 10) - 1 : count - 1;
            const margin = EXCHANGE_MARK_MARGIN * lay.d + markW / 2;
            const left = x + lay.x0 + (first % lay.cols) * lay.stepW + lay.stepW / 2 - lay.d / 2 - margin;
            const right = x + lay.x0 + ((isGroup ? lay.cols - 1 : last % lay.cols)) * lay.stepW + lay.stepW / 2 + lay.d / 2 + margin;
            const top = yy + lay.y0 + lay.rowY(Math.floor(first / lay.cols)) + lay.stepH / 2 - lay.d / 2 - margin;
            const base = yy + lay.y0 + lay.rowY(Math.floor(last / lay.cols)) + lay.stepH / 2 + lay.d / 2 + margin;
            const box = { x: Math.max(left, x + markW), y: top, w: Math.min(right, x + colWs[i] - markW) - Math.max(left, x + markW), h: base - top, column: c };
            rings.push({ ...box, role: 'exchange-mark-halo', sw: markW * 1.9, stroke: '#FFFFFF' });
            rings.push({ ...box, role: isGroup ? 'exchange-group' : 'exchange-one', sw: markW });
            if (isGroup) groupMidY = top + (base - top) / 2;
          }
          for (let k = 0; k < count; k += 1) {
            circles.push({
              role: 'counter', column: c,
              cx: x + lay.x0 + (k % lay.cols) * lay.stepW + lay.stepW / 2,
              cy: yy + lay.y0 + lay.rowY(Math.floor(k / lay.cols)) + lay.stepH / 2,
              r: lay.d / 2, fill, stroke: pal.counterLine, sw: Math.max(0.75, 0.04 * D), face: '', pt: 0,
            });
          }
        }
        x += colWs[i];
      });
      yy += band;
    }
    const rowH = ROW_H * D;
    x = ox;
    cols.forEach((c, i) => {
      const isDot = c === '.';
      const on = !isDot && picked.has(i);
      const text = isDot ? '.' : str(cells_[i]);
      cells.push({ role: text === '' ? 'write' : 'digit', column: c, x, y: yy, w: colWs[i], h: rowH, fill: columnFills(profile, c)[1] });
      if (text !== '') texts.push({ role: 'digit', text, x: x + colWs[i] / 2, y: yy, h: rowH, pt: D, fill: on ? pal.answer : pal.text, picked: on });
      if (on) rings.push({ x: x + ringInset, y: yy + ringInset, w: colWs[i] - 2 * ringInset, h: rowH - 2 * ringInset, sw: ringW, column: c });
      x += colWs[i];
    });
    return yy + rowH;
  };

  // The start chart carries no rings: nothing has happened to it yet.
  const bottom = drawChart(0, pair.from, pair.fromCounters, new Set(), 'from');
  const rightX = chartW + gap;
  drawChart(rightX, pair.to, pair.toCounters, pair.changed, 'to');

  // The arrow across the gap at the charts' middle, with the operation above it:
  // the only mark in the picture that says something HAPPENED.
  // When an exchange is marked the arrow and its words take the rings' green,
  // so the group, the arrow and the new counter read as one move. The arrow
  // leaves level with the ringed group where its words still sit inside the
  // charts' own height there; where they would rise past the headings it stays
  // at the middle, green.
  const marked = groupMidY !== null;
  const wordsOnArrow = Boolean(pair.operation) && !narrowArrow;
  const shaft = Math.max(3, PAIR_ARROW_W * D);
  const opPt = wordsOnArrow
    ? Math.max(smallFloor, Math.min(opFontAt(D), (gap - 2 * PAIR_ARROW_INSET * D) / Math.max(0.1, textWidthEm(pair.operation, true))))
    : 0;
  const wordsTopAt = (arrowY) => arrowY - shaft / 2 - 0.2 * D - opPt * 1.2;
  const ay = marked && (!wordsOnArrow || wordsTopAt(groupMidY) >= chartY) ? groupMidY : (chartY + bottom) / 2;
  const arrowColour = marked ? pal.ring : pal.title;
  arrowParts(lines, polys, chartW + PAIR_ARROW_INSET * D, rightX - PAIR_ARROW_INSET * D, ay, shaft, PAIR_ARROW_HEAD * D, arrowColour);
  if (wordsOnArrow) {
    texts.push({ role: 'operation', text: pair.operation, x: chartW + gap / 2, y: wordsTopAt(ay), h: opPt * 1.2, pt: opPt, fill: arrowColour });
  }

  let h = bottom;
  if (anySame) {
    const sh = SAME_H * D;
    let sx = rightX;
    cols.forEach((c, i) => {
      if (c !== '.' && !pair.changed.has(i)) {
        const pt = Math.max(smallFloor, Math.min(SAME_FONT * D, (colWs[i] * 0.9) / textWidthEm(SAME_TEXT, true)));
        texts.push({ role: 'same', text: SAME_TEXT, x: sx + colWs[i] / 2, y: bottom + 0.1 * D, h: pt * 1.3, pt, fill: profile.palette === 'ink' ? pal.text : SAME_COLOURS[c] || pal.grid, column: c });
      }
      sx += colWs[i];
    });
    h += sh;
  }

  return {
    form: 'pair', D, N, colW, colWs, chartW, w: totalW, h, rule, pal, headings: heading,
    cells, texts, circles, rings, lines, polys, bars, labels: [], labelFonts: [], anchor: 'middle',
  };
}

function arrowParts(lines, polys, x1, x2, y, shaft, head, colour) {
  const headLen = Math.min(head, Math.max(2, (x2 - x1) * 0.45));
  lines.push({ x1, y1: y, x2: x2 - headLen, y2: y, sw: shaft, stroke: colour });
  polys.push({ points: [[x2, y], [x2 - headLen, y - headLen * 0.4], [x2 - headLen, y + headLen * 0.4]], fill: colour });
}

// ─── drawing ────────────────────────────────────────────────────────────────

function resolveProfile(profileOrSurface, box) {
  return typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  // Laid out inside the box less the stroke that bleeds past the drawing's edge.
  const profile = insetProfile(resolveProfile(profileOrSurface, box), 1.5);
  const chart = normalise(spec);
  if (chart.form === 'calculation') return describeCalculation(chart, profile);
  return chart.form === 'pair' ? describePairOrSmaller(spec, chart, profile) : describeStacked(chart, profile);
}

// A counters pair beside a written sum on a slide draws smaller rather than
// refuse. Drawn whole, the pair was a full-slide picture: a lesson that put it
// beside the sum it explains lost the criteria (Year 4 Lesson 29) or spread one
// model over two or three slides (Lessons 30 and 31, 15 October 2026). The
// teacher chose the sum, the counters and the criteria on one slide, and agreed
// the counters may show only the columns that change (16 October 2026). So when
// the whole pair does not fit, it is drawn again, first without its exchange cue
// box, whose swap the green rings and arrow already show, then without the
// columns the exchange does not touch. Only a clean single exchange, which is
// ringed, is shortened: a "10 more" pair keeps every column, because its "same"
// columns are what it teaches. The counters' own floor is never lowered.
function describePairOrSmaller(spec, chart, profile) {
  try {
    return describePair(chart, profile);
  } catch (error) {
    const sizeFault = /^PLACE_VALUE_(CHART_DOES_NOT_FIT|COUNTERS_TOO_SMALL)/.test(error.message);
    if (!sizeFault || profile.surface !== 'slides' || !profile.pairExchangeMarks || profile.leverProbe) throw error;
    if (!exchangeBetween(chart.pair, chart.columns)) throw error;
    for (const smaller of smallerPairs(spec, chart)) {
      try {
        return describePair(normalise(smaller), profile);
      } catch (retry) {
        if (!/^PLACE_VALUE_(CHART_DOES_NOT_FIT|COUNTERS_TOO_SMALL)/.test(retry.message)) throw retry;
      }
    }
    throw error;
  }
}

function smallerPairs(spec, chart) {
  const out = [];
  const pair = { ...spec.pair, title: chart.pair.title };
  delete pair.exchanges;
  delete pair.exchange;
  if (chart.pair.exchanges.length) out.push({ ...spec, pair });
  const cols = chart.columns;
  if (cols.includes('.')) return out;
  const p = chart.pair;
  const keep = cols
    .map((c, i) => i)
    .filter((i) => str(p.from[i]) !== str(p.to[i]) || countIn(p.fromCounters, cols[i]) !== countIn(p.toCounters, cols[i]));
  if (keep.length < 2 || keep.length === cols.length) return out;
  const pick = (list) => keep.map((i) => list[i]);
  const counts = (pops) => Object.fromEntries(keep.map((i) => [cols[i], countIn(pops, cols[i])]));
  out.push({
    ...spec,
    columns: pick(spec.columns),
    pair: {
      ...pair,
      from: pick(p.from),
      to: pick(p.to),
      ...(p.fromCounters || p.toCounters ? { counters: { from: counts(p.fromCounters), to: counts(p.toCounters) } } : {}),
    },
  });
  return out;
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const font = profile.font;
  // Rings sit inside their cells, so only the outer rule bleeds past the edge.
  const bleed = 1.5;
  const parts = [];
  const text = (t) => {
    const baseline = t.y + t.h / 2 + t.pt * 0.35;
    return `<text x="${f2(t.x)}" y="${f2(baseline)}" text-anchor="${t.anchor || 'middle'}" font-family="${font}" font-size="${f2(t.pt)}" font-weight="${t.weight || 'bold'}" fill="${t.fill}">${esc(t.text)}</text>`;
  };
  L.bars.forEach((b) => parts.push(`<rect x="${f2(b.x)}" y="${f2(b.y)}" width="${f2(b.w)}" height="${f2(b.h)}" rx="${f2(b.r)}" ry="${f2(b.r)}" fill="${b.fill}"${b.stroke ? ` stroke="${b.stroke}" stroke-width="${f2(b.sw)}"` : ''}/>`));
  L.cells.forEach((c) => parts.push(`<rect x="${f2(c.x)}" y="${f2(c.y)}" width="${f2(c.w)}" height="${f2(c.h)}" fill="${c.fill}" stroke="${L.pal.grid}" stroke-width="${f2(L.rule)}"/>`));
  L.circles.forEach((c) => {
    parts.push(`<circle cx="${f2(c.cx)}" cy="${f2(c.cy)}" r="${f2(c.r)}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${f2(c.sw)}"/>`);
    if (c.face) parts.push(`<text x="${f2(c.cx)}" y="${f2(c.cy + c.pt * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(c.pt)}" font-weight="bold" fill="${L.pal.text}">${esc(c.face)}</text>`);
  });
  L.lines.forEach((l) => parts.push(`<line x1="${f2(l.x1)}" y1="${f2(l.y1)}" x2="${f2(l.x2)}" y2="${f2(l.y2)}" stroke="${l.stroke}" stroke-width="${f2(l.sw)}"/>`));
  L.polys.forEach((p) => parts.push(`<polygon points="${p.points.map((q) => `${f2(q[0])},${f2(q[1])}`).join(' ')}" fill="${p.fill}"/>`));
  L.texts.forEach((t) => parts.push(text(t)));
  (L.strikes || []).forEach((l) => parts.push(`<line x1="${f2(l.x1)}" y1="${f2(l.y1)}" x2="${f2(l.x2)}" y2="${f2(l.y2)}" stroke="${l.stroke}" stroke-width="${f2(l.sw)}" stroke-linecap="round"/>`));
  // Rings last, so a neighbouring cell drawn afterwards never paints over half.
  L.rings.forEach((r) => parts.push(`<rect x="${f2(r.x)}" y="${f2(r.y)}" width="${f2(r.w)}" height="${f2(r.h)}" fill="none" stroke="${r.stroke || L.pal.ring}" stroke-width="${f2(r.sw)}"/>`));
  const w = L.w + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  if (!L.points) return { svg, w, h, aspect: w / h, layout: L, anchor: L.anchor };
  // Each named place as [x%, y%, half-width%, half-height%, written] of the
  // drawing; `written` is 1 where something is printed, so an arrow to one
  // place can keep off the writing in another.
  const pointAt = {};
  Object.keys(L.points).forEach((name) => {
    const p = L.points[name];
    pointAt[name] = [((p.cx + bleed) / w) * 100, ((p.cy + bleed) / h) * 100, (p.halfW / w) * 100, (p.halfH / h) * 100, p.written ? 1 : 0];
  });
  return { svg, w, h, aspect: w / h, layout: L, anchor: L.anchor, anchors: { pointAt } };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  const chart = normalise(spec);
  // Every field that changes the picture is in the key: two pairs of one chart
  // differ only in their `to` cells, and two counter charts only in their
  // populations, and a key blind to either hands the second picture the first.
  const plain = JSON.stringify(chart, (k, v) => (v instanceof Set ? [...v] : v));
  return `pvchart:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${plain}`;
}

// The narrowest box the chart can be drawn in on a surface that does not shrink
// it: every digit column at the write-in floor when anyone writes in it, and at
// a readable digit's width otherwise.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets') {
  const profile = resolveProfile(profileOrSurface, { widthPt: 500 });
  const chart = normalise(spec);
  const N = profile.fontPt * DIGIT_OF_FONT;
  const hi = N * MAX_SCALE;
  if (chart.form === 'pair') {
    const units = unitsOf({ ...chart, form: 'pair' }).grid;
    return 2 * units * COL_W * profile.minFontPt + PAIR_GAP * profile.minFontPt + 20;
  }
  if (chart.form === 'calculation') {
    // Every digit column at the width one handwritten digit needs where the
    // answer is written in, and the bleed the layout keeps clear.
    const blank = chart.columns.some((c, i) => c !== '.' && chart.calculation.answer[i] === '') ||
      (chart.calculation.partials || []).some((p) => p.cells[chart.columns.indexOf('O')] === '');
    const paper = profile.surface === 'worksheets' || profile.surface === 'stickin';
    const writeInPt = paper ? calcPaperFloorPt(profile, chart) : writeInFor(profile, chart).colPt;
    const colPt = Math.max(COL_W * profile.minFontPt, blank ? writeInPt : 0);
    // A long multiplication's labels widen its left column, and the explained
    // look's sentences stand beside it.
    const long = longParts(chart, profile, paper);
    const D = Math.min(hi, (colPt - CELL_INSET_OF_N * N) / textWidthEm('8', true));
    const extra = long ? Math.max(0, long.labelW(D) - CALC_OP_W * colPt) + long.sideW(profile.minFontPt) : 0;
    return calculationUnits(chart).total * colPt + extra + 2 * 1.5 + 1;
  }
  const units = unitsOf(chart);
  const writeIn = writeInFor(profile, chart);
  const writes = chart.rows.some((r) => isWriteRow(r, chart.columns));
  const labelled = chart.rows.some((r) => r.counters && r.counterLabels);
  let col = Math.max(COL_W * profile.minFontPt, writes ? writeIn.colPt : 0);
  // three counters with their values on them, side by side, and the cell padding
  if (labelled) col = Math.max(col, (3 * LABELLED_COUNTER_MAX_D * hi) / LABELLED_FILL_SHARE + 12);
  const n = chart.instances;
  return n * units.total * col + (n - 1) * INSTANCE_GAP * hi + 2 * 1.5 + 1; // and the bleed the layout keeps clear
}

// Generic inline action cue: one mark in each column. It deliberately omits
// place headings so it remains honest for whole-number and decimal charts.
function onePerColumnCueSvg() {
  const w = 240;
  const h = 92;
  const cellW = 76;
  const cols = [COLUMN_COLOURS.H, COLUMN_COLOURS.T, COLUMN_COLOURS.O];
  const parts = [];
  cols.forEach((col, i) => {
    const x = 6 + i * cellW;
    parts.push(`<rect x="${x}" y="6" width="${cellW}" height="80" fill="${col[1]}" stroke="${COLOURS.grid}" stroke-width="5"/>`);
    parts.push(`<circle cx="${x + cellW / 2}" cy="46" r="13" fill="${COLOURS.text}"/>`);
  });
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = {
  tightSvg,
  cacheKey,
  normalise,
  describeLayout,
  minWidthPt,
  onePerColumnCueSvg,
  COLUMN_COLOURS,
  SAME_COLOURS,
  canonicalColumn,
  counterValue,
  labelledCounterGrid,
  counterGridCols,
  longMultiplicationProgress,
};
