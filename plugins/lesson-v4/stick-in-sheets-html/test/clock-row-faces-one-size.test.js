"use strict";

// A strip of clock faces is one size, whatever each face carries.
//
// The strip draws its faces one at a time, each into the same box. A face with
// a digital time under it is taller than a plain face, so it was scaled down to
// fit and came out smaller than its neighbours. The clock could not draw one
// hand alone until 13 October 2026, and coloured hands always printed the
// digital time, so a strip rarely mixed them; now it can (the long hand drawn,
// the child draws the short one), and the faces a child compares must match.

const test = require("node:test");
const assert = require("node:assert");
const { renderPieceHtml } = require("../src/render-piece-html");

// Each face as printed: its radius in the drawing's own units, scaled by the
// width the strip gave that drawing.
function printedFaceRadii(html) {
  return [...html.matchAll(/<svg [^>]*?width="([\d.]+)mm"[^>]*?viewBox="0 0 ([\d.]+) [\d.]+"[^>]*>(.*?)<\/svg>/gs)].map((m) => {
    const face = /<circle cx="[\d.]+" cy="[\d.]+" r="([\d.]+)" fill="#FFFFFF"/.exec(m[3]);
    return Math.round(((Number(face[1]) * Number(m[1])) / Number(m[2])) * 100) / 100;
  });
}

const strip = async (figures, extra = {}) => renderPieceHtml({ visual: "clock-row", task: "What time is it?", per: "child", spec: { figures, ...extra } });

test("one hand, both hands and a face with the digital time under it print the same size in one strip", async () => {
  const html = (await strip([
    { time: "4:45", hands: "minute" },
    { time: "4:45", hands: "hour" },
    { time: "4:45", colourCoded: true, readout: false },
    { time: "4:45", colourCoded: true },
  ], { writeOnLabels: true })).html;
  const radii = printedFaceRadii(html);
  assert.equal(radii.length, 4);
  assert.equal(new Set(radii).size, 1, `faces of different sizes: ${radii.join(", ")}mm`);
  assert.equal((html.match(/<tspan /g) || []).length, 3, "the digital time prints once, under the face that asked for it");
});

test("a strip whose faces already agree prints exactly as it did", async () => {
  const plain = [{ time: "9:15" }, { hands: false }, { time: "1:45" }];
  const radii = printedFaceRadii((await strip(plain)).html);
  assert.equal(new Set(radii).size, 1);
  // The long hand alone needs no more room than a plain face, so it is the
  // same size as a strip of plain faces.
  const withOneHand = printedFaceRadii((await strip([{ time: "9:15", hands: "minute" }, { hands: false }, { time: "1:45" }])).html);
  assert.deepEqual(withOneHand, radii);
});
