'use strict';

// SHARED bar-chart geometry — a UK primary bar chart: a y-axis carrying a numbered
// scale with horizontal gridlines, house-blue bars rising from a category x-axis.
// House-blue bars, grey gridlines and Comic Sans keep the bar chart visually
// consistent across the board, paper and working wall.
//
//   tightSvg(spec) → { svg, aspect, w, h, anchors }   cropped tight to the chart
//   cacheKey(spec) → string                           stable pre-render cache key
//
// The `anchors` map names the parts a "read a bar chart" anatomy poster points at:
//   title     the chart heading
//   scale     the numbered y-axis (the "each line is worth N" part children misread)
//   gridline  a representative horizontal gridline, out at the right where it is clear
//   rows      one entry per category, at the TOP of that bar (a read-off callout)
// Consumed by the working wall's labelledDiagram card via the shared label-diagram
// overlay, exactly as the pictogram's anchors are.
//
// Spec:
//   title        optional heading above the chart.
//   categories   array of x-axis category-label strings.
//   values       array of numbers, one per category (same length).
//   y_max        top of the scale (default: rounded up from the largest value).
//   y_interval   spacing between scale lines/labels (default 1).

const BAR_FILL     = '#2E74B5';   // house blue
const BAR_STROKE   = '#1F4E79';   // house deep blue
const AXIS_COLOUR  = '#000000';
const GRID_COLOUR  = '#DDDDDD';
const TEXT_COLOUR  = '#000000';
const TITLE_COLOUR = '#1F4E79';

const TITLE_FS = 36;
const LABEL_FS = 28;   // category labels
const TICK_FS  = 28;   // y-axis numbers

const PLOT_H     = 460;   // height of the plotting area
const SLOT_W_MIN = 110;   // minimum width per category column
const BAR_FRAC   = 0.6;   // bar width as a fraction of its slot
const BAR_W_MAX  = 84;    // cap so a wide (label-driven) column doesn't fatten the bar
const TITLE_GAP  = 18;
const Y_TICK_W   = 56;    // room for the scale numbers left of the axis
const X_CAT_H    = LABEL_FS + 18;
const PAD_RIGHT  = 26;
const PAD_TOP_NO_TITLE = 14;
const STROKE_W   = 2.5;
const MARGIN     = STROKE_W + 3;

const CHAR_W = 0.60;

function f(n) { return Number(n).toFixed(2); }
function escapeXml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function resolveScale(data) {
  const values = Array.isArray(data.values) ? data.values.map(Number) : [];
  const interval = Number(data.y_interval) > 0 ? Number(data.y_interval) : 1;
  const max = Number.isFinite(Number(data.y_max)) && Number(data.y_max) > 0
    ? Number(data.y_max)
    : Math.ceil((Math.max(0, ...values)) / interval) * interval || interval;
  return { interval, max };
}

function tightSvg(data) {
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const values = Array.isArray(data.values) ? data.values.map(Number) : [];
  const title = data.title || '';
  const { interval, max } = resolveScale(data);

  const padTop = title ? TITLE_FS + TITLE_GAP : PAD_TOP_NO_TITLE;
  const padLeft = Y_TICK_W;
  const padBottom = X_CAT_H;

  // The column widens to fit the longest category label so labels never run
  // together; the bar keeps a sensible width inside a wide column.
  let maxCatW = 0;
  for (const c of categories) maxCatW = Math.max(maxCatW, String(c).length * LABEL_FS * CHAR_W);
  const slotW = Math.max(SLOT_W_MIN, maxCatW + 18);
  const barW = Math.min(slotW * BAR_FRAC, BAR_W_MAX);
  const plotW = Math.max(slotW, categories.length * slotW);

  // The canvas widens to hold a long chart title, with the plot centred in it.
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

  const yFor = (v) => plotBottom - (v / max) * PLOT_H;

  const pct = (x, y) => [Number((100 * x / w).toFixed(2)), Number((100 * y / h).toFixed(2))];
  const anchors = { title: null, scale: null, gridline: null, rows: {} };

  const parts = [];

  if (title) {
    parts.push(`<text x="${f(OX + contentW / 2)}" y="${f(OY + TITLE_FS * 0.82)}" text-anchor="middle" font-family="Comic Sans MS" font-size="${TITLE_FS}" font-weight="bold" fill="${TITLE_COLOUR}">${escapeXml(title)}</text>`);
    anchors.title = pct(OX + contentW / 2, OY + TITLE_FS * 0.45);
  }

  // Gridlines + scale numbers.
  const steps = Math.round(max / interval);
  let midGridY = null;
  for (let i = 0; i <= steps; i++) {
    const v = i * interval;
    const y = yFor(v);
    if (i > 0) {
      parts.push(`<line x1="${f(plotLeft)}" y1="${f(y)}" x2="${f(plotLeft + plotW)}" y2="${f(y)}" stroke="${GRID_COLOUR}" stroke-width="1.4"/>`);
    }
    parts.push(`<line x1="${f(plotLeft - 7)}" y1="${f(y)}" x2="${f(plotLeft)}" y2="${f(y)}" stroke="${AXIS_COLOUR}" stroke-width="1.8"/>`);
    parts.push(`<text x="${f(plotLeft - 12)}" y="${f(y)}" text-anchor="end" dominant-baseline="central" font-family="Comic Sans MS" font-size="${TICK_FS}" fill="${TEXT_COLOUR}">${v}</text>`);
    if (midGridY === null && v >= max / 2) midGridY = y;
  }
  // The scale anchor points at the numbers up the y-axis; the gridline anchor at
  // the clear right end of a mid gridline.
  anchors.scale = pct(plotLeft - Y_TICK_W * 0.45, plotTop + PLOT_H * 0.5);
  anchors.gridline = pct(plotLeft + plotW * 0.92, midGridY != null ? midGridY : plotTop + PLOT_H * 0.4);

  // Axes.
  parts.push(`<line x1="${f(plotLeft)}" y1="${f(plotTop)}" x2="${f(plotLeft)}" y2="${f(plotBottom)}" stroke="${AXIS_COLOUR}" stroke-width="${STROKE_W}"/>`);
  parts.push(`<line x1="${f(plotLeft)}" y1="${f(plotBottom)}" x2="${f(plotLeft + plotW)}" y2="${f(plotBottom)}" stroke="${AXIS_COLOUR}" stroke-width="${STROKE_W}"/>`);

  // Bars + category labels.
  const barOffset = (slotW - barW) / 2;
  for (let i = 0; i < categories.length; i++) {
    const v = Number(values[i]) || 0;
    const by = yFor(v);
    const bx = plotLeft + i * slotW + barOffset;
    const bh = plotBottom - by;
    parts.push(`<rect x="${f(bx)}" y="${f(by)}" width="${f(barW)}" height="${f(bh)}" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="${STROKE_W}"/>`);
    const cx = plotLeft + i * slotW + slotW / 2;
    parts.push(`<text x="${f(cx)}" y="${f(plotBottom + LABEL_FS)}" text-anchor="middle" dominant-baseline="alphabetic" font-family="Comic Sans MS" font-size="${LABEL_FS}" fill="${TEXT_COLOUR}">${escapeXml(categories[i])}</text>`);
    anchors.rows[categories[i]] = pct(cx, by);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h, anchors };
}

function cacheKey(data) {
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const values = Array.isArray(data.values) ? data.values : [];
  const { interval, max } = resolveScale(data);
  return `bar-chart:${data.title || ''}:${categories.join(',')}:${values.join(',')}:${interval}:${max}`;
}

// Compact construction cue. Scale values and category labels belong to the
// question; the action that survives inline is drawing equal-width bars from a
// common baseline.
function barsCueSvg() {
  const w = 190, h = 160;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><line x1="24" y1="12" x2="24" y2="142" stroke="${AXIS_COLOUR}" stroke-width="7"/><line x1="24" y1="142" x2="180" y2="142" stroke="${AXIS_COLOUR}" stroke-width="7"/><rect x="42" y="84" width="28" height="58" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="5"/><rect x="86" y="35" width="28" height="107" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="5"/><rect x="130" y="62" width="28" height="80" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="5"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, barsCueSvg, cacheKey };
