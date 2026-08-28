'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { arrow } = require('./_geom');

// A callout: one short line of text in a small coloured box, with an arrow that
// leaves the box and points at the thing the line is about.
//
// This is the general annotation piece — the slide's way of pointing at its own
// content and saying one thing about it. Beside a place value chart: "The tens
// column changes." Beside a number line: "Each jump is 10." Beside a photograph:
// "This is the river's source." Without it, the only place that sentence can go
// is a text panel beside the picture (where nothing connects the words to the
// part they describe) or the speaker notes (where the class never sees them), and
// the pointing is left to the teacher's finger.
//
// The arrow is the whole point, so it is aimed rather than decorative:
//   points   which way the arrow goes — up / down / left / right (or none)
//   at       how far along that edge the arrow TIP lands, 0 to 1, so the arrow
//            reaches the tens column rather than the middle of the chart
// The tip is placed on the edge of the callout's own zone, as close as the layout
// lets it get to the neighbouring content, and the box sits back behind it.
//
// Key words inside the line carry colour with the deck's ordinary inline markers,
// which is why there is no separate colouring mechanism here: `[[tens]]` is the
// focus blue, `{{green}}` the answer green, `<<orange>>` supplied information,
// `**bold**` plain stress. So "The [[tens]] column changes." colours "tens" in
// exactly the blue every other slide uses for the word being decided on.

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD           = 0.06;   // inset from the zone edge, inches
const BOX_PAD_X     = 0.16;   // text inset inside the box, left+right, inches
const BOX_PAD_Y     = 0.10;   // text inset inside the box, top+bottom, inches
const BOX_RADIUS    = 0.08;   // box corner radius, inches
const BOX_BORDER_W  = 2.5;    // the coloured edge, points — heavier than an
                              // ordinary panel outline, because the edge colour is
                              // what tells a child this is an aside about the
                              // picture rather than more of the picture
const FONT_MAX      = 32;     // callout line font ceiling, points
const FONT_MIN      = 12;     // ...and floor (>= MIN_FONT_PT)
const LINE_H_RATIO  = 1.28;   // line height as a multiple of font size
const CHAR_W_EM     = 0.55;   // Comic Sans bold character width estimate, ems
const MAX_LINES     = 3;      // a callout is one short line; two or three are the
                              // most a narrow zone should ever force it onto
const ARROW_LEN_MAX = 0.90;   // longest the arrow is drawn, inches. Capped so a
                              // callout dropped into a tall zone points with a
                              // short deliberate arrow rather than a long stem
                              // wandering across empty slide
const ARROW_LEN_MIN = 0.22;   // below this there is no room to point, and the
                              // callout draws as a plain note box instead
const ARROW_W       = 4;      // arrow line width, points
const ARROW_INSET   = 0.10;   // keeps the arrow's tail off the box's rounded
                              // corner when the tip is far to one side, inches
const REACH_MAX     = 1.60;   // the furthest `reach` may push the tip PAST the
                              // callout's own zone, inches. Bounded because the
                              // helper cannot see what is out there: past about
                              // this much it is as likely to land on a heading or
                              // inside the figure as on the edge of it

// The house colours, each saying something different about the line inside:
//   green  an observation about what happened or what is true — the default,
//          because that is what a callout beside a diagram nearly always is
//   blue   the focus: the thing the class is deciding on
//   orange information the question supplies
//   purple the objective / what we are learning to do
const VARIANTS = {
  green:  { fill: 'D5F5E3', line: COLOURS.green  },
  blue:   { fill: 'DEEAF1', line: COLOURS.title  },
  orange: { fill: 'FFF2CC', line: COLOURS.orange },
  purple: { fill: 'EDE3F5', line: COLOURS.lo     }
};
const DEFAULT_VARIANT = 'green';

// `points` in the designer's words, and the two names a designer might reach for
// instead (the side the arrow leaves from rather than the way it travels).
const DIRECTIONS = {
  up: 'up', top: 'up',
  down: 'down', bottom: 'down',
  left: 'left',
  right: 'right',
  none: 'none'
};
const DEFAULT_DIRECTION = 'up';
// A plain note box (`points: "none"`) has no arrow to aim, so it anchors
// inside its zone instead: `placement` picks which edge the box hugs. The
// default is right — the long-standing points:none behaviour — and `left`
// with a second callout's `right` gives two sort destinations that sit at
// the outer edges of the slide rather than drifting to its middle.
const PLACEMENTS = new Set(['left', 'center', 'right']);
const DEFAULT_PLACEMENT = 'right';
// ─── END CONSTANTS ────────────────────────────────────────────

// The plain reading length of the line: the colour markers are instructions to
// the renderer, not characters on the board, so counting them would size the box
// for text that is never drawn.
function plainLength(text) {
  return String(text)
    .replace(/\|\|/g, ' ')
    .replace(/\*\*|\[\[|\]\]|\{\{|\}\}|<<|>>/g, '')
    .length;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// The largest font at which the box fits the room it has, and the box that font
// produces. Growing the font grows the box, so this is the same "fill the space
// you are given" search the other helpers use.
function fitBox(text, availW, availH) {
  const chars = plainLength(text);
  let font = FONT_MAX;
  const floor = Math.max(FONT_MIN, MIN_FONT_PT);
  for (;;) {
    const lineH    = (font * LINE_H_RATIO) / 72;
    const naturalW = (chars * font * CHAR_W_EM) / 72;
    const maxTextW = Math.max(0.3, availW - 2 * BOX_PAD_X);
    const textW    = Math.min(naturalW, maxTextW);
    const lines    = Math.max(1, Math.ceil(naturalW / Math.max(textW, 0.1)));
    const w        = textW + 2 * BOX_PAD_X;
    const h        = lines * lineH + 2 * BOX_PAD_Y;
    if ((lines <= MAX_LINES && h <= availH) || font <= floor) {
      return { w: Math.min(w, availW), h: Math.min(h, availH), font: font };
    }
    font -= 1;
  }
}

function drawCallout(pptx, slide, zone, data) {
  const text = data && data.text != null ? String(data.text) : '';
  if (text.trim() === '') return;

  const variant  = VARIANTS[data.variant] || VARIANTS[DEFAULT_VARIANT];
  const rawDir   = data.points == null ? DEFAULT_DIRECTION : String(data.points).toLowerCase();
  const dir      = DIRECTIONS[rawDir] || DEFAULT_DIRECTION;
  const at       = clamp(data.at == null ? 0.5 : Number(data.at), 0, 1);
  const vertical = dir === 'up' || dir === 'down';

  const zx = zone.x + PAD;
  const zy = zone.y + PAD;
  const zw = Math.max(0.4, zone.w - 2 * PAD);
  const zh = Math.max(0.3, zone.h - 2 * PAD);

  // Reserve the arrow's room first, then let the box fill what is left. A callout
  // that sized its box to the whole zone would leave nothing to point with.
  let reserve = 0;
  if (dir !== 'none') {
    reserve = Math.min(ARROW_LEN_MAX, (vertical ? zh : zw) * 0.5);
    if (reserve < ARROW_LEN_MIN) reserve = 0;   // no room to point: a plain note box
  }
  const availW = vertical ? zw : zw - reserve;
  const availH = vertical ? zh - reserve : zh;
  const box    = fitBox(text, Math.max(0.4, availW), Math.max(0.25, availH));

  // Whatever the arrow does not need goes back, so a short line in a tall zone
  // still puts its tip on the zone edge with the box directly behind it.
  const arrowLen = dir === 'none'
    ? 0
    : Math.min(ARROW_LEN_MAX, Math.max(0, (vertical ? zh - box.h : zw - box.w)));

  // `reach` carries the tip PAST the zone edge.
  //
  // Left to itself the tip lands on the edge of the callout's own zone, which is
  // the closest this helper can legally get to its neighbour — and that is exactly
  // right when the neighbour fills its zone in that direction. It is wrong when
  // the neighbour floats: a chart that centres itself in a zone taller than it
  // needs sits well back from the shared edge, and an arrow stopping at the edge
  // then hangs in empty background and reads as broken. The helper cannot see any
  // of that; only the designer, looking at the built slide, knows how far short it
  // fell. So the gap is closed by a number they supply, and the catalogue's first
  // advice stays "give the figure a zone close to its natural size", because a
  // reach big enough to matter is usually a sign the split is wrong.
  const reach = dir === 'none'
    ? 0
    : clamp(data.reach == null ? 0 : Number(data.reach) || 0, 0, REACH_MAX);

  // The tip sits on the zone edge the callout points at — plus any reach — and the
  // box sits back behind it. A plain note box has no tip: it centres vertically
  // and anchors horizontally per its `placement`.
  let boxX, boxY, tipX, tipY, tailX, tailY;
  if (dir === 'none') {
    const requestedPlacement = String(data.placement || DEFAULT_PLACEMENT).toLowerCase();
    const placement = PLACEMENTS.has(requestedPlacement)
      ? requestedPlacement
      : DEFAULT_PLACEMENT;
    boxY = zy + Math.max(0, (zh - box.h) / 2);
    if (placement === 'left') {
      boxX = zx;
    } else if (placement === 'center') {
      boxX = zx + Math.max(0, (zw - box.w) / 2);
    } else {
      boxX = zx + zw - box.w;
    }
    tipX = boxX + box.w / 2;
    tipY = boxY + box.h / 2;
    tailX = tipX;
    tailY = tipY;
  } else if (vertical) {
    tipX = zx + at * zw;
    boxX = clamp(tipX - box.w / 2, zx, zx + zw - box.w);
    if (dir === 'up') {
      tipY  = zy - reach;
      boxY  = zy + arrowLen;
      tailY = boxY;
    } else {
      tipY  = zy + zh + reach;
      boxY  = zy + zh - arrowLen - box.h;
      tailY = boxY + box.h;
    }
    tailX = clamp(tipX, boxX + ARROW_INSET, boxX + box.w - ARROW_INSET);
  } else {
    tipY = zy + at * zh;
    boxY = clamp(tipY - box.h / 2, zy, zy + zh - box.h);
    if (dir === 'left') {
      tipX  = zx - reach;
      boxX  = zx + arrowLen;
      tailX = boxX;
    } else {
      tipX  = zx + zw + reach;
      boxX  = zx + zw - arrowLen - box.w;
      tailX = boxX + box.w;
    }
    tailY = clamp(tipY, boxY + ARROW_INSET, boxY + box.h - ARROW_INSET);
  }

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: boxX, y: boxY, w: box.w, h: box.h,
    fill: { color: variant.fill },
    line: { color: variant.line, width: BOX_BORDER_W },
    rectRadius: BOX_RADIUS
  });

  slide.addText(splitAnswerRuns(text, true), {
    x: boxX + BOX_PAD_X, y: boxY + BOX_PAD_Y,
    w: box.w - 2 * BOX_PAD_X, h: box.h - 2 * BOX_PAD_Y,
    fontFace: FONT, fontSize: box.font, bold: true,
    color: COLOURS.body, align: 'center', valign: 'middle',
    margin: 0, fit: FIT
  });

  // Drawn last so the head sits over the box's edge rather than under it.
  if (arrowLen >= ARROW_LEN_MIN) {
    arrow(pptx, slide, tailX, tailY, tipX, tipY, {
      color: variant.line, width: ARROW_W
    });
  }
}

module.exports = { drawCallout };
