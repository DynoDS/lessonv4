const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { build, buildKits, naturalAnswersFilename } = require("../build");
const { normaliseCardSet, orderForPrint, followsTheKey } = require("../src/render-card-set");

const FIXTURE = path.join(__dirname, "fixtures/card-kit.json");
const spec = () => JSON.parse(fs.readFileSync(FIXTURE, "utf8"));

// ─── The kit prints faithfully, and never the answer ─────────────────────

test("a card kit prints every card and heading once per set, with cut guides, and the key never reaches a pupil page", () => {
  const { kits, pageDivs, dropped } = buildKits(spec().items, 30);
  assert.deepStrictEqual(dropped, []);
  assert.strictEqual(kits.length, 1);
  const kit = kits[0];
  assert.strictEqual(kit.setCount, 15, "one set between two for a class of 30");
  const html = pageDivs.join("");
  for (const card of kit.cards) {
    const count = html.split(`>${card.label}<`).length - 1;
    assert.strictEqual(count, 15, `"${card.label}" should appear once per set`);
  }
  for (const heading of kit.headings) {
    assert.strictEqual(html.split(`>${heading.label}<`).length - 1, 15);
  }
  assert.ok(html.includes("dashed"), "cut guides are drawn");
  assert.ok(!html.includes("Also accept"), "the acceptance note is not on a pupil page");
  assert.ok(!html.includes("->"), "the key's arrows are not on a pupil page");
  // The stamped tag names the activity, never the heading a card belongs under.
  assert.ok(html.includes(">Deal<"), "the kit tag is stamped on the cards");
});

test("the printed order is stable between builds and is not the key's order", () => {
  const a = buildKits(spec().items, 30).kits[0].printOrder.map((c) => c.id);
  const b = buildKits(spec().items, 30).kits[0].printOrder.map((c) => c.id);
  assert.deepStrictEqual(a, b, "same spec, same order, so the teacher's file describes the kit that printed");
  const kit = buildKits(spec().items, 30).kits[0];
  assert.ok(!followsTheKey(kit.printOrder, kit.keyByCard), "cards are not grouped by heading on the page");
});

test("orderForPrint breaks an order that would give the sort away", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const key = new Map([["a", "g1"], ["b", "g1"], ["c", "g2"], ["d", "g2"]]);
  for (let seed = 1; seed < 40; seed++) {
    const order = orderForPrint(cards, key, seed);
    assert.ok(!followsTheKey(order, key), `seed ${seed} left the cards in key order`);
    assert.deepStrictEqual(order.map((c) => c.id).sort(), ["a", "b", "c", "d"]);
  }
});

// ─── The teacher's half ──────────────────────────────────────────────────

test("build writes the pack and a separate answers file naming the key, the preparation and the accepted alternative", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-kit-"));
  const before = process.exitCode;
  process.exitCode = 0;
  let result;
  try {
    result = await build(FIXTURE, out);
    assert.strictEqual(process.exitCode, 0, "a complete kit is not reported as short");
  } finally {
    process.exitCode = before;
  }
  assert.ok(result && fs.existsSync(result));
  assert.match(path.basename(result), /Why did Tudor children work - Stick-in Sheets\.(pdf|html)$/);
  const answers = path.join(out, naturalAnswersFilename("Why did Tudor children work"));
  assert.ok(fs.existsSync(answers), "the answers file sits beside the pack");
  assert.ok(answers.endsWith(" - Answers.txt"), "delivery already carries this suffix");
  const text = fs.readFileSync(answers, "utf8");
  assert.ok(text.includes("knowing when bread is baked just right -> Helped the child when he grew up"));
  assert.ok(text.includes("Prepare: At tables, one set between two"));
  assert.ok(text.includes("15 sets printed"));
  assert.ok(text.includes("Also accept: The baking card under either heading"));
  assert.ok(text.includes("lesson-section/teaching-sequence/unit-006"), "the kit names its source unit");
});

// ─── A kit that cannot be printed faithfully is refused by name ──────────

test("a kit whose key leaves a card unplaced, names an unknown heading, or repeats a card is refused", () => {
  const base = spec().items[0];
  const cases = [
    ["unplaced card", (s) => s.teacher.answer.pop(), /unplaced/],
    ["unknown heading", (s) => { s.teacher.answer[0].headingId = "group-009"; }, /unknown heading/],
    ["card placed twice", (s) => s.teacher.answer.push({ cardId: "item-001", headingId: "group-002" }), /twice/],
    ["duplicate label", (s) => { s.cards[1].label = s.cards[0].label; }, /duplicate label/],
    ["one heading", (s) => { s.headings = s.headings.slice(0, 1); }, /headings must be/],
    ["no sets", (s) => { s.sets = { per: "table" }; }, /sets.per/],
    ["group without a count", (s) => { s.sets = { per: "group", groupCount: null }; }, /groupCount/],
    ["no preparation line", (s) => { s.teacher.where = ""; }, /teacher.where/],
    ["no source unit", (s) => { delete s.sourceUnitId; }, /sourceUnitId/],
  ];
  for (const [name, mutate, pattern] of cases) {
    const item = JSON.parse(JSON.stringify(base));
    mutate(item.spec);
    const result = normaliseCardSet(item, 30);
    assert.strictEqual(typeof result, "string", `${name}: expected a refusal`);
    assert.match(result, pattern, name);
  }
});

test("a pack whose only kit is refused reports failure rather than writing a pack that looks complete", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-kit-"));
  const broken = spec();
  broken.items[0].spec.teacher.answer.pop();
  const brokenPath = path.join(out, "broken.json");
  fs.writeFileSync(brokenPath, JSON.stringify(broken));
  const before = process.exitCode;
  process.exitCode = 0;
  try {
    const result = await build(brokenPath, out);
    assert.strictEqual(result, null);
    assert.strictEqual(process.exitCode, 1);
  } finally {
    process.exitCode = before;
  }
});

test("a pack can hold write-on pieces and a card kit together, and the kit pages follow the pieces", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-kit-"));
  const mixed = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/two-moments.json"), "utf8"));
  mixed.items.push(spec().items[0]);
  mixed.classSize = 30;
  const mixedPath = path.join(out, "mixed.json");
  fs.writeFileSync(mixedPath, JSON.stringify(mixed));
  const before = process.exitCode;
  process.exitCode = 0;
  try {
    const result = await build(mixedPath, out);
    assert.ok(result && fs.existsSync(result));
    assert.strictEqual(process.exitCode, 0);
  } finally {
    process.exitCode = before;
  }
  const answers = fs.readdirSync(out).find((f) => f.endsWith(" - Answers.txt"));
  assert.ok(answers, "the kit's answers file is written even when pieces share the pack");
});
