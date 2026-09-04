const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { renderPieceHtml } = require("../src/render-piece-html");

// The read-from piece: a printed copy of one source the child reads detail
// off. It has no write-on line, keeps the picture's own proportions, and is
// refused rather than cropped when it would not fit the page.

function svgFile(dir, name, w, h) {
  const file = path.join(dir, name);
  fs.writeFileSync(
    file,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#ccc"/></svg>`
  );
  return file;
}

function captureWarnings(fn) {
  const lines = [];
  const original = console.warn;
  console.warn = (msg) => lines.push(String(msg));
  return Promise.resolve()
    .then(fn)
    .then((result) => ({ result, lines }))
    .finally(() => { console.warn = original; });
}

test("a source copy prints the picture at book width with its caption beneath and no write-on line", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-source-"));
  svgFile(dir, "timetable.svg", 800, 452);
  const piece = await renderPieceHtml({
    visual: "source-copy",
    label: "Read the timetable",
    spec: { imagePath: "timetable.svg", caption: "Hampton School of Industry timetable, 1862" },
  }, { baseDir: dir });
  assert.ok(piece, "the piece should render");
  assert.strictEqual(piece.widthMm, 165, "defaults to the exercise-book width");
  // 165mm wide at 800:452 is ~93mm of picture plus a one-line caption band.
  assert.ok(piece.heightMm > 93 && piece.heightMm < 105, `height ${piece.heightMm}`);
  assert.ok(piece.html.includes("data:image/svg+xml;base64,"), "the picture is embedded");
  assert.ok(piece.html.includes("Hampton School of Industry timetable, 1862"), "the caption is printed");
  assert.ok(!piece.html.includes("border-bottom"), "a read-from piece carries no write-on line");
});

test("widthMm on the item or the spec overrides the default", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-source-"));
  svgFile(dir, "photo.svg", 400, 332);
  const onItem = await renderPieceHtml({ visual: "source-copy", widthMm: 120, spec: { imagePath: "photo.svg", caption: "Port Sunlight classroom, April 1897" } }, { baseDir: dir });
  const onSpec = await renderPieceHtml({ visual: "source-copy", spec: { imagePath: "photo.svg", caption: "Port Sunlight classroom, April 1897", widthMm: 100 } }, { baseDir: dir });
  assert.strictEqual(onItem.widthMm, 120);
  assert.strictEqual(onSpec.widthMm, 100);
});

test("a source copy with no file, no caption or no path is refused with a reason", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-source-"));
  svgFile(dir, "photo.svg", 400, 332);

  const noFile = await captureWarnings(() => renderPieceHtml({ visual: "source-copy", spec: { imagePath: "missing.jpg", caption: "A classroom" } }, { baseDir: dir }));
  assert.strictEqual(noFile.result, null);
  assert.match(noFile.lines.join("\n"), /image not found/);

  const noCaption = await captureWarnings(() => renderPieceHtml({ visual: "source-copy", spec: { imagePath: "photo.svg" } }, { baseDir: dir }));
  assert.strictEqual(noCaption.result, null);
  assert.match(noCaption.lines.join("\n"), /needs a caption/);

  const noPath = await captureWarnings(() => renderPieceHtml({ visual: "source-copy", spec: { caption: "A classroom" } }, { baseDir: dir }));
  assert.strictEqual(noPath.result, null);
  assert.match(noPath.lines.join("\n"), /needs imagePath/);
});

test("a source copy taller than the page is refused with the height named, never cropped", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-source-"));
  // A tall portrait document: 165mm wide would be 330mm tall.
  svgFile(dir, "letter.svg", 500, 1000);
  const tall = await captureWarnings(() => renderPieceHtml({ visual: "source-copy", spec: { imagePath: "letter.svg", caption: "Bridget Kelpin's statement" } }, { baseDir: dir }));
  assert.strictEqual(tall.result, null, "an over-tall copy must not render");
  const text = tall.lines.join("\n");
  assert.match(text, /\d+mm tall/, "the message names the height");
  assert.match(text, /at most 185mm/, "the message names the page limit");
  assert.match(text, /set widthMm to \d+ or less/, "the message names a width that fits");

  // The same document at a width that fits prints whole.
  const fits = await renderPieceHtml({ visual: "source-copy", widthMm: 80, spec: { imagePath: "letter.svg", caption: "Bridget Kelpin's statement" } }, { baseDir: dir });
  assert.ok(fits && fits.heightMm <= 185);
});
