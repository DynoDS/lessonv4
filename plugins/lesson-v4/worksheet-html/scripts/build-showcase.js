#!/usr/bin/env node
"use strict";

// Every helper in the library, on real pages, at real print size.
//
//   npm run showcase
//
// Not a lesson: a proof sheet. The point is to look at each drawing on paper
// at the size a zone actually gives it, because a minimum that reads fine as a
// number can still be too small to use once it is printed. Anything that looks
// wrong here is a minimum to change, not a page to redesign.
//
// The helpers come from the registry rather than a list written out here, so a
// helper added later appears without this file being touched.

const fs = require("node:fs");
const path = require("node:path");

const { helperNames } = require("../src/helpers");
const { renderSheet, checkFit } = require("../src/render");
const { htmlToPdf } = require("../src/chrome");
const EXAMPLES = require("../test/helper-examples");

// Helpers are shown as small as they will go, because that is the size at
// which a minimum is worth arguing with. Each is put in the tightest of these
// that will hold it, and which one that turns out to be IS the useful
// information: a drawing that needs the full page width cannot share a row
// with anything, and a lesson designer needs to know that before choosing a
// layout rather than after being refused.
const SHELVES = [
  { layout: "quarters", zones: ["a", "b", "c", "d"], note: "fits a quarter page" },
  { layout: "halves-stacked", zones: ["a", "b"], note: "needs the full width" },
  { layout: "full", zones: ["a"], note: "needs a page to itself" },
];

const { getLayout, zoneContentMm } = require("../src/render");
const { flatten } = require("../src/layouts");
const { printableArea, DEFAULT_MARGIN_MM } = require("../src/page");
const { REGISTRY } = require("../src/helpers");

// The smallest shelf whose zone can hold this helper. Asked of the helper's
// own stated minimum, so it is the same answer the fit check would give.
function shelfFor(name) {
  const spec = { helper: name, ...EXAMPLES[name] };
  const need = REGISTRY[name].needs(spec);
  const area = printableArea("portrait", DEFAULT_MARGIN_MM);

  for (const shelf of SHELVES) {
    // The same sum the fit check uses, from the same function, so a helper
    // cannot be shelved somewhere the check will then refuse it.
    const { wMm, hMm } = zoneContentMm(flatten(getLayout(shelf.layout).tree)[0], area);
    if (need.minWidthMm <= wMm && need.minHeightMm <= hMm) return shelf;
  }
  return null;
}

// Group helpers by the shelf they need, then fill each page's zones.
function pagesOf(names) {
  const pages = [];
  for (const shelf of SHELVES) {
    const mine = names.filter((n) => shelfFor(n) === shelf);
    for (let i = 0; i < mine.length; i += shelf.zones.length) {
      pages.push({ shelf, names: mine.slice(i, i + shelf.zones.length) });
    }
  }
  const homeless = names.filter((n) => shelfFor(n) === null);
  if (homeless.length) {
    console.log(`Too big for any page: ${homeless.join(", ")}`);
  }
  return pages;
}

async function main() {
  const out = path.join(__dirname, "..", "out", "showcase");

  // Cleared first. Page numbering shifts whenever a minimum changes (a helper
  // that stops fitting a quarter moves to a later page), so leftovers from an
  // earlier run sit alongside the new ones looking exactly as current. Nobody
  // proofreading a stack of printouts should have to work out which is which.
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const names = helperNames();
  const missing = names.filter((n) => !EXAMPLES[n]);
  if (missing.length) {
    console.log(`No example content for: ${missing.join(", ")}`);
  }

  const usable = names.filter((n) => EXAMPLES[n]);
  let built = 0;

  for (const [i, page] of pagesOf(usable).entries()) {
    const zones = {};
    page.shelf.zones.forEach((id, j) => {
      const name = page.names[j];
      if (name) zones[id] = { helper: name, ...EXAMPLES[name] };
    });

    const spec = {
      title: `Helper showcase ${i + 1}`,
      lo: `${page.names.join("   |   ")}   (${page.shelf.note})`,
      layout: page.shelf.layout,
      orientation: "portrait",
      zones,
    };

    // Two tall drawings can each fit the width and still not fit the page
    // together. Sharing is only ever a convenience here, so give them a page
    // each rather than dropping them from the proof sheet.
    const specs = checkFit(spec).length
      ? page.names.map((name) => ({
          title: name,
          lo: `${name}   (needs a page to itself)`,
          layout: "full",
          orientation: "portrait",
          zones: { a: { helper: name, ...EXAMPLES[name] } },
        }))
      : [spec];

    for (const [j, one] of specs.entries()) {
      const problems = checkFit(one);
      if (problems.length) {
        console.log(`REFUSED  ${one.lo}`);
        for (const p of problems) console.log(`         ${p}`);
        continue;
      }

      const html = renderSheet(one);
      const base = `page-${String(i + 1).padStart(2, "0")}${specs.length > 1 ? `-${j + 1}` : ""}`;
      fs.writeFileSync(path.join(out, `${base}.html`), html);
      fs.writeFileSync(path.join(out, `${base}.pdf`), await htmlToPdf(html));
      console.log(`BUILT    ${base}: ${one.lo}`);
      built += 1;
    }
  }

  console.log(`\n${built} pages in ${out}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
