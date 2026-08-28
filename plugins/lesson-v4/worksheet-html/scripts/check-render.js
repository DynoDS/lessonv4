#!/usr/bin/env node
"use strict";

// Does the browser agree with the arithmetic?
//
//   npm run check-render
//
// Every helper's height is ESTIMATED, never measured, because a scheduled
// cloud build has no browser and a height that needed rendering would work on
// one machine and not the other. That is the right trade, but it leaves the
// estimates unchecked, and an estimate that runs a millimetre short does not
// look like a bug: the zone clips its content and the page still looks
// finished. A carry row on a column method was sliced in half by exactly
// 0.6mm, and nothing in the build said a word.
//
// So the estimates are verified HERE, on a machine that has Chrome, rather
// than being replaced by measurement. This is a check to run before trusting
// a new helper, not part of npm test, which must keep running where there is
// no browser.

const path = require("node:path");

const puppeteer = require("puppeteer-core");
const { findChrome } = require("../src/chrome");
const { renderSheet, checkFit } = require("../src/render");
const { helperNames } = require("../src/helpers");
const EXAMPLES = require("../test/helper-examples");

const PX_PER_MM = 96 / 25.4;

// An estimate that runs OVER leaves a little white space, which is harmless.
// An estimate that runs SHORT clips content, which is not. So the tolerances
// are deliberately lopsided.
const CLIP_TOLERANCE_MM = 0.5;
const SLACK_REPORT_MM = 8;

// The widths a helper realistically gets: a quarter-page column, a half page,
// and the full printable width. A helper can be honest at one and wrong at
// another, which is how the column method passed at full width and clipped in
// a quarter.
const CASES = [
  // A helper can be honest at the widths a zone usually gives it and wrong at
  // the narrow end, and the narrow end is exactly where a sheet gets crowded.
  // Only quarter, half and full were tested, so five helpers were quietly
  // under-estimating their height in a narrow column and nothing said so.
  { name: "narrow", layout: "thirds-side", zone: "a" },
  { name: "quarter", layout: "quarters", zone: "a" },
  { name: "half", layout: "halves-side", zone: "a" },
  { name: "full", layout: "full", zone: "a" },
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: "new",
  });
  const page = await browser.newPage();

  const clipped = [];
  const slack = [];
  const skipped = [];
  let checked = 0;

  for (const name of helperNames()) {
    if (!EXAMPLES[name]) {
      skipped.push(`${name} (no example content)`);
      continue;
    }

    for (const c of CASES) {
      const spec = {
        title: name,
        layout: c.layout,
        orientation: "portrait",
        zones: { [c.zone]: { helper: name, ...EXAMPLES[name] } },
      };

      // A helper refused at this width is the engine working, not a fault.
      if (checkFit(spec).length) continue;

      await page.setContent(renderSheet(spec), { waitUntil: "domcontentloaded" });
      const measured = await page.evaluate(() => {
        const zone = document.querySelector(".zone");
        const content = zone.firstElementChild;
        return {
          zonePx: zone.clientHeight,
          // scrollHeight for the overflow question, because that is what a
          // clipped element reports. But scrollHeight can never fall BELOW
          // clientHeight, so it cannot answer the opposite question at all:
          // the child's own box has to be measured for that. Using
          // scrollHeight for both made the under-fill branch dead code that
          // silently never fired.
          overflowPx: zone.scrollHeight,
          contentPx: content ? content.getBoundingClientRect().height : 0,
        };
      });

      const overMm = (measured.overflowPx - measured.zonePx) / PX_PER_MM;
      const unusedMm = (measured.zonePx - measured.contentPx) / PX_PER_MM;
      checked += 1;

      if (overMm > CLIP_TOLERANCE_MM) {
        clipped.push(
          `${name} (${c.name} width): content is ${overMm.toFixed(1)}mm taller ` +
            `than the zone, so the bottom ${overMm.toFixed(1)}mm is cut off`
        );
      } else if (unusedMm > SLACK_REPORT_MM) {
        // Not a fault, but it is where holes in a page come from. Either the
        // estimate runs high, or the helper claimed spare height (greed) and
        // then did not stretch to use it, leaving a gap under itself.
        slack.push(
          `${name} (${c.name} width): the zone is ${unusedMm.toFixed(0)}mm ` +
            `taller than what it holds`
        );
      }
    }
  }

  await browser.close();

  console.log(`\nChecked ${checked} helper and width combinations.`);
  if (skipped.length) console.log(`Skipped: ${skipped.join(", ")}`);

  if (slack.length) {
    console.log("\nLeaves a gap (not a fault, but this is where holes in a page come from):");
    for (const s of slack) console.log(`  ${s}`);
  }

  if (clipped.length) {
    console.log(`\n${clipped.length} CLIPPED:`);
    for (const c of clipped) console.log(`  ${c}`);
    process.exitCode = 1;
    return;
  }
  console.log("Nothing is clipped: every estimate holds up in the browser.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
