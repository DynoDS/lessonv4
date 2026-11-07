'use strict';

// Shared geometry for a printed DRAW-LINES-TO-MATCH piece: a column of boxes on
// the left with a dot on each box's right edge, a column on the right with a dot
// on each box's left edge, and the corridor between them where the child draws
// the lines. It is the stick-in copy of a lesson design's `match` task, so the
// spec is the design's own `left`, `right` and `togetherPair`, copied exactly,
// and the child's piece holds the same items in the same order as the board.
//
// The two columns are distributed down the piece independently, because they
// often hold different counts (six statements, two verdicts). The one pair done
// with the class (`togetherPair`) is drawn joined, in the worked-example purple
// the board uses for a worked example; on the photocopied pack that purple
// becomes ink, as the recording table's together row does. No other line is
// ever drawn: the answer pairs are the child's task, so a spec carrying them
// (`pairs`, `connections`) prints exactly as one without.

// ─── CONSTANTS (SVG user units) ─────────────────────────────────────────────
// The drawing is authored 1200 units wide and scaled to the printed width the
// registry gives it (150mm on the stick-in pack, so 8 units is about 1mm).
const W = 1200;
const OUTER_PAD = 10;
// The corridor is where the activity happens: eight lines crossing it have to
// stay far enough apart to tell apart, and a pencil has to run down it without
// hitting a box. The worksheet's match-up settled on about a quarter of the
// width for the same reason; 300 units is 37mm at 150mm, the top of its range.
const CORRIDOR = 300;
// A box is a target a child aims a line at, which is a bigger thing than its
// label: 128 units is 16mm at 150mm, the worksheet match-up's card minimum.
const BOX_MIN_H = 128;
const BOX_GAP = 24;
const BOX_PAD_X = 18;
const BOX_PAD_Y = 12;
const BOX_STROKE = 3;
const BOX_RADIUS = 10;
const DOT_R = 11;
// Clearance between a label and the dot on its box's edge.
const DOT_CLEAR = 18;
const JOIN_STROKE = 6;
// 32 units prints about 11pt at 150mm, the pack's body size; 26 is about 9pt,
// the pack's readable floor.
const FS_MAX = 32;
const FS_MIN = 26;
// A label longer than this many lines at the largest size steps the whole
// piece down a size, so a box stays a target rather than a paragraph.
const MAX_LINES = 3;
const LINE_HEIGHT = 1.22;
const CHAR_W = 0.54;
const MIN_ITEMS = 2;
const MAX_ITEMS = 8;

const { INK_TONES, printsInInk } = require('./surface-profiles');

// The board's colours, and what each becomes on the photocopied pack.
const COLOURS = { BOX: '#1A1A1A', TEXT: '#1A1A1A', DOT: '#1A1A1A', JOIN: '#7030A0' };
const INK = { BOX: INK_TONES.ink, TEXT: INK_TONES.ink, DOT: INK_TONES.ink, JOIN: INK_TONES.ink };
const FILL = '#FFFFFF';
const FONT = 'Arial';
// ─── END CONSTANTS ─────────────────────────────────────────────────────────

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// One side's items: the design writes `{ id, label }`; a bare string is taken
// as its label, with the id its position would have been given.
function sideItems(raw, side) {
  if (!Array.isArray(raw)) {
    throw new Error(`a match needs a "${side}" list of items to join.`);
  }
  if (raw.length < MIN_ITEMS || raw.length > MAX_ITEMS) {
    throw new Error(`a match needs ${MIN_ITEMS} to ${MAX_ITEMS} ${side} items (got ${raw.length}).`);
  }
  const items = raw.map((item, i) => {
    const object = item && typeof item === 'object';
    const label = String(object ? (item.label == null ? '' : item.label) : (item == null ? '' : item)).trim();
    if (!label) throw new Error(`a match's ${side} item ${i + 1} has no label.`);
    const id = object && item.id != null && String(item.id).trim()
      ? String(item.id).trim()
      : `${side}-${String(i + 1).padStart(3, '0')}`;
    return { id, label };
  });
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== items.length) throw new Error(`a match's ${side} items repeat an id.`);
  return items;
}

function normalise(data = {}) {
  const left = sideItems(data.left, 'left');
  const right = sideItems(data.right, 'right');
  let together = null;
  const pair = data.togetherPair;
  if (pair != null) {
    const leftIndex = left.findIndex((item) => item.id === String(pair.leftRef));
    const rightIndex = right.findIndex((item) => item.id === String(pair.rightRef));
    if (leftIndex < 0 || rightIndex < 0) {
      throw new Error(`a match's togetherPair must name a left id and a right id it holds (got ${JSON.stringify(pair)}).`);
    }
    together = { left: leftIndex, right: rightIndex };
  }
  return { left, right, together };
}

function wrap(text, maxWidth, fs) {
  const perLine = Math.max(1, Math.floor(maxWidth / (fs * CHAR_W)));
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= perLine || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  const widest = lines.reduce((max, l) => Math.max(max, l.length * fs * CHAR_W), 0);
  return { lines, fits: widest <= maxWidth };
}

// One size for every label on the piece, so the boxes read as one set: the
// largest at which every label fits its box in MAX_LINES lines or fewer.
function chooseFont(labels, labelW) {
  for (let fs = FS_MAX; fs >= FS_MIN; fs -= 1) {
    if (labels.every((label) => {
      const w = wrap(label, labelW, fs);
      return w.fits && w.lines.length <= MAX_LINES;
    })) return fs;
  }
  return FS_MIN;
}

// Each column's boxes share one height, spread evenly down the piece's height.
function column(items, x, boxW, boxH, height, side) {
  const slot = height / items.length;
  return items.map((item, i) => {
    const y = OUTER_PAD + i * slot + (slot - boxH) / 2;
    const dotX = side === 'left' ? x + boxW : x;
    return { item, x, y, w: boxW, h: boxH, dotX, dotY: y + boxH / 2 };
  });
}

function labelSvg(box, lines, fs, side, colour) {
  const lineH = fs * LINE_HEIGHT;
  const top = box.y + (box.h - lines.length * lineH) / 2;
  // The label sits centred in the box less the dot's side, so it never runs
  // into the dot the child aims at.
  const inner = box.w - BOX_PAD_X - DOT_CLEAR;
  const cx = side === 'left' ? box.x + BOX_PAD_X + inner / 2 : box.x + DOT_CLEAR + inner / 2;
  return lines
    .map((line, i) => `<text x="${cx.toFixed(2)}" y="${(top + (i + 0.8) * lineH).toFixed(2)}" text-anchor="middle" font-family="${FONT}" font-size="${fs}" fill="${colour}">${esc(line)}</text>`)
    .join('');
}

// `profile` is optional: the stick-in pack passes its own so this prints in ink.
function tightSvg(data = {}, profile) {
  const C = printsInInk(profile) ? INK : COLOURS;
  const { left, right, together } = normalise(data);
  const boxW = (W - 2 * OUTER_PAD - CORRIDOR) / 2;
  const labelW = boxW - BOX_PAD_X - DOT_CLEAR;
  const fs = chooseFont(left.concat(right).map((item) => item.label), labelW);
  const wrapped = (items) => items.map((item) => wrap(item.label, labelW, fs).lines);
  const leftLines = wrapped(left);
  const rightLines = wrapped(right);
  const boxH = (lines) => Math.max(BOX_MIN_H, Math.max(...lines.map((l) => l.length)) * fs * LINE_HEIGHT + 2 * BOX_PAD_Y);
  const leftH = boxH(leftLines);
  const rightH = boxH(rightLines);
  const height = Math.max(
    left.length * leftH + (left.length - 1) * BOX_GAP,
    right.length * rightH + (right.length - 1) * BOX_GAP
  ) + BOX_GAP; // half a gap above the first box and below the last
  const leftBoxes = column(left, OUTER_PAD, boxW, leftH, height, 'left');
  const rightBoxes = column(right, W - OUTER_PAD - boxW, boxW, rightH, height, 'right');
  const H = height + 2 * OUTER_PAD;

  const parts = [];
  const box = (b, lines, side) => {
    parts.push(`<rect x="${b.x.toFixed(2)}" y="${b.y.toFixed(2)}" width="${b.w.toFixed(2)}" height="${b.h.toFixed(2)}" rx="${BOX_RADIUS}" fill="${FILL}" stroke="${C.BOX}" stroke-width="${BOX_STROKE}"/>`);
    parts.push(labelSvg(b, lines, fs, side, C.TEXT));
  };
  leftBoxes.forEach((b, i) => box(b, leftLines[i], 'left'));
  rightBoxes.forEach((b, i) => box(b, rightLines[i], 'right'));
  if (together) {
    const a = leftBoxes[together.left];
    const b = rightBoxes[together.right];
    parts.push(`<line class="match-together" x1="${a.dotX.toFixed(2)}" y1="${a.dotY.toFixed(2)}" x2="${b.dotX.toFixed(2)}" y2="${b.dotY.toFixed(2)}" stroke="${C.JOIN}" stroke-width="${JOIN_STROKE}" stroke-linecap="round"/>`);
  }
  // Dots last, so each sits whole on its box edge and on any joined line's end.
  leftBoxes.concat(rightBoxes).forEach((b) => {
    parts.push(`<circle cx="${b.dotX.toFixed(2)}" cy="${b.dotY.toFixed(2)}" r="${DOT_R}" fill="${C.DOT}"/>`);
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H.toFixed(2)}" viewBox="0 0 ${W} ${H.toFixed(2)}">${parts.join('')}</svg>`;
  return { svg, w: W, h: H };
}

module.exports = { tightSvg, normalise, MIN_ITEMS, MAX_ITEMS };
