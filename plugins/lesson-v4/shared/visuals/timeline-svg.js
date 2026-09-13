'use strict';

// THE timeline: named era bands sitting on a bold line, with dated ticks hanging
// beneath it. One drawing, placed by the board, the worksheet, the working wall
// and the stick-in pack.
//
// POSITIONS ARE FRACTIONS THE DESIGNER CHOOSES, never dates the drawing spaces
// out for itself. A school timeline is almost never to scale: the Stone Age runs
// from two million years ago to four thousand, and drawn honestly the last two
// eras would be invisible. The designer works each fraction out from the real
// dates (templates.md shows the arithmetic), so the spacing is a teaching
// decision and the line is honest about it. There is no "not to scale" note:
// the teacher asked for none on any timeline (8 September 2026), and a spec that
// still carries `note` is refused by name rather than drawn.
//
// There were two. The board drew PowerPoint shapes (builder/src/content/
// timeline.js); the sheet drew HTML boxes (worksheet-html/src/helpers/
// matching.js) whose absolutely placed dates the sheet's own fit check could not
// see, so a sheet carrying a timeline was refused as overlapping. Every rule
// either had earned is kept here, and it moved on 13 September 2026, when every
// picture became one shared drawing reachable from every surface.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   eras      [{ label, from, to }] bands above the line; labels share one size
//             and stay on one line
//   marks     [{ label, at }] ticks hanging from the line, each date's words
//             beneath its own tick; up to two lines, never split in a word
//   text      one short line above the figure: the question it serves (the
//             worksheet prints it as its own line of sheet text)
//   caption   one short italic line centred beneath the dates
// Every from, to and at is a fraction of the line from 0 to 1, clamped there.

const T = require('./figure-text');

// ─── CONSTANTS (ems of the settled font size) ───────────────────────────────
// Taken from the board's timeline, which had been tuned in inches at 18pt.
const ERA_H_MAX = 2.4; // era band height at full size ...
const ERA_H_MIN = 1.5; // ... and the shortest a band may be squeezed to
const ERA_PAD_H = 0.28; // inset between a band edge and its label
const ERA_GAP = 0.2; // between the bands and the line
const LINE_THICK = 0.28;
const END_CAP_W = 0.24;
const END_CAP_H = 1.36;
const TICK_W = 0.2;
const TICK_H = 1.2; // hangs from the line down to the label
const MARK_GAP = 0.2; // between a tick's foot and its label
const MARK_LABEL_LINES = 2; // a date label may wrap to this many lines
// Dates close together (1837, 1862, 1897 and 1901 on one Victorian line) left
// each label a sliver between its neighbours and the timeline refused. When one
// row cannot hold them, alternate dates drop to a second row on a longer tick,
// so each label reaches halfway to the next date on ITS row: twice the room.
const MARK_ROW_GAP = 0.24;
const MARK_LABEL_GUTTER = 0.24; // clear space kept between neighbouring labels
const STEM_GAP = 0.32;
const CAPTION_GAP = 0.24;
// A mark this close to either end has half its centred label hanging off the
// figure: the printed sheet once opened with ",000 years ago" and closed with
// "4,000 years" running into the margin. So it tucks inward from its tick, and
// the tick stays exactly where the teacher put it.
const EDGE = 0.08;
const PAD = 0.12;
const ERA_FILLS = ['#D6EEFF', '#FFE0C2', '#D5F5E3', '#FFF8C2', '#E8D5F5'];
const ERA_FILLS_INK = ['#EDEDED', '#D9D9D9'];
const ERA_LINE = '#8C8C8C';
const DIM = '#595959';
// ────────────────────────────────────────────────────────────────────────────

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function str(value) {
  return value == null ? '' : String(value);
}

function inches(pt) {
  return (pt / 72).toFixed(2);
}

function normalise(spec = {}) {
  if (str(spec.note).trim()) {
    throw new Error(
      'TIMELINE_NOTE_NOT_DRAWN: a timeline carries no note (this one says ' +
        `"${str(spec.note).trim()}"). Timelines are not labelled "not to scale"; ` +
        'place each mark and era in proportion to its real dates instead, and remove the note.'
    );
  }
  const eras = (Array.isArray(spec.eras) ? spec.eras : [])
    .filter((era) => era && typeof era === 'object')
    .map((era) => {
      const from = clamp01(era.from);
      const to = clamp01(era.to);
      return { label: str(era.label), from: Math.min(from, to), to: Math.max(from, to) };
    })
    .filter((era) => era.to > era.from);
  const marks = (Array.isArray(spec.marks) ? spec.marks : [])
    .filter((mark) => mark && typeof mark === 'object')
    .map((mark) => ({ label: str(mark.label), at: clamp01(mark.at) }))
    .sort((a, b) => a.at - b.at);
  return { eras, marks, text: str(spec.text).trim(), caption: str(spec.caption).trim() };
}

// The box each date label may occupy, in points. A centred label may reach
// halfway to each neighbour on its row; a label at the very edge tucks inward
// from its tick so nothing hangs off the figure.
function markLabelBoxes(marks, left, right, lineX0, lineW, rows, offset, pt) {
  const xs = marks.map((mark) => lineX0 + mark.at * lineW);
  const rowOf = (i) => (rows > 1 ? (i + (offset || 0)) % rows : 0);
  const tickW = TICK_W * pt;
  const gutter = MARK_LABEL_GUTTER * pt;
  return marks.map((mark, i) => {
    const x = xs[i];
    let prev = -1;
    for (let k = i - 1; k >= 0; k -= 1) if (rowOf(k) === rowOf(i)) { prev = k; break; }
    let next = -1;
    for (let k = i + 1; k < marks.length; k += 1) if (rowOf(k) === rowOf(i)) { next = k; break; }
    let leftLimit = prev < 0 ? left : (xs[prev] + x) / 2 + gutter / 2;
    let rightLimit = next < 0 ? right : (x + xs[next]) / 2 - gutter / 2;
    // A lower-row tick runs down through the rows above it, so a label on an
    // upper row stops short of every lower-row tick rather than printing across it.
    for (let k = 0; k < marks.length; k += 1) {
      if (rowOf(k) <= rowOf(i)) continue;
      if (xs[k] < x) leftLimit = Math.max(leftLimit, xs[k] + tickW / 2 + gutter);
      if (xs[k] > x) rightLimit = Math.min(rightLimit, xs[k] - tickW / 2 - gutter);
    }
    let box;
    if (mark.at <= EDGE) {
      const start = Math.max(left, x - tickW / 2);
      box = { x: start, w: rightLimit - start, align: 'left' };
    } else if (mark.at >= 1 - EDGE) {
      const end = Math.min(right, x + tickW / 2);
      box = { x: leftLimit, w: end - leftLimit, align: 'right' };
    } else {
      const half = Math.min(x - leftLimit, rightLimit - x);
      box = { x: x - half, w: 2 * half, align: 'center' };
    }
    box.w = Math.max(0, box.w);
    box.tickX = x;
    box.row = rowOf(i);
    return box;
  });
}

function layoutAt(n, profile, pt) {
  const W = profile.widthPt;
  const left = PAD * pt;
  const right = W - PAD * pt;
  const inner = right - left;
  const lineX0 = left + (END_CAP_W * pt) / 2;
  const lineW = inner - END_CAP_W * pt;

  // Era labels share one size and stay on one line, so the bands read as peers.
  for (const era of n.eras) {
    const availW = (era.to - era.from) * lineW - 2 * ERA_PAD_H * pt;
    if (era.label && T.widthPt(era.label, pt, true) > availW) {
      return new Error(
        `TIMELINE_ZONE_TOO_NARROW: the era "${era.label}" spans ${inches(availW)}in of line but needs ` +
          `${inches(T.widthPt(era.label, profile.minFontPt, true) + 2 * ERA_PAD_H * profile.minFontPt)}in to sit on one line even at the ${profile.minFontPt}pt ` +
          `floor. Give the timeline a wider space, widen that era's from/to span, or shorten its label; the drawing never splits a word or wraps a band.`
      );
    }
  }

  // Date labels share one size too, and may take two lines. Which dates share
  // a row matters as much as how many rows there are: a short date beside a
  // long one fits on the upper row where the long one would print across the
  // short one's tick. So every rotation of two and three rows is tried, fewest
  // rows first.
  const wrapIn = (label, w) => {
    const lines = T.wrap(label, pt, w, true);
    return lines && lines.length <= MARK_LABEL_LINES ? lines : null;
  };
  const fitsOn = (rows, offset) => {
    const trial = markLabelBoxes(n.marks, left, right, lineX0, lineW, rows, offset, pt);
    return n.marks.every((mark, i) => !mark.label || wrapIn(mark.label, trial[i].w));
  };
  let rows = 1;
  let offset = 0;
  if (n.marks.length > 2 && !fitsOn(1, 0)) {
    const found = [[2, 0], [2, 1], [3, 0], [3, 1], [3, 2]].find(([r, o]) => fitsOn(r, o));
    if (found) [rows, offset] = found;
  }
  const boxes = markLabelBoxes(n.marks, left, right, lineX0, lineW, rows, offset, pt);
  const markLines = [];
  for (let i = 0; i < n.marks.length; i += 1) {
    const mark = n.marks[i];
    if (!mark.label) {
      markLines.push([]);
      continue;
    }
    const lines = wrapIn(mark.label, boxes[i].w);
    if (!lines) {
      const longest = T.longestWord(mark.label, profile.minFontPt, true);
      const wordW = T.widthPt(longest, profile.minFontPt, true);
      const atFloor = T.wrap(mark.label, profile.minFontPt, boxes[i].w, true);
      const why =
        wordW > boxes[i].w
          ? `needs ${inches(wordW)}in for the word "${longest}" even at the ${profile.minFontPt}pt floor`
          : `would take ${atFloor ? atFloor.length : 'more'} lines at the ${profile.minFontPt}pt floor, and a date label may take ${MARK_LABEL_LINES}`;
      return new Error(
        `TIMELINE_ZONE_TOO_NARROW: the date label "${mark.label}" has ${inches(boxes[i].w)}in ` +
          `between its neighbours but ${why}. Give the timeline a wider space, space the marks ` +
          'further apart, or shorten the label; the drawing never splits a word.'
      );
    }
    markLines.push(lines);
  }
  const mostLines = n.marks.length ? Math.max(1, ...markLines.map((l) => l.length)) : 0;
  const markRowH = n.marks.length ? T.blockHeight(mostLines, pt) : 0;
  const markLabelH = n.marks.length ? rows * markRowH + (rows - 1) * MARK_ROW_GAP * pt : 0;

  const stem = n.text ? T.wrap(n.text, pt, inner, true) : [];
  if (stem === null) return new Error(`TIMELINE_ZONE_TOO_NARROW: a word in the text "${n.text}" is wider than the timeline.`);
  const caption = n.caption ? T.wrap(n.caption, pt, inner, false) : [];
  if (caption === null) return new Error(`TIMELINE_ZONE_TOO_NARROW: a word in the caption "${n.caption}" is wider than the timeline.`);
  const stemBlock = stem.length ? T.blockHeight(stem.length, pt) + STEM_GAP * pt : 0;
  const captionBlock = caption.length ? CAPTION_GAP * pt + T.blockHeight(caption.length, pt) : 0;
  const belowLine = n.marks.length ? (TICK_H + MARK_GAP) * pt + markLabelH : (END_CAP_H / 2) * pt;
  const aboveFixed = n.eras.length ? ERA_GAP * pt : (END_CAP_H / 2) * pt;
  const fixed = 2 * PAD * pt + stemBlock + aboveFixed + (LINE_THICK / 2) * pt + belowLine + captionBlock;

  // Natural height at full-size bands, then squeeze the bands (only) toward
  // their floor when the space is shorter than that.
  let eraH = n.eras.length ? ERA_H_MAX * pt : 0;
  if (n.eras.length && profile.heightPt && fixed + eraH > profile.heightPt) {
    eraH = Math.max(ERA_H_MIN * pt, profile.heightPt - fixed);
  }
  const h = fixed + eraH;
  if (profile.heightPt && h > profile.heightPt + 0.5) {
    return new Error(
      `TIMELINE_ZONE_TOO_SHORT: this timeline needs ${inches(h)}in of height ` +
        `(era bands at their floor, the line, ${mostLines}-line date labels at ${pt}pt` +
        (stem.length ? ', its text line' : '') +
        (caption.length ? ', its caption' : '') +
        `) but the space is ${inches(profile.heightPt)}in tall. Raise this block's share of the ` +
        'stack, drop the caption or text line, or give it a taller space; nothing was shrunk further or cut.'
    );
  }
  const stemY = PAD * pt;
  const eraY = stemY + stemBlock;
  const lineY = eraY + eraH + aboveFixed + (LINE_THICK / 2) * pt;
  const captionY = lineY + (LINE_THICK / 2) * pt + belowLine + CAPTION_GAP * pt;
  return { pt, W, h, left, right, inner, lineX0, lineW, lineY, eraY, eraH, stem, stemY, caption, captionY, boxes, markLines, markRowH, rows };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const L = T.settle(profile, (pt) => layoutAt(n, profile, pt));
  return { ...L, n, profile };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile, n } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const ink = profile.palette === 'ink';
  const fills = ink ? ERA_FILLS_INK : ERA_FILLS;
  const parts = [];
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra}/>`;

  if (L.stem.length) parts.push(T.textLines(L.stem, L.left, L.stemY, pt, { fill: c.ink, font, bold: true, anchor: 'start' }));

  n.eras.forEach((era, i) => {
    const x = L.lineX0 + era.from * L.lineW;
    const w = (era.to - era.from) * L.lineW;
    parts.push(rect(x, L.eraY, w, L.eraH, fills[i % fills.length], ` class="timeline-era" stroke="${ERA_LINE}" stroke-width="1"`));
    if (era.label) parts.push(T.textLines([era.label], x + w / 2, L.eraY + (L.eraH - T.blockHeight(1, pt)) / 2, pt, { fill: c.ink, font, bold: true }));
  });

  const capH = END_CAP_H * pt;
  parts.push(rect(L.lineX0, L.lineY - (LINE_THICK * pt) / 2, L.lineW, LINE_THICK * pt, c.ink));
  parts.push(rect(L.left, L.lineY - capH / 2, END_CAP_W * pt, capH, c.ink));
  parts.push(rect(L.right - END_CAP_W * pt, L.lineY - capH / 2, END_CAP_W * pt, capH, c.ink));

  // Ticks hang from the line; labels sit under their tick's foot. A lower-row
  // date's tick runs past the row above, so it still points at its own label.
  n.marks.forEach((mark, i) => {
    const b = L.boxes[i];
    const drop = b.row * (L.markRowH + MARK_ROW_GAP * pt);
    parts.push(rect(b.tickX - (TICK_W * pt) / 2, L.lineY, TICK_W * pt, TICK_H * pt + drop, c.ink, ' class="timeline-tick"'));
    const lines = L.markLines[i];
    if (lines.length) {
      const anchor = b.align === 'left' ? 'start' : b.align === 'right' ? 'end' : 'middle';
      const x = b.align === 'left' ? b.x : b.align === 'right' ? b.x + b.w : b.x + b.w / 2;
      parts.push(T.textLines(lines, x, L.lineY + (TICK_H + MARK_GAP) * pt + drop, pt, { fill: c.ink, font, bold: true, anchor }));
    }
  });

  if (L.caption.length) {
    parts.push(T.textLines(L.caption, L.W / 2, L.captionY, pt, { fill: ink ? c.ink : DIM, font, bold: false, italic: true }));
  }
  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `timeline:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, markLabelBoxes, EDGE };
