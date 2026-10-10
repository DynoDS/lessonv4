"use strict";

// A sequence longer than a step sheet used to hold.
//
// The run this came from: the Year 4 "Features of a river" wall in the stress
// test of 7 October 2026. Six features in order, source to mouth, went up as
// two sheets numbered 1, 2, 3 and 1, 2, 3 in the same three colours, each
// photograph a different size with its labels out in the margins. The teacher
// chose, from pictures of that wall rebuilt (10 October 2026): all six on one
// sheet, every photograph filling its row with its label on it, the lesson's
// own sentence whole, and for a sequence too long for one sheet a second sheet
// that carries on the count and the colours. These pin that on the printed
// page.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const sharp = require("sharp");
const style = require("../style.json");
const { preRenderSvgs } = require("../src/svg-renderer");
const { renderStepByStep, MAX_STEPS } = require("../src/render-steps");
const { continueStepSheets, stepVisual, STEP_THEMES } = require("../src/step-colours");
const { build, pdfPageCount } = require("../build");

const PAGE = { size: "A3", orientation: "portrait" };
const PHOTO = "photos/pizza.jpg";

// An ordinary three-by-two photograph, the shape a lesson's pictures have.
async function photoDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-long-steps-"));
  fs.mkdirSync(path.join(dir, "photos"));
  await sharp(path.join(__dirname, "..", "test-fixtures-a3", "photos", "pizza.jpg")).resize(900, 600, { fit: "cover" }).jpeg().toFile(path.join(dir, PHOTO));
  return dir;
}

// The river sheet's own words, as the lesson wrote them.
const RIVER = [
  ["{{source}}", "the place where a river begins", [58, 70]],
  ["{{tributary}}", "a <<smaller river>> that flows into a bigger river", [64, 18]],
  ["{{confluence}}", "the <<place>> where two rivers join", [37, 74]],
  ["{{meander}}", "a big bend in a river", [69, 55]],
  ["{{estuary}}", "the wide part of a river near the sea, where salty sea water mixes in", [45, 25]],
  ["{{mouth}}", "the place where a river ends and flows into the sea", [58, 54]],
];
const riverSteps = (rows = RIVER) => rows.map(([heading, text, point]) => ({
  heading, text, photo: PHOTO, note: [heading.replace(/[{}]/g, "")], point,
}));
const sheet = (steps, title = "A river, source to mouth") => ({ type: "stepByStep", page: PAGE, title, steps });

async function render(card, dir, cards = [card]) {
  continueStepSheets(cards);
  const svgImages = await preRenderSvgs({ cards }, dir);
  return renderStepByStep(card, style, dir, { svgImages });
}

const rowsOf = (html) => html.split('data-part="step"').slice(1);
const numberOf = (row) => Number((row.match(/data-part="number"[^>]*>(\d+)</) || [])[1]);
const cardBorder = (row) => (row.match(/data-part="card"[^>]*border:[\d.]+mm solid #([0-9A-Fa-f]{6})/) || [])[1];
const mm = (row, part, prop) => Number((row.match(new RegExp(`data-part="${part}" style="[^"]*?${prop}:([\\d.-]+)mm`)) || [])[1]);
const figureWidth = (row) => Number((row.match(/data-part="figure"[^>]*><img[^>]*width:([\d.]+)mm/) || [])[1]);

test("six steps in order go on one sheet, numbered 1 to 6, every photograph the same size", async () => {
  assert.equal(MAX_STEPS, 6);
  const dir = await photoDir();
  const rows = rowsOf(await render(sheet(riverSteps()), dir));
  assert.deepEqual(rows.map(numberOf), [1, 2, 3, 4, 5, 6]);
  const widths = rows.map(figureWidth);
  assert.ok(widths.every((w) => w === widths[0] && w > 120), `the photographs fill their rows at one width: ${widths.join(", ")}mm`);
  const lefts = rows.map((row) => mm(row, "figure", "left"));
  assert.ok(lefts.every((x) => x === lefts[0]), "and share one left edge");
});

test("the lesson's sentence goes up whole: the cards widen a little before a sheet is refused", async () => {
  const dir = await photoDir();
  const short = rowsOf(await render(sheet(riverSteps(RIVER.map((row, k) => (k === 4 ? [row[0], "the wide part of a river near the sea", row[2]] : row)))), dir));
  const whole = await render(sheet(riverSteps()), dir);
  const rows = rowsOf(whole);
  assert.match(whole, /where salty sea water mixes in/);
  assert.ok(mm(rows[0], "card", "width") > mm(short[0], "card", "width"), "the cards are wider for the long sentence");
  assert.ok(mm(rows[0], "card", "width") < mm(short[0], "card", "width") * 1.16, "but by a strip, not a column");
  assert.ok(new Set(rows.map((row) => mm(row, "card", "width"))).size === 1, "and every card on the sheet is the same width");

  const essay = riverSteps();
  essay[4].text = "the wide part of a river near the sea, where salty sea water mixes in with the fresh river water twice a day as the tide comes in and goes out again";
  await assert.rejects(render(sheet(essay), dir), /step 5's words do not fit/);
});

test("a second sheet of the same sequence carries on the count and the colours", async () => {
  const dir = await photoDir();
  const eight = [...RIVER, ["{{delta}}", "land built up at the mouth", [50, 50]], ["{{sea}}", "where the river's water ends up", [50, 50]]];
  const first = sheet(riverSteps(eight.slice(0, 4)));
  const second = sheet(riverSteps(eight.slice(4)));
  const cards = [first, second];
  const one = rowsOf(await render(first, dir, cards));
  const two = rowsOf(await render(second, dir, cards));
  assert.deepEqual([...one, ...two].map(numberOf), [1, 2, 3, 4, 5, 6, 7, 8]);
  const mains = STEP_THEMES.map((theme) => theme.main.toUpperCase());
  assert.deepEqual([...one, ...two].map((row) => cardBorder(row).toUpperCase()), [0, 1, 2, 3, 4, 0, 1, 2].map((k) => mains[k]), "step 5 takes the fifth colour, not the first again");
});

test("a drawing on the second sheet takes the carried-on colour too", () => {
  const line = (jumps) => ({ type: "numberLine", start: 0, end: 30, interval: 1, jumps });
  const first = sheet([{ heading: "a", visual: line([{ from: 0, to: 10 }]) }, { heading: "b", visual: line([{ from: 10, to: 20 }]) }], "Count on");
  const second = sheet([{ heading: "c", visual: line([{ from: 20, to: 25 }]) }, { heading: "d", visual: line([{ from: 25, to: 30 }]) }], "Count on");
  continueStepSheets([first, second]);
  assert.equal(stepVisual(second, 0).jumps[0].colour, STEP_THEMES[2].main);
  assert.equal(stepVisual(first, 0).jumps[0].colour, STEP_THEMES[0].main);
});

test("two step sheets with different titles are two methods, and each starts at 1", async () => {
  const dir = await photoDir();
  const first = sheet(riverSteps(RIVER.slice(0, 3)), "The upper river");
  const second = sheet(riverSteps(RIVER.slice(3)), "The lower river");
  const cards = [first, second];
  await render(first, dir, cards);
  assert.deepEqual(rowsOf(await render(second, dir, cards)).map(numberOf), [1, 2, 3]);

  // A sheet of another kind between them breaks the run as well.
  const apart = [sheet(riverSteps(RIVER.slice(0, 3))), { type: "sectionHeading", title: "Rivers" }, sheet(riverSteps(RIVER.slice(3)))];
  continueStepSheets(apart);
  const svgImages = await preRenderSvgs({ cards: apart }, dir);
  assert.deepEqual(rowsOf(renderStepByStep(apart[2], style, dir, { svgImages })).map(numberOf), [1, 2, 3]);
});

test("a photograph with its labels out in the margins is turned away from a step, and told what to write", async () => {
  const dir = await photoDir();
  const steps = riverSteps(RIVER.slice(0, 3));
  steps[1] = {
    heading: "{{tributary}}", text: "a smaller river",
    visual: { type: "label-diagram", imagePath: PHOTO, layout: "sides", callouts: [{ anchor: [64, 18], label: "tributary", given: true }, { anchor: [79, 39], label: "confluence", given: true }] },
  };
  await assert.rejects(render(sheet(steps), dir), /step 2 draws its photograph as a `label-diagram`[\s\S]*"photo": "photos\/pizza\.jpg"[\s\S]*"also"/);
});

test("a second place on a step's photograph: a label of its own, clear of the step's label, in the colour of the step it names", async () => {
  const dir = await photoDir();
  const steps = riverSteps(RIVER.slice(0, 3));
  steps[1].also = { note: "confluence", point: [79, 39] };
  const rows = rowsOf(await render(sheet(steps), dir));
  const purple = STEP_THEMES[2].main;
  assert.match(rows[1], new RegExp(`data-part="also"[^>]*solid #${purple}`, "i"), "confluence is step 3's word, so it is step 3's purple here too");
  assert.match(rows[1], new RegExp(`data-part="also-arrow"[^>]*stroke="#${purple}"`, "i"), "and so is its arrow");

  const unnamed = riverSteps(RIVER.slice(0, 3));
  unnamed[1].also = { note: "waterfall", point: [79, 39] };
  assert.match(rowsOf(await render(sheet(unnamed), dir))[1], /data-part="also"[^>]*background:#FFFFFF/, "a word no step names is plain");

  // The word's own step may be on the next sheet of the same sequence.
  const first = sheet(riverSteps(RIVER.slice(0, 2)));
  first.steps[1].also = { note: "confluence", point: [79, 39] };
  const second = sheet(riverSteps(RIVER.slice(2, 4)));
  assert.match(rowsOf(await render(first, dir, [first, second]))[1], new RegExp(`data-part="also"[^>]*solid #${purple}`, "i"));
  assert.ok(!/data-part="also"/.test(rows[0]), "a step without one draws none");
  const box = (part) => ({ x: mm(rows[1], part, "left"), y: mm(rows[1], part, "top"), w: mm(rows[1], part, "width"), h: mm(rows[1], part, "height") });
  const own = box("note");
  const also = box("also");
  const apart = own.x + own.w <= also.x || also.x + also.w <= own.x || own.y + own.h <= also.y || also.y + also.h <= own.y;
  assert.ok(apart, "the two labels do not overlap");

  const noOwn = riverSteps(RIVER.slice(0, 3));
  delete noOwn[1].note;
  delete noOwn[1].point;
  noOwn[1].also = { note: "confluence", point: [79, 39] };
  await assert.rejects(render(sheet(noOwn), dir), /step 2 has an `also` label but no label of its own/);

  // Six to a sheet, a row keeps about the middle half of a photograph's height.
  const farApart = riverSteps();
  farApart[1].point = [50, 2];
  farApart[1].also = { note: "confluence", point: [50, 98] };
  await assert.rejects(render(sheet(farApart), dir), /two places too far apart/);
});

test("the river wall builds to one A3 page", async () => {
  const dir = await photoDir();
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Features of a river", yearGroup: 4, lessonSlug: "t", rationaleNote: "t", cards: [sheet(riverSteps())] }));
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

test("the designer can say which corner a label stands in, and a corner over the pointed place is refused", async () => {
  const dir = await photoDir();
  const steps = riverSteps(RIVER.slice(0, 3));
  const auto = rowsOf(await render(sheet(steps), dir))[0];
  const moved = riverSteps(RIVER.slice(0, 3));
  moved[0].noteCorner = "bottom left";
  const row = rowsOf(await render(sheet(moved), dir))[0];
  assert.ok(mm(row, "note", "top") > mm(auto, "note", "top"), "the label has moved from the top to the foot of the photograph");
  assert.equal(mm(row, "note", "left"), mm(row, "figure", "left") + 3);

  const over = riverSteps(RIVER.slice(0, 3));
  over[0].point = [10, 10];
  over[0].noteCorner = "top left";
  await assert.rejects(render(sheet(over), dir), /over the very place it points at/);

  const odd = riverSteps(RIVER.slice(0, 3));
  odd[0].noteCorner = "middle";
  await assert.rejects(render(sheet(odd), dir), /"top left", "top right", "bottom left" or "bottom right"/);
});
