'use strict';

// THE map. One drawing, placed by the board, the worksheet, the working wall and
// the stick-in pack.
//
// It was four. The board drew the marked map as PowerPoint shapes over the stock
// image and prepared its country shading, its globe and its labelled world map
// through the sharp image library before any slide was drawn; the sheet drew
// its own SVG with labels sized as a share of the image; the stick-in pack drew
// a third, write-on world; and the wall could not draw a map at all, so a
// Year 4 wall designer left the Amazon's location off the wall because "the map
// visual supports are not available as reusable wall assets". The same labels
// printed at 18pt pills on the board, at a share of the picture on paper, at
// 9pt-equivalent letters in a Year 4 book, and the fonts were Aptos, Arial and
// Comic Sans depending on which file drew them (13 September 2026). This file is
// the one place a map is drawn; each surface passes only the box it has and its
// profile (shared/visuals/surface-profiles.js): how big its words must print and
// whether it is in colour.
//
// A map depicts the real world, so the land always comes from the shipped image
// in builder/assets/maps and is never drawn from coordinates (see
// map-annotations.js and `depicts: 'asset:maps'` in shared/visual-parity.js).
// Everything here is placed ON that image: marks, labels, markers, write-on
// boxes, latitude lines computed from the image's own grid, and the teaching
// cues around it. The two treatments that change the image's own pixels (a
// country filled inside its border, the globe) are in map-pixels.js and still
// start from the shipped file.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   resolve(spec)           -> the validated spec, with its `mode`
//   describeLayout(spec, profile) -> where everything landed, in points
//
// ─── the modes (one spec vocabulary, chosen by the fields the designers use) ─
//
//   marked   { map, annotations, key, selectedCountry, basin, labels, caption }
//            any shipped map with the lesson's marks on top
//   world    { map: "world-with-antarctica", presentation: "seven-continent-world",
//              continentLabels, oceanLabels, seaLabels, clueMarkers, focus,
//              showEquator, showTropics, showCompass, joinedEdges, annotations, key }
//   write-on { map: "world-with-antarctica", worksheetMode: "continents-and-oceans",
//              continentMarkers x7, oceanMarkers x5, seaInitialSpaces x3,
//              showEquator, showCompass, joinedEdges }
//   globe    { map: "world", presentation: "globe-to-flat", revealStage,
//              suppressSecondPacific, notes }
//
// `heightMm` asks for the drawing to print that tall (the sheet's own size
// field); the drawing gives up width to meet it, and the surface centres it.

const fs = require('fs');
const maps = require('./map-annotations');
const pixels = require('./map-pixels');
const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor, MM_TO_PT } = require('./surface-profiles');

// ─── CONSTANTS (lengths in ems of the text size T, unless named otherwise) ──
const BAND = 1.3;                 // one line of text, with its leading
const FONT_STEP = 0.5;            // points dropped per attempt when things crowd
const PILL_H = 1.55;              // a label pill's height
const PILL_PAD = 0.45;            // text inset each side of a pill
const CUE_SIZE = 0.8;             // the cut line's name on the globe
const MARKER_R = 0.85;            // a numbered or lettered marker's radius
const MARKER_GAP = 0.3;           // clear air a label keeps from a marker
const SEA_BOX_W = 2.4;            // a write-on box for a sea's initial
const SEA_BOX_H = 1.6;
const COMPASS_R = 1.5;
const COMPASS_INSET = 0.6;
const DOT_R = 0.26;               // a point annotation
const DOT_R_MIN_PT = 2.8;
const STROKE = 0.13;              // an annotation's line
const STROKE_MIN_PT = 1.5;
const HALO = 2.3;                 // white halo under a line, in strokes
const LATITUDE_STROKE = 0.08;
const EDGE_BAND = 0.5;            // the patterned Pacific edge, at least
const EDGE_BAND_SHARE = 0.012;    // ...or this share of the map's width
const FOOTER_DROP = 1.4;          // how far the joined-edge arrows curve down
const KEY_SWATCH_W = 1.5;
const KEY_SWATCH_H = 1.0;
const KEY_SPACING = 1.5;
const GAP = 0.45;                 // between stacked parts of the picture
const FOCUS_MAP_SHARE = 0.6;      // the overview's share of a focus picture
const FOCUS_GAP = 1.4;
const MIN_MAP_W = 4;              // below this a map is not a map any more
const GLOBE_ARROW_GAP = 2.0;      // between the globe-to-flat panels
const FLAT_WEIGHT = 1.83;         // the flat panel's width against a globe's
const GLOBE_PX = 640;             // pixels in each projected globe
const MAX_TITLE_LINES = 2;
const MAX_NOTE_LINES = 3;
const MAX_FOCUS_TITLE_LINES = 2;
// ────────────────────────────────────────────────────────────────────────────

const MAX_CONTINENT_LABELS = 7;
const MAX_OCEAN_LABELS = 5;
const MAX_SEA_LABELS = 5;
const MAX_CLUE_MARKERS = 12;
const WRITE_ON_CONTINENTS = 7;
const WRITE_ON_OCEANS = 5;
const WRITE_ON_SEA_SPACES = 3;
const MAX_NOTE_CHARS = 110;

// A marker whose spot a name label also claims is the answer version of that
// marker: the name replaces the letter rather than sitting on top of it. The
// starter's answer slide named South America and Africa at the same points as
// markers A and B, and the letters sat on top of the names.
const MARKER_NAMED_WITHIN = 0.02;

const WORLD_KEY = 'world-with-antarctica';
const GLOBE_KEY = 'world';

// The shipped world-with-antarctica asset is a full equirectangular world:
// 1800 x 900, -180 to 180 by -90 to 90. So a line of latitude is arithmetic on
// the real image rather than a line drawn where it looks about right, which is
// the only reason a map is allowed to draw one at all.
const LATITUDES = [
  { key: 'equator', lat: 0, text: 'Equator' },
  { key: 'cancer', lat: 23.5, text: 'Tropic of Cancer' },
  { key: 'capricorn', lat: -23.5, text: 'Tropic of Capricorn' },
];
// Where along its line a latitude's name may sit, tried in order until one is
// clear of the markers and the compass. The Equator's name once printed on the
// joined-edge Pacific marker because it had one fixed place.
const LATITUDE_LABEL_AT = [0.2, 0.74, 0.5, 0.35, 0.62, 0.88, 0.1];

// The house colours a map uses, named for what they mean on it.
const HOUSE = Object.freeze({
  orange: '#C65911',
  blue: '#0070C0',
  green: '#2E7D45',
  navy: '#17365D',
  grey: '#333333',
  text: '#1A1A1A',
  paleOrange: '#FFF2CC',
  paleBlue: '#DDEBF7',
  paleGreen: '#E2F0D9',
  white: '#FFFFFF',
});

// Country shading on the South America map. The seed and the colour were read
// off the real south-america.png; the fill stops at Brazil's printed border.
const COUNTRY_FILL = { r: 189, g: 220, b: 235 };

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

function f2(n) {
  return Math.round(n * 100) / 100;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// An error a smaller text size might cure: the loop in describeLayout tries the
// next size down before it lets this one out.
function crowding(message) {
  const e = new Error(message);
  e.smallerMayFit = true;
  return e;
}

// ─── reading the spec ───────────────────────────────────────────────────────

function normalisePresentation(value) {
  return String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
}

function fractionPair(value, label, code) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(code + ': ' + label + ' must be [x, y].');
  }
  const pair = value.map(Number);
  if (pair.some((n) => !Number.isFinite(n) || n < 0 || n > 1)) {
    throw new Error(code + ': ' + label + ' coordinates must be fractions from 0 to 1.');
  }
  return pair;
}

function labelsFor(d) {
  if (d.labels === false) return { country: '', basin: '' };
  const labels = d.labels && typeof d.labels === 'object' ? d.labels : {};
  return { country: String(labels.country || ''), basin: String(labels.basin || '') };
}

function assetOf(key) {
  const entry = maps.mapEntry(key);
  if (!entry) {
    throw new Error(
      'MAP_UNKNOWN: ' + JSON.stringify(String(key || '')) +
        ' is not a shipped map. Available: ' + Object.keys(maps.MAPS).join(', ') + '.'
    );
  }
  return entry;
}

// The two overlays exist only on the South America map, because their shapes
// were read off that image. Asked for anywhere else they used to be dropped
// without a word, which hands a teacher a map missing the one thing it was for.
function checkOverlaysBelong(d, key) {
  maps.checkOverlaySupport(d);
  for (const field of ['selectedCountry', 'basin']) {
    if (maps.normaliseOverlayName(d[field]) && key !== 'south-america') {
      throw new Error(
        'MAP_OVERLAY_UNSUPPORTED: ' + field + ' ' + JSON.stringify(String(d[field])) +
          ' is drawn on map "south-america" only, where its shape was read off the real image. ' +
          'On this map, mark the place with an annotation instead.'
      );
    }
  }
}

function worldTextItems(raw, label, max) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > max) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: ' + label + ' accepts at most ' + max + ' labels.');
  }
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: ' + label + '[' + index + '] must be an object.');
    }
    const text = String(item.text == null ? '' : item.text).trim();
    if (!text || text.length > 34) {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: ' + label + '[' + index + '].text must be 1-34 characters.');
    }
    const code = 'SEVEN_CONTINENT_MAP_INVALID';
    return {
      text,
      at: fractionPair(item.at, label + '[' + index + '].at', code),
      labelAt: item.labelAt == null ? null : fractionPair(item.labelAt, label + '[' + index + '].labelAt', code),
      repeatAt: item.repeatAt == null ? null : fractionPair(item.repeatAt, label + '[' + index + '].repeatAt', code),
    };
  });
}

function clueMarkers(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_CLUE_MARKERS) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: clueMarkers accepts at most ' + MAX_CLUE_MARKERS + ' markers.');
  }
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: clueMarkers[' + index + '] must be an object.');
    }
    const marker = String(item.marker == null ? '' : item.marker).trim();
    if (!marker || marker.length > 3) {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: clueMarkers[' + index + '].marker must be 1-3 characters.');
    }
    const kind = String(item.kind || 'continent').trim().toLowerCase();
    if (kind !== 'continent' && kind !== 'ocean' && kind !== 'sea') {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: clue marker kind must be continent, ocean or sea.');
    }
    const code = 'SEVEN_CONTINENT_MAP_INVALID';
    return {
      marker,
      kind,
      at: fractionPair(item.at, 'clueMarkers[' + index + '].at', code),
      repeatAt: item.repeatAt == null ? null : fractionPair(item.repeatAt, 'clueMarkers[' + index + '].repeatAt', code),
    };
  });
}

function focusSpec(raw) {
  if (raw == null) return null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: focus must be an object.');
  }
  const code = 'SEVEN_CONTINENT_MAP_INVALID';
  const centre = fractionPair(raw.centre, 'focus.centre', code);
  const span = fractionPair(raw.span, 'focus.span', code);
  if (span[0] < 0.03 || span[0] > 0.55 || span[1] < 0.03 || span[1] > 0.55) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: focus.span values must be from 0.03 to 0.55.');
  }
  const title = String(raw.title || '').trim();
  if (!title || title.length > 42) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: focus.title must be 1-42 characters.');
  }
  return { centre, span, title };
}

function writeOnMarkers(raw, label, max) {
  if (!Array.isArray(raw) || raw.length > max) {
    throw new Error('MAP_WRITE_ON_INVALID: ' + label + ' must contain at most ' + max + ' markers.');
  }
  const seen = new Set();
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('MAP_WRITE_ON_INVALID: ' + label + '[' + index + '] must be an object.');
    }
    const marker = String(item.marker == null ? '' : item.marker).trim();
    if (!marker || marker.length > 3) {
      throw new Error('MAP_WRITE_ON_INVALID: ' + label + '[' + index + '].marker must be 1-3 characters.');
    }
    if (seen.has(marker)) {
      throw new Error('MAP_WRITE_ON_INVALID: duplicate marker ' + JSON.stringify(marker) + ' in ' + label + '.');
    }
    seen.add(marker);
    const code = 'MAP_WRITE_ON_INVALID';
    return {
      marker,
      at: fractionPair(item.at, label + '[' + index + '].at', code),
      repeatAt: item.repeatAt == null ? null : fractionPair(item.repeatAt, label + '[' + index + '].repeatAt', code),
    };
  });
}

function resolveWriteOn(d) {
  if (maps.normaliseMapKey(d.map) !== WORLD_KEY) {
    throw new Error('MAP_WRITE_ON_INVALID: worksheetMode "continents-and-oceans" requires map "' + WORLD_KEY + '".');
  }
  const continentMarkers = writeOnMarkers(d.continentMarkers || [], 'continentMarkers', WRITE_ON_CONTINENTS);
  const oceanMarkers = writeOnMarkers(d.oceanMarkers || [], 'oceanMarkers', WRITE_ON_OCEANS);
  if (continentMarkers.length !== WRITE_ON_CONTINENTS || oceanMarkers.length !== WRITE_ON_OCEANS) {
    throw new Error('MAP_WRITE_ON_INVALID: the complete task needs exactly 7 continentMarkers and 5 oceanMarkers.');
  }
  if (oceanMarkers.filter((item) => item.repeatAt).length !== 1) {
    throw new Error('MAP_WRITE_ON_INVALID: exactly one ocean marker must have repeatAt for the Pacific at both map edges.');
  }
  const spaces = d.seaInitialSpaces;
  if (!Array.isArray(spaces) || spaces.length !== WRITE_ON_SEA_SPACES) {
    throw new Error('MAP_WRITE_ON_INVALID: seaInitialSpaces must contain exactly 3 water positions.');
  }
  // A write-on map carries markers and boxes and nothing that names a place: it
  // is the child's retrieval task, and the stick-in pack forces this form even
  // when a labelled teaching map was copied across, so no label field is read.
  return {
    mode: 'write-on',
    key: WORLD_KEY,
    entry: assetOf(WORLD_KEY),
    continentLabels: [], oceanLabels: [], seaLabels: [], clueMarkers: [],
    writeOnMarkers: [
      ...continentMarkers.map((m) => ({ ...m, kind: 'continent' })),
      ...oceanMarkers.map((m) => ({ ...m, kind: 'ocean' })),
    ],
    seaInitialSpaces: spaces.map((p, i) => fractionPair(p, 'seaInitialSpaces[' + i + ']', 'MAP_WRITE_ON_INVALID')),
    annotations: [],
    mapKeyEntries: [],
    focus: null,
    showEquator: d.showEquator !== false,
    showTropics: false,
    showCompass: d.showCompass !== false,
    joinedEdges: d.joinedEdges !== false,
    labels: { country: '', basin: '' },
    country: '', basin: '',
    caption: '',
  };
}

function resolveWorld(d) {
  if (maps.normaliseMapKey(d.map) !== WORLD_KEY) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: presentation "seven-continent-world" requires map "' + WORLD_KEY + '".');
  }
  checkOverlaysBelong(d, WORLD_KEY);
  const oceanLabels = worldTextItems(d.oceanLabels, 'oceanLabels', MAX_OCEAN_LABELS);
  if (oceanLabels.filter((item) => item.repeatAt).length > 1) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: only the Pacific ocean label may repeat at both edges.');
  }
  return {
    mode: 'world',
    key: WORLD_KEY,
    entry: assetOf(WORLD_KEY),
    continentLabels: worldTextItems(d.continentLabels, 'continentLabels', MAX_CONTINENT_LABELS),
    oceanLabels,
    seaLabels: worldTextItems(d.seaLabels, 'seaLabels', MAX_SEA_LABELS),
    clueMarkers: clueMarkers(d.clueMarkers),
    writeOnMarkers: [],
    seaInitialSpaces: [],
    // Marks on the world map. These used to be dropped here without a word: the
    // presentation was written for naming continents and oceans, so it ignored
    // `annotations` entirely, and a lesson that asked for the rainforests to be
    // shaded got a bare map and no error. That silence is why a rainforest
    // lesson had nowhere to put its rainforests.
    annotations: maps.resolveAnnotations(d),
    mapKeyEntries: maps.resolveKey(d),
    focus: focusSpec(d.focus),
    showEquator: d.showEquator === true || d.showTropics === true,
    showTropics: d.showTropics === true,
    showCompass: d.showCompass !== false,
    joinedEdges: d.joinedEdges === true,
    labels: { country: '', basin: '' },
    country: '', basin: '',
    caption: String(d.caption || '').trim(),
  };
}

function resolveMarked(d) {
  const key = maps.normaliseMapKey(d.map);
  const entry = assetOf(key);
  checkOverlaysBelong(d, key);
  return {
    mode: 'marked',
    key,
    entry,
    continentLabels: [], oceanLabels: [], seaLabels: [], clueMarkers: [], writeOnMarkers: [], seaInitialSpaces: [],
    annotations: maps.resolveAnnotations(Object.assign({}, d, { map: key })),
    mapKeyEntries: maps.resolveKey(d),
    focus: null,
    showEquator: false, showTropics: false, showCompass: false, joinedEdges: false,
    // Country shading used to be refused on paper ("drawn on the board only")
    // because the fill worked on the image through the board's image library.
    // It is made in map-pixels.js now, so the sheet, the wall and the book shade
    // the same Brazil the board does.
    country: maps.normaliseOverlayName(d.selectedCountry),
    basin: maps.normaliseOverlayName(d.basin),
    // `labels` prints only words somebody wrote: naming a country in
    // selectedCountry asks for it to be SHADED, and a map for "which country is
    // this?" must not answer its own question.
    labels: labelsFor(d),
    caption: String(d.caption || '').trim(),
  };
}

function resolveGlobe(d) {
  if (maps.normaliseMapKey(d.map) !== GLOBE_KEY) {
    throw new Error('MAP_TRANSFORMATION_UNSUPPORTED: globe-to-flat requires map "world".');
  }
  if ((d.annotations && d.annotations.length) || d.selectedCountry || d.basin) {
    throw new Error(
      'MAP_TRANSFORMATION_UNSUPPORTED: globe-to-flat explains the projection and cannot also carry place annotations or region overlays.'
    );
  }
  const revealStage = d.revealStage === undefined ? 3 : Number(d.revealStage);
  if (![1, 2, 3].includes(revealStage)) {
    throw new Error('MAP_TRANSFORMATION_INVALID: revealStage must be 1, 2 or 3.');
  }
  if (d.suppressSecondPacific !== undefined && typeof d.suppressSecondPacific !== 'boolean') {
    throw new Error('MAP_TRANSFORMATION_INVALID: suppressSecondPacific must be true or false.');
  }
  const defaults = {
    globe: 'A globe has no beginning or end.',
    cut: 'Choose one cut through the Pacific Ocean.',
    flat: 'Open the cut and lay the surface flat.',
  };
  const rawNotes = d.notes === undefined ? {} : d.notes;
  if (!rawNotes || typeof rawNotes !== 'object' || Array.isArray(rawNotes)) {
    throw new Error('MAP_TRANSFORMATION_INVALID: notes must be an object with globe, cut and flat text.');
  }
  const notes = {};
  for (const k of ['globe', 'cut', 'flat']) {
    notes[k] = rawNotes[k] === undefined ? defaults[k] : String(rawNotes[k]).trim();
    if (notes[k].length > MAX_NOTE_CHARS) {
      throw new Error('MAP_TRANSFORMATION_INVALID: notes.' + k + ' must be ' + MAX_NOTE_CHARS + ' characters or fewer.');
    }
  }
  return {
    mode: 'globe',
    key: GLOBE_KEY,
    entry: assetOf(GLOBE_KEY),
    revealStage,
    // One joined-edge Pacific explanation by default, because two labels at
    // the two edges read to a child as two oceans.
    suppressSecondPacific: d.suppressSecondPacific !== false,
    notes,
    caption: String(d.caption || '').trim(),
  };
}

function resolve(spec) {
  const d = spec || {};
  // The write-on form wins over any presentation a copied spec carries: the
  // stick-in pack forces it so that an answer map pasted in from a slide cannot
  // print thirty pre-labelled copies.
  if (String(d.worksheetMode || '').trim() === 'continents-and-oceans') return resolveWriteOn(d);
  const presentation = normalisePresentation(d.presentation);
  if (!presentation) return resolveMarked(d);
  if (presentation === 'seven-continent-world') return resolveWorld(d);
  if (presentation === 'globe-to-flat') return resolveGlobe(d);
  throw new Error(
    'MAP_PRESENTATION_UNSUPPORTED: presentation ' + JSON.stringify(String(d.presentation)) +
      ' is not drawable. Supported: globe-to-flat, seven-continent-world.'
  );
}

// ─── measuring words ────────────────────────────────────────────────────────

function widthOf(text, pt, bold) {
  return textWidthEm(String(text), bold) * pt;
}

function wrap(text, maxW, pt, bold) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && widthOf(next, pt, bold) > maxW) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitsLines(lines, maxW, pt, bold) {
  return lines.every((l) => widthOf(l, pt, bold) <= maxW + 0.01);
}

// ─── colour ─────────────────────────────────────────────────────────────────

// The stick-in pack is photocopied, so its drawing stays in ink. A map key is
// the one place colour carries meaning a shape cannot: the child matches a
// wash to a word. In ink every wash is the same grey, so a key naming two
// colours is refused there rather than printed as two entries nobody can tell
// apart.
function paletteFor(profile, s) {
  const ink = profile.palette === 'ink';
  if (ink && s.mapKeyEntries && new Set(s.mapKeyEntries.map((k) => k.colour)).size > 1) {
    throw new Error(
      'MAP_KEY_NEEDS_COLOUR: this map\'s key tells ' + s.mapKeyEntries.length + ' shadings apart by colour, and this surface prints in ink, ' +
        'where every shading is the same grey. Use one shading on this copy, or give each region a label instead of a key.'
    );
  }
  const c = profile.colours;
  const tone = (hex) => (ink ? c.ink : hex);
  const pale = (hex) => (ink ? HOUSE.white : hex);
  return {
    ink,
    mark: (hexNoHash) => tone('#' + hexNoHash),
    orange: tone(HOUSE.orange),
    blue: tone(HOUSE.blue),
    green: tone(HOUSE.green),
    navy: tone(HOUSE.navy),
    grey: tone(HOUSE.grey),
    text: ink ? c.ink : HOUSE.text,
    paleOrange: pale(HOUSE.paleOrange),
    paleBlue: pale(HOUSE.paleBlue),
    paleGreen: pale(HOUSE.paleGreen),
    white: HOUSE.white,
    kind: (kind) => (kind === 'continent' ? tone(HOUSE.orange) : kind === 'sea' ? tone(HOUSE.green) : tone(HOUSE.blue)),
    kindFill: (kind) => (kind === 'continent' ? pale(HOUSE.paleOrange) : kind === 'sea' ? pale(HOUSE.paleGreen) : pale(HOUSE.paleBlue)),
  };
}

// ─── the size loop ──────────────────────────────────────────────────────────

function sizesFor(profile) {
  const sizes = [];
  for (let pt = profile.fontPt; pt >= profile.minFontPt - 1e-9; pt -= FONT_STEP) sizes.push(Math.round(pt * 10) / 10);
  if (!sizes.length) sizes.push(profile.fontPt);
  return sizes;
}

function requestedHeightPt(spec) {
  if (!spec || spec.heightMm === undefined || spec.heightMm === null) return null;
  const mm = Number(spec.heightMm);
  if (!(mm > 0)) throw new Error('MAP_SIZE_INVALID: heightMm must be a positive number of millimetres; received ' + JSON.stringify(spec.heightMm) + '.');
  return mm * MM_TO_PT;
}

// The widest drawing whose height fits the ceiling. Words keep their size and
// the picture gives up width, because the picture can be smaller and still be
// right, and the words cannot be smaller and still be read.
function widthForHeight(compose, maxW, ceiling, T, what) {
  const full = compose(maxW);
  if (!ceiling || full.h <= ceiling + 1e-6) return full;
  // Height does not fall steadily with width: a narrower picture wraps its
  // caption and key onto more lines. So step down from the full width to the
  // widest that fits, then close in between that step and the one above it.
  const floorW = MIN_MAP_W * T;
  const STEPS = 48;
  let best = null;
  let hi = maxW;
  for (let i = 1; i <= STEPS; i += 1) {
    const w = maxW - ((maxW - floorW) * i) / STEPS;
    const trial = compose(w);
    if (trial.h <= ceiling - 0.05) { best = trial; break; }
    hi = w;
  }
  if (!best) {
    throw crowding(
      'MAP_ZONE_TOO_SHALLOW: ' + what + ' cannot fit its words at a readable size in a space ' + f2(ceiling / 72) +
        'in tall. Give the map more height, or carry fewer parts (a key, a caption, a footer) on this one.'
    );
  }
  let lo = best.w;
  for (let i = 0; i < 20; i += 1) {
    const mid = (lo + hi) / 2;
    const trial = compose(mid);
    if (trial.h <= ceiling - 0.05) { best = trial; lo = mid; } else { hi = mid; }
  }
  return best;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const s = resolve(spec);
  const palette = paletteFor(profile, s);
  const requested = requestedHeightPt(spec);
  const ceilings = [profile.heightPt, requested].filter((v) => v > 0);
  const ceiling = ceilings.length ? Math.min(...ceilings) : null;
  let last = null;
  // Paper and the wall grow downwards, so a globe-to-flat too narrow for its
  // three panels in a row may put the flat map on a row of its own before its
  // words shrink. The board has a fixed depth, where a second row would only
  // shrink the pictures, so it keeps one row.
  const globeRows = s.mode === 'globe' && s.revealStage === 3 && !profile.heightPt ? [1, 2] : [1];
  const attempts = [];
  for (const T of sizesFor(profile)) {
    if (s.mode === 'globe') globeRows.forEach((rows) => attempts.push({ T, rows }));
    else attempts.push({ T });
  }
  for (const { T, rows } of attempts) {
    try {
      const L = s.mode === 'globe' ? layoutGlobe(s, profile, T, ceiling, rows) : layoutMap(s, profile, T, ceiling, palette);
      // The drawing stays tight to its own ink; a surface centres a drawing
      // narrower than its space, as the sheet always placed a map sized by
      // its height.
      L.offsetX = 0;
      L.canvasW = L.w;
      L.s = s;
      L.palette = palette;
      L.profile = profile;
      return L;
    } catch (error) {
      if (!error.smallerMayFit) throw error;
      last = error;
    }
  }
  throw last;
}

// ─── the map compositions (marked, world, write-on) ─────────────────────────

function pillSize(text, pt) {
  return { w: widthOf(text, pt, true) + 2 * PILL_PAD * pt, h: PILL_H * pt };
}

function layoutMap(s, profile, T, ceiling, palette) {
  const entry = s.entry;
  const aspect = entry.w / entry.h;
  const W = profile.widthPt;
  const bold = true;
  const what = 'the ' + s.key + ' map';

  function compose(w) {
    const out = { w, T };
    let mapW = w;
    let focus = null;
    if (s.focus) {
      mapW = w * FOCUS_MAP_SHARE;
      const zoomW = w - mapW - FOCUS_GAP * T;
      const cropW = entry.w * s.focus.span[0];
      const cropH = entry.h * s.focus.span[1];
      const mapH0 = mapW / aspect;
      const zoomH = Math.min(Math.max(zoomW / (cropW / cropH), mapH0 * 0.6), mapH0 * 1.4);
      const titleLines = wrap(s.focus.title, zoomW - 2 * PILL_PAD * T, T, bold);
      const titleH = titleLines.length * BAND * T + 0.5 * T;
      focus = { zoomW, zoomH, cropW, cropH, titleLines, titleH };
    }
    const mapH = mapW / aspect;
    const bodyH = focus ? Math.max(mapH, focus.titleH + GAP * T + focus.zoomH) : mapH;
    out.map = { x: 0, y: (bodyH - mapH) / 2, w: mapW, h: mapH };
    if (focus) {
      focus.x = mapW + FOCUS_GAP * T;
      focus.titleY = (bodyH - (focus.titleH + GAP * T + focus.zoomH)) / 2;
      focus.zoomY = focus.titleY + focus.titleH + GAP * T;
      out.focus = focus;
    }
    let y = bodyH;
    if (s.joinedEdges && !s.focus) {
      const text = s.mode === 'write-on' || s.mode === 'world' ? 'These patterned edges join: one Pacific Ocean' : '';
      const room = w - 6 * T;
      const lines = widthOf(text, T, bold) <= room ? [text] : wrap(text, room, T, bold);
      out.footer = { y, lines, h: 0.3 * T + FOOTER_DROP * T + lines.length * BAND * T };
      y += out.footer.h;
    }
    if (s.mapKeyEntries.length) {
      const cells = s.mapKeyEntries.map((k) => ({ ...k, w: KEY_SWATCH_W * T + 0.4 * T + widthOf(k.text, T, bold) }));
      const rows = [];
      let row = [];
      let rowW = 0;
      cells.forEach((cell) => {
        const add = (row.length ? KEY_SPACING * T : 0) + cell.w;
        if (row.length && rowW + add > w) { rows.push({ cells: row, w: rowW }); row = []; rowW = 0; }
        rowW += (row.length ? KEY_SPACING * T : 0) + cell.w;
        row.push(cell);
      });
      if (row.length) rows.push({ cells: row, w: rowW });
      out.key = { y: y + GAP * T, rows, h: GAP * T + rows.length * 1.6 * T };
      y += out.key.h;
    }
    if (s.caption) {
      const lines = wrap(s.caption, w, T, false);
      out.caption = { y: y + GAP * T, lines, h: GAP * T + lines.length * BAND * T };
      y += out.caption.h;
    }
    out.h = y;
    return out;
  }

  const L = widthForHeight(compose, W, ceiling, T, what);
  if (!(L.map.w >= MIN_MAP_W * T)) {
    throw crowding('MAP_ZONE_TOO_SMALL: ' + what + ' would print ' + f2(L.map.w / 72) + 'in wide, too small to read. Give it a bigger space.');
  }
  // Words that must print on one row and do not fit the picture at this size.
  const tooWide = [];
  if (L.footer && !fitsLines(L.footer.lines, L.w, T, bold)) tooWide.push('the joined-edge note');
  if (L.key && L.key.rows.some((r) => r.w > L.w + 0.01)) tooWide.push('the key');
  if (L.focus && (L.focus.titleLines.length > MAX_FOCUS_TITLE_LINES || !fitsLines(L.focus.titleLines, L.focus.zoomW, T, bold))) tooWide.push('the focus title');
  if (L.caption && !fitsLines(L.caption.lines, L.w, T, false)) tooWide.push('the caption');
  if (tooWide.length) {
    throw crowding('MAP_TOO_NARROW: ' + tooWide.join(' and ') + ' on ' + what + ' cannot print at a readable size across ' + f2(L.w / 72) + 'in. Give the map more width.');
  }

  const m = L.map;
  // Words laid over the map print at the surface's readable floor, and words
  // around it at the surface's own size. A name on the map covers the geography
  // it names, so it is as small as it can be while still being read: at the
  // board's 24pt, seven continent and five ocean names hid most of the world
  // they were naming.
  const LT = profile.minFontPt;
  const fx = (p) => m.x + p[0] * m.w;
  const fy = (p) => m.y + p[1] * m.h;
  const obstacles = [];
  const asFraction = (bx) => ({ x: (bx.x - m.x) / m.w, y: (bx.y - m.y) / m.h, w: bx.w / m.w, h: bx.h / m.h });

  // Markers stay where the lesson put them; everything else keeps clear.
  const named = [...s.continentLabels, ...s.oceanLabels, ...s.seaLabels];
  const namedHere = (at) => named.some((label) => Math.abs(label.at[0] - at[0]) < MARKER_NAMED_WITHIN && Math.abs(label.at[1] - at[1]) < MARKER_NAMED_WITHIN);
  const markers = [];
  s.clueMarkers.forEach((item) => {
    if (namedHere(item.at)) return;
    [item.at, item.repeatAt].forEach((at) => { if (at) markers.push({ marker: item.marker, kind: item.kind, at }); });
  });
  s.writeOnMarkers.forEach((item) => {
    [item.at, item.repeatAt].forEach((at) => { if (at) markers.push({ marker: item.marker, kind: item.kind, at }); });
  });
  // Markers and write-on boxes sit on the map too, so they take the on-map size.
  const R = MARKER_R * LT;
  const clear = MARKER_GAP * LT;
  const placedMarks = [];
  markers.forEach((mk) => {
    mk.cx = fx(mk.at);
    mk.cy = fy(mk.at);
    mk.r = R;
    mk.pt = LT;
    const bx = { x: mk.cx - R - clear, y: mk.cy - R - clear, w: 2 * (R + clear), h: 2 * (R + clear) };
    obstacles.push(bx);
    // The clash test uses the circle's own square, not the clear air labels
    // keep: two markers that nearly touch are still two readable markers.
    placedMarks.push({ x: mk.cx - R, y: mk.cy - R, w: 2 * R, h: 2 * R, name: 'marker ' + mk.marker });
  });
  const seaBoxes = s.seaInitialSpaces.map((at, i) => {
    const bx = { x: fx(at) - (SEA_BOX_W * LT) / 2, y: fy(at) - (SEA_BOX_H * LT) / 2, w: SEA_BOX_W * LT, h: SEA_BOX_H * LT };
    obstacles.push(bx);
    placedMarks.push({ ...bx, name: 'sea space ' + (i + 1) });
    return bx;
  });
  // Two markers printed over each other cannot be told apart, and a child
  // writing an initial into a box that covers marker 3 has written on the
  // marker. Their places are the lesson's, so this is refused by name rather
  // than nudged somewhere the lesson did not put them.
  const clashes = [];
  for (let i = 0; i < placedMarks.length; i += 1) {
    for (let j = i + 1; j < placedMarks.length; j += 1) {
      if (overlaps(placedMarks[i], placedMarks[j])) clashes.push(placedMarks[i].name + ' and ' + placedMarks[j].name);
    }
  }
  if (clashes.length) {
    throw crowding(
      'MAP_MARKERS_OVERLAP: ' + clashes.join(', ') + ' print on top of each other on ' + what + ' at ' + f2(m.w / 72) +
        'in wide. Give the map a wider zone, or move one of them further from the other.'
    );
  }

  // A dot is the place itself: its own name used to print over it, so a child
  // read "Manaus" and could not see where Manaus was.
  s.annotations.forEach((mark) => {
    if (mark.kind !== 'point') return;
    const r = Math.max(DOT_R_MIN_PT, DOT_R * T) * 1.6;
    obstacles.push({ x: fx(mark.at) - r, y: fy(mark.at) - r, w: 2 * r, h: 2 * r });
  });

  // The ring round the place a focus enlarges is a mark a name must not cover.
  if (s.focus) {
    const ringW = Math.max(1.2 * T, s.focus.span[0] * m.w);
    const ringH = Math.max(0.9 * T, s.focus.span[1] * m.h);
    L.focusRing = { x: fx(s.focus.centre) - ringW / 2, y: fy(s.focus.centre) - ringH / 2, w: ringW, h: ringH };
    obstacles.push(L.focusRing);
  }

  let compass = null;
  if (s.showCompass) {
    const cr = COMPASS_R * LT;
    const cuePt = LT;
    // Top right, except beside a focus enlargement, whose connecting arrow
    // leaves the map to the right and ran straight through the compass.
    const cx = s.focus ? m.x + cr + COMPASS_INSET * LT : m.x + m.w - cr - COMPASS_INSET * LT;
    compass = { cx, cy: m.y + cuePt * 1.2 + cr, r: cr, pt: cuePt };
    obstacles.push({ x: compass.cx - cr, y: m.y, w: 2 * cr, h: compass.cy + cr - m.y });
  }

  // Latitude names sit on their own line, at the first place along it that is
  // clear of what is already on the map.
  const latitudes = [];
  const drawnLatitudes = LATITUDES.filter((line) => (line.key === 'equator' ? s.showEquator : s.showTropics));
  drawnLatitudes.forEach((line) => {
    const pt = LT;
    const y = m.y + ((90 - line.lat) / 180) * m.h;
    const size = pillSize(line.text, pt);
    let placed = null;
    // Above the line first, as it always printed; below it when every place
    // above is taken.
    for (const side of [-1, 1]) {
      for (const share of LATITUDE_LABEL_AT) {
        const cx = m.x + share * m.w;
        const top = side < 0 ? y - size.h - 0.1 * pt : y + 0.1 * pt;
        const bx = { x: Math.min(Math.max(cx - size.w / 2, m.x), m.x + m.w - size.w), y: top, w: size.w, h: size.h };
        if (!obstacles.some((o) => overlaps(o, bx))) { placed = bx; break; }
      }
      if (placed) break;
    }
    if (!placed) {
      throw crowding('MAP_LABELS_DO_NOT_FIT: the ' + line.text + ' name could not be placed clear of the markers on ' + what + '. Give the map a wider zone.');
    }
    obstacles.push(placed);
    latitudes.push({ ...line, y, box: placed, pt });
  });

  // The names, laid out against each other and against everything above.
  const items = [];
  const push = (text, anchor, preferred, pt, style) => {
    if (!text) return;
    items.push({ text, anchor, preferred: preferred || anchor, pt, ...style });
  };
  if (s.mode === 'marked' && s.key === 'south-america') {
    if (s.country === 'brazil' && s.labels.country) {
      push(s.labels.country, maps.BRAZIL_LABEL_SOUTH_AMERICA, maps.BRAZIL_LABEL_SOUTH_AMERICA, LT, { stroke: palette.grey, fill: palette.white });
    }
    if (s.basin === 'amazon basin' && s.labels.basin) {
      push(s.labels.basin, maps.AMAZON_BASIN_LABEL_SOUTH_AMERICA, maps.AMAZON_BASIN_LABEL_SOUTH_AMERICA, LT, { stroke: palette.orange, fill: palette.white });
    }
  }
  const worldLabel = (list, kind, pt) => list.forEach((item) => {
    push(item.text, item.at, item.labelAt, pt, { stroke: palette.kind(kind), fill: palette.kindFill(kind) });
    if (item.repeatAt) push(item.text, item.repeatAt, item.repeatAt, pt, { stroke: palette.kind(kind), fill: palette.kindFill(kind) });
  });
  worldLabel(s.continentLabels, 'continent', LT);
  worldLabel(s.oceanLabels, 'ocean', LT);
  worldLabel(s.seaLabels, 'sea', LT);
  // A mark's own label joins the same layout rather than being drawn where it
  // asked, so a shaded region's name cannot land on top of a continent name.
  s.annotations.forEach((mark) => push(mark.label, mark.anchor, mark.labelAt, LT, { stroke: palette.mark(mark.colour), fill: palette.white }));

  let placed;
  try {
    placed = maps.refuseCrowdedLabels(
      maps.layoutLabels(items, (text, item) => {
        const size = pillSize(text, item.pt);
        return { w: size.w / m.w, h: size.h / m.h };
      }, obstacles.map(asFraction)),
      what + ' at ' + f2(m.w / 72) + 'in wide'
    ).map((p, i) => ({ ...items[i], ...p }));
  } catch (error) {
    // Whether a set of labels fits is a fact about the size they print at, so a
    // size nearer the readable floor is tried before the map is refused.
    throw crowding(error.message);
  }
  return Object.assign(L, { markers, seaBoxes, compass, latitudes, labels: placed, what });
}

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// ─── the globe-to-flat composition ──────────────────────────────────────────

const GLOBE_TITLES = ['1. Begin with the globe', '2. Cut through the Pacific', '3. Open and flatten'];

function layoutGlobe(s, profile, T, ceiling, rows = 1) {
  const n = s.revealStage;
  const W = profile.widthPt;
  const flatAspect = s.entry.w / s.entry.h;
  const notes = [s.notes.globe, s.notes.cut, s.notes.flat];
  const noteBold = profile.bold;
  const joinText = 'The patterned edges join: one Pacific Ocean';

  // One row of panels, laid out from `top`: titles, then pictures, then what
  // sits under each (the flat map's joined-edge note, then every note).
  function row(indices, w, top) {
    const A = GLOBE_ARROW_GAP * T;
    const weights = indices.map((i) => (i === 2 ? FLAT_WEIGHT : 1));
    const unit = (w - (indices.length - 1) * A) / weights.reduce((a, b) => a + b, 0);
    let x = 0;
    const panels = indices.map((i, k) => {
      const pw = unit * weights[k];
      const p = { stage: i, x, w: pw, cx: x + pw / 2, title: wrap(GLOBE_TITLES[i], pw, T, true), note: wrap(notes[i], pw, T, noteBold) };
      x += pw + A;
      return p;
    });
    const titleH = Math.max(...panels.map((p) => p.title.length)) * BAND * T;
    const imgTop = top + titleH + GAP * T;
    const heights = panels.map((p) => (p.stage === 2 ? p.w / flatAspect : p.w));
    const imgH = Math.max(...heights);
    let bottom = imgTop + imgH;
    panels.forEach((p, k) => {
      p.titleTop = top;
      p.midY = imgTop + imgH / 2;
      p.imgH = heights[k];
      let below = imgTop + imgH + GAP * T;
      if (p.stage === 2) {
        p.join = s.suppressSecondPacific
          ? { lines: wrap(joinText, p.w - 5 * T, T, true), top: below }
          : { lines: [], top: below };
        p.join.h = s.suppressSecondPacific ? FOOTER_DROP * T + p.join.lines.length * BAND * T : BAND * T;
        below += p.join.h + GAP * T;
      }
      p.noteTop = below;
      bottom = Math.max(bottom, below + p.note.length * BAND * T);
    });
    return { panels, bottom, A };
  }

  function compose(w) {
    const arrows = [];
    let panels;
    let h;
    if (rows === 2) {
      const first = row([0, 1], w, 0);
      const secondTop = first.bottom + GLOBE_ARROW_GAP * T;
      const second = row([2], w, secondTop);
      panels = [...first.panels, ...second.panels];
      h = second.bottom;
      const p1 = first.panels[1];
      arrows.push({ x1: p1.cx, y1: first.bottom + 0.2 * T, x2: p1.cx, y2: secondTop - 0.2 * T });
    } else {
      const only = row([0, 1, 2].slice(0, n), w, 0);
      panels = only.panels;
      h = only.bottom;
    }
    panels.forEach((p, k) => {
      const next = panels[k + 1];
      if (rows === 1 && next) arrows.push({ x1: p.x + p.w + 0.3 * T, y1: p.midY, x2: next.x - 0.5 * T, y2: p.midY });
    });
    const globes = panels.filter((p) => p.stage < 2);
    return { w, h, T, panels, arrows, D: Math.min(...globes.map((p) => p.w)) };
  }

  const L = widthForHeight(compose, W, ceiling, T, 'the globe-to-flat map');
  const faults = [];
  L.panels.forEach((p) => {
    if (p.title.length > MAX_TITLE_LINES || !fitsLines(p.title, p.w, T, true)) faults.push('stage ' + (p.stage + 1) + ' title');
    if (p.note.length > MAX_NOTE_LINES || !fitsLines(p.note, p.w, T, noteBold)) faults.push('stage ' + (p.stage + 1) + ' note');
    if (p.join && !fitsLines(p.join.lines, p.w - 5 * T, T, true)) faults.push('the joined-edge note');
  });
  if (faults.length) {
    throw crowding(
      'MAP_TRANSFORMATION_INVALID: a stage note is too long to fit its measured label area (' + faults.join(', ') +
        ' in a ' + f2(L.panels[0].w / 72) + 'in panel). Shorten the note, or give the map more width.'
    );
  }
  // The cut line's own name runs up the globe, so it has to fit the globe.
  const cutPt = Math.max(profile.minFontPt, Math.min(T, CUE_SIZE * T));
  const along = L.D * 0.78;
  let cutLines = ['PACIFIC CUT LINE'];
  if (widthOf(cutLines[0], cutPt, true) + PILL_PAD * cutPt * 2 > along) cutLines = ['PACIFIC', 'CUT LINE'];
  if (n >= 2 && !fitsLines(cutLines, along - PILL_PAD * cutPt * 2, cutPt, true)) {
    throw crowding('MAP_TRANSFORMATION_INVALID: the cut line\'s name does not fit along a globe ' + f2(L.D / 72) + 'in across. Give the map more room.');
  }
  return Object.assign(L, { cutLines, cutPt, what: 'the globe-to-flat map' });
}

// ─── drawing ────────────────────────────────────────────────────────────────

function hashOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function assetUri(key) {
  const entry = maps.mapEntry(key);
  const assetPath = maps.assetPathFor(key);
  if (!entry || !assetPath || !fs.existsSync(assetPath)) {
    throw new Error('MAP_ASSET_MISSING: ' + key + ' is not installed in builder/assets/maps.');
  }
  const ext = entry.file.slice(entry.file.lastIndexOf('.')).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error('MAP_ASSET_UNSUPPORTED: ' + entry.file + ' is not a PNG or JPEG.');
  return 'data:' + mime + ';base64,' + fs.readFileSync(assetPath).toString('base64');
}

function textSvg(font, s, x, baseline, pt, fill, { anchor = 'middle', bold = true, italic = false, rotate = null } = {}) {
  const weight = bold ? ' font-weight="bold"' : '';
  const style = italic ? ' font-style="italic"' : '';
  const turn = rotate ? ` transform="rotate(${rotate} ${f2(x)} ${f2(baseline)})"` : '';
  return `<text x="${f2(x)}" y="${f2(baseline)}" text-anchor="${anchor}" font-family="${font}" font-size="${f2(pt)}"${weight}${style} fill="${fill}"${turn}>${esc(s)}</text>`;
}

function pillSvg(font, text, bx, pt, fill, stroke) {
  return `<rect x="${f2(bx.x)}" y="${f2(bx.y)}" width="${f2(bx.w)}" height="${f2(bx.h)}" rx="${f2(bx.h * 0.3)}" fill="${fill}" fill-opacity="0.94" stroke="${stroke}" stroke-width="${f2(Math.max(0.8, 0.1 * pt))}"/>` +
    textSvg(font, text, bx.x + bx.w / 2, bx.y + bx.h * 0.68, pt, HOUSE.text);
}

function drawMap(L, id) {
  const { s, palette: c, profile, T } = L;
  const font = profile.font;
  const m = L.map;
  const parts = [];
  const defs = [];
  const px = (p) => ({ x: m.x + p[0] * m.w, y: m.y + p[1] * m.h });
  const stroke = Math.max(STROKE_MIN_PT, STROKE * T);

  // The land: the shipped image, or the same image with Brazil filled inside
  // its own printed border.
  let href;
  if (s.mode === 'marked' && s.key === 'south-america' && s.country === 'brazil') {
    href = 'data:image/png;base64,' + pixels.filledRegionPng(maps.assetPathFor(s.key), maps.BRAZIL_SEED_SOUTH_AMERICA, COUNTRY_FILL).toString('base64');
  } else {
    href = assetUri(s.key);
  }
  parts.push(`<image x="${f2(m.x)}" y="${f2(m.y)}" width="${f2(m.w)}" height="${f2(m.h)}" preserveAspectRatio="none" href="${href}"/>`);

  // Marks. Shading first so it sits under every stroke, outlines and lines
  // next, and dots after the latitude lines so a dot is never crossed by one.
  s.annotations.forEach((mark, index) => {
    if (mark.kind === 'point') return;
    const list = mark.kind === 'area' ? mark.points.concat([mark.points[0]]) : mark.points;
    const d = list.map((p, i) => { const q = px(p); return (i ? 'L' : 'M') + f2(q.x) + ' ' + f2(q.y); }).join(' ');
    const colour = c.mark(mark.colour);
    // A shaded region reads as "this whole area IS the thing", which an outline
    // does not. It is a soft translucent wash, not a hatch or a solid: the
    // region reads as filled from the back of the room while the coastline,
    // rivers and borders under it stay visible, and it survives a grey
    // photocopy. The heavy diagonal hatch it replaced hid the very country it
    // was pointing at.
    if (mark.shaded) parts.push(`<path d="${d} Z" fill="${colour}" fill-opacity="0.30" stroke="none"/>`);
    parts.push(`<path d="${d}" fill="none" stroke="${HOUSE.white}" stroke-width="${f2(stroke * HALO)}" stroke-linejoin="round"/>`);
    // Which way it went: one arrowhead per marked line, in that line's own
    // colour, so a blue river and an orange journey do not end in the same head.
    let heads = '';
    if (mark.arrow) {
      defs.push(`<marker id="${id}-head-${index}" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L5 2.5 L0 5 Z" fill="${colour}"/></marker>`);
      heads = ` marker-end="url(#${id}-head-${index})"`;
      if (mark.arrow === 'both') {
        defs.push(`<marker id="${id}-tail-${index}" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0 0 L5 2.5 L0 5 Z" fill="${colour}"/></marker>`);
        heads += ` marker-start="url(#${id}-tail-${index})"`;
      }
    }
    const dash = mark.kind === 'area' && !mark.shaded ? ` stroke-dasharray="${f2(stroke * 3)} ${f2(stroke * 2)}"` : '';
    parts.push(`<path d="${d}" fill="none" stroke="${colour}" stroke-width="${f2(stroke)}"${dash} stroke-linejoin="round"${heads}/>`);
  });

  // The Amazon basin: an orange dashed boundary with a white halo, so it cannot
  // be mistaken for a solid national border.
  if (s.mode === 'marked' && s.key === 'south-america' && s.basin === 'amazon basin') {
    const pts = maps.AMAZON_BASIN_SOUTH_AMERICA.map((p) => { const q = px(p); return f2(q.x) + ',' + f2(q.y); }).join(' ');
    parts.push(`<polyline points="${pts}" fill="none" stroke="${HOUSE.white}" stroke-width="${f2(stroke * HALO)}" stroke-linejoin="round"/>`);
    parts.push(`<polyline points="${pts}" fill="none" stroke="${c.orange}" stroke-width="${f2(stroke)}" stroke-dasharray="${f2(stroke * 3)} ${f2(stroke * 2)}" stroke-linejoin="round"/>`);
  }

  const latStroke = Math.max(1, LATITUDE_STROKE * T);
  L.latitudes.forEach((line) => {
    parts.push(`<line x1="${f2(m.x)}" y1="${f2(line.y)}" x2="${f2(m.x + m.w)}" y2="${f2(line.y)}" stroke="${c.orange}" stroke-width="${f2(latStroke)}" stroke-dasharray="${f2(0.7 * T)} ${f2(0.45 * T)}"/>`);
  });

  if (s.joinedEdges && !s.focus) {
    const band = Math.max(EDGE_BAND * T, EDGE_BAND_SHARE * m.w);
    const cell = band * 0.7;
    defs.push(`<pattern id="${id}-edge" width="${f2(cell)}" height="${f2(cell)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${f2(cell)}" height="${f2(cell)}" fill="${c.paleBlue}"/><rect width="${f2(cell * 0.36)}" height="${f2(cell)}" fill="${c.blue}"/></pattern>`);
    parts.push(`<rect x="${f2(m.x)}" y="${f2(m.y)}" width="${f2(band)}" height="${f2(m.h)}" fill="url(#${id}-edge)"/>`);
    parts.push(`<rect x="${f2(m.x + m.w - band)}" y="${f2(m.y)}" width="${f2(band)}" height="${f2(m.h)}" fill="url(#${id}-edge)"/>`);
  }

  s.annotations.forEach((mark) => {
    if (mark.kind !== 'point') return;
    const p = px(mark.at);
    const r = Math.max(DOT_R_MIN_PT, DOT_R * T);
    parts.push(`<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(r)}" fill="${c.mark(mark.colour)}" stroke="${HOUSE.white}" stroke-width="${f2(r * 0.45)}"/>`);
  });

  L.latitudes.forEach((line) => {
    parts.push(`<rect x="${f2(line.box.x)}" y="${f2(line.box.y)}" width="${f2(line.box.w)}" height="${f2(line.box.h)}" rx="${f2(line.box.h * 0.3)}" fill="${HOUSE.white}" fill-opacity="0.94"/>`);
    parts.push(textSvg(font, line.text, line.box.x + line.box.w / 2, line.box.y + line.box.h * 0.68, line.pt, c.orange));
  });

  // Labels last of the map's own marks, so no stroke is ever drawn across the
  // words; each label moved off its mark comes back with a leader line.
  const toPt = (bx) => ({ x: m.x + bx.x * m.w, y: m.y + bx.y * m.h, w: bx.w * m.w, h: bx.h * m.h });
  L.labels.forEach((item) => {
    if (!item.leader) return;
    const a = px(item.leader[0]);
    const b = px(item.leader[1]);
    parts.push(`<line x1="${f2(a.x)}" y1="${f2(a.y)}" x2="${f2(b.x)}" y2="${f2(b.y)}" stroke="${item.stroke}" stroke-width="${f2(Math.max(0.8, 0.09 * item.pt))}"/>`);
  });
  L.labels.forEach((item) => parts.push(pillSvg(font, item.text, toPt(item.box), item.pt, item.fill, item.stroke)));

  L.markers.forEach((mk) => {
    parts.push(`<circle cx="${f2(mk.cx)}" cy="${f2(mk.cy)}" r="${f2(mk.r)}" fill="${HOUSE.white}" stroke="${HOUSE.white}" stroke-width="${f2(0.35 * mk.pt)}"/>`);
    parts.push(`<circle cx="${f2(mk.cx)}" cy="${f2(mk.cy)}" r="${f2(mk.r)}" fill="${c.kindFill(mk.kind)}" stroke="${c.kind(mk.kind)}" stroke-width="${f2(Math.max(0.8, 0.14 * mk.pt))}"/>`);
    parts.push(textSvg(font, mk.marker, mk.cx, mk.cy + 0.36 * mk.pt, mk.pt, c.text));
  });

  // A write-on box on the water for a sea's initial, with a line to write on.
  const u = profile.minFontPt;
  L.seaBoxes.forEach((bx) => {
    parts.push(`<rect x="${f2(bx.x)}" y="${f2(bx.y)}" width="${f2(bx.w)}" height="${f2(bx.h)}" rx="${f2(0.3 * u)}" fill="${HOUSE.white}" fill-opacity="0.96" stroke="${c.green}" stroke-width="${f2(Math.max(0.8, 0.1 * u))}" stroke-dasharray="${f2(0.45 * u)} ${f2(0.3 * u)}"/>`);
    parts.push(`<line x1="${f2(bx.x + 0.35 * u)}" y1="${f2(bx.y + bx.h - 0.3 * u)}" x2="${f2(bx.x + bx.w - 0.35 * u)}" y2="${f2(bx.y + bx.h - 0.3 * u)}" stroke="${c.green}" stroke-width="${f2(Math.max(0.6, 0.06 * u))}"/>`);
  });

  if (L.compass) {
    const { cx, cy, r, pt } = L.compass;
    const sw = Math.max(0.8, 0.07 * pt);
    parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${HOUSE.white}" fill-opacity="0.94" stroke="${c.navy}" stroke-width="${f2(sw)}"/>`);
    parts.push(`<path d="M${f2(cx)} ${f2(cy - r * 0.8)} L${f2(cx + r * 0.25)} ${f2(cy)} L${f2(cx)} ${f2(cy + r * 0.8)} L${f2(cx - r * 0.25)} ${f2(cy)} Z" fill="${c.paleBlue}" stroke="${c.navy}" stroke-width="${f2(sw)}"/>`);
    parts.push(textSvg(font, 'N', cx, cy - r - 0.2 * pt, pt, c.navy));
  }

  // A sea focus: a crop of the same pixels, never a redrawn coastline, joined to
  // the place it enlarges.
  if (L.focus) {
    const fz = L.focus;
    const entry = s.entry;
    const cw = fz.cropW;
    const ch = fz.cropH;
    const cxp = Math.max(0, Math.min(entry.w - cw, s.focus.centre[0] * entry.w - cw / 2));
    const cyp = Math.max(0, Math.min(entry.h - ch, s.focus.centre[1] * entry.h - ch / 2));
    const at = px(s.focus.centre);
    const ringW = Math.max(1.2 * T, (cw / entry.w) * m.w);
    const ringH = Math.max(0.9 * T, (ch / entry.h) * m.h);
    const sw = Math.max(1, 0.15 * T);
    parts.push(`<rect x="${f2(at.x - ringW / 2)}" y="${f2(at.y - ringH / 2)}" width="${f2(ringW)}" height="${f2(ringH)}" rx="${f2(0.3 * T)}" fill="none" stroke="${c.orange}" stroke-width="${f2(sw)}"/>`);
    defs.push(`<marker id="${id}-focus" markerWidth="4" markerHeight="4" refX="3.2" refY="2" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L4 2 L0 4 Z" fill="${c.orange}"/></marker>`);
    const zx = fz.x;
    const zy = fz.zoomY;
    parts.push(`<path d="M${f2(at.x + ringW / 2)} ${f2(at.y)} C${f2(zx - FOCUS_GAP * T * 0.5)} ${f2(at.y)} ${f2(zx - FOCUS_GAP * T * 0.5)} ${f2(zy + fz.zoomH / 2)} ${f2(zx - sw)} ${f2(zy + fz.zoomH / 2)}" fill="none" stroke="${c.orange}" stroke-width="${f2(sw)}" marker-end="url(#${id}-focus)"/>`);
    defs.push(`<clipPath id="${id}-zoom"><rect x="${f2(zx)}" y="${f2(zy)}" width="${f2(fz.zoomW)}" height="${f2(fz.zoomH)}" rx="${f2(0.5 * T)}"/></clipPath>`);
    parts.push(`<rect x="${f2(zx)}" y="${f2(zy)}" width="${f2(fz.zoomW)}" height="${f2(fz.zoomH)}" rx="${f2(0.5 * T)}" fill="${HOUSE.white}"/>`);
    parts.push(`<svg x="${f2(zx)}" y="${f2(zy)}" width="${f2(fz.zoomW)}" height="${f2(fz.zoomH)}" viewBox="${f2(cxp)} ${f2(cyp)} ${f2(cw)} ${f2(ch)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${id}-zoom)"><image x="0" y="0" width="${entry.w}" height="${entry.h}" href="${href}"/></svg>`);
    parts.push(`<rect x="${f2(zx)}" y="${f2(zy)}" width="${f2(fz.zoomW)}" height="${f2(fz.zoomH)}" rx="${f2(0.5 * T)}" fill="none" stroke="${c.navy}" stroke-width="${f2(sw)}"/>`);
    const tw = Math.max(...fz.titleLines.map((l) => widthOf(l, T, true))) + 2 * PILL_PAD * T;
    const th = fz.titleH;
    const tx = zx + (fz.zoomW - tw) / 2;
    parts.push(`<rect x="${f2(tx)}" y="${f2(fz.titleY)}" width="${f2(tw)}" height="${f2(th)}" rx="${f2(0.4 * T)}" fill="${c.paleOrange}" stroke="${c.orange}" stroke-width="${f2(Math.max(0.8, 0.08 * T))}"/>`);
    fz.titleLines.forEach((line, i) => parts.push(textSvg(font, line, zx + fz.zoomW / 2, fz.titleY + 0.25 * T + (i + 0.78) * BAND * T, T, c.navy)));
  }

  if (L.footer) {
    // The joined-edge note, with an arrow from each patterned edge curving in
    // to it. The arrows stop short of the words: on the old drawing their heads
    // landed on the note and a child read "Pacific" through an arrowhead.
    const fyTop = L.footer.y;
    const lineMid = fyTop + 0.3 * T + FOOTER_DROP * T + 0.25 * T;
    const textW = widthOf(L.footer.lines[0], T, true);
    const cx = m.x + m.w / 2;
    const sw = Math.max(1, 0.15 * T);
    defs.push(`<marker id="${id}-edgearrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L5 2.5 L0 5 Z" fill="${c.blue}"/></marker>`);
    const leftEnd = cx - textW / 2 - 0.6 * T;
    const rightEnd = cx + textW / 2 + 0.6 * T;
    const startY = fyTop + 0.3 * T;
    parts.push(`<path d="M${f2(m.x + 0.5 * T)} ${f2(startY)} C${f2(m.x + 0.5 * T)} ${f2(lineMid)} ${f2(leftEnd - 2 * T)} ${f2(lineMid)} ${f2(leftEnd)} ${f2(lineMid)}" fill="none" stroke="${c.blue}" stroke-width="${f2(sw)}" marker-end="url(#${id}-edgearrow)"/>`);
    parts.push(`<path d="M${f2(m.x + m.w - 0.5 * T)} ${f2(startY)} C${f2(m.x + m.w - 0.5 * T)} ${f2(lineMid)} ${f2(rightEnd + 2 * T)} ${f2(lineMid)} ${f2(rightEnd)} ${f2(lineMid)}" fill="none" stroke="${c.blue}" stroke-width="${f2(sw)}" marker-end="url(#${id}-edgearrow)"/>`);
    L.footer.lines.forEach((line, i) => parts.push(textSvg(font, line, cx, lineMid + 0.35 * T + i * BAND * T, T, c.blue)));
  }

  // The key names what the shading means, each swatch the same wash its regions
  // use, in a band added below the map so the map does not shrink to make room.
  if (L.key) {
    L.key.rows.forEach((row, r) => {
      let x = (L.w - row.w) / 2;
      const top = L.key.y + r * 1.6 * T;
      row.cells.forEach((cell) => {
        const fill = c.mark(cell.colour);
        parts.push(`<rect x="${f2(x)}" y="${f2(top + 0.15 * T)}" width="${f2(KEY_SWATCH_W * T)}" height="${f2(KEY_SWATCH_H * T)}" rx="${f2(0.2 * T)}" fill="${HOUSE.white}" stroke="${c.grey}" stroke-width="${f2(Math.max(0.8, 0.08 * T))}"/>`);
        parts.push(`<rect x="${f2(x)}" y="${f2(top + 0.15 * T)}" width="${f2(KEY_SWATCH_W * T)}" height="${f2(KEY_SWATCH_H * T)}" rx="${f2(0.2 * T)}" fill="${fill}" fill-opacity="0.30" stroke="${c.grey}" stroke-width="${f2(Math.max(0.8, 0.08 * T))}"/>`);
        parts.push(textSvg(font, cell.text, x + KEY_SWATCH_W * T + 0.4 * T, top + 0.15 * T + 0.82 * T, T, c.text, { anchor: 'start' }));
        x += cell.w + KEY_SPACING * T;
      });
    });
  }

  if (L.caption) {
    L.caption.lines.forEach((line, i) => parts.push(textSvg(font, line, L.w / 2, L.caption.y + (i + 0.78) * BAND * T, T, c.text, { bold: false, italic: true })));
  }

  return { defs, parts };
}

function drawGlobe(L, id) {
  const { s, palette: c, profile, T } = L;
  const font = profile.font;
  const parts = [];
  const defs = [];
  const assetPath = maps.assetPathFor(GLOBE_KEY);
  if (!assetPath || !fs.existsSync(assetPath)) throw new Error('MAP_TRANSFORMATION_RENDER_FAILED: the world map asset is missing.');
  const sw = Math.max(1, 0.2 * T);
  defs.push(`<marker id="${id}-flow" markerWidth="3.2" markerHeight="3.2" refX="2.4" refY="1.6" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L3.2 1.6 L0 3.2 Z" fill="${c.orange}"/></marker>`);
  const noteBold = profile.bold;

  L.arrows.forEach((a) => {
    parts.push(`<path d="M${f2(a.x1)} ${f2(a.y1)} L${f2(a.x2)} ${f2(a.y2)}" fill="none" stroke="${c.orange}" stroke-width="${f2(sw * 1.3)}" marker-end="url(#${id}-flow)"/>`);
  });

  L.panels.forEach((p) => {
    const i = p.stage;
    const { cx, midY } = p;
    p.title.forEach((line, k) => parts.push(textSvg(font, line, cx, p.titleTop + (k + 0.8) * BAND * T, T, c.navy)));
    if (i < 2) {
      const r = p.imgH / 2 - sw;
      const png = pixels.globePng(assetPath, i === 0 ? 15 : 180, GLOBE_PX);
      defs.push(`<clipPath id="${id}-globe-${i}"><circle cx="${f2(cx)}" cy="${f2(midY)}" r="${f2(r)}"/></clipPath>`);
      parts.push(`<image x="${f2(cx - r)}" y="${f2(midY - r)}" width="${f2(2 * r)}" height="${f2(2 * r)}" clip-path="url(#${id}-globe-${i})" href="data:image/png;base64,${png.toString('base64')}"/>`);
      parts.push(`<circle cx="${f2(cx)}" cy="${f2(midY)}" r="${f2(r)}" fill="none" stroke="${i === 0 ? c.navy : c.blue}" stroke-width="${f2(sw)}"/>`);
      if (i === 1) {
        parts.push(`<path d="M${f2(cx)} ${f2(midY - r)} V${f2(midY + r)}" fill="none" stroke="${c.orange}" stroke-width="${f2(sw * 1.3)}" stroke-dasharray="${f2(0.8 * T)} ${f2(0.5 * T)}"/>`);
        const pt = L.cutPt;
        const longest = Math.max(...L.cutLines.map((l) => widthOf(l, pt, true)));
        const bw = L.cutLines.length * BAND * pt + 0.3 * pt;
        const bh = longest + 2 * PILL_PAD * pt;
        parts.push(`<rect x="${f2(cx - bw / 2)}" y="${f2(midY - bh / 2)}" width="${f2(bw)}" height="${f2(bh)}" rx="${f2(bw * 0.45)}" fill="${HOUSE.white}" fill-opacity="0.9"/>`);
        L.cutLines.forEach((line, k) => {
          const bx = cx - bw / 2 + 0.15 * pt + (k + 0.78) * BAND * pt;
          parts.push(textSvg(font, line, bx, midY, pt, c.orange, { rotate: -90 }));
        });
      }
    } else {
      const fw = p.w;
      const fh = p.imgH;
      const top = midY - fh / 2;
      parts.push(`<image x="${f2(p.x)}" y="${f2(top)}" width="${f2(fw)}" height="${f2(fh)}" preserveAspectRatio="none" href="${assetUri(GLOBE_KEY)}"/>`);
      const band = Math.max(EDGE_BAND * T, 0.036 * fw);
      const cell = band * 0.7;
      defs.push(`<pattern id="${id}-edge" width="${f2(cell)}" height="${f2(cell)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${f2(cell)}" height="${f2(cell)}" fill="${c.paleBlue}"/><rect width="${f2(cell * 0.36)}" height="${f2(cell)}" fill="${c.blue}"/></pattern>`);
      parts.push(`<rect x="${f2(p.x)}" y="${f2(top)}" width="${f2(band)}" height="${f2(fh)}" fill="url(#${id}-edge)"/>`);
      parts.push(`<rect x="${f2(p.x + fw - band)}" y="${f2(top)}" width="${f2(band)}" height="${f2(fh)}" fill="url(#${id}-edge)"/>`);
      parts.push(`<rect x="${f2(p.x)}" y="${f2(top)}" width="${f2(fw)}" height="${f2(fh)}" fill="none" stroke="${c.grey}" stroke-width="${f2(Math.max(0.8, 0.1 * T))}"/>`);
      const imageBottom = top + fh;
      const below = p.join.top;
      if (s.suppressSecondPacific) {
        // The patterned edges are one ocean: an arrow from each edge in to the
        // note that says so, rather than two labels that read as two oceans.
        const firstW = widthOf(p.join.lines[0], T, true);
        const lineMid = below + FOOTER_DROP * T;
        const js = Math.max(1, 0.15 * T);
        defs.push(`<marker id="${id}-join" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L5 2.5 L0 5 Z" fill="${c.blue}"/></marker>`);
        const leftEnd = cx - firstW / 2 - 0.5 * T;
        const rightEnd = cx + firstW / 2 + 0.5 * T;
        parts.push(`<path d="M${f2(p.x + 0.4 * T)} ${f2(imageBottom + 0.2 * T)} C${f2(p.x + 0.4 * T)} ${f2(lineMid)} ${f2(leftEnd - T)} ${f2(lineMid)} ${f2(leftEnd)} ${f2(lineMid)}" fill="none" stroke="${c.blue}" stroke-width="${f2(js)}" marker-end="url(#${id}-join)"/>`);
        parts.push(`<path d="M${f2(p.x + p.w - 0.4 * T)} ${f2(imageBottom + 0.2 * T)} C${f2(p.x + p.w - 0.4 * T)} ${f2(lineMid)} ${f2(rightEnd + T)} ${f2(lineMid)} ${f2(rightEnd)} ${f2(lineMid)}" fill="none" stroke="${c.blue}" stroke-width="${f2(js)}" marker-end="url(#${id}-join)"/>`);
        p.join.lines.forEach((line, k) => parts.push(textSvg(font, line, cx, lineMid + 0.35 * T + k * BAND * T, T, c.blue)));
      } else {
        parts.push(textSvg(font, 'Pacific Ocean', p.x, below + 0.8 * BAND * T, T, c.blue, { anchor: 'start' }));
        parts.push(textSvg(font, 'Pacific Ocean', p.x + p.w, below + 0.8 * BAND * T, T, c.blue, { anchor: 'end' }));
      }
    }
    p.note.forEach((line, k) => parts.push(textSvg(font, line, cx, p.noteTop + (k + 0.8) * BAND * T, T, c.grey, { bold: noteBold })));
  });
  return { defs, parts };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const id = 'map' + hashOf(cacheKey(spec, L.profile));
  const { defs, parts } = L.s.mode === 'globe' ? drawGlobe(L, id) : drawMap(L, id);
  const w = f2(L.canvasW);
  const h = f2(L.h);
  const body = parts.join('');
  const inner = L.offsetX ? `<g transform="translate(${f2(L.offsetX)} 0)">${body}</g>` : body;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    (defs.length ? `<defs>${defs.join('')}</defs>` : '') + inner + '</svg>';
  return { svg, w: L.canvasW, h: L.h, aspect: L.canvasW / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const s = resolve(spec);
  const { entry, ...rest } = s;
  return `map:${p.surface}:${p.palette}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${spec.heightMm == null ? '' : spec.heightMm}:${JSON.stringify(rest)}`;
}

module.exports = {
  tightSvg,
  cacheKey,
  resolve,
  describeLayout,
  WORLD_KEY,
  MAX_CONTINENT_LABELS,
  MAX_OCEAN_LABELS,
  MAX_SEA_LABELS,
  MAX_CLUE_MARKERS,
};
