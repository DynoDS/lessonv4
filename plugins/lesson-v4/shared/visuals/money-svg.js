'use strict';

// THE coins and notes: a row of real UK money, placed by the board, the
// worksheet, the working wall and the stick-in pack.
//
// Each coin and note is the stock picture of the real Royal Mint design
// (builder/assets/money), never a drawing of one: the manifest declares this
// picture `asset:money`, because a coin is a real object and a child sorting
// coins is doing the job they do at a till. Until 13 September 2026 the board
// placed those pictures while the worksheet drew its own cartoon coins in SVG
// (flat metal colours, a heptagon, the value printed on the face), so a child
// counted real coins on the slide and different ones on the sheet, and the wall
// and the pack could not show money at all. The pictures placed here are the
// prepared copies in builder/assets/money/placed (trimmed to the coin, 500px,
// made by builder/scripts/prepare-money-pictures.js), so a drawing can be made
// without an image library.
//
// Laid out in points at the size it prints, like the number line.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   normalise(spec)         -> { items }
//   coinImage(key, x, y, w, h) -> an <image> of that coin in that box, for a
//                               drawing that holds money inside something else
//   denominationPicture(key) -> { href, px, sizeMm }
//
// ─── the spec (the board's spelling) ────────────────────────────────────────
//
//   items   the coins and notes left to right: "1p" "2p" "5p" "10p" "20p"
//           "50p" "£1" "£2", the backs "5p_back" "20p_back" "50p_back"
//           "£1_back" "£2_back", the notes "£5" "£10" "£20" "£50", and "|" for
//           a wider gap between two groups of coins
//
// The sheet's coin-strip spelling (`coins`) is read too.

const fs = require('fs');
const path = require('path');
const { MM_TO_PT, profileFor } = require('./surface-profiles');

const PICTURE_DIR = path.resolve(__dirname, '..', '..', 'builder', 'assets', 'money', 'placed');

// Real sizes in millimetres. Size is the FIRST thing a child sorts coins by,
// before colour and long before they read the number, and a 2p printed the same
// size as a 5p teaches the opposite of what a money lesson is for (the 2p is
// the bigger coin by a third). So coins are to scale with each other, as the
// sheet and the board both drew them.
const COIN_MM = {
  '1p': 20.3,
  '2p': 25.9,
  '5p': 18.0,
  '10p': 24.5,
  '20p': 21.4,
  '50p': 27.3,
  '£1': 23.43,
  '£2': 28.4,
};

// Notes are NOT to scale with the coins and cannot be: a life-size £5 is 125mm
// across and the board, which drew it that way, printed every coin beside it as
// a crumb a third of the size of the note's portrait. The notes are to scale
// with each other (a £50 is still the biggest) and sized so a note reads as
// comfortably bigger than any coin without swallowing the row, the sheet's
// compromise. Said plainly because it is a compromise, not a measurement.
const NOTE_MM = {
  '£5': [125, 65],
  '£10': [132, 69],
  '£20': [139, 73],
  '£50': [146, 77],
};
const NOTE_SCALE = 0.42; // a £5 at 27mm tall, just over a 50p

// ─── CONSTANTS (millimetres of the real object unless named) ────────────────
const GAP_MM = 2; // between two items
const SPLIT_MM = 6.5; // the "|" break, wide enough to read as two groups
const ROW_GAP_MM = 2.5;
// A coin prints at life size on paper, where the sheet's text is 10.5pt, and
// grows in step with the words on a surface read from further away.
const LIFE_SIZE_FONT_PT = 10.5;
// The smallest coin in a row may not print narrower than this many ems of the
// surface's readable floor: smaller and a child cannot tell a 5p from a 1p.
const SMALLEST_COIN_EM = 2.5;
// ────────────────────────────────────────────────────────────────────────────

const pictureCache = new Map();

function fileNameFor(key) {
  return `${String(key).replace(/£/g, 'pound')}.png`;
}

function sizeMm(key) {
  const base = key.replace(/_back$/, '');
  if (COIN_MM[base] != null && (key === base || fs.existsSync(path.join(PICTURE_DIR, fileNameFor(key))))) {
    return { w: COIN_MM[base], h: COIN_MM[base] };
  }
  if (NOTE_MM[key]) return { w: NOTE_MM[key][0] * NOTE_SCALE, h: NOTE_MM[key][1] * NOTE_SCALE };
  return null;
}

function known() {
  return fs.readdirSync(PICTURE_DIR).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '').replace(/^pound/, '£'));
}

// The picture of one denomination, read once per run.
function denominationPicture(key) {
  const size = sizeMm(key);
  const file = path.join(PICTURE_DIR, fileNameFor(key));
  // Silence here would print a gap where a coin should be and nothing would
  // look wrong, so an unknown coin is refused rather than left out or drawn as
  // a grey box with its name in it.
  if (!size || !fs.existsSync(file)) {
    throw new Error(`UNKNOWN_DENOMINATION: "${key}". Known: ${known().join(', ')}, and "|" for a gap between groups.`);
  }
  if (!pictureCache.has(key)) {
    const buf = fs.readFileSync(file);
    // A PNG states its pixel size in its header, so the picture is placed at
    // its own proportions without an image library.
    const px = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    pictureCache.set(key, { href: `data:image/png;base64,${buf.toString('base64')}`, px });
  }
  return { ...pictureCache.get(key), sizeMm: size };
}

// One coin or note's real picture, placed in a box of the caller's units, for
// a drawing that holds money inside something else (a part-whole bubble). It
// embeds the prepared 500px copy, never the multi-megabyte original, and the
// copy is read once per denomination; there is one size of copy because a
// drawing cannot resize a picture without an image library, and 500px is
// already sharp for the largest coin any surface prints.
function coinImage(denomination, x, y, w, h) {
  const pic = denominationPicture(String(denomination));
  return (
    `<image x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="xMidYMax meet" ` +
    `href="${pic.href}" xlink:href="${pic.href}"/>`
  );
}

function normalise(spec = {}) {
  const given = Array.isArray(spec.items) ? spec.items : Array.isArray(spec.coins) ? spec.coins : [];
  const items = given.map((raw) => String(raw).trim());
  if (!items.some((k) => k !== '|')) {
    throw new Error('MONEY_EMPTY: `items` must list at least one coin or note.');
  }
  items.forEach((k) => {
    if (k !== '|') denominationPicture(k);
  });
  return { items };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const { items } = normalise(spec);
  const W = profile.widthPt;
  const H = profile.heightPt;
  const entries = items.map((key) => (key === '|' ? { key, spacer: true, w: SPLIT_MM, h: 0 } : { key, ...sizeMm(key) }));
  const real = entries.filter((e) => !e.spacer);
  const smallest = Math.min(...real.map((e) => Math.min(e.w, e.h)));

  // Points per real millimetre.
  const natural = MM_TO_PT * (profile.fontPt / LIFE_SIZE_FONT_PT);
  const floor = (SMALLEST_COIN_EM * profile.minFontPt) / smallest;

  function pack(k, widthPt) {
    const rows = [];
    let row = null;
    entries.forEach((e) => {
      const w = e.w * k;
      const gap = GAP_MM * k;
      if (!row || (row.items.length && row.w + gap + w > widthPt + 1e-6 && !e.spacer)) {
        if (e.spacer && !row) return; // a break at the start of a row is no break
        row = { items: [], w: 0, h: 0 };
        rows.push(row);
      }
      row.w += (row.items.length ? gap : 0) + w;
      row.h = Math.max(row.h, e.h * k);
      row.items.push({ ...e, pw: w, ph: e.h * k });
    });
    rows.forEach((r) => {
      // A break left dangling at the end of a row separates nothing.
      while (r.items.length && r.items[r.items.length - 1].spacer) {
        const last = r.items.pop();
        r.w -= last.pw + (r.items.length ? GAP_MM * k : 0);
      }
    });
    const height = rows.reduce((t, r) => t + r.h, 0) + Math.max(0, rows.length - 1) * ROW_GAP_MM * k;
    return { rows: rows.filter((r) => r.items.length), height, width: Math.max(...rows.map((r) => r.w)) };
  }

  // The board shows one coin as big as its zone allows, so "which coin is this?"
  // can be answered from the back of the room.
  const biggest = H && real.length === 1 ? Math.min(W / real[0].w, H / real[0].h) : natural;
  const fits = (laidOut, rows) => laidOut.rows.length <= rows && laidOut.width <= W + 1e-6 && (!H || laidOut.height <= H + 1e-6);

  // As few rows as keep every coin above the floor, and within that many rows
  // the biggest coins that fit: one row keeps an amount reading as one amount,
  // and a second row is better than a single row of coins too small to tell
  // apart (a wall card once got eight coins at 15mm each on one line).
  let laid = null;
  let k = biggest;
  for (let rows = 1; rows <= real.length && !laid; rows++) {
    if (fits(pack(biggest, W), rows)) {
      laid = pack(biggest, W);
      break;
    }
    let lo = floor;
    let hi = biggest;
    if (!(hi >= lo) || !fits(pack(lo, W), rows)) continue;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (fits(pack(mid, W), rows)) lo = mid;
      else hi = mid;
    }
    k = lo;
    laid = pack(k, W);
  }
  if (!laid) {
    throw new Error(
      `MONEY_ZONE_TOO_SMALL: ${real.length} coins and notes cannot print at a size a child can tell apart in this space ` +
        `(the smallest would be under ${f2((SMALLEST_COIN_EM * profile.minFontPt) / MM_TO_PT)}mm across). ` +
        'Give the picture more room, or show fewer coins.'
    );
  }

  // Rows centred on each other; within a row, coins and notes sit on one
  // baseline, as they would lying on a table. Centred instead, a 5p floats
  // halfway up the row and its size reads as an accident of layout.
  const w = laid.width;
  const placed = [];
  let y = 0;
  laid.rows.forEach((row) => {
    let x = (w - row.w) / 2;
    row.items.forEach((it) => {
      if (!it.spacer) placed.push({ key: it.key, x, y: y + row.h - it.ph, w: it.pw, h: it.ph });
      x += it.pw + GAP_MM * k;
    });
    y += row.h + ROW_GAP_MM * k;
  });
  return { w, h: laid.height, scale: k, items: placed, rows: laid.rows.length, profile };
}

function f2(n) {
  return Math.round(n * 100) / 100;
}

function hashOf(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  // Each denomination's picture goes in once and is reused, so a row of four
  // 20p coins carries one 20p picture. The ids carry the drawing's own key
  // because a sheet inlines many drawings into one page, where ids are shared.
  const idBase = `money-${hashOf(cacheKey(spec, L.profile))}`;
  const defs = new Map();
  const uses = [];
  L.items.forEach((it) => {
    const pic = denominationPicture(it.key);
    const id = `${idBase}-${fileNameFor(it.key).replace(/\.png$/, '').replace(/[^\w-]/g, '')}`;
    if (!defs.has(id)) {
      defs.set(
        id,
        `<symbol id="${id}" viewBox="0 0 ${pic.px.w} ${pic.px.h}" preserveAspectRatio="xMidYMax meet"><image width="${pic.px.w}" height="${pic.px.h}" href="${pic.href}" xlink:href="${pic.href}"/></symbol>`
      );
    }
    uses.push(`<use href="#${id}" xlink:href="#${id}" x="${f2(it.x)}" y="${f2(it.y)}" width="${f2(it.w)}" height="${f2(it.h)}"/>`);
  });
  const w = f2(L.w);
  const h = f2(L.h);
  // Stick-in pieces are photocopied, and a photocopier turns colour to grey on
  // its own; the pictures stay the real ones so the shapes and designs survive.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs>${[...defs.values()].join('')}</defs>${uses.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  return `money:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, denominationPicture, coinImage, COIN_MM, NOTE_MM, NOTE_SCALE };
