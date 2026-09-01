'use strict';

// SHARED "point at this part" layer for the figures the engine DRAWS.
//
// A teacher at the board points at part of the picture while they talk: this
// bar, the overlap, that cell, this row. Before this module, six figures had
// grown a way to do it and each had invented its own word - the map called it
// `annotations`, the grid map `highlightSquare`, the rainforest layers
// `highlight`, the geoboard `emphasiseVertices` - and the other fifty could not
// be pointed at all. One idea, six spellings, fifty gaps.
//
// ── The distinction this module exists to hold ──────────────────────────────
//
// There are two ways to mark a picture and they must not be confused.
//
//   POSITIONAL. The picture is fixed and real - a map, a photograph - so a mark
//   is placed AT A POSITION and the position means something. That belongs to
//   map-annotations.js, where a point can be given in real degrees.
//
//   SEMANTIC. The picture is drawn from the lesson's own data, so a position
//   means nothing: the figure is laid out at render time and moves whenever the
//   data does. Here a mark NAMES A PART - "the tallest bar", "the overlap",
//   "the tens column" - and the figure works out where that part currently is.
//   That is this module.
//
// Using a position on a drawn figure is the failure to avoid. A ring placed 40%
// across a bar chart looks right, and then somebody changes a value, the bars
// re-scale, and the ring is round the wrong bar with nothing anywhere saying so.
// Naming the part cannot drift, because the figure resolves the name every time
// it draws.
//
// ── The treatment ───────────────────────────────────────────────────────────
//
// One look, every figure, so a class learns to read it once: the named parts get
// a ring in the house highlight colour, and everything else fades back. The
// fade is what makes it carry to the back of the room - a ring alone competes
// with every other line in the drawing - and it is why this is a shared
// treatment rather than each figure choosing.

const RING = 'C65911';        // house highlight, the same orange a map mark uses
const RING_WIDTH = 0.012;     // ring stroke, as a share of the figure's long side
const RING_PAD = 0.35;        // ring clearance round the part, in multiples of stroke
const DIMMED = 0.28;          // opacity of everything not highlighted
const RING_MIN = 2.5;         // stroke floor in drawing units, so a small figure still rings

// Everything but the letters and digits goes, so the one part answers to every
// spelling of its own name: `topLeft`, `top-left` and `Top Left` are one place
// on the grid, and a category called "Year 3" is found whether or not somebody
// typed the space.
function normalise(value) {
  return String(value == null ? '' : value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Resolve a figure's `highlight` field against the parts that figure actually
// has. Returns a Set of canonical part keys, empty when nothing was asked for.
//
// `parts` is what the figure declares it can be pointed at: an array of strings,
// or of { key, aliases } when a part is known by more than one name (a bar is
// found by its label, a Venn region by "overlap" or "both").
//
// An unknown name is refused rather than ignored, and the refusal lists the
// parts that exist. A highlight silently dropped is the whole failure this
// package keeps meeting: the slide renders, looks deliberate, and points at
// nothing.
function resolveHighlight(data, parts, figureName) {
  const raw = data && data.highlight;
  if (raw === undefined || raw === null || raw === false) return new Set();

  const asked = Array.isArray(raw) ? raw : [raw];
  if (!asked.length) return new Set();

  const known = new Map();
  const display = [];
  (parts || []).forEach(function (part) {
    const key = typeof part === 'string' ? part : part && part.key;
    if (key == null) return;
    display.push(String(key));
    known.set(normalise(key), String(key));
    const aliases = (part && part.aliases) || [];
    aliases.forEach(function (alias) { known.set(normalise(alias), String(key)); });
  });

  if (!known.size) {
    throw new Error(
      'FIGURE_HIGHLIGHT_UNSUPPORTED: a ' + figureName + ' has no named parts to point at, ' +
        'so it cannot carry a highlight.'
    );
  }

  const resolved = new Set();
  asked.forEach(function (item) {
    if (typeof item !== 'string' && typeof item !== 'number') {
      throw new Error(
        'FIGURE_HIGHLIGHT_INVALID: a ' + figureName + ' highlight names a part in words; received ' +
          JSON.stringify(item) + '.'
      );
    }
    const key = known.get(normalise(item));
    if (!key) {
      throw new Error(
        'FIGURE_HIGHLIGHT_UNKNOWN: ' + JSON.stringify(String(item)) + ' is not a part of this ' +
          figureName + '. Its parts are: ' + display.join(', ') + '.'
      );
    }
    resolved.add(key);
  });

  // Everything highlighted is nothing highlighted: the fade has nothing left to
  // push back, so the slide reads exactly as it would with no highlight at all
  // while claiming to point somewhere.
  if (resolved.size === display.length && display.length > 1) {
    throw new Error(
      'FIGURE_HIGHLIGHT_INVALID: every part of this ' + figureName + ' is highlighted, which points at ' +
        'nothing. Highlight the parts the teaching is about, or leave the field off.'
    );
  }
  return resolved;
}

// The opacity a part is drawn at. One call at the top of each part's draw.
function opacityFor(highlighted, key) {
  if (!highlighted || !highlighted.size) return 1;
  return highlighted.has(key) ? 1 : DIMMED;
}

// The ring round a highlighted part, given the box that part occupies in the
// figure's own drawing units. Returns '' when this part is not highlighted, so a
// figure can call it unconditionally.
function ringSvg(highlighted, key, box, longSide) {
  if (!highlighted || !highlighted.has(key)) return '';
  const stroke = Math.max(RING_MIN, longSide * RING_WIDTH);
  const pad = stroke * RING_PAD;
  const x = box.x - pad;
  const y = box.y - pad;
  const w = box.w + pad * 2;
  const h = box.h + pad * 2;
  const radius = Math.min(w, h) * 0.14;
  return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) +
    '" height="' + h.toFixed(1) + '" rx="' + radius.toFixed(1) + '" fill="none" stroke="#' + RING +
    '" stroke-width="' + stroke.toFixed(1) + '"/>';
}

// The same ring round a round part (a pictogram symbol, a plotted point).
function ringCircleSvg(highlighted, key, centre, r, longSide) {
  if (!highlighted || !highlighted.has(key)) return '';
  const stroke = Math.max(RING_MIN, longSide * RING_WIDTH);
  return '<circle cx="' + centre.x.toFixed(1) + '" cy="' + centre.y.toFixed(1) + '" r="' +
    (r + stroke * RING_PAD * 2).toFixed(1) + '" fill="none" stroke="#' + RING +
    '" stroke-width="' + stroke.toFixed(1) + '"/>';
}

module.exports = {
  RING,
  DIMMED,
  resolveHighlight,
  opacityFor,
  ringSvg,
  ringCircleSvg
};
