'use strict';

const { drawGroupAccent } = require('./group-accent');

// ─── CONSTANTS ────────────────────────────────────────────────
const GAP = 0.10;
const MIN_HEIGHT_RATIO = 0.35;
const VERTICAL_ALIGNS = new Set(['top', 'center', 'bottom']);
// ─── END CONSTANTS ────────────────────────────────────────────

function stackLayout(zone, data, ctx) {
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

  const heights = items.map(function (_item, i) {
    return contentH * (weights[i] / totalWeight);
  });

  const zoneFor = function (item, y, h) {
    return {
      x: zone.x,
      y: y,
      w: zone.w,
      h: h,
      class: zone.class,
      noCard: zone.noCard,
      compactCards: zone.compactCards
    };
  };

  reflowToUseSpareHeight(items, heights, zone, zoneFor, ctx);

  let cursorY = zone.y + offsetY;

  return items.map(function (item, i) {
    const subZone = zoneFor(item, cursorY, heights[i]);
    cursorY += heights[i] + GAP;
    return { item, zone: subZone };
  });
}

// A weight settles a share of the height before anything has been measured, and
// most things in a stack do not use their share: a photograph or a map is
// contain-fitted and its card hugs it, so the difference used to become a band
// of background under it while the rest of the slide made do. Two Year 4
// geography slides carried an inch of nothing under the map with the task above
// it at 14pt, and the room to fix that was sitting in the same zone all along.
//
// So the items that hug hand back what they do not use, and the items that can
// genuinely use height take it: a picture grows into it (a bigger map is a more
// readable map) and a fill-text card grows its type into it. Nothing moves if
// nothing can be measured, so a stack the measurer knows nothing about lays out
// exactly as it always did.
const REFLOW_FLOOR = 0.12;

function canUseMoreHeight(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.type === 'image') return true;
  return item.type === 'text' &&
    String(item.heightMode || '').toLowerCase() === 'fill';
}


// How much height this stack actually wants.
//
// The companion to reflowToUseSpareHeight below: that hands spare room from a
// hugging item to a growing SIBLING, but when a stack contains nothing that can
// grow, the room it does not use simply sits there. Reporting the stack's real
// appetite lets whatever owns the zone - a template deciding how much of the
// board to give the question - spend it on something that will use it.
//
// Same honesty rule as a row: if any item cannot be measured, say nothing.
function measureStack(zone, data, ctx) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;

  const { measureCompositionExtent } = require('./index');
  const weights = items.map(function (it) {
    return (it && typeof it.weight === 'number' && it.weight > 0) ? it.weight : 1;
  });
  const totalWeight = weights.reduce(function (a, b) { return a + b; }, 0);
  const totalGap = GAP * (items.length - 1);
  const availH = Math.max(0, zone.h - totalGap);

  let wanted = 0;
  for (let i = 0; i < items.length; i += 1) {
    const share = availH * (weights[i] / totalWeight);
    const extent = measureCompositionExtent(
      { x: zone.x, y: zone.y, w: zone.w, h: share,
        class: zone.class, noCard: zone.noCard, compactCards: zone.compactCards },
      items[i],
      ctx
    );
    if (!extent) return null;
    wanted += Math.min(extent.h, share);
  }

  const h = wanted + totalGap;
  return h > 0 ? { h: Math.min(h, zone.h) } : null;
}

function reflowToUseSpareHeight(items, heights, zone, zoneFor, ctx) {
  if (!ctx) return;
  const { measureContentExtent } = require('./index');
  const growers = [];
  let released = 0;

  items.forEach(function (item, i) {
    if (canUseMoreHeight(item)) {
      growers.push(i);
      return;
    }
    let extent = null;
    try {
      extent = measureContentExtent(zoneFor(item, zone.y, heights[i]), item, ctx);
    } catch {
      extent = null;
    }
    if (!extent) return;
    const spare = heights[i] - extent.h;
    if (spare > REFLOW_FLOOR) {
      heights[i] = extent.h;
      released += spare;
    }
  });

  if (!growers.length || released <= REFLOW_FLOOR) return;
  const share = released / growers.length;
  growers.forEach(function (i) {
    heights[i] += share;
  });
}

function drawStack(pptx, slide, zone, data, ctx) {
  const layout = stackLayout(zone, data, ctx);
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
  stackLayout,
  measureStack
};
