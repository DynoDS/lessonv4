'use strict';

// SHARED world-geography-map geometry. The map is deliberately drawn from
// longitude/latitude points so its north-up orientation, latitude lines and
// biome/rainforest examples remain registered to the same geography on slides
// and on a child's stick-in map.
//
// configuration:
//   continent-retrieval  seven recognisable continents with blank name spaces
//   biome-examples       example regions for four biomes and an exact key
//   rainforest-pattern  tropical-rainforest distribution plus latitude lines
// labels: true adds continent names in the two reference configurations. The
// retrieval configuration always stays blank: it must never answer its own task.
// highlightSouthAmerica: true circles South America on a teaching slide.

const W = 1200;
const MAP_H = 620;
const MARGIN = 8;
const LEGEND_H = 82;
const FONT = 'Comic Sans MS, Comic Sans, Chalkboard SE, sans-serif';

const OCEAN = '#EAF6FF';
const LAND = '#F4F1E8';
const COAST = '#2D3740';
const LATITUDE = '#0070C0';
const HIGHLIGHT = '#E46C0A';
const TEXT = '#1A1A1A';

const BIOMES = [
  { key: 'tropical-forest', label: 'Tropical forest', colour: '#2E8B57', pattern: 'tropicalForest' },
  { key: 'desert', label: 'Desert', colour: '#E7A43A', pattern: 'desert' },
  { key: 'savannah', label: 'Savannah', colour: '#B9A634', pattern: 'savannah' },
  { key: 'tundra', label: 'Tundra', colour: '#78A9C8', pattern: 'tundra' }
];

// Simplified educational outlines in conventional north-up orientation. Small
// islands are included where they make a continent readable (Greenland, Japan,
// Indonesia, New Zealand and Madagascar), while country borders are omitted so
// the continent/biome question remains the visual focus.
const CONTINENTS = [
  { key: 'north-america', label: 'North America', anchor: [-105, 45], polygons: [
    [[-168,72],[-150,70],[-140,60],[-130,55],[-124,48],[-123,40],[-118,33],[-108,25],[-97,20],[-88,19],[-84,9],[-78,8],[-82,23],[-80,31],[-74,40],[-62,47],[-55,56],[-60,66],[-80,72],[-100,78],[-128,76]],
    [[-73,83],[-22,82],[-18,71],[-32,60],[-48,58],[-60,66]],
    [[-82,23],[-76,21],[-72,19],[-68,19],[-64,18],[-61,15],[-77,8],[-84,9]]
  ]},
  { key: 'south-america', label: 'South America', anchor: [-60, -18], polygons: [
    [[-81,12],[-70,12],[-59,8],[-49,1],[-36,-5],[-40,-18],[-48,-28],[-52,-38],[-58,-54],[-67,-55],[-73,-42],[-76,-25],[-80,-10]]
  ]},
  { key: 'europe', label: 'Europe', anchor: [15, 51], polygons: [
    [[-11,36],[-9,44],[-5,48],[2,51],[5,58],[12,63],[23,71],[40,69],[45,58],[38,50],[31,45],[26,39],[15,36],[8,42],[1,43]],
    [[-8,50],[-5,58],[-3,59],[1,51]], [[10,55],[5,58],[7,62],[15,68],[25,70],[30,66],[20,58]],
    [[12,38],[16,38],[18,41],[16,45],[12,44]], [[19,40],[24,36],[28,40],[24,45]]
  ]},
  { key: 'africa', label: 'Africa', anchor: [18, 4], polygons: [
    [[-17,36],[2,37],[16,33],[32,31],[40,21],[51,12],[46,2],[43,-12],[35,-25],[29,-34],[18,-35],[9,-27],[2,-17],[-5,-4],[-16,14],[-17,28]],
    [[44,-12],[50,-15],[49,-25],[45,-26],[43,-20]]
  ]},
  { key: 'asia', label: 'Asia', anchor: [88, 46], polygons: [
    [[26,40],[31,50],[42,57],[55,70],[85,78],[120,73],[150,68],[170,60],[176,50],[160,45],[145,40],[132,34],[124,22],[116,20],[108,8],[100,5],[95,18],[82,22],[77,8],[70,20],[56,26],[47,30],[40,36]],
    [[43,30],[52,28],[57,20],[50,13],[43,16],[39,25]],
    [[68,23],[78,30],[88,22],[81,8],[76,6],[72,16]],
    [[96,18],[104,20],[109,13],[105,6],[101,1],[99,10]],
    [[130,34],[136,36],[142,43],[146,40],[140,33]],
    [[121,20],[124,14],[122,7],[118,12]]
  ]},
  { key: 'oceania', label: 'Oceania', anchor: [136, -25], polygons: [
    [[113,-11],[128,-11],[139,-16],[153,-28],[147,-39],[132,-43],[116,-35],[111,-22]],
    [[141,-3],[151,-5],[154,-10],[147,-10]],
    [[166,-35],[176,-41],[173,-47],[165,-45]],
    [[95,5],[104,4],[105,-5],[113,-8],[119,-5],[125,-9],[132,-7],[140,-9],[140,-3],[126,1],[116,0],[108,5]]
  ]},
  { key: 'antarctica', label: 'Antarctica', anchor: [0, -78], polygons: [
    [[-180,-70],[-150,-73],[-120,-75],[-90,-72],[-60,-78],[-30,-74],[0,-77],[30,-72],[60,-76],[90,-71],[120,-74],[150,-70],[180,-72],[180,-88],[-180,-88]]
  ]}
];

const LABEL_BOXES = {
  'north-america': { x: 110, y: 120, w: 270, h: 42 },
  'south-america': { x: 310, y: 420, w: 260, h: 42 },
  europe: { x: 530, y: 154, w: 160, h: 42 },
  africa: { x: 520, y: 330, w: 180, h: 42 },
  asia: { x: 750, y: 170, w: 160, h: 42 },
  oceania: { x: 890, y: 405, w: 210, h: 42 },
  antarctica: { x: 490, y: 555, w: 240, h: 40 }
};

function f(n) { return Number(n).toFixed(2); }
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function xy(point) {
  return {
    x: MARGIN + ((point[0] + 180) / 360) * (W - 2 * MARGIN),
    y: MARGIN + ((85 - point[1]) / 173) * (MAP_H - 2 * MARGIN)
  };
}
function path(points, close) {
  return points.map(function (point, i) {
    const p = xy(point);
    return (i ? 'L ' : 'M ') + f(p.x) + ' ' + f(p.y);
  }).join(' ') + (close === false ? '' : ' Z');
}
function polygon(points, attrs) { return `<path d="${path(points)}" ${attrs}/>`; }

function resolve(data) {
  const d = data || {};
  const configuration = String(d.configuration || 'continent-retrieval').trim().toLowerCase();
  if (!['continent-retrieval', 'biome-examples', 'rainforest-pattern'].includes(configuration)) {
    throw new Error('WORLD_GEOGRAPHY_MAP_CONFIGURATION_UNSUPPORTED: expected continent-retrieval, biome-examples or rainforest-pattern; received ' + configuration);
  }
  return {
    configuration,
    labels: configuration === 'continent-retrieval' ? false : d.labels === true,
    showLatitudeLines: configuration === 'rainforest-pattern' ? d.showLatitudeLines !== false : d.showLatitudeLines === true,
    highlightSouthAmerica: d.highlightSouthAmerica === true
  };
}

function cacheKey(data) {
  const s = resolve(data);
  return ['world-geography-map', s.configuration, s.labels ? 1 : 0, s.showLatitudeLines ? 1 : 0, s.highlightSouthAmerica ? 1 : 0].join(':');
}

function patternDefs() {
  return `<defs>
    <pattern id="tropicalForest" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#B9E2C5"/><path d="M-4 16 L16 -4 M4 20 L20 4" stroke="#2E8B57" stroke-width="5"/></pattern>
    <pattern id="desert" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#F7E3B8"/><circle cx="5" cy="5" r="2.5" fill="#E7A43A"/><circle cx="14" cy="14" r="2.5" fill="#E7A43A"/></pattern>
    <pattern id="savannah" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#EEE7AD"/><path d="M2 14 L6 7 M6 14 L6 5 M10 14 L6 7" stroke="#8F8125" stroke-width="2.5" stroke-linecap="round"/></pattern>
    <pattern id="tundra" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#D6E7F1"/><path d="M0 8 H16 M8 0 V16" stroke="#78A9C8" stroke-width="3"/></pattern>
  </defs>`;
}

function landParts() {
  const parts = [];
  CONTINENTS.forEach(function (continent) {
    continent.polygons.forEach(function (poly) {
      parts.push(polygon(poly, `fill="${LAND}" stroke="${COAST}" stroke-width="3.5" stroke-linejoin="round"`));
    });
  });
  return parts;
}

function area(points, pattern) {
  return polygon(points, `fill="url(#${pattern})" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" opacity="0.96"`);
}

function tropicalForestAreas() {
  return [
    area([[-91,18],[-78,18],[-77,8],[-85,8]], 'tropicalForest'),
    area([[-79,8],[-66,7],[-50,2],[-43,-8],[-50,-17],[-62,-15],[-72,-8],[-77,0]], 'tropicalForest'),
    area([[-15,8],[8,8],[26,4],[30,-5],[20,-8],[5,-5],[-8,0]], 'tropicalForest'),
    area([[94,20],[106,18],[110,7],[104,1],[99,5]], 'tropicalForest'),
    area([[106,6],[119,5],[129,-3],[138,-7],[130,-10],[115,-7]], 'tropicalForest'),
    area([[141,-3],[153,-5],[151,-10],[143,-9]], 'tropicalForest'),
    area([[145,-11],[153,-18],[150,-22],[146,-18]], 'tropicalForest')
  ];
}

function biomeAreas() {
  const parts = tropicalForestAreas();
  // Deserts: SW North America, Atacama, Sahara/Arabia, central Australia.
  parts.push(area([[-117,37],[-102,35],[-100,25],[-112,23],[-116,30]], 'desert'));
  parts.push(area([[-75,-16],[-68,-18],[-69,-30],[-73,-28]], 'desert'));
  parts.push(area([[-16,30],[10,32],[31,26],[26,16],[5,15],[-12,20]], 'desert'));
  parts.push(area([[36,29],[55,27],[57,19],[45,15],[39,20]], 'desert'));
  parts.push(area([[120,-20],[143,-19],[145,-31],[132,-35],[118,-29]], 'desert'));
  // Savannah: tropical grasslands across four continents.
  parts.push(area([[-72,10],[-54,5],[-47,-12],[-55,-22],[-64,-12]], 'savannah'));
  parts.push(area([[-10,14],[20,15],[35,8],[36,-16],[24,-23],[8,-14],[-4,0]], 'savannah'));
  parts.push(area([[74,23],[86,23],[88,12],[78,8],[72,15]], 'savannah'));
  parts.push(area([[118,-13],[142,-12],[145,-19],[122,-20]], 'savannah'));
  // Tundra: the Arctic rims of North America, Europe and Asia.
  parts.push(area([[-160,72],[-125,75],[-80,72],[-62,64],[-90,67],[-130,68]], 'tundra'));
  parts.push(area([[5,68],[35,72],[80,76],[145,69],[160,62],[120,64],[65,66],[25,64]], 'tundra'));
  return parts;
}

function latitudeLine(lat, label) {
  const left = xy([-180, lat]);
  const right = xy([180, lat]);
  return `<g><line x1="${f(left.x)}" y1="${f(left.y)}" x2="${f(right.x)}" y2="${f(right.y)}" stroke="${LATITUDE}" stroke-width="2.5" stroke-dasharray="10 8"/><rect x="${f(left.x + 8)}" y="${f(left.y - 24)}" width="170" height="22" rx="8" fill="#FFFFFF" opacity="0.90"/><text x="${f(left.x + 16)}" y="${f(left.y - 8)}" font-family="${FONT}" font-size="20" font-weight="bold" fill="${LATITUDE}">${esc(label)}</text></g>`;
}

function labels(blank) {
  return CONTINENTS.map(function (continent) {
    const box = LABEL_BOXES[continent.key];
    const base = `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="12" fill="#FFFFFF" fill-opacity="0.94" stroke="#53616D" stroke-width="2.5"${blank ? ' stroke-dasharray="8 6"' : ''}/>`;
    if (blank) return base + `<line x1="${box.x + 14}" y1="${box.y + box.h - 11}" x2="${box.x + box.w - 14}" y2="${box.y + box.h - 11}" stroke="#53616D" stroke-width="2"/>`;
    return base + `<text x="${box.x + box.w / 2}" y="${box.y + box.h / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-size="24" font-weight="bold" fill="${TEXT}">${esc(continent.label)}</text>`;
  });
}

function legend(configuration) {
  const entries = configuration === 'biome-examples'
    ? BIOMES
    : [{ label: 'Tropical rainforest', pattern: 'tropicalForest' }];
  const cellW = configuration === 'biome-examples' ? 270 : 330;
  const totalW = entries.length * cellW;
  const startX = (W - totalW) / 2;
  return entries.map(function (entry, i) {
    const x = startX + i * cellW;
    return `<g><rect x="${f(x)}" y="${MAP_H + 19}" width="40" height="32" rx="5" fill="url(#${entry.pattern})" stroke="${COAST}" stroke-width="2"/><text x="${f(x + 52)}" y="${MAP_H + 42}" font-family="${FONT}" font-size="25" font-weight="bold" fill="${TEXT}">${esc(entry.label)}</text></g>`;
  });
}

function southAmericaRing() {
  const c = xy([-61, -20]);
  return `<ellipse cx="${f(c.x)}" cy="${f(c.y)}" rx="79" ry="150" fill="none" stroke="${HIGHLIGHT}" stroke-width="9" stroke-dasharray="18 10"/>`;
}

function describeLayout(data) {
  const s = resolve(data);
  const h = s.configuration === 'continent-retrieval' ? MAP_H : MAP_H + LEGEND_H;
  return {
    width: W,
    height: h,
    configuration: s.configuration,
    labels: CONTINENTS.map(function (c) { return { key: c.key, text: s.labels ? c.label : '', box: Object.assign({}, LABEL_BOXES[c.key]) }; }),
    legend: s.configuration === 'biome-examples' ? BIOMES.map(function (b) { return b.label; }) : (s.configuration === 'rainforest-pattern' ? ['Tropical rainforest'] : [])
  };
}

function tightSvg(data) {
  const s = resolve(data);
  const h = s.configuration === 'continent-retrieval' ? MAP_H : MAP_H + LEGEND_H;
  const parts = [patternDefs(), `<rect x="${MARGIN}" y="${MARGIN}" width="${W - 2 * MARGIN}" height="${MAP_H - 2 * MARGIN}" rx="10" fill="${OCEAN}"/>`];
  parts.push.apply(parts, landParts());

  if (s.configuration === 'biome-examples') parts.push.apply(parts, biomeAreas());
  if (s.configuration === 'rainforest-pattern') parts.push.apply(parts, tropicalForestAreas());
  if (s.showLatitudeLines) {
    parts.push(latitudeLine(23.5, 'Tropic of Cancer'));
    parts.push(latitudeLine(0, 'Equator'));
    parts.push(latitudeLine(-23.5, 'Tropic of Capricorn'));
  }
  if (s.configuration === 'continent-retrieval') parts.push.apply(parts, labels(true));
  else if (s.labels) parts.push.apply(parts, labels(false));
  if (s.highlightSouthAmerica) parts.push(southAmericaRing());
  if (s.configuration !== 'continent-retrieval') parts.push.apply(parts, legend(s.configuration));

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">${parts.join('')}</svg>`;
  return { svg, aspect: W / h, w: W, h };
}

module.exports = { BIOMES, CONTINENTS, tightSvg, cacheKey, describeLayout };
