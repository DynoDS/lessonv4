'use strict';

const { measureContentExtent, measureCompositionExtent } = require('./content');

// Whole-composition alignment for a side-by-side split pair.
//
// The two zones of a split-h template used to be drawn blind to each other,
// which produced the two faults the teacher kept correcting by hand:
//
//   - a text with heightMode "fill" spanned its whole zone even when its
//     partner was a photo card half that height, so the "paired" card
//     towered over its pair with dead white space where the pairing was
//     supposed to be;
//   - a shorter member (usually the photo) sat pinned to the top beside a
//     taller partner, leaving a meaningless void underneath instead of the
//     one shared visual centre the pair should read as.
//
// This pass measures what each side will actually draw and settles the pair
// before either side is drawn: fill means "span the pair", so a fill card is
// never taller than the taller member; a measured shorter member centres on
// the pair. A side whose content spans whatever it is given (a stack, a
// panel, a helper with no measure) keeps its whole zone and the pair height
// is the zone height, which is exactly the old behaviour.
function isFillText(data) {
  return !!data && data.type === 'text' &&
    String(data.heightMode || '').toLowerCase() === 'fill';
}

// Criteria on the right may rise into the title row when they need the room.
//
// The title sits at the left of the header, so on a slide with no task line,
// tick or Do sign the header's right-hand side is empty. A lesson's two lists
// ("How to subtract", "How to exchange") in two boxes did not fit beside a
// model sum at 18pt, with that strip empty above them; the teacher pointed at
// it (16 October 2026). Only criteria that do not fit their zone rise, so every
// slide that fits keeps the layout it has.
const RISE_TOP = 0.12;

function isCriteria(data) {
  if (!data) return false;
  if (data.type === 'sc-panel') return true;
  return data.type === 'stack' && Array.isArray(data.items) && data.items.length > 0 &&
    data.items.every((item) => item && item.type === 'sc-panel');
}

function headerRightIsEmpty(slideData) {
  if (!slideData || slideData.headerStyle === 'starter') return false;
  return !slideData.instruction && !slideData.doSign && !slideData.signal;
}

function fitsAt(zone, data, ctx) {
  const PptxGenJS = require('./require-global')('pptxgenjs');
  const { withoutRecording } = require('./warnings');
  const { drawContent } = require('./content');
  const dry = new PptxGenJS();
  const barrier = ctx._cardBarrier;
  const container = ctx._containerType;
  const held = ctx._holdCriteriaFloor;
  // Measured at the ordinary 18pt floor: rising keeps the lists at full size,
  // so it is tried before a headed list is let down to 16pt
  // (success-criteria-panel.js), which is for when even the risen room is short.
  ctx._holdCriteriaFloor = true;
  try {
    withoutRecording(() => drawContent(dry, dry.addSlide(), Object.assign({}, zone), data, ctx));
    return true;
  } catch (err) {
    return false;
  } finally {
    ctx._cardBarrier = barrier;
    ctx._containerType = container;
    ctx._holdCriteriaFloor = held;
  }
}

// Where the criteria really end when drawn in this zone: each box hugs its
// steps, so the drawing usually stops short of the zone's foot.
function drawnBottom(zone, data, ctx) {
  const PptxGenJS = require('./require-global')('pptxgenjs');
  const { withoutRecording } = require('./warnings');
  const { drawContent } = require('./content');
  const dry = new PptxGenJS();
  const real = dry.addSlide();
  let bottom = zone.y;
  const note = (opts) => {
    if (opts && Number.isFinite(opts.y) && Number.isFinite(opts.h)) bottom = Math.max(bottom, opts.y + opts.h);
  };
  const slide = new Proxy(real, {
    get(target, key) {
      const value = target[key];
      if (typeof value !== 'function') return value;
      if (key === 'addShape') return (kind, opts) => { note(opts); return value.call(target, kind, opts); };
      return value.bind(target);
    }
  });
  const barrier = ctx._cardBarrier;
  const container = ctx._containerType;
  try {
    withoutRecording(() => drawContent(dry, slide, Object.assign({}, zone), data, ctx));
  } finally {
    ctx._cardBarrier = barrier;
    ctx._containerType = container;
  }
  return bottom;
}

function riseCriteriaIfNeeded(zone, data, ctx) {
  const { SLIDE_W, MARGIN_X } = require('./layout');
  const slideData = ctx && ctx.lesson && Array.isArray(ctx.lesson.slides) ? ctx.lesson.slides[ctx.slideIndex] : null;
  if (!isCriteria(data) || !headerRightIsEmpty(slideData)) return false;
  if (Math.abs(zone.x + zone.w - (SLIDE_W - MARGIN_X)) > 0.05 || zone.y <= RISE_TOP) return false;
  if (fitsAt(zone, data, ctx)) return false;
  const risen = Object.assign({}, zone, { y: RISE_TOP, h: zone.h + (zone.y - RISE_TOP) });
  if (!fitsAt(risen, data, ctx)) return false;
  // The boxes hug their steps, so drawn from the top of the risen zone they
  // left an empty strip at the foot and looked pushed up. The teacher asked
  // for them centred in the room they were given (16 October 2026), so the
  // pair sits in the middle of the slide's height, as far from its foot as
  // from its top, using the bottom margin as he said it could be. The whole
  // drawing moves down as it is, so the boxes keep the sizes they fitted at.
  const { SLIDE_H } = require('./layout');
  const drawnH = drawnBottom(risen, data, ctx) - risen.y;
  zone.y = Math.min(SLIDE_H - RISE_TOP - drawnH, Math.max(RISE_TOP, (SLIDE_H - drawnH) / 2));
  zone.h = risen.h;
  return true;
}

function alignSplitHPair(primaryZone, primaryData, secondaryZone, secondaryData, ctx) {
  if (!primaryData || !secondaryData) return;
  // A side that rose keeps its own place; the other side settles as it would.
  if (riseCriteriaIfNeeded(secondaryZone, secondaryData, ctx) ||
      riseCriteriaIfNeeded(primaryZone, primaryData, ctx)) return;
  const sides = [
    { zone: primaryZone, data: primaryData },
    { zone: secondaryZone, data: secondaryData }
  ];
  // A container is measured for the sake of its PARTNER, not for its own sake.
  //
  // `measureContentExtent` declines a stack or a row on purpose, and the reason
  // is a real one: a fill text beside a stack is meant to keep the whole zone
  // precisely because its partner cannot be measured. But that reason is about
  // the fill text, and the pass was using the same refusal to decide where the
  // OTHER side sits, so a photograph beside a stack of three cards centred on
  // the empty zone rather than on the cards. On the estimate slide the cards ran
  // from 0.60in to 5.11in, centre 2.86, and the photo sat centred at 3.93,
  // visibly low; the teacher moved it up by hand (19 September 2026).
  //
  // So each side keeps the narrow answer for its own behaviour, `measured`, and
  // gains the broader one, `contentH`, only for settling the pair's height. A
  // fill text still spans the pair, because `isFillText` is checked first and
  // nothing here changed what a fill text does.
  sides.forEach((side) => {
    const own = measureContentExtent(side.zone, side.data, ctx);
    const whole = own || measureCompositionExtent(side.zone, side.data, ctx);
    side.h = whole ? Math.min(whole.h, side.zone.h) : side.zone.h;
    side.measured = !!own;
    side.settles = !!whole;
  });
  // Two heights, because the two jobs want different answers.
  //
  // A fill text spans the pair, and what it may span is unchanged: the NARROW
  // measure only, so a fill text beside a container still keeps the whole zone,
  // which is the behaviour that paragraph above protects.
  //
  // Centring a shorter member is the job the broad measure was needed for, and
  // it is safe there because it only ever moves something that was already
  // going to be drawn shorter than its zone.
  const spanH = Math.max(
    sides[0].measured ? sides[0].h : sides[0].zone.h,
    sides[1].measured ? sides[1].h : sides[1].zone.h
  );
  const alignH = Math.max(
    sides[0].settles ? sides[0].h : sides[0].zone.h,
    sides[1].settles ? sides[1].h : sides[1].zone.h
  );
  // Cards that fit their words (a packing stack, content/stack.js) share the
  // pair's band with their partner, so the two are centred on each other, and
  // neither stretches to meet the other (the teacher's rules of 28 and 29
  // September 2026). A packing stack used to keep its whole zone and centre in
  // it while a shorter picture beside it centred on the top of the zone.
  const { isPackingStack } = require('./content/stack');
  const packing = sides.some((side) => isPackingStack(side.data) && side.settles);
  // With packed cards, the pair itself is centred in the height of the slide,
  // and a shorter partner is given exactly its own height at the middle of the
  // pair. A helper that centres itself in whatever zone it is given (a place
  // value chart) otherwise centred in the whole zone after being moved down,
  // and sat low beside the cards (29 September 2026).
  const pairOffset = packing ? Math.max(0, (sides[0].zone.h - alignH) / 2) : 0;
  sides.forEach((side) => {
    if (isFillText(side.data)) {
      side.zone.h = spanH;
    } else if (packing && isPackingStack(side.data)) {
      side.zone.y += pairOffset;
      side.zone.h = alignH;
    } else if (packing && side.measured) {
      side.zone.y += pairOffset + Math.max(0, (alignH - side.h) / 2);
      side.zone.h = Math.min(side.zone.h, Math.max(side.h, 0.3));
    } else if (side.measured && side.h < alignH - 0.05) {
      side.zone.y += (alignH - side.h) / 2;
    }
  });
}

module.exports = { alignSplitHPair };
