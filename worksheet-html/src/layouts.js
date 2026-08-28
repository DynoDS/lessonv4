"use strict";

// The layout library.
//
// A layout is GEOMETRY and nothing else. It says how a page is divided, not
// what goes in it. One layout serves a geography lesson and a maths lesson
// without being rebuilt, exactly the way a slide template does. A zone that is
// wide and short takes a table or a photo or a row of questions, and the layout
// does not care which.
//
// A layout is a TREE, not a list of rectangles. A page splits into parts, and
// any part can split again. That is what makes the library open-ended: "band on
// top, two columns below" is not its own layout, it is a horizontal split whose
// lower part is split vertically. Every arrangement below is built from those
// two moves, and a new one costs a line rather than a new entry.
//
// Proportions, not millimetres, because every sheet is the same size, so
// proportions are the natural way to think about a library. Millimetres appear
// only where a real limit exists, which is what the floors in
// each helper states in src/helpers.js are for.
//
//   rows(parts, ...children)  divides HEIGHT, children stack top to bottom
//   cols(parts, ...children)  divides WIDTH, children sit left to right
//   a bare string is a leaf zone, and the string is its name

function rows(parts, ...children) {
  return { dir: "rows", parts, children };
}

function cols(parts, ...children) {
  return { dir: "cols", parts, children };
}

// Walk the tree and produce a flat list of rectangles as fractions of the
// printable area. `parts` need not sum to 1: they are normalised, so [1, 2]
// means one third and two thirds, and [0.3, 0.7] means the same as [3, 7].
function flatten(node, x = 0, y = 0, w = 1, h = 1, out = []) {
  if (typeof node === "string") {
    out.push({ id: node, x, y, w, h });
    return out;
  }

  const total = node.parts.reduce((a, b) => a + b, 0);
  let offset = 0;

  node.children.forEach((child, i) => {
    const share = node.parts[i] / total;
    if (node.dir === "rows") {
      flatten(child, x, y + offset * h, w, share * h, out);
    } else {
      flatten(child, x + offset * w, y, share * w, h, out);
    }
    offset += share;
  });

  return out;
}

// REVIEWED BY DANIEL, 29 July 2026, against the printed gallery: "lets keep all
// the shapes." Nothing was cut and nothing was reported missing, so every layout
// below has been looked at and kept rather than merely never questioned.
//
// That is not permission to keep adding. The rule still holds: wait until a real
// sheet cannot find a shape that fits, and let that be the list. The one layout
// added this month, the flanked middle, came in exactly that way.
const LAYOUTS = [
  // ─── one zone ────────────────────────────────────────────────────────
  { id: "full", name: "Full page", tree: "a" },

  // ─── halves ──────────────────────────────────────────────────────────
  { id: "halves-stacked", name: "Halves, stacked", tree: rows([1, 1], "a", "b") },
  { id: "halves-side", name: "Halves, side by side", tree: cols([1, 1], "a", "b") },

  // ─── thirds ──────────────────────────────────────────────────────────
  { id: "thirds-stacked", name: "Thirds, stacked", tree: rows([1, 1, 1], "a", "b", "c") },
  { id: "thirds-side", name: "Thirds, side by side", tree: cols([1, 1, 1], "a", "b", "c") },
  { id: "third-then-two", name: "One third above, two thirds below", tree: rows([1, 2], "a", "b") },
  { id: "two-then-third", name: "Two thirds above, one third below", tree: rows([2, 1], "a", "b") },

  // ─── questions down the page ─────────────────────────────────────────
  // The plainest worksheet there is: numbered questions, one under another,
  // each the full width of the page.
  //
  // These were missing, and it took a real lesson to notice. Full-width stacks
  // stopped at three, so the first two whole worksheets built with this engine
  // (four questions each, which is an ordinary number of questions) were both
  // refused outright: the only four-zone shapes were grids of quarters and a
  // bar chart with its questions under it does not go in a quarter.
  //
  // Daniel's rule, and he was right about it: do not invent layouts against an
  // abstract gallery, wait until a real sheet cannot find a shape that fits.
  { id: "four-stacked", name: "Four questions, stacked", tree: rows([1, 1, 1, 1], "a", "b", "c", "d") },
  { id: "five-stacked", name: "Five questions, stacked", tree: rows([1, 1, 1, 1, 1], "a", "b", "c", "d", "e") },
  { id: "six-stacked", name: "Six questions, stacked", tree: rows([1, 1, 1, 1, 1, 1], "a", "b", "c", "d", "e", "f") },

  // A big first question with three smaller ones under it: the shape of a
  // sheet that opens with a diagram or a source and then works from it.
  {
    id: "big-then-three-stacked",
    name: "Big question, then three stacked",
    tree: rows([2, 1, 1, 1], "a", "b", "c", "d"),
  },

  // ─── narrow strips ───────────────────────────────────────────────────
  { id: "strip-top", name: "Strip across the top", tree: rows([0.2, 0.8], "a", "b") },
  { id: "strip-bottom", name: "Strip across the bottom", tree: rows([0.8, 0.2], "a", "b") },
  { id: "strip-both", name: "Strip top and bottom", tree: rows([0.15, 0.7, 0.15], "a", "b", "c") },
  { id: "strip-left", name: "Narrow column, left", tree: cols([0.28, 0.72], "a", "b") },
  { id: "strip-right", name: "Narrow column, right", tree: cols([0.72, 0.28], "a", "b") },

  // ─── quarters and grids ──────────────────────────────────────────────
  { id: "quarters", name: "Quarters",
    tree: rows([1, 1], cols([1, 1], "a", "b"), cols([1, 1], "c", "d")) },
  { id: "grid-six", name: "Six boxes",
    tree: rows([1, 1], cols([1, 1, 1], "a", "b", "c"), cols([1, 1, 1], "d", "e", "f")) },

  // ─── one big, two small ──────────────────────────────────────────────
  { id: "big-above-two", name: "Big above, two below",
    tree: rows([0.55, 0.45], "a", cols([1, 1], "b", "c")) },
  { id: "two-above-big", name: "Two above, big below",
    tree: rows([0.45, 0.55], cols([1, 1], "a", "b"), "c") },
  { id: "big-left-two", name: "Big left, two right",
    tree: cols([0.55, 0.45], "a", rows([1, 1], "b", "c")) },
  { id: "two-left-big", name: "Two left, big right",
    tree: cols([0.45, 0.55], rows([1, 1], "a", "b"), "c") },

  // ─── band across the top, then columns ───────────────────────────────
  { id: "band-two-cols", name: "Band on top, two columns",
    tree: rows([0.3, 0.7], "a", cols([1, 1], "b", "c")) },
  { id: "band-three-cols", name: "Band on top, three columns",
    tree: rows([0.3, 0.7], "a", cols([1, 1, 1], "b", "c", "d")) },
  { id: "band-cols-strip", name: "Band, two columns, strip below",
    tree: rows([0.28, 0.55, 0.17], "a", cols([1, 1], "b", "c"), "d") },

  // ─── deeper nesting, to show what subdivision buys ───────────────────
  { id: "band-cols-split-right", name: "Band, left column, right column split",
    tree: rows([0.3, 0.7], "a", cols([1, 1], "b", rows([1, 1], "c", "d"))) },
  { id: "strip-left-body-split", name: "Narrow left, body split in two",
    tree: cols([0.28, 0.72], "a", rows([1, 1], "b", "c")) },
  { id: "big-top-three-below", name: "Big above, three below",
    tree: rows([0.6, 0.4], "a", cols([1, 1, 1], "b", "c", "d")) },
  { id: "quarters-one-split", name: "Quarters, bottom right split",
    tree: rows([1, 1], cols([1, 1], "a", "b"), cols([1, 1], "c", rows([1, 1], "d", "e"))) },
  { id: "strip-top-quarters", name: "Strip on top, quarters below",
    tree: rows([0.18, 0.82], "a", rows([1, 1], cols([1, 1], "b", "c"), cols([1, 1], "d", "e"))) },

  // ─── something in the middle, with a flank each side ─────────────────
  // Every other shape here divides the page into a reading order that runs
  // left to right and top to bottom. These two do not: the middle is the
  // subject, and the flanks are things that refer INWARD to it.
  //
  // The shape came from a real published sheet, not from the gallery. A world
  // map filled the middle with a plant card in each margin and a row of more
  // cards along the foot, so the whole page pointed at one picture. Nothing in
  // the library could hold it: the closest shapes put the map in a corner,
  // which turns the flanks into a list beside a picture rather than labels
  // around one.
  { id: "flanked-middle", name: "Middle, with a flank each side",
    tree: cols([0.22, 0.56, 0.22], "a", "b", "c") },
  { id: "flanked-middle-band", name: "Middle with flanks, band below",
    tree: rows([0.62, 0.38], cols([0.22, 0.56, 0.22], "a", "b", "c"), "d") },
];

// Ratio variants come free once a layout is a tree: a variant is a different
// number, not a new entry. These generate the common splits at a spread of
// ratios so a shape can be judged at several proportions side by side.
const RATIOS = [
  [20, 80],
  [30, 70],
  [40, 60],
  [50, 50],
  [60, 40],
  [70, 30],
  [80, 20],
];

// ─── mirrors ─────────────────────────────────────────────────────────────
//
// The same zones, in different places. A page whose big space is FIRST and one
// whose big space is LAST are the same set of rooms rearranged, and until now
// the library held only some of those arrangements: `big-above-two` had its
// mirror `two-above-big` written out by hand, while `band-two-cols` and
// `big-then-three-stacked` had none at all.
//
// This matters because CONTENT ORDER IS NOT NEGOTIABLE. A worksheet's questions
// often get harder as they go, and question 4 can lean on question 2 having been
// done, so the fit checker fills zones in reading order and never reorders to
// find a fit. That is the right rule and it has a cost: a sheet whose biggest
// item is second was refused, when the identical page with its big space second
// would have held it. The designer's only recourse was to shuffle the content by
// hand and ask again, which is trial and error over a question the library
// should already be able to answer.
//
// So the geometry moves instead of the content. Mirroring is generated, not
// written out: reverse the parts and the children of every split running in the
// chosen direction, and a shape's opposite costs nothing to keep.
function mirror(node, dir) {
  if (typeof node === "string") return node;
  const children = node.children.map((c) => mirror(c, dir));
  if (node.dir !== dir) return { dir: node.dir, parts: [...node.parts], children };
  return { dir: node.dir, parts: [...node.parts].reverse(), children: children.reverse() };
}

// Reversing children moves the zone NAMES around with them, so a mirrored
// `rows([2,1], "a", "b")` would hand back "b" on top. Zone ids are read
// positionally - the first zone in reading order takes the first piece of
// content - so a mirror whose ids run b, a is a trap for anyone writing the
// zones out by hand. Relabelled in reading order, which is the order `flatten`
// walks, so "a" is always the zone a reader would call first.
function relabel(node, next = { i: 0 }) {
  const NAMES = "abcdefghijklmnop";
  if (typeof node === "string") return NAMES[next.i++];
  return { dir: node.dir, parts: [...node.parts], children: node.children.map((c) => relabel(c, next)) };
}

// Geometry, to three decimal places, ignoring names. Two shapes with the same
// rectangles in the same places are the same shape however they were built, so
// this is what stops a generated mirror duplicating a hand-written layout: a
// gallery listing "Big above, two below" twice teaches the reader that the list
// is padded, and a duplicate id would break `getLayout` outright.
function signature(tree) {
  return flatten(tree)
    .map((z) => [z.x, z.y, z.w, z.h].map((n) => n.toFixed(3)).join(","))
    .join(" | ");
}

// Turning a shape on its side: every split that divided height now divides
// width, and the other way about.
//
// This is the third arrangement of the same rooms, and the library was missing
// the one that matters most. Six zones existed as one tall column
// (`six-stacked`) and as three across by two down (`grid-six`), and nothing in
// between - so six picture-led questions had a choice between zones 54mm wide,
// too narrow for a photograph, and a column 1671mm long. Two across by three
// down, which is how a printed sheet of six boxes almost always looks, could not
// be asked for. Transposing `grid-six` produces it for nothing.
function transpose(node) {
  if (typeof node === "string") return node;
  return {
    dir: node.dir === "rows" ? "cols" : "rows",
    parts: [...node.parts],
    children: node.children.map(transpose),
  };
}

const REARRANGEMENTS = [
  { how: (t) => mirror(t, "rows"), suffix: "flip-v", label: "mirrored top to bottom" },
  { how: (t) => mirror(t, "cols"), suffix: "flip-h", label: "mirrored left to right" },
  { how: transpose, suffix: "turned", label: "turned on its side" },
];

// Deduped against the ratio variants as well as the named shapes, because those
// already cover some of the same geometry: a strip across the top IS the 20/80
// stack, so turning it on its side lands exactly on the 20/80 side-by-side split
// that ratioVariants generates. Two ids for one shape would make the gallery read
// as padded and give the fit checker the same page twice.
function mirrorVariants(existing) {
  const seen = new Set(existing.map((l) => signature(l.tree)));
  const out = [];

  for (const layout of LAYOUTS) {
    for (const { how, suffix, label } of REARRANGEMENTS) {
      const tree = relabel(how(layout.tree));
      const sig = signature(tree);
      // A symmetrical shape is its own mirror, and every quarters-and-halves
      // shape in the library is. Skipped silently: there is nothing missing.
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push({
        id: `${layout.id}-${suffix}`,
        name: `${layout.name}, ${label}`,
        variant: true,
        mirrorOf: layout.id,
        tree,
      });
    }
  }

  return out;
}

function ratioVariants() {
  const out = [];
  for (const [top, bottom] of RATIOS) {
    out.push({
      id: `stacked-${top}-${bottom}`,
      name: `${top} / ${bottom}, stacked`,
      variant: true,
      tree: rows([top, bottom], "a", "b"),
    });
  }
  for (const [left, right] of RATIOS) {
    out.push({
      id: `side-${left}-${right}`,
      name: `${left} / ${right}, side by side`,
      variant: true,
      tree: cols([left, right], "a", "b"),
    });
  }
  return out;
}

// Both kinds of variant sit in one list, because every consumer wants the same
// thing from them: the fit checker tries them, `getLayout` resolves them, the
// gallery prints them. A separate export would have to be added to each of those
// by hand, and the one that got missed would be a shape the checker recommends
// and the build then cannot find.
const RATIO_VARIANTS = ratioVariants();
const VARIANTS = [...RATIO_VARIANTS, ...mirrorVariants([...LAYOUTS, ...RATIO_VARIANTS])];

// Kept for the gallery's sake: give it a layout, get its rectangles.
function zonesOf(layout) {
  return flatten(layout.tree);
}

module.exports = { LAYOUTS, VARIANTS, rows, cols, flatten, zonesOf };
