"use strict";


const {
  printableInches,
  panelPage,
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
  mapKey,
  dialScaleKey,
  measuringJugKey,
  rulerKey,
  timelineKey,
  processChainKey,
  classificationKeyKey,
  conceptMapKey,
  annotatedTextKey,
  fishboneKey,
  continuumLineKey,
  sourcePathwayKey,
  numberNetworkKey,
  angleFanKey,
  turnDiagramKey,
  comparisonKey,
  triangleSquareKey,
  polygonKey,
  translationGridKey,
  areaGridKey,
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
  placeValueMiniKey,
  baseTenBlocksKey,
  counterGroupKey,
  partWholeModelKey,
  pyramidKey,
  multGridKey,
  digitCardsKey,
  circuitDiagramKey,
  parachuteForcesKey,
  blankSurfaceKey,
  circuitSymbolBankKey,
  labelDiagramKey,
  badgeKey,
  calloutKeySuffix,
} = require("./svg-renderer");
const { withoutTaughtMarks } = require("../../shared/text/criteria-marks");
const { markDrawn } = require("./figure-size");

const VISUAL_KEY_FNS = {
  clock: clockKey,
  fractionCircle: fractionCircleKey,
  fractionBar: fractionBarKey,
  "shaded-fraction": shadedFractionKey,
  "fraction-wall": fractionWallKey,
  money: moneyKey,
  numberLine: numberLineKey,
  map: mapKey,
  "dial-scale": dialScaleKey,
  "measuring-jug": measuringJugKey,
  "ruler": rulerKey,
  "timeline": timelineKey,
  "process-chain": processChainKey,
  "classification-key": classificationKeyKey,
  "concept-map": conceptMapKey,
  "annotated-text": annotatedTextKey,
  "fishbone": fishboneKey,
  "continuum-line": continuumLineKey,
  "source-pathway": sourcePathwayKey,
  "number-network": numberNetworkKey,
  angleFan: angleFanKey,
  "turn-diagram": turnDiagramKey,
  comparisonSymbol: comparisonKey,
  "comparison-slot": comparisonKey,
  "triangle-square": triangleSquareKey,
  polygon: polygonKey,
  "translation-grid": translationGridKey,
  "area-grid": areaGridKey,
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
  "place-value-mini": placeValueMiniKey,
  "base-ten-blocks": baseTenBlocksKey,
  "counter-group": counterGroupKey,
  "part-whole-model": partWholeModelKey,
  "pyramid": pyramidKey,
  "mult-grid": multGridKey,
  "digit-cards": digitCardsKey,
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

// A worked example's label ("Worked example") beside its text.
function accentLabelPtFor(bodyPt) {
  return Math.max(28, Math.round(bodyPt * 0.7));
}

// A numbered step draws as a badge row; any other label as a labelled paragraph.
function isStepLabel(label) {
  const text = String(label || "").toLowerCase();
  return text.startsWith("step") || /^\d+\b/.test(text);
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

// The panel cards whose bodies are planned against the page they are drawn on
// (layout.js, What the page draws). The misconception pair draws two panels
// side by side and keeps its own arithmetic.
const PAGED_CARDS = new Set(["stickyKnowledge", "vocabDefinition", "workedExample", "sentenceStem"]);

function stackedBodyOpts(card, panelFraction, style) {
  return {
    label: cardLabel(card),
    maxLinesPerItem: MAX_LINES_PER_ITEM,
    floorLinesPerItem: floorLinesPerItem(card, panelFraction),
    page: style && card && PAGED_CARDS.has(card.type) && card.page && card.page.size === "A3"
      ? panelPage(card.page.orientation, style, panelFraction, {
        badgeInches,
        labelPt: accentLabelPtFor,
      })
      : undefined,
  };
}

// A card keeps its picture or helper almost always (the teacher, 26 September
// 2026: "I rarely also use cards with no picture or helper"). When its words do
// not fit beside the side picture at the floor size, the picture gives up a
// little width first: the words' share grows from 60% to at most 70%, and the
// first share that fits is drawn. A card whose words fit keeps the full share;
// no side picture, or a picture made dominant, is left alone. A card that fits
// at no share is measured, and refused, at the widest share tried, so the
// refusal names the budget the card really has (about 72 characters beside a
// photo, not the 62 of the full share) and then the next moves (a list over a
// second card, the picture off only when nothing else fits; a sentence never
// cut).
const PICTURE_GIVES_WAY = [0.65, 0.7];

// A sticky fact too long to sit beside its photo even then keeps both (his
// answer of 26 September 2026, "yys"): the photo narrows to about a third of
// the card, the widest share, and the whole sentence runs over the lines it
// needs there, three at the floor size, where two hold about 72 letters and
// three about 106. Only after that is the sentence shortened, to a whole
// sentence, by the wall designer, and the photo comes off last of all. A card
// holds one fact on three lines (his answer to the third check, "yes"); a
// second goes on a second card.
const PHOTO_AT_A_THIRD = { share: 0.7, floorLines: 3, factsOnThreeLines: 1 };

function panelFractionThatFits(base, fitsAt) {
  if (base !== 0.6 || fitsAt(base)) return base;
  const roomier = PICTURE_GIVES_WAY.find((fraction) => fitsAt(fraction));
  return roomier || PICTURE_GIVES_WAY[PICTURE_GIVES_WAY.length - 1];
}

function panelFractionFor(card, ctx, hasPhoto) {
  const visual = card.visual;
  if (!visual) return hasPhoto ? 0.6 : 1.0;
  const v = pickVisual(visual, ctx);
  if (card.visualScale === 'dominant') return 0.32;
  if (card.visualScale === 'full') return 1.0;
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
// A card whose picture IS the sheet (`visualScale: "full"`: a model text the
// class writes from) offers the picture almost all of it, the panel above
// keeping only the line or two it says. Beside the panel, as `dominant`, a
// marked poem printed a size or two over the floor with most of its column
// empty (2 October 2026), because a passage is wide and the column is not.
const FULL_VISUAL_SHARE = 0.85;
const WIDE_VISUAL_SHARE_GUARANTEED = 0.21;
const RESERVE_STEP_INCHES = 0.1;

function wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor) {
  if (!card || !card.visual) return 0;
  // A dominant figure sits beside the panel, never beneath it, so the panel
  // keeps its full height. Reserving room under it anyway took height the page
  // never used, and the loose plan hid it until the body was planned as drawn.
  if (card.visualScale === "dominant") return 0;
  const full = card.visualScale === "full";
  const v = pickVisual(card.visual, ctx);
  if (!v || (!full && (v.aspect || 1) < WIDE_ASPECT)) return 0;
  const dims = printableInches(card.page.size, card.page.orientation, style);
  const byWidth = (dims.width * 0.96) / (v.aspect || 1);
  const guaranteed = Math.min(byWidth, dims.height * WIDE_VISUAL_SHARE_GUARANTEED) + 0.25;
  const generous = Math.min(byWidth, dims.height * (full ? FULL_VISUAL_SHARE : WIDE_VISUAL_SHARE_GENEROUS)) + 0.25;
  if (generous <= guaranteed + 0.01) return guaranteed;
  if (typeof bodyFitsAtFloor !== "function") return guaranteed;
  for (let reserve = generous; reserve > guaranteed; reserve -= RESERVE_STEP_INCHES) {
    if (bodyFitsAtFloor(reserve)) return reserve;
  }
  return guaranteed;
}

// The figure stacked under a panel as shared.js `panelWithVisualHtml` draws
// it: the sheet's width less the panel's padding, no taller than its reserve
// allows, below a 160dxa gap. The body is planned against this block, not the
// reserve, which is an allowance a wide figure often does not fill: a number
// line drawn across the sheet left the words a size smaller than their panel.
function stackedFigureInches(card, ctx, style, reserve) {
  const v = reserve > 0 && card && card.visual ? pickVisual(card.visual, ctx) : null;
  if (!v) return 0;
  const dims = printableInches(card.page.size, card.page.orientation, style);
  const widthIn = Math.max(1, dims.width - (2 * 360) / 1440) * 0.96;
  const heightIn = Math.min(widthIn / (v.aspect || 1), reserve - 0.25);
  const mmOf = (inches) => Math.round(inches * 25.4 * 100) / 100;
  return (mmOf(160 / 1440) + mmOf(heightIn)) / 25.4;
}

function pickVisual(marked, ctx) {
  if (!marked) return null;
  if (marked._educationalSvgBuffer) {
    return {
      buf: marked._educationalSvgBuffer,
      aspect: marked._educationalSvgAspect || 1,
      alt: marked.alt || "",
    };
  }
  // Keyed on the figure's plain words, as the pre-render filed it.
  const visual = withoutTaughtMarks(marked);
  if (!ctx || !ctx.svgImages) return null;
  const keyFn = VISUAL_KEY_FNS[visual.type];
  if (!keyFn) return null;
  const entry = ctx.svgImages[keyFn(visual) + calloutKeySuffix(visual)];
  if (!entry) return null;
  // Marked as a lesson drawing, so the size it prints at is checked.
  markDrawn(Buffer.isBuffer(entry) ? entry : entry.png, visual);
  if (Buffer.isBuffer(entry)) return { buf: entry, aspect: 1 };
  return entry.anchors ? { buf: entry.png, aspect: entry.aspect || 1, anchors: entry.anchors } : { buf: entry.png, aspect: entry.aspect || 1 };
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
  panelFractionThatFits,
  PICTURE_GIVES_WAY,
  PHOTO_AT_A_THIRD,
  wideVisualReserveInches,
  stackedFigureInches,
  pickVisual,
  defaultVisualLabel,
  cardLabel,
  stackedBodyOpts,
  defaultBodyPt,
  minBodyPt,
  panelLabelPt,
  badgeInches,
  accentLabelPtFor,
  isStepLabel,
  pickRainbowColour,
};
