"use strict";

// On a column sum, a step's number stands OUTSIDE the grid and points in.
//
// The run this came from: the Year 4 wall for column addition with one exchange
// (5 October 2026). Every cell of a column sum holds a digit, the drawing named
// no places, and the designer placed the five step circles by eye. All five
// landed on the lines between the digits, covering nothing and pointing at
// nothing ("I didn't like the numbers"). The teacher's preferred picture had
// each circle beside the grid with an arrow to one exact digit. These pin that
// on the drawn picture: where each circle stands, where its arrow stops, and
// that a circle can no longer be placed by eye on this drawing.

const test = require("node:test");
const assert = require("node:assert");

const { stepMarkersSvg, preRenderSvgs } = require("../src/svg-renderer");
const chart = require("../../shared/visuals/place-value-chart-svg");
const { profileFor } = require("../../shared/visuals/surface-profiles");

const SUM = { type: "place-value-chart", calculation: { operator: "+", numbers: ["247", "135"], answer: "382", carry: { Tens: "1" } } };
const W = 1800;

function drawn(callouts) {
  const base = chart.tightSvg(SUM, profileFor("wall", { widthMm: 180 }));
  const H = Math.round(W / base.aspect);
  const out = stepMarkersSvg(callouts, base.anchors, W, H, "data:image/png;base64,AAAA");
  const side = (out.width - W) / 2;
  const circles = [...out.svg.matchAll(/<circle cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.-]+)"/g)].map((m) => ({ cx: +m[1] - side, cy: +m[2], r: +m[3] }));
  const tips = [...out.svg.matchAll(/<polygon points="([\d.-]+),([\d.-]+) /g)].map((m) => ({ x: +m[1] - side, y: +m[2] }));
  const place = (name) => {
    const b = base.anchors.pointAt[name];
    return { cx: (b[0] / 100) * W, cy: (b[1] / 100) * H, halfW: (b[2] / 100) * W, halfH: (b[3] / 100) * H };
  };
  return { out, H, circles, tips, place, base };
}

test("a circle stands outside the grid, level with a place at its edge, and its arrow stops short of the digit", () => {
  const { H, circles, tips, place } = drawn([{ part: "ones answer", step: 5 }, { part: "sign", step: 1 }]);
  const [ones, sign] = circles;
  assert.ok(ones.cx - ones.r > W, "the ones circle is clear of the grid's right edge");
  assert.ok(sign.cx + sign.r < 0, "the sign's circle is clear of the grid's left edge");
  const target = place("ones answer");
  assert.ok(Math.abs(ones.cy - target.cy) < 1, "level with the digit it points at");
  assert.ok(tips[0].x > target.cx + target.halfW, "the arrow stops before the digit's ink");
  assert.ok(tips[0].x < target.cx + target.halfW + ones.r, "and close enough to belong to it");
  assert.ok(circles.every((c) => c.cy > 0 && c.cy < H), "neither needed room above or below");
});

test("an arrow to a digit in the middle of the grid keeps off what is written in the next place", () => {
  // The tens answer has the carried 1 straight beneath it.
  const { circles, tips, place, H } = drawn([{ part: "tens carry", step: 4 }, { part: "tens answer", step: 3 }]);
  const [four, three] = circles;
  assert.ok(four.cy - four.r > H && three.cy - three.r > H, "both stand below the grid");
  assert.ok(Math.hypot(four.cx - three.cx, four.cy - three.cy) >= four.r + three.r, "and do not touch");
  const carry = place("tens carry");
  // Walk the second arrow from its circle to its tip: no point of it is inside the carried 1.
  for (let t = 0; t <= 1; t += 0.02) {
    const x = three.cx + (tips[1].x - three.cx) * t;
    const y = three.cy + (tips[1].y - three.cy) * t;
    assert.ok(Math.abs(x - carry.cx) > carry.halfW || Math.abs(y - carry.cy) > carry.halfH, "the arrow crosses the carried 1");
  }
});

test("on a column sum a circle cannot be placed by eye, and the refusal names the places", () => {
  const base = chart.tightSvg(SUM, profileFor("wall", { widthMm: 180 }));
  assert.throws(() => stepMarkersSvg([{ anchor: [43.7, 40], step: 3 }], base.anchors, W, 1200, "x"), /places are named[\s\S]*tens answer/);
  assert.throws(() => stepMarkersSvg([{ part: "tens total", step: 3 }], base.anchors, W, 1200, "x"), /"tens total"[\s\S]*ones carry/);
});

test("the wall draws it: the picture grows sideways to hold the circles", async () => {
  const card = (callouts) => ({ type: "workedExample", layout: "pictureFirst", page: { size: "A3", orientation: "portrait" }, title: "How to add in columns",
    items: [{ label: "Worked example", text: "247 + 135 = 382" }, { label: "Step 1", text: "Start with the ones." }], visual: { ...SUM, callouts } });
  const { pickVisual } = require("../src/visuals");
  const pinnedCard = card([{ part: "ones number 1", step: 1 }]);
  const pinned = pickVisual(pinnedCard.visual, { svgImages: await preRenderSvgs({ cards: [pinnedCard] }, __dirname) });
  const plainCard = card(undefined);
  const plain = pickVisual(plainCard.visual, { svgImages: await preRenderSvgs({ cards: [plainCard] }, __dirname) });
  assert.ok(pinned && pinned.buf, "the pinned drawing renders");
  assert.ok(pinned.aspect > plain.aspect, "the circle beside the grid adds width rather than covering a digit");
});
