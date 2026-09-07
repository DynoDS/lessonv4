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

// ─── part-whole-money ────────────────────────────────────────────────────
// A whole bubble with parts beneath it, connected by lines. Geometry lifted
// from the Word builder's renderPartWholeMoneyPng: the same paddings, gaps,
// corner radius and coin row layout, so a model looks the same on paper as it
// did before. What changes is that it is drawn once as SVG rather than
// composited from PNGs.
//
// The Word version threw for anything other than two parts. This one draws
// however many it is given, because the arithmetic for `needs` has to grow with
// the part count anyway and refusing to draw a three-part model is a worse
// answer than drawing one. A two-part model comes out identical.

const PW = {
  labelFont: 22,
  bubblePadX: 12,
  bubblePadY: 10,
  bubbleStroke: 2,
  labelGap: 6,
  // The "+" between two part nodes, drawn in the gap that already separates
  // them. An additive model whose parts are only adjacent leaves the child to
  // supply the operator; one that prints it says what the diagram means.
  joinerFont: 20,
  joinerClearance: 5, // the white space each side of the operator
  // The Word builder drew every coin in a bubble at 56 units. That figure is
  // kept, but as the size of the LARGEST coin: a £2 is 56 units and everything
  // else follows its real diameter, so the coins inside a bubble are to scale
  // with each other and with the ones in a coin strip.
  coinUnitsPerMm: 56 / COIN_MM["£2"],
  coinGap: 6,
  coinRowGap: 4,
  partGap: 28,
  verticalGap: 36,
  sidePad: 8,
  topPad: 4,
  bottomPad: 8,
  radius: 14,
  minInnerW: 60,
};

// How UK primary resources cluster coins when there are more than three, lifted
// from the Word builder so a bubble never has to be wide enough for every coin
// in one strip.
function coinRowLayout(count) {
  if (count === 0) return [];
  if (count <= 3) return [count];
  if (count === 4) return [2, 2];
  if (count === 5) return [3, 2];
  if (count === 6) return [3, 3];
  const rows = [];
  let remaining = count;
  while (remaining > 3) {
    rows.push(3);
    remaining -= 3;
  }
  if (remaining > 0) rows.push(remaining);
  return rows;
}

// What a bubble PRINTS inside itself, and in which of the two meanings.
//
// A value is material handed to the child and takes the given colour, the same
// as a value in a data table. A label is a word the child READS - "Left",
// "Pounds", "Thousands" - and stays in ink. They are different things, and a
// bubble that tried to be both would have to print one word in two colours, so
// the two are refused together rather than silently ranked.
//
// `value` is read with `!= null` and never for truthiness. A given zero is a
// real part of a partition - 6,007 has zero hundreds, and that zero is the
// whole point of the question - so a bubble carrying 0 prints "0" and is not
// mistaken for an empty one.
function bubbleInk(bubble) {
  const hasValue = bubble.value != null && bubble.value !== "";
  const hasLabel = bubble.label != null && bubble.label !== "";
  if (hasValue && hasLabel) {
    throw new Error(
      "part-whole: a bubble takes `value` (handed to the child, given colour) " +
        "or `label` (a word they read, in ink), not both"
    );
  }
  if (hasValue) return { text: String(bubble.value), role: "given" };
  if (hasLabel) return { text: String(bubble.label), role: "ink" };
  return null;
}

// A node the child writes into. Its floor is the engine's own answer for how
// wide a write-in blank is - BLANK_MM across BLANK_CHARS characters, the same
// arithmetic a blank in a prompt uses - so a four-digit part and a two-word
// part do not come out the same size.
const PW_WRITE_CHARS = 4; // a four-digit number, the commonest thing written here
const PW_CHAR_MM = BLANK_MM / BLANK_CHARS;

function blankChars(bubble) {
  if (bubble.blank == null || bubble.blank === false) return 0;
  const stated = bubble.blankChars;
  if (stated == null) return PW_WRITE_CHARS;
  if (typeof stated !== "number" || !Number.isFinite(stated) || stated < 1 || stated > 40) {
    throw new Error("part-whole: `blankChars` must be a number from 1 to 40");
  }
  return Math.ceil(stated);
}

// The smallest this bubble may PRINT at, in millimetres. Every bubble has one,
// and the model's own minimum is whichever of them is hardest to satisfy, so a
// four-part model asks for exactly what its four parts need rather than for a
// constant somebody chose once.
function bubbleMinWidthMm(bubble) {
  const chars = blankChars(bubble);
  if (chars > 0) {
    return Math.max(PW_BLANK_MIN_MM, chars * PW_CHAR_MM + 2 * INSET.card.h);
  }
  if ((bubble.coins || []).length > 0) return PW_BUBBLE_MIN_MM;

  const ink = bubbleInk(bubble);
  if (!ink) {
    // Nothing in it and nothing said about it: the money route's empty whole,
    // which is a bubble the child writes an amount into. It keeps the write-in
    // floor it has always had.
    return PW_BUBBLE_MIN_MM;
  }
  // A bubble that only PRINTS needs to be readable, not writable, and the
  // registry's legibility floor already guarantees the reading. All this adds
  // is that the box stays a box around its own text.
  return Math.max(
    PW_PRINTED_MIN_MM,
    ink.text.length * TYPE.note * PT_MM * 0.5 + 2 * INSET.card.h
  );
}

// Every part of a bubble a designer can state, checked once. `part-whole`
// requires the intent to be stated, the way a label-diagram's callouts do: a
// node drawn empty because that is the question and a node drawn empty because
// nobody said what it was for look identical on paper, and only one of them is
// a design. The money route keeps its old permissive contract, because specs
// written against it are already saved.
function checkBubble(bubble, strict, where) {
  const ink = bubbleInk(bubble);
  const chars = blankChars(bubble);
  const coins = bubble.coins || [];
  if (chars > 0 && (ink || coins.length > 0)) {
    throw new Error(
      `part-whole: ${where} is marked blank and also carries ` +
        `${ink ? "a value or label" : "coins"}. A blank node is empty; that is ` +
        "what makes it the question."
    );
  }
  if (strict && chars === 0 && !ink && coins.length === 0) {
    throw new Error(
      `PART_WHOLE_INTENT_UNSTATED: ${where} carries nothing and is not marked ` +
        "`blank: true`. Say whether the child is handed this node or writes it."
    );
  }
}

function bubbleSize(bubble) {
  const coins = bubble.coins || [];
  const rows = coinRowLayout(coins.length);
  // Every row is measured from the actual denominations in it, because they are
  // no longer all the same size: a row holding a £2 is taller than a row holding
  // three 5ps, and a note is wider again.
  const rowWidths = [];
  const rowHeights = [];
  let offset = 0;
  for (const count of rows) {
    const sizes = coins
      .slice(offset, offset + count)
      .map((d) => denominationSizeMm(d));
    rowWidths.push(
      sizes.reduce((w, s) => w + s.w * PW.coinUnitsPerMm, 0) +
        (count - 1) * PW.coinGap
    );
    rowHeights.push(
      sizes.reduce((m, s) => Math.max(m, s.h * PW.coinUnitsPerMm), 0)
    );
    offset += count;
  }
  const coinW = rowWidths.reduce((m, w) => Math.max(m, w), 0);
  const coinH =
    rowHeights.reduce((sum, h) => sum + h, 0) +
    Math.max(0, rows.length - 1) * PW.coinRowGap;
  const tallestCoin = rowHeights.reduce((m, h) => Math.max(m, h), 0);

  const ink = bubbleInk(bubble);
  const chars = blankChars(bubble);
  // A blank is sized by what will be written in it, so it comes out the width
  // of the value it is asking for rather than a constant. One character metric
  // for both, so a four-digit blank and a printed "6,731" are the same box.
  const textW = ink
    ? ink.text.length * (PW.labelFont * 0.55)
    : chars * (PW.labelFont * 0.55);
  const innerW = Math.max(coinW, textW, PW.minInnerW);
  const innerH =
    coinH + (ink ? PW.labelFont + (coins.length > 0 ? PW.labelGap : 0) : 0);
  // A coin-carrying bubble has to be at least as tall as its biggest coin. A
  // text-only bubble can be much shorter, and that is what gives the schematic
  // part-whole its compact look.
  const minH =
    coins.length > 0
      ? tallestCoin + PW.bubblePadY * 2
      : PW.labelFont + PW.bubblePadY * 2;

  const caption = bubble.caption != null && bubble.caption !== ""
    ? String(bubble.caption)
    : null;

  const w = innerW + PW.bubblePadX * 2;
  return {
    w,
    h: Math.max(innerH + PW.bubblePadY * 2, minH),
    caption,
    // A caption names what a node IS ("Thousands"). It is not content in the
    // node: it prints under the box, quiet and note-sized, so a child never
    // reads it as something already written in the space they are about to
    // write in.
    //
    // It is printed OUTSIDE the drawing, as ordinary text, and that is not a
    // detail. Text inside an SVG is scaled with the SVG, so a caption set small
    // enough to be quiet drags the whole model's minimum width up until that
    // text reaches note size - and a four-part model then needs more page than
    // two of them side by side can have. Out here it prints at note size
    // whatever the model's width, and the width the model asks for is decided
    // by the boxes a child writes in rather than by the smallest word on it.
    captionMm: caption ? caption.length * TYPE.note * PT_MM * 0.5 : 0,
    ink,
    chars,
    minWidthMm: bubbleMinWidthMm(bubble),
    rows,
    rowHeights,
    tallestCoin,
  };
}

function buildPartWholeSvg(spec, strict) {
  const whole = spec.whole || {};
  const parts = spec.parts || [];
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error("part-whole-money: 'parts' must list at least one part bubble");
  }

  checkBubble(whole, strict, "the whole");
  parts.forEach((part, i) => checkBubble(part, strict, `part ${i + 1}`));

  // The operator between two parts. Stated, because a part-whole model is not
  // always additive: named parts of an amount are joined by nothing, and this
  // prints only what the designer asked for.
  const joiner = spec.joiner != null && spec.joiner !== "" ? String(spec.joiner) : null;

  const wholeSize = bubbleSize(whole);
  const partSizes = parts.map(bubbleSize);

  // A joiner needs room to sit in. Widening the gap rather than shrinking the
  // boxes keeps the parts the size their content asked for.
  const joinerW = joiner ? joiner.length * PW.joinerFont * 0.6 : 0;
  const partGap = joiner
    ? Math.max(PW.partGap, joinerW + 2 * PW.joinerClearance)
    : PW.partGap;

  const partsRowW =
    partSizes.reduce((sum, s) => sum + s.w, 0) + (parts.length - 1) * partGap;
  const contentW = Math.max(wholeSize.w, partsRowW);
  const totalW = contentW + PW.sidePad * 2;
  const tallestPart = partSizes.reduce((m, s) => Math.max(m, s.h), 0);
  const totalH =
    PW.topPad + wholeSize.h + PW.verticalGap + tallestPart + PW.bottomPad;

  const wholeX = (totalW - wholeSize.w) / 2;
  const wholeY = PW.topPad;
  const partY = wholeY + wholeSize.h + PW.verticalGap;
  const partXs = [];
  let cursor = (totalW - partsRowW) / 2;
  partSizes.forEach((size) => {
    partXs.push(cursor);
    cursor += size.w + partGap;
  });

  const els = [];

  // Connectors first, so the bubbles sit on top of where the lines meet them.
  const wholeBottom = { x: wholeX + wholeSize.w / 2, y: wholeY + wholeSize.h };
  partSizes.forEach((size, i) => {
    const top = { x: partXs[i] + size.w / 2, y: partY };
    els.push(
      `<line x1="${f(wholeBottom.x)}" y1="${f(wholeBottom.y)}" x2="${f(top.x)}" y2="${f(top.y)}"` +
        ` stroke="var(--colour-ink)" stroke-width="${PW.bubbleStroke}" />`
    );
  });

  // The operator sits in the gap, on the line through the middle of the boxes.
  if (joiner) {
    const midY = partY + partSizes.reduce((m, s) => Math.max(m, s.h), 0) / 2;
    for (let i = 0; i < partSizes.length - 1; i += 1) {
      const x = (partXs[i] + partSizes[i].w + partXs[i + 1]) / 2;
      els.push(
        `<text x="${f(x)}" y="${f(midY)}" text-anchor="middle" dominant-baseline="central"` +
          ` font-family="var(--font)" font-size="${PW.joinerFont}" fill="var(--colour-ink)">${esc(joiner)}</text>`
      );
    }
  }

  function drawBubble(bubble, x, y, size) {
    els.push(
      `<rect x="${f(x)}" y="${f(y)}" width="${f(size.w)}" height="${f(size.h)}"` +
        ` rx="${PW.radius}" ry="${PW.radius}" fill="white" stroke="var(--colour-ink)"` +
        ` stroke-width="${PW.bubbleStroke}" />`
    );

    const coins = bubble.coins || [];
    let cy = y + PW.bubblePadY;
    if (coins.length > 0) {
      let offset = 0;
      size.rows.forEach((count, row) => {
        const slice = coins.slice(offset, offset + count);
        const sizes = slice.map((d) => denominationSizeMm(d));
        const rowW =
          sizes.reduce((w, s) => w + s.w * PW.coinUnitsPerMm, 0) +
          (count - 1) * PW.coinGap;
        const rowH = size.rowHeights[row];
        let cursorX = x + (size.w - rowW) / 2;
        slice.forEach((denomination, i) => {
          // Bottom-aligned within the row, matching the coin strip: coins of
          // different sizes sit on one line rather than floating.
          const top = cy + rowH - sizes[i].h * PW.coinUnitsPerMm;
          const drawn = drawDenomination(denomination, cursorX, top, PW.coinUnitsPerMm);
          els.push(...drawn.parts);
          cursorX += drawn.widthUnits + PW.coinGap;
        });
        cy += rowH + PW.coinRowGap;
        offset += count;
      });
      cy += -PW.coinRowGap + PW.labelGap;
    }

    if (size.ink) {
      // A label stays in ink and deliberately: it is as often a prompt the
      // child reads ("Left", "Pounds") as anything else, and one word cannot be
      // two colours. A `value` is different - it is material handed over, like
      // a value in a data table - so it takes the given colour and the weight
      // that goes with it.
      const given = size.ink.role === "given";
      els.push(
        `<text x="${f(x + size.w / 2)}" y="${f(cy + PW.labelFont * 0.85)}" text-anchor="middle"` +
          ` font-family="var(--font)" font-size="${PW.labelFont}"` +
          (given ? ` font-weight="bold"` : "") +
          ` fill="var(--colour-${given ? "given" : "ink"})">${esc(size.ink.text)}</text>`
      );
    }

  }

  drawBubble(whole, wholeX, wholeY, wholeSize);
  partSizes.forEach((size, i) => drawBubble(parts[i], partXs[i], partY, size));

  // Where each caption goes, as a fraction of the drawing's width, so the text
  // under the figure lands under the node it names however wide the model is
  // finally drawn.
  const captions = [];
  const anchor = (size, x) => {
    if (!size.caption) return;
    captions.push({
      text: size.caption,
      // Centre of the node, and the room it has before it runs into its
      // neighbour's caption.
      atPct: ((x + size.w / 2) / totalW) * 100,
      pitchUnits: size.w + partGap,
      widthMm: size.captionMm,
    });
  };
  anchor(wholeSize, wholeX);
  partSizes.forEach((size, i) => anchor(size, partXs[i]));

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(totalW)} ${f(totalH)}">${els.join("")}</svg>`,
    aspect: totalW / totalH,
    unitsWide: totalW,
    captions,
    // A caption needs the width its own node's share of the model gives it, or
    // two captions print into each other. Carried the same way the bubble
    // floors are: the width the WHOLE model has to reach for this one to fit.
    captionFloorsMm: captions.map(
      (c) => ((c.widthMm + CAPTION_CLEARANCE_MM) / c.pitchUnits) * totalW
    ),
    // Every bubble's own printed floor, carried as the width the WHOLE model
    // has to reach for that bubble to get it. The model's minimum is then just
    // the largest of them, which for a set of equal bubbles is exactly what the
    // single narrowest-bubble constant used to give.
    bubbleFloorsMm: [wholeSize, ...partSizes].map(
      (size) => (size.minWidthMm / size.w) * totalW
    ),
    bubbleCeilingsMm: [wholeSize, ...partSizes].map(
      (size) => (PW_BUBBLE_MAX_MM / size.w) * totalW
    ),
    hasCoins:
      (whole.coins || []).length > 0 ||
      parts.some((p) => (p.coins || []).length > 0),
  };
}

// A bubble a child writes an amount into needs to be a real box on paper, and a
// coin inside one still needs to be identifiable. Whichever of the two is the
// tighter constraint sets the width of the whole model, and both grow with what
// is actually in it: four parts make a wider row than two, and coins in the
// bubbles raise the floor again.
const PW_BUBBLE_MIN_MM = 24;
const PW_BUBBLE_MAX_MM = 46; // wider than this a bubble is just white space
// The floor for a node the child writes in, below which the box stops being
// somewhere to write however few characters it holds.
const PW_BLANK_MIN_MM = 14;
// And the floor for a node that only prints. Smaller than the write-in floor
// on purpose: nobody has to fit a pencil into it.
const PW_PRINTED_MIN_MM = 12;
// The gap between one caption and the next. A word touching the word beside it
// is two words nobody can read.
const CAPTION_CLEARANCE_MM = SPACE.tight;
// Coins in a bubble are supporting a partition rather than being identified
// cold, so they may print a little smaller than a strip's before they stop
// working. They still stop growing at life size.
const PW_COIN_SCALE_MIN = 0.55;
const PW_COIN_SCALE_MAX = 1;

// A coin drawn inside a bubble prints at `scale` of its real size when the whole
// model is this many millimetres wide.
function partWholeWidthForCoinScale(geometry, scale) {
  return (scale / PW.coinUnitsPerMm) * geometry.unitsWide;
}

function partWholeMinWidthMm(geometry) {
  const byBubble = Math.max(
    ...geometry.bubbleFloorsMm,
    ...geometry.captionFloorsMm
  );
  const byCoin = geometry.hasCoins
    ? partWholeWidthForCoinScale(geometry, PW_COIN_SCALE_MIN)
    : 0;
  return Math.max(byBubble, byCoin);
}

function partWholeMaxWidthMm(geometry) {
  const byBubble = Math.max(...geometry.bubbleCeilingsMm);
  const byCoin = geometry.hasCoins
    ? partWholeWidthForCoinScale(geometry, PW_COIN_SCALE_MAX)
    : 0;
  // A ceiling under the floor is not a ceiling. A model whose blanks ask for
  // more width than a bubble is allowed to be pretty at would otherwise be
  // drawn smaller than its own minimum and refused by its own `needs`.
  return Math.max(byBubble, byCoin, partWholeMinWidthMm(geometry));
}

function partWholeCaptionsHtml(geometry) {
  if (geometry.captions.length === 0) return "";
  const spans = geometry.captions
    .map(
      (c) =>
        `<span class="h-pw-caption" style="left:${f(c.atPct)}%">${esc(c.text)}</span>`
    )
    .join("");
  return `<div class="h-pw-captions">${spans}</div>`;
}

function partWholeCaptionMm(geometry) {
  return geometry.captions.length > 0 ? NOTE_LINE_MM + SPACE.hair : 0;
}

function renderPartWhole(spec, strict) {
  const geometry = buildPartWholeSvg(spec, strict);
  const stem = spec.text ? `<p class="h-money-stem">${esc(spec.text)}</p>` : "";
  return `
    <div class="h-money">
      ${stem}
      <div class="h-pw-figure" style="max-width:${f(partWholeMaxWidthMm(geometry))}mm">${geometry.svg}${partWholeCaptionsHtml(geometry)}</div>
    </div>`;
}

function measurePartWhole(spec, widthMm, strict) {
  const geometry = buildPartWholeSvg(spec, strict);
  const stemMm = spec.text
    ? linesFor(spec.text, widthMm) * LINE_MM + SPACE_TIGHT_MM
    : 0;
  const drawnWidth = Math.min(widthMm, partWholeMaxWidthMm(geometry));
  return stemMm + drawnWidth / geometry.aspect + partWholeCaptionMm(geometry);
}

function needsPartWhole(spec, strict) {
  const geometry = buildPartWholeSvg(spec, strict);
  const minWidthMm = partWholeMinWidthMm(geometry);
  const stemMm = spec.text
    ? linesFor(spec.text, minWidthMm) * LINE_MM + SPACE_TIGHT_MM
    : 0;
  return {
    minWidthMm,
    minHeightMm:
      minWidthMm / geometry.aspect + stemMm + partWholeCaptionMm(geometry),
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

function chipList(spec) {
  return (Array.isArray(spec.chips) ? spec.chips : [])
    .map((c) => (c == null ? "" : String(c)))
    .filter((c) => c !== "");
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
    .map((label) => `<span class="h-chip">${esc(label)}</span>`)
    .join("");
  return `
    <div class="h-chipbank ${chipVariantClass(spec)}">
      ${stem}${title}
      <div class="h-chipbank-grid">${pills}</div>
    </div>`;
}

// One chip's printed width at this zone width: its own label, padded and
// bordered, floored, and never wider than the zone.
function chipWidthMm(label, widthMm) {
  const naturalMm =
    label.length * CHIP_CHAR_MM + CHIP_PAD_X_MM * 2 + CHIP_BORDER_MM * 2;
  return Math.min(widthMm, Math.max(CHIP_MIN_MM, naturalMm));
}

// The wrap the browser will produce, simulated greedily: chips go onto a row
// until the next one no longer fits, exactly as flex wrap lays them. The row
// count is the whole height, so it is worked out rather than guessed.
function chipRows(chips, widthMm) {
  const rows = [];
  let row = null;
  let usedMm = 0;
  for (const label of chips) {
    const wMm = chipWidthMm(label, widthMm);
    const withGapMm = row ? usedMm + CHIP_GAP_MM + wMm : wMm;
    if (!row || withGapMm > widthMm) {
      row = [label];
      usedMm = wMm;
      rows.push(row);
    } else {
      row.push(label);
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

  // Each row is as tall as its tallest chip. A chip only wraps its own text
  // when its label is wider than the whole zone, because its width hugs the
  // label everywhere short of that.
  const rowsMm = chipRows(chips, widthMm).map((row) => {
    const lines = Math.max(
      ...row.map((label) => {
        const textMm = Math.max(
          4,
          chipWidthMm(label, widthMm) - CHIP_PAD_X_MM * 2 - CHIP_BORDER_MM * 2
        );
        return Math.max(1, Math.ceil((label.length * CHIP_CHAR_MM) / textMm));
      })
    );
    return lines * LINE_MM + CHIP_PAD_Y_MM * 2 + CHIP_BORDER_MM * 2;
  });

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
    (m, label) => Math.max(m, chipWidthMm(label, WIDEST_ZONE_MM)),
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
  .h-chipbank--vocab .h-chip {
    border-color: var(--colour-vocab); color: var(--colour-vocab);
  }
  .h-chipbank--given .h-chip {
    border-color: var(--colour-given); color: var(--colour-given);
  }
`;

/* The caption strip under a part-whole model. Each word is anchored to the
   centre of the node it names, as a percentage of the drawing's width, so it
   stays under that node however wide the model is finally drawn. */
const partWholeCss = `
  /* A block, not the flex row a coin strip uses: the captions are a second row
     under the drawing, and a flex row would stand them beside it. */
  .h-pw-figure { display: block; margin: 0 auto; }
  .h-pw-figure svg { display: block; width: 100%; height: auto; }
  .h-pw-captions {
    position: relative; width: 100%;
    height: ${NOTE_LINE_MM}mm; margin-top: var(--space-hair);
  }
  .h-pw-caption {
    position: absolute; top: 0; transform: translateX(-50%);
    white-space: nowrap;
    font-size: var(--type-note); color: var(--colour-quiet); line-height: 1.35;
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
  // Two names, one renderer. The mathematical object is a whole joined to its
  // parts; money is one thing it can be made of, and the helper spent long
  // enough named after that one thing to be passed over for the partition,
  // decomposition and missing-addend work it draws just as well.
  //
  // `part-whole-money` keeps the old permissive contract because specs written
  // against it are already saved. `part-whole` requires every node to say
  // whether the child is handed it or writes it, for the same reason a
  // label-diagram's callouts do: on paper a node left empty because that is the
  // question and a node left empty because nobody decided look identical.
  "part-whole-money": {
    render: (spec) => renderPartWhole(spec, false),
    measure: (spec, widthMm) => measurePartWhole(spec, widthMm, false),
    needs: (spec) => needsPartWhole(spec, false),
    greed: NEVER_STRETCH,
  },
  "part-whole": {
    render: (spec) => renderPartWhole(spec, true),
    measure: (spec, widthMm) => measurePartWhole(spec, widthMm, true),
    needs: (spec) => needsPartWhole(spec, true),
    greed: NEVER_STRETCH,
  },
  "chip-bank": {
    render: renderChipBank,
    measure: measureChipBank,
    needs: needsChipBank,
    greed: NEVER_STRETCH,
  },
};

module.exports = { helpers, css: css + partWholeCss };
