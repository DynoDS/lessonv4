"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const { REGISTRY, renderHelper, measureContent, needsContent } = require("../src/helpers");
const { legibleWidthMm } = require("../src/helpers/shared");

// The three working surfaces the teacher-approved partitioning sheets are made
// of, and the composition rules that let a page hold them.
//
// The reference is `fixtures/maths-partition-four-digit-numbers.json`, which is
// the approved pack's own tasks, values and order. These tests are about the
// one thing a rendering test can prove and a picture cannot: that the surface
// still asks the child what the question asked, and never answers it.

const FIXTURE = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "fixtures", "maths-partition-four-digit-numbers.json"),
    "utf8"
  )
);

function render(helper, spec) {
  return renderHelper({ helper, ...spec }, 174);
}

function reportedMinWidthMm(helper, spec) {
  const entry = REGISTRY[helper];
  return Math.max(entry.needs(spec).minWidthMm, legibleWidthMm(entry.render(spec)));
}

// ─── part-whole: the whole is given, the parts are the question ──────────

const PARTITION = {
  whole: { value: "6,731" },
  joiner: "+",
  parts: [
    { blank: true, caption: "Thousands" },
    { blank: true, caption: "Hundreds" },
    { blank: true, caption: "Tens" },
    { blank: true, caption: "Ones" },
  ],
};

test("the whole is printed and every part is left empty", () => {
  const html = render("part-whole", PARTITION);
  assert.match(html, /6,731/, "the number the child is partitioning is not on the page");
  // Four boxes and no fifth number: every part is a place to write.
  const numbers = html.match(/>[\d,]+</g) || [];
  assert.deepEqual(numbers, [">6,731<"], `something else printed a number: ${numbers}`);
});

test("a caption names its node without printing inside it", () => {
  const html = render("part-whole", PARTITION);
  // Outside the drawing entirely, so it prints at note size however wide the
  // model is drawn and cannot be read as an answer already written in.
  assert.ok(!/<svg[^>]*>[\s\S]*Thousands[\s\S]*<\/svg>/.test(html),
    "a caption is inside the drawing, where it scales with it");
  assert.match(html, /class="h-pw-caption"[^>]*>Thousands</);
});

test("a given zero prints, because a zero part is the whole question", () => {
  // 6,007 has zero hundreds and zero tens. If a node's value were read for
  // truthiness rather than for being absent, those zeros would silently become
  // blanks and the sheet would ask a different question.
  const html = render("part-whole", {
    whole: { value: "6,007" },
    joiner: "+",
    parts: [
      { value: 6000, caption: "Thousands" },
      { value: 0, caption: "Hundreds" },
      { value: 0, caption: "Tens" },
      { blank: true, caption: "Ones" },
    ],
  });
  assert.equal((html.match(/>0</g) || []).length, 2, "the given zeros did not print");
});

test("a node that says nothing about itself is refused", () => {
  assert.throws(
    () => render("part-whole", { whole: { value: "6,731" }, parts: [{}, { blank: true }] }),
    /PART_WHOLE_INTENT_UNSTATED/
  );
});

test("a blank node carrying an answer is refused", () => {
  assert.throws(
    () => render("part-whole", { whole: { blank: true }, parts: [{ blank: true, value: 30 }] }),
    /blank node is empty/
  );
});

test("a node cannot be handed over and read at the same time", () => {
  assert.throws(
    () => render("part-whole", { whole: { value: 40, label: "Left" }, parts: [{ blank: true }] }),
    /not both/
  );
});

test("the money route keeps its old permissive contract and its old size", () => {
  const money = {
    text: "£1.40 + £2.30",
    whole: {},
    parts: [{ label: "£1.40" }, { label: "£2.30" }],
  };
  // An empty whole with nothing said about it is how every saved money spec
  // asks its question. It must keep working, and at the width it always had.
  const need = REGISTRY["part-whole-money"].needs(money);
  assert.ok(need.minWidthMm > 55 && need.minWidthMm < 65, `${need.minWidthMm}mm`);
  assert.throws(() => render("part-whole", money), /PART_WHOLE_INTENT_UNSTATED/);
});

test("two four-part models fit side by side on a portrait page", () => {
  // The approved sheet puts (1a) beside (1b). Each model carries a question
  // number, so the pair costs its own width twice plus two gutters, and the
  // page has 174mm of usable width after the zone gutter.
  const row = { row: [{ question: true, helper: "part-whole", ...PARTITION },
                      { question: true, helper: "part-whole", ...PARTITION }] };
  const { numbered } = require("../src/worksheet");
  const spec = numbered({ a: row }).a;
  assert.ok(needsContent(spec).minWidthMm <= 174,
    `a pair of models needs ${needsContent(spec).minWidthMm.toFixed(1)}mm`);
});

test("the model's minimum is set by the boxes, not by its smallest word", () => {
  // Captions print as text under the drawing rather than inside it. Inside,
  // the legibility floor would grow the model until the caption reached note
  // size, and the width a child gets to write in would be decided by the
  // quietest thing on the page.
  const stated = REGISTRY["part-whole"].needs(PARTITION).minWidthMm;
  assert.ok(reportedMinWidthMm("part-whole", PARTITION) <= stated + 0.01,
    "the legibility floor is still what sets this model's width");
});

// ─── number-sentence: the terms stay apart, the answer stays blank ───────

const RECOMBINE = {
  terms: [
    { value: 9 }, "+", { value: "4,000" }, "+", { value: 50 }, "+", { value: 200 },
    "=", { cells: 4 },
  ],
};

test("the summands keep the order the question asked them in", () => {
  const html = render("number-sentence", RECOMBINE);
  const tiles = [...html.matchAll(/class="h-ns-tile">([^<]*)</g)].map((m) => m[1]);
  assert.deepEqual(tiles, ["9", "4,000", "50", "200"],
    "the values were sorted, deduplicated or reordered");
});

test("the result is a frame with nothing in it", () => {
  const html = render("number-sentence", RECOMBINE);
  assert.equal((html.match(/class="h-ns-cell"><\/span>/g) || []).length, 4);
  assert.ok(!/9,?259|4259/.test(html), "the answer is printed on the pupil sheet");
});

test("a term that says two things about itself is refused", () => {
  assert.throws(
    () => render("number-sentence", { terms: [{ value: 9, blank: true }] }),
    /states exactly one/
  );
  assert.throws(
    () => render("number-sentence", { terms: [{}] }),
    /states exactly one/
  );
});

test("a given zero term prints, the same as anywhere else", () => {
  const html = render("number-sentence", {
    terms: [{ value: 6000 }, "+", { value: 0 }, "+", { value: 0 }, "+", { value: 7 },
            "=", { cells: 4 }],
  });
  assert.equal((html.match(/class="h-ns-tile">0</g) || []).length, 2);
});

test("a blank is sized by what will be written in it", () => {
  const four = REGISTRY["number-sentence"].needs({ terms: [{ blank: true, chars: 4 }] });
  const twelve = REGISTRY["number-sentence"].needs({ terms: [{ blank: true, chars: 12 }] });
  assert.ok(twelve.minWidthMm > four.minWidthMm,
    "a box for a written word is no wider than a box for four digits");
});

test("a sentence claims the width of the whole sentence", () => {
  // Broken across two lines it stops being a sentence: the child reassembles
  // it before starting, and the answer target lands on a different line from
  // the values it belongs to.
  const need = REGISTRY["number-sentence"].needs(RECOMBINE);
  const measured = REGISTRY["number-sentence"].measure(RECOMBINE, need.minWidthMm);
  assert.equal(measured, REGISTRY["number-sentence"].measure(RECOMBINE, 261),
    "the sentence gets taller when the zone gets narrower, so it is wrapping");
});

test("a heading spans the terms it names", () => {
  const html = render("number-sentence", {
    terms: [
      { cells: 4, heading: "Your number" }, "=",
      { blank: true, chars: 4, heading: "Expanded form" }, "+",
      { blank: true, chars: 4 }, "+", { blank: true, chars: 4 },
    ],
  });
  const widths = [...html.matchAll(/class="h-ns-head" style="width:([\d.]+)mm"/g)]
    .map((m) => Number(m[1]));
  assert.equal(widths.length, 2, "the headings did not group");
  assert.ok(widths[1] > widths[0], "Expanded form does not cover the blanks it names");
});

// ─── counter-group: the evidence, and only the evidence ──────────────────

const CLAIM = {
  statement: "5,009 = 5,000 + 9",
  joiner: "+",
  groups: [{ value: "1000", count: 5 }, { value: "1", count: 9 }],
};

test("the counters show the denominations and counts they were given", () => {
  const html = render("counter-group", CLAIM);
  assert.equal((html.match(/>1000</g) || []).length, 5);
  assert.equal((html.match(/>1</g) || []).length, 9);
});

test("the claim sits with the evidence for it, and no verdict does", () => {
  const html = render("counter-group", CLAIM);
  assert.match(html, /5,009 = 5,000 \+ 9/);
  assert.ok(!/correct|true|false|✓|✗/i.test(html), "the sheet judged the claim");
  // Nothing anywhere works out what the counters come to.
  assert.ok(!/5009|5,009 =\s*5,009/.test(html.replace("5,009 = 5,000 + 9", "")),
    "an evaluated total reached the pupil sheet");
});

test("two matched claims fit side by side, where two charts could not", () => {
  const group = REGISTRY["counter-group"].needs(CLAIM).minWidthMm;
  const chart = REGISTRY["place-value-counter-chart"].needs({
    columns: ["thousands", "hundreds", "tens", "ones"],
    counts: { thousands: 5, ones: 9 },
  }).minWidthMm;
  assert.ok(group * 2 + 4 <= 174, `a matched pair needs ${(group * 2 + 4).toFixed(1)}mm`);
  assert.ok(chart * 2 > 174, "two charts would have fitted, so this helper is not needed");
});

test("a count nobody stated is refused rather than inferred", () => {
  assert.throws(
    () => render("counter-group", { groups: [{ value: "100" }] }),
    /count/
  );
});

// ─── composition: what a stack costs ─────────────────────────────────────

test("a heading is joined to what it introduces, not spaced off from it", () => {
  const label = { helper: "section-label", text: "Fluency" };
  const question = { helper: "questions", items: ["What is 6,731 in expanded form?"] };
  const introduced = measureContent({ stack: [label, question] }, 174);
  const beside = measureContent({ stack: [question, question] }, 174);
  const labelAlone = measureContent(label, 174);
  const questionAlone = measureContent(question, 174);
  assert.ok(
    introduced - labelAlone - questionAlone < beside - 2 * questionAlone,
    "a section label is spaced off its block the way two questions are spaced apart"
  );
});

test("a stack repeats one item the way a row already does", () => {
  const row = { helper: "number-sentence", terms: [{ cells: 4 }, "=", { blank: true }] };
  const six = { stack: row, repeat: 6 };
  const one = measureContent(row, 174);
  assert.ok(measureContent(six, 174) > 5 * one, "the repeat did not expand");
  assert.equal(
    (require("../src/helpers").renderContent(six, 174).match(/h-ns-row/g) || []).length,
    6
  );
});

test("ruled lines with no prompt of their own are not charged for one", () => {
  // Two lines under each of two claims, where the instruction above already
  // said what to do. An empty prompt row costs a line of paper per item and
  // leaves a gap nothing explains.
  const withPrompt = { helper: "written-answers", showNumbers: false,
    items: [{ text: "Explain your decision.", lines: 2 }] };
  const without = { helper: "written-answers", showNumbers: false,
    items: [{ text: "", lines: 2 }] };
  assert.ok(measureContent(without, 85) < measureContent(withPrompt, 85));
  assert.ok(!renderHelper(without, 85).includes("h-written-prompt"));
});

// ─── the fixture itself ──────────────────────────────────────────────────

test("the approved fixture still holds every task it arrived with", () => {
  const json = JSON.stringify(FIXTURE);
  for (const value of ["6,731", "6,701", "6,071", "6,007",
                       "5,009 = 5,000 + 9", "5,009 = 500 + 9"]) {
    assert.ok(json.includes(value), `${value} has gone from the fixture`);
  }
  // The three recombinations, in the order the approved sheet asks them.
  const sentences = FIXTURE.sheets.expected.zones[0].stack
    .filter((item) => item.helper === "number-sentence" && item.terms.some((t) => t.cells))
    .map((item) => item.terms.filter((t) => t && t.value != null).map((t) => String(t.value)));
  assert.deepEqual(sentences, [
    ["9", "4,000", "50", "200"],
    ["80", "3,000", "2"],
    ["500", "9,000"],
  ]);
  // Four digit cards, both zeros kept.
  const cards = JSON.parse(json).sheets.greaterDepth.zones[0].stack[1].stack[0];
  assert.deepEqual(cards.digits, ["4", "0", "0", "7"]);
});

test("no answer from the fixture's teacher key appears on a pupil sheet", () => {
  const pupil = JSON.stringify(FIXTURE.sheets);
  for (const entry of [...FIXTURE.answerKey.expected, ...FIXTURE.answerKey.greaterDepth]) {
    const firstAnswer = String(entry.answer).split(/[;.]/)[0].trim();
    assert.ok(!pupil.includes(firstAnswer),
      `the answer to (${entry.question}) is on the pupil sheet`);
  }
});
