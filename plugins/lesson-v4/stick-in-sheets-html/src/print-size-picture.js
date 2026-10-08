#!/usr/bin/env node
"use strict";

// Brings one picture down to the size it prints at and writes it to stdout as
// a media type, a line break, then the picture in base64. Run as a child
// process by render-card-set.js, whose validation is synchronous.
//
//   node print-size-picture.js <picture> <longest side in pixels>

const sharp = require("sharp");

async function main() {
  const [, , file, max] = process.argv;
  const side = Number(max);
  const picture = sharp(file).rotate();
  const meta = await picture.metadata();
  const sized = picture.resize({ width: side, height: side, fit: "inside", withoutEnlargement: true });
  // A picture with see-through parts keeps them; a photograph prints as JPEG.
  const buffer = meta.hasAlpha ? await sized.png().toBuffer() : await sized.jpeg({ quality: 82 }).toBuffer();
  process.stdout.write(`${meta.hasAlpha ? "image/png" : "image/jpeg"}\n${buffer.toString("base64")}`);
}

main().catch((error) => {
  process.stderr.write(String(error));
  process.exit(1);
});
