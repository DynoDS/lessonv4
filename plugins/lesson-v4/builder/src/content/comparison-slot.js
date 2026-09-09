'use strict';

// Renders the EMPTY SLOT between two things being compared: the ring a child
// writes <, > or = into.
//
// Every comparison lesson needs one, and before this existed each deck typed a
// ○ character into a text item at a hand-picked point size. That works until
// something beside it changes size, and then it does not: on a Year 4 deck the
// charts either side grew and a 44pt ring that had looked passable beside small
// charts became a dot floating in a tall white box. A typed character also
// carries a text item's full-height card, so the ring sat in a pill that lined
// up with nothing.
//
// A slot is not text. It is a piece of the diagram, so it is sized from the
// room it is given like every other drawn thing here, and it draws its own
// surface rather than wearing a card.

const { FONT, COLOURS } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.06;
const MAX_D        = 1.30;  // inches. Past this the ring stops reading as a
                            // slot beside its charts and starts competing with
                            // them for the eye
const MIN_D        = 0.34;  // below this nobody can write a symbol inside it
const RING_PT      = 2.5;   // the outline, in points: heavier than a table rule
                            // because this is the thing the lesson asks a child
                            // to fill in
const ANSWER_SHARE = 0.62;  // a filled symbol's height, as a share of the ring
// ─── END CONSTANTS ────────────────────────────────────────────

function drawComparisonSlot(pptx, slide, zone, data, ctx) {
  const answer = data && data.answer != null ? String(data.answer) : '';

  // Square, and as big as the smaller side of the zone allows. A slot in a
  // tall narrow gap between two charts is limited by the width it has, not by
  // the height, which is exactly what stops it stretching into a pill.
  const d = Math.max(
    MIN_D,
    Math.min(MAX_D, zone.w - 2 * PAD, zone.h - 2 * PAD)
  );

  const x = zone.x + (zone.w - d) / 2;
  const y = zone.y + (zone.h - d) / 2;

  slide.addShape(pptx.shapes.OVAL, {
    x, y, w: d, h: d,
    fill: { color: 'FFFFFF' },
    line: { color: COLOURS.body, width: RING_PT }
  });

  if (answer !== '') {
    // A revealed symbol is printed inside the same ring rather than replacing
    // it, so the answer slide and the question slide read as the same picture
    // with one thing added.
    slide.addText(answer, {
      x, y, w: d, h: d,
      fontFace: FONT,
      fontSize: Math.round((d * ANSWER_SHARE * 72) / 1.1),
      bold: true,
      color: COLOURS.green,
      align: 'center', valign: 'middle', margin: 0,
      objectName: 'NOFIT_comparison-slot-answer'
    });
  }
}

// The rect a card behind this slot would cover. It paints its own surface, so
// the answer is the ring itself and nothing wider.
function measureComparisonSlot(zone) {
  const d = Math.max(
    MIN_D,
    Math.min(MAX_D, zone.w - 2 * PAD, zone.h - 2 * PAD)
  );

  return {
    x: zone.x + (zone.w - d) / 2,
    y: zone.y + (zone.h - d) / 2,
    w: d,
    h: d
  };
}

// The widest this slot can ever usefully be. A row shares width out by counting
// its items, so a slot beside two charts took a third of the row and used a
// fraction of it, holding the charts either side to two thirds of the width
// they could have had. Declaring the cap lets the row give that width to the
// things that can read better for having it.
function maxUsefulWidthComparisonSlot() {
  return MAX_D + 2 * PAD;
}

module.exports = {
  drawComparisonSlot,
  measureComparisonSlot,
  maxUsefulWidthComparisonSlot
};
