'use strict';

// THE triangle-square part-whole puzzle. One drawing, placed by the board, the
// worksheet, the working wall and the stick-in pack.
//
// The SATs "the two triangles add up to the number in the square" model: two
// upward-pointing triangles stacked on the left, each holding a number low in
// its body where it is widest, a line from each running right to an arrowhead
// that points INTO a square holding the whole. Normally one shape is left blank:
// the unknown a child finds, or the value the teacher writes in live while
// modelling. Blank square means add; blank triangle means subtract.
//
// It was three. The board built it from PowerPoint shapes with its numbers
// sized by a character count, the sheet drew an SVG whose shapes widened for
// four-digit numbers, and the wall copied the sheet onto a square canvas where
// it floated small (13 September 2026). Each surface now passes only the box it
// has and its profile (shared/visuals/surface-profiles.js).
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   refuseUnlessOneBlank(spec)  the question form's rule, for a sheet or piece
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   triangles   [upper, lower]: strings or numbers; "" for the unknown
//   square      the whole; "" for the unknown

const { profileFor } = require('./surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

// ─── CONSTANTS (in u, the numeral size) ─────────────────────────────────────
// Taken from the sheet's drawing, whose proportions were tuned so a four-digit
// SATs value sits inside the sloped sides.
const NUM_EM = 1.4; // the numeral size, in ems of the profile font
const TRI_H = 2.82;
const TRI_GAP = 0.82; // between the two triangles
const H_GAP = 2.06; // triangle column to square
const TRI_MIN_W = 3.24;
const SQ_MIN = 2.47;
const NUM_Y = 0.75; // the numeral's centre, down the triangle from its apex
const FIT = 0.88; // share of the triangle's width at the numeral's top the digits may use
const SQ_FIT = 0.8;
const SQ_EXTRA = 0.7;
const STROKE = 0.075; const STROKE_MIN = 1.2; // pt
const HEAD = 0.45; // the arrowhead into the square
const CONNECT_X = 0.78; // where a line leaves a triangle, across its width
const CONNECT_Y = 0.6; // and down its height
const PAD = 0.3;
// A child WRITES in the blank shape, so its floor is handwriting room, and how
// much depends on the numbers: "130" and "9203" do not need the same box. The
// triangle asks more per digit because its sloped sides eat into the space a
// child actually writes across.
const SQ_WRITE_MM = 14; const SQ_DIGIT_MM = 5;
const TRI_WRITE_MM = 16; const TRI_DIGIT_MM = 5.5;
const MM = 72 / 25.4;
// ────────────────────────────────────────────────────────────────────────────

function f2(n) {
  return Math.round(n * 100) / 100;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function asProfile(profileOrSurface, box) {
  return typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
}

function values(spec = {}) {
  const t = Array.isArray(spec.triangles) ? spec.triangles : [];
  const str = (v) => (v == null ? '' : String(v));
  return { upper: str(t[0]), lower: str(t[1]), square: str(spec.square) };
}

// A puzzle with two blanks has no answer, and one with none is not a question
// at all. Both print perfectly happily, which is why a sheet or a child's piece
// checks this before printing. The board may show the finished puzzle, or two
// blanks the teacher fills in live, so the drawing itself does not refuse.
function refuseUnlessOneBlank(spec = {}) {
  const { upper, lower, square } = values(spec);
  const blanks = [upper, lower, square].filter((v) => v.trim() === '').length;
  if (blanks !== 1) {
    throw new Error(
      'TRIANGLE_SQUARE_BLANKS: exactly one of the two triangles and the square must be "" (the unknown the child fills in), ' +
        `but ${blanks} were blank in [${upper}, ${lower}] → [${square}].`
    );
  }
  return spec;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const v = values(spec);
  const bold = profile.bold;
  // The shapes widen with the longest number, so every shape is sized for the
  // widest of the three and a blank one still has room to write the answer in.
  const widest = Math.max(textWidthEm('00', bold), ...[v.upper, v.lower, v.square].map((s) => textWidthEm(s, bold)));
  const topFrac = NUM_Y - 0.5 / TRI_H;
  const triW = Math.max(TRI_MIN_W, widest / FIT / topFrac);
  const sq = Math.max(SQ_MIN, widest / SQ_FIT + SQ_EXTRA);
  const unitsW = 2 * PAD + triW + H_GAP + sq;
  const unitsH = 2 * PAD + Math.max(2 * TRI_H + TRI_GAP, sq);

  // Natural size: the numerals at the surface's own size, or bigger when a
  // blank shape needs the room for a child to write the answer in.
  const digits = Math.max(1, v.upper.length, v.lower.length, v.square.length);
  const writeU = Math.max((Math.max(SQ_WRITE_MM, digits * SQ_DIGIT_MM) * MM) / sq, (Math.max(TRI_WRITE_MM, digits * TRI_DIGIT_MM) * MM) / triW);
  let u = Math.max(NUM_EM * profile.fontPt, writeU);
  const fit = Math.min(profile.widthPt / unitsW, profile.heightPt ? profile.heightPt / unitsH : Infinity);
  u = Math.min(u * (profile.grow || 1), fit);
  if (!(u >= profile.minFontPt * 0.999)) {
    throw new Error(
      `TRIANGLE_SQUARE_TOO_SMALL: the puzzle cannot show its numbers at the ${profile.minFontPt}pt readable minimum in a space this small. ` +
        'Give the visual more room; the numbers are the question and were not shrunk to fit.'
    );
  }
  // Shapes grown for handwriting keep their numerals at the surface's size.
  const numPt = Math.max(profile.minFontPt, Math.min(u, NUM_EM * profile.fontPt * (profile.grow || 1)));
  return { u, numPt, triW, sq, unitsW, unitsH, w: unitsW * u, h: unitsH * u, values: v, profile };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { u, profile } = L;
  const c = profile.colours;
  const weight = profile.bold ? ' font-weight="bold"' : '';
  const sw = f2(Math.max(STROKE * u, STROKE_MIN));
  const X = (x) => f2(x * u);
  const parts = [];
  const colH = 2 * TRI_H + TRI_GAP;
  const top = PAD + (L.unitsH - 2 * PAD - colH) / 2;
  const left = PAD;
  const midY = top + colH / 2;
  const sqX = left + L.triW + H_GAP;
  const number = (s, x, y) =>
    `<text x="${X(x)}" y="${f2(y * u + L.numPt * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.numPt)}"${weight} fill="${c.ink}">${esc(s)}</text>`;

  // Connector lines first, so the shapes cover their ends.
  const anchors = [top, top + TRI_H + TRI_GAP].map((ty) => [left + L.triW * CONNECT_X, ty + TRI_H * CONNECT_Y]);
  anchors.forEach(([ax, ay]) => {
    const dx = sqX - ax;
    const dy = midY - ay;
    const len = Math.hypot(dx, dy);
    // Stop at the arrowhead's base so the line does not blunt its point.
    const ex = sqX - (dx / len) * HEAD;
    const ey = midY - (dy / len) * HEAD;
    parts.push(`<line x1="${X(ax)}" y1="${X(ay)}" x2="${X(ex)}" y2="${X(ey)}" stroke="${c.ink}" stroke-width="${sw}"/>`);
  });
  parts.push(
    `<polygon points="${X(sqX)},${X(midY)} ${X(sqX - HEAD)},${X(midY - HEAD * 0.7)} ${X(sqX - HEAD)},${X(midY + HEAD * 0.7)}" fill="${c.ink}"/>`
  );

  [[top, L.values.upper], [top + TRI_H + TRI_GAP, L.values.lower]].forEach(([ty, text]) => {
    parts.push(
      `<polygon points="${X(left + L.triW / 2)},${X(ty)} ${X(left + L.triW)},${X(ty + TRI_H)} ${X(left)},${X(ty + TRI_H)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${sw}" stroke-linejoin="round"/>`
    );
    if (text.trim() !== '') parts.push(number(text, left + L.triW / 2, ty + TRI_H * NUM_Y));
  });

  parts.push(`<rect x="${X(sqX)}" y="${X(midY - L.sq / 2)}" width="${X(L.sq)}" height="${X(L.sq)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${sw}"/>`);
  if (L.values.square.trim() !== '') parts.push(number(L.values.square, sqX + L.sq / 2, midY));

  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

// The narrowest box the puzzle reads and can be written in: its natural size,
// since it never draws smaller than its numerals or its handwriting room.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const L = describeLayout(spec, { ...profile, heightPt: null, widthPt: 1e6, grow: 1 });
  return Math.ceil(L.w);
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = asProfile(profileOrSurface, box);
  return `triangle-square:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(values(spec))}`;
}

module.exports = { tightSvg, cacheKey, describeLayout, refuseUnlessOneBlank, minWidthPt, values };
