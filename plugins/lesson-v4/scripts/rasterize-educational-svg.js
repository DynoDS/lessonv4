#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const requireGlobal = require('../builder/src/require-global');

const TILE = 256;
const COLUMNS = 4;
const PADDING = 8;

function usage() {
  console.error('Usage: node rasterize-educational-svg.js <source.svg> <output.png> [colour]');
  console.error('       node rasterize-educational-svg.js --sheet <output.png> <source.svg> [source.svg ...] [--colour #1F2937]');
  process.exit(1);
}

function prepare(sourcePath, colour) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  if (!/<svg\b/i.test(source)) {
    throw new Error(`Source file is not an SVG: ${sourcePath}`);
  }
  return Buffer.from(source.replace(/currentColor/gi, colour));
}

function checkColour(colour) {
  if (!/^#[0-9a-f]{6}$/i.test(colour)) {
    throw new Error('Colour must be a six-digit hex value such as #1F2937.');
  }
  return colour;
}

async function renderOne(sharp, sourcePath, outputPath, colour) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(prepare(sourcePath, colour), { density: 288 })
    .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`Wrote: ${outputPath}`);
}

function cellFrame(index) {
  // A number and a hairline box per cell, so a reader can say "the third one"
  // and mean the same drawing the index line names.
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}">` +
      `<rect x="0.5" y="0.5" width="${TILE - 1}" height="${TILE - 1}" fill="none" stroke="#C7CDD4"/>` +
      `<text x="8" y="26" font-family="Verdana,DejaVu Sans,sans-serif" font-size="20" fill="#6B7280">${index}</text>` +
      `</svg>`
  );
}

async function renderSheet(sharp, sourcePaths, outputPath, colour) {
  // One picture to look at instead of one per candidate. Choosing a drawing
  // means comparing it with the alternatives, and comparing is what a single
  // sheet actually supports; separate files make it a memory exercise and cost
  // a separate look every time.
  const columns = Math.min(COLUMNS, sourcePaths.length);
  const rows = Math.ceil(sourcePaths.length / columns);
  const width = columns * TILE + PADDING * (columns + 1);
  const height = rows * TILE + PADDING * (rows + 1);

  const composites = [];
  for (const [index, sourcePath] of sourcePaths.entries()) {
    const drawing = await sharp(prepare(sourcePath, colour), { density: 288 })
      .resize({
        width: TILE - PADDING * 2,
        height: TILE - PADDING * 2,
        fit: 'inside',
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = PADDING + column * (TILE + PADDING);
    const top = PADDING + row * (TILE + PADDING);

    composites.push({ input: cellFrame(index + 1), left, top });
    composites.push({ input: drawing, left: left + PADDING, top: top + PADDING });
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Wrote: ${outputPath}`);
  sourcePaths.forEach((sourcePath, index) => {
    console.log(`${index + 1}: ${sourcePath}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();

  const sharp = requireGlobal('sharp');

  if (args[0] === '--sheet') {
    const rest = args.slice(1);
    let colour = '#1F2937';
    const positional = [];
    for (let index = 0; index < rest.length; index += 1) {
      if (rest[index] === '--colour') {
        colour = String(rest[index + 1] || '').trim();
        index += 1;
        continue;
      }
      positional.push(rest[index]);
    }
    checkColour(colour);

    const [outputArg, ...sourceArgs] = positional;
    if (!outputArg || !sourceArgs.length) usage();
    if (sourceArgs.length > 30) {
      throw new Error('A preview sheet takes at most 30 drawings.');
    }

    const sourcePaths = sourceArgs.map((value) => {
      const resolved = path.resolve(value);
      if (!fs.existsSync(resolved)) {
        throw new Error(`Source SVG not found: ${resolved}`);
      }
      return resolved;
    });

    await renderSheet(sharp, sourcePaths, path.resolve(outputArg), colour);
    return;
  }

  const sourcePath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);
  const colour = checkColour(String(args[2] || '#1F2937').trim());

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source SVG not found: ${sourcePath}`);
  }

  await renderOne(sharp, sourcePath, outputPath, colour);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
