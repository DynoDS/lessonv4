"use strict";

// A box a child writes one number or sign in is one size on a sheet, and a
// method frame is only as wide as its lines.
//
// On 12 October 2026 a Year 5 Below sheet printed three sizes of box for one
// job: 12mm square between two fractions, 11mm by 9mm in the method frame and
// 9mm by 13mm for a missing fraction. Each kind of question kept a size of its
// own, and the 9 October repair that gave writing lines one size left boxes
// alone. The same sheet's frame filled its column, 110mm of tint round 55mm of
// lines. The teacher chose the 12mm square for every one of them from that
// page (13 October 2026).

const assert = require("node:assert/strict");
const test = require("node:test");

const { helperCss, renderHelper } = require("../src/helpers");
const { NUMBER_BOX_MM } = require("../src/tokens");
const { sheetsOf } = require("../src/worksheet");
const { STACKED_FRACTION_CSS } = require("../../shared/text/stacked-fractions");

// Every rule written for one class, joined: a box's size may sit in a rule it
// shares with another class.
function rulesFor(css, className) {
  const found = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(rule)) {
    const selectors = m[1].split(",").map((s) => s.trim());
    if (selectors.some((s) => s === `.${className}`)) found.push(m[2]);
  }
  return found.join(";");
}

function sizeOf(css, className) {
  const body = rulesFor(css, className);
  const read = (prop) => {
    const m = new RegExp(`(?:^|[;\\s])${prop}:\\s*([\\d.]+)mm`).exec(body);
    return m ? Number(m[1]) : null;
  };
  return { width: read("width"), height: read("height") };
}

const SQUARE_BOXES = [
  ["h-cmp-box", "the box between two values to compare"],
  ["h-ineq-box", "a box in a statement with boxes"],
  ["h-mframe-box", "a box on a line of a method frame"],
  ["h-frac-two-box", "each box of a whole missing fraction"],
];

for (const [className, what] of SQUARE_BOXES) {
  test(`${what} is the one number box, square`, () => {
    assert.deepEqual(sizeOf(helperCss, className), { width: NUMBER_BOX_MM, height: NUMBER_BOX_MM });
  });
}

test("the one tall box for a missing fraction is as wide as the number box", () => {
  assert.equal(sizeOf(helperCss, "h-frac-blank").width, NUMBER_BOX_MM);
});

test("a box on the bar of a fraction inside a sentence is the number box too", () => {
  assert.deepEqual(sizeOf(STACKED_FRACTION_CSS, "sfr-box"), { width: NUMBER_BOX_MM, height: NUMBER_BOX_MM });
});

test("a method frame's panel hugs its lines and never fills its column", () => {
  const panel = rulesFor(helperCss, "h-mframe-panel");
  assert.match(panel, /width:\s*fit-content/);
  assert.match(panel, /max-width:\s*100%/);
});

const frame = (content) => ({ helper: "method-frame", lines: [{ content }] });

function framesIn(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => framesIn(n, out));
  else if (node && typeof node === "object") {
    if (node.helper === "method-frame") out.push(node);
    Object.values(node).forEach((v) => framesIn(v, out));
  }
  return out;
}

test("the frames of one question's parts share the widest one's width, and a frame alone keeps its own", () => {
  const [sheet] = sheetsOf({
    meta: { yearGroup: 5, subject: "maths" },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          main: {
            stack: [
              { question: true, questionGroupId: "g1", stack: [frame("2 + ___ = 10")] },
              { question: true, questionGroupId: "g1", stack: [frame("120 + ___ + ___ = 1,000")] },
              { question: true, stack: [frame("3 + ___ = 9")] },
            ],
          },
        },
      },
    },
  });
  const [short, long, alone] = framesIn(sheet.spec.zones);
  assert.ok(long.matchWidthMm > 0);
  assert.equal(short.matchWidthMm, long.matchWidthMm);
  assert.equal(alone.matchWidthMm, undefined);
  assert.match(renderHelper(short, 120), /--h-mframe-match:/);
  assert.doesNotMatch(renderHelper(alone, 120), /--h-mframe-match:/);
});
