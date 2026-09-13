"use strict";


const {
  printableInches,
  WIDE_ASPECT,
} = require("./layout");

const {
  clockKey,
  fractionCircleKey,
  fractionBarKey,
  shadedFractionKey,
  fractionWallKey,
  moneyKey,
  numberLineKey,
  angleFanKey,
  turnDiagramKey,
  comparisonSymbolKey,
  triangleSquareKey,
  linePairKey,
  angleKey,
  triangleKey,
  vennKey,
  carrollKey,
  geoboardKey,
  reflectionGridKey,
  coordinateGridKey,
  translationShapeKey,
  tallyChartKey,
  pictogramKey,
  barChartKey,
  lineGraphKey,
  barModelKey,
  gridMapKey,
  rainforestLayersKey,
  balancedPatternPlateKey,
  placeValueChartKey,
  circuitDiagramKey,
  parachuteForcesKey,
  blankSurfaceKey,
  circuitSymbolBankKey,
  labelDiagramKey,
  badgeKey,
  calloutKeySuffix,
} = require("./svg-renderer");

const VISUAL_KEY_FNS = {
  clock: clockKey,
  fractionCircle: fractionCircleKey,
  fractionBar: fractionBarKey,
  "shaded-fraction": shadedFractionKey,
  "fraction-wall": fractionWallKey,
  money: moneyKey,
  numberLine: numberLineKey,
  angleFan: angleFanKey,
  "turn-diagram": turnDiagramKey,
  comparisonSymbol: comparisonSymbolKey,
  "triangle-square": triangleSquareKey,
  "line-pair": linePairKey,
  angle: angleKey,
  triangle: triangleKey,
  venn: vennKey,
  carroll: carrollKey,
  geoboard: geoboardKey,
  "reflection-grid": reflectionGridKey,
  "coordinate-grid": coordinateGridKey,
  "translation-shape": translationShapeKey,
  "tally-chart": tallyChartKey,
  pictogram: pictogramKey,
  "bar-chart": barChartKey,
  "line-graph": lineGraphKey,
  "bar-model": barModelKey,
  "grid-map": gridMapKey,
  "rainforest-layers": rainforestLayersKey,
  "balanced-pattern-plate": balancedPatternPlateKey,
  "place-value-chart": placeValueChartKey,
  "circuit-diagram": circuitDiagramKey,
  "parachute-forces": parachuteForcesKey,
  "blank-surface": blankSurfaceKey,
  "circuit-symbol-bank": circuitSymbolBankKey,
  "label-diagram": labelDiagramKey,
};

function pickRainbowColour(idx, style) {
  const palette = Array.isArray(style.colours.rainbowPalette) ? style.colours.rainbowPalette : ["DC2626"];
  return palette[idx % palette.length];
}

function defaultBodyPt(card, style) {
  return card.page.size === "A3" ? style.sizes.a3BodyPt : style.sizes.a4BodyPt;
}

function minBodyPt(card, style) {
  return card.page.size === "A3" ? style.sizes.a3BodyMinPt : style.sizes.a4BodyMinPt;
}

function panelLabelPt(card, style) {
  return card.page.size === "A3" ? style.sizes.panelLabelA3Pt : style.sizes.panelLabelA4Pt;
}

function badgeInches(bodyPt) {
  return Math.max(0.6, (bodyPt * 1.4) / 72);
}

// ─── Visual buffer lookup ───────────────────────────────────────────────

// The card's own name, so an autofit refusal points at a card the designer can
// find in working-wall.json rather than at "a linear body somewhere".
function cardLabel(card) {
  if (!card) return "this card";
  const title = typeof card.title === "string" ? card.title.trim() : "";
  const type = card.type || "card";
  return title ? `${type} "${title}"` : type;
}

// How many lines one item may wrap to before `fitLinearBodySize` calls a size
// too big. The cap is there to stop a single item sprawling into a paragraph;
// it is not meant to be what decides the type size. It became that anyway.
//
// The cap was lifted off the default 2 only for cards carrying a `visual`, so a
// card carrying a `photo` got the same panel narrowed to 60% of the sheet and
// kept a cap of 2. In a column that narrow, 2 lines is reached long before the
// page runs out of height, so the fitter walked all the way down to the floor
// and the page never got a say. A review of every wall the engine had built
// found 35 of 47 sheets at or within a step of the 36pt floor against an 80pt
// ceiling, and the same two sentences set at 44pt beside a photograph and 68pt
// beside a drawing. Which kind of picture sits next to the text is not a reason
// to change the size of the text.
//
// One layout cap for every card, high enough that the height check is what
// binds. Measured over every card the engine has built: 3 shrinks five cards, 4
// misses one, and nothing above 5 changes another card, so 5 is where it stops
// paying. The height check already refuses a card that genuinely will not fit.
const MAX_LINES_PER_ITEM = 5;

// The content budget is left exactly where it was. It decides which cards are
// refused, so moving it would change what the designer is allowed to write, and
// that is a teaching decision rather than a layout one. Worth knowing before
// anyone makes it: the brief tells the designer 62 characters for any card
// carrying a picture, and this line has been quietly allowing 124 on a card
// whose picture is drawn rather than photographed.
function floorLinesPerItem(card, panelFraction) {
  return (card && card.visual && panelFraction < 1.0) ? 4 : 2;
}

function stackedBodyOpts(card, panelFraction) {
  return {
    label: cardLabel(card),
    maxLinesPerItem: MAX_LINES_PER_ITEM,
    floorLinesPerItem: floorLinesPerItem(card, panelFraction),
  };
}

function panelFractionFor(card, ctx, hasPhoto) {
  const visual = card.visual;
  if (!visual) return hasPhoto ? 0.6 : 1.0;
  const v = pickVisual(visual, ctx);
  if (card.visualScale === 'dominant') return 0.32;
  return (v && (v.aspect || 1) >= WIDE_ASPECT) ? 1.0 : 0.6;
}

// How much height a wide visual is reserved on a stacked card.
//
// The panel's autofit grows its text to fill whatever height it is left, so
// every inch not reserved here becomes bigger body text and none of it ever
// reaches the figure. At a flat fifth that produced a Year 4 place-value wall
// whose five method steps ran in very large type down three quarters of an A3
// sheet, with the worked chart - the thing a child looks up to check WHICH
// column changed - as a small band at the foot. That chart's own card contract
// says the ring on the changed digit is what makes it wall material "at a
// glance from anywhere in the room", and at a fifth it was not. Daniel chose
// the bigger diagram from the two rendered options (5 September 2026).
//
// A flat bigger fraction is the wrong instrument: a third pushed a three-item
// landscape worked example, and the six-item portrait card this was meant to
// fix, 0.1in under the floor size their own text needs. So the figure is
// offered the generous share and the panel keeps whatever it genuinely cannot
// give up: `bodyFitsAtFloor` steps the reserve back until the body fits at its
// floor, never below the fifth that was always guaranteed. Nothing shrinks,
// and no card can be pushed under its text floor by construction.
const WIDE_VISUAL_SHARE_GENEROUS = 1 / 3;
const WIDE_VISUAL_SHARE_GUARANTEED = 0.21;
const RESERVE_STEP_INCHES = 0.1;

function wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor) {
  if (!card || !card.visual) return 0;
  const v = pickVisual(card.visual, ctx);
  if (!v || (v.aspect || 1) < WIDE_ASPECT) return 0;
  const dims = printableInches(card.page.size, card.page.orientation, style);
  const byWidth = (dims.width * 0.96) / (v.aspect || 1);
  const guaranteed = Math.min(byWidth, dims.height * WIDE_VISUAL_SHARE_GUARANTEED) + 0.25;
  const generous = Math.min(byWidth, dims.height * WIDE_VISUAL_SHARE_GENEROUS) + 0.25;
  if (generous <= guaranteed + 0.01) return guaranteed;
  if (typeof bodyFitsAtFloor !== "function") return guaranteed;
  for (let reserve = generous; reserve > guaranteed; reserve -= RESERVE_STEP_INCHES) {
    if (bodyFitsAtFloor(reserve)) return reserve;
  }
  return guaranteed;
}

function pickVisual(visual, ctx) {
  if (!visual) return null;
  if (visual._educationalSvgBuffer) {
    return {
      buf: visual._educationalSvgBuffer,
      aspect: visual._educationalSvgAspect || 1,
      alt: visual.alt || "",
    };
  }
  if (!ctx || !ctx.svgImages) return null;
  const keyFn = VISUAL_KEY_FNS[visual.type];
  if (!keyFn) return null;
  const entry = ctx.svgImages[keyFn(visual) + calloutKeySuffix(visual)];
  if (!entry) return null;
  if (Buffer.isBuffer(entry)) return { buf: entry, aspect: 1 };
  return { buf: entry.png, aspect: entry.aspect || 1 };
}

function defaultVisualLabel(visual) {
  if (!visual) return "";
  if (visual.label) return visual.label;
  if (visual.type === "clock") {
    if (visual.colourCoded) return "";
    if (visual.time) return visual.time;
  }
  if ((visual.type === "fractionCircle" || visual.type === "fractionBar") && visual.numerator != null && visual.denominator != null) {
    return `${visual.numerator}/${visual.denominator}`;
  }
  if (visual.type === "angleFan" && visual.degrees != null) return `${visual.degrees}°`;
  if (visual.type === "turn-diagram") {
    const words = { 1: "quarter", 2: "half", 3: "three-quarter", 4: "full" };
    let q = Number(visual.quarters);
    if (!Number.isFinite(q) || q <= 0) {
      const w = String(visual.amount || "").trim().toLowerCase().replace(/\s+/g, "-");
      q = { quarter: 1, half: 2, "three-quarter": 3, "three-quarters": 3, full: 4, whole: 4 }[w] || 1;
    }
    const dir = visual.direction === "anticlockwise" ? "anticlockwise" : "clockwise";
    return q === 4 ? "full turn" : `${words[q] || "quarter"} turn ${dir}`;
  }
  return "";
}

module.exports = {
  WIDE_VISUAL_SHARE_GENEROUS,
  WIDE_VISUAL_SHARE_GUARANTEED,
  VISUAL_KEY_FNS,
  panelFractionFor,
  wideVisualReserveInches,
  pickVisual,
  defaultVisualLabel,
  cardLabel,
  stackedBodyOpts,
  defaultBodyPt,
  minBodyPt,
  panelLabelPt,
  badgeInches,
  pickRainbowColour,
};
