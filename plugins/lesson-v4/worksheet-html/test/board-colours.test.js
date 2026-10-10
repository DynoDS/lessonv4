"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { withBoardColours } = require("../src/board-colours");

const use = (configuration) => ({ representationId: "rep-001", configuration });
const frame = (extra = {}) => ({ helper: "fraction-bar", shape: "grid", parts: 10, rows: 2, shaded: 9, helperUse: use("boxes-shown"), ...extra });
const board = (colour, rep = "rep-001") => ({ type: "shaded-fraction", shape: "grid", parts: 10, shaded: 8, ...(colour ? { colour } : {}), helperUse: { representationId: rep } });
const sheet = (...content) => ({ sheets: { below: { zones: { top: content } } } });
const colours = (spec) => spec.sheets.below.zones.top.map((n) => n.colour);

test("a sheet drawing takes the colour the slides gave the same drawing", () => {
  // Year 1 number bonds, 7 October 2026: ten frames blue on every slide and
  // soft green on all three sheets, because the sheet never learned the colour.
  const lesson = { slides: [{ content: [board("3D85C6"), board("#3d85c6")] }] };
  const before = sheet(frame(), frame());
  const { spec, adopted } = withBoardColours(before, lesson);
  assert.equal(adopted, 2);
  assert.deepEqual(colours(spec), ["3D85C6", "3D85C6"]);
  assert.deepEqual(colours(before), [undefined, undefined], "the spec it was given is left alone");
});

test("the sheet's own colour, a different drawing and a different representation are all left alone", () => {
  const lesson = { slides: [{ content: [board("3D85C6")] }] };
  const { spec, adopted } = withBoardColours(
    sheet(
      frame({ colour: "E46C0A" }),
      frame({ helperUse: { representationId: "rep-002" } }),
      { helper: "bar-model", helperUse: use("x") },
      { helper: "fraction-bar", parts: 4, shaded: 1 }
    ),
    lesson
  );
  assert.equal(adopted, 0);
  assert.deepEqual(colours(spec), ["E46C0A", undefined, undefined, undefined]);
});

test("nothing is copied when the slides disagree, state no colour, or do not exist", () => {
  const two = { slides: [{ content: [board("3D85C6"), board("E46C0A")] }] };
  const some = { slides: [{ content: [board("3D85C6"), board(null)] }] };
  for (const lesson of [two, some, { slides: [{ content: [board(null)] }] }, null, undefined]) {
    const before = sheet(frame());
    const { spec, adopted } = withBoardColours(before, lesson);
    assert.equal(adopted, 0);
    assert.equal(spec, before);
  }
});
