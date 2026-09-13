'use strict';

// THE comparison picture: the ring between two things being compared that a
// child writes <, > or = into, and the symbol itself once it is known. One
// drawing, placed by the board, the worksheet, the working wall and the
// stick-in pack.
//
// Before the board's ring existed each deck typed a ○ into a text item at a
// hand-picked point size. That worked until something beside it changed size:
// on a Year 4 deck the charts either side grew and a 44pt ring that had looked
// passable beside small charts became a dot floating in a tall white box, in a
// pill of a text card that lined up with nothing. A slot is not text; it is a
// piece of the diagram, sized from the room it is given.
//
// It was three pictures of one idea. The board drew a black ring with a green
// answer in it, the sheet a blue rounded square, and the wall a bold navy
// "5 > 3" in Arial Black on a square canvas (13 September 2026). A child who
// writes ">" into a ring on the board now writes it into the same ring on the
// sheet and sees the same symbol on the wall. The board's `comparison-slot`,
// the sheet's `comparison-target` and the wall's `comparisonSymbol` all draw
// here.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   maxWidthPt(spec, profile)  the widest this picture can use
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   answer   the revealed symbol, printed in answer green inside the SAME ring,
//            so the answer slide and the question slide read as one picture
//            with one thing added
//   left, right  optional values either side ("5", "3"), for a picture that
//            carries the whole comparison (a wall card); leave them off where
//            the things compared are drawn beside it (charts on a slide)
//   ring     false draws the symbol with no ring round it. Default: a ring,
//            except for the wall's older `symbol` spelling below
//   symbol   the wall's older spelling: a known symbol with no ring, printed
//            in the label blue (or `colour`, a hex)

const { profileFor } = require('./surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const RING_EM = 3.9; // natural ring diameter, in ems of the profile font: the
                     // board's 1.3in at 24pt. Past this the ring stops reading
                     // as a slot beside its charts and competes with them
const RING_MIN_PT = 28; // about 10mm: below this nobody can write a symbol inside it
const RING_STROKE = 0.027; const RING_STROKE_MIN = 1.5; // share of the diameter, pt
const ANSWER_SHARE = 0.95; // a symbol's font size inside the ring, as a share of it: < > and =
                           // are drawn at about half their em, so this fills about half the ring
const SYMBOL_EM = 4; // a symbol with no ring, in ems of the profile font
const VALUE_SHARE = 0.55; // the values either side, as a share of the symbol's font size
const VALUE_GAP = 0.2; // ems of the symbol size between a value and the symbol
const PAD = 0.04; // share of the drawing height
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

function normalise(spec = {}) {
  const answer = spec.answer != null && String(spec.answer) !== '' ? String(spec.answer) : null;
  const symbol = spec.symbol != null && String(spec.symbol) !== '' ? String(spec.symbol).slice(0, 2) : null;
  const ring = spec.ring != null ? spec.ring !== false : !(symbol && !answer);
  const colour = typeof spec.colour === 'string' && /^#?[0-9a-f]{6}$/i.test(spec.colour) ? `#${spec.colour.replace('#', '')}` : null;
  return {
    mark: answer || symbol,
    isAnswer: Boolean(answer),
    ring,
    left: spec.left != null && String(spec.left) !== '' ? String(spec.left) : null,
    right: spec.right != null && String(spec.right) !== '' ? String(spec.right) : null,
    colour,
  };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const n = normalise(spec);
  const bold = true;
  const natural = n.ring ? RING_EM * profile.fontPt : SYMBOL_EM * profile.fontPt;
  const sizeFor = (D) => {
    const markPt = n.ring ? D * ANSWER_SHARE : D;
    const valuePt = markPt * VALUE_SHARE;
    const lw = n.left ? textWidthEm(n.left, bold) * valuePt + VALUE_GAP * markPt : 0;
    const rw = n.right ? textWidthEm(n.right, bold) * valuePt + VALUE_GAP * markPt : 0;
    const centreW = n.ring ? D : Math.max(textWidthEm(n.mark || '>', bold) * markPt, markPt * 0.6);
    const h = Math.max(n.ring ? D : markPt * 1.1, n.left || n.right ? valuePt * 1.15 : 0);
    return { markPt, valuePt, lw, rw, centreW, w: lw + centreW + rw, h };
  };
  // As big as the smaller side of the room allows and no bigger than natural.
  // A slot in a tall narrow gap between two charts is limited by its width,
  // which is exactly what stops it stretching into a pill.
  let D = natural;
  let s = sizeFor(D);
  const scale = Math.min(1, profile.widthPt / (s.w * (1 + 2 * PAD)), profile.heightPt ? profile.heightPt / (s.h * (1 + 2 * PAD)) : 1);
  D *= scale;
  const floor = n.ring ? Math.max(RING_MIN_PT, profile.minFontPt / ANSWER_SHARE) : profile.minFontPt / VALUE_SHARE;
  if (D < floor) D = floor;
  s = sizeFor(D);
  if (s.valuePt < profile.minFontPt * 0.999 && (n.left || n.right)) {
    throw new Error(
      `COMPARISON_TOO_SMALL: the values cannot print at the ${profile.minFontPt}pt readable minimum in a space this small. Give the visual more room.`
    );
  }
  const pad = Math.max(0, Math.min(PAD * s.h, (profile.widthPt - s.w) / 2));
  // Held at its readable floor, a ring with its values may still be wider than
  // the room; drawn anyway it would be squeezed into the space and its symbol
  // and values printed under the floor.
  if (s.w > profile.widthPt + 0.5) {
    throw new Error(
      `COMPARISON_TOO_NARROW: the ring${n.left || n.right ? ' and its values' : ''} cannot fit across this space at a readable size. Give the visual more width.`
    );
  }
  return { ...s, D, pad, w: s.w + 2 * pad, h: s.h + 2 * pad, spec: n, profile };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { profile, spec: n } = L;
  const c = profile.colours;
  const font = profile.font;
  const parts = [];
  const cy = L.h / 2;
  // A digit's middle sits 0.35em above its baseline; a Comic Sans < > or = sits
  // higher in its em, so its baseline drops further to centre it.
  const text = (s, x, pt, fill, anchor, mid = 0.35) =>
    `<text x="${f2(x)}" y="${f2(cy + pt * mid)}" text-anchor="${anchor}" font-family="${font}" font-size="${f2(pt)}" font-weight="bold" fill="${fill}">${esc(s)}</text>`;
  let x = L.pad;
  if (n.left) parts.push(text(n.left, x, L.valuePt, c.ink, 'start'));
  x += L.lw;
  const cx = x + L.centreW / 2;
  if (n.ring) {
    parts.push(
      `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(L.D / 2 - Math.max(RING_STROKE * L.D, RING_STROKE_MIN) / 2)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f2(Math.max(RING_STROKE * L.D, RING_STROKE_MIN))}"/>`
    );
  }
  if (n.mark) {
    const fill = n.isAnswer ? c.answer : profile.palette === 'ink' || !n.colour ? c.label : n.colour;
    parts.push(text(n.mark, cx, L.markPt, fill, 'middle', 0.45));
  }
  x += L.centreW;
  if (n.right) parts.push(text(n.right, L.w - L.pad, L.valuePt, c.ink, 'end'));
  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

// A row shares its width out by counting its items, so a ring beside two charts
// took a third of the row and used a fraction of it. This is the widest the
// picture ever draws, so the row can give the rest to the charts.
function maxWidthPt(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  return describeLayout(spec, { ...profile, widthPt: 1e6, heightPt: null }).w;
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = asProfile(profileOrSurface, box);
  return `comparison:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, maxWidthPt };
