'use strict';

// The cross-engine visual-parity manifest — the single source of truth for which
// shared visual primitive reaches which renderer. Read by builder/scripts/check-parity.js.
//
// A lesson's visuals are drawn by four surfaces, four code renderers:
//   slides      - the board (builder/, ZONE_COMPAT keys)
//   worksheets  - the printed sheet (worksheet-html/, REGISTRY keys)
//   wall        - classroom display cards (working-wall-html/, VISUAL_KEY_FNS keys)
//   stickin     - the cut-and-glue write-on pack (stick-in-sheets-html/, VISUALS/branches)
//
// Each entry below names ONE logical primitive and, per engine, the exact key that
// renderer dispatches on — or `false` when the primitive genuinely does not belong
// in that engine, with the reason in `note`. Engines name the same concept
// differently (the slide `numberline` is `numberLine` on the wall and
// `number-line-question` on a sheet), so the value is the real key for THAT engine,
// not a shared label. A figure with question/row variants, or a slide base plus a
// flag-variant, lists them as an array.
//
// What the guard does with this:
//   - FORWARD  — every key here must be live in that renderer. A `false` is honoured;
//     a forgotten WIRE (declared but absent) fails loudly, before a lesson does.
//   - COVERAGE — every live wall/stick-in key, and every non-layout slide key, must
//     appear here, so a new figure can't exist in a renderer without a scoping decision.
//
// What it deliberately does NOT do: nag that a figure sits in three engines but not a
// fourth. Whether (say) a geoboard SHOULD also become a write-on stick-in piece is a
// pedagogical scoping call the helper-builder owns, not a mechanical rule — so an
// honest `false` with its reason is a recorded decision, not a gap to chase. Recording
// it here is what makes the absence visible instead of silent.

const PRIMITIVES = [
  // ── Shared-geometry figures (one drawing in shared/visuals/, consumed by every
  //    renderer it reaches). These are the parity-critical set: identical shape on
  //    board, paper, wall and stick-in piece, so a skip shows as words where a picture should be.
  { id: 'venn',            slides: 'venn',            worksheets: 'venn',                          wall: 'venn',            stickin: 'venn',
    geometrySource: 'shared/visuals/venn-svg.js',
    successCriteriaHelpers: [
      { key: 'venn-overlap', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'regionCueSvg', spec: { region: 'overlap' } } },
      { key: 'venn-outside', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'regionCueSvg', spec: { region: 'outside' } } }
    ] },
  { id: 'carroll',         slides: 'carroll',         worksheets: 'carroll',                       wall: 'carroll',         stickin: 'carroll',
    geometrySource: 'shared/visuals/carroll-svg.js',
    successCriteriaHelpers: [
      { key: 'carroll-one-box', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'oneCellCueSvg', spec: {} } }
    ] },
  { id: 'angle',           slides: 'angle',           worksheets: 'angle',          wall: 'angle',           stickin: ['angle', 'angle-row'],
    geometrySource: 'shared/visuals/angle-svg.js',
    successCriteriaHelpers: [
      { key: 'angle-arc', mode: 'both', fullSize: { type: 'angle', degrees: 60 }, inline: { treatment: 'simplified', spec: { degrees: 60, successCriteriaInline: true } } }
    ] },
  { id: 'triangle',        slides: ['triangle', 'triangle-nonexample'], worksheets: 'triangle', wall: 'triangle', stickin: ['triangle', 'triangle-row'],
    geometrySource: 'shared/visuals/triangle-svg.js',
    successCriteriaHelpers: [
      { key: 'dash-equal-sides', mode: 'both', fullSize: { type: 'triangle', kind: 'isosceles' }, inline: { treatment: 'simplified', spec: { kind: 'isosceles', successCriteriaInline: true } } }
    ] },
  { id: 'reflection-grid', slides: 'reflection-grid', worksheets: 'reflection-grid', wall: 'reflection-grid', stickin: 'reflection-grid',
    geometrySource: 'shared/visuals/reflection-grid-svg.js',
    successCriteriaHelpers: [
      { key: 'reflect-across-line', mode: 'both', fullSize: { type: 'reflection-grid', cols: 4, rows: 3, mirror: { orientation: 'vertical', at: 2 }, shape: [[0, 0], [1, 0], [1, 1]], showReflection: true }, inline: { treatment: 'simplified', method: 'reflectionCueSvg', spec: {} } }
    ] },
  { id: 'translation-shape', slides: 'translation-shape', worksheets: 'translation-shape', wall: 'translation-shape', stickin: 'translation-shape',
    geometrySource: 'shared/visuals/translation-shape-svg.js',
    successCriteriaHelpers: [
      { key: 'translate-shape', mode: 'both', fullSize: { type: 'translation-shape', cols: 5, rows: 4, points: [[1, 1], [2, 1], [2, 2]], translate: { dx: 2, dy: 1 }, showImage: true }, inline: { treatment: 'simplified', method: 'translationCueSvg', spec: {} } }
    ],
    note: 'The signature picture of a translation lesson: a whole shape AND its translated image on ONE numbered coordinate grid, with a dashed slide-arrow - two full polygons the older translation-grid (single start/end markers) and coordinate-grid (one shape) could not draw. All four code engines draw from the one shared module shared/visuals/translation-shape-svg.js. Two modes by showImage: the write-on TASK form (original only, the child plots+joins the image) reaches the stick-in; the image-shown ANSWER form (original + image + arrow) is the worked-example/wall-reference form. Serves all four because it is both a write-on figure the child marks AND a reference/answer figure.' },
  { id: 'label-diagram',   slides: 'label-diagram',   worksheets: 'label-diagram',                          wall: false,             stickin: 'label-diagram',
    geometrySource: 'shared/visuals/label-diagram-svg.js',
    successCriteriaHelpers: [
      { key: 'label-with-leader', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'leaderCueSvg', spec: {} } }
    ],
    note: 'wall:false as a standalone photo-based primitive. The wall DOES show finished-labels anatomy posters, but via a different route: a `callouts` array on any drawn wall primitive (the labelledDiagram card), composited through the SAME shared overlay (label-diagram-svg.js). So the annotation geometry is shared four ways; only the photo-based standalone figure is board/sheet/stick-in.' },
  { id: 'line-pair',       slides: 'line-pair',       worksheets: 'line-pair',  wall: 'line-pair',       stickin: false,
    geometrySource: 'shared/visuals/line-pair-svg.js',
    successCriteriaHelpers: [
      { key: 'arrow-parallels', mode: 'both', fullSize: { type: 'line-pair', relationship: 'parallel', form: 'horizontal', notation: 'arrows' }, inline: { treatment: 'reuse', spec: { relationship: 'parallel', form: 'horizontal', notation: 'arrows' } } },
      { key: 'square-corner', mode: 'both', fullSize: { type: 'line-pair', relationship: 'perpendicular', form: 'L', notation: 'right-angle' }, inline: { treatment: 'reuse', spec: { relationship: 'perpendicular', form: 'L', notation: 'right-angle' } } }
    ],
    note: 'stickin:false — parallel/perpendicular lines are read and answered, not marked on; no write-on piece yet.' },
  { id: 'geoboard',        slides: 'geoboard',        worksheets: 'geoboard',    wall: 'geoboard',        stickin: false,
    geometrySource: 'shared/visuals/geoboard-svg.js',
    successCriteriaHelpers: [
      { key: 'line-of-symmetry', mode: 'both', fullSize: { type: 'geoboard', cols: 3, rows: 3, shapes: [{ points: [[0, 0], [3, 0], [3, 3], [0, 3]], closed: true }], symmetryLines: [[[1.5, 0], [1.5, 3]]] }, inline: { treatment: 'simplified', method: 'symmetryCueSvg', spec: {} } }
    ],
    note: 'stickin:false — a geoboard could become a write-on draw-on-dots piece; not wired today. Revisit if a lesson needs children to draw on a glued geoboard.' },
  { id: 'bar-model',       slides: 'bar-model',       worksheets: 'bar-model',      wall: 'bar-model',       stickin: false,
    geometrySource: 'shared/visuals/bar-model-svg.js',
    successCriteriaHelpers: [
      { key: 'bar-model-parts', mode: 'both', fullSize: { type: 'bar-model', shape: 'part-whole', whole: { label: 'Whole' }, parts: [{ label: 'Part' }, { label: 'Part' }] }, inline: { treatment: 'simplified', spec: { shape: 'part-whole', whole: { label: '' }, parts: [{ label: '', value: 1 }, { label: '', value: 1 }, { label: '', value: 1 }] } } },
      { key: 'bar-model-compare', mode: 'both', fullSize: { type: 'bar-model', shape: 'comparison', bars: [{ name: 'A', label: 'A', value: 3 }, { name: 'B', label: 'B', value: 2 }], difference: { label: '?', value: 1 } }, inline: { treatment: 'simplified', method: 'comparisonCueSvg', spec: {} } }
    ],
    note: 'stickin:false — bar models are drawn fresh in the book via the blank-surface/draw-box write-on, not cut-and-glued pre-drawn.' },
  { id: 'tally-chart',     slides: 'tally-chart',     worksheets: 'tally-chart',  wall: 'tally-chart',     stickin: false,
    geometrySource: 'shared/visuals/tally-chart-svg.js',
    successCriteriaHelpers: [
      { key: 'tally-five', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'tallyMarksSvg', spec: { count: 5 } } }
    ],
    note: 'stickin:false - a blank tally to complete lives on the worksheet, not as a glued strip.' },
  { id: 'pictogram',       slides: 'pictogram',       worksheets: 'pictogram',                     wall: 'pictogram',       stickin: false,
    note: 'stickin:false — a pictogram is read-and-answer; no write-on cut-out.' },
  { id: 'blank-surface',   slides: 'blank-surface',   worksheets: 'blank-surface', wall: false,          stickin: false,
    note: 'wall/stickin:false — the draw-your-own surface IS the worksheet/board write space; in the book the equivalent write-on is draw-box-row.' },
  { id: 'grid-map',        slides: 'grid-map',        worksheets: 'grid-map',                      wall: 'grid-map',        stickin: 'grid-map' },
  { id: 'rainforest-layers', slides: 'rainforest-layers', worksheets: 'rainforest-layers', wall: 'rainforest-layers', stickin: 'rainforest-layers',
    note: 'The central teaching visual of a rainforest layers lesson: four stacked bands (emergent / canopy / understorey / forest floor) whose TINT carries the light gradient, brightest at the top to near dark at the floor. All four, and none of them is optional here. The gradient is the idea the lesson rests on, so the child has to meet the same picture everywhere: taught on the board across several slides (highlight dims two layers so half the diagram can be discussed at a time), read from on the sheet, anchored on the wall all unit, and labelled by the child in their own book. The board/sheet/wall forms are the LABELLED read-and-answer figure; the stick-in is the WRITE-ON form (`blank`), the same bands and trees with a ruled line beside each for the child to name the layers, which is why it reaches the stick-in pack and so the book. UK spelling "understorey" is baked into the shared module, so no engine can ship the American spelling.' },
  { id: 'circuit-diagram', slides: 'circuit-diagram', worksheets: 'circuit-diagram', wall: 'circuit-diagram', stickin: false,
    note: 'One series circuit in the standard primary symbols. Wave 5 made the shared module strict and pointed the worksheet and the wall at it, so the board, the sheet and the display now draw the identical circuit rather than three hand-made ones that could disagree about an open switch. The drawing refuses to invent, round, clamp, drop or truncate any part of the science it is given: a lesson asking "will this lamp light?" turns entirely on the cells, the components, the switch and the path being exactly as stated. stickin:false — the pack is for write-on cut-outs a child completes in their book, and a schematic to READ is not that; a draw-your-own-circuit task belongs in blank-surface.' },
  { id: 'polygon',         slides: 'polygon',         worksheets: 'shape',                          wall: false,             stickin: false,
    note: 'worksheets via shape (the shapes renderer). wall:false — individual polygons appear inside reference cards, not as a standalone wall primitive.' },

  // ── Other cross-engine figures (separate implementations per engine, not a single
  //    shared/visuals module, but the same concept the child should meet in each place).
  { id: 'triangle-square', slides: 'triangle-square', worksheets: 'triangle-square',               wall: 'triangle-square', stickin: false },
  { id: 'turn-diagram',    slides: 'turn-diagram',    worksheets: 'turn-diagram', wall: 'turn-diagram', stickin: false,
    geometrySource: 'shared/visuals/turn-diagram-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'turn-clockwise', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { direction: 'clockwise' } } },
      { key: 'turn-anticlockwise', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { direction: 'anticlockwise' } } }
    ] },
  { id: 'clock',           slides: 'clock',           worksheets: 'clock-row',     wall: 'clock',           stickin: false },
  { id: 'numberline',      slides: 'numberline',      worksheets: 'number-line',                   wall: 'numberLine',      stickin: false,
    geometrySource: 'shared/visuals/numberline-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'jump-right', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { direction: 'right' } } },
      { key: 'jump-left', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { direction: 'left' } } }
    ] },
  { id: 'coordinate-grid', slides: 'coordinate-grid', worksheets: 'coordinate-grid',                   wall: 'coordinate-grid', stickin: 'coordinate-grid',
    geometrySource: 'shared/visuals/coordinate-grid-svg.js',
    successCriteriaHelpers: [
      { key: 'plot-grid', mode: 'both', fullSize: { type: 'coordinate-grid', max: 3, route: [2, 2] }, inline: { treatment: 'simplified', spec: { cols: 3, rows: 3, numbers: false, route: [2, 2] } } }
    ],
    note: 'The grid has two distinct uses, split by whether it is BLANK or PLOTTED. A BLANK numbered grid is a live practice/write-on surface: the child plots on it (stickin - a grid they cannot rule accurately by hand in a squared book). A PLOTTED/JOINED grid (points marked, optionally join:true into a shape) is a WORKED EXAMPLE - a plotted point or a joined shape on a numbered grid - which is exactly what a wall reference card shows, so wall added: the wall draws the plotted form (before this, coordinate lessons fell back to a geoboard, losing the axis numbers the whole unit turns on). Slides, worksheet, wall and stick-in uses draw from the one shared module shared/visuals/coordinate-grid-svg.js, including the across-then-up route used by the full-size model and its number-free Success Criteria treatment.' },
  { id: 'point-route', slides: false, worksheets: false, wall: false, stickin: false,
    geometrySource: 'shared/visuals/point-route-svg.js',
    successCriteriaHelpers: [
      { key: 'join-in-order', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { mode: 'join-in-order' } } },
      { key: 'close-the-shape', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { mode: 'close-the-shape' } } }
    ],
    note: 'Success-Criteria-inline only - these tiny route cues show the child\'s next mark. A full-size teaching diagram uses coordinate-grid or geoboard instead, so promoting this into a standalone slide helper would create a fake second visual language.' },
  { id: 'scale-interval', slides: false, worksheets: false, wall: false, stickin: false,
    geometrySource: 'shared/visuals/scale-interval-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'count-scale-intervals', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: {} } }
    ],
    note: 'Success-Criteria-inline only - one equal-interval cue serves dial scales and measuring containers without inventing a task-specific value.' },
  { id: 'pyramid',         slides: 'pyramid',         worksheets: 'number-pyramid',                          wall: false,             stickin: false,
    geometrySource: 'shared/visuals/pyramid-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'number-pyramid', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: {} } }
    ] },
  { id: 'method-frame',    slides: 'method-frame',    worksheets: 'method-frame', wall: false,            stickin: false },
  { id: 'bar-chart',       slides: 'bar-chart',       worksheets: 'bar-chart',                     wall: 'bar-chart',       stickin: false,
    geometrySource: 'shared/visuals/bar-chart-svg.js',
    successCriteriaHelpers: [
      { key: 'draw-bars', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'barsCueSvg', spec: {} } }
    ],
    note: 'wall via the shared bar-chart-svg, used as the annotated anatomy poster for "read a bar chart" lessons (labelledDiagram + callouts). stickin:false — a bar chart is read-and-answer, not a write-on cut-out.' },
  { id: 'line-graph',      slides: 'line-graph',      worksheets: 'line-graph',                    wall: 'line-graph',      stickin: false,
    note: 'wall via the shared line-graph-svg, used as the annotated anatomy poster for "read a line graph" lessons (labelledDiagram + callouts on title / yAxis / xAxis / line / point / each plotted x). worksheets via line-graph-question, the stimulus-top figure that replaced the data-table fallback a read-a-graph lesson used to be forced into. stickin:false - a line graph is read-and-answer, not a write-on cut-out; the child reads values off it rather than marking it, so like bar-chart/pictogram it has no stick-in piece.' },
  { id: 'chip-bank',       slides: 'chip-bank',       worksheets: 'chip-bank',                              wall: false,             stickin: false },
  { id: 'place-value-chart', slides: 'place-value-chart', worksheets: ['place-value-chart', 'place-value-counter-chart'], wall: 'place-value-chart', stickin: false,
    geometrySource: 'shared/visuals/place-value-chart-svg.js',
    successCriteriaHelpers: [
      { key: 'one-per-column', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'onePerColumnCueSvg', spec: {} } }
    ],
    note: 'Grew a per-cell `highlight` and a per-row `label`, and that is what earned it the wall. Before, a place value chart was a grid of digits and a wall card of one would anchor nothing. With a ring round the digit that changed and a caption saying what each row IS ("3,462", "10 more", "100 more"), the card answers the question every place-value unit turns on - WHICH column changed and which held still - from across the room, all term, across 10/100 more and less, exchanging, rounding, and multiplying and dividing by 10. wall draws from shared/visuals/place-value-chart-svg.js, which repeats the board palette so the two match; slides and worksheets keep their own implementations (a pptx table and a CSS grid), like coordinate-grid above. stickin:false - a place value chart is a ruled grid a Year 4 child can draw in a squared book in a minute, and ruling it is part of the work, so it fails the "cannot reproduce this by hand" test a stick-in piece has to pass; the write-on form they need on paper is already the worksheet chart with an empty row. The chart then grew a `pair` MODE (before/after: start chart, labelled arrow, result chart, "same" under each unchanged column, operation and result in a title bar), and it reaches the board AND the wall. It was first built slide-only, on the reasoning that the board has a problem the other surfaces do not (a teach slide of finished end states leaves the movement to the teacher\'s voice) while a wall card already carries the comparison in its stacked-row form. Daniel read that reasoning and overruled it: a child who meets the pair on the board and looks up at a stacked chart on the wall is being shown two dialects of one picture, and the wall\'s job is to be the thing they recognise. So the wall draws the pair too, from the same shared/visuals/place-value-chart-svg.js, with the semantics matched exactly - changed column DERIVED by comparing from/to and never declared, title read off the `to` cells unless overridden, "same" in each column\'s own colour - and drawn bolder, because a card is read across a room. Both forms stay live: the stacked rows still anchor a whole unit compactly, the pair teaches one change. Worksheets keep their own implementation and no pair, because a sheet asks the child to WRITE the result rather than read a finished one.' },
  { id: 'money',           slides: 'money',           worksheets: ['coin-strip', 'part-whole-money'], wall: false,  stickin: false },
  { id: 'shaded-fraction', slides: 'shaded-fraction', worksheets: 'fraction-bar',                  wall: false,             stickin: false,
    note: 'wall fraction visuals are the dedicated fractionCircle / fractionBar cards below, drawn from their own wall geometry.' },

  // ── Wall-only flavours. These are reference/anchor cards a wall shows; they have no
  //    board or sheet twin (a teaching slide draws the live version a different way).
  { id: 'angle-fan',         slides: false, worksheets: false, wall: 'angleFan',         stickin: false,
    note: 'wall-only — a fan of the angle types as a single anchor poster; the board teaches angles one at a time via the angle figure.' },
  { id: 'comparison-symbol', slides: false, worksheets: false, wall: 'comparisonSymbol', stickin: false,
    note: 'wall-only — a < > = reference card; comparison on the board/sheet is done with the compare-box, not a drawn symbol primitive.' },
  { id: 'fraction-circle',   slides: false, worksheets: false, wall: 'fractionCircle',   stickin: false,
    note: 'wall-only — a fraction-circle anchor card drawn from the wall\'s own geometry; the board shades fractions via shaded-fraction.' },
  { id: 'fraction-bar',      slides: false, worksheets: 'fraction-bar', wall: 'fractionBar', stickin: false,
    note: 'wall fraction-bar anchor + the worksheet fraction-bar question; the board equivalent is shaded-fraction (tracked separately above).' },

  // ── Slide-only figures, thinking-organisers and scaffolds. These are live teaching
  //    visuals built and used on the board only; a wall/sheet/stick-in version would
  //    not be the same artefact (a diamond-nine is a live ranking activity, an area
  //    grid a worked model the teacher builds), so each is honestly board-only.
  { id: 'map',             slides: 'map',             worksheets: false, wall: false, stickin: false,
    note: 'Pre-dates this manifest; recorded here when the coverage check first surfaced it, NOT exempted, because it is a picture a child reads and so belongs where its reach is a decision. Unlike every other entry it draws no geometry: it places one of a fixed set of stock continent/world PNGs from builder/assets/maps with a caption, so there is no shared module for another engine to import. The other engines already reach the same artefact by their generic image routes (a sheet via label-diagram with the map as its image, a wall via a photo panel), so a dedicated `map` key in each would be a second way to do the same thing. Revisit if a lesson needs the SAME stock map on board and paper and the two drift apart.' },
  { id: 'circuit-symbol-bank', slides: 'circuit-symbol-bank', worksheets: false, wall: false, stickin: false,
    geometrySource: 'shared/visuals/circuit-diagram-svg.js',
    note: 'The component-symbol key of a circuit lesson: individually identifiable standard symbols (cell, lamp, wire, open/closed switch) each carrying its own child-facing name, for the slide that teaches or consults the symbol map itself. Board-only like the callout above — it is a presentation-shaped board reference, not a figure a child reproduces, so it fails the write-on test a stick-in piece has to pass; a sheet teaches the same symbols by naming parts on its own labelled diagram, and the wall already carries the finished circuit via circuit-diagram. The geometry sits beside the circuit in shared/visuals/circuit-diagram-svg.js so the reference and the loop it keys cannot drift apart in a symbol the two render differently.' },
  { id: 'callout',         slides: 'callout',         worksheets: false, wall: false, stickin: false,
    note: 'A small coloured box holding one short line, with an arrow leaving any side to point at the thing the line is about. Board-only, and the reason is that every other surface already points at its own content a different way. wall:false - the wall annotates a diagram through the `callouts` array on a card visual, composited through the shared label-diagram overlay (the labelledDiagram card); a standalone callout primitive there would be a second way to do the one job, the same reasoning recorded for `map` above. worksheets:false - a sheet points at part of a picture with `label-diagram`, whose leader lines are drawn INTO the figure; the sheet has no free-placed zone beside a figure for a box to point from. stickin:false - a callout is something the teacher points with, never something the child marks, so it fails the write-on test a stick-in piece has to pass. Revisit the worksheet if worksheet zones ever let a figure and a note sit side by side.' },
  { id: 'area-grid',       slides: 'area-grid',       worksheets: false, wall: false, stickin: false,
    geometrySource: 'shared/visuals/area-grid-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'count-array', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: {} } }
    ] },
  { id: 'concept-map',     slides: 'concept-map',     worksheets: false, wall: false, stickin: false },
  { id: 'source-pathway',  slides: 'source-pathway',  worksheets: false, wall: false, stickin: false,
    note: 'board-only fan-in figure: several distinct source nodes visibly joining one named intermediate state and continuing to one outcome. The board is where the convergence is revealed and traced; the same relationship on paper is the child\'s own labelled diagram, not this presentation-shaped board visual.' },
  { id: 'continuum-line',  slides: 'continuum-line',  worksheets: false, wall: false, stickin: false },
  { id: 'diamond-nine',    slides: 'diamond-nine',    worksheets: false, wall: false, stickin: false },
  { id: 'fishbone',        slides: 'fishbone',        worksheets: false, wall: false, stickin: false },
  { id: 'number-network',  slides: 'number-network',  worksheets: false, wall: false, stickin: false },
  { id: 'concept-matching', slides: 'matching',       worksheets: false, wall: false, stickin: false,
    note: 'slide-only sorting/matching activity (draws connector affordances), done live on the board.' },
  { id: 'mult-grid',       slides: 'mult-grid',       worksheets: false, wall: false, stickin: false,
    note: 'worksheets:false — the sheet has its own column/grid arithmetic family (short/long-multiplication-grid); the slide mult-grid is the board model, not the same key.' },
  { id: 'fraction-wall',   slides: 'fraction-wall',   worksheets: false, wall: false, stickin: false },
  { id: 'dial-scale',      slides: 'dial-scale',      worksheets: false, wall: false, stickin: false },
  { id: 'measuring-jug',   slides: 'measuring-jug',   worksheets: false, wall: false, stickin: false },
  { id: 'translation-grid', slides: 'translation-grid', worksheets: false, wall: false, stickin: false },
  { id: 'part-whole-model', slides: 'part-whole-model', worksheets: false, wall: false, stickin: false,
    geometrySource: 'shared/visuals/part-whole-model-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'part-whole', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: {} } }
    ],
    note: 'the money-specific part-whole is tracked under `money` (part-whole-money-question); this is the generic board model.' },

  // ── Stick-in write-on shapes with no board or wall twin: a blank box-row the
  //    child draws into, glued into the book.
  { id: 'draw-box-row',    slides: false, worksheets: false, wall: false, stickin: 'draw-box-row',
    note: 'stick-in write-on only - a strip of blank boxes the child draws in; never a board or wall figure.' },
];

// Every visual primitive is explicitly audited for Success Criteria use. This
// prevents future audits from narrowing to a hand-picked notation list: a new
// visual must say whether it has catalogue-backed compact treatments, should
// stay full-size, or is unsuitable as a step cue.
const SUCCESS_CRITERIA_AUDIT = Object.freeze({
  venn: { classification: 'SC-inline', reason: 'Only the destination region survives inline.' },
  carroll: { classification: 'SC-inline', reason: 'Only one-box placement survives inline.' },
  angle: { classification: 'both', reason: 'The arc remains a stable visible mark.' },
  triangle: { classification: 'both', reason: 'Equal-side dashes remain clear.' },
  'reflection-grid': { classification: 'both', reason: 'Bold paired shapes and a mirror line preserve the action without a tiny grid.' },
  'translation-shape': { classification: 'both', reason: 'A simplified same-shape movement cue remains truthful.' },
  'label-diagram': { classification: 'SC-inline', reason: 'The leader-line action survives without the task image.' },
  'line-pair': { classification: 'both', reason: 'Parallel arrows and the square corner remain clear.' },
  geoboard: { classification: 'both', reason: 'A bold outline and dashed symmetry line preserve the action without tiny pegs.' },
  'bar-model': { classification: 'both', reason: 'Part-whole and comparison structures remain legible.' },
  'tally-chart': { classification: 'SC-inline', reason: 'The five-mark bundle is useful; the chart frame is not.' },
  pictogram: { classification: 'full-size', reason: 'Its key and symbol value are task-specific.' },
  'blank-surface': { classification: 'unsuitable', reason: 'A tiny empty box is decoration, not guidance.' },
  'grid-map': { classification: 'full-size', reason: 'Eastings, northings and features need task detail.' },
  'rainforest-layers': { classification: 'full-size', reason: 'The layered reference picture needs its labels and gradient.' },
  'circuit-diagram': { classification: 'full-size', reason: 'Which components, and whether the switch is open, IS the question; a generic loop cues nothing.' },
  polygon: { classification: 'full-size', reason: 'The relevant property depends on the actual shape.' },
  'triangle-square': { classification: 'full-size', reason: 'The combined figure carries task-specific relationships.' },
  'turn-diagram': { classification: 'SC-inline', reason: 'Direction survives; object and angle remain in the question.' },
  clock: { classification: 'full-size', reason: 'The exact time and hand positions carry the task.' },
  numberline: { classification: 'SC-inline', reason: 'Direction survives; values and jump size remain in the question.' },
  'coordinate-grid': { classification: 'both', reason: 'The across-then-up movement remains clear.' },
  'point-route': { classification: 'SC-inline', reason: 'Join and close are genuine tiny actions, not standalone figures.' },
  'scale-interval': { classification: 'SC-inline', reason: 'Equal intervals are stable across scale types.' },
  pyramid: { classification: 'SC-inline', reason: 'Combining neighbouring boxes is a stable action cue.' },
  'method-frame': { classification: 'full-size', reason: 'Its columns and written working need readable labels.' },
  'bar-chart': { classification: 'SC-inline', reason: 'Equal-width bars survive; scales and categories do not.' },
  'line-graph': { classification: 'full-size', reason: 'Scale and plotted values are essential; plotting and joining already have cues.' },
  'chip-bank': { classification: 'full-size', reason: 'Chip values and groupings are task-specific.' },
  'place-value-chart': { classification: 'SC-inline', reason: 'One entry per column survives without fixed headings.' },
  money: { classification: 'full-size', reason: 'Coin and note values must match the question.' },
  'shaded-fraction': { classification: 'full-size', reason: 'Partition count and shaded amount must match the fraction.' },
  'angle-fan': { classification: 'full-size', reason: 'The comparison set needs several labelled angles.' },
  'comparison-symbol': { classification: 'full-size', reason: 'The symbol direction must match the actual comparison.' },
  'fraction-circle': { classification: 'full-size', reason: 'The number of sectors and shading are value-specific.' },
  'fraction-bar': { classification: 'full-size', reason: 'The number of parts and shading are value-specific.' },
  'circuit-symbol-bank': { classification: 'full-size', reason: 'The names are task-specific and the symbol identities must stay individually readable; a tiny bank cues nothing.' },
  map: { classification: 'full-size', reason: 'Geographical detail and labels carry the meaning.' },
  callout: { classification: 'unsuitable', reason: 'It is a presentation container, not a child-made mark.' },
  'area-grid': { classification: 'SC-inline', reason: 'Rows and columns remain a stable array action.' },
  'concept-map': { classification: 'full-size', reason: 'Nodes and relationships are content-specific.' },
  'source-pathway': { classification: 'full-size', reason: 'The sources, joining state and outcome are the content-specific task.' },
  'continuum-line': { classification: 'full-size', reason: 'Endpoints and item positions define the judgement.' },
  'diamond-nine': { classification: 'full-size', reason: 'The ranked statements are the activity.' },
  fishbone: { classification: 'full-size', reason: 'Cause branches and labels are content-specific.' },
  'number-network': { classification: 'full-size', reason: 'Values and links are the mathematical task.' },
  'concept-matching': { classification: 'full-size', reason: 'The matched items are content-specific.' },
  'mult-grid': { classification: 'full-size', reason: 'Factors and products must remain readable.' },
  'fraction-wall': { classification: 'full-size', reason: 'Multiple labelled fraction rows require full size.' },
  'dial-scale': { classification: 'full-size', reason: 'The dial value stays full-size; use the interval cue for the generic action.' },
  'measuring-jug': { classification: 'full-size', reason: 'The vessel and exact scale must match the question.' },
  'translation-grid': { classification: 'full-size', reason: 'The legacy point movement stays full-size; the shape cue uses translation-shape.' },
  'part-whole-model': { classification: 'SC-inline', reason: 'The whole-to-parts structure survives without values.' },
  'draw-box-row': { classification: 'unsuitable', reason: 'A tiny blank write-on strip gives no actionable cue.' }
});

// Slide content primitives that are pure text/layout containers, not visual figures,
// so the slide-coverage check skips them. Keep this list to genuine containers: a new
// FIGURE belongs in PRIMITIVES above (where its cross-engine reach is decided), not here.
const SLIDE_LAYOUT_EXEMPT = [
  'text',
  'bullets',
  'steps',
  'vocab',
  'image',
  'table',
  'numbered-questions',
  'question-cards', // the card-laid-out twin of numbered-questions: a container for
                    // question TEXT, not a drawn figure. Same reach decision as its
                    // sibling — the board is where a question set is presented; a
                    // sheet numbers its own questions, and a wall carries no
                    // question frames.
  'sc-panel',
  'row',
  'stack',
  'sort-board',       // category panels + text labels: a layout treatment for the
                      // completed sort answer, not a drawn figure. Same reach as
                      // row/stack — the board is where a completed sort is revealed.
  'evidence-cards',   // photograph cards + attached answer text: a layout treatment
                      // for photographs, not a custom figure. The pictures inside
                      // are ordinary `image` primitives, and the card grid is
                      // question-cards-style framing.
];

module.exports = { PRIMITIVES, SUCCESS_CRITERIA_AUDIT, SLIDE_LAYOUT_EXEMPT };
