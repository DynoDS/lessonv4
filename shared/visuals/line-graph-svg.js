'use strict';

// SHARED line-graph geometry — a titled time-series graph: numbered, labelled x
// and y axes, points plotted at their readings and joined in order by a red line,
// with horizontal + vertical gridlines a child reads a value off. The visual
// language matches the slide helper builder/src/content/line-graph.js (red line
// and points, grey gridlines, Comic Sans, a scaled y-axis), so a line graph on
// the board, on paper and on the wall reads as one and the same figure.
//
//   tightSvg(spec) → { svg, aspect, w, h, anchors }   cropped tight to the graph
//   cacheKey(spec) → string                           stable pre-render cache key
//
// The `anchors` map names the parts a "read a line graph" anatomy poster points at:
//   title    the graph heading
//   yAxis    the numbered vertical scale (the values, read up the side)
//   xAxis    the numbered horizontal axis (usually time, read along the bottom)
//   line     a point on the plotted line itself (the trend children describe)
//   point    a representative plotted reading (a dot on the line)
//   rows     one entry per plotted point, keyed by its x value, AT that dot — so a
//            worked read-off callout ("at 3 hours it was 12 cm") points at the dot.
// Consumed by the working wall's labelledDiagram card via the shared label-diagram
// overlay, exactly as the bar chart's and pictogram's anchors are.
//
// Spec (identical field names to the slide helper, so a wall/worksheet spec is the
// slide's content object copied field-for-field):
//   points   [{ x, y }]  data points, joined in the order given.
//   xLabel   title under the horizontal axis (e.g. "Time (hours)").
//   yLabel   title beside the vertical axis (e.g. "Height (cm)").
//   title    optional heading above the graph (for the wall anatomy poster).
//   xMax     horizontal range (default: rounded up from the data).
//   yMax     vertical range (default: rounded up from the data).
//   xStep    spacing of x ticks (default: 1).
//   yStep    spacing of y ticks (default: a "nice" step giving ~5 ticks).

const LINE_COLOUR  = '#C00000';   // red plotted line + points (matches the slide)
const AXIS_COLOUR  = '#000000';
const GRID_COLOUR  = '#DDDDDD';
const TEXT_COLOUR  = '#000000';
const TITLE_COLOUR = '#1F4E79';   // house deep blue

const TITLE_FS      = 36;
const AXIS_TITLE_FS = 30;   // rotated y-axis title / x-axis title
const TICK_FS       = 26;   // axis numbers

const PLOT_H     = 460;   // height of the plotting area
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

const CHAR_W = 0.60;

function f(n) { return Number(n).toFixed(2); }
function escapeXml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function round(v) { return Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : +Number(v).toFixed(1); }

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
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const dataXMax = points.reduce((m, p) => Math.max(m, p.x), 0);
  const dataYMax = points.reduce((m, p) => Math.max(m, p.y), 0);
  const xStep = Number.isFinite(data.xStep) && data.xStep > 0 ? data.xStep : 1;
  const yStep = Number.isFinite(data.yStep) && data.yStep > 0 ? data.yStep : niceStep(dataYMax / 5);
  const xMax = Number.isFinite(data.xMax) && data.xMax > 0 ? data.xMax : ceilTo(dataXMax, xStep) || xStep;
  const yMax = Number.isFinite(data.yMax) && data.yMax > 0 ? data.yMax : ceilTo(dataYMax, yStep) || yStep;
  return { points, xStep, yStep, xMax, yMax };
}

function tightSvg(data) {
  const title = data.title || '';
  const { points, xStep, yStep, xMax, yMax } = resolveScale(data);

  const padTop = title ? TITLE_FS + TITLE_GAP : PAD_TOP_NO_TITLE;
  const yTitleW = data.yLabel ? AXIS_TITLE_FS + 12 : 0;
  const padLeft = yTitleW + Y_NUM_W;
  const xNumH = TICK_FS + 12;
  const xTitleH = data.xLabel ? AXIS_TITLE_FS + 12 : 0;
  const padBottom = xNumH + xTitleH;

  const xTicks = Math.max(1, Math.round(xMax / xStep));
  const plotW = Math.max(PLOT_W_MIN, xTicks * X_SLOT);

  // The canvas widens to hold a long title, with the plot centred beneath it.
  const baseW = padLeft + plotW + PAD_RIGHT;
  const titleW = title ? String(title).length * TITLE_FS * CHAR_W : 0;
  const contentW = Math.max(baseW, titleW);
  const extra = contentW - baseW;

  const contentH = padTop + PLOT_H + padBottom;
  const w = contentW + 2 * MARGIN;
  const h = contentH + 2 * MARGIN;
  const OX = MARGIN, OY = MARGIN;

  const plotLeft = OX + padLeft + extra / 2;
  const plotTop = OY + padTop;
  const plotBottom = plotTop + PLOT_H;
  const plotRight = plotLeft + plotW;

  const px = (v) => plotLeft + (v / xMax) * plotW;
  const py = (v) => plotBottom - (v / yMax) * PLOT_H;
  const pct = (x, y) => [Number((100 * x / w).toFixed(2)), Number((100 * y / h).toFixed(2))];

  const anchors = { title: null, yAxis: null, xAxis: null, line: null, point: null, rows: {} };
  const parts = [];

  if (title) {
    parts.push(`<text x="${f(OX + contentW / 2)}" y="${f(OY + TITLE_FS * 0.82)}" text-anchor="middle" font-family="Comic Sans MS" font-size="${TITLE_FS}" font-weight="bold" fill="${TITLE_COLOUR}">${escapeXml(title)}</text>`);
    anchors.title = pct(OX + contentW / 2, OY + TITLE_FS * 0.45);
  }

  // Gridlines.
  for (let v = 0; v <= xMax + 1e-9; v += xStep) {
    parts.push(`<line x1="${f(px(v))}" y1="${f(plotTop)}" x2="${f(px(v))}" y2="${f(plotBottom)}" stroke="${GRID_COLOUR}" stroke-width="${GRID_W}"/>`);
  }
  for (let v = 0; v <= yMax + 1e-9; v += yStep) {
    parts.push(`<line x1="${f(plotLeft)}" y1="${f(py(v))}" x2="${f(plotRight)}" y2="${f(py(v))}" stroke="${GRID_COLOUR}" stroke-width="${GRID_W}"/>`);
  }

  // Axes.
  parts.push(`<line x1="${f(plotLeft)}" y1="${f(plotTop)}" x2="${f(plotLeft)}" y2="${f(plotBottom)}" stroke="${AXIS_COLOUR}" stroke-width="${AXIS_W}"/>`);
  parts.push(`<line x1="${f(plotLeft)}" y1="${f(plotBottom)}" x2="${f(plotRight)}" y2="${f(plotBottom)}" stroke="${AXIS_COLOUR}" stroke-width="${AXIS_W}"/>`);

  // Tick numbers.
  for (let v = 0; v <= xMax + 1e-9; v += xStep) {
    parts.push(`<text x="${f(px(v))}" y="${f(plotBottom + TICK_FS + 2)}" text-anchor="middle" font-family="Comic Sans MS" font-size="${TICK_FS}" fill="${TEXT_COLOUR}">${round(v)}</text>`);
  }
  for (let v = 0; v <= yMax + 1e-9; v += yStep) {
    parts.push(`<text x="${f(plotLeft - 12)}" y="${f(py(v))}" text-anchor="end" dominant-baseline="central" font-family="Comic Sans MS" font-size="${TICK_FS}" fill="${TEXT_COLOUR}">${round(v)}</text>`);
  }

  // Axis titles.
  if (data.xLabel) {
    parts.push(`<text x="${f(plotLeft + plotW / 2)}" y="${f(plotBottom + xNumH + AXIS_TITLE_FS * 0.72)}" text-anchor="middle" font-family="Comic Sans MS" font-size="${AXIS_TITLE_FS}" font-weight="bold" fill="${TEXT_COLOUR}">${escapeXml(data.xLabel)}</text>`);
  }
  if (data.yLabel) {
    const yx = OX + AXIS_TITLE_FS * 0.72;
    const yy = plotTop + PLOT_H / 2;
    parts.push(`<text x="${f(yx)}" y="${f(yy)}" text-anchor="middle" font-family="Comic Sans MS" font-size="${AXIS_TITLE_FS}" font-weight="bold" fill="${TEXT_COLOUR}" transform="rotate(-90, ${f(yx)}, ${f(yy)})">${escapeXml(data.yLabel)}</text>`);
  }

  // Plotted line, then the points on top.
  if (points.length >= 2) {
    const d = points.map((p) => `${f(px(p.x))},${f(py(p.y))}`).join(' ');
    parts.push(`<polyline points="${d}" fill="none" stroke="${LINE_COLOUR}" stroke-width="${LINE_W}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  points.forEach((p) => {
    parts.push(`<circle cx="${f(px(p.x))}" cy="${f(py(p.y))}" r="${POINT_R}" fill="${LINE_COLOUR}"/>`);
    anchors.rows[String(round(p.x))] = pct(px(p.x), py(p.y));
  });

  // Named anchors for the anatomy poster.
  anchors.yAxis = pct(plotLeft - Y_NUM_W * 0.5, plotTop + PLOT_H * 0.5);
  anchors.xAxis = pct(plotLeft + plotW * 0.5, plotBottom + xNumH * 0.5);
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

function cacheKey(data) {
  const { points, xStep, yStep, xMax, yMax } = resolveScale(data);
  const pts = points.map((p) => `${p.x},${p.y}`).join(';');
  return `line-graph:${data.title || ''}:${data.xLabel || ''}:${data.yLabel || ''}:${pts}:${xStep}:${yStep}:${xMax}:${yMax}`;
}

module.exports = { tightSvg, cacheKey };
