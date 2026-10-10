"use strict";

// stepByStep: a method or a sequence told stage by stage down the page.
//
// The run this came from: the Year 4 column addition wall of 5 October 2026.
// The teacher took down a sheet showing one finished sum with five step numbers
// scattered over it, and approved a mock-up built the other way: the steps in
// order down the page, each a coloured card with a number on its corner, the
// sum drawn again beside every step one move further on, the digit just
// written ringed, and a short note with a curly arrow to it. He asked for it
// as a style any wall can use, in any subject. These pin that outcome on the
// printed page: the order, the three weights of words, the pictures in one
// column, the ring and arrow, and that it draws photographs and other
// drawings as well as sums.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const style = require("../style.json");
const { preRenderSvgs } = require("../src/svg-renderer");
const { renderStepByStep } = require("../src/render-steps");
const { build, pdfPageCount } = require("../build");

const PAGE = { size: "A3", orientation: "portrait" };
const sum = (answer, carry) => ({
  type: "place-value-chart",
  columns: ["Hundreds", "Tens", "Ones"],
  calculation: { operator: "+", numbers: ["247", "135"], ...(answer ? { answer } : {}), ...(carry ? { carry } : {}) },
});

function columnSum() {
  return {
    type: "stepByStep", page: PAGE, title: "How to add in columns", example: "247 + 135",
    steps: [
      { heading: "Line up the digits", text: ["Ones under ones.", "Tens under tens."], visual: sum() },
      { heading: "Add the ones", key: "7 + 5 = 12", text: "Write the 2 in the ones.", visual: sum("2"), note: ["7 + 5 = 12", "Write 2 ones"], point: "ones answer" },
      { heading: "Exchange", key: "12 ones = 1 ten and 2 ones", text: "Write a small 1 under the tens.", visual: sum("2", { Tens: "1" }), note: ["10 ones", "for 1 ten"], point: "tens carry" },
      { heading: "Add the tens", key: "4 + 3 + 1 = 8", text: "Add the small 1 too.", visual: sum("82", { Tens: "1" }), note: ["4 + 3 + 1 = 8"], point: "tens answer" },
      { heading: "Add the hundreds", key: "2 + 1 = 3", text: "The answer is 382.", visual: sum("382", { Tens: "1" }), note: ["247 + 135", "= 382"], point: "hundreds answer" },
    ],
  };
}

async function render(card, dir = __dirname) {
  const svgImages = await preRenderSvgs({ cards: [card] }, dir);
  return renderStepByStep(card, style, dir, { svgImages });
}

const rowsOf = (html) => html.split('data-part="step"').slice(1);
const mmOf = (html, part, prop) => Number((html.match(new RegExp(`data-part="${part}" style="[^"]*?${prop}:([\\d.-]+)mm`)) || [])[1]);
const figureWidth = (row) => Number((row.match(/data-part="figure"[^>]*><img[^>]*width:([\d.]+)mm/) || [])[1]);

test("the steps run down the page in order, each numbered on its card", async () => {
  const rows = rowsOf(await render(columnSum()));
  assert.equal(rows.length, 5);
  rows.forEach((row, index) => {
    assert.match(row, new RegExp(`data-part="number"[^>]*>${index + 1}<`), `step ${index + 1} carries its number`);
  });
  assert.deepEqual(
    rows.map((row) => (row.match(/data-part="heading"[^>]*>([^<]*)</) || [])[1]),
    ["Line up the digits", "Add the ones", "Exchange", "Add the tens", "Add the hundreds"]
  );
});

test("a step's words have three weights: bold heading, key line in the step's colour, plain sentence", async () => {
  const row = rowsOf(await render(columnSum()))[1];
  const styleOf = (part) => (row.match(new RegExp(`data-part="${part}" style="([^"]*)"`)) || [])[1];
  assert.match(styleOf("heading"), /font-weight:bold/);
  assert.match(styleOf("key"), /font-weight:bold/);
  assert.match(styleOf("text"), /font-weight:normal/);
  const border = (row.match(/data-part="card"[^>]*border:[\d.]+mm solid (#[0-9A-F]{6})/i) || [])[1];
  assert.ok(border && styleOf("key").includes(`color:${border}`), "the key line is the card's own colour");
  assert.notEqual(border.toUpperCase(), "#00B050", "a step is never answer green");
});

test("the pictures line up in one column at one size, so the eye sees what changed", async () => {
  const rows = rowsOf(await render(columnSum()));
  const lefts = rows.map((row) => mmOf(row, "figure", "left"));
  const widths = rows.map(figureWidth);
  assert.ok(lefts.every((x) => x === lefts[0]), `figures start at ${lefts.join(", ")}`);
  assert.ok(Math.max(...widths) - Math.min(...widths) < 0.5, `figure widths ${widths.join(", ")}`);
  assert.ok(widths[0] >= 60, `a column sum prints ${widths[0]}mm wide on a five-step sheet`);
});

test("the digit a step wrote is ringed, and its note's arrow stops at the picture's edge", async () => {
  const rows = rowsOf(await render(columnSum()));
  assert.ok(!/data-part="ring"/.test(rows[0]) && !/data-part="arrow"/.test(rows[0]), "a step with no note and no point draws neither");
  for (const row of rows.slice(1)) {
    assert.match(row, /data-part="ring"/);
    assert.match(row, /data-part="arrow"/);
    const figureRight = mmOf(row, "figure", "left") + figureWidth(row);
    const tip = Number((row.match(/<polygon points="([\d.-]+),/) || [])[1]);
    assert.ok(tip > figureRight && tip < figureRight + 3, `the arrow tip (${tip}) rests just outside the picture (${figureRight})`);
    assert.ok(mmOf(row, "note", "left") > tip, "the note sits clear of the picture");
  }
});

test("it is not a maths sheet: photographs and a spot given by numbers", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-steps-"));
  fs.mkdirSync(path.join(dir, "photos"));
  fs.copyFileSync(path.join(__dirname, "..", "test-fixtures-a3", "photos", "pizza.jpg"), path.join(dir, "photos", "pizza.jpg"));
  const card = {
    type: "stepByStep", page: PAGE, title: "How a pizza is made",
    steps: [
      { heading: "Make the dough", key: "flour, water, yeast", text: "Knead it until it is stretchy.", photo: "photos/pizza.jpg", note: ["the base"], point: [50, 80] },
      { heading: "Add the toppings", text: "Spread them right to the edge.", photo: "photos/pizza.jpg" },
      { heading: "Bake it", text: "Ten minutes in a very hot oven." },
    ],
  };
  const rows = rowsOf(await render(card, dir));
  assert.match(rows[0], /data-part="arrow"/);
  assert.ok(!/data-part="ring"/.test(rows[0]), "a spot on a photograph is pointed at, not ringed");
  assert.ok(!/data-part="figure"/.test(rows[2]), "a step may go without a picture");
  assert.ok(mmOf(rows[2], "card", "width") > mmOf(rows[0], "card", "width") * 1.5, "and its card then runs the full width");
});

test("a wide picture takes the width beside its card, with its note above it", async () => {
  const line = (jumps, labels) => ({ type: "numberLine", start: 45, end: 75, interval: 1, labels, jumps });
  const card = {
    type: "stepByStep", page: PAGE, title: "Add by counting on", example: "48 + 25 = 73",
    steps: [
      { heading: "Count on the tens", key: "48 + 20 = 68", visual: line([{ from: 48, to: 68, label: "+20" }], [48, 68]), note: ["two tens"], point: "jump 1" },
      { heading: "Add the ones", key: "68 + 5 = 73", visual: line([{ from: 48, to: 68, label: "+20" }, { from: 68, to: 73, label: "+5" }], [48, 68, 73]), note: ["five ones"], point: "jump 2" },
    ],
  };
  const rows = rowsOf(await render(card));
  assert.ok(figureWidth(rows[0]) > 130, `the number line prints ${figureWidth(rows[0])}mm wide`);
  rows.forEach((row) => assert.ok(mmOf(row, "note", "top") < mmOf(row, "figure", "top"), "the note sits above the line"));
});

test("what the sheet refuses, and says why", async () => {
  const landscape = columnSum();
  landscape.page = { size: "A3", orientation: "landscape" };
  await assert.rejects(render(landscape), /read down the page/);

  const seven = columnSum();
  seven.steps.push({ heading: "Check", visual: sum("382", { Tens: "1" }) }, { heading: "Check again", visual: sum("382", { Tens: "1" }) });
  await assert.rejects(render(seven), /needs 2-6 steps and has 7[\s\S]*evenly over two sheets with the same title/);

  const words = columnSum();
  words.steps = words.steps.map(({ visual, note, point, ...rest }) => rest);
  await assert.rejects(render(words), /draws nothing/);

  const misnamed = columnSum();
  misnamed.steps[1].point = "ones total";
  await assert.rejects(render(misnamed), /points at "ones total"[\s\S]*ones answer/);

  const wordy = columnSum();
  wordy.steps[2].text = "Twelve ones is the same as one ten and two ones, so write the two ones in the ones column and a small one under the tens column to add next.";
  await assert.rejects(render(wordy), /step 3's words do not fit/);

  const essay = columnSum();
  essay.steps[1].note = ["Seven ones add five ones makes twelve ones which is more than nine so we have to exchange"];
  await assert.rejects(render(essay), /step 2's note does not fit/);
});

test("the column sum sheet builds to exactly one A3 page", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-steps-build-"));
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Step by step", yearGroup: 4, lessonSlug: "t", rationaleNote: "t", cards: [columnSum()] }));
  const log = console.log;
  console.log = () => {};
  try {
    await build(specPath, dir);
  } finally {
    console.log = log;
  }
  const pdf = fs.readdirSync(dir).find((name) => name.endsWith(".pdf"));
  assert.ok(pdf, "a PDF was written");
  assert.equal(pdfPageCount(fs.readFileSync(path.join(dir, pdf))), 1);
});

test("what a step adds to a number line is drawn in that step's colour, and keeps it", async () => {
  // The teacher's note on the first number line sheet (6 October 2026): every
  // jump was the one blue, so nothing tied the +2 to the orange step that made it.
  const { stepVisual, STEP_THEMES } = require("../src/step-colours");
  const line = (jumps) => ({ type: "numberLine", start: 45, end: 75, interval: 1, labels: [48, 68, 70, 73], jumps });
  const tens = { from: 48, to: 68, label: "+20" };
  const two = { from: 68, to: 70, label: "+2" };
  const three = { from: 70, to: 73, label: "+3" };
  const card = {
    type: "stepByStep", page: PAGE, title: "Add by counting on",
    steps: [
      { heading: "Count on the tens", visual: line([tens]) },
      { heading: "Reach the next ten", visual: line([tens, two]) },
      { heading: "Add the rest", visual: line([tens, two, { ...three, colour: "111111" }]) },
    ],
  };
  const colours = (index) => stepVisual(card, index).jumps.map((jump) => jump.colour);
  const [blue, orange] = STEP_THEMES.map((theme) => theme.main);
  assert.deepEqual(colours(0), [blue]);
  assert.deepEqual(colours(1), [blue, orange]);
  assert.deepEqual(colours(2), [blue, orange, "111111"], "a jump the designer coloured is left alone");
  assert.equal(card.steps[1].visual.jumps[1].colour, undefined, "the card's own plan is not rewritten");

  // And it reaches the drawn picture: the orange is in the second step's line.
  const chart = require("../../shared/visuals/number-line-svg");
  const { profileFor } = require("../../shared/visuals/surface-profiles");
  const svg = chart.tightSvg(stepVisual(card, 1), profileFor("wall", { widthMm: 180 })).svg;
  assert.ok(svg.includes(`stroke="#${orange}"`), "the +2 jump is drawn orange");
  assert.ok(svg.includes(`stroke="#${blue}"`), "the +20 jump stays blue");
  await render(card);
});
