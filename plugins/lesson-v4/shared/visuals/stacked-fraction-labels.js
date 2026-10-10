'use strict';

// A fraction in a drawing's label is written top and bottom too.
//
// A sentence on a sheet stacks a typed fraction as it is printed
// (shared/text/stacked-fractions.js). A label inside a drawing is not a line of
// a page: it is one <text> placed by the drawing, so the "1/5" under a shaded
// bar and the "(1) 1/2 = ?/10" caption on an activity kept their slashes on
// every surface, beside a fraction wall of stacked fractions (stress test, 7
// October 2026; the teacher, 10 October 2026: a fraction "should not be a slash
// ... in a label inside drawings").
//
// Every drawing is a module in this folder that hands back SVG, and there are
// about seventy of them. So this is done once, to what they hand back, and no
// drawing has to know: `installOnSharedDrawings()` wraps each module's
// functions so any SVG they return has its fraction labels stacked. Each
// surface calls it first thing, before it takes hold of any drawing.
//
//   stackFractionsInSvg(svg) -> svg
//   installOnSharedDrawings()          safe to call more than once
//
// How a label is rewritten. A <text> that holds a fraction becomes a group:
// the words either side keep every attribute they had and are placed where the
// drawing's own anchor would have put them, measured with the real Comic Sans
// widths; the fraction is a numerator over a bar over a denominator, centred
// on the middle of the line. Its digits are FRACTION_SIZE of the label's own,
// which is what lets the pair stand inside the one line the drawing planned
// for the label, so nothing else in the drawing has to move.
//
// Left alone: a label with markup inside it (tspans), one with no plain x, y
// and font-size, and anything the fraction pattern does not match (a date, a
// long number).

const fs = require('node:fs');
const path = require('node:path');
const { textWidthEm } = require('../text/comic-glyph-width');
const { FRACTION } = require('../text/stacked-fractions');

const FRACTION_SIZE = 0.8;   // the digits, as a share of the label's size
const SMALLEST = 9;           // the least the digits print at, in the drawing's units
const DIGIT_HEIGHT = 0.72;   // a digit's height, as a share of its type size
const HALF_GAP = 0.09;       // bar to each digit row, in ems of the label
const SIDE = 0.1;            // air either side of the fraction, in ems of the label
const BAR = 0.06;            // the bar's thickness, in ems of the label
const MIDDLE = 0.34;         // baseline to the middle of a line of digits, in ems

const TEXT = /<text\b([^>]*)>([^<]*)<\/text>/g;
const HAS_FRACTION_LABEL = /<text\b[^>]*>[^<]*[\d?]\/[\d?]/;

function attr(attrs, name) {
  const m = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs);
  return m ? m[1] : null;
}
function without(attrs, names) {
  return names.reduce((out, name) => out.replace(new RegExp(`(^|\\s)${name}="[^"]*"`, 'g'), '$1'), attrs).replace(/\s+/g, ' ').trim();
}
function plainNumber(value) {
  return value != null && /^-?\d+(?:\.\d+)?(?:px)?$/.test(value.trim()) ? parseFloat(value) : null;
}
function decoded(text) {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}
const n2 = (n) => Number(n).toFixed(2);

function stackOne(all, attrs, content) {
  FRACTION.lastIndex = 0;
  if (!FRACTION.test(content)) return all;
  const x = plainNumber(attr(attrs, 'x'));
  const y = plainNumber(attr(attrs, 'y'));
  const size = plainNumber(attr(attrs, 'font-size'));
  if (x === null || y === null || !(size > 0)) return all;

  const bold = /^(bold|[6-9]00)$/.test(attr(attrs, 'font-weight') || '');
  const width = (text, at) => textWidthEm(decoded(text), bold) * at;
  const dy = attr(attrs, 'dy');
  const shift = dy == null ? 0 : /em$/.test(dy) ? parseFloat(dy) * size : plainNumber(dy) || 0;
  const centred = /^(middle|central)$/.test(attr(attrs, 'dominant-baseline') || '');
  const middle = centred ? y + shift : y + shift - MIDDLE * size;

  // The label, as words and fractions in order.
  const pieces = [];
  let at = 0;
  FRACTION.lastIndex = 0;
  for (const m of content.matchAll(FRACTION)) {
    const before = content.slice(at, m.index) + m[1];
    if (before) pieces.push({ words: before });
    pieces.push({ top: m[2], bottom: m[3] });
    at = m.index + m[0].length;
  }
  if (content.slice(at)) pieces.push({ words: content.slice(at) });

  // Never under the smallest size a sheet prints (9pt), unless the label was
  // already smaller than that itself.
  const small = Math.max(size * FRACTION_SIZE, Math.min(size, SMALLEST));
  for (const piece of pieces) {
    piece.w = piece.words !== undefined
      ? width(piece.words, size)
      : Math.max(width(piece.top, small), width(piece.bottom, small)) + 2 * SIDE * size;
  }
  const total = pieces.reduce((sum, piece) => sum + piece.w, 0);
  const anchor = attr(attrs, 'text-anchor') || 'start';
  let left = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x;

  const transform = attr(attrs, 'transform');
  const kept = without(attrs, ['x', 'text-anchor', 'transform', 'textLength', 'lengthAdjust']);
  const fractionAttrs = without(kept, ['y', 'dy', 'font-size', 'dominant-baseline']);
  const colour = attr(attrs, 'fill') || '#000000';
  const out = [];
  for (const piece of pieces) {
    if (piece.words !== undefined) {
      // An SVG label drops the spaces at its two ends, so a piece is placed
      // after its own leading space and printed without it.
      const lead = piece.words.length - piece.words.trimStart().length;
      const startX = left + width(piece.words.slice(0, lead), size);
      const words = piece.words.trim();
      if (words) out.push(`<text ${kept} x="${n2(startX)}" text-anchor="start">${words}</text>`);
    } else {
      const cx = left + piece.w / 2;
      const half = piece.w / 2 - SIDE * size * 0.4;
      out.push(
        `<text ${fractionAttrs} x="${n2(cx)}" y="${n2(middle - HALF_GAP * size)}" font-size="${n2(small)}" text-anchor="middle">${piece.top}</text>` +
        `<line x1="${n2(cx - half)}" y1="${n2(middle)}" x2="${n2(cx + half)}" y2="${n2(middle)}" stroke="${colour}" stroke-width="${n2(BAR * size)}"/>` +
        `<text ${fractionAttrs} x="${n2(cx)}" y="${n2(middle + HALF_GAP * size + DIGIT_HEIGHT * small)}" font-size="${n2(small)}" text-anchor="middle">${piece.bottom}</text>`
      );
    }
    left += piece.w;
  }
  return `<g class="stacked-fraction-label"${transform ? ` transform="${transform}"` : ''}>${out.join('')}</g>`;
}

function stackFractionsInSvg(svg) {
  if (typeof svg !== 'string' || !svg.includes('/') || !HAS_FRACTION_LABEL.test(svg)) return svg;
  return svg.replace(TEXT, stackOne);
}

// What a drawing hands back: SVG as a string, or an object carrying it.
function stacked(result) {
  if (typeof result === 'string') return /^\s*<(\?xml|svg)\b/.test(result) ? stackFractionsInSvg(result) : result;
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    if (typeof result.then === 'function') return result.then(stacked);
    if (typeof result.svg === 'string') {
      const svg = stackFractionsInSvg(result.svg);
      return svg === result.svg ? result : { ...result, svg };
    }
  }
  return result;
}

const WRAPPED = Symbol.for('lesson-v4.stacked-fraction-labels');

function installOnSharedDrawings() {
  if (installOnSharedDrawings.done) return;
  installOnSharedDrawings.done = true;
  for (const file of fs.readdirSync(__dirname)) {
    if (!/-svg\.js$/.test(file)) continue;
    const drawing = require(path.join(__dirname, file));
    if (!drawing || typeof drawing !== 'object') continue;
    for (const [name, fn] of Object.entries(drawing)) {
      if (typeof fn !== 'function' || fn[WRAPPED]) continue;
      const descriptor = Object.getOwnPropertyDescriptor(drawing, name);
      if (!descriptor || !descriptor.writable) continue;
      const wrapped = function (...args) { return stacked(fn.apply(this, args)); };
      Object.assign(wrapped, fn);
      wrapped[WRAPPED] = true;
      drawing[name] = wrapped;
    }
  }
}

module.exports = { stackFractionsInSvg, installOnSharedDrawings, FRACTION_SIZE };
