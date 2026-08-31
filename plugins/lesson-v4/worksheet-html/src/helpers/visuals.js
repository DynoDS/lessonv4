"use strict";

// Helpers whose picture is drawn by the SHARED visual modules in
// lesson-resources/shared/visuals. Those are the same modules the slides and
// the working wall draw from, so a bar chart on the board and a bar chart on
// the sheet are the same picture, not two drawings that resemble each other.
//
// Each shared module exports tightSvg(spec) → { svg, aspect }, cropped tight to
// the drawing's own bounding box. Tight is what makes it usable here: the
// height a zone must allow follows from its width and that aspect, with no
// invisible padding to guess at.
//
// Adding one of these is small on purpose. If it takes more than an entry
// below, the work belongs in the shared module where every surface gets it.

const { heightFromAspect, LINE_MM, esc, linesFor } = require("./shared");
const { SPACE } = require("../tokens");

const barChartSvg = require("../../../shared/visuals/bar-chart-svg");
const vennSvg = require("../../../shared/visuals/venn-svg");
const angleSvg = require("../../../shared/visuals/angle-svg");
const barModelSvg = require("../../../shared/visuals/bar-model-svg");
const blankSurfaceSvg = require("../../../shared/visuals/blank-surface-svg");
const carrollSvg = require("../../../shared/visuals/carroll-svg");
const coordinateGridSvg = require("../../../shared/visuals/coordinate-grid-svg");
const geoboardSvg = require("../../../shared/visuals/geoboard-svg");
const gridMapSvg = require("../../../shared/visuals/grid-map-svg");
const lineGraphSvg = require("../../../shared/visuals/line-graph-svg");
const linePairSvg = require("../../../shared/visuals/line-pair-svg");
const pictogramSvg = require("../../../shared/visuals/pictogram-svg");
const rainforestLayersSvg = require("../../../shared/visuals/rainforest-layers-svg");
const balancedPatternPlateSvg = require("../../../shared/visuals/balanced-pattern-plate-svg");
const realMapSvg = require("../../../shared/visuals/real-map-svg");
const worldWriteOnMapSvg = require("../../../shared/visuals/world-write-on-map-svg");
const reflectionGridSvg = require("../../../shared/visuals/reflection-grid-svg");
const tallyChartSvg = require("../../../shared/visuals/tally-chart-svg");
const translationShapeSvg = require("../../../shared/visuals/translation-shape-svg");
const triangleSvg = require("../../../shared/visuals/triangle-svg");

// Turning a shared module into a helper. `toSpec` maps our worksheet spec on
// to the shared module's argument names, which differ (the shared modules were
// written for the deck first and use snake_case in places).
// A minimum may be a flat number of millimetres, or a function of the content
// where the drawing has a countable repeating part. Both dimensions take
// either: a tally chart grows DOWN with its rows just as a bar chart grows
// ACROSS with its bars, and a minimum that could only vary in one direction
// would approve a twelve-row chart into a zone too short to show it.
function atLeast(minMm, spec) {
  return typeof minMm === "function" ? minMm(spec) : minMm;
}

// Named because the plate's own height floor has to re-render it to find out
// what shape this lesson's wording made it.
const balancedPatternPlateSpec = (spec) => ({
  mode: spec.mode,
  practice: spec.practice,
  givenGroups: spec.givenGroups,
  blankGroups: spec.blankGroups,
  groupLabels: spec.groupLabels,
  examples: spec.examples,
  water: spec.water,
  caption: spec.caption,
  instruction: spec.instruction,
  lessOftenLabel: spec.lessOftenLabel,
});

// Every helper built this way is an SVG scaled by its WIDTH: the CSS gives it
// `width: 100%` and its height follows its own aspect. So extra height cannot
// make one bigger, and greed defaults to nought.
//
// It defaulted to 2, which meant nearly every drawing on the page claimed spare
// height it had no way to use. What actually happened was that the BOX grew and
// the drawing stayed at the top of it, so the growth became empty space inside
// the box. On a real sheet that opened a gap between a photograph and the
// question about it: the child read the question, looked up, and the picture had
// moved away.
//
// Spare height belongs to writing space, or at the foot of the page where a
// teacher trims it. A helper that genuinely redraws itself taller can say so.
function fromShared(module, toSpec, { capMm, minWidthMm, minHeightMm, greed = 0 }) {
  return {
    render: (spec) => `<div class="h-figure">${module.tightSvg(toSpec(spec)).svg}</div>`,
    measure: (spec, widthMm) =>
      heightFromAspect(module.tightSvg(toSpec(spec)).aspect, widthMm, capMm),
    needs: (spec) => ({
      minWidthMm: atLeast(minWidthMm, spec),
      minHeightMm: atLeast(minHeightMm, spec),
    }),
    greed,
  };
}

const helpers = {
  "bar-chart": fromShared(
    barChartSvg,
    (spec) => ({
      title: spec.title,
      categories: spec.categories,
      values: spec.values,
      y_max: spec.yMax,
      y_interval: spec.yInterval,
    }),
    {
      capMm: 140,
      // Every bar needs room for its category label underneath, so a chart
      // with eight categories needs far more width than one with three.
      minWidthMm: (spec) => Math.max(80, (spec.categories || []).length * 22),
      minHeightMm: 60,
    }
  ),

  // Sorting into two overlapping properties. A blank one (no items) is the
  // frame the child fills; a placed one is the worked example. Nothing about
  // it is maths-only: "has wings" against "lays eggs" is the same diagram as
  // "has a right angle" against "has four equal sides".
  venn: fromShared(
    vennSvg,
    (spec) => ({
      label1: spec.label1,
      label2: spec.label2,
      shapes: spec.items || [],
      showRegionHints: spec.showRegionHints !== false,
    }),
    {
      capMm: 130,
      // TWO floors, because a Venn is used in two different ways and they do
      // not need the same room. Daniel, looking at printed rungs: "59 is fine
      // for reading, not for writing on, 75 probably same."
      //
      // Reading one means seeing where things have been placed. Writing in one
      // means a child fitting their own words inside a region, which needs
      // room for handwriting in the smallest region of the three. So a Venn
      // with nothing placed in it, which is a Venn the child fills, keeps the
      // larger floor. One that comes filled in is a worked example to look at,
      // and can be smaller.
      //
      // This is the first helper whose minimum depends on the JOB rather than
      // the drawing. It will not be the last, and the answer is a flag on the
      // helper rather than a second helper.
      minWidthMm: (spec) => ((spec.items || []).length ? 76 : 90),
      minHeightMm: (spec) => ((spec.items || []).length ? 58 : 70),
    }
  ),

  // A classified angle: two arms and a marking arc or right-angle square. It
  // reads or fails to read at a glance, so it stays small on the page rather
  // than stretching to fill spare room.
  angle: fromShared(
    angleSvg,
    (spec) => ({
      degrees: spec.degrees,
      rotation: spec.rotation,
      rightAngle: spec.rightAngle,
      arc: spec.arc,
    }),
    // Lowered from 45mm. Daniel, on the printed rungs: "think angles could go
    // even smaller". An angle is two lines and an arc, and it reads at a
    // glance or not at all: there is no detail in it to lose.
    { capMm: 60, minWidthMm: 32, minHeightMm: 32, greed: 0 }
  ),

  // The White Rose / Singapore bar model: a part-whole bar or a two-bar
  // comparison. Not maths-only: any whole split into named parts fits it.
  "bar-model": fromShared(
    barModelSvg,
    (spec) => ({
      shape: spec.shape,
      whole: spec.whole,
      parts: spec.parts,
      wholeLabelPosition: spec.wholeLabelPosition,
      bars: spec.bars,
      difference: spec.difference,
    }),
    {
      capMm: 130,
      // A comparison always needs room for two bars and their names; a
      // part-whole bar needs one segment's worth of label room per part.
      //
      // Lowered on Daniel's say-so from the printed rungs ("bar model could be
      // even smaller"): 90mm to 70mm for a two-part bar, and the per-part
      // figure from 28mm to 22mm, so a four-part bar comes down from 112mm to
      // 88mm. The labels inside the segments are short (a number, a price, a
      // question mark) and they scale with the bar.
      minWidthMm: (spec) => {
        if (spec.shape === "comparison") return 80;
        const n = Math.max(2, (spec.parts || []).length);
        return Math.max(70, n * 22);
      },
      minHeightMm: 48,
    }
  ),

  // A draw-your-own surface (a bare number line, or empty bar outlines) for a
  // strategy the child constructs rather than fills in. The empty band is the
  // point, so it takes writing-space greed and a generous cap.
  "blank-surface": fromShared(
    blankSurfaceSvg,
    (spec) => ({
      surface: spec.surface,
      start: spec.start,
      end: spec.end,
      bars: spec.bars,
    }),
    { capMm: 150, minWidthMm: 100, minHeightMm: 70, greed: 0 }
  ),

  // A 2x2 sorting grid, the Carroll-diagram companion to venn: the same idea
  // of sorting into properties, read off a grid instead of overlapping rings.
  carroll: fromShared(
    carrollSvg,
    (spec) => ({
      rowLabel: spec.rowLabel,
      rowNotLabel: spec.rowNotLabel,
      colLabel: spec.colLabel,
      colNotLabel: spec.colNotLabel,
      shapes: spec.shapes,
    }),
    { capMm: 130, minWidthMm: 100, minHeightMm: 80, greed: 0 }
  ),

  // A numbered first-quadrant grid a child plots on. More columns need more
  // width, or the numbers along the bottom crowd into each other.
  "coordinate-grid": fromShared(
    coordinateGridSvg,
    (spec) => ({
      cols: spec.cols,
      rows: spec.rows,
      points: spec.points,
      join: spec.join,
    }),
    {
      capMm: 150,
      minWidthMm: (spec) => Math.max(90, (Number(spec.cols) || 10) * 11),
      // A grid squares up: its height follows its ROW count exactly as its
      // width follows its columns, at the same millimetres per cell.
      minHeightMm: (spec) => Math.max(90, (Number(spec.rows) || 10) * 11),
    }
  ),

  // A dotty-paper peg grid for drawing polygons. Pegs merging into one blob
  // is the failure mode, so width follows the column count.
  geoboard: fromShared(
    geoboardSvg,
    (spec) => ({
      cols: spec.cols,
      rows: spec.rows,
      shapes: spec.shapes,
      shape: spec.shape,
      emphasiseVertices: spec.emphasiseVertices,
      symmetryLines: spec.symmetryLines,
      symmetryLinesAnswer: spec.symmetryLinesAnswer,
    }),
    {
      capMm: 140,
      minWidthMm: (spec) => Math.max(70, (Number(spec.cols) || 5) * 14),
      // A grid squares up: its height follows its ROW count exactly as its
      // width follows its columns, at the same millimetres per cell.
      minHeightMm: (spec) => Math.max(70, (Number(spec.rows) || 5) * 14),
    }
  ),

  // A four-figure grid-reference river map. Usually the whole point of the
  // sheet, so it carries a generous cap; more grid columns need more width so
  // a feature's icon and name still fit inside their own cell.
  "grid-map": fromShared(
    gridMapSvg,
    (spec) => ({
      eastings: spec.eastings,
      northings: spec.northings,
      river: spec.river,
      roads: spec.roads,
      features: spec.features,
      highlightSquare: spec.highlightSquare,
    }),
    {
      capMm: 170,
      minWidthMm: (spec) => {
        const nx = Math.max(1, (spec.eastings || []).length - 1 || 5);
        return Math.max(110, nx * 22);
      },
      minHeightMm: 90,
    }
  ),

  // A titled time-series line graph with numbered axes. More x-ticks need
  // more width, or the plotted points crowd into each other.
  "line-graph": fromShared(
    lineGraphSvg,
    (spec) => ({
      points: spec.points,
      xLabel: spec.xLabel,
      yLabel: spec.yLabel,
      title: spec.title,
      xMax: spec.xMax,
      yMax: spec.yMax,
      xStep: spec.xStep,
      yStep: spec.yStep,
    }),
    {
      capMm: 130,
      minWidthMm: (spec) => {
        const step = Number(spec.xStep) > 0 ? Number(spec.xStep) : 1;
        const dataMax = (spec.points || []).reduce(
          (m, p) => Math.max(m, Number(p && p.x) || 0),
          0
        );
        const xMax = Number(spec.xMax) > 0 ? Number(spec.xMax) : dataMax || step;
        const ticks = Math.max(1, Math.round(xMax / step));
        return Math.max(80, ticks * 12);
      },
      minHeightMm: 55,
    }
  ),

  // The parallel / perpendicular / neither pair. Like angle, it reads or
  // fails to read at a glance and gains nothing from growing further.
  "line-pair": fromShared(
    linePairSvg,
    (spec) => ({
      relationship: spec.relationship,
      form: spec.form,
      unequal: spec.unequal,
      notation: spec.notation,
      arrows: spec.arrows,
      rotation: spec.rotation,
    }),
    { capMm: 55, minWidthMm: 40, minHeightMm: 35, greed: 0 }
  ),

  // A row-of-symbols pictogram with a key. Width follows both the longest
  // category label and the most symbols any one row needs to draw.
  pictogram: fromShared(
    pictogramSvg,
    (spec) => ({
      title: spec.title,
      categories: spec.categories,
      values: spec.values,
      key: spec.key,
    }),
    {
      capMm: 140,
      minWidthMm: (spec) => {
        const per = spec.key && Number(spec.key.per) > 0 ? Number(spec.key.per) : 1;
        const maxVal = (spec.values || []).reduce((m, v) => Math.max(m, Number(v) || 0), 0);
        const maxSymbols = Math.max(1, Math.ceil(maxVal / per));
        const labelLen = (spec.categories || []).reduce(
          (m, c) => Math.max(m, String(c).length),
          0
        );
        return Math.max(90, labelLen * 2.6 + maxSymbols * 11);
      },
      // A row per category, and each row must stay tall enough that the
      // symbols in it read as separate things a child can count.
      minHeightMm: (spec) =>
        Math.max(70, 22 + (spec.categories || []).length * 13),
    }
  ),

  // The rainforest cross-section. Nearly always the whole point of the sheet
  // it sits on, so it carries the most generous cap of any drawing here.
  "rainforest-layers": fromShared(
    rainforestLayersSvg,
    (spec) => ({
      labels: spec.labels,
      heights: spec.heights,
      notes: spec.notes,
      light: spec.light,
      highlight: spec.highlight,
      blank: spec.blank,
    }),
    { capMm: 200, minWidthMm: 140, minHeightMm: 100 }
  ),

  // A broad proportional food-group plate. Teaching and practice use identical
  // sectors; practice replaces selected labels/examples with decision spaces.
  "balanced-pattern-plate": fromShared(
    balancedPatternPlateSvg,
    balancedPatternPlateSpec,
    {
      capMm: 170,
      minWidthMm: 145,
      // The plate rearranges itself around whatever labels and examples a lesson
      // gives it, so its proportions are not a constant. Ask the drawing what it
      // actually came out as; a fixed floor here would be right for the default
      // wording and quietly wrong for a longer set.
      minHeightMm: (spec) =>
        Math.ceil(145 / balancedPatternPlateSvg.tightSvg(balancedPatternPlateSpec(spec)).aspect),
    }
  ),

  // A real map of a real place, drawn from the map image this package ships in
  // builder/assets/maps/ - the same asset and the same annotation geometry the
  // board uses, so a continent on the sheet is the continent on the screen.
  //
  // Nothing here draws land. A place is marked ON the real map with a point, a
  // region with a dashed area, a river with a line, each given in fractions of
  // the map image. A coastline a helper drew by eye looks confident and is
  // wrong by hundreds of miles, which is the one thing a locating map must not be.
  //
  // Height is handled strictly. An omitted height gets the mechanical default
  // because no size was asked for. A height that WAS asked for and cannot be
  // honoured is refused by name: silently substituting the default hands back a
  // picture of a different size from the one the designer sized the page around.
  map: (() => {
    const MIN_HEIGHT_MM = 60;
    const MAX_HEIGHT_MM = 170;
    const DEFAULT_HEIGHT_MM = 110;

    // The full-width landscape continents-and-oceans write-on form is wider
    // and shallower than an ordinary map: 12 markers, Equator, compass and
    // the joined Pacific edges need the page's full landscape width, and its
    // own height range keeps it there.
    const WRITE_ON_MIN_HEIGHT_MM = 120;
    const WRITE_ON_MAX_HEIGHT_MM = 143;
    const WRITE_ON_DEFAULT_HEIGHT_MM = 138;

    function writeOnMode(spec) {
      return spec.worksheetMode === "continents-and-oceans";
    }

    function heightFor(spec) {
      const writeOn = writeOnMode(spec);
      const min = writeOn ? WRITE_ON_MIN_HEIGHT_MM : MIN_HEIGHT_MM;
      const max = writeOn ? WRITE_ON_MAX_HEIGHT_MM : MAX_HEIGHT_MM;
      if (spec.heightMm === undefined) {
        return writeOn ? WRITE_ON_DEFAULT_HEIGHT_MM : DEFAULT_HEIGHT_MM;
      }
      const requested = Number(spec.heightMm);
      if (!Number.isFinite(requested) || requested < min || requested > max) {
        throw new Error(
          `VISUAL_SIZE_UNSUPPORTED: map heightMm ` +
            `${spec.heightMm} is outside ${min}-${max}mm.`
        );
      }
      return requested;
    }

    function mapSpec(spec) {
      if (writeOnMode(spec)) {
        return {
          map: spec.map,
          worksheetMode: spec.worksheetMode,
          continentMarkers: spec.continentMarkers,
          oceanMarkers: spec.oceanMarkers,
          seaInitialSpaces: spec.seaInitialSpaces,
          showEquator: spec.showEquator,
          showCompass: spec.showCompass,
          joinedEdges: spec.joinedEdges,
        };
      }
      return {
        map: spec.map,
        basin: spec.basin,
        labels: spec.labels,
        annotations: spec.annotations,
        selectedCountry: spec.selectedCountry,
      };
    }

    function rendererFor(spec) {
      return writeOnMode(spec) ? worldWriteOnMapSvg : realMapSvg;
    }

    return {
      render: (spec) => {
        const heightMm = heightFor(spec);
        const { svg } = rendererFor(spec).tightSvg(mapSpec(spec));
        return `<div class="h-figure h-figure--fixed" style="height:${heightMm}mm">${svg}</div>`;
      },
      measure: (spec) => heightFor(spec),
      needs: (spec) => {
        const heightMm = heightFor(spec);
        const { aspect } = rendererFor(spec).tightSvg(mapSpec(spec));
        // The width follows from the height it was given and the map's own real
        // proportions, so a map is never stretched to fill a zone.
        return {
          minWidthMm: Math.ceil(heightMm * aspect),
          minHeightMm: heightMm,
        };
      },
      greed: 0,
    };
  })(),

  // A dot lattice with a mirror line and a shape to reflect. Same reasoning
  // as coordinate-grid: more columns need more width.
  "reflection-grid": fromShared(
    reflectionGridSvg,
    (spec) => ({
      cols: spec.cols,
      rows: spec.rows,
      mirror: spec.mirror,
      shape: spec.shape,
      showReflection: spec.showReflection,
    }),
    {
      capMm: 150,
      minWidthMm: (spec) => Math.max(90, (Number(spec.cols) || 10) * 11),
      // A grid squares up: its height follows its ROW count exactly as its
      // width follows its columns, at the same millimetres per cell.
      minHeightMm: (spec) => Math.max(75, (Number(spec.rows) || 10) * 11),
    }
  ),

  // A tally table: bundles of five drawn as marks, not the raw number. Width
  // follows the label column and the widest row's marks together.
  "tally-chart": fromShared(
    tallyChartSvg,
    (spec) => ({
      title: spec.title,
      headers: spec.headers,
      rows: spec.rows,
      showTotals: spec.showTotals,
      blank: spec.blank,
    }),
    {
      capMm: 120,
      minWidthMm: (spec) => {
        const rows = spec.rows || [];
        let maxTally = 0;
        let maxLabelLen = 0;
        rows.forEach((r) => {
          maxTally = Math.max(maxTally, Number(r && r.tally) || 0);
          maxLabelLen = Math.max(maxLabelLen, String((r && r.label) || "").length);
        });
        const bundles = Math.floor(maxTally / 5);
        const remainder = maxTally % 5;
        const marksMm = bundles * 18 + remainder * 5;
        return Math.max(80, maxLabelLen * 2.6 + marksMm + 35);
      },
      // A row per category plus the header, and a totals row when asked for.
      // Rows must stay tall enough for a child to count the marks in one.
      minHeightMm: (spec) => {
        const rows = (spec.rows || []).length;
        const totals = spec.showTotals ? 1 : 0;
        return Math.max(60, 16 + (rows + totals) * 11);
      },
    }
  ),

  // A numbered grid carrying a shape and its slid image, joined by an arrow.
  // Same width reasoning as coordinate-grid, the grid it is drawn on top of.
  "translation-shape": fromShared(
    translationShapeSvg,
    (spec) => ({
      cols: spec.cols,
      rows: spec.rows,
      points: spec.points,
      translate: spec.translate,
      showImage: spec.showImage,
      arrowFrom: spec.arrowFrom,
    }),
    {
      capMm: 150,
      minWidthMm: (spec) => Math.max(90, (Number(spec.cols) || 10) * 11),
      // A grid squares up: its height follows its ROW count exactly as its
      // width follows its columns, at the same millimetres per cell.
      minHeightMm: (spec) => Math.max(90, (Number(spec.rows) || 10) * 11),
    }
  ),

  // A classified triangle: filled body, tick marks, and an optional
  // right-angle square or angle arcs.
  triangle: fromShared(
    triangleSvg,
    (spec) => ({
      kind: spec.kind,
      sides: spec.sides,
      ticks: spec.ticks,
      rightAngle: spec.rightAngle,
      angleArcs: spec.angleArcs,
      rotation: spec.rotation,
      symmetryLines: spec.symmetryLines,
      symmetryLinesAnswer: spec.symmetryLinesAnswer,
    }),
    // Lowered from 50mm. Daniel, on the printed rungs: "triangle could be
    // smaller". Like an angle it is an outline with a couple of marks on it,
    // and the marks scale with it.
    { capMm: 90, minWidthMm: 36, minHeightMm: 36 }
  ),

  "label-diagram": {
    requires: ["labels"],
    render: renderLabelDiagram,
    measure: measureLabelDiagram,
    needs: needsLabelDiagram,
    // Nought, and the comment here used to say 2 because "a bigger picture is
    // easier to label". The reasoning was wrong: the drawing is scaled by its
    // WIDTH and its height follows the aspect, so extra height cannot make the
    // picture bigger. All it did was grow the BOX while the picture stayed at
    // the top of it, which on a real sheet opened a gap between a photograph
    // and the question about it. The child read the question, looked up, and
    // the picture was somewhere else.
    greed: 0,
  },
};

// The shared drawings carry their own colours and strokes, so there is nothing
// per-helper to style here. What there IS, is the one rule that makes every
// drawing fit the space it is given.
//
// It lives HERE rather than in the renderer, because it belongs to the
// drawings and not to the page. When it sat in the renderer, anything that
// ─── label-diagram ───────────────────────────────────────────────────────
// A picture with a dot on each part it names, joined by a leader line out to
// either a printed label or a blank line for the child to write on.
//
// The odd one out in this file, and the reason it has its own entry rather
// than going through `fromShared`: every other helper here DRAWS itself from
// numbers, and this one is handed a photograph. So the spec carries the image
// and its natural pixel size, exactly as the slide engine's does.
//
// The leader line is the whole point. A child reads the answer by following
// the line from the part to its label, so a word floating in a corner is not a
// labelled diagram. That geometry lives in the shared module, which means the
// diagram on the board and the diagram on the sheet are the same picture.
//
// A label is BLANK unless the lesson says otherwise, because on a worksheet
// the child does the labelling. `given: true` prints the word instead, for a
// part the lesson hands over rather than asks for.

const labelDiagramSvg = require("../../../shared/visuals/label-diagram-svg");

function labelDiagramArgs(spec) {
  return {
    href: spec.imageHref,
    width: spec.imageWidth,
    height: spec.imageHeight,
    callouts: (spec.labels || []).map((l) => ({
      anchor: l.anchor,
      label: l.label,
      given: Boolean(l.given),
    })),
    // The anatomy-poster arrangement: labels stack down the left and right
    // margins by which half of the picture their dot sits in, so several
    // callouts never land on top of each other. 'auto' routes each to its
    // nearest margin, which collides the moment two parts sit close together -
    // and on a diagram worth labelling, they always do.
    layout: "sides",
    labelMaxChars: 18,
    // The labels stack down the LEFT and RIGHT, so the bands above and below
    // the picture hold nothing at all. Left at the shared default of 0.28 they
    // reserved better than half the height for white space: the plant came out
    // 240mm tall in every zone it was given, which is a whole portrait page for
    // a picture 600 pixels wide, and the sheet was refused for overflowing by
    // 12mm. Slim vertical bands leave the height to the drawing, which is the
    // part a child has to read.
    marginYRatio: 0.03,
  };
}

// The instruction over the picture: "Label the parts of the plant."
//
// This was being dropped in silence. The helper's own worked example in
// test/helper-examples.js carries a `text`, the catalogue prints that example
// and tells the designer "the example is the contract" - and the renderer built
// only the SVG. So a designer who followed the documentation exactly shipped a
// photograph with blank lines beside it and nothing anywhere saying what the
// child was supposed to write.
function renderLabelDiagram(spec) {
  const svg = labelDiagramSvg.buildLabelDiagramSvg(labelDiagramArgs(spec)).svg;
  // Wrapped for the same reason written-answers is: `.h-figure` claims the full
  // height of what it sits in, so an instruction line as its SIBLING came to
  // the stem's height plus all of the zone and the bottom was cut off. Scoped
  // to this wrapper, because every drawn helper shares `.h-figure` and none of
  // the others has a stem above it.
  return `
    <div class="h-figure-block">
      ${spec.text ? `<p class="h-figure-stem">${esc(spec.text)}</p>` : ""}
      <div class="h-figure">${svg}</div>
    </div>`;
}

function measureLabelDiagram(spec, widthMm) {
  const { aspect } = labelDiagramSvg.buildLabelDiagramSvg(labelDiagramArgs(spec));
  return stemMm(spec, widthMm) + heightFromAspect(aspect, widthMm, 240);
}

// Shared by the drawing and the measurement so the two cannot disagree, which
// is how a stem ends up drawn outside the zone and clipped without a word.
function stemMm(spec, widthMm) {
  return spec.text ? linesFor(spec.text, widthMm) * LINE_MM + SPACE.tight : 0;
}

function needsLabelDiagram(spec) {
  const labels = spec.labels || [];
  const count = labels.length;

  // What the diagram needs follows what is IN it, not a flat number.
  //
  // This was 120mm whatever it held, which made it a whole-page object by
  // decree: a two-label plant with short words was refused from a half-page
  // column that would have taken it comfortably. Daniel asked whether it could
  // be a quarter page and the honest answer was no, for no reason.
  //
  // Two things actually drive it. The picture has to survive having a label
  // band taken off each side, and those bands are sized to the longest label,
  // so a diagram naming "roots" needs far less margin than one naming
  // "photosynthesis happens here". And the labels stack down the two sides, so
  // the more parts are named the more height goes into stacking them.
  //
  // The legibility floor applies on top of this, in helpers/index.js, and is
  // usually what decides a photograph: it is computed from the drawing's own
  // smallest type, and it cannot be argued with here.
  // The band is sized to what a child has to WRITE on the line, not to what is
  // printed there. That distinction matters because on a worksheet almost every
  // label is blank, and a blank callout carries no type at all: the engine's
  // legibility floor finds nothing to measure and stays silent. This is the
  // only thing standing between a child and a 14mm line to write "roots" on.
  //
  // 3.2mm a character is primary handwriting, not print. Long labels are capped
  // at eighteen because the drawing wraps them onto a second line at that point
  // rather than letting one run on.
  const WRITE_MM_PER_CHAR = 3.2;
  const WRAP_AT = 18;

  // Each side is sized to the longest label ROUTED TO THAT SIDE, not to the
  // longest label anywhere. The drawing stacks each name down whichever half of
  // the picture its dot sits in, so a diagram whose long word is on the right
  // does not owe the left margin the same room. Measured from the longest
  // overall, a sunflower naming its "flower head" on the right demanded 35mm on
  // the left as well, for the word "leaf".
  const sideLongest = (side) =>
    labels
      .filter((l) => (side === "left" ? (l.anchor || [])[0] < 50 : (l.anchor || [])[0] >= 50))
      .reduce((n, l) => Math.max(n, String(l.label || "").length), 0);

  const bandFor = (side) =>
    Math.max(20, Math.min(sideLongest(side), WRAP_AT) * WRITE_MM_PER_CHAR);

  const bandMm = (bandFor("left") + bandFor("right")) / 2;
  const pictureMm = 44; // the smallest a photograph stays worth looking at

  return {
    minWidthMm: Math.min(267, Math.max(70, pictureMm + bandMm * 2)),
    // Two labels a side before the stack starts costing height.
    minHeightMm: Math.max(50, 26 + Math.ceil(count / 2) * 14),
  };
}

// built its own page (the size ladder, which prints each helper at a range of
// widths so a teacher can say where it stops working) did not get it, and
// every drawing came out at raw size and clipped. The ladder was showing
// pictures nobody would ever print, and being used to judge them.
const css = `
  /* Top, not centre. A zone grows to use spare page height, and the drawing
     inside it was being centred in the taller box while the questions beside
     it stayed at the top, so the two started at different heights and a row
     of "drawing on the left, its question on the right" did not line up. */
  /* The same quiet instruction line every other helper's stem uses. */
  .h-figure-stem { margin: 0 0 var(--space-tight); line-height: 1.35; }
  .h-figure-block { height: 100%; display: flex; flex-direction: column; }
  .h-figure-block .h-figure { flex: 1; height: auto; min-height: 0; }
  .h-figure { width: 100%; height: 100%; display: flex; align-items: flex-start; justify-content: center; }

  /* Fill the WIDTH and take the height that follows from it. The shared
     modules put a width and height on the SVG tag as well as a viewBox, and
     those are the drawing's own units, not millimetres: a triangle says 107,
     which a browser reads as 107 pixels, or 28mm. A max-width can only ever
     make something smaller, so a small drawing printed at 28mm however much
     room it had.
     Height AUTO rather than 100%, so the drawing is exactly as tall as its own
     proportions make it. At 100% it filled a grown box and letterboxed itself
     inside, which is the same misalignment again, from the other direction.
     max-height keeps it inside a box that is shorter than it wants. */
  .h-figure svg { width: 100%; height: auto; max-height: 100%; }

  /* A figure sized by its HEIGHT rather than by the width of its zone, because
     the designer asked for a height in millimetres. The drawing keeps its own
     aspect inside that height instead of stretching to the column. */
  .h-figure--fixed { height: auto; align-items: center; }
  .h-figure--fixed svg { width: auto; height: 100%; max-width: 100%; }
`;

module.exports = { helpers, css, fromShared };
