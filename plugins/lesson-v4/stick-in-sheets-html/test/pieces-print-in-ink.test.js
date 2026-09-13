"use strict";

// EVERY STICK-IN PIECE PRINTS IN INK.
//
// The pack is photocopied, so a blue arc or an amber fan comes out as a faint
// grey a child cannot tell from the paper. Until 13 September 2026 the newer
// shared drawings printed in the stick-in profile's ink while the older ones
// went into the pack with no profile and kept their board colours (the angle's
// blue arc was the one reported). This test reads the registry, so a piece
// added later is covered by it: it fails until the piece has a sample below,
// and then fails if that sample prints any colour that is not a grey.
//
// Each sample is the most colourful form a lesson could copy across from a
// slide: answers shown, highlights on, marks and notation drawn.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { renderPieceHtml } = require("../src/render-piece-html");
const { VISUALS, ROW_VISUALS } = require("../src/visual-registry");
const angle = require("../../shared/visuals/angle-svg");
const venn = require("../../shared/visuals/venn-svg");
const reflectionGrid = require("../../shared/visuals/reflection-grid-svg");
const rainforestLayers = require("../../shared/visuals/rainforest-layers-svg");

const WORLD_MAP = {
  map: "world-with-antarctica",
  continentMarkers: [
    { marker: "1", at: [0.208, 0.25] }, { marker: "2", at: [0.333, 0.583] },
    { marker: "3", at: [0.556, 0.222] }, { marker: "4", at: [0.556, 0.472] },
    { marker: "5", at: [0.75, 0.278] }, { marker: "6", at: [0.875, 0.639] },
    { marker: "7", at: [0.5, 0.933] },
  ],
  oceanMarkers: [
    { marker: "A", at: [0.417, 0.444] }, { marker: "B", at: [0.722, 0.611] },
    { marker: "C", at: [0.069, 0.5], repeatAt: [0.944, 0.5] },
    { marker: "D", at: [0.5, 0.833] }, { marker: "E", at: [0.5, 0.083] },
  ],
  seaInitialSpaces: [[0.55, 0.305], [0.292, 0.41], [0.508, 0.19]],
  showEquator: true,
  showCompass: true,
  joinedEdges: true,
};

const SAMPLES = {
  "number-line": [
    { start: 0, end: 100, interval: 10, arrows: [{ at: 30, label: "A" }] },
    { start: 0, end: 100, interval: 10, jumps: [{ from: 20, to: 50 }] },
  ],
  "dial-scale": [{ max: 1000, value: 200, unit: "g" }],
  "measuring-jug": [{ max: 400, majorEvery: 100, minorEvery: 50, value: 250, unit: "ml", levelColor: "00B050" }],
  ruler: [{ end: 10, unit: "cm", object: { from: 0, to: 6, label: "pencil" } }],
  timeline: [{ start: 1066, end: 1500, events: [{ year: 1066, label: "Battle of Hastings" }, { year: 1215, label: "Magna Carta" }] }],
  "process-chain": [{ boxes: ["egg", null, "butterfly"] }],
  "classification-key": [{ tree: { q: "Wings?", no: { leaf: "ANT" }, yes: { leaf: "BEE" } } }],
  "concept-map": [{ centre: "Cacao", spokes: [{ label: "Money", relationship: "used as" }, { label: "Power" }, { label: "Religion" }] }],
  fishbone: [{ effect: "Flooding", causes: ["Heavy rain", "Steep slopes", "Cleared trees"] }],
  "continuum-line": [{ left: "Never fair", right: "Always fair", middle: "Sometimes", marks: 4 }],
  "source-pathway": [{ sources: ["Mains", "Battery", "Solar"], middle: "Electricity", outcome: "Lamp" }],
  "number-network": [{ target: 60, nodes: [{ x: 1, y: 0, value: 25 }, { x: 1, y: 1, value: 35 }, { x: 0, y: 2 }, { x: 2, y: 2 }], edges: [[0, 1], [1, 2], [1, 3]] }],
  venn: [
    { label1: "has a right angle", label2: "has 4 equal sides" },
    { label1: "even", label2: "multiple of 3", highlight: "overlap", shapes: [{ region: "leftOnly", label: "4" }, { region: "overlap", label: "6" }, { region: "outside", label: "7" }] },
  ],
  carroll: [
    { rowLabel: "even", rowNotLabel: "not even", colLabel: "big", colNotLabel: "small", highlight: "topLeft", shapes: [{ cell: "topLeft", label: "Square" }, { cell: "bottomRight", label: "Kite" }] },
  ],
  angle: [{ degrees: 35 }, { degrees: 90 }, { degrees: 230, sector: true, showDegrees: true, colour: "86EFAC" }],
  triangle: [
    { kind: "right", angleArcs: true },
    { kind: "equilateral", symmetryLines: true, symmetryLinesAnswer: true },
  ],
  "reflection-grid": [{ cols: 8, rows: 6, mirror: { orientation: "vertical", at: 4 }, shape: [[1, 1], [3, 1], [3, 3]], showReflection: true }],
  "coordinate-grid": [{ cols: 8, rows: 6, points: [{ x: 1, y: 1, label: "A" }, { x: 4, y: 1, label: "B" }, { x: 4, y: 4, label: "C" }], join: true, route: [4, 4] }],
  "translation-shape": [{ cols: 10, rows: 8, points: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 3 }], translate: { dx: 4, dy: 2 }, showImage: true }],
  geoboard: [{
    cols: 5, rows: 5, emphasiseVertices: true,
    shapes: [{ points: [[1, 1], [3, 1], [3, 3], [1, 3]], outline: "C00000", fill: "CCE2F5", notation: { ticks: { 0: 1, 2: 1 }, arrows: { 1: 1, 3: 1 }, rightAngles: [0] } }],
    symmetryLines: [[[2, 0], [2, 4]]], symmetryLinesAnswer: true,
  }],
  "grid-map": [{
    eastings: [31, 32, 33, 34, 35], northings: [51, 52, 53, 54],
    river: [[31.2, 53.8], [32.5, 52.5], [34.8, 51.2]], roads: [[[31, 51.5], [35, 51.5]]],
    features: [{ name: "Church", square: [32, 53], type: "human" }, { name: "Hill", square: [34, 52], type: "physical", icon: "^" }],
    highlightSquare: [32, 53],
  }],
  "rainforest-layers": [{}, { blank: false, labels: true, heights: true, light: true, notes: { canopy: "a thick roof" }, highlight: ["emergent", "canopy"] }],
  map: [WORLD_MAP],
  "geographical-description-frame": [{ answers: { biome: "a large area with its own plants" } }],
  table: [{ headers: ["Device", "Electrical?"], rows: [["Kettle", "||yes"], ["Book", ""]] }],
  "line-pair": [
    { relationship: "parallel", form: "horizontal", notation: "arrows" },
    { relationship: "perpendicular", form: "L", notation: "right-angle" },
  ],
  "bar-model": [
    { shape: "part-whole", whole: { label: "24" }, parts: [{ label: "8" }, { label: "?" }] },
    { shape: "comparison", bars: [{ label: "£27.40", value: 27.4 }, { label: "£12.75", value: 12.75 }], difference: { label: "?" } },
  ],
  "tally-chart": [{ title: "Pets", headers: ["Pet", "Tally", "Total"], highlight: "Dog", rows: [{ label: "Dog", tally: 7, total: "||7" }, { label: "Cat", tally: 3 }] }],
  pictogram: [{ title: "Books", categories: ["Blue", "Red"], values: [8, 5], highlight: "Blue", key: { per: 2, label: "books" } }],
  "blank-surface": [{ surface: "number-line", start: 0, end: 100 }, { surface: "bar", bars: 2 }],
  "balanced-pattern-plate": [{ mode: "practice", givenGroups: ["fruit-vegetables"] }, {}],
  "circuit-diagram": [{ circuits: [{ label: "A", state: "complete" }, { label: "B", state: "switch-open" }, { label: "C", state: "gap" }] }],
  "circuit-symbol-bank": [{ items: [{ symbol: "cell", label: "cell" }, { symbol: "lamp", label: "lamp" }, { symbol: "switch-open", label: "open" }] }],
  "parachute-forces": [{ showEqualityTicks: true }],
  "bar-chart": [{ categories: ["Apple", "Pear"], values: [4, 6], y_interval: 2 }],
  "line-graph": [{ points: [{ x: 0, y: 4 }, { x: 2, y: 9 }], xStep: 1 }],
  "shaded-fraction": [{ parts: 8, shaded: 3 }, { parts: 4, shaded: 1, shape: "circle", colour: "EF4444" }],
  "fraction-wall": [{ fractions: [1, 2, 3, 4] }],
  money: [{ items: ["£2", "£1", "20p", "20p", "10p"] }],
  clock: [{ time: "3:40", colourCoded: true, minuteRing: true }, { hands: false }],
  "turn-diagram": [{ quarters: 3, direction: "anticlockwise", countMarks: true }],
  "triangle-square": [{ triangles: ["35", ""], square: "80" }],
  polygon: [{ shapes: [{ name: "kite", label: "Kite" }, { name: "parallelogram", candidate: "vertical", fold: true, verdict: "fail" }] }],
  "translation-grid": [{ max: 6, from: { x: 1, y: 1 }, to: { x: 4, y: 3 } }],
  "area-grid": [{ cols: 8, rows: 5, unitLabel: "Each square = 1m²", rects: [{ x: 0, y: 0, w: 3, h: 2, label: "A" }] }],
  "comparison-slot": [{ left: "5", answer: ">", right: "3" }],
  "place-value-chart": [{ columns: ["Th", "H", "T", "O"], rows: [{ label: "3,462", cells: ["3", "4", "6", "2"] }, { label: "10 more", cells: ["3", "4", "7", "2"], highlight: ["T"] }] }],
  "place-value-mini": [{ mode: "placeholder", number: "4050" }],
  "base-ten-blocks": [{ counts: { Th: 2, H: 4, T: 3, O: 6 } }],
  "counter-group": [{ statement: "5,009 = 5,000 + 9", joiner: "+", groups: [{ value: "1000", count: 5 }, { value: "1", count: 9 }] }],
  "part-whole-model": [{ whole: "45", parts: ["27", "18"] }],
  pyramid: [{ rows: [{ cells: 1, items: ["||42"] }, { cells: 2, items: ["20", "22"] }, { cells: 3, items: ["8", "12", "10"] }] }],
  "mult-grid": [{ corner: "×", colHeaders: ["9", "6", "7"], rowHeaders: ["3", "8"], cells: [["27", "18", "21"], ["72", "", "56"]] }],
  "angle-row": [{ figures: [{ degrees: 35 }, { degrees: 90 }, { degrees: 230, sector: true }], writeOnLabels: true }],
  "triangle-row": [{ figures: [{ kind: "isosceles" }, { kind: "right", angleArcs: true }] }],
  "geoboard-row": [{ figures: [{ cols: 4, rows: 4, shapes: [{ points: [[0, 0], [2, 0], [1, 2]], fill: "D5F5E3", notation: { arrows: { 0: 1 } } }] }, { cols: 4, rows: 4 }] }],
  "clock-row": [{ figures: [{ time: "9:15" }, { hands: false }] }],
};

// A grey keeps all three channels within a few steps of each other; black and
// white are greys. Anything else is a colour the photocopier will lose.
const NEUTRAL_WORDS = new Set(["none", "transparent", "currentcolor", "inherit", "black", "white", "grey", "gray", "silver"]);
const isGrey = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) <= 8;

function coloursIn(html) {
  const found = new Set();
  // Every hex colour anywhere in the markup, attribute or style, except a
  // reference to an element id (url(#id), href="#id").
  for (const m of html.matchAll(/(?<!url\(|href=")#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    if (!isGrey(r, g, b)) found.add(`#${hex.toUpperCase()}`);
  }
  // rgb() colours and colour words in paint attributes and styles.
  for (const m of html.matchAll(/(?:fill|stroke|stop-color|flood-color|color)\s*(?:=\s*"|:\s*)([^";>]+)/gi)) {
    const value = m[1].trim().toLowerCase();
    const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(value);
    if (rgb) {
      if (!isGrey(+rgb[1], +rgb[2], +rgb[3])) found.add(value);
    } else if (!value.startsWith("#") && !value.startsWith("url(") && !NEUTRAL_WORDS.has(value)) {
      found.add(value);
    }
  }
  return [...found];
}

test("every piece the pack can draw has a sample here, so a new piece is checked too", () => {
  const missing = [...Object.keys(VISUALS), ...Object.keys(ROW_VISUALS)].filter((visual) => !SAMPLES[visual]);
  assert.deepStrictEqual(missing, [], `add a sample spec for ${missing.join(", ")} to this test`);
});

test("every stick-in piece prints in ink", async () => {
  const failures = [];
  for (const visual of [...Object.keys(VISUALS), ...Object.keys(ROW_VISUALS)]) {
    for (const spec of SAMPLES[visual] || []) {
      const piece = await renderPieceHtml({ visual, spec });
      assert.ok(piece, `${visual} sample ${JSON.stringify(spec).slice(0, 60)} drew nothing`);
      const colours = coloursIn(piece.html);
      if (colours.length) failures.push(`${visual}: ${colours.join(" ")}`);
    }
  }
  assert.deepStrictEqual(failures, [], `colour reached the photocopied pack:\n${failures.join("\n")}`);
});

test("a labelled photo diagram's dots and answers print in ink", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-ink-"));
  fs.writeFileSync(path.join(dir, "plant.svg"), '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="#ddd"/></svg>');
  const piece = await renderPieceHtml({
    visual: "label-diagram",
    spec: { image: "plant.svg", callouts: [{ anchor: [50, 30], label: "flower" }, { anchor: [40, 70], label: "leaf||leaf" }] },
  }, { baseDir: dir });
  assert.ok(piece);
  // The embedded picture itself is the photo the board shows, so only the
  // drawing laid over it is checked.
  const overlay = piece.html.replace(/href="data:[^"]*"/g, "");
  assert.deepStrictEqual(coloursIn(overlay), []);
});

test("the same drawings keep their colours everywhere but the pack", () => {
  const board = [
    angle.tightSvg({ degrees: 35 }).svg,
    venn.tightSvg({ label1: "a", label2: "b" }).svg,
    reflectionGrid.tightSvg({ cols: 6, rows: 4, shape: [[1, 1], [2, 1], [2, 2]] }).svg,
    rainforestLayers.tightSvg({}).svg,
  ];
  for (const svg of board) assert.ok(coloursIn(svg).length > 0, "a board drawing lost its colours");
});
