'use strict';

// SHARED real-map registry and annotation geometry.
//
// Every map this package draws is a REAL map image shipped in
// builder/assets/maps/. Nothing here invents a coastline, a border or a region
// boundary: the land comes from the shipped asset, and everything this module
// adds is a MARK PLACED ON TOP of it - a dot on a city, a dashed outline round
// a region, a line along a river.
//
// That distinction is the whole point of the module. A mark placed by eye on a
// real base is checkable by looking and wrong by millimetres; a coastline drawn
// by eye is wrong by hundreds of miles and looks confident either way. So the
// engine offers a general way to do the first and no way at all to do the
// second.
//
// Coordinates are FRACTIONS of the map image: [x, y] with 0,0 at the top-left
// corner and 1,1 at the bottom-right. Fractions rather than pixels so the same
// annotation draws identically on a slide, on a printed sheet, and at any size.

const path = require('path');

const ASSET_DIR = path.resolve(__dirname, '..', '..', 'builder', 'assets', 'maps');

// Real pixel dimensions recorded at authoring time rather than read at render
// time, the same way money.js records each coin's real size. Add an entry
// whenever a new file is added to builder/assets/maps/.
const MAPS = Object.freeze({
  world:           { file: 'world.png', w: 1272, h: 647 },
  // The seven-continent asset: same real geography, with Antarctica. The
  // plain `world` asset omits Antarctica, so any lesson naming all seven
  // continents draws from this one.
  'world-with-antarctica': { file: 'world-with-antarctica.png', w: 1800, h: 900 },
  europe:          { file: 'europe.png', w: 554, h: 554 },
  africa:          { file: 'africa.png', w: 554, h: 554 },
  asia:            { file: 'asia.png', w: 624, h: 491 },
  'south-america': { file: 'south-america.png', w: 472, h: 649 },
  'north-america': { file: 'north-america.jpg', w: 1936, h: 2200 },
  oceania:         { file: 'oceania.jpg', w: 2200, h: 1690 },
  uk:              { file: 'UK.png', w: 394, h: 507 }
});

// House scheme. A named set, so a lesson cannot introduce a colour the rest of
// the package does not use, and so the same mark reads the same on every surface.
const COLOURS = Object.freeze({
  orange: 'C65911',
  blue:   '0070C0',
  green:  '2E7D45',
  black:  '333333'
});

const DEFAULT_COLOUR = 'orange';

// Readability, not arithmetic. A map carrying more than this stops being a map
// a child can read from the back of the room and becomes a diagram of labels.
const MAX_ANNOTATIONS = 8;

// How far clear of a region or a place a label sits by default, as a fraction
// of the map's height.
const LABEL_CLEARANCE = 0.045;

function normaliseMapKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
}

function normaliseOverlayName(value) {
  return String(value || '').trim().toLowerCase().replace(/[-_]+/g, ' ');
}

function mapEntry(value) {
  return MAPS[normaliseMapKey(value)] || null;
}

function assetPathFor(value) {
  const entry = mapEntry(value);
  return entry ? path.join(ASSET_DIR, entry.file) : null;
}

// -- Named overlays ---------------------------------------------------------
//
// The two overlays the package has always shipped, expressed as fractions of
// the real asset so the slide engine and the worksheet engine draw the
// identical region. The points were read off the real south-america.png
// (472 x 649), which is why they live here and are not eyeballed per engine.

const AMAZON_BASIN_SOUTH_AMERICA = Object.freeze([
  [86, 98], [116, 76], [158, 78], [205, 92], [253, 109], [306, 121],
  [353, 143], [378, 176], [365, 203], [329, 226], [286, 242], [241, 261],
  [198, 270], [153, 253], [119, 231], [90, 204], [75, 170], [74, 134], [86, 98]
].map(function (p) { return Object.freeze([p[0] / 472, p[1] / 649]); }));

const BRAZIL_SEED_SOUTH_AMERICA = Object.freeze({ x: 300, y: 220 });
const BRAZIL_LABEL_SOUTH_AMERICA = Object.freeze([294 / 472, 286 / 649]);
const AMAZON_BASIN_LABEL_SOUTH_AMERICA = Object.freeze([210 / 472, 163 / 649]);

const COUNTRY_OVERLAYS = new Set(['brazil']);
const BASIN_OVERLAYS = new Set(['amazon basin']);

// A requested overlay either appears or the build says why it did not. Quietly
// rendering the plain map hands a teacher a slide missing the one thing it was
// asked for, with nothing anywhere saying so.
function checkOverlaySupport(data) {
  const country = normaliseOverlayName(data && data.selectedCountry);
  if (country && !COUNTRY_OVERLAYS.has(country)) {
    throw new Error(
      'MAP_OVERLAY_UNSUPPORTED: selectedCountry ' + JSON.stringify(String(data.selectedCountry)) +
        ' has no shaded region in this map. Supported: ' + [...COUNTRY_OVERLAYS].join(', ') +
        '. To mark another place, put an annotation on the real map instead.'
    );
  }
  const basin = normaliseOverlayName(data && data.basin);
  if (basin && !BASIN_OVERLAYS.has(basin)) {
    throw new Error(
      'MAP_OVERLAY_UNSUPPORTED: basin ' + JSON.stringify(String(data.basin)) +
        ' has no outline in this map. Supported: ' + [...BASIN_OVERLAYS].join(', ') +
        '. To mark another region, put an annotation on the real map instead.'
    );
  }
}

// -- Annotations ------------------------------------------------------------

const KINDS = new Set(['point', 'area', 'line']);

function fraction(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) {
    throw new Error(
      'MAP_ANNOTATION_INVALID: ' + label + ' must be a fraction of the map between 0 and 1; received ' +
        JSON.stringify(value) + '.'
    );
  }
  return n;
}

function point(value, label) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(
      'MAP_ANNOTATION_INVALID: ' + label + ' must be a two-number [x, y] pair; received ' + JSON.stringify(value) + '.'
    );
  }
  return [fraction(value[0], label + ' x'), fraction(value[1], label + ' y')];
}

function colourFor(value, label) {
  if (value === undefined || value === null || value === '') return COLOURS[DEFAULT_COLOUR];
  const key = String(value).trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(COLOURS, key)) {
    throw new Error(
      'MAP_ANNOTATION_INVALID: ' + label + ' colour ' + JSON.stringify(value) +
        ' is not a house colour. Use one of: ' + Object.keys(COLOURS).join(', ') + '.'
    );
  }
  return COLOURS[key];
}

// Resolve and validate the annotation list for one map object. Returns [] when
// none were asked for. Throws, by name, on anything a renderer would otherwise
// have to guess at.
function resolveAnnotations(data) {
  const raw = data && data.annotations;
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    throw new Error('MAP_ANNOTATION_INVALID: annotations must be an array.');
  }
  if (raw.length === 0) return [];
  if (!mapEntry(data && data.map)) {
    throw new Error(
      'MAP_ANNOTATION_INVALID: annotations need a known map to sit on; ' +
        JSON.stringify(String((data && data.map) || '')) + ' is not one of ' + Object.keys(MAPS).join(', ') + '.'
    );
  }
  if (raw.length > MAX_ANNOTATIONS) {
    throw new Error(
      'MAP_ANNOTATION_INVALID: ' + raw.length + ' annotations asked for; a readable map carries at most ' +
        MAX_ANNOTATIONS + '.'
    );
  }

  return raw.map(function (item, i) {
    const label = 'annotation ' + (i + 1);
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('MAP_ANNOTATION_INVALID: ' + label + ' must be an object.');
    }
    const kind = String(item.kind || '').trim().toLowerCase();
    if (!KINDS.has(kind)) {
      throw new Error(
        'MAP_ANNOTATION_UNSUPPORTED: ' + label + ' kind ' + JSON.stringify(String(item.kind || '')) +
          ' is not drawable. Use one of: ' + [...KINDS].join(', ') + '.'
      );
    }

    const text = item.label === undefined || item.label === null ? '' : String(item.label);
    const colour = colourFor(item.colour, label);
    const labelAt = item.labelAt === undefined || item.labelAt === null ? null : point(item.labelAt, label + ' labelAt');

    if (kind === 'point') {
      const at = point(item.at, label + ' at');
      return { kind, at, label: text, colour, anchor: at, labelAt: labelAt || [at[0], Math.max(0, at[1] - LABEL_CLEARANCE)] };
    }

    const minPoints = kind === 'area' ? 3 : 2;
    if (!Array.isArray(item.points) || item.points.length < minPoints) {
      throw new Error(
        'MAP_ANNOTATION_INVALID: ' + label + ' of kind ' + kind + ' needs at least ' + minPoints + ' points in points.'
      );
    }
    const points = item.points.map(function (p, j) { return point(p, label + ' point ' + (j + 1)); });
    const centre = points.reduce(function (acc, p) {
      return [acc[0] + p[0] / points.length, acc[1] + p[1] / points.length];
    }, [0, 0]);
    // A region's label sits just clear of the region rather than in the middle
    // of it: a pill dropped on a small area covers the very thing it names, and
    // a child looking for where the rainforest is finds a word where the shape
    // should be. The leader line then joins the two back up.
    const top = points.reduce(function (min, p) { return Math.min(min, p[1]); }, 1);
    const clear = [centre[0], Math.max(0, top - LABEL_CLEARANCE)];
    return { kind, points, label: text, colour, anchor: centre, labelAt: labelAt || clear };
  });
}

// -- Label layout ------------------------------------------------------------
//
// Where each label's pill actually goes. A map is a fixed picture, so several
// marks near the same place produce pills that sit on top of each other: the
// Amazon River label lands on the Amazon basin label lands on Manaus, and the
// only thing a child can read is the last one drawn. So the pill positions are
// worked out from the pills themselves rather than taken as given - the house
// rule for any helper that places text.
//
// Each item gives its anchor (the mark it names) and where it would like to
// sit. The layout keeps the first placement it can find that overlaps nothing
// already placed and stays inside the picture, working outwards from the
// preferred spot; when the pill has moved away from its mark, it comes back
// with a leader line so the label still points at what it names.
//
// Everything here is in fractions of the map, so the slide engine and the
// worksheet engine place the identical labels.

const LEADER_THRESHOLD = 0.045;   // how far a pill may drift before it earns a leader line
const CANDIDATE_STEPS = [0, 0.05, 0.10, 0.16, 0.23, 0.31];
const CANDIDATE_SIDES = [
  [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]
];

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function boxAt(centre, w, h) {
  return {
    x: Math.min(Math.max(centre[0] - w / 2, 0), Math.max(0, 1 - w)),
    y: Math.min(Math.max(centre[1] - h / 2, 0), Math.max(0, 1 - h)),
    w,
    h
  };
}

// items: [{ text, anchor: [x, y], preferred: [x, y], colour }]
// sizeFor(text) -> { w, h } as fractions of the map's width and height.
function layoutLabels(items, sizeFor) {
  const placed = [];
  return (items || []).filter(function (item) { return item && item.text; }).map(function (item) {
    const size = sizeFor(item.text);
    const preferred = item.preferred || item.anchor;
    let box = null;

    for (const step of CANDIDATE_STEPS) {
      if (box) break;
      const sides = step === 0 ? [[0, 0]] : CANDIDATE_SIDES;
      for (const [dx, dy] of sides) {
        const candidate = boxAt([preferred[0] + dx * step, preferred[1] + dy * step], size.w, size.h);
        if (!placed.some(function (other) { return overlaps(candidate, other); })) {
          box = candidate;
          break;
        }
      }
    }
    // Nowhere clear: keep the preferred spot rather than pushing the label off
    // the picture. A crowded map is the designer's call to thin out, and the
    // check is looking at it.
    if (!box) box = boxAt(preferred, size.w, size.h);
    placed.push(box);

    const centre = [box.x + box.w / 2, box.y + box.h / 2];
    const drift = Math.hypot(centre[0] - item.anchor[0], centre[1] - item.anchor[1]);
    return {
      text: item.text,
      colour: item.colour,
      box,
      centre,
      leader: drift > LEADER_THRESHOLD ? [item.anchor.slice(), centre] : null
    };
  });
}

module.exports = {
  MAPS,
  COLOURS,
  DEFAULT_COLOUR,
  MAX_ANNOTATIONS,
  ASSET_DIR,
  normaliseMapKey,
  normaliseOverlayName,
  mapEntry,
  assetPathFor,
  checkOverlaySupport,
  resolveAnnotations,
  layoutLabels,
  AMAZON_BASIN_SOUTH_AMERICA,
  BRAZIL_SEED_SOUTH_AMERICA,
  BRAZIL_LABEL_SOUTH_AMERICA,
  AMAZON_BASIN_LABEL_SOUTH_AMERICA
};
