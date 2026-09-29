'use strict';

const fs = require("node:fs");
const {
  validateSemanticEducationalSvgVisual,
} = require("../../../shared/educational-svg-asset");

const { FONT, COLOURS, FIT } = require('../styles');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { warn } = require('../warnings');
const drawMoney = require('./shared-figure').drawerFor('money');
const { drawImage, imageWillDraw } = require('./image');
const { drawAngle } = require('./angle');
const { drawTriangle, drawTriangleNonExample } = require('./triangle');
const { drawLinePair } = require('./line-pair');
const { drawGeoboard } = require('./geoboard');
const { drawVenn } = require('./venn');
const { drawCarroll } = require('./carroll');
const { drawRainforestLayers } = require('./rainforest-layers');
const { drawerFor } = require('./shared-figure');
const drawNumberline = drawerFor('numberline');
const drawTurnDiagram = drawerFor('turn-diagram');
const drawPolygon = drawerFor('polygon');
const drawPlaceValueMini = drawerFor('place-value-mini');
const { splitAnswerRuns } = require('../answer-text');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.15;
// The grow-fit ceiling, not a fixed size. The card used to pin its text at
// 16pt with shrink-only autofit, so a one-word slide sat in a wide cream box
// with small type and a lot of dead space: Daniel measured the same box
// taking 40pt before the text outgrew it. Every other text surface in the
// deck already grows through the fit pass; this card was the one left behind.
// 40 matches the deck's largest ceiling (the question cards and the
// lesson-cover LO), and the fit pass still shrinks a four-entry card to what
// its rows can hold.
const FONT_MAX         = 40;
const FILL_COLOUR      = 'FFF9E6';
const BORDER_COLOUR    = 'CCCCCC';
const RECT_RADIUS      = 0.04;
const DIVIDER_H        = 0.02;
const ROW_PAD_Y        = 0.06;
const VISUAL_COL_FRAC  = 0.28;   // fraction of boxW reserved for the visual column
const VISUAL_INNER_PAD = 0.06;   // padding inside the visual cell
// ─── END CONSTANTS ────────────────────────────────────────────

// A vocab card draws ANY content the deck can draw. It used to take a fixed
// list of fourteen, and everything else - a clock for "quarter past", a
// fraction wall for "equivalent", a bar model for "whole", a number line for
// "interval" - was dropped from the card with a warning. The list was said to
// exist because the picture cell was small, but mostly nothing was ever added
// to it: a Year 4 vocabulary slide was hand-built from free stacks instead of
// these cards because the card refused its number line (12 September 2026),
// and Daniel's ruling was that a vocabulary card refuses nothing. The panel is
// sized to the picture instead (key-vocabulary.js); a picture with a bespoke
// small-card treatment below keeps it, and everything else draws through the
// same dispatcher every other slide uses.
// resolveVocabVisual is the single gate the card layouts call before reserving
// any space: it returns the visual when it will actually draw, and otherwise
// returns null so the card treats itself as having no picture — full-width text,
// no empty framed panel — rather than reserving a cell that ends up blank or, on
// older builds, stamped with a "[type]" token. A genuinely unsupported type is
// surfaced as a build warning so the slide spec gets corrected upstream; an
// absent or empty visual is simply "no picture" and passes quietly.
function resolveVocabVisual(visual, ctx) {
  if (!visual || !visual.type) return null;
  const t = visual.type;
  if (t === "image" && visual.kind === "educational-svg") {
    const checked = validateSemanticEducationalSvgVisual(
      visual,
      ctx && ctx.lessonDir,
      "semantic vocabulary Educational SVG visual"
    );
    if (checked.error) {
      if (ctx) {
        warn(
          ctx.slideIndex,
          `${checked.error} The vocabulary card was rendered text-only.`
        );
      }
      return null;
    }
    if (!checked.resolvedPath || !fs.existsSync(checked.resolvedPath)) return null;
    return visual;
  }
  // A photo has to clear a second hurdle the drawn visuals don't: its file has to
  // be there. Asking only whether `image` is a type this card can draw let a card
  // reserve its picture cell for a photo that was never sourced, and the cell then
  // printed as an empty framed box a quarter of the card wide. "Can I draw this
  // kind of thing?" is not the question this gate exists to answer; "will anything
  // appear here?" is.
  if (t === 'image') return imageWillDraw(visual, ctx) ? visual : null;
  if (t === 'text') {
    return (visual.value != null && String(visual.value) !== '') ? visual : null;
  }
  // Lazy: the dispatcher itself requires this file for the `vocab` object.
  if (Object.prototype.hasOwnProperty.call(require('./index').ZONE_COMPAT, t)) return visual;
  if (ctx) warn(ctx.slideIndex, 'vocab visual type "' + t + '" is not something the deck can draw, so the card is text-only. Check the type name against templates.md.');
  return null;
}

// A picture made of words: an example sentence, a number sentence, or a whole
// family of them ("0 + 10 = {{10}}" to "10 + 0 = {{10}}"), one per line.
//
// It printed at a size worked out from its character count inside a panel the
// card sized for a small drawing, so "7 + 3 = 10" sat at about 23pt in a tall,
// narrow grey box on a Year 4 maths vocabulary card (29 September 2026). Now its
// lines are laid out in one, two or three columns, whichever lets them print
// largest in the panel's height, and the panel takes the width that layout
// needs. Each line stays on one line; the size stops at TEXT_PICTURE_MAX.
const TEXT_PICTURE_MAX = 60;
const TEXT_PICTURE_MIN = 18;
const TEXT_PICTURE_LINE = 1.25;
const TEXT_PICTURE_COL_GAP = 0.3;
const TEXT_PICTURE_SLACK = 0.15;

function textPictureLines(value) {
  return String(value == null ? '' : value).split('\n')
    .map(function (line) { return line.trim(); })
    .filter(Boolean);
}

function textPictureLayout(value, availH, maxW) {
  const { textBoxWidthIn } = require('../glyph-width');
  const lines = textPictureLines(value);
  if (!lines.length) return null;
  const plain = lines.map(function (line) {
    return line.replace(/\{\{|\}\}|\[\[|\]\]|<<|>>|\*\*|\|\||\(\(|\)\)/g, '');
  });
  let best = null;
  for (let columns = 1; columns <= Math.min(3, lines.length); columns += 1) {
    const rows = Math.ceil(lines.length / columns);
    for (let pt = TEXT_PICTURE_MAX; pt >= TEXT_PICTURE_MIN; pt -= 1) {
      if (best && pt <= best.size) break;
      if (rows * pt * TEXT_PICTURE_LINE / 72 > availH) continue;
      const colW = plain.reduce(function (most, line) {
        return Math.max(most, textBoxWidthIn(line, pt, false));
      }, 0) + TEXT_PICTURE_SLACK;
      const w = columns * colW + (columns - 1) * TEXT_PICTURE_COL_GAP;
      if (w > maxW) continue;
      best = { size: pt, columns: columns, rows: rows, colW: colW, w: w, lines: lines };
      break;
    }
  }
  return best;
}

function drawTextPicture(slide, zone, value) {
  const layout = textPictureLayout(value, zone.h, zone.w);
  if (!layout) return false;
  const lineH = layout.size * TEXT_PICTURE_LINE / 72;
  const blockW = layout.w;
  const blockH = layout.rows * lineH;
  const x0 = zone.x + (zone.w - blockW) / 2;
  const y0 = zone.y + (zone.h - blockH) / 2;
  layout.lines.forEach(function (line, i) {
    const col = Math.floor(i / layout.rows);
    const row = i % layout.rows;
    slide.addText(splitAnswerRuns(line, false, COLOURS.body), {
      x: x0 + col * (layout.colW + TEXT_PICTURE_COL_GAP), y: y0 + row * lineH,
      w: layout.colW, h: lineH,
      fontFace: FONT, fontSize: layout.size, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT, wrap: false
    });
  });
  return true;
}

function drawVisual(pptx, slide, zone, visual, ctx) {
  if (!visual || !visual.type) return;
  if (visual.type === 'money') return drawMoney(pptx, slide, zone, visual, ctx);
  if (visual.type === 'image') return drawImage(pptx, slide, zone, visual, ctx);
  if (visual.type === 'turn-diagram') return drawTurnDiagram(pptx, slide, zone, visual, ctx);
  if (visual.type === 'angle') return drawAngle(pptx, slide, zone, visual, ctx);
  if (visual.type === 'triangle') return drawTriangle(pptx, slide, zone, visual, ctx);
  if (visual.type === 'triangle-nonexample') return drawTriangleNonExample(pptx, slide, zone, visual, ctx);
  if (visual.type === 'line-pair') return drawLinePair(pptx, slide, zone, visual, ctx);
  if (visual.type === 'geoboard') return drawGeoboard(pptx, slide, zone, visual, ctx);
  if (visual.type === 'polygon') return drawPolygon(pptx, slide, zone, visual, ctx);
  if (visual.type === 'venn') return drawVenn(pptx, slide, zone, visual, ctx);
  if (visual.type === 'carroll') return drawCarroll(pptx, slide, zone, visual, ctx);
  if (visual.type === 'place-value-mini') return drawPlaceValueMini(pptx, slide, zone, visual, ctx);
  // "Interval", "scale", "count on": words whose meaning is a place on a line.
  // The card gives it a wide panel (see key-vocabulary.js), because a number
  // line needs length, not height.
  if (visual.type === 'numberline') return drawNumberline(pptx, slide, zone, visual, ctx);
  // A layer word ("canopy", "understorey") is best shown as the whole cross
  // section with that one layer highlighted and the other three dimmed — the
  // child sees where in the forest the word lives, not just a patch of green.
  // Drop `labels` on a vocab card: the word is already printed beside it.
  if (visual.type === 'rainforest-layers') return drawRainforestLayers(pptx, slide, zone, visual, ctx);
  if (visual.type === 'text') {
    const value = visual.value != null ? String(visual.value) : '';
    if (!value) return;
    if (drawTextPicture(slide, zone, value)) return;
    const tokens = value.trim().split(/\s+/);
    const notationSequence = visual.singleLine === true ||
      (visual.singleLine !== false && value.length <= 12 && tokens.length > 1 &&
        tokens.every(function (token) { return token.length <= 3; }));
    const singleLineFont = notationSequence
      ? Math.max(18, Math.min(48, Math.floor((zone.w * 72) / Math.max(1, value.length * 0.62))))
      : 48;
    // The visual is the card's example slot — the word or phrase shown in action.
    // Run it through the shared inline-marker formatter so a designer highlighting
    // the example ("[[Relax]]. [[Unwind]]. [[Escape]].") gets coloured, weighted
    // words rather than literal brackets. Plain example text is returned unchanged.
    slide.addText(splitAnswerRuns(value, false, COLOURS.body), {
      x: zone.x, y: zone.y, w: zone.w, h: zone.h,
      fontFace: FONT, fontSize: singleLineFont,
      color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT,
      breakLine: false,
      wrap: !notationSequence
    });
    return;
  }
  // Everything else draws exactly as it would on any other slide.
  return require('./index').drawContent(pptx, slide, zone, visual, ctx);
}

function drawVocab(pptx, slide, zone, data, ctx) {
  const words = Array.isArray(data.words) ? data.words : [];
  if (words.length === 0) return;

  // Resolve each card's visual once. A visual that can't render counts as no
  // picture, so the column is only reserved when at least one card truly has one.
  const resolved = words.map(function (w) { return resolveVocabVisual(w.visual, ctx); });
  const hasVisuals = resolved.some(Boolean);

  const boxX = zone.x + PAD;
  const boxY = zone.y + PAD;
  const boxW = zone.w - 2 * PAD;
  const boxH = zone.h - 2 * PAD;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: boxX, y: boxY, w: boxW, h: boxH,
    fill: { color: FILL_COLOUR },
    line: { color: BORDER_COLOUR, width: 1 },
    rectRadius: RECT_RADIUS
  });

  const visualColW = hasVisuals ? boxW * VISUAL_COL_FRAC : 0;
  const textColW   = boxW - visualColW;
  const rowH       = boxH / words.length;

  // One fit group for the whole card, so every row lands on the same final
  // size (the smallest any row can take) and the card reads as one set.
  const textGroup = fitGroupId(zone, 'vocab-defn');

  words.forEach(function (item, i) {
    const rowY = boxY + i * rowH;

    // A colon, not an em dash: the em dash is not part of this teacher's
    // written voice anywhere a child reads (preferences.md, Written Voice).
    const runs = [
      { text: item.word || '',
        options: { color: COLOURS.green, bold: true } },
      { text: ': ' + (item.definition || ''),
        options: { color: COLOURS.body, bold: true } }
    ];

    slide.addText(runs, {
      x: boxX + PAD, y: rowY + ROW_PAD_Y,
      w: textColW - 2 * PAD, h: rowH - 2 * ROW_PAD_Y,
      fontFace: FONT, fontSize: FONT_MAX,
      align: 'left', valign: 'middle', margin: 0, fit: FIT,
      objectName: growFitObjectName(textGroup, FONT_MAX, 'vocab-' + i)
    });

    if (hasVisuals && resolved[i]) {
      const visualZone = {
        x: boxX + textColW + VISUAL_INNER_PAD,
        y: rowY + VISUAL_INNER_PAD,
        w: visualColW - 2 * VISUAL_INNER_PAD,
        h: rowH - 2 * VISUAL_INNER_PAD
      };
      drawVisual(pptx, slide, visualZone, resolved[i], ctx);
    }

    if (i < words.length - 1) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: boxX + PAD, y: rowY + rowH - DIVIDER_H / 2,
        w: boxW - 2 * PAD, h: DIVIDER_H,
        fill: { color: COLOURS.green },
        line: { color: COLOURS.green, width: 0 }
      });
    }
  });
}

module.exports = { drawVocab, drawVisual, resolveVocabVisual, textPictureLayout };
