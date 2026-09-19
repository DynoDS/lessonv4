"use strict";

// Books or sheet, and the question slips a "books" sheet gets.
//
// Daniel's school asked for less paper (16 September 2026). Every sheet now
// says whether its questions can be answered in an exercise book, carries a
// small mark saying so, and a books sheet gets a page of question slips at the
// back of the same PDF: the same questions with the answer room taken out, so
// a child sticks one in and a book monitor can see what was asked.

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const {
  recordingProblems,
  forSlip,
  slipContentOf,
  renderSlipsPage,
  rowsFor,
  slipNodesFor,
  MAX_ROWS,
} = require("../src/slips");
const { renderSheet } = require("../src/render");
const { sheetsOf } = require("../src/worksheet");
const { REGISTRY } = require("../src/helpers");

function sheet(recording, text = "Round 2,748 to the nearest 100.") {
  return {
    ...(recording === undefined ? {} : { recording }),
    ...(recording === undefined
      ? {}
      : { recordingReason: "Checked question by question against the age guide." }),
    layout: "full",
    orientation: "portrait",
    zones: {
      a: {
        stack: [
          { helper: "instruction", text: "Round to the nearest 100." },
          { helper: "questions", question: true, items: [text] },
          {
            helper: "written-answers",
            question: true,
            items: [{ text: "Is 2,748 nearer 2,700 or 2,800? Explain your answer.", lines: 3 }],
          },
        ],
      },
    },
  };
}

function signals(worksheet, options) {
  return recordingProblems(worksheet, options).map((p) => `${p.sheet}:${p.signal}`);
}

// ─── the choice ──────────────────────────────────────────────────────────

test("the designer's gate refuses a sheet that has not said books or sheet", () => {
  const worksheet = { sheets: { expected: sheet(undefined), below: sheet("sheet") } };
  assert.deepEqual(signals(worksheet, { required: true }), ["expected:RECORDING_MISSING"]);
});

test("a spec written before the choice existed still builds, unmarked", () => {
  const worksheet = { sheets: { expected: sheet(undefined) } };
  assert.deepEqual(signals(worksheet), []);
  const [built] = sheetsOf(worksheet);
  assert.equal(built.spec.recording, null);
  assert.doesNotMatch(renderSheet(built.spec), /<svg class="sheet-recording"/);
});

test("the gate makes either mark say why, on the whole sheet", () => {
  // Both marks are asked, because either can be reached without running the
  // test and the two look identical on the page.
  for (const recording of ["sheet", "books"]) {
    const bare = { layout: "full", orientation: "portrait", recording, zones: {} };
    assert.deepEqual(
      signals({ sheets: { expected: bare } }, { required: true }),
      ["expected:RECORDING_REASON_MISSING"],
      recording
    );
    // Blank, or spaces, is no reason at all.
    assert.deepEqual(
      signals({ sheets: { expected: { ...bare, recordingReason: "   " } } }, { required: true }),
      ["expected:RECORDING_REASON_MISSING"],
      recording
    );
    assert.deepEqual(
      signals(
        { sheets: { expected: { ...bare, recordingReason: "Checked question by question." } } },
        { required: true }
      ),
      [],
      recording
    );
  }
});

test("the build never withholds a worksheet over a missing reason", () => {
  const bare = { layout: "full", orientation: "portrait", recording: "sheet", zones: {} };
  assert.deepEqual(signals({ sheets: { expected: bare } }), []);
});

test("a digit box a child copies does not force a sheet mark", () => {
  // Daniel's ruling, 19 September 2026: one blank in a short number sentence is
  // copied into a book in seconds, so it never makes the sheet write-on.
  for (const text of [
    "Fill the box in 2,_80 with a digit so the number rounds to 3,000.",
    "Write the missing number: 4,300 + ___ = 4,800.",
  ]) {
    const worksheet = { sheets: { expected: sheet("books", text) } };
    assert.deepEqual(signals(worksheet), [], text);
  }
});

test("only books or sheet is a choice", () => {
  const worksheet = { sheets: { expected: sheet("book") } };
  assert.deepEqual(signals(worksheet), ["expected:RECORDING_INVALID"]);
});

test("a books sheet whose words need the printed page is caught", () => {
  for (const text of [
    "Circle the number that rounds to 3,000.",
    "Mark 2,748 on the number line.",
    "Write the missing numbers in the boxes.",
    "Label the parts of the plant.",
    "Fill in the table.",
  ]) {
    const worksheet = { sheets: { expected: sheet("books", text) } };
    assert.deepEqual(signals(worksheet), ["expected:RECORDING_NEEDS_SHEET"], text);
  }
});

test("wording a child can follow in a book is left alone", () => {
  for (const text of [
    "Use the number lines to help you.",
    "Fill the box in 4,_49 with a digit so the number rounds to 4,200.",
    "Draw a bar model to show your thinking.",
    "Join the two sentences with a conjunction.",
  ]) {
    const worksheet = { sheets: { expected: sheet("books", text) } };
    assert.deepEqual(signals(worksheet), [], text);
  }
});

test("the corner shows a book or a pencil beside the level code", () => {
  const worksheet = { sheets: { below: sheet("sheet"), expected: sheet("books") } };
  const [below, expected] = sheetsOf(worksheet);
  const belowHtml = renderSheet(below.spec);
  const expectedHtml = renderSheet(expected.spec);
  assert.match(belowHtml, /<div class="sheet-code">B<svg class="sheet-recording"[^>]*aria-label="sheet"/);
  assert.match(expectedHtml, /<div class="sheet-code">E<svg class="sheet-recording"[^>]*aria-label="books"/);
});

test("a lone sheet has no level code but still shows its mark", () => {
  const [only] = sheetsOf({ sheets: { expected: sheet("books") } });
  assert.match(renderSheet(only.spec), /<div class="sheet-code"><svg class="sheet-recording"/);
});

// ─── the slip ────────────────────────────────────────────────────────────

test("a slip keeps the question and leaves out the room for the answer", () => {
  const drawing = forSlip({ helper: "drawing-space", heightMm: 40 });
  assert.equal(drawing, null);

  const drawingWithWords = forSlip({ helper: "drawing-space", heightMm: 40, text: "Draw it." });
  assert.deepEqual(drawingWithWords, { helper: "instruction", text: "Draw it." });

  const html = REGISTRY.questions.render(
    forSlip({ helper: "questions", items: ["7 + ___ = 10", "38"] }),
    90
  );
  // The blank inside the first question is part of that question.
  assert.equal((html.match(/class="h-blank"/g) || []).length, 1);

  const written = REGISTRY["written-answers"].render(
    forSlip({ helper: "written-answers", items: [{ text: "Explain.", lines: 3 }] }),
    90
  );
  assert.match(written, /Explain\./);
  assert.doesNotMatch(written, /h-lines/);
});

test("a figure the children draw for themselves is left off the slip", () => {
  const content = forSlip({
    stack: [
      { helper: "questions", items: ["38"] },
      { helper: "number-line", start: 0, end: 100, interval: 10, labels: "ends", onSlip: false },
    ],
  });
  assert.equal(content.stack.length, 1);
  assert.equal(content.stack[0].helper, "questions");

  // A question left with nothing in it goes altogether.
  assert.equal(forSlip({ stack: [{ helper: "number-line", onSlip: false }] }), null);
});

test("a figure the children read from stays on the slip", () => {
  const line = { helper: "number-line", start: 0, end: 100, interval: 10, labels: "all" };
  assert.deepEqual(forSlip(line), line);
});

test("slips follow the sheet's reading order and keep its question numbers", () => {
  const worksheet = { sheets: { below: sheet("sheet"), expected: sheet("books") } };
  const expected = sheetsOf(worksheet).find((s) => s.key === "expected");
  const html = renderSlipsPage({
    nodes: slipContentOf(expected.spec),
    cols: 2,
    rows: 2,
    code: expected.spec.code,
    title: "Rounding",
  });
  assert.equal((html.match(/class="slip"/g) || []).length, 4);
  assert.equal((html.match(/data-worksheet-zone="slip-/g) || []).length, 4);
  assert.match(html, /<div class="slip-code">E<\/div>/);
  const firstSlip = html.slice(html.indexOf('class="slip"'), html.indexOf('data-worksheet-zone="slip-2"'));
  assert.ok(firstSlip.indexOf("Round to the nearest 100.") < firstSlip.indexOf("Explain your answer"));
  assert.doesNotMatch(firstSlip, /h-lines/);
  // One cut across between two rows, one cut down between two columns.
  assert.equal((html.match(/cut--across/g) || []).length, 2); // the class in the CSS, and one line
  assert.equal((html.match(/cut--down/g) || []).length, 2);
});

test("a slip closes the gaps the sheet leaves for writing", () => {
  // The Year 4 Greater Depth slip missed fitting twice on a page by 0.9mm and
  // threw away the bottom half of every sheet. On a slip those gaps are
  // separation only: the answer room has already gone.
  const css = renderSlipsPage({ nodes: [], cols: 1, rows: 1, code: "GD", title: "t" });
  assert.match(css, /\.slip-item \.h-stack-item \{ margin-top: 2mm !important; \}/);
  assert.match(css, /\.slip-item \.h-stack-item--new-question \{ margin-top: 4mm !important; \}/);
  // A new question stays a step wider than a new part, so the order still reads.
  assert.match(css, /first-child \{ margin-top: 0 !important; \}/);
});

test("the success criteria panel stays on the sheet and never reaches a slip", () => {
  // Daniel, 19 September 2026, having cut it off printed worksheets himself:
  // "on a slip, I really don't think it's needed at all". It is 45mm of a
  // 100mm slip, and nothing in it is written on.
  const zone = {
    stack: [
      { helper: "questions", question: true, items: ["Round 2,748 to the nearest 100."] },
      { helper: "steps", steps: ["Find the two hundreds either side.", "Choose the nearer."] },
    ],
  };
  const content = slipContentOf({ zones: { a: zone } });
  assert.doesNotMatch(JSON.stringify(content), /Find the two hundreds/);
  assert.match(JSON.stringify(content), /Round 2,748/);
  // The sheet itself is untouched: the panel is only dropped on the way to a slip.
  assert.match(JSON.stringify(zone), /Find the two hundreds/);
});

test("one-line questions share a row however the sheet wrote them", () => {
  // These two were written as the instruction above a number line the slip
  // drops, not as question items, and at 33 characters they sat one per line
  // beside half a slip of blank paper.
  const q = (n, text) => ({
    number: n,
    question: true,
    stack: [{ helper: "instruction", text }],
  });
  const [laid] = slipNodesFor(
    [{ stack: [q(1, "Round 4,280 to the nearest 1,000."), q(2, "Round 6,500 to the nearest 1,000.")] }],
    1
  );
  assert.equal(laid.stack.length, 1, "both questions on one row");
  assert.equal(laid.stack[0].row.length, 2);
  // Too long to sit two across is still a line of its own.
  const long = "Round 4,280 to the nearest 1,000 and explain which digit told you.";
  const [wide] = slipNodesFor([{ stack: [q(1, long), q(2, long)] }], 1);
  assert.equal(wide.stack.length, 2, "one each, unpacked");
});

test("slips sit at their own height, with the cut lines tight under them", () => {
  // Every slip carried a 23mm dead band, which cost a second cut at each
  // boundary: "wasted trimming motions and wasted dead space" (19 Sept 2026).
  const tight = renderSlipsPage({ nodes: [], cols: 1, rows: 3, code: "E", title: "t", slipMm: 84.8 });
  assert.match(tight, /grid-template-rows:repeat\(3,84\.80mm\)/);
  assert.match(tight, /align-content:start/);
  assert.match(tight, /class="cut cut--across" style="top:84\.80mm"/);
  assert.match(tight, /class="cut cut--across" style="top:169\.60mm"/);
  // Without a height the page still divides evenly, as older calls expect.
  const even = renderSlipsPage({ nodes: [], cols: 1, rows: 3, code: "E", title: "t" });
  assert.match(even, /grid-template-rows:repeat\(3,1fr\)/);
  assert.match(even, /class="cut cut--across" style="top:99\.00mm"/);
});

test("never more than four rows of slips, however short they are", () => {
  assert.equal(rowsFor(10), MAX_ROWS);
  assert.equal(rowsFor(120), 2);
  assert.equal(rowsFor(290), 0);
});

// ─── the build ───────────────────────────────────────────────────────────

function build(spec) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worksheet-slips-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  try {
    const stdout = execFileSync(
      process.execPath,
      [path.join(__dirname, "..", "scripts", "build-worksheet.js"), specPath, dir, "Rounding - Worksheets"],
      { encoding: "utf8" }
    );
    const pdfPath = path.join(dir, "Rounding - Worksheets.pdf");
    const pdf = fs.existsSync(pdfPath) ? fs.readFileSync(pdfPath) : null;
    const files = fs.readdirSync(dir);
    return { stdout, pdf, files };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const answerKey = {
  below: [
    { question: 1, answer: "2,700" },
    { question: 2, answer: "2,700; 48 is less than 50." },
  ],
  expected: [
    { question: 1, answer: "2,700" },
    { question: 2, answer: "2,700; 48 is less than 50." },
  ],
};

test("a books sheet gets a page of slips at the back of the one file", async (t) => {
  const { stdout, pdf, files } = build({
    meta: { lesson: "Rounding", yearGroup: 4 },
    sheets: { below: sheet("sheet"), expected: sheet("books") },
    answerKey,
  });
  if (/PDF_SKIPPED/.test(stdout)) {
    assert.match(stdout, /^Built HTML: .*Rounding - Worksheets-slips-expected\.html$/m);
    t.skip("no browser on this machine; the slips were written as HTML");
    return;
  }
  assert.match(stdout, /^SLIPS: Expected - \d+ slips a page/m);
  assert.doesNotMatch(stdout, /SLIPS: Below/);
  assert.ok(files.includes("Rounding - Worksheets-slips-expected.html"));

  const { PDFDocument } = require("pdf-lib");
  const doc = await PDFDocument.load(pdf);
  assert.equal(doc.getPageCount(), 3, "Below, Expected, then Expected's slips");
});

test("a sheet marked books that needs the page is printed as a sheet, with no slips", () => {
  const { stdout } = build({
    meta: { lesson: "Rounding", yearGroup: 4 },
    sheets: {
      below: sheet("sheet"),
      expected: sheet("books", "Circle the number that rounds to 2,700."),
    },
    answerKey,
  });
  assert.match(stdout, /^RECORDING_CHANGED: Expected - /m);
  assert.doesNotMatch(stdout, /^SLIPS: /m);
});

// ─── short questions side by side ────────────────────────────────────────

const { packShortQuestions } = require("../src/slips");

function oneNumber(number, text, group) {
  return {
    number,
    ...(group ? { questionGroupId: group } : {}),
    stack: [{ helper: "questions", showNumbers: false, items: [text], slip: true }],
  };
}

test("a run of one-number questions is laid out across the slip, in even columns", () => {
  // Daniel, on the first built slips: "there was space to put them together ...
  // horizontally to fill the space which might get more on page".
  const content = {
    stack: [
      { helper: "instruction", text: "Round to the nearest 100." },
      ...["38", "850", "3,249", "5,970", "700"].map((t, i) =>
        oneNumber(`1${String.fromCharCode(97 + i)}`, t, "g1")
      ),
      oneNumber(2, "Explain why 2,748 rounds to 2,700 and not to 2,800 here."),
    ],
  };
  const packed = packShortQuestions(content, 87);
  assert.equal(packed.stack[0].helper, "instruction");
  const rows = packed.stack.filter((node) => node.row);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].row.map((n) => n.number), ["1a", "1b", "1c"]);
  // The short last row keeps its columns under the ones above.
  assert.equal(rows[1].row.length, 3);
  assert.deepEqual(rows[1].row.slice(0, 2).map((n) => n.number), ["1d", "1e"]);
  // A long question keeps its own line.
  assert.equal(packed.stack[packed.stack.length - 1].number, 2);
});

test("packing never joins two question groups or packs a question with more in it", () => {
  const content = {
    stack: [
      oneNumber("1a", "38", "g1"),
      oneNumber("1b", "850", "g1"),
      oneNumber("2a", "3,249", "g2"),
      oneNumber("2b", "5,970", "g2"),
      { number: 3, stack: [{ helper: "questions", items: ["7 + ___ = 10"] }] },
      { number: 4, stack: [{ helper: "questions", items: ["38"] }, { helper: "instruction", text: "Show it." }] },
    ],
  };
  const packed = packShortQuestions(content, 87);
  assert.deepEqual(
    packed.stack.map((n) => (n.row ? n.row.filter((c) => c.number !== undefined).map((c) => c.number) : n.number)),
    [["1a", "1b"], ["2a", "2b"], 3, 4]
  );
});
