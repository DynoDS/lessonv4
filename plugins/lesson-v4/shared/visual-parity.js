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
// Each entry also declares `depicts` - where the drawing's correctness comes
// from - and there are exactly two answers. `'data'` means the picture is right
// when it matches the lesson's own numbers, labels or an agreed convention: a
// bar chart, a Venn, a number line, a circuit symbol. `asset:<folder under
// builder/assets>` means the FORM comes out of a real file this package ships.
//
// The distinction matters because a helper that depicts a REAL thing - a
// coastline, a border, a real object - cannot be right by construction the way a
// bar chart can. A continent drawn from coordinates picked by eye renders
// cleanly, passes every check here, and teaches a child a world that does not
// exist. So a figure of a real thing is built on the real thing: the shipped
// asset, with anything the lesson adds drawn ON TOP as an annotation.
//
// There is deliberately no third answer. `projection:<name>` was one until a
// schematic world map declared the real projection `equirectangular-lonlat`
// over continent outlines somebody had typed to look about right, and drew the
// opening slides of a lesson about where the Amazon is. A projection is how
// coordinates are transformed, never where they came from, so it can never
// stand as evidence. The guard cannot judge accuracy; it holds the author to
// naming a source that exists on disk.
//
// What the guard does with this:
//   - FORWARD  — every key here must be live in that renderer. A `false` is honoured;
//     a forgotten WIRE (declared but absent) fails loudly, before a lesson does.
//   - COVERAGE — every live wall/stick-in key, and every non-layout slide key, must
//     appear here, so a new figure can't exist in a renderer without a scoping decision.
//
// Until 13 September 2026 it deliberately did not nag that a figure reached three
// engines and not a fourth, treating an honest `false` as a pedagogical scoping
// call. Daniel overruled that: every picture is drawn once and drawable on every
// surface, and whether a lesson uses it there is the designers' call at the time.
// A `false` below is now a gap on SHARING_BACKLOG, not a decision, and the notes
// that argued for one are history rather than guidance.

const PRIMITIVES = [
  { id: 'comparison-slot', depicts: 'data', slides: 'comparison-slot', worksheets: 'comparison-target', wall: false, stickin: false,
    note: 'Board-only symbol-entry ring between compared objects, sized to their shared row. Printed questions provide their own answer space; this is not a standalone wall reference or stick-in figure.' },
  // ── Shared-geometry figures (one drawing in shared/visuals/, consumed by every
  //    renderer it reaches). These are the parity-critical set: identical shape on
  //    board, paper, wall and stick-in piece, so a skip shows as words where a picture should be.
  { id: 'venn', depicts: 'data',            slides: 'venn',            worksheets: 'venn',                          wall: 'venn',            stickin: 'venn',
    geometrySource: 'shared/visuals/venn-svg.js',
    successCriteriaHelpers: [
      { key: 'venn-overlap', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'regionCueSvg', spec: { region: 'overlap' } } },
      { key: 'venn-outside', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'regionCueSvg', spec: { region: 'outside' } } }
    ] },
  { id: 'carroll', depicts: 'data',         slides: 'carroll',         worksheets: 'carroll',                       wall: 'carroll',         stickin: 'carroll',
    geometrySource: 'shared/visuals/carroll-svg.js',
    successCriteriaHelpers: [
      { key: 'carroll-one-box', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'oneCellCueSvg', spec: {} } }
    ] },
  { id: 'angle', depicts: 'data',           slides: 'angle',           worksheets: 'angle',          wall: 'angle',           stickin: ['angle', 'angle-row'],
    geometrySource: 'shared/visuals/angle-svg.js',
    successCriteriaHelpers: [
      { key: 'angle-arc', mode: 'both', fullSize: { type: 'angle', degrees: 60 }, inline: { treatment: 'simplified', spec: { degrees: 60, successCriteriaInline: true } } }
    ] },
  { id: 'triangle', depicts: 'data',        slides: ['triangle', 'triangle-nonexample'], worksheets: 'triangle', wall: 'triangle', stickin: ['triangle', 'triangle-row'],
    geometrySource: 'shared/visuals/triangle-svg.js',
    successCriteriaHelpers: [
      { key: 'dash-equal-sides', mode: 'both', fullSize: { type: 'triangle', kind: 'isosceles' }, inline: { treatment: 'simplified', spec: { kind: 'isosceles', successCriteriaInline: true } } }
    ] },
  { id: 'reflection-grid', depicts: 'data', slides: 'reflection-grid', worksheets: 'reflection-grid', wall: 'reflection-grid', stickin: 'reflection-grid',
    geometrySource: 'shared/visuals/reflection-grid-svg.js',
    successCriteriaHelpers: [
      { key: 'reflect-across-line', mode: 'both', fullSize: { type: 'reflection-grid', cols: 4, rows: 3, mirror: { orientation: 'vertical', at: 2 }, shape: [[0, 0], [1, 0], [1, 1]], showReflection: true }, inline: { treatment: 'simplified', method: 'reflectionCueSvg', spec: {} } }
    ] },
  { id: 'translation-shape', depicts: 'data', slides: 'translation-shape', worksheets: 'translation-shape', wall: 'translation-shape', stickin: 'translation-shape',
    geometrySource: 'shared/visuals/translation-shape-svg.js',
    successCriteriaHelpers: [
      { key: 'translate-shape', mode: 'both', fullSize: { type: 'translation-shape', cols: 5, rows: 4, points: [[1, 1], [2, 1], [2, 2]], translate: { dx: 2, dy: 1 }, showImage: true }, inline: { treatment: 'simplified', method: 'translationCueSvg', spec: {} } }
    ],
    note: 'The signature picture of a translation lesson: a whole shape AND its translated image on ONE numbered coordinate grid, with a dashed slide-arrow - two full polygons the older translation-grid (single start/end markers) and coordinate-grid (one shape) could not draw. All four code engines draw from the one shared module shared/visuals/translation-shape-svg.js. Two modes by showImage: the write-on TASK form (original only, the child plots+joins the image) reaches the stick-in; the image-shown ANSWER form (original + image + arrow) is the worked-example/wall-reference form. Serves all four because it is both a write-on figure the child marks AND a reference/answer figure.' },
  { id: 'label-diagram', depicts: 'data',   slides: 'label-diagram',   worksheets: 'label-diagram',                          wall: 'label-diagram',   stickin: 'label-diagram',
    geometrySource: 'shared/visuals/label-diagram-svg.js',
    successCriteriaHelpers: [
      { key: 'label-with-leader', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'leaderCueSvg', spec: {} } }
    ],
    note: 'A photograph with its parts labelled by leader lines. All four surfaces draw it from label-diagram-svg.js: the board and the wall place the whole picture through its tightSvg (with the board\'s poster rules for layout sides), the sheet and the stick-in pack through buildLabelDiagramSvg with their own label bands. The wall reached it on 13 September 2026; before that it could only overlay callouts on a primitive it had drawn itself, so a labelled photograph never reached a wall card.' },
  { id: 'line-pair', depicts: 'data',       slides: 'line-pair',       worksheets: 'line-pair',  wall: 'line-pair',       stickin: 'line-pair',
    geometrySource: 'shared/visuals/line-pair-svg.js',
    successCriteriaHelpers: [
      { key: 'arrow-parallels', mode: 'both', fullSize: { type: 'line-pair', relationship: 'parallel', form: 'horizontal', notation: 'arrows' }, inline: { treatment: 'reuse', spec: { relationship: 'parallel', form: 'horizontal', notation: 'arrows' } } },
      { key: 'square-corner', mode: 'both', fullSize: { type: 'line-pair', relationship: 'perpendicular', form: 'L', notation: 'right-angle' }, inline: { treatment: 'reuse', spec: { relationship: 'perpendicular', form: 'L', notation: 'right-angle' } } }
    ],
    note: 'All four surfaces draw from line-pair-svg.js; the stick-in pack joined on 13 September 2026.' },
  { id: 'geoboard', depicts: 'data',        slides: 'geoboard',        worksheets: 'geoboard',    wall: 'geoboard',        stickin: ['geoboard', 'geoboard-row'],
    geometrySource: 'shared/visuals/geoboard-svg.js',
    successCriteriaHelpers: [
      { key: 'line-of-symmetry', mode: 'both', fullSize: { type: 'geoboard', cols: 3, rows: 3, shapes: [{ points: [[0, 0], [3, 0], [3, 3], [0, 3]], closed: true }], symmetryLines: [[[1.5, 0], [1.5, 3]]] }, inline: { treatment: 'simplified', method: 'symmetryCueSvg', spec: {} } }
    ],
    note: 'stickin — wired 5 Sep 2026, the revisit this note asked for. A Year 2 shapes lesson needed four shapes on dotty paper glued in with room to write beside each; the sheet drew them and the pack could not, so the cut-and-stick copy was lost. Two forms: `geoboard` is one board, blank (draw your own shape) or carrying a shape to count; `geoboard-row` is a strip of boards each with its own write-on line. The row form declares its own taller box because pegs are COUNTED one at a time, and the shared 26mm box puts them close enough that a finger covers three.' },
  { id: 'bar-model', depicts: 'data',       slides: 'bar-model',       worksheets: 'bar-model',      wall: 'bar-model',       stickin: 'bar-model',
    geometrySource: 'shared/visuals/bar-model-svg.js',
    successCriteriaHelpers: [
      { key: 'bar-model-parts', mode: 'both', fullSize: { type: 'bar-model', shape: 'part-whole', whole: { label: 'Whole' }, parts: [{ label: 'Part' }, { label: 'Part' }] }, inline: { treatment: 'simplified', spec: { shape: 'part-whole', whole: { label: '' }, parts: [{ label: '', value: 1 }, { label: '', value: 1 }, { label: '', value: 1 }] } } },
      { key: 'bar-model-compare', mode: 'both', fullSize: { type: 'bar-model', shape: 'comparison', bars: [{ name: 'A', label: 'A', value: 3 }, { name: 'B', label: 'B', value: 2 }], difference: { label: '?', value: 1 } }, inline: { treatment: 'simplified', method: 'comparisonCueSvg', spec: {} } }
    ],
    note: 'All four surfaces draw from bar-model-svg.js; the stick-in pack joined on 13 September 2026, so a bar model with a part to fill can be glued in as well as drawn fresh on a blank-surface.' },
  { id: 'tally-chart', depicts: 'data',     slides: 'tally-chart',     worksheets: 'tally-chart',  wall: 'tally-chart',     stickin: 'tally-chart',
    geometrySource: 'shared/visuals/tally-chart-svg.js',
    successCriteriaHelpers: [
      { key: 'tally-five', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'tallyMarksSvg', spec: { count: 5 } } }
    ],
    note: 'All four surfaces draw from tally-chart-svg.js; the stick-in pack joined on 13 September 2026 (blank: true is the tally a child completes).' },
  { id: 'pictogram', depicts: 'data',       slides: 'pictogram',       worksheets: 'pictogram',                     wall: 'pictogram',       stickin: 'pictogram',
    geometrySource: 'shared/visuals/pictogram-svg.js',
    note: 'All four surfaces draw from pictogram-svg.js; the stick-in pack joined on 13 September 2026.' },
  { id: 'blank-surface', depicts: 'data',   slides: 'blank-surface',   worksheets: 'blank-surface', wall: 'blank-surface', stickin: 'blank-surface',
    geometrySource: 'shared/visuals/blank-surface-svg.js',
    note: 'All four surfaces draw from blank-surface-svg.js; the wall and the stick-in pack joined on 13 September 2026.' },
  { id: 'grid-map', depicts: 'data',        slides: 'grid-map',        worksheets: 'grid-map',                      wall: 'grid-map',        stickin: 'grid-map',
    geometrySource: 'shared/visuals/grid-map-svg.js' },
  { id: 'rainforest-layers', depicts: 'data', slides: 'rainforest-layers', worksheets: 'rainforest-layers', wall: 'rainforest-layers', stickin: 'rainforest-layers',
    geometrySource: 'shared/visuals/rainforest-layers-svg.js',
    note: 'The central teaching visual of a rainforest layers lesson: four stacked bands (emergent / canopy / understorey / forest floor) whose TINT carries the light gradient, brightest at the top to near dark at the floor. All four, and none of them is optional here. The gradient is the idea the lesson rests on, so the child has to meet the same picture everywhere: taught on the board across several slides (highlight dims two layers so half the diagram can be discussed at a time), read from on the sheet, anchored on the wall all unit, and labelled by the child in their own book. The board/sheet/wall forms are the LABELLED read-and-answer figure; the stick-in is the WRITE-ON form (`blank`), the same bands and trees with a ruled line beside each for the child to name the layers, which is why it reaches the stick-in pack and so the book. UK spelling "understorey" is baked into the shared module, so no engine can ship the American spelling.' },
  { id: 'geographical-description-frame', depicts: 'data', slides: 'geographical-description-frame', worksheets: false, wall: false, stickin: 'geographical-description-frame',
    geometrySource: 'shared/visuals/geographical-description-frame-svg.js',
    note: 'Board + stick-in write-on scaffold. The board models how to complete the exact Biome / Location / Features from evidence structure and the book piece gives the child the identical blank frame. worksheets:false because the commissioned paper route is the small cut-and-glue recording frame, not a second worksheet question. wall:false because an empty task frame is not a finished unit reference.' },
  { id: 'recording-table', depicts: 'data', slides: false, worksheets: false, wall: false, stickin: 'table',
    geometrySource: 'shared/visuals/recording-table-svg.js',
    note: 'Stick-in only: the write-on form of a table task the class completes in books, copied field for field from the slide table so the glued grid matches the board (any ||-marked answer cell is blanked). slides:false because the board draws tables natively through the layout-exempt `table` content object; worksheets:false because a sheet prints its own table zones; wall:false because a blank recording grid is not a finished unit reference.' },
  { id: 'source-copy', depicts: 'data', slides: 'image', worksheets: false, wall: false, stickin: 'source-copy',
    note: 'The READ-FROM piece: a printed copy of one source the child reads fine detail off (a document, a timetable, a photograph, a map) whose detail cannot be seen from the back of the room, glued in with a caption naming it and no write-on line. It draws nothing itself - the picture is the lesson\'s own published file, so its truth is owned by the picture contract and provenance, exactly as label-diagram\'s photograph is - which is why depicts stays `data`. slides:`image` because the board shows the same file through the ordinary image object and the piece copies its imagePath and caption from that slide; worksheets:false because a sheet embeds a source through its own stimulus picture, not a helper key; wall:false because a class copy of evidence is not a finished unit reference.' },
  { id: 'balanced-pattern-plate', depicts: 'data', slides: 'balanced-pattern-plate', worksheets: 'balanced-pattern-plate', wall: 'balanced-pattern-plate', stickin: 'balanced-pattern-plate',
    geometrySource: 'shared/visuals/balanced-pattern-plate-svg.js',
    note: 'Board, worksheet and wall share one proportional plate. The teaching form is a broad reference whose fixed sector shares, measured labels, water cue, less-often cue and across-a-day/over-time caption make it a durable wall overview as well as a slide visual; the practice form leaves pupil-decision spaces while preserving those proportions. The stick-in pack joined on 13 September 2026, at a width that keeps the smallest wedge labels readable.' },
  { id: 'circuit-diagram', depicts: 'data', slides: 'circuit-diagram', worksheets: 'circuit-diagram', wall: 'circuit-diagram', stickin: 'circuit-diagram',
    geometrySource: 'shared/visuals/circuit-diagram-svg.js',
    note: 'One series circuit in the standard primary symbols. Wave 5 made the shared module strict and pointed the worksheet and the wall at it, so the board, the sheet and the display now draw the identical circuit rather than three hand-made ones that could disagree about an open switch. The drawing refuses to invent, round, clamp, drop or truncate any part of the science it is given: a lesson asking "will this lamp light?" turns entirely on the cells, the components, the switch and the path being exactly as stated. The stick-in pack joined on 13 September 2026, sized by height so one circuit and a row of three keep the same symbol size.' },
  { id: 'parachute-forces', depicts: 'data', slides: 'parachute-forces', worksheets: 'parachute-forces', wall: 'parachute-forces', stickin: 'parachute-forces',
    geometrySource: 'shared/visuals/parachute-forces-svg.js',
    note: 'A parametric teaching schematic comparing two model parachutes after a practical: exact 3:1 billowed-sheet widths, equal calculated cord lengths, identical loads and qualitative force arrows. All four surfaces draw it from parachute-forces-svg.js; the sheet and the stick-in pack joined on 13 September 2026.' },
  { id: 'polygon', depicts: 'data',         slides: 'polygon',         worksheets: 'shape',                          wall: false,             stickin: false,
    note: 'worksheets via shape (the shapes renderer). wall:false — individual polygons appear inside reference cards, not as a standalone wall primitive.' },

  // ── Other cross-engine figures (separate implementations per engine, not a single
  //    shared/visuals module, but the same concept the child should meet in each place).
  { id: 'triangle-square', depicts: 'data', slides: 'triangle-square', worksheets: 'triangle-square',               wall: 'triangle-square', stickin: false },
  { id: 'turn-diagram', depicts: 'data',    slides: 'turn-diagram',    worksheets: 'turn-diagram', wall: 'turn-diagram', stickin: false,
    successCriteriaSource: 'shared/visuals/turn-diagram-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'turn-clockwise', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { direction: 'clockwise' } } },
      { key: 'turn-anticlockwise', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { direction: 'anticlockwise' } } }
    ] },
  { id: 'clock', depicts: 'data',           slides: 'clock',           worksheets: 'clock-row',     wall: 'clock',           stickin: false },
  // One number line for every surface (13 September 2026); the tiny cue beside a
  // success-criteria step keeps its own drawing.
  { id: 'numberline', depicts: 'data',      slides: 'numberline',      worksheets: 'number-line',                   wall: 'numberLine',      stickin: 'number-line',
    geometrySource: 'shared/visuals/number-line-svg.js',
    successCriteriaSource: 'shared/visuals/numberline-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'jump-right', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { direction: 'right' } } },
      { key: 'jump-left', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { direction: 'left' } } }
    ] },
  { id: 'coordinate-grid', depicts: 'data', slides: 'coordinate-grid', worksheets: 'coordinate-grid',                   wall: 'coordinate-grid', stickin: 'coordinate-grid',
    geometrySource: 'shared/visuals/coordinate-grid-svg.js',
    successCriteriaHelpers: [
      { key: 'plot-grid', mode: 'both', fullSize: { type: 'coordinate-grid', max: 3, route: [2, 2] }, inline: { treatment: 'simplified', spec: { cols: 3, rows: 3, numbers: false, route: [2, 2] } } }
    ],
    note: 'The grid has two distinct uses, split by whether it is BLANK or PLOTTED. A BLANK numbered grid is a live practice/write-on surface: the child plots on it (stickin - a grid they cannot rule accurately by hand in a squared book). A PLOTTED/JOINED grid (points marked, optionally join:true into a shape) is a WORKED EXAMPLE - a plotted point or a joined shape on a numbered grid - which is exactly what a wall reference card shows, so wall added: the wall draws the plotted form (before this, coordinate lessons fell back to a geoboard, losing the axis numbers the whole unit turns on). Slides, worksheet, wall and stick-in uses draw from the one shared module shared/visuals/coordinate-grid-svg.js, including the across-then-up route used by the full-size model and its number-free Success Criteria treatment.' },
  { id: 'point-route', depicts: 'data', slides: false, worksheets: false, wall: false, stickin: false,
    successCriteriaSource: 'shared/visuals/point-route-svg.js',
    successCriteriaHelpers: [
      { key: 'join-in-order', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { mode: 'join-in-order' } } },
      { key: 'close-the-shape', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: { mode: 'close-the-shape' } } }
    ],
    note: 'Success-Criteria-inline only - these tiny route cues show the child\'s next mark. A full-size teaching diagram uses coordinate-grid or geoboard instead, so promoting this into a standalone slide helper would create a fake second visual language.' },
  { id: 'scale-interval', depicts: 'data', slides: false, worksheets: false, wall: false, stickin: false,
    successCriteriaSource: 'shared/visuals/scale-interval-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'count-scale-intervals', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: {} } }
    ],
    note: 'Success-Criteria-inline only - one equal-interval cue serves dial scales and measuring containers without inventing a task-specific value.' },
  { id: 'pyramid', depicts: 'data',         slides: 'pyramid',         worksheets: 'number-pyramid',                          wall: false,             stickin: false,
    successCriteriaSource: 'shared/visuals/pyramid-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'number-pyramid', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: {} } }
    ] },
  { id: 'method-frame', depicts: 'data',    slides: 'method-frame',    worksheets: 'method-frame', wall: false,            stickin: false },
  { id: 'bar-chart', depicts: 'data',       slides: 'bar-chart',       worksheets: 'bar-chart',                     wall: 'bar-chart',       stickin: 'bar-chart',
    geometrySource: 'shared/visuals/bar-chart-svg.js',
    successCriteriaHelpers: [
      { key: 'draw-bars', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'barsCueSvg', spec: {} } }
    ],
    note: 'wall via the shared bar-chart-svg, used as the annotated anatomy poster for "read a bar chart" lessons (labelledDiagram + callouts). The board drew its own chart in PowerPoint shapes (11pt scale numbers, no title) until 13 September 2026; the board and the stick-in pack now place the shared drawing laid out at its printed size, the sheet and the wall its design-unit form.' },
  { id: 'line-graph', depicts: 'data',      slides: 'line-graph',      worksheets: 'line-graph',                    wall: 'line-graph',      stickin: 'line-graph',
    geometrySource: 'shared/visuals/line-graph-svg.js',
    note: 'wall via the shared line-graph-svg, used as the annotated anatomy poster for "read a line graph" lessons (labelledDiagram + callouts on title / yAxis / xAxis / line / point / each plotted x). worksheets via line-graph-question, the stimulus-top figure that replaced the data-table fallback a read-a-graph lesson used to be forced into. The board drew its own graph in PowerPoint shapes until 13 September 2026; the board and the stick-in pack now place the shared drawing laid out at its printed size.' },
  { id: 'chip-bank', depicts: 'data',       slides: 'chip-bank',       worksheets: 'chip-bank',                              wall: false,             stickin: false },
  { id: 'place-value-chart', depicts: 'data', slides: 'place-value-chart', worksheets: ['place-value-chart', 'place-value-counter-chart'], wall: 'place-value-chart', stickin: false,
    geometrySource: 'shared/visuals/place-value-chart-svg.js',
    successCriteriaHelpers: [
      { key: 'one-per-column', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', method: 'onePerColumnCueSvg', spec: {} } }
    ],
    note: 'Grew a per-cell `highlight` and a per-row `label`, and that is what earned it the wall. Before, a place value chart was a grid of digits and a wall card of one would anchor nothing. With a ring round the digit that changed and a caption saying what each row IS ("3,462", "10 more", "100 more"), the card answers the question every place-value unit turns on - WHICH column changed and which held still - from across the room, all term, across 10/100 more and less, exchanging, rounding, and multiplying and dividing by 10. wall draws from shared/visuals/place-value-chart-svg.js, which repeats the board palette so the two match; slides and worksheets keep their own implementations (a pptx table and a CSS grid), like coordinate-grid above. stickin:false - a place value chart is a ruled grid a Year 4 child can draw in a squared book in a minute, and ruling it is part of the work, so it fails the "cannot reproduce this by hand" test a stick-in piece has to pass; the write-on form they need on paper is already the worksheet chart with an empty row. The chart then grew a `pair` MODE (before/after: start chart, labelled arrow, result chart, "same" under each unchanged column, operation and result in a title bar), and it reaches the board AND the wall. It was first built slide-only, on the reasoning that the board has a problem the other surfaces do not (a teach slide of finished end states leaves the movement to the teacher\'s voice) while a wall card already carries the comparison in its stacked-row form. Daniel read that reasoning and overruled it: a child who meets the pair on the board and looks up at a stacked chart on the wall is being shown two dialects of one picture, and the wall\'s job is to be the thing they recognise. So the wall draws the pair too, from the same shared/visuals/place-value-chart-svg.js, with the semantics matched exactly - changed column DERIVED by comparing from/to and never declared, title read off the `to` cells unless overridden, "same" in each column\'s own colour - and drawn bolder, because a card is read across a room. Both forms stay live: the stacked rows still anchor a whole unit compactly, the pair teaches one change. Worksheets keep their own implementation and no pair, because a sheet asks the child to WRITE the result rather than read a finished one. The counter band reached the wall last (4.2.93), and it took a lesson shipping without it to notice: the board grew counters, the shared wall drawing never did, and a Year 4 card headed "Count each column\'s counters" over a worked example of 6,041 printed an entirely empty grid. Both surfaces now draw the same populations in the same arrangement - ten as two rows of five, each counter in the colour of its own column - because a child glancing from the board to the wall has to count the same shapes in the same places.' },
  { id: 'place-value-mini', depicts: 'data', slides: 'place-value-mini', worksheets: false, wall: false, stickin: false,
    note: 'The miniature built for the 2.2-inch panel of a key-vocabulary card: one digit mapping to its value, a highlighted Th/H/T/O column, ten tens becoming a hundred, or the zeros in a numeral. Slide-only because the surface it exists for is slide-only - a worksheet, a wall card and a stick-in piece all carry the FULL place-value-chart above, which reaches those three surfaces on its own entry, and a 2.2-inch version of it there would be the same picture drawn smaller for no reason. It was drawing correctly through content/vocab.js and was missing from the content registry, so the layout preflight refused any deck that used it as templates.md documents and the designer shipped a text-only card instead (5 September 2026); registering it is what brought it here.' },
  { id: 'money', depicts: 'asset:money',           slides: 'money',           worksheets: ['coin-strip', 'part-whole-money'], wall: false,  stickin: false },
  { id: 'shaded-fraction', depicts: 'data', slides: 'shaded-fraction', worksheets: 'fraction-bar',                  wall: false,             stickin: false,
    note: 'wall fraction visuals are the dedicated fractionCircle / fractionBar cards below, drawn from their own wall geometry.' },

  // ── Wall-only flavours. These are reference/anchor cards a wall shows; they have no
  //    board or sheet twin (a teaching slide draws the live version a different way).
  { id: 'angle-fan', depicts: 'data',         slides: false, worksheets: false, wall: 'angleFan',         stickin: false,
    note: 'wall-only — a fan of the angle types as a single anchor poster; the board teaches angles one at a time via the angle figure.' },
  { id: 'comparison-symbol', depicts: 'data', slides: false, worksheets: false, wall: 'comparisonSymbol', stickin: false,
    note: 'wall-only — a < > = reference card; comparison on the board/sheet is done with the compare-box, not a drawn symbol primitive.' },
  { id: 'fraction-circle', depicts: 'data',   slides: false, worksheets: false, wall: 'fractionCircle',   stickin: false,
    note: 'wall-only — a fraction-circle anchor card drawn from the wall\'s own geometry; the board shades fractions via shaded-fraction.' },
  { id: 'fraction-bar', depicts: 'data',      slides: false, worksheets: 'fraction-bar', wall: 'fractionBar', stickin: false,
    note: 'wall fraction-bar anchor + the worksheet fraction-bar question; the board equivalent is shaded-fraction (tracked separately above).' },

  // ── Slide-only figures, thinking-organisers and scaffolds. These are live teaching
  //    visuals built and used on the board only; a wall/sheet/stick-in version would
  //    not be the same artefact (a diamond-nine is a live ranking activity, an area
  //    grid a worked model the teacher builds), so each is honestly board-only.
  { id: 'map', depicts: 'asset:maps',             slides: 'map',             worksheets: 'map',  wall: false, stickin: 'map',
    geometrySource: 'shared/visuals/map-annotations.js',
    note: 'The only route in this package to a real place, and now the ONLY map of the real world it holds at all. It draws no land: it places one of the stock continent/world images from builder/assets/maps and puts the marks a lesson needs ON TOP - a dot on a city, a dashed area round a region, a line along a river - each given in fractions of the real image, so board, sheet and glued-in piece mark the identical geography on the identical map. Country shading (the Brazil fill) is a pixel fill of the asset and stays slide-only; on paper the country is named with a point annotation instead. Slides also carry two presentations: globe-to-flat (the staged projection explanation on the world asset) and seven-continent-world (the complete labelled board map on world-with-antarctica, with continent/ocean/sea labels, clue markers, a real-pixel sea focus crop, compass, joined-edge cues, and the Equator and both Tropics computed from the asset\'s own equirectangular geometry). Worksheets and the stick-in pack carry worksheetMode continents-and-oceans, the full-width landscape write-on form of the same world-with-antarctica asset (7 continent + 5 ocean markers, 3 sea-initial spaces, same cues); stickin arrived when the schematic world-geography-map was removed, so the map a child labels in their book is the real one they were taught from rather than a second, hand-drawn world. All of it embeds the shipped PNG; the focus view crops the same pixels; every label, clue and cue is an overlay only - no coastline is ever redrawn. The full-size Success Criteria audit is retained because geographic detail, labels and edge continuity require full-size reading space. wall:false because a stock map carrying one lesson worth of marks is teaching, not a unit-long display anchor.' },
  { id: 'circuit-symbol-bank', depicts: 'data', slides: 'circuit-symbol-bank', worksheets: 'circuit-symbol-bank', wall: 'circuit-symbol-bank', stickin: 'circuit-symbol-bank',
    geometrySource: 'shared/visuals/circuit-symbol-bank-svg.js',
    note: 'The component-symbol key of a circuit lesson: individually identifiable standard symbols (cell, lamp, wire, open/closed switch) each carrying its own child-facing name. The drawing sits beside the circuit in shared/visuals/circuit-diagram-svg.js so the key and the loop it keys cannot drift apart; circuit-symbol-bank-svg.js names it as a picture every surface places. It was board-only until 13 September 2026, and the guard counted the board as drawing its own because the drawing was called by a name no surface\'s placer looks for.' },
  { id: 'callout', depicts: 'data',         slides: 'callout',         worksheets: false, wall: false, stickin: false,
    note: 'A small coloured box holding one short line, with an arrow leaving any side to point at the thing the line is about. Board-only, and the reason is that every other surface already points at its own content a different way. wall:false - the wall annotates a diagram through the `callouts` array on a card visual, composited through the shared label-diagram overlay (the labelledDiagram card); a standalone callout primitive there would be a second way to do the one job, the same reasoning recorded for `map` above. worksheets:false - a sheet points at part of a picture with `label-diagram`, whose leader lines are drawn INTO the figure; the sheet has no free-placed zone beside a figure for a box to point from. stickin:false - a callout is something the teacher points with, never something the child marks, so it fails the write-on test a stick-in piece has to pass. Revisit the worksheet if worksheet zones ever let a figure and a note sit side by side.' },
  { id: 'area-grid', depicts: 'data',       slides: 'area-grid',       worksheets: false, wall: false, stickin: false,
    successCriteriaSource: 'shared/visuals/area-grid-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'count-array', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: {} } }
    ] },
  { id: 'concept-map', depicts: 'data',     slides: 'concept-map',     worksheets: false, wall: false, stickin: false },
  { id: 'source-pathway', depicts: 'data',  slides: 'source-pathway',  worksheets: false, wall: false, stickin: false,
    note: 'board-only fan-in figure: several distinct source nodes visibly joining one named intermediate state and continuing to one outcome. The board is where the convergence is revealed and traced; the same relationship on paper is the child\'s own labelled diagram, not this presentation-shaped board visual.' },
  { id: 'continuum-line', depicts: 'data',  slides: 'continuum-line',  worksheets: false, wall: false, stickin: false },
  { id: 'timeline', depicts: 'data',        slides: 'timeline',        worksheets: 'timeline', wall: false, stickin: false,
    note: 'Named era bands on a line with dated ticks beneath, positioned by fractions the designer chooses (a school timeline is almost never honestly to scale, so the spacing is a teaching decision). The board and the sheet draw the same figure from the same fields, so a placement asked on the slide can be asked again on paper. wall:false - a timeline carrying one lesson of dated sources is teaching rather than a unit-long display anchor; the chronology reference on the wall belongs to the unit, not to this figure. stickin:false - the sheet already prints the timeline as a write-on figure through the worksheet engine, and no stick-in registry key exists yet; revisit when a lesson wants the line glued into a book rather than on the sheet.' },
  { id: 'diamond-nine', depicts: 'data',    slides: 'diamond-nine',    worksheets: false, wall: false, stickin: false },
  { id: 'fishbone', depicts: 'data',        slides: 'fishbone',        worksheets: false, wall: false, stickin: false },
  { id: 'number-network', depicts: 'data',  slides: 'number-network',  worksheets: false, wall: false, stickin: false },
  { id: 'concept-matching', depicts: 'data', slides: 'matching',       worksheets: false, wall: false, stickin: false,
    note: 'slide-only sorting/matching activity (draws connector affordances), done live on the board.' },
  { id: 'mult-grid', depicts: 'data',       slides: 'mult-grid',       worksheets: 'times-table-grid', wall: false, stickin: false,
    note: 'worksheets:false — the sheet has its own column/grid arithmetic family (short/long-multiplication-grid); the slide mult-grid is the board model, not the same key.' },
  { id: 'fraction-wall', depicts: 'data',   slides: 'fraction-wall',   worksheets: false, wall: false, stickin: false },
  { id: 'dial-scale', depicts: 'data',      slides: 'dial-scale',      worksheets: false, wall: false, stickin: false },
  { id: 'measuring-jug', depicts: 'data',   slides: 'measuring-jug',   worksheets: false, wall: false, stickin: false },
  { id: 'translation-grid', depicts: 'data', slides: 'translation-grid', worksheets: false, wall: false, stickin: false },
  { id: 'part-whole-model', depicts: 'data', slides: 'part-whole-model', worksheets: 'part-whole', wall: false, stickin: false,
    successCriteriaSource: 'shared/visuals/part-whole-model-cue-svg.js',
    successCriteriaHelpers: [
      { key: 'part-whole', mode: 'SC-inline', fullSize: null, inline: { treatment: 'simplified', spec: {} } }
    ],
    note: 'the money-specific part-whole is tracked under `money` (part-whole-money-question); this is the generic board model.' },

  // ── Stick-in write-on shapes with no board or wall twin: a blank box-row the
  //    child draws into, glued into the book.
  { id: 'draw-box-row', depicts: 'data',    slides: false, worksheets: false, wall: false, stickin: 'draw-box-row',
    note: 'stick-in write-on only - a strip of blank boxes the child draws in; never a board or wall figure.' },
  // ── Pictures the worksheet drew with nobody else able to (added 13 September
  //    2026, when every picture became one shared drawing on all four surfaces).
  { id: 'base-ten-blocks', depicts: 'data', slides: false, worksheets: 'base-ten-blocks', wall: false, stickin: false },
  { id: 'counter-group', depicts: 'data', slides: false, worksheets: 'counter-group', wall: false, stickin: false },
  { id: 'ruler', depicts: 'data', slides: false, worksheets: 'ruler', wall: false, stickin: false },
  { id: 'process-chain', depicts: 'data', slides: false, worksheets: 'process-chain', wall: false, stickin: false },
  { id: 'classification-key', depicts: 'data', slides: false, worksheets: 'classification-key', wall: false, stickin: false },
];

// Every visual primitive is explicitly audited for Success Criteria use. This
// prevents future audits from narrowing to a hand-picked notation list: a new
// visual must say whether it has catalogue-backed compact treatments, should
// stay full-size, or is unsuitable as a step cue.
const SUCCESS_CRITERIA_AUDIT = Object.freeze({
  'comparison-slot': { classification: 'unsuitable', reason: 'An empty answer ring is a task response surface, not a transferable success-criteria cue.' },
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
  'geographical-description-frame': { classification: 'unsuitable', reason: 'Its value is the readable three-part prompt and writing space; miniaturising an empty frame would not cue an action.' },
  'recording-table': { classification: 'unsuitable', reason: 'Its value is the readable headers and writing cells; a miniature empty grid cues nothing.' },
  'source-copy': { classification: 'unsuitable', reason: 'A printed copy of one source is evidence to read, not a method mark; shrunk beside a step it is a grey smudge.' },
  'balanced-pattern-plate': { classification: 'full-size', reason: 'The proportional sectors, food-group labels and separate less-often cue need full-size reading space.' },
  'circuit-diagram': { classification: 'full-size', reason: 'Which components, and whether the switch is open, IS the question; a generic loop cues nothing.' },
  'parachute-forces': { classification: 'full-size', reason: 'The exact canopy, cord, load and force relationships plus their external labels need a full teaching or wall-sized comparison; miniaturising it would erase the fair-test evidence.' },
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
  'place-value-mini': { classification: 'unsuitable', reason: 'It is already a miniature, drawn to sit in a 2.2-inch vocabulary panel; shrunk again beside a success-criteria step it carries neither the digit nor the column it exists to point at.' },
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
  timeline: { classification: 'full-size', reason: 'The era bands and dated marks are the content; a tiny line cues nothing.' },
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
  'draw-box-row': { classification: 'unsuitable', reason: 'A tiny blank write-on strip gives no actionable cue.' },
  'base-ten-blocks': { classification: 'full-size', reason: 'The number of each block is the value being read.' },
  'counter-group': { classification: 'full-size', reason: 'The counters and their grouping are the value being read.' },
  ruler: { classification: 'full-size', reason: 'The scale and the measured length must match the question.' },
  'process-chain': { classification: 'full-size', reason: 'The stages and their order are content-specific.' },
  'classification-key': { classification: 'full-size', reason: 'The questions and branches are the content.' }
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

// Typed layout rather than pictures. Each surface sets these as its own text,
// boxes and lines, so a teacher can edit the words in PowerPoint and a sheet can
// wrap them to its column; the shared-drawing rule (every picture drawn once, in
// shared/visuals/, and reachable from every surface) applies to PICTURES below
// and not to these. A thing belongs here when what it shows is words in an
// arrangement, not marks whose position or shape carries meaning.
const TYPED_LAYOUT = Object.freeze([
  'method-frame',     // labelled lines of a written method
  'chip-bank',        // a bank of word or number chips
  'concept-matching', // items to match, laid out on the board
  'source-copy',      // a printed copy of the lesson's own picture file
  'recording-table',  // a table the child fills in
  'callout',          // a box of words with an arrow, for pointing
]);

// Worksheet helpers that are the sheet's own typed layout (questions, writing
// space, tables, frames of words). Every other worksheet helper must be a
// picture above, so a new drawing on paper cannot appear without a shared
// drawing and a place on every surface.
const WORKSHEET_LAYOUT_EXEMPT = Object.freeze([
  'instruction', 'questions', 'written-answers', 'section-label', 'source-text',
  'data-table', 'recording-table', 'multiple-choice', 'sort-grid', 'drawing-space',
  'column-method-grid', 'short-multiplication-grid', 'long-multiplication-grid',
  'bus-stop-grid', 'long-division-grid', 'match-up', 'card-row', 'speech-scene',
  'named-claim', 'fact-file', 'writing-frame', 'steps', 'storyboard',
  'compare-row', 'inequality-with-boxes', 'number-sentence', 'order-numbers',
  'order-table', 'data-table-with-ordering', 'circle-the-answer', 'digit-cards',
  'stacked-fraction', 'fraction-sequence', 'cause-path-grid', 'evidence-chain-frame',
  'method-frame', 'chip-bank',
]);

// What is not shared yet, as the code stands. Every picture is meant to be drawn
// once, in shared/visuals/, and to be drawable on the board, the worksheet, the
// wall and the stick-in pack from that one drawing (Daniel, 13 September 2026:
// "Make everything shared ... consistency is good, and it stops anything having
// to be built because 'it can't use that one'"). Each row says, per surface,
// what is still wrong: `own` (the surface draws the picture with code of its
// own) or `missing` (the surface cannot draw it at all).
//
// builder/scripts/check-parity.js recomputes this from the code on every check
// and refuses any difference in either direction, so the list only ever shrinks:
// a surface that becomes shared must come off the list in the same change, and
// nothing may be added. `node builder/scripts/sharing-status.js` prints the table;
// `--backlog` prints this literal.
const SHARING_BACKLOG = Object.freeze({
  "comparison-slot": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "geographical-description-frame": { worksheets: 'missing', wall: 'missing' },
  "polygon": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "triangle-square": { slides: 'own', worksheets: 'own', wall: 'own', stickin: 'missing' },
  "turn-diagram": { slides: 'own', worksheets: 'own', wall: 'own', stickin: 'missing' },
  "clock": { slides: 'own', worksheets: 'own', wall: 'own', stickin: 'missing' },
  "pyramid": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "place-value-chart": { slides: 'own', worksheets: 'own', stickin: 'missing' },
  "place-value-mini": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "money": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "shaded-fraction": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "angle-fan": { slides: 'missing', worksheets: 'missing', wall: 'own', stickin: 'missing' },
  "comparison-symbol": { slides: 'missing', worksheets: 'missing', wall: 'own', stickin: 'missing' },
  "fraction-circle": { slides: 'missing', worksheets: 'missing', wall: 'own', stickin: 'missing' },
  "fraction-bar": { slides: 'missing', worksheets: 'own', wall: 'own', stickin: 'missing' },
  "map": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'own' },
  "area-grid": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "concept-map": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "source-pathway": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "continuum-line": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "timeline": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "diamond-nine": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "fishbone": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "number-network": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "mult-grid": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "fraction-wall": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "dial-scale": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "measuring-jug": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "translation-grid": { slides: 'own', worksheets: 'missing', wall: 'missing', stickin: 'missing' },
  "part-whole-model": { slides: 'own', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "draw-box-row": { slides: 'missing', worksheets: 'missing', wall: 'missing', stickin: 'own' },
  "base-ten-blocks": { slides: 'missing', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "counter-group": { slides: 'missing', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "ruler": { slides: 'missing', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "process-chain": { slides: 'missing', worksheets: 'own', wall: 'missing', stickin: 'missing' },
  "classification-key": { slides: 'missing', worksheets: 'own', wall: 'missing', stickin: 'missing' },
});

// Marks that exist only as a success-criteria cue (join the points in order, count
// equal scale intervals). They are not pictures a lesson places on a surface: they
// are drawn inside a criteria step, wherever that step is drawn, and a full-size
// version would be a fake second picture (see their notes above).
const SUCCESS_CRITERIA_CUES = Object.freeze(['point-route', 'scale-interval']);

const PICTURES = PRIMITIVES.filter((p) => !TYPED_LAYOUT.includes(p.id) && !SUCCESS_CRITERIA_CUES.includes(p.id));

module.exports = { PRIMITIVES, PICTURES, TYPED_LAYOUT, SUCCESS_CRITERIA_CUES, WORKSHEET_LAYOUT_EXEMPT, SUCCESS_CRITERIA_AUDIT, SLIDE_LAYOUT_EXEMPT, SHARING_BACKLOG };
