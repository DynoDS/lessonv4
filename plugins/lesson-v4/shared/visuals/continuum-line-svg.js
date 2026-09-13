'use strict';

// THE continuum line: a horizontal line for committing to a position on a
// gradient - agree to disagree, most to least, never to always. One drawing,
// placed by the board, the worksheet, the working wall and the stick-in pack.
//
// End labels at each end of the line, an optional middle label, optional evenly
// spaced ticks between the ends, and an optional question above.
//
// It was the board's alone (builder/src/content/continuum-line.js). Its labels
// were fixed 16pt and 14pt boxes until 4.2.128 (10 September 2026) raised every
// helper to the 18pt floor, after which "Strongly disagree" could not be drawn
// and its own catalogue example had not built; each end label was then given up
// to 45% of the line and a box as tall as its wrapped lines. Both rules are kept
// here. It moved on 13 September 2026, when every picture became one shared
// drawing reachable from every surface.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   left, right   the end labels (default "Disagree" and "Agree")
//   middle        an optional label under the middle of the line
//   marks         evenly spaced ticks between the ends (0 to 11, default 0)
//   question      an optional prompt above the line

const T = require('./figure-text');

// ─── CONSTANTS (ems of the settled font size) ───────────────────────────────
const LINE_THICK = 0.18;
const END_CAP_W = 0.18;
const END_CAP_H = 1.1;
const TICK_W = 0.13;
const TICK_H = 0.65;
const ANCHOR_SHARE = 0.45; // of the line's width, per end label
const MIDDLE_SHARE = 0.4;
const ANCHOR_GAP = 0.3;
const QUESTION_GAP = 0.5;
const MIN_LINE_W = 12; // ems: a line shorter than this is not a gradient
const PAD = 0.15;
const MAX_MARKS = 11;
const DIM = '#595959';
// ────────────────────────────────────────────────────────────────────────────

function normalise(spec = {}) {
  const marks = typeof spec.marks === 'number' && spec.marks > 0 ? Math.min(Math.round(spec.marks), MAX_MARKS) : 0;
  return {
    left: spec.left != null ? String(spec.left) : 'Disagree',
    right: spec.right != null ? String(spec.right) : 'Agree',
    middle: spec.middle != null && String(spec.middle).trim() ? String(spec.middle) : '',
    question: spec.question != null && String(spec.question).trim() ? String(spec.question) : '',
    marks,
  };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  const W = profile.widthPt;
  const bold = profile.bold;

  const attempt = (pt) => {
    const inner = W - 2 * PAD * pt;
    if (inner < MIN_LINE_W * pt) {
      return new Error(`CONTINUUM_TOO_NARROW: the line needs at least ${((MIN_LINE_W * profile.minFontPt) / 72).toFixed(1)}in across at the ${profile.minFontPt}pt readable size. Give it a wider space.`);
    }
    const anchorW = inner * ANCHOR_SHARE;
    const wrapOrError = (text, width, what, b) => {
      const lines = T.wrap(text, pt, width, b);
      if (!lines) {
        return new Error(
          `CONTINUUM_LABEL_TOO_WIDE: the word "${T.longestWord(text, pt, b)}" in ${what} "${text}" is wider than the ${(width / 72).toFixed(2)}in its label ` +
            `can take at the ${profile.minFontPt}pt readable size. Give the line a wider space or use a shorter word; nothing was shrunk further.`
        );
      }
      return lines;
    };
    const left = wrapOrError(n.left, anchorW, 'the left label', true);
    if (left instanceof Error) return left;
    const right = wrapOrError(n.right, anchorW, 'the right label', true);
    if (right instanceof Error) return right;
    const middle = n.middle ? wrapOrError(n.middle, inner * MIDDLE_SHARE, 'the middle label', false) : [];
    if (middle instanceof Error) return middle;
    const question = n.question ? wrapOrError(n.question, inner, 'the question', true) : [];
    if (question instanceof Error) return question;
    const questionH = question.length ? T.blockHeight(question.length, pt) + QUESTION_GAP * pt : 0;
    const anchorH = T.blockHeight(Math.max(left.length, right.length), pt);
    const middleH = middle.length ? ANCHOR_GAP * pt + T.blockHeight(middle.length, pt) : 0;
    const lineY = PAD * pt + questionH + (END_CAP_H / 2) * pt;
    const labelTop = lineY + (END_CAP_H / 2 + ANCHOR_GAP) * pt;
    const h = labelTop + anchorH + middleH + PAD * pt;
    if (profile.heightPt && h > profile.heightPt + 0.5) {
      return new Error(
        `CONTINUUM_ZONE_TOO_SHALLOW: the line and its labels need ${(h / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${(profile.heightPt / 72).toFixed(2)}in. ` +
          'Give it more height, or shorten the labels or the question.'
      );
    }
    return { pt, inner, left, right, middle, question, lineY, labelTop, anchorH, h };
  };
  const L = T.settle(profile, attempt);
  const x1 = PAD * L.pt;
  const x2 = W - PAD * L.pt;
  return { ...L, n, profile, W, x1, x2 };
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile, x1, x2, lineY, n } = L;
  const c = profile.colours;
  const font = profile.font;
  const f = T.f2;
  const parts = [];
  const rect = (x, y, w, h) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${c.ink}"/>`;

  if (L.question.length) parts.push(T.textLines(L.question, L.W / 2, PAD * pt, pt, { fill: c.ink, font, bold: true }));
  parts.push(rect(x1, lineY - (LINE_THICK * pt) / 2, x2 - x1, LINE_THICK * pt));
  parts.push(rect(x1, lineY - (END_CAP_H * pt) / 2, END_CAP_W * pt, END_CAP_H * pt));
  parts.push(rect(x2 - END_CAP_W * pt, lineY - (END_CAP_H * pt) / 2, END_CAP_W * pt, END_CAP_H * pt));
  if (n.marks > 0) {
    const spacing = (x2 - x1) / (n.marks + 1);
    for (let i = 1; i <= n.marks; i++) {
      parts.push(rect(x1 + i * spacing - (TICK_W * pt) / 2, lineY - (TICK_H * pt) / 2, TICK_W * pt, TICK_H * pt));
    }
  }
  // End labels sit flush to the ends so they never hang off the drawing: the
  // left one reads from under the line's left end, the right one ends under
  // its right end.
  parts.push(T.textLines(L.left, x1, L.labelTop, pt, { fill: c.ink, font, bold: true, anchor: 'start' }));
  parts.push(T.textLines(L.right, x2, L.labelTop, pt, { fill: c.ink, font, bold: true, anchor: 'end' }));
  if (L.middle.length) {
    const dim = profile.palette === 'ink' ? c.ink : DIM;
    parts.push(T.textLines(L.middle, L.W / 2, L.labelTop + L.anchorH + 0.3 * pt, pt, { fill: dim, font, bold: false, italic: true }));
  }
  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `continuum-line:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, MAX_MARKS };
