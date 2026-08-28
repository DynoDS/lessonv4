'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const {
  baseColourForRole,
  presentationRuns
} = require('../presentation-text');
const { itemText } = require('../content-picture');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.05;
// Dynamic font sizing: bullets grow to fill the zone rather than sitting at a
// fixed size and leaving whitespace below. The font is chosen from the actual
// wrapped line count of the items at the candidate size, then clamped between
// FONT_MIN and FONT_MAX. Shrink-to-fit remains as a safety net.
const FONT_MIN     = 14;
const FONT_MAX     = 36;
const CHAR_W_EM    = 0.58;
const LINE_SPACING = 1.12;
// Items that already begin with their own marker act as their own visual
// marker — adding a PowerPoint disc bullet on top reads as two markers.
// Two such cases: a leading emoji/pictograph, and an enumerator the author
// typed deliberately because it is load-bearing (multiple-choice options the
// child ticks by letter — "A) ...", "(a) ...", "1. ..."). Detect either and
// suppress the disc per-item, so a tick-one list reads "A) ..." not "• A) ...".
const EMOJI_PREFIX = /^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2190}-\u{21FF}]/u;
const ENUM_PREFIX  = /^\(?[A-Za-z0-9]{1,2}[).]\s/;
// ─── END CONSTANTS ────────────────────────────────────────────

function visibleLength(text) {
  return String(text)
    .replace(/\|\|/g, ' ')
    .replace(/\*\*|\[\[|\]\]|\{\{|\}\}|<<|>>/g, '')
    .length;
}

function wrappedLines(text, fontPt, widthIn) {
  const glyphW = fontPt * CHAR_W_EM / 72;
  return String(text).split('\n').reduce(function (total, line) {
    const naturalW = visibleLength(line) * glyphW;
    return total + Math.max(
      1,
      Math.ceil(naturalW / Math.max(0.4, widthIn))
    );
  }, 0);
}

function chooseBulletFont(items, widthIn, heightIn) {
  const source = Array.isArray(items) ? items : [];
  for (let pt = FONT_MAX; pt >= FONT_MIN; pt -= 1) {
    const lines = source.reduce(function (total, item) {
      return total + wrappedLines(itemText(item), pt, widthIn);
    }, 0);
    // Line pitch at the spacing the renderer actually applies: the drawn list
    // uses lineSpacingMultiple: LINE_SPACING, so that is the inches-per-line
    // the zone has to carry.
    const neededH = lines * (pt / 72) * LINE_SPACING;
    if (neededH <= heightIn) return pt;
  }
  return FONT_MIN;
}

function drawBullets(pptx, slide, zone, data) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return;

  const innerW = Math.max(0.4, zone.w - 2 * PAD);
  const innerH = Math.max(0.1, zone.h - 2 * PAD);
  const fontSize = chooseBulletFont(items, innerW, innerH);

  // Each item is run through the shared presentation formatter, the same way
  // text, steps, and table cells are — so a **stress**, a ||answer reveal, a
  // [[focus]] word, or an emphasis role inside a bullet renders as styled
  // runs instead of literal asterisks, pipes, and brackets. A plain item with
  // no markers comes back as one run, identical to before. The formatter may
  // return several runs for one item, so the list is flattened: the disc
  // bullet belongs to the paragraph and rides on the item's first run, and
  // the line break ends the paragraph so it rides on the item's last run;
  // the runs between simply flow inline.
  const runs = [];
  items.forEach(function (it, i) {
    const source = it && typeof it === 'object' && !Array.isArray(it)
      ? it
      : {};
    const text = itemText(it);
    const useDiscBullet = !EMOJI_PREFIX.test(text) && !ENUM_PREFIX.test(text);
    const baseColor = baseColourForRole(COLOURS.body, source.colorRole);
    const parsed = presentationRuns(text, true, COLOURS.body, source);
    const itemRuns = Array.isArray(parsed)
      ? parsed.map(function (r) {
          return {
            text: r.text,
            options: Object.assign({}, r.options)
          };
        })
      : [{
          text: parsed,
          options: { color: baseColor, bold: true }
        }];

    itemRuns[0].options.bullet = useDiscBullet;
    itemRuns[itemRuns.length - 1].options.breakLine = i < items.length - 1;
    itemRuns.forEach(function (r) { runs.push(r); });
  });

  slide.addText(
    runs,
    {
      x: zone.x + PAD, y: zone.y + PAD,
      w: innerW, h: innerH,
      fontFace: FONT, fontSize: fontSize, bold: true,
      color: COLOURS.body,
      align: 'left', valign: 'middle', margin: 0,
      lineSpacingMultiple: LINE_SPACING,
      fit: FIT
    }
  );
}

module.exports = { drawBullets, chooseBulletFont };
