'use strict';

// THE clock face. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack.
//
// It was three. The board pre-rendered a 600-unit face in bold Arial, the sheet
// drew a row of 280-unit faces in Comic Sans with thinner strokes, and the wall
// copied the board's face and grew its own colour-coded hands, digital readout
// and minute ring that no other surface could draw (13 September 2026). A child
// reading "twenty to four" on the board met a different clock on the sheet and
// another on the wall. Each surface now passes only the box it has and its
// profile (shared/visuals/surface-profiles.js).
//
// Laid out in points at the size it prints, so the numerals on a face are a
// real size on every surface and never go under the surface's readable floor.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   minWidthPt(spec, profile) -> the narrowest box every face still reads in
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   time          "H:MM", e.g. "3:45". The hands point at it.
//   hands         true (default) draws the hands; false is a blank face for
//                 the child to draw them on
//   colourCoded   the hour hand red and the minute hand blue, with a matching
//                 digital readout under the face ("3" red, ":", "40" blue), so
//                 a child glancing up sees the long blue hand is the blue
//                 minutes. The readout replaces a caption.
//   minuteRing    ":00 :05 ... :55" outside the numerals at every five-minute
//                 mark, for a lesson teaching minutes past, so the child reads
//                 the minute value rather than multiplying by five in their head
//   clocks        a row: [{ time, hands, colourCoded, minuteRing }, ...], every
//                 face the same size (the sheet's clock-row)
//   letters       true prints (a) (b) (c) above the faces of a row
//
// A board caption (`label`, with its "||" answer reveal) is typed text the
// board sets under the placed picture, not part of this drawing.

const { profileFor } = require('./surface-profiles');

// ─── CONSTANTS (shares of the face radius r, unless marked pt) ──────────────
const NUM_SHARE = 0.21; // a numeral's natural size on a roomy face
const NUM_MAX_SHARE = 0.3; // how far a small face may enlarge its numerals to
                           // keep them readable before it refuses
const MAJOR_TICK = 0.066; // five-minute tick length
const MINOR_TICK = 0.033; // one-minute tick length
const NUM_TICK_GAP = 0.03; // clear air between the ticks and the numerals
const MINUTE_HAND = 0.82;
const HOUR_HAND = 0.55;
const FACE_W = 0.014; const FACE_W_MIN = 1.2; // pt
const MAJOR_W = 0.009; const MAJOR_W_MIN = 1; // pt
const MINOR_W = 0.0055; const MINOR_W_MIN = 0.6; // pt
const MINUTE_W = 0.012; const MINUTE_W_MIN = 1.3; // pt
const HOUR_W = 0.024; const HOUR_W_MIN = 2.4; // pt
const CODED_MINUTE_W = 0.02; // colour-coded hands are thicker so the colour reads
const CODED_HOUR_W = 0.036;
const DOT_R = 0.02; const DOT_R_MIN = 1.5; // pt
const RING_SHARE = 0.13; // minute-ring label size
const RING_MAX_SHARE = 0.2;
const RING_GAP = 0.05; // between the face and the ring labels
const READOUT_SHARE = 0.37; // the digital readout under a colour-coded face
const FACE_GAP = 0.3; // between faces in a row
const PAD = 0.03;
const LETTER_BAND = 1.5; // in ems of the profile font: (a) above a face
const MAX_FACE_EM = 24; // widest a face grows on paper, in ems of the profile font
                        // (about 90mm on a sheet, the most one clock ever needed)
// ────────────────────────────────────────────────────────────────────────────

const TIME = /^\s*(\d{1,2}):(\d{2})\s*$/;

function f2(n) {
  return Math.round(n * 100) / 100;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function asProfile(profileOrSurface, box) {
  return typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
}

// One face in the one vocabulary. A time that cannot be read would draw hands
// at NaN, which prints as a face with no hands and looks like a blank clock the
// child is meant to fill in, so it is refused by name.
function normaliseFace(raw, inherit) {
  const face = raw && typeof raw === 'object' ? raw : {};
  const hands = face.hands !== false;
  const time = face.time == null || face.time === '' ? null : String(face.time);
  let h = null;
  let m = null;
  if (hands && time != null) {
    const match = TIME.exec(time);
    if (!match || Number(match[2]) > 59 || Number(match[1]) > 23) {
      throw new Error(`CLOCK_TIME_INVALID: the time ${JSON.stringify(time)} is not written as H:MM (for example "3:45").`);
    }
    h = Number(match[1]);
    m = Number(match[2]);
  }
  return {
    time: hands ? time : null,
    h,
    m,
    hands: hands && time != null,
    colourCoded: (face.colourCoded != null ? face.colourCoded : inherit.colourCoded) === true,
    minuteRing: (face.minuteRing != null ? face.minuteRing : inherit.minuteRing) === true,
  };
}

function normalise(spec = {}) {
  const list = Array.isArray(spec.clocks) && spec.clocks.length ? spec.clocks : [spec];
  const faces = list.map((c) => normaliseFace(c, spec));
  return { faces, letters: spec.letters === true && faces.length > 0 };
}

// Every face in a row is one size; solve that size from the room.
function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const { faces, letters } = normalise(spec);
  const n = faces.length;
  const T = Math.max(profile.fontPt, profile.minFontPt);
  const floor = profile.minFontPt;
  const coded = faces.some((c) => c.colourCoded && c.hands);
  const ringed = faces.some((c) => c.minuteRing);
  const letterBand = letters ? LETTER_BAND * T : 0;

  // How far past the face a ring of minute labels reaches, as a share of r;
  // it depends on the ring label size, which depends on r, so solve twice.
  const ringPtFor = (r) => Math.min(Math.max(r * RING_SHARE, floor), r * RING_MAX_SHARE);
  const reachFor = (r) => (ringed ? 1 + RING_GAP + (2 * ringPtFor(r)) / r + FACE_W : 1 + FACE_W);
  const readoutFor = (r) => (coded ? Math.max(r * READOUT_SHARE, T) * 1.25 : 0);

  let reach = ringed ? 1 + RING_GAP + 2 * RING_SHARE : 1;
  let r = 0;
  for (let pass = 0; pass < 3; pass++) {
    const across = n * 2 * reach + (n - 1) * FACE_GAP + 2 * PAD;
    let rw = profile.widthPt / across;
    if (profile.heightPt) {
      const usable = profile.heightPt - letterBand;
      // The readout grows with r but never under the font size.
      const readoutShare = coded ? READOUT_SHARE * 1.25 : 0;
      let rh = usable / (2 * reach + 2 * PAD + readoutShare);
      if (coded && rh * READOUT_SHARE < T) rh = (usable - T * 1.25) / (2 * reach + 2 * PAD);
      rw = Math.min(rw, rh);
    }
    r = Math.min(rw, (MAX_FACE_EM * profile.fontPt * (profile.grow || 1)) / 2);
    reach = reachFor(r);
  }

  if (!(r * NUM_MAX_SHARE >= floor)) {
    throw new Error(
      `CLOCK_TOO_SMALL: ${n === 1 ? 'a clock face' : `${n} clock faces`} cannot show numerals at the ${floor}pt readable minimum ` +
        'in a space this small. Give the clock more room, or put fewer faces in one row; the numerals are what the time is read from.'
    );
  }
  const numPt = Math.min(Math.max(r * NUM_SHARE, floor), r * NUM_MAX_SHARE);
  const ringPt = ringPtFor(r);
  if (ringed && ringPt < floor * 0.999) {
    throw new Error(
      `CLOCK_TOO_SMALL: the minute ring cannot print at the ${floor}pt readable minimum on a face this small. ` +
        'Give the clock more room, or leave the minute ring off.'
    );
  }
  const readoutH = readoutFor(r);
  const pad = PAD * r;
  const slot = 2 * reach * r;
  const gap = FACE_GAP * r;
  const w = n * slot + (n - 1) * gap + 2 * pad;
  const h = letterBand + slot + readoutH + 2 * pad;
  const centres = faces.map((_, i) => ({ x: pad + slot / 2 + i * (slot + gap), y: pad + letterBand + slot / 2 }));
  return { w, h, r, numPt, ringPt, readoutH, letterBand, T, faces, letters, centres, profile, slot };
}

function facePart(face, cx, cy, L, parts) {
  const { r, numPt, ringPt, profile } = L;
  const c = profile.colours;
  const font = profile.font;
  const weight = profile.bold ? ' font-weight="bold"' : '';
  const text = (s, x, y, pt, fill) =>
    `<text x="${f2(x)}" y="${f2(y + pt * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(pt)}"${weight} fill="${fill}">${s}</text>`;

  parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f2(Math.max(FACE_W * r, FACE_W_MIN))}"/>`);
  for (let i = 0; i < 60; i++) {
    const rad = toRad(i * 6 - 90);
    const major = i % 5 === 0;
    const inner = r * (1 - (major ? MAJOR_TICK : MINOR_TICK));
    const sw = major ? Math.max(MAJOR_W * r, MAJOR_W_MIN) : Math.max(MINOR_W * r, MINOR_W_MIN);
    parts.push(
      `<line x1="${f2(cx + r * Math.cos(rad))}" y1="${f2(cy + r * Math.sin(rad))}" x2="${f2(cx + inner * Math.cos(rad))}" y2="${f2(cy + inner * Math.sin(rad))}" stroke="${c.ink}" stroke-width="${f2(sw)}"/>`
    );
  }
  // The numerals sit inside the five-minute ticks, pulled in by their own size
  // so a face that enlarged them to stay readable does not run them into the ticks.
  const numberR = r * (1 - MAJOR_TICK - NUM_TICK_GAP) - numPt * 0.55;
  for (let n = 1; n <= 12; n++) {
    const rad = toRad(n * 30 - 90);
    parts.push(text(n, cx + numberR * Math.cos(rad), cy + numberR * Math.sin(rad), numPt, c.ink));
  }
  if (face.minuteRing) {
    const ringR = r * (1 + RING_GAP) + ringPt;
    for (let k = 0; k < 12; k++) {
      const rad = toRad(k * 30 - 90);
      parts.push(text(`:${String(k * 5).padStart(2, '0')}`, cx + ringR * Math.cos(rad), cy + ringR * Math.sin(rad), ringPt, c.jump));
    }
  }
  if (face.hands) {
    const coded = face.colourCoded;
    const minuteColour = coded ? c.jump : c.ink;
    const hourColour = coded ? c.arrow : c.ink;
    const minuteW = coded ? CODED_MINUTE_W * r : MINUTE_W * r;
    const hourW = coded ? CODED_HOUR_W * r : HOUR_W * r;
    const minRad = toRad(face.m * 6 - 90);
    const hourRad = toRad((face.h % 12) * 30 + face.m * 0.5 - 90);
    parts.push(
      `<line x1="${f2(cx)}" y1="${f2(cy)}" x2="${f2(cx + r * MINUTE_HAND * Math.cos(minRad))}" y2="${f2(cy + r * MINUTE_HAND * Math.sin(minRad))}" stroke="${minuteColour}" stroke-width="${f2(Math.max(minuteW, MINUTE_W_MIN))}" stroke-linecap="round"/>`
    );
    parts.push(
      `<line x1="${f2(cx)}" y1="${f2(cy)}" x2="${f2(cx + r * HOUR_HAND * Math.cos(hourRad))}" y2="${f2(cy + r * HOUR_HAND * Math.sin(hourRad))}" stroke="${hourColour}" stroke-width="${f2(Math.max(hourW, HOUR_W_MIN))}" stroke-linecap="round"/>`
    );
  }
  parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(Math.max(DOT_R * r, DOT_R_MIN))}" fill="${c.ink}"/>`);

  if (face.colourCoded && face.hands) {
    const pt = Math.max(r * READOUT_SHARE, L.T);
    const top = cy + L.slot / 2;
    const [hStr, mStr] = face.time.trim().split(':');
    parts.push(
      `<text x="${f2(cx)}" y="${f2(top + pt * 1.02)}" text-anchor="middle" font-family="${font}" font-size="${f2(pt)}" font-weight="bold">` +
        `<tspan fill="${c.arrow}">${esc(hStr)}</tspan><tspan fill="${c.ink}">:</tspan><tspan fill="${c.jump}">${esc(mStr)}</tspan></text>`
    );
  }
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const parts = [];
  L.faces.forEach((face, i) => {
    const { x, y } = L.centres[i];
    if (L.letters) {
      const pt = L.T;
      parts.push(
        `<text x="${f2(x)}" y="${f2(L.r * PAD + L.letterBand * 0.7)}" text-anchor="middle" font-family="${L.profile.font}" font-size="${f2(pt)}" font-weight="bold" fill="${L.profile.colours.ink}">(${String.fromCharCode(97 + i)})</text>`
      );
    }
    facePart(face, x, y, L, parts);
  });
  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

// The narrowest box in which every face still shows readable numerals (and a
// readable minute ring): what a sheet asks for before it will place a row.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const { faces } = normalise(spec);
  const n = faces.length;
  const ringed = faces.some((c) => c.minuteRing);
  const r = Math.max(profile.minFontPt / NUM_MAX_SHARE, ringed ? profile.minFontPt / RING_MAX_SHARE : 0);
  const reach = ringed ? 1 + RING_GAP + 2 * RING_MAX_SHARE + FACE_W : 1 + FACE_W;
  // A little over the exact figure, so rounding never lands a sheet one hair
  // under the floor it asked for.
  return Math.ceil((n * 2 * reach + (n - 1) * FACE_GAP + 2 * PAD) * r * 1.03) + 1;
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = asProfile(profileOrSurface, box);
  return `clock:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt };
