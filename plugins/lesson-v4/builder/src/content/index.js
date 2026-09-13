'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT, SAFE, CARD, CARD_COMPACT } = require('../styles');
const { categoryColourFor } = require('../category-colours');
const { warn } = require('../warnings');
const { drawText, measureText } = require('./text');
const { drawBullets } = require('./bullets');
const { drawSteps } = require('./steps');
const { drawVocab } = require('./vocab');
const { drawImage, measureImage } = require('./image');
const { drawTable } = require('./table');
// Pictures drawn once in shared/visuals/ and placed here without a slide file
// of their own (see shared-figure.js).
const { drawerFor } = require('./shared-figure');
const drawNumberline = drawerFor('numberline');
const { drawPlaceValueChart, measurePlaceValueChart } = require('./place-value-chart');
const { drawFractionWall } = require('./fraction-wall');
const { drawMoney } = require('./money');
const { drawMap } = require('./map');
const { drawStack } = require('./stack');
const { drawRow } = require('./row');
const { drawPartWholeModel } = require('./part-whole-model');
const { drawNumberedQuestions } = require('./numbered-questions');
const { drawQuestionCards } = require('./question-cards');
const { drawCallout } = require('./callout');
const { drawPyramid } = require('./pyramid');
const { drawClock }  = require('./clock');
const { drawDiamondNine }   = require('./diamond-nine');
const { drawContinuumLine } = require('./continuum-line');
const { drawTimeline, measureTimeline } = require('./timeline');
const { drawFishbone }      = require('./fishbone');
const { drawConceptMap }    = require('./concept-map');
const { drawSourcePathway } = require('./source-pathway');
const { drawTriangleSquare } = require('./triangle-square');
const { drawMultGrid }      = require('./mult-grid');
const { drawMatching }      = require('./matching');
const { drawCoordinateGrid } = require('./coordinate-grid');
const { drawPolygon }        = require('./polygon');
const { drawTranslationGrid } = require('./translation-grid');
const { drawTranslationShape } = require('./translation-shape');
const { drawShadedFraction } = require('./shaded-fraction');
const { drawDialScale }      = require('./dial-scale');
const drawLineGraph = drawerFor('line-graph');
const { drawNumberNetwork }  = require('./number-network');
const { drawAreaGrid }       = require('./area-grid');
const { drawReflectionGrid } = require('./reflection-grid');
const { drawGeoboard }       = require('./geoboard');
const { drawMeasuringJug }   = require('./measuring-jug');
const { drawTurnDiagram }    = require('./turn-diagram');
const { drawAngle }          = require('./angle');
const { drawTriangle, drawTriangleNonExample } = require('./triangle');
const { drawLinePair } = require('./line-pair');
const { drawPlaceValueMini } = require('./place-value-mini');
const { drawCircuitDiagram, measureCircuitDiagram } = require('./circuit-diagram');
const { drawParachuteForces, measureParachuteForces } = require('./parachute-forces');
const { drawCircuitSymbolBank, measureCircuitSymbolBank } = require('./circuit-symbol-bank');
const { drawChipBank }       = require('./chip-bank');
const { drawSortBoard }      = require('./sort-board');
const { drawEvidenceCards }  = require('./evidence-cards');
const { drawVenn }           = require('./venn');
const { drawCarroll }        = require('./carroll');
const { drawTallyChart }     = require('./tally-chart');
const { drawScPanelContent } = require('./sc-panel');
const drawBarChart = drawerFor('bar-chart');
const { drawPictogram }      = require('./pictogram');
const { drawBarModel }       = require('./bar-model');
const { drawBlankSurface }   = require('./blank-surface');
const { drawComparisonSlot, measureComparisonSlot, maxUsefulWidthComparisonSlot } = require('./comparison-slot');
const { drawMethodFrame }    = require('./method-frame');
const { drawLabelDiagram, measureLabelDiagram }   = require('./label-diagram');
const { drawGridMap }        = require('./grid-map');
const { drawRainforestLayers } = require('./rainforest-layers');
const { drawBalancedPatternPlate } = require('./balanced-pattern-plate');
const { drawGeographicalDescriptionFrame } = require('./geographical-description-frame');

const ZONE_COMPAT = {
  text:                ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'F', 'G'],
  bullets:             ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'F', 'G'],
  steps:               ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'F', 'G'],
  vocab:               ['A', 'B', 'C', 'E-wide', 'E-narrow'],
  image:               ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  map:                 ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  table:               ['A', 'B', 'C', 'E-wide'],
  numberline:          ['A', 'B', 'C', 'E-wide', 'E-narrow'],
  // G added for the quick-check side rail: the narrow side of a split-h-75-25 is a
  // small-card zone, and a bare heading strip in it is exactly the "scaffold box"
  // that class is for. A 4-column chart still reads clearly at ~2" wide, so the
  // zone is not the constraint — the absence of G was, and it silently shipped the
  // words "[place-value-chart]" where the strip should have been.
  'place-value-chart': ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'fraction-wall':     ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'part-whole-model':  ['A', 'B', 'C', 'E-wide', 'E-narrow'],
  'triangle-square':   ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  money:               ['A', 'B', 'C', 'E-wide', 'E-narrow', 'G'],
  stack:               ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  row:                 ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'numbered-questions':['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'question-cards':    ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  // Not F: a one-line instruction bar has no room for the box AND the arrow, and
  // an arrow is the whole reason to reach for a callout rather than a text line.
  callout:             ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  pyramid:             ['A', 'B', 'C', 'E-wide'],
  'mult-grid':         ['A', 'B', 'C', 'E-wide'],
  matching:            ['A', 'B', 'C', 'E-wide'],
  clock:               ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'diamond-nine':      ['A', 'C', 'E-wide'],
  'continuum-line':    ['A', 'B', 'C', 'E-wide'],
  // A timeline wants width for its dated marks; a narrow zone forces its
  // labels below the readable floor, and the helper refuses that by name.
  timeline:            ['A', 'B', 'C', 'E-wide'],
  fishbone:            ['A', 'C', 'E-wide'],
  'concept-map':       ['A', 'C', 'E-wide'],
  'source-pathway':    ['A', 'C', 'E-wide'],
  'coordinate-grid':   ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  polygon:             ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'translation-grid':  ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'translation-shape': ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'shaded-fraction':   ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'dial-scale':        ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'line-graph':        ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'number-network':    ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'area-grid':         ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'reflection-grid':   ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  geoboard:            ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'measuring-jug':     ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'turn-diagram':      ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  angle:               ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  triangle:            ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'triangle-nonexample': ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'line-pair':         ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  // The small place-value drawing built for a vocabulary card's 2.2" panel:
  // one digit mapping to its value, a highlighted column, ten tens becoming a
  // hundred, or the zeros in a numeral. `templates.md` documents it as a
  // `key-vocabulary` visual with four worked examples, and it draws through
  // `content/vocab.js` - but it was never registered here, and the layout
  // preflight walks every typed node including a card's `visual`. So a deck
  // that used it exactly as documented was refused before it drew
  // (CONTENT_ZONE_INCOMPATIBLE), and the designer shipped a text-only card
  // instead (5 September 2026). Registered like its sibling card visuals.
  'place-value-mini':  ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'circuit-diagram':   ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'parachute-forces':  ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  // The component-symbol key for a circuit lesson: individually identifiable
  // symbols with child-facing names, for the slide that teaches or consults
  // the symbol map itself (a complete loop is circuit-diagram's job).
  'circuit-symbol-bank': ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'chip-bank':         ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'sort-board':        ['A', 'B', 'C', 'E-wide'],
  'evidence-cards':    ['A', 'B', 'C', 'E-wide'],
  venn:                ['A', 'B', 'C', 'D', 'E-wide'],
  carroll:             ['A', 'B', 'C', 'D', 'E-wide'],
  'tally-chart':       ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'sc-panel':          ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'bar-chart':         ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  pictogram:           ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow'],
  'bar-model':         ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'blank-surface':     ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'comparison-slot':   ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'method-frame':      ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'label-diagram':     ['A', 'B', 'C', 'D', 'E-wide', 'G'],
  'grid-map':          ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'rainforest-layers': ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'balanced-pattern-plate': ['A', 'B', 'C', 'D', 'E-wide', 'E-narrow', 'G'],
  'geographical-description-frame': ['A', 'C', 'E-wide']
};

const HELPERS = {
  text:                drawText,
  bullets:             drawBullets,
  steps:               drawSteps,
  vocab:               drawVocab,
  image:               drawImage,
  map:                 drawMap,
  table:               drawTable,
  numberline:          drawNumberline,
  'place-value-chart': drawPlaceValueChart,
  'fraction-wall':     drawFractionWall,
  'part-whole-model':  drawPartWholeModel,
  'triangle-square':   drawTriangleSquare,
  money:               drawMoney,
  stack:               drawStack,
  row:                 drawRow,
  'numbered-questions':drawNumberedQuestions,
  'question-cards':    drawQuestionCards,
  callout:             drawCallout,
  pyramid:             drawPyramid,
  'mult-grid':         drawMultGrid,
  matching:            drawMatching,
  clock:               drawClock,
  'diamond-nine':      drawDiamondNine,
  'continuum-line':    drawContinuumLine,
  timeline:            drawTimeline,
  fishbone:            drawFishbone,
  'concept-map':       drawConceptMap,
  'source-pathway':    drawSourcePathway,
  'coordinate-grid':   drawCoordinateGrid,
  polygon:             drawPolygon,
  'translation-grid':  drawTranslationGrid,
  'translation-shape': drawTranslationShape,
  'shaded-fraction':   drawShadedFraction,
  'dial-scale':        drawDialScale,
  'line-graph':        drawLineGraph,
  'number-network':    drawNumberNetwork,
  'area-grid':         drawAreaGrid,
  'reflection-grid':   drawReflectionGrid,
  geoboard:            drawGeoboard,
  'measuring-jug':     drawMeasuringJug,
  'turn-diagram':      drawTurnDiagram,
  angle:               drawAngle,
  triangle:            drawTriangle,
  'triangle-nonexample': drawTriangleNonExample,
  'line-pair':         drawLinePair,
  'place-value-mini':  drawPlaceValueMini,
  'circuit-diagram':   drawCircuitDiagram,
  'parachute-forces':  drawParachuteForces,
  'circuit-symbol-bank': drawCircuitSymbolBank,
  'chip-bank':         drawChipBank,
  'sort-board':        drawSortBoard,
  'evidence-cards':    drawEvidenceCards,
  venn:                drawVenn,
  carroll:             drawCarroll,
  'tally-chart':       drawTallyChart,
  'sc-panel':          drawScPanelContent,
  'bar-chart':         drawBarChart,
  pictogram:           drawPictogram,
  'bar-model':         drawBarModel,
  'blank-surface':     drawBlankSurface,
  'comparison-slot':   drawComparisonSlot,
  'method-frame':      drawMethodFrame,
  'label-diagram':     drawLabelDiagram,
  'grid-map':          drawGridMap,
  'rainforest-layers': drawRainforestLayers,
  'balanced-pattern-plate': drawBalancedPatternPlate,
  'geographical-description-frame': drawGeographicalDescriptionFrame
};

// Content types that already paint their own surface (a panel, cards, pills,
// bubbles, a workspace): drawing the card look behind them would read as a
// box inside a box, so they opt out here rather than at each call site.
const OWN_SURFACE = new Set([
  'sc-panel', 'callout', 'question-cards', 'numbered-questions', 'chip-bank',
  'sort-board', 'evidence-cards',
  'method-frame', 'vocab', 'money', 'blank-surface', 'comparison-slot'
]);

// List-shaped content whose card look is per item (one card per row), drawn
// by the helper itself rather than as one flat card around the whole list.
const ITEM_CARDS = new Set(['steps']);

// Layout containers are transparent to the card look: they never take a card
// themselves, and their children each card individually, so a stack of three
// texts reads as three cards (the reference redesigns' look), never one tall
// card with the joins hidden inside it.
const TRANSPARENT = new Set(['stack', 'row']);

// Helpers that can predict their drawn extent register a measure here. The
// card then hugs what will actually be drawn instead of spanning the whole
// zone, so a chart or photo that centres itself with slack does not sit in a
// card of dead white space. A measure returns the card-ready rect (content
// plus its own breathing margin) in slide inches; null falls back to the
// full zone; `clamp: true` hands the helper the hugged rect as its zone;
// `none: true` suppresses the card entirely (an optional photo that will not
// draw must not leave an empty white box behind).
const MEASURE = {
  'place-value-chart': measurePlaceValueChart,
  'comparison-slot': measureComparisonSlot,
  text: measureText,
  image: measureImage,
  // Fixed-aspect figures: the card hugs the contained picture, not the zone.
  'label-diagram': measureLabelDiagram,
  'circuit-diagram': measureCircuitDiagram,
  'parachute-forces': measureParachuteForces,
  'circuit-symbol-bank': measureCircuitSymbolBank,
  // The bands, line and dated labels are laid out from their own content and
  // centred in spare height; the card hugs that figure, not the zone.
  timeline: measureTimeline
};

// Helpers that pad their own content (text 0.08in, image 0.12in). Their card
// reuses that padding instead of adding CARD.pad on top: the double padding
// shrank the box the fit pass sizes text into, which is exactly how carded
// text ended up SMALLER than flat text (the 32pt-written, 20pt-rendered
// Loggers line). The card look is never allowed to cost font size.
const SELF_PADDED = new Set([
  'text',
  'image',
  // The figure's own PAD (0.10) IS the card's padding: adding CARD.pad on
  // top would shrink the box the contain-fit draws into, exactly the fault
  // the text/image entries above guard against.
  'label-diagram',
  'circuit-diagram',
  'circuit-symbol-bank'
]);

// The card look (slide visual refresh, Aug 2026): one white rounded card
// behind each top-level content block, so a slide reads as grouped chunks on
// the tinted background. Only the outermost block gets the card: helpers that
// compose inner content (stack, row, sc-panel) re-enter drawContent at
// depth > 0 and draw bare, otherwise every stacked child would wear its own
// box. Templates that draw a zone's panel themselves pass `noCard: true` on
// that zone.
function wantsCard(zone, type, data, ctx) {
  if (!ctx.cardLook) return false;
  if (ctx._cardBarrier) return false;               // inside a helper that owns its surface
  if (zone.noCard) return false;
  if (OWN_SURFACE.has(type)) return false;
  // An explicit category has earned a container border. It may wrap a row or
  // stack as one group, and it may sit in a short F-zone when a hint repeats
  // the category language used by the larger cards above it.
  if (categoryColourFor(data && data.categoryColor)) return true;
  if (TRANSPARENT.has(type)) return false;          // container defers to its children
  if (zone.class === 'F') return false;             // one-line instruction bar
  // Too small on the open slide to be a card at all. The height half of that
  // is about a card the content would burst out of, so a text block that
  // measures shorter than its zone keeps its card however short the zone is:
  // a stack item weighted 0.55 landed at 0.645in, lost its card by 0.055in,
  // and a child saw one instruction floating on the background while every
  // other line on the slide sat on white.
  if (!zone.compactCards && zone.w < 1.0) return false;
  if (!zone.compactCards && zone.h < 0.7) {
    if (type !== 'text') return false;
    const extent = measureContentExtent(zone, data, ctx);
    return !!extent && extent.h <= zone.h;
  }
  return true;
}

function drawContent(pptx, slide, zone, data, ctx) {
  if (!data || !data.type) {
    return drawFallback(slide, zone, '', ctx);
  }
  const type = data.type;
  const classes = ZONE_COMPAT[type];
  if (!classes) {
    warn(ctx.slideIndex, `unknown content type "${type}" — falling back to label text`);
    return drawFallback(slide, zone, stringifyFallback(data), ctx);
  }
  if (zone.class && !classes.includes(zone.class)) {
    throw new Error(
      `CONTENT_ZONE_INCOMPATIBLE: registry does not allow content type "${type}" in zone class ${zone.class}. ` +
        `Nothing was removed or replaced.`
    );
  }
  const fn = HELPERS[type];
  if (!fn) {
    warn(ctx.slideIndex, `content type "${type}" not yet implemented — falling back to label text`);
    return drawFallback(slide, zone, stringifyFallback(data), ctx);
  }

  let inner = zone;
  const categoryLine = categoryColourFor(data.categoryColor);
  const hasCard = wantsCard(zone, type, data, ctx);
  if (hasCard) {
    if (ITEM_CARDS.has(type)) {
      // List-shaped content reads flat under one big card; each item carries
      // its own (drawn by the helper, which knows its rows), so here we only
      // pass the request down.
      inner = Object.assign({}, zone, { itemCards: true });
    } else {
      // Inside a panel (the SC panel's interior) the compact params apply:
      // tighter padding so the fit pass keeps the font readable from the back
      // of the room. Self-padded helpers take no card inset at all - their
      // own padding is the card's padding.
      const P = zone.compactCards ? CARD_COMPACT : CARD;
      const pad = SELF_PADDED.has(type) ? 0 : P.pad;
      inner = pad === 0 ? zone : Object.assign({}, zone, {
        x: zone.x + pad, y: zone.y + pad,
        w: zone.w - 2 * pad, h: zone.h - 2 * pad
      });
      // The helper draws inside `inner`; when it can say where, the card hugs
      // that rect rather than the whole zone. A measure with `clamp` also
      // takes over the helper's zone, so the content sits in the card rather
      // than centring in the taller slot behind it.
      let rect = { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
      let noCardAfterAll = false;
      const measure = MEASURE[type];
      if (measure) {
        const drawn = measure(inner, data, ctx);
        if (drawn && drawn.none) {
          noCardAfterAll = true;
        } else if (drawn && drawn.h > 0.3) {
          rect = {
            x: drawn.x - pad, y: drawn.y - pad,
            w: drawn.w + 2 * pad, h: drawn.h + 2 * pad
          };
          if (drawn.clamp) {
            // `cell` keeps the allocation the helper was given before its card
            // hugged the drawn content. A helper that judges whether it was
            // handed enough room has to read the allocation, not the hug: the
            // hug is the answer to that question, so measuring it would always
            // agree with itself.
            inner = Object.assign({}, inner, {
              x: drawn.x, y: drawn.y, w: drawn.w, h: drawn.h,
              cell: { x: inner.x, y: inner.y, w: inner.w, h: inner.h }
            });
          }
        }
      }
      if (!noCardAfterAll) {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
          x: rect.x, y: rect.y, w: rect.w, h: rect.h,
          fill: { color: P.fill },
          line: categoryLine
            ? { color: categoryLine, width: P.categoryLineW }
            : (P.lineW ? { color: P.line, width: P.lineW } : { type: 'none' }),
          rectRadius: P.radius,
          shadow: Object.assign({}, P.shadow)
        });
      }
    }
  }

  // Helpers own their inner drawing, so content they re-enter with must not
  // card again; stack and row are the exception, existing only to lay their
  // children out, so the card decision passes through them untouched unless
  // categoryColor deliberately turns the whole container into one category.
  const hadBarrier = !!ctx._cardBarrier;
  if (!TRANSPARENT.has(type) || (hasCard && categoryLine)) ctx._cardBarrier = true;
  try {
    return fn(pptx, slide, inner, data, ctx);
  } finally {
    ctx._cardBarrier = hadBarrier;
  }
}

function stringifyFallback(data) {
  if (!data) return '';
  if (data.value) return String(data.value);
  if (data.text) return String(data.text);
  if (data.caption) return String(data.caption);
  if (data.title) return String(data.title);
  if (Array.isArray(data.steps)) {
    return data.steps.map((s, i) => {
      const text = s && typeof s === 'object' && !Array.isArray(s) ? s.text : s;
      return `${i + 1}. ${text == null ? '' : text}`;
    }).join('\n');
  }
  if (Array.isArray(data.items)) {
    return data.items.map((it) => (typeof it === 'string' ? it : (it && (it.text || it.value)) || '')).filter(Boolean).join('\n');
  }
  // A table (or any rows-based content) that reaches this fallback path should
  // still show its content as readable text, never a dead "[table]" token — the
  // teacher needs to see the rows, not a placeholder.
  if (Array.isArray(data.rows)) {
    const lines = [];
    if (Array.isArray(data.headers) && data.headers.some(Boolean)) {
      lines.push(data.headers.filter(Boolean).join('  |  '));
    }
    data.rows.forEach((row) => {
      if (Array.isArray(row)) {
        const cells = row.filter((c) => c !== '' && c != null);
        if (cells.length) lines.push(cells.join('  |  '));
      }
    });
    if (lines.length) return lines.join('\n');
  }
  if (Array.isArray(data.questions)) {
    // Bracketed labels and no em dash, even on this degraded path — a fallback
    // still reaches a child's slide (references/preferences.md, Question
    // Labelling and Written Voice).
    return data.questions.map((q, i) => {
      const text = q && typeof q === 'object' && !Array.isArray(q) ? q.text : q;
      return `(${i + 1}) ${String(text == null ? '' : text).replace('||', ' - ')}`;
    }).join('\n');
  }
  if (data.type) return `[${data.type}]`;
  return '';
}

// The natural drawn height of one content block in a zone: the card that
// would appear (content plus its card padding), in slide inches. Split
// templates use it to align a side-by-side pair the way the drawn slide will
// actually look — a fill text card sized to its partner, a shorter member
// centred on the pair — instead of leaving each zone to land wherever its own
// hug puts it. Returns null when the content spans whatever it is given
// (no registered measure, or the measure declined), which callers read as
// "this side uses its whole zone".
function measureContentExtent(zone, data, ctx) {
  if (!ctx || !ctx.cardLook) return null;
  if (!data || !data.type) return null;
  const measure = MEASURE[data.type];
  if (!measure) return null;
  // A fill text's measure is null by contract (the card spans the zone), but
  // its partner still needs the text's natural height to settle the pair, so
  // the probe asks the hug question regardless of the declared mode.
  const probe = data.type === 'text' && data.heightMode
    ? Object.assign({}, data, { heightMode: 'hug' })
    : data;
  const pad = SELF_PADDED.has(data.type)
    ? 0
    : (zone.compactCards ? CARD_COMPACT : CARD).pad;
  const inner = pad === 0 ? zone : Object.assign({}, zone, {
    x: zone.x + pad, y: zone.y + pad,
    w: zone.w - 2 * pad, h: zone.h - 2 * pad
  });
  let drawn;
  try {
    drawn = measure(inner, probe, ctx);
  } catch {
    return null;
  }
  if (!drawn || drawn.none || !(drawn.h > 0.3)) return null;
  return { h: drawn.h + 2 * pad };
}


// How much of its zone a whole COMPOSITION will actually use, layout containers
// included.
//
// Deliberately separate from measureContentExtent above, which answers a
// narrower question - "should this item's card hug its content?" - and whose
// answer the card look and the stack reflow are both tuned against. Teaching
// those callers about containers changes how existing slides hug: a fill text
// beside a stack, for one, is meant to keep the whole zone precisely BECAUSE
// its partner cannot be measured. A template asking how much of its zone a
// composition will use wants the broader answer, and only the template wants it.

// The widest a piece of content can usefully be, or null when it will use
// whatever width it is given.
//
// A row shares its width out by counting items, which is the same "room by
// count, not by content" that left charts half the size of their zone. Most
// helpers genuinely grow with width and should keep taking it; the ones that
// stop at a size declare where, and a row can then move the difference to the
// items that will use it. Declare a cap only where the helper truly refuses
// more width - a wrong cap here shrinks content that wanted the room.
const MAX_USEFUL_WIDTH = {
  'comparison-slot': maxUsefulWidthComparisonSlot
};

function maxUsefulWidth(item) {
  if (!item || !item.type) return null;
  const cap = MAX_USEFUL_WIDTH[item.type];
  if (!cap) return null;
  const w = cap(item);
  return Number.isFinite(w) && w > 0 ? w : null;
}

function measureCompositionExtent(zone, data, ctx) {
  if (!data || !data.type) return null;
  if (data.type === 'stack') return require('./stack').measureStack(zone, data, ctx);
  if (data.type === 'row') return require('./row').measureRow(zone, data, ctx);
  return measureContentExtent(zone, data, ctx);
}

function drawFallback(slide, zone, label, ctx) {
  const PAD = 0.08;
  slide.addText(label || '[missing content]', {
    x: zone.x + PAD, y: zone.y + PAD,
    w: zone.w - 2 * PAD, h: zone.h - 2 * PAD,
    fontFace: FONT, fontSize: SIZE_CEILINGS.body,
    color: COLOURS.dim, italic: true,
    align: 'left', valign: 'top',
    margin: 0, fit: FIT
  });
}

module.exports = { drawContent, measureContentExtent, measureCompositionExtent, maxUsefulWidth, ZONE_COMPAT };
