'use strict';

// THE small place-value picture. One drawing, placed by the board, the
// worksheet, the working wall and the stick-in pack.
//
// Built for the 2.2-inch picture panel on a key-vocabulary card, where a full
// place value chart is too dense to read: each mode shows one vocabulary idea at
// a glance. It was drawing correctly on the board and was missing from the
// board's registry, so any deck that used it was refused and shipped a text-only
// card (5 September 2026). Until 13 September 2026 no other surface could draw
// it, so a word bank on a sheet or a wall vocabulary card could not show the
// same picture of "digit" the class had just seen.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// The spec: { mode, ... }
//   digit-value  { digit: 6, value: 600 }   one digit mapping to its value
//   column       { column: "H" }            Th | H | T | O with that column picked out
//   exchange     {}                         ten tens counters becoming one hundred
//   placeholder  { number: "4050" }         the zeros in a numeral picked out
//
// Its counters and columns take the place value chart's colours, so "exchange"
// on a vocabulary card shows the same yellow tens and green hundred the chart
// does.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');
const { fitUnit, insetProfile } = require('./fit-unit');
const { COLUMN_COLOURS } = require('./place-value-chart-svg');

// ─── CONSTANTS (in F, the picture's main font size, unless named) ───────────
const NATURAL_FONT = 1.1;      // of the profile's font: 26pt on the board and the wall's
// Paper's profile font is set for axis numbers under body text; a vocabulary
// picture glued beside a word wants to be seen, so it starts at twice that.
const PAPER_NATURAL_FONT = 2.0;
const FLOOR_SHARE = 0.6;       // the board's smallest mini word, a share of its floor
const ARROW_GAP = 1.4;
const CELL_W = 1.7;
const CELL_H = 1.5;
const COLUMN_FONT = 0.7;
const COUNTER_D = 0.62;
const BIG_COUNTER_D = 1.9;
const EXCHANGE_ARROW = 1.6;
const DIGIT_GAP = 0.12;
const BLUE = '#0070C0';
const GREEN = '#00B050';
const BODY = '#000000';
const PALE_GREEN = '#E2F0D9';
const PALE_BLUE = '#DDEBF7';
const GRID = '#7F8C8D';
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function str(v) {
  return v == null ? '' : String(v);
}

function esc(s) {
  return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function f2(n) {
  return Math.round(n * 100) / 100;
}

function normaliseColumn(value) {
  const raw = String(value || 'H').trim().toLowerCase();
  if (raw === 'th' || raw.startsWith('thousand')) return 'Th';
  if (raw === 'h' || raw.startsWith('hundred')) return 'H';
  if (raw === 't' || raw.startsWith('ten')) return 'T';
  return 'O';
}

function normalise(spec = {}) {
  const mode = String(spec.mode || 'digit-value').toLowerCase();
  if (mode === 'column') return { mode, column: normaliseColumn(spec.column) };
  if (mode === 'exchange') return { mode };
  if (mode === 'placeholder') {
    const digits = String(spec.number != null ? spec.number : '4050').replace(/\s+/g, '').split('').slice(0, 5);
    return { mode, digits: digits.length ? digits : ['0'] };
  }
  return { mode: 'digit-value', digit: str(spec.digit != null ? spec.digit : 6), value: str(spec.value != null ? spec.value : 600) };
}

function resolveProfile(p, box) {
  return typeof p === 'string' ? profileFor(p, box || { widthPt: 500 }) : p;
}

function sizeAt(m, F) {
  if (m.mode === 'column') return { w: 4 * CELL_W * F, h: CELL_H * F };
  if (m.mode === 'exchange') return { w: 5 * COUNTER_D * F * 1.25 + EXCHANGE_ARROW * F + BIG_COUNTER_D * F, h: Math.max(2 * COUNTER_D * F * 1.25, BIG_COUNTER_D * F) };
  if (m.mode === 'placeholder') {
    const cell = Math.max(CELL_W * 0.8 * F, 0);
    return { w: m.digits.length * cell + (m.digits.length - 1) * DIGIT_GAP * F, h: CELL_H * F, cell };
  }
  return { w: textWidthEm(m.digit, true) * F + ARROW_GAP * F + textWidthEm(m.value, true) * F, h: F * 1.4 };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  // Laid out inside the box less the stroke that bleeds past the drawing's edge.
  const profile = insetProfile(resolveProfile(profileOrSurface, box), 5);
  const m = normalise(spec);
  const floor = profile.heightPt ? profile.minFontPt * FLOOR_SHARE : profile.minFontPt;
  const fit = fitUnit((F) => ({ ...sizeAt(m, F), F }), profile, profile.fontPt * (profile.surface === 'worksheets' || profile.surface === 'stickin' ? PAPER_NATURAL_FONT : NATURAL_FONT), floor / (m.mode === 'column' ? COLUMN_FONT : 1));
  if (!fit.fits) {
    throw new Error(
      `PLACE_VALUE_MINI_DOES_NOT_FIT: the "${m.mode}" picture cannot print its digits readably in ${(profile.widthPt / 72).toFixed(2)}in` +
        `${profile.heightPt ? ` x ${(profile.heightPt / 72).toFixed(2)}in` : ''}. Give the picture panel more room.`
    );
  }
  return { ...m, ...fit.layout };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const F = L.F;
  const ink = profile.palette === 'ink';
  const font = profile.font;
  const col = (c) => (ink ? '#1A1A1A' : c);
  const text = (t, x, y, pt, fill) =>
    `<text x="${f2(x)}" y="${f2(y + pt * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(pt)}" font-weight="bold" fill="${fill}">${esc(t)}</text>`;
  const arrow = (x1, x2, y, sw) => {
    const head = Math.min(0.45 * F, (x2 - x1) * 0.4);
    return `<line x1="${f2(x1)}" y1="${f2(y)}" x2="${f2(x2 - head)}" y2="${f2(y)}" stroke="${col(BLUE)}" stroke-width="${f2(sw)}"/>` +
      `<polygon points="${f2(x2)},${f2(y)} ${f2(x2 - head)},${f2(y - head * 0.45)} ${f2(x2 - head)},${f2(y + head * 0.45)}" fill="${col(BLUE)}"/>`;
  };
  const parts = [];
  if (L.mode === 'digit-value') {
    const dw = textWidthEm(L.digit, true) * F;
    parts.push(text(L.digit, dw / 2, L.h / 2, F, col(GREEN)));
    parts.push(arrow(dw + 0.2 * F, dw + ARROW_GAP * F - 0.2 * F, L.h / 2, Math.max(1.5, 0.08 * F)));
    const vw = textWidthEm(L.value, true) * F;
    parts.push(text(L.value, dw + ARROW_GAP * F + vw / 2, L.h / 2, F, col(BLUE)));
  } else if (L.mode === 'column') {
    ['Th', 'H', 'T', 'O'].forEach((c, i) => {
      const on = c === L.column;
      const x = i * CELL_W * F;
      parts.push(`<rect x="${f2(x)}" y="0" width="${f2(CELL_W * F)}" height="${f2(CELL_H * F)}" fill="${on && !ink ? PALE_GREEN : '#FFFFFF'}" stroke="${on ? col(GREEN) : col(GRID)}" stroke-width="${f2(on ? Math.max(2, 0.1 * F) : 1)}"/>`);
      parts.push(text(c, x + (CELL_W * F) / 2, (CELL_H * F) / 2, COLUMN_FONT * F, on ? col(GREEN) : col(BODY)));
    });
  } else if (L.mode === 'exchange') {
    const step = COUNTER_D * F * 1.25;
    const gridH = 2 * step;
    const top = (L.h - gridH) / 2;
    for (let r = 0; r < 2; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        parts.push(`<circle cx="${f2(c * step + step / 2)}" cy="${f2(top + r * step + step / 2)}" r="${f2((COUNTER_D * F) / 2)}" fill="${ink ? '#FFFFFF' : COLUMN_COLOURS.T[0]}" stroke="${col(GRID)}" stroke-width="0.8"/>`);
      }
    }
    const ax = 5 * step;
    parts.push(arrow(ax + 0.2 * F, ax + EXCHANGE_ARROW * F - 0.2 * F, L.h / 2, Math.max(1.5, 0.08 * F)));
    const cx = ax + EXCHANGE_ARROW * F + (BIG_COUNTER_D * F) / 2;
    parts.push(`<circle cx="${f2(cx)}" cy="${f2(L.h / 2)}" r="${f2((BIG_COUNTER_D * F) / 2)}" fill="${ink ? '#FFFFFF' : COLUMN_COLOURS.H[0]}" stroke="${col(GRID)}" stroke-width="1"/>`);
    parts.push(text('H', cx, L.h / 2, 0.7 * F, col(BODY)));
  } else {
    L.digits.forEach((d, i) => {
      const zero = d === '0';
      const x = i * (L.cell + DIGIT_GAP * F);
      parts.push(`<rect x="${f2(x)}" y="0" width="${f2(L.cell)}" height="${f2(CELL_H * F)}" rx="${f2(0.15 * F)}" fill="${zero && !ink ? PALE_BLUE : '#FFFFFF'}" stroke="${zero ? col(BLUE) : col(GRID)}" stroke-width="${f2(zero ? Math.max(2, 0.1 * F) : 1)}"/>`);
      parts.push(text(d, x + L.cell / 2, (CELL_H * F) / 2, 0.85 * F, zero ? col(BLUE) : col(BODY)));
    });
  }
  const bleed = Math.max(2, 0.1 * F);
  const w = L.w + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  return { svg, w, h, aspect: w / h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  return `place-value-mini:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout };
