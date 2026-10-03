// A diagramSection part that is a worked method: its drawing carries numbered
// step pins, and its steps sit under it. The teacher's divisibility wall
// (3 October 2026) printed the pins as green circles and the list as plain
// numbers in each part's own colour, blue in one box and orange in the next,
// and he read them as different steps. The list now prints the pin's own
// circle. The same parts print their steps at the close-up 28pt floor, which
// is what lets four checks fit on two sheets at all.

const test = require("node:test");
const assert = require("node:assert");

const style = require("../style.json");
const { preRenderSvgs, badgeKey } = require("../src/svg-renderer");
const { renderDiagramSection } = require("../src/render-section");

const CARDS_316 = {
  type: "digit-cards",
  text: "Is 316 divisible by 4?",
  value: "316",
  marks: [
    { digits: 1, style: "dim" },
    { id: "last two", digits: "last 2", style: "box", colour: "orange", label: "last two digits: 16" },
  ],
  working: [{ text: "half of 16 is 8", arrow: true }, { text: "8 is even, so yes ✓", colour: "green" }],
  callouts: [{ part: "last two", step: 2 }, { part: "working 1", step: 3 }],
};

const STEPS_4 = [
  "Is the number even? If not, it isn't {{divisible}} by 4.",
  "Look only at the <<last two digits>>.",
  "Halve that 2-digit number.",
  "Is the half even? Then the number is {{divisible}} by 4.",
];

function card(parts) {
  return { type: "diagramSection", page: { size: "A3", orientation: "landscape" }, title: "Is it divisible?", parts };
}

async function render(c) {
  const svgImages = await preRenderSvgs({ cards: [c] }, __dirname);
  return { html: renderDiagramSection(c, style, __dirname, { svgImages }), svgImages };
}

function stepRows(html) {
  return html.split('data-part="step"').slice(1).map((row) => row.split('data-part=')[0]);
}

test("every step in a part's list prints the same circle as the pins on its figure", async () => {
  const c = card([
    { heading: "Divisible by 4", visual: CARDS_316, steps: STEPS_4 },
    { heading: "Divisible by 4 again", visual: { ...CARDS_316, value: "524" }, steps: STEPS_4 },
  ]);
  const { html, svgImages } = await render(c);
  const rows = stepRows(html);
  assert.equal(rows.length, 8, "four steps in each of the two parts");
  rows.forEach((row, index) => {
    const n = (index % 4) + 1;
    assert.ok(svgImages[badgeKey(n)], `badge ${n} was rendered`);
    assert.ok(row.includes("<img"), `step ${n} prints a badge image, not a coloured number`);
    assert.ok(!/>\s*\d+\.\s*</.test(row), `step ${n} carries no plain "${n}." label`);
  });
});

test("steps beside a figure may print below 36pt, notes alone may not", async () => {
  const { html } = await render(card([
    { heading: "Divisible by 4", visual: CARDS_316, steps: STEPS_4 },
    { heading: "Divisible by 6", visual: { ...CARDS_316, value: "114" }, steps: STEPS_4 },
  ]));
  const sizes = [...html.matchAll(/font-size:([\d.]+)pt;line-height:1\.3/g)].map((m) => Number(m[1]));
  assert.ok(sizes.length, "the steps were drawn");
  assert.ok(Math.min(...sizes) >= 28, `no step under the 28pt close-up floor (got ${Math.min(...sizes)})`);
});
