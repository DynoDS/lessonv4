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
//   palette     `colour` on the board and the wall; `sheet` on a pupil sheet,
//               the same colours with nothing painted as an answer; `ink` on
//               the stick-in pack, which is photocopied
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
  // A pupil sheet: the board's colours with one difference. Nothing on a sheet
  // a child is about to work on has been worked out yet, so a value a drawing
  // would paint answer green prints in the ink of everything else handed to
  // the child. Green on the teacher's answer sheet means "this is the answer"
  // (30 September 2026), and a Greater Depth subtraction sheet whose given
  // digits printed green read as already marked (stress test, 7 October 2026).
  sheet: Object.freeze({
    ink: '#000000',
    arrow: '#CC0000',
    jump: '#0070C0',
    highlight: '#C65911',
    answer: '#000000',
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

// The greys an ink drawing may use where its board drawing tells parts apart by
// colour. A photocopier keeps brightness and loses hue, so two parts that were
// blue and orange stay apart only if they land on different steps here. Solid
// marks take `ink` or `dark`; fills take `light` or `pale`, which stay light
// enough for a child's pencil to show on top.
const INK_TONES = Object.freeze({
  ink: '#1A1A1A',
  dark: '#4D4D4D',
  mid: '#8C8C8C',
  light: '#BFBFBF',
  pale: '#E6E6E6',
  paper: '#FFFFFF',
});

// Whether a drawing is being drawn for a photocopied surface. The older
// drawings, laid out in their own units and scaled by whoever places them, take
// a profile for this alone, so they print in ink on the stick-in pack and keep
// their colours everywhere else.
function printsInInk(profile) {
  return Boolean(profile && typeof profile === 'object' && profile.palette === 'ink');
}

// The colour a drawing gives something worked out: its own answer colour on
// the board and the wall, and `plain` (what the same thing looks like when it
// is simply given) on a pupil sheet, where nothing is an answer. Every drawing
// with an answer colour of its own asks here, so one drawing cannot keep the
// habit the column sum had. A ring or a highlight that points at something is
// not an answer and does not ask.
function answerColour(profile, answer, plain) {
  return profile && typeof profile === 'object' && profile.palette === 'sheet' ? plain : answer;
}

// What an older drawing, which takes a profile only to learn how to colour
// itself, is handed on a pupil sheet.
const SHEET_COLOURING = Object.freeze({ surface: 'worksheets', palette: 'sheet' });

// The grey a colour becomes on a photocopier, for a drawing whose colours are
// chosen per part (a lesson's own fill, a rainforest band, a food group). Two
// fills that differed in brightness stay different; `lightest` and `darkest`
// keep a fill in the range where a pencil mark on top still shows. Returns the
// colour unchanged if it is not a hex colour, so a caller can pass anything.
function inkGrey(colour, { lightest = 0xF2, darkest = 0x00 } = {}) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(colour == null ? '' : colour).trim());
  if (!m) return colour;
  const hex = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const level = Math.round(Math.max(darkest, Math.min(lightest, 0.299 * r + 0.587 * g + 0.114 * b)));
  const two = level.toString(16).padStart(2, '0').toUpperCase();
  return `#${two}${two}${two}`;
}

const PROFILES = Object.freeze({
  // 24pt numerals that reach 18pt at the least: the projection floor the deck
  // holds every other piece of board text to (builder/src/styles.js MIN_FONT_PT).
  slides: Object.freeze({ surface: 'slides', fontPt: 24, minFontPt: 18, bold: true, grow: 1.6, palette: 'colour' }),
  // A little under the sheet's 12pt body, as the axis numbers always were.
  // `titlePt` is the one size a drawing's own title prints at on a sheet. Each
  // drawing used to size its title from however far it had been stretched, so a
  // tally chart and the bar chart beside it carried the same words at 17pt and
  // 20pt (stress test, 7 October 2026). A title too wide for its drawing is
  // still set smaller by that drawing.
  worksheets: Object.freeze({ surface: 'worksheets', fontPt: 10.5, minFontPt: 9, titlePt: 20, bold: false, grow: 1, palette: 'sheet' }),
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

module.exports = { PROFILES, PALETTES, INK_TONES, FONT, MM_TO_PT, profileFor, printsInInk, inkGrey, answerColour, SHEET_COLOURING };
