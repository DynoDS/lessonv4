"use strict";

// Books or sheet, and the question slips a "books" sheet gets.
//
// Daniel's school asked for less paper (16 September 2026). Every sheet now
// says whether its questions can be answered in an exercise book, carries a
// small mark saying so, and a books sheet prints as a page of question slips in
// its own place in the PDF: the same questions with the answer room taken out,
// half a page wide, so a child sticks one in and a book monitor can see what
// was asked. Since 29 September 2026 the write-on sheet is not printed as well.

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const {
  recordingProblems,
  recordingAdvisories,
  forSlip,
  slipContentOf,
  renderSlipsPage,
  rowsFor,
  slipNodesFor,
  tooWideForSlip,
  slipWidthProblems,
  buildSlips,
  MAX_ROWS,
} = require("../src/slips");
const { needsContent } = require("../src/helpers");
const EXAMPLES = require("./helper-examples");
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

test("a books sheet whose words look as if they need the printed page is flagged to look again", () => {
  // The worksheets topic, settled item o (4.2.290): the word list is a prompt
  // to look again, not a verdict, so it is an advisory and never a problem.
  for (const text of [
    "Circle the number that rounds to 3,000.",
    "Mark 2,748 on the number line.",
    "Label the parts of the plant.",
    "Fill in the table.",
  ]) {
    const worksheet = { sheets: { expected: sheet("books", text) } };
    assert.deepEqual(signals(worksheet, { required: true }), [], text);
    const advisories = recordingAdvisories(worksheet);
    assert.deepEqual(advisories.map((a) => `${a.sheet}:${a.signal}`), ["expected:RECORDING_LOOK_AGAIN"], text);
    assert.match(advisories[0].message, /Look at that question against references\/books-or-sheet\.md/);
    assert.match(advisories[0].message, /"recordingLookedAgain": true/);
    assert.match(advisories[0].message, /Never reword the question\./);
  }
});

test("words about a box are judged by what the sheet holds, never by the reason's words", () => {
  // His ruling, 19 September 2026: one digit box does not make a write-on
  // sheet. A box in the question's own sentence, or on a sheet whose only
  // helpers are sentences and number sentences, is copied into a book in
  // seconds; the reason
  // can say so in his own words and nothing has to repeat the engine's.
  const reason = "Books: one digit box is copied into a book in seconds.";
  for (const text of [
    "Write the missing digit in the box.",
    "Write the missing digit in the box: 4,_50.",
    "Fill in the missing numbers.",
    "Write the missing numbers in the boxes.",
  ]) {
    const worksheet = { sheets: { expected: { ...sheet("books", text), recordingReason: reason } } };
    assert.deepEqual(recordingAdvisories(worksheet, { includeAnswered: true }), [], text);
  }
  // A box in a printed figure is still flagged, whatever the reason says.
  const figure = (text) => ({
    sheets: {
      expected: {
        ...sheet("books"),
        recordingReason: reason,
        zones: {
          a: {
            stack: [
              { helper: "instruction", text },
              { helper: "part-whole", question: true, whole: { value: 10 }, parts: [{ blank: true }, { value: 4 }] },
            ],
          },
        },
      },
    },
  });
  assert.equal(recordingAdvisories(figure("Write the missing numbers in the boxes.")).length, 1);
  // Its own blank in the sentence keeps a box quiet even beside a figure.
  assert.equal(recordingAdvisories(figure("Write the missing digit in the box: 4,_50.")).length, 0);
});

test("the sheet saying it was looked at again quiets the prompt; the reason's words do not", () => {
  const text = "Circle the number that rounds to 3,000.";
  const named = { sheets: { expected: { ...sheet("books", text), recordingReason: "Books: no circle is needed in a book." } } };
  assert.equal(recordingAdvisories(named).length, 1, "a reason that merely contains the word answers nothing");
  const looked = { sheets: { expected: { ...sheet("books", text), recordingLookedAgain: true } } };
  assert.deepEqual(recordingAdvisories(looked), []);
  const all = recordingAdvisories(looked, { includeAnswered: true });
  assert.equal(all.length, 1);
  assert.equal(all[0].answered, true);
  assert.deepEqual(
    signals({ sheets: { expected: { ...sheet("books", text), recordingLookedAgain: "yes" } } }),
    ["expected:RECORDING_INVALID"]
  );
});

test("the prompt never reaches a sheet marked sheet", () => {
  const worksheet = { sheets: { expected: sheet("sheet", "Circle the number that rounds to 3,000.") } };
  assert.deepEqual(recordingAdvisories(worksheet, { includeAnswered: true }), []);
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
  assert.equal((html.match(/class="slip[ "]/g) || []).length, 4);
  assert.equal((html.match(/data-worksheet-zone="slip-/g) || []).length, 4);
  assert.match(html, /<div class="slip-code">E<svg class="sheet-recording"[^>]*aria-label="books"/);
  const firstSlip = html.slice(html.indexOf('class="slip '), html.indexOf('data-worksheet-zone="slip-2"'));
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
  assert.deepEqual(
    laid.stack[0].row.filter((c) => c.number !== undefined).map((c) => c.number),
    [1, 2]
  );
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
  // The rows start 5mm down the page, so the first row's words keep the
  // printer's edge room; the cuts follow them.
  assert.match(tight, /class="cut cut--across" style="top:89\.80mm"/);
  assert.match(tight, /class="cut cut--across" style="top:174\.60mm"/);
  // Without a height the page still divides evenly, as older calls expect.
  const even = renderSlipsPage({ nodes: [], cols: 1, rows: 3, code: "E", title: "t" });
  assert.match(even, /grid-template-rows:repeat\(3,1fr\)/);
  assert.match(even, /class="cut cut--across" style="top:102\.33mm"/);
});

test("the words sit close to a cut line and well in from the paper's edge", () => {
  // Daniel trims close to the question, so 9mm between the cut line and the
  // words meant trimming twice (28 September 2026). Beside a cut it is 4mm;
  // at the paper's edge, where nobody trims, it stays 9mm for the printer.
  const two = renderSlipsPage({ nodes: [], cols: 2, rows: 1, code: "E", title: "t" });
  assert.match(two, /\.slip \{[^}]*padding: 4mm 9mm 4mm;/);
  assert.match(two, /\.slip--left \{ padding-right: 4mm; \}/);
  assert.match(two, /\.slip--right \{ padding-left: 4mm; \}/);
  assert.match(two, /\.slips \{[^}]*top: 5mm;/);
  assert.match(two, /class="slip slip--left"/);
  assert.match(two, /class="slip slip--right"/);
  const one = renderSlipsPage({ nodes: [], cols: 1, rows: 1, code: "E", title: "t" });
  assert.doesNotMatch(one, /class="slip slip--(left|right)"/);
});

test("the level code shares the heading's line, or takes a line of its own", () => {
  const beside = renderSlipsPage({ nodes: [], cols: 1, rows: 1, code: "GD", title: "t", codeBeside: true });
  assert.doesNotMatch(beside, /class="slip slip--code-above"/);
  const above = renderSlipsPage({ nodes: [], cols: 1, rows: 1, code: "GD", title: "t", codeBeside: false });
  assert.match(above, /class="slip slip--code-above"/);
});

test("never more than four rows of slips, however short they are", () => {
  // rowsFor takes a whole slip's height, padding included, and the page gives
  // up 5mm at the top and 2mm at the foot for the printer's edge.
  assert.equal(rowsFor(10), MAX_ROWS);
  assert.equal(rowsFor(120), 2);
  assert.equal(rowsFor(290), 1);
  assert.equal(rowsFor(291), 0);
});

test("a packed number keeps its own line: the cell is as wide as the words really are", () => {
  // A Year 4 slip packed (2b) 85 and (1b) LXXVIII into cells too narrow for
  // them and both broke onto two lines (28 September 2026). Capitals and
  // digits measure about 2.65mm at body size, and the row's gaps come out of
  // the spare column, never out of a question's cell.
  const q = (n, text) => ({ number: n, helper: "questions", showNumbers: false, items: [text] });
  const [laid] = slipNodesFor([{ stack: ["2a", "2b", "2c", "2d"].map((n, i) => q(n, ["62", "85", "44", "92"][i])) }], 2);
  const row = laid.stack[0];
  const cells = row.row.filter((c) => c.number !== undefined).length;
  const cellMm = row.parts[0];
  assert.ok(cellMm >= 10 + 2 * 2.65, `a two-digit cell is ${cellMm}mm`);
  const gaps = row.row.length - 1;
  const total = row.parts.reduce((a, b) => a + b, 0);
  assert.ok(total + gaps * 4 <= 92 + 0.01, "the cells and their gaps fit the slip");
  assert.equal(cells, 4);
  const [roman] = slipNodesFor([{ stack: [q("1a", "LVI"), q("1b", "LXXXVIII")] }], 2);
  assert.ok(roman.stack[0].parts[0] >= 10 + 21.2, "LXXXVIII measures 21.2mm");
});

test("every slip carries the book mark beside its code, with or without a code", () => {
  // Daniel, 29 September 2026: the slips are the books version, so they show the book.
  const coded = renderSlipsPage({ nodes: [], cols: 2, rows: 1, code: "GD", title: "t" });
  assert.equal((coded.match(/<div class="slip-code">GD<svg class="sheet-recording"[^>]*aria-label="books"/g) || []).length, 2);
  const lone = renderSlipsPage({ nodes: [], cols: 2, rows: 1, code: "", title: "t" });
  assert.match(lone, /<div class="slip-code"><svg class="sheet-recording"/);
  assert.match(lone, /\.sheet-recording \{/);
});

test("a method frame puts its labels above its boxes on a slip, and fits half a page", () => {
  // His Year 4 Expected frame: beside its boxes, "Two numbers that make 10:"
  // asked for about 130mm and made every slip a full-width strip.
  const frame = {
    helper: "method-frame",
    lines: [
      { label: "Two numbers that make 10:", content: "___ + ___ = 10" },
      { label: "Add the last number:", content: "10 + ___ = ___" },
    ],
  };
  const onSlip = forSlip(frame);
  assert.equal(onSlip.slip, true);
  assert.ok(needsContent(frame).minWidthMm > 92, "the sheet keeps its label column");
  assert.ok(needsContent(onSlip).minWidthMm <= 92, `${needsContent(onSlip).minWidthMm}mm on a slip`);
  const html = renderSlipsPage({ nodes: [onSlip], cols: 2, rows: 1, code: "E", title: "t" });
  assert.match(html, /class="h-mframe-label-above">Two numbers that make 10:<\/div><div class="h-mframe-line">/);
  assert.doesNotMatch(html, /<span class="h-mframe-label">/);
  // Same boxes, same order.
  assert.equal((html.match(/class="h-mframe-box"/g) || []).length, 2 * 4);
});

test("one-line written answers sit side by side, inside a group the zone holds on its own too", () => {
  // Expected (3a) to (3d) and Greater Depth (1a) to (1c) ran down the slip one
  // to a line: the packer knew questions and instructions but not a one-line
  // written answer, and never looked inside a group held in a stack of its own.
  const part = (n, text) => ({
    number: n,
    stack: [{ helper: "written-answers", showNumbers: false, items: [{ text, lines: 1 }], slip: true }],
  });
  const line = { helper: "instruction", text: "Write the number bond to 10 first, then the total.", groupPrompt: true };
  const zone = { stack: [{ stack: [line, part("1a", "8 + 6 + 2 ="), part("1b", "4 + 9 + 6 ="), part("1c", "7 + 3 + 3 =")] }] };
  const [laid] = slipNodesFor([zone], 2);
  const group = laid.stack[0].stack;
  assert.equal(group[0], line, "the task line keeps its own line");
  const rows = group.slice(1).map((r) => r.row.filter((c) => c.number !== undefined).map((c) => c.number));
  assert.deepEqual(rows, [["1a", "1b"], ["1c"]]);
  // A written answer with words of its own above it keeps its line.
  const long = { number: "2a", stack: [{ helper: "written-answers", text: "Kacper is thinking of three numbers.", items: [{ text: "Find them all.", lines: 3 }] }] };
  const [kept] = slipNodesFor([{ stack: [long, part("2b", "9 + 8 + 1 =")] }], 2);
  assert.equal(kept.stack[0], long);
});

test("a line separates every question on a slip, where the sheet's zones meet too, never above a heading", () => {
  // The stack rules only between its own questions, so (2), which ended one
  // zone, ran into (3), which began the next (29 September 2026).
  const q = (n) => ({ number: n, helper: "questions", showNumbers: false, items: [`${n} + 1 =`] });
  const heading = { stack: [{ helper: "section-label", text: "Going Deeper" }, q(4)] };
  const html = renderSlipsPage({ nodes: [{ stack: [q(1), q(2)] }, { stack: [q(3)] }, heading], cols: 2, rows: 1, code: "E", title: "t" });
  const firstSlip = html.slice(html.indexOf('data-worksheet-zone="slip-1"'), html.indexOf('data-worksheet-zone="slip-2"'));
  const items = firstSlip.match(/class="slip-item[^"]*"/g);
  assert.deepEqual(items, ['class="slip-item"', 'class="slip-item slip-item--ruled"', 'class="slip-item"']);
});

test("a slip is always half a page wide: anything wider is named, and no full-width strip is made", async () => {
  // Daniel, 29 September 2026: a full-width strip goes in a book as wide as
  // the page, "otherwise there's no point in it being a strip".
  const { text: _words, ...timeline } = EXAMPLES.timeline;
  const nodes = [{ stack: [{ number: 1, stack: [{ helper: "questions", items: ["Which era came first?"] }, { helper: "timeline", ...timeline }] }] }];
  const found = tooWideForSlip(nodes);
  assert.equal(found.length, 1);
  assert.equal(found[0].helper, "timeline", "the picture is named, not its zone");
  assert.equal(found[0].number, 1);
  const wide = await buildSlips({ sheetSpec: { code: "E", zones: { a: nodes[0] } }, title: "t" });
  assert.match(wide.skipped, /^timeline \(\d+mm, question 1\) will not fit a slip half a page wide/);
  const [plain] = sheetsOf({ sheets: { expected: sheet("books") } });
  const made = await buildSlips({ sheetSpec: plain.spec, title: "t" });
  assert.equal(made.cols, 2);
});

test("the designer is told which picture keeps a books sheet off its slips, and decides", () => {
  // His 29 September 2026 answer: holding a wide picture is not by itself a
  // reason for "sheet"; the designer looks and decides.
  const { text: _words, ...timeline } = EXAMPLES.timeline;
  const withTimeline = (recording, extra = {}) => {
    const s = sheet(recording);
    s.zones.a.stack.push({ helper: "timeline", ...timeline, ...extra });
    return { sheets: { expected: s } };
  };
  const [problem, ...rest] = slipWidthProblems(sheetsOf(withTimeline("books")));
  assert.equal(rest.length, 0);
  assert.equal(problem.signal, "SLIP_TOO_WIDE");
  assert.match(problem.message, /timeline \(\d+mm\)/);
  assert.match(problem.message, /"onSlip": false/);
  assert.match(problem.message, /not by itself a reason/);
  // Either of the designer's answers quiets it.
  assert.deepEqual(slipWidthProblems(sheetsOf(withTimeline("books", { onSlip: false }))), []);
  assert.deepEqual(slipWidthProblems(sheetsOf(withTimeline("sheet"))), []);
});

test("a group's task line keeps its own line above its packed parts", () => {
  const line = { helper: "instruction", text: "Write each number as Roman numerals.", groupPrompt: true };
  const q = (n, text) => ({ number: n, helper: "questions", showNumbers: false, items: [text] });
  const [laid] = slipNodesFor([{ stack: [line, q("2a", "62"), q("2b", "85")] }], 1);
  assert.equal(laid.stack[0], line);
  assert.ok(laid.stack[1].row, "the parts share a row under it");
});

test("a run of packed parts stops where the question changes", () => {
  const q = (n, text) => ({ number: n, helper: "questions", showNumbers: false, items: [text] });
  const [laid] = slipNodesFor([{ stack: [q("1a", "LVI"), q("1b", "XC"), q("2a", "62"), q("2b", "85")] }], 1);
  const labels = laid.stack.map((r) => r.row.filter((c) => c.number !== undefined).map((c) => c.number));
  assert.deepEqual(labels, [["1a", "1b"], ["2a", "2b"]]);
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

test("a books sheet prints as its slips, in the sheet's own place in the one file", async (t) => {
  const { stdout, pdf, files } = build({
    meta: { lesson: "Rounding", yearGroup: 4 },
    sheets: { below: sheet("sheet"), expected: sheet("books") },
    answerKey,
  });
  if (/PDF_SKIPPED/.test(stdout)) {
    assert.match(stdout, /^Built HTML: .*Rounding - Worksheets-slips-expected\.html$/m);
    // The slips are handed over in the sheet's place, never beside it.
    assert.doesNotMatch(stdout, /^Built HTML: .*Rounding - Worksheets-expected\.html$/m);
    t.skip("no browser on this machine; the slips were written as HTML");
    return;
  }
  assert.match(stdout, /^SLIPS: Expected - \d+ slips a page \(2 across, \d+ down\), printed in place of the sheet\./m);
  assert.doesNotMatch(stdout, /SLIPS: Below/);
  assert.ok(files.includes("Rounding - Worksheets-slips-expected.html"));

  const { PDFDocument } = require("pdf-lib");
  const doc = await PDFDocument.load(pdf);
  // Printing the write-on sheet as well only spent the paper the mark was
  // there to save (Daniel, 29 September 2026).
  assert.equal(doc.getPageCount(), 2, "Below's sheet, then Expected's slips and no Expected sheet");
});

test("a books sheet whose slips cannot be made prints its sheet, so the level still gets something", async (t) => {
  const { text: _words, ...timeline } = EXAMPLES.timeline;
  const wide = sheet("books");
  wide.zones.a.stack.push({ helper: "timeline", ...timeline });
  const { stdout, pdf } = build({
    meta: { lesson: "Rounding", yearGroup: 4 },
    sheets: { below: sheet("sheet"), expected: wide },
    answerKey,
  });
  assert.match(stdout, /^SLIPS_SKIPPED: Expected - no question slips, because timeline \(\d+mm\) will not fit a slip half a page wide.*The sheet prints instead, unchanged\./m);
  if (/PDF_SKIPPED/.test(stdout)) {
    assert.match(stdout, /^Built HTML: .*Rounding - Worksheets-expected\.html$/m);
    t.skip("no browser on this machine; the sheet was written as HTML");
    return;
  }
  const { PDFDocument } = require("pdf-lib");
  assert.equal((await PDFDocument.load(pdf)).getPageCount(), 2, "Below's sheet, then Expected's sheet");
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
  // Settled item o (4.2.290): corrected only because nobody answered it.
  assert.match(stdout, /the sheet does not say it was looked at again/);
  assert.doesNotMatch(stdout, /^SLIPS: /m);
});

test("his digit-box sheet keeps books by what it holds", () => {
  // Settled item o of the worksheets topic (4.2.290), his 19 September ruling:
  // one digit box does not make a write-on sheet. The reason is in his own
  // words and repeats nothing of the engine's.
  const { stdout } = build({
    meta: { lesson: "Rounding", yearGroup: 4 },
    sheets: {
      below: sheet("sheet"),
      expected: {
        ...sheet("books", "Write the missing digit in the box: 4,_50."),
        recordingReason: "Books: one digit box is copied into a book in seconds.",
      },
    },
    answerKey,
  });
  assert.doesNotMatch(stdout, /^RECORDING_CHANGED: /m);
  assert.match(stdout, /^RECORDING: Expected - books, /m);
});

test("a books sheet looked at again keeps books through the build", () => {
  const { stdout } = build({
    meta: { lesson: "Rounding", yearGroup: 4 },
    sheets: {
      below: sheet("sheet"),
      expected: { ...sheet("books", "Circle the number that rounds to 2,700."), recordingLookedAgain: true },
    },
    answerKey,
  });
  assert.doesNotMatch(stdout, /^RECORDING_CHANGED: /m);
  assert.match(stdout, /^RECORDING: Expected - books, /m);
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

test("a run of one-number questions is laid out in even columns, only as wide as they need", () => {
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
  const numbered = (row) => row.row.filter((c) => c.number !== undefined).map((c) => c.number);
  assert.equal(rows.length, 2);
  assert.deepEqual(numbered(rows[0]), ["1a", "1b", "1c"]);
  // The short last row keeps its columns under the ones above, and every row
  // has the same shape, so their edges line up.
  assert.deepEqual(numbered(rows[1]), ["1d", "1e"]);
  assert.equal(rows[1].row.length, rows[0].row.length);
  assert.deepEqual(rows[1].parts, rows[0].parts);
  // A column is as wide as the run needs, and the leftover is one empty column
  // at the right rather than space shared out between the numbers.
  const parts = rows[0].parts;
  const columns = parts.slice(0, -1);
  assert.equal(parts.length, rows[0].row.length);
  assert.ok(columns.every((p) => p === columns[0]), "one width for every column");
  assert.ok(
    columns.reduce((a, b) => a + b, 0) < 87,
    "the numbers take the width they need, not the width of the slip"
  );
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
