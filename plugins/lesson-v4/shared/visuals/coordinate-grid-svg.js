'use strict';

// SHARED coordinate-grid geometry: the single source of truth for a NUMBERED
// coordinate grid, the way children in Years 3 to 6 meet it: squared paper with both
// axes through (0,0). A first-quadrant grid (Years 3 to 5) is numbered along the
// bottom and up the left; a FOUR-QUADRANT grid (Year 6) carries each axis on
// through zero as a number line, numbered just below the x-axis and just left of
// the y-axis, negatives with a true minus sign. Imported by every engine that
// draws it (slides, worksheets, working wall, stick-in pack). This module
// produces ONLY the SVG and its true aspect, so each engine places it tight (NO
// DEADSPACE): the canvas is cropped to what is drawn, no padded square.
//
//   tightSvg(spec, profile) → { svg, aspect, w, h }   cropped tight to the ink
//   cacheKey(spec, profile) → string                  stable pre-render cache key
//   describeLayout(spec, profile) → where every number, letter and mark landed,
//                                   and the size the numbers print at
//   gridSpan(spec)          → { cols, rows }  squares across and up, both sides of zero
//   pickSpec(spec)          → the spec, cut to the fields this drawing reads
//
// The squares are laid out in the drawing's own units and scaled by whoever
// places it, but the WORDS are sized for where they are read. A surface that
// says how big the grid will print (a profile carrying `widthPt`, from
// surface-profiles.js) gets axis numbers and letters at that surface's reading
// size, or as near to it as one square will hold, and the picture comes back
// sized in points to fit that box. Before this every number was a fixed third
// of a square, so a ten-square grid on the board carried its numbers at 8 to
// 9pt (stress test, 7 October 2026). With no box the grid draws as it always
// did, which is what the tiny Success Criteria treatment uses.
//
// Coordinates run x ACROSS and y UP, the way a child plots. Gridlines sit at
// every whole position, cells are always square, the two axes are drawn bold and
// the rest pale, like squared paper.
//
// Spec, the grid:
//   cols / rows   squares to the RIGHT of and ABOVE zero (default 10, rows = cols)
//   max           slide shorthand for both; xMax / yMax set them separately
//   min           how far both axes run the other side of zero, written as the
//                 negative number they start at (-5). xMin / yMin set them
//                 separately. Default 0: the first-quadrant grid.
//   numbers       true (default) every whole number on both axes
//                 "positive"  0 and upwards only: the negative parts keep their
//                             marks and lose their numbers (the "what goes here?"
//                             picture)
//                 false       no numbers at all
//   axisLabels    true = "x" and "y" at the positive end of each axis; an object
//                 { x: "x-axis", y: "y-axis" } writes those words instead; false
//                 = none. Default: on for a grid that runs below zero, off for a
//                 first-quadrant grid (which never carried them).
//   grid          false leaves the squared paper off: two bare axes with a mark
//                 at every whole number
//   ticks         a short mark across each axis at every whole number. Default:
//                 on for a grid that runs below zero or has no squared paper.
//   tintQuadrants true tints each quadrant its own pale colour
//   quadrantNotes { "top right": "x and y both positive", … } a few words set
//                 inside a quadrant with nothing plotted in it. Quadrants answer
//                 to "top right" / "top left" / "bottom left" / "bottom right"
//                 or "first quadrant" … "fourth quadrant".
//   highlight     a part or parts to point at, by name: a quadrant, "x-axis",
//                 "y-axis", "origin", or a plotted point's own letter. See
//                 figure-highlight.js for the treatment.
//
// Spec, what is plotted:
//   points        [{ x, y, label, coords }] loose plotted points. `label` is the
//                 letter beside the mark; `coords: true` writes the point's own
//                 coordinates after it, "F (−5, −1)".
//   pointStyle    "dot" (default) or "cross", the small × a child plots with
//   join          true = join `points` in order into a closed shape
//   shapes        [{ points, labels, inside, image, marks, translate, showImage,
//                    arrow, arrowFrom, imageLabels }] whole shapes, each joined
//                 from its own vertices:
//                   points      [[x, y], …] or [{ x, y, label }, …]
//                   labels      ["A", "B", "C"] vertex letters, in order
//                   inside      a few characters written inside the shape ("1")
//                   image       true draws this shape as an IMAGE: lighter, with
//                               a dashed outline
//                   marks       "dot" | "cross" | "none" on each vertex. Default:
//                               the grid's pointStyle when vertices are lettered
//                   translate   { dx, dy } the slide in squares (right and up
//                               positive). With showImage: true the image is
//                               drawn every vertex shifted by exactly this, so it
//                               cannot come out a different shape.
//                   arrow       with an image shown: the dashed arrow from one
//                               vertex to its match (default true; "steps" draws
//                               it across then up; false leaves it off)
//                   arrowFrom   which vertex the arrow springs from (default 0)
//                   imageLabels letters for the image's vertices
//   arrows        [{ from: [x, y], to: [x, y], steps, count }] a dashed arrow
//                 between two places on the grid. `steps: true` draws it as two
//                 legs, across then up or down; `count: true` writes how many
//                 squares each leg is ("6 right", "5 down").
//   route         [x, y] the solid across-then-up plotting route from the origin
//                 to a point. Used full-size for modelling and number-free for
//                 the small Success Criteria Helper treatment.
//
// Spec, what is the answer. On an answers slide the grid itself shows which
// marks are the answer, in the package's answer green, as every other drawing
// does (14 October 2026: the answer text beside the grid was green while the
// points it named stayed red). Each is set on the thing it marks:
//   points[i].answer   true: the point, its letter and its coordinates are the
//                      answer (the child plotted it). "coordinates": the point
//                      was given and only the coordinates written after it are
//                      the answer, so its letter keeps the point colour.
//   shapes[i].answer   true: the whole shape (outline, fill, vertex marks and
//                      letters) is the answer, as when the child plots and joins it.
//   shapes[i].imageAnswer  true: the translated image, its letters and the
//                      arrow to it are the answer; the shape it came from was given.
//   arrows[i].answer   true: the path and its counted words are the answer
//                      ("which translation moved shape 1 onto shape 2?").
// Green on the board and the wall. A pupil sheet and the stick-in pack are what
// a child fills in, so every answer is left off there and the grid draws the
// question; the teacher's answer sheet asks for them (`answers: "show"` on the
// profile) and draws them green.
//   roomFor       the plotted content of the other slides this grid shares a
//                 place with. The board sets it, never a designer: a question
//                 slide and its answers slide are one grid to the class, so each
//                 keeps the room any of them needs and the grid neither shrinks
//                 nor moves when the answers arrive (grids-stand-still.js).
//
// A point, a vertex or an arrow end that is not on the grid is refused by name
// rather than drawn in the margin: on a grid that starts at zero, (−4, 3) used
// to land in the gutter, which is the picture this module was grown to fix.

const { textWidthEm } = require('../text/comic-glyph-width');
const { INK_TONES, PROFILES, PALETTES, printsInInk } = require('./surface-profiles');
const figureHighlight = require('./figure-highlight');

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ──────
const CELL          = 100;          // side of one grid square

const LEFT_GUTTER   = CELL * 0.62;  // room for the up-axis numbers on the side
const BOTTOM_GUTTER = CELL * 0.58;  // room for the across-axis numbers along the base
const MARGIN_TOP    = CELL * 0.30;  // breathing room so the top line/number isn't clipped
const MARGIN_RIGHT  = CELL * 0.30;  // breathing room so the right line/number isn't clipped
const INK_MARGIN    = CELL * 0.06;  // hair of air round anything that reaches past the frame

const GRID_W        = CELL * 0.020; // pale squared-paper gridline stroke
const AXIS_W        = CELL * 0.045;  // bold origin-axis stroke
const TICK_HALF     = CELL * 0.085; // how far a tick reaches each side of its axis
const TICK_W        = CELL * 0.035; // tick stroke
const POINT_R       = CELL * 0.055; // plotted-dot radius
const CROSS_R       = CELL * 0.105; // half the width of a plotted cross
const CROSS_W       = CELL * 0.038; // cross stroke
const SHAPE_W       = CELL * 0.030; // joined-shape outline stroke

const GRID_COLOUR   = '#AAB7C4';    // pale squared-paper lines
const AXIS_COLOUR   = '#333333';    // bold origin axes
const NUM_COLOUR    = '#1A1A1A';    // axis numbers: DARK, legible on white paper
const NUM_FONT      = CELL * 0.34;  // axis-number font size
const NUM_GAP       = CELL * 0.09;  // air between an axis and the numbers beside it
const HALO_W        = CELL * 0.08;  // paper-coloured edge behind a number that sits on the squares
const POINT_COLOUR  = '#C00000';    // plotted points in red so they pop off the grid
const SHAPE_OUTLINE = '#0070C0';    // joined-shape outline (house blue)
const SHAPE_FILL    = '#CCE2F5';    // joined-shape fill (pale blue)
const IMG_OUTLINE   = '#4D94D6';    // image outline (lighter blue, dashed), as translation-shape draws it
const IMG_FILL      = '#EAF3FB';    // image fill (very pale blue)
const IMG_DASH      = CELL * 0.11;  // image outline dash length
const IMG_GAP       = CELL * 0.08;  // image outline dash gap
const LABEL_COLOUR  = '#C00000';    // point-letter colour (matches the dot)
const ROUTE_COLOUR  = '#0070C0';    // across-then-up modelling route
// A translation's path, and the words that count it, in the orange the success
// criteria use for "left or right" and "up or down", so the words on the board
// and the arrow on the grid match. It was a thin grey dashed line, which did
// not read from the back of the room (14 October 2026).
const MOVE_COLOUR   = '#E46C0A';
const ANSWER_COLOUR = PALETTES.colour.answer; // the board's answer green
const ANSWER_FILL   = '#D3F0DE';    // an answer shape's fill: the green, paled like the blue
const ANSWER_IMG_FILL = '#E8F7EE';  // an answer image's fill, paler still, as the image's blue is
const PAPER         = '#FFFFFF';
const NOTE_COLOUR   = '#333333';    // the few words inside a quadrant
const HIGHLIGHT_FILL = '#F6D3BC';   // a highlighted quadrant: the house highlight, as a wash
// One pale tint per quadrant, in the order a child counts them (anticlockwise
// from the top right): blue, green, amber, lilac.
const QUADRANT_TINTS = { topRight: '#DDEBFA', topLeft: '#DFF2DC', bottomLeft: '#FCEBCF', bottomRight: '#EEE2F6' };

// The photocopied pack's version: pale grey squared paper under dark axes, and
// plotted points and their letters in ink, which stand out from a pale grid
// as well as red does. The image keeps its dashed outline and takes the paler
// fill, so it still reads apart from the shape it came from; the four quadrant
// tints become four greys, each beside a neighbour it differs from.
const INK = {
  grid: INK_TONES.light, axis: INK_TONES.ink, num: INK_TONES.ink, point: INK_TONES.ink, outline: INK_TONES.ink, fill: INK_TONES.pale,
  imgOutline: INK_TONES.dark, imgFill: '#F2F2F2', label: INK_TONES.ink, route: INK_TONES.dark, move: INK_TONES.dark,
  paper: PAPER, note: INK_TONES.ink, highlightFill: '#B3B3B3',
  answer: INK_TONES.ink, answerFill: INK_TONES.pale, answerImgFill: '#F2F2F2',
  tints: { topRight: '#F4F4F4', topLeft: '#CFCFCF', bottomLeft: '#E9E9E9', bottomRight: '#DBDBDB' }
};
const COLOURS = {
  grid: GRID_COLOUR, axis: AXIS_COLOUR, num: NUM_COLOUR, point: POINT_COLOUR, outline: SHAPE_OUTLINE, fill: SHAPE_FILL,
  imgOutline: IMG_OUTLINE, imgFill: IMG_FILL, label: LABEL_COLOUR, route: ROUTE_COLOUR, move: MOVE_COLOUR,
  paper: PAPER, note: NOTE_COLOUR, highlightFill: HIGHLIGHT_FILL,
  answer: ANSWER_COLOUR, answerFill: ANSWER_FILL, answerImgFill: ANSWER_IMG_FILL,
  tints: QUADRANT_TINTS
};
const ROUTE_W       = CELL * 0.055; // heavier than the grid so it survives inline
const MOVE_W        = CELL * 0.060; // a translation's path: solid, as firm as the plotting route
const MOVE_HEAD_L   = CELL * 0.34;  // arrowhead length
const MOVE_HEAD_W   = CELL * 0.30;  // arrowhead width
const AXIS_GLOW_W   = CELL * 0.16;  // the wash under a highlighted axis
const LABEL_FONT    = CELL * 0.40;  // point-letter font size
const LABEL_OFF     = CELL * 0.10;  // label offset from the dot
const COUNT_FONT    = CELL * 0.32;  // "6 right" beside a leg of a stepped arrow
const AXIS_NAME_FONT = CELL * 0.40; // "x" and "y" at the ends of the axes
const AXIS_NAME_GAP = CELL * 0.12;  // air between the end of an axis and its name
const INSIDE_FONT   = CELL * 0.46;  // a numeral written inside a shape, at its largest
const INSIDE_FLOOR  = CELL * 0.28;  // … and the smallest it may shrink to before it moves outside
const NOTE_FONT     = CELL * 0.34;  // quadrant note, at its largest
const NOTE_FLOOR    = CELL * 0.24;  // … and its readable floor
const NOTE_LINE     = 1.22;         // quadrant-note line height, in ems
const NOTE_PAD      = CELL * 0.16;  // air between a note and the edge of its quadrant
const FIT_STEP      = CELL * 0.02;  // how finely a shrinking text steps down
const INSIDE_STEP   = 0.25;         // how finely a shape is searched for room, in squares
// How much of a line of bold Comic Sans sits above and below its baseline, in
// ems: the box a letter or a bracketed pair really inks.
const ASCENT        = 0.80;
const DESCENT       = 0.22;
// What a label position costs, so a letter goes where it covers least. Units
// are drawing-unit areas, so the weights are comparable with each other.
const COST_RANK     = 1;            // each step down the preferred order
const COST_OUTSIDE  = 0.05;         // per unit² hanging outside the squared paper
const COST_AXIS     = 4;            // per unit² lying over an axis
const COST_NUMBER   = 5;            // per unit² lying over an axis number or name
const COST_STRIP    = 1.5;          // per unit² lying in the row or column the axis numbers run along
const COST_TEXT     = 8;            // per unit² lying over another letter or a mark
const COST_EDGE     = 420;          // crossing a shape's edge or an arrow
const COST_INSIDE   = 260;          // each corner of a vertex letter inside its own shape
const COST_ON_SHAPE = 150;          // words that are not a shape's own, written over a shape
const LEG_SPOTS     = [0.5, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85, 0.1, 0.9]; // where along a leg its count may sit, in order of preference
// How far the words may grow to reach a surface's reading size. An axis number
// stops at this share of a square's side, and at this share of the gap to the
// next number along the axis, so two neighbours never touch.
const NUM_FONT_MAX  = CELL * 0.62;
const NUM_WIDTH_MAX = CELL * 0.86;
// Where the axes cross, the shared 0 sits just left of the y-axis and so beside
// the number before it. They keep this much air between them, in ems, or
// "-1" and "0" read as one number.
const ORIGIN_AIR_EM = 0.45;
const MARK_GROW_MAX = 1.5;          // dots and crosses grow with the words, this far
const FONT = 'Comic Sans MS, Comic Sans, Chalkboard SE, sans-serif';
const MINUS = '−';             // a true minus sign, the width of a digit
// Every field this drawing reads, so a surface that hands over a cut-down spec
// (the worksheet does) cannot drop one.
const SPEC_FIELDS = [
  'cols', 'rows', 'max', 'xMax', 'yMax', 'min', 'xMin', 'yMin', 'numbers', 'axisLabels', 'grid', 'ticks',
  'tintQuadrants', 'quadrantNotes', 'highlight', 'points', 'pointStyle', 'join', 'shapes', 'arrows', 'route', 'roomFor'
];
// What is plotted, as opposed to the grid it is plotted on: the part of a spec
// one slide's grid keeps room for on behalf of another (`roomFor`).
const PLOTTED_FIELDS = ['points', 'pointStyle', 'join', 'shapes', 'arrows', 'route'];
// Fields added when the grid grew past the first quadrant. A spec that uses none
// of them keeps the cache key it always had.
const FRAME_FIELDS = ['cols', 'rows', 'max', 'xMax', 'yMax', 'min', 'xMin', 'yMin', 'numbers', 'axisLabels', 'grid', 'ticks'];
const GROWN_FIELDS = ['min', 'xMin', 'yMin', 'axisLabels', 'grid', 'ticks', 'tintQuadrants', 'quadrantNotes', 'highlight', 'pointStyle', 'shapes', 'arrows', 'roomFor'];
const QUADRANTS = [
  { key: 'top right',    id: 'topRight',    aliases: ['topRight', 'first quadrant', 'first', '1st quadrant', 'quadrant 1'] },
  { key: 'top left',     id: 'topLeft',     aliases: ['topLeft', 'second quadrant', 'second', '2nd quadrant', 'quadrant 2'] },
  { key: 'bottom left',  id: 'bottomLeft',  aliases: ['bottomLeft', 'third quadrant', 'third', '3rd quadrant', 'quadrant 3'] },
  { key: 'bottom right', id: 'bottomRight', aliases: ['bottomRight', 'fourth quadrant', 'fourth', '4th quadrant', 'quadrant 4'] }
];
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function clampInt(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : dflt;
}

function f(n) { return n.toFixed(2); }

function textWidth(text, font) {
  return textWidthEm(String(text), true) * font;
}

// A number as a child reads it on an axis: a true minus sign, never a hyphen.
function numText(n) {
  const v = Math.round(Number(n) * 100) / 100;
  return v < 0 ? MINUS + String(Math.abs(v)) : String(Math.abs(v));
}

function pairText(p) {
  return '(' + numText(p.x) + ', ' + numText(p.y) + ')';
}

function filled(value) {
  return value != null && String(value).trim().length > 0;
}

function resolvePoints(data) {
  return Array.isArray(data && data.points) ? data.points : [];
}

// A point written { x, y, label } or as the terse pair [x, y] (with an optional
// third entry for its letter), the two spellings the grids already share.
function toPoint(p) {
  if (Array.isArray(p)) return { x: Number(p[0]), y: Number(p[1]), label: p[2], coords: false, answer: false };
  if (!p || typeof p !== 'object') return null;
  return { x: Number(p.x), y: Number(p.y), label: p.label, coords: p.coords === true, answer: resolveAnswer(p.answer) };
}

// What of a point is the answer: all of it (true), only the coordinates
// written after it ("coordinates"), or nothing (false).
function resolveAnswer(value) {
  if (value === true) return true;
  if (typeof value === 'string' && /^coord/i.test(value.trim())) return 'coordinates';
  return false;
}

// Whether the answers are drawn on this surface. The board and the wall show
// them; a pupil sheet and the photocopied pack are the child's to fill in, so
// they are left off unless the surface asks for them (the teacher's answer
// sheet sets `answers: "show"`).
function answersShown(profile) {
  if (!profile || typeof profile !== 'object') return true;
  if (profile.answers === 'show') return true;
  if (profile.answers === 'hide') return false;
  return profile.palette !== 'sheet' && profile.palette !== 'ink';
}

// The question a grid asks: the same grid with every answer taken off. A point
// that is the answer goes; one whose coordinates are the answer keeps its
// letter and loses them; an answer shape goes; an image that is the answer is
// no longer shown; an answer path goes.
function withoutAnswers(data) {
  const out = Object.assign({}, data);
  const isAnswer = function (p) { return p && typeof p === 'object' && !Array.isArray(p) && resolveAnswer(p.answer) === true; };
  const askOnly = function (p) {
    if (!p || typeof p !== 'object' || Array.isArray(p) || resolveAnswer(p.answer) !== 'coordinates') return p;
    const kept = Object.assign({}, p, { coords: false });
    delete kept.answer;
    return kept;
  };
  if (Array.isArray(data.points)) out.points = data.points.filter(function (p) { return !isAnswer(p); }).map(askOnly);
  if (Array.isArray(data.shapes)) {
    out.shapes = data.shapes.filter(function (s) { return !(s && s.answer === true); }).map(function (s) {
      if (!s || typeof s !== 'object') return s;
      const one = Object.assign({}, s);
      if (one.imageAnswer === true) { delete one.imageAnswer; one.showImage = false; }
      const source = Array.isArray(one.points) ? 'points' : Array.isArray(one.vertices) ? 'vertices' : null;
      if (source) one[source] = one[source].filter(function (p) { return !isAnswer(p); }).map(askOnly);
      return one;
    });
  }
  if (Array.isArray(data.arrows)) out.arrows = data.arrows.filter(function (a) { return !(a && a.answer === true); });
  delete out.roomFor;
  return out;
}

function usable(p) {
  return Boolean(p) && Number.isFinite(p.x) && Number.isFinite(p.y);
}

function resolveGridSize(data) {
  data = data || {};
  // `cols`/`rows` are the shared SVG names. `max`/`xMax`/`yMax` are the
  // established slide-JSON names; accepting both lets the slide renderer use
  // this shared geometry without rewriting existing lesson files.
  const base = data.max != null
    ? clampInt(data.max, 10)
    : clampInt(data.cols, 10);
  return {
    cols: clampInt(data.xMax, clampInt(data.cols, base)),
    rows: clampInt(data.yMax, clampInt(data.rows, base))
  };
}

// How far an axis runs the other side of zero. The grid always includes (0,0),
// so this is zero or a negative whole number; a positive one is refused rather
// than guessed at, since "min: 5" could mean five below zero or a grid that
// starts at 5, and only one of those can be drawn.
function resolveMin(value, name) {
  if (value == null || value === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n > 0) {
    throw new Error(
      'COORDINATE_GRID_MIN_ABOVE_ZERO: ' + name + ' is ' + n + ', but both axes always pass through (0, 0), so it ' +
        'is zero or the negative number the axis starts at (for example -5).'
    );
  }
  return Math.round(n) || 0;
}

function resolveRange(data) {
  data = data || {};
  const size = resolveGridSize(data);
  return {
    xMin: resolveMin(data.xMin != null ? data.xMin : data.min, data.xMin != null ? 'xMin' : 'min'),
    xMax: size.cols,
    yMin: resolveMin(data.yMin != null ? data.yMin : data.min, data.yMin != null ? 'yMin' : 'min'),
    yMax: size.rows
  };
}

function gridSpan(data) {
  const r = resolveRange(data);
  return { cols: r.xMax - r.xMin, rows: r.yMax - r.yMin };
}

function pickSpec(spec) {
  const out = {};
  SPEC_FIELDS.forEach(function (name) {
    if (spec && spec[name] !== undefined) out[name] = spec[name];
  });
  return out;
}

function resolveRoute(data, range) {
  const raw = data && data.route;
  const x = Array.isArray(raw) ? Number(raw[0]) : Number(raw && raw.x);
  const y = Array.isArray(raw) ? Number(raw[1]) : Number(raw && raw.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.max(range.xMin, Math.min(range.xMax, x)), y: Math.max(range.yMin, Math.min(range.yMax, y)) };
}

function resolveNumbers(data) {
  if (data.numbers === false) return 'none';
  if (typeof data.numbers === 'string' && data.numbers.trim().toLowerCase() === 'positive') return 'positive';
  return 'all';
}

function resolveAxisNames(data, belowZero) {
  const raw = data.axisLabels;
  if (raw === false) return null;
  if (raw && typeof raw === 'object') {
    const x = filled(raw.x) ? String(raw.x).trim() : '';
    const y = filled(raw.y) ? String(raw.y).trim() : '';
    return x || y ? { x: x, y: y } : null;
  }
  if (raw === true || (raw == null && belowZero)) return { x: 'x', y: 'y' };
  return null;
}

function resolveMarkStyle(value, fallback) {
  const s = String(value == null ? '' : value).trim().toLowerCase();
  if (s === 'cross' || s === 'dot' || s === 'none') return s;
  return fallback;
}

function offGrid(p, range) {
  return p.x < range.xMin || p.x > range.xMax || p.y < range.yMin || p.y > range.yMax;
}

function refuseOffGrid(p, range, what) {
  if (!offGrid(p, range)) return;
  throw new Error(
    'COORDINATE_GRID_POINT_OFF_GRID: ' + what + ' ' + pairText(p) + ' is not on this grid, which runs ' +
      numText(range.xMin) + ' to ' + numText(range.xMax) + ' across and ' + numText(range.yMin) + ' to ' +
      numText(range.yMax) + ' up. Set min (or xMin / yMin) and max so the grid reaches it.'
  );
}

function resolveTranslate(raw) {
  if (raw == null) return null;
  const dx = Number(Array.isArray(raw) ? raw[0] : raw.dx);
  const dy = Number(Array.isArray(raw) ? raw[1] : raw.dy);
  return { dx: Number.isFinite(dx) ? dx : 0, dy: Number.isFinite(dy) ? dy : 0 };
}

// Every shape the grid carries, in the order they are drawn: the older
// `points` + `join` shape first, then each entry of `shapes`, each followed by
// its translated image when one is shown. Returns the arrows the images ask for
// alongside, so one list of arrows is drawn.
function resolveShapes(data, range, pointStyle) {
  const shapes = [];
  const arrows = [];
  const list = Array.isArray(data.shapes) ? data.shapes : [];
  list.forEach(function (raw, index) {
    if (!raw || typeof raw !== 'object') return;
    const source = Array.isArray(raw.points) ? raw.points : Array.isArray(raw.vertices) ? raw.vertices : [];
    const letters = Array.isArray(raw.labels) ? raw.labels : [];
    const points = source.map(toPoint).filter(usable).map(function (p, i) {
      return { x: p.x, y: p.y, label: filled(p.label) ? String(p.label) : filled(letters[i]) ? String(letters[i]) : '', coords: p.coords, answer: p.answer };
    });
    const name = 'shape ' + (index + 1);
    if (points.length < 2) {
      throw new Error(
        'COORDINATE_GRID_SHAPE_NEEDS_POINTS: ' + name + ' needs at least two vertices, each with a numeric x and y, to be drawn.'
      );
    }
    points.forEach(function (p) { refuseOffGrid(p, range, name + ' has a vertex at'); });
    const lettered = points.some(function (p) { return p.label || p.coords; });
    shapes.push({
      index: index,
      points: points,
      image: raw.image === true,
      answer: raw.answer === true,
      inside: filled(raw.inside) ? String(raw.inside).trim() : '',
      marks: resolveMarkStyle(raw.marks, lettered ? pointStyle : 'none')
    });

    const t = resolveTranslate(raw.translate);
    if (!t || raw.showImage !== true) return;
    const imageLetters = Array.isArray(raw.imageLabels) ? raw.imageLabels : [];
    const image = points.map(function (p, i) {
      return { x: p.x + t.dx, y: p.y + t.dy, label: filled(imageLetters[i]) ? String(imageLetters[i]) : '', coords: false, answer: false };
    });
    image.forEach(function (p) {
      if (!offGrid(p, range)) return;
      throw new Error(
        'COORDINATE_GRID_IMAGE_OFF_GRID: ' + name + ' translated by ' + pairText({ x: t.dx, y: t.dy }) +
          ' puts a vertex at ' + pairText(p) + ', which is off this grid (' + numText(range.xMin) + ' to ' +
          numText(range.xMax) + ' across, ' + numText(range.yMin) + ' to ' + numText(range.yMax) + ' up).'
      );
    });
    const imageAnswer = raw.imageAnswer === true || raw.answer === true;
    shapes.push({ index: index, points: image, image: true, answer: imageAnswer, inside: '', marks: 'none', imageOf: index });
    if (raw.arrow !== false && (t.dx !== 0 || t.dy !== 0)) {
      const at = Number.isFinite(Number(raw.arrowFrom)) ? Math.max(0, Math.min(points.length - 1, Math.round(Number(raw.arrowFrom)))) : 0;
      arrows.push({ from: points[at], to: image[at], steps: raw.arrow === 'steps', count: false, answer: imageAnswer });
    }
  });
  return { shapes: shapes, arrows: arrows };
}

function resolveArrows(data, range) {
  const list = Array.isArray(data.arrows) ? data.arrows : [];
  const out = [];
  list.forEach(function (raw, index) {
    if (!raw || typeof raw !== 'object') return;
    const from = toPoint(raw.from);
    const to = toPoint(raw.to);
    if (!usable(from) || !usable(to)) {
      throw new Error('COORDINATE_GRID_ARROW_NEEDS_ENDS: arrow ' + (index + 1) + ' needs a from and a to, each [x, y].');
    }
    refuseOffGrid(from, range, 'arrow ' + (index + 1) + ' starts at');
    refuseOffGrid(to, range, 'arrow ' + (index + 1) + ' ends at');
    if (from.x === to.x && from.y === to.y) return;
    out.push({ from: from, to: to, steps: raw.steps === true, count: raw.count === true, answer: raw.answer === true });
  });
  return out;
}

// ─── small geometry ─────────────────────────────────────────────────────────
function overlapArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function areaOutside(box, frame) {
  return box.w * box.h - overlapArea(box, frame);
}

function inPolygon(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

// Whether a segment passes through a box (Liang-Barsky clipping).
function segmentHitsBox(seg, box) {
  const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
  let t0 = 0, t1 = 1;
  const edges = [[-dx, seg.x1 - box.x], [dx, box.x + box.w - seg.x1], [-dy, seg.y1 - box.y], [dy, box.y + box.h - seg.y1]];
  for (let i = 0; i < edges.length; i++) {
    const p = edges[i][0], q = edges[i][1];
    if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 < t1;
}

// The balance point of a polygon, where a numeral written inside it belongs.
function centroid(poly) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const cross = poly[j].x * poly[i].y - poly[i].x * poly[j].y;
    a += cross; cx += (poly[j].x + poly[i].x) * cross; cy += (poly[j].y + poly[i].y) * cross;
  }
  if (Math.abs(a) < 1e-6) {
    return {
      x: poly.reduce(function (s, p) { return s + p.x; }, 0) / poly.length,
      y: poly.reduce(function (s, p) { return s + p.y; }, 0) / poly.length
    };
  }
  return { x: cx / (3 * a), y: cy / (3 * a) };
}

function edgesOf(poly) {
  return poly.map(function (p, i) {
    const q = poly[(i + 1) % poly.length];
    return { x1: p.x, y1: p.y, x2: q.x, y2: q.y };
  });
}

function textBox(left, baseline, width, font) {
  return { x: left, y: baseline - ASCENT * font, w: width, h: (ASCENT + DESCENT) * font };
}

function inset(box, by) {
  return { x: box.x + by, y: box.y + by, w: Math.max(0, box.w - 2 * by), h: Math.max(0, box.h - 2 * by) };
}

// The eight places a letter can sit round its mark. The first is where a loose
// point's letter has always gone (up and to the right), so a grid with room
// draws exactly as it did; the rest are where it goes when that place is taken.
const SEATS = [
  { name: 'NE', dx: 1, dy: -1 }, { name: 'NW', dx: -1, dy: -1 }, { name: 'SE', dx: 1, dy: 1 }, { name: 'SW', dx: -1, dy: 1 },
  { name: 'E', dx: 1, dy: 0 }, { name: 'W', dx: -1, dy: 0 }, { name: 'N', dx: 0, dy: -1 }, { name: 'S', dx: 0, dy: 1 }
];

function seatBox(seat, at, reach, width, font) {
  const push = reach + LABEL_OFF;
  let left, baseline;
  if (seat.dx > 0) left = at.x + (seat.dy === 0 ? push + LABEL_OFF : push);
  else if (seat.dx < 0) left = at.x - (seat.dy === 0 ? push + LABEL_OFF : push) - width;
  else left = at.x - width / 2;
  if (seat.dy < 0) baseline = at.y - (seat.dx === 0 ? push + LABEL_OFF : push);
  else if (seat.dy > 0) baseline = at.y + (seat.dx === 0 ? push + LABEL_OFF : push) + ASCENT * font;
  else baseline = at.y + 0.34 * font;
  return { left: left, baseline: baseline, box: textBox(left, baseline, width, font) };
}

// Seat one piece of text beside the place it belongs to, where it covers least:
// clear of the other letters, the marks, the axis numbers, the axes, and the
// edges of any shape, and on the squared paper when there is room there. When
// every seat costs something the cheapest is taken, and the canvas grows to
// hold whatever hangs past the grid, so nothing is ever clipped.
function seatText(text, font, at, reach, world, options) {
  const opts = options || {};
  const width = textWidth(text, font);
  let seats = SEATS;
  if (opts.only) seats = SEATS.filter(function (s) { return opts.only.indexOf(s.name) >= 0; });
  if (opts.away) {
    // A vertex letter belongs outside its shape: try the seats that point away
    // from the shape's middle first.
    const len = Math.hypot(opts.away.x, opts.away.y) || 1;
    const ux = opts.away.x / len, uy = opts.away.y / len;
    seats = seats.slice().sort(function (a, b) {
      const da = (a.dx * ux + a.dy * uy) / Math.hypot(a.dx, a.dy);
      const db = (b.dx * ux + b.dy * uy) / Math.hypot(b.dx, b.dy);
      return db - da;
    });
  }
  if (opts.first) {
    seats = seats.slice().sort(function (a, b) { return (a.name === opts.first ? 0 : 1) - (b.name === opts.first ? 0 : 1); });
  }

  // `at` is one place, or several in order of preference (the count beside a
  // leg may slide along it).
  const spots = Array.isArray(at) ? at : [at];
  let best = null;
  let rank = 0;
  spots.forEach(function (spot) {
    seats.forEach(function (seat) {
      const placed = seatBox(seat, spot, reach, width, font);
      const box = placed.box;
      const tight = inset(box, font * 0.06);
      const middle = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
      let cost = rank * COST_RANK + areaOutside(box, world.plot) * COST_OUTSIDE;
      rank += 1;
      world.boxes.forEach(function (b) { cost += overlapArea(box, b.box) * b.weight; });
      world.segments.forEach(function (s) { if (segmentHitsBox(s, tight)) cost += COST_EDGE; });
      if (opts.polygon) {
        const corners = [
          { x: box.x, y: box.y }, { x: box.x + box.w, y: box.y }, { x: box.x, y: box.y + box.h },
          { x: box.x + box.w, y: box.y + box.h }, middle
        ];
        corners.forEach(function (c) { if (inPolygon(c, opts.polygon)) cost += COST_INSIDE; });
      }
      if (opts.offShapes) {
        world.polygons.forEach(function (poly) { if (inPolygon(middle, poly)) cost += COST_ON_SHAPE; });
      }
      if (!best || cost < best.cost - 1e-9) best = { cost: cost, seat: seat.name, left: placed.left, baseline: placed.baseline, box: box };
    });
  });
  world.boxes.push({ box: best.box, weight: COST_TEXT });
  return { text: text, font: font, left: best.left, baseline: best.baseline, box: best.box, seat: best.seat };
}

// Break a note into lines no wider than `avail`, at spaces only. Null when one
// word alone is too wide, which is the signal to shrink.
function wrapWords(text, font, avail) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    if (textWidth(words[i], font) > avail) return null;
    const candidate = current ? current + ' ' + words[i] : words[i];
    if (textWidth(candidate, font) <= avail) current = candidate;
    else { lines.push(current); current = words[i]; }
  }
  if (current) lines.push(current);
  return lines;
}

// The same number of lines, broken where they come out most nearly equal, so a
// note reads "x positive," over "y positive" and not three words over one.
// Left as it was for a note too long to try every break.
const BALANCE_WORDS_MAX = 12;
function balanceLines(lines, font) {
  const words = lines.join(' ').split(' ');
  if (lines.length < 2 || words.length > BALANCE_WORDS_MAX) return lines;
  let best = null;
  const walk = function (start, left, made, widest) {
    if (left === 1) {
      const last = words.slice(start).join(' ');
      const w = Math.max(widest, textWidth(last, font));
      if (!best || w < best.w - 1e-9) best = { w: w, lines: made.concat([last]) };
      return;
    }
    for (let end = start + 1; end <= words.length - (left - 1); end++) {
      const line = words.slice(start, end).join(' ');
      walk(end, left - 1, made.concat([line]), Math.max(widest, textWidth(line, font)));
    }
  };
  walk(0, lines.length, [], 0);
  return best ? best.lines : lines;
}

// ─── sized for where it is read ─────────────────────────────────────────────
// Every size that belongs to the words, multiplied by `k`: the fonts, the
// gutters the edge numbers sit in, and the marks the letters name. The two
// floors a shrinking text may reach stay where they were, so a note or a
// numeral that fitted its space before still fits it.
function sizesFor(k) {
  const m = Math.min(k, MARK_GROW_MAX);
  return {
    k: k,
    NUM_FONT: NUM_FONT * k, LABEL_FONT: LABEL_FONT * k, COUNT_FONT: COUNT_FONT * k, AXIS_NAME_FONT: AXIS_NAME_FONT * k,
    INSIDE_FONT: INSIDE_FONT * k, NOTE_FONT: NOTE_FONT * k,
    LEFT_GUTTER: LEFT_GUTTER * k, BOTTOM_GUTTER: BOTTOM_GUTTER * k, HALO_W: HALO_W * k,
    POINT_R: POINT_R * m, CROSS_R: CROSS_R * m, CROSS_W: CROSS_W * m
  };
}

// The box a surface says the grid will print in, in points. Null when it has
// not said, and the grid then draws in its own units as it always did.
function boxOf(profile) {
  if (!profile || typeof profile !== 'object' || !(profile.widthPt > 0)) return null;
  const heightPt = profile.heightPt > 0 ? profile.heightPt : profile.maxHeightPt > 0 ? profile.maxHeightPt : null;
  const base = PROFILES[profile.surface] || {};
  const fontPt = profile.fontPt > 0 ? profile.fontPt : base.fontPt;
  return fontPt > 0 ? { widthPt: profile.widthPt, heightPt: heightPt, fontPt: fontPt, surface: profile.surface || '' } : null;
}

function fitScale(box, w, h) {
  return box.heightPt ? Math.min(box.widthPt / w, box.heightPt / h) : box.widthPt / w;
}

// How much bigger than a third of a square the words must be drawn to print at
// the surface's reading size in this box. It is worked out from the bare grid
// (its squares, numbers and axis names), never from what is plotted, so a
// question grid and its answer grid carry the same size of number. Never under
// 1: a grid whose squares are big enough already keeps the proportions it had.
function textScaleFor(data, box) {
  if (!box) return 1;
  const bare = {};
  FRAME_FIELDS.forEach(function (name) { if (data && data[name] !== undefined) bare[name] = data[name]; });
  const range = resolveRange(bare);
  const numbers = resolveNumbers(bare);
  let widest = 0;
  if (numbers !== 'none') {
    for (let i = range.xMin; i <= range.xMax; i++) {
      if (numbers === 'positive' && i < 0) continue;
      widest = Math.max(widest, textWidthEm(numText(i), true));
    }
  }
  let most = Math.min(NUM_FONT_MAX / NUM_FONT, widest > 0 ? NUM_WIDTH_MAX / (widest * NUM_FONT) : Infinity);
  if (numbers === 'all' && range.xMin < 0 && range.yMin < 0) {
    const ems = textWidthEm(numText(-1), true) / 2 + textWidthEm(numText(0), true) + ORIGIN_AIR_EM;
    most = Math.min(most, (CELL - NUM_GAP) / (ems * NUM_FONT));
  }
  let k = 1;
  for (let pass = 0; pass < 6; pass++) {
    const b = layoutGrid(bare, k).bounds;
    const ptPerUnit = fitScale(box, b.x2 - b.x1, b.y2 - b.y1);
    k = Math.max(1, Math.min(most, box.fontPt / (NUM_FONT * ptPerUnit)));
  }
  return k;
}

// ─── the layout ─────────────────────────────────────────────────────────────
// Everything is worked out here, in drawing units measured from the origin
// (x right, y DOWN), before a single mark is drawn: where each number, name,
// letter and note sits and how big the canvas has to be to hold them all.
function layoutGrid(data, k) {
  data = data || {};
  const S = sizesFor(k > 0 ? k : 1);
  const range = resolveRange(data);
  const belowZero = range.xMin < 0 || range.yMin < 0;
  const yAxisAtEdge = range.xMin === 0;
  const xAxisAtEdge = range.yMin === 0;
  const numbers = resolveNumbers(data);
  const showNumbers = numbers !== 'none';
  const showGrid = data.grid !== false;
  const showTicks = data.ticks != null ? data.ticks === true : (belowZero || !showGrid);
  const axisNames = resolveAxisNames(data, belowZero);
  const pointStyle = resolveMarkStyle(data.pointStyle, 'dot') === 'cross' ? 'cross' : 'dot';

  const X = function (gx) { return gx * CELL; };
  const Y = function (gy) { return -gy * CELL; };
  const plot = { x: X(range.xMin), y: Y(range.yMax), w: (range.xMax - range.xMin) * CELL, h: (range.yMax - range.yMin) * CELL };
  const left = plot.x, right = plot.x + plot.w, top = plot.y, bottom = plot.y + plot.h;

  // The frame the grid has always had: the squared paper, a number gutter
  // where an axis runs along its edge, and a margin everywhere else.
  const leftPad = showNumbers && yAxisAtEdge ? S.LEFT_GUTTER : MARGIN_RIGHT;
  const bottomPad = showNumbers && xAxisAtEdge ? S.BOTTOM_GUTTER : MARGIN_TOP;
  const bounds = { x1: left - leftPad, y1: top - MARGIN_TOP, x2: right + MARGIN_RIGHT, y2: bottom + bottomPad };
  const grow = function (box, margin) {
    const m = margin == null ? INK_MARGIN : margin;
    bounds.x1 = Math.min(bounds.x1, box.x - m); bounds.y1 = Math.min(bounds.y1, box.y - m);
    bounds.x2 = Math.max(bounds.x2, box.x + box.w + m); bounds.y2 = Math.max(bounds.y2, box.y + box.h + m);
  };

  // What a letter must keep clear of.
  const world = { plot: plot, boxes: [], segments: [], polygons: [] };
  world.boxes.push({ box: { x: left, y: Y(0) - AXIS_W, w: plot.w, h: AXIS_W * 2 }, weight: COST_AXIS });
  world.boxes.push({ box: { x: X(0) - AXIS_W, y: top, w: AXIS_W * 2, h: plot.h }, weight: COST_AXIS });

  // ── quadrants ──
  const quadrants = [];
  const addQuadrant = function (id, x1, y1, x2, y2) {
    if (x2 - x1 < 1e-6 || y2 - y1 < 1e-6) return;
    const q = QUADRANTS.filter(function (item) { return item.id === id; })[0];
    quadrants.push({ id: id, key: q.key, aliases: q.aliases, box: { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } });
  };
  addQuadrant('topRight', X(0), top, right, Y(0));
  addQuadrant('topLeft', left, top, X(0), Y(0));
  addQuadrant('bottomLeft', left, Y(0), X(0), bottom);
  addQuadrant('bottomRight', X(0), Y(0), right, bottom);

  // ── axis numbers ──
  const numberItems = [];
  const xRowY = Y(0) + S.BOTTOM_GUTTER * 0.55;
  const yColX = X(0) - S.LEFT_GUTTER * 0.42;
  const addNumber = function (axis, value, cx, cy, anchor) {
    const text = numText(value);
    const w = textWidth(text, S.NUM_FONT);
    const x = anchor === 'end' ? cx - w : cx - w / 2;
    const box = { x: x, y: cy - S.NUM_FONT * 0.42, w: w, h: S.NUM_FONT * 0.84 };
    numberItems.push({ axis: axis, value: value, text: text, cx: cx, cy: cy, anchor: anchor, box: box, onPaper: axis === 'x' ? !xAxisAtEdge : !yAxisAtEdge });
    world.boxes.push({ box: box, weight: COST_NUMBER });
    grow(box);
  };
  if (showNumbers) {
    for (let i = range.xMin; i <= range.xMax; i++) {
      if (numbers === 'positive' && i < 0) continue;
      if (i === 0 && !yAxisAtEdge && !xAxisAtEdge) continue;        // the shared zero is placed below
      if (i === 0 && yAxisAtEdge && !xAxisAtEdge) continue;         // the side gutter already carries it
      addNumber('x', i, X(i), xRowY, 'middle');
    }
    // Up the side. Beside an axis at the edge the numbers are centred in their
    // gutter, as they always were; beside an axis in the middle of the paper
    // they end a fixed gap short of it, so "−10" can never reach across it.
    for (let j = range.yMin; j <= range.yMax; j++) {
      if (numbers === 'positive' && j < 0) continue;
      if (j === 0 && !yAxisAtEdge) continue;
      if (yAxisAtEdge) addNumber('y', j, yColX, Y(j), 'middle');
      else addNumber('y', j, X(0) - NUM_GAP, Y(j), 'end');
    }
    // One zero where the axes cross, in the corner below and left of it.
    if (!yAxisAtEdge && !xAxisAtEdge) addNumber('origin', 0, X(0) - NUM_GAP, xRowY, 'end');
    // Where the numbers run across the squared paper, a letter keeps out of
    // their row and their column even where it would fit between two of
    // them: M beside the point (4, 0) once sat between the 4 and the 5 and
    // the axis read "4M5".
    const numbered = numbers === 'positive' ? 0 : null;
    if (!xAxisAtEdge) {
      const from = numbered === 0 ? X(0) : left;
      world.boxes.push({ box: { x: from, y: xRowY - S.NUM_FONT * 0.42, w: right - from, h: S.NUM_FONT * 0.84 }, weight: COST_STRIP });
    }
    if (!yAxisAtEdge) {
      const widestY = numberItems.filter(function (n) { return n.axis === 'y'; }).reduce(function (m, n) { return Math.max(m, n.box.w); }, 0);
      const to = numbered === 0 ? Y(0) : bottom;
      world.boxes.push({ box: { x: X(0) - NUM_GAP - widestY, y: top, w: widestY, h: to - top }, weight: COST_STRIP });
    }
  }

  // ── axis names ──
  const nameItems = [];
  if (axisNames) {
    const lastNumber = showNumbers ? textWidth(numText(range.xMax), S.NUM_FONT) / 2 : 0;
    if (axisNames.x) {
      const w = textWidth(axisNames.x, S.AXIS_NAME_FONT);
      // Past the last number, which is centred on the end of the axis and so
      // reaches half its own width beyond it.
      // Along the foot of a first-quadrant grid the last number sits just
      // below the name's line, so the name still starts clear of its width.
      const leftEdge = xAxisAtEdge ? right + Math.max(AXIS_NAME_GAP, lastNumber + AXIS_NAME_GAP * 0.1) : right + lastNumber + AXIS_NAME_GAP;
      const baseline = Y(0) + S.AXIS_NAME_FONT * 0.30;
      nameItems.push({ axis: 'x', text: axisNames.x, left: leftEdge, baseline: baseline, box: textBox(leftEdge, baseline, w, S.AXIS_NAME_FONT) });
    }
    if (axisNames.y) {
      const w = textWidth(axisNames.y, S.AXIS_NAME_FONT);
      const clearNumber = showNumbers ? S.NUM_FONT * 0.42 : 0;
      const baseline = top - Math.max(AXIS_NAME_GAP, clearNumber + AXIS_NAME_GAP * 0.5) - DESCENT * S.AXIS_NAME_FONT;
      const leftEdge = X(0) - w / 2;
      nameItems.push({ axis: 'y', text: axisNames.y, left: leftEdge, baseline: baseline, box: textBox(leftEdge, baseline, w, S.AXIS_NAME_FONT) });
    }
    nameItems.forEach(function (item) { world.boxes.push({ box: item.box, weight: COST_NUMBER }); grow(item.box); });
  }

  // ── what is plotted ──
  const loose = resolvePoints(data).map(toPoint).filter(usable).map(function (p) {
    return { x: p.x, y: p.y, label: filled(p.label) ? String(p.label) : '', coords: p.coords, answer: p.answer };
  });
  loose.forEach(function (p) { refuseOffGrid(p, range, 'the point' + (p.label ? ' ' + p.label : '') + ' at'); });
  const resolved = resolveShapes(data, range, pointStyle);
  const shapes = resolved.shapes;
  if (data.join && loose.length >= 2) {
    // Joined from points that are all the answer, the shape is the answer too.
    const allAnswer = loose.every(function (p) { return p.answer === true; });
    shapes.unshift({ index: -1, points: loose, image: false, answer: allAnswer, inside: '', marks: 'none', joined: true });
  }
  const arrows = resolved.arrows.concat(resolveArrows(data, range));
  const route = resolveRoute(data, range);

  const toUnits = function (p) { return { x: X(p.x), y: Y(p.y) }; };
  shapes.forEach(function (shape) {
    shape.poly = shape.points.map(toUnits);
    edgesOf(shape.poly).forEach(function (edge) { world.segments.push(edge); });
    if (shape.poly.length >= 3) world.polygons.push(shape.poly);
  });

  // ── arrows, as the legs they are drawn in ──
  const arrowItems = arrows.map(function (arrow) {
    const a = toUnits(arrow.from), b = toUnits(arrow.to);
    const dx = arrow.to.x - arrow.from.x, dy = arrow.to.y - arrow.from.y;
    const legs = [];
    if (arrow.steps) {
      const corner = { x: b.x, y: a.y };
      if (dx !== 0) legs.push({ x1: a.x, y1: a.y, x2: corner.x, y2: corner.y, squares: Math.abs(dx), word: dx > 0 ? 'right' : 'left', across: true });
      if (dy !== 0) legs.push({ x1: corner.x, y1: corner.y, x2: b.x, y2: b.y, squares: Math.abs(dy), word: dy > 0 ? 'up' : 'down', across: false });
    } else {
      legs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    legs.forEach(function (leg) { world.segments.push(leg); });
    return { from: arrow.from, to: arrow.to, steps: arrow.steps, count: arrow.count, answer: arrow.answer === true, dx: dx, dy: dy, legs: legs };
  });

  // ── marks ──
  // Every plotted point and lettered vertex, in the order they are lettered.
  const marks = [];
  const joined = shapes.filter(function (shape) { return shape.joined; })[0] || null;
  loose.forEach(function (p) {
    marks.push({ at: toUnits(p), grid: p, style: pointStyle, label: p.label, coords: p.coords, answer: p.answer, shape: joined, middle: joined ? centroid(joined.poly) : null });
  });
  shapes.forEach(function (shape) {
    if (shape.joined) return;                      // its vertices are the loose points, already marked
    const middle = centroid(shape.poly);
    shape.points.forEach(function (p, i) {
      if (shape.marks === 'none' && !p.label && !p.coords) return;
      marks.push({ at: shape.poly[i], grid: p, style: shape.marks, label: p.label, coords: p.coords, answer: shape.answer ? true : p.answer, shape: shape, middle: middle });
    });
  });
  marks.forEach(function (mark) {
    mark.reach = mark.style === 'cross' ? S.CROSS_R : mark.style === 'dot' ? S.POINT_R : 0;
    if (mark.style === 'none') return;
    const box = { x: mark.at.x - mark.reach, y: mark.at.y - mark.reach, w: mark.reach * 2, h: mark.reach * 2 };
    mark.box = box;
    world.boxes.push({ box: box, weight: COST_TEXT });
    grow(box, AXIS_W);
  });

  // ── a numeral inside a shape ──
  // At the shape's balance point, shrinking until all of it is inside. One that
  // still will not fit at a readable size is seated beside the shape instead.
  // Where the balance point is taken (an axis runs through it, a number sits on
  // it), the nearest free place inside the shape is used instead, looked for a
  // quarter of a square at a time.
  shapes.forEach(function (shape) {
    if (!shape.inside) return;
    const middle = centroid(shape.poly);
    const edges = edgesOf(shape.poly);
    const xs = shape.points.map(function (p) { return p.x; });
    const ys = shape.points.map(function (p) { return p.y; });
    const spots = [middle];
    for (let gx = Math.min.apply(null, xs) + INSIDE_STEP; gx < Math.max.apply(null, xs); gx += INSIDE_STEP) {
      for (let gy = Math.min.apply(null, ys) + INSIDE_STEP; gy < Math.max.apply(null, ys); gy += INSIDE_STEP) {
        spots.push({ x: X(gx), y: Y(gy) });
      }
    }
    const near = function (p) { return Math.hypot(p.x - middle.x, p.y - middle.y); };
    spots.sort(function (a, b) { return near(a) - near(b); });
    for (let font = S.INSIDE_FONT; font >= INSIDE_FLOOR - 1e-9 && !shape.insideText; font -= FIT_STEP) {
      const w = textWidth(shape.inside, font);
      for (let k = 0; k < spots.length && !shape.insideText; k++) {
        const baseline = spots[k].y + 0.34 * font;
        const box = textBox(spots[k].x - w / 2, baseline, w, font);
        const snug = { x: box.x - font * 0.08, y: box.y, w: box.w + font * 0.16, h: box.h };
        const corners = [{ x: snug.x, y: snug.y }, { x: snug.x + snug.w, y: snug.y }, { x: snug.x, y: snug.y + snug.h }, { x: snug.x + snug.w, y: snug.y + snug.h }];
        const fits = corners.every(function (c) { return inPolygon(c, shape.poly); }) &&
          !edges.some(function (edge) { return segmentHitsBox(edge, snug); }) &&
          !world.boxes.some(function (b) { return overlapArea(snug, b.box) > 0; });
        if (!fits) continue;
        shape.insideText = { text: shape.inside, font: font, left: box.x, baseline: baseline, box: box, within: true };
        world.boxes.push({ box: box, weight: COST_TEXT });
      }
    }
  });

  // ── letters ──
  const mainLetters = marks.filter(function (m) { return m.label || m.coords; });
  mainLetters.forEach(function (mark) {
    const text = (mark.label ? mark.label : '') + (mark.coords ? (mark.label ? ' ' : '') + pairText(mark.grid) : '');
    const options = mark.shape
      ? { away: { x: mark.at.x - mark.middle.x, y: mark.at.y - mark.middle.y }, polygon: mark.shape.poly }
      : null;
    mark.letter = seatText(text, S.LABEL_FONT, mark.at, mark.reach || S.POINT_R, world, options);
    grow(mark.letter.box);
  });
  shapes.forEach(function (shape) {
    if (!shape.inside || shape.insideText) return;
    const middle = centroid(shape.poly);
    const longest = edgesOf(shape.poly).reduce(function (best, edge) {
      const len = Math.hypot(edge.x2 - edge.x1, edge.y2 - edge.y1);
      return !best || len > best.len ? { len: len, edge: edge } : best;
    }, null).edge;
    const at = { x: (longest.x1 + longest.x2) / 2, y: (longest.y1 + longest.y2) / 2 };
    const seated = seatText(shape.inside, INSIDE_FLOOR, at, 0, world, { away: { x: at.x - middle.x, y: at.y - middle.y }, polygon: shape.poly });
    shape.insideText = Object.assign(seated, { within: false });
    grow(seated.box);
  });

  // ── "6 right", "5 down" ──
  arrowItems.forEach(function (arrow) {
    if (!arrow.count || !arrow.steps) return;
    arrow.legs.forEach(function (leg) {
      const text = numText(leg.squares) + ' ' + leg.word;
      const spots = LEG_SPOTS.map(function (t) {
        return { x: leg.x1 + (leg.x2 - leg.x1) * t, y: leg.y1 + (leg.y2 - leg.y1) * t };
      });
      // Outside the corner the two legs make first, so the words do not sit in
      // it; then wherever along the leg they cover least.
      const options = leg.across
        ? { only: ['N', 'S'], first: arrow.dy > 0 ? 'S' : 'N', offShapes: true }
        : { only: ['E', 'W'], first: arrow.dx < 0 ? 'W' : 'E', offShapes: true };
      leg.countText = seatText(text, S.COUNT_FONT, spots, MOVE_W, world, options);
      grow(leg.countText.box);
    });
  });

  // ── a few words inside a quadrant ──
  const noteItems = [];
  const rawNotes = data.quadrantNotes && typeof data.quadrantNotes === 'object' ? data.quadrantNotes : {};
  const squash = function (s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ''); };
  Object.keys(rawNotes).forEach(function (name) {
    if (!filled(rawNotes[name])) return;
    const wanted = squash(name);
    const quadrant = quadrants.filter(function (q) {
      return squash(q.key) === wanted || q.aliases.some(function (alias) { return squash(alias) === wanted; });
    })[0];
    if (!quadrant) {
      throw new Error(
        'COORDINATE_GRID_NOTE_UNKNOWN_QUADRANT: ' + JSON.stringify(name) + ' is not a quadrant of this grid. Its quadrants are: ' +
          quadrants.map(function (q) { return q.key; }).join(', ') + '.'
      );
    }
    const text = String(rawNotes[name]).trim();
    // The strip beside each axis belongs to that axis's numbers: they run down
    // the right-hand edge of the left quadrants and along the top of the bottom ones.
    const q = quadrant.box;
    const numberStripW = showNumbers && !yAxisAtEdge && quadrant.id.indexOf('Left') >= 0 ? S.LEFT_GUTTER : 0;
    const numberStripH = showNumbers && !xAxisAtEdge && quadrant.id.indexOf('bottom') === 0 ? S.BOTTOM_GUTTER : 0;
    const room = {
      x: q.x + NOTE_PAD,
      y: q.y + NOTE_PAD + numberStripH,
      w: q.w - 2 * NOTE_PAD - numberStripW,
      h: q.h - 2 * NOTE_PAD - numberStripH
    };
    // The largest size at which the note reads as lines of words: a size that
    // strands one word on a line of its own ("x" over "negative," over
    // "y positive") is passed over for the next size down while a smaller one
    // sets it better, and taken only when nothing smaller does.
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const setAt = function (font) {
      const lines = room.w > 0 ? wrapWords(text, font, room.w) : null;
      return lines && lines.length * font * NOTE_LINE <= room.h ? { font: font, lines: balanceLines(lines, font) } : null;
    };
    const stranded = function (lines) {
      return wordCount >= 4 && lines.some(function (line) { return line.indexOf(' ') < 0; });
    };
    let set = null;
    let fallback = null;
    for (let font = S.NOTE_FONT; font >= NOTE_FLOOR - 1e-9 && !set; font -= FIT_STEP) {
      const tried = setAt(font);
      if (!tried) continue;
      if (!stranded(tried.lines)) set = tried;
      else if (!fallback) fallback = tried;
    }
    set = set || fallback;
    if (!set) {
      throw new Error(
        'COORDINATE_GRID_NOTE_DOES_NOT_FIT: the note ' + JSON.stringify(text) + ' cannot be read inside the ' + quadrant.key +
          ' quadrant of this grid. Use fewer words, or a grid with more squares in that quadrant.'
      );
    }
    noteItems.push({ quadrant: quadrant.id, key: quadrant.key, text: text, font: set.font, lines: set.lines, room: room, setAt: setAt, centreX: room.x + room.w / 2 });
  });
  // Every note on one grid prints at one size, the smallest any of them needed:
  // the quadrants left of the y-axis are narrower by the strip its numbers
  // take, and four notes at four sizes read as four different kinds of thing.
  const noteFont = noteItems.reduce(function (m, note) { return Math.min(m, note.font); }, Infinity);
  noteItems.forEach(function (note) {
    const quadrant = { key: note.key };
    const room = note.room;
    const set = note.font > noteFont + 1e-9 ? (note.setAt(noteFont) || note) : note;
    note.font = set.font; note.lines = set.lines;
    delete note.setAt; delete note.room;
    const blockW = set.lines.reduce(function (m, line) { return Math.max(m, textWidth(line, set.font)); }, 0);
    const blockH = set.lines.length * set.font * NOTE_LINE;
    const box = { x: room.x + (room.w - blockW) / 2, y: room.y + (room.h - blockH) / 2, w: blockW, h: blockH };
    note.box = box;
    const busy = marks.some(function (m) { return overlapArea(box, { x: m.at.x - S.CROSS_R, y: m.at.y - S.CROSS_R, w: S.CROSS_R * 2, h: S.CROSS_R * 2 }) > 0; }) ||
      world.segments.some(function (s) { return segmentHitsBox(s, box); }) ||
      shapes.some(function (shape) { return inPolygon({ x: box.x + box.w / 2, y: box.y + box.h / 2 }, shape.poly); }) ||
      marks.some(function (m) { return m.letter && overlapArea(box, m.letter.box) > 0; });
    if (busy) {
      throw new Error(
        'COORDINATE_GRID_NOTE_OVER_PLOT: the note in the ' + quadrant.key + ' quadrant would lie across something plotted there. ' +
          'A quadrant note belongs on a grid with nothing plotted in that quadrant.'
      );
    }
  });

  // ── what a teacher may point at ──
  const parts = quadrants.map(function (q) { return { key: q.key, aliases: q.aliases }; });
  parts.push({ key: 'x-axis', aliases: ['x axis'] });
  parts.push({ key: 'y-axis', aliases: ['y axis'] });
  parts.push({ key: 'origin', aliases: ['(0, 0)', 'zero'] });
  const seen = {};
  mainLetters.forEach(function (mark) {
    if (!mark.label || seen[mark.label]) return;
    seen[mark.label] = true;
    parts.push({ key: mark.label, aliases: ['point ' + mark.label] });
  });
  const marked = figureHighlight.resolveHighlight(data, parts, 'coordinate grid');

  return {
    range: range, plot: plot, bounds: bounds, X: X, Y: Y, S: S,
    numbers: numbers, showNumbers: showNumbers, showGrid: showGrid, showTicks: showTicks,
    yAxisAtEdge: yAxisAtEdge, xAxisAtEdge: xAxisAtEdge,
    quadrants: quadrants, numberItems: numberItems, nameItems: nameItems,
    shapes: shapes, arrowItems: arrowItems, marks: marks, noteItems: noteItems,
    route: route, marked: marked, tint: data.tintQuadrants === true
  };
}

function cacheKey(data, profile) {
  data = data || {};
  const box = boxOf(profile);
  // A grid drawn for a box carries words sized for it, so the same grid in a
  // different box is a different picture.
  const at = box ? ':at:' + box.surface + ':' + f(box.widthPt) + 'x' + (box.heightPt ? f(box.heightPt) : '-') + (printsInInk(profile) ? ':ink' : '') : '';
  const shown = answersShown(profile) === answersShown(null) ? '' : answersShown(profile) ? ':answers' : ':question';
  const size = resolveGridSize(data);
  const cols = size.cols;
  const rows = size.rows;
  const points = resolvePoints(data);
  const route = resolveRoute(data, resolveRange(data));
  const pk = points
    .map(function (p) { return p.x + ',' + p.y + (p.label != null ? ':' + p.label : ''); })
    .join(' ');
  const rk = route ? route.x + ',' + route.y : '-';
  const legacy = 'coordinate-grid:' + cols + 'x' + rows + ':' +
    (data.numbers === false ? 'n0' : 'n1') + ':' +
    (data.join ? 'j' : 'p') + ':' + pk + ':route:' + rk;
  // Whatever the grid has grown since, so two grids that differ only in a newer
  // field never share one cached picture.
  const grown = {};
  GROWN_FIELDS.forEach(function (name) { if (data[name] !== undefined) grown[name] = data[name]; });
  if (resolveNumbers(data) === 'positive') grown.numbers = 'positive';
  if (points.some(function (p) { return p && p.coords === true; })) {
    grown.coords = points.map(function (p) { return p && p.coords === true ? 1 : 0; }).join('');
  }
  if (points.some(function (p) { return p && resolveAnswer(p.answer); })) {
    grown.answer = points.map(function (p) { const a = p && resolveAnswer(p.answer); return a === true ? 'a' : a ? 'c' : '-'; }).join('');
  }
  return (Object.keys(grown).length ? legacy + ':grown:' + JSON.stringify(grown) : legacy) + at + shown;
}

// ─── the drawing ────────────────────────────────────────────────────────────
// Build the SVG cropped tight to everything the layout placed: no padded
// square, no centring-in-deadspace. The drawn extent IS the box.
// `profile` is optional: the stick-in pack passes its own so the grid prints in ink.
function draw(data, profile) {
  data = data || {};
  const ink = printsInInk(profile);
  const C = ink ? INK : COLOURS;
  const box = boxOf(profile);
  const k = textScaleFor(data, box);
  const L = layoutGrid(answersShown(profile) ? data : withoutAnswers(data), k);
  keepRoomFor(L, data, k);
  const S = L.S;
  const ox = -L.bounds.x1, oy = -L.bounds.y1;
  const w = L.bounds.x2 - L.bounds.x1;
  const h = L.bounds.y2 - L.bounds.y1;
  // In a box, the picture is handed back at the size it prints: the same
  // drawing, its squares still 100 units, fitted to the box in points.
  const ptPerUnit = box ? fitScale(box, w, h) : null;
  const outW = box ? w * ptPerUnit : w;
  const outH = box ? h * ptPerUnit : h;
  const px = function (ux) { return ux + ox; };
  const py = function (uy) { return uy + oy; };
  const X = function (gx) { return px(L.X(gx)); };
  const Y = function (gy) { return py(L.Y(gy)); };
  const left = px(L.plot.x), right = px(L.plot.x + L.plot.w), top = py(L.plot.y), bottom = py(L.plot.y + L.plot.h);
  const marked = L.marked;
  const longSide = Math.max(w, h);
  const parts = [];
  const quadrantLit = L.quadrants.some(function (q) { return marked.has(q.key); });
  const letterLit = L.marks.some(function (m) { return m.label && marked.has(m.label); });

  if (L.route) {
    parts.push('<defs><marker id="plot-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="' + C.route + '"/></marker></defs>');
  }

  // Quadrant tints, and the wash over a quadrant being pointed at. A region is
  // filled, never ringed: a ring round a quadrant runs along both axes and
  // reads as part of the grid.
  L.quadrants.forEach(function (q) {
    const lit = marked.has(q.key);
    if (!L.tint && !lit) return;
    const fill = lit ? C.highlightFill : C.tints[q.id];
    const opacity = quadrantLit && !lit ? ` opacity="${figureHighlight.DIMMED}"` : '';
    parts.push(`<rect x="${f(px(q.box.x))}" y="${f(py(q.box.y))}" width="${f(q.box.w)}" height="${f(q.box.h)}" fill="${fill}"${opacity}/>`);
  });

  const polyPoints = function (poly) {
    return poly.map(function (p) { return f(px(p.x)) + ',' + f(py(p.y)); }).join(' ');
  };
  // Shape fills first, images under the shapes they came from, so the squared
  // paper shows through every shape and its squares can still be counted.
  const ordered = L.shapes.filter(function (s) { return s.image; }).concat(L.shapes.filter(function (s) { return !s.image; }));
  ordered.forEach(function (shape) {
    if (shape.poly.length < 3) return;
    const fill = shape.answer ? (shape.image ? C.answerImgFill : C.answerFill) : shape.image ? C.imgFill : C.fill;
    parts.push(`<polygon points="${polyPoints(shape.poly)}" fill="${fill}"/>`);
  });

  // Pale squared-paper gridlines.
  if (L.showGrid) {
    for (let i = L.range.xMin; i <= L.range.xMax; i++) {
      parts.push(`<line x1="${f(X(i))}" y1="${f(top)}" x2="${f(X(i))}" y2="${f(bottom)}" stroke="${C.grid}" stroke-width="${f(GRID_W)}"/>`);
    }
    for (let j = L.range.yMin; j <= L.range.yMax; j++) {
      parts.push(`<line x1="${f(left)}" y1="${f(Y(j))}" x2="${f(right)}" y2="${f(Y(j))}" stroke="${C.grid}" stroke-width="${f(GRID_W)}"/>`);
    }
  }

  // Shape outlines, over the squared paper so a dashed image stays readable.
  ordered.forEach(function (shape) {
    const dash = shape.image ? ` stroke-dasharray="${f(IMG_DASH)},${f(IMG_GAP)}"` : '';
    const tag = shape.poly.length < 3 ? 'polyline' : 'polygon';
    // An answer's outline is drawn a little heavier: green on a pale green
    // fill is lighter to the eye than the blue it replaces.
    const stroke = shape.answer ? C.answer : shape.image ? C.imgOutline : C.outline;
    const width = shape.answer ? SHAPE_W * 1.6 : SHAPE_W;
    parts.push(`<${tag} points="${polyPoints(shape.poly)}" fill="none" stroke="${stroke}" stroke-width="${f(width)}"${dash} stroke-linejoin="round" stroke-linecap="round"/>`);
  });

  // Bold axes through the origin, with the wash under one being pointed at.
  const ringColour = '#' + (ink ? figureHighlight.RING_INK : figureHighlight.RING);
  if (marked.has('x-axis')) {
    parts.push(`<line x1="${f(left)}" y1="${f(Y(0))}" x2="${f(right)}" y2="${f(Y(0))}" stroke="${ringColour}" stroke-width="${f(AXIS_GLOW_W)}" stroke-linecap="round" opacity="0.55"/>`);
  }
  if (marked.has('y-axis')) {
    parts.push(`<line x1="${f(X(0))}" y1="${f(top)}" x2="${f(X(0))}" y2="${f(bottom)}" stroke="${ringColour}" stroke-width="${f(AXIS_GLOW_W)}" stroke-linecap="round" opacity="0.55"/>`);
  }
  parts.push(`<line x1="${f(left)}" y1="${f(Y(0))}" x2="${f(right)}" y2="${f(Y(0))}" stroke="${C.axis}" stroke-width="${f(AXIS_W)}" stroke-linecap="round"/>`);
  parts.push(`<line x1="${f(X(0))}" y1="${f(top)}" x2="${f(X(0))}" y2="${f(bottom)}" stroke="${C.axis}" stroke-width="${f(AXIS_W)}" stroke-linecap="round"/>`);

  // A mark across each axis at every whole number: each axis is a number line.
  if (L.showTicks) {
    for (let i = L.range.xMin; i <= L.range.xMax; i++) {
      if (i === 0) continue;
      const below = L.xAxisAtEdge ? 0 : TICK_HALF;
      parts.push(`<line x1="${f(X(i))}" y1="${f(Y(0) - TICK_HALF)}" x2="${f(X(i))}" y2="${f(Y(0) + below)}" stroke="${C.axis}" stroke-width="${f(TICK_W)}" stroke-linecap="round"/>`);
    }
    for (let j = L.range.yMin; j <= L.range.yMax; j++) {
      if (j === 0) continue;
      const leftward = L.yAxisAtEdge ? 0 : TICK_HALF;
      parts.push(`<line x1="${f(X(0) - leftward)}" y1="${f(Y(j))}" x2="${f(X(0) + TICK_HALF)}" y2="${f(Y(j))}" stroke="${C.axis}" stroke-width="${f(TICK_W)}" stroke-linecap="round"/>`);
    }
  }

  // A simple two-move route: across first, then up. Both legs have arrowheads
  // so the order remains visible when the numbered full-size grid is reduced
  // to the number-free Success Criteria Helper treatment.
  if (L.route) {
    const turnX = X(L.route.x);
    if (L.route.x !== 0) {
      parts.push(`<line x1="${f(X(0))}" y1="${f(Y(0))}" x2="${f(turnX)}" y2="${f(Y(0))}" stroke="${C.route}" stroke-width="${f(ROUTE_W)}" stroke-linecap="round" marker-end="url(#plot-arrow)"/>`);
    }
    if (L.route.y !== 0) {
      parts.push(`<line x1="${f(turnX)}" y1="${f(Y(0))}" x2="${f(turnX)}" y2="${f(Y(L.route.y))}" stroke="${C.route}" stroke-width="${f(ROUTE_W)}" stroke-linecap="round" marker-end="url(#plot-arrow)"/>`);
    }
    parts.push(`<circle cx="${f(turnX)}" cy="${f(Y(L.route.y))}" r="${f(S.POINT_R * 1.15)}" fill="${C.point}"/>`);
  }

  // A translation's path: every leg ends in a head at the place it reaches,
  // solid and in the criteria's orange (green when the path is the answer).
  // Drawn under the axis numbers, whose paper edge lets one the path runs
  // across stay readable: the across leg of a path from (−5, 1) runs along
  // y = 1, straight through the axis's own 1.
  L.arrowItems.forEach(function (arrow) {
    const colour = arrow.answer ? C.answer : C.move;
    arrow.legs.forEach(function (leg) {
      const len = Math.hypot(leg.x2 - leg.x1, leg.y2 - leg.y1);
      if (len < 1e-6) return;
      const ux = (leg.x2 - leg.x1) / len, uy = (leg.y2 - leg.y1) / len;
      const head = Math.min(MOVE_HEAD_L, len * 0.6);
      const bx = leg.x2 - ux * head, by = leg.y2 - uy * head;
      const half = MOVE_HEAD_W / 2 * (head / MOVE_HEAD_L);
      parts.push(`<line x1="${f(px(leg.x1))}" y1="${f(py(leg.y1))}" x2="${f(px(bx + ux * MOVE_W * 0.5))}" y2="${f(py(by + uy * MOVE_W * 0.5))}" stroke="${colour}" stroke-width="${f(MOVE_W)}" stroke-linecap="round"/>`);
      parts.push(`<polygon points="${f(px(leg.x2))},${f(py(leg.y2))} ${f(px(bx - uy * half))},${f(py(by + ux * half))} ${f(px(bx + uy * half))},${f(py(by - ux * half))}" fill="${colour}" stroke="${colour}" stroke-width="${f(MOVE_W * 0.4)}" stroke-linejoin="round"/>`);
    });
  });

  // Axis numbers, centred on each gridline. A number that sits on the squared
  // paper takes a paper-coloured edge, so the gridline behind it does not
  // strike it through.
  L.numberItems.forEach(function (n) {
    const attrs = `x="${f(px(n.cx))}" y="${f(py(n.cy))}" text-anchor="${n.anchor}" dy="0.36em" font-family="${FONT}" font-size="${f(S.NUM_FONT)}" font-weight="bold"`;
    if ((n.onPaper || n.axis === 'origin') && (L.showGrid || L.showTicks)) {
      parts.push(`<text ${attrs} fill="${C.paper}" stroke="${C.paper}" stroke-width="${f(S.HALO_W)}" stroke-linejoin="round">${escapeXml(n.text)}</text>`);
    }
    parts.push(`<text ${attrs} fill="${C.num}">${escapeXml(n.text)}</text>`);
  });

  // The name at the positive end of each axis.
  L.nameItems.forEach(function (n) {
    parts.push(`<text x="${f(px(n.left))}" y="${f(py(n.baseline))}" text-anchor="start" font-family="${FONT}" font-size="${f(S.AXIS_NAME_FONT)}" font-weight="bold" font-style="italic" fill="${C.num}">${escapeXml(n.text)}</text>`);
  });

  // A few words inside a quadrant.
  L.noteItems.forEach(function (note) {
    note.lines.forEach(function (line, i) {
      const baseline = note.box.y + i * note.font * NOTE_LINE + note.font * 0.92;
      parts.push(`<text x="${f(px(note.centreX))}" y="${f(py(baseline))}" text-anchor="middle" font-family="${FONT}" font-size="${f(note.font)}" font-weight="bold" fill="${C.note}">${escapeXml(line)}</text>`);
    });
  });

  // The words that count each leg ("6 right"), in the path's own colour.
  L.arrowItems.forEach(function (arrow) {
    arrow.legs.forEach(function (leg) {
      if (!leg.countText) return;
      const t = leg.countText;
      parts.push(`<text x="${f(px(t.left))}" y="${f(py(t.baseline))}" text-anchor="start" font-family="${FONT}" font-size="${f(t.font)}" font-weight="bold" fill="${arrow.answer ? C.answer : C.move}">${escapeXml(t.text)}</text>`);
    });
  });

  // A numeral inside (or, when it cannot fit, beside) its shape.
  L.shapes.forEach(function (shape) {
    if (!shape.insideText) return;
    const t = shape.insideText;
    parts.push(`<text x="${f(px(t.left))}" y="${f(py(t.baseline))}" text-anchor="start" font-family="${FONT}" font-size="${f(t.font)}" font-weight="bold" fill="${shape.answer ? C.answer : shape.image ? C.imgOutline : C.outline}">${escapeXml(t.text)}</text>`);
  });

  // Plotted points and their letters. When one letter is being pointed at, the
  // others fade back and it takes the ring.
  L.marks.forEach(function (mark) {
    const own = [];
    const cx = px(mark.at.x), cy = py(mark.at.y);
    const markColour = mark.answer === true ? C.answer : C.point;
    if (mark.style === 'dot') {
      own.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(S.POINT_R)}" fill="${markColour}"/>`);
    } else if (mark.style === 'cross') {
      own.push(`<path d="M ${f(cx - S.CROSS_R)} ${f(cy - S.CROSS_R)} L ${f(cx + S.CROSS_R)} ${f(cy + S.CROSS_R)} M ${f(cx - S.CROSS_R)} ${f(cy + S.CROSS_R)} L ${f(cx + S.CROSS_R)} ${f(cy - S.CROSS_R)}" fill="none" stroke="${markColour}" stroke-width="${f(S.CROSS_W)}" stroke-linecap="round"/>`);
    }
    if (mark.letter) {
      // Only the coordinates are the answer: the letter keeps the point's
      // colour and the bracket after it turns green.
      const split = mark.answer === 'coordinates' && mark.coords && mark.label;
      const body = split
        ? `<tspan>${escapeXml(mark.label + ' ')}</tspan><tspan fill="${C.answer}">${escapeXml(pairText(mark.grid))}</tspan>`
        : escapeXml(mark.letter.text);
      const fill = mark.answer === true || (mark.answer === 'coordinates' && !mark.label) ? C.answer : C.label;
      own.push(`<text x="${f(px(mark.letter.left))}" y="${f(py(mark.letter.baseline))}" text-anchor="start" dominant-baseline="auto" font-family="${FONT}" font-size="${f(S.LABEL_FONT)}" font-weight="bold" fill="${fill}" xml:space="preserve">${body}</text>`);
    }
    if (!own.length) return;
    const lit = mark.label && marked.has(mark.label);
    if (letterLit && !lit) parts.push(`<g opacity="${figureHighlight.DIMMED}">${own.join('')}</g>`);
    else parts.push(own.join(''));
    if (lit) parts.push(figureHighlight.ringCircleSvg(marked, mark.label, { x: cx, y: cy }, Math.max(mark.reach, S.POINT_R) + LABEL_OFF * 0.6, longSide, ink));
  });
  if (marked.has('origin')) {
    parts.push(figureHighlight.ringCircleSvg(marked, 'origin', { x: X(0), y: Y(0) }, S.POINT_R + LABEL_OFF, longSide, ink));
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(outW)}" height="${f(outH)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg: svg, w: w, h: h, outW: outW, outH: outH, ptPerUnit: ptPerUnit, L: L, ox: ox, oy: oy };
}

// Grow the canvas to hold what the other slides sharing this grid's place
// plot, so it prints at one size in one place on all of them. Each is laid out
// on this grid, at this grid's word size, only to learn how far it reaches.
function keepRoomFor(L, data, k) {
  const others = Array.isArray(data.roomFor) ? data.roomFor : [];
  if (!others.length) return;
  const frame = {};
  FRAME_FIELDS.forEach(function (name) { if (data[name] !== undefined) frame[name] = data[name]; });
  others.forEach(function (other) {
    if (!other || typeof other !== 'object') return;
    const one = Object.assign({}, frame);
    PLOTTED_FIELDS.forEach(function (name) { if (other[name] !== undefined) one[name] = other[name]; });
    const b = layoutGrid(one, k).bounds;
    L.bounds.x1 = Math.min(L.bounds.x1, b.x1); L.bounds.y1 = Math.min(L.bounds.y1, b.y1);
    L.bounds.x2 = Math.max(L.bounds.x2, b.x2); L.bounds.y2 = Math.max(L.bounds.y2, b.y2);
  });
}

function tightSvg(data, profile) {
  const drawn = draw(data, profile);
  return { svg: drawn.svg, aspect: drawn.w / drawn.h, w: drawn.outW, h: drawn.outH };
}

// The same layout without the drawing: where each number, name, letter and note
// landed, in the finished picture's own units, for the check that none of them
// overlaps another or leaves the picture.
function describeLayout(data, profile) {
  const drawn = draw(data, profile);
  const L = drawn.L;
  const shift = function (box) { return { x: box.x + drawn.ox, y: box.y + drawn.oy, w: box.w, h: box.h }; };
  const place = function (p) { return { x: p.x + drawn.ox, y: p.y + drawn.oy }; };
  return {
    w: drawn.w,
    h: drawn.h,
    cell: CELL,
    // The words' multiplier, and (in a box) the size in points that the axis
    // numbers, the letters and one square print at.
    textScale: L.S.k,
    ptPerUnit: drawn.ptPerUnit,
    numberPt: drawn.ptPerUnit ? L.S.NUM_FONT * drawn.ptPerUnit : null,
    letterPt: drawn.ptPerUnit ? L.S.LABEL_FONT * drawn.ptPerUnit : null,
    squarePt: drawn.ptPerUnit ? CELL * drawn.ptPerUnit : null,
    range: L.range,
    plot: shift(L.plot),
    origin: place({ x: L.X(0), y: L.Y(0) }),
    at: function (gx, gy) { return place({ x: L.X(gx), y: L.Y(gy) }); },
    quadrants: L.quadrants.map(function (q) { return { key: q.key, box: shift(q.box) }; }),
    numbers: L.numberItems.map(function (n) { return { axis: n.axis, value: n.value, text: n.text, box: shift(n.box) }; }),
    axisNames: L.nameItems.map(function (n) { return { axis: n.axis, text: n.text, box: shift(n.box) }; }),
    marks: L.marks.map(function (m) {
      return {
        x: m.grid.x, y: m.grid.y, style: m.style, at: place(m.at),
        label: m.letter ? m.letter.text : '', labelBox: m.letter ? shift(m.letter.box) : null, seat: m.letter ? m.letter.seat : null,
        inShape: Boolean(m.shape), answer: m.answer || false
      };
    }),
    shapes: L.shapes.map(function (s) {
      return {
        image: s.image, answer: s.answer === true, vertices: s.poly.map(place),
        inside: s.insideText ? { text: s.insideText.text, font: s.insideText.font, box: shift(s.insideText.box), within: s.insideText.within } : null
      };
    }),
    arrows: L.arrowItems.map(function (a) {
      return {
        steps: a.steps, answer: a.answer,
        legs: a.legs.map(function (leg) {
          return {
            from: place({ x: leg.x1, y: leg.y1 }), to: place({ x: leg.x2, y: leg.y2 }),
            count: leg.countText ? { text: leg.countText.text, box: shift(leg.countText.box) } : null
          };
        })
      };
    }),
    notes: L.noteItems.map(function (n) { return { quadrant: n.key, lines: n.lines, font: n.font, box: shift(n.box) }; }),
    highlighted: Array.from(L.marked)
  };
}

module.exports = { tightSvg, cacheKey, describeLayout, gridSpan, pickSpec, withoutAnswers, SPEC_FIELDS, PLOTTED_FIELDS, FRAME_FIELDS };
