"use strict";

// A method sheet built round its worked example: `layout: "pictureFirst"`.
//
// The run this came from: on 29 September 2026 the teacher flagged two Year 4
// maths walls as "very texty". Each printed its success-criteria steps, then
// the worked example as one run-on line that broke partway through a sum, and
// Friday's number line showed only the bridging half of the method. He approved
// hand-made mock-ups built the other way round: the example drawn large, each
// step's number pinned to its part of the picture, each step beside its own
// line of working. These pin that outcome on the printed page, not the markup
// that is supposed to produce it.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const style = require("../style.json");
const { preRenderSvgs } = require("../src/svg-renderer");
const { renderWorkedExample } = require("../src/render-panels");
const { pickVisual } = require("../src/visuals");
const { build, pdfPageCount } = require("../build");

// The Friday wall, as the contract's example writes it.
function fridayCard() {
  return {
    type: "workedExample",
    layout: "pictureFirst",
    page: { size: "A3", orientation: "portrait" },
    title: "Tens, then ones",
    items: [
      { label: "Worked example", text: "48 + 25 = 73" },
      { label: "Step 1", text: "{{Partition}} the second number into tens and ones.", working: "25 = 20 + 5" },
      { label: "Step 2", text: "Count on the <<tens>> from the first number.", working: "48 + 20 = 68" },
      { label: "Step 3", text: "Will the ones go past the next ten? If not, add them." },
      { label: "Step 4", text: "If they will, add enough ones to <<reach the next ten>>.", working: "68 + 2 = 70" },
      { label: "Step 5", text: "Add the ones that are left.", working: "70 + 3 = 73" },
    ],
    visual: {
      type: "numberLine", start: 45, end: 75, interval: 1, labels: [48, 68, 70, 73],
      jumps: [{ from: 48, to: 68, label: "+20" }, { from: 68, to: 70, label: "+2" }, { from: 70, to: 73, label: "+3" }],
      callouts: [{ part: "jump 1", step: 2 }, { part: "jump 2", step: 4 }, { part: "jump 3", step: 5 }],
    },
  };
}

async function render(card) {
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  return renderWorkedExample(card, style, __dirname, { svgImages });
}

test("each step prints beside its own working, and a step with none has no box", async () => {
  const html = await render(fridayCard());
  const rows = html.split('data-part="step"').slice(1);
  assert.equal(rows.length, 5, "five steps, five rows");
  const workings = rows.map((row) => (row.match(/data-part="working"[^>]*>([^<]*)</) || [])[1] || null);
  assert.deepEqual(workings, ["25 = 20 + 5", "48 + 20 = 68", null, "68 + 2 = 70", "70 + 3 = 73"]);
  assert.ok(!/Worked example:/.test(html), "the example is the question line, not a run-on paragraph under the steps");
});

test("the figure comes before the steps and keeps real room on the sheet", async () => {
  const html = await render(fridayCard());
  assert.ok(html.indexOf('data-part="figure"') < html.indexOf('data-part="steps"'), "picture first");
  const figure = html.slice(html.indexOf('data-part="figure"'));
  const heightMm = Number((figure.match(/<img[^>]*height:([\d.]+)mm/) || [])[1]);
  // An A3 portrait sheet is 420mm tall. The old sheet's number line was a
  // strip under the words; this one must read from the back of the room.
  assert.ok(heightMm >= 70, `the number line prints ${heightMm}mm tall`);
});

test("the step numbers are drawn on the picture, so the drawing grows to hold them", async () => {
  const card = fridayCard();
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  const pinned = pickVisual(card.visual, { svgImages });
  const plain = pickVisual({ ...card.visual, callouts: undefined }, { svgImages: await preRenderSvgs({ cards: [{ ...card, visual: { ...card.visual, callouts: undefined } }] }, __dirname) });
  assert.ok(pinned && pinned.buf, "the pinned drawing renders");
  assert.ok(pinned.aspect < plain.aspect, "circles above the jump labels add height rather than covering them");

  const sharp = require("sharp");
  const { data, info } = await sharp(pinned.buf).raw().toBuffer({ resolveWithObject: true });
  let green = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] < 40 && data[i + 1] > 150 && data[i + 1] < 200 && data[i + 2] > 60 && data[i + 2] < 110) green += 1;
  }
  assert.ok(green > 1000, "the green step circles are on the picture");
});

test("a step pinned to a place the drawing does not name stops the build", async () => {
  const card = fridayCard();
  card.visual.callouts = [{ part: "jump 9", step: 2 }];
  await assert.rejects(preRenderSvgs({ cards: [card] }, __dirname), /step 2 is pinned to "jump 9"/);
});

test("a picture-first card with no picture is refused, not printed as words", async () => {
  const card = fridayCard();
  delete card.visual;
  await assert.rejects(render(card), /picture-first but has no picture/);
});

test("working is refused on the older layout, where it would silently vanish", async () => {
  const card = fridayCard();
  delete card.layout;
  delete card.visual;
  await assert.rejects(render(card), /prints only on a `layout: "pictureFirst"` card/);
});

test("steps too long to sit beside the picture are refused; the picture is never dropped", async () => {
  const card = fridayCard();
  card.items = card.items.map((item) =>
    item.label.startsWith("Step") ? { ...item, text: `${item.text} ${item.text} ${item.text}` } : item
  );
  await assert.rejects(render(card), /The picture stays and the steps are never reworded/);
});

test("the Friday wall builds to exactly one A3 page", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-picture-first-"));
  const spec = { topic: "Picture first", yearGroup: 4, lessonSlug: "t", rationaleNote: "t", cards: [fridayCard()] };
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  await build(specPath, dir);
  const pdf = fs.readdirSync(dir).find((name) => name.endsWith(".pdf"));
  assert.ok(pdf, "a PDF was written");
  assert.equal(pdfPageCount(fs.readFileSync(path.join(dir, pdf))), 1);
});
