'use strict';

const { drawGroupAccent } = require('./group-accent');

// ─── CONSTANTS ────────────────────────────────────────────────
const GAP = 0.10;
const MIN_HEIGHT_RATIO = 0.35;
const VERTICAL_ALIGNS = new Set(['top', 'center', 'bottom']);
// ─── END CONSTANTS ────────────────────────────────────────────

function stackLayout(zone, data) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return [];

  const weights = items.map(function (it) {
    return (it && typeof it.weight === 'number' && it.weight > 0)
      ? it.weight
      : 1;
  });
  const totalWeight = weights.reduce(function (a, b) {
    return a + b;
  }, 0);

  const ratio = data.heightRatio == null
    ? 1
    : Number(data.heightRatio);

  if (
    !Number.isFinite(ratio) ||
    ratio < MIN_HEIGHT_RATIO ||
    ratio > 1
  ) {
    throw new Error(
      `STACK_HEIGHT_RATIO_INVALID: heightRatio must be between ` +
      `${MIN_HEIGHT_RATIO} and 1; found ${JSON.stringify(data.heightRatio)}.`
    );
  }

  const verticalAlign = String(
    data.verticalAlign || 'top'
  ).toLowerCase();

  if (!VERTICAL_ALIGNS.has(verticalAlign)) {
    throw new Error(
      `STACK_VERTICAL_ALIGN_INVALID: verticalAlign must be top, center or bottom; ` +
      `found ${JSON.stringify(data.verticalAlign)}.`
    );
  }

  const totalGap = GAP * (items.length - 1);
  const availH = Math.max(0, zone.h - totalGap);
  const contentH = availH * ratio;
  const occupiedH = contentH + totalGap;
  const slack = Math.max(0, zone.h - occupiedH);

  let offsetY = 0;
  if (verticalAlign === 'center') {
    offsetY = slack / 2;
  } else if (verticalAlign === 'bottom') {
    offsetY = slack;
  }

  let cursorY = zone.y + offsetY;

  return items.map(function (item, i) {
    const itemH = contentH * (weights[i] / totalWeight);
    const subZone = {
      x: zone.x,
      y: cursorY,
      w: zone.w,
      h: itemH,
      class: zone.class,
      noCard: zone.noCard,
      compactCards: zone.compactCards
    };

    cursorY += itemH + GAP;

    return {
      item,
      zone: subZone
    };
  });
}

function drawStack(pptx, slide, zone, data, ctx) {
  const layout = stackLayout(zone, data);
  if (layout.length === 0) return;

  const { drawContent } = require('./index');

  layout.forEach(function (entry) {
    drawContent(
      pptx,
      slide,
      entry.zone,
      entry.item,
      ctx
    );
  });

  drawGroupAccent(
    pptx,
    slide,
    zone,
    data.groupAccent
  );
}

module.exports = {
  drawStack,
  stackLayout
};
