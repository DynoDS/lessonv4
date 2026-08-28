'use strict';

// Renders an analogue clock face. Pre-renders SVG → PNG via sharp before the
// sync slide loop (in preRenderClocks), then drawClock reads from ctx.clockImages.
//
// Spec:
//   time   "H:MM" string, e.g. "3:45", "11:00". Required when hands: true.
//   hands  true (default) = draw hands at `time`. false = blank face for children.
//   label  optional string caption rendered below the clock.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
const LABEL_H        = 0.35;   // height when label is just a question identifier (e.g. "(a)")
const LABEL_H_ANSWER = 0.7;    // height when label carries an answer reveal (contains "||")
const LABEL_GAP      = 0.06;
const LABEL_FONT        = 13;
const LABEL_FONT_ANSWER = 20;  // larger and bold so the green answer reads from the back row
const RENDER_PX      = 600;    // pre-render resolution — high enough for crisp slides
// ─── END CONSTANTS ────────────────────────────────────────────

function toRad(deg) { return (deg * Math.PI) / 180; }

function clockKey(data) {
  if (data.hands === false) return 'blank:0';
  return (data.time || 'blank') + ':1';
}

function buildSvg(data, sizePx) {
  const { time, hands = true } = data;
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const pad = 26;
  const r = sizePx / 2 - pad;
  const numberR     = r - 34;
  const majorInner  = r - 18;
  const minorInner  = r - 9;
  const hourLen     = r * 0.55;
  const minuteLen   = r * 0.82;
  const numFont     = Math.round(r * 0.21);

  const parts = [];

  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#000000" stroke-width="3"/>`);

  for (let i = 0; i < 60; i++) {
    const rad  = toRad(i * 6 - 90);
    const major = i % 5 === 0;
    const inner = major ? majorInner : minorInner;
    const x1 = (cx + r     * Math.cos(rad)).toFixed(2);
    const y1 = (cy + r     * Math.sin(rad)).toFixed(2);
    const x2 = (cx + inner * Math.cos(rad)).toFixed(2);
    const y2 = (cy + inner * Math.sin(rad)).toFixed(2);
    parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="${major ? 2.5 : 1.5}"/>`);
  }

  for (let n = 1; n <= 12; n++) {
    const rad = toRad(n * 30 - 90);
    const nx = (cx + numberR * Math.cos(rad)).toFixed(2);
    const ny = (cy + numberR * Math.sin(rad)).toFixed(2);
    parts.push(`<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${numFont}" font-weight="bold" fill="#000000">${n}</text>`);
  }

  if (hands && time) {
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10) % 12;
    const m = parseInt(mStr, 10);

    const minRad = toRad(m * 6 - 90);
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${(cx + minuteLen * Math.cos(minRad)).toFixed(2)}" y2="${(cy + minuteLen * Math.sin(minRad)).toFixed(2)}" stroke="#000000" stroke-width="3" stroke-linecap="round"/>`);

    const hourRad = toRad(h * 30 + m * 0.5 - 90);
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${(cx + hourLen * Math.cos(hourRad)).toFixed(2)}" y2="${(cy + hourLen * Math.sin(hourRad)).toFixed(2)}" stroke="#000000" stroke-width="6" stroke-linecap="round"/>`);
  }

  parts.push(`<circle cx="${cx}" cy="${cy}" r="5" fill="#000000"/>`);

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

async function preRenderClocks(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'clock') {
      const key = clockKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const map = {};
  for (const [key, spec] of Object.entries(specs)) {
    const svg = buildSvg(spec, RENDER_PX);
    try {
      map[key] = await sharp(Buffer.from(svg), { density: 72 })
        .resize({ width: RENDER_PX })
        .png()
        .toBuffer();
    } catch (e) {
      // skip — placeholder circle shown at draw time
    }
  }
  return map;
}

// The vertical band a clock reserves under its face for its label, by label kind.
// A row equaliser uses this to give every clock in the row the same band (the
// largest any sibling needs) so they all draw at one size.
function clockLabelBandHeight(data) {
  const label = (data && data.label) || '';
  if (!label) return 0;
  return label.includes('||') ? LABEL_H_ANSWER : LABEL_H;
}

function drawClock(pptx, slide, zone, data, ctx) {
  const key      = clockKey(data);
  const label     = data.label || '';
  const hasLabel  = label.length > 0;
  const hasAnswer = hasLabel && label.includes('||');
  // A row of clocks may pass a shared band height (zone.clockLabelBandH) so every
  // option renders at the same size. Without it, the option carrying the answer
  // reveal reserves a taller band than its plain "(a)" neighbours and so draws a
  // smaller square — the correct clock ends up visibly shrunk on the answer slide,
  // which is exactly the asymmetry the row equaliser exists to remove.
  const naturalLabelH = hasAnswer ? LABEL_H_ANSWER : LABEL_H;
  const labelH    = (hasLabel && typeof zone.clockLabelBandH === 'number')
    ? zone.clockLabelBandH : naturalLabelH;
  const labelFont = hasAnswer ? LABEL_FONT_ANSWER : LABEL_FONT;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD - (hasLabel ? labelH + LABEL_GAP : 0);

  const side   = Math.min(innerW, innerH);
  const clockX = innerX + (innerW - side) / 2;
  const clockY = innerY + (innerH - side) / 2;

  const png = ctx.clockImages && ctx.clockImages[key];
  if (png) {
    slide.addImage({
      data: 'image/png;base64,' + png.toString('base64'),
      x: clockX, y: clockY, w: side, h: side
    });
  } else {
    require('./figure-fallback').drawFigureFallback(pptx, slide, { x: clockX, y: clockY, w: side, h: side }, ctx, 'clock');
  }

  if (hasLabel) {
    const labelRuns = splitAnswerRuns(label, hasAnswer);
    slide.addText(labelRuns, {
      x: innerX, y: innerY + innerH + LABEL_GAP,
      w: innerW, h: labelH,
      fontFace: FONT, fontSize: labelFont, color: COLOURS.body,
      bold: hasAnswer,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawClock, preRenderClocks, clockKey, clockLabelBandHeight };
