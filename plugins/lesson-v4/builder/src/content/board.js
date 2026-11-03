'use strict';

// A Teach slide arranged from what it holds, not from a named shape.
//
// In a Year 4 geography lesson (2 November 2026) a slide held two pictures, one
// line and a line to remember. No named layout took that, so the Sahara shrank
// to an inset in the corner of the rainforest. A speaker, a map or the success
// criteria beside more than one picture hit the same wall. A layout per
// combination never ends, so the `flexible` layout says only what is on the
// slide and this file finds the room, with the teacher's rules from seeing the
// first sketches of it:
//
//   Pictures that belong together are one size. "They're not the same height ...
//   that visual jump is awful." So a set shares one frame, and a photograph takes
//   a light centred crop to reach it (CROP_ALLOWANCE). A map, a labelled drawing
//   or a photograph marked `keepWhole` is never cropped: the others match its
//   shape, and where they cannot they still match its height.
//
//   Room goes to what is most useful. "Surely the most important part are the
//   pictures." Words are measured at a reading size and take only that; pictures
//   take everything left, in whichever grid gives them the most.
//
//   No dead space. Criteria beside the pictures were narrow and stopped short,
//   with room going spare under them, so they stand under the pictures beside
//   the words: each step reads on fewer lines, and the pictures take the width.
//
// It is an ordinary stack (`board: true`) so every check that walks a slide's
// content reads it as it reads any other.

const { imageAspect, PICTURE_READABLE_FLOOR } = require('./image');

// ─── CONSTANTS ────────────────────────────────────────────────
const GAP = 0.12;
const WORD_SIZES = [28, 24, 20];     // tried largest first, until the pictures clear their floor
const LEAD_SIZE = 32;
const CAPTION_SIZE = 28;
const CROP_ALLOWANCE = 0.25;         // the most of a photograph's width or height a set may trim
const PANEL_W = 3.8;
const STRIP_PANEL_W = 5.4;            // criteria beside the words, under the pictures
const PANEL_READING_SIZE = 26;
const PANEL_TALLEST = 3.2;
const SIDE_WORD_WIDTHS = [3.4, 4.2];
const ONE_ROW_PREFERENCE = 1.3;      // pictures side by side win a near tie: that is how a class compares them
const BELOW_PREFERENCE = 1.1;        // words along the bottom win a near tie: they leave the pictures one block
const ROOMY_SIZE = 32;               // words may rise to this when the pictures can use no more of the slide
const STRETCH_FROM = 0.6;            // a column of words this near the pictures' height lines up with them
const FLOORS = { 1: 3.0, 2: 2.2 };
// ─── END CONSTANTS ───────────────────────────────────────────

function isBoard(data) {
  return !!data && data.type === 'stack' && data.board === true;
}

function pictureOf(item) {
  return item.boardCell ? item.items[0] : item;
}

function captionOf(item) {
  return item.boardCell ? item.items[1] : null;
}

function isWords(item) {
  return item.type === 'text';
}

function sorted(data) {
  const parts = { lead: null, visuals: [], words: [], panel: null };
  data.items.forEach((item) => {
    if (item.boardLead) parts.lead = item;
    else if (item.type === 'sc-panel') parts.panel = item;
    else if (isWords(item)) parts.words.push(item);
    else parts.visuals.push(item);
  });
  return parts;
}

// A figure's own proportions, from the drawing that would be placed. Null when
// it does not say, and the figure then takes whatever frame the set settles on.
function figureAspect(item, cell, ctx) {
  const { placedRectFor } = require('./shared-figure');
  try {
    const rect = placedRectFor(item.type)(cell, item, ctx);
    return rect && rect.w > 0 && rect.h > 0 ? rect.w / rect.h : null;
  } catch {
    return null;
  }
}

// The range of shapes this visual can be drawn at. A picture still to arrive
// has no range: it fills whatever frame its set takes, so its place on the board
// does not move when the photograph lands.
function shapeOf(visual, cell, ctx) {
  const item = pictureOf(visual);
  if (item.type !== 'image') {
    const aspect = figureAspect(item, cell, ctx);
    return aspect ? { lo: aspect, hi: aspect } : null;
  }
  const aspect = imageAspect(Object.assign({}, item, { fit: 'contain' }), ctx);
  if (!aspect || aspect === 1) return aspect === 1 ? { lo: 0.8, hi: 1.25 } : null;
  if (item.keepWhole || item.inset) return { lo: aspect, hi: aspect };
  return { lo: aspect * (1 - CROP_ALLOWANCE), hi: aspect / (1 - CROP_ALLOWANCE) };
}

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

// The one shape a set shares: as near the cell's own as every picture can reach.
function sharedAspect(shapes, cellAspect) {
  const known = shapes.filter(Boolean);
  if (!known.length) return cellAspect;
  const lo = Math.max.apply(null, known.map((s) => s.lo));
  const hi = Math.min.apply(null, known.map((s) => s.hi));
  if (lo <= hi) return clamp(cellAspect, lo, hi);
  return clamp(cellAspect, Math.min(lo, hi), Math.max(lo, hi));
}

const GRIDS = { 1: [[1]], 2: [[2], [1, 1]], 3: [[3], [2, 1]], 4: [[4], [2, 2]] };

// Every visual in `rows`, one height throughout, in the largest frame the box
// allows. Widths match too unless some picture cannot reach the shared shape.
function gridIn(box, visuals, rows, captionH, ctx) {
  const across = Math.max.apply(null, rows);
  const cellW = (box.w - GAP * (across - 1)) / across;
  const cellH = (box.h - GAP * (rows.length - 1)) / rows.length - captionH;
  if (!(cellW > 0.5) || !(cellH > 0.5)) return null;
  const cell = { x: 0, y: 0, w: cellW, h: cellH };
  const shapes = visuals.map((visual) => shapeOf(visual, cell, ctx));
  const aspect = sharedAspect(shapes, cellW / cellH);
  const aspects = shapes.map((s) => (s ? clamp(aspect, s.lo, s.hi) : aspect));
  let h = cellH;
  let at = 0;
  rows.forEach((count) => {
    const inRow = aspects.slice(at, at + count).reduce((sum, a) => sum + a, 0);
    h = Math.min(h, (box.w - GAP * (count - 1)) / inRow);
    at += count;
  });
  const placed = [];
  at = 0;
  rows.forEach((count, r) => {
    const widths = aspects.slice(at, at + count).map((a) => h * a);
    const rowW = widths.reduce((sum, w) => sum + w, 0) + GAP * (count - 1);
    let x = (box.w - rowW) / 2;
    widths.forEach((w) => {
      placed.push({ x, y: r * (h + captionH + GAP), w, h });
      x += w + GAP;
    });
    at += count;
  });
  const area = placed.reduce((sum, p) => sum + p.w * p.h, 0);
  return {
    placed,
    h: rows.length * (h + captionH) + GAP * (rows.length - 1),
    area,
    score: rows.length === 1 ? area * ONE_ROW_PREFERENCE : area,
    short: Math.min.apply(null, placed.map((p) => Math.min(p.w, p.h)))
  };
}

function bestGrid(box, visuals, captionH, ctx) {
  return GRIDS[visuals.length]
    .map((rows) => gridIn(box, visuals, rows, captionH, ctx))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)[0] || null;
}

function wordNeed(item, width, pt, ctx) {
  const { textNeed } = require('./stack');
  const probe = Object.assign({}, item, { heightMode: undefined, fontSize: undefined });
  const need = textNeed(probe, { x: 0, y: 0, w: width, h: 7 }, pt, ctx, true);
  return need === null ? 1 : need;
}

// The words along the bottom in equal rows of equal cards. Three cards may go
// two and one when that is shallower: a long line to remember takes a row of its
// own rather than making three narrow cards all five lines deep.
function bandRows(count) {
  if (count === 3) return [[3], [2, 1]];
  if (count === 4) return [[2, 2]];
  return [[count]];
}

function bandShape(words, width, pt, ctx) {
  const shapes = bandRows(words.length).map((rows) => {
    let at = 0;
    const laid = rows.map((across) => {
      const cards = words.slice(at, at + across);
      at += across;
      const cardW = (width - GAP * (across - 1)) / across;
      const cardH = Math.max.apply(null, cards.map((w) => wordNeed(w, cardW, pt, ctx)));
      return { cards, cardW, cardH };
    });
    const h = laid.reduce((sum, row) => sum + row.cardH, 0) + GAP * (rows.length - 1);
    return { laid, h };
  });
  return shapes.sort((a, b) => a.h - b.h)[0];
}

function captionHeight(visuals, width, ctx) {
  const captions = visuals.map(captionOf).filter(Boolean);
  if (!captions.length) return 0;
  const cellW = (width - GAP * (visuals.length - 1)) / visuals.length;
  return GAP + Math.max.apply(null, captions.map((c) => wordNeed(c, cellW, CAPTION_SIZE, ctx)));
}

// Every way of sharing the box that keeps the words at `pt`, best first.
function candidates(box, parts, pt, ctx) {
  const { visuals, words, panel } = parts;
  const out = [];
  const panelW = panel ? PANEL_W + GAP : 0;
  const tryIt = (picBox, place, score) => {
    const grid = bestGrid(picBox, visuals, captionHeight(visuals, picBox.w, ctx), ctx);
    if (grid) out.push(Object.assign({ grid, picBox, score: grid.area * score, pt }, place));
  };
  if (!words.length) {
    tryIt({ w: box.w - panelW, h: box.h }, { side: null }, 1);
  } else if (panel) {
    const { panelNeed } = require('./stack');
    const stripW = box.w - STRIP_PANEL_W - GAP;
    const needs = words.map((w) => wordNeed(w, stripW, pt, ctx));
    const wordsH = needs.reduce((sum, n) => sum + n, 0) + GAP * (words.length - 1);
    const panelH = panelNeed(panel, { x: 0, y: 0, w: STRIP_PANEL_W, h: PANEL_TALLEST, class: 'C' },
      PANEL_READING_SIZE, PANEL_TALLEST, ctx) || PANEL_TALLEST;
    const { huggedHeight } = require('../success-criteria-panel');
    const drawnH = huggedHeight({ x: 0, y: 0, w: STRIP_PANEL_W, h: panelH, class: 'C' }, panel.content || panel.criteria, ctx);
    const stripH = Math.max(wordsH, drawnH);
    tryIt({ w: box.w, h: box.h - stripH - GAP }, { side: 'strip', stripW, stripH, panelH, needs }, 1);
  } else {
    const band = bandShape(words, box.w, pt, ctx);
    tryIt({ w: box.w, h: box.h - band.h - GAP }, { side: false, band }, BELOW_PREFERENCE);
    SIDE_WORD_WIDTHS.forEach((sideW) => {
      const needs = words.map((w) => wordNeed(w, sideW, pt, ctx));
      const total = needs.reduce((sum, n) => sum + n, 0) + GAP * (words.length - 1);
      if (total <= box.h) tryIt({ w: box.w - sideW - GAP, h: box.h }, { side: true, sideW, needs }, 1);
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

function arrange(box, parts, ctx) {
  const floor = FLOORS[parts.visuals.length] || PICTURE_READABLE_FLOOR;
  let last = null;
  for (const pt of WORD_SIZES) {
    const best = candidates(box, parts, pt, ctx)[0];
    if (!best) continue;
    last = best;
    if (best.grid.short >= floor) return best;
  }
  return last;
}

function drawWordCard(pptx, slide, rect, item, pt, ctx) {
  const { drawContent } = require('./index');
  drawContent(pptx, slide, Object.assign({ packedCard: true }, rect),
    Object.assign({}, item, { heightMode: 'fill', fontSize: pt, sizeGroup: 'board-words' }), ctx);
}

function drawBand(pptx, slide, zone, band, pt, ctx) {
  let y = zone.y;
  band.laid.forEach((row) => {
    row.cards.forEach((item, i) => {
      drawWordCard(pptx, slide, {
        x: zone.x + i * (row.cardW + GAP), y, w: row.cardW, h: row.cardH, class: zone.class
      }, item, pt, ctx);
    });
    y += row.cardH + GAP;
  });
}

// Words beside the pictures: as tall as they need, centred on the pictures, and
// lined up with them top and bottom when they are nearly that tall already.
function drawSideWords(pptx, slide, zone, words, needs, sideW, pt, ctx, alwaysLineUp) {
  const total = needs.reduce((sum, n) => sum + n, 0) + GAP * (words.length - 1);
  const stretch = alwaysLineUp || total >= zone.h * STRETCH_FROM ? (zone.h - GAP * (words.length - 1)) / (total - GAP * (words.length - 1)) : 1;
  let y = zone.y + (stretch === 1 ? (zone.h - total) / 2 : 0);
  needs.forEach((need, i) => {
    const h = need * stretch;
    drawWordCard(pptx, slide, { x: zone.x, y, w: sideW, h, class: zone.class }, words[i], pt, ctx);
    y += h + GAP;
  });
}

// The words' size once the pictures have all they can use: the reading size, or
// larger while the height left over will hold it.
function settledBand(words, width, spareH, plan, ctx) {
  const roomy = bandShape(words, width, ROOMY_SIZE, ctx);
  if (roomy.h <= spareH) return { band: roomy, pt: ROOMY_SIZE };
  return { band: plan.band, pt: plan.pt };
}

function drawVisual(pptx, slide, frame, visual, ctx) {
  const { drawContent } = require('./index');
  const item = pictureOf(visual);
  const crops = item.type === 'image' && !item.keepWhole && !item.inset;
  drawContent(pptx, slide, frame, crops ? Object.assign({}, item, { fit: 'cover' }) : item, ctx);
  const caption = captionOf(visual);
  if (caption) {
    const captionY = frame.y + frame.h + GAP;
    drawContent(pptx, slide, { x: frame.x, y: captionY, w: frame.w, h: frame.captionH, class: frame.class, packedCard: true },
      Object.assign({}, caption, { heightMode: 'fill', fontSize: CAPTION_SIZE, sizeGroup: 'captions' }), ctx);
  }
}

function drawBoard(pptx, slide, zone, data, ctx) {
  const { drawContent } = require('./index');
  const parts = sorted(data);
  let top = zone.y;
  let room = zone.h;
  if (parts.lead) {
    const leadH = wordNeed(parts.lead, zone.w, LEAD_SIZE, ctx);
    drawContent(pptx, slide, { x: zone.x, y: top, w: zone.w, h: leadH, class: zone.class, packedCard: true },
      Object.assign({}, parts.lead, { heightMode: 'fill', fontSize: LEAD_SIZE, sizeGroup: 'board-lead' }), ctx);
    top += leadH + GAP;
    room -= leadH + GAP;
  }
  const plan = arrange({ w: zone.w, h: room }, parts, ctx);
  if (!plan) return;

  const { grid, picBox, pt } = plan;
  const captionH = captionHeight(parts.visuals, picBox.w, ctx);
  const rawH = captionH ? captionH - GAP : 0;
  const below = plan.side === false ? settledBand(parts.words, zone.w, room - grid.h - GAP, plan, ctx) : null;
  const bandH = below ? below.band.h : 0;

  const topH = grid.h;
  const strip = plan.side === 'strip';
  const used = topH + (below ? GAP + bandH : 0) + (strip ? GAP + plan.stripH : 0);
  const startY = top + Math.max(0, room - used) / 2;
  const pictureY = startY;

  parts.visuals.forEach((visual, i) => {
    const p = grid.placed[i];
    drawVisual(pptx, slide, {
      x: zone.x + p.x, y: pictureY + p.y, w: p.w, h: p.h, class: zone.class, captionH: rawH
    }, visual, ctx);
  });

  if (strip) {
    const stripY = startY + topH + GAP;
    const roomy = parts.words.map((w) => wordNeed(w, plan.stripW, ROOMY_SIZE, ctx));
    const fitsRoomy = roomy.reduce((sum, n) => sum + n, 0) + GAP * (roomy.length - 1) <= plan.stripH;
    drawSideWords(pptx, slide, { x: zone.x, y: stripY, h: plan.stripH, class: zone.class },
      parts.words, plan.needs, plan.stripW, fitsRoomy ? ROOMY_SIZE : pt, ctx, true);
    drawContent(pptx, slide, {
      x: zone.x + zone.w - STRIP_PANEL_W, y: stripY, w: STRIP_PANEL_W, h: plan.panelH, class: zone.class
    }, parts.panel, ctx);
  } else if (parts.panel) {
    drawContent(pptx, slide, {
      x: zone.x + zone.w - PANEL_W, y: startY, w: PANEL_W, h: topH, class: zone.class
    }, parts.panel, ctx);
  }

  if (below) {
    drawBand(pptx, slide, { x: zone.x, y: startY + topH + GAP, class: zone.class }, below.band, below.pt, ctx);
  } else if (plan.side === true) {
    drawSideWords(pptx, slide, { x: zone.x + zone.w - plan.sideW, y: startY, h: grid.h, class: zone.class },
      parts.words, plan.needs, plan.sideW, pt, ctx);
  }
}

// The two sides of a comparison card, each a picture over its line. They stand
// in separate cards, so the shared size is settled here for both: the line takes
// what the longer of the two needs, and the pictures take one frame in the rest.
function drawComparedSides(pptx, slide, zones, sides, ctx) {
  const pictures = sides.map((side) => side.items[0]);
  const lines = sides.map((side) => side.items[1]);
  const zone = zones[0];
  const needAt = (pt) => Math.max.apply(null, lines.map((line) => wordNeed(line, zone.w, pt, ctx)));
  const cellH = zone.h - needAt(WORD_SIZES[0]) - GAP;
  const cell = { x: 0, y: 0, w: zone.w, h: cellH };
  const shapes = pictures.map((picture) => shapeOf(picture, cell, ctx));
  const aspect = sharedAspect(shapes, zone.w / cellH);
  const aspects = shapes.map((s) => (s ? clamp(aspect, s.lo, s.hi) : aspect));
  const h = Math.min(cellH, zone.w / Math.max.apply(null, aspects));
  const spare = zone.h - h - GAP;
  const pt = needAt(ROOMY_SIZE) <= spare ? ROOMY_SIZE : WORD_SIZES[0];
  zones.forEach((sideZone, i) => {
    const w = h * aspects[i];
    drawVisual(pptx, slide, {
      x: sideZone.x + (sideZone.w - w) / 2, y: sideZone.y, w, h,
      class: sideZone.class, noCard: true
    }, pictures[i], ctx);
    drawWordCard(pptx, slide, {
      x: sideZone.x, y: sideZone.y + h + GAP, w: sideZone.w, h: spare, class: sideZone.class, noCard: true
    }, lines[i], pt, ctx);
  });
}

module.exports = { isBoard, drawBoard, drawComparedSides, CROP_ALLOWANCE };
