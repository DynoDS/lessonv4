'use strict';

// Shared, parametric teaching schematic for comparing two model parachutes.
// The drawing is intentionally a model: lesson data determines the ratios and
// labels, while the geometry makes the fair-test controls inspectable.

const CANOPY_LARGE_W = 600;
const CANOPY_SMALL_W = 200;
const CANOPY_HEIGHT_FACTOR = 0.30;
const CANOPY_GAP = 190;
const DIAGRAM_SIDE_GAP = 70;
const CORD_LENGTH = 340;
const CORD_ANCHOR_FRACTION = 0.25;
const LOAD_W = 90;
const LOAD_H = 70;
const LOAD_HALF_SPAN = LOAD_W / 2;
const DIAGRAM_TOP = 210;
const MIN_CANVAS_H = 930;
const CANVAS_MARGIN = 18;

const LABEL_FONT = 35;
const LABEL_MIN_FONT = 27;
const LABEL_MAX_W = 350;
const LABEL_PAD_X = 18;
const LABEL_PAD_Y = 14;
const LABEL_LINE_GAP = 7;
const LABEL_LANE_GAP = 25;

const INK = '#1F2937';
const BLUE = '#0070C0';
const BLUE_PALE = '#DDEEFF';
const GREEN = '#00A651';
const ORANGE = '#F59E0B';
const LOAD_FILL = '#F4D7A1';
const LABEL_FILL = '#FFFFFF';
const LABEL_STROKE = '#93A4B8';

const { INK_TONES, printsInInk } = require('./surface-profiles');

// The drawing's colours, and the photocopied pack's. Each force is named by the
// label its leader points at and told apart by which way its arrow points, so
// dark arrows lose nothing; the canopies and loads keep pale grey fills so the
// two parachutes still read as objects against the cords.
const COLOURS = { ink: INK, blue: BLUE, bluePale: BLUE_PALE, green: GREEN, orange: ORANGE, loadFill: LOAD_FILL, labelFill: LABEL_FILL, labelStroke: LABEL_STROKE };
const INK_COLOURS = { ink: INK_TONES.ink, blue: INK_TONES.ink, bluePale: INK_TONES.pale, green: INK_TONES.dark, orange: INK_TONES.ink, loadFill: INK_TONES.light, labelFill: LABEL_FILL, labelStroke: INK_TONES.mid };
const FONT = 'Arial, sans-serif';

const DEFAULT_LABELS = Object.freeze({
  largeCanopy: 'More air to push out of the way',
  smallCanopy: 'Less air to push out of the way',
  largeUpForce: 'More air resistance',
  smallUpForce: 'Less air resistance',
  downForce: 'Gravity pulls down',
  cords: 'Same cord length',
  loads: 'Same load',
});

function f(n) { return Number(n).toFixed(2); }
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Measured glyph advances are used for wrapping and box sizing. The factors are
// deliberately conservative for Arial so labels gain space instead of clipping.
function glyphFactor(ch) {
  if (/\s/.test(ch)) return 0.33;
  if (/[ilI1.,'`]/.test(ch)) return 0.29;
  if (/[mwMW@#%&]/.test(ch)) return 0.89;
  if (/[A-Z0-9]/.test(ch)) return 0.66;
  return 0.56;
}

function measureText(text, fontSize) {
  return Array.from(String(text)).reduce((sum, ch) => sum + glyphFactor(ch) * fontSize, 0);
}

function wrapMeasured(text, maxWidth, fontSize) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || measureText(candidate, fontSize) <= maxWidth) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function labelMetrics(text) {
  let fontSize = LABEL_FONT;
  let lines = wrapMeasured(text, LABEL_MAX_W - 2 * LABEL_PAD_X, fontSize);
  while (fontSize > LABEL_MIN_FONT && lines.length > 3) {
    fontSize -= 1;
    lines = wrapMeasured(text, LABEL_MAX_W - 2 * LABEL_PAD_X, fontSize);
  }
  const textW = Math.max(...lines.map((line) => measureText(line, fontSize)));
  return {
    text: String(text), lines, fontSize,
    w: Math.min(LABEL_MAX_W, Math.max(175, textW + 2 * LABEL_PAD_X)),
    h: lines.length * fontSize + (lines.length - 1) * LABEL_LINE_GAP + 2 * LABEL_PAD_Y,
  };
}

function requireRatio(value, name, expected) {
  const n = Number(value);
  if (!Number.isFinite(n) || n !== expected) {
    throw new Error(`PARACHUTE_FORCES_RATIO_INVALID: ${name} must be ${expected}.`);
  }
  return n;
}

function normaliseSpec(spec) {
  const data = spec || {};
  const canopyShape = data.canopyShape == null ? 'billowed-sheet' : String(data.canopyShape);
  if (canopyShape !== 'billowed-sheet') {
    throw new Error('PARACHUTE_FORCES_SHAPE_UNSUPPORTED: canopyShape must be "billowed-sheet".');
  }
  const labels = Object.assign({}, DEFAULT_LABELS, data.labels || {});
  for (const key of Object.keys(DEFAULT_LABELS)) {
    labels[key] = String(labels[key] == null ? '' : labels[key]).trim();
    if (!labels[key]) throw new Error(`PARACHUTE_FORCES_LABEL_MISSING: labels.${key} is required.`);
  }
  const showEqualityTicks = data.showEqualityTicks == null ? true : data.showEqualityTicks;
  if (typeof showEqualityTicks !== 'boolean') {
    throw new Error('PARACHUTE_FORCES_TICKS_INVALID: showEqualityTicks must be a boolean.');
  }
  return {
    canopyShape,
    largeCanopyWidthRatio: requireRatio(data.largeCanopyWidthRatio == null ? 3 : data.largeCanopyWidthRatio, 'largeCanopyWidthRatio', 3),
    smallCanopyWidthRatio: 1,
    cordLengthRatio: requireRatio(data.cordLengthRatio == null ? 1 : data.cordLengthRatio, 'cordLengthRatio', 1),
    loadSizeRatio: requireRatio(data.loadSizeRatio == null ? 1 : data.loadSizeRatio, 'loadSizeRatio', 1),
    showEqualityTicks,
    labels,
  };
}

function cord(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return { x1, y1, x2, y2, length: Math.hypot(dx, dy), tick: { x: (x1 + x2) / 2, y: (y1 + y2) / 2, nx: -dy / Math.hypot(dx, dy), ny: dx / Math.hypot(dx, dy) } };
}

function parachuteGeometry(x, y, w) {
  const h = w * CANOPY_HEIGHT_FACTOR;
  const centre = x + w / 2;
  const anchorY = y + h * 0.65;
  const leftAnchorX = x + w * CORD_ANCHOR_FRACTION;
  const rightAnchorX = x + w * (1 - CORD_ANCHOR_FRACTION);
  const dx = Math.abs(leftAnchorX - (centre - LOAD_HALF_SPAN));
  const drop = Math.sqrt(CORD_LENGTH * CORD_LENGTH - dx * dx);
  const load = { x: centre - LOAD_W / 2, y: anchorY + drop, w: LOAD_W, h: LOAD_H };
  return {
    x, y, w, h, centre, anchorY,
    canopy: { x, y, w, h },
    load,
    cords: [
      cord(leftAnchorX, anchorY, load.x, load.y),
      cord(rightAnchorX, anchorY, load.x + load.w, load.y),
    ],
  };
}

function placeLane(items, x, side) {
  let bottom = CANVAS_MARGIN;
  return items.map((item) => {
    const box = labelMetrics(item.text);
    const idealTop = item.targetY - box.h / 2;
    const y = Math.max(bottom, idealTop);
    bottom = y + box.h + LABEL_LANE_GAP;
    return Object.assign({}, box, { key: item.key, x: side === 'left' ? x - box.w : x, y, side, targets: item.targets });
  });
}

function describeLayout(spec) {
  const data = normaliseSpec(spec);
  const labelProbe = Object.fromEntries(Object.entries(data.labels).map(([key, value]) => [key, labelMetrics(value)]));
  const leftGutterW = Math.max(labelProbe.largeCanopy.w, labelProbe.largeUpForce.w, labelProbe.loads.w);
  const rightGutterW = Math.max(labelProbe.smallCanopy.w, labelProbe.smallUpForce.w, labelProbe.cords.w, labelProbe.downForce.w);
  const diagramLeft = CANVAS_MARGIN + leftGutterW + DIAGRAM_SIDE_GAP;
  const large = parachuteGeometry(diagramLeft, DIAGRAM_TOP, CANOPY_LARGE_W);
  const smallX = large.x + large.w + CANOPY_GAP;
  const small = parachuteGeometry(smallX, DIAGRAM_TOP + (large.h - CANOPY_SMALL_W * CANOPY_HEIGHT_FACTOR) / 2, CANOPY_SMALL_W);
  const diagramRight = small.x + small.w;
  const rightLaneX = diagramRight + DIAGRAM_SIDE_GAP;

  const largeUp = { x1: large.centre, y1: large.y + 15, x2: large.centre, y2: large.y - 145, length: 160 };
  const smallUp = { x1: small.centre, y1: small.y + 10, x2: small.centre, y2: small.y - 80, length: 90 };
  const largeDown = { x1: large.load.x + large.load.w + 35, y1: large.load.y + 5, x2: large.load.x + large.load.w + 35, y2: large.load.y + 130, length: 125 };
  const smallDown = { x1: small.load.x + small.load.w + 35, y1: small.load.y + 5, x2: small.load.x + small.load.w + 35, y2: small.load.y + 130, length: 125 };

  const leftLabels = placeLane([
    { key: 'largeUpForce', text: data.labels.largeUpForce, targetY: (largeUp.y1 + largeUp.y2) / 2, targets: [{ x: largeUp.x1, y: (largeUp.y1 + largeUp.y2) / 2 }] },
    { key: 'largeCanopy', text: data.labels.largeCanopy, targetY: large.y + large.h / 2, targets: [{ x: large.x + 12, y: large.y + large.h * 0.52 }] },
    { key: 'loads', text: data.labels.loads, targetY: Math.max(large.load.y, small.load.y) + LOAD_H / 2, targets: [{ x: large.load.x + LOAD_W / 2, y: large.load.y + LOAD_H / 2 }, { x: small.load.x + LOAD_W / 2, y: small.load.y + LOAD_H / 2 }] },
  ], CANVAS_MARGIN + leftGutterW, 'left');
  const rightLabels = placeLane([
    { key: 'smallUpForce', text: data.labels.smallUpForce, targetY: (smallUp.y1 + smallUp.y2) / 2, targets: [{ x: smallUp.x1, y: (smallUp.y1 + smallUp.y2) / 2 }] },
    { key: 'smallCanopy', text: data.labels.smallCanopy, targetY: small.y + small.h / 2, targets: [{ x: small.x + small.w - 12, y: small.y + small.h * 0.52 }] },
    { key: 'cords', text: data.labels.cords, targetY: small.cords[1].tick.y, targets: [{ x: large.cords[1].tick.x, y: large.cords[1].tick.y }, { x: small.cords[1].tick.x, y: small.cords[1].tick.y }] },
    { key: 'downForce', text: data.labels.downForce, targetY: Math.max(largeDown.y2, smallDown.y2) - 20, targets: [{ x: largeDown.x1, y: largeDown.y2 - 18 }, { x: smallDown.x1, y: smallDown.y2 - 18 }] },
  ], rightLaneX, 'right');
  const labels = leftLabels.concat(rightLabels);
  const canvasH = Math.max(MIN_CANVAS_H, ...labels.map((b) => b.y + b.h + CANVAS_MARGIN), largeDown.y2 + CANVAS_MARGIN, smallDown.y2 + CANVAS_MARGIN);
  const canvasW = rightLaneX + rightGutterW + CANVAS_MARGIN;

  return {
    data,
    canvas: { w: canvasW, h: canvasH },
    canopies: { large: large.canopy, small: small.canopy },
    cords: { large: large.cords, small: small.cords },
    loads: { large: large.load, small: small.load },
    arrows: { largeUp, smallUp, largeDown, smallDown },
    labels,
    metrics: {
      canopyWidthRatio: large.w / small.w,
      correspondingCordLengthRatios: large.cords.map((c, i) => c.length / small.cords[i].length),
      loadWidthRatio: large.load.w / small.load.w,
      loadHeightRatio: large.load.h / small.load.h,
      gravityArrowLengthRatio: largeDown.length / smallDown.length,
      airResistanceArrowLengthRatio: largeUp.length / smallUp.length,
    },
  };
}

function canopyPath(box) {
  const { x, y, w, h } = box;
  return [
    `M ${f(x)} ${f(y + h * 0.65)}`,
    `C ${f(x + w * 0.08)} ${f(y + h * 0.12)} ${f(x + w * 0.29)} ${f(y)} ${f(x + w * 0.5)} ${f(y)}`,
    `C ${f(x + w * 0.71)} ${f(y)} ${f(x + w * 0.92)} ${f(y + h * 0.12)} ${f(x + w)} ${f(y + h * 0.65)}`,
    `Q ${f(x + w * 0.875)} ${f(y + h * 0.50)} ${f(x + w * 0.75)} ${f(y + h * 0.65)}`,
    `Q ${f(x + w * 0.625)} ${f(y + h * 0.50)} ${f(x + w * 0.50)} ${f(y + h * 0.65)}`,
    `Q ${f(x + w * 0.375)} ${f(y + h * 0.50)} ${f(x + w * 0.25)} ${f(y + h * 0.65)}`,
    `Q ${f(x + w * 0.125)} ${f(y + h * 0.50)} ${f(x)} ${f(y + h * 0.65)} Z`,
  ].join(' ');
}

function arrowSvg(a, role, C) {
  return `<line data-role="${role}" x1="${f(a.x1)}" y1="${f(a.y1)}" x2="${f(a.x2)}" y2="${f(a.y2)}" stroke="${C.green}" stroke-width="15" stroke-linecap="round" marker-end="url(#arrow)"/>`;
}

function tickSvg(c, role, C) {
  const half = 12;
  const shiftX = (c.x2 - c.x1) / c.length * 7;
  const shiftY = (c.y2 - c.y1) / c.length * 7;
  return [-1, 1].map((s) => {
    const cx = c.tick.x + shiftX * s, cy = c.tick.y + shiftY * s;
    return `<line data-role="${role}" x1="${f(cx - c.tick.nx * half)}" y1="${f(cy - c.tick.ny * half)}" x2="${f(cx + c.tick.nx * half)}" y2="${f(cy + c.tick.ny * half)}" stroke="${C.orange}" stroke-width="8" stroke-linecap="round"/>`;
  }).join('');
}

function labelSvg(box, C) {
  const edgeX = box.side === 'left' ? box.x + box.w : box.x;
  const edgeY = box.y + box.h / 2;
  const leaders = box.targets.map((target) => `<path d="M ${f(edgeX)} ${f(edgeY)} L ${f((edgeX + target.x) / 2)} ${f(edgeY)} L ${f(target.x)} ${f(target.y)}" fill="none" stroke="${C.labelStroke}" stroke-width="5"/><circle cx="${f(target.x)}" cy="${f(target.y)}" r="6" fill="${C.orange}"/>`).join('');
  const firstY = box.y + LABEL_PAD_Y + box.fontSize * 0.82;
  const tspans = box.lines.map((line, i) => `<tspan x="${f(box.x + box.w / 2)}" y="${f(firstY + i * (box.fontSize + LABEL_LINE_GAP))}">${esc(line)}</tspan>`).join('');
  return `${leaders}<rect data-label-box="${box.key}" x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}" rx="18" fill="${C.labelFill}" stroke="${C.labelStroke}" stroke-width="4"/><text font-family="${FONT}" font-size="${box.fontSize}" font-weight="700" fill="${C.ink}" text-anchor="middle">${tspans}</text>`;
}

// `profile` is optional: the stick-in pack passes its own so the schematic prints in ink.
function tightSvg(spec, profile) {
  const C = printsInInk(profile) ? INK_COLOURS : COLOURS;
  const layout = describeLayout(spec);
  const { canvas, canopies, cords, loads, arrows, labels, data } = layout;
  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${f(canvas.w)}" height="${f(canvas.h)}" viewBox="0 0 ${f(canvas.w)} ${f(canvas.h)}">`);
  parts.push(`<defs><marker id="arrow" markerWidth="13" markerHeight="13" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,8 L8,4 z" fill="${C.green}"/></marker></defs>`);
  parts.push(`<path data-role="large-canopy" d="${canopyPath(canopies.large)}" fill="${C.bluePale}" stroke="${C.blue}" stroke-width="10"/>`);
  parts.push(`<path data-role="small-canopy" d="${canopyPath(canopies.small)}" fill="${C.bluePale}" stroke="${C.blue}" stroke-width="10"/>`);
  for (const [size, pair] of Object.entries(cords)) {
    pair.forEach((c, i) => {
      parts.push(`<line data-role="${size}-cord-${i}" x1="${f(c.x1)}" y1="${f(c.y1)}" x2="${f(c.x2)}" y2="${f(c.y2)}" stroke="${C.ink}" stroke-width="7"/>`);
      if (data.showEqualityTicks) parts.push(tickSvg(c, `${size}-cord-tick-${i}`, C));
    });
  }
  for (const [size, box] of Object.entries(loads)) {
    parts.push(`<rect data-role="${size}-load" x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}" rx="9" fill="${C.loadFill}" stroke="${C.ink}" stroke-width="8"/>`);
  }
  parts.push(arrowSvg(arrows.largeUp, 'large-air-resistance', C));
  parts.push(arrowSvg(arrows.smallUp, 'small-air-resistance', C));
  parts.push(arrowSvg(arrows.largeDown, 'large-gravity', C));
  parts.push(arrowSvg(arrows.smallDown, 'small-gravity', C));
  labels.forEach((box) => parts.push(labelSvg(box, C)));
  parts.push('</svg>');
  return { svg: parts.join(''), aspect: canvas.w / canvas.h, w: canvas.w, h: canvas.h, layout };
}

function cacheKey(spec) {
  const d = normaliseSpec(spec);
  return `parachute-forces:${d.canopyShape}:${d.largeCanopyWidthRatio}:${d.cordLengthRatio}:${d.loadSizeRatio}:${d.showEqualityTicks ? 1 : 0}:${Object.keys(DEFAULT_LABELS).map((k) => `${k}=${d.labels[k]}`).join('|')}`;
}

module.exports = { tightSvg, cacheKey, describeLayout, normaliseSpec };
