'use strict';

// THE part-whole model. One drawing, placed by the board, the worksheet, the
// working wall and the stick-in pack.
//
// A whole joined by lines to its parts. It was two pictures of the one idea: the
// board drew circles (the whole on the left, parts stacked on the right, or the
// whole on top), and the sheet (`part-whole`, and `part-whole-money` before it)
// drew rounded boxes with the whole on top, orange given values, captions under
// the boxes, a "+" between parts and real-sized coins inside. A child who
// partitioned 6,731 in circles on the board met boxes on the sheet (13 September
// 2026). This is now the one model, in the board's circles, carrying everything
// either surface could say.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// ─── the spec (the board's spelling) ─────────────────────────────────────
//
//   whole        "45", or "?" for the unknown, or "" for an empty circle
//   parts        ["27", "18"]: two or more
//   orientation  "horizontal" (whole left, parts stacked right; the default) or
//                "vertical" (whole on top, parts spread below)
//
// Any node may instead be an object, the sheet's spelling, which also sets the
// orientation to vertical unless it is given:
//
//   { value: "6,731" }       a number handed to the child
//   { label: "Pounds" }      a word the child reads
//   { blank: true, blankChars: 4 }  a circle left empty to write in, sized for
//                            what goes in it (four digits unless told)
//   { caption: "Thousands" } a quiet name printed under the circle, OUTSIDE it,
//                            so it is never read as an answer already written in
//   { coins: ["£1", "20p"] } real coins inside the circle
//
//   joiner       an operator printed between parts ("+"); a partition of named
//                parts is joined by nothing, so it prints only what is asked
//   requireIntent  true (the sheet's `part-whole`): a node that is empty and not
//                marked blank is refused, because on paper a node left empty as
//                the question and one nobody decided about look identical
//
// ─── why the circles are sized the way they are ──────────────────────────
//
// A Year 4 slide teaching four-digit numbers put "3,000" in a 0.39in circle at a
// 10pt "minimum" that was never checked against the circle, and PowerPoint
// wrapped it to "3,00" over "0". The zone was 7.75in wide and 1.27in tall, so
// an upright model cut its circles from the height while eight inches of width
// sat unused. So every label is measured, a circle holds one line across its
// inscribed width, and a space that cannot seat a readable label is refused by
// name with the size it needs.

const fs = require('fs');
const path = require('path');
const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');
const { insetProfile } = require('./fit-unit');

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const WHOLE_TO_PART = 1.5;    // the whole circle is this many times a part
const H_GAP = 0.22;           // across, as a share of the whole's diameter
const V_GAP = 0.15;           // between stacked parts, of a part's diameter
const VERT_DROP = 0.25;       // whole to parts, of the whole's diameter
// Paper is read at a desk and a sheet holds four models where a slide holds one,
// so there the whole is a little less grand and sits a little closer to its
// parts; the approved partition sheet (two rows of four-part models) did not
// fit its page at the board's proportions.
const PAPER_WHOLE_TO_PART = 1.2;
const PAPER_VERT_DROP = 0.12;
// A blank is handwriting space, not measured type, so its digits may use more
// of the circle than a printed label does.
const BLANK_USABLE = 0.8;
const PAPER_BLANK_MIN_PT = (12 * 72) / 25.4;
// Drawn as a picture, a label cannot be wrapped by PowerPoint, so off the board
// it may use more of its circle.
const PAPER_USABLE = 0.8;
const HAND_DIGIT_PT = ((25 / 12) * 72) / 25.4; // the sheet's blank: 25mm for 12 characters
const USABLE = 0.72;          // a circle holds one line across its inscribed width,
                              // not its diameter, or the words touch the border
const BOARD_MAX_FONT = 28;
const BOARD_FLOOR_SHARE = 14 / 18; // the board's 14pt label floor, matched to the number line's
const NATURAL_FONT = 1.0;     // of the profile's font on paper and the wall
const DIGIT_EM = 0.62;        // a written digit, for sizing a blank
const WRITE_CHARS = 4;        // a four-digit number, the commonest thing written here
const CAPTION_FONT = 0.75;
const CAPTION_GAP = 0.15;
const JOINER_CLEAR = 0.4;
const COIN_OF_FONT = 4;       // a £2 inside a circle is this many label heights across,
                              // so a coin stays identifiable: at the sheet's 10.5pt a 1p is still 10mm
const COIN_GAP = 0.25;
const NOTE_SCALE = 0.42;      // notes are drawn to scale with each other, not with coins
const LINE = '#222222';
const TEXT = '#000000';
const QUIET = '#666666';
const INK = '#1A1A1A';
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

const LOCAL_COIN_MM = {
  '1p': 20.3, '2p': 25.9, '5p': 18.0, '10p': 24.5, '20p': 21.4, '50p': 27.3, '£1': 23.43, '£2': 28.4,
};
const LOCAL_NOTE_MM = { '£5': [125, 65], '£10': [132, 69], '£20': [139, 73], '£50': [146, 77] };

// The real coins, drawn by the shared money picture so a coin in a part-whole
// model is the coin the class sees in a money strip. Where that module is not
// present the coin's own photograph is placed directly.
function moneyModule() {
  try {
    return require('./money-svg');
  } catch (e) {
    return null;
  }
}

// Until the shared money picture is present, a coin is a plain disc in its
// metal with its value on it: the photographs in builder/assets/money are about
// 3MB each, and embedding them whole breaks every surface's renderer. Only the
// small prepared copies (the board's .trimmed cache) are placed as photographs.
const METAL = { copper: ['#C87137', '#96491F'], silver: ['#D9D9D9', '#8C8C8C'], gold: ['#E2B64A', '#9C7A1F'] };
const COIN_METAL = { '1p': 'copper', '2p': 'copper', '5p': 'silver', '10p': 'silver', '20p': 'silver', '50p': 'silver', '£1': 'gold', '£2': 'gold' };
const imageCache = new Map();
function fallbackCoinImage(denomination, x, y, w, h) {
  const file = `${String(denomination).replace(/£/g, 'pound')}.png`;
  if (!imageCache.has(file)) {
    const trimmed = path.join(__dirname, '..', '..', 'builder', 'assets', 'money', '.trimmed', file);
    imageCache.set(file, fs.existsSync(trimmed) && fs.statSync(trimmed).size < 1e6 ? `data:image/png;base64,${fs.readFileSync(trimmed).toString('base64')}` : null);
  }
  const href = imageCache.get(file);
  if (href) return `<image href="${href}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="xMidYMax meet"/>`;
  const [face, rim] = METAL[COIN_METAL[denomination] || 'silver'];
  const r = Math.min(w, h) / 2;
  if (w > h * 1.3) {
    return `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(h * 0.08)}" fill="#EFE7D2" stroke="#7F7F7F"/>` +
      `<text x="${f2(x + w * 0.35)}" y="${f2(y + h * 0.62)}" text-anchor="middle" font-family="Comic Sans MS" font-size="${f2(h * 0.4)}" font-weight="bold" fill="#333333">${esc(denomination)}</text>`;
  }
  return `<circle cx="${f2(x + w / 2)}" cy="${f2(y + h - r)}" r="${f2(r * 0.96)}" fill="${face}" stroke="${rim}" stroke-width="${f2(Math.max(0.6, r * 0.06))}"/>` +
    `<text x="${f2(x + w / 2)}" y="${f2(y + h - r + r * 0.22)}" text-anchor="middle" font-family="Comic Sans MS" font-size="${f2(r * 0.62)}" font-weight="bold" fill="#333333">${esc(denomination)}</text>`;
}

function coinImage(denomination, x, y, w, h) {
  const m = moneyModule();
  if (m && typeof m.coinImage === 'function') return m.coinImage(denomination, x, y, w, h);
  return fallbackCoinImage(denomination, x, y, w, h);
}

function denominationMm(denomination) {
  const m = moneyModule();
  const coins = (m && m.COIN_MM) || LOCAL_COIN_MM;
  const notes = (m && m.NOTE_MM) || LOCAL_NOTE_MM;
  const key = String(denomination).replace(/_back$/, '');
  if (coins[key] != null) return { w: coins[key], h: coins[key] };
  if (notes[key]) return { w: notes[key][0] * NOTE_SCALE, h: notes[key][1] * NOTE_SCALE };
  throw new Error(`UNKNOWN_DENOMINATION: "${denomination}" is not a coin or note this model can show. Use one of ${[...Object.keys(coins), ...Object.keys(notes)].join(', ')}.`);
}

function str(v) {
  return v == null ? '' : String(v);
}

function esc(s) {
  return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function f2(n) {
  return Math.round(n * 100) / 100;
}

function coinRows(count) {
  if (count === 0) return [];
  if (count <= 3) return [count];
  if (count === 4) return [2, 2];
  if (count === 5) return [3, 2];
  if (count === 6) return [3, 3];
  const rows = [];
  let left = count;
  while (left > 3) { rows.push(3); left -= 3; }
  if (left > 0) rows.push(left);
  return rows;
}

function normaliseNode(node, where, strict) {
  if (node == null || typeof node !== 'object') {
    const text = str(node);
    return { text, blank: text === '', blankChars: 0, caption: '', coins: [] };
  }
  const hasValue = node.value != null && node.value !== '';
  const hasLabel = node.label != null && node.label !== '';
  const coins = Array.isArray(node.coins) ? node.coins.map(str) : [];
  if (hasValue && hasLabel) {
    throw new Error('part-whole: a bubble takes `value` (handed to the child) or `label` (a word they read), not both');
  }
  let blankChars = 0;
  if (node.blank != null && node.blank !== false) {
    const stated = node.blankChars;
    if (stated != null && (typeof stated !== 'number' || !Number.isFinite(stated) || stated < 1 || stated > 40)) {
      throw new Error('part-whole: `blankChars` must be a number from 1 to 40');
    }
    blankChars = stated == null ? WRITE_CHARS : Math.ceil(stated);
    if (hasValue || hasLabel || coins.length) {
      throw new Error(`part-whole: ${where} is marked blank and also carries ${hasValue || hasLabel ? 'a value or label' : 'coins'}. A blank node is empty; that is what makes it the question.`);
    }
  }
  if (strict && !blankChars && !hasValue && !hasLabel && !coins.length) {
    throw new Error(`PART_WHOLE_INTENT_UNSTATED: ${where} carries nothing and is not marked \`blank: true\`. Say whether the child is handed this node or writes it.`);
  }
  const text = hasValue ? str(node.value) : hasLabel ? str(node.label) : '';
  coins.forEach(denominationMm);
  return { text, blank: !text && !coins.length, blankChars, caption: str(node.caption), coins };
}

function normalise(spec = {}) {
  const strict = spec.requireIntent === true;
  const objects = (spec.whole != null && typeof spec.whole === 'object') || (Array.isArray(spec.parts) && spec.parts.some((p) => p && typeof p === 'object'));
  let parts = Array.isArray(spec.parts) ? spec.parts : [];
  if (!objects && parts.length < 2) parts = ['?', '?'];
  if (parts.length === 0) throw new Error("part-whole-money: 'parts' must list at least one part bubble");
  return {
    orientation: spec.orientation === 'vertical' || spec.orientation === 'horizontal' ? spec.orientation : objects ? 'vertical' : 'horizontal',
    whole: normaliseNode(objects ? spec.whole || {} : spec.whole != null ? spec.whole : '?', 'the whole', strict),
    parts: parts.map((p, i) => normaliseNode(p, `part ${i + 1}`, strict)),
    joiner: spec.joiner != null && spec.joiner !== '' ? str(spec.joiner) : '',
    // Parts full of coins are already big, so the whole is sized by what it holds
    // (never less than a write-in circle) rather than half as big again as a
    // circle of coins, which printed an empty moon over the question.
    wholeRatio: parts.some((p) => p && typeof p === 'object' && Array.isArray(p.coins) && p.coins.length) ? 0.8 : WHOLE_TO_PART,
  };
}

// What a node must hold at a label size f: its words, or the digits a child
// will write, and any coins in rows under the words.
function contentAt(node, f, paperBlank = false) {
  const unit = (COIN_OF_FONT * f) / 28.4;
  const rows = coinRows(node.coins.length);
  let offset = 0;
  let coinW = 0;
  let coinH = 0;
  const rowSizes = rows.map((count) => {
    const sizes = node.coins.slice(offset, offset + count).map((d) => denominationMm(d));
    offset += count;
    const w = sizes.reduce((s, z) => s + z.w * unit, 0) + (count - 1) * COIN_GAP * f;
    const h = Math.max(...sizes.map((z) => z.h * unit));
    coinW = Math.max(coinW, w);
    coinH += h;
    return { count, w, h };
  });
  if (rows.length) coinH += (rows.length - 1) * COIN_GAP * f;
  const textW = node.text ? textWidthEm(node.text, true) * f : node.blankChars ? node.blankChars * DIGIT_EM * f : 0;
  const textH = node.text || node.blankChars ? f * 1.2 : 0;
  const w = Math.max(coinW, textW);
  const h = coinH + (rows.length && node.text ? COIN_GAP * f : 0) + (node.text ? textH : 0);
  let d = rows.length ? Math.hypot(w, h) * 1.04 : w / (node.text ? (paperBlank ? PAPER_USABLE : USABLE) : BLANK_USABLE);
  // On paper a blank is sized for a child's pen, not for type: the sheet's
  // write-in node was never narrower than 14mm.
  if (paperBlank && node.blankChars && !node.text) d = Math.max(PAPER_BLANK_MIN_PT, node.blankChars * HAND_DIGIT_PT / BLANK_USABLE);
  return { d, rowSizes, unit, coinH };
}

function resolveProfile(p, box) {
  return typeof p === 'string' ? profileFor(p, box || { widthPt: 500 }) : p;
}

// The model's frame for a part diameter p: circle centres and the extent.
function frame(M, p, f) {
  const n = M.parts.length;
  const W = p * M.wholeRatio;
  const capFont = Math.max(1, CAPTION_FONT * f);
  const captionH = [M.whole, ...M.parts].some((x) => x.caption) ? CAPTION_GAP * f + capFont * 1.2 : 0;
  const jw = M.joiner ? textWidthEm(M.joiner, true) * f + 2 * JOINER_CLEAR * f : 0;
  if (M.orientation === 'horizontal') {
    const vgap = Math.max(V_GAP * p, jw ? f * 1.4 : 0, captionH);
    const partsH = n * p + (n - 1) * vgap;
    const h = Math.max(W, partsH) + (M.whole.caption ? captionH : 0) * 0 + (M.parts[n - 1].caption ? captionH : 0);
    const hgap = W * H_GAP;
    const capW = Math.max(...[M.whole, ...M.parts].map((x) => (x.caption ? textWidthEm(x.caption, false) * capFont : 0)));
    const w = Math.max(W, capW) + hgap + Math.max(p, capW);
    const mid = Math.max(W, partsH) / 2;
    const whole = { cx: Math.max(W, capW) / 2, cy: mid, d: W };
    const top = mid - partsH / 2;
    const parts = M.parts.map((_, i) => ({ cx: Math.max(W, capW) + hgap + Math.max(p, capW) / 2, cy: top + p / 2 + i * (p + vgap), d: p }));
    const joiners = M.joiner ? M.parts.slice(1).map((_, i) => ({ x: parts[i].cx, y: (parts[i].cy + p / 2 + parts[i + 1].cy - p / 2) / 2 })) : [];
    return { w, h: Math.max(h, mid * 2 + captionH), whole, parts, joiners, capFont, captionH };
  }
  const capW = Math.max(...M.parts.map((x) => (x.caption ? textWidthEm(x.caption, false) * capFont : 0)));
  const pitch = Math.max(p + H_GAP * p, p + jw, capW + CAPTION_GAP * f);
  const rowW = (n - 1) * pitch + Math.max(p, capW);
  const w = Math.max(W, rowW);
  const drop = W * (M.paper ? PAPER_VERT_DROP : VERT_DROP) + (M.whole.caption ? captionH : 0);
  const whole = { cx: w / 2, cy: W / 2, d: W };
  const left = (w - rowW) / 2 + Math.max(p, capW) / 2;
  const partsY = W + drop + p / 2;
  const parts = M.parts.map((_, i) => ({ cx: left + i * pitch, cy: partsY, d: p }));
  const joiners = M.joiner ? M.parts.slice(1).map((_, i) => ({ x: (parts[i].cx + parts[i + 1].cx) / 2, y: partsY })) : [];
  return { w, h: partsY + p / 2 + (M.parts.some((x) => x.caption) ? captionH : 0), whole, parts, joiners, capFont, captionH };
}

function paperProportions(M, board) {
  M.paper = !board;
  if (!board && M.wholeRatio === WHOLE_TO_PART) M.wholeRatio = PAPER_WHOLE_TO_PART;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  // Laid out inside the box less the stroke that bleeds past the drawing's edge.
  const given = resolveProfile(profileOrSurface, box);
  const profile = insetProfile(given, 2);
  const M = normalise(spec);
  const board = Boolean(profile.heightPt);
  paperProportions(M, board);
  const floor = board ? profile.minFontPt * BOARD_FLOOR_SHARE : profile.minFontPt;
  // The part diameter the model's own labels need at size f; a long whole label
  // is cheaper in part diameters than a long part label.
  const partNeed = (f) => Math.max(contentAt(M.whole, f, !board).d / M.wholeRatio, ...M.parts.map((x) => contentAt(x, f, !board).d), f * (board ? 1.6 : 3));

  let f;
  let p;
  if (board) {
    // The board's circles take the zone they are given, as they always did.
    p = Math.min(profile.widthPt, profile.heightPt);
    for (let k = 0; k < 200; k += 1) {
      const fr = frame(M, p, floor);
      if (fr.w <= profile.widthPt + 0.01 && fr.h <= profile.heightPt + 0.01) break;
      p *= 0.98;
    }
    if (p < partNeed(floor) - 0.01) {
      const fr = frame(M, partNeed(floor), floor);
      const longest = [M.whole, ...M.parts].map((x) => x.text).sort((a, b) => b.length - a.length)[0] || '';
      throw new Error(
        `PART_WHOLE_MODEL_DOES_NOT_FIT: a ${M.orientation} model labelled "${longest}" needs a zone of at least ${((fr.w + 14.4) / 72).toFixed(2)}in x ` +
          `${((fr.h + 14.4) / 72).toFixed(2)}in to print its numbers at ${floor.toFixed(0)}pt, and was given ${((given.widthPt + 14.4) / 72).toFixed(2)}in x ` +
          `${((given.heightPt + 14.4) / 72).toFixed(2)}in. Give the model a larger share of its stack, or drop it from this slide - do not let it print a number too small to read.`
      );
    }
    f = BOARD_MAX_FONT;
    while (f > floor && partNeed(f) > p) f -= 0.5;
    f = Math.max(floor, f);
  } else {
    f = profile.fontPt * NATURAL_FONT;
    p = partNeed(f);
    while (frame(M, p, f).w > profile.widthPt && f > floor) {
      f = Math.max(floor, f - 0.25);
      p = partNeed(f);
    }
    if (frame(M, p, f).w > profile.widthPt + 0.5) {
      throw new Error(
        `PART_WHOLE_MODEL_DOES_NOT_FIT: this model needs ${(frame(M, p, f).w / 72 * 25.4).toFixed(0)}mm across to print its numbers at ${floor}pt, and has ` +
          `${(profile.widthPt / 72 * 25.4).toFixed(0)}mm. Give it the full width, or fewer parts.`
      );
    }
  }
  const fr = frame(M, p, f);
  // Each circle's words at the largest size they fit, never above the model's
  // size, so one long label does not shrink every other number.
  const fontFor = (node, d) => {
    if (!node.text) return f;
    const content = contentAt(node, f, !board);
    if (node.coins.length) return f;
    return Math.max(floor, Math.min(board ? BOARD_MAX_FONT : f, (d * (board ? USABLE : PAPER_USABLE) * 0.97) / Math.max(0.1, textWidthEm(node.text, true)), f * (d / content.d)));
  };
  return { ...M, ...fr, p, f, floor, fontFor };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = resolveProfile(profileOrSurface, box);
  const L = describeLayout(spec, profile);
  const ink = profile.palette === 'ink';
  const font = profile.font;
  const sw = Math.min(3, Math.max(1.5, L.p * 0.03));
  const parts = [];
  const circles = [{ node: normalise(spec).whole, c: L.whole }, ...normalise(spec).parts.map((node, i) => ({ node, c: L.parts[i] }))];
  const drawn = [];
  // Lines first, each meeting its circles at their own edges rather than one
  // anchor, so the whole never grows a knot where every line converges.
  circles.slice(1).forEach(({ c }) => {
    const dx = c.cx - L.whole.cx;
    const dy = c.cy - L.whole.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    parts.push(`<line x1="${f2(L.whole.cx + (ux * L.whole.d) / 2)}" y1="${f2(L.whole.cy + (uy * L.whole.d) / 2)}" x2="${f2(c.cx - (ux * c.d) / 2)}" y2="${f2(c.cy - (uy * c.d) / 2)}" stroke="${ink ? INK : LINE}" stroke-width="${f2(Math.max(1.5, sw * 0.8))}"/>`);
  });
  circles.forEach(({ node, c }) => {
    parts.push(`<circle cx="${f2(c.cx)}" cy="${f2(c.cy)}" r="${f2(c.d / 2)}" fill="#FFFFFF" stroke="${ink ? INK : LINE}" stroke-width="${f2(sw)}"/>`);
    const pt = L.fontFor(node, c.d);
    const content = contentAt(node, L.f);
    let y = c.cy - (content.coinH + (node.coins.length && node.text ? COIN_GAP * L.f : 0) + (node.text ? L.f * 1.2 : 0)) / 2;
    let offset = 0;
    content.rowSizes.forEach((row) => {
      const slice = node.coins.slice(offset, offset + row.count);
      offset += row.count;
      let x = c.cx - row.w / 2;
      slice.forEach((den) => {
        const size = denominationMm(den);
        const cw = size.w * content.unit;
        const ch = size.h * content.unit;
        parts.push(coinImage(den, x, y + row.h - ch, cw, ch));
        x += cw + COIN_GAP * L.f;
      });
      y += row.h + COIN_GAP * L.f;
    });
    if (node.text) {
      const ty = node.coins.length ? y + L.f * 0.6 : c.cy;
      parts.push(`<text x="${f2(c.cx)}" y="${f2(ty + pt * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(pt)}" font-weight="bold" fill="${ink ? INK : TEXT}">${esc(node.text)}</text>`);
    }
    if (node.caption) {
      parts.push(`<text x="${f2(c.cx)}" y="${f2(c.cy + c.d / 2 + CAPTION_GAP * L.f + L.capFont)}" text-anchor="middle" font-family="${font}" font-size="${f2(Math.max(L.floor, L.capFont))}" fill="${ink ? INK : QUIET}">${esc(node.caption)}</text>`);
    }
    drawn.push({ text: node.text, cx: c.cx, cy: c.cy, d: c.d, pt, caption: node.caption });
  });
  L.joiners.forEach((j) =>
    parts.push(`<text x="${f2(j.x)}" y="${f2(j.y + L.f * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(L.f)}" font-weight="bold" fill="${ink ? INK : TEXT}">${esc(L.joiner)}</text>`)
  );
  const bleed = sw / 2 + 0.5;
  const w = L.w + 2 * bleed;
  const h = L.h + 2 * bleed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-bleed)} ${f2(-bleed)} ${f2(w)} ${f2(h)}">${parts.join('')}</svg>`;
  return { svg, w, h, aspect: w / h, layout: { ...L, circles: drawn } };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = resolveProfile(profileOrSurface, box);
  return `part-whole-model:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

// The narrowest box the model can be drawn in on paper, at the surface's floor.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets') {
  const profile = resolveProfile(profileOrSurface, { widthPt: 500 });
  const M = normalise(spec);
  paperProportions(M, false);
  const f = profile.minFontPt;
  const p = Math.max(contentAt(M.whole, f, true).d / M.wholeRatio, ...M.parts.map((x) => contentAt(x, f, true).d), f * 1.6);
  return frame(M, p, f).w + 2 * 2 + 1;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt, coinImage };
