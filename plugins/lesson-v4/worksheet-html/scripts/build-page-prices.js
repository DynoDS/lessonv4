#!/usr/bin/env node
"use strict";

// Write the engine's own page sizes and prices into the documents the
// designers plan from.
//
//   npm run page-prices            write them
//   npm run page-prices -- --check say what is out of date and change nothing
//
// The figures live in one place, src/page-figures.js, and are read from the
// engine and measured in the browser that prints the sheet. They used to be
// typed by hand into each document, and drifted (see that file). Run this
// after any change that moves a size: the page, the trim strip, a gap, a
// helper's drawing. test/page-figures.test.js fails until it has been run.
//
// The same sentences are stored word for word in the worksheets ledger's pins
// (scripts/tests/worksheets_ledger_pins.json), so the pins are rewritten with
// them: the pin still holds every word round the figure in place, and the
// figure itself is the engine's to state.

const fs = require("node:fs");
const path = require("node:path");
const {
  pageFigures,
  measurePrices,
  pageSentence,
  pricesSentence,
} = require("../src/page-figures");

const ROOT = path.join(__dirname, "..", "..");
const PINS = path.join(ROOT, "scripts", "tests", "worksheets_ledger_pins.json");

// Each place a figure is written: the words round it (any line breaks kept as
// they are) and what the engine says goes there.
function places(f, prices) {
  return [
    {
      file: "references/preferences.md",
      what: "the page a sheet is planned against",
      find: /That leaves (?:about )?\d+mm of stacked height in portrait,[^.]*?landscape(?:, and a sheet may be planned[^.]*?held back)?\./,
      write: () => pageSentence(f),
    },
    {
      file: "references/preferences.md",
      what: "the price list",
      find: /(?:Rough prices, measured from the built helpers|Prices, measured by the worksheet engine)[\s\S]*?that no single price shows\./,
      write: () => pricesSentence(prices, f),
    },
    {
      file: "references/preferences.md",
      what: "the width of one of two columns",
      find: /two items get (?:about )?\d+mm each/,
      write: () => `two items get ${f.portraitColumnMm}mm each`,
    },
    {
      file: "agents/adaptation-designer.md",
      what: "the page a sheet is planned against",
      find: /One A4 side gives (?:about )?\d+mm of stacked height(?: in portrait)?/,
      write: () => `One A4 side gives ${f.portrait.heightMm}mm of stacked height in portrait`,
    },
    {
      file: "references/lesson-designer-components.md",
      what: "the page a sheet is planned against",
      find: /One A4 side gives (?:about )?\d+mm of stacked height(?: in portrait)?/,
      write: () => `One A4 side gives ${f.portrait.heightMm}mm of stacked height in portrait`,
    },
    {
      file: "agents/worksheet-designer.md",
      what: "the page the refusal measures against",
      find: /a sheet's (?:zones get|work gets)(\s+)(?:about\s+)?\d+mm of height in portrait, and(\s+)\d+mm of height by(\s+)\d+mm of width in(\s+)landscape/,
      write: (m) =>
        `a sheet's work gets${m[1]}${f.portrait.heightMm}mm of height in portrait, and${m[2]}` +
        `${f.landscape.heightMm}mm of height by${m[3]}${f.landscape.widthMm}mm of width in${m[4]}landscape`,
    },
  ];
}

const flat = (text) => text.split(/\s+/).filter(Boolean).join(" ");

// Every string in the pins that holds `from` now holds `to`.
function rewritePins(node, from, to) {
  if (typeof node === "string") return node.includes(from) ? node.split(from).join(to) : node;
  if (Array.isArray(node)) return node.map((n) => rewritePins(n, from, to));
  if (node && typeof node === "object") {
    const out = {};
    for (const [key, value] of Object.entries(node)) out[key] = rewritePins(value, from, to);
    return out;
  }
  return node;
}

async function main() {
  const check = process.argv.includes("--check");
  const figures = pageFigures();
  const prices = await measurePrices();
  if (!prices.measured) {
    console.log(
      "PAGE_PRICES_NO_BROWSER: no browser on this machine, so the prices cannot be " +
        "measured as they print. Nothing was changed. Run `npm run ensure-chrome` first."
    );
    process.exitCode = 1;
    return;
  }

  const texts = new Map();
  const read = (file) => {
    if (!texts.has(file)) texts.set(file, fs.readFileSync(path.join(ROOT, file), "utf8"));
    return texts.get(file);
  };
  const pinsRaw = fs.existsSync(PINS) ? fs.readFileSync(PINS, "utf8") : null;
  let pins = pinsRaw ? JSON.parse(pinsRaw) : null;
  if (pins && JSON.stringify(pins, null, 1) + "\n" !== pinsRaw) {
    console.log("PAGE_PRICES_PINS_FORMAT: the pins file is not laid out as this script writes it; left alone.");
    pins = null;
  }

  const stale = [];
  for (const place of places(figures, prices)) {
    const text = read(place.file);
    const match = place.find.exec(text);
    if (!match) {
      console.log(
        `PAGE_PRICES_PLACE_MISSING: ${place.file} no longer carries ${place.what} ` +
          "where this script writes it. Put the sentence back, or change the place in " +
          "scripts/build-page-prices.js."
      );
      process.exitCode = 1;
      continue;
    }
    const fresh = place.write(match);
    if (match[0] === fresh) continue;
    stale.push(`${place.file}: ${place.what}`);
    texts.set(place.file, text.slice(0, match.index) + fresh + text.slice(match.index + match[0].length));
    if (pins) pins = rewritePins(pins, flat(match[0]), flat(fresh));
  }

  if (!stale.length) {
    console.log("Every document already carries the engine's page sizes and prices.");
    return;
  }
  if (check) {
    console.log("PAGE_PRICES_STALE: run `npm run page-prices`. Out of date:");
    for (const line of stale) console.log(`  ${line}`);
    process.exitCode = 1;
    return;
  }
  for (const [file, text] of texts) fs.writeFileSync(path.join(ROOT, file), text);
  if (pins) fs.writeFileSync(PINS, JSON.stringify(pins, null, 1) + "\n");
  console.log("Wrote the engine's page sizes and prices into:");
  for (const line of stale) console.log(`  ${line}`);
  if (pins) console.log("  and the same sentences in scripts/tests/worksheets_ledger_pins.json");
}

module.exports = { places };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
