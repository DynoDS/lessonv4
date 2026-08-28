'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { warn } = require('../warnings');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_X = 0.20;
// ─── END COORDINATES ──────────────────────────────────────────

function drawSplitH5050(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  const colW = (bz.w - GAP_X) / 2;
  const leftZone  = { x: bz.x,                 y: bz.y, w: colW, h: bz.h, class: 'C' };
  const rightZone = { x: bz.x + colW + GAP_X,  y: bz.y, w: colW, h: bz.h, class: 'C' };

  // Accept the same `primary`/`secondary` slot names every other split template
  // uses, so a spec written in that convention renders here too — a symmetric
  // split is otherwise the one place the naming flips, and a mismatch silently
  // blanks the body. `left`/`right` stay valid as the positional aliases.
  // (primarySide doesn't change a symmetric layout, so it is ignored here.)
  const leftContent  = data.primary   != null ? data.primary   : data.left;
  const rightContent = data.secondary != null ? data.secondary : data.right;

  if (leftContent == null && rightContent == null) {
    warn(ctx.slideIndex, 'split-h-50-50 received no content for its zones — expected `primary`/`secondary` (or `left`/`right`); the slide body is blank');
    return;
  }

  if (leftContent  != null) drawContent(pptx, slide, leftZone,  leftContent,  ctx);
  if (rightContent != null) drawContent(pptx, slide, rightZone, rightContent, ctx);
}

module.exports = { drawSplitH5050 };
