"use strict";

// Fractions and money.
//
// Two of these are made of words and boxes (a stacked fraction is a numerator
// sitting on a rule, a chip bank is a set of bordered labels), so they are
// built as HTML and CSS in the manner of forms.js. Three of them are pictures
// (coins, a part-whole model), so they are drawn as inline SVG in the manner of
// drawn.js.
//
// The Word builder drew its coins by compositing PNG photographs of real coins.
// That cannot come across: there is no image library here and a page of base64
// coins is not a page anyone wants to print. So the coins are drawn instead,
// and the thing that has to survive the change is RECOGNITION. A child sorting
// coins on a worksheet is doing the same job they do at a till: knowing which
// one is which before reading a single word. That knowledge is carried by three
// features, and all three are kept below:
//
//   shape - a 20p and a 50p are seven-sided with curved edges (a Reuleaux
//            heptagon, not a plain polygon); a £1 is twelve-sided; the rest are
//            round.
//   metal - copper, silver, or gold-with-a-silver-centre for the two
//            bimetallic coins (£1 and £2 both have a gold ring and a silver
//            middle).
//   value - printed on the face, which is what the legibility floor protects.
//
// Sizes are deliberately NOT to scale, matching the Word builder and the
// reference doc: real coins differ by a few millimetres and a worksheet reads
// better when they are uniform. A note is drawn landscape at the same height,
// which is how the Word builder's trimmed assets came out.

const { TYPE, RULE, INSET, SPACE } = require("../tokens");
const {
  BODY_PT,
  PT_MM,
  LINE_MM,
  NOTE_LINE_MM,
  WRITING_LINE_MM,
  BLANK_MM,
  BLANK_CHARS,
  esc,
  linesFor,
} = require("./shared");

// None of the five gains anything from spare page height. The two drawings are
// locked to their own aspect and capped at the width where a coin is already
// printed larger than a real coin; the fractions and the chips are set in fixed
// point sizes, so extra height under them is a hole, not a bigger helper.
const NEVER_STRETCH = 0;

const SPACE_TIGHT_MM = 2; // var(--space-tight)
const WIDEST_ZONE_MM = 261; // the printable width of A4 landscape

function f(n) {
  return Number(n.toFixed(2));
}

// ─── coin drawing ────────────────────────────────────────────────────────
// Shared by coin-strip and by part-whole-money, which can carry coins inside
// its bubbles. One drawing, so the coins a child is handed in the strip are the
// same coins they see partitioned in the model.

// Real UK coin diameters in millimetres, and the whole coin drawing is laid out
// in those millimetres: one SVG unit is one millimetre, exactly as the ruler in
// geometry.js does it.
//
// The Word builder drew every coin the same size, and the reference doc still
// recommends it ("real coins differ in physical size, but uniform sizing reads
// better on a worksheet"). That is the one part of the port not carried over.
// Size is the FIRST thing a child sorts coins by, before colour and long before
// they read the number, and a 2p printed the same size as a 5p teaches the
// opposite of what a money lesson is for - the 2p is the bigger coin by a third
// and the picture says they are the same. It is the ruler's problem in a
// different costume: the sheet looks completely normal and the thing it teaches
// is wrong.
//
// So coins are drawn to scale WITH EACH OTHER, and the drawing is capped at life
// size, because no coin needs to print bigger than the coin in a child's hand.
const COIN_MM = {
  "1p": 20.3,
  "2p": 25.9,
  "5p": 18.0,
  "10p": 24.5,
  "20p": 21.4,
  "50p": 27.3,
  "£1": 23.43,
  "£2": 28.4,
};

// Notes, real millimetres, landscape. These are NOT to scale with the coins and
// cannot be: a life-size £5 note is 125mm across and would fill the row on its
// own. The note family is drawn to scale with ITSELF, so a £50 is still bigger
// than a £5, and sized so a note reads as comfortably bigger than any coin
// without swallowing the strip. Said plainly here because it is a compromise,
// not a measurement.
const NOTE_MM = {
  "£5": [125, 65],
  "£10": [132, 69],
  "£20": [139, 73],
  "£50": [146, 77],
};
const NOTE_SCALE = 0.42; // puts a £5 at 27mm tall, just over a 50p

const COIN_GAP_MM = 2;
const COIN_LABEL_RATIO = 0.3; // face value height as a fraction of the coin

// How far the drawing may shrink before a coin stops being identifiable, and how
// far it may grow. Growth stops at life size on purpose: past that a coin is
// just a big disc, and the row eats width it has no use for.
const COIN_SCALE_MAX = 1;
const COIN_SCALE_MIN = 0.62; // a 5p, the smallest coin, still 11mm across

// Realistic metal colours, and the one place in this file that does not use the
// token palette. A coin that is not copper or silver is not a recognisable
// coin: colour is doing identification work here, not decoration, in the same
// way the drawn number line keeps its own arrow colour. The tokens carry no
// metals and inventing token names for them would put four colours into the
// child's colour system that mean nothing anywhere else on the page.
const METAL = {
  copper: { face: "#C87137", rim: "#96491F", ink: "#5E2C0E" },
  silver: { face: "#CFD3D8", rim: "#9DA4AC", ink: "#41464C" },
  gold: { face: "#D8B44A", rim: "#A98A2E", ink: "#4F3F0F" },
};

const COINS = {
  "1p": { metal: "copper", shape: "round" },
  "2p": { metal: "copper", shape: "round" },
  "5p": { metal: "silver", shape: "round" },
  "10p": { metal: "silver", shape: "round" },
  "20p": { metal: "silver", shape: "heptagon" },
  "50p": { metal: "silver", shape: "heptagon" },
  // Both pound coins are bimetallic: gold-coloured ring, silver-coloured
  // centre. The £1 is the twelve-sided one, the £2 is round. Drawn with the
  // same size centre they came out as near-twins, so the centres are kept to
  // their real proportions: a £2's silver middle is about three quarters of the
  // whole coin and a £1's is under two thirds, which is the difference a child
  // sees before they read either number.
  "£1": { metal: "gold", shape: "dodecagon", centre: "silver", centreRatio: 0.32 },
  "£2": { metal: "gold", shape: "round", centre: "silver", centreRatio: 0.38 },
};

// Note colours, same reasoning as the metals: a £20 that is not purple is not a
// £20 to a child who has seen one.
const NOTES = {
  "£5": { paper: "#8FD6DA", rim: "#3F9AA1", ink: "#12444A" },
  "£10": { paper: "#E8A96A", rim: "#B9762F", ink: "#5A3010" },
  "£20": { paper: "#A791C7", rim: "#6E5695", ink: "#33235A" },
  "£50": { paper: "#DE9A98", rim: "#A85B59", ink: "#5A1B1B" },
};

// The size this denomination occupies on paper at full size, in millimetres.
function denominationSizeMm(denomination) {
  const diameter = COIN_MM[denomination];
  if (diameter != null) return { w: diameter, h: diameter };
  const note = NOTE_MM[denomination];
  if (note) return { w: note[0] * NOTE_SCALE, h: note[1] * NOTE_SCALE };
  // Silence here would print a gap where a coin should be and nothing would
  // look wrong, so this is loud on purpose.
  throw new Error(
    `UNKNOWN_DENOMINATION: "${denomination}". Known: ` +
      `${[...Object.keys(COINS), ...Object.keys(NOTES)].join(", ")}`
  );
}

// A regular polygon whose width ACROSS THE FLATS is `size`, with a flat edge at
// the top. Used for the twelve-sided £1.
function polygonPath(cx, cy, size, sides) {
  const r = size / (2 * Math.cos(Math.PI / sides));
  const start = -Math.PI / 2 + Math.PI / sides;
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = start + (i * 2 * Math.PI) / sides;
    pts.push(`${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

// A Reuleaux heptagon of constant width `size`: seven vertices, and each edge
// an arc centred on the vertex opposite it. This is what a 20p and a 50p
// actually are, and the gently bowed edges are most of why they are
// recognisable at a glance - a straight-sided heptagon reads as a generic
// seven-sided token instead.
function reuleauxHeptagonPath(cx, cy, size) {
  const sides = 7;
  const r = size / (2 * Math.sin((3 * Math.PI) / sides));
  // A Reuleaux polygon has constant width but is NOT centred on its
  // circumcircle: a vertex sits r from the centre while the arc opposite it
  // sits only (width - r) away. Left uncorrected the shape hangs about 1.3
  // units above its own box, which at print size is the top of a 50p sliced
  // off by the edge of the drawing.
  const centreY = cy + (r - size / 2);
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), centreY + r * Math.sin(a)]);
  }
  const arcR = size; // the constant width, by construction of r above
  const d = [`M ${f(pts[0][0])} ${f(pts[0][1])}`];
  for (let i = 0; i < sides; i++) {
    const to = pts[(i + 1) % sides];
    d.push(`A ${f(arcR)} ${f(arcR)} 0 0 1 ${f(to[0])} ${f(to[1])}`);
  }
  d.push("Z");
  return d.join(" ");
}

function coinShapeEl(shape, cx, cy, size, attrs) {
  if (shape === "heptagon") {
    return `<path d="${reuleauxHeptagonPath(cx, cy, size)}" ${attrs} />`;
  }
  if (shape === "dodecagon") {
    return `<path d="${polygonPath(cx, cy, size, 12)}" ${attrs} />`;
  }
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(size / 2)}" ${attrs} />`;
}

// Draws one coin or note with its top-left at (x, y). `unitsPerMm` converts the
// denomination's real size into whatever units the caller is drawing in: 1 for
// the coin strip, which works in true millimetres, and a smaller figure inside a
// part-whole bubble. Returns the SVG parts and the box it filled, so the caller
// never has to work a note's width out separately from the drawing.
function drawDenomination(denomination, x, y, unitsPerMm) {
  const size = denominationSizeMm(denomination); // refuses anything unknown
  const w = size.w * unitsPerMm;
  const h = size.h * unitsPerMm;
  const parts = NOTE_MM[denomination]
    ? drawNote(denomination, NOTES[denomination], x, y, w, h)
    : drawCoin(denomination, COINS[denomination], x, y, w);
  return { parts, widthUnits: w, heightUnits: h };
}

// The coin occupies a box `size` across for layout purposes, but is drawn a
// little smaller inside it. The outline is a stroke, and half of a stroke falls
// outside the shape it traces: drawn edge to edge, every coin at the two ends
// of a strip loses a sliver of its rim to the boundary of the drawing.
const COIN_INSET = 0.95;

function drawCoin(denomination, def, x, y, size) {
  const metal = METAL[def.metal];
  const drawn = size * COIN_INSET;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const stroke = Math.max(0.6, drawn * 0.028);
  const parts = [];

  parts.push(
    coinShapeEl(
      def.shape,
      cx,
      cy,
      drawn,
      `fill="${metal.face}" stroke="${metal.rim}" stroke-width="${f(stroke)}"`
    )
  );
  // The milled rim, drawn as the same shape inset. It is what stops a flat
  // filled disc reading as a counter rather than a coin.
  parts.push(
    coinShapeEl(
      def.shape,
      cx,
      cy,
      drawn * 0.86,
      `fill="none" stroke="${metal.rim}" stroke-width="${f(stroke * 0.6)}" stroke-opacity="0.7"`
    )
  );

  let inkColour = metal.ink;
  if (def.centre) {
    const centre = METAL[def.centre];
    parts.push(
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(drawn * def.centreRatio)}" fill="${centre.face}" stroke="${centre.rim}" stroke-width="${f(stroke * 0.6)}" />`
    );
    inkColour = centre.ink;
  }

  parts.push(
    `<text x="${f(cx)}" y="${f(cy)}" text-anchor="middle" dominant-baseline="central"` +
      ` font-family="var(--font)" font-size="${f(drawn * COIN_LABEL_RATIO)}"` +
      ` font-weight="bold" fill="${inkColour}">${esc(denomination)}</text>`
  );

  return parts;
}

function drawNote(denomination, def, x, boxY, boxW, boxH) {
  const margin = (boxH * (1 - COIN_INSET)) / 2;
  const w = boxW - margin * 2;
  const h = boxH - margin * 2;
  const y = boxY + margin;
  const size = boxH; // the note's height is what its detail scales off
  x += margin;
  const stroke = Math.max(0.6, size * 0.028);
  const parts = [];

  parts.push(
    `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(size * 0.06)}"` +
      ` fill="${def.paper}" stroke="${def.rim}" stroke-width="${f(stroke)}" />`
  );
  parts.push(
    `<rect x="${f(x + w * 0.035)}" y="${f(y + h * 0.06)}" width="${f(w * 0.93)}" height="${f(h * 0.88)}"` +
      ` rx="${f(size * 0.04)}" fill="none" stroke="${def.rim}" stroke-width="${f(stroke * 0.5)}" stroke-opacity="0.7" />`
  );
  // A portrait oval on the right-hand side: the one feature that reads as
  // "banknote" rather than "coloured card" at worksheet size.
  parts.push(
    `<ellipse cx="${f(x + w * 0.74)}" cy="${f(y + h * 0.5)}" rx="${f(w * 0.14)}" ry="${f(h * 0.3)}"` +
      ` fill="none" stroke="${def.rim}" stroke-width="${f(stroke * 0.5)}" stroke-opacity="0.8" />`
  );
  parts.push(
    `<text x="${f(x + w * 0.34)}" y="${f(y + h * 0.5)}" text-anchor="middle" dominant-baseline="central"` +
      ` font-family="var(--font)" font-size="${f(size * COIN_LABEL_RATIO * 1.15)}"` +
      ` font-weight="bold" fill="${def.ink}">${esc(denomination)}</text>`
  );

  return parts;
}

// ─── coin-strip ──────────────────────────────────────────────────────────
// A row of coins and notes, left to right in the order given, optionally under
// a prompt and over a dotted line for the total. Mirrors the Word builder's
// coin-strip-question: text, coins, answerLine.

function buildCoinStripSvg(spec) {
  const coins = spec.coins || [];
  if (coins.length === 0) {
    throw new Error("coin-strip: 'coins' must list at least one denomination");
  }

  const sizes = coins.map(denominationSizeMm);
  const totalW =
    sizes.reduce((sum, s) => sum + s.w, 0) + (coins.length - 1) * COIN_GAP_MM;
  const totalH = sizes.reduce((m, s) => Math.max(m, s.h), 0);

  const parts = [];
  let cursor = 0;
  coins.forEach((denomination, i) => {
    // Bottom-aligned, the way the Word builder composited them: a small coin and
    // a big one share one baseline, as they would lying on a table. Centred
    // instead, a 5p floats halfway up the row and the size difference reads as
    // an accident of layout rather than as the size of the coin.
    const y = totalH - sizes[i].h;
    parts.push(...drawDenomination(denomination, cursor, y, 1).parts);
    cursor += sizes[i].w + COIN_GAP_MM;
  });

  return {
    // One unit is one millimetre, so the drawing is laid out in the unit it
    // prints in and the two widths below are read straight off it.
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(totalW)} ${f(totalH)}">${parts.join("")}</svg>`,
    aspect: totalW / totalH,
    lifeSizeWidthMm: totalW,
  };
}

// Life size. The drawing stops growing here and centres in whatever is left.
function coinStripMaxWidthMm(geometry) {
  return geometry.lifeSizeWidthMm * COIN_SCALE_MAX;
}

function coinStripMinWidthMm(geometry) {
  return geometry.lifeSizeWidthMm * COIN_SCALE_MIN;
}

function renderCoinStrip(spec) {
  const geometry = buildCoinStripSvg(spec);
  const maxMm = coinStripMaxWidthMm(geometry);
  const stem = spec.text
    ? `<p class="h-money-stem">${esc(spec.text)}</p>`
    : "";
  const answer = spec.answerLine ? `<span class="h-money-answer"></span>` : "";
  // The ceiling is applied to the drawn element as well as to the arithmetic,
  // so what is printed and the height it was promised cannot disagree.
  return `
    <div class="h-money">
      ${stem}
      <div class="h-money-figure" style="max-width:${f(maxMm)}mm">${geometry.svg}</div>
      ${answer}
    </div>`;
}

const ANSWER_LINE_MM = WRITING_LINE_MM.lower; // a total, written by a child

function measureCoinStrip(spec, widthMm) {
  const geometry = buildCoinStripSvg(spec);
  const stemMm = spec.text
    ? linesFor(spec.text, widthMm) * LINE_MM + SPACE_TIGHT_MM
    : 0;
  const drawnWidth = Math.min(widthMm, coinStripMaxWidthMm(geometry));
  const figureMm = drawnWidth / geometry.aspect;
  const answerMm = spec.answerLine ? ANSWER_LINE_MM + SPACE_TIGHT_MM : 0;
  return stemMm + figureMm + answerMm;
}

function needsCoinStrip(spec) {
  const geometry = buildCoinStripSvg(spec);
  // Eight coins need more width than three. A note needs nearly twice a coin's.
  // Both fall out of the drawing's own units rather than being asserted.
  const minWidthMm = coinStripMinWidthMm(geometry);
  const stemMm = spec.text
    ? linesFor(spec.text, minWidthMm) * LINE_MM + SPACE_TIGHT_MM
    : 0;
  const answerMm = spec.answerLine ? ANSWER_LINE_MM + SPACE_TIGHT_MM : 0;
  return {
    minWidthMm,
    minHeightMm: minWidthMm / geometry.aspect + stemMm + answerMm,
  };
}

// ─── part-whole ──────────────────────────────────────────────────────────
// The model itself is the shared drawing; a sheet adds only its question stem
// above it, as typed text a sheet wraps to its column.
const partWholeModel = require("../../../shared/visuals/part-whole-model-svg");
const { atPrintedWidth } = require("./at-printed-width");
const { MM_TO_PT } = require("../../../shared/visuals/surface-profiles");

function partWholeMinMm(requireIntent) {
  return (spec) => Math.max(24, partWholeModel.minWidthPt({ ...spec, requireIntent }, "worksheets") / MM_TO_PT);
}

function withStem(helper) {
  const stemMm = (spec, widthMm) => (spec.text ? linesFor(spec.text, widthMm) * LINE_MM + SPACE_TIGHT_MM : 0);
  return {
    ...helper,
    render: (spec, width) => {
      const stem = spec.text ? `<p class="h-money-stem">${esc(spec.text)}</p>` : "";
      return `<div class="h-money">${stem}${helper.render(spec, width)}</div>`;
    },
    measure: (spec, width) => {
      const w = typeof width === "number" ? width : width && width.widthMm;
      return stemMm(spec, w > 0 ? w : 170) + helper.measure(spec, width);
    },
    needs: (spec) => {
      const n = helper.needs(spec);
      return { minWidthMm: n.minWidthMm, minHeightMm: n.minHeightMm + stemMm(spec, n.minWidthMm) };
    },
  };
}

// ─── stacked-fraction and fraction-sequence ──────────────────────────────
// A fraction on a worksheet is a numerator SITTING ON a rule with the
// denominator beneath it. "3/4" written flat is a different notation and it is
// not the one a child is being taught to read, so this is built as two stacked
// cells with a border between them rather than as text with a slash in it.
//
// The two helpers are one renderer. stacked-fraction carries a question stem;
// fraction-sequence is the bare row, for use inside a compound question.

const FRAC_PT = TYPE.question;
const FRAC_LINE_MM = FRAC_PT * PT_MM * 1.35;
// Comes from the design system's line weights rather than a number
// chosen here, so every box on a sheet is drawn with the same pen.
const FRAC_BAR_MM = RULE.line; // the fraction bar, drawn as a border
// How far the bar overhangs the digits on each side. A cell step: the numerator
// sits in a box barely bigger than the digit it holds.
const FRAC_PAD_X_MM = INSET.cell.h;
const FRAC_ROW_MM = FRAC_LINE_MM * 2 + FRAC_BAR_MM;
const FRAC_GAP_MM = 3;
const FRAC_BLANK_W_MM = 9; // the box a child writes a missing fraction into
const FRAC_BORDER_MM = RULE.line;
const FRAC_SEP_W_MM = 4;
// Digits set bold run wider than the prose factor in shared.js allows for.
const FRAC_CHAR_MM = FRAC_PT * PT_MM * 0.6;

function isBlank(entry) {
  return entry === "?" || entry == null;
}

function fractionWidthMm(entry) {
  if (isBlank(entry)) return FRAC_BLANK_W_MM;
  const digits = Math.max(
    String(entry.num).length,
    String(entry.den).length
  );
  return Math.max(8, digits * FRAC_CHAR_MM + FRAC_PAD_X_MM * 2);
}

function fractionRowWidthMm(spec) {
  const fractions = spec.fractions || [];
  const items = fractions.length;
  const separators = spec.separator ? Math.max(0, items - 1) : 0;
  const gaps = Math.max(0, items + separators - 1) * FRAC_GAP_MM;
  return (
    fractions.reduce((w, entry) => w + fractionWidthMm(entry), 0) +
    separators * FRAC_SEP_W_MM +
    gaps
  );
}

function renderFractionRow(spec) {
  const fractions = spec.fractions || [];
  const cells = [];
  fractions.forEach((entry, i) => {
    if (i > 0 && spec.separator) {
      cells.push(`<span class="h-frac-sep">${esc(spec.separator)}</span>`);
    }
    if (isBlank(entry)) {
      cells.push(`<span class="h-frac-blank"></span>`);
    } else {
      cells.push(
        `<span class="h-frac">` +
          `<span class="h-frac-num">${esc(entry.num)}</span>` +
          `<span class="h-frac-den">${esc(entry.den)}</span>` +
          `</span>`
      );
    }
  });
  return `<div class="h-frac-row">${cells.join("")}</div>`;
}

function measureFractionRow(spec, widthMm) {
  // The row wraps, so a sequence too wide for its zone costs a second row
  // rather than overflowing. `needs` asks for enough width to keep it on one.
  const rows = Math.max(1, Math.ceil(fractionRowWidthMm(spec) / widthMm));
  return rows * FRAC_ROW_MM + (rows - 1) * FRAC_GAP_MM;
}

function renderStackedFraction(spec) {
  const stem = spec.text ? `<p class="h-money-stem">${esc(spec.text)}</p>` : "";
  return `<div class="h-money">${stem}${renderFractionRow(spec)}</div>`;
}

function measureStackedFraction(spec, widthMm) {
  const stemMm = spec.text
    ? linesFor(spec.text, widthMm) * LINE_MM + SPACE_TIGHT_MM
    : 0;
  return stemMm + measureFractionRow(spec, widthMm);
}

function needsFractionRow(spec) {
  // A sequence broken across two lines stops being a sequence: the child reads
  // "one quarter, two quarters" then hunts for where it carries on. So the
  // stated minimum is the width the whole row needs on ONE line, which grows
  // with both the number of fractions and the number of digits in them.
  return Math.max(30, fractionRowWidthMm(spec));
}

function needsStackedFraction(spec) {
  const minWidthMm = needsFractionRow(spec);
  const stemMm = spec.text
    ? linesFor(spec.text, minWidthMm) * LINE_MM + SPACE_TIGHT_MM
    : 0;
  return { minWidthMm, minHeightMm: stemMm + FRAC_ROW_MM };
}

function needsFractionSequence(spec) {
  return { minWidthMm: needsFractionRow(spec), minHeightMm: FRAC_ROW_MM };
}

// ─── chip-bank ───────────────────────────────────────────────────────────
// A set of short labels drawn as separate bordered choices. The point of the
// borders is discrimination: a comma-joined list reads as running text, and a
// child picking one word out of six should not have to parse a sentence first.
//
// The three variants keep the Word builder's three identities, mapped on to the
// tokens whose settled meaning matches. `blue` is the neutral default and takes
// the question colour; `green` takes the vocabulary colour, which is what a
// scaffold bank of words is; `yellow` has no token (there is no yellow in this
// palette) and takes the "given" orange, which carries exactly what the Word
// builder's warm word-bank yellow was for - material handed to the child.
const CHIP_VARIANTS = { blue: "question", yellow: "given", green: "vocab" };

// A chip is only as wide as ITS OWN label needs, with a floor so that a bank
// of three-letter words does not come out as a row of stubs. Sizing every chip
// to the longest label in the bank was tried and looked wrong on paper: a bank
// holding "beans" beside "vitamins and minerals" printed "beans" in a pill
// mostly made of empty space, and a child reads dead space inside a border as
// a place to write. Each chip hugs its word; the wrap packs them.
const CHIP_MIN_MM = 20;
const CHIP_GAP_MM = SPACE_TIGHT_MM;
const CHIP_PAD_X_MM = INSET.card.h;
const CHIP_PAD_Y_MM = INSET.card.v;
const CHIP_BORDER_MM = RULE.line;
const CHIP_CHAR_MM = BODY_PT * PT_MM * 0.58; // bold, so wider than prose

// A chip is a word, and OPTIONALLY what that word means.
//
// It used to be a word and nothing else, and a designer with a word to gloss
// had one move left: a second chip-bank beside the first, holding the one word
// that needed a meaning, with the meaning as a loose instruction under it. That
// is what a Year 4 activity sheet shipped - "muscles" in a titled green bank on
// the left, "oxygen" in an untitled blue bank on the right, floating higher up
// the page because it had no title line above it to push it down, and one of
// the two words defined. A word bank that is two banks is not a word bank: the
// child cannot see the set they are choosing from.
//
// So a chip may be written as a bare string, or as { word, meaning }, and the
// bank stays one bank.
function chipList(spec) {
  return (Array.isArray(spec.chips) ? spec.chips : [])
    .map((c) => {
      if (c && typeof c === "object" && !Array.isArray(c)) {
        return {
          word: c.word == null ? "" : String(c.word).trim(),
          meaning: c.meaning == null ? "" : String(c.meaning).trim(),
        };
      }
      return { word: c == null ? "" : String(c).trim(), meaning: "" };
    })
    .filter((c) => c.word !== "");
}

// A bank titled "Word bank" is vocabulary by definition, so with no variant
// stated it takes vocabulary green rather than the neutral blue. The teacher's
// colour system says green IS what a bank of taught words means on paper, and
// a designer who leaves `variant` off has not chosen blue - they have not
// chosen. An explicit variant still wins, for the bank that is genuinely
// something else (options for a question, material handed over).
function chipVariantClass(spec) {
  let role = CHIP_VARIANTS[spec.variant];
  if (!role) {
    role = /word\s*bank/i.test(String(spec.title || ""))
      ? CHIP_VARIANTS.green
      : CHIP_VARIANTS.blue;
  }
  return `h-chipbank--${role}`;
}

function renderChipBank(spec) {
  const chips = chipList(spec);
  const stem = spec.text ? `<p class="h-money-stem">${esc(spec.text)}</p>` : "";
  const title = spec.title
    ? `<p class="h-chipbank-title">${esc(spec.title)}</p>`
    : "";
  const pills = chips
    .map(
      (chip) =>
        `<span class="h-chip"><span class="h-chip-word">${esc(chip.word)}</span>` +
        (chip.meaning
          ? `<span class="h-chip-meaning">${esc(chip.meaning)}</span>`
          : "") +
        `</span>`
    )
    .join("");
  return `
    <div class="h-chipbank ${chipVariantClass(spec)}">
      ${stem}${title}
      <div class="h-chipbank-grid">${pills}</div>
    </div>`;
}

// One chip's printed width at this zone width: its own word, padded and
// bordered, floored, and never wider than the zone. A chip carrying a meaning
// is sized to whichever of the two is wider, the meaning measured at the note
// size it prints in - otherwise a five-letter word with a six-word gloss under
// it comes out a stub with its meaning wrapped four times inside it.
const CHIP_MEANING_CHAR_MM = TYPE.note * PT_MM * 0.5;
const CHIP_MEANING_MAX_MM = 55; // past this a gloss is prose, not a label

function chipWidthMm(chip, widthMm) {
  const wordMm = chip.word.length * CHIP_CHAR_MM;
  const meaningMm = chip.meaning
    ? Math.min(CHIP_MEANING_MAX_MM, chip.meaning.length * CHIP_MEANING_CHAR_MM)
    : 0;
  const naturalMm =
    Math.max(wordMm, meaningMm) + CHIP_PAD_X_MM * 2 + CHIP_BORDER_MM * 2;
  return Math.min(widthMm, Math.max(CHIP_MIN_MM, naturalMm));
}

// How tall one chip comes out at its own printed width: the word at body size,
// and any meaning wrapped under it at note size.
function chipHeightMm(chip, widthMm) {
  const innerMm = Math.max(
    4,
    chipWidthMm(chip, widthMm) - CHIP_PAD_X_MM * 2 - CHIP_BORDER_MM * 2
  );
  const wordLines = Math.max(
    1,
    Math.ceil((chip.word.length * CHIP_CHAR_MM) / innerMm)
  );
  const meaningLines = chip.meaning
    ? Math.max(1, Math.ceil((chip.meaning.length * CHIP_MEANING_CHAR_MM) / innerMm))
    : 0;
  return (
    wordLines * LINE_MM +
    meaningLines * NOTE_LINE_MM +
    CHIP_PAD_Y_MM * 2 +
    CHIP_BORDER_MM * 2
  );
}

// The wrap the browser will produce, simulated greedily: chips go onto a row
// until the next one no longer fits, exactly as flex wrap lays them. The row
// count is the whole height, so it is worked out rather than guessed.
function chipRows(chips, widthMm) {
  const rows = [];
  let row = null;
  let usedMm = 0;
  for (const chip of chips) {
    const wMm = chipWidthMm(chip, widthMm);
    const withGapMm = row ? usedMm + CHIP_GAP_MM + wMm : wMm;
    if (!row || withGapMm > widthMm) {
      row = [chip];
      usedMm = wMm;
      rows.push(row);
    } else {
      row.push(chip);
      usedMm = withGapMm;
    }
  }
  return rows;
}

function measureChipBank(spec, widthMm) {
  const chips = chipList(spec);
  const stemMm = spec.text
    ? linesFor(spec.text, widthMm) * LINE_MM + SPACE_TIGHT_MM
    : 0;
  const titleMm = spec.title ? LINE_MM + SPACE_TIGHT_MM : 0;
  if (chips.length === 0) return stemMm + titleMm;

  // Each row is as tall as its tallest chip. A chip only wraps its own word
  // when that word is wider than the whole zone, because its width hugs the
  // word everywhere short of that; a meaning under it adds its own note lines.
  const rowsMm = chipRows(chips, widthMm).map((row) =>
    Math.max(...row.map((chip) => chipHeightMm(chip, widthMm)))
  );

  return (
    stemMm +
    titleMm +
    rowsMm.reduce((sum, mm) => sum + mm, 0) +
    (rowsMm.length - 1) * CHIP_GAP_MM
  );
}

function needsChipBank(spec) {
  const chips = chipList(spec);
  // Wide enough for the longest label, plus a second smallest chip beside it
  // once there is more than one: a bank one chip wide is a list, and the
  // separation the borders exist for stops doing any work.
  const widestMm = chips.reduce(
    (m, chip) => Math.max(m, chipWidthMm(chip, WIDEST_ZONE_MM)),
    CHIP_MIN_MM
  );
  const minWidthMm =
    chips.length > 1 ? widestMm + CHIP_GAP_MM + CHIP_MIN_MM : widestMm;
  return {
    minWidthMm,
    // Chips pack better as the zone gets wider, so the shortest the content can
    // ever come out is at the widest a zone could be. Same reasoning as
    // text.js: a minimum measured at the NARROWEST width states the tallest
    // case and refuses zones that would have been fine.
    minHeightMm: measureChipBank(spec, WIDEST_ZONE_MM),
  };
}

const css = `
  /* shared shell: a prompt, the thing itself, sometimes a line for the answer */
  .h-money-stem {
    margin: 0 0 var(--space-tight);
    font-size: var(--type-body); color: var(--colour-ink);
    line-height: 1.35;
  }
  .h-money-figure { display: flex; justify-content: center; margin: 0 auto; }
  /* No max-height here, unlike .h-figure. The drawing's width is capped in
     millimetres by the inline style, so its height follows from the aspect and
     is known exactly by the measurement. A max-height would silently squash a
     drawing whose measured height the zone happened to disagree with, and the
     squashing would look like a design choice. */
  .h-money-figure svg { width: 100%; height: auto; }
  .h-money-answer {
    display: block;
    height: ${ANSWER_LINE_MM}mm;
    margin-top: var(--space-tight);
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
  }

  /* stacked-fraction and fraction-sequence */
  .h-frac-row {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
    gap: ${FRAC_GAP_MM}mm;
  }
  .h-frac {
    display: inline-flex; flex-direction: column; text-align: center;
    font-size: var(--type-question); font-weight: bold;
    color: var(--colour-ink);
    /* Pinned, and it must stay in step with FRAC_LINE_MM above. Left unset,
       Comic Sans's own default of about 1.5 makes every fraction taller than
       the measurement said, and the bottom of the zone is quietly clipped. */
    line-height: 1.35;
  }
  /* The fraction bar. It is a border rather than a drawn line so that it always
     spans exactly the width of the wider of the two numbers. */
  .h-frac-num {
    border-bottom: ${FRAC_BAR_MM}mm solid var(--colour-ink);
    padding: 0 ${FRAC_PAD_X_MM}mm;
  }
  .h-frac-den { padding: 0 ${FRAC_PAD_X_MM}mm; }
  .h-frac-blank {
    display: inline-block;
    box-sizing: border-box;
    width: ${FRAC_BLANK_W_MM}mm;
    height: ${f(FRAC_ROW_MM)}mm;
    border: ${FRAC_BORDER_MM}mm solid var(--colour-ink);
  }
  .h-frac-sep {
    font-size: var(--type-question); font-weight: bold;
    color: var(--colour-ink); line-height: 1.35;
    min-width: ${FRAC_SEP_W_MM}mm; text-align: center;
  }

  /* chip-bank */
  /* A label on given material, in ink. It was question blue, and on a real
     sheet it was carrying the instruction "Write the word that names each side"
     - which a child reads and so is black. Blue names a BLOCK (a section, a
     fact file, a table's caption); everything a child reads is ink; material
     handed to them is the given orange, which the chips beneath already are. */
  /* Not bold. It is a label or an instruction the child reads, and bold on a
     whole sentence is emphasis on nothing in particular. On a real sheet this
     printed an entire instruction in bold while the question number beside it
     was not, which is the emphasis exactly the wrong way round. */
  .h-chipbank-title {
    margin: 0 0 var(--space-tight);
    font-size: var(--type-body); line-height: 1.35;
  }
  .h-chipbank-grid {
    /* Wrapped flex rather than a uniform grid: every chip hugs its own word,
       so "beans" is beans-sized beside a wide "vitamins and minerals" instead
       of matching it and carrying dead space a child reads as writing room.
       measure() simulates this exact greedy wrap. */
    display: flex; flex-wrap: wrap;
    gap: ${CHIP_GAP_MM}mm;
  }
  .h-chip {
    box-sizing: border-box;
    flex: 0 1 auto;
    min-width: ${CHIP_MIN_MM}mm;
    max-width: 100%;
    border: ${CHIP_BORDER_MM}mm solid var(--colour-question);
    background: var(--colour-tint);
    color: var(--colour-question);
    padding: ${CHIP_PAD_Y_MM}mm ${CHIP_PAD_X_MM}mm;
    border-radius: 1mm;
    text-align: center; font-weight: bold;
    font-size: var(--type-body); line-height: 1.35;
  }
  .h-chip-word { display: block; }
  /* What the word means, inside the chip that carries the word. Note size and
     not bold, so the word stays the thing being chosen and the gloss is what
     lets a child choose it. In ink rather than the chip's colour: the meaning
     is prose the child reads, and the chip's colour is what says where the
     word came from. */
  .h-chip-meaning {
    display: block;
    font-size: var(--type-note); font-weight: normal;
    color: var(--colour-ink); line-height: 1.35;
  }
  .h-chipbank--vocab .h-chip {
    border-color: var(--colour-vocab); color: var(--colour-vocab);
  }
  .h-chipbank--given .h-chip {
    border-color: var(--colour-given); color: var(--colour-given);
  }
`;

const helpers = {
  "stacked-fraction": {
    render: renderStackedFraction,
    measure: measureStackedFraction,
    needs: needsStackedFraction,
    greed: NEVER_STRETCH,
  },
  "fraction-sequence": {
    render: renderFractionRow,
    measure: measureFractionRow,
    needs: needsFractionSequence,
    greed: NEVER_STRETCH,
  },
  "coin-strip": {
    render: renderCoinStrip,
    measure: measureCoinStrip,
    needs: needsCoinStrip,
    greed: NEVER_STRETCH,
  },
  // Two names, one drawing: the shared part-whole model (shared/visuals/
  // part-whole-model-svg.js), which the board, the wall and the stick-in pack
  // place too. The mathematical object is a whole joined to its parts; money is
  // one thing it can be made of.
  //
  // `part-whole-money` keeps the old permissive contract because specs written
  // against it are already saved. `part-whole` requires every node to say
  // whether the child is handed it or writes it, for the same reason a
  // label-diagram's callouts do: on paper a node left empty because that is the
  // question and a node left empty because nobody decided look identical.
  "part-whole-money": withStem(atPrintedWidth(partWholeModel, { minWidthMm: partWholeMinMm(false), toSpec: (spec) => ({ ...spec, requireIntent: false }) })),
  "part-whole": withStem(atPrintedWidth(partWholeModel, { minWidthMm: partWholeMinMm(true), toSpec: (spec) => ({ ...spec, requireIntent: true }) })),
  "chip-bank": {
    render: renderChipBank,
    measure: measureChipBank,
    needs: needsChipBank,
    greed: NEVER_STRETCH,
  },
};

module.exports = { helpers, css };
