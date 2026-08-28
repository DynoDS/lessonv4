'use strict';

// SHARED amazon-study-area geometry — the single source of truth for the study
// area a rainforest unit keeps coming back to: South America in outline, Brazil
// shaded within it, and the Amazon basin drawn inside Brazil. Imported by every
// engine that draws it, so the area on the board, on the sheet and on the wall
// is the identical drawing rather than three hand-made approximations that
// disagree about where the basin is.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the drawing
//   cacheKey(spec) → string                  stable pre-render cache key
//
// WHY THIS IS ONE FIXED PICTURE. The study area is not a general map helper and
// deliberately takes no country, no projection and no overlay switches. A unit
// asking "where is this happening?" wants the same answer every time it asks,
// and a picture that can be configured is a picture that will quietly differ
// between the slide and the sheet. Anything genuinely variable belongs in the
// general map content object, not here.
//
// Spec:
//   labels   false to draw the area with no printed names at all. Omitted or
//            true prints the three names the picture is for. Nothing else is
//            ever inferred onto the drawing.
//
// The outline is a deliberately simplified schematic, not a survey coastline: it
// has to stay readable at 80mm on a printed worksheet and from the back of a
// classroom, and a true coastline reduced to that size becomes noise. It is
// accurate in the things the lesson uses it for — that Brazil is the eastern
// bulk of the continent, and that the basin sits across its north.

const MARGIN = 2;

// The schematic continent, drawn once in its own coordinate space. Everything
// else is positioned against these numbers, so the basin cannot drift out of
// Brazil when the drawing is resized.
const CONTINENT = [
  [46, 2], [60, 6], [70, 16], [76, 30], [74, 44], [66, 58],
  [60, 74], [52, 90], [44, 104], [36, 116], [28, 122], [22, 116],
  [24, 100], [20, 84], [12, 70], [8, 54], [10, 38], [18, 24],
  [30, 12], [38, 5],
];

const BRAZIL = [
  [46, 10], [60, 14], [69, 24], [73, 38], [68, 52], [60, 66],
  [52, 78], [44, 84], [36, 78], [32, 64], [34, 48], [36, 32],
  [40, 18],
];

const BASIN = [
  [38, 26], [52, 24], [62, 30], [66, 40], [60, 48], [48, 50],
  [38, 46], [33, 36],
];

const W = 84;
const H = 128;

const INK = '#1a1a1a';
const LAND = '#f2efe6';
const COUNTRY = '#cfe3cf';
const BASIN_FILL = '#7fb069';

function f(n) {
  return Math.round(n * 100) / 100;
}

function points(list) {
  return list.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[c]));
}

function cacheKey(spec) {
  const s = spec || {};
  return `amazon-study-area:${s.labels === false ? 'bare' : 'labelled'}`;
}

function tightSvg(spec) {
  const s = spec || {};
  const showLabels = s.labels !== false;

  const w = W + MARGIN * 2;
  const h = H + MARGIN * 2;

  const parts = [
    `<polygon points="${points(CONTINENT)}" fill="${LAND}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`,
    `<polygon points="${points(BRAZIL)}" fill="${COUNTRY}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`,
    `<polygon points="${points(BASIN)}" fill="${BASIN_FILL}" fill-opacity="0.85" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>`,
  ];

  if (showLabels) {
    parts.push(
      `<text x="${f(50)}" y="${f(37)}" font-size="5" text-anchor="middle" fill="${INK}">${esc('Amazon basin')}</text>`,
      `<text x="${f(52)}" y="${f(64)}" font-size="5" text-anchor="middle" fill="${INK}">${esc('Brazil')}</text>`,
      `<text x="${f(24)}" y="${f(112)}" font-size="4.5" text-anchor="middle" fill="${INK}">${esc('South America')}</text>`
    );
  }

  const svg =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" ` +
    `viewBox="${f(-MARGIN)} ${f(-MARGIN)} ${f(w)} ${f(h)}">${parts.join('')}</svg>`;

  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, cacheKey };
