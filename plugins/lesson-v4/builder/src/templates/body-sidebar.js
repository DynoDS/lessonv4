'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const SIDEBAR_RATIO = 0.30;
const BANNER_H      = 0.70;
const GAP_X         = 0.20;
const GAP_Y         = 0.15;
// The banner is one line tall, and it takes a second or a third when its
// sentence needs them at the readable size. At one fixed line it held about
// 68 characters, and a lesson's headline is often a sentence of 90 or 100:
// eight of ten slide runs on 4 October 2026 were refused here (forty refusals
// between them), and each time the designer gave up the layout or moved the
// headline to another slide. The height comes off the picture below, which has
// it to spare; past three lines the lead is a paragraph and belongs in a card,
// so it is still refused by name.
const BANNER_MAX_H  = 1.30;
const BANNER_PT     = 18;
// ─── END COORDINATES ──────────────────────────────────────────

function bannerHeight(banner, width, ctx) {
  if (!banner || banner.type !== 'text') return BANNER_H;
  const { textNeed } = require('../content/stack');
  const need = textNeed(banner, { w: width }, BANNER_PT, ctx);
  if (!Number.isFinite(need) || need <= BANNER_H) return BANNER_H;
  return Math.min(need, BANNER_MAX_H);
}

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

  const bannerH = bannerHeight(data.banner, leftW, ctx);
  const bannerZone = { x: bz.x, y: bz.y,                          w: leftW, h: bannerH,               class: 'B'      };
  const bodyZ      = { x: bz.x, y: bz.y + bannerH + GAP_Y,        w: leftW, h: bz.h - bannerH - GAP_Y, class: 'E-wide' };
  const sidebarZone = { x: bz.x + leftW + GAP_X, y: bz.y,         w: sidebarW, h: bz.h,                class: 'E-narrow' };

  // A picture that cannot use the body's height gives it to the banner.
  const fitted = bannerTakesSpare(bannerZone, bodyZ, data, ctx);

  if (data.banner)  drawContent(pptx, slide, fitted.bannerZone, fitted.banner, ctx);
  if (data.body)    drawContent(pptx, slide, fitted.bodyZone,   data.body,     ctx);
  if (data.sidebar) drawContent(pptx, slide, sidebarZone, data.sidebar, ctx);
}

module.exports = { drawBodySidebar };
