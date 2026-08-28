"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { LAYOUTS, VARIANTS, rows, cols, flatten } = require("../src/layouts");

const ALL = [...LAYOUTS, ...VARIANTS];

// Everything a layout must be. These were checked by hand once, when the
// library was written, and then nothing held them to it. A layout that
// silently stops tiling puts content off the edge of the page or on top of
// other content, and neither shows up until someone looks at a printed sheet.

test("the library is not empty and every layout has an id, a name and a tree", () => {
  assert.ok(ALL.length >= 20, `expected a real library, got ${ALL.length}`);
  for (const l of ALL) {
    assert.ok(l.id, "a layout has no id");
    assert.ok(l.name, `layout "${l.id}" has no name`);
    assert.ok(l.tree !== undefined, `layout "${l.id}" has no tree`);
  }
});

test("no two layouts share an id", () => {
  const seen = new Set();
  for (const l of ALL) {
    assert.ok(!seen.has(l.id), `duplicate layout id "${l.id}"`);
    seen.add(l.id);
  }
});

test("every zone sits inside the page", () => {
  for (const l of ALL) {
    for (const z of flatten(l.tree)) {
      assert.ok(z.x >= -1e-9, `${l.id}: zone "${z.id}" starts left of the page`);
      assert.ok(z.y >= -1e-9, `${l.id}: zone "${z.id}" starts above the page`);
      assert.ok(z.w > 0, `${l.id}: zone "${z.id}" has no width`);
      assert.ok(z.h > 0, `${l.id}: zone "${z.id}" has no height`);
      assert.ok(z.x + z.w <= 1 + 1e-9, `${l.id}: zone "${z.id}" runs off the right`);
      assert.ok(z.y + z.h <= 1 + 1e-9, `${l.id}: zone "${z.id}" runs off the bottom`);
    }
  }
});

test("no layout names the same zone twice", () => {
  for (const l of ALL) {
    const ids = flatten(l.tree).map((z) => z.id);
    assert.equal(
      new Set(ids).size,
      ids.length,
      `${l.id}: repeats a zone name (${ids.join(", ")})`
    );
  }
});

test("every layout covers the whole page: the zone areas sum to exactly one", () => {
  for (const l of ALL) {
    const area = flatten(l.tree).reduce((sum, z) => sum + z.w * z.h, 0);
    assert.ok(
      Math.abs(area - 1) < 1e-9,
      `${l.id}: zones cover ${area.toFixed(4)} of the page, not all of it`
    );
  }
});

// Summing to one is necessary but not sufficient: two zones could overlap
// while a third gap made the total come out right. This catches that.
test("no two zones in a layout overlap", () => {
  const overlaps = (a, b) =>
    a.x < b.x + b.w - 1e-9 &&
    b.x < a.x + a.w - 1e-9 &&
    a.y < b.y + b.h - 1e-9 &&
    b.y < a.y + a.h - 1e-9;

  for (const l of ALL) {
    const zones = flatten(l.tree);
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        assert.ok(
          !overlaps(zones[i], zones[j]),
          `${l.id}: zones "${zones[i].id}" and "${zones[j].id}" overlap`
        );
      }
    }
  }
});

test("parts are proportions, so [1,2] and [0.33,0.67] describe the same split", () => {
  const a = flatten(rows([1, 2], "x", "y"));
  const b = flatten(rows([10, 20], "x", "y"));
  assert.deepEqual(a, b);
});

test("a bare string is a single zone filling the page", () => {
  assert.deepEqual(flatten("only"), [{ id: "only", x: 0, y: 0, w: 1, h: 1 }]);
});

test("columns divide width and rows divide height", () => {
  const c = flatten(cols([1, 1], "l", "r"));
  assert.deepEqual(c[0], { id: "l", x: 0, y: 0, w: 0.5, h: 1 });
  assert.deepEqual(c[1], { id: "r", x: 0.5, y: 0, w: 0.5, h: 1 });

  const r = flatten(rows([1, 1], "t", "b"));
  assert.deepEqual(r[0], { id: "t", x: 0, y: 0, w: 1, h: 0.5 });
  assert.deepEqual(r[1], { id: "b", x: 0, y: 0.5, w: 1, h: 0.5 });
});

test("a part can subdivide, and the child stays inside its parent", () => {
  const zones = flatten(rows([0.3, 0.7], "band", cols([1, 1], "left", "right")));
  const band = zones.find((z) => z.id === "band");
  const left = zones.find((z) => z.id === "left");

  assert.ok(Math.abs(band.h - 0.3) < 1e-9);
  assert.ok(Math.abs(left.y - 0.3) < 1e-9, "the column should start below the band");
  assert.ok(Math.abs(left.w - 0.5) < 1e-9);
  assert.ok(Math.abs(left.h - 0.7) < 1e-9);
});

test("zones come back in reading order, so content lands where a child looks first", () => {
  // suggest.js relies on this: it hands the first piece of content to the
  // first zone. If the order changed, content would silently rearrange.
  const zones = flatten(rows([1, 1], cols([1, 1], "a", "b"), cols([1, 1], "c", "d")));
  assert.deepEqual(zones.map((z) => z.id), ["a", "b", "c", "d"]);
});

// ─── rearranged shapes ───────────────────────────────────────────────────
//
// The same zones in different places, generated rather than written out. These
// exist because content order is not negotiable: the fit checker fills zones in
// reading order, so a sheet whose biggest item is SECOND needs a shape whose
// biggest zone is second, and hand-writing every such pairing is what left
// `band-two-cols` with no mirror and six zones with no two-across arrangement.

const REARRANGED = VARIANTS.filter((v) => v.mirrorOf);

test("every shape in the library is rearranged, and the rearrangements are new shapes", () => {
  assert.ok(REARRANGED.length >= 10, `expected real rearrangements, got ${REARRANGED.length}`);

  // Geometry, ignoring names: a rearrangement that lands on a shape the library
  // already has is a duplicate, and a duplicate teaches a reader that the list is
  // padded while handing the fit checker the same page twice.
  //
  // Checked for the REARRANGED shapes only. The ratio variants deliberately
  // restate some named shapes - a strip across the top is also the 20/80 stack -
  // because their job is to show one shape at a spread of proportions side by
  // side in the gallery. That overlap predates this and is not what this guards.
  const geometry = (l) =>
    flatten(l.tree)
      .map((z) => [z.x, z.y, z.w, z.h].map((n) => n.toFixed(3)).join(","))
      .join(" | ");

  const others = new Map(ALL.filter((l) => !l.mirrorOf).map((l) => [geometry(l), l.id]));
  const rearranged = new Map();
  for (const v of REARRANGED) {
    const sig = geometry(v);
    assert.ok(!others.has(sig), `${v.id} is the same shape as ${others.get(sig)}`);
    assert.ok(!rearranged.has(sig), `${v.id} is the same shape as ${rearranged.get(sig)}`);
    rearranged.set(sig, v.id);
  }
});

test("a rearranged shape holds the same number of zones as the shape it came from", () => {
  // The zone COUNT is what decides whether a shape is offered at all, so a
  // rearrangement that gained or lost one would silently answer a different
  // question from the one asked.
  const byId = new Map(LAYOUTS.map((l) => [l.id, l]));
  for (const v of REARRANGED) {
    const source = byId.get(v.mirrorOf);
    assert.ok(source, `${v.id} names a source layout that does not exist`);
    assert.equal(
      flatten(v.tree).length,
      flatten(source.tree).length,
      `${v.id} does not hold as many zones as ${source.id}`
    );
  }
});

test("a rearranged shape names its zones in reading order", () => {
  // Zones are filled positionally, so ids that ran b, a would trap anyone
  // writing the zones out by hand into putting question 2 above question 1.
  const NAMES = "abcdefghijklmnop";
  for (const v of REARRANGED) {
    const ids = flatten(v.tree).map((z) => z.id);
    assert.deepEqual(
      ids,
      NAMES.slice(0, ids.length).split(""),
      `${v.id} does not name its zones in reading order`
    );
  }
});

// ─── a section title owns the full width of what it names ────────────────
//
// These are about where a title ENDS UP on the page, which is geometry, so
// they live with the rest of the geometry rather than with the section-label
// helper - the helper cannot see what is beside it.

const { renderSheet } = require("../src/render");

// Every zone the renderer placed, as real millimetres.
function placedZones(html) {
  const found = {};
  const re =
    /class="zone zone--([\w-]+)"[^>]*? style="\s*left:([\d.]+)mm;\s*top:([\d.]+)mm;\s*width:([\d.]+)mm;\s*height:([\d.]+)mm;"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    found[m[1]] = { x: +m[2], y: +m[3], w: +m[4], h: +m[5] };
  }
  return found;
}

const titledColumn = (title) => ({
  stack: [
    { helper: "section-label", text: title },
    { helper: "written-answers", items: [{ text: "Explain how you know.", lines: 2 }] },
  ],
});

test("a section title spans the section it names, and the columns start below it", () => {
  // Found on a printed Greater Depth sheet. "Going Deeper" was drawn at the top
  // of the LEFT column of a two-column band, level with a question that started
  // in the right one - and every question in both columns belonged under it.
  // The page read as two unrelated blocks, and a child working down the
  // right-hand column never met the heading at all.
  const html = renderSheet({
    title: "Find 10 and 100 more",
    layout: "band-two-cols",
    orientation: "portrait",
    zones: {
      a: { helper: "questions", items: ["What is 10 more than 34?"] },
      b: titledColumn("Going Deeper"),
      c: { helper: "written-answers", items: [{ text: "Which is the odd one out?", lines: 3 }] },
    },
  });

  const zones = placedZones(html);
  const title = zones["b-title"];
  assert.ok(title, "the title was left inside its column");
  assert.match(html, /zone--b-title[^>]*>\s*<p class="h-section-label">Going Deeper/);

  // It spans the whole split it names, which here is the whole page width.
  assert.equal(title.w, zones.a.w, "the title stops short of the section it names");

  // And nothing sits beside it at its own level: both columns begin below it.
  for (const id of ["b", "c"]) {
    assert.ok(
      zones[id].y >= title.y + title.h,
      `zone "${id}" starts at ${zones[id].y}mm, level with a title that ends at ${(
        title.y + title.h
      ).toFixed(1)}mm`
    );
  }
});

test("two titles side by side are two sections, and neither one moves", () => {
  // The other reading of the same page. When both columns carry their own
  // heading, each already spans the section it names and nothing is beside it
  // that it does not own. Hoisting one of them would put a heading over
  // somebody else's questions, which is the fault this rule exists to stop.
  const html = renderSheet({
    title: "Two sections",
    layout: "band-two-cols",
    orientation: "portrait",
    zones: {
      a: { helper: "questions", items: ["What is 10 more than 34?"] },
      b: titledColumn("Problem Solving"),
      c: titledColumn("Going Deeper"),
    },
  });

  const zones = placedZones(html);
  assert.ok(!zones["b-title"] && !zones["c-title"], "a title was moved out of its own section");
  assert.equal(zones.b.y, zones.c.y, "the two sections should still start level");
});

test("six zones can be asked for two across, not only one across or three across", () => {
  // The gap that prompted all this. Six picture-led questions had a choice
  // between zones 54mm wide, too narrow for a photograph, and a single column
  // 1671mm long. Two across by three down is how a printed sheet of six boxes
  // almost always looks, and it could not be asked for.
  const sixes = ALL.filter((l) => flatten(l.tree).length === 6);
  const twoAcross = sixes.filter((l) => {
    const zones = flatten(l.tree);
    const columns = new Set(zones.map((z) => z.x.toFixed(3)));
    const rowsCount = new Set(zones.map((z) => z.y.toFixed(3)));
    return columns.size === 2 && rowsCount.size === 3;
  });
  assert.ok(twoAcross.length >= 1, "no six-zone shape runs two across by three down");
});
