"use strict";

// A note ringing one place in a wall drawing and pointing at it.
//
// The run this came from: the Year 4 "Remember" card for column addition with
// no exchange (5 October 2026). It read "A zero holds an empty place so the
// other digits keep their value." over the sum 3,204 + 564, and nothing in the
// picture picked out the zero the sentence is about. The teacher asked for the
// ring and note of the step-by-step sheet on it. These pin that on the drawn
// picture: the ring is on the named digit, the note stands outside the grid,
// the arrow keeps off the digit beside the one it points at, and the pointer
// is refused where it would be guessed or mixed with another kind.

const test = require("node:test");
const assert = require("node:assert");

const { noteCalloutsSvg } = require("../src/note-callouts");
const { preRenderSvgs } = require("../src/svg-renderer");
const { pickVisual } = require("../src/visuals");
const chart = require("../../shared/visuals/place-value-chart-svg");
const { profileFor } = require("../../shared/visuals/surface-profiles");

const SUM = { type: "place-value-chart", columns: ["Thousands", "Hundreds", "Tens", "Ones"], calculation: { operator: "+", numbers: ["3204", "564"], answer: "3768", carry: false } };
const NOTE = { part: "tens number 1", note: ["The zero", "holds the", "tens place"] };
const W = 1800;

function drawn(callouts) {
  const base = chart.tightSvg(SUM, profileFor("wall", { widthMm: 180 }));
  const H = Math.round(W / base.aspect);
  const out = noteCalloutsSvg(callouts, base.anchors, W, H, "data:image/png;base64,AAAA", "Comic Sans MS");
  const side = (out.width - W) / 2;
  const place = (name) => {
    const b = base.anchors.pointAt[name];
    return { cx: (b[0] / 100) * W, cy: (b[1] / 100) * H, halfW: (b[2] / 100) * W, halfH: (b[3] / 100) * H };
  };
  const rects = [...out.svg.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)"[^>]*fill="([^"]+)"/g)]
    .map((m) => ({ x: +m[1] - side, y: +m[2], w: +m[3], h: +m[4], fill: m[5] }));
  const path = (out.svg.match(/<path d="M ([\d.-]+) ([\d.-]+) C ([\d.-]+) ([\d.-]+), ([\d.-]+) ([\d.-]+), ([\d.-]+) ([\d.-]+)"/) || []).slice(1).map(Number);
  return { out, H, place, ring: rects.find((r) => r.fill === "none"), box: rects.find((r) => r.fill !== "none"), path: path.map((v, i) => (i % 2 === 0 ? v - side : v)) };
}

test("the named digit is ringed and the note stands outside the grid on its nearer side", () => {
  const { ring, box, place } = drawn([NOTE]);
  const zero = place("tens number 1");
  assert.ok(ring.x < zero.cx - zero.halfW && ring.x + ring.w > zero.cx + zero.halfW, "the ring is round the zero, across");
  assert.ok(ring.y < zero.cy - zero.halfH && ring.y + ring.h > zero.cy + zero.halfH, "and down");
  assert.ok(box.x > W, "the note is clear of the grid's right edge");
});

test("the arrow to a digit in the middle of a row keeps off the digit beside it", () => {
  const { path, place } = drawn([NOTE]);
  const four = place("ones number 1");
  const [x0, y0, x1, y1, x2, y2, x3, y3] = path;
  for (let t = 0; t <= 1; t += 0.01) {
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    assert.ok(Math.abs(x - four.cx) > four.halfW || Math.abs(y - four.cy) > four.halfH, "the arrow runs through the 4 in the ones");
  }
});

test("a digit at the edge of the grid is pointed at straight, with no detour", () => {
  const { path, place } = drawn([{ part: "ones number 1", note: ["four ones"] }]);
  // The curve dips in from just above, so its last point sits within the
  // digit's own row, never a row away as it does when it has to go round.
  const four = place("ones number 1");
  assert.ok(Math.abs(path[7] - four.cy) < four.halfH * 2, "the arrow arrives within the digit's row");
  assert.ok(path[6] > four.cx + four.halfW, "from the side, short of the digit");
});

test("what it refuses: a guessed spot, a misnamed place, a sentence", () => {
  assert.throws(() => drawn([{ anchor: [60, 30], note: ["The zero"] }]), /places are named[\s\S]*tens number 1/);
  assert.throws(() => drawn([{ part: "the zero", note: ["The zero"] }]), /"the zero"[\s\S]*tens number 1/);
  assert.throws(() => drawn([{ part: "tens number 1", note: ["a", "b", "c", "d"] }]), /at most 3 short lines/);
});

test("the wall draws it on a Remember card, and will not mix it with step circles", async () => {
  const card = (callouts) => ({ type: "stickyKnowledge", page: { size: "A3", orientation: "landscape" }, title: "Remember",
    items: [{ text: "A zero holds an empty place so the other digits keep their value." }], visual: { ...SUM, callouts } });
  const noted = card([NOTE]);
  const plain = card(undefined);
  const withNote = pickVisual(noted.visual, { svgImages: await preRenderSvgs({ cards: [noted] }, __dirname) });
  const without = pickVisual(plain.visual, { svgImages: await preRenderSvgs({ cards: [plain] }, __dirname) });
  assert.ok(withNote && withNote.buf, "the noted drawing renders");
  assert.ok(withNote.aspect > without.aspect, "the note beside the grid adds width rather than covering a digit");
  await assert.rejects(preRenderSvgs({ cards: [card([NOTE, { part: "sign", step: 1 }])] }, __dirname), /one kind only/);
});
