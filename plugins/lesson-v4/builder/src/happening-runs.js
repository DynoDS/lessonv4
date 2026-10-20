'use strict';

// A slide that shows a sum's exchange happening becomes one slide per moment.
//
// The designer writes ONE slide holding an `exchange-happening` item with no
// `step` (shared/visuals/exchange-happening-svg.js). Here, before anything else
// sees the deck, it becomes a run of slides, one per moment the drawing works
// out from the numbers: here is 52, a ten moves into the ones, it breaks into
// ten ones, take away the ones, take away the tens. Every copy is the same slide
// with that item's `step` set, so the title, the criteria and everything else
// stand still and only the pieces and the sum change. The copies after the
// first are marked for PowerPoint's Morph transition (src/morph-transitions.js),
// which is what makes the teacher's click move the pieces rather than swap the
// picture (the teacher, 18 October 2026, of the hand-made test deck: "it works
// great").
//
// A bar model built up one box per click runs the same way: a `bar-model` of
// shape `whole-parts` carrying `build` ("explain" or "teacher") becomes one
// slide per box, the whole first, then each part (shared/visuals/bar-model-svg.js
// `buildSteps`). The teacher, 19 October 2026: "one part appears and then the
// next part and then the next part".
//
// The deck now has more slides than lesson.json, so every slide number the build
// reports is turned back into the lesson.json slide it came from (`sourceOf`),
// and the designer's tools, which edit lesson.json by number, keep meaning the
// same slide.

const happening = require('../../shared/visuals/exchange-happening-svg');
const barModel = require('../../shared/visuals/bar-model-svg');

const TYPE = 'exchange-happening';

// Every kind of drawing that becomes a run: whether a node is one, its moments,
// and a key naming what it shows so neighbouring slides of one run can Morph.
const RUNS = [
  {
    is: (node) => node.type === TYPE,
    stepsFor: (node) => happening.stepsFor(node),
    key: (node) => {
      const c = happening.normalise(node);
      return `${c.operator}${c.top}:${c.bottom}:${c.pieces}`;
    },
  },
  {
    is: (node) => node.type === 'bar-model' && barModel.shapeOf(node) === 'whole-parts' && !!barModel.buildMode(node),
    stepsFor: (node) => barModel.buildSteps(node),
    key: (node) => `bar:${JSON.stringify([node.whole || {}, node.parts || []])}`,
  },
];

function runOf(node) {
  if (!isObj(node)) return null;
  try {
    return RUNS.find((r) => r.is(node)) || null;
  } catch (err) {
    return null;
  }
}

function unstepped(node) {
  return node.step == null || node.step === '';
}

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

// Every unstepped happening item on a slide, wherever it sits.
function findItems(node, out = []) {
  if (Array.isArray(node)) {
    node.forEach((n) => findItems(n, out));
  } else if (isObj(node)) {
    if (runOf(node) && unstepped(node)) out.push(node);
    Object.keys(node).forEach((k) => { if (k !== 'speakerNotes') findItems(node[k], out); });
  }
  return out;
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function setStep(node, step) {
  if (Array.isArray(node)) node.forEach((n) => setStep(n, step));
  else if (isObj(node)) {
    if (runOf(node) && unstepped(node)) node.step = step;
    Object.keys(node).forEach((k) => setStep(node[k], step));
  }
}

// A run is not half of a question/answer pair. Its question card only ever
// shows the question, so every click sizes it for the question alone and it
// keeps one size from the first click to the last (the teacher, 19 October
// 2026: "the question card doesn't need an answer"). Kept on the last click,
// the pair sized that one card for the answer too, and it shrank there. The
// pair's other half, on the answers slide, is let go with it and sizes alone.
function dropRevealPairs(node, ids) {
  if (Array.isArray(node)) node.forEach((n) => dropRevealPairs(n, ids));
  else if (isObj(node)) {
    if (isObj(node.revealPair) && (!ids || ids.has(node.revealPair.id))) {
      if (ids === null) runPairIds.add(node.revealPair.id);
      delete node.revealPair;
    }
    Object.keys(node).forEach((k) => dropRevealPairs(node[k], ids));
  }
}

let runPairIds = new Set();

// Returns { lesson, sourceOf, morph, notes }:
//   sourceOf[i]  the lesson.json slide number (1-based) built slide i+1 came from
//   stepOf[i]    the moment it shows, or null for an ordinary slide
//   morph        the built slide numbers that open with the Morph transition
//   notes        plain lines for the build report
// The sum a slide shows happening, as one key, so two neighbouring slides that
// show the same sum can be told apart from two that do not.
function sumKey(slide) {
  const all = [];
  (function walk(node) {
    if (Array.isArray(node)) node.forEach(walk);
    else if (isObj(node)) {
      if (runOf(node)) all.push(node);
      Object.keys(node).forEach((k) => { if (k !== 'speakerNotes') walk(node[k]); });
    }
  })(slide);
  if (!all.length) return null;
  try {
    return runOf(all[0]).key(all[0]);
  } catch (err) {
    return null;
  }
}

function expandHappenings(lesson) {
  runPairIds = new Set();
  const result = { lesson, sourceOf: [], stepOf: [], morph: [], notes: [] };
  if (!isObj(lesson) || !Array.isArray(lesson.slides)) return result;
  const slides = [];
  lesson.slides.forEach((slide, i) => {
    const items = findItems(slide);
    if (!items.length) {
      slides.push(slide);
      result.sourceOf.push(i + 1);
      result.stepOf.push(null);
      return;
    }
    // One run per slide: every happening item on it shares the first one's
    // moments (two different sums on one slide cannot click together).
    let steps;
    try {
      steps = runOf(items[0]).stepsFor(items[0]);
    } catch (err) {
      // Left as one slide; the drawing names the fault when it is drawn.
      slides.push(slide);
      result.sourceOf.push(i + 1);
      result.stepOf.push(null);
      return;
    }
    if (items.length > 1) {
      result.notes.push(`slide ${i + 1}: only one drawing is clicked through per slide; the others show their finished state.`);
    }
    // `"steps": [3, 5]` runs part of the method: a lesson that has done the ones
    // already and now works the tens starts its run where the ones finished.
    const range = Array.isArray(items[0].steps) ? items[0].steps.map(Number) : null;
    const first = range && Number.isInteger(range[0]) ? Math.max(0, range[0]) : 0;
    const last = range && Number.isInteger(range[1]) ? Math.min(steps.length - 1, range[1]) : steps.length - 1;
    const run = steps.map((step, k) => ({ step, k })).filter(({ k }) => k >= first && k <= last);
    run.forEach(({ step, k }, j) => {
      const copy = clone(slide);
      // The others on the slide are drawn finished; the first one runs.
      const mine = findItems(copy);
      mine.slice(1).forEach((n) => { n.step = 'end'; });
      mine[0].step = k;
      delete mine[0].steps;
      setStep(copy, 'end');
      dropRevealPairs(copy, null);
      if (j > 0) {
        // The script stays on the first slide; each later click says what it shows.
        copy.speakerNotes = `Click: ${step.sentence}`;
      }
      slides.push(copy);
      result.sourceOf.push(i + 1);
      result.stepOf.push(k);
    });
  });
  if (runPairIds.size) {
    slides.forEach((slide, i) => {
      if (result.stepOf[i] == null && JSON.stringify(slide).includes('"revealPair"')) {
        slides[i] = clone(slide);
        dropRevealPairs(slides[i], runPairIds);
      }
    });
  }
  // A slide showing the same sum as the slide before it opens with Morph: the
  // clicks of a run, and an answers slide drawn at the run's end straight after
  // it, whose pieces then stand still while its answer appears.
  slides.forEach((slide, i) => {
    if (i > 0) {
      const key = sumKey(slide);
      if (key && key === sumKey(slides[i - 1])) result.morph.push(i + 1);
    }
  });
  if (slides.length !== lesson.slides.length) result.lesson = Object.assign({}, lesson, { slides });
  return result;
}

module.exports = { expandHappenings, TYPE };
