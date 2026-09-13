"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

// Required DIRECTLY rather than through the registry: these four are not wired
// into src/helpers/index.js yet, and the point of these tests is the behaviour
// of the helpers themselves.
const { helpers, css } = require("../src/helpers/geometry");
const { legibleWidthMm } = require("../src/helpers/shared");

const A_HALF_COLUMN_MM = 87; // roughly a half-width column on A4 portrait
const FULL_WIDTH_MM = 174; // the printable width, portrait, less the gutter
const WIDEST_PAGE_MM = 267; // A4 landscape, margins off: nothing can need more

// The content a real Y3-to-Y6 sheet would carry, so the contract is checked
// against maths rather than an empty object.
const EXAMPLES = {
  shape: {
    type: "rectangle",
    aspect: 2.5,
    labels: { top: "8 cm", right: "3 cm" },
  },
  "triangle-square": { triangles: ["55", "75"], square: "" },
  "turn-diagram": {
    turns: [
      { quarters: 1, direction: "clockwise" },
      { quarters: 2, direction: "clockwise" },
      { quarters: 1, direction: "anticlockwise" },
      { quarters: 3, direction: "clockwise" },
    ],
    letters: true,
  },
  ruler: {
    end: 10,
    majorInterval: 1,
    minorInterval: 0.5,
    unit: "cm",
    object: { from: 0, to: 6 },
  },
};

function svgOf(name, spec) {
  return helpers[name].render(spec);
}

// ─── the ruler is a measuring instrument ─────────────────────────────────
//
// These are the tests that matter most in this file. A ruler scaled to fit its
// zone still LOOKS like a ruler; the only thing wrong with it is that every
// answer a child reads off it is wrong, and nothing on the printed page shows
// that.

test("a 10cm ruler asks for at least 100mm of paper, whatever zone it is offered", () => {
  const spec = { end: 10, unit: "cm" };
  const { minWidthMm } = helpers.ruler.needs(spec);

  assert.ok(
    minWidthMm >= 100,
    `a 10cm scale needs 100mm of paper before its margins, but the ruler asks for ${minWidthMm}mm`
  );

  // `needs` takes only the spec, so there is nowhere for a zone width to get
  // in and shrink the answer; and the height is the same at any width, because
  // the drawing is the same size at any width.
  for (const offered of [40, A_HALF_COLUMN_MM, FULL_WIDTH_MM, 500]) {
    assert.equal(
      helpers.ruler.measure(spec, offered),
      helpers.ruler.measure(spec, FULL_WIDTH_MM),
      `the ruler changed height when offered ${offered}mm`
    );
  }
});

test("a ruler's stated width scales exactly with its length", () => {
  const width = (endCm) => helpers.ruler.needs({ end: endCm, unit: "cm" }).minWidthMm;

  // Ten more centimetres is a hundred more millimetres of paper. Exactly. Any
  // other relationship means something in the chain is scaling.
  assert.equal(width(20) - width(10), 100);
  assert.equal(width(30) - width(20), 100);
  assert.equal(width(15) - width(10), 50);
});

test("a 100mm ruler and a 10cm ruler are the same ruler", () => {
  const cm = helpers.ruler.needs({ end: 10, unit: "cm" });
  const mm = helpers.ruler.needs({ end: 100, unit: "mm", majorInterval: 10, minorInterval: 5 });
  assert.equal(mm.minWidthMm, cm.minWidthMm);
});

test("the drawing itself carries its true size in millimetres", () => {
  const html = svgOf("ruler", EXAMPLES.ruler);
  const widthAttr = /width="([\d.]+)mm"/.exec(html);
  const heightAttr = /height="([\d.]+)mm"/.exec(html);
  const viewBox = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html);

  assert.ok(widthAttr && heightAttr, "the ruler's SVG does not state a size in millimetres");
  assert.ok(viewBox, "the ruler's SVG has no viewBox");

  // One unit inside the drawing is one point on the paper (the shared ruler
  // lays out in points). If the ratio ever drifts from 72 points to 25.4mm, the
  // ticks are drawn in units that are not the paper's and the scale is
  // decorative.
  const PT_PER_MM = 72 / 25.4;
  assert.ok(Math.abs(Number(viewBox[1]) / Number(widthAttr[1]) - PT_PER_MM) < 0.01);
  assert.ok(Math.abs(Number(viewBox[2]) / Number(heightAttr[1]) - PT_PER_MM) < 0.01);

  // And a centimetre on it is ten millimetres: the 0 and 10 ticks sit 100mm apart.
  const ticks = [...html.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="\1"/g)].map((m) => Number(m[1]));
  const span = (Math.max(...ticks) - Math.min(...ticks)) / PT_PER_MM;
  assert.ok(Math.abs(span - 100) < 0.05, `a 10cm ruler's end ticks are ${span.toFixed(2)}mm apart`);
});

test("nothing in the ruler's own styling can stretch it to its zone", () => {
  // The `.h-figure svg { width: 100% }` rule is what scales every other
  // drawing here. The ruler must not be inside it, and must not grow a width
  // rule of its own.
  assert.ok(!svgOf("ruler", EXAMPLES.ruler).includes("h-figure"));
  assert.ok(css.includes(".h-ruler"), "the ruler has no styling of its own");
  assert.equal(
    /\.h-ruler[^{]*\{[^}]*width\s*:/.test(css),
    false,
    "the ruler's CSS sets a width, which would override its true size"
  );
});

test("the legibility floor cannot push a ruler wider than its true size", () => {
  // The engine raises every drawing's minimum to the width at which its
  // smallest label clears 9pt. For a ruler that would be a demand for MORE
  // paper than the ruler occupies, and it would be refused from zones it fits
  // perfectly well. The labels have to be big enough at true size instead.
  for (const endCm of [5, 10, 20]) {
    const spec = { end: endCm, unit: "cm" };
    const stated = helpers.ruler.needs(spec).minWidthMm;
    assert.ok(
      legibleWidthMm(helpers.ruler.render(spec)) <= stated,
      `a ${endCm}cm ruler's labels only clear the legibility floor above its own true width`
    );
  }
});

test("a unit with no true size on paper is refused rather than drawn", () => {
  assert.throws(
    () => helpers.ruler.needs({ end: 12, unit: "inches" }),
    (err) => {
      assert.match(err.message, /RULER_UNIT/);
      assert.match(err.message, /cm/); // the message names what it does know
      return true;
    }
  );
});

test("the ruler's measured height is the drawing's own height, not an estimate", () => {
  // Its CSS adds no padding, border or margin, so these two are the same
  // number or the zone clips the labels off the bottom.
  for (const spec of [
    { end: 10 },
    { end: 10, arrow: { at: 7.5 } },
    { end: 10, arrow: { at: 7.5, answerBox: true } },
    { end: 10, object: { from: 0, to: 6, label: "pencil" } },
  ]) {
    const drawn = Number(/height="([\d.]+)mm"/.exec(helpers.ruler.render(spec))[1]);
    assert.ok(
      Math.abs(drawn - helpers.ruler.measure(spec, FULL_WIDTH_MM)) < 0.01,
      `the ruler measures ${helpers.ruler.measure(spec, FULL_WIDTH_MM)}mm but draws ${drawn}mm`
    );
  }
});

test("what is stacked above the scale is counted in its height", () => {
  const bare = helpers.ruler.measure({ end: 10 }, FULL_WIDTH_MM);
  const withArrow = helpers.ruler.measure({ end: 10, arrow: { at: 7.5 } }, FULL_WIDTH_MM);
  const withBox = helpers.ruler.measure(
    { end: 10, arrow: { at: 7.5, answerBox: true } },
    FULL_WIDTH_MM
  );
  assert.ok(withArrow > bare);
  assert.ok(withBox > withArrow);
});

test("a ruler never absorbs spare page height", () => {
  assert.equal(helpers.ruler.greed, 0);
});

// ─── shape ───────────────────────────────────────────────────────────────

test("a shape with its measurements on it needs a wider zone than the same shape bare", () => {
  // The labels are drawn OUTSIDE the shape, so they take width the shape
  // itself no longer has. A floor that ignored them would approve a rectangle
  // into a zone where the rectangle came out a third of the size the zone
  // suggested.
  const bare = helpers.shape.needs({ type: "rectangle", aspect: 2.5 }).minWidthMm;
  const two = helpers.shape.needs({
    type: "rectangle",
    aspect: 2.5,
    labels: { top: "8 cm", right: "3 cm" },
  }).minWidthMm;
  const four = helpers.shape.needs({
    type: "rectangle",
    aspect: 2.5,
    labels: { top: "8 cm", right: "3 cm", bottom: "8 cm", left: "3 cm" },
  }).minWidthMm;

  assert.ok(two > bare, `${two}mm labelled is not more than ${bare}mm bare`);
  assert.ok(four > two, `${four}mm on four sides is not more than ${two}mm on two`);
});

test("a ten-sided polygon needs a wider zone than a triangle", () => {
  const three = helpers.shape.needs({ type: "regular-polygon", sides: 3 }).minWidthMm;
  const ten = helpers.shape.needs({ type: "regular-polygon", sides: 10 }).minWidthMm;
  assert.ok(
    ten > three,
    `a decagon (${ten}mm) needs more perimeter per side than a triangle (${three}mm)`
  );
});

test("only the sides that were labelled are written on", () => {
  const one = svgOf("shape", { type: "rectangle", labels: { top: "8 cm" } });
  const three = svgOf("shape", {
    type: "rectangle",
    labels: { top: "8 cm", left: "3 cm", bottom: "8 cm" },
  });
  assert.equal((one.match(/<text/g) || []).length, 1);
  assert.equal((three.match(/<text/g) || []).length, 3);
});

test("a right-angled triangle is drawn with its right angle marked", () => {
  const html = svgOf("shape", {
    type: "right-triangle",
    labels: { base: "6 cm", height: "4 cm", hypotenuse: "?" },
  });
  assert.ok(html.includes("<polyline"), "no right-angle mark was drawn");
  assert.ok(html.includes("8 cm") === false);
  assert.ok(html.includes("6 cm") && html.includes("4 cm"));
});

test("a shape's height follows the width it is given", () => {
  const spec = EXAMPLES.shape;
  const narrow = helpers.shape.measure(spec, A_HALF_COLUMN_MM);
  const wide = helpers.shape.measure(spec, FULL_WIDTH_MM);
  assert.ok(
    Math.abs(wide / narrow - FULL_WIDTH_MM / A_HALF_COLUMN_MM) < 0.01,
    `doubling the width should double the height: ${narrow}mm then ${wide}mm`
  );
});

test("a label reaching the page is escaped", () => {
  const html = svgOf("shape", { type: "rectangle", labels: { top: "5 < 8 & 9" } });
  assert.ok(!html.includes("5 < 8"), "a raw angle bracket survived into the drawing");
  assert.ok(html.includes("&lt;") && html.includes("&amp;"));
});

test("a shape nobody can draw is refused by name", () => {
  assert.throws(
    () => svgOf("shape", { type: "dodecahedron" }),
    (err) => {
      assert.match(err.message, /UNKNOWN_SHAPE/);
      assert.match(err.message, /regular-polygon/);
      return true;
    }
  );
});

// ─── triangle-square ─────────────────────────────────────────────────────

test("exactly one of the three shapes is the unknown", () => {
  // Two blanks is a puzzle with no answer; none is not a question at all.
  // Both print perfectly happily, which is why this cannot wait for the page.
  assert.doesNotThrow(() => svgOf("triangle-square", { triangles: ["55", "75"], square: "" }));
  assert.doesNotThrow(() => svgOf("triangle-square", { triangles: ["25", ""], square: "120" }));

  assert.throws(
    () => svgOf("triangle-square", { triangles: ["55", ""], square: "" }),
    /TRIANGLE_SQUARE_BLANKS/
  );
  assert.throws(
    () => svgOf("triangle-square", { triangles: ["55", "75"], square: "130" }),
    /TRIANGLE_SQUARE_BLANKS/
  );
});

test("the unknown prints as an empty shape, full size, with room to write in", () => {
  const blankSquare = svgOf("triangle-square", { triangles: ["55", "75"], square: "" });
  const blankTriangle = svgOf("triangle-square", { triangles: ["25", ""], square: "120" });

  // Two numbers drawn, not three, and the square is still there to write in.
  assert.equal((blankSquare.match(/<text/g) || []).length, 2);
  assert.ok(blankSquare.includes("<rect"), "the square vanished with its number");
  assert.equal((blankTriangle.match(/<text/g) || []).length, 2);
  assert.equal((blankTriangle.match(/<polygon/g) || []).length, 3); // 2 triangles + the arrowhead
});

test("bigger numbers need a bigger box to write the answer in", () => {
  // The shapes widen to hold four digits, so the whole picture has to be given
  // more paper to leave the same handwriting room inside the blank one.
  const twoDigit = helpers["triangle-square"].needs({
    triangles: ["55", "75"],
    square: "",
  }).minWidthMm;
  const fourDigit = helpers["triangle-square"].needs({
    triangles: ["5236", "3967"],
    square: "",
  }).minWidthMm;
  assert.ok(
    fourDigit > twoDigit,
    `4-digit numbers ask for ${fourDigit}mm, 2-digit for ${twoDigit}mm`
  );
});

// ─── turn-diagram ────────────────────────────────────────────────────────

function endRayOf(html) {
  // Two rays are drawn: the start ray straight up, then the end ray.
  const lines = [...html.matchAll(/<line [^>]*x2="([\d.-]+)" y2="([\d.-]+)"/g)];
  return { x: Number(lines[1][1]), y: Number(lines[1][2]) };
}
function arcSweepFlagOf(html) {
  return Number(/ A [\d.]+ [\d.]+ 0 (\d) (\d) /.exec(html)[2]);
}

test("a quarter turn clockwise ends pointing right, anticlockwise pointing left", () => {
  // The picture IS the question: a child names the turn from where the second
  // ray ended up. If the sweep were drawn the wrong way the diagram would
  // still look like a turn diagram, and every answer to it would be wrong.
  const clockwise = endRayOf(svgOf("turn-diagram", { quarters: 1, direction: "clockwise" }));
  const anti = endRayOf(svgOf("turn-diagram", { quarters: 1, direction: "anticlockwise" }));
  const centre = 140; // half of the 280-unit canvas

  assert.ok(clockwise.x > centre, "a clockwise quarter turn should end pointing right");
  assert.ok(anti.x < centre, "an anticlockwise quarter turn should end pointing left");
  assert.ok(Math.abs(clockwise.y - centre) < 1 && Math.abs(anti.y - centre) < 1);
});

test("a half turn ends pointing down, whichever way it went round", () => {
  const half = endRayOf(svgOf("turn-diagram", { quarters: 2 }));
  assert.ok(half.y > 140, "a half turn from straight up should end pointing down");

  // Which leaves the ARC as the only thing telling a child which way it went.
  assert.equal(arcSweepFlagOf(svgOf("turn-diagram", { quarters: 2, direction: "clockwise" })), 1);
  assert.equal(
    arcSweepFlagOf(svgOf("turn-diagram", { quarters: 2, direction: "anticlockwise" })),
    0
  );
});

test("the word form of a turn means the same as the number", () => {
  assert.equal(
    svgOf("turn-diagram", { amount: "three-quarter" }),
    svgOf("turn-diagram", { quarters: 3 })
  );
  assert.equal(svgOf("turn-diagram", { amount: "half" }), svgOf("turn-diagram", { quarters: 2 }));
});

test("a full turn still shows an arrow rather than closing on itself", () => {
  // A 360-degree arc starts and ends at the same point, which draws nothing at
  // all. The Word builder stops it just short so the arrowhead is visible, and
  // that is what tells a child it is a full turn rather than no turn.
  const arc = / A [\d.]+ [\d.]+ 0 \d \d ([\d.]+) ([\d.]+)/.exec(svgOf("turn-diagram", { quarters: 4 }));
  const start = /<path d="M ([\d.]+) ([\d.]+)/.exec(svgOf("turn-diagram", { quarters: 4 }));
  const moved = Math.hypot(Number(arc[1]) - Number(start[1]), Number(arc[2]) - Number(start[2]));
  assert.ok(moved > 3, `a full turn's arc ends ${moved.toFixed(1)} units from where it began`);
});

test("a row of turns needs the width of the whole row, not of one diagram", () => {
  const one = helpers["turn-diagram"].needs({ quarters: 1 }).minWidthMm;
  const two = helpers["turn-diagram"].needs({ turns: [{ quarters: 1 }, { quarters: 2 }] }).minWidthMm;
  const four = helpers["turn-diagram"].needs(EXAMPLES["turn-diagram"]).minWidthMm;

  assert.ok(two > one);
  assert.ok(four > two, `four diagrams (${four}mm) must ask for more than two (${two}mm)`);
});

test("lettering a row labels each diagram in order", () => {
  const html = svgOf("turn-diagram", EXAMPLES["turn-diagram"]);
  for (const letter of ["(a)", "(b)", "(c)", "(d)"]) {
    assert.ok(html.includes(letter), `the row is missing ${letter}`);
  }
  assert.ok(!svgOf("turn-diagram", { turns: [{ quarters: 1 }] }).includes("(a)"));
});

// ─── the contract, over all four ─────────────────────────────────────────

test("every helper here signs the whole contract", () => {
  for (const [name, h] of Object.entries(helpers)) {
    assert.equal(typeof h.render, "function", `"${name}" has no render`);
    assert.equal(typeof h.measure, "function", `"${name}" has no measure`);
    assert.equal(typeof h.needs, "function", `"${name}" has no needs`);
    assert.ok(
      Number.isFinite(h.greed) && h.greed >= 0 && h.greed <= 5,
      `"${name}" has greed ${h.greed}`
    );
    assert.ok(EXAMPLES[name], `"${name}" has no realistic example to check against`);
  }
});

test("no helper can end up needing more paper than exists", () => {
  // The engine raises a stated minimum to the width at which the drawing's
  // smallest label clears 9pt. A helper whose floor lands past 267mm is
  // refused from every zone on every page, silently.
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    const stated = helpers[name].needs(spec).minWidthMm;
    const floored = Math.max(stated, legibleWidthMm(helpers[name].render(spec)));
    assert.ok(
      floored <= WIDEST_PAGE_MM,
      `"${name}" ends up needing ${Math.round(floored)}mm, wider than any A4 page`
    );
  }
});

test("every helper measures to a real height at a column and at full width", () => {
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    for (const widthMm of [A_HALF_COLUMN_MM, FULL_WIDTH_MM]) {
      const h = helpers[name].measure(spec, widthMm);
      assert.ok(Number.isFinite(h) && h > 0 && h <= 297, `"${name}" measures ${h}mm`);
    }
  }
});

test("a helper's stated minimum height is one it can actually reach", () => {
  // The fit check compares a zone's NATURAL height against this. If the
  // minimum were the taller of the two, a helper would refuse zones it fits.
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    const { minWidthMm, minHeightMm } = helpers[name].needs(spec);
    const natural = helpers[name].measure(spec, minWidthMm);
    assert.ok(
      natural >= minHeightMm - 0.01,
      `"${name}" wants ${minHeightMm}mm but is only ${natural}mm tall at its own minimum width`
    );
  }
});

test("any line height declared here is the one the estimates assume", () => {
  for (const rule of css.match(/line-height:\s*([\d.]+)/g) || []) {
    assert.equal(Number(rule.split(":")[1]), 1.35);
  }
});

test("the example specs are written in this engine's camelCase", () => {
  const walk = (obj, path) => {
    for (const [field, value] of Object.entries(obj)) {
      assert.ok(!field.includes("_"), `${path}${field} is snake_case; this engine writes camelCase`);
      if (value && typeof value === "object" && !Array.isArray(value)) walk(value, `${path}${field}.`);
      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          if (v && typeof v === "object") walk(v, `${path}${field}[${i}].`);
        });
      }
    }
  };
  for (const [name, spec] of Object.entries(EXAMPLES)) walk(spec, `${name}.`);
});
