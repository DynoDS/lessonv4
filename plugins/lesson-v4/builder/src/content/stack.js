'use strict';

const { drawGroupAccent } = require('./group-accent');
const { warn } = require('../warnings');

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

  const packed = packToContent(items, zone, data, ctx);
  let drawnItems = items;
  if (packed) {
    drawnItems = packed.items;
    for (let i = 0; i < heights.length; i += 1) heights[i] = packed.heights[i];
    offsetY = packed.offsetY;
  } else {
    settleByNeed(items, heights, zone, zoneFor, ctx);
    reflowToUseSpareHeight(items, heights, zone, zoneFor, ctx);
  }

  let cursorY = zone.y + offsetY;

  return drawnItems.map(function (item, i) {
    const subZone = zoneFor(item, cursorY, heights[i]);
    cursorY += heights[i] + GAP;
    // contentH and the weights travel with the zone so that a child refusing
    // for want of height can be told the weight that would give it, rather
    // than only the inches it is short.
    return {
      item,
      zone: subZone,
      weight: weights[i],
      otherWeight: totalWeight - weights[i],
      contentH
    };
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

// The hair of extra height asked for when advising a weight, so the result
// clears its floor instead of landing on it. See weightThatWouldFit below.
const FIT_MARGIN = 0.02;

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

  const packed = packToContent(items, zone, data, ctx);
  if (packed) return { h: packed.naturalH, packs: true };

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

// ─── settling the shares by what each item needs ──────────────────
//
// A weight is the designer's guess at how much of the height an item needs,
// written before anything is measured, and a stack used to hold every item to
// its guess. On a task slide that carries a case, a question, a photo and the
// success criteria, that guess is where the slide failed. A Year 4 PSHE task
// slide gave its criteria panel a share whose cards held one line each, so a
// 41-character criterion was refused at 18pt, and a Year 4 geography task slide
// refused its case text at 18pt while the question and the line to remember
// under it sat in room they did not use (27 September 2026). Both slides had
// the height; the weights put it in the wrong place, and each repair pass moved
// a weight and rebuilt.
//
// So when an item in a stack cannot hold its words at the 18pt floor in its
// share, the stack shares its height out by what each item needs instead:
// at the 20pt the board aims for when everything fits at that size, at 18pt
// when only that fits, with whatever is left over shared in proportion so
// nothing sits on its limit. A picture keeps the height its card reaches and
// gives the rest. Nothing moves on a slide where every item already fits its
// share, so a stack that lays out today lays out the same. When everything
// cannot fit at 18pt however it is shared, the shares follow the needs as
// closely as the height allows, and the item that still does not fit says so
// when it is drawn.
//
// Words are measured the way the fit pass measures them (Comic Sans widths
// wrapped at spaces, 1.2em for a paragraph's first line and 1.26em for each
// line after, fit_text_postprocess.py); a criteria panel is measured by drawing
// it on a slide nobody sees, because its own cards decide what it can hold.

const TEXT_BOX_PAD = 0.08;
const FIRST_LINE_EM = 1.2;
const NEXT_LINE_EM = 1.26;
const LINE_SAFETY = 1.02;
const FIT_PAD_H = 0.03;
const MEASURE_SAFETY = 0.03;
const STAR_INDENT = 0.50;
const TARGET_PT = 20;
const FLOOR_PT = 18;
const SETTLE_TOLERANCE = 0.01;

function visibleText(value) {
  return String(value == null ? '' : value)
    .replace(/^\s*✨\s*/, '')
    .replace(/\*\*|\|\||\[\[|\]\]|<<|>>|\{\{|\}\}/g, '');
}

// The height a plain text block needs to hold its words at `pt`, or null when
// the block is not one this can measure honestly: a fill card (its size is its
// family's), a line with a picture set into it, or a word too wide to break.
// A reveal pair needs the room of the longer of its question and its answer,
// so both slides of the pair settle the same way.
function textNeed(item, zone, pt, ctx) {
  if (!item || item.type !== 'text') return null;
  if (String(item.heightMode || '').toLowerCase() === 'fill') return null;
  if (item.picture) return null;
  let values = [item.value || item.text || ''];
  if (item.revealPair) {
    let pair = null;
    try {
      pair = require('./reveal-pair').pairedText(item, ctx);
    } catch {
      return null;
    }
    if (!pair) return null;
    values = [pair.question, pair.answer];
  }
  const size = Number.isFinite(item.fontSize) ? Math.min(item.fontSize, pt) : pt;
  const { wrappedLineCount, RENDER_SAFETY } = require('../glyph-width');
  let most = 0;
  for (const value of values) {
    const indent = /^\s*✨/.test(String(value)) ? STAR_INDENT : 0;
    // The glyph table carries a few per cent of width in hand so a box drawn
    // for its own words never comes up short; the fit pass measures the real
    // font without it. Counted with it, a line that fits the real font wraps
    // here, and one borderline line in each paragraph added up to a Year 4
    // geography column the fit pass held at 18pt being called too full for it.
    const availW = (zone.w - 2 * TEXT_BOX_PAD - indent) * RENDER_SAFETY;
    if (availW <= 0.3) return null;
    let ems = 0;
    for (const para of visibleText(value).split('\n')) {
      const n = para.trim() ? wrappedLineCount(para, size, availW, true) : 1;
      if (!Number.isFinite(n)) return null;
      ems += (FIRST_LINE_EM + NEXT_LINE_EM * (Math.max(1, n) - 1)) * LINE_SAFETY;
    }
    most = Math.max(most, ems);
  }
  if (!most) return null;
  return most * size / 72 + FIT_PAD_H + 2 * TEXT_BOX_PAD + MEASURE_SAFETY;
}

// The least height a criteria panel of steps can be drawn at with every
// criterion at `pt` or more, found by drawing it where nobody sees. Null for
// any other panel, or when the list does not fit at that size even at `most`,
// so the real draw says why in its own words.
function panelNeed(item, zone, pt, most, ctx) {
  if (!item || item.type !== 'sc-panel') return null;
  const content = item.content || item.criteria;
  if (!content || content.type !== 'steps') return null;
  const { drawContent } = require('./index');
  const { withoutRecording } = require('../warnings');
  const PptxGenJS = require('../require-global')('pptxgenjs');
  const barrier = ctx._cardBarrier;
  const container = ctx._containerType;
  const fits = function (h) {
    const dry = new PptxGenJS();
    try {
      withoutRecording(function () {
        drawContent(dry, dry.addSlide(), {
          x: zone.x, y: zone.y, w: zone.w, h: h,
          class: zone.class, noCard: zone.noCard, compactCards: zone.compactCards,
          measureFloorPt: pt
        }, item, ctx);
      });
      return true;
    } catch {
      return false;
    } finally {
      ctx._cardBarrier = barrier;
      ctx._containerType = container;
    }
  };
  if (!fits(most)) return null;
  let lo = 0.6;
  let hi = most;
  while (hi - lo > SETTLE_TOLERANCE) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid; else lo = mid;
  }
  return hi + SETTLE_TOLERANCE;
}

// What one item needs at `pt`, and whether it may take more: words and a
// criteria panel take; a picture keeps what its card reaches and gives the rest.
function itemNeed(item, zone, share, pt, most, ctx) {
  if (!item || typeof item !== 'object') return null;
  if (item.type === 'text') {
    const need = textNeed(item, zone, pt, ctx);
    return need == null ? null : { need, takes: true };
  }
  if (item.type === 'sc-panel') {
    const need = panelNeed(item, zone, pt, most, ctx);
    return need == null ? null : { need, takes: true };
  }
  if (item.type === 'image') {
    const { measureContentExtent } = require('./index');
    let extent = null;
    try {
      extent = measureContentExtent(Object.assign({}, zone, { h: share }), item, ctx);
    } catch {
      extent = null;
    }
    return extent ? { need: Math.min(share, extent.h), takes: false } : null;
  }
  return null;
}

function settleByNeed(items, heights, zone, zoneFor, ctx) {
  if (!ctx || items.length < 2) return;
  if (!items.some(function (it) { return it && (it.type === 'text' || it.type === 'sc-panel'); })) return;
  const measure = function (pt, most) {
    return items.map(function (item, i) {
      return itemNeed(item, zoneFor(item, zone.y, heights[i]), heights[i], pt, most, ctx);
    });
  };

  // The height the measurable items share between them; anything the stack
  // cannot measure (a nested container, a drawn figure) keeps its own share.
  const pool = function (needs) {
    return needs.reduce(function (sum, n, i) { return n ? sum + heights[i] : sum; }, 0);
  };

  const stackH = heights.reduce(function (sum, h) { return sum + h; }, 0);
  const atFloor = measure(FLOOR_PT, stackH);
  const short = atFloor.some(function (n, i) { return n && n.takes && n.need > heights[i] + SETTLE_TOLERANCE; });
  if (!short) return;

  const room = pool(atFloor);
  const total = function (needs) {
    return needs.reduce(function (sum, n) { return n ? sum + n.need : sum; }, 0);
  };
  // The items keep what they need and share what is left in proportion, so
  // no item is set down exactly on its limit.
  const shareOut = function (needs) {
    const takers = [];
    let kept = 0;
    needs.forEach(function (n, i) {
      if (!n) return;
      if (n.takes) takers.push(i);
      else { heights[i] = n.need; kept += n.need; }
    });
    const wanted = takers.reduce(function (sum, i) { return sum + needs[i].need; }, 0);
    const left = room - kept - wanted;
    takers.forEach(function (i) {
      heights[i] = needs[i].need + left * needs[i].need / wanted;
    });
  };

  const atTarget = measure(TARGET_PT, stackH);
  if (atTarget.every(function (n, i) { return !n === !atFloor[i]; }) && total(atTarget) <= room) {
    shareOut(atTarget);
    return;
  }
  if (total(atFloor) <= room) {
    shareOut(atFloor);
    return;
  }
  // No sharing of this height holds everything at 18pt. The weights stay as
  // written, so the refusal names the item they left short. When the stack has
  // measured every item it holds, it also says why moving a weight will not
  // mend it: the Year 4 PSHE task above spent its repair passes moving weights
  // in a column that did not have the room. With an item it cannot measure,
  // that item's weight might, so it says nothing.
  if (atFloor.some(function (n) { return !n; })) return;
  warn(ctx.slideIndex,
    'the words and criteria stacked in one ' + zone.w.toFixed(2) + 'in-wide zone need about ' +
    total(atFloor).toFixed(2) + 'in at the 18pt floor and have ' + room.toFixed(2) + 'in, so no ' +
    'weights will fit them. Give them more room: a wider zone, one of them on the other side ' +
    'of the slide, or the beat across two slides. Nothing was shrunk or cut.');
}

// ─── cards that fit their words, then line up ─────────────────────
//
// A card is sized to its own text, and the group of cards is then centred on
// what stands beside it, never stretched to its neighbour's height: the
// teacher's answer, 29 September 2026, when asked whether cards nearly as tall
// as a picture or criteria panel beside them should stretch to meet it, was to
// fit and centre, leaving a small even gap above and below. The teacher, 28
// September 2026, looking at "John Snow lived and worked in London." alone in a
// card half a slide tall: "I would rather it fit the text like it should and
// then align those cards with the other elements on the page." The model he
// pointed to was a place value chart centred against the two cards beside it.
//
// It used to be the other way round. A column of Teach cards filled equal
// slices of its height (13 and 18 September 2026: cards beside a picture that
// did not share its top and bottom read as "not lined up at all"), and the
// cards shared one text size, so the longest card set the size for all of them
// and a short sentence sat small in a card the height of its neighbour. His
// rule then was "fill the box you're in ... unless the dead space is the price
// of aligning a box with other boxes"; the new one says what the box is: the
// text's own, with the alignment done by moving the boxes, not inflating them.
//
// Two kinds of stack pack:
//   - a Teach column (`fitCards`), whose cards share one text size: the size is
//     the largest, up to the smallest ceiling among them, at which every card
//     fits its words with the cards stacked in the height there is;
//   - a stack the designer centred (`verticalAlign: "center"`) holding only
//     text that hugs: each card keeps the size it was written at.
// Anything else lays out by its weights as before, and so does a packing stack
// whose words do not fit its height at the floor: the fit pass then says so.

const PACK_FLOOR_PT = 18;

function isPackingStack(data) {
  if (!data || data.type !== 'stack' || !Array.isArray(data.items) || !data.items.length) return false;
  const allText = data.items.every(function (it) { return it && it.type === 'text' && !it.picture; });
  if (!allText) return false;
  if (data.fitCards) return true;
  return String(data.verticalAlign || '').toLowerCase() === 'center' &&
    data.items.every(function (it) { return String(it.heightMode || '').toLowerCase() !== 'fill'; });
}

function packToContent(items, zone, data, ctx) {
  if (!ctx || !isPackingStack(data)) return null;
  const gaps = GAP * (items.length - 1);
  const room = zone.h - gaps;
  if (!(room > 0)) return null;
  let needs;
  let drawnItems = items;

  if (data.fitCards) {
    // Each card's own ceiling is the size a hugging card in this zone prints
    // at, or the size the layout named for it (a big statement at 40); the
    // cards share one size under their ceilings, the largest at which they all
    // fit. A fill card's grow ceiling (44 to 60) is not used: it is the size
    // that made a short sentence poster-sized to fill its box.
    const { TEXT_CEILINGS, FALLBACK_CEILING } = require('./text');
    const classCeiling = TEXT_CEILINGS[zone.class] || FALLBACK_CEILING;
    const ceilings = items.map(function (it) {
      return Math.floor(Number.isFinite(it.fontSize) ? it.fontSize : classCeiling);
    });
    let sizes = null;
    for (let pt = Math.max.apply(null, ceilings); pt >= PACK_FLOOR_PT; pt -= 1) {
      const at = items.map(function (it, i) {
        const hug = Object.assign({}, it);
        delete hug.heightMode;
        return textNeed(hug, zone, Math.min(pt, ceilings[i]), ctx);
      });
      if (at.some(function (n) { return n == null; })) return null;
      if (at.reduce(function (a, b) { return a + b; }, 0) <= room + 1e-6) {
        sizes = ceilings.map(function (c) { return Math.min(pt, c); });
        needs = at;
        break;
      }
    }
    if (sizes === null) return null;
    // The card spans the height it is given, and its words never print larger
    // than the size the cards were measured at.
    drawnItems = items.map(function (it, i) {
      return Object.assign({}, it, { heightMode: 'fill', fontSize: sizes[i] });
    });
  } else {
    // Each card keeps the size it was written at (its `fontSize`, or the
    // zone's own text size), measured the way the fit pass measures words, so
    // a card is as tall as its words really are. The card's own hug estimate
    // is deliberately generous, and on cholera slide 18 it put two cards that
    // fitted at 3.3in and 1.3in over the height of the slide, so the stack
    // fell back to weighted slices and the cards filled them. The card then
    // spans exactly the height measured, with its words never larger than
    // they were written.
    const { TEXT_CEILINGS, FALLBACK_CEILING } = require('./text');
    const classCeiling = TEXT_CEILINGS[zone.class] || FALLBACK_CEILING;
    const sizes = items.map(function (it) {
      return Math.floor(Number.isFinite(it.fontSize) ? it.fontSize : classCeiling);
    });
    needs = items.map(function (it, i) { return textNeed(it, zone, sizes[i], ctx); });
    if (needs.some(function (n) { return n == null; })) return null;
    if (needs.reduce(function (a, b) { return a + b; }, 0) > room + 1e-6) return null;
    drawnItems = items.map(function (it, i) {
      return Object.assign({}, it, { heightMode: 'fill', fontSize: sizes[i] });
    });
  }

  const total = needs.reduce(function (a, b) { return a + b; }, 0);
  const naturalH = total + gaps;
  return {
    items: drawnItems,
    heights: needs,
    offsetY: (zone.h - naturalH) / 2,
    naturalH: naturalH
  };
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

// The weight this item would need to reach the height it is asking for.
//
// An item's share is contentH * weight / totalWeight, so for a wanted height H
// the weight that lands it is H * (the other weights) / (contentH - H). Null
// when no weight reaches it: a single-item stack, where weight divides nothing,
// or a stack not tall enough even given whole.
function weightThatWouldFit(entry, neededH) {
  if (!entry || !Number.isFinite(neededH) || neededH <= 0) return null;
  const { weight, otherWeight, contentH } = entry;
  if (!Number.isFinite(weight) || !Number.isFinite(otherWeight) || !Number.isFinite(contentH)) {
    return null;
  }
  if (otherWeight <= 0) return null;
  if (contentH <= neededH) return null;
  const wanted = (neededH * otherWeight) / (contentH - neededH);
  // Rounded up, never to nearest. Advice that lands exactly on a floor is
  // advice that fails: the first two slides this was tried on came back with
  // "0.38in per row, below the 0.38in one line needs", refused by the last
  // digit. A weight is a free number, so it costs nothing to clear the floor
  // rather than touch it.
  const safe = Math.ceil(wanted * 100) / 100;
  return safe > weight ? safe : null;
}

function drawStack(pptx, slide, zone, data, ctx) {
  const layout = stackLayout(zone, data, ctx);
  if (layout.length === 0) return;

  const { drawContent } = require('./index');

  layout.forEach(function (entry) {
    try {
      drawContent(
        pptx,
        slide,
        entry.zone,
        entry.item,
        ctx
      );
    } catch (err) {
      // A child that refused for want of height knows the inches; only the
      // stack knows what the owner would have to type to get them. Said here
      // because this is the only place both are in scope, and appended rather
      // than replacing anything, so the child's own account survives whole.
      // The child asks in its own box; the stack answers in its share. The
      // shortfall is the one number that means the same thing in both.
      const shortfall = err && Number.isFinite(err.neededZoneHeight) && Number.isFinite(err.zoneHeight)
        ? err.neededZoneHeight - err.zoneHeight
        : null;
      const needed = shortfall > 0 ? entry.zone.h + shortfall + FIT_MARGIN : null;
      const wanted = weightThatWouldFit(entry, needed);
      if (wanted) {
        err.message +=
          ' In this stack that is a weight of ' + wanted.toFixed(2) +
          ' on this item (it has ' + entry.weight +
          '); the other items keep theirs.';
      } else if (Number.isFinite(needed) && entry.contentH <= needed) {
        err.message +=
          ' No weight reaches it here: the whole stack is only ' +
          entry.contentH.toFixed(2) + 'in, so this item needs a roomier zone or' +
          ' a slide of its own.';
      }
      throw err;
    }
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
  measureStack,
  isPackingStack
};
