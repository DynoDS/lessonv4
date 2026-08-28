"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const { embedImage, resolveImages, naturalSize } = require("../src/images");
const { REGISTRY } = require("../src/helpers");

const PHOTO = path.join(__dirname, "photos", "sunflower.jpg");

// Reading a photograph's real size, and carrying it inside the worksheet.
//
// Both halves matter for the same reason: a labelled diagram places its dots as
// PERCENTAGES of the picture. Get the natural size wrong and the picture is the
// wrong shape, so every dot on it points at the wrong thing, on a page that
// looks completely normal.

test("a JPEG's real size is read from the file, not guessed", () => {
  const image = embedImage(PHOTO);
  assert.equal(image.width, 800);
  assert.equal(image.height, 1200);
});

test("the photo is carried INSIDE the worksheet, not linked to", () => {
  // The rule this protects: the HTML file IS the worksheet. Linked by path, it
  // goes blank the moment it is moved or emailed, and it does that silently:
  // the page still prints, the picture is simply not on it.
  const image = embedImage(PHOTO);
  assert.match(image.href, /^data:image\/jpeg;base64,/);
  assert.ok(image.href.length > 10000, "the data URI carries no actual image");
});

test("a JPEG's size is not read out of a Huffman table", () => {
  // The marker range 0xC0 to 0xCF looks like the start-of-frame markers, but
  // C4, C8 and CC are not: C4 is the Huffman table. Skipping that check reads
  // two arbitrary bytes of compression data as the picture's size.
  //
  // The file has to be BUILT for this. Written against the real photograph the
  // test passed whether the check was there or not, because that particular
  // JPEG happens to put its size before its tables: a test that agrees with
  // whatever the code does, which is the same problem in new clothes. So here
  // is a file with a Huffman table sitting deliberately in front of the size.
  const buf = Buffer.alloc(30, 0);
  buf.writeUInt16BE(0xffd8, 0); // start of image
  buf.writeUInt16BE(0xffc4, 2); // a Huffman table, NOT a size
  buf.writeUInt16BE(0x0006, 4); // its length, so a correct reader skips it
  buf.writeUInt32BE(0xaabbccdd, 6); // its payload: the numbers a bug would read
  buf.writeUInt16BE(0xffc0, 10); // the real start of frame
  buf.writeUInt16BE(0x0011, 12);
  buf.writeUInt8(8, 14);
  buf.writeUInt16BE(400, 15); // height
  buf.writeUInt16BE(600, 17); // width

  assert.deepEqual(
    naturalSize(buf, ".jpg"),
    { width: 600, height: 400 },
    "the size was read from the Huffman table instead of the frame header"
  );
});

test("a real photograph still reads correctly", () => {
  assert.deepEqual(naturalSize(fs.readFileSync(PHOTO), ".jpg"), {
    width: 800,
    height: 1200,
  });
});

test("a PNG's size is read from its header", () => {
  // Built here rather than shipped: a 1x1 PNG is small enough to write out and
  // it exercises the same code path as a photograph.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  assert.deepEqual(naturalSize(png, ".png"), { width: 1, height: 1 });
});

test("an SVG's size comes from its viewBox", () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"></svg>');
  assert.deepEqual(naturalSize(svg, ".svg"), { width: 640, height: 480 });
});

test("a missing picture is refused by name, not drawn as a blank", () => {
  // A sheet that quietly builds without its photograph is worse than one that
  // refuses: the refusal is seen, the blank is handed to a class.
  assert.throws(
    () => embedImage(path.join(__dirname, "photos", "not-a-real-photo.jpg")),
    (err) => {
      assert.match(err.message, /IMAGE_MISSING/);
      assert.match(err.message, /not-a-real-photo/);
      return true;
    }
  );
});

test("a picture whose size cannot be read is refused rather than guessed", () => {
  const junk = path.join(__dirname, "photos", "junk-for-test.png");
  fs.writeFileSync(junk, Buffer.from("this is not a png at all"));
  try {
    assert.throws(() => embedImage(junk), /IMAGE_SIZE/);
  } finally {
    fs.unlinkSync(junk);
  }
});

test("resolveImages walks a whole sheet and embeds every picture in it", () => {
  const spec = {
    layout: "halves-side",
    zones: {
      a: { helper: "label-diagram", imagePath: "photos/sunflower.jpg", labels: [] },
      b: { stack: [{ helper: "questions", items: ["How many?"] }] },
    },
  };
  const resolved = resolveImages(spec, __dirname);

  assert.match(resolved.zones.a.imageHref, /^data:image\/jpeg;base64,/);
  assert.equal(resolved.zones.a.imageWidth, 800);
  assert.equal(resolved.zones.a.imageHeight, 1200);
  // Everything else travels through untouched.
  assert.deepEqual(resolved.zones.b.stack[0].items, ["How many?"]);
  // And the original is not mutated, so a spec can be reused.
  assert.equal(spec.zones.a.imageHref, undefined);
});

test("a size the designer stated themselves is not overruled", () => {
  const resolved = resolveImages(
    { helper: "label-diagram", imagePath: "photos/sunflower.jpg", imageWidth: 400 },
    __dirname
  );
  assert.equal(resolved.imageWidth, 400, "the stated width was overwritten");
  assert.equal(resolved.imageHeight, 1200, "the missing height was still filled in");
});

// ─── what the picture's size lets the diagram do ─────────────────────────

test("a labelled diagram's size follows its labels, not a fixed number", () => {
  // Daniel asked whether this could be a quarter page. It could not: the
  // minimum was a flat 120mm whatever the diagram held, which made it a
  // whole-page object by decree. Two things really drive it, and both are in
  // the content: the label bands either side are sized to the longest word,
  // and the labels stack down the sides so more of them cost height.
  const of = (labels) => ({
    helper: "label-diagram",
    imageHref: "data:image/png;base64,x",
    imageWidth: 800,
    imageHeight: 1200,
    labels,
  });

  const twoShort = of([
    { anchor: [22, 33], label: "petal" },
    { anchor: [54, 75], label: "stem" },
  ]);
  const twoLong = of([
    { anchor: [22, 33], label: "photosynthesis happens here" },
    { anchor: [54, 75], label: "stem" },
  ]);
  const sixShort = of(
    ["petal", "stem", "leaf", "roots", "bud", "seed"].map((label, i) => ({
      anchor: [i % 2 ? 60 : 30, 20 + i * 10],
      label,
    }))
  );

  const needs = (s) => REGISTRY["label-diagram"].needs(s);

  assert.ok(
    needs(twoShort).minWidthMm <= 84,
    `a two-label diagram wants ${Math.round(needs(twoShort).minWidthMm)}mm, so it still cannot be a quarter page`
  );
  assert.ok(
    needs(twoLong).minWidthMm > needs(twoShort).minWidthMm,
    "a long label must widen the band it sits in"
  );
  assert.ok(
    needs(sixShort).minHeightMm > needs(twoShort).minHeightMm,
    "more labels stack down the sides and cost height"
  );
});

test("a write-on line is long enough for a child to write the word on", () => {
  // The quiet one. On a worksheet almost every label is BLANK, and a blank
  // callout carries no type at all, so the engine's legibility floor finds
  // nothing to measure and stays silent. This minimum is the only thing between
  // a child and a 14mm line to write "roots" on.
  const of = (label) => ({
    helper: "label-diagram",
    imageHref: "data:image/png;base64,x",
    imageWidth: 800,
    imageHeight: 1200,
    labels: [{ anchor: [30, 30], label }],
  });

  const MM_PER_CHAR = 3.2; // primary handwriting, not print
  for (const label of ["stem", "roots", "petal"]) {
    const { minWidthMm } = REGISTRY["label-diagram"].needs(of(label));
    // The two bands together are what is left once the picture has its share.
    const bandsMm = minWidthMm - 44;
    assert.ok(
      bandsMm / 2 >= label.length * MM_PER_CHAR - 0.01,
      `"${label}" gets a ${(bandsMm / 2).toFixed(0)}mm line, which is under ${MM_PER_CHAR}mm a letter`
    );
  }
});
