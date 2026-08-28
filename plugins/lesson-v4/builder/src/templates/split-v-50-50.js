'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { warn } = require('../warnings');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_Y = 0.20;
// ─── END COORDINATES ──────────────────────────────────────────

function drawSplitV5050(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  const rowH = (bz.h - GAP_Y) / 2;
  const topZone    = { x: bz.x, y: bz.y,                 w: bz.w, h: rowH, class: 'C' };
  const bottomZone = { x: bz.x, y: bz.y + rowH + GAP_Y,  w: bz.w, h: rowH, class: 'C' };

  // Accept the same `primary`/`secondary` slot names every other split template
  // uses, so a spec written in that convention renders here too — a symmetric
  // split is otherwise the one place the naming flips, and a mismatch silently
  // blanks the body. `top`/`bottom` stay valid as the positional aliases.
  // (primarySide doesn't change a symmetric layout, so it is ignored here.)
  const topContent    = data.primary   != null ? data.primary   : data.top;
  const bottomContent = data.secondary != null ? data.secondary : data.bottom;

  if (topContent == null && bottomContent == null) {
    warn(ctx.slideIndex, 'split-v-50-50 received no content for its zones — expected `primary`/`secondary` (or `top`/`bottom`); the slide body is blank');
    return;
  }

  if (topContent    != null) drawContent(pptx, slide, topZone,    topContent,    ctx);
  if (bottomContent != null) drawContent(pptx, slide, bottomZone, bottomContent, ctx);
}

module.exports = { drawSplitV5050 };
