"use strict";


const {
  printableInches,
  WIDE_ASPECT,
} = require("./layout");

const {
  clockKey,
  fractionCircleKey,
  fractionBarKey,
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
  placeValueChartKey,
  circuitDiagramKey,
  badgeKey,
  calloutKeySuffix,
} = require("./svg-renderer");

const VISUAL_KEY_FNS = {
  clock: clockKey,
  fractionCircle: fractionCircleKey,
  fractionBar: fractionBarKey,
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
  "place-value-chart": placeValueChartKey,
  "circuit-diagram": circuitDiagramKey,
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

function stackedBodyOpts(card, panelFraction) {
  const label = { label: cardLabel(card) };
  return (card && card.visual && panelFraction < 1.0)
    ? { ...label, maxLinesPerItem: 4 }
    : label;
}

function panelFractionFor(card, ctx, hasPhoto) {
  const visual = card.visual;
  if (!visual) return hasPhoto ? 0.6 : 1.0;
  const v = pickVisual(visual, ctx);
  if (card.visualScale === 'dominant') return 0.32;
  return (v && (v.aspect || 1) >= WIDE_ASPECT) ? 1.0 : 0.6;
}

function wideVisualReserveInches(card, ctx, style) {
  if (!card || !card.visual) return 0;
  const v = pickVisual(card.visual, ctx);
  if (!v || (v.aspect || 1) < WIDE_ASPECT) return 0;
  const dims = printableInches(card.page.size, card.page.orientation, style);
  return Math.min((dims.width * 0.96) / (v.aspect || 1), dims.height * 0.21) + 0.25;
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