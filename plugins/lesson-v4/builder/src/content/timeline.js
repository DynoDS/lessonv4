'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
const { textBoxWidthIn } = require('../glyph-width');

// ─── CONSTANTS ────────────────────────────────────────────────
// A timeline for the board: named era bands sitting on a bold line, with
// dated ticks hanging beneath it. It is the slide twin of the worksheet
// timeline in worksheet-html/src/helpers/matching.js, and it keeps that
// helper's one rule: POSITIONS ARE FRACTIONS THE DESIGNER CHOOSES, never
// dates the helper spaces out for itself. The designer works those fractions
// out from the real dates (`templates.md` shows the arithmetic), so the line
// a child sees is honest about how far apart things are. There is no "not to
// scale" note: the teacher asked for none on any timeline (8 September 2026),
// and a spec that still carries `note` is refused by name rather than drawn.
const PAD              = 0.12;   // inches of breathing room inside the zone
const STEM_H           = 0.42;   // the optional line of text above the figure
const STEM_FONT        = 18;
const STEM_GAP         = 0.08;
const ERA_H_MAX        = 0.60;   // era band height at full size ...
const ERA_H_MIN        = 0.36;   // ... and the shortest a band may be squeezed to
const ERA_FONT_MAX     = 20;
// Floors below the 18pt projection floor (4.2.128) were never reachable: the fit
// pass refuses a box under it, so a label measured as fitting at 11pt failed
// at the end of the build instead of here.
const ERA_FONT_MIN     = Math.max(11, MIN_FONT_PT);
const ERA_PAD_H        = 0.07;   // inset between a band edge and its label
const ERA_FILLS        = ['D6EEFF', 'FFE0C2', 'D5F5E3', 'FFF8C2', 'E8D5F5'];
const ERA_LINE         = '8C8C8C';
const ERA_GAP          = 0.05;   // between the bands and the line
const LINE_THICK       = 0.07;
const LINE_COLOUR      = '000000';
const END_CAP_W        = 0.06;
const END_CAP_H        = 0.34;
const TICK_W           = 0.05;
const TICK_H           = 0.30;   // hangs from the line down to the label
const TICK_COLOUR      = '000000';
const MARK_GAP         = 0.05;   // between a tick's foot and its label
const MARK_LABEL_LINES = 2;      // a date label may wrap to this many lines
const MARK_FONT_MAX    = 18;
const MARK_FONT_MIN    = Math.max(11, MIN_FONT_PT);
// Dates close together (1837, 1862, 1897 and 1901 on one Victorian line) left
// each label a sliver between its neighbours and the timeline refused. When one
// row cannot hold them, alternate dates drop to a second row on a longer tick,
// so each label reaches halfway to the next date on ITS row: twice the room.
const MARK_ROW_GAP     = 0.06;
const MARK_LABEL_GUTTER = 0.06;  // clear space kept between neighbouring labels
const LINE_H_PER_PT    = 1.22 / 72; // one line of Comic Sans, inches per point
const CAPTION_FONT     = Math.max(12, MIN_FONT_PT);
const CAPTION_H        = CAPTION_FONT * 1.32 / 72 + 0.08;
const CAPTION_GAP      = 0.06;
// A mark this close to either end has half its centred label hanging off the
// figure, so it tucks inward from its tick instead (the worksheet helper does
// the same at the same threshold).
const EDGE             = 0.08;
// ─── END CONSTANTS ────────────────────────────────────────────

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function str(value) {
  return value == null ? '' : String(value);
}

function lineHeightIn(fontPt) {
  return fontPt * LINE_H_PER_PT;
}

// How many lines `text` takes at `fontPt` in a box `availW` wide, wrapping at
// spaces only. A word wider than the box counts as an overflow (Infinity):
// the helper never lets PowerPoint split a word, so a word that will not fit
// is the signal to shrink or to refuse, never to draw and hope.
function wrappedLines(text, fontPt, availW, bold) {
  const words = str(text).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  let lines = 1;
  let current = '';
  for (const word of words) {
    if (textBoxWidthIn(word, fontPt, bold) > availW + 1e-6) return Infinity;
    const candidate = current ? current + ' ' + word : word;
    if (textBoxWidthIn(candidate, fontPt, bold) <= availW + 1e-6) {
      current = candidate;
    } else {
      lines += 1;
      current = word;
    }
  }
  return lines;
}

// The largest whole-point size, between the floor and the ceiling, at which
// `text` sits inside `availW` on at most `maxLines` lines with no word split.
// Returns null when even the floor cannot hold it.
function fitFont(text, availW, maxFont, minFont, maxLines, bold) {
  for (let pt = maxFont; pt >= minFont; pt -= 1) {
    if (wrappedLines(text, pt, availW, bold) <= maxLines) return pt;
  }
  return null;
}

function normaliseEras(data) {
  const raw = Array.isArray(data.eras) ? data.eras : [];
  return raw
    .filter((era) => era && typeof era === 'object')
    .map((era) => {
      const from = clamp01(era.from);
      const to = clamp01(era.to);
      return { label: str(era.label), from: Math.min(from, to), to: Math.max(from, to) };
    })
    .filter((era) => era.to > era.from);
}

function normaliseMarks(data) {
  const raw = Array.isArray(data.marks) ? data.marks : [];
  return raw
    .filter((mark) => mark && typeof mark === 'object')
    .map((mark) => ({ label: str(mark.label), at: clamp01(mark.at) }))
    .sort((a, b) => a.at - b.at);
}

// The box each date label may occupy, in inches from the zone's left inner
// edge. A centred label may reach halfway to each neighbour; a label at the
// very edge tucks inward from its tick so nothing hangs off the figure.
function markLabelBoxes(marks, innerX, innerW, lineX0, lineW, rows, offset) {
  const xs = marks.map((mark) => lineX0 + mark.at * lineW);
  const rowOf = (i) => (rows > 1 ? (i + (offset || 0)) % rows : 0);
  const boxes = [];
  for (let i = 0; i < marks.length; i += 1) {
    const x = xs[i];
    let prev = -1;
    for (let k = i - 1; k >= 0; k -= 1) if (rowOf(k) === rowOf(i)) { prev = k; break; }
    let next = -1;
    for (let k = i + 1; k < marks.length; k += 1) if (rowOf(k) === rowOf(i)) { next = k; break; }
    let leftLimit = prev < 0 ? innerX : (xs[prev] + x) / 2 + MARK_LABEL_GUTTER / 2;
    let rightLimit = next < 0 ? innerX + innerW : (x + xs[next]) / 2 - MARK_LABEL_GUTTER / 2;
    // A lower-row tick runs down through the rows above it, so a label on an
    // upper row stops short of every lower-row tick rather than printing across it.
    for (let k = 0; k < marks.length; k += 1) {
      if (rowOf(k) <= rowOf(i)) continue;
      if (xs[k] < x) leftLimit = Math.max(leftLimit, xs[k] + TICK_W / 2 + MARK_LABEL_GUTTER);
      if (xs[k] > x) rightLimit = Math.min(rightLimit, xs[k] - TICK_W / 2 - MARK_LABEL_GUTTER);
    }
    let box;
    if (marks[i].at <= EDGE) {
      box = { x: Math.max(innerX, x - TICK_W / 2), w: rightLimit - Math.max(innerX, x - TICK_W / 2), align: 'left' };
    } else if (marks[i].at >= 1 - EDGE) {
      const right = Math.min(innerX + innerW, x + TICK_W / 2);
      box = { x: leftLimit, w: right - leftLimit, align: 'right' };
    } else {
      const half = Math.min(x - leftLimit, rightLimit - x);
      box = { x: x - half, w: 2 * half, align: 'center' };
    }
    box.w = Math.max(0, box.w);
    box.tickX = x;
    box.row = rowOf(i);
    boxes.push(box);
  }
  return boxes;
}

// Everything the draw and the measure share: where each part lands, at what
// size, and what to refuse. Refusals are thrown with a named signal in the
// zone's own units, the way `table` refuses a zone too short for its rows, so
// the fault reaches the designer as a room problem and not as a text-fit
// mystery at the end of the build.
function layoutTimeline(zone, data) {
  const eras = normaliseEras(data);
  const marks = normaliseMarks(data);
  const stem = str(data.text).trim();
  if (str(data.note).trim()) {
    throw new Error(
      'TIMELINE_NOTE_NOT_DRAWN: a timeline carries no note (this one says ' +
      `"${str(data.note).trim()}"). Timelines are not labelled "not to scale"; ` +
      'place each mark and era in proportion to its real dates instead, and ' +
      'remove the note.'
    );
  }
  const caption = str(data.caption).trim();

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(0.5, zone.w - 2 * PAD);
  const innerH = Math.max(0.3, zone.h - 2 * PAD);

  const lineX0 = innerX + END_CAP_W / 2;
  const lineW = innerW - END_CAP_W;

  // Era labels share one size, so the bands read as peers.
  let eraFont = ERA_FONT_MAX;
  for (const era of eras) {
    const availW = (era.to - era.from) * lineW - 2 * ERA_PAD_H;
    const pt = era.label ? fitFont(era.label, availW, ERA_FONT_MAX, ERA_FONT_MIN, 1, true) : ERA_FONT_MAX;
    if (pt == null) {
      const needed = textBoxWidthIn(era.label, ERA_FONT_MIN, true) + 2 * ERA_PAD_H;
      throw new Error(
        `TIMELINE_ZONE_TOO_NARROW: the era "${era.label}" spans ${availW.toFixed(2)}in of ` +
        `line but needs ${needed.toFixed(2)}in to sit on one line even at the ${ERA_FONT_MIN}pt ` +
        `floor. Give the timeline a wider zone, widen that era's from/to span, or ` +
        `shorten its label; the helper never splits a word or wraps a band.`
      );
    }
    eraFont = Math.min(eraFont, pt);
  }

  // Date labels share one size too, and may take two lines. One row first;
  // two rows when one cannot hold them.
  // Which dates share a row matters as much as how many rows there are: a
  // short date beside a long one fits on the upper row where the long one
  // would print across the short one's tick. So every rotation of two and three
  // rows is tried, fewest rows first.
  const fitsOn = (rows, offset) => {
    const trial = markLabelBoxes(marks, innerX, innerW, lineX0, lineW, rows, offset);
    return marks.every((mark, i) => !mark.label ||
      fitFont(mark.label, trial[i].w, MARK_FONT_MAX, MARK_FONT_MIN, MARK_LABEL_LINES, true) != null);
  };
  let markRows = 1;
  let markOffset = 0;
  if (marks.length > 2 && !fitsOn(1, 0)) {
    const tries = [[2, 0], [2, 1], [3, 0], [3, 1], [3, 2]];
    const found = tries.find(([rows, offset]) => fitsOn(rows, offset));
    if (found) [markRows, markOffset] = found;
  }
  const boxes = markLabelBoxes(marks, innerX, innerW, lineX0, lineW, markRows, markOffset);
  let markFont = MARK_FONT_MAX;
  marks.forEach((mark, i) => {
    if (!mark.label) return;
    const pt = fitFont(mark.label, boxes[i].w, MARK_FONT_MAX, MARK_FONT_MIN, MARK_LABEL_LINES, true);
    if (pt == null) {
      const longest = mark.label.split(/\s+/).sort((a, b) => b.length - a.length)[0];
      const wordW = textBoxWidthIn(longest, MARK_FONT_MIN, true);
      const linesAtFloor = wrappedLines(mark.label, MARK_FONT_MIN, boxes[i].w, true);
      const why = wordW > boxes[i].w
        ? `needs ${wordW.toFixed(2)}in for the word "${longest}" even at the ${MARK_FONT_MIN}pt floor`
        : `would take ${linesAtFloor} lines at the ${MARK_FONT_MIN}pt floor, and a date label may take ${MARK_LABEL_LINES}`;
      throw new Error(
        `TIMELINE_ZONE_TOO_NARROW: the date label "${mark.label}" has ${boxes[i].w.toFixed(2)}in ` +
        `between its neighbours but ${why}. Give the timeline a wider zone, space the marks ` +
        `further apart, or shorten the label; the helper never splits a word.`
      );
    }
    markFont = Math.min(markFont, pt);
  });

  const markLines = marks.reduce((most, mark, i) => {
    if (!mark.label) return most;
    return Math.max(most, wrappedLines(mark.label, markFont, boxes[i].w, true));
  }, marks.length ? 1 : 0);
  const markRowH = marks.length ? lineHeightIn(markFont) * markLines + 0.04 : 0;
  const markLabelH = markRows * markRowH + (markRows - 1) * MARK_ROW_GAP;

  const stemBlock = stem ? STEM_H + STEM_GAP : 0;
  const captionBlock = caption ? CAPTION_GAP + CAPTION_H : 0;
  const belowLine = marks.length ? TICK_H + MARK_GAP + markLabelH : END_CAP_H / 2;
  const aboveLineFixed = eras.length ? ERA_GAP : END_CAP_H / 2;

  // Natural height at full-size bands, then squeeze the bands (only) toward
  // their floor when the zone is shorter than that.
  const fixed = stemBlock + aboveLineFixed + LINE_THICK / 2 + belowLine + captionBlock;
  let eraH = eras.length ? ERA_H_MAX : 0;
  if (eras.length && fixed + eraH > innerH) {
    eraH = Math.max(ERA_H_MIN, innerH - fixed);
  }
  const usedH = fixed + eraH;
  if (usedH > innerH + 0.005) {
    throw new Error(
      `TIMELINE_ZONE_TOO_SHORT: this timeline needs ${(usedH + 2 * PAD).toFixed(2)}in of height ` +
      `(era bands at their ${ERA_H_MIN.toFixed(2)}in floor, the line, ${markLines}-line date ` +
      `labels at ${markFont}pt` + (stem ? ', its text line' : '') + (caption ? ', its caption' : '') +
      `) but the zone is ${zone.h.toFixed(2)}in tall. Raise this block's share of the ` +
      `stack, drop the caption or text line, or give it a taller zone; nothing was shrunk ` +
      `further or cut.`
    );
  }

  // Centre the figure in whatever extra height the zone has; the card hugs
  // the used rect through measureTimeline, so nothing reads as dead space.
  const startY = innerY + (innerH - usedH) / 2;
  let cursor = startY;
  const stemY = cursor;
  cursor += stemBlock;
  const eraY = cursor;
  cursor += eraH + aboveLineFixed;
  const lineY = cursor + LINE_THICK / 2; // the line's centre
  cursor += LINE_THICK / 2 + belowLine;
  const captionY = cursor + CAPTION_GAP;

  return {
    eras, marks, stem, caption,
    innerX, innerY, innerW, innerH,
    lineX0, lineW, lineY,
    eraFont, eraH, eraY,
    markFont, markLabelH, markRowH, markRows, boxes,
    stemY, captionY,
    startY, usedH
  };
}

function drawTimeline(pptx, slide, zone, data) {
  const L = layoutTimeline(zone, data);

  if (L.stem) {
    slide.addText(L.stem, {
      x: L.innerX, y: L.stemY, w: L.innerW, h: STEM_H,
      fontFace: FONT, fontSize: STEM_FONT, bold: true, color: COLOURS.body,
      align: 'left', valign: 'middle', margin: 0, fit: FIT
    });
  }

  L.eras.forEach((era, i) => {
    const x = L.lineX0 + era.from * L.lineW;
    const w = (era.to - era.from) * L.lineW;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x, y: L.eraY, w, h: L.eraH,
      fill: { color: ERA_FILLS[i % ERA_FILLS.length] },
      line: { color: ERA_LINE, width: 1 }
    });
    if (era.label) {
      slide.addText(era.label, {
        x: x + ERA_PAD_H, y: L.eraY, w: Math.max(0.1, w - 2 * ERA_PAD_H), h: L.eraH,
        fontFace: FONT, fontSize: L.eraFont, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 0, fit: FIT
      });
    }
  });

  // The line and its end caps.
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: L.lineX0, y: L.lineY - LINE_THICK / 2, w: L.lineW, h: LINE_THICK,
    fill: { color: LINE_COLOUR }, line: { color: LINE_COLOUR, width: 0 }
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: L.innerX, y: L.lineY - END_CAP_H / 2, w: END_CAP_W, h: END_CAP_H,
    fill: { color: LINE_COLOUR }, line: { color: LINE_COLOUR, width: 0 }
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: L.innerX + L.innerW - END_CAP_W, y: L.lineY - END_CAP_H / 2, w: END_CAP_W, h: END_CAP_H,
    fill: { color: LINE_COLOUR }, line: { color: LINE_COLOUR, width: 0 }
  });

  // Ticks hang from the line; labels sit under their tick's foot.
  // A second-row date's tick runs past the first row, so it still points at
  // its own label.
  L.marks.forEach((mark, i) => {
    const box = L.boxes[i];
    const drop = box.row * (L.markRowH + MARK_ROW_GAP);
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: box.tickX - TICK_W / 2, y: L.lineY, w: TICK_W, h: TICK_H + drop,
      fill: { color: TICK_COLOUR }, line: { color: TICK_COLOUR, width: 0 }
    });
    if (mark.label && box.w > 0) {
      slide.addText(mark.label, {
        x: box.x, y: L.lineY + TICK_H + MARK_GAP + drop, w: box.w, h: L.markRowH,
        fontFace: FONT, fontSize: L.markFont, bold: true, color: COLOURS.body,
        align: box.align, valign: 'top', margin: 0, fit: FIT
      });
    }
  });

  if (L.caption) {
    slide.addText(L.caption, {
      x: L.innerX, y: L.captionY, w: L.innerW, h: CAPTION_H,
      fontFace: FONT, fontSize: CAPTION_FONT, italic: true, color: COLOURS.dim,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

// The card hugs the figure rather than the zone (see MEASURE in index.js).
function measureTimeline(zone, data) {
  let L;
  try {
    L = layoutTimeline(zone, data);
  } catch (error) {
    return null;
  }
  return { x: zone.x, y: L.startY - PAD, w: zone.w, h: L.usedH + 2 * PAD };
}

module.exports = { drawTimeline, measureTimeline, layoutTimeline };
