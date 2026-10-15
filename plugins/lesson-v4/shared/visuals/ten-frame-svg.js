'use strict';

// THE ten frame. Two rows of five boxes holding counters: one drawing, placed
// by the board, the worksheet, the working wall and the stick-in pack.
//
// Until 13 October 2026 the package had no ten frame under that name. It could
// draw one only as a shaded fraction set to a grid of two rows of five, and
// three designers in one Year 1 number bonds lesson searched their catalogues
// for "ten frame", found nothing and reported it missing (stress test, 7
// October 2026). A fraction picture also shades parts of a whole, where a ten
// frame on a classroom table holds counters, often in two colours, comes as a
// pair for numbers to 20 and comes empty for a child to put real counters on.
// The fraction grid still draws exactly as it did; this is the picture a
// lesson asks for when it means a ten frame.
//
// Laid out in points at the size it prints, like the number line. The frame is
// the same size and in the same place whatever it holds, so an answers slide
// that adds counters to the frame its question showed moves nothing.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   normalise(spec)         -> the spec in one vocabulary, or a refusal by name
//
// ─── the spec ───────────────────────────────────────────────────────────────
//
//   count         how many counters, filled along the top row first from the
//                 left (default 0: an empty frame a child fills)
//   second        how many more counters in the second colour, carrying on
//                 from where the first stopped (6 and 4 is the bond 6 + 4)
//   frames        1 or 2. Two is the pair for numbers to 20: the first frame
//                 fills before the second starts. Left off, it is as many as
//                 the counters need. State 2 on a question whose answer will
//                 spill into the second frame, so the pair is there from the
//                 start and nothing moves on the answers slide.
//   look          "counters" (default): a round counter in each full box.
//                 "boxes": each full box coloured in, the look the fraction
//                 grid gave.
//   colour        the first colour (a 6-character hex); default counter red
//   secondColour  the second colour; default counter yellow
//   crossedOut    how many of the last counters carry a cross, for taking away
//   highlight     the part a teacher points at: "empty" (the boxes still to
//                 fill), "counters" (the first colour) or "second"
//   label         a caption under the frame. Not drawn here: the board sets it
//                 as typed text the teacher can edit, and a wall card prints it
//                 as the card's caption.
//
// The stick-in pack is photocopied, so there the two colours print as a dark
// grey and a light grey whatever the lesson chose.

const { profileFor, INK_TONES } = require('./surface-profiles');
const highlight = require('./figure-highlight');

// ─── CONSTANTS (in ems of the profile's font size unless named) ──────────────
const COLS = 5;
const ROWS = 2;
const PER_FRAME = COLS * ROWS;
const MAX_FRAMES = 2;
const CELL = 4; // a box's natural side, the size the fraction grid's boxes had
const OUTLINE = 0.12; // the frame's outline, heavier than the lines between boxes
const DIVIDER = 0.08;
const OUTLINE_OF_CELL = 0.03; // and never thinner than this share of a box, so a
const DIVIDER_OF_CELL = 0.018; // frame grown across a slide keeps a frame's weight
const MIN_STROKE_PT = 0.75; // points: thinner than this and a line vanishes on paper
const MIN_CELL = 0.9; // in ems of the readable floor: smaller and a counter is a dot
const MIN_CELL_PT = 11; // and never under this, so a paper box still takes a pencil
const FRAME_GAP = 0.5; // between the two frames of a pair, as a share of a box
const COUNTER_R = 0.36; // a counter's radius, as a share of its box
const COUNTER_EDGE = 0.045; // its outline, as a share of its box
const CROSS = 0.09; // a crossed-out counter's stroke, as a share of its box
const CROSS_REACH = 0.3; // how far the cross runs from the box's centre
// On paper and the wall a pair goes side by side, as two frames sit on a
// table, unless that squeezes its boxes under this many times the smallest box
// the surface allows (9mm on a sheet); then one frame goes above the other.
const SIDE_BY_SIDE_FLOOR = 2.3;
const COUNTER_RED = '#E03C31'; // the two sides of a classroom's double-sided counter
const COUNTER_YELLOW = '#FFC000';
const HIGHLIGHT_TINT = '#FBE0CC'; // the house highlight orange, pale enough to sit behind nothing
const LINE = { colour: '#333333', ink: INK_TONES.ink };
const HIGHLIGHT_PARTS = [
  { key: 'counters', aliases: ['first', 'full', 'full boxes', 'first colour'] },
  { key: 'second', aliases: ['second colour', 'added', 'more'] },
  { key: 'empty', aliases: ['empty boxes', 'gaps', 'spaces', 'missing'] },
];
// ────────────────────────────────────────────────────────────────────────────

function f2(n) {
  return Math.round(n * 100) / 100;
}

function wholeNumber(v) {
  if (v == null || v === false || v === '') return 0;
  if (typeof v === 'number') return Number.isInteger(v) ? v : NaN;
  if (typeof v === 'string' && /^\s*\d+\s*$/.test(v)) return Number(v);
  return NaN;
}

function hexOf(value, fallback) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(value == null ? '' : value).trim());
  return m ? `#${m[1].toUpperCase()}` : fallback;
}

function invalid(message) {
  return new Error(`TEN_FRAME_INVALID: ${message}`);
}

function normalise(spec = {}) {
  // A designer who last drew a ten frame as a fraction grid writes `shaded`.
  const first = [spec.count, spec.counters, spec.filled, spec.shaded].find((v) => v != null);
  const count = wholeNumber(first);
  const second = wholeNumber(spec.second);
  const crossedOut = wholeNumber(spec.crossedOut);
  if (!(count >= 0)) throw invalid(`\`count\` is how many counters the frame holds, a whole number (got ${JSON.stringify(first)}).`);
  if (!(second >= 0)) throw invalid(`\`second\` is how many counters are in the second colour, a whole number (got ${JSON.stringify(spec.second)}).`);
  const total = count + second;
  const needed = Math.max(1, Math.ceil(total / PER_FRAME));
  const stated = spec.frames == null ? null : wholeNumber(spec.frames);
  if (stated != null && !(stated >= 1 && stated <= MAX_FRAMES)) {
    throw invalid(`\`frames\` is 1, or 2 for the pair that shows numbers to 20 (got ${JSON.stringify(spec.frames)}).`);
  }
  const frames = stated || needed;
  if (needed > MAX_FRAMES || total > frames * PER_FRAME) {
    throw invalid(
      `${total} counters do not fit ${frames === 1 ? 'one ten frame' : 'a pair of ten frames'}. ` +
        (frames === 1 && needed <= MAX_FRAMES ? 'Set `frames` to 2 for a number past ten.' : 'A pair holds 20; a bigger number is base-ten blocks or a place value chart.')
    );
  }
  if (!(crossedOut >= 0) || crossedOut > total) {
    throw invalid(`\`crossedOut\` crosses out the last counters on the frame, so it is a whole number no bigger than the ${total} shown.`);
  }
  const look = String(spec.look == null ? 'counters' : spec.look).toLowerCase();
  if (!['counters', 'boxes'].includes(look)) {
    throw invalid(`look ${JSON.stringify(spec.look)} is not one this draws; use "counters" or "boxes".`);
  }
  const parts = HIGHLIGHT_PARTS.filter((p) => (p.key === 'counters' ? count > 0 : p.key === 'second' ? second > 0 : total < frames * PER_FRAME));
  const marked = [...highlight.resolveHighlight(spec, parts, 'ten frame')].sort();
  return {
    count,
    second,
    frames,
    look,
    crossedOut,
    colour: hexOf(spec.colour, COUNTER_RED),
    secondColour: hexOf(spec.secondColour, COUNTER_YELLOW),
    highlight: marked,
  };
}

function resolveProfile(profileOrSurface, box) {
  return typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
}

function strokes(T, cell = 0) {
  return {
    outline: Math.max(MIN_STROKE_PT * 1.5, OUTLINE * T, OUTLINE_OF_CELL * cell),
    divider: Math.max(MIN_STROKE_PT, DIVIDER * T, DIVIDER_OF_CELL * cell),
  };
}

// The side of a box when the frames sit `across` by `down`, in the room given.
function cellFor(across, down, W, H, natural, outline) {
  const wide = (W - outline) / (across * COLS + (across - 1) * FRAME_GAP);
  const tall = H ? (H - outline) / (down * ROWS + (down - 1) * FRAME_GAP) : Infinity;
  return Math.min(natural, wide, tall);
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const W = profile.widthPt;
  const H = profile.heightPt; // only the board has one
  const T = profile.fontPt;
  const natural = CELL * T * (H ? profile.grow || 1 : 1);
  const smallest = Math.max(MIN_CELL_PT, MIN_CELL * profile.minFontPt);

  // One frame, or a pair. The arrangement depends only on the room and on how
  // many frames there are, never on what they hold, so a question and its
  // answers lay out alike.
  const arrange = (outline) => {
    const side = cellFor(n.frames, 1, W, H, natural, outline);
    if (n.frames === 1) return { across: 1, down: 1, cell: side };
    const stacked = cellFor(1, n.frames, W, H, natural, outline);
    const squeezed = H ? stacked > side * 1.001 : side < SIDE_BY_SIDE_FLOOR * smallest && stacked > side * 1.001;
    return squeezed ? { across: 1, down: n.frames, cell: stacked } : { across: n.frames, down: 1, cell: side };
  };
  // The lines take their weight from the box, and the box its size from the
  // room the lines leave, so the box is found once more with the lines known.
  const st = strokes(T, arrange(strokes(T).outline).cell);
  const half = st.outline / 2;
  const { across, down, cell } = arrange(st.outline);
  if (cell < smallest) {
    throw new Error(
      `TEN_FRAME_TOO_SMALL: ${n.frames === 1 ? 'a ten frame' : 'a pair of ten frames'} cannot show its boxes in this space on this surface. ` +
        'Give the picture more room; the boxes were not squeezed until a counter could not be seen in them.'
    );
  }

  const frameW = COLS * cell;
  const frameH = ROWS * cell;
  const frames = [];
  for (let f = 0; f < n.frames; f += 1) {
    const fx = half + (across > 1 ? f * (frameW + FRAME_GAP * cell) : 0);
    const fy = half + (down > 1 ? f * (frameH + FRAME_GAP * cell) : 0);
    const cells = [];
    for (let k = 0; k < PER_FRAME; k += 1) {
      const index = f * PER_FRAME + k;
      const total = n.count + n.second;
      const state = index < n.count ? 'counters' : index < total ? 'second' : 'empty';
      cells.push({
        x: fx + (k % COLS) * cell,
        y: fy + Math.floor(k / COLS) * cell,
        w: cell,
        h: cell,
        state,
        crossed: index < total && index >= total - n.crossedOut,
      });
    }
    frames.push({ x: fx, y: fy, w: frameW, h: frameH, cells });
  }
  const last = frames[frames.length - 1];
  return {
    ...n,
    w: last.x + frameW + half,
    h: last.y + frameH + half,
    cell,
    arrangement: across > 1 ? 'side by side' : n.frames > 1 ? 'stacked' : 'single',
    frameList: frames,
    strokes: st,
    profile,
  };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { profile, strokes: st, cell } = L;
  const ink = profile.palette === 'ink';
  const line = ink ? LINE.ink : LINE.colour;
  const paper = profile.colours.paper;
  // Photocopied: a dark and a light grey for counters, and one step lighter
  // for coloured-in boxes, so the lines between them and a pencil still show.
  const inkFills = L.look === 'boxes' ? { counters: INK_TONES.mid, second: INK_TONES.pale } : { counters: INK_TONES.dark, second: INK_TONES.light };
  const fills = ink ? inkFills : { counters: L.colour, second: L.secondColour };
  const marked = new Set(L.highlight);
  const long = Math.max(L.w, L.h);
  const parts = [];
  const rings = [];

  L.frameList.forEach((frame) => {
    frame.cells.forEach((c) => {
      const full = c.state !== 'empty';
      const fade = highlight.opacityFor(marked, c.state);
      const faded = fade < 1 ? ` opacity="${fade}"` : '';
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      // The boxes still to fill are a region, so pointing at them tints them
      // rather than ringing each one.
      const ground = !full && marked.has('empty') ? (ink ? INK_TONES.pale : HIGHLIGHT_TINT) : paper;
      if (full && L.look === 'boxes') {
        parts.push(`<rect x="${f2(c.x)}" y="${f2(c.y)}" width="${f2(c.w)}" height="${f2(c.h)}" fill="${paper}"/>`);
        parts.push(`<rect x="${f2(c.x)}" y="${f2(c.y)}" width="${f2(c.w)}" height="${f2(c.h)}" fill="${fills[c.state]}"${faded}/>`);
      } else {
        parts.push(`<rect x="${f2(c.x)}" y="${f2(c.y)}" width="${f2(c.w)}" height="${f2(c.h)}" fill="${ground}"/>`);
      }
      if (full && L.look === 'counters') {
        const r = COUNTER_R * cell;
        parts.push(
          `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${fills[c.state]}" stroke="${line}" stroke-width="${f2(Math.max(MIN_STROKE_PT, COUNTER_EDGE * cell))}"${faded}/>`
        );
        rings.push(highlight.ringCircleSvg(marked, c.state, { x: cx, y: cy }, r, long, ink));
      }
      if (c.crossed) {
        const d = CROSS_REACH * cell;
        const stroke = `stroke="${ink ? INK_TONES.ink : '#000000'}" stroke-width="${f2(Math.max(MIN_STROKE_PT * 1.5, CROSS * cell))}" stroke-linecap="round"${faded}`;
        parts.push(`<line x1="${f2(cx - d)}" y1="${f2(cy - d)}" x2="${f2(cx + d)}" y2="${f2(cy + d)}" ${stroke}/>`);
        parts.push(`<line x1="${f2(cx - d)}" y1="${f2(cy + d)}" x2="${f2(cx + d)}" y2="${f2(cy - d)}" ${stroke}/>`);
      }
    });
    for (let c = 1; c < COLS; c += 1) {
      const x = frame.x + c * cell;
      parts.push(`<line x1="${f2(x)}" y1="${f2(frame.y)}" x2="${f2(x)}" y2="${f2(frame.y + frame.h)}" stroke="${line}" stroke-width="${f2(st.divider)}"/>`);
    }
    for (let r = 1; r < ROWS; r += 1) {
      const y = frame.y + r * cell;
      parts.push(`<line x1="${f2(frame.x)}" y1="${f2(y)}" x2="${f2(frame.x + frame.w)}" y2="${f2(y)}" stroke="${line}" stroke-width="${f2(st.divider)}"/>`);
    }
    parts.push(`<rect x="${f2(frame.x)}" y="${f2(frame.y)}" width="${f2(frame.w)}" height="${f2(frame.h)}" fill="none" stroke="${line}" stroke-width="${f2(st.outline)}"/>`);
  });

  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}${rings.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  return `ten-frame:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

// The narrowest a frame, or a pair side by side, may print on a surface.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets', cellPt) {
  const profile = resolveProfile(profileOrSurface, { widthPt: 2000 });
  normalise(spec);
  const cell = cellPt || Math.max(MIN_CELL_PT, MIN_CELL * profile.minFontPt);
  return COLS * cell + strokes(profile.fontPt).outline + 0.5;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt, PER_FRAME, MAX_FRAMES };
