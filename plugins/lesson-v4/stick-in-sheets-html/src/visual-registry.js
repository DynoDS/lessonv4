"use strict";

const venn = require("../../shared/visuals/venn-svg");
const carroll = require("../../shared/visuals/carroll-svg");
const angle = require("../../shared/visuals/angle-svg");
const triangle = require("../../shared/visuals/triangle-svg");
const reflectionGrid = require("../../shared/visuals/reflection-grid-svg");
const coordinateGrid = require("../../shared/visuals/coordinate-grid-svg");
const translationShape = require("../../shared/visuals/translation-shape-svg");
const gridMap = require("../../shared/visuals/grid-map-svg");
const rainforestLayers = require("../../shared/visuals/rainforest-layers-svg");
const map = require("../../shared/visuals/map-svg");
const geographicalDescriptionFrame = require("../../shared/visuals/geographical-description-frame-svg");
const recordingTable = require("../../shared/visuals/recording-table-svg");
const geoboard = require("../../shared/visuals/geoboard-svg");
const numberLine = require("../../shared/visuals/number-line-svg");
const linePair = require("../../shared/visuals/line-pair-svg");
const barModel = require("../../shared/visuals/bar-model-svg");
const tallyChart = require("../../shared/visuals/tally-chart-svg");
const pictogram = require("../../shared/visuals/pictogram-svg");
const blankSurface = require("../../shared/visuals/blank-surface-svg");
const balancedPatternPlate = require("../../shared/visuals/balanced-pattern-plate-svg");
const circuitDiagram = require("../../shared/visuals/circuit-diagram-svg");
const circuitSymbolBank = require("../../shared/visuals/circuit-symbol-bank-svg");
const parachuteForces = require("../../shared/visuals/parachute-forces-svg");
const barChart = require("../../shared/visuals/bar-chart-svg");
const lineGraph = require("../../shared/visuals/line-graph-svg");
const shadedFraction = require("../../shared/visuals/shaded-fraction-svg");
const fractionWall = require("../../shared/visuals/fraction-wall-svg");
const money = require("../../shared/visuals/money-svg");
const dialScaleShared = require("../../shared/visuals/dial-scale-svg");
const measuringJugShared = require("../../shared/visuals/measuring-jug-svg");
const rulerShared = require("../../shared/visuals/ruler-svg");
const timelineShared = require("../../shared/visuals/timeline-svg");
const processChainShared = require("../../shared/visuals/process-chain-svg");
const classificationKeyShared = require("../../shared/visuals/classification-key-svg");
const conceptMapShared = require("../../shared/visuals/concept-map-svg");
const fishboneShared = require("../../shared/visuals/fishbone-svg");
const continuumLineShared = require("../../shared/visuals/continuum-line-svg");
const sourcePathwayShared = require("../../shared/visuals/source-pathway-svg");
const numberNetworkShared = require("../../shared/visuals/number-network-svg");
const clock = require("../../shared/visuals/clock-svg");
const turnDiagram = require("../../shared/visuals/turn-diagram-svg");
const triangleSquare = require("../../shared/visuals/triangle-square-svg");
const polygon = require("../../shared/visuals/polygon-svg");
const translationGrid = require("../../shared/visuals/translation-grid-svg");
const areaGrid = require("../../shared/visuals/area-grid-svg");
const comparison = require("../../shared/visuals/comparison-svg");
const placeValueChart = require("../../shared/visuals/place-value-chart-svg");
const placeValueMini = require("../../shared/visuals/place-value-mini-svg");
const baseTenBlocks = require("../../shared/visuals/base-ten-blocks-svg");
const counterGroup = require("../../shared/visuals/counter-group-svg");
const partWholeModel = require("../../shared/visuals/part-whole-model-svg");
const pyramid = require("../../shared/visuals/pyramid-svg");
const multGrid = require("../../shared/visuals/mult-grid-svg");
const { profileFor } = require("../../shared/visuals/surface-profiles");

// The one way the pack places a shared drawing laid out at its printed size,
// in the stick-in profile (ink, because the pack is photocopied). Any picture
// moved into shared/visuals/ reaches the pack through this.
function sharedPiece(module, defaultWidthMm, extra = {}) {
  return {
    geometry: module,
    laidOutAtWidth: true,
    tightSvg: (spec, box) => module.tightSvg(spec, profileFor("stickin", box || { widthMm: defaultWidthMm })),
    defaultWidthMm,
    ...extra,
  };
}

// A labelled diagram a child sticks in and writes the part names onto. The figure
// is the SAME one the board shows (the slide's label-diagram), so the cut-out and
// the board read as one activity; here the labels are left as blank write-on lines
// for the child to fill (the question form). It carries an external image, so
// unlike the pure-vector visuals it is sized by a usable printed WIDTH: wide
// enough that the picture reads and a child can write a word on each blank line.
const LABEL_DIAGRAM_WIDTH_MM = 135; // ~2 across the 277mm landscape width

// A printed copy of one source the child reads fine detail off - a document, a
// timetable, a photograph, a map - glued in because the board cannot show the
// detail large enough from the back of the room. It is the one piece with no
// write-on line: the child reads from it, so usability is READABLE DETAIL, and
// the default is the width of an exercise-book page with room to glue it down.
// A wide document at 165mm is about the size it would print on its own sheet,
// which is what the teacher used to make by hand from the PowerPoint.
const SOURCE_COPY_WIDTH_MM = 165;
// The caption line under the copy, in the pack's ordinary type: it says what
// the source is (place, date, what kind of thing) so a cut-out separated from
// the board still names its evidence. One line normally; a long caption wraps
// and the band grows by this much per extra line.
const SOURCE_COPY_CAPTION_LINE_MM = 5.5;
const SOURCE_COPY_CAPTION_PAD_MM = 1.5;
// Rough width of one caption character at the caption's 11pt, for line counting.
const SOURCE_COPY_CHAR_MM = 2.2;

// One source of truth for which visuals the pack can draw and how big each
// prints. The guiding rule is fit the MOST copies on a page that stay genuinely
// usable: size every visual to the smallest size a child can still work on, so
// the page packs tight, and let what "usable" means be judged per visual.
//   - `defaultWidthMm` — a fixed usable width, for visuals whose usability is
//     about staying legible at a glance (the Venn/Carroll labels, an angle to
//     name). These are already tuned to their densest legible size (4-up).
//   - `fitHeightMm` — size by printed HEIGHT instead, for visuals a child draws
//     ON, where usability is the size of each square, not the label. Filling
//     about half the page height means two rows fit (4-up for a typical grid)
//     while the squares stay big enough to count dots and rule lines on; the
//     width then follows the grid's own aspect, so a wide grid prints wider than
//     a square one but both keep the same usable square.
// The number-line entry supplies the write-on extension of the existing
// numberline family.
const VISUALS = {
  // 130mm: the child MARKS this line, so what has to be comfortable is the gap
  // between two ticks and the band underneath for their handwriting, not the
  // overall width. Question state is forced on every line here rather than
  // trusted to the spec: a stick-in is the child's copy, and an answer that
  // reaches it has given the task away before they start.
  "number-line": {
    // The one shared number line, in the stick-in profile: ink only, laid out
    // at the width it prints.
    ...sharedPiece(numberLine, 130),
    // A piece copied from a slide may carry the slide's answer dot; the child's
    // copy never shows it.
    specFn: (s) => {
      const question = (line) => {
        const out = Object.assign({}, line, { questionState: true });
        delete out.answer;
        return out;
      };
      const top = question(s);
      if (Array.isArray(s.lines)) top.lines = s.lines.map(question);
      return top;
    },
  },
  // The measuring scales and the thinking diagrams, each the one shared drawing
  // the board places (13 September 2026), laid out at the width they print, in
  // ink. Each width is the smallest at which a child can still read the words
  // and write in the spaces: a dial or a jug a child reads a level off, a
  // network with a number to write in each blank circle, and the diagrams wide
  // enough that their boxes hold their words at the pack's 11pt.
  "dial-scale": sharedPiece(dialScaleShared, 80),
  "measuring-jug": sharedPiece(measuringJugShared, 70),
  // A ruler a child measures against prints at TRUE SIZE, so its piece is as
  // wide as the ruler itself rather than any fixed width.
  ruler: sharedPiece(rulerShared, 120, { widthMmFor: (spec) => rulerShared.trueWidthMm(spec) }),
  timeline: sharedPiece(timelineShared, 200),
  "process-chain": sharedPiece(processChainShared, 160),
  "classification-key": sharedPiece(classificationKeyShared, 160),
  "concept-map": sharedPiece(conceptMapShared, 180),
  fishbone: sharedPiece(fishboneShared, 200),
  "continuum-line": sharedPiece(continuumLineShared, 160),
  "source-pathway": sharedPiece(sourcePathwayShared, 180),
  "number-network": sharedPiece(numberNetworkShared, 100),
  // 127mm: two copies fit the ~277mm landscape printable width (2×127 + 6mm gap = 260mm ✓)
  // and two rows fit the ~185mm landscape printable height (2×89.5 + 6mm gap = 185mm ✓).
  venn: { tightSvg: venn.tightSvg, defaultWidthMm: 127 },
  // 118mm: Carroll's aspect (988/748 ≈ 1.321) is narrower than Venn's so the grid is
  // proportionally taller. At 118mm the tile is ~89mm tall; 2×89 + 6mm gap = 184mm ≤ 185mm
  // (two rows fit). 119mm tips it over. Gives 4 Carrolls on one landscape page like the Venn.
  carroll: { tightSvg: carroll.tightSvg, defaultWidthMm: 118 },
  angle: { tightSvg: angle.tightSvg, defaultWidthMm: 45 },
  triangle: { tightSvg: triangle.tightSvg, defaultWidthMm: 45 },
  // 88mm tall: the write-on grid is the artefact a child draws on, so usability
  // is the printed square size, not the overall width. At ~88mm tall two grids
  // stack within the ~185mm landscape height (2×88 + 6mm gap = 182mm ✓), so a
  // typical grid prints four-up (two rows of two), and a small grid that is
  // narrower fits three across (six-up), while the squares stay ~9 to 11mm, big
  // enough to count dots and rule a line on. Sizing by height (width follows the
  // grid's aspect) keeps that square comfortable whatever the grid's shape. The
  // QUESTION form (no showReflection) is what the spec carries — the child draws
  // the reflected half themselves.
  "reflection-grid": { tightSvg: reflectionGrid.tightSvg, fitHeightMm: 88 },
  // 88mm tall: like the reflection grid, the numbered coordinate grid is the
  // artefact a child plots ON, so usability is the printed square size, not the
  // overall width. At ~88mm tall two grids stack within the ~185mm landscape
  // height (2×88 + 6mm gap = 182mm ✓), so a typical grid prints four-up (two rows
  // of two) with squares ~8 to 10mm — big enough to read the axis numbers and mark
  // a point on. Sizing by height (width follows the grid's aspect, which includes
  // the axis-number gutters) keeps that square comfortable whatever the grid's
  // shape. The BLANK form (no points) is what the spec carries — the child plots.
  "coordinate-grid": { tightSvg: coordinateGrid.tightSvg, fitHeightMm: 88 },
  // 88mm tall: the numbered translation grid is the artefact a child plots the
  // translated image ON, so usability is the printed square size, not the overall
  // width — sized exactly like the reflection/coordinate grids so two rows stack
  // within the ~185mm landscape height and the squares stay big enough to read the
  // axis numbers and mark on. The QUESTION form (showImage off) is what the spec
  // carries — the original shape sits on a clear grid and the child plots and joins
  // the translated image themselves.
  "translation-shape": { tightSvg: translationShape.tightSvg, fitHeightMm: 88 },
  // 88mm tall: dotty paper is the artefact a child rules peg-to-peg lines on, so
  // usability is the printed PEG SPACING, not the overall width - sized by height
  // like the other draw-on grids so two boards stack within the ~185mm landscape
  // height (2x88 + 6mm gap = 182mm) and print four-up. A 5x5 board at 88mm leaves
  // pegs about 16mm apart, which a Year 2 hand can rule a straight side between
  // and a Year 2 finger can touch and count one at a time. Sizing by height means
  // a wide 6x3 board prints wider than a square one and both keep that spacing.
  // A BLANK board (no shapes) is the ordinary stick-in form: bare dotty paper the
  // child draws their own shape on. A board carrying shapes is also valid - the
  // child counts and marks the sides of a shape that is already there - so unlike
  // the rainforest layers there is no specFn forcing one form, because both are
  // genuine write-on tasks rather than one being the printed answer to the other.
  geoboard: { tightSvg: geoboard.tightSvg, fitHeightMm: 88 },
  // 120mm wide: the river-town map carries dense grid numbers and feature labels a
  // child reads four-figure references off and annotates, so usability here is
  // keeping those numbers and labels legible, not maximum copies. At 120mm two
  // maps sit across the ~277mm landscape width and print one row per page (2-up),
  // each comfortably large enough to read a 2-digit reference and write on. A
  // per-item widthMm overrides it when a lesson wants it bigger or denser.
  "grid-map": { tightSvg: gridMap.tightSvg, defaultWidthMm: 120 },
  // 125mm wide: the child writes a layer name on each of the four ruled lines, so
  // usability here is the writing line, not the picture. At 125mm two cross
  // sections sit across the ~277mm landscape width (2x125 + 6mm gap = 256mm) and
  // the tile is ~84mm tall, so two rows fit the 185mm printable height and a class
  // set prints 4-up. Each ruled line comes out about 50mm, which a Year 4 hand
  // writes "understorey" on comfortably. Going narrower would shrink the lines
  // below that, which is the thing to protect here.
  // `specFn` forces the WRITE-ON form, because a stick-in piece is by definition
  // something the child marks: a spec that arrived with the layer names printed
  // would tile a finished answer for all thirty children. A designer who genuinely
  // wants a glued-in labelled reference copy (a support scaffold) still can, by
  // saying `blank: false` outright.
  "rainforest-layers": {
    tightSvg: rainforestLayers.tightSvg,
    defaultWidthMm: 125,
    specFn: (s) => Object.assign({}, s, { blank: s.blank !== false }),
  },
  // 150mm wide: the child writes continent and ocean names beside the numbered
  // and lettered markers, so the handwriting, not the coastline stroke, sets the
  // usable size. The base is the real shipped world map - the same asset the
  // board and the worksheet draw - so the map a child labels in their book is
  // the map they were taught from, and its coastlines are the world's rather
  // than anyone's idea of it. The registry forces the write-on world form even
  // if a labelled teaching map was copied across by mistake. It is the one
  // shared map (shared/visuals/map-svg.js) in the pack's ink profile, laid out
  // at the width it prints, so its markers and boxes are sized for a Year 4
  // pencil rather than as a share of the picture (13 September 2026).
  map: sharedPiece(map, 150, {
    specFn: (s) => Object.assign({}, s, {
      map: map.WORLD_KEY,
      worksheetMode: "continents-and-oceans",
    }),
  }),
  // 145mm wide: this is a handwriting frame, so the ruled lines set the minimum
  // usable size. The registry always forces task mode, preventing optional
  // teacher answers or reveal text copied from a slide from appearing in books.
  "geographical-description-frame": {
    tightSvg: geographicalDescriptionFrame.tightSvg,
    defaultWidthMm: 145,
    specFn: (s) => Object.assign({}, s, { mode: "task", showAnswers: false }),
  },
  // 160mm wide: a write-on recording table is sized by the handwriting its
  // response cells must hold - a Year 4 phrase per cell - so one or two tables
  // sit on a landscape row and the cells stay big enough to write in. The
  // module itself always renders the QUESTION form: any `||`-marked answer
  // cell copied from a check slide is stripped to a blank write-on cell, so
  // copying either the task or the answer table yields the same blank piece.
  table: { tightSvg: recordingTable.tightSvg, defaultWidthMm: 160 },

  // ── Pictures the pack could not draw until 13 September 2026, when every
  //    picture became one shared drawing on every surface. Whether a lesson
  //    glues one into a book is the book-example designer's call; the pack
  //    only has to be able to print the same picture the board showed. Each
  //    width is the smallest at which that drawing's own words still print at
  //    about 9pt or more, so the page still packs tight.
  //
  // 45mm, like the angle: a pair of lines reads at a glance or not at all.
  "line-pair": { tightSvg: linePair.tightSvg, defaultWidthMm: 45 },
  // 110mm: the child writes a number into the dashed part, so the part has to
  // hold a Year 4 hand's digits.
  "bar-model": { tightSvg: barModel.tightSvg, defaultWidthMm: 110 },
  // 120mm: a tally to complete (blank: true) needs its tally cells wide
  // enough for the bundles of five the child strikes through.
  "tally-chart": { tightSvg: tallyChart.tightSvg, defaultWidthMm: 120 },
  // 110mm: the half symbol has to stay visibly half a circle.
  pictogram: { tightSvg: pictogram.tightSvg, defaultWidthMm: 110 },
  // 130mm, like the number line: the empty band above the line is where the
  // child draws their own jumps.
  "blank-surface": { tightSvg: blankSurface.tightSvg, defaultWidthMm: 130 },
  // 180mm: the plate's smallest labels print at about 10pt here; narrower and
  // the food-group names in the thin wedges drop under that.
  "balanced-pattern-plate": { tightSvg: balancedPatternPlate.tightSvg, defaultWidthMm: 180 },
  // 40mm tall, width following the number of circuits: one circuit and a row
  // of three keep the same symbol size, which is what the child compares.
  "circuit-diagram": { tightSvg: circuitDiagram.tightSvg, fitHeightMm: 40 },
  // 30mm tall, width following the number of symbols, so every symbol keeps a
  // cell big enough to tell an open switch from a closed one. It is a long thin
  // strip, so the 7mm band a labelled piece gives up for its letter takes a
  // quarter of its height; at 22mm that left the names at about 7pt.
  "circuit-symbol-bank": { tightSvg: circuitSymbolBank.tightSvg, fitHeightMm: 30 },
  // 200mm: seven labels round two parachutes; at this width the smallest
  // prints at about 10pt, which is the thing to protect.
  "parachute-forces": { tightSvg: parachuteForces.tightSvg, defaultWidthMm: 200 },
  // The two charts are laid out at the width they print, in the pack's
  // profile, so their scale numbers are set at the pack's own type size.
  "bar-chart": sharedPiece(barChart, 130),
  "line-graph": sharedPiece(lineGraph, 130),
  // The shared shaded fraction, fraction wall and coins, laid out at the width
  // they print, in ink. Both forms of a shaded fraction are real write-on tasks
  // (shade three eighths of a blank bar; say what fraction is shaded), so no
  // form is forced. 110mm leaves a bar's parts wide enough to shade with a
  // pencil and two pieces side by side on the landscape row.
  "shaded-fraction": sharedPiece(shadedFraction, 110),
  // 130mm: the smallest pieces of a twelfths row stay wide enough to name, and
  // a child can rule across the wall to compare two rows.
  "fraction-wall": sharedPiece(fractionWall, 130),
  // 130mm: coins at life size, as on the sheet, with the row wrapping only if
  // there are more than a strip holds.
  money: sharedPiece(money, 130),
  // The pictures below reached the pack on 13 September 2026, when every
  // picture became one shared drawing on all four surfaces. Each prints at the
  // size it lays itself out at in the pack's ink profile, inside the width here.
  //
  // 60mm: a blank face is the write-on form (draw the hands), and at 60mm the
  // five-minute ticks sit far enough apart for a Year 3 hand to aim at one. A
  // face with hands is a read-and-write piece. A row of faces wants a wider
  // `widthMm`, or `clock-row` below, which puts a line under each.
  clock: sharedPiece(clock, 60),
  // 50mm: a turn to name, about the size of an angle piece.
  "turn-diagram": sharedPiece(turnDiagram, 50),
  // 70mm: the blank shape is where the child writes the answer, and the
  // drawing grows its shapes for handwriting before this width matters.
  "triangle-square": sharedPiece(triangleSquare, 70),
  // 70mm: a shape to draw lines of symmetry on or measure. The child's copy
  // never carries the answer overlay, the fold or the verdict from a slide.
  polygon: sharedPiece(polygon, 70, {
    specFn: (s) => {
      const out = Object.assign({}, s);
      delete out.symmetryLines;
      delete out.symmetryLinesAnswer;
      if (Array.isArray(s.shapes)) {
        out.shapes = s.shapes.map((shape) => {
          const one = Object.assign({}, shape);
          delete one.verdict;
          delete one.fold;
          return one;
        });
      }
      return out;
    },
  }),
  // 90mm: a grid the child reads a move off or marks a marker on, sized like
  // the other draw-on grids so the squares stay big enough to count.
  "translation-grid": sharedPiece(translationGrid, 90),
  // 110mm: the child counts squares inside each patch.
  "area-grid": sharedPiece(areaGrid, 110),
  // 70mm: room for the two values either side of the ring; a bare ring prints
  // at its own size, about 15mm, a symbol written comfortably inside it. A
  // piece copied from an answer slide never carries its revealed symbol.
  "comparison-slot": sharedPiece(comparison, 70, {
    specFn: (s) => {
      const out = Object.assign({}, s);
      delete out.answer;
      return out;
    },
  }),
  // The place value family (13 September 2026): the same drawings the board,
  // the sheet and the wall place, in ink, at the width that keeps each one
  // usable in a book.
  // 150mm: a write-in chart: each digit column holds a child's handwritten digit.
  "place-value-chart": sharedPiece(placeValueChart, 150),
  // 70mm: a small vocabulary picture glued beside a word.
  "place-value-mini": sharedPiece(placeValueMini, 70),
  // 150mm: four columns of blocks a child reads the number from.
  "base-ten-blocks": sharedPiece(baseTenBlocks, 150),
  // 120mm: the counters stay big enough to read the value on each.
  "counter-group": sharedPiece(counterGroup, 120),
  // 110mm: the circles a child writes a part or whole into.
  "part-whole-model": sharedPiece(partWholeModel, 110),
  // 100mm: bricks a child writes a number into.
  "pyramid": sharedPiece(pyramid, 100),
  // 90mm: cells a child writes a product into.
  "mult-grid": sharedPiece(multGrid, 90),
};

// Row visuals: one child's piece is a strip of N figures, each with its own
// write-on line beneath. The figure geometry is the SAME shared module the
// single visuals use. defaultFigureWidthMm sets the contain-box width when the
// spec doesn't supply figureWidthMm — sized so a one-word answer (e.g. "acute")
// fits the line and the figure stays big enough to judge.
const ROW_VISUALS = {
  "angle-row": { tightSvg: angle.tightSvg, defaultFigureWidthMm: 38 },
  "triangle-row": { tightSvg: triangle.tightSvg, defaultFigureWidthMm: 42 },
  // A strip of shapes on dotty paper, each with its own write-on line: count the
  // sides and corners of this one, then name it, then the next. It needs a taller
  // box than an angle or a triangle does, and the reason is the pegs. An angle is
  // judged by its opening, which survives being small; a dotty-paper shape is
  // COUNTED, one corner at a time, by a Year 2 finger. At the shared 26mm box a
  // 5x5 board puts its pegs about 4mm apart, close enough that a finger covers
  // three at once and the count is lost - which is the whole task. 46mm leaves
  // them about 8mm apart, and three shapes still sit across the landscape row.
  "geoboard-row": { tightSvg: geoboard.tightSvg, defaultFigureWidthMm: 46, boxHeightMm: 46 },
  // A strip of clock faces, each with its own line for the child to write the
  // time: the sheet's clock-row as a glued piece. 44mm keeps every face's
  // numerals at the pack's readable size.
  "clock-row": { ...sharedPiece(clock, 44), defaultFigureWidthMm: 44, boxHeightMm: 44 },
};

const BOXES_PER_ROW = 3; // draw-box-row wraps at this count (same as ROW_PER_ROW)

// Clearance between the bottom of a row figure and its write-on line. The
// child's word sits ON the line and rises into this gap, so it has to hold a
// Year 4 lowercase word without the ascenders colliding with the figure -
// 8mm does; the 4mm it used to be put the writing into the angle's arms.
const ROW_LINE_GAP_MM = 8;

// Common bounding box every row-figure is contain-fitted into. Tall acute angles
// and wide right-angle figures all occupy the same footprint, so none looks
// "way bigger" than its neighbours and the write-on lines all sit at one level.
// spec.figureWidthMm overrides the default when the caller wants a wider/narrower box.
const ROW_BOX_H_MM = 26;   // target box height (constant; width is per-visual)
const ROW_PER_ROW  = 3;    // figures per sub-row before wrapping

// A figure whose question-defining content is missing would still draw — as an
// unlabelled Venn, a shapeless reflection grid — and then tile a blank, wrong copy
// for every child. That is worse than no figure, so it is caught here and the item
// is skipped with a clear warning, exactly as an empty row or box list is. Only the
// load-bearing field of each visual is required. Visuals whose missing fields fall
// back to a genuine, valid default (an angle defaults to 45 degrees, a triangle to
// scalene, both perfectly good "classify this" questions) are deliberately absent
// from the switch, so a convenience default is left alone.
function missingQuestionContent(item) {
  const s = item.spec || {};
  const filled = (v) => String(v == null ? "" : v).trim().length > 0;
  switch (item.visual) {
    case "venn":
      if (!filled(s.label1) || !filled(s.label2)) {
        return "a Venn needs both circle labels (label1 and label2)";
      }
      return null;
    case "carroll":
      if (!filled(s.rowLabel) || !filled(s.rowNotLabel) || !filled(s.colLabel) || !filled(s.colNotLabel)) {
        return "a Carroll diagram needs all four row and column labels";
      }
      return null;
    case "number-line":
      try {
        numberLine.normalise(s);
        return null;
      } catch (error) {
        return error.message;
      }
    // A picture whose spec cannot draw (a bar with no parts, a coin row with no
    // coins, a counter group with no counters) would tile a broken copy for every
    // child, so the shared drawing's own refusal names what is missing.
    case "shaded-fraction":
    case "fraction-wall":
    case "money":
    case "place-value-chart":
    case "place-value-mini":
    case "base-ten-blocks":
    case "counter-group":
    case "part-whole-model":
    case "pyramid":
    case "mult-grid":
      try {
        VISUALS[item.visual].geometry.normalise(s);
        return null;
      } catch (error) {
        return error.message;
      }
    case "reflection-grid":
      if (!Array.isArray(s.shape) || s.shape.length === 0) {
        return "a reflection grid needs a shape to reflect";
      }
      return null;
    case "grid-map":
      if (!Array.isArray(s.features) || s.features.length === 0) {
        return "a grid map needs at least one feature to read off";
      }
      return null;
    case "table":
      // The headers are the question: a table without them would tile an
      // unlabelled grid nobody can answer into. Rows carry the given item
      // names, so an empty rows list is a table with nothing to decide about.
      if (!Array.isArray(s.headers) || s.headers.filter((h) => filled(h)).length < 2) {
        return "a recording table needs at least two column headers";
      }
      if (!Array.isArray(s.rows) || s.rows.length === 0) {
        return "a recording table needs at least one row to record into";
      }
      return null;
    case "triangle-square":
      // A child's piece is a question, so exactly one shape is the unknown.
      try {
        triangleSquare.refuseUnlessOneBlank(s);
        return null;
      } catch (error) {
        return error.message;
      }
    case "polygon":
      try {
        polygon.normalise(s);
        return null;
      } catch (error) {
        return error.message;
      }
    case "translation-shape":
      // The whole task is to translate a GIVEN shape, so the original shape is
      // load-bearing: without points there is nothing to translate and the piece
      // would tile a blank grid for every child.
      if (!Array.isArray(s.points) || s.points.length < 2) {
        return "a translation grid needs a shape (points) to translate";
      }
      return null;
    case "source-copy":
      // The picture IS the piece and the caption is what names it once it is
      // cut free of the page: without either the child holds a blank or an
      // anonymous scrap. The file itself is checked where it is opened.
      if (!filled(s.imagePath)) {
        return "a source copy needs imagePath, the published picture the slide shows";
      }
      if (!filled(s.caption)) {
        return "a source copy needs a caption saying what the source is (place, date, what kind of thing)";
      }
      return null;
    case "coordinate-grid":
      // A BLANK numbered grid is a valid write-on in itself (the child plots on
      // it), so — like angle/triangle — no field is required for the stick-in use.
      // Only the OPTIONAL answer-copy path is load-bearing: if the item asks to
      // join points into a shape, or supplies points to plot, those points must be
      // real, or it would tile a grid that silently drops the shape it promised.
      if (s.join || Array.isArray(s.points)) {
        const pts = Array.isArray(s.points) ? s.points : [];
        const good = pts.filter((p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
        if (s.join && good.length < 2) {
          return "a coordinate grid with join:true needs at least two points with numeric x and y to draw the shape";
        }
        if (Array.isArray(s.points) && good.length === 0) {
          return "a coordinate grid given points needs each point to have a numeric x and y";
        }
      }
      return null;
    case "geoboard":
    case "geoboard-row":
      // A BLANK dotty board is a valid write-on in itself - the child draws their
      // own shape on it - so, like the coordinate grid, no field is required.
      // Only a board that PROMISES a shape is load-bearing: a shapes list whose
      // entries carry no usable vertices would tile a bare grid where every child
      // was supposed to receive a shape to count, and the piece would look right.
      {
        const specs = item.visual === "geoboard-row"
          ? ((item.spec && item.spec.figures) || [])
          : [s];
        for (const one of specs) {
          const declared = [];
          if (Array.isArray(one.shapes)) declared.push(...one.shapes);
          if (one.shape) declared.push(one.shape);
          if (declared.length === 0) continue;
          const usable = declared.filter((shape) => {
            const points = Array.isArray(shape) ? shape : (shape && shape.points);
            return Array.isArray(points)
              && points.filter((pt) => Array.isArray(pt) && pt.length >= 2
                && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1]))).length >= 2;
          });
          if (usable.length !== declared.length) {
            return "a geoboard given shapes needs each one to carry at least two vertices with numeric x and y";
          }
        }
      }
      return null;
    // A chart or diagram with nothing to show would tile an empty frame for
    // every child. Where the drawing itself refuses a spec (a symbol it does
    // not know, a parachute ratio that is not the fair test), that refusal is
    // the reason given, so the item is skipped by name rather than crashing
    // the whole pack.
    case "bar-chart":
      if (!Array.isArray(s.categories) || s.categories.length === 0 || !Array.isArray(s.values) || s.values.length === 0) {
        return "a bar chart needs categories and a value for each";
      }
      return null;
    case "line-graph":
      if (!Array.isArray(s.points) || !s.points.some((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y))) {
        return "a line graph needs at least one point with a numeric x and y";
      }
      return null;
    case "pictogram":
      if (!Array.isArray(s.categories) || s.categories.length === 0) {
        return "a pictogram needs its categories";
      }
      return null;
    case "tally-chart":
      if (!Array.isArray(s.rows) || s.rows.length === 0) {
        return "a tally chart needs at least one row";
      }
      return null;
    case "circuit-diagram":
    case "circuit-symbol-bank":
    case "parachute-forces": {
      const drawing = { "circuit-diagram": circuitDiagram, "circuit-symbol-bank": circuitSymbolBank, "parachute-forces": parachuteForces }[item.visual];
      try {
        drawing.tightSvg(s);
        return null;
      } catch (error) {
        return error.message;
      }
    }
    default:
      return null;
  }
}

module.exports = {
  VISUALS,
  ROW_VISUALS,
  BOXES_PER_ROW,
  ROW_PER_ROW,
  missingQuestionContent,
  ROW_BOX_H_MM,
  ROW_LINE_GAP_MM,
  LABEL_DIAGRAM_WIDTH_MM,
  SOURCE_COPY_WIDTH_MM,
  SOURCE_COPY_CAPTION_LINE_MM,
  SOURCE_COPY_CAPTION_PAD_MM,
  SOURCE_COPY_CHAR_MM,
};
