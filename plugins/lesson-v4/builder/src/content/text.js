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
// character comes off the rendered words. In a landscape zone the star sits at
// the left, centred on the block's height. In a portrait zone - a sidebar card
// taller than it is wide - a left star steals scarce width and pushes every
// line of the fact off-centre, so there the star sits centred above the words
// and the text keeps the full card width.
const STAR_H_MAX     = 0.40;
const STAR_TOP_H_MAX = 0.80;
const STAR_GAP       = 0.10;

function starIndent(zoneH) {
  const h = Math.min(STAR_H_MAX, Math.max(0.2, zoneH - 2 * PAD) * 0.8);
  const w = signalWidth('star', h);
  return w ? { h: h, w: w, indent: w + STAR_GAP } : null;
}

function starTopInset(zone) {
  const h = Math.min(STAR_TOP_H_MAX, Math.max(0.2, zone.h - 2 * PAD) * 0.2);
  const w = signalWidth('star', h);
  return w ? { h: h, w: w, inset: h + STAR_GAP } : null;
}

function isPortrait(zone) {
  return zone.h > zone.w;
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

// A block whose every line is an answer reveal is the whole point of its slide,
// and hugging leaves it small in the top corner of a full-width white card with
// the rest of the slide empty (the teacher, 19 September 2026: "the card isnt
// great because its the full width of deadspace ... they can be bigger right?").
// So a reveal fills its zone unless the designer said otherwise. A line that is
// only partly an answer is ordinary teaching text and hugs as before.
function wholeBlockIsAnAnswer(value) {
  const lines = String(value || '').split('\n').map(function (line) { return line.trim(); })
    .filter(function (line) { return line !== ''; });
  if (!lines.length) return false;
  // A leading reveal marker colours every paragraph after it, so the first line
  // deciding is the same rule the colouring uses.
  return /^(\|\||\{\{)/.test(lines[0]);
}

function textHeightMode(data) {
  if (data.heightMode === undefined && wholeBlockIsAnAnswer(data.value || data.text)) {
    return 'fill';
  }
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

// Cards that belong together on one slide share one text size, wherever they
// sit. A row could already do this for its own members, but a column of cards
// beside a picture, or the captions under three pictures, live in separate
// zones, and each one used to settle on the largest size its own words
// allowed: a short line came out huge beside a long one and the slide read as
// random (the teacher, 13 September 2026: "we make sure things are spaced same
// width and height in different elements too"). Every text item carrying the
// same `sizeGroup` on a slide joins one fit group, which settles on the size
// its longest member needs.
function sizeGroupName(data, ceiling) {
  if (typeof data.sizeGroup !== 'string' || !data.sizeGroup.trim()) return null;
  return growFitObjectName('size-' + data.sizeGroup.trim(), ceiling, 'size-group');
}

function drawText(pptx, slide, zone, data, ctx) {
  let value = data.value || data.text || '';
  if (!value) return;
  const heightMode = textHeightMode(data);

  const ceiling = data.fontSize || TEXT_CEILINGS[zone.class] || FALLBACK_CEILING;
  // A sticky-knowledge line reads in purple, the colour the LO already wears,
  // so a child knows at a glance that this sentence is one to keep rather than
  // teacher talk (black) or a job for them (blue). A colour the designer set
  // on purpose still wins.
  const stickyLine = isSticky(data.value);
  const color = data.color || data.colour || (stickyLine ? COLOURS.sticky : COLOURS.body);
  const displayColor = baseColourForRole(color, data.colorRole);
  const align = textAlign(data);

  let indent = 0;
  let topInset = 0;
  if (isSticky(value)) {
    if (isPortrait(zone)) {
      const star = starTopInset(zone);
      if (star) {
        drawSignal(slide, 'star', {
          x: zone.x + (zone.w - star.w) / 2,
          y: zone.y + PAD, h: star.h
        });
        value = String(value).replace(/^\s*✨\s*/, '');
        topInset = star.inset;
      }
    } else {
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
    x: zone.x + PAD + indent, y: zone.y + PAD + topInset,
    w: zone.w - 2 * PAD - indent - pictureSlotW, h: zone.h - 2 * PAD - topInset,
    fontFace: FONT, fontSize: ceiling, bold: true,
    // The zone normally centres its text, which is the teacher's standard.
    // A zone that sets `valignTop` is one where two cards hold the same kind of
    // thing at different lengths and the pair has to be read line against line:
    // the launch's strong instance beside its weak one, where a centred short
    // card floats half a card below the long one it is being compared with.
    color: displayColor, align: align, valign: zone.valignTop ? 'top' : 'middle',
    margin: 0, fit: FIT,
    objectName: sizeGroupName(
      data,
      heightMode === 'fill' ? (data.fontSize || fillGrowCeiling(value)) : ceiling
    ) || (zone.textFitGroup
      ? growFitObjectName(zone.textFitGroup, ceiling, 'row-text')
      : (heightMode === 'fill'
          ? growFitObjectName(
              fitGroupId(zone, 'fill-text'),
              data.fontSize || fillGrowCeiling(value),
              'fill-text'
            )
          : undefined))
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
  // A sticky line pays for its star where the star will actually sit: width
  // in a landscape zone, height in a portrait one - generous either way, per
  // this function's contract.
  const sticky = isSticky(value);
  const portrait = isPortrait(zone);
  const stickyIndent = sticky && !portrait
    ? signalWidth('star', STAR_H_MAX) + STAR_GAP
    : 0;
  const baseW = Math.max(0.5, zone.w - 2 * PAD - stickyIndent);
  const pictureLayout = optionalPictureLayout(zone, data, ctx, stickyIndent, fs, value);
  const availW = Math.max(0.5, baseW - (pictureLayout ? pictureLayout.slotW : 0));
  const lines = estimateLines(value, fs, availW);
  const estH = lines * lineH + 2 * PAD + 0.04 +
    (sticky && portrait ? STAR_TOP_H_MAX + STAR_GAP : 0);
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

module.exports = { drawText, measureText, estimateLines };
