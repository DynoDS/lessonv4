"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderHelper, measure, REGISTRY } = require("../src/helpers");

// The three thinking diagrams. What is tested here is the thing each one
// exists FOR, which the shared contract tests cannot see: that a circuit's
// state actually changes the picture, that a key's branches do not cross, and
// that a blank box in a chain stays blank.

const COLUMN_MM = 87;
const FULL_MM = 180;

// ─── circuit-diagram ─────────────────────────────────────────────────────

test("a circuit's state changes the picture, not just the caption", () => {
  // The whole electricity unit rests on this. Four states that all drew the
  // same loop would make "will the lamp light?" unanswerable from the sheet,
  // and the sheet would look perfectly normal.
  const of = (state) => renderHelper({ helper: "circuit-diagram", circuits: [{ state }] });

  const complete = of("complete");
  const gap = of("gap");
  const noCell = of("no-cell");
  const open = of("switch-open");

  const all = [complete, gap, noCell, open];
  const unique = new Set(all);
  assert.equal(unique.size, 4, "two states drew the identical circuit");

  // And each difference is the RIGHT difference, not just any difference.
  // A gap leaves two blobbed wire ends where the wire was.
  assert.ok(
    (gap.match(/<circle[^>]*r="2.5"/g) || []).length === 2,
    "a broken circuit must show the two ends of the break"
  );
  // No cell means the battery symbol is simply not drawn: the long plate and
  // the short fat one both go.
  assert.ok(
    !noCell.includes('stroke-width="4"'),
    "a circuit with no cell must not draw one"
  );
  assert.ok(
    complete.includes('stroke-width="4"'),
    "a complete circuit must draw its cell"
  );
});

test("a row of circuits needs more width than a single one", () => {
  const one = { helper: "circuit-diagram", circuits: [{ state: "complete" }] };
  const four = {
    helper: "circuit-diagram",
    circuits: ["complete", "gap", "no-cell", "switch-open"].map((state) => ({ state })),
  };
  assert.ok(
    REGISTRY["circuit-diagram"].needs(four).minWidthMm >
      REGISTRY["circuit-diagram"].needs(one).minWidthMm
  );
});

// ─── classification-key ──────────────────────────────────────────────────

const MINIBEASTS = {
  helper: "classification-key",
  tree: {
    q: "Does it have wings?",
    no: { q: "More than 6 legs?", no: { leaf: "ANT" }, yes: { leaf: "SPIDER" } },
    yes: { q: "Spotted body?", no: { leaf: "BEE" }, yes: { leaf: "LADYBIRD" } },
  },
};

test("every question and every answer in a key reaches the page", () => {
  const html = renderHelper(MINIBEASTS);

  // Read it the way a child does, not the way the markup stores it. A question
  // too long for its box is wrapped onto a second line, so it arrives as two
  // separate pieces of text; checking the raw markup for the whole sentence
  // would fail on a key that is working perfectly.
  const readable = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  for (const text of [
    "Does it have wings?",
    "More than 6 legs?",
    "Spotted body?",
    "ANT",
    "SPIDER",
    "BEE",
    "LADYBIRD",
  ]) {
    assert.ok(readable.includes(text), `"${text}" never reached the page`);
  }
  // One Yes and one No per question node, or a child cannot tell which branch
  // they are following.
  assert.equal((html.match(/>Yes</g) || []).length, 3);
  assert.equal((html.match(/>No</g) || []).length, 3);
});

test("a parent in the key sits between its two children, so branches never cross", () => {
  // This is the one thing the caller never specifies and so the one thing that
  // can silently go wrong. A key whose lines cross is not a key: a child
  // following a branch arrives at the wrong creature.
  const html = renderHelper(MINIBEASTS);
  const boxes = [...html.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="122"/g)].map(
    (m) => ({ x: Number(m[1]), y: Number(m[2]) })
  );
  assert.equal(boxes.length, 7, "a three-question key draws seven boxes");

  const byRow = new Map();
  for (const b of boxes) {
    if (!byRow.has(b.y)) byRow.set(b.y, []);
    byRow.get(b.y).push(b.x);
  }
  const rows = [...byRow.entries()].sort((a, b) => a[0] - b[0]).map(([, xs]) => xs.sort((a, b) => a - b));
  assert.deepEqual(
    rows.map((r) => r.length),
    [1, 2, 4],
    "the key should widen one level at a time"
  );

  // The root sits at the midpoint of the two questions below it.
  assert.ok(
    Math.abs(rows[0][0] - (rows[1][0] + rows[1][1]) / 2) < 0.01,
    "the root is not centred over its two branches"
  );
});

test("a key with more answers needs more width, and a deeper one more height", () => {
  const shallow = {
    helper: "classification-key",
    tree: { q: "Wings?", no: { leaf: "ANT" }, yes: { leaf: "BEE" } },
  };
  const wide = MINIBEASTS;
  assert.ok(
    REGISTRY["classification-key"].needs(wide).minWidthMm >
      REGISTRY["classification-key"].needs(shallow).minWidthMm
  );
  assert.ok(
    REGISTRY["classification-key"].needs(wide).minHeightMm >
      REGISTRY["classification-key"].needs(shallow).minHeightMm
  );
});

// ─── process-chain ───────────────────────────────────────────────────────

test("a blank box in a chain stays blank, and a given one prints", () => {
  // The "complete the sequence" task is exactly this: some boxes filled, the
  // rest empty. A helpful engine that filled them in would delete the task.
  const html = renderHelper({
    helper: "process-chain",
    boxes: ["egg", null, null, "frog"],
  });
  assert.ok(html.includes(">egg<") && html.includes(">frog<"));
  assert.equal((html.match(/<rect /g) || []).length, 4, "four boxes");
  assert.equal((html.match(/<text /g) || []).length, 2, "only two are filled in");
});

test("a chain draws one arrow fewer than it has boxes", () => {
  // The arrows are the helper: they carry the "this leads to that" the task is
  // testing. A chain that lost them is a row of boxes.
  for (const n of [2, 3, 5]) {
    const html = renderHelper({
      helper: "process-chain",
      boxes: Array.from({ length: n }, () => null),
    });
    assert.equal(
      (html.match(/marker-end/g) || []).length,
      n - 1,
      `${n} boxes should be joined by ${n - 1} arrows`
    );
  }
});

test("a longer chain needs a wider zone", () => {
  const three = { helper: "process-chain", boxes: [null, null, null] };
  const six = { helper: "process-chain", boxes: Array.from({ length: 6 }, () => null) };
  assert.ok(
    REGISTRY["process-chain"].needs(six).minWidthMm >
      REGISTRY["process-chain"].needs(three).minWidthMm
  );
});

// ─── all three ───────────────────────────────────────────────────────────

test("none of the three hard-codes a colour outside the token system", () => {
  // The Word originals carried four hex values between them. These inherit the
  // ink colour and draw with currentColor, so there is one palette rather than
  // a second one starting. White is the exception and is paper, not a colour.
  const examples = require("./helper-examples");
  for (const name of ["circuit-diagram", "classification-key", "process-chain"]) {
    const html = renderHelper({ helper: name, ...examples[name] });
    const hexes = (html.match(/#[0-9a-fA-F]{3,6}\b/g) || []).filter(
      (h) => h.toUpperCase() !== "#FFFFFF" && h.toUpperCase() !== "#FFF"
    );
    assert.deepEqual(hexes, [], `"${name}" hard-codes ${hexes.join(", ")}`);
  }
});

test("all three measure to a sensible height at a column and at full width", () => {
  const examples = require("./helper-examples");
  for (const name of ["circuit-diagram", "classification-key", "process-chain"]) {
    for (const widthMm of [COLUMN_MM, FULL_MM]) {
      const h = measure({ helper: name, ...examples[name] }, widthMm);
      assert.ok(Number.isFinite(h) && h > 0 && h <= 297, `"${name}" measured ${h}mm`);
    }
  }
});
