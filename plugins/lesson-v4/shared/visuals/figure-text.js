'use strict';

// Words inside a shared drawing, measured and wrapped in points.
//
// The measuring scales and the thinking diagrams (the timeline, the concept
// map, the fishbone, the classification key and the rest) moved into
// shared/visuals/ on 13 September 2026 so the board, the worksheet, the wall and
// the stick-in pack all place one drawing of each. Every one of them puts words
// in boxes, and on the board each had grown its own copy of the same three
// moves: measure a word with the Comic Sans table, wrap at spaces and never
// inside a word, and find the largest size that still fits. They live here once
// so a fix to wrapping reaches every picture on every surface.
//
// Everything is in points at the size the drawing prints (see
// surface-profiles.js), so a readable floor means the same on a slide as on a
// sheet.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');

// One line of Comic Sans, as a multiple of its size. The board's helpers used
// 1.32 with a little safety; a drawing sets its own lines, so it needs no fit
// pass's margin, only the leading a child reads comfortably.
const LINE = 1.25;
// How far down from a line's top its baseline sits, as a multiple of the size.
const BASELINE = 0.92;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function f2(n) {
  return Math.round(n * 100) / 100;
}

function widthPt(text, pt, bold) {
  return textWidthEm(String(text == null ? '' : text), bold) * pt;
}

// The lines `text` takes at `pt` in `availW` points, wrapping at spaces only and
// keeping any line break the author typed ("Turn handle\nDynamo"). Null when a
// single word is wider than the room: a drawing never splits a word, so that is
// the signal to shrink or to refuse.
function wrap(text, pt, availW, bold) {
  const out = [];
  const paragraphs = String(text == null ? '' : text).split(/\r?\n/);
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let current = '';
    for (const word of words) {
      if (widthPt(word, pt, bold) > availW + 1e-6) return null;
      const candidate = current ? `${current} ${word}` : word;
      if (widthPt(candidate, pt, bold) <= availW + 1e-6) current = candidate;
      else {
        out.push(current);
        current = word;
      }
    }
    out.push(current);
  }
  return out;
}

// The widest single word, so a refusal can name it.
function longestWord(text, pt, bold) {
  return String(text == null ? '' : text)
    .split(/\s+/)
    .filter(Boolean)
    .reduce((best, w) => (widthPt(w, pt, bold) > widthPt(best, pt, bold) ? w : best), '');
}

// The width of the longest line once wrapped.
function linesWidth(lines, pt, bold) {
  return lines.reduce((m, l) => Math.max(m, widthPt(l, pt, bold)), 0);
}

// A block of centred (or start/end anchored) lines whose first line's top is
// `topY`.
function textLines(lines, x, topY, pt, { fill, font, bold, anchor = 'middle', italic = false }) {
  const weight = bold ? ' font-weight="bold"' : '';
  const style = italic ? ' font-style="italic"' : '';
  return lines
    .map(
      (line, i) =>
        `<text x="${f2(x)}" y="${f2(topY + i * pt * LINE + pt * BASELINE)}" text-anchor="${anchor}" font-family="${font}" font-size="${f2(pt)}"${weight}${style} fill="${fill}">${esc(line)}</text>`
    )
    .join('');
}

function blockHeight(lineCount, pt) {
  return lineCount * pt * LINE;
}

// A profile from a surface name or a ready profile, the way every shared
// drawing accepts either.
function resolveProfile(profileOrSurface, box, defaultBox) {
  if (profileOrSurface && typeof profileOrSurface === 'object') return profileOrSurface;
  return profileFor(profileOrSurface || 'worksheets', box || defaultBox || { widthPt: 500 });
}

// The largest size, from the profile's own down to its readable floor, at which
// `attempt(pt)` lays the drawing out. `attempt` returns a layout, or an Error
// naming why it did not fit; when even the floor fails, that error is thrown,
// so the refusal says what could not fit rather than that something did not.
function settle(profile, attempt, { maxPt, step = 0.5 } = {}) {
  const top = maxPt != null ? maxPt : profile.fontPt;
  const floor = Math.min(profile.minFontPt, top);
  let last = null;
  for (let pt = top; pt >= floor - 1e-9; pt -= step) {
    const got = attempt(Math.round(pt * 100) / 100);
    if (!(got instanceof Error)) return got;
    last = got;
  }
  throw last || new Error('FIGURE_DOES_NOT_FIT: the drawing could not be laid out at any readable size.');
}

// How wide the finished drawing is, and how far its content moves right. Every
// surface places a drawing by its own tight shape (the board centres it in its
// zone, the sheet pins it to its width in points, the wall places it by its
// aspect, the stick-in pack prints it at the width of the piece), so no blank
// margin is ever baked into the picture.
function frameWidth(profile, contentW) {
  return { W: contentW, dx: 0 };
}

function svgDoc(w, h, parts) {
  const W = f2(w);
  const H = f2(h);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

function profileKey(p) {
  return `${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}`;
}

// A hex colour a spec supplied ("00B050" or "#00B050"), or the fallback.
function hexOr(value, fallback) {
  const s = String(value == null ? '' : value).trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(s) ? `#${s.toUpperCase()}` : fallback;
}

module.exports = {
  LINE,
  BASELINE,
  esc,
  f2,
  widthPt,
  wrap,
  longestWord,
  linesWidth,
  textLines,
  blockHeight,
  resolveProfile,
  settle,
  frameWidth,
  svgDoc,
  profileKey,
  hexOr,
};
