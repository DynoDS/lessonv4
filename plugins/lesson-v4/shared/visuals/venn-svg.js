'use strict';

// SHARED Venn-diagram geometry — the single source of truth for a two-circle
// sorting diagram inside a rectangular box (the "universe"). Each circle carries
// a property label; shapes can be placed in four regions: the LEFT circle only,
// the RIGHT circle only, the OVERLAP where the circles cross, and OUTSIDE both
// circles (but inside the box). Imported by every engine that draws it (currently
// the slide deck); it produces ONLY the SVG and its true aspect, so each engine
// places it tight (NO DEADSPACE) however it embeds images. The geometry is
// written once here.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the box's bounds
//   cacheKey(spec) → string                  stable pre-render cache key
//
// This helper draws the FRAME and POSITIONS labelled shape tokens in the right
// region — it does not redraw shape geometry. A placed shape is shown as a small
// rounded chip carrying its name, which makes the region placement unambiguous
// and readable from the back of the room. A blank Venn (no `shapes`) is the
// labelled frame children/teacher place into live.
//
// Spec:
//   label1   property label for the LEFT circle  (e.g. "has a right angle")
//   label2   property label for the RIGHT circle (e.g. "has 4 equal sides")
//   shapes   array of placed tokens (omit or [] for a BLANK diagram). Each is
//              { region, label }  where
//                region  one of "leftOnly" | "rightOnly" | "overlap" | "outside"
//                label   the shape's name shown in the chip (e.g. "Square")
//   showRegionHints  (default true) faint region words on a blank diagram so the
//              child sees that "outside" is a real place; suppressed once any
//              shape is placed (the chips themselves show the regions).

const highlight = require('./figure-highlight');

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ────
const BOX_W       = 1000;        // universe box width
const BOX_H       = 700;         // universe box height (top band holds one- or two-line labels)
const BOX_PAD     = 8;           // hair of margin so the box stroke isn't clipped
const BOX_STROKE  = 4;           // box outline width
const BOX_RX      = 14;          // box corner radius

const CIRCLE_R    = 250;         // each circle's radius
const CIRCLE_CY   = 390;         // circles' vertical centre (leaves a tall top band for labels)
const CIRCLE_SEP  = 300;         // distance between the two circle centres (< 2R so they overlap)
const CIRCLE_STROKE = 5;         // circle outline width

const LABEL_FONT     = 38;       // circle-label font ceiling
const LABEL_MIN_FONT = 27;       // floor a long label shrinks to before wrapping (kept legible from the back)
const LABEL_LINE_GAP = 1.12;     // line-height multiple when a label wraps to two lines
const LABEL_BAND_TOP = 8;        // top of the label band (within the box)
const LABEL_HALF_GAP = 44;       // clear gap kept either side of the box's centre line
const GLYPH_W        = 0.62;     // rough Comic Sans glyph width (× font size) for fit estimates
const HINT_FONT   = 30;          // faint region-hint font on a blank diagram

const CHIP_W      = 188;         // placed-shape chip width
const CHIP_H      = 70;          // placed-shape chip height
const CHIP_RX     = 14;          // chip corner radius
const CHIP_FONT   = 30;          // chip label font size
const CHIP_STROKE = 3;           // chip outline width
const CHIP_VGAP   = 12;          // vertical gap when several chips stack in one region

const BOX_COLOUR     = '#000000';   // universe box outline (black)
const CIRCLE_LEFT_C  = '#0070C0';   // left circle outline (house blue)
const CIRCLE_RIGHT_C = '#E46C0A';   // right circle outline (house orange)
const CIRCLE_FILL_L  = '#0070C0';   // left circle translucent fill
const CIRCLE_FILL_R  = '#E46C0A';   // right circle translucent fill
const CIRCLE_FILL_OP = 0.10;        // circle fill opacity (so the overlap reads darker)
const LABEL_LEFT_C   = '#0070C0';   // left label colour
const LABEL_RIGHT_C  = '#E46C0A';   // right label colour
const HINT_COLOUR    = '#888888';   // faint region hints
const CHIP_FILL      = '#FFFFFF';   // placed-chip background
const CHIP_STROKE_C  = '#00B050';   // placed-chip outline (house green)
const CHIP_TEXT_C    = '#000000';   // placed-chip text
// ─── END CONSTANTS ────────────────────────────────────────────────────────

const REGIONS = ['leftOnly', 'rightOnly', 'overlap', 'outside'];

// A Venn's parts are REGIONS, not boxes, so pointing at one fills it rather than
// ringing it: a rectangle drawn round the overlap encloses most of both circles
// and names the wrong thing. The fill is built from the circles themselves with
// a mask, so the shape shown is exactly the region, whatever the geometry.
const HIGHLIGHT_PARTS = [
  { key: 'leftOnly', aliases: ['left', 'left-only', 'only-left'] },
  { key: 'rightOnly', aliases: ['right', 'right-only', 'only-right'] },
  { key: 'overlap', aliases: ['both', 'middle', 'intersection'] },
  { key: 'outside', aliases: ['neither', 'outside-both'] }
];

// One region, as a shape to paint plus the mask that trims it to exactly that
// region. Every region is "this shape, minus the parts of it that belong to
// somebody else", which a mask says directly: white shows, black hides.
function regionFill(region, id, geom) {
  const { X, Y, cxL, cxR, cy, f } = geom;
  const circle = (cx, fill) => `<circle cx="${f(X(cx))}" cy="${f(Y(cy))}" r="${CIRCLE_R}" fill="${fill}"/>`;
  const box = (fill) => `<rect x="${f(X(0))}" y="${f(Y(0))}" width="${f(BOX_W)}" height="${f(BOX_H)}" rx="${BOX_RX}" fill="${fill}"/>`;

  let paint;
  let mask;
  if (region === 'overlap') {
    paint = circle(cxL, `#${highlight.RING}`);
    mask = circle(cxR, 'white');
  } else if (region === 'leftOnly') {
    paint = circle(cxL, `#${highlight.RING}`);
    mask = circle(cxL, 'white') + circle(cxR, 'black');
  } else if (region === 'rightOnly') {
    paint = circle(cxR, `#${highlight.RING}`);
    mask = circle(cxR, 'white') + circle(cxL, 'black');
  } else {
    paint = box(`#${highlight.RING}`);
    mask = box('white') + circle(cxL, 'black') + circle(cxR, 'black');
  }
  return {
    def: `<mask id="${id}">${mask}</mask>`,
    use: paint.replace('/>', ` mask="url(#${id})" fill-opacity="0.30"/>`)
  };
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Fit a circle label to the half-box width it sits over. A short label keeps the
// ceiling font on one line; a long one ("has at least one pair of parallel sides")
// wraps to two balanced lines and, only if it still overruns, rides the font floor
// — so a long criterion stays inside the box instead of being clipped past the edge,
// the same guarantee carroll-svg gives its labels.
function fitLabel(text) {
  const t = String(text == null ? '' : text).trim();
  const maxW = BOX_W / 2 - LABEL_HALF_GAP;     // horizontal room one label may use
  if (!t) return { lines: [''], font: LABEL_FONT };
  const oneLineFont = maxW / (t.length * GLYPH_W);
  if (oneLineFont >= LABEL_FONT) return { lines: [t], font: LABEL_FONT };

  const words = t.split(/\s+/);
  if (words.length === 1) {
    return { lines: [t], font: Math.max(LABEL_MIN_FONT, Math.min(LABEL_FONT, oneLineFont)) };
  }
  // Split into two lines at the point that minimises the longer line.
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const longer = Math.max(a.length, b.length);
    if (!best || longer < best.longer) best = { a: a, b: b, longer: longer };
  }
  const twoLineFont = Math.max(LABEL_MIN_FONT, Math.min(LABEL_FONT, maxW / (best.longer * GLYPH_W)));
  // Prefer one line when it fits no smaller than the wrapped version would.
  if (oneLineFont >= twoLineFont && oneLineFont >= LABEL_MIN_FONT) {
    return { lines: [t], font: Math.max(LABEL_MIN_FONT, Math.min(LABEL_FONT, oneLineFont)) };
  }
  return { lines: [best.a, best.b], font: twoLineFont };
}

// Normalise the spec's placed shapes into [{ region, label }], dropping anything
// without a valid region. A blank diagram resolves to [].
function resolveShapes(data) {
  const raw = Array.isArray(data.shapes) ? data.shapes : [];
  const out = [];
  raw.forEach(function (s) {
    if (!s || typeof s !== 'object') return;
    const region = REGIONS.indexOf(s.region) >= 0 ? s.region : null;
    if (!region) return;
    out.push({ region: region, label: String(s.label == null ? '' : s.label) });
  });
  return out;
}

function cacheKey(data) {
  const shapes = resolveShapes(data);
  const sk = shapes.map(function (s) { return s.region + ':' + s.label; }).join(';');
  const hints = (data.showRegionHints === false ? '0' : '1') +
    '|' + [...highlight.resolveHighlight(data, HIGHLIGHT_PARTS, 'Venn diagram')].sort().join(',');
  return 'venn:' + (data.label1 || '') + '|' + (data.label2 || '') + '|' + hints + '|' + sk;
}

// Centre points of the two circles in box space.
function circleCentres() {
  const cxL = BOX_W / 2 - CIRCLE_SEP / 2;
  const cxR = BOX_W / 2 + CIRCLE_SEP / 2;
  return { cxL: cxL, cxR: cxR, cy: CIRCLE_CY };
}

// The natural anchor point (chip-centre) for each region, plus the across-shift
// direction used when several chips stack vertically.
function regionAnchor(region) {
  const { cxL, cxR, cy } = circleCentres();
  const overlapCx = (cxL + cxR) / 2;
  switch (region) {
    case 'leftOnly':  return { x: cxL - CIRCLE_SEP * 0.42, y: cy };
    case 'rightOnly': return { x: cxR + CIRCLE_SEP * 0.42, y: cy };
    case 'overlap':   return { x: overlapCx, y: cy };
    case 'outside':   return { x: BOX_W - CHIP_W / 2 - 24, y: BOX_H - CHIP_H / 2 - 18 };
    default:          return { x: BOX_W / 2, y: cy };
  }
}

function tightSvg(data) {
  const shapes = resolveShapes(data);
  const marked = highlight.resolveHighlight(data, HIGHLIGHT_PARTS, 'Venn diagram');
  const showHints = data.showRegionHints !== false && shapes.length === 0;
  const { cxL, cxR, cy } = circleCentres();
  const f = function (n) { return Number(n).toFixed(2); };

  // The whole picture is the box plus a hair of margin — tight by construction,
  // no padded square, no centring-in-deadspace.
  const w = BOX_W + 2 * BOX_PAD;
  const h = BOX_H + 2 * BOX_PAD;
  const ox = BOX_PAD;   // box origin within the padded canvas
  const oy = BOX_PAD;
  const X = function (x) { return ox + x; };
  const Y = function (y) { return oy + y; };

  const parts = [];

  // Universe box.
  parts.push(`<rect x="${f(X(0))}" y="${f(Y(0))}" width="${f(BOX_W)}" height="${f(BOX_H)}" rx="${BOX_RX}" fill="#FFFFFF" stroke="${BOX_COLOUR}" stroke-width="${BOX_STROKE}"/>`);

  // Pointing at a region: painted under the circle outlines and the chips, so
  // the diagram still reads as a Venn with one region lit rather than as a
  // coloured blob with a Venn somewhere behind it.
  if (marked.size) {
    const geom = { X, Y, cxL, cxR, cy, f };
    const defs = [];
    const fills = [];
    [...marked].forEach(function (region, i) {
      const built = regionFill(region, 'venn-region-' + i, geom);
      defs.push(built.def);
      fills.push(built.use);
    });
    parts.push('<defs>' + defs.join('') + '</defs>');
    parts.push.apply(parts, fills);
  }

  // Translucent circle fills first (so the overlap reads as the two colours stacked).
  parts.push(`<circle cx="${f(X(cxL))}" cy="${f(Y(cy))}" r="${CIRCLE_R}" fill="${CIRCLE_FILL_L}" fill-opacity="${CIRCLE_FILL_OP}"/>`);
  parts.push(`<circle cx="${f(X(cxR))}" cy="${f(Y(cy))}" r="${CIRCLE_R}" fill="${CIRCLE_FILL_R}" fill-opacity="${CIRCLE_FILL_OP}"/>`);

  // Circle outlines.
  parts.push(`<circle cx="${f(X(cxL))}" cy="${f(Y(cy))}" r="${CIRCLE_R}" fill="none" stroke="${CIRCLE_LEFT_C}" stroke-width="${CIRCLE_STROKE}"/>`);
  parts.push(`<circle cx="${f(X(cxR))}" cy="${f(Y(cy))}" r="${CIRCLE_R}" fill="none" stroke="${CIRCLE_RIGHT_C}" stroke-width="${CIRCLE_STROKE}"/>`);

  // Circle labels — each sits in the box's top band over its circle's outer half,
  // fit to the half-box width (wrapping to two lines when long) so a long criterion
  // never spills past the box edge. Centred within its half so it stays clear of the
  // overlap and of the opposite label.
  const bandBottom = CIRCLE_CY - CIRCLE_R - 6;     // just above the circles
  const bandMid    = (LABEL_BAND_TOP + bandBottom) / 2;
  const halfMaxW   = BOX_W / 2 - LABEL_HALF_GAP;
  const leftCx     = halfMaxW / 2;                  // centred in the left half-band
  const rightCx    = BOX_W - halfMaxW / 2;          // centred in the right half-band
  const emitLabel = function (text, cx, colour) {
    const fit = fitLabel(text);
    const lineH = fit.font * LABEL_LINE_GAP;
    const firstY = bandMid - (fit.lines.length * lineH) / 2 + lineH / 2;
    fit.lines.forEach(function (ln, i) {
      parts.push(`<text x="${f(X(cx))}" y="${f(Y(firstY + i * lineH))}" font-family="Comic Sans MS, sans-serif" font-size="${f(fit.font)}" font-weight="bold" fill="${colour}" text-anchor="middle" dominant-baseline="middle">${esc(ln)}</text>`);
    });
  };
  emitLabel(data.label1 || '', leftCx, LABEL_LEFT_C);
  emitLabel(data.label2 || '', rightCx, LABEL_RIGHT_C);

  // Faint region hints on a blank diagram so a child sees the four places — in
  // particular that "outside" is a real region, the heart of the lesson.
  if (showHints) {
    const hint = function (region, txt) {
      const a = regionAnchor(region);
      parts.push(`<text x="${f(X(a.x))}" y="${f(Y(a.y))}" font-family="Comic Sans MS, sans-serif" font-size="${HINT_FONT}" fill="${HINT_COLOUR}" text-anchor="middle" dominant-baseline="middle">${esc(txt)}</text>`);
    };
    hint('overlap', 'both');
    hint('outside', 'neither');
  }

  // Placed shapes: rounded chips with the shape name, stacked vertically and
  // centred on each region's anchor when several share a region.
  if (shapes.length) {
    const byRegion = {};
    REGIONS.forEach(function (r) { byRegion[r] = []; });
    shapes.forEach(function (s) { byRegion[s.region].push(s); });

    REGIONS.forEach(function (region) {
      const list = byRegion[region];
      if (!list.length) return;
      const a = regionAnchor(region);
      const totalH = list.length * CHIP_H + (list.length - 1) * CHIP_VGAP;
      let chipTop = a.y - totalH / 2;
      list.forEach(function (s) {
        const cx = a.x;
        const top = chipTop;
        parts.push(`<rect x="${f(X(cx - CHIP_W / 2))}" y="${f(Y(top))}" width="${CHIP_W}" height="${CHIP_H}" rx="${CHIP_RX}" fill="${CHIP_FILL}" stroke="${CHIP_STROKE_C}" stroke-width="${CHIP_STROKE}"/>`);
        parts.push(`<text x="${f(X(cx))}" y="${f(Y(top + CHIP_H / 2))}" font-family="Comic Sans MS, sans-serif" font-size="${CHIP_FONT}" font-weight="bold" fill="${CHIP_TEXT_C}" text-anchor="middle" dominant-baseline="middle">${esc(s.label)}</text>`);
        chipTop += CHIP_H + CHIP_VGAP;
      });
    });
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

// Compact action cue for a Success Criteria row. The full diagram's labels and
// chips are essential at teaching size but collapse in a 0.68in slot, so this
// keeps only the shared universe/circle convention and marks the destination.
function regionCueSvg(data) {
  const region = data && data.region === 'outside' ? 'outside' : 'overlap';
  const w = 240, h = 160, r = 58, cy = 80, left = 94, right = 146;
  const dot = region === 'outside' ? { x: 214, y: 136 } : { x: 120, y: 80 };
  const parts = [
    `<rect x="3" y="3" width="234" height="154" rx="8" fill="#FFFFFF" stroke="${BOX_COLOUR}" stroke-width="6"/>`,
    `<circle cx="${left}" cy="${cy}" r="${r}" fill="${CIRCLE_FILL_L}" fill-opacity="${CIRCLE_FILL_OP}" stroke="${CIRCLE_LEFT_C}" stroke-width="6"/>`,
    `<circle cx="${right}" cy="${cy}" r="${r}" fill="${CIRCLE_FILL_R}" fill-opacity="${CIRCLE_FILL_OP}" stroke="${CIRCLE_RIGHT_C}" stroke-width="6"/>`,
    `<circle cx="${dot.x}" cy="${dot.y}" r="12" fill="#00B050" stroke="#006B32" stroke-width="4"/>`
  ];
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, regionCueSvg, cacheKey };
