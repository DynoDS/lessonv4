"use strict";

// Three drawings, built as inline SVG rather than the picture-of-a-picture the
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
// to draw. Geometry lifted from clock-face.js: same pad, tick lengths, hand
// lengths and number placement, drawn once per clock instead of once per PNG.

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

const CLOCK_UNIT = 280; // matches the Word builder's own default widthPx
const CLOCK_GAP = 30; // breathing room between adjacent faces
const CLOCK_LABEL_H = 60; // room for the "(a)" letter above a face
const CLOCK_LABEL_FONT = 42;

function clockFaceParts(cx, cy, size, time, hands) {
  const pad = 18;
  const r = size / 2 - pad;
  const numberR = r - 28;
  const majorTickInner = r - 14;
  const minorTickInner = r - 7;
  const hourHandLen = r * 0.55;
  const minuteHandLen = r * 0.82;
  const numberFont = Math.round(r * 0.22);

  const parts = [];

  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="${INK}" stroke-width="2.5" />`
  );

  for (let i = 0; i < 60; i++) {
    const rad = toRad(i * 6 - 90);
    const isMajor = i % 5 === 0;
    const inner = isMajor ? majorTickInner : minorTickInner;
    const x1 = cx + r * Math.cos(rad);
    const y1 = cy + r * Math.sin(rad);
    const x2 = cx + inner * Math.cos(rad);
    const y2 = cy + inner * Math.sin(rad);
    parts.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${INK}" stroke-width="${isMajor ? 2 : 1}" />`
    );
  }

  for (let n = 1; n <= 12; n++) {
    const rad = toRad(n * 30 - 90);
    const nx = cx + numberR * Math.cos(rad);
    const ny = cy + numberR * Math.sin(rad);
    parts.push(
      `<text x="${nx.toFixed(2)}" y="${ny.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${numberFont}" fill="${INK}">${n}</text>`
    );
  }

  if (hands && time) {
    const [hStr, mStr] = String(time).split(":");
    const h = parseInt(hStr, 10) % 12;
    const m = parseInt(mStr, 10);

    const minRad = toRad(m * 6 - 90);
    const mhx = cx + minuteHandLen * Math.cos(minRad);
    const mhy = cy + minuteHandLen * Math.sin(minRad);
    parts.push(
      `<line x1="${cx}" y1="${cy}" x2="${mhx.toFixed(2)}" y2="${mhy.toFixed(2)}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" />`
    );

    const hourRad = toRad(h * 30 + m * 0.5 - 90);
    const hhx = cx + hourHandLen * Math.cos(hourRad);
    const hhy = cy + hourHandLen * Math.sin(hourRad);
    parts.push(
      `<line x1="${cx}" y1="${cy}" x2="${hhx.toFixed(2)}" y2="${hhy.toFixed(2)}" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" />`
    );
  }

  parts.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${INK}" />`);
  return parts;
}

function buildClockRowSvg(spec) {
  const clocks = spec.clocks || [];
  const n = Math.max(1, clocks.length);
  const letters = !!spec.letters;
  const labelH = letters ? CLOCK_LABEL_H : 0;

  const totalW = n * CLOCK_UNIT + (n - 1) * CLOCK_GAP;
  const totalH = labelH + CLOCK_UNIT;

  const parts = [];
  clocks.forEach((c, i) => {
    const cx = i * (CLOCK_UNIT + CLOCK_GAP) + CLOCK_UNIT / 2;
    const cy = labelH + CLOCK_UNIT / 2;
    if (letters) {
      parts.push(
        `<text x="${cx}" y="${labelH / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${CLOCK_LABEL_FONT}" font-weight="bold" fill="${INK}">(${String.fromCharCode(97 + i)})</text>`
      );
    }
    parts.push(...clockFaceParts(cx, cy, CLOCK_UNIT, c.time, c.hands ?? true));
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}">${parts.join("")}</svg>`;
  return { svg, aspect: totalW / totalH };
}

const CLOCK_CAP_MM = 90; // one row of faces never needs more than this to read
const CLOCK_MIN_MM = 24; // smaller than this and the minute ticks blur together
const CLOCK_GAP_MIN_MM = 6;

function renderClockRow(spec) {
  return `<div class="h-figure">${buildClockRowSvg(spec).svg}</div>`;
}

function measureClockRow(spec, widthMm) {
  return heightFromAspect(buildClockRowSvg(spec).aspect, widthMm, CLOCK_CAP_MM);
}

function needsClockRow(spec) {
  const n = Math.max(1, (spec.clocks || []).length);
  const minWidthMm = n * CLOCK_MIN_MM + (n - 1) * CLOCK_GAP_MIN_MM;
  const { aspect } = buildClockRowSvg(spec);
  return { minWidthMm, minHeightMm: heightFromAspect(aspect, minWidthMm, CLOCK_CAP_MM) };
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
const { profileFor, MM_TO_PT } = require("../../../shared/visuals/surface-profiles");

function numberLineAt(spec, width) {
  const widthMm = typeof width === "number" ? width : width && width.widthMm;
  return numberLineShared.tightSvg(spec, profileFor("worksheets", { widthMm: widthMm > 0 ? widthMm : 170 }));
}

function renderNumberLine(spec, widthMm) {
  return `<div class="h-figure">${numberLineAt(spec, widthMm).svg}</div>`;
}

function measureNumberLine(spec, widthMm) {
  return numberLineAt(spec, widthMm).h / MM_TO_PT;
}

function needsNumberLine(spec) {
  const lines = numberLineShared.normalise(spec);
  const labelCount = Math.max(...lines.map((l) => l.labels.length));
  const featureCount = Math.max(...lines.map((l) => Math.max(l.boxes.length, l.arrows.length, l.jumps.length)));
  // Each printed label needs room either side of it not to collide with its
  // neighbour; each box or arrow needs enough width that two adjacent ones do
  // not touch. Whichever is the tighter constraint wins.
  const minWidthMm = Math.max(70, labelCount * 14, featureCount * 22);
  return { minWidthMm, minHeightMm: measureNumberLine(spec, minWidthMm) };
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
  "clock-row": {
    render: renderClockRow,
    measure: measureClockRow,
    needs: needsClockRow,
    greed: NEVER_STRETCH,
  },
  "number-line": {
    // Lays itself out at the printed width and holds its own readable floor,
    // so the scale-with-the-zone legibility floor does not apply.
    physical: true,
    render: renderNumberLine,
    measure: measureNumberLine,
    needs: needsNumberLine,
    greed: NEVER_STRETCH,
  },
  "fraction-bar": {
    render: renderFractionBar,
    measure: measureFractionBar,
    needs: needsFractionBar,
    greed: NEVER_STRETCH,
  },
};

module.exports = { helpers, css };
