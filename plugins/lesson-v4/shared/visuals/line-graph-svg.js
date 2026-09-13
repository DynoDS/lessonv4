'use strict';

// THE line graph. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack: numbered, titled x and y axes, points plotted at
// their readings and joined in order by a red line, with horizontal and
// vertical gridlines a child reads a value off ("what was the height at hour
// 3?") or an interval from ("how long to fall from 16cm to 3cm?").
//
// The board drew its own until 13 September 2026, in PowerPoint shapes with
// 11pt axis numbers, and dropped the graph's title that the sheet and the wall
// printed. Every surface now places this drawing.
//
//   tightSvg(spec, profile) -> { svg, aspect, w, h, anchors }, laid out in
//                              points at the size it prints
//                              (shared/visuals/surface-profiles.js): the axis
//                              numbers print at the profile's size, the plot
//                              stretches to the box, and a box that cannot hold
//                              readable numbers is refused by name
//   cacheKey(spec, profile)
//
// There was also a one-argument form in design units, which the sheet and the
// wall scaled to fit. It went once they placed the printed-size layout too, so
// every surface's graph keeps its axis numbers at a real size.
//
// The `anchors` map names the parts a "read a line graph" anatomy poster points at:
//   title    the graph heading
//   yAxis    the numbered vertical scale (the values, read up the side)
//   xAxis    the numbered horizontal axis (usually time, read along the bottom)
//   line     a point on the plotted line itself (the trend children describe)
//   point    a representative plotted reading (a dot on the line)
//   rows     one entry per plotted point, keyed by its x value, AT that dot, so a
//            worked read-off callout ("at 3 hours it was 12 cm") points at the dot.
// Consumed by the working wall's labelledDiagram card via the shared label-diagram
// overlay, exactly as the bar chart's and pictogram's anchors are.
//
// Spec (one spelling on every surface):
//   points   [{ x, y }]  data points, joined in the order given.
//   xLabel   title under the horizontal axis (e.g. "Time (hours)").
//   yLabel   title beside the vertical axis (e.g. "Height (cm)").
//   title    optional heading above the graph.
//   xMax     horizontal range (default: rounded up from the data).
//   yMax     vertical range (default: rounded up from the data).
//   xStep    spacing of x ticks (default: 1).
//   yStep    spacing of y ticks (default: a "nice" step giving ~5 ticks).

const { textWidthEm } = require('../text/comic-glyph-width');

const LINE_COLOUR  = '#C00000';   // red plotted line + points
const AXIS_COLOUR  = '#000000';
const GRID_COLOUR  = '#DDDDDD';
const TEXT_COLOUR  = '#000000';
const TITLE_COLOUR = '#1F4E79';   // house deep blue
const FONT = "'Comic Sans MS', 'Comic Sans', 'Comic Neue', sans-serif";

// ─── CONSTANTS (design units; a profile scales them so TICK_FS is its fontPt) ─
const TITLE_FS      = 36;
const AXIS_TITLE_FS = 30;   // rotated y-axis title / x-axis title
const TICK_FS       = 26;   // axis numbers

// With no depth set by the box (paper, the wall, the pack), the plot is this
// tall for its width: the shape the board's graphs take in a slide zone, where
// the plot measured 0.62 of its width (13 September 2026). A graph drawn wider
// is then a bigger graph, not a flatter one.
const PLOT_H_PER_W = 0.62;
const X_SLOT     = 82;    // width per x tick interval
const PLOT_W_MIN = 360;
const Y_NUM_W    = 54;    // room for the scale numbers left of the axis
const TITLE_GAP  = 18;
const PAD_TOP_NO_TITLE = 14;
const PAD_RIGHT  = 30;    // breathing room right of the last point
const LINE_W     = 5;
const POINT_R    = 8;
const AXIS_W     = 3;
const GRID_W     = 1.4;
const MARGIN     = LINE_W + 4;
// Axis numbers a line apart up the side, and a gap between neighbours along
// the bottom, or two readings print as one number.
const TICK_LEADING = 1.15;
const X_NUM_GAP = 0.5; // ems
// ─── END CONSTANTS ───────────────────────────────────────────────────────────

function f(n) { return Number(n).toFixed(2); }
function escapeXml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function round(v) { return Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : +Number(v).toFixed(1); }
function textW(s, fs, bold) { return textWidthEm(String(s == null ? '' : s), Boolean(bold)) * fs; }

function niceStep(raw) {
  if (!(raw > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}
function ceilTo(v, step) { return Math.ceil(v / step - 1e-9) * step; }

function resolveScale(data) {
  const points = (Array.isArray(data.points) ? data.points : [])
    .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  const dataXMax = points.reduce((m, p) => Math.max(m, p.x), 0);
  const dataYMax = points.reduce((m, p) => Math.max(m, p.y), 0);
  const xStep = Number.isFinite(data.xStep) && data.xStep > 0 ? data.xStep : 1;
  const yStep = Number.isFinite(data.yStep) && data.yStep > 0 ? data.yStep : niceStep(dataYMax / 5);
  const xMax = Number.isFinite(data.xMax) && data.xMax > 0 ? data.xMax : ceilTo(dataXMax, xStep) || xStep;
  const yMax = Number.isFinite(data.yMax) && data.yMax > 0 ? data.yMax : ceilTo(dataYMax, yStep) || yStep;
  return { points, xStep, yStep, xMax, yMax };
}

function ticks(max, step) {
  const out = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(round(v));
  return out;
}

function measureAt(data, sc, u, widthCap = null) {
  const title = data.title ? String(data.title) : '';
  const tickFs = TICK_FS * u;
  const axisFs = AXIS_TITLE_FS * u;
  const xs = ticks(sc.xMax, sc.xStep);
  const ys = ticks(sc.yMax, sc.yStep);
  const yNumW = Math.max(Y_NUM_W * u, Math.max(...ys.map((v) => textW(v, tickFs))) + 12 * u);
  const yTitleW = data.yLabel ? axisFs + 12 * u : 0;
  const padLeft = yTitleW + yNumW;
  // A title wider than the box is set smaller on its own; it never pulls the
  // axis numbers down with it.
  let titleFs = TITLE_FS * u;
  if (title && widthCap) titleFs = Math.min(titleFs, (widthCap - 2 * MARGIN * u) / textWidthEm(title, true));
  // The top scale number is centred on the top gridline, so half of it stands
  // above the plot and needs its room under the title.
  const padTop = title ? titleFs + TITLE_GAP * u + tickFs * 0.5 : Math.max(PAD_TOP_NO_TITLE * u, tickFs * 0.6);
  const xNumH = tickFs + 12 * u;
  const xTitleH = data.xLabel ? axisFs + 12 * u : 0;
  const xTicks = Math.max(1, Math.round(sc.xMax / sc.xStep));
  // The widest x number with its gap, per tick interval: less and they touch.
  const xNumSpan = Math.max(...xs.map((v) => textW(v, tickFs))) + X_NUM_GAP * tickFs;
  const plotW = Math.max(PLOT_W_MIN * u, xTicks * X_SLOT * u, xTicks * xNumSpan);
  const titleW = title ? textW(title, titleFs, true) : 0;
  const margin = MARGIN * u;
  const naturalW = Math.max(padLeft + plotW + PAD_RIGHT * u, titleW) + 2 * margin;
  const minPlotW = xTicks * xNumSpan;
  return { u, title, titleFs, tickFs, axisFs, xs, ys, padLeft, padTop, xNumH, xTitleH, plotW, minPlotW, titleW, margin, naturalW, xTicks };
}

function layout(data, profile) {
  const sc = resolveScale(data);
  if (!profile || !(profile.widthPt > 0)) {
    throw new Error('LINE_GRAPH_NO_PROFILE: a line graph is laid out at the size it prints, so it needs the surface profile and width it will print at (shared/visuals/surface-profiles.js).');
  }
  if (!sc.points.length) {
    throw new Error('LINE_GRAPH_EMPTY: a line graph needs at least one point with a numeric x and y; nothing was drawn in its place.');
  }
  const W = profile.widthPt;
  const floorU = profile.minFontPt / TICK_FS;
  let u = profile.fontPt / TICK_FS;
  // A surface that grows its drawings into spare room (`grow`) lets the words
  // grow with a graph given more width than it needs, up to that factor and
  // never below the profile's own size. Where the box sets the depth (the
  // board) the depth decides instead, as it always has.
  const grow = profile.heightPt ? 1 : Math.max(1, profile.grow || 1);
  if (grow > 1) u *= Math.min(grow, Math.max(1, W / measureAt(data, sc, u, W).naturalW));
  const fixedW = (mm) => mm.padLeft + PAD_RIGHT * mm.u + 2 * mm.margin;
  const fitsAcross = (mm) => fixedW(mm) + mm.minPlotW <= W;
  let m = measureAt(data, sc, u, W);
  while (!fitsAcross(m) && u > floorU) { u = Math.max(floorU, u - 0.01); m = measureAt(data, sc, u, W); }
  if (!fitsAcross(m)) {
    throw new Error(
      `LINE_GRAPH_TOO_NARROW: ${m.xTicks} intervals along the bottom cannot be numbered at the ${profile.minFontPt}pt readable minimum ` +
        'in a space this narrow. Give the graph more width, or use a larger xStep; nothing was shrunk past readable.'
    );
  }
  if (m.title && m.titleFs < profile.minFontPt) {
    throw new Error(`LINE_GRAPH_TITLE_TOO_LONG: the title ${JSON.stringify(m.title)} cannot fit across this graph at the ${profile.minFontPt}pt readable minimum. Shorten it; it was not cut.`);
  }
  const bands = (mm) => mm.padTop + mm.xNumH + mm.xTitleH + 2 * mm.margin;
  const need = (mm) => Math.max((mm.ys.length - 1) * mm.tickFs * TICK_LEADING, 3 * mm.tickFs);
  let plotH;
  if (profile.heightPt) {
    plotH = profile.heightPt - bands(m);
    while (plotH < need(m) && u > floorU) {
      u = Math.max(floorU, u - 0.02);
      m = measureAt(data, sc, u, W);
      plotH = profile.heightPt - bands(m);
    }
    if (plotH < need(m)) {
      throw new Error(
        `LINE_GRAPH_ZONE_TOO_SMALL: after its title and axis titles this graph has ${Math.max(0, plotH / 72).toFixed(2)}in left for a scale of ` +
          `${m.ys.length - 1} lines, which cannot be numbered at the ${profile.minFontPt}pt readable minimum. Give it a larger zone, ` +
          'drop the title, or use a larger yStep; nothing was drawn in its place.'
      );
    }
  } else {
    plotH = Math.max((W - fixedW(m)) * PLOT_H_PER_W, need(m));
  }
  return { sc, m, W, plotW: W - fixedW(m), plotH };
}

function draw(data, L) {
  const { sc, m, W, plotW, plotH } = L;
  const { points, xStep, yStep, xMax, yMax } = sc;
  const u = m.u;
  const w = W;
  const h = m.padTop + plotH + m.xNumH + m.xTitleH + 2 * m.margin;
  const OX = m.margin, OY = m.margin;
  const contentW = W - 2 * m.margin;
  const baseW = m.padLeft + plotW + PAD_RIGHT * u;
  const extra = Math.max(0, contentW - baseW);

  const plotLeft = OX + m.padLeft + extra / 2;
  const plotTop = OY + m.padTop;
  const plotBottom = plotTop + plotH;
  const plotRight = plotLeft + plotW;

  const px = (v) => plotLeft + (v / xMax) * plotW;
  const py = (v) => plotBottom - (v / yMax) * plotH;
  const pct = (x, y) => [Number((100 * x / w).toFixed(2)), Number((100 * y / h).toFixed(2))];
  const text = (x, y, str, fs, attrs) =>
    `<text x="${f(x)}" y="${f(y)}" font-family="${FONT}" font-size="${f(fs)}" ${attrs}>${escapeXml(str)}</text>`;

  const anchors = { title: null, yAxis: null, xAxis: null, line: null, point: null, rows: {} };
  const parts = [];

  if (m.title) {
    parts.push(text(OX + contentW / 2, OY + m.titleFs * 0.82, m.title, m.titleFs, `text-anchor="middle" font-weight="bold" fill="${TITLE_COLOUR}"`));
    anchors.title = pct(OX + contentW / 2, OY + m.titleFs * 0.45);
  }

  // Gridlines behind everything, so the plotted points stay readable.
  for (let v = 0; v <= xMax + 1e-9; v += xStep) {
    parts.push(`<line x1="${f(px(v))}" y1="${f(plotTop)}" x2="${f(px(v))}" y2="${f(plotBottom)}" stroke="${GRID_COLOUR}" stroke-width="${f(GRID_W * u)}"/>`);
  }
  for (let v = 0; v <= yMax + 1e-9; v += yStep) {
    parts.push(`<line x1="${f(plotLeft)}" y1="${f(py(v))}" x2="${f(plotRight)}" y2="${f(py(v))}" stroke="${GRID_COLOUR}" stroke-width="${f(GRID_W * u)}"/>`);
  }

  // Axes.
  parts.push(`<line x1="${f(plotLeft)}" y1="${f(plotTop)}" x2="${f(plotLeft)}" y2="${f(plotBottom)}" stroke="${AXIS_COLOUR}" stroke-width="${f(AXIS_W * u)}"/>`);
  parts.push(`<line x1="${f(plotLeft)}" y1="${f(plotBottom)}" x2="${f(plotRight)}" y2="${f(plotBottom)}" stroke="${AXIS_COLOUR}" stroke-width="${f(AXIS_W * u)}"/>`);

  // Tick numbers.
  for (let v = 0; v <= xMax + 1e-9; v += xStep) {
    parts.push(text(px(v), plotBottom + m.tickFs + 2 * u, round(v), m.tickFs, `text-anchor="middle" fill="${TEXT_COLOUR}"`));
  }
  for (let v = 0; v <= yMax + 1e-9; v += yStep) {
    parts.push(text(plotLeft - 12 * u, py(v), round(v), m.tickFs, `text-anchor="end" dominant-baseline="central" fill="${TEXT_COLOUR}"`));
  }

  // Axis titles.
  if (data.xLabel) {
    parts.push(text(plotLeft + plotW / 2, plotBottom + m.xNumH + m.axisFs * 0.72, data.xLabel, m.axisFs, `text-anchor="middle" font-weight="bold" fill="${TEXT_COLOUR}"`));
  }
  if (data.yLabel) {
    const yx = plotLeft - m.padLeft + m.axisFs * 0.72;
    const yy = plotTop + plotH / 2;
    parts.push(text(yx, yy, data.yLabel, m.axisFs, `text-anchor="middle" font-weight="bold" fill="${TEXT_COLOUR}" transform="rotate(-90, ${f(yx)}, ${f(yy)})"`));
  }

  // Plotted line, then the points on top.
  if (points.length >= 2) {
    const d = points.map((p) => `${f(px(p.x))},${f(py(p.y))}`).join(' ');
    parts.push(`<polyline points="${d}" fill="none" stroke="${LINE_COLOUR}" stroke-width="${f(LINE_W * u)}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  points.forEach((p) => {
    parts.push(`<circle cx="${f(px(p.x))}" cy="${f(py(p.y))}" r="${f(POINT_R * u)}" fill="${LINE_COLOUR}"/>`);
    anchors.rows[String(round(p.x))] = pct(px(p.x), py(p.y));
  });

  // Named anchors for the anatomy poster.
  anchors.yAxis = pct(plotLeft - Y_NUM_W * u * 0.5, plotTop + plotH * 0.5);
  anchors.xAxis = pct(plotLeft + plotW * 0.5, plotBottom + m.xNumH * 0.5);
  if (points.length) {
    const midIdx = Math.floor((points.length - 1) / 2);
    const mid = points[midIdx];
    anchors.point = pct(px(mid.x), py(mid.y));
    // The "line" anchor sits on the segment leaving the midpoint, so the leader
    // lands on the line itself rather than on a dot.
    const nxt = points[Math.min(midIdx + 1, points.length - 1)];
    anchors.line = pct((px(mid.x) + px(nxt.x)) / 2, (py(mid.y) + py(nxt.y)) / 2);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h, anchors };
}

function tightSvg(data = {}, profile) {
  return draw(data, layout(data, profile));
}

function cacheKey(data = {}, profile) {
  const { points, xStep, yStep, xMax, yMax } = resolveScale(data);
  const pts = points.map((p) => `${p.x},${p.y}`).join(';');
  const box = `:${profile.surface}:${f(profile.widthPt)}x${profile.heightPt ? f(profile.heightPt) : '-'}`;
  return `line-graph${box}:${data.title || ''}:${data.xLabel || ''}:${data.yLabel || ''}:${pts}:${xStep}:${yStep}:${xMax}:${yMax}`;
}

module.exports = { tightSvg, cacheKey };
