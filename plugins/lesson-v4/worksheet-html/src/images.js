"use strict";

// Putting a real photograph into a worksheet.
//
// The rule this exists to keep: THE HTML FILE IS THE WORKSHEET. It is
// self-contained, it opens with a double click, and a scheduled cloud job can
// write one on a machine with no browser and no way to check it. A sheet that
// referenced a photo by path would be a sheet that goes blank the moment it is
// moved, emailed or opened from a different folder, and it would do that
// silently: the page still prints, the picture is simply not on it.
//
// So a photo is read off disk and carried INSIDE the file as a data URI. The
// cost is file size, which is the cheap side of that trade.
//
// The natural pixel size is read from the file's own header rather than from a
// library, because a labelled diagram's geometry needs the real aspect and
// getting it wrong stretches the picture. Three formats cover everything
// image-scout fetches: PNG, JPEG and SVG.

const fs = require("node:fs");
const path = require("node:path");

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function pngSize(buf) {
  // Signature, then the IHDR chunk: width and height are big-endian 32-bit at
  // bytes 16 and 20.
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // The start-of-frame markers carry the size. C4, C8 and CC look like SOF
    // markers and are not: skipping that check reads the size out of a Huffman
    // table and stretches the picture.
    const isSOF =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const segment = buf.readUInt16BE(i + 2);
    if (segment < 2) return null;
    i += 2 + segment;
  }
  return null;
}

function svgSize(buf) {
  const text = buf.toString("utf8", 0, Math.min(buf.length, 4096));
  const viewBox = /viewBox\s*=\s*"([^"]+)"/.exec(text);
  if (viewBox) {
    const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const w = /\bwidth\s*=\s*"([\d.]+)/.exec(text);
  const h = /\bheight\s*=\s*"([\d.]+)/.exec(text);
  if (w && h) return { width: Number(w[1]), height: Number(h[1]) };
  return null;
}

function naturalSize(buf, ext) {
  if (ext === ".png") return pngSize(buf);
  if (ext === ".jpg" || ext === ".jpeg") return jpegSize(buf);
  if (ext === ".svg") return svgSize(buf);
  return null;
}

// Read one image and return it ready to drop into a spec.
function embedImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext];
  if (!mime) {
    throw new Error(
      `IMAGE_FORMAT: "${filePath}" is a ${ext || "(no extension)"} file. ` +
        `Known: ${Object.keys(MIME).join(", ")}.`
    );
  }

  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (err) {
    throw new Error(
      `IMAGE_MISSING: no file at "${filePath}". A labelled diagram needs its ` +
        `picture on disk before the sheet is built.`
    );
  }

  const size = naturalSize(buf, ext);
  if (!size || !size.width || !size.height) {
    // Refused rather than guessed. A wrong aspect does not look like an error:
    // the photo is simply the wrong shape, and every dot on it is in the wrong
    // place because the dots are percentages of the picture.
    throw new Error(
      `IMAGE_SIZE: could not read the natural size of "${filePath}". ` +
        `A labelled diagram places its dots as percentages of the picture, so ` +
        `a guessed size puts every dot in the wrong place.`
    );
  }

  return {
    href: `data:${mime};base64,${buf.toString("base64")}`,
    width: size.width,
    height: size.height,
  };
}

// Walk a sheet spec and turn every `imagePath` into an embedded picture.
//
// `imagePath` is the field the rest of the pipeline already writes: it is what
// image-scout saves and what the diagram-anchor agent reads when it moves the
// dots onto the real features. Keeping the same name means a worksheet spec can
// go through the anchoring step unchanged.
//
// `problems` is an optional array. Without it the first unreadable picture
// throws, which is right for a caller that only needs to know the spec is not
// buildable. With it, every unreadable picture is recorded and the walk carries
// on, so a build names all of them in one failure.
//
// That difference decided a lesson. A sheet naming three pictures that were
// never sourced reported the first, a repair round removed it, the rebuild
// reported the second, and the run's one allowed repair was already spent: no
// worksheet, no answer key. The faults were all present at the first build and
// nothing but the reporting stopped them being fixed together.
function resolveImages(node, baseDir, problems) {
  if (Array.isArray(node)) {
    return node.map((item) => resolveImages(item, baseDir, problems));
  }
  if (!node || typeof node !== "object") return node;

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = resolveImages(value, baseDir, problems);
  }

  if (typeof out.imagePath === "string" && !out.imageHref) {
    const resolved = path.isAbsolute(out.imagePath)
      ? out.imagePath
      : path.join(baseDir, out.imagePath);
    let image;
    try {
      image = embedImage(resolved);
    } catch (err) {
      // An Educational SVG context icon is optional. A missing local file falls back to
      // the complete emoji set or to no pictures; required photographs and
      // labelled diagrams still fail loudly through the normal path.
      if (out.kind === "educational-svg" && /^IMAGE_MISSING:/.test(String(err.message || err))) {
        return out;
      }
      if (Array.isArray(problems)) {
        const message = String((err && err.message) || err);
        const named = /^([A-Z_]{3,}):\s*([\s\S]*)$/.exec(message);
        problems.push({
          imagePath: out.imagePath,
          signal: named ? named[1] : "IMAGE_MISSING",
          message: named ? named[2].replace(/\s+/g, " ").trim() : message,
        });
        // Left unresolved on purpose: `imagePath` with no `imageHref` is what
        // the build already walks for to name the sheet and zone each fault
        // sits in.
        return out;
      }
      throw err;
    }
    out.imageHref = image.href;
    // Only filled in when the spec has not stated them. A designer who has
    // measured the picture themselves is not overruled.
    if (out.imageWidth === undefined) out.imageWidth = image.width;
    if (out.imageHeight === undefined) out.imageHeight = image.height;
  }

  return out;
}

module.exports = { embedImage, resolveImages, naturalSize };
