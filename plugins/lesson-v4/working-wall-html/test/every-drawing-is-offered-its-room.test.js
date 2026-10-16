"use strict";

// Every sheet tells the build the room it gave its drawing.
//
// What this guards. On 10 October 2026 the teacher ruled that a wall picture
// takes the room and its numbers print at wall size. The build does that by
// laying a drawing out again for the room its sheet offered (figure-size.js
// `offerRoom`, build.js `fitDrawings`). A sheet that never says what room it
// gave is never laid out again, so its drawing keeps a narrow first shape.
// The one-big-picture method sheet (`layout: "pictureFirst"`) was missed when
// the rule reached the other sheets: a week of Year 4 column subtraction walls
// (stress test, 15 October 2026) printed Thursday's chart 136mm wide on a
// 297mm sheet, with blank margins either side of it.
//
// So every kind of sheet that can carry a drawing is built here, and each
// drawing it places must have had its room offered. A new kind of sheet that
// places a drawing without saying fails this until it does.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { build } = require("../build");

const FIXTURES = path.join(__dirname, "..", "test-fixtures-a3");
const PORTRAIT = { size: "A3", orientation: "portrait" };

// The Thursday wall from the stress test, as its wall designer wrote it.
function thursdayCard() {
  return {
    type: "workedExample", layout: "pictureFirst", page: PORTRAIT, title: "Column subtraction",
    items: [
      { label: "Worked example", text: "4,371 - 185 = 4,186" },
      { label: "Step 1", text: "Line up the digits." },
      { label: "Step 2", text: "Write the symbol." },
      { label: "Step 3", text: "Start with the ((ones)). Then ((tens)), then ((hundreds)), then ((thousands))." },
      { label: "Step 4", text: "In each column, take the bottom digit away from the top digit.\nCrossed out? Use the <<new digit>> above it.\nTop digit smaller? {{Exchange}}: take 1 from the column on the left to make 10 more in this column." },
    ],
    visual: {
      type: "place-value-chart", columns: ["Th", "H", "T", "O"],
      calculation: { operator: "-", numbers: ["4371", "185"], answer: "4186", exchanges: [{ from: "T", to: "O" }, { from: "H", to: "T" }] },
      callouts: [{ part: "ones number 2", step: 1 }, { part: "sign", step: 2 }, { part: "ones number 1", step: 3 }, { part: "tens exchange", step: 4 }],
    },
  };
}

const sum = (answer) => ({ type: "place-value-chart", columns: ["Hundreds", "Tens", "Ones"], calculation: { operator: "+", numbers: ["247", "135"], ...(answer ? { answer } : {}) } });
const L_SHAPE = { type: "polygon", shapes: [{ vertices: [[0, 0], [10, 0], [10, 3], [4, 3], [4, 8], [0, 8]], sideLabels: ["10 cm", "3 cm", "6 cm", "5 cm", "4 cm", "8 cm"] }] };

// One card of each kind not already among the saved fixtures.
const WRITTEN_CARDS = [
  thursdayCard(),
  {
    type: "stepByStep", page: PORTRAIT, title: "How to add in columns", example: "247 + 135",
    steps: [
      { heading: "Line up the digits", text: "Ones under ones.", visual: sum() },
      { heading: "Add the ones", text: "Write the 2 in the ones.", visual: sum("2") },
    ],
  },
  {
    type: "diagramSection", page: { size: "A3", orientation: "landscape" }, title: "Perimeter",
    parts: [{ heading: "The perimeter", visual: L_SHAPE, notes: ["10 + 3 + 6 + 5 + 4 + 8 = 36 cm"] }],
  },
];

// Every saved fixture card that asks for a drawing.
function fixtureCards() {
  const cards = [];
  for (const file of fs.readdirSync(FIXTURES).filter((f) => f.endsWith(".json"))) {
    const spec = JSON.parse(fs.readFileSync(path.join(FIXTURES, file), "utf8"));
    for (const card of spec.cards || []) if (JSON.stringify(card).includes('"visual"')) cards.push({ file, card });
  }
  return cards;
}

async function placed(card) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-room-offered-"));
  fs.cpSync(path.join(FIXTURES, "photos"), path.join(dir, "photos"), { recursive: true });
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Room offered", cards: [card] }));
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
  return report.placedByCard[0] || [];
}

test("every kind of sheet with a drawing offers the drawing its room", async () => {
  const cards = [...fixtureCards(), ...WRITTEN_CARDS.map((card) => ({ file: "written here", card }))];
  const kinds = new Set();
  const missed = [];
  for (const { file, card } of cards) {
    const kind = card.type + (card.layout ? `:${card.layout}` : "");
    const drawings = await placed(card);
    if (drawings.length) kinds.add(kind);
    for (const d of drawings) if (!d.roomOffered) missed.push(`${kind} (${file}) placed a ${d.type || "drawing"} without saying its room`);
  }
  // The sheets the build draws pictures on; if one stops placing a drawing
  // here, the check has stopped covering it.
  for (const kind of ["workedExample:pictureFirst", "stepByStep", "diagramSection", "referenceTable", "equivalenceGrid", "stickyKnowledge", "labelledDiagram"]) {
    assert.ok(kinds.has(kind), `no ${kind} sheet placed a drawing, so it went unchecked`);
  }
  assert.deepEqual(missed, []);
});

test("Thursday's column subtraction chart prints across most of the sheet", async () => {
  const [chart] = await placed(thursdayCard());
  // It printed 136mm wide on the 297mm sheet; given its room it is about 222mm.
  assert.ok(chart.wMm >= 200, `the chart prints ${Math.round(chart.wMm)}mm wide`);
});
