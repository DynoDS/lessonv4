'use strict';

// THE base-ten blocks. One drawing, placed by the board, the worksheet, the
// working wall and the stick-in pack.
//
// Dienes blocks in four columns - a thousand cube, a hundred flat, a ten rod, a
// unit cube - used when the blocks themselves are the place-value
// representation, not an illustration. Only the worksheet could draw them until
// 13 September 2026, so a lesson that modelled with blocks on the board had to
// switch picture on paper or leave them out. Each block is drawn as vectors so
// it stays crisp in print, and the column headings take the place value chart's
// colours, so a thousands column is the same blue wherever a child meets it.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// The spec: counts: { Th: 2, H: 4, T: 3, O: 6 } (the chart's column names), each
// a whole number from 0 to 10. The sheet's spelling, { thousands, hundreds,
// tens, ones }, is read too. A count outside 0 to 10 is refused by name, because
// a column of eleven blocks is an exchange the picture should show, not hide.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');
const { fitUnit, insetProfile } = require('./fit-unit');
const { canonicalColumn, COLUMN_COLOURS } = require('./place-value-chart-svg');

// ─── CONSTANTS (in U, one block's box, unless named) ────────────────────────
const PLACES = ['Th', 'H', 'T', 'O'];
const WORDS = { Th: 'Thousands', H: 'Hundreds', T: 'Tens', O: 'Ones' };
const PER_ROW = 2;
const BLOCK_GAP = 0.1;
const COL_PAD = 0.15;
const COL_GAP = 0.12;
const NATURAL_BLOCK_PT = (16 * 72) / 25.4; // the sheet's 16mm block
const MIN_BLOCK_PT = (7 * 72) / 25.4;      // below this a hundred flat's grid is a grey square
const HEAD_FONT = 0.28;                    // a heading, of U, held to the surface's floor
const INK = '#1A1A1A';
const SURFACE = '#F2F2F2';
const FINE = '#9A9A9A';
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function f2(n) {
  return Math.round(n * 100) / 100;
}

function normalise(spec = {}) {
  const source = spec.counts && typeof spec.counts === 'object' ? spec.counts : {};
  const counts = { Th: 0, H: 0, T: 0, O: 0 };
  Object.keys(source).forEach((key) => {
    const place = canonicalColumn(key);
    if (!PLACES.includes(place)) {
      throw new Error(`BASE_TEN_BLOCKS_INVALID: "${key}" is not a place base-ten blocks can show; use Th, H, T and O (or thousands, hundreds, tens, ones).`);
    }
    const value = Number(source[key] || 0);
    if (!Number.isInteger(value) || value < 0 || value > 10) {
      throw new Error(`base-ten-blocks: counts.${key} must be a whole number from 0 to 10`);
    }
    counts[place] = value;
  });
  return { counts };
}

// One block in a 40-unit box, scaled into its place.
function blockParts(place, x, y, size, sw) {
  const s = size / 40;
  const t = (d) => `transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})"`;
  const outline = `fill="${SURFACE}" stroke="${INK}" stroke-width="${f2(sw / s)}" stroke-linejoin="round"`;
  const fine = `fill="none" stroke="${FINE}" stroke-width="${f2((sw * 0.45) / s)}"`;
  if (place === 'Th') {
    return `<g ${t()}><path d="M8 13 21 5l13 8v16l-13 8-13-8zM8 13l13 8 13-8M21 21v16" ${outline}/><path d="M12 11l13 8m-9-11 13 8M8 18l13 8 13-8M8 23l13 8 13-8" ${fine}/></g>`;
  }
  if (place === 'H') {
    const lines = [];
    for (let k = 1; k < 10; k += 1) lines.push(`M${5 + 3 * k} 5v30M5 ${5 + 3 * k}h30`);
    return `<g ${t()}><rect x="5" y="5" width="30" height="30" ${outline}/><path d="${lines.join('')}" ${fine}/></g>`;
  }
  if (place === 'T') {
    const lines = [];
    for (let k = 1; k < 10; k += 1) lines.push(`M16 ${f2(3 + 3.4 * k)}h8`);
    return `<g ${t()}><rect x="16" y="3" width="8" height="34" ${outline}/><path d="${lines.join('')}" ${fine}/></g>`;
  }
  return `<g ${t()}><path d="M12 15 21 10l9 5v11l-9 5-9-5zM12 15l9 5 9-5M21 20v11" ${outline}/></g>`;
}

function resolveProfile(p, box) {
  return typeof p === 'string' ? profileFor(p, box || { widthPt: 500 }) : p;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  // Laid out inside the box less the stroke that bleeds past the drawing's edge.
  const profile = insetProfile(resolveProfile(profileOrSurface, box), 4);
  const { counts } = normalise(spec);
  const rows = Math.max(1, ...PLACES.map((p) => Math.ceil(counts[p] / PER_ROW)));
  const floor = profile.heightPt ? profile.minFontPt * 0.5 : profile.minFontPt;
  const at = (U) => {
    const font = Math.max(floor, Math.min(profile.fontPt, HEAD_FONT * U));
    const blocksW = PER_ROW * U + (PER_ROW - 1) * BLOCK_GAP * U + 2 * COL_PAD * U;
    const fullWords = PLACES.every((p) => textWidthEm(WORDS[p], true) * font <= blocksW - 4);
    const shortW = Math.max(...PLACES.map((p) => textWidthEm(p, true) * font)) + 4;
    const colW = Math.max(blocksW, fullWords ? 0 : shortW);
    const headH = font * 1.6;
    const bodyH = rows * U + (rows - 1) * BLOCK_GAP * U + 2 * COL_PAD * U;
    return { U, font, colW, headH, bodyH, fullWords, w: 4 * colW + 3 * COL_GAP * U, h: headH + bodyH };
  };
  const natural = profile.heightPt ? NATURAL_BLOCK_PT * 2 : NATURAL_BLOCK_PT;
  const fit = fitUnit(at, profile, natural, MIN_BLOCK_PT);
  if (!fit.fits) {
    throw new Error(
      `BASE_TEN_BLOCKS_DO_NOT_FIT: four columns of blocks need at least ${(at(MIN_BLOCK_PT).w / 72).toFixed(2)}in x ${(at(MIN_BLOCK_PT).h / 72).toFixed(2)}in ` +
        'for a hundred flat to still show its hundred squares. Give the blocks a wider zone, or fewer of the largest column.'
    );
  }
  return { counts, rows, ...fit.layout };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const sw = Math.max(0.8, L.U * 0.035);
  const parts = [];
  const ink = profile.palette === 'ink';
  PLACES.forEach((p, i) => {
    const x = i * (L.colW + COL_GAP * L.U);
    parts.push(`<rect x="${f2(x)}" y="0" width="${f2(L.colW)}" height="${f2(L.h)}" fill="#FFFFFF" stroke="${INK}" stroke-width="${f2(sw)}"/>`);
    parts.push(`<rect x="${f2(x)}" y="0" width="${f2(L.colW)}" height="${f2(L.headH)}" fill="${ink ? '#E6E6E6' : COLUMN_COLOURS[p][0]}" stroke="${INK}" stroke-width="${f2(sw)}"/>`);
    parts.push(`<text x="${f2(x + L.colW / 2)}" y="${f2(L.headH / 2 + L.font * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.font)}" font-weight="bold" fill="${INK}">${L.fullWords ? WORDS[p] : p}</text>`);
    const blocksW = PER_ROW * L.U + (PER_ROW - 1) * BLOCK_GAP * L.U;
    for (let k = 0; k < L.counts[p]; k += 1) {
      const bx = x + (L.colW - blocksW) / 2 + (k % PER_ROW) * (L.U + BLOCK_GAP * L.U);
      const by = L.headH + COL_PAD * L.U + Math.floor(k / PER_ROW) * (L.U + BLOCK_GAP * L.U);
      parts.push(blockParts(p, bx, by, L.U, sw));
    }
  });
  const bleed = sw;
  const w = L.w + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  return { svg, w, h, aspect: w / h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  return `base-ten-blocks:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

function minWidthPt() {
  const U = NATURAL_BLOCK_PT * 0.75;
  return 4 * (PER_ROW * U + BLOCK_GAP * U + 2 * COL_PAD * U) + 3 * COL_GAP * U + 2 * 4 + 1;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt };
