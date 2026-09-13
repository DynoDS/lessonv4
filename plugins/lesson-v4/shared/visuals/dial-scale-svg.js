'use strict';

// THE dial scale: the round kitchen or weighing scale a child reads a value off.
// One drawing, placed by the board, the worksheet, the working wall and the
// stick-in pack.
//
// 0 sits at the top and a full revolution clockwise is `max`, with numbered
// major ticks, minor ticks between, and a red needle pointing to `value`. Used
// for "the scales show ___, how much more to reach ___?" questions.
//
// It was the board's alone (builder/src/content/dial-scale.js), drawn in
// PowerPoint shapes with its numbers at a fixed 12pt, under the 18pt floor every
// other piece of board text keeps, and it rounded every number to a whole one,
// so a 5kg dial numbered in halves read "0 1 1 2 2". It moved here on
// 13 September 2026, when every picture became one shared drawing reachable
// from every surface; the numbers are now laid out at the size they print.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   max         the value at a full revolution (default 1000)
//   value       where the needle points (default 0)
//   unit        unit shown under the centre, e.g. "g" or "ml" (optional)
//   majorEvery  spacing of numbered ticks (default max / 10)
//   minorEvery  spacing of small ticks (default majorEvery / 5); left out when
//               fewer than two would fit between numbered ticks
//   label       a caption under the dial. It is the surface's own typed text
//               (the board's caption band, the wall card's caption), so it is
//               not drawn into the picture.

const T = require('./figure-text');

// ─── CONSTANTS (fractions of the face radius, or ems of the font) ───────────
const FACE_STROKE = 0.02; // of the radius
const MAJOR_LEN = 0.16;
const MINOR_LEN = 0.09;
const MAJOR_STROKE = 0.012;
const MINOR_STROKE = 0.006;
const NUMBER_GAP = 0.3; // ems between a major tick's inner end and its number
const NEEDLE_STROKE = 0.025;
const NEEDLE_CLEAR = 0.5; // ems the needle stops short of the number ring
const HUB_R = 0.035;
const UNIT_DROP = 0.34; // of the radius, below the centre
const LABEL_GUTTER = 0.35; // ems between neighbouring numbers round the ring
// On paper and on the wall a dial is drawn this many ems across, which reads
// comfortably without taking a whole column; the board fills its zone.
const NATURAL_D = 17;
const PAD = 0.2;
// ────────────────────────────────────────────────────────────────────────────

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}

function tidy(v) {
  return Math.round(v * 1e9) / 1e9;
}

// Numbers print as they are: 250, 1.5, 2,500 with the thousands comma the
// question beside the dial uses.
function formatValue(v) {
  const t = tidy(v);
  if (!Number.isInteger(t) || Math.abs(t) < 1000) return String(t);
  return t.toLocaleString('en-GB');
}

function normalise(spec = {}) {
  const max = num(spec.max, 1000) > 0 ? num(spec.max, 1000) : 1000;
  const value = num(spec.value, 0);
  if (value < 0 || value > max) {
    throw new Error(`DIAL_SCALE_VALUE_OFF_SCALE: the needle at ${value} is not on a dial that runs from 0 to ${max}.`);
  }
  const majorEvery = num(spec.majorEvery, 0) > 0 ? spec.majorEvery : max / 10;
  let minorEvery = num(spec.minorEvery, 0) > 0 ? spec.minorEvery : majorEvery / 5;
  // Skip the minors if they would not sit between the majors.
  if (!(majorEvery / minorEvery >= 2)) minorEvery = 0;
  const count = Math.round(max / majorEvery);
  if (count < 2 || count > 40) {
    throw new Error(`DIAL_SCALE_INVALID: a dial to ${max} numbered every ${majorEvery} has ${count} numbers; use 2 to 40.`);
  }
  return { max, value, unit: spec.unit == null ? '' : String(spec.unit), majorEvery, minorEvery, count };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const bold = profile.bold;
  const numbers = [];
  for (let i = 0; i < n.count; i++) numbers.push(tidy(i * n.majorEvery));

  const attempt = (pt) => {
    const avail = profile.widthPt - 2 * PAD * pt;
    let D = profile.heightPt ? Math.min(avail, profile.heightPt - 2 * PAD * pt) : Math.min(avail, NATURAL_D * pt);
    const r = D / 2;
    const widest = Math.max(...numbers.map((v) => T.widthPt(formatValue(v), pt, bold)));
    // The ring the numbers sit on, inset so the widest number clears its tick.
    const ring = r * (1 - MAJOR_LEN) - NUMBER_GAP * pt - Math.max(widest / 2, 0.5 * pt);
    const chord = 2 * ring * Math.sin(Math.PI / n.count);
    if (!(ring > 1.5 * pt) || chord < widest + LABEL_GUTTER * pt) {
      return new Error(
        `DIAL_SCALE_TOO_SMALL: ${n.count} numbers round a dial ${(D / 72).toFixed(2)}in across do not fit apart at the ${profile.minFontPt}pt readable size. ` +
          'Give the dial more room, or number it less often (a larger majorEvery).'
      );
    }
    return { pt, D, r, ring, widest };
  };
  const L = T.settle(profile, attempt);
  const contentW = L.D + 2 * PAD * L.pt;
  const { W, dx } = T.frameWidth(profile, contentW);
  const cx = dx + contentW / 2;
  const cy = PAD * L.pt + L.r;
  const h = L.D + 2 * PAD * L.pt;
  return { ...L, n, numbers, profile, W, h, cx, cy };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { n, r, cx, cy, pt, profile } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const angle = (v) => ((v / n.max) * 360 - 90) * (Math.PI / 180);
  const at = (a, rad) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  const parts = [];

  parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r - (FACE_STROKE * r) / 2)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f(Math.max(1, FACE_STROKE * r))}"/>`);
  if (n.minorEvery) {
    const minors = Math.round(n.max / n.minorEvery);
    for (let i = 0; i < minors; i++) {
      const v = tidy(i * n.minorEvery);
      const ofMajor = v / n.majorEvery;
      if (Math.abs(ofMajor - Math.round(ofMajor)) < 1e-6) continue;
      const [x1, y1] = at(angle(v), r);
      const [x2, y2] = at(angle(v), r * (1 - MINOR_LEN));
      parts.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c.ink}" stroke-width="${f(Math.max(0.75, MINOR_STROKE * r))}"/>`);
    }
  }
  L.numbers.forEach((v) => {
    const a = angle(v);
    const [x1, y1] = at(a, r);
    const [x2, y2] = at(a, r * (1 - MAJOR_LEN));
    parts.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c.ink}" stroke-width="${f(Math.max(1, MAJOR_STROKE * r))}"/>`);
    const [nx, ny] = at(a, L.ring);
    parts.push(T.textLines([formatValue(v)], nx, ny - (pt * T.LINE) / 2 + pt * 0.08, pt, { fill: c.ink, font, bold: profile.bold }));
  });
  if (n.unit) {
    parts.push(T.textLines([n.unit], cx, cy + r * UNIT_DROP - (pt * T.LINE) / 2, pt, { fill: c.ink, font, bold: profile.bold }));
  }
  const needle = Math.max(pt, L.ring - NEEDLE_CLEAR * pt - L.widest / 2);
  const [tx, ty] = at(angle(n.value), needle);
  parts.push(`<line class="dial-needle" x1="${f(cx)}" y1="${f(cy)}" x2="${f(tx)}" y2="${f(ty)}" stroke="${c.arrow}" stroke-width="${f(Math.max(1.5, NEEDLE_STROKE * r))}" stroke-linecap="round"/>`);
  parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(Math.max(2, HUB_R * r))}" fill="${c.arrow}"/>`);

  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `dial-scale:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, formatValue };
