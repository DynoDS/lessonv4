"use strict";

// The drawn page, read back from the browser that prints it.
//
// Why this exists. Every size check on the wall was a sum: the lines a note
// should take at a width, the height those lines should need, the room that
// should leave the drawing. Chrome prints the page, and where a sum and Chrome
// disagreed the check still said WORKING_WALL_LAYOUT_OK. A Year 5 perimeter
// wall passed with its green answer strip 12mm below the bottom of its part,
// and the wall worker only found out by building a copy and looking (stress
// test, 7 October 2026). Two sums were wrong that day and both are mended
// (render-section.js), but the next one would pass the same way, so the check
// now asks the page: the same cure the worksheets took on 9 October
// (worksheet-html/src/browser-measure.js).
//
// Two things are read.
//
// A section's parts (`data-wall-part`): how far each part's drawing and words
// run past the inside of its panel, and how tall its drawing printed. The
// build uses these to let the drawing give up a small overrun (build.js).
//
// Every box a child can see (a border or a fill), and the page itself: whether
// any words, picture or inner box print past its edge. The page clips what
// runs off it, so words past the page's edge are words that never print.

// Past this a box is taken to have been overrun. A hair under a millimetre is
// rounding: lengths are written to a hundredth of a millimetre and Chrome
// places them on whole pixels.
const EDGE_TOLERANCE_MM = 1;
const PART_TOLERANCE_MM = 0.3;

// Runs in the page.
const READ_PAGE = `(() => {
  const mm = (px) => Math.round((px * 25.4 / 96) * 10) / 10;
  const words = (el) => (el.textContent || "").replace(/\\s+/g, " ").trim();
  const seen = (cs) =>
    (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") ||
    (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "rgb(255, 255, 255)");
  const pages = Array.from(document.querySelectorAll(".page"));

  const parts = Array.from(document.querySelectorAll("[data-wall-part]")).map((part) => {
    const cs = getComputedStyle(part);
    const outer = part.getBoundingClientRect();
    const bottom = outer.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom);
    let lowest = -Infinity;
    for (const el of part.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.height) lowest = Math.max(lowest, r.bottom);
    }
    const figure = part.querySelector("[data-wall-figure] img");
    return {
      id: part.getAttribute("data-wall-part"),
      overMm: mm(lowest - bottom),
      figureMm: figure ? mm(figure.getBoundingClientRect().height) : 0,
    };
  });

  const edges = [];
  for (const frame of document.querySelectorAll("div")) {
    const isPage = frame.classList.contains("page");
    if (!isPage && !seen(getComputedStyle(frame))) continue;
    const box = frame.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    let worst = 0;
    let what = "";
    let side = "";
    const consider = (r, label) => {
      if (!r.width || !r.height) return;
      const past = { bottom: r.bottom - box.bottom, top: box.top - r.top, left: box.left - r.left, right: r.right - box.right };
      for (const k in past) if (past[k] > worst) { worst = past[k]; what = label; side = k; }
    };
    const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) consider(r, '"' + node.textContent.replace(/\\s+/g, " ").trim().slice(0, 60) + '"');
    }
    // An optional decoration is placed by its own rules and may sit on a
    // page's edge; a lesson picture and an inner box may not.
    for (const el of frame.querySelectorAll("img, svg")) {
      if (isPage && !el.closest(".page-core")) continue;
      consider(el.getBoundingClientRect(), "a picture");
    }
    for (const el of frame.querySelectorAll("div")) {
      if (isPage && !el.closest(".page-core")) continue;
      if (seen(getComputedStyle(el))) consider(el.getBoundingClientRect(), 'the box "' + words(el).slice(0, 40) + '"');
    }
    if (worst > 0) {
      edges.push({
        page: pages.findIndex((p) => p === frame || p.contains(frame)) + 1,
        frame: isPage ? "the page" : 'the box that starts "' + words(frame).slice(0, 40) + '"',
        side,
        mm: mm(worst),
        what,
      });
    }
  }
  return { parts, edges };
})()`;

// What the drawn pages measure. `browser` is one the caller launched and owns.
async function measurePages(browser, html) {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
    const read = await page.evaluate(READ_PAGE);
    return {
      parts: read.parts,
      edges: read.edges.filter((edge) => edge.mm > EDGE_TOLERANCE_MM),
    };
  } finally {
    await page.close();
  }
}

// One line a wall worker can act on for each thing printed past an edge.
function edgeMessage(edge) {
  const where = edge.side === "bottom" ? "below the bottom" : edge.side === "top" ? "above the top" : `past the ${edge.side} edge`;
  return (
    `WALL_PRINTS_PAST_ITS_BOX: page ${edge.page}: ${edge.what} prints ${edge.mm}mm ${where} of ${edge.frame}` +
    (edge.frame === "the page" ? ", where the page cuts it off" : "") +
    `. Measured on the drawn page. Make room first (an idea to a sheet of its own, a list over a second card), then shorten the words that ran over to a shorter whole sentence.`
  );
}

module.exports = { measurePages, edgeMessage, EDGE_TOLERANCE_MM, PART_TOLERANCE_MM };
