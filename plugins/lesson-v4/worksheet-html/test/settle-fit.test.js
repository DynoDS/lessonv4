"use strict";

// The browser overruling the arithmetic, in the loop that actually ships pages.
//
// measured-correction.test.js proves that renderSheet grows a zone it is told
// to grow. These tests prove the other half: that the build LISTENS. When the
// browser reports a zone a few pixels short, the page is drawn again with that
// zone grown by what was measured, the clean retry is what ships, and a page
// with nothing spare is reshaped rather than shrunk. That loop sat inside the
// build script's main() for one release, repaired and untested, which is how a
// worksheet refused over 6px (and again over 2px) stayed possible.
//
// The browser is a function here, so it can say exactly what each test needs.
// The last test uses the real one, on the exact sheet that lost a lesson its
// worksheet set.

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const { renderSheet } = require("../src/render");
const {
  settleSheetFit,
  measuredCorrections,
  MAX_CORRECTION_MM,
  MAX_MEASURED_CORRECTIONS,
  PX_PER_MM,
} = require("../src/settle-fit");
const { findChrome } = require("../src/chrome");

const referenceTable = (caption) => ({
  helper: "data-table",
  caption,
  columns: ["Material", "Waterproof?"],
  rows: [
    ["Glass", "yes"],
    ["Cardboard", "no"],
    ["Wool", "no"],
    ["Plastic", "yes"],
  ],
});

// A sheet with room going spare, so a correction can be paid for.
const ROOMY_SHEET = {
  title: "Correction",
  layout: "halves-stacked",
  orientation: "portrait",
  zones: {
    a: { stack: [referenceTable("What we know already"), referenceTable("What we found out")] },
    b: { helper: "questions", question: true, items: ["Why?", "How do you know?"] },
  },
};

// What the browser's fit probe reports for a zone drawn `px` pixels short.
const shortBy = (zone, px, width = 482) => ({
  zone,
  kind: "zone-overflow",
  scrollHeight: 350 + px,
  clientHeight: 350,
  scrollWidth: width,
  clientWidth: width,
});

// A browser that answers each print in turn, repeating its last answer.
function browserSaying(...answers) {
  const calls = [];
  const htmlToPdf = async (html, opts) => {
    calls.push({ html, opts });
    const fitProblems = answers[Math.min(calls.length - 1, answers.length - 1)];
    return { pdf: Buffer.from(`print ${calls.length}`), fitProblems };
  };
  htmlToPdf.calls = calls;
  return htmlToPdf;
}

function drawnZoneHeights(html) {
  const heights = {};
  for (const m of html.matchAll(/data-worksheet-zone="([^"]+)"[^>]*?height:([\d.]+)mm/gs)) {
    heights[m[1]] = Number(m[2]);
  }
  return heights;
}

function typeTokens(html) {
  return [...html.matchAll(/--type-[a-z]+:\s*[\d.]+pt/g)].map((m) => m[0]).sort();
}

test("a zone the browser finds a few pixels short is grown by what it measured, and the retry ships", async () => {
  const html = renderSheet(ROOMY_SHEET);
  const browser = browserSaying([shortBy("a", 6)], []);

  const settled = await settleSheetFit({ spec: ROOMY_SHEET, html, htmlToPdf: browser });

  assert.equal(browser.calls.length, 2, "one measurement, one corrected retry");
  assert.deepEqual(settled.fitProblems, []);
  assert.equal(settled.pdf.toString(), "print 2", "the corrected page is the one that ships");
  assert.equal(settled.reshape, null);

  const wantedMm = 6 / PX_PER_MM + 1;
  assert.ok(
    Math.abs(settled.correction.a - wantedMm) < 0.01,
    `zone "a" should be grown by ${wantedMm.toFixed(2)}mm, was ${settled.correction.a}`
  );
  const before = drawnZoneHeights(html).a;
  const after = drawnZoneHeights(settled.html).a;
  assert.ok(
    after >= before + 6 / PX_PER_MM,
    `the retry must draw zone "a" at least the measured 6px taller: ${before}mm -> ${after}mm`
  );
  assert.ok(browser.calls[1].html === settled.html, "the browser verified the page that ships");
});

test("the two measurements that lost a lesson its worksheets are both absorbed", async () => {
  // 373px in 371px, then 356px in 350px after a repair: a Year 4 number square
  // the arithmetic priced a third of a millimetre per row short. Neither is a
  // content problem, and neither should reach a designer.
  for (const px of [2, 6]) {
    const html = renderSheet(ROOMY_SHEET);
    const browser = browserSaying([shortBy("a", px)], []);
    const settled = await settleSheetFit({ spec: ROOMY_SHEET, html, htmlToPdf: browser });
    assert.deepEqual(settled.fitProblems, [], `${px}px short must be corrected, not refused`);
    assert.ok(settled.correction && settled.correction.a > px / PX_PER_MM);
  }
});

test("a page with nothing spare is reshaped, and nothing is ever shrunk", async () => {
  // Stand in for a full page: the engine refuses the correction because there
  // is no slack to pay it from. The roomier shape is then the route.
  const html = renderSheet(ROOMY_SHEET);
  const noSlack = (spec, opts) => {
    if (opts && opts.extraZoneMm) throw new Error("SHEET_DOES_NOT_FIT: no slack");
    return renderSheet(spec, opts);
  };
  const roomier = () => [
    { spec: ROOMY_SHEET, layout: "roomier", orientation: "portrait", fillPct: 40 },
  ];
  const browser = browserSaying([shortBy("a", 6)], []);

  const settled = await settleSheetFit({
    spec: ROOMY_SHEET,
    html,
    htmlToPdf: browser,
    renderSheet: noSlack,
    roomierArrangements: roomier,
  });

  assert.equal(settled.correction, null, "a refused correction is not recorded as one");
  assert.deepEqual(settled.reshape, { from: "halves-stacked", to: "roomier", fillPct: 40 });
  assert.deepEqual(settled.fitProblems, []);
  assert.equal(browser.calls.length, 2);
  assert.deepEqual(
    typeTokens(settled.html),
    typeTokens(html),
    "the page that ships uses exactly the type sizes the page was composed at"
  );
});

test("a width overflow is never bought with height, and with no roomier shape the sheet is refused", async () => {
  const html = renderSheet(ROOMY_SHEET);
  const wide = {
    zone: "a",
    kind: "zone-overflow",
    scrollHeight: 350,
    clientHeight: 350,
    scrollWidth: 500,
    clientWidth: 482,
  };
  const browser = browserSaying([wide]);

  const settled = await settleSheetFit({
    spec: ROOMY_SHEET,
    html,
    htmlToPdf: browser,
    roomierArrangements: () => [],
  });

  assert.equal(browser.calls.length, 1, "no retry can fix a width problem with height");
  assert.equal(settled.correction, null);
  assert.equal(settled.reshape, null);
  assert.equal(settled.fitProblems.length, 1, "the fault reaches the caller, who refuses the sheet");
  assert.equal(settled.html, html);
});

test("the browser's word is final after the allowed rounds", async () => {
  const html = renderSheet(ROOMY_SHEET);
  const browser = browserSaying([shortBy("a", 6)]);

  const settled = await settleSheetFit({
    spec: ROOMY_SHEET,
    html,
    htmlToPdf: browser,
    roomierArrangements: () => [],
  });

  assert.equal(
    browser.calls.length,
    1 + MAX_MEASURED_CORRECTIONS,
    "the first print plus one retry per allowed round, then stop"
  );
  assert.equal(settled.fitProblems.length, 1);
  assert.equal(settled.correction, null, "a retry that still clipped is not a correction");
});

test("a correction is capped, and a zone at the cap stops being asked about", () => {
  const huge = measuredCorrections([shortBy("a", 400)], {});
  assert.equal(huge.a, MAX_CORRECTION_MM);
  assert.equal(measuredCorrections([shortBy("a", 6)], { a: MAX_CORRECTION_MM }), null);
  assert.deepEqual(measuredCorrections([{ zone: "b", kind: "child-clipped" }], {}), { b: 2 });
});

function browserAvailable() {
  try {
    return Boolean(findChrome());
  } catch {
    return false;
  }
}

test("the Year 4 number-square sheet that was refused over 6px builds clean", { timeout: 90000 }, (t) => {
  if (!browserAvailable()) {
    t.skip("no browser on this machine, so nothing could be measured");
    return;
  }

  // The Below sheet exactly as the worksheet designer composed it: three
  // question blocks and a compact hundred square with a caption and a note, on
  // an auto layout. The build refused it at 373px in a 371px zone, its focused
  // repair at 356px in 350px, and the lesson shipped with no worksheets.
  const hundredSquare = Array.from({ length: 10 }, (_, r) =>
    Array.from({ length: 10 }, (_, c) => String(r * 10 + c + 1))
  );
  const block = (label, ...items) => ({
    stack: [
      { question: true, stack: [{ helper: "section-label", text: label }, ...items] },
    ],
  });
  const below = {
    layout: "auto",
    zones: [
      block(
        "Fluency",
        { helper: "instruction", text: "Complete the table." },
        {
          helper: "recording-table",
          columns: ["10 less", "Number", "10 more"],
          writing: ["tick", "tick", "tick"],
          rows: [
            [null, "24", null],
            [null, "58", null],
            [null, "70", null],
            [null, "89", null],
          ],
        }
      ),
      block(
        "Reasoning",
        {
          helper: "circle-the-answer",
          prompt: "What stays the same each time?",
          options: ["tens digit", "ones digit"],
        },
        { helper: "instruction", text: "Look at the completed rows in question (1)." }
      ),
      block(
        "Problem Solving",
        { helper: "instruction", text: "Fill the boxes." },
        { helper: "inequality-with-boxes", expression: "10 more than □ is 72." },
        { helper: "inequality-with-boxes", expression: "10 less than □ is 45." }
      ),
      {
        stack: [
          {
            helper: "data-table",
            caption: "Use this number square to help you with questions 1 and 3.",
            rows: hundredSquare,
            compact: true,
            compactCaption: true,
            note: "↑ 10 less: move up one row    ↓ 10 more: move down one row",
          },
        ],
      },
    ],
  };
  const pupilSheet = (question) => ({
    layout: "full",
    orientation: "portrait",
    zones: { a: { question: true, helper: "questions", items: [question] } },
  });
  const spec = {
    meta: {
      lesson: "Find 10 and 100 more or less",
      lo: "To find 10 and 100 more or less",
      yearGroup: 4,
      subject: "maths",
    },
    sheets: {
      below,
      expected: pupilSheet("What is 10 more than 576?"),
      greaterDepth: pupilSheet("Write a number where 10 more changes the hundreds digit."),
    },
    answerKey: {
      below: [
        { question: 1, answer: "24: 14, 34. 58: 48, 68. 70: 60, 80. 89: 79, 99." },
        { question: 2, answer: "ones digit" },
        { question: 3, answer: "62; 55" },
      ],
      expected: [{ question: 1, answer: "586" }],
      greaterDepth: [{ question: 1, answer: "For example, 390 + 10 = 400." }],
    },
  };

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worksheet-number-square-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));

  let stdout;
  try {
    stdout = execFileSync(
      process.execPath,
      [path.join(__dirname, "..", "scripts", "build-worksheet.js"), specPath, dir, "Number square - Worksheets"],
      { encoding: "utf8" }
    );
  } catch (e) {
    assert.fail(`the build refused the sheet:\n${e.stdout || e.message}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  assert.doesNotMatch(stdout, /SHEET_DOES_NOT_FIT/);
  assert.match(stdout, /^Built: .*Number square - Worksheets\.pdf$/m);
  assert.match(stdout, /Page fit: .*Below: 1 page/);
});
