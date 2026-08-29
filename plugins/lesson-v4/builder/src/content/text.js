'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const {
  baseColourForRole,
  presentationRuns
} = require('../presentation-text');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { drawSignal, signalWidth } = require('../signals');
const {
  PICTURE_GAP,
  resolvePictureSet,
  pictureMetrics,
  drawContentPicture
} = require('../content-picture');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD = 0.08;

// A text block opening with ✨ is a sticky-knowledge line, same language as a
// ✨-led steps item: the drawn star from the signal set marks it and the typed
// character comes off the rendered words. The star is the marker for the whole
// block, so it centres on the block's height however many lines the fact runs.
const STAR_H_MAX = 0.40;
const STAR_GAP   = 0.10;

function starIndent(zoneH) {
  const h = Math.min(STAR_H_MAX, Math.max(0.2, zoneH - 2 * PAD) * 0.8);
  const w = signalWidth('star', h);
  return w ? { h: h, w: w, indent: w + STAR_GAP } : null;
}

function isSticky(value) {
  return /^\s*✨/.test(String(value));
}

const TEXT_CEILINGS = {
  'A':        48,
  'B':        54,
  'C':        28,
  'D':        22,
  'E-wide':   32,
  'E-narrow': 28,
  'F':        16,
  'G':        20
};
const FALLBACK_CEILING = 24;

// `align` positions the words inside the text frame; `placement` positions a
// content-width card inside its zone. Both default to left, so an ordinary
// text block with neither field renders exactly as it always has.
const TEXT_ALIGNS = new Set(['left', 'center', 'right']);
const TEXT_PLACEMENTS = new Set(['left', 'center', 'right']);
const TEXT_HEIGHT_MODES = new Set(['hug', 'fill']);

// A fill card is a deliberate span, so it must be full of readable type, not
// dead white space around type sized for a hugged card. The fit pass grows a
// fill block to the largest whole-point size its card can hold, up to a
// ceiling; an explicit fontSize replaces the ceiling rather than the start
// size, because a designer who names a size has already made the judgement.
//
// The ceiling is split by how much the block says. A short display line — a
// vocabulary headword with its definition — reads well poster-sized: 60 is
// where the teacher grew one when a full-height card left it at 28pt in
// empty space. Running prose does not: sentences at 60 stop reading as
// sentences, and 44 is just past where the teacher settled a three-sentence
// answer block (40) when given the same room.
const FILL_GROW_CEILING_DISPLAY = 60;
const FILL_GROW_CEILING_PROSE   = 44;
const FILL_DISPLAY_WORD_LIMIT   = 12;

function fillGrowCeiling(value) {
  const words = String(value).trim().split(/\s+/).filter(Boolean).length;
  return words > FILL_DISPLAY_WORD_LIMIT
    ? FILL_GROW_CEILING_PROSE
    : FILL_GROW_CEILING_DISPLAY;
}

function textAlign(data) {
  const value = String(data.align || 'left').toLowerCase();
  return TEXT_ALIGNS.has(value) ? value : 'left';
}

function textPlacement(data) {
  const value = String(data.placement || 'left').toLowerCase();
  return TEXT_PLACEMENTS.has(value) ? value : 'left';
}

function textHeightMode(data) {
  const value = String(data.heightMode || 'hug').toLowerCase();
  if (!TEXT_HEIGHT_MODES.has(value)) {
    throw new Error(
      `TEXT_HEIGHT_MODE_INVALID: expected hug or fill; found ${JSON.stringify(data.heightMode)}.`
    );
  }
  return value;
}

// ─── END CONSTANTS ────────────────────────────────────────────

function estimateLines(value, fs, availW) {
  const glyphW = fs * 0.58 / 72;
  let lines = 0;
  String(value).split('\n').forEach(function (para) {
    lines += Math.max(1, Math.ceil((para.length * glyphW) / Math.max(0.5, availW)));
  });
  return lines;
}

function optionalPictureLayout(zone, data, ctx, indent, fs, value) {
  if (!data.picture) return null;
  const picture = resolvePictureSet([data], ctx)[0];
  if (!picture) return null;
  const metrics = pictureMetrics(picture, zone.h - 2 * PAD, ctx);
  const slotW = metrics.w + PICTURE_GAP;
  const baseW = Math.max(0.5, zone.w - 2 * PAD - indent);
  const pictureW = Math.max(0.5, baseW - slotW);
  const picturedLines = estimateLines(value, fs, pictureW);
  const picturedH = picturedLines * fs / 72 * 1.32 + 2 * PAD + 0.04;
  if (picturedH > zone.h) return null;
  return { picture: picture, metrics: metrics, slotW: slotW };
}

function drawText(pptx, slide, zone, data, ctx) {
  let value = data.value || data.text || '';
  if (!value) return;
  const heightMode = textHeightMode(data);

  const ceiling = data.fontSize || TEXT_CEILINGS[zone.class] || FALLBACK_CEILING;
  const color = data.color || data.colour || COLOURS.body;
  const displayColor = baseColourForRole(color, data.colorRole);
  const align = textAlign(data);

  let indent = 0;
  if (isSticky(value)) {
    const star = starIndent(zone.h);
    if (star) {
      drawSignal(slide, 'star', {
        x: zone.x + PAD,
        y: zone.y + (zone.h - star.h) / 2, h: star.h
      });
      value = String(value).replace(/^\s*✨\s*/, '');
      indent = star.indent;
    }
  }

  const pictureLayout = optionalPictureLayout(zone, data, ctx, indent, ceiling, value);
  const pictureSlotW = pictureLayout ? pictureLayout.slotW : 0;

  // Run the value through the shared inline-marker formatter, the same way every
  // other rendered-text type does (steps, table cells, question strings). Plain
  // text with no markers comes back unchanged, so existing slides are untouched;
  // a value carrying **stress**, a ||answer reveal, or a [[focus]] span renders
  // as styled runs instead of literal asterisks and pipes. The block's own colour
  // is passed as the base so a coloured line (a blue question, a green prompt)
  // keeps that colour on its unmarked words.
  slide.addText(presentationRuns(value, true, color, data), {
    x: zone.x + PAD + indent, y: zone.y + PAD,
    w: zone.w - 2 * PAD - indent - pictureSlotW, h: zone.h - 2 * PAD,
    fontFace: FONT, fontSize: ceiling, bold: true,
    color: displayColor, align: align, valign: 'middle',
    margin: 0, fit: FIT,
    objectName: zone.textFitGroup
      ? growFitObjectName(zone.textFitGroup, ceiling, 'row-text')
      : (heightMode === 'fill'
          ? growFitObjectName(
              fitGroupId(zone, 'fill-text'),
              data.fontSize || fillGrowCeiling(value),
              'fill-text'
            )
          : undefined)
  });

  if (pictureLayout) {
    drawContentPicture(slide, pictureLayout.picture, {
      x: zone.x + zone.w - PAD - pictureLayout.metrics.w,
      y: zone.y + (zone.h - pictureLayout.metrics.h) / 2,
      w: pictureLayout.metrics.w,
      h: pictureLayout.metrics.h
    }, { objectName: 'text-context' });
  }
}

// Card-look measure: the height this text needs at its full written size, so
// the card hugs the words instead of spanning a tall zone. Two rules protect
// readability, the one trade the card look is never allowed to make:
// the estimate is generous (wide glyph, roomy line height), and when the
// text is space-CONSTRAINED (the estimate meets or exceeds the zone) this
// returns null so the card spans the whole zone and the text keeps every
// inch the flat look would have given it - hugging is only for slack.
function measureText(zone, data, ctx) {
  const value = String(data.value || data.text || '');
  if (!value) return null;
  if (textHeightMode(data) === 'fill') return null;
  const fs = data.fontSize || TEXT_CEILINGS[zone.class] || FALLBACK_CEILING;
  const lineH  = fs / 72 * 1.32;
  // A sticky line loses width to its star, so the estimate charges for the
  // widest star the block could take - generous, per this function's contract.
  const stickyIndent = isSticky(value) ? signalWidth('star', STAR_H_MAX) + STAR_GAP : 0;
  const baseW = Math.max(0.5, zone.w - 2 * PAD - stickyIndent);
  const pictureLayout = optionalPictureLayout(zone, data, ctx, stickyIndent, fs, value);
  const availW = Math.max(0.5, baseW - (pictureLayout ? pictureLayout.slotW : 0));
  const lines = estimateLines(value, fs, availW);
  const estH = lines * lineH + 2 * PAD + 0.04;
  // An equalised row's text cards measure their full sub-zone: every peer
  // reports the same rect, so every card hugs the same height and the row
  // reads as one family of equal boxes.
  if (zone.equalTextCardHeight) {
    return {
      x: zone.x,
      y: zone.y,
      w: zone.w,
      h: zone.h,
      clamp: true
    };
  }
  if (estH >= zone.h) return null;

  // `widthMode: "content"` lets a short statement's card hug its written
  // width instead of spanning the zone; `placement` then anchors that
  // narrower card at the left, centre or right of the space it was given.
  let measuredX = zone.x;
  let measuredW = zone.w;
  if (data.widthMode === 'content') {
    const longestLine = value.split('\n').reduce(function (longest, line) {
      return Math.max(longest, line.length);
    }, 0);
    const naturalW =
      longestLine * fs * 0.58 / 72 +
      2 * PAD +
      stickyIndent;
    measuredW = Math.min(zone.w, Math.max(0.5, naturalW));
    const placement = textPlacement(data);
    if (placement === 'center') {
      measuredX = zone.x + (zone.w - measuredW) / 2;
    } else if (placement === 'right') {
      measuredX = zone.x + zone.w - measuredW;
    }
  }

  return {
    x: measuredX,
    y: zone.y,
    w: measuredW,
    h: estH,
    clamp: true
  };
}

module.exports = { drawText, measureText };
