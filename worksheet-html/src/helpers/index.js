"use strict";

// Helpers: the things that go IN a zone.
//
// This is the worksheet equivalent of a slide's content objects. A helper knows
// four things about itself, and they live together in ONE entry so they cannot
// drift apart:
//
//   render(spec)            → the HTML
//   measure(spec, widthMm)  → how tall it naturally wants to be at that width
//   needs(spec)             → the smallest box THIS content stays usable in
//   greed                   → how much spare height it should absorb
//
// `needs` is a function of the content, not a constant per helper. A
// four-column table needs more width than a two-column one, and a chart with
// eight categories needs more than one with three.
//
// Heights are estimated arithmetically rather than measured in a browser, on
// purpose: a scheduled cloud build has no browser, so a height that could only
// be discovered by rendering would work on one machine and not the other. The
// browser check verifies these estimates rather than replacing them.

// Each file exports { helpers, css }: the helpers it provides and the styling
// they need. Adding a helper touches one file and nothing else.
const { legibleWidthMm } = require("./shared");
const { makeCompose, css: composeCss } = require("./compose");

const FILES = [
  require("./text"),
  require("./tables"),
  require("./visuals"),
  require("./drawn"),
  require("./forms"),
  require("./matching"),
  require("./frames"),
  require("./methods"),
  require("./comparing"),
  require("./placevalue"),
  require("./money"),
  require("./geometry"),
  require("./science"),
  require("./geography"),
];

// A drawn helper's stated minimum says how small it can be BUILT. It also has
// to say how small it can be READ, and the two are not the same: an SVG is
// scaled to its zone, so its labels shrink with it. Rather than ask every
// helper's author to work that out and get it right, it is computed from the
// drawing itself and applied here, once, to all of them.
//
// This is not belt and braces. A number line stated 70mm, at which its labels
// printed at three and a half point, and every other check passed: it fitted,
// nothing clipped, the page looked finished.
function withLegibilityFloor(helper) {
  return {
    ...helper,
    needs: (spec) => {
      const stated = helper.needs(spec);
      const legible = legibleWidthMm(helper.render(spec));
      const minWidthMm = Math.max(stated.minWidthMm, legible);
      return {
        ...stated,
        minWidthMm,
        minHeightMm: reachableHeightMm(helper, spec, stated, minWidthMm),
      };
    },
  };
}

// A minimum height a helper can never reach only ever refuses good pages.
//
// `fits` compares the content's NATURAL height, at the width its zone actually
// gives it, against this number. For text that works: text wraps, so a narrow
// zone makes it taller and the minimum is its height at the widest zone. For
// anything scaled by its width it is backwards - a picture gets TALLER as it
// gets WIDER, so a minimum measured at the widest zone is the TALLEST the
// content could be, and the helper is refused for being shorter than its own
// worst case.
//
// Six helpers were doing this. A row of three photographs claimed it needed
// 59mm and genuinely needed 33mm at half-page width, so it was refused from
// every zone on the page but one. That cost a real below sheet two of its
// questions and its only reasoning question, which is how it was found.
//
// So the stated minimum is clamped to what the helper actually measures at its
// own narrowest allowed width. Anything above that is unreachable by
// construction, and a check that cannot pass is not a check.
function reachableHeightMm(helper, spec, stated, minWidthMm) {
  if (!stated.minHeightMm) return stated.minHeightMm;
  try {
    return Math.min(stated.minHeightMm, helper.measure(spec, minWidthMm));
  } catch {
    // A helper that cannot measure itself at its own minimum width has a
    // bigger problem than this, and it belongs to whatever raised it.
    return stated.minHeightMm;
  }
}

const REGISTRY = {};
for (const file of FILES) {
  for (const [name, helper] of Object.entries(file.helpers)) {
    if (REGISTRY[name]) {
      throw new Error(
        `DUPLICATE_HELPER: "${name}" is defined in two helper files.`
      );
    }
    REGISTRY[name] = withLegibilityFloor(helper);
  }
}

// Several helpers can share one zone, stacked or side by side. A group asks
// and answers the same four questions a single helper does, which is what lets
// the two be used interchangeably and lets groups nest inside groups.
const {
  renderContent,
  measureContent,
  needsContent,
  greedContent,
  describeContent,
  inspectContent,
} = makeCompose({
  render: (spec, widthMm) => entry(spec.helper).render(spec, widthMm),
  measure,
  needs: (spec) => entry(spec.helper).needs(spec),
  greed,
});

// Every helper's CSS, gathered for the renderer to drop into the page.
const helperCss = [...FILES.map((f) => f.css || ""), composeCss].join("\n");

function entry(name) {
  const found = REGISTRY[name];
  if (!found) {
    throw new Error(
      `UNKNOWN_HELPER: "${name}". Known: ${Object.keys(REGISTRY).sort().join(", ")}`
    );
  }
  return found;
}

function renderHelper(spec, widthMm) {
  return entry(spec.helper).render(spec, widthMm);
}

function measure(spec, widthMm) {
  const found = REGISTRY[spec.helper];
  return found ? found.measure(spec, widthMm) : 20;
}

function greed(helperName) {
  const found = REGISTRY[helperName];
  return found && found.greed !== undefined ? found.greed : 1;
}

// The fitting rule, and the whole point of zones knowing their millimetres: a
// zone can answer this before anything is drawn. It takes the whole content
// spec, not just the helper's name, because the answer depends on what is in it.
function fits(spec, zoneWidthMm, zoneHeightMm) {
  const { minWidthMm, minHeightMm } = needsContent(spec);
  const tooNarrow = zoneWidthMm < minWidthMm;
  const tooShort = zoneHeightMm < minHeightMm;

  if (!tooNarrow && !tooShort) return { ok: true };
  const reasons = [];
  if (tooNarrow) {
    reasons.push(
      `needs ${Math.round(minWidthMm)}mm wide, zone is ${Math.round(zoneWidthMm)}mm`
    );
  }
  if (tooShort) {
    reasons.push(
      `needs ${Math.round(minHeightMm)}mm tall, zone is ${Math.round(zoneHeightMm)}mm`
    );
  }
  return { ok: false, why: reasons.join("; ") };
}

function helperNames() {
  return Object.keys(REGISTRY).sort();
}

module.exports = {
  renderContent,
  measureContent,
  needsContent,
  greedContent,
  describeContent,
  inspectContent,
  renderHelper,
  fits,
  measure,
  greed,
  helperNames,
  helperCss,
  REGISTRY,
};
