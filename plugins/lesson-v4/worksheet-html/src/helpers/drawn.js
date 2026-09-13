"use strict";

// Drawings built as inline SVG rather than the picture-of-a-picture the
// Word builder needs. On paper an SVG stays sharp at any size and needs no
// image library, so the geometry is lifted from the Word builder's own
// clock-face.js, number-line.js and fraction-bar.js, and everything to do with
// `sharp`, DPI multipliers and PNG buffers is dropped. The drawing itself
// (proportions, stroke weights, Comic Sans labels) is kept identical.
//
// Every builder below returns { svg, aspect, ...whatever `needs` reuses }, so
// `measure` and `needs` both work from the SAME geometry the render used:
// nothing is guessed twice and the two numbers cannot drift apart.

const { esc, heightFromAspect } = require("./shared");
const jumpsGeo = require("../../../shared/visuals/number-line-jumps");

const INK = "var(--colour-ink)";
const FONT = "var(--font)";

// All three drawings size themselves by their own aspect ratio and the width
// the zone actually gives them. None of them read better for extra SPARE
// height once that aspect is filled: the picture is bounded by its width, so
// idle vertical room would only sit under it as blank padding rather than
// make the drawing bigger. Hence greed: 0 on all three.
const NEVER_STRETCH = 0;

// ─── clock-row ─────────────────────────────────────────────────────────
// A row of analogue clock faces, each with hands or left blank for the child
// to draw: the one shared clock (shared/visuals/clock-svg.js) the board, the
// wall and the stick-in pack place too, laid out at the width it prints. The
// sheet drew its own faces until 13 September 2026.
const clockShared = require("../../../shared/visuals/clock-svg");
const { atPrintedWidth } = require("./at-printed-width");
const { profileFor, MM_TO_PT } = require("../../../shared/visuals/surface-profiles");

// Every face in the row keeps numerals at the sheet's readable floor, so a row
// of six asks for six faces' worth of paper rather than shrinking them.
function clockRowMinWidthMm(spec) {
  return clockShared.minWidthPt(spec, profileFor("worksheets", { widthMm: 170 })) / MM_TO_PT;
}

// ─── number-line ────────────────────────────────────────────────────────
// Drawn by the one shared number line (shared/visuals/number-line-svg.js),
// which the board, the wall and the stick-in pack place too. It is laid out at
// the width the zone really prints, so its numerals are a real size rather than
// a size that shrinks with the zone; the sheet's own spec fields (boxes, arrows,
// caption, unit, object, subLabel) all mean the same thing there. This sheet
// drew its own line until 13 September 2026, and every repair made to it
// reached no other surface.
const numberLineShared = require("../../../shared/visuals/number-line-svg");

// Each printed label needs room either side of it not to collide with its
// neighbour; each box or arrow needs enough width that two adjacent ones do not
// touch. Whichever is the tighter constraint wins.
function numberLineMinWidthMm(spec) {
  const lines = numberLineShared.normalise(spec);
  const labelCount = Math.max(...lines.map((l) => l.labels.length));
  const featureCount = Math.max(...lines.map((l) => Math.max(l.boxes.length, l.arrows.length, l.jumps.length)));
  return Math.max(70, labelCount * 14, featureCount * 22);
}

// ─── fraction-bar ───────────────────────────────────────────────────────
// One or more bars divided into equal parts, some shaded. Geometry lifted
// from fraction-bar.js. The shaded fill has no literal equivalent among the
// four token colours (the original's pale blue was a one-off), so it borrows
// "question" (the same blue that marks a focus elsewhere) at reduced opacity
// rather than reaching for a hex value the token system does not own.
const SHADE = "var(--colour-question)";

function buildFractionBarSvg(spec) {
  const bars = spec.bars || [];
  const widthPx = spec.widthPx || 500;
  const barHeight = spec.barHeight || 60;
  const gap = spec.gap || 20;
  const labelFont = 22;
  const labelGap = 28;
  const topPad = 6;

  const rowH = (bar) => barHeight + (bar.label ? labelFont + labelGap : 0);
  const totalH =
    topPad + bars.reduce((sum, bar, i) => sum + rowH(bar) + (i > 0 ? gap : 0), 0) + 6;

  const parts = [];
  let curY = topPad;
  let maxDenominator = 1;

  for (const bar of bars) {
    const { numerator, denominator, shaded = true, label } = bar;
    maxDenominator = Math.max(maxDenominator, denominator);
    const cellW = widthPx / denominator;
    const borderW = 2;

    if (shaded && numerator > 0) {
      for (let i = 0; i < numerator; i++) {
        parts.push(
          `<rect x="${i * cellW}" y="${curY}" width="${cellW}" height="${barHeight}" fill="${SHADE}" fill-opacity="0.35" />`
        );
      }
    }

    parts.push(
      `<rect x="${borderW / 2}" y="${curY + borderW / 2}" width="${widthPx - borderW}" height="${barHeight - borderW}" fill="none" stroke="${INK}" stroke-width="${borderW}" />`
    );

    for (let i = 1; i < denominator; i++) {
      const x = i * cellW;
      parts.push(`<line x1="${x}" y1="${curY}" x2="${x}" y2="${curY + barHeight}" stroke="${INK}" stroke-width="1.5" />`);
    }

    if (label) {
      const labelY = curY + barHeight + labelGap;
      parts.push(
        `<text x="${widthPx / 2}" y="${labelY}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-size="${labelFont}" fill="${INK}">${esc(label)}</text>`
      );
    }

    curY += rowH(bar) + gap;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthPx} ${totalH}">${parts.join("")}</svg>`;
  return { svg, aspect: widthPx / totalH, maxDenominator };
}

const FRACTION_CAP_MM = 120; // several stacked bars still should not run away
const FRACTION_CELL_MIN_MM = 8; // a cell narrower than this loses its divider line

function renderFractionBar(spec) {
  return `<div class="h-figure">${buildFractionBarSvg(spec).svg}</div>`;
}

function measureFractionBar(spec, widthMm) {
  return heightFromAspect(buildFractionBarSvg(spec).aspect, widthMm, FRACTION_CAP_MM);
}

function needsFractionBar(spec) {
  const { aspect, maxDenominator } = buildFractionBarSvg(spec);
  // The bar with the most parts sets the floor: fewer millimetres per cell
  // than this and the internal divider lines crowd into one smudge.
  const minWidthMm = Math.max(60, maxDenominator * FRACTION_CELL_MIN_MM);
  return { minWidthMm, minHeightMm: heightFromAspect(aspect, minWidthMm, FRACTION_CAP_MM) };
}

// `.h-figure` is styled once, in render.js, for every SVG-backed helper, so
// there is nothing per-drawing to add here.
const css = "";

const helpers = {
  "clock-row": atPrintedWidth(clockShared, { minWidthMm: clockRowMinWidthMm }),
  "number-line": atPrintedWidth(numberLineShared, { minWidthMm: numberLineMinWidthMm }),
  "fraction-bar": {
    render: renderFractionBar,
    measure: measureFractionBar,
    needs: needsFractionBar,
    greed: NEVER_STRETCH,
  },
};

module.exports = { helpers, css };
