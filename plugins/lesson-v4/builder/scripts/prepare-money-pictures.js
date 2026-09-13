#!/usr/bin/env node
'use strict';

// Make the coin and note pictures every surface places.
//
//   node builder/scripts/prepare-money-pictures.js
//
// The stock pictures in builder/assets/money are photographs of the real Royal
// Mint designs, about 3,000 pixels across and 1 to 4MB each, with a wide
// transparent border. Until 13 September 2026 only the board placed them, after
// trimming each one on the fly into a cache; the worksheet drew its own coins in
// SVG because "a page of base64 coins is not a page anyone wants to print", so a
// child met real coins on the slide and cartoon ones on the sheet. Now one
// drawing (shared/visuals/money-svg.js) places the real pictures on every
// surface, and a drawing has to be made synchronously, so the pictures it places
// are made once, here, and shipped: trimmed to the coin, 500 pixels at most (the
// size the board's cache always used, about 290 dots per inch for a life-size
// coin on paper), and stored as palette PNG, which keeps the transparency and
// comes to about a sixth of the size of a full-colour one.
//
// Run it again only when a stock picture changes.

const fs = require('fs');
const path = require('path');
const requireGlobal = require('../src/require-global');

const ASSET_DIR = path.resolve(__dirname, '..', 'assets', 'money');
const OUT_DIR = path.join(ASSET_DIR, 'placed');
const TRIM_THRESHOLD = 10;
const MAX_DIMENSION = 500;

async function main() {
  const sharp = requireGlobal('sharp');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(ASSET_DIR).filter((f) => f.endsWith('.png'));
  for (const file of files) {
    const out = path.join(OUT_DIR, file);
    await sharp(path.join(ASSET_DIR, file))
      .trim({ threshold: TRIM_THRESHOLD })
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .png({ palette: true, quality: 95, compressionLevel: 9, effort: 10 })
      .toFile(out);
    console.log(`${file}: ${fs.statSync(out).size} bytes`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
