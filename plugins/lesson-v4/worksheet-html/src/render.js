"use strict";

// The renderer: a worksheet spec in, one A4 page of HTML out.
//
// A spec names a layout and says what goes in each zone. Nothing else. No
// coordinates, no sizes, nothing to keep in sync by hand:
//
//   { title, layout, orientation, zones: { a: {helper, ...}, b: {...} } }
//
// Zones are placed by ABSOLUTE POSITION from the layout tree, in millimetres.
// Not CSS grid: grid needed a template string full of quotes, which is how the
// geometry got silently discarded once already, and grid gaps then added height
// nobody had subtracted. A rectangle placed at a millimetre offset has neither
// problem, and it is exactly what the gallery already draws.

const { pageSize, printableArea, DEFAULT_MARGIN_MM } = require("./page");
const { renderDecorationLayers } = require("./decorations");
const { cssVariables } = require("./tokens");
const { LAYOUTS, VARIANTS, flatten } = require("./layouts");
const { isStack } = require("./helpers/compose");
const {
  renderContent,
  measureContent,
  greedContent,
  describeContent,
  fits,
  helperCss,
} = require("./helpers");

// The gutter between zones. Without it, content in one zone runs straight up
// against content in the next and the two read as one crowded block.
const GUTTER_MM = 6;

// Zones sized to their CONTENT, not left standing at their proportional height.
//
// The layout's proportions say how the page is divided. They are the starting
// shape, not the final one. If a zone's content only needs half its share, the
// zone should not stand at full height leaving a hole in the middle of the
// page: it should take what it needs, and the spare should go somewhere chosen
// rather than settling wherever it happens to fall.
//
// So: every zone asks its content how tall it wants to be, takes that (never
// below the shape's own floor), and the remainder is handed to whichever zones
// can genuinely use it. Writing space grows; a chart does not; short questions
// least of all. Anything still left over collects at the FOOT of the page,
// which is where empty space belongs, rather than between two question blocks.
// Measure the layout TREE from the bottom up, so a zone that does not fill its
// share does not leave a hole where the next one should have started.
//
// The rule is the one a person would draw on paper:
//   a leaf   is as tall as its content wants to be
//   a stack  is the sum of its children, plus a gutter between each
//   a row    is as tall as its TALLEST child, because they sit side by side
//
// Doing it on the tree rather than column by column is what makes it work when
// a full-width band sits above two columns: shrink the band, and the columns
// move up to meet it instead of staying put at their original proportion.
function measureTree(node, spec, widthMm) {
  if (typeof node === "string") {
    const content = spec.zones[node];
    const natural = content ? measureContent(content, widthMm - GUTTER_MM) : 0;
    return {
      kind: "leaf",
      id: node,
      content,
      natural,
      greed: content ? greedContent(content) : 0,
      height: natural,
    };
  }

  const total = node.parts.reduce((a, b) => a + b, 0);

  if (node.dir === "cols") {
    const children = node.children.map((child, i) =>
      measureTree(child, spec, (node.parts[i] / total) * widthMm)
    );
    return {
      kind: "cols",
      parts: node.parts,
      children,
      height: Math.max(...children.map((c) => c.height)),
    };
  }

  const children = node.children.map((child) => measureTree(child, spec, widthMm));
  const gutters = Math.max(0, children.length - 1) * GUTTER_MM;
  return {
    kind: "rows",
    parts: node.parts,
    children,
    height: children.reduce((s, c) => s + c.height, 0) + gutters,
  };
}

function eachLeaf(measured, fn) {
  if (measured.kind === "leaf") return fn(measured);
  measured.children.forEach((c) => eachLeaf(c, fn));
}

// Every helper's height here is an ESTIMATE - a guess at how a word wraps, how
// tall a line of this font really sits, where a picture settles - because the
// overnight box has no browser to measure with. The estimates are good, and
// they are not the truth. The browser draws the same content a fraction taller
// or shorter, and `.zone` clips what it cannot hold.
//
// So a zone drawn at EXACTLY its estimate has no room to be wrong in. A zone
// holding content that cannot stretch used to get precisely that: its estimate
// to the millimetre, no matter how empty the rest of the page was. A sheet 54%
// full, with 122mm going spare at the foot of the page, still handed its two
// reference tables their estimate and not a hair more - and when the browser
// drew them 6px taller, the bottom row was cut off and the whole worksheet was
// refused. The page had the room all along; nothing offered it.
//
// This is the tolerance. It is taken only from height the page genuinely has
// spare, so it can never turn a sheet that fitted into one that does not.
const SAFETY_FLOOR_MM = 1.5;
const SAFETY_CEILING_MM = 4;
const SAFETY_SHARE = 0.02;

// Wrap error accumulates line by line, so a tall zone can be wrong by more than
// a short one, but neither needs an unbounded allowance.
function safetyMarginMm(naturalMm) {
  if (!(naturalMm > 0)) return 0;
  return Math.min(SAFETY_CEILING_MM, Math.max(SAFETY_FLOOR_MM, naturalMm * SAFETY_SHARE));
}

// Heights changed underneath, so the containers have to be recomputed.
function recomputeHeights(node) {
  if (node.kind === "leaf") return node.height;
  const kids = node.children.map(recomputeHeights);
  node.height =
    node.kind === "cols"
      ? Math.max(...kids)
      : kids.reduce((a, b) => a + b, 0) + (kids.length - 1) * GUTTER_MM;
  return node.height;
}

// Hand the leftover height to whatever can genuinely use it, capped so nothing
// is inflated. Anything still spare is left at the FOOT of the page, which is
// where a teacher trims it off, rather than pooled between two question blocks.
function growToFit(measured, availableMm) {
  const leaves = [];
  eachLeaf(measured, (l) => leaves.push(l));

  const spare = availableMm - measured.height;
  if (spare <= 0) return { spare, short: -spare };

  // A one-zone layout owns the whole printable page. Keep that real boundary
  // even when its estimate is shorter: wrapped browser content may need more
  // height than an arithmetic estimate can predict exactly, and clipping the
  // zone at the estimate throws away space that genuinely belongs to it.
  //
  // This is especially visible in a full-page data table: long cells wrap,
  // the last row is cut off at the estimated height, and the rest of the page
  // is left blank. Giving the only zone its actual room does not inflate the
  // helper; it simply lets the browser use the page that the layout promised.
  if (measured.kind === "leaf") {
    measured.height = availableMm;
    return { spare: 0, short: 0 };
  }

  // Tolerance first, for EVERY zone, greedy or not. A zone that cannot stretch
  // is exactly the zone that gets no growth below and so most needs this.
  //
  // Zones side by side in a column share one height rather than adding to it,
  // so the cost of the margins is not the sum of them and cannot be worked out
  // in advance. Find the largest fraction of the wanted margin the page can
  // actually afford, the same way the slide engine finds the largest readable
  // type that fits: propose, measure the whole tree, narrow.
  const wanted = leaves.map((l) => safetyMarginMm(l.natural));
  const applyMargins = (fraction) => {
    leaves.forEach((l, i) => {
      l.margin = wanted[i] * fraction;
      l.height = l.natural + l.margin;
    });
    recomputeHeights(measured);
    return measured.height;
  };

  if (applyMargins(1) > availableMm) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      if (applyMargins(mid) > availableMm) hi = mid;
      else lo = mid;
    }
    applyMargins(lo);
  }

  // What is left after tolerance is what the greedy helpers may claim.
  const afterMargins = availableMm - measured.height;
  const greedTotal = leaves.reduce((s, l) => s + l.greed, 0);
  if (greedTotal <= 0 || afterMargins <= 0) {
    return { spare: afterMargins, short: 0 };
  }

  for (const l of leaves) {
    if (!l.greed) continue;
    const share = (afterMargins * l.greed) / greedTotal;
    // The margin is kept on top of the growth, not replaced by it: growth is
    // room the helper asked for, tolerance is room the estimate might need.
    l.height = l.natural + l.margin + Math.min(share, l.natural * 0.5);
  }

  recomputeHeights(measured);

  return { spare: availableMm - measured.height, short: 0 };
}

// Walk the measured tree top down, handing out real rectangles.
function placeTree(node, x, y, w, out = []) {
  if (node.kind === "leaf") {
    out.push({ id: node.id, content: node.content, x, y, w, h: node.height });
    return out;
  }

  const total = node.parts.reduce((a, b) => a + b, 0);
  let cursor = node.kind === "cols" ? x : y;

  node.children.forEach((child, i) => {
    if (node.kind === "cols") {
      const cw = (node.parts[i] / total) * w;
      placeTree(child, cursor, y, cw, out);
      cursor += cw;
    } else {
      placeTree(child, x, cursor, w, out);
      cursor += child.height + GUTTER_MM;
    }
  });

  return out;
}

// How much room a zone's CONTENT actually gets, which is not the size of the
// zone. A gutter comes off the width so content does not run into its
// neighbour's, and measureTree and the renderer both subtract it.
//
// This exists as one function because it used to be worked out separately in
// each place, and the fit check was the one that forgot. It approved a helper
// against 90mm and then handed it 84mm: a recording table asked for 90mm, was
// told yes, and its last column came out too narrow for a child to write in.
function zoneContentMm(zone, area) {
  return {
    wMm: zone.w * area.widthMm - GUTTER_MM,
    hMm: zone.h * area.heightMm,
  };
}

// ─── a section title owns the full width of what it names ────────────────
//
// "Going Deeper" was printed at the top of the LEFT column of a two-column
// band, level with a question that started in the right one - and everything
// in both columns belonged under it. The page read as two unrelated blocks,
// and the child working down the right-hand column never met the heading at
// all.
//
// A title names a SECTION. So it takes the whole width of that section and
// nothing sits beside it at its own level: the columns begin below it. That is
// a fact about the geometry, not about the helper, which is why it is settled
// here rather than in section-label - the helper cannot see what is beside it.
//
// The move is a real one, not a style: the title comes out of its column and
// becomes a full-width row above the split, so the measurement, the fit check
// and the drawing all agree about where the columns now start.
//
// Only when exactly ONE column carries a title. Two titles side by side are
// two sections, each already spanning its own; and a title beside two untitled
// columns cannot be told which of them it names, so it is left where the
// designer put it rather than moved somewhere it may not belong.
function leadingSectionTitle(content) {
  // A numbered question that happens to open with a heading is one question,
  // not a section, and pulling its first part out would leave the number
  // beside the rest of it.
  if (!isStack(content) || content.number !== undefined) return null;
  const items = content.stack;
  // A column holding nothing but its title has nothing left to sit under it.
  if (items.length < 2) return null;
  const first = items[0];
  if (!first || first.helper !== "section-label") return null;
  return { title: first, rest: { ...content, stack: items.slice(1) } };
}

// Rewrites the tree, and the zones with it: the caller passes a copy of the
// zones because a title that moves has to leave the column it came from.
//
// `box` is how much of the printable page this node covers, in millimetres,
// carried down the walk the way flatten carries its rectangles. Nothing about
// the DRAWING needs it - a stack is placed from its children's measured
// heights and never from its parts. The tightness report is what needs it: it
// reads each zone's proportional share, so a title handed half the section's
// height would be reported as a heading 93mm tall, and the columns beside it
// as squashed into what was left.
function hoistSectionTitles(node, zones, box) {
  if (typeof node === "string") return node;

  const total = node.parts.reduce((a, b) => a + b, 0);
  const children = node.children.map((child, i) => {
    const share = node.parts[i] / total;
    const childBox =
      node.dir === "rows"
        ? { wMm: box.wMm, hMm: box.hMm * share }
        : { wMm: box.wMm * share, hMm: box.hMm };
    return hoistSectionTitles(child, zones, childBox);
  });

  const rebuilt = { dir: node.dir, parts: [...node.parts], children };
  if (node.dir !== "cols") return rebuilt;

  const titled = children
    .map((child) =>
      typeof child === "string"
        ? { id: child, found: leadingSectionTitle(zones[child]) }
        : { id: null, found: null }
    )
    .filter((c) => c.found);

  if (titled.length !== 1) return rebuilt;

  const { id, found } = titled[0];
  const titleId = `${id}-title`;
  zones[titleId] = found.title;
  zones[id] = found.rest;

  // The title's real height against what is left for the columns, measured at
  // the width it will actually have, less the gutter every zone loses.
  const titleMm = measureContent(found.title, Math.max(1, box.wMm - GUTTER_MM));
  return {
    dir: "rows",
    parts: [titleMm, Math.max(1, box.hMm - titleMm)],
    children: [titleId, rebuilt],
  };
}

// The geometry a sheet is actually drawn to, which is the layout's tree after
// any section title has been moved to the top of what it names. Everything
// that measures, checks or draws a sheet goes through here, so no two of them
// can be working from different pages.
function sheetGeometry(spec) {
  const layout = getLayout(spec.layout);
  const zones = { ...spec.zones };
  const area = printableArea(spec.orientation || "portrait", DEFAULT_MARGIN_MM);
  const tree = hoistSectionTitles(layout.tree, zones, {
    wMm: area.widthMm,
    hMm: area.heightMm,
  });
  return { tree, sheet: { ...spec, zones } };
}

function getLayout(id) {
  const found = [...LAYOUTS, ...VARIANTS].find((l) => l.id === id);
  if (!found) {
    throw new Error(
      `UNKNOWN_LAYOUT: "${id}". Known: ${[...LAYOUTS, ...VARIANTS].map((l) => l.id).join(", ")}`
    );
  }
  return found;
}

// Check every zone can hold what it has been given, BEFORE rendering anything.
// This is the promise the whole design rests on: the answer arrives at planning
// time, not after a page exists.
function checkFit(spec) {
  const { tree, sheet } = sheetGeometry(spec);
  const orientation = spec.orientation || "portrait";
  const area = printableArea(orientation, DEFAULT_MARGIN_MM);
  const problems = [];

  for (const zone of flatten(tree)) {
    const content = sheet.zones[zone.id];
    if (!content) continue;

    // The WIDTH is fixed by the layout, so it is checked against the layout.
    // The HEIGHT is not: a zone is as tall as its content turns out to be, and
    // a row's proportions are only a starting shape. Checking a helper against
    // its proportional share of the page height therefore tests a height the
    // zone will never have, and it refused two perfectly ordinary worksheets
    // for being too short in a zone that would have grown to fit them.
    //
    // What CAN be too short is the content itself: a drawing whose natural
    // height at this width comes out below its own usable minimum.
    const { wMm } = zoneContentMm(zone, area);
    const naturalMm = measureContent(content, wMm);
    const verdict = fits(content, wMm, naturalMm);

    if (!verdict.ok) {
      problems.push(
        `zone "${zone.id}" cannot hold ${describeContent(content)}: ${verdict.why}`
      );
    }
  }

  const named = Object.keys(spec.zones);
  const real = new Set(flatten(tree).map((z) => z.id));
  for (const id of named) {
    if (!real.has(id)) {
      problems.push(
        `zone "${id}" does not exist in layout "${spec.layout}" (it has: ${[...real].join(", ")})`
      );
    }
  }

  // Every zone can hold its own content, and the page still cannot hold the
  // lot. Content only ever grows from its natural height, never shrinks, so
  // natural height beyond the page is a refusal and not a near miss.
  //
  // This belongs here rather than only in renderSheet: the promise of this
  // function is that the answer arrives at planning time. Without it, a
  // designer choosing between layouts is told a shape works and only finds out
  // it does not once a page has been built.
  if (problems.length === 0) {
    const naturalMm = measureTree(tree, sheet, area.widthMm).height;
    if (naturalMm > area.heightMm) {
      problems.push(
        `the content needs ${Math.round(naturalMm)}mm but the page has ` +
          `${Math.round(area.heightMm)}mm, a shortfall of ` +
          `${Math.round(naturalMm - area.heightMm)}mm. ` +
          `Cut content or choose a roomier layout.`
      );
    }
  }

  return problems;
}

// Reported alongside the HTML so a caller can show it without re-measuring.
function measureFill(spec) {
  const { tree, sheet } = sheetGeometry(spec);
  const orientation = spec.orientation || "portrait";
  const area = printableArea(orientation, DEFAULT_MARGIN_MM);
  const measured = measureTree(tree, sheet, area.widthMm);
  // Natural height, before growth: the honest measure of how much content the
  // sheet actually carries. After growth it would always read 100%.
  return {
    usedMm: Math.round(measured.height),
    availableMm: Math.round(area.heightMm),
    fillPct: Math.round((measured.height / area.heightMm) * 100),
  };
}

function renderSheet(spec) {
  const problems = checkFit(spec);
  if (problems.length) {
    throw new Error(`SHEET_DOES_NOT_FIT:\n  ${problems.join("\n  ")}`);
  }

  const { tree, sheet } = sheetGeometry(spec);
  const orientation = spec.orientation || "portrait";
  const page = pageSize(orientation);
  const decorationLayers = renderDecorationLayers(spec.decorations, page);
  const area = printableArea(orientation, DEFAULT_MARGIN_MM);

  // Measure the tree, let what can grow grow, then place real rectangles.
  const measured = measureTree(tree, sheet, area.widthMm);
  const naturalMm = measured.height; // before anything is allowed to grow
  const { short } = growToFit(measured, area.heightMm);

  if (short > 0) {
    throw new Error(
      `SHEET_DOES_NOT_FIT:
  the content needs ${Math.round(measured.height)}mm ` +
        `but the page has ${Math.round(area.heightMm)}mm, ` +
        `a shortfall of ${Math.round(short)}mm. Cut content or choose a roomier layout.`
    );
  }

  // How much of the page the content actually uses. Reported, not enforced:
  // the old Word builder refuses below 78% unless the designer writes down why
  // the space is deliberate, but its percentages were PLANNED budgets, whereas
  // these are measured from real content, so the same number may not be the
  // right one here. Surfacing it lets a threshold be set from evidence once
  // real lessons have run, rather than guessed now.
  //
  // Note the distinction Daniel drew: a strip at the foot of the page is fine,
  // a teacher trims it. Half a page missing is not.
  // Measured BEFORE growth. After growth this is always 100%, because the
  // greedy helpers have soaked up the spare, which tells you nothing about how
  // much real content the sheet carries.
  const fillPct = Math.round((naturalMm / area.heightMm) * 100);

  const zones = placeTree(measured, 0, 0, area.widthMm)
    .map((p) => {
      const inner = p.content ? renderContent(p.content, p.w - GUTTER_MM) : "";
      // The zone id travels into the DOM so the browser check can name the
      // zone a clipped child actually sits in. Calculated fit is an estimate
      // made before any font loaded; what the page DOES is the only thing a
      // child ever sees.
      return `
      <div class="zone zone--${p.id}" data-worksheet-zone="${p.id}" style="
        left:${p.x}mm;
        top:${p.y}mm;
        width:${p.w - GUTTER_MM}mm;
        height:${p.h}mm;">${inner}</div>`;
    })
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${spec.title || "Worksheet"}</title>
<style>
${cssVariables()}

  @page { size: ${page.widthMm}mm ${page.heightMm}mm; margin: 0; }
  html, body { margin: 0; padding: 0; }

  body {
    font-family: var(--font);
    color: var(--colour-ink);
    width: ${page.widthMm}mm;
    height: ${page.heightMm}mm;
    padding: ${DEFAULT_MARGIN_MM}mm;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .decoration-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }
  .decoration-layer--low { z-index: 0; }
  .decoration-layer--high { z-index: 2; }
  .decoration {
    position: absolute;
    display: block;
    object-fit: contain;
    transform-origin: center center;
  }

  .area { position: relative; width: 100%; height: 100%; z-index: 1; }
  .zone { position: absolute; box-sizing: border-box; overflow: hidden; }

  /* A full-page data table owns the remaining page after any heading above
     it. Let its rows share that real height instead of stopping at the
     arithmetic estimate and leaving a large false blank below the table.
     Other layouts keep data tables at their natural reading height. */
  .area--full .h-stack-item:has(> .h-data) { flex: 1 1 auto; }
  .area--full .h-stack-item > .h-data { height: 100%; }

  /* The learning objective, printed small at the top of the sheet. */
  .lo {
    position: absolute; left: 0; top: 0;
    font-size: var(--type-note);
    color: var(--colour-quiet);
    z-index: 3;
  }

  /* The sheet's code, when a worksheet holds more than one level. It is a
     CODE and not a level name on purpose: three sheets printed as one file
     have to be sortable into piles by the teacher, and "Below" printed at the
     top of a page is read by the child holding it. Carried over from the Word
     builder, which made the same call. */
  .sheet-code {
    position: absolute; right: 0; top: 0;
    font-size: var(--type-note);
    color: var(--colour-quiet);
    z-index: 3;
  }

${helperCss}
</style></head>
<body data-worksheet-page>
  ${decorationLayers.low}
  ${spec.lo ? `<div class="lo">${spec.lo}</div>` : ""}
  ${spec.code ? `<div class="sheet-code">${spec.code}</div>` : ""}
  <div class="area${spec.layout === "full" ? " area--full" : ""}">${zones}</div>
  ${decorationLayers.high}
</body></html>`;
}

module.exports = {
  renderSheet,
  checkFit,
  getLayout,
  measureFill,
  zoneContentMm,
  GUTTER_MM,
  // Exported so the tightness report describes the page that was DRAWN. A
  // report worked out from the layout's own tree would still be measuring a
  // section title inside the column it used to sit in.
  sheetGeometry,
};
