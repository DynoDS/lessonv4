'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
const { textBoxWidthIn } = require('../glyph-width');
const jumpsGeo = require('../../../shared/visuals/number-line-jumps');
const { RING: HIGHLIGHT_COLOUR } = require('../../../shared/visuals/figure-highlight');
const { polygon, polyline } = require('./_geom');

// How big are the numbers a child actually reads off a number line?
//
// They were half the size of the words beside them, and the two reasons were
// independent - which is why raising the font ceiling from 14pt to 24pt, the
// last time this was reported, changed almost nothing.
//
//   1. EVERY AXIS LABEL WAS GIVEN THE SAME LITTLE BOX. A fixed 0.55in slot,
//      whatever the number. "0" sat in it at full size; "10,000" needs 0.93in,
//      so the fit pass shrank it until it fitted. Four-digit numbers landed in
//      between. The size of a numeral therefore tracked its DIGIT COUNT and
//      nothing else - so on a Year 4 deck, where every number on the line is
//      four digits, every number on the line was squashed, and the lone "0"
//      beside it stayed full size and made the mismatch obvious. This is the
//      exact failure src/glyph-width.js was written for; the number line was
//      never converted to it. Boxes are now measured from their own text, and
//      the axis is inset far enough for the end labels to sit inside the zone
//      at full size instead of being shrunk into a slot that overhangs it.
//
//   2. STACKING LINES SHRANK THE INK, NOT JUST THE SPACING. Each line claimed a
//      flat 2.00in of natural height whether or not it carried an arrow or an
//      answer, so three lines "needed" 6in; in a 3.3in zone everything was
//      scaled to 54% - numerals, arrowheads, dots and ticks together. The
//      arrows on a three-line slide came out half the length of the ones on a
//      single-line slide in the same deck. A line now claims the height it
//      actually uses: the arrow band only when it carries an arrow, the answer
//      band only when it carries an answer. Two endpoint-only lines, which
//      claimed 4in and were scaled to 81%, now claim about 1.4in and stay full
//      size.
//
// The fit pass stays switched on underneath all of this as a last resort for a
// genuinely crowded axis, where it now shrinks a numeral because the tick
// spacing really is too tight - not because the number was long.

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.15;
const LINE_H           = 0.04;
// Counting the equal intervals is step 3 of the success criteria, so the ticks
// are what the method is actually performed on from the back of the room. They
// were shorter than the gap beneath them and easy to lose against the rule.
const TICK_H           = 0.38;
const TALL_TICK_H      = 0.60;
const TICK_W           = 0.05;
const LABEL_GAP        = 0.08;
// The height one line of text actually occupies, measured the way the build's
// text fitter measures it: the point size, its line spacing, and the inset the
// fitter takes off a box before it fits anything into it.
//
// Reading a line as point-size alone understates it by more than a quarter, so
// every label band was born short, the fitter shrank the numeral to cope, and a
// scale a child has to read off the board came out below the projection floor.
// The numerals are the one thing on a number line the maths cannot be done
// without, so the band answers to them rather than the other way round.
// The fit pass's own line model: MEASUREMENT_LINE_HEIGHT_EM (1.2) times
// LINE_HEIGHT_SAFETY (1.02) in scripts/fit_text_postprocess.py. Taking a
// rounder, larger figure buys the numerals nothing the fitter asks for and
// spends the difference out of the arrows, ticks and dots, which on a three-line
// stack is the difference between an arrow that points and one that does not.
const LINE_SPACING     = 1.2 * 1.02;
const FIT_PAD_H        = 0.03;
const lineHeightAt     = (pt) => (pt / 72) * LINE_SPACING + FIT_PAD_H;
// Board-readable size for the axis numbers a child reads off. The scale is the
// point of the task, so the numerals must read from the back of the room. This
// is now a size they REACH rather than a ceiling they are shrunk from, because
// the box around each numeral is measured from the numeral.
const FONT_SIZE        = 24;
const LABEL_H          = lineHeightAt(FONT_SIZE);
// The floor every other card helper in here declares and this one never did. A
// deep stack of lines used to buy its room out of the numerals, which are the
// one thing on a number line a child cannot do the maths without. Below this
// the arrows, ticks and dots give up room instead: an arrow only has to point,
// but a scale has to be read.
// Axis numerals and point labels are read off the board like any other text, so
// this floor answers to the shared projection floor rather than sitting under
// it. The stack has a mechanism for the case where the numerals stop paying for
// it: hold them at the floor and re-solve the scale for everything else, which
// is what the block below does.
const FONT_MIN         = Math.max(14, MIN_FONT_PT);
const ARROW_STEM_W     = 0.03;
const ARROW_STEM_H     = 0.26;
// The shortest stem that still reads as an arrow pointing at a place on the
// line rather than a tick mark sitting on it. A deck once shipped 0.141in and
// the arrows were called halved; below about this they stop doing the one job
// they have. The stack scales the arrows down before it touches the numerals,
// so this is the point at which there is nothing left to give and the
// composition, not the drawing, has to change.
const ARROW_STEM_MIN_H = 0.165;
const ARROW_HEAD_W     = 0.14;
const ARROW_HEAD_H     = 0.14;
const ARROW_COLOUR     = 'CC0000';
// Stem top above the axis. Stem plus head is 0.39in, so the arrowhead tip lands
// just clear of the axis rather than floating 0.15in above it. The arrow's
// letter sits in a text band directly on top of the stem, so it cannot collide
// with the stem however far the geometry is scaled down.
const ARROW_RAISE      = 0.44;
const DOT_R            = 0.09;
const ANSWER_LABEL_GAP = 0.06;
// Breathing room BETWEEN stacked lines, counted once per gap and not once per
// line, so a pair of lines is not charged for a gap it does not have.
const ROW_GAP          = 0.20;
// ...and how far apart stacked lines may drift when the zone has room to spare.
// Beyond this they stop reading as one set of lines to compare.
const MAX_ROW_GAP      = 1.30;
// Clear air between one axis label and the next before either has to shrink.
const LABEL_GUTTER     = 0.06;
// A hard ceiling, not a preference. Every line past this one is paid for out of
// the size of all of them, and at five the numerals are too small to read from
// the back of the room whatever else is done. Three lines is a comparison a
// child can hold; more than three is a second slide. The guidance used to say
// "clearest at around three rather than five", and a soft word like that is
// exactly the kind a busy designer reads past.
const MAX_LINES        = 3;
// A number line is a thin thing: one line and its numerals need about half an
// inch, and a My Turn card is often seven times that. Capping the drawing at
// its "natural" size banked all of that as white space and left the numerals
// smaller than they needed to be, on the slide with the most room to spare. It
// may now grow into a generous card up to this multiple. It is a MULTIPLE and
// not a target: the zone still binds first, so a crowded card is unaffected and
// only a card with genuine room to spare gives any of it back. Room is left
// above and below the axis either way, because a My Turn line gets written on.
const MAX_GROW         = 1.6;
// Stacked lines are named down their left edge, because a question saying
// "Line B: what number does Q show?" over three unnamed lines makes a child
// work out which line is B before starting the maths. Naming is the DEFAULT for
// a stack rather than a field a designer has to remember, since forgetting it
// is invisible in the spec and only shows up in front of a class.
const LINE_NAMES       = ['A', 'B', 'C'];
const NAME_GAP         = 0.18;
// Jumps: a hop along the spaces between marks, drawn as an arc above the line.
// One tier is the arc's ceiling; overlapping jumps climb a tier each.
const JUMP_TIER_H      = 0.46;
const JUMP_GAP         = 0.03;   // clear air between a tick top and an arc end
const JUMP_HEAD        = 0.19;   // arrowhead length at the landing end
const JUMP_HEAD_MIN    = 0.14;
const JUMP_STROKE_PT   = 3;
const JUMP_STROKE_MIN_PT = 2.25; // an arc thinner than this reads as a stray line on the board
const JUMP_COLOUR      = COLOURS.prompt;
const JUMP_BOX_MIN_W   = 0.7;    // a blank a child's "+100" fits in
// A highlighted interval: the space itself turns the house highlight colour,
// thick enough to read as a space and not a thicker line, with a pale wash
// over the tick height so the room between the two marks is what stands out.
const HIGHLIGHT_BAR_H  = 0.13;
const HIGHLIGHT_WASH_TRANSPARENCY = 78;
// ─── END CONSTANTS ────────────────────────────────────────────

// Year 4 place value is taught WITH the comma, and the question beside the line
// already uses it ("Mark 3,000 on the line."). An axis reading 3000 under a
// question reading 3,000 puts both conventions in front of a child at once, on
// the slide that is teaching the convention. Built by hand rather than through
// toLocaleString so the deck reads the same whatever the building machine's
// locale happens to be. Decimals and values under a thousand are left alone.
function formatValue(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return String(v);
  if (!Number.isInteger(v) || Math.abs(v) < 1000) return String(v);
  const digits = String(Math.abs(v));
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ',';
    out += digits[i];
  }
  return (v < 0 ? '-' : '') + out;
}

function specOf(spec, key, fallback) {
  return spec[key] != null ? spec[key] : fallback;
}

// What this line writes under its axis: [{ at, text }] in ascending order. A
// plain number prints itself; { at, text } prints its own words under that mark.
function labelValuesFor(spec) {
  const start    = specOf(spec, 'start', 0);
  const end      = specOf(spec, 'end', 10);
  const interval = specOf(spec, 'interval', 1);

  let values = spec.labels;
  if (!values || values === 'ends') {
    values = [start, end];
  } else if (values === 'all') {
    const numTicks = Math.round((end - start) / interval);
    values = [];
    for (let i = 0; i <= numTicks; i++) {
      values.push(Math.round((start + i * interval) * 1e9) / 1e9);
    }
  }
  const scale = jumpsGeo.valueLine({ start: start, end: end, interval: interval });
  const entries = values.map(function (v, i) {
    const entry = jumpsGeo.labelEntry(v, scale, i);
    return entry ? { at: entry.at, text: entry.text } : { at: v, text: formatValue(v) };
  });
  return entries.sort(function (a, b) { return a.at - b.at; });
}

// The vertical room this line genuinely uses, above and below its axis, split
// into the part that may be scaled down (rules, stems, gaps) and the number of
// one-line TEXT BANDS, which may not be scaled below the font floor. A line
// carrying neither arrow nor answer uses nothing above it and is charged
// nothing for it.
function inkFor(spec) {
  let aboveElastic = 0;
  let aboveBands   = 0;
  const jumps = spec._jumps || [];
  if (jumps.length) {
    const tiers = jumpsGeo.tierCount(jumps);
    aboveElastic = TICK_H / 2 + JUMP_GAP + tiers * JUMP_TIER_H;
    aboveBands   = jumpsLabelled(jumps) ? tiers : 0;
  }
  if (spec.arrow) {
    aboveElastic = Math.max(aboveElastic, ARROW_RAISE);
    aboveBands   = 1;
  }
  if (spec.answer) {
    aboveElastic = Math.max(aboveElastic, DOT_R + ANSWER_LABEL_GAP);
    aboveBands   = 1;
  }
  const tickHalf = spec.wholeTick != null ? TALL_TICK_H / 2 : TICK_H / 2;
  return {
    aboveElastic: Math.max(aboveElastic, tickHalf),
    jumpBands:    jumps.length && jumpsLabelled(jumps) ? jumpsGeo.tierCount(jumps) : 0,
    aboveBands:   aboveBands,
    belowElastic: tickHalf + LABEL_GAP,
    belowBands:   1
  };
}

function jumpsLabelled(jumps) {
  return jumps.some(function (j) { return j.label || j.box; });
}

// Resolve each line's jumps and highlight once, against its own scale, before
// anything is measured: a jump off a mark is refused by name here rather than
// drawn somewhere near where it was meant to go.
function resolveMarks(spec, lineIdx, count) {
  const where = count > 1 ? 'line ' + (LINE_NAMES[lineIdx] || lineIdx + 1) : 'this number line';
  const scale = jumpsGeo.valueLine({
    start: specOf(spec, 'start', 0), end: specOf(spec, 'end', 10), interval: specOf(spec, 'interval', 1)
  });
  const jumps = jumpsGeo.resolveJumps(spec, scale);
  jumpsGeo.refuseCrowding(jumps, spec, ['arrow', 'answer'], where);
  return Object.assign({}, spec, {
    _jumps: jumps,
    _highlight: jumpsGeo.resolveIntervalHighlight(spec, scale)
  });
}

// Keep a text box inside the zone without narrowing it: a label centred on an
// endpoint may sit a few points inboard of its tick, but it is never shrunk to
// buy room the zone already has.
function boxWithin(centreX, w, loX, hiX) {
  let x = centreX - w / 2;
  if (x < loX) x = loX;
  if (x + w > hiX) x = hiX - w;
  return x;
}

function drawNumberline(pptx, slide, zone, data) {
  const given = Array.isArray(data.lines)
    ? data.lines
    : [{
        start:     data.start    != null ? data.start    : 0,
        end:       data.end      != null ? data.end      : 10,
        interval:  data.interval != null ? data.interval : 1,
        labels:    data.labels,
        wholeTick: data.wholeTick,
        arrow:     data.arrow,
        answer:    data.answer,
        jumps:     data.jumps,
        highlight: data.highlight
      }];

  if (given.length > MAX_LINES) {
    throw new Error(
      'NUMBERLINE_TOO_MANY_LINES: ' + given.length + ' stacked lines were asked for and ' +
      MAX_LINES + ' is the most a number line may carry. Every extra line is paid for out of ' +
      'the size of the numerals on all of them. Split these across two slides, or drop the ' +
      'lines this question does not actually compare.'
    );
  }
  const lines = given.map(function (spec, i) { return resolveMarks(spec, i, given.length); });

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  // ── Vertical: what the lines actually need, then how much of it fits ──
  const ink     = lines.map(inkFor);
  const elastic = ink.reduce(function (t, k) { return t + k.aboveElastic + k.belowElastic; }, 0)
                + ROW_GAP * (lines.length - 1);
  const bands   = ink.reduce(function (t, k) { return t + k.aboveBands + k.belowBands; }, 0);

  let scale  = Math.min(MAX_GROW, innerH / (elastic + bands * LABEL_H));
  let bandH  = LABEL_H * scale;
  let fontPt = Math.round(FONT_SIZE * scale * 10) / 10;

  // Under the floor, the numerals stop paying for the stack. Hold them at the
  // floor, give every text band the height that font actually needs, and solve
  // again for the scale everything ELSE runs at inside the room that leaves.
  if (fontPt < FONT_MIN) {
    const heldH = lineHeightAt(FONT_MIN);
    const held  = (innerH - bands * heldH) / elastic;
    if (held > 0) {
      scale  = Math.min(MAX_GROW, held);
      bandH  = heldH;
      fontPt = FONT_MIN;
    } else {
      // Even after the arrows, ticks and dots give up everything they have, the
      // numerals cannot reach the floor. Drawing anyway is the one outcome this
      // helper exists to prevent: a scale nobody can read is not a smaller
      // version of the task, it is the task missing, and it goes to the board
      // looking finished. Refuse by name while the composition can still be
      // changed - the same answer a fourth stacked line already gets.
      throw new Error(
        `NUMBERLINE_ZONE_TOO_SHALLOW: ${lines.length} line` +
          `${lines.length === 1 ? '' : 's'} cannot show numerals at the ` +
          `${FONT_MIN}pt readable minimum in a zone this shallow. Give the ` +
          `visual more height, or show fewer lines on it; the numerals are ` +
          `what the scale is read from and were not shrunk to fit.`
      );
    }
  }

  // The band scales with the drawing, but the inset the fitter takes off a box
  // does not: it is a fixed measure in inches, so on a shrunk stack the scaled
  // band keeps less of it than the fitter will remove, and the label inside is
  // dropped a point or two to cope. Measuring the band from the size it is
  // actually going to hold closes that gap for the last few labels - a point's
  // letter above the line, a green answer - which are the ones the maths on
  // this line is about.
  bandH = Math.max(bandH, lineHeightAt(fontPt));

  const lineH           = LINE_H            * scale;
  const tickH           = TICK_H            * scale;
  const tallTickH       = TALL_TICK_H       * scale;
  const tickW           = TICK_W            * scale;
  const labelGap        = LABEL_GAP         * scale;
  const arrowStemW      = ARROW_STEM_W      * scale;
  const arrowStemH      = ARROW_STEM_H      * scale;

  if (lines.some((spec) => spec.arrow) && arrowStemH < ARROW_STEM_MIN_H) {
    throw new Error(
      `NUMBERLINE_ZONE_TOO_SHALLOW: ${lines.length} line` +
        `${lines.length === 1 ? '' : 's'} with arrows cannot show both a ` +
        `readable scale and an arrow that points in a zone this shallow. ` +
        `Three arrowed lines want about 4in of height at the ${FONT_MIN}pt ` +
        `minimum. Give the visual more height, or show fewer lines on it.`
    );
  }

  const arrowHeadW      = ARROW_HEAD_W      * scale;
  const arrowHeadH      = ARROW_HEAD_H      * scale;
  const arrowRaise      = ARROW_RAISE       * scale;
  const dotR            = DOT_R             * scale;
  const answerLabelGap  = ANSWER_LABEL_GAP  * scale;
  const rowGap          = ROW_GAP           * scale;

  // Every label - axis numeral, arrow letter, answer - is one line of the same
  // text, so all three sit in a band of the same height. Holding that band to
  // the font floor is what stops a deep stack shrinking the numerals.
  const above = ink.map(function (k) { return k.aboveElastic * scale + k.aboveBands * bandH; });
  const below = ink.map(function (k) { return k.belowElastic * scale + k.belowBands * bandH; });

  function labelWidth(text) {
    return textBoxWidthIn(String(text), fontPt, true);
  }

  // ── Horizontal: inset the axis so the end labels fit inside the zone ──
  // Every line shares one span, so stacked lines stay physically aligned and a
  // slide can still ask children to compare positions across them.
  const allLabels = lines.map(labelValuesFor);

  function insetFor(f) {
    let lh = 0;
    let rh = 0;
    allLabels.forEach(function (values) {
      if (!values.length) return;
      lh = Math.max(lh, textBoxWidthIn(values[0].text, f, true) / 2);
      rh = Math.max(rh, textBoxWidthIn(values[values.length - 1].text, f, true) / 2);
    });
    let x1 = zone.x + Math.max(PAD, lh);
    let x2 = zone.x + zone.w - Math.max(PAD, rh);
    if (!(x2 - x1 > 0.5)) {   // pathologically narrow zone: keep the old span
      x1 = innerX;
      x2 = innerX + innerW;
    }
    return { x1: x1, w: x2 - x1 };
  }

  // One size for every numeral on the visual. A crowded axis has to shrink, but
  // it shrinks WHOLE: letting each label take the size its own digits allow is
  // how "0" ends up twice the height of "10000" on one line, which is the fault
  // being repaired. So the tightest axis sets the size, and the rest match it.
  function crowdedFont(f) {
    const geo = insetFor(f);
    let out = f;
    lines.forEach(function (spec, i) {
      const values = allLabels[i];
      if (values.length < 2) return;
      const start = specOf(spec, 'start', 0);
      const end   = specOf(spec, 'end', 10);
      if (end === start) return;
      const xs = values.map(function (v) { return geo.x1 + ((v.at - start) / (end - start)) * geo.w; });
      let minGap = Infinity;
      for (let k = 1; k < xs.length; k++) minGap = Math.min(minGap, xs[k] - xs[k - 1]);
      const cap  = Math.max(0.20, minGap - LABEL_GUTTER);
      const need = Math.max.apply(null, values.map(function (v) {
        return textBoxWidthIn(v.text, f, true);
      }));
      if (need > cap) out = Math.min(out, f * cap / need);
    });
    return out;
  }

  // A smaller font needs a smaller inset, which lengthens the axis and relieves
  // some of the crowding, so the second pass gives back what the first overpaid.
  let labelFont = crowdedFont(fontPt);
  if (labelFont < fontPt) labelFont = Math.min(fontPt, crowdedFont(labelFont));
  labelFont = Math.round(labelFont * 10) / 10;

  const geo = insetFor(labelFont);
  let lineX1 = geo.x1;
  let lineW  = geo.w;

  // Reserve the left-hand column the names sit in, once, so every axis starts
  // at the same x and stacked lines stay comparable.
  const names = lines.map(function (spec, i) {
    if (spec.lineLabel) return String(spec.lineLabel);
    if (lines.length > 1 && data.lineLabels !== false) return LINE_NAMES[i] || '';
    return '';
  });
  let nameW = 0;
  names.forEach(function (n) {
    if (n) nameW = Math.max(nameW, textBoxWidthIn(n, fontPt, true));
  });
  if (nameW > 0 && lineW - (nameW + NAME_GAP) > 1.0) {
    lineX1 += nameW + NAME_GAP;
    lineW  -= nameW + NAME_GAP;
  } else {
    nameW = 0;
  }

  // Charging a line only for what it carries can leave real slack in a deep
  // zone. Spare room belongs BETWEEN stacked lines, where it separates one
  // child's line from the next; banked below them it just reads as a cramped
  // huddle with a margin under it.
  const inkH = above.reduce(function (t, v) { return t + v; }, 0)
             + below.reduce(function (t, v) { return t + v; }, 0);
  let gap = rowGap;
  if (lines.length > 1 && inkH + gap * (lines.length - 1) < innerH) {
    const slack = innerH - inkH - gap * (lines.length - 1);
    gap += Math.min(slack / (lines.length - 1), MAX_ROW_GAP - ROW_GAP);
  }
  const usedH = inkH + gap * (lines.length - 1);
  let cursorY = innerY + (innerH - usedH) / 2;

  // Jumps sit in their own band above the line. Their words are one line of
  // text like every other label here, so they take the same band height, and a
  // run of narrow hops shrinks its labels together rather than one at a time.
  function drawJumps(jumps, ticks, lineY) {
    if (!jumps.length) return;
    const labelled = jumpsLabelled(jumps);
    const tierH    = JUMP_TIER_H * scale;
    const labelH   = labelled ? bandH : 0;
    const baseY    = lineY - tickH / 2 - JUMP_GAP * scale;
    // A starved stack scales the arc down with everything else, but an
    // arrowhead below this stops saying which way the jump went.
    const headSize = Math.max(JUMP_HEAD_MIN, JUMP_HEAD * scale);

    let jumpFont = fontPt;
    jumps.forEach(function (j) {
      if (!j.label) return;
      const span = Math.abs(ticks[j.toIndex].x - ticks[j.fromIndex].x) - LABEL_GUTTER;
      const need = textBoxWidthIn(j.label, fontPt, true);
      if (need > span) jumpFont = Math.min(jumpFont, fontPt * span / need);
    });
    jumpFont = Math.floor(jumpFont * 10) / 10;
    if (jumpFont < FONT_MIN) {
      throw new Error(
        'NUMBERLINE_JUMP_LABELS_CROWDED: the jump labels cannot sit over their spaces at the ' +
          FONT_MIN + 'pt readable minimum. Label one jump and let the caption say the rest ' +
          '("Each jump is +10"), or give the line more width.'
      );
    }

    jumps.forEach(function (j) {
      const x1  = ticks[j.fromIndex].x;
      const x2  = ticks[j.toIndex].x;
      const h   = jumpsGeo.arcHeight(j, x2 - x1, tierH, labelH);
      const geo = jumpsGeo.arcGeometry(x1, x2, baseY, h, headSize);
      polyline(pptx, slide, geo.points, { lineColor: JUMP_COLOUR, width: Math.max(JUMP_STROKE_MIN_PT, JUMP_STROKE_PT * Math.min(1, scale)) });
      polygon(pptx, slide, geo.head, { fill: JUMP_COLOUR, lineColor: null });
      if (j.label) {
        const w = textBoxWidthIn(j.label, jumpFont, true);
        slide.addText(j.label, {
          x: boxWithin(geo.apex.x, w, zone.x, zone.x + zone.w), y: geo.apex.y - bandH, w: w, h: bandH,
          fontFace: FONT, fontSize: jumpFont, bold: true, color: JUMP_COLOUR,
          align: 'center', valign: 'bottom', margin: 0, fit: FIT
        });
      } else if (j.box) {
        const w = Math.min(Math.max(JUMP_BOX_MIN_W * scale, textBoxWidthIn('+000', fontPt, true)),
          Math.abs(x2 - x1) - LABEL_GUTTER);
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: geo.apex.x - w / 2, y: geo.apex.y - bandH - 0.02, w: w, h: bandH,
          fill: { color: COLOURS.pureWhite }, line: { color: COLOURS.body, width: 1.5 }
        });
      }
    });
  }

  lines.forEach(function (spec, lineIdx) {
    const start    = spec.start    != null ? spec.start    : 0;
    const end      = spec.end      != null ? spec.end      : 10;
    const interval = spec.interval != null ? spec.interval : 1;

    const lineY = cursorY + above[lineIdx];

    const numTicks = Math.round((end - start) / interval);
    const spacing  = lineW / numTicks;

    const ticks = [];
    for (let i = 0; i <= numTicks; i++) {
      const tickX = lineX1 + i * spacing;
      const value = Math.round((start + i * interval) * 1e9) / 1e9;
      ticks.push({ x: tickX, index: i, value: value });
    }

    function getX(val) {
      return lineX1 + ((val - start) / (end - start)) * lineW;
    }

    if (nameW > 0 && names[lineIdx]) {
      slide.addText(names[lineIdx], {
        x: lineX1 - nameW - NAME_GAP, y: lineY - bandH / 2, w: nameW, h: bandH,
        fontFace: FONT, fontSize: fontPt, bold: true, color: COLOURS.body,
        align: 'left', valign: 'middle', margin: 0, fit: FIT
      });
    }

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: lineX1, y: lineY - lineH / 2, w: lineW, h: lineH,
      fill: { color: COLOURS.body }, line: { color: COLOURS.body, width: 0 }
    });

    // The highlighted space goes down before the ticks, so the two marks that
    // bound it stay black and crisp on top of it.
    spec._highlight.forEach(function (h) {
      const hx1 = ticks[h.fromIndex].x;
      const hx2 = ticks[h.toIndex].x;
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: hx1, y: lineY - tickH / 2, w: hx2 - hx1, h: tickH,
        fill: { color: HIGHLIGHT_COLOUR, transparency: HIGHLIGHT_WASH_TRANSPARENCY },
        line: { type: 'none' }
      });
      const barH = Math.max(lineH, HIGHLIGHT_BAR_H * scale);
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: hx1, y: lineY - barH / 2, w: hx2 - hx1, h: barH,
        fill: { color: HIGHLIGHT_COLOUR }, line: { type: 'none' }
      });
    });

    ticks.forEach(function (tick) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: tick.x - tickW / 2, y: lineY - tickH / 2, w: tickW, h: tickH,
        fill: { color: COLOURS.body }, line: { color: COLOURS.body, width: 0 }
      });
    });

    if (spec.wholeTick != null) {
      const wholeVals = Array.isArray(spec.wholeTick) ? spec.wholeTick : [spec.wholeTick];
      wholeVals.forEach(function (val) {
        const tx = getX(val);
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: tx - tickW / 2, y: lineY - tallTickH / 2, w: tickW, h: tallTickH,
          fill: { color: COLOURS.body }, line: { color: COLOURS.body, width: 0 }
        });
      });
    }

    const belowY      = lineY + tickH / 2 + labelGap;
    const labelValues = allLabels[lineIdx];
    const labelXs     = labelValues.map(function (v) { return getX(v.at); });

    // A label may take the width its own digits need, up to the clear air
    // between it and its neighbour. Only a genuinely crowded axis shrinks.
    let minGap = Infinity;
    for (let i = 1; i < labelXs.length; i++) {
      minGap = Math.min(minGap, labelXs[i] - labelXs[i - 1]);
    }
    const widthCap = Number.isFinite(minGap) ? Math.max(0.20, minGap - LABEL_GUTTER) : lineW;

    labelValues.forEach(function (val, i) {
      const boxW = Math.min(textBoxWidthIn(val.text, labelFont, true), widthCap);
      slide.addText(val.text, {
        x: boxWithin(labelXs[i], boxW, zone.x, zone.x + zone.w),
        y: belowY, w: boxW, h: bandH,
        fontFace: FONT, fontSize: labelFont, bold: true, color: COLOURS.body,
        align: 'center', valign: 'top', margin: 0, fit: FIT
      });
    });

    if (spec.arrow) {
      const ax       = getX(spec.arrow.at);
      const arLabel  = spec.arrow.label || '?';
      const stemTopY = lineY - arrowRaise;

      slide.addShape(pptx.shapes.RECTANGLE, {
        x: ax - arrowStemW / 2, y: stemTopY, w: arrowStemW, h: arrowStemH,
        fill: { color: ARROW_COLOUR }, line: { color: ARROW_COLOUR, width: 0 }
      });
      slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
        x: ax - arrowHeadW / 2, y: stemTopY + arrowStemH - 0.01 * scale,
        w: arrowHeadW, h: arrowHeadH,
        fill: { color: ARROW_COLOUR }, line: { color: ARROW_COLOUR, width: 0 },
        rotate: 180
      });
      const arrowBoxW = labelWidth(arLabel);
      slide.addText(arLabel, {
        x: boxWithin(ax, arrowBoxW, zone.x, zone.x + zone.w),
        y: stemTopY - bandH, w: arrowBoxW, h: bandH,
        fontFace: FONT, fontSize: fontPt, bold: true, color: ARROW_COLOUR,
        align: 'center', valign: 'middle', margin: 0, fit: FIT
      });
    }

    if (spec.answer) {
      const dotX    = getX(spec.answer.at);
      const ansText = spec.answer.text != null ? String(spec.answer.text) : String(spec.answer.at);

      slide.addShape(pptx.shapes.OVAL, {
        x: dotX - dotR, y: lineY - dotR, w: dotR * 2, h: dotR * 2,
        fill: { color: COLOURS.green }, line: { color: COLOURS.green, width: 0 }
      });
      const answerBoxW = labelWidth(ansText);
      slide.addText(ansText, {
        x: boxWithin(dotX, answerBoxW, zone.x, zone.x + zone.w),
        y: lineY - dotR - answerLabelGap - bandH,
        w: answerBoxW, h: bandH,
        fontFace: FONT, fontSize: fontPt, bold: true, color: COLOURS.green,
        align: 'center', valign: 'middle', margin: 0, fit: FIT
      });
    }

    drawJumps(spec._jumps, ticks, lineY);

    cursorY += above[lineIdx] + below[lineIdx] + gap;
  });
}

module.exports = { drawNumberline };
