"use strict";

// Choosing a drawing means comparing it against its alternatives, and every
// candidate used to be rendered to its own file and looked at on its own. That
// made each comparison a memory exercise and cost one look per drawing, which
// is the cost that kept the optional layer down to one or two pictures in a
// whole deck. One numbered sheet turns a deck's worth of choices into a couple
// of looks, which is what makes varying the pictures across a deck affordable.

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const SCRIPT = path.join(__dirname, "..", "scripts", "rasterize-educational-svg.js");

const SVGS = {
  square: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M1 1h8v8H1z" fill="currentColor"/></svg>',
  circle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor"/></svg>',
  wide: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 10"><rect x="1" y="3" width="38" height="4" fill="currentColor"/></svg>',
};

function scratch() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "lr-educational-svg-preview-"));
}

function writeSvgs(dir, names) {
  return names.map((name) => {
    const file = path.join(dir, `${name}.svg`);
    fs.writeFileSync(file, SVGS[name] || SVGS.square);
    return file;
  });
}

function run(args) {
  return execFileSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
}

test("a sheet holds every candidate and numbers them in reading order", () => {
  const dir = scratch();
  const sources = writeSvgs(dir, ["square", "circle", "wide"]);
  const sheet = path.join(dir, "preview.png");

  const output = run(["--sheet", sheet, ...sources]);

  assert.ok(fs.existsSync(sheet));
  const lines = output.trim().split(/\r?\n/);
  assert.match(lines[0], /^Wrote: /);
  sources.forEach((source, index) => {
    assert.equal(lines[index + 1], `${index + 1}: ${source}`);
  });
});

test("the sheet grows a row rather than a longer line", () => {
  const dir = scratch();
  const many = writeSvgs(dir, ["square", "circle", "wide", "square", "circle"]);
  const five = path.join(dir, "five.png");
  const three = path.join(dir, "three.png");

  run(["--sheet", five, ...many]);
  run(["--sheet", three, ...many.slice(0, 3)]);

  const sharp = require(path.join(__dirname, "..", "builder", "src", "require-global"))("sharp");
  return Promise.all([sharp(five).metadata(), sharp(three).metadata()]).then(
    ([fiveMeta, threeMeta]) => {
      // Five wraps onto a second row: taller than three, never five times wider.
      assert.ok(fiveMeta.height > threeMeta.height);
      assert.ok(fiveMeta.width <= threeMeta.width * 2);
    }
  );
});

test("one drawing on its own still renders the old way", () => {
  const dir = scratch();
  const [source] = writeSvgs(dir, ["square"]);
  const output = path.join(dir, "one.png");

  run([source, output]);

  assert.ok(fs.existsSync(output));
});

test("a drawing that is not there stops the sheet naming the file", () => {
  const dir = scratch();
  const [real] = writeSvgs(dir, ["square"]);
  const missing = path.join(dir, "absent.svg");

  assert.throws(
    () => run(["--sheet", path.join(dir, "sheet.png"), real, missing]),
    (error) => error.stderr.includes(missing)
  );
});

test("a colour applies across the whole sheet", () => {
  const dir = scratch();
  const sources = writeSvgs(dir, ["square", "circle"]);
  const sheet = path.join(dir, "coloured.png");

  run(["--sheet", sheet, ...sources, "--colour", "#B00020"]);

  assert.ok(fs.existsSync(sheet));
});

test("a bad colour is refused rather than quietly ignored", () => {
  const dir = scratch();
  const sources = writeSvgs(dir, ["square"]);

  assert.throws(
    () => run(["--sheet", path.join(dir, "sheet.png"), ...sources, "--colour", "red"]),
    (error) => error.stderr.includes("six-digit hex")
  );
});

test("the reference sends designers to the sheet, not to one file each", () => {
  const reference = fs.readFileSync(
    path.join(__dirname, "..", "references", "context-pictures.md"),
    "utf8"
  );
  assert.ok(reference.includes("--sheet"));
  assert.ok(reference.includes("Candidates for several requests may share one sheet"));
});
