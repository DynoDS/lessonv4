"use strict";

// The browser measures each piece before the page is laid out.
//
// Every helper says how tall it will be with its own arithmetic, and draws
// itself with its own CSS. Those are two descriptions of one thing, kept by
// hand, and they drift: on the sheets of twenty real lessons (the stress test
// of 7 October 2026) the arithmetic was more than 3mm taller than the browser
// in 43 of 83 zones and more than 1mm shorter in 11. A one-line question was
// priced as two, a word bank at 44mm for 26mm, a row of sums 10mm short. Too
// tall, and a sheet that fits is refused and its content cut to pass. Too
// short, and a sheet passes its check and clips when it prints. No single
// estimate was at fault: each helper had drifted in its own way, so mending
// them one at a time only waits for the next.
//
// So where there is a browser, it is asked. The layout runs once with a
// recorder on, which notes every piece it measured and the width it measured
// it at; those pieces are drawn in one page, at those widths, with the sheet's
// own stylesheet; and the heights the browser reports are what `measure` in
// helpers/index.js answers with from then on. The check, the build and the
// measuring tool all call this before they lay anything out, so all three see
// the same page.
//
// Where there is no browser (the unit tests, a machine without Chrome) nothing
// is recorded and every height is the arithmetic, exactly as before.

const { STACKED_FRACTION_CSS } = require("../../shared/text/stacked-fractions");
const { cssVariables } = require("./tokens");
const helpers = require("./helpers");

const PX_PER_MM = 96 / 25.4;

// A layout chosen from the browser's heights can ask about a shape the first
// pass never reached, so the pass repeats until it asks nothing new. Two
// rounds settle every sheet met so far; the third is the allowance.
const MAX_ROUNDS = 3;

function probePage(probes) {
  const body = probes
    .map(
      (probe) =>
        // flow-root so a piece's own margins count, as they do in a stack.
        `<div class="zone" data-probe style="position:relative;display:flow-root;` +
        `width:${probe.widthMm}mm;overflow:visible;margin-bottom:4mm">${probe.html}</div>`
    )
    .join("\n");
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${cssVariables()}
  html, body { margin: 0; padding: 0; }
  body { font-family: var(--font); color: var(--colour-ink); width: 320mm; }
  .zone { box-sizing: border-box; }
${helpers.helperCss}
${STACKED_FRACTION_CSS}
</style></head><body>${body}</body></html>`;
}

// A photograph is measured as an empty picture of the same size.
//
// The spec carries each photograph whole, and a piece is measured at every
// width a layout might give it, so a sheet of photographs put the same few
// megabytes into the probe page dozens of times: one Year 1 sheet took 21
// seconds and the next lost its browser. Height depends on the picture's size
// and never on what it shows, so the probe draws a blank of that size.
function withBlankPictures(html, spec) {
  const sizes = new Map();
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const w = Number(node.imageWidth);
    const h = Number(node.imageHeight);
    if (typeof node.imageHref === "string" && node.imageHref.length > 400 && w > 0 && h > 0) {
      sizes.set(node.imageHref, { w, h });
    }
    Object.values(node).forEach(walk);
  };
  walk(spec);
  let out = html;
  for (const [href, { w, h }] of sizes) {
    const blank =
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' ` +
      `width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'/%3E`;
    out = out.split(href).join(blank);
  }
  return out;
}

async function measureProbes(browser, probes) {
  const page = await browser.newPage();
  try {
    await page.setContent(probePage(probes), { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
    return await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-probe]")).map(
        (el) => el.getBoundingClientRect().height
      )
    );
  } finally {
    await page.close();
  }
}

/**
 * Run `layOut` with the browser's heights in place of the arithmetic.
 *
 * `layOut` is whatever the caller is about to do for real (choose the shapes,
 * check the fit). It is run here only to learn which pieces it measures, so
 * anything it throws is ignored: the caller runs it again afterwards and
 * reports its own refusals.
 *
 * @returns {{ available: boolean, measured: number, reason?: string }}
 */
async function calibrate(layOut, options = {}) {
  let browser = options.browser;
  let own = false;
  if (!browser) {
    try {
      browser = await require("./chrome").launchBrowser();
      own = true;
    } catch (error) {
      return { available: false, measured: 0, reason: String(error && error.message) };
    }
  }

  let measured = 0;
  try {
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const asked = helpers.recordMeasures(() => {
        try {
          layOut();
        } catch {
          // The real run reports it.
        }
      });
      const probes = [];
      for (const [key, { spec, widthMm }] of asked) {
        if (helpers.hasBrowserHeight(key)) continue;
        let html;
        try {
          html = withBlankPictures(helpers.renderHelper(spec, widthMm), spec);
        } catch {
          continue; // a piece that will not draw at this width is refused by name later
        }
        probes.push({ key, widthMm, html });
      }
      if (!probes.length) break;
      const heights = await measureProbes(browser, probes);
      probes.forEach((probe, i) => {
        if (Number.isFinite(heights[i]) && heights[i] > 0) {
          helpers.setBrowserHeight(probe.key, heights[i] / PX_PER_MM);
          measured += 1;
        }
      });
    }
  } finally {
    if (own) await browser.close();
  }
  return { available: true, measured };
}

module.exports = { calibrate, MAX_ROUNDS };
