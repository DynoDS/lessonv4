"use strict";

// A fraction in any drawing's label is stacked: installed before a drawing is
// taken hold of (shared/visuals/stacked-fraction-labels.js).
require("../../../shared/visuals/stacked-fraction-labels").installOnSharedDrawings();

// Helpers: the things that go IN a zone.
//
// This is the worksheet equivalent of a slide's content objects. A helper knows
// four things about itself, and they live together in ONE entry so they cannot
// drift apart:
//
//   render(spec)            → the HTML
//   measure(spec, widthMm)  → how tall it naturally wants to be at that width
//   needs(spec, widthMm?)   → usable floors, at the actual width when supplied
//   greed                   → how much spare height it should absorb
//   enough(spec, widthMm)   → the height past which more stops being a gain
//
// `needs` is a function of the content, not a constant per helper. A
// four-column table needs more width than a two-column one, and a chart with
// eight categories needs more than one with three.
//
// Heights are estimated arithmetically rather than measured in a browser, on
// purpose: a scheduled cloud build has no browser, so a height that could only
// be discovered by rendering would work on one machine and not the other. The
// browser check verifies these estimates rather than replacing them.

// Each file exports { helpers, css }: the helpers it provides and the styling
// they need. Adding a helper touches one file and nothing else.
const { boldMarkedInHtml } = require("./shared");
const { stackFractionsInHtml } = require("../../../shared/text/stacked-fractions");
const { legibleWidthMm } = require("./shared");
const { withoutTaughtMarks } = require("../../../shared/text/criteria-marks");
const { PRIMITIVES } = require("../../../shared/visual-parity");
const { makeCompose, css: composeCss, GAP_MM, isRow, isStack, itemsOf } = require("./compose");

const FILES = [
  require("./text"),
  require("./tables"),
  require("./visuals"),
  require("./drawn"),
  require("./forms"),
  require("./matching"),
  require("./frames"),
  require("./methods"),
  require("./comparing"),
  require("./placevalue"),
  require("./money"),
  require("./scales-and-diagrams"),
  require("./geometry"),
  require("./science"),
  require("./geography"),
];

// A drawn helper's stated minimum says how small it can be BUILT. It also has
// to say how small it can be READ, and the two are not the same: an SVG is
// scaled to its zone, so its labels shrink with it. Rather than ask every
// helper's author to work that out and get it right, it is computed from the
// drawing itself and applied here, once, to all of them.
//
// This is not belt and braces. A number line stated 70mm, at which its labels
// printed at three and a half point, and every other check passed: it fitted,
// nothing clipped, the page looked finished.
function withLegibilityFloor(helper) {
  if (helper.physical) return helper;
  return {
    ...helper,
    needs: (spec, widthMm) => {
      const stated = helper.needs(spec, widthMm);
      const legible = legibleWidthMm(helper.render(spec));
      const minWidthMm = Math.max(stated.minWidthMm, legible);
      return {
        ...stated,
        minWidthMm,
        minHeightMm: reachableHeightMm(helper, spec, stated, minWidthMm),
      };
    },
  };
}

// A minimum height a helper can never reach only ever refuses good pages.
//
// `fits` compares the content's NATURAL height, at the width its zone actually
// gives it, against this number. For text that works: text wraps, so a narrow
// zone makes it taller and the minimum is its height at the widest zone. For
// anything scaled by its width it is backwards - a picture gets TALLER as it
// gets WIDER, so a minimum measured at the widest zone is the TALLEST the
// content could be, and the helper is refused for being shorter than its own
// worst case.
//
// Six helpers were doing this. A row of three photographs claimed it needed
// 59mm and genuinely needed 33mm at half-page width, so it was refused from
// every zone on the page but one. That cost a real below sheet two of its
// questions and its only reasoning question, which is how it was found.
//
// So the stated minimum is clamped to what the helper actually measures at its
// own narrowest allowed width. Anything above that is unreachable by
// construction, and a check that cannot pass is not a check.
function reachableHeightMm(helper, spec, stated, minWidthMm) {
  if (!stated.minHeightMm) return stated.minHeightMm;
  try {
    return Math.min(stated.minHeightMm, helper.measure(spec, minWidthMm));
  } catch {
    // A helper that cannot measure itself at its own minimum width has a
    // bigger problem than this, and it belongs to whatever raised it.
    return stated.minHeightMm;
  }
}

// A figure's words are drawn into its picture by a shared drawing, which
// prints a taught word's braces as written, so every figure the parity
// manifest lists for the sheet is handed its spec without them: inside a
// picture the word prints plain (the colours release's third check).
//
// A chip bank is the exception, as it is on the board (builder/src/
// figure-marks.js): its chips are words a child reads, not words inside a
// picture, and the braces are how it learns which chip is a taught word. It
// takes them off itself.
const READS_OWN_MARKS = new Set(["chip-bank"]);
const FIGURE_HELPERS = new Set(
  PRIMITIVES.flatMap((p) => [].concat(p.worksheets || [])).filter((name) => name && !READS_OWN_MARKS.has(name))
);

function withPlainFigureWords(helper) {
  const out = { ...helper };
  for (const [key, fn] of Object.entries(helper)) {
    if (typeof fn === "function") out[key] = (spec, ...rest) => fn(withoutTaughtMarks(spec), ...rest);
  }
  return out;
}

const REGISTRY = {};
for (const file of FILES) {
  for (const [name, helper] of Object.entries(file.helpers)) {
    if (REGISTRY[name]) {
      throw new Error(
        `DUPLICATE_HELPER: "${name}" is defined in two helper files.`
      );
    }
    REGISTRY[name] = withLegibilityFloor(FIGURE_HELPERS.has(name) ? withPlainFigureWords(helper) : helper);
  }
}

// Several helpers can share one zone, stacked or side by side. A group asks
// and answers the same four questions a single helper does, which is what lets
// the two be used interchangeably and lets groups nest inside groups.
const {
  renderContent,
  measureContent,
  needsContent,
  greedContent,
  fillsContent,
  enoughContent,
  describeContent,
  inspectContent,
} = makeCompose({
  render: renderHelper,
  measure,
  needs: leafNeeds,
  byArithmetic,
  greed,
  fills,
  enough,
});

// Every helper's CSS, gathered for the renderer to drop into the page.
const helperCss = [...FILES.map((f) => f.css || ""), composeCss, require("./in-book").css].join("\n");

function entry(name) {
  const found = REGISTRY[name];
  if (!found) {
    throw new Error(
      `UNKNOWN_HELPER: "${name}". Known: ${Object.keys(REGISTRY).sort().join(", ")}`
    );
  }
  return found;
}

// The third argument lets a helper that grows ask where its growing stops, in
// the same millimetres the layout used (the browser's where it measured), so
// a cap it draws on itself can never sit below what the page really needs.
//
// Every piece's finished words pass through the stacked fraction here, so a
// fraction typed with a slash in any helper's text prints top and bottom, and
// the browser measures the piece as it will print (shared/text/stacked-fractions.js).
// The same for words typed **like this**, which print bold (helpers/shared.js).
function renderHelper(spec, widthMm) {
  return stackFractionsInHtml(
    boldMarkedInHtml(
      entry(spec.helper).render(spec, widthMm, {
        usefulMm: () => enough(spec, widthMm),
      })
    )
  );
}

// The heights a browser reported for pieces it was shown (src/browser-measure.js
// fills this before a real page is laid out; it is empty in the unit tests and
// on a machine with no browser, where every height is the helper's arithmetic).
const browserHeights = new Map();
let recording = null;

// A photograph is held as its whole file in the spec. Its two ends and its
// length name it well enough, and a key the size of the picture, built on
// every measurement, is what made a sheet of photographs slow to lay out.
function shortened(key, value) {
  return typeof value === "string" && value.length > 400
    ? `${value.length}:${value.slice(0, 60)}${value.slice(-60)}`
    : value;
}

function measureKey(spec, widthMm) {
  return `${Math.round(widthMm * 10)}|${JSON.stringify(spec, shortened)}`;
}

// A piece's smallest usable height is its own arithmetic. Once the browser has
// measured the piece, the two are no longer in the same units: a line of words
// the arithmetic calls 20mm, minimum 20mm, drawn at 19.6mm, would be refused as
// too short for itself. So the minimum comes down by exactly what the browser
// took off the piece's height, which leaves the question the check was asking
// (is this piece, by its own arithmetic, big enough to use?) with the answer it
// had before.
function leafNeeds(spec, widthMm) {
  const found = entry(spec.helper);
  const stated = found.needs(spec, widthMm);
  if (!browserHeights.size || !Number.isFinite(widthMm) || !stated.minHeightMm) return stated;
  const lowered = found.measure(spec, widthMm) - measure(spec, widthMm);
  if (!(lowered > 0)) return stated;
  return { ...stated, minHeightMm: Math.max(0, stated.minHeightMm - lowered) };
}

function recordMeasures(run) {
  // A recording may start inside another (the narrow page asks which pieces
  // it measures while the browser check is listing every piece of the sheet).
  // The outer one keeps what the inner one saw, so those pieces are measured
  // in the browser too.
  const outer = recording;
  const mine = new Map();
  recording = mine;
  try {
    run();
    return mine;
  } finally {
    recording = outer;
    if (outer) for (const [key, value] of mine) outer.set(key, value);
  }
}

function setBrowserHeight(key, heightMm) {
  browserHeights.set(key, heightMm);
}

function hasBrowserHeight(key) {
  return browserHeights.has(key);
}

function clearBrowserHeights() {
  browserHeights.clear();
}

let arithmeticOnly = 0;

function byArithmetic(run) {
  arithmeticOnly += 1;
  try {
    return run();
  } finally {
    arithmeticOnly -= 1;
  }
}

function measure(spec, widthMm) {
  const found = REGISTRY[spec.helper];
  if (!found) return 20;
  const estimate = found.measure(spec, widthMm);
  if (arithmeticOnly || (!recording && !browserHeights.size)) return estimate;
  const key = measureKey(spec, widthMm);
  if (recording) recording.set(key, { spec, widthMm });
  const drawn = browserHeights.get(key);
  if (drawn === undefined) return estimate;
  // A piece that grows into spare height (writing lines, a drawing box) has a
  // height that was CHOSEN, and drawn alone it shows only its smallest self, so
  // the browser may raise it and never lower it. Anything else is as tall as
  // the browser drew it.
  return greed(spec.helper) > 0 || found.fills ? Math.max(estimate, drawn) : drawn;
}

// Whether this piece holds an answer the child writes in their book although
// the sheet is printed (helpers/in-book.js).
function holdsBookAnswer(spec) {
  const found = spec && REGISTRY[spec.helper];
  return Boolean(found && typeof found.inBook === "function" && found.inBook(spec));
}

function greed(helperName) {
  const found = REGISTRY[helperName];
  return found && found.greed !== undefined ? found.greed : 1;
}

// Does spare height keep paying off, or does this helper reach a size past
// which more is worse?
//
// `greed` says a helper CAN use spare height. It does not say how much, and
// the two are different questions with different answers. Ruled writing lines
// gain from being roomier and then stop: a line twice as tall as a child's
// handwriting is not more room to answer in, it is an invitation to write an
// essay the question never asked for. A box a child DRAWS in is the opposite -
// the space is the whole content, and every millimetre is more drawing.
//
// One cap for both is wrong whichever number it takes. Half again was chosen
// for the lines, and it is why a drawing box told to take a whole side of a
// page came out 20mm tall with 140mm blank under it.
//
// So a helper whose content IS the space says `fills: true`, which puts it at
// the FRONT of the queue for spare height. Everything else keeps the half-again
// cap, which is the number the writing lines were tuned to and stays the
// default for anything that does not answer the question below.
const GROWTH_CEILING = 0.5; // of the helper's own natural height

function fills(helperName) {
  const found = REGISTRY[helperName];
  return Boolean(found && found.fills);
}

// How much room is ENOUGH.
//
// `greed` says a helper CAN use spare height and `fills` says it should be
// first in the queue for it. Neither of them says WHEN TO STOP, and that turned
// out to be the question three worksheet packs failed on at once (7 September
// 2026). A recording table holding one four-digit number was drawn with a 30mm
// blank row because its zone had 30mm going spare; a one-row sorting grid
// standing in for "somewhere to draw" was drawn 209mm tall because `fills` was
// read as "no ceiling at all". Neither is a browser fault and neither is a
// designer's decision: the engine was asked how big to make them and had no
// answer beyond "as big as there is room for".
//
// So a helper may state the height past which more is no longer a gain. It is
// an ABSOLUTE height at this width, not a multiplier, because what makes a
// number cell big enough is the size of a child's handwriting and not the size
// of the table it sits in. State it as the natural height plus the growth that
// genuinely helps, so it can never come out below what the content measures.
//
// Unstated, it is the half-again ceiling this engine has always used. Adding
// the field to a helper is a decision about that helper; leaving it off changes
// nothing.
function enough(spec, widthMm) {
  const naturalMm = measure(spec, widthMm);
  const found = REGISTRY[spec.helper];
  if (!found || typeof found.enough !== "function") {
    return naturalMm * (1 + GROWTH_CEILING);
  }
  return Math.max(naturalMm, found.enough(spec, widthMm));
}

// The sets a helper cannot be a question without.
//
// Some helpers exist to draw a SET of things: the options a child chooses
// between, the dots on a photograph, the cards in a row. Handed an empty set
// they draw the frame and nothing in it, and the page prints an instruction
// with nothing to act on. It fits, it looks finished, and the child cannot
// start.
//
// That is not hypothetical either. One science sheet shipped with
// `"options": []` under "Circle the complete circuit" and `"labels": []` under
// "Draw a line from each word to the right part" - three questions across two
// sheets that no child could do, on pages that passed every check.
//
// Declared per helper rather than guessed, because an empty set is sometimes
// exactly right: a Venn or a Carroll diagram with no shapes is a blank sorting
// frame, which is the commonest way either is used. The engine cannot tell
// those apart from the outside, so each helper says which of its sets are the
// activity itself. A helper that names none is never checked, so adding one
// costs a line and forgetting one costs nothing that was not already true.
function requiredSets(helperName) {
  const found = REGISTRY[helperName];
  return (found && found.requires) || [];
}

// Which row is asking for the width, and what each thing in it asks for.
//
// "needs 191mm wide, zone is 174mm" names a total and leaves the reader to
// guess what it is a total OF. A worksheet designer guessed "the pair of grids
// needs 191mm" for a row that was an instruction and two grids, the plan's
// owner believed it, and a sheet that fits one page was replanned onto two
// (6 October 2026). So a width refusal prices the row item by item, the way a
// height refusal already prices a stack.
//
// It follows the widest part down through stacks and numbered questions until
// it reaches a row, because a stack is as wide as its widest part and a row is
// the only thing that adds widths together. Content with no row in it has
// nothing to break down: the single widest helper is named instead.
function widestRowLine(spec) {
  let node = spec;
  let gutters = 0;
  for (;;) {
    if (!node || typeof node !== "object") return "";
    if (node.number !== undefined) {
      const { number, ...rest } = node;
      node = rest;
      gutters += 1;
      continue;
    }
    if (isStack(node) && !isRow(node)) {
      const parts = itemsOf(node);
      if (!parts.length) return "";
      node = parts.reduce((widest, part) =>
        needsContent(part).minWidthMm > needsContent(widest).minWidthMm ? part : widest
      );
      continue;
    }
    break;
  }
  const mm = (content) => Math.round(needsContent(content).minWidthMm);
  const gutterMm = Math.round(
    needsContent({ ...node, number: 1 }).minWidthMm - needsContent(node).minWidthMm
  );
  const numbered = gutters ? ` and ${gutters * gutterMm}mm for the question number beside it` : "";
  if (!isRow(node)) {
    return node === spec
      ? ""
      : `the widest thing in it is ${describeContent(node)} at ${mm(node)}mm${numbered}`;
  }
  const items = itemsOf(node);
  const gaps = Math.max(0, items.length - 1);
  const priced = items.map((item) => `${describeContent(item)} ${mm(item)}mm`).join(" + ");
  const between = gaps ? `, with ${GAP_MM}mm between each` : "";
  return `the width goes on this row, side by side: ${priced}${between}${numbered}`;
}

// The fitting rule, and the whole point of zones knowing their millimetres: a
// zone can answer this before anything is drawn. It takes the whole content
// spec, not just the helper's name, because the answer depends on what is in it.
function fits(spec, zoneWidthMm, zoneHeightMm) {
  const { minWidthMm, minHeightMm } = needsContent(spec, zoneWidthMm);
  // Half a millimetre of give. A helper's narrowest width is a figure someone
  // chose to the nearest millimetre, and a zone of 89.6mm against a need of
  // 90mm was refused with "needs 90mm wide, zone is 90mm": a Year 4 Below
  // sheet lost its only layout to four tenths of a millimetre once the page
  // lost its trim strip (4 October 2026).
  const tooNarrow = zoneWidthMm + 0.5 < minWidthMm;
  const tooShort = zoneHeightMm < minHeightMm;

  if (!tooNarrow && !tooShort) return { ok: true };
  const reasons = [];
  if (tooNarrow) {
    const row = widestRowLine(spec);
    reasons.push(
      `needs ${Math.round(minWidthMm)}mm wide, zone is ${Math.round(zoneWidthMm)}mm` +
        (row ? ` (${row})` : "")
    );
  }
  if (tooShort) {
    reasons.push(
      `needs ${Math.round(minHeightMm)}mm tall, zone is ${Math.round(zoneHeightMm)}mm`
    );
  }
  return { ok: false, why: reasons.join("; ") };
}

function helperNames() {
  return Object.keys(REGISTRY).sort();
}

module.exports = {
  renderContent,
  measureContent,
  needsContent,
  greedContent,
  fillsContent,
  enoughContent,
  describeContent,
  inspectContent,
  renderHelper,
  holdsBookAnswer,
  fits,
  measure,
  recordMeasures,
  setBrowserHeight,
  hasBrowserHeight,
  clearBrowserHeights,
  greed,
  fills,
  requiredSets,
  enough,
  GROWTH_CEILING,
  helperNames,
  helperCss,
  REGISTRY,
};
