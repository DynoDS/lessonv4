'use strict';

// How one shared drawing is drawn for each surface it reaches.
//
// A picture is drawn once, in shared/visuals/, and the board, the worksheet, the
// working wall and the stick-in pack all place that one drawing (13 September
// 2026: the number line had been drawn four ways, and a wall card looked nothing
// like the slide beside it). What legitimately differs between surfaces is not
// the picture but how big its words must print to be read there, and whether
// colour survives the trip:
//
//   fontPt      the size the drawing's words print at on that surface
//   minFontPt   the floor below which the words stop being readable there; a
//               drawing squeezed into less room shrinks its rules and gaps first
//               and refuses by name rather than going under this
//   bold        the board and the wall are read across a room
//   grow        how far a drawing may enlarge into spare room (the board only)
//   palette     `colour` everywhere except the stick-in pack, which is
//               photocopied, so its drawing stays in ink
//
// A drawing's shape, proportions, colours and marks are the same on all four.
// Nothing here may change what a picture shows.

const FONT = "'Comic Sans MS', 'Comic Sans', 'Comic Neue', sans-serif";

const PALETTES = Object.freeze({
  // The board's colours, which every coloured surface now shares: a red arrow
  // pointing at a place, a blue jump (the child's move), the house orange for a
  // highlighted space, green for an answer.
  colour: Object.freeze({
    ink: '#000000',
    arrow: '#CC0000',
    jump: '#0070C0',
    highlight: '#C65911',
    answer: '#00B050',
    label: '#0070C0',
    paper: '#FFFFFF',
  }),
  ink: Object.freeze({
    ink: '#1A1A1A',
    arrow: '#1A1A1A',
    jump: '#1A1A1A',
    highlight: '#8C8C8C',
    answer: '#1A1A1A',
    label: '#1A1A1A',
    paper: '#FFFFFF',
  }),
});

const PROFILES = Object.freeze({
  // 24pt numerals that reach 18pt at the least: the projection floor the deck
  // holds every other piece of board text to (builder/src/styles.js MIN_FONT_PT).
  slides: Object.freeze({ surface: 'slides', fontPt: 24, minFontPt: 18, bold: true, grow: 1.6, palette: 'colour' }),
  // A little under the sheet's 12pt body, as the axis numbers always were.
  worksheets: Object.freeze({ surface: 'worksheets', fontPt: 10.5, minFontPt: 9, bold: false, grow: 1, palette: 'colour' }),
  // A wall card is read from across the room, all term: the size the wall's
  // own number line had, as a share of a card-wide drawing.
  wall: Object.freeze({ surface: 'wall', fontPt: 28, minFontPt: 20, bold: true, grow: 1, palette: 'colour' }),
  // The child's own copy, glued in a book and photocopied.
  stickin: Object.freeze({ surface: 'stickin', fontPt: 11, minFontPt: 9, bold: false, grow: 1, palette: 'ink' }),
});

const MM_TO_PT = 72 / 25.4;

// A profile for a surface, with the physical box the drawing will occupy.
// widthPt is required; heightPt is a ceiling the board passes (a slide zone has
// a fixed depth) and paper leaves out (a sheet grows downwards).
function profileFor(surface, box = {}) {
  const base = PROFILES[surface];
  if (!base) throw new Error(`Unknown surface "${surface}"; expected ${Object.keys(PROFILES).join(', ')}.`);
  const widthPt = box.widthPt != null ? box.widthPt : box.widthMm != null ? box.widthMm * MM_TO_PT : null;
  const heightPt = box.heightPt != null ? box.heightPt : box.heightMm != null ? box.heightMm * MM_TO_PT : null;
  if (!(widthPt > 0)) throw new Error(`A ${surface} drawing needs the width it will print at.`);
  return Object.freeze({
    ...base,
    ...(box.overrides || {}),
    widthPt,
    heightPt: heightPt > 0 ? heightPt : null,
    font: FONT,
    colours: PALETTES[(box.overrides && box.overrides.palette) || base.palette],
  });
}

module.exports = { PROFILES, PALETTES, FONT, MM_TO_PT, profileFor };
