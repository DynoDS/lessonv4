#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const requireGlobal = require('../builder/src/require-global');

function usage() {
  console.error('Usage: node rasterize-educational-svg.js <source.svg> <output.png> [colour]');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();

  const sourcePath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);
  const colour = String(args[2] || '#1F2937').trim();

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source SVG not found: ${sourcePath}`);
  }
  if (!/^#[0-9a-f]{6}$/i.test(colour)) {
    throw new Error('Colour must be a six-digit hex value such as #1F2937.');
  }

  const source = fs.readFileSync(sourcePath, 'utf8');
  if (!/<svg\b/i.test(source)) {
    throw new Error(`Source file is not an SVG: ${sourcePath}`);
  }

  const prepared = source.replace(/currentColor/gi, colour);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const sharp = requireGlobal('sharp');
  await sharp(Buffer.from(prepared), { density: 288 })
    .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Wrote: ${outputPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
