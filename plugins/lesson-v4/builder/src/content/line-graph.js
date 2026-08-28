'use strict';

// A line graph with numbered, titled axes and plotted points joined in order —
// the kind a child reads a value off ("what was the height at hour 3?") or reads
// an interval from ("how long to fall from 16cm to 3cm?"). Axes start at the
// origin; gridlines sit behind the plotted line so points stay readable.
//
// Spec:
//   points  [{ x, y }]  data points (joined in the order given)
//   xLabel  title under the horizontal axis (e.g. "Time (hours)")
//   yLabel  title beside the vertical axis (e.g. "Height (cm)")
//   xMax    horizontal range (default: rounded up from the data)
//   yMax    vertical range (default: rounded up from the data)
//   xStep   spacing of x ticks (default: 1)
//   yStep   spacing of y ticks (default: a "nice" step giving ~5 ticks)

const { FONT, COLOURS, FIT } = require('../styles');
const { polyline, rule, dot } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.12;   // zone inner padding (inches)
const Y_TITLE_W    = 0.28;   // rotated y-axis title column
const Y_NUM_W      = 0.40;   // y tick-number column
const X_TITLE_H    = 0.32;   // x-axis title band
const X_NUM_H      = 0.28;   // x tick-number band
const TOP_PAD      = 0.14;   // breathing room above the plot
const RIGHT_PAD    = 0.16;   // breathing room right of the plot
const GRID_COLOUR  = COLOURS.gridLine;
const GRID_PT      = 0.008;
const AXIS_COLOUR  = '333333';
const AXIS_PT      = 0.022;
const NUM_FONT     = 11;
const TITLE_FONT   = 13;
const LINE_COLOUR  = 'C00000';   // red plotted line
const LINE_PT      = 2.5;
const POINT_R      = 0.05;
// ─── END CONSTANTS ────────────────────────────────────────────

function niceStep(raw) {
  if (!(raw > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}
function ceilTo(v, step) { return Math.ceil(v / step - 1e-9) * step; }

function drawLineGraph(pptx, slide, zone, data) {
  const points = (Array.isArray(data.points) ? data.points : [])
    .filter(function (p) { return Number.isFinite(p.x) && Number.isFinite(p.y); });

  const dataXMax = points.reduce(function (m, p) { return Math.max(m, p.x); }, 0);
  const dataYMax = points.reduce(function (m, p) { return Math.max(m, p.y); }, 0);
  const xStep = Number.isFinite(data.xStep) && data.xStep > 0 ? data.xStep : 1;
  const yStep = Number.isFinite(data.yStep) && data.yStep > 0 ? data.yStep : niceStep(dataYMax / 5);
  const xMax  = Number.isFinite(data.xMax) && data.xMax > 0 ? data.xMax : ceilTo(dataXMax, xStep) || xStep;
  const yMax  = Number.isFinite(data.yMax) && data.yMax > 0 ? data.yMax : ceilTo(dataYMax, yStep) || yStep;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  const plotLeft   = innerX + Y_TITLE_W + Y_NUM_W;
  const plotRight  = innerX + innerW - RIGHT_PAD;
  const plotTop    = innerY + TOP_PAD;
  const plotBottom = innerY + innerH - X_TITLE_H - X_NUM_H;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const px = function (v) { return plotLeft + (v / xMax) * plotW; };
  const py = function (v) { return plotBottom - (v / yMax) * plotH; };

  // Gridlines.
  for (let v = 0; v <= xMax + 1e-9; v += xStep) rule(pptx, slide, px(v), plotTop, px(v), plotBottom, GRID_COLOUR, GRID_PT);
  for (let v = 0; v <= yMax + 1e-9; v += yStep) rule(pptx, slide, plotLeft, py(v), plotRight, py(v), GRID_COLOUR, GRID_PT);

  // Axes.
  rule(pptx, slide, plotLeft, plotBottom, plotRight, plotBottom, AXIS_COLOUR, AXIS_PT);
  rule(pptx, slide, plotLeft, plotTop, plotLeft, plotBottom, AXIS_COLOUR, AXIS_PT);

  // Tick numbers.
  for (let v = 0; v <= xMax + 1e-9; v += xStep) {
    slide.addText(String(round(v)), {
      x: px(v) - 0.35, y: plotBottom + 0.02, w: 0.70, h: X_NUM_H - 0.02,
      fontFace: FONT, fontSize: NUM_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'top', margin: 0, objectName: 'NOFIT_lg-xnum'
    });
  }
  for (let v = 0; v <= yMax + 1e-9; v += yStep) {
    slide.addText(String(round(v)), {
      x: innerX + Y_TITLE_W, y: py(v) - 0.14, w: Y_NUM_W - 0.05, h: 0.28,
      fontFace: FONT, fontSize: NUM_FONT, bold: true, color: COLOURS.body,
      align: 'right', valign: 'middle', margin: 0, objectName: 'NOFIT_lg-ynum'
    });
  }

  // Axis titles.
  if (data.xLabel) {
    slide.addText(String(data.xLabel), {
      x: plotLeft, y: innerY + innerH - X_TITLE_H, w: plotW, h: X_TITLE_H,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
  if (data.yLabel) {
    slide.addText(String(data.yLabel), {
      x: innerX - (plotH / 2) + (Y_TITLE_W / 2), y: plotTop + plotH / 2 - (Y_TITLE_W / 2),
      w: plotH, h: Y_TITLE_W,
      rotate: 270,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }

  // Plotted line then points (points on top).
  if (points.length >= 2) {
    polyline(pptx, slide, points.map(function (p) { return { x: px(p.x), y: py(p.y) }; }),
      { lineColour: LINE_COLOUR, lineColor: LINE_COLOUR, width: LINE_PT });
  }
  points.forEach(function (p) { dot(pptx, slide, px(p.x), py(p.y), POINT_R, LINE_COLOUR); });
}

function round(v) { return Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : +v.toFixed(1); }

module.exports = { drawLineGraph };
