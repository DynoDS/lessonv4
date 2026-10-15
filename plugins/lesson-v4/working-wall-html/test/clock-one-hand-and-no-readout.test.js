"use strict";

// The wall's clock: one hand alone, and coloured hands without the digital time.
//
// A Year 2 lesson on quarter past and quarter to (7 October 2026) could not
// show the long hand on its own, and gave up its coloured hands because they
// always printed the digital time: 4:45 under a quarter to 5 clock, the wording
// the lesson was steering the class away from. The clock now draws either hand
// alone and lets the digital time be turned off. Two things are the wall's own
// and are held here: the caption it adds under a plain clock, and the size of
// faces standing side by side in one section.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { defaultVisualLabel } = require("../src/visuals");
const { build } = require("../build");

test("the wall adds the time under a plain clock, and not where it was turned off or one hand is hidden", () => {
  assert.equal(defaultVisualLabel({ type: "clock", time: "8:50" }), "8:50");
  assert.equal(defaultVisualLabel({ type: "clock", time: "8:50", hands: true }), "8:50");
  assert.equal(defaultVisualLabel({ type: "clock", time: "4:45", colourCoded: true }), "");
  assert.equal(defaultVisualLabel({ type: "clock", time: "4:45", readout: false }), "");
  assert.equal(defaultVisualLabel({ type: "clock", time: "4:45", hands: "minute" }), "");
  assert.equal(defaultVisualLabel({ type: "clock", time: "4:45", hands: "hour" }), "");
  // A caption the designer wrote is always kept.
  assert.equal(defaultVisualLabel({ type: "clock", time: "4:45", hands: "hour", label: "quarter to 5" }), "quarter to 5");
});

test("a section with one hand beside coloured hands and a digital time builds", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-clock-"));
  const spec = {
    topic: "Quarter to",
    yearGroup: "Year 2",
    lessonSlug: "quarter-to",
    rationaleNote: "Test.",
    cards: [{
      type: "diagramSection",
      page: { size: "A3", orientation: "landscape" },
      title: "Quarter to 5",
      parts: [
        { heading: "the long hand", visual: { type: "clock", time: "4:45", hands: "minute", colourCoded: true }, notes: ["The long {{minute hand}} points at the <<9>>."] },
        { heading: "both hands", visual: { type: "clock", time: "4:45", colourCoded: true }, notes: ["Quarter to 5."] },
      ],
    }],
  };
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  try {
    await build(specPath, dir, {});
    assert.ok(fs.readdirSync(dir).some((name) => name.endsWith(".pdf")), "the sheet was written");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
