"use strict";

// Helpers: the things that go IN a zone.
//
// This is the worksheet equivalent of a slide's content objects. A helper knows
// four things about itself, and they live together in ONE entry so they cannot
// drift apart:
//
//   render(spec)            → the HTML
//   measure(spec, widthMm)  → how tall it naturally wants to be at that width
//   needs(spec, widthMm?)   → usable floors, at the actual width when supplied
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
    needs: (spec, widthMm) => {
      const stated = helper.needs(spec, widthMm);
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
  fillsContent,
  describeContent,
  inspectContent,
} = makeCompose({
  render: (spec, widthMm) => entry(spec.helper).render(spec, widthMm),
  measure,
  needs: (spec, widthMm) => entry(spec.helper).needs(spec, widthMm),
  greed,
  fills,
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

// Does spare height keep paying off, or does this helper reach a size past
// which more is worse?
//
// `greed` says a helper CAN use spare height. It does not say how much, and
// the two are different questions with different answers. Ruled writing lines
// gain from being roomier and then stop: a line twice as tall as a child's
// handwriting is not more room to answer in, it is an invitation to write an
// essay the question never asked for. A box a child DRAWS in is the opposite -
// the space is the whole content, and every millimetre is more drawing.
//
// One cap for both is wrong whichever number it takes. Half again was chosen
// for the lines, and it is why a drawing box told to take a whole side of a
// page came out 20mm tall with 140mm blank under it.
//
// So a helper whose content IS the space says `fills: true` and has no
// ceiling. Everything else keeps the half-again cap, which is the number the
// writing lines were tuned to and stays their default.
const GROWTH_CEILING = 0.5; // of the helper's own natural height

function fills(helperName) {
  const found = REGISTRY[helperName];
  return Boolean(found && found.fills);
}

// The sets a helper cannot be a question without.
//
// Some helpers exist to draw a SET of things: the options a child chooses
// between, the dots on a photograph, the cards in a row. Handed an empty set
// they draw the frame and nothing in it, and the page prints an instruction
// with nothing to act on. It fits, it looks finished, and the child cannot
// start.
//
// That is not hypothetical either. One science sheet shipped with
// `"options": []` under "Circle the complete circuit" and `"labels": []` under
// "Draw a line from each word to the right part" - three questions across two
// sheets that no child could do, on pages that passed every check.
//
// Declared per helper rather than guessed, because an empty set is sometimes
// exactly right: a Venn or a Carroll diagram with no shapes is a blank sorting
// frame, which is the commonest way either is used. The engine cannot tell
// those apart from the outside, so each helper says which of its sets are the
// activity itself. A helper that names none is never checked, so adding one
// costs a line and forgetting one costs nothing that was not already true.
function requiredSets(helperName) {
  const found = REGISTRY[helperName];
  return (found && found.requires) || [];
}

// The fitting rule, and the whole point of zones knowing their millimetres: a
// zone can answer this before anything is drawn. It takes the whole content
// spec, not just the helper's name, because the answer depends on what is in it.
function fits(spec, zoneWidthMm, zoneHeightMm) {
  const { minWidthMm, minHeightMm } = needsContent(spec, zoneWidthMm);
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
  fillsContent,
  describeContent,
  inspectContent,
  renderHelper,
  fits,
  measure,
  greed,
  fills,
  requiredSets,
  GROWTH_CEILING,
  helperNames,
  helperCss,
  REGISTRY,
};
