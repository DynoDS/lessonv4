"use strict";

// Which layout should this content go in?
//
// The engine could already answer "does this fit?" for one layout you had
// already chosen. That is the wrong way round: it means a designer picks a
// shape, gets refused, and guesses again. This asks the question the other way.
// Hand it the pieces of content in reading order and it tries every layout,
// reporting which ones hold them and how well each fills the page.
//
// This replaces the hand-written compatibility table the slide deck keeps
// (templates.md section 5, about 40 helpers against 8 zone classes, maintained
// by hand and therefore able to drift). Nothing here is written down twice:
// every answer is computed from the layouts and the helpers themselves, so it
// cannot fall out of step with them.

const { LAYOUTS, VARIANTS, flatten } = require("./layouts");
const { checkFit, measureFill } = require("./render");
const { zoneContentMm } = require("./render");
const { printableArea, DEFAULT_MARGIN_MM } = require("./page");
const { measureContent, describeContent, needsContent } = require("./helpers");

const ORIENTATIONS = ["portrait", "landscape"];

// A sheet may be sparse: leftover collects at the foot of the page where a
// teacher trims it. But half an empty page is not sparse, it is the wrong
// shape. This is where that line is drawn, and it is a starting point from
// real lessons rather than a fixed rule.
const ROOMY_BELOW_PCT = 70;
const TIGHT_ABOVE_PCT = 98;

// The fill a sheet is aimed at. Full enough that the page is worth printing,
// with enough left over that the arithmetic can be a millimetre out - which it
// routinely is - and the zone still has somewhere to put the difference.
const TARGET_FILL_PCT = 88;

function verdictFor(fillPct) {
  if (fillPct < ROOMY_BELOW_PCT) return "roomy";
  if (fillPct > TIGHT_ABOVE_PCT) return "tight";
  return "good";
}

// What this shape does to the WORK, before anything is said about how full the
// page looks.
//
// Fill was the only thing this ranking measured, and "88% full" describes a
// page from the outside. Two shapes can fill a page identically and be nothing
// alike inside it: one gives a photograph the width to be looked at, the other
// squeezes it to the narrowest size the engine will accept and spends the width
// it saved on writing lines that had enough already. The second one is not a
// near miss on aesthetics, it is a page a child works from badly, and it was
// winning whenever its percentage came out closer to the target.
//
// So the hard things are counted first: a part at the edge of its usable width,
// and a part given less height than it asked for. Both are already measured by
// the room report, and neither is a matter of taste.
function strainOf(spec) {
  try {
    const { tightnessOf } = require("./tightness");
    const room = tightnessOf(spec);
    // A squashed part is worse than a narrow one: narrow is uncomfortable and
    // squashed is content that did not fit in the space it was drawn into.
    return room.squashed.length * 2 + room.cramped.length;
  } catch {
    // A shape that cannot be reported on is not a shape to promote, but it is
    // not a refusal either - checkFit has already had its say.
    return 0;
  }
}

// How far a page is from the fill it should be aimed at, in a single number
// that can be sorted on. The two ends are not symmetrical on purpose: a roomy
// page wastes paper and a teacher trims it, whereas a page with no spare left
// clips its content and is refused outright, so being over the tight line is
// penalised far more steeply than being under the roomy one.
function comfortPenalty(fillPct) {
  if (!Number.isFinite(fillPct)) return Number.POSITIVE_INFINITY;
  if (fillPct > TIGHT_ABOVE_PCT) {
    return 40 + (fillPct - TIGHT_ABOVE_PCT) * 10;
  }
  if (fillPct < ROOMY_BELOW_PCT) {
    return 20 + (ROOMY_BELOW_PCT - fillPct) * 2;
  }
  return Math.abs(fillPct - TARGET_FILL_PCT);
}

// Every layout, at both orientations unless one is asked for.
function candidates(orientation) {
  const wanted = orientation ? [orientation] : ORIENTATIONS;
  const out = [];
  for (const layout of [...LAYOUTS, ...VARIANTS]) {
    for (const o of wanted) {
      out.push({ layout, orientation: o });
    }
  }
  return out;
}

// Content arrives as a list in reading order, not already keyed to zone names,
// because the whole point is that the caller does not yet know which layout
// they are using. Zones come back from flatten in reading order too, so the
// first piece of content lands in the first zone.
function specFor(items, layout, orientation, extra) {
  const zoneIds = flatten(layout.tree).map((z) => z.id);
  const zones = {};
  items.forEach((item, i) => {
    zones[zoneIds[i]] = item;
  });
  // The build numbers `question:true` wrappers before measuring them. A number
  // adds a real left gutter, so measuring the raw wrappers can approve an 84mm
  // zone that becomes 90mm wide once question numbers are present. Suggestion
  // and build must see the same final geometry.
  const { numbered } = require("./worksheet");
  return { ...extra, layout: layout.id, orientation, zones: numbered(zones) };
}

/**
 * Rank every layout that can hold this content.
 *
 * @param {Array} items    content specs in reading order, one per zone
 * @param {Object} options
 *   orientation  "portrait" | "landscape", or omitted to consider both
 *   extra        anything else the spec needs (title, lo), used for measuring
 * @returns {{ fits: Array, refused: Array, wrongZoneCount: number }}
 *   fits     ranked best first, each { layout, name, orientation, fillPct, verdict }
 *   refused  layouts with the right number of zones that still cannot hold it,
 *            each carrying the reason, so a near miss is visible rather than
 *            silently absent
 */
function suggestLayouts(rawItems, options = {}) {
  const { orientation, extra = {}, yearGroup } = options;

  // Measured exactly as a build measures it, or this answers a question nobody
  // asked. A writing line is 8mm for Years 1 to 3 and 6mm for Years 4 to 6, so
  // without the year group a Year 4 sheet is measured on the younger line and
  // comes back shorter than the build will find it - and the layout this
  // recommends is then refused, with the designer left guessing again.
  const { withPhase, phaseFor } = require("./worksheet");
  const items = rawItems.map((item) => withPhase(item, phaseFor(yearGroup)));

  const fits = [];
  const refused = [];
  let wrongZoneCount = 0;

  for (const { layout, orientation: o } of candidates(orientation)) {
    const zoneIds = flatten(layout.tree).map((z) => z.id);

    // A layout with the wrong number of zones is not a near miss, it is a
    // different shape. Counted rather than listed, so the report stays short.
    if (zoneIds.length !== items.length) {
      wrongZoneCount += 1;
      continue;
    }

    const spec = specFor(items, layout, o, extra);
    const problems = checkFit(spec);

    if (problems.length) {
      // Measured HERE rather than kept for later, because keeping the spec would
      // mean carrying an inlined photograph around in the result a caller may
      // print. A refused spec still measures: content is measured before it is
      // placed, which is what makes a shortfall in millimetres available at all.
      const fill = measureFill(spec);

      // The two ways a shape can refuse, kept apart, because they call for
      // opposite moves. A page-level overflow means the content is taller than
      // any page and no rearrangement helps. A zone too narrow for what it holds
      // means THIS shape is wrong and a wider-zoned one may be right. Reported
      // in one breath they cancel out, which is how a reader ends up trying more
      // shapes against content that cannot fit on paper.
      const area = printableArea(o, DEFAULT_MARGIN_MM);
      let widthShortMm = 0;
      flatten(layout.tree).forEach((zone) => {
        const content = spec.zones[zone.id];
        if (!content) return;
        const { wMm } = zoneContentMm(zone, area);
        const needed = needsContent(content).minWidthMm || 0;
        widthShortMm = Math.max(widthShortMm, Math.round(needed - wMm));
      });

      refused.push({
        layout: layout.id,
        name: layout.name,
        orientation: o,
        why: problems,
        usedMm: fill.usedMm,
        availableMm: fill.availableMm,
        heightShortMm: Number.isFinite(fill.fillPct) ? fill.usedMm - fill.availableMm : null,
        widthShortMm,
      });
      continue;
    }

    const fill = measureFill(spec);

    // Content that cannot be measured is not a fit. A photograph still held as
    // a filename has no width or height yet, so every sum involving it comes
    // out NaN - and NaN compares false against both thresholds, so the verdict
    // fell through to "good" and the layout was recommended. That is the one
    // thing this tool must never do: the build resolves pictures before it
    // measures, refuses what will not fit, and the designer who trusted the
    // recommendation is left re-guessing shapes.
    if (!Number.isFinite(fill.fillPct)) {
      refused.push({
        layout: layout.id,
        name: layout.name,
        orientation: o,
        why: [
          "this content cannot be measured yet. A photograph named by " +
            "`imagePath` has no size until the file is read, so resolve images " +
            "first (src/images.js resolveImages, as the build does) and ask again.",
        ],
      });
      continue;
    }

    fits.push({
      layout: layout.id,
      name: layout.name,
      orientation: o,
      zones: zoneIds,
      fillPct: fill.fillPct,
      usedMm: fill.usedMm,
      availableMm: fill.availableMm,
      verdict: verdictFor(fill.fillPct),
      strain: strainOf(spec),
    });
  }

  // Best first: closest to comfortably full, NOT fullest.
  //
  // This sorted by raw percentage, highest first, which is the opposite of what
  // the line above it has always claimed. The layout offered at the top of the
  // list was therefore always the tightest one available, and a designer told
  // to take what the tool gives got handed the shape nearest the edge every
  // time. Every millimetre of estimate error then had nowhere to go, because
  // the spare a zone borrows to be wrong in is the spare this ranking had just
  // spent. That is how a sheet came back 6px over and cost a whole lesson its
  // worksheets.
  //
  // So rank by comfort. A page a little roomier than ideal is a page a teacher
  // trims; a page with nothing left over is a page that clips.
  //
  // And rank what the shape does to the work ahead of that, because a
  // percentage is a fact about the page and a squeezed picture is a fact about
  // the lesson. Fill decides between shapes that treat the content equally
  // well, which is most of them; it never promotes one that treats it worse.
  fits.sort(
    (a, b) =>
      a.strain - b.strain ||
      comfortPenalty(a.fillPct) - comfortPenalty(b.fillPct)
  );

  return {
    fits,
    refused,
    wrongZoneCount,
    verdict: fits.length ? null : diagnose(items, refused, wrongZoneCount),
  };
}

/**
 * Roomier arrangements of a sheet that has already been written.
 *
 * `suggestLayouts` answers "which layout should this content go in?" before a
 * sheet exists, from raw items. This asks the same question about a sheet that
 * is already final - zones numbered, writing lines sized to the year group -
 * which is what the build is holding when a browser reports a clipped zone.
 *
 * Nothing about the sheet's content changes. Zones are read in reading order
 * and put back in reading order, so a question that followed another still
 * does. The orientation is kept, because the page shape is the designer's
 * decision and any decorations are framed against it: only the arrangement of
 * the zones on that page changes.
 *
 * @returns {Array} roomier arrangements, most comfortable first
 */
function roomierArrangements(spec) {
  const { getLayout } = require("./render");
  const current = getLayout(spec.layout);
  const orientation = spec.orientation === "landscape" ? "landscape" : "portrait";

  const items = flatten(current.tree).map((z) => z.id).map((id) => spec.zones[id]);
  const currentFill = measureFill(spec);
  if (!Number.isFinite(currentFill.fillPct)) return [];

  const out = [];
  for (const layout of [...LAYOUTS, ...VARIANTS]) {
    if (layout.id === current.id) continue;
    const ids = flatten(layout.tree).map((z) => z.id);
    if (ids.length !== items.length) continue;

    const zones = {};
    ids.forEach((id, i) => {
      zones[id] = items[i];
    });
    const candidate = { ...spec, layout: layout.id, orientation, zones };

    if (checkFit(candidate).length) continue;
    const fill = measureFill(candidate);
    if (!Number.isFinite(fill.fillPct)) continue;

    // Only a genuinely roomier shape is worth drawing again. An arrangement as
    // tight as the one that just clipped has the same nowhere to put the
    // millimetre, and would clip in the same way.
    if (fill.fillPct >= currentFill.fillPct) continue;

    out.push({
      spec: candidate,
      layout: layout.id,
      name: layout.name,
      orientation,
      fillPct: fill.fillPct,
    });
  }

  out.sort((a, b) => comfortPenalty(a.fillPct) - comfortPenalty(b.fillPct));
  return out;
}

// Why NOTHING fits, answered once, in millimetres.
//
// Every number here was already computed and thrown away. The checker measures
// a page's shortfall exactly ("needs 314mm, the page has 267mm") and this tool
// reported it only as one refusal reason among many, three at a time, per shape.
// So a designer facing an over-full brief saw a wall of individual noes and had
// no way to tell the two cases apart: content that is 8mm over, where a
// different shape genuinely rescues it, and content that is 47mm over, where no
// shape in any library will and the brief itself is too big for a page.
//
// Guessing between those two is what a re-run costs, and the answer was sitting
// in the arithmetic the whole time. So it is stated: how far over, and which
// single item is the most expensive, because that is the item whose removal or
// plainer asking buys the most.
function diagnose(items, refused, wrongZoneCount) {
  if (!refused.length) {
    // The counts the library actually holds, computed rather than written down,
    // so this cannot go stale as shapes are added. Naming the nearest count that
    // EXISTS matters: advising "group down to seven" when there is no seven-zone
    // shape either sends the reader round the same loop a second time.
    const available = new Set(
      [...LAYOUTS, ...VARIANTS].map((l) => flatten(l.tree).length)
    );
    const most = Math.max(...available);
    const target = items.length > most ? most : Math.max(...[...available].filter((n) => n < items.length));

    return {
      kind: "wrong-zone-count",
      shortfallMm: null,
      lines: [
        `No layout in the library has ${items.length} zones` +
          `${wrongZoneCount ? ` (${wrongZoneCount} shapes were tried at other zone counts)` : ""}. ` +
          `It holds shapes of ${[...available].sort((a, b) => a - b).join(", ")} zones.`,
        `A zone holds as much as you put in it, so this is a grouping question rather ` +
          `than a missing shape: several questions sharing one zone as a \`stack\` is ` +
          `normal and is how a block of six fluency questions reaches a page. Regroup ` +
          `to ${target} zones or fewer and ask again.`,
      ],
    };
  }

  // How far each shape is from working, counted in millimetres of the two things
  // that can be short. Adding them gives one number to rank by, so the report
  // names the single closest miss rather than mixing the height of one shape with
  // the width of another - which reads as two separate problems and sends the
  // reader looking for a shape that solves neither.
  const misses = refused
    .filter((r) => r.heightShortMm !== null)
    .map((r) => ({
      ...r,
      hMm: Math.max(0, r.heightShortMm),
      wMm: Math.max(0, r.widthShortMm),
      totalMm: Math.max(0, r.heightShortMm) + Math.max(0, r.widthShortMm),
    }));

  const closest = misses.reduce((b, r) => (b === null || r.totalMm < b.totalMm ? r : b), null);
  // Is the page height achievable AT ALL, in any shape? That is the question that
  // decides whether another shape is worth trying, and it has to be asked across
  // every shape rather than of the closest one.
  const heightAchievable = misses.some((r) => r.hMm === 0);

  const lines = [];
  const heaviest = heaviestItem(items);

  if (!closest) {
    return {
      kind: "see-reasons",
      shortfallMm: null,
      lines: [`Every shape with the right number of zones refused. The reasons are below.`],
    };
  }

  const where = `${closest.layout}, ${closest.orientation}`;

  if (closest.hMm && closest.wMm) {
    lines.push(
      `The closest shape (${where}) is short both ways: ${closest.hMm}mm of height and ` +
        `${closest.wMm}mm of width in its tightest zone.`
    );
  } else if (closest.hMm) {
    lines.push(
      `The closest shape (${where}) is over by ${closest.hMm}mm: the content needs ` +
        `${closest.usedMm}mm and the page has ${closest.availableMm}mm.`
    );
  } else {
    lines.push(
      `The closest shape (${where}) fits the page height with ` +
        `${Math.abs(closest.heightShortMm)}mm to spare, and fails on WIDTH: its tightest ` +
        `zone is ${closest.wMm}mm too narrow for what it holds.`
    );
  }

  if (!heightAchievable) {
    lines.push(
      `No shape gets this inside a page's height. Rearranging zones moves height around ` +
        `a page, it does not create any, so cutting is what is left rather than another ` +
        `shape - stop trying shapes.`
    );
  } else if (closest.wMm) {
    // The trap this line exists to close. Widening a zone is the obvious answer
    // to "too narrow" and for a PHOTOGRAPH it backfires: a picture is scaled by
    // its width and its height follows, so a wider zone holds a taller picture
    // and the page total grows. That is why a picture-led sheet that misses on
    // width is usually asking for one picture too many rather than the wrong
    // shape, and why an hour can go into shapes that were never going to work.
    lines.push(
      `Fewer, wider zones is the obvious next move and it is worth one try - but note ` +
        `that a picture is scaled by its WIDTH and its height follows, so a wider zone ` +
        `holds a TALLER picture. On a picture-led sheet, widening usually trades a width ` +
        `refusal for a height one, and the real answer is one picture fewer.`
    );
  }

  if (heaviest) {
    lines.push(
      `The most expensive single item is ${heaviest.what}: ${heaviest.mm}mm tall at the ` +
        `narrowest it is allowed to be. Composing it with another item that shares its ` +
        `picture, asking it without its picture, or taking it off and saying so in ` +
        `\`notes\` are the three moves, in that order.`
    );
  }

  return {
    kind: !heightAchievable ? "too-tall-for-any-page" : closest.wMm ? "too-narrow" : "over-full",
    shortfallMm: closest.totalMm,
    lines,
  };
}

// The most expensive item, so "what should go" is answered with the content
// rather than left to the reader's guess.
//
// Measured at each item's OWN smallest allowed width, not at full page width.
// Measured across the page a photograph reports a height it would only have if
// it were given the whole sheet - 273mm for a picture whose honest cost is 104mm
// - which overstates every picture and understates every block of text, so the
// wrong item gets named as the expensive one.
function heaviestItem(items) {
  const { widthMm: pageMm } = printableArea("portrait", DEFAULT_MARGIN_MM);
  let worst = null;
  for (const item of items) {
    const floorMm = needsContent(item).minWidthMm || pageMm;
    const mm = measureContent(item, Math.min(floorMm, pageMm));
    if (!Number.isFinite(mm)) continue;
    if (worst === null || mm > worst.mm) {
      worst = { mm: Math.round(mm), what: describeContent(item) };
    }
  }
  return worst;
}

// A plain-text version, for a person or an agent reading a build log.
function describeSuggestions(result, limit = 8) {
  const lines = [];
  if (!result.fits.length) {
    // The verdict goes FIRST and in millimetres. Underneath it the individual
    // refusals still print, because a near miss is worth seeing - but a reader
    // who stops after the first two lines now has the whole answer rather than
    // the impression that another shape might work.
    lines.push("No layout can hold this content.");
    if (result.verdict) lines.push("", ...result.verdict.lines, "");
  } else {
    lines.push(`${result.fits.length} layouts fit. Best first:`);
    for (const f of result.fits.slice(0, limit)) {
      lines.push(
        `  ${f.fillPct}% ${f.verdict.padEnd(5)} ${f.layout} (${f.orientation}) - ${f.name}`
      );
    }
  }
  if (result.refused.length) {
    lines.push(`${result.refused.length} layouts have the right number of zones but cannot hold it, for example:`);
    for (const r of result.refused.slice(0, 3)) {
      lines.push(`  ${r.layout} (${r.orientation}): ${r.why[0]}`);
    }
  }
  return lines.join("\n");
}

module.exports = {
  suggestLayouts,
  roomierArrangements,
  describeSuggestions,
  verdictFor,
  comfortPenalty,
  ROOMY_BELOW_PCT,
  TIGHT_ABOVE_PCT,
  TARGET_FILL_PCT,
};
