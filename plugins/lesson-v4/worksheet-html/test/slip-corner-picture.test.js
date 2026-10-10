"use strict";

// A small picture in the corner of a question slip.
//
// Daniel, 10 October 2026, looking at a Year 5 day and night slip with and
// without a picture: the plain slip "is absolutely fine", the picture "does
// make the stick-in sheet look a bit nicer", and it "doesn't actually need to
// be that size". So a books sheet may name one picture the lesson already has
// (`slipPicture`), and it is held to being decoration: small, in the corner,
// over nothing, never worth paper, and never a reason to lose a sheet.

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  recordingProblems,
  slipPictureOf,
  slipContentOf,
  slipNodesFor,
  renderSlipsPage,
  buildSlips,
} = require("../src/slips");
const { resolveImages } = require("../src/images");
const { sheetsOf } = require("../src/worksheet");

const BOOKS_OR_SHEET = fs.readFileSync(path.join(__dirname, "..", "..", "references", "books-or-sheet.md"), "utf8");
const OUTPUT_TEMPLATE = fs.readFileSync(path.join(__dirname, "..", "..", "references", "output-template.md"), "utf8");

function worksheet(slipPicture) {
  return {
    meta: { lesson: "Day and night", yearGroup: 5 },
    sheets: {
      expected: {
        recording: "books",
        recordingReason: "One written explanation, answered in the book.",
        layout: "auto",
        ...(slipPicture === undefined ? {} : { slipPicture }),
        zones: [
          {
            question: true,
            stack: [
              { helper: "written-answers", items: [{ text: "Why does it get dark every night?", lines: 4 }] },
              { helper: "chip-bank", text: "Words you could use:", chips: ["rotates", "faces the Sun", "so"] },
            ],
          },
        ],
      },
    },
  };
}

const drawn = (spec) => sheetsOf(spec)[0].spec;
const PICTURE = { imagePath: "globe.jpg", imageHref: "data:image/png;base64,AAAA", imageWidth: 300, imageHeight: 200 };

test("the picture's longer side is 22mm and its shape is its own", () => {
  const wide = slipPictureOf({ slipPicture: PICTURE });
  assert.equal(wide.widthMm, 22);
  assert.ok(Math.abs(wide.heightMm - 22 * (200 / 300)) < 0.01);
  const tall = slipPictureOf({ slipPicture: { ...PICTURE, imageWidth: 200, imageHeight: 400 } });
  assert.equal(Math.round(tall.heightMm), 22);
  assert.equal(Math.round(tall.widthMm), 11);
});

test("a sheet with no slipPicture draws exactly the slips it always did", () => {
  const spec = drawn(worksheet());
  assert.equal(spec.slipPicture, null);
  const nodes = slipNodesFor(slipContentOf(spec), 2);
  const html = renderSlipsPage({ nodes, cols: 2, rows: 4, code: "E", title: "t", slipMm: 56 });
  assert.doesNotMatch(html, /<img class="slip-picture"/);
  assert.doesNotMatch(html, /class="slip-item[^"]*slip-item--beside-picture/);
});

test("the picture is drawn once on every slip, and the last part makes room beside it", () => {
  const spec = drawn(worksheet(PICTURE));
  const picture = slipPictureOf(spec);
  const nodes = slipNodesFor(slipContentOf(spec), 2);
  const html = renderSlipsPage({ nodes, cols: 2, rows: 4, code: "E", title: "t", slipMm: 70, picture });
  assert.equal((html.match(/<img class="slip-picture"/g) || []).length, 8);
  assert.equal((html.match(/class="slip-item slip-item--beside-picture"/g) || []).length, 8);
  assert.match(html, /--slip-picture-room:25\.00mm/);
  // No frame round it (Daniel, 10 October 2026).
  assert.doesNotMatch(/\.slip-picture \{[^}]*\}/.exec(html)[0].replace(/\/\*[\s\S]*?\*\//g, ""), /border/);
  // The room is taken from the part beside the picture, and that part is never
  // shorter than the picture, so the picture sits over nothing.
  assert.match(html, /\.slip-item--beside-picture-whole \{[^}]*padding-right: var\(--slip-picture-room\);[^}]*min-height: var\(--slip-picture-h\);/);
});

test("a wrongly shaped slipPicture is named at the preflight; a right one is not", () => {
  assert.deepEqual(recordingProblems(worksheet({ imagePath: "globe.jpg" })), []);
  for (const wrong of ["globe.jpg", { imagePath: "" }, { imagePath: "globe.jpg", widthMm: 60 }]) {
    const problems = recordingProblems(worksheet(wrong));
    assert.equal(problems.length, 1, JSON.stringify(wrong));
    assert.equal(problems[0].signal, "SLIP_PICTURE_INVALID");
  }
});

test("a picture file that cannot be read is never a fault of the sheet", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slip-picture-"));
  const problems = [];
  const resolved = resolveImages(worksheet({ imagePath: "not-there.jpg" }), dir, problems);
  assert.deepEqual(problems, []);
  assert.equal(resolved.sheets.expected.slipPicture.imageHref, undefined);
});

test("where the page cannot be drawn to check it, the picture is left off and the slips stand", async () => {
  const plain = await buildSlips({ sheetSpec: drawn(worksheet()), title: "t" });
  const asked = await buildSlips({ sheetSpec: drawn(worksheet(PICTURE)), title: "t" });
  assert.equal(asked.html, plain.html);
  assert.equal(asked.rows, plain.rows);
  assert.match(asked.pictureLeftOff, /could not draw the page/);
  assert.equal(asked.picture, undefined);
});

test("a picture whose file was lost is left off with that reason", async () => {
  const asked = await buildSlips({ sheetSpec: drawn(worksheet({ imagePath: "not-there.jpg" })), title: "t" });
  assert.match(asked.pictureLeftOff, /could not be read/);
  assert.doesNotMatch(asked.html, /slip-picture"/);
});

test("the designers are told what it is for and where it stops", () => {
  const flat = BOOKS_OR_SHEET.replace(/\s+/g, " ");
  assert.match(flat, /## A small picture in the corner of a slip: `slipPicture`/);
  assert.match(flat, /It is decoration, and that sets its limits\./);
  assert.match(flat, /never ask for a new picture for this/);
  assert.match(flat, /A picture the child reads an answer from, counts in or labels is part of a question\./);
  assert.match(flat, /SLIP_PICTURE_LEFT_OFF:/);
  assert.match(OUTPUT_TEMPLATE, /`use` told the picture finder which surface to judge the picture for; it is not a permission\./);
});
