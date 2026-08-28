"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

// Required DIRECTLY rather than through the registry: these helpers are not
// wired into it yet, and the tests that matter here are about what each one
// draws, not about registration.
const { helpers, css } = require("../src/helpers/methods");

const COLUMN_MM = 87; // a half-width column on A4 portrait
const FULL_MM = 180; // the full printable width, portrait

function render(name, spec) {
  return helpers[name].render(spec);
}
function measure(name, spec, widthMm) {
  return helpers[name].measure(spec, widthMm);
}
function needs(name, spec) {
  return helpers[name].needs(spec);
}
function countCells(html) {
  return (html.match(/h-mgrid-cell/g) || []).length;
}
function countRows(html) {
  return (html.match(/class="h-mgrid-row/g) || []).length;
}

// ─── short-multiplication-grid ───────────────────────────────────────────

test("a short multiplication grid has a cell for every digit of every row", () => {
  // The grid IS the method: an operator column plus one column per digit,
  // across the number, the multiplier, the answer and the carry row. A column
  // short and the child's place value has nowhere to line up.
  const html = render("short-multiplication-grid", { top: "345", multiplier: "6" });
  assert.equal(countRows(html), 4, "number, multiplier, answer, carry");
  assert.equal(countCells(html), 16, "four rows of four columns");
});

test("a short multiplication grid puts the multiplier under the ones digit", () => {
  // Under the ones is where the child starts, and where the method lines up.
  // Placed under the hundreds it teaches the wrong first step.
  const html = render("short-multiplication-grid", { top: "345", multiplier: "6" });
  const cells = html.match(/<div class="h-mgrid-cell[^"]*">([^<]*)<\/div>/g);
  const texts = cells.map((c) => c.replace(/<[^>]+>/g, ""));
  // Row 2 runs from index 4 to 7: the operator, then three digit columns.
  assert.deepEqual(texts.slice(4, 8), ["×", "", "", "6"]);
});

test("a wider number needs a wider zone", () => {
  // A constant per helper cannot know that a four-digit multiplication has a
  // column more to fit, which is how a grid comes to be sliced down its right
  // edge with the fit check reporting no problem.
  const three = { top: "345", multiplier: "6" };
  const five = { top: "34521", multiplier: "6" };
  assert.ok(
    needs("short-multiplication-grid", five).minWidthMm >
      needs("short-multiplication-grid", three).minWidthMm
  );
});

test("a short multiplication grid's digit cells never grow past writing size", () => {
  // Given a whole page's width the square cells would scale with it, and a
  // digit box the size of a matchbox is worse for the child, not better.
  const spec = { top: "345", multiplier: "6" };
  assert.equal(measure("short-multiplication-grid", spec, FULL_MM), 15 * 3.5);
});

// ─── long-multiplication-grid ────────────────────────────────────────────

test("long multiplication is taller than short multiplication for the same number", () => {
  // The partial products are the difference between the two methods. If the
  // grid does not allow for them the child has no rows to write them in.
  const short = measure("short-multiplication-grid", { top: "345", multiplier: "6" }, COLUMN_MM);
  const long = measure("long-multiplication-grid", { top: "345", bottom: "26" }, COLUMN_MM);
  assert.ok(long > short, `long ${long}mm should exceed short ${short}mm`);
});

test("a long multiplication grid draws one partial product row per multiplier digit", () => {
  // A three-digit multiplier makes three partial products. A grid that always
  // draws two leaves the last one nowhere to go.
  const two = render("long-multiplication-grid", { top: "345", bottom: "26" });
  const three = render("long-multiplication-grid", { top: "345", bottom: "126" });
  assert.equal(countRows(two), 6, "numbers, two partials, total, carry");
  assert.equal(countRows(three), 7, "numbers, three partials, total, carry");
  assert.ok(
    needs("long-multiplication-grid", { top: "345", bottom: "126" }).minHeightMm >
      needs("long-multiplication-grid", { top: "345", bottom: "26" }).minHeightMm,
    "the extra partial product has to be allowed for in the height too"
  );
});

test("a long multiplication grid rules under the numbers and under the partials", () => {
  // Two thick rules: one closing the question, one closing the working. They
  // are what tell the child where the answer goes.
  const html = render("long-multiplication-grid", { top: "345", bottom: "26" });
  assert.equal((html.match(/h-mgrid-answer/g) || []).length, 2);
});

test("both numbers set the width of a long multiplication grid", () => {
  // Sized from the top number alone, a four-digit multiplier would overflow.
  const wideBottom = needs("long-multiplication-grid", { top: "34", bottom: "2617" });
  const wideTop = needs("long-multiplication-grid", { top: "3452", bottom: "26" });
  assert.equal(wideBottom.minWidthMm, wideTop.minWidthMm);
});

// ─── bus-stop-grid ───────────────────────────────────────────────────────

test("a bus stop shows the divisor and every digit of the dividend", () => {
  // These are the numbers of the question. A grid that drops one of them is a
  // division the child cannot read.
  const html = render("bus-stop-grid", { divisor: "6", dividend: "438" });
  assert.ok(html.includes(">6<"), "the divisor is missing");
  for (const digit of ["4", "3", "8"]) {
    assert.ok(html.includes(`>${digit}<`), `the dividend digit ${digit} is missing`);
  }
});

test("a bus stop has a roof over the dividend only, and a wall beside the divisor", () => {
  // The roof and the wall ARE the bus stop. A roof over the divisor as well
  // draws a different, wrong picture, and one digit of the dividend left
  // outside the roof is a digit the child will not divide.
  const html = render("bus-stop-grid", { divisor: "6", dividend: "438" });
  assert.equal((html.match(/h-mgrid-roof/g) || []).length, 3, "one roof span per dividend digit");
  assert.equal((html.match(/h-mgrid-wall/g) || []).length, 1, "exactly one wall");
});

test("a longer dividend needs a wider bus stop", () => {
  const short = needs("bus-stop-grid", { divisor: "6", dividend: "48" });
  const long = needs("bus-stop-grid", { divisor: "6", dividend: "4386" });
  assert.ok(long.minWidthMm > short.minWidthMm);
});

// ─── long-division-grid ──────────────────────────────────────────────────

test("long division adds a working box under the bus stop", () => {
  // The working box is the whole reason this helper exists apart from the bus
  // stop: without room to show the subtract-and-bring-down steps, long
  // division cannot be done on the sheet.
  const spec = { divisor: "23", dividend: "756" };
  const html = render("long-division-grid", spec);
  assert.ok(html.includes("h-longdiv-working"), "no working box was drawn");
  assert.ok(
    measure("long-division-grid", spec, COLUMN_MM) >
      measure("bus-stop-grid", spec, COLUMN_MM) + 25,
    "the height has to allow for the working box, not just the bus stop"
  );
});

test("long division states its working box in its minimum height", () => {
  // Stated without it, the helper is accepted into a zone that fits the bus
  // stop and the box is silently clipped: the page still looks finished.
  const spec = { divisor: "23", dividend: "756" };
  assert.ok(needs("long-division-grid", spec).minHeightMm >= 28 + 14 * 2);
});

test("long division keeps the bus stop's shape, roof and wall included", () => {
  const html = render("long-division-grid", { divisor: "23", dividend: "756" });
  assert.equal((html.match(/h-mgrid-roof/g) || []).length, 3);
  assert.equal((html.match(/h-mgrid-wall/g) || []).length, 1);
  assert.equal(countRows(html), 2, "no carry row: the working box does that job");
});

// ─── method-frame ────────────────────────────────────────────────────────

const ADJUSTING = {
  title: "Adjusting strategy",
  lines: [
    { label: "First, add:", content: "___ + ___ = ___" },
    { label: "Then, adjust:", content: "___ - ___ = ___" },
  ],
};

test("every blank in a method frame becomes a box to write in", () => {
  // The blanks ARE the question. A blank left as underscores on the page is a
  // line the child reads as text rather than a space to answer in.
  const html = render("method-frame", ADJUSTING);
  assert.equal((html.match(/h-mframe-box/g) || []).length, 6);
  assert.ok(!html.includes("___"), "underscores survived onto the page");
});

test("a □ is a blank too, so either way of writing one works", () => {
  const html = render("method-frame", { lines: [{ content: "64 = □ + □" }] });
  assert.equal((html.match(/h-mframe-box/g) || []).length, 2);
  assert.ok(!html.includes("□"), "a raw box character survived onto the page");
});

test("a fully worked frame has no boxes at all", () => {
  // The same frame is given worked, part-given or all blank; that is how a set
  // fades. If a worked example still printed empty boxes it would stop being
  // an example.
  const html = render("method-frame", {
    title: "Worked example: 54 + 19",
    lines: [
      { label: "First, add:", content: "54 + 20 = 74" },
      { label: "Then, adjust:", content: "74 - 1 = 73" },
    ],
  });
  assert.equal((html.match(/h-mframe-box/g) || []).length, 0);
  assert.ok(html.includes("54 + 20 = 74"));
});

test("a method frame prints the caller's own labels and title", () => {
  // The labels are the strategy's own words, which is what ties the sheet to
  // what was said on the board. Swallowed, the frame is anonymous boxes.
  const html = render("method-frame", ADJUSTING);
  assert.ok(html.includes("Adjusting strategy"));
  assert.ok(html.includes("First, add:"));
  assert.ok(html.includes("Then, adjust:"));
});

test("a method frame grows taller with every line it carries", () => {
  // Measured from a fixed idea of a frame, a six-step method runs off the
  // bottom of the zone with nothing reporting a problem.
  const two = measure("method-frame", ADJUSTING, FULL_MM);
  const six = measure(
    "method-frame",
    {
      title: "Adjusting strategy",
      lines: Array.from({ length: 6 }, () => ({ label: "Then:", content: "___ + ___ = ___" })),
    },
    FULL_MM
  );
  assert.ok(six > two * 2, `six lines measured ${six}mm against two lines at ${two}mm`);
  assert.ok(
    needs("method-frame", {
      lines: Array.from({ length: 6 }, () => ({ label: "Then:", content: "___ + ___" })),
    }).minHeightMm >
      needs("method-frame", { lines: [{ label: "Then:", content: "___ + ___" }] }).minHeightMm
  );
});

test("a method frame allows for the lines it wraps onto in a narrow column", () => {
  // A long step in a half-width column wraps. Measured as one row it fits on
  // paper only by having its last row cut off.
  const longLine = {
    lines: [{ label: "Move:", content: "Take ___ from ___ to make ___ and then ___" }],
  };
  assert.ok(measure("method-frame", longLine, COLUMN_MM) > measure("method-frame", longLine, FULL_MM));
});

test("a longer method line needs a wider frame", () => {
  // A step broken across two rows stops reading as one step, so the width has
  // to follow what is actually in the line.
  const shortLine = { lines: [{ label: "Add:", content: "___ + ___" }] };
  const longLine = {
    lines: [{ label: "Add:", content: "Take ___ from ___ to make ___ and then ___" }],
  };
  assert.ok(
    needs("method-frame", longLine).minWidthMm > needs("method-frame", shortLine).minWidthMm
  );
});

test("a longer label widens the frame's label column", () => {
  const shortLabel = { lines: [{ label: "Add:", content: "___ + ___" }] };
  const longLabel = {
    lines: [{ label: "Then adjust by taking away:", content: "___ + ___" }],
  };
  assert.ok(
    needs("method-frame", longLabel).minWidthMm > needs("method-frame", shortLabel).minWidthMm
  );
});

test("a method frame's stem carries its question number and its bold numbers", () => {
  const html = render("method-frame", {
    id: "1",
    text: "Use the adjusting strategy to work out **63 + 29**.",
    ...ADJUSTING,
  });
  // Bracketed, because a question number is bracketed everywhere on the sheet
  // now. This used to be "1." with a full stop, which was a third format beside
  // the blue unbracketed one and the hand-typed one.
  assert.ok(html.includes("(1)"), "the question number is missing");
  assert.ok(html.includes("<strong>63 + 29</strong>"), "the bold numbers did not come through");
});

test("frame: false drops the panel but keeps the method", () => {
  const bare = render("method-frame", { ...ADJUSTING, frame: false });
  assert.ok(!bare.includes("h-mframe-framed"));
  assert.equal((bare.match(/h-mframe-box/g) || []).length, 6);
});

// ─── the rules the whole engine depends on ───────────────────────────────

test("text from a spec is escaped, so a stray angle bracket cannot break the page", () => {
  const html = render("method-frame", {
    text: "Is 5 < 8 & 3 > 1?",
    lines: [{ label: "A & B <c>", content: "5 < 8" }],
  });
  assert.ok(!html.includes("<c>"), "raw markup survived into the page");
  assert.ok(html.includes("&lt;"));
  assert.ok(html.includes("&amp;"));
});

test("no helper here hard-codes a colour", () => {
  // A raw hex is a second colour system starting, which is how a child meets
  // two meanings for one colour in a single lesson.
  for (const spec of Object.values(EXAMPLES)) {
    const html = helpers[spec.helper].render(spec);
    const hex = html.match(/#[0-9a-fA-F]{3,6}\b/);
    assert.equal(hex, null, `"${spec.helper}" hard-codes ${hex && hex[0]}`);
  }
  assert.equal(css.match(/#[0-9a-fA-F]{3,6}\b/), null, "the CSS hard-codes a colour");
});

test("every line height is pinned to the one the estimates assume", () => {
  // Left unset, Comic Sans uses its own 1.5, every line runs taller than
  // predicted, and the bottom of the zone is quietly clipped.
  const declared = css.match(/line-height:\s*([\d.]+)/g) || [];
  assert.ok(declared.length > 0, "no line-height is pinned anywhere");
  for (const rule of declared) {
    assert.equal(Number(rule.split(":")[1]), 1.35, `"${rule.trim()}" is out of step`);
  }
});

test("spec fields are camelCase, so a field an author writes is a field that is read", () => {
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    for (const field of Object.keys(spec)) {
      assert.ok(!field.includes("_"), `"${name}" uses the field "${field}"`);
    }
    for (const line of spec.lines || []) {
      for (const field of Object.keys(line)) {
        assert.ok(!field.includes("_"), `"${name}" uses the line field "${field}"`);
      }
    }
  }
});

test("each helper states a minimum that fits on a page and holds its own content", () => {
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    const need = needs(name, spec);
    assert.ok(need.minWidthMm > 0 && need.minWidthMm <= 267, `"${name}" needs ${need.minWidthMm}mm wide`);
    assert.ok(need.minHeightMm > 0, `"${name}" needs ${need.minHeightMm}mm tall`);
    // The pair has to describe one real box: a zone at the stated minimum
    // width must be tall enough for what the helper draws there.
    assert.ok(
      need.minHeightMm >= measure(name, spec, need.minWidthMm) - 0.001,
      `"${name}" claims ${need.minHeightMm}mm but draws ${measure(name, spec, need.minWidthMm)}mm at its own minimum width`
    );
  }
});

test("every helper measures to a real height at a column and at full width", () => {
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    for (const widthMm of [COLUMN_MM, FULL_MM]) {
      const h = measure(name, spec, widthMm);
      assert.ok(Number.isFinite(h) && h > 0 && h <= 297, `"${name}" measures ${h}mm at ${widthMm}mm`);
    }
  }
});

test("greed is an appetite between none and all", () => {
  for (const [name, h] of Object.entries(helpers)) {
    assert.ok(Number.isFinite(h.greed) && h.greed >= 0 && h.greed <= 5, `"${name}" has greed ${h.greed}`);
  }
});

// Real primary maths, so the contract is checked against content a lesson
// would actually carry. Keyed by helper name; `helper` is carried inside each
// so a spec can be rendered straight from the value.
const EXAMPLES = {
  "short-multiplication-grid": {
    helper: "short-multiplication-grid",
    id: "3",
    top: "345",
    multiplier: "6",
  },
  "long-multiplication-grid": {
    helper: "long-multiplication-grid",
    id: "5",
    top: "345",
    bottom: "26",
  },
  "bus-stop-grid": { helper: "bus-stop-grid", id: "7", divisor: "6", dividend: "438" },
  "long-division-grid": { helper: "long-division-grid", id: "9", divisor: "23", dividend: "756" },
  "method-frame": {
    helper: "method-frame",
    id: "1",
    text: "Use the adjusting strategy to work out **63 + 29**.",
    title: "Adjusting strategy",
    lines: [
      { label: "First, add:", content: "___ + ___ = ___" },
      { label: "Then, adjust:", content: "___ - ___ = ___" },
    ],
  },
};
