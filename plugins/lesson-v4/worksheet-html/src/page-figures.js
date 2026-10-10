"use strict";

// The sizes the designers plan a sheet with, read from the engine itself.
//
// A planner prices a sheet before it exists: so much for a table, so much for
// each written answer, so much for the gap under a question, against so much
// page. Those figures were typed by hand into four places (the two planning
// designers' instructions, the price list in preferences.md, the measuring
// tool's closing sentence), and only the engine was ever updated. By the
// stress test of 7 October 2026 the notes said a portrait page held 225mm
// where it held 239mm, the gap under a question was 8mm where it printed 6mm,
// a child's speech bubble 35mm where it printed 21mm, a five-row table 80mm
// for 74mm. Every error ran the same way, so a seven-question plan read 25 to
// 30mm fuller than its page and content was cut that would have fitted.
//
// So the figures are worked out here, from the same functions the page is laid
// out with, and the prices are measured in the browser that prints the sheet.
// scripts/build-page-prices.js writes them into the documents, and
// test/page-figures.test.js fails when a document says anything else.
//
// The page figure is the whole of the work area and nothing is held back from
// it. The planners used to be given about 13mm less than the page, unsaid, as
// a margin against estimates; shown a sheet whose work ran down to the trim
// strip (a Year 3 rocks sheet, 240mm of 248mm), the teacher said "how it is is
// fine" (9 October 2026), and the heights are measured now, not estimated.

const { TRIM_STRIP_MM } = require("./page");

// Each figure is measured from a real piece laid out by the engine, never
// restated: no constant here can fall out of step with the one the page uses.
function pageFigures() {
  const { contentArea, zoneContentMm } = require("./render");
  const { measureContent, needsContent } = require("./helpers");
  const { numbered } = require("./worksheet");
  const whole = (orientation) =>
    zoneContentMm({ w: 1, h: 1 }, contentArea({ orientation }));
  const half = (orientation) =>
    zoneContentMm({ w: 0.5, h: 1 }, contentArea({ orientation }));
  const portrait = whole("portrait");
  const landscape = whole("landscape");

  // Measured, not restated: two bare questions one above the other are their
  // two heights plus the gap; a numbered piece needs its own width plus the
  // number's; a row of two is its parts plus the gap between them.
  const one = { helper: "questions", items: ["34 + 25 ="], phase: "upper" };
  const asQuestion = (item) => numbered([{ ...item, question: true }])[0];
  const alone = measureContent(asQuestion(one), portrait.wMm);
  const pair = numbered([{ stack: [{ ...one, question: true }, { ...one, question: true }] }])[0];
  const questionGapMm = measureContent(pair, portrait.wMm) - alone * 2;
  const line = { helper: "instruction", text: "Write it.", phase: "upper" };
  const numberGutterMm =
    needsContent(asQuestion(line)).minWidthMm - needsContent(line).minWidthMm;
  const rowGapMm =
    needsContent({ row: [line, line] }).minWidthMm - needsContent(line).minWidthMm * 2;

  return {
    stripMm: TRIM_STRIP_MM,
    portrait: { widthMm: Math.round(portrait.wMm), heightMm: Math.round(portrait.hMm) },
    landscape: { widthMm: Math.round(landscape.wMm), heightMm: Math.round(landscape.hMm) },
    portraitColumnMm: Math.round(half("portrait").wMm),
    landscapeColumnMm: Math.round(half("landscape").wMm),
    questionGapMm: Math.round(questionGapMm),
    numberGutterMm: Math.round(numberGutterMm),
    rowGapMm: Math.round(rowGapMm),
  };
}

// The measuring tool's closing sentence, so it cannot quote a gap the page
// does not print.
function measureFooter(figures = pageFigures()) {
  return (
    "Price a plan with the height at the width the piece will really get: words " +
    "grow taller as their column narrows. A stack's height adds its parts and " +
    `${figures.questionGapMm}mm between one question and the next; a row is as tall ` +
    `as its tallest part and as wide as its parts plus ${figures.rowGapMm}mm between ` +
    "each. Anything marked `question: true` is measured with its printed number, " +
    `which takes ${figures.numberGutterMm}mm of width beside it.`
  );
}

// The ordinary pieces a planner prices, each as the engine would be given it.
// Years 4 to 6 unless a piece says otherwise; the younger writing line is
// measured where it changes the price.
const TABLE = (rows) => ({
  helper: "recording-table",
  columns: ["Rock", "Hardness", "Permeable?"],
  writing: ["word", "word", "word"],
  rows: Array.from({ length: rows }, (_, i) => [String.fromCharCode(65 + i), null, null]),
});
const WRITTEN = (text, lines) => ({
  question: true,
  helper: "written-answers",
  items: [{ text, lines }],
});
const ONE_LINE = "Find the perimeter of the shape.";
const TWO_LINES =
  "Zoe puts a fence all the way round the garden. How many metres of fence does she " +
  "need to buy altogether?";

// A photograph a child labels, as an empty picture of a given shape: its
// height on the page follows the picture's shape and nothing it shows. One
// price for "a diagram" was right only for a wide picture; on the sheets of
// the twenty stress-test lessons the labelled photographs, charts and picture
// rows printed anywhere from 53mm to 125mm tall.
const LABELLED = (widthPx, heightPx) => ({
  helper: "label-diagram",
  text: "Label the plant.",
  imageHref:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' " +
    `width='${widthPx}' height='${heightPx}' viewBox='0 0 ${widthPx} ${heightPx}'/%3E`,
  imageWidth: widthPx,
  imageHeight: heightPx,
  labels: [
    ["flower", 43, 29],
    ["leaves", 27, 43],
    ["stem", 58, 35],
    ["roots", 63, 67],
  ].map(([label, x, y]) => ({ anchor: [x, y], label, given: false })),
});

const PRICE_SPECS = {
  diagramWide: LABELLED(1500, 1000),
  diagramSquare: LABELLED(1000, 1000),
  diagramTall: LABELLED(1000, 1500),
  barChart: {
    helper: "bar-chart",
    title: "Our favourite sports",
    categories: ["Football", "Swimming", "Tennis", "Cricket"],
    values: [12, 8, 6, 4],
    yMax: 14,
    yInterval: 2,
  },
  heading: { helper: "section-label", text: "Fluency" },
  claimShort: {
    helper: "named-claim",
    speaker: "Amara",
    says: "The area of the garden is 58 square metres.",
    lines: 0,
  },
  claimLong: {
    helper: "named-claim",
    speaker: "Mo",
    says:
      "Shape 2 has a smaller area than Shape 1, so it must have a smaller perimeter " +
      "as well, because a shape that covers less ground always has less edge round " +
      "it, whatever the two shapes look like when you draw them side by side.",
    lines: 0,
  },
  table3: TABLE(3),
  table5: TABLE(5),
  instruction1: { helper: "instruction", text: "Write each length next to its letter." },
  instruction2: {
    helper: "instruction",
    text:
      "Draw a line from the inside corner to make two rectangles, then write the length " +
      "and the width of each rectangle next to the sides you have just made on the shape.",
  },
  circle: { helper: "circle-the-answer", prompt: "Circle the larger decimal.", options: ["0.48", "0.6"] },
  calculation: { question: true, helper: "questions", items: ["34 + 25 ="] },
  numberLine: { helper: "blank-surface", surface: "number-line", start: 0, end: 100, work: "above" },
  source: {
    helper: "source-text",
    heading: "From the school log book",
    paragraphs: [
      "Attendance is poor this week. Many of the older boys are away at the harvest and will not return before the end of the month.",
      "The infants' room is cold. The stove smokes badly and the children nearest the window cannot hold their pens.",
    ],
    attribution: "Log book, October 1885",
  },
  written2: WRITTEN(ONE_LINE, 2),
  written4: WRITTEN(ONE_LINE, 4),
  writtenLongQuestion: WRITTEN(TWO_LINES, 2),
};
// The same written answers on the younger line.
const LOWER_SPECS = { written2: WRITTEN(ONE_LINE, 2), written4: WRITTEN(ONE_LINE, 4) };

/**
 * Every price, in whole millimetres, at a portrait sheet's full width.
 *
 * With a browser the heights are the browser's (the page as it prints); with
 * none they are the helpers' own arithmetic, and `measured` says which.
 */
async function measurePrices(options = {}) {
  const { measureContent } = require("./helpers");
  const { withPhase, numbered } = require("./worksheet");
  const { calibrate } = require("./browser-measure");
  const widthMm = pageFigures().portrait.widthMm;

  const prepared = {};
  for (const [name, spec] of Object.entries(PRICE_SPECS)) {
    prepared[name] = numbered([withPhase(spec, "upper")])[0];
  }
  for (const [name, spec] of Object.entries(LOWER_SPECS)) {
    prepared[`${name}Lower`] = numbered([withPhase(spec, "lower")])[0];
  }

  const all = () => {
    const out = {};
    for (const [name, spec] of Object.entries(prepared)) out[name] = measureContent(spec, widthMm);
    return out;
  };
  const calibration = await calibrate(all, options);
  const mm = all();

  const r = Math.round;
  const tableRow = (mm.table5 - mm.table3) / 2;
  return {
    measured: calibration.available,
    diagramWide: r(mm.diagramWide),
    diagramSquare: r(mm.diagramSquare),
    diagramTall: r(mm.diagramTall),
    barChart: r(mm.barChart),
    heading: r(mm.heading),
    claimShort: r(mm.claimShort),
    claimLong: r(mm.claimLong),
    tableBase: r(mm.table3 - tableRow * 3),
    tableRow: r(tableRow),
    table3: r(mm.table3),
    table5: r(mm.table5),
    instructionLine: r(mm.instruction1),
    circle: r(mm.circle),
    calculation: r(mm.calculation),
    numberLine: r(mm.numberLine),
    source: r(mm.source),
    written: r(mm.written2),
    writtenLine: r((mm.written4 - mm.written2) / 2),
    writtenQuestionLine: r(mm.writtenLongQuestion - mm.written2),
    writtenLower: r(mm.written2Lower),
    writtenLineLower: r((mm.written4Lower - mm.written2Lower) / 2),
  };
}

// The sentences the documents carry. One function each, so the script that
// writes a document and the test that reads it cannot word them differently.

// preferences.md -> The printed page: what a sheet has to plan against.
function pageSentence(f = pageFigures()) {
  return (
    `That leaves ${f.portrait.heightMm}mm of stacked height in portrait, or ` +
    `${f.landscape.heightMm}mm of height and ${f.landscape.widthMm}mm of width in landscape, ` +
    "and a sheet may be planned to the whole of it: the strip is already off those " +
    "figures and the prices below are measured, so nothing more is held back."
  );
}

// preferences.md -> The printed page: the price list.
function pricesSentence(p, f = pageFigures()) {
  const gaps = 7 * f.questionGapMm;
  return (
    "Prices, measured by the worksheet engine in the browser that prints the sheet, each " +
    `at a portrait sheet's full width (${f.portrait.widthMm}mm): ` +
    "a photograph a child labels in four places is as tall as its picture's shape makes " +
    `it, ${p.diagramWide}mm when the picture is wide (three across to two down), ` +
    `${p.diagramSquare}mm when it is square and ${p.diagramTall}mm when it is tall (two across ` +
    "to three down), and shorter roughly in proportion in a narrower column; " +
    `a bar chart ${p.barChart}mm; a map or plate the height you state for it; ` +
    `a source extract of two short paragraphs ${p.source}mm; ` +
    `a table a child writes in ${p.tableBase}mm plus ${p.tableRow}mm for every row, so three ` +
    `rows is ${p.table3}mm and five rows ${p.table5}mm; ` +
    `a section heading such as Fluency ${p.heading}mm; ` +
    `a speech bubble holding one child's claim ${p.claimShort}mm for one short sentence ` +
    `and ${p.claimLong}mm for a claim of about forty words; ` +
    `a printed instruction or reference line ${p.instructionLine}mm for each line of print; ` +
    `a row of answers to circle ${p.circle}mm; ` +
    `a short calculation ${p.calculation}mm; ` +
    `a blank number line a child draws their own jumps on ${p.numberLine}mm; ` +
    "a working box the height you state for it; " +
    `every response that needs real written work ${p.written}mm for two lines of a child's ` +
    `handwriting under a one-line question (${p.writtenLower}mm in Years 1 to 3), ` +
    `${p.writtenLine}mm for each further handwriting line (${p.writtenLineLower}mm in Years 1 ` +
    `to 3) and ${p.writtenQuestionLine}mm for each further line of the question. ` +
    `Then add ${f.questionGapMm}mm for the gap above every question after the first, because ` +
    `eight questions is ${gaps}mm of gaps that no single price shows.`
  );
}

// The numbers a sentence carries, in order, for comparing a document's copy
// with a fresh measurement a millimetre or two apart (another machine's fonts).
function numbersIn(text) {
  return (text.match(/\d+(?=mm)/g) || []).map(Number);
}

module.exports = {
  pageFigures,
  measureFooter,
  measurePrices,
  pageSentence,
  pricesSentence,
  numbersIn,
  PRICE_SPECS,
};
