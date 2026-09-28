'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const SIDEBAR_RATIO = 0.30;
const BANNER_H      = 0.70;
const GAP_X         = 0.20;
const GAP_Y         = 0.15;
// ─── END COORDINATES ──────────────────────────────────────────

// A picture keeps its own shape, so a wide one in the body is held by the
// column's width and cannot use the column's height. Its card hugs it and a
// hugged card sits at the top of its zone, so a 2.6:1 drawing from the 1842
// mines report sat under the banner with 1.8in of empty slide below it while
// the key-point cards beside it ran the full height (a Year 4 history Teach
// slide, 27 September 2026). The picture cannot grow without being stretched,
// or without taking width from the cards, whose words would then shrink.
//
// So the height the picture cannot use goes to the banner above it. The banner
// is the slide's lead line, the sentence the slide lands, and a taller banner
// lets it print larger: the column keeps the cards' top and bottom edges, the
// picture sits straight under the lead and nothing is left empty. Words in the
// body, such as a reading passage, keep the zone they had.
const SPARE_TAKING_BODY_TYPES = new Set(['image', 'label-diagram', 'circuit-diagram', 'parachute-forces']);
const SPARE_MIN = 0.30;

function bannerTakesSpare(bannerZone, bodyZ, data, ctx) {
  const unchanged = { bannerZone, bodyZone: bodyZ, banner: data.banner };
  if (!data.banner || !data.body || !SPARE_TAKING_BODY_TYPES.has(data.body.type)) return unchanged;
  const { measureContentExtent } = require('../content');
  const extent = measureContentExtent(bodyZ, data.body, ctx);
  if (!extent || !(extent.h > 0)) return unchanged;
  const spare = bodyZ.h - extent.h;
  if (spare < SPARE_MIN) return unchanged;
  // The lead fills its taller card rather than hugging the top of it.
  const banner = data.banner.type === 'text' && !data.banner.heightMode
    ? Object.assign({}, data.banner, { heightMode: 'fill' })
    : data.banner;
  return {
    bannerZone: Object.assign({}, bannerZone, { h: bannerZone.h + spare }),
    bodyZone: Object.assign({}, bodyZ, { y: bodyZ.y + spare, h: extent.h }),
    banner
  };
}

function drawBodySidebar(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const sidebarW = (bz.w - GAP_X) * SIDEBAR_RATIO;
  const leftW    = bz.w - GAP_X - sidebarW;

  const bannerZone = { x: bz.x, y: bz.y,                          w: leftW, h: BANNER_H,               class: 'B'      };
  const bodyZ      = { x: bz.x, y: bz.y + BANNER_H + GAP_Y,       w: leftW, h: bz.h - BANNER_H - GAP_Y, class: 'E-wide' };
  const sidebarZone = { x: bz.x + leftW + GAP_X, y: bz.y,         w: sidebarW, h: bz.h,                class: 'E-narrow' };

  // A picture that cannot use the body's height gives it to the banner.
  const fitted = bannerTakesSpare(bannerZone, bodyZ, data, ctx);

  if (data.banner)  drawContent(pptx, slide, fitted.bannerZone, fitted.banner, ctx);
  if (data.body)    drawContent(pptx, slide, fitted.bodyZone,   data.body,     ctx);
  if (data.sidebar) drawContent(pptx, slide, sidebarZone, data.sidebar, ctx);
}

module.exports = { drawBodySidebar };
