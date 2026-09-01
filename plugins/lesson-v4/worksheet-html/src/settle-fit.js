"use strict";

// The browser has the last word on whether a page fits, and this is where the
// engine listens to it.
//
// Every height the arithmetic produces is an estimate, so a page the checks
// passed can still arrive from Chrome a few pixels clipped. What happens next
// used to live inside the build script's main loop, where nothing could test
// it: a hundred square 6px taller than its estimate cost a real lesson its
// whole worksheet set, the reshape retries re-dealt the same underestimate into
// other shapes, and the run's one focused repair was spent guessing at pixels
// it had never seen. The loop was repaired to feed the browser's measurement
// back, and then sat untested in a script that runs on require.
//
// So the loop lives here, on its own, taking the browser as an argument. The
// build script calls it once per sheet; the tests call it with a browser that
// says whatever the test needs said.
//
// The rules it keeps, in order:
//
// 1. Hand each clipped zone the millimetres the browser proved it needs and
//    draw the same page again. The extra is paid out of genuine page slack
//    (the same purse as the safety margins), the designer's chosen shape is
//    kept, and nothing is trimmed, shrunk or reworded.
// 2. A page with no slack to give refuses the correction, so draw the SAME
//    content in a roomier arrangement of the same page instead. Only which
//    rectangle each zone occupies changes, and only to a shape that was
//    already measured and accepted.
// 3. Still clipped after both: report it. The sheet is refused and the
//    designer decides what changes. Nothing is ever shrunk to make a page pass.

// How many roomier arrangements are worth drawing before a clipped sheet is
// refused for real. Each one costs a browser render, and a sheet that three
// measured, roomier shapes cannot draw cleanly has something wrong with its
// content rather than its shape - which is a designer's decision, not this
// engine's.
const MAX_RESHAPES = 3;

// How many times the browser's own measurements are fed back before reshaping.
// One round settles the ordinary case (an estimate a few pixels short); the
// second catches a zone whose first correction uncovered a second clipped
// zone. More rounds than that is not an estimate error any more.
const MAX_MEASURED_CORRECTIONS = 2;

// CSS millimetres to CSS pixels: the browser lays out at 96dpi.
const PX_PER_MM = 96 / 25.4;

// The most a single zone may be grown on the browser's word. A hairline
// estimate error is a few millimetres; a zone that wants more than this has a
// content problem the designer should see, not a measurement problem the
// engine should absorb.
const MAX_CORRECTION_MM = 8;

// What the browser's fit probe says each clipped zone needs, in millimetres,
// on top of what it has already been given. Null when nothing correctable
// remains: a width overflow cannot be fixed with height, and a zone already
// grown to the cap has stopped being a measurement problem.
function measuredCorrections(fitProblems, already) {
  const wanted = {};
  for (const problem of fitProblems || []) {
    if (!problem.zone) continue;
    const has = already[problem.zone] || 0;
    if (has >= MAX_CORRECTION_MM) continue;
    let mm;
    if (problem.kind === "zone-overflow") {
      const deficit = problem.scrollHeight - problem.clientHeight;
      const wide = problem.scrollWidth > problem.clientWidth + 1;
      if (deficit <= 0) {
        if (wide) continue; // width-only: height cannot buy it out.
        mm = 1;
      } else {
        mm = deficit / PX_PER_MM + 1; // the measured shortfall plus a hair
      }
    } else {
      // A child clipped or outside the zone, with no measured deficit: a
      // small nudge is worth one try before the reshape spends a render.
      mm = 2;
    }
    wanted[problem.zone] = Math.min(MAX_CORRECTION_MM, has + mm);
  }
  return Object.keys(wanted).length ? wanted : null;
}

// Print one sheet through the browser and settle whether it fits.
//
// `spec` is the sheet as the designer composed it (auto layouts already
// resolved) and `html` its first render. `htmlToPdf` is the browser: it must
// return `{ pdf, fitProblems }` when asked to `inspectFit`. `renderSheet` and
// `roomierArrangements` default to the engine's own and are arguments only so
// a test can stand in for them.
//
// Returns the page that should ship - `html` and `pdf` - together with what
// was done to get it there: `correction` (the millimetres each zone was grown
// on the browser's word) or `reshape` (the roomier layout it was drawn in),
// each null when not used, and `fitProblems`, which is empty when the page is
// verified clean and otherwise lists what still clips.
async function settleSheetFit({
  spec,
  html,
  htmlToPdf,
  browser,
  renderSheet = require("./render").renderSheet,
  roomierArrangements = require("./suggest").roomierArrangements,
}) {
  const print = (page, landscape) =>
    htmlToPdf(page, { landscape, inspectFit: true, browser });

  const landscape = spec.orientation === "landscape";
  let { pdf, fitProblems } = await print(html, landscape);
  let settledHtml = html;
  let correction = null;
  let reshape = null;
  const corrections = {};

  // The arithmetic said it fitted and the browser disagreed, which means an
  // estimate ran a hair short. The browser has just measured EXACTLY how
  // short, zone by zone - so before anything else, hand each clipped zone the
  // millimetres it proved it needs and draw the same page again.
  for (
    let round = 0;
    round < MAX_MEASURED_CORRECTIONS && (fitProblems || []).length;
    round += 1
  ) {
    const wanted = measuredCorrections(fitProblems, corrections);
    if (!wanted) break;
    Object.assign(corrections, wanted);
    let retryHtml;
    try {
      retryHtml = renderSheet(spec, { extraZoneMm: corrections });
    } catch {
      break; // no slack left to pay the correction from: try a reshape.
    }
    const retry = await print(retryHtml, landscape);
    if ((retry.fitProblems || []).length) {
      fitProblems = retry.fitProblems;
      continue;
    }
    settledHtml = retryHtml;
    pdf = retry.pdf;
    fitProblems = [];
    correction = { ...corrections };
  }

  // Still clipped after the browser's own numbers were honoured: draw the
  // SAME content again in a roomier arrangement of the same page and see
  // whether the browser is happy with that one. Nothing is trimmed, shrunk,
  // reworded, moved to a second page or dropped. A version is kept only if a
  // browser then draws it with nothing clipped, so what ships is still a page
  // that was verified rather than one that was hoped about.
  if ((fitProblems || []).length) {
    for (const option of roomierArrangements(spec).slice(0, MAX_RESHAPES)) {
      let retryHtml;
      try {
        retryHtml = renderSheet(option.spec);
      } catch {
        continue; // measured as fitting, refused when drawn: try the next.
      }
      const retry = await print(retryHtml, option.orientation === "landscape");
      if ((retry.fitProblems || []).length) continue;

      settledHtml = retryHtml;
      pdf = retry.pdf;
      fitProblems = [];
      reshape = { from: spec.layout, to: option.layout, fillPct: option.fillPct };
      break;
    }
  }

  return {
    html: settledHtml,
    pdf,
    fitProblems: fitProblems || [],
    correction,
    reshape,
  };
}

module.exports = {
  MAX_RESHAPES,
  MAX_MEASURED_CORRECTIONS,
  MAX_CORRECTION_MM,
  PX_PER_MM,
  measuredCorrections,
  settleSheetFit,
};
