'use strict';

// A bar chart with labelled axes and a clearly numbered y-axis scale — the
// canonical statistics visual for UK primary data-handling lessons. The y-axis
// interval is ALWAYS taken from the spec; it never defaults to 1, because the
// entire point of a bar chart lesson in Year 4 is learning to read non-unit
// scales. If y_interval is omitted, a "nice" step is derived from the data.
//
// Spec:
//   title        optional chart title above the plot.
//   categories   array of x-axis category labels.
//   values       array of numeric values (same length as categories).
//   y_max        top of y-axis (default: rounded up from max value using y_interval).
//   y_interval   spacing between y-axis ticks/gridlines (default: derived from data).
//   y_label      optional y-axis title (rotated, on the left).
//   x_label      optional x-axis title (centred, below categories).

const { FONT, COLOURS } = require('../styles');
const { rule } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD         = 0.12;   // zone inner padding (inches)
const Y_TITLE_W   = 0.28;   // rotated y-axis title column
const Y_NUM_W     = 0.42;   // y tick-number column
const X_TITLE_H   = 0.30;   // x-axis title band
const X_CAT_H     = 0.34;   // category label band
const TOP_PAD     = 0.18;   // breathing room above the tallest bar
const RIGHT_PAD   = 0.14;   // breathing room right of the last bar
const GRID_COLOUR = COLOURS.gridLine;
const GRID_T      = 0.008;  // gridline thickness (inches)
const AXIS_COLOUR = '333333';
const AXIS_T      = 0.022;  // axis line thickness (inches)
const BAR_COLOUR  = '2E74B5';   // school blue
const NUM_FONT    = 11;
const TITLE_FONT  = 12;
const BAR_GAP     = 0.55;   // fraction of slot width that is gap on each side
// ─── END CONSTANTS ────────────────────────────────────────────

function niceInterval(dataMax) {
  if (dataMax <= 0) return 1;
  const rough = dataMax / 5;
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100];
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] >= rough) return candidates[i];
  }
  return Math.ceil(rough / 10) * 10;
}

function drawBarChart(pptx, slide, zone, data) {
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const values     = Array.isArray(data.values)     ? data.values     : [];
  const n          = Math.min(categories.length, values.length);
  if (n === 0) return;

  const dataMax    = values.reduce(function (m, v) { return Math.max(m, v); }, 0);
  const yInterval  = (Number.isFinite(data.y_interval) && data.y_interval > 0)
    ? data.y_interval
    : niceInterval(dataMax);
  const yMax       = (Number.isFinite(data.y_max) && data.y_max > 0)
    ? data.y_max
    : Math.ceil(dataMax / yInterval + 1e-9) * yInterval;

  const hasYLabel  = data.y_label && String(data.y_label).trim();
  const hasXLabel  = data.x_label && String(data.x_label).trim();
  const hasTitle   = data.title   && String(data.title).trim();

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  const titleH  = hasTitle  ? TITLE_FONT * 0.015 + 0.18 : 0;
  const xTitleH = hasXLabel ? X_TITLE_H : 0;
  const yTitleW = hasYLabel ? Y_TITLE_W : 0;

  const plotLeft   = innerX + yTitleW + Y_NUM_W;
  const plotRight  = innerX + innerW - RIGHT_PAD;
  const plotTop    = innerY + titleH + TOP_PAD;
  const plotBottom = innerY + innerH - X_CAT_H - xTitleH;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  // A chart with no room for its bars used to draw nothing and say nothing: a
  // vocabulary card printed an empty white strip where the chart belonged.
  if (plotW <= 0.1 || plotH <= 0.1) {
    throw new Error(
      `BAR_CHART_ZONE_TOO_SMALL: after its title, axis labels and category names this chart has ` +
        `${Math.max(0, plotW).toFixed(2)}in by ${Math.max(0, plotH).toFixed(2)}in left for its bars. ` +
        `Give it a larger zone or drop the title; nothing was drawn in its place.`
    );
  }

  // Chart title
  if (hasTitle) {
    slide.addText(String(data.title), {
      x: plotLeft, y: innerY, w: plotW, h: titleH,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      objectName: 'NOFIT_bc-title'
    });
  }

  // Horizontal gridlines + y-axis tick numbers
  const ySteps = Math.round(yMax / yInterval);
  for (let i = 0; i <= ySteps; i++) {
    const v  = i * yInterval;
    const py = plotBottom - (v / yMax) * plotH;
    // Gridline (not at zero — the axis itself marks that)
    if (i > 0) {
      rule(pptx, slide, plotLeft, py, plotRight, py, GRID_COLOUR, GRID_T);
    }
    // Tick mark on y-axis
    rule(pptx, slide, plotLeft - 0.06, py, plotLeft, py, AXIS_COLOUR, GRID_T);
    // Tick number
    slide.addText(String(v), {
      x: innerX + yTitleW, y: py - 0.14, w: Y_NUM_W - 0.06, h: 0.28,
      fontFace: FONT, fontSize: NUM_FONT, bold: true, color: COLOURS.body,
      align: 'right', valign: 'middle', margin: 0,
      objectName: 'NOFIT_bc-ynum'
    });
  }

  // Axes
  rule(pptx, slide, plotLeft, plotBottom, plotRight, plotBottom, AXIS_COLOUR, AXIS_T); // x
  rule(pptx, slide, plotLeft, plotTop,    plotLeft,  plotBottom, AXIS_COLOUR, AXIS_T); // y

  // Bars and x-axis category labels
  const slotW  = plotW / n;
  const barW   = slotW * (1 - BAR_GAP);
  const barOff = (slotW - barW) / 2;
  for (let i = 0; i < n; i++) {
    const v   = values[i];
    const bh  = (v / yMax) * plotH;
    const bx  = plotLeft + i * slotW + barOff;
    const by  = plotBottom - bh;
    if (bh > 0.005) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: bx, y: by, w: barW, h: bh,
        fill: { color: BAR_COLOUR },
        line: { color: '1F4E79', width: 0.8 }
      });
    }
    // Category label centred under its slot
    const cx = plotLeft + i * slotW + slotW / 2;
    slide.addText(String(categories[i]), {
      x: cx - slotW * 0.5, y: plotBottom + 0.04, w: slotW, h: X_CAT_H - 0.06,
      fontFace: FONT, fontSize: NUM_FONT, bold: false, color: COLOURS.body,
      align: 'center', valign: 'top', margin: 0,
      objectName: 'NOFIT_bc-cat'
    });
  }

  // Y-axis title (rotated)
  if (hasYLabel) {
    slide.addText(String(data.y_label), {
      x: innerX - (plotH / 2) + (Y_TITLE_W / 2),
      y: plotTop + plotH / 2 - (Y_TITLE_W / 2),
      w: plotH, h: Y_TITLE_W,
      rotate: 270,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      objectName: 'NOFIT_bc-ylabel'
    });
  }

  // X-axis title
  if (hasXLabel) {
    slide.addText(String(data.x_label), {
      x: plotLeft, y: innerY + innerH - xTitleH, w: plotW, h: xTitleH,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      objectName: 'NOFIT_bc-xlabel'
    });
  }
}

module.exports = { drawBarChart };
