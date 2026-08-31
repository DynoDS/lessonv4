"use strict";

// Finding and driving the browser that turns HTML into a printed page.
//
// puppeteer-core deliberately, not puppeteer: it ships no browser of its own,
// so we use the Chrome already installed rather than adding a 300MB download
// to every checkout. The cost is that we have to find it ourselves, which is
// what CANDIDATES below is for.

const fs = require("node:fs");
const path = require("node:path");

// The one browser build these worksheets are tuned against. Millimetres matter
// on a printed page, and two Chrome releases can wrap the same sentence a
// fraction differently - so ensure-chrome.js downloads exactly this build
// rather than whatever "stable" means on the day, and a downloaded shell is
// preferred below over whatever Chrome happens to be installed. Move this
// version deliberately: bump it, run `npm test` and `npm run check-render`,
// and look at the rendered pages before shipping.
const PINNED_CHROME_VERSION = "152.0.7977.64";

// Where ensure-chrome.js puts a downloaded chrome-headless-shell. The version
// number is part of the folder name and changes with every release, so the
// cache is searched rather than listed as a fixed path.
const CACHE_DIR = path.join(__dirname, "..", ".chrome");

const BINARY_NAMES = new Set([
  "chrome-headless-shell",
  "chrome-headless-shell.exe",
  "chrome",
  "chrome.exe",
  "chromium",
]);

function downloadedCandidates(dir = CACHE_DIR) {
  const found = [];
  const walk = (d, depth) => {
    if (depth > 4) return;
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (BINARY_NAMES.has(e.name)) found.push(p);
    }
  };
  walk(dir, 0);
  return found;
}

// CHROME_PATH wins outright so a sandbox or CI box can name its own. After
// that, a shell ensure-chrome.js downloaded wins over whatever Chrome is
// installed: the downloaded one is the pinned build every machine can share,
// while an installed Chrome updates itself on its own schedule and two
// machines rarely hold the same one. The installed Chromes remain as the
// fallback, so a machine that never downloaded anything still prints.
function candidatePaths() {
  const fromEnv = process.env.CHROME_PATH;
  return [
    ...(fromEnv ? [fromEnv] : []),
    // A headless shell that ensure-chrome.js downloaded earlier.
    ...downloadedCandidates(),
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA || ""}\\Google\\Chrome\\Application\\chrome.exe`,
    // Linux (the shape a cloud sandbox usually takes)
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
}

function findChrome() {
  const tried = candidatePaths();
  for (const exe of tried) {
    try {
      if (fs.existsSync(exe)) return exe;
    } catch {
      // An unreadable path is just a path that is not it.
    }
  }
  throw new Error(
    `NO_CHROME: no Chrome or Chromium found. Tried:\n  ${tried.join("\n  ")}\n` +
      `Run "node scripts/ensure-chrome.js" to fetch a headless one (needs ` +
      `the network), or set CHROME_PATH to name one explicitly.`
  );
}

// What the PAGE ACTUALLY DID, read out of the finished DOM.
//
// The arithmetic fit check runs on estimates: a character width, a line height,
// a guess at how a word wraps. It is right often enough to plan with and it is
// not what a child holds. A font that loads slightly wider than assumed, a
// picture with its own intrinsic size, a long unbroken word - each puts content
// over the edge of its zone while every estimate still says the sheet fits.
//
// So this asks the browser, after layout, with the real fonts loaded. Returned
// as facts rather than thrown, because the caller decides what a clipped zone
// means for the artefact it is building.
const RENDERED_FIT_PROBE = `(() => {
  const problems = [];

  // Whole CSS pixels, and a box's edge can land a fraction either side of the
  // zone's without a mark being lost. Two pixels is half a millimetre, well
  // under the thickness of a printed rule, and still far below the six pixels
  // that were genuinely cutting the bottom row off a table.
  const OUTSIDE_TOLERANCE_PX = 2;

  for (const zone of document.querySelectorAll("[data-worksheet-zone]")) {
    const rect = zone.getBoundingClientRect();
    const id = zone.getAttribute("data-worksheet-zone");

    if (
      zone.scrollWidth > zone.clientWidth + 1 ||
      zone.scrollHeight > zone.clientHeight + 1
    ) {
      problems.push({
        zone: id,
        kind: "zone-overflow",
        scrollWidth: zone.scrollWidth,
        clientWidth: zone.clientWidth,
        scrollHeight: zone.scrollHeight,
        clientHeight: zone.clientHeight,
      });
    }

    // A box that clips its OWN content. The zone's scroll size cannot see this:
    // an inner box can cut a row off while the inner box itself sits neatly
    // inside the zone, and the page still looks finished.
    const CLIPS = new Set(["hidden", "clip", "auto", "scroll"]);
    for (const child of zone.querySelectorAll("*")) {
      const style = getComputedStyle(child);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const clipsX = CLIPS.has(style.overflowX);
      const clipsY = CLIPS.has(style.overflowY);
      if (!clipsX && !clipsY) continue;
      if (
        (clipsX && child.scrollWidth > child.clientWidth + 1) ||
        (clipsY && child.scrollHeight > child.clientHeight + 1)
      ) {
        problems.push({ zone: id, kind: "child-clipped" });
        break;
      }
    }

    // Content that reaches outside the zone altogether. The zone's scroll size
    // does not see content above or left of its own origin, so this is the only
    // thing that catches a block drawn off the top of its zone.
    //
    // Drawings are judged by their own outer element and never by the shapes
    // inside them. An SVG's contents live in its viewBox and are clipped by the
    // SVG, not by the zone, and an SVG text node's box routinely reaches two or
    // three pixels above its own visible ink - so comparing those inner nodes
    // against the zone reports a clip where nothing whatever is cut. It did:
    // three sound worksheets were refused over a bar chart title overshooting
    // by 2px, and the real fault on those sheets went unmentioned underneath it.
    for (const child of zone.querySelectorAll("*")) {
      if (child.closest("svg")) continue;
      const style = getComputedStyle(child);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const childRect = child.getBoundingClientRect();
      if (
        childRect.right > rect.right + OUTSIDE_TOLERANCE_PX ||
        childRect.bottom > rect.bottom + OUTSIDE_TOLERANCE_PX ||
        childRect.left < rect.left - OUTSIDE_TOLERANCE_PX ||
        childRect.top < rect.top - OUTSIDE_TOLERANCE_PX
      ) {
        problems.push({ zone: id, kind: "child-outside-zone" });
        break;
      }
    }
  }

  return problems;
})()`;

// One Chrome process, handed around instead of started over.
//
// Launching Chrome is the expensive part of printing a page - hundreds of
// milliseconds of process start against tens of rendering - and a worksheet
// build prints every sheet plus up to three reshape retries each, so paying
// the launch once per PAGE multiplied the slowest step by a dozen. A caller
// with several pages launches once, prints them all, and closes it.
async function launchBrowser() {
  // Required here rather than at the top so that finding Chrome, and building
  // HTML-only on a machine without it, never needs the packages installed.
  const puppeteer = require("puppeteer-core");
  return puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}

// The HTML owns its own margins, so the PDF is printed edge to edge. This
// keeps one source of truth for page geometry: src/page.js, in millimetres.
//
// `opts.inspectFit` additionally reads the rendered geometry back and returns
// `{ pdf, fitProblems }` instead of a bare buffer. It is opt-in because the
// twenty other scripts that print a page want the buffer they have always had.
//
// `opts.browser` prints through a browser the caller launched (and still
// owns): only the page is closed here. Without it, one is launched and closed
// around this single print, which is what every one-page caller wants.
async function htmlToPdf(html, opts = {}) {
  const browser = opts.browser || (await launchBrowser());

  let page;
  try {
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    // Fonts decide how wide every word is, and "load" does not wait for them.
    // Measuring before they arrive measures a different page from the one that
    // prints, which is worse than not measuring at all: it would report a
    // verified fit for geometry no child ever sees.
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    const fitProblems = opts.inspectFit
      ? await page.evaluate(RENDERED_FIT_PROBE)
      : null;

    const pdf = await page.pdf({
      format: "A4",
      landscape: Boolean(opts.landscape),
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    // page.pdf() returns a Uint8Array in this puppeteer-core version, not a
    // Node Buffer. The interface promises a Buffer, so wrap it here rather
    // than leaving every caller to remember the difference.
    const buffer = Buffer.from(pdf);
    return opts.inspectFit ? { pdf: buffer, fitProblems } : buffer;
  } finally {
    if (opts.browser) {
      if (page) await page.close();
    } else {
      await browser.close();
    }
  }
}

module.exports = {
  findChrome,
  htmlToPdf,
  launchBrowser,
  candidatePaths,
  downloadedCandidates,
  PINNED_CHROME_VERSION,
};
