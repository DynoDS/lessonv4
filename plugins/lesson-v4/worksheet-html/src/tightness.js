"use strict";

// Does this sheet fit NICELY, or only legally?
//
// The engine already answers three questions: does everything fit, does
// anything get clipped, and how much of the page is used. All three can pass on
// a page nobody would hand to a child. A diagram squeezed to exactly its
// smallest usable size, sitting beside writing lines with room to spare, is a
// legal page and a bad one.
//
// What can be measured is HEADROOM: how much bigger than its own floor each
// part actually came out.
//
//   1.0   at the edge of usable
//   1.5   comfortable
//   3.0+  roomy
//
// A part at 1.0 is worth knowing about. A part at 1.0 with a sibling at 3.0 is
// worse, because the room existed and went somewhere that needed it less.
//
// This REPORTS. It does not refuse. Where the line sits between snug and too
// tight is a teacher's judgement about a printed page, and it should come from
// real sheets rather than a number picked in here.

const { flatten } = require("./layouts");
const { printableArea, DEFAULT_MARGIN_MM } = require("./page");
const { sheetGeometry, zoneContentMm, drawnZoneHeights, GUTTER_MM } = require("./render");
const { inspectContent } = require("./helpers");

// At or below this, a part is at the edge of what a child can use.
const CRAMPED = 1.15;
// A part with this much more headroom than a cramped sibling had room to give.
const LOPSIDED = 2.0;

// Blank height left under something that cannot use it. Both tests have to pass
// before it is worth saying: the millimetres, because that is what decides
// whether another question would have fitted, and the ratio, so a tall item with
// a little slack is not nagged about a rounding error.
//
// 20mm is about one question and its answer line, which is the smallest gap a
// teacher would look at and think "something could have gone there".
const SPARE_MM = 20;
const SPARE_RATIO = 1.25;

function walk(node, fn, depth = 0) {
  fn(node, depth);
  for (const part of node.parts) walk(part, fn, depth + 1);
}

function tightnessOf(spec) {
  // The same geometry the sheet is drawn to, so the report is about the page a
  // teacher will hold. A section title that moved to the top of the columns it
  // names is full width THERE, and a report still measuring it inside one
  // column would be describing a page nobody printed.
  const { tree, sheet } = sheetGeometry(spec);
  const orientation = spec.orientation || "portrait";
  const area = printableArea(orientation, DEFAULT_MARGIN_MM);

  // The height each zone is DRAWN at, not its share of the layout tree.
  //
  // Those are different numbers and the difference is the whole report. A
  // zone's share is a starting shape; `growToFit` then sizes each zone to what
  // it holds, which is why two stacked layouts with different declared ratios
  // draw the identical page. Measuring against the share invented blank paper
  // nobody prints: the balanced-diet Expected sheet's four step lines were
  // reported as "needs 46mm and was given 267mm, so 221mm below it prints
  // empty" while the build drew that zone at 47.79mm with the questions beside
  // it, and the same false line fires on any short support panel in a
  // full-height column, which is most of them (5 September 2026). A designer
  // chasing it pads or moves a panel that was right.
  const drawn = drawnZoneHeights(spec);

  const zones = [];
  for (const zone of flatten(tree)) {
    const content = sheet.zones[zone.id];
    if (!content) continue;
    const { wMm } = zoneContentMm(zone, area);
    const drawnMm = drawn[zone.id];
    const hMm = Number.isFinite(drawnMm) ? drawnMm : zoneContentMm(zone, area).hMm;
    const inspected = inspectContent(content, wMm, hMm);
    // A zone hands its content the zone's height the same way a row hands its
    // items the row's height, so the top of the tree is imposed too. Without
    // this a sheet whose one zone is half empty reports nothing at all - and
    // with the drawn height above, "half empty" now means the page really is.
    inspected.heightImposed = true;
    zones.push({ id: zone.id, tree: inspected });
  }

  const cramped = [];
  const lopsided = [];
  const squashed = [];
  const spare = [];

  for (const zone of zones) {
    // Only LEAVES are judged. A group's own headroom is the headroom of
    // whichever part is tightest, so reporting both says the same thing twice.
    const leaves = [];
    walk(zone.tree, (n) => {
      if (!n.parts.length) leaves.push(n);
    });

    // Judged on WIDTH. Height cannot say anything useful in a stack, where
    // every item is given exactly the height it asked for and so always scores
    // one: reporting that flagged every part of every sheet, which is the same
    // as reporting nothing. Width is where a part genuinely gets squeezed.
    for (const leaf of leaves) {
      if (leaf.widthHeadroom <= CRAMPED) {
        cramped.push({ zone: zone.id, label: leaf.label, headroom: leaf.widthHeadroom });
      }
      // A row gives its items the row's height, so one CAN come out shorter
      // than it wanted. That is a squash, and it is separate from being narrow.
      if (leaf.heightHeadroom < 0.98) {
        squashed.push({
          zone: zone.id,
          label: leaf.label,
          gotMm: leaf.gotHeightMm,
          wantedMm: leaf.needHeightMm,
        });
      }
    }

    // Blank height under something that gains nothing from it.
    //
    // Every node is looked at, not just the leaves, because the waste can sit at
    // either level: a whole row shorter than the zone holding it, or one short
    // item inside a row that is otherwise full. Reporting the node where the gap
    // actually is keeps it to one line either way - when a row fills its zone,
    // the row itself has no spare and only the short item inside it speaks up.
    //
    // What makes this safe to say out loud is knowing how much room each thing
    // can actually SPEND. A chart, a diagram or a set of questions spends
    // nothing above its natural height, so everything above it is blank paper.
    // Writing lines, sorting frames and recording tables spend some and then
    // stop - see `enough` in helpers/index.js - so the height above THAT is
    // blank paper too, even though it sits inside a box a child writes in.
    //
    // That second case is the one this report used to be blind to. The test was
    // `greed === 0`, which reads as "anything that can grow has used what it
    // was given", and a recording table holding one four-digit number was drawn
    // with a 30mm blank row while the report said the sheet was sound.
    //
    // A surface a child DRAWS on is the exception, and it is why `fills` is
    // asked about here: a short column's leftover has nowhere else to go, and
    // more paper to draw on is genuinely more of the work.
    // Outermost gap only. A row is handed its zone's height and passes that same
    // height to every item inside it, so an over-tall row and each of its
    // children all show the identical gap. Reporting each one says the same
    // sentence three times and points at three places to fix what is one
    // decision. Stop at the first node that owns the gap and leave its insides
    // alone; when the row itself is the right size, the walk carries on and
    // finds the short item inside it, which is where the gap really is.
    const findSpare = (n) => {
      // The height this part can honestly account for: its natural size when
      // nothing about it gains from more, and its useful size when something
      // does.
      const usableMm =
        n.greed === 0
          ? n.needHeightMm
          : Math.max(n.needHeightMm, n.usefulHeightMm);
      const spareMm = n.gotHeightMm - usableMm;
      const reportable =
        n.heightImposed &&
        !n.fills &&
        Number.isFinite(usableMm) &&
        usableMm > 0 &&
        spareMm >= SPARE_MM &&
        n.gotHeightMm / usableMm >= SPARE_RATIO;

      if (reportable) {
        spare.push({
          zone: zone.id,
          label: n.label,
          gotMm: n.gotHeightMm,
          needMm: usableMm,
          spareMm,
          // Blank paper under something that cannot use height reads
          // differently from a box drawn bigger than the answer it holds, and
          // the repair is different too, so the report says which it found.
          overgrown: n.greed > 0,
          node: n,
        });
        return;
      }
      for (const part of n.parts) findSpare(part);
    };
    findSpare(zone.tree);

    // Room that went to a part which needed it less than its neighbour did.
    const tightest = Math.min(...leaves.map((l) => l.widthHeadroom));
    for (const leaf of leaves) {
      if (
        tightest <= CRAMPED &&
        leaf.widthHeadroom >= tightest * LOPSIDED &&
        Number.isFinite(leaf.widthHeadroom)
      ) {
        lopsided.push({
          zone: zone.id,
          label: leaf.label,
          headroom: leaf.widthHeadroom,
          tightest,
        });
      }
    }
  }

  // What no zone claimed.
  //
  // Zone heights are content heights, so a page can be half empty with every
  // zone on it correctly sized - and it should still say so. This used to be
  // told by accident: a single full-page zone was handed the whole printable
  // height whatever it held, so one short question on a whole page reported
  // 200mm of blank paper under itself. That was a true message reached by a
  // false route, and the route went when zones stopped growing past their
  // useful size. The message is kept, at the level it belongs to: the page's.
  const pageSpareMm = Math.max(0, area.heightMm - treeHeightMm(tree, drawn));

  return { zones, cramped, lopsided, squashed, spare, pageSpareMm };
}

// How tall the drawn page actually is: the same two rules the layout tree is
// measured by, read off the heights each zone was DRAWN at.
function treeHeightMm(node, drawn) {
  if (typeof node === "string") {
    const h = drawn[node];
    return Number.isFinite(h) ? h : 0;
  }
  const kids = node.children.map((child) => treeHeightMm(child, drawn));
  if (node.dir === "cols") return Math.max(...kids);
  return kids.reduce((a, b) => a + b, 0) + (kids.length - 1) * GUTTER_MM;
}

function describeTightness(result) {
  const lines = [];
  // The same nodes the spare list settled on, so the mark beside a line and the
  // list underneath can never disagree about where the gap is.
  const spareNodes = new Set(result.spare.map((s) => s.node));

  for (const zone of result.zones) {
    lines.push(`zone "${zone.id}"`);
    walk(zone.tree, (n, depth) => {
      const worst = n.widthHeadroom;
      const isSpare = spareNodes.has(n);
      const mark =
        worst <= CRAMPED
          ? "  <- narrow"
          : n.heightHeadroom < 0.98
            ? "  <- squashed"
            : isSpare
              ? `  <- ${Math.round(n.gotHeightMm - n.needHeightMm)}mm blank below`
              : "";
      lines.push(
        `${"  ".repeat(depth + 1)}${n.label.padEnd(38 - depth * 2)} ` +
          `${Math.round(n.gotWidthMm)}x${Math.round(n.gotHeightMm)}mm ` +
          `(needs ${Math.round(n.needWidthMm)}x${Math.round(n.needHeightMm)}) ` +
          `${Number.isFinite(worst) ? worst.toFixed(1) + "x" : "-"}${mark}`
      );
    });
  }

  if (result.pageSpareMm >= SPARE_MM) {
    lines.push(
      `\nThe page ends ${Math.round(result.pageSpareMm)}mm early. A strip at the FOOT of a sheet is` +
        "\n  trimmed and never noticed, so this is not the fault the list below describes - it is" +
        "\n  worth a look only if the sheet feels short for the lesson."
    );
  }

  if (!result.cramped.length && !result.squashed.length && !result.spare.length) {
    lines.push("\nNothing is cramped, and nothing is sitting over blank paper.");
    return lines.join("\n");
  }

  if (result.squashed.length) {
    lines.push("\nGiven less height than it wanted:");
    for (const s of result.squashed) {
      lines.push(
        `  zone "${s.zone}": ${s.label} got ${Math.round(s.gotMm)}mm, ` +
          `wanted ${Math.round(s.wantedMm)}mm`
      );
    }
  }

  if (result.spare.length) {
    lines.push(
      "\nSitting over blank paper, because it cannot use spare height:"
    );
    for (const s of result.spare) {
      lines.push(
        s.overgrown
          ? `  zone "${s.zone}": ${s.label} stops gaining at ${Math.round(s.needMm)}mm ` +
            `and was drawn ${Math.round(s.gotMm)}mm, so ${Math.round(s.spareMm)}mm of it is ` +
            `a box bigger than the answer it holds`
          : `  zone "${s.zone}": ${s.label} needs ${Math.round(s.needMm)}mm and was given ` +
            `${Math.round(s.gotMm)}mm, so ${Math.round(s.spareMm)}mm below it prints empty`
      );
    }
    lines.push(
      "  You cannot fill this with more questions - the question text is upstream's\n" +
        "  and you write none of it. What you own is the room, so spend it:\n" +
        "  1. Give it to the child. Room under a question is answer space waiting to\n" +
        "     be claimed: a helper the child writes into holds the height honestly\n" +
        "     where a bare question list leaves it blank.\n" +
        "  2. Move something beside it that WOULD use the room - writing lines, a\n" +
        "     sorting frame, a blank surface - rather than leaving it next to\n" +
        "     something that cannot.\n" +
        "  3. Take the height back: a shape whose zone here is shorter, or a smaller\n" +
        "     item beside it, so the work sits tight and the spare paper gathers\n" +
        "     after it ends instead of printing as gaps inside it.\n" +
        "  A short sheet is not a fault - there is no rule that a page must be full,\n" +
        "  and nothing gets invented to fill one. The fault is a gap INSIDE the\n" +
        "  arrangement: in a book it reads as a mistake, where work that simply ends\n" +
        "  reads as a short sheet.\n" +
        "  Leave the room alone when the blank is the design: space a child needs to\n" +
        "  work in around the figure, or a deliberately short sheet for a child who\n" +
        "  stalls at a full page. The report cannot tell those apart, so that call\n" +
        "  is yours."
    );
  }

  if (result.cramped.length) {
    lines.push("\nNear its narrowest usable width, so worth a look on paper:");
    for (const c of result.cramped) {
      lines.push(
        `  zone "${c.zone}": ${c.label} got ${c.headroom.toFixed(1)}x its narrowest usable width`
      );
    }
  }

  if (result.lopsided.length) {
    lines.push("\nRoom went somewhere that needed it less:");
    for (const l of result.lopsided) {
      lines.push(
        `  zone "${l.zone}": ${l.label} got ${l.headroom.toFixed(1)}x ` +
          `while something beside it got ${l.tightest.toFixed(1)}x`
      );
    }
  }

  return lines.join("\n");
}

module.exports = {
  tightnessOf,
  describeTightness,
  CRAMPED,
  LOPSIDED,
  SPARE_MM,
  SPARE_RATIO,
};
