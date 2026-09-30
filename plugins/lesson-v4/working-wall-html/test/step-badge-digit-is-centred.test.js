"use strict";

// A worked-example step's number sits in the middle of its green circle.
//
// The run this came from: on two Year 4 maths walls (29 September 2026) every
// step number sat in the top half of its circle, and the teacher read it as a
// long-standing bug. The badge asked for its digit to be centred with
// dominant-baseline="central", which the SVG library inside sharp ignores, so
// the digit's baseline landed on the centre line. The digit was also Arial
// Black beside Comic Sans words.
//
// This measures the white ink in the rendered badge, through the same
// preRenderSvgs path a real wall takes, rather than checking the SVG markup:
// the markup looked right the whole time the print was wrong.
//
// Run it with the plugin's own sharp (0.33.5, in this folder's node_modules).
// sharp 0.34 does honour dominant-baseline, so under a newer copy found higher
// up the disk the old badge would pass too; the fix holds under both.

const test = require("node:test");
const assert = require("node:assert");

const { preRenderSvgs, badgeKey, badgeSvg } = require("../src/svg-renderer");
const style = require("../style.json");

// How far the ink's centre may sit from the circle's centre, as a share of the
// badge. At 4% a 16mm badge is off by well under a millimetre; the fault this
// guards against put the digit about 20% high.
const TOLERANCE = 0.04;

function bufferOf(entry) {
  return Buffer.isBuffer(entry) ? entry : entry.png;
}

async function inkBox(png) {
  const sharp = require("sharp");
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  let top = Infinity, bottom = -1, left = Infinity, right = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const opaque = info.channels < 4 || data[i + 3] > 200;
      if (opaque && data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
        top = Math.min(top, y); bottom = Math.max(bottom, y);
        left = Math.min(left, x); right = Math.max(right, x);
      }
    }
  }
  return { top, bottom, left, right, width: info.width, height: info.height };
}

test("every step number from 1 to 9 is centred in its circle", async () => {
  const items = [];
  for (let n = 1; n <= 9; n++) items.push({ label: `Step ${n}`, text: "A step." });
  items.push({ label: "Worked example", text: "7 + 3 = 10" });
  const spec = { cards: [{ type: "workedExample", title: "Steps", page: { size: "A3", orientation: "landscape" }, items }] };

  const map = await preRenderSvgs(spec, __dirname);
  for (let n = 1; n <= 9; n++) {
    const entry = map[badgeKey(n)];
    assert.ok(entry, `step ${n} has no badge picture`);
    const box = await inkBox(bufferOf(entry));
    assert.ok(box.bottom > box.top, `step ${n}'s badge has no white digit in it`);
    const dy = ((box.top + box.bottom) / 2 - box.height / 2) / box.height;
    const dx = ((box.left + box.right) / 2 - box.width / 2) / box.width;
    assert.ok(Math.abs(dy) <= TOLERANCE,
      `step ${n}'s number sits ${Math.abs(Math.round(dy * 100))}% of the circle ${dy < 0 ? "above" : "below"} the middle`);
    assert.ok(Math.abs(dx) <= TOLERANCE,
      `step ${n}'s number sits ${Math.abs(Math.round(dx * 100))}% of the circle ${dx < 0 ? "left" : "right"} of the middle`);
  }
});

test("the step number is drawn in the wall's own font", () => {
  const svg = badgeSvg(3);
  const family = (svg.match(/font-family="([^"]+)"/) || [])[1] || "";
  assert.strictEqual(family.split(",")[0].trim(), style.fonts.title,
    "the badge's first-choice font should be the wall's title font, so the number matches the words beside it");
});
