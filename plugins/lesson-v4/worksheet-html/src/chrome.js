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

    // The other half of that fault, and the one nothing caught. A box whose
    // content is taller than the box and which does NOT clip does not lose the
    // content: it draws it straight over whatever comes next. Both blocks are
    // inside the zone and the zone does not scroll, so the zone-overflow check
    // says nothing; nothing clips, so the child-clipped check says nothing;
    // neither block leaves the zone, so the child-outside-zone check says
    // nothing. A balanced-diet Greater Depth sheet printed question (1)
    // straight through a table's bottom rule while the build reported one clean
    // page, and a person looking at the render is what found it.
    //
    // Only a box that CONSTRAINS its height can do this - a fixed height, a
    // max-height, a flex slot it cannot grow past - so an ordinary auto-height
    // block reports its content exactly and never appears here.
    //
    // What is measured is IN-FLOW content, not scrollHeight, and the difference
    // is what makes the check usable. scrollHeight counts absolutely positioned
    // descendants too, and the engine draws decorations that way on purpose: a
    // speech bubble hangs its tail below itself with a margin reserved for it,
    // so it overflows its own padding box by design and nothing is drawn over.
    // Measuring scrollHeight refused the corrected Greater Depth sheet - the
    // one that had already been repaired and inspected - over that tail. Only
    // content that is laid out IN the box can push the next block, so only
    // in-flow children are counted, and a decoration placed in space already
    // reserved for it is left alone.
    //
    // The tolerance is about a millimetre. Under that is sub-pixel rounding and
    // the odd descender; over it is ink landing on another block.
    const SPILL_TOLERANCE_PX = 4;
    for (const child of zone.querySelectorAll("*")) {
      if (child.closest("svg")) continue;
      const style = getComputedStyle(child);
      if (
        style.display === "none" ||
        style.display === "contents" ||
        style.visibility === "hidden"
      ) {
        continue;
      }
      if (CLIPS.has(style.overflowX) || CLIPS.has(style.overflowY)) continue;

      const box = child.getBoundingClientRect();
      const borderBottom = parseFloat(style.borderBottomWidth) || 0;
      const borderRight = parseFloat(style.borderRightWidth) || 0;
      const limitBottom = box.bottom - borderBottom;
      const limitRight = box.right - borderRight;

      // Direct element children only. A descendant deeper down that overflows
      // ITS parent is the same fault one level lower, and the loop reaches that
      // level on its own turn, so walking the whole subtree here would report
      // one overlap several times over.
      let contentBottom = -Infinity;
      let contentRight = -Infinity;
      let inFlowChildren = 0;
      for (const inner of child.children) {
        const innerStyle = getComputedStyle(inner);
        if (
          innerStyle.position === "absolute" ||
          innerStyle.position === "fixed" ||
          innerStyle.display === "none" ||
          innerStyle.visibility === "hidden" ||
          innerStyle.float !== "none"
        ) {
          continue;
        }
        const innerBox = inner.getBoundingClientRect();
        if (innerBox.width === 0 && innerBox.height === 0) continue;
        inFlowChildren += 1;
        contentBottom = Math.max(contentBottom, innerBox.bottom);
        contentRight = Math.max(contentRight, innerBox.right);
      }

      // A box holding only text has no child rectangle to measure, so its own
      // scrolling area is the only account of what it holds. Nothing can be
      // absolutely positioned inside it either, which is what made that figure
      // untrustworthy above.
      const overflows = inFlowChildren === 0
        ? (child.scrollHeight > child.clientHeight + SPILL_TOLERANCE_PX ||
           child.scrollWidth > child.clientWidth + SPILL_TOLERANCE_PX)
        : (contentBottom > limitBottom + SPILL_TOLERANCE_PX ||
           contentRight > limitRight + SPILL_TOLERANCE_PX);

      if (overflows) {
        problems.push({
          zone: id,
          kind: "child-spills-over-neighbour",
          scrollHeight: child.scrollHeight,
          clientHeight: child.clientHeight,
          scrollWidth: child.scrollWidth,
          clientWidth: child.clientWidth,
          // Which box. A zone holds a dozen nested elements and "something in
          // zone a overlaps" sends the reader back to the render to find out
          // what; the class name is what the engine calls the helper that drew
          // it, so the finding names its own repair site.
          box: (child.getAttribute("class") || child.tagName.toLowerCase()).slice(0, 60),
        });
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
