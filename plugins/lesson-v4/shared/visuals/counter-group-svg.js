'use strict';

// THE counter group. One drawing, placed by the board, the worksheet, the
// working wall and the stick-in pack.
//
// Place-value counters on their own: a compact group of one value, several
// groups joined by an operator, under the claim they are evidence for. The place
// value chart is the right object when the COLUMNS are the teaching; it is the
// wrong one when two claims have to sit side by side and be compared, because a
// four-column chart is most of a page wide and two of them are two pages. What
// that comparison needs is the counters themselves, at a size a child can read
// the value on, and nothing else.
//
// Only the worksheet could draw this until 13 September 2026, in the
// manipulatives' purple, blue and red. It now draws each counter in its place's
// column colour from the place value chart, so the counters a child meets in a
// chart are the counters they meet in a group.
//
// It draws exactly the groups it is given. There is no field for a total and no
// arithmetic anywhere in it: a picture that could work out whether the claim
// were true would sooner or later print the answer beside the question.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// The spec:
//   statement  the claim, exactly as the question words it ("5,009 = 5,000 + 9")
//   joiner     the operator between groups ("+"), or none
//   groups     [{ value: "1000", count: 5 }, ...]; count 1 to 20, value the
//              number on the counter

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');
const { fitUnit, insetProfile } = require('./fit-unit');
const { COLUMN_COLOURS } = require('./place-value-chart-svg');

// ─── CONSTANTS (in F, the counter's face font, unless named) ────────────────
const PER_ROW = 3;          // a group of nine reads as three rows of three, not a
                            // line nine counters long, the way a chart cell holds them
const PILL_H = 1.8;         // a counter is a pill sized to the number on it: a round
                            // counter carrying "1000" would be that wide every way
const PILL_PAD = 0.45;
const COUNTER_GAP = 0.3;
const GROUP_GAP = 1.1;
const OP_W = 1.6;
const STATEMENT_FONT = 1.45;
const STATEMENT_PAD = 0.5;
const STATEMENT_GAP = 0.45;
const NATURAL_FONT = 0.9;   // of the profile's font: the sheet's 9pt note-size face
const PLACE_OF_VALUE = { '1000000': 'M', '100000': 'HTh', '10000': 'TTh', '1000': 'Th', '100': 'H', '10': 'T', '1': 'O', '0.1': 't', '0.01': 'h', '0.001': 'th' };
const TINT = '#F2F2F2';
const TEXT = '#000000';
const LINE = '#4A4A4A';
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

function normalise(spec = {}) {
  const groups = spec.groups;
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error('counter-group: `groups` must list at least one group of counters');
  }
  return {
    statement: str(spec.statement).trim(),
    joiner: spec.joiner != null && spec.joiner !== '' ? str(spec.joiner) : '',
    groups: groups.map((group, i) => {
      const face = str(group && group.value).trim();
      if (!face) throw new Error(`counter-group: group ${i + 1} has no \`value\` (the number on the counter)`);
      const count = Number(group.count);
      if (!Number.isInteger(count) || count < 1 || count > 20) {
        throw new Error(`counter-group: group ${i + 1} needs a \`count\` from 1 to 20. The count is the evidence; it is not something to infer.`);
      }
      return { face, count, place: PLACE_OF_VALUE[face.replace(/,/g, '')] || null };
    }),
  };
}

function wrap(text, width, font) {
  const lines = [];
  let line = '';
  text.split(/\s+/).filter(Boolean).forEach((w) => {
    const next = line ? `${line} ${w}` : w;
    if (line && textWidthEm(next, true) * font > width) { lines.push(line); line = w; } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

function resolveProfile(p, box) {
  return typeof p === 'string' ? profileFor(p, box || { widthPt: 500 }) : p;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  // Laid out inside the box less the stroke that bleeds past the drawing's edge.
  const profile = insetProfile(resolveProfile(profileOrSurface, box), 1);
  const G = normalise(spec);
  const floor = profile.heightPt ? profile.minFontPt * 0.5 : Math.min(profile.minFontPt, 9);
  const at = (F) => {
    const groups = G.groups.map((g) => {
      const pillW = Math.max(PILL_H * F, textWidthEm(g.face, true) * F + 2 * PILL_PAD * F);
      const perRow = Math.min(PER_ROW, g.count);
      const rows = Math.ceil(g.count / PER_ROW);
      return { ...g, pillW, perRow, rows, w: perRow * pillW + (perRow - 1) * COUNTER_GAP * F, h: rows * PILL_H * F + (rows - 1) * COUNTER_GAP * F };
    });
    const rowW = groups.reduce((s, g) => s + g.w, 0) + (groups.length - 1) * (G.joiner ? 2 * GROUP_GAP * F * 0.5 + OP_W * F : GROUP_GAP * F);
    const tallest = Math.max(...groups.map((g) => g.h));
    const sFont = STATEMENT_FONT * F;
    const w = Math.max(rowW, G.statement ? Math.min(profile.widthPt, textWidthEm(G.statement, true) * sFont + 2 * STATEMENT_PAD * F) : 0);
    const sLines = G.statement ? wrap(G.statement, w - 2 * STATEMENT_PAD * F, sFont) : [];
    const sH = G.statement ? sLines.length * sFont * 1.3 + 2 * STATEMENT_PAD * F : 0;
    return { F, groups, rowW, tallest, sFont, sLines, sH, w, h: sH + (G.statement ? STATEMENT_GAP * F : 0) + tallest };
  };
  const natural = profile.fontPt * NATURAL_FONT * (profile.heightPt ? 1.4 : 1);
  const fit = fitUnit(at, profile, natural, floor);
  if (!fit.fits || fit.layout.rowW > profile.widthPt + 0.5) {
    throw new Error(
      `COUNTER_GROUP_TOO_WIDE: these counters need ${(at(floor).rowW / 72 * 25.4).toFixed(0)}mm across at the smallest readable counter, and have ` +
        `${(profile.widthPt / 72 * 25.4).toFixed(0)}mm. A counter a child cannot read the face of is not a counter: give the group the full width, or fewer counters.`
    );
  }
  return { ...G, ...fit.layout };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const ink = profile.palette === 'ink';
  const font = profile.font;
  const F = L.F;
  const parts = [];
  let y = 0;
  if (L.statement) {
    // The claim sits with the evidence for it, or a page ends up with a row of
    // counters and no way to tell which claim they belong to.
    parts.push(`<rect x="0" y="0" width="${f2(L.w)}" height="${f2(L.sH)}" fill="${ink ? '#FFFFFF' : TINT}"${ink ? ` stroke="#1A1A1A" stroke-width="1"` : ''}/>`);
    L.sLines.forEach((line, k) =>
      parts.push(`<text x="${f2(L.w / 2)}" y="${f2(STATEMENT_PAD * F + k * L.sFont * 1.3 + L.sFont * 0.95)}" text-anchor="middle" font-family="${font}" font-size="${f2(L.sFont)}" font-weight="bold" fill="${TEXT}">${esc(line)}</text>`)
    );
    y = L.sH + STATEMENT_GAP * F;
  }
  let x = (L.w - L.rowW) / 2;
  const pills = [];
  L.groups.forEach((g, gi) => {
    if (gi > 0) {
      if (L.joiner) {
        x += GROUP_GAP * F * 0.5;
        parts.push(`<text x="${f2(x + (OP_W * F) / 2)}" y="${f2(y + L.tallest / 2 + STATEMENT_FONT * F * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(STATEMENT_FONT * F)}" font-weight="bold" fill="${TEXT}">${esc(L.joiner)}</text>`);
        x += OP_W * F + GROUP_GAP * F * 0.5;
      } else x += GROUP_GAP * F;
    }
    const top = y + (L.tallest - g.h) / 2;
    const fill = ink ? '#FFFFFF' : g.place ? COLUMN_COLOURS[g.place][0] : '#D0D0D0';
    for (let k = 0; k < g.count; k += 1) {
      const row = Math.floor(k / PER_ROW);
      const inRow = Math.min(PER_ROW, g.count - row * PER_ROW);
      const rowOffset = ((g.perRow - inRow) * (g.pillW + COUNTER_GAP * F)) / 2;
      const px = x + rowOffset + (k % PER_ROW) * (g.pillW + COUNTER_GAP * F);
      const py = top + row * (PILL_H * F + COUNTER_GAP * F);
      pills.push({ x: px, y: py, w: g.pillW, h: PILL_H * F });
      parts.push(`<rect x="${f2(px)}" y="${f2(py)}" width="${f2(g.pillW)}" height="${f2(PILL_H * F)}" rx="${f2((PILL_H * F) / 2)}" fill="${fill}" stroke="${ink ? '#1A1A1A' : LINE}" stroke-width="${f2(Math.max(0.75, 0.06 * F))}"/>`);
      parts.push(`<text x="${f2(px + g.pillW / 2)}" y="${f2(py + (PILL_H * F) / 2 + F * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(F)}" font-weight="bold" fill="${TEXT}">${esc(g.face)}</text>`);
    }
    x += g.w;
  });
  const bleed = 1;
  const w = L.w + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  return { svg, w, h, aspect: w / h, layout: { ...L, pills } };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  return `counter-group:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

// The width of the counters alone at the sheet's readable counter, which is the
// truth about how much page this evidence costs.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets') {
  const profile = resolveProfile(profileOrSurface, { widthPt: 2000 });
  return describeLayout(spec, profile).rowW + 2 * 1 + 1;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt };
