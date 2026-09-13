"use strict";

// Shapes, turns, grids, and the one helper on the whole sheet that is an
// INSTRUMENT.
//
// The ruler is drawn here as inline SVG at its true size. Every other helper in
// this file is a shared drawing (shared/visuals/) placed at the width it prints,
// the same picture the board, the wall and the stick-in pack show.

const { esc } = require("./shared");

const INK = "var(--colour-ink)";
const FONT = "var(--font)";

// Orange for anything HANDED to the child on a drawing: the arrow that marks a
// value already placed on the ruler.
const GIVEN = "var(--colour-given)";
const OBJECT = "var(--colour-question)";

// A drawing bounded by its own width gains nothing from spare page height: the
// aspect is already filled, so extra room would sit under it as blank padding.
const NEVER_STRETCH = 0;

// ─── shape, triangle-square, turn-diagram, area-grid, translation-grid ───
// Each is the one shared drawing the board, the wall and the stick-in pack
// place too, laid out at the width it prints (see at-printed-width.js). Until
// 13 September 2026 the sheet drew its own shape (an ink outline with its
// measurements), its own triangle-square and its own turn row, so a child met a
// different picture on paper from the one on the board; the area grid and the
// translation grid could not be printed at all.
//
//   shape             shared/visuals/polygon-svg.js: the board's named shapes
//                     (symmetry lines, a candidate line, fold, verdict) and the
//                     sheet's measured sides and angles
//   triangle-square   shared/visuals/triangle-square-svg.js
//   turn-diagram      shared/visuals/turn-diagram-svg.js
//   area-grid         shared/visuals/area-grid-svg.js
//   translation-grid  shared/visuals/translation-grid-svg.js

const { profileFor, MM_TO_PT } = require("../../../shared/visuals/surface-profiles");
const { atPrintedWidth } = require("./at-printed-width");
const polygonShared = require("../../../shared/visuals/polygon-svg");
const triangleSquareShared = require("../../../shared/visuals/triangle-square-svg");
const turnDiagramShared = require("../../../shared/visuals/turn-diagram-svg");
const areaGridShared = require("../../../shared/visuals/area-grid-svg");
const translationGridShared = require("../../../shared/visuals/translation-grid-svg");

const SHEET = () => profileFor("worksheets", { widthMm: 170 });
const minWidthFrom = (module) => (spec) => module.minWidthPt(spec, SHEET()) / MM_TO_PT;

// ─── ruler ───────────────────────────────────────────────────────────────
//
// A RULER IS A MEASURING INSTRUMENT, NOT A PICTURE OF ONE.
//
// Every other drawing on this sheet is an SVG scaled to fill whatever width its
// zone gives it. If a ruler were treated the same way, its centimetres would
// stop being centimetres the moment the zone was any width but one, and every
// answer a child read off it would be wrong - wrong in the worst way available,
// because the sheet would look completely normal and the child would be marked
// down for measuring correctly.
//
// So this helper prints at TRUE SIZE, in real millimetres, and REFUSES a zone
// too narrow to hold it rather than shrinking to fit. Three things enforce that
// together, and none of them works alone:
//
//   1. the SVG carries an explicit width and height in mm, and its viewBox is
//      1 unit = 1 mm, so the drawing is laid out in the unit it prints in;
//   2. `.h-ruler` is its own class, NOT `.h-figure`, precisely so the
//      `width: 100%` rule that scales every other drawing cannot reach it;
//   3. `needs` reports the ruler's true width, so a zone narrower than the
//      ruler fails the fit check before anything is drawn.
//
// If you change any of those, change all three. Scaling this drawing is not a
// layout compromise; it is a wrong answer printed on a child's sheet.
//
// Spec:
//   start           left-hand value. Default 0.
//   end             right-hand value. Required.
//   unit            "cm" (default) | "mm" | "m". Sets the true size of one
//                   unit on paper, so it is arithmetic, not a caption.
//   majorInterval   labelled tick spacing. Default 1.
//   minorInterval   small tick spacing. Default majorInterval / 2.
//   arrow           { at, label?, answerBox? } an arrow above the scale
//   object          { from, to, label? } a bar to measure ("how long is the
//                   pencil?")

const RULER_MM_PER_UNIT = { cm: 10, mm: 1, m: 1000 };

const R_MARGIN_X = 5; // paper either side of the scale itself
const R_UNIT_ROOM = 9; // extra on the right when the unit is printed
const R_TOP_PAD = 1.5;
const R_BOTTOM_PAD = 1.5;
const R_TICK_MINOR = 2.6;
const R_TICK_MAJOR = 4.4;
const R_FONT = 3.6; // ≈10pt at true size, comfortably over the 9pt floor
const R_LABEL_GAP = 1.6;
const R_LABEL_ROW = 4.4;
const R_ARROW_H = 9;
const R_ARROW_GAP = 1.5;
const R_BOX = 9;
const R_BOX_GAP = 2;
const R_OBJECT_BAR_H = 2.2;
const R_OBJECT_GAP = 2;

function rulerGeometry(spec) {
  const start = spec.start ?? 0;
  const end = spec.end;
  if (!Number.isFinite(end) || end <= start) {
    throw new Error(`RULER_LENGTH: a ruler runs from ${start} to ${end}, which is not a length.`);
  }

  const unit = spec.unit === undefined ? "cm" : spec.unit;
  const showUnit = unit !== null && unit !== "";
  const mmPerUnit = RULER_MM_PER_UNIT[showUnit ? unit : "cm"];
  if (!mmPerUnit) {
    throw new Error(
      `RULER_UNIT: "${unit}" has no true size on paper. Known: ${Object.keys(RULER_MM_PER_UNIT).join(", ")}.`
    );
  }

  const majorInterval = spec.majorInterval ?? 1;
  const minorInterval = spec.minorInterval ?? majorInterval / 2;
  if (!(majorInterval > 0) || !(minorInterval > 0)) {
    throw new Error(`RULER_INTERVAL: intervals must be positive, got major ${majorInterval} and minor ${minorInterval}.`);
  }

  const arrow = spec.arrow;
  const object = spec.object;
  const arrowSpace = arrow ? R_ARROW_H + R_ARROW_GAP + (arrow.answerBox ? R_BOX + R_BOX_GAP : 0) : 0;
  const objectSpace = object ? R_OBJECT_BAR_H + R_OBJECT_GAP + (object.label ? R_FONT + 1 : 0) : 0;

  const axisY = R_TOP_PAD + arrowSpace + objectSpace + R_TICK_MAJOR / 2;
  const heightMm = axisY + R_TICK_MAJOR / 2 + R_LABEL_GAP + R_LABEL_ROW + R_BOTTOM_PAD;

  const spanMm = (end - start) * mmPerUnit;
  const widthMm = R_MARGIN_X * 2 + spanMm + (showUnit ? R_UNIT_ROOM : 0);

  return {
    start,
    end,
    unit,
    showUnit,
    mmPerUnit,
    majorInterval,
    minorInterval,
    arrow,
    object,
    arrowSpace,
    objectSpace,
    axisY,
    widthMm,
    heightMm,
    spanMm,
  };
}

function tidy(value) {
  return Math.round(value * 1e9) / 1e9;
}

function buildRulerSvg(spec) {
  const g = rulerGeometry(spec);
  const x = (value) => R_MARGIN_X + (value - g.start) * g.mmPerUnit;
  const f = (n) => n.toFixed(2);
  const parts = [];

  parts.push(
    `<line x1="${f(x(g.start))}" y1="${f(g.axisY)}" x2="${f(x(g.end))}" y2="${f(g.axisY)}" stroke="${INK}" stroke-width="0.5" stroke-linecap="square"/>`
  );

  const steps = Math.round((g.end - g.start) / g.minorInterval);
  for (let i = 0; i <= steps; i++) {
    const value = tidy(g.start + i * g.minorInterval);
    const stepsOfMajor = (value - g.start) / g.majorInterval;
    const isMajor = Math.abs(stepsOfMajor - Math.round(stepsOfMajor)) < 1e-6;
    const h = isMajor ? R_TICK_MAJOR : R_TICK_MINOR;
    parts.push(
      `<line x1="${f(x(value))}" y1="${f(g.axisY - h / 2)}" x2="${f(x(value))}" y2="${f(g.axisY + h / 2)}" stroke="${INK}" stroke-width="0.4"/>`
    );
  }

  const labelY = g.axisY + R_TICK_MAJOR / 2 + R_LABEL_GAP;
  const majorSteps = Math.round((g.end - g.start) / g.majorInterval);
  for (let i = 0; i <= majorSteps; i++) {
    const value = tidy(g.start + i * g.majorInterval);
    parts.push(
      `<text x="${f(x(value))}" y="${f(labelY)}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-size="${R_FONT}" fill="${INK}">${esc(String(value))}</text>`
    );
  }

  if (g.showUnit) {
    parts.push(
      `<text x="${f(x(g.end) + 2)}" y="${f(labelY)}" text-anchor="start" dominant-baseline="hanging" font-family="${FONT}" font-size="${R_FONT}" fill="${INK}">${esc(g.unit)}</text>`
    );
  }

  if (g.object) {
    const ox1 = x(g.object.from);
    const ox2 = x(g.object.to);
    const barBaseY = g.axisY - R_TICK_MAJOR / 2 - R_OBJECT_GAP;
    const barTopY = barBaseY - R_OBJECT_BAR_H;
    const midY = barTopY + R_OBJECT_BAR_H / 2;

    parts.push(`<line x1="${f(ox1)}" y1="${f(barTopY)}" x2="${f(ox1)}" y2="${f(barBaseY)}" stroke="${OBJECT}" stroke-width="0.5"/>`);
    parts.push(`<line x1="${f(ox2)}" y1="${f(barTopY)}" x2="${f(ox2)}" y2="${f(barBaseY)}" stroke="${OBJECT}" stroke-width="0.5"/>`);
    parts.push(`<line x1="${f(ox1)}" y1="${f(midY)}" x2="${f(ox2)}" y2="${f(midY)}" stroke="${OBJECT}" stroke-width="0.5"/>`);

    if (g.object.label) {
      parts.push(
        `<text x="${f((ox1 + ox2) / 2)}" y="${f(barTopY - 0.8)}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${FONT}" font-size="${R_FONT}" fill="${OBJECT}">${esc(g.object.label)}</text>`
      );
    }
  }

  if (g.arrow) {
    const ax = x(g.arrow.at);
    const tipY = g.axisY - R_TICK_MAJOR / 2 - g.objectSpace - 0.5;
    const shaftTopY = tipY - R_ARROW_H;

    parts.push(`<line x1="${f(ax)}" y1="${f(shaftTopY)}" x2="${f(ax)}" y2="${f(tipY - 1.6)}" stroke="${GIVEN}" stroke-width="0.7"/>`);
    parts.push(
      `<polygon points="${f(ax - 1.4)},${f(tipY - 2)} ${f(ax + 1.4)},${f(tipY - 2)} ${f(ax)},${f(tipY)}" fill="${GIVEN}"/>`
    );

    if (g.arrow.answerBox) {
      parts.push(
        `<rect x="${f(ax - R_BOX / 2)}" y="${f(shaftTopY - R_BOX_GAP - R_BOX)}" width="${R_BOX}" height="${R_BOX}" fill="white" stroke="${INK}" stroke-width="0.4"/>`
      );
    } else if (g.arrow.label) {
      parts.push(
        `<text x="${f(ax)}" y="${f(shaftTopY - 0.8)}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${FONT}" font-size="${R_FONT}" font-weight="bold" fill="${GIVEN}">${esc(g.arrow.label)}</text>`
      );
    }
  }

  // width and height in REAL MILLIMETRES on the tag, and a viewBox of the same
  // numbers, so one unit inside the drawing is one millimetre on the paper.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${g.widthMm.toFixed(2)}mm" height="${g.heightMm.toFixed(2)}mm" ` +
    `viewBox="0 0 ${g.widthMm.toFixed(2)} ${g.heightMm.toFixed(2)}" ` +
    `style="width:${g.widthMm.toFixed(2)}mm;height:${g.heightMm.toFixed(2)}mm">${parts.join("")}</svg>`;

  return { svg, widthMm: g.widthMm, heightMm: g.heightMm };
}

function renderRuler(spec) {
  return `<div class="h-ruler">${buildRulerSvg(spec).svg}</div>`;
}

// The width is not an argument here, and that is the whole point: a ruler is
// the same height at every width because it is the same size at every width.
function measureRuler(spec) {
  return buildRulerSvg(spec).heightMm;
}

function needsRuler(spec) {
  const { widthMm, heightMm } = buildRulerSvg(spec);
  // Its true size, exactly. A 10cm scale needs 100mm of paper plus its
  // margins, and no zone narrower than that can hold a ruler at all.
  return { minWidthMm: widthMm, minHeightMm: heightMm };
}

// ─── styling ─────────────────────────────────────────────────────────────
// The shared drawings are pinned to their printed size by at-printed-width.js,
// so they need nothing here.
//
// The ruler needs its own class and one rule: hands off. No padding, border or
// margin appears below, which is what lets `measure` return the SVG's own
// height and be exactly right. `display: block` matters as much as the size: an
// inline SVG sits on a text baseline and collects a descender's worth of space
// underneath it, which is height nobody measured.
const css = `
  .h-ruler { display: block; }

  /* No width rule. The SVG carries its true size in millimetres and must keep
     it: scaled to fit a zone, its centimetres would no longer be centimetres
     and every measurement a child read off it would be wrong. */
  .h-ruler svg { display: block; }
`;

const helpers = {
  shape: atPrintedWidth(polygonShared, { minWidthMm: minWidthFrom(polygonShared) }),
  // A printed puzzle is a question, so exactly one shape must be the unknown
  // (the board may show it finished).
  "triangle-square": atPrintedWidth(triangleSquareShared, {
    toSpec: triangleSquareShared.refuseUnlessOneBlank,
    minWidthMm: minWidthFrom(triangleSquareShared),
  }),
  "turn-diagram": atPrintedWidth(turnDiagramShared, { minWidthMm: minWidthFrom(turnDiagramShared) }),
  "area-grid": atPrintedWidth(areaGridShared, { minWidthMm: 70 }),
  "translation-grid": atPrintedWidth(translationGridShared, { minWidthMm: 60 }),
  ruler: {
    render: renderRuler,
    measure: measureRuler,
    needs: needsRuler,
    // Zero, and not for the usual reason. The others refuse spare height
    // because they would gain nothing by it; this one refuses because taking
    // it would make the ruler lie.
    greed: NEVER_STRETCH,
  },
};

module.exports = { helpers, css };
