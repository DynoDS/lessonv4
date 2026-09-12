// SVG primitives the working wall renders to PNG via sharp before HTML/PDF
// rendering. Every primitive follows the same shape: an *Svg(spec, sizePx)
// generator returning an SVG string and an *Key(spec) function returning a
// unique cache key. The pre-render walker collects every primitive instance
// the cards need, renders each unique key once, and stores PNG buffers in a map.
//
// All visual primitives render on a square canvas (RENDER_PX × RENDER_PX) so
// panelWithVisual's square image-transform stays correct without any aspect
// plumbing. Wide visuals (number line) sit at vertical centre with whitespace
// above and below — slightly less efficient but ships now.

// The design canvas. Geometry inside the primitives is worked out from this
// number, and their stroke widths are absolute against it (`stroke-width="3"`
// and friends), so changing it would thin every line in every drawing. It stays
// where it is.
const RENDER_PX = 600;          // clock / fraction / angle / number-line design canvas

// How many raster pixels each canvas unit becomes. The two are separate because
// a drawing is placed at whatever width its card has room for, and the widest
// placement on the wall is a full-bleed A3 landscape figure at about 14.7in. A
// 600px render across that is roughly 41 dots per inch, and a review of every
// wall the engine had built found exactly that: a place-value chart blown up to
// 31.6cm with visible staircase edges on its digits. The SVG is vector, so
// rendering the same 600-unit drawing at 4x costs nothing in proportion and
// takes the widest placement to about 163 dots per inch.
const RENDER_SCALE  = 4;
const RENDER_OUT_PX = RENDER_PX * RENDER_SCALE;
const BADGE_PX  = 240;          // step badge resolution

// Shared diagram geometry — the SAME source the slide and worksheet engines
// draw from, so a wall line-pair / angle is identical to the one on the board.
// These produce a TIGHT SVG plus its true aspect; the wall stores that aspect
// and places the image by it (no square padding), matching the other engines.
const linePairShared = require('../../shared/visuals/line-pair-svg');
const jumpsGeo       = require('../../shared/visuals/number-line-jumps');
const { RING: highlightRing } = require('../../shared/visuals/figure-highlight');
const angleShared    = require('../../shared/visuals/angle-svg');
const triangleShared = require('../../shared/visuals/triangle-svg');
const vennShared     = require('../../shared/visuals/venn-svg');
const carrollShared  = require('../../shared/visuals/carroll-svg');
const geoboardShared = require('../../shared/visuals/geoboard-svg');
const reflectionGridShared = require('../../shared/visuals/reflection-grid-svg');
const coordinateGridShared = require('../../shared/visuals/coordinate-grid-svg');
const translationShapeShared = require('../../shared/visuals/translation-shape-svg');
const tallyChartShared = require('../../shared/visuals/tally-chart-svg');
const pictogramShared = require('../../shared/visuals/pictogram-svg');
const barChartShared = require('../../shared/visuals/bar-chart-svg');
const lineGraphShared = require('../../shared/visuals/line-graph-svg');
const barModelShared = require('../../shared/visuals/bar-model-svg');
const gridMapShared = require('../../shared/visuals/grid-map-svg');
const rainforestLayersShared = require('../../shared/visuals/rainforest-layers-svg');
const balancedPatternPlateShared = require('../../shared/visuals/balanced-pattern-plate-svg');
const placeValueChartShared = require('../../shared/visuals/place-value-chart-svg');
// The same strict circuit the slides and the sheets draw, so a wall card and
// the board show one circuit rather than two drawings of it.
const circuitShared = require('../../shared/visuals/circuit-diagram-svg');
const parachuteForcesShared = require('../../shared/visuals/parachute-forces-svg');
// The annotation overlay (anchor → leader line → label) shared with the slides,
// worksheets and stick-in pack. The wall uses it to turn any drawn primitive
// into an "anatomy poster" reference card: the diagram children met on the board,
// with its parts called out and labelled in answer-green.
const { buildLabelDiagramSvg } = require('../../shared/visuals/label-diagram-svg');

// The base is embedded as a bitmap inside the composite, so it caps how sharp
// the diagram itself can be however large the composite is rendered. The side
// margins take 20% each, leaving the diagram 60% of the composite width, so the
// base wants to be at least that share of ANNOTATED_PX.
const ANNOTATED_BASE_PX = 1800;  // base primitive resolution before callouts overlay
const ANNOTATED_PX      = 2400;  // composite (diagram + callouts) resolution; bigger so labels stay crisp
const WALL_LABEL_GREEN  = '#00B050';  // house answer-green for finished callout labels

function toRad(deg) { return (deg * Math.PI) / 180; }

function fmt(n) {
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  return String(Math.round(n * 100) / 100);
}

function hashColour(c) {
  if (!c) return '#EF4444';
  return c.startsWith('#') ? c : `#${c}`;
}

// ─── Clock face ─────────────────────────────────────────────────────────
// Mirrors lesson-resources/builder/src/content/clock.js#buildSvg so wall
// clocks look identical to slide clocks. Same proportions, same hand styling.
//
// Two optional flags extend the basic face for clock-reading lessons:
// - `colourCoded: true` — the hour hand renders in red and the minute hand
//   in blue, with a matching colour-coded digital readout embedded below the
//   face (e.g. red "3", black colon, blue "40"). Lets a child glance from
//   the wall and see at once that the long blue hand maps to the blue minute
//   digits, and the short red hand maps to the red hour digit. The digital
//   readout is part of the SVG so a separate caption is suppressed.
// - `minuteRing: true` — an outer ring outside the 1–12 numerals carrying
//   `:00 :05 :10 … :55` labels at every major position, so children can read
//   off the minute value the long hand is pointing at without having to
//   multiply by 5 in their head. Useful when the lesson is teaching minute
//   reading; not useful once children have internalised the rule.
function clockSvg(spec, sizePx = RENDER_PX) {
  const { time, hands = true, colourCoded = false, minuteRing = false } = spec;

  const HOUR_COLOUR = '#DC2626'; // red-600
  const MIN_COLOUR  = '#2563EB'; // blue-600

  const cx = sizePx / 2;

  // Reserve a strip at the bottom for a digital readout when colour-coded.
  const readoutH = colourCoded ? Math.round(sizePx * 0.18) : 0;
  const clockArea = sizePx - readoutH;
  const cy = clockArea / 2;

  // If a minute ring is present the face must shrink to leave room outside
  // the 1–12 numerals for the labels.
  const pad = minuteRing ? Math.round(sizePx * 0.13) : 26;
  const r = clockArea / 2 - pad;

  const numberR    = r - 34;
  const majorInner = r - 18;
  const minorInner = r - 9;
  const hourLen    = r * 0.55;
  const minuteLen  = r * 0.82;
  const numFont    = Math.round(r * 0.21);

  const parts = [];
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#000000" stroke-width="3"/>`);

  for (let i = 0; i < 60; i++) {
    const rad   = toRad(i * 6 - 90);
    const major = i % 5 === 0;
    const inner = major ? majorInner : minorInner;
    const x1 = (cx + r     * Math.cos(rad)).toFixed(2);
    const y1 = (cy + r     * Math.sin(rad)).toFixed(2);
    const x2 = (cx + inner * Math.cos(rad)).toFixed(2);
    const y2 = (cy + inner * Math.sin(rad)).toFixed(2);
    parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="${major ? 2.5 : 1.5}"/>`);
  }

  for (let n = 1; n <= 12; n++) {
    const rad = toRad(n * 30 - 90);
    const nx = (cx + numberR * Math.cos(rad)).toFixed(2);
    const ny = (cy + numberR * Math.sin(rad)).toFixed(2);
    parts.push(`<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${numFont}" font-weight="bold" fill="#000000">${n}</text>`);
  }

  if (minuteRing) {
    // Outer ring at radius slightly outside the face — sits in the padding
    // we reserved by raising `pad` above. Twelve labels at the major-tick
    // positions (every 5 minutes), in the minute colour to reinforce the
    // colour mapping with the minute hand.
    const ringR = r + Math.round((sizePx * 0.13 - 26) * 0.55);
    const ringFont = Math.round(r * 0.13);
    for (let n = 0; n < 12; n++) {
      const minutes = n * 5;
      const label = `:${String(minutes).padStart(2, '0')}`;
      const rad = toRad(n * 30 - 90);
      const lx = (cx + ringR * Math.cos(rad)).toFixed(2);
      const ly = (cy + ringR * Math.sin(rad)).toFixed(2);
      parts.push(`<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${ringFont}" font-weight="bold" fill="${MIN_COLOUR}">${label}</text>`);
    }
  }

  if (hands && time) {
    const [hStr, mStr] = String(time).split(':');
    const h = parseInt(hStr, 10) % 12;
    const m = parseInt(mStr, 10);

    const minHandColour  = colourCoded ? MIN_COLOUR  : '#000000';
    const hourHandColour = colourCoded ? HOUR_COLOUR : '#000000';
    const minHandWidth   = colourCoded ? 5 : 3;
    const hourHandWidth  = colourCoded ? 9 : 6;

    const minRad = toRad(m * 6 - 90);
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${(cx + minuteLen * Math.cos(minRad)).toFixed(2)}" y2="${(cy + minuteLen * Math.sin(minRad)).toFixed(2)}" stroke="${minHandColour}" stroke-width="${minHandWidth}" stroke-linecap="round"/>`);

    const hourRad = toRad(h * 30 + m * 0.5 - 90);
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${(cx + hourLen * Math.cos(hourRad)).toFixed(2)}" y2="${(cy + hourLen * Math.sin(hourRad)).toFixed(2)}" stroke="${hourHandColour}" stroke-width="${hourHandWidth}" stroke-linecap="round"/>`);
  }

  parts.push(`<circle cx="${cx}" cy="${cy}" r="5" fill="#000000"/>`);

  if (colourCoded && time && hands) {
    const [hStr, mStr] = String(time).split(':');
    const readoutY = clockArea + readoutH * 0.55;
    const readoutFont = Math.round(readoutH * 0.75);
    parts.push(
      `<text x="${cx}" y="${readoutY}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${readoutFont}" font-weight="bold">` +
      `<tspan fill="${HOUR_COLOUR}">${hStr}</tspan>` +
      `<tspan fill="#000000">:</tspan>` +
      `<tspan fill="${MIN_COLOUR}">${mStr}</tspan>` +
      `</text>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function clockKey(spec) {
  const hands = spec.hands === false ? 'blank' : (spec.time || 'blank');
  const colour = spec.colourCoded ? 'cc' : 'plain';
  const ring   = spec.minuteRing  ? 'ring' : 'noring';
  return `clock:${hands}:${colour}:${ring}`;
}

// ─── Fraction circle ───────────────────────────────────────────────────
// A pie-style circle divided into `denominator` equal slices, the first
// `numerator` of them filled in `colour`. Slices start at 12 o'clock so the
// shape reads naturally (the same orientation as the Twinkl FDP poster).
// `denominator` of 1 renders as a single fully-filled circle (whole). Slices
// always carry a black outline so empty wedges read as wedges, not as gaps.
function fractionCircleSvg(spec, sizePx = RENDER_PX) {
  const numerator = Number(spec.numerator) || 0;
  const denominator = Math.max(1, Number(spec.denominator) || 1);
  const colour = hashColour(spec.colour || 'EF4444');
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const pad = 26;
  const r = sizePx / 2 - pad;

  const parts = [];

  if (denominator === 1) {
    const fill = numerator >= 1 ? colour : '#FFFFFF';
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="#000000" stroke-width="3"/>`);
  } else {
    const sliceAngle = 360 / denominator;
    for (let i = 0; i < denominator; i++) {
      const startDeg = i * sliceAngle - 90;
      const endDeg = (i + 1) * sliceAngle - 90;
      const sRad = toRad(startDeg);
      const eRad = toRad(endDeg);
      const x1 = fmt(cx + r * Math.cos(sRad));
      const y1 = fmt(cy + r * Math.sin(sRad));
      const x2 = fmt(cx + r * Math.cos(eRad));
      const y2 = fmt(cy + r * Math.sin(eRad));
      const largeArc = sliceAngle > 180 ? 1 : 0;
      const fill = i < numerator ? colour : '#FFFFFF';
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      parts.push(`<path d="${path}" fill="${fill}" stroke="#000000" stroke-width="3"/>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function fractionCircleKey(spec) {
  const numerator = Number(spec.numerator) || 0;
  const denominator = Math.max(1, Number(spec.denominator) || 1);
  const colour = (spec.colour || 'EF4444').replace(/^#/, '');
  return `fractionCircle:${numerator}/${denominator}:${colour}`;
}

// ─── Number line ───────────────────────────────────────────────────────
// Horizontal line on a square canvas with major ticks at every `step` from
// `from` to `to`, and the value labelled below each tick. Optional `marks`
// place coloured dots above the line at specified positions, with optional
// labels above the dot. The line sits at vertical centre so the SVG stays
// square (matches every other primitive's aspect for the image transform).
// A number on the picture is written the way the card writes it in its text.
// A wall that says "Mark 2,500" beside a scale ticked "2500" is teaching the
// child to read two different things. Whole numbers only; a decimal scale keeps
// the plain form it already had.
function scaleLabel(n) {
  if (Math.abs(n - Math.round(n)) > 1e-6) return fmt(n);
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Arial bold runs about 0.58 of its point size per character across digits,
// commas and spaces. Used to ask whether two labels would meet, so it is
// deliberately a little generous.
const LABEL_CHAR_RATIO = 0.58;

// Jumps are the move along the spaces, in the board's focus blue; a highlighted
// space takes the house highlight orange every drawn figure points with. The
// meaning (which marks a jump joins, how overlapping jumps stack, the arc) comes
// from shared/visuals/number-line-jumps.js so the wall shows the board's jump.
const NL_JUMP_COLOUR = '#0070C0';
const escapeXml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NL_JUMP_TIER = 0.12;    // arc ceiling per tier, share of the canvas
const NL_JUMP_HEAD = 0.035;   // arrowhead length, share of the canvas
const NL_HIGHLIGHT_BAR = 0.022;

function numberLineDrawing(spec, sizePx = RENDER_PX) {
  const from = Number(spec.from) || 0;
  const to = Number(spec.to) || 10;
  const step = Math.max((to - from) / 100, Number(spec.step) || 1);
  const marks = Array.isArray(spec.marks) ? spec.marks : [];
  const dotColour = hashColour(spec.dotColour || 'EF4444');
  const w = sizePx;
  const h = sizePx;
  const padX = w * 0.08;
  const lineY = h / 2;
  const tickLen = h * 0.04;
  let numFont = Math.round(h * 0.06);
  const dotR = Math.round(h * 0.035);

  const range = to - from;
  if (range <= 0) {
    return { parts: [], top: 0, bottom: sizePx, sizePx };
  }
  const xFor = (v) => padX + ((v - from) / range) * (w - 2 * padX);

  const scaleLine = jumpsGeo.valueLine({ start: from, end: to, interval: step });
  const jumps = jumpsGeo.resolveJumps(spec, scaleLine);
  jumpsGeo.refuseCrowding(jumps, spec, ['marks'], 'this number line');
  const highlights = jumpsGeo.resolveIntervalHighlight(spec, scaleLine);

  const parts = [];
  // Ink extents, so the wall can place the line by its real shape instead of
  // floating a thin strip in the middle of a square (see numberLineTight).
  let inkTop = lineY - tickLen;
  const inkBottom = lineY + tickLen + numFont * 1.4 + numFont * 0.35;
  parts.push(`<line x1="${fmt(padX)}" y1="${fmt(lineY)}" x2="${fmt(w - padX)}" y2="${fmt(lineY)}" stroke="#000000" stroke-width="4" stroke-linecap="round"/>`);
  highlights.forEach((hl) => {
    const x1 = xFor(from + hl.fromIndex * step);
    const x2 = xFor(from + hl.toIndex * step);
    parts.push(`<rect x="${fmt(x1)}" y="${fmt(lineY - tickLen)}" width="${fmt(x2 - x1)}" height="${fmt(tickLen * 2)}" fill="#${highlightRing}" fill-opacity="0.22"/>`);
    parts.push(`<rect x="${fmt(x1)}" y="${fmt(lineY - (h * NL_HIGHLIGHT_BAR) / 2)}" width="${fmt(x2 - x1)}" height="${fmt(h * NL_HIGHLIGHT_BAR)}" fill="#${highlightRing}"/>`);
  });

  // Major ticks at each step value. Separators make the labels wider than they
  // used to be, so the tick type steps down until neighbours clear each other
  // rather than letting a long scale run its numbers together.
  const tickValues = [];
  for (let v = from; v <= to + 1e-6; v += step) tickValues.push(v);
  const tickLabels = tickValues.map(scaleLabel);
  const widestTick = tickLabels.reduce((n, s) => Math.max(n, s.length), 0);
  const tickGap = tickValues.length > 1 ? (w - 2 * padX) / (tickValues.length - 1) : w;
  while (numFont > 10 && widestTick * numFont * LABEL_CHAR_RATIO > tickGap * 0.95) numFont -= 1;

  tickValues.forEach((v, i) => {
    const x = xFor(v);
    parts.push(`<line x1="${fmt(x)}" y1="${fmt(lineY - tickLen)}" x2="${fmt(x)}" y2="${fmt(lineY + tickLen)}" stroke="#000000" stroke-width="3"/>`);
    parts.push(`<text x="${fmt(x)}" y="${fmt(lineY + tickLen + numFont * 1.4)}" text-anchor="middle" font-family="Arial" font-size="${numFont}" font-weight="bold" fill="#000000">${tickLabels[i]}</text>`);
  });

  if (jumps.length) {
    const labelled = jumps.some((j) => j.label || j.box);
    const labelH = labelled ? numFont * 1.3 : 0;
    const tierH = h * NL_JUMP_TIER;
    const baseY = lineY - tickLen - 4;
    let jumpFont = numFont;
    jumps.forEach((j) => {
      if (!j.label) return;
      const span = Math.abs(j.toIndex - j.fromIndex) * tickGap * 0.85;
      const need = j.label.length * numFont * LABEL_CHAR_RATIO;
      if (need > span) jumpFont = Math.min(jumpFont, (numFont * span) / need);
    });
    if (jumpFont < 10) {
      throw new Error('NUMBERLINE_JUMP_LABELS_CROWDED: the jump labels cannot sit over their spaces at a readable size on this card. Label one jump and let the card text say the rest.');
    }
    jumps.forEach((j) => {
      const x1 = xFor(from + j.fromIndex * step);
      const x2 = xFor(from + j.toIndex * step);
      const geo = jumpsGeo.arcGeometry(x1, x2, baseY, jumpsGeo.arcHeight(j, x2 - x1, tierH, labelH), h * NL_JUMP_HEAD);
      parts.push(`<polyline points="${geo.points.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ')}" fill="none" stroke="${NL_JUMP_COLOUR}" stroke-width="4" stroke-linecap="round"/>`);
      parts.push(`<polygon points="${geo.head.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ')}" fill="${NL_JUMP_COLOUR}"/>`);
      inkTop = Math.min(inkTop, geo.apex.y - labelH - 4);
      if (j.label) {
        parts.push(`<text x="${fmt(geo.apex.x)}" y="${fmt(geo.apex.y - 6)}" text-anchor="middle" font-family="Arial" font-size="${fmt(jumpFont)}" font-weight="bold" fill="${NL_JUMP_COLOUR}">${escapeXml(j.label)}</text>`);
      } else if (j.box) {
        const bw = Math.min(numFont * 3, Math.abs(x2 - x1) - 6);
        parts.push(`<rect x="${fmt(geo.apex.x - bw / 2)}" y="${fmt(geo.apex.y - labelH - 2)}" width="${fmt(bw)}" height="${fmt(labelH)}" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>`);
      }
    });
  }

  // Marks: coloured dots above the line, optional label above the dot.
  //
  // Every label used to be centred on its own dot at the same height with
  // nothing checking whether two of them met. Two marks 500 apart on a
  // 2,000-to-4,000 line printed as "3,000A = 3,500". Walk them left to right and
  // lift a label onto the row above when it would run into one already there,
  // so the only labels that move are the ones that would have collided.
  const rows = [];
  const ordered = marks
    .filter((m) => m != null && m.at != null)
    .map((m) => ({ label: m.label, x: xFor(Number(m.at)) }))
    .sort((a, b) => a.x - b.x);

  for (const m of ordered) {
    parts.push(`<circle cx="${fmt(m.x)}" cy="${fmt(lineY)}" r="${dotR}" fill="${dotColour}" stroke="#000000" stroke-width="2"/>`);
    inkTop = Math.min(inkTop, lineY - dotR - 2);
    if (!m.label) continue;
    const half = (String(m.label).length * numFont * LABEL_CHAR_RATIO) / 2;
    const left = m.x - half;
    const right = m.x + half;
    let row = 0;
    while (rows.some((p) => p.row === row && left < p.right && right > p.left)) row += 1;
    rows.push({ row, left, right });
    const y = lineY - dotR - 8 - row * numFont * 1.25;
    inkTop = Math.min(inkTop, y - numFont);
    parts.push(`<text x="${fmt(m.x)}" y="${fmt(y)}" text-anchor="middle" font-family="Arial" font-size="${numFont}" font-weight="bold" fill="#000000">${m.label}</text>`);
  }

  return { parts, top: inkTop, bottom: inkBottom, sizePx };
}

function numberLineSvg(spec, sizePx = RENDER_PX) {
  const d = numberLineDrawing(spec, sizePx);
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${d.parts.join('')}</svg>`;
}

// A number line is a wide, thin thing. Drawn on the square canvas it printed as
// a strip across the middle of a big empty square on a Year 4 wall card, with
// its numerals a fraction of the size the card had room for. Cropped to its own
// ink, the card places it by its true shape and it grows to fill the width.
function numberLineTight(spec) {
  const d = numberLineDrawing(spec, RENDER_PX);
  const pad = 6;
  const top = Math.max(0, d.top - pad);
  const height = Math.min(d.sizePx, d.bottom + pad) - top;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${d.sizePx}" height="${fmt(height)}" viewBox="0 ${fmt(top)} ${d.sizePx} ${fmt(height)}">${d.parts.join('')}</svg>`;
  return { svg, aspect: d.sizePx / height };
}

function numberLineKey(spec) {
  const from = Number(spec.from) || 0;
  const to = Number(spec.to) || 10;
  const step = Number(spec.step) || 1;
  const marks = Array.isArray(spec.marks) ? spec.marks : [];
  const marksKey = marks.map((m) => `${m && m.at != null ? m.at : ''}:${m && m.label ? m.label : ''}`).join(',');
  const dotColour = (spec.dotColour || 'EF4444').replace(/^#/, '');
  // Jumps and highlight change the picture, so they are part of its identity;
  // without them two cards with different jumps would share one cached drawing.
  const extra = spec.jumps || spec.highlight
    ? `:j${JSON.stringify(spec.jumps || [])}:h${JSON.stringify(spec.highlight || null)}`
    : '';
  return `numberLine:${from}-${to}:s${step}:[${marksKey}]:${dotColour}${extra}`;
}

// ─── Angle fan ─────────────────────────────────────────────────────────
// Two rays meeting at a vertex, with the angle between them filled as a
// coloured sector and the degree value labelled inside. The first ray points
// right; the second ray rotates counter-clockwise by `degrees`. Vertex sits
// in the lower-left third so the angle has room to open up and to the right.
// Renders cleanly for 1°–359°. Reflex angles (>180°) use the large-arc flag
// so the sector wraps the long way round.
function angleFanSvg(spec, sizePx = RENDER_PX) {
  const degrees = Math.max(1, Math.min(359, Number(spec.degrees) || 90));
  const colour = hashColour(spec.colour || 'FBBF24');
  const cx = sizePx * 0.32;
  const cy = sizePx * 0.68;
  const rayLen = sizePx * 0.58;
  const arcR = rayLen * 0.32;

  const r1Rad = 0;                            // first ray: horizontal right
  const r2Rad = -toRad(degrees);              // second ray: CCW from right

  const r1x = cx + rayLen * Math.cos(r1Rad);
  const r1y = cy + rayLen * Math.sin(r1Rad);
  const r2x = cx + rayLen * Math.cos(r2Rad);
  const r2y = cy + rayLen * Math.sin(r2Rad);

  const a1x = cx + arcR * Math.cos(r1Rad);
  const a1y = cy + arcR * Math.sin(r1Rad);
  const a2x = cx + arcR * Math.cos(r2Rad);
  const a2y = cy + arcR * Math.sin(r2Rad);
  const largeArc = degrees > 180 ? 1 : 0;
  const sweep = 0;                            // CCW in math space (= visually opens upward)

  const sector = `M ${fmt(cx)} ${fmt(cy)} L ${fmt(a1x)} ${fmt(a1y)} A ${fmt(arcR)} ${fmt(arcR)} 0 ${largeArc} ${sweep} ${fmt(a2x)} ${fmt(a2y)} Z`;

  // Label sits inside the angle, on the bisector at 1.4× the arc radius —
  // close enough to read as part of the angle, far enough to not overlap the
  // vertex marker.
  const midRad = -toRad(degrees / 2);
  const labelR = arcR * 1.55;
  const labelX = cx + labelR * Math.cos(midRad);
  const labelY = cy + labelR * Math.sin(midRad);
  const fontSize = Math.round(sizePx * 0.085);

  const parts = [];
  parts.push(`<path d="${sector}" fill="${colour}" stroke="none"/>`);
  parts.push(`<line x1="${fmt(cx)}" y1="${fmt(cy)}" x2="${fmt(r1x)}" y2="${fmt(r1y)}" stroke="#000000" stroke-width="5" stroke-linecap="round"/>`);
  parts.push(`<line x1="${fmt(cx)}" y1="${fmt(cy)}" x2="${fmt(r2x)}" y2="${fmt(r2y)}" stroke="#000000" stroke-width="5" stroke-linecap="round"/>`);
  parts.push(`<text x="${fmt(labelX)}" y="${fmt(labelY)}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${fontSize}" font-weight="bold" fill="#000000">${degrees}°</text>`);

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function angleFanKey(spec) {
  const degrees = Math.max(1, Math.min(359, Number(spec.degrees) || 90));
  const colour = (spec.colour || 'FBBF24').replace(/^#/, '');
  return `angleFan:${degrees}:${colour}`;
}

// ─── Turn diagram ───────────────────────────────────────────────────────
// Mirrors lesson-resources/builder/src/content/turn-diagram.js so a wall turn
// picture looks identical to the slide one: two black rays from a vertex (the
// start ray points up), with a red curved arrow showing a quarter/half/
// three-quarter/full turn, clockwise or anticlockwise. Use this — not angleFan —
// when the lesson teaches angle-as-turn, because the red rotation arrow is the
// visual that fights the "angle = distance" misconception.
const TURN_AMOUNT_QUARTERS = {
  quarter: 1, half: 2,
  'three-quarter': 3, 'three-quarters': 3, threequarter: 3,
  full: 4, whole: 4,
};

function resolveTurn(spec) {
  let quarters = Number(spec.quarters);
  if (!Number.isFinite(quarters) || quarters <= 0) {
    const word = String(spec.amount || '').trim().toLowerCase().replace(/\s+/g, '-');
    quarters = TURN_AMOUNT_QUARTERS[word] || 1;
  }
  const direction = spec.direction === 'anticlockwise' ? 'anticlockwise' : 'clockwise';
  return { quarters, direction };
}

function turnDiagramSvg(spec, sizePx = RENDER_PX) {
  const { quarters, direction } = resolveTurn(spec);
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const pad = sizePx * 0.14;
  const R = sizePx / 2 - pad;
  const arcR = R * 0.52;
  const ah = sizePx * 0.075;
  const rayW = sizePx * 0.013;
  const arcW = sizePx * 0.016;
  const dotR = sizePx * 0.02;

  const START_ANGLE = -90;          // start ray points straight up
  const FULL_CAP_DEG = 350;         // a full turn draws just short of 360 so its arrow shows
  const dir = direction === 'clockwise' ? 1 : -1;
  const sweepDeg = quarters * 90;
  const arcSweepDeg = Math.min(sweepDeg, FULL_CAP_DEG);
  const endRayAngle = START_ANGLE + dir * sweepDeg;
  const arcEndAngle = START_ANGLE + dir * arcSweepDeg;

  const pt = (angle, radius) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  const startTip = pt(START_ANGLE, R);
  const endTip = pt(endRayAngle, R);
  const arcStart = pt(START_ANGLE, arcR);
  const arcEnd = pt(arcEndAngle, arcR);
  const sweepFlag = dir > 0 ? 1 : 0;
  const largeArcFlag = arcSweepDeg > 180 ? 1 : 0;

  const RAY_COLOUR = '#000000';
  const ARC_COLOUR = '#C00000';
  const marker = (id, colour) =>
    `<marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="${fmt(ah)}" markerHeight="${fmt(ah)}" refX="${fmt(ah)}" refY="${fmt(ah / 2)}" orient="auto">` +
    `<path d="M0,0 L${fmt(ah)},${fmt(ah / 2)} L0,${fmt(ah)} Z" fill="${colour}"/></marker>`;

  const parts = [];
  parts.push(`<defs>${marker('wwTbk', RAY_COLOUR)}${marker('wwTrd', ARC_COLOUR)}</defs>`);
  parts.push(`<line x1="${fmt(cx)}" y1="${fmt(cy)}" x2="${fmt(startTip.x)}" y2="${fmt(startTip.y)}" stroke="${RAY_COLOUR}" stroke-width="${fmt(rayW)}" stroke-linecap="round" marker-end="url(#wwTbk)"/>`);
  parts.push(`<line x1="${fmt(cx)}" y1="${fmt(cy)}" x2="${fmt(endTip.x)}" y2="${fmt(endTip.y)}" stroke="${RAY_COLOUR}" stroke-width="${fmt(rayW)}" stroke-linecap="round" marker-end="url(#wwTbk)"/>`);
  parts.push(`<path d="M ${fmt(arcStart.x)} ${fmt(arcStart.y)} A ${fmt(arcR)} ${fmt(arcR)} 0 ${largeArcFlag} ${sweepFlag} ${fmt(arcEnd.x)} ${fmt(arcEnd.y)}" fill="none" stroke="${ARC_COLOUR}" stroke-width="${fmt(arcW)}" stroke-linecap="round" marker-end="url(#wwTrd)"/>`);
  parts.push(`<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(dotR)}" fill="${RAY_COLOUR}"/>`);

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function turnDiagramKey(spec) {
  const { quarters, direction } = resolveTurn(spec);
  return `turnDiagram:${quarters}:${direction}`;
}

// ─── Fraction bar ──────────────────────────────────────────────────────
// A horizontal rectangle divided into `denominator` equal vertical strips,
// the first `numerator` of them filled. Singapore-style bar model. Sits at
// vertical centre on a square canvas (whitespace above/below) so the
// image transform stays square — same approach as the number line.
function fractionBarSvg(spec, sizePx = RENDER_PX) {
  const numerator = Number(spec.numerator) || 0;
  const denominator = Math.max(1, Number(spec.denominator) || 1);
  const colour = hashColour(spec.colour || 'EF4444');
  const w = sizePx;
  const h = sizePx;
  const barW = w * 0.84;
  const barH = h * 0.30;
  const x0 = (w - barW) / 2;
  const y0 = (h - barH) / 2;
  const sliceW = barW / denominator;

  const parts = [];
  for (let i = 0; i < denominator; i++) {
    const sx = x0 + i * sliceW;
    const fill = i < numerator ? colour : '#FFFFFF';
    parts.push(`<rect x="${fmt(sx)}" y="${fmt(y0)}" width="${fmt(sliceW)}" height="${fmt(barH)}" fill="${fill}" stroke="#000000" stroke-width="3"/>`);
  }
  // Heavier outer outline so the bar reads as one shape, not as separate cells.
  parts.push(`<rect x="${fmt(x0)}" y="${fmt(y0)}" width="${fmt(barW)}" height="${fmt(barH)}" fill="none" stroke="#000000" stroke-width="4"/>`);

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function fractionBarKey(spec) {
  const numerator = Number(spec.numerator) || 0;
  const denominator = Math.max(1, Number(spec.denominator) || 1);
  const colour = (spec.colour || 'EF4444').replace(/^#/, '');
  return `fractionBar:${numerator}/${denominator}:${colour}`;
}

// ─── Comparison symbol ─────────────────────────────────────────────────
// A bold > / < / = symbol, optionally flanked by `left` and `right` values
// (e.g. "5 > 3"). With both values present the symbol sits in the middle
// between them; without, the symbol fills the canvas. Used for ordering and
// comparison LOs.
function comparisonSymbolSvg(spec, sizePx = RENDER_PX) {
  const symbol = String(spec.symbol || '>').slice(0, 2);
  const left = spec.left != null ? String(spec.left) : null;
  const right = spec.right != null ? String(spec.right) : null;
  const colour = hashColour(spec.colour || '1F4E79');
  const w = sizePx;
  const h = sizePx;

  const parts = [];
  if (left !== null && right !== null) {
    const valueFont = Math.round(h * 0.32);
    const symbolFont = Math.round(h * 0.40);
    parts.push(`<text x="${fmt(w * 0.20)}" y="${fmt(h / 2)}" text-anchor="middle" dominant-baseline="central" font-family="Arial Black, Arial, sans-serif" font-size="${valueFont}" font-weight="900" fill="#000000">${left}</text>`);
    parts.push(`<text x="${fmt(w * 0.50)}" y="${fmt(h / 2)}" text-anchor="middle" dominant-baseline="central" font-family="Arial Black, Arial, sans-serif" font-size="${symbolFont}" font-weight="900" fill="${colour}">${symbol}</text>`);
    parts.push(`<text x="${fmt(w * 0.80)}" y="${fmt(h / 2)}" text-anchor="middle" dominant-baseline="central" font-family="Arial Black, Arial, sans-serif" font-size="${valueFont}" font-weight="900" fill="#000000">${right}</text>`);
  } else {
    const bigFont = Math.round(h * 0.55);
    parts.push(`<text x="${fmt(w / 2)}" y="${fmt(h / 2)}" text-anchor="middle" dominant-baseline="central" font-family="Arial Black, Arial, sans-serif" font-size="${bigFont}" font-weight="900" fill="${colour}">${symbol}</text>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function comparisonSymbolKey(spec) {
  const symbol = String(spec.symbol || '>').slice(0, 2);
  const left = spec.left != null ? String(spec.left) : '';
  const right = spec.right != null ? String(spec.right) : '';
  const colour = (spec.colour || '1F4E79').replace(/^#/, '');
  return `comparisonSymbol:${symbol}:${left}:${right}:${colour}`;
}

// ─── Triangle-square part-whole puzzle ─────────────────────────────────
// SATs-style "the two triangles add up to the number in the square" model.
// Two upward-pointing triangles stacked on the LEFT, each with a number low
// in its body; connector lines run right to a SQUARE at the vertical midpoint
// between them, an arrowhead pointing INTO the square. Exactly one of the
// three shapes is left "" (blank) — the unknown a child reads off the wall.
// Mirrors the triangle-square drawing so the
// wall version matches the worksheet version. Laid out at its natural wide
// aspect and vertically centred on the square canvas (whitespace above/below),
// same approach as the number line and fraction bar.
function triangleSquareSvg(spec, sizePx = RENDER_PX) {
  const triangles = Array.isArray(spec.triangles) ? spec.triangles : ['', ''];
  const squareText = spec.square != null ? String(spec.square) : '';
  const upperText = triangles[0] != null ? String(triangles[0]) : '';
  const lowerText = triangles[1] != null ? String(triangles[1]) : '';

  // Diagram geometry in its own units, then scaled to fit the canvas width.
  // The triangle base widens with the longest number so multi-digit SATs
  // values (e.g. "2453", "4200") sit comfortably inside the body rather than
  // spilling over the sloped sides. The number is placed low (72% down from
  // the apex) where the triangle is at its widest.
  const NUM_Y_FRAC = 0.72;        // vertical position of the number, apex = 0
  const maxDigits = Math.max(1, upperText.length, lowerText.length, squareText.length);
  const TRI_H = 96, TRI_GAP = 28, H_GAP = 70, PAD = 10;
  const STROKE_W = 5;             // matches the wall's heavier line weight
  const NUM_FONT = 38;

  // Interior width available to the number at NUM_Y_FRAC is NUM_Y_FRAC * TRI_W.
  // Size the base so the number (chars * font * ~0.62) fits within ~80% of it,
  // with a sensible floor for the common single/double-digit case.
  const CHAR_W = 0.62;
  const neededInterior = (maxDigits * NUM_FONT * CHAR_W) / 0.80;
  const TRI_W = Math.max(110, Math.ceil(neededInterior / NUM_Y_FRAC));
  // Square scales to roughly match the triangle width so it holds its number too.
  const SQ = Math.max(84, Math.ceil((maxDigits * NUM_FONT * CHAR_W) / 0.80) + 24);

  const triLeftX = PAD;
  const upperTop = PAD;
  const lowerTop = upperTop + TRI_H + TRI_GAP;
  const midY = (upperTop + lowerTop + TRI_H) / 2;
  const sqX = triLeftX + TRI_W + H_GAP;
  const sqY = midY - SQ / 2;

  const diagramW = sqX + SQ + PAD;
  const diagramH = lowerTop + TRI_H + PAD;

  // Fit the wide diagram inside the square canvas and centre it.
  const scale = Math.min(sizePx / diagramW, sizePx / diagramH);
  const offX = (sizePx - diagramW * scale) / 2;
  const offY = (sizePx - diagramH * scale) / 2;
  const X = (x) => fmt(offX + x * scale);
  const Y = (y) => fmt(offY + y * scale);
  const F = (n) => Math.round(n * scale);

  const parts = [];

  // Apex-at-top triangle with the number low in its body.
  function triangle(topY, text) {
    const ax = triLeftX + TRI_W / 2, ay = topY;            // apex
    const blx = triLeftX, bly = topY + TRI_H;              // bottom-left
    const brx = triLeftX + TRI_W, bry = topY + TRI_H;      // bottom-right
    parts.push(`<polygon points="${X(ax)},${Y(ay)} ${X(brx)},${Y(bry)} ${X(blx)},${Y(bly)}" fill="white" stroke="#000000" stroke-width="${F(STROKE_W)}" stroke-linejoin="round"/>`);
    if (text !== '') {
      parts.push(`<text x="${X(triLeftX + TRI_W / 2)}" y="${Y(topY + TRI_H * NUM_Y_FRAC)}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${F(NUM_FONT)}" font-weight="bold" fill="#000000">${text}</text>`);
    }
    // Connector springs from the triangle's right edge at its vertical mid.
    return [triLeftX + TRI_W * 0.78, topY + TRI_H * 0.6];
  }

  const upper = triangle(upperTop, upperText);
  const lower = triangle(lowerTop, lowerText);

  // Connector lines meet at the square's left-edge midpoint.
  const sqMidX = sqX, sqMidY = midY;
  parts.push(`<line x1="${X(upper[0])}" y1="${Y(upper[1])}" x2="${X(sqMidX)}" y2="${Y(sqMidY)}" stroke="#000000" stroke-width="${F(STROKE_W)}"/>`);
  parts.push(`<line x1="${X(lower[0])}" y1="${Y(lower[1])}" x2="${X(sqMidX)}" y2="${Y(sqMidY)}" stroke="#000000" stroke-width="${F(STROKE_W)}"/>`);

  // Arrowhead pointing INTO the square.
  const ah = 14;
  parts.push(`<polygon points="${X(sqMidX)},${Y(sqMidY)} ${X(sqMidX - ah)},${Y(sqMidY - ah * 0.7)} ${X(sqMidX - ah)},${Y(sqMidY + ah * 0.7)}" fill="#000000" stroke="none"/>`);

  // Square.
  parts.push(`<rect x="${X(sqX)}" y="${Y(sqY)}" width="${F(SQ)}" height="${F(SQ)}" fill="white" stroke="#000000" stroke-width="${F(STROKE_W)}"/>`);
  if (squareText !== '') {
    parts.push(`<text x="${X(sqX + SQ / 2)}" y="${Y(midY)}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${F(NUM_FONT)}" font-weight="bold" fill="#000000">${squareText}</text>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">${parts.join('')}</svg>`;
}

function triangleSquareKey(spec) {
  const triangles = Array.isArray(spec.triangles) ? spec.triangles : ['', ''];
  const upper = triangles[0] != null ? String(triangles[0]) : '';
  const lower = triangles[1] != null ? String(triangles[1]) : '';
  const square = spec.square != null ? String(spec.square) : '';
  return `triangleSquare:${upper}:${lower}:${square}`;
}

// ─── Step badge (green numbered oval, white digit) ──────────────────────
// Mirrors slide builder's drawSteps badge — green oval, white centred digit
// in a heavy bold sans face. Rendered crisp at any wall card size.
function badgeSvg(number, sizePx = BADGE_PX, fillColour = '00B050') {
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const r  = sizePx / 2 - 4;
  const fontSize = Math.round(sizePx * 0.55);
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">`
    + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#${fillColour}"/>`
    + `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="#FFFFFF">${number}</text>`
    + `</svg>`;
}

function badgeKey(number, fillColour) {
  return `badge:${number}:${fillColour || '00B050'}`;
}

// ─── Annotated diagram (anatomy poster) ─────────────────────────────────
// A wall visual may carry a `callouts` array. When it does, the diagram is
// drawn first, then each callout points a leader line + arrowhead at a part of
// it and prints the part's name — the "parts of a pictogram" anatomy poster the
// teacher pins up so children read a diagram by recognising its parts. The
// overlay is the same shared geometry the slides and worksheets use, so the
// labelled wall version matches the board.
//
// A callout names where it points in one of two ways:
//   part   a named anchor the primitive exposes (a pictogram offers "title",
//          "key", "half", and each category label) — robust, because the
//          geometry resolves the exact pixel, so the arrow never drifts.
//   anchor a raw [x%, y%] of the diagram, for any primitive without named
//          anchors yet, or for a spot a named part doesn't cover.
// `label` is the printed name; `label_at` optionally places it; `given` defaults
// true because a wall reference card shows the finished labels, not blank lines.

// The suffix that distinguishes an annotated buffer from its plain base, so the
// pre-render and the card renderer agree on one storage key. Exported for
// render-card.js's pickVisual.
function calloutKeySuffix(visual) {
  return (visual && Array.isArray(visual.callouts) && visual.callouts.length)
    ? '|callouts:' + JSON.stringify(visual.callouts)
    : '';
}

// Resolve a named part to its [x%, y%] anchor. Top-level names (title, key,
// half) are checked first, then a category-row name, so "Monday" points at
// Monday's row. Returns null when the primitive exposes no anchor for that name.
function resolveAnchorPart(part, anchors) {
  if (!anchors || !part) return null;
  if (part === 'half-symbol') part = 'half';
  if (anchors[part] && Array.isArray(anchors[part])) return anchors[part];
  if (anchors.rows && anchors.rows[part]) return anchors.rows[part];
  return null;
}

// Turn the card's callouts into the overlay's callout shape, resolving named
// parts against the primitive's anchor map. Callouts whose anchor can't be
// resolved are dropped (rather than rendered in the wrong place), and the count
// is reported so a misnamed part surfaces in the build log instead of silently
// vanishing.
function resolveCallouts(callouts, anchors) {
  const out = [];
  let dropped = 0;
  for (const c of (callouts || [])) {
    let anchor = Array.isArray(c.anchor) ? c.anchor : resolveAnchorPart(c.part, anchors);
    if (!anchor) { dropped += 1; continue; }
    out.push({ anchor, label: c.label || '', label_at: c.label_at, given: c.given !== false });
  }
  return { callouts: out, dropped };
}

// Render a primitive, then overlay its callouts, returning { png, aspect } in the
// same shape the shared aspect-true primitives use so the card places it tight.
async function renderAnnotated(visual, prim, sharp) {
  let baseSvg, aspect, anchors = null;
  if (prim.tightFn) {
    const r = prim.tightFn(visual);
    baseSvg = r.svg; aspect = r.aspect; anchors = r.anchors || null;
  } else {
    baseSvg = prim.svgFn(visual, ANNOTATED_BASE_PX); aspect = 1;
  }

  const baseResize = aspect >= 1 ? { width: ANNOTATED_BASE_PX } : { height: ANNOTATED_BASE_PX };
  const basePng = await sharp(Buffer.from(baseSvg), { density: 144 }).resize(baseResize).png().toBuffer();
  const meta = await sharp(basePng).metadata();

  const { callouts, dropped } = resolveCallouts(visual.callouts, anchors);
  if (dropped > 0) {
    console.warn(
      `[working-wall] ${dropped} callout(s) on a "${visual.type}" anatomy poster could not be placed — ` +
      `name a part the primitive exposes (e.g. pictogram: title / key / half / a category label) or give a raw anchor [x%, y%].`
    );
  }

  const composed = buildLabelDiagramSvg({
    href: 'data:image/png;base64,' + basePng.toString('base64'),
    width: meta.width,
    height: meta.height,
    callouts,
    font: 'Comic Sans MS',
    // Side margins hold the stacked labels; keep them only as wide as the wrapped
    // labels need, so the chart itself stays large (the picture is the whole point
    // of a wall card, read from across the room). Slim top/bottom. Arrowheads green.
    marginXRatio: 0.20,
    marginYRatio: 0.02,
    layout: 'sides',
    labelMaxChars: 13,
    arrow: true,
    labelColour: WALL_LABEL_GREEN,
  });
  const resize = composed.aspect >= 1 ? { width: ANNOTATED_PX } : { height: ANNOTATED_PX };
  const png = await sharp(Buffer.from(composed.svg), { density: 144 }).resize(resize).png().toBuffer();
  return { png, aspect: composed.aspect };
}

// ─── Pre-render walker ──────────────────────────────────────────────────
// Walks the working-wall.json spec, collects every visual it finds and
// every numeric step badge it would need, renders the SVGs to PNG buffers via
// sharp, returns a map keyed by content.
//
// Failure policy: if any declared `visual` cannot render (sharp unavailable,
// SVG rendering errored), the build fails loudly. A wall card that promises
// a clock face but ships text-only is worse than no card at all — children
// glance from desk to wall expecting the picture and find a caption. Step
// badges are stylistic only (numbered green badges decorating worked-example
// steps) — they fall back silently to plain step labels if sharp is missing.
async function preRenderSvgs(spec) {
  const cards = Array.isArray(spec.cards) ? spec.cards : [];

  // Each visual type has its own (key → spec) collector and (key → buffer)
  // renderer. Adding a primitive = add an entry to PRIMITIVES below + an
  // entry to pickVisualBuffer in render-card.js.
  const PRIMITIVES = {
    clock:            { keyFn: clockKey,            svgFn: clockSvg,            collected: {} },
    fractionCircle:   { keyFn: fractionCircleKey,   svgFn: fractionCircleSvg,   collected: {} },
    fractionBar:      { keyFn: fractionBarKey,      svgFn: fractionBarSvg,      collected: {} },
    numberLine:       { keyFn: numberLineKey,       tightFn: numberLineTight,   collected: {} },
    angleFan:         { keyFn: angleFanKey,         svgFn: angleFanSvg,         collected: {} },
    'turn-diagram':   { keyFn: turnDiagramKey,      svgFn: turnDiagramSvg,      collected: {} },
    comparisonSymbol: { keyFn: comparisonSymbolKey, svgFn: comparisonSymbolSvg, collected: {} },
    'triangle-square': { keyFn: triangleSquareKey, svgFn: triangleSquareSvg, collected: {} },
    // Shared, aspect-true primitives: `tightFn` returns { svg, aspect } and the
    // pre-render stores both so the card can place the image at its real shape.
    'line-pair':      { keyFn: linePairShared.cacheKey, tightFn: linePairShared.tightSvg, collected: {} },
    angle:            { keyFn: angleShared.cacheKey,    tightFn: angleShared.tightSvg,    collected: {} },
    triangle:         { keyFn: triangleShared.cacheKey, tightFn: triangleShared.tightSvg, collected: {} },
    venn:             { keyFn: vennShared.cacheKey,     tightFn: vennShared.tightSvg,     collected: {} },
    carroll:          { keyFn: carrollShared.cacheKey,  tightFn: carrollShared.tightSvg,  collected: {} },
    geoboard:         { keyFn: geoboardShared.cacheKey, tightFn: geoboardShared.tightSvg, collected: {} },
    'reflection-grid': { keyFn: reflectionGridShared.cacheKey, tightFn: reflectionGridShared.tightSvg, collected: {} },
    'coordinate-grid': { keyFn: coordinateGridShared.cacheKey, tightFn: coordinateGridShared.tightSvg, collected: {} },
    'translation-shape': { keyFn: translationShapeShared.cacheKey, tightFn: translationShapeShared.tightSvg, collected: {} },
    'tally-chart':    { keyFn: tallyChartShared.cacheKey, tightFn: tallyChartShared.tightSvg, collected: {} },
    pictogram:        { keyFn: pictogramShared.cacheKey, tightFn: pictogramShared.tightSvg, collected: {} },
    'bar-chart':      { keyFn: barChartShared.cacheKey, tightFn: barChartShared.tightSvg, collected: {} },
    'line-graph':     { keyFn: lineGraphShared.cacheKey, tightFn: lineGraphShared.tightSvg, collected: {} },
    'bar-model':      { keyFn: barModelShared.cacheKey, tightFn: barModelShared.tightSvg, collected: {} },
    'grid-map':       { keyFn: gridMapShared.cacheKey, tightFn: gridMapShared.tightSvg, collected: {} },
    'rainforest-layers': { keyFn: rainforestLayersShared.cacheKey, tightFn: rainforestLayersShared.tightSvg, collected: {} },
    'balanced-pattern-plate': { keyFn: balancedPatternPlateShared.cacheKey, tightFn: balancedPatternPlateShared.tightSvg, collected: {} },
    'place-value-chart': { keyFn: placeValueChartShared.cacheKey, tightFn: placeValueChartShared.tightSvg, collected: {} },
    'circuit-diagram': { keyFn: circuitShared.cacheKey, tightFn: circuitShared.tightSvg, collected: {} },
    'parachute-forces': { keyFn: parachuteForcesShared.cacheKey, tightFn: parachuteForcesShared.tightSvg, collected: {} },
  };

  const badges = new Set();
  let visualsDeclared = 0;
  // Visuals carrying callouts get a second, annotated render (diagram + labels)
  // stored under the base key plus the callout suffix.
  const annotated = {};

  const collectVisual = (visual) => {
    if (!visual) return;
    if (visual._educationalSvgBuffer) return;
    visualsDeclared += 1;
    if (!PRIMITIVES[visual.type]) {
      throw new Error(`[working-wall] visual type "${visual.type}" is not a supported primitive. Supported: ${Object.keys(PRIMITIVES).join(', ')}.`);
    }
    const prim = PRIMITIVES[visual.type];
    const key = prim.keyFn(visual);
    if (!prim.collected[key]) prim.collected[key] = visual;
    const suffix = calloutKeySuffix(visual);
    if (suffix && !annotated[key + suffix]) annotated[key + suffix] = visual;
  };

  for (const card of cards) {
    if (card && card.visual) collectVisual(card.visual);
    if (card && card.type === 'equivalenceGrid' && Array.isArray(card.rows)) {
      for (const row of card.rows) {
        if (row && row.visual) collectVisual(row.visual);
      }
    }
    if (card && card.type === 'referenceTable' && Array.isArray(card.rows)) {
      // A reference-table cell may be a diagram instead of text — collect those
      // so each category row can carry its defining picture (the Twinkl
      // "Types of …" poster shape).
      for (const row of card.rows) {
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          if (cell && typeof cell === 'object' && cell.visual) collectVisual(cell.visual);
        }
      }
    }
    if (card && card.type === 'workedExample' && Array.isArray(card.items)) {
      // Only items with a numeric step number get a green badge — the
      // worked-example item itself stays as a labelled paragraph with no
      // badge (it's the model, not a step).
      let stepIdx = 0;
      for (const item of card.items) {
        const label = (item.label || '').toLowerCase();
        if (label.startsWith('step') || /^\d+\b/.test(label)) {
          stepIdx += 1;
          badges.add(stepIdx);
        }
      }
    }
  }

  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    if (visualsDeclared > 0) {
      throw new Error(
        `[working-wall] sharp is not installed but ${visualsDeclared} card visual(s) were declared. ` +
        `Run \`npm install\` inside the working-wall-html folder so sharp is available, then rebuild. ` +
        `A wall card that promised a picture but shipped text-only fails the desk-glance test.`
      );
    }
    console.warn('[working-wall] sharp unavailable — step badges will render as plain labels (no card visuals were declared).');
    return {};
  }

  const map = {};

  for (const prim of Object.values(PRIMITIVES)) {
    for (const [key, primSpec] of Object.entries(prim.collected)) {
      try {
        if (prim.tightFn) {
          // Shared aspect-true primitive: render at its real proportions and
          // store { png, aspect } so the card places it tight (no square pad).
          const { svg, aspect } = prim.tightFn(primSpec);
          const resize = aspect >= 1 ? { width: RENDER_OUT_PX } : { height: RENDER_OUT_PX };
          // Density has to rise with the target: sharp rasterises the SVG at its
          // intrinsic size scaled by density and only then resizes, so leaving it
          // behind would upscale a small bitmap and cost the sharpness the bigger
          // target was for.
          const png = await sharp(Buffer.from(svg), { density: 144 * RENDER_SCALE })
            .resize(resize)
            .png()
            .toBuffer();
          map[key] = { png, aspect };
        } else {
          // The drawing is still authored on the 600-unit canvas; only the raster
          // it is baked into is larger.
          const svg = prim.svgFn(primSpec, RENDER_PX);
          map[key] = await sharp(Buffer.from(svg), { density: 72 * RENDER_SCALE })
            .resize({ width: RENDER_OUT_PX })
            .png()
            .toBuffer();
        }
      } catch (e) {
        throw new Error(`[working-wall] failed to render visual "${primSpec.type}" (${key}): ${e.message}`);
      }
    }
  }

  // Annotated composites (diagram + callouts). Rendered after the bases so the
  // same failure policy applies: a promised anatomy poster that can't render
  // fails the build loudly rather than shipping a card with no labels.
  for (const [akey, visual] of Object.entries(annotated)) {
    try {
      map[akey] = await renderAnnotated(visual, PRIMITIVES[visual.type], sharp);
    } catch (e) {
      throw new Error(`[working-wall] failed to render annotated visual "${visual.type}" (${akey}): ${e.message}`);
    }
  }

  for (const number of badges) {
    try {
      const svg = badgeSvg(number, BADGE_PX);
      map[badgeKey(number)] = await sharp(Buffer.from(svg), { density: 72 })
        .resize({ width: BADGE_PX })
        .png()
        .toBuffer();
    } catch (e) {
      // Step badges are stylistic — fall back silently to plain step labels.
    }
  }

  return map;
}

module.exports = {
  clockSvg,
  clockKey,
  fractionCircleSvg,
  fractionCircleKey,
  fractionBarSvg,
  fractionBarKey,
  numberLineSvg,
  numberLineTight,
  numberLineKey,
  angleFanSvg,
  angleFanKey,
  turnDiagramSvg,
  turnDiagramKey,
  comparisonSymbolSvg,
  comparisonSymbolKey,
  triangleSquareSvg,
  triangleSquareKey,
  linePairKey: linePairShared.cacheKey,
  angleKey: angleShared.cacheKey,
  triangleKey: triangleShared.cacheKey,
  vennKey: vennShared.cacheKey,
  carrollKey: carrollShared.cacheKey,
  geoboardKey: geoboardShared.cacheKey,
  reflectionGridKey: reflectionGridShared.cacheKey,
  coordinateGridKey: coordinateGridShared.cacheKey,
  translationShapeKey: translationShapeShared.cacheKey,
  tallyChartKey: tallyChartShared.cacheKey,
  pictogramKey: pictogramShared.cacheKey,
  barChartKey: barChartShared.cacheKey,
  lineGraphKey: lineGraphShared.cacheKey,
  barModelKey: barModelShared.cacheKey,
  gridMapKey: gridMapShared.cacheKey,
  rainforestLayersKey: rainforestLayersShared.cacheKey,
  balancedPatternPlateKey: balancedPatternPlateShared.cacheKey,
  balancedPatternPlateTightSvg: balancedPatternPlateShared.tightSvg,
  placeValueChartKey: placeValueChartShared.cacheKey,
  circuitDiagramKey: circuitShared.cacheKey,
  parachuteForcesKey: parachuteForcesShared.cacheKey,
  badgeSvg,
  badgeKey,
  calloutKeySuffix,
  preRenderSvgs,
};
