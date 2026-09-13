'use strict';

// THE measuring jug: a jug with a vertical graduated scale, for "read the level"
// and "mark 250ml on the jug". One drawing, placed by the board, the worksheet,
// the working wall and the stick-in pack.
//
// 0 sits at the bottom and the scale climbs to `max` at the top, with numbered
// major ticks, smaller ticks between, and (when a value is given) a coloured
// liquid fill up to a level line with its value beside it. Leave `value` off for
// a blank jug the child marks; set it on the answer slide to reveal the level,
// so the one drawing renders both question and answer.
//
// It was the board's alone (builder/src/content/measuring-jug.js), drawn in
// PowerPoint shapes with 12pt numbers under the board's 18pt floor. It moved
// here on 13 September 2026, when every picture became one shared drawing
// reachable from every surface.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   max          the value at the top of the scale (default 400)
//   majorEvery   spacing of numbered ticks (default max / 4)
//   minorEvery   spacing of small ticks between them (default majorEvery / 2)
//   value        the liquid level to draw; omit for an empty jug
//   unit         unit shown at the top of the scale, e.g. "ml" (optional)
//   fillColor    hex for the liquid (default pale blue)
//   levelColor   hex for the level line and its value (default blue; green
//                reveals a marked answer on the answer slide)
//   label        a caption under the jug: the surface's own typed text (the
//                board's caption band, the wall card's caption), not drawn here

const T = require('./figure-text');

// ─── CONSTANTS (ems of the settled font size, or fractions of the body) ─────
const BODY_RATIO = 0.72; // body width as a fraction of body height (keeps it jug-shaped)
const BODY_STROKE = 0.14;
const SPOUT_H = 0.8; // head room above the body for the pour spout
const SCALE_TOP = 0.7; // ems of air inside the rim above the top mark
const SCALE_BASE = 0.35; // ems between the bottom mark and the base
const MAJOR_LEN = 0.26; // of the body width
const MINOR_LEN = 0.13;
const TICK_STROKE = 0.1;
const NUMBER_GAP = 0.4; // ems between a number and the jug wall
const LEVEL_STROKE = 0.16;
const LIQUID_INSET = 0.12;
const LABEL_GUTTER = 0.15; // ems between two stacked numbers
const NATURAL_BODY_H = 13; // ems tall on paper and on the wall
const PAD = 0.2;
const DEFAULT_FILL = '#CCE2F5';
const DEFAULT_LEVEL = '#0070C0';
const INK_FILL = '#E3E3E3';
// ────────────────────────────────────────────────────────────────────────────

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}

function tidy(v) {
  return Math.round(v * 1e9) / 1e9;
}

function formatValue(v) {
  const t = tidy(v);
  if (!Number.isInteger(t) || Math.abs(t) < 1000) return String(t);
  return t.toLocaleString('en-GB');
}

function normalise(spec = {}) {
  const max = num(spec.max, 400) > 0 ? num(spec.max, 400) : 400;
  const majorEvery = num(spec.majorEvery, 0) > 0 ? spec.majorEvery : max / 4;
  let minorEvery = num(spec.minorEvery, 0) > 0 ? spec.minorEvery : majorEvery / 2;
  if (!(majorEvery / minorEvery >= 2)) minorEvery = 0;
  const count = Math.round(max / majorEvery);
  if (count < 1 || count > 20) {
    throw new Error(`MEASURING_JUG_INVALID: a jug to ${max} numbered every ${majorEvery} has ${count} numbered marks; use 1 to 20.`);
  }
  const hasValue = Number.isFinite(spec.value);
  if (hasValue && (spec.value < 0 || spec.value > max)) {
    throw new Error(`MEASURING_JUG_VALUE_OFF_SCALE: a level of ${spec.value} is not on a jug that holds 0 to ${max}.`);
  }
  return {
    max,
    majorEvery,
    minorEvery,
    count,
    value: hasValue ? spec.value : null,
    unit: spec.unit == null ? '' : String(spec.unit),
    fillColor: spec.fillColor || null,
    levelColor: spec.levelColor || null,
  };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const bold = profile.bold;
  const numbers = [];
  for (let i = 0; i <= n.count; i++) numbers.push(tidy(i * n.majorEvery));

  const attempt = (pt) => {
    const gutter = Math.max(...numbers.map((v) => T.widthPt(formatValue(v), pt, bold)), n.unit ? T.widthPt(n.unit, pt, bold) : 0) + NUMBER_GAP * pt;
    const tagW = n.value != null ? T.widthPt(formatValue(n.value) + n.unit, pt, true) : 0;
    const spout = SPOUT_H * pt;
    const unitBand = n.unit ? T.LINE * pt : 0;
    const vPad = 2 * PAD * pt + spout + unitBand;
    const hPad = 2 * PAD * pt + gutter + SPOUT_H * pt;
    let bodyH = profile.heightPt ? profile.heightPt - vPad : NATURAL_BODY_H * pt;
    bodyH = Math.min(bodyH, (profile.widthPt - hPad) / BODY_RATIO);
    const bodyW = bodyH * BODY_RATIO;
    const scaleH = bodyH - (SCALE_TOP + SCALE_BASE) * pt;
    // Neighbouring numbers stacked up the side must not print into each other,
    // and the level's value must sit inside the jug.
    const pitch = (scaleH * n.majorEvery) / n.max;
    if (!(scaleH > 0) || pitch < pt * (1 + LABEL_GUTTER) || bodyW < tagW + pt) {
      return new Error(
        `MEASURING_JUG_TOO_SMALL: a jug ${(bodyH / 72).toFixed(2)}in tall cannot hold ${n.count + 1} numbers ${formatValue(n.majorEvery)} apart at the ${profile.minFontPt}pt readable size. ` +
          'Give the jug more height, or number it less often (a larger majorEvery).'
      );
    }
    return { pt, gutter, spout, unitBand, bodyH, bodyW, scaleH };
  };
  const L = T.settle(profile, attempt);
  const contentW = 2 * PAD * L.pt + L.gutter + L.bodyW + SPOUT_H * L.pt;
  const { W, dx } = T.frameWidth(profile, contentW);
  const bodyLeft = dx + PAD * L.pt + L.gutter;
  const bodyTop = PAD * L.pt + L.unitBand + L.spout;
  const scaleBottom = bodyTop + L.bodyH - SCALE_BASE * L.pt;
  const yFor = (v) => scaleBottom - (v / n.max) * L.scaleH;
  const h = bodyTop + L.bodyH + PAD * L.pt;
  return { ...L, n, numbers, profile, W, h, bodyLeft, bodyTop, yFor, dx };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { n, pt, profile, bodyLeft, bodyTop, bodyW, bodyH, yFor } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const ink = profile.palette === 'ink';
  const fill = ink ? INK_FILL : T.hexOr(n.fillColor, DEFAULT_FILL);
  const level = ink ? c.ink : T.hexOr(n.levelColor, DEFAULT_LEVEL);
  const bodyRight = bodyLeft + bodyW;
  const stroke = Math.max(1, BODY_STROKE * pt);
  const parts = [];

  if (n.value != null) {
    const ly = yFor(n.value);
    const inset = LIQUID_INSET * pt;
    parts.push(`<rect class="jug-liquid" x="${f(bodyLeft + inset)}" y="${f(ly)}" width="${f(bodyW - 2 * inset)}" height="${f(bodyTop + bodyH - inset - ly)}" fill="${fill}"/>`);
  }
  // The pour spout, top right, behind the rim.
  parts.push(`<polygon points="${f(bodyRight - 0.5 * pt)},${f(bodyTop)} ${f(bodyRight + SPOUT_H * pt)},${f(bodyTop - SPOUT_H * pt * 0.6)} ${f(bodyRight)},${f(bodyTop + 0.35 * pt)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f(stroke * 0.7)}" stroke-linejoin="round"/>`);
  parts.push(`<rect x="${f(bodyLeft)}" y="${f(bodyTop)}" width="${f(bodyW)}" height="${f(bodyH)}" fill="none" stroke="${c.ink}" stroke-width="${f(stroke)}"/>`);

  if (n.minorEvery) {
    const minors = Math.round(n.max / n.minorEvery);
    for (let i = 0; i <= minors; i++) {
      const v = tidy(i * n.minorEvery);
      const ofMajor = v / n.majorEvery;
      if (Math.abs(ofMajor - Math.round(ofMajor)) < 1e-6) continue;
      parts.push(`<line x1="${f(bodyLeft)}" y1="${f(yFor(v))}" x2="${f(bodyLeft + MINOR_LEN * bodyW)}" y2="${f(yFor(v))}" stroke="${c.ink}" stroke-width="${f(Math.max(0.75, TICK_STROKE * pt * 0.7))}"/>`);
    }
  }
  L.numbers.forEach((v) => {
    const y = yFor(v);
    parts.push(`<line x1="${f(bodyLeft)}" y1="${f(y)}" x2="${f(bodyLeft + MAJOR_LEN * bodyW)}" y2="${f(y)}" stroke="${c.ink}" stroke-width="${f(Math.max(1, TICK_STROKE * pt))}"/>`);
    parts.push(T.textLines([formatValue(v)], bodyLeft - NUMBER_GAP * pt, y - (pt * T.LINE) / 2 + 0.08 * pt, pt, { fill: c.ink, font, bold: profile.bold, anchor: 'end' }));
  });
  if (n.unit) {
    parts.push(T.textLines([n.unit], bodyLeft - NUMBER_GAP * pt, PAD * pt, pt, { fill: c.ink, font, bold: profile.bold, italic: true, anchor: 'end' }));
  }
  if (n.value != null) {
    const ly = yFor(n.value);
    parts.push(`<line class="jug-level" x1="${f(bodyLeft)}" y1="${f(ly)}" x2="${f(bodyRight)}" y2="${f(ly)}" stroke="${level}" stroke-width="${f(Math.max(1.5, LEVEL_STROKE * pt))}"/>`);
    parts.push(T.textLines([formatValue(n.value) + n.unit], bodyLeft + bodyW * (0.5 + MAJOR_LEN / 2), ly - pt * T.LINE - 0.1 * pt, pt, { fill: level, font, bold: true }));
  }

  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `measuring-jug:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout };
