'use strict';

// THE bar chart. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack: a y-axis carrying a numbered scale with
// horizontal gridlines, house-blue bars rising from a category x-axis, and the
// optional axis titles.
//
// The board drew its own until 13 September 2026, in PowerPoint shapes with
// 11pt scale numbers, and never printed the chart title the sheet and the wall
// printed. A child met two different charts for one set of numbers, and the
// board's were the ones read from the back of the room. Every surface now
// places this drawing.
//
//   tightSvg(spec, profile) -> { svg, aspect, w, h, anchors }, laid out in
//                              points at the size it prints
//                              (shared/visuals/surface-profiles.js): the scale
//                              numbers print at the profile's size, the plot
//                              stretches to the box, and a box that cannot hold
//                              readable numbers is refused by name
//   cacheKey(spec, profile)
//
// There was also a one-argument form in design units, which the sheet and the
// wall scaled to fit. It went once they placed the printed-size layout too, so
// every surface's chart now keeps its scale numbers at a real size rather than
// at whatever size the scaling left them.
//
// The `anchors` map names the parts a "read a bar chart" anatomy poster points at:
//   title     the chart heading
//   scale     the numbered y-axis (the "each line is worth N" part children misread)
//   gridline  a representative horizontal gridline, out at the right where it is clear
//   rows      one entry per category, at the TOP of that bar (a read-off callout)
// Consumed by the working wall's labelledDiagram card via the shared label-diagram
// overlay, exactly as the pictogram's anchors are.
//
// Spec (the board's spelling; the sheet's camelCase is read too):
//   title        optional heading above the chart.
//   categories   array of x-axis category-label strings.
//   values       array of numbers, one per category.
//   y_max        top of the scale (yMax). Default: rounded up from the largest value.
//   y_interval   spacing between scale lines (yInterval). Default: a "nice" step
//                derived from the data, never a silent 1, because reading a
//                non-unit scale is the whole point of a Year 4 bar chart lesson.
//   y_label      optional title up the y-axis (yLabel).
//   x_label      optional title under the categories (xLabel).

const { textWidthEm } = require('../text/comic-glyph-width');

const BAR_FILL     = '#2E74B5';   // house blue
const BAR_STROKE   = '#1F4E79';   // house deep blue
const AXIS_COLOUR  = '#000000';
const GRID_COLOUR  = '#DDDDDD';
const TEXT_COLOUR  = '#000000';
const TITLE_COLOUR = '#1F4E79';
const FONT = "'Comic Sans MS', 'Comic Sans', 'Comic Neue', sans-serif";

// ─── CONSTANTS (design units; a profile scales them so TICK_FS is its fontPt) ─
const TITLE_FS = 36;
const LABEL_FS = 28;   // category labels
const TICK_FS  = 28;   // y-axis numbers
const AXIS_TITLE_FS = 28;

// With no depth set by the box (paper, the wall, the pack), the plot is this
// tall for its width: the shape the board's charts take in a slide zone, where
// the plot measured 0.61 to 0.64 of its width (13 September 2026). A chart
// drawn wider is then a bigger chart, not a flatter one.
const PLOT_H_PER_W = 0.62;
const SLOT_W_MIN = 110;   // minimum width per category column
const SLOT_PAD   = 18;    // clear space between two neighbouring category labels
const BAR_FRAC   = 0.6;   // bar width as a fraction of its slot
const BAR_W_MAX  = 84;    // cap so a wide (label-driven) column doesn't fatten the bar
const TITLE_GAP  = 18;
const TICK_LEN   = 7;
const TICK_GAP   = 12;    // tick mark to the scale number
const AXIS_TITLE_GAP = 10;
const PAD_RIGHT  = 26;
const PAD_TOP_NO_TITLE = 14;
const STROKE_W   = 2.5;
const MARGIN     = STROKE_W + 3;
// Scale numbers are stacked up the axis a line apart at the least; closer and
// the "2" of one line prints into the "4" of the next.
const TICK_LEADING = 1.15;
// ─── END CONSTANTS ───────────────────────────────────────────────────────────

function f(n) { return Number(n).toFixed(2); }
function escapeXml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function textW(s, fs, bold) { return textWidthEm(String(s == null ? '' : s), Boolean(bold)) * fs; }
function pick(data, a, b) { return data[a] != null ? data[a] : data[b]; }
function hasText(v) { return v != null && String(v).trim() !== ''; }

// The board's own rule, kept when the board moved onto this drawing: a step a
// child can count in, about five lines up the axis.
function niceInterval(dataMax) {
  if (dataMax <= 0) return 1;
  const rough = dataMax / 5;
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100];
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] >= rough) return candidates[i];
  }
  return Math.ceil(rough / 10) * 10;
}

function resolveScale(data) {
  const values = Array.isArray(data.values) ? data.values.map(Number) : [];
  const dataMax = Math.max(0, ...values.filter(Number.isFinite));
  const givenInterval = Number(pick(data, 'y_interval', 'yInterval'));
  const interval = givenInterval > 0 ? givenInterval : niceInterval(dataMax);
  const givenMax = Number(pick(data, 'y_max', 'yMax'));
  const max = Number.isFinite(givenMax) && givenMax > 0
    ? givenMax
    : Math.ceil(dataMax / interval - 1e-9) * interval || interval;
  return { interval, max };
}

function readSpec(data = {}) {
  const categories = Array.isArray(data.categories) ? data.categories.map((c) => String(c)) : [];
  const values = Array.isArray(data.values) ? data.values.map(Number) : [];
  const n = Math.min(categories.length, values.length);
  return {
    title: hasText(data.title) ? String(data.title) : '',
    categories: categories.slice(0, n),
    values: values.slice(0, n),
    yLabel: hasText(pick(data, 'y_label', 'yLabel')) ? String(pick(data, 'y_label', 'yLabel')) : '',
    xLabel: hasText(pick(data, 'x_label', 'xLabel')) ? String(pick(data, 'x_label', 'xLabel')) : '',
    ...resolveScale(data),
  };
}

// Every size for one unit scale `u` (1 = the design units; a profile picks the
// scale that prints the scale numbers at its font size).
//
// `tiers` is how many rows the category names are set on. One, normally. Two
// when the names will not sit side by side at a readable size: every other
// name drops to a second row under its own bar, the way the number line lifts
// a label that would meet its neighbour, so "Swimming" and "Football" can
// share half a slide at 18pt instead of printing at 11pt as the board's own
// chart did.
function measureAt(s, u, tiers = 1, widthCap = null) {
  const tickFs = TICK_FS * u;
  const labelFs = LABEL_FS * u;
  const steps = Math.round(s.max / s.interval);
  let tickW = 0;
  for (let i = 0; i <= steps; i++) tickW = Math.max(tickW, textW(i * s.interval, tickFs));
  const yTitleW = s.yLabel ? AXIS_TITLE_FS * u * 1.2 + AXIS_TITLE_GAP * u : 0;
  const padLeft = yTitleW + Math.max(56 * u, tickW + TICK_GAP * u + TICK_LEN * u);
  let maxCatW = 0;
  for (const c of s.categories) maxCatW = Math.max(maxCatW, textW(c, labelFs));
  const slotW = tiers === 1
    ? Math.max(SLOT_W_MIN * u, maxCatW + SLOT_PAD * u)
    : Math.max(SLOT_W_MIN * u * 0.6, (maxCatW + SLOT_PAD * u) / tiers);
  const plotW = Math.max(slotW, s.categories.length * slotW);
  // A title wider than the box is set smaller on its own; it never pulls the
  // scale numbers down with it.
  let titleFs = TITLE_FS * u;
  if (s.title && widthCap) titleFs = Math.min(titleFs, (widthCap - 2 * MARGIN * u) / textWidthEm(s.title, true));
  const titleW = s.title ? textW(s.title, titleFs, true) : 0;
  // The top scale number is centred on the top gridline, so half of it stands
  // above the plot and needs its room under the title.
  const padTop = s.title ? titleFs + TITLE_GAP * u + tickFs * 0.5 : Math.max(PAD_TOP_NO_TITLE * u, tickFs * 0.6);
  const catH = labelFs + 18 * u + (tiers - 1) * labelFs * 1.2;
  const xTitleH = s.xLabel ? AXIS_TITLE_FS * u * 1.3 + AXIS_TITLE_GAP * u : 0;
  const margin = MARGIN * u;
  const naturalW = Math.max(padLeft + plotW + PAD_RIGHT * u, titleW) + 2 * margin;
  return { u, tiers, tickFs, labelFs, titleFs, steps, padLeft, slotW, plotW, titleW, padTop, catH, xTitleH, margin, naturalW, maxCatW };
}

function refuse(code, message) {
  throw new Error(`${code}: ${message}`);
}

// Where everything goes: points at the printed size, the plot stretched to the
// box, the numbers shrunk no further than the surface's readable floor.
function layout(data, profile) {
  const s = readSpec(data);
  if (!profile || !(profile.widthPt > 0)) {
    refuse('BAR_CHART_NO_PROFILE', 'a bar chart is laid out at the size it prints, so it needs the surface profile and width it will print at (shared/visuals/surface-profiles.js).');
  }
  if (!s.categories.length) {
    refuse('BAR_CHART_EMPTY', 'a bar chart needs at least one category with a value; nothing was drawn in its place.');
  }
  const W = profile.widthPt;
  const floorU = profile.minFontPt / TICK_FS;
  let u = profile.fontPt / TICK_FS;
  // A surface that grows its drawings into spare room (`grow`) lets the words
  // grow with a chart given more width than it needs, up to that factor and
  // never below the profile's own size. Where the box sets the depth (the
  // board) the depth decides instead, as it always has.
  const grow = profile.heightPt ? 1 : Math.max(1, profile.grow || 1);
  const startU = grow > 1 ? u * Math.min(grow, Math.max(1, W / measureAt(s, u, 1, W).naturalW)) : u;
  // Across: the category names have to sit under their bars without meeting.
  // Smaller names on one row first, down to the floor; then the full size on
  // two rows, down to the floor; then a refusal.
  const fitAcross = (tiers) => {
    let uu = startU;
    let mm = measureAt(s, uu, tiers, W);
    while (mm.naturalW > W && uu > floorU) { uu = Math.max(floorU, uu - 0.01); mm = measureAt(s, uu, tiers, W); }
    return mm.naturalW <= W ? mm : null;
  };
  let m = fitAcross(1) || (s.categories.length > 1 ? fitAcross(2) : null);
  if (!m) {
    refuse(
      'BAR_CHART_TOO_NARROW',
      `${s.categories.length} categories cannot sit under their bars with their names at the ${profile.minFontPt}pt readable minimum ` +
        'in a space this narrow, even on two rows. Give the chart more width, or shorten the category names; nothing was shrunk past readable.'
    );
  }
  if (s.title && m.titleFs < profile.minFontPt) {
    refuse('BAR_CHART_TITLE_TOO_LONG', `the title ${JSON.stringify(s.title)} cannot fit across this chart at the ${profile.minFontPt}pt readable minimum. Shorten it; it was not cut.`);
  }
  u = m.u;
  // Down: the plot takes whatever the box leaves, and must hold the scale's
  // numbers a line apart.
  const bands = (mm) => mm.padTop + mm.catH + mm.xTitleH + 2 * mm.margin;
  const need = (mm) => Math.max(mm.steps * mm.tickFs * TICK_LEADING, 3 * mm.tickFs);
  let plotH;
  if (profile.heightPt) {
    plotH = profile.heightPt - bands(m);
    while (plotH < need(m) && u > floorU) {
      u = Math.max(floorU, u - 0.02);
      m = measureAt(s, u, m.tiers, W);
      plotH = profile.heightPt - bands(m);
    }
    if (plotH < need(m)) {
      refuse(
        'BAR_CHART_ZONE_TOO_SMALL',
        `after its title, axis titles and category names this chart has ${Math.max(0, plotH / 72).toFixed(2)}in left for a scale of ` +
          `${m.steps} lines, which cannot be numbered at the ${profile.minFontPt}pt readable minimum. Give it a larger zone, drop the title, ` +
          'or use a larger y_interval; nothing was drawn in its place.'
      );
    }
  } else {
    plotH = Math.max((W - 2 * m.margin - m.padLeft - PAD_RIGHT * u) * PLOT_H_PER_W, need(m));
  }
  return { s, m, W, plotW: W - 2 * m.margin - m.padLeft - PAD_RIGHT * u, plotH };
}

function draw(L) {
  const { s, m, W, plotW, plotH } = L;
  const u = m.u;
  const contentW = W - 2 * m.margin;
  const h = m.padTop + plotH + m.catH + m.xTitleH + 2 * m.margin;
  const w = W;
  const OX = m.margin, OY = m.margin;
  // The plot sits centred under a title wider than itself.
  const baseW = m.padLeft + plotW + PAD_RIGHT * u;
  const extra = Math.max(0, contentW - baseW);
  const plotLeft = OX + m.padLeft + extra / 2;
  const plotTop = OY + m.padTop;
  const plotBottom = plotTop + plotH;
  // With spare width the slots widen to use it, and the bar widens in step, so
  // a chart stretched across a slide keeps the proportions it has on paper
  // rather than thin bars in wide gaps. The cap only stops a column made wide
  // by a long category NAME from fattening its bar.
  const n = s.categories.length;
  const slotW = n ? plotW / n : plotW;
  const stretch = Math.max(1, slotW / m.slotW);
  const barW = Math.min(slotW * BAR_FRAC, Math.min(m.slotW * BAR_FRAC, BAR_W_MAX * u) * stretch);
  const yFor = (v) => plotBottom - (v / s.max) * plotH;
  const pct = (x, y) => [Number((100 * x / w).toFixed(2)), Number((100 * y / h).toFixed(2))];
  const anchors = { title: null, scale: null, gridline: null, rows: {} };
  const parts = [];
  const text = (x, y, str, fs, extraAttrs) =>
    `<text x="${f(x)}" y="${f(y)}" font-family="${FONT}" font-size="${f(fs)}" ${extraAttrs}>${escapeXml(str)}</text>`;

  if (s.title) {
    parts.push(text(OX + contentW / 2, OY + m.titleFs * 0.82, s.title, m.titleFs, `text-anchor="middle" font-weight="bold" fill="${TITLE_COLOUR}"`));
    anchors.title = pct(OX + contentW / 2, OY + m.titleFs * 0.45);
  }

  // Gridlines + scale numbers. No gridline at nought: the axis marks it.
  let midGridY = null;
  for (let i = 0; i <= m.steps; i++) {
    const v = i * s.interval;
    const y = yFor(v);
    if (i > 0) {
      parts.push(`<line x1="${f(plotLeft)}" y1="${f(y)}" x2="${f(plotLeft + plotW)}" y2="${f(y)}" stroke="${GRID_COLOUR}" stroke-width="${f(1.4 * u)}"/>`);
    }
    parts.push(`<line x1="${f(plotLeft - TICK_LEN * u)}" y1="${f(y)}" x2="${f(plotLeft)}" y2="${f(y)}" stroke="${AXIS_COLOUR}" stroke-width="${f(1.8 * u)}"/>`);
    parts.push(text(plotLeft - TICK_GAP * u, y, v, m.tickFs, `text-anchor="end" dominant-baseline="central" fill="${TEXT_COLOUR}"`));
    if (midGridY === null && v >= s.max / 2) midGridY = y;
  }
  anchors.scale = pct(plotLeft - 56 * u * 0.45, plotTop + plotH * 0.5);
  anchors.gridline = pct(plotLeft + plotW * 0.92, midGridY != null ? midGridY : plotTop + plotH * 0.4);

  // Axes.
  parts.push(`<line x1="${f(plotLeft)}" y1="${f(plotTop)}" x2="${f(plotLeft)}" y2="${f(plotBottom)}" stroke="${AXIS_COLOUR}" stroke-width="${f(STROKE_W * u)}"/>`);
  parts.push(`<line x1="${f(plotLeft)}" y1="${f(plotBottom)}" x2="${f(plotLeft + plotW)}" y2="${f(plotBottom)}" stroke="${AXIS_COLOUR}" stroke-width="${f(STROKE_W * u)}"/>`);

  // Bars + category labels. A bar of nothing is no bar, just its label.
  for (let i = 0; i < n; i++) {
    const v = Number(s.values[i]) || 0;
    const by = yFor(v);
    const bx = plotLeft + i * slotW + (slotW - barW) / 2;
    const bh = plotBottom - by;
    if (bh > 0.01) {
      parts.push(`<rect x="${f(bx)}" y="${f(by)}" width="${f(barW)}" height="${f(bh)}" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="${f(STROKE_W * u)}"/>`);
    }
    const cx = plotLeft + i * slotW + slotW / 2;
    parts.push(text(cx, plotBottom + m.labelFs + (i % m.tiers) * m.labelFs * 1.2, s.categories[i], m.labelFs, `text-anchor="middle" dominant-baseline="alphabetic" fill="${TEXT_COLOUR}"`));
    anchors.rows[s.categories[i]] = pct(cx, by);
  }

  if (s.xLabel) {
    parts.push(text(plotLeft + plotW / 2, plotBottom + m.catH + AXIS_TITLE_FS * u * 0.95, s.xLabel, AXIS_TITLE_FS * u, `text-anchor="middle" font-weight="bold" fill="${TEXT_COLOUR}"`));
  }
  if (s.yLabel) {
    const yx = plotLeft - m.padLeft + AXIS_TITLE_FS * u * 0.8;
    const yy = plotTop + plotH / 2;
    parts.push(text(yx, yy, s.yLabel, AXIS_TITLE_FS * u, `text-anchor="middle" font-weight="bold" fill="${TEXT_COLOUR}" transform="rotate(-90, ${f(yx)}, ${f(yy)})"`));
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h, anchors };
}

function tightSvg(data = {}, profile) {
  return draw(layout(data, profile));
}

function cacheKey(data = {}, profile) {
  const s = readSpec(data);
  const box = `:${profile.surface}:${f(profile.widthPt)}x${profile.heightPt ? f(profile.heightPt) : '-'}`;
  return `bar-chart${box}:${s.title}:${s.categories.join(',')}:${s.values.join(',')}:${s.interval}:${s.max}:${s.yLabel}:${s.xLabel}`;
}

// Compact construction cue. Scale values and category labels belong to the
// question; the action that survives inline is drawing equal-width bars from a
// common baseline.
function barsCueSvg() {
  const w = 190, h = 160;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><line x1="24" y1="12" x2="24" y2="142" stroke="${AXIS_COLOUR}" stroke-width="7"/><line x1="24" y1="142" x2="180" y2="142" stroke="${AXIS_COLOUR}" stroke-width="7"/><rect x="42" y="84" width="28" height="58" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="5"/><rect x="86" y="35" width="28" height="107" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="5"/><rect x="130" y="62" width="28" height="80" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="5"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, barsCueSvg, cacheKey, readSpec, niceInterval };
