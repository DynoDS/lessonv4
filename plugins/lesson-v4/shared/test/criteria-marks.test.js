"use strict";

// Colour inside a success criterion (15 September 2026): a picture part in its
// own colour, a taught word green, the part to look at or decide orange, the
// rest black, and the same on the board, the sheet and the wall.

const test = require("node:test");
const assert = require("node:assert/strict");

const { criteriaSegments, plainCriteria, criteriaMarkProblems } = require("../text/criteria-marks");
const { splitAnswerRuns } = require("../../builder/src/answer-text");
const { renderHelper } = require("../../worksheet-html/src/helpers");
const { renderWorkedExample } = require("../../working-wall-html/src/render-panels");
const wallStyle = require("../../working-wall-html/style.json");

const STEP = "Compare the ((thousands)) first, then <<stop at the first digit that is different>>";
const THOUSANDS = "#2E75B6";
const ORANGE = "#E46C0A";

test("each kind of mark takes its own colour and the rest stays plain", () => {
  const coloured = criteriaSegments(`${STEP} and use the {{interval}}`).filter((s) => s.colour);
  assert.deepEqual(
    coloured.map((s) => [s.text, s.colour]),
    [["thousands", THOUSANDS], ["stop at the first digit that is different", ORANGE], ["interval", "#00B050"]]
  );
  assert.equal(plainCriteria(STEP), "Compare the thousands first, then stop at the first digit that is different");
});

test("brackets that name nothing drawn are ordinary brackets", () => {
  assert.equal(plainCriteria("Work out ((2 + 3) x 4)"), "Work out ((2 + 3) x 4)");
  assert.match(criteriaMarkProblems("Compare the ((biggest part)) first").join(), /names no coloured part/);
});

test("the board, the sheet and the wall colour the same words the same way", () => {
  const runs = splitAnswerRuns(STEP, true);
  assert.deepEqual(
    runs.filter((r) => r.options.color !== "000000").map((r) => [r.text, `#${r.options.color}`]),
    [["thousands", THOUSANDS], ["stop at the first digit that is different", ORANGE]]
  );

  const sheet = renderHelper({ helper: "steps", title: "Success criteria", steps: [STEP] }, 174);
  assert.match(sheet, new RegExp(`color:${THOUSANDS};">thousands</span>`));
  assert.match(sheet, new RegExp(`color:${ORANGE};">stop at the first digit that is different</span>`));

  const wall = renderWorkedExample(
    { type: "workedExample", page: { size: "A3", orientation: "landscape" }, title: "How to compare", items: [{ label: "Step 1", text: STEP }] },
    wallStyle,
    __dirname,
    { svgImages: {} }
  );
  assert.match(wall, new RegExp(`color:${THOUSANDS};">thousands</span>`));

  for (const html of [sheet, wall]) {
    assert.doesNotMatch(html, /\(\(|<<|&lt;&lt;/, "no mark may print as characters");
  }
});
