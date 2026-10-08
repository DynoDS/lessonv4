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
    // Asked before the spare height is handed round, while the shares are
    // still the ones the weights and the words settled.
    const account = columnAccount(items, weights, heights, zone, zoneFor, ctx);
    if (account) sayColumn(account, weights, heights.slice(), ctx);
    reflowToUseSpareHeight(items, heights, zone, zoneFor, ctx);
  }

  let cursorY = zone.y + offsetY;

  return drawnItems.map(function (item, i) {
    const subZone = zoneFor(item, cursorY, heights[i]);
    // A packed card is exactly as tall as its words, so it keeps its card
    // however short it is; the short-zone rule below is for cards that would
    // burst out of a thin strip, and would leave a one-line packed card bare.
    if (packed) subZone.packedCard = true;
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
function textNeed(item, zone, pt, ctx, countSign) {
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
  // A card that opens with a sign (the pencil on a task) gives the sign its
  // width before the words begin. Uncounted, a task above a table was measured
  // at four lines in a card that wraps it to five, so the stack saw nothing
  // short and the fit refused it (a Year 6 maths task, 4 October 2026).
  // Counted only where a stack shares height by need (`countSign`). A centred
  // column of cards that fit their words (packToContent) keeps its old measure:
  // counted there, a pencil card in a column that already passed came out a
  // third taller with larger print, on four finished slides, and how those
  // cards look is the teacher's to choose, not a measure's to change.
  const sign = countSign && item.signal ? require('./text').signIndent(item, zone) : 0;
  let most = 0;
  for (const value of values) {
    const indent = /^\s*✨/.test(String(value)) ? STAR_INDENT : sign;
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
//
// The sort children do is measured the same way: the board decides how its
// cards are arranged, so only the board can say how tall it must be for every
// card's words to print at `pt`. It used to keep the share its weight guessed,
// and a board a few tenths of an inch short was refused once for every card
// while a row of two short cards under it sat in room it did not use (a Year 4
// history sort, 4 October 2026).
//
// So are a table and a word bank. Each refuses a zone too short for it in its
// own words, so each knows its least height, and until the stack asked, the
// words above a table could not have an inch the table was not using: a Year 6
// maths task was refused for its instruction while the table under it stood
// in rows twice the height its cells needed (4 October 2026).
//
// A criteria panel that holds a table is measured as one that holds steps is,
// and so is a table or a panel standing beside words in a row (wordsNeed
// below). Wrapped either way a table used to keep the share its weight
// guessed, with the wrapper's own frame taken out of it first, and five
// lessons of twenty had one refused for height while a line above it sat in
// room it did not use (7 October 2026).
function panelNeed(item, zone, pt, most, ctx) {
  if (!item) return null;
  if (item.type === 'sort-board') {
    if (!Array.isArray(item.bank)) return null;
  } else if (item.type === 'table' || item.type === 'chip-bank') {
    // Measured as drawn; nothing about the item to check first.
  } else {
    if (item.type !== 'sc-panel') return null;
    const content = item.content || item.criteria;
    if (!content || (content.type !== 'steps' && content.type !== 'table')) return null;
    // Never tried taller than the half slide a panel may take: tried at the
    // whole stack's height, a full-width panel was refused for its size and
    // so went unmeasured, steps and table alike.
    most = Math.min(most, require('../success-criteria-panel').tallestPanel(zone, ctx));
  }
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

// A row or a column is measured only when it is plain: these fields and no
// others. One that carries a coloured border, an accent or numbering draws its
// cards inside a frame, or adds words to them, that this measure knows nothing
// of. Measured as if plain, two bordered destination cards on a Year 5 history
// example were given a strip their words did not fit, on a slide that had
// passed (4 October 2026). Anything not listed here keeps its weight's share.
const PLAIN_ROW = new Set(['type', 'items', 'weight', 'equaliseTextCards']);
const PLAIN_COLUMN = new Set(['type', 'items', 'weight', 'verticalAlign', 'fitCards', 'heightRatio']);
function isPlain(node, fields) {
  return Object.keys(node).every(function (key) { return fields.has(key); });
}

// What a block of words needs when it sits inside a row: a text card, a
// stack of text cards one above the other, or a table or criteria panel
// (measured as drawn, up to `most`). Null for anything else, so a row holding
// a picture or a drawn figure is left to its weight as before.
function wordsNeed(item, zone, pt, ctx, most) {
  if (!item || typeof item !== 'object') return null;
  if (item.type === 'text') return textNeed(item, zone, pt, ctx, true);
  if (item.type === 'table' || item.type === 'sc-panel') {
    return Number.isFinite(most) ? panelNeed(item, zone, pt, most, ctx) : null;
  }
  if (item.type !== 'stack' || !Array.isArray(item.items) || !item.items.length) return null;
  if (!isPlain(item, PLAIN_COLUMN)) return null;
  if (item.heightRatio != null && Number(item.heightRatio) !== 1) return null;
  // Cards that fit their words and centre (packToContent below) are measured
  // the way that packing measures them, and keep its margin above and below.
  const packs = isPackingStack(item);
  let total = GAP * (item.items.length - 1) + (packs ? 2 * PACK_MARGIN : 0);
  for (const child of item.items) {
    let card = child;
    if (packs && child && child.heightMode) {
      card = Object.assign({}, child);
      delete card.heightMode;
    }
    const need = card && card.type === 'text' ? textNeed(card, zone, pt, ctx, !packs) : null;
    if (need == null) return null;
    total += need;
  }
  return total;
}

// What a row of words needs: the tallest of its items at the width each is
// drawn at. A stack used to measure only the text cards and criteria panels it
// held directly, so a row of two cards kept the share its weight guessed and
// its words were refused at the fit: on 4 October 2026 the words inside rows
// and inside rows of stacks were the largest refusal left once the headline
// strip and the sorting letters were mended, in six runs of ten. Measured
// here, a row takes what it needs from the room the stack has.
function rowNeed(item, zone, pt, ctx, most) {
  const items = Array.isArray(item.items) ? item.items : [];
  if (!items.length || !isPlain(item, PLAIN_ROW)) return null;
  const widths = require('./row').rowWidths(zone, item, ctx);
  if (widths.length !== items.length) return null;
  let tallest = 0;
  for (let i = 0; i < items.length; i += 1) {
    const need = wordsNeed(items[i], Object.assign({}, zone, { w: widths[i] }), pt, ctx, most);
    if (need == null) return null;
    tallest = Math.max(tallest, need);
  }
  return tallest || null;
}

// What one item needs at `pt`, and whether it may take more: words and a
// criteria panel take; a picture keeps what its card reaches and gives the rest.
//
// A row of words, the sort children do, a table and a word bank are measured
// only when `wide` asks: see settleByNeed for when it does.
const LATE_JOINERS = new Set(['row', 'sort-board', 'table', 'chip-bank']);
function itemNeed(item, zone, share, pt, most, ctx, wide) {
  if (!item || typeof item !== 'object') return null;
  if (item.type === 'text') {
    const need = textNeed(item, zone, pt, ctx, true);
    return need == null ? null : { need, takes: true };
  }
  if (item.type === 'row') {
    const need = wide ? rowNeed(item, zone, pt, ctx, most) : null;
    return need == null ? null : { need, takes: true };
  }
  if (item.type === 'sc-panel' || (wide && LATE_JOINERS.has(item.type))) {
    const need = panelNeed(item, zone, pt, most, ctx);
    if (need == null) return null;
    // A criteria panel takes what is left over only up to the half slide it
    // may fill (shareOut below).
    const cap = item.type === 'sc-panel'
      ? require('../success-criteria-panel').tallestPanel(zone, ctx)
      : Infinity;
    return { need, takes: true, cap };
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

// Words, criteria and pictures are shared out among themselves first, as they
// always were, and a row of cards or a sort keeps the share its weight gives.
// Those two join the sharing only when something cannot hold its words at 18pt
// without them: when the row or the sort is itself short, or when the words
// beside it are short and have nobody else to take from. So a slide that
// fitted before a row could be measured lays out exactly as it did: measured
// on every slide, a row of short cards gave height it was using for larger
// print to lines that already fitted (four slides in 33 finished decks moved
// that way, 4 October 2026, none of them refused before).
function settleByNeed(items, heights, zone, zoneFor, ctx) {
  if (!ctx || items.length < 2) return;
  const settles = function (it) { return it && (it.type === 'text' || it.type === 'sc-panel' || LATE_JOINERS.has(it.type)); };
  if (!items.some(settles)) return;
  const contained = function (it) { return it && LATE_JOINERS.has(it.type); };
  if (!items.some(contained)) {
    settleAmong(items, heights, zone, zoneFor, ctx, false);
    return;
  }
  const stackH = heights.reduce(function (sum, h) { return sum + h; }, 0);
  const containerShort = items.some(function (item, i) {
    if (!contained(item)) return false;
    const n = itemNeed(item, zoneFor(item, zone.y, heights[i]), heights[i], FLOOR_PT, stackH, ctx, true);
    return Boolean(n) && n.need > heights[i] + SETTLE_TOLERANCE;
  });
  if (!containerShort) {
    const written = heights.slice();
    if (settleAmong(items, heights, zone, zoneFor, ctx, false) !== 'short of room') return;
    written.forEach(function (h, i) { heights[i] = h; });
  }
  settleAmong(items, heights, zone, zoneFor, ctx, true);
}

// One sharing of the stack's height among the items it measures. Says what
// came of it: 'fits' when nothing was short and nothing moved, 'shared' when
// the height was shared out by need, 'short of room' when no sharing holds
// everything at 18pt and the weights stay as written.
function settleAmong(items, heights, zone, zoneFor, ctx, wide) {
  const measure = function (pt, most) {
    return items.map(function (item, i) {
      return itemNeed(item, zoneFor(item, zone.y, heights[i]), heights[i], pt, most, ctx, wide);
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
  if (!short) return 'fits';

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
    takers.forEach(function (i) { heights[i] = needs[i].need; });
    // What is left is shared in proportion. An item with a ceiling (a
    // criteria panel, which never passes half the slide) stops at it and what
    // it could not take goes round the others again; with no ceiling in the
    // stack this is the one proportional share it always was.
    let spare = room - kept - wanted;
    let open = takers.slice();
    while (open.length && spare > 1e-6) {
      const asking = open.reduce(function (sum, i) { return sum + needs[i].need; }, 0);
      const still = [];
      let over = 0;
      open.forEach(function (i) {
        const offered = heights[i] + spare * needs[i].need / asking;
        const cap = needs[i].cap;
        if (Number.isFinite(cap) && offered > cap) {
          over += offered - Math.max(cap, heights[i]);
          heights[i] = Math.max(cap, heights[i]);
        } else {
          heights[i] = offered;
          still.push(i);
        }
      });
      spare = over;
      open = still;
    }
  };

  const atTarget = measure(TARGET_PT, stackH);
  if (atTarget.every(function (n, i) { return !n === !atFloor[i]; }) && total(atTarget) <= room) {
    shareOut(atTarget);
    return 'shared';
  }
  if (total(atFloor) <= room) {
    shareOut(atFloor);
    return 'shared';
  }
  // No sharing of this height holds everything at 18pt. The weights stay as
  // written, so the refusal names the item they left short. When the stack has
  // measured every item it holds, it also says why moving a weight will not
  // mend it: the Year 4 PSHE task above spent its repair passes moving weights
  // in a column that did not have the room. With an item it cannot measure,
  // that item's weight might, so it says nothing.
  if (atFloor.some(function (n) { return !n; })) return 'short of room';
  warn(ctx.slideIndex,
    'the words and criteria stacked in one ' + zone.w.toFixed(2) + 'in-wide zone need about ' +
    total(atFloor).toFixed(2) + 'in at the 18pt floor and have ' + room.toFixed(2) + 'in, so no ' +
    'weights will fit them. Give them more room: a wider zone, one of them on the other side ' +
    'of the slide, or the beat across two slides. Nothing was shrunk or cut.');
  return 'short of room';
}

// ─── a column that holds a drawn figure says what the whole of it needs ───
//
// The sharing above stops at a drawn figure: a place value chart, a column
// calculation or a labelled diagram keeps the share its weight guessed, and the
// stack "says nothing" about whether any weights could hold the column. So each
// refusal named one item, the one that lost this time, and a repair that fed it
// made a different item lose next time. Year 4 Maths Lesson 24 (6 October 2026)
// stood a counter pair over a column calculation and its explanation: the check
// said counters too small, then calculation too short, then explanation too
// long, across eight checks and a repair launch, and no split of that height
// held all three. Five of six Codex runs that week ran out of repair passes on
// a column of this kind.
//
// So when a column that holds a figure has an item short of its floor, the
// stack finds what every item needs at its smallest readable size and says it
// once: each need, the total, the room, and either weights that fit or that no
// weights do. A figure is asked the way a criteria panel already is, by drawing
// it where nobody sees until it stops refusing, so there is no list of helpers
// and one not yet written is asked the same way. A photograph is not asked: its
// share is the designer's to change, never a sum's.
//
// It only reports. The weights stay as written and the slide is refused or
// drawn exactly as before.
const PROBE_LOW = 0.3;
const COLUMN_SLACK = 0.02;
const saidColumns = new Set();

function holdsDrawing(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.type === 'stack' || item.type === 'row') {
    return Array.isArray(item.items) && item.items.some(holdsDrawing);
  }
  return item.type !== 'image' && isDrawing(item);
}

// The least height a drawn figure accepts at this width, by drawing it unseen.
// Infinity when it refuses even the whole column, which is a width fault.
function figureNeed(item, zone, most, ctx) {
  const { drawContent } = require('./index');
  const { withoutRecording } = require('../warnings');
  const PptxGenJS = require('../require-global')('pptxgenjs');
  const barrier = ctx._cardBarrier;
  const container = ctx._containerType;
  const fits = function (h) {
    const dry = new PptxGenJS();
    try {
      withoutRecording(function () {
        drawContent(dry, dry.addSlide(), Object.assign({}, zone, { h: h }), item, ctx);
      });
      return true;
    } catch {
      return false;
    } finally {
      ctx._cardBarrier = barrier;
      ctx._containerType = container;
    }
  };
  if (!fits(most)) return Infinity;
  // The search starts above the height at which a figure draws nothing at all
  // and so refuses nothing. One that reaches it has no smallest size of its
  // own (a labelled diagram scales down for as long as it is asked to).
  let lo = PROBE_LOW;
  let hi = most;
  while (hi - lo > SETTLE_TOLERANCE) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid; else lo = mid;
  }
  return hi - PROBE_LOW <= 2 * SETTLE_TOLERANCE ? null : hi + SETTLE_TOLERANCE;
}

function nameOf(item) {
  if (item.type !== 'text') return item.type;
  const words = visibleText(item.value || item.text || '').replace(/\s+/g, ' ').trim();
  return 'text "' + (words.length > 28 ? words.slice(0, 28) + '...' : words) + '"';
}

// What one item of a column needs at the floor, with a name a designer can
// find it by. Null when any part of it cannot be measured honestly, and then
// the column says nothing, as it always did. A photograph, or a figure with no
// smallest size, is counted at the share it holds; inside a row or a column of
// its own (`share` null) nobody has given it a share, so it cannot be counted.
function columnNeed(item, zone, share, most, ctx) {
  if (!item || typeof item !== 'object' || !item.type) return null;
  if (item.type === 'text') {
    const need = textNeed(item, zone, FLOOR_PT, ctx, true);
    return need == null ? null : { need, name: nameOf(item) };
  }
  if (item.type === 'image') return share == null ? null : { need: share, name: 'picture', kept: true };
  if (item.type === 'row') {
    const items = Array.isArray(item.items) ? item.items : [];
    if (!items.length || !isPlain(item, PLAIN_ROW)) return null;
    const widths = require('./row').rowWidths(zone, item, ctx);
    if (widths.length !== items.length) return null;
    let tallest = null;
    const names = [];
    for (let i = 0; i < items.length; i += 1) {
      const part = columnNeed(items[i], Object.assign({}, zone, { w: widths[i] }), null, most, ctx);
      if (!part) return null;
      names.push(part.name);
      if (!tallest || part.need > tallest.need) tallest = part;
    }
    return { need: tallest.need, name: 'row of ' + names.join(' beside '), tallest: tallest.name };
  }
  if (item.type === 'stack') {
    const items = Array.isArray(item.items) ? item.items : [];
    if (!items.length || !isPlain(item, PLAIN_COLUMN)) return null;
    if (item.heightRatio != null && Number(item.heightRatio) !== 1) return null;
    let total = GAP * (items.length - 1);
    const names = [];
    for (const child of items) {
      const part = columnNeed(child, zone, null, most, ctx);
      if (!part) return null;
      names.push(part.name);
      total += part.need;
    }
    return { need: total, name: 'stack of ' + names.join(' over ') };
  }
  if (item.type === 'sc-panel' || LATE_JOINERS.has(item.type)) {
    const need = panelNeed(item, zone, FLOOR_PT, most, ctx);
    return need == null ? null : { need, name: item.type };
  }
  if (!isDrawing(item)) return null;
  const least = figureNeed(item, zone, most, ctx);
  // A figure with no smallest size is counted like a photograph: at the share
  // it holds, which is the designer's to change.
  if (least != null) return { need: least, name: item.type };
  return share == null ? null : { need: share, name: item.type, kept: true };
}

// The whole column's account, or null when nothing is short, when it holds no
// figure (the words-only line above already speaks for those), or when an item
// cannot be measured.
function columnAccount(items, weights, heights, zone, zoneFor, ctx) {
  if (!ctx || items.length < 2 || !items.some(holdsDrawing)) return null;
  const room = heights.reduce(function (sum, h) { return sum + h; }, 0);
  const parts = [];
  for (let i = 0; i < items.length; i += 1) {
    let part = null;
    try {
      part = columnNeed(items[i], zoneFor(items[i], zone.y, heights[i]), heights[i], room, ctx);
    } catch {
      part = null;
    }
    if (!part) return null;
    parts.push(part);
  }
  const short = parts.some(function (part, i) { return part.need > heights[i] + SETTLE_TOLERANCE; });
  if (!short) return null;
  const total = parts.reduce(function (sum, part) { return sum + part.need; }, 0);
  const fits = Number.isFinite(total) && total + COLUMN_SLACK * items.length <= room;
  let fitting = null;
  if (fits) {
    // Each item keeps what it needs and the rest is shared in proportion, so
    // nothing is set down on its limit. A picture keeps the share it has.
    const kept = parts.reduce(function (sum, part) { return part.kept ? sum + part.need : sum; }, 0);
    const wanted = total - kept;
    const left = room - total;
    const totalWeight = weights.reduce(function (a, b) { return a + b; }, 0);
    fitting = parts.map(function (part) {
      const h = part.kept ? part.need : part.need + left * part.need / wanted;
      return { h, weight: Math.round(h / room * totalWeight * 100) / 100 };
    });
  }
  return { parts, room, total, fitting };
}

function inches(value) {
  return value.toFixed(2) + 'in';
}

function columnSentence(account, weights, heights) {
  const each = account.parts.map(function (part, i) {
    const inside = part.tallest ? ' (its tallest part is the ' + part.tallest + ')' : '';
    return 'item ' + (i + 1) + ', ' + part.name + inside + ', ' +
      (part.kept ? 'has no smallest size of its own and holds ' + inches(heights[i])
        : !Number.isFinite(part.need) ? 'is refused at any height (it has ' + inches(heights[i]) + ')'
          : 'needs ' + inches(part.need) + ' and has ' + inches(heights[i]));
  }).join('; ');
  const opening = 'this column has ' + inches(account.room) + ' of height for its ' +
    account.parts.length + ' items' +
    (Number.isFinite(account.total)
      ? ', and at their smallest readable sizes they need ' + inches(account.total) + ' between them: '
      : ': ') + each + '. ';
  if (account.fitting) {
    return opening + 'Weights that fit, in the same order: ' +
      account.fitting.map(function (f) { return f.weight; }).join(', ') +
      ' (they are ' + weights.join(', ') + ' now).';
  }
  // An item refused at every height is not short of height: it may be short
  // of width, or refused for something that is nothing to do with its size.
  const refusedAnyway = account.parts.some(function (part) { return !Number.isFinite(part.need); });
  return opening + 'No weights fit this column: ' +
    (refusedAnyway ? 'an item is refused whatever height it is given, so height is not its fault and its own refusal says what is. '
      : 'move one item to the other side or split the beat. ') +
    (account.parts.some(function (part) { return part.kept; })
      ? 'A picture or diagram is counted at the share it holds; giving it less is your decision, not a sum. ' : '') +
    'Changing the weights will only change which item is refused.';
}

function sayColumn(account, weights, heights, ctx) {
  const { recording } = require('../warnings');
  if (!recording()) return;
  const line = 'COLUMN_NEEDS: slide ' + (ctx.slideIndex + 1) + ': ' + columnSentence(account, weights, heights);
  if (saidColumns.has(line)) return;
  saidColumns.add(line);
  console.log(line);
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
// The group always keeps at least this much clear above and below, so it reads
// as centred on its neighbour rather than filling beside it (the teacher: a
// small, even gap top and bottom, 29 September 2026).
const PACK_MARGIN = 0.15;

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

  // Each card's ceiling is the size it was written at: its `fontSize`, or the
  // zone's own text size (a fill card's grow ceiling, 44 to 60, is not used; it
  // is the size that made a short sentence poster-sized to fill its box). The
  // cards step down together from the largest ceiling until they all fit the
  // height stacked, each at the smaller of that size and its own ceiling, so
  // cards written alike print alike. The words are measured the way the fit
  // pass measures them, because a card's own hug estimate is deliberately
  // generous: on cholera slide 18 it put two cards that fitted at 3.3in and
  // 1.3in over the height of the slide.
  //
  // Stepping down is what a centred stack of plain cards had been missing. It
  // used to measure them at their ceiling only, and when four cards beside a
  // UK map did not fit at the column's 32pt it gave up and fell back to equal
  // weighted slices: the cards filled the column from top to bottom and the
  // fit pass shrank each on its own, so one printed large and the task card
  // small (a Year 4 geography slide, 29 September 2026). Only a group that
  // does not fit at the 18pt floor falls back now, and the fit pass says so.
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
    if (at.reduce(function (a, b) { return a + b; }, 0) <= room - 2 * PACK_MARGIN + 1e-6) {
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
  const hugged = new Set();
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
      hugged.add(i);
    }
  });

  if (released <= REFLOW_FLOOR) return;
  if (!growers.length) {
    lendToDrawings(items, heights, hugged, released, zone, zoneFor, ctx);
    return;
  }
  const share = released / growers.length;
  growers.forEach(function (i) {
    heights[i] += share;
  });
}

// ─── spare height nobody claimed goes to a drawing that would use it ───
//
// When nothing in the stack is a photograph or a fill card, the height a
// hugging item handed back used to go to nobody: the items closed up and the
// difference became a band of background under the last of them. A Year 4
// column addition Your Turn gave its one-line instruction a third of the
// column; the line kept 0.79in of it, and the place value chart the class
// writes in stood in rows 0.41in tall above 1.2in of nothing, half the height
// of the same chart on the Our Turn two slides before (5 October 2026).
//
// So the stack asks each drawing whether it would be drawn taller with the
// spare, by drawing it where nobody sees at the height it has and at the height
// on offer, and gives it what it would use. It asks rather than keeping a list,
// so a chart, a frame to write in and a helper not yet written are all asked
// the same way, and a drawing held by its width (a number line) says no and
// nothing moves. Words and cards are not asked: a card stretched past its words
// is the same empty band with a border round it. A drawing that hugged below
// its own share is not asked either, having just said it has more than it
// uses.
//
// A drawing its share refuses is asked too, and takes the spare when the spare
// is what it was short of. It used to stay refused. That held while a chart
// would draw itself down to 12pt digits in any strip: it was drawn small in its
// share and then grew into the spare. Once a chart on a slide stopped at 18pt
// (6 October 2026) the same chart refused its share before the spare was
// offered, and nine slides of a finished Year 4 column addition deck, whose
// charts had been drawn at 26pt in room the column had all along, were refused
// for a share they never ended up with. What it is given is worked out as if it
// had been drawn in its share, so those slides come out as they did.
const WORDS_AND_CARDS = new Set([
  'text', 'bullets', 'steps', 'vocab', 'numbered-questions', 'question-cards',
  'callout', 'sc-panel', 'table', 'chip-bank', 'sort-board', 'evidence-cards',
  'matching', 'diamond-nine'
]);

function isDrawing(item) {
  if (!item || typeof item !== 'object' || !item.type) return false;
  if (item.type === 'stack' || item.type === 'row') {
    return Array.isArray(item.items) && item.items.length > 0 && item.items.every(isDrawing);
  }
  return !WORDS_AND_CARDS.has(item.type);
}

// How tall an item is drawn in a zone, read off a slide nobody sees. Drawn
// without its card and with no picture store, so what is measured is the
// drawing itself and nothing is asked of the picture maker. Null when the item
// refuses the zone or draws nothing that can be measured.
function drawnHeight(item, zone, ctx) {
  const { drawContent } = require('./index');
  const { withoutRecording } = require('../warnings');
  const PptxGenJS = require('../require-global')('pptxgenjs');
  const dry = new PptxGenJS();
  const page = dry.addSlide();
  const quiet = Object.assign({}, ctx, { cardLook: false, sharedFigures: null });
  try {
    withoutRecording(function () {
      drawContent(dry, page, zone, item, quiet);
    });
  } catch {
    return null;
  }
  let top = Infinity;
  let bottom = -Infinity;
  (page._slideObjects || []).forEach(function (object) {
    const at = object && object.options;
    if (!at || !Number.isFinite(at.y) || !Number.isFinite(at.h)) return;
    top = Math.min(top, at.y);
    bottom = Math.max(bottom, at.y + at.h);
  });
  return bottom > top ? bottom - top : null;
}

function lendToDrawings(items, heights, hugged, released, zone, zoneFor, ctx) {
  const gainWith = function (i, offer) {
    let now = drawnHeight(items[i], zoneFor(items[i], zone.y, heights[i]), ctx);
    const then = drawnHeight(items[i], zoneFor(items[i], zone.y, heights[i] + offer), ctx);
    if (then == null) return 0;
    if (now == null) {
      // Refused in its share and drawn with the spare. The room a drawing
      // leaves round itself is read off the shortest zone it accepts, and
      // taken from its share to stand for the height it would have drawn at.
      const least = figureNeed(items[i], zoneFor(items[i], zone.y, heights[i]), heights[i] + offer, ctx);
      const atLeast = Number.isFinite(least) ? drawnHeight(items[i], zoneFor(items[i], zone.y, least), ctx) : null;
      if (atLeast == null) return 0;
      now = heights[i] - (least - atLeast);
    }
    return Math.min(offer, then - now);
  };
  const takers = [];
  items.forEach(function (item, i) {
    if (hugged.has(i) || !isDrawing(item)) return;
    if (gainWith(i, released) > REFLOW_FLOOR) takers.push(i);
  });
  if (!takers.length) return;
  const share = released / takers.length;
  takers.forEach(function (i) {
    const gain = gainWith(i, share);
    if (gain > 0) heights[i] += gain;
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
      // Said once, by the stack that holds the item. Each stack further out
      // used to add a weight of its own, also "on this item", and a table
      // three stacks deep was told 2.40, 3.33 and 4.65 in one sentence (a
      // Year 6 English plan, 7 October 2026).
      const said = Boolean(err && err.weightAdvised);
      const wanted = said ? null : weightThatWouldFit(entry, needed);
      if (said) {
        // The stack that holds the item has spoken.
      } else if (wanted) {
        err.weightAdvised = true;
        err.message +=
          ' In this stack that is a weight of ' + wanted.toFixed(2) +
          ' on this item (it has ' + entry.weight +
          '); the other items keep theirs.';
      } else if (Number.isFinite(needed) && entry.contentH <= needed) {
        err.weightAdvised = true;
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
  textNeed,
  columnAccount,
  columnSentence,
  drawStack,
  stackLayout,
  measureStack,
  isPackingStack
};
