'use strict';

// SHARED pictogram geometry — the single source of truth for a UK primary
// pictogram: a chart where each row carries a category label and a series of
// symbols (filled circles), with a KEY below stating how many units one symbol
// stands for (e.g. "= 10 books"). A symbol drawn as a LEFT half-circle stands
// for HALF the key value — that half-symbol is the central Year 4 teaching
// point, and the misconception this helper makes visible (a child must read
// the half as "half of ten", not "one"). Children meet this picture on the
// board, on a worksheet, and on the working wall, so the geometry lives here
// once and every engine imports it.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the chart
//   cacheKey(spec) → string                  stable pre-render cache key
//
// House-blue circles, Comic Sans MS and the half-circle treatment keep the
// pictogram visually consistent across the board, paper and working wall.
//
// Spec:
//   title        optional heading above the chart (e.g. "Books borrowed").
//   categories   array of row-label strings.
//   values       array of numbers, one per category (same length).
//   key          { per, label } — `per` is how many units one full symbol
//                represents (e.g. 10 → one circle = 10); `label` is the unit
//                word shown in the key (e.g. "books"). Defaults: per 1, label "".

const highlight = require('./figure-highlight');

// ─── CONSTANTS (SVG user units; the chart is rescaled per engine by aspect) ──
const ICON_R      = 22;     // symbol (circle) radius
const ICON_GAP    = 12;     // horizontal gap between symbols in a row
const ROW_PAD_Y   = 18;     // vertical padding above+below the symbols in a row
const KEY_GAP     = 16;     // gap between the last data row and the key row

const TITLE_FS    = 38;     // chart title font size
const LABEL_FS    = 30;     // category-label font size
const KEY_FS      = 30;     // key-row text font size
const TITLE_GAP   = 16;     // gap below the title before the first row

const LABEL_PAD   = 18;     // left inset of the label + gap before the symbols
const KEY_TEXT_GAP = 16;    // gap between the key symbol and its "= N label" text

const ICON_FILL    = '#2E74B5';   // house blue
const ICON_STROKE  = '#1F4E79';   // house deep blue outline
const STROKE_W     = 2.2;         // symbol outline width
const TEXT_COLOUR  = '#000000';
const TITLE_COLOUR = '#1F4E79';   // house deep blue for the heading

const { INK_TONES, printsInInk } = require('./surface-profiles');

// The colours above, and what each becomes on the photocopied stick-in pack.
const COLOURS = { ICON_FILL: ICON_FILL, ICON_STROKE: ICON_STROKE, TEXT_COLOUR: TEXT_COLOUR, TITLE_COLOUR: TITLE_COLOUR };
const INK = { ICON_FILL: INK_TONES.mid, ICON_STROKE: INK_TONES.ink, TEXT_COLOUR: INK_TONES.ink, TITLE_COLOUR: INK_TONES.ink };

const CHAR_W      = 0.60;   // Comic-Sans-bold character-width estimate (× font size)
const MARGIN      = STROKE_W + 3;  // hair of margin so strokes aren't clipped
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function f(n) { return Number(n).toFixed(2); }

function textWidth(s, fs) {
  return String(s == null ? '' : s).length * fs * CHAR_W;
}

function escapeXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveKey(data) {
  const key = data && data.key ? data.key : {};
  const per = Number(key.per);
  return { per: Number.isFinite(per) && per > 0 ? per : 1, label: key.label || '' };
}

// How many full symbols and whether a trailing half-symbol is drawn. Only a
// remainder of ~0.5 draws a half (the Year 4 case); any other fractional
// remainder is left off, exactly as the worksheet renderer does — the chart
// only ever shows wholes and halves of the key.
function symbolsFor(value, per) {
  const n = Number(value) / per;
  const full = Math.max(0, Math.floor(n));
  const remainder = n - full;
  const half = remainder > 0.01 && Math.abs(remainder - 0.5) < 0.1;
  return { full, half, slots: full + (half ? 1 : 0) };
}

// `profile` is optional: the stick-in pack passes its own so this prints in
// ink. A symbol is a mid grey disc with a dark outline,
// so a half symbol is still plainly half of one.
function tightSvg(data, profile) {
  const C = printsInInk(profile) ? INK : COLOURS;
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const values = Array.isArray(data.values) ? data.values : [];
  // A pictogram's parts are its categories, named as the lesson names them.
  const marked = highlight.resolveHighlight(data, categories.map(String), 'pictogram');
  const title = data.title || '';
  const { per, label } = resolveKey(data);

  // ── Label column width: the longest category label plus padding either side.
  let labelTextW = 0;
  for (const c of categories) labelTextW = Math.max(labelTextW, textWidth(c, LABEL_FS));
  const labelColW = labelTextW + 2 * LABEL_PAD;

  const rowH = ICON_R * 2 + ROW_PAD_Y;
  const titleH = title ? TITLE_FS + TITLE_GAP : 0;
  const keyRowH = ICON_R * 2 + ROW_PAD_Y;

  // First symbol's centre x (shared by every row and the key row).
  const firstCx = labelColW + ICON_R;
  const stride = ICON_R * 2 + ICON_GAP;
  const rowRight = (slots) => (slots <= 0 ? labelColW : firstCx + (slots - 1) * stride + ICON_R);

  // ── Width: widest data row, the key row, and the title all compete. ──
  let contentRight = labelColW;
  const rows = categories.map((cat, i) => {
    const s = symbolsFor(values[i], per);
    contentRight = Math.max(contentRight, rowRight(s.slots));
    return s;
  });

  const keyText = `=  ${per} ${label}`.trim();
  const keyRight = firstCx + ICON_R + KEY_TEXT_GAP + textWidth(keyText, KEY_FS);
  contentRight = Math.max(contentRight, keyRight);

  const titleW = title ? textWidth(title, TITLE_FS) : 0;
  const contentW = Math.max(contentRight, titleW);
  const contentH = titleH + rows.length * rowH + KEY_GAP + keyRowH;

  const w = contentW + 2 * MARGIN;
  const h = contentH + 2 * MARGIN;
  const OX = MARGIN, OY = MARGIN;   // shift content in by the margin

  // Named anchor points, each as a percentage of (w, h), so an annotation
  // overlay can aim a callout at a meaningful part of the chart — the title,
  // the key, the half-symbol, or a named category's row — instead of the caller
  // guessing pixel positions by eye. Filled in as the chart is drawn below, and
  // returned alongside the SVG. The working wall reads these to build an
  // annotated "anatomy poster" reference card (the parts of a pictogram, each
  // labelled) via the shared label-diagram overlay.
  const pct = (x, y) => [Number((100 * x / w).toFixed(2)), Number((100 * y / h).toFixed(2))];
  const anchors = { title: null, key: null, half: null, rows: {} };

  const parts = [];

  // ── Title (centred over the full content width, house deep blue). ──
  if (title) {
    parts.push(`<text x="${f(OX + contentW / 2)}" y="${f(OY + TITLE_FS * 0.82)}" text-anchor="middle" font-family="Comic Sans MS" font-size="${TITLE_FS}" font-weight="bold" fill="${C.TITLE_COLOUR}">${escapeXml(title)}</text>`);
    anchors.title = pct(OX + contentW / 2, OY + TITLE_FS * 0.45);
  }

  function circle(cx, cy) {
    return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${ICON_R}" fill="${C.ICON_FILL}" stroke="${C.ICON_STROKE}" stroke-width="${STROKE_W}"/>`;
  }
  // A symbol standing for HALF the key: the LEFT semicircle is filled, the
  // right semicircle is drawn as an outline only — so the eye reads "half a
  // symbol", and the lesson reads "half of the key".
  function halfCircle(cx, cy) {
    const top = cy - ICON_R, bot = cy + ICON_R;
    return (
      `<path d="M ${f(cx)} ${f(top)} A ${ICON_R} ${ICON_R} 0 0 0 ${f(cx)} ${f(bot)} Z" fill="${C.ICON_FILL}" stroke="${C.ICON_STROKE}" stroke-width="${STROKE_W}"/>` +
      `<path d="M ${f(cx)} ${f(top)} A ${ICON_R} ${ICON_R} 0 0 1 ${f(cx)} ${f(bot)}" fill="none" stroke="${C.ICON_STROKE}" stroke-width="${STROKE_W}"/>`
    );
  }

  // ── Data rows. ──
  for (let i = 0; i < categories.length; i++) {
    const cy = OY + titleH + i * rowH + rowH / 2;
    parts.push(`<text x="${f(OX + labelColW - LABEL_PAD)}" y="${f(cy)}" text-anchor="end" dominant-baseline="central" font-family="Comic Sans MS" font-size="${LABEL_FS}" fill="${C.TEXT_COLOUR}">${escapeXml(categories[i])}</text>`);
    const { full, half } = rows[i];
    let cx = OX + firstCx;
    let lastCx = cx;
    for (let j = 0; j < full; j++) { parts.push(circle(cx, cy)); lastCx = cx; cx += stride; }
    if (half) { parts.push(halfCircle(cx, cy)); lastCx = cx; if (anchors.half == null) anchors.half = pct(cx, cy); }
    // The row's anchor sits on its last drawn symbol, so a "Monday = 30" callout
    // points at the data it reads off, not at the label column.
    anchors.rows[categories[i]] = pct(lastCx, cy);
  }

  // ── Key row: one full symbol followed by "= N label". ──
  const keyCy = OY + titleH + categories.length * rowH + KEY_GAP + keyRowH / 2;
  parts.push(circle(OX + firstCx, keyCy));
  parts.push(`<text x="${f(OX + firstCx + ICON_R + KEY_TEXT_GAP)}" y="${f(keyCy)}" text-anchor="start" dominant-baseline="central" font-family="Comic Sans MS" font-size="${KEY_FS}" fill="${C.TEXT_COLOUR}">${escapeXml(keyText)}</text>`);
  anchors.key = pct(OX + firstCx, keyCy);

  // Pointing at one category, drawn last so the veil covers that row's symbols
  // and the ring sits over everything. The key row is never faded: it is how the
  // symbols are read at all, so dimming it would make the lit row unreadable.
  if (marked.size) {
    for (let i = 0; i < categories.length; i++) {
      const key = String(categories[i]);
      const top = OY + titleH + i * rowH;
      const box = { x: OX, y: top, w: w - 2 * OX, h: rowH };
      const fade = highlight.opacityFor(marked, key);
      if (fade < 1) {
        parts.push(`<rect x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}" fill="#FFFFFF" fill-opacity="${(1 - fade).toFixed(2)}"/>`);
      }
      parts.push(highlight.ringSvg(marked, key, box, Math.max(w, h), C === INK));
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h, anchors };
}

function cacheKey(data) {
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const values = Array.isArray(data.values) ? data.values : [];
  const { per, label } = resolveKey(data);
  const hi = [...highlight.resolveHighlight(data, categories.map(String), 'pictogram')].sort().join(',');
  return `pictogram:${data.title || ''}:${categories.join(',')}:${values.join(',')}:${per}:${label}:${hi}`;
}

module.exports = { tightSvg, cacheKey };
