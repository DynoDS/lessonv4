'use strict';

// THE pyramid. One drawing, placed by the board, the worksheet, the working wall
// and the stick-in pack.
//
// Two jobs share one shape: the dialogic ranking pyramid (most important at the
// top, rows of cards widening beneath, with optional row labels), and the maths
// number pyramid, where each brick is the sum of the two below it and a blank
// brick is the question. It was drawn twice: the board as PowerPoint boxes with
// a blue outline, green `||` answers and row labels, the sheet (`number-pyramid`)
// as touching CSS bricks with orange given numbers. This is now the one pyramid,
// in the board's look (13 September 2026). Rows are centred on one brick width,
// so an upper brick always sits over the join of the two beneath it, which is
// the whole meaning of a number pyramid.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// The spec (the board's spelling), apex row first:
//
//   rows: [{ label, cells, items }]
//     cells  how many bricks in the row (defaults to the items given)
//     items  what each brick says; "" or missing is an empty brick, and "||28"
//            is an answer revealed in green inside the brick
//     label  optional words to the left of the row ("Most important")
//
// With no rows it draws the empty 1-2-3 ranking frame. The sheet's spelling,
// `rows: [[""], ["14", "20"], ["", "8", "12"]]`, is read too.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');
const { fitUnit, insetProfile } = require('./fit-unit');

// ─── CONSTANTS (in U, the brick's width, unless named) ─────────────────────
const BRICK_H = 0.72;            // a number brick is wider than tall, the sheet's brick
const GAP = 0.08;                // between bricks and rows, so each course reads as a course
const TEXT_PAD = 0.08;           // inside a brick, either side of its words
const LINE_W_PT = 2;             // the board's outline
const NATURAL_FONT = 1.25;       // of the profile's font, for a number brick
const BOARD_MAX_FONT = 32;       // the board's ceiling for words in a brick
const FLOOR_SHARE = 14 / 18;     // the board's smallest brick word, a share of its floor
const LABEL_FONT = 0.6;          // row labels, of the profile's font
const LABEL_MAX_W = 1.1 * 72;    // a row label's column on the board, before it wraps
const LABEL_GAP = 0.08 * 72;
const PAPER_BRICK_MIN_PT = (14 * 72) / 25.4; // a number written in a brick by hand
const PAPER_BRICK_MAX_PT = (22 * 72) / 25.4; // past this a pyramid is a wall
const COLOURS = { line: '#0070C0', fill: '#FFFFFF', text: '#000000', answer: '#00B050', label: '#000000' };
const INK = { line: '#1A1A1A', fill: '#FFFFFF', text: '#1A1A1A', answer: '#1A1A1A', label: '#1A1A1A' };
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

function answerRun(value) {
  const s = str(value);
  const at = s.indexOf('||');
  if (at === -1) return { text: s, answer: false };
  return { text: (s.slice(0, at) + s.slice(at + 2)).trim(), answer: true };
}

function normalise(spec = {}) {
  const raw = Array.isArray(spec.rows) && spec.rows.length
    ? spec.rows
    : [{ cells: 1 }, { cells: 2 }, { cells: 3 }];
  const rows = raw.map((row) => {
    if (Array.isArray(row)) row = { items: row };
    if (!row || typeof row !== 'object') row = {};
    const items = Array.isArray(row.items) ? row.items : [];
    const cells = Math.max(1, Math.floor(Number(row.cells) || items.length || 1));
    return {
      label: str(row.label),
      bricks: Array.from({ length: cells }, (_, i) => answerRun(items[i])),
    };
  });
  const words = rows.some((r) => r.bricks.some((b) => /[A-Za-z]/.test(b.text) && !/^\?$/.test(b.text)));
  return { rows, maxCells: Math.max(...rows.map((r) => r.bricks.length)), words };
}

function wrap(text, width, font) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((w) => {
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
  const profile = insetProfile(resolveProfile(profileOrSurface, box), 2);
  const P = normalise(spec);
  const board = Boolean(profile.heightPt);
  const floor = board ? profile.minFontPt * FLOOR_SHARE : profile.minFontPt;
  const labelFont = Math.max(board ? profile.minFontPt * 0.5 : profile.minFontPt, profile.fontPt * LABEL_FONT);
  const hasLabels = P.rows.some((r) => r.label);
  const labelW = hasLabels
    ? Math.max(
        // never narrower than the longest single word, which cannot wrap
        Math.max(...P.rows.flatMap((r) => r.label.split(/\s+/).map((w) => textWidthEm(w, true) * labelFont))) + 2,
        Math.min(board ? LABEL_MAX_W : 30 * 72 / 25.4, Math.max(...P.rows.map((r) => textWidthEm(r.label, true) * labelFont)) + 2)
      )
    : 0;
  const labelCol = hasLabels ? labelW + LABEL_GAP : 0;

  // For a brick width U: the words in every brick at one size (one pyramid,
  // one type size), wrapped inside the brick, and the brick as tall as those
  // lines need.
  const at = (U, capFont) => {
    const inner = U * (1 - 2 * TEXT_PAD);
    let font = capFont;
    let lines = 1;
    P.rows.forEach((r) =>
      r.bricks.forEach((b) => {
        if (!b.text) return;
        const longestWord = Math.max(...b.text.split(/\s+/).map((w) => textWidthEm(w, true)));
        font = Math.min(font, inner / Math.max(0.1, longestWord));
      })
    );
    P.rows.forEach((r) => r.bricks.forEach((b) => { if (b.text) lines = Math.max(lines, wrap(b.text, inner, font).length); }));
    const brickH = Math.max(U * BRICK_H, lines * font * 1.25 + 2 * TEXT_PAD * U);
    const w = labelCol + P.maxCells * U + (P.maxCells - 1) * GAP * U;
    const h = P.rows.length * brickH + (P.rows.length - 1) * GAP * U;
    return { w, h, U, brickH, font };
  };

  let layout;
  if (board) {
    // The board's bricks share the zone's width and take its height, as they
    // always did; words shrink inside them to the floor and no further.
    const U = (profile.widthPt - labelCol) / (P.maxCells + (P.maxCells - 1) * GAP);
    const rowH = Math.min(U, (profile.heightPt - (P.rows.length - 1) * GAP * U) / P.rows.length);
    const trial = at(U, Math.min(BOARD_MAX_FONT, rowH * 0.5));
    layout = { ...trial, brickH: Math.max(trial.brickH, Math.min(rowH, U * BRICK_H * 1.4)) };
    layout.h = P.rows.length * layout.brickH + (P.rows.length - 1) * GAP * U;
    if (layout.h > profile.heightPt + 0.5) {
      const rows = P.rows.length;
      layout.brickH = (profile.heightPt - (rows - 1) * GAP * U) / rows;
      layout.h = profile.heightPt;
      // Words must still fit the shorter brick.
      let lines = 1;
      P.rows.forEach((r) => r.bricks.forEach((b) => { if (b.text) lines = Math.max(lines, wrap(b.text, U * (1 - 2 * TEXT_PAD), layout.font).length); }));
      layout.font = Math.min(layout.font, (layout.brickH * 0.9) / (lines * 1.25));
    }
  } else {
    const natural = profile.fontPt * NATURAL_FONT;
    // A number pyramid on paper starts at the sheet's widest brick and gives way to
    // the width it has, as the sheet's own bricks did.
    const Unat = P.words ? natural * 7 : PAPER_BRICK_MAX_PT;
    const fit = fitUnit((U) => at(U, natural), profile, Unat, P.words ? natural * 4 : PAPER_BRICK_MIN_PT);
    layout = fit.layout;
  }
  if (layout.font < floor - 0.01 || layout.w > profile.widthPt + 0.5) {
    throw new Error(
      `PYRAMID_DOES_NOT_FIT: the words in this ${P.rows.length}-row pyramid would print at ${layout.font.toFixed(1)}pt, below the ${floor.toFixed(0)}pt ` +
        'a child reads here. Give the pyramid a wider and taller zone (workingSpace: false), shorten the cards, or leave the bricks empty for children to rank onto paper.'
    );
  }
  return { ...P, ...layout, labelW, labelCol, labelFont, floor };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const pal = profile.palette === 'ink' ? INK : COLOURS;
  const font = profile.font;
  const gap = GAP * L.U;
  const fullW = L.maxCells * L.U + (L.maxCells - 1) * gap;
  const parts = [];
  const bricks = [];
  L.rows.forEach((row, r) => {
    const y = r * (L.brickH + gap);
    const rowW = row.bricks.length * L.U + (row.bricks.length - 1) * gap;
    const x0 = L.labelCol + (fullW - rowW) / 2;
    if (row.label) {
      const lines = wrap(row.label, L.labelW, L.labelFont);
      const lh = L.labelFont * 1.2;
      const top = y + (L.brickH - lines.length * lh) / 2;
      lines.forEach((line, k) =>
        parts.push(`<text x="${f2(x0 - LABEL_GAP)}" y="${f2(top + k * lh + L.labelFont * 0.9)}" text-anchor="end" font-family="${font}" font-size="${f2(L.labelFont)}" font-weight="bold" fill="${pal.label}">${esc(line)}</text>`)
      );
    }
    row.bricks.forEach((b, i) => {
      const x = x0 + i * (L.U + gap);
      bricks.push({ row: r, index: i, x, y, w: L.U, h: L.brickH, text: b.text });
      parts.push(`<rect x="${f2(x)}" y="${f2(y)}" width="${f2(L.U)}" height="${f2(L.brickH)}" fill="${pal.fill}" stroke="${pal.line}" stroke-width="${LINE_W_PT}"/>`);
      if (b.text) {
        const lines = wrap(b.text, L.U * (1 - 2 * TEXT_PAD), L.font);
        const lh = L.font * 1.25;
        const top = y + (L.brickH - lines.length * lh) / 2;
        lines.forEach((line, k) =>
          parts.push(`<text x="${f2(x + L.U / 2)}" y="${f2(top + k * lh + L.font * 0.95)}" text-anchor="middle" font-family="${font}" font-size="${f2(L.font)}" font-weight="bold" fill="${b.answer ? pal.answer : pal.text}">${esc(line)}</text>`)
        );
      }
    });
  });
  const bleed = LINE_W_PT;
  const w = L.labelCol + fullW + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  return { svg, w, h, aspect: w / h, layout: { ...L, bricks } };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  return `pyramid:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

function minWidthPt(spec = {}) {
  const P = normalise(spec);
  const hasLabels = P.rows.some((r) => r.label);
  const U = P.words ? 30 * 72 / 25.4 : PAPER_BRICK_MIN_PT;
  return (hasLabels ? 30 * 72 / 25.4 + LABEL_GAP : 0) + P.maxCells * U + (P.maxCells - 1) * GAP * U + 2 * 2 + 1;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt };
