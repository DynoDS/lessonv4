'use strict';

const { fitGroupId } = require('../text-fit');
const { drawGroupAccent } = require('./group-accent');

// ─── CONSTANTS ────────────────────────────────────────────────
const GAP = 0.10;
// ─── END CONSTANTS ────────────────────────────────────────────


// ─── WIDTH SHARING ────────────────────────────────────────────
const WIDTH_REFLOW_FLOOR = 0.10;

function itemWidths(items, equalW) {
  const { maxUsefulWidth } = require('./index');
  const widths = items.map(function () { return equalW; });
  const growers = [];
  let released = 0;

  items.forEach(function (item, i) {
    const cap = maxUsefulWidth(item);
    if (cap === null) { growers.push(i); return; }
    const spare = equalW - cap;
    if (spare > WIDTH_REFLOW_FLOOR) {
      widths[i] = cap;
      released += spare;
    }
  });

  // Nothing to give it to, so nothing moves: narrowing an item without widening
  // a neighbour would only turn a gap between items into a gap at the edge.
  if (!growers.length || released <= WIDTH_REFLOW_FLOOR) {
    return items.map(function () { return equalW; });
  }

  const share = released / growers.length;
  growers.forEach(function (i) { widths[i] += share; });
  return widths;
}

function drawRow(pptx, slide, zone, data, ctx) {
  // A row may ask for its items to be numbered or lettered. It is opt-in: a row
  // without `questionNumbering` behaves exactly as it always has. The labels are
  // applied to a shallow copy, so the lesson JSON on disk stays the designer's.
  const { numberRowItems } = require('../question-labels');
  const items = numberRowItems(data);
  if (items.length === 0) return;

  const { drawContent } = require('./index');
  // Pictures placed by the shared placer reserve the caption band it sets.
  const { captionBandHeight } = require('./shared-figure');
  const clockLabelBandHeight = (it) => captionBandHeight('clock', it);
  const turnLabelBandHeight = (it) => captionBandHeight('turn-diagram', it);
  const polygonLabelBandHeight = (it) => captionBandHeight('polygon', it);
  const { angleLabelBandHeight } = require('./angle');
  const { triangleLabelBandHeight } = require('./triangle');
  const { linePairLabelBandHeight } = require('./line-pair');
  const { geoboardLabelBandHeight } = require('./geoboard');
  const { vennLabelBandHeight } = require('./venn');
  const { carrollLabelBandHeight } = require('./carroll');
  const { translationShapeLabelBandHeight } = require('./translation-shape');
  const { rainforestLayersLabelBandHeight } = require('./rainforest-layers');

  // Clocks sharing a row must draw at the same size whatever their labels say.
  // An answer reveal ("(a) ||4:20 ✓") reserves a taller caption band than a plain
  // "(b)", and since a clock sizes its face from the height left under its band,
  // the answer clock would otherwise come out smaller than its neighbours. Reserve
  // the largest band any clock in the row needs, and hand it to all of them.
  let clockBandH = null;
  const clockItems = items.filter(function (it) { return it && it.type === 'clock'; });
  if (clockItems.length > 1) {
    clockBandH = clockItems.reduce(function (m, it) {
      return Math.max(m, clockLabelBandHeight(it));
    }, 0);
  }

  // Turn diagrams share a row the same way clocks do — equalise their label bands
  // so an answer-reveal caption ("(a) ||half turn clockwise") doesn't shrink its
  // diagram below the plain-labelled ones beside it.
  let turnBandH = null;
  const turnItems = items.filter(function (it) { return it && it.type === 'turn-diagram'; });
  if (turnItems.length > 1) {
    turnBandH = turnItems.reduce(function (m, it) {
      return Math.max(m, turnLabelBandHeight(it));
    }, 0);
  }

  // Static angles share a row the same way — equalise their label bands so a
  // labelled answer angle doesn't draw smaller than its plain-labelled neighbours.
  let angleBandH = null;
  const angleItems = items.filter(function (it) { return it && it.type === 'angle'; });
  if (angleItems.length > 1) {
    angleBandH = angleItems.reduce(function (m, it) {
      return Math.max(m, angleLabelBandHeight(it));
    }, 0);
  }

  // Triangles share a row the same way — a row of "scalene / isosceles /
  // equilateral" classified triangles must draw at one size, so a labelled answer
  // triangle doesn't shrink below its plain-labelled neighbours. Both example and
  // non-example triangles reserve the same band, so a concept-attainment row that
  // mixes them stays even.
  let triangleBandH = null;
  const triangleItems = items.filter(function (it) {
    return it && (it.type === 'triangle' || it.type === 'triangle-nonexample');
  });
  if (triangleItems.length > 1) {
    triangleBandH = triangleItems.reduce(function (m, it) {
      return Math.max(m, triangleLabelBandHeight(it));
    }, 0);
  }

  // Line pairs share a row the same way — equalise their label bands so a
  // labelled answer ("(a) ||parallel") doesn't draw smaller than its plain
  // neighbours.
  let linePairBandH = null;
  const linePairItems = items.filter(function (it) { return it && it.type === 'line-pair'; });
  if (linePairItems.length > 1) {
    linePairBandH = linePairItems.reduce(function (m, it) {
      return Math.max(m, linePairLabelBandHeight(it));
    }, 0);
  }

  // Geoboards share a row the same way — a row of several boards with captions
  // ("Shape A", "Shape B") must draw at one size, so a board with a longer caption
  // doesn't shrink below its plain-labelled neighbours.
  let geoboardBandH = null;
  const geoboardItems = items.filter(function (it) { return it && it.type === 'geoboard'; });
  if (geoboardItems.length > 1) {
    geoboardBandH = geoboardItems.reduce(function (m, it) {
      return Math.max(m, geoboardLabelBandHeight(it));
    }, 0);
  }

  // Venn diagrams share a row the same way — two completed Venns compared side by
  // side (or a Venn beside a Carroll) must draw at one size, so a labelled-answer
  // Venn doesn't shrink below its neighbour.
  let vennBandH = null;
  const vennItems = items.filter(function (it) { return it && it.type === 'venn'; });
  if (vennItems.length > 1) {
    vennBandH = vennItems.reduce(function (m, it) {
      return Math.max(m, vennLabelBandHeight(it));
    }, 0);
  }

  // Carroll diagrams share a row the same way as Venns.
  let carrollBandH = null;
  const carrollItems = items.filter(function (it) { return it && it.type === 'carroll'; });
  if (carrollItems.length > 1) {
    carrollBandH = carrollItems.reduce(function (m, it) {
      return Math.max(m, carrollLabelBandHeight(it));
    }, 0);
  }

  // Named shapes (polygon) share a row the same way — a row of "Square / Hexagon /
  // Pentagon" must draw at one size, so a polygon with a longer caption or an
  // answer reveal doesn't shrink below its plain-labelled neighbours.
  let polygonBandH = null;
  const polygonItems = items.filter(function (it) { return it && it.type === 'polygon'; });
  if (polygonItems.length > 1) {
    polygonBandH = polygonItems.reduce(function (m, it) {
      return Math.max(m, polygonLabelBandHeight(it));
    }, 0);
  }

  // Translation grids share a row the same way — a "before / after" comparison of
  // two translations must draw at one size, so a labelled answer grid doesn't
  // shrink below its plain-labelled neighbour.
  let translationShapeBandH = null;
  const translationShapeItems = items.filter(function (it) { return it && it.type === 'translation-shape'; });
  if (translationShapeItems.length > 1) {
    translationShapeBandH = translationShapeItems.reduce(function (m, it) {
      return Math.max(m, translationShapeLabelBandHeight(it));
    }, 0);
  }

  // Rainforest cross sections share a row the same way, and this is the figure
  // most often shown two-up: the same forest with one pair of layers highlighted
  // beside the other pair. A captioned copy must not shrink below its neighbour,
  // or the light gradient reads as two different diagrams rather than one.
  let rainforestLayersBandH = null;
  const rainforestLayersItems = items.filter(function (it) { return it && it.type === 'rainforest-layers'; });
  if (rainforestLayersItems.length > 1) {
    rainforestLayersBandH = rainforestLayersItems.reduce(function (m, it) {
      return Math.max(m, rainforestLayersLabelBandHeight(it));
    }, 0);
  }

  const totalGap = GAP * (items.length - 1);
  const itemW    = (zone.w - totalGap) / items.length;

  // Width the way a stack already does height: the items that cannot use their
  // share hand it back, and the items that can use more take it.
  //
  // An equal share is width measured by COUNT. A comparison ring between two
  // place-value charts took a third of the row and drew at well under half of
  // it, and the charts either side were held to two thirds of the width they
  // could have had - so the digits a class reads from the carpet came out
  // smaller to leave a gap around a ring that never wanted it. Only helpers
  // that genuinely stop growing declare a cap; everything else keeps taking
  // whatever width it is given, exactly as before.
  const widths = itemWidths(items, itemW);
  const lefts = widths.reduce(function (acc, w, i) {
    acc.push(i === 0 ? zone.x : acc[i - 1] + widths[i - 1] + GAP);
    return acc;
  }, []);

  // Parallel peers share geometry as well as purpose: when every item is a
  // text card with the same visual role, `equaliseTextCards: true` makes the
  // whole row one family — equal card heights (each measure returns its full
  // sub-zone) and one shared maximum safe text size (one fit group across the
  // row). Without it, or with any non-text item mixed in, measurements stay
  // exactly as they have always been.
  const equaliseTextCards =
    data.equaliseTextCards === true &&
    items.length > 1 &&
    items.every(function (item) { return item && item.type === 'text'; });
  const rowTextFitGroup = equaliseTextCards
    ? fitGroupId(zone, 'row-text')
    : null;

  items.forEach(function (item, i) {
    const subZone = {
      x: lefts[i],
      y: zone.y,
      w: widths[i],
      h: zone.h,
      class: zone.class,
      // A noCard panel owns everything in it; see the same line in stack.js.
      noCard: zone.noCard,
      compactCards: zone.compactCards,
      equalTextCardHeight: equaliseTextCards,
      textFitGroup: rowTextFitGroup
    };
    if (clockBandH !== null && item && item.type === 'clock') {
      subZone.clockLabelBandH = clockBandH;
    }
    if (turnBandH !== null && item && item.type === 'turn-diagram') {
      subZone.turnLabelBandH = turnBandH;
    }
    if (angleBandH !== null && item && item.type === 'angle') {
      subZone.angleLabelBandH = angleBandH;
    }
    if (triangleBandH !== null && item &&
        (item.type === 'triangle' || item.type === 'triangle-nonexample')) {
      subZone.triangleLabelBandH = triangleBandH;
    }
    if (linePairBandH !== null && item && item.type === 'line-pair') {
      subZone.linePairLabelBandH = linePairBandH;
    }
    if (geoboardBandH !== null && item && item.type === 'geoboard') {
      subZone.geoboardLabelBandH = geoboardBandH;
    }
    if (vennBandH !== null && item && item.type === 'venn') {
      subZone.vennLabelBandH = vennBandH;
    }
    if (carrollBandH !== null && item && item.type === 'carroll') {
      subZone.carrollLabelBandH = carrollBandH;
    }
    if (polygonBandH !== null && item && item.type === 'polygon') {
      subZone.polygonLabelBandH = polygonBandH;
    }
    if (translationShapeBandH !== null && item && item.type === 'translation-shape') {
      subZone.translationShapeLabelBandH = translationShapeBandH;
    }
    if (rainforestLayersBandH !== null && item && item.type === 'rainforest-layers') {
      subZone.rainforestLayersLabelBandH = rainforestLayersBandH;
    }
    drawContent(pptx, slide, subZone, item, ctx);
  });

  drawGroupAccent(
    pptx,
    slide,
    zone,
    data.groupAccent
  );
}


// How much height this row actually wants, given the width it would get.
//
// A row is transparent to the card look and had no measure at all, which meant
// a row inside a stack always kept its full weighted share however little its
// contents used. On a Year 4 comparison slide that share was four and a half
// inches holding two charts under two inches tall, and the difference sat on
// the board as a band of nothing while the task above it printed small.
//
// A row is as tall as its tallest item. If ANY item cannot be measured, the row
// says nothing rather than guessing: an unmeasured item is one that may well
// use the whole zone, and a row that under-reports would hand away room its own
// content needs.
function measureRow(zone, data, ctx) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;

  const { measureCompositionExtent } = require('./index');
  const totalGap = GAP * (items.length - 1);
  const itemW = (zone.w - totalGap) / items.length;
  if (!(itemW > 0)) return null;

  const widths = itemWidths(items, itemW);

  let tallest = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const extent = measureCompositionExtent(
      { x: zone.x, y: zone.y, w: widths[i], h: zone.h,
        class: zone.class, noCard: zone.noCard, compactCards: zone.compactCards },
      item,
      ctx
    );
    if (!extent) return null;
    tallest = Math.max(tallest, extent.h);
  }

  return tallest > 0 ? { h: Math.min(tallest, zone.h) } : null;
}

module.exports = { drawRow, measureRow };
