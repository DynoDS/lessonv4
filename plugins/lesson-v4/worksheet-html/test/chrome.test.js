"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { PDFDocument } = require("pdf-lib");

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const {
  findChrome,
  htmlToPdf,
  launchBrowser,
  downloadedCandidates,
  PINNED_CHROME_VERSION,
} = require("../src/chrome");
const { renderSheet } = require("../src/render");

// A4 in PostScript points. Chrome rounds, so compare within a point.
const A4_W = 595.276;
const A4_H = 841.89;

test("a usable Chrome is found on this machine", () => {
  const exe = findChrome();
  assert.ok(exe.length > 0, "findChrome returned an empty path");
});

test("a downloaded headless shell is found by searching the cache", () => {
  // ensure-chrome.js downloads into a folder whose name carries the version
  // number, which changes with every release. A fixed candidate path would go
  // stale on the first update, so the cache is searched instead - this plants
  // a fake binary in the real folder shape and expects it found.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-cache-"));
  const nest = path.join(
    dir, "chrome-headless-shell", "linux64-140.0.7259.2", "chrome-headless-shell-linux64"
  );
  fs.mkdirSync(nest, { recursive: true });
  const exe = path.join(nest, "chrome-headless-shell");
  fs.writeFileSync(exe, "");

  assert.deepEqual(downloadedCandidates(dir), [exe]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("a machine that never downloaded anything just has an empty cache", () => {
  const nowhere = path.join(os.tmpdir(), "no-such-chrome-cache-xyz");
  assert.deepEqual(downloadedCandidates(nowhere), []);
});

test("a rendered page is a true A4 portrait PDF", async () => {
  const pdf = await htmlToPdf("<p>hello</p>");
  const doc = await PDFDocument.load(pdf);
  const { width, height } = doc.getPage(0).getSize();

  assert.ok(Math.abs(width - A4_W) < 1, `width was ${width}, expected ${A4_W}`);
  assert.ok(Math.abs(height - A4_H) < 1, `height was ${height}, expected ${A4_H}`);
});

test("landscape swaps the page dimensions", async () => {
  const pdf = await htmlToPdf("<p>hello</p>", { landscape: true });
  const doc = await PDFDocument.load(pdf);
  const { width, height } = doc.getPage(0).getSize();

  assert.ok(Math.abs(width - A4_H) < 1, `width was ${width}, expected ${A4_H}`);
  assert.ok(Math.abs(height - A4_W) < 1, `height was ${height}, expected ${A4_W}`);
});

test("a page declaring one A4 sheet produces exactly one page", async () => {
  const pdf = await htmlToPdf("<p>hello</p>");
  const doc = await PDFDocument.load(pdf);
  assert.equal(doc.getPageCount(), 1);
});

test("a caller's browser is borrowed, not closed: several pages, one Chrome", async () => {
  // The worksheet build prints every sheet plus its reshape retries through
  // one launch. If htmlToPdf ever goes back to closing the browser it was
  // handed, the second print here dies with a disconnected browser.
  const browser = await launchBrowser();
  try {
    const first = await htmlToPdf("<p>one</p>", { browser });
    const second = await htmlToPdf("<p>two</p>", { browser, inspectFit: true });
    assert.ok(first.length > 0);
    assert.ok(second.pdf.length > 0);
    assert.deepEqual(second.fitProblems, []);
    assert.ok(browser.connected, "the shared browser should survive both prints");
  } finally {
    await browser.close();
  }
});

test("the renderer pin is a real version and ensure-chrome downloads exactly it", () => {
  // Two machines printing through two Chrome releases wrap the same sentence
  // differently, and millimetres matter here - so the download is pinned, and
  // this guard fails if the pin decays into "stable" again or the two files
  // stop sharing one constant.
  assert.match(
    PINNED_CHROME_VERSION,
    /^\d+\.\d+\.\d+\.\d+$/,
    "PINNED_CHROME_VERSION must be a full four-part build, not a channel name"
  );
  const src = fs.readFileSync(
    path.join(__dirname, "..", "scripts", "ensure-chrome.js"),
    "utf8"
  );
  assert.ok(
    src.includes("chrome-headless-shell@${PINNED_CHROME_VERSION}"),
    "ensure-chrome.js no longer downloads the pinned build from src/chrome.js"
  );
});

test("a full-page data table can use the available height for every supplied row", async () => {
  // Found on an answers page whose final row was present in the JSON and HTML
  // but absent from the PDF. The one full-page zone stopped at the table's
  // arithmetic estimate, even though the browser wrapped the long answers
  // taller and more than half a page remained genuinely available below it.
  const rows = [
    ["Fluency 1", "1,336"],
    ["Fluency 2", "4,562"],
    ["Fluency 3", "3,785"],
    ["Fluency 4", "9,141"],
    ["Fluency 5", "2,990"],
    ["Fluency 6", "7,030"],
    [
      "Reasoning 1",
      "Answers will vary. For example, 3,240 + 10 = 3,250 changes only the tens digit. " +
        "3,290 + 10 = 3,300 changes the tens and hundreds digits. The ones digit stays " +
        "the same in both.",
    ],
    [
      "Reasoning 2",
      "Yes. 4,940 + 100 = 5,040 and 5,140 - 100 = 5,040. The tens and ones digits " +
        "stay the same in both calculations.",
    ],
    [
      "Reasoning 3",
      "Yes. 5,980 + 10 = 5,990, then 5,990 - 100 = 5,890. Leah's answer is correct.",
    ],
  ];

  const html = renderSheet({
    title: "Answers",
    layout: "full",
    orientation: "portrait",
    zones: {
      a: {
        stack: [
          { helper: "section-label", text: "Answers" },
          { helper: "data-table", columns: ["Question", "Answer"], rows },
        ],
      },
    },
  });

  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const bounds = await page.evaluate(() => {
      const zone = document.querySelector(".zone");
      const tableRows = [...document.querySelectorAll(".h-data tbody tr")];
      const last = tableRows.at(-1);
      const zoneBox = zone.getBoundingClientRect();
      const tableBox = document.querySelector(".h-data").getBoundingClientRect();
      const lastBox = last.getBoundingClientRect();
      return {
        count: tableRows.length,
        lastLabel: last.cells[0].textContent,
        lastBottom: lastBox.bottom,
        tableBottom: tableBox.bottom,
        zoneBottom: zoneBox.bottom,
      };
    });

    assert.equal(bounds.count, rows.length);
    assert.equal(bounds.lastLabel, "Reasoning 3");
    assert.ok(
      bounds.lastBottom <= bounds.zoneBottom + 1,
      `the final row ends at ${bounds.lastBottom}px, below the zone at ${bounds.zoneBottom}px`
    );
    assert.ok(
      Math.abs(bounds.zoneBottom - bounds.tableBottom) <= 1,
      `the table ends at ${bounds.tableBottom}px, leaving the zone blank to ${bounds.zoneBottom}px`
    );
  } finally {
    await browser.close();
  }
});

test("pupil PDF and complete teacher answers build as separate files", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worksheet-audience-"));
  const specPath = path.join(dir, "worksheet.json");
  const pupilSheet = (question) => ({
    layout: "full",
    orientation: "portrait",
    zones: {
      a: {
        question: true,
        helper: "questions",
        items: [question],
      },
    },
  });
  const spec = {
    meta: {
      lesson: "Multiply by 3",
      lo: "Multiply by 3.",
      yearGroup: 4,
      subject: "Maths",
    },
    sheets: {
      below: pupilSheet("What is 4 x 3?"),
      expected: pupilSheet("What is 6 x 3?"),
      greaterDepth: pupilSheet("Write a multiplication with an answer of 24."),
    },
    answerKey: {
      below: [{ question: 1, answer: "12" }],
      expected: [{ question: 1, answer: "18" }],
      greaterDepth: [
        { question: 1, answer: "Answers vary; for example, 8 x 3 = 24." },
      ],
    },
  };
  fs.writeFileSync(specPath, JSON.stringify(spec));

  try {
    execFileSync(
      process.execPath,
      [
        path.join(__dirname, "..", "scripts", "build-worksheet.js"),
        specPath,
        dir,
        "Multiply by 3 - Worksheets",
      ],
      { encoding: "utf8" }
    );

    const pupilPdf = path.join(dir, "Multiply by 3 - Worksheets.pdf");
    const answersTxt = path.join(dir, "Multiply by 3 - Answers.txt");
    assert.ok(fs.existsSync(pupilPdf), "pupil PDF was not written");
    assert.ok(fs.existsSync(answersTxt), "separate teacher answer key was not written");

    const doc = await PDFDocument.load(fs.readFileSync(pupilPdf));
    assert.equal(doc.getPageCount(), 3, "the pupil PDF should contain exactly three sheets");

    const answers = fs.readFileSync(answersTxt, "utf8");
    assert.match(answers, /BELOW \(SHEET A\)[\s\S]*\(1\) 12/);
    assert.match(answers, /EXPECTED \(SHEET B\)[\s\S]*\(1\) 18/);
    assert.match(
      answers,
      /GREATER DEPTH \(SHEET C\)[\s\S]*Answers vary; for example/
    );
    assert.equal(
      fs.existsSync(path.join(dir, "Multiply by 3 - Worksheets-answers.html")),
      false,
      "an answer page was still emitted beside the pupil sheets"
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── what the rendered-fit probe counts as clipped ───────────────────────
//
// The probe is the last thing standing between a clipped worksheet and a class,
// so it has to be right in both directions. It used to compare EVERY descendant
// box against the zone, which condemned three sound worksheets over a bar chart
// title whose SVG text box reached 2px above its own visible ink - nothing was
// cut, and the sheets were refused anyway.

const ZONE_STYLE =
  "position:absolute;left:0;top:0;width:60mm;height:30mm;overflow:hidden;";

const probe = async (inner) => {
  const { fitProblems } = await htmlToPdf(
    `<div data-worksheet-zone="a" style="${ZONE_STYLE}">${inner}</div>`,
    { inspectFit: true }
  );
  return fitProblems;
};

test("a drawing whose inner shapes overshoot its own box is not called clipped", async () => {
  // The SVG's contents are clipped by its viewBox, not by the zone. A text node
  // reaching past the edge of the drawing is the drawing's business.
  const problems = await probe(
    `<svg width="100" height="40" viewBox="0 0 100 40">
       <text x="0" y="-6" font-size="14">Books read this term</text>
     </svg>`
  );
  assert.deepEqual(problems, [], "an SVG's own inner geometry was reported as a clipped zone");
});

test("content that genuinely spills out of the zone is still reported", async () => {
  const problems = await probe(`<div style="height:80mm;">too tall</div>`);
  assert.ok(problems.length > 0, "content twice the height of its zone was passed as fitting");
});

test("a box that cuts off its own content is still reported", async () => {
  const problems = await probe(
    `<div style="height:10mm;overflow:hidden;"><div style="height:40mm;">cut</div></div>`
  );
  assert.ok(
    problems.some((p) => p.kind === "child-clipped"),
    `an inner box cutting its own content was not reported: ${JSON.stringify(problems)}`
  );
});

test("an ordinary zone with room to spare reports nothing", async () => {
  const problems = await probe(`<p style="margin:0;">A short question.</p>`);
  assert.deepEqual(problems, [], `a comfortable zone was reported as a problem: ${JSON.stringify(problems)}`);
});
