"use strict";

// The picture takes the room, and its own words print at the wall's size.
//
// What these guard. A stress test of twenty lessons (7 October 2026) found the
// same fault on eight of their walls: a chart 180mm wide on a 420mm sheet,
// side lengths at 18pt beside 44pt sums, photographs 74 to 116mm wide beside
// blank strips. One cause under all of them: the words were fitted first and
// grew to fill the sheet, the picture took what was left, and it had been
// drawn beforehand for a guessed width and was then shrunk, its numbers and
// labels with it. Nothing measured any of that; the only check on a picture
// was that it was over 25mm.
//
// The teacher settled what he wanted from pictures of his own posters (10
// October 2026), and each test below is one of his answers:
//   - a picture's numbers and labels print at wall size, never shrunk with it;
//   - where the picture is the teaching, the words drop to their floor first;
//   - a fact with a picture beside it gets a real half of the sheet each
//     (test/nothing-prints-past-a-panel-edge.test.js holds that one);
//   - one idea, one sheet, each sheet its own colour
//     (test/section-gives-the-figure-the-room.test.js);
//   - a story stays on one sheet, its photographs trimmed to fill their rows.
//
// They assert what prints, in millimetres and points, not the markup.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const style = require("../style.json");
const { build } = require("../build");
const { preRenderSvgs } = require("../src/svg-renderer");
const { renderStepByStep } = require("../src/render-steps");
const { renderDiagramSection } = require("../src/render-section");
const { wordScale, assertFigureWordsReadable } = require("../src/figure-size");
const { buildLabelDiagramSvg } = require("../../shared/visuals/label-diagram-svg");

const LANDSCAPE = { size: "A3", orientation: "landscape" };
const PORTRAIT = { size: "A3", orientation: "portrait" };
const PIZZA = path.join(__dirname, "..", "test-fixtures-a3", "photos", "pizza.jpg");

const L_SHAPE = {
  type: "polygon",
  shapes: [{ vertices: [[0, 0], [10, 0], [10, 3], [4, 3], [4, 8], [0, 8]], sideLabels: ["10 cm", "3 cm", "A = 6 cm", "B = 5 cm", "4 cm", "8 cm"] }],
};
// The Year 5 poster from the stress test, as its wall designer wrote it.
const perimeterAndArea = () => ({
  type: "diagramSection", page: LANDSCAPE, title: "Perimeter and area",
  parts: [
    { heading: "The perimeter", visual: L_SHAPE, notes: ["A = 10 − 4 = 6 cm", "B = 8 − 3 = 5 cm"], result: "Perimeter = 10 + 3 + 6 + 5 + 4 + 8 = 36 cm" },
    { heading: "The area", visual: L_SHAPE, notes: ["10 × 3 = 30 cm²", "4 × 5 = 20 cm²"], result: "Area = 30 + 20 = 50 cm²" },
  ],
});

function wallDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-picture-room-"));
  fs.mkdirSync(path.join(dir, "photos"));
  fs.copyFileSync(PIZZA, path.join(dir, "photos", "pizza.jpg"));
  return dir;
}

// Builds one card the way a wall is built and returns what its drawings
// printed at. Rejects with the build's own refusal.
async function printed(card) {
  const dir = wallDir();
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Picture room", cards: [card] }));
  const report = {};
  const log = console.log;
  const warn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    await build(specPath, dir, { validateOnly: true, report });
  } finally {
    console.log = log;
    console.warn = warn;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  return report.placedByCard[0];
}

const wordsPt = (p) => p.words.fontPt * wordScale(p);

test("a shape's side lengths print at wall size, not shrunk with the shape", async () => {
  const shapes = await printed(perimeterAndArea());
  assert.equal(shapes.length, 2);
  for (const shape of shapes) {
    // They printed at 18pt: laid out for 180mm, placed at 116mm.
    assert.ok(wordsPt(shape) >= 25, `the side lengths print at ${wordsPt(shape).toFixed(1)}pt`);
  }
});

test("the same shape in two parts of one sheet prints one size, and bigger than the words left it", async () => {
  const [left, right] = await printed(perimeterAndArea());
  assert.ok(Math.abs(left.hMm - right.hMm) < 0.5 && Math.abs(left.wMm - right.wMm) < 0.5, `${left.wMm}x${left.hMm}mm beside ${right.wMm}x${right.hMm}mm`);
  // 84mm tall under two 44pt sums; the sums at their floor leave it 98mm.
  assert.ok(left.hMm >= 95, `the shape prints ${left.hMm}mm tall`);
});

test("a section's notes sit at their floor while a bigger size would cost the drawing room", async () => {
  const card = perimeterAndArea();
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  const html = renderDiagramSection(card, style, __dirname, { svgImages });
  const notes = [...html.matchAll(/data-part="note" style="[^"]*font-size:([\d.]+)pt/g)].map((m) => Number(m[1]));
  assert.ok(notes.length === 4 && notes.every((pt) => pt === 36), `notes at ${notes.join(", ")}pt`);
});

test("a section's notes still grow where the drawing cannot use the height", async () => {
  // A number line is as wide as its part and shallow, so the height under it
  // is spare and the words take it.
  const line = { type: "numberLine", start: 340, end: 350, interval: 5, labels: "all" };
  const card = { type: "diagramSection", page: PORTRAIT, title: "Rounding", parts: [
    { heading: "Nearer ten", visual: line, notes: ["346 is nearer 350"] },
    { heading: "Nearer still", visual: line, notes: ["342 is nearer 340"] },
  ] };
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  const html = renderDiagramSection(card, style, __dirname, { svgImages });
  const notes = [...html.matchAll(/data-part="note" style="[^"]*font-size:([\d.]+)pt/g)].map((m) => Number(m[1]));
  assert.ok(notes.every((pt) => pt > 36), `notes at ${notes.join(", ")}pt`);
});

test("a chart with its parts labelled fills its sheet, and its axis numbers print at wall size", async () => {
  const [chart] = await printed({
    type: "labelledDiagram", page: LANDSCAPE, title: "How to read a bar chart",
    visual: {
      type: "bar-chart", title: "How Oak Class get to school", categories: ["Walk", "Car", "Bike", "Bus"], values: [8, 11, 4, 5],
      y_interval: 2, y_max: 12, y_label: "Number of children",
      callouts: [
        { anchor: [8.6, 79.3], label: "The scale: the numbers up the side" },
        { anchor: [50.1, 19.45], label: "Car is 11. The bar stops halfway between 10 and 12." },
      ],
    },
    caption: "The scale counts in 2s, so each line up is worth 2, not 1.",
  });
  // 17pt axis numbers on a chart 128mm tall in a 187mm space.
  assert.ok(wordsPt(chart) >= 25, `the axis numbers print at ${wordsPt(chart).toFixed(1)}pt`);
  const chartHeightMm = chart.hMm * chart.words.shareH;
  assert.ok(chartHeightMm >= 150, `the chart itself prints ${chartHeightMm.toFixed(0)}mm tall`);
});

test("the band above and below a labelled picture is only as deep as its labels reach", () => {
  const args = {
    href: "data:image/png;base64,AA==", width: 1800, height: 1200, layout: "sides", labelMaxChars: 13, marginYRatio: 0.02,
    callouts: [{ anchor: [70, 50], label: "Car is 11. The bar stops halfway between 10 and 12.", given: true }],
  };
  const loose = buildLabelDiagramSvg(args);
  const snug = buildLabelDiagramSvg({ ...args, snug: true });
  assert.ok(loose.h > 1200 * 1.15, "the label's half height was kept above and below the picture");
  assert.ok(snug.h < 1200 * 1.07, `a label beside the middle reaches past neither edge, and the picture is ${snug.h} tall`);
  const bare = buildLabelDiagramSvg({ ...args, callouts: [], snug: true });
  assert.deepStrictEqual([bare.w, bare.h], [1800, 1200], "a picture with nothing to label keeps no band round it");
});

test("the names on a labelled photograph print at the wall's floor or bigger", async () => {
  const dir = wallDir();
  try {
    const earth = { type: "label-diagram", imagePath: "photos/pizza.jpg", layout: "sides", callouts: [
      { anchor: [26, 25], label: "night", given: true },
      { anchor: [49, 61], label: "We are here", given: true },
      { anchor: [63, 50], label: "day", given: true },
    ] };
    const specPath = path.join(dir, "working-wall.json");
    fs.writeFileSync(specPath, JSON.stringify({ topic: "Labels", cards: [{
      type: "diagramSection", page: LANDSCAPE, title: "Day and night", parts: [
        { heading: "The Earth rotates", visual: earth, notes: ["The Earth rotates once every 24 hours."] },
        { heading: "The Sun stays where it is", visual: { type: "label-diagram", imagePath: "photos/pizza.jpg", layout: "sides", callouts: [] }, notes: ["It is the Earth that turns."] },
      ],
    }] }));
    const report = {};
    const log = console.log;
    console.log = () => {};
    try {
      await build(specPath, dir, { validateOnly: true, report });
    } finally {
      console.log = log;
    }
    const [labelled, bare] = report.placedByCard[0];
    // They printed at 16pt, a twentieth of the photograph whatever its size.
    assert.ok(wordsPt(labelled) >= 19.5, `the names print at ${wordsPt(labelled).toFixed(1)}pt`);
    assert.equal(bare.words, null, "a photograph with no names has none to measure");
    assert.ok(Math.abs(bare.wMm / bare.hMm - 1) < 0.02, "and no band round it: it prints at the photograph's own shape");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a drawing whose own words print under the floor is refused, and told to give the picture more", () => {
  const squeezed = [{ wMm: 100, hMm: 60, room: { wMm: 100, hMm: 60 }, type: "bar-chart", words: { identity: "x", naturalWidthMm: 300, share: 1, layoutWidthMm: 300, fontPt: 28, minFontPt: 20 } }];
  assert.throws(
    () => assertFigureWordsReadable({ type: "stickyKnowledge" }, squeezed, 'stickyKnowledge "Remember"'),
    /WALL_FIGURE_WORDS_TOO_SMALL: stickyKnowledge "Remember"[\s\S]*bar-chart at about 9pt[\s\S]*one idea to a sheet/
  );
  const readable = [{ ...squeezed[0], wMm: 230 }];
  assert.doesNotThrow(() => assertFigureWordsReadable({ type: "stickyKnowledge" }, readable, "card"));
});

test("the pictures beside the steps of an approved step sheet are the close-up, and are not refused", () => {
  // Five column sums down a page, each about 84mm wide: the sheet the
  // teacher approved on 5 October 2026 prints them at under half the width
  // they are laid out for, and it still builds.
  const sum = [{ wMm: 84, hMm: 56, room: { wMm: 84, hMm: 56 }, type: "place-value-chart", words: { identity: "x", naturalWidthMm: 180, share: 1, layoutWidthMm: 180, fontPt: 28, minFontPt: 20 } }];
  assert.doesNotThrow(() => assertFigureWordsReadable({ type: "stepByStep" }, sum, "card"));
  assert.throws(() => assertFigureWordsReadable({ type: "diagramSection", parts: [{}, {}] }, sum, "card"), /WALL_FIGURE_WORDS_TOO_SMALL/);
});

// ─── A story's photographs fill their rows ──────────────────────────────

// A photograph of the usual shape, three wide to two tall (the fixture's own
// is square).
async function storyDir() {
  const dir = wallDir();
  await require("sharp")(PIZZA).resize(600, 400, { fit: "cover" }).jpeg().toFile(path.join(dir, "photos", "wide.jpg"));
  return dir;
}

const story = (steps) => ({ type: "stepByStep", page: PORTRAIT, title: "The Great Fire of London", example: "This was in the year 1666.", steps });
const fiveDays = (extra = {}, photo = "photos/wide.jpg") => story([
  { heading: "Sunday", key: "A fire started in a bakery.", photo },
  { heading: "Monday", key: "People got away in boats.", photo, note: ["boats"], point: [14, 88], ...extra },
  { heading: "Tuesday", key: "People pulled houses down.", photo, note: ["long hooks"], point: [60, 40] },
  { heading: "Wednesday", key: "The wind stopped blowing.", photo },
  { heading: "Thursday", key: "The fire was out.", photo },
]);

const rowsOf = (html) => html.split('data-part="step"').slice(1);
const num = (text, pattern) => Number((text.match(pattern) || [])[1]);
const figureOf = (row) => {
  const [, style] = row.match(/data-part="figure" style="([^"]*)"/);
  const [, img] = row.match(/data-part="figure"[^>]*><img [^>]*style="([^"]*)"/);
  return {
    left: num(style, /left:([\d.-]+)mm/), top: num(style, /top:([\d.-]+)mm/),
    w: num(img, /width:([\d.]+)mm/), h: num(img, /height:([\d.]+)mm/),
    position: (img.match(/object-position:([\d.]+)% ([\d.]+)%/) || []).slice(1).map(Number),
    trimmed: /object-fit:cover/.test(img),
  };
};
const noteOf = (row) => {
  const [, style] = row.match(/data-part="note" style="([^"]*)"/);
  return { left: num(style, /left:([\d.-]+)mm/), top: num(style, /top:([\d.-]+)mm/), w: num(style, /width:([\d.]+)mm/), h: num(style, /height:([\d.]+)mm/) };
};

async function steps(card) {
  const dir = await storyDir();
  try {
    const svgImages = await preRenderSvgs({ cards: [card] }, dir);
    return rowsOf(renderStepByStep(card, style, dir, { svgImages }));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("five photographs down a page each fill the room beside their card, all one size", async () => {
  const figures = (await steps(fiveDays())).map(figureOf);
  assert.equal(figures.length, 5);
  for (const figure of figures) {
    // They printed 74 to 84mm wide, with a strip kept blank for a note on
    // every row, noted or not.
    assert.ok(figure.trimmed, "the photograph is trimmed to its row");
    assert.ok(figure.w >= 140, `the photograph prints ${figure.w}mm wide`);
    assert.deepStrictEqual([figure.w, figure.h], [figures[0].w, figures[0].h]);
  }
});

test("a note stands on its photograph, clear of the place it points at", async () => {
  const rows = await steps(fiveDays());
  for (const row of [rows[1], rows[2]]) {
    const figure = figureOf(row);
    const note = noteOf(row);
    assert.ok(note.left >= figure.left && note.left + note.w <= figure.left + figure.w + 0.01, "the note is inside the photograph's width");
    assert.ok(note.top >= figure.top && note.top + note.h <= figure.top + figure.h + 0.01, "and inside its height");
    assert.match(row, /data-part="arrow"/);
  }
  // Monday's boats are at the photograph's foot, left: the note stands top right.
  const monday = { figure: figureOf(rows[1]), note: noteOf(rows[1]) };
  assert.ok(monday.note.left > monday.figure.left + monday.figure.w / 2 && monday.note.top < monday.figure.top + monday.figure.h / 2);
});

test("the trim keeps the place a note points at, or the part the designer names", async () => {
  const rows = await steps(fiveDays());
  // The boats are 88% of the way down: the window is the foot of the picture.
  assert.equal(figureOf(rows[1]).position[1], 100);
  // No point and no focus: the middle.
  assert.deepStrictEqual(figureOf(rows[0]).position, [50, 50]);
  const named = await steps(story([
    { heading: "Sunday", key: "A fire started.", photo: "photos/wide.jpg", focus: "top" },
    { heading: "Monday", key: "People got away.", photo: "photos/wide.jpg", focus: [50, 100] },
    { heading: "Tuesday", key: "Houses came down.", photo: "photos/wide.jpg" },
    { heading: "Wednesday", key: "The wind stopped.", photo: "photos/wide.jpg" },
    { heading: "Thursday", key: "The fire was out.", photo: "photos/wide.jpg" },
  ]));
  assert.equal(figureOf(named[0]).position[1], 0);
  assert.equal(figureOf(named[1]).position[1], 100);
  await assert.rejects(steps(fiveDays({ focus: "the boats" })), /gives a `focus` the sheet cannot read/);
});

test("a photograph that would lose most of itself to the trim is shown whole", async () => {
  // A square photograph in a row five to a page would keep under two fifths
  // of itself: it prints whole, at its own shape.
  const rows = await steps(fiveDays({}, "photos/pizza.jpg"));
  for (const row of rows) {
    const figure = figureOf(row);
    assert.equal(figure.trimmed, false);
    assert.ok(Math.abs(figure.w / figure.h - 1) < 0.02, `a square photograph printed ${figure.w}x${figure.h}mm`);
  }
});

test("a drawing beside a step is never trimmed", async () => {
  const line = { type: "numberLine", start: 0, end: 10, interval: 1, labels: "all" };
  const card = { type: "stepByStep", page: PORTRAIT, title: "Count on", steps: [
    { heading: "Start", key: "0", visual: { type: "clock", time: "3:00" } },
    { heading: "Count", key: "1, 2, 3", visual: line },
  ] };
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  for (const row of rowsOf(renderStepByStep(card, style, __dirname, { svgImages }))) {
    assert.equal(figureOf(row).trimmed, false);
  }
});
