'use strict';

// THE area grid. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack.
//
// A squared grid with one or more labelled rectangular patches on it: the
// "each square = 1m², find the area of each patch" layout. Children count
// squares, or multiply side lengths, for each named region. Cells are always
// square, so a counted square genuinely equals a unit of area.
//
// Until 13 September 2026 only the board could draw it, from PowerPoint shapes,
// so a lesson that counted patches on the board had no copy of the grid for the
// sheet, the wall or a child's book. Each surface now passes only the box it
// has and its profile (shared/visuals/surface-profiles.js). The tiny array cue
// beside a success-criteria step stays its own drawing (area-grid-cue-svg.js).
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   cols, rows   the grid in unit squares (default 10 by 6)
//   unitLabel    the key under the grid, e.g. "Each square = 1m²"
//   rects        [{ x, y, w, h, label, color }]
//                  x, y   the patch's top-left corner in squares from the
//                         TOP-LEFT of the grid (x across, y down), which is how
//                         a child reads a printed grid
//                  w, h   its width and height in squares
//                  label  the name printed in the patch ("A")
//                  color  a hex fill; otherwise a pale palette cycles
//   build        "rows": the rows-times-squares method shown one move per
//                click (builder/src/happening-runs.js turns the slide into a
//                run). Moment 0 is the plain shape; each click lights the next
//                row and writes the running total beside it (4, 8, 12); the
//                last click writes "3 rows of 4" and "3 × 4 = 12" under the
//                grid. The rows are the one patch's rows, or the whole grid's
//                when there is no patch. Room for the totals and the sum is
//                kept on every moment, so nothing moves between clicks.
//   drawn        "edges": only the shape's top row and left column of squares
//                are drawn inside its outline, for practice where counting one
//                by one should stop working. Leave it out for every square.
//   step         the moment to draw (0, 1, ...) or "end"; unset draws the
//                finished build, which is what the wall and the sheet show.
//   name         the shape's name ("Shape C"), a caption above the grid inside
//                the drawing, so the shape needs no card of its own for its
//                letter: a separate card took a whole row of the slide and left
//                the shape smaller (Year 4 area). "Shape C" says what C is; the
//                teacher chose it above or below over a large "C" beside the
//                shape, which read as part of the shape (7 November 2026).
//                For one shape on its own grid; patches carry their own `label`.
//   namePlace    "above" (the default), "below", or "beside" (a large letter on
//                the left).

const { profileFor, answerColour } = require('./surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const CELL_EM = 2.4; // natural square side, in ems of the profile font (about 9mm on a sheet)
const GRID_W = 0.03; const GRID_W_MIN = 0.5; // share of a cell, pt
const FRAME_W = 0.07; const FRAME_W_MIN = 1.2;
const PATCH_W = 0.08; const PATCH_W_MIN = 1.5;
const LABEL_FILL = 0.7; // a patch name may take this much of the patch's shorter side
const KEY_GAP = 0.4; // ems between the grid and its key
const NAME_EM = 1.6; // the shape's letter, as a size of the text: a name, read first
// The clear gap between the letter and the shape, in ems of the text: closer,
// the letter read as part of the shape (the teacher, 7 November 2026).
const NAME_GAP = 1.2;
const PAD = 0.1; // share of a cell
const GRID_COLOUR = '#8C8C8C'; // a mid grey that stays visible on the warm slide background
const FRAME_COLOUR = '#333333';
// Pale fills, so every unit square's gridline stays countable through a patch.
const PATCH_FILLS = ['#FBE2C7', '#CCE2F5', '#D5F5E3', '#EAD5F5', '#FFF2CC', '#FAD4D4'];
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

function positive(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function normalise(spec = {}) {
  const cols = Math.round(positive(spec.cols, 10));
  const rows = Math.round(positive(spec.rows, 6));
  const rects = (Array.isArray(spec.rects) ? spec.rects : []).map((r, i) => {
    const out = { x: Number(r.x) || 0, y: Number(r.y) || 0, w: positive(r.w, 1), h: positive(r.h, 1), label: r.label == null ? '' : String(r.label), color: r.color || null };
    // A patch hanging off the grid would print squares a child cannot count,
    // and an area that disagrees with the question.
    if (out.x < 0 || out.y < 0 || out.x + out.w > cols + 1e-9 || out.y + out.h > rows + 1e-9) {
      throw new Error(`AREA_GRID_PATCH_OFF_GRID: patch ${out.label || i + 1} (${out.x}, ${out.y}, ${out.w} by ${out.h}) does not fit on a ${cols} by ${rows} grid.`);
    }
    return out;
  });
  const build = buildModeOf(spec);
  if (build && rects.length > 1) {
    throw new Error(`AREA_GRID_BUILD_ONE_SHAPE: "build" shows one shape's rows one click at a time; this grid has ${rects.length} patches. Give the built shape a grid of its own.`);
  }
  const step = spec.step === 'end' || spec.step == null || spec.step === '' ? null : Number(spec.step);
  const drawn = spec.drawn == null || spec.drawn === '' || spec.drawn === 'all' ? 'all' : String(spec.drawn).toLowerCase();
  if (drawn !== 'all' && drawn !== 'edges') {
    throw new Error(`AREA_GRID_INVALID: "drawn" is "${spec.drawn}"; use "edges" (only the top row and left column of squares drawn) or leave it out.`);
  }
  if (drawn === 'edges' && (rects.length > 1 || build)) {
    throw new Error('AREA_GRID_EDGES_ONE_SHAPE: "drawn": "edges" draws one shape with only its top row and left column of squares; give it a grid of its own, with no patches beside it and no build.');
  }
  const name = spec.name == null ? '' : String(spec.name).trim();
  const asked = String(spec.namePlace || '').toLowerCase();
  const namePlace = asked === 'below' ? 'below' : asked === 'beside' ? 'left' : 'above';
  return { cols, rows, rects, unitLabel: spec.unitLabel ? String(spec.unitLabel) : '', build, step: Number.isInteger(step) ? step : null, drawn, name, namePlace };
}

function buildModeOf(spec) {
  const b = spec && spec.build;
  if (b == null || b === '' || b === false) return null;
  if (String(b).toLowerCase() !== 'rows') {
    throw new Error(`AREA_GRID_INVALID: "build" is "${b}"; the only build is "rows" (each click lights the next row with its running total).`);
  }
  return 'rows';
}

// The shape whose rows are built: the one patch, or the whole grid.
function builtShape(g) {
  return g.rects.length ? g.rects[0] : { x: 0, y: 0, w: g.cols, h: g.rows };
}

// One moment per click: { lit, sum, sentence }. `lit` is how many rows are lit.
function buildSteps(spec = {}) {
  const g = normalise(spec);
  if (!g.build) return [];
  const s = builtShape(g);
  const steps = [{ lit: 0, sum: false, sentence: 'the shape before any row is counted' }];
  for (let k = 1; k <= s.h; k++) {
    steps.push({ lit: k, sum: false, sentence: k === 1 ? `the first row: ${s.w} squares` : `the next row of ${s.w}: ${k * s.w} so far` });
  }
  steps.push({ lit: s.h, sum: true, sentence: `${s.h} rows of ${s.w}: ${s.h} × ${s.w} = ${s.h * s.w}` });
  return steps;
}

// The two lines under a finished build; the last piece is the answer.
function sumLines(g) {
  const s = builtShape(g);
  return [`${s.h} rows of ${s.w}`, `${s.h} × ${s.w} = `, String(s.h * s.w)];
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const g = normalise(spec);
  const T = Math.max(profile.fontPt, profile.minFontPt);
  const keyH = g.unitLabel ? T * (1.3 + KEY_GAP) : 0;
  // A build keeps room for the running totals beside the rows and the two sum
  // lines under the grid on every moment, so the grid never moves.
  const shape = g.build ? builtShape(g) : null;
  const totalW = g.build ? T * KEY_GAP * 2 + textWidthEm(String(shape.w * shape.h), true) * T : 0;
  const sumH = g.build ? T * (KEY_GAP + 2 * 1.3) : 0;
  // The shape's letter stands to the left of the grid, with a gap of its own.
  // Beside the shape the name is its letter, large; above or below it is a
  // short caption ("Shape C") at the size of the text, on a line of its own.
  const side = g.name && g.namePlace === 'left';
  const namePt = g.name ? T * (side ? NAME_EM : 1.2) : 0;
  const nameW = side ? textWidthEm(g.name, true) * namePt + T * (KEY_GAP + NAME_GAP) : 0;
  const nameH = g.name && !side ? namePt * 1.3 + T * KEY_GAP : 0;
  let cell = CELL_EM * profile.fontPt * (profile.grow || 1);
  cell = Math.min(cell, (profile.widthPt - totalW - nameW) / (g.cols + 2 * PAD));
  if (profile.heightPt) cell = Math.min(cell, (profile.heightPt - keyH - sumH - nameH) / (g.rows + 2 * PAD));
  const shortest = g.rects.length ? Math.min(...g.rects.map((r) => Math.min(r.w, r.h))) : Infinity;
  const labelPt = Math.min(T * 1.2, shortest * cell * LABEL_FILL);
  if (g.rects.some((r) => r.label) && labelPt < profile.minFontPt * 0.999) {
    throw new Error(
      `AREA_GRID_TOO_SMALL: the patch names cannot print at the ${profile.minFontPt}pt readable minimum on squares this small. ` +
        'Give the grid more room, or use fewer squares.'
    );
  }
  const keyPt = g.unitLabel ? Math.min(T, (profile.widthPt / Math.max(1, textWidthEm(g.unitLabel, profile.bold))) * 0.98) : 0;
  if (g.unitLabel && keyPt < profile.minFontPt * 0.999) {
    throw new Error('AREA_GRID_TOO_SMALL: the key under the grid does not fit across this space at a readable size. Shorten it or give the grid more width.');
  }
  const pad = PAD * cell;
  const gridW = g.cols * cell;
  const gridH = g.rows * cell;
  const lines = g.build ? sumLines(g) : null;
  const sumW = lines ? Math.max(textWidthEm(lines[0], true), textWidthEm(lines[1] + lines[2], true)) * T + 2 * pad : 0;
  const captionW = g.name && !side ? textWidthEm(g.name, true) * namePt + 2 * pad : 0;
  const w = Math.max(nameW + gridW + 2 * pad + totalW, sumW, captionW, g.unitLabel ? textWidthEm(g.unitLabel, profile.bold) * keyPt + 2 * pad : 0);
  const h = gridH + 2 * pad + sumH + keyH + nameH;
  const oy = pad + (g.name && g.namePlace === 'above' ? nameH : 0);
  return { w, h, cell, pad, gridW, gridH, ox: nameW + (w - nameW - gridW - totalW) / 2, oy, labelPt, keyPt, T, totalW, sumH, namePt, nameW, nameH, grid: g, profile };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { cell, ox, oy, profile, grid: g } = L;
  const c = profile.colours;
  const ink = profile.palette === 'ink';
  const weight = profile.bold ? ' font-weight="bold"' : '';
  const px = (x) => ox + x * cell;
  const py = (y) => oy + y * cell;
  const parts = [];
  // Fills first, under the gridlines, so every unit square stays countable.
  g.rects.forEach((r, i) => {
    const fill = ink ? c.highlight : r.color ? `#${String(r.color).replace('#', '')}` : PATCH_FILLS[i % PATCH_FILLS.length];
    const opacity = ink ? ' fill-opacity="0.22"' : '';
    parts.push(`<rect x="${f2(px(r.x))}" y="${f2(py(r.y))}" width="${f2(r.w * cell)}" height="${f2(r.h * cell)}" fill="${fill}"${opacity}/>`);
  });
  // A build lights its counted rows, still under the gridlines.
  const steps = g.build ? buildSteps(spec) : null;
  const moment = steps ? steps[g.step == null ? steps.length - 1 : Math.max(0, Math.min(steps.length - 1, g.step))] : null;
  const shape = g.build ? builtShape(g) : null;
  if (moment) {
    for (let k = 0; k < moment.lit; k++) {
      parts.push(`<rect x="${f2(px(shape.x))}" y="${f2(py(shape.y + k))}" width="${f2(shape.w * cell)}" height="${f2(cell)}" fill="${c.highlight}" fill-opacity="0.3"/>`);
    }
  }
  const gw = f2(Math.max(GRID_W * cell, GRID_W_MIN));
  const gridColour = ink ? '#8C8C8C' : GRID_COLOUR;
  for (let i = 0; i <= g.cols; i++) parts.push(`<line x1="${f2(px(i))}" y1="${f2(oy)}" x2="${f2(px(i))}" y2="${f2(oy + L.gridH)}" stroke="${gridColour}" stroke-width="${gw}"/>`);
  for (let j = 0; j <= g.rows; j++) parts.push(`<line x1="${f2(ox)}" y1="${f2(py(j))}" x2="${f2(ox + L.gridW)}" y2="${f2(py(j))}" stroke="${gridColour}" stroke-width="${gw}"/>`);
  // "edges": the shape keeps only its top row and left column of squares, so
  // the area has to come from rows times squares; counting one by one stops.
  if (g.drawn === 'edges') {
    const s = builtShape(g);
    if (s.w > 1 && s.h > 1) {
      const half = Number(gw) / 2;
      const x = px(s.x + 1) + half;
      const y = py(s.y + 1) + half;
      const w = (s.w - 1) * cell - half;
      const h = (s.h - 1) * cell - half;
      parts.push(`<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="#FFFFFF"/>`);
      if (g.rects.length) {
        const fill = ink ? c.highlight : g.rects[0].color ? `#${String(g.rects[0].color).replace('#', '')}` : PATCH_FILLS[0];
        parts.push(`<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}"${ink ? ' fill-opacity="0.22"' : ''}/>`);
      }
    }
  }
  parts.push(`<rect x="${f2(ox)}" y="${f2(oy)}" width="${f2(L.gridW)}" height="${f2(L.gridH)}" fill="none" stroke="${ink ? c.ink : FRAME_COLOUR}" stroke-width="${f2(Math.max(FRAME_W * cell * 0.5, FRAME_W_MIN))}"/>`);
  // Outlines and names on top, so each patch reads as one region.
  g.rects.forEach((r) => {
    parts.push(`<rect x="${f2(px(r.x))}" y="${f2(py(r.y))}" width="${f2(r.w * cell)}" height="${f2(r.h * cell)}" fill="none" stroke="${c.arrow}" stroke-width="${f2(Math.max(PATCH_W * cell * 0.4, PATCH_W_MIN))}"/>`);
    if (r.label) {
      parts.push(
        `<text x="${f2(px(r.x + r.w / 2))}" y="${f2(py(r.y + r.h / 2) + L.labelPt * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.labelPt)}" font-weight="bold" fill="${c.ink}">${esc(r.label)}</text>`
      );
    }
  });
  if (moment) {
    const totalPt = Math.min(L.T, cell * 0.8);
    for (let k = 0; k < moment.lit; k++) {
      parts.push(
        `<text x="${f2(ox + L.gridW + L.T * KEY_GAP)}" y="${f2(py(shape.y + k + 0.5) + totalPt * 0.35)}" font-family="${profile.font}" font-size="${f2(totalPt)}" font-weight="bold" fill="${c.ink}">${(k + 1) * shape.w}</text>`
      );
    }
    if (moment.sum) {
      const [line1, line2, ans] = sumLines(g);
      const y1 = oy + L.gridH + L.pad + L.T * KEY_GAP + L.T * 0.95;
      const y2 = y1 + L.T * 1.3;
      const cx = ox + L.gridW / 2;
      const answer = answerColour(profile, c.answer, c.ink);
      parts.push(`<text x="${f2(cx)}" y="${f2(y1)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.T)}" font-weight="bold" fill="${c.ink}">${esc(line1)}</text>`);
      parts.push(
        `<text x="${f2(cx)}" y="${f2(y2)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.T)}" font-weight="bold" fill="${c.ink}">${esc(line2)}<tspan fill="${answer}">${esc(ans)}</tspan></text>`
      );
    }
  }
  if (g.name && g.namePlace !== 'left') {
    const cx = ox + L.gridW / 2;
    const y = g.namePlace === 'above'
      ? oy - L.pad - L.T * KEY_GAP - L.namePt * 0.3
      : oy + L.gridH + L.pad + L.sumH + L.T * KEY_GAP + L.namePt * 0.95;
    parts.push(
      `<text x="${f2(cx)}" y="${f2(y)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.namePt)}" font-weight="bold" fill="${c.ink}">${esc(g.name)}</text>`
    );
  } else if (g.name) {
    parts.push(
      `<text x="${f2(ox - L.T * NAME_GAP)}" y="${f2(oy + L.gridH / 2 + L.namePt * 0.35)}" text-anchor="end" font-family="${profile.font}" font-size="${f2(L.namePt)}" font-weight="bold" fill="${c.ink}">${esc(g.name)}</text>`
    );
  }
  if (g.unitLabel) {
    parts.push(
      `<text x="${f2(L.w / 2)}" y="${f2(oy + L.gridH + L.pad + L.sumH + (g.name && g.namePlace === 'below' ? L.nameH : 0) + L.T * KEY_GAP + L.keyPt * 0.95)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.keyPt)}"${weight} fill="${c.ink}">${esc(g.unitLabel)}</text>`
    );
  }
  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = asProfile(profileOrSurface, box);
  return `area-grid:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, buildSteps };
