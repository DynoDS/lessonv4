"use strict";

// A picture in the stick-in pack prints a few centimetres across and is
// repeated on every copy of a class set, so a photograph embedded at its file
// size is paid for thirty times over. A history sort with seven photographs
// made a 151 MB page, and a geography sheet with one 6.4 MB photograph a 136 MB
// one; neither finished printing (7 October 2026). Every piece now brings its
// picture down to print size before embedding it. A small file, and a drawing
// (SVG), go in as they are.

const fs = require("fs");
const path = require("path");

const PRINT_PICTURE_MAX_PX = 1600;
const PRINT_PICTURE_SMALL_BYTES = 250 * 1024;

function mimeFor(file, fallback) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return fallback || "image/jpeg";
}

function leaveAlone(file, raw) {
  return raw.length <= PRINT_PICTURE_SMALL_BYTES || mimeFor(file) === "image/svg+xml";
}

// For the pieces that are already drawn asynchronously.
async function printSized(file, mime) {
  const raw = fs.readFileSync(file);
  const asIs = { mime: mime || mimeFor(file), base64: raw.toString("base64") };
  if (leaveAlone(file, raw)) return asIs;
  try {
    const sharp = require("sharp");
    const picture = sharp(file).rotate();
    const meta = await picture.metadata();
    const sized = picture.resize({
      width: PRINT_PICTURE_MAX_PX, height: PRINT_PICTURE_MAX_PX, fit: "inside", withoutEnlargement: true,
    });
    const buffer = meta.hasAlpha ? await sized.png().toBuffer() : await sized.jpeg({ quality: 82 }).toBuffer();
    if (buffer.length >= raw.length) return asIs;
    return { mime: meta.hasAlpha ? "image/png" : "image/jpeg", base64: buffer.toString("base64") };
  } catch (error) {
    // The picture still prints, at its file size, if it cannot be resized.
    return asIs;
  }
}

// For validation that runs synchronously: the resize runs in a child process.
const sizedUris = new Map();

function printSizedDataUriSync(file, mime) {
  if (sizedUris.has(file)) return sizedUris.get(file);
  const raw = fs.readFileSync(file);
  let uri = `data:${mime || mimeFor(file)};base64,${raw.toString("base64")}`;
  if (!leaveAlone(file, raw)) {
    try {
      const out = require("child_process").execFileSync(
        process.execPath, [path.join(__dirname, "print-size-picture.js"), file, String(PRINT_PICTURE_MAX_PX)],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
      );
      const cut = out.indexOf("\n");
      const sized = out.slice(cut + 1);
      if (cut > 0 && sized.length && sized.length < raw.length * 1.34) {
        uri = `data:${out.slice(0, cut)};base64,${sized}`;
      }
    } catch (error) {
      // As above: the file's own size is the fallback.
    }
  }
  sizedUris.set(file, uri);
  return uri;
}

module.exports = { printSized, printSizedDataUriSync, PRINT_PICTURE_MAX_PX };
