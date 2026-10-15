"use strict";
// A long multiplication on the wall keeps its place colours.
//
// The wall could put up only one row of a five-step method (stress test,
// 7 October 2026), because its column sum had one answer row. The sum now
// holds the rows of working, and a step sheet shows it growing, on a second
// sheet too, since a sum seven rows deep runs on to one. Its rows, their labels
// and the multiplier's digits took each step card's colour until 14 October
// 2026, so the ones row stood blue beside a red "ones" in the criteria. They
// now keep the places' colours, as on the slides and the sheet, and the step's
// colour stays on what points: its card, its number and the ring.
const test = require("node:test");
const assert = require("node:assert/strict");
const { stepVisual, methodVisual, continueStepSheets, STEP_THEMES } = require("../src/step-colours");

const sum = (upTo, extra = {}) => ({ type: "place-value-chart", calculation: { operator: "x", numbers: ["2314", "32"], upTo, ...extra } });
const [BLUE, , PURPLE] = STEP_THEMES.map((theme) => theme.main);
const steps = [
  { heading: "Multiply by the ones digit", visual: sum("ones row", { ring: "O" }) },
  { heading: "Start a new row", visual: sum("tens zero") },
  { heading: "Multiply by the tens digit", visual: sum("tens row", { ring: "T" }) },
  { heading: "Add the two rows", visual: sum("total") },
];

test("a step sheet leaves the rows in their place colours and rings in the step's colour", () => {
  const card = { type: "stepByStep", title: "Long multiplication", steps };
  continueStepSheets([card]);
  steps.forEach((_, k) => assert.equal(stepVisual(card, k).calculation.colours, undefined, `step ${k + 1}`));
  assert.equal(stepVisual(card, 0).calculation.ringColour, BLUE);
  assert.equal(stepVisual(card, 2).calculation.ringColour, PURPLE, "the ring is the step's own colour");
  assert.deepEqual(stepVisual(card, 1), steps[1].visual, "a step with no ring is drawn as written");
});

test("a second sheet of the same method counts its ring colours on", () => {
  const first = { type: "stepByStep", title: "Long multiplication", steps: steps.slice(0, 2) };
  const second = { type: "stepByStep", title: "Long multiplication", steps: steps.slice(2) };
  continueStepSheets([first, second]);
  assert.equal(stepVisual(second, 0).calculation.ringColour, PURPLE);
  assert.equal(stepVisual(second, 0).calculation.colours, undefined);
});

test("on a one-picture method sheet the circles take the step colours and the rows keep the places'", () => {
  const card = {
    type: "workedExample", layout: "pictureFirst",
    visual: { ...sum("total"), callouts: [
      { part: "row 1 label", step: 1 }, { part: "ones row 2", step: 2 },
      { part: "row 2 label", step: 3 }, { part: "ones answer", step: 4 },
    ] },
  };
  const out = methodVisual(card);
  assert.equal(out.calculation.colours, undefined);
  assert.equal(out.callouts[0].colour, BLUE);
});

test("a column addition's steps are coloured as they were", () => {
  const add = (answer) => ({ type: "place-value-chart", calculation: { operator: "+", numbers: ["247", "135"], answer } });
  const card = { type: "stepByStep", title: "Add", steps: [{ heading: "a", visual: add("2") }, { heading: "b", visual: add("82") }] };
  continueStepSheets([card]);
  assert.deepEqual(stepVisual(card, 1), add("82"));
});
