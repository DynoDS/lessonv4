'use strict';

// Where each drawn figure sits on its slide, kept for the placement check.
//
// The decorator's clear space is measured from the rendered page by its ink,
// and that measurement forgives pale fills and thin lines on purpose, because
// that is what a card is made of and a drawing may sit on a card. A chart's
// gridlines are thin lines and a shape's inside is a pale fill, so both were
// forgiven by the same rule: the page offered the inside of an empty bar chart
// as a clear place, and a ladybird went on the line where the teacher draws a
// bar (six of twenty lessons, 7 October 2026). Only the builder knows which
// pale box is a card and which is the figure the lesson is about, so it says
// so here, and the deck itself is left exactly as it was.
//
// A labelled photograph is left out. Its photograph and its labels are ink and
// are protected as ink; the gaps between them are open, on the teacher's own
// ruling over a moon beside a labelled Earth ("its not interfering and its
// relevant", 8 October 2026).

const { recording } = require('../warnings');
const { isDrawing } = require('./reveal-pair');

const OPEN_BETWEEN_ITS_PARTS = new Set(['image', 'label-diagram']);
const DRAWS = ['addImage', 'addShape', 'addText', 'addTable'];

let boxes = [];

function isFigure(type) {
  return !OPEN_BETWEEN_ITS_PARTS.has(type) && isDrawing({ type });
}

function placed(method, args) {
  const options = method === 'addImage' ? args[0] : args[1];
  if (!options || typeof options !== 'object') return null;
  const { x, y, w, h } = options;
  if (![x, y, w, h].every((value) => typeof value === 'number' && Number.isFinite(value))) return null;
  return { x0: x, y0: y, x1: x + w, y1: y + h };
}

// Hands the helper a slide that notes where everything it draws lands. `done`
// keeps the one box that holds all of it, and only for a real drawing: the
// preflight and the stack's unseen tries draw every figure too.
function watchFigure(slide, type, ctx) {
  if (!isFigure(type) || !slide || typeof slide !== 'object') return { slide, done() {} };
  let hull = null;
  const watched = new Proxy(slide, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      if (!DRAWS.includes(property)) return value.bind(target);
      return function (...args) {
        const box = placed(property, args);
        if (box) {
          hull = hull
            ? {
                x0: Math.min(hull.x0, box.x0), y0: Math.min(hull.y0, box.y0),
                x1: Math.max(hull.x1, box.x1), y1: Math.max(hull.y1, box.y1)
              }
            : box;
        }
        const result = value.apply(target, args);
        return result === target ? watched : result;
      };
    },
    set(target, property, value) {
      return Reflect.set(target, property, value, target);
    }
  });
  return {
    slide: watched,
    done() {
      if (!hull || !recording()) return;
      if (!ctx || !Number.isInteger(ctx.slideIndex)) return;
      const round = (value) => Math.round(value * 1000) / 1000;
      boxes.push({
        slide: ctx.slideIndex + 1,
        type,
        x: round(hull.x0), y: round(hull.y0),
        w: round(hull.x1 - hull.x0), h: round(hull.y1 - hull.y0)
      });
    }
  };
}

// The blank after a sum left open is where the teacher writes the answer.
//
// "2,347 + 126 =" sits in a wide card with nothing after the equals sign, and
// by ink that is the clearest place on the slide: twelve of a column addition
// deck's drawings went there, and the teacher moved every one, because
// "although they werent touching any text, they were touching or in the space
// of where if I wrote on the board I would have wrote the answer" (8 October
// 2026). What is kept is the card from the open sum's line down, since the
// answer runs on from the sum or goes under it. The card above that line stays
// open: the teacher rested the same drawings on the top corner of those cards.
// A question that ends in a question mark is answered aloud or somewhere else
// on the slide, so its card stays open too.
function leavesASumOpen(text) {
  return /=\s*$/.test(String(text == null ? '' : text));
}

// `lines` are the card's lines or rows from the top, as written. The share of
// the card above the first open one is left out, which is generous when an
// earlier line wraps, and that errs towards keeping the writing space.
function noteAnswerSpace(ctx, box, lines) {
  if (!recording() || !ctx || !Number.isInteger(ctx.slideIndex) || !box) return;
  const list = Array.isArray(lines) ? lines : [];
  const first = list.findIndex(leavesASumOpen);
  if (first < 0) return;
  const { x, w } = box;
  const y = box.y + box.h * (first / list.length);
  const h = box.h * ((list.length - first) / list.length);
  if (![x, y, w, h].every((value) => typeof value === 'number' && Number.isFinite(value))) return;
  const round = (value) => Math.round(value * 1000) / 1000;
  boxes.push({ slide: ctx.slideIndex + 1, type: 'answer-space', whole: true, x: round(x), y: round(y), w: round(w), h: round(h) });
}

function figureBoxes() {
  return boxes.slice();
}

function clearFigureBoxes() {
  boxes = [];
}

module.exports = { watchFigure, figureBoxes, clearFigureBoxes, isFigure, leavesASumOpen, noteAnswerSpace };
