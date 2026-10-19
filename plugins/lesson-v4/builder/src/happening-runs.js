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
// The deck now has more slides than lesson.json, so every slide number the build
// reports is turned back into the lesson.json slide it came from (`sourceOf`),
// and the designer's tools, which edit lesson.json by number, keep meaning the
// same slide.

const happening = require('../../shared/visuals/exchange-happening-svg');

const TYPE = 'exchange-happening';

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

// Every unstepped happening item on a slide, wherever it sits.
function findItems(node, out = []) {
  if (Array.isArray(node)) {
    node.forEach((n) => findItems(n, out));
  } else if (isObj(node)) {
    if (node.type === TYPE && (node.step == null || node.step === '')) out.push(node);
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
    if (node.type === TYPE && (node.step == null || node.step === '')) node.step = step;
    Object.keys(node).forEach((k) => setStep(node[k], step));
  }
}

function dropRevealPairs(node) {
  if (Array.isArray(node)) node.forEach(dropRevealPairs);
  else if (isObj(node)) {
    delete node.revealPair;
    Object.keys(node).forEach((k) => dropRevealPairs(node[k]));
  }
}

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
      if (node.type === TYPE) all.push(node);
      Object.keys(node).forEach((k) => { if (k !== 'speakerNotes') walk(node[k]); });
    }
  })(slide);
  if (!all.length) return null;
  try {
    const c = happening.normalise(all[0]);
    return `${c.operator}${c.top}:${c.bottom}:${c.pieces}`;
  } catch (err) {
    return null;
  }
}

function expandHappenings(lesson) {
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
      steps = happening.stepsFor(items[0]);
    } catch (err) {
      // Left as one slide; the drawing names the fault when it is drawn.
      slides.push(slide);
      result.sourceOf.push(i + 1);
      result.stepOf.push(null);
      return;
    }
    if (items.length > 1) {
      result.notes.push(`slide ${i + 1}: only one sum shown happening is clicked through per slide; the others show their finished state.`);
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
      // A reveal pair links this slide to an answers slide by one question and
      // one answer. The run is its own reveal, so the pair is kept on the last
      // copy only, where it still lines up with its answers slide.
      if (j < run.length - 1) dropRevealPairs(copy);
      if (j > 0) {
        // The script stays on the first slide; each later click says what it shows.
        copy.speakerNotes = `Click: ${step.sentence}`;
      }
      slides.push(copy);
      result.sourceOf.push(i + 1);
      result.stepOf.push(k);
    });
  });
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
